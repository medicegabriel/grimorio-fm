/**
 * ============================================================
 * CATÁLOGO DE APTIDÕES AMALDIÇOADAS — GRIMÓRIO AFTY
 * ============================================================
 * Conteúdo é DADO, não código (ver roadmap).
 *
 * MODELO (confirmado pelo autor em 2026-07-16):
 *
 * 1. NÍVEIS DE APTIDÃO (trilhas). São 5: Aura, Controle e
 *    Leitura, Barreiras, Domínio e Energia Reversa. Cada uma vai
 *    de 0 a APTIDAO_NIVEL_MAX (5).
 *
 * 2. ORÇAMENTO. `derived.totalAptidao` (ver afty-derive.js) é o
 *    número de níveis disponíveis. Cada ponto sobe +1 numa
 *    trilha, 1:1. As Aptidões Amaldiçoadas em si NÃO custam
 *    orçamento: são desbloqueadas pelo nível da trilha.
 *
 * 3. CATEGORIAS. As 5 trilhas + duas sem trilha:
 *    • Aptidões Gerais: não seguem trilha nenhuma (Raio Negro,
 *      Técnica Máxima e afins).
 *    • Aptidões de Maldição: exclusivas da origem Maldição, que
 *      ainda NÃO existe em afty-origens.js (é a 8ª origem, o
 *      autor vai enviar). Enquanto ela não existir, a categoria
 *      fica travada. Cuidado: "Maldição" aqui é a ORIGEM, não o
 *      antigo nome do patamar Beyond.
 *
 * ⚠ NÃO usar as aptidões da 2.5.2 (src/components/fm-aptidoes.js)
 * como base: o autor confirmou que são OUTRAS. Texto VERBATIM.
 *
 * Shape de uma aptidão:
 *   {
 *     id: "aura_do_bastiao",     // estável, snake_case
 *     nome: "Aura do Bastião",
 *     categoria: "aura",         // id de APTIDAO_CATEGORIAS
 *     descricao: "texto do livro, verbatim",
 *     requisitos: [ ... ],       // ver avaliarRequisitoAptidao
 *     detalhe: "texto longo opcional (tabelas, sub-listas)",
 *   }
 *
 * Requisitos (mesma família de afty-treinamentos.js, mais `trilha`
 * e `aptidao`, que só existem aqui):
 *   { tipo:"atributo", attr:"presenca", valor:18 }        → bloqueia
 *   { tipo:"atributoOr", attrs:["forca","constituicao"], valor:16 }
 *   { tipo:"nd", valor:6 }        ("Nível 6" no livro)    → bloqueia
 *   { tipo:"trilha", trilha:"au", valor:2 }               → bloqueia
 *   { tipo:"aptidao", id:"aura_do_comandante" }           → bloqueia,
 *       MAS não bloqueia se o id ainda não foi transcrito (senão a
 *       aptidão ficaria inalcançável). validarCatalogoAptidoes()
 *       lista essas referências pendentes.
 *   { tipo:"origem", id:"herdado" }                       → bloqueia
 *   { tipo:"nota", label:"Treinado em Furtividade" } → sistema não
 *       construído (perícias): exibe como lembrete, NÃO bloqueia.
 * ============================================================
 */

import { getOrigem } from "./afty-origens";

/** Teto de Nível de Aptidão por trilha. */
export const APTIDAO_NIVEL_MAX = 5;

/**
 * Categorias de Aptidão. `trilha` é a chave em creature.aptidoes
 * (null = categoria sem trilha). `origemId` trava a categoria a uma
 * origem específica.
 */
export const APTIDAO_CATEGORIAS = [
  { id: "aura",             label: "Aptidões de Aura",                tab: "Aura",              trilha: "au",  trilhaLabel: "Aura" },
  { id: "controle_leitura", label: "Aptidões de Controle e Leitura",  tab: "Controle e Leitura", trilha: "cl",  trilhaLabel: "Controle e Leitura" },
  // trilhaLabel no SINGULAR: o livro define "Aptidão em Barreira (BAR)" e as
  // aptidões pedem "Nível de Aptidão em Barreira 2". (O texto do Treino de
  // Barreiras usa o plural, mas aquilo é transcrição, não rótulo gerado.)
  { id: "barreiras",        label: "Aptidões de Barreira",            tab: "Barreira",          trilha: "bar", trilhaLabel: "Barreira" },
  { id: "dominio",          label: "Aptidões de Domínio",             tab: "Domínio",           trilha: "dom", trilhaLabel: "Domínio" },
  { id: "energia_reversa",  label: "Aptidões de Energia Reversa",     tab: "Energia Reversa",   trilha: "er",  trilhaLabel: "Energia Reversa" },
  // "Especiais" (nome do livro). Eram "Gerais" até 2026-07-16. Não seguem
  // trilha nenhuma: Raio Negro, Domínio Simples, Técnica Máxima e afins.
  { id: "especiais",        label: "Aptidões Especiais",              tab: "Especiais",         trilha: null },
  { id: "maldicao",         label: "Aptidões de Maldição",            tab: "Maldição",          trilha: null, origemId: "maldicao" },
];

/**
 * SUB-grupos dentro de uma categoria. Só Maldição usa por ora: o livro
 * divide as exclusivas em Anatomia / Controle e Leitura / Especiais.
 * Os nomes colidem de propósito com categorias de topo (são o equivalente
 * "de maldição" delas), por isso os ids das aptidões levam prefixo `mal_`.
 */
export const APTIDAO_SUBCATEGORIAS = [
  {
    id: "mal_anatomia",
    label: "Aptidões de Anatomia",
    resumo:
      "A sua própria anatomia e corpo são amaldiçoados, assim conseguindo os desenvolver a " +
      "partir da energia, de diferentes maneiras.",
  },
  {
    id: "mal_controle_leitura",
    label: "Aptidões de Controle e Leitura",
    resumo:
      "As aptidões de controle e leitura envolvem a proficiência natural das maldições para com " +
      "a energia amaldiçoada.",
  },
  {
    id: "mal_especiais",
    label: "Aptidões Especiais",
    resumo:
      "Aptidões Especiais são específicas e mais diferentes em seu funcionamento. Uma parcela " +
      "delas envolve a substituição da Energia Reversa, utilizando da regeneração peculiar das " +
      "maldições.",
  },
];

const SUB_BY_ID = Object.fromEntries(APTIDAO_SUBCATEGORIAS.map((s) => [s.id, s]));

/** Só as categorias que têm trilha de nível (as 5). Fonte única: APTIDAO_CATEGORIAS. */
export const APTIDAO_TRILHAS = APTIDAO_CATEGORIAS.filter((c) => c.trilha).map((c) => ({
  key: c.trilha,
  label: c.trilhaLabel,
  categoriaId: c.id,
}));

/**
 * Catálogo. Texto VERBATIM do livro (o autor corrige quem inventa).
 * Os `[Pré-Requisito: ...]` que vinham no fim da descrição foram
 * extraídos para `requisitos` (estruturado, para o motor conferir),
 * mesmo padrão de afty-treinamentos.js. Nada mais foi alterado.
 *
 * Categorias transcritas até agora: Aura (2026-07-16).
 * Faltam: Controle e Leitura, Barreira, Domínio, Energia Reversa,
 * Gerais e Maldição.
 */
