/**
 * ============================================================
 * ORIGENS — GRIMÓRIO AFTY (catálogo de conteúdo)
 * ============================================================
 * A origem é a essência da criatura: de onde vêm suas capacidades
 * e o que a destaca de um humano comum. Escolha IMUTÁVEL na criação
 * (salvo casos especiais de mesa).
 *
 * Cada origem concede:
 *   • bônus de atributos           → `bonusAtributos` (fixo) + `bonus` na característica (escolhido)
 *   • características de origem    → `caracteristicas` (escalam com o nível)
 *   • escolhas aninhadas           → `escolha` na característica, resolvida por resolveEscolhasOrigem
 * O Restringido é especial: destrava uma Especialização exclusiva
 *   → `especializacaoExclusivaId`.
 *
 * ⚠ ONDE CADA COISA APLICA
 *   • bônus de ATRIBUTO fica FORA do Motor, no caminho `resolveOrigemAttrBonus`
 *     → `attrBonus` do deriveAfty. Motivo: atributo de origem respeita o LIMITE
 *       do atributo (20 por padrão), e o canal `atributo` do Motor só respeita o
 *       teto duro de 30. São regras diferentes, então são caminhos diferentes.
 *   • todo o RESTO é Motor: os efeitos moram em ORIGEM_EFEITOS / CLA_EFEITOS /
 *     ANATOMIA_EFEITOS / ORIGEM_ESCOLHA_EFEITOS, em afty-efeitos-conteudo.js.
 *
 * ⚠ Texto VERBATIM do livro. O que não tem canal fica registrado como
 * `mesa: true` na característica, para a UI marcar "procedimento de mesa" em vez
 * de fingir que está ligado.
 *
 * ⚠ Ordem do array = ordem do livro, NÃO alfabética (convenção do projeto).
 * ============================================================
 */

import { AFTY_ATTRS, AFTY_RESISTENCIAS } from "./afty-schema";
// Do módulo FOLHA, não de ./afty-pericias.js: os geradores de opção abaixo
// rodam na INICIALIZAÇÃO deste arquivo, e afty-pericias.js puxa afty-efeitos.js,
// que volta até aqui por combate → habilidades → especializações. Ver o
// cabeçalho de afty-pericias-catalogo.js.
import { AFTY_PERICIAS, AFTY_ATAQUES } from "./afty-pericias-catalogo";
/* ⚠ ESTE ARQUIVO SÓ IMPORTA MÓDULOS FOLHA (afty-schema, afty-pericias-catalogo),
   e é de propósito: meio mundo importa `getOrigem` (especializações, aptidões,
   talentos), e qualquer import pesado aqui fecharia ciclo de inicialização com
   o motor. Por isso o coletor de efeitos de origem mora em afty-efeitos.js, que
   importa daqui, e não o contrário. */

const ATTR_LABEL = Object.fromEntries(AFTY_ATTRS.map((a) => [a.key, a.label]));
const FISICOS = ["forca", "destreza", "constituicao"];

/* ============================================================ */
/* GERADORES DE OPÇÃO                                            */
/* ============================================================ */
/* Escolha aninhada de origem tem os mesmos pools que a de Talento (perícia,
   atributo, TR), e pela mesma razão eles são GERADOS dos catálogos que já
   existem, nunca copiados à mão: uma perícia nova entra sozinha.

   O id carrega o que a escolha SIGNIFICA, porque ele é a chave do
   ORIGEM_ESCOLHA_EFEITOS e duas escolhas diferentes não podem colidir. */

/** Perícias treináveis, na ordem do catálogo. Fora as complementares. */
const PERICIAS_BASE = AFTY_PERICIAS.filter((p) => !p.complementar);

/** Uma opção "torne-se Treinado em X" por perícia de `ids` (ou todas). */
const opcoesTreino = (prefixo, ids = null) =>
  PERICIAS_BASE
    .filter((p) => !ids || ids.includes(p.id))
    .map((p) => ({
      id: `${prefixo}_tr_${p.id}`,
      nome: p.nome,
      descricao: `Você se torna treinado em ${p.nome}.`,
      custo: 1,
    }));

/** A alternativa "especialista (Mestre) em uma", que come as duas vagas. */
const opcoesMestre = (prefixo, ids = null) =>
  PERICIAS_BASE
    .filter((p) => !ids || ids.includes(p.id))
    .map((p) => ({
      id: `${prefixo}_ms_${p.id}`,
      nome: `${p.nome} (Especialista)`,
      descricao: `Você se torna especialista em ${p.nome}, no lugar de dois treinamentos.`,
      custo: 2,
    }));

/** "+N em uma perícia à sua escolha." */
const opcoesBonusPericia = (prefixo, valor) =>
  PERICIAS_BASE.map((p) => ({
    id: `${prefixo}_${p.id}`,
    nome: p.nome,
    descricao: `Você recebe +${valor} em testes de ${p.nome}.`,
  }));

/** "+N em um tipo de jogada de ataque ou TR à sua escolha." */
const opcoesAtaqueOuTR = (prefixo, valor) => [
  ...AFTY_ATAQUES.map((a) => ({
    id: `${prefixo}_atq_${a.id}`,
    nome: `Ataque ${a.nome}`,
    descricao: `Você recebe +${valor} em jogadas de ataque ${a.nome}.`,
  })),
  ...AFTY_RESISTENCIAS.map((r) => ({
    id: `${prefixo}_tr_${r.value}`,
    nome: `TR de ${r.label}`,
    descricao: `Você recebe +${valor} em testes de resistência de ${r.label}.`,
  })),
];

/* O Ápice Corporal Humano ("a cada 6 níveis, escolha um desses atributos para
   receber +2") NÃO vira escolha aninhada: o mesmo atributo pode ser escolhido
   de novo, então é ALOCAÇÃO em passos de 2, e não um conjunto de picks. Ver
   `alocacao` no Restringido. */

