/**
 * Catálogo de TALENTOS + resolvers puros.
 *
 * Regras confirmadas pelo autor (2026-07-22):
 *
 * 1. **Talentos são pegos NO LUGAR de Habilidades de Especialização**, então
 *    dividem o MESMO orçamento (`totalHabilidades(nd)`). Também podem vir de
 *    outras fontes (origens, treinamentos), que ainda não concedem nenhum.
 * 2. **Qualquer especialização pode pegar qualquer talento.** Não há
 *    `especializacaoId` aqui: o acesso não depende de classe.
 * 3. **"Nível N" nos pré-requisitos é o ND**, não o nível de classe. É a
 *    diferença central para as Habilidades, que sempre contam o nível NAQUELA
 *    especialização (ver `avaliarAcessoHabilidade`).
 * 4. Na UI, Talentos é uma **aba ao lado das especializações** (Lutador,
 *    Combatente...). Numa ficha Restringido aparecem "Restringido" e
 *    "Talento" lado a lado.
 *
 * ⚠ Ids levam prefixo `tal_`, mesma convenção de `cmb_`/`lut_`/`mal_`. Os
 * nomes REPETEM de propósito com habilidades de especialização (ex.: "Técnicas
 * de Combate"), então o prefixo é o que os separa.
 *
 * ⚠ Ordem do array = ordem do livro, NÃO alfabética (convenção do projeto).
 * O livro lista primeiro os talentos SEM pré-requisito e depois recomeça a
 * ordem alfabética com os que TÊM, dentro do mesmo grupo "Gerais".
 *
 * ⚠ Texto VERBATIM do livro, com os erros dele preservados.
 */

import { getOrigem } from "./afty-origens";

export const TALENTO_GRUPOS = [
  { id: "geral",  titulo: "Talentos Gerais" },
  { id: "origem", titulo: "Talentos de Origem" },
];

