/**
 * ============================================================
 * EQUIPAMENTOS — GRIMÓRIO AFTY (Capítulo de Equipamentos)
 * ============================================================
 * Catálogo + resolvers da aba Equipamentos (ex-Inventário).
 * Texto do livro VERBATIM. Transcrição de referência em
 * ../../../docs/afty-equipamentos.md.
 *
 * Quatro tipos de equipamento: Armas, Uniformes, Escudos e Itens
 * Especiais. Mais os Kits de Ferramentas (o autor ainda não mandou
 * a lista, ver KITS_FERRAMENTAS).
 *
 * O que este arquivo NÃO faz:
 *   • Ferramentas Amaldiçoadas (encantar arma, subir de grau). É o
 *     próximo acréscimo do autor e traz os Graus de Equipamento.
 *   • Níveis de Dano. A escada canônica já existe em
 *     ./afty-invocacoes.js (subirNiveisDano) e o autor confirmou que
 *     ela vale para as armas. Nada no equipamento base sobe nível de
 *     dano, então a extração para arquivo comum fica para quando as
 *     Ferramentas Amaldiçoadas chegarem.
 *   • Efeitos de item que dependem de sistema inexistente (Perícias,
 *     Estamina, Dados de Vida, Exaustão, condições). Ficam como dado
 *     inerte no campo `efeito`, com `aplicado: false`.
 * ============================================================
 */

import { evalNumber, validateExpression } from "../../components/fm-dsl";

/* ============================================================ */
/* GRAU DO FEITICEIRO                                           */
/* ============================================================ */
/* Os mesmos 5 graus das Invocações (AFTY_INV_GRAUS). Não existe
   "Grau Zero" (removido a pedido do autor em 2026-07-22).
   O grau NÃO é campo da ficha: sai do ND por faixa. */

export const AFTY_GRAUS = [
  { value: "quarto",   label: "Quarto Grau",   rank: 1, ndMin: 1 },
  { value: "terceiro", label: "Terceiro Grau", rank: 2, ndMin: 5 },
  { value: "segundo",  label: "Segundo Grau",  rank: 3, ndMin: 9 },
  { value: "primeiro", label: "Primeiro Grau", rank: 4, ndMin: 13 },
  { value: "especial", label: "Grau Especial", rank: 5, ndMin: 17 },
];

/** Grau do feiticeiro pela faixa de ND (autor, 2026-07-22). */
export function grauFeiticeiro(nd) {
  const n = Math.max(1, nd ?? 1);
  // Do mais alto para o mais baixo: o primeiro que couber é o grau.
  for (let i = AFTY_GRAUS.length - 1; i >= 0; i--) {
    if (n >= AFTY_GRAUS[i].ndMin) return AFTY_GRAUS[i];
  }
  return AFTY_GRAUS[0];
}

/* ============================================================ */
/* GRAU PARA CÁLCULO (redução por encantamento)                 */
/* ============================================================ */
/* Ficha de CRIATURA (autor, 2026-08-01): encantamento em arma, escudo ou
   uniforme não é recomendado para criatura, e o preço dele é o grau. Cada
   encantamento escolhido desce UM degrau na hora de calcular Dano, Acerto,
   Defesa e RD. Uma arma de Grau Especial com um encantamento calcula como
   Primeiro Grau, com dois calcula como Segundo, e assim por diante.

   Duas coisas ficam DE FORA da conta:
     • A Habilidade Única do Grau Especial (autor). Ela não é encantamento e
       não desce nada, e o `grau` que a expressão dela lê é o REAL.
     • Quantos encantamentos o item aceita, que segue vindo do grau real
       (faEncantamentosPermitidos). Se descesse junto, a conta se morderia:
       pegar um encantamento cortaria o limite que autorizou pegá-lo. */

/** Rank do grau depois da redução por encantamento. Piso 0, que é "sem grau"
    e não soma nada em lugar nenhum. */
export function grauRankCalculo(grauValue, nEncantamentos = 0) {
  const rank = AFTY_GRAUS.find((g) => g.value === grauValue)?.rank ?? 0;
  return Math.max(0, rank - Math.max(0, Math.trunc(nEncantamentos ?? 0)));
}

/** O grau de um rank, ou null no rank 0 (que não é grau nenhum). */
export const grauDoRank = (rank) => AFTY_GRAUS.find((g) => g.rank === rank) ?? null;

/**
 * Defesa de uma armadura vestida (autor, 2026-08-01, segunda passada): o CUSTO
 * dela, mais 1 por grau de Ferramenta. Um Revestimento Robusto (custo 3) de
 * Segundo Grau dá 3 + 3 = 6.
 *
 * ⚠ Substituiu o "+1 fixo para toda armadura" da primeira passada do mesmo dia.
 * A coluna de Defesa da tabela de modificações (Leve +2, Robusto +6) segue sem
 * valer: quem manda é o custo.
 *
 * O Uniforme Comum tem custo 0 (é o inicial), então ele dá 0 de Defesa.
 *
 * `defesaCriatura` no catálogo é a exceção declarada: hoje só Sob Medida a tem,
 * porque ela custa 2 e dá 1 (o benefício dela é em Perícia).
 */
export const defesaDaArmadura = (def, grauDefesa = 0) =>
  (def?.defesaCriatura ?? def?.custo ?? 0) + Math.max(0, grauDefesa);

/* ============================================================ */
/* ORÇAMENTO (INDICATIVO)                                       */
/* ============================================================ */
/* O autor definiu (2026-07-22) que o orçamento é INDICATIVO: a aba
   conta e mostra, mas não bloqueia nada. O livro já prevê itens
   vindos de talento, recompensa, saque e confecção, fora do conjunto
   concedido pelo Colégio. */

/** Equipamento inicial de todo personagem. */
export const EQUIP_INICIAL = {
  custo: { 1: 2 },              // dois equipamentos de custo 1
  uniforme: 1,                  // um uniforme comum
  kits: 1,                      // um kit de ferramentas a sua escolha
  texto: "Dois equipamentos de custo 1 (arma, escudo ou item especial), um uniforme comum e um kit de ferramentas a sua escolha.",
};

/** Conjunto concedido no começo de toda missão, por grau do feiticeiro.
    `Infinity` no Grau Especial custo 1 é o "Ilimitado" do livro. */
export const EQUIP_GANHO_POR_GRAU = {
  quarto:   { 1: 2 },
  terceiro: { 1: 3, 2: 1 },
  segundo:  { 1: 3, 2: 2, 3: 1 },
  primeiro: { 1: 3, 2: 3, 3: 2, 4: 1 },
  especial: { 1: Infinity, 2: 4, 3: 3, 4: 2 },
};

export const CUSTOS = [1, 2, 3, 4];

/* ============================================================ */
/* ESPAÇOS E CARREGAMENTO                                       */
/* ============================================================ */

/** Limite de carga = 8 espaços + o dobro do modificador de Força.
    O "-2 por modificador negativo" do livro é a mesma conta: os dois
    exemplos dele (+2 Força dá 12, -1 Força dá 6) batem com esta fórmula. */
export const capacidadeCarga = (modForca) => 8 + 2 * (modForca ?? 0);

/** Sobrecarregado: -5 na Defesa e -4,5m no Deslocamento. */
export const SOBRECARGA_DEFESA = -5;
export const SOBRECARGA_MOVIMENTO = -4.5;

/* Espaços por categoria de Item Especial.
   ⚠ DECISÃO PENDENTE DO AUTOR: o livro diz "Itens consumíveis como
   talismãs e misturas, ocupam meio espaço". "Como" é exemplo, não
   lista fechada, então Fármacos e Espirituais (que também são
   consumidos) entram como meio espaço aqui. Acessórios são vestidos,
   não consumidos, e ficam com 1. Se o autor quiser a leitura literal
   (só talismã e mistura), é só mudar esta tabela. */
export const ESPACOS_POR_CATEGORIA_ITEM = {
  acessorio: 1,
  espiritual: 0.5,
  farmaco: 0.5,
  mistura: 0.5,
  talisma: 0.5,
};

/* ============================================================ */
/* ARMAS · GRUPOS                                               */
/* ============================================================ */

export const ARMA_GRUPOS = [
  { value: "faca",     label: "Faca" },
  { value: "bastao",   label: "Bastão" },
  { value: "espada",   label: "Espada" },
  { value: "pugilato", label: "Pugilato" },
  { value: "haste",    label: "Haste" },
  { value: "machado",  label: "Machado" },
  { value: "chicote",  label: "Chicote" },
  { value: "martelo",  label: "Martelo" },
  { value: "arco",     label: "Arco" },
  { value: "besta",    label: "Besta" },
  { value: "tiro",     label: "Tiro" },
  { value: "dardo",    label: "Dardo" },
];

export const grupoLabel = (v) => ARMA_GRUPOS.find((g) => g.value === v)?.label ?? "Sem grupo";

/** Tipos de dano usados pelas armas. */
export const TIPOS_DANO = {
  ct: "Cortante",
  im: "Impacto",
  pf: "Perfurante",
  queimante: "Queimante",
};

/* ============================================================ */
/* ARMAS · PROPRIEDADES GERAIS (texto verbatim)                 */
/* ============================================================ */
/* `param` diz o que o valor da propriedade significa na ficha da arma:
     null      -> booleana
     "dado"    -> tamanho de dado ("d10")
     "tipo"    -> tipo de dano ("ct")
     "numero"  -> número solto (Força mínima, número de ataques)
     "alcance" -> par [curto, longo] em metros */

export const ARMA_PROPRIEDADES = [
  { id: "ampla", nome: "Ampla", param: null,
    descricao: "A arma é boa para ataques amplos ou giratórios. Uma vez por rodada, quando atacar com ela, você pode escolher outro alvo adjacente a criatura, caso a Defesa dela seja menor do que o resultado do seu crítico, ela recebe metade do dano causado." },
  { id: "aparar", nome: "Aparar", param: null,
    descricao: "A arma pode ser usada de maneira defensiva, bloqueando ataques. Enquanto empunhando a arma, caso seja treinado, você pode usar uma ação de movimento para posicioná-la defensivamente, recebendo +2 em sua Defesa até o começo do próximo turno." },
  { id: "apunhaladora", nome: "Apunhaladora", param: null,
    descricao: "A arma é boa para apunhalar discretamente. Quando atingir uma criatura desprevenida, a arma causa dano adicional igual ao seu bônus de treinamento." },
  { id: "arremessavel", nome: "Arremessável", param: "alcance",
    descricao: "A arma pode ser usada em ataques de arremesso na distância especificada juntamente dos traços." },
  { id: "duas_maos", nome: "Duas Mãos", param: null,
    descricao: "A arma só pode ser manuseada de maneira apropriada com as duas mãos." },
  { id: "dupla", nome: "Dupla", param: null,
    descricao: "A arma pode ser usada com Lutando com Duas Armas, Estilo Duplo (e similares) para fazer ataques adicionais, como se fosse uma arma de uma mão e uma arma leve." },
  { id: "emperrar", nome: "Emperrar", param: null,
    descricao: "Em um desastre (1 natural em uma jogada de ataque), a arma emperra. A arma para de funcionar, sendo necessário uma ação comum para fazê-la funcionar novamente." },
  { id: "energica", nome: "Enérgica", param: null,
    descricao: "A arma acumula impulso para ficar mais poderosa. Quando realizar mais de um ataque com ela no mesmo turno, o segundo ataque recebe um bônus de dano igual à quantidade de dados de dano da arma. A cada outro ataque subsequente o bônus de dano aumenta em +1." },
  { id: "especial", nome: "Especial", param: null,
    descricao: "A arma possui um traço único dela." },
  { id: "estendida", nome: "Estendida", param: null,
    descricao: "A arma tem um alcance maior. O alcance de seus ataques corpo a corpo com a arma aumenta em 1,5 metros." },
  { id: "fatal", nome: "Fatal", param: "dado",
    descricao: "A arma é perigosa ao atingir o ponto certo. Junto do traço, é especificado um tamanho de dado. Em um acerto crítico, o dado de dano da arma aumenta para esse tamanho listado, o qual é considerado também para calcular o dano adicional do crítico. Caso o dado da arma se torne maior que o dado listado por aumento de níveis de dano, ao invés do normal, adicione 1 dado da categoria indicada no dano do acerto crítico." },
  { id: "fineza", nome: "Fineza", param: null,
    descricao: "A arma tem certa fineza, permitindo-lhe escolher como manejar. Você pode escolher utilizar Destreza ao invés de Força em suas jogadas de ataque e rolagens de dano com a arma." },
  { id: "leve", nome: "Leve", param: null,
    descricao: "Uma arma leve pode ser usada no manuseio de duas armas." },
  { id: "marcial", nome: "Marcial", param: null,
    descricao: "A arma é integrada ao uso do corpo, podendo se beneficiar de diversas habilidades de caminhos focados em formar um Lutador." },
  { id: "modular", nome: "Modular", param: "tipo",
    descricao: "A arma pode ser moldada para causar um tipo diferente de dano. Junto do traço, será especificado um tipo de dano, o qual você pode optar por causar em ataques com a arma. Por exemplo, a Adaga tem como dano Perfurante, mas é Modular Ct, podendo causar dano cortante." },
  { id: "mortal", nome: "Mortal", param: "dado",
    descricao: "A arma é especialmente mortal. Em um acerto crítico, a arma adiciona um dado de dano adicional do tamanho listado." },
  { id: "oscilante", nome: "Oscilante", param: null,
    descricao: "A arma permite aproveitar um impulso errado em seu próximo ataque. Quando erra um ataque com esta arma você recebe +2 em sua próxima rolagem de ataque realizada antes do final do seu turno." },
  { id: "pesada", nome: "Pesada", param: "numero",
    descricao: "A arma requer uma Força maior para usar. Quando manejando uma arma pesada, caso você não tenha um valor de Força igual ou superior ao especificado [X], você recebe desvantagem em rolagens de ataque com ela." },
  { id: "recarga", nome: "Recarga", param: "numero",
    descricao: "Uma arma com a propriedade Recarga irá exigir o uso de munições. Após realizar um número de ataques [X] você deve gastar uma ação bônus para recarregar a arma. Após recarregada ela pode atirar o mesmo número de vezes até precisar ser recarregada novamente." },
  { id: "versatil", nome: "Versátil", param: null,
    descricao: "Uma arma versátil pode ser manuseada com uma mão ou com duas, modificando seu dano de acordo com a maneira usada. O primeiro dado mostrado é o dano com uma mão e o segundo é quando a arma é segurada com duas mãos." },
  // "Alcance" não está na lista de propriedades do livro, mas aparece na
  // tabela das armas a distância e de arremesso. O parágrafo de fechamento
  // da seção é a definição dela.
  { id: "alcance", nome: "Alcance", param: "alcance",
    descricao: "O alcance de uma arma é listado em metros nas suas propriedades, caso seja uma arma a distância, de arremesso ou que possua a propriedade arremessável. Por padrão, uma arma corpo-a-corpo tem o seu alcance dependente do tamanho da criatura a manejando. Caso seja uma criatura de tamanho Média, o alcance é de 1,5 metros." },
];

const PROP_BY_ID = Object.fromEntries(ARMA_PROPRIEDADES.map((p) => [p.id, p]));
export const getPropriedade = (id) => PROP_BY_ID[id] ?? null;

/** Rótulo de UMA propriedade com o parâmetro dela ("Pesada 14", "Fatal d10"). */
export function rotuloPropriedade(id, valor) {
  const p = PROP_BY_ID[id];
  const nome = p?.nome ?? id;
  if (valor === true || valor == null) return nome;
  if (Array.isArray(valor)) return `${nome} ${valor.map((v) => `${v}m`).join(" / ")}`;
  return `${nome} ${valor}`;
}

/**
 * Propriedades de uma arma prontas para exibição, na ordem do catálogo.
 * `especial: true` não vira linha: o texto próprio dela já é mostrado à parte.
 */
export function propriedadesDaArma(def) {
  const props = def?.props ?? {};
  return ARMA_PROPRIEDADES
    .filter((p) => p.id !== "especial" && props[p.id] != null && props[p.id] !== false)
    .map((p) => ({ id: p.id, nome: p.nome, valor: props[p.id], rotulo: rotuloPropriedade(p.id, props[p.id]) }));
}

/**
 * A arma pode virar Arma Dedicada (Lutador 2°)? O texto: "as quais não podem
 * possuir as propriedades Duas Mãos ou Pesada, exceto caso já possuam a
 * propriedade Marcial".
 */
export function podeSerArmaDedicada(def) {
  const p = def?.props ?? {};
  if (p.marcial) return true;
  return !p.duas_maos && p.pesada == null;
}

/**
 * Alcance da arma, em metros. Vem da propriedade `alcance` (armas a distância)
 * ou de `arremessavel`. Arma corpo a corpo sem nenhuma das duas devolve null:
 * o alcance dela depende do tamanho de quem maneja, e não é da arma.
 */
export function alcanceDaArma(def) {
  const a = def?.props?.alcance ?? def?.props?.arremessavel;
  if (!Array.isArray(a)) return null;
  return { curto: a[0], longo: a[1] ?? a[0], texto: `${a[0]}m / ${a[1] ?? a[0]}m` };
}

/* ============================================================ */
/* ARMAS · PROPRIEDADES ESPECIAIS (texto verbatim)              */
/* ============================================================ */
/* Cada uma pertence a uma arma (ou a um conjunto delas). O id casa com
   o id da arma que a usa. O Chicote é referenciado por três armas. */

