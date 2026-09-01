/**
 * Catálogo das Especializações do Afty + resolvers puros.
 *
 * Regras confirmadas pelo autor (2026-07-17):
 *
 * 1. Especialização NÃO muda cálculo. Quem dirige fórmula é o Tipo
 *    (ver AFTY_TIPOS em ./afty-schema.js). A Especialização só (a) é
 *    pré-requisito de Habilidade de Especialização e (b) define o
 *    escalonamento de algumas habilidades.
 * 2. Tipo e Especialização são eixos INDEPENDENTES. Os nomes colidem de
 *    propósito (ver aviso abaixo).
 * 3. Nível de Especialização == ND. A soma dos níveis distribuídos é
 *    exatamente o ND da criatura, e a multiclasse divide o próprio ND.
 * 4. Multiclasse: até 2 Especializações, livre entre elas.
 * 5. Restringido é exclusiva da Origem Restringido, nos DOIS sentidos:
 *    - quem tem a origem só pode pegar Restringido, e sem multiclasse
 *    - quem não tem a origem não pode pegar Restringido
 *    A Origem Restringido também força o TIPO Restringido.
 *
 * ⚠ COLISÃO DE NOMES, PROPOSITAL (confirmada pelo autor). Combatente,
 * Conjurador e Restringido são nome de TIPO e nome de ESPECIALIZAÇÃO, e
 * querem dizer coisas diferentes. Uma criatura de Tipo Conjurador com
 * Especialização Combatente é uma ficha legal. Os dois catálogos vivem em
 * arquivos separados, então os ids não colidem de verdade, mas NÃO
 * assuma que `core.tipo === "combatente"` diz qualquer coisa sobre a
 * Especialização escolhida (nem o contrário). O único acoplamento entre
 * os eixos é a trava da Origem Restringido.
 *
 * ⚠ Ordem do array = ordem que o autor mandou, NÃO alfabética. A UI
 * renderiza nessa ordem (mesma convenção de ./afty-aptidoes.js).
 *
 * ⚠ CONTEÚDO PENDENTE: `resumo` e `descricao` estão vazios até o autor
 * mandar o texto do livro. O texto vem VERBATIM, sem parafrasear.
 */

import { registrarFamilia, remendarLista } from "./afty-addons";
import { getOrigem, origensQualificadas } from "./afty-origens";
import { AFTY_TIPOS } from "./afty-schema";

/** Teto de Especializações por ficha (multiclasse trivial: até 2). */
export const ESPECIALIZACAO_MAX = 2;

