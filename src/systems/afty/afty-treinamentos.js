/**
 * ============================================================
 * CATÁLOGO DE TREINAMENTOS — GRIMÓRIO AFTY (Interlúdios)
 * ============================================================
 * Conteúdo é DADO, não código (ver roadmap). Cada Linha de
 * Treinamento tem 4 etapas SEQUENCIAIS + um bônus de "Completo"
 * automático ao concluir a 4ª.
 *
 * Economia (Interlúdios): cada etapa custa Foco(s). Um interlúdio
 * dá 2 focos (mais, a critério do Mestre, se durar mais que o
 * comum). Custos: 1ª/2ª/3ª = 1 foco, 4ª = 2 focos → linha inteira
 * = 5 focos. Etapas em ORDEM; não se repete linha já completa.
 *
 * `efeitos`: contribuições LEGÍVEIS PELO MOTOR de Automação, traduzidas
 *   por `paraCanal` para `{ canal, expr }`. Tipos aceitos:
 *     hp · pe · movimento · defesa          → canal de mesmo nome
 *     atributo                              → canal `atributo`, no alvo da instância
 *     aptidao (com trilha)                  → `nivelAptidao` direcionado (grátis)
 *     aptidao (sem trilha)                  → `pontosAptidao` (orçamento livre)
 *     pericia (com `pericia`, ou o alvo)    → `bonusPericia`
 *     tr (com `tr`)                         → `bonusTR`
 *     margemCriticoTR (com `tr`)            → `margemCriticoTR`
 *     manobra (com `manobra`)               → `bonusManobra`
 *     ataque (com `ataque`)                 → `bonusAcerto`
 *     profPericia                           → `proficienciaPericia` (1 Treinado, 2 Mestre)
 *     nivelDano                             → `nivelDano` no Ataque Básico
 *   `quandoProf: N` num efeito de perícia vira a condição "Caso já seja":
 *   o bônus só entra se a FICHA já tiver aquela faixa.
 *
 * ⚠ AINDA SEM CANAL (vivem só no texto `beneficio`, e entram quando o
 * sistema existir): confrontos e
 * contestações de **expansões de domínio** (Domínios 2ª e 4ª), bônus de
 * ataque com **uma arma específica** (Manejo de Arma 2ª, depende do
 * sistema de armas), pontos de vida de **paredes de barreira**, PE
 * temporário por cena, dados de vida por descanso.
 *
 * `requisito` por etapa (além da etapa anterior):
 *   { tipo:"atributo", attr, valor }  → VERIFICÁVEL (bloqueia).
 *   { tipo:"nota", label }            → referencia sistema ainda
 *       não construído (aptidões/features): exibido, não bloqueia.
 *
 * ⚠ DIVERGÊNCIA a confirmar com o autor: a planilha
 * (afty-formulas-base.md) mapeava Compreensão 1ª=+1 PE e 3ª=+2 PE,
 * e contava a 2ª como +1 Aptidão. As TABELAS enviadas dizem
 * 1ª=+2 PE, 3ª=+3 PE e 2ª=bônus de perícia (sem Aptidão). Aqui
 * seguimos as TABELAS (fonte mais recente/explícita). A planilha
 * pode estar desatualizada.
 * ============================================================
 */

import { AFTY_ATTRS } from "./afty-schema";
import { AFTY_PERICIAS } from "./afty-pericias";

// Texto completo da aptidão concedida pelo Treino de Domínios (Completo).
const MODIFICACAO_COMPLETA =
  "Seu controle sobre os domínios é tão refinado que, mesmo no imediato momento de " +
  "expandir seu domínio, você consegue o modificar. Ao utilizar uma expansão de domínio, " +
  "você pode aplicar as seguintes modificações:\n\n" +
  "• Inversão de Resistência. Você inverte a resistência interna e externa da sua expansão " +
  "de domínio, conseguindo lidar melhor com ataques que venham de fora. Ao utilizar essa " +
  "modificação, troque os pontos de vida do lado interno pelos do lado externo.\n\n" +
  "• Mudança de Tamanho. Você muda e controla o tamanho da expansão. Você pode expandir ou " +
  "encolher o espaço da expansão: para cada 1,5m que encolher a expansão, ela recebe 20 " +
  "pontos de vida adicionais em sua resistência interna e externa; para cada 1,5m que " +
  "expandir, a resistência interna e externa diminui em 20 pontos de vida. Uma expansão não " +
  "pode ser encolhida para menos de 3 metros e nem expandida para mais que o triplo do " +
  "tamanho comum. Ambas as mudanças de tamanho são consideradas na área da expansão, a qual " +
  "por padrão é de 9 metros.";