export const ARMA_ESPECIAIS = [
  { id: "adagas_duplas", nome: "Adagas Duplas",
    descricao: "Sendo duas adagas ligadas uma à outra e presas ao portador, você não pode ser desarmado. Além disso, contam como uma única arma de duas mãos." },
  { id: "alabarda", nome: "Alabarda",
    descricao: "De lâmina curva e amplo alcance, concede +2 em testes da manobra Derrubar." },
  { id: "bazuca", nome: "Bazuca",
    descricao: "Ao atacar um inimigo, compare seu teste contra a Defesa de todos os alvos a 7,5 metros do alvo original, causando o dano do ataque a todos cujo seu teste superar a Defesa. Recarregar uma bazuca custa uma Ação Completa. As munições da bazuca tem Custo e Espaço 1." },
  { id: "chakram", nome: "Chakram",
    descricao: "Feito para facilmente retornar ao portador. Sempre que realiza um ataque de arremesso com o Chakram a arma retorna para sua mão após o ataque." },
  { id: "chicote", nome: "Chicote",
    descricao: "Você pode usar a manobra Agarrar mesmo com a mão ocupada pelo chicote, desde que o alvo esteja dentro do seu alcance com a arma. Você recebe +2 em testes de Agarrar usando o chicote." },
  { id: "chicote_de_corrente", nome: "Chicote de Corrente",
    descricao: "Pesado e robusto, possui o traço especial de chicote. Além disso, como uma ação bônus você pode enrolar a corrente em volta do cabo de uma arma corpo a corpo que esteja empunhando. Enquanto uma arma está acoplada a uma corrente você passa a poder utilizar o alcance do chicote e efeito de crítico dele para os ataques dela e você ocupa duas mãos para se beneficiar deste efeito. Tirar uma corrente de uma arma gasta outra ação bônus." },
  { id: "chicote_espinhento", nome: "Chicote Espinhento",
    descricao: "Devido a sua estrutura, o chicote espinhento causa 1d6 de dano cortante e 1d6 de dano perfurante. Ao subir o nível de dano de um chicote espinhento, sobe-se o nível de cada dado individualmente. Apenas o menor RD/Resistência é contado para efeitos de diminuição de dano. Ele possui o traço especial de chicote." },
  { id: "dardo", nome: "Dardo",
    descricao: "O dardo é especialmente efetivo para aplicar venenos. Se o dardo atingir uma criatura, enquanto coberto por veneno, a CD do veneno aumenta em +2." },
  { id: "escopeta", nome: "Escopeta",
    descricao: "Ao realizar um ataque com uma escopeta, além do alvo original, criaturas em um cone de 3 metros a sua frente também são afetadas. Compare o resultado de sua jogada de ataque com a Defesa de cada uma das criaturas na área. Você causa dano igual aos dados de dano da arma em todas aquelas em que acertar. Recarregar uma escopeta custa uma ação comum." },
  { id: "espada_de_gancho", nome: "Espada de Gancho",
    descricao: "Um modelo específico e peculiar de espadas, cuja ponta tem forma de gancho. Ao acertar um ataque você pode puxar o alvo 1,5 metros na sua direção, não podendo entrar no quadrado. Caso você esteja equipando duas, as duas espadas de gancho passam a receber o traço Estendida." },
  { id: "espada_colossal", nome: "Espada Colossal",
    descricao: "Uma espada de tamanho excessivo, naturalmente mais forte. Como o efeito de Amplo, mas escolha uma terceira criatura adjacente ao alvo do primeiro ataque para também sofrer os efeitos." },
  { id: "faixas", nome: "Faixas",
    descricao: "Simples faixas enroladas na mão do portador. As faixas não são consideradas armas, mas sim equipamentos, e ataques realizados com elas são considerados como ataques desarmados, possuindo o mesmo dano deles e se beneficiando de habilidades que afetam esse tipo de ataque. Você pode utilizar uma ou duas faixas, embora o item seja um conjunto. Embora não sejam consideradas armas, você pode transformar Faixas em Ferramentas Amaldiçoadas, recebendo os benefícios comuns da tabela para armas." },
  { id: "kusarigama", nome: "Kusarigama",
    descricao: "A kusarigama permite o uso tanto da foice, que causa dano cortante quanto do peso, que causa dano de impacto. Uma kusarigama concede +2 em testes de manobra. Ao subir o nível de dano de uma kusarigama, sobe-se o nível de cada dado individualmente." },
  { id: "leque", nome: "Leque",
    descricao: "Você pode alternar entre usar o leque fechado, que causa dano de impacto, ou o leque aberto, que causa dano cortante. Alternar dentro de combate é uma ação livre. Enquanto fechado, conta como parte do grupo bastão; enquanto aberto, conta como parte do grupo faca. O leque também concede +2 em testes de Enganação para Fintar." },
  { id: "manoplas", nome: "Manoplas",
    descricao: "Manoplas que ocupam completamente as duas mãos. Contam como arma para todos os efeitos, mas usam do seu dano desarmado base para ser aplicado. É possível carregar itens e agarrar e levantar pessoas enquanto usa as manoplas, mas não é possível manejar outras armas. Seu dano desarmado aumenta em 1 nível para cada 2 no seu modificador de força." },
  { id: "metralhadora", nome: "Metralhadora",
    descricao: "Uma metralhadora possui uma cadência superior de disparo. Quando realizar um ataque com a metralhadora, você pode também utilizar a sua ação bônus para realizar um ataque adicional, consumindo mais uma munição. Utiliza uma ação comum para recarregar." },
  { id: "rede", nome: "Rede",
    descricao: "Caso acerte um ataque com uma rede, o alvo recebe a condição Enredado. Uma criatura enredada dessa maneira pode tentar escapar como uma Ação Completa, realizando um teste de Atletismo ou Acrobacia com CD20. Uma rede pode também ser atacada, possuindo 5 Pontos de Vida e, caso destruída, a criatura presa é solta." },
  { id: "soco_ingles", nome: "Soco Inglês",
    descricao: "Um soco inglês destrutivo, colocado em uma mão. Conta como arma para todos os efeitos, mas usa do seu dano desarmado para ser aplicado. É possível agarrar e levantar pessoas enquanto usa o soco inglês, mas não é possível manejar outras armas ou itens. Enquanto usando soco inglês, seus ataques com ele também aplicam os efeitos críticos do grupo Faca e testes de resistência para resistir a efeitos de crítico têm a CD aumentada em 1 para cada 2 no modificador de força ou destreza." },
];

const ESPECIAL_BY_ID = Object.fromEntries(ARMA_ESPECIAIS.map((e) => [e.id, e]));
export const getEspecial = (id) => ESPECIAL_BY_ID[id] ?? null;

/* ============================================================ */
/* ARMAS · CATÁLOGO                                             */
/* ============================================================ */
/* Shape do dano:
     { dado, tipo }                    simples
     { dado, duasMaos, tipo }          versátil (o "/" da tabela)
     { dados: [{dado,tipo}, ...] }     dois dados de tipos diferentes
     { desarmado: true }               usa o dano desarmado do personagem
     null                              não causa dano

   ⚠ O "X/Y" da coluna DANO tem dois sentidos e a regra é: se a arma tem
   a propriedade `versatil`, é uma mão / duas mãos. Se não tem (só o
   Chicote Espinhento e a Kusarigama), são dois dados de tipos
   diferentes, e o tipo de cada um vem do texto especial delas, porque a
   coluna da tabela ficou sem tipo.

   ⚠ ESPAÇOS: a tabela é a autoridade. A regra geral ("armas de duas mãos
   ocupam dois espaços") é só o default de item sem valor declarado, e o
   próprio livro manda conferir a descrição. Por isso Manoplas e
   Kusarigama ficam em 1 mesmo sendo de duas mãos, confirmado pelo autor. */

export const ARMAS = [
  /* ---------- SIMPLES · corpo a corpo ---------- */
  { id: "arm_adaga", nome: "Adaga", classe: "simples", categoria: "corpo",
    dano: { dado: "1d6", tipo: "pf" }, critico: 18, espacos: 1, custo: 1, grupo: "faca",
    props: { apunhaladora: true, arremessavel: [6, 18], fineza: true, leve: true, marcial: true, modular: "ct" } },
  { id: "arm_bastao", nome: "Bastão", classe: "simples", categoria: "corpo",
    dano: { dado: "1d6", duasMaos: "1d8", tipo: "im" }, critico: 19, espacos: 2, custo: 1, grupo: "bastao",
    props: { ampla: true, dupla: true, marcial: true, versatil: true } },
  { id: "arm_clava", nome: "Clava", classe: "simples", categoria: "corpo",
    dano: { dado: "1d8", duasMaos: "1d10", tipo: "im" }, critico: 20, espacos: 1, custo: 1, grupo: "bastao",
    props: { versatil: true } },
  { id: "arm_espada_curta", nome: "Espada Curta", classe: "simples", categoria: "corpo",
    dano: { dado: "1d6", tipo: "ct" }, critico: 19, espacos: 1, custo: 1, grupo: "espada",
    props: { fineza: true, leve: true, marcial: true, modular: "pf" } },
  { id: "arm_faixas", nome: "Faixas", classe: "simples", categoria: "corpo",
    dano: { desarmado: true }, critico: null, espacos: 1, custo: 1, grupo: "pugilato",
    props: { especial: true }, especial: "faixas",
    // O texto diz que Faixas não são armas, e sim equipamentos. Ficam na
    // tabela de armas mesmo assim (autor, 2026-07-22) porque contam como
    // arma para Ferramenta Amaldiçoada.
    contaComoArma: false },
  { id: "arm_foice", nome: "Foice", classe: "simples", categoria: "corpo",
    dano: { dado: "1d6", tipo: "ct" }, critico: 19, espacos: 1, custo: 1, grupo: "haste",
    props: { fineza: true, leve: true, marcial: true } },
  { id: "arm_lanca", nome: "Lança", classe: "simples", categoria: "corpo",
    dano: { dado: "1d6", duasMaos: "1d8", tipo: "pf" }, critico: 19, espacos: 1, custo: 1, grupo: "haste",
    props: { arremessavel: [6, 18], estendida: true, versatil: true } },
  { id: "arm_leque", nome: "Leque", classe: "simples", categoria: "corpo",
    dano: { dado: "1d6", tipo: "im" }, critico: 18, espacos: 1, custo: 1, grupo: null,
    props: { fineza: true, energica: true, leve: true, especial: true }, especial: "leque" },
  { id: "arm_machado", nome: "Machado", classe: "simples", categoria: "corpo",
    dano: { dado: "1d8", duasMaos: "1d10", tipo: "ct" }, critico: 20, espacos: 1, custo: 1, grupo: "machado",
    props: { versatil: true } },
  { id: "arm_mangual", nome: "Mangual", classe: "simples", categoria: "corpo",
    dano: { dado: "1d8", tipo: "im" }, critico: 20, espacos: 1, custo: 1, grupo: "chicote",
    props: { ampla: true, energica: true } },
  { id: "arm_manoplas", nome: "Manoplas", classe: "simples", categoria: "corpo",
    dano: { desarmado: true }, critico: null, espacos: 1, custo: 2, grupo: "pugilato",
    props: { aparar: true, duas_maos: true, dupla: true, especial: true, pesada: 16 }, especial: "manoplas" },
  { id: "arm_martelo", nome: "Martelo", classe: "simples", categoria: "corpo",
    dano: { dado: "1d8", duasMaos: "1d10", tipo: "im" }, critico: 20, espacos: 1, custo: 1, grupo: "martelo",
    props: { versatil: true } },
  { id: "arm_soco_ingles", nome: "Soco Inglês", classe: "simples", categoria: "corpo",
    dano: { desarmado: true }, critico: null, espacos: 1, custo: 2, grupo: "pugilato",
    props: { energica: true, especial: true, fineza: true, marcial: true }, especial: "soco_ingles" },
  { id: "arm_tridente", nome: "Tridente", classe: "simples", categoria: "corpo",
    dano: { dado: "1d6", duasMaos: "1d8", tipo: "pf" }, critico: 19, espacos: 1, custo: 1, grupo: "haste",
    props: { arremessavel: [6, 18], estendida: true, versatil: true } },

  /* ---------- SIMPLES · a distância ---------- */
  { id: "arm_arco_curto", nome: "Arco Curto", classe: "simples", categoria: "distancia",
    dano: { dado: "1d6", tipo: "pf" }, critico: 19, espacos: 2, custo: 1, grupo: "arco",
    props: { duas_maos: true, mortal: "d10", alcance: [24, 48] } },
  { id: "arm_besta_leve", nome: "Besta Leve", classe: "simples", categoria: "distancia",
    // Grupo corrigido de "Arco" para "Besta" a pedido do autor (2026-07-22),
    // para casar com a Besta Pesada.
    dano: { dado: "1d8", tipo: "pf" }, critico: 19, espacos: 1, custo: 1, grupo: "besta",
    props: { mortal: "d10", leve: true, alcance: [24, 48], recarga: 1 } },
  { id: "arm_pistola", nome: "Pistola", classe: "simples", categoria: "distancia",
    dano: { dado: "1d10", tipo: "pf" }, critico: 20, espacos: 1, custo: 2, grupo: "tiro",
    props: { alcance: [36, 72], emperrar: true, leve: true, recarga: 12 } },

  /* ---------- SIMPLES · arremesso ---------- */
  { id: "arm_azagaia", nome: "Azagaia", classe: "simples", categoria: "arremesso",
    dano: { dado: "1d6", tipo: "pf" }, critico: 20, espacos: 1, custo: 1, grupo: "dardo",
    props: { leve: true, alcance: [12, 24] } },
  { id: "arm_dardo", nome: "Dardo", classe: "simples", categoria: "arremesso",
    dano: { dado: "1d4", tipo: "pf" }, critico: 18, espacos: 1, custo: 1, grupo: "dardo",
    props: { leve: true, alcance: [12, 24], especial: true }, especial: "dardo" },
  { id: "arm_faca_de_arremesso", nome: "Faca de Arremesso", classe: "simples", categoria: "arremesso",
    dano: { dado: "1d6", tipo: "pf" }, critico: 20, espacos: 1, custo: 1, grupo: "faca",
    props: { leve: true, alcance: [12, 24], modular: "ct" } },

  /* ---------- COMPLEXAS · corpo a corpo ---------- */
  { id: "arm_adagas_duplas", nome: "Adagas Duplas", classe: "complexa", categoria: "corpo",
    dano: { dado: "2d4", tipo: "pf" }, critico: 18, espacos: 2, custo: 2, grupo: "faca",
    props: { apunhaladora: true, duas_maos: true, fineza: true, leve: true, marcial: true, modular: "ct", especial: true }, especial: "adagas_duplas" },
  { id: "arm_adaga_de_aparar", nome: "Adaga de Aparar", classe: "complexa", categoria: "corpo",
    dano: { dado: "1d4", tipo: "pf" }, critico: 18, espacos: 1, custo: 1, grupo: "faca",
    props: { aparar: true, apunhaladora: true, fineza: true, leve: true, marcial: true, modular: "ct" } },
  { id: "arm_alabarda", nome: "Alabarda", classe: "complexa", categoria: "corpo",
    dano: { dado: "1d10", tipo: "ct" }, critico: 20, espacos: 2, custo: 2, grupo: "haste",
    props: { duas_maos: true, estendida: true, modular: "pf", pesada: 14, especial: true }, especial: "alabarda" },
  { id: "arm_chicote", nome: "Chicote", classe: "complexa", categoria: "corpo",
    dano: { dado: "1d4", tipo: "ct" }, critico: 19, espacos: 1, custo: 1, grupo: "chicote",
    props: { estendida: true, fineza: true, leve: true, especial: true }, especial: "chicote" },
  { id: "arm_chicote_de_corrente", nome: "Chicote de Corrente", classe: "complexa", categoria: "corpo",
    dano: { dado: "1d6", duasMaos: "1d8", tipo: "im" }, critico: 19, espacos: 2, custo: 2, grupo: "chicote",
    props: { estendida: true, pesada: 14, versatil: true, especial: true }, especial: "chicote_de_corrente" },
  { id: "arm_chicote_espinhento", nome: "Chicote Espinhento", classe: "complexa", categoria: "corpo",
    // Sem `versatil`, então o "1d6/1d6" da tabela são dois dados de tipos
    // diferentes. Os tipos vêm do texto especial (cortante e perfurante).
    dano: { dados: [{ dado: "1d6", tipo: "ct" }, { dado: "1d6", tipo: "pf" }] }, critico: 19, espacos: 1, custo: 3, grupo: "chicote",
    props: { estendida: true, fineza: true, leve: true, especial: true }, especial: "chicote_espinhento" },
  { id: "arm_clava_pesada", nome: "Clava Pesada", classe: "complexa", categoria: "corpo",
    dano: { dado: "2d6", tipo: "im" }, critico: 20, espacos: 2, custo: 2, grupo: "bastao",
    props: { duas_maos: true, pesada: 16, oscilante: true } },
  { id: "arm_corrente_de_aco", nome: "Corrente de Aço", classe: "complexa", categoria: "corpo",
    dano: { dado: "2d4", duasMaos: "2d6", tipo: "im" }, critico: 20, espacos: 2, custo: 1, grupo: "chicote",
    props: { estendida: true, energica: true, pesada: 14, versatil: true } },
  { id: "arm_espada_de_gancho", nome: "Espada de Gancho", classe: "complexa", categoria: "corpo",
    dano: { dado: "1d8", tipo: "ct" }, critico: 20, espacos: 1, custo: 2, grupo: "espada",
    props: { fineza: true, leve: true, marcial: true, especial: true }, especial: "espada_de_gancho" },
  { id: "arm_espada_longa", nome: "Espada Longa", classe: "complexa", categoria: "corpo",
    dano: { dado: "1d8", duasMaos: "1d10", tipo: "ct" }, critico: 20, espacos: 1, custo: 1, grupo: "espada",
    props: { modular: "pf", versatil: true } },
  { id: "arm_katana", nome: "Katana", classe: "complexa", categoria: "corpo",
    dano: { dado: "1d6", duasMaos: "1d8", tipo: "ct" }, critico: 19, espacos: 1, custo: 1, grupo: "espada",
    props: { versatil: true, fatal: "d10", fineza: true } },
  { id: "arm_espada_grande", nome: "Espada Grande", classe: "complexa", categoria: "corpo",
    dano: { dado: "1d12", tipo: "ct" }, critico: 20, espacos: 2, custo: 2, grupo: "espada",
    props: { ampla: true, duas_maos: true, modular: "pf", pesada: 14 } },
  { id: "arm_espada_colossal", nome: "Espada Colossal", classe: "complexa", categoria: "corpo",
    dano: { dado: "2d8", tipo: "ct" }, critico: 20, espacos: 4, custo: 3, grupo: "espada",
    props: { ampla: true, duas_maos: true, modular: "im", pesada: 20, especial: true }, especial: "espada_colossal" },
  { id: "arm_foice_grande", nome: "Foice Grande", classe: "complexa", categoria: "corpo",
    dano: { dado: "1d8", duasMaos: "1d10", tipo: "ct" }, critico: 20, espacos: 2, custo: 2, grupo: "haste",
    props: { ampla: true, versatil: true } },
  { id: "arm_kusarigama", nome: "Kusarigama", classe: "complexa", categoria: "corpo",
    // Idem Chicote Espinhento: sem `versatil`, então são dois dados. Tipos
    // do texto especial (foice cortante, peso de impacto).
    dano: { dados: [{ dado: "1d6", tipo: "ct" }, { dado: "1d6", tipo: "im" }] }, critico: 19, espacos: 1, custo: 2, grupo: "haste",
    props: { duas_maos: true, dupla: true, especial: true, estendida: true, energica: true }, especial: "kusarigama" },
  { id: "arm_lanca_grande", nome: "Lança Grande", classe: "complexa", categoria: "corpo",
    dano: { dado: "1d12", tipo: "pf" }, critico: 20, espacos: 2, custo: 1, grupo: "haste",
    props: { duas_maos: true, energica: true, estendida: true, pesada: 14 } },
  { id: "arm_machado_grande", nome: "Machado Grande", classe: "complexa", categoria: "corpo",
    dano: { dado: "1d10", tipo: "ct" }, critico: 20, espacos: 2, custo: 1, grupo: "machado",
    props: { ampla: true, duas_maos: true, pesada: 16 } },
  { id: "arm_martelo_grande", nome: "Martelo Grande", classe: "complexa", categoria: "corpo",
    dano: { dado: "1d12", tipo: "im" }, critico: 20, espacos: 2, custo: 1, grupo: "martelo",
    props: { duas_maos: true, pesada: 16 } },
  { id: "arm_nunchaku", nome: "Nunchaku", classe: "complexa", categoria: "corpo",
    dano: { dado: "1d8", tipo: "im" }, critico: 19, espacos: 1, custo: 1, grupo: "bastao",
    props: { dupla: true, energica: true, fineza: true, marcial: true } },
  { id: "arm_nunchaku_pesado", nome: "Nunchaku Pesado", classe: "complexa", categoria: "corpo",
    dano: { dado: "2d6", tipo: "im" }, critico: 20, espacos: 2, custo: 2, grupo: "bastao",
    props: { duas_maos: true, dupla: true, estendida: true, marcial: true, pesada: 14, energica: true } },
  { id: "arm_rapieira", nome: "Rapieira", classe: "complexa", categoria: "corpo",
    dano: { dado: "1d8", tipo: "pf" }, critico: 19, espacos: 1, custo: 1, grupo: "espada",
    props: { fineza: true, mortal: "d10" } },

  /* ---------- COMPLEXAS · a distância ---------- */
  { id: "arm_arco_longo", nome: "Arco Longo", classe: "complexa", categoria: "distancia",
    dano: { dado: "1d10", tipo: "pf" }, critico: 19, espacos: 2, custo: 1, grupo: "arco",
    props: { duas_maos: true, mortal: "d12", alcance: [30, 60] } },
  { id: "arm_bazuca", nome: "Bazuca", classe: "complexa", categoria: "distancia",
    dano: { dado: "3d12", tipo: "im" }, critico: 19, espacos: 4, custo: 4, grupo: "tiro",
    props: { alcance: [9, 18], duas_maos: true, emperrar: true, recarga: 1, especial: true, pesada: 16 }, especial: "bazuca" },
  { id: "arm_besta_pesada", nome: "Besta Pesada", classe: "complexa", categoria: "distancia",
    dano: { dado: "1d12", tipo: "pf" }, critico: 20, espacos: 2, custo: 1, grupo: "besta",
    props: { pesada: 14, alcance: [45, 90], recarga: 1, mortal: "d12" } },
  { id: "arm_escopeta", nome: "Escopeta", classe: "complexa", categoria: "distancia",
    dano: { dado: "2d6", tipo: "pf" }, critico: 20, espacos: 2, custo: 2, grupo: "tiro",
    props: { alcance: [9, 18], duas_maos: true, emperrar: true, especial: true, recarga: 2 }, especial: "escopeta" },
  { id: "arm_metralhadora", nome: "Metralhadora", classe: "complexa", categoria: "distancia",
    dano: { dado: "1d12", tipo: "pf" }, critico: 19, espacos: 4, custo: 3, grupo: "tiro",
    props: { alcance: [30, 60], duas_maos: true, emperrar: true, especial: true, recarga: 30 }, especial: "metralhadora" },
  { id: "arm_rifle", nome: "Rifle", classe: "complexa", categoria: "distancia",
    dano: { dado: "2d8", tipo: "pf" }, critico: 20, espacos: 2, custo: 2, grupo: "tiro",
    props: { alcance: [60, 120], duas_maos: true, emperrar: true, recarga: 20 } },
  { id: "arm_rifle_de_precisao", nome: "Rifle de Precisão", classe: "complexa", categoria: "distancia",
    dano: { dado: "2d10", tipo: "pf" }, critico: 19, espacos: 4, custo: 3, grupo: "tiro",
    props: { alcance: [120, 240], duas_maos: true, emperrar: true, recarga: 5 } },

  /* ---------- COMPLEXAS · arremesso ---------- */
  { id: "arm_chakram", nome: "Chakram", classe: "complexa", categoria: "arremesso",
    dano: { dado: "2d4", tipo: "ct" }, critico: 20, espacos: 1, custo: 1, grupo: "faca",
    props: { arremessavel: [12, 24], especial: true, leve: true }, especial: "chakram" },
  { id: "arm_kunai", nome: "Kunai", classe: "complexa", categoria: "arremesso",
    dano: { dado: "1d6", tipo: "pf" }, critico: 19, espacos: 1, custo: 1, grupo: "dardo",
    props: { apunhaladora: true, arremessavel: [9, 18], fineza: true, leve: true } },
  { id: "arm_rede", nome: "Rede", classe: "complexa", categoria: "arremesso",
    dano: null, critico: null, espacos: 1, custo: 2, grupo: null,
    props: { alcance: [9, 27], especial: true }, especial: "rede" },
  { id: "arm_shuriken", nome: "Shuriken", classe: "complexa", categoria: "arremesso",
    dano: { dado: "1d4", tipo: "ct" }, critico: 18, espacos: 1, custo: 1, grupo: "dardo",
    props: { arremessavel: [12, 24], mortal: "d8", leve: true } },
];