export const AFTY_TALENTOS = [
  /* ---------------- TALENTOS GERAIS (sem pré-requisito) ---------------- */
  {
    id: "tal_afinidade_com_tecnica",
    nome: "Afinidade com Técnica",
    grupo: "geral",
    descricao:
      "Com uma afinidade superior com a sua técnica amaldiçoada, você consegue a desenvolver " +
      "melhor, criando mais extensões dela. Ao obter esse talento, você recebe um Feitiço " +
      "adicional. Nos níveis 5, 10, 15 e 20 você recebe mais um Feitiço adicional.",
    requisitos: [],
  },
  {
    id: "tal_artesao_amaldicoado",
    nome: "Artesão Amaldiçoado",
    grupo: "geral",
    descricao:
      "A criação de ferramentas amaldiçoadas é um ofício no qual você busca se especializar. Ao " +
      "obter este talento, você se torna capaz de criar Ferramentas Amaldiçoadas, de acordo com o " +
      "guia na página 153. Além disso, você se torna treinado em Ofício (Ferreiro) ou Ofício " +
      "(Canalizador), caso não seja treinado; caso já seja treinado em ambas, você se torna mestre " +
      "em uma delas à sua escolha.",
    requisitos: [],
  },
  {
    id: "tal_ataque_infalivel",
    nome: "Ataque Infalível",
    grupo: "geral",
    descricao:
      "Uma vez por rodada, após a rolagem de dano de um ataque armado ou desarmado, você pode " +
      "escolher a repetir, ficando com o novo resultado obrigatoriamente. Além disso, você não " +
      "pode ter os níveis de dano da sua arma reduzidos.",
    requisitos: [],
  },
  {
    id: "tal_atencao_infalivel",
    nome: "Atenção Infalível",
    grupo: "geral",
    descricao:
      "Sua atenção para os arredores nunca falha, mantendo seus sentidos afiados. Você recebe um " +
      "bônus de +5 em sua Atenção e não pode ser surpreendido caso consciente.",
    requisitos: [],
  },
  {
    id: "tal_dedicacao_recompensadora",
    nome: "Dedicação Recompensadora",
    grupo: "geral",
    descricao:
      "Você se dedica mais do que o normal em suas missões, imagem e desempenho, e recebe melhores " +
      "recompensas, em troca. No quarto grau, você recebe dois itens de custo 1 a mais; no " +
      "terceiro grau, você recebe dois itens de custo 2 a mais; no segundo grau, você recebe um " +
      "item de custo 2 a mais e 2 de custo 3 a mais; no primeiro grau, você recebe dois itens de " +
      "custo 3 a mais e um item de custo 4 a mais e, no grau especial, você recebe dois itens de " +
      "custo 4 a mais. Os aumentos de itens não são cumulativos.",
    requisitos: [],
  },
  {
    id: "tal_favorecido_pela_sorte",
    nome: "Favorecido pela Sorte",
    grupo: "geral",
    descricao:
      "Você tem uma sorte inexplicável, a qual o favorece nos momentos mais críticos. Você tem 3 " +
      "pontos de sorte. Sempre que fizer uma rolagem, você pode gastar um ponto de sorte para " +
      "rolar outro d20, podendo escolher usar qualquer um dos dois resultados. Você pode escolher " +
      "rolar o outro dado após ver o resultado da primeira rolagem, mas antes de ver as " +
      "consequências. Quando um inimigo conseguir um 20 em uma jogada de ataque para o acertar, " +
      "você recupera 1 ponto de sorte. Você recupera seus pontos de sorte após um descanso longo.",
    requisitos: [],
  },
  {
    id: "tal_guarda_infalivel",
    nome: "Guarda Infalível",
    grupo: "geral",
    descricao:
      "Você nunca baixa a sua guarda, mesmo em uma situação que pode ser vista como catastrófica. " +
      "Em caso de um desastre em um teste de ataque, você não causa um ataque como reação. Caso um " +
      "efeito imposto sobre você tente reduzir sua Defesa ou impor modificadores negativos em " +
      "testes de resistência, você terá +3 para resistir.",
    requisitos: [],
  },
  {
    id: "tal_incremento_de_atributo",
    nome: "Incremento de Atributo",
    grupo: "geral",
    descricao:
      "Buscando se tornar mais forte, você aumenta um de seus atributos através do treino e " +
      "esforço. Ao obter esse talento, você aumenta o valor e o limite de um atributo à sua " +
      "escolha em 2. Você pode pegar este talento várias vezes, mas apenas uma vez para cada " +
      "atributo.",
    // ⚠ REPETÍVEL (uma vez por atributo) e eleva VALOR e LIMITE, igual ao
    // Desenvolvimento Inesperado da origem Derivado. Precisa de escolha
    // aninhada com pool dos 6 atributos. Ver a nota no doc de status.
    requisitos: [],
  },
  {
    id: "tal_investida_aprimorada",
    nome: "Investida Aprimorada",
    grupo: "geral",
    descricao:
      "Você domina a arte de realizar uma investida, otimizando-a para extrair o potencial máximo " +
      "da ação. Ao realizar uma ação de investida, seu movimento aumenta em 3 metros durante ela; " +
      "o bônus de acerto aumenta de +2 para um valor igual ao seu bônus de treinamento e, caso " +
      "acerte o ataque, o alvo deve realizar um teste de Atletismo contra o seu, sendo derrubado " +
      "em uma falha.",
    requisitos: [],
  },
  {
    id: "tal_mestre_das_armas",
    nome: "Mestre das Armas",
    grupo: "geral",
    descricao:
      "Você desenvolve suas capacidades e potencial para manejar armas. Ao obter este talento, " +
      "você escolhe aumentar o valor de sua Força ou Destreza em 2 e pode escolher entre se tornar " +
      "treinado em quatro armas quaisquer à sua escolha ou receber acesso ao efeito de crítico de " +
      "um grupo de armas à sua escolha.",
    requisitos: [],
  },
  {
    id: "tal_mestre_defensivo",
    nome: "Mestre Defensivo",
    grupo: "geral",
    descricao:
      "Você desenvolve suas capacidades de defesa e resistência. Ao obter este talento, você " +
      "escolhe aumentar o valor de sua Força ou Constituição em 2 e se torna treinado em escudos. " +
      "Caso já seja treinado, você recebe Redução de Dano adicional com o escudo igual a metade do " +
      "valor base de RD dele (um Escudo Pesado concederia 9 ao invés de 6).",
    requisitos: [],
  },
  {
    id: "tal_perceber_oportunidade",
    nome: "Perceber Oportunidade",
    grupo: "geral",
    descricao:
      "Você possui uma facilidade sem igual para realizar golpes oportunos, sendo quase como uma " +
      "segunda natureza para você. Você ignora a regra de repetição de reação para Golpes de " +
      "Oportunidade, podendo repeti-lo duas vezes por rodada ao invés do comum. Todo golpe de " +
      "oportunidade que você realiza possui vantagem.",
    requisitos: [],
  },
  {
    id: "tal_provocacao_desafiadora",
    nome: "Provocação Desafiadora",
    grupo: "geral",
    descricao:
      "Não só provocar, mas você é capaz de se transformar no centro da atenção daquele que você " +
      "deseja desafiar. Uma criatura que seja afetada por uma ação de Provocar sua, além de " +
      "receber desvantagem para atacar outras criaturas, deve sempre realizar pelo menos um ataque " +
      "contra você. Além disso, uma quantidade de vezes igual a metade do seu modificador de " +
      "Presença, você pode utilizar Provocar como uma Ação Livre.",
    requisitos: [],
  },
  {
    id: "tal_resiliencia_melhorada",
    nome: "Resiliência Melhorada",
    grupo: "geral",
    descricao:
      "Você refina suas estratégicas e habilidade para resistir a um nicho específico de ameaças. " +
      "Ao obter este talento, escolha um teste de resistência, exceto Integridade: você se torna " +
      "treinado nele ou, caso já seja treinado, se torna mestre. O valor do atributo usado no TR " +
      "escolhido aumenta em 1.",
    requisitos: [],
  },
  {
    id: "tal_saltador_constante",
    nome: "Saltador Constante",
    grupo: "geral",
    descricao:
      "Você é extremamente acostumado a saltar, movendo-se mais através de pulos do que correndo. " +
      "Ao pular, caso você esteja no alcance toque de uma parede ou objeto no fim do seu " +
      "movimento, você pode utilizar a ação pular mais uma vez como ação livre, cortando seu pulo " +
      "pela metade, ao terminar o movimento com um alvo dentro do seu alcance corpo a corpo, caso " +
      "realize um ataque contra ele, você recebe +2 na jogada de ataque e, caso acerte, causa dano " +
      "adicional igual ao seu modificador de Força.",
    requisitos: [],
  },
  {
    id: "tal_tecnicas_ofensivas_de_escudo",
    nome: "Técnicas Ofensivas de Escudo",
    grupo: "geral",
    // ⚠ O CABEÇALHO deste talento se perdeu no PDF (o mesmo artefato de duas
    // colunas que comeu o de Poder Corporal, no Lutador). O nome vem do irmão
    // "Técnicas Defensivas de Escudo", que abre com a MESMA frase trocando
    // "no seu ataque" por "por completo na sua defesa". CONFIRMAR com o autor.
    descricao:
      "Você aperfeiçoa o uso do seu escudo para colocá-lo no seu ataque. Ao atacar no seu turno, " +
      "você pode usar sua Ação Bônus para Empurrar com o escudo. Caso o alvo seja empurrado com " +
      "sucesso, ele recebe Xd6 + seu Modificador de Força de dano de impacto, onde X é igual ao " +
      "seu Modificador de Força. Além disso, você pode escolher aumentar a distância que a " +
      "criatura é empurrada em 4,5 metros ou a derrubar.",
    requisitos: [],
  },
  {
    id: "tal_tecnicas_de_arremesso",
    nome: "Técnicas de Arremesso",
    grupo: "geral",
    descricao:
      "Você se aprofunda em técnicas para manusear armas de arremesso no seu potencial máximo e " +
      "evitar desperdiçar uma delas. Sempre que atacar com uma arma de arremesso, você recebe um " +
      "bônus de +2 para acertar e +3 no dano.",
    requisitos: [],
  },
  {
    id: "tal_tecnicas_de_reacao_rapida",
    nome: "Técnicas de Reação Rápida",
    grupo: "geral",
    descricao:
      "Preparado para agir sob pressão e urgência, você sabe como reagir o mais rápido possível. " +
      "Você recebe +5 de Iniciativa. Após a rolagem de iniciativa, caso você não seja o primeiro, " +
      "você pode rolar novamente, ficando com o melhor resultado.",
    requisitos: [],
  },
  {
    id: "tal_tecnicas_defensivas_de_escudo",
    nome: "Técnicas Defensivas de Escudo",
    grupo: "geral",
    descricao:
      "Você aperfeiçoa o uso do seu escudo para colocá-lo por completo na sua defesa. Ao invés de " +
      "receber penalidade, você adiciona o bônus padrão do escudo em TRs de Reflexos. Além disso, " +
      "uma quantidade de vezes igual ao seu Bônus de Treinamento, por descanso longo, você pode, " +
      "antes de saber o resultado de um TR de Reflexos, escolher usar sua Reação para reduzir o " +
      "valor necessário para um sucesso crítico em 3.",
    requisitos: [],
  },
  {
    id: "tal_tempestade_de_ideias",
    nome: "Tempestade de Ideias",
    grupo: "geral",
    descricao:
      "Você decide extrair ao máximo o seu potencial, obtendo melhorias e novas maestrias. Aumenta " +
      "um atributo a sua escolha em 1. Você se torna treinado em uma perícia e uma ferramenta à " +
      "sua escolha. Além disso, escolha uma perícia na qual seja treinado: uma quantidade de vezes " +
      "igual a metade do seu bônus de treinamento, por descanso curto, você pode escolher receber " +
      "vantagem em um teste com ela.",
    requisitos: [],
  },

  /* ---------------- TALENTOS GERAIS (com pré-requisito) ----------------
     O livro recomeça a ordem alfabética aqui, ainda dentro de "Gerais".
     ⚠ Adepto de Medicina vem antes de Adepto de Briga na lista do autor. */
  {
    id: "tal_adepto_de_medicina",
    nome: "Adepto de Medicina",
    grupo: "geral",
    descricao:
      "Estudando em seu tempo livre, você aprendeu sobre primeiros socorros em busca de ajudar sua " +
      "equipe em momentos de desespero. Ao obter este talento, você recebe acesso ao segundo " +
      "efeito da habilidade Suporte em Combate, de Suporte (p.102), com o valor da cura sendo " +
      "baseado em seu nível de personagem, mas a quantidade de usos é reduzida pela metade.",
    requisitos: [
      { tipo: "nota", texto: "Mestre em Medicina" },
      { tipo: "maxComNome", prefixo: "Adepto", max: 2 },
    ],
  },
  {
    id: "tal_adepto_de_briga",
    nome: "Adepto de Briga",
    grupo: "geral",
    descricao:
      "Para sempre ter uma opção, você treinou seus punhos o suficiente para ajudar nas situações " +
      "mais precárias. Enquanto não estiver com nenhum equipamento do grupo Pugilato, você recebe " +
      "+3 em jogadas de ataque desarmado e o dano de seus golpes desarmados aumenta em 2 níveis. " +
      "Além disso, caso acerte um ataque desarmado mas não cause nenhum dano, você pode Agarrar, " +
      "Derrubar ou Empurrar o alvo como uma Ação Livre, recebendo um bônus igual a metade do seu " +
      "Bônus de Treinamento no teste.",
    requisitos: [
      { tipo: "nota", texto: "Mestre em Atletismo" },
      { tipo: "maxComNome", prefixo: "Adepto", max: 2 },
    ],
  },
  {
    id: "tal_adepto_de_combate",
    nome: "Adepto de Combate",
    grupo: "geral",
    descricao:
      "Estudando e refletindo, você consegue adotar um estilo de combate específico, compreendendo " +
      "e incorporando seus detalhes. Ao obter este talento você aprende um dos estilos de combate " +
      "da especialização Especialista em Combate, o qual considera seu Nível de Personagem para os " +
      "efeitos.",
    // ⚠ CONCEDE uma escolha do pool ESTILOS_DE_COMBATE (afty-habilidades.js),
    // mas contando o ND no lugar do nível de Combatente. Escolha aninhada que
    // atravessa arquivos: ligar junto com a passada de efeitos.
    requisitos: [
      { tipo: "nota", texto: "Mestre em Intuição" },
      { tipo: "maxComNome", prefixo: "Adepto", max: 2 },
    ],
  },
  {
    id: "tal_adepto_de_feiticaria",
    nome: "Adepto de Feitiçaria",
    grupo: "geral",
    descricao:
      "Com um treinado mais focado em técnica e como a utilizar de maneira melhor, você descobre " +
      "mais sobre a feitiçaria como um todo. Ao obter este talento, você recebe uma Mudança de " +
      "Fundamento da habilidade Domínio dos Fundamentos de Especialista em Técnica (p.78), com " +
      "exceção de Técnica Rápida. Você pode reduzir o custo da Mudança de Fundamento em 1 uma " +
      "quantidade de vezes igual ao seu bônus de treinamento por cena.",
    // ⚠ CONCEDE uma escolha do pool MUDANCAS_DE_FUNDAMENTO, exceto uma. O
    // livro escreve "Técnica Rápida", mas a opção do pool se chama "Feitiço
    // Rápido" (mesma troca Técnica/Feitiço de Mira Aperfeiçoada).
    requisitos: [
      { tipo: "nota", texto: "Mestre em Feitiçaria" },
      { tipo: "nota", texto: "Possuir Feitiços" },
      { tipo: "maxComNome", prefixo: "Adepto", max: 2 },
    ],
  },
  {
    id: "tal_alma_inquebravel",
    nome: "Alma Inquebrável",
    grupo: "geral",
    descricao:
      "Sua alma é mais resistente do que o normal, com sua consciência e perseverança tornando-a " +
      "difícil de se quebrar. Você se torna treinado em Integridade e recebe Redução de Dano " +
      "contra Dano na Alma igual a 1/4 do seu Nível de Personagem.",
    requisitos: [{ tipo: "atributo", attr: "constituicao", valor: 14 }],
  },
  {
    id: "tal_apaziguador_de_tecnica",
    nome: "Apaziguador de Técnica",
    grupo: "geral",
    descricao:
      "Preparado para impedir seus inimigos de utilizarem técnicas no meio de combate, você sabe o " +
      "momento perfeito para esgueirar golpes entre conjurações. Ao ver um inimigo usar uma " +
      "técnica com a conjuração de Ação Comum ou maior em seu alcance corpo-a-corpo, você pode " +
      "realizar um golpe de oportunidade contra ela, forçando-a a fazer um teste de concentração. " +
      "Caso a criatura falhe, ela perde 5 em rolagens de acerto/CD caso seja um Feitiço de dano, " +
      "tem os benefícios do Feitiço cortados pela metade caso seja auxiliar ou tem o Feitiço " +
      "completamente anulado caso seja especial ou não se encaixe em nenhum dos outros parâmetros. " +
      "Caso o Feitiço seja anulado, o alvo recupera a ação e não gasta o PE, mas não pode realizar " +
      "o Feitiço anulado.",
    requisitos: [{ tipo: "nota", texto: "Treinado em Astúcia" }, { tipo: "nd", valor: 8 }],
  },
  {
    id: "tal_aptidao_desenvolvida",
    nome: "Aptidão Desenvolvida",
    grupo: "geral",
    descricao:
      "Você desenvolve uma de suas aptidões e capacidade de uso da energia amaldiçoada. Ao obter " +
      "este talento, escolha uma aptidão amaldiçoada para ter o seu nível de aptidão aumentado em " +
      "1. Você pode pegar esse talento múltiplas vezes, mas apenas uma vez para cada Aptidão.",
    // ⚠ REPETÍVEL e CONCEDE nível de trilha à escolha (ORÇAMENTO, não
    // direcionada). Quarto caso do mesmo par de problemas, com Aptidões de
    // Combate, de Luta e de Suporte.
    requisitos: [{ tipo: "nd", valor: 4 }],
  },
  {
    id: "tal_determinado_a_viver",
    nome: "Determinado a Viver",
    grupo: "geral",
    descricao:
      "Mesmo de frente a perigos e ameaças sem limites, você mantém sua vontade de viver e seguir " +
      "em frente. Uma vez por dia, na primeira vez que fosse para os testes de morte, você pode " +
      "escolher ficar com 1 de vida ao invés disso. Todo teste de morte que você realiza, a partir " +
      "do segundo, possui vantagem.",
    // ⚠ O livro repete "Pré-Requisito:" duas vezes neste. Erro de digitação.
    requisitos: [
      { tipo: "nota", texto: "Treinado em Vontade" },
      { tipo: "atributo", attr: "constituicao", valor: 16 },
    ],
  },
  {
    id: "tal_discurso_motivador",
    nome: "Discurso Motivador",
    grupo: "geral",
    descricao:
      "Você pode gastar 10 minutos, fora de combate, ou gastar uma Ação Completa ,dentro de " +
      "combate, para inspirar seus aliados: todas as criaturas amigáveis na cena, que possam te " +
      "ouvir, recebem HP temporário igual ao dobro do seu nível + seu modificador de Presença " +
      "multiplicado pela metade do seu bônus de treinamento, arredondado para cima. Uma criatura " +
      "só pode receber esse bônus uma vez por descanso curto ou longo.",
    requisitos: [{ tipo: "nota", texto: "Treinado em alguma perícia de Presença" }],
  },
  {
    id: "tal_especialista_em_concussao",
    nome: "Especialista em Concussão",
    grupo: "geral",
    descricao:
      "Seu valor de força ou constituição aumenta em 1. Sempre que causar Dano de Impacto em um " +
      "ataque corpo a corpo, ele é aumentado em um nível. Uma vez por turno, ao acertar uma " +
      "criatura e infligir dano de impacto, você pode mover ela até 3 metros para um espaço " +
      "desocupado, desde que o alvo não seja duas categorias de tamanho acima de você.",
    requisitos: [{ tipo: "nd", valor: 8 }],
  },
  {
    id: "tal_especialista_em_cortes",
    nome: "Especialista em Cortes",
    grupo: "geral",
    descricao:
      "Seu valor de força ou destreza aumenta em 1. Sempre que causar Dano Cortante em um ataque " +
      "corpo a corpo, ele é aumentado em um nível. Uma vez por turno, ao acertar uma criatura e " +
      "infligir dano cortante, você pode reduzir o movimento dela em 4,5 metros até o começo do " +
      "seu próximo turno.",
    requisitos: [{ tipo: "nd", valor: 8 }],
  },
  {
    id: "tal_especialista_em_perfuracao",
    nome: "Especialista em Perfuração",
    grupo: "geral",
    descricao:
      "Seu valor de força ou destreza aumenta em 1. Sempre que causar Dano Perfurante em um ataque " +
      "corpo a corpo, ele é aumentado em um nível. Uma vez por turno, ao acertar uma criatura e " +
      "infligir dano perfurante você pode rolar novamente os dados de dano, usando o melhor " +
      "resultado total.",
    requisitos: [{ tipo: "nd", valor: 8 }],
  },
  {
    id: "tal_mestre_da_criacao",
    nome: "Mestre da Criação",
    grupo: "geral",
    descricao:
      "Praticando e estudando, você consegue otimizar o seu tempo para poder produzir mais itens " +
      "em menos tempo. Quando escolher o foco Criação de Itens durante um interlúdio, você pode " +
      "criar 2 itens adicionais. Caso escolha o foco Criação de Itens mais de uma vez no mesmo " +
      "interlúdio, você recebe as oportunidades adicionais para cada foco. Além disso, você recebe " +
      "um bônus de +2 em duas perícias de ofício a sua escolha.",
    requisitos: [{ tipo: "nota", texto: "Treinado em dois Ofícios" }, { tipo: "nd", valor: 4 }],
  },
  {
    id: "tal_mestre_do_arremesso",
    nome: "Mestre do Arremesso",
    grupo: "geral",
    descricao:
      "Dominando ainda mais as armas de arremesso, você consegue as levar até o seu limite, " +
      "tornando-se um efetivo mestre dos arremessos. Toda arma de arremesso que você utilizar tem " +
      "o seu dano aumentado em um dado; o seu bônus em ataques com armas de arremesso se torna +4 " +
      "para acertar e +6 no dano, e o alcance de ataques com armas de arremesso aumenta em 6 " +
      "metros.",
    requisitos: [{ tipo: "talento", id: "tal_tecnicas_de_arremesso" }, { tipo: "nd", valor: 8 }],
  },
  {
    id: "tal_mestre_dos_chicotes",
    nome: "Mestre dos Chicotes",
    grupo: "geral",
    descricao:
      "Os chicotes são um tipo de arma exótico e único, recompensando aqueles que dominam o seu " +
      "manejo com um novo potencial. Suas rolagens de ataque com chicotes causam +4 de dano e o " +
      "alcance aumenta em 1,5 metros. Além disso, uma vez ao turno, quando acertar uma criatura " +
      "com um ataque com chicote, você pode a forçar a realizar um TR de Fortitude e, caso falhe, " +
      "você pode a puxar até 3 metros para sua direção.",
    requisitos: [{ tipo: "nd", valor: 5 }],
  },
  {
    id: "tal_movimentos_acrobaticos",
    nome: "Movimentos Acrobáticos",
    grupo: "geral",
    descricao:
      "Não é hora de ficar parado no chão! Você se move agilmente sempre, e não para no lugar! Ao " +
      "ser derrubado ou receber a condição caído, você pode fazer um teste de acrobacia contra o " +
      "atletismo da criatura que te derrubou ou CD da criatura que aplicou a condição caso seja " +
      "uma técnica, caso isso aconteça, você pode se levantar como uma ação livre, sem gastar sua " +
      "ação de movimento e se mover 3m sem ativar golpes de oportunidade. Ao fazer isso, você " +
      "também recebe um bônus de metade do seu modificador de destreza na Defesa por 1 rodada.",
    requisitos: [{ tipo: "nota", texto: "Treinado em Acrobacia" }],
  },
  {
    id: "tal_robustez_aprimorada",
    nome: "Robustez Aprimorada",
    grupo: "geral",
    descricao:
      "Seus pontos de vida máximos aumentam em um valor igual ao seu nível ao obter esse talento. " +
      "Sempre que subir de nível e tiver esse talento, você recebe +1 ponto de vida máximo. Além " +
      "disso, você recebe +2 em testes de Fortitude.",
    requisitos: [{ tipo: "atributo", attr: "constituicao", valor: 14 }],
  },
  {
    id: "tal_tecnicas_de_empunhadura_dupla",
    nome: "Técnicas de Empunhadura Dupla",
    grupo: "geral",
    descricao:
      "Você recebe um bônus de +1 na sua Defesa quando estiver empunhando uma arma em cada mão. " +
      "Você pode lutar com duas armas mesmo que as armas não sejam leves, desde que não possuam a " +
      "propriedade pesada ou duas mãos. Você pode utilizar a ação Sacar para sacar duas armas " +
      "gastando apenas metade do movimento da sua próxima ação de Andar.",
    requisitos: [{ tipo: "atributoOr", attrs: ["forca", "destreza"], valor: 14 }],
  },
  {
    id: "tal_tecnicas_de_mobilidade",
    nome: "Técnicas de Mobilidade",
    grupo: "geral",
    descricao:
      "Seu movimento aumenta em 3 metros. Uma vez por rodada, ao atacar uma criatura, você pode " +
      "realizar um teste de Reflexos contra um teste de Reflexos do alvo e, caso suceda, o alvo " +
      "não pode realizar ataques de oportunidade contra você pelo resto do seu turno.",
    requisitos: [{ tipo: "atributo", attr: "destreza", valor: 14 }],
  },
  {
    id: "tal_tecnicas_de_ocultamento",
    nome: "Técnicas de Ocultamento",
    grupo: "geral",
    descricao:
      "Você recebe um bônus adicional em testes de Furtividade igual ao seu Bônus de Treinamento " +
      "e, quando deixar uma criatura Desprevenida através de um ataque surpresa, o prejuízo é " +
      "aplicado em todos os Testes de Resistência ao invés de apenas Reflexos.",
    requisitos: [{ tipo: "nota", texto: "Treinado em Furtividade" }],
  },
  {
    id: "tal_tecnicas_do_sentinela",
    nome: "Técnicas do Sentinela",
    grupo: "geral",
    descricao:
      "Ao acertar uma criatura com um ataque de oportunidade, o movimento dela é reduzido em 4,5 " +
      "metros até o final do turno dela. Quando uma criatura a 1,5 metros de você faz um ataque " +
      "contra um alvo além de você, você pode como uma reação realizar um ataque contra essa " +
      "criatura.",
    requisitos: [{ tipo: "nd", valor: 5 }],
  },
  {
    id: "tal_wrestling",
    nome: "Wrestling",
    grupo: "geral",
    descricao:
      "Você sabe técnicas de agarramento melhor do que ninguém, fazendo com que os agarrados nunca " +
      "escapem de suas garras. Ao agarrar um alvo, caso ele tente escapar de um agarrão que você " +
      "esteja fazendo, você pode forçá-lo, ao invés de fazer um teste de perícia normal contra " +
      "você, fazer um teste de modificador de força contra o seu teste de modificador de força, " +
      "uma vez por rodada. Ao realizar uma Jogada de Ataque, você pode escolher soltar o alvo do " +
      "agarrão como parte do ataque para causar metade do valor de força em dano adicional, " +
      "fazendo o alvo ficar caído, sem necessidade de teste. Você pode escolher, ao invés de " +
      "deixá-lo caído, joga-lo, arremessando-o em uma distância de 3m*MOD de For, se ele atingir " +
      "algo, ele recebe dano de fonte variável (p.327) de Objeto Pesado ou de Extremamente Pesado, " +
      "a depender de onde ele acertar, a escolha do Narrador.",
    requisitos: [{ tipo: "nd", valor: 4 }],
  },
  {
    id: "tal_voto_malevolente",
    nome: "Voto Malevolente",
    grupo: "geral",
    descricao:
      "Você sabe como manter sua cabeça fria mesmo nos momentos mais tensos, lembrando-se da " +
      "malícia ao criar votos. Ao realizar votos emergenciais, o voto não precisa ter um maleficio " +
      "maior que o beneficio, sendo realizado normalmente.",
    requisitos: [{ tipo: "nd", valor: 12 }],
  },

  /* ---------------- TALENTOS DE ORIGEM ----------------
     "Certos talentos estão atrelados a origens específicas... Estes talentos
     podem ser pegos da mesma maneira que um talento comum, mas limitados a
     certas origens." Ordem do livro (agrupada por origem, não alfabética). */
  {
    id: "tal_familiaridade_com_tecnica",
    nome: "Familiaridade com Técnica",
    grupo: "origem",
    descricao:
      "Com a sua técnica amaldiçoada sendo parte da sua individualidade, você se torna cada vez " +
      "mais e mais familiar com ela, otimizando-a em custo ou poder. Seu Feitiço escolhido " +
      "primeiro como Marca Registrada tem a redução de custo em PE aumentada de 1 para 2 ou, caso " +
      "seja Sustentada, você pode escolher reduzir o custo para sustentar em 1. Além disso, você " +
      "pode escolher uma quantidade de Feitiços adicionais como Marca Registrada igual a metade do " +
      "seu bônus de treinamento.",
    requisitos: [{ tipo: "origem", id: "inato" }, { tipo: "nd", valor: 12 }],
  },
  {
    id: "tal_manual_de_tecnica",
    nome: "Manual de Técnica",
    grupo: "origem",
    descricao:
      "Sua técnica já está registrada há muito tempo, com direito a um manual explicando seu " +
      "funcionamento e uso. Ao obter este talento, você pode criar um Feitiço de um nível acima ao " +
      "maior que você possui acesso, mas ele tem o custo aumentado em 50% (metade do custo padrão " +
      "a mais). Quando você receber acesso ao nível do Feitiço criado com o Manual, você deve " +
      "obrigatoriamente o aprender quando ganhar um novo Feitiço e, após isso, pode criar outro " +
      "Feitiço de nível superior com Manual de Técnica. Caso você já possua acesso a Feitiços de " +
      "Nível 5, o tempo de recarga da sua Técnica Máxima é reduzido em 1 rodada.",
    requisitos: [
      { tipo: "origem", id: "herdado" },
      { tipo: "nota", texto: "Treinamento em História ou Ocultismo" },
      { tipo: "nd", valor: 5 },
    ],
  },
  {
    id: "tal_expansao_de_reserva",
    nome: "Expansão de Reserva",
    grupo: "origem",
    descricao:
      "Você expande a sua reserva de energia, a qual fica oculta em seu ser, apenas aguardando seu " +
      "uso. Sua característica energia antinatural recebe as seguintes melhorias: recuperar " +
      "energia da sua reserva se torna uma ação livre e, ao recuperar, você também recebe uma " +
      "quantidade de pontos de energia temporários igual a metade do seu bônus de treinamento. " +
      "Além disso, você passa a poder utilizar a característica uma vez por descanso longo ao " +
      "invés de por dia.",
    requisitos: [{ tipo: "origem", id: "derivado" }, { tipo: "nd", valor: 8 }],
  },
  {
    id: "tal_quebra_de_limites",
    nome: "Quebra de Limites",
    grupo: "origem",
    descricao:
      "Você continua quebrando os seus limites a partir de um desenvolvimento fora da curva " +
      "ordinária. Ao obter este talento, você aumenta o valor de dois atributos diferentes à sua " +
      "escolha em 2, com exceção do seu atributo com maior limite. Além disso, o limite dos dois " +
      "atributos escolhidos é aumentado em 2.",
    // ⚠ Eleva VALOR e LIMITE de dois atributos, como o Desenvolvimento
    // Inesperado da mesma origem. Precisa de escolha aninhada de atributo.
    requisitos: [{ tipo: "origem", id: "derivado" }, { tipo: "nd", valor: 6 }],
  },
  {
    id: "tal_fisico_aperfeicoado",
    nome: "Físico Aperfeiçoado",
    grupo: "origem",
    descricao:
      "O seu corpo se torna específico e desenvolvido para uma área em peculiar, ligando-se mais " +
      "firmemente a certos aspectos. Ao adquirir este talento, escolha um dos efeitos abaixo para " +
      "receber:\n\n" +
      "• Seu Deslocamento aumenta em 4,5 metros.\n" +
      "• Você recebe um bônus de +2 em testes de Acrobacia ou Atletismo, escolhendo um entre eles.\n" +
      "• Caso empurre uma criatura ou arremesse um objeto (Desarmar ou Empurrar), a distância é " +
      "aumentada em 3 metros.\n" +
      "• A distância de todo pulo que você realizar aumenta em um valor igual a metade da " +
      "distância total.",
    // ⚠ Escolha de 1 entre 4 efeitos. Ficou como texto porque os 4 são
    // canais distintos (deslocamento, perícia, manobra, pulo) e nenhum deles
    // existe ainda no motor do lado da criatura.
    requisitos: [{ tipo: "origem", id: "feto_amaldicoado_hibrido" }, { tipo: "nd", valor: 6 }],
  },
  {
    id: "tal_reposicao_sanguinea",
    nome: "Reposição Sanguínea",
    grupo: "origem",
    descricao:
      "Além de um vigor maldito, ele se desenvolve para uma capacidade única de repor o seu sangue " +
      "e saúde. Sua cura do Vigor Maldito passa a poder ser utilizada tanto como ação bônus quanto " +
      "reação ao receber dano, além de aumentar em 5.",
    requisitos: [{ tipo: "origem", id: "feto_amaldicoado_hibrido" }, { tipo: "nd", valor: 6 }],
  },
  {
    id: "tal_estudo_amaldicoado",
    nome: "Estudo Amaldiçoado",
    grupo: "origem",
    descricao:
      "Você estuda sobre a energia amaldiçoada ao máximo, conseguindo descobrir uma nova maneira " +
      "de a utilizar. Ao obter este talento, você pode escolher dois Níveis de Aptidão diferentes " +
      "para serem aumentados em 1.",
    // ⚠ CONCEDE 2 níveis de trilha à escolha (orçamento). Quinto caso.
    requisitos: [{ tipo: "origem", id: "sem_tecnica" }, { tipo: "nd", valor: 8 }],
  },
  {
    id: "tal_nocao_e_preparacao",
    nome: "Noção e Preparação",
    grupo: "origem",
    descricao:
      "Embora você esteja privado do acesso a uma técnica e certas aplicações da energia, você tem " +
      "noção e preparação suficiente para o proteger diante certos problemas. Você recebe um bônus " +
      "de +2 para testes de resistências contra efeitos de aptidões amaldiçoadas. Nos níveis 8, 12 " +
      "e 16 o bônus aumenta em +1.",
    requisitos: [{ tipo: "origem", id: "sem_tecnica" }, { tipo: "nd", valor: 4 }],
  },
];