export const AFTY_APTIDOES = [
  {
    id: "afinidade_ampliada",
    nome: "Afinidade Ampliada",
    categoria: "aura",
    descricao:
      "Sua aura é aprimorada para ter uma maior afinidade com um elemento específico. Ao obter " +
      "essa habilidade, você escolhe um tipo de dano elemental. Sempre que você infligir dano " +
      "desse tipo específico, você causa dano adicional igual a 1 + o seu Nível de Aptidão em " +
      "Aura no total de dano.",
    requisitos: [],
  },
  {
    id: "aura_anuladora",
    nome: "Aura Anuladora",
    categoria: "aura",
    descricao:
      "A aura que o cobre obtém uma propriedade anuladora, capaz de protegê-lo de certos efeitos. " +
      "Uma quantidade de vezes igual ao seu bônus de treinamento, caso você fosse sofrer uma " +
      "condição, você pode pagar uma quantidade variável de energia para ignorá-la, a depender do " +
      "nível da condição. Esta aptidão não pode anular manobras e efeitos físicos, como a ação " +
      "Agarrar ou Ferimentos Complexos. Anular uma condição fraca custa 2PE; anular uma média " +
      "custa 4PE; uma forte custa 6PE e uma extrema custa 10PE. Você recupera esses usos em um " +
      "descanso longo.",
    requisitos: [],
  },
  {
    id: "aura_chamativa",
    nome: "Aura Chamativa",
    categoria: "aura",
    descricao:
      "Você cria uma aura ao seu redor que é chamativa, atraente e mágica, cativando a atenção " +
      "facilmente. Toda criatura que não for seu aliado, e começar um turno dentro de 4,5 metros " +
      "de você, precisa realizar um teste de resistência de vontade (atributo principal da " +
      "técnica). Em uma falha, ela fica enfeitiçada, podendo repetir o teste no próximo turno " +
      "dela, deixando de estar enfeitiçada em um sucesso. Para cada vez que a criatura falhar no " +
      "TR, ela recebe um bônus de +2 para resistir a esta aptidão ou deixar de estar enfeitiçada, " +
      "até o final da cena.",
    requisitos: [
      { tipo: "atributo", attr: "presenca", valor: 18 },
      { tipo: "nd", valor: 6 },
    ],
  },
  {
    id: "aura_controlada",
    nome: "Aura Controlada",
    categoria: "aura",
    descricao:
      "Você refinou seu controle sobre a aura, impedindo que ela se revele quando é " +
      "inconveniente, ajudando-o a se ocultar e esconder sua presença. Você soma metade do seu " +
      "Nível de Aptidão em Aura em testes de Furtividade. Sempre que realizar uma rolagem de " +
      "Furtividade, você pode gastar 1 ponto de energia amaldiçoada para receber o seu nível de " +
      "aptidão de aura por completo, ao invés de metade, controlando ainda mais a sua aura.",
    requisitos: [
      { tipo: "nota", label: "Treinado em Furtividade" },
      { tipo: "atributo", attr: "destreza", valor: 16 },
    ],
  },
  {
    id: "aura_de_contencao",
    nome: "Aura de Contenção",
    categoria: "aura",
    descricao:
      "Com foco em conter, tem-se uma aura mais pesada e densa. Sempre que for agarrar um alvo, " +
      "você adiciona metade do seu Nível de Aptidão em Aura na rolagem de Atletismo, assim como " +
      "na rolagem para evitar que uma criatura escape. Uma quantidade de vezes por cena igual a " +
      "metade do seu Nível de Aptidão em Aura, você pode também gastar 1 ponto de energia " +
      "amaldiçoada para receber vantagem para agarrar ou impor desvantagem na criatura que tentar " +
      "escapar.",
    requisitos: [{ tipo: "atributoOr", attrs: ["forca", "constituicao"], valor: 16 }],
  },
  {
    id: "aura_do_bastiao",
    nome: "Aura do Bastião",
    categoria: "aura",
    descricao:
      "Sua aura é protetiva e auxilia seus aliados a não serem acertados. Todo aliado dentro de " +
      "4,5 metros de você recebe um bônus na Defesa igual ao seu Nível de Aptidão em Aura.",
    requisitos: [],
  },
  {
    id: "aura_do_comandante",
    nome: "Aura do Comandante",
    categoria: "aura",
    descricao:
      "Refletindo uma personalidade ou presença forte, estar coberto pela sua aura parece ser uma " +
      "grande motivação para aliados. Você pode, como uma Ação Bônus, expandir sua aura para " +
      "cobrir todo aliado dentro de 4,5 metros, os quais recebem 1 + metade do seu Nível de " +
      "Aptidão em Aura em rolagens de dano e testes de perícia dentro do combate. Para cada turno " +
      "que você manter a aura ativa, você paga 2 pontos de energia amaldiçoada.",
    requisitos: [
      { tipo: "atributo", attr: "presenca", valor: 16 },
      { tipo: "nd", valor: 8 },
    ],
  },
  {
    id: "aura_do_comandante_evoluida",
    nome: "Aura do Comandante Evoluída",
    categoria: "aura",
    descricao:
      "Sua presença como comandante se torna ainda mais forte e significante. Quando utilizar " +
      "Aura do Comandante, você pode optar por somar seu Nível de Aptidão em Aura total ao invés " +
      "de 1 + metade e, também, conceder um bônus de +2 em jogadas de ataques e TRs. Entretanto, " +
      "o custo para manter aumenta de 2 para 4 PE.",
    requisitos: [
      { tipo: "aptidao", id: "aura_do_comandante" },
      { tipo: "nd", valor: 12 },
    ],
  },
  {
    id: "aura_drenadora",
    nome: "Aura Drenadora",
    categoria: "aura",
    descricao:
      "Uma aura vampiresca e capaz de drenar a partir da vida que é arrancada dos seus alvos. " +
      "Sempre que matar um inimigo, você recebe PV temporários igual a Xd8 + seu modificador de " +
      "Constituição, onde X é igual ao seu Nível de Aptidão em Aura. Eles podem acumular.",
    requisitos: [
      { tipo: "trilha", trilha: "au", valor: 2 },
      { tipo: "nd", valor: 6 },
    ],
  },
  {
    id: "aura_elemental",
    nome: "Aura Elemental",
    categoria: "aura",
    descricao:
      "Você converte as propriedades da sua aura, imbuindo-a com um elemento, para assim ser " +
      "capaz de alterar o tipo de dano causado pelos seus ataques com armas. Ao obter essa " +
      "habilidade, você pode escolher um tipo de dano da categoria Elementais para ser o novo " +
      "tipo de dano dos seus ataques que não sejam de técnica amaldiçoada. Além disso, seus " +
      "ataques causam 1d4 de dano adicional do tipo escolhido nesta aptidão. Com Nível de Aptidão " +
      "em Aura 2, o dano adicional se torna 1d6; com nível de aptidão 3, se torna 1d8 e, com " +
      "nível de aptidão 5, se torna 1d10. Dentro de combate, como uma ação livre, você pode " +
      "desabilitar a aura elemental, retornando os seus ataques ao tipo de dano padrão.",
    requisitos: [{ tipo: "nd", valor: 6 }],
  },
  {
    id: "aura_elemental_reforcada",
    nome: "Aura Elemental Reforçada",
    categoria: "aura",
    descricao:
      "Você reforça sua familiaridade com o elemento da sua aura, resistindo melhor a ele. Ao " +
      "obter essa aptidão, você recebe RD ao tipo de dano da sua aura elemental igual a redução " +
      "de Aura Reforçada somado ao seu Nível de Aptidão em Aura.",
    requisitos: [
      { tipo: "aptidao", id: "aura_elemental" },
      { tipo: "aptidao", id: "aura_reforcada" },
    ],
  },
  {
    id: "absorcao_elemental",
    nome: "Absorção Elemental",
    categoria: "aura",
    descricao:
      "Uma aura pronta para absorver e armazenar elementos, podendo depois liberá-los em seus " +
      "próprios ataques. Sempre que você receber dano elemental, você pode usar sua reação para " +
      "absorver parte dele e guardar. Isso não reduz o dano, mas, na próxima vez em que você " +
      "realizar um ataque você pode adicionar Xd6 de dano do mesmo tipo. X é igual ao seu Nível " +
      "de Aptidão em Aura. Esta habilidade não é cumulativa. No Nível de Aptidão em Aura 3, o " +
      "dado aumenta para d8; no nível 5, aumenta para d10.",
    requisitos: [{ tipo: "aptidao", id: "aura_elemental" }],
  },
  {
    id: "aura_embacada",
    nome: "Aura Embaçada",
    categoria: "aura",
    descricao:
      "Você desenvolve uma maneira de deixar a sua aura embaçada e borrada, criando uma chance de " +
      "um ataque inimigo simplesmente errar. Como uma ação bônus, você pode pagar 2 pontos de " +
      "energia amaldiçoada para ativar a aura embaçada, a qual você deve gastar 2 PE por rodada " +
      "para manter, encerrando-se caso opte por não pagar. Enquanto a aura estiver ativa, todo " +
      "ataque corpo-a-corpo ou a distância tem 20% de chance de falhar (1 ou 2 em 1d10).",
    requisitos: [{ tipo: "nd", valor: 6 }],
  },
  {
    id: "aura_inofensiva",
    nome: "Aura Inofensiva",
    categoria: "aura",
    descricao:
      "Sua aura amaldiçoada é moldada para aparentar ser menor e menos intensa do que realmente " +
      "é, dificultando até mesmo que te notem. Quando iniciar um combate, realize um teste de " +
      "Feitiçaria contra a Atenção de todos os inimigos que poderiam o detectar pela sua energia " +
      "amaldiçoada: você fica automaticamente escondido contra toda criatura cuja Atenção seja " +
      "superada pelo resultado do seu teste. Estar escondido por meio desta aptidão segue as " +
      "regras comuns de Furtividade, descritas na página 297.",
    requisitos: [{ tipo: "atributo", attr: "presenca", valor: 16 }],
  },
  {
    id: "casulo_de_energia",
    nome: "Casulo de Energia",
    categoria: "aura",
    descricao:
      "Evoluindo ao limite o fluxo da aura, você consegue a deixar tão densa e maciça que se " +
      "torna um casulo protetivo. Ao obter essa habilidade você pode, como uma Ação Comum, formar " +
      "um casulo de energia por 1 rodada, gastando 6 pontos de energia amaldiçoada. Enquanto o " +
      "casulo estiver ativo, você recebe imunidade a dano cortante, perfurante e de impacto " +
      "provindo de fontes mundanas (como armas ou quedas). Caso seja originário de técnica, você " +
      "apenas recebe RD adicional igual ao dobro do seu Nível de Aptidão em Aura.",
    requisitos: [
      { tipo: "aptidao", id: "aura_impenetravel" },
      { tipo: "trilha", trilha: "au", valor: 5 },
      { tipo: "nd", valor: 16 },
    ],
  },
  {
    id: "aura_excessiva",
    nome: "Aura Excessiva",
    categoria: "aura",
    descricao:
      "O fluxo de energia da sua aura se torna excessivo, liberando quantidades tão exageradas " +
      "que consegue resistir a danos além dos físicos. No começo de toda rodada você pode escolher " +
      "pagar 2 PE. Caso o faça, você recebe RD contra todos os tipos de dano, exceto na alma, " +
      "igual ao valor de redução fornecido por Aura Reforçada.",
    requisitos: [
      { tipo: "aptidao", id: "aura_reforcada" },
      { tipo: "atributo", attr: "constituicao", valor: 16 },
      { tipo: "nd", valor: 8 },
    ],
  },
  {
    id: "concentrar_aura",
    nome: "Concentrar Aura",
    categoria: "aura",
    descricao:
      "Você consegue concentrar a sua aura em um único ponto, que é a sua arma, sacrificando as " +
      "propriedades dela em troca de um segundo impacto. Como uma ação livre, você pode escolher " +
      "por desabilitar uma certa quantidade de aptidões de aura passivas por 1 rodada. Para cada " +
      "aptidão passiva desabilitada, após acertar um ataque desarmado ou com arma, o alvo recebe " +
      "1d8 de dano energético. Você pode desabilitar até uma quantidade de aptidões igual a 1 + " +
      "seu Nível de Aptidão em Aura. O dano desta Aptidão não é aplicado em Feitiços.",
    requisitos: [],
  },
  {
    id: "enganacao_projetada",
    nome: "Enganação Projetada",
    categoria: "aura",
    descricao:
      "Usando de agilidade e rapidez, você consegue projetar a sua aura antes de um ataque, " +
      "criando uma ilusão de quando ele acontecerá. Quando atacar uma criatura, ela deve realizar " +
      "um teste de resistência de astúcia (atributo principal da técnica), e caso falhe, você " +
      "terá vantagem nesse ataque. Para cada ataque após o primeiro, no mesmo turno, você deve " +
      "pagar 1 ponto de energia amaldiçoada para projetar a ilusão.",
    requisitos: [
      { tipo: "nota", label: "Treinado em Enganação" },
      { tipo: "atributo", attr: "destreza", valor: 18 },
      { tipo: "nd", valor: 4 },
    ],
  },
  {
    id: "golpe_com_aura",
    nome: "Golpe com Aura",
    categoria: "aura",
    descricao:
      "Ao invés de simplesmente deixar a sua aura fluir com um aspecto específico, você coloca " +
      "esse aspecto no seu próximo golpe, dificultando a resistência. Você pode gastar 1 ponto de " +
      "energia para imbuir um golpe com uma aptidão de aura que force um teste de resistência: a " +
      "criatura realiza o teste de resistência caso o ataque acerte, e a CD aumenta em um valor " +
      "igual ao seu Nível de Aptidão em Aura. Caso seja uma aptidão de aura que cause dano, o " +
      "dano é considerado após ataque. Não é possível utilizar Golpe com Aura em Feitiços.",
    requisitos: [],
  },
  {
    id: "transferencia_de_aura",
    nome: "Transferência de Aura",
    categoria: "aura",
    descricao:
      "Utilizando da sua energia, você se torna capaz de transferir a sua aura para outra pessoa. " +
      "Como uma ação bônus, você pode pagar 2 pontos de energia amaldiçoada e escolher uma " +
      "criatura dentro de 9 metros para transferir uma Aptidão de Aura específica. Você escolhe " +
      "qual aptidão deseja transferir, e a pessoa recebe os efeitos dela durante uma rodada. Você " +
      "pode manter a aura transferida por mais rodadas, pagando 1 ponto de energia para cada " +
      "rodada após a primeira.",
    requisitos: [],
  },
  {
    id: "aura_lacerante",
    nome: "Aura Lacerante",
    categoria: "aura",
    descricao:
      "Sua aura é afiada, causando danos apenas com o contato. Você pode ativar sua aura " +
      "lacerante por 1 rodada, como ação livre. Enquanto ativa, uma criatura que iniciar seu " +
      "turno dentro de 3 metros de você deve realizar um teste de resistência de Fortitude " +
      "(atributo principal da técnica). Em uma falha, ela recebe Xd6 + seu modificador do " +
      "atributo principal de dano energético, onde X é o seu Nível de Aptidão em Aura. No Nível " +
      "de Aptidão em Aura 3, o dado aumenta para d8; no nível 5, aumenta para d10.",
    requisitos: [],
  },
  {
    id: "aura_macabra",
    nome: "Aura Macabra",
    categoria: "aura",
    descricao:
      "Maldita e vil, sua aura é macabra e perturba aqueles que estejam sendo afetados por ela. " +
      "Toda criatura agressiva que começar um turno dentro de 1,5 metros de você precisa realizar " +
      "um teste de resistência de vontade (atributo principal da técnica). Em uma falha, ela fica " +
      "Abalada, podendo repetir o teste no próximo turno dela, deixando de estar Abalada em um " +
      "sucesso. Como uma ação livre, você pode pagar 1 ponto de energia amaldiçoada para expandir " +
      "esse alcance para 4,5 metros por 1 rodada. A partir do Nível de Aptidão em Aura 3, você " +
      "inflige Amedrontado ao invés de Abalado.",
    requisitos: [],
  },
  {
    id: "aura_macica",
    nome: "Aura Maciça",
    categoria: "aura",
    descricao:
      "Sua aura é tão densa que parece começar a tomar uma forma maciça, dificultando os inimigos " +
      "a conseguirem realmente acertá-lo. Sua Defesa aumenta em um valor igual a seu Nível de " +
      "Aptidão em Aura.",
    requisitos: [{ tipo: "atributo", attr: "constituicao", valor: 16 }],
  },
  {
    id: "aura_movedica",
    nome: "Aura Movediça",
    categoria: "aura",
    descricao:
      "Você molda a sua aura para atrapalhar a movimentação em suas proximidades. Ao obter esta " +
      "Aptidão, todo quadrado adjacente a você se torna terreno difícil. No Nível de Aptidão em " +
      "Aura 2, todo quadrado dentro de 3 metros se torna terreno difícil; no Nível 4, aumenta " +
      "para 4,5 metros e, no Nível 5, aumenta para 6 metros. A área afetada por esta aptidão não " +
      "pode ser aumentada por Expandir Aura.",
    requisitos: [],
  },
  {
    id: "aura_redirecionadora",
    nome: "Aura Redirecionadora",
    categoria: "aura",
    descricao:
      "Você descobre como imbuir parte da sua aura em um projétil ou arma de arremesso, " +
      "conseguindo-o redirecionar caso erre. Você pode gastar 2 pontos de energia amaldiçoada " +
      "para imbuir um projétil ou arma de arremesso antes de realizar um ataque: caso erre o " +
      "ataque com um projétil ou arma imbuída, você pode realizar a rolagem de ataque outra vez, " +
      "tendo como alvo uma criatura dentro de 6 metros do primeiro alvo, conforme o projétil ou " +
      "arma é redirecionada. Além disso, a segunda rolagem de ataque recebe um bônus no acerto " +
      "igual a 1 + metade do seu Nível de Aptidão em Aura.",
    requisitos: [{ tipo: "atributo", attr: "destreza", valor: 16 }],
  },
  {
    id: "aura_reforcada",
    nome: "Aura Reforçada",
    categoria: "aura",
    descricao:
      "Reforçando o fluxo da sua aura, você se torna capaz de pausar e anular uma parcela do dano " +
      "que recebe fisicamente, tornando mais difícil de realmente atingir seu corpo. Você recebe " +
      "redução contra danos físicos — cortes, perfurações e impactos — igual ao dobro do seu " +
      "Nível de Aptidão em Aura.",
    requisitos: [],
  },
  {
    id: "aura_impenetravel",
    nome: "Aura Impenetrável",
    categoria: "aura",
    descricao:
      "Melhorando ainda mais o fluxo, você se torna capaz de transformar a sua aura em uma " +
      "fortaleza impenetrável contra simples golpes físicos. Ao obter essa habilidade, você pode, " +
      "como uma Ação Bônus, transformar a sua aura em impenetrável por 1 rodada, gastando 3 " +
      "pontos de energia amaldiçoada. Enquanto sua aura estiver impenetrável, você recebe " +
      "resistência a dano cortante, perfurante e de impacto.",
    requisitos: [
      { tipo: "aptidao", id: "aura_reforcada" },
      { tipo: "trilha", trilha: "au", valor: 3 },
      { tipo: "nd", valor: 10 },
    ],
  },

  /* ---------- Aptidões de Controle e Leitura ---------- */
  {
    id: "canalizar_em_golpe",
    nome: "Canalizar em Golpe",
    categoria: "controle_leitura",
    descricao:
      "Você se torna capaz de concentrar sua energia amaldiçoada em suas armas e golpes, assim " +
      "potencializando ainda mais a capacidade destrutiva em troca de um gasto de energia. Como " +
      "uma Ação de Movimento, você pode gastar uma quantidade de pontos de energia amaldiçoada " +
      "igual a seu nível de aptidão em Controle e Leitura para adicionar dano: para cada ponto " +
      "gasto, seu próximo ataque causa 1d6 de dano adicional. Essa habilidade funciona apenas por " +
      "um ataque e não pode ser utilizada em Feitiços. Errar um ataque não consome esse uso.",
    requisitos: [],
  },
  {
    id: "canalizacao_avancada",
    nome: "Canalização Avançada",
    categoria: "controle_leitura",
    descricao:
      "Você aperfeiçoa a prática de canalizar energia em golpes, conseguindo a realizar mais " +
      "rapidamente e com mais poder. Canalizar energia em um golpe também pode ser feito como uma " +
      "reação ao realizar um ataque, e o bônus passa de 1d6 para 1d8. A habilidade continua " +
      "funcionando apenas por um ataque e não é consumida em um erro.",
    requisitos: [
      { tipo: "aptidao", id: "canalizar_em_golpe" },
      { tipo: "trilha", trilha: "cl", valor: 2 },
      { tipo: "nd", valor: 8 },
    ],
  },
  {
    id: "canalizacao_maxima",
    nome: "Canalização Máxima",
    categoria: "controle_leitura",
    descricao:
      "Você alcança o ápice da técnica de canalizar energia nos seus golpes, levando-a para um " +
      "nível superior. Você pode gastar 1PE adicional para Canalizar em Golpe e o bônus por ponto " +
      "gasto aumenta de 1d8 para 1d10. Além disso, você soma seu Nível de Aptidão em Aura ao " +
      "total de dano concedido pela Aptidão.",
    requisitos: [
      { tipo: "aptidao", id: "canalizacao_avancada" },
      { tipo: "trilha", trilha: "cl", valor: 4 },
      { tipo: "nd", valor: 16 },
    ],
  },
  {
    id: "cobrir_se",
    nome: "Cobrir-se",
    categoria: "controle_leitura",
    descricao:
      "Você se torna capaz de concentrar sua energia amaldiçoada em seu corpo, assim amenizando " +
      "os impactos em troca de um consumo imediato de energia. Como uma Reação, quando receber " +
      "dano, você pode gastar uma quantidade de PE igual a 2 + o dobro do seu CL para receber " +
      "pontos de vida temporários: para cada ponto gasto, você recebe 4 PVs temporários. Estes " +
      "PVs temporários são avulsos a outras fontes e não seguem o limite comum para PVs " +
      "temporários, durando até o final do turno da criatura contra a qual você usou a Reação.",
    requisitos: [],
  },
  {
    id: "cobertura_avancada",
    nome: "Cobertura Avançada",
    categoria: "controle_leitura",
    descricao:
      "Você desenvolve a sua capacidade de revestir e cobrir seu corpo com energia amaldiçoada, " +
      "resistindo a golpes. Ao usar sua Reação para cobrir-se, cada ponto gasto passa a conceder " +
      "8 pontos de vida temporários.",
    requisitos: [
      { tipo: "aptidao", id: "cobrir_se" },
      { tipo: "trilha", trilha: "cl", valor: 2 },
      { tipo: "nd", valor: 10 },
    ],
  },
  {
    id: "estimulo_muscular",
    nome: "Estímulo Muscular",
    categoria: "controle_leitura",
    descricao:
      "Você se torna proficiente em utilizar da energia para estimular e reforçar o seu corpo, " +
      "apurando força e agilidade. Quando realizar uma ação de movimento ou uma ação com as " +
      "perícias Acrobacia ou Atletismo você pode, como parte da mesma ação, utilizar energia para " +
      "os seguintes estímulos:\n\n" +
      "• Caso seja uma ação de movimento, você pode gastar 1 PE para aumentar a distância em um " +
      "valor igual a metade do seu deslocamento.\n\n" +
      "• Caso seja um teste (comum ou oposto), você pode gastar até uma quantidade de PE igual a " +
      "seu Nível de Aptidão em Controle e Leitura, recebendo um bônus de +1 para cada PE gasto. O " +
      "bônus dura até o começo do seu próximo turno.\n\n" +
      "• Caso seja uma ação que empurre uma criatura ou arremesse um objeto (Desarmar ou " +
      "Empurrar), você pode gastar 2 PE para aumentar a distância em um valor igual ao seu Nível " +
      "de Aptidão em Controle e Leitura multiplicado por 1,5 metros.\n\n" +
      "• Caso seja a ação de Pular, você pode gastar 1PE para dobrar a distância percorrida.\n\n" +
      "Você só pode utilizar cada estímulo uma vez por rodada.",
    requisitos: [],
  },
  {
    id: "estimulo_muscular_avancado",
    nome: "Estímulo Muscular Avançado",
    categoria: "controle_leitura",
    descricao:
      "Seu controle para imbuir os músculos com energia torna-se ainda mais apurado. Você passa a " +
      "poder utilizar cada estímulo duas vezes por rodada e eles recebem as seguintes " +
      "melhorias:\n\n" +
      "• Caso gaste PE para aumentar seu deslocamento, você pode escolher gastar 2PE ao invés de " +
      "1PE para que ele seja aumentado em um valor igual ao seu Deslocamento total, ao invés de " +
      "metade.\n\n" +
      "• Caso gaste para receber bônus em um teste, cada PE gasto passa a somar +2 no teste.\n\n" +
      "• Caso gaste para aprimorar uma ação de empurrar criatura ou arremessar objeto, a " +
      "distância é aumentada em um valor igual ao seu Nível de Aptidão multiplicado por 3 metros.",
    requisitos: [
      { tipo: "aptidao", id: "estimulo_muscular" },
      { tipo: "trilha", trilha: "cl", valor: 3 },
      { tipo: "nd", valor: 4 },
    ],
  },
  {
    id: "expandir_aura",
    nome: "Expandir Aura",
    categoria: "controle_leitura",
    descricao:
      "Você se torna capaz de controlar bem a sua energia, incluindo a que compõe sua aura, " +
      "podendo assim a expandir com uma descarga de energia. No seu turno, como uma ação livre, " +
      "você pode gastar 2 pontos de energia amaldiçoada para expandir a sua aura, dobrando o " +
      "alcance de todas as suas aptidões de aura passivas por uma rodada. Para cada rodada após a " +
      "primeira, você deve pagar mais 1 ponto de energia para a manter expandida.",
    requisitos: [{ tipo: "nd", valor: 6 }],
  },
  {
    id: "leitura_de_aura",
    nome: "Leitura de Aura",
    categoria: "controle_leitura",
    descricao:
      "Compreendendo bem a energia e as propriedades que ela pode assumir em auras, você consegue " +
      "ler auras e identificar os seus efeitos. Ao ver uma criatura que possua uma aura " +
      "amaldiçoada, você pode realizar uma rolagem de Feitiçaria para tentar a ler e descobrir " +
      "suas propriedades, cuja CD é igual a CD Amaldiçoada da criatura. Caso suceda no teste, " +
      "você descobre quais as propriedades passivas e ativas da aura da criatura.",
    requisitos: [],
  },
  {
    id: "leitura_rapida_de_energia",
    nome: "Leitura Rápida de Energia",
    categoria: "controle_leitura",
    descricao:
      "Treinando e se adaptando a ler rapidamente auras, você adquire uma maior capacidade de " +
      "prever a próxima ação dos usuários de energia amaldiçoada, o que te favorece não só " +
      "ofensivamente, mas defensivamente também. Você pode, como uma Ação de Movimento, realizar " +
      "um teste de Percepção contra a CD Amaldiçoada de uma criatura, recebendo um bônus igual ao " +
      "seu CL. Caso suceda, você não pode receber desvantagem ou prejuízos para acertar o inimigo " +
      "por causa de aura e ignora aumentos de Defesa fornecidos por auras, até o final da cena.",
    requisitos: [],
  },
  {
    id: "projetar_energia",
    nome: "Projetar Energia",
    categoria: "controle_leitura",
    descricao:
      "Ao invés de canalizar energia em um objeto, você a concentra e libera como um projétil " +
      "explosivo. Você pode gastar uma quantidade de pontos de energia amaldiçoada igual 1 + seu " +
      "nível de aptidão em Controle e Leitura e o transformar em um projétil, o qual você dispara " +
      "como uma ação comum. Para cada ponto gasto, o projétil causará 1d10 de dano energético, " +
      "somando o modificador do seu maior atributo no total. O alcance do projétil é igual a 9 " +
      "metros + 1,5 metros x bônus de treinamento. Você pode escolher tanto fazer uma rolagem de " +
      "ataque amaldiçoada (a qual não pode ser um crítico), ou forçar o alvo a realizar um teste " +
      "de resistência de reflexos (maior atributo), anulando o dano em um sucesso.",
    requisitos: [],
  },
  {
    id: "projecao_avancada",
    nome: "Projeção Avançada",
    categoria: "controle_leitura",
    descricao:
      "Dominando a prática de concentrar e disparar projéteis a partir da sua energia, você eleva " +
      "sua projeção. O dano causado por ponto gasto aumenta para 2d8, além de passar a somar o " +
      "dobro do seu modificador ao total. Caso use como um ataque, você recebe +2 para acertar " +
      "ou, caso force um teste de resistência, a dificuldade aumenta em 2.",
    requisitos: [
      { tipo: "aptidao", id: "projetar_energia" },
      { tipo: "trilha", trilha: "cl", valor: 2 },
      { tipo: "nd", valor: 8 },
    ],
  },
  {
    id: "projecao_maxima",
    nome: "Projeção Máxima",
    categoria: "controle_leitura",
    descricao:
      "Você leva a prática de disparar energia projetada até o ápice dela, criando projéteis " +
      "devastadores. O dano por ponto aumenta de 2d8 para 3d8. O bônus para acertar se torna +6 e " +
      "o aumento na dificuldade do teste de resistência 4, além de reduzir o dano à metade ao " +
      "invés de anular em um sucesso, ao escolher forçar um TR.",
    requisitos: [
      { tipo: "aptidao", id: "projecao_avancada" },
      { tipo: "trilha", trilha: "cl", valor: 4 },
      { tipo: "nd", valor: 16 },
    ],
  },
  {
    id: "projecao_dividida",
    nome: "Projeção Dividida",
    categoria: "controle_leitura",
    descricao:
      "Você descobre uma nova maneira de disparar sua energia projeta, dividindo-a em dois " +
      "projéteis no meio do caminho. Ao realizar um disparo de energia contra um alvo, você pode " +
      "pagar até metade da energia gasta no disparo para o duplicar como parte da mesma ação. A " +
      "duplicata do projétil deve ter como alvo uma criatura dentro de 4,5 metros do alvo " +
      "original e causa dano equivalente à quantidade de energia gasta nele, seguindo o cálculo " +
      "padrão de Projetar Energia; o projétil duplicado sempre segue o método de Teste de " +
      "Resistência da aptidão.",
    requisitos: [
      { tipo: "aptidao", id: "projecao_avancada" },
      { tipo: "trilha", trilha: "cl", valor: 3 },
      { tipo: "nd", valor: 12 },
    ],
  },
  {
    id: "punho_divergente",
    nome: "Punho Divergente",
    categoria: "controle_leitura",
    descricao:
      "Uma técnica peculiar de controle do fluxo da energia. O impacto de seus golpes diverge e " +
      "se divide em dois momentos: ao acertar o golpe, e após um curto período de tempo. Ao " +
      "acertar um ataque desarmado, você pode escolher causar apenas metade do dano, e guardar a " +
      "outra metade para ser causada no turno seguinte. Esta aptidão não pode ser utilizada em um " +
      "ataque que seja um raio negro, devido a aplicação extremamente rápida da energia. Caso " +
      "escolha que o resto do dano seja causado no turno seguinte, a criatura que recebeu o " +
      "ataque deve realizar um teste de resistência de Fortitude (maior atributo físico) e, caso " +
      "falhe, o dano será causado como se o inimigo tivesse vulnerabilidade. Além disso, conforme " +
      "maior a potência do primeiro golpe, mais difícil é se preparar para resistir ao segundo " +
      "impacto: para cada 5 pontos de dano na primeira metade do dano, a CD aumenta em 1.",
    requisitos: [],
  },
  {
    id: "emocao_da_petala_decadente",
    nome: "Emoção da Pétala Decadente",
    categoria: "controle_leitura",
    descricao:
      "Uma arte secreta transmitida entre as três grandes famílias Jujutsu como uma contra medida " +
      "para expansões de domínio, entretanto, esta não é sua única utilização. O usuário se cobre " +
      "com energia e contra-ataca quando um ataque de acerto garantido fosse o acertar. Como uma " +
      "reação a uma expansão de domínio ser ativada ou como uma ação bônus, você pode usar emoção " +
      "da pétala decadente. Enquanto estiver com a aptidão ativa, sempre que você receber um " +
      "acerto garantido físico de uma expansão de domínio, você pode gastar uma quantidade de " +
      "pontos de energia igual ao nível de DOM da criatura que expandiu o domínio, se o fizer o " +
      "acerto garantido é anulado. Esta aptidão é um efeito de Concentração. Caso uma criatura " +
      "entre no seu alcance corpo a corpo ou você comece seu turno com uma criatura dentro desse " +
      "mesmo alcance, como uma ação livre, você pode gastar 5PE para realizar um ataque corpo a " +
      "corpo com sucesso garantido, sem a necessidade de um teste. Se utilizar a aptidão de forma " +
      "ofensiva você não pode se proteger contra acertos garantidos até o começo do seu próximo " +
      "turno.",
    // O livro diz "aprender de um dos Três Grandes Clãs (Zenin, Gojo ou
    // Kamo)". O autor mapeou isso para a origem Herdado (2026-07-16), o que
    // troca um lembrete narrativo por um requisito que o motor confere.
    requisitos: [
      { tipo: "nd", valor: 5 },
      { tipo: "origem", id: "herdado" },
      { tipo: "aptidao", id: "cobrir_se" },
      { tipo: "trilha", trilha: "cl", valor: 3 },
    ],
  },
  {
    id: "rastreio_avancado",
    nome: "Rastreio Avançado",
    categoria: "controle_leitura",
    descricao:
      "Você refina e amplia suas capacidades de detectar e rastrear energia amaldiçoada. Quando " +
      "estiver em uma cena em que energia amaldiçoada tenha sido usada ou deixada (Feitiços, " +
      "aptidões, presença de maldições), você consegue detectar imediatamente vestígios e, caso " +
      "já conheça de quem eles originam, você descobre na hora. Caso não conheça, você pode " +
      "realizar um teste de Investigação ou Percepção contra a CD Amaldiçoada de quem originou o " +
      "vestígio e, em um sucesso, você percebe as características daquela energia (se é de um " +
      "humano ou maldição, um período aproximado em que esteve lá e outros) e é capaz de seguir o " +
      "rastro até onde ele acaba.",
    requisitos: [],
  },

  /* ---------- Aptidões de Barreira ---------- */
  {
    id: "tecnicas_de_barreira",
    nome: "Técnicas de Barreira",
    categoria: "barreiras",
    descricao:
      "Você se torna capaz de erguer e manipular barreiras, as quais podem ser usadas para " +
      "defender o usuário ou prender oponentes. Você pode criar, como uma Ação Comum, até 6 " +
      "paredes ao seu redor, com cada parede custando 1 ponto de energia amaldiçoada. Cada parede " +
      "erguida tem 1,5 metros de tamanho, e vida igual a 5 + seu nível de aptidão em Barreiras " +
      "multiplicado por metade do seu nível de personagem. Podem servir tanto como obstáculo como " +
      "uma maneira de prender seus inimigos. Você pode as manipular e mover usando outra ação " +
      "comum.",
    requisitos: [{ tipo: "trilha", trilha: "bar", valor: 1 }],
  },
  {
    id: "paredes_resistentes",
    nome: "Paredes Resistentes",
    categoria: "barreiras",
    descricao:
      "As paredes que você confecciona se tornam mais resistentes. Os pontos de vida de cada " +
      "parede passam a ser 10 + seu nível de aptidão em Barreiras multiplicado pelo seu nível de " +
      "personagem.",
    requisitos: [
      { tipo: "aptidao", id: "tecnicas_de_barreira" },
      { tipo: "trilha", trilha: "bar", valor: 2 },
      { tipo: "nd", valor: 4 },
    ],
  },
  {
    id: "barreira_rapida",
    nome: "Barreira Rápida",
    categoria: "barreiras",
    descricao:
      "Com treino e repetição, você se torna capaz de erguer barreiras de maneira ainda mais " +
      "ágil. Erguer ou manipular barreiras se torna uma ação bônus.",
    requisitos: [
      { tipo: "aptidao", id: "tecnicas_de_barreira" },
      { tipo: "trilha", trilha: "bar", valor: 3 },
      { tipo: "nd", valor: 6 },
    ],
  },
  {
    id: "cesta_oca_de_vime",
    nome: "Cesta Oca de Vime",
    categoria: "barreiras",
    descricao:
      "Uma antiga e esotérica técnica amaldiçoada utilizada contra domínios, antes mesmo do " +
      "Domínio Simples ser criado. Como ação bônus ou reação a uma expansão de domínio, você pode " +
      "gastar 3 PE para criar um trançado de vime ao seu redor e receber os efeitos desta " +
      "aptidão. Enquanto estiver com a Cesta Oca de Vime ativa, você não é afetado pelo efeito de " +
      "acerto garantido de uma expansão de domínio. Esta aptidão usa de Concentração e possui " +
      "Durabilidade igual ao seu Nível de BAR + 1. Sempre que falhar em um teste de concentração, " +
      "a Durabilidade da sua Cesta Oca de Vime desce em 1. No inicio do seu turno, caso você " +
      "deveria ter sido atingido por um Acerto Garantido, sua Cesta Oca de Vime perde 1 de " +
      "durabilidade. No inicio do seu turno, você pode manter o selo desta aptidão, ocupando as " +
      "suas duas mãos, ao fazer isso, a Cesta Oca de Vime não pode perder durabilidade por " +
      "qualquer efeito que não seja a falha de concentração. Caso a Cesta Oca de Vime quebre, " +
      "você recebe o efeito do Acerto Garantido instantaneamente.",
    requisitos: [
      // O livro diz "Ser de uma época onde ela era utilizada ou Mestre em
      // História". O autor encurtou para só a parte conferível (2026-07-16).
      { tipo: "nota", label: "Mestre em História" },
      { tipo: "trilha", trilha: "bar", valor: 1 },
      { tipo: "nd", valor: 5 },
    ],
  },
  {
    id: "cortina",
    nome: "Cortina",
    categoria: "barreiras",
    descricao:
      "A cortina é uma técnica de barreira comum, sendo um grande campo de força negro que isola " +
      "uma área específica, impossibilitando pessoas de fora de ver seu interior. Seu " +
      "funcionamento básico é de ocultamento, mas podem ser postas condições que expandem sua " +
      "utilidade. Ao criar uma cortina, você gasta 1 ponto de energia para cada 9 metros que a " +
      "área dela irá cobrir, e não há um custo para mantê-la. Você também pode colocar condições " +
      "em uma cortina, ao criá-la, de acordo com as regras sobre cortinas.",
    requisitos: [{ tipo: "aptidao", id: "tecnicas_de_barreira" }],
  },

  /* ---------- Aptidões de Energia Reversa ---------- */
  {
    // A porta de entrada da categoria NÃO pede trilha ER: pede CL 3. Faz
    // sentido, energia reversa nasce de controlar a amaldiçoada.
    id: "energia_reversa",
    nome: "Energia Reversa",
    categoria: "energia_reversa",
    descricao:
      "Você desenvolve a capacidade de produzir energia reversa, multiplicando a energia " +
      "amaldiçoada com ela mesma, convertendo negativo em positivo. Você libera acesso às " +
      "aptidões desta categoria, as quais usam pontos de energia reversa (PER), com um PER sendo " +
      "equivalente a dois pontos de energia amaldiçoada. Sua capacidade básica é se curar: para " +
      "cada ponto de energia reversa gasto, você se cura em 2d6, somando seu modificador de " +
      "presença ou sabedoria ao total de cura. Nos níveis 10, 15 e 20, a cura aumenta em 1d6. " +
      "Você pode gastar um máximo de pontos de energia reversa por vez igual a 1 + metade do seu " +
      "nível de aptidão. Curar-se dentro de combate é uma ação comum e você não pode usar essa " +
      "habilidade para curar outras criaturas.",
    requisitos: [
      { tipo: "nota", label: "Treinado em Feitiçaria" },
      { tipo: "trilha", trilha: "cl", valor: 3 },
      { tipo: "nd", valor: 8 },
    ],
  },
  {
    id: "cura_amplificada",
    nome: "Cura Amplificada",
    categoria: "energia_reversa",
    descricao:
      "Sua capacidade de cura é amplificada quando utilizando energia reversa. O dado da cura se " +
      "torna d8 e você passa a somar o dobro do seu modificador de presença ou sabedoria. A " +
      "quantidade máxima de pontos que podem ser gastos passa a ser igual a 1 + seu nível de " +
      "aptidão.",
    requisitos: [
      { tipo: "aptidao", id: "energia_reversa" },
      { tipo: "trilha", trilha: "er", valor: 3 },
      { tipo: "nd", valor: 12 },
    ],
  },
  {
    id: "fluxo_constante",
    nome: "Fluxo Constante",
    categoria: "energia_reversa",
    descricao:
      "Tendo uma maior dominância sobre a energia reversa, você estabelece um fluxo contínuo dela " +
      "no seu corpo, preservando-o e restaurando-o assim que sua integridade é reduzida. Assim " +
      "sendo, você pode manter uma cura contínua: no começo do seu turno, você pode se curar com " +
      "energia reversa seguindo as mesmas regras da cura básica, porém como uma ação livre. Caso " +
      "não o faça, você pode se curar como reação ao ter sua vida reduzida.",
    requisitos: [
      { tipo: "aptidao", id: "energia_reversa" },
      { tipo: "trilha", trilha: "er", valor: 3 },
      { tipo: "nd", valor: 12 },
    ],
  },
  {
    id: "regeneracao_aprimorada",
    nome: "Regeneração Aprimorada",
    categoria: "energia_reversa",
    descricao:
      "Aumentando seu domínio sobre a energia reversa, você se torna mais capaz de se regenerar " +
      "com ela. Você pode, como uma ação comum, regenerar Ferimentos Complexos, gastando 8 pontos " +
      "de energia reversa por ferimento. Entretanto, caso seja um desmembramento, só é possível " +
      "regenerar membros que tenham sido perdidos há menos de um dia ou não tenham sido " +
      "cicatrizados ainda (p.315). Ao utilizar a aptidão, pode-se gastar mais para recuperar " +
      "diferentes membros e feridas com o mesmo custo inicial. Se possuir o membro em mãos, a " +
      "ação diminui para Bônus e o custo para recuperar o membro se torna 3 PER, conforme você " +
      "coloca o membro no lugar. Além disso, você pode remover os efeitos de um veneno ao gastar " +
      "uma Ação Bônus e 4PER. Ao atingir Nível de Aptidão em Energia Reversa 5, você passa a " +
      "poder gastar 10PER ao invés do normal para utilizar a aptidão como uma ação livre. Quando " +
      "você regenerar uma ferida, você se cura no equivalente de metade dos PER gastos para isso " +
      "(caso gaste 8 para regenerar, você se cura o equivalente de 4PER gastos na aptidão Energia " +
      "Reversa).",
    requisitos: [
      { tipo: "aptidao", id: "cura_amplificada" },
      { tipo: "trilha", trilha: "er", valor: 4 },
      { tipo: "nd", valor: 15 },
    ],
  },
  {
    id: "liberacao_de_energia_reversa",
    nome: "Liberação de Energia Reversa",
    categoria: "energia_reversa",
    descricao:
      "Além de ser capaz de se curar com a energia reversa, você aprende como a liberar para " +
      "curar outras pessoas, o que é mais complexo e difícil. Você se torna capaz de curar outras " +
      "criaturas utilizando a habilidade Energia Reversa, desde que estejam dentro do seu alcance " +
      "de toque.",
    requisitos: [
      { tipo: "aptidao", id: "energia_reversa" },
      { tipo: "nd", valor: 10 },
    ],
  },
  {
    // Requisito CRUZADO de categoria: Canalizar em Golpe é de Controle e
    // Leitura. O tipo `aptidao` casa por id, então funciona entre categorias.
    id: "canalizar_energia_reversa",
    nome: "Canalizar Energia Reversa",
    categoria: "energia_reversa",
    descricao:
      "A energia reversa é nociva a maldições, então você se torna capaz de canalizá-la e usá-la " +
      "de maneira agressiva. Como uma Ação de Movimento, você pode gastar uma quantidade de " +
      "pontos de energia reversa igual ao seu bônus de treinamento para adicionar dano de energia " +
      "reversa a um ataque: para cada ponto gasto, você causa 2d6 de dano de energia reversa " +
      "adicional. Essa habilidade funciona apenas por um ataque, o qual deve ser contra uma " +
      "maldição e não pode ser utilizada em Feitiços. Errar um ataque não consome esse uso. Não é " +
      "possível utilizar Canalizar em Golpe e Canalizar Energia Reversa simultaneamente, podendo " +
      "aplicar apenas um deles em um mesmo ataque.",
    requisitos: [
      { tipo: "aptidao", id: "liberacao_de_energia_reversa" },
      { tipo: "aptidao", id: "canalizar_em_golpe" },
    ],
  },
  {
    id: "cura_em_grupo",
    nome: "Cura em Grupo",
    categoria: "energia_reversa",
    descricao:
      "Ao invés de curar apenas uma criatura, você se torna capaz de projetar a energia reversa " +
      "entre diferentes componentes de um grupo. Ao invés de decidir um alvo, você pode optar por " +
      "realizar a rolagem de cura e dividir o total do resultado entre todas as criaturas dentro " +
      "de um alcance igual a 4,5 + 1,5 para cada Nível de Aptidão em Energia Reversa. A " +
      "quantidade máxima de pontos que podem ser gastos aumenta em 2.",
    requisitos: [{ tipo: "aptidao", id: "liberacao_de_energia_reversa" }],
  },

  /* ---------- Aptidões Especiais (não seguem trilha) ---------- */
  {
    // ⚠ EFEITO NÃO APLICADO (regra confirmada pelo autor em 2026-07-16):
    // ter Raio Negro concede **+ND de PE** e **+1 DIRECIONADO na trilha au**
    // (ver Compreensão Avançada). Isso SOMA com o +1 de orçamento do Qnt.PE
    // Muito Grande, que é efeito separado e não dá nível de Aura.
    // Espera a passada de efeitos (o motor ainda não lê aptidões escolhidas).
    id: "raio_negro",
    nome: "Raio Negro",
    categoria: "especiais",
    descricao:
      "O raio negro - ou kokusen - é um fenômeno no jujutsu, onde o golpe de um feiticeiro é " +
      "altamente amplificado devido a uma distorção no espaço que ocorre quando a energia " +
      "amaldiçoada é aplicada 0.000001 segundos antes dele acertar. Quando um feiticeiro o " +
      "acerta, sua energia brilha em negro e o poder destrutivo é maior. Usar o kokusen também " +
      "aumenta a compreensão da energia amaldiçoada permanentemente. Todos os efeitos da " +
      "habilidade são:\n\n" +
      "• Compreensão Avançada. Após usar o kokusen pela primeira vez, a sua compreensão sobre a " +
      "energia amaldiçoada se expande. Seu máximo de energia amaldiçoada aumenta em um valor " +
      "igual ao seu nível de personagem e o seu Nível de Aptidão em Aura aumenta em 1. Ao subir " +
      "de nível, o aumento de energia é atualizado.\n\n" +
      "• Raio Negro. Usar o Kokusen não é algo consciente, ocorrendo apenas em certos momentos. " +
      "Quando tirar 20 em uma rolagem de ataque corpo-a-corpo, o seu golpe é coberto por raios " +
      "negros, utilizando o Kokusen. Um golpe com Kokusen causa dano adicional igual a metade do " +
      "total obtido na rolagem do dano (1.5x). O Dano Após Ataque é aplicado após o Kokusen. Além " +
      "disso, ele ignora qualquer tipo de resistência ou redução de danos.\n\n" +
      "• Estado de Consciência Absoluta. Após usar os raios negros, um feiticeiro adentra em um " +
      "estado de foco, onde torna-se mais fácil acertar golpes, extraindo 120% de seu potencial. " +
      "Durante 1 rodada, após conseguir um kokusen, o valor necessário para o kokusen reduzirá em " +
      "um. Caso acerte outro kokusen, a duração será renovada e o valor necessário reduzirá " +
      "novamente. Ele pode ser reduzido uma quantidade de vezes igual a metade do seu Nível de " +
      "Aptidão em Controle e Leitura.",
    requisitos: [
      { tipo: "trilha", trilha: "cl", valor: 3 },
      { tipo: "atributoOr", attrs: ["forca", "destreza"], valor: 16 },
      { tipo: "nd", valor: 10 },
    ],
  },
  {
    id: "abencoado_pelas_faiscas_negras",
    nome: "Abençoado pelas Faíscas Negras",
    categoria: "especiais",
    descricao:
      "Embora o raio negro seja algo incontrolável, você se foca tanto nisso que parece começar a " +
      "conseguir cativar as faíscas negras, as quais te abençoam. Você passa a usar o kokusen, " +
      "por padrão, em um 19 e em um 20 no dado. Ao estar em Estado de Consciência Absoluta, você " +
      "pode reduzir o valor necessário para Kokusen 1 vez a mais. Além disso, após acertar um " +
      "kokusen, você recebe um bônus igual a metade do seu Nível de Aptidão em Controle e Leitura " +
      "em jogadas de ataque e o nível total de aptidão em rolagens de dano pelo resto da cena.",
    requisitos: [
      { tipo: "aptidao", id: "raio_negro" },
      { tipo: "trilha", trilha: "cl", valor: 4 },
      { tipo: "trilha", trilha: "au", valor: 3 },
      { tipo: "nd", valor: 15 },
    ],
  },
  {
    id: "dominio_simples",
    nome: "Domínio Simples",
    categoria: "especiais",
    descricao:
      "Conhecido originalmente como o “Domínio dos Fracos”, o Domínio Simples ergue uma barreira " +
      "ao redor do usuário juntamente de seu domínio, neutralizando os efeitos e Acerto Garantido " +
      "de uma expansão. Você pode, com uma Reação contra a expansão de um domínio ou como Ação " +
      "Bônus no seu turno, gastar 5 PE e criar uma esfera de X metros de raio a sua volta (onde X " +
      "é igual a: 1,5m + Nível de DOM x 1,5 metros). Você e toda criatura dentro do Domínio " +
      "Simples não são afetados pelo Acerto Garantido e os efeitos de ambiente de um " +
      "domínio.\n\n" +
      "Esta aptidão usa de Concentração e possui Y de Durabilidade (onde Y é igual ao seu Nível " +
      "de BAR + 1). Sempre que falhar em um teste de concentração, a Durabilidade de seu domínio " +
      "simples desce em 1. No inicio do seu turno, caso você deveria ter sido atingido por um " +
      "acerto garantido, seu Domínio Simples perde 1 de durabilidade. Toda vez que seu Domínio " +
      "Simples perder durabilidade, ele também tem sua área deteriorada em 1,5m. Caso a " +
      "Durabilidade ou A Área do Domínio sejam deterioradas a 0, o Domínio Simples quebra, " +
      "fazendo você e todos dentro receber o Acerto Garantido instantaneamente.",
    requisitos: [
      { tipo: "trilha", trilha: "bar", valor: 1 },
      { tipo: "nd", valor: 5 },
    ],
  },
  {
    id: "reversao_de_tecnica",
    nome: "Reversão de Técnica",
    categoria: "especiais",
    descricao:
      "Em um processo complexo, você passa a ser capaz de utilizar energia reversa para abastecer " +
      "a sua técnica, possibilitando assim um efeito contrário ao padrão e com maior potência. " +
      "Quando obtiver um novo Feitiço, você pode escolher criar uma Reversão de Técnica no lugar: " +
      "uma Reversão tem o seu custo aumentado em um valor igual ao nível do Feitiço e deve, " +
      "também, ser criada como algo que reverte o conceito da sua técnica (o Vermelho, Reversão " +
      "de Técnica do Ilimitado, empurra ao invés de puxar). Ao obter esta aptidão, você recebe um " +
      "Feitiço adicional, a qual obrigatoriamente deve ser uma reversão.",
    requisitos: [
      { tipo: "aptidao", id: "energia_reversa" },
      { tipo: "nd", valor: 12 },
    ],
  },
  {
    id: "tecnica_maxima",
    nome: "Técnica Máxima",
    categoria: "especiais",
    descricao:
      "Dentre os feiticeiros jujutsu, existe a possibilidade de levar o potencial da sua técnica " +
      "ao máximo, criando uma habilidade definitiva a partir dela. É uma arte suprema, com grande " +
      "complexidade e necessidade de conhecimento sobre a própria técnica. Ao obter esta " +
      "habilidade, você se torna capaz de criar uma Técnica Máxima: você recebe um novo Feitiço o " +
      "qual, caso você possua acesso apenas aos de Nível 4, utiliza os valores de Nível 5 para " +
      "sua criação e, quando receber acesso ao Nível 5, sua Técnica Máxima passa a seguir os " +
      "valores próprios de uma.\n\n" +
      "Uma Técnica Máxima custa 25 PE e, após ser usada, você deve esperar uma quantidade de " +
      "rodadas igual a 6 – metade do seu Bônus de Treinamento para poder utilizá-la novamente.",
    requisitos: [
      { tipo: "nota", label: "Mestre em Feitiçaria" },
      { tipo: "nota", label: "Capacidade de Conjurar Feitiços Nível 4" },
    ],
  },

  /* ---------- Aptidões de Domínio ---------- */
  {
    id: "revestimento_de_dominio",
    nome: "Revestimento de Domínio",
    categoria: "dominio",
    descricao:
      "Você se cobre com um domínio fino, o qual não possui nenhum Feitiço imbuído, assim " +
      "conseguindo neutralizar técnicas ao derramá-las no espaço do revestimento. Você pode " +
      "gastar 5 PE e uma Ação Bônus, ou reação ao ser alvo dos efeitos de um Feitiço, para a " +
      "ativar o Revestimento: Enquanto ele estiver ativo você pode gastar 5 PE para sustentar o " +
      "efeito no início dos seus turnos. Com o Revestimento de Domínio ativo, você reduz o dano " +
      "de efeitos de técnicas ofensivas que te afetarem em um valor igual ao seu nível de " +
      "personagem. Essa redução não pode ser ignorada. Caso a Técnica seja de um nível menor ou " +
      "igual a metade do Nível de DOM, arredondado para cima, ela é completamente anulada. Este " +
      "efeito apenas se aplica para Feitiços que não afetem diretamente a sua energia " +
      "amaldiçoada, como Boogie Woogie ou Nulificação.\n\n" +
      "Ademais, seus golpes também anulam completamente qualquer efeito passivo, ativo, " +
      "sustentado ou duradouro proveniente de Feitiço, desde que tal efeito seja de um nível do " +
      "qual você consiga anular, com o funcionamento básico sendo considerado como um Feitiço de " +
      "primeiro nível. Enquanto estiver com o Revestimento de Domínio ativo você não pode " +
      "utilizar ou estar sob o efeito de qualquer Feitiço.",
    requisitos: [
      { tipo: "trilha", trilha: "cl", valor: 3 },
      { tipo: "trilha", trilha: "dom", valor: 1 },
      { tipo: "nd", valor: 10 },
    ],
  },
  {
    // Requisito CRUZADO: Domínio Simples é de Aptidões Especiais.
    id: "anular_tecnica",
    nome: "Anular Técnica",
    categoria: "dominio",
    descricao:
      "Você aprimora o seu domínio simples para ser efetivo não só contra expansões de domínio, " +
      "mas contra técnicas amaldiçoadas no geral, conseguindo anulá-las se usado rapidamente. " +
      "Quando você for alvo ou submetido a um Feitiço, você pode usar sua reação para tentar " +
      "anulá-la; você só pode tentar anular um Feitiço que seja de um nível que você tem ou teria " +
      "acesso a. Você gasta uma quantidade de energia amaldiçoada igual à que foi usada para " +
      "conjurar a habilidade, e realiza um teste Feitiçaria contra a Feitiçaria de quem usou o " +
      "Feitiço. Caso a habilidade que você deseja anular seja em área, nenhuma das criaturas " +
      "submetidas sofrem o efeito, desde que você a anule. Por ser algo cansativo e complexo, " +
      "você pode usar essa habilidade uma quantidade de vezes igual ao Nível de Aptidão em " +
      "Domínio, por descanso longo.",
    requisitos: [
      { tipo: "aptidao", id: "dominio_simples" },
      { tipo: "trilha", trilha: "dom", valor: 3 },
      { tipo: "nd", valor: 8 },
    ],
  },
  {
    id: "expansao_de_dominio_incompleta",
    nome: "Expansão de Domínio Incompleta",
    categoria: "dominio",
    descricao:
      "Iniciando-se na parte mais complexa do Jujutsu, você passa a ser capaz de expandir o seu " +
      "domínio interno, embora ainda de maneira incompleta. Como uma ação comum, desde que tenhas " +
      "as duas mãos livres, você pode pagar 15PE para expandir seu domínio incompleto, o qual se " +
      "espalha por uma área igual a 4,5 metros multiplicado pelo seu bônus de treinamento, " +
      "adaptando-se também ao ambiente ao seu redor. Enquanto estiver com a expansão ativa, " +
      "certos efeitos são aplicados, os quais devem ser montados de acordo com o Guia de Criação " +
      "de Expansões de Domínio. Uma expansão de domínio incompleta dura, por padrão, uma " +
      "quantidade de rodadas igual a 1 + seu nível de aptidão em domínio.",
    requisitos: [
      { tipo: "trilha", trilha: "dom", valor: 1 },
      { tipo: "nd", valor: 8 },
    ],
  },
  {
    // "Nível de Aptidão em Barreira e Domínio 3" no livro = DUAS trilhas em 3.
    id: "expansao_de_dominio_completa",
    nome: "Expansão de Domínio Completa",
    categoria: "dominio",
    descricao:
      "Aperfeiçoando na técnica da expansão, alcança-se um patamar superior, conseguindo fechar " +
      "uma barreira e prender seus alvos dentro dela. Como uma ação comum, desde que tenhas as " +
      "duas mãos livres, você pode pagar 20PE para expandir seu domínio completo, o qual cria uma " +
      "área esférica de 9 metros. Enquanto estiver com a expansão ativa, certos efeitos são " +
      "aplicados, os quais devem ser montados de acordo com o Guia de Criação de Expansões de " +
      "Domínio. Uma expansão de domínio completa dura, por padrão, uma quantidade de rodadas " +
      "igual a 3 + seu nível de aptidão em domínio.",
    requisitos: [
      { tipo: "aptidao", id: "tecnicas_de_barreira" },
      { tipo: "aptidao", id: "expansao_de_dominio_incompleta" },
      { tipo: "trilha", trilha: "bar", valor: 3 },
      { tipo: "trilha", trilha: "dom", valor: 3 },
      { tipo: "nd", valor: 10 },
    ],
  },
  {
    id: "acerto_garantido",
    nome: "Acerto Garantido",
    categoria: "dominio",
    descricao:
      "Você alcança o ápice das técnicas de domínio, conseguindo usar o acerto garantido, que " +
      "define uma expansão de domínio letal. Ao obter esta aptidão, você pode adicionar o efeito " +
      "Acerto Garantido em sua expansão de domínio, o qual não conta para o máximo, imbuindo sua " +
      "técnica nas barreiras criadas. O funcionamento do Acerto Garantido deve ser elaborado de " +
      "acordo com o guia de criação de domínios. Adicionar acerto garantido em uma expansão " +
      "completa aumenta o seu custo em 5 pontos de energia amaldiçoada.",
    requisitos: [
      { tipo: "aptidao", id: "expansao_de_dominio_completa" },
      { tipo: "nota", label: "Treinamento em Feitiçaria" },
      { tipo: "trilha", trilha: "bar", valor: 4 },
      { tipo: "trilha", trilha: "dom", valor: 4 },
      { tipo: "nd", valor: 14 },
    ],
  },
  {
    id: "expansao_de_dominio_sem_barreiras",
    nome: "Expansão de Domínio sem Barreiras",
    categoria: "dominio",
    descricao:
      "Assim como conter água sem um recipiente ou desenhar no céu sem uma tela, existe uma forma " +
      "de expandir um domínio que exige um controle sobre a energia amaldiçoada extremo, sendo " +
      "possível apenas para os mais talentosos e habilidosos. A expansão sem barreiras possui os " +
      "mesmos efeitos e custo de uma expansão completa com acerto garantido, mas não levanta " +
      "barreiras, tendo um alcance superior para o acerto garantido em troca, o qual pode até " +
      "mesmo superar as barreiras de outras expansões de domínio, atacando-os por fora.",
    requisitos: [
      { tipo: "aptidao", id: "acerto_garantido" },
      { tipo: "nota", label: "Mestre em Feitiçaria" },
      { tipo: "trilha", trilha: "bar", valor: 5 },
      { tipo: "trilha", trilha: "dom", valor: 5 },
      { tipo: "nd", valor: 20 },
    ],
  },

  /* ---------- Aptidões de Maldição (exclusivas) ----------
     Ids com prefixo `mal_`: os nomes repetem os da lista padrão de
     propósito ("Absorção Elemental" existe em Aura com OUTRO texto), e os
     sub-grupos repetem nomes de categorias de topo. O prefixo mantém os
     ids únicos sem mexer nos nomes do livro. */

  /* --- sub-grupo: Anatomia --- */
  {
    id: "mal_composicao_elemental",
    nome: "Composição Elemental",
    categoria: "maldicao",
    subcategoria: "mal_anatomia",
    descricao:
      "Você é composto por um elemento, o qual dita muito sobre sua própria existência. Ao obter " +
      "esta aptidão, você deve escolher um tipo de dano elemental para ser composto. Você recebe " +
      "imunidade ao tipo de dano escolhido e recebe uma vulnerabilidade ao dano oposto, além de " +
      "poder o causar em ataques desarmados ou com armas.",
    requisitos: [],
  },
  {
    id: "mal_absorcao_elemental",
    nome: "Absorção Elemental",
    categoria: "maldicao",
    subcategoria: "mal_anatomia",
    descricao:
      "Você consegue absorver o elemento que o compõe, em prol de se revigorar. Ao receber dano " +
      "do seu elemento escolhido em Composição Elemental, você pode utilizar sua reação para " +
      "receber pontos de vida temporários igual a metade do dano recebido.",
    requisitos: [
      { tipo: "nd", valor: 5 },
      { tipo: "aptidao", id: "mal_composicao_elemental" },
    ],
  },
  {
    id: "mal_armas_naturais",
    nome: "Armas Naturais",
    categoria: "maldicao",
    subcategoria: "mal_anatomia",
    descricao:
      "Visando o combate, sua anatomia desenvolveu armas naturais. Sua arma natural tem um " +
      "formato à sua escolha, e causa 1d8 de dano, de um dos 3 tipos físicos à sua escolha. Você " +
      "pode utilizar tanto força quanto destreza com a sua arma natural. No nível 5 o dano " +
      "aumenta para 1d10; no nível 9 aumenta para 1d12; no nível 13 aumenta para 2d10 e no nível " +
      "17, aumenta para 2d12.",
    requisitos: [],
  },
  {
    id: "mal_armas_naturais_aprimoradas",
    nome: "Armas Naturais Aprimoradas",
    categoria: "maldicao",
    subcategoria: "mal_anatomia",
    descricao:
      "Seu corpo evolui de maneira a aprimorar as suas armas naturais, colocando-as em um " +
      "patamar superior. O dano de suas armas naturais se torna 1d10. No nível 5 o dano aumenta " +
      "para 1d12; no nível 9 aumenta para 2d10; no nível 13 aumenta para 2d12 e no nível 17, " +
      "aumenta para 3d10 Além disso, você recebe um bônus de +1 nível de dano nos níveis 8, 12, " +
      "16 e 20.",
    requisitos: [
      { tipo: "nd", valor: 5 },
      { tipo: "aptidao", id: "mal_armas_naturais" },
    ],
  },
  {
    // ⚠ REPETÍVEL ("a partir do 10° nível você pode obter esta aptidão outra
    // vez"). O modelo não suporta escolher a mesma aptidão 2x. Ver docs.
    id: "mal_crescimento_corporal",
    nome: "Crescimento Corporal",
    categoria: "maldicao",
    subcategoria: "mal_anatomia",
    descricao:
      "Seu corpo cresce e se desenvolve de maneira exacerbada. Ao obter esta aptidão, você " +
      "aumenta uma categoria de tamanho e passa a receber +1 de vida máxima por nível. A partir " +
      "do 10° nível você pode obter esta aptidão outra vez, até a categoria máxima de Enorme, " +
      "caso pegue uma segunda vez não recebe o aumento de vida uma segunda vez.",
    requisitos: [{ tipo: "nd", valor: 5 }],
  },
  {
    id: "mal_olhos_adicionais",
    nome: "Olhos Adicionais",
    categoria: "maldicao",
    subcategoria: "mal_anatomia",
    descricao:
      "Estranhamente, mais olhos começam a surgir em seu corpo, apurando o seu sentido da visão. " +
      "Você recebe seu bônus de treinamento em sua percepção; além disso, sua atenção passa a " +
      "ter como base 12 ao invés de 10.",
    requisitos: [],
  },
  {
    id: "mal_revestimento",
    nome: "Revestimento",
    categoria: "maldicao",
    subcategoria: "mal_anatomia",
    descricao:
      "O seu corpo é coberto por um revestimento, eficaz contra danos físicos. Você recebe RD a " +
      "danos físicos igual ao seu bônus de treinamento.",
    requisitos: [
      { tipo: "nd", valor: 4 },
      { tipo: "atributo", attr: "constituicao", valor: 14 },
    ],
  },
  {
    // ⚠ O livro NÃO lista Revestimento como pré-requisito, embora o texto
    // dependa dele ("A RD ... conferido pela aptidão"). Transcrito verbatim.
    id: "mal_revestimento_evoluido",
    nome: "Revestimento Evoluído",
    categoria: "maldicao",
    subcategoria: "mal_anatomia",
    descricao:
      "O revestimento do seu corpo evolui, aumentando suas capacidades defensivas. A RD a danos " +
      "físicos conferido pela aptidão passam a ser o seu modificador de constituição.",
    requisitos: [
      { tipo: "nd", valor: 10 },
      { tipo: "atributo", attr: "constituicao", valor: 20 },
    ],
  },
  {
    id: "mal_superioridade_fisica",
    nome: "Superioridade Física",
    categoria: "maldicao",
    subcategoria: "mal_anatomia",
    descricao:
      "Seu corpo é adaptado para ser naturalmente superior de maneira marcial, formando-se com " +
      "base nas necessidades de combate. Você recebe seu bônus de treinamento em rolagens de " +
      "atletismo ou acrobacia; além disso, uma vez por rodada, você pode pagar 5PE para receber " +
      "vantagem em uma rolagem de manobra, como agarrar ou empurrar.",
    requisitos: [
      { tipo: "nd", valor: 5 },
      { tipo: "nota", label: "Mestre em Atletismo" },
    ],
  },

  /* --- sub-grupo: Controle e Leitura --- */
  {
    id: "mal_absorcao_amaldicoada",
    nome: "Absorção Amaldiçoada",
    categoria: "maldicao",
    subcategoria: "mal_controle_leitura",
    descricao:
      "Você consegue absorver vestígios de energia deixados por aqueles que manejam ela. Ao " +
      "matar um usuário de energia, você recupera uma quantidade de energia igual a metade do " +
      "seu bônus de treinamento.",
    requisitos: [{ tipo: "nota", label: "Treinamento em Feitiçaria" }],
  },
  {
    id: "mal_estoque_ampliado",
    nome: "Estoque Ampliado",
    categoria: "maldicao",
    subcategoria: "mal_controle_leitura",
    descricao:
      "Reconhecendo bem a essência da energia, devido a sua conexão com ela, você amplia o seu " +
      "estoque. Seu máximo de energia amaldiçoada aumenta em um valor igual ao seu bônus de " +
      "treinamento.",
    requisitos: [{ tipo: "nd", valor: 10 }],
  },
  {
    id: "mal_extracao_de_potencial",
    nome: "Extração de Potencial",
    categoria: "maldicao",
    subcategoria: "mal_controle_leitura",
    descricao:
      "Você foca em extrair o seu potencial de manipulação e controle da energia amaldiçoada, a " +
      "qual o compõe. Caso não possua, você recebe treinamento em Feitiçaria; caso possua, você " +
      "se torna mestre em feitiçaria. Além disso, você recebe uma habilidade de técnica " +
      "adicional, recebendo mais uma no 10° nível.",
    requisitos: [{ tipo: "nd", valor: 5 }],
  },
  {
    id: "mal_protecao_constante",
    nome: "Proteção Constante",
    categoria: "maldicao",
    subcategoria: "mal_controle_leitura",
    descricao:
      "Você constantemente fortalece o seu corpo, gerando uma proteção constante a partir da " +
      "energia que flui. No começo de toda rodada você recebe uma quantidade de pontos de vida " +
      "temporários igual ao seu modificador de Constituição multiplicado pela metade do seu " +
      "bônus de treinamento.",
    requisitos: [
      { tipo: "nd", valor: 10 },
      { tipo: "atributo", attr: "constituicao", valor: 20 },
    ],
  },

  /* --- sub-grupo: Especiais (substituem a Energia Reversa) --- */
  {
    id: "mal_regeneracao_corporal",
    nome: "Regeneração Corporal",
    categoria: "maldicao",
    subcategoria: "mal_especiais",
    descricao:
      "Utilizando de pura energia, você consegue regenerar o seu corpo a partir dela, curando-se " +
      "de ferimentos. Você se torna capaz de gastar pontos de energia para se curar. Como uma " +
      "ação comum, você pode gastar até 2 pontos de energia amaldiçoada para se curar; para cada " +
      "2 pontos gastos, você se cura em 2d6 + seu modificador de constituição ou presença. Nos " +
      "níveis 10, 15 e 20, a cura aumenta em 1d6. A quantidade máxima de pontos que podem ser " +
      "gastos para se curar passa a ser igual ao seu bônus de treinamento por rodada. Você não " +
      "pode curar outras pessoas desta maneira, com a sua energia sendo usada exclusivamente " +
      "para curá-lo.",
    requisitos: [],
  },
  {
    id: "mal_regeneracao_ampliada",
    nome: "Regeneração Ampliada",
    categoria: "maldicao",
    subcategoria: "mal_especiais",
    descricao:
      "Sua capacidade regenerativa foi grandemente ampliada, desenvolvendo-se melhor. O seu dado " +
      "de cura com a Regeneração Corporal aumenta para d8 e você passa a somar o dobro do seu " +
      "modificador de constituição ou presença. A quantidade máxima de pontos que podem ser " +
      "gastos para se curar passa a ser igual ao dobro do seu bônus de treinamento por rodada.",
    requisitos: [
      { tipo: "nd", valor: 10 },
      { tipo: "aptidao", id: "mal_regeneracao_corporal" },
    ],
  },
  {
    id: "mal_regeneracao_maxima",
    nome: "Regeneração Máxima",
    categoria: "maldicao",
    subcategoria: "mal_especiais",
    descricao:
      "Sua capacidade regenerativa é levada ao máximo, demonstrando como você domina a facilidade " +
      "de se regenerar das maldições. O seu dado de cura com a Regeneração Corporal aumenta para " +
      "d10.",
    requisitos: [
      { tipo: "nd", valor: 15 },
      { tipo: "aptidao", id: "mal_regeneracao_ampliada" },
    ],
  },
  {
    id: "mal_regeneracao_de_membros",
    nome: "Regeneração de Membros",
    categoria: "maldicao",
    subcategoria: "mal_especiais",
    descricao:
      "Você se torna capaz de regenerar os seus membros com energia, o que é feito com mais " +
      "facilidade. Você pode, como uma ação comum, gastar 8 pontos de energia amaldiçoada para " +
      "regenerar um membro perdido ou ferida interna.",
    requisitos: [
      { tipo: "nd", valor: 12 },
      { tipo: "aptidao", id: "mal_regeneracao_ampliada" },
    ],
  },
  {
    id: "mal_fluxo_imparavel",
    nome: "Fluxo Imparável",
    categoria: "maldicao",
    subcategoria: "mal_especiais",
    descricao:
      "A energia flui constantemente por todo o seu corpo, ao ponto da sua regeneração ser quase " +
      "imparável. No começo do seu turno, você pode se curar com regeneração corporal como uma " +
      "ação livre. Caso não o faça, você pode se curar como reação ao ter a sua vida reduzida.",
    requisitos: [
      { tipo: "nd", valor: 12 },
      { tipo: "aptidao", id: "mal_regeneracao_corporal" },
    ],
  },
];

