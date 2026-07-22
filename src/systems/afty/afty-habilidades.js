/**
 * Catálogo das Habilidades de Especialização (ex-Dotes) + resolvers puros.
 *
 * Regras confirmadas pelo autor (2026-07-17):
 *
 * 1. **Orçamento = 1 + floor(ND/3)**, idêntico ao das Aptidões Amaldiçoadas.
 *    ⚠ DIVERGE DO LIVRO DE PROPÓSITO. O texto transcrito diz "No 2° nível e
 *    a cada nível seguinte, você recebe uma habilidade", o que daria ND-1
 *    (19 no ND 20 contra 7 na regra do Afty). O autor confirmou que vale a
 *    regra do Afty. Não "corrigir" para o livro.
 * 2. **Base e por Nível gastam O MESMO orçamento.** No livro as Bases são de
 *    graça; no Afty elas são escolhidas, igual às por Nível.
 * 3. **Orçamento único**, vindo do ND total, gasto onde o jogador quiser.
 *    O que muda por especialização é o ACESSO: cada habilidade exige nível
 *    NAQUELA especialização (o lado da multiclasse), não o ND.
 * 4. "Base" NÃO quer dizer "inicial": quer dizer fixa da especialização.
 *    Elas têm nível próprio (1, 4, 6, 9, 20 no Combatente).
 *
 * ⚠ Ids levam PREFIXO da especialização (`cmb_` = Combatente), pelo mesmo
 * motivo do `mal_` em ./afty-aptidoes.js: os nomes repetem entre as
 * especializações de propósito. "Teste de Resistência Mestre" existe em
 * todas ("mestre no concedido pela SUA especialização"), com texto próprio.
 * O validador aceita nome repetido ENTRE especializações e acusa dentro de uma.
 *
 * ⚠ Ordem do array = ordem do livro, NÃO alfabética (convenção do projeto).
 *
 * ⚠ Texto VERBATIM do livro. Ele contém em-dash e ponto-e-vírgula: a regra de
 * estilo do autor vale para texto que o CÓDIGO escreve, não para a transcrição.
 */

import { getEspecializacao } from "./afty-especializacoes";
import { getAptidao } from "./afty-aptidoes";

export const HABILIDADE_TIPOS = [
  { id: "base",  label: "Habilidades Base" },
  { id: "nivel", label: "Habilidades por Nível" },
];

/** Rótulos dos atributos, para requisitos `atributo` (espelha afty-aptidoes.js). */
const ATTR_LABEL = {
  forca: "Força",
  destreza: "Destreza",
  constituicao: "Constituição",
  inteligencia: "Inteligência",
  sabedoria: "Sabedoria",
  presenca: "Presença",
};

/**
 * Manobras de Empolgação (Lutador). Escolha ANINHADA da habilidade base
 * Empolgação: DUAS no nível 1, mais uma no 6, no 12 e no 18. Como o pool tem
 * exatamente 5 manobras, no nível 18 o Lutador as conhece todas.
 *
 * Todas usam o Dado de Empolgação, que vem do Nível de Empolgação (estado de
 * combate, não de ficha) e é aprimorado por Empolgação Máxima (nível 11).
 */
export const MANOBRAS_DE_EMPOLGACAO = [
  {
    id: "lut_manobra_ajuste",
    nome: "Ajuste",
    descricao:
      "Às vezes um bom golpe só precisa de um ajuste. Uma vez por rodada, ao realizar um ataque, " +
      "você pode adicionar seu dado de empolgação na rolagem de acerto e no dano. Você pode " +
      "escolher adicionar o bônus antes ou depois de saber o resultado da rolagem de acerto.",
  },
  {
    id: "lut_manobra_comando",
    nome: "Comando",
    descricao:
      "Sua empolgação pode acabar contagiando seus aliados. Ao realizar um ataque, você comanda um " +
      "aliado dentro de 1,5 metros a realizar um ataque corpo-a-corpo o acompanhando no mesmo " +
      "alvo, como uma reação dele. Você ou aliado deve pagar 1 ponto de energia amaldiçoada para " +
      "realizar o ataque. Caso use essa habilidade, você não pode utilizar ataque extra.",
  },
  {
    id: "lut_manobra_desarme",
    nome: "Desarme",
    descricao:
      "Uma boa luta não deve ser contida pelo porte de uma arma. Ao acertar uma criatura com um " +
      "ataque você aproveita para tentar a desarmar. Você adiciona seu dado de empolgação ao dano " +
      "desse ataque e o alvo deve fazer uma jogada de ataque corpo a corpo contra o resultado do " +
      "seu ataque. Em uma falha ele larga um item à sua escolha que esteja manejando.",
  },
  {
    id: "lut_manobra_esquiva",
    nome: "Esquiva",
    descricao:
      "Com o sangue fervendo, é mais fácil se esquivar de ataques. Ao ser acertado por um ataque " +
      "corpo-a-corpo você pode usar sua reação para diminuir o dano em um valor igual a uma " +
      "rolagem do seu dado de empolgação + modificador de destreza.",
  },
  {
    id: "lut_manobra_trabalho_de_pes",
    nome: "Trabalho de Pés",
    descricao:
      "Você usa da sua empolgação para trabalhar o seu movimento. Como uma ação bônus, você pode " +
      "escolher aumentar sua Defesa em um valor igual ao seu dado de empolgação, até o começo do " +
      "seu próximo turno.",
  },
];

/**
 * Estilos de Combate do Repertório do Especialista (Combatente).
 * É uma escolha ANINHADA: a habilidade é uma só, mas concede 1 estilo no
 * nível 1, mais um no 6 e outro no 12 (ver `escolha.niveis` na habilidade).
 */
export const ESTILOS_DE_COMBATE = [
  {
    id: "cmb_estilo_defensivo",
    nome: "Estilo Defensivo",
    descricao:
      "Você foca em aprimorar a sua defesa. Sua Defesa aumenta em 2 e, nos níveis 4, 8, 12 e 16 " +
      "aumenta em +1.",
  },
  {
    id: "cmb_estilo_do_arremessador",
    nome: "Estilo do Arremessador",
    descricao:
      "Você se versa em armas de arremesso. Você pode sacar uma arma de arremesso como parte do " +
      "ataque, além de receber +2 em rolagens de dano com elas, o qual aumenta em +1 nos níveis " +
      "4, 8, 12 e 16.",
  },
  {
    id: "cmb_estilo_do_duelista",
    nome: "Estilo do Duelista",
    descricao:
      "Você foca em duelar com uma única arma em mãos. Ao usar uma arma em uma mão e ter a outra " +
      "livre, você recebe +1 em rolagens de acerto e +2 em rolagens de dano. Nos níveis 4, 8, 12 " +
      "e 16, o bônus em dano aumenta em +1; nos níveis 8 e 16, o bônus em acerto aumenta em +1.",
  },
  {
    id: "cmb_estilo_do_interceptador",
    nome: "Estilo do Interceptador",
    descricao:
      "Você se dedica a utilizar de suas armas para interceptar ataques em seus aliados. Quando " +
      "um aliado dentro do seu alcance receber um ataque, você pode usar sua reação para reduzir " +
      "o dano causado em 1d10 + seu modificador de força, destreza ou sabedoria, aumentando em " +
      "um dado nos níveis 4, 8, 12 e 16.",
  },
  {
    id: "cmb_estilo_do_protetor",
    nome: "Estilo do Protetor",
    descricao:
      "Você se dedica a proteger seus aliados, buscando evitar um acerto. Quando uma criatura " +
      "ataca um alvo além de você, que esteja dentro de 1,5 metros, você pode usar sua reação " +
      "para impor desvantagem. Além disso, você pode também conceder vantagem no Teste de " +
      "Resistência de um aliado dentro de 1,5 metros.",
  },
  {
    id: "cmb_estilo_distante",
    nome: "Estilo Distante",
    descricao:
      "Você sabe como usar armas que focam em atingir de maneira distante. Você recebe +1 em " +
      "rolagens de acerto e +2 em rolagens de dano com armas a distância. Nos níveis 4, 8, 12 e " +
      "16, o bônus em dano aumenta em +1; nos níveis 8 e 16, o bônus em acerto aumenta em +1.",
  },
  {
    id: "cmb_estilo_duplo",
    nome: "Estilo Duplo",
    descricao:
      "Você sabe a maneira perfeita de manejar duas armas. Enquanto estiver lutando com duas " +
      "armas, você pode adicionar o seu bônus de atributo no dano do ataque com a segunda arma, " +
      "além de receber um bônus de +1 em rolagens de dano, o qual aumenta em +1 nos níveis 4, 8, " +
      "12 e 16.",
  },
  {
    id: "cmb_estilo_massivo",
    nome: "Estilo Massivo",
    descricao:
      "Você domina armas pesadas e massivas. Quando rolar um 1 ou 2 em um dado na rolagem de " +
      "dano com uma arma que esteja usando em duas mãos ou que possua a propriedade pesada, você " +
      "pode rolar novamente esse dado, ficando com o novo resultado. Além disso, você recebe +1 " +
      "em rolagens de dano com a arma, aumentando em +1 nos níveis 4, 8, 12 e 16.",
  },
];

/**
 * Posturas de Combate do Assumir Postura (Combatente). Segunda escolha
 * ANINHADA do sistema (a 1ª são os Estilos): aprende 1 ao obter, mais um
 * nos níveis 8 e 16, e a habilidade Aprender Postura concede mais (4 e 10).
 *
 * ⚠ `nivelMin` são os pré-requisitos "Pré-Requisito: Nível N" das últimas
 * três posturas. Se N é nível de Especialista ou de personagem é ambíguo no
 * livro (aqui tudo mais é nível de Especialista); resolver quando o estado
 * da escolha aninhada existir. Por ora as Posturas são só leitura.
 */
export const POSTURAS_DE_COMBATE = [
  {
    id: "cmb_postura_do_sol",
    nome: "Postura do Sol",
    descricao:
      "Uma postura que foca na ofensiva, sacrificando sua defesa. Enquanto na postura do sol, " +
      "todos seus ataques recebem +2 para acertar e causam um dado de dano a mais. Entretanto, " +
      "sua Defesa diminui em 4.",
  },
  {
    id: "cmb_postura_da_lua",
    nome: "Postura da Lua",
    descricao:
      "Uma postura que foca na defesa, sacrificando sua ofensiva. Enquanto na postura da lua, " +
      "você recebe +3 de Defesa, você pode usar Andar ou Desengajar como ação livre e pode, como " +
      "uma reação, reduzir um dano que você receber em um valor igual ao seu nível de personagem. " +
      "Entretanto, todos seus ataques recebem -4 para acertar e não recebem seu bônus de atributo " +
      "no dano.",
  },
  {
    id: "cmb_postura_da_terra",
    nome: "Postura da Terra",
    descricao:
      "Uma postura que foca na resistência e durabilidade. Enquanto na postura da terra você não " +
      "pode ser movido a força, soma seu bônus de treinamento em rolagens de Fortitude e, no " +
      "começo do seu turno, você recebe pontos de vida temporários igual ao seu nível de personagem.",
  },
  {
    id: "cmb_postura_do_dragao",
    nome: "Postura do Dragão",
    descricao:
      "Enquanto na postura do dragão, sempre que realizar um ataque, todo inimigo dentro de 1,5 " +
      "metros do alvo desse ataque deve realizar um TR de Fortitude ou recebe metade do dano que " +
      "o alvo recebeu.",
  },
  {
    id: "cmb_postura_da_fortuna",
    nome: "Postura da Fortuna",
    descricao:
      "Enquanto estiver na postura da fortuna, ao rodar um d20 e conseguir um resultado igual ou " +
      "menor ao seu bônus de treinamento, você pode escolher o rolar novamente, ficando com o " +
      "maior resultado. Você pode utilizar este efeito uma quantidade de vezes igual a metade do " +
      "seu bônus de treinamento por rodada e apenas uma vez no mesmo dado.",
  },
  {
    id: "cmb_postura_da_devastacao",
    nome: "Postura da Devastação",
    descricao:
      "Enquanto na postura da devastação, para cada golpe acertado contra o mesmo alvo, você " +
      "recebe +1 em acerto e ignora 2 de redução de dano, até um máximo igual ao seu bônus de " +
      "treinamento para o acerto e o dobro dele para a redução de dano. Se você trocar de alvo uma " +
      "vez, retorna ao zero.",
    nivelMin: 6,
  },
  {
    id: "cmb_postura_da_tempestade",
    nome: "Postura da Tempestade",
    descricao:
      "Enquanto na postura da tempestade, sempre que acertar um ataque o alvo realiza um TR de " +
      "Fortitude, sendo derrubado em uma falha. Caso acerte um ataque em um alvo já caído, ele " +
      "deve repetir o teste e, caso falhe, fica imóvel até o começo do seu turno.",
    nivelMin: 10,
  },
  {
    id: "cmb_postura_do_ceu",
    nome: "Postura do Céu",
    descricao:
      "Uma postura balanceada, que apenas acentua suas capacidades essenciais. Enquanto na " +
      "postura do céu, o alcance dos seus ataques é dobrado, você recebe 2 pontos de preparo " +
      "temporários no começo de todo turno e +2 em todas as suas rolagens de perícia.",
    nivelMin: 12,
  },
];

/**
 * Estilos de Controle da habilidade Apogeu (Controlador). Terceira escolha
 * ANINHADA do sistema: ao obter Apogeu (nível 6) você escolhe UM dos três
 * caminhos abaixo (`escolha.niveis: [6]`, uma concessão só). Diferente dos
 * pools do Combatente, este não é somado por outras habilidades: é a
 * subclasse do controlador, decidida uma vez.
 *
 * ⚠ Texto VERBATIM: contém ponto-e-vírgula (regra de estilo do autor vale
 * para o que o CÓDIGO escreve, não para a transcrição).
 */
export const ESTILOS_DE_CONTROLE = [
  {
    id: "ctr_controle_concentrado",
    nome: "Controle Concentrado",
    descricao:
      "Você opta por concentrar suas forças e foco em uma única invocação, a qual sozinha se " +
      "torna uma arma absoluta. Ao invés de invocar/ativar duas invocações como uma ação bônus, " +
      "você pode invocar apenas uma como ação livre.",
  },
  {
    id: "ctr_controle_disperso",
    nome: "Controle Disperso",
    descricao:
      "Você prefere controlar diversas invocações, mantendo a quantidade sempre em número " +
      "superior. O número de invocações que você pode manter ativas em campo aumenta em 1, assim " +
      "como a quantidade que você pode invocar/ativar com uma ação aumenta em 1. Além disso, você " +
      "recebe acesso à ação Criar Horda (p.259). A partir do nível 12, o número de invocações que " +
      "você pode manter ativas em campo e invocar/ativar com uma ação aumenta em 1, assim como " +
      "você pode criar duas hordas como parte de uma mesma ação de Criar Horda.",
  },
  {
    id: "ctr_controle_sintonizado",
    nome: "Controle Sintonizado",
    descricao:
      "Você prefere ficar em sintonia com suas invocações, não deixando que apenas elas lutem " +
      "sozinhas. Uma vez por rodada, quando uma invocação em campo realizar um ataque contra um " +
      "alvo dentro do seu alcance, você pode pagar 2PE para, como uma Ação Livre, realizar um " +
      "ataque contra o mesmo alvo. Além disso, para cada invocação que possua em campo, você " +
      "recebe +1 em acerto e dano, com elas te auxiliando.",
  },
];

/**
 * Melhorias da habilidade Melhoria de Controlador (Controlador). Quarta
 * escolha ANINHADA do sistema: cada vez que você pega Melhoria de Controlador
 * escolhe UMA melhoria daqui (`escolha.niveis: [2]`, uma concessão por
 * instância). A habilidade é REPETÍVEL (até 4x, uma por melhoria), mas o
 * shape atual da ficha (lista de ids únicos) ainda não suporta pegar 2x+;
 * ver o comentário na habilidade dona.
 *
 * ⚠ Texto VERBATIM do "final da especialização": contém ponto-e-vírgula.
 */
export const MELHORIAS_DE_CONTROLADOR = [
  {
    id: "ctr_melhoria_agressividade",
    nome: "Agressividade",
    descricao:
      "Os ataques da Invocação causam 1d6 de dano adicional. No nível 4, recebem um bônus de +3 " +
      "em rolagens de dano; no nível 8, o dado de dano adicional aumenta para 1d8; no nível 12, o " +
      "bônus em rolagens de dano aumenta para +6; no nível 16, o dado aumenta para 1d10 e, no " +
      "nível 18, aumenta para 1d12.",
  },
  {
    id: "ctr_melhoria_resistencia",
    nome: "Resistência",
    descricao:
      "A Defesa da sua Invocação aumenta em 2. No nível 4, recebe 2 de RD contra todos os tipos; " +
      "no nível 8 recebe +1 de Defesa; no nível 12 recebe mais 3 de RD contra todos os tipos; no " +
      "nível 16 recebe +1 de Defesa e, no nível 18, recebe +2 de Defesa.",
  },
  {
    id: "ctr_melhoria_mobilidade",
    nome: "Mobilidade",
    descricao:
      "O Deslocamento da sua Invocação aumenta em 1,5 metros. Nos níveis 4, 8, 12, 16 e 18 " +
      "aumenta em +1,5m.",
  },
  {
    id: "ctr_melhoria_precisao",
    nome: "Precisão",
    descricao:
      "A Invocação recebe +2 em Jogadas de Ataque ou tem a CD de suas Ações aumentada em +2. No " +
      "nível 4, ela recebe +2 em Jogadas de Ataque ou CD; no nível 8 recebe +1 em Jogada de Ataque " +
      "ou CD e pode, uma vez por cena, rolar novamente um ataque ou forçar um inimigo a rolar " +
      "novamente um TR; no nível 12, a capacidade de rolar novamente se torna uma vez por rodada; " +
      "no nível 16, recebe +2 em Jogadas de Ataque ou CD e, no nível 18 recebe +2 em Jogadas de " +
      "Ataque ou CD.",
  },
];

/**
 * Mudanças de Fundamento (Conjurador). Escolha ANINHADA de Domínio dos
 * Fundamentos: DUAS no nível 1 e uma adicional no 12. Expansão dos
 * Fundamentos (8°) concede mais uma no 8 e outra no 12, do MESMO pool, e
 * Versatilidade em Fundamentos (4°) permite trocá-las num descanso.
 *
 * ⚠ Feitiço Rápido tem `nivelMin` (o "Pré-Requisito: Nível 6" do livro),
 * mesma convenção das últimas Posturas de Combate.
 */
export const MUDANCAS_DE_FUNDAMENTO = [
  {
    id: "cnj_fundamento_feitico_cruel",
    nome: "Feitiço Cruel",
    descricao:
      "Quando usar um Feitiço que força um Teste de Resistência você pode gastar 1 ponto de " +
      "energia amaldiçoada para aumentar a CD do teste em 2 ou 2 pontos para aumentar em 4.",
  },
  {
    id: "cnj_fundamento_feitico_distante",
    nome: "Feitiço Distante",
    descricao:
      "Quando usar um Feitiço a distância, você pode gastar 2 pontos de energia amaldiçoada para " +
      "dobrar seu alcance. Caso seja um Feitiço corpo-a-corpo, você pode gastar 2 pontos de " +
      "energia para a dar um alcance de 9 metros.",
  },
  {
    id: "cnj_fundamento_feitico_duplicado",
    nome: "Feitiço Duplicado",
    descricao:
      "Uma vez por rodada, quando usar um Feitiço de dano cujo alvo seja apenas uma criatura, você " +
      "pode gastar pontos de energia para dar um segundo alvo a habilidade. O custo é igual ao " +
      "dobro do nível do Feitiço (considere 1 para Feitiços nível 0).",
  },
  {
    id: "cnj_fundamento_feitico_expansivo",
    nome: "Feitiço Expansivo",
    descricao:
      "Quando usar um Feitiço em área, você pode gastar 3 pontos de energia amaldiçoada para " +
      "aumentar a área em um valor igual a metade da área padrão (1,5x do total).",
  },
  {
    id: "cnj_fundamento_feitico_potente",
    nome: "Feitiço Potente",
    descricao:
      "Quando usar um Feitiço de dano, você pode gastar 2 pontos de energia amaldiçoada e rolar " +
      "novamente uma quantidade de dados de dano igual ao seu modificador de Inteligência ou " +
      "Sabedoria, utilizando os melhores resultados.",
  },
  {
    id: "cnj_fundamento_feitico_preciso",
    nome: "Feitiço Preciso",
    descricao:
      "Quando usar um Feitiço que utilize um teste de ataque, você pode gastar 1 ponto de energia " +
      "amaldiçoada para receber +2 de acerto ou 2 pontos de energia amaldiçoada para receber +4 " +
      "de acerto.",
  },
  {
    id: "cnj_fundamento_feitico_rapido",
    nome: "Feitiço Rápido",
    nivelMin: 6,
    descricao:
      "Uma vez por rodada, quando for utilizar um Feitiço cuja conjuração seja uma Ação Completa " +
      "ou Comum, você pode gastar PE para reduzir seu custo em ação em um (Completa para Comum ou " +
      "Comum para Bônus). O custo é igual ao dobro do nível do Feitiço (considere 1 para Feitiços " +
      "nível 0).",
  },
];

/**
 * Apoios Avançados (Suporte). Escolha ANINHADA de Apoio Avançado (2°): um ao
 * obter, mais um no 6 e outro no 12. Apoios Versáteis (4°) concede mais um no
 * 4 e outro no 10, do MESMO pool.
 *
 * ⚠ Apoio Estratégico tem `nivelMin: 6` (o "Pré-Requisito: Nível 6" do livro).
 */
export const APOIOS_AVANCADOS = [
  {
    id: "sup_apoio_curativo",
    nome: "Apoio Curativo",
    descricao:
      "Quando apoiar um aliado, você pode escolher gastar uma carga da habilidade Suporte em " +
      "Combate para curar o aliado com ela como parte da ação.",
  },
  {
    id: "sup_apoio_defensivo",
    nome: "Apoio Defensivo",
    descricao:
      "Quando apoiar um aliado, você pode escolher aumentar a Defesa dele em um valor igual metade " +
      "do seu bônus de treinamento até o começo do próximo turno.",
  },
  {
    id: "sup_apoio_focado",
    nome: "Apoio Focado",
    descricao:
      "Quando apoiar um aliado, você pode escolher, além da vantagem, conceder um bônus no teste " +
      "que ele realizar igual a metade do seu modificador de Presença ou Sabedoria.",
  },
  {
    id: "sup_apoio_ofensivo",
    nome: "Apoio Ofensivo",
    descricao:
      "Quando apoiar um aliado, você pode gastar 2 PE para realizar um ataque como parte da ação.",
  },
  {
    id: "sup_apoio_estrategico",
    nome: "Apoio Estratégico",
    nivelMin: 6,
    descricao:
      "Ao utilizar a ação de apoio, você pode aumentar a CD do próximo teste que force TR do Aliado " +
      "em um valor igual a metade do seu Bônus de Treinamento.",
  },
];

/**
 * Focos Amaldiçoados (Conjurador). Escolha ANINHADA de Foco Amaldiçoado:
 * UM dos três, no nível 10. É a escolha mais pesada em efeito da
 * especialização (mexe em dano, custo de PE e CD).
 */
export const FOCOS_AMALDICOADOS = [
  {
    id: "cnj_foco_destruicao",
    nome: "Destruição",
    descricao:
      "Todo Feitiço que você conjurar causa +1 de dano para cada dado rolado nela. Além disso, " +
      "sempre que causar dano com um Feitiço ou aptidão amaldiçoada, você soma o seu bônus de " +
      "treinamento no total de dano.",
  },
  {
    id: "cnj_foco_economia",
    nome: "Economia",
    descricao:
      "O custo de todos os seus Feitiços é reduzido em 2, podendo reduzir o custo dos Feitiços " +
      "nível 1 para 0. Além disso, você passa a somar o seu bônus de treinamento no seu máximo de " +
      "energia amaldiçoada.",
  },
  {
    id: "cnj_foco_refino",
    nome: "Refino",
    descricao:
      "Você recebe uma Aptidão Amaldiçoada ou Feitiço adicional a sua escolha. Além disso, você " +
      "passa a somar metade do seu bônus de treinamento no cálculo de todas as suas CDs e em " +
      "jogadas de ataque amaldiçoado.",
  },
];

/**
 * Dádivas do Céu (Restringido). Escolha ANINHADA de Restrito pelos Céus: uma
 * a cada 4 níveis a partir do 4°, então `niveis: [4, 8, 12, 16, 20]` (5 das 9
 * até o ND 20). Respeito Celeste (8°) concede mais uma, e pode ser pego outra
 * vez a partir do 12, chegando a 7.
 */
export const DADIVAS_DO_CEU = [
  {
    id: "res_dadiva_agilidade_exima",
    nome: "Agilidade Exímia",
    descricao:
      "Uma leveza anormal e agilidade extrema são traços do seu corpo. Sempre que fizer um teste " +
      "de perícia ou resistência usando destreza, você recebe um bônus de +2, além de receber 3 " +
      "metros adicionais de movimento e sempre ignorar terreno difícil.",
  },
  {
    id: "res_dadiva_fisico_robusto",
    nome: "Físico Robusto",
    descricao:
      "Seu corpo é naturalmente mais robusto e resistente a todo dano que seja causado nele. Você " +
      "recebe redução de dano contra todo tipo, cujo valor é igual a metade do seu nível de " +
      "personagem, além de receber um bônus de +2 em testes de perícia ou resistência usando " +
      "constituição.",
  },
  {
    id: "res_dadiva_forca_devastadora",
    nome: "Força Devastadora",
    descricao:
      "Você foi dotado com uma força extrema, a qual permite que seus golpes sejam ainda mais " +
      "potentes, assim como a capacidade física dos seus músculos. A distância de todo pulo ou " +
      "salto que realizar aumenta em 3 metros, a distância padrão que você empurra com a ação " +
      "Empurrar aumenta em 4,5 metros e recebe +2 em testes de perícia usando Força.",
  },
  {
    id: "res_dadiva_indulgente_a_feiticaria",
    nome: "Indulgente a Feitiçaria",
    descricao:
      "Seu corpo recusa a energia amaldiçoada e, consequentemente, as técnicas. Você recebe " +
      "Redução de Dano contra danos provindo de técnicas ou aptidões amaldiçoadas igual à metade " +
      "do seu nível de personagem e um bônus de +1 em TRs de Vontade contra efeitos dessas mesmas " +
      "fontes. No nível 10, o bônus em TRs aumenta em +1 e, no nível 15, passa a contar também " +
      "para Fortitude e Reflexos.",
  },
  {
    id: "res_dadiva_mente_afiada",
    nome: "Mente Afiada",
    descricao:
      "Você tem uma mente afiada que o permite desenvolver habilidades facilmente. Você se torna " +
      "treinado em duas perícias adicionais e se torna mestre em uma perícia. Você também recebe " +
      "um bônus de +2 em testes de perícia ou resistência usando inteligência.",
  },
  {
    id: "res_dadiva_percepcao_agucada",
    nome: "Percepção Aguçada",
    descricao:
      "Sua percepção e seus instintos são aguçados ao máximo, permitindo-o perceber cada detalhe " +
      "dos seus arredores. Sua atenção aumenta em um valor igual a metade do seu nível de " +
      "personagem e você recebe um bônus de +3 em rolagens de percepção. Você também recebe um " +
      "bônus de +2 em testes de perícia ou resistência usando sabedoria.",
  },
  {
    id: "res_dadiva_reposicao_sanguinaria",
    nome: "Reposição Sanguinária",
    descricao:
      "Você consegue repor o seu vigor a partir do sangue derramado. Sempre que um inimigo no qual " +
      "você causou dano for morto, você recupera 3 pontos de estamina. Você não pode exceder a " +
      "quantidade de pontos que possuía no início do combate.",
  },
  {
    id: "res_dadiva_semblante_cativante",
    nome: "Semblante Cativante",
    descricao:
      "Um semblante mais cativante e chamativo foi lhe concedido, apurando seu carisma e presença. " +
      "Sempre que realizar um teste de perícia utilizando Presença, caso você tire um resultado " +
      "inferior a metade do seu valor de Presença, você pode optar por tratar o resultado como " +
      "metade do seu valor de Presença. Além disso, você se torna mestre em uma perícia de " +
      "Presença à sua escolha e recebe um bônus de +2 em testes de perícia usando Presença.",
  },
  {
    id: "res_dadiva_vigor_infindavel",
    nome: "Vigor Infindável",
    descricao:
      "Você foi dotado de um vigor amplo e infindável e consegue o repor ao triunfar. Seus pontos " +
      "de vida máximos aumentam em um valor igual ao seu nível de personagem e, a cada 2 níveis, " +
      "você recebe 1 ponto de estamina máximo adicional.",
  },
];