/* ============================================================ */
/* CLÃS DO HERDADO                                               */
/* ============================================================ */
/* O Herdado é a única origem que se divide: escolher a origem NÃO basta, é
   preciso escolher também o clã, e é o clã que carrega bônus de atributo,
   treinamentos e a herança. A ficha guarda em `core.origem.cla`. */

/* Os três clãs "de estudo" dividem o mesmo pool de treinamento, e Kamo tem o
   dele. Sai numa constante porque o texto é literalmente o mesmo nos três. */
const POOL_ESTUDO = ["feiticaria", "percepcao", "intuicao"];
const POOL_KAMO = ["atletismo", "medicina", "persuasao"];

const treinamentosDeCla = (prefixo, pool) => ({
  id: "treinamentos",
  label: "Treinamentos de Clã",
  // Duas vagas. Um "especialista" custa as duas, que é como o livro escreve a
  // alternativa ("ao invés de receber treinamento em 2 perícias").
  vagas: 2,
  opcoes: [...opcoesTreino(prefixo, pool), ...opcoesMestre(prefixo, pool)],
});

export const CLAS_HERDADO = [
  {
    id: "cla_gojo",
    nome: "Clã Gojo",
    caracteristicas: [
      {
        id: "bonus_atributo",
        nome: "Bônus em Atributo",
        descricao: "Aumenta em 2 a Inteligência ou Sabedoria, e em 1 o que não foi escolhido.",
        bonus: { distribuir: 3, maxPorAtributo: 2, entre: ["inteligencia", "sabedoria"] },
      },
      {
        id: "treinamentos_cla",
        nome: "Treinamentos de Clã",
        descricao:
          "Você se torna treinado em 2 perícias entre Feitiçaria, Percepção e Intuição. Ao invés de " +
          "receber treinamento em 2 perícias, você pode escolher se tornar especialista em uma.",
        escolha: treinamentosDeCla("gojo", POOL_ESTUDO),
      },
      {
        id: "potencial_lendario",
        nome: "Potencial Lendário",
        descricao:
          "Ser parte do clã Gojo confere um potencial de energia extremo, juntamente de uma facilidade " +
          "para desenvolver feitiços. Em todo nível par você recebe 1 ponto de energia amaldiçoada " +
          "adicional. Além disso, você também recebe 1 Feitiço adicional no primeiro nível e mais um " +
          "nos níveis 5, 10, 15 e 20.",
      },
    ],
  },
  {
    id: "cla_inumaki",
    nome: "Clã Inumaki",
    caracteristicas: [
      {
        id: "bonus_atributo",
        nome: "Bônus em Atributo",
        descricao: "Aumenta em 2 a Inteligência ou Presença, e em 1 o que não foi escolhido.",
        bonus: { distribuir: 3, maxPorAtributo: 2, entre: ["inteligencia", "presenca"] },
      },
      {
        id: "treinamentos_cla",
        nome: "Treinamentos de Clã",
        descricao:
          "Você se torna treinado em 2 perícias entre Feitiçaria, Percepção e Intuição. Ao invés de " +
          "receber treinamento em 2 perícias, você pode escolher se tornar especialista em uma.",
        escolha: treinamentosDeCla("inumaki", POOL_ESTUDO),
      },
      {
        id: "olhos_de_cobra_e_presas",
        nome: "Olhos de Cobra e Presas",
        descricao:
          "Os membros do clã Inumaki possuem uma marca única ao redor de sua boca, a qual tem a forma " +
          "dos olhos de uma cobra e presas. Remetendo à técnica herdada do clã, essa marca já concede " +
          "algum poder às palavras de um Inumaki: uma quantidade de vezes igual ao seu bônus de " +
          "treinamento, você pode dar o comando de uma ação bônus para um aliado, o qual pode a realizar " +
          "como uma reação. Você recupera os usos dessa habilidade após um descanso longo.",
        // Concede AÇÃO a um aliado. Não há canal para economia de ação de terceiro.
        mesa: true,
      },
    ],
  },
  {
    id: "cla_kamo",
    nome: "Clã Kamo",
    caracteristicas: [
      {
        id: "bonus_atributo",
        nome: "Bônus em Atributo",
        descricao: "Aumenta em 2 a Constituição ou Sabedoria, e em 1 o que não foi escolhido.",
        bonus: { distribuir: 3, maxPorAtributo: 2, entre: ["constituicao", "sabedoria"] },
      },
      {
        id: "treinamentos_cla",
        nome: "Treinamentos de Clã",
        descricao:
          "Você se torna treinado em 2 perícias entre Atletismo, Medicina e Persuasão. Ao invés de " +
          "receber treinamento em 2 perícias, você pode escolher se tornar especialista em uma.",
        escolha: treinamentosDeCla("kamo", POOL_KAMO),
      },
      {
        id: "valor_do_sangue",
        nome: "Valor do Sangue",
        descricao:
          "Os membros do Clã Kamo compreendem o valor do sangue, e isso os dá uma maior vitalidade. " +
          "Sempre que subir de nível, sua vida máxima aumenta em 1 ponto adicional. A partir do nível 10, " +
          "você soma o seu modificador de Constituição ao seu total de vida. Caso, ao subir de nível, você " +
          "role para aumentar a sua vida máxima e o valor obtido seja menor do que a média, você pode " +
          "rolar novamente e ficar com o maior valor.",
      },
    ],
  },
  {
    id: "cla_zenin",
    nome: "Clã Zenin",
    caracteristicas: [
      {
        id: "bonus_atributo",
        nome: "Bônus em Atributo",
        descricao:
          "Recebe 3 pontos para distribuir entre seus atributos, com um máximo de 2 pontos no " +
          "mesmo atributo.",
        bonus: { distribuir: 3, maxPorAtributo: 2 },
      },
      {
        id: "treinamentos_cla",
        nome: "Treinamentos de Clã",
        descricao:
          "Você se torna treinado em 2 perícias quaisquer. Ao invés de receber treinamento em 2 perícias, " +
          "você pode escolher se tornar especialista em uma.",
        // Pool LIVRE: não vira escolha aninhada, vira orçamento. O Mestre já
        // custa 2 vagas na aba Perícias, então "2 treinadas ou 1 especialista"
        // é literalmente "+2 vagas de treino", sem UI nova.
      },
      {
        id: "foco_no_poder",
        nome: "Foco no Poder",
        descricao:
          "O clã Zenin se dedica completamente ao poder e aprimoramento das suas técnicas, ampliando o " +
          "potencial delas e de suas habilidades. No primeiro nível, você pode escolher um Feitiço para ser " +
          "um Feitiço Focado. Um Feitiço Focado pode: causar um dado de dano a mais, curar um dado de vida " +
          "a mais, ter o dobro do alcance ou ter a dificuldade do teste para resistir aumentada em um valor " +
          "igual ao seu bônus de treinamento. Nos níveis 5, 10, 15 e 20 você pode escolher outro Feitiço " +
          "para ser um Feitiço Focado.",
        // A marcação é POR FEITIÇO e muda um parâmetro da criação dele, então
        // mora na aba Habilidades / Feitiços, não aqui. Só o CONTADOR sai daqui.
        contador: { nome: "Feitiços Focados", niveis: [1, 5, 10, 15, 20] },
        mesa: true,
      },
    ],
  },
];