export const AFTY_ESPECIALIZACOES = [
  {
    id: "lutador",
    nome: "Lutador",
    resumo: "",
    descricao: "",
    treinamentos: { armas: ["simples", "marciais"], escudos: ["leve"] },
    exclusivaOrigemId: null,
    /* "No primeiro nível seu máximo de vida é 12 + Modificador de Constituição."
       "Em níveis subsequentes ao primeiro, seu máximo de vida aumenta em 1d10 +
       Modificador de Constituição. Você também pode escolher aumentar em 6 +
       Modificador de Constituição, ao invés de rolar."
       "Pontos de Energia Amaldiçoada. 4 Pontos de Energia por nível."
       "Um Lutador pode escolher entre Força ou Destreza como atributo-chave."
       "Requisitos para Multiclasse. Força ou Destreza 16." */
    caracteristicas: {
      pvPrimeiro: 12, pvDado: "1d10", pvPorNivel: 6,
      pePorNivel: 4, peModTecnica: false,
      atributosChave: ["forca", "destreza"],
      multiclasse: { attrs: ["forca", "destreza"], valor: 16 },
      /* "Um Teste de Resistência entre Fortitude ou Reflexos. Uma perícia de
         Ofício, Atletismo ou Acrobacia e outras três perícias quaisquer." */
      resistencias: { escolhe: 1, entre: ["fortitude", "reflexos"] },
      // 1 Ofício + 1 entre Atletismo ou Acrobacia + 3 quaisquer = 5.
      pericias: { oficios: 1, escolhe: 1, entre: ["atletismo", "acrobacia"], livres: 3 },
    },
  },
  {
    id: "combatente",
    nome: "Combatente",
    resumo: "",
    descricao: "",
    treinamentos: { armas: ["todas"], escudos: ["todos"] },
    exclusivaOrigemId: null,
    /* Igual ao Lutador em PV e PE. O atributo-chave é que ganha Sabedoria.
       "Um Especialista em Combate pode escolher entre Força, Destreza ou
       Sabedoria como atributos para calcular a CD das suas habilidades de
       especialização." */
    caracteristicas: {
      pvPrimeiro: 12, pvDado: "1d10", pvPorNivel: 6,
      pePorNivel: 4, peModTecnica: false,
      atributosChave: ["forca", "destreza", "sabedoria"],
      multiclasse: { attrs: ["forca", "destreza"], valor: 16 },
      /* "Um Teste de Resistência entre Fortitude ou Reflexos. Duas perícias de
         Ofício, Atletismo ou Acrobacia e três outras perícias quaisquer." */
      resistencias: { escolhe: 1, entre: ["fortitude", "reflexos"] },
      /* ⚠ 2 Ofícios + 1 entre Atletismo ou Acrobacia + 3 quaisquer = 6. É a
         frase que o autor desmontou em 2026-08-31: *"fornece 2 Ofícios,
         Atletismo ou Acrobacia e 3 a Escolha. Totalizando 6 Perícias."* */
      pericias: { oficios: 2, escolhe: 1, entre: ["atletismo", "acrobacia"], livres: 3 },
    },
  },
  {
    id: "conjurador",
    nome: "Conjurador",
    resumo: "",
    descricao: "",
    treinamentos: { armas: ["simples", "distancia"], escudos: [] },
    exclusivaOrigemId: null,
    /* "No primeiro nível seu máximo de vida é 10 + Modificador de Constituição."
       "aumenta em 1d8 + Modificador de Constituição [...] ou 5 + Modificador de
       Constituição, ao invés de rolar."
       "6 Pontos de Energia por nível. Um Especialista em Técnica soma seu
       modificador de atributo de técnica no máximo de energia amaldiçoada."
       "pode escolher entre Inteligência ou Sabedoria" */
    caracteristicas: {
      pvPrimeiro: 10, pvDado: "1d8", pvPorNivel: 5,
      pePorNivel: 6, peModTecnica: true,
      atributosChave: ["inteligencia", "sabedoria"],
      multiclasse: { attrs: ["inteligencia", "sabedoria"], valor: 16 },
      /* "Um Teste de Resistência entre Astúcia ou Vontade. Duas perícias de
         Ofício, Feitiçaria, Ocultismo e duas outras perícias quaisquer." */
      resistencias: { escolhe: 1, entre: ["astucia", "vontade"] },
      // 2 Ofícios + Feitiçaria + Ocultismo + 2 quaisquer = 6. A lista aqui é
      // por VÍRGULA, e não "ou": as duas entram, sem escolha.
      pericias: { oficios: 2, fixas: ["feiticaria", "ocultismo"], livres: 2 },
    },
  },
  {
    id: "suporte",
    nome: "Suporte",
    resumo: "",
    descricao: "",
    treinamentos: { armas: ["simples"], escudos: ["todos"] },
    exclusivaOrigemId: null,
    /* "5 pontos de energia por nível. Um Suporte soma seu modificador de
       atributo de técnica no máximo de energia amaldiçoada."
       "pode escolher entre Presença ou Sabedoria" */
    caracteristicas: {
      pvPrimeiro: 10, pvDado: "1d8", pvPorNivel: 5,
      pePorNivel: 5, peModTecnica: true,
      atributosChave: ["presenca", "sabedoria"],
      multiclasse: { attrs: ["presenca", "sabedoria"], valor: 16 },
      /* "Um Teste de Resistência entre Astúcia ou Vontade. Duas perícias de
         Ofício, Medicina, Prestidigitação e outras três quaisquer." */
      resistencias: { escolhe: 1, entre: ["astucia", "vontade"] },
      // 2 Ofícios + Medicina + Prestidigitação + 3 quaisquer = 7.
      pericias: { oficios: 2, fixas: ["medicina", "prestidigitacao"], livres: 3 },
    },
  },
  {
    id: "controlador",
    nome: "Controlador",
    resumo: "",
    descricao: "",
    treinamentos: { armas: ["simples", "distancia"], escudos: [] },
    exclusivaOrigemId: null,
    /* "5 pontos de energia por nível. Um Controlador soma seu modificador de
       atributo de técnica no máximo de energia amaldiçoada."
       "pode escolher entre Presença ou Sabedoria" */
    caracteristicas: {
      pvPrimeiro: 10, pvDado: "1d8", pvPorNivel: 5,
      pePorNivel: 5, peModTecnica: true,
      atributosChave: ["presenca", "sabedoria"],
      multiclasse: { attrs: ["presenca", "sabedoria"], valor: 16 },
      /* "Um Teste de Resistência entre Astúcia ou Vontade. Uma perícia de
         Ofício, Percepção, Persuasão e outras duas perícias quaisquer." */
      resistencias: { escolhe: 1, entre: ["astucia", "vontade"] },
      // 1 Ofício + Percepção + Persuasão + 2 quaisquer = 5.
      pericias: { oficios: 1, fixas: ["percepcao", "persuasao"], livres: 2 },
    },
  },
  {
    id: "restringido",
    nome: "Restringido",
    resumo: "",
    descricao: "",
    treinamentos: { armas: ["todas"], escudos: ["todos"] },
    // Só acessível com a Origem Restringido, e ela só dá acesso a esta.
    exclusivaOrigemId: "restringido",
    /* "No primeiro nível seu máximo de vida é 16 + Modificador de Constituição."
       "aumenta em 1d12 + Modificador de Constituição [...] ou 7 + Modificador de
       Constituição, ao invés de rolar."
       "Um Restringido pode escolher qualquer atributo para calcular a CD."
       "Restringidos não podem realizar Multiclasse, e não é possível fazer
       Multiclasse para Restringido."

       ⚠ A trava de multiclasse é BIDIRECIONAL no texto, e é a mesma forma da
       trava Tipo ↔ Origem fechada em 2026-08-03. `multiclasse: null` diz "não
       entra e não sai", e não só "não sai".

       ⚠ ELE NÃO TEM PONTOS DE ENERGIA, e a tabela de PE do livro simplesmente o
       omite. O motivo veio depois, verbatim: "Os Restringidos não possuem Pontos
       de Energia, recebendo os Pontos de Estamina no lugar, os quais abastecem
       suas habilidades e técnicas marciais."

       `pePorNivel: null` grava a AUSÊNCIA, e `recursoAlternativo` grava o nome do
       que vem no lugar. Zero seria uma afirmação (ele teria PE, e seria zero) e
       null é a falta dela, que é o que o livro diz.

       ⚠ SÃO 4 POR NÍVEL, e o número não veio da tabela de PE (que omite o
       Restringido): veio do autor em 2026-08-30 e é confirmado por texto de
       livro que já estava no motor. A habilidade Restrito pelos Céus diz "você
       inicia com 4 pontos de estamina, e recebe mais 4 a cada nível", que é
       exatamente 4 × nível, o mesmo do Lutador e do Combatente.

       `recursoAlternativo` guarda o NOME e `pePorNivel` guarda o VALOR: os dois
       convivem porque a Estamina É o PE, mesma pilha e outro rótulo, que é como
       o Grimório Afty já a trata (ver `semEnergia` em afty-derive.js). */
    caracteristicas: {
      pvPrimeiro: 16, pvDado: "1d12", pvPorNivel: 7,
      pePorNivel: 4, peModTecnica: false,
      recursoAlternativo: "Pontos de Estamina",
      atributosChave: null,
      multiclasse: null,
      /* "Testes de Resistência de Fortitude e Reflexos. Uma perícia de Ofício e
         outras quatro perícias quaisquer, exceto Feitiçaria."

         ⚠ O ÚNICO QUE NÃO ESCOLHE TR: o texto dá os dois de graça, com "e" no
         lugar do "entre ... ou" das outras cinco. `fixas` guarda isso, e é
         diferente de `escolhe: 2` sobre um par de dois, que daria o mesmo
         resultado por acidente e mentiria na tela ao pedir uma escolha que não
         existe.

         ⚠ E o único com VETO: "exceto Feitiçaria". `vetadas` é a lista, e ela
         vale só para as livres, porque o pool dele já é só Ofício. */
      resistencias: { fixas: ["fortitude", "reflexos"] },
      // 1 Ofício + 4 quaisquer, exceto Feitiçaria = 5.
      pericias: { oficios: 1, livres: 4, vetadas: ["feiticaria"] },
    },
  },
];

