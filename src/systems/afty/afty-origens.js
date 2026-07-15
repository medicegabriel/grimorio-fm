/**
 * ============================================================
 * ORIGENS — GRIMÓRIO AFTY (catálogo de conteúdo)
 * ============================================================
 * A origem é a essência da criatura: de onde vêm suas capacidades
 * e o que a destaca de um humano comum. Escolha IMUTÁVEL na criação
 * (salvo casos especiais de mesa).
 *
 * Cada origem concede:
 *   • bônus de atributos           → `bonusAtributos`
 *   • características de origem      → `caracteristicas` (escalam com o nível)
 * O Restringido é especial: destrava uma Especialização exclusiva
 *   → `especializacaoExclusivaId`.
 *
 * ⚠️ MECÂNICA A DEFINIR: os valores de `bonusAtributos` e
 * `caracteristicas` estão vazios até o autor especificar cada origem.
 * A estrutura já está pronta para receber os dados sem mudar código.
 * ============================================================
 */

export const AFTY_ORIGENS_CATALOG = [
  {
    id: "inato",
    nome: "Inato",
    raridade: "comum",
    resumo:
      "Nasceu com afinidade para energia amaldiçoada e uma técnica própria — única no mundo, " +
      "imprevisível e com potencial de inovar. A origem mais comum e versátil, combinando com a " +
      "maioria das especializações.",
    // MECÂNICA a fiar após confirmar (bônus é ESCOLHA do jogador; Talento e Feitiço
    // são sistemas ainda inexistentes). Por ora só o texto das características.
    // Talento = poder geral (como Habilidade de Especialização, mas sem trava de
    // classe). Feitiço = a Técnica Inata = uma Ação/Característica. Ambos são
    // sistemas ainda inexistentes; as concessões abaixo ficam registradas e o
    // seletor só fica clicável quando os catálogos existirem.
    bonusAtributos: {},
    caracteristicas: [
      {
        id: "bonus_atributo",
        nome: "Bônus em Atributo",
        descricao: "Aumenta o valor de um atributo em 2 pontos e o de outro em 1 ponto.",
        // aplicação (efetivo × orçamento) PENDENTE de confirmação:
        bonus: { escolhaDoJogador: true, pontos: [2, 1] },
      },
      {
        id: "talento_natural",
        nome: "Talento Natural",
        descricao:
          "Recebe um Talento à escolha no 1° nível. Uma única vez, a partir do 4° nível, pode " +
          "escolher receber um Talento adicional ao subir de nível.",
        grants: [
          { tipo: "talento", quantidade: 1, ndMin: 1 },
          { tipo: "talento", quantidade: 1, ndMin: 4 }, // ND ≥ 4 → 2 Talentos no total
        ],
      },
      {
        id: "marca_registrada",
        nome: "Marca Registrada",
        descricao: "Recebe um Feitiço adicional, com o custo reduzido em 1 PE.",
        grants: [{ tipo: "feitico", quantidade: 1, custoPEReduzido: 1 }],
      },
    ],
    especializacaoExclusivaId: null,
  },
  {
    id: "derivado",
    nome: "Derivado",
    raridade: "rara",
    resumo:
      "Energia e técnica vieram de uma fonte alternativa, mais tarde na vida e possivelmente de " +
      "forma não natural (consumir um objeto amaldiçoado, uma alteração na alma…). Raro e complexo, " +
      "costuma trazer problemas — mas desenvolve-se enormemente num único foco, quebrando limites de atributo.",
    bonusAtributos: {},
    caracteristicas: [
      {
        id: "bonus_atributo",
        nome: "Bônus em Atributo",
        descricao: "Aumenta o valor de um atributo em 2 pontos e o de outro em 1 ponto.",
        bonus: { escolhaDoJogador: true, pontos: [2, 1] },
      },
      {
        id: "energia_antinatural",
        nome: "Energia Antinatural",
        descricao:
          "Sua energia deriva de uma fonte anormal. Recebe uma Aptidão Amaldiçoada de Aura (deve atender " +
          "os requisitos). Além disso, uma vez por dia, como Ação Bônus em combate, recupera energia " +
          "amaldiçoada igual ao dobro do seu bônus de treinamento.",
        grants: [{ tipo: "aptidao_amaldicoada", categoria: "Aura", quantidade: 1 }],
        // A recuperação de PE (2× Maestria, 1/dia) é feature de combate — registrada; mecânica depois.
      },
      {
        id: "desenvolvimento_inesperado",
        nome: "Desenvolvimento Inesperado",
        descricao:
          "A cada quatro níveis, recebe um ponto de atributo adicional e aumenta em 1 o limite do atributo escolhido.",
        // MECÂNICA a fiar: mexe no pool de pontos de atributo E no limite por atributo. Ver perguntas.
        afetaAtributos: true,
      },
    ],
    especializacaoExclusivaId: null,
  },
  {
    id: "feto_amaldicoado_hibrido",
    nome: "Feto Amaldiçoado Híbrido",
    raridade: "rara",
    resumo: "",
    bonusAtributos: {},
    caracteristicas: [],
    especializacaoExclusivaId: null,
  },
  {
    id: "sem_tecnica",
    nome: "Sem Técnica",
    raridade: "comum",
    resumo: "",
    bonusAtributos: {},
    caracteristicas: [],
    especializacaoExclusivaId: null,
  },
  {
    id: "herdado",
    nome: "Herdado",
    raridade: "comum",
    resumo: "",
    bonusAtributos: {},
    caracteristicas: [],
    especializacaoExclusivaId: null,
  },
  {
    id: "restringido",
    nome: "Restringido",
    raridade: "rara",
    resumo: "",
    bonusAtributos: {},
    caracteristicas: [],
    // Vinculada a uma Especialização que SÓ pode ser acessada com esta origem.
    especializacaoExclusivaId: null, // TODO: id da Especialização exclusiva
  },
  {
    id: "corpo_amaldicoado_mutante",
    nome: "Corpo Amaldiçoado Mutante",
    raridade: "rara",
    resumo: "",
    bonusAtributos: {},
    caracteristicas: [],
    especializacaoExclusivaId: null,
  },
];