const CLA_BY_ID = Object.fromEntries(CLAS_HERDADO.map((c) => [c.id, c]));
export const getCla = (id) => CLA_BY_ID[id] ?? null;

/* ============================================================ */
/* CATÁLOGO DE ORIGENS                                           */
/* ============================================================ */

export const AFTY_ORIGENS_CATALOG = [
  {
    id: "inato",
    nome: "Inato",
    bonusAtributos: {},
    caracteristicas: [
      {
        id: "bonus_atributo",
        nome: "Bônus em Atributo",
        descricao:
          "Recebe 3 pontos para distribuir entre seus atributos, com um máximo de 2 pontos no " +
          "mesmo atributo.",
        bonus: { distribuir: 3, maxPorAtributo: 2 },
      },
      {
        id: "talento_natural",
        nome: "Talento Natural",
        descricao:
          "Recebe um Talento à escolha no 1° nível. Uma única vez, a partir do 4° nível, pode " +
          "escolher receber um Talento adicional ao subir de nível.",
        // Talento gasta o MESMO orçamento das Habilidades de Especialização, então
        // "um Talento" é uma vaga de habilidade. Mesma leitura do Empenho
        // Implacável do Sem Técnica, que já resolvia assim.
        // → ORIGEM_EFEITOS.inato, canal vagasHabilidade: 1 + (nd >= 4).
      },
      {
        id: "marca_registrada",
        nome: "Marca Registrada",
        descricao: "Recebe um Feitiço adicional, com o custo reduzido em 1 PE.",
        // A VAGA está ligada (canal vagasFeitico, que é a vaga exclusiva de
        // Feitiço e não serve para Habilidade Geral).
        //
        // ⚠ A REDUÇÃO DE 1 PE não está: ela vale só para AQUELE feitiço, e o
        // canal `custoPE` não tem alvo. Mais fundo que isso, `afty-feiticos.js`
        // não lê o Motor (só a CD chega), então nenhum canal alcança o custo de
        // um feitiço hoje. Entra junto com a passada dos Feitiços.
        parcial: "A redução de 1 PE espera o motor de Feitiços ler o Motor de Automação.",
      },
    ],
    especializacaoExclusivaId: null,
  },
  {
    id: "derivado",
    nome: "Derivado",
    bonusAtributos: {},
    caracteristicas: [
      {
        id: "bonus_atributo",
        nome: "Bônus em Atributo",
        descricao:
          "Recebe 3 pontos para distribuir entre seus atributos, com um máximo de 2 pontos no " +
          "mesmo atributo.",
        bonus: { distribuir: 3, maxPorAtributo: 2 },
      },
      {
        id: "energia_antinatural",
        nome: "Energia Antinatural",
        descricao:
          "Sua energia deriva de uma fonte anormal. Recebe uma Aptidão Amaldiçoada de Aura (deve atender " +
          "os requisitos). Além disso, uma vez por dia, como Ação Bônus em combate, recupera energia " +
          "amaldiçoada igual ao dobro do seu bônus de treinamento.",
        // → ORIGEM_EFEITOS.derivado, canal vagasAptidao: 1.
        //
        // ⚠ RESOLVE uma pergunta que estava aberta no status desde 2026-07-16
        // ("essa concessão gasta o orçamento de aptidões ou é grátis?"). É vaga,
        // e não gasto, por duas razões: o alvo é NOMEADO (a convenção do projeto
        // é concessão direcionada ser grátis) e, depois que o ND parou de conceder
        // Aptidão Amaldiçoada, o orçamento sem a Habilidade Geral é ZERO, então
        // gastar do orçamento faria a característica não fazer nada.
        //
        // ⚠ ASSUMIDO: a vaga é genérica, não presa à categoria Aura. Não existe
        // vaga por categoria, e prender exigiria um canal novo.
        //
        // A recuperação de PE (2× Maestria, 1/dia) é recurso de cena, não stat.
        parcial: "A recuperação de PE (2× Maestria, uma vez por dia) é procedimento de mesa.",
      },
      {
        id: "desenvolvimento_inesperado",
        nome: "Desenvolvimento Inesperado",
        descricao:
          "A cada quatro níveis, recebe um ponto de atributo adicional e aumenta em 1 o limite do atributo escolhido.",
        // Mexe no pool de pontos de atributo E no limite por atributo: caminho
        // próprio (`core.origem.desenvolvimento`), fora do Motor, igual ao bônus.
        // Alocador na aba de Atributos, e o limite entra em `attrLimiteEfetivo`.
        afetaAtributos: true,
      },
    ],
    especializacaoExclusivaId: null,
  },
  {
    id: "herdado",
    nome: "Herdado",
    // A única origem que se DIVIDE: escolher Herdado não basta, é preciso
    // escolher o clã, e é ele que carrega atributo, treinamento e herança.
    clas: CLAS_HERDADO,
    bonusAtributos: {},
    caracteristicas: [
      {
        id: "bonus_atributo",
        nome: "Bônus em Atributo",
        descricao: "Um herdeiro recebe aumentos no valor de atributos baseado no seu clã escolhido.",
        doCla: true,
      },
      {
        id: "treinamentos_de_cla",
        nome: "Treinamentos de Clã",
        descricao: "Cada clã concede treinamento ou te torna especialista em perícias específicas.",
        doCla: true,
      },
      {
        id: "heranca_de_cla",
        nome: "Herança de Clã",
        descricao:
          "Um herdeiro tem técnicas e capacidades herdadas a partir da sua linhagem, destacando os valores " +
          "e focos dela. Tal herança depende do clã escolhido para o personagem.",
        doCla: true,
      },
    ],
    especializacaoExclusivaId: null,
  },
  {
    id: "restringido",
    nome: "Restringido",
    // "Força, Destreza e Constituição aumentados em 1" é FIXO, e os 2 pontos
    // adicionais são a alocação da característica abaixo.
    bonusAtributos: { forca: 1, destreza: 1, constituicao: 1 },
    // "Seu limite de atributo para Força, Destreza e Constituição é 30 ao invés
    // de 20" (Ápice Corporal Humano). Sobe o limite EFETIVO no deriveAfty.
    limiteAtributo: { forca: 30, destreza: 30, constituicao: 30 },
    caracteristicas: [
      {
        id: "bonus_atributo",
        nome: "Bônus em Atributo",
        descricao:
          "Um restringido tem os seus valores de Força, Destreza e Constituição aumentados em 1, além de " +
          "receber 2 pontos adicionais para distribuir entre os seus atributos físicos.",
        bonus: { distribuir: 2, maxPorAtributo: 2, entre: FISICOS },
      },
      {
        id: "fisico_abencoado",
        nome: "Físico Abençoado",
        descricao:
          "Seu físico é esculpido de maneira única, potencializando suas capacidades. Seu Deslocamento " +
          "aumenta em 3 metros, você se torna imune a doenças mundanas e recebe vantagem em testes de " +
          "resistência contra venenos, em um descanso curto você adiciona metade do seu bônus de treinamento " +
          "à quantidade de dados curados. Além disso, você recebe acesso a especialização Restringido.",
      },
      {
        id: "apice_corporal_humano",
        nome: "Ápice Corporal Humano",
        descricao:
          "Seu corpo tem um potencial extraordinário, sendo capaz de alcançar o ápice das capacidades " +
          "físicas humanas. Seu limite de atributo para Força, Destreza e Constituição é 30 ao invés de 20. " +
          "Além disso, a cada 6 níveis, escolha um desses atributos para receber +2 em seu valor. Sempre que " +
          "realizar um teste de Atletismo para erguer peso ou saltar distâncias, dobre o limite de peso ou a " +
          "distância saltada.",
        // "a cada 6 níveis, escolha UM DESSES atributos": alocação em passos de
        // 2, e o mesmo atributo pode receber de novo. Vai para um pool próprio
        // (`core.origem.pools.apice_corporal_humano`) para não brigar com o
        // "Bônus em Atributo", que também escreve atributo.
        alocacao: { id: "apice_corporal_humano", porNivel: 6, valor: 2, entre: FISICOS },
      },
      {
        id: "resiliencia_imediata",
        nome: "Resiliência Imediata",
        descricao:
          "Seu corpo é mais resistente do que o padrão humano, permitindo-o encarar a dor facilmente. Uma " +
          "quantidade de vezes igual ao seu bônus de treinamento, ao receber dano, você pode escolher reduzir " +
          "esse dano em um valor igual à metade do seu nível (mínimo 1) multiplicado por 5. Alternativamente, " +
          "você pode escolher gastar um uso dessa habilidade para evitar um desmembramento. Você recupera os " +
          "usos após um descanso longo.",
        // Reação com usos por descanso, e a redução é de UM golpe, não RD.
        mesa: true,
      },
    ],
    // Vinculada a uma Especialização que SÓ pode ser acessada com esta origem.
    // A trava vale nos dois sentidos e também prende o TIPO em Restringido,
    // além de proibir multiclasse (autor, 2026-07-17). Quem implementa é
    // ./afty-especializacoes.js — este campo é a declaração do vínculo.
    especializacaoExclusivaId: "restringido",
  },
  {
    id: "feto_amaldicoado_hibrido",
    nome: "Feto Amaldiçoado Híbrido",
    bonusAtributos: {},
    caracteristicas: [
      {
        id: "bonus_atributo",
        nome: "Bônus em Atributo",
        descricao:
          "Recebe 3 pontos para distribuir entre seus atributos, com um máximo de 2 pontos no " +
          "mesmo atributo.",
        bonus: { distribuir: 3, maxPorAtributo: 2 },
      },
      {
        id: "heranca_maldita",
        nome: "Herança Maldita",
        descricao:
          "Como um híbrido entre humano e maldição, você carrega uma herança amaldiçoada. Toda cura que você " +
          "receber provinda de energia reversa é reduzida pela metade. Caso obtenha uma habilidade de energia " +
          "reversa de cura, você pode a utilizar tratando a energia reversa como energia amaldiçoada, curando-se " +
          "o valor completo. Ao invés de 1 ponto de energia reversa, você gasta diretamente 2 pontos de energia " +
          "amaldiçoada.",
        // Troca a MOEDA de uma cura que ainda não existe como sistema.
        mesa: true,
      },
      {
        id: "fisico_amaldicoado",
        nome: "Físico Amaldiçoado",
        descricao:
          "Sendo meio maldição, o seu físico é único, desenvolvendo um corpo com propriedades especiais. Você " +
          "recebe uma Característica de Anatomia. A cada 5 níveis, seu corpo desenvolve mais, dando-o outra " +
          "característica de anatomia.",
        poolAnatomia: { base: 1, porNivel: 5 },
      },
      {
        id: "vigor_maldito",
        nome: "Vigor Maldito",
        descricao:
          "Você pode, uma vez por descanso longo, usar uma ação bônus para recuperar uma quantidade de pontos " +
          "de vida igual a 5 + seu mod. de constituição. Nos níveis 4, 8, e 12 você recebe um uso adicional " +
          "desta característica, assim como o valor base da cura aumenta em 5. Caso possua mais de um uso, você " +
          "pode escolher gastar mais usos simultaneamente, aumentando a cura.",
        // Cura ativa com usos por descanso: recurso de cena, não stat.
        mesa: true,
      },
    ],
    especializacaoExclusivaId: null,
  },
  {
    id: "sem_tecnica",
    nome: "Sem Técnica",
    restricoes: ["Sem técnica e sem acesso a Feitiços.", "Não pode ter a especialização Especialista em Técnicas."],
    bonusAtributos: {},
    caracteristicas: [
      {
        id: "bonus_atributo",
        nome: "Bônus em Atributo",
        descricao:
          "Um sem técnica recebe 4 pontos adicionais para distribuir entre seus atributos, com um máximo de " +
          "3 pontos no mesmo atributo.",
        bonus: { distribuir: 4, maxPorAtributo: 3 },
      },
      {
        id: "estudos_dedicados",
        nome: "Estudos Dedicados",
        descricao: "Um sem técnica se dedica muito em seus estudos, você se torna treinado em 2 perícias a sua escolha.",
        // Pool livre: vira orçamento na aba Perícias, igual ao Zenin.
      },
      {
        id: "empenho_implacavel",
        nome: "Empenho Implacável",
        descricao:
          "Para compensar pela falta de uma técnica, você se empenha de maneira implacável, sempre buscando " +
          "evoluir na dedicação e no treino. Além disso, no 4° nível, você recebe acesso ao Novo Estilo da " +
          "Sombra e, por meio do funcionamento básico deste, recebe a aptidão amaldiçoada Domínio Simples.",
        niveis: [
          { nd: 1,  texto: "um Talento OU Aptidão Amaldiçoada (escolha)" },
          { nd: 3,  texto: "+1 em 2 perícias e +1 em um tipo de ataque ou TR (escolha)" },
          { nd: 4,  texto: "acesso ao Novo Estilo da Sombra → Aptidão Amaldiçoada Domínio Simples" },
          { nd: 6,  texto: "uma Habilidade de Especialização adicional" },
          { nd: 10, texto: "um Talento OU Aptidão Amaldiçoada (escolha)" },
          { nd: 13, texto: "+2 em 2 perícias e +1 em um tipo de ataque ou TR (escolha)" },
          { nd: 15, texto: "uma Habilidade de Especialização adicional" },
          { nd: 17, texto: "+3 em 2 perícias e +2 em um tipo de ataque ou TR (escolha)" },
          { nd: 19, texto: "uma Habilidade de Especialização e um Talento adicional" },
        ],
        // Cada degrau com "à sua escolha" vira uma escolha aninhada própria. Os
        // degraus SEM escolha (6, 15, 19) são vaga direta e saem pelo Motor.
        //
        // ⚠ ASSUMIDO: os degraus de perícia dos níveis 3, 13 e 17 são grants
        // SEPARADOS, e não um upgrade do mesmo par. É a leitura literal ("recebe
        // um bônus de +1 em 2 perícias" / "recebe um bônus de +2 em 2 perícias"),
        // mas empilha seis perícias no ND 17. A confirmar com o autor.
        escolhas: [
          {
            id: "empenho_1",
            label: "Nível 1",
            vagas: 1,
            ndMin: 1,
            opcoes: [
              { id: "st_n1_talento", nome: "Talento", descricao: "Você recebe um Talento adicional." },
              { id: "st_n1_aptidao", nome: "Aptidão Amaldiçoada", descricao: "Você recebe uma Aptidão Amaldiçoada adicional." },
            ],
          },
          {
            id: "empenho_3_pericias",
            label: "Nível 3 · Perícias",
            vagas: 2,
            ndMin: 3,
            opcoes: opcoesBonusPericia("st_n3_per", 1),
          },
          {
            id: "empenho_3_jogada",
            label: "Nível 3 · Ataque ou TR",
            vagas: 1,
            ndMin: 3,
            opcoes: opcoesAtaqueOuTR("st_n3", 1),
          },
          {
            id: "empenho_10",
            label: "Nível 10",
            vagas: 1,
            ndMin: 10,
            opcoes: [
              { id: "st_n10_talento", nome: "Talento", descricao: "Você recebe um Talento adicional." },
              { id: "st_n10_aptidao", nome: "Aptidão Amaldiçoada", descricao: "Você recebe uma Aptidão Amaldiçoada adicional." },
            ],
          },
          {
            id: "empenho_13_pericias",
            label: "Nível 13 · Perícias",
            vagas: 2,
            ndMin: 13,
            opcoes: opcoesBonusPericia("st_n13_per", 2),
          },
          {
            id: "empenho_13_jogada",
            label: "Nível 13 · Ataque ou TR",
            vagas: 1,
            ndMin: 13,
            opcoes: opcoesAtaqueOuTR("st_n13", 1),
          },
          {
            id: "empenho_17_pericias",
            label: "Nível 17 · Perícias",
            vagas: 2,
            ndMin: 17,
            opcoes: opcoesBonusPericia("st_n17_per", 3),
          },
          {
            id: "empenho_17_jogada",
            label: "Nível 17 · Ataque ou TR",
            vagas: 1,
            ndMin: 17,
            opcoes: opcoesAtaqueOuTR("st_n17", 2),
          },
        ],
      },
    ],
    especializacaoExclusivaId: null,
  },
  {
    id: "corpo_amaldicoado_mutante",
    nome: "Corpo Amaldiçoado Mutante",
    bonusAtributos: {},
    // ⚠ VAZIA: o texto desta origem nunca foi enviado. Ela aparece na lista e
    // não concede nada. Não confundir com a Maldição, que é outra origem.
    caracteristicas: [],
    especializacaoExclusivaId: null,
  },
  {
    id: "maldicao",
    nome: "Maldição",
    // ⚠ O id `maldicao` já era esperado por `abasAptidao` (afty-aptidoes.js) e
    // pelas 18 Aptidões de Maldição desde 2026-07-16. A origem em si só entrou
    // em 2026-08-01, e até lá aquele conteúdo era inalcançável: ninguém tinha
    // como escolher a origem que o destrava.
    //
    // ⚠ "Maldição" aqui é a ORIGEM. O PATAMAR que se chamava Maldição virou
    // Beyond em 2026-07-16, e os dois não têm relação.
    bonusAtributos: {},
    caracteristicas: [
      {
        id: "bonus_atributo",
        nome: "Bônus em Atributo",
        descricao:
          "Uma maldição recebe 4 pontos adicionais para distribuir entre os seus atributos, com um " +
          "máximo de 3 pontos no mesmo atributo. A cada 4 níveis, você pode aumentar o limite de um " +
          "atributo em 2.",
        bonus: { distribuir: 4, maxPorAtributo: 3 },
        // Pool que sobe SÓ o limite, ao contrário do Desenvolvimento Inesperado
        // do Derivado, que sobe valor e limite juntos. A cadência de 4 níveis é
        // a mesma dele, e o degrau é 2 em vez de 1.
        poolLimite: { porNivel: 4, valor: 2 },
      },
      {
        id: "existencia_metafisica",
        nome: "Existência Metafísica",
        descricao:
          "Sua existência é composta de energia amaldiçoada pura. Você não pode ser percebido nem " +
          "tocado por pessoas que não sejam feiticeiros, com exceção a situações de morte. Você é " +
          "imune a dano que não provenha de energia amaldiçoada (ferramentas amaldiçoadas, golpes " +
          "imbuídos com energia, técnicas amaldiçoadas). Entretanto, você é vulnerável a dano de " +
          "energia reversa.",
        // Imunidade e vulnerabilidade por ORIGEM do dano, mais um recorte de
        // percepção. Nada disso é número de ficha, e o Afty não tem sistema de
        // imunidade nem de dano por origem.
        mesa: true,
      },
      {
        id: "natureza_amaldicoada",
        nome: "Natureza Amaldiçoada",
        descricao:
          "Com uma natureza que deriva da própria energia, você já surgiu mais familiarizado com ela " +
          "e consegue atingir novos patamares mais facilmente. Você recebe uma aptidão amaldiçoada a " +
          "sua escolha, e outra no 10° e 15° nível, as quais você deve atender os requisitos. Além " +
          "disso, você recebe 1 ponto de energia amaldiçoada adicional por nível.",
        // → ORIGEM_EFEITOS.maldicao: vagasAptidao 1 + (nd>=10) + (nd>=15), e pe = nd.
      },
    ],
    especializacaoExclusivaId: null,
  },
];