/* ============================================================ */
/* CARACTERÍSTICAS DE ESPECIALIZAÇÃO (números da ficha de JOGADOR) */
/* ============================================================ */
/* Texto VERBATIM do livro, enviado pelo autor em 2026-08-30, quando o Tipo saiu
   da Ficha de Player e os valores passaram a vir da Classe. Cada entrada carrega
   os dela, em `caracteristicas`.

   ⚠ ELES MORAM DENTRO DA ENTRADA, e não num objeto à parte indexado por id.
   Tentei o objeto à parte primeiro e o assert de Addons derrubou na hora: um
   pacote pode ACRESCENTAR uma Especialização, e ela nunca teria linha num mapa
   escrito à mão aqui. É a mesma lição que o Domínio Simples deu em 2026-08-28,
   pelo mesmo motivo: `remendarLista` troca campo a campo da ENTRADA, então
   número fora dela é número que o remendo não alcança, e o Addon mudaria o texto
   mantendo a conta velha, calado.

   ⚠ CINCO DAS SEIS REPRODUZEM A FÓRMULA DA CRIATURA. Somando os níveis,
   `pvPrimeiro + pvPorNivel × (N − 1)` dá exatamente o que a planilha calcula por
   Tipo:

     Lutador e Combatente                 12 + 6×(N−1)  = Tipo Combatente
     Conjurador, Controlador e Suporte    10 + 5×(N−1)  = Tipo Misto e Conjurador
     Restringido                          16 + 7×(N−1)  ≠ Tipo Restringido (12 × ND)

   O Restringido é o único que DIVERGE, e feio: no nível 10 são 79 contra 120.
   O livro do jogador e a planilha de criatura discordam só nele.

     pvPrimeiro     PV no primeiro nível, antes do Mod. de Constituição
     pvDado         o dado dos níveis seguintes, quando o jogador rola
     pvPorNivel     o valor fixo dos níveis seguintes, "ao invés de rolar"
     pePorNivel     Pontos de Energia por nível
     peModTecnica   soma o modificador de atributo de técnica no máximo de PE
     recursoAlternativo  o que a classe recebe no lugar do PE, quando não o tem
     atributosChave os que podem calcular a CD das habilidades de especialização
                    (null = qualquer um, que é o caso do Restringido)
     multiclasse    { attrs, valor } do requisito, ou null para quem não pode
     resistencias   { escolhe, entre } ou { fixas }: os TR que a Classe treina
     pericias       { escolhe, entre, livres, vetadas }: o pacote de perícias

   ⚠ OS DOIS SÃO PACOTE INICIAL, e não por nível. O livro os lista dentro de
   "Treinamentos", junto das armas e escudos, que já moram em `treinamentos`
   fora de `caracteristicas` desde antes.

   ⚠ `escolhe` sobre `entre` é ESCOLHA DIRIGIDA (uma perícia daquela lista), e
   `livres` é escolha aberta na lista inteira. São coisas diferentes e o livro as
   escreve numa frase só: "Uma perícia de Ofício, Atletismo ou Acrobacia e outras
   três perícias quaisquer".

   ⚠ O Mod. de Constituição entra em TODO nível, o primeiro incluído, então o
   total é `N × ModCon` e bate com o `nd * modCon` que a criatura já usa.

   ⚠ O CAMPO É OPCIONAL. As seis do livro têm, e uma Especialização vinda de
   Addon pode não ter: nesse caso ela não rende PV nem PE, e o validador só
   confere a FORMA do que existe. Bloquear a instalação seria proibir homebrew
   de classe, e o assert de famílias já instala uma sem características. */

/** As características daquela classe, ou null quando a entrada não declara. */
export const caracteristicasDaClasse = (id) => getEspecializacao(id)?.caracteristicas ?? null;

/**
 * O PV que N níveis daquela classe rendem, SEM o Modificador de Constituição.
 *
 * ⚠ `inicial` separa quem paga a base de quem não paga: só a classe inicial dá
 * o `pvPrimeiro`, e as demais dão `pvPorNivel` em todo nível. É por isso que a
 * ficha precisa saber qual classe veio primeiro, e foi o próprio autor quem
 * apontou o problema ao mandar a tabela.
 */
export function pvDaClasse(id, niveis, { inicial = false } = {}) {
  const c = caracteristicasDaClasse(id);
  const n = Math.max(0, Math.trunc(Number(niveis) || 0));
  if (!c || n <= 0) return 0;
  return inicial ? c.pvPrimeiro + c.pvPorNivel * (n - 1) : c.pvPorNivel * n;
}

