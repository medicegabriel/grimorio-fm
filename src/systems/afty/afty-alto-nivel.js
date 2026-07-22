/**
 * Catálogo de ALTO NÍVEL (21+) + resolvers puros:
 * Melhorias Superiores, Habilidades Lendárias e Habilidades Ápice.
 *
 * Regras confirmadas pelo autor (2026-07-22):
 *
 * 1. **Não dependem de Especialização nenhuma.** Ao contrário das Habilidades
 *    de Especialização (que leem o nível daquela classe), aqui o que conta é o
 *    ND. Por isso o arquivo não importa nada de classe, exceto para avaliar os
 *    pré-requisitos das Ápices.
 * 2. **Orçamentos SEPARADOS, e separados também do orçamento de Habilidades.**
 *    Uma Melhoria Superior em todo nível ÍMPAR a partir do 21 (21, 23, 25...)
 *    e uma Habilidade Lendária em todo nível PAR a partir do 22 (22, 24...).
 *    Abaixo do ND 21 os dois são zero e a UI nem aparece.
 * 3. **Melhoria não repete, salvo quando o texto diz.** As que repetem trazem
 *    `maxVezes` e o incremento das repetições no próprio texto (Vida: 20 na
 *    primeira e 15 nas outras duas). As Lendárias NÃO repetem, nenhuma.
 * 4. **A Ápice vem de graça DENTRO de Atingir Ápice**, como escolha aninhada:
 *    "após escolher a habilidade lendária Atingir Ápice, você pode escolher uma
 *    das habilidades abaixo". Só uma por personagem, daí `quantidade: 1`.
 *
 * ⚠ Ids levam prefixo `mel_` (Melhoria), `len_` (Lendária) e `api_` (Ápice),
 * mesma convenção de `cmb_`/`tal_`/`mal_`.
 *
 * ⚠ Ordem dos arrays = ordem do livro (alfabética nos três casos, por acaso).
 *
 * ⚠ Texto VERBATIM do livro, com os erros dele preservados (ex.: "você está
 * sempre preparo" em Preparo Absoluto). Os `Pré-Requisito:` do fim da descrição
 * foram extraídos para `requisitos` estruturado, padrão do projeto.
 *
 * ⚠ NENHUM EFEITO É APLICADO. Igual às Habilidades e aos Talentos, o catálogo
 * hoje só trava pré-requisito e conta orçamento. Ligar Melhoria de Vida no HP,
 * Melhoria de Alma na Integridade, etc. depende do canal de efeitos do lado da
 * criatura, que não existe (ver "bloqueio raiz" em docs/afty-status.md).
 * ⚠ Aperfeiçoamento de Atributo ("podendo superar o máximo de 30") vai quebrar
 * o teto duro de 30 de `deriveAfty` quando esse canal existir.
 */

import { AFTY_ATTRS, AFTY_RESISTENCIAS } from "./afty-schema";
import { AFTY_PERICIAS } from "./afty-pericias";
import { getHabilidade } from "./afty-habilidades";
import { getEspecializacao } from "./afty-especializacoes";

/** Primeiro nível em que cada trilha começa a render escolha. */
export const MELHORIA_NIVEL_INICIAL = 21;   // ímpares: 21, 23, 25...
export const LENDARIA_NIVEL_INICIAL = 22;   // pares:   22, 24, 26...

/* Pools reusados por escolhas aninhadas. Vêm dos catálogos existentes, então
   uma perícia nova entra aqui sozinha. */
const OPCOES_PERICIA = AFTY_PERICIAS.map((p) => ({ id: p.id, nome: p.nome }));
const OPCOES_ATRIBUTO = AFTY_ATTRS.map((a) => ({ id: a.key, nome: a.label }));
const OPCOES_RESISTENCIA = AFTY_RESISTENCIAS.map((r) => ({ id: r.value, nome: r.label }));

/* ============================================================ */
/* MELHORIAS SUPERIORES                                          */
/* ============================================================ */

/* Abertura do livro, NÃO exibida (o autor mandou tirar em 2026-07-22): "Em todo
   nível ímpar, você pode escolher uma melhoria superior. A menos que
   especificado o contrário, não é possível escolher a mesma melhoria mais de
   uma vez." As duas regras dela já estão no código, em
   `totalMelhoriasSuperiores` e no `maxVezes` de cada melhoria. */
