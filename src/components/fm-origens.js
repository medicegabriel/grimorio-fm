import { getBonusTreinamento, getModifier } from "./fm-tables";

// ============================================================
// fm-origens.js — Catálogo de Origens
// ============================================================
// Cada origem define um conjunto de características (entradas
// em draft.features) e, opcionalmente, efeitos automatizados:
//
//   automation.kind === "pe_bonus_nd"
//     → soma +ND ao peMax (aplicado em fm-derive.js).
//
//   automation.kind === "defenses"
//     → injeta itens em draft.defenses:
//         add.resistencias / imunidades / vulnerabilidades — objetos {tipo}
//         add.condicoesImunes — strings
//       Esses itens entram marcados com source:"origin" (defesas tipadas)
//       ou paralelos em defenses.originCondicoesImunes (condições).
//
// A sincronização draft↔origem mora no reducer (useCreatureBuilder.js):
// ao mudar origem, todas as features e defesas marcadas como
// source:"origin" são removidas e re-injetadas a partir deste catálogo.
// ============================================================

const MALDICAO_BASE_DESC = {
  imaterialidade:
    "Como um ser imaterial, uma maldição pode atravessar estruturas sem energia, não precisa respirar e não pode ser vista ou percebida por humanos que não sejam feiticeiros, a menos que esteja com as emoções à flor da pele.",
  imunidades_espirituais:
    "Sendo um espírito, uma maldição é imune a doenças e venenos mundanos (não sendo considerados os danos biológicos nem o veneno criado a partir de Ofício ou Condições, por exemplo), assim como não pode ser finalizada por objetos, equipamentos sem energia ou dano de queda.",
  regeneracao_base:
    "Uma maldição é capaz de regenerar e restaurar o próprio corpo a partir da sua energia amaldiçoada. É necessária uma Ação Comum ou Ação Rápida para se curar, pagando 4 PE; para curar uma Ferida Interna pague 8 PE; para regenerar um membro pague 10 PE.",
  aumento_energia:
    "Uma Maldição com Aumento de Energia recebe Pontos de Energia adicionais igual ao seu Nível de Desafio (ND). Esta habilidade nunca pode ser colocada em Lacaios.",
  pontos_fracos:
    "Maldições não podem ser curadas por energia reversa nem por itens criados a partir de ofícios, são vulneráveis ao dano de energia reversa, não recebem bônus de comida e não podem ter/usar equipamentos, exceto armas, armaduras e escudos.",
};

// Tabela do multiplicador de Mod Con por Patamar × Bônus de Treinamento.
// null = "Não recebe" (sem cura por regeneração nesse patamar/BT).
const REGENERACAO_MULT = {
  lacaio:     { 2: null, 3: null, 4: null, 5: null, 6: null },
  capanga:    { 2: null, 3: null, 4: 4,    5: 5,    6: 6 },
  comum:      { 2: null, 3: 3,    4: 4,    5: 7,    6: 12 },
  desafio:    { 2: null, 3: 3,    4: 6,    5: 10,   6: 12 },
  calamidade: { 2: null, 3: 3,    4: 6,    5: 10,   6: 12 },
};

function buildRegeneracaoDescription(core, attributes) {
  const patamar = core?.patamar || "comum";
  const bt = getBonusTreinamento(core?.nd ?? 1);
  const modCon = getModifier(attributes?.constituicao ?? 10);
  const mult = REGENERACAO_MULT[patamar]?.[bt] ?? null;

  const linhaCalc = mult == null
    ? `Cura: não recebe (Patamar ${patamar}, BT +${bt}).`
    : `Cura: Mod Con × ${mult} = ${modCon} × ${mult} = ${modCon * mult} PV (Patamar ${patamar}, BT +${bt}).`;

  return `${MALDICAO_BASE_DESC.regeneracao_base}\n\n${linhaCalc}`;
}