/**
 * O PE que N níveis daquela classe rendem. SEM o Mod. de Técnica.
 *
 * ⚠ O modificador fica de fora de propósito, e não por descuido: o livro diz
 * "Certas Especializações permitem que um personagem some um modificador de
 * atributo UMA ÚNICA VEZ ao seu total". Ele é parcela da ficha e não da classe,
 * então somá-lo aqui o dobraria num personagem Conjurador e Suporte, que são
 * duas classes com `peModTecnica`. Quem soma é `peModTecnicaDaFicha`.
 */
export function peDaClasse(id, niveis) {
  const c = caracteristicasDaClasse(id);
  const n = Math.max(0, Math.trunc(Number(niveis) || 0));
  if (!c || n <= 0 || c.pePorNivel == null) return 0;
  return c.pePorNivel * n;
}

/**
 * Quantas Habilidades de Especialização os níveis de Classe rendem na ficha de
 * JOGADOR: **1 por nível a partir do SEGUNDO de cada Classe.**
 *
 * Verbatim do autor (2026-08-30): "Especialização você recebe 1 por Nível a
 * partir do Segundo Nível da Classe. [...] Se eu fizer Multiclasse, o primeiro
 * Nível da Multiclasse eu não recebo inclusive."
 *
 * ⚠ O DESCONTO É POR CLASSE, e não por personagem. Um Lutador 4 rende 3, e um
 * Lutador 2 com Conjurador 2 rende 2, e não 3: cada classe perde o primeiro
 * nível dela. Foi o exemplo que o autor deu, e é o que separa esta regra de um
 * simples `nível − 1`.
 *
 * ⚠ Não é o mesmo que o `nível − 1` do PV. Lá a classe INICIAL é privilegiada
 * (ela paga a base maior) e aqui todas são igualmente descontadas.
 */
export function vagasDeHabilidadePorClasse(escolhidas = []) {
  return (Array.isArray(escolhidas) ? escolhidas : [])
    .reduce((soma, e) => soma + Math.max(0, Math.trunc(Number(e?.nivel) || 0) - 1), 0);
}

/**
 * O personagem soma o Mod. de Atributo de Técnica no PE máximo?
 *
 * ⚠ UMA ÚNICA VEZ, mesmo com duas classes que dão o benefício. Verbatim do
 * livro: "Certas Especializações permitem que um personagem some um modificador
 * de atributo uma única vez ao seu total." Por isso a resposta é booleana e não
 * uma contagem, e por isso ela é da FICHA e não da classe.
 *
 * `classes` = lista de ids de Especialização com nível na ficha.
 */
export const peModTecnicaDaFicha = (classes = []) =>
  classes.some((id) => caracteristicasDaClasse(id)?.peModTecnica === true);


/**
 * O pacote de perícias e Testes de Resistência que a ficha recebe na criação.
 *
 * ⚠ SÓ A CLASSE INICIAL DÁ PACOTE (autor, 2026-08-30). A segunda Classe da
 * multiclasse entra apenas pelos níveis dela, sem treinamento inicial nenhum. O
 * autor escolheu isso entre dar o pacote inteiro e dar só as perícias livres.
 *
 * ⚠ A Classe inicial é a PRIMEIRA DA LISTA, a mesma régua do PV. Duas
 * definições de "classe inicial" na mesma ficha seriam duas coisas para o
 * jogador manter em dia, e elas divergiriam no primeiro reordenamento.
 *
 * Devolve `null` quando não há Classe nenhuma: uma ficha sem Especialização não
 * tem pacote, e isso é diferente de ter um pacote vazio.
 */