const CAT_BY_ID = Object.fromEntries(APTIDAO_CATEGORIAS.map((c) => [c.id, c]));
const BY_ID = Object.fromEntries(AFTY_APTIDOES.map((a) => [a.id, a]));

export const getCategoriaAptidao = (id) => CAT_BY_ID[id] || null;
export const getAptidao = (id) => BY_ID[id] || null;

/** Aptidões de uma categoria, na ordem do catálogo. */
export const aptidoesDaCategoria = (catId) => AFTY_APTIDOES.filter((a) => a.categoria === catId);

/**
 * Aptidões de uma categoria agrupadas por sub-grupo, na ordem do catálogo.
 * Devolve `null` quando a categoria não usa sub-grupo (a UI então lista
 * direto, sem cabeçalho). Hoje só Maldição usa.
 */
export function subgruposDaCategoria(catId) {
  const lista = aptidoesDaCategoria(catId);
  if (!lista.some((a) => a.subcategoria)) return null;
  return APTIDAO_SUBCATEGORIAS
    .map((sub) => ({ sub, aptidoes: lista.filter((a) => a.subcategoria === sub.id) }))
    .filter((g) => g.aptidoes.length > 0);
}

/**
 * Saneia o mapa de níveis da ficha: só as 5 trilhas conhecidas,
 * inteiros de 0 a APTIDAO_NIVEL_MAX. Tolera ficha antiga/parcial.
 */