// ============================================================
// CATÁLOGO
// ============================================================
export const ORIGEM_FEATURES = {
  maldicao: {
    base: [
      {
        key: "imaterialidade",
        name: "Imaterialidade",
        description: MALDICAO_BASE_DESC.imaterialidade,
      },
      {
        key: "imunidades_espirituais",
        name: "Imunidades Espirituais",
        description: MALDICAO_BASE_DESC.imunidades_espirituais,
        automation: {
          kind: "defenses",
          add: {
            imunidades: [{ tipo: "venenoso" }],
          },
        },
      },
      {
        key: "regeneracao",
        name: "Regeneração",
        // Descrição calculada dinamicamente em buildOriginFeature usando
        // o patamar/BT/Constituição atuais (Mod Con × multiplicador).
        descriptionFn: (ctx) => buildRegeneracaoDescription(ctx.core, ctx.attributes),
        automation: { kind: "info_only" }, // marca como "automatizada" só pra exibir o ícone
      },
      {
        key: "pontos_fracos",
        name: "Pontos Fracos",
        description: MALDICAO_BASE_DESC.pontos_fracos,
        automation: {
          kind: "defenses",
          add: {
            vulnerabilidades: [{ tipo: "energia reversa" }],
          },
        },
      },
    ],
    optional: {
      aumento_energia: {
        key: "aumento_energia",
        name: "Aumento de Energia",
        description: MALDICAO_BASE_DESC.aumento_energia,
        automation: { kind: "pe_bonus_nd" },
      },
    },
    subtypes: {
      comum: [],
      medo: [],
      vingativo: [],
      vingativo_imaginario: [],
      enfermo: [],
    },
  },

  feiticeiro:        { base: jujutsuBaseFeatures(), optional: {}, subtypes: {} },
  usuario_maldicao:  { base: jujutsuBaseFeatures(), optional: {}, subtypes: {} },
  nao_feiticeiro:    { base: naoFeiticeiroBaseFeatures(), optional: {}, subtypes: {} },
  restringido:       {
    base: restringidoBaseFeatures(),
    optional: {},
    subtypes: {
      // Restrição de Corpo por Energia é uma origem distinta dentro do
      // Restringido: NÃO herda as features base do Restrito Celeste comum.
      corpo_por_energia: {
        replacesBase: true,
        features: restringidoCorpoPorEnergiaFeatures(),
      },
    },
  },

  corpo_amaldicoado: {
    base: corpoAmaldicoadoBaseFeatures(),
    optional: {
      estoque_adicional: {
        key: "estoque_adicional",
        name: "Estoque Adicional",
        description:
          "Como um Corpo Amaldiçoado, há uma certa quantidade de energia adicional em seu corpo. Opcionalmente, o Corpo Amaldiçoado recebe uma quantidade de Pontos de Energia igual ao seu Nível de Desafio (ND).",
        automation: { kind: "pe_bonus_nd" },
      },
    },
    subtypes: {},
  },
};

// ============================================================
// Features compartilhadas entre Feiticeiro Jujutsu e Usuário de Maldição.
// Função (em vez de constante) só pra evitar referência cruzada antes
// do `ORIGEM_FEATURES` ser parseado, e pra dar liberdade futura de
// parametrizar por origem se algum dia divergirem.
// ============================================================
function jujutsuBaseFeatures() {
  return [
    {
      key: "treinamento_evidente",
      name: "Treinamento Evidente",
      description:
        "Sendo treinado dentro do mundo jujutsu, a maior capacidade é evidente. O inimigo recebe uma quantidade de perícias dominadas adicionais igual ao seu Bônus de Treinamento (BT).",
      // Marker: lido por SectionSkills para somar BT ao limite recomendado.
      automation: { kind: "skills_bonus_bt" },
    },
    {
      key: "frutos_experiencia",
      name: "Frutos da Experiência",
      description:
        "No decorrer das experiências que o inimigo passou, todo o esforço e estresse traz frutos. Escolha um dos seguintes bônus: receber 2 Aptidões adicionais, receber 1 nível de aptidão adicional a cada 4 níveis, ou receber 1 dote adicional.",
      // Marker: SectionFeatures renderiza um seletor de bônus.
      // A escolha é persistida em core.origin.frutosExperiencia.
      automation: { kind: "frutos_experiencia" },
    },
  ];
}