export const MELHORIAS_SUPERIORES = [
  {
    id: "mel_alma",
    nome: "Melhoria de Alma",
    descricao:
      "Você compreende melhor a alma, expandindo a sua própria. Seu máximo de integridade da alma " +
      "aumenta em 15. Você pode pegar esta melhoria uma segunda vez, aumentando em mais 10.",
    maxVezes: 2,
  },
  {
    id: "mel_atencao",
    nome: "Melhoria de Atenção",
    descricao:
      "Sua atenção é mais apurada, com sentidos afiados. Seu valor de atenção aumenta em 5.",
    maxVezes: 1,
  },
  {
    id: "mel_classe_de_armadura",
    nome: "Melhoria de Classe de Armadura",
    descricao:
      "Seja por resistência ou esquivando, te acertar é mais difícil. Sua Classe de Armadura " +
      "aumenta em 3. Você pode pegar esta melhoria uma segunda vez, aumentando em mais 2.",
    maxVezes: 2,
  },
  {
    id: "mel_classe_de_dificuldade",
    nome: "Melhoria de Classe de Dificuldade",
    descricao:
      "Com técnicas e habilidades refinadas, resistir a elas se torna mais difícil. A CD de todas " +
      "suas habilidades de técnica, aptidões amaldiçoadas e habilidades de especialização aumenta " +
      "em 3. Você pode pegar esta melhoria uma segunda vez, aumentando em mais 2.",
    maxVezes: 2,
  },
  {
    id: "mel_dano",
    nome: "Melhoria de Dano",
    descricao:
      "Poder destrutivo é o que há de mais valioso, e você refina isso. Sempre que causar dano com " +
      "uma habilidade, aptidão ou ataque, você soma o seu bônus de maestria neste dano.",
    maxVezes: 1,
  },
  {
    id: "mel_energia",
    nome: "Melhoria de Energia",
    descricao:
      "A energia amaldiçoada é cultivada com mais facilidade e naturalidade em seu interior. Seu " +
      "máximo de pontos de energia amaldiçoada aumenta em 6. Você pode pegar esta melhoria uma " +
      "segunda vez, aumentando em mais 4.",
    maxVezes: 2,
  },
  {
    id: "mel_movimento",
    nome: "Melhoria de Movimento",
    descricao:
      "Agilidade e velocidade são importantes. Seu valor de movimento aumenta em 6 metros.",
    maxVezes: 1,
  },
  {
    id: "mel_pericia",
    nome: "Melhoria de Perícia",
    descricao:
      "Uma certa perícia é sua especialidade, e você domina ela cada vez mais. Uma perícia a sua " +
      "escolha recebe um bônus adicional igual a metade do seu bônus de maestria.",
    maxVezes: 1,
    escolha: { label: "Perícia", quantidade: 1, opcoes: OPCOES_PERICIA },
  },
  {
    id: "mel_precisao",
    nome: "Melhoria de Precisão",
    descricao:
      "Você é cada vez mais preciso, encaixando golpes com facilidade. Sempre que realizar uma " +
      "rolagem de ataque, você soma metade do seu bônus de maestria ao total.",
    maxVezes: 1,
  },
  {
    id: "mel_resistencia",
    nome: "Melhoria de Resistência",
    descricao:
      "Resistir a efeitos é essencial, e você sabe o jeito certo de evitar danos. Escolha um Teste " +
      "de Resistência: você recebe um bônus igual a metade do seu bônus de maestria, além de ter a " +
      "margem necessária para um sucesso crítico reduzida no mesmo valor.",
    maxVezes: 1,
    escolha: { label: "Teste de Resistência", quantidade: 1, opcoes: OPCOES_RESISTENCIA },
  },
  {
    id: "mel_vida",
    nome: "Melhoria de Vida",
    descricao:
      "Você é vigoroso e inquebrável. Seu máximo de pontos de vida aumenta em 20. Você pode pegar " +
      "esta melhoria mais duas vezes, aumentando o máximo em 15 ao invés de 20.",
    maxVezes: 3,
  },
];

/* ============================================================ */
/* HABILIDADES ÁPICE                                             */
/* ============================================================ */
/* Vêm ANTES das Lendárias porque Atingir Ápice as usa como pool.
 *
 * ⚠ TRÊS PRÉ-REQUISITOS DO LIVRO NÃO EXISTEM MAIS (autor, 2026-07-22), e por
 * decisão dele ficam como `nota`: aparecem como lembrete na linha e NÃO
 * bloqueiam, para não deixar a Ápice inalcançável. São eles:
 *   • "Ápice Corporal Humano"        (Fluxo Invencível)
 *   • "Flanco"                        (Rei do Tabuleiro)
 *   • "Agilidade no Campo de Batalha" (Rei do Tabuleiro, extinta)
 *
 * ⚠ RENOMES já resolvidos, apontando para a habilidade real:
 *   • "Dominância em Habilidade" → `cnj_dominancia_em_feitico`
 *   • "Especialista em Técnicas" → Especialização Conjurador
 *   • "Especialista em Combate"  → Especialização Combatente
 * As duas últimas saem dos próprios pré-requisitos: as habilidades citadas ao
 * lado são `cnj_` e `cmb_`. */

