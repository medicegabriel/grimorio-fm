import { getBonusTreinamento, getModifier } from "./fm-tables";
import { isRestritoCeleste } from "./fm-origens";

// ============================================================
// fm-aptidoes.js — Catálogo de Aptidões Amaldiçoadas
// ============================================================
// As Aptidões são divididas em categorias (Tipos). Cada categoria
// tem um `accent` pra cor do cabeçalho no seletor. Cada aptidão tem
// `key` (identidade estável), `nome` e `descricao` (texto do livro).
// Requisitos ficam inline na descrição, entre colchetes.
//
// Por enquanto é só apresentação visual (sem automação). O texto
// completo está sendo migrado categoria por categoria — começando
// pelas Aptidões de Aura.
// ============================================================

export const APTIDOES_CATEGORIAS = [
  {
    key: "aura",
    categoria: "Aptidões de Aura",
    accent: "text-purple-300",
    aptidoes: [
      {
        key: "aura_restricao",
        nome: "Aura de Restrição",
        descricao:
          "Com foco em conter, tem-se uma aura mais pesada e densa. Sempre que for agarrar um alvo, você adiciona seu Nível de Aptidão em Aura na rolagem de Atletismo, assim como na rolagem para evitar que uma criatura escape. Uma quantidade de vezes por cena igual ao Nível de Aptidão em Aura, você pode também gastar 1 ponto de energia amaldiçoada para receber vantagem para agarrar ou impor desvantagem na criatura que tentar escapar.",
        computeInfo: (ctx) =>
          `Nível de Aptidão em Aura: ${nivel(ctx, "au")} (somado nas rolagens de Atletismo para agarrar, e usos por cena iguais a esse valor).`,
      },
      {
        key: "aura_rompimento",
        nome: "Aura de Rompimento",
        descricao:
          "Sua aura é afiada, causando danos apenas com o contato. Você pode ativar sua aura lacerante por 1 rodada, como ação livre. Enquanto ativa, uma criatura que iniciar seu turno dentro de 3 metros de você deve realizar um teste de resistência de Fortitude. Em uma falha, ela recebe 1d6 de um tipo de dano à sua escolha (definido na escolha desta aptidão), ignorando resistência e redução de dano. No Nível de Aptidão em Aura 3, o dado aumenta para 2d8. No nível 5, aumenta para 3d10. [Pré-Requisito: ND 8]",
        computeInfo: (ctx) => {
          const au = nivel(ctx, "au");
          const dado = au >= 5 ? "3d10" : au >= 3 ? "2d8" : "1d6";
          return `Dado de dano atual: ${dado} (Nível de Aptidão em Aura ${au}).`;
        },
      },
      {
        key: "aura_general",
        nome: "Aura do General",
        descricao:
          "Refletindo uma personalidade ou presença forte, estar coberto pela sua aura parece ser uma grande motivação para aliados. Você pode, como uma Ação Bônus, expandir sua aura para cobrir todo aliado dentro de 9 metros, os quais recebem 1 + metade do seu Nível de Aptidão em Aura em rolagens de dano e testes de perícia dentro do combate. Para cada turno que você manter a aura ativa, você paga 2 pontos de energia amaldiçoada. [Pré-Requisito: Líder da Horda]",
        computeInfo: (ctx) => {
          const au = nivel(ctx, "au");
          return `Bônus aos aliados: +${1 + Math.floor(au / 2)} em dano e perícia (1 + ½ do Nível de Aptidão em Aura ${au}).`;
        },
      },
      {
        key: "aura_nefasta",
        nome: "Aura Nefasta",
        descricao:
          "Maldita e vil, sua aura é macabra e perturba aqueles que estejam sendo afetados por ela. Toda criatura agressiva que começar um turno dentro de 3 metros de você precisa realizar um teste de resistência de vontade (atributo principal da técnica). Em uma falha, ela fica aterrorizada, podendo repetir o teste no próximo turno dela, deixando de estar aterrorizada em um sucesso. Como uma ação livre, você pode pagar 1 ponto de energia amaldiçoada para expandir esse alcance para 6 metros por 1 rodada.",
      },
    ],
  },
  {
    key: "controle_leitura",
    categoria: "Aptidões de Controle e Leitura",
    accent: "text-sky-300",
    aptidoes: [
      {
        key: "deteccao_amaldicoada",
        nome: "Detecção Amaldiçoada",
        descricao:
          "Treinando e se adaptando a ler rapidamente auras, você adquire uma maior capacidade de prever a próxima ação dos usuários de energia amaldiçoada, o que te favorece não só ofensivamente, mas defensivamente também. Você pode, como uma Ação de Movimento, realizar um teste de Percepção contra a CD Amaldiçoada de uma criatura, recebendo um bônus igual ao seu CL. Caso suceda, você não pode receber desvantagem ou prejuízos para acertar o inimigo enquanto estiver vendo ele, e ignora aumentos de Defesa fornecidos por habilidades ou aptidões durante um turno de combate.",
        computeInfo: (ctx) =>
          `Bônus no teste de Percepção: +${nivel(ctx, "cl")} (igual ao Nível de Aptidão em Controle e Leitura).`,
      },
      {
        key: "estimulo_amaldicoado",
        nome: "Estímulo Amaldiçoado",
        descricao:
          "Você se torna proficiente em utilizar da energia para estimular e reforçar o seu corpo, apurando força e agilidade. Quando realizar uma ação de movimento ou uma ação com as perícias Acrobacia ou Atletismo, você pode, como parte da mesma ação, utilizar energia para os seguintes estímulos:\n\n• Caso seja uma ação de movimento, você pode gastar 1 PE para aumentar a distância em um valor igual a metade do seu deslocamento.\n\n• Caso seja um teste (comum ou oposto), você pode gastar até uma quantidade de PE igual a seu Nível de Aptidão em Controle e Leitura, recebendo um bônus de +1 para cada PE gasto. O bônus dura até o começo do seu próximo turno.",
        computeInfo: (ctx) =>
          `PE máximo no impulso de um teste: ${nivel(ctx, "cl")} (igual ao Nível de Aptidão em Controle e Leitura), com +1 para cada PE gasto.`,
      },
      {
        key: "rastreio_energia",
        nome: "Rastreio de Energia",
        descricao:
          "Você refina e amplia suas capacidades de detectar e rastrear energia amaldiçoada. Quando estiver em uma cena em que energia amaldiçoada tenha sido usada ou deixada (Feitiços, aptidões, presença de maldições), você consegue detectar imediatamente vestígios e, caso já conheça de quem eles originam, você descobre na hora. Caso não conheça, você pode realizar um teste de Investigação ou Percepção contra a CD Amaldiçoada de quem originou o vestígio e, em um sucesso, ignora a invisibilidade e recebe +5 para localizar o alvo.",
      },
    ],
  },
  {
    key: "dominio",
    categoria: "Aptidões de Domínio",
    accent: "text-rose-300",
    aptidoes: [
      {
        key: "acerto_garantido",
        nome: "Acerto Garantido",
        descricao:
          "Você alcança o ápice das técnicas de domínio, conseguindo usar o acerto garantido, que define uma expansão de domínio letal. Ao obter esta aptidão, você pode adicionar o efeito Acerto Garantido em sua expansão de domínio, o qual não conta para o máximo, imbuindo sua técnica nas barreiras criadas. O funcionamento do Acerto Garantido deve ser elaborado de acordo com o guia de criação de domínios. Adicionar acerto garantido em uma expansão completa aumenta o seu custo em 5 pontos de energia amaldiçoada. [Pré-Requisito: Expansão de Domínio Completa, Nível de Aptidão em Barreira e Domínio 4, e Nível 14]",
      },
      {
        key: "modificacao_completa",
        nome: "Modificação Completa",
        descricao:
          "Seu controle sobre os domínios é tão refinado que, mesmo no imediato momento de expandir seu domínio, você consegue o modificar. Ao utilizar uma expansão de domínio, você pode aplicar as seguintes modificações:\n\n• Inversão de Resistência. Você inverte a resistência interna e externa da sua expansão de domínio, conseguindo lidar melhor com ataques que venham de fora. Ao utilizar essa modificação, troque os pontos de vida do lado interno pelos do lado externo.\n\n• Mudança de Tamanho. Você muda e controla o tamanho da expansão. Você pode expandir ou encolher o espaço da expansão. Para cada 1,5m que encolher a expansão, ela recebe 20 pontos de vida adicionais em sua resistência interna e externa. Para cada 1,5m que expandir, a resistência interna e externa diminui em 20 pontos de vida. Uma expansão não pode ser encolhida para menos de 3 metros e nem expandida para mais que o triplo do tamanho comum. Ambas as mudanças de tamanho são consideradas na área da expansão, a qual por padrão é de 9 metros.\n\nAlém disso, a Expansão sem Barreiras possui uma interação única com o Treinamento de Domínios. Caso possua a aptidão amaldiçoada Modificação Completa, ela pode ser usada para, ao utilizar uma expansão sem barreiras, dobrar a área afetada por ela. Não há nenhum custo adicional ou limitação, sendo este apenas o resultado de uma expansão divina e um treinamento completo, permitindo alcançar um espaço próximo ao do próprio Santuário Malevolente, que é capaz de devastar extensas áreas.",
      },
    ],
  },
  {
    key: "barreira",
    categoria: "Aptidões de Barreira",
    accent: "text-amber-300",
    aptidoes: [
      {
        key: "barreira_rapida",
        nome: "Barreira Rápida",
        descricao:
          "Com treino e repetição, você se torna capaz de erguer barreiras de maneira ainda mais ágil. Erguer ou manipular barreiras se torna Ação Livre. [Pré-Requisito: Técnicas de Barreira, Nível de Aptidão em Barreira 3]",
      },
      {
        key: "cesta_oca_vime",
        nome: "Cesta Oca de Vime",
        descricao:
          "Uma antiga e esotérica técnica amaldiçoada utilizada contra domínios, antes mesmo do Domínio Simples ser criado. Como ação bônus ou reação a uma expansão de domínio, você pode gastar 3 PE para criar um trançado de vime ao seu redor e receber os efeitos desta aptidão. Enquanto estiver com a Cesta Oca de Vime ativa, você não é afetado pelo efeito de acerto garantido de uma expansão de domínio. Esta aptidão usa de Concentração e possui Durabilidade igual ao seu Nível de BAR + 1. Sempre que falhar em um teste de concentração, a Durabilidade da sua Cesta Oca de Vime desce em 1. No início do seu turno, caso você tenha sido atingido por um Acerto Garantido, sua Cesta Oca de Vime perde 1 de durabilidade. No início do seu turno, você pode manter o selo desta aptidão, ocupando as suas duas mãos. Ao fazer isso, a Cesta Oca de Vime não pode perder durabilidade por qualquer efeito que não seja a falha de concentração. Caso a Cesta Oca de Vime quebre, você recebe o efeito do Acerto Garantido instantaneamente. [Pré-Requisito: Nível de Aptidão em Barreira 1 e Nível 5]",
        computeInfo: (ctx) =>
          `Durabilidade da Cesta: ${nivel(ctx, "bar") + 1} (Nível de Aptidão em Barreira ${nivel(ctx, "bar")} + 1).`,
      },
      {
        key: "cortina",
        nome: "Cortina",
        descricao:
          "A cortina é uma técnica de barreira comum, sendo um grande campo de força negro que isola uma área específica, impossibilitando pessoas de fora de ver seu interior. Seu funcionamento básico é de ocultamento, mas podem ser postas condições que expandem sua utilidade. Ao criar uma cortina, você gasta 1 ponto de energia para cada 9 metros que a área dela irá cobrir, e não há um custo para mantê-la. Você também pode colocar condições em uma cortina, ao criá-la, de acordo com as regras sobre cortinas. [Pré-Requisito: Técnicas de Barreira]",
      },
      {
        key: "tecnicas_barreira",
        nome: "Técnicas de Barreira",
        descricao:
          "Você se torna capaz de erguer e manipular barreiras, as quais podem ser usadas para defender o usuário ou prender oponentes. Você pode criar, como uma Ação Livre, até 6 paredes ao seu redor, com cada parede custando 1 ponto de energia amaldiçoada. Cada parede erguida tem 1,5 metros de tamanho, e vida igual a 15 + seu Nível de Aptidão em Barreiras multiplicado por metade do seu ND. Podem servir tanto como obstáculo como uma maneira de prender seus inimigos. Você pode as manipular e mover usando outra Ação Livre. [Pré-Requisito: Nível de Aptidão em Barreira 1]",
        computeInfo: (ctx) => {
          const bar = nivel(ctx, "bar");
          const nd = ndOf(ctx);
          return `Vida de cada parede: ${15 + bar * Math.floor(nd / 2)} (15 + Nível de Aptidão em Barreira ${bar} × ½ do ND ${nd}).`;
        },
      },
    ],
  },
  {
    key: "especiais",
    categoria: "Aptidões Especiais",
    accent: "text-fuchsia-300",
    aptidoes: [
      {
        key: "raio_negro",
        nome: "Raio Negro",
        descricao:
          "O raio negro (ou kokusen) é um fenômeno no jujutsu, onde o golpe de um feiticeiro é altamente amplificado devido a uma distorção no espaço que ocorre quando a energia amaldiçoada é aplicada 0.000001 segundos antes dele acertar. Quando um feiticeiro o acerta, sua energia brilha em negro e o poder destrutivo é maior. Usar o kokusen também aumenta a compreensão da energia amaldiçoada permanentemente. Todos os efeitos da habilidade são:\n\n• Raio Negro. Usar o Kokusen não é algo consciente, ocorrendo apenas em certos momentos. Quando tirar 20 em uma rolagem de ataque corpo-a-corpo, o seu golpe é coberto por raios negros, utilizando o Kokusen. Um golpe com Kokusen causa dano adicional igual a metade do total obtido na rolagem do dano (1.5x). O Dano Após Ataque é aplicado após o Kokusen. Além disso, ele ignora qualquer tipo de resistência ou redução de danos.\n\n• Estado de Consciência Absoluta. Após usar os raios negros, um feiticeiro adentra em um estado de foco, onde torna-se mais fácil acertar golpes, extraindo 120% de seu potencial. Durante 1 rodada, após conseguir um kokusen, o valor necessário para o kokusen reduzirá em um. Caso acerte outro kokusen, a duração será renovada e o valor necessário reduzirá novamente. Ele pode ser reduzido uma quantidade de vezes igual a metade do seu Nível de Aptidão em Controle e Leitura. [Pré-Requisito: Nível de Aptidão em Controle e Leitura 3, Força ou Destreza 16 e ND 10 Desafio ou ND 8 Calamidade]",
        computeInfo: (ctx) =>
          `Reduções no Estado de Consciência Absoluta: ${Math.floor(nivel(ctx, "cl") / 2)} por rodada (½ do Nível de Aptidão em Controle e Leitura).`,
      },
      {
        key: "abencoado_faiscas_negras",
        nome: "Abençoado pelas Faíscas Negras",
        descricao:
          "Embora o raio negro seja algo incontrolável, você se foca tanto nisso que parece começar a conseguir cativar as faíscas negras, as quais te abençoam. Você passa a usar o kokusen, por padrão, em um 19 e em um 20 no dado. Ao estar em Estado de Consciência Absoluta, você pode reduzir o valor necessário para Kokusen 1 vez a mais. [Pré-Requisito: Raio Negro, Nível de Aptidão em Controle e Leitura 3]",
      },
      {
        key: "tecnica_maxima",
        nome: "Técnica Máxima",
        descricao:
          "Dentre os feiticeiros jujutsu, existe a possibilidade de levar o potencial da sua técnica ao máximo, criando uma habilidade definitiva a partir dela. É uma arte suprema, com grande complexidade e necessidade de conhecimento sobre a própria técnica. Ao obter esta habilidade, você se torna capaz de criar uma Técnica Máxima: você recebe um novo Feitiço o qual é indefensável. Uma Técnica Máxima custa 20 PE e, após ser usada, você deve esperar uma quantidade de rodadas igual a 4. A técnica máxima ignora resistência e redução de dano. [Pré-Requisito: Mestre em Feitiçaria e ser no mínimo ND 15 Desafio, Comum ou ND 10 Calamidade]",
        tabela: {
          titulo: "Dados de Dano adicionais por Patamar",
          colunas: ["Patamar", "Técnica Máxima"],
          linhas: [
            ["Lacaio", "Não recebe nada"],
            ["Capanga", "Não recebe nada"],
            ["Comum", "Não recebe nada"],
            ["Desafio", "+5 dados de dano no dano padrão da técnica"],
            ["Calamidade", "+7 dados de dano no dano padrão da técnica"],
          ],
        },
      },
      {
        key: "reversao_tecnica",
        nome: "Reversão de Técnica",
        descricao:
          "Em um processo complexo, você passa a ser capaz de utilizar energia reversa para abastecer a sua técnica, possibilitando assim um efeito contrário ao padrão e com maior potência. Quando obtiver um novo Feitiço, você pode escolher criar uma Reversão de Técnica no lugar: uma Reversão tem o seu custo aumentado em um valor igual ao nível do Feitiço e deve, também, ser criada como algo que reverte o conceito da sua técnica (o Vermelho, Reversão de Técnica do Ilimitado, empurra ao invés de puxar). Ao obter esta aptidão, você recebe um Feitiço adicional, o qual obrigatoriamente deve ser uma reversão. [Pré-Requisito: Ser feiticeiro, ser no mínimo ND 10 Desafio, Comum ou ND 8 Calamidade]",
      },
      {
        key: "energia_reversa",
        nome: "Energia Reversa",
        descricao:
          "Define a capacidade de um feiticeiro se curar a partir da conversão de energia amaldiçoada para energia reversa.\n\nCurar é uma ação Rápida ou Comum. Para cada vez que se curar, a criatura deve pagar 2 pontos de energia amaldiçoada. Para Regenerar um Membro deve ser pago 10 pontos de energia por Membro, ou 8 pontos de energia para Ferida Interna.",
        computeInfo: (ctx) => {
          const patamar = ctx?.core?.patamar;
          const bt = btOf(ctx);
          const modCon = modConOf(ctx);
          // Multiplicador do BT por Patamar (null = não recebe cura nesta faixa).
          let mult = null;
          if (patamar === "capanga") mult = bt >= 4 ? bt : null;
          else if (patamar === "comum") mult = bt <= 2 ? null : bt <= 4 ? bt : bt === 5 ? bt * 1.5 : bt * 2;
          else if (patamar === "desafio" || patamar === "calamidade") mult = bt <= 2 ? null : bt === 3 ? bt : bt === 4 ? bt * 1.5 : bt * 2;
          if (mult == null) {
            return `Cura por ação: esta criatura não recebe cura por esta aptidão (Patamar e BT +${bt} atuais).`;
          }
          const cura = Math.max(0, Math.floor(modCon * mult));
          return `Cura por ação (2 PE): ${cura} PV (Mod Con ${modCon} × ${Number.isInteger(mult) ? mult : mult.toFixed(1)}, com BT +${bt}).`;
        },
        tabela: {
          titulo: "Cura por Patamar × Bônus de Treinamento (Mod Con = modificador de Constituição)",
          colunas: ["Patamar", "BT +2", "BT +3", "BT +4", "BT +5", "BT +6"],
          linhas: [
            ["Lacaio", "Não recebe", "Não recebe", "Não recebe", "Não recebe", "Não recebe"],
            ["Capanga", "Não recebe", "Não recebe", "Mod Con × BT", "Mod Con × BT", "Mod Con × BT"],
            ["Comum", "Não recebe", "Mod Con × BT", "Mod Con × BT", "Mod Con × (BT × 1,5)", "Mod Con × (BT × 2)"],
            ["Desafio", "Não recebe", "Mod Con × BT", "Mod Con × (BT × 1,5)", "Mod Con × (BT × 2)", "Mod Con × (BT × 2)"],
            ["Calamidade", "Não recebe", "Mod Con × BT", "Mod Con × (BT × 1,5)", "Mod Con × (BT × 2)", "Mod Con × (BT × 2)"],
          ],
        },
      },
      {
        key: "cura_exaustao",
        nome: "Cura de Exaustão",
        descricao:
          "Você se torna capaz de curar sua exaustão de técnica ao custo de 8 PE. [Pré-Requisito: Energia Reversa ou Regeneração Corporal]",
      },
      {
        key: "fluxo_imparavel",
        nome: "Fluxo Imparável",
        descricao:
          "A energia flui constantemente por todo o seu corpo, ao ponto da sua regeneração ser quase imparável. No começo do seu turno, você pode se curar com regeneração corporal como uma ação livre. Caso não o faça, você pode se curar como reação ao ter a sua vida reduzida. [Pré-Requisito: ND 12 Desafio ou Calamidade, Energia Reversa ou Regeneração Corporal]",
      },
    ],
  },
  {
    key: "anatomia",
    categoria: "Aptidões de Anatomia",
    accent: "text-emerald-300",
    aptidoes: [
      {
        key: "absorcao_elemental",
        nome: "Absorção Elemental",
        descricao:
          "Você consegue absorver o elemento que o compõe, em prol de se revigorar. Ao receber dano do seu elemento escolhido em Composição Elemental, você pode utilizar sua reação para receber pontos de vida temporários igual a metade do dano recebido. [Pré-Requisito: Ter um elemento como funcionamento básico, Composição Elemental]",
      },
      {
        key: "arma_natural",
        nome: "Arma Natural",
        descricao:
          "Com uma fisionomia estranha, você possui garras, dentes afiados, cauda ou outro apêndice corporal próprio para ataques. Você recebe um ataque natural que causa 1d8 de dano Cortante, Perfurante ou de Impacto com os traços Fineza e Enérgica. Esta arma natural conta como um ataque desarmado e se beneficia de efeitos que afetariam ataques desarmados. Caso seu dano desarmado seja superior ao da arma natural, ao invés disso aumente o seu dano desarmado em 1 nível.",
      },
      {
        key: "articulacoes_extensas",
        nome: "Articulações Extensas",
        descricao:
          "Suas juntas são mais longas, ou suas garras são estendidas, aumentando a distância com que pode atacar. O alcance dos seus ataques corpo a corpo aumenta em 1,5 metros.",
      },
      {
        key: "bracos_extras",
        nome: "Braços Extras",
        descricao:
          "Seu corpo possui um par de braços adicionais. Você recebe +2 em testes de prestidigitação e, se tiver pelo menos duas mãos livres, aplica esse bônus em testes de atletismo. Você também recebe um par adicional de mãos, permitindo equipar dois equipamentos de uma mão ou um equipamento de duas mãos adicional, assim como agarrar duas criaturas e outros benefícios à discrição do Narrador.",
        // +2 em Prestidigitação (sempre). O +2 em Atletismo é condicional a ter
        // duas mãos livres, então fica como info (não automatizado).
        automation: { kind: "stat_bonus", skills: { prestidigitacao: { base: 2 } } },
      },
      {
        key: "composicao_elemental",
        nome: "Composição Elemental",
        descricao:
          "Você é composto por um elemento, o qual dita muito sobre sua própria existência. Ao obter esta aptidão, você deve escolher um tipo de dano elemental para ser composto: você recebe imunidade ao tipo de dano escolhido, além de poder causá-lo em ataques desarmados ou com arma. [Pré-Requisito: Ter um elemento como funcionamento básico]",
        // Sub-escolha do elemento + grant de imunidade a esse tipo de dano.
        automation: {
          kind: "imunidade_grant",
          label: "Elemento",
          options: [
            { value: "ácido", label: "Ácido" },
            { value: "congelante", label: "Congelante" },
            { value: "chocante", label: "Chocante" },
            { value: "queimante", label: "Queimante" },
            { value: "sônico", label: "Sônico" },
          ],
        },
      },
      {
        key: "corpo_especializado",
        nome: "Corpo Especializado",
        descricao:
          "Seu corpo se desenvolve de maneira a possuir um foco. Escolha uma perícia: você recebe um bônus de 1d4 nela.",
        // Sub-escolha da perícia (entre as perícias da criatura). O +1d4 fica
        // como info (não temos dado em perícia), então não leva badge.
        automation: { kind: "sub_choice", label: "Perícia", optionsFromSkills: true },
      },
      {
        key: "desenvolvimento_exagerado",
        nome: "Desenvolvimento Exagerado",
        descricao:
          "Seu corpo se desenvolve de maneira exagerada, ultrapassando o formato e o porte padrão. Você aumenta sua categoria de tamanho em 1 e recebe 1 ponto de vida adicional por nível.",
        automation: { kind: "hp_per_level", porNivel: 1 },
      },
      {
        key: "olhos_adicionais",
        nome: "Olhos Adicionais",
        descricao:
          "Estranhamente, mais olhos começam a surgir em seu corpo, apurando o seu sentido da visão. Você recebe um bônus de +2 em Percepção, o qual aumenta em +1 nos níveis 5, 10, 15 e 20. Além disso, sua atenção passa a ter como base 12 ao invés de 10.",
        // Atenção +2 (base 12 vs 10) e Percepção +2 escalando. Igual ao Sentidos
        // Afiados, o bônus de Percepção também alimenta a Atenção (que segue a
        // perícia Percepção no derive).
        automation: {
          kind: "stat_bonus",
          atencao: 2,
          skills: { percepcao: { base: 2, escalaNiveis: [5, 10, 15, 20] } },
        },
      },
      {
        key: "pernas_extras",
        nome: "Pernas Extras",
        descricao:
          "No seu corpo cresce um par de pernas extras. Seu deslocamento aumenta em 1,5 metros para cada 2 pontos no seu modificador de destreza e você passa a ignorar terreno difícil que esteja no solo.",
        automation: { kind: "deslocamento_per_dex", metrosPor2Dex: 1.5 },
      },
    ],
  },
];

