/**
 * ============================================================
 * A LISTA DE ADDONS: itens, categoria, resumo e o que cada um muda
 * ============================================================
 * Nasceu em 2026-10-29, a pedido do autor: a aba de Addons ficou difícil de
 * navegar com dezenas de pacotes, e só o título não lembra o que cada um faz.
 * Decisões, por pergunta com opções: lista lateral com painel de detalhe (a
 * `ListaLateral` de Feitiços e Invocações), campos novos `resumo` e `categoria`
 * em cada pacote, e nenhum campo de mesa.
 *
 * Esta é a metade SEM TELA, para ter assert. A tela é `AftyTabAddons.jsx`.
 *
 * ⚠ MÓDULO FOLHA, sem import nenhum: a aba entra cedo no criador. Os rótulos de
 * liberação, primitiva e família chegam por argumento, de quem já os importa.
 *
 * ⚠ TEXTO DE TELA: o resumo é dado do próprio pacote, escrito em frase simples com
 * o fato e o número, sem travessão nem ponto e vírgula. Quem escreve um pacote novo
 * pode omitir os dois campos: o motivo de existir o recurso automático abaixo.
 * ============================================================
 */

/** As categorias, na ordem em que os grupos aparecem. `curto` é o rótulo do chip de filtro. */
export const CATEGORIAS_DE_ADDON = Object.freeze([
  { value: "regras", label: "Regras da Mesa", curto: "Regras" },
  { value: "origens", label: "Origens e Clãs", curto: "Origens" },
  { value: "treinos", label: "Treinos", curto: "Treinos" },
  { value: "talentos", label: "Talentos e Habilidades", curto: "Talentos" },
  { value: "equipamentos", label: "Equipamentos e Armas", curto: "Equip." },
  { value: "tecnicas", label: "Técnicas e Feitiços", curto: "Técnicas" },
  { value: "ferramentas", label: "Abas e Ferramentas", curto: "Abas" },
  { value: "outros", label: "Outros", curto: "Outros" },
]);

const VALIDAS = new Set(CATEGORIAS_DE_ADDON.map((c) => c.value));

/** O teto de tamanho do resumo, para a linha da lista caber em duas linhas. */
export const RESUMO_MAX = 160;

const semAcento = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const lista = (x) => (Array.isArray(x) ? x : []);
const tem = (p, familia) => lista(p?.acrescenta?.[familia]).length > 0;

/**
 * A categoria do pacote. Vale a declarada, se for uma das conhecidas. Sem ela, sai do
 * que o pacote acrescenta: um pacote de fora, sem o campo, ainda cai num grupo útil.
 */
export function categoriaDe(p) {
  const dita = String(p?.categoria ?? "").trim();
  if (VALIDAS.has(dita)) return dita;
  if (tem(p, "origens") || tem(p, "clas")) return "origens";
  if (tem(p, "treinamentos")) return "treinos";
  if (["talentos", "aptidoes", "habilidades", "lendarias", "apices", "especializacoes", "opcoesTalento"].some((f) => tem(p, f))) return "talentos";
  if (["armas", "escudos", "uniformes"].some((f) => tem(p, f))) return "equipamentos";
  if (lista(p?.feiticos).length || lista(p?.estilos).length) return "tecnicas";
  if (lista(p?.permite).length) return "ferramentas";
  if (p?.regrasAfty && Object.keys(p.regrasAfty).length) return "regras";
  return "outros";
}

/**
 * O resumo de uma linha. Vale o declarado. Sem ele, a primeira frase da descrição, cortada
 * na palavra e fechada com reticências, ou vazio quando não há descrição nenhuma.
 */
export function resumoDe(p) {
  const dito = String(p?.resumo ?? "").trim();
  if (dito) return dito.length > RESUMO_MAX ? corta(dito, RESUMO_MAX) : dito;
  const descricao = String(p?.descricao ?? "").trim().replace(/\s+/g, " ");
  if (!descricao) return "";
  const fim = descricao.search(/[.!?](\s|$)/);
  const frase = fim > 0 ? descricao.slice(0, fim + 1) : descricao;
  return frase.length > 110 ? corta(frase, 110) : frase;
}