export const AFTY_TREINAMENTOS = [
  {
    id: "agilidade",
    nome: "Treino de Agilidade",
    resumo:
      "O treino de agilidade tem como foco ampliar na velocidade, movimento e capacidade de resposta, deixando-o mais ágil.",
    etapas: [
      { n: 1, focos: 1, requisito: null,
        beneficio: "Seu Deslocamento aumenta em 1,5 metros.",
        efeitos: [{ tipo: "movimento", valor: 1.5 }] },
      { n: 2, focos: 1, requisito: null,
        beneficio: "Você recebe um bônus de +2 em rolagens de Acrobacia.",
        efeitos: [{ tipo: "pericia", pericia: "acrobacia", valor: 2 }] },
      { n: 3, focos: 1, requisito: { tipo: "atributo", attr: "destreza", valor: 14 },
        beneficio: "Você recebe um bônus de +2 em rolagens de Iniciativa.",
        efeitos: [{ tipo: "iniciativa", valor: 2 }] },
      { n: 4, focos: 2, requisito: { tipo: "atributo", attr: "destreza", valor: 16 },
        beneficio: "Você recebe um bônus de +2 em rolagens de Reflexos.",
        efeitos: [{ tipo: "tr", tr: "reflexos", valor: 2 }] },
    ],
    completo: {
      beneficio:
        "Com grande velocidade e agilidade, você se torna rápido e capaz de um nível superior " +
        "de mobilidade e esquivas. Sua margem necessária para um sucesso crítico em um TR de " +
        "Reflexos reduz em 2. Seu Deslocamento aumenta em 4,5 metros.",
      efeitos: [
        { tipo: "movimento", valor: 4.5 },
        { tipo: "margemCriticoTR", tr: "reflexos", valor: 2 },
      ],
    },
  },

  {
    id: "barreiras",
    nome: "Treino de Barreiras",
    resumo:
      "O treino de barreiras desenvolve a resistência e excelência do ramo de aptidões amaldiçoadas que envolvem as barreiras.",
    etapas: [
      { n: 1, focos: 1, requisito: { tipo: "nota", label: "Técnicas de Barreira" },
        beneficio: "Os pontos de vida das paredes da sua Técnica de Barreira aumentam em 10." },
      { n: 2, focos: 1, requisito: null,
        beneficio: "Seu Nível de Aptidão em Barreiras aumenta em 1.",
        efeitos: [{ tipo: "aptidao", trilha: "bar", valor: 1 }] },
      { n: 3, focos: 1, requisito: { tipo: "nota", label: "Nível de Aptidão em Barreiras 2" },
        beneficio: "Os pontos de vida das paredes da sua Técnica de Barreira aumentam em 10." },
      { n: 4, focos: 2, requisito: { tipo: "nota", label: "Nível de Aptidão em Barreiras 3" },
        beneficio: "Ao utilizar Técnicas de Barreira, o máximo de paredes que você pode criar aumenta em 2." },
    ],
    completo: {
      beneficio:
        "Você domina a técnica de barreiras, conferindo-lhes resistência elevada. Toda parede " +
        "que criar com Técnicas de Barreira recebe RD igual ao seu Nível de Aptidão em Barreiras.",
    },
  },

  {
    id: "compreensao",
    nome: "Treino de Compreensão",
    resumo:
      "O treino de compreensão permite ao feiticeiro se aprofundar na essência da energia, compreendendo-a cada vez mais.",
    etapas: [
      { n: 1, focos: 1, requisito: null,
        beneficio: "Seu máximo de energia amaldiçoada aumenta em 2.",
        efeitos: [{ tipo: "pe", valor: 2 }] },
      { n: 2, focos: 1, requisito: null,
        beneficio: "Você recebe um bônus de +1 em rolagens de Feitiçaria e Ocultismo.",
        efeitos: [{ tipo: "pericia", pericia: "feiticaria", valor: 1 }, { tipo: "pericia", pericia: "ocultismo", valor: 1 }] },
      { n: 3, focos: 1, requisito: { tipo: "nota", label: "Nível de Aptidão em Aura 2" },
        beneficio: "Seu máximo de energia amaldiçoada aumenta em 3.",
        efeitos: [{ tipo: "pe", valor: 3 }] },
      { n: 4, focos: 2, requisito: { tipo: "nota", label: "Nível de Aptidão em Aura 3" },
        beneficio: "Você recebe um bônus de +2 em rolagens de Feitiçaria e Ocultismo.",
        efeitos: [{ tipo: "pericia", pericia: "feiticaria", valor: 2 }, { tipo: "pericia", pericia: "ocultismo", valor: 2 }] },
    ],
    completo: {
      beneficio:
        "Você chega muito perto de compreender profundamente a energia amaldiçoada, tornando-se " +
        "familiar com ela. Você aumenta um nível de aptidão à sua escolha em 1.",
      efeitos: [{ tipo: "aptidao", valor: 1 }],
    },
  },

  {
    id: "controle_energia",
    nome: "Treino de Controle de Energia",
    resumo:
      "O treino de controle de energia é um extenso processo para conseguir melhorar a administração e produção de energia amaldiçoada do feiticeiro.",
    etapas: [
      { n: 1, focos: 1, requisito: null,
        beneficio: "Seu máximo de energia amaldiçoada aumenta em 2.",
        efeitos: [{ tipo: "pe", valor: 2 }] },
      { n: 2, focos: 1, requisito: null,
        beneficio: "Quando uma cena de combate iniciar, você recebe 4 pontos de energia amaldiçoada temporários." },
      { n: 3, focos: 1, requisito: { tipo: "nota", label: "Nível de Aptidão em Controle e Leitura 2" },
        beneficio: "Seu máximo de energia amaldiçoada aumenta em 3.",
        efeitos: [{ tipo: "pe", valor: 3 }] },
      { n: 4, focos: 2, requisito: { tipo: "nota", label: "Nível de Aptidão em Controle e Leitura 3" },
        beneficio: "Seu Nível de Aptidão em Controle e Leitura aumenta em 1.",
        efeitos: [{ tipo: "aptidao", trilha: "cl", valor: 1 }] },
    ],
    completo: {
      beneficio:
        "Você já estabeleceu uma profunda conexão com a energia amaldiçoada. Em combate, no " +
        "começo de toda rodada, você ganha PE temporário igual à metade do seu bônus de treinamento.",
    },
  },

  {
    id: "dominios",
    nome: "Treino de Domínios",
    resumo:
      "O treino de domínios é uma sequência de passos para refinar as manifestações do próprio domínio, aperfeiçoando ainda mais aquela técnica dita como o pináculo da feitiçaria.",
    etapas: [
      { n: 1, focos: 1, requisito: { tipo: "nota", label: "Expansão de Domínio Incompleta" },
        beneficio: "Você recebe um bônus de +1 em rolagens para confrontos e contestações de expansões." },
      { n: 2, focos: 1, requisito: null,
        beneficio: "A área da sua Expansão de Domínio aumenta em 3 metros." },
      { n: 3, focos: 1, requisito: { tipo: "nota", label: "Expansão de Domínio Completa" },
        beneficio: "Você recebe um bônus de +1 em rolagens para confrontos e contestações de expansões." },
      { n: 4, focos: 2, requisito: { tipo: "nota", label: "Nível de Aptidão em Domínio 5" },
        beneficio: "Você pode colocar um efeito adicional em sua expansão de domínio." },
    ],
    completo: {
      beneficio:
        "Você se torna um mestre das expansões, moldando-as diante de sua vontade e necessidade. " +
        "Você recebe a aptidão amaldiçoada Modificação Completa.",
      grant: { tipo: "aptidao_amaldicoada", nome: "Modificação Completa", categoria: "Aptidões de Domínio" },
      detalhe: MODIFICACAO_COMPLETA,
    },
  },

  {
    id: "energia_reversa",
    nome: "Treino de Energia Reversa",
    // ⚠ Uma MALDIÇÃO não tem acesso a este treino (autor, 2026-08-02), pelo
    // mesmo motivo de ela não ter Nível de Aptidão em Energia Reversa: ela é
    // feita de energia amaldiçoada, e a reversa é o que a destrói. A trilha
    // inteira some da aba, e um Foco gasto nela antes de trocar de origem deixa
    // de contar e volta para o orçamento.
    foraDaOrigem: ["maldicao"],
    resumo:
      "O treino de energia reversa permite se aprimorar no uso da energia positiva, capaz de curar humanos e destruir maldições, sendo o completo oposto da energia amaldiçoada.",
    etapas: [
      { n: 1, focos: 1, requisito: { tipo: "nota", label: "Energia Reversa" },
        beneficio: "A quantidade de pontos de energia reversa que você pode gastar em Aptidões de Energia Reversa aumenta em 1." },
      { n: 2, focos: 1, requisito: null,
        beneficio: "Seu Nível de Aptidão em Energia Reversa aumenta em 1.",
        efeitos: [{ tipo: "aptidao", trilha: "er", valor: 1 }] },
      { n: 3, focos: 1, requisito: { tipo: "nota", label: "Nível de Aptidão em Energia Reversa 4" },
        beneficio: "O custo para regenerar um membro ou ferida interna com Regeneração Aprimorada é reduzido em 2 pontos de energia reversa." },
      { n: 4, focos: 2, requisito: { tipo: "nota", label: "Nível de Aptidão em Energia Reversa 5" },
        beneficio: "Você também pode usar Fluxo Constante para regenerar membros, ao invés de apenas se curar." },
    ],
    completo: {
      beneficio:
        "Sua maestria sobre a energia reversa te permite recuperar até mesmo aquilo que parece impossível: " +
        "você pode usar a aptidão amaldiçoada Regeneração Aprimorada para curar sua exaustão de técnica após " +
        "usar expansão de domínio, reduzindo em um turno para 2 pontos de energia reversa gastos.",
    },
  },

  {
    id: "luta",
    nome: "Treino de Luta",
    resumo:
      "O treino de luta foca em praticar e dominar meios de conseguir lutar, melhorando os golpes desarmados, guarda e fundamentos da luta.",
    etapas: [
      { n: 1, focos: 1, requisito: null,
        beneficio: "O dano de seus ataques desarmados aumenta em 1 nível.",
        efeitos: [{ tipo: "nivelDano", valor: 1 }] },
      { n: 2, focos: 1, requisito: null,
        beneficio: "Você recebe +2 em sua Defesa e em rolagens para as ações Agarrar, Derrubar e Empurrar.",
        efeitos: [
          { tipo: "defesa", valor: 2 },
          { tipo: "manobra", manobra: "agarrar", valor: 2 },
          { tipo: "manobra", manobra: "derrubar", valor: 2 },
          { tipo: "manobra", manobra: "empurrar", valor: 2 },
        ] },
      { n: 3, focos: 1, requisito: { tipo: "atributoOr", attrs: ["forca", "destreza"], valor: 14 },
        beneficio: "O dano de seus ataques desarmados aumenta em 1 nível.",
        efeitos: [{ tipo: "nivelDano", valor: 1 }] },
      { n: 4, focos: 2, requisito: { tipo: "atributoOr", attrs: ["forca", "destreza"], valor: 16 },
        beneficio: "O dano de seus ataques desarmados aumenta em 2 níveis.",
        efeitos: [{ tipo: "nivelDano", valor: 2 }] },
    ],
    completo: {
      beneficio:
        "Você se torna altamente proficiente em luta, conseguindo extrair ao máximo de seu corpo e manobras. " +
        "Você recebe acesso ao efeito de crítico de ataques desarmados (pugilato). Além disso, você pode, uma " +
        "vez por rodada, escolher realizar uma rolagem de Acrobacia ou Atletismo com vantagem.",
    },
  },

  {
    id: "potencial_fisico",
    nome: "Treino de Potencial Físico",
    resumo:
      "O treino de potencial físico tem como objetivo extrair todo potencial físico que um corpo afetado pela restrição celestial possui. Este treino só pode ser realizado por Restringidos, além de poder utilizar qualquer atributo físico nas rolagens.",
    etapas: [
      { n: 1, focos: 1, requisito: null,
        beneficio: "Seu máximo de pontos de estamina aumenta em 2.",
        efeitos: [{ tipo: "pe", valor: 2 }] },
      { n: 2, focos: 1, requisito: { tipo: "nd", valor: 4 },
        beneficio: "Você recebe 2 pontos de atributo para distribuir entre seus atributos físicos.",
        efeitos: [{ tipo: "atributo", valor: 2 }] },
      { n: 3, focos: 1, requisito: null,
        beneficio: "Seu máximo de pontos de estamina aumenta em 4.",
        efeitos: [{ tipo: "pe", valor: 4 }] },
      { n: 4, focos: 2, requisito: null,
        beneficio: "Você recebe uma Dádiva do Céu adicional." },
    ],
    completo: {
      beneficio:
        "Você conseguiu chegar em um ponto onde seu corpo constantemente se renova e sua energia parece nunca " +
        "ter fim. Durante uma cena de combate, no começo de toda rodada, você recebe uma quantidade de pontos de " +
        "estamina temporários igual à metade do seu bônus de treinamento.",
    },
  },

  {
    id: "resistencia",
    nome: "Treino de Resistência",
    resumo:
      "O treino de resistência eleva o físico do feiticeiro, deixando-o mais resistente, vigoroso e aumentando a sua estamina.",
    etapas: [
      { n: 1, focos: 1, requisito: null,
        beneficio: "Seus pontos de vida máximos aumentam em 4.",
        efeitos: [{ tipo: "hp", valor: 4 }] },
      { n: 2, focos: 1, requisito: null,
        // Tabela: dados de vida por descanso (não é HP máx.). Planilha antiga dizia +5 HP aqui.
        beneficio: "Sua quantidade de dados de vida disponíveis por descanso aumenta em 2." },
      { n: 3, focos: 1, requisito: { tipo: "atributo", attr: "constituicao", valor: 14 },
        beneficio: "Recebe um bônus de +2 em rolagens de Fortitude.",
        efeitos: [{ tipo: "tr", tr: "fortitude", valor: 2 }] },
      { n: 4, focos: 2, requisito: { tipo: "atributo", attr: "constituicao", valor: 16 },
        beneficio: "Seus pontos de vida máximos aumentam em 6.",
        efeitos: [{ tipo: "hp", valor: 6 }] },
    ],
    completo: {
      beneficio:
        "Seu físico atinge um nível superior, concedendo-o uma grande resistência e vigor. Sua margem " +
        "necessária para conseguir um sucesso crítico em um TR de Fortitude reduz em 2. Uma vez por cena, " +
        "você ignora a primeira falha em testes de morte. Seus pontos de vida máximos aumentam em mais 10 pontos.",
      efeitos: [
        { tipo: "hp", valor: 10 },
        { tipo: "margemCriticoTR", tr: "fortitude", valor: 2 },
      ],
    },
  },

  // As três REPETÍVEIS ficam no fim: Manejo de Arma, Atributo, Perícia (nesta ordem).
  {
    id: "manejo_arma",
    nome: "Treino de Manejo de Arma",
    // Repetível: cada vez escolhe uma arma diferente ainda não treinada.
    repetivel: true,
    alvoTipo: "texto",       // alvo = nome da arma (sistema de armas ainda não existe)
    alvoLabel: "Arma",
    resumo:
      "O treino de manejo de arma permite ao feiticeiro se tornar mestre em uma arma específica, elevando seu nível de manejo com ela. Este treinamento pode ser repetido, mas escolhendo uma arma diferente, a qual ainda não tenha sido treinada.",
    etapas: [
      { n: 1, focos: 1, requisito: null,
        beneficio: "Escolha uma arma específica: você se torna treinado com ela. Caso já seja, adicione +2 em rolagens de dano com ela." },
      { n: 2, focos: 1, requisito: null,
        beneficio: "Você recebe um bônus de +1 em jogadas de ataque com a arma escolhida." },
      { n: 3, focos: 1, requisito: null,
        beneficio: "Enquanto estiver manejando a arma escolhida, você recebe acesso ao efeito crítico dela." },
      { n: 4, focos: 2, requisito: null,
        beneficio: "Você recebe +1 em jogadas de ataque e +2 em rolagens de dano com a arma escolhida." },
    ],
    completo: {
      beneficio:
        "Você se torna um mestre no manejo da arma para qual se dedicou a treinar e dominar. Enquanto estiver " +
        "manejando a arma escolhida, ela recebe um Encantamento de ferramenta amaldiçoada adicional.",
    },
  },

  {
    id: "atributo",
    nome: "Treino de Atributo",
    // Repetível: uma vez POR ATRIBUTO. Cada etapa dá +1 no atributo ESCOLHIDO, e
    // o Completo eleva o LIMITE dele em 2 (até 30).
    //
    // ⚠ As duas metades andam juntas desde 2026-07-29. O canal `atributo` das 4
    // etapas já aplicava, mas passava POR CIMA do limite de 20, e o Completo não
    // tinha efeito nenhum. Agora a etapa apara no limite, e o Completo é quem
    // sobe o limite, pelo canal `limiteAtributo`. Consequência de REGRA: a linha
    // inteira num atributo que já está no 20 rende +2, e não +4, porque o
    // Completo abre só 2 de espaço.
    repetivel: true,
    alvoTipo: "atributo",    // alvo = um dos 6 atributos
    alvoLabel: "Atributo",
    resumo:
      "Esse treinamento foca em melhorar as capacidades gerais do personagem em algum âmbito, seja aumentando sua força física, agilidade, resiliência ou mesmo sapiência ou capacidades sociais. Você pode realizar esse treinamento uma vez para cada atributo.",
    etapas: [
      { n: 1, focos: 1, requisito: null, beneficio: "O atributo escolhido aumenta em 1.", efeitos: [{ tipo: "atributo", valor: 1 }] },
      { n: 2, focos: 1, requisito: null, beneficio: "O atributo escolhido aumenta em 1.", efeitos: [{ tipo: "atributo", valor: 1 }] },
      { n: 3, focos: 1, requisito: null, beneficio: "O atributo escolhido aumenta em 1.", efeitos: [{ tipo: "atributo", valor: 1 }] },
      { n: 4, focos: 2, requisito: null, beneficio: "O atributo escolhido aumenta em 1.", efeitos: [{ tipo: "atributo", valor: 1 }] },
    ],
    completo: {
      beneficio:
        "Você aprimorou ao limite um de seus atributos, extraindo o máximo do seu potencial nessa área e " +
        "forçando-a a evoluir ainda mais, aumentando o valor de limite desse atributo em 2, até o máximo de 30.",
      efeitos: [{ tipo: "limiteAtributo", valor: 2 }],
    },
  },

  {
    id: "pericia",
    nome: "Treino de Perícia",
    // Repetível: cada vez escolhe uma perícia diferente ainda não treinada.
    repetivel: true,
    // O alvo é uma PERÍCIA do catálogo (afty-pericias.js), escolhida num
    // seletor. Era texto livre enquanto o sistema de perícias não existia.
    alvoTipo: "pericia",
    alvoLabel: "Perícia",
    resumo:
      "O treino de perícia envolve o domínio de uma habilidade específica, permitindo ao feiticeiro dominá-la em níveis superiores. Este treinamento pode ser repetido, mas escolhendo uma perícia diferente, a qual ainda não tenha sido treinada.",
    etapas: [
      // "Caso já seja" = `quandoProf`: o bônus só entra se a ficha JÁ tiver a
      // faixa. Quem não tem recebe a concessão de treino em vez do número.
      { n: 1, focos: 1, requisito: null,
        beneficio: "Escolha uma perícia: você se torna treinado nela. Caso já seja, adicione +1 em testes de perícia usando-a.",
        efeitos: [
          { tipo: "profPericia", valor: 1 },
          { tipo: "pericia", valor: 1, quandoProf: 1 },
        ] },
      { n: 2, focos: 1, requisito: null,
        beneficio: "Duas vezes por descanso, você pode escolher realizar um teste da perícia escolhida para o treinamento com vantagem." },
      { n: 3, focos: 1, requisito: null,
        beneficio: "Você se torna mestre na perícia escolhida. Caso já seja, adicione +2 em testes de perícia usando-a.",
        efeitos: [
          { tipo: "profPericia", valor: 2 },
          { tipo: "pericia", valor: 2, quandoProf: 2 },
        ] },
      { n: 4, focos: 2, requisito: null,
        beneficio: "Uma vez por cena, você pode escolher obter um sucesso garantido em um teste da perícia escolhida, desde que não seja um teste oposto." },
    ],
    completo: {
      beneficio:
        "Você treinou e se dedicou tanto a uma perícia específica, que ela se tornou algo no qual você é quase " +
        "incapaz de falhar, mantendo uma consistência invejável. Caso realize um teste da perícia escolhida e " +
        "obtenha um resultado menor do que 5 no d20, você pode o rolar novamente e manter o melhor resultado.",
    },
  },
];