export const APICE_INTRO =
  "Existem certas habilidades que representam o ápice de uma especialização, extraindo o máximo do " +
  "seu potencial. Um personagem só pode obter uma habilidade ápice de especialização, e deve " +
  "atender a todos os requisitos.";

export const HABILIDADES_APICE = [
  {
    id: "api_fluxo_invencivel",
    nome: "Fluxo Invencível",
    descricao:
      "As lendas dizem de um restringido que aperfeiçoou tanto seu corpo que era capaz de bater de " +
      "frente a feiticeiros cujo poder poderia ser comparado ao de deuses. Você consegue entrar em " +
      "um estado de fluxo onde se equipara a ele, tornando-se quase invencível. Como uma ação " +
      "livre, você pode gastar 6 pontos de vigor para adentrar no estado de Fluxo, onde recebe os " +
      "seguintes benefícios: todos seus ataques causam dano adicional igual ao seu bônus de luta e " +
      "metade do seu bônus de luta no acerto, você recebe +12 em testes de resistência, a sua " +
      "margem de crítico reduz em dois números, todo acerto crítico causa +2 dados de dano, você " +
      "recebe 30 de redução de dano e sua Classe de Armadura aumenta em 12, além de você poder " +
      "realizar um ataque adicional junto da sua ação de ataque. Você pode manter este estado por " +
      "até duas rodadas, mas para cada rodada mantida, você recebe um ponto de exaustão no final e " +
      "paga 4 pontos de vigor.",
    requisitos: [
      { tipo: "nivelEspec", espId: "restringido", valor: 20 },
      { tipo: "nota", texto: "Ápice Corporal Humano" },
    ],
  },
  {
    id: "api_forca_do_infinito",
    nome: "Força do Infinito",
    descricao:
      "Na história do Jujutsu houve um feiticeiro cuja energia beirava o infinito, assim como a " +
      "dimensão que portava em seu interior. Por alguns instantes, você consegue manipular a " +
      "própria força do infinito. Como uma ação livre, você pode adentrar no estado de Infinitude, " +
      "onde seu movimento torna-se em movimento de voo, habilidades de técnica de nível um e dois " +
      "têm seu custo transformado em zero e você consegue dominar até mesmo a energia e técnica dos " +
      "outros, liberando uma nova ação dentro de combate: como uma ação comum você pode forçar uma " +
      "criatura a realizar um teste de resistência de vontade com dificuldade aumentada em 6 e, em " +
      "uma falha, você pode forçar a criatura a usar qualquer uma das suas ações ou habilidades de " +
      "técnica contra um alvo a sua escolha, incluindo ela mesma. Esse estado pode durar até três " +
      "rodadas, mas para cada rodada mantida você deve pagar 5 pontos de energia e recebe um ponto " +
      "de exaustão no final.",
    requisitos: [
      { tipo: "nivelEspec", espId: "conjurador", valor: 20 },
      { tipo: "habilidade", id: "cnj_manipulacao_perfeita" },
      // O livro escreve "Dominância em Habilidade", que não existe. É esta.
      { tipo: "habilidade", id: "cnj_dominancia_em_feitico" },
    ],
  },
  {
    id: "api_invencivel_sob_o_sol",
    nome: "Invencível sob o Sol",
    descricao:
      "Fala-se de um feiticeiro que mesmo cego percebia todos seus arredores e encontrou um caminho " +
      "para alcançar seu ápice, tornando-se invencível e eterno sob o sol. No seu turno, você pode, " +
      "como uma ação livre, adentrar em um estado de Invencibilidade, onde sua Classe de Armadura " +
      "aumenta em 12 e recebe +12 em testes de resistência, você tem todos os efeitos positivos das " +
      "suas posturas ativos simultaneamente e tem sua margem de crítico reduzido em um, além de ser " +
      "imune a ataques críticos inimigos. Você pode manter este estado por até quatro rodadas, mas " +
      "para cada rodada mantida, você recebe um ponto de exaustão no final e paga 4 pontos de " +
      "energia amaldiçoada.",
    requisitos: [
      { tipo: "nivelEspec", espId: "combatente", valor: 20 },
      { tipo: "habilidade", id: "cmb_assumir_postura" },
      { tipo: "habilidade", id: "cmb_preparacao_rapida" },
      { tipo: "habilidade", id: "cmb_mestre_da_postura" },
    ],
  },
  {
    id: "api_mare_da_vida",
    nome: "Maré da Vida",
    descricao:
      "Uma peculiar feiticeira era conhecida pela sua técnica única que utilizava das águas da " +
      "vida, assim nunca deixando que os seus aliados caíssem. Inspirando-se nisso, você pode " +
      "trazer uma maré de vida para seus aliados: você pode gastar todo o seu turno cobrindo todos " +
      "seus aliados com sua aura, que é expandida grandemente. Uma criatura coberta por sua aura " +
      "não pode ter seus pontos de vida reduzidos a zero e nem a sua alma reduzida e ignora " +
      "qualquer condição que seja imposta nela, além de receber da sua cura básica no começo de " +
      "todo turno. Você pode manter essa habilidade por até quatro rodadas, mas para cada rodada " +
      "que você manter, você recebe um ponto de exaustão quando a encerrar e gasta 4 pontos de " +
      "energia amaldiçoada.",
    requisitos: [
      { tipo: "nivelEspec", espId: "suporte", valor: 20 },
      { tipo: "habilidade", id: "sup_intervencao" },
      { tipo: "habilidade", id: "sup_purificacao_da_alma" },
    ],
  },
  {
    id: "api_poder_da_trindade",
    nome: "Poder da Trindade",
    descricao:
      "Em tempos distantes, falava-se de três lendários feiticeiros, cada um representando um dos " +
      "aspectos - corpo, mente e alma - e que juntos formavam a inabalável trindade; tendo " +
      "masterizado esses aspectos, também, você pode temporariamente puxar do mesmo poder que eles. " +
      "Uma vez por dia, como uma ação livre, você pode puxar o poder da trindade por uma rodada: " +
      "você recebe 40 de redução de dano a todos os tipos de dano e sucede automaticamente em todos " +
      "os testes de resistência; todos seus ataques são acertos, necessitando apenas da rolagem " +
      "para a possibilidade de crítico e causam 10 de dano a mais, e ao terminar o seu turno, você " +
      "pode realizar outro turno logo em seguida. Quando essa rodada terminar e você sai desse " +
      "estado, você recebe dois pontos de exaustão.",
    requisitos: [
      { tipo: "nivelEspec", espId: "lutador", valor: 20 },
      { tipo: "habilidade", id: "lut_corpo_sincronizado" },
      { tipo: "habilidade", id: "lut_mente_em_paz" },
      { tipo: "habilidade", id: "lut_alma_quieta" },
    ],
  },
  {
    id: "api_rei_do_tabuleiro",
    nome: "Rei do Tabuleiro",
    descricao:
      "Para você, o campo de batalha é como o tabuleiro de um jogo, e o seu papel é claro: ser o " +
      "Rei. Como uma ação livre, você se torna o Rei dentro de batalha, recebendo os seguintes " +
      "benefícios durante o seu turno: sua ação de comando passa a afetar uma quantidade de " +
      "invocações igual ao máximo que você pode manter ativo em campo (caso tenha apenas uma, " +
      "considera-se que você pode dar essa quantidade de comandos para ela), o custo para utilizar " +
      "Agilidade no Campo de Batalha se torna zero, além de você poder a utilizar uma segunda vez " +
      "dentro de seu turno, e Flanco Avançado passa a ser aplicado em qualquer criatura que esteja " +
      "dentro do alcance de pelo menos uma de suas invocações. Após o final do seu turno, você sai " +
      "desse estado e recebe dois pontos de exaustão, mas você ainda continua a prezar por suas " +
      "peças: até o começo do seu próximo turno, nenhuma de suas invocações pode ser dissipada ou " +
      "exorcizada a força.",
    requisitos: [
      { tipo: "nivelEspec", espId: "controlador", valor: 20 },
      { tipo: "nota", texto: "Flanco" },
      { tipo: "nota", texto: "Agilidade no Campo de Batalha" },
      { tipo: "habilidade", id: "ctr_flanco_avancado" },
      { tipo: "habilidade", id: "ctr_mestre_do_controle" },
    ],
  },
];

