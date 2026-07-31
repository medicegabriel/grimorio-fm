/**
 * Fábrica e constantes do sistema Afty (runtime).
 * O documento anotado de referência fica em ./creature-schema.js.
 * Fórmulas em ../../../docs/afty-formulas-base.md.
 */

/* ND em que cada trilha de alto nível abre. Moram AQUI, no módulo folha que
   todo mundo importa, e não em afty-alto-nivel.js: afty-gerais.js precisa dos
   dois no corpo do catálogo (tempo de avaliação do módulo) para o pré-requisito
   das Habilidades Gerais Melhoria Superior e Habilidade Lendária. Importar de
   afty-alto-nivel.js funcionaria hoje, mas deixaria armado um ReferenceError de
   TDZ no dia em que alto-nivel importar qualquer coisa de gerais. */
export const MELHORIA_NIVEL_INICIAL = 21;   // ímpares: 21, 23, 25...
export const LENDARIA_NIVEL_INICIAL = 22;   // pares:   22, 24, 26...

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
//
// ⚠ FÓRMULA DA CRIATURA (planilha do autor, 2026-07-27), que DIVERGE da do
// jogador: o livro diz "mod + metade do nível + BT (se treinado)", mas a
// criatura usa a MESMA escala por Tipo da CD e da Defesa no lugar da metade do
// nível. O campo `escala` diz qual:
//   • "cd"     (Astúcia, Vontade)      → Conjurador ND/1,25 · Misto ND/1,5 · Combatente e Restringido ND/1,75
//   • "defesa" (Reflexos, Fortitude)   → Combatente e Restringido ND/1,25 · Misto ND/1,5 · Conjurador ND/1,75
//   • "fixa"   (Integridade)           → ND/1,5 em TODO Tipo
// Sobre isso: + mod do atributo + Maestria (treinado) ou INT(Maestria × 1,5)
// (mestre) + outros bônus. Resolvido em ./afty-pericias.js.
//
// CD padrão de uma habilidade: 10 + metade do nível + mod de um atributo + BT + outros.
// O atributo da CD varia: Habilidades de Especialização especificam (2+ opções),
// Aptidões e Feitiços usam o atributo principal de jujutsu.
// ⚠ ORDEM DEFINIDA PELO AUTOR (2026-07-27), NÃO é a alfabética do livro: os
// dois da escala da Defesa primeiro, depois os dois da escala da CD, e
// Integridade por último. Não "arrumar" para alfabética. A ordem daqui é a
// que sai na aba Perícias, no stat block das Invocações, no Select de TR
// treinável e nos pools de escolha do Alto Nível.
export const AFTY_RESISTENCIAS = [
  { value: "reflexos",    label: "Reflexos",    atributo: "destreza",     escala: "defesa", descricao: "Mede sua velocidade e agilidade para reagir e desviar de efeitos, evitando-os." },
  { value: "fortitude",   label: "Fortitude",   atributo: "constituicao", escala: "defesa", descricao: "Permite resistir a efeitos que busquem afetar e debilitar o corpo." },
  { value: "vontade",     label: "Vontade",     atributo: "sabedoria",    escala: "cd",     descricao: "Mede a capacidade de resistir a ataques, influências e perturbação contra a mente e o espírito." },
  { value: "astucia",     label: "Astúcia",     atributo: "inteligencia", escala: "cd",     descricao: "Mede a capacidade de resistir a sobrecarga de informações e raciocinar rapidamente para defender sua mente." },
  { value: "integridade", label: "Integridade", atributo: "constituicao", escala: "fixa",   descricao: "Mede a resistência da sua alma, indo contra efeitos que busquem a danificar ou modificar." },
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
      nd: 20,                   // Nível de Desafio (piso 3 na UI, → ∞ sem teto)
      tamanho: "medio",
      tecnicaAttr: "inteligencia", // atributo da Técnica (CD / RD específico)
      tecnicaDescricao: "",        // Funcionamento Básico / "Descrição da Técnica" (texto livre)
      // Efeitos do Funcionamento Básico, programados pelo jogador:
      // [{ canal, alvo?, expr }]. A técnica é ÚNICA NO MUNDO por definição, então
      // nenhum catálogo pode cobri-la: é a única entrada do sistema em que o
      // efeito é escrito na ficha, e não escolhido de uma lista. Entram no Motor
      // por `efeitosDaTecnica`, e os filtros de estágio roteiam pelo canal, igual
      // a qualquer outra fonte. Mesmo shape do Motor das Ferramentas Amaldiçoadas.
      tecnicaEfeitos: [],
      // Origem. Além do `id`, guarda o que ela abre:
      //   cla             — só o Herdado se divide em clãs (`cla_gojo`...)
      //   bonusAtributos  — a escolha +2/+1, ou a distribuição livre
      //   pools           — alocações extras, { [caracteristicaId]: { attr: n } }
      //   escolhas        — escolhas aninhadas, { [escolhaId]: [opcaoId, ...] }
      //   anatomias       — Características de Anatomia (só o Feto Híbrido)
      //   desenvolvimento — Desenvolvimento Inesperado (só o Derivado)
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

    // Perícias, Jogadas de Ataque e Testes de Resistência (aba Perícias).
    // Proficiência é { [id]: "treinado" | "mestre" }. Ataque só tem treinado
    // (o Amaldiçoado é sempre treinado, nem entra no mapa). Ver afty-pericias.js.
    pericias: {},              // { [periciaId]: "treinado" | "mestre" }
    periciaOficio: "",         // subcategoria escolhida ao treinar Ofício (Ferreiro...)
    periciasBonus: 0,          // vagas extras vindas de fora ("+ OUTROS" da fórmula)
    resistenciasProf: {},      // { [trValue]: "treinado" | "mestre" }
    ataquesProf: {},           // { corpo: true, distancia: true }
    ataqueFineza: false,       // arma com o traço Fineza: corpo a corpo pode usar Destreza

    // Armas Dedicadas (Lutador 2°). Ids do catálogo de armas, até 3. A escolha
    // é marcada na linha de dano da arma, não num pool dentro da habilidade.
    armasDedicadas: [],

    // ---------- SIMULAÇÃO DE COMBATE ----------
    // Bancada de balanceamento (autor, 2026-07-28): ligar os estados aqui e ver
    // os números do Preview se mexerem, sem precisar rodar a mesa. NÃO é um
    // rastreador de combate: é entrada, como qualquer outra escolha da ficha, e
    // por isso fica salva. Vira variável de DSL e as habilidades com `quando`
    // ligam e desligam sozinhas. Ver ./afty-combate.js.
    combate: {
      ativo: false,             // fora de combate, nada disso vale
      empolgacao: 1,            // Lutador, 1 ao teto (Insistência baixa em 1)
      insistenciaUsada: false,
      manobraAjuste: false,     // Manobras de Empolgação: cada uma é 1x por rodada,
      manobraDesarme: false,    // mas várias cabem na mesma rodada, então são
      manobraEsquiva: false,    // gatilhos independentes e não uma escolha só
      manobraTrabalhoDePes: false,
      manobraFinalizadora: null,   // "circular" | "certeiro" | "cranio"
      brutalidade: false,       // Lutador
      brutalidadePE: 0,         // incrementos de 2 PE além da entrada
      brutalidadePilha: 0,      // pilhas de Brutalidade Sanguinária
      ataqueInconsequente: false,
      impactoMisto: false,      // acertou com arma marcial neste turno
      resistirPE: 0,            // 0 a 2 PE gastos em Resistir
      furiaVinganca: false,
      imprudenciaMotivadora: false,
      machucado: false,         // abaixo da metade dos PV (Sobrevivente)
      abates: 0,                // inimigos caídos, para Eliminar e Continuar
      armasAbsolutas: null,     // "defesa" | "acerto"
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
    // Habilidades Gerais: qualquer origem pode pegar, e gastam o MESMO
    // contador dos Feitiços (dobro da Maestria + patamar, ver afty-gerais.js).
    // Lista COM repetição, igual a melhoriasSuperiores: cada entrada é uma pega.
    habilidadesGerais: [],      // [ 'ger_...' ]
    habilidades: [],            // Habilidades de Especialização (ex-Dotes)
    // Escolhas aninhadas das Habilidades: { [habId]: [opcaoId, ...] }. Guarda
    // qual opção (Estilo de Controle no Apogeu, Melhoria de Controlador...) foi
    // escolhida. Habilidade repetível guarda várias. Ver afty-habilidades.js.
    escolhasHabilidade: {},
    // Escolhas aninhadas dos TALENTOS (o atributo do Incremento, a trilha da
    // Aptidão Desenvolvida, o Estilo do Adepto de Combate). Mapa separado do
    // das Habilidades porque os catálogos são separados.
    escolhasTalento: {},
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
    // Expansões de Domínio criadas (ver afty-dominios.js). Uma criatura pode ter
    // várias escritas, mas expande UMA de cada vez: `dominioAtivoId` diz qual
    // está no ar, e é ela que a bancada de combate aplica na ficha.
    dominios: [],
    dominioAtivoId: null,
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