export const AFTY_HABILIDADES = [
  /* ================= LUTADOR · BASE =================
     Especialização de corpo a corpo desarmado. Base nos níveis 1, 1, 2, 4,
     5, 9, 11 e 20. O recurso próprio é o Nível de Empolgação (1 a 5), que é
     estado de COMBATE, não de ficha. */
  {
    id: "lut_corpo_treinado",
    nome: "Corpo Treinado",
    especializacaoId: "lutador",
    tipo: "base",
    nivel: 1,
    descricao:
      "Você treinou o seu corpo para que ele seja sua própria arma, assim como pode incorporar " +
      "certas armas em sua luta corpo a corpo. Sendo um lutador, você recebe as seguintes " +
      "capacidades:\n\n" +
      "• Você sabe desferir golpes rápidos com o seu corpo. Quando realizar um ataque desarmado ou " +
      "com uma arma marcial, você pode realizar um ataque desarmado como uma ação bônus.\n" +
      "• Você treinou e se dedicou a fazer com que seu corpo fosse uma arma por si só. O dano dos " +
      "seus ataques desarmados se torna 1d8. Nos níveis 5, 9, 13 e 17 seu dano desarmado aumenta " +
      "para 1d10, 1d12, 2d8 e 2d12, respectivamente.\n" +
      "• Versatilidade e adaptabilidade são importantes. Você pode escolher usar tanto Força quanto " +
      "Destreza nos seus ataques desarmados e ataques com armas marciais.",
    requisitos: [],
  },
  {
    id: "lut_empolgacao",
    nome: "Empolgação",
    especializacaoId: "lutador",
    tipo: "base",
    nivel: 1,
    descricao:
      "Uma boa luta é empolgante e te motiva a se arriscar mais e mais, permitindo movimentos mais " +
      "fortes e únicos. Para isso, você precisa continuar acertando golpes: você começa um combate " +
      "com Nível de Empolgação 1 e, caso acerte pelo menos um ataque ou manobra (agarrar, empurrar " +
      "etc.) durante seu turno, no começo do seu próximo turno você sobe um nível de empolgação, " +
      "até um máximo de 5 níveis.\n\n" +
      "Nível de Empolgação · Dado de Empolgação\n" +
      "• Nível 2: 1d4\n" +
      "• Nível 3: 1d6\n" +
      "• Nível 4: 2d4\n" +
      "• Nível 5: 2d6\n\n" +
      "A empolgação te permite realizar certas manobras especiais, as quais normalmente são " +
      "fortalecidas por um bônus, que é o Dado de Empolgação, cujo valor varia com o nível, " +
      "seguindo a tabela acima.\n\n" +
      "Cada manobra pode ser realizada apenas uma vez por rodada. Caso passe uma rodada sem " +
      "acertar um ataque, você desce um nível de empolgação.\n\n" +
      "Você aprende duas das manobras abaixo, aprendendo outras no nível 6, 12 e 18.",
    // Escolha aninhada: DUAS no nível 1 (daí o 1 repetido, que é como
    // escolhasConcedidas conta as concessões), mais uma no 6, 12 e 18.
    escolha: {
      id: "manobra_empolgacao",
      label: "Manobra de Empolgação",
      niveis: [1, 1, 6, 12, 18],
      opcoes: MANOBRAS_DE_EMPOLGACAO,
    },
    requisitos: [],
  },
  {
    id: "lut_reflexo_evasivo",
    nome: "Reflexo Evasivo",
    especializacaoId: "lutador",
    tipo: "base",
    nivel: 2,
    descricao:
      "Em busca de uma boa luta, e conseguir durar nela, você começa a desenvolver um reflexo para " +
      "evitar danos. Você recebe redução de dano a todo tipo, exceto alma, igual a metade do seu " +
      "nível de Lutador.",
    requisitos: [],
  },
  {
    id: "lut_implemento_marcial",
    nome: "Implemento Marcial",
    especializacaoId: "lutador",
    tipo: "base",
    nivel: 4,
    descricao:
      "Você recebe +2 na CD de suas Habilidades de Especialização, Feitiços e Aptidões " +
      "Amaldiçoadas. Esse bônus aumenta em 1 nos níveis 8° e 16° de Lutador.",
    requisitos: [],
  },
  {
    id: "lut_gosto_pela_luta",
    nome: "Gosto pela Luta",
    especializacaoId: "lutador",
    tipo: "base",
    nivel: 5,
    descricao:
      "Você tem um gosto pelas lutas, o que começa a cultivar uma força, precisão e resistência " +
      "superiores. Você passa a adicionar +2 em jogadas de ataque desarmadas ou com armas marciais " +
      "e +1 em rolagens de Fortitude e de dano. Nos níveis 8, 12, 16 e 20 o bônus em jogadas de " +
      "ataque aumenta em +1, enquanto nos níveis 9, 13 e 17 o bônus em Fortitude e dano aumenta " +
      "em +1.",
    requisitos: [],
  },
  {
    id: "lut_teste_de_resistencia_mestre",
    nome: "Teste de Resistência Mestre",
    especializacaoId: "lutador",
    tipo: "base",
    nivel: 9,
    descricao:
      "Você se torna treinado em um segundo teste de resistência e mestre no concedido pela sua " +
      "especialização.",
    requisitos: [],
  },
  {
    id: "lut_empolgacao_maxima",
    nome: "Empolgação Máxima",
    especializacaoId: "lutador",
    tipo: "base",
    nivel: 11,
    descricao:
      "O seu potencial e intensidade assumem um patamar superior, aprimorando suas capacidades. Os " +
      "seus dados de empolgação se tornam 2d4, 2d6, 2d8 e 3d6, respectivamente.",
    requisitos: [],
  },
  {
    id: "lut_lutador_superior",
    nome: "Lutador Superior",
    especializacaoId: "lutador",
    tipo: "base",
    nivel: 20,
    descricao:
      "Tendo alcançado o ápice do seu corpo e das técnicas de combate do lutador, você está em um " +
      "nível superior. Seus ataques desarmados causam 1 dado de dano adicional e uma vez por " +
      "rodada, você pode realizar um ataque desarmado como uma ação livre gastando 2PE. Além " +
      "disso, você inicia todo combate com um Nível de Empolgação a mais.",
    requisitos: [],
  },

  /* ---------------- LUTADOR · POR NÍVEL (2° nível) ---------------- */
  {
    id: "lut_aparar_ataque",
    nome: "Aparar Ataque",
    especializacaoId: "lutador",
    tipo: "nivel",
    nivel: 2,
    descricao:
      "Você rebate um ataque com outro ataque, assim conseguindo aparar um golpe. Quando for alvo " +
      "de um ataque corpo a corpo, você pode gastar 1 PE e sua reação para realizar uma jogada de " +
      "ataque contra o atacante. Caso seu teste supere o do inimigo, você evita o ataque.",
    requisitos: [],
  },
  {
    id: "lut_aparar_projeteis",
    nome: "Aparar Projéteis",
    especializacaoId: "lutador",
    tipo: "nivel",
    nivel: 2,
    descricao:
      "Utilizando de sua agilidade e reflexos, você consegue tentar aparar projéteis em sua " +
      "direção, reduzindo o dano deles. Quando receber um ataque à distância, você pode gastar 1 " +
      "PE e sua reação para tentar aparar o projétil, reduzindo o dano recebido em 2d6 + " +
      "modificador de atributo-chave + bônus de treinamento.",
    requisitos: [],
  },
  {
    id: "lut_ataque_inconsequente",
    nome: "Ataque Inconsequente",
    especializacaoId: "lutador",
    tipo: "nivel",
    nivel: 2,
    descricao:
      "Você baixa a guarda para atacar de maneira inconsequente, aumentando seu potencial de dano. " +
      "Uma vez por rodada, ao realizar um ataque, você pode escolher receber vantagem na jogada de " +
      "ataque e +5 na rolagem de dano dele. Porém, ao realizar um ataque inconsequente, você fica " +
      "Desprevenido por 1 rodada.",
    requisitos: [],
  },
  {
    id: "lut_caminho_da_mao_vazia",
    nome: "Caminho da Mão Vazia",
    especializacaoId: "lutador",
    tipo: "nivel",
    nivel: 2,
    descricao:
      "Mesmo diante a possibilidade de brandir armas marciais, você decide se ater as mãos vazias " +
      "e se aperfeiçoar nesse caminho. Todo ataque desarmado que você realizar causa dano " +
      "adicional igual ao seu bônus de treinamento e você soma metade do seu bônus de treinamento " +
      "em jogadas de ataque desarmados.",
    requisitos: [],
  },
  {
    id: "lut_complementacao_marcial",
    nome: "Complementação Marcial",
    especializacaoId: "lutador",
    tipo: "nivel",
    nivel: 2,
    descricao:
      "Suas habilidades marciais complementam certas manobras, deixando-as mais eficientes. " +
      "Enquanto estiver desarmado ou empunhando uma arma marcial, você recebe um bônus de +2 em " +
      "testes para Desarmar, Derrubar ou Empurrar, assim como para resistir a esses efeitos.",
    requisitos: [],
  },
  {
    id: "lut_deboche_desconcertante",
    nome: "Deboche Desconcertante",
    especializacaoId: "lutador",
    tipo: "nivel",
    nivel: 2,
    descricao:
      "Cheio de si, você consegue debochar de um inimigo de uma maneira que o desconcerta. Como " +
      "uma Ação Bônus, escolha uma criatura que possa te ver ou ouvir: realize um teste de " +
      "Intimidação contra um teste de Vontade dela, no qual você recebe um bônus de +2. Caso você " +
      "suceda, a criatura recebe uma penalidade igual ao seu bônus de treinamento em todos os " +
      "testes que ela realizar até o começo do seu próximo turno.",
    // "Treinado em Intimidação" espera o lado da CRIATURA em Perícias (não existe).
    requisitos: [{ tipo: "nota", texto: "Treinado em Intimidação" }],
  },
  {
    id: "lut_dedicacao_em_arma",
    nome: "Dedicação em Arma",
    especializacaoId: "lutador",
    tipo: "nivel",
    nivel: 2,
    descricao:
      "Ao invés de contar apenas com seus punhos, você se dedica a certas armas. Escolha três " +
      "armas para serem suas Armas Dedicadas, as quais não podem possuir as propriedades Duas Mãos " +
      "ou Pesada, exceto caso já possuam a propriedade Marcial. Suas armas escolhidas passam a ser " +
      "contadas como marciais, se não forem, e enquanto empunhar uma Arma Dedicada, o dano dela " +
      "aumenta em 1 nível.",
    // "Escolha três armas": espera o catálogo de ARMAS, que não existe. Hoje é só texto.
    requisitos: [],
  },
  {
    id: "lut_esquiva_rapida",
    nome: "Esquiva Rápida",
    especializacaoId: "lutador",
    tipo: "nivel",
    nivel: 2,
    descricao:
      "Com agilidade, você se prepara para esquivar de ataques. Como uma Ação Bônus, realize um " +
      "teste de Acrobacia contra a Atenção de um inimigo dentro do seu alcance corpo a corpo. Caso " +
      "suceda no teste, o alvo recebe metade do seu modificador de Destreza como penalidade em " +
      "jogadas de ataque feitas contra você até o começo do seu próximo turno.",
    requisitos: [],
  },
  {
    id: "lut_finta_melhorada",
    nome: "Finta Melhorada",
    especializacaoId: "lutador",
    tipo: "nivel",
    nivel: 2,
    descricao:
      "Você desenvolva sua finta para que se torne mais eficiente e se adaptar ao seu corpo. Você " +
      "pode optar por utilizar Destreza ao invés de Presença em testes de Enganação para fintar. " +
      "Além disso, acertar um inimigo desprevenido pela sua finta causa um dado de dano adicional.",
    requisitos: [],
  },
  {
    id: "lut_impacto_misto",
    nome: "Impacto Misto",
    especializacaoId: "lutador",
    tipo: "nivel",
    nivel: 2,
    descricao:
      "Você consegue misturar o uso de armas adequadas com seus ataques desarmados. Quando acertar " +
      "uma criatura com um ataque com arma marcial, você recebe +2 em jogadas de ataque e dano " +
      "desarmados até o começo do seu próximo turno. Nos níveis 5, 10, 15 e 20, o bônus em dano " +
      "aumenta em +1, enquanto nos níveis 6, 12 e 18 o bônus em jogadas de ataque aumenta em +1.",
    requisitos: [],
  },
  {
    id: "lut_kiai_intimidador",
    nome: "Kiai Intimidador",
    especializacaoId: "lutador",
    tipo: "nivel",
    nivel: 2,
    descricao:
      "Sendo a exteriorização da energia e força corporal, um kiai é liberado diante um bom golpe, " +
      "intimidando com um grito. Uma vez por rodada, quando conseguir um crítico em um ataque " +
      "corpo a corpo você pode, como uma ação livre, realizar um teste de Intimidação contra " +
      "Vontade do alvo e, caso suceda, ela fica Abalada por uma rodada. Se aplicar esta habilidade " +
      "em uma criatura que já está Abalada, ela fica Amedrontada.",
    requisitos: [],
  },
  {
    id: "lut_maos_amaldicoadas",
    nome: "Mãos Amaldiçoadas",
    especializacaoId: "lutador",
    tipo: "nivel",
    nivel: 2,
    descricao:
      "Como um feiticeiro, você consegue incorporar o jujutsu em seu combate a curta distância. " +
      "Quando utilizar um Feitiço ofensivo com alcance de Toque, você pode substituir a jogada de " +
      "ataque de técnica por uma jogada de ataque corpo a corpo e, também, somar seu modificador " +
      "de Força ou Destreza no total.",
    requisitos: [],
  },
  {
    id: "lut_puxar_um_ar",
    nome: "Puxar um Ar",
    especializacaoId: "lutador",
    tipo: "nivel",
    nivel: 2,
    descricao:
      "Você consegue respirar fundo e puxar as forças guardadas em seu interior para continuar " +
      "lutando. Você pode, como uma Ação Bônus, realizar uma rolagem do seu dano desarmado e se " +
      "curar nesse valor. Esta habilidade pode ser usada uma quantidade de vezes igual ao seu " +
      "bônus de treinamento, por descanso curto ou longo.",
    requisitos: [],
  },
  {
    id: "lut_quebrando_tudo",
    nome: "Quebrando Tudo",
    especializacaoId: "lutador",
    tipo: "nivel",
    nivel: 2,
    descricao:
      "O cenário e ambiente ao seu redor conta com várias armas e, lutando para quebrar tudo, você " +
      "aprimora seu uso de armas improvisadas. Como parte de um ataque, você pode agarrar um " +
      "objeto pequeno ou menor adjacente a você. Objetos usados de arma improvisada (Página 326) " +
      "recebem +1d no dano e são considerados armas marciais.",
    requisitos: [],
  },
  {
    id: "lut_resistir",
    nome: "Resistir",
    especializacaoId: "lutador",
    tipo: "nivel",
    nivel: 2,
    descricao:
      "Você pode utilizar da energia para fortalecer seu corpo e resistir com mais eficiência. " +
      "Quando realizar um teste de resistência de Fortitude ou Reflexos, você pode gastar até 2PE " +
      "para receber um bônus de +2 para cada PE gasto.",
    requisitos: [],
  },

  /* ---------------- LUTADOR · POR NÍVEL (4° nível) ---------------- */
  {
    id: "lut_acao_agil",
    nome: "Ação Ágil",
    especializacaoId: "lutador",
    tipo: "nivel",
    nivel: 4,
    descricao:
      "Você otimiza o seu tempo de ação. Uma vez por rodada, você pode gastar 2PE para receber uma " +
      "Ação Ágil, a qual pode ser utilizada para Andar, Desengajar ou Esconder.",
    requisitos: [],
  },
  {
    id: "lut_acrobata",
    nome: "Acrobata",
    especializacaoId: "lutador",
    tipo: "nivel",
    nivel: 4,
    descricao:
      "Ao invés da força, você usa a agilidade para poder saltar. Você passa a utilizar Destreza " +
      "como atributo para calcular sua distância de pulo, assim como pode utilizar Acrobacia no " +
      "lugar de Atletismo em testes para aumentar a sua distância de salto.",
    requisitos: [],
  },
  {
    id: "lut_atacar_e_recuar",
    nome: "Atacar e Recuar",
    especializacaoId: "lutador",
    tipo: "nivel",
    nivel: 4,
    descricao:
      "Você consegue atacar e aproveitar a brecha do golpe para se afastar do inimigo. Uma vez por " +
      "turno, quando acertar uma criatura com um ataque, você pode gastar 1 PE para se mover até " +
      "4,5 metros para longe da criatura acertada. Este movimento não causa ataques de " +
      "oportunidade.",
    requisitos: [{ tipo: "habilidade", id: "lut_esquiva_rapida" }],
  },
  {
    id: "lut_brutalidade",
    nome: "Brutalidade",
    especializacaoId: "lutador",
    tipo: "nivel",
    nivel: 4,
    descricao:
      "Existe uma brutalidade guardada no seu interior, a qual pode ser canalizada como uma fúria " +
      "para combate. Como uma Ação Livre, você pode gastar 2PE para adentrar no estado de " +
      "Brutalidade: enquanto nesse estado, você recebe +2 em jogadas de ataque corpo a corpo e " +
      "dano. Entretanto, enquanto estiver em Brutalidade, você não pode manter a concentração nem " +
      "utilizar Feitiços ou Técnicas de Estilo. Caso já estivesse se concentrando em algo, a " +
      "concentração quebra. A Brutalidade se encerra no final do seu turno caso você não tenha " +
      "atacado ninguém nele ou caso você a encerre como uma Ação Livre. Nos níveis 8, 12, 16 e 20 " +
      "você pode gastar 2 PE a mais para aumentar o bônus em jogadas de ataque e dano em +1.",
    requisitos: [],
  },
  {
    id: "lut_defesa_marcial",
    nome: "Defesa Marcial",
    especializacaoId: "lutador",
    tipo: "nivel",
    nivel: 4,
    descricao:
      "Você é capaz de incorporar a leveza de seus movimentos em sua defesa. Enquanto estiver " +
      "desarmado ou empunhando uma arma marcial, você soma 1 + metade do seu Bônus de Treinamento " +
      "à sua Defesa.",
    requisitos: [{ tipo: "habilidade", id: "lut_complementacao_marcial" }],
  },
  {
    id: "lut_devolver_projeteis",
    nome: "Devolver Projéteis",
    especializacaoId: "lutador",
    tipo: "nivel",
    nivel: 4,
    descricao:
      "Sua capacidade de aparar é aprimorada, abrindo também oportunidades para os devolver. O " +
      "dado de Aparar Projéteis se torna 3d10 e soma também o seu Nível de Lutador. Caso você use " +
      "Aparar Projéteis e o dano se torne nulo ou negativo, você pode devolver o projétil como " +
      "parte da reação, causando no atacante o dano que você receberia.",
    requisitos: [{ tipo: "habilidade", id: "lut_aparar_projeteis" }],
  },
  {
    id: "lut_fluxo",
    nome: "Fluxo",
    especializacaoId: "lutador",
    tipo: "nivel",
    nivel: 4,
    descricao:
      "Conforme se empolga, você cada vez mais se aproxima de entrar “na zona”, um estado de " +
      "completo foco e imersão na luta. A cada nível de empolgação que você subir, você recebe +1 " +
      "em rolagens de dano e, no começo de toda rodada, recebe 4 pontos de vida temporários para " +
      "cada nível de empolgação acima do primeiro.",
    requisitos: [],
  },
  {
    id: "lut_furia_da_vinganca",
    nome: "Fúria da Vingança",
    especializacaoId: "lutador",
    tipo: "nivel",
    nivel: 4,
    descricao:
      "Seus aliados são importantes, e você irá vingá-los caso necessário. Ao ver um personagem " +
      "aliado (Invocações não são consideradas) chegar a 0 pontos de vida e cair, você recebe os " +
      "seguintes benefícios durante uma rodada: seus ataques causam 4 de dano adicional; sua " +
      "Defesa aumenta em 2; você recebe +2 em TRs de Fortitude e Vontade. Os benefícios são " +
      "aplicados apenas contra o inimigo alvo da vingança e outras criaturas que tentarem o " +
      "impedir de alcançá-lo.",
    requisitos: [],
  },
  {
    id: "lut_imprudencia_motivadora",
    nome: "Imprudência Motivadora",
    especializacaoId: "lutador",
    tipo: "nivel",
    nivel: 4,
    descricao:
      "Em certos momentos, ser imprudente e se desafiar o motiva a triunfar. Ao iniciar uma cena " +
      "de combate, você pode escolher lutar com uma restrição auto imposta, escolha um dos seus " +
      "sensos ou membros (como não usar a visão ou não usar uma das pernas), até o final da cena, " +
      "recebe as mesmas penalidades de perder um membro (Veja Ferimentos Complexos, página 315). " +
      "Se vencer o combate com a restrição, você recupera uma quantidade de PE igual ao seu nível " +
      "de personagem; recebe +2 em rolagens de ataque e tem sua margem de crítico reduzida em 1 " +
      "até o fim da missão atual.",
    requisitos: [],
  },
  {
    id: "lut_musculos_desenvolvidos",
    nome: "Músculos Desenvolvidos",
    especializacaoId: "lutador",
    tipo: "nivel",
    nivel: 4,
    descricao:
      "Sua força o fez ter músculos desenvolvidos, os quais por consequência acabaram ficando mais " +
      "preparados para receber golpes, sendo mais difícil o acertar de maneira efetiva. Ao obter " +
      "esta habilidade, você pode optar por somar seu Modificador de Força ao invés de Destreza em " +
      "sua Defesa, modificando o cálculo padrão.",
    requisitos: [],
  },
  {
    id: "lut_redirecionar_forca",
    nome: "Redirecionar Força",
    especializacaoId: "lutador",
    tipo: "nivel",
    nivel: 4,
    descricao:
      "Você consegue redirecionar um golpe direcionado a você, mudando o alvo. Quando um inimigo " +
      "errar um ataque corpo a corpo contra você, você pode gastar 2PE e sua reação para tentar " +
      "redirecionar o ataque: escolha outra criatura dentro do alcance do golpe e, caso o " +
      "resultado da jogada de ataque dela seja superior à Defesa do novo alvo, ele recebe o ataque.",
    requisitos: [],
  },
  {
    id: "lut_segura_pra_mim",
    nome: "Segura pra Mim",
    especializacaoId: "lutador",
    tipo: "nivel",
    nivel: 4,
    descricao:
      "Uma criatura agarrada pode ser utilizada como escudo. Quando for alvo de um ataque corpo a " +
      "corpo ou uma habilidade com alvo único, você pode gastar 3 PE para tentar colocar uma " +
      "criatura que esteja agarrando na frente, faça um teste de Atletismo contra o Atletismo ou " +
      "Acrobacia da criatura agarrada. Se for bem sucedido, a criatura recebe os efeitos do ataque " +
      "ou habilidade no seu lugar e você imediatamente para de agarrar ela.",
    requisitos: [],
  },
  {
    id: "lut_sobrevivente",
    nome: "Sobrevivente",
    especializacaoId: "lutador",
    tipo: "nivel",
    nivel: 4,
    descricao:
      "Como um lutador, você deve sobreviver, recuperando-se quando sente a vitalidade esvaindo. " +
      "Enquanto estiver com menos da metade dos seus pontos de vida máximos, sempre que começar " +
      "seu turno, você recupera 1d6 + seu modificador de Constituição em pontos de vida. Esta " +
      "habilidade não funciona caso esteja Inconsciente ou nos portões da morte. Nos níveis 8, 12, " +
      "16 e 20, a cura aumenta em 1d6.",
    requisitos: [{ tipo: "atributo", attr: "constituicao", valor: 16 }],
  },
  {
    id: "lut_voadora",
    nome: "Voadora",
    especializacaoId: "lutador",
    tipo: "nivel",
    nivel: 4,
    descricao:
      "Você consegue investir em uma voadora, acumulando potência conforme a distância aumenta. " +
      "Quando realizar uma Investida, e estiver desarmado, você pode gastar 3PE para realizar uma " +
      "Voadora. Caso o faça, você causa 1d8 de dano adicional para cada 3 metros que se deslocar " +
      "até o alvo, limitado pelo seu modificador de Força ou Destreza.",
    requisitos: [],
  },

  /* ---------------- LUTADOR · POR NÍVEL (6° nível) ---------------- */
  {
    id: "lut_aprimoramento_marcial",
    nome: "Aprimoramento Marcial",
    especializacaoId: "lutador",
    tipo: "nivel",
    nivel: 6,
    descricao:
      "Você aprimora suas habilidades marciais para deixar mais difícil resistir as suas técnicas " +
      "de Lutador. Você passa a somar metade do seu Bônus de Treinamento em sua CD de " +
      "Especialização.",
    requisitos: [],
  },
  {
    id: "lut_ataque_extra",
    nome: "Ataque Extra",
    especializacaoId: "lutador",
    tipo: "nivel",
    nivel: 6,
    descricao:
      "Você consegue atacar mais rápido, otimizando seus golpes. Ao realizar a ação Atacar, você " +
      "pode gastar 2 PE para atacar duas vezes ao invés de uma.",
    requisitos: [],
  },
  {
    id: "lut_brutalidade_sanguinaria",
    nome: "Brutalidade Sanguinária",
    especializacaoId: "lutador",
    tipo: "nivel",
    nivel: 6,
    descricao:
      "Em meio a brutalidade, o sangue pode o renovar. Enquanto no estado de Brutalidade, sempre " +
      "que tiver um acerto crítico ou reduzir a vida de uma criatura a 0 ou menos, você aumenta o " +
      "nível de dano dos seus ataques corpo a corpo em 1, acumulando até um limite igual ao seu " +
      "bônus de treinamento. Esse aumento dura enquanto permanecer com o estado de Brutalidade " +
      "ativo.",
    requisitos: [{ tipo: "habilidade", id: "lut_brutalidade" }],
  },
  {
    id: "lut_corpo_calejado",
    nome: "Corpo Calejado",
    especializacaoId: "lutador",
    tipo: "nivel",
    nivel: 6,
    descricao:
      "De tanto combater e receber golpes, todo seu corpo já está calejado e mais resistente. Você " +
      "passa a adicionar metade do seu Modificador de Constituição na sua Defesa e recebe pontos " +
      "de vida adicionais igual ao seu nível de Lutador.",
    requisitos: [],
  },
  {
    id: "lut_eliminar_e_continuar",
    nome: "Eliminar e Continuar",
    especializacaoId: "lutador",
    tipo: "nivel",
    nivel: 6,
    descricao:
      "Eliminar um inimigo e o ver cair serve apenas como um incentivo para continuar. Sempre que " +
      "um inimigo ao qual você causou dano cair ou morrer dentro de 9 metros, você recebe 2d6 + " +
      "nível de personagem + modificador de atributo-chave em PV temporários, os quais acumulam. " +
      "No nível 8, o valor aumenta para 3d6, no nível 12 aumenta para 4d6, no nível 16 aumenta " +
      "para 4d8 e no nível 20 aumenta para 4d12.",
    requisitos: [],
  },
  {
    id: "lut_foguete_sem_re",
    nome: "Foguete Sem Ré",
    especializacaoId: "lutador",
    tipo: "nivel",
    nivel: 6,
    descricao:
      "Se dedicando a avançar sem olhar para trás, você consegue usar da sua energia para o " +
      "impulsionar em uma investida direta. Como uma ação completa, você gasta 6 PE para se mover " +
      "até uma distância igual ao dobro do seu deslocamento; sempre que passar por uma criatura " +
      "durante essa investida, ela deve realizar um teste de resistência de Reflexos, sofrendo " +
      "Xd10 + modificador de Força ou Destreza (onde X é o seu bônus de treinamento) de dano de " +
      "Impacto e não podendo realizar Ataques de Oportunidade contra você em uma falha. Ao " +
      "terminar seu movimento adjacente a uma criatura, você pode realizar um ataque contra ela.",
    requisitos: [],
  },
  {
    id: "lut_golpe_da_mao_aberta",
    nome: "Golpe da Mão Aberta",
    especializacaoId: "lutador",
    tipo: "nivel",
    nivel: 6,
    descricao:
      "Você é capaz de realizar um ataque potente, utilizando a palma da mão. Como uma ação comum, " +
      "você pode gastar 4 PE para realizar um golpe de mão aberta. Você realiza um ataque " +
      "desarmado contra um alvo dentro do seu alcance corpo a corpo e, em um acerto, ele deve " +
      "realizar um teste de resistência de Fortitude e, em um fracasso, ele fica Desorientado, " +
      "Enjoado e Exposto até o início do seu próximo turno. O Golpe da Mão Aberta conta como um " +
      "ataque desarmado para propósitos de habilidades que apenas funcionam com ataques e você não " +
      "pode usar ataque extra com esse golpe.",
    requisitos: [],
  },
  {
    id: "lut_ignorar_dor",
    nome: "Ignorar Dor",
    especializacaoId: "lutador",
    tipo: "nivel",
    nivel: 6,
    descricao:
      "Seu desejo por uma boa luta é constante, permitindo-o até mesmo ignorar parte da dor que " +
      "seja infligida em você. Você recebe redução de danos contra todos os tipos, menos alma, " +
      "igual ao seu nível de empolgação atual. Contra danos físicos, a redução de dano é dobrada.",
    requisitos: [],
  },
  {
    id: "lut_manobras_finalizadoras",
    nome: "Manobras Finalizadoras",
    especializacaoId: "lutador",
    tipo: "nivel",
    nivel: 6,
    descricao:
      "Após toda uma sequência empolgante, você sabe exatamente como finalizar o seu combo com uma " +
      "manobra ainda mais impactante. Você libera acesso a novas manobras, listadas no final da " +
      "especialização. Ao realizar um ataque, você pode realizar uma Manobra Finalizadora.\n\n" +
      "Após obter a habilidade “Manobras Finalizadoras”, você recebe acesso as seguintes manobras " +
      "adicionais:\n\n" +
      "• Ataque Circular. Você usa de agilidade para desferir um golpe circular, capaz de atingir " +
      "vários alvos. Durante esta manobra, seu alcance corpo a corpo aumenta em 3 metros e você " +
      "realiza um ataque contra todos os inimigos dentro do seu alcance corpo a corpo. Para cada " +
      "inimigo que seja um alvo, esta manobra causa 5 de dano adicional.\n" +
      "• Golpe Certeiro. Você deve declarar que está utilizando esta Manobra antes da jogada de " +
      "ataque. Sua próxima jogada de ataque automaticamente tem o seu resultado tratado como 10 " +
      "acima do resultado original (10 no dado vira 20, por exemplo).\n" +
      "• Quebra Crânio. Você ataca com toda potência possível, canalizando a empolgação em um " +
      "golpe avassalador. Seu próximo ataque causa 2d10 de dano adicional. O alvo desta manobra " +
      "deve realizar um teste de resistência de Fortitude com CD aumentada em 5, ficando Atordoado " +
      "até o começo do seu próximo turno em uma falha.\n\n" +
      "Para realizar uma manobra finalizadora, é necessário estar com nível de empolgação 5. Após " +
      "utilizar uma, a energia e empolgação acumulada são liberadas, com você retornando ao nível " +
      "de empolgação 1.",
    // As 3 finalizadoras NÃO são escolha aninhada: "você recebe acesso as
    // seguintes", ou seja, vêm todas. Mesmo tratamento das Artes do Combate do
    // Combatente, que ficaram como texto verbatim dentro da habilidade dona.
    requisitos: [],
  },
  {
    id: "lut_poder_corporal",
    nome: "Poder Corporal",
    especializacaoId: "lutador",
    tipo: "nivel",
    nivel: 6,
    // ⚠ O CABEÇALHO desta habilidade se perdeu no PDF (as duas colunas comeram
    // o título entre "Manobras Finalizadoras" e "Potência Superior"). O nome
    // vem de Punhos Letais (8°), cujo pré-requisito é "Poder Corporal", e a
    // posição bate com a ordem quase alfabética da lista. CONFIRMAR com o autor.
    descricao:
      "Cultivando e priorizando seu próprio corpo, você expande o poder dele. O dano de seus " +
      "ataques desarmados aumenta em 2 níveis e, uma vez por rodada, ao realizar um ataque " +
      "desarmado, você pode escolher realizar uma Manobra como parte do ataque, aplicando seu " +
      "efeito juntamente do dano.",
    requisitos: [{ tipo: "habilidade", id: "lut_caminho_da_mao_vazia" }],
  },
  {
    id: "lut_potencia_superior",
    nome: "Potência Superior",
    especializacaoId: "lutador",
    tipo: "nivel",
    nivel: 6,
    descricao:
      "A potência que você consegue colocar em suas manobras se torna superior. Quando Derrubar um " +
      "inimigo com sucesso, ele também recebe 2d6 + seu modificador de Força de dano de impacto; " +
      "quando Empurrar um inimigo, a distância padrão se torna 4,5 metros ao invés de 1,5 metros.",
    requisitos: [{ tipo: "habilidade", id: "lut_complementacao_marcial" }],
  },
  {
    id: "lut_sequencia_inconsequente",
    nome: "Sequência Inconsequente",
    especializacaoId: "lutador",
    tipo: "nivel",
    nivel: 6,
    descricao:
      "Não se limitando a apenas um ataque, você assume uma postura inconsequente durante todo seu " +
      "período de atacar. Quando utilizar Ataque Inconsequente, você passa a receber o dano " +
      "adicional em todos seus ataques realizados durante o turno.",
    requisitos: [{ tipo: "habilidade", id: "lut_ataque_inconsequente" }],
  },
  {
    id: "lut_um_com_a_arma",
    nome: "Um com a Arma",
    especializacaoId: "lutador",
    tipo: "nivel",
    nivel: 6,
    descricao:
      "Você começa a se tornar apenas um com as armas para as quais se dedicou. Uma quantidade de " +
      "vezes igual a metade do seu nível de Lutador, por descanso curto, suas armas dedicadas " +
      "conseguem superar resistência ao tipo de dano delas em um ataque. Caso erre o ataque, o uso " +
      "não é consumido. Uma vez por rodada, ao ser desarmado de uma das suas armas dedicadas, você " +
      "pode utilizar sua reação para evitar, mantendo-se em posse da arma.",
    requisitos: [{ tipo: "habilidade", id: "lut_dedicacao_em_arma" }],
  },

  /* ---------------- LUTADOR · POR NÍVEL (8° nível) ---------------- */
  {
    id: "lut_aptidoes_de_luta",
    nome: "Aptidões de Luta",
    especializacaoId: "lutador",
    tipo: "nivel",
    nivel: 8,
    descricao:
      "Você aprimora suas aptidões de energia necessárias para a luta. Ao obter esta habilidade, " +
      "você pode aumentar o seu nível de aptidão em Aura ou Controle e Leitura em 1. Você pode " +
      "pegar esta habilidade duas vezes, uma para cada aptidão.",
    // ⚠ REPETÍVEL e CONCEDE NÍVEL DE TRILHA, exatamente como Aptidões de
    // Combate (Combatente 8°). Os dois problemas seguem abertos: creature.
    // habilidades é lista de ids ÚNICOS, e a concessão entra na passada de
    // efeitos + em resolveNiveisAptidao. Resolver os dois juntos.
    requisitos: [],
  },
  {
    id: "lut_ataques_ressoantes",
    nome: "Ataques Ressoantes",
    especializacaoId: "lutador",
    tipo: "nivel",
    nivel: 8,
    descricao:
      "O impacto dos seus ataques ressoa e atinge outros inimigos próximos do seu alvo. Ao " +
      "realizar um ataque contra um inimigo, você pode gastar 2 pontos de energia amaldiçoada para " +
      "que todos os inimigos adjacentes ao alvo, com a Defesa inferior ao resultado do seu ataque, " +
      "recebam dano igual a metade do dano causado no alvo.",
    requisitos: [],
  },
  {
    id: "lut_brutalidade_aprimorada",
    nome: "Brutalidade Aprimorada",
    especializacaoId: "lutador",
    tipo: "nivel",
    nivel: 8,
    descricao:
      "Aprimorando no fluxo que você impõe no seu corpo, ele te deixa ainda mais resistente. Ao " +
      "entrar no estado de brutalidade, você recebe uma quantidade de pontos de vida temporários " +
      "igual ao seu nível + modificador do atributo para CD de Especialização. O bônus inicial em " +
      "dano se torna +4 e o aumento no dano por ponto de energia adicional gasto se torna +2.",
    requisitos: [{ tipo: "habilidade", id: "lut_brutalidade" }],
  },
  {
    id: "lut_feitico_e_punho",
    nome: "Feitiço e Punho",
    especializacaoId: "lutador",
    tipo: "nivel",
    nivel: 8,
    descricao:
      "Com precisão, você consegue agir rapidamente para utilizar do jujutsu e complementar com " +
      "seu corpo. Uma vez por rodada, quando utilizar um Feitiço de dano com alvo único, você pode " +
      "gastar 2PE para realizar um ataque corpo a corpo contra o mesmo alvo, desde que ele esteja " +
      "dentro do seu alcance.",
    requisitos: [{ tipo: "habilidade", id: "lut_maos_amaldicoadas" }],
  },
  {
    id: "lut_golpear_brecha",
    nome: "Golpear Brecha",
    especializacaoId: "lutador",
    tipo: "nivel",
    nivel: 8,
    descricao:
      "Você consegue aproveitar de um golpe aparado para atacar a brecha que se abre na defesa do " +
      "inimigo. Quando utilizar Aparar Ataque e conseguir aparar com sucesso, você pode gastar 2PE " +
      "adicionais para realizar um ataque contra o inimigo como parte da reação.",
    requisitos: [{ tipo: "habilidade", id: "lut_aparar_ataque" }],
  },
  {
    id: "lut_oportunista",
    nome: "Oportunista",
    especializacaoId: "lutador",
    tipo: "nivel",
    nivel: 8,
    descricao:
      "Você sabe aproveitar bem brechas na defesa dos inimigos. Uma vez por rodada, quando um " +
      "inimigo dentro do seu alcance corpo a corpo é atingido por um ataque de uma criatura o " +
      "flanqueando, você pode gastar 2 PE para fazer um ataque corpo a corpo contra a criatura.",
    requisitos: [],
  },
  {
    id: "lut_pancada_desnorteante",
    nome: "Pancada Desnorteante",
    especializacaoId: "lutador",
    tipo: "nivel",
    nivel: 8,
    descricao:
      "Uma boa pancada deixa qualquer um despreparado para o que vem a seguir. Quando conseguir um " +
      "acerto crítico em um ataque corpo a corpo, você pode fazer com que o alvo do ataque receba " +
      "desvantagem contra um TR à sua escolha, até o início do seu próximo turno.",
    requisitos: [],
  },
  {
    id: "lut_punhos_letais",
    nome: "Punhos Letais",
    especializacaoId: "lutador",
    tipo: "nivel",
    nivel: 8,
    descricao:
      "Não há necessidade de armas se o seu corpo já é a mais letal entre elas. Enquanto estiver " +
      "desarmado, sua margem de crítico diminui em 1 e seus ataques ignoram RD igual ao seu bônus " +
      "de treinamento.",
    requisitos: [{ tipo: "habilidade", id: "lut_poder_corporal" }],
  },

  /* ---------------- LUTADOR · POR NÍVEL (10° nível) ---------------- */
  {
    id: "lut_alma_quieta",
    nome: "Alma Quieta",
    especializacaoId: "lutador",
    tipo: "nivel",
    nivel: 10,
    descricao:
      "Sua alma é imperturbável durante uma boa luta. Você recebe vantagem para resistir às " +
      "seguintes condições: Condenado, Enfeitiçado e Fragilizado.",
    // TR treinado: o lado da CRIATURA em Testes de Resistência não existe.
    requisitos: [{ tipo: "nota", texto: "Treinado em Vontade" }],
  },
  {
    id: "lut_corpo_sincronizado",
    nome: "Corpo Sincronizado",
    especializacaoId: "lutador",
    tipo: "nivel",
    nivel: 10,
    descricao:
      "Seu corpo está sempre em sincronia. Você recebe vantagem para resistir às seguintes " +
      "condições: Caído e Exposto.",
    requisitos: [{ tipo: "nota", texto: "Treinado em Fortitude" }],
  },
  {
    id: "lut_empolgar_se",
    nome: "Empolgar-se",
    especializacaoId: "lutador",
    tipo: "nivel",
    nivel: 10,
    descricao:
      "Em certos momentos, a própria antecipação que você guarda para uma luta pode se transformar " +
      "na empolgação necessária. Uma quantidade de vezes igual ao seu Bônus de treinamento, por " +
      "descanso longo, você pode escolher subir dois níveis de empolgação, ao invés de um, no " +
      "começo de um turno em que ele aumentaria.",
    requisitos: [],
  },
  {
    id: "lut_impacto_demolidor",
    nome: "Impacto Demolidor",
    especializacaoId: "lutador",
    tipo: "nivel",
    nivel: 10,
    descricao:
      "Você consegue colocar tanta força em um golpe que o alvo se torna uma bola de demolição. " +
      "Como uma Ação Comum, realize uma jogada de ataque corpo a corpo contra um alvo dentro do " +
      "seu alcance corpo a corpo e, caso acerte, você causa o dano do ataque e realiza a ação " +
      "Empurrar como parte dele: a distância total que o alvo será empurrado é dobrada e ele " +
      "quebra todo objeto ou obstáculos em sua parede, como paredes ou contêiners, recebendo o " +
      "Dano de Fontes Externas (p.327). Não é possível utilizar Ataque Extra nesta ação.",
    requisitos: [{ tipo: "habilidade", id: "lut_potencia_superior" }],
  },
  {
    id: "lut_insistencia",
    nome: "Insistência",
    especializacaoId: "lutador",
    tipo: "nivel",
    nivel: 10,
    descricao:
      "Deixando o seu desejo se ampliar ainda mais, você se torna um lutador insistente e difícil " +
      "de derrubar. Uma vez por cena, caso você fosse ter os seus pontos de vida reduzidos a 0, " +
      "você pode escolher retornar ao nível de empolgação 1 para continuar de pé, curando-se em um " +
      "valor igual a uma rolagem de dano do seu ataque desarmado. Após usar essa habilidade, até " +
      "que realize um descanso longo, o seu nível máximo de empolgação abaixa em 1.",
    requisitos: [{ tipo: "habilidade", id: "lut_ignorar_dor" }],
  },
  {
    id: "lut_mente_em_paz",
    nome: "Mente em Paz",
    especializacaoId: "lutador",
    tipo: "nivel",
    nivel: 10,
    descricao:
      "Sua mente continua em paz mesmo durante o combate. Você recebe vantagem para resistir às " +
      "seguintes condições Amedrontado, Atordoado e Confuso.",
    requisitos: [{ tipo: "nota", texto: "Treinado em Astúcia" }],
  },

  /* ---------------- LUTADOR · POR NÍVEL (12° nível) ---------------- */
  {
    id: "lut_armas_absolutas",
    nome: "Armas Absolutas",
    especializacaoId: "lutador",
    tipo: "nivel",
    nivel: 12,
    descricao:
      "Sua dominância com as Armas Dedicadas chega ao ápice, tornando-as uma parte íntegra de si " +
      "mesmo. Enquanto estiver empunhando uma Arma Dedicada, você pode gastar 2PE para receber os " +
      "seguintes bônus por uma rodada: você escolhe aumentar sua Defesa em 3 ou receber +3 em " +
      "Jogadas de Ataque e, uma vez por ataque, ao errar com uma arma dedicada, você pode rolar " +
      "novamente o ataque, ficando com o melhor resultado. Para cada rodada após a primeira, você " +
      "deve gastar mais 2PE para manter, ou os bônus se encerram.",
    requisitos: [{ tipo: "habilidade", id: "lut_um_com_a_arma" }],
  },
  {
    id: "lut_corpo_arsenal",
    nome: "Corpo Arsenal",
    especializacaoId: "lutador",
    tipo: "nivel",
    nivel: 12,
    descricao:
      "Você se torna plenamente consciente do complexo arsenal que o seu corpo é, podendo o " +
      "utilizar ofensivamente de diferentes maneiras. Quando realizar um acerto crítico com um " +
      "ataque desarmado, você pode optar por infligir o efeito de um grupo adicional entre Bastão, " +
      "Haste ou Martelo.",
    requisitos: [{ tipo: "habilidade", id: "lut_punhos_letais" }],
  },
  {
    id: "lut_seja_agua",
    nome: "Seja Água",
    especializacaoId: "lutador",
    tipo: "nivel",
    nivel: 12,
    descricao:
      "Não se colocando dentro de uma única forma, você aprende a se mover como a água, " +
      "adaptando-se e não se prendendo. Seu Deslocamento aumenta em 3 metros, você ignora terreno " +
      "difícil por fontes físicas (como detritos ou solo destruído) e, uma vez por rodada, pode " +
      "evitar ser agarrado sem a necessidade de teste.",
    requisitos: [],
  },
  {
    id: "lut_tempestade_sufocante",
    nome: "Tempestade Sufocante",
    especializacaoId: "lutador",
    tipo: "nivel",
    nivel: 12,
    descricao:
      "Seus golpes marciais são tão rápidos e potentes que se tornam uma tempestade que sufoca e " +
      "destrói a guarda dos inimigos. Para cada ataque corpo a corpo desarmado ou com arma marcial " +
      "que você acertar em um mesmo alvo, ele recebe -1 na Defesa e em Testes de Resistência " +
      "realizados contra você, acumulando até um máximo igual ao seu bônus de treinamento. O " +
      "prejuízo dura até o começo do próximo turno da criatura afetada.",
    requisitos: [],
  },

  /* ---------------- LUTADOR · POR NÍVEL (16° nível) ---------------- */
  {
    id: "lut_corpo_supremo",
    nome: "Corpo Supremo",
    especializacaoId: "lutador",
    tipo: "nivel",
    nivel: 16,
    descricao:
      "Você alcançou um alto nível como lutador e levou seu corpo ao limite. Você recebe mais 3 " +
      "metros de movimento adicionais, +4 na sua Defesa e redução de dano igual a metade do seu " +
      "nível de personagem contra dano cortante, perfurante e de impacto, além de mais um tipo à " +
      "sua escolha, exceto alma. Contra os outros tipos de dano não escolhidos, a redução de dano " +
      "é igual a 1/4 do seu nível.",
    requisitos: [],
  },
  {
    id: "lut_duro_na_queda",
    nome: "Duro na Queda",
    especializacaoId: "lutador",
    tipo: "nivel",
    nivel: 16,
    descricao:
      "Quando estiver nas portas da morte, você pode escolher receber uma falha garantida para " +
      "fazer um teste de Vontade contra a CD X, sendo X igual a 15 + 1 para cada 3 pontos de vida " +
      "negativos. Se passar, você levanta com 1 de vida e recebe 1 ponto de exaustão.",
    requisitos: [{ tipo: "nota", texto: "Treinado em Vontade" }],
  },

  /* ---------------- COMBATENTE · BASE ----------------
     No livro: "Especialista em Combate". O autor escreve Combatente. */
  {
    id: "cmb_repertorio_do_especialista",
    nome: "Repertório do Especialista",
    especializacaoId: "combatente",
    tipo: "base",
    nivel: 1,
    descricao:
      "Como um Especialista em Combate, você pode escolher um estilo principal para seguir em sua " +
      "especialização. No primeiro nível, você recebe um dos estilos de combate abaixo.\n\n" +
      "Você recebe um novo estilo de combate no nível 6 e outro no 12, complementando suas " +
      "capacidades dentro de combate.",
    // Escolha aninhada: 1 estilo no nível 1, mais um no 6 e outro no 12.
    escolha: {
      id: "estilo_combate",
      label: "Estilo de Combate",
      niveis: [1, 6, 12],
      opcoes: ESTILOS_DE_COMBATE,
    },
    requisitos: [],
  },
  {
    id: "cmb_artes_do_combate",
    nome: "Artes do Combate",
    especializacaoId: "combatente",
    tipo: "base",
    nivel: 1,
    descricao:
      "Levando o combate como uma arte a se estudar e aperfeiçoar, você sabe como se preparar e " +
      "usar desse preparo para o possibilitar realizar ações especiais dentro de um combate. Você " +
      "recebe uma quantidade de Pontos de Preparo igual ao seu nível de Especialista em Combate + " +
      "Modificador de Sabedoria, os quais são usados para realizar artes de combate. Você sabe as " +
      "seguintes artes de combate:\n\n" +
      "• Arremesso Ágil. Ao realizar um ataque corpo-a-corpo, você pode gastar 1 ponto de preparo " +
      "para, como uma ação livre, realizar um outro ataque, com uma arma de arremesso, contra um " +
      "segundo alvo.\n" +
      "• Distração Letal. Ao realizar um ataque, você pode gastar 1 ponto de preparo para fazer " +
      "com que ele foque em distrair o alvo. Caso o ataque acerte, a criatura atingida tem a sua " +
      "Defesa reduzida em um valor igual a metade do seu Modificador de Sabedoria por uma rodada.\n" +
      "• Execução Silenciosa. Ao realizar um ataque em uma criatura desprevenida, você pode gastar " +
      "1 ponto de preparo para aumentar a letalidade do ataque, adicionando 1d6 de dano. A cada +2 " +
      "no Modificador de Sabedoria, o dano aumenta em +1d6.\n" +
      "• Golpe Descendente. Ao realizar um ataque corpo-a-corpo, você pode gastar 1 ponto de " +
      "preparo para fazer com que ele venha por cima. Ao acertar um golpe descendente, sua Defesa " +
      "aumenta em um valor igual a metade do seu Modificador de Sabedoria até o começo do seu " +
      "próximo turno.\n" +
      "• Investida Imediata. Ao realizar a ação de ataque, você pode gastar 2 pontos de preparo " +
      "para tornar esse ataque em uma investida imediata, aproximando-se uma quantidade de metros " +
      "igual ao seu Modificador de Sabedoria x 1,5m de um alvo e realizando o ataque logo após. " +
      "Esse movimento não causa ataques de oportunidade.\n\n" +
      "Sempre que eliminar um inimigo, você recupera um Ponto de Preparo; você pode usar sua ação " +
      "comum para analisar o campo de batalha, recuperando dois Pontos de Preparo. Em um descanso " +
      "curto, você recupera metade do seu máximo, enquanto em um descanso longo os recupera por " +
      "completo.",
    requisitos: [],
  },
  {
    id: "cmb_golpe_especial",
    nome: "Golpe Especial",
    especializacaoId: "combatente",
    tipo: "base",
    nivel: 4,
    descricao:
      "Quando realizar um ataque, ou arte do combate que envolva um ataque, você pode o montar " +
      "como um ataque especial, escolhendo entre as opções abaixo:\n\n" +
      "• Amplo. O ataque atinge uma criatura a mais. +2PE\n" +
      "• Atroz. Em um acerto, o ataque causa 1 dado de dano adicional. +1PE\n" +
      "• Impactante. Empurra o alvo em 1,5 metros para cada 15 pontos de dano causados. Fortitude " +
      "reduz à metade. +1PE\n" +
      "• Letal. Diminui em 1 a margem de crítico do ataque. +2PE\n" +
      "• Longo. Aumenta o alcance da arma em 1,5 metros para corpo-a-corpo ou 9 metros para " +
      "ataques a distância. +1PE\n" +
      "• Penetrante. Ignora redução a dano em um valor igual a metade do seu nível de personagem. " +
      "+2PE\n" +
      "• Preciso. Recebe vantagem no ataque. Após o primeiro uso na rodada, o custo aumenta para " +
      "2PE. +1PE/+2PE\n" +
      "• Sanguinário. Uma criatura atingida sofre sangramento leve (CD de Especialização). Pode " +
      "ser pego uma segunda vez para causar sangramento médio ao invés de leve. +2PE\n" +
      "• Lento. O ataque deve ser usado como ação completa. -2PE\n" +
      "• Sacrifício. Recebe 15 de dano ao efetuar o ataque. -1PE\n" +
      "• Desfocado. O ataque recebe uma penalidade de 4 no acerto (cumulativo até três vezes). " +
      "-1PE\n\n" +
      "Certas propriedades aumentam ou diminuem o custo e, ao terminar de montar o ataque " +
      "especial, você paga o seu custo total; um ataque especial deve custar no mínimo 1 ponto de " +
      "energia amaldiçoada (PE).",
    requisitos: [],
  },
  {
    id: "cmb_implemento_marcial",
    nome: "Implemento Marcial",
    especializacaoId: "combatente",
    tipo: "base",
    nivel: 4,
    descricao:
      "Você recebe +2 na CD de suas Habilidades de Especialização, Feitiços e Aptidões " +
      "Amaldiçoadas. Esse bônus aumenta em 1 nos níveis 8° e 16° de Especialista em Combate.",
    requisitos: [],
  },
  {
    id: "cmb_renovacao_pelo_sangue",
    nome: "Renovação pelo Sangue",
    especializacaoId: "combatente",
    tipo: "base",
    nivel: 6,
    descricao:
      "Com tamanha precisão e letalidade, você passa a ser capaz de renovar seu próprio estoque " +
      "de energia a partir do sangue. Ao acertar um ataque crítico em um inimigo ou reduzir seus " +
      "pontos de vida a 0, você recupera um ponto de energia amaldiçoada.",
    requisitos: [],
  },
  {
    id: "cmb_teste_de_resistencia_mestre",
    nome: "Teste de Resistência Mestre",
    especializacaoId: "combatente",
    tipo: "base",
    nivel: 9,
    descricao:
      "Você se torna treinado em um segundo teste de resistência e mestre no concedido pela sua " +
      "especialização.",
    requisitos: [],
  },
  {
    id: "cmb_autossuficiente",
    nome: "Autossuficiente",
    especializacaoId: "combatente",
    tipo: "base",
    nivel: 20,
    descricao:
      "Tornando-se um mestre das técnicas armadas, você consegue ser autossuficiente na energia " +
      "para usar seu golpe especial. Sempre que realizar um Golpe Especial, recebe 3 PE " +
      "temporários para serem usados no ataque. Uma vez por cena, você pode escolher transformar " +
      "esse valor em 6. Além disso, todos seus ataques causam um dado de dano adicional, do mesmo " +
      "tipo da arma manuseada.",
    requisitos: [],
  },

  /* ---------------- COMBATENTE · POR NÍVEL (2° nível) ---------------- */
  {
    id: "cmb_arremessos_potentes",
    nome: "Arremessos Potentes",
    especializacaoId: "combatente",
    tipo: "nivel",
    nivel: 2,
    descricao:
      "Você se torna capaz de arremessar armas com mais potência. Seus ataques com armas de " +
      "arremesso contam como um nível de dano acima. Além disso, no começo do seu turno, você " +
      "pode gastar 1PE para fazer com que seus ataques com armas de arremesso ignorem RD igual ao " +
      "seu bônus de treinamento.",
    requisitos: [],
  },
  {
    id: "cmb_arsenal_ciclico",
    nome: "Arsenal Cíclico",
    especializacaoId: "combatente",
    tipo: "nivel",
    nivel: 2,
    descricao:
      "Ao invés de se limitar a uma única arma, você mantém uma ciclagem do seu arsenal para " +
      "golpear com eficiência. Uma vez por rodada, você pode sacar ou trocar um item com uma ação " +
      "livre. Ao realizar um golpe com um grupo de armas e trocar para outra arma de outro grupo " +
      "na mesma rodada ou na próxima, você recebe +1d até o fim do seu próximo turno com a arma " +
      "trocada.",
    requisitos: [],
  },
  {
    id: "cmb_assumir_postura",
    nome: "Assumir Postura",
    especializacaoId: "combatente",
    tipo: "nivel",
    nivel: 2,
    descricao:
      "A postura que uma pessoa mantém em combate molda suas capacidades, fornecendo grandes " +
      "benefícios. Ao obter esta habilidade, você aprende uma das oito posturas de combate, às " +
      "quais influenciam grandemente em suas capacidades.\n\n" +
      "Entrar em uma postura é uma ação bônus, e ela dura 1 minuto ou até você ser derrubado, " +
      "ficar incapacitado ou trocar de postura. Você pode ativar suas posturas uma quantidade de " +
      "vezes igual ao seu bônus de treinamento. Nos níveis 8 e 16 você aprende outra postura a sua " +
      "escolha.",
    // Escolha aninhada: 1 postura ao obter (nível 2), mais uma no 8 e no 16.
    // Aprender Postura concede mais, do mesmo pool (níveis 4 e 10).
    escolha: {
      id: "postura",
      label: "Postura de Combate",
      niveis: [2, 8, 16],
      opcoes: POSTURAS_DE_COMBATE,
    },
    requisitos: [],
  },
  {
    id: "cmb_disparos_sincronizados",
    nome: "Disparos Sincronizados",
    especializacaoId: "combatente",
    tipo: "nivel",
    nivel: 2,
    descricao:
      "Você consegue sincronizar seus disparos e tiros, fazendo-os parecer um só. Caso esteja " +
      "manejando duas armas a distância ou de fogo, você pode usar suas ações de ataque juntas " +
      "para tentar sincronizar os dois tiros. Realize os dois ataques e, caso ambos acertem, você " +
      "combina o dano em uma única instância, depois adicionando efeitos aplicáveis para ambas as " +
      "armas, além de aplicar resistências ou fraquezas apenas uma vez.",
    requisitos: [],
  },
  {
    id: "cmb_escudeiro_agressivo",
    nome: "Escudeiro Agressivo",
    especializacaoId: "combatente",
    tipo: "nivel",
    nivel: 2,
    descricao:
      "Seu uso do escudo é não só defensivo, mas também agressivo. Uma vez por rodada, ao " +
      "realizar uma ação de ataque e estiver empunhando um escudo, você pode gastar 1 ponto de " +
      "energia amaldiçoada para fazer um ataque adicional com o escudo.",
    requisitos: [],
  },
  {
    id: "cmb_extensao_do_corpo",
    nome: "Extensão do Corpo",
    especializacaoId: "combatente",
    tipo: "nivel",
    nivel: 2,
    descricao:
      "Suas armas são praticamente extensões do seu próprio corpo. Seu alcance em ataques com " +
      "armas corpo a corpo aumenta em 1,5 metros e você recebe um bônus de +2 em jogadas de " +
      "ataque e em testes para evitar ser desarmado.",
    requisitos: [],
  },
  {
    id: "cmb_flanqueador_superior",
    nome: "Flanqueador Superior",
    especializacaoId: "combatente",
    tipo: "nivel",
    nivel: 2,
    descricao:
      "Você sabe perfeitamente como manter um flanco perigoso. Enquanto estiver flanqueando uma " +
      "criatura, a criatura flanqueada recebe -2 em testes de resistência.",
    requisitos: [],
  },
  {
    id: "cmb_golpe_falso",
    nome: "Golpe Falso",
    especializacaoId: "combatente",
    tipo: "nivel",
    nivel: 2,
    descricao:
      "Você é capaz de fingir desferir um golpe, distraindo seus inimigos para auxiliar aliados. " +
      "Como reação a um aliado atacando um inimigo dentro do seu alcance de ataque, você realiza " +
      "o golpe falso. O inimigo deve realizar um TR de Astúcia e, caso falhe, o seu aliado recebe " +
      "vantagem no teste de ataque.",
    requisitos: [],
  },
  {
    id: "cmb_golpes_potentes",
    nome: "Golpes Potentes",
    especializacaoId: "combatente",
    tipo: "nivel",
    nivel: 2,
    descricao:
      "Seus golpes se tornam inatamente mais potentes, sendo capaz de manejar armas extraindo seu " +
      "máximo. Sempre que você estiver usando uma arma com a qual você seja treinado o dano dela " +
      "aumenta em um nível e suas rolagens de dano recebem um bônus de +2.",
    requisitos: [],
  },
  {
    id: "cmb_indomavel",
    nome: "Indomável",
    especializacaoId: "combatente",
    tipo: "nivel",
    nivel: 2,
    descricao:
      "Em combate, você não se deixa render, resistindo ao que vier. Uma quantidade de vezes por " +
      "descanso curto ou longo igual a metade do seu nível de personagem, você pode gastar 1 " +
      "ponto de energia amaldiçoada para rolar novamente um teste de resistência em que você " +
      "falhar, ficando com o melhor resultado.",
    requisitos: [],
  },
  {
    id: "cmb_pistoleiro_iniciado",
    nome: "Pistoleiro Iniciado",
    especializacaoId: "combatente",
    tipo: "nivel",
    nivel: 2,
    descricao:
      "Atirando com volatilidade, você consegue impor mais poder nas suas armas em troca de um " +
      "risco maior. Quando for realizar um ataque com uma arma de fogo, antes da jogada de " +
      "ataque, você pode escolher aumentar a margem de Emperrar em 2 e, em troca, você causa 1 " +
      "dado de dano adicional caso acerte.",
    requisitos: [],
  },
  {
    id: "cmb_posicionamento_ameacador",
    nome: "Posicionamento Ameaçador",
    especializacaoId: "combatente",
    tipo: "nivel",
    nivel: 2,
    descricao:
      "Você sabe se posicionar de maneira estratégica, fazendo com que um inimigo que possa o ver " +
      "te reconheça como uma constante ameaça, mesmo distante. A menos que esteja furtivo, você " +
      "pode conceder os benefícios de Flanco para aliados, mesmo utilizando armas a distância ou " +
      "de fogo, desde que o alvo do flanco esteja dentro do primeiro alcance da sua arma.",
    requisitos: [],
  },
  {
    id: "cmb_precisao_definitiva",
    nome: "Precisão Definitiva",
    especializacaoId: "combatente",
    tipo: "nivel",
    nivel: 2,
    descricao:
      "Você se torna capaz de canalizar a energia amaldiçoada na sua arma de maneira a alcançar " +
      "uma precisão definitiva, seja para acertar ou para destruir. Quando faz um ataque, você " +
      "pode gastar 1 ponto de energia amaldiçoada para receber +2 na rolagem para acertar. A cada " +
      "quatro níveis, você pode gastar 1 ponto a mais para aumentar o bônus em +2. Você também " +
      "pode optar por adicionar esse bônus na rolagem de dano ao invés da de acerto, com um bônus " +
      "de +4 ao invés de +2 para esse uso.",
    requisitos: [],
  },
  {
    id: "cmb_presenca_suprimida",
    nome: "Presença Suprimida",
    especializacaoId: "combatente",
    tipo: "nivel",
    nivel: 2,
    descricao:
      "A furtividade e discrição podem ser essenciais em um combate, para se mover de maneira " +
      "apropriada. Você recebe um bônus de +2 em rolagens de Furtividade. Sua penalidade em " +
      "furtividade por atacar e fazer outras ações chamativas é reduzida para -5.",
    requisitos: [],
  },
  {
    id: "cmb_revigorar",
    nome: "Revigorar",
    especializacaoId: "combatente",
    tipo: "nivel",
    nivel: 2,
    descricao:
      "Diante o quão extenso e cansativo um combate pode ser, você é capaz de focar e recuperar " +
      "seu vigor. Uma quantidade de vezes igual ao seu bônus de treinamento você pode usar sua " +
      "ação bônus para se curar em um valor igual a 1d10 + o dobro do seu modificador de " +
      "Constituição + bônus de treinamento, aumentando em um dado a cada 4 níveis. Você recupera " +
      "todos os usos em um descanso longo ou metade em um descanso curto.",
    requisitos: [],
  },
  {
    id: "cmb_tiro_falso",
    nome: "Tiro Falso",
    especializacaoId: "combatente",
    tipo: "nivel",
    nivel: 2,
    descricao:
      "Você consegue fingir falsos disparos, distraindo um inimigo. Como reação a um aliado " +
      "atacando um inimigo dentro do seu alcance de ataque, caso esteja manejando uma arma a " +
      "distância ou de fogo, você realiza um tiro falso, fingindo que dispararia. O inimigo deve " +
      "realizar um TR de Astúcia e, caso falhe, o seu aliado recebe vantagem no teste de ataque.",
    requisitos: [],
  },
  {
    id: "cmb_zona_de_risco",
    nome: "Zona de Risco",
    especializacaoId: "combatente",
    tipo: "nivel",
    nivel: 2,
    descricao:
      "Ter uma arma com o alcance maior o permite criar uma efetiva zona de risco. Uma vez por " +
      "rodada, se estiver empunhando uma arma corpo-a-corpo com a propriedade Estendida e um " +
      "inimigo entrar no seu alcance de ataque, você pode gastar 2 pontos de energia amaldiçoada " +
      "para realizar um ataque contra ele.",
    requisitos: [],
  },

  /* ---------------- COMBATENTE · POR NÍVEL (4° nível) ---------------- */
  {
    id: "cmb_aprender_postura",
    nome: "Aprender Postura",
    especializacaoId: "combatente",
    tipo: "nivel",
    nivel: 4,
    descricao:
      "Você continua seu estudo sobre as posturas utilizadas em combate, expandindo seu " +
      "repertório. Você aprende uma postura adicional à sua escolha. No 10° nível você aprende " +
      "outra postura.",
    // Concede +1 escolha do MESMO pool de Posturas (POSTURAS_DE_COMBATE),
    // nos níveis 4 e 10. A escolha aninhada é exibida sob Assumir Postura;
    // aqui é só a concessão extra, a somar quando o estado da escolha existir.
    requisitos: [{ tipo: "habilidade", id: "cmb_assumir_postura" }],
  },
  {
    id: "cmb_armas_escolhidas",
    nome: "Armas Escolhidas",
    especializacaoId: "combatente",
    tipo: "nivel",
    nivel: 4,
    descricao:
      "Um tipo de arma ressoa de maneira única com você, e ela foi escolhida como seu caminho. " +
      "Escolha um grupo de arma: seus ataques com armas dele tem o nível de dano aumentado em 3.",
    // "Escolha um grupo de arma" espera o catálogo de Armas (não existe).
    requisitos: [],
  },
  {
    id: "cmb_arremesso_rapido",
    nome: "Arremesso Rápido",
    especializacaoId: "combatente",
    tipo: "nivel",
    nivel: 4,
    descricao:
      "Utilizando de armas leves e menores, você consegue as arremessar com velocidade. Uma vez " +
      "por rodada, ao realizar um ataque com uma arma de arremesso, você pode gastar 1PE para " +
      "realizar um ataque com arma de arremesso contra outro alvo. Você arremessa outra arma ou a " +
      "mesma arma utilizada antes, desde que ela possua a propriedade Retorno.",
    requisitos: [],
  },
  {
    id: "cmb_tecnicas_de_avanco",
    nome: "Técnicas de Avanço",
    especializacaoId: "combatente",
    tipo: "nivel",
    nivel: 4,
    descricao:
      "As técnicas de avanço envolvem a mistura do deslocamento com os golpes. Ao obter esta " +
      "habilidade, você aprende as duas artes do combate abaixo:\n\n" +
      "• Avanço Bumerangue. Ao utilizar a ação Atacar, você pode gastar 3 Pontos de Preparo para " +
      "saltar na direção de um inimigo dentro de 6 metros e, após encerrar a ação, você retorna " +
      "para o ponto de partida. Nem o avanço nem o retorno causam ataques de oportunidade. Durante " +
      "o retorno, você pode gastar 1 Ponto de Preparo para realizar um ataque com uma arma de " +
      "arremesso ou a distância contra o mesmo alvo.\n" +
      "• Sombra Descendente. Como uma Ação Comum, você pode gastar 3 Pontos de Preparo para " +
      "avançar rapidamente contra um inimigo dentro de 6 metros e realizar um ataque contra ele. " +
      "Após realizar o ataque, você o utiliza como apoio e se ergue no ar, podendo escolher cair " +
      "em outro inimigo dentro de 6 metros e realizar um ataque contra ele, caindo em um lugar " +
      "desocupado dentro de 3 metros do alvo após isso.",
    requisitos: [],
  },
  {
    id: "cmb_buscar_oportunidade",
    nome: "Buscar Oportunidade",
    especializacaoId: "combatente",
    tipo: "nivel",
    nivel: 4,
    descricao:
      "Você sabe como encontrar a oportunidade certa para fazer o que é necessário. Como uma Ação " +
      "Livre, realize um teste de Percepção com CD16 + 2 para cada inimigo em campo. Caso suceda " +
      "no teste, você pode utilizar Andar, Desengajar ou Esconder como Ação Livre.",
    requisitos: [],
  },
  {
    id: "cmb_compensar_erro",
    nome: "Compensar Erro",
    especializacaoId: "combatente",
    tipo: "nivel",
    nivel: 4,
    descricao:
      "Você se torna habilidoso o suficiente para compensar erros com a liberação bruta de " +
      "energia. Uma vez por rodada, quando errar um ataque com uma arma corpo a corpo, você pode " +
      "gastar até uma quantidade de PE igual ao seu bônus de treinamento para causar dano no alvo " +
      "do ataque. Para cada ponto gasto, o alvo recebe 1d10 de dano Energético com o seu " +
      "modificador de força, destreza ou sabedoria sendo somado ao total.",
    requisitos: [],
  },
  {
    id: "cmb_especialista_em_escudo",
    nome: "Especialista em Escudo",
    especializacaoId: "combatente",
    tipo: "nivel",
    nivel: 4,
    descricao:
      "Você se especializa completamente na defesa e no uso de escudos. Você passa a somar o " +
      "aumento base em RD do seu escudo em testes de resistência de Reflexos e Fortitude.",
    requisitos: [],
  },
  {
    id: "cmb_espirito_de_luta",
    nome: "Espírito de Luta",
    especializacaoId: "combatente",
    tipo: "nivel",
    nivel: 4,
    descricao:
      "O combate é um caminho, no qual você nutre um espírito intenso para lutar. Como uma Ação " +
      "Livre, você pode gastar 1PE para receber um bônus de +2 em jogadas de ataque até o fim da " +
      "cena. Além disso, ao utilizar esta habilidade, você ganha PV temporários igual ao seu " +
      "nível de personagem.",
    requisitos: [],
  },
  {
    id: "cmb_grupo_favorito",
    nome: "Grupo Favorito",
    especializacaoId: "combatente",
    tipo: "nivel",
    nivel: 4,
    descricao:
      "Você descobre como utilizar melhor um certo tipo de armas. Escolha um grupo de armas: você " +
      "recebe acesso ao efeito de crítico do grupo enquanto manejando uma arma que pertença a ele.",
    requisitos: [],
  },
  {
    id: "cmb_guarda_estudada",
    nome: "Guarda Estudada",
    especializacaoId: "combatente",
    tipo: "nivel",
    nivel: 4,
    descricao:
      "Sua guarda surge a partir do estudo e da reflexão. Você passa a somar metade do seu " +
      "modificador de Sabedoria na sua Defesa, limitado pelo seu nível. Além disso, você pode " +
      "escolher um Teste de Resistência para receber um bônus de +2.",
    requisitos: [],
  },
  {
    id: "cmb_mente_oculta",
    nome: "Mente Oculta",
    especializacaoId: "combatente",
    tipo: "nivel",
    nivel: 4,
    descricao:
      "Você treinou sua mente para se ocultar, aguçando-a para encontrar os lugares certos. Você " +
      "passa a adicionar também o seu bônus de sabedoria em rolagens de Furtividade.",
    requisitos: [],
  },
  {
    id: "cmb_preparo_imediato",
    nome: "Preparo Imediato",
    especializacaoId: "combatente",
    tipo: "nivel",
    nivel: 4,
    descricao:
      "Utilizando do seu preparo, você consegue rapidamente se colocar pronto para agir. Durante " +
      "uma rolagem de iniciativa, você pode gastar 3 pontos de preparo para utilizar Preparar, " +
      "mas apenas para uma ação bônus. A partir do 10° nível, você pode optar por gastar 7 pontos " +
      "de preparo para preparar uma ação comum.",
    requisitos: [],
  },
  {
    id: "cmb_recarga_rapida",
    nome: "Recarga Rápida",
    especializacaoId: "combatente",
    tipo: "nivel",
    nivel: 4,
    descricao:
      "Você se treinou e preparou para conseguir recarregar rapidamente. O custo em ações para " +
      "recarregar armas a distância que você empunhar diminui em um nível; custo de ação comum se " +
      "torna ação bônus e ação bônus se torna ação livre.",
    requisitos: [],
  },
  {
    id: "cmb_uso_rapido",
    nome: "Uso Rápido",
    especializacaoId: "combatente",
    tipo: "nivel",
    nivel: 4,
    descricao:
      "Para ter mais versatilidade e acessibilidade ao seu inventário de ferramentas, você " +
      "agiliza o uso delas. Ao utilizar uma ação para usar um item, você pode pagar 1 ponto de " +
      "energia para usar um item adicional.",
    requisitos: [],
  },

  /* ---------------- COMBATENTE · POR NÍVEL (6° nível) ---------------- */
  {
    id: "cmb_acervo_amplo",
    nome: "Acervo Amplo",
    especializacaoId: "combatente",
    tipo: "nivel",
    nivel: 6,
    descricao:
      "Seu acervo para o combate é amplo, conseguindo internalizar e manifestar qualquer estilo " +
      "que desejar. Ao obter esta habilidade, você aprende mais um Estilo de Combate. Após meditar " +
      "por 1 hora, você pode trocar quais estilos de combate você possui.",
    // Concede +1 Estilo de Combate (ver ESTILOS_DE_COMBATE / a escolha
    // aninhada do Repertório). Amarrar quando o estado de escolha existir.
    requisitos: [],
  },
  {
    id: "cmb_aprimoramento_especializado",
    nome: "Aprimoramento Especializado",
    especializacaoId: "combatente",
    tipo: "nivel",
    nivel: 6,
    descricao:
      "Você aprimora suas habilidades de combate para deixar mais difícil resistir as suas " +
      "técnicas de Especialista em Combate. Você passa a somar metade do modificador do seu " +
      "atributo chave em sua CD de Especialização.",
    requisitos: [],
  },
  {
    id: "cmb_ataque_extra",
    nome: "Ataque Extra",
    especializacaoId: "combatente",
    tipo: "nivel",
    nivel: 6,
    descricao:
      "Você consegue atacar mais rápido, otimizando seus golpes. Ao realizar a ação Atacar, você " +
      "pode gastar 2 PE para atacar duas vezes ao invés de uma.",
    requisitos: [],
  },
  {
    id: "cmb_critico_melhorado",
    nome: "Crítico Melhorado",
    especializacaoId: "combatente",
    tipo: "nivel",
    nivel: 6,
    descricao:
      "Você aguça o seu olhar para tornar mais fácil encaixar um golpe certeiro. A margem do seu " +
      "acerto crítico reduz em um número.",
    requisitos: [],
  },
  {
    id: "cmb_critico_potente",
    nome: "Crítico Potente",
    especializacaoId: "combatente",
    tipo: "nivel",
    nivel: 6,
    descricao:
      "Acertar um golpe certeiro é realmente devastador para você. Ao acertar um ataque crítico, " +
      "ele causa 1 dado de dano adicional.",
    requisitos: [],
  },
  {
    id: "cmb_feiticaria_implementada",
    nome: "Feitiçaria Implementada",
    especializacaoId: "combatente",
    tipo: "nivel",
    nivel: 6,
    descricao:
      "O jujutsu é um recurso indispensável, o qual você implementa no seu combate. Uma vez por " +
      "rodada, quando utilizar um Feitiço de dano, você pode gastar 2PE para realizar um ataque " +
      "contra uma criatura que tenha sido afetada por ela, como Ação Livre.",
    // "Treinado em Feitiçaria" espera o sistema de Perícias (não existe).
    requisitos: [{ tipo: "nota", texto: "Treinado em Feitiçaria" }],
  },
  {
    id: "cmb_fluxo_perfeito",
    nome: "Fluxo Perfeito",
    especializacaoId: "combatente",
    tipo: "nivel",
    nivel: 6,
    descricao:
      "Em certos momentos, o fluxo do combate é perfeito em sua mente. Caso você acerte todos os " +
      "seus ataques no turno, no seu próximo turno você ganha 1 ponto de energia amaldiçoada " +
      "temporária. No 12° nível, esse valor se torna 2.",
    requisitos: [],
  },
  {
    id: "cmb_olhos_de_aguia",
    nome: "Olhos de Águia",
    especializacaoId: "combatente",
    tipo: "nivel",
    nivel: 6,
    descricao:
      "Seu olhar é afiado e preciso como o de uma águia, permitindo-o mirar mais rapidamente. " +
      "Você pode gastar 1 PE para usar Mirar como uma ação livre.",
    requisitos: [],
  },
  {
    id: "cmb_manejo_especial",
    nome: "Manejo Especial",
    especializacaoId: "combatente",
    tipo: "nivel",
    nivel: 6,
    descricao:
      "A maneira a qual você maneja suas armas é única, feita com maestria inerente ao portador. " +
      "Você pode escolher uma propriedade de ferramenta amaldiçoada para ser aplicada em toda " +
      "arma que você estiver manejando, se possível.",
    requisitos: [],
  },
  {
    id: "cmb_marcar_inimigo",
    nome: "Marcar Inimigo",
    especializacaoId: "combatente",
    tipo: "nivel",
    nivel: 6,
    descricao:
      "Após um golpe, você marca um inimigo como seu no campo de batalha, impedindo-o de atacar e " +
      "retaliando tentativas de o ignorar. Quando acertar uma criatura com um ataque corpo a " +
      "corpo, você pode escolher marcá-la até o final do seu próximo turno: enquanto a criatura " +
      "marcada estiver dentro de 4,5 metros de você, ela recebe -4 em jogadas de ataque e, " +
      "adicionalmente, caso a criatura marcada cause dano em alguém além de você, você pode gastar " +
      "1PE para realizar um ataque como Ação Bônus contra ela no seu próximo turno. Você pode " +
      "realizar este ataque uma quantidade de vezes igual ao seu modificador de Força, Destreza ou " +
      "Sabedoria por descanso curto. Caso seja incapacitado, desmaiado ou morto, o efeito da " +
      "habilidade é cancelado.",
    requisitos: [],
  },
  {
    id: "cmb_mira_destrutiva",
    nome: "Mira Destrutiva",
    especializacaoId: "combatente",
    tipo: "nivel",
    nivel: 6,
    descricao:
      "Ao invés de apenas acertar, você é capaz de mirar para destruir completamente, em um " +
      "disparo difícil, mas recompensador. Quando utilizar a ação Mirar, você optar por deixar de " +
      "receber vantagem para mirar em uma parte específica do corpo: escolha entre Olho, Braço, " +
      "Perna ou Ferida Interna e, no seu próximo ataque, você recebe -15 na jogada de ataque, mas, " +
      "caso acerte, o alvo recebe a consequência do membro de acordo com a tabela de Ferimentos " +
      "Complexos durante uma rodada.",
    // "Treinado em Percepção" espera o sistema de Perícias (não existe).
    requisitos: [{ tipo: "nota", texto: "Treinado em Percepção" }],
  },
  {
    id: "cmb_preparacao_rapida",
    nome: "Preparação Rápida",
    especializacaoId: "combatente",
    tipo: "nivel",
    nivel: 6,
    descricao:
      "A arte das posturas já está encravada em sua mente, tornando-se algo rápido e imediato. " +
      "Entrar em uma postura se torna uma Ação Livre e elas não são canceladas caso você seja " +
      "empurrado.",
    requisitos: [{ tipo: "habilidade", id: "cmb_assumir_postura" }],
  },

  /* ---------------- COMBATENTE · POR NÍVEL (8° nível) ---------------- */
  {
    id: "cmb_aptidoes_de_combate",
    nome: "Aptidões de Combate",
    especializacaoId: "combatente",
    tipo: "nivel",
    nivel: 8,
    descricao:
      "Você aprimora suas aptidões de energia necessárias para dominar o combate. Ao obter esta " +
      "habilidade, você pode aumentar o seu nível de aptidão em Aura ou Controle e Leitura em 1. " +
      "Você pode pegar esta habilidade duas vezes, uma para cada aptidão.",
    // ⚠ REPETÍVEL ("duas vezes, uma para cada aptidão") E concede nível de
    // trilha (au OU cl, à escolha). O shape atual (lista de ids únicos) não
    // suporta 2x, e a concessão de trilha ainda não é aplicada. Ver status.
    requisitos: [],
  },
  {
    id: "cmb_tecnicas_da_forca",
    nome: "Técnicas da Força",
    especializacaoId: "combatente",
    tipo: "nivel",
    nivel: 8,
    descricao:
      "As técnicas da força permitem uma concentração ainda maior da sua potência e poder. Ao " +
      "obter esta habilidade, você aprende as duas artes do combate abaixo:\n\n" +
      "• Nuvens Espirais. Como uma Ação Completa, você inicia uma sequência contra um inimigo " +
      "dentro do alcance da sua arma: você pode realizar até três ataques, gastando 2 Pontos de " +
      "Preparo para cada um. A cada ataque, o alvo é empurrado 3 metros para qualquer direção, com " +
      "você o acompanhando, além de cada ataque causar 2d6 de dano Energético adicional.\n" +
      "• Onda do Dragão. Quando utilizar a ação Atacar, você pode gastar 5 Pontos de Preparo para " +
      "receber vantagem neste ataque e, caso acerte, o alvo é empurrado 6 metros para trás, recebe " +
      "3d12 de dano Energético adicional e tem metade da sua Redução de Dano ignorada.",
    requisitos: [],
  },
  {
    id: "cmb_destruicao_dupla",
    nome: "Destruição Dupla",
    especializacaoId: "combatente",
    tipo: "nivel",
    nivel: 8,
    descricao:
      "Duas armas em mãos, o dobro de destruição para seus inimigos. Enquanto estiver lutando com " +
      "duas armas de grupos diferentes, seu ataque com a segunda arma causa 1 dado de dano " +
      "adicional e, caso consiga um acerto crítico, você pode gastar 1PE para aplicar o Efeito " +
      "Crítico do grupo das duas armas que você maneja ao mesmo tempo, caso sejam de grupos " +
      "diferentes.",
    requisitos: [],
  },
  {
    id: "cmb_espirito_incansavel",
    nome: "Espírito Incansável",
    especializacaoId: "combatente",
    tipo: "nivel",
    nivel: 8,
    descricao:
      "Nada pode abalar o seu espírito para lutar, o qual se torna ainda mais persistente. Quando " +
      "utilizar Espírito de Luta, você pode optar por gastar 2PE ao invés de 1, aumentando o bônus " +
      "em ataques para +5 e fazendo com que os pontos de vida temporários ganhos se tornam o seu " +
      "bônus de ataque, ao invés do Nível do Personagem, já considerando o bônus da habilidade.",
    requisitos: [{ tipo: "habilidade", id: "cmb_espirito_de_luta" }],
  },
  {
    id: "cmb_pistoleiro_avancado",
    nome: "Pistoleiro Avançado",
    especializacaoId: "combatente",
    tipo: "nivel",
    nivel: 8,
    descricao:
      "Suas técnicas como pistoleiro se tornam ainda mais afiadas, conseguindo tomar riscos " +
      "maiores e encontrar novas oportunidades com as armas. Você pode optar por aumentar o " +
      "Emperrar em até 6, ao invés de 2, causando 1 dado de dano adicional para cada outros 2 que " +
      "aumentar. Além disso, caso uma criatura dentro do primeiro alcance da sua arma de fogo " +
      "tente se mover, você pode gastar sua Reação para realizar um ataque contra ela e, se " +
      "acertar, ela recebe dano e ela perde 4,5 metros de movimento até o final do turno dela.",
    requisitos: [{ tipo: "habilidade", id: "cmb_pistoleiro_iniciado" }],
  },
  {
    id: "cmb_ricochete_constante",
    nome: "Ricochete Constante",
    especializacaoId: "combatente",
    tipo: "nivel",
    nivel: 8,
    descricao:
      "Imbuídas com energia, suas armas de arremesso colidem e explodem em energia, ricocheteando " +
      "para um próximo alvo. Quando for ativar Arremessos Potentes, você pode pagar 5PE ao invés " +
      "de 1 para que, até o final do turno, seus ataques com armas de arremesso possam acertar uma " +
      "criatura à sua escolha dentro de 4,5 metros do alvo do ataque, caso sua jogada de ataque " +
      "supere a Defesa da outra criatura.",
    // O texto depende de Arremessos Potentes, mas NÃO traz [Pré-Requisito]
    // no livro. Mantido sem requisito estruturado (transcrição verbatim),
    // igual ao caso Revestimento Evoluído das Aptidões.
    requisitos: [],
  },
  {
    id: "cmb_sombra_viva",
    nome: "Sombra Viva",
    especializacaoId: "combatente",
    tipo: "nivel",
    nivel: 8,
    descricao:
      "Você é como uma sombra, movendo-se rapidamente e de maneira imperceptível. Uma vez por " +
      "rodada, você pode utilizar Esgueirar e se mover todo o seu movimento, ao invés de apenas " +
      "metade. Além disso, uma vez por rodada, caso fosse ser encontrado por uma criatura o " +
      "procurando, você pode utilizar sua Reação para realizar outro teste de Furtividade e, caso " +
      "o resultado do novo teste supere a Percepção do inimigo o procurando, você continua " +
      "escondido.",
    requisitos: [{ tipo: "nota", texto: "Treinado em Furtividade" }],
  },
  {
    id: "cmb_surto_de_acao",
    nome: "Surto de Ação",
    especializacaoId: "combatente",
    tipo: "nivel",
    nivel: 8,
    descricao:
      "Em momentos cruciais, você consegue se forçar a agir mais, excedendo suas capacidades " +
      "normais. Uma quantidade de vezes igual a metade do seu bônus de treinamento, por descanso " +
      "longo, você pode, uma vez por rodada, gastar 5 pontos de energia amaldiçoada para realizar " +
      "uma ação comum a mais no seu turno.",
    requisitos: [],
  },

  /* ---------------- COMBATENTE · POR NÍVEL (10° nível) ---------------- */
  {
    id: "cmb_analise_acelerada",
    nome: "Análise Acelerada",
    especializacaoId: "combatente",
    tipo: "nivel",
    nivel: 10,
    descricao:
      "Você já se acostumou a analisar o campo de batalha como um reflexo ou instinto. Utilizar a " +
      "ação de Análise se torna uma ação bônus.",
    requisitos: [],
  },
  {
    id: "cmb_armas_perfeitas",
    nome: "Armas Perfeitas",
    especializacaoId: "combatente",
    tipo: "nivel",
    nivel: 10,
    descricao:
      "Suas armas escolhidas se tornaram perfeitas, sabendo como contornar fraquezas e defesas. " +
      "Seus ataques com uma arma do grupo escolhido em Armas Escolhidas ignoram 10 de RD ao tipo " +
      "de dano dela.",
    requisitos: [{ tipo: "habilidade", id: "cmb_armas_escolhidas" }],
  },
  {
    id: "cmb_assassinar",
    nome: "Assassinar",
    especializacaoId: "combatente",
    tipo: "nivel",
    nivel: 10,
    descricao:
      "Durante o primeiro momento, você é capaz de extrair letalidade absoluta, golpeando um " +
      "inimigo desprevenido com um bote poderoso. Durante a primeira rodada de um combate, ao " +
      "atacar uma criatura desprevenida a partir da furtividade ou surpresa, seu primeiro ataque " +
      "é um crítico garantido.",
    requisitos: [{ tipo: "nota", texto: "Mestre em Furtividade" }],
  },
  {
    id: "cmb_ataque_concentrado",
    nome: "Ataque Concentrado",
    especializacaoId: "combatente",
    tipo: "nivel",
    nivel: 10,
    descricao:
      "Ao invés de desferir vários golpes, você concentra tudo em um único brandir. Ao utilizar a " +
      "ação Atacar, você pode gastar PE equivalentes a metade do custo de Ataque Extra e/ou Surto " +
      "de Ação, até um limite igual ao máximo de vezes que poderia usá-los dentro do seu turno. " +
      "Para cada vez que o fizer, você adiciona metade dos dados de dano de um ataque (mínimo 1 " +
      "dado) à rolagem de dano do seu próximo ataque. Ao utilizar esta habilidade, considera-se " +
      "que ataque extra e/ou Surto de Ação foram utilizados, não podendo os realizar novamente no " +
      "mesmo turno.",
    requisitos: [{ tipo: "habilidade", id: "cmb_ataque_extra" }],
  },
  {
    id: "cmb_chuva_de_arremessos",
    nome: "Chuva de Arremessos",
    especializacaoId: "combatente",
    tipo: "nivel",
    nivel: 10,
    descricao:
      "Você consegue extrair rapidez dos seus arremessos, realizando-os em um ritmo absurdo e " +
      "influenciado pela energia. Como uma ação completa você pode escolher realizar uma " +
      "quantidade de ataques com armas de arremesso igual ao seu bônus de treinamento. Para cada " +
      "ataque após o primeiro, você gasta 1 ponto de energia amaldiçoada e você só pode continuar " +
      "realizando ataques enquanto ainda tenha armas de arremesso em sua posse.",
    requisitos: [
      { tipo: "habilidade", id: "cmb_arremessos_potentes" },
      { tipo: "habilidade", id: "cmb_arremesso_rapido" },
    ],
  },
  {
    id: "cmb_potencia_antes_de_cair",
    nome: "Potência Antes de Cair",
    especializacaoId: "combatente",
    tipo: "nivel",
    nivel: 10,
    descricao:
      "Ao reconhecer que em breve você irá cair, você consegue impactar grandemente o combate " +
      "antes dessa queda. Se você for cair para 0 de vida, você pode realizar um turno impedindo o " +
      "turno atual. Ao ter 0 de vida neste turno, tomar dano resulta em falhas no teste de morte. " +
      "Quando o turno acaba, você fica inconsciente e recebe um nível de exaustão. Pode ser usada " +
      "uma vez por descanso longo.",
    requisitos: [],
  },

  /* ---------------- COMBATENTE · POR NÍVEL (12° nível) ---------------- */
  {
    id: "cmb_tecnicas_de_saque",
    nome: "Técnicas de Saque",
    especializacaoId: "combatente",
    tipo: "nivel",
    nivel: 12,
    descricao:
      "As técnicas de saque permitem que o próprio ato de sacar uma arma se torna destrutivo. Ao " +
      "obter esta habilidade, você aprende as duas artes do combate abaixo:\n\n" +
      "• Saque Devastador. No final do seu turno, você pode gastar 2 Pontos de Preparo para " +
      "preparar um saque, o qual dura até o começo do seu próximo turno. Caso seja atacado " +
      "enquanto estiver com o saque preparado, você pode gastar 4 Pontos de Preparo e sua Reação " +
      "para realizar um ataque contra a criatura atacante. Caso o resultado da sua Jogada de " +
      "Ataque seja maior do que a da criatura, você anula o ataque dela e acerta o seu, o qual " +
      "causa 4d10 de dano adicional do mesmo tipo da arma e ignora Redução de Dano. Caso o seu " +
      "resultado seja menor, você apenas causa o dano comum de um ataque.\n" +
      "• Saque Trovão. Como uma Ação Completa, você pode gastar 6 Pontos de Preparo para se mover " +
      "uma distância igual ao seu Deslocamento e, enquanto se movendo desta maneira, você não " +
      "recebe ataques de oportunidade e pode realizar um ataque contra todo inimigo que fique " +
      "dentro de 3 metros de você durante a locomoção.",
    requisitos: [],
  },
  {
    id: "cmb_ciclagem_absoluta",
    nome: "Ciclagem Absoluta",
    especializacaoId: "combatente",
    tipo: "nivel",
    nivel: 12,
    descricao:
      "O ciclo mantido entre seu arsenal é absoluto, conectando armas diferentes com facilidade. " +
      "Você passa a poder, durante o seu turno, trocar a arma que esteja manejando toda vez que " +
      "atacar. Além disso, sempre que trocar para outra arma de outro grupo durante seu turno, " +
      "você recebe um bônus de +2 na próxima jogada de ataque que realizar.",
    requisitos: [{ tipo: "habilidade", id: "cmb_arsenal_ciclico" }],
  },
  {
    id: "cmb_manejo_unico",
    nome: "Manejo Único",
    especializacaoId: "combatente",
    tipo: "nivel",
    nivel: 12,
    descricao:
      "Desenvolvendo ainda mais no seu próprio manejo de armas, você alcança um nível especial. " +
      "Você escolhe mais uma propriedade para ser aplicada em toda arma que estiver manejando e, " +
      "no começo de uma cena de combate, pode pagar 2 pontos de energia para receber uma " +
      "propriedade única durante o resto da cena. Essa propriedade pode tanto ser criada pelo " +
      "jogador, quanto ser uma das já existentes.",
    requisitos: [{ tipo: "habilidade", id: "cmb_manejo_especial" }],
  },
  {
    id: "cmb_mestre_pistoleiro",
    nome: "Mestre Pistoleiro",
    especializacaoId: "combatente",
    tipo: "nivel",
    nivel: 12,
    descricao:
      "Em suas mãos, as armas podem extrair todo o seu potencial, agora sendo as ferramentas de " +
      "um mestre. Fazer uma arma emperrada funcionar novamente se torna uma ação de movimento e " +
      "sua margem de crítico com armas de fogo aumenta em 1.",
    requisitos: [{ tipo: "habilidade", id: "cmb_pistoleiro_avancado" }],
  },
  {
    id: "cmb_sincronia_perfeita",
    nome: "Sincronia Perfeita",
    especializacaoId: "combatente",
    tipo: "nivel",
    nivel: 12,
    descricao:
      "Você está em perfeita sincronia com suas armas, as quais se tornam uma parte do seu corpo, " +
      "deixando-o ainda mais livre. O alcance adicional concedido por Extensão do Corpo aumenta " +
      "para 3 metros e recebe vantagem em testes para evitar ser desarmado.",
    requisitos: [{ tipo: "habilidade", id: "cmb_extensao_do_corpo" }],
  },

  /* ---------------- COMBATENTE · POR NÍVEL (16° nível) ---------------- */
  {
    id: "cmb_critico_aperfeicoado",
    nome: "Crítico Aperfeiçoado",
    especializacaoId: "combatente",
    tipo: "nivel",
    nivel: 16,
    descricao:
      "Seu senso de combate se torna ainda mais afiado e letal, encaixando críticos com maior " +
      "facilidade. A margem do seu acerto crítico reduz em dois números, ao invés de um.",
    requisitos: [{ tipo: "habilidade", id: "cmb_critico_melhorado" }],
  },
  {
    id: "cmb_mestre_da_postura",
    nome: "Mestre da Postura",
    especializacaoId: "combatente",
    tipo: "nivel",
    nivel: 16,
    descricao:
      "Você se torna um mestre completo das posturas, dominando-as de uma maneira que poucos são " +
      "capazes, até mesmo as mesclando. Quando entrar em postura, você pode assumir duas posturas " +
      "ao mesmo tempo, recebendo os benefícios de ambas.",
    requisitos: [{ tipo: "habilidade", id: "cmb_assumir_postura" }],
  },

  /* ================= CONJURADOR · BASE =================
     No livro: "Especialista em Técnicas". O autor escreve Conjurador, mesmo
     caso de Combatente x Especialista em Combate. Base nos níveis 1, 1, 4,
     9, 10 e 20. */
  {
    id: "cnj_dominio_dos_fundamentos",
    nome: "Domínio dos Fundamentos",
    especializacaoId: "conjurador",
    tipo: "base",
    nivel: 1,
    descricao:
      "Como um especialista em técnicas, você tem uma maior dominância sobre os fundamentos da " +
      "energia amaldiçoada e das suas habilidades. Você aprende duas das Mudanças de Fundamento " +
      "abaixo no primeiro nível e uma adicional no nível 12.",
    // Escolha aninhada: DUAS no nível 1 (daí o 1 repetido) e uma no 12.
    // Expansão dos Fundamentos (8°) concede mais, do mesmo pool.
    escolha: {
      id: "mudanca_fundamento",
      label: "Mudança de Fundamento",
      niveis: [1, 1, 12],
      opcoes: MUDANCAS_DE_FUNDAMENTO,
    },
    requisitos: [],
  },
  {
    id: "cnj_conjuracao_aprimorada",
    nome: "Conjuração Aprimorada",
    especializacaoId: "conjurador",
    tipo: "base",
    nivel: 1,
    descricao:
      "Todos podem utilizar Feitiços, mas você consegue os aprimorar e extrair um maior potencial. " +
      "Sempre que utilizar um Feitiço que cause dano, você soma um bônus ao total de dano causado " +
      "baseado no nível do Feitiço, de acordo com a tabela abaixo. Além disso, você passa a " +
      "receber novos Feitiços em todo nível, ao invés de apenas nos níveis pares.\n\n" +
      "Nível da Habilidade · Bônus de Dano\n" +
      "• Nível 1: Modificador de Atributo\n" +
      "• Nível 2: Modificador de Atributo\n" +
      "• Nível 3: Dobro do Modificador de Atributo\n" +
      "• Nível 4: 2x Mod. de Atributo + Nível de Personagem\n" +
      "• Nível 5: 2x Mod. de Atributo + 2x Nível de Personagem\n" +
      "• Técnica Máxima: 3x Mod. de Atributo + 3x Nível de Personagem",
    requisitos: [],
  },
  {
    id: "cnj_adiantar_a_evolucao",
    nome: "Adiantar a Evolução",
    especializacaoId: "conjurador",
    tipo: "base",
    nivel: 4,
    descricao:
      "Focado em sua técnica, você consegue adiantar a evolução das suas habilidades. Ao invés de " +
      "seguir o padrão para conseguir Feitiços de nível superior, com o aumento de treinamento, " +
      "você segue o seguinte padrão: no nível 4, você recebe acesso a Feitiços nível 2; no nível " +
      "7, você recebe acesso a Feitiços nível 3; no nível 11, você recebe acesso a Feitiços nível " +
      "4; no nível 15, você recebe acesso a Feitiços nível 5.",
    requisitos: [],
  },
  {
    id: "cnj_teste_de_resistencia_mestre",
    nome: "Teste de Resistência Mestre",
    especializacaoId: "conjurador",
    tipo: "base",
    nivel: 9,
    descricao:
      "Você se torna treinado em um segundo teste de resistência e mestre no concedido pela sua " +
      "especialização.",
    requisitos: [],
  },
  {
    id: "cnj_foco_amaldicoado",
    nome: "Foco Amaldiçoado",
    especializacaoId: "conjurador",
    tipo: "base",
    nivel: 10,
    descricao:
      "Durante seu desenvolvimento, você se foca em certos aspectos do funcionamento da energia " +
      "amaldiçoada, podendo escolher entre um dos três focos:",
    // Escolha aninhada: UM foco, no nível 10.
    escolha: {
      id: "foco_amaldicoado",
      label: "Foco Amaldiçoado",
      niveis: [10],
      opcoes: FOCOS_AMALDICOADOS,
    },
    requisitos: [],
  },
  {
    id: "cnj_o_honrado",
    nome: "O Honrado",
    especializacaoId: "conjurador",
    tipo: "base",
    nivel: 20,
    descricao:
      "Entre os céus e a terra, você sozinho é o honrado, com um controle de energia amaldiçoada " +
      "insuperável. Feitiços de nível 1, 2 e 3 tem o seu custo reduzido pela metade; a CD de todos " +
      "seus Feitiços e Aptidões Amaldiçoadas aumenta em 5 e você recebe +5 em rolagens de ataque " +
      "para Feitiços e Aptidões Amaldiçoadas.",
    requisitos: [],
  },

  /* ---------------- CONJURADOR · POR NÍVEL (2° nível) ---------------- */
  {
    id: "cnj_abastecido_pelo_sangue",
    nome: "Abastecido pelo Sangue",
    especializacaoId: "conjurador",
    tipo: "nivel",
    nivel: 2,
    descricao:
      "O sangue de seus inimigos também é capaz de o abastecer, trazendo mais energia amaldiçoada. " +
      "Quando um inimigo morre dentro de 12 metros de você, você pode usar sua reação para " +
      "recuperar uma quantidade de energia amaldiçoada igual ao seu modificador de Inteligência ou " +
      "Sabedoria, ao absorver os vestígios de sua energia. Você pode realizar essa ação uma vez por " +
      "descanso longo. No nível 8 aumenta para duas vezes e no nível 16 para três vezes.",
    requisitos: [],
  },
  {
    id: "cnj_conhecimento_aplicado",
    nome: "Conhecimento Aplicado",
    especializacaoId: "conjurador",
    tipo: "nivel",
    nivel: 2,
    descricao:
      "Sendo um especialista em técnicas, você as conhece muito bem e consegue aplicar esse " +
      "conhecimento de maneira defensiva contra outros usuários de técnica. Sempre que for " +
      "realizar um teste de resistência contra o efeito de um Feitiço, você pode gastar pontos de " +
      "energia amaldiçoada igual a metade do seu bônus de treinamento para receber um bônus: para " +
      "cada ponto gasto, você adiciona +2 no teste de resistência.",
    requisitos: [],
  },
  {
    id: "cnj_conjuracao_defensiva",
    nome: "Conjuração Defensiva",
    especializacaoId: "conjurador",
    tipo: "nivel",
    nivel: 2,
    descricao:
      "Após uma conjuração, você mantém parte da energia amaldiçoada como um revestimento em seu " +
      "corpo. Ao usar um Feitiço, você pode gastar 2 PE para, até o começo do seu próximo turno, " +
      "receber um bônus em Defesa e um valor em RD igual ao nível do Feitiço usado.",
    requisitos: [],
  },
  {
    id: "cnj_economia_de_energia",
    nome: "Economia de Energia",
    especializacaoId: "conjurador",
    tipo: "nivel",
    nivel: 2,
    descricao:
      "Enquanto descansando você armazena parte de sua energia em uma economia reserva. Após um " +
      "descanso curto, sua reserva é igual a 1d4, após um descanso longo esse valor é 1d6, " +
      "aumentando em um dado a cada 5 níveis. Como uma ação comum, você pode adicionar a energia " +
      "da reserva no seu valor atual. A economia não acumula.",
    requisitos: [],
  },
  {
    id: "cnj_explosao_encadeada",
    nome: "Explosão Encadeada",
    especializacaoId: "conjurador",
    tipo: "nivel",
    nivel: 2,
    descricao:
      "Um bom desempenho em uma conjuração o permite aumentar o poder destrutivo, encadeando a " +
      "força. Ao rolar o dano máximo em um dado de dano de um Feitiço de dano, você rola mais um " +
      "dado de dano de mesmo valor, adicionando o resultado ao total de dano. Tal habilidade " +
      "funciona apenas uma vez por dado do Feitiço: caso role-se um dado adicional por causa de " +
      "Explosão Encadeada, e tal seja dano máximo, não se ativa novamente.",
    requisitos: [],
  },
  {
    id: "cnj_finta_amaldicoada",
    nome: "Finta Amaldiçoada",
    especializacaoId: "conjurador",
    tipo: "nivel",
    nivel: 2,
    descricao:
      "Você é capaz de enganar com falsas conjurações de técnica. Você pode utilizar Fintar com " +
      "seu atributo-chave ao invés de Presença e os efeitos de Desprevenido por fintar são " +
      "aplicados na sua próxima conjuração de Feitiço.",
    requisitos: [],
  },
  {
    id: "cnj_mente_placida",
    nome: "Mente Plácida",
    especializacaoId: "conjurador",
    tipo: "nivel",
    nivel: 2,
    descricao:
      "Sua mente é sempre plácida, dificultando que sua concentração seja quebrada. Quando " +
      "realizar um teste para manter concentração, você pode gastar 1 ponto de energia para " +
      "receber um bônus de +3 ou 2 pontos de energia para receber +5, e a Classe de Dificuldade " +
      "sempre será reduzida em um valor igual ao seu modificador de Inteligência ou sabedoria.",
    requisitos: [],
  },
  {
    id: "cnj_nova_habilidade",
    nome: "Nova Habilidade",
    especializacaoId: "conjurador",
    tipo: "nivel",
    nivel: 2,
    descricao:
      "Uma nova ideia surge em sua mente, a qual você transforma em uma habilidade inédita. Ao " +
      "obter esta habilidade, você pode imediatamente criar dois novos Feitiços ou três variações " +
      "de liberação. Você pode pegar essa habilidade repetidas vezes.",
    // ⚠ REPETÍVEL sem limite ("repetidas vezes"), e o alvo (Feitiços) é um
    // sistema que não existe. creature.habilidades é lista de ids ÚNICOS.
    requisitos: [],
  },
  {
    id: "cnj_perturbacao_amaldicoada",
    nome: "Perturbação Amaldiçoada",
    especializacaoId: "conjurador",
    tipo: "nivel",
    nivel: 2,
    descricao:
      "Energia amaldiçoada é energia negativa, e você consegue extrair essa negatividade e a impor " +
      "em um inimigo, prejudicando o seu desempenho. Como uma ação comum, você pode gastar 2 " +
      "pontos de energia amaldiçoada para perturbar uma criatura dentro de 9 metros, a qual deve " +
      "realizar um TR de Vontade. Caso a criatura falhe, ela receberá um prejuízo em rolagens " +
      "igual ao seu modificador de Inteligência ou Sabedoria; caso a criatura suceda, esse " +
      "prejuízo é apenas metade do bônus escolhido. A perturbação dura por uma quantidade de " +
      "rolagens igual ao seu bônus de treinamento.",
    requisitos: [],
  },
  {
    id: "cnj_reacao_rapida",
    nome: "Reação Rápida",
    especializacaoId: "conjurador",
    tipo: "nivel",
    nivel: 2,
    descricao:
      "Você sempre reage rápido quando uma situação de combate começa. Você passa a adicionar seu " +
      "modificador de Inteligência ou Sabedoria no seu bônus de iniciativa.",
    requisitos: [],
  },
  {
    id: "cnj_reforco_amaldicoado",
    nome: "Reforço Amaldiçoado",
    especializacaoId: "conjurador",
    tipo: "nivel",
    nivel: 2,
    descricao:
      "Você reforça as suas habilidades, tornando mais difícil resistir a elas. Sua CD de " +
      "Especialização e Amaldiçoada aumenta em +2. No nível 10, esse aumento se torna +3 e no " +
      "nível 20, se torna +4.",
    requisitos: [],
  },
  {
    id: "cnj_sobrecarregar",
    nome: "Sobrecarregar",
    especializacaoId: "conjurador",
    tipo: "nivel",
    nivel: 2,
    descricao:
      "Focando em sobrecarregar as suas habilidades, você pode consumir energia para a deixar " +
      "quase impossível de resistir. Quando usar um Feitiço que força um teste de resistência você " +
      "pode gastar pontos de energia amaldiçoada igual ao seu bônus de treinamento para aumentar a " +
      "dificuldade do teste. Para cada ponto gasto, a dificuldade aumenta em 1.",
    requisitos: [],
  },
  {
    id: "cnj_tecnicas_de_combate",
    nome: "Técnicas de Combate",
    especializacaoId: "conjurador",
    tipo: "nivel",
    nivel: 2,
    descricao:
      "Você decide se versar em técnicas essenciais de combate, em busca de conseguir se defender " +
      "em casos extremos. Você pode escolher duas armas quaisquer para se tornar treinado, caso " +
      "não tenha, e para poder utilizar Inteligência ou Sabedoria nas jogadas de ataque e dano " +
      "enquanto as manejando.",
    // "Escolha duas armas": espera o catálogo de ARMAS, que não existe.
    requisitos: [],
  },
  {
    id: "cnj_zelo_recompensador",
    nome: "Zelo Recompensador",
    especializacaoId: "conjurador",
    tipo: "nivel",
    nivel: 2,
    descricao:
      "O seu zelo diante si mesmo é recompensador: sempre que você suceder em um teste de " +
      "resistência para evitar o efeito de um Feitiço, você recebe 1 ponto de energia amaldiçoada " +
      "temporário. A partir do nível 14 você passa a receber 2 pontos temporários, ao invés de 1.",
    requisitos: [],
  },

  /* ---------------- CONJURADOR · POR NÍVEL (4° nível) ----------------
     ⚠ Olhar Preciso vem DEPOIS de Preparação de Técnicas na lista do autor,
     quebrando a ordem alfabética (artefato das 2 colunas do PDF). Mantida a
     ordem que ele mandou, que é a regra do projeto. */
  {
    id: "cnj_ate_a_ultima_gota",
    nome: "Até a Última Gota",
    especializacaoId: "conjurador",
    tipo: "nivel",
    nivel: 4,
    descricao:
      "Você vai sempre utilizar até a última gota de energia amaldiçoada que houver em seu corpo. " +
      "Uma vez por descanso longo, caso esteja com menos da metade do seu máximo de energia " +
      "amaldiçoada, você pode usar uma ação comum para recuperar 1d4 + seu modificador de Int/Sab " +
      "em pontos de energia, aumentando em um dado a cada 5 níveis. Entretanto, é um processo " +
      "exaustivo, e você recebe um ponto de exaustão após usar essa habilidade.",
    requisitos: [],
  },
  {
    id: "cnj_ciclagem_maldita",
    nome: "Ciclagem Maldita",
    especializacaoId: "conjurador",
    tipo: "nivel",
    nivel: 4,
    descricao:
      "Alternar entre suas habilidades permite que você encaixe cada uma de maneira diferente, " +
      "beneficiando a ciclagem. Quando utilizar um Feitiço de dano diferente do último Feitiço que " +
      "você utilizou anteriormente, ele causa uma quantidade de dados de dano adicionais igual a " +
      "metade do seu bônus de treinamento.",
    requisitos: [],
  },
  {
    id: "cnj_determinacao_energizada",
    nome: "Determinação Energizada",
    especializacaoId: "conjurador",
    tipo: "nivel",
    nivel: 4,
    descricao:
      "A partir da energia, você consegue criar uma determinação superior para a sua mente, " +
      "acelerando-a ou reforçando-a. Quando fizer um teste de resistência de Astúcia ou de " +
      "Vontade, você pode pagar 1 ponto de energia amaldiçoada para receber vantagem no teste, " +
      "aumentando em +1PE para cada teste após o primeiro, na mesma rodada.",
    requisitos: [],
  },
  {
    id: "cnj_energia_focalizada",
    nome: "Energia Focalizada",
    especializacaoId: "conjurador",
    tipo: "nivel",
    nivel: 4,
    descricao:
      "Você foca a sua energia em algum aspecto do seu corpo, assim potencializando alguma " +
      "resistência sua. Você escolhe uma perícia de Teste de Resistência (Fortitude, Reflexos, " +
      "Astúcia e Vontade) para ter metade do seu modificador de Sabedoria ou Inteligência somado " +
      "a rolagens dela.",
    requisitos: [],
  },
  {
    id: "cnj_energia_inacabavel",
    nome: "Energia Inacabável",
    especializacaoId: "conjurador",
    tipo: "nivel",
    nivel: 4,
    descricao:
      "Você aumenta ainda mais a quantidade de energia amaldiçoada que você possui. Seu máximo de " +
      "energia amaldiçoada aumenta em um valor igual a metade do seu nível de Especialista em " +
      "Técnicas.",
    requisitos: [],
  },
  {
    id: "cnj_epifania_amaldicoada",
    nome: "Epifania Amaldiçoada",
    especializacaoId: "conjurador",
    tipo: "nivel",
    nivel: 4,
    descricao:
      "Ao desvendar mais da energia amaldiçoada, você obtém uma nova capacidade envolvendo-a. Ao " +
      "obter essa habilidade, você aprende uma Aptidão Amaldiçoada. No nível 12 você recebe outra " +
      "aptidão amaldiçoada.",
    // ⚠ CONCEDE Aptidão Amaldiçoada (1 no nível 4, outra no 12). Entra na
    // passada de efeitos, junto com as demais concessões de habilidade.
    requisitos: [],
  },
  {
    id: "cnj_explosao_defensiva",
    nome: "Explosão Defensiva",
    especializacaoId: "conjurador",
    tipo: "nivel",
    nivel: 4,
    descricao:
      "Reagindo a um ataque com uma grande explosão de energia amaldiçoada, você consegue reduzir " +
      "os danos dele. Como uma Reação, quando for atingido por um ataque corpo a corpo, você pode " +
      "gastar até uma quantidade de PE igual ao seu bônus de treinamento: para cada PE gasto, você " +
      "reduz o dano em 5 e empurra o atacante em 3 metros para longe de si.",
    requisitos: [{ tipo: "aptidao", id: "cobrir_se" }],
  },
  {
    id: "cnj_feitico_favorito",
    nome: "Feitiço Favorito",
    especializacaoId: "conjurador",
    tipo: "nivel",
    nivel: 4,
    descricao:
      "Um dos seus Feitiços é o seu favorito, sendo levado para um nível superior de maneira " +
      "natural. Ao obter esta habilidade, escolha um Feitiço: ele recebe uma Melhoria de Ritual " +
      "permanente, a qual não pode ser alterada após escolhida. A Melhoria concedida por esta " +
      "habilidade contabiliza como um efeito já aplicado ao realizar um ritual.",
    requisitos: [],
  },
  {
    id: "cnj_feiticos_refinados",
    nome: "Feitiços Refinados",
    especializacaoId: "conjurador",
    tipo: "nivel",
    nivel: 4,
    descricao:
      "Seus Feitiços como um todo são refinados pelo seu controle de energia, sendo mais difícil " +
      "resistir a eles. Você passa a somar metade do seu bônus de treinamento no cálculo de CD dos " +
      "seus Feitiços e Aptidões Amaldiçoadas.",
    requisitos: [],
  },
  {
    id: "cnj_movimentos_imprevisiveis",
    nome: "Movimentos Imprevisíveis",
    especializacaoId: "conjurador",
    tipo: "nivel",
    nivel: 4,
    descricao:
      "Você aprende a se mover de maneira imprevisível, dificultando tentativas de ataque contra " +
      "você. Você pode adicionar seu modificador de Inteligência ou de Sabedoria na sua Defesa, " +
      "limitado pelo seu nível.",
    requisitos: [],
  },
  {
    id: "cnj_naturalidade_com_rituais",
    nome: "Naturalidade com Rituais",
    especializacaoId: "conjurador",
    tipo: "nivel",
    nivel: 4,
    descricao:
      "Realizar rituais se torna algo mais natural para sua mente, permitindo-o colocar o " +
      "raciocínio acima da agilidade. Você pode utilizar Inteligência no lugar de Destreza em " +
      "testes de Prestidigitação para realizar rituais.",
    requisitos: [{ tipo: "nota", texto: "Treinado em Prestidigitação" }],
  },
  {
    id: "cnj_preparacao_de_tecnicas",
    nome: "Preparação de Técnicas",
    especializacaoId: "conjurador",
    tipo: "nivel",
    nivel: 4,
    descricao:
      "Você consegue preparar habilidades para assim economizar energia ao usá-las. Você pode " +
      "preparar dois Feitiços por descanso longo, para conjurar com custo reduzido pela metade, na " +
      "primeira vez que as usar. O nível do Feitiço deve ser um; no nível 5, você pode preparar " +
      "Feitiços de nível dois; no nível 12 você pode preparar Feitiços de nível três; no nível 16 " +
      "você pode preparar Feitiços de nível quatro e no nível 20 você pode preparar Feitiços de " +
      "nível cinco.",
    requisitos: [],
  },
  {
    id: "cnj_olhar_preciso",
    nome: "Olhar Preciso",
    especializacaoId: "conjurador",
    tipo: "nivel",
    nivel: 4,
    descricao:
      "Sua visão é precisa e, consequentemente, sua mira também. Você recebe um bônus de +2 em " +
      "rolagens de ataque para Feitiços e aptidões amaldiçoadas. A cada 4 níveis, esse bônus " +
      "aumenta em +1.",
    requisitos: [],
  },
  {
    id: "cnj_sacrificio_pela_energia",
    nome: "Sacrifício pela Energia",
    especializacaoId: "conjurador",
    tipo: "nivel",
    nivel: 4,
    descricao:
      "Você é capaz de até mesmo sacrificar a sua própria vida para conseguir mais energia " +
      "amaldiçoada, em casos de urgência. Você pode se infligir dano para recuperar energia " +
      "amaldiçoada. Para cada 6 de dano que você causar a si mesmo, você recupera 2 pontos de " +
      "energia amaldiçoada. Os pontos de vida perdidos por meio desta habilidade não podem ser " +
      "restaurados até o final do próximo descanso, e qualquer cura que fosse restaurar vida além " +
      "desse novo limite, é reduzida pela metade e transformada em pontos de vida temporários. " +
      "Caso cause dano a si mesmo igual ou superior a metade da sua vida máxima, você recebe 1 " +
      "ponto de exaustão.",
    requisitos: [],
  },
  {
    id: "cnj_versatilidade_em_fundamentos",
    nome: "Versatilidade em Fundamentos",
    especializacaoId: "conjurador",
    tipo: "nivel",
    nivel: 4,
    descricao:
      "Além de dominar, você também é versátil no que se diz os fundamentos das técnicas. Durante " +
      "um descanso curto, você pode alterar quais Mudanças de Fundamentos você possui, até um " +
      "limite de trocas igual a metade do seu bônus de treinamento. Em um descanso longo, este " +
      "limite de trocas se torna seu bônus de treinamento.",
    // Troca de escolha aninhada por descanso: é decisão de MESA, não de ficha
    // (a ficha já deixa trocar livremente). Fica como texto.
    requisitos: [],
  },

  /* ---------------- CONJURADOR · POR NÍVEL (6° nível) ---------------- */
  {
    id: "cnj_bastiao_interior",
    nome: "Bastião Interior",
    especializacaoId: "conjurador",
    tipo: "nivel",
    nivel: 6,
    descricao:
      "Com uma mente convicta e resistente, você transforma seu interior em um bastião. Você " +
      "recebe vantagem para resistir às condições amedrontado, desorientado e enfeitiçado.",
    requisitos: [{ tipo: "nota", texto: "Treinado em Vontade" }],
  },
  {
    id: "cnj_combate_amaldicoado",
    nome: "Combate Amaldiçoado",
    especializacaoId: "conjurador",
    tipo: "nivel",
    nivel: 6,
    descricao:
      "Ampliando no uso de armas corpo-a-corpo, você assume um estilo de combate amaldiçoado que a " +
      "incorpora no uso da sua energia. Todo ataque feito com uma arma com a qual você se tornou " +
      "treinado graças a Técnicas de Combate causa dano adicional igual ao seu bônus de " +
      "treinamento. Você pode também pode gastar 2 pontos de energia amaldiçoada para que a arma " +
      "em sua posse cause dano como se fosse um nível de dano acima durante todo o combate.",
    requisitos: [{ tipo: "habilidade", id: "cnj_tecnicas_de_combate" }],
  },
  {
    id: "cnj_correcao",
    nome: "Correção",
    especializacaoId: "conjurador",
    tipo: "nivel",
    nivel: 6,
    descricao:
      "Você consegue se corrigir caso esteja para perder o foco. Uma vez por rodada, quando você " +
      "for perder a concentração em um Feitiço, você pode gastar pontos de energia amaldiçoada " +
      "igual ao nível do Feitiço para evitar perder a concentração nele.",
    requisitos: [],
  },
  {
    id: "cnj_dominancia_em_feitico",
    nome: "Dominância em Feitiço",
    especializacaoId: "conjurador",
    tipo: "nivel",
    nivel: 6,
    descricao:
      "Você usa tanto um Feitiço da sua técnica que você passa a dominar ele completamente e " +
      "otimizar seu uso ao máximo. O custo de um Feitiço a sua escolha diminui em um valor igual a " +
      "metade do nível dele, arredondado para cima.",
    // ⚠ Arredonda para CIMA, exceção explícita à regra geral do Afty (floor).
    requisitos: [],
  },
  {
    id: "cnj_elevar_aptidao",
    nome: "Elevar Aptidão",
    especializacaoId: "conjurador",
    tipo: "nivel",
    nivel: 6,
    descricao:
      "Como um mestre em técnicas jujutsu no geral, você eleva seu nível em uma das aptidões. Ao " +
      "obter esta habilidade, você aumenta um dos seus Níveis de Aptidão em 1. Você pode pegar " +
      "esta habilidade uma quantidade de vezes igual ao seu bônus de treinamento.",
    // ⚠ REPETÍVEL (até BT vezes) e CONCEDE nível de trilha "à sua escolha",
    // logo é ORÇAMENTO, não concessão direcionada. Mesmo par de problemas de
    // Aptidões de Combate/Luta, com um limite que depende do BT.
    requisitos: [],
  },
  {
    id: "cnj_especializacao",
    nome: "Especialização",
    especializacaoId: "conjurador",
    tipo: "nivel",
    nivel: 6,
    descricao:
      "Você aprimora seus conhecimentos, tornando-se exímio em certas perícias. Ao obter esta " +
      "habilidade, você se torna mestre em 3 perícias nas quais você seja treinado, a sua escolha.",
    requisitos: [],
  },
  {
    id: "cnj_incapaz_de_falhar",
    nome: "Incapaz de Falhar",
    especializacaoId: "conjurador",
    tipo: "nivel",
    nivel: 6,
    descricao:
      "Sua maestria sobre as aptidões torna mais difícil falhar. Ao realizar uma rolagem de " +
      "aptidão amaldiçoada, exceto com Aptidões de Domínio, você pode gastar 2 pontos de energia " +
      "amaldiçoada para adicionar um valor igual ao seu modificador de Inteligência ou Sabedoria " +
      "no resultado. Você só pode utilizar esta habilidade uma vez por Aptidão usada na rodada.",
    requisitos: [],
  },
  {
    id: "cnj_mente_repartida",
    nome: "Mente Repartida",
    especializacaoId: "conjurador",
    tipo: "nivel",
    nivel: 6,
    descricao:
      "Você é capaz de repartir sua mente em duas seções. Você pode se manter concentrando em duas " +
      "fontes diferentes simultaneamente.",
    requisitos: [],
  },
  {
    id: "cnj_nivel_perfeito",
    nome: "Nível Perfeito",
    especializacaoId: "conjurador",
    tipo: "nivel",
    nivel: 6,
    descricao:
      "Você escolhe um nicho de feitiços para ser aprimorada. Todos os seus Feitiços de um nível a " +
      "sua escolha têm a CD de resistência aumentada em 2. Nos níveis 12 e 18 você pode escolher " +
      "outro nível de Feitiço para ter a CD aumentada em 2.",
    requisitos: [],
  },
  {
    id: "cnj_passo_rapido",
    nome: "Passo Rápido",
    especializacaoId: "conjurador",
    tipo: "nivel",
    nivel: 6,
    descricao:
      "Você se move agilmente, preparado para se afastar caso necessário. Quando um inimigo se " +
      "aproxima de você e você entra no alcance corpo a corpo dele, você pode, como uma reação, " +
      "afastar-se em uma distância igual a metade do seu movimento. Tal movimento não permite um " +
      "ataque de oportunidade.",
    requisitos: [],
  },
  {
    id: "cnj_potencia_concentrada",
    nome: "Potência Concentrada",
    especializacaoId: "conjurador",
    tipo: "nivel",
    nivel: 6,
    descricao:
      "Quando for disparar uma manifestação de sua técnica, você é capaz de se preparar e " +
      "concentrar para aumentar o poder. Uma vez por rodada, você pode gastar uma Ação de " +
      "Movimento para fazer com que seu próximo Feitiço de dano com alvo único cause dano " +
      "adicional igual a 5 multiplicado pelo nível do Feitiço.",
    requisitos: [],
  },
  {
    id: "cnj_ritualista",
    nome: "Ritualista",
    especializacaoId: "conjurador",
    tipo: "nivel",
    nivel: 6,
    descricao:
      "Você é familiar com a aplicação de rituais em suas conjurações, conseguindo ampliar a " +
      "capacidade deles. Você recebe um bônus de +2 em testes para realizar Conjuração em Ritual " +
      "e, uma quantidade de vezes igual a metade do seu bônus de treinamento, por Descanso Longo, " +
      "você pode optar por colocar 1 melhoria adicional nela.",
    requisitos: [],
  },

  /* ---------------- CONJURADOR · POR NÍVEL (8° nível) ---------------- */
  {
    id: "cnj_expansao_dos_fundamentos",
    nome: "Expansão dos Fundamentos",
    especializacaoId: "conjurador",
    tipo: "nivel",
    nivel: 8,
    descricao:
      "Você expande seu domínio sobre os fundamentos, versando-se em novas maneiras de modificar " +
      "as técnicas. Ao obter esta habilidade, você aprende mais uma Mudança de Fundamento. No " +
      "nível 12, você aprende outro adicional.",
    // Concede +1 escolha do MESMO pool de Mudanças de Fundamento, nos níveis 8
    // e 12. A escolha aninhada é exibida sob Domínio dos Fundamentos; aqui é
    // só a concessão extra, a somar quando a passada de efeitos existir.
    requisitos: [],
  },
  {
    id: "cnj_fisico_amaldicoado_defensivo",
    nome: "Físico Amaldiçoado Defensivo",
    especializacaoId: "conjurador",
    tipo: "nivel",
    nivel: 8,
    descricao:
      "Reconhecendo o potencial da energia amaldiçoada para o proteger, você foca nessas " +
      "aplicações, tornando-se mais capaz de resistir. A quantidade de PEs que você pode gastar " +
      "com a aptidão Cobrir-se aumenta em 2. Caso possua Cobertura Avançada, aumenta em +1.",
    requisitos: [{ tipo: "aptidao", id: "cobrir_se" }],
  },
  {
    id: "cnj_imbuir_com_tecnica",
    nome: "Imbuir com Técnica",
    especializacaoId: "conjurador",
    tipo: "nivel",
    nivel: 8,
    descricao:
      "Você se torna capaz de imbuir armas com a sua própria técnica, potencializando-as " +
      "grandemente. Quando for utilizar um Feitiço de dano, que não seja de um tipo especial ou em " +
      "área, você pode, como uma Ação Bônus, gastar 2 PE adicionais para a imbuir em uma arma que " +
      "esteja manejando, desde que seja treinado com a arma e o Feitiço seja uma Ação Comum ou " +
      "inferior. Se acertar o ataque, além de causar dano, você causa o efeito do Feitiço, como " +
      "após ataque. Caso o Feitiço seja de TR, não será necessário um teste para efeito, " +
      "aplicando-o diretamente, com exceção de Condições, que ainda irão exigir um TR.",
    requisitos: [{ tipo: "habilidade", id: "cnj_combate_amaldicoado" }],
  },
  {
    id: "cnj_liberacoes_expandidas",
    nome: "Liberações Expandidas",
    especializacaoId: "conjurador",
    tipo: "nivel",
    nivel: 8,
    descricao:
      "Você encontra maneiras de ter um repertório de liberações máximas maior. Ao obter esta " +
      "habilidade, você recebe uma Liberação Máxima adicional. Nos níveis 12 e 16 você recebe mais " +
      "uma liberação máxima.",
    requisitos: [],
  },
  {
    id: "cnj_mira_aperfeicoada",
    nome: "Mira Aperfeiçoada",
    especializacaoId: "conjurador",
    tipo: "nivel",
    nivel: 8,
    descricao:
      "Sua mira para feitiços é mais afiada, permitindo-o acertar com maior precisão diante " +
      "preparo. Você pode utilizar Mirar para jogadas de ataque amaldiçoado e recebe a Mudança de " +
      "Fundamento Técnica Precisa. Caso já possua Técnica Precisa, o bônus conferido por ela " +
      "aumenta em +1.",
    // ⚠ "Técnica Precisa" NÃO existe no pool: a Mudança de Fundamento
    // equivalente se chama "Feitiço Preciso". Inconsistência do livro,
    // transcrita verbatim. CONFIRMAR com o autor se são a mesma.
    requisitos: [{ tipo: "habilidade", id: "cnj_olhar_preciso" }],
  },
  {
    id: "cnj_primeiro_disparo",
    nome: "Primeiro Disparo",
    especializacaoId: "conjurador",
    tipo: "nivel",
    nivel: 8,
    descricao:
      "Quando um combate se inicia, você é o primeiro a disparar. Durante a rolagem da iniciativa, " +
      "você pode usar uma habilidade cujo custo de tempo seja Ação Bônus ou Ação Livre.",
    requisitos: [{ tipo: "nota", texto: "Treinado em Reflexos" }],
  },
  {
    id: "cnj_revestimento_constante",
    nome: "Revestimento Constante",
    especializacaoId: "conjurador",
    tipo: "nivel",
    nivel: 8,
    descricao:
      "Seu corpo está constantemente revestido com a sua energia amaldiçoada. Você recebe redução " +
      "de dano contra todos os tipos, exceto na alma, igual ao seu bônus de treinamento.",
    requisitos: [{ tipo: "aptidao", id: "cobrir_se" }],
  },
  {
    id: "cnj_sustentacao_avancada",
    nome: "Sustentação Avançada",
    especializacaoId: "conjurador",
    tipo: "nivel",
    nivel: 8,
    descricao:
      "Seu corpo agora é capaz de dividir a liberação de energia entre dois feitiços diferentes. " +
      "Você pode manter um feitiço sustentado adicional e, no começo do combate, pode ativar um " +
      "feitiço sustentado à sua escolha como Ação Livre, desde que ele possua um custo de Ação " +
      "Bônus ou inferior.",
    requisitos: [],
  },

  /* ---------------- CONJURADOR · POR NÍVEL (10° nível) ---------------- */
  {
    id: "cnj_destruicao_ampla",
    nome: "Destruição Ampla",
    especializacaoId: "conjurador",
    tipo: "nivel",
    nivel: 10,
    descricao:
      "Quanto mais você conseguir abranger em sua conjuração, mais você é capaz de destruir. " +
      "Quando utilizar um Feitiço em área, ela causa 5 de dano adicional para cada criatura além " +
      "da primeira que estiver sendo afetada por ela.",
    requisitos: [],
  },
  {
    id: "cnj_destruicao_focada",
    nome: "Destruição Focada",
    especializacaoId: "conjurador",
    tipo: "nivel",
    nivel: 10,
    descricao:
      "Ao invés de espalhar a destruição, você a foca em um único ponto ou criatura. Quando " +
      "utilizar um Feitiço de dano de alvo único, ela ignora RD igual ao seu Modificador de " +
      "Inteligência ou Sabedoria e tem seu dano aumentado em uma quantidade de dados igual a " +
      "metade do seu bônus de treinamento.",
    requisitos: [],
  },
  {
    id: "cnj_economia_de_energia_avancada",
    nome: "Economia de Energia Avançada",
    especializacaoId: "conjurador",
    tipo: "nivel",
    nivel: 10,
    descricao:
      "Sua economia reserva se torna ainda maior, expandindo seu estoque. Os dados da energia " +
      "colocada na economia aumentam para d6 em um descanso curto e d8 em um descanso longo. " +
      "Colocar energia da economia no estoque atual agora é uma ação bônus.",
    requisitos: [{ tipo: "habilidade", id: "cnj_economia_de_energia" }],
  },
  {
    id: "cnj_sentidos_agucados",
    nome: "Sentidos Aguçados",
    especializacaoId: "conjurador",
    tipo: "nivel",
    nivel: 10,
    descricao:
      "O domínio sobre a energia aguça seus sentidos ao limite, transformando-o em alguém que não " +
      "deixa nenhum detalhe escapar, nem mesmo nos mínimos movimentos e mudanças. Sua atenção " +
      "aumenta em um valor igual a metade do seu bônus de Inteligência ou Sabedoria, e você " +
      "adiciona o mesmo bônus a rolagens de Percepção. Além disso, você pode gastar 2 pontos de " +
      "energia para, ao estar no ar, se manter estável nele, de pé, usando dos seus sentidos para " +
      "perceber o ar como uma plataforma.",
    requisitos: [{ tipo: "nota", texto: "Mestre em Percepção" }],
  },

  /* ---------------- CONJURADOR · POR NÍVEL (12° nível) ---------------- */
  {
    id: "cnj_esgrimista_jujutsu",
    nome: "Esgrimista Jujutsu",
    especializacaoId: "conjurador",
    tipo: "nivel",
    nivel: 12,
    descricao:
      "Mesclando técnicas de combate e feitiçaria ao máximo, você se torna digno de ser visto como " +
      "um esgrimista jujutsu. Quando utilizar Combate Amaldiçoado, você pode também utilizar um " +
      "Feitiço Auxiliar tendo você mesmo como alvo, desde que seu custo padrão seja uma Ação Bônus.",
    requisitos: [{ tipo: "habilidade", id: "cnj_combate_amaldicoado" }],
  },
  {
    id: "cnj_expansao_maestral",
    nome: "Expansão Maestral",
    especializacaoId: "conjurador",
    tipo: "nivel",
    nivel: 12,
    descricao:
      "Você pode utilizar expansões de domínio possuindo apenas uma mão livre e ataques a " +
      "distância não causam ataques de oportunidade contra você enquanto expandindo.",
    requisitos: [{ tipo: "aptidao", id: "expansao_de_dominio_completa" }],
  },
  {
    id: "cnj_explosao_maxima",
    nome: "Explosão Máxima",
    especializacaoId: "conjurador",
    tipo: "nivel",
    nivel: 12,
    descricao:
      "O potencial de aumento para o poder destrutivo de suas técnicas é ainda maior, levando-o ao " +
      "máximo. Para cada resultado máximo que conseguir, além de rolar um dado adicional, você " +
      "soma +4 ao total de dano.",
    requisitos: [{ tipo: "habilidade", id: "cnj_explosao_encadeada" }],
  },
  {
    id: "cnj_mestre_das_aptidoes",
    nome: "Mestre das Aptidões",
    especializacaoId: "conjurador",
    tipo: "nivel",
    nivel: 12,
    descricao:
      "Você é um mestre no uso das aptidões amaldiçoadas, conseguindo reservar um pouco do seu " +
      "potencial para elas. No começo de toda rodada, você recebe PE temporários igual a metade do " +
      "seu Bônus de Treinamento, os quais podem ser utilizados exclusivamente no uso de Aptidões " +
      "Amaldiçoadas. Estes pontos não podem acumular, mas são contabilizados separadamente de " +
      "outros PEs temporários.",
    requisitos: [],
  },
  {
    id: "cnj_versatilidade_ampliada",
    nome: "Versatilidade Ampliada",
    especializacaoId: "conjurador",
    tipo: "nivel",
    nivel: 12,
    descricao:
      "Ser versátil no uso dos próprios feitiços é uma grande vantagem, e você decide investir " +
      "nela. Todos seus Feitiços recebem 1 variação de liberação e você pode escolher um deles " +
      "para ter uma variação de cada nível que você possua acesso.",
    requisitos: [],
  },

  /* ---------------- CONJURADOR · POR NÍVEL (16° nível) ---------------- */
  {
    id: "cnj_manipulacao_perfeita",
    nome: "Manipulação Perfeita",
    especializacaoId: "conjurador",
    tipo: "nivel",
    nivel: 16,
    descricao:
      "Seu conhecimento sobre a manipulação de energia é melhorado, permitindo que você escolha " +
      "uma quantidade de Feitiços igual ao seu bônus de treinamento para terem seu custo reduzido " +
      "em um valor igual a metade dele.",
    // ⚠ O livro escreve "[Pré-Requisito: Dominância em Habilidade]", mas a
    // habilidade de 6° se chama "Dominância em Feitiço". Apontado para ela.
    requisitos: [{ tipo: "habilidade", id: "cnj_dominancia_em_feitico" }],
  },
  {
    id: "cnj_sustentacao_mestre",
    nome: "Sustentação Mestre",
    especializacaoId: "conjurador",
    tipo: "nivel",
    nivel: 16,
    descricao:
      "Com o passar do tempo, você descobriu novas formas de como dispersar energia pelo seu " +
      "corpo, conseguindo sustentar mais feitiços e com maior eficiência. Você pode manter três " +
      "feitiços sustentados ao invés de dois. Além disso, seu custo para sustentar feitiços é " +
      "diminuído em 1, com um mínimo de 1.",
    requisitos: [{ tipo: "habilidade", id: "cnj_sustentacao_avancada" }],
  },

  /* ================= SUPORTE · BASE =================
     Base nos níveis 1, 3, 5, 6, 8, 9, 10 e 20. É a única especialização cujas
     Bases incluem CONCESSÕES puras (as duas aptidões de Energia Reversa) e a
     única com um grupo de 14° nível. */
  {
    id: "sup_suporte_em_combate",
    nome: "Suporte em Combate",
    especializacaoId: "suporte",
    tipo: "base",
    nivel: 1,
    descricao:
      "Um suporte dispõe de um leque de capacidades que o permite auxiliar dentro do combate:\n\n" +
      "• Você pode usar Apoiar como uma ação bônus.\n" +
      "• Você pode, como uma ação bônus, curar uma criatura em alcance de toque em um valor igual " +
      "a 2d6 + seu modificador de Presença ou Sabedoria, uma quantidade de vezes igual ao seu " +
      "modificador de Presença ou Sabedoria, por descanso curto ou longo. No nível 4, essa cura se " +
      "torna 2d12, no nível 8, se torna 3d12, no nível 12 se torna 6d8, no nível 16 se torna 6d10.",
    requisitos: [],
  },
  {
    id: "sup_presenca_inspiradora",
    nome: "Presença Inspiradora",
    especializacaoId: "suporte",
    tipo: "base",
    nivel: 3,
    descricao:
      "Sua presença inspira aqueles ao seu redor a tentarem seu máximo. Você pode pagar 2 pontos " +
      "de energia amaldiçoada para fazer com que, durante uma cena, todo aliado dentro de 9 metros " +
      "de você fique inspirado. Um aliado inspirado recebe um bônus de +1 em toda rolagem de " +
      "perícia. Ao utilizar esta habilidade, você pode gastar uma quantidade de PE adicional igual " +
      "a metade do seu modificador de Presença, aumentando o bônus em +1 para cada PE gasto dessa " +
      "maneira.",
    requisitos: [],
  },
  {
    id: "sup_versatilidade",
    nome: "Versatilidade",
    especializacaoId: "suporte",
    tipo: "base",
    nivel: 5,
    descricao:
      "Sempre que realizar uma rolagem com uma perícia na qual você não seja treinado, você pode " +
      "pagar 1 ponto de energia amaldiçoada para considerar como se fosse treinado. Você pode " +
      "utilizar esta habilidade uma quantidade de vezes igual ao seu modificador de Sabedoria, por " +
      "descanso curto ou longo.",
    requisitos: [],
  },
  {
    id: "sup_energia_reversa",
    nome: "Energia Reversa",
    especializacaoId: "suporte",
    tipo: "base",
    nivel: 6,
    // ⚠ NÃO TEM NOME NO LIVRO: o texto é só "No nível 6, você recebe a aptidão
    // amaldiçoada 'Energia Reversa'". Batizada com o nome do que concede.
    // É CONCESSÃO DIRECIONADA (a regra NOMEIA o alvo), logo deveria ser
    // GRÁTIS, mas no Afty toda Base gasta orçamento. CONFIRMAR com o autor se
    // esta e a de 8° custam vaga ou vêm de graça.
    descricao: "No nível 6, você recebe a aptidão amaldiçoada “Energia Reversa”.",
    requisitos: [],
  },
  {
    id: "sup_liberacao_de_energia_reversa",
    nome: "Liberação de Energia Reversa",
    especializacaoId: "suporte",
    tipo: "base",
    nivel: 8,
    descricao: "No nível 8, você recebe a aptidão amaldiçoada “Liberação de Energia Reversa”.",
    requisitos: [],
  },
  {
    id: "sup_teste_de_resistencia_mestre",
    nome: "Teste de Resistência Mestre",
    especializacaoId: "suporte",
    tipo: "base",
    nivel: 9,
    descricao:
      "Você se torna treinado em um segundo teste de resistência e mestre no concedido pela sua " +
      "especialização.",
    requisitos: [],
  },
  {
    id: "sup_medicina_infalivel",
    nome: "Medicina Infalível",
    especializacaoId: "suporte",
    tipo: "base",
    nivel: 10,
    descricao:
      "Você consegue dominar seus conhecimentos médicos e auxiliares ao ponto de elevá-los para um " +
      "patamar superior. Uma quantidade de vezes igual a metade do seu nível de Suporte + bônus de " +
      "treinamento, você pode, quando realizar uma rolagem para curar uma criatura, maximizar o " +
      "valor de um dos dados dessa cura; você pode gastar vários usos para maximizar mais de um " +
      "dado da mesma cura. Você recupera os usos após um descanso curto ou longo. Além disso, você " +
      "soma o seu bônus de treinamento no total de toda cura que realizar.",
    requisitos: [],
  },
  {
    id: "sup_suporte_absoluto",
    nome: "Suporte Absoluto",
    especializacaoId: "suporte",
    tipo: "base",
    nivel: 20,
    descricao:
      "Você é o suporte absoluto que se pode ter em campo, mudando o rumo da batalha para todos " +
      "seus aliados. Uma vez por rodada, você pode utilizar Apoiar como uma Ação Livre. Além " +
      "disso, sua quantidade de usos da habilidade Suporte em Combate são dobrados e você soma seu " +
      "modificador de atributo escolhido para CD de especialização em toda cura que realizar.",
    requisitos: [],
  },

  /* ---------------- SUPORTE · POR NÍVEL (2° nível) ----------------
     ⚠ Conceder Outra Chance vem ANTES de Comando Motivador na lista do autor,
     quebrando a ordem alfabética. Mantida a ordem que ele mandou. */
  {
    id: "sup_amizade_inquebravel",
    nome: "Amizade Inquebrável",
    especializacaoId: "suporte",
    tipo: "nivel",
    nivel: 2,
    descricao:
      "Escolha um Aliado Jogador. Este aliado é considerado permanentemente seu “Amigo”. Ao " +
      "terminar seu turno ao lado de seu Amigo, você pode como ação livre realizar a Ação “Apoiar” " +
      "no mesmo. Caso o Amigo morra, você só pode escolher outro amigo no próximo interlúdio.",
    requisitos: [],
  },
  {
    id: "sup_analise_profunda",
    nome: "Análise Profunda",
    especializacaoId: "suporte",
    tipo: "nivel",
    nivel: 2,
    descricao:
      "Você consegue analisar profundamente um inimigo, deduzindo aspectos dele. Você pode gastar " +
      "1 ponto de energia amaldiçoada para, como uma ação comum, analisar uma criatura, realizando " +
      "uma rolagem de Percepção com CD igual a 15 + ND da criatura. Caso você suceda, você " +
      "descobre uma característica dela (pontos de vida, bônus em perícia ou ataque, por exemplo). " +
      "Para cada 5 pontos excedentes no resultado do teste, você descobre uma característica " +
      "adicional. Você só pode usar essa habilidade uma vez em cada criatura, por cena.",
    requisitos: [],
  },
  {
    id: "sup_apoio_avancado",
    nome: "Apoio Avançado",
    especializacaoId: "suporte",
    tipo: "nivel",
    nivel: 2,
    descricao:
      "Ao utilizar a ação de Apoiar, você pode fortalecer seu apoio com um efeito à sua escolha, " +
      "com as possibilidades listadas no final da especialização.\n\n" +
      "Você recebe acesso a um novo apoio avançado nos níveis 6 e 12.",
    // Escolha aninhada: 1 ao obter (nível 2), mais uma no 6 e outra no 12.
    // Apoios Versáteis (4°) concede mais, do mesmo pool.
    escolha: {
      id: "apoio_avancado",
      label: "Apoio Avançado",
      niveis: [2, 6, 12],
      opcoes: APOIOS_AVANCADOS,
    },
    requisitos: [],
  },
  {
    id: "sup_conceder_outra_chance",
    nome: "Conceder Outra Chance",
    especializacaoId: "suporte",
    tipo: "nivel",
    nivel: 2,
    descricao:
      "Você pode conceder a um aliado outra chance em um teste no qual ele falhou. Ao ver um " +
      "aliado dentro de 6 metros falhar em um teste, você pode gastar 3 pontos de energia " +
      "amaldiçoada para fazer com que ele role novamente, ficando com o melhor resultado. Você " +
      "pode utilizar essa habilidade uma quantidade de vezes igual ao seu bônus de treinamento, " +
      "por descanso longo; em um descanso curto, você recupera metade dos usos.",
    requisitos: [],
  },
  {
    id: "sup_comando_motivador",
    nome: "Comando Motivador",
    especializacaoId: "suporte",
    tipo: "nivel",
    nivel: 2,
    descricao:
      "Sua presença é motivadora, e o mesmo vale para um comando dado por você. Como uma ação " +
      "livre, você pode falar um comando para um aliado e gastar 2 pontos de energia amaldiçoada " +
      "para que, quando o aliado realize a ação comandada, ele receba um bônus igual ao seu bônus " +
      "de treinamento na rolagem usada na ação.",
    requisitos: [],
  },
  {
    id: "sup_desvendar_terreno",
    nome: "Desvendar Terreno",
    especializacaoId: "suporte",
    tipo: "nivel",
    nivel: 2,
    descricao:
      "Você consegue compreender e destrinchar o ambiente ao seu redor, encontrando pontos de " +
      "vantagem no terreno. Como uma Ação de Movimento, realize um teste de Percepção com CD " +
      "definida pelo Narrador e, caso suceda, você percebe pontos estratégicos sobre ele (como " +
      "coberturas, terrenos difíceis e outros) e, até o final da cena, recebe um bônus igual ao seu " +
      "bônus de treinamento em testes de Percepção que envolvam procurar e encontrar coisas ou " +
      "pessoas no terreno analisado.",
    requisitos: [],
  },
  {
    id: "sup_expandir_repertorio",
    nome: "Expandir Repertório",
    especializacaoId: "suporte",
    tipo: "nivel",
    nivel: 2,
    descricao:
      "Estudando para se tornar mais versátil, você consegue dominar outros campos de estudos. " +
      "Você se torna treinado em uma quantidade de perícias igual a metade do seu bônus de " +
      "treinamento. Você recebe também um bônus de +2 em uma perícia qualquer.",
    requisitos: [],
  },
  {
    id: "sup_mobilidade_avancada",
    nome: "Mobilidade Avançada",
    especializacaoId: "suporte",
    tipo: "nivel",
    nivel: 2,
    descricao:
      "Em prol de alcançar mais rapidamente o lugar onde seu suporte é requisitado você recebe um " +
      "bônus de +3 metros em seu movimento. Além disso, caso um aliado caia nas portas da morte, " +
      "você pode, como uma reação, mover-se metade do seu movimento na direção dele.",
    requisitos: [],
  },
  {
    id: "sup_otimizacao_de_espaco",
    nome: "Otimização de Espaço",
    especializacaoId: "suporte",
    tipo: "nivel",
    nivel: 2,
    descricao:
      "Você organiza melhor o seu inventário e o seu espaço. Você recebe espaços de item " +
      "adicionais no seu inventário, em um valor igual ao seu bônus de treinamento.",
    // Espaços de inventário: o sistema de Inventário não existe.
    requisitos: [],
  },
  {
    id: "sup_pronto_para_agir",
    nome: "Pronto para Agir",
    especializacaoId: "suporte",
    tipo: "nivel",
    nivel: 2,
    descricao:
      "Você adiciona seu modificador de Presença a Iniciativa. Além disso, seus aliados recebem um " +
      "bônus igual a metade do modificador.",
    requisitos: [],
  },
  {
    id: "sup_protetor",
    nome: "Protetor",
    especializacaoId: "suporte",
    tipo: "nivel",
    nivel: 2,
    descricao:
      "Quando um aliado dentro de 1,5m de você é atacado, você pode gastar 1 PE para, como uma " +
      "Ação Livre, diminuir o dano causado no ataque feito contra ele em Xd10 + seu modificador de " +
      "Presença ou sabedoria, onde X é igual ao seu bônus de treinamento. É necessário estar com " +
      "um escudo equipado para utilizar esta habilidade.",
    requisitos: [],
  },
  {
    id: "sup_tecnicas_de_combate",
    nome: "Técnicas de Combate",
    especializacaoId: "suporte",
    tipo: "nivel",
    nivel: 2,
    descricao:
      "Você decide se versar em técnicas essenciais de combate, em busca de conseguir se defender " +
      "em casos extremos. Você pode escolher duas armas quaisquer para se tornar treinado, caso " +
      "não seja, e para poder utilizar Presença ou Sabedoria nas jogadas de ataque e dano enquanto " +
      "as manejando.",
    // Mesmo nome da homônima do Conjurador, com atributos diferentes
    // (Presença/Sabedoria aqui, Inteligência/Sabedoria lá). Por isso o prefixo.
    requisitos: [],
  },
  {
    id: "sup_transmitir_conhecimento",
    nome: "Transmitir Conhecimento",
    especializacaoId: "suporte",
    tipo: "nivel",
    nivel: 2,
    descricao:
      "Durante um descanso, você pode transmitir conhecimento para seus aliados, preparando-os. " +
      "Durante um descanso curto, você pode conceder treinamento temporário em perícias com as " +
      "quais você seja treinado para seus aliados, com um limite igual a metade do seu bônus de " +
      "treinamento. Durante um descanso longo, essa quantidade é igual a bônus de treinamento.",
    requisitos: [],
  },

  /* ---------------- SUPORTE · POR NÍVEL (4° nível) ---------------- */
  {
    id: "sup_apoios_versateis",
    nome: "Apoios Versáteis",
    especializacaoId: "suporte",
    tipo: "nivel",
    nivel: 4,
    descricao:
      "Ao obter esta habilidade, você aprende um apoio avançado adicional. No 10° nível você " +
      "recebe outro apoio avançado.",
    // Concede +1 escolha do MESMO pool de Apoios Avançados, nos níveis 4 e 10.
    // A escolha aninhada é exibida sob Apoio Avançado; aqui é só a concessão
    // extra, a somar quando a passada de efeitos existir.
    requisitos: [{ tipo: "habilidade", id: "sup_apoio_avancado" }],
  },
  {
    id: "sup_guarda_sincronizada",
    nome: "Guarda Sincronizada",
    especializacaoId: "suporte",
    tipo: "nivel",
    nivel: 4,
    descricao:
      "Um cuida do outro e, mantendo essa mentalidade, você consegue estabelecer uma guarda em " +
      "sintonia com seus aliados próximos. Você pode utilizar uma Ação Bônus para sintonizar a " +
      "guarda de todos seus aliados dentro de 7,5 metros que possam te ver ou ouvir: para cada " +
      "aliado dentro do alcance, todos os outros recebem +1 na Defesa.",
    requisitos: [],
  },
  {
    id: "sup_inspirar_aliados",
    nome: "Inspirar Aliados",
    especializacaoId: "suporte",
    tipo: "nivel",
    nivel: 4,
    descricao:
      "Você sabe como dar a inspiração necessária para os seus aliados. Uma vez por cena, você " +
      "pode gastar 1 ponto de energia amaldiçoada e usar sua ação bônus para inspirar uma " +
      "quantidade de aliados igual a metade do seu bônus de treinamento. Uma quantidade de vezes " +
      "igual ao seu modificador de presença ou sabedoria, dentro de 10 minutos, esses aliados " +
      "podem escolher adicionar 2d3 em uma jogada de ataque, teste de habilidade ou teste de " +
      "resistência, mas apenas uma vez por teste.",
    requisitos: [],
  },
  {
    id: "sup_intervencao",
    nome: "Intervenção",
    especializacaoId: "suporte",
    tipo: "nivel",
    nivel: 4,
    descricao:
      "Intervindo rapidamente para impedir uma aflição pior, você é capaz de remover condições " +
      "antes que elas se acentuem. Como uma Ação Comum, você pode gastar 3 PE para encerrar uma " +
      "condição fraca afetando um aliado dentro de alcance de toque. Nos níveis 6, 12 e 18 você se " +
      "torna capaz de encerrar condições médias, fortes e extremas respectivamente, com o custo em " +
      "PE aumentando em 3 para cada nível superior a fraca.",
    requisitos: [],
  },
  {
    id: "sup_negacao_critica",
    nome: "Negação Crítica",
    especializacaoId: "suporte",
    tipo: "nivel",
    nivel: 4,
    descricao:
      "Você é capaz de negar uma falha crítica dos seus aliados, impedindo o pior de acontecer. " +
      "Uma quantidade de vezes igual a 1 + metade do seu bônus de treinamento, por cena, você pode " +
      "pagar 3 PE para negar uma falha crítica que você possa ver dentro de 12 metros.",
    requisitos: [],
  },
  {
    id: "sup_no_ultimo_segundo",
    nome: "No Último Segundo",
    especializacaoId: "suporte",
    tipo: "nivel",
    nivel: 4,
    descricao:
      "Ao iniciar uma rodada com um ou mais aliados com 2 fracassos nos testes da porta da morte, " +
      "aumente sua iniciativa atual em combate em +5. Caso você aja primeiro que um dos seus " +
      "aliados nas portas da morte por causa deste bônus de iniciativa, você anula terreno " +
      "difícil, tem seu movimento aumentado em 4,5m e recebe +5 de Defesa contra Ataques de " +
      "Oportunidade durante a rodada.",
    requisitos: [],
  },
  {
    id: "sup_pre_analise",
    nome: "Pré-Análise",
    especializacaoId: "suporte",
    tipo: "nivel",
    nivel: 4,
    descricao:
      "Você inconscientemente analisa o território a sua volta, sendo assim você não pode ser " +
      "surpreendido e seu valor de atenção recebe um bônus de +5. Você pode escolher um aliado " +
      "para não ser surpreendido.",
    requisitos: [{ tipo: "nota", texto: "Treinado em Percepção" }],
  },
  {
    id: "sup_recompensa_pelo_sucesso",
    nome: "Recompensa pelo Sucesso",
    especializacaoId: "suporte",
    tipo: "nivel",
    nivel: 4,
    descricao:
      "Você recompensa aqueles que você comanda, com um sucesso mais difícil sendo extremamente " +
      "gratificante. Ao utilizar Comando Motivador, você pode escolher reduzir o bônus fornecido " +
      "por ela pela metade e, caso o aliado motivado ainda assim consiga suceder, ele ganha 2 PE.",
    requisitos: [{ tipo: "habilidade", id: "sup_comando_motivador" }],
  },
  {
    id: "sup_sintonizacao_vital",
    nome: "Sintonização Vital",
    especializacaoId: "suporte",
    tipo: "nivel",
    nivel: 4,
    descricao:
      "Quando curar um aliado, você pode gastar 3 pontos de energia amaldiçoada para que outra " +
      "criatura dentro de 3 metros (incluindo você) recupere uma quantidade de pontos de vida " +
      "igual a metade da cura original.",
    requisitos: [],
  },

  /* ---------------- SUPORTE · POR NÍVEL (6° nível) ---------------- */
  {
    id: "sup_contra_ataque",
    nome: "Contra-Ataque",
    especializacaoId: "suporte",
    tipo: "nivel",
    nivel: 6,
    descricao:
      "Uma quantidade de vezes igual ao dobro do seu modificador de Presença ou Sabedoria, por " +
      "descanso curto ou longo, você pode, como uma reação, gastar 1 ponto de energia amaldiçoada " +
      "para aumentar a Defesa de um aliado em um valor igual ao seu bônus de treinamento e, se " +
      "você fizer com que um ataque que iria acertar se torne um erro, você ou o aliado protegido " +
      "podem pagar 1 ponto de energia amaldiçoada para realizar um ataque contra o inimigo.",
    requisitos: [],
  },
  {
    id: "sup_cura_avancada_em_grupo",
    nome: "Cura Avançada em Grupo",
    especializacaoId: "suporte",
    tipo: "nivel",
    nivel: 6,
    descricao:
      "Você pode usar sua habilidade de cura em grupo: quando a utilizar em um alvo, você pode " +
      "pagar 2 pontos de energia amaldiçoada para curar mais um alvo, com um limite igual ao seu " +
      "bônus de treinamento.",
    requisitos: [],
  },
  {
    id: "sup_devolver_na_mesma_moeda",
    nome: "Devolver na Mesma Moeda",
    especializacaoId: "suporte",
    tipo: "nivel",
    nivel: 6,
    descricao:
      "Quando um aliado que você possa ver é afetado por uma condição, você pode gastar 2 PE para, " +
      "como uma Ação Livre, fazer com que o próximo teste de resistência realizado por um inimigo " +
      "para evitar uma condição do aliado possua desvantagem.",
    requisitos: [],
  },
  {
    id: "sup_disseminar_cura",
    nome: "Disseminar Cura",
    especializacaoId: "suporte",
    tipo: "nivel",
    nivel: 6,
    descricao:
      "Ao utilizar um Feitiço de cura, você pode escolher um alvo adicional, gastando uma " +
      "quantidade de PE igual ao nível da técnica adicional.",
    requisitos: [],
  },
  {
    id: "sup_incitar_vigor",
    nome: "Incitar Vigor",
    especializacaoId: "suporte",
    tipo: "nivel",
    nivel: 6,
    descricao:
      "Você é capaz de utilizar de processos para incitar o vigor em uma criatura, puxando de seu " +
      "potencial latente. Como uma ação bônus, você pode gastar 3 pontos de energia para fazer com " +
      "que uma criatura a alcance de toque possa gastar seus dados de vida para se curar.",
    requisitos: [],
  },
  {
    id: "sup_inimigo_comum",
    nome: "Inimigo Comum",
    especializacaoId: "suporte",
    tipo: "nivel",
    nivel: 6,
    descricao:
      "Você pode gastar 2 pontos de energia amaldiçoada para, como uma ação bônus, escolher um " +
      "inimigo comum entre uma quantidade de pessoas igual ao seu modificador de Presença ou " +
      "sabedoria. Sempre que uma pessoa atacar o inimigo em comum, adiciona-se metade do seu bônus " +
      "de Presença ou sabedoria na rolagem de acerto e o modificador inteiro nas rolagens de dano. " +
      "Caso uma das pessoas escolhida ataque uma criatura que não for o inimigo comum, e o inimigo " +
      "comum estiver vivo, ela para de receber os bônus.",
    requisitos: [],
  },
  {
    id: "sup_posicionamento_estrategico",
    nome: "Posicionamento Estratégico",
    especializacaoId: "suporte",
    tipo: "nivel",
    nivel: 6,
    descricao:
      "Em certos momentos, você não precisa se mover, mas outros se beneficiariam de um melhor " +
      "posicionamento. Durante o seu turno, você pode deixar de se mover (reduzir seu movimento a " +
      "0), para permitir que um dos seus aliados se mova, como Ação Livre.",
    requisitos: [],
  },

  /* ---------------- SUPORTE · POR NÍVEL (8° nível) ---------------- */
  {
    id: "sup_aptidoes_de_suporte",
    nome: "Aptidões de Suporte",
    especializacaoId: "suporte",
    tipo: "nivel",
    nivel: 8,
    descricao:
      "Você aprimora suas aptidões de energia necessárias para ser um grande suporte. Ao obter " +
      "esta habilidade, você pode aumentar o seu nível de aptidão em Aura, Controle e Leitura ou " +
      "Energia Reversa em 1. Você pode pegar esta habilidade três vezes, uma para cada aptidão.",
    // ⚠ REPETÍVEL (3x) e CONCEDE nível de trilha, igual a Aptidões de Combate
    // e Aptidões de Luta. Terceiro caso do mesmo par de problemas.
    requisitos: [],
  },
  {
    id: "sup_contaminar_com_determinacao",
    nome: "Contaminar com Determinação",
    especializacaoId: "suporte",
    tipo: "nivel",
    nivel: 8,
    descricao:
      "Uma vez por cena, você pode gastar 4 pontos de energia amaldiçoada para, como uma ação " +
      "comum, fazer com que você e dois aliados recebam vantagem em todo teste de resistência por " +
      "duas rodadas. Você pode fazer com que mais aliados recebam vantagem, mas para cada aliado a " +
      "mais, o custo da habilidade aumenta em 2 pontos de energia.",
    requisitos: [],
  },
  {
    id: "sup_criar_medicina",
    nome: "Criar Medicina",
    especializacaoId: "suporte",
    tipo: "nivel",
    nivel: 8,
    descricao:
      "Nem sempre é possível estar próximo aos seus aliados, então você desenvolve uma técnica " +
      "para criar remédios portáteis. Durante um descanso curto, você pode escolher recuperar 2 " +
      "pontos de energia a menos para criar uma quantidade de remédios igual a metade do seu bônus " +
      "de treinamento; em um descanso longo, a quantidade é igual ao seu bônus de treinamento e " +
      "você recupera 4 pontos de energia a menos. Um remédio cura em um valor igual a sua cura da " +
      "habilidade Suporte em Combate, dura 1 dia e consome uma ação comum para ser usado.",
    requisitos: [{ tipo: "nota", texto: "Treinado em Ferramentas de Médico" }],
  },
  {
    id: "sup_cura_aperfeicoada",
    nome: "Cura Aperfeiçoada",
    especializacaoId: "suporte",
    tipo: "nivel",
    nivel: 8,
    descricao:
      "Sua cura é quase perfeita em sua consistência. Caso você tire 1 ou 2 em um dado de cura, " +
      "você pode escolher rolar novamente o dado, ficando com o melhor resultado.",
    requisitos: [],
  },
  {
    id: "sup_elevar_sucesso",
    nome: "Elevar Sucesso",
    especializacaoId: "suporte",
    tipo: "nivel",
    nivel: 8,
    descricao:
      "Como um suporte, você consegue elevar a tentativa de resistência de um aliado. Quando um " +
      "aliado dentro de 4,5 metros suceder em um teste de resistência você pode, como uma reação, " +
      "gastar 2PE para somar +5 ao resultado do teste dele, com a possibilidade de se tornar um " +
      "sucesso crítico.",
    requisitos: [],
  },
  {
    id: "sup_fisico_controlado",
    nome: "Físico Controlado",
    especializacaoId: "suporte",
    tipo: "nivel",
    nivel: 8,
    descricao:
      "Você controla o seu físico a partir dos conhecimentos médicos e da energia amaldiçoada. " +
      "Você passa a somar seu modificador de presença ou de sabedoria, ao invés de constituição, " +
      "nos pontos de vida, mas com um limite de +4. Ao adquirir essa habilidade, você calcula " +
      "novamente a sua vida, levando em conta a alteração do atributo usado.",
    // ⚠ TROCA o atributo do HP (Presença/Sabedoria no lugar de Constituição),
    // com teto +4. É substituição na fórmula, não soma. Mesmo tipo de canal
    // que Músculos Desenvolvidos (Lutador) pede para a Defesa.
    requisitos: [{ tipo: "nota", texto: "Treinado em Fortitude" }],
  },
  {
    id: "sup_motivacao_pelo_triunfo",
    nome: "Motivação pelo Triunfo",
    especializacaoId: "suporte",
    tipo: "nivel",
    nivel: 8,
    descricao:
      "Neutralizar um dos inimigos incentiva você e seus aliados a continuarem lutando, " +
      "independente de quem o tenha eliminado. Quando um inimigo tem seus pontos de vida reduzidos " +
      "a 0 ou é morto por você ou um dos aliados presentes na cena, você pode conceder uma " +
      "quantidade de pontos de vida temporários igual ao dobro do seu nível de Suporte para todos " +
      "os aliados que tenham causado dano nesse inimigo. Caso o inimigo seja um Lacaio, essa " +
      "quantidade é reduzida pela metade.",
    // ⚠ Cita "Lacaio", que é patamar da 2.5.2 e NÃO EXISTE no Afty
    // (Comum/Desafio/Calamidade/Beyond). Transcrito verbatim.
    requisitos: [],
  },
  {
    id: "sup_pressao_do_medico",
    nome: "Pressão do Médico",
    especializacaoId: "suporte",
    tipo: "nivel",
    nivel: 8,
    descricao:
      "Ao entrar nas portas da morte, você não fica inconsciente. Ao invés de não agir, você pode " +
      "tentar se estabilizar sozinho com CD aumentada em +10, porém ao fazer isso, você recebe uma " +
      "falha nos testes de morte.",
    requisitos: [{ tipo: "nota", texto: "Mestre em Medicina" }],
  },
  {
    id: "sup_sustentacao_avancada",
    nome: "Sustentação Avançada",
    especializacaoId: "suporte",
    tipo: "nivel",
    nivel: 8,
    descricao:
      "Seu corpo agora é capaz de dividir a liberação de energia entre dois feitiços diferentes. " +
      "Você pode manter um feitiço sustentado adicional e, no começo do combate, pode ativar um " +
      "feitiço sustentado à sua escolha como Ação Livre, desde que ele possua um custo de Ação " +
      "Bônus ou inferior.",
    // Texto idêntico ao da homônima do Conjurador (cnj_sustentacao_avancada).
    requisitos: [],
  },

  /* ---------------- SUPORTE · POR NÍVEL (10° nível) ---------------- */
  {
    id: "sup_descarga_reanimadora",
    nome: "Descarga Reanimadora",
    especializacaoId: "suporte",
    tipo: "nivel",
    nivel: 10,
    descricao:
      "Você descobriu uma técnica para descarregar energia reversa de maneira a reanimar " +
      "imediatamente alguém caído. Caso haja um aliado nas portas da morte, dentro do seu alcance " +
      "de toque, você pode usar uma Ação Completa e gastar 10 pontos de energia amaldiçoada para o " +
      "estabilizar imediatamente, independente de quanta vida negativa ele tenha, e recupere " +
      "pontos de vida igual a uma rolagem da sua cura de Suporte em Combate. Se o turno dele já " +
      "tiver passado e ele não ter agido por estar nas portas da morte, ele pode realizar o turno " +
      "imediatamente após o seu.",
    requisitos: [{ tipo: "aptidao", id: "cura_amplificada" }],
  },
  {
    id: "sup_necessidade_de_continuar",
    nome: "Necessidade de Continuar",
    especializacaoId: "suporte",
    tipo: "nivel",
    nivel: 10,
    descricao:
      "Para você, continuar presente no campo de batalha é mais do que uma necessidade, pois você " +
      "é o suporte necessário. Quatro vezes por cena, se você estiver com menos da metade da sua " +
      "vida máxima, você recebe um valor de pontos de vida temporários igual ao seu bônus da " +
      "perícia Medicina + seu modificador de Presença ou Sabedoria, no começo do seu turno.",
    requisitos: [{ tipo: "nota", texto: "Treinado em Vontade" }],
  },
  {
    id: "sup_olhar_agucado",
    nome: "Olhar Aguçado",
    especializacaoId: "suporte",
    tipo: "nivel",
    nivel: 10,
    descricao:
      "Seus olhos são treinados para encontrar os pontos fracos dos inimigos: você pode gastar 2 " +
      "pontos de energia amaldiçoada e usar sua ação bônus para analisar um inimigo, descobrindo " +
      "onde é melhor o acertar, fazendo com que o primeiro ataque de todo aliado cause dano " +
      "adicional igual ao seu bônus de treinamento multiplicado por 5. Você só pode usar essa " +
      "habilidade duas vezes por criatura.",
    requisitos: [{ tipo: "nota", texto: "Treinado em Percepção" }],
  },
  {
    id: "sup_taticas_defensivas",
    nome: "Táticas Defensivas",
    especializacaoId: "suporte",
    tipo: "nivel",
    nivel: 10,
    descricao:
      "Você pode escolher um tipo de dano Elemental para que você e dois aliados sejam " +
      "resistentes. Em um descanso longo, você pode trocar esses tipos de dano e os aliados " +
      "recebendo o benefício.",
    requisitos: [],
  },

  /* ---------------- SUPORTE · POR NÍVEL (12° nível) ---------------- */
  {
    id: "sup_ajustes_em_equipamento",
    nome: "Ajustes em Equipamento",
    especializacaoId: "suporte",
    tipo: "nivel",
    nivel: 12,
    descricao:
      "Você se torna capaz de fazer ajustes nos equipamentos dos seus aliados, durante um tempo de " +
      "descanso. Durante um descanso curto, você pode escolher uma quantidade de equipamentos " +
      "igual ao seu Bônus de Treinamento, os quais recebem o efeito de um Encantamento que não " +
      "possuam e atendam aos requisitos. Durante um Descanso Longo, essa quantidade se torna o " +
      "dobro do seu Bônus de Treinamento. O efeito dos Encantamentos fica ativo até o próximo " +
      "descanso.",
    requisitos: [{ tipo: "nota", texto: "Treinado em Ferramentas de Ferreiro" }],
  },
  {
    id: "sup_interferencia",
    nome: "Interferência",
    especializacaoId: "suporte",
    tipo: "nivel",
    nivel: 12,
    descricao:
      "Você se torna capaz de interferir nas ações dos inimigos. Como uma reação, você pode gastar " +
      "2 pontos de energia amaldiçoada para forçar um inimigo dentro de 9 metros a rolar novamente " +
      "um teste, ficando com o menor resultado. Além disso, após usar essa habilidade você pode " +
      "conceder a um aliado dentro de 4,5 metros vantagem na próxima rolagem dele.",
    requisitos: [],
  },
  {
    id: "sup_nao_desista",
    nome: "Não Desista!",
    especializacaoId: "suporte",
    tipo: "nivel",
    nivel: 12,
    descricao:
      "Ao ver um aliado atingir 0 ou menos de vida ao receber dano, você pode, gastando 3 de PE, " +
      "fazer um teste de Persuasão contra a CD de estabilização. Caso você passe, o aliado " +
      "continua de pé e não entra nas portas da morte, ficando com 0 de vida ao invés do normal, " +
      "durante uma rodada. Enquanto essa rodada durar, a vida necessária para ele cair nas portas " +
      "da morte se torna -100 ou a vida máxima negativa, o que for menor. Se a rodada acabar e ele " +
      "ainda estiver com 0 de vida ou menos, ele caíra nas portas da morte, recebendo 1 falha. " +
      "Caso o aliado possua uma habilidade que permita o mesmo continuar agindo mesmo depois de " +
      "bater 0, como “Mesmo Morto” ou “Potência Antes de Cair”, ao invés disso, você anula o " +
      "efeito negativo das habilidades (No caso de mesmo morto, seria receber uma falha, no caso " +
      "de potência antes de cair, seria a exaustão). Esta habilidade pode ser utilizada para negar " +
      "efeitos negativos de habilidades apenas uma quantidade de vezes igual a metade do seu bônus " +
      "de treinamento.",
    // "Potência Antes de Cair" é habilidade do Combatente (10°), já no catálogo.
    requisitos: [],
  },
  {
    id: "sup_sobrecura",
    nome: "Sobrecura",
    especializacaoId: "suporte",
    tipo: "nivel",
    nivel: 12,
    descricao:
      "Ao curar um aliado você pode fazer com que essa cura supere o máximo de vida dele: caso ele " +
      "fique com o máximo de vida por meio da sua cura, ele recebe o dobro do excedente como vida " +
      "temporária, com um limite igual ao dobro do seu nível de suporte. Você pode, também, " +
      "escolher conceder 5 multiplicado por seu modificador de Presença ou Sabedoria de Vida " +
      "Temporária a alguém que já esteja com a vida completa com um uso da sua cura.",
    requisitos: [],
  },
  {
    id: "sup_reacao_necessaria",
    nome: "Reação Necessária",
    especializacaoId: "suporte",
    tipo: "nivel",
    nivel: 12,
    descricao:
      "Você sabe que, em certos momentos, sua reação é necessária, mesmo que isso signifique ir " +
      "além do esperado. Uma vez por rodada, caso não possua uma reação, você pode gastar 3 pontos " +
      "de energia amaldiçoada para realizar uma reação adicional.",
    requisitos: [],
  },

  /* ---------------- SUPORTE · POR NÍVEL (14° nível) ----------------
     ⚠ ÚNICO grupo de 14° do sistema. gruposDeHabilidade ordena por nível
     sozinho, então ele entra entre o 12° e o 16° sem ajuste nenhum. */
  {
    id: "sup_apoio_abrangente",
    nome: "Apoio Abrangente",
    especializacaoId: "suporte",
    tipo: "nivel",
    nivel: 14,
    descricao:
      "Você é capaz de apoiar e melhorar isso de maneira mais abrangente. Quando utilizar Apoio " +
      "Avançado, você pode colocar dois efeitos ao invés de um só.",
    requisitos: [{ tipo: "habilidade", id: "sup_apoio_avancado" }],
  },

  /* ---------------- SUPORTE · POR NÍVEL (16° nível) ---------------- */
  {
    id: "sup_purificacao_da_alma",
    nome: "Purificação da Alma",
    especializacaoId: "suporte",
    tipo: "nivel",
    nivel: 16,
    descricao:
      "Suas capacidades se tornaram tão grandes que você inconscientemente se tornou ciente do " +
      "traçado de uma alma, assim podendo curar diretamente as almas das pessoas. Uma quantidade " +
      "de vezes igual ao seu modificador de presença você pode restaurar a integridade de alguém " +
      "em 50%. E, além disso, você domina ainda mais as técnicas de cura: o seu Bônus de " +
      "Treinamento é adicionado ao número de usos da sua cura.",
    // ⚠ Mexe em ALMA/Integridade, o recurso que escala TODO o HP no Afty
    // (× Alma.Atual/100). Primeira habilidade do sistema que restaura Alma.
    requisitos: [],
  },
  {
    id: "sup_sustentacao_mestre",
    nome: "Sustentação Mestre",
    especializacaoId: "suporte",
    tipo: "nivel",
    nivel: 16,
    descricao:
      "Com o passar do tempo, você descobriu novas formas de como dispersar energia pelo seu " +
      "corpo, conseguindo sustentar mais feitiços e com maior eficiência. Você pode manter três " +
      "feitiços sustentados ao invés de dois. Além disso, seu custo para sustentar feitiços é " +
      "diminuído em 1, com um mínimo de 1.",
    requisitos: [{ tipo: "habilidade", id: "sup_sustentacao_avancada" }],
  },

  /* ================= CONTROLADOR · BASE =================
     No livro a especialização controla Invocações (shikigamis e corpos
     amaldiçoados). Base nos níveis 1, 4, 6, 9, 10 e 20. */
  {
    id: "ctr_treinamento_em_controle",
    nome: "Treinamento em Controle",
    especializacaoId: "controlador",
    tipo: "base",
    nivel: 1,
    descricao:
      "Você é treinado para controlar Invocações com maior eficiência. Ao obter esta habilidade, " +
      "você:\n\n" +
      "• Recebe duas Invocações iniciais, as quais podem ser tanto shikigamis quanto corpos " +
      "amaldiçoados. Nos níveis 3, 6, 9, 10, 12, 15 e 18 você recebe uma Invocação adicional.\n" +
      "• A quantidade de Invocações que você pode manter ativas em campo aumenta em 1.\n" +
      "• Nos níveis 6, 12 e 18 a quantidade de comandos que você realiza com uma Ação Comum e " +
      "Bônus aumenta em um (no nível 6, uma Ação Comum permitiria duas Invocações realizarem uma " +
      "ação complexa ou uma Invocação realizar duas ações complexas).",
    requisitos: [],
  },
  {
    id: "ctr_controle_aprimorado",
    nome: "Controle Aprimorado",
    especializacaoId: "controlador",
    tipo: "base",
    nivel: 4,
    descricao:
      "Você é naturalmente mais capaz em comandar invocações, aprimorando o desempenho e " +
      "aplicação delas. Suas invocações recebem um bônus em testes que realizarem igual a +2, " +
      "aumentando em +1 para cada grau acima do quarto (+3 para terceiro, +4 para segundo etc.) " +
      "Além disso, você pode utilizar Aptidões Amaldiçoadas das categorias Controle e Leitura a " +
      "partir de suas Invocações, fazendo com que elas recebam os efeitos, como o aumento de dano " +
      "de Canalizar em Golpe; entretanto, não é possível utilizar Punho Divergente e Emoção da " +
      "Pétala Decadente a partir de Invocações.",
    requisitos: [],
  },
  {
    id: "ctr_apogeu",
    nome: "Apogeu",
    especializacaoId: "controlador",
    tipo: "base",
    nivel: 6,
    descricao:
      "Você começa a encontrar o caminho que deseja seguir como um controlador, especializando-o " +
      "em um estilo específico de controle. Escolha entre:",
    // Escolha aninhada: 1 estilo de controle ao obter (nível 6). É a subclasse
    // do controlador, escolhida uma vez (ver ESTILOS_DE_CONTROLE).
    escolha: {
      id: "estilo_controle",
      label: "Estilo de Controle",
      niveis: [6],
      opcoes: ESTILOS_DE_CONTROLE,
    },
    requisitos: [],
  },
  {
    id: "ctr_teste_de_resistencia_mestre",
    nome: "Teste de Resistência Mestre",
    especializacaoId: "controlador",
    tipo: "base",
    nivel: 9,
    descricao:
      "Você se torna treinado em um segundo teste de resistência e mestre no concedido pela sua " +
      "especialização.",
    requisitos: [],
  },
  {
    id: "ctr_reserva_para_invocacao",
    nome: "Reserva para Invocação",
    especializacaoId: "controlador",
    tipo: "base",
    nivel: 10,
    descricao:
      "Você cria uma reserva dedicada para invocar ou ativar as suas invocações. Uma vez por " +
      "descanso curto, você pode optar por usar a ação Invocar para trazer duas invocações com o " +
      "custo reduzido pela metade ou uma invocação sem custo. Caso utilize esta habilidade para " +
      "Criar Horda, o custo total dela é reduzido pela metade.",
    requisitos: [],
  },
  {
    id: "ctr_apice_do_controle",
    nome: "Ápice do Controle",
    especializacaoId: "controlador",
    tipo: "base",
    nivel: 20,
    descricao:
      "Você alcançou o ápice do controle, levando além do limite a arte de ter invocações e as " +
      "controlar, sendo uma presença única no mundo. Suas invocações recebem duas " +
      "ações/características adicionais, as quais não influenciam no custo delas; você passa a " +
      "poder invocar ou ativar suas invocações como uma ação livre (caso ela já pudesse ser " +
      "invocada como Ação Livre, ela tem seu custo reduzido em 2 PE). Além disso, conhecendo bem " +
      "as táticas para utilizar invocações, você consegue prever parte dos movimentos delas: " +
      "invocações de outras criaturas possuem desvantagem para realizar ações ofensivas contra " +
      "você.",
    requisitos: [],
  },

  /* ---------------- CONTROLADOR · POR NÍVEL (2° nível) ---------------- */
  {
    id: "ctr_aceleracao",
    nome: "Aceleração",
    especializacaoId: "controlador",
    tipo: "nivel",
    nivel: 2,
    descricao:
      "Estimulando-as com seus comandos, você é capaz de forçar uma aceleração maior em " +
      "invocações. Uma vez por rodada, você pode fazer com que uma Invocação se mova duas vezes " +
      "ao invés de uma.",
    requisitos: [],
  },
  {
    id: "ctr_camuflagem_aprimorada",
    nome: "Camuflagem Aprimorada",
    especializacaoId: "controlador",
    tipo: "nivel",
    nivel: 2,
    descricao:
      "Você consegue se mesclar no meio das suas invocações, camuflando-se. Você pode, como uma " +
      "Ação Comum, camuflar-se em meio as suas invocações adjacentes a você: para cada Invocação, " +
      "todo ataque feito contra você tem 10% de chance de errar (1 em 1d10). Essa camuflagem dura " +
      "até que não haja mais invocações adjacentes, e a chance de erro é diminuída conforme as " +
      "invocações deixam de estar adjacentes.",
    requisitos: [],
  },
  {
    id: "ctr_chamado_destruidor",
    nome: "Chamado Destruidor",
    especializacaoId: "controlador",
    tipo: "nivel",
    nivel: 2,
    descricao:
      "Um acerto preciso de uma invocação incentiva as outras a acompanhar, como um chamado " +
      "destrutivo. Quando uma das suas invocações conseguir um acerto crítico em uma ação de " +
      "ataque você pode, como uma Ação Livre, pagar 2 PE para fazer com que uma das suas " +
      "invocações adjacentes ataque o mesmo alvo que recebeu o crítico.",
    requisitos: [],
  },
  {
    id: "ctr_companheiro_amaldicoado",
    nome: "Companheiro Amaldiçoado",
    especializacaoId: "controlador",
    tipo: "nivel",
    nivel: 2,
    descricao:
      "Uma das suas invocações se torna seu companheiro, tornando-se mais capaz de ajudar. " +
      "Escolha uma invocação sua: ela se torna o seu companheiro amaldiçoado. Uma vez por rodada, " +
      "a invocação escolhida pode utilizar Apoiar como Ação Livre. Durante um descanso ou " +
      "interlúdio, você pode alternar a invocação que é seu companheiro amaldiçoado, caso a " +
      "invocação escolhida anteriormente tenha sido exorcizada.",
    requisitos: [],
  },
  {
    id: "ctr_dor_partilhada",
    nome: "Dor Partilhada",
    especializacaoId: "controlador",
    tipo: "nivel",
    nivel: 2,
    descricao:
      "Você e uma invocação conseguem criar um laço para partilhar dor, e isso pode acabar " +
      "amenizando-a. Quando utilizar a ação Invocar, você pode escolher formar um laço com uma " +
      "delas: caso você e a invocação escolhida com o laço fossem receber quantidades diferentes " +
      "de dano de uma mesma habilidade em área, ambos recebem o menor entre os dois valores de " +
      "dano.",
    requisitos: [],
  },
  {
    id: "ctr_frenesi_da_invocacao",
    nome: "Frenesi da Invocação",
    especializacaoId: "controlador",
    tipo: "nivel",
    nivel: 2,
    descricao:
      "Você consegue fazer com que suas invocações se rendam a um frenesi brutal, mas arriscado. " +
      "Uma vez por rodada, quando uma invocação realizar uma ação de ataque, você pode fazer com " +
      "que ela realize essa ação duas vezes, ao invés de uma; com exceção de Ações com Custo. " +
      "Mas, por uma rodada, ataques contra ela terão vantagem e ela terá a sua Defesa reduzida em " +
      "5 e -5 em testes de resistência.",
    requisitos: [],
  },
  {
    id: "ctr_guarda_viva",
    nome: "Guarda Viva",
    especializacaoId: "controlador",
    tipo: "nivel",
    nivel: 2,
    descricao:
      "Suas invocações atuam como uma guarda viva para você, auxiliando em sua defesa. Para cada " +
      "Invocação que estiver dentro de 3 metros de você, sua Defesa aumenta em 1.",
    requisitos: [],
  },
  {
    id: "ctr_invocacoes_moveis",
    nome: "Invocações Móveis",
    especializacaoId: "controlador",
    tipo: "nivel",
    nivel: 2,
    descricao:
      "Você prepara suas invocações para se moverem com mais velocidade. O Deslocamento de todas " +
      "suas Invocações aumenta em 1,5 metros. Nos níveis 6, 12 e 18 elas recebem +1,5 metros.",
    requisitos: [],
  },
  {
    id: "ctr_invocacoes_resistentes",
    nome: "Invocações Resistentes",
    especializacaoId: "controlador",
    tipo: "nivel",
    nivel: 2,
    descricao:
      "Você torna suas invocações mais resistentes, amplificando a vitalidade delas. Os Pontos de " +
      "Vida Máximos de todas suas Invocações aumentam em um valor igual ao seu Bônus de " +
      "Treinamento multiplicado por cinco.",
    requisitos: [],
  },
  {
    id: "ctr_invocacoes_treinadas",
    nome: "Invocações Treinadas",
    especializacaoId: "controlador",
    tipo: "nivel",
    nivel: 2,
    descricao:
      "Você faz com que suas invocações sejam mais aptas em habilidades. Todas suas Invocações se " +
      "tornam treinadas em uma quantidade de Perícias adicional igual a metade do seu bônus de " +
      "treinamento.",
    requisitos: [],
  },
  {
    id: "ctr_melhoria_de_controlador",
    nome: "Melhoria de Controlador",
    especializacaoId: "controlador",
    tipo: "nivel",
    nivel: 2,
    descricao:
      "Estudando novas táticas e especializando-se em aspectos específicos, você aplica certas " +
      "melhorias em todas suas invocações. Ao obter esta habilidade, escolha uma das quatro " +
      "melhorias especificadas no final da especialização. Você pode pegar essa habilidade quatro " +
      "vezes, uma para cada melhoria.\n\n" +
      "A melhoria escolhida é aplicada em uma quantidade de Invocações à sua escolha igual ao seu " +
      "Bônus de Treinamento. Uma vez feita a escolha, você só pode alterá-la caso uma Invocação " +
      "que tenha uma melhoria seja morta, escolhendo uma nova Invocação para receber a melhoria " +
      "durante o próximo descanso longo.",
    // Escolha aninhada: 1 melhoria ao obter (nível 2), do pool
    // MELHORIAS_DE_CONTROLADOR. REPETÍVEL: "quatro vezes, uma para cada
    // melhoria", então cada melhoria escolhida consome uma vaga de habilidade
    // (ver resolveEscolhasHabilidade / o cômputo de gastos em resolveHabilidades).
    escolha: {
      id: "melhoria_controlador",
      label: "Melhoria",
      niveis: [2],
      opcoes: MELHORIAS_DE_CONTROLADOR,
      repetivel: true,
    },
    // ⚠ REPETÍVEL ("quatro vezes, uma para cada melhoria"). O pool já existe
    // (MELHORIAS_DE_CONTROLADOR), mas o shape atual da ficha (lista de ids
    // únicos) não suporta pegar 4x, então hoje só uma instância é possível.
    // Resolver junto do estado da escolha aninhada. Mesmo caso de Aptidões de
    // Combate (8° do Combatente).
    requisitos: [],
  },
  {
    id: "ctr_otimizacao_de_energia",
    nome: "Otimização de Energia",
    especializacaoId: "controlador",
    tipo: "nivel",
    nivel: 2,
    descricao:
      "Você consegue otimizar o gasto de energia das habilidades mais exaustivas das suas " +
      "invocações. Ao adquirir essa habilidade e em um descanso curto ou longo, você pode " +
      "escolher uma habilidade com custo de cada invocação para ter esse custo reduzido em 1PE.",
    requisitos: [],
  },
  {
    id: "ctr_proteger_invocacao",
    nome: "Proteger Invocação",
    especializacaoId: "controlador",
    tipo: "nivel",
    nivel: 2,
    descricao:
      "Você sabe do valor das suas invocações, podendo até mesmo utilizar delas para sacrifícios " +
      "em prol de si mesmas. Caso uma invocação sobre seu controle, dentro de um alcance igual a " +
      "metade do Deslocamento de outra Invocação, vá receber dano suficiente para ser dissipada " +
      "ou exorcizada, você pode gastar sua reação para fazer com que ela se mova até ficar " +
      "adjacente a ela e receber esse dano por ela. Além disso, caso você esteja no alcance de " +
      "ataque de uma invocação que foi atacada, você pode gastar sua reação também para reduzir o " +
      "dano que ela receberá em um valor igual a Xd6 + seu modificador de Presença ou Sabedoria. " +
      "X é igual ao seu bônus de treinamento.",
    requisitos: [],
  },
  {
    id: "ctr_rede_de_deteccao",
    nome: "Rede de Detecção",
    especializacaoId: "controlador",
    tipo: "nivel",
    nivel: 2,
    descricao:
      "Juntamente das suas invocações, você se atenta e é auxiliado por elas para não perder " +
      "nenhum detalhe. Para cada invocação dentro de 3 metros de você, você recebe +2 em rolagens " +
      "de Percepção e seu valor de atenção aumenta em 2.",
    requisitos: [],
  },
  {
    id: "ctr_tecnicas_de_combate",
    nome: "Técnicas de Combate",
    especializacaoId: "controlador",
    tipo: "nivel",
    nivel: 2,
    descricao:
      "Você decide se versar em técnicas essenciais de combate, em busca de conseguir se defender " +
      "em casos extremos. Você pode escolher duas armas quaisquer para se tornar treinado, caso " +
      "não seja, e para poder utilizar Presença ou Sabedoria nas jogadas de ataque e dano " +
      "enquanto as manejando.",
    requisitos: [],
  },
  {
    id: "ctr_visionario",
    nome: "Visionário",
    especializacaoId: "controlador",
    tipo: "nivel",
    nivel: 2,
    descricao:
      "Você expande sua visão para a criação de invocações, conseguindo as conferir mais aspectos " +
      "únicos. Sempre que for criar uma invocação, a quantidade de ações e/ou características que " +
      "ela pode receber aumenta em um valor igual a metade do seu bônus de treinamento. Colocar " +
      "ações e/ou características adicionais através desta habilidade ainda aumenta o custo da " +
      "invocação normalmente.",
    requisitos: [],
  },

  /* ---------------- CONTROLADOR · POR NÍVEL (4° nível) ---------------- */
  {
    id: "ctr_acao_corretiva",
    nome: "Ação Corretiva",
    especializacaoId: "controlador",
    tipo: "nivel",
    nivel: 4,
    descricao:
      "Sempre atento ao campo de batalha, você consegue corrigir falhas de suas invocações. " +
      "Quando uma invocação dentro de 9 metros de você realizar uma rolagem de perícia e obter um " +
      "valor menor do que 10 no dado, você pode gastar 2 pontos de energia amaldiçoada para " +
      "transformar o resultado em um 10.",
    requisitos: [],
  },
  {
    id: "ctr_acompanhamento_amaldicoado",
    nome: "Acompanhamento Amaldiçoado",
    especializacaoId: "controlador",
    tipo: "nivel",
    nivel: 4,
    descricao:
      "Uma das suas invocações pode ser colocada para o acompanhar de perto, reagindo aos seus " +
      "golpes. Quando utilizar Invocar, você pode escolher uma das invocações para o acompanhar. " +
      "Quando realizar um ataque contra uma criatura que esteja dentro do seu alcance e do alcance " +
      "da Invocação, ela pode gastar uma Reação para utilizar uma ação de ataque ou auxílio, tendo " +
      "como alvo você ou a criatura atacada.",
    requisitos: [],
  },
  {
    id: "ctr_ataque_em_conjunto",
    nome: "Ataque em Conjunto",
    especializacaoId: "controlador",
    tipo: "nivel",
    nivel: 4,
    descricao:
      "Você consegue unificar seus comandos para fazer com que suas invocações ataquem em " +
      "conjunto. Uma vez por rodada, como uma Ação Comum, você pode fazer com que todas as suas " +
      "invocações ativas utilizem uma ação de ataque contra um mesmo alvo, pagando 2PE para cada " +
      "invocação além da primeira. Para cada invocação participando do ataque em conjunto, todas " +
      "recebem um bônus de +1 na jogada de ataque. Você pode, também, optar por participar do " +
      "Ataque em Conjunto caso o alvo esteja no seu alcance. Você pode usar essa habilidade uma " +
      "quantidade de vezes igual ao seu modificador de Sabedoria ou Presença por descanso longo.",
    requisitos: [],
  },
  {
    id: "ctr_autonomia",
    nome: "Autonomia",
    especializacaoId: "controlador",
    tipo: "nivel",
    nivel: 4,
    descricao:
      "Assumindo uma abordagem diferente, você traz uma invocação a campo com autonomia, " +
      "deixando-a agir de maneira independente enquanto foca em seu objetivo. Ao ativar uma " +
      "invocação, você pode pagar uma quantidade adicional de PE igual a 2 para cada grau dela (2 " +
      "para quarto grau, 10 para grau especial). Caso o faça, aquela invocação recebe um turno " +
      "próprio dentro de combate, no qual ela pode realizar uma ação por turno, além de se mover, " +
      "sem a necessidade de comandos. A invocação irá seguir o que você desejar que ela faça, além " +
      "de ainda contar para o seu número de invocações ativas e poder realizar outros comandos " +
      "feitos durante o seu turno.",
    requisitos: [],
  },
  {
    id: "ctr_companheiro_avancado",
    nome: "Companheiro Avançado",
    especializacaoId: "controlador",
    tipo: "nivel",
    nivel: 4,
    descricao:
      "O seu companheiro amaldiçoado se torna ainda mais avançado, conseguindo se versar em mais " +
      "uma função, que é a de um aliado. Ao obter essa habilidade, o seu companheiro amaldiçoado " +
      "se torna também um aliado de um tipo a sua escolha. Ele começa como um aliado iniciante. Os " +
      "efeitos do companheiro como Aliado são aplicados a você ou ao aliado mais próximo da " +
      "invocação, dentro de um alcance igual a metade do movimento dela. No nível 6 se torna um " +
      "veterano e no nível 12 se torna um mestre.",
    requisitos: [{ tipo: "habilidade", id: "ctr_companheiro_amaldicoado" }],
  },
  {
    id: "ctr_critico_brutal",
    nome: "Crítico Brutal",
    especializacaoId: "controlador",
    tipo: "nivel",
    nivel: 4,
    descricao:
      "A brutalidade de um golpe bem encaixado por uma invocação é ampliada. Os acertos críticos " +
      "da sua invocação causam 1 dado de dano adicional e, quando causar um crítico em uma " +
      "criatura, você pode escolher diminuir o Deslocamento dela em um valor igual a 1,5 metros " +
      "multiplicado pelo seu Bônus de Treinamento ou diminuir a Defesa dela em um valor igual a " +
      "metade do seu Bônus de Treinamento. Qualquer um dos prejuízos dura até o começo do seu " +
      "próximo turno.",
    requisitos: [],
  },
  {
    id: "ctr_domador_de_maldicoes",
    nome: "Domador de Maldições",
    especializacaoId: "controlador",
    tipo: "nivel",
    nivel: 4,
    descricao:
      "Você se prepara para ser capaz de domar maldições com efetividade superior. Sempre que " +
      "estiver no processo de domar uma maldição, você possui vantagem em todas as rolagens " +
      "envolvidas no processo, além de poder anular sua primeira falha, tendo outra chance.",
    requisitos: [],
  },
  {
    id: "ctr_invocacao_as",
    nome: "Invocação Às",
    especializacaoId: "controlador",
    tipo: "nivel",
    nivel: 4,
    descricao:
      "Seu companheiro amaldiçoado se torna também a sua invocação às, capaz de o ajudar " +
      "grandemente. Quando obter esta habilidade, a Invocação escolhida como companheiro " +
      "amaldiçoado recebe os benefícios detalhados no final da especialização.\n\n" +
      "O seu companheiro amaldiçoado também recebe várias capacidades especiais, das quais você " +
      "pode usar uma delas como ação livre:\n\n" +
      "• Curar a você em 2d10 + seu modificador de Sabedoria ou Presença. Nos níveis 5, 9, 13 e " +
      "17, a cura aumenta em +1d10.\n" +
      "• Infligir 2d8 + seu modificador de Sabedoria ou Presença de dano em um inimigo dentro de 6 " +
      "metros. No nível 5, esse dano aumenta para 4d8; no nível 9, aumenta para 5d10; no nível 13, " +
      "aumenta para 8d8 e, no nível 17, aumenta para 8d10. O dano é de um tipo a sua escolha.\n" +
      "• Forçar todos os inimigos dentro de 9 metros a realizarem um teste de resistência de " +
      "Fortitude ou serem cegados por 2 turnos. Nos níveis 5, 9, 13 e 17, a área afetada aumenta " +
      "em +3 metros.\n\n" +
      "Você pode utilizar cada um dos efeitos uma vez por descanso curto ou longo.",
    // Os benefícios "no final da especialização" são uma lista fixa (você
    // recebe as três capacidades, não escolhe), então vão como texto
    // verbatim, não como escolha aninhada.
    requisitos: [{ tipo: "habilidade", id: "ctr_companheiro_amaldicoado" }],
  },
  {
    id: "ctr_invocacao_parcial",
    nome: "Invocação Parcial",
    especializacaoId: "controlador",
    tipo: "nivel",
    nivel: 4,
    descricao:
      "Nem sempre é necessário trazer uma invocação por completo para se beneficiar de suas " +
      "capacidades. Você pode utilizar de suas ações para realizar a ação de uma invocação que não " +
      "esteja ativa; como uma ação comum, você utiliza uma ação complexa ou, como uma ação bônus, " +
      "uma ação simples, de uma invocação a sua escolha.",
    requisitos: [],
  },
  {
    id: "ctr_potencial_superior",
    nome: "Potencial Superior",
    especializacaoId: "controlador",
    tipo: "nivel",
    nivel: 4,
    descricao:
      "Suas invocações possuem um potencial superior para desenvolver seus atributos. Todas suas " +
      "invocações recebem 2 pontos de atributo adicionais por grau (2 para quatro grau, 10 para " +
      "grau especial).",
    requisitos: [],
  },

  /* ---------------- CONTROLADOR · POR NÍVEL (6° nível) ----------------
     Os pré-requisitos "Apogeu · Controle X" pedem uma OPÇÃO específica da
     escolha aninhada do Apogeu. Agora que a ficha guarda a escolha
     (escolhasHabilidade), vão como requisito `escolha`, verificável de verdade:
     bloqueiam a habilidade até o Estilo de Controle certo estar escolhido. */
  {
    id: "ctr_combate_em_alcateia",
    nome: "Combate em Alcateia",
    especializacaoId: "controlador",
    tipo: "nivel",
    nivel: 6,
    descricao:
      "Você se torna parte da própria alcateia das suas invocações, golpeando com mais poder " +
      "enquanto cercado delas. Enquanto manejando uma arma escolhida em Técnicas de Combate, você " +
      "tem seu dano com ela aumentado em 1 nível para cada Invocação que esteja com a criatura no " +
      "alcance de ataque dela.",
    requisitos: [
      { tipo: "habilidade", id: "ctr_tecnicas_de_combate" },
      { tipo: "escolha", habId: "ctr_apogeu", opcaoId: "ctr_controle_sintonizado", label: "Apogeu · Controle Sintonizado" },
    ],
  },
  {
    id: "ctr_concentrar_poder",
    nome: "Concentrar Poder",
    especializacaoId: "controlador",
    tipo: "nivel",
    nivel: 6,
    descricao:
      "Priorizando qualidade acima de quantidade, você consegue concentrar o poder em uma única " +
      "invocação. Enquanto estiver com apenas uma invocação em campo, você recebe benefícios de " +
      "acordo com o seu nível de personagem, indicando o quanto a quantidade reduzida a aprimora. " +
      "Você pode encontrar os benefícios e detalhes no final da especialização.\n\n" +
      "Caso possua a habilidade Concentrar Poder, enquanto estiver com apenas uma invocação " +
      "marcada ativa em campo, ela recebe benefícios, os quais são baseados no seu nível de " +
      "Controlador, sendo eles:\n\n" +
      "• Inicial. Toda rolagem de dano ou cura da invocação é aumentada em 1 nível, recebe +5 " +
      "pontos de vida e +1 de Defesa.\n" +
      "• Nível 6. Toda rolagem de dano ou cura da invocação é aumentada em 2 níveis e soma +3 ao " +
      "total, recebe +10 pontos de vida e +2 em Defesa e TRs.\n" +
      "• Nível 12. Toda rolagem de dano ou cura da invocação é aumentada em 3 níveis e soma +5 ao " +
      "total, recebe +20 pontos de vida e +3 em Defesa e TRs.\n" +
      "• Nível 18. Toda rolagem de dano ou cura da invocação é aumentada em 5 níveis e soma +10 ao " +
      "total, recebe +30 pontos de vida e +5 em Defesa e TRs.\n\n" +
      "Esta habilidade afeta apenas invocações marcadas: durante um descanso, você pode escolher " +
      "uma quantidade de invocações igual a metade do seu bônus de treinamento para serem " +
      "invocações marcadas. Esta escolha só pode ser mudada após outro descanso.",
    // Os benefícios "no final da especialização" são uma tabela de
    // escalonamento por nível de Controlador (não uma escolha), então vão
    // como texto verbatim.
    requisitos: [{ tipo: "escolha", habId: "ctr_apogeu", opcaoId: "ctr_controle_concentrado", label: "Apogeu · Controle Concentrado" }],
  },
  {
    id: "ctr_hoste_amaldicoada",
    nome: "Hoste Amaldiçoada",
    especializacaoId: "controlador",
    tipo: "nivel",
    nivel: 6,
    descricao:
      "Você se foca em formar um exército de baixo nível. Ao utilizar Criar Horda, durante o " +
      "processo de criação você pode escolher por reduzir o limite de grau do Líder em 1 para " +
      "criar duas hordas ao invés de uma. As hordas criadas desta maneira contam como apenas uma " +
      "para o seu limite de hordas em campo.",
    requisitos: [{ tipo: "escolha", habId: "ctr_apogeu", opcaoId: "ctr_controle_disperso", label: "Apogeu · Controle Disperso" }],
  },
  {
    id: "ctr_invocacoes_economicas",
    nome: "Invocações Econômicas",
    especializacaoId: "controlador",
    tipo: "nivel",
    nivel: 6,
    descricao:
      "Trazer algumas das suas invocações para o combate se torna mais econômico, permitindo-o " +
      "trazê-las mais frequentemente quando retiradas. Você pode escolher duas invocações para " +
      "terem o seu custo da invocação ou ativação reduzido em 2. No nível 12 você pode escolher " +
      "mais uma, assim como no nível 18.",
    requisitos: [],
  },
  {
    id: "ctr_protecao_avancada_de_invocacao",
    nome: "Proteção Avançada de Invocação",
    especializacaoId: "controlador",
    tipo: "nivel",
    nivel: 6,
    descricao:
      "Aprofundando-se ainda mais em técnicas defensivas para suas invocações, você se torna mais " +
      "capaz. Quando usar sua reação para receber dano por sua invocação, você receberá apenas " +
      "metade do dano total. Além disso, a reação para reduzir dano normal tem seu valor aumentado " +
      "para Xd8. Caso esteja adjacente a invocação você pode, ao invés do padrão, gastar 2 PE para " +
      "utilizar o efeito como Ação Livre.",
    requisitos: [{ tipo: "habilidade", id: "ctr_proteger_invocacao" }],
  },
  {
    id: "ctr_taticas_de_alcateia",
    nome: "Táticas de Alcateia",
    especializacaoId: "controlador",
    tipo: "nivel",
    nivel: 6,
    descricao:
      "Caso tenha uma criatura agressiva sendo flanqueada por uma das suas invocações, a Defesa " +
      "dela diminui em um valor igual a metade seu bônus de treinamento, e ele recebe uma " +
      "penalidade em todos os testes de resistência com o mesmo valor.",
    requisitos: [],
  },

  /* ---------------- CONTROLADOR · POR NÍVEL (8° nível) ---------------- */
  {
    id: "ctr_aptidoes_de_controle",
    nome: "Aptidões de Controle",
    especializacaoId: "controlador",
    tipo: "nivel",
    nivel: 8,
    descricao:
      "Você aprimora suas aptidões de energia necessárias para ser um mestre controlador. Ao " +
      "obter esta habilidade, você pode aumentar o seu nível de aptidão em Aura, Controle e " +
      "Leitura ou Barreira em 1. Você pode pegar esta habilidade três vezes, uma para cada " +
      "aptidão.",
    // ⚠ REPETÍVEL ("três vezes, uma para cada aptidão") E concede nível de
    // trilha (au, cl OU bar, à escolha). Mesmo par de problemas de Aptidões
    // de Combate (8° do Combatente): o shape (lista de ids únicos) não
    // suporta 3x, e a concessão de trilha entra na passada de efeitos +
    // resolveNiveisAptidao. Ver status.
    requisitos: [],
  },
  {
    id: "ctr_atacar_e_invocar",
    nome: "Atacar e Invocar",
    especializacaoId: "controlador",
    tipo: "nivel",
    nivel: 8,
    descricao:
      "Priorizando um combate próximo e em meio as suas invocações, você consegue trazê-las junto " +
      "de um golpe. Quando você utilizar a ação Atacar, você pode gastar 2 PE para trazer uma " +
      "invocação ao campo, considerando como se ela já estivesse presente para efeitos e uso de " +
      "habilidades, como Acompanhamento Amaldiçoado.",
    requisitos: [],
  },
  {
    id: "ctr_golpes_ageis",
    nome: "Golpes Ágeis",
    especializacaoId: "controlador",
    tipo: "nivel",
    nivel: 8,
    descricao:
      "Seus ataques se tornam mais ágeis, visando permitir comandar as invocações e ainda assim " +
      "atacar por si só. Uma vez por rodada, quando uma Invocação sua utilizar o efeito de " +
      "Acompanhamento Amaldiçoado, você pode gastar 2PE para realizar um ataque armado ou " +
      "desarmado adicional.",
    requisitos: [{ tipo: "habilidade", id: "ctr_acompanhamento_amaldicoado" }],
  },
  {
    id: "ctr_tecnicas_de_oportunidade",
    nome: "Técnicas de Oportunidade",
    especializacaoId: "controlador",
    tipo: "nivel",
    nivel: 8,
    descricao:
      "Suas invocações se tornam aptas a novas técnicas de combate, encontrando boas " +
      "oportunidades. Após obter essa habilidade, suas invocações passam a poder usar Ações de " +
      "Ataque como uma reação, seguindo o mesmo gatilho de um ataque de oportunidade. Não é " +
      "possível utilizar Ações com Custo como oportunidade.",
    requisitos: [],
  },

  /* ---------------- CONTROLADOR · POR NÍVEL (10° nível) ---------------- */
  {
    id: "ctr_buchas_de_canhao",
    nome: "Buchas de Canhão",
    especializacaoId: "controlador",
    tipo: "nivel",
    nivel: 10,
    descricao:
      "Invocações de menor grau não possuem muito valor sozinhas, mas são ótimas para compor uma " +
      "horda. Você não precisa mais pagar PEs adicionais para colocar invocações de quarto grau " +
      "como membros de uma horda ou invocá-la.",
    requisitos: [],
  },
  {
    id: "ctr_critico_aprimorado",
    nome: "Crítico Aprimorado",
    especializacaoId: "controlador",
    tipo: "nivel",
    nivel: 10,
    descricao:
      "Um 19 se torna crítico também para suas invocações. Ao conseguir um crítico você pode, " +
      "também, escolher entre os seguintes efeitos: diminuir o acerto do inimigo em um valor igual " +
      "a metade do seu bônus de treinamento ou diminuir todas as RDs dele em um valor igual ao seu " +
      "bônus de treinamento. Além disso, você escolhe dois efeitos ao invés de apenas um.",
    requisitos: [{ tipo: "habilidade", id: "ctr_critico_brutal" }],
  },
  {
    id: "ctr_flanco_avancado",
    nome: "Flanco Avançado",
    especializacaoId: "controlador",
    tipo: "nivel",
    nivel: 10,
    descricao:
      "Você aprimora as técnicas de flanco das suas invocações, transformando-as em obstáculos " +
      "ainda maiores para os inimigos. Caso tenha uma criatura agressiva dentro do alcance de ação " +
      "de pelo menos duas de suas invocações, além de receber os efeitos da habilidade Táticas de " +
      "Alcateia, sempre que essa criatura recebe um ataque, ela recebe 1d8 de dano adicional, " +
      "aumentando em +1d8 para cada invocação além das duas primeiras.",
    requisitos: [{ tipo: "habilidade", id: "ctr_taticas_de_alcateia" }],
  },
  {
    id: "ctr_resistencia_sobrecarregada",
    nome: "Resistência Sobrecarregada",
    especializacaoId: "controlador",
    tipo: "nivel",
    nivel: 10,
    descricao:
      "Você pode sobrecarregar a resistência das suas invocações a partir da sua própria energia " +
      "amaldiçoada. Ao ativar ou invocar uma invocação, você pode gastar uma quantidade de PE " +
      "igual a metade do seu bônus de treinamento e, para cada ponto gasto, a invocação tem seus " +
      "pontos de vida aumentados em 10.",
    requisitos: [{ tipo: "habilidade", id: "ctr_invocacoes_resistentes" }],
  },

  /* ---------------- CONTROLADOR · POR NÍVEL (16° nível) ---------------- */
  {
    id: "ctr_fantoche_supremo",
    nome: "Fantoche Supremo",
    especializacaoId: "controlador",
    tipo: "nivel",
    nivel: 16,
    descricao:
      "Durante um descanso, você é capaz de reforçar o poderio de uma invocação que pareça que " +
      "será essencial. Você pode, durante um descanso longo, escolher uma Invocação para ser o seu " +
      "Fantoche Supremo, o qual recebe os seguintes benefícios: os pontos de vida da invocação " +
      "aumentam em um valor igual ao seu bônus de treinamento multiplicado por cinco; a Defesa da " +
      "invocação aumenta em um valor igual ao dobro do seu bônus de treinamento; o movimento da " +
      "invocação aumenta em 4,5 metros e ela pode realizar uma ação complexa adicional todo turno. " +
      "Porém, você só pode Invocar o seu fantoche supremo uma vez por descanso longo.",
    requisitos: [],
  },
  {
    id: "ctr_mestre_do_controle",
    nome: "Mestre do Controle",
    especializacaoId: "controlador",
    tipo: "nivel",
    nivel: 16,
    descricao:
      "Você se torna um mestre do controle, levando suas técnicas ao limite. Uma vez por rodada " +
      "você pode, como uma ação livre, gastar 2PE para fazer com que uma invocação sua se mova e " +
      "realize uma ação complexa adicional.",
    requisitos: [],
  },

  /* ================= RESTRINGIDO · BASE =================
     Base nos níveis 1, 2, 2, 3, 4, 9, 10 e 20. É a especialização SEM energia
     amaldiçoada: o recurso é PONTO DE ESTAMINA (4 no ND 1, +4 por nível).
     ⚠ Exclusiva da Origem Restringido, que proíbe multiclasse, então aqui
     nível de Restringido == ND sempre. */
  {
    id: "res_restrito_pelos_ceus",
    nome: "Restrito pelos Céus",
    especializacaoId: "restringido",
    tipo: "base",
    nivel: 1,
    descricao:
      "Para compensar sua falta de energia amaldiçoada, um restringido recebe vários benefícios " +
      "atrelados ao seu físico maior e aptidão ao combate:\n\n" +
      "• Você pode escolher adicionar também seu modificador de Força ou de Constituição na sua " +
      "Defesa, limitado pelo seu nível.\n" +
      "• Você começa com uma ferramenta amaldiçoada de quarto grau e um meio de ver maldições " +
      "(óculos ou lente). A partir do segundo nível, você recebe acesso ao Arsenal Amaldiçoado, " +
      "detalhado no final da especialização.\n" +
      "• No 4° nível, e depois a cada 4 níveis, você recebe uma Dádiva do Céu, listadas no final " +
      "desta especialização.\n" +
      "• Por não ter energia amaldiçoada, você possui Pontos de Estamina, os quais são baseados na " +
      "sua própria força vital, e são usados por certas habilidades. Você inicia com 4 pontos de " +
      "estamina, e recebe mais 4 a cada nível. Você os recupera por completo em um descanso longo, " +
      "ou metade em um descanso curto.\n\n" +
      "Além disso, você possui um Estilo Marcial, explicado após as habilidades da especialização.",
    // Escolha aninhada: 1 Dádiva do Céu a cada 4 níveis, a partir do 4°.
    // Respeito Celeste (8°) concede mais, do MESMO pool.
    // ⚠ ARSENAL AMALDIÇOADO e ESTILO MARCIAL são citados aqui mas o texto
    // deles NÃO foi enviado. Pendências de conteúdo.
    escolha: {
      id: "dadiva_do_ceu",
      label: "Dádiva do Céu",
      niveis: [4, 8, 12, 16, 20],
      opcoes: DADIVAS_DO_CEU,
    },
    requisitos: [],
  },
  {
    id: "res_ataque_furtivo",
    nome: "Ataque Furtivo",
    especializacaoId: "restringido",
    tipo: "base",
    nivel: 2,
    descricao:
      "Uma vez por turno, ao realizar um ataque surpresa ou contra um inimigo desprevenido, você " +
      "pode adicionar 1d8 ao dano dele. Caso você esteja flanqueando um inimigo, não é necessário " +
      "ser um ataque surpresa ou um alvo desprevenido para aplicar o dano adicional. No nível 3, o " +
      "dano se torna 2d8, no nível 6 se torna 3d8, no nível 9 se torna 4d8, no nível 12 se torna " +
      "5d8, no nível 15 se torna 6d8.",
    requisitos: [],
  },
  {
    id: "res_versatilidade",
    nome: "Versatilidade",
    especializacaoId: "restringido",
    tipo: "base",
    nivel: 2,
    descricao:
      "Você pretende se tornar um pouco mais versátil em tudo. Você recebe +1 em todas as " +
      "perícias. No 10° nível esse bônus se torna +2.",
    requisitos: [],
  },
  {
    id: "res_esquiva_sobre_humana",
    nome: "Esquiva Sobre-humana",
    especializacaoId: "restringido",
    tipo: "base",
    nivel: 3,
    descricao:
      "Você recebe +1 em sua Defesa e em rolagens de Reflexos. No nível 9 e no nível 16, esse " +
      "bônus aumenta em +1. Além disso, a partir do 10° nível, o valor necessário para obter um " +
      "sucesso crítico nela reduz em um valor igual a metade do seu bônus de treinamento.",
    requisitos: [],
  },
  {
    id: "res_implemento_celeste",
    nome: "Implemento Celeste",
    especializacaoId: "restringido",
    tipo: "base",
    nivel: 4,
    descricao:
      "Você recebe +2 na CD de suas habilidades de restringido e técnicas marciais. Esse bônus " +
      "aumenta em 1 nos níveis 8° e 16° de Restringido.",
    requisitos: [],
  },
  {
    id: "res_teste_de_resistencia_mestre",
    nome: "Teste de Resistência Mestre",
    especializacaoId: "restringido",
    tipo: "base",
    nivel: 9,
    descricao:
      "Você se torna mestre nos dois Testes de Resistência conferidos por sua Especialização.",
    // ⚠ DIFERE das outras 5: aqui são os DOIS TRs da especialização, e não
    // "treinado num segundo e mestre no concedido". Transcrito verbatim.
    requisitos: [],
  },
  {
    id: "res_restricao_definitiva",
    nome: "Restrição Definitiva",
    especializacaoId: "restringido",
    tipo: "base",
    nivel: 10,
    descricao:
      "Seu nível de energia amaldiçoada alcançou o zero absoluto, rejeitando-a por completo em " +
      "troca de um físico absoluto. Você recebe os seguintes benefícios:\n\n" +
      "• Você tem vantagem em testes de furtividade contra qualquer usuário de energia amaldiçoada " +
      "e eles possuem desvantagem em testes para o perceber.\n" +
      "• Você passa a ver o traçado da alma (veja página 312), assim como não necessita mais de uma " +
      "ferramenta amaldiçoada para enxergar maldições.\n" +
      "• Toda arma que você manejar conta como um nível de dano acima e seu valor de deslocamento " +
      "aumenta em 3 metros.\n" +
      "• Se for mestre em uma perícia ou teste de resistência que utilize Força, Destreza ou " +
      "Constituição você soma seu bônus de treinamento inteiro ao invés de metade dele na perícia.\n" +
      "• Você se torna imune a expansões de domínio, veja a página 246.",
    requisitos: [],
  },
  {
    id: "res_libertacao_do_destino",
    nome: "Libertação do Destino",
    especializacaoId: "restringido",
    tipo: "base",
    nivel: 20,
    descricao:
      "Subvertendo a sua restrição celeste, você se libertou completamente do destino, alcançando " +
      "um nível de poder invejável e único para um ser humano como você. Você recebe resistência a " +
      "todo tipo de dano físico (cortante, perfurante e de impacto), além de mais um tipo de dano a " +
      "sua escolha, exceto na alma. Você também recebe +5 em rolagens de ataque e soma metade do " +
      "seu nível de personagem no total de dano.",
    requisitos: [],
  },

  /* ---------------- RESTRINGIDO · POR NÍVEL (2° nível) ----------------
     ⚠ Ataque Inconsequente vem antes de Apropriar-se na lista do autor,
     quebrando a ordem alfabética. Mantida a ordem que ele mandou. */
  {
    id: "res_ataque_inconsequente",
    nome: "Ataque Inconsequente",
    especializacaoId: "restringido",
    tipo: "nivel",
    nivel: 2,
    descricao:
      "Uma vez por rodada, ao realizar um ataque, você pode escolher atacar inconsequentemente: " +
      "Você recebe vantagem na jogada de ataque e +5 na rolagem de dano dele. Porém, ao realizar " +
      "um golpe inconsequente você fica Desprevenido por 1 rodada.",
    requisitos: [],
  },
  {
    id: "res_apropriar_se",
    nome: "Apropriar-se",
    especializacaoId: "restringido",
    tipo: "nivel",
    nivel: 2,
    descricao: "Você recebe um bônus de +3 em testes para Desarmar ou evitar ser desarmado.",
    requisitos: [],
  },
  {
    id: "res_aproximacao_instintiva",
    nome: "Aproximação Instintiva",
    especializacaoId: "restringido",
    tipo: "nivel",
    nivel: 2,
    descricao:
      "Quando um inimigo termina o turno dentro de uma distância igual a metade do seu " +
      "deslocamento você pode, como uma ação livre, se mover até metade do seu movimento para um " +
      "espaço mais próximo do inimigo. Essa movimentação não causa ataques de oportunidade e " +
      "ignora terreno difícil. Caso, com essa movimentação, a criatura acabe em seu alcance de " +
      "ataque, você pode gastar 2 pontos de estamina para realizar uma manobra contra ela.",
    requisitos: [],
  },
  {
    id: "res_existencia_imperceptivel",
    nome: "Existência Imperceptível",
    especializacaoId: "restringido",
    tipo: "nivel",
    nivel: 2,
    descricao:
      "Com níveis mínimos de energia, você sabe como se esconder e tornar sua existência em algo " +
      "imperceptível. Você recebe um bônus de +2 em rolagens de Furtividade. Além disso, sua " +
      "penalidade em Furtividade por atacar e fazer outras ações chamativas é reduzida para -4.",
    requisitos: [],
  },
  {
    id: "res_finta_melhorada",
    nome: "Finta Melhorada",
    especializacaoId: "restringido",
    tipo: "nivel",
    nivel: 2,
    descricao:
      "Você encontra uma maneira de desenvolver a finta, sendo mais difícil prever seu próximo " +
      "movimento. Você passa a poder somar o seu Modificador de Destreza, ao invés de Presença, em " +
      "rolagens de Enganação para fintar. Além disso, acertar um inimigo desprevenido pela sua " +
      "finta causa um dado de dano adicional.",
    requisitos: [],
  },
  {
    id: "res_golpe_impactante",
    nome: "Golpe Impactante",
    especializacaoId: "restringido",
    tipo: "nivel",
    nivel: 2,
    descricao:
      "Seu primeiro golpe encaixado é acompanhado de um grande impacto. Uma vez por rodada, ao " +
      "realizar um ataque corpo a corpo contra um alvo, você pode também, como parte do mesmo " +
      "ataque, realizar a ação de Empurrar contra o mesmo alvo. Caso tenha sucesso em empurrar, " +
      "ele recebe Xd6 de dano adicional, onde X é igual a metade do seu modificador de Força.",
    requisitos: [],
  },
  {
    id: "res_imitacao",
    nome: "Imitação",
    especializacaoId: "restringido",
    tipo: "nivel",
    nivel: 2,
    descricao:
      "Você consegue imitar técnicas e estilos de combate de outras pessoas, desde que tal não " +
      "dependa da energia amaldiçoada. Ao ver uma habilidade ativa de especialização marcial, " +
      "manobra ou postura, você pode escolher a copiar como uma reação, e deve a usar no seu " +
      "próximo turno, ou perderá a cópia. Você só pode manter uma coisa copiada por vez, e só usa " +
      "uma vez cada uma delas. Porém, quando copiar algo, você pode tentar aprender aquilo, " +
      "realizando um teste de percepção com CD35, a qual diminui em 2 para cada vez que você " +
      "copiar a mesma habilidade e tentar a aprender. Se suceder em aprender, você não precisa ver " +
      "alguém a usando para poder copiar, necessitando de uma ação bônus, e a quantidade de usos " +
      "se torna a quantidade padrão da habilidade, ao invés de uma só. Você pode aprender uma " +
      "habilidade ativa e uma postura ou manobra; durante um interlúdio você pode escolher trocar " +
      "uma habilidade aprendida por outra que possa ver durante o interlúdio, tentando a copiar " +
      "com o teste de percepção, o qual é feito com vantagem. Caso o que for copiado gaste energia " +
      "amaldiçoada, você paga o custo em pontos de estamina.",
    // ⚠ Cópia em TEMPO DE MESA (ver alguém usar, reação, teste de Percepção).
    // Não é escolha de ficha, ao contrário do Roubo de Habilidade. Fica texto.
    requisitos: [],
  },
  {
    id: "res_manejo_superior",
    nome: "Manejo Superior",
    especializacaoId: "restringido",
    tipo: "nivel",
    nivel: 2,
    descricao:
      "Você sabe manejar armas como ninguém, extraindo seu máximo. O dano de toda arma que você " +
      "manejar conta como um nível acima e suas rolagens de dano recebem um bônus igual ao seu " +
      "bônus de treinamento.",
    requisitos: [],
  },
  {
    id: "res_roubo_de_habilidade",
    nome: "Roubo de Habilidade",
    especializacaoId: "restringido",
    tipo: "nivel",
    nivel: 2,
    descricao:
      "Em busca de se adaptar, você consegue até mesmo roubar as habilidades dos outros. Ao obter " +
      "essa habilidade, você pode aprender uma habilidade de Especialista em Combate ou Lutador, " +
      "desde que tal não dependa do uso de energia amaldiçoada. Você usa seus níveis de Restringido " +
      "para os requisitos. Você pode pegar essa habilidade uma quantidade de vezes igual ao seu " +
      "bônus de treinamento, roubando habilidades diferentes. Você não pode roubar habilidades base " +
      "das outras especializações, exceto Golpe Especial.",
    // ⚠ ESCOLHA ANINHADA DE POOL COMPUTADO, único caso do sistema: o pool não
    // é uma lista literal, é uma CONSULTA ao próprio catálogo (habilidades por
    // nível de Combatente e Lutador, mais Golpe Especial). Por isso `opcoes` é
    // preenchido DEPOIS da construção do array (ver HABILIDADES_ROUBAVEIS).
    //
    // `limite: "bt"` porque a quantidade é o Bônus de Treinamento, não o
    // tamanho do pool (que é o padrão dos repetíveis).
    //
    // ⚠ O filtro "não dependa do uso de energia amaldiçoada" NÃO está
    // aplicado: não existe marca de custo em PE no catálogo e adivinhar pelo
    // texto erraria. Decisão pendente do autor (ver docs/afty-status.md).
    escolha: {
      id: "roubo_habilidade",
      label: "Habilidade Roubada",
      niveis: [2],
      opcoes: [],          // preenchido abaixo, após o catálogo existir
      repetivel: true,
      limite: "bt",
      // 127 opções não cabem numa lista corrida: o pool é TABULADO nos mesmos
      // dois eixos do card de Habilidades (especialização e depois nível).
      // Ver abasDeOpcoes(). É o único pool grande o bastante para precisar.
      abas: ["especializacao", "nivel"],
    },
    requisitos: [],
  },
  {
    id: "res_surto_de_adrenalina",
    nome: "Surto de Adrenalina",
    especializacaoId: "restringido",
    tipo: "nivel",
    nivel: 2,
    descricao:
      "Como uma ação livre, você pode gastar 3 pontos de estamina para entrar em um estado onde " +
      "seu corpo está no limite. Enquanto em um surto de adrenalina, você recebe os seguintes " +
      "benefícios: você recebe redução de dano a todos os tipos de dano igual a metade do seu " +
      "nível de personagem, você recebe um bônus igual a 1 + metade do seu bônus de treinamento em " +
      "testes de resistência de fortitude e reflexos, e você recebe um bônus em percepção igual ao " +
      "seu bônus de treinamento. Um surto dura uma rodada, e você pode gastar 1 ponto de estamina " +
      "adicional para cada rodada após a primeira que deseje o manter ativo.",
    requisitos: [],
  },
  {
    id: "res_valorizar_invocacao",
    nome: "Valorizar Invocação",
    especializacaoId: "restringido",
    tipo: "nivel",
    nivel: 2,
    descricao:
      "Tendo domado maldições, elas se tornam invocações úteis dentro de combate, e você passa a " +
      "valorizar elas quando necessário. Caso uma das suas invocações dentro de 3 metros vá ser " +
      "exorcizada, você pode gastar 1 ponto de estamina e usar sua reação para se colocar a frente " +
      "dela, recebendo o golpe letal em troca de manter a invocação viva. Caso vá defender uma " +
      "invocação, você recebe pontos de vida temporários igual ao seu nível de personagem.",
    // ⚠ Depende de DOMAR MALDIÇÕES, que o autor declarou FORA DE ESCOPO para
    // criação de ficha (2026-07-17, ver docs/afty-invocacoes.md).
    requisitos: [],
  },

  /* ---------------- RESTRINGIDO · POR NÍVEL (4° nível) ---------------- */
  {
    id: "res_acao_agil",
    nome: "Ação Ágil",
    especializacaoId: "restringido",
    tipo: "nivel",
    nivel: 4,
    descricao:
      "Você otimiza o seu tempo de ação. Uma vez por turno você pode gastar 2 PE para receber uma " +
      "Ação Ágil, a qual pode ser utilizada para: Andar, Desengajar ou Esconder.",
    // ⚠ O livro escreve "2 PE", mas Restringido NÃO TEM energia amaldiçoada:
    // o recurso dele é Ponto de Estamina. Provável copiar-colar da homônima do
    // Lutador (lut_acao_agil). Transcrito verbatim. CONFIRMAR com o autor.
    requisitos: [],
  },
  {
    id: "res_adrenalina_intensificadora",
    nome: "Adrenalina Intensificadora",
    especializacaoId: "restringido",
    tipo: "nivel",
    nivel: 4,
    descricao:
      "Sua adrenalina também intensifica o seu corpo e as suas capacidades. Ao entrar em um surto " +
      "de adrenalina, você pode escolher pagar 2 pontos de estamina adicionais para poder " +
      "distribuir um bônus de +4 entre as perícias de Atletismo e Acrobacia, da maneira que " +
      "desejar (+3 em uma e +1 em outra, por exemplo), além de poder pagar 1 ponto de estamina " +
      "para se conceder vantagem em uma rolagem de Atletismo e Acrobacia, uma vez por cena cada. " +
      "Ao obter a Restrição Definitiva, o bônus de +4 se torna +8.",
    requisitos: [],
  },
  {
    id: "res_cacador_de_feiticeiros",
    nome: "Caçador de Feiticeiros",
    especializacaoId: "restringido",
    tipo: "nivel",
    nivel: 4,
    descricao:
      "Sua especialização é conseguir lidar com feiticeiros, preparando-se para os caçar, tanto " +
      "resistindo melhor quanto destruindo melhor. No começo de uma cena você pode gastar 2 pontos " +
      "de estamina para receber 2 de RD, +1 em testes de resistência e ataques, além de causar " +
      "+1d6 de dano contra todos os feiticeiros presentes na cena. A cada 5 níveis você pode " +
      "gastar mais 2 pontos para aumentar os bônus; +2 de RD, +1 de bônus e +1d6 de dano para cada " +
      "2 pontos adicionais.",
    requisitos: [],
  },
  {
    id: "res_desenvolver_ideias",
    nome: "Desenvolver Ideias",
    especializacaoId: "restringido",
    tipo: "nivel",
    nivel: 4,
    descricao:
      "Você tem uma percepção de como desenvolver as suas ideias de técnicas marciais e manobras, " +
      "expandindo o seu repertório. Você recebe duas técnicas marciais adicionais ao obter essa " +
      "habilidade.",
    // ⚠ "Técnicas marciais" pertencem ao ESTILO MARCIAL, cujo texto não foi
    // enviado. Pendência de conteúdo.
    requisitos: [],
  },
  {
    id: "res_foco_no_inimigo",
    nome: "Foco no Inimigo",
    especializacaoId: "restringido",
    tipo: "nivel",
    nivel: 4,
    descricao:
      "Ao iniciar um combate, você pode gastar 2 pontos de estamina e escolher um inimigo para ser " +
      "seu foco. Ao atacar o inimigo que é seu foco você recebe um bônus de +2 para acertar e " +
      "causa 1d6 de dano a mais, que aumenta para 1d8 no nível 6, 1d10 no nível 12 e 1d12 no nível " +
      "16, além de receber +5 em testes de Percepção para procurar o inimigo e em sua Atenção " +
      "contra ele. Ao matar o inimigo em que você possui foco, você pode usar sua reação para " +
      "passar o foco para outro inimigo dentro de 9 metros de você. Caso ataque outra criatura que " +
      "não seja seu foco, a habilidade se encerra.",
    requisitos: [],
  },
  {
    id: "res_ponto_cego",
    nome: "Ponto Cego",
    especializacaoId: "restringido",
    tipo: "nivel",
    nivel: 4,
    descricao:
      "Você consegue sempre perceber um ponto cego na guarda do inimigo, se posicionando em tal. " +
      "Se mover pelo espaço de um inimigo não conta como terreno difícil, e sempre que você " +
      "estiver no espaço de um inimigo, você recebe camuflagem leve, fazendo com que ataques " +
      "contra você tenham 20% de chance de falhar (1 ou 2 em 1d10). A partir do 10° nível, você " +
      "pode realizar uma rolagem de furtividade contra um alvo o qual esteja dentro do espaço " +
      "dele; caso seu resultado seja superior ao valor de atenção dele, você passa a receber uma " +
      "camuflagem total, fazendo com seus ataques tenham 40% de chance de falhar (1 a 4 em 1d10).",
    requisitos: [],
  },
  {
    id: "res_resiliencia_pela_adrenalina",
    nome: "Resiliência pela Adrenalina",
    especializacaoId: "restringido",
    tipo: "nivel",
    nivel: 4,
    descricao:
      "A adrenalina pulsando no seu corpo o deixa mais resiliente e resistente. Sempre que você " +
      "realizar um teste de resistência durante um Surto de Adrenalina, você pode pagar 1 ponto de " +
      "estamina para adicionar 2d3 ao resultado. Caso seja um teste em que você não seja treinado, " +
      "e se você falhar, você pode rolar novamente.",
    requisitos: [{ tipo: "habilidade", id: "res_surto_de_adrenalina" }],
  },
  {
    id: "res_tecnicas_de_memorizacao",
    nome: "Técnicas de Memorização",
    especializacaoId: "restringido",
    tipo: "nivel",
    nivel: 4,
    descricao:
      "Você estuda e se versa em uma maneira de conseguir memorizar uma quantidade maior de " +
      "fatores. Ao obter essa habilidade, você pode aprender uma habilidade adicional a partir da " +
      "Imitação. Caso tenha a habilidade Imitação Perfeita, você pode aprender mais uma habilidade " +
      "adicional.",
    requisitos: [{ tipo: "habilidade", id: "res_imitacao" }],
  },

  /* ---------------- RESTRINGIDO · POR NÍVEL (6° nível) ---------------- */
  {
    id: "res_aprimoramento_celeste",
    nome: "Aprimoramento Celeste",
    especializacaoId: "restringido",
    tipo: "nivel",
    nivel: 6,
    descricao:
      "Você passa a somar metade do modificador do seu atributo chave em sua CD de Especialização.",
    requisitos: [],
  },
  {
    id: "res_ataque_extra",
    nome: "Ataque Extra",
    especializacaoId: "restringido",
    tipo: "nivel",
    nivel: 6,
    descricao:
      "Você consegue atacar mais rápido, otimizando seus golpes. Ao realizar a ação Atacar, você " +
      "pode gastar 2 pontos de estamina para atacar duas vezes ao invés de uma.",
    requisitos: [],
  },
  {
    id: "res_ataque_inconsequente_aprimorado",
    nome: "Ataque Inconsequente Aprimorado",
    especializacaoId: "restringido",
    tipo: "nivel",
    nivel: 6,
    descricao:
      "O bônus em dano ao usar o ataque inconsequente aumenta para +10 e, ao utilizar a " +
      "habilidade, você recebe 2d6+4 pontos de vida temporária.",
    requisitos: [{ tipo: "habilidade", id: "res_ataque_inconsequente" }],
  },
  {
    id: "res_corpo_de_aco",
    nome: "Corpo de Aço",
    especializacaoId: "restringido",
    tipo: "nivel",
    nivel: 6,
    descricao:
      "Seu corpo é tão duro quanto o aço e não se curva, mantendo sua integridade. Seus pontos de " +
      "vida máximos aumentam em um valor igual ao seu valor de Constituição, e você pode pagar 2 " +
      "pontos de estamina para, durante uma cena, se curar em um valor igual a 2d8 + seu " +
      "modificador de constituição no começo de todo turno seu. No nível 10, você pode pagar 1 " +
      "ponto de estamina adicional para aumentar a cura em 1d8, assim como pode pagar mais 1 ponto " +
      "no nível 15 para aumentar novamente.",
    // ⚠ PV += VALOR de Constituição (não o modificador). Raro no sistema.
    requisitos: [],
  },
  {
    id: "res_corredor_fantasma",
    nome: "Corredor Fantasma",
    especializacaoId: "restringido",
    tipo: "nivel",
    nivel: 6,
    descricao:
      "Ao se mover, você pode utilizar o movimento para andar em paredes, no entanto, não pode " +
      "terminar seu turno em uma. Caso termine, você cai, respeitando as regras de queda. Você " +
      "recebe um bônus de +2 em testes para reduzir dano de queda. Caso possua a dádiva Agilidade " +
      "Exímia, você pode correr em tetos.",
    // Referência à Dádiva Agilidade Exímia: verificável quando a escolha
    // aninhada virar requisito (existe o tipo `escolha`), mas o efeito é
    // narrativo, então segue como texto.
    requisitos: [],
  },
  {
    id: "res_disparada_trovejante",
    nome: "Disparada Trovejante",
    especializacaoId: "restringido",
    tipo: "nivel",
    nivel: 6,
    descricao:
      "Você consegue usar da sua agilidade para disparar como um trovão em reação a um golpe. Ao " +
      "receber um ataque corpo-a-corpo, você pode gastar 3 pontos de estamina para reduzir o dano " +
      "a metade e se mover até 4,5 metros para longe do atacante.",
    requisitos: [],
  },
  {
    id: "res_frenesi",
    nome: "Frenesi",
    especializacaoId: "restringido",
    tipo: "nivel",
    nivel: 6,
    descricao:
      "Durante o Surto de Adrenalina, você assume um frenesi intenso que aumenta o potencial " +
      "ofensivo dos seus golpes: sempre que realizar um ataque, ele causa +4 de dano adicional. No " +
      "12° nível, esse bônus se torna +8, no 16° nível ele se torna +12.",
    requisitos: [{ tipo: "habilidade", id: "res_surto_de_adrenalina" }],
  },
  {
    id: "res_movimento_reativo",
    nome: "Movimento Reativo",
    especializacaoId: "restringido",
    tipo: "nivel",
    nivel: 6,
    descricao:
      "Uma vez por rodada, quando um oponente dentro de um alcance igual ao seu movimento iniciar " +
      "a realização de uma ação que permitiria o uso de um ataque de oportunidade, você pode " +
      "gastar 2 pontos de estamina para se locomover até ele com uma ação livre, e então gastar " +
      "sua reação para executar o ataque de oportunidade.",
    requisitos: [],
  },

  /* ---------------- RESTRINGIDO · POR NÍVEL (8° nível) ---------------- */
  {
    id: "res_ainda_de_pe",
    nome: "Ainda de Pé",
    especializacaoId: "restringido",
    tipo: "nivel",
    nivel: 8,
    descricao:
      "Uma vez por descanso curto ou longo, quando você for chegar a 0 pontos de vida e cair você " +
      "pode escolher se manter de pé e curar em 3d10 + nível de personagem, aumentando em +1d10 " +
      "nos níveis 12, 16 e 20. Caso o dano fosse suficiente para ser uma morte instantânea, você " +
      "apenas resiste e fica com 1 de vida, caindo com uma falha no próximo dano que receber. Se " +
      "você morrer, você morre de pé.",
    requisitos: [],
  },
  {
    id: "res_arremetida_encoberta",
    nome: "Arremetida Encoberta",
    especializacaoId: "restringido",
    tipo: "nivel",
    nivel: 8,
    descricao:
      "Ao realizar o Ataque Furtivo da rodada, você recebe vantagem no golpe. Caso o acerto dele já " +
      "tenha sido garantido por qualquer motivo, você recebe +1d no dano do Ataque Furtivo.",
    requisitos: [],
  },
  {
    id: "res_barreira_inamovivel",
    nome: "Barreira Inamovível",
    especializacaoId: "restringido",
    tipo: "nivel",
    nivel: 8,
    descricao:
      "Sempre que você fizer um teste de resistência de Fortitude e o resultado natural do dado " +
      "for menor do que seu modificador de Constituição, você pode gastar 2 pontos de estamina " +
      "para transformar o resultado natural do dado no seu modificador de Constituição. Você não " +
      "pode ser movido a força e tem vantagem para resistir a ser agarrado.",
    requisitos: [],
  },
  {
    id: "res_forca_imparavel",
    nome: "Força Imparável",
    especializacaoId: "restringido",
    tipo: "nivel",
    nivel: 8,
    descricao:
      "Sempre que você fizer um TR de Reflexos e o resultado natural do dado for menor do que seu " +
      "modificador de Destreza, você pode gastar 2 pontos de estamina para transformar o resultado " +
      "natural do dado no seu modificador de Destreza. Você se torna treinado em um teste de " +
      "resistência à sua escolha e mestre em outro TR no qual já seja treinado.",
    requisitos: [],
  },
  {
    id: "res_imitacao_perfeita",
    nome: "Imitação Perfeita",
    especializacaoId: "restringido",
    tipo: "nivel",
    nivel: 8,
    descricao:
      "Você desenvolve a habilidade de imitação. Você se torna capaz de copiar habilidades " +
      "passivas de especializações marciais e estilos de combate. Ao copiá-las, o efeito dura até " +
      "o final do seu próximo turno. Você passa a poder aprender também uma habilidade passiva e " +
      "um estilo de combate, mas é mais difícil, por ser algo sutil; a CD é igual a 40, e continua " +
      "diminuindo em 2 por tentativa na mesma habilidade.",
    requisitos: [{ tipo: "habilidade", id: "res_imitacao" }],
  },
  {
    id: "res_presenca_ameacadora",
    nome: "Presença Ameaçadora",
    especializacaoId: "restringido",
    tipo: "nivel",
    nivel: 8,
    descricao:
      "Sua mera presença é ameaçadora, de tão poderoso você se mostra, mesmo sem energia " +
      "amaldiçoada. Você pode gastar 1 ponto de estamina para demarcar a sua presença, fazendo com " +
      "que toda criatura que consiga o ver realize um teste de resistência de vontade. Em uma " +
      "falha, a criatura fica amedrontada por 2 rodadas, em um sucesso, fica abalada. Você só pode " +
      "usar essa habilidade uma vez por cena em cada criatura.",
    requisitos: [],
  },
  {
    id: "res_reacao_rapida",
    nome: "Reação Rápida",
    especializacaoId: "restringido",
    tipo: "nivel",
    nivel: 8,
    descricao:
      "Com um tempo de reação grandemente desenvolvido, você consegue incitar o seu corpo a reagir " +
      "com uma rapidez extrema. Caso já tenha gasto a sua reação, você pode pagar 2 pontos de " +
      "estamina para realizar uma reação adicional, uma vez por rodada.",
    requisitos: [],
  },
  {
    id: "res_respeito_celeste",
    nome: "Respeito Celeste",
    especializacaoId: "restringido",
    tipo: "nivel",
    nivel: 8,
    descricao:
      "Seu poder e desenvolvimento te garantem o respeito dos céus, que concedem a sua benção para " +
      "si. Ao obter essa habilidade, você recebe uma dádiva do céu adicional. A partir do nível 12, " +
      "você pode pegar esta habilidade outra vez.",
    // Concede +1 escolha do MESMO pool de Dádivas do Céu. REPETÍVEL (2x, a 2ª
    // a partir do nível 12), o que o shape de lista de ids únicos não suporta.
    requisitos: [],
  },

  /* ---------------- RESTRINGIDO · POR NÍVEL (10° nível) ---------------- */
  {
    id: "res_assassinar",
    nome: "Assassinar",
    especializacaoId: "restringido",
    tipo: "nivel",
    nivel: 10,
    descricao:
      "Durante o primeiro momento, você é capaz de extrair letalidade absoluta, golpeando um " +
      "inimigo desprevenido com um bote poderoso. Durante a primeira rodada de um combate, ao " +
      "atacar uma criatura desprevenida a partir da furtividade ou surpresa, seu primeiro ataque é " +
      "um crítico garantido.",
    requisitos: [],
  },
  {
    id: "res_mente_limpa",
    nome: "Mente Limpa",
    especializacaoId: "restringido",
    tipo: "nivel",
    nivel: 10,
    descricao:
      "Você recebe vantagem para resistir às seguintes condições: Amedrontado, Cego, Enfeitiçado e " +
      "Surdo.",
    requisitos: [],
  },
  {
    id: "res_perceber_o_ar",
    nome: "Perceber o Ar",
    especializacaoId: "restringido",
    tipo: "nivel",
    nivel: 10,
    descricao:
      "Sua visão se torna tão apurada que você consegue perceber o próprio ar, usando-o como uma " +
      "plataforma para se mover e apoiar. Você é imune a danos de queda, conseguindo se apoiar no " +
      "ar, desde que a altura não seja superior ao dobro do seu movimento. Ao pular você pode " +
      "realizar outro pulo em seguida, no nível 13 você pode dar dois pulos em seguida, e no nível " +
      "17 pode dar três pulos em seguida. Quando for alvo de um ataque, você pode gastar 2 pontos " +
      "de estamina e sua reação para realizar um teste de acrobacia contra um teste de reflexos do " +
      "atacante e, caso o resultado do seu teste supere o do atacante, você desvia do ataque.",
    requisitos: [],
  },
  {
    id: "res_precisao_forcada",
    nome: "Precisão Forçada",
    especializacaoId: "restringido",
    tipo: "nivel",
    nivel: 10,
    descricao:
      "Você consegue usar do seu físico impecável para forçar precisão absoluta em um golpe. Uma " +
      "vez por rodada, quando você faz um ataque corpo-a-corpo, você pode pagar 3 pontos de " +
      "estamina. Se acertar o ataque, causa dano máximo, sem necessidade de rolar danos.",
    requisitos: [],
  },
  {
    id: "res_retaliacao",
    nome: "Retaliação",
    especializacaoId: "restringido",
    tipo: "nivel",
    nivel: 10,
    descricao:
      "Se você receber dano de um inimigo que esteja dentro de seu alcance, você pode gastar 2 " +
      "pontos de estamina e usar sua reação para realizar um ataque contra ele.",
    requisitos: [],
  },

  /* ---------------- RESTRINGIDO · POR NÍVEL (12° nível) ---------------- */
  {
    id: "res_adrenalina_absoluta",
    nome: "Adrenalina Absoluta",
    especializacaoId: "restringido",
    tipo: "nivel",
    nivel: 12,
    descricao:
      "Enquanto está em um surto de adrenalina, você se torna absoluto, extraindo ao máximo o seu " +
      "potencial. Ao iniciar um surto de adrenalina, você pode escolher pagar 4 pontos para ativar " +
      "e 2 por rodada para manter e, caso o faça, você recebe os seguintes benefícios: enquanto " +
      "estiver em um surto de adrenalina, o seu ataque extra passa a custar 1 PE, você recebe +3 " +
      "metros de Deslocamento e a sua DEF aumenta em 2.",
    // ⚠ "1 PE" de novo, num Restringido que não tem PE. Ver res_acao_agil.
    requisitos: [],
  },
  {
    id: "res_pinaculo_fisico",
    nome: "Pináculo Físico",
    especializacaoId: "restringido",
    tipo: "nivel",
    nivel: 12,
    descricao:
      "Você recebe +4 pontos de estamina máximos e pode escolher aumentar o valor de dois " +
      "atributos entre Força, Destreza e Constituição em 2. No nível 16, o valor de ambos os " +
      "atributos escolhidos aumentam novamente em 2.",
    // ⚠ Eleva VALOR de dois atributos (2 no 12, mais 2 no 16). Precisa de
    // escolha aninhada de atributo, igual a Incremento de Atributo (talento).
    requisitos: [],
  },
  {
    id: "res_rejeitar_a_morte",
    nome: "Rejeitar a Morte",
    especializacaoId: "restringido",
    tipo: "nivel",
    nivel: 12,
    descricao:
      "Quando estiver nas portas da morte, você pode escolher receber uma falha garantida para " +
      "fazer um teste de Fortitude contra a CD X, sendo X igual a 15 + 1 para cada 3 pontos de " +
      "vida negativos. Se passar, você fica com 1 de vida e recebe 1 ponto de exaustão.",
    requisitos: [{ tipo: "habilidade", id: "res_ainda_de_pe" }],
  },

  /* ---------------- RESTRINGIDO · POR NÍVEL (16° nível) ---------------- */
  {
    id: "res_entre_as_sombras",
    nome: "Entre as Sombras",
    especializacaoId: "restringido",
    tipo: "nivel",
    nivel: 16,
    descricao:
      "Agora o Ataque Furtivo aplica quando você está em camuflagem ou cobertura. Além disso, " +
      "quando for realizar um Ataque Furtivo, você pode ignorar parcialmente as regras de vantagem " +
      "e acumular até uma vantagem adicional (totalizando 3d20). Caso ele seja um acerto " +
      "garantido, além do efeito normal, a sua margem de crítico é reduzida em 2.",
    requisitos: [{ tipo: "habilidade", id: "res_arremetida_encoberta" }],
  },
  {
    id: "res_instintos_agucados",
    nome: "Instintos Aguçados",
    especializacaoId: "restringido",
    tipo: "nivel",
    nivel: 16,
    descricao:
      "Enquanto seus pontos de estamina e de vida excederem metade do máximo deles, você recebe " +
      "uma reação adicional por rodada.",
    requisitos: [{ tipo: "habilidade", id: "res_reacao_rapida" }],
  },
  {
    id: "res_mesmo_morto",
    nome: "Mesmo Morto",
    especializacaoId: "restringido",
    tipo: "nivel",
    nivel: 16,
    descricao:
      "Mesmo se você não tiver mais força vital, é necessário continuar lutando até o limite. Ao " +
      "cair para 0 de vida, sem possuir um uso de Ainda de Pé, ao invés de ir para as Portas da " +
      "Morte você continua de pé e realizando seus turnos normalmente; porém, no final de todo " +
      "turno, você deve realizar um teste de resistência de Fortitude com CD25 + 1 para cada 5 " +
      "pontos de vida negativos que possuir. Caso falhe no teste, você cai imediatamente, com 1 " +
      "falha nos testes de morte.",
    // É a "Mesmo Morto" citada por Não Desista! (Suporte 12°).
    requisitos: [{ tipo: "habilidade", id: "res_rejeitar_a_morte" }],
  },
];

