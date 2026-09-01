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

import { registrarFamilia, remendarLista, liberacoesDaCriatura } from "./afty-addons";
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

/* ⚠ `let`, e não `const`, porque a família `clas` dos Addons o RECONSTRÓI. Ver
   `aplicarExtrasClas`, lá embaixo, junto do religador das origens. */
let CLA_BY_ID = Object.fromEntries(CLAS_HERDADO.map((c) => [c.id, c]));
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
        // "Um Talento" é vaga EXCLUSIVA de Talento (autor, 2026-08-03), e não a
        // vaga comum que serve para Habilidade de Especialização também.
        // → ORIGEM_EFEITOS.inato, canal vagasTalento: 1 + (nd >= 4).
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
        // Aptidão Amaldiçoada CONCEDIDA por nome, e não vaga para escolher.
        //
        // ⚠ Ela IGNORA os pré-requisitos da própria aptidão, de propósito: o
        // Domínio Simples pede BAR 1 e Nível 5, e a origem o entrega no 4 sem
        // pedir Barreira nenhuma. Quem concede pelo nome não está qualificando a
        // criatura, está dando. Ver `aptidoesConcedidasPelaOrigem`.
        //
        // É o caminho que faltava: até 2026-08-07 esta linha existia só no
        // texto, e o Sem Técnica não tinha como marcar a aptidão (o requisito
        // travava, e a origem não dá vaga de Aptidão nenhuma).
        concedeAptidoes: [{ id: "dominio_simples", ndMin: 4 }],
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
  {
    id: "gemeos",
    nome: "Gêmeos",
    // ⚠ ORIGEM DE DUPLA. O texto do livro é explícito: *"ela DEVE ser feita em
    // dupla, seja com outro jogador ou com algum NPC"*, e recomenda que ao menos
    // um dos dois seja Restringido. Isso tem duas consequências no código:
    //
    //   • a **Iniciativa** soma a do irmão, e o irmão é OUTRA ficha. O número
    //     dele é digitado num campo (`core.origem.iniciativaIrmao`), decisão do
    //     autor em 2026-08-07: ler a outra criatura do armazenamento criaria
    //     dependência entre fichas por um bônus só.
    //   • a **Restrição Celestial** tem dois estágios, e o segundo começa com a
    //     MORTE DO IRMÃO. Isso é um interruptor na Origem
    //     (`core.origem.irmaoMorto`), e não um estado de combate: é permanente e
    //     precisa sobreviver à sessão. Ver a nota do `irmaoMorto` no schema.
    //
    // ⚠ Os dois RAMOS da Restrição Celestial (Restringido e Feiticeiro) saem do
    // que a criatura É, e não de mais uma escolha: `semEnergia` (o Tipo
    // Restringido) já separa os dois no deriveAfty inteiro.
    bonusAtributos: {},
    caracteristicas: [
      {
        id: "bonus_atributo",
        nome: "Bônus em Atributo",
        descricao:
          "Os gêmeos recebem 2 pontos para distribuir entre seus atributos. Caso um deles seja " +
          "restringido, ao invés disso, apenas seus atributos físicos são aumentados em 1",
        // ⚠ Os dois casos são EXCLUDENTES, e quem decide é o Tipo: o Restringido
        // recebe +1 fixo em Força, Destreza e Constituição (via ORIGEM_EFEITOS,
        // porque `bonusAtributos` é do catálogo e não sabe o Tipo), e todo o
        // resto recebe os 2 pontos livres abaixo. O pool some para o Restringido
        // no criador, senão ele ganharia as duas coisas.
        bonus: { distribuir: 2, maxPorAtributo: 2, semEnergiaNao: true },
      },
      {
        id: "restricao_celestial",
        nome: "Restrição Celestial",
        descricao:
          "Gêmeos possuem uma restrição celestial que limita bastante suas capacidades, mas que " +
          "também varia a depender se eles possuem ou não energia. Essa característica de origem " +
          "será explicada com melhores detalhes na próxima página. Esse “Voto” não entra no limite " +
          "de votos, sendo algo a parte da origem.",
        // ⚠ Este NÃO é um Voto do sistema de votos: o texto diz que ele fica
        // "a parte da origem". Ele não entra no limite e não aparece na aba de
        // Votos. O conteúdo mecânico dele está nas duas características abaixo,
        // separadas por ramo, para o jogador ler só a que vale para ele.
      },
      {
        id: "restricao_celestial_restringido",
        nome: "Restrição Celestial: Restringido",
        // ⚠ SÓ COM O IRMÃO VIVO. O texto do livro tem dois parágrafos e eles são
        // dois ESTADOS, não duas partes: um vale antes da morte e o outro
        // depois. Mostrar os dois juntos fazia o jogador ler uma regra que não é
        // a dele e ter de descobrir sozinho qual valia (autor, 2026-08-07:
        // *"tudo que precisar da Morte do Irmão, deixe visível só quando o irmão
        // estiver morto. O inverso também é válido"*).
        // O NOME é o mesmo do estágio de baixo de propósito: só um dos dois
        // aparece por vez, então é o mesmo card mudando de conteúdo.
        soSemEnergia: true,
        soIrmaoVivo: true,
        descricao:
          "Por ainda estar conectado ao seu irmão, você possui um pouco de energia amaldiçoada, " +
          "mesmo que insignificante, você é incapaz de receber a habilidade Restrição Definitiva, " +
          "além disso, seus atributos de força e destreza são reduzidos em 2 cada. Você também " +
          "recebe apenas 2 pontos de vigor por nível.",
      },
      {
        id: "restricao_celestial_restringido_morto",
        nome: "Restrição Celestial: Restringido",
        soSemEnergia: true,
        soIrmaoMorto: true,
        descricao:
          "Mas quando seu irmão vem a morrer, ele tira toda a energia que ainda existia em você, " +
          "liberando todo seu potencial e força de uma única vez. Você recebe a habilidade " +
          "“Restrição Definitiva”, independente de seu nível, a característica de desenvolvimento " +
          "“Vingativo”, você aumenta em 2 a sua força e destreza, além de receber mais 4 pontos " +
          "para distribuir em seus atributos físicos, com limite natural de 30 e 2 em um mesmo " +
          "atributo. Você também recebe +2 pontos de vigor por nível. A critério do mestre você " +
          "também pode “fazer” uma arma de grau especial com a alma de seu irmão, criando uma arma " +
          "para seu arsenal, com base na técnica de seu irmão.",
        // "mais 4 pontos para distribuir em seus atributos físicos, com limite
        // natural de 30 e 2 em um mesmo atributo."
        // ⚠ Pool PRÓPRIO, e não o "Bônus em Atributo": são regras diferentes
        // (aquele é 2 livres, este é 4 só nos físicos), e o limite natural aqui
        // é 30, que o Tipo Restringido já dá nos três físicos.
        //
        // ⚠ A alocação NÃO precisa mais de `soIrmaoMorto` própria: a
        // característica inteira já só existe depois da morte, e o
        // `alocacoesDaOrigem` lê a lista já filtrada.
        alocacao: {
          id: "gemeos_pos_morte_fisicos",
          quantidade: 4, valor: 1, entre: FISICOS, maxPorAtributo: 2,
        },
        // A arma de grau especial feita com a alma do irmão é procedimento de
        // mesa ("a critério do mestre"), e o mesmo vale para a "característica de
        // desenvolvimento Vingativo", que não existe em catálogo nenhum do Afty.
        parcial: "A arma da alma do irmão e a característica Vingativo resolvem na mesa",
      },
      {
        id: "restricao_celestial_feiticeiro",
        nome: "Restrição Celestial: Feiticeiros",
        // Some para o Restringido, que lê a característica dele. E só com o
        // irmão VIVO: ver a nota do ramo Restringido acima.
        soComEnergia: true,
        soIrmaoVivo: true,
        descricao:
          "Sua energia é drenada pelo elo com seu irmão. Você recebe apenas 2 de energia por " +
          "nível, todos os atributos que podem ser usados para sua CD de técnica são reduzidos em " +
          "2, devido a sua ligação já estar com seu irmão você não tem energia suficiente para se " +
          "conectar com invocações, tornando impossível obter a especialização “Controlador” ou " +
          "invocações e você recebe 1 habilidade de técnica apenas a cada 3 níveis (2 níveis caso " +
          "seja especialista em técnica)",
      },
      {
        id: "restricao_celestial_feiticeiro_morto",
        nome: "Restrição Celestial: Feiticeiros",
        soComEnergia: true,
        soIrmaoMorto: true,
        descricao:
          "Mas quando seu irmão morre, toda a sua energia voltar para você, com você despertando " +
          "todo o potencial possível. Seus atributos que tinham sido reduzidos aumentam em 2 e " +
          "você recebe 2 pontos para distribuir entre seus atributos, com limite natural de 30, " +
          "você recebe +20 de energia máxima, recebendo também o base de sua especialização +2 de " +
          "energia por nível, você recebe 1 técnica por nível (incluindo nos próximos níveis) e " +
          "independente de seu nível, você recebe o efeito de redução de custos da habilidade base " +
          "O Honrado. A critério do mestre você também recebe uma técnica máxima, baseando-se em " +
          "seu irmão que veio a morrer, com seu custo sendo reduzido em 10 pontos.",
        // "você recebe 2 pontos para distribuir entre seus atributos, com
        // limite natural de 30". O limite de 30 sai pelo canal `limiteAtributo`
        // em ORIGEM_EFEITOS.gemeos, e só neste ramo: no Restringido os físicos
        // já são 30 pelo Tipo.
        alocacao: {
          id: "gemeos_pos_morte_livres",
          quantidade: 2, valor: 1, maxPorAtributo: 2,
        },
        // ⚠ A habilidade base de 20° nível que vem no pós-morte é ESCOLHIDA
        // (autor, 2026-08-07: *"Ao invés de receber O Honrado, podemos receber
        // no lugar alguma outra Habilidade Base de Nível 20"*), e por ora só o
        // Lutador Superior está ligado.
        escolha: {
          id: "gemeos_habilidade_base",
          label: "Habilidade Base de 20° Nível",
          vagas: 1,
          opcoes: [
            {
              id: "gem_base_o_honrado",
              nome: "O Honrado",
              descricao: "Você recebe o efeito de redução de custos da habilidade base O Honrado.",
            },
            {
              id: "gem_base_lutador_superior",
              nome: "Lutador Superior",
              descricao:
                "Você recebe o efeito da habilidade base Lutador Superior, e o ataque desarmado " +
                "como ação livre não custa PE.",
            },
          ],
        },
      },
      /* ⚠ AS DUAS DE BAIXO SÃO DO RESTRINGIDO, e chegam ao Gêmeo só com a
         MORTE DO IRMÃO (autor, 2026-08-07). O texto delas é o mesmo, copiado
         verbatim de `restringido`, porque é a MESMA característica: duplicar o
         texto é pior que divergir dele, e um `soIrmaoMorto` no catálogo do
         Restringido faria a origem dele carregar regra de Gêmeos.

         ⚠ O `limiteAtributo` da outra origem é campo do CATÁLOGO (estático), e
         aqui ele precisa depender do interruptor. Por isso o teto de 30 sai
         pelo CANAL `limiteAtributo` do Motor, em ORIGEM_EFEITOS.gemeos: o canal
         SOMA no limite, então +10 leva o padrão de 20 a 30. */
      {
        id: "apice_corporal_humano",
        nome: "Ápice Corporal Humano",
        soSemEnergia: true,
        soIrmaoMorto: true,
        descricao:
          "Seu corpo tem um potencial extraordinário, sendo capaz de alcançar o ápice das capacidades " +
          "físicas humanas. Seu limite de atributo para Força, Destreza e Constituição é 30 ao invés de 20. " +
          "Além disso, a cada 6 níveis, escolha um desses atributos para receber +2 em seu valor. Sempre que " +
          "realizar um teste de Atletismo para erguer peso ou saltar distâncias, dobre o limite de peso ou a " +
          "distância saltada.",
        alocacao: { id: "apice_corporal_humano", porNivel: 6, valor: 2, entre: FISICOS },
      },
      {
        id: "resiliencia_imediata",
        nome: "Resiliência Imediata",
        soSemEnergia: true,
        soIrmaoMorto: true,
        descricao:
          "Seu corpo é mais resistente do que o padrão humano, permitindo-o encarar a dor facilmente. Uma " +
          "quantidade de vezes igual ao seu bônus de treinamento, ao receber dano, você pode escolher reduzir " +
          "esse dano em um valor igual à metade do seu nível (mínimo 1) multiplicado por 5. Alternativamente, " +
          "você pode escolher gastar um uso dessa habilidade para evitar um desmembramento. Você recupera os " +
          "usos após um descanso longo.",
        // Reação com usos por descanso, e a redução é de UM golpe, não RD. É o
        // mesmo `mesa: true` que ela tem na origem Restringido.
        mesa: true,
      },
      {
        id: "dupla_empenhada",
        nome: "Dupla Empenhada",
        descricao:
          "Vocês dois são uma excelente dupla, afinal, vocês só possuem um ao outro para confiar e " +
          "se apoiar, devido a isso, vocês estão sempre lutando juntos, combinando seus movimentos " +
          "e estando sempre em perfeita sincronia. Vocês possuem um turno próprio, com cada um " +
          "tendo suas próprias ações, o bônus de iniciativa de vocês são aplicados como um só (se " +
          "um tem +4 de destreza e o outro tem +1, ficaria +5, por exemplo, isso se aplica para " +
          "todos os bônus que vocês possuírem PARA INICIATIVA, mas apenas uma vez de mesmas " +
          "habilidades). Além disso, técnicas em conjunto entre vocês não possuem limite de " +
          "quantas podem ser feitas.",
        // ⚠ O bônus do irmão vem de um CAMPO, e não da outra ficha: ver a nota
        // no topo da origem.
        //
        // ⚠ NÃO existe uma marca `campoIniciativaIrmao` aqui, e ela já existiu:
        // era metadado que ninguém lia, porque o campo é renderizado atrás de
        // `id === "gemeos"` no criador. Marca decorativa é a mesma classe de bug
        // do `semEnergiaNao`, que passou uma revisão inteira fingindo valer.
      },
      {
        id: "verdadeiras_origens",
        nome: "Verdadeiras Origens",
        descricao:
          "Apesar de serem gêmeos, vocês possuem uma origem tanto de sua técnica quanto de vocês, " +
          "repercutindo inclusive naquilo que vocês possam fazer. Vocês escolhem uma característica " +
          "de outra origem, com exceção de derivado, corpo amaldiçoado mutante, reencarnado, sem " +
          "técnica e Maldição/Shikigami mutante. Caso pegue a de restringido, obrigatoriamente ela " +
          "será a característica “Restrição Celestial” dele.\n\n" +
          "Vocês consideram a origem escolhida na habilidade “Verdadeiras Origens” como sua para " +
          "todos os fins de qualificação. Dessa forma, vocês têm total liberdade para selecionar e " +
          "adquirir os Talentos de Origem exclusivos daquela origem, expandindo suas capacidades " +
          "como se tivessem nascido nela.",
        // As opções são GERADAS das outras origens (ver `opcoesVerdadeirasOrigens`),
        // e não copiadas: característica nova numa origem entra sozinha aqui.
        escolha: {
          id: "verdadeiras_origens",
          label: "Característica de Outra Origem",
          vagas: 1,
          // ⚠ GETTER, e não uma chamada direta. Esta lista é montada a partir
          // do próprio `AFTY_ORIGENS_CATALOG`, que ainda está sendo construído
          // quando este objeto nasce. Avaliar aqui dentro estoura o TDZ; o
          // getter só roda no primeiro acesso, que é depois do módulo pronto.
          get opcoes() { return opcoesVerdadeirasOrigens(); },
        },
      },
    ],
    especializacaoExclusivaId: null,
  },
];