// ============================================================
// Opções de Frutos da Experiência (escolha mutuamente exclusiva).
// ============================================================
export const FRUTOS_OPTIONS = [
  {
    value: "aptidoes_especiais",
    label: "+2 Aptidões adicionais",
    description: "Permite 2 aptidões especiais adicionais sem contar para o limite.",
  },
  {
    value: "niveis_aptidao",
    label: "+1 Nível de aptidão a cada 4 NDs",
    description: "Soma floor(ND ÷ 4) ao orçamento total de pontos de aptidão.",
  },
  {
    value: "dote",
    label: "+1 Dote adicional",
    description: "Permite 1 dote geral adicional sem contar para o limite.",
  },
];

/** True se a origem é Feiticeiro Jujutsu ou Usuário de Maldição. */
export function isJujutsuOrigin(origin) {
  return origin?.type === "feiticeiro" || origin?.type === "usuario_maldicao";
}

/** True se a origem é Não-Feiticeiro. */
export function isNaoFeiticeiro(origin) {
  return origin?.type === "nao_feiticeiro";
}

/**
 * True se a origem concede a regra "+BT em perícias dominadas"
 * (Treinamento Evidente / Necessidade de Agir — mecânica idêntica).
 */
export function hasSkillsBonusBt(origin) {
  return isJujutsuOrigin(origin) || isNaoFeiticeiro(origin);
}

/** Limite de Artimanhas (= BT) para Não-Feiticeiro; 0 nas demais. */
export function getArtimanhasLimit(core) {
  if (!isNaoFeiticeiro(core?.origin)) return 0;
  return getBonusTreinamento(core?.nd ?? 1);
}

/** Quantidade de itens consumíveis concedida pelo Preparo (= BT) para Não-Feiticeiro. */
export function getConsumiveisLimit(core) {
  if (!isNaoFeiticeiro(core?.origin)) return 0;
  return getBonusTreinamento(core?.nd ?? 1);
}

// ============================================================
// Features base do Não-Feiticeiro.
// ============================================================
function naoFeiticeiroBaseFeatures() {
  return [
    {
      key: "necessidade_de_agir",
      name: "Necessidade de Agir",
      description:
        "Diante algum gatilho ou vislumbre do mundo amaldiçoado, agir se torna uma necessidade que leva ao crescimento. Um Não-Feiticeiro recebe uma quantidade de perícias dominadas adicionais igual ao seu Bônus de Treinamento (BT).",
      automation: { kind: "skills_bonus_bt" },
    },
    {
      key: "preparo",
      name: "Preparo",
      description:
        "Uma força menor leva a um preparo maior. Um Não-Feiticeiro recebe uma quantidade de itens consumíveis igual ao seu Bônus de Treinamento (BT).",
      descriptionFn: (ctx) => {
        const bt = getBonusTreinamento(ctx?.core?.nd ?? 1);
        return `Uma força menor leva a um preparo maior. Um Não-Feiticeiro recebe uma quantidade de itens consumíveis igual ao seu Bônus de Treinamento (BT).\n\nConsumíveis disponíveis: ${bt} (BT +${bt}).`;
      },
      automation: { kind: "info_only" },
    },
    {
      key: "artimanhas",
      name: "Artimanhas",
      description:
        "Mesmo sem o poder do jujutsu, é possível compensar com truques. Um Não-Feiticeiro recebe uma quantidade de Artimanhas igual ao seu BT. Caso mude de origem, perde todas as artimanhas.",
      descriptionFn: (ctx) => {
        const bt = getBonusTreinamento(ctx?.core?.nd ?? 1);
        return `Mesmo sem o poder do jujutsu, é possível compensar com truques. Um Não-Feiticeiro recebe uma quantidade de Artimanhas igual ao seu BT.\n\nArtimanhas permitidas: ${bt} (BT +${bt}). Escolha na seção "Artimanhas". Caso mude de origem, perde todas as artimanhas.`;
      },
      automation: { kind: "artimanhas" },
    },
  ];
}

