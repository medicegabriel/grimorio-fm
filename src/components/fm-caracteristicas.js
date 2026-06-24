import { getBonusTreinamento, getModifier } from "./fm-tables";

// ============================================================
// fm-caracteristicas.js — Catálogo de Características Gerais e Especiais
// ============================================================
// As Características servem como base mecânica: facilitam a comparação
// entre criaturas e são usadas constantemente em combate e testes.
//
// São divididas em dois Tipos: Gerais e Especiais. Cada categoria tem
// um `accent` pra cor do cabeçalho no seletor. Cada característica tem
// `key` (identidade estável), `nome` e `descricao` (texto do livro).
// Requisitos/exclusividades ficam inline na descrição, entre colchetes.
//
// Automação (espelha fm-aptidoes/fm-dotes):
//  - `computeInfo(ctx)`  → linha com valor calculado (BT/ND/Grau/mods),
//    SEM badge "Programada" (não altera a ficha, só informa).
//  - `tabelaDestaque(ctx)` → índice da linha da tabela correspondente ao
//    estado atual da ficha (Grau/BT), realçada pelo MiniTable.
//  - `automation` → efeito que realmente altera a ficha (badge "Programada").
//    Hoje só `acao_extra` (Ímpeto Gradual = +1 ação de um tipo escolhido).
//  ctx = { core, attributes, subChoice }.
// ============================================================