/* ============================================================ */
/* VERDADEIRAS ORIGENS (Gemeos)                                  */
/* ============================================================ */

/**
 * As origens que o Gemeo NAO pode copiar em "Verdadeiras Origens".
 *
 * O texto exclui *"derivado, corpo amaldicoado mutante, reencarnado, sem
 * tecnica e Maldicao/Shikigami mutante"*. Tres desses nomes nao existem como
 * origem no catalogo do Afty (corpo amaldicoado mutante, reencarnado e
 * shikigami mutante), entao a lista abaixo so nomeia o que EXISTE.
 *
 * PERGUNTA ABERTA (2026-08-07): "Maldicao/Shikigami mutante" foi lido como a
 * origem Maldicao. Se o livro quis dizer um "Shikigami Mutante" que ainda nao
 * existe aqui, a origem Maldicao volta para a lista permitida.
 */
const VERDADEIRAS_ORIGENS_PROIBIDAS = ["derivado", "sem_tecnica", "maldicao", "gemeos"];

/**
 * "Caso pegue a de restringido, obrigatoriamente ela sera a caracteristica
 * Restricao Celestial dele."
 *
 * O Restringido do nosso catalogo nao tem caracteristica com esse nome: ele tem
 * Bonus em Atributo, Fisico Abencoado, Apice Corporal Humano e Resiliencia
 * Imediata. O autor resolveu em 2026-08-07: e o **Fisico Abencoado**, que e a
 * que da acesso a Especializacao Restringido.
 */