// ============================================================
// Features base do Restrito Celeste (Restringido).
// ============================================================
function restringidoBaseFeatures() {
  return [
    {
      key: "arsenal_vivo",
      name: "Arsenal Vivo",
      description:
        "Reconhecendo a necessidade de manejar armas imbuídas com energia, um Restringido deve estar preparado para as portar de maneira apropriada. Um Restringido recebe a característica Arsenal gratuitamente. Além disso, também é possível optar por fazer com que o Restringido receba uma quantidade de equipamentos de ofício igual ao seu BT.",
      descriptionFn: (ctx) => {
        const bt = getBonusTreinamento(ctx?.core?.nd ?? 1);
        return `Reconhecendo a necessidade de manejar armas imbuídas com energia, um Restringido deve estar preparado para as portar de maneira apropriada. Um Restringido recebe a característica Arsenal gratuitamente. Além disso, também é possível optar por fazer com que o Restringido receba uma quantidade de equipamentos de ofício igual ao seu BT.\n\nEquipamentos de ofício opcionais: ${bt} (BT +${bt}).`;
      },
      automation: { kind: "info_only" },
    },
    {
      key: "uso_rapido",
      name: "Uso Rápido",
      description:
        "Um Restringido se mantém pronto para usar certas ferramentas rapidamente. Um Restringido pode utilizar um Item de Custo como uma Ação Livre. Outros Itens de Custo podem ser utilizados como uma Ação Bônus ou Rápida.",
    },
    {
      key: "resiliencia_imediata",
      name: "Resiliência Imediata",
      description:
        "Seu corpo é mais resistente do que o padrão humano, permitindo-o encarar a dor facilmente. Uma quantidade de vezes igual ao seu BT, um Restringido pode evitar um desmembramento que fosse receber.",
      descriptionFn: (ctx) => {
        const bt = getBonusTreinamento(ctx?.core?.nd ?? 1);
        return `Seu corpo é mais resistente do que o padrão humano, permitindo-o encarar a dor facilmente. Uma quantidade de vezes igual ao seu BT, um Restringido pode evitar um desmembramento que fosse receber.\n\nDesmembramentos evitáveis por cena: ${bt} (BT +${bt}).`;
      },
      automation: { kind: "info_only" },
    },
    {
      key: "restricao_definitiva",
      name: "Restrição Definitiva",
      description:
        "Ao atingir ND 10 ou superior, um Restringido recebe três benefícios adicionais (ver descrição completa).",
      descriptionFn: (ctx) => {
        const nd = ctx?.core?.nd ?? 0;
        if (nd < 10) {
          return `Ao atingir ND 10 ou superior, um Restringido pode receber os seguintes benefícios:\n\n• Usuários de energia amaldiçoada possuem desvantagem em testes para perceber o Restringido.\n• O Restringido passa a perceber o traçado da alma, assim como não necessita mais de uma ferramenta amaldiçoada para enxergar maldições.\n• O Restringido se torna imune ao acerto garantido de uma Expansão de Domínio, podendo também escolher permanecer dentro da Expansão ou sair dela quando ela for ativada; caso fique, recebe todos os efeitos ambientais da Expansão; caso decida sair, fica de frente com a barreira externa.\n\nStatus: indisponível (ND atual ${nd}, requer ND 10+).`;
        }
        return `Ao atingir ND 10 ou superior, um Restringido recebe os seguintes benefícios:\n\n• Usuários de energia amaldiçoada possuem desvantagem em testes para perceber o Restringido.\n• O Restringido passa a perceber o traçado da alma, assim como não necessita mais de uma ferramenta amaldiçoada para enxergar maldições.\n• O Restringido se torna imune ao acerto garantido de uma Expansão de Domínio, podendo também escolher permanecer dentro da Expansão ou sair dela quando ela for ativada; caso fique, recebe todos os efeitos ambientais da Expansão; caso decida sair, fica de frente com a barreira externa.\n\nStatus: ATIVA (ND ${nd}).`;
      },
      automation: { kind: "info_only" },
    },
  ];
}

