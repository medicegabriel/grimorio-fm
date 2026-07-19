/**
 * Catálogo das Especializações do Afty + resolvers puros.
 *
 * Regras confirmadas pelo autor (2026-07-17):
 *
 * 1. Especialização NÃO muda cálculo. Quem dirige fórmula é o Tipo
 *    (ver AFTY_TIPOS em ./afty-schema.js). A Especialização só (a) é
 *    pré-requisito de Habilidade de Especialização e (b) define o
 *    escalonamento de algumas habilidades.
 * 2. Tipo e Especialização são eixos INDEPENDENTES. Os nomes colidem de
 *    propósito (ver aviso abaixo).
 * 3. Nível de Especialização == ND. A soma dos níveis distribuídos é
 *    exatamente o ND da criatura, e a multiclasse divide o próprio ND.
 * 4. Multiclasse: até 2 Especializações, livre entre elas.
 * 5. Restringido é exclusiva da Origem Restringido, nos DOIS sentidos:
 *    - quem tem a origem só pode pegar Restringido, e sem multiclasse
 *    - quem não tem a origem não pode pegar Restringido
 *    A Origem Restringido também força o TIPO Restringido.
 *
 * ⚠ COLISÃO DE NOMES, PROPOSITAL (confirmada pelo autor). Combatente,
 * Conjurador e Restringido são nome de TIPO e nome de ESPECIALIZAÇÃO, e
 * querem dizer coisas diferentes. Uma criatura de Tipo Conjurador com
 * Especialização Combatente é uma ficha legal. Os dois catálogos vivem em
 * arquivos separados, então os ids não colidem de verdade, mas NÃO
 * assuma que `core.tipo === "combatente"` diz qualquer coisa sobre a
 * Especialização escolhida (nem o contrário). O único acoplamento entre
 * os eixos é a trava da Origem Restringido.
 *
 * ⚠ Ordem do array = ordem que o autor mandou, NÃO alfabética. A UI
 * renderiza nessa ordem (mesma convenção de ./afty-aptidoes.js).
 *
 * ⚠ CONTEÚDO PENDENTE: `resumo` e `descricao` estão vazios até o autor
 * mandar o texto do livro. O texto vem VERBATIM, sem parafrasear.
 */

import { getOrigem } from "./afty-origens";

/** Teto de Especializações por ficha (multiclasse trivial: até 2). */
export const ESPECIALIZACAO_MAX = 2;

export const AFTY_ESPECIALIZACOES = [
  {
    id: "lutador",
    nome: "Lutador",
    resumo: "",
    descricao: "",
    exclusivaOrigemId: null,
  },
  {
    id: "combatente",
    nome: "Combatente",
    resumo: "",
    descricao: "",
    exclusivaOrigemId: null,
  },
  {
    id: "conjurador",
    nome: "Conjurador",
    resumo: "",
    descricao: "",
    exclusivaOrigemId: null,
  },
  {
    id: "suporte",
    nome: "Suporte",
    resumo: "",
    descricao: "",
    exclusivaOrigemId: null,
  },
  {
    id: "controlador",
    nome: "Controlador",
    resumo: "",
    descricao: "",
    exclusivaOrigemId: null,
  },
  {
    id: "restringido",
    nome: "Restringido",
    resumo: "",
    descricao: "",
    // Só acessível com a Origem Restringido, e ela só dá acesso a esta.
    exclusivaOrigemId: "restringido",
  },
];

const BY_ID = Object.fromEntries(AFTY_ESPECIALIZACOES.map((e) => [e.id, e]));

export const getEspecializacao = (id) => BY_ID[id] || null;

/**
 * Especializações que a origem permite escolher, na ordem do catálogo.
 *
 * A trava é nos dois sentidos: a Origem Restringido vê SÓ Restringido, e
 * as outras origens veem todas MENOS as exclusivas.
 */
export function especializacoesDisponiveis(origemId) {
  const exclusiva = AFTY_ESPECIALIZACOES.find((e) => e.exclusivaOrigemId === origemId);
  if (exclusiva) return [exclusiva];
  return AFTY_ESPECIALIZACOES.filter((e) => e.exclusivaOrigemId == null);
}

/** Quantas Especializações a origem permite. Restringido não multiclassa. */
export function maxEspecializacoes(origemId) {
  return especializacoesDisponiveis(origemId).length === 1 ? 1 : ESPECIALIZACAO_MAX;
}

/**
 * Especialização que a origem OBRIGA, ou null quando a escolha é livre.
 * Hoje só a Origem Restringido obriga.
 */
export function especializacaoObrigatoria(origemId) {
  const exclusiva = AFTY_ESPECIALIZACOES.find((e) => e.exclusivaOrigemId === origemId);
  return exclusiva ? exclusiva.id : null;
}

/**
 * Tipo que a origem OBRIGA (chave de AFTY_TIPOS), ou null quando o Tipo é
 * livre. É o ÚNICO ponto onde os eixos Tipo e Especialização se tocam: a
 * Origem Restringido força os dois (autor, 2026-07-17). Não generalize
 * isso para uma relação Tipo × Especialização, ela não existe.
 */
export function tipoObrigatorio(origemId) {
  return origemId === "restringido" ? "restringido" : null;
}

