/**
 * ============================================================
 * FORJA — o caderno dos Interlúdios de criação
 * ============================================================
 * Pedido do autor em 2026-09-11: *"Coloque aqui uma aba para anotar interludios
 * de forja, pq estou precisando"*, com a captura do card de Treinos Especiais.
 *
 * ------------------------------------------------------------
 * AS QUATRO DECISÕES DO AUTOR (2026-09-11)
 * ------------------------------------------------------------
 * 1. **Card na aba Interlúdios**, ao lado de Treinamento e de Treinos Especiais.
 * 2. **Só anotação, nada mecânico:** *"Quantidade de Focos Gastas, e um lugar
 *    para anotar os Itens que foram feitos"*. A ficha não confere kit, Ofício,
 *    CD nem grau, mesmo com todos eles no catálogo.
 * 3. **Gasta Foco**, do MESMO orçamento das Linhas e dos Treinos Especiais. A
 *    linha nasce com 1 e o número é editável, que é o encontro das duas
 *    respostas dele ("gasta 1 por forja" e "quantidade de Focos gastas").
 * 4. **Vale para todo mundo, nos dois sistemas.** Criar equipamento é regra do
 *    livro, e os kits e as CDs já estão no catálogo raw, então não é Addon.
 *
 * ------------------------------------------------------------
 * ⚠ MÓDULO FOLHA, SEM NENHUM IMPORT
 * ------------------------------------------------------------
 * A aba Interlúdios entra cedo no `AftyCreatureBuilder`, e foi esse caminho que
 * deixou o app em tela branca em 2026-09-02 com a aba de Defesas. Mesma regra do
 * `afty-carteira.js` e do `afty-catarse.js`. Ver `asserts/t-ordem-modulos.mjs`.
 *
 * ⚠ O TEXTO É GUARDADO CRU, sem `trim`: um campo que apara enquanto se digita
 * não deixa escrever espaço. Quem apara é quem exibe. Ver a lição do nome cru
 * em docs/afty-status.md.
 *
 * ⚠ FOCOS NEGATIVOS SÃO APARADOS EM ZERO. Uma forja que devolvesse Foco seria
 * uma segunda porta calada para o orçamento, e correção de Interlúdio já tem
 * lugar (a Entrada da Carteira). É a mesma regra do Gasto em `afty-carteira.js`.
 *
 * ------------------------------------------------------------
 * OS ITENS VIRARAM LISTA (autor, 2026-09-12)
 * ------------------------------------------------------------
 * *"Ficou MUITO feio e pouco pratico só ser um bloco de texto"*, com a captura
 * de um caderno escrito à mão em tópicos ("- Faixas de Sif", "- Uniforme"). Por
 * pergunta, cada item guarda **Nome e Tipo**, e vale para os dois sistemas.
 * Continua SÓ ANOTAÇÃO: o Tipo não confere kit, Ofício, CD nem limite.
 *
 * ⚠ O CADERNO ANTIGO NÃO SE PERDE. Ficha gravada antes desta data traz `itens`
 * como TEXTO, e a leitura o parte em um item por linha, tirando o marcador de
 * tópico. Os ids desses itens saem da POSIÇÃO, e não do relógio, para a mesma
 * ficha ler igual a cada render: id novo a cada leitura faria o React trocar o
 * campo no meio da digitação. A primeira edição grava a lista, e a conversão
 * não roda mais.
 * ============================================================
 */

/** Uma forja nasce gastando 1 Foco, que é o caso comum de um interlúdio. */
export const FORJA_FOCOS_PADRAO = 1;

const PREFIXO_FORJA = "forj_";
const PREFIXO_ITEM = "fitm_";

/**
 * O que um item forjado pode ser. São os valores de `cria` dos kits de
 * ferramentas em `afty-equipamentos.js`, no singular, porque aqui o rótulo fala
 * de UM item.
 *
 * ⚠ ESCRITO DUAS VEZES DE PROPÓSITO. Importar o catálogo quebraria o módulo
 * folha (ver o cabeçalho), então a lista é cópia, e o `asserts/t-forja.mjs`
 * compara os ids com a união dos `cria` do catálogo: kit novo que cria um tipo
 * novo faz o assert falhar em vez de o seletor ficar sem a opção, calado.
 *
 * A ordem é a de leitura na mesa: o que se empunha, o que se veste, e depois o
 * que se consome.
 */
export const FORJA_TIPOS = [
  { id: "arma", label: "Arma" },
  { id: "escudo", label: "Escudo" },
  { id: "ferramenta_amaldicoada", label: "Ferramenta Amaldiçoada" },
  { id: "uniforme", label: "Uniforme" },
  { id: "acessorio", label: "Acessório" },
  { id: "talisma", label: "Talismã" },
  { id: "espiritual", label: "Espiritual" },
  { id: "mistura", label: "Mistura" },
  { id: "farmaco", label: "Fármaco" },
];