export function pacoteInicialDaFicha(escolhidas = []) {
  const primeira = (Array.isArray(escolhidas) ? escolhidas : [])[0];
  const c = caracteristicasDaClasse(primeira?.id);
  if (!c) return null;
  const pericias = c.pericias ?? {};
  const resistencias = c.resistencias ?? {};
  const periciasEscolhe = Math.max(0, Math.trunc(Number(pericias.escolhe) || 0));
  const periciasEntre = Array.isArray(pericias.entre) ? pericias.entre : [];
  /* ⚠ A FRASE DO LIVRO TEM TRÊS PARTES, E ATÉ 2026-08-31 ELA ERA LIDA COMO UMA.
     *"Duas perícias de Ofício, Atletismo ou Acrobacia e três outras perícias
     quaisquer"* não é "duas de uma lista de três": é **duas de Ofício**, mais
     **uma entre Atletismo ou Acrobacia**, mais três quaisquer. Seis, e o site
     dava cinco (autor, 2026-08-31).

     A pontuação é que separa as duas últimas partes, e é a mesma distinção que
     os TR do Restringido já faziam: **"ou" é escolha, VÍRGULA é as duas**. Por
     isso o Conjurador recebe Feitiçaria E Ocultismo (`fixas`) e o Combatente
     escolhe UMA entre Atletismo ou Acrobacia (`escolhe`/`entre`). */
  const periciasOficios = Math.max(0, Math.trunc(Number(pericias.oficios) || 0));
  const periciasFixas = Array.isArray(pericias.fixas) ? pericias.fixas : [];

  const trEscolhe = Math.max(0, Math.trunc(Number(resistencias.escolhe) || 0));
  const trEntre = Array.isArray(resistencias.entre) ? resistencias.entre : [];
  const trFixos = Array.isArray(resistencias.fixas) ? resistencias.fixas : [];
  /* ⚠ ESCOLHA QUE SÓ TEM UM CAMINHO NÃO É ESCOLHA (autor, 2026-08-30: "faça com
     que eu receba de forma obrigatória os TRs e Perícias já selecionados"). O
     Restringido recebe "uma perícia de Ofício", que é `escolhe: 1` sobre uma
     lista de um: Ofício já está decidido, e a ficha o RECEBE em vez de pedir que
     o jogador escolha entre uma opção só. A comparação é `escolhe >= entre` e
     não `entre.length === 1`, para valer também se uma Classe futura pedir duas
     de uma lista de duas. */
  const dirigidasAutomaticas = (escolhe, entre) => (escolhe >= entre.length ? [...entre] : []);
  return {
    classeId: primeira.id,
    classeNome: getEspecializacao(primeira.id)?.nome ?? primeira.id,
    /* Quantas linhas de Ofício a Classe treina. Elas contam no total, e o
       jogador marca quais: o Ofício de cada linha é escolha dele (Ferreiro,
       Farmacêutico). Quem garante que as linhas EXISTEM na ficha é o
       `catalogoPericiasDaFicha`, que lê este mesmo número. */
    periciasOficios,
    /* Perícias que a Classe dá SEM escolha, porque o texto as separa por
       vírgula em vez de "ou" ("Feitiçaria, Ocultismo"). Elas contam no total e
       o jogador as marca: ver a nota do `periciasAutomaticas` abaixo. */
    periciasFixas,
    /* Perícias que a Classe treina numa escolha de verdade ("Atletismo ou
       Acrobacia"). */
    periciasEscolhe,
    periciasEntre,
    /* Perícias "quaisquer". */
    periciasLivres: Math.max(0, Math.trunc(Number(pericias.livres) || 0)),
    /* O veto do Restringido ("exceto Feitiçaria"), que vale só para as livres. */
    periciasVetadas: Array.isArray(pericias.vetadas) ? pericias.vetadas : [],
    /* TR escolhido numa lista ("entre Fortitude ou Reflexos"), ou os fixos do
       Restringido, que o texto dá com "e" em vez de "entre ... ou". */
    trEscolhe,
    trEntre,
    trFixos,
    /* ⚠ PERÍCIA NÃO CHEGA MARCADA (autor, 2026-08-31): *"Não era para FORÇAR as
       perícias já que tem escolhas e coisa do gênero. Só colocar no contador
       como estava antes, porém com o número correto."*

       O pacote decide QUANTAS, e o jogador decide QUAIS. Mesmo a parte que o
       livro já nomeia tem escolha dentro (qual Ofício, qual faixa), e uma linha
       verde que não desmarca tira do jogador uma decisão que é dele.

       Não existe mais `periciasAutomaticas`, e o campo saiu em vez de virar uma
       lista sempre vazia: um campo que ninguém preenche envelhece calado.

       ⚠ O TR É OUTRA HISTÓRIA, e segue concedido. O livro escreve em caixa alta
       que eles "NÃO PODEM SER ESCOLHIDOS DE FORMA LIVRE, SENDO RECEBIDO POR
       ESPECIALIZAÇÃO", e eles não contam para o Limite de Perícias. */
    trAutomaticos: [...trFixos, ...dirigidasAutomaticas(trEscolhe, trEntre)],
  };
}

/**
 * Quantas perícias a ficha de JOGADOR pode treinar.
 *
 * `pacote` vem de `pacoteInicialDaFicha` e `modAtributo` é o modificador do
 * atributo que o jogador escolheu na criação.
 *
 * ⚠ O ATRIBUTO É ESCOLHIDO, E NÃO O MAIOR. Verbatim: "você pode escolher entre
 * os atributos Inteligência ou Sabedoria para receber novas perícias. Esta
 * escolha não pode ser modificada nem revertida após a criação do personagem,
 * sendo algo definitivo." A criatura usa `Math.max(modInt, modSab)`, que é o
 * contrário: ela sempre pega o melhor dos dois, sem escolher.
 *
 * ⚠ E O TR NÃO ENTRA NA CONTA. "TESTES DE RESISTÊNCIA [...] não contam para o
 * Limite de Pericias", em caixa alta no livro. Na criatura eles contam.
 */
export function totalPericiasDoJogador(pacote, modAtributo = 0) {
  return vagasDoPacote(pacote) + Math.max(0, Math.trunc(Number(modAtributo) || 0));
}

/**
 * Quantas perícias o pacote da Classe treina, somando as quatro partes da frase
 * do livro: as linhas de Ofício, as fixas, a escolha dirigida e as livres.
 *
 * ⚠ ELE NÃO DESCONTA MAIS AS AUTOMÁTICAS (2026-08-31). Descontava até então, e o
 * total do Combatente saía 5 onde o livro dá 6. A concessão passou a OCUPAR a
 * vaga em vez de sair do total: a linha chega treinada e já cobrada, então a
 * ficha continua treinando exatamente o que a Classe promete.
 */
export function vagasDoPacote(pacote) {
  if (!pacote) return 0;
  return Math.max(0, pacote.periciasOficios + pacote.periciasFixas.length
    + pacote.periciasEscolhe + pacote.periciasLivres);
}

/**
 * Sanidade das características. Só confere a FORMA do que existe: entrada sem
 * `caracteristicas` é válida, porque Addon pode acrescentar classe.
 */
