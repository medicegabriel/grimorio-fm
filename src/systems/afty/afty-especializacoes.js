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

import { registrarFamilia, remendarLista } from "./afty-addons";
import { getOrigem, origensQualificadas } from "./afty-origens";
import { AFTY_TIPOS } from "./afty-schema";

/** Teto de Especializações por ficha (multiclasse trivial: até 2). */
export const ESPECIALIZACAO_MAX = 2;

export const AFTY_ESPECIALIZACOES = [
  {
    id: "lutador",
    nome: "Lutador",
    resumo: "",
    descricao: "",
    treinamentos: { armas: ["simples", "marciais"], escudos: ["leve"] },
    exclusivaOrigemId: null,
  },
  {
    id: "combatente",
    nome: "Combatente",
    resumo: "",
    descricao: "",
    treinamentos: { armas: ["todas"], escudos: ["todos"] },
    exclusivaOrigemId: null,
  },
  {
    id: "conjurador",
    nome: "Conjurador",
    resumo: "",
    descricao: "",
    treinamentos: { armas: ["simples", "distancia"], escudos: [] },
    exclusivaOrigemId: null,
  },
  {
    id: "suporte",
    nome: "Suporte",
    resumo: "",
    descricao: "",
    treinamentos: { armas: ["simples"], escudos: ["todos"] },
    exclusivaOrigemId: null,
  },
  {
    id: "controlador",
    nome: "Controlador",
    resumo: "",
    descricao: "",
    treinamentos: { armas: ["simples", "distancia"], escudos: [] },
    exclusivaOrigemId: null,
  },
  {
    id: "restringido",
    nome: "Restringido",
    resumo: "",
    descricao: "",
    treinamentos: { armas: ["todas"], escudos: ["todos"] },
    // Só acessível com a Origem Restringido, e ela só dá acesso a esta.
    exclusivaOrigemId: "restringido",
  },
];

/* ============================================================ */
/* ADDONS                                                        */
/* ============================================================ */
/* Quarta família ligada (2026-08-20), e uma das que o autor nomeou de saída:
   *"os Addons podem ser usados para criar Novas Especializações"*. O índice é a
   única estrutura derivada, porque os filtros de origem rodam na chamada.

   ⚠ A Especialização é a família de forma mais SIMPLES do sistema (5 campos),
   e ao mesmo tempo a de consequência mais larga: quem cria uma precisa criar as
   Habilidades dela também, senão nasce uma classe vazia. O validador não cobra
   isso, e nem deveria: classe sem habilidade é ficha incompleta, não é erro. */

let BY_ID = {};

const ESPECIALIZACOES_BASE = AFTY_ESPECIALIZACOES.slice();

function aplicarExtrasEspecializacoes(extras = [], remendos = null) {
  AFTY_ESPECIALIZACOES.splice(0, AFTY_ESPECIALIZACOES.length, ...remendarLista(ESPECIALIZACOES_BASE, remendos), ...extras);
  BY_ID = Object.fromEntries(AFTY_ESPECIALIZACOES.map((e) => [e.id, e]));
}

aplicarExtrasEspecializacoes();

registrarFamilia("especializacoes", {
  rotulo: "Especialização",
  chave: "id",
  obrigatorios: ["nome"],
  aplicar: aplicarExtrasEspecializacoes,
  basicos: () => ESPECIALIZACOES_BASE,
  validador: validarCatalogoEspecializacoes,
  resolver: (id) => getEspecializacao(id),
  // A ficha guarda `[{ id, nivel }]`, e não uma lista de ids crus.
  idsDaFicha: (c) => (Array.isArray(c?.especializacoes)
    ? c.especializacoes.map((e) => e?.id).filter(Boolean)
    : []),
});


export const getEspecializacao = (id) => BY_ID[id] || null;

/**
 * Treinamentos de equipamento concedidos pelas Especializações escolhidas.
 * Multiclasse reúne as fontes sem duplicar categorias. O resultado continua
 * sendo dado de regra, não uma escolha gravada na ficha.
 */
export function treinamentosDasEspecializacoes(especializacoes = []) {
  const armas = new Set();
  const escudos = new Set();
  for (const entrada of Array.isArray(especializacoes) ? especializacoes : []) {
    const id = typeof entrada === "string" ? entrada : entrada?.id;
    const treinamentos = BY_ID[id]?.treinamentos;
    for (const arma of treinamentos?.armas ?? []) armas.add(arma);
    for (const escudo of treinamentos?.escudos ?? []) escudos.add(escudo);
  }
  return { armas: [...armas], escudos: [...escudos] };
}

/**
 * Especializações que a origem permite escolher, na ordem do catálogo.
 *
 * A trava é nos dois sentidos: a Origem Restringido vê SÓ Restringido, e
 * as outras origens veem todas MENOS as exclusivas.
 *
 * `extras` são OUTRAS origens que a criatura conta como suas sem ser dela. Hoje
 * só o Gêmeo tem isso, por Verdadeiras Origens: pegando o Físico Abençoado ele
 * *"recebe acesso a especialização Restringido"*, que é o que a característica
 * literalmente diz. A diferença entre a origem própria e uma extra importa: a
 * própria TRANCA (a Origem Restringido vê só Restringido), a extra só ABRE.
 */