export const CARACTERISTICAS_CATEGORIAS = [
  {
    key: "gerais",
    categoria: "Características Gerais",
    accent: "text-cyan-300",
    caracteristicas: [
      {
        key: "arena_elemental",
        nome: "Arena Elemental",
        descricao:
          "Criaturas que possuam elementos em sua composição ou em seu feitiço recebem um aumento igual a metade do seu bônus de treinamento em seu acerto, seu bônus de treinamento no dano e uma melhoria de ritual caso seu elemento principal esteja presente em pelo menos um raio de 9 metros do usuário, consumindo a área para receber a melhoria durante o turno.",
        computeInfo: (ctx) => {
          const bt = btOf(ctx);
          return `Com o elemento principal em até 9m: +${Math.floor(bt / 2)} no acerto e +${bt} no dano (½ BT e BT, com BT +${bt}).`;
        },
        // Motor (interno) — Liga/Desliga (elemento a ≤9m, julgado pelo narrador):
        // Acerto +½BT e Dano +BT. A "melhoria de ritual" fica como nota/texto.
        motorAuto: (ctx) => {
          const bt = btOf(ctx);
          return { rules: [{
            name: "Arena Elemental",
            trigger: { type: "activated" }, activation: "toggle", cost: { pe: 0, acao: "" },
            effects: [
              { type: "modify_stat", stat: "acerto", op: "add", value: Math.floor(bt / 2), stack: "highest", duration: { kind: "manual" } },
              { type: "action_damage", scope: "corporal", amount: 0, fixed: bt, duration: { kind: "manual" } },
            ],
          }] };
        },
      },
      {
        key: "aura",
        nome: "Aura",
        descricao:
          "A criatura tem auras que podem aplicar desvantagem em jogadores.",
        tabela: {
          titulo: "Aura",
          colunas: ["Grau", "Acerto", "Defesa", "TR", "Perícia", "Crítico", "Terreno"],
          linhas: [
            ["4º Grau", "0", "0", "0", "0", "0", "0"],
            ["3º Grau", "0", "0", "0", "0", "0", "1,5m"],
            ["2º Grau", "-1", "-1", "-1", "-1", "+1", "3m"],
            ["1º Grau", "-2", "-2", "-2", "-2", "+2", "4,5m"],
            ["Grau Esp.", "-3", "-3", "-3", "-3", "+3", "6m"],
          ],
        },
        computeInfo: (ctx) => `Grau atual da criatura: ${GRAU_LABELS[grauOf(ctx)]} (linha destacada na tabela).`,
        tabelaDestaque: (ctx) => GRAU_ROW_INDEX[grauOf(ctx)] ?? null,
        // Habilidade ABERTA: o efeito real é definido pelo usuário (qual penalidade,
        // contra o quê). Libera no builder o editor de bloquinhos + nota própria.
        userAutomatable: true,
      },
      {
        key: "demolicao",
        nome: "Demolição",
        descricao:
          "Danos causados a estruturas contam a estrutura como vulnerável ao tipo de dano. Ataques em área de criaturas que tenham demolição causam +1 de dano a estruturas a cada dado de dano que seja rolado.",
      },
      {
        key: "deslocamento_aereo",
        nome: "Deslocamento Aéreo",
        descricao:
          "A criatura tem a capacidade de voar devido ao seu feitiço ou capacidade corporal, recebendo seu valor de deslocamento no chão como deslocamento de voo, recebendo aumento em ambos caso alguma forma de deslocamento receba bônus.",
        computeInfo: () =>
          "Deslocamento de voo igual ao seu deslocamento em solo (sobe junto com qualquer bônus de deslocamento).",
      },
      {
        key: "fluxo",
        nome: "Fluxo",
        descricao:
          "Quando a criatura errar três ataques seguidos em um único turno, ela receberá no turno seguinte um aumento de acerto igual a +5 contra o alvo de seus ataques.",
      },
      {
        key: "guloso",
        nome: "Guloso",
        descricao:
          "Quando a criatura agarra outra criatura pode gastar uma ação de movimento para poder engolir. Ao engolir recebe 1d4+2, aumentando em +1 dado para cada grau de dano ácido. [Exclusivo de Maldições e Fetos Amaldiçoados]",
        computeInfo: () =>
          "Dano ao engolir: 1d4+2 (+1 dado de dano para cada grau de dano ácido).",
      },
      {
        key: "ignorar_terreno_dificil",
        nome: "Ignorar Terreno Difícil",
        descricao:
          "A criatura tem a capacidade de ignorar um tipo de terreno específico, devido à sua familiaridade com o terreno ou físico especial. Escolha entre Urbano (Cidades), Ermos (Florestas), Aquática (Submerso ou Inundado) ou Subterrâneo (Cavernas e afins), sendo incapaz de receber os malefícios de terreno difícil dentro dessa zona.",
        // Sub-escolha do terreno (só registra a escolha — sem badge).
        automation: {
          kind: "sub_choice",
          label: "Terreno",
          options: [
            { value: "urbano", label: "Urbano (Cidades)" },
            { value: "ermos", label: "Ermos (Florestas)" },
            { value: "aquatica", label: "Aquática (Submerso/Inundado)" },
            { value: "subterraneo", label: "Subterrâneo (Cavernas)" },
          ],
        },
      },
      {
        key: "impeto_gradual",
        nome: "Ímpeto Gradual",
        descricao:
          "A criatura recebe uma ação a mais para poder realizar uma ação específica, devido ao feitiço que possui ou uma condição especial dentro de sua criação. Pode-se escolher entre uma Reação, Ação Bônus ou de Movimento, mas nunca uma Ação Comum.",
        // +1 ação do tipo escolhido (altera a economia de ações → badge "Programada").
        automation: {
          kind: "acao_extra",
          label: "Tipo de Ação",
          options: [
            { value: "reacao", label: "Reação" },
            { value: "bonus", label: "Ação Bônus" },
            { value: "movimento", label: "Ação de Movimento" },
          ],
        },
      },
      {
        key: "marca",
        nome: "Marca",
        descricao:
          "A criatura tem a capacidade de colocar uma marca em quem ela acerta com um feitiço, ataque ou utilizando uma ação própria para isso. As marcas podem causar dano extra, debuffs ou condições garantidas.",
        tabela: {
          titulo: "Marca",
          colunas: ["Grau", "Dano Fixo", "Prejuízos", "Condições"],
          linhas: [
            ["4º Grau", "+1", "-1", "Nenhuma"],
            ["3º Grau", "+2", "-2", "Nenhuma"],
            ["2º Grau", "+3", "-3", "1 Fraca"],
            ["1º Grau", "+4", "-4", "1 Fraca"],
            ["Grau Esp.", "+5", "-5", "2 Fracas"],
          ],
        },
        computeInfo: (ctx) => `Grau atual da criatura: ${GRAU_LABELS[grauOf(ctx)]} (linha destacada na tabela).`,
        tabelaDestaque: (ctx) => GRAU_ROW_INDEX[grauOf(ctx)] ?? null,
        // Habilidade ABERTA: o usuário define o que a marca faz (dano/prejuízos/
        // condições). Libera editor de bloquinhos + nota própria.
        userAutomatable: true,
      },
      {
        key: "pavio_curto",
        nome: "Pavio Curto",
        descricao:
          "Provocações são seu ponto fraco. Seu sangue ferve e sua vontade de matar aumenta, com a adrenalina e o ódio fortalecendo seu corpo. Você recebe desvantagem contra a ação provocar, porém causa metade de sua ND como dano extra contra criaturas que tenham provocado você.",
        computeInfo: (ctx) => {
          const nd = ndOf(ctx);
          return `Dano extra contra quem te provocou: ${Math.floor(nd / 2)} (½ da ND ${nd}).`;
        },
      },
      {
        key: "rastro_amaldicoado",
        nome: "Rastro Amaldiçoado",
        descricao:
          "Ao se deslocar, a criatura deixa um rastro do tamanho dela no chão, o qual pode ser usado para deixar uma habilidade nele, causar dano de terreno ou usar para algo muito específico do feitiço.",
        tabela: {
          titulo: "Rastro Amaldiçoado",
          colunas: ["Bônus de Treinamento", "Dano de Terreno"],
          linhas: [
            ["Treinamento +2", "1d4+1"],
            ["Treinamento +3", "2d4+3"],
            ["Treinamento +4", "3d4+5"],
            ["Treinamento +5", "3d6+8"],
            ["Treinamento +6", "4d6+10"],
          ],
        },
        computeInfo: (ctx) => `Bônus de Treinamento atual: +${btOf(ctx)} (linha destacada na tabela).`,
        tabelaDestaque: (ctx) => clamp(btOf(ctx) - 2, 0, 4),
        // Habilidade ABERTA: "deixar uma habilidade no rastro / algo específico
        // do feitiço" — o usuário define. Libera editor de bloquinhos + nota.
        userAutomatable: true,
      },
      {
        key: "terreno_favorito",
        nome: "Terreno Favorito",
        descricao:
          "Enquanto a criatura estiver em seu ambiente de conforto ou em um ambiente que tenha pleno domínio, ela recebe bonificações de acordo com as bonificações do interior de um domínio (página xx do livro básico).",
      },
      {
        key: "trocar_atributo_pericia",
        nome: "Trocar Atributo de uma Perícia",
        descricao:
          "A criatura tem a capacidade de trocar o atributo de uma perícia, desde que seja coerente a troca de atributos. Exemplo: realizar Atletismo com Destreza para testes de correr.",
        computeInfo: () =>
          "Para aplicar na ficha, ajuste o atributo da perícia desejada na aba Perícias.",
      },
    ],
  },
  {
    key: "especiais",
    categoria: "Características Especiais",
    accent: "text-rose-300",
    // São habilidades, efeitos ou traços únicos que quebram ou alteram regras
    // normais. Definem a identidade da criatura: tornam encontros memoráveis,
    // criam desafios específicos e forçam estratégias diferentes dos jogadores.
    caracteristicas: [
      {
        key: "adaptabilidade",
        nome: "Adaptabilidade",
        descricao:
          "Ao ser acertada, a criatura consegue se adaptar a apenas 1 ataque causado contra ela. (Necessita de um feitiço com esse funcionamento ou item amaldiçoado, que funcionará para apenas um único tipo de dano.)",
      },
      {
        key: "alterar_tamanho",
        nome: "Alterar Tamanho",
        descricao:
          "Tem a capacidade de alterar seu tamanho livremente. Até a ND 5, pequeno, médio e grande. A partir da ND 10, todos os tamanhos. (Recebe os bônus e os ônus do aumento ou redução.)",
        computeInfo: (ctx) => {
          const nd = ndOf(ctx);
          return nd >= 10
            ? `Na ND ${nd}: pode assumir todos os tamanhos.`
            : `Na ND ${nd}: pode assumir pequeno, médio e grande (todos os tamanhos a partir da ND 10).`;
        },
      },
      {
        key: "anulacao",
        nome: "Anulação",
        descricao:
          "A criatura tem a capacidade de anular a energia de um ataque por cena, necessitando gastar o PE gasto pelo atacante e possuir uma ação de reação.",
      },
      {
        key: "armazem",
        nome: "Armazém",
        descricao:
          "A criatura consegue guardar o dano recebido por um total de três rodadas e não sofre das desvantagens que receberia (dano, condição etc). Mas, após a terceira rodada, recebe o dano x1,5 ou a condição dura duas rodadas a mais. Danos causados direto como perda de vida ou raios negros não podem ser guardados.",
      },
      {
        key: "arsenal",
        nome: "Arsenal",
        descricao:
          "A criatura utiliza armas não naturais. As armas não possuem dano próprio, mas alteram o tipo de dano, o alcance e, caso tenham uma característica especial, a aplicam nos golpes utilizados com ela. (Ex: lança invertida celeste.)",
      },
      {
        key: "atravessar_estruturas",
        nome: "Atravessar Estruturas",
        descricao:
          "A criatura tem a capacidade de atravessar qualquer tipo de estrutura, exceto cortinas com a regra de não atravessar e expansões de domínio já fechadas. (Maldições de ND até 4 recebem gratuitamente essa característica.)",
      },
      {
        key: "atracao",
        nome: "Atração",
        descricao:
          "A criatura tem a capacidade de, 1x por rodada, forçar uma criatura a gastar sua ação de movimento na sua direção caso ela falhe em um TR de vontade.",
      },
      {
        key: "atracao_de_arma",
        nome: "Atração de Arma",
        descricao:
          "A criatura tem a capacidade de atrair armas de um grupo específico e, mesmo que a arma tenha retorno, ela não volta ao seu dono uma vez que chegue na criatura. A classe de dificuldade é 15 + 5 para cada grau.",
        computeInfo: (ctx) =>
          `CD para resistir à atração: ${15 + 5 * GRAU_RANK[grauOf(ctx)]} (15 + 5 por grau, ${GRAU_LABELS[grauOf(ctx)]}).`,
      },
      {
        key: "brechas",
        nome: "Brechas",
        descricao:
          "Caso o ataque de uma criatura seja 5 ou abaixo de sua Defesa, ou seja uma falha crítica, a criatura poderá realizar um teste de Percepção contra a CD do atacante, podendo realizar um ataque de oportunidade caso suceda no teste.",
      },
      {
        key: "controle_corporal_mental",
        nome: "Controle Corporal/Mental",
        descricao:
          "A criatura tem a capacidade de impedir desmembramentos uma quantidade de vezes igual ao seu bônus de treinamento. Ou, após acertar uma quantidade x de ataques ou aplicar uma quantidade x de condições, consegue o controle do corpo ou da mente de uma criatura. (O controle mental é indicado apenas para feitiços com essa funcionalidade ou criaturas que tenham esse tema.)",
        computeInfo: (ctx) =>
          `Impede desmembramentos: ${btOf(ctx)} vez(es) (igual ao Bônus de Treinamento).`,
      },
      {
        key: "dimensao_de_bolso",
        nome: "Dimensão de Bolso",
        descricao:
          "A criatura tem a capacidade de criar uma dimensão própria, onde pode esconder algo, sequestrar alguém ou fugir. (Necessário um feitiço caso queira adentrar com ou sem outras pessoas.)",
      },
      {
        key: "dupla_personalidade",
        nome: "Dupla Personalidade",
        descricao:
          "A criatura tem 2 personalidades, uma boa e outra ruim. Ela realmente passa dizendo a verdade em testes de intuição, e a sua parte ruim sabe de todas as informações da personalidade boa.",
      },
      {
        key: "equipe",
        nome: "Equipe",
        descricao:
          "A criatura é composta por mais de 1 unidade, o que permite que ela tenha resistência a ataques individuais, mas seja vulnerável a ataques em área.",
      },
      {
        key: "expansao_de_dominio",
        nome: "Expansão de Domínio",
        descricao:
          "A criatura possui a aptidão expansão de domínio, utilizando o guia de criação do livro básico (pág. xxx). Na ND 8 a criatura possui a incompleta, na ND 10 a completa e na ND 20 a sem barreira. Recebe o bônus de rolagem na disputa de domínio também. Custa 2 Ações.",
        computeInfo: (ctx) => {
          const nd = ndOf(ctx);
          const v =
            nd >= 20
              ? "Sem Barreira (também incompleta e completa)"
              : nd >= 10
                ? "Completa (também incompleta)"
                : nd >= 8
                  ? "Incompleta"
                  : "ainda não disponível (a partir da ND 8)";
          return `Versão disponível na ND ${nd}: ${v}.`;
        },
      },
      {
        key: "falacia",
        nome: "Falácia",
        descricao:
          "A criatura tem a capacidade de mentir em testes de intuição uma quantidade de vezes igual ao seu bônus de treinamento. Essa característica não pode ser utilizada contra críticos naturais.",
        computeInfo: (ctx) =>
          `Mentiras em testes de intuição: ${btOf(ctx)} (igual ao Bônus de Treinamento).`,
      },
      {
        key: "ignorar_cortinas",
        nome: "Ignorar Cortinas",
        descricao:
          "A criatura tem a capacidade de ignorar cortinas, independentemente de suas regras.",
      },
      {
        key: "impacto_atrasado",
        nome: "Impacto Atrasado",
        descricao:
          "A criatura tem a capacidade de bater onde anteriormente outro ser estava, podendo realizar a jogada de acerto considerando a criatura surpresa. Essa característica funciona apenas para o local onde o alvo estava em sua última rodada. A partir da segunda utilização contra a mesma criatura, ela deve realizar um TR de reflexos para não ser considerada surpresa na jogada de ataque.",
      },
      {
        key: "ligacao_do_destino",
        nome: "Ligação do Destino",
        descricao:
          "A criatura se aproxima de outra criatura e prepara um ataque. Se outra criatura que tiver um vínculo muito forte com o alvo avisar sobre o ataque, o ataque é anulado. Caso não avise, o ataque é garantido.",
      },
      {
        key: "linguagem_mistica",
        nome: "Linguagem Mística",
        descricao:
          "A criatura força as criaturas a mudarem seu idioma, impedindo a comunicação entre elas, impedindo rituais e anulando percepção sonora.",
      },
      {
        key: "miragem_temporal",
        nome: "Miragem Temporal",
        descricao:
          "Caso os jogadores tenham se movido na última rodada, você pode alvejar o lugar onde eles estavam no turno passado, assim os considerando desprevenidos.",
      },
      {
        key: "partenogenese",
        nome: "Partenogênese",
        descricao:
          "A criatura tem a capacidade de gastar 20 PE para dividir uma parte do seu corpo, podendo ressuscitar após um descanso longo caso essa parte dividida não tenha sido destruída. [Exclusivo de Maldições]",
      },
      {
        key: "perceber_tracado_alma",
        nome: "Perceber o Traçado da Alma",
        descricao:
          "Tem a capacidade de ver, entender, curar e causar dano na alma, necessitando possuir Integridade como resistência dominada, um feitiço capaz de manipular a alma ou ND 12 e acima.",
      },
      {
        key: "ping_pong",
        nome: "Ping Pong",
        descricao:
          "Ao acertar um ataque corpo a corpo em alguém, empurre a pessoa uma quantidade de metros igual ao seu modificador de Força x1,5 e siga ela. A criatura empurrada não gera ataque de oportunidade.",
        computeInfo: (ctx) => {
          const m = Math.floor(modForOf(ctx) * 1.5);
          return `Empurrão ao acertar corpo a corpo: ${Math.max(0, m)} metros (mod. de Força × 1,5).`;
        },
      },
      {
        key: "replay",
        nome: "Replay",
        descricao:
          "A primeira vez que acertar uma criatura, ela deve realizar um TR de vontade. Numa falha, deve realizar as mesmas ações, nos mesmos alvos e no mesmo lugar.",
      },
      {
        key: "reversao",
        nome: "Reversão",
        descricao:
          "A criatura tem a capacidade de inverter os bônus concedidos entre jogadores, ou seja, +1 de acerto se transforma em -1 de acerto. OBS: muito cuidado, essa característica é muito forte e requer um nível de balanceamento muito preciso. Pode afetar uma única criatura por vez por 1 rodada, recebendo um tempo de recarga no mesmo alvo igual a metade do treinamento em rodadas, além de gastar uma ação de reação.",
        computeInfo: (ctx) =>
          `Recarga no mesmo alvo: ${Math.floor(btOf(ctx) / 2)} rodada(s) (½ do Bônus de Treinamento +${btOf(ctx)}).`,
      },
      {
        key: "reversao_elemental",
        nome: "Reversão Elemental",
        descricao:
          "Ao ser alvo de um ataque que seja uma variação de um dos 4 elementos (Fogo, Água, Terra e Ar), o ataque regride ao seu elemento oposto e tem sua efetividade reduzida (reduz o dano em 1/3). Ativar essa característica exige uma ação de reação.",
      },
      {
        key: "sentido_as_cegas",
        nome: "Sentido às Cegas",
        descricao:
          "Ignora a escuridão parcial e total, possuindo olhos especiais ou a capacidade de utilizar seus outros sentidos de forma aguçada para localizar. Você recebe acesso aos tipos de percepção especial da página 296 do livro básico.",
      },
      {
        key: "slime",
        nome: "Slime",
        descricao:
          "Quando a criatura recebe um ataque corpo a corpo ou um projétil a acertar, a arma/projétil fica preso nela, tendo que fazer um teste de Atletismo com a classe de dificuldade 15 + 3 por grau para tirar a arma/projétil.",
        computeInfo: (ctx) =>
          `CD de Atletismo para soltar a arma/projétil: ${15 + 3 * GRAU_RANK[grauOf(ctx)]} (15 + 3 por grau, ${GRAU_LABELS[grauOf(ctx)]}).`,
      },
      {
        key: "talisma",
        nome: "Talismã",
        descricao:
          "Usuários de Invocações que possuírem essa característica são capazes de trazer novamente ao campo de batalha suas invocações com metade dos seus pontos de vida e defesa após serem derrotadas, apenas podendo ser exorcizadas caso seu talismã seja destruído. Caso seja uma maldição e possua essa característica, você deverá possuir um objeto núcleo que estará fixo e exposto em uma distância de até 3 metros multiplicado por seu treinamento. Você não pode ser morto ou levado aos portões da morte até que seu talismã seja destruído.",
        computeInfo: (ctx) =>
          `Distância máxima do objeto núcleo (Maldições): ${3 * btOf(ctx)} metros (3m × Bônus de Treinamento +${btOf(ctx)}).`,
      },
      {
        key: "transformacao",
        nome: "Transformação",
        descricao:
          "A criatura tem a capacidade de se transformar e ganhar algumas bonificações como vantagem em testes de ataque, vantagem em testes de resistência e bônus igual às tabelas acima, igual ao seu bônus de treinamento.",
        computeInfo: (ctx) =>
          `Bônus ao se transformar: +${btOf(ctx)} (igual ao Bônus de Treinamento).`,
        // Motor (interno) — Liga/Desliga: Acerto +BT enquanto transformada. As
        // "vantagens" em ataque/TR o tracker não rola → ficam como nota/texto.
        motorAuto: (ctx) => ({
          rules: [{
            name: "Transformar-se",
            trigger: { type: "activated" }, activation: "toggle", cost: { pe: 0, acao: "" },
            effects: [{ type: "modify_stat", stat: "acerto", op: "add", value: btOf(ctx), stack: "highest", duration: { kind: "manual" } }],
          }],
        }),
      },
      {
        key: "transformacao_especial",
        nome: "Transformação Especial",
        descricao:
          "Uma vez por cena, a criatura possuirá uma ação especial para se transformar, ignorando a iniciativa e sendo ativa assim que for anunciada. Essa transformação durará a cena e não poderá ser regredida, com exceção da derrota ou vontade da criatura transformada, recebendo benefícios de acordo com o narrador.",
        // Habilidade ABERTA: "benefícios de acordo com o narrador" — totalmente
        // definida pelo usuário. Libera editor de bloquinhos + nota própria.
        userAutomatable: true,
      },
      {
        key: "transmissao",
        nome: "Transmissão",
        descricao:
          "A criatura tem a capacidade de aplicar um efeito de dano contínuo em 1 criatura específica, e todas as criaturas que estiverem a 1,5 metros do alvo recebem também, caso não passem em um teste de resistência.",
      },
      {
        key: "vinculo",
        nome: "Vínculo",
        descricao:
          "A criatura, no início do combate, se vincula a uma outra criatura. Ao receber dano, condição, cura, vida temporária ou etc, a criatura vinculada recebe os mesmos bônus. Caso a criatura seja oposta ao vínculo, deve realizar um TR de vontade contra o vinculador.",
      },
      {
        key: "zona_festeira",
        nome: "Zona Festeira",
        descricao:
          "Todo início de turno, realize uma BATALHA DE DANÇA contra algum voluntário. Caso várias pessoas sejam voluntárias, você escolhe quem. Quem ganhar recebe vantagem nas próximas 2 rolagens de atributos de presença.",
      },
    ],
  },
];

