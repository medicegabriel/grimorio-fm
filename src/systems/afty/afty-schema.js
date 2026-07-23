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

// O patamar mais alto se chama "Beyond" (antes "Maldição", nome antigo que ainda
// aparece na transcrição da planilha em docs/afty-formulas-base.md).
export const AFTY_PATAMARES = [
  { value: "comum",      label: "Comum" },
  { value: "desafio",    label: "Desafio" },
  { value: "calamidade", label: "Calamidade" },
  { value: "beyond",     label: "Beyond" },
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

// Testes de Resistência (saves nomeados). O livro diz "divididas em quatro" mas
// LISTA CINCO (inconsistência preservada). Cada um usa um atributo fixo.
// Fórmula (player): TR = d20 + mod(atributo) + metade do nível + BT (se treinado) + outros.
// CD padrão de uma habilidade: 10 + metade do nível + mod de um atributo + BT + outros.
// O atributo da CD varia: Habilidades de Especialização especificam (2+ opções),
// Aptidões e Feitiços usam o atributo principal de jujutsu.
export const AFTY_RESISTENCIAS = [
  { value: "astucia",     label: "Astúcia",     atributo: "inteligencia", descricao: "Mede a capacidade de resistir a sobrecarga de informações e raciocinar rapidamente para defender sua mente." },
  { value: "fortitude",   label: "Fortitude",   atributo: "constituicao", descricao: "Permite resistir a efeitos que busquem afetar e debilitar o corpo." },
  { value: "integridade", label: "Integridade", atributo: "constituicao", descricao: "Mede a resistência da sua alma, indo contra efeitos que busquem a danificar ou modificar." },
  { value: "reflexos",    label: "Reflexos",    atributo: "destreza",     descricao: "Mede sua velocidade e agilidade para reagir e desviar de efeitos, evitando-os." },
  { value: "vontade",     label: "Vontade",     atributo: "sabedoria",    descricao: "Mede a capacidade de resistir a ataques, influências e perturbação contra a mente e o espírito." },
];

export const AFTY_TAMANHOS = [
  { value: "minusculo", label: "Minúsculo" },
  { value: "pequeno",   label: "Pequeno" },
  { value: "medio",     label: "Médio" },
  { value: "grande",    label: "Grande" },
  { value: "enorme",    label: "Enorme" },
  { value: "colossal",  label: "Colossal" },
];

// As origens do Afty ficam em ./afty-origens.js (catálogo de conteúdo).

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
      nd: 3,                    // Nível de Desafio (piso 3 na UI, → ∞ sem teto)
      tamanho: "medio",
      tecnicaAttr: "inteligencia", // atributo da Técnica (CD / RD específico)
      tecnicaDescricao: "",        // Funcionamento Básico / "Descrição da Técnica" (texto livre)
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

    // Equipamentos (aba Equipamentos, ex-Inventário). Defesa vem da modificação
    // do uniforme, RD Físico vem do escudo. O shape dos itens fecha junto com a
    // aba. Ver afty-equipamentos.js.
    equipamentos: { itens: [] },

    // Especializações (classes). Até 2, e soma(niveis) === core.nd — o
    // nível de Especialização É o ND. Não mudam cálculo: só destravam
    // Habilidades de Especialização. Ver afty-especializacoes.js.
    especializacoes: [],        // [{ id, nivel }]
    // Feitiços CRIADOS pelo jogador (não é catálogo). Cada um é uma entrada
    // com os campos de criação (nível, tipo, ação, trocas...). O motor em
    // afty-feiticos.js computa dano/alcance/custo/CD. Variações de Liberação
    // (variacaoDe apontando outro feitiço) não contam no orçamento.
    feiticos: [],               // [ feiticoCriado ] — ver afty-feiticos.js
    habilidades: [],            // Habilidades de Especialização (ex-Dotes)
    // Escolhas aninhadas das Habilidades: { [habId]: [opcaoId, ...] }. Guarda
    // qual opção (Estilo de Controle no Apogeu, Melhoria de Controlador...) foi
    // escolhida. Habilidade repetível guarda várias. Ver afty-habilidades.js.
    escolhasHabilidade: {},
    // Talentos: pegos NO LUGAR de Habilidades de Especialização, então dividem
    // o mesmo orçamento. Acessíveis a qualquer classe e usam o ND, não o nível
    // de especialização. Ver afty-talentos.js.
    talentos: [],
    // Invocações do Controlador (shikigamis / dispositivos). Cada uma é uma
    // ficha própria que lê valores do dono. Ver afty-invocacoes.js.
    invocacoes: [],             // [ fichaInvocacao ]
    // Hordas: cada uma referencia um líder + membros por id (das invocacoes).
    hordas: [],                 // [ { id, nome, liderId, membroIds:[] } ]
    // Níveis de Aptidão, uma trilha por chave (0 a 5). O orçamento é
    // derived.totalAptidao e cada ponto sobe 1 nível. Ver afty-aptidoes.js.
    aptidoes: { au: 0, cl: 0, bar: 0, dom: 0, er: 0 },
    // Aptidões Amaldiçoadas escolhidas (ids do catálogo). Não custam
    // orçamento: são desbloqueadas pelo nível da trilha.
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

    // Alto nível (21+). Orçamentos SEPARADOS e independentes do de
    // Habilidades: uma Melhoria por nível ÍMPAR a partir do 21 e uma Lendária
    // por nível PAR a partir do 22. Ver afty-alto-nivel.js.
    // Melhorias é lista COM repetição (cada entrada = uma escolha, e as que o
    // livro deixa repetir trazem maxVezes). Lendárias não repetem.
    melhoriasSuperiores: [],
    habilidadesLendarias: [],
    // Escolhas aninhadas dos dois (perícia, atributo, Teste de Resistência,
    // recurso do Inesgotável, Habilidade Ápice): { [id]: [opcaoId, ...] }.
    escolhasAltoNivel: {},

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