// ============================================================
// Features base do Corpo Amaldiçoado.
// ============================================================
function corpoAmaldicoadoBaseFeatures() {
  return [
    {
      key: "natureza_artificial",
      name: "Natureza Artificial",
      description:
        "Um Corpo Amaldiçoado não é orgânico, sendo naturalmente artificial e incapaz de interagir com certas coisas. O Corpo Amaldiçoado recebe imunidade a venenos e não precisa respirar.",
      automation: {
        kind: "defenses",
        add: {
          imunidades: [{ tipo: "venenoso" }],
        },
      },
    },
    {
      key: "troca_de_nucleo",
      name: "Troca de Núcleo",
      description:
        "O Corpo Amaldiçoado recebe a característica “Segunda Fase” gratuitamente.",
    },
    {
      key: "segunda_fase",
      name: "Segunda Fase",
      description:
        "Quando o corpo amaldiçoado atinge ou ativa sua segunda fase, ele muda em partes o seu conceito (Mago para Combatente, Mago para Lutador, Fogo para Gelo, Psíquico para Físico, e por aí vai). Recebe um aumento de vida igual a Constituição × (BT × 2) — essa vida recebida é OPCIONAL, o narrador não precisa colocá-la caso não queira. De resto, segue a criação padrão do guia.",
      descriptionFn: (ctx) => {
        const bt = getBonusTreinamento(ctx?.core?.nd ?? 1);
        const con = ctx?.attributes?.constituicao ?? 10;
        const vida = con * (bt * 2);
        return `Quando o corpo amaldiçoado atinge ou ativa sua segunda fase, ele muda em partes o seu conceito (Mago para Combatente, Mago para Lutador, Fogo para Gelo, Psíquico para Físico, e por aí vai). Recebe um aumento de vida igual a Constituição × (BT × 2) — essa vida recebida é OPCIONAL, o narrador não precisa colocá-la caso não queira. De resto, segue a criação padrão do guia.\n\nGanho opcional de vida: Constituição × (BT × 2) = ${con} × ${bt * 2} = ${vida} PV (BT +${bt}).`;
      },
      automation: { kind: "info_only" },
    },
  ];
}

// ============================================================
// Features do subtype "Restrição de Corpo por Energia" (Restringido).
// ============================================================
function restringidoCorpoPorEnergiaFeatures() {
  return [
    {
      key: "estoque_expandido",
      name: "Estoque Expandido",
      description:
        "Com um corpo sem integridade alguma, seu estoque de energia é extremamente amplo para compensar. O restrito tem seus Pontos de Energia dobrados.",
      automation: { kind: "pe_double" },
    },
    {
      key: "alcance_irrestrito",
      name: "Alcance Irrestrito",
      description:
        "Seu jujutsu é capaz de afetar uma área muito mais extensa. Todas as Aptidões e Técnicas do restrito possuem alcance “País”, sendo preciso apenas ter visão do local.",
    },
    {
      key: "fantoches",
      name: "Fantoches e Fantoche Supremo",
      description:
        "O restrito recebe acesso ao seu fantoche supremo e hordas de fantoches. Cada fantoche é um corpo amaldiçoado artificial, criado para servir como olhos, mãos e lâminas de seu controlador no mundo exterior. Eles existem no ponto exato entre engenharia e feitiçaria, unindo metal, selos e energia amaldiçoada em uma única entidade de combate.\n\nO corpo de um fantoche padrão apresenta:\n• Forma humanoide metálica, de proporções semelhantes a um adulto.\n• Revestimento de metal amaldiçoado reforçado.\n• Articulações seladas com inscrições espirituais.\n• Núcleo interno onde a energia amaldiçoada é comprimida.\n• Superfície marcada por: Talismãs, runas de controle, selos de disparo, defesa e autodestruição.\n\nFantoches usam o mesmo guia de criação de criaturas, mas utilizam os PE’s e atributos mentais do controlador. O fantoche não possui pontos de energia amaldiçoada nem atributos mentais — o controlador, por sua vez, não possui atributos físicos. Os fantoches realizam ações físicas (ou no máximo lançam raios laser pelas mãos via selos). Um fantoche pode carregar uma quantidade de equipamentos (Talismãs, Amuletos, Selos, Remédios, Venenos) igual ao seu BT.",
    },
  ];
}