// ---------- Mapas planos (com a categoria embutida) ----------
const _flatC = CARACTERISTICAS_CATEGORIAS.flatMap((cat) =>
  cat.caracteristicas.map((c) => ({ ...c, categoria: cat.categoria }))
);
const C_BY_NOME = Object.fromEntries(_flatC.map((c) => [c.nome, c]));
const C_BY_KEY = Object.fromEntries(_flatC.filter((c) => c.key).map((c) => [c.key, c]));

export const getCaracteristicaByNome = (nome) => C_BY_NOME[nome] ?? null;
export const getCaracteristicaByKey = (key) => C_BY_KEY[key] ?? null;

// Característica Especial que destrava a Criação de Expansão de Domínio na
// aba de Ações (ver fm-domain-calc / DomainForm).
export const EXPANSAO_DOMINIO_KEY = "expansao_de_dominio";

/** True se a ficha possui a Característica Especial "Expansão de Domínio". */
export function hasExpansaoDominio(caracteristicas = []) {
  return (caracteristicas || []).some(
    (c) => c.key === EXPANSAO_DOMINIO_KEY || c.nome === "Expansão de Domínio"
  );
}

// ---------- Helpers de contexto (Grau, BT, ND, mods) ----------
const GRAU_LABELS = { "4": "4º Grau", "3": "3º Grau", "2": "2º Grau", "1": "1º Grau", especial: "Grau Especial" };
// Ordem das linhas nas tabelas Aura/Marca (4º → Especial).
const GRAU_ROW_INDEX = { "4": 0, "3": 1, "2": 2, "1": 3, especial: 4 };
// "Peso" do grau para CDs "15 + X por grau" (mais forte = mais alto).
const GRAU_RANK = { "4": 1, "3": 2, "2": 3, "1": 4, especial: 5 };

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const ndOf = (ctx) => Number(ctx?.core?.nd) || 0;
const btOf = (ctx) => getBonusTreinamento(ndOf(ctx));
const grauOf = (ctx) => ctx?.core?.grau ?? "3";
const modForOf = (ctx) => getModifier(ctx?.attributes?.forca ?? 10);

