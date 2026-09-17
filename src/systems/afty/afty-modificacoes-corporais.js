/**
 * ============================================================
 * MODIFICAÇÕES CORPORAIS — GRIMÓRIO AFTY
 * ============================================================
 * Aba própria ao lado de Habilidades, aberta pela primitiva
 * `modificacoesCorporais` (ver `PRIMITIVAS` em afty-addons.js). Mesmo espírito
 * do Perfil Amaldiçoado (afty-derive.js / AftyCreatureBuilder.jsx), só que
 * reflavorado e mais simples:
 *
 *   • Base da Modificação: descrição livre + efeito OPCIONAL no Motor, sempre
 *     ativa (equivalente ao Funcionamento Básico).
 *   • Enxertos: lista de texto livre + efeito OPCIONAL, cada um (equivalente
 *     aos Feitiços, sem o motor de Dano/Cura/Auxiliar/Passivo/Personalizado:
 *     aqui é só canal/alvo/expr, como o resto desta família de sessões
 *     simples — ver afty-pacto.js).
 *
 * ⚠ O ORÇAMENTO É DIGITADO, e não fórmula: `limite` é um número que a pessoa
 * escreve na ficha (mesmo padrão de `focosLivres`, Focos de Interlúdio na
 * ficha de jogador). Sem fórmula ligada ao ND/BT, de propósito (pedido do
 * autor, 2026-09-17).
 *
 * ⚠ NUNCA ENTRA EM POOL EXCLUSIVO. Os efeitos aqui não carregam `exclusivo`,
 * então somam por cima de Habilidade, Origem ou qualquer outra fonte — é a
 * regra do autor ("capaz de acumular com Habilidades").
 *
 * ⚠ `efeitosDeModificacoesCorporais` entra no MESMO estágio que
 * `efeitosDePacto` e `coletarEfeitosOrigem` (o `efeitosMontante` de
 * afty-derive.js), pela mesma razão: um Enxerto pode escrever em canal cedo
 * (`pe`, `hp`) e não há por que um Enxerto valer menos que uma Origem.
 */

let _uidCounter = 0;
const novoId = () => `modcorp_${Date.now().toString(36)}_${(_uidCounter++).toString(36)}`;

/** Um Enxerto em branco. */
export function createBlankEnxerto() {
  return { id: novoId(), texto: "", efeitos: [] };
}

/** Modificações Corporais em branco. */
export function createBlankModificacoesCorporais() {
  return { descricao: "", efeitosBase: [], limite: 0, enxertos: [] };
}

/** Sanitiza a lista de Enxertos vinda da ficha. */
function sanitizarEnxertos(lista) {
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

/** Normaliza `creature.modificacoesCorporais` na leitura, sem gravar nada. */
export function modificacoesCorporaisDaFicha(creature) {
  const m = creature?.modificacoesCorporais;
  if (!m || typeof m !== "object") return createBlankModificacoesCorporais();
  return {
    descricao: typeof m.descricao === "string" ? m.descricao : "",
    efeitosBase: Array.isArray(m.efeitosBase)
      ? m.efeitosBase.filter((e) => e && typeof e === "object" && typeof e.canal === "string")
      : [],
    limite: Math.max(0, Math.trunc(Number(m.limite) || 0)),
    enxertos: sanitizarEnxertos(m.enxertos),
  };
}

/**
 * Os efeitos ativos de Modificações Corporais, já no vocabulário do Motor
 * (`{ canal, alvo?, expr, origem, nome }`), prontos para entrar no
 * `efeitosMontante` do derive.
 *
 * ⚠ OS ENXERTOS SÃO CORTADOS no `limite`, mesmo que a ficha tenha mais
 * entradas gravadas (a pessoa baixou o número depois de criar mais Enxertos,
 * por exemplo): o texto continua na tela para reorganizar, mas só os
 * primeiros `limite` valem em número.
 */
export function efeitosDeModificacoesCorporais(creature) {
  const m = modificacoesCorporaisDaFicha(creature);
  const out = [];
  for (const ef of m.efeitosBase) {
    if (!ef?.canal || !ef?.expr) continue;
    out.push({
      canal: ef.canal, expr: ef.expr, ...(ef.alvo ? { alvo: ef.alvo } : {}),
      origem: "modificacoesCorporais", nome: "Base da Modificação",
    });
  }
  for (const enxerto of m.enxertos.slice(0, m.limite)) {
    const rotuloTexto = enxerto.texto?.trim()?.slice(0, 40) || "sem texto";
    const nome = `Enxerto: ${rotuloTexto}${enxerto.texto?.trim()?.length > 40 ? "…" : ""}`;
    for (const ef of enxerto.efeitos) {
      if (!ef?.canal || !ef?.expr) continue;
      out.push({ canal: ef.canal, expr: ef.expr, ...(ef.alvo ? { alvo: ef.alvo } : {}), origem: "modificacoesCorporais", nome });
    }
  }
  return out;
}