const RESTRINGIDO_CARACTERISTICA_OBRIGATORIA = "fisico_abencoado";

/**
 * Uma opcao por caracteristica de outra origem, GERADA do catalogo.
 *
 * Caracteristica nova numa origem entra aqui sozinha, e e por isso que a lista
 * nao e escrita a mao. Ficam de fora:
 *   - as origens proibidas pelo texto;
 *   - o "Bonus em Atributo", que toda origem tem e que o Gemeo ja recebe pela
 *     propria (copiar dois bonus de atributo seria dobrar a mesma coisa).
 *
 * O HERDADO ENTRA PELO CLA (2026-08-07). Ele nao tem caracteristica propria: as
 * dele so dizem "depende do cla" (`doCla`), e antes disso o Herdado inteiro
 * ficava de fora, o que deixava a lista com seis opcoes. Agora cada
 * caracteristica de cada cla vira uma opcao, e o rotulo diz de qual cla ela
 * veio ("Herdado (Cla Gojo): Seis Olhos"). Escolher a caracteristica traz o cla
 * dela junto, porque uma sem a outra nao quer dizer nada.
 *
 * ⚠ CADA OPCAO CARREGA DE ONDE VEIO (`origemId`, `claId`, `caracteristicaId`).
 * Sem isso o id gerado teria de ser desmontado por string para achar a
 * caracteristica de volta, e id de cla e de origem tem `_` no meio.
 */

function opcaoVerdadeiraOrigem(origem, c, cla = null) {
  return {
    id: cla ? `vo_${origem.id}_${cla.id}_${c.id}` : `vo_${origem.id}_${c.id}`,
    nome: cla ? `${origem.nome} (${cla.nome}): ${c.nome}` : `${origem.nome}: ${c.nome}`,
    descricao: c.descricao,
    origemId: origem.id,
    claId: cla?.id ?? null,
    caracteristicaId: c.id,
  };
}