function corta(texto, max) {
  const base = texto.slice(0, max - 1);
  const espaco = base.lastIndexOf(" ");
  return (espaco > max * 0.6 ? base.slice(0, espaco) : base).replace(/[\s,.;:]+$/, "") + "…";
}

/**
 * Os filtros extras da lista, ao lado dos de categoria. `aplica` recebe o item.
 * "Ligados" é o que esta ficha usa. "Aviso" é o que pede atenção.
 */
export const FILTROS_DE_ADDON = Object.freeze([
  { id: "ligados", rotulo: "Ligados Nesta Ficha", curto: "Ligados", aplica: (i) => i.ligado },
  { id: "aviso", rotulo: "Com Aviso", curto: "Aviso", aplica: (i) => i.avisos.length > 0 },
]);

/**
 * Monta os itens da lista a partir das três fontes de pacote.
 *
 *   biblioteca   pacotes instalados nesta máquina
 *   naFicha      as cópias que a ficha carrega
 *   embutidos    as fontes que viajam dentro do app
 *   estadoDe     `{ [id]: { estado, versaoBiblioteca } }` de `compararComBiblioteca`
 *   avisosDe     `{ [id]: [texto] }`, os avisos que a ficha já tem de cada pacote
 *   barradoDe    `(pacote) => [nomes]`, quem impede de ligar este pacote
 *
 * Cada id aparece UMA vez. O embutido vence a biblioteca, que vence a cópia da ficha,
 * porque a fonte do app é a verdade de um pacote embutido.
 */
export function montarItens({ biblioteca = [], naFicha = [], embutidos = [], estadoDe = {}, avisosDe = {}, barradoDe = () => [] } = {}) {
  const porId = new Map();
  const naFichaPorId = new Map(lista(naFicha).map((p) => [p.id, p]));
  const idsDaBiblioteca = new Set(lista(biblioteca).map((p) => p.id));
  const ordem = [];
  const entrar = (pacote, origem) => {
    if (!pacote?.id || porId.has(pacote.id)) return;
    ordem.push(pacote.id);
    porId.set(pacote.id, { pacote, origem });
  };
  for (const p of lista(embutidos)) entrar(p, "embutido");
  for (const p of lista(biblioteca)) entrar(p, "biblioteca");
  for (const p of lista(naFicha)) entrar(p, "ficha");

  return ordem.map((id) => {
    const { pacote, origem } = porId.get(id);
    const copia = naFichaPorId.get(id) ?? null;
    const ligado = !!copia;
    const estado = estadoDe[id]?.estado ?? null;
    const avisos = [...(avisosDe[id] ?? [])];
    const barrado = ligado ? [] : barradoDe(pacote);
    if (barrado.length) avisos.push(`Não liga junto com ${barrado.join(" e ")}.`);
    if (estado === "desatualizado" && !copia?.composicao) avisos.push(`A biblioteca tem a versão ${estadoDe[id].versaoBiblioteca}.`);
    return {
      id,
      nome: pacote.nome || id,
      versao: pacote.versao,
      autor: pacote.autor ?? "",
      tipo: categoriaDe(pacote),
      nivel: 0,
      resumo: resumoDe(pacote),
      /* O resumo que o pacote DECLAROU. Sem ele o resumo é a primeira frase da descrição, e
         mostrá-lo no painel repetiria a descrição logo abaixo. */
      resumoDeclarado: String(pacote?.resumo ?? "").trim() !== "",
      ligado,
      embutido: origem === "embutido",
      naBiblioteca: idsDaBiblioteca.has(id),
      foraDaBiblioteca: origem === "ficha",
      estado,
      barrado,
      avisos,
      pacote,
      copia,
    };
  });
}