export const ARMA_CATEGORIAS = [
  { value: "corpo",     label: "Corpo a Corpo" },
  { value: "distancia", label: "A Distância" },
  { value: "arremesso", label: "De Arremesso" },
];

/* ============================================================ */
/* ARMAS CRIADAS PELO JOGADOR                                   */
/* ============================================================ */
/* Uma arma custom é uma entrada NO MESMO SHAPE das do catálogo, e é isso que
   faz ela funcionar sem nenhum caso especial no resto do sistema. Ela mora na
   ficha (`creature.armasCustom`) e entra na lista pela `catalogoDoTipo`.

   ⚠ ELA É SANEADA NA LEITURA, e não na escrita. A ficha vem do localStorage e
   pode ter sido editada à mão, importada de outra versão ou salva no meio de um
   formulário. Um `dado` inválido ou um `custo` fora de 1 a 4 quebraria o cálculo
   de orçamento e o de dano em silêncio, então tudo passa por aqui antes de ser
   arma. O preço é uma passada por leitura, e a ficha não tem muitas. */

/** Os tamanhos de dado que uma arma pode ter. */
export const ARMA_DADOS = ["1d4", "1d6", "1d8", "1d10", "1d12", "2d6"];

/** Faixa de crítico. 20 é "só no 20 natural", 18 é a mais larga do livro. */
export const ARMA_CRITICOS = [20, 19, 18];

const DADO_OK = new Set(ARMA_DADOS);
const TIPO_DANO_OK = new Set(Object.keys(TIPOS_DANO));
const CATEGORIA_OK = new Set(ARMA_CATEGORIAS.map((c) => c.value));
const GRUPO_OK = new Set(ARMA_GRUPOS.map((g) => g.value));

let armaCustomSeq = 0;

/** Uma arma custom nova, com os padrões de uma arma simples de corpo a corpo. */
export function novaArmaCustom(patch = {}) {
  armaCustomSeq += 1;
  return {
    id: `armc_${Date.now().toString(36)}_${armaCustomSeq}`,
    nome: "",
    classe: "simples",
    categoria: "corpo",
    dano: { dado: "1d6", tipo: "ct" },
    critico: 20,
    espacos: 1,
    custo: 1,
    grupo: "espada",
    props: {},
    ...patch,
  };
}

/** Um número inteiro dentro de uma faixa, ou o padrão. */
const naFaixa = (v, min, max, padrao) => {
  const n = Math.trunc(Number(v));
  return Number.isFinite(n) && n >= min && n <= max ? n : padrao;
};

/**
 * Saneia UMA propriedade escrita pelo jogador. Devolve `null` quando ela não
 * deve existir, e o valor pronto quando deve.
 *
 * O `param` do catálogo diz o que o valor significa, e cada forma tem a sua
 * validação. Uma propriedade booleana guarda `true` e nada mais.
 */
function saneiaValorProp(id, valor) {
  const def = PROP_BY_ID[id];
  if (!def || valor == null || valor === false) return null;
  if (def.param === "dado") return DADO_OK.has(valor) ? valor : "1d6";
  if (def.param === "tipo") return TIPO_DANO_OK.has(valor) ? valor : "ct";
  if (def.param === "numero") return naFaixa(valor, 1, 30, 1);
  if (def.param === "alcance") {
    const a = Array.isArray(valor) ? valor : [];
    const curto = naFaixa(a[0], 1, 999, 6);
    return [curto, naFaixa(a[1], curto, 9999, curto * 3)];
  }
  return true;
}

/** Uma arma custom saneada, ou `null` quando nem isso dá para salvar. */
export function saneiaArmaCustom(bruta) {
  if (!bruta || typeof bruta !== "object") return null;
  const id = typeof bruta.id === "string" && bruta.id.startsWith("armc_") ? bruta.id : null;
  if (!id) return null;
  const props = {};
  for (const [k, v] of Object.entries(bruta.props || {})) {
    const val = saneiaValorProp(k, v);
    if (val != null) props[k] = val;
  }
  const dado = DADO_OK.has(bruta.dano?.dado) ? bruta.dano.dado : "1d6";
  const duasMaos = DADO_OK.has(bruta.dano?.duasMaos) ? bruta.dano.duasMaos : null;
  return {
    id,
    // Sem nome, a linha do catálogo ficaria em branco e o jogador não acharia a
    // arma que acabou de criar.
    nome: String(bruta.nome ?? "").trim() || "Arma sem Nome",
    classe: bruta.classe === "complexa" ? "complexa" : "simples",
    categoria: CATEGORIA_OK.has(bruta.categoria) ? bruta.categoria : "corpo",
    dano: {
      dado,
      // O segundo dado só existe com a propriedade Versátil, que é quem lhe dá
      // sentido ("o primeiro dado é com uma mão e o segundo com duas").
      ...(props.versatil && duasMaos ? { duasMaos } : {}),
      tipo: TIPO_DANO_OK.has(bruta.dano?.tipo) ? bruta.dano.tipo : "ct",
    },
    critico: ARMA_CRITICOS.includes(Math.trunc(Number(bruta.critico))) ? Math.trunc(Number(bruta.critico)) : 20,
    espacos: naFaixa(bruta.espacos, 0, 10, 1),
    custo: naFaixa(bruta.custo, 1, 4, 1),
    grupo: GRUPO_OK.has(bruta.grupo) ? bruta.grupo : "espada",
    props,
    // A marca que a UI usa para dar botão de editar e apagar, e para o chip.
    custom: true,
  };
}

/** As armas custom da ficha, saneadas e sem id repetido. */
export function armasCustomDaFicha(creature) {
  const brutas = Array.isArray(creature?.armasCustom) ? creature.armasCustom : [];
  const vistos = new Set();
  const out = [];
  for (const b of brutas) {
    const a = saneiaArmaCustom(b);
    if (!a || vistos.has(a.id)) continue;
    vistos.add(a.id);
    out.push(a);
  }
  return out;
}

/* ============================================================ */
/* UNIFORMES                                                    */
/* ============================================================ */
/* Um uniforme só pode possuir uma modificação, sendo ela uma alteração
   completa da sua forma e base. Os espaços vêm da seção de carregamento,
   não da tabela de modificações.

   ⚠ Na ficha de CRIATURA (autor, 2026-08-01), o campo `defesa` desta tabela
   NÃO é aplicado: a armadura dá o CUSTO dela de Defesa, mais o grau da
   Ferramenta (ver defesaDaArmadura). O campo fica aqui porque é o texto do
   livro e volta a valer na ficha de jogador.

   A `penalidade` VOLTOU a valer (autor, 2026-08-01, segunda passada) e é
   aplicada em testes de perícia que usam Destreza, cumulativa com a do
   escudo. */

export const UNIFORME_MODIFICACOES = [
  { id: "unif_comum", nome: "Uniforme Comum", defesa: 0, penalidade: 0, custo: 0, espacos: 0, inicial: true,
    descricao: "Todo personagem inicia com um uniforme comum, o qual define a Defesa de quem estiver o utilizando como o valor padrão do sistema." },
  { id: "unif_revestimento_leve", nome: "Revestimento Leve", defesa: 2, penalidade: 0, custo: 1, espacos: 0,
    descricao: "Um revestimento leve é colocado no uniforme, concedendo-o um leve reforço defensivo." },
  { id: "unif_revestimento_medio", nome: "Revestimento Médio", defesa: 4, penalidade: -2, custo: 2, espacos: 2,
    descricao: "O uniforme tem uma quantidade demorada de revestimentos colocados, através de algumas placas e camadas adicionais, o que dá um peso considerável ao uniforme." },
  { id: "unif_revestimento_robusto", nome: "Revestimento Robusto", defesa: 6, penalidade: -4, custo: 3, espacos: 4,
    descricao: "Um revestimento pesado é implementado no uniforme, com placas fortes, camadas densas e a adição de peças que se assemelham a armaduras ou coletes, o que o dá um peso equivalente." },
  // ⚠ `defesaCriatura` é a EXCEÇÃO à regra do custo (autor, 2026-08-01): Sob
  // Medida custa 2 mas dá 1 de Defesa, "já que ela já dá benefícios em Perícia".
  // É a única modificação com o campo, e ele bate com o +1 da tabela do livro.
  { id: "unif_sob_medida", nome: "Sob Medida", defesa: 1, defesaCriatura: 1, penalidade: 0, custo: 2, espacos: 0,
    descricao: "O uniforme é feito sob medida, encaixando-se perfeitamente no corpo do feiticeiro, beneficiando-o em acrobacias e destacando a sua agilidade. Enquanto estiver usando um uniforme sob medida, você recebe +2 em testes de Acrobacia e Furtividade.",
    efeito: { pericia: { acrobacia: 2, furtividade: 2 }, aplicado: true } },
];

/* ============================================================ */
/* ESCUDOS                                                      */
/* ============================================================ */
/* A RD do escudo é RD GERAL (autor, 2026-08-01), e não RD Física como valia
   desde 2026-07-22. As palavras dele foram "RD Geral, exceto Alma", que é a
   definição EXATA da RD Geral no Afty (é por isso que o Dano na Alma ganhou
   canal próprio em 2026-07-29), então o campo troca de destino sem precisar de
   canal novo. O campo se chama `rdEscudo` justamente para não sugerir tipo.

   A RD do grau da Ferramenta SOMA com a do escudo comum: um Escudo Pesado (6)
   de Grau Especial (5) dá 11 de RD Geral e -4 de penalidade (exemplo do autor).

   Todos ocupam 2 espaços pela regra geral de carregamento.
   O dano do escudo é de impacto (autor, o livro não diz).
   A penalidade É aplicada, em testes de perícia que usam Destreza, e é
   cumulativa com a do uniforme. */

export const ESCUDOS = [
  { id: "esc_pequeno", nome: "Escudo Pequeno", dano: { dado: "1d3", tipo: "im" }, rdEscudo: 2, penalidade: 0, custo: 2, espacos: 2, ocupaMao: false,
    descricao: "Um escudo pequeno, otimizado para ser preso ao braço, mantendo uma mão livre enquanto dá um impulso na guarda. O escudo pequeno não ocupa uma das suas mãos." },
  { id: "esc_leve", nome: "Escudo Leve", dano: { dado: "1d4", tipo: "im" }, rdEscudo: 2, penalidade: -1, custo: 1, espacos: 2, ocupaMao: true,
    descricao: "Um pequeno escudo, leve em peso e capaz de auxiliar na defesa de golpes mais simples." },
  { id: "esc_medio", nome: "Escudo Médio", dano: { dado: "1d6", tipo: "im" }, rdEscudo: 4, penalidade: -2, custo: 2, espacos: 2, ocupaMao: true,
    descricao: "Um escudo de porte médio, equilibrando uma boa defesa com um sacrifício mediano de sua agilidade." },
  { id: "esc_pesado", nome: "Escudo Pesado", dano: { dado: "1d8", tipo: "im" }, rdEscudo: 6, penalidade: -4, custo: 3, espacos: 2, ocupaMao: true,
    descricao: "Um escudo maior e pesado, cobrindo uma parte considerável do corpo, em troca de uma certa dificuldade no seu manejo." },
];

/* ============================================================ */
/* FERRAMENTAS AMALDIÇOADAS                                     */
/* ============================================================ */
/* Equipamentos genéricos (armas, escudos e uniformes) infundidos com
   energia amaldiçoada. Uma arma, escudo ou uniforme do catálogo comum vira
   Ferramenta Amaldiçoada recebendo um GRAU DE EQUIPAMENTO (os mesmos 5 nomes
   do Grau do Feiticeiro em AFTY_GRAUS, mas OUTRA coisa). Conforme sobe de
   grau, recebe benefícios garantidos e Encantamentos.

   Modelo na ficha: a entrada do inventário ganha um campo opcional
     fa: { grau, encantamentos: [ids], habilidadeUnica: "" }
   Só armas, escudos e uniformes podem ter `fa`. Faixas contam como arma para
   este fim (o próprio livro diz), então também podem.

   O que É aplicado no motor:
     • RD Física do escudo por grau (SOMA com a RD do escudo comum de base,
       decisão do autor 2026-07-22).
     • Defesa do uniforme por grau, somada ao +1 de toda armadura (2026-08-01).
     • Acerto da arma por grau, na linha de dano daquela arma (2026-08-01). O
       dano fixo por grau já vinha da DANO_ADICIONAL_ARMA.
     • Os quatro encantamentos com efeito de stat, e a Habilidade Única.
   Os três primeiros usam o grau de CÁLCULO, que desce um degrau por
   encantamento escolhido (ver grauRankCalculo).
   O que NÃO é aplicado:
     • Encantamentos situacionais ou de combate, que seguem como texto. */

/** Processo de criação por grau: bônus de treinamento necessário e CD do teste.
    São necessárias duas rolagens, Ofício (Ferreiro) e Ofício (Canalizador),
    e um número de falhas permitido antes da quebra (o livro não fecha o número
    de falhas em tabela, então fica só a CD e o BT). */
export const FA_CRIACAO = {
  quarto:   { btNecessario: 2, cd: 20 },
  terceiro: { btNecessario: 3, cd: 25 },
  segundo:  { btNecessario: 4, cd: 30 },
  primeiro: { btNecessario: 5, cd: 35 },
  especial: { btNecessario: 6, cd: 45 },
};

/** Bônus de Arma por grau, adicionado às rolagens de dano feitas com a arma.
    O item usa o bônus do grau atual, NÃO acumula com os anteriores. */
export const FA_BONUS_ARMA = { quarto: 1, terceiro: 2, segundo: 3, primeiro: 4, especial: 5 };

/** RD Física do escudo por grau. NÃO acumula entre graus, mas SOMA com a RD do
    escudo comum de base (autor, 2026-07-22). */
export const FA_RD_ESCUDO = { quarto: 1, terceiro: 2, segundo: 3, primeiro: 4, especial: 5 };

/** Encantamentos GANHOS ao atingir cada grau. Estes ACUMULAM: uma arma de
    Primeiro Grau tem 1+1+2 = 4 encantamentos. */
export const FA_ENCANT_GANHO = {
  arma:     { quarto: 0, terceiro: 1, segundo: 1, primeiro: 2, especial: 0 },
  escudo:   { quarto: 0, terceiro: 1, segundo: 1, primeiro: 1, especial: 0 },
  uniforme: { quarto: 1, terceiro: 1, segundo: 1, primeiro: 1, especial: 0 },
};

/** Só armas, escudos e uniformes viram Ferramenta Amaldiçoada. */
export const FA_TIPOS_EQUIP = ["arma", "escudo", "uniforme"];