/**
 * ⚠ O `liberado` vem do Addon com `libera: ["gemeosSemTecnica"]` (autor,
 * 2026-08-21). Ele tira o **Sem Técnica** da lista de proibidas, e só ele: as
 * outras três continuam fora.
 *
 * O resultado é exatamente as DUAS características que o autor nomeou, e não
 * por coincidência: o Sem Técnica tem três, e a terceira é o Bônus em Atributo,
 * que o filtro genérico logo abaixo já tira de toda origem. Sobram Estudos
 * Dedicados e Empenho Implacável.
 *
 * ⚠ O GÊMEO CONTINUA ESCOLHENDO UMA (autor, no mesmo dia: *"é para escolher só
 * uma, porém deixar as duas como opção"*). O `vagas: 1` da escolha não é
 * tocado, e as duas entram lado a lado com as das outras origens.
 *
 * ⚠ A SEGUNDA LIBERAÇÃO ENTROU EM 2026-08-29: `gemeosMaldicao` tira a
 * **Maldição** da mesma lista, e ela também rende duas opções (Existência
 * Metafísica e Natureza Amaldiçoada, com o Bônus em Atributo saindo pelo filtro
 * genérico). A diferença para a do Sem Técnica é o que vem DEPOIS de copiar:
 * copiar da Maldição muda a ESTRUTURA da criatura, e não só o que ela tem. Ver
 * `origemEstrutural`.
 *
 * O cache é POR CHAVE, e a chave é o conjunto de liberações que importam aqui.
 * Um cache só não serve: a lista depende da criatura.
 */
const LIBERACOES_VO = [
  ["gemeosSemTecnica", "sem_tecnica"],
  ["gemeosMaldicao", "maldicao"],
];
const cacheVO = new Map();

function opcoesVerdadeirasOrigens(liberacoes = []) {
  const soltas = LIBERACOES_VO.filter(([lib]) => liberacoes.includes(lib)).map(([, id]) => id);
  const chave = soltas.join("|");
  if (cacheVO.has(chave)) return cacheVO.get(chave);
  const proibidas = VERDADEIRAS_ORIGENS_PROIBIDAS.filter((id) => !soltas.includes(id));
  const out = [];
  for (const origem of AFTY_ORIGENS_CATALOG) {
    if (proibidas.includes(origem.id)) continue;
    for (const c of origem.caracteristicas || []) {
      if (c.id === "bonus_atributo") continue;
      if (origem.id === "restringido" && c.id !== RESTRINGIDO_CARACTERISTICA_OBRIGATORIA) continue;
      // A promessa de conteudo nao e conteudo: quem entra e a caracteristica do
      // cla, logo abaixo, e nao a linha que diz que ela depende do cla.
      if (c.doCla) continue;
      out.push(opcaoVerdadeiraOrigem(origem, c));
    }
    for (const cla of origem.clas || []) {
      for (const c of cla.caracteristicas || []) {
        if (c.id === "bonus_atributo") continue;
        out.push(opcaoVerdadeiraOrigem(origem, c, cla));
      }
    }
  }
  cacheVO.set(chave, out);
  return out;
}

/** A opcao de Verdadeiras Origens gravada na ficha, ou null. */
export function verdadeiraOrigemEscolhida(creature) {
  if (creature?.core?.origem?.id !== "gemeos") return null;
  const guardadas = creature?.core?.origem?.escolhas?.verdadeiras_origens;
  const id = Array.isArray(guardadas) ? guardadas[0] : null;
  if (!id) return null;
  /* ⚠ A LIBERAÇÃO VALE AQUI TAMBÉM. Sem isto, um Gêmeo que copiou o Empenho
     Implacável continuaria com ele depois de o Addon sair, e a origem passaria
     a conceder Domínio Simples sem nada explicando de onde veio.

     A escolha some da ficha em silêncio, sem marca de "sem acesso" (autor,
     2026-08-21). É diferente do Estilo, que fica riscado, e é escolha dele. */
  const opcao = opcoesVerdadeirasOrigens(liberacoesDaCriatura(creature)).find((o) => o.id === id);
  if (!opcao) return null;
  const origem = getOrigem(opcao.origemId);
  const cla = opcao.claId ? getCla(opcao.claId) : null;
  const dona = cla || origem;
  const caracteristica = (dona?.caracteristicas || []).find((c) => c.id === opcao.caracteristicaId);
  if (!caracteristica) return null;
  return { opcao, origem, cla, caracteristica };
}

/**
 * As origens que a criatura CONTA como tendo, para todo fim de qualificacao.
 *
 * Quase sempre e uma so. O Gemeo com Verdadeiras Origens conta duas: *"Voces
 * consideram a origem escolhida na habilidade Verdadeiras Origens como sua para
 * todos os fins de qualificacao. Dessa forma, voces tem total liberdade para
 * selecionar e adquirir os Talentos de Origem exclusivos daquela origem"*.
 */
/**
 * Fator do contador de SLOTS DE HABILIDADE (o caixa unico de Feiticos e
 * Habilidades Gerais). 1 para todo mundo, menos o Gemeo.
 *
 * Regra do autor (2026-08-07): *"Gemeos recebem 1,5x a quantidade de Slots de
 * Habilidades quando o Irmao Morrer. E ficam com somente metade quando o irmao
 * esta vivo"*.
 *
 * ⚠ E MULTIPLICADOR, e por isso ele NAO passa pelo Motor. Todo canal de vaga
 * soma, e nao ha como escrever "metade do que veio" numa expressao que nao
 * enxerga o proprio total. Fica aqui, ao lado das outras regras de origem que
 * mexem em orcamento, e o `deriveAfty` aplica no contador comum.
 *
 * ⚠ O ARREDONDAMENTO E PARA BAIXO, que e a regra geral do Afty. Metade de 9 da
 * 4, e 1,5x de 9 da 13.
 */
export function fatorSlotsHabilidade(creature) {
  if (creature?.core?.origem?.id !== "gemeos") return 1;
  return creature?.core?.origem?.irmaoMorto ? 1.5 : 0.5;
}

/**
 * A origem cujas REGRAS DE ESTRUTURA a criatura segue: quais trilhas de Aptidão
 * existem para ela, qual aba ocupa o lugar da de Energia Reversa, e quais Linhas
 * de Treinamento a origem não alcança.
 *
 * Quase sempre é a origem própria, e devolver isso é a resposta certa. O caso
 * que abriu a função é o Gêmeo que COPIA da Maldição em Verdadeiras Origens
 * (autor, 2026-08-29): *"que ele siga as regras de Maldição de não ter Energia
 * Reversa, porém ter a aba de Aptidões de Maldição"*.
 *
 * ⚠ NÃO É O `origensQualificadas`, e não pode virar ele. Aquela lista está
 * documentada como "só ABRE, nunca tranca", e esta pergunta FECHA: virar
 * Maldição TIRA a Energia Reversa da criatura. Pendurar um fechamento numa
 * lista que promete só abrir é a armadilha, não a economia.
 *
 * ⚠ Devolve UMA origem, e não uma lista, porque a pergunta que ela responde é
 * excludente: a aba de Maldição OCUPA o lugar da de Energia Reversa, não se
 * soma a ela. Duas origens estruturais ao mesmo tempo não têm resposta.
 *
 * ⚠ O ADDON NÃO É CONFERIDO AQUI, e é de propósito: quem confere é o
 * `verdadeiraOrigemEscolhida`, que já devolve `null` quando a liberação saiu.
 * Uma segunda trava aqui seria uma segunda verdade para manter em sincronia.
 */