const BY_ID = Object.fromEntries(AFTY_TREINAMENTOS.map((t) => [t.id, t]));

export function getTreinamento(id) {
  return BY_ID[id] || null;
}

/** Progresso máximo de uma linha (nº de etapas). */
export const ETAPAS_POR_LINHA = 4;

const clampProg = (x) => Math.max(0, Math.min(ETAPAS_POR_LINHA, Math.floor(Number(x) || 0)));

/**
 * Normaliza o estado de treinamentos da ficha. Cada linha vira:
 *   • NÃO repetível → número (progresso 0..4).
 *   • repetível     → array de instâncias [{ alvo, progresso 1..4 }],
 *                     sem alvos duplicados (comparação case-insensitive).
 * Descarta legados (ids desconhecidos, valores fora de faixa, shape errado).
 */
export function normalizeTreinamentos(treinos) {
  if (!treinos || Array.isArray(treinos) || typeof treinos !== "object") return {};
  const out = {};
  for (const [id, val] of Object.entries(treinos)) {
    const linha = BY_ID[id];
    if (!linha) continue;
    if (linha.repetivel) {
      if (!Array.isArray(val)) continue;
      const seen = new Set();
      const list = [];
      for (const it of val) {
        if (!it || typeof it !== "object") continue;
        const alvo = String(it.alvo ?? "").trim();
        const key = alvo.toLowerCase();
        if (!alvo || seen.has(key)) continue;
        const p = clampProg(it.progresso);
        if (p > 0) { seen.add(key); list.push({ alvo, progresso: p }); }
      }
      if (list.length) out[id] = list;
    } else {
      const p = clampProg(val);
      if (p > 0) out[id] = p;
    }
  }
  return out;
}