/**
 * Pool COMPUTADO do Roubo de Habilidade (Restringido).
 *
 * "você pode aprender uma habilidade de Especialista em Combate ou Lutador...
 * Você não pode roubar habilidades base das outras especializações, exceto
 * Golpe Especial."
 *
 * Logo: todas as habilidades POR NÍVEL de Combatente e Lutador, mais a Base
 * Golpe Especial do Combatente, que é aberta por exceção explícita.
 *
 * ⚠ O filtro "desde que tal não dependa do uso de energia amaldiçoada" NÃO
 * está aplicado. Não há marca de custo em PE no catálogo, e deduzir pelo texto
 * erraria em cima e embaixo. Decisão pendente do autor.
 *
 * O `nivel` de cada opção é preservado: "Você usa seus níveis de Restringido
 * para os requisitos", então o nível pedido pela habilidade original é
 * comparado com o nível de Restringido (que é o ND, já que a especialização é
 * exclusiva da Origem Restringido, que proíbe multiclasse).
 */
export const HABILIDADES_ROUBAVEIS = AFTY_HABILIDADES.filter(
  (h) =>
    (h.especializacaoId === "combatente" || h.especializacaoId === "lutador") &&
    (h.tipo === "nivel" || h.id === "cmb_golpe_especial")
).map((h) => ({
  id: h.id,
  nome: h.nome,
  descricao: h.descricao,
  nivelMin: h.nivel,
  // Carregado para o pool poder ser TABULADO por especialização (são 127
  // opções, um paredão sem abas). Ver `escolha.abas` do Roubo de Habilidade.
  especializacaoId: h.especializacaoId,
}));