const TIPOS_VALIDOS = new Set(FORJA_TIPOS.map((t) => t.id));

let forjaSeq = 0;
const carimbo = () => {
  forjaSeq += 1;
  return `${Date.now().toString(36)}_${forjaSeq}`;
};

/** Um item novo, sem nome e sem tipo. */
export function novoItemForja(patch = {}) {
  return { id: `${PREFIXO_ITEM}${carimbo()}`, nome: "", tipo: null, ...patch };
}

/** Uma linha de forja nova, com o gasto padrão e sem itens. */
export function novaForja(patch = {}) {
  return {
    id: `${PREFIXO_FORJA}${carimbo()}`,
    focos: FORJA_FOCOS_PADRAO,
    itens: [],
    ...patch,
  };
}

/* O marcador de tópico que quem escrevia no bloco de texto usava: "-", "*",
   "•", o travessão e a numeração "1." ou "1)". */
const MARCADOR_TOPICO = /^\s*(?:[-*•–—]|\d+[.)])\s*/;

/**
 * O caderno antigo, em TEXTO, partido em itens. Um item por linha não vazia,
 * sem o marcador de tópico. O tipo fica nulo, porque o texto nunca o disse.
 *
 * ⚠ Aqui SE APARA, e isso não contradiz o texto cru do resto do módulo: esta
 * conversão roda sobre o que já estava gravado, e nunca no laço de digitação.
 */
export function itensDoTextoAntigo(texto, forjaId = "") {
  const sufixo = String(forjaId).slice(PREFIXO_FORJA.length);
  return String(texto ?? "")
    .split(/\r?\n/)
    .map((linha) => linha.replace(MARCADOR_TOPICO, "").trim())
    .filter(Boolean)
    .map((nome, i) => ({ id: `${PREFIXO_ITEM}txt_${sufixo}_${i}`, nome, tipo: null }));
}

/** Um item saneado, ou `null` quando não dá para salvar. */
export function saneiaItemForja(bruto) {
  if (!bruto || typeof bruto !== "object") return null;
  if (typeof bruto.id !== "string" || !bruto.id.startsWith(PREFIXO_ITEM)) return null;
  return {
    id: bruto.id,
    nome: String(bruto.nome ?? ""),
    tipo: TIPOS_VALIDOS.has(bruto.tipo) ? bruto.tipo : null,
  };
}

const itensSaneados = (brutos, forjaId) => {
  if (typeof brutos === "string") return itensDoTextoAntigo(brutos, forjaId);
  if (!Array.isArray(brutos)) return [];
  const vistos = new Set();
  const out = [];
  for (const b of brutos) {
    const item = saneiaItemForja(b);
    if (!item || vistos.has(item.id)) continue;
    vistos.add(item.id);
    out.push(item);
  }
  return out;
};

/** Quantos itens a forja tem com nome. A linha que ainda está vazia não conta. */
export const itensComNome = (forja) =>
  (forja?.itens ?? []).filter((i) => String(i?.nome ?? "").trim() !== "").length;

const focosValidos = (v) => {
  const n = Math.trunc(Number(v));
  return Number.isFinite(n) ? Math.max(0, n) : FORJA_FOCOS_PADRAO;
};

/** Uma linha saneada, ou `null` quando nem isso dá para salvar. */
export function saneiaForja(bruta) {
  if (!bruta || typeof bruta !== "object") return null;
  const id = typeof bruta.id === "string" && bruta.id.startsWith(PREFIXO_FORJA) ? bruta.id : null;
  if (!id) return null;
  return { id, focos: focosValidos(bruta.focos), itens: itensSaneados(bruta.itens, id) };
}

/** As forjas da ficha, saneadas e sem id repetido. */
export function forjasDaFicha(creature) {
  const brutas = Array.isArray(creature?.forjas) ? creature.forjas : [];
  const vistos = new Set();
  const out = [];
  for (const b of brutas) {
    const f = saneiaForja(b);
    if (!f || vistos.has(f.id)) continue;
    vistos.add(f.id);
    out.push(f);
  }
  return out;
}

/**
 * Focos gastos em forja. Irmão do `focosGastos` das Linhas de Treinamento e do
 * `focosDeTreinosEspeciais`, e as três somas entram no MESMO orçamento do
 * cabeçalho da aba.
 */
export function focosDeForja(creature) {
  return forjasDaFicha(creature).reduce((soma, f) => soma + f.focos, 0);
}