/** Lista de progressos ativos de uma linha (1 para não repetível, N para repetível). */
function progressosDe(linha, val) {
  if (!linha) return [];
  if (linha.repetivel) return Array.isArray(val) ? val.map((it) => it.progresso) : [];
  return [Number(val) || 0];
}

/**
 * Traduz um efeito do catálogo (`{ tipo, valor, trilha? }`) para o vocabulário
 * do Motor de Automação (`{ canal, expr, alvo? }`).
 *
 * Aptidão tem DOIS canais (decisão do autor, 2026-07-16):
 *   • `{ tipo:"aptidao", trilha:"bar" }` → concessão DIRECIONADA, grátis, não
 *     toca no orçamento. É o caso quando a regra nomeia a trilha ("Seu Nível de
 *     Aptidão em Barreiras aumenta em 1"). Vira `nivelAptidao` COM alvo.
 *   • `{ tipo:"aptidao" }` sem trilha → ponto de ORÇAMENTO livre, gasto onde o
 *     jogador quiser ("um nível de aptidão à sua escolha", Compreensão
 *     Completo). Vira `pontosAptidao`.
 *
 * `alvoInstancia` é o alvo da instância nas linhas repetíveis: no Treino de
 * Atributo é o atributo escolhido, e é o que faz o `+1` cair no lugar certo.
 */