/**
 * Descrição resolvida no contexto da ficha. Características com `computeInfo`
 * ganham uma linha extra com o valor calculado (sem virar automação). A
 * sub-escolha do Ímpeto Gradual (tipo de ação) também é refletida.
 * ctx = { core, attributes, subChoice }.
 */
export function resolveCaracteristicaDescription(carac, ctx = {}) {
  if (!carac) return "";
  let texto = carac.descricao;
  const extra = typeof carac.computeInfo === "function" ? carac.computeInfo(ctx) : null;
  if (extra) texto = `${texto}\n\n${extra}`;
  const auto = carac.automation;
  if ((auto?.kind === "acao_extra" || auto?.kind === "sub_choice") && ctx.subChoice) {
    const opt = (auto.options || []).find((o) => o.value === ctx.subChoice);
    texto = `${texto}\n\n${auto.label}: ${opt ? opt.label : ctx.subChoice}.`;
  }
  // Nota personalizada do usuário (habilidades ABERTAS: Aura, Marca, etc.) —
  // adicionada sob o texto/tabela oficial, sem substituí-lo.
  const nota = (ctx.notaPersonalizada || "").trim();
  if (nota) texto = `${texto}\n\n📝 ${nota}`;
  return texto;
}

/** True se a característica oficial é "aberta" (usuário define efeito/descrição). */
export function isUserAutomatableCaracteristica(carac) {
  return !!carac?.userAutomatable;
}