/* ============================================================ */
/* HABILIDADES LENDÁRIAS                                         */
/* ============================================================ */

/* Abertura do livro, NÃO exibida (o autor mandou tirar em 2026-07-22): "Abaixo
   você encontra as Habilidades Lendárias que podem ser disponibilizadas para os
   personagens." É só apresentação da lista, não traz regra.
   ⚠ A de APICE_INTRO CONTINUA sendo exibida: aquela traz regra de verdade
   ("um personagem só pode obter uma habilidade ápice"). */
export const HABILIDADES_LENDARIAS = [
  {
    id: "len_agilidade_inigualavel",
    nome: "Agilidade Inigualável",
    descricao:
      "Sua agilidade e rapidez são inigualáveis, permitindo um movimento quase impossível de " +
      "acompanhar. Ao obter esta habilidade, você recebe uma ação de movimento adicional todo turno.",
    requisitos: [],
  },
  {
    id: "len_aperfeicoamento_de_atributo",
    nome: "Aperfeiçoamento de Atributo",
    descricao:
      "Ao obter esta habilidade, você aumenta o valor de um atributo em 2, podendo superar o " +
      "máximo de 30.",
    requisitos: [],
    escolha: { label: "Atributo", quantidade: 1, opcoes: OPCOES_ATRIBUTO },
  },
  {
    id: "len_conhecimento_iluminado",
    nome: "Conhecimento Iluminado",
    descricao:
      "Sua mente foi iluminada com um conhecimento extremo. Ao obter esta habilidade, você escolhe " +
      "3 perícias para se tornar especialista em.",
    requisitos: [],
    escolha: { label: "Perícias", quantidade: 3, opcoes: OPCOES_PERICIA },
  },
  {
    id: "len_consciencia_absoluta_da_alma",
    nome: "Consciência Absoluta da Alma",
    descricao:
      "Você conhece perfeitamente o traçado da sua alma, expandindo-a. Ao obter esta habilidade, o " +
      "seu valor máximo de Integridade da Alma aumenta em 25.",
    requisitos: [],
  },
  {
    id: "len_dominancia_em_tecnica",
    nome: "Dominância em Técnica",
    descricao:
      "Você domina sua própria técnica amaldiçoada, conseguindo criar diversos usos para a mesma. " +
      "Ao obter esta habilidade, você recebe 2 habilidades de técnica adicionais.",
    requisitos: [],
  },
  {
    id: "len_favorecido_pela_energia",
    nome: "Favorecido pela Energia",
    descricao:
      "Você é favorecido pela própria energia amaldiçoada, conseguindo elevar seu conhecimento " +
      "sobre ela. Ao obter esta habilidade, você recebe 2 aptidões amaldiçoadas a sua escolha.",
    requisitos: [],
  },
  {
    id: "len_inesgotavel",
    nome: "Inesgotável",
    descricao:
      "Sua fonte de energia ou vigor é inesgotável. Ao obter esta habilidade, o seu máximo de " +
      "pontos de energia amaldiçoada ou de vigor aumenta em 6.",
    requisitos: [],
    escolha: {
      label: "Recurso",
      quantidade: 1,
      opcoes: [
        { id: "energia", nome: "Pontos de Energia Amaldiçoada" },
        { id: "vigor", nome: "Pontos de Vigor" },
      ],
    },
  },
  {
    id: "len_inquebravel",
    nome: "Inquebrável",
    descricao:
      "O seu corpo é inquebrável. Ao obter esta habilidade, você recebe 30 pontos de vida máximos " +
      "adicionais.",
    requisitos: [],
  },
  {
    id: "len_intocavel",
    nome: "Intocável",
    descricao:
      "Você é intocável. Ao obter esta habilidade, sua Classe de Armadura aumenta em 5.",
    requisitos: [],
  },
  {
    id: "len_motivacao_constante",
    nome: "Motivação Constante",
    descricao:
      "Acertar bons golpes é uma motivação constante para continuar lutando. Sempre que você " +
      "acertar um ataque crítico, você recebe 15 pontos de vida temporários, os quais podem acumular.",
    requisitos: [],
  },
  {
    id: "len_negar_a_morte",
    nome: "Negar a Morte",
    descricao:
      "Diante seu poder, até mesmo o chamado da morte pode ser negado. Uma vez por cena, caso você " +
      "fosse ter seus pontos de vida reduzidos a 0 ou menos, você pode escolher ignorar todo o dano " +
      "excedente. Ao fazer isso, você também se mantém com uma quantidade de vida igual ao dobro do " +
      "seu nível de personagem.",
    requisitos: [],
  },
  {
    id: "len_preparo_absoluto",
    nome: "Preparo Absoluto",
    descricao:
      "Você está sempre preparo para qualquer situação, desejando garantir ser o primeiro a agir. " +
      "Ao obter esta habilidade, você recebe +5 em Iniciativa.",
    requisitos: [],
  },
  {
    id: "len_resistencia_lendaria",
    nome: "Resistência Lendária",
    descricao:
      "Em certos momentos, sua própria determinação o permite resistir a certos efeitos. Ao obter " +
      "esta habilidade você passa a poder, duas vezes por dia, escolher automaticamente transformar " +
      "um teste de resistência em um sucesso crítico.",
    requisitos: [],
  },
  {
    id: "len_um_com_o_mundo",
    nome: "Um com o Mundo",
    descricao:
      "Você é um com o mundo, não deixando nada passar despercebido. Ao obter esta habilidade, você " +
      "recebe +10 em Percepção e Atenção.",
    requisitos: [],
  },
  {
    id: "len_visar_o_sucesso",
    nome: "Visar o Sucesso",
    descricao:
      "Você sempre visa o sucesso, desejando extrair o máximo do seu potencial. Sempre que falhar " +
      "em um teste de perícia, você pode gastar 2 pontos de energia para rolar novamente o dado, " +
      "ficando com o melhor resultado. Esta habilidade não pode ser utilizada em testes de ataque.",
    requisitos: [],
  },
  {
    id: "len_atingir_apice",
    nome: "Atingir Ápice",
    descricao:
      "Você atinge o ápice daquilo em que você se especializou, conseguindo extrair o máximo da sua " +
      "dedicação e empenho.",
    requisitos: [{ tipo: "nd", valor: 26 }],
    // A Ápice vem JUNTO, sem custar outra vaga de Lendária. Só uma por ficha.
    escolha: {
      label: "Habilidade Ápice",
      quantidade: 1,
      intro: APICE_INTRO,
      opcoes: HABILIDADES_APICE,
    },
  },
];