export function validarCaracteristicasDeClasse() {
  const erros = [];
  for (const e of AFTY_ESPECIALIZACOES) {
    const c = e.caracteristicas;
    if (c == null) continue;
    if (typeof c !== "object" || Array.isArray(c)) {
      erros.push(`${e.nome}: caracteristicas tem de ser objeto`);
      continue;
    }
    for (const campo of ["pvPrimeiro", "pvPorNivel"]) {
      if (!Number.isFinite(c[campo]) || c[campo] <= 0) {
        erros.push(`${e.nome}: ${campo} tem de ser número positivo`);
      }
    }
    if (typeof c.pvDado !== "string" || !/^1d[0-9]+$/.test(c.pvDado)) {
      erros.push(`${e.nome}: pvDado inválido`);
    }
    /* ⚠ `null` é resposta VÁLIDA e diferente de zero: o livro não dá linha de PE
       ao Restringido. Zero seria uma afirmação, e null é a falta dela. */
    if (c.pePorNivel !== null && (!Number.isFinite(c.pePorNivel) || c.pePorNivel <= 0)) {
      erros.push(`${e.nome}: pePorNivel tem de ser positivo ou null`);
    }
    if (typeof c.peModTecnica !== "boolean") {
      erros.push(`${e.nome}: peModTecnica tem de ser booleano`);
    }
    /* ⚠ `recursoAlternativo` é o NOME da pilha, e não uma segunda pilha. O
       Restringido tem os dois campos preenchidos de propósito: ele recebe 4 por
       nível como todo mundo e chama isso de Estamina. O que não pode existir é
       classe sem valor E sem nome, que seria uma classe sem recurso nenhum e
       sem dizer por quê. */
    if (c.pePorNivel == null && !c.recursoAlternativo) {
      erros.push(`${e.nome}: sem pePorNivel e sem recursoAlternativo`);
    }
    if (c.recursoAlternativo != null && typeof c.recursoAlternativo !== "string") {
      erros.push(`${e.nome}: recursoAlternativo tem de ser texto`);
    }
    if (c.atributosChave !== null && (!Array.isArray(c.atributosChave) || !c.atributosChave.length)) {
      erros.push(`${e.nome}: atributosChave tem de ser lista ou null`);
    }
    /* Os pacotes de perícia e TR. Opcionais como o resto de `caracteristicas`,
       e conferidos só na FORMA: os ids são validados contra os catálogos de
       Perícias e de Resistências pelo `t-sistema.mjs`, e não aqui, porque
       importar os dois fecharia ciclo com este módulo. */
    for (const [campo, tabela] of [["resistencias", c.resistencias], ["pericias", c.pericias]]) {
      if (tabela == null) continue;
      if (typeof tabela !== "object" || Array.isArray(tabela)) {
        erros.push(`${e.nome}: ${campo} tem de ser objeto`);
        continue;
      }
      const temEscolha = tabela.escolhe != null;
      const temFixas = Array.isArray(tabela.fixas);
      if (!temEscolha && !temFixas && !tabela.livres) {
        erros.push(`${e.nome}: ${campo} não concede nada`);
      }
      if (temEscolha) {
        if (!Number.isInteger(tabela.escolhe) || tabela.escolhe <= 0) {
          erros.push(`${e.nome}: ${campo}.escolhe tem de ser inteiro positivo`);
        }
        if (!Array.isArray(tabela.entre) || tabela.entre.length < 1) {
          erros.push(`${e.nome}: ${campo}.escolhe sem lista \`entre\``);
        } else if (tabela.escolhe > tabela.entre.length) {
          /* Pedir 3 de uma lista de 2 é pacote impossível, e sem esta linha ele
             passaria calado e a tela travaria numa escolha que não fecha. */
          erros.push(`${e.nome}: ${campo}.escolhe pede mais do que a lista tem`);
        }
      }
      if (tabela.livres != null && (!Number.isInteger(tabela.livres) || tabela.livres < 0)) {
        erros.push(`${e.nome}: ${campo}.livres tem de ser inteiro não negativo`);
      }
      if (tabela.vetadas != null && !Array.isArray(tabela.vetadas)) {
        erros.push(`${e.nome}: ${campo}.vetadas tem de ser lista`);
      }
    }
    if (c.multiclasse !== null) {
      if (!Array.isArray(c.multiclasse?.attrs) || !c.multiclasse.attrs.length) {
        erros.push(`${e.nome}: multiclasse sem atributos`);
      }
      if (!Number.isFinite(c.multiclasse?.valor)) {
        erros.push(`${e.nome}: multiclasse sem valor`);
      }
    }
  }
  return erros;
}

/* ============================================================ */
/* ADDONS                                                        */
/* ============================================================ */
/* Quarta família ligada (2026-08-20), e uma das que o autor nomeou de saída:
   *"os Addons podem ser usados para criar Novas Especializações"*. O índice é a
   única estrutura derivada, porque os filtros de origem rodam na chamada.

   ⚠ A Especialização é a família de forma mais SIMPLES do sistema (5 campos),
   e ao mesmo tempo a de consequência mais larga: quem cria uma precisa criar as
   Habilidades dela também, senão nasce uma classe vazia. O validador não cobra
   isso, e nem deveria: classe sem habilidade é ficha incompleta, não é erro. */

let BY_ID = {};

const ESPECIALIZACOES_BASE = AFTY_ESPECIALIZACOES.slice();

function aplicarExtrasEspecializacoes(extras = [], remendos = null) {
  AFTY_ESPECIALIZACOES.splice(0, AFTY_ESPECIALIZACOES.length, ...remendarLista(ESPECIALIZACOES_BASE, remendos), ...extras);
  BY_ID = Object.fromEntries(AFTY_ESPECIALIZACOES.map((e) => [e.id, e]));
}

aplicarExtrasEspecializacoes();

registrarFamilia("especializacoes", {
  rotulo: "Especialização",
  chave: "id",
  obrigatorios: ["nome"],
  aplicar: aplicarExtrasEspecializacoes,
  basicos: () => ESPECIALIZACOES_BASE,
  validador: validarCatalogoEspecializacoes,
  resolver: (id) => getEspecializacao(id),
  // A ficha guarda `[{ id, nivel }]`, e não uma lista de ids crus.
  idsDaFicha: (c) => (Array.isArray(c?.especializacoes)
    ? c.especializacoes.map((e) => e?.id).filter(Boolean)
    : []),
});


export const getEspecializacao = (id) => BY_ID[id] || null;

/**
 * Treinamentos de equipamento concedidos pelas Especializações escolhidas.
 * Multiclasse reúne as fontes sem duplicar categorias. O resultado continua
 * sendo dado de regra, não uma escolha gravada na ficha.
 */