// O pool só pode ser montado DEPOIS do catálogo existir (ele consulta o
// próprio array), então a habilidade dona recebe as opções aqui.
AFTY_HABILIDADES.find((h) => h.id === "res_roubo_de_habilidade").escolha.opcoes = HABILIDADES_ROUBAVEIS;

const BY_ID = Object.fromEntries(AFTY_HABILIDADES.map((h) => [h.id, h]));

export const getHabilidade = (id) => BY_ID[id] || null;

/** Habilidades de uma especialização (opcionalmente de um tipo), na ordem do catálogo. */
export const habilidadesDaEspecializacao = (espId, tipo) =>
  AFTY_HABILIDADES.filter((h) => h.especializacaoId === espId && (!tipo || h.tipo === tipo));

/**
 * Quantas Habilidades de Especialização a criatura PODE ter.
 *
 * ⚠ REGRA DO AFTY, que DIVERGE do livro de propósito (autor, 2026-07-17):
 * 1 no ND 1, mais 1 a cada 3 ND — a mesma fórmula das Aptidões Amaldiçoadas.
 * O livro diz "no 2° nível e a cada nível seguinte" (= ND-1). Não trocar.
 *
 * O orçamento é ÚNICO (vem do ND total, não do nível de cada especialização)
 * e cobre Base e por Nível juntas.
 */