/** Índice da linha da tabela a destacar para o estado atual da ficha (ou null). */
export function getCaracteristicaTabelaDestaque(carac, ctx = {}) {
  return typeof carac?.tabelaDestaque === "function" ? carac.tabelaDestaque(ctx) : null;
}

// ============================================================
// HELPERS DE AUTOMAÇÃO
// ============================================================
// Kinds que ganham o badge "Programada" (alteram a ficha).
const BADGED_CARAC_KINDS = new Set(["acao_extra"]);

/** True se a característica oficial tem automação programada na ficha. */
export function isAutomatedCaracteristica(carac) {
  return BADGED_CARAC_KINDS.has(carac?.automation?.kind);
}

/**
 * Bônus de economia de ações concedido pelas características (Ímpeto Gradual:
 * +1 ação do tipo escolhido). Retorna { reacao?, bonus?, movimento? } com a
 * contagem de ações extras por tipo.
 */
export function getCaracteristicasAcaoBonus(lista = []) {
  const out = {};
  for (const c of lista || []) {
    if (c.tipo === "custom") continue;
    const cat = c.key ? C_BY_KEY[c.key] : C_BY_NOME[c.nome];
    if (cat?.automation?.kind === "acao_extra" && c.subChoice) {
      out[c.subChoice] = (out[c.subChoice] || 0) + 1;
    }
  }
  return out;
}