export function origemEstrutural(creature) {
  const propria = creature?.core?.origem?.id ?? null;
  if (propria === "maldicao") return propria;
  const copiada = verdadeiraOrigemEscolhida(creature)?.origem?.id ?? null;
  return copiada === "maldicao" ? "maldicao" : propria;
}

/**
 * As origens que a criatura conta como suas para fim de PRÉ-REQUISITO.
 *
 * ⚠ SÓ ABRE, NUNCA TRANCA. A própria origem é a que tranca (a Origem
 * Restringido vê só a Especialização Restringido); o que entra aqui a mais só
 * destrava conteúdo exclusivo de outra origem, e é lido por
 * `avaliarRequisitoTalento` (`tipo: "origem"`), por `treinoDisponivel` e por
 * `especializacoesDisponiveis`.
 *
 * Três fontes hoje:
 *   • a origem própria;
 *   • a origem COPIADA em Verdadeiras Origens, porque o Gêmeo *"considera a
 *     origem escolhida como sua para todos os fins de qualificação"*;
 *   • o Addon com `libera: ["qualificaSemTecnica"]` (autor, 2026-08-22), que
 *     abre o Sem Técnica a quem carrega o pacote. Ele acompanha o
 *     `estiloSombras` mas é liberação SEPARADA: uma solta o Estilo, e esta
 *     solta o Treino e os Talentos de Origem que pedem Sem Técnica.
 */
export function origensQualificadas(creature) {
  const propria = creature?.core?.origem?.id ?? null;
  const copiada = verdadeiraOrigemEscolhida(creature)?.origem?.id ?? null;
  const porAddon = liberacoesDaCriatura(creature).includes("qualificaSemTecnica")
    ? "sem_tecnica"
    : null;
  return [propria, copiada, porAddon].filter((id, i, a) => id && a.indexOf(id) === i);
}

// Opções para <Select> (value/label).
/* ============================================================ */
/* ADDONS: Origem                                                */
/* ============================================================ */
/* Nona família (2026-08-20). DUAS estruturas derivadas do catálogo, e a
   primeira delas é o que o SELETOR da aba usa:

     1. `AFTY_ORIGENS`  a lista `{ value, label }` do seletor. Reescrita no
        lugar, porque é `export const` e quem importou guarda a referência.
     2. `BY_ID`         o índice do `getOrigem`.

   ⚠ A Origem é a entrada de maior CONSEQUÊNCIA do sistema: ela trava quais
   Especializações aparecem, quais trilhas de Aptidão existem, o bônus de
   atributo e os clãs. Uma origem de addon com pouca coisa declarada é uma
   origem PERMISSIVA, e não uma origem quebrada, então o validador não tem o que
   reprovar. Quem criar uma precisa saber disso. */

export const AFTY_ORIGENS = [];

let BY_ID = {};

const ORIGENS_BASE = AFTY_ORIGENS_CATALOG.slice();

function aplicarExtrasOrigens(extras = [], remendos = null) {
  AFTY_ORIGENS_CATALOG.splice(0, AFTY_ORIGENS_CATALOG.length, ...remendarLista(ORIGENS_BASE, remendos), ...extras);
  AFTY_ORIGENS.splice(0, AFTY_ORIGENS.length,
    ...AFTY_ORIGENS_CATALOG.map((o) => ({ value: o.id, label: o.nome })));
  BY_ID = Object.fromEntries(AFTY_ORIGENS_CATALOG.map((o) => [o.id, o]));
  /* ⚠ O CACHE DE VERDADEIRAS ORIGENS MORRE AQUI (conserto de 2026-08-21). Ele é
     montado a partir deste catálogo, e ficava preso ao conteúdo do primeiro
     acesso: uma origem vinda de Addon nunca aparecia na lista do Gêmeo, calado.
     O bug entrou junto com a família `origens` dos Addons e não tinha sintoma
     porque ninguém tinha escrito uma origem de addon ainda. */
  cacheVO.clear();
}

aplicarExtrasOrigens();

registrarFamilia("origens", {
  rotulo: "Origem",
  chave: "id",
  obrigatorios: ["nome"],
  aplicar: aplicarExtrasOrigens,
  basicos: () => ORIGENS_BASE,
  validador: validarCatalogoOrigens,
  resolver: (id) => getOrigem(id),
  idsDaFicha: (c) => (c?.core?.origem?.id ? [c.core.origem.id] : []),
});

/* ============================================================ */
/* FAMÍLIA `clas` DOS ADDONS                                     */
/* ============================================================ */
/**
 * ⚠ CLÃ É FAMÍLIA PRÓPRIA, e não um remendo no campo `clas` do Herdado.
 *
 * O caminho fácil seria `substitui: { origens: [{ id: "herdado", campos: {
 * clas: [...] } }] }`, e ele funciona: o `remendarLista` troca o campo inteiro.
 * O preço é que o addon passaria a carregar uma CÓPIA CONGELADA dos quatro clãs
 * do livro, e ela envelheceria na primeira errata do raw, calada. É a mesma
 * doença do catálogo copiado que o projeto já pegou em outros lugares.
 *
 * Como família, o addon escreve só o clã DELE e os do livro seguem vivos.
 *
 * ⚠ O RELIGADOR MEXE NO ARRAY NO LUGAR (`splice`), e não o substitui. A entrada
 * `herdado` do catálogo aponta para ESTE array em `clas: CLAS_HERDADO`, e
 * trocar a referência deixaria a origem apontando para a lista velha. O mesmo
 * vale depois de um remendo na origem: o `remendarLista` faz cópia RASA, então
 * a cópia continua apontando para o mesmo array.
 *
 * ⚠ E O CACHE DE VERDADEIRAS ORIGENS MORRE AQUI TAMBÉM. O `opcoesVerdadeirasOrigens`
 * percorre `origem.clas` para montar as opções do Gêmeo, e sem limpar o cache um
 * clã de addon nunca apareceria lá. É o mesmo bug que a família `origens` teve
 * em 2026-08-21, e ele reaparece por clã pela mesma razão.
 */