// Mapas planos (com a categoria embutida) para busca rápida.
const _flat = APTIDOES_CATEGORIAS.flatMap((cat) =>
  cat.aptidoes.map((a) => ({ ...a, categoria: cat.categoria }))
);
const APTIDAO_BY_NOME = Object.fromEntries(_flat.map((a) => [a.nome, a]));
const APTIDAO_BY_KEY = Object.fromEntries(_flat.filter((a) => a.key).map((a) => [a.key, a]));

export const getAptidaoByNome = (nome) => APTIDAO_BY_NOME[nome] ?? null;
export const getAptidaoByKey = (key) => APTIDAO_BY_KEY[key] ?? null;

// Aptidão que destrava as propriedades de Técnica Máxima nas Ações
// (Indefensável / Ignora RD / Recarga).
export const TECNICA_MAXIMA_KEY = "tecnica_maxima";

/** True se a ficha possui a Aptidão Amaldiçoada "Técnica Máxima". */
export function hasTecnicaMaxima(aptidoesEspeciais = []) {
  return (aptidoesEspeciais || []).some(
    (a) => a.key === TECNICA_MAXIMA_KEY || a.nome === "Técnica Máxima"
  );
}

/**
 * Descrição resolvida no contexto da ficha. Aptidões com `computeInfo`
 * (cálculos básicos: cura, dados, bônus por Nível de Aptidão) ganham uma
 * linha extra com o valor calculado — sem virar automação na ficha.
 * ctx = { core, attributes, aptidoes } (aptidoes = níveis AU/CL/BAR/DOM/ER).
 */