const BY_ID = Object.fromEntries(AFTY_TALENTOS.map((t) => [t.id, t]));

export const getTalento = (id) => BY_ID[id] || null;

/** Talentos de um grupo, na ordem do catálogo. */
export const talentosDoGrupo = (grupoId) => AFTY_TALENTOS.filter((t) => t.grupo === grupoId);

/** Grupos de exibição (Gerais, de Origem), pulando os vazios. */
export function gruposDeTalento() {
  return TALENTO_GRUPOS
    .map((g) => ({ ...g, talentos: talentosDoGrupo(g.id) }))
    .filter((g) => g.talentos.length > 0);
}

const ATTR_LABEL = {
  forca: "Força",
  destreza: "Destreza",
  constituicao: "Constituição",
  inteligencia: "Inteligência",
  sabedoria: "Sabedoria",
  presenca: "Presença",
};

/**
 * Avalia UM pré-requisito de talento.
 *
 * ctx = { nd, attrEff, origemId, talentos: [id] }.
 * Espelha avaliarRequisitoHabilidade / avaliarRequisitoAptidao.
 *
 * ⚠ `nd` aqui é o ND da criatura, NÃO o nível de uma especialização: talento
 * é acessível a qualquer classe (regra do autor, 2026-07-22).
 */
export function avaliarRequisitoTalento(requisito, ctx = {}) {
  const nd = Math.max(1, Math.trunc(Number(ctx.nd) || 1));

  if (requisito?.tipo === "nd") {
    return { ok: nd >= requisito.valor, verificavel: true, label: `Nível ${requisito.valor}` };
  }
  if (requisito?.tipo === "atributo") {
    const atual = ctx.attrEff?.[requisito.attr] ?? 0;
    return {
      ok: atual >= requisito.valor,
      verificavel: true,
      label: `${ATTR_LABEL[requisito.attr] || requisito.attr} ${requisito.valor}`,
    };
  }
  if (requisito?.tipo === "atributoOr") {
    const attrs = requisito.attrs || [];
    const ok = attrs.some((a) => (ctx.attrEff?.[a] ?? 0) >= requisito.valor);
    const nomes = attrs.map((a) => ATTR_LABEL[a] || a).join(" ou ");
    return { ok, verificavel: true, label: `${nomes} ${requisito.valor}` };
  }
  if (requisito?.tipo === "origem") {
    const alvo = getOrigem(requisito.id);
    if (!alvo) return { ok: true, verificavel: false, label: requisito.id };
    return { ok: ctx.origemId === requisito.id, verificavel: true, label: `Origem ${alvo.nome}` };
  }
  if (requisito?.tipo === "talento") {
    const alvo = BY_ID[requisito.id];
    if (!alvo) return { ok: true, verificavel: false, label: requisito.id };
    return { ok: (ctx.talentos || []).includes(requisito.id), verificavel: true, label: alvo.nome };
  }
  // "não possuir mais que dois talentos com o nome Adepto". Verificável: conta
  // os já escolhidos cujo nome começa com o prefixo. O talento em avaliação
  // ainda não está na lista, então o teste é "< max", não "<= max".
  if (requisito?.tipo === "maxComNome") {
    const n = (ctx.talentos || []).filter((id) => BY_ID[id]?.nome.startsWith(requisito.prefixo)).length;
    return {
      ok: n < requisito.max,
      verificavel: true,
      label: `no máximo ${requisito.max} talentos "${requisito.prefixo}"`,
    };
  }
  // Requisito de sistema ainda não construído (perícias, feitiços): só exibe.
  if (requisito?.tipo === "nota") {
    return { ok: true, verificavel: false, label: requisito.texto };
  }
  return { ok: true, verificavel: true, label: null };
}