const CLAS_BASE = CLAS_HERDADO.slice();

function aplicarExtrasClas(extras = [], remendos = null) {
  CLAS_HERDADO.splice(0, CLAS_HERDADO.length, ...remendarLista(CLAS_BASE, remendos), ...extras);
  CLA_BY_ID = Object.fromEntries(CLAS_HERDADO.map((c) => [c.id, c]));
  cacheVO.clear();
}

/** Só as características dos clãs, para o validador reaproveitar a checagem. */
export function validarCatalogoClas() {
  const problemas = [];
  const ids = new Set();
  const attrValidos = new Set(AFTY_ATTRS.map((a) => a.key));
  for (const cla of CLAS_HERDADO) {
    if (ids.has(cla.id)) problemas.push(`clã duplicado: ${cla.id}`);
    ids.add(cla.id);
    if (!cla.nome?.trim()) problemas.push(`${cla.id}: sem nome`);
    if (!Array.isArray(cla.caracteristicas) || !cla.caracteristicas.length) {
      problemas.push(`${cla.id}: sem características`);
    }
    for (const c of cla.caracteristicas || []) {
      if (!c.id) problemas.push(`${cla.id}: característica sem id`);
      if (!c.nome?.trim()) problemas.push(`${cla.id}/${c.id}: sem nome`);
      if (!c.descricao?.trim()) problemas.push(`${cla.id}/${c.id}: sem descrição`);
      for (const k of c.bonus?.entre || []) {
        if (!attrValidos.has(k)) problemas.push(`${cla.id}/${c.id}: atributo inválido no par (${k})`);
      }
    }
  }
  return problemas;
}

aplicarExtrasClas();

registrarFamilia("clas", {
  rotulo: "Clã do Herdado",
  chave: "id",
  obrigatorios: ["nome"],
  aplicar: aplicarExtrasClas,
  basicos: () => CLAS_BASE,
  validador: validarCatalogoClas,
  resolver: (id) => getCla(id),
  /* O clã da ficha mora em `core.origem.cla`, ao lado do id da origem. */
  idsDaFicha: (c) => (c?.core?.origem?.cla ? [c.core.origem.cla] : []),
});


export const getOrigem = (id) => BY_ID[id] ?? null;

/** Clãs da origem, se ela se divide (só o Herdado, por ora). */
export const clasDaOrigem = (id) => getOrigem(id)?.clas ?? null;

/**
 * A caracteristica vale para ESTA criatura?
 *
 * ⚠ Nasceu com os GEMEOS (2026-08-07), a primeira origem cujas caracteristicas
 * NAO valem todas ao mesmo tempo. Ela tem duas Restricoes Celestiais diferentes
 * (uma para o Gemeo Restringido e outra para o Feiticeiro) e um bloco inteiro
 * que so existe DEPOIS da morte do irmao. Mostrar as quatro juntas faria o
 * jogador ler duas regras que se contradizem e ter de adivinhar qual e a dele.
 *
 * Tres marcas, todas declarativas, e nenhuma outra origem as usa:
 *   • `soSemEnergia` — so o Tipo Restringido
 *   • `soComEnergia` — todo mundo MENOS o Restringido
 *   • `soIrmaoVivo`  — so ANTES do interruptor da morte
 *   • `soIrmaoMorto` — so DEPOIS do interruptor da morte
 *
 * ⚠ Ela filtra a lista que alimenta as ALOCACOES e as ESCOLHAS aninhadas, e nao
 * so a UI: um pool de atributos que so existe apos a morte do irmao nao pode
 * aparecer no criador antes dela.
 */
function valeParaEsta(c, creature) {
  if (!c) return false;
  const restringido = creature?.core?.tipo === "restringido";
  if (c.soSemEnergia && !restringido) return false;
  if (c.soComEnergia && restringido) return false;
  const morto = !!creature?.core?.origem?.irmaoMorto;
  if (c.soIrmaoMorto && !morto) return false;
  if (c.soIrmaoVivo && morto) return false;
  return true;
}

/**
 * Características EFETIVAS: as da origem mais as do clã escolhido. As do
 * Herdado que só dizem "depende do clã" (`doCla`) somem assim que há clã, para
 * a UI não mostrar a promessa e o conteúdo lado a lado.
 */
export function caracteristicasEfetivas(creature) {
  const origem = getOrigem(creature?.core?.origem?.id);
  if (!origem) return [];
  const cla = getCla(creature?.core?.origem?.cla);
  const proprias = (origem.caracteristicas || []).filter((c) => valeParaEsta(c, creature));
  const base = cla
    ? [
      ...proprias.filter((c) => !c.doCla),
      ...(cla.caracteristicas || []).filter((c) => valeParaEsta(c, creature)),
    ]
    : proprias;
  return [...base, ...caracteristicaCopiada(creature)].map(comOpcoesDaCriatura(creature));
}

/**
 * Troca a lista de opções de Verdadeiras Origens pela desta criatura.
 *
 * ⚠ AQUI, e não em `escolhasDaOrigem`, e a razão é que são DOIS consumidores por
 * caminhos diferentes: o `resolveEscolhasOrigem` passa por `escolhasDaOrigem`,
 * mas o card do criador lê `c.escolha.opcoes` DIRETO do que esta função devolve.
 * Filtrar só no resolvedor deixaria a tela oferecendo o que o motor recusa.
 *
 * ⚠ COPIA A CARACTERÍSTICA em vez de mexer nela. A entrada é do catálogo, que é
 * compartilhado por toda criatura carregada: escrever nela vazaria a lista de
 * uma criatura com Addon para a criatura sem, e é o mesmo estrago que fez a
 * entrada de Addon passar a ser clonada.
 */
const comOpcoesDaCriatura = (creature) => {
  const opcoes = opcoesVerdadeirasOrigens(liberacoesDaCriatura(creature));
  return (c) => {
    if (c?.escolha?.id !== "verdadeiras_origens") return c;
    return { ...c, escolha: { ...c.escolha, opcoes } };
  };
};