// Opções para <Select> (value/label).
export const AFTY_ORIGENS = AFTY_ORIGENS_CATALOG.map((o) => ({ value: o.id, label: o.nome }));

const BY_ID = Object.fromEntries(AFTY_ORIGENS_CATALOG.map((o) => [o.id, o]));

export const getOrigem = (id) => BY_ID[id] ?? null;

/** Clãs da origem, se ela se divide (só o Herdado, por ora). */
export const clasDaOrigem = (id) => getOrigem(id)?.clas ?? null;

/**
 * Características EFETIVAS: as da origem mais as do clã escolhido. As do
 * Herdado que só dizem "depende do clã" (`doCla`) somem assim que há clã, para
 * a UI não mostrar a promessa e o conteúdo lado a lado.
 */
export function caracteristicasEfetivas(creature) {
  const origem = getOrigem(creature?.core?.origem?.id);
  if (!origem) return [];
  const cla = getCla(creature?.core?.origem?.cla);
  const proprias = origem.caracteristicas || [];
  if (!cla) return proprias;
  return [...proprias.filter((c) => !c.doCla), ...(cla.caracteristicas || [])];
}

/* O `getOrigemAttrChoice` foi REMOVIDO em 2026-07-29. Ele procurava a
   característica com `bonus.escolhaDoJogador`, o shape do par de dropdowns
   "+2 em / +1 em", que deixou de existir quando todo bônus de atributo virou
   alocador (`distribuir`). Não tinha consumidor nenhum, era código morto desde
   antes. Quem lê o bônus é o `resolveOrigemAttrBonus`, logo abaixo, e ele não
   olha o shape: soma `core.origem.bonusAtributos` direto. */