// Opções para <Select> (value/label).
export const AFTY_ORIGENS = AFTY_ORIGENS_CATALOG.map((o) => ({ value: o.id, label: o.nome }));

const BY_ID = Object.fromEntries(AFTY_ORIGENS_CATALOG.map((o) => [o.id, o]));

export const getOrigem = (id) => BY_ID[id] ?? null;

// Se a origem tem um bônus de atributo ESCOLHÍVEL pelo jogador, devolve
// { pontos: [...] } (ex.: [2,1]); senão null (bônus fixo ou nenhum).
export const getOrigemAttrChoice = (id) => {
  const c = getOrigem(id)?.caracteristicas?.find((car) => car.bonus?.escolhaDoJogador);
  return c?.bonus ?? null;
};

/**
 * Resolve o bônus de atributo EFETIVO da origem para uma criatura:
 * junta o bônus FIXO do catálogo (bonusAtributos) com a ESCOLHA do jogador
 * (guardada em creature.core.origem.bonusAtributos). Retorna { attrKey: pontos }.
 */
export function resolveOrigemAttrBonus(creature) {
  const origem = getOrigem(creature?.core?.origem?.id);
  const out = { ...(origem?.bonusAtributos || {}) };
  const chosen = creature?.core?.origem?.bonusAtributos || {};
  for (const [k, v] of Object.entries(chosen)) out[k] = (out[k] || 0) + v;
  return out;
}

// A origem concede "Desenvolvimento Inesperado" (pool que sobe valor+limite)?
export const origemTemDesenvolvimento = (id) =>
  !!getOrigem(id)?.caracteristicas?.some((c) => c.afetaAtributos);

/**
 * Alocação de Desenvolvimento Inesperado por atributo (Derivado).
 * Cada ponto = +1 no valor E +1 no limite daquele atributo. Guardado em
 * creature.core.origem.desenvolvimento. Retorna {} se a origem não tem a característica.
 */
export function resolveDesenvolvimento(creature) {
  if (!origemTemDesenvolvimento(creature?.core?.origem?.id)) return {};
  return creature?.core?.origem?.desenvolvimento || {};
}
