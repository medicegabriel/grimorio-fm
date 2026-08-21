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

/**
 * As categorias de tamanho, com a régua de perícia que cada uma impõe (autor,
 * 2026-08-08). Corpo grande empurra e alcança, corpo pequeno se esconde: é a
 * MESMA magnitude com o sinal trocado nas duas perícias.
 *
 * ⚠ `passo` é a distância de Médio, e é ele que o Motor move. O canal `tamanho`
 * soma degraus, e o resultado é aparado nas pontas da lista: nada abaixo de
 * Minúsculo nem acima de Colossal.
 */
export const AFTY_TAMANHOS = [
  { value: "minusculo", label: "Minúsculo", passo: -2, atletismo: -5,  furtividade: 5 },
  { value: "pequeno",   label: "Pequeno",   passo: -1, atletismo: -2,  furtividade: 2 },
  { value: "medio",     label: "Médio",     passo: 0,  atletismo: 0,   furtividade: 0 },
  { value: "grande",    label: "Grande",    passo: 1,  atletismo: 2,   furtividade: -2 },
  { value: "enorme",    label: "Enorme",    passo: 2,  atletismo: 5,   furtividade: -5 },
  { value: "colossal",  label: "Colossal",  passo: 3,  atletismo: 10,  furtividade: -10 },
];

/** O tamanho de onde toda criatura parte. Só o Motor tira ela daqui. */
export const TAMANHO_BASE = "medio";

const TAMANHO_POR_PASSO = Object.fromEntries(AFTY_TAMANHOS.map((t) => [t.passo, t]));
const PASSO_MIN = Math.min(...AFTY_TAMANHOS.map((t) => t.passo));
const PASSO_MAX = Math.max(...AFTY_TAMANHOS.map((t) => t.passo));

/**
 * A categoria que sai de `degraus` passos a partir de Médio.
 *
 * ⚠ APARA em vez de estourar: uma criatura Colossal que pegue Crescimento
 * Corporal de novo continua Colossal, e o excedente simplesmente não tem para
 * onde ir. Devolver `null` obrigaria todo chamador a tratar o caso.
 */
export function tamanhoPorDegraus(degraus = 0) {
  const passo = Math.min(PASSO_MAX, Math.max(PASSO_MIN, Math.trunc(Number(degraus) || 0)));
  return TAMANHO_POR_PASSO[passo] ?? TAMANHO_POR_PASSO[0];
}

export const getTamanho = (value) =>
  AFTY_TAMANHOS.find((t) => t.value === value) ?? TAMANHO_POR_PASSO[0];

// As origens do Afty ficam em ./afty-origens.js (catálogo de conteúdo).

/**
 * A ficha COMO ELA ESTÁ GRAVADA: o que veio do compêndio mesclado com os
 * defaults, ou a ficha em branco. Merge DEFENSIVO, para os defaults preencherem
 * lacunas de fichas antigas ou parciais sem descartar o que já existe (id, nome,
 * escolhas). Os objetos aninhados são mesclados um a um de propósito: um spread
 * raso trocaria `core` inteiro e perderia os campos que a ficha antiga não tem.
 *
 * Mora aqui, e não no criador, porque a Ficha Final precisa exatamente do mesmo
 * saneamento antes de derivar, e duas cópias divergiriam na primeira errata.
 */
export function mesclaFichaAfty(existente) {
  const blank = createBlankAfty();
  if (!existente) return blank;
  const oficios = Array.isArray(existente.periciaOficios)
    ? existente.periciaOficios
    : (existente.periciaOficio ? [existente.periciaOficio] : []);
  return {
    ...blank,
    ...existente,
    core: { ...blank.core, ...(existente.core || {}) },
    attributes: { ...blank.attributes, ...(existente.attributes || {}) },
    attrNivel: { ...blank.attrNivel, ...(existente.attrNivel || {}) },
    attrLimite: { ...blank.attrLimite, ...(typeof existente.attrLimite === "object" ? existente.attrLimite : {}) },
    tecnicasCombate: {
      ...blank.tecnicasCombate,
      ...(existente.tecnicasCombate && typeof existente.tecnicasCombate === "object"
        ? existente.tecnicasCombate
        : {}),
      armas: Array.isArray(existente.tecnicasCombate?.armas)
        ? existente.tecnicasCombate.armas
        : [],
    },
    aptidoes: { ...blank.aptidoes, ...(existente.aptidoes || {}) },
    reducoesCustoFeitico: {
      ...blank.reducoesCustoFeitico,
      ...(existente.reducoesCustoFeitico && typeof existente.reducoesCustoFeitico === "object"
        ? existente.reducoesCustoFeitico
        : {}),
      manipulacao: Array.isArray(existente.reducoesCustoFeitico?.manipulacao)
        ? [...new Set(existente.reducoesCustoFeitico.manipulacao.filter((id) => typeof id === "string"))]
        : [],
    },
    formulaOverrides: { ...(existente.formulaOverrides || {}) },
    periciaOficios: oficios,
  };
}

