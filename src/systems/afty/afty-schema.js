/**
 * Fábrica e constantes do sistema Afty (runtime).
 * O documento anotado de referência fica em ./creature-schema.js.
 * Fórmulas em ../../../docs/afty-formulas-base.md.
 */

export const AFTY_ATTRS = [
  { key: "forca",        abbr: "FOR", label: "Força" },
  { key: "destreza",     abbr: "DES", label: "Destreza" },
  { key: "constituicao", abbr: "CON", label: "Constituição" },
  { key: "inteligencia", abbr: "INT", label: "Inteligência" },
  { key: "sabedoria",    abbr: "SAB", label: "Sabedoria" },
  { key: "presenca",     abbr: "PRE", label: "Presença" }, // Mod.Car nas fórmulas = Presença
];

export const AFTY_TIPOS = [
  { value: "combatente",  label: "Combatente" },
  { value: "misto",       label: "Misto" },
  { value: "conjurador",  label: "Conjurador" },
  { value: "restringido", label: "Restringido" },
];

export const AFTY_PATAMARES = [
  { value: "comum",      label: "Comum" },
  { value: "desafio",    label: "Desafio" },
  { value: "calamidade", label: "Calamidade" },
  { value: "maldicao",   label: "Maldição" },
];

// Quantidade de PE (modifica PE e o total de Aptidões).
export const AFTY_QNT_PE = [
  { value: "muito_pouca",  label: "Muito Pouca" },
  { value: "pouca",        label: "Pouca" },
  { value: "normal",       label: "Normal" },
  { value: "grande",       label: "Grande" },
  { value: "muito_grande", label: "Muito Grande" },
];

// Atributo que dirige a Técnica (CD e RD específico).
export const AFTY_TECNICA_ATTRS = AFTY_ATTRS.map((a) => ({ value: a.key, label: a.label }));

export const AFTY_TAMANHOS = [
  { value: "minusculo", label: "Minúsculo" },
  { value: "pequeno",   label: "Pequeno" },
  { value: "medio",     label: "Médio" },
  { value: "grande",    label: "Grande" },
  { value: "enorme",    label: "Enorme" },
  { value: "colossal",  label: "Colossal" },
];

// As origens do Afty ficam em ./afty-origens.js (catálogo de conteúdo).

// Graus de item (temporário até a aba Inventário existir).
export const AFTY_GRAUS_ITEM = [
  { value: "sem_grau",  label: "Sem Grau" },
  { value: "quarto",    label: "Quarto Grau" },
  { value: "terceiro",  label: "Terceiro Grau" },
  { value: "segundo",   label: "Segundo Grau" },
  { value: "primeiro",  label: "Primeiro Grau" },
  { value: "zero",      label: "Grau Zero" },
  { value: "especial",  label: "Grau Especial" },
];

/** Ficha Afty em branco — só ESCOLHAS, os stats são derivados. */
export function createBlankAfty() {
  return {
    system: "afty",
    rulesVersion: "afty",
    name: "",
    portraitUrl: null,
    portraitFocus: { x: 50, y: 50 },

    core: {
      tipo: "combatente",       // dirige coeficientes
      patamar: "comum",         // multiplica HP, escala Resistência/Atributos
      nd: 1,                    // Nível de Desafio (1 → ∞, sem teto)
      tamanho: "medio",
      tecnicaAttr: "inteligencia", // atributo da Técnica (CD / RD específico)
      origem: { id: "inato" },     // ver ./afty-origens.js
    },

    // Integridade da Alma (0 → 100+). Multiplicador de HP: HP × (atual/100).
    alma: { atual: 100, max: 100 },

    // Quantidade de PE (Muito Pouca … Muito Grande).
    qntPE: "normal",

    // Método de montagem dos atributos (ver ./afty-atributos.js).
    attrMethod: "pontos",   // "pontos" | "fixos" | "rolagem"
    // Limite da alocação (base+nível) POR ATRIBUTO: 20 padrão, elevável a 30
    // por poderes/itens. O valor efetivo (com bônus) vai até o teto duro de 30.
    attrLimite: {
      forca: 20, destreza: 20, constituicao: 20,
      inteligencia: 20, sabedoria: 20, presenca: 20,
    },

    // Valores BASE (do método escolhido).
    attributes: {
      forca: 10, destreza: 10, constituicao: 10,
      inteligencia: 10, sabedoria: 10, presenca: 10,
    },
    // Pontos de nível alocados por cima da base (+2 a cada 4 ND, 1:1).
    attrNivel: {
      forca: 0, destreza: 0, constituicao: 0,
      inteligencia: 0, sabedoria: 0, presenca: 0,
    },

    // Grau de item equipado (temporário; virá do Inventário).
    inventario: { defesaGrau: "sem_grau", rdGrau: "sem_grau", itens: [] },

    especializacoes: [],        // [{ id, nome, nivel }]
    habilidades: [],            // Habilidades de Especialização (ex-Dotes)
    aptidoes: { au: 0, cl: 0, bar: 0, dom: 0 },
    aptidoesAmaldicoadas: [],
    // Interlúdios · Treinamentos: mapa { [linhaId]: progresso 0..4 }.
    // Etapas sequenciais; 4 → concede o bônus de Completo. Ver afty-treinamentos.js.
    treinamentos: {},
    // Orçamento de Focos = ND + bônus de poderes (derivado; ver deriveAfty).
    // "Outros" (poderes que dão treinos) virá do sistema de poderes:
    focosBonus: 0,

    // Aba Cálculos: sobrescreve o VALOR FINAL de um stat (padrão StatField).
    // A edição por fórmula (coeficientes) fica para depois.
    statOverrides: {},

    // Alto nível (21+) — fases finais
    melhoriasSuperiores: [],
    habilidadesLendarias: [],

    narratorNotes: "",

    combatState: {
      isActive: false,
      hpCurrent: 0,
      peCurrent: 0,
      almaCurrent: 100,
      activeConditions: [],
      customCounters: [],
      combatLog: [],
    },
  };
}