/**
 * Saneia a lista da ficha: descarta ids desconhecidos e duplicados,
 * força nível inteiro >= 1, e apara no teto da origem. Tolera ficha
 * antiga/parcial (o campo é `[{ id, nivel }]`).
 *
 * O `nome` NÃO é guardado na ficha: o catálogo é a fonte da verdade, e
 * gravar o rótulo junto faria uma errata de nome deixar fichas velhas
 * mentindo. Quem precisa do nome chama getEspecializacao(id).
 */
export function normalizeEspecializacoes(lista, origemId) {
  const arr = Array.isArray(lista) ? lista : [];
  const vistos = new Set();
  const disponiveis = new Set(especializacoesDisponiveis(origemId).map((e) => e.id));
  const out = [];
  for (const item of arr) {
    const id = item?.id;
    if (!BY_ID[id] || vistos.has(id) || !disponiveis.has(id)) continue;
    vistos.add(id);
    out.push({ id, nivel: Math.max(1, Math.trunc(Number(item?.nivel) || 0) || 1) });
    if (out.length >= maxEspecializacoes(origemId)) break;
  }
  return out;
}

/**
 * Resolve o estado das Especializações da ficha.
 *
 * O orçamento de níveis é o PRÓPRIO ND (autor, 2026-07-17): a soma dos
 * níveis é sempre exatamente o ND. Nada aqui alimenta o cálculo de stats.
 *
 * ⚠ A soma é garantida POR CONSTRUÇÃO, não validada depois. Como
 * soma(niveis) === ND é regra dura, uma ficha com 2 especializações tem
 * UM grau de liberdade só: escolhido o nível da primeira, o da segunda é
 * o resto do ND. Com 1 especialização não há escolha nenhuma, o nível é
 * o ND inteiro. Então a ficha guarda só o PONTO DE DIVISÃO (o nível da
 * primeira) e o resto é derivado aqui — "guarde escolhas, nunca
 * resultados". Isso faz o estado ilegal deixar de existir: mexer no ND
 * depois reflui sozinho no nível, em vez de deixar a ficha inconsistente
 * esperando validação.
 *
 * O nível gravado da 2ª especialização é IGNORADO na leitura (ele é
 * sempre `total - primeira`). O aparo é só de leitura, não é gravado:
 * baixar o ND e subir de volta traz a divisão original (mesma convenção
 * de resolveNiveisAptidao em ./afty-aptidoes.js).
 *
 * Cada especialização tem nível mínimo 1, então só cabe multiclasse a
 * partir do ND 2. No ND 1 a segunda é aparada fora.
 *
 * Retorna { escolhidas, total, max, obrigatoria, completa, erro }.
 */
export function resolveEspecializacoes(creature) {
  const origemId = creature?.core?.origem?.id;
  const total = Math.max(1, Math.trunc(Number(creature?.core?.nd) || 1));
  const lista = normalizeEspecializacoes(creature?.especializacoes, origemId);
  const max = maxEspecializacoes(origemId);
  const obrigatoria = especializacaoObrigatoria(origemId);

  let escolhidas;
  if (lista.length === 0) {
    escolhidas = [];
  } else if (lista.length === 1 || total < 2) {
    // Sem divisão possível: a primeira leva o ND inteiro.
    escolhidas = [{ id: lista[0].id, nivel: total }];
  } else {
    // Ponto de divisão: a 1ª fica entre 1 e ND-1, a 2ª leva o resto.
    const primeira = Math.min(Math.max(lista[0].nivel, 1), total - 1);
    escolhidas = [
      { id: lista[0].id, nivel: primeira },
      { id: lista[1].id, nivel: total - primeira },
    ];
  }

  // Nível de ESCALONAMENTO por classe = nível real + metade do nível das OUTRAS
  // classes (arredondando para baixo). Só para efeitos que ESCALAM com o nível
  // (ex.: acesso a graus de Invocação, Concentrar Poder, Estilo Defensivo). Os
  // PRÉ-REQUISITOS de habilidade continuam usando o nível REAL (`nivel`).
  const somaTodas = escolhidas.reduce((s, e) => s + e.nivel, 0);
  escolhidas = escolhidas.map((e) => ({
    ...e,
    nivelEscalonamento: e.nivel + Math.floor((somaTodas - e.nivel) / 2),
  }));

  return {
    escolhidas,
    total,
    max,
    obrigatoria,
    // O único estado incompleto que sobra é não ter escolhido nenhuma.
    completa: escolhidas.length > 0,
    erro: escolhidas.length === 0 ? "nenhuma" : null,
  };
}

/**
 * Validador de conteúdo (mesmo papel de validarCatalogoAptidoes): ids
 * únicos, nomes únicos, e exclusivaOrigemId apontando para origem que
 * existe de verdade. Devolve lista de problemas (vazia = catálogo são).
 * Rodar a cada leva de conteúdo novo.
 */
export function validarCatalogoEspecializacoes() {
  const problemas = [];
  const ids = new Set();
  const nomes = new Set();

  for (const e of AFTY_ESPECIALIZACOES) {
    if (ids.has(e.id)) problemas.push(`id duplicado: ${e.id}`);
    ids.add(e.id);

    const nomeKey = e.nome.toLowerCase();
    if (nomes.has(nomeKey)) problemas.push(`nome duplicado: ${e.nome}`);
    nomes.add(nomeKey);

    if (e.exclusivaOrigemId != null && !getOrigem(e.exclusivaOrigemId)) {
      problemas.push(`${e.nome}: exclusivaOrigemId aponta para origem inexistente (${e.exclusivaOrigemId})`);
    }
  }
  return problemas;
}