export function resolveAptidaoDescription(apt, ctx = {}) {
  if (!apt) return "";
  let texto = apt.descricao;
  // Valor calculado (cura, dados, bônus por Nível de Aptidão).
  const extra = typeof apt.computeInfo === "function" ? apt.computeInfo(ctx) : null;
  if (extra) texto = `${texto}\n\n${extra}`;
  // Sub-escolha (elemento da Composição, perícia do Corpo Especializado).
  const auto = apt.automation;
  const isSub = auto && (auto.kind === "sub_choice" || auto.kind === "imunidade_grant");
  if (isSub && ctx.subChoice) {
    const opt = (auto.options || []).find((o) => o.value === ctx.subChoice);
    texto = `${texto}\n\n${auto.label || "Escolha"}: ${opt ? opt.label : ctx.subChoice}.`;
  }
  return texto;
}

// Helpers de contexto para os computeInfo (níveis de aptidão, BT, mod Con).
const nivel = (ctx, slot) => Number(ctx?.aptidoes?.[slot]) || 0;
const ndOf = (ctx) => Number(ctx?.core?.nd) || 0;
const btOf = (ctx) => getBonusTreinamento(ndOf(ctx));
const modConOf = (ctx) => getModifier(ctx?.attributes?.constituicao ?? 10);