export function normalizeAptidaoNiveis(aptidoes) {
  const out = {};
  for (const t of APTIDAO_TRILHAS) {
    const n = Math.trunc(Number(aptidoes?.[t.key]) || 0);
    out[t.key] = Math.min(Math.max(n, 0), APTIDAO_NIVEL_MAX);
  }
  return out;
}

/** Níveis de Aptidão gastos = soma das 5 trilhas (1 ponto = 1 nível). */
export function niveisAptidaoGastos(aptidoes) {
  const n = normalizeAptidaoNiveis(aptidoes);
  return APTIDAO_TRILHAS.reduce((s, t) => s + n[t.key], 0);
}

/**
 * Resolve os níveis EFETIVOS por trilha (decisão do autor, 2026-07-16).
 *
 *   efetivo = alocado (pago com orçamento) + concedido (grátis)
 *
 * Concessões vêm de Treinamento, Habilidades de Especialização e
 * Origens, sempre DIRECIONADAS a uma trilha, e não gastam orçamento.
 *
 * O teto de 5 vale para o TOTAL. Quando a concessão não cabe junto do
 * que já foi alocado, o alocado é aparado e os pontos VOLTAM ao
 * orçamento (a concessão tem prioridade) — mesma regra que o bônus de
 * atributo de origem já segue em afty-atributos.js.
 *
 * O aparo é feito na leitura, não gravado na ficha: se a concessão
 * sumir depois (o treino foi desfeito), o nível que o jogador tinha
 * comprado reaparece sozinho.
 *
 * Retorna { alocado, concedido, efetivo, gastos }.
 */