/**
 * Resolve o bônus de atributo EFETIVO da origem para uma criatura: junta o
 * bônus FIXO do catálogo (`bonusAtributos`), a ESCOLHA do jogador
 * (`core.origem.bonusAtributos`) e as alocações extras (`core.origem.pools`,
 * hoje só o Ápice Corporal). Retorna { attrKey: pontos }.
 *
 * ⚠ Fica FORA do Motor de propósito: atributo de origem respeita o LIMITE do
 * atributo, e o canal `atributo` só respeita o teto duro de 30.
 */
export function resolveOrigemAttrBonus(creature) {
  const origem = getOrigem(creature?.core?.origem?.id);
  const out = { ...(origem?.bonusAtributos || {}) };
  const somar = (mapa) => {
    for (const [k, v] of Object.entries(mapa || {})) {
      const n = Math.trunc(Number(v) || 0);
      if (n) out[k] = (out[k] || 0) + n;
    }
  };
  somar(creature?.core?.origem?.bonusAtributos);
  for (const pool of Object.values(creature?.core?.origem?.pools || {})) somar(pool);
  return out;
}

/**
 * Limite de atributo que a ORIGEM eleva, por atributo. O Ápice Corporal Humano
 * do Restringido diz "Seu limite de atributo para Força, Destreza e Constituição
 * é 30 ao invés de 20". Devolve {} para quem não tem.
 */