/**
 * As Aptidões Amaldiçoadas que a ORIGEM concede POR NOME, já filtradas pelo ND.
 *
 * ⚠ Diferente da VAGA (`vagasAptidao`), que é orçamento e o jogador gasta onde
 * quiser. Aqui a regra nomeia a aptidão, então não há escolha: ela entra na
 * ficha sozinha, de graça, e IGNORA os pré-requisitos dela mesma. Hoje só o
 * Empenho Implacável do Sem Técnica usa (Domínio Simples no ND 4, sem os BAR 1
 * e Nível 5 que a aptidão pediria).
 *
 * ⚠ FORA DO MOTOR, e é o mesmo motivo do `resolveOrigemAttrBonus`: a lista de
 * aptidões precisa estar fechada ANTES de o `coletarEfeitosAptidao` rodar, e o
 * Motor só resolve depois. Um canal aqui chegaria tarde demais e a aptidão
 * concedida entraria na ficha sem os efeitos dela.
 */
export function aptidoesConcedidasPelaOrigem(creature, nd = 1) {
  const nivel = Math.max(1, Math.trunc(Number(nd) || 1));
  const out = [];
  for (const c of caracteristicasEfetivas(creature)) {
    for (const a of c.concedeAptidoes ?? []) {
      if (!a?.id || nivel < (a.ndMin ?? 1) || out.includes(a.id)) continue;
      out.push(a.id);
    }
  }
  return out;
}

/**
 * A caracteristica que o Gemeo COPIOU em Verdadeiras Origens, como uma
 * caracteristica de verdade. Lista de zero ou um, para o chamador so espalhar.
 *
 * ⚠ ISTO E O QUE FALTAVA (2026-08-07). Antes a escolha era gravada e mais nada
 * acontecia: nao havia card, nao havia texto, nao havia pool. O autor relatou
 * como *"nao consigo pegar Heranca Maldita"*, e ele estava certo: pegar sem
 * receber e nao ter pego. Entrando aqui, a caracteristica copiada passa a andar
 * por todos os caminhos que ja liam esta funcao de uma vez so, e sao muitos:
 * o card no criador, as ESCOLHAS aninhadas dela (`escolhasDaOrigem`), as
 * ALOCACOES de atributo (`alocacoesDaOrigem`) e o pool de Anatomia.
 *
 * ⚠ O `id` ganha o prefixo `vo_` de proposito. Ele e a chave de estado da UI e
 * dos mapas de escolha, e sem o prefixo a Heranca Maldita copiada colidiria com
 * a Heranca Maldita de um Feto Amaldicoado Hibrido de verdade.
 *
 * ⚠ O QUE NAO VEM JUNTO: os efeitos de `ORIGEM_EFEITOS`. Aquele mapa e chaveado
 * pela ORIGEM inteira, e nao por caracteristica, entao nao ha como saber qual
 * das linhas do Feto pertence a Heranca Maldita. Copiar a origem toda daria a
 * criatura coisas que ela nao escolheu. Quem precisar de canal declara em
 * ORIGEM_ESCOLHA_EFEITOS, pelo id `vo_*`, que e o caminho que ja existe.
 */
function caracteristicaCopiada(creature) {
  const vo = verdadeiraOrigemEscolhida(creature);
  if (!vo || !valeParaEsta(vo.caracteristica, creature)) return [];
  const de = vo.cla ? `${vo.origem.nome} (${vo.cla.nome})` : vo.origem.nome;
  return [{
    ...vo.caracteristica,
    id: `vo_${vo.caracteristica.id}`,
    // De onde ela veio, para o card poder dizer. Sem isso a caracteristica
    // aparece no meio das dos Gemeos como se fosse deles.
    verdadeiraOrigem: de,
  }];
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
 *
 * ⚠ ELE IGNORA O QUE NÃO VALE MAIS, e isso não é detalhe. O que está GRAVADO na
 * ficha não é o que está VALENDO: os dois casos abaixo foram bugs reais,
 * achados na revisão dos Gêmeos em 2026-08-07.
 *
 *   • `semEnergiaNao` — o Bônus em Atributo dos Gêmeos diz "2 pontos para
 *     distribuir. Caso um deles seja restringido, AO INVÉS DISSO, apenas seus
 *     atributos físicos são aumentados em 1". Os dois casos são excludentes, e
 *     sem esta trava o Gêmeo Restringido levava as duas coisas.
 *   • POOL DESLIGADO — uma alocação pode deixar de existir sem que os pontos
 *     gravados sumam (os do pós-morte, quando o interruptor do irmão volta para
 *     Vivo). Gravar e desligar não pode continuar valendo, então só entram os
 *     pools que `alocacoesDaOrigem` ainda reconhece.
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

  // A distribuição livre, se ela ainda vale para esta criatura.
  const distrib = caracteristicasEfetivas(creature).find((c) => c.bonus?.distribuir)?.bonus;
  const semEnergia = creature?.core?.tipo === "restringido";
  if (!(distrib?.semEnergiaNao && semEnergia)) {
    somar(creature?.core?.origem?.bonusAtributos);
  }

  // Só os pools ATIVOS. Um pool gravado cuja alocação sumiu fica inerte.
  const ativos = new Set(alocacoesDaOrigem(creature).map((a) => a.id));
  for (const [id, pool] of Object.entries(creature?.core?.origem?.pools || {})) {
    if (ativos.has(id)) somar(pool);
  }
  return out;
}

/**
 * Limite de atributo que a ORIGEM eleva, por atributo. O Ápice Corporal Humano
 * do Restringido diz "Seu limite de atributo para Força, Destreza e Constituição
 * é 30 ao invés de 20". Devolve {} para quem não tem.
 *
 * Aceita a CRIATURA ou o id da origem. A criatura é necessária porque um limite
 * de origem pode depender do estado dela, e não só do catálogo: hoje o Gêmeo
 * com o irmão morto.
 *
 * ⚠ POR QUE ISTO NÃO É UM CANAL DO MOTOR, e a lição custou um bug. O
 * `limiteAtributo` do Motor só existe no ESTÁGIO 1, e o bônus de atributo da
 * ORIGEM é aparado no estágio 0. Escrito como canal, o limite do Gêmeo morto
 * subia para 30 no mostrador e o bônus da própria origem continuava aparado em
 * 20, com a ficha avisando "1 ponto de bônus perdido no limite 30" (relato do
 * autor, 2026-08-07: *"Pq estou limitado a 22? Se gêmeo levou meu limite para
 * 30?"*). Limite que precisa valer para a alocação e para o bônus de origem
 * mora AQUI, junto do Ápice Corporal Humano, e não no Motor.
 */