// ============================================================
// Catálogo oficial de Artimanhas (Não-Feiticeiro).
// ============================================================
export const ARTIMANHAS_OFICIAIS = [
  {
    nome: "ARMA!!!",
    descricao:
      "Você tem um vício descomunal na sua Arma Masterizada. É como se você fosse incapaz de viver sem elas. Sua Arma Masterizada tem sua margem de acerto crítico reduzida em 1 e tem seu nível de dano aumentado em +3. Uma vez por combate, você pode escolher, gastando 5 de PE, garantir um ataque crítico, como se você tivesse tirado 20.",
    requisito: "ND 5 e Grão Mestre em Arma",
  },
  {
    nome: "Conhecimento Inatural",
    descricao:
      "Você estudou o Jujutsu, mesmo que você seja incapaz de controlá-lo. Caso você se torne um Feiticeiro, ganhe 1 Nível de Aptidão. Essa Artimanha pode ser pega várias vezes.",
    repetivel: true,
  },
  {
    nome: "Equipamentos Refinados",
    descricao:
      "Você refina seus equipamentos até onde não der mais, buscando deixar eles prístinos para o combate contra as Maldições. Ao melhorar um item em um Descanso Curto ou Longo com o Kit de Ferreiro, enquanto você empunhá-lo, adicione metade do bônus de treinamento no Dano, caso seja uma arma, ou no RD, caso seja um Escudo.",
  },
  {
    nome: "Grão Mestre em Armas",
    descricao:
      "Você é um grão-mestre em uma arma, algo que até mesmo os Feiticeiros têm dificuldade em ser. Em troca da falta de energia e do físico, você se masterizou. Escolha uma Arma de qualquer custo. Esta arma é considerada sua Arma Masterizada. Você aplica o bônus de treinamento nela se antes não aplicava. Caso você já aplicasse, ao invés disso aplique metade do seu bônus de treinamento no dano e no acerto.",
  },
  {
    nome: "Mente Astuta",
    descricao:
      "Com uma mente astuta, você consegue perceber ações antes que elas sequer sejam realizadas. Você agora pode utilizar “Ler Intenções” como ação livre e sempre passa no teste.",
  },
  {
    nome: "Percepção do Invisível",
    descricao:
      "Você é capaz de perceber o que não existe. Você ganha a Habilidade de Especialização “Perceber o Ar” e pode ver Maldições sem lentes ou óculos.",
    requisito: "ND 10",
  },
  {
    nome: "Planejamento Assíduos",
    descricao:
      "Você planeja antes de realizar suas missões, tendo equipamentos preparados. Recebe o Arsenal do Restringido, porém, com apenas um equipamento que evolui, ao invés do normal.",
  },
];

/** Bônus de pontos de aptidão concedido pela escolha de Frutos da Experiência. */
export function getFrutosAptidaoBonus(core) {
  if (!isJujutsuOrigin(core?.origin)) return 0;
  if (core?.origin?.frutosExperiencia !== "niveis_aptidao") return 0;
  return Math.floor((core?.nd ?? 0) / 4);
}

/** +1 no limite de dotes quando Frutos da Experiência escolhe "+1 Dote adicional". */
export function getFrutosDoteBonus(core) {
  if (!isJujutsuOrigin(core?.origin)) return 0;
  return core?.origin?.frutosExperiencia === "dote" ? 1 : 0;
}

/** +2 no limite de Aptidões Amaldiçoadas quando Frutos escolhe "+2 Aptidões adicionais". */
export function getFrutosAptidaoEspecialBonus(core) {
  if (!isJujutsuOrigin(core?.origin)) return 0;
  return core?.origin?.frutosExperiencia === "aptidoes_especiais" ? 2 : 0;
}

// ============================================================
// HELPERS
// ============================================================

/**
 * Retorna lista de feature raws aplicáveis para esta origem.
 *
 * Subtypes podem assumir duas formas:
 *  - Array de features → adicionado às features base (padrão Maldição).
 *  - Objeto { features, replacesBase? } → se replacesBase=true, IGNORA as
 *    features base da origem e usa só as do subtype (padrão Restringido →
 *    Corpo por Energia, que é uma variação distinta).
 *
 * `core` (opcional) é usado pra filtrar features condicionais — ex.: Aumento
 * de Energia é proibido em Lacaio. Quando não passado, usa só `origin`.
 */