export function treinamentosDasEspecializacoes(especializacoes = []) {
  const armas = new Set();
  const escudos = new Set();
  for (const entrada of Array.isArray(especializacoes) ? especializacoes : []) {
    const id = typeof entrada === "string" ? entrada : entrada?.id;
    const treinamentos = BY_ID[id]?.treinamentos;
    for (const arma of treinamentos?.armas ?? []) armas.add(arma);
    for (const escudo of treinamentos?.escudos ?? []) escudos.add(escudo);
  }
  return { armas: [...armas], escudos: [...escudos] };
}

/**
 * Especializações que a origem permite escolher, na ordem do catálogo.
 *
 * A trava é nos dois sentidos: a Origem Restringido vê SÓ Restringido, e
 * as outras origens veem todas MENOS as exclusivas.
 *
 * `extras` são OUTRAS origens que a criatura conta como suas sem ser dela. Hoje
 * só o Gêmeo tem isso, por Verdadeiras Origens: pegando o Físico Abençoado ele
 * *"recebe acesso a especialização Restringido"*, que é o que a característica
 * literalmente diz. A diferença entre a origem própria e uma extra importa: a
 * própria TRANCA (a Origem Restringido vê só Restringido), a extra só ABRE.
 */
export function especializacoesDisponiveis(origemId, extras = []) {
  const exclusiva = AFTY_ESPECIALIZACOES.find((e) => e.exclusivaOrigemId === origemId);
  if (exclusiva) return [exclusiva];
  const abertas = extras.filter((x) => x && x !== origemId);
  return AFTY_ESPECIALIZACOES.filter(
    (e) => e.exclusivaOrigemId == null || abertas.includes(e.exclusivaOrigemId),
  );
}

/** Quantas Especializações a origem permite. Restringido não multiclassa. */
export function maxEspecializacoes(origemId, extras = []) {
  return especializacoesDisponiveis(origemId, extras).length === 1 ? 1 : ESPECIALIZACAO_MAX;
}

/**
 * Especialização que a origem OBRIGA, ou null quando a escolha é livre.
 * Hoje só a Origem Restringido obriga.
 */
export function especializacaoObrigatoria(origemId) {
  const exclusiva = AFTY_ESPECIALIZACOES.find((e) => e.exclusivaOrigemId === origemId);
  return exclusiva ? exclusiva.id : null;
}

/**
 * Tipo que a origem OBRIGA (chave de AFTY_TIPOS), ou null quando o Tipo é
 * livre. É o ÚNICO ponto onde os eixos Tipo e Especialização se tocam: a
 * Origem Restringido força os dois (autor, 2026-07-17). Não generalize
 * isso para uma relação Tipo × Especialização, ela não existe.
 */
export function tipoObrigatorio(origemId) {
  return origemId === "restringido" ? "restringido" : null;
}

/**
 * Tipos que a origem alcança, na ordem do catálogo.
 *
 * ⚠ A trava do Restringido é BIDIRECIONAL também no eixo do Tipo (autor,
 * 2026-08-03): "a origem força o Tipo, e o tipo força a origem, é impossível
 * ver um Restringido sem a Origem e o Tipo Restringido ao mesmo tempo". Até
 * aqui só a metade origem → tipo existia, e o Tipo Restringido podia ser
 * escolhido com qualquer origem, o que fazia uma criatura sem energia
 * amaldiçoada (`semEnergia` lê o TIPO) continuar com aba de Aptidões
 * escondida e, ainda assim, com os Treinamentos de energia à mostra.
 *
 * Mesmo formato de `especializacoesDisponiveis`: a Origem Restringido vê SÓ
 * Restringido, e as outras veem todos MENOS Restringido.
 */
/**
 * ⚠ A ORIGEM GÊMEOS FURA A TRAVA DO TIPO (autor, 2026-08-07: *"Gêmeo
 * Restringido deveria ser do Tipo: Restringido"*).
 *
 * Ela é a única exceção, e o motivo está no próprio livro: a Restrição
 * Celestial dos Gêmeos tem DOIS ramos, um para o Gêmeo Restringido e outro para
 * o Feiticeiro, e o texto ainda recomenda que *"ao menos um dos gêmeos seja
 * restringido"*. Sem esta exceção o ramo inteiro do Restringido era
 * INALCANÇÁVEL no criador: `tiposDisponiveis` devolvia todos os Tipos menos
 * Restringido, e a metade da origem simplesmente não podia ser montada.
 *
 * ⚠ Isto abre só o TIPO. A Especialização Restringido continua exclusiva da
 * Origem Restringido: no livro ela chega ao Gêmeo pelo Físico Abençoado das
 * Verdadeiras Origens, e aquela escolha ainda não tem efeito ligado.
 */
const ORIGENS_QUE_ALCANCAM_RESTRINGIDO = ["restringido", "gemeos"];

export function tiposDisponiveis(origemId) {
  const forcado = tipoObrigatorio(origemId);
  if (forcado) return AFTY_TIPOS.filter((t) => t.value === forcado);
  if (ORIGENS_QUE_ALCANCAM_RESTRINGIDO.includes(origemId)) return AFTY_TIPOS;
  return AFTY_TIPOS.filter((t) => t.value !== "restringido");
}

/**
 * O Tipo que a ficha deve ficar ao trocar de origem: o forçado, ou o atual
 * quando ele continua alcançável, ou o primeiro da lista. Chamado na TROCA
 * (não na leitura), como o `especializacoesDisponiveis` do normalize: o Tipo é
 * escolha guardada, e deixá-lo ilegal na ficha faria `semEnergia` mentir.
 */
export function tipoDaOrigem(origemId, tipoAtual) {
  const permitidos = tiposDisponiveis(origemId);
  if (permitidos.some((t) => t.value === tipoAtual)) return tipoAtual;
  return permitidos[0]?.value ?? tipoAtual;
}

/**
 * Saneia a lista da ficha: descarta ids desconhecidos e duplicados,
 * força nível inteiro >= 1, e apara no teto da origem. Tolera ficha
 * antiga/parcial (o campo é `[{ id, nivel }]`).
 *
 * O `nome` NÃO é guardado na ficha: o catálogo é a fonte da verdade, e
 * gravar o rótulo junto faria uma errata de nome deixar fichas velhas
 * mentindo. Quem precisa do nome chama getEspecializacao(id).
 */