// ============================================================
// HELPERS DE AUTOMAÇÃO
// ============================================================
// Resolve as entradas oficiais do catálogo a partir das aptidões do draft
// (custom são ignoradas — não têm automação conhecida).
const officialAptidaoEntries = (aptidoes = []) =>
  aptidoes
    .map((a) => {
      if (a.tipo === "custom") return null;
      return a.key ? APTIDAO_BY_KEY[a.key] : APTIDAO_BY_NOME[a.nome];
    })
    .filter(Boolean);

/** Bônus de deslocamento (m) das aptidões: ex. Pernas Extras = 1,5m por 2 de mod. Destreza. */
export function getAptidoesDeslocamentoBonus(aptidoes = [], modDex = 0) {
  const steps = Math.floor((Number(modDex) || 0) / 2);
  if (steps <= 0) return 0;
  return officialAptidaoEntries(aptidoes).reduce((sum, a) => {
    if (a.automation?.kind !== "deslocamento_per_dex") return sum;
    return sum + (a.automation.metrosPor2Dex || 0) * steps;
  }, 0);
}

/** Bônus fixo de Atenção das aptidões (ex.: Olhos Adicionais = +2 "base 12"). */
export function getAptidoesAtencaoBonus(aptidoes = []) {
  return officialAptidaoEntries(aptidoes).reduce(
    (sum, a) => (a.automation?.kind === "stat_bonus" ? sum + (a.automation.atencao || 0) : sum),
    0
  );
}

