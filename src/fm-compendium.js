// fm-compendium.js
// Compêndio de criaturas pré-prontas. Built-ins vivem aqui, nunca
// entram no storage. Quando o mestre edita/abre, App.jsx clona
// silenciosamente via storage.cloneFromBuiltIn().
//
// IDs determinísticos (prefix "builtin_") pra evitar colisão com ids gerados.
// Valores já derivados — mesmo schema que buildCreature() produziria.

const BUILTIN_COMBAT_STATE = (hpMax, peMax, guardaMax, rpMax = 0, rtMax = 0) => ({
  isActive: false,
  hpCurrent: hpMax,
  peCurrent: peMax,
  guardaInabavalCurrent: guardaMax,
  resistenciaParcialUsed: 0,
  resistenciaTotalUsed: 0,
  integridadeCurrent: 100,
  activeConditions: [],
  temporaryHp: 0,
  isInDesafiandoMorte: false,
  missCounter: 0,
  customCounters: [],
  combatLog: [],
});

export const COMPENDIUM = [
  // ============================================================
  // LACAIO — ND 3
  // ============================================================
  {
    id: "builtin_lacaio_espirito_menor",
    isBuiltIn: true,
    folderId: null,
    name: "Espírito Amaldiçoado Menor",
    portraitUrl: "",
    createdAt: 0,
    updatedAt: 0,
    core: {
      grau: "4",
      nd: 3,
      patamar: "lacaio",
      difficulty: "iniciante",
      origin: { type: "maldicao", subtype: "comum", hasAumentoEnergia: false },
      size: "pequeno",
      bonusTreinamento: 2,
    },
    attributes: { forca: 10, destreza: 12, constituicao: 10, inteligencia: 6, sabedoria: 8, presenca: 8 },
    aptidoes: { ea: 1, cl: 0, bar: 0, dom: 0, er: 0 },
    overrides: { stats: {}, saves: {} },
    stats: {
      hpMax: 12, peMax: 8, defesa: 13, atencao: 10, iniciativa: 1,
      deslocamento: 9, guardaInabavalMax: 2,
      rdGeral: 0, rdIrredutivel: 0, ignorarRd: 0, vidaTempPorAtaque: 0,
      resistenciaParcialMax: 0, resistenciaTotalMax: 0,
    },
    saves: { astucia: -2, fortitude: 0, reflexos: 1, vontade: -1, integridade: -1 },
    skills: [
      { id: "skill_b01", name: "Furtividade", attribute: "destreza", mastered: true, overrideMod: null, mod: 3 },
      { id: "skill_b02", name: "Percepção",  attribute: "sabedoria", mastered: false, overrideMod: null, mod: -1 },
    ],
    defenses: {
      resistencias: [],
      imunidades: [{ tipo: "veneno", nivel: "imune" }],
      vulnerabilidades: [{ tipo: "sagrado", nivel: "vulner." }],
      condicoesImunes: [],
    },
    actions: {
      total: { comum: 1, rapida: 1, bonus: 1, movimento: 1, reacao: 1 },
      list: [
        {
          id: "act_b01", name: "Garra Amaldiçoada", type: "comum", cost: 0,
          attackType: "corpo-a-corpo", toHit: 4, cd: null, trType: "",
          damage: { average: 5, roll: "1d6+2", type: "cortante" },
          range: "corpo-a-corpo", area: "", description: "Um ataque rápido com as garras pegajosas da entidade.",
        },
      ],
    },
    features: [
      {
        id: "feat_b01", category: "Aptidão",
        name: "Passo Espectral",
        description: "Pode se mover através de paredes finas (até 1m de espessura) uma vez por combate, gastando sua ação de movimento.",
        trigger: "",
      },
    ],
    narratorNotes: "Aparece em bandos de 3-6 indivíduos. Fogem quando restam apenas 2 do grupo.",
    combatState: BUILTIN_COMBAT_STATE(12, 8, 2),
  },

  // ============================================================
  // COMUM — ND 10
  // ============================================================
  {
    id: "builtin_comum_feiticeiro_veterano",
    isBuiltIn: true,
    folderId: null,
    name: "Feiticeiro Veterano Corrompido",
    portraitUrl: "",
    createdAt: 0,
    updatedAt: 0,
    core: {
      grau: "2",
      nd: 10,
      patamar: "comum",
      difficulty: "intermediario",
      origin: { type: "feiticeiro", subtype: "", hasAumentoEnergia: true },
      size: "medio",
      bonusTreinamento: 4,
    },
    attributes: { forca: 14, destreza: 16, constituicao: 14, inteligencia: 12, sabedoria: 14, presenca: 16 },
    aptidoes: { ea: 4, cl: 3, bar: 2, dom: 1, er: 2 },
    overrides: { stats: {}, saves: {} },
    stats: {
      hpMax: 68, peMax: 42, defesa: 18, atencao: 16, iniciativa: 7,
      deslocamento: 9, guardaInabavalMax: 8,
      rdGeral: 2, rdIrredutivel: 1, ignorarRd: 1, vidaTempPorAtaque: 3,
      resistenciaParcialMax: 2, resistenciaTotalMax: 1,
    },
    saves: { astucia: 5, fortitude: 6, reflexos: 7, vontade: 6, integridade: 7 },
    skills: [
      { id: "skill_b11", name: "Atletismo", attribute: "forca", mastered: true, overrideMod: null, mod: 6 },
      { id: "skill_b12", name: "Acrobacia", attribute: "destreza", mastered: true, overrideMod: null, mod: 7 },
      { id: "skill_b13", name: "Intimidação", attribute: "presenca", mastered: true, overrideMod: null, mod: 7 },
      { id: "skill_b14", name: "Arcanismo", attribute: "inteligencia", mastered: false, overrideMod: null, mod: 1 },
    ],
    defenses: {
      resistencias: [{ tipo: "energia amaldiçoada", nivel: "resist. parcial" }],
      imunidades: [],
      vulnerabilidades: [],
      condicoesImunes: ["amedrontado"],
    },
    actions: {
      total: { comum: 1, rapida: 1, bonus: 1, movimento: 1, reacao: 1 },
      list: [
        {
          id: "act_b11", name: "Golpe Reforçado", type: "comum", cost: 0,
          attackType: "corpo-a-corpo", toHit: 8, cd: null, trType: "",
          damage: { average: 14, roll: "2d8+5", type: "contundente" },
          range: "corpo-a-corpo", area: "", description: "Ataque reforçado com EA nos punhos.",
        },
        {
          id: "act_b12", name: "Projéteis de Energia", type: "comum", cost: 3,
          attackType: "à distância", toHit: 7, cd: null, trType: "",
          damage: { average: 12, roll: "3d6+2", type: "energia amaldiçoada" },
          range: "18m", area: "", description: "Dispara 3 projéteis de EA condensada em alvos à escolha.",
        },
        {
          id: "act_b13", name: "Reversão Defensiva", type: "reacao", cost: 4,
          attackType: "", toHit: null, cd: 16, trType: "Reflexos",
          damage: { average: 0, roll: "", type: "" },
          range: "pessoal", area: "", description: "Ao sofrer dano por energia amaldiçoada, usa a própria EA como barreira. Reduz o dano pela metade.",
        },
      ],
    },
    features: [
      {
        id: "feat_b11", category: "Característica",
        name: "Aumento de Energia",
        description: "Possui reserva ampliada de Pontos de Energia e pode gastar mais PE do que outros feiticeiros do mesmo ND.",
        trigger: "",
      },
      {
        id: "feat_b12", category: "Aptidão",
        name: "Olho da Técnica",
        description: "Uma vez por combate, como ação rápida, pode analisar uma Técnica Amaldiçoada oponente. Recebe +2 em todos os TRs contra ela até o fim do combate.",
        trigger: "Ação Rápida",
      },
    ],
    narratorNotes: "Traiu sua organização e agora caça antigos aliados. Prefere combates longos em que possa usar Reversão Defensiva múltiplas vezes.",
    combatState: BUILTIN_COMBAT_STATE(68, 42, 8, 2, 1),
  },

  // ============================================================
  // DESAFIO — ND 18
  // ============================================================
  {
    id: "builtin_desafio_youkai_vingativo",
    isBuiltIn: true,
    folderId: null,
    name: "Youkai da Vingança Obscura",
    portraitUrl: "",
    createdAt: 0,
    updatedAt: 0,
    core: {
      grau: "1",
      nd: 18,
      patamar: "desafio",
      difficulty: "experiente",
      origin: { type: "maldicao", subtype: "vingativo", hasAumentoEnergia: true },
      size: "grande",
      bonusTreinamento: 5,
    },
    attributes: { forca: 20, destreza: 18, constituicao: 18, inteligencia: 14, sabedoria: 16, presenca: 18 },
    aptidoes: { ea: 6, cl: 5, bar: 4, dom: 3, er: 5 },
    overrides: { stats: {}, saves: {} },
    stats: {
      hpMax: 180, peMax: 95, defesa: 23, atencao: 20, iniciativa: 9,
      deslocamento: 12, guardaInabavalMax: 18,
      rdGeral: 5, rdIrredutivel: 3, ignorarRd: 3, vidaTempPorAtaque: 8,
      resistenciaParcialMax: 4, resistenciaTotalMax: 2,
    },
    saves: { astucia: 7, fortitude: 10, reflexos: 9, vontade: 8, integridade: 9 },
    skills: [
      { id: "skill_b21", name: "Intimidação", attribute: "presenca", mastered: true, overrideMod: null, mod: 9 },
      { id: "skill_b22", name: "Atletismo", attribute: "forca", mastered: true, overrideMod: null, mod: 10 },
      { id: "skill_b23", name: "Percepção", attribute: "sabedoria", mastered: true, overrideMod: null, mod: 8 },
      { id: "skill_b24", name: "Acrobacia", attribute: "destreza", mastered: false, overrideMod: null, mod: 4 },
    ],
    defenses: {
      resistencias: [
        { tipo: "contundente", nivel: "resist. parcial" },
        { tipo: "cortante", nivel: "resist. parcial" },
        { tipo: "perfurante", nivel: "resist. parcial" },
      ],
      imunidades: [{ tipo: "medo", nivel: "imune" }, { tipo: "veneno", nivel: "imune" }],
      vulnerabilidades: [{ tipo: "sagrado", nivel: "vulner." }],
      condicoesImunes: ["amedrontado", "dominado"],
    },
    actions: {
      total: { comum: 2, rapida: 1, bonus: 1, movimento: 1, reacao: 2 },
      list: [
        {
          id: "act_b21", name: "Garra da Vingança", type: "comum", cost: 0,
          attackType: "corpo-a-corpo", toHit: 12, cd: null, trType: "",
          damage: { average: 24, roll: "4d8+6", type: "cortante" },
          range: "corpo-a-corpo (3m)", area: "",
          description: "Ataque amplo com as garras ressentidas. Se acertar, inflige Sangramento (fraca) por 1 rodada.",
        },
        {
          id: "act_b22", name: "Grito de Ódio", type: "comum", cost: 6,
          attackType: "", toHit: null, cd: 18, trType: "Vontade",
          damage: { average: 18, roll: "4d6+4", type: "psíquico" },
          range: "pessoal", area: "cone de 9m",
          description: "Todos no cone testam Vontade. Falha: sofrem o dano e ficam Amedrontados (fraca) por 2 rodadas.",
        },
        {
          id: "act_b23", name: "Retribuição Sombria", type: "reacao", cost: 4,
          attackType: "corpo-a-corpo", toHit: 12, cd: null, trType: "",
          damage: { average: 20, roll: "3d10+4", type: "energia amaldiçoada" },
          range: "corpo-a-corpo", area: "",
          description: "Quando é atingido e sofre dano, pode reagir com um contra-ataque imediato. Usa sua reação.",
        },
        {
          id: "act_b24", name: "Expansão: Santuário do Rancor", type: "comum", cost: 20,
          attackType: "", toHit: null, cd: 22, trType: "Vontade",
          damage: { average: 30, roll: "6d8+6", type: "energia amaldiçoada" },
          range: "pessoal", area: "esfera de 15m",
          description: "Expansão de Domínio. Todos os inimigos na área são atingidos automaticamente uma vez (testam Vontade para reduzir à metade). Criaturas de Grau 3+ ficam Amedrontadas (forte) enquanto permanecerem no domínio.",
        },
      ],
    },
    features: [
      {
        id: "feat_b21", category: "Técnica Amaldiçoada",
        name: "Marca da Vingança",
        description: "Qualquer criatura que cause dano ao Youkai recebe uma marca invisível. Ataques do Youkai contra alvos marcados ignoram resistências.",
        trigger: "Passiva",
      },
      {
        id: "feat_b22", category: "Característica",
        name: "Forma Expandida",
        description: "Quando cai abaixo de 50% do HP, ganha +2 em ataques e pode usar 2 ações comuns por turno. Enquanto estiver nesse estado, fica Enfurecido (media).",
        trigger: "Reativa: HP ≤ 50%",
      },
      {
        id: "feat_b23", category: "Aptidão",
        name: "Sentidos Ressentidos",
        description: "Não pode ser surpreendido. Detecta qualquer criatura hostil até 18m de distância, mesmo através de paredes.",
        trigger: "Passiva",
      },
    ],
    narratorNotes: "Nascido da morte de dezenas inocentes durante um massacre. Persegue qualquer descendente dos responsáveis pela tragédia original, sem distinção. Quando usa Expansão de Domínio pela primeira vez, enfraquece: -2 em testes pelo resto do combate.",
    combatState: BUILTIN_COMBAT_STATE(180, 95, 18, 4, 2),
  },
];

// Helper para busca por id (útil no App.jsx)
export const getCompendiumById = (id) =>
  COMPENDIUM.find((c) => c.id === id) ?? null;

// Helper para checar se um id é de built-in
export const isBuiltInId = (id) =>
  typeof id === "string" && id.startsWith("builtin_");