export function normalizeEspecializacoes(lista, origemId, extras = []) {
  const arr = Array.isArray(lista) ? lista : [];
  const vistos = new Set();
  const disponiveis = new Set(especializacoesDisponiveis(origemId, extras).map((e) => e.id));
  const out = [];
  for (const item of arr) {
    const id = item?.id;
    if (!BY_ID[id] || vistos.has(id) || !disponiveis.has(id)) continue;
    vistos.add(id);
    out.push({ id, nivel: Math.max(1, Math.trunc(Number(item?.nivel) || 0) || 1) });
    if (out.length >= maxEspecializacoes(origemId, extras)) break;
  }
  return out;
}

/**
 * Resolve o estado das Especializações da ficha.
 *
 * O orçamento de níveis é o PRÓPRIO ND (autor, 2026-07-17): a soma dos
 * níveis é sempre exatamente o ND. Nada aqui alimenta o cálculo de stats.
 *
 * ⚠ A soma é garantida POR CONSTRUÇÃO, não validada depois. Como
 * soma(niveis) === ND é regra dura, uma ficha com 2 especializações tem
 * UM grau de liberdade só: escolhido o nível da primeira, o da segunda é
 * o resto do ND. Com 1 especialização não há escolha nenhuma, o nível é
 * o ND inteiro. Então a ficha guarda só o PONTO DE DIVISÃO (o nível da
 * primeira) e o resto é derivado aqui — "guarde escolhas, nunca
 * resultados". Isso faz o estado ilegal deixar de existir: mexer no ND
 * depois reflui sozinho no nível, em vez de deixar a ficha inconsistente
 * esperando validação.
 *
 * O nível gravado da 2ª especialização é IGNORADO na leitura (ele é
 * sempre `total - primeira`). O aparo é só de leitura, não é gravado:
 * baixar o ND e subir de volta traz a divisão original (mesma convenção
 * de resolveNiveisAptidao em ./afty-aptidoes.js).
 *
 * Cada especialização tem nível mínimo 1, então só cabe multiclasse a
 * partir do ND 2. No ND 1 a segunda é aparada fora.
 *
 * Retorna { escolhidas, total, max, obrigatoria, completa, erro }.
 */
export function resolveEspecializacoes(creature) {
  const origemId = creature?.core?.origem?.id;
  // As origens que a criatura conta como suas além da própria (Verdadeiras
  // Origens). Só ABREM especialização exclusiva, nunca trancam.
  const extras = origensQualificadas(creature);
  const total = Math.max(1, Math.trunc(Number(creature?.core?.nd) || 1));
  const lista = normalizeEspecializacoes(creature?.especializacoes, origemId, extras);
  const max = maxEspecializacoes(origemId, extras);
  const obrigatoria = especializacaoObrigatoria(origemId);

  let escolhidas;
  if (lista.length === 0) {
    escolhidas = [];
  } else if (lista.length === 1 || total < 2) {
    // Sem divisão possível: a primeira leva o ND inteiro.
    escolhidas = [{ id: lista[0].id, nivel: total }];
  } else {
    // Ponto de divisão: a 1ª fica entre 1 e ND-1, a 2ª leva o resto.
    const primeira = Math.min(Math.max(lista[0].nivel, 1), total - 1);
    escolhidas = [
      { id: lista[0].id, nivel: primeira },
      { id: lista[1].id, nivel: total - primeira },
    ];
  }

  // Nível de ESCALONAMENTO por classe = nível real + metade do nível das OUTRAS
  // classes (arredondando para baixo). Só para efeitos que ESCALAM com o nível
  // (ex.: acesso a graus de Invocação, Concentrar Poder, Estilo Defensivo). Os
  // PRÉ-REQUISITOS de habilidade continuam usando o nível REAL (`nivel`).
  const somaTodas = escolhidas.reduce((s, e) => s + e.nivel, 0);
  escolhidas = escolhidas.map((e) => ({
    ...e,
    nivelEscalonamento: e.nivel + Math.floor((somaTodas - e.nivel) / 2),
  }));

  return {
    escolhidas,
    total,
    max,
    obrigatoria,
    // O único estado incompleto que sobra é não ter escolhido nenhuma.
    completa: escolhidas.length > 0,
    erro: escolhidas.length === 0 ? "nenhuma" : null,
  };
}

/**
 * Validador de conteúdo (mesmo papel de validarCatalogoAptidoes): ids
 * únicos, nomes únicos, e exclusivaOrigemId apontando para origem que
 * existe de verdade. Devolve lista de problemas (vazia = catálogo são).
 * Rodar a cada leva de conteúdo novo.
 */
export function validarCatalogoEspecializacoes() {
  const problemas = [];
  const ids = new Set();
  const nomes = new Set();

  for (const e of AFTY_ESPECIALIZACOES) {
    if (ids.has(e.id)) problemas.push(`id duplicado: ${e.id}`);
    ids.add(e.id);

    const nomeKey = e.nome.toLowerCase();
    if (nomes.has(nomeKey)) problemas.push(`nome duplicado: ${e.nome}`);
    nomes.add(nomeKey);

    if (e.exclusivaOrigemId != null && !getOrigem(e.exclusivaOrigemId)) {
      problemas.push(`${e.nome}: exclusivaOrigemId aponta para origem inexistente (${e.exclusivaOrigemId})`);
    }
  }
  /* As características de classe entram no MESMO validador, e não num à parte:
     um bloco de números com validador que ninguém chama é o mesmo que não ter
     validador. É o encaixe que o Domínio Simples usou em 2026-08-28. */
  problemas.push(...validarCaracteristicasDeClasse());
  return problemas;
}