export function limiteAtributoDaOrigem(creatureOuId) {
  const id = typeof creatureOuId === "string"
    ? creatureOuId
    : creatureOuId?.core?.origem?.id;
  const doCatalogo = getOrigem(id)?.limiteAtributo ?? {};
  const creature = typeof creatureOuId === "string" ? null : creatureOuId;
  // "Você recebe 2 pontos para distribuir entre seus atributos, com limite
  // natural de 30" (Restrição Celestial dos Feiticeiros, depois da morte). Os
  // seis, porque o texto não separa. O Gêmeo Restringido não passa por aqui: os
  // três físicos dele já são 30 pelo Tipo, e o texto dele fala de "atributos
  // físicos", então subir os mentais seria dar o que a regra não deu.
  if (
    creature?.core?.origem?.id === "gemeos"
    && creature?.core?.origem?.irmaoMorto
    && creature?.core?.tipo !== "restringido"
  ) {
    return {
      ...doCatalogo,
      ...Object.fromEntries(ATTR_KEYS_ORIGEM.map((k) => [k, 30])),
    };
  }
  return doCatalogo;
}

// Os seis atributos, para o limite dos Gêmeos. Local de propósito: este arquivo
// não importa nada, e é a regra dele.
const ATTR_KEYS_ORIGEM = [
  "forca", "destreza", "constituicao", "inteligencia", "sabedoria", "presenca",
];

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

/**
 * Toda alocação de atributo declarada pela origem (com o clã junto).
 *
 * ⚠ A própria ALOCAÇÃO pode ser condicional, e não só a característica que a
 * carrega. Nos Gêmeos, a Restrição Celestial é uma característica só, visível
 * o tempo todo, mas os pontos que ela dá só existem DEPOIS da morte do irmão:
 * o `soIrmaoMorto` na alocação é o que separa as duas coisas sem precisar
 * inventar uma característica com nome que o livro não tem.
 */
export function alocacoesDaOrigem(creature) {
  const morto = !!creature?.core?.origem?.irmaoMorto;
  return caracteristicasEfetivas(creature)
    .map((c) => c.alocacao)
    .filter((a) => a && (!a.soIrmaoMorto || morto));
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

/** Opções inteiras selecionadas nas escolhas da origem e do clã. */
export function opcoesEscolhidasDaOrigem(creature, escolhas = null) {
  const mapa = escolhas?.mapa || resolveEscolhasOrigem(creature, creature?.core?.nd ?? 1).mapa;
  const porId = new Map();
  for (const esc of escolhasDaOrigem(creature)) {
    for (const opcao of esc.opcoes || []) porId.set(opcao.id, opcao);
  }
  return Object.values(mapa).flat().map((id) => porId.get(id)).filter(Boolean);
}

/** Trocas de atributo-chave declaradas por características de origem ou clã. */
export function atributosDePericiaDaOrigem(creature, escolhas = null) {
  const resolvidas = escolhas || resolveEscolhasOrigem(creature, creature?.core?.nd ?? 1);
  const porEscolha = new Map(escolhasDaOrigem(creature).map((esc) => [esc.id, esc]));
  const out = {};
  for (const caracteristica of caracteristicasEfetivas(creature)) {
    const troca = caracteristica.trocaAtributoPericia;
    if (!troca) continue;
    const periciaId = porEscolha.get(troca.escolhaPericia)?.opcoes
      ?.find((opcao) => resolvidas.mapa[troca.escolhaPericia]?.includes(opcao.id))?.periciaId;
    const atributoId = porEscolha.get(troca.escolhaAtributo)?.opcoes
      ?.find((opcao) => resolvidas.mapa[troca.escolhaAtributo]?.includes(opcao.id))?.atributoId;
    if (periciaId && ATTR_LABEL[atributoId]) out[periciaId] = atributoId;
  }
  return out;
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

  // Sem Técnica, Empenho Implacável. "Um Talento adicional" é vaga EXCLUSIVA de
  // Talento (autor, 2026-08-03): era `vagasHabilidade`, a pilha comum, então
  // quem escolhia o Talento no degrau podia gastar a vaga numa Habilidade de
  // Especialização e a escolha do degrau não valia nada. A Aptidão Amaldiçoada
  // tem orçamento próprio.
  for (const n of [1, 10]) {
    out[`st_n${n}_talento`] = [{ canal: "vagasTalento", expr: "1" }];
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

  /* ---------------- GÊMEOS · Habilidade Base de 20° nível ----------------
     O Gêmeo Feiticeiro recebe uma Habilidade Base de 20° nível quando o irmão
     morre. O livro nomeia O Honrado, e o autor abriu para outras
     (2026-08-07: *"podemos receber no lugar alguma outra Habilidade Base de
     Nível 20. Vamos programar inicialmente só com Lutador Superior"*).

     ⚠ Os efeitos são os MESMOS da habilidade original, copiados de
     `lut_lutador_superior` em afty-efeitos-conteudo.js. Copiar aqui é o único
     jeito hoje: aquele mapa é chaveado pela HABILIDADE, e esta é uma opção de
     escolha de origem, que nunca compra a habilidade.

     ⚠ O BUFF DE NÃO CUSTAR PE não tem efeito porque não tem o que ligar: o
     ataque desarmado de graça do Lutador Superior JÁ ficava de fora do Motor
     (é economia de ação, não stat), então o "sem custo" muda um texto que o
     Motor nunca leu. Ele fica na descrição da opção, e só. */
  out.gem_base_lutador_superior = [
    { canal: "dadosDano", alvo: "basico", expr: "1" },
    { canal: "empolgacaoInicial", expr: "1" },
  ];

  /* ---------------- VERDADEIRAS ORIGENS · a copiada que tem número ----------
     ⚠ ESTE É O CAMINHO QUE O COMENTÁRIO DO `caracteristicaCopiada` PROMETIA e
     ninguém tinha usado ainda: *"quem precisar de canal declara em
     ORIGEM_ESCOLHA_EFEITOS, pelo id `vo_*`"*. Até 2026-08-29 toda característica
     copiada entrava só como TEXTO (mais a Aptidão concedida por nome, que anda
     por outro caminho), e ninguém tinha reparado porque nenhuma das copiáveis
     tinha número.

     A Natureza Amaldiçoada tem. Os dois canais são COPIADOS de
     `ORIGEM_EFEITOS.maldicao`, e a cópia é literal de propósito: é a mesma
     regra, e a única razão de ela não ser lida dali é que aquele mapa é
     chaveado pela ORIGEM inteira, e a Maldição tem três características.

     ⚠ O DIA EM QUE A MALDIÇÃO GANHAR OUTRA CARACTERÍSTICA COM NÚMERO, as duas
     linhas aqui deixam de bater com as de lá em silêncio. Anotado em
     docs/a-fazer.md. */
  out.vo_maldicao_natureza_amaldicoada = [
    { canal: "vagasAptidao", expr: "1 + (nd >= 10) + (nd >= 15)" },
    { canal: "pe", expr: "nd" },
  ];

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