/** Ficha Afty em branco — só ESCOLHAS, os stats são derivados. */
export function createBlankAfty() {
  return {
    system: "afty",
    rulesVersion: "afty",
    name: "",
    portraitUrl: null,
    // Ponto focal do retrato, em porcentagem (0 a 100). Vira o `object-position`
    // da imagem, para um retrato de corpo inteiro não cortar a cabeça quando o
    // banner do Preview o recorta. Mesmo campo da 2.5.2.
    portraitFocus: { x: 50, y: 50 },

    core: {
      tipo: "combatente",       // dirige coeficientes
      patamar: "comum",         // multiplica HP, escala Resistência/Atributos
      nd: 20,                   // Nível de Desafio (piso 3 na UI, → ∞ sem teto)
      // ⚠ MORTO desde 2026-08-08, e mantido só para não quebrar ficha antiga na
      // leitura: o tamanho virou DERIVADO (Médio mais o canal `tamanho` do
      // Motor). Nada lê este campo. Ver `tamanhoPorDegraus`.
      tamanho: TAMANHO_BASE,
      tecnicaAttr: "inteligencia", // atributo da Técnica (CD / RD específico)
      tecnicaDescricao: "",        // Funcionamento Básico / "Descrição da Técnica" (texto livre)
      // Efeitos do Funcionamento Básico, programados pelo jogador:
      // [{ canal, alvo?, expr }]. A técnica é ÚNICA NO MUNDO por definição, então
      // nenhum catálogo pode cobri-la: é uma das entradas do sistema em que o
      // efeito é escrito na ficha, junto dos Passivos / Características. Entra no Motor
      // por `efeitosDaTecnica`, e os filtros de estágio roteiam pelo canal, igual
      // a qualquer outra fonte. Mesmo shape do Motor das Ferramentas Amaldiçoadas.
      tecnicaEfeitos: [],
      // Funcionamentos Básicos ADICIONAIS (autor, 2026-08-12): algumas técnicas
      // entregam mais de um (o Ilimitado que também tem os Seis Olhos), e a
      // Cópia permite colocar os dos outros. Cada entrada é
      // `{ id, nome, descricao, efeitos }`, com o mesmo Motor livre do
      // principal. Os dois campos acima seguem sendo o Funcionamento Básico da
      // própria técnica, que é o primeiro da lista e não tem nome (ele É a
      // técnica). Quem junta os dois lados é `funcionamentosDaFicha`.
      funcionamentosAdicionais: [],
      // Origem. Além do `id`, guarda o que ela abre:
      //   cla             — só o Herdado se divide em clãs (`cla_gojo`...)
      //   bonusAtributos  — a escolha +2/+1, ou a distribuição livre
      //   pools           — alocações extras, { [caracteristicaId]: { attr: n } }
      //   escolhas        — escolhas aninhadas, { [escolhaId]: [opcaoId, ...] }
      //   anatomias       — Características de Anatomia (só o Feto Híbrido)
      //   desenvolvimento — Desenvolvimento Inesperado (só o Derivado)
      //   limites         — pool que sobe SÓ o limite (só a Maldição), como
      //                     { attr: quantasVezes }. O degrau (+2) entra no
      //                     resolveLimitePoolOrigem, não aqui.
      //   irmaoMorto      — só os Gêmeos. INTERRUPTOR PERMANENTE, e não estado
      //                     de combate (autor, 2026-08-07): a morte do irmão é
      //                     o segundo estágio da Restrição Celestial e inverte
      //                     quase tudo dela. Fica aqui, e não na sessão da
      //                     Ficha, porque tem de sobreviver ao fim da sessão.
      //   iniciativaIrmao — só os Gêmeos. O bônus de Iniciativa do outro gêmeo,
      //                     DIGITADO. A Dupla Empenhada soma os dois, e o irmão
      //                     é outra ficha: ler a criatura dele do armazenamento
      //                     criaria dependência entre fichas por um bônus só.
      //   pontosPosMorte  — só os Gêmeos. A distribuição que só existe depois
      //                     da morte do irmão, separada do `bonusAtributos`
      //                     porque o limite natural dela é 30, e não 20.
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
    // `null` usa as perícias padrão do livro. Depois da primeira edição, a
    // ordem explícita também diz quais complementares estão ativas.
    periciasOrdem: null,       // [periciaId, ...]
    periciasPersonalizadas: [], // [{ id, nome, atributo }]
    periciaOficio: "",         // legado: migrado para periciaOficios ao abrir
    periciaOficios: [],         // subcategorias de Ofício escolhidas na ficha
    periciasBonus: 0,          // vagas extras vindas de fora ("+ OUTROS" da fórmula)
    resistenciasProf: {},      // { [trValue]: "treinado" | "mestre" }
    ataquesProf: {},           // { corpo: true, distancia: true }
    ataqueFineza: false,       // arma com o traço Fineza: corpo a corpo pode usar Destreza

    // Armas Dedicadas (Lutador 2°). Ids do catálogo de armas, até 3. A escolha
    // é marcada na linha de dano da arma, não num pool dentro da habilidade.
    armasDedicadas: [],

    // Técnicas de Combate (Conjurador 2°). As armas são ids do catálogo e o
    // atributo é uma escolha única, compartilhada pelas duas. O estado de
    // Combate Amaldiçoado não mora aqui: ele pertence à sessão de jogo.
    tecnicasCombate: {
      armas: [],
      atributo: "inteligencia",
    },

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
    // Armas CRIADAS pelo jogador, no mesmo shape das do catálogo (ver ARMAS em
    // afty-equipamentos.js). Elas entram no catálogo de armas pela `catalogoDoTipo`,
    // e a partir daí andam por todos os caminhos que uma arma do livro anda:
    // linha do catálogo, inventário, Ferramenta Amaldiçoada e Arma Dedicada.
    // O id nasce com o prefixo `armc_`, que nenhuma arma do livro usa.
    armasCustom: [],            // [ armaCustom ] — ver novaArmaCustom()

    // Especializações (classes). Até 2, e soma(niveis) === core.nd — o
    // nível de Especialização É o ND. Não mudam cálculo: só destravam
    // Habilidades de Especialização. Ver afty-especializacoes.js.
    especializacoes: [],        // [{ id, nivel }]
    // Feitiços CRIADOS pelo jogador (não é catálogo). Cada um é uma entrada
    // com os campos de criação (nível, tipo, ação, trocas...). O motor em
    // afty-feiticos.js computa dano/alcance/custo/CD. Variações de Liberação
    // (variacaoDe apontando outro feitiço) não contam no orçamento.
    feiticos: [],               // [ feiticoCriado ] — ver afty-feiticos.js
    // Feitiços-base escolhidos pelas Habilidades de Conjurador que reduzem custo.
    // Variações de Liberação herdam a escolha de `variacaoDe` e não aparecem como
    // opções separadas no criador.
    reducoesCustoFeitico: {
      dominancia: null,         // id do Feitiço-base escolhido
      manipulacao: [],          // ids dos Feitiços-base, até o bônus de treinamento
    },
    // Técnicas de Estilo do Novo Estilo da Sombra, o subsistema do SEM TÉCNICA
    // que ocupa o lugar dos Feitiços. Destrava no ND 4 e gasta o MESMO contador
    // que Feitiço e Habilidade Geral gastam. Ver afty-estilo-sombras.js.
    // ⚠ Só o que a criatura CONHECE. A IMBUIÇÃO no Domínio Simples é estado de
    // combate (`combate.estilo_*`), porque é combinação de mesa e troca durante
    // a luta. Duas formas: { id, tipo: "tabela" } e
    // { id, tipo: "especial", nome, descricao, efeitos }.
    estilosSombra: [],
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
    // Escolha de uma Aptidão que oferece "um OU outro", como
    // { [aptidaoId]: valorId }. Só a Superioridade Física tem (atletismo ou
    // acrobacia), e cada valor vira a booleana `opt_<aptidao>_<valor>` no DSL.
    aptidaoOpcoes: {},
    // Expansões de Domínio criadas (ver afty-dominios.js). Uma criatura pode ter
    // várias escritas, mas expande UMA de cada vez: `dominioAtivoId` diz qual
    // está no ar, e é ela que a bancada de combate aplica na ficha.
    dominios: [],
    dominioAtivoId: null,
    // Interlúdios · Treinamentos: mapa { [linhaId]: progresso 0..4 }.
    // Etapas sequenciais; 4 → concede o bônus de Completo. Ver afty-treinamentos.js.
    treinamentos: {},
    // Interlúdios · Treinos Especiais (Interlúdios Adicionais, Livro do
    // Narrador p. 22): lista COM repetição, uma entrada por pega, no mesmo
    // espírito de habilidadesGerais. Cada pega custa 1 Foco do MESMO orçamento
    // dos Treinamentos. `alvo` fica nulo enquanto nenhum Treino Especial pedir
    // um. Ver afty-treinos-especiais.js.
    treinosEspeciais: [],       // [{ id: 'tes_...', alvo: null }]
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

    // Aparência da Ficha Final: preset, cores, imagem de fundo e CSS livre.
    // ⚠ Mora NA CRIATURA (autor, 2026-08-05: "quero mandar minha ficha
    // bonitinha para os outros"), então viaja no export e no import de graça,
    // porque os dois copiam a criatura inteira. Ver ./ficha/ficha-tema.js.
    aparencia: null,

    // ADDONS: as regras próprias da mesa que esta criatura usa, como CÓPIA
    // congelada do pacote (e não referência a uma biblioteca).
    // ⚠ Mesma decisão da `aparencia` logo acima, e pelo mesmo motivo: exportar a
    // ficha exporta as regras dela, então ninguém recebe ficha quebrada e não é
    // preciso servidor de registro nenhum. Quem manda no cálculo é esta cópia,
    // e por isso o addon mudar na biblioteca não mexe sozinho nas fichas
    // antigas. Ver ./afty-addons.js e docs/afty-addons.md.
    addons: [],

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

/* ============================================================ */
/* FUNCIONAMENTOS BÁSICOS                                        */
/* ============================================================ */
/**
 * A técnica tem UM Funcionamento Básico, e algumas entregam mais (autor,
 * 2026-08-12): *"algumas Técnicas entregam Funcionamentos Básicos adicionais.
 * Como o Ilimitado que as vezes também possui os Seis Olhos. E Cópia que
 * permite colocar outros Funcionamentos Básicos."*
 *
 * ⚠ O principal continua morando em `core.tecnicaDescricao` + `core.tecnicaEfeitos`,
 * e os adicionais numa lista à parte. Não foram unificados num array só porque
 * os dois campos são lidos direto em quatro telas e por fichas já salvas: o
 * ganho de simetria não paga a migração. Quem precisa dos dois lados juntos
 * chama esta função, e para ela os dois são iguais.
 *
 * ⚠ Todos eles disputam o POOL EXCLUSIVO na mesma família (autor, mesmo dia):
 * *"Efeitos de dois funcionamentos básicos não funcionam"*, e o Funcionamento
 * Básico também não acumula com Feitiço Ativo, Feitiço Passivo, Ação e
 * Característica de Shikigami, Técnica Marcial ou Novo Estilo das Sombras. Quem
 * carimba é o `efeitosDaTecnica`, em afty-efeitos.js.
 */
export const FUNCIONAMENTO_PRINCIPAL_ID = "tecnica";

/** O rótulo de quem não tem nome próprio: o principal, e o adicional em branco. */
export const FUNCIONAMENTO_NOME_PADRAO = "Funcionamento Básico";

export function funcionamentosDaFicha(creature) {
  const core = creature?.core ?? {};
  const extras = Array.isArray(core.funcionamentosAdicionais) ? core.funcionamentosAdicionais : [];
  return [
    {
      id: FUNCIONAMENTO_PRINCIPAL_ID,
      principal: true,
      // O principal É a técnica, então ele não tem nome próprio.
      nome: FUNCIONAMENTO_NOME_PADRAO,
      descricao: String(core.tecnicaDescricao ?? ""),
      efeitos: Array.isArray(core.tecnicaEfeitos) ? core.tecnicaEfeitos : [],
    },
    // Índice no id de reserva: uma ficha escrita à mão sem `id` ainda rende uma
    // chave estável dentro da mesma lista, em vez de todas colidirem em "".
    ...extras.filter(Boolean).map((f, i) => ({
      id: String(f.id || `fb_${i + 1}`),
      principal: false,
      // ⚠ DUAS versões do nome, e a distinção não é preciosismo (bug de
      // 2026-08-12): `nome` é para EXIBIR (aparado, nunca vazio) e `nomeCru` é o
      // que o jogador digitou. Um campo de edição alimentado pelo aparado não
      // aceita ESPAÇO, porque o caractere é gravado e a releitura o remove antes
      // do próximo caractere chegar: "Seis Olhos" vira "SeisOlhos". Editor lê o
      // cru, tela lê o pronto.
      nome: String(f.nome ?? "").trim() || FUNCIONAMENTO_NOME_PADRAO,
      nomeCru: String(f.nome ?? ""),
      descricao: String(f.descricao ?? ""),
      efeitos: Array.isArray(f.efeitos) ? f.efeitos : [],
    })),
  ];
}

let funcionamentoSeq = 0;

/** Um Funcionamento Básico adicional em branco. Mesmo padrão do createBlankEstiloEspecial. */
export function createBlankFuncionamento() {
  funcionamentoSeq += 1;
  return {
    id: `fb_${Date.now().toString(36)}_${funcionamentoSeq}`,
    nome: "",
    descricao: "",
    efeitos: [],
  };
}