export function especializacoesDisponiveis(origemId, extras = []) {
  const exclusiva = AFTY_ESPECIALIZACOES.find((e) => e.exclusivaOrigemId === origemId);
  if (exclusiva) return [exclusiva];
  const abertas = extras.filter((x) => x && x !== origemId);
  return AFTY_ESPECIALIZACOES.filter(
    (e) => e.exclusivaOrigemId == null || abertas.includes(e.exclusivaOrigemId),
  );
}

/** Quantas Especializações a origem permite. Restringido não multiclassa. */
export function maxEspecializacoes(origemId, extras = []) {
  return especializacoesDisponiveis(origemId, extras).length === 1 ? 1 : ESPECIALIZACAO_MAX;
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
 * Tipos que a origem alcança, na ordem do catálogo.
 *
 * ⚠ A trava do Restringido é BIDIRECIONAL também no eixo do Tipo (autor,
 * 2026-08-03): "a origem força o Tipo, e o tipo força a origem, é impossível
 * ver um Restringido sem a Origem e o Tipo Restringido ao mesmo tempo". Até
 * aqui só a metade origem → tipo existia, e o Tipo Restringido podia ser
 * escolhido com qualquer origem, o que fazia uma criatura sem energia
 * amaldiçoada (`semEnergia` lê o TIPO) continuar com aba de Aptidões
 * escondida e, ainda assim, com os Treinamentos de energia à mostra.
 *
 * Mesmo formato de `especializacoesDisponiveis`: a Origem Restringido vê SÓ
 * Restringido, e as outras veem todos MENOS Restringido.
 */
/**
 * ⚠ A ORIGEM GÊMEOS FURA A TRAVA DO TIPO (autor, 2026-08-07: *"Gêmeo
 * Restringido deveria ser do Tipo: Restringido"*).
 *
 * Ela é a única exceção, e o motivo está no próprio livro: a Restrição
 * Celestial dos Gêmeos tem DOIS ramos, um para o Gêmeo Restringido e outro para
 * o Feiticeiro, e o texto ainda recomenda que *"ao menos um dos gêmeos seja
 * restringido"*. Sem esta exceção o ramo inteiro do Restringido era
 * INALCANÇÁVEL no criador: `tiposDisponiveis` devolvia todos os Tipos menos
 * Restringido, e a metade da origem simplesmente não podia ser montada.
 *
 * ⚠ Isto abre só o TIPO. A Especialização Restringido continua exclusiva da
 * Origem Restringido: no livro ela chega ao Gêmeo pelo Físico Abençoado das
 * Verdadeiras Origens, e aquela escolha ainda não tem efeito ligado.
 */
const ORIGENS_QUE_ALCANCAM_RESTRINGIDO = ["restringido", "gemeos"];

export function tiposDisponiveis(origemId) {
  const forcado = tipoObrigatorio(origemId);
  if (forcado) return AFTY_TIPOS.filter((t) => t.value === forcado);
  if (ORIGENS_QUE_ALCANCAM_RESTRINGIDO.includes(origemId)) return AFTY_TIPOS;
  return AFTY_TIPOS.filter((t) => t.value !== "restringido");
}

/**
 * O Tipo que a ficha deve ficar ao trocar de origem: o forçado, ou o atual
 * quando ele continua alcançável, ou o primeiro da lista. Chamado na TROCA
 * (não na leitura), como o `especializacoesDisponiveis` do normalize: o Tipo é
 * escolha guardada, e deixá-lo ilegal na ficha faria `semEnergia` mentir.
 */
export function tipoDaOrigem(origemId, tipoAtual) {
  const permitidos = tiposDisponiveis(origemId);
  if (permitidos.some((t) => t.value === tipoAtual)) return tipoAtual;
  return permitidos[0]?.value ?? tipoAtual;
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
export function normalizeEspecializacoes(lista, origemId, extras = []) {
  const arr = Array.isArray(lista) ? lista : [];
  const vistos = new Set();
  const disponiveis = new Set(especializacoesDisponiveis(origemId, extras).map((e) => e.id));
  const out = [];
  for (const item of arr) {
    const id = item?.id;
    if (!BY_ID[id] || vistos.has(id) || !disponiveis.has(id)) continue;
    vistos.add(id);
    out.push({ id, nivel: Math.max(1, Math.trunc(Number(item?.nivel) || 0) || 1) });
    if (out.length >= maxEspecializacoes(origemId, extras)) break;
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
  // As origens que a criatura conta como suas além da própria (Verdadeiras
  // Origens). Só ABREM especialização exclusiva, nunca trancam.
  const extras = origensQualificadas(creature);
  const total = Math.max(1, Math.trunc(Number(creature?.core?.nd) || 1));
  const lista = normalizeEspecializacoes(creature?.especializacoes, origemId, extras);
  const max = maxEspecializacoes(origemId, extras);
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