/** Total de encantamentos permitidos num grau: soma dos ganhos até ele (acumula). */
export function faEncantamentosPermitidos(tipoEquip, grauValue) {
  const ganho = FA_ENCANT_GANHO[tipoEquip];
  if (!ganho) return 0;
  const rankAtual = AFTY_GRAUS.find((g) => g.value === grauValue)?.rank ?? 0;
  let total = 0;
  for (const g of AFTY_GRAUS) {
    if (g.rank <= rankAtual) total += ganho[g.value] ?? 0;
  }
  return total;
}

/** O Grau Especial sempre concede uma habilidade única (criada pelo jogador). */
export const faTemHabilidadeUnica = (grauValue) => grauValue === "especial";

/* ---------- MOTOR DE AUTOMAÇÃO (efeitos da Ferramenta) ---------- */
/* Efeitos estáticos de ficha que uma Ferramenta aplica ENQUANTO EQUIPADA (a
   arma empunhada, o escudo em guarda, o uniforme vestido), escritos como
   fórmulas da DSL (`{ canal, alvo?, expr }`), no mesmo espírito do Motor de
   Automação das Invocações.

   ⚠ Em 2026-08-01 os ENCANTAMENTOS seguiram a Habilidade Única e passaram a
   escrever no catálogo INTEIRO do Motor. A lista `EQUIP_EFEITO_CANAIS` de sete
   canais MORREU: ela era o teto que mantinha metade dos encantamentos como
   texto morto, porque Perícia, Manobra, TR, Iniciativa, Acerto e Dano não
   cabiam nela. Nada mais valida canal aqui: quem valida é o `aplicarEfeitos`,
   que já ignora canal desconhecido com aviso.

   Este arquivo NÃO importa afty-efeitos.js de propósito: afty-efeitos importa
   afty-combate, que importa afty-habilidades, que importa este arquivo. A seta
   de volta fecharia o ciclo. Por isso o canal passa cru.

   Dois campos são deste arquivo e não chegam ao Motor:
     alvoItem: true -> o alvo é o id do item (canais de `fonteDano`, que miram
                       "esta arma" e não uma categoria).
   E dois PSEUDO-CANAIS, resolvidos aqui porque não são stat de ficha:
     acertoArma      -> Acerto só quando manejando ESTA arma. O canal
                        `bonusAcerto` do Motor mira categoria (corpo, distância),
                        e usá-lo faria o bônus vazar para as outras armas.
     penalidadeEquip -> quanto a penalidade de Destreza DESTE item é reduzida
                        (Polido no escudo, Ajustado no uniforme). */

/** Contexto da DSL de um item, além do que dslEquipCtxBase já dá. */
const dslItemVars = (def, grauRank) => ({
  grau: grauRank,
  custo: def?.custo ?? 0,
  penalidade: def?.penalidade ?? 0,
});

/**
 * Dois canais desta lista têm nome diferente no Motor, e uma Habilidade Única
 * gravada antes de 2026-07-30 usa o nome velho. A troca é na LEITURA, sem
 * reescrever a ficha: quem abrir e salvar de novo já grava o id novo.
 */
const CANAL_UNICA_LEGADO = { pvMax: "hp", peMax: "pe" };

/**
 * O estado da bancada de uma Habilidade Única ATIVA. Um por entrada de
 * equipamento, porque a ativação é do item: duas armas com habilidade ativa são
 * dois interruptores. O `uid` da entrada já é minúsculo com underscore, que é o
 * vocabulário do DSL, então ele entra inteiro.
 */
export const estadoDaUnica = (uid) => `unica_${uid}`;

/** Contexto base da DSL para os efeitos de equipamento (sem o grau, que é por item).
    Usa os atributos BASE da ficha (o efetivo ainda não fechou quando o
    equipamento é resolvido), o que basta para os efeitos constantes. */
function dslEquipCtxBase(creature, bt) {
  const a = creature?.attributes ?? {};
  const nd = Math.max(1, creature?.core?.nd ?? 1);
  const m = (v) => Math.floor(((v ?? 10) - 10) / 2);
  return {
    bt, nd,
    forca: a.forca ?? 10, destreza: a.destreza ?? 10, constituicao: a.constituicao ?? 10,
    inteligencia: a.inteligencia ?? 10, sabedoria: a.sabedoria ?? 10, presenca: a.presenca ?? 10,
    mod_forca: m(a.forca), mod_destreza: m(a.destreza), mod_constituicao: m(a.constituicao),
    mod_inteligencia: m(a.inteligencia), mod_sabedoria: m(a.sabedoria), mod_presenca: m(a.presenca),
  };
}

/* ---------- ENCANTAMENTOS · texto verbatim ---------- */
/* Cada lista é diferente (armas, escudos, uniformes). Ids prefixados por lista
   porque nomes repetem entre listas (Isolante existe em escudo e uniforme, com
   textos diferentes). Campos:
     usaCargas    -> gasta Cargas de Encantamento (número de cargas = BT).
     exclusivoCom -> ids que não podem coexistir na mesma arma.
     preReq       -> texto do [Pré-Requisito: ...] verbatim, quando há.
     requisitos   -> forma estruturada do pré-requisito, quando dá para checar. */

export const ENCANTAMENTOS_ARMA = [
  { id: "enc_arma_afiada", nome: "Afiada",
    descricao: "A energia amaldiçoada se concentra na lâmina ou ponta da arma, deixando-a mais afiada e perigosa. A arma recebe o traço Fatal d8. Caso a arma já possua o traço, o dado dele aumenta em um nível.",
    preReq: "A arma causa dano cortante ou perfurante",
    requisitos: [{ tipo: "danoArma", danoTipos: ["ct", "pf"] }] },
  { id: "enc_arma_amplificadora", nome: "Amplificadora",
    descricao: "A sua ferramenta amaldiçoada se torna capaz de amplificar a capacidade da sua técnica, seja física ou marcial, estando conectada a ela. Após realizar um ataque com esta arma, o portador causa metade do bônus de treinamento em dados de dano a mais no próximo Feitiço de Dano ou Técnica Marcial de Ataque que cause dano que utilizar até o final do próximo turno (caso ela realize diversos golpes, é aplicado apenas no primeiro). O dano adicional deste Encantamento é considerado Após Ataque." },
  { id: "enc_arma_armazenadora", nome: "Armazenadora",
    descricao: "A ferramenta amaldiçoada é capaz de guardar energia e deixar a sua disposição. Durante um descanso longo você pode armazenar até 5 PE na arma, não gastando estes pontos de energia pois armazenou eles durante um longo período. Você pode, desde que esteja empunhando a arma, recuperar os cinco pontos de energia armazenados nela. Só é possível recuperar energia amaldiçoada de uma arma armazenadora por vez." },
  { id: "enc_arma_balanceada", nome: "Balanceada",
    descricao: "Uma ferramenta perfeitamente balanceada para permitir uma mobilidade maior. Enquanto empunhar a arma você recebe um bônus de +2 em testes de manobras.",
    efeitos: [{ canal: "bonusManobra", expr: "2" }] },
  { id: "enc_arma_canalizadora", nome: "Canalizadora",
    descricao: "A ferramenta amaldiçoada serve como uma forma de canalizar a sua energia amaldiçoada. Enquanto empunhar a arma, a sua CD Amaldiçoada aumenta em 2.",
    efeitos: [{ canal: "cd", expr: "2" }] },
  { id: "enc_arma_cano_alongado", nome: "Cano Alongado",
    descricao: "Enquanto modificando e encantando a arma, você estende o cano dela. A arma tem o seu alcance aumentado em 1/4 do total em metros.",
    preReq: "Só pode ser aplicada em armas a distância",
    requisitos: [{ tipo: "categoriaArma", categorias: ["distancia"] }] },
  { id: "enc_arma_certeira", nome: "Certeira",
    descricao: "A arma se torna perfeitamente balanceada para golpes certeiros. Reduza a margem de crítico da arma em 1. Uma arma não pode ser certeira e destruidora ao mesmo tempo.",
    exclusivoCom: ["enc_arma_destruidora"],
    efeitos: [{ canal: "margemCritico", alvoItem: true, expr: "1" }] },
  { id: "enc_arma_compartimento", nome: "Compartimento",
    descricao: "Um compartimento é criado na arma, o qual pode armazenar um item de Mistura que seja um óleo ou um veneno que possa ser aplicado na arma. Durante um combate, você pode usar a arma com a mistura armazenada como uma ação livre, consumindo o veneno ou óleo imediatamente." },
  { id: "enc_arma_complementar", nome: "Complementar",
    descricao: "A arma se torna perfeita para suas capacidades e forças, complementando com eficiência. Enquanto empunhar esta arma o portador da arma recebe +2 na sua CD de Especialização e de Estilo Marcial." },
  { id: "enc_arma_cruel", nome: "Cruel",
    descricao: "A arma passa a ter espinhos e partes que aumentam o perigo dela. Uma arma com esta melhoria recebe +3 em rolagens de dano.",
    efeitos: [{ canal: "danoBonus", alvoItem: true, expr: "3" }] },
  { id: "enc_arma_defensora", nome: "Defensora",
    descricao: "Esta arma lhe concede uma capacidade de defesa adicional. A arma recebe o traço de arma: Aparar. Se já possuir o traço o bônus em Defesa fornecido por Aparar aumenta em 1.",
    preReq: "Esta melhoria apenas pode ser aplicada em armas corpo a corpo",
    requisitos: [{ tipo: "categoriaArma", categorias: ["corpo"] }] },
  { id: "enc_arma_destruidora", nome: "Destruidora",
    descricao: "A arma causa um dado de dano adicional em um acerto crítico. Uma arma não pode ser destruidora e certeira ao mesmo tempo.",
    exclusivoCom: ["enc_arma_certeira"] },
  { id: "enc_arma_discreta", nome: "Discreta",
    descricao: "Uma arma com uma construção fácil de se esconder. Você recebe +5 em rolagens de Furtividade e Prestidigitação para esconder apenas a arma." },
  { id: "enc_arma_drenadora", nome: "Drenadora",
    descricao: "A ferramenta se torna capaz de drenar energia de uma criatura após exorcizá-la. Uma vez por turno, ao matar uma criatura que utiliza energia amaldiçoada com esta arma, o portador recebe 2 pontos de energia amaldiçoada temporária para cada grau que a criatura possua (2 para Quarto grau, 4 para Terceiro, 6 para Segundo, 8 para Primeiro e 10 para Especial)." },
  { id: "enc_arma_elemental", nome: "Elemental",
    descricao: "A arma é constantemente imbuída com um elemento, até alcançar um ponto em que esse elemento se torna característico dela. Você pode trocar o tipo de dano da arma para um dano elemental à sua escolha. Depois de feita essa escolha não pode ser mudada.",
    preReq: "Ferramenta de Segundo Grau",
    requisitos: [{ tipo: "grauMin", grauMin: "segundo" }] },
  { id: "enc_arma_harmonizada", nome: "Harmonizada",
    descricao: "Uma ferramenta harmonizada com a energia, permitindo que você administre o momentum dos seus golpes entre as suas habilidades. Sempre que acertar um ataque crítico, você reduz em 1 o custo da próxima habilidade que gaste PE ou Pontos de Estamina que você utilizar até o fim do seu próximo turno." },
  { id: "enc_arma_horrenda", nome: "Horrenda",
    descricao: "Esta arma possui uma aura macabra e horripilante capaz de assustar até a prole da negatividade humana, as maldições. Enquanto empunhar esta arma toda habilidade que exige um TR e cause Abalado ou Amedrontado tem sua CD aumentada em um valor igual ao bônus de ferramenta da arma.",
    preReq: "Já possuir outro encantamento.",
    requisitos: [{ tipo: "outroEncantamento" }] },
  { id: "enc_arma_longa", nome: "Longa",
    descricao: "O alcance da arma aumenta em 1,5 metros.",
    preReq: "Esta melhoria apenas pode ser aplicada em armas corpo a corpo",
    requisitos: [{ tipo: "categoriaArma", categorias: ["corpo"] }] },
  { id: "enc_arma_otimizada", nome: "Otimizada",
    descricao: "Uma arma cujo saque foi otimizado, para ser mais ágil e rápido. Sacar uma arma Otimizada é uma Ação Livre e, enquanto empunhar a arma, o portador recebe +2 em testes de Iniciativa.",
    efeitos: [{ canal: "iniciativa", expr: "2" }] },
  { id: "enc_arma_penetrante", nome: "Penetrante",
    descricao: "Uma ferramenta preparada para penetrar através de resistências. Todo ataque com uma ferramenta penetrante ignora redução de dano em um valor igual ao bônus de treinamento do portador.",
    efeitos: [{ canal: "ignoraRD", alvoItem: true, expr: "bt" }] },
  { id: "enc_arma_poderosa", nome: "Poderosa",
    descricao: "Adiciona +2 as rolagens de dano da arma.",
    preReq: "Ter Cruel na arma",
    requisitos: [{ tipo: "encantamento", encantamento: "enc_arma_cruel" }],
    efeitos: [{ canal: "danoBonus", alvoItem: true, expr: "2" }] },
  { id: "enc_arma_potente", nome: "Potente",
    descricao: "Adiciona mais um dado de dano ao dano padrão da arma.",
    preReq: "Primeiro Grau",
    requisitos: [{ tipo: "grauMin", grauMin: "primeiro" }],
    efeitos: [{ canal: "dadosDano", alvoItem: true, expr: "1" }] },
  { id: "enc_arma_precisa", nome: "Precisa",
    descricao: "A arma foi modificada e trabalhada para permitir um manejo mais preciso. Você recebe um bônus de +2 em jogadas de ataque manejando esta arma.",
    efeitos: [{ canal: "acertoArma", expr: "2" }] },
  { id: "enc_arma_reluzente", nome: "Reluzente",
    descricao: "Sua arma reluz, distraindo o inimigo. Enquanto empunhar esta arma, seu portador recebe +2 em testes para fintar e quando tem um acerto crítico com esta arma contra uma criatura ela deve realizar um TR contra a CD de especialização ou estilo marcial do portador, em uma falha ela fica Desprevenida (e se já estiver, fica Cega) por uma rodada. Enquanto estiver empunhando esta arma ela causa -5 de penalidade em testes de Furtividade em qualquer lugar minimamente iluminado." },
  { id: "enc_arma_retorno", nome: "Retorno",
    descricao: "Este encantamento apenas pode ser posto em uma arma de arremesso. Ao arremessar uma arma com este encantamento, desde que não esteja completamente presa, retorna para a mão do portador logo após completar o ataque.",
    requisitos: [{ tipo: "categoriaArma", categorias: ["arremesso"], arremessavel: true }] },
  { id: "enc_arma_sintonizada", nome: "Sintonizada",
    descricao: "Sua ferramenta amaldiçoada é sintonizada para um tipo de elemento em específico, ampliando seus danos. Escolha um tipo de dano, exceto danos físicos ou na alma; sempre que você causar dano desse tipo com algum Feitiço ou Aptidão, até o final do próximo turno, seus ataques com uma arma com este encantamento causam 1d8 de dano adicional do mesmo tipo.",
    preReq: "Ferramenta de Segundo Grau",
    requisitos: [{ tipo: "grauMin", grauMin: "segundo" }] },
];

export const ENCANTAMENTOS_ESCUDO = [
  { id: "enc_esc_avassalador", nome: "Avassalador",
    descricao: "O escudo é levado ao limite, para ter um impacto avassalador. Caso seja usado para atacar, o dano dele conta como três níveis acima.",
    preReq: "ter Destruidor no escudo",
    requisitos: [{ tipo: "encantamento", encantamento: "enc_esc_destruidor" }] },
  { id: "enc_esc_bloqueador", nome: "Bloqueador",
    descricao: "O escudo é construído de forma a ser maior e mais pesado, permitindo-o bloquear para criaturas atrás de você. Qualquer criatura atrás de você a 1,5 metros recebe os efeitos de Meia Cobertura." },
  { id: "enc_esc_destruidor", nome: "Destruidor",
    descricao: "O escudo é reforçado ainda mais com o intuito de ataques. Caso seja usado para atacar, o dano dele conta como dois níveis acima.",
    preReq: "ter Espinhoso no escudo",
    requisitos: [{ tipo: "encantamento", encantamento: "enc_esc_espinhoso" }] },
  { id: "enc_esc_disco", nome: "Disco",
    descricao: "Construído como um disco e feito de materiais mais maleável em sua ponta o permitindo ser arremessado. Este escudo recebe o traço Arremesso (6/18).",
    preReq: "Apenas pode ser colocada em escudos leves e médios",
    requisitos: [{ tipo: "refEscudo", refIds: ["esc_leve", "esc_medio"] }] },
  { id: "enc_esc_espinhoso", nome: "Espinhoso",
    descricao: "O escudo tem espinhos colocados. Caso seja usado para atacar, o dano dele conta como um nível acima." },
  { id: "enc_esc_esponja", nome: "Esponja",
    descricao: "Este escudo possui uma textura gelatinosa que se endurece nos momentos certos. Enquanto empunhar este escudo, sempre que cair ou sofrer dano de uma estrutura, o portador pode gastar sua reação para reduzir o dano recebido em 10. Se for uma ferramenta de segundo grau mude o dano reduzido para 15 e se for de primeiro o dano reduzido se torna 20." },
  { id: "enc_esc_expansao", nome: "Expansão de Escudo",
    descricao: "Como uma ação bônus, o escudo se fragmenta em uma versão maior dele feito de pura energia. Escolha uma segunda criatura dentro de 1,5 metros para receber os benefícios do escudo." },
  { id: "enc_esc_intangivel", nome: "Intangível",
    descricao: "O escudo se manifesta como uma mera sombra, uma torrente de água sempre em movimento ou qualquer outro meio que permita ao portador mover sua mão com liberdade. Utilizar um escudo com esta propriedade não ocupa a mão do portador para propósitos de habilidades, mas ainda não o permite empunhar ou carregar outros objetos." },
  // ⚠ "Isolante" do ESCUDO foi REMOVIDO em 2026-08-01, a pedido do autor. Ele
  // dizia "a redução de dano do escudo passa também a ser aplicada a um tipo de
  // dano elemental à sua escolha", e virou letra morta quando a RD do escudo
  // passou a ser RD Geral, que já cobre todo tipo menos alma. O Isolante de
  // UNIFORME é outro encantamento, com outro texto, e continua existindo.
  { id: "enc_esc_polido", nome: "Polido",
    descricao: "O escudo foi polido, removendo pesos desnecessários e o dando uma forma e composição mais leve. A penalidade do escudo é reduzida em 2.",
    efeitos: [{ canal: "penalidadeEquip", expr: "2" }] },
  { id: "enc_esc_reforcado", nome: "Reforçado",
    descricao: "Recebe 2 de RD adicional contra dano físico.",
    // ⚠ RD GERAL, e não RD Física, a pedido do autor (2026-08-01), mesmo o
    // texto dizendo "contra dano físico": a RD do escudo inteira virou Geral, e
    // o adicional dela acompanha.
    efeitos: [{ canal: "rdGeral", expr: "2" }] },
];