/** Avisos para características com sub-escolha obrigatória ainda não definida. */
export function getCaracteristicaSubChoiceWarnings(lista = []) {
  const out = [];
  for (const c of lista || []) {
    if (c.tipo === "custom") continue;
    const cat = c.key ? C_BY_KEY[c.key] : C_BY_NOME[c.nome];
    const auto = cat?.automation;
    if ((auto?.kind === "acao_extra" || auto?.kind === "sub_choice") && !c.subChoice) {
      const what = auto.label ? auto.label.toLowerCase() : "uma opção";
      out.push({ nome: cat.nome, message: `${cat.nome}: escolha ${what}.` });
    }
  }
  return out;
}

/** Avisos de pré-requisito não-bloqueantes (ND mínimo, exclusividade de origem). */
export function getCaracteristicaPrereqWarnings(lista = [], { core } = {}) {
  const nd = Number(core?.nd) || 0;
  const originType = core?.origin?.type;
  const has = (key) => (lista || []).some((c) => c.key === key);
  const out = [];
  if (has("expansao_de_dominio") && nd < 8)
    out.push({ message: "Expansão de Domínio: requer ND 8 ou mais." });
  if (has("perceber_tracado_alma") && nd < 12)
    out.push({ message: "Perceber o Traçado da Alma: requer ND 12+ (ou Integridade dominada / feitiço de alma)." });
  if (has("alterar_tamanho") && nd < 5)
    out.push({ message: "Alterar Tamanho: só libera tamanhos a partir da ND 5." });
  if (has("guloso") && originType !== "maldicao")
    out.push({ message: "Guloso: exclusivo de Maldições e Fetos Amaldiçoados." });
  if (has("partenogenese") && originType !== "maldicao")
    out.push({ message: "Partenogênese: exclusivo de Maldições." });
  return out;
}