export const totalHabilidades = (nd) => 1 + Math.floor(Math.max(1, nd) / 3);

/**
 * Quantos Estilos de Combate (ou escolha aninhada equivalente) a habilidade
 * concede no nível atual DAQUELA especialização. Ex.: Repertório do
 * Especialista tem niveis [1, 6, 12] → 1 estilo no nível 1, 2 no 6, 3 no 12.
 */
export function escolhasConcedidas(habilidade, nivelEspec) {
  if (!habilidade?.escolha) return 0;
  return habilidade.escolha.niveis.filter((n) => nivelEspec >= n).length;
}

/**
 * Quantas opções a criatura PODE escolher numa habilidade de escolha aninhada,
 * no nível atual da especialização dona.
 *
 * - Não-repetível (ex.: Apogeu): a própria habilidade concede N escolhas
 *   conforme o nível (escolhasConcedidas), todas de graça dentro dela.
 * - Repetível (ex.: Melhoria de Controlador, "uma para cada melhoria"): pode
 *   escolher até uma de cada opção do pool, e CADA escolha consome uma vaga de
 *   Habilidade (ver resolveEscolhasHabilidade). O nível só precisa alcançar a
 *   habilidade (já garantido antes de chegar aqui).
 */
export function escolhasMaximas(habilidade, nivelEspec, bt = 0) {
  if (!habilidade?.escolha) return 0;
  if (habilidade.escolha.repetivel) {
    // Roubo de Habilidade limita pelo Bônus de Treinamento, não pelo tamanho
    // do pool ("uma quantidade de vezes igual ao seu bônus de treinamento").
    // Sem `limite`, vale o padrão: uma de cada opção (Melhoria de Controlador).
    if (habilidade.escolha.limite === "bt") return Math.min(bt, habilidade.escolha.opcoes.length);
    return habilidade.escolha.opcoes.length;
  }
  return escolhasConcedidas(habilidade, nivelEspec);
}