export const ENCANTAMENTOS_UNIFORME = [
  { id: "enc_unif_aeronauta", nome: "Aeronauta",
    descricao: "Seu uniforme possui uma espécie de capa ou tecido extra que lhe permite planar no ar normalmente. Enquanto estiver caindo, como uma reação o portador pode puxar suas roupas e planar no ar, no final dos turnos do portador ele cai apenas 6 metros até chegar ao chão ou alguma superfície." },
  { id: "enc_unif_ajustado", nome: "Ajustado",
    descricao: "Mesmo com modificações, o uniforme é ajustado perfeitamente para o seu próprio corpo, requerendo um sacrifício menor da agilidade. Ao utilizar um uniforme ajustado, a penalidade dele é reduzida em 1, caso possua. Se o uniforme já possuir 0 de penalidade ele concede um bônus em testes de Furtividade de +2.",
    // As duas metades da regra numa expressão só: a redução vale sempre (num
    // uniforme sem penalidade ela não tem o que reduzir) e o bônus de
    // Furtividade só existe quando a penalidade base é zero.
    efeitos: [
      { canal: "penalidadeEquip", expr: "1" },
      { canal: "bonusPericia", alvo: "furtividade", expr: "2 * (penalidade == 0)" },
    ] },
  { id: "enc_unif_blindado", nome: "Blindado",
    descricao: "Adiciona-se uma blindagem no uniforme, eliminando as possíveis brechas. A Defesa concedida pelo uniforme aumenta em 2.",
    efeitos: [{ canal: "defesa", expr: "2" }] },
  { id: "enc_unif_distorcivo", nome: "Distorcivo", usaCargas: true,
    descricao: "Com o uso de uma peculiar imbuição amaldiçoada, a energia distorce o uniforme, permitindo que ele também distorça o espaço. Este Encantamento possui cargas. Uma vez por turno, como uma Ação Livre, você pode usar uma carga para se mover imediatamente para um lugar desocupado dentro de 6 metros, sem permitir ataque de oportunidade, você deve ver ou perceber de forma eficaz para onde se move." },
  { id: "enc_unif_escaldante", nome: "Escaldante",
    descricao: "Coberto de energia altamente volátil e concentrada, o uniforme se torna quase escaldante, ferindo em caso de contato constante. Uma criatura agarrada ou que esteja agarrando o portador deve realizar um TR contra a CD de Especialização do portador, em uma falha ele receberá Xd6 de perda de vida ou metade disso em um sucesso (onde X é igual a metade do bônus de treinamento). Todo início de turno a criatura deve refazer o TR, recebendo o efeito do encantamento enquanto cumprir as condições dele." },
  { id: "enc_unif_estimulante", nome: "Estimulante", usaCargas: true,
    descricao: "O uniforme passa a contar com um compartimento cheio de estimulantes, os quais podem ser diretamente aplicados no usuário. Este Encantamento possui cargas. Você pode gastar uma reação e uma carga para conceder vantagem a uma rolagem de Fortitude, Reflexos ou Vontade que esteja fazendo." },
  { id: "enc_unif_furtivo", nome: "Furtivo",
    descricao: "Um uniforme que busca ocultar o fluxo de energia de um feiticeiro, além de ser mais fácil de se camuflar e eliminar o barulho de passos. O portador de um uniforme com esta melhoria recebe um bônus em rolagens de Furtividade igual ao custo do uniforme.",
    efeitos: [{ canal: "bonusPericia", alvo: "furtividade", expr: "custo" }] },
  { id: "enc_unif_impulso", nome: "Impulso", usaCargas: true,
    descricao: "Você propulsiona o uniforme por meio de uma explosão de energia amaldiçoada. Este Encantamento possui cargas. O portador pode gastar uma carga e uma ação de movimento, então ele deve traçar uma linha com tamanho igual ao dobro do movimento dele. Ele se move até o final da linha. Se o movimento do portador por meio da linha passar por uma estrutura, objeto ou criatura ela deve realizar um TR de Reflexos e recebe 1d10 de dano de impacto para cada 6 metros percorrido até ela em uma falha ou metade disso em um sucesso.",
    preReq: "Propulsor",
    requisitos: [{ tipo: "encantamento", encantamento: "enc_unif_propulsor" }] },
  { id: "enc_unif_isolante", nome: "Isolante",
    descricao: "Seu uniforme é feito de materiais únicos, propícios para resistir a altas e baixas temperaturas. Você recebe 5 de RD contra dano Queimante e Congelante." },
  { id: "enc_unif_marcial", nome: "Marcial",
    descricao: "Pensado e projetado perfeitamente para artes marciais. Um uniforme marcial concede um bônus de +2 em testes para realizar manobras.",
    efeitos: [{ canal: "bonusManobra", expr: "2" }] },
  { id: "enc_unif_material_pesado", nome: "Material Pesado",
    descricao: "Este uniforme possui mais camadas de tecido, pedaços de metal ou uma capa embutida nele. Este uniforme concede +2 em TRs de Fortitude.",
    preReq: "O uniforme precisa possuir revestimento médio ou robusto",
    requisitos: [{ tipo: "refUniforme", refIds: ["unif_revestimento_medio", "unif_revestimento_robusto"] }],
    efeitos: [{ canal: "bonusTR", alvo: "fortitude", expr: "2" }] },
  { id: "enc_unif_propulsor", nome: "Propulsor",
    descricao: "Ao imbuir o uniforme com energia amaldiçoada, o fluxo constante parece acelerar o usuário. Enquanto vestir o uniforme o usuário recebe 3 metros de Deslocamento adicional.",
    efeitos: [{ canal: "movimento", expr: "3" }] },
  { id: "enc_unif_repulsor", nome: "Repulsor", usaCargas: true,
    descricao: "Ao armazenar recipientes lotados de energia amaldiçoada, possibilita os descarregar em resposta a uma tentativa de ataque. Este Encantamento possui cargas. Você pode consumir uma carga para, como uma Reação a um ataque corpo-a-corpo, liberar um impulso de repulsão à sua volta. Toda criatura a 1,5 metros de você deve realizar um TR de Fortitude contra sua CD de Especialização. Em uma falha ela é empurrada 3 metros na direção contrária do portador, ou metade disso se for bem sucedido.",
    preReq: "A ferramenta precisa ser de pelo menos segundo grau",
    requisitos: [{ tipo: "grauMin", grauMin: "segundo" }] },
  { id: "enc_unif_resiliente", nome: "Resiliente",
    descricao: "O uniforme é melhorado com foco em ser resistente a um tipo específico de danos. Concede redução de dano igual a 5 contra um tipo de dano (exceto os danos físicos, alma e energética). A RD aumenta para 10 se for uma ferramenta de Grau Especial." },
  { id: "enc_unif_revestido_espinhos", nome: "Revestido com Espinhos",
    descricao: "O uniforme é revestido de espinhos. Sempre que o portador de um uniforme com esta Melhoria for alvo de um ataque corpo a corpo e o agressor estiver adjacente ao portador o agressor deve realizar um TR de Fortitude contra a CD de Especialização do portador, em uma falha ele recebe Xd6 + modificador de constituição do portador, de dano perfurante (onde X é igual ao bônus de treinamento) ou metade disso em um sucesso." },
  { id: "enc_unif_ricochete", nome: "Ricochete", usaCargas: true,
    descricao: "Emanando uma densa aura, o uniforme passa a poder ricochetear projéteis. Você recebe 20% (2 ou menos em 1d10) de chance de falha contra todo ataque a distância que o tenho como alvo. Este é um Encantamento com cargas. Você pode consumir uma carga para, como uma reação a um ataque a distância, aumentar a porcentagem de falha para 50% (5 ou menos em uma rolagem 1d10) até o começo do seu próximo turno." },
];

/** Lista de encantamentos disponível para um tipo de equipamento. */
export const ENCANTAMENTOS_POR_TIPO = {
  arma: ENCANTAMENTOS_ARMA,
  escudo: ENCANTAMENTOS_ESCUDO,
  uniforme: ENCANTAMENTOS_UNIFORME,
};

const ENCANT_BY_ID = Object.fromEntries(
  [...ENCANTAMENTOS_ARMA, ...ENCANTAMENTOS_ESCUDO, ...ENCANTAMENTOS_UNIFORME].map((e) => [e.id, e]),
);
export const getEncantamento = (id) => ENCANT_BY_ID[id] ?? null;

/* ---------- Grau Especial: exemplo (Nuvem Brincalhona) ---------- */
/* Ferramentas de Grau Especial são únicas: cada uma tem uma habilidade própria,
   criada pelo jogador com o Narrador. O livro dá um exemplo. */
export const FA_GRAU_ESPECIAL_EXEMPLO = {
  nome: "Nuvem Brincalhona",
  subtitulo: "Ferramenta Amaldiçoada de Grau Especial, Nunchaku Pesado",
  descricao: "Um bastão dividido em três seções, conectadas por anéis entre as juntas. Surpreendentemente, essa é a única Ferramenta Amaldiçoada de grau especial que não tem um Feitiço, mas sim depende completamente da força bruta do usuário. A Nuvem Brincalhona é um Nunchaku Pesado de grau especial, com os Encantamentos: Amplificadora, Balanceada, Destruidora e Potente.",
  habilidade: {
    nome: "Potência Incomparável",
    descricao: "Para cada ponto em seu Modificador de Força, seus ataques com a Nuvem Brincalhona tem seu dano aumentado em 1 nível.",
  },
};

/* ---------- Identificação de Ferramentas Amaldiçoadas ---------- */
/* Teste de Feitiçaria, CD 20 + 5 por grau acima do quarto. +10 para descobrir a
   habilidade única de uma de Grau Especial. Texto de regra para a UI. */
export const FA_IDENTIFICACAO_CD = { quarto: 20, terceiro: 25, segundo: 30, primeiro: 35, especial: 40 };

/* ---------- Checagem de pré-requisito de encantamento ---------- */
/* ctx = { def, grauValue, escolhidos: [ids], selfId }. Devolve
   { ok, motivo }. `def` é a definição do equipamento base da entrada. */
export function avaliarRequisitoEncantamento(req, ctx) {
  const { def, grauValue, escolhidos = [] } = ctx;
  const rankAtual = AFTY_GRAUS.find((g) => g.value === grauValue)?.rank ?? 0;
  switch (req.tipo) {
    case "grauMin": {
      const rankReq = AFTY_GRAUS.find((g) => g.value === req.grauMin)?.rank ?? 99;
      const label = AFTY_GRAUS.find((g) => g.value === req.grauMin)?.label ?? req.grauMin;
      return { ok: rankAtual >= rankReq, motivo: `Ferramenta de ${label}` };
    }
    case "encantamento": {
      const alvo = getEncantamento(req.encantamento);
      return { ok: escolhidos.includes(req.encantamento), motivo: `Ter ${alvo?.nome ?? "encantamento"}` };
    }
    case "outroEncantamento": {
      const outros = escolhidos.filter((id) => id !== ctx.selfId);
      return { ok: outros.length >= 1, motivo: "Já possuir outro encantamento" };
    }
    case "danoArma": {
      const tipos = danoTiposDaArma(def);
      const ok = tipos.some((t) => req.danoTipos.includes(t));
      const nomes = req.danoTipos.map((t) => (TIPOS_DANO[t] ?? t).toLowerCase()).join(" ou ");
      return { ok, motivo: `Dano ${nomes}` };
    }
    case "categoriaArma": {
      const ok = req.categorias.includes(def?.categoria) ||
        (req.arremessavel && !!def?.props?.arremessavel);
      const nomes = req.categorias.map((c) => ARMA_CATEGORIAS.find((x) => x.value === c)?.label ?? c).join(" ou ");
      return { ok, motivo: nomes };
    }
    case "refEscudo":
      return { ok: req.refIds.includes(def?.id), motivo: "Escudo leve ou médio" };
    case "refUniforme":
      return { ok: req.refIds.includes(def?.id), motivo: "Revestimento médio ou robusto" };
    default:
      return { ok: true, motivo: "" };
  }
}

/** Tipos de dano que uma arma causa (para o pré-requisito de Afiada). */
function danoTiposDaArma(def) {
  const d = def?.dano;
  if (!d) return [];
  if (Array.isArray(d.dados)) return d.dados.map((x) => x.tipo).filter(Boolean);
  return d.tipo ? [d.tipo] : [];
}

/* ============================================================ */
/* ITENS ESPECIAIS                                              */
/* ============================================================ */

export const ITEM_CATEGORIAS = [
  { value: "acessorio",  label: "Acessórios",
    descricao: "Itens equipados pelos personagens e que, enquanto em sua posse, concedem efeitos especiais e melhorias." },
  { value: "espiritual", label: "Espirituais",
    descricao: "Criados a partir da conexão, controle e canalização da energia amaldiçoada pura e de pequenos espíritos amaldiçoados com funcionalidades específicas." },
  { value: "farmaco",    label: "Fármacos",
    descricao: "Sintetizados com kits de médicos e diferentes substâncias sendo refinadas e concentradas, cuidando da saúde tanto remediando quanto prevenindo." },
  { value: "mistura",    label: "Misturas",
    descricao: "Formadas a partir da combinação de elementos e substâncias, cuja mescla dá um novo efeito." },
  { value: "talisma",    label: "Talismãs",
    descricao: "Encravados na madeira e entalhados com símbolos e selos de proteção, que dão efeitos temporários, imediatos ou que perduram. Por padrão, um talismã tem que ocupar o espaço de uma mão para ser usado." },
];

/* `efeito` só existe nos itens cujo benefício o motor consegue ler.
   `aplicado: true` significa que deriveAfty realmente soma. Os demais
   dependem de sistema que não existe (Perícias, Estamina, Dados de Vida,
   Exaustão, condições) e ficam inertes de propósito.

   `efeito.motor` é a saída GERAL, aberta em 2026-08-03: `{ canal, alvo?, expr }`
   no catálogo inteiro do Motor, como os encantamentos já faziam. Os campos
   nomeados acima dela (`hpMax`, `cd`, `atributo`, `pericia`) são os antigos e
   continuam valendo, mas item novo deve usar o `motor`.

   `cura` marca o item que CURA, e vira uma linha no card de Cura da aba
   Habilidades. Basta CARREGAR (consumir um talismã não pede equipar):
     fixo      -> pontos de vida curados, número fechado
     fracaoPV  -> fração do PV MÁXIMO do portador (1 = tudo, 0,5 = metade)
     alcance   -> rótulo da linha
   ⚠ Item que cura é FLAT: os canais de cura não entram nele. "curando-se em 10
   pontos de vida" é número do talismã, e não uma cura que a criatura realiza.
   Ver o cabeçalho de afty-cura.js. */