function paraCanal(ef, alvoInstancia) {
  const valor = Number(ef?.valor) || 0;
  if (!valor) return null;
  const expr = String(valor);
  switch (ef.tipo) {
    case "hp": case "pe": case "movimento": case "defesa": case "iniciativa":
      return { canal: ef.tipo, expr };
    case "atributo":
      // Sem alvo não há onde somar: a linha repetível sempre traz um.
      return alvoInstancia ? { canal: "atributo", alvo: alvoInstancia, expr } : null;
    // Sobe o TETO do atributo, sem somar valor. Só o Completo do Treino de
    // Atributo usa ("aumentando o valor de limite desse atributo em 2").
    case "limiteAtributo":
      return alvoInstancia ? { canal: "limiteAtributo", alvo: alvoInstancia, expr } : null;
    case "aptidao":
      return ef.trilha
        ? { canal: "nivelAptidao", alvo: ef.trilha, expr }
        : { canal: "pontosAptidao", expr };
    // Bônus numa perícia: `pericia` nomeia (Acrobacia, Feitiçaria...), e sem
    // nome vale a perícia da instância (Treino de Perícia). `quandoProf` é o
    // "Caso já seja" do livro: o bônus só entra se a ficha JÁ tiver aquela
    // faixa, senão o que vale é a concessão de treino logo abaixo.
    case "pericia": {
      const alvo = ef.pericia || alvoInstancia;
      if (!alvo) return null;
      const out = { canal: "bonusPericia", alvo, expr };
      if (ef.quandoProf) out.quando = `prof_${alvo} >= ${ef.quandoProf}`;
      return out;
    }
    case "tr":
      return ef.tr ? { canal: "bonusTR", alvo: ef.tr, expr } : null;
    // Manobra: Agarrar, Derrubar, Desarmar ou Empurrar.
    case "manobra":
      return ef.manobra ? { canal: "bonusManobra", alvo: ef.manobra, expr } : null;
    // Reduz a margem de crítico de UM Teste de Resistência.
    case "margemCriticoTR":
      return ef.tr ? { canal: "margemCriticoTR", alvo: ef.tr, expr } : null;
    case "ataque":
      return ef.ataque ? { canal: "bonusAcerto", alvo: ef.ataque, expr } : null;
    // Nível de Dano soma no ND, e só no cálculo de dano. "Desarmados" é o
    // Ataque Básico, que engloba Desarmado, Faixas e Manoplas.
    case "nivelDano":
      return { canal: "nivelDano", alvo: "basico", expr };
    // Concede a faixa de treino numa perícia: 1 = Treinado, 2 = Mestre.
    case "profPericia":
      return alvoInstancia ? { canal: "proficienciaPericia", alvo: alvoInstancia, expr } : null;
    default:
      return null;
  }
}