/**
 * Resolve as escolhas aninhadas da ficha (Estilo de Controle, Melhoria...).
 *
 * Guarda escolhas, nunca resultados: sanitiza contra o pool e o nível, mas
 * NÃO remove excedente (o padrão do projeto é reportar em vermelho, não
 * bloquear). Só considera habilidades que estão ESCOLHIDAS e têm `escolha`.
 *
 * ctx = { escolhidasIds: [habId], niveisPorEspec, escolhasHabilidade }.
 * Retorna { porHab: { [habId]: { opcoes, allowance, repetivel, excedeu } },
 *           mapa: { [habId]: [opcaoId] }, vagasExtras } — vagasExtras é quanto
 * as escolhas repetíveis gastam ALÉM da vaga da própria habilidade.
 */
export function resolveEscolhasHabilidade({ escolhidasIds = [], niveisPorEspec = {}, escolhasHabilidade = {}, bt = 0 } = {}) {
  const porHab = {};
  const mapa = {};
  let vagasExtras = 0;
  for (const habId of escolhidasIds) {
    const hab = BY_ID[habId];
    if (!hab?.escolha) continue;
    const opcoesValidas = new Set(hab.escolha.opcoes.map((o) => o.id));
    const brutas = Array.isArray(escolhasHabilidade?.[habId]) ? escolhasHabilidade[habId] : [];
    const vistos = new Set();
    const opcoes = [];
    for (const id of brutas) {
      if (!opcoesValidas.has(id) || vistos.has(id)) continue;
      vistos.add(id);
      opcoes.push(id);
    }
    const nivelEspec = niveisPorEspec?.[hab.especializacaoId] ?? 0;
    const allowance = escolhasMaximas(hab, nivelEspec, bt);
    porHab[habId] = { opcoes, allowance, repetivel: !!hab.escolha.repetivel, excedeu: opcoes.length > allowance };
    mapa[habId] = opcoes;
    // Repetível: a 1ª escolha vem junto da vaga da própria habilidade; cada
    // escolha a mais custa uma vaga de Habilidade adicional.
    if (hab.escolha.repetivel) vagasExtras += Math.max(0, opcoes.length - 1);
  }
  return { porHab, mapa, vagasExtras };
}