/**
 * Avalia o acesso a um talento. Ao contrário das Habilidades, NÃO há
 * requisito implícito de nível: talento não pertence a especialização e o
 * "Nível N" que alguns pedem é um requisito explícito do tipo `nd`.
 *
 * Retorna { ok, extras }.
 */
export function avaliarAcessoTalento(talento, ctx = {}) {
  const extras = (talento?.requisitos || []).map((r) => avaliarRequisitoTalento(r, ctx));
  return { ok: extras.every((e) => e.ok), extras };
}

/**
 * Resolve os Talentos da ficha.
 *
 * Saneia a lista (ids existentes, sem duplicata). O ORÇAMENTO não vive aqui:
 * talentos são pegos no lugar de Habilidades de Especialização, então quem
 * soma os dois gastos é `resolveHabilidades` (afty-habilidades.js).
 *
 * ctx = { nd, attrEff, origemId }.
 * Retorna { escolhidas, gastos, inacessiveis }.
 */
export function resolveTalentos(creature, ctx = {}) {
  const vistos = new Set();
  const escolhidas = [];
  for (const id of Array.isArray(creature?.talentos) ? creature.talentos : []) {
    if (!BY_ID[id] || vistos.has(id)) continue;
    vistos.add(id);
    escolhidas.push(id);
  }
  // Um talento nunca é pré-requisito de si mesmo, então avaliar contra a
  // lista inteira é seguro e deixa a ordem de escolha irrelevante.
  const full = { ...ctx, talentos: escolhidas };
  const inacessiveis = escolhidas.filter((id) => !avaliarAcessoTalento(BY_ID[id], full).ok);
  return { escolhidas, gastos: escolhidas.length, inacessiveis };
}