export function resolveNiveisAptidao(aptidoes, concedidoRaw) {
  const aloc = normalizeAptidaoNiveis(aptidoes);
  const concedido = normalizeAptidaoNiveis(concedidoRaw);
  const alocado = {};
  const efetivo = {};
  for (const t of APTIDAO_TRILHAS) {
    const espaco = Math.max(0, APTIDAO_NIVEL_MAX - concedido[t.key]);
    alocado[t.key] = Math.min(aloc[t.key], espaco);
    efetivo[t.key] = alocado[t.key] + concedido[t.key];
  }
  const gastos = APTIDAO_TRILHAS.reduce((s, t) => s + alocado[t.key], 0);
  return { alocado, concedido, efetivo, gastos };
}

const ATTR_LABEL = {
  forca: "Força", destreza: "Destreza", constituicao: "Constituição",
  inteligencia: "Inteligência", sabedoria: "Sabedoria", presenca: "Presença",
};

/**
 * Avalia um requisito de aptidão contra o contexto da ficha
 * (ctx = { niveis, nd, attrEff, escolhidas, origemId }). Espelha
 * avaliarRequisito de afty-treinamentos.js, com `trilha`, `aptidao` e
 * `origem` a mais. Retorna { ok, verificavel, label }.
 */
export function avaliarRequisitoAptidao(requisito, ctx = {}) {
  if (!requisito) return { ok: true, verificavel: true, label: null };

  if (requisito.tipo === "trilha") {
    const niveis = normalizeAptidaoNiveis(ctx.niveis);
    const trilha = APTIDAO_TRILHAS.find((t) => t.key === requisito.trilha);
    // SIGLA, não o nome por extenso. É a convenção do próprio livro: "o qual
    // será descrito apenas com a sigla... você encontrará com ER 1 ou com
    // BAR 3". As chaves do schema já SÃO as siglas (au, cl, bar, dom, er).
    // O nome completo vai no `titulo` (tooltip).
    return {
      ok: (niveis[requisito.trilha] ?? 0) >= requisito.valor,
      verificavel: true,
      label: `${requisito.trilha.toUpperCase()} ${requisito.valor}`,
      titulo: `Nível de Aptidão em ${trilha?.label || requisito.trilha} ${requisito.valor}`,
    };
  }
  if (requisito.tipo === "nd") {
    return { ok: (ctx.nd ?? 0) >= requisito.valor, verificavel: true, label: `Nível ${requisito.valor}` };
  }
  if (requisito.tipo === "atributo") {
    const atual = ctx.attrEff?.[requisito.attr] ?? 0;
    return {
      ok: atual >= requisito.valor,
      verificavel: true,
      label: `${ATTR_LABEL[requisito.attr] || requisito.attr} ${requisito.valor}`,
    };
  }
  if (requisito.tipo === "atributoOr") {
    const melhor = Math.max(...requisito.attrs.map((a) => ctx.attrEff?.[a] ?? 0));
    const nomes = requisito.attrs.map((a) => ATTR_LABEL[a] || a).join(" ou ");
    return { ok: melhor >= requisito.valor, verificavel: true, label: `${nomes} ${requisito.valor}` };
  }
  if (requisito.tipo === "aptidao") {
    const alvo = BY_ID[requisito.id];
    // Referência pendente (a aptidão exigida ainda não foi transcrita):
    // exibe o id cru e NÃO bloqueia, senão a aptidão fica inalcançável.
    if (!alvo) return { ok: true, verificavel: false, label: requisito.id };
    return {
      ok: (ctx.escolhidas || []).includes(requisito.id),
      verificavel: true,
      label: alvo.nome,
    };
  }
  if (requisito.tipo === "origem") {
    const alvo = getOrigem(requisito.id);
    return {
      ok: ctx.origemId === requisito.id,
      verificavel: true,
      label: `Origem: ${alvo?.nome || requisito.id}`,
    };
  }
  // nota (sistema não construído, ex. perícias): exibe, não bloqueia.
  return { ok: true, verificavel: false, label: requisito.label };
}