/* ============================================================ */
/* Índices e acesso                                              */
/* ============================================================ */

const MELHORIA_BY_ID = Object.fromEntries(MELHORIAS_SUPERIORES.map((m) => [m.id, m]));
const LENDARIA_BY_ID = Object.fromEntries(HABILIDADES_LENDARIAS.map((l) => [l.id, l]));
const APICE_BY_ID = Object.fromEntries(HABILIDADES_APICE.map((a) => [a.id, a]));

export const getMelhoriaSuperior = (id) => MELHORIA_BY_ID[id] || null;
export const getHabilidadeLendaria = (id) => LENDARIA_BY_ID[id] || null;
export const getHabilidadeApice = (id) => APICE_BY_ID[id] || null;

/**
 * Quantas Melhorias Superiores o ND concede: uma em cada nível ÍMPAR a partir
 * do 21 (21, 23, 25, 27...). Abaixo do 21, nenhuma.
 */
export const totalMelhoriasSuperiores = (nd) => {
  const n = Math.max(1, Math.trunc(Number(nd) || 1));
  if (n < MELHORIA_NIVEL_INICIAL) return 0;
  return Math.floor((n - MELHORIA_NIVEL_INICIAL) / 2) + 1;
};

/**
 * Quantas Habilidades Lendárias o ND concede: uma em cada nível PAR a partir
 * do 22 (22, 24, 26, 28...). Abaixo do 22, nenhuma.
 */