/** Erros de conteúdo do catálogo. Rodar a cada leva nova. */
export function validarCatalogoTalentos() {
  const problemas = [];
  const ids = new Set();
  const nomes = new Set();
  const gruposValidos = new Set(TALENTO_GRUPOS.map((g) => g.id));

  for (const t of AFTY_TALENTOS) {
    if (ids.has(t.id)) problemas.push(`id duplicado: ${t.id}`);
    ids.add(t.id);

    const chave = t.nome.toLowerCase();
    if (nomes.has(chave)) problemas.push(`nome duplicado: ${t.nome}`);
    nomes.add(chave);

    if (!gruposValidos.has(t.grupo)) problemas.push(`${t.nome}: grupo inválido (${t.grupo})`);
    if (!t.descricao?.trim()) problemas.push(`${t.nome}: sem descrição`);

    for (const r of t.requisitos || []) {
      if (r?.tipo === "atributo" && !ATTR_LABEL[r.attr]) {
        problemas.push(`${t.nome}: requisito aponta para atributo inexistente "${r.attr}"`);
      }
      if (r?.tipo === "atributoOr") {
        for (const a of r.attrs || []) {
          if (!ATTR_LABEL[a]) problemas.push(`${t.nome}: atributoOr inexistente "${a}"`);
        }
      }
      if (r?.tipo === "origem" && !getOrigem(r.id)) {
        problemas.push(`${t.nome}: requisito aponta para origem inexistente "${r.id}"`);
      }
      if (r?.tipo === "talento" && !BY_ID[r.id]) {
        problemas.push(`${t.nome}: requisito aponta para talento inexistente "${r.id}"`);
      }
      if (r?.tipo === "nd" && (!Number.isInteger(r.valor) || r.valor < 1)) {
        problemas.push(`${t.nome}: requisito nd inválido (${r.valor})`);
      }
    }
  }
  return problemas;
}