export const limiteAtributoDaOrigem = (id) => getOrigem(id)?.limiteAtributo ?? {};

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

/** Configuração do pool de LIMITE da origem, ou null. Hoje só a Maldição tem. */
export const origemPoolLimite = (id) =>
  getOrigem(id)?.caracteristicas?.find((c) => c.poolLimite)?.poolLimite ?? null;

/**
 * Quanto a origem SOBE O LIMITE de cada atributo (Maldição, "a cada 4 níveis
 * você pode aumentar o limite de um atributo em 2").
 *
 * ⚠ Irmão do resolveDesenvolvimento, e a diferença é toda: aqui o ponto sobe só
 * o LIMITE, e não o valor. Guardado em `creature.core.origem.limites` como
 * QUANTAS vezes cada atributo foi escolhido, e é aqui que o degrau (2) entra,
 * para o contador da UI contar escolhas e a ficha somar pontos de limite.
 */
export function resolveLimitePoolOrigem(creature) {
  const cfg = origemPoolLimite(creature?.core?.origem?.id);
  if (!cfg) return {};
  const escolhas = creature?.core?.origem?.limites || {};
  const out = {};
  for (const [k, n] of Object.entries(escolhas)) {
    const vezes = Math.max(0, Math.trunc(Number(n) || 0));
    if (vezes) out[k] = vezes * (cfg.valor ?? 1);
  }
  return out;
}