/**
 * Grupos de exibição de uma especialização, na ordem do livro: as Bases
 * primeiro, depois as por Nível separadas por patamar ("Habilidades de 2°
 * Nível", "de 4° Nível"...), que é como o livro as apresenta.
 */
export function gruposDeHabilidade(espId) {
  const lista = habilidadesDaEspecializacao(espId);
  const grupos = [];
  const bases = lista.filter((h) => h.tipo === "base");
  if (bases.length) grupos.push({ id: "base", titulo: "Habilidades Base", habilidades: bases });

  const porNivel = lista.filter((h) => h.tipo === "nivel");
  const niveis = [...new Set(porNivel.map((h) => h.nivel))].sort((a, b) => a - b);
  for (const n of niveis) {
    grupos.push({
      id: `nivel_${n}`,
      titulo: `Habilidades de ${n}° Nível`,
      habilidades: porNivel.filter((h) => h.nivel === n),
    });
  }
  return grupos;
}

/**
 * Divide as opções de uma escolha aninhada em abas, por um eixo.
 *
 * Existe por causa do Roubo de Habilidade, cujo pool computado tem 127 opções
 * e vira um paredão numa lista corrida. Os eixos são os MESMOS do card de
 * Habilidades (`gruposDeHabilidade`), para a linguagem visual não mudar entre
 * escolher uma habilidade e roubar uma.
 *
 * Eixos:
 *   • "especializacao" → uma aba por especialização dona (Combatente, Lutador)
 *   • "nivel"          → uma aba por `nivelMin` (2°, 4°, 6°...)
 *
 * A ordem das abas segue a ordem em que os valores APARECEM no pool (o eixo
 * especialização), ou numérica crescente (o eixo nível). Abas vazias não
 * existem: só entra valor que algum item tem.
 *
 * Devolve [{ id, label, opcoes }].
 */