export const totalHabilidadesLendarias = (nd) => {
  const n = Math.max(1, Math.trunc(Number(nd) || 1));
  if (n < LENDARIA_NIVEL_INICIAL) return 0;
  return Math.floor((n - LENDARIA_NIVEL_INICIAL) / 2) + 1;
};

/** O sistema de alto nível só existe a partir do ND 21. */
export const altoNivelAtivo = (nd) => Math.max(1, Math.trunc(Number(nd) || 1)) >= MELHORIA_NIVEL_INICIAL;

/* ============================================================ */
/* Requisitos                                                    */
/* ============================================================ */

/**
 * Avalia UM pré-requisito de alto nível.
 *
 * ctx = { nd, niveisPorEspec, habilidades: [id] }.
 * Espelha avaliarRequisitoHabilidade / avaliarRequisitoTalento.
 */
export function avaliarRequisitoAltoNivel(requisito, ctx = {}) {
  if (requisito?.tipo === "nd") {
    const nd = Math.max(1, Math.trunc(Number(ctx.nd) || 1));
    return { ok: nd >= requisito.valor, verificavel: true, label: `Nível ${requisito.valor}` };
  }
  // "20 Níveis de Restringido": nível REAL naquela especialização (não o de
  // escalonamento), mesma convenção dos pré-requisitos de Habilidade.
  if (requisito?.tipo === "nivelEspec") {
    const esp = getEspecializacao(requisito.espId);
    const atual = ctx.niveisPorEspec?.[requisito.espId] ?? 0;
    return {
      ok: atual >= requisito.valor,
      verificavel: true,
      label: `${requisito.valor} Níveis de ${esp?.nome || requisito.espId}`,
    };
  }
  if (requisito?.tipo === "habilidade") {
    const alvo = getHabilidade(requisito.id);
    // Referência pendente: exibe e NÃO bloqueia (senão a Ápice ficaria presa).
    if (!alvo) return { ok: true, verificavel: false, label: requisito.id };
    return { ok: (ctx.habilidades || []).includes(requisito.id), verificavel: true, label: alvo.nome };
  }
  // Habilidade que o livro cita mas que não existe mais no Afty. Só exibe.
  if (requisito?.tipo === "nota") {
    return { ok: true, verificavel: false, label: requisito.texto };
  }
  return { ok: true, verificavel: true, label: null };
}