/* ============================================================ */
/* ALOCAÇÕES E ESCOLHAS ANINHADAS                                */
/* ============================================================ */

/** Toda alocação de atributo declarada pela origem (com o clã junto). */
export function alocacoesDaOrigem(creature) {
  return caracteristicasEfetivas(creature).map((c) => c.alocacao).filter(Boolean);
}

/** Quantos pontos uma alocação dá no ND: fixo, ou 1 a cada `porNivel` níveis. */
export const totalDaAlocacao = (aloc, nd = 1) =>
  aloc?.porNivel ? Math.floor((nd ?? 1) / aloc.porNivel) : (aloc?.quantidade ?? 0);

/** Pontos já gastos num pool de alocação (o mapa é { attr: valor somado }). */
export const usoDaAlocacao = (aloc, pool = {}) =>
  Object.values(pool || {}).reduce((s, v) => s + Math.trunc(Number(v) || 0), 0) / (aloc?.valor || 1);

/**
 * Toda escolha aninhada declarada pela origem e pelo clã, achatada, com a
 * característica dona junto (a UI agrupa por ela).
 */
export function escolhasDaOrigem(creature) {
  const out = [];
  for (const c of caracteristicasEfetivas(creature)) {
    if (c.escolha) out.push({ ...c.escolha, caracteristica: c });
    for (const e of c.escolhas || []) out.push({ ...e, caracteristica: c });
  }
  return out;
}

/**
 * Resolve as escolhas aninhadas de origem. Irmã da resolveEscolhasTalento, com
 * duas diferenças que vêm do próprio catálogo:
 *
 *   • as vagas são um ORÇAMENTO em pontos, não uma contagem de picks, porque a
 *     alternativa "especialista em uma no lugar de duas treinadas" é literalmente
 *     uma opção que custa 2 (`custo` na opção, 1 por padrão);
 *   • um degrau só abre no ND dele (`ndMin`), então a escolha do nível 17
 *     simplesmente não existe numa criatura de ND 3.
 *
 * Guarda escolhas, nunca resultados, e não remove excedente: reporta em
 * `excedeu`, que é o padrão do projeto.
 */
export function resolveEscolhasOrigem(creature, nd = 1) {
  const porEscolha = {};
  const mapa = {};
  const guardadas = creature?.core?.origem?.escolhas || {};
  for (const esc of escolhasDaOrigem(creature)) {
    if (esc.ndMin != null && nd < esc.ndMin) continue;
    const custoDe = Object.fromEntries(esc.opcoes.map((o) => [o.id, o.custo ?? 1]));
    const brutas = Array.isArray(guardadas[esc.id]) ? guardadas[esc.id] : [];
    const vistos = new Set();
    const opcoes = [];
    for (const id of brutas) {
      if (custoDe[id] == null || vistos.has(id)) continue;
      vistos.add(id);
      opcoes.push(id);
    }
    const gasto = opcoes.reduce((s, id) => s + custoDe[id], 0);
    const vagas = esc.vagas ?? 1;
    porEscolha[esc.id] = {
      id: esc.id, label: esc.label, vagas, gasto, opcoes,
      caracteristicaId: esc.caracteristica?.id ?? null,
      excedeu: gasto > vagas,
    };
    mapa[esc.id] = opcoes;
  }
  return { porEscolha, mapa };
}

/**
 * Nome de cada OPÇÃO de escolha de origem, por id. Irmão do OPCAO_TALENTO_NOME,
 * e serve ao mesmo fim: rotular a fonte de um número no hover da UI, já que o
 * efeito é chaveado pela opção e não pela origem.
 */
export const OPCAO_ORIGEM_NOME = (() => {
  const out = {};
  const anota = (lista) => {
    for (const c of lista || []) {
      for (const esc of [c.escolha, ...(c.escolhas || [])]) {
        for (const o of esc?.opcoes || []) if (o?.id && !out[o.id]) out[o.id] = o.nome ?? o.id;
      }
    }
  };
  for (const o of AFTY_ORIGENS_CATALOG) anota(o.caracteristicas);
  for (const c of CLAS_HERDADO) anota(c.caracteristicas);
  return out;
})();