export const ITENS_ESPECIAIS = [
  /* ---------- CUSTO 1 ---------- */
  { id: "it_antidoto_simples", nome: "Antídoto Simples", categoria: "farmaco", custo: 1,
    descricao: "Um simples antídoto, capaz de neutralizar venenos mais leves. O antídoto pode ser consumido como uma ação bônus, curando da condição envenenado e/ou qualquer veneno de custo 1 ou que venha de uma maldição de quarto grau." },
  { id: "it_brinco_da_comunicacao", nome: "Brinco da Comunicação", categoria: "acessorio", custo: 1,
    descricao: "Um par de brincos imbuídos com uma técnica de comunicação. Usar um desses brincos permite que o usuário sintonize com até 6 outras pessoas que também estejam usando um. Todos sintonizados na mesma conexão conseguem se comunicar mentalmente desde que estejam dentro de 30 metros. Sintonizar um brinco dentro de combate é uma ação completa, e enquanto se comunica o brinco brilha em um brilho perceptível por qualquer pessoa." },
  { id: "it_chaveiro_canalizador", nome: "Chaveiro Canalizador", categoria: "acessorio", custo: 1,
    descricao: "Um chaveiro que canaliza energia amaldiçoada, refinando-a e dificultando resistir. Um personagem com o chaveiro canalizador tem a sua CD Amaldiçoada aumentada em 1.",
    efeito: { cd: 1, aplicado: true } },
  { id: "it_injecao_estimulante", nome: "Injeção Estimulante", categoria: "farmaco", custo: 1,
    descricao: "Uma injeção criada a partir de uma mescla de medicina e controle de energia amaldiçoada. Ela tem uma única carga e a injetar faz com que você receba +2 de bônus em toda rolagem de perícia usando um atributo a sua escolha durante 10 minutos. Dentro de combate, injetar é uma ação bônus." },
  { id: "it_mix_energetico_pequeno", nome: "Mix Energético Pequeno", categoria: "farmaco", custo: 1,
    descricao: "Um conjunto de suplementos e substâncias que conseguem recuperar a energia e vigor físico, concentrados em uma cápsula. Como uma ação bônus, é possível consumir o mix, recuperando 3 pontos de estamina." },
  { id: "it_oleo_amolador", nome: "Óleo Amolador", categoria: "mistura", custo: 1,
    descricao: "Um pequeno recipiente cheio de um óleo que aumenta o potencial de uma arma, amolando-a. Pode ser aplicado em duas armas antes de acabar; uma arma coberta com óleo amolador recebe o traço Mortal d6. O óleo dura um dia." },
  { id: "it_oleo_flamejante", nome: "Óleo Flamejante", categoria: "mistura", custo: 1,
    descricao: "Um óleo que deixa a arma extremamente inflamável, cobrindo-se de chamas com o menor dos esforços. Pode ser aplicado em duas armas antes de acabar; uma arma coberta com óleo flamejante recebe o traço Modular Queimante. O óleo dura 10 minutos." },
  { id: "it_perola_carregada", nome: "Pérola Carregada", categoria: "espiritual", custo: 1,
    descricao: "Uma pequena pérola carregada com energia amaldiçoada, usada para recuperar do próprio estoque. Como uma ação bônus, é possível consumir a pérola, recuperando 3 pontos de energia amaldiçoada." },
  { id: "it_remedio_simples", nome: "Remédio Simples", categoria: "farmaco", custo: 1,
    descricao: "Um simples remédio, capaz de forçar uma reação regenerativa do corpo. Como uma ação comum, é possível consumir o remédio e gastar seus dados de vida para se curar, com um limite igual a quatro dados de vida." },
  { id: "it_simbolo_da_vida", nome: "Símbolo da Vida", categoria: "talisma", custo: 1,
    descricao: "Uma espécie de pequena ficha ou amuleto, encravado em madeira e imbuído com energia reversa. Como uma ação bônus, é possível o destruir para liberar a energia em si mesmo, curando-se em 10 pontos de vida.",
    cura: { fixo: 10, alcance: "Você" } },
  { id: "it_talisma_de_barreira", nome: "Talismã de Barreira", categoria: "talisma", custo: 1,
    descricao: "Um pequeno talismã que armazena uma barreira amaldiçoada. Pode usá-lo como uma ação bônus, invocando quatro paredes, cada uma possuindo 15 pontos de vida e ocupando 1,5 metros cada. Após usado, o talismã se esvai." },
  { id: "it_veneno_debilitante", nome: "Veneno Debilitante", categoria: "mistura", custo: 1,
    descricao: "Um pote de veneno cujo foco é atingir o corpo, debilitando-o. Contato, o alvo terá seu deslocamento reduzido pela metade." },
  { id: "it_veneno_intenso", nome: "Veneno Intenso", categoria: "mistura", custo: 1,
    descricao: "Um pote de veneno intenso e concentrado, com o propósito de invadir o corpo do alvo. Contato, o alvo ficará Envenenado durante uma rodada." },

  /* ---------- CUSTO 2 ---------- */
  { id: "it_amuleto_do_vislumbre", nome: "Amuleto do Vislumbre", categoria: "acessorio", custo: 2,
    descricao: "Um amuleto amaldiçoado que fornece ao portador capacidade de vislumbrar tudo ao seu redor com perfeição. O usuário deste item recebe visão no escuro com alcance de 9 metros, além de um bônus de +2 em rolagens de Percepção. Uma vez ao dia, você pode, como uma ação bônus, se tornar capaz de enxergar com os olhos fechados em 9 metros de diâmetro por 1 minuto.",
    efeito: { pericia: { percepcao: 2 }, aplicado: false } },
  { id: "it_antidoto_intermediario", nome: "Antídoto Intermediário", categoria: "farmaco", custo: 2,
    descricao: "Um simples antídoto, capaz de neutralizar venenos mais leves. O antídoto pode ser consumido como uma ação bônus, curando da condição envenenado e/ou qualquer veneno de custo 2 ou que venha de uma maldição de terceiro grau ou inferior." },
  { id: "it_apanhador_de_saude", nome: "Apanhador de Saúde", categoria: "acessorio", custo: 2,
    descricao: "Um pequeno amuleto com formato semelhante ao de um apanhador de sonhos, o qual atrai boas energias. Sempre que um portador do acessório for curado, recebe +1 de cura por dado, com um limite de cura adicional igual a metade do seu nível.",
    efeito: { aplicado: true, motor: [
      { canal: "curaPorDado", expr: "1" },
      { canal: "curaPorDadoTeto", expr: "piso(nd / 2)" },
    ] } },
  { id: "it_bracelete_do_vigor", nome: "Bracelete do Vigor", categoria: "acessorio", custo: 2,
    descricao: "Um bracelete que entra em sintonia com o corpo e acentua o físico, concedendo um maior vigor para o seu portador. Enquanto estiver utilizando o bracelete do vigor, os seus pontos de vida máximos aumentam em 10.",
    efeito: { hpMax: 10, aplicado: true } },
  { id: "it_conjunto_de_perolas_carregadas", nome: "Conjunto de Pérolas Carregadas", categoria: "espiritual", custo: 2,
    descricao: "Um conjunto de pérolas carregadas com energia amaldiçoada. Como uma ação bônus, é possível consumir o conjunto de pérolas, recuperando 6 pontos de energia amaldiçoada." },
  { id: "it_faixa_de_foco", nome: "Faixa de Foco", categoria: "acessorio", custo: 2,
    descricao: "Uma faixa que quando presa ao seu portador o permite focar e manter a concentração. Você recebe um bônus de +2 em testes para manter a concentração e, uma vez por dia, você pode escolher não perder a concentração ao invés de realizar um teste." },
  { id: "it_injecao_de_adrenalina", nome: "Injeção de Adrenalina", categoria: "farmaco", custo: 2,
    descricao: "Uma injeção com uma dose considerável de adrenalina, que o faz esquecer temporariamente do cansaço. Usar a injeção é uma ação bônus; ao usar ela, seu nível de Exaustão é reduzido em 1 até o final da cena, voltando imediatamente após o término dela." },
  { id: "it_mix_energetico_medio", nome: "Mix Energético Médio", categoria: "farmaco", custo: 2,
    descricao: "Um conjunto reforçado de suplementos e substâncias que aumentam a recuperação do vigor físico. Como uma ação bônus, é possível consumir o mix, recuperando 6 pontos de estamina." },
  { id: "it_pulseira_magistral", nome: "Pulseira Magistral", categoria: "acessorio", custo: 2,
    descricao: "Uma pulseira cujas propriedades conseguem extrair mais as capacidades de quem a usa, melhorando uma perícia. Enquanto estiver usando a pulseira magistral, o usuário se torna treinado em uma perícia a sua escolha.",
    efeito: { periciaTreinada: 1, aplicado: false } },
  { id: "it_remedio_intermediario", nome: "Remédio Intermediário", categoria: "farmaco", custo: 2,
    descricao: "Um remédio mais complexo, capaz de forçar uma reação regenerativa avançada no corpo. Como uma ação comum, é possível consumir o remédio e gastar seus dados de vida para se curar, com um limite igual a oito dados de vida." },
  { id: "it_simbolo_de_vida_florescente", nome: "Símbolo de Vida Florescente", categoria: "talisma", custo: 2,
    descricao: "Uma ficha ou amuleto encravado em madeira e com quantidades modestas de energia reversa, o que dá um sutil brilho e calor. Como uma ação bônus, é possível o destruir para liberar energia em si mesmo, curando-se em 25 pontos de vida.",
    cura: { fixo: 25, alcance: "Você" } },
  { id: "it_talisma_de_barreira_superior", nome: "Talismã de Barreira Superior", categoria: "talisma", custo: 2,
    descricao: "Melhorando no talismã de barreira, ela é tecida com mais cuidado e foco em uma maior agilidade. Pode usá-lo como uma ação bônus ou como uma reação, invocando quatro paredes, cada uma possuindo 25 pontos de vida e ocupando 1,5 metros cada. Após usado, o talismã se esvai." },
  { id: "it_veneno_desnorteante", nome: "Veneno Desnorteante", categoria: "mistura", custo: 2,
    descricao: "Um pote de veneno cuja composição foca em atingir o sistema nervoso de uma criatura. Contato, o alvo ficará Desprevenido durante uma rodada." },

  /* ---------- CUSTO 3 ---------- */
  { id: "it_aneis_do_conhecimento", nome: "Anéis do Conhecimento", categoria: "acessorio", custo: 3,
    descricao: "Um conjunto de peculiares anéis, forjados e imbuídos com energia amaldiçoada e conhecimentos, prendendo-se na pele e se conectando ao usuário. Os anéis aumentam o valor de Sabedoria do usuário em 2, podendo superar o seu limite de atributo, até o máximo de 30.",
    efeito: { atributo: { sabedoria: 2 }, superaLimite: true, aplicado: true } },
  { id: "it_antidoto_superior", nome: "Antídoto Superior", categoria: "farmaco", custo: 3,
    descricao: "Um simples antídoto, capaz de neutralizar venenos mais leves. O antídoto pode ser consumido como uma ação bônus, curando da condição envenenado e/ou qualquer veneno de custo 3 ou que venha de uma maldição de segundo grau ou inferior." },
  { id: "it_bracelete_da_forca", nome: "Bracelete da Força", categoria: "acessorio", custo: 3,
    descricao: "Firme e forjado a partir do mais forte aço, esse bracelete aumenta o valor de Força do usuário em 2, podendo superar o seu limite de atributo, até o máximo de 30.",
    efeito: { atributo: { forca: 2 }, superaLimite: true, aplicado: true } },
  { id: "it_chaveiro_absorsor", nome: "Chaveiro Absorsor", categoria: "acessorio", custo: 3,
    descricao: "Um pequeno adereço espiritual, semelhante a um chaveiro, o qual é capaz de absorver energia amaldiçoada a partir de vestígios. Sempre que eliminar um inimigo que possua energia amaldiçoada ou seja formado por energia, você recupera 2 pontos de energia amaldiçoada." },
  { id: "it_cinturao_do_inabalavel", nome: "Cinturão do Inabalável", categoria: "acessorio", custo: 3,
    descricao: "Um robusto cinturão metálico, com uma correnteza de energia amaldiçoada que é transmitida e reforça o físico do usuário. O cinturão aumenta o valor de Constituição do usuário em 2, podendo superar o seu limite de atributo, até o máximo de 30.",
    efeito: { atributo: { constituicao: 2 }, superaLimite: true, aplicado: true } },
  { id: "it_dominio_simples_contido", nome: "Domínio Simples Contido", categoria: "talisma", custo: 3,
    descricao: "Um pequeno tubo com um domínio simples armazenado. Pode ser usado como uma ação comum, erguendo um domínio simples sem custo de energia, o qual se mantém por até 2 rodadas, protegendo apenas o portador do item. Após ser usado, o tubo se torna inútil, com a técnica armazenada se esvaindo." },
  { id: "it_faixas_celeres", nome: "Faixas Céleres", categoria: "acessorio", custo: 3,
    descricao: "Várias faixas leves e quase transparentes, as quais quando amarradas em uma pessoa, usam da energia imbuída para estimular os reflexos e agilidade. As faixas aumentam o valor de Destreza do usuário em 2, podendo superar o seu limite de atributo, até o máximo de 30.",
    efeito: { atributo: { destreza: 2 }, superaLimite: true, aplicado: true } },
  { id: "it_mistura_profana", nome: "Mistura Profana", categoria: "mistura", custo: 3,
    descricao: "Uma mistura feita a partir de energia amaldiçoada concentrada e em estado ativo, capaz de estimular o fluxo interno de energia de um feiticeiro, mas possuindo um preço. Como uma ação comum, pode-se consumir a mistura profana, reduzindo o custo de todas as habilidades que utilizem energia amaldiçoada em 1 ponto, durante uma cena. Após o fim da cena, o personagem recebe 1 nível de exaustão." },
  { id: "it_mix_energetico_grande", nome: "Mix Energético Grande", categoria: "farmaco", custo: 3,
    descricao: "Uma pílula robusta e com concentrações extremas de substâncias que recuperam o físico e vigor. Como uma ação bônus, é possível consumir o mix, recuperando 10 pontos de estamina." },
  { id: "it_ombreiras_do_vigor_superior", nome: "Ombreiras do Vigor Superior", categoria: "acessorio", custo: 3,
    descricao: "Ombreiras que quando usadas em conjunto dos Braceletes do Vigor, trazem todo o potencial de resistência de um feiticeiro. Enquanto estiver utilizando as Ombreiras do Vigor Superior, os seus pontos de vida máximos aumentam em 20.",
    efeito: { hpMax: 20, aplicado: true } },
  { id: "it_ornamento_fascinante", nome: "Ornamento Fascinante", categoria: "acessorio", custo: 3,
    descricao: "Um ornamento com joias e uma beleza notável, além de um toque do jujutsu para o conceder um aspecto agradável que um acessório não poderia alcançar normalmente. O ornamento aumenta o valor de Presença do usuário em 2, podendo superar o seu limite de atributo, até o máximo de 30.",
    efeito: { atributo: { presenca: 2 }, superaLimite: true, aplicado: true } },
  { id: "it_pingente_do_intelecto", nome: "Pingente do Intelecto", categoria: "acessorio", custo: 3,
    descricao: "Leve, sutil e coberto de inscrições anciãs, esse pingente aumenta o valor de Inteligência do usuário em 2, podendo superar o seu limite de atributo, até o máximo de 30.",
    efeito: { atributo: { inteligencia: 2 }, superaLimite: true, aplicado: true } },
  { id: "it_pulseira_primacial", nome: "Pulseira Primacial", categoria: "acessorio", custo: 3,
    descricao: "Uma pulseira especial, a qual consegue levar além uma perícia do usuário. Enquanto estiver usando a pulseira primacial, o usuário se torna mestre em uma perícia a sua escolha, desde que já seja treinado nela.",
    efeito: { periciaMestre: 1, aplicado: false } },
  { id: "it_remedio_complexo", nome: "Remédio Complexo", categoria: "farmaco", custo: 3,
    descricao: "Um remédio de criação complexa. Como uma ação comum, é possível consumir o remédio e gastar seus dados de vida para se curar, com um limite igual a doze dados de vida." },
  { id: "it_terco_de_perolas_carregadas", nome: "Terço de Pérolas Carregadas", categoria: "espiritual", custo: 3,
    descricao: "Um terço criado a partir de pérolas carregadas com energia amaldiçoada. Como uma ação bônus, é possível consumir o terço, recuperando 10 pontos de energia amaldiçoada." },
  { id: "it_veneno_maldito", nome: "Veneno Maldito", categoria: "mistura", custo: 3,
    descricao: "Um veneno feito a partir de uma substância semelhante ao sangue de maldições, com propriedades extremamente nocivas. Contato, o alvo ficará Exposto (Envenenado) durante três rodadas." },

  /* ---------- CUSTO 4 ---------- */
  { id: "it_antidoto_absoluto", nome: "Antídoto Absoluto", categoria: "farmaco", custo: 4,
    descricao: "Um antídoto absoluto, confeccionado com a mais refinada medicina, capaz de neutralizar qualquer veneno ou toxina. O antídoto pode ser consumido como uma ação bônus, sendo curado da condição envenenado e/ou qualquer veneno de custo 4 ou que venha de uma maldição de primeiro grau ou inferior." },
  { id: "it_elixir_da_vida", nome: "Elixir da Vida", categoria: "espiritual", custo: 4,
    descricao: "Sendo o suprassumo da energia amaldiçoada, o elixir da vida incita uma vitalidade sem precedentes naquele que o consumir, usando da essência de várias maldições e junção de energia reversa. Como uma ação bônus, é possível consumir o elixir da vida, podendo usar todos os seus dados de vida para se curar, somando o dobro do seu modificador de constituição em cada um; você recebe vantagem e +5 em testes de resistência de Fortitude pelo resto da cena, assim como em Integridade." },
  { id: "it_laco_da_vida", nome: "Laço da Vida", categoria: "acessorio", custo: 4,
    descricao: "Um pequeno laço vermelho, imbuído com quantidades excessivas de energia reversa. Um feiticeiro que tenha o laço preso a si é capaz de se prender a vida: caso um personagem com um laço da vida vá morrer, tal morte é ignorada e o laço se desgasta, sumindo. Ao evitar a morte com este item, o personagem cura metade dos seus pontos de vida, mas recebe 1 nível de exaustão. O Laço da Vida não funciona caso o feiticeiro já esteja com 5 níveis de Exaustão.",
    cura: { fracaoPV: 0.5, alcance: "Você" } },
  { id: "it_lagrima_de_shinigami", nome: "Lágrima de Shinigami", categoria: "mistura", custo: 4,
    descricao: "O mais letal veneno já conhecido, capaz de imbuir uma arma com tamanha letalidade que passou a ser conhecido como a lágrima de um shinigami. Contato, o alvo perde 2d10 pontos de vida e tem sua Defesa reduzida em 4, e passa a gastar 2 PE adicionais sempre que usar energia amaldiçoada até o final da cena (perde 2d10 de vida, fica Amedrontado e Exposto por 2 rodadas)." },
  { id: "it_simbolo_de_vida_absoluta", nome: "Símbolo de Vida Absoluta", categoria: "talisma", custo: 4,
    descricao: "Encravado e entalhado com os símbolos de absoluta saúde e vida, esse símbolo consegue canalizar em sua máxima a vida. Como uma ação livre, é possível o destruir para liberar energia em si mesmo, recuperando todos os seus pontos de vida, até o máximo, além de receber pontos de vida temporários igual ao triplo do seu nível de personagem.",
    cura: { fracaoPV: 1, alcance: "Você" } },
  { id: "it_talisma_do_apice", nome: "Talismã do Ápice", categoria: "talisma", custo: 4,
    descricao: "Um talismã que quando destruído liberta uma quantidade excessiva de energia, a qual é direcionada a um atributo específico do usuário. Ao usar o talismã, o valor de um atributo a sua escolha se torna 30 durante um minuto (10 rodadas dentro de um combate) e ele se quebra." },
];

/* ============================================================ */
/* KITS DE FERRAMENTAS                                          */
/* ============================================================ */
/* Usados durante descansos ou interlúdios. Um personagem só pode usar um
   kit no qual possua TREINAMENTO, e ser treinado num Ofício dá
   treinamento no kit dele (Ofício (Cozinheiro) dá ferramentas de
   cozinheiro). Todo teste com o kit é um teste do Ofício respectivo.
   ⚠ Nada disso é validado: Perícias e Ofícios do personagem não existem.

   Ordem do array = ordem do livro (Ferreiro vem antes de Farmacêutico),
   mesma convenção das Aptidões e Especializações. */

export const KIT_CUSTO = 1;

/** Custo máximo de item que o personagem consegue CRIAR, por nível.
    O livro para no 20. Acima disso continua em 4, que é o teto da tabela. */
export function custoMaximoCriacao(nd) {
  const n = Math.max(1, nd ?? 1);
  if (n <= 5) return 1;
  if (n <= 10) return 2;
  if (n <= 16) return 3;
  return 4;
}

/** Benefícios de refeição do cozinheiro. CD 15, +5 por benefício adicional.
    `porGrau` multiplica pelo rank do grau do cozinheiro (1 a 5). */
export const REFEICOES_COZINHEIRO = [
  { id: "energetica", nome: "Energética",
    descricao: "Consumir uma refeição energética concede energia amaldiçoada temporária igual ao bônus de treinamento do cozinheiro." },
  { id: "leve", nome: "Leve", porGrau: 3,
    descricao: "Consumir uma refeição leve concede um aumento no Deslocamento de 3 metros para cada grau do cozinheiro. 3 para quarto, 6 para terceiro, 9 para segundo, 12 para primeiro e 15 para especial." },
  { id: "nutritiva", nome: "Nutritiva",
    descricao: "Consumir uma refeição nutritiva concede um bônus de +2 em um número de TRs igual a metade do bônus de treinamento do cozinheiro." },
  { id: "picante", nome: "Picante",
    descricao: "Consumir uma refeição picante concede +2 em jogadas de ataque." },
  { id: "reforcada", nome: "Reforçada",
    descricao: "Consumir uma refeição reforçada concede +2 na Defesa." },
  { id: "refrescante", nome: "Refrescante",
    descricao: "Consumir uma refeição refrescante permite a quem a comeu escolher realizar um teste com vantagem. Após isso, este benefício se encerra." },
  { id: "revigorante", nome: "Revigorante", porGrau: 5,
    descricao: "Consumir uma refeição revigorante concede 5 pontos de vida temporários para cada grau do cozinheiro." },
];

/* O livro não diz quantos espaços um kit ocupa, então vale o padrão dele:
   um item ocupa um espaço. ⚠ CONFIRMAR com o autor. */
