/**
 * ============================================================
 * CARACTERÍSTICAS DE ANATOMIA: Feto Amaldiçoado Híbrido
 * ============================================================
 * Catálogo escolhido pela característica "Físico Amaldiçoado"
 * (1 no início + 1 a cada 5 níveis). Toda origem que declara `poolAnatomia`
 * escolhe deste mesmo catálogo: a Kitsune da Yna e a Aberração Humanizada
 * também. Quem vale para a ficha é `anatomiasEscolhidas` em afty-origens.js.
 *
 * DOIS TEXTOS por entrada, e cada um tem um leitor só (autor, 2026-10-03):
 *   • `descricao` é o RESUMO que o criador mostra na lista de 15 botões, onde o
 *     texto inteiro viraria uma parede.
 *   • `textoLivro` é o texto do livro (Livro de Regras 2.5.2, p. 35 e 36), e é
 *     o que a Ficha Final mostra. A Ficha promete o texto do livro sem uma
 *     vírgula mexida, e o resumo quebraria essa promessa.
 *
 * O número mora no Motor (`ANATOMIA_EFEITOS` em afty-efeitos-conteudo.js).
 * ============================================================
 */

export const ANATOMIAS = [
  {
    id: "alma_maldita", nome: "Alma Maldita",
    descricao: "Dano à sua alma é reduzido à metade antes do teste de Integridade; a partir do nível 15, é anulado. Funciona 2×/dia (3 no nv6, 4 no nv12, 5 no nv18).",
    textoLivro: "Sua alma é impregnada com energia amaldiçoada, assumindo um aspecto maldito e difícil de se alterar. Quando uma criatura for causar dano na sua alma, esse dano é reduzido à metade antes do teste de Integridade; a partir do nível 15, ele é anulado. Essa habilidade funciona 2 vezes por dia, 3 no nível 6, 4 no nível 12 e 5 no nível 18.",
  },
  {
    id: "anatomia_incompreensivel", nome: "Anatomia Incompreensível",
    descricao: "25% (1 em 1d4) de ignorar o dano adicional de crítico ou furtivo; 50% (1–2 em 1d4) no nível 15.",
    textoLivro: "O seu corpo tem uma forma que é difícil de compreender. Você tem 25% de chance (resultado \"1\" em 1d4) de ignorar o dano adicional de um ataque crítico ou um ataque furtivo. No nível 15, se torna 50% (resultado \"1 ou 2\" em 1d4).",
  },
  {
    id: "arma_natural", nome: "Arma Natural",
    descricao: "Ataque natural 1d8 (Cortante/Perfurante/Impacto) com Fineza e Enérgica; conta como desarmado. Se o desarmado for maior, aumente-o em 1 nível.",
    textoLivro: "Com uma fisionomia estranha, você possui garras, dentes afiados, cauda ou outro apêndice corporal próprio para ataques. Você recebe um ataque natural que causa 1d8 de dano Cortante, Perfurante ou de Impacto com os traços: Fineza e Enérgica. Esta arma natural conta como um ataque desarmado e se beneficia de efeitos que afetariam ataques desarmados. Caso seu dano desarmado seja superior ao da arma natural, ao invés disso aumente o seu dano desarmado em 1 nível.",
  },
  {
    id: "articulacoes_extensas", nome: "Articulações Extensas",
    descricao: "Alcance dos ataques corpo a corpo +1,5 m.",
    textoLivro: "Suas juntas são mais longas, ou suas garras são estendidas, aumentando a distância com que pode atacar. O alcance dos seus ataques corpo a corpo aumenta em 1,5 metros.",
  },
  {
    id: "bracos_extras", nome: "Braços Extras",
    descricao: "+2 em prestidigitação (e atletismo com 2 mãos livres); par de mãos extra (2 armas de 1 mão ou +1 de 2 mãos; agarrar 2 criaturas).",
    textoLivro: "Seu corpo possui um par de braços adicionais. Você recebe +2 em testes de prestidigitação e, se tiver pelo menos duas mãos livres, aplica esse bônus em testes de atletismo. E recebe um par adicional de mãos, permitindo você equipar dois equipamentos de uma mão ou um equipamento de duas mãos adicional, assim como agarrar duas criaturas e outros benefícios à discrição do Narrador.",
  },
  {
    id: "capacidade_voo", nome: "Capacidade de Voo",
    descricao: "Ação livre, 1 PE: converte Deslocamento de Caminhada em Voo por 1 rodada.",
    textoLivro: "No seu corpo repousa uma capacidade de voo, que com um estímulo de energia se torna ativa. Como uma ação livre, você pode gastar 1 ponto de energia para transformar seu Deslocamento de Caminhada em Deslocamento de Voo por uma rodada.",
  },
  {
    id: "carapaca_mutante", nome: "Carapaça Mutante",
    descricao: "RD contra dano físico igual ao bônus de treinamento; no nível 10, resistência a um tipo de dano físico à escolha (permanente).",
    textoLivro: "Uma carapaça cobre o seu corpo, sendo uma mutação bizarra, mas resistente. Você recebe redução de dano contra danos físicos igual ao seu bônus de treinamento; no nível 10, você recebe resistência a um tipo de dano físico à sua escolha. Depois de feita essa escolha não pode ser mudada.",
  },
  {
    id: "corpo_especializado", nome: "Corpo Especializado",
    descricao: "Escolha uma perícia: +1d4 nela.",
    textoLivro: "Seu corpo se desenvolve de maneira a possuir um foco. Escolha uma perícia: você recebe um bônus de 1d4 nela.",
  },
  {
    id: "desenvolvimento_exagerado", nome: "Desenvolvimento Exagerado",
    descricao: "+1 categoria de tamanho; +1 PV por nível.",
    textoLivro: "Seu corpo se desenvolve de maneira exagerada, ultrapassando o formato e o porte padrão. Você aumenta sua categoria de tamanho em 1 e recebe 1 ponto de vida adicional por nível.",
  },
  {
    id: "devorador_energia", nome: "Devorador de Energia",
    descricao: "Ao passar num TR contra um Feitiço, ganha 1 PE temporário cumulativo.",
    textoLivro: "Sendo envolvido com a própria energia, você pode a devorar quando resiste a uma habilidade originada dela. Quando passar em um teste de resistência para resistir a um Feitiço, você recebe 1 ponto de energia temporário cumulativo.",
  },
  {
    id: "instinto_sanguinario", nome: "Instinto Sanguinário",
    descricao: "Soma o bônus de treinamento na Iniciativa; em combate, também na Atenção.",
    textoLivro: "Em sua essência há um instinto por sangue e violência. Você adiciona o seu bônus de treinamento na sua Iniciativa; enquanto em uma cena de combate, você também adiciona seu bônus de treinamento na sua Atenção.",
  },
  {
    id: "olhos_sombrios", nome: "Olhos Sombrios",
    descricao: "Visão no Escuro; treinado em Percepção com +2; no nível 12 ignora escuridão Leve e Total.",
    textoLivro: "Seus olhos guardam escuridão, sendo sombrios por natureza e aguçados. Você recebe Visão no Escuro (p.297). Além disso, você se torna treinado em Percepção e recebe um bônus de +2 em rolagens com a perícia. No 12º nível você passa a ignorar completamente efeitos de escuridão Leve e Total.",
  },
  {
    id: "pernas_extras", nome: "Pernas Extras",
    descricao: "Deslocamento +4,5 m; ignora terreno difícil no solo.",
    textoLivro: "No seu corpo cresce um par de pernas extras. Seu deslocamento aumenta em 4,5 metros e você passa a ignorar terreno difícil que esteja no solo.",
  },
  {
    id: "presenca_nefasta", nome: "Presença Nefasta",
    descricao: "Criatura hostil que o vê pela 1ª vez faz TR de Vontade vs sua CD; falha = amedrontada 1 rodada, sucesso = abalada 1 rodada.",
    textoLivro: "Com um semblante vil, a sua própria presença é nefasta. Toda criatura hostil, ao vê-lo pela primeira vez, deve realizar um teste de resistência de Vontade contra sua CD Amaldiçoada. Em uma falha, ela fica amedrontada por uma rodada. Em um sucesso, ela consegue lidar parcialmente com a sua presença, ficando abalada por uma rodada.",
  },
  {
    id: "sangue_toxico", nome: "Sangue Tóxico",
    descricao: "Ao sofrer dano de ataque corpo a corpo, o atacante perde vida igual ao seu mod. de Constituição.",
    textoLivro: "O seu sangue é tóxico, capaz de corroer o que entra em contato com. Sempre que sofrer dano de um ataque corpo a corpo, o atacante perde vida igual ao seu modificador de Constituição.",
  },
];

const BY_ID = Object.fromEntries(ANATOMIAS.map((a) => [a.id, a]));
export const getAnatomia = (id) => BY_ID[id] ?? null;

// Quantas anatomias a criatura tem: 1 no início + 1 a cada 5 níveis.
export const anatomiaTotal = (nd) => 1 + Math.floor((nd ?? 1) / 5);