export function getOriginRawFeatures(origin = {}, core = null) {
  const { type, subtype, hasAumentoEnergia } = origin;
  const def = ORIGEM_FEATURES[type];
  if (!def) return [];

  const subDef = subtype ? def.subtypes?.[subtype] : null;
  const subIsObject = subDef && !Array.isArray(subDef);
  const subFeatures = subIsObject ? (subDef.features || []) : (subDef || []);
  const replacesBase = !!(subIsObject && subDef.replacesBase);

  const out = replacesBase
    ? [...subFeatures]
    : [...(def.base || []), ...subFeatures];

  const patamar = core?.patamar;
  if (
    type === "maldicao" &&
    hasAumentoEnergia &&
    patamar !== "lacaio" &&
    def.optional?.aumento_energia
  ) {
    out.push(def.optional.aumento_energia);
  }
  if (type === "corpo_amaldicoado" && origin?.hasEstoqueAdicional && def.optional?.estoque_adicional) {
    out.push(def.optional.estoque_adicional);
  }
  return out;
}

/**
 * Gera o objeto feature pronto pra entrar em draft.features.
 * ctx (opcional) = { core, attributes } — usado para descrições dinâmicas
 * (ex.: Regeneração, que injeta o valor de cura calculado).
 *
 * `automated: true` quando a feature tem alguma forma de programação:
 *  - automation.kind real (altera valor numérico na ficha — peMax, defesas,
 *    budget de aptidões etc.); OU
 *  - descriptionFn (descrição calculada dinamicamente a partir do estado
 *    da criatura — ND, BT, Constituição, patamar, etc.). Mesmo quando o
 *    cálculo só aparece no texto da feature, ele é "programado" do ponto
 *    de vista do usuário e merece o badge.
 */
export function buildOriginFeature(raw, ctx = {}) {
  const hasDescFn = typeof raw.descriptionFn === "function";
  const description = hasDescFn ? raw.descriptionFn(ctx) : raw.description;

  const kind = raw.automation?.kind;
  const hasRealKind = !!kind && kind !== "info_only";
  const isAutomated = hasRealKind || hasDescFn;

  return {
    id: `origin-${raw.key}`,
    name: raw.name,
    description,
    category: "geral",
    trigger: "passiva",
    source: "origin",
    originKey: raw.key,
    automated: isAutomated,
    locked: true,
  };
}

/**
 * Itens de defesa que a origem injeta.
 * Retorna { resistencias, imunidades, vulnerabilidades, condicoesImunes }.
 * Os 3 primeiros vêm com {tipo, source:'origin', originKey}.
 * condicoesImunes é apenas array de strings (paralelo em defenses.originCondicoesImunes).
 */
export function getOriginDefenseItems(origin, core = null) {
  const items = {
    resistencias: [],
    imunidades: [],
    vulnerabilidades: [],
    condicoesImunes: [],
  };
  for (const raw of getOriginRawFeatures(origin, core)) {
    if (raw.automation?.kind !== "defenses") continue;
    const add = raw.automation.add || {};
    for (const cat of ["resistencias", "imunidades", "vulnerabilidades"]) {
      for (const it of add[cat] || []) {
        items[cat].push({ ...it, source: "origin", originKey: raw.key });
      }
    }
    for (const c of add.condicoesImunes || []) {
      items.condicoesImunes.push(c);
    }
  }
  return items;
}

/** True se a origem aplica bônus +ND ao peMax (Maldição com Aumento de Energia, exceto Lacaio). */
export function hasPeAumentoEnergia(core) {
  const { origin, patamar } = core || {};
  return (
    origin?.type === "maldicao" &&
    origin?.hasAumentoEnergia === true &&
    patamar !== "lacaio"
  );
}

/** True se a origem aplica bônus +ND ao peMax (Corpo Amaldiçoado com Estoque Adicional). */
export function hasPeEstoqueAdicional(core) {
  return (
    core?.origin?.type === "corpo_amaldicoado" &&
    core?.origin?.hasEstoqueAdicional === true
  );
}

/** True se a origem dobra o peMax (Restringido com Corpo por Energia). */
export function hasPeDouble(core) {
  return (
    core?.origin?.type === "restringido" &&
    core?.origin?.subtype === "corpo_por_energia"
  );
}

/**
 * True se a origem é o Restrito Celeste "puro" (Restringido sem a Restrição de
 * Corpo por Energia). Somente este NÃO tem acesso a Aptidões nem a Aptidões
 * Amaldiçoadas — o Corpo por Energia recebe ambos normalmente.
 */
export function isRestritoCeleste(core) {
  return (
    core?.origin?.type === "restringido" &&
    core?.origin?.subtype !== "corpo_por_energia"
  );
}