export const KITS_FERRAMENTAS = [
  { id: "kit_alfaiate", nome: "Ferramentas de Alfaiate", oficio: "Alfaiate", custo: KIT_CUSTO, espacos: 1,
    cria: ["acessorio", "uniforme"],
    limite: "1 acessório por interlúdio até o nível 9, 2 a partir do 10. Um uniforme com revestimento por interlúdio.",
    descricao: "O kit de ferramentas de alfaiate é focado na criação de acessórios especiais e uniformes, feitos sob medida com o uso de habilidade manual e jujutsu. Entretanto, criar acessórios amaldiçoados é complexo e custoso: do nível 1 ao 9, você só pode criar 1 acessório por interlúdio; a partir do nível 10 você pode criar 2 acessórios por interlúdio. Você pode criar um uniforme com revestimento por interlúdio." },
  { id: "kit_alquimia", nome: "Ferramentas de Alquimia", oficio: "Alquimia", custo: KIT_CUSTO, espacos: 1,
    cria: ["mistura"], limite: "Sem limite.",
    descricao: "O kit de ferramentas de alquimia possibilita misturar elementos e substâncias para criar algo novo, podendo ser tanto venenos quanto misturas com efeitos diferenciados. Possuir treinamento em ferramentas de alquimia permite criar itens especiais do tipo Mistura; não há um limite de quantas misturas podem ser criadas." },
  { id: "kit_canalizador", nome: "Ferramentas de Canalizador", oficio: "Canalizador", custo: KIT_CUSTO, espacos: 1,
    cria: ["espiritual"], limite: "Sem limite.",
    descricao: "O kit de ferramentas de canalizador é um conjunto de peculiares amuletos, pérolas e outros itens espirituais, que permitem canalizar energia amaldiçoada e alguns espíritos amaldiçoados menores em itens. Possuir treinamento em ferramentas de canalizador permite criar itens especiais do tipo Espiritual; não há um limite de quantos itens espirituais podem ser criados." },
  { id: "kit_cozinheiro", nome: "Ferramentas de Cozinheiro", oficio: "Cozinheiro", custo: KIT_CUSTO, espacos: 1,
    cria: [], limite: "Mecânica própria: refeições com benefício, CD 15 e +5 por benefício adicional.",
    refeicoes: true,
    descricao: "O kit de ferramentas de cozinheiro dá a capacidade de extrair ao máximo habilidades culinárias, criando refeições da maior qualidade, as quais passam a até mesmo conferir benefícios para aqueles que as consumirem. Ser treinado em Ofício (cozinheiro) permite produzir refeições com propriedades especiais. Durante um descanso, um personagem treinado pode preparar uma refeição que concede benefícios especiais. Produzir uma refeição com um benefício exige sucesso em um teste de Ofício (Cozinheiro) CD 15. A CD aumenta em +5 para cada benefício adicional. Falhar no teste implica que a comida foi estragada e desperdiçada. Todos os benefícios duram até o próximo descanso longo e uma mesma refeição pode beneficiar um número de criaturas igual ao seu bônus de treinamento." },
  { id: "kit_entalhador", nome: "Ferramentas de Entalhador", oficio: "Entalhador", custo: KIT_CUSTO, espacos: 1,
    cria: ["talisma"], limite: "Sem limite.",
    descricao: "O kit de ferramentas de entalhador junta instrumentos e utensílios utilizados na arte de se entalhar e encravar, a qual quando unida a energia amaldiçoada permite criar amuletos e talismãs. Possuir treinamento em ferramentas de entalhador permite criar itens especiais do tipo Talismã; não há um limite de quantos talismãs podem ser criados." },
  { id: "kit_ferreiro", nome: "Ferramentas de Ferreiro", oficio: "Ferreiro", custo: KIT_CUSTO, espacos: 1,
    cria: ["arma", "escudo", "ferramenta_amaldicoada"],
    limite: "Melhoria temporária em metade do BT de equipamentos num descanso curto, ou o BT inteiro num longo.",
    descricao: "O kit de ferramentas de ferreiro é utilizado na criação e melhoria de armas e escudos, eventualmente utilizando do jujutsu para as transformar em ferramentas amaldiçoadas. Possuir treinamento nas ferramentas de ferreiro permite criar tanto armas e escudos comuns quanto ferramentas amaldiçoadas. Ao se tentar criar ou melhorar uma ferramenta amaldiçoada, segue-se o guia e as dificuldades especificadas no Capítulo 6: Itens e Ferramentas Amaldiçoadas. É o principal para se manter os equipamentos em um bom estado, realizando a sua manutenção e otimização, permitindo assim que o máximo do seu potencial seja extraído. Durante um descanso curto, um personagem com treinamento em ferramentas de ferreiro pode melhorar temporariamente uma quantidade de equipamentos igual a metade do seu bônus de treinamento; em um descanso longo, essa quantidade é igual ao bônus de treinamento. Uma arma melhorada adiciona +2 em jogadas de ataque realizadas com ela; um escudo melhorado adiciona metade do bônus de treinamento do ferreiro na RD concedida enquanto empunhado. As melhorias duram até o próximo descanso." },
  { id: "kit_farmaceutico", nome: "Ferramentas de Farmacêutico", oficio: "Farmacêutico", custo: KIT_CUSTO, espacos: 1,
    cria: ["farmaco"], limite: "Sem limite.",
    descricao: "O kit de ferramentas de farmacêutico permite cuidar efetivamente da saúde, além de sintetizar substâncias medicinais refinadas, criando antídotos ou remédios. Possuir treinamento nas ferramentas de farmacêutico permite criar itens especiais do tipo Fármacos; não há um limite de quantas medicinas podem ser criadas." },
];

/** Rótulo do que um kit consegue criar. */
export const CRIA_LABEL = {
  acessorio: "Acessórios",
  espiritual: "Espirituais",
  farmaco: "Fármacos",
  mistura: "Misturas",
  talisma: "Talismãs",
  uniforme: "Uniformes",
  arma: "Armas",
  escudo: "Escudos",
  ferramenta_amaldicoada: "Ferramentas Amaldiçoadas",
};

/* ============================================================ */
/* ÍNDICES E BUSCA                                              */
/* ============================================================ */

export const EQUIP_TIPOS = [
  { value: "arma",     label: "Armas" },
  { value: "uniforme", label: "Uniformes" },
  { value: "escudo",   label: "Escudos" },
  { value: "item",     label: "Itens Especiais" },
  { value: "kit",      label: "Kits de Ferramentas" },
];

const CATALOGO_POR_TIPO = {
  arma: ARMAS,
  uniforme: UNIFORME_MODIFICACOES,
  escudo: ESCUDOS,
  item: ITENS_ESPECIAIS,
  kit: KITS_FERRAMENTAS,
};

/**
 * O catálogo de um tipo. Passando a CRIATURA, as armas criadas por ela entram
 * na lista das armas.
 *
 * ⚠ É de propósito que elas entrem AQUI, e não numa lista paralela. Este é o
 * único lugar em que uma arma vira uma arma para o resto do sistema: a linha do
 * catálogo, o inventário, o `getEquipamento` do resolvedor, a Ferramenta
 * Amaldiçoada e a Arma Dedicada leem todos daqui. Uma lista paralela teria de
 * ser costurada em cinco lugares e esqueceria um.
 */
export const catalogoDoTipo = (tipo, creature = null) => {
  const base = CATALOGO_POR_TIPO[tipo] ?? [];
  if (tipo !== "arma" || !creature) return base;
  const custom = armasCustomDaFicha(creature);
  return custom.length ? [...base, ...custom] : base;
};

/** Busca uma entrada do catálogo pelo tipo + id. */
export function getEquipamento(tipo, id, creature = null) {
  return catalogoDoTipo(tipo, creature).find((e) => e.id === id) ?? null;
}

/** Espaços que UMA unidade do equipamento ocupa. */
export function espacosDoEquipamento(tipo, def) {
  if (!def) return 0;
  if (typeof def.espacos === "number") return def.espacos;
  if (tipo === "item") return ESPACOS_POR_CATEGORIA_ITEM[def.categoria] ?? 1;
  return 1; // default do livro: um item ocupa um espaço
}

/** Custo de UMA unidade. Kits são sempre custo 1. */
export function custoDoEquipamento(tipo, def) {
  if (tipo === "kit") return KIT_CUSTO;
  return def?.custo ?? 0;
}

/* ============================================================ */
/* FICHA: ENTRADAS DE EQUIPAMENTO                               */
/* ============================================================ */
/* Uma entrada = uma linha do inventário da ficha:
     { uid, tipo, refId, qtd, equipado }
   `equipado` é o que liga o efeito (Defesa do uniforme, RD Física do
   escudo, penalidade de Destreza, bônus de acessório). Carregar sem
   equipar continua ocupando espaço, como o livro manda. */

let uidSeq = 0;
export function novaEntradaEquip(tipo, refId) {
  uidSeq += 1;
  return {
    uid: `eq_${Date.now().toString(36)}_${uidSeq}`,
    tipo,
    refId,
    qtd: 1,
    equipado: false,
  };
}

const listaEntradas = (creature) => {
  const itens = creature?.equipamentos?.itens;
  return Array.isArray(itens) ? itens : [];
};

/**
 * Resolve a Ferramenta Amaldiçoada de UMA entrada (o campo `fa`).
 * Devolve o resumo pronto para a UI e para o motor: o bônus de grau, os
 * encantamentos escolhidos com o estado do pré-requisito de cada um, as
 * cargas (= BT) e a habilidade única. `bt` é o bônus de treinamento do
 * portador, de onde saem as cargas.
 */
export function resolveFerramenta(entrada, def, bt = 2, ctxBase = null, vagasLivres = 0) {
  const fa = entrada?.fa;
  if (!fa || !FA_TIPOS_EQUIP.includes(entrada?.tipo)) return null;

  const tipo = entrada.tipo;
  const grauValue = fa.grau ?? "quarto";
  const grauMeta = AFTY_GRAUS.find((g) => g.value === grauValue) ?? AFTY_GRAUS[0];
  const escolhidos = Array.isArray(fa.encantamentos) ? fa.encantamentos : [];
  // Vaga LIVRE: encantamento a mais que a arma pode ter E que não cobra o grau
  // (Completo do Treino de Manejo de Arma). Ela soma no permitido e sai da
  // conta da redução, que é o que significa "não perder Acerto e Dano Fixo do
  // Grau" (autor, 2026-08-07).
  const livres = Math.max(0, Math.trunc(Number(vagasLivres) || 0));
  const permitidos = faEncantamentosPermitidos(tipo, grauValue) + livres;

  // Grau PARA CÁLCULO: cada encantamento escolhido desce um degrau (ver
  // grauRankCalculo), fora os que ocupam vaga livre. O `permitidos` acima segue
  // no grau REAL, de propósito.
  const rankCalculo = grauRankCalculo(grauValue, Math.max(0, escolhidos.length - livres));
  const grauCalculo = grauDoRank(rankCalculo);

  // Os três benefícios de grau são o próprio rank: +1 por degrau. Bate com as
  // tabelas FA_BONUS_ARMA e FA_RD_ESCUDO do livro, e o rank ainda cobre o 0,
  // que é onde a redução por encantamento chega e as tabelas não iam.
  // Arma: o rank é o ACERTO. O dano fixo por grau é outra tabela, a
  // DANO_ADICIONAL_ARMA de afty-pericias.js, que a linha de dano consome.
  const bonusArma = tipo === "arma" ? rankCalculo : 0;
  const rdGrau = tipo === "escudo" ? rankCalculo : 0;
  const defesaGrau = tipo === "uniforme" ? rankCalculo : 0;

  // Contexto da DSL para este item. O grau aqui é o rank REAL, e não o de
  // cálculo: quem lê esta variável é a Habilidade Única, que o autor deixou
  // fora da redução por encantamento.
  const contextoDsl = dslItemVars(def, grauMeta.rank);
  const ctx = { ...(ctxBase ?? { bt, nd: 1 }), ...contextoDsl };

  // Cada encantamento escolhido com o estado dos pré-requisitos e da exclusão.
  const encantamentos = escolhidos.map((id) => {
    const enc = getEncantamento(id);
    const reqs = (enc?.requisitos ?? []).map((r) =>
      avaliarRequisitoEncantamento(r, { def, grauValue, escolhidos, selfId: id }));
    const exclusivoAtivo = (enc?.exclusivoCom ?? []).filter((x) => escolhidos.includes(x));
    return { id, enc, reqs, exclusivoAtivo, atende: reqs.every((r) => r.ok) && exclusivoAtivo.length === 0 };
  });

  const usaCargas = encantamentos.some((x) => x.enc?.usaCargas);
  const temHabUnica = faTemHabilidadeUnica(grauValue);

  const avisos = [];
  if (escolhidos.length > permitidos) {
    avisos.push(`${escolhidos.length} encantamentos escolhidos, o grau permite ${permitidos}.`);
  }
  for (const x of encantamentos) {
    if (x.exclusivoAtivo.length) {
      const nomes = x.exclusivoAtivo.map((y) => getEncantamento(y)?.nome ?? y).join(", ");
      avisos.push(`${x.enc?.nome ?? x.id}: não coexiste com ${nomes}.`);
    }
    for (const r of x.reqs) {
      if (!r.ok) avisos.push(`${x.enc?.nome ?? x.id}: pré-requisito não atendido (${r.motivo}).`);
    }
  }

  // ---------- Motor de Automação: efeitos numéricos ----------
  // Encantamentos (só os que ATENDEM ao pré-requisito) + a Habilidade Única do
  // Grau Especial (editada pelo jogador). Resolvidos aqui, aplicados no motor
  // só quando a Ferramenta está equipada.
  const efeitos = [];        // o que vai virar efeito de MOTOR
  let acertoEncantamento = 0;  // pseudo-canal acertoArma
  let reducaoPenalidade = 0;   // pseudo-canal penalidadeEquip
  const fontesAcerto = [];
  for (const x of encantamentos) {
    if (!x.atende) continue;
    for (const ef of x.enc?.efeitos ?? []) {
      const valor = evalNumber(ef.expr, ctx);
      // Efeito que resolve em zero não vira linha: é o caso do Ajustado num
      // uniforme que já tem penalidade, cuja metade de Furtividade não vale.
      if (!valor) continue;
      if (ef.canal === "acertoArma") {
        acertoEncantamento += valor;
        fontesAcerto.push({ label: x.enc.nome, valor });
        continue;
      }
      if (ef.canal === "penalidadeEquip") {
        reducaoPenalidade += valor;
        continue;
      }
      efeitos.push({
        canal: ef.canal,
        ...(ef.alvoItem ? { alvo: def?.id } : ef.alvo ? { alvo: ef.alvo } : {}),
        valor,
        origem: x.enc.nome,
        fonte: "encantamento",
      });
    }
  }
  // ⚠ A Habilidade Única NÃO entra mais no `efeitos` daqui (2026-07-30). Ela é
  // uma das cinco fontes do pool exclusivo, que não acumula com Feitiço Auxiliar
  // nem com Shikigami, e essa disputa só existe dentro do Motor. Somá-la aqui,
  // junto dos encantamentos, a deixaria de fora da regra. O que sai deste
  // resolver é a lista RESOLVIDA, e quem a transforma em efeito de Motor é o
  // `resolveEquipamentos`.
  const habilidadeEfeitosRaw = Array.isArray(fa.habilidadeEfeitos) ? fa.habilidadeEfeitos : [];
  const habilidadeEfeitos = habilidadeEfeitosRaw.map((ef) => ({
    canal: CANAL_UNICA_LEGADO[ef.canal] ?? ef.canal ?? "defesa",
    alvo: ef.alvo ?? "",
    expr: ef.expr ?? "",
    // Ativa fica na bancada de Simulação de Combate, passiva vale sempre. Quem
    // decide é o item, não a família (autor, 2026-07-30).
    modo: ef.modo === "ativa" ? "ativa" : "passiva",
    valor: evalNumber(ef.expr ?? "", ctx),
    ok: validateExpression(ef.expr ?? "").ok,
    contextoDsl,
  }));
  // Penalidade DESTE item já com o Polido / Ajustado descontados. A redução
  // nunca inverte o sinal: reduzir -1 em 2 dá 0, e não +1.
  const penalidadeBase = def?.penalidade ?? 0;
  const penalidade = Math.min(0, penalidadeBase + reducaoPenalidade);

  return {
    grau: grauValue,
    grauLabel: grauMeta.label,
    rankCalculo,
    grauCalculoLabel: grauCalculo?.label ?? "Sem grau",
    reduzido: rankCalculo < grauMeta.rank,
    bonusArma,
    // Acerto total desta arma: o grau mais o que os encantamentos somam.
    acertoArma: bonusArma + acertoEncantamento,
    fontesAcerto,
    rdGrau,
    defesaGrau,
    penalidade,
    reducaoPenalidade,
    permitidos,
    vagasLivres: livres,
    escolhidos,
    encantamentos,
    excedeu: escolhidos.length > permitidos,
    usaCargas,
    cargas: usaCargas ? bt : 0,
    temHabUnica,
    habilidadeUnica: fa.habilidadeUnica ?? "",
    habilidadeEfeitos,   // resolvidos, com expr para a edição
    efeitos,             // efeitos de encantamento, prontos para o Motor
    avisos,
  };
}

/**
 * Resolve tudo que o equipamento carregado e equipado produz.
 * Não decide nada de Defesa/RD final: só devolve as parcelas, e o
 * deriveAfty soma. `bt` (bônus de treinamento do portador) só alimenta as
 * Cargas de Encantamento das Ferramentas Amaldiçoadas.
 *
 * ⚠ A CARGA fica de fora de propósito. Um acessório pode dar +2 de Força,
 * o que muda o modificador, que muda o limite de carga: se a carga fosse
 * resolvida aqui, ela usaria um modificador desatualizado. Então o motor
 * chama esta função primeiro, fecha os atributos com o bônus de item, e
 * só então chama resolveCarga com o modificador final.
 *
 * `opcoes` traz o que OUTROS sistemas concedem ao equipamento, e chega pronto
 * do deriveAfty porque este resolvedor roda antes de tudo:
 *   vagasEncantamento  { [armaId]: n } — vagas LIVRES de encantamento naquela
 *                       arma (Completo do Treino de Manejo de Arma). Livre =
 *                       não desce o grau de cálculo.
 *   encantamentosExtras [encId] — encantamentos CONCEDIDOS a toda arma
 *                       equipada (Manejo Especial, Combatente 6°), também sem
 *                       custo de grau.
 */