/* ============================================================ */
/* EFEITOS DAS OPÇÕES                                            */
/* ============================================================ */
/**
 * O que cada OPÇÃO de escolha de origem faz na ficha.
 *
 * ⚠ Mora AQUI, e não em afty-efeitos-conteudo.js como todo o resto do Motor,
 * porque os ids das opções são GERADOS dos catálogos de perícia, ataque e TR
 * (ver os helpers no topo). Escrever os efeitos noutro arquivo obrigaria ou a
 * repetir a lista de perícias à mão, ou a dar um import ao arquivo de conteúdo,
 * que é dado puro por regra. Os mapas ESTÁTICOS de origem (ORIGEM_EFEITOS,
 * CLA_EFEITOS, ANATOMIA_EFEITOS) continuam lá, onde devem estar.
 *
 * A chave é a OPÇÃO, então quem escolheu outra coisa não recebe nada.
 */
export const ORIGEM_ESCOLHA_EFEITOS = (() => {
  const out = {};

  // Treinamentos de Clã. O "especialista em uma no lugar de duas treinadas" é a
  // opção de custo 2 que emite a faixa 2 (Mestre): quem a escolhe esgota as
  // duas vagas sozinho, e é assim que a alternativa fecha, sem UI de modo.
  for (const [prefixo, pool] of [["gojo", POOL_ESTUDO], ["inumaki", POOL_ESTUDO], ["kamo", POOL_KAMO]]) {
    for (const o of opcoesTreino(prefixo, pool)) {
      out[o.id] = [{ canal: "proficienciaPericia", alvo: o.id.slice(`${prefixo}_tr_`.length), expr: "1" }];
    }
    for (const o of opcoesMestre(prefixo, pool)) {
      out[o.id] = [{ canal: "proficienciaPericia", alvo: o.id.slice(`${prefixo}_ms_`.length), expr: "2" }];
    }
  }

  // Sem Técnica, Empenho Implacável. Talento e Habilidade de Especialização
  // dividem o MESMO orçamento, então "um Talento adicional" é uma vaga de
  // habilidade. A Aptidão Amaldiçoada tem orçamento próprio.
  for (const n of [1, 10]) {
    out[`st_n${n}_talento`] = [{ canal: "vagasHabilidade", expr: "1" }];
    out[`st_n${n}_aptidao`] = [{ canal: "vagasAptidao", expr: "1" }];
  }

  // "+N em 2 perícias" e "+N em um tipo de jogada de ataque ou TR", nos degraus
  // 3, 13 e 17. Gerados dos MESMOS helpers que geram os ids do catálogo, então
  // uma perícia nova entra dos dois lados de uma vez.
  for (const [nivel, valor] of [[3, 1], [13, 2], [17, 3]]) {
    for (const p of PERICIAS_BASE) {
      out[`st_n${nivel}_per_${p.id}`] = [{ canal: "bonusPericia", alvo: p.id, expr: String(valor) }];
    }
  }
  for (const [nivel, valor] of [[3, 1], [13, 1], [17, 2]]) {
    for (const a of AFTY_ATAQUES) {
      out[`st_n${nivel}_atq_${a.id}`] = [{ canal: "bonusAcerto", alvo: a.id, expr: String(valor) }];
    }
    for (const r of AFTY_RESISTENCIAS) {
      out[`st_n${nivel}_tr_${r.value}`] = [{ canal: "bonusTR", alvo: r.value, expr: String(valor) }];
    }
  }

  return out;
})();

/** Erros de conteúdo do catálogo. Rodar a cada leva nova. */
export function validarCatalogoOrigens() {
  const problemas = [];
  const ids = new Set();
  const opcoesVistas = new Set();
  const attrValidos = new Set(AFTY_ATTRS.map((a) => a.key));

  const checarCaracteristicas = (dono, lista) => {
    for (const c of lista || []) {
      if (!c.id) problemas.push(`${dono}: característica sem id`);
      if (!c.nome?.trim()) problemas.push(`${dono}/${c.id}: sem nome`);
      if (!c.descricao?.trim()) problemas.push(`${dono}/${c.id}: sem descrição`);
      for (const k of c.bonus?.entre || []) {
        if (!attrValidos.has(k)) problemas.push(`${dono}/${c.id}: atributo inválido no par (${k})`);
      }
      for (const k of c.alocacao?.entre || []) {
        if (!attrValidos.has(k)) problemas.push(`${dono}/${c.id}: atributo inválido na alocação (${k})`);
      }
      for (const esc of [c.escolha, ...(c.escolhas || [])]) {
        if (!esc) continue;
        if (!esc.id) problemas.push(`${dono}/${c.id}: escolha sem id`);
        if (!esc.opcoes?.length) problemas.push(`${dono}/${c.id}: escolha "${esc.id}" sem opções`);
        for (const o of esc.opcoes || []) {
          if (opcoesVistas.has(o.id)) problemas.push(`opção duplicada: ${o.id}`);
          opcoesVistas.add(o.id);
          if (!o.nome?.trim()) problemas.push(`${dono}/${esc.id}: opção ${o.id} sem nome`);
        }
      }
    }
  };

  for (const o of AFTY_ORIGENS_CATALOG) {
    if (ids.has(o.id)) problemas.push(`id duplicado: ${o.id}`);
    ids.add(o.id);
    if (!o.nome?.trim()) problemas.push(`${o.id}: sem nome`);
    for (const k of Object.keys(o.bonusAtributos || {})) {
      if (!attrValidos.has(k)) problemas.push(`${o.nome}: atributo inválido em bonusAtributos (${k})`);
    }
    for (const k of Object.keys(o.limiteAtributo || {})) {
      if (!attrValidos.has(k)) problemas.push(`${o.nome}: atributo inválido em limiteAtributo (${k})`);
    }
    checarCaracteristicas(o.nome, o.caracteristicas);
  }
  for (const c of CLAS_HERDADO) {
    if (ids.has(c.id)) problemas.push(`id duplicado: ${c.id}`);
    ids.add(c.id);
    checarCaracteristicas(c.nome, c.caracteristicas);
  }
  return problemas;
}
