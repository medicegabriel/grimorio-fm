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
 * ============================================================
 */

/** Uma forja nasce gastando 1 Foco, que é o caso comum de um interlúdio. */
export const FORJA_FOCOS_PADRAO = 1;

const PREFIXO_FORJA = "forj_";

let forjaSeq = 0;

/** Uma linha de forja nova, vazia e com o gasto padrão. */
export function novaForja(patch = {}) {
  forjaSeq += 1;
  return {
    id: `${PREFIXO_FORJA}${Date.now().toString(36)}_${forjaSeq}`,
    focos: FORJA_FOCOS_PADRAO,
    itens: "",
    ...patch,
  };
}

const focosValidos = (v) => {
  const n = Math.trunc(Number(v));
  return Number.isFinite(n) ? Math.max(0, n) : FORJA_FOCOS_PADRAO;
};

/** Uma linha saneada, ou `null` quando nem isso dá para salvar. */
export function saneiaForja(bruta) {
  if (!bruta || typeof bruta !== "object") return null;
  const id = typeof bruta.id === "string" && bruta.id.startsWith(PREFIXO_FORJA) ? bruta.id : null;
  if (!id) return null;
  return { id, focos: focosValidos(bruta.focos), itens: String(bruta.itens ?? "") };
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