/** Avalia o acesso a uma Lendária ou Ápice. Retorna { ok, extras }. */
export function avaliarAcessoAltoNivel(item, ctx = {}) {
  const extras = (item?.requisitos || []).map((r) => avaliarRequisitoAltoNivel(r, ctx));
  return { ok: extras.every((e) => e.ok), extras };
}

/* ============================================================ */
/* Resolvers                                                     */
/* ============================================================ */

/**
 * Resolve as escolhas aninhadas (perícia, atributo, TR, recurso, Ápice).
 *
 * Guarda escolhas, nunca resultados: saneia contra o pool mas NÃO apara o
 * excedente (o padrão do projeto é reportar em vermelho, não bloquear).
 * Só olha itens que estão ESCOLHIDOS e têm `escolha`.
 *
 * Retorna { porItem: { [id]: { opcoes, quantidade, excedeu } }, mapa }.
 */
function resolveEscolhas(itens, escolhasBrutas) {
  const porItem = {};
  const mapa = {};
  for (const item of itens) {
    if (!item?.escolha) continue;
    const validas = new Set(item.escolha.opcoes.map((o) => o.id));
    const brutas = Array.isArray(escolhasBrutas?.[item.id]) ? escolhasBrutas[item.id] : [];
    const vistos = new Set();
    const opcoes = [];
    for (const id of brutas) {
      if (!validas.has(id) || vistos.has(id)) continue;
      vistos.add(id);
      opcoes.push(id);
    }
    const quantidade = item.escolha.quantidade;
    porItem[item.id] = { opcoes, quantidade, excedeu: opcoes.length > quantidade };
    mapa[item.id] = opcoes;
  }
  return { porItem, mapa };
}

/**
 * Resolve o bloco de Alto Nível da ficha.
 *
 * `creature.melhoriasSuperiores` é uma lista de ids COM REPETIÇÃO: cada entrada
 * é uma escolha, então o gasto é o tamanho da lista e as vezes de uma melhoria
 * é quantas vezes o id aparece. É o shape mais simples que casa com "cada
 * repetição custa uma vaga" e dispensa contador paralelo.
 * `creature.habilidadesLendarias` é lista de ids SEM repetição (nenhuma
 * Lendária repete, autor 2026-07-22).
 *
 * O aparo do `maxVezes` é de LEITURA, não gravado (mesma convenção de
 * resolveEspecializacoes / resolveNiveisAptidao).
 *
 * ctx = { nd, niveisPorEspec, habilidades: [id] }.
 */
export function resolveAltoNivel(creature, ctx = {}) {
  const nd = Math.max(1, Math.trunc(Number(creature?.core?.nd) || 1));
  const ativo = altoNivelAtivo(nd);

  /* ---- Melhorias Superiores (repetíveis) ---- */
  const vezesPorId = new Map();
  const brutasMel = Array.isArray(creature?.melhoriasSuperiores) ? creature.melhoriasSuperiores : [];
  for (const id of brutasMel) {
    const m = MELHORIA_BY_ID[id];
    if (!m) continue;
    const atual = vezesPorId.get(id) ?? 0;
    if (atual >= m.maxVezes) continue;       // apara no teto do texto do livro
    vezesPorId.set(id, atual + 1);
  }
  // Ordem do catálogo, não a de escolha: a UI lista o catálogo inteiro.
  const melhoriasEscolhidas = MELHORIAS_SUPERIORES
    .filter((m) => vezesPorId.has(m.id))
    .map((m) => ({ id: m.id, vezes: vezesPorId.get(m.id) }));
  const melGastos = melhoriasEscolhidas.reduce((s, m) => s + m.vezes, 0);
  const melTotal = totalMelhoriasSuperiores(nd);

  /* ---- Habilidades Lendárias (uma vez cada) ---- */
  const vistos = new Set();
  const lendariasEscolhidas = [];
  for (const id of Array.isArray(creature?.habilidadesLendarias) ? creature.habilidadesLendarias : []) {
    if (!LENDARIA_BY_ID[id] || vistos.has(id)) continue;
    vistos.add(id);
    lendariasEscolhidas.push(id);
  }
  const lenTotal = totalHabilidadesLendarias(nd);

  const ctxReq = { nd, niveisPorEspec: ctx.niveisPorEspec, habilidades: ctx.habilidades };
  const inacessiveis = lendariasEscolhidas.filter(
    (id) => !avaliarAcessoAltoNivel(LENDARIA_BY_ID[id], ctxReq).ok
  );

  /* ---- Escolhas aninhadas dos dois lados, num mapa só ---- */
  const escolhidasComEscolha = [
    ...melhoriasEscolhidas.map((m) => MELHORIA_BY_ID[m.id]),
    ...lendariasEscolhidas.map((id) => LENDARIA_BY_ID[id]),
  ];
  const escolhas = resolveEscolhas(escolhidasComEscolha, creature?.escolhasAltoNivel);

  // A Ápice escolhida dentro de Atingir Ápice, para quem precisar do id.
  const apiceId = escolhas.mapa?.len_atingir_apice?.[0] ?? null;

  return {
    ativo,
    melhorias: {
      escolhidas: melhoriasEscolhidas,   // [{ id, vezes }]
      total: melTotal,
      gastos: melGastos,
      restante: melTotal - melGastos,
      excedeu: melGastos > melTotal,
    },
    lendarias: {
      escolhidas: lendariasEscolhidas,   // [id]
      total: lenTotal,
      gastos: lendariasEscolhidas.length,
      restante: lenTotal - lendariasEscolhidas.length,
      excedeu: lendariasEscolhidas.length > lenTotal,
      inacessiveis,
    },
    escolhas,                            // { porItem, mapa }
    apiceId,
  };
}