/**
 * O texto que a busca varre: nome, resumo, categoria, autor, o nome de cada entrada que o
 * pacote acrescenta e a descrição inteira. Procurar "Zodíaco" acha o H Corp, que é onde ele
 * mora, e uma palavra que só a descrição tem também acha o pacote.
 */
export function textoDeBuscaDoAddon(item) {
  const p = item.pacote ?? {};
  const rotulo = CATEGORIAS_DE_ADDON.find((c) => c.value === item.tipo)?.label ?? "";
  const nomes = Object.values(p.acrescenta ?? {}).flatMap((l) => lista(l).map((e) => e?.nome)).filter(Boolean);
  return [item.nome, item.resumo, rotulo, item.autor, ...nomes, p.descricao ?? ""].join(" ");
}

const CONECTIVOS = new Set(["de", "do", "da", "dos", "das", "no", "na", "nos", "nas", "e", "em", "para"]);
const INVARIAVEIS = new Set(["Ápice"]);

/** "len_versatilidade_extrema" vira "Versatilidade Extrema", "cnj_agilidade_no_campo_de_batalha" vira "Agilidade no Campo de Batalha". */
export function humanizaId(id) {
  const resto = String(id ?? "").replace(/^(len|tal|cnj|hab|apt|ori)_/, "");
  return resto.split("_").filter(Boolean)
    .map((w, i) => (i > 0 && CONECTIVOS.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}

function pluralizaPalavra(w) {
  if (INVARIAVEIS.has(w) || /s$/i.test(w)) return w;
  if (/ão$/i.test(w)) return w.replace(/ão$/i, "ões");
  if (/m$/i.test(w)) return w.replace(/m$/i, "ns");
  if (/al$/i.test(w)) return w.replace(/al$/i, "ais");
  if (/[rz]$/i.test(w)) return w + "es";
  return w + "s";
}

/**
 * O rótulo de uma família no plural: "Linha de Treinamento" vira "Linhas de Treinamento" e
 * "Treino Especial" vira "Treinos Especiais". Só as palavras antes do "de" mudam.
 */
export function pluralizaRotulo(rotulo) {
  const partes = String(rotulo ?? "").split(" ");
  const corte = partes.findIndex((w, i) => i > 0 && CONECTIVOS.has(w));
  return partes.map((w, i) => (corte < 0 || i < corte ? pluralizaPalavra(w) : w)).join(" ");
}

const doisRotulos = (n, rotulo) => (n === 1 ? rotulo : pluralizaRotulo(rotulo));

const REGRAS = {
  multiplicadorPeMaximo: (v) => `PE Máximo ×${v}`,
  multiplicadorPvFinal: (v) => `PV Final ×${v}`,
  passivasSemCustoPeMaximo: () => "Passivas Sem Custo de PE Máximo",
  ignoraMultiplicadorPeMaximoDeVotos: () => "Ignora a Redução de PE Máximo dos Votos",
  nivelJogadorSemTeto: () => "Nível Sem Teto",
  aptidaoApos20: () => "Nível de Aptidão a Cada 2 Níveis Depois do 20",
  aptidaoPorAvancoDeBt: () => "Nível de Aptidão por Avanço de BT Acima de 6",
  focosPorNivel: (v) => `Interlúdios ×${v} por Nível`,
  pontosAtributoPorCiclo: (v) => `${v} Pontos de Atributo por Ciclo de 4 Níveis`,
  talentosIniciais: (v) => `${v} ${v === 1 ? "Talento Inicial" : "Talentos Iniciais"}`,
  guardaComoCalamidade: () => "Guarda Como a de uma Calamidade",
  almaComoAfty: () => "Alma Como no Grimório Afty",
  trNoLimiteDePericias: () => "TR no Limite de Perícias",
};

/**
 * O que o pacote muda, em seções curtas para o painel de detalhe. Cada seção é
 * `{ titulo, linhas }`. Seção vazia some.
 *
 *   rotulos.familia(id)     "Talentos" para `talentos`
 *   rotulos.liberacao(id)   "Estilo das Sombras" para `estiloSombras`
 *   rotulos.primitiva(id)   "Cofre de Texto" para `cofre`
 */
export function oQueMuda(p, rotulos = {}) {
  const familia = rotulos.familia ?? ((id) => id);
  const liberacao = rotulos.liberacao ?? ((id) => id);
  const primitiva = rotulos.primitiva ?? ((id) => id);
  const secoes = [];

  const acrescenta = Object.entries(p?.acrescenta ?? {})
    .filter(([, l]) => lista(l).length)
    .map(([fam, l]) => {
      const nomes = l.map((e) => e?.nome).filter(Boolean);
      const mostra = nomes.slice(0, 6).join(", ");
      const resto = nomes.length > 6 ? ` e mais ${nomes.length - 6}` : "";
      return `${l.length} ${doisRotulos(l.length, familia(fam))}${mostra ? `: ${mostra}${resto}` : ""}`;
    });
  if (lista(p?.funcionamentos).length) acrescenta.push(`${p.funcionamentos.length} ${p.funcionamentos.length === 1 ? "Funcionamento" : "Funcionamentos"}`);
  if (lista(p?.feiticos).length) acrescenta.push(`${p.feiticos.length} ${p.feiticos.length === 1 ? "Modelo de Feitiço" : "Modelos de Feitiço"}`);
  if (lista(p?.estadosCombate).length) acrescenta.push(`${p.estadosCombate.length} ${p.estadosCombate.length === 1 ? "Estado de Combate" : "Estados de Combate"}`);
  secoes.push({ titulo: "Acrescenta", linhas: acrescenta });

  secoes.push({
    titulo: "Remenda",
    linhas: Object.entries(p?.substitui ?? {}).filter(([, l]) => lista(l).length).map(([fam, l]) => `${l.length} ${doisRotulos(l.length, familia(fam))}`),
  });

  secoes.push({
    titulo: "Regras",
    linhas: Object.entries(p?.regrasAfty ?? {})
      .filter(([k, v]) => REGRAS[k] && v !== false && v != null)
      .map(([k, v]) => REGRAS[k](v)),
  });

  secoes.push({
    titulo: "Libera",
    linhas: [
      ...lista(p?.libera).map((id) => {
        const rotulo = liberacao(id);
        if (rotulo !== id) return rotulo;
        return id.startsWith("soPorAddon:") ? `Reabre ${humanizaId(id.slice("soPorAddon:".length))}` : id;
      }),
      ...lista(p?.permite).map((id) => primitiva(id)),
    ],
  });

  return secoes.filter((s) => s.linhas.length > 0);
}

/* ============================================================ */
/* A DESCRIÇÃO EM BLOCOS DE LEITURA                              */
/* ============================================================ */
/* Quase toda descrição é um parágrafo só (63 de 88 passam de 200 caracteres, e só uma tem
   quebra de linha). Em vez de mudar o texto, a tela o divide: frase a frase, agrupadas em
   parágrafos curtos. O texto gravado no pacote não muda. */

/** Abreviaturas que terminam em ponto sem terminar a frase. */
const SIGLAS = new Set(["pt", "pág", "pag", "ex", "etc", "vs", "nº", "dr", "sr", "sra", "cap", "nv", "art", "obs", "cf"]);

/**
 * As frases de um texto. Corta onde há ponto, exclamação ou interrogação seguido de espaço e
 * de maiúscula, número ou abertura de aspas e parênteses, exceto depois de uma abreviatura.
 */
export function frases(texto) {
  const t = String(texto ?? "").replace(/\s+/g, " ").trim();
  if (!t) return [];
  const saida = [];
  const re = /([.!?…])\s+(?=[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ0-9"“([¿¡])/g;
  let inicio = 0;
  let m;
  while ((m = re.exec(t))) {
    const trecho = t.slice(inicio, m.index + 1);
    const ultima = trecho.split(" ").pop().replace(/[.!?…]+$/, "").toLowerCase();
    if (m[1] === "." && SIGLAS.has(ultima)) continue;
    saida.push(trecho.trim());
    inicio = m.index + m[0].length;
  }
  const resto = t.slice(inicio).trim();
  if (resto) saida.push(resto);
  return saida;
}

const palavras = (s) => new Set(semAcento(s).split(/[^a-z0-9]+/).filter((w) => w.length >= 4));

/** Duas frases que dizem a mesma coisa: a menor está quase toda dentro da outra. */
export function parecidas(a, b) {
  const x = palavras(a);
  const y = palavras(b);
  const menor = Math.min(x.size, y.size);
  if (menor < 3) return false;
  let comuns = 0;
  for (const w of x) if (y.has(w)) comuns++;
  return comuns / menor >= 0.75;
}

/** O teto de um parágrafo montado de várias frases, em caracteres. */
const PARAGRAFO_MAX = 320;

/**
 * Uma frase de mais de 420 caracteres é cortada nos ponto e vírgula, para não virar parede.
 * Sem ponto e vírgula ela fica inteira: cortar no meio mudaria o sentido.
 */
function divideFraseLonga(frase) {
  if (frase.length <= 420 || !frase.includes(";")) return [frase];
  const pedacos = frase.split(/;\s+/).map((x, i, todos) => (i < todos.length - 1 ? x + ";" : x));
  const saida = [];
  for (const pedaco of pedacos) {
    if (saida.length && saida.at(-1).length + pedaco.length < 200) saida[saida.length - 1] += " " + pedaco;
    else saida.push(pedaco);
  }
  return saida;
}

/**
 * A descrição em blocos `{ tipo: "p" | "item", texto }`. Respeita a quebra de linha do autor e
 * a lista com "-". Agrupa as frases de cada linha em parágrafos de até duas frases ou 220
 * caracteres, e cola a frase curta no fim ("Vale nos dois sistemas.") no parágrafo anterior.
 * Com `resumo`, tira a primeira frase se ela só repete o resumo.
 */
export function blocosDaDescricao(descricao, { resumo = "" } = {}) {
  const linhas = String(descricao ?? "").split(/\n+/).map((l) => l.trim()).filter(Boolean);
  const blocos = [];
  linhas.forEach((linha, indice) => {
    if (/^[-•]\s+/.test(linha)) { blocos.push({ tipo: "item", texto: linha.replace(/^[-•]\s+/, "") }); return; }
    let lista = frases(linha);
    if (indice === 0 && resumo && lista.length && parecidas(lista[0], resumo)) lista = lista.slice(1);
    lista = lista.flatMap(divideFraseLonga);
    let atual = "";
    let n = 0;
    lista.forEach((f, i) => {
      // só a frase curta do FIM cola no parágrafo anterior ("Vale nos dois sistemas.")
      const curtaDoFim = f.length < 45 && i === lista.length - 1;
      if (atual && !curtaDoFim && (n >= 2 || atual.length + f.length > PARAGRAFO_MAX)) {
        blocos.push({ tipo: "p", texto: atual });
        atual = "";
        n = 0;
      }
      atual = atual ? atual + " " + f : f;
      n++;
    });
    if (atual) blocos.push({ tipo: "p", texto: atual });
  });
  return blocos;
}

/**
 * Os blocos da primeira leitura: entram até passar de `max` caracteres, sempre ao menos um.
 * `resto` diz se há mais para abrir.
 */
export function recortaBlocos(blocos, max = 360) {
  const visiveis = [];
  let total = 0;
  for (const b of lista(blocos)) {
    if (visiveis.length && total >= max) break;
    visiveis.push(b);
    total += b.texto.length;
  }
  return { visiveis, resto: visiveis.length < lista(blocos).length };
}

export { semAcento };