/**
 * Bônus das aptidões para uma perícia (nome normalizado, sem acento/caixa).
 * Cada aptidão define automation.skills[nome] = { base, escalaNiveis }, somando
 * `base` + 1 para cada nível em escalaNiveis já alcançado pelo ND. Ex.: Olhos
 * Adicionais em Percepção (+2 escalando), Braços Extras em Prestidigitação (+2).
 */
export function getAptidoesSkillBonus(aptidoes = [], skillNorm = "", nd = 0) {
  const ndNum = Number(nd) || 0;
  return officialAptidaoEntries(aptidoes).reduce((sum, a) => {
    if (a.automation?.kind !== "stat_bonus") return sum;
    const def = a.automation.skills?.[skillNorm];
    if (!def) return sum;
    const escala = (def.escalaNiveis || []).filter((n) => ndNum >= n).length;
    return sum + (def.base || 0) + escala;
  }, 0);
}

/** Bônus de HP máximo por nível (ex.: Desenvolvimento Exagerado = +1 PV por ND). */
export function getAptidoesHpBonus(aptidoes = [], nd = 0) {
  const ndNum = Number(nd) || 0;
  return officialAptidaoEntries(aptidoes).reduce(
    (sum, a) => (a.automation?.kind === "hp_per_level" ? sum + (a.automation.porNivel || 0) * ndNum : sum),
    0
  );
}

