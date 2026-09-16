/**
 * ============================================================
 * PACTO — GRIMÓRIO AFTY
 * ============================================================
 * Sessão de texto livre na ficha, aberta pela primitiva `pacto` (ver
 * `PRIMITIVAS` em afty-addons.js). Um Pacto tem nome, descrição e duas listas:
 *
 *   • Malefícios: texto livre + efeito OPCIONAL (mesmo editor da Ferramenta
 *     Amaldiçoada — canal, alvo, expr). Limitado a `MALEFICIOS_MAXIMO` (4),
 *     pedido do autor.
 *   • Benefícios: mesma forma, mas a QUANTIDADE é travada: só existe 1 vaga de
 *     Benefício a cada 2 Malefícios anotados (`beneficiosLiberados`) — com 4
 *     Malefícios no máximo, o teto natural são 2 Benefícios.
 *
 * ⚠ NUNCA ENTRA EM POOL EXCLUSIVO. Os efeitos aqui não carregam `exclusivo`,
 * então `aplicarEfeitos` (afty-efeitos.js) os soma direto em `porCanal`/
 * `porAlvo` — a mesma regra de qualquer efeito comum de Origem ou Treino. É
 * isso que faz o Pacto "acumular com qualquer fonte": ele nunca disputa o
 * "vale o maior" de canais como `defesaAtributo`, só soma por cima.
 *
 * ⚠ `efeitosDePacto` entra no MESMO estágio que `efeitosDeTreino` e
 * `coletarEfeitosOrigem` (o `efeitosMontante` de afty-derive.js), porque um
 * Malefício pode escrever em canais lidos cedo (`pe`, `hp`) e a criatura
 * nasceu pedindo "todo e qualquer uso de Focos... aumentado em +1" — nível de
 * generalidade de Origem, não de efeito tardio.
 */

let _uidCounter = 0;
const novoId = () => `pacto_${Date.now().toString(36)}_${(_uidCounter++).toString(36)}`;

/** Teto de Malefícios por Pacto, pedido do autor em 2026-09-16. */
export const MALEFICIOS_MAXIMO = 4;

/** Uma entrada em branco (Malefício ou Benefício — mesma forma para os dois). */
export function createBlankPactoItem() {
  return { id: novoId(), texto: "", efeitos: [] };
}

/** O Pacto em branco. */
export function createBlankPacto() {
  return { nome: "", descricao: "", maleficios: [], beneficios: [] };
}

/** Sanitiza uma lista crua (Malefícios ou Benefícios) vinda da ficha. */
function sanitizarLista(lista) {
  if (!Array.isArray(lista)) return [];
  return lista
    .filter((item) => item && typeof item === "object")
    .map((item) => ({
      id: typeof item.id === "string" && item.id ? item.id : novoId(),
      texto: typeof item.texto === "string" ? item.texto : "",
      efeitos: Array.isArray(item.efeitos)
        ? item.efeitos.filter((e) => e && typeof e === "object" && typeof e.canal === "string")
        : [],
    }));
}

/** Normaliza `creature.pacto` na leitura, sem gravar nada. */
export function pactoDaFicha(creature) {
  const p = creature?.pacto;
  if (!p || typeof p !== "object") return createBlankPacto();
  return {
    nome: typeof p.nome === "string" ? p.nome : "",
    descricao: typeof p.descricao === "string" ? p.descricao : "",
    maleficios: sanitizarLista(p.maleficios),
    beneficios: sanitizarLista(p.beneficios),
  };
}

/**
 * Quantas vagas de Benefício o Pacto liberou até agora: 1 a cada 2 Malefícios
 * anotados (arredondado para baixo — o texto do autor é literal: "a cada 2
 * malefícios cria uma parte igual em Benefício"). Conta no máximo
 * `MALEFICIOS_MAXIMO`, então o teto de vagas é 2.
 */
export function beneficiosLiberados(pacto) {
  const qtdMaleficios = Array.isArray(pacto?.maleficios)
    ? Math.min(pacto.maleficios.length, MALEFICIOS_MAXIMO)
    : 0;
  return Math.floor(qtdMaleficios / 2);
}

/**
 * Os efeitos ativos do Pacto, já no vocabulário do Motor (`{ canal, alvo?,
 * expr, origem, nome }`), prontos para entrar no `efeitosMontante` do derive.
 *
 * ⚠ OS DOIS LADOS SÃO CORTADOS, mesmo que a ficha tenha mais entradas gravadas
 * (uma ficha antiga de antes do teto, por exemplo): o texto continua na tela
 * para a pessoa reorganizar, mas só os primeiros `MALEFICIOS_MAXIMO`
 * Malefícios e os primeiros `beneficiosLiberados(pacto)` Benefícios valem em
 * número.
 */
export function efeitosDePacto(creature) {
  const pacto = pactoDaFicha(creature);
  const nomeBase = pacto.nome?.trim() || "Pacto";
  const out = [];
  const add = (item, prefixo) => {
    const rotuloTexto = item.texto?.trim()?.slice(0, 40) || "sem texto";
    const nome = `${nomeBase} (${prefixo}: ${rotuloTexto}${item.texto?.trim()?.length > 40 ? "…" : ""})`;
    for (const ef of item.efeitos) {
      if (!ef?.canal || !ef?.expr) continue;
      out.push({ canal: ef.canal, expr: ef.expr, ...(ef.alvo ? { alvo: ef.alvo } : {}), origem: "pacto", nome });
    }
  };
  for (const maleficio of pacto.maleficios.slice(0, MALEFICIOS_MAXIMO)) add(maleficio, "Malefício");
  const vagas = beneficiosLiberados(pacto);
  for (const beneficio of pacto.beneficios.slice(0, vagas)) add(beneficio, "Benefício");
  return out;
}

/**
 * O Pacto PRONTO que um addon instalado oferece (`pactoPadrao`, ver
 * `normalizarPacote` em afty-addons.js), pronto pra um botão copiar pra dentro
 * de `creature.pacto` — mesmo espírito dos Modelos de Feitiço
 * (`feiticosDeAddon`): o pacote é biblioteca, não concessão automática. Devolve
 * só o PRIMEIRO addon que oferece um, porque a tela mostra um Pacto por vez.
 */
export function pactoPadraoDeAddon(creature) {
  const lista = Array.isArray(creature?.addons) ? creature.addons : [];
  for (const pacote of lista) {
    if (pacote?.pactoPadrao && typeof pacote.pactoPadrao === "object") {
      return { addonId: pacote.id, addonNome: pacote.nome || pacote.id, pacto: pacote.pactoPadrao };
    }
  }
  return null;
}