/**
 * Validador de conteúdo (roadmap: "ids únicos, pré-requisitos
 * apontando para coisas existentes"). Roda nos testes, não no app.
 * Retorna uma lista de strings de erro (vazia = catálogo íntegro).
 */
export function validarCatalogoAptidoes() {
  const erros = [];
  const vistos = new Set();
  const catIds = new Set(APTIDAO_CATEGORIAS.map((c) => c.id));
  const trilhaKeys = new Set(APTIDAO_TRILHAS.map((t) => t.key));

  // Nome repetido ENTRE categorias é legítimo ("Absorção Elemental" existe em
  // Aura e em Maldição, com textos diferentes). Dentro da MESMA categoria é bug.
  const nomesPorCat = {};

  for (const a of AFTY_APTIDOES) {
    if (vistos.has(a.id)) erros.push(`id duplicado: ${a.id}`);
    vistos.add(a.id);
    if (!catIds.has(a.categoria)) erros.push(`${a.id}: categoria inexistente "${a.categoria}"`);
    if (!a.nome || !a.descricao) erros.push(`${a.id}: falta nome ou descricao`);

    const chave = `${a.categoria}::${a.nome}`;
    if (nomesPorCat[chave]) erros.push(`nome duplicado em "${a.categoria}": ${a.nome}`);
    nomesPorCat[chave] = true;

    if (a.subcategoria && !SUB_BY_ID[a.subcategoria]) {
      erros.push(`${a.id}: subcategoria inexistente "${a.subcategoria}"`);
    }

    for (const r of a.requisitos || []) {
      if (r.tipo === "aptidao" && !AFTY_APTIDOES.some((x) => x.id === r.id)) {
        erros.push(`${a.id}: requisito aponta para aptidão inexistente "${r.id}"`);
      }
      if (r.tipo === "trilha" && !trilhaKeys.has(r.trilha)) {
        erros.push(`${a.id}: requisito aponta para trilha inexistente "${r.trilha}"`);
      }
      if (r.tipo === "atributo" && !ATTR_LABEL[r.attr]) {
        erros.push(`${a.id}: requisito aponta para atributo inexistente "${r.attr}"`);
      }
      if (r.tipo === "origem" && !getOrigem(r.id)) {
        erros.push(`${a.id}: requisito aponta para origem inexistente "${r.id}"`);
      }
    }
  }
  return erros;
}

/**
 * Abas de Aptidões Amaldiçoadas, na ordem (decisão do autor, 2026-07-16).
 *
 *   normal:         Aura · Controle e Leitura · Barreira · Domínio · Energia Reversa · Gerais
 *   origem Maldição: Aura · Controle e Leitura · Barreira · Domínio · Maldição · Gerais
 *
 * Maldição OCUPA O LUGAR de Energia Reversa, não se soma a ela: uma
 * maldição não usa energia reversa (é o que a destrói). Por isso as
 * duas nunca aparecem juntas, e Gerais fica sempre no fim.
 */
export function abasAptidao(creature) {
  const ehMaldicao = creature?.core?.origem?.id === "maldicao";
  return APTIDAO_CATEGORIAS
    // Maldição nunca entra pela ordem natural: só pela troca abaixo.
    .filter((c) => c.id !== "maldicao")
    .map((c) => (ehMaldicao && c.id === "energia_reversa" ? CAT_BY_ID.maldicao : c));
}