/* ============================================================ */
/* Validador de conteúdo                                         */
/* ============================================================ */

/**
 * Mesmo papel de validarCatalogoHabilidades: ids únicos, nomes únicos dentro de
 * cada lista, pré-requisitos apontando para coisa que existe, pools sãos.
 * Rodar a cada leva de conteúdo novo.
 */
export function validarCatalogoAltoNivel() {
  const problemas = [];
  const ids = new Set();

  const checarEscolha = (item) => {
    if (!item.escolha) return;
    if (!item.escolha.opcoes?.length) problemas.push(`${item.nome}: escolha sem opções`);
    if (!Number.isInteger(item.escolha.quantidade) || item.escolha.quantidade < 1) {
      problemas.push(`${item.nome}: escolha com quantidade inválida (${item.escolha.quantidade})`);
    }
    if (item.escolha.quantidade > (item.escolha.opcoes?.length ?? 0)) {
      problemas.push(`${item.nome}: escolha pede mais opções do que o pool tem`);
    }
    const opcaoIds = new Set();
    for (const o of item.escolha.opcoes || []) {
      if (opcaoIds.has(o.id)) problemas.push(`${item.nome}: opção duplicada (${o.id})`);
      opcaoIds.add(o.id);
      if (!o.nome?.trim()) problemas.push(`${item.nome}: opção sem nome (${o.id})`);
    }
  };

  const checarRequisitos = (item) => {
    for (const r of item.requisitos || []) {
      if (r?.tipo === "nivelEspec" && !getEspecializacao(r.espId)) {
        problemas.push(`${item.nome}: requisito aponta para especialização inexistente "${r.espId}"`);
      }
      if (r?.tipo === "nivelEspec" && (!Number.isInteger(r.valor) || r.valor < 1)) {
        problemas.push(`${item.nome}: requisito nivelEspec inválido (${r.valor})`);
      }
      if (r?.tipo === "nd" && (!Number.isInteger(r.valor) || r.valor < 1)) {
        problemas.push(`${item.nome}: requisito nd inválido (${r.valor})`);
      }
      // `habilidade` que não existe NÃO é erro fatal aqui (o avaliador já a
      // trata como não verificável), mas vale acusar para não passar batido.
      if (r?.tipo === "habilidade" && !getHabilidade(r.id)) {
        problemas.push(`${item.nome}: requisito aponta para habilidade inexistente "${r.id}"`);
      }
      if (r?.tipo === "nota" && !r.texto?.trim()) {
        problemas.push(`${item.nome}: requisito nota sem texto`);
      }
    }
  };

  const checarLista = (lista, rotulo, extra) => {
    const nomes = new Set();
    for (const item of lista) {
      if (ids.has(item.id)) problemas.push(`id duplicado: ${item.id}`);
      ids.add(item.id);

      const chave = item.nome.toLowerCase();
      if (nomes.has(chave)) problemas.push(`nome duplicado em ${rotulo}: ${item.nome}`);
      nomes.add(chave);

      if (!item.descricao?.trim()) problemas.push(`${item.nome}: sem descrição`);
      checarRequisitos(item);
      checarEscolha(item);
      extra?.(item);
    }
  };

  checarLista(MELHORIAS_SUPERIORES, "Melhorias Superiores", (m) => {
    if (!Number.isInteger(m.maxVezes) || m.maxVezes < 1) {
      problemas.push(`${m.nome}: maxVezes inválido (${m.maxVezes})`);
    }
  });
  checarLista(HABILIDADES_LENDARIAS, "Habilidades Lendárias");
  checarLista(HABILIDADES_APICE, "Habilidades Ápice");

  return problemas;
}
