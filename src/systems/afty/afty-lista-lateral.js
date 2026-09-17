/**
 * ============================================================
 * A LISTA LATERAL: busca, filtro, ordem e grupos
 * ============================================================
 * Nasceu em 2026-09-16, a pedido do autor: *"A aba de Feitiços está MUITO
 * dificil navegar entre os Feitiços quando possuimos muitos."* A fileira de
 * cartões mostrava quatro por vez, e achar o décimo quinto era rolar de lado.
 *
 * Decisões, por pergunta com opções: lista LATERAL com o editor ao lado, busca
 * por nome, filtro por Tipo, agrupar por Tipo e ordenar, nas abas de Feitiços e
 * de Invocações, e nos dois sistemas.
 *
 * Esta é a metade SEM TELA, para ter assert. A tela é `ui/ListaLateral.jsx`.
 *
 * ⚠ MÓDULO FOLHA, sem import nenhum. A aba entra cedo no criador, e é a lição
 * do ciclo de imports (ver `afty-forja.js`).
 * ============================================================
 */

/** Minúscula e sem acento: "Benção" acha "bencao" e o contrário. */
export const semAcento = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** As três ordens. `criacao` é a da ficha, que é a que Subir e Descer mexem. */
export const ORDENS_LISTA = Object.freeze(["criacao", "nome", "nivel"]);

const comparaNome = (a, b) => semAcento(a.nome).localeCompare(semAcento(b.nome), "pt-BR");

/**
 * Organiza os itens para a lista.
 *
 * `itens` é `[{ id, nome, tipo, nivel }]`, com `nivel` NUMÉRICO e crescente
 * (quem chama traduz: o Feitiço de Técnica Máxima vale 6, o Grau Especial da
 * Invocação vale 5).
 *
 * Devolve `{ grupos: [{ tipo, rotulo, itens }], visiveis, total }`. Sem
 * agrupar, há um grupo só com `tipo` e `rotulo` nulos.
 *
 * ⚠ O EMPATE CAI NA ORDEM DE CRIAÇÃO, sempre. Sem isso dois Feitiços de Nível 5
 * trocariam de lugar a cada tecla digitada no nome de um terceiro.
 */
export function organizarLista(itens, { termo = "", tiposAtivos = [], ordem = "criacao", agrupar = false, tipos = [] } = {}) {
  const lista = (Array.isArray(itens) ? itens : []).map((item, indice) => ({ item, indice }));
  const busca = semAcento(termo).trim();
  const filtroTipo = new Set(Array.isArray(tiposAtivos) ? tiposAtivos : []);

  const filtrados = lista.filter(({ item }) =>
    (!busca || semAcento(item.nome).includes(busca))
    && (filtroTipo.size === 0 || filtroTipo.has(item.tipo)));

  const porCriacao = (a, b) => a.indice - b.indice;
  const comparador = {
    nome: (a, b) => comparaNome(a.item, b.item) || porCriacao(a, b),
    nivel: (a, b) => (Number(a.item.nivel) || 0) - (Number(b.item.nivel) || 0)
      || comparaNome(a.item, b.item) || porCriacao(a, b),
  }[ordem] ?? porCriacao;
  const ordenados = [...filtrados].sort(comparador).map(({ item }) => item);

  if (!agrupar) {
    return { grupos: ordenados.length ? [{ tipo: null, rotulo: null, itens: ordenados }] : [], visiveis: ordenados.length, total: lista.length };
  }

  /* Os grupos saem na ordem da lista de Tipos, e não na de aparição: o Dano
     fica sempre em cima, e o grupo não muda de lugar quando se cria um Feitiço.
     Tipo que a lista não conhece (ficha antiga, Addon) fecha a fila com o
     próprio nome, em vez de sumir. */
  const conhecidos = (Array.isArray(tipos) ? tipos : []).map((t) => t.value);
  const rotuloDe = Object.fromEntries((tipos ?? []).map((t) => [t.value, t.label]));
  const ordemTipos = [...conhecidos, ...new Set(ordenados.map((i) => i.tipo).filter((t) => !conhecidos.includes(t)))];
  const grupos = ordemTipos
    .map((tipo) => ({ tipo, rotulo: rotuloDe[tipo] ?? String(tipo ?? "Sem Tipo"), itens: ordenados.filter((i) => i.tipo === tipo) }))
    .filter((g) => g.itens.length > 0);
  return { grupos, visiveis: ordenados.length, total: lista.length };
}

/** Os Tipos que a lista TEM, na ordem da lista de Tipos, com a contagem de cada um. */
export function tiposPresentes(itens, tipos = []) {
  const contagem = new Map();
  for (const item of Array.isArray(itens) ? itens : []) contagem.set(item.tipo, (contagem.get(item.tipo) ?? 0) + 1);
  return (tipos ?? []).filter((t) => contagem.has(t.value)).map((t) => ({ ...t, quantidade: contagem.get(t.value) }));
}

/**
 * O vizinho na ordem VISÍVEL, para as setas do teclado. Com o selecionado fora
 * da lista (filtrado), a seta leva ao primeiro ou ao último.
 */
export function vizinhoNaLista(grupos, selecionadoId, passo) {
  const ids = (grupos ?? []).flatMap((g) => g.itens.map((i) => i.id));
  if (!ids.length) return null;
  const atual = ids.indexOf(selecionadoId);
  if (atual < 0) return passo > 0 ? ids[0] : ids[ids.length - 1];
  return ids[Math.min(ids.length - 1, Math.max(0, atual + passo))];
}