export function abasDeOpcoes(opcoes = [], eixo) {
  const buckets = new Map();
  for (const o of opcoes) {
    const chave = eixo === "nivel" ? o.nivelMin : o.especializacaoId;
    // Item sem o campo do eixo cairia num balde "undefined": vai para o fim,
    // rotulado, em vez de sumir da tela.
    const id = chave == null ? "outros" : String(chave);
    if (!buckets.has(id)) buckets.set(id, []);
    buckets.get(id).push(o);
  }

  const entradas = [...buckets.entries()];
  if (eixo === "nivel") {
    entradas.sort((a, b) => (a[0] === "outros" ? 1 : b[0] === "outros" ? -1 : Number(a[0]) - Number(b[0])));
  }

  return entradas.map(([id, lista]) => ({
    id,
    label:
      id === "outros" ? "Outros"
        : eixo === "nivel" ? `${id}°`
          : getEspecializacao(id)?.nome || id,
    opcoes: lista,
  }));
}

/**
 * Requisito EXTRA de uma habilidade (além do nível, que é implícito).
 * ctx = { escolhidas: [id], escolhasHabilidade: { [habId]: [opcaoId] } }.
 * Espelha avaliarRequisitoAptidao.
 */
export function avaliarRequisitoHabilidade(requisito, ctx = {}) {
  // Atributo mínimo (ex.: Sobrevivente pede Constituição 16). Usa o valor
  // EFETIVO, igual ao requisito homônimo das Aptidões.
  if (requisito?.tipo === "atributo") {
    const atual = ctx.attrEff?.[requisito.attr] ?? 0;
    return {
      ok: atual >= requisito.valor,
      verificavel: true,
      label: `${ATTR_LABEL[requisito.attr] || requisito.attr} ${requisito.valor}`,
    };
  }
  if (requisito?.tipo === "habilidade") {
    const alvo = BY_ID[requisito.id];
    // Referência pendente (habilidade ainda não transcrita): exibe e NÃO
    // bloqueia, senão a habilidade ficaria inalcançável.
    if (!alvo) return { ok: true, verificavel: false, label: requisito.id };
    return { ok: (ctx.escolhidas || []).includes(requisito.id), verificavel: true, label: alvo.nome };
  }
  // Aptidão Amaldiçoada exigida (ex.: Explosão Defensiva pede Cobrir-se). O
  // catálogo das 85 existe, então isto é VERIFICÁVEL e bloqueia de verdade.
  if (requisito?.tipo === "aptidao") {
    const alvo = getAptidao(requisito.id);
    if (!alvo) return { ok: true, verificavel: false, label: requisito.id };
    return { ok: (ctx.aptidoes || []).includes(requisito.id), verificavel: true, label: alvo.nome };
  }
  // Requer que uma OPÇÃO específica de uma escolha aninhada esteja escolhida
  // (ex.: Concentrar Poder exige Apogeu · Controle Concentrado). Verificável
  // agora que a ficha guarda escolhasHabilidade.
  if (requisito?.tipo === "escolha") {
    const escolhidasOpc = ctx.escolhasHabilidade?.[requisito.habId] || [];
    return { ok: escolhidasOpc.includes(requisito.opcaoId), verificavel: true, label: requisito.label };
  }
  // Requisito de sistema ainda não construído (armas, perícias): só exibe.
  if (requisito?.tipo === "nota") {
    return { ok: true, verificavel: false, label: requisito.texto };
  }
  return { ok: true, verificavel: true, label: null };
}

/**
 * Avalia o acesso a uma habilidade. O requisito PRINCIPAL é implícito e vem
 * do próprio catálogo: nível na especialização DONA >= habilidade.nivel.
 * O livro conta o nível da especialização, não o ND ("seu nível de
 * Especialista em Combate", "nos níveis 8° e 16° de Especialista em Combate").
 *
 * ctx = { niveisPorEspec: { [espId]: nivel }, escolhidas: [id] }.
 * Retorna { ok, nivelOk, faltam, label, titulo, extras }.
 */
export function avaliarAcessoHabilidade(habilidade, ctx = {}) {
  const esp = getEspecializacao(habilidade.especializacaoId);
  const nivel = ctx.niveisPorEspec?.[habilidade.especializacaoId] ?? 0;
  const nivelOk = nivel >= habilidade.nivel;
  const extras = (habilidade.requisitos || []).map((r) => avaliarRequisitoHabilidade(r, ctx));
  return {
    ok: nivelOk && extras.every((e) => e.ok),
    nivelOk,
    // Quanto falta, para a UI dizer "faltam N" (decisão do autor, roadmap).
    faltam: Math.max(0, habilidade.nivel - nivel),
    label: `${esp?.nome || habilidade.especializacaoId} ${habilidade.nivel}`,
    titulo: `Requer nível ${habilidade.nivel} em ${esp?.nome || habilidade.especializacaoId}`,
    extras,
  };
}

/** Mapa { [espId]: nivel } a partir do resolve de Especializações. */
export const niveisPorEspecializacao = (escolhidasEspec) =>
  Object.fromEntries((escolhidasEspec || []).map((e) => [e.id, e.nivel]));

/**
 * Resolve as Habilidades da ficha.
 *
 * Saneia a lista (ids existentes, sem duplicata) e devolve o orçamento.
 * Escolher habilidade que a criatura não alcança NÃO é impedido aqui: o
 * padrão do projeto é a UI travar e o motor só reportar (mesma postura dos
 * Interlúdios e Aptidões, onde estourar fica vermelho e não bloqueia).
 *
 * Retorna { escolhidas, total, gastos, restante, excedeu, inacessiveis }.
 */
/**
 * ============================================================
 * EFEITOS DE CONTROLADOR SOBRE INVOCAÇÕES (via Motor de Automação)
 * ============================================================
 * Efeitos ESTÁTICOS de ficha, escritos como fórmulas da DSL. Cada `expr` é
 * avaliada no contexto de CADA invocação (buildInvocacaoDslContext expõe grau,
 * bt, nd, nivel_controlador, atributos...), então a mesma fórmula cobre tanto
 * o que é igual para todas (bt * 5) quanto o que escala com o grau (1 + grau).
 * resolveInvocacao (afty-invocacoes.js) aplica canal a canal.
 *
 * Canais: pv, deslocamento, pericias, orcamentoLivre (grátis), orcamentoPago
 * (aumenta a capacidade, o custo por item segue o normal), atributoPontos,
 * bonusTeste.
 *
 * ⚠ SÓ entram aqui os efeitos NUMÉRICOS e INCONDICIONAIS de ficha. Tudo que é
 * posicional, por rodada, reação, escolha ou de campo/roster está listado como
 * "GAPS DO MOTOR" em docs/afty-invocacoes.md, para evoluir o Motor depois.
 */
export const CONTROLADOR_EFEITOS_INVOCACAO = {
  // Invocações Resistentes (2°): PV += BT x 5.
  ctr_invocacoes_resistentes: [{ canal: "pv", expr: "bt * 5" }],
  // Invocações Móveis (2°): +1,5 m, e +1,5 m nos níveis 6/12/18 de Controlador.
  ctr_invocacoes_moveis: [{ canal: "deslocamento", expr: "1.5 * (1 + (nivel_controlador >= 6) + (nivel_controlador >= 12) + (nivel_controlador >= 18))" }],
  // Invocações Treinadas (2°): +metade do BT em perícias treinadas.
  ctr_invocacoes_treinadas: [{ canal: "pericias", expr: "piso(bt / 2)" }],
  // Visionário (2°): +metade do BT em ações/características (o custo segue normal).
  ctr_visionario: [{ canal: "orcamentoPago", expr: "piso(bt / 2)" }],
  // Controle Aprimorado (base 4): +2 em testes da invocação, +1 por grau acima do quarto.
  ctr_controle_aprimorado: [{ canal: "bonusTeste", expr: "1 + grau" }],
  // Potencial Superior (4°): +2 pontos de atributo por grau da invocação.
  ctr_potencial_superior: [{ canal: "atributoPontos", expr: "2 * grau" }],
  // Ápice do Controle (base 20): +2 ações/características que NÃO custam PE.
  ctr_apice_do_controle: [{ canal: "orcamentoLivre", expr: "2" }],
  // Concentrar Poder (6°): benefícios em invocação MARCADA (quando: "marcada"),
  // por faixa de nível de Controlador (Inicial / 6 / 12 / 18). Escrito como
  // somas de degraus (cada comparação vale 1/0): Inicial é o termo base.
  //   PV       : +5 / +10 / +20 / +30
  //   Defesa   : +1 / +2  / +3  / +5
  //   TRs      : +0 / +2  / +3  / +5
  //   Dano/Cura: +1 / +2  / +3  / +5 níveis, e +0 / +3 / +5 / +10 ao total
  ctr_concentrar_poder: [
    { canal: "pv", quando: "marcada", expr: "5 + 5*(nivel_controlador >= 6) + 10*(nivel_controlador >= 12) + 10*(nivel_controlador >= 18)" },
    { canal: "defesa", quando: "marcada", expr: "1 + (nivel_controlador >= 6) + (nivel_controlador >= 12) + 2*(nivel_controlador >= 18)" },
    { canal: "bonusTR", quando: "marcada", expr: "2*(nivel_controlador >= 6) + (nivel_controlador >= 12) + 2*(nivel_controlador >= 18)" },
    { canal: "danoNivel", quando: "marcada", expr: "1 + (nivel_controlador >= 6) + (nivel_controlador >= 12) + 2*(nivel_controlador >= 18)" },
    { canal: "danoBonus", quando: "marcada", expr: "3*(nivel_controlador >= 6) + 2*(nivel_controlador >= 12) + 5*(nivel_controlador >= 18)" },
  ],
};

/** Efeitos de invocação concedidos pelas Habilidades de Controlador escolhidas. */
export function efeitosInvocacaoControlador(escolhidasIds = []) {
  const out = [];
  for (const id of Array.isArray(escolhidasIds) ? escolhidasIds : []) {
    const efs = CONTROLADOR_EFEITOS_INVOCACAO[id];
    if (efs) for (const e of efs) out.push({ ...e, origem: id, nome: BY_ID[id]?.nome || id });
  }
  return out;
}

export function resolveHabilidades(creature, escolhidasEspec, talentosGastos = 0, bt = 0) {
  const nd = Math.max(1, Math.trunc(Number(creature?.core?.nd) || 1));
  const niveisPorEspec = niveisPorEspecializacao(escolhidasEspec);
  const vistos = new Set();
  const escolhidas = [];
  for (const id of Array.isArray(creature?.habilidades) ? creature.habilidades : []) {
    if (!BY_ID[id] || vistos.has(id)) continue;
    vistos.add(id);
    escolhidas.push(id);
  }
  const total = totalHabilidades(nd);
  // Escolhas aninhadas (Estilo de Controle no Apogeu, Melhorias...). O mapa
  // alimenta a verificação de requisito `escolha` e a passada de efeitos.
  const escolhas = resolveEscolhasHabilidade({
    escolhidasIds: escolhidas,
    niveisPorEspec,
    escolhasHabilidade: creature?.escolhasHabilidade,
    bt,
  });
  const ctx = { niveisPorEspec, escolhidas, escolhasHabilidade: escolhas.mapa };
  // Habilidades escolhidas que a criatura deixou de alcançar (ex.: a
  // multiclasse foi redividida depois da escolha). Reportado, não removido.
  const inacessiveis = escolhidas.filter((id) => !avaliarAcessoHabilidade(BY_ID[id], ctx).ok);

  // Cada Melhoria de Controlador (repetível) além da 1ª consome uma vaga
  // extra. Talentos entram no MESMO orçamento ("obtidos no lugar de
  // habilidades de especialização", autor 2026-07-22), por isso vêm de fora.
  const gastos = escolhidas.length + escolhas.vagasExtras + Math.max(0, talentosGastos);
  return {
    escolhidas,
    escolhas,               // { porHab, mapa, vagasExtras }
    talentosGastos,
    total,
    gastos,
    restante: total - gastos,
    excedeu: gastos > total,
    inacessiveis,
    niveisPorEspec,
  };
}

/**
 * Validador de conteúdo (mesmo papel de validarCatalogoAptidoes): ids únicos,
 * especializacaoId existente, nome único DENTRO de uma especialização (entre
 * especializações pode repetir), tipo válido e nível coerente.
 * Rodar a cada leva de conteúdo novo.
 */
export function validarCatalogoHabilidades() {
  const problemas = [];
  const ids = new Set();
  const nomePorEspec = new Map();
  const tiposValidos = new Set(HABILIDADE_TIPOS.map((t) => t.id));

  for (const h of AFTY_HABILIDADES) {
    if (ids.has(h.id)) problemas.push(`id duplicado: ${h.id}`);
    ids.add(h.id);

    if (!getEspecializacao(h.especializacaoId)) {
      problemas.push(`${h.nome}: especializacaoId inexistente (${h.especializacaoId})`);
    }
    if (!tiposValidos.has(h.tipo)) problemas.push(`${h.nome}: tipo inválido (${h.tipo})`);
    if (!Number.isInteger(h.nivel) || h.nivel < 1) {
      problemas.push(`${h.nome}: nivel inválido (${h.nivel})`);
    }

    const chave = `${h.especializacaoId}::${h.nome.toLowerCase()}`;
    if (nomePorEspec.has(chave)) {
      problemas.push(`nome duplicado dentro de ${h.especializacaoId}: ${h.nome}`);
    }
    nomePorEspec.set(chave, true);

    // Requisitos `escolha` devem apontar para uma habilidade e uma opção reais.
    for (const r of h.requisitos || []) {
      if (r?.tipo === "atributo" && !ATTR_LABEL[r.attr]) {
        problemas.push(`${h.nome}: requisito aponta para atributo inexistente "${r.attr}"`);
      }
      if (r?.tipo !== "escolha") continue;
      const dona = AFTY_HABILIDADES.find((x) => x.id === r.habId);
      if (!dona?.escolha) {
        problemas.push(`${h.nome}: requisito escolha aponta para habilidade sem escolha (${r.habId})`);
      } else if (!dona.escolha.opcoes.some((o) => o.id === r.opcaoId)) {
        problemas.push(`${h.nome}: requisito escolha aponta para opção inexistente (${r.opcaoId})`);
      }
    }

    // Escolha aninhada (ex.: Estilos de Combate do Repertório).
    if (h.escolha) {
      const opcaoIds = new Set();
      for (const o of h.escolha.opcoes || []) {
        if (opcaoIds.has(o.id)) problemas.push(`${h.nome}: opção duplicada (${o.id})`);
        opcaoIds.add(o.id);
      }
      if (!h.escolha.niveis?.length) problemas.push(`${h.nome}: escolha sem niveis`);
      // A 1ª concessão não pode vir antes da própria habilidade existir.
      if (Math.min(...(h.escolha.niveis || [0])) < h.nivel) {
        problemas.push(`${h.nome}: escolha concedida antes do nível da habilidade`);
      }
    }
  }
  return problemas;
}