export function resolveEquipamentos(creature, bt = 2, opcoes = {}) {
  const vagasEncantamento = opcoes.vagasEncantamento ?? {};
  const encantamentosExtras = Array.isArray(opcoes.encantamentosExtras) ? opcoes.encantamentosExtras : [];
  const entradas = [];
  const custoGasto = { 1: 0, 2: 0, 3: 0, 4: 0 };
  const attrBonus = { forca: 0, destreza: 0, constituicao: 0, inteligencia: 0, sabedoria: 0, presenca: 0 };
  const avisos = [];

  let espacosUsados = 0;
  let uniformeDefesa = 0;
  let rdEscudoBase = 0;
  let rdGeralBonus = 0;
  let penalidadeDestreza = 0;
  let hpMaxBonus = 0;
  let cdBonus = 0;
  let uniformesEquipados = 0;
  // Habilidade Única: efeitos para o Motor e os interruptores que as ativas
  // pedem na bancada. Ficam fora dos escalares acima de propósito (ver o
  // comentário no resolveFerramenta).
  const efeitosUnica = [];
  const estadosUnica = [];
  // Encantamentos: também viram efeito do MOTOR desde 2026-08-01, e não mais
  // uma soma em escalar por canal. Foi o que destravou Perícia, Manobra, TR,
  // Iniciativa e Dano, que não cabiam nos sete escalares de antes. Não levam
  // `exclusivo`: encantamento soma normal, não é fonte do pool exclusivo.
  const efeitosEncantamento = [];
  // Manejo Especial: quais bônus DO PORTADOR já foram emitidos. A propriedade
  // é UMA, concedida a todas as armas de uma vez, então "enquanto empunhar a
  // arma, sua CD aumenta em 2" não triplica por manejar três armas. O que mira
  // o ITEM (dano, crítico, acerto daquela arma) entra por arma, normalmente.
  const globaisConcedidos = new Set();

  // Contexto da DSL dos efeitos de Ferramenta (Motor de Automação).
  const ctxBase = dslEquipCtxBase(creature, bt);

  for (const e of listaEntradas(creature)) {
    // ⚠ A criatura vai junto porque as armas CUSTOM moram nela. Sem isso, uma
    // arma criada pelo jogador cairia no aviso de "equipamento desconhecido" e
    // sumiria do inventário na primeira releitura.
    const def = getEquipamento(e?.tipo, e?.refId, creature);
    if (!def) {
      avisos.push(`Equipamento desconhecido na ficha (${e?.tipo ?? "?"}/${e?.refId ?? "?"}).`);
      continue;
    }
    const qtd = Math.max(1, Math.floor(e?.qtd ?? 1));
    const espacosUn = espacosDoEquipamento(e.tipo, def);
    const custoUn = custoDoEquipamento(e.tipo, def);

    espacosUsados += espacosUn * qtd;
    if (custoUn >= 1 && custoUn <= 4) custoGasto[custoUn] += qtd;

    // Ferramenta Amaldiçoada da entrada (se houver e o tipo permitir). As vagas
    // livres são por ARMA do catálogo, a mesma chave que a Arma Dedicada usa.
    const fa = resolveFerramenta(e, def, bt, ctxBase, vagasEncantamento[def.id] ?? 0);

    const equipado = !!e?.equipado;
    if (equipado) {
      if (e.tipo === "uniforme") {
        uniformesEquipados += 1;
        // A armadura dá o CUSTO dela de Defesa, mais 1 por grau da Ferramenta
        // (autor, 2026-08-01). A tabela de Defesa por modificação não entra.
        uniformeDefesa += defesaDaArmadura(def, fa?.defesaGrau ?? 0);
        // Com Ferramenta, a penalidade é a já reduzida pelo Ajustado.
        penalidadeDestreza += fa ? fa.penalidade : (def.penalidade ?? 0);
      } else if (e.tipo === "escudo") {
        // ⚠ A RD do escudo é RD GERAL, e não RD Física (autor, 2026-08-01).
        // "RD Geral" no Afty já significa todo tipo de dano MENOS alma, que é
        // exatamente o que o autor pediu, então não precisa de canal novo.
        rdGeralBonus += def.rdEscudo ?? 0;
        // O "aumento BASE em RD do escudo", separado do que a Ferramenta soma.
        // O Especialista em Escudo (Combatente 4°) lê justamente essa parcela.
        rdEscudoBase += def.rdEscudo ?? 0;
        // RD por grau da Ferramenta: SOMA com a do escudo comum (autor).
        if (fa) rdGeralBonus += fa.rdGrau;
        // Com Ferramenta, a penalidade é a já reduzida pelo Polido.
        penalidadeDestreza += fa ? fa.penalidade : (def.penalidade ?? 0);
      }
      // Efeitos de item, só os que o motor sabe aplicar.
      const ef = def.efeito;
      if (ef?.aplicado) {
        if (ef.hpMax) hpMaxBonus += ef.hpMax;
        if (ef.cd) cdBonus += ef.cd;
        if (ef.atributo) {
          for (const [k, v] of Object.entries(ef.atributo)) {
            if (k in attrBonus) attrBonus[k] += v;
          }
        }
        // Bônus de perícia de item. Ligado em 2026-08-01: as Perícias existem
        // desde 2026-07-29 e este dado ficou inerte esse tempo todo.
        for (const [pericia, valor] of Object.entries(ef.pericia ?? {})) {
          efeitosEncantamento.push({
            canal: "bonusPericia", alvo: pericia, expr: String(valor),
            origem: e.uid, nome: def.nome,
          });
        }
        // Saída GERAL do item para o Motor (2026-08-03), no mesmo caminho dos
        // encantamentos: canal livre, expressão da DSL. Ela existe para o item
        // novo não precisar de um campo nomeado e de um `if` aqui a cada vez.
        // O valor viaja resolvido, como literal, porque o contexto de item tem
        // `grau`, `custo` e `penalidade`, que não existem no da criatura.
        for (const ex of ef.motor ?? []) {
          // O `rankCalculo` é o grau JÁ REBAIXADO por encantamento, que é o que
          // vale em toda conta do item desde 2026-08-01.
          const valor = evalNumber(ex.expr, { ...ctxBase, ...dslItemVars(def, fa?.rankCalculo ?? 0) });
          // Efeito que resolve em zero não vira linha, igual aos encantamentos.
          if (!valor) continue;
          efeitosEncantamento.push({
            canal: ex.canal,
            ...(ex.alvo ? { alvo: ex.alvo } : {}),
            expr: String(valor),
            origem: e.uid, nome: def.nome,
          });
        }
      }
      // Habilidade Única: vira efeito do MOTOR, com a marca do pool exclusivo.
      // O valor já sai resolvido aqui e viaja como literal porque a expressão
      // dela lê `grau`, que é do item e não existe no contexto da criatura.
      if (fa?.temHabUnica) {
        let temAtiva = false;
        for (const ex of fa.habilidadeEfeitos) {
          if (!ex.ok || !ex.canal || !String(ex.expr ?? "").trim()) continue;
          if (ex.modo === "ativa") temAtiva = true;
          efeitosUnica.push({
            canal: ex.canal,
            ...(ex.alvo ? { alvo: ex.alvo } : {}),
            expr: ex.expr,
            contextoDsl: ex.contextoDsl,
            // A ativa só entra com o interruptor dela ligado na bancada.
            ...(ex.modo === "ativa" ? { quando: estadoDaUnica(e.uid) } : {}),
            exclusivo: "habilidadeUnica",
            origem: e.uid,
            nome: `${def.nome} (Habilidade Única)`,
          });
        }
        if (temAtiva) estadosUnica.push({ id: estadoDaUnica(e.uid), label: `${def.nome} (Habilidade Única)` });
      }
      // Encantamentos (Motor de Automação): só enquanto a Ferramenta está
      // equipada. Viajam com o valor já resolvido, como literal, porque a
      // expressão lê `grau`, `custo` e `penalidade`, que são do item e não
      // existem no contexto da criatura.
      for (const ex of fa?.efeitos ?? []) {
        efeitosEncantamento.push({
          canal: ex.canal,
          ...(ex.alvo ? { alvo: ex.alvo } : {}),
          expr: String(ex.valor),
          origem: e.uid,
          nome: `${def.nome} (${ex.origem})`,
        });
      }
      // ---------- Manejo Especial (Combatente 6°) ----------
      // "uma propriedade de ferramenta amaldiçoada aplicada em toda arma que
      // você estiver manejando, se possível." O encantamento é CONCEDIDO: não
      // entra no `fa.encantamentos`, não consome vaga e não desce o grau de
      // cálculo, então a arma não perde Acerto nem Dano Fixo do Grau.
      //
      // Vale para arma SEM Ferramenta Amaldiçoada também (o texto diz "toda
      // arma"), e nesse caso o `grau` da expressão é 0.
      if (e.tipo === "arma" && encantamentosExtras.length) {
        const jaNaArma = fa?.escolhidos ?? [];
        const ctxItem = { ...ctxBase, ...dslItemVars(def, fa?.rankCalculo ?? 0) };
        for (const encId of encantamentosExtras) {
          const enc = getEncantamento(encId);
          // A arma que já comprou o encantamento não o ganha duas vezes.
          if (!enc || jaNaArma.includes(encId)) continue;
          const reqs = (enc.requisitos ?? []).map((r) => avaliarRequisitoEncantamento(
            r, { def, grauValue: fa?.grau ?? null, escolhidos: jaNaArma, selfId: encId },
          ));
          // O "se possível" do texto: a arma que não atende ao pré-requisito
          // (Afiada num martelo, Cano Alongado num corpo a corpo) simplesmente
          // não recebe a propriedade, sem aviso.
          if (!reqs.every((r) => r.ok)) continue;
          if ((enc.exclusivoCom ?? []).some((x) => jaNaArma.includes(x))) continue;
          for (const ef of enc.efeitos ?? []) {
            const valor = evalNumber(ef.expr, ctxItem);
            if (!valor) continue;
            // `acertoArma` é canal de Motor com alvo de fonte de dano, então
            // ele mira o item como qualquer `alvoItem`. Aqui ele NÃO é o
            // pseudo-canal do caminho comprado, que resolve dentro do `fa`.
            const doItem = !!ef.alvoItem || ef.canal === "acertoArma";
            const chave = `${encId}|${ef.canal}|${ef.alvo ?? ""}`;
            if (!doItem) {
              if (globaisConcedidos.has(chave)) continue;
              globaisConcedidos.add(chave);
            }
            efeitosEncantamento.push({
              canal: ef.canal,
              ...(doItem ? { alvo: def.id } : ef.alvo ? { alvo: ef.alvo } : {}),
              expr: String(valor),
              origem: e.uid,
              nome: `${enc.nome} (Manejo Especial)`,
            });
          }
        }
      }
    }

    entradas.push({ ...e, qtd, def, fa, espacosUn, custoUn, espacos: espacosUn * qtd, equipado });
  }

  if (uniformesEquipados > 1) {
    avisos.push("Mais de um uniforme equipado. Só um pode ser vestido por vez.");
  }

  return {
    entradas,
    espacosUsados,
    uniformeDefesa,
    rdEscudoBase,        // só a parcela do escudo, sem a Ferramenta Amaldiçoada
    rdGeralBonus,        // escudo + grau da Ferramenta
    penalidadeDestreza,  // uniforme + escudos, cumulativos, já com Polido/Ajustado
    hpMaxBonus,
    cdBonus,
    attrBonus,
    custoGasto,
    efeitosUnica,        // para o Motor, já marcados como pool exclusivo
    efeitosEncantamento, // para o Motor, sem marca de pool (somam normal)
    estadosUnica,        // interruptores das ativas, para a bancada
    avisos,
  };
}

/**
 * Fecha a carga com o modificador de Força JÁ com bônus de item aplicado.
 * Sobrecarregado dá -5 na Defesa e -4,5m no Deslocamento. Passar do dobro
 * do limite é impossível pelo livro, então vira aviso (a aba não impede,
 * do mesmo jeito que o orçamento não impede).
 */
export function resolveCarga(espacosUsados, modForca = 0, espacosExtras = 0) {
  // `espacosExtras` é o canal `espacosCarga` do Motor: "Você recebe espaços de
  // item adicionais no seu inventário" (Otimização de Espaço, Suporte 2°).
  const cargaLimite = capacidadeCarga(modForca) + espacosExtras;
  const cargaMaxima = cargaLimite * 2;
  const sobrecarregado = espacosUsados > cargaLimite;
  const acimaDoMaximo = espacosUsados > cargaMaxima;
  return {
    espacosUsados,
    cargaLimite,
    cargaMaxima,
    sobrecarregado,
    acimaDoMaximo,
    defesa: sobrecarregado ? SOBRECARGA_DEFESA : 0,
    movimento: sobrecarregado ? SOBRECARGA_MOVIMENTO : 0,
  };
}

/** Orçamento concedido no grau, para a leitura da aba (indicativo). */
export function orcamentoDoGrau(grauValue) {
  const base = EQUIP_GANHO_POR_GRAU[grauValue] ?? {};
  return { 1: base[1] ?? 0, 2: base[2] ?? 0, 3: base[3] ?? 0, 4: base[4] ?? 0 };
}

/* ============================================================ */
/* VALIDADOR DO CATÁLOGO                                        */
/* ============================================================ */
/* Roda no console em dev, no mesmo padrão dos outros catálogos do Afty. */

export function validarCatalogoEquipamentos() {
  const erros = [];
  const vistos = new Set();

  const checarIds = (lista, rotulo) => {
    for (const e of lista) {
      if (!e.id) erros.push(`${rotulo}: entrada sem id (${e.nome ?? "?"}).`);
      if (vistos.has(e.id)) erros.push(`${rotulo}: id duplicado "${e.id}".`);
      vistos.add(e.id);
      if (!e.nome) erros.push(`${rotulo}: "${e.id}" sem nome.`);
    }
  };

  checarIds(ARMAS, "ARMAS");
  checarIds(UNIFORME_MODIFICACOES, "UNIFORME_MODIFICACOES");
  checarIds(ESCUDOS, "ESCUDOS");
  checarIds(ITENS_ESPECIAIS, "ITENS_ESPECIAIS");
  checarIds(KITS_FERRAMENTAS, "KITS_FERRAMENTAS");

  const gruposValidos = new Set(ARMA_GRUPOS.map((g) => g.value));
  for (const a of ARMAS) {
    if (a.grupo != null && !gruposValidos.has(a.grupo)) {
      erros.push(`ARMAS: "${a.id}" tem grupo desconhecido "${a.grupo}".`);
    }
    for (const p of Object.keys(a.props ?? {})) {
      if (!PROP_BY_ID[p]) erros.push(`ARMAS: "${a.id}" tem propriedade desconhecida "${p}".`);
    }
    if (a.props?.especial && !a.especial) {
      erros.push(`ARMAS: "${a.id}" tem a propriedade Especial mas não aponta para um texto especial.`);
    }
    if (a.especial && !ESPECIAL_BY_ID[a.especial]) {
      erros.push(`ARMAS: "${a.id}" aponta para o especial inexistente "${a.especial}".`);
    }
    // O "/" do dano só é versátil quando a arma tem a propriedade versátil.
    if (a.dano?.duasMaos && !a.props?.versatil) {
      erros.push(`ARMAS: "${a.id}" tem dano de duas mãos sem a propriedade Versátil.`);
    }
    if (a.custo < 1 || a.custo > 4) erros.push(`ARMAS: "${a.id}" tem custo fora de 1 a 4.`);
  }

  const catsValidas = new Set(ITEM_CATEGORIAS.map((c) => c.value));
  for (const it of ITENS_ESPECIAIS) {
    if (!catsValidas.has(it.categoria)) {
      erros.push(`ITENS_ESPECIAIS: "${it.id}" tem categoria desconhecida "${it.categoria}".`);
    }
    if (it.custo < 1 || it.custo > 4) erros.push(`ITENS_ESPECIAIS: "${it.id}" tem custo fora de 1 a 4.`);
    if (!it.descricao) erros.push(`ITENS_ESPECIAIS: "${it.id}" sem descrição.`);
  }

  for (const k of KITS_FERRAMENTAS) {
    if (!k.descricao) erros.push(`KITS_FERRAMENTAS: "${k.id}" sem descrição.`);
    if (k.custo !== KIT_CUSTO) erros.push(`KITS_FERRAMENTAS: "${k.id}" não tem custo ${KIT_CUSTO}.`);
    for (const c of k.cria ?? []) {
      if (!CRIA_LABEL[c]) erros.push(`KITS_FERRAMENTAS: "${k.id}" cria "${c}", que não tem rótulo.`);
    }
  }

  // Todo especial transcrito precisa ser usado por pelo menos uma arma.
  const usados = new Set(ARMAS.map((a) => a.especial).filter(Boolean));
  for (const e of ARMA_ESPECIAIS) {
    if (!usados.has(e.id)) erros.push(`ARMA_ESPECIAIS: "${e.id}" não é usado por nenhuma arma.`);
  }

  // ---------- Ferramentas Amaldiçoadas ----------
  checarIds(ENCANTAMENTOS_ARMA, "ENCANTAMENTOS_ARMA");
  checarIds(ENCANTAMENTOS_ESCUDO, "ENCANTAMENTOS_ESCUDO");
  checarIds(ENCANTAMENTOS_UNIFORME, "ENCANTAMENTOS_UNIFORME");

  const refsEncant = new Set([...ENCANTAMENTOS_ARMA, ...ENCANTAMENTOS_ESCUDO, ...ENCANTAMENTOS_UNIFORME].map((e) => e.id));
  const refsEscudo = new Set(ESCUDOS.map((e) => e.id));
  const refsUnif = new Set(UNIFORME_MODIFICACOES.map((e) => e.id));
  const grausValidos = new Set(AFTY_GRAUS.map((g) => g.value));
  const tiposDano = new Set(Object.keys(TIPOS_DANO));

  for (const [tipo, lista] of Object.entries(ENCANTAMENTOS_POR_TIPO)) {
    for (const enc of lista) {
      if (!enc.descricao) erros.push(`ENCANTAMENTOS(${tipo}): "${enc.id}" sem descrição.`);
      for (const x of enc.exclusivoCom ?? []) {
        if (!refsEncant.has(x)) erros.push(`ENCANTAMENTOS(${tipo}): "${enc.id}" exclui "${x}", que não existe.`);
      }
      for (const ef of enc.efeitos ?? []) {
        // O canal não é conferido aqui: este arquivo não pode importar
        // afty-efeitos.js (fecharia o ciclo, ver o cabeçalho da seção), e quem
        // confere é o `aplicarEfeitos`, que avisa em canal desconhecido. Os
        // dois pseudo-canais deste arquivo nunca chegam lá.
        if (!ef.canal) erros.push(`ENCANTAMENTOS(${tipo}): "${enc.id}" tem efeito sem canal.`);
        if (ef.alvoItem && ef.alvo) {
          erros.push(`ENCANTAMENTOS(${tipo}): "${enc.id}" declara alvoItem e alvo ao mesmo tempo.`);
        }
        const chk = validateExpression(ef.expr ?? "");
        if (!chk.ok) erros.push(`ENCANTAMENTOS(${tipo}): "${enc.id}" tem expressão inválida (${chk.error}).`);
      }
      for (const r of enc.requisitos ?? []) {
        switch (r.tipo) {
          case "grauMin":
            if (!grausValidos.has(r.grauMin)) erros.push(`ENCANTAMENTOS(${tipo}): "${enc.id}" pede grau inválido "${r.grauMin}".`);
            break;
          case "encantamento":
            if (!refsEncant.has(r.encantamento)) erros.push(`ENCANTAMENTOS(${tipo}): "${enc.id}" pede encantamento inexistente "${r.encantamento}".`);
            break;
          case "danoArma":
            for (const t of r.danoTipos ?? []) {
              if (!tiposDano.has(t)) erros.push(`ENCANTAMENTOS(${tipo}): "${enc.id}" pede dano desconhecido "${t}".`);
            }
            break;
          case "refEscudo":
            for (const id of r.refIds ?? []) {
              if (!refsEscudo.has(id)) erros.push(`ENCANTAMENTOS(${tipo}): "${enc.id}" referencia escudo inexistente "${id}".`);
            }
            break;
          case "refUniforme":
            for (const id of r.refIds ?? []) {
              if (!refsUnif.has(id)) erros.push(`ENCANTAMENTOS(${tipo}): "${enc.id}" referencia uniforme inexistente "${id}".`);
            }
            break;
          case "categoriaArma":
          case "outroEncantamento":
            break;
          default:
            erros.push(`ENCANTAMENTOS(${tipo}): "${enc.id}" tem requisito de tipo desconhecido "${r.tipo}".`);
        }
      }
    }
  }

  return erros;
}
