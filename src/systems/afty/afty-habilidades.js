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

export const HABILIDADE_TIPOS = [
  { id: "base",  label: "Habilidades Base" },
  { id: "nivel", label: "Habilidades por Nível" },
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

export const AFTY_HABILIDADES = [
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
];

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
export function escolhasMaximas(habilidade, nivelEspec) {
  if (!habilidade?.escolha) return 0;
  if (habilidade.escolha.repetivel) return habilidade.escolha.opcoes.length;
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
export function resolveEscolhasHabilidade({ escolhidasIds = [], niveisPorEspec = {}, escolhasHabilidade = {} } = {}) {
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
    const allowance = escolhasMaximas(hab, nivelEspec);
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
 * Requisito EXTRA de uma habilidade (além do nível, que é implícito).
 * ctx = { escolhidas: [id], escolhasHabilidade: { [habId]: [opcaoId] } }.
 * Espelha avaliarRequisitoAptidao.
 */
export function avaliarRequisitoHabilidade(requisito, ctx = {}) {
  if (requisito?.tipo === "habilidade") {
    const alvo = BY_ID[requisito.id];
    // Referência pendente (habilidade ainda não transcrita): exibe e NÃO
    // bloqueia, senão a habilidade ficaria inalcançável.
    if (!alvo) return { ok: true, verificavel: false, label: requisito.id };
    return { ok: (ctx.escolhidas || []).includes(requisito.id), verificavel: true, label: alvo.nome };
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

export function resolveHabilidades(creature, escolhidasEspec) {
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
  });
  const ctx = { niveisPorEspec, escolhidas, escolhasHabilidade: escolhas.mapa };
  // Habilidades escolhidas que a criatura deixou de alcançar (ex.: a
  // multiclasse foi redividida depois da escolha). Reportado, não removido.
  const inacessiveis = escolhidas.filter((id) => !avaliarAcessoHabilidade(BY_ID[id], ctx).ok);

  // Cada Melhoria de Controlador (repetível) além da 1ª consome uma vaga extra.
  const gastos = escolhidas.length + escolhas.vagasExtras;
  return {
    escolhidas,
    escolhas,               // { porHab, mapa, vagasExtras }
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