// Kinds que ganham o badge "Programada" (alteram a ficha). sub_choice (Corpo
// Especializado) não altera valor derivado, então não leva badge.
const BADGED_APTIDAO_KINDS = new Set([
  "stat_bonus", "hp_per_level", "deslocamento_per_dex", "imunidade_grant",
]);

/** True se a aptidão oficial tem automação programada na ficha (badge "Programada"). */
export function isAutomatedAptidao(aptidao) {
  return BADGED_APTIDAO_KINDS.has(aptidao?.automation?.kind);
}

/** Avisos para aptidões com sub-escolha obrigatória ainda não definida. */
export function getAptidaoSubChoiceWarnings(aptidoes = []) {
  const out = [];
  for (const a of aptidoes) {
    if (a.tipo === "custom") continue;
    const cat = a.key ? APTIDAO_BY_KEY[a.key] : APTIDAO_BY_NOME[a.nome];
    const auto = cat?.automation;
    const isSub = auto && (auto.kind === "sub_choice" || auto.kind === "imunidade_grant");
    if (isSub && !a.subChoice) {
      out.push({
        nome: cat.nome,
        message: `${cat.nome}: escolha ${auto.label ? auto.label.toLowerCase() : "uma opção"}.`,
      });
    }
  }
  return out;
}

/** Imunidades a tipo de dano concedidas por aptidões (Composição Elemental). */
export function getAptidoesImunidadesGrant(aptidoes = []) {
  const out = [];
  for (const a of aptidoes) {
    if (a.tipo === "custom") continue;
    const cat = a.key ? APTIDAO_BY_KEY[a.key] : APTIDAO_BY_NOME[a.nome];
    if (cat?.automation?.kind === "imunidade_grant" && a.subChoice) {
      out.push({ tipo: a.subChoice, aptidaoKey: cat.key });
    }
  }
  return out;
}

/**
 * Limite base de Aptidões Amaldiçoadas: uma a cada nível par (floor(ND/2)).
 * Lacaios e Capangas não recebem aptidões. Apenas o Restrito Celeste "puro"
 * não recebe — a Restrição de Corpo por Energia recebe normalmente. Bônus
 * extras (ex.: Frutos da Experiência "+2 Aptidões") são somados no chamador.
 */
export function getAptidaoLimit(core) {
  const patamar = core?.patamar;
  if (patamar === "lacaio" || patamar === "capanga") return 0;
  if (isRestritoCeleste(core)) return 0;
  return Math.max(0, Math.floor((Number(core?.nd) || 0) / 2));
}