/**
 * Efeitos dos Treinamentos no vocabulário do Motor de Automação, até o
 * progresso de cada linha/instância.
 *
 * ⚠ Absorvido pelo Motor em 2026-07-27 (decisão do autor). Antes isto era um
 * agregador paralelo com canais próprios (`{ hp, pe, movimento, aptidao,
 * atributo, defesa, aptidaoTrilha }`) e valores fixos, o que dava DOIS
 * vocabulários de canal no mesmo sistema. Agora emite `{ canal, expr }` igual
 * a qualquer outra fonte de efeito, e o `origem`/`nome` alimenta o detalhamento
 * da UI. Ganho de brinde: o Treino de Atributo, cujo canal era somado e depois
 * ignorado, passou a aplicar de verdade no atributo escolhido.
 */
/**
 * Rótulo legível do alvo de uma instância repetível. Atributo e Perícia saem do
 * catálogo (com acento e maiúscula), e o texto livre do Manejo de Arma ganha ao
 * menos a inicial maiúscula. É o que aparece no nome do treino, tanto na aba de
 * Interlúdios quanto no hover de fontes de um valor.
 */
export function rotuloAlvo(linha, alvo) {
  if (!alvo) return "";
  if (linha?.alvoTipo === "atributo") return AFTY_ATTRS.find((a) => a.key === alvo)?.label ?? alvo;
  if (linha?.alvoTipo === "pericia") return AFTY_PERICIAS.find((p) => p.id === alvo)?.nome ?? alvo;
  const s = String(alvo);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** A linha de treino está disponível para esta origem? */
export const treinoDisponivel = (linha, origemId) =>
  !(linha?.foraDaOrigem ?? []).includes(origemId);

/** As linhas de treino que a origem alcança (a Maldição não tem Energia Reversa). */
export const treinamentosDaOrigem = (origemId) =>
  AFTY_TREINAMENTOS.filter((l) => treinoDisponivel(l, origemId));

export function efeitosDeTreino(creature) {
  const origemId = creature?.core?.origem?.id;
  const prog = normalizeTreinamentos(creature?.treinamentos);
  const out = [];
  const add = (efeitos, linha, alvo) => {
    for (const ef of efeitos || []) {
      const conv = paraCanal(ef, alvo);
      if (!conv) continue;
      out.push({
        ...conv,
        origem: linha.id,
        nome: alvo && linha.repetivel ? `${linha.nome} (${rotuloAlvo(linha, alvo)})` : linha.nome,
      });
    }
  };
  for (const [id, val] of Object.entries(prog)) {
    const linha = BY_ID[id];
    if (!linha) continue;
    // Treino que a origem não alcança não rende efeito, mesmo gravado na ficha.
    if (!treinoDisponivel(linha, origemId)) continue;
    const instancias = linha.repetivel && Array.isArray(val)
      ? val
      : [{ alvo: null, progresso: Number(val) || 0 }];
    for (const inst of instancias) {
      const p = clampProg(inst.progresso);
      for (const et of linha.etapas) if (et.n <= p) add(et.efeitos, linha, inst.alvo);
      if (p >= ETAPAS_POR_LINHA) add(linha.completo?.efeitos, linha, inst.alvo);
    }
  }
  return out;
}

/** Custo em Focos de uma linha até um dado progresso (0..4). */
export function focosDaLinha(linha, progresso) {
  if (!linha) return 0;
  return linha.etapas.reduce((s, et) => (et.n <= progresso ? s + (et.focos || 0) : s), 0);
}

/**
 * Total de Focos gastos por todos os treinamentos da ficha (soma instâncias).
 * `origemId` faz a linha indisponível deixar de cobrar: quem trocou para
 * Maldição depois de gastar no Treino de Energia Reversa recebe os Focos de
 * volta, em vez de pagar por um treino que a aba nem mostra mais.
 */
export function focosGastos(treinos, origemId = null) {
  const prog = normalizeTreinamentos(treinos);
  let total = 0;
  for (const [id, val] of Object.entries(prog)) {
    const linha = BY_ID[id];
    if (!treinoDisponivel(linha, origemId)) continue;
    for (const p of progressosDe(linha, val)) total += focosDaLinha(linha, p);
  }
  return total;
}

/**
 * Avalia um requisito de etapa contra o contexto da ficha
 * (ctx = { attrEff, nd }). Requisitos verificáveis (atributo,
 * atributoOr, nd) bloqueiam quando não atendidos; "nota"
 * referencia sistemas ainda não construídos (não bloqueia).
 * Retorna { ok, verificavel, label }.
 */
export function avaliarRequisito(requisito, ctx = {}) {
  const attrEff = ctx.attrEff || {};
  const nd = ctx.nd ?? 0;
  if (!requisito) return { ok: true, verificavel: true, label: null };
  if (requisito.tipo === "atributo") {
    const atual = attrEff[requisito.attr] ?? 0;
    const nomeAttr = ATTR_LABEL[requisito.attr] || requisito.attr;
    return { ok: atual >= requisito.valor, verificavel: true, label: `${nomeAttr} ${requisito.valor}` };
  }
  if (requisito.tipo === "atributoOr") {
    const melhor = Math.max(...requisito.attrs.map((a) => attrEff[a] ?? 0));
    const nomes = requisito.attrs.map((a) => ATTR_LABEL[a] || a).join(" ou ");
    return { ok: melhor >= requisito.valor, verificavel: true, label: `${nomes} ${requisito.valor}` };
  }
  if (requisito.tipo === "nd") {
    return { ok: nd >= requisito.valor, verificavel: true, label: `Nível de Personagem ${requisito.valor}` };
  }
  // nota (aptidão/feature de sistema não construído): exibe, não bloqueia.
  return { ok: true, verificavel: false, label: requisito.label };
}

const ATTR_LABEL = {
  forca: "Força", destreza: "Destreza", constituicao: "Constituição",
  inteligencia: "Inteligência", sabedoria: "Sabedoria", presenca: "Presença",
};
