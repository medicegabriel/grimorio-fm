import { getBonusTreinamento } from "./fm-tables";

// ============================================================
// fm-dotes.js — Catálogo de Dotes Gerais
// ============================================================
// Cada Dote define nome e descrição. Alguns têm:
//   - descriptionFn: descrição dinâmica que injeta valores
//     calculados (BT, ND) no texto, no molde de fm-treinamentos.js.
//   - automation: efeito programado na ficha. Kinds:
//       "stat_bonus"          → soma em Atenção/Iniciativa (campos
//                               fixos atencao/iniciativa) e/ou bônus
//                               por ND (atencaoPerNd, percepcaoPerHalfNd).
//       "aptidao_budget_bonus"→ +N no orçamento de Aptidões.
//       "condicao_imune_grant"→ injeta imunidades a condição no draft
//                               (via syncDotesDerived, locked/idempotente).
//       "sub_choice"          → exige escolher 1 sub-opção (sem efeito
//                               derivado hoje; só registra a escolha).
//   - prereq: pré-requisitos verificáveis → viram avisos não-bloqueantes
//     em validateDraft (getDotePrereqWarnings). Requisitos que não dá
//     pra checar no draft ficam só inline na descrição.
//   - excludes: keys de Dotes mutuamente exclusivos (apenas aviso).
//
// Requisitos textuais ficam inline na descrição entre colchetes, como
// os Treinamentos apresentam ("[Pré-Requisito: ...]").
// ============================================================

// Textos-base reusados por descriptionFn (evita duplicar o texto).
const DESC_DESTRUINDO =
  "O ambiente é apenas uma ferramenta para você, sendo utilizado apenas para machucar ainda mais seus inimigos. Uma vez por rodada, ao acertar um ataque desarmado ou armado, você empurra o alvo por 1,5m + 1,5m multiplicado pela metade do seu BT, forçando-o a realizar um TR de Fortitude, reduzindo a distância à metade em um sucesso. Se o objeto tiver sua vida zerada pelo dano, o alvo empurrado continua sendo empurrado, mas a distância restante é reduzida à metade.";

const DESC_EXPLOSAO =
  "Um bom desempenho em uma conjuração o permite aumentar o poder destrutivo, encadeando a força. Ao rolar o dano máximo em um dado de dano de um Feitiço de dano, você rola mais um dado de dano de mesmo valor, adicionando o resultado ao total de dano. Tal habilidade funciona apenas uma vez por dado do Feitiço: caso role-se um dado adicional por causa de Explosão Encadeada e tal seja dano máximo, não se ativa novamente. Focando em sobrecarregar as suas habilidades, você pode consumir energia para a deixar quase impossível de resistir. Quando usar um Feitiço que força um teste de resistência você pode gastar pontos de energia amaldiçoada igual ao seu bônus de treinamento para aumentar a dificuldade do teste. Para cada ponto gasto, a dificuldade aumenta em 1.";

const DESC_MENTE_CORPO =
  "Sua mente é imperturbável durante uma boa luta. Você recebe uma quantidade de vantagens igual ao seu bônus de treinamento para resistir a condições mentais e físicas.";

const DESC_SENTIDOS_AFIADOS =
  "Sua atenção para os arredores nunca falha, usando da energia amaldiçoada para sentir seus arredores e perceber coisas que os outros não conseguem. Sua Atenção aumenta em um valor igual a sua ND, assim como você soma metade desse valor em rolagens de Percepção. Além disso, você pode gastar 2 PE para que, ao estar no ar, você o use como plataforma, se mantendo de pé no ar; você não pode ativamente subir enquanto manter esse efeito, mas pode saltar para subir mais. Esse efeito também pode ser usado como reação ao sofrer dano de queda, o anulando completamente. [Pré-Requisito: Não pode ter o talento Sentidos Atentos]";

const fmtMeters = (n) =>
  Number.isInteger(n) ? `${n}` : n.toFixed(1).replace(".", ",");

export const DOTES_OFICIAIS = [
  {
    key: "abencoado_sorte",
    nome: "Abençoado pela Sorte",
    descricao:
      "Você tem uma sorte inexplicável, a qual o favorece nos momentos mais críticos. Você tem 3 pontos de sorte. Sempre que fizer uma rolagem, você pode gastar um ponto de sorte para rolar outro d20, podendo escolher usar qualquer um dos dois resultados. Você pode escolher rolar o outro dado após ver o resultado da primeira rolagem, mas antes de ver as consequências. Quando um inimigo conseguir um 20 em uma jogada de ataque para acertar, você recupera 1 ponto de sorte. Você recupera seus pontos de sorte após um descanso longo.",
  },
  {
    key: "aparar_ataque",
    nome: "Aparar Ataque",
    descricao:
      "Uma vez por rodada você rebate um ataque com outro ataque, assim conseguindo aparar um golpe. Quando for alvo de um ataque corpo a corpo, você pode gastar sua reação para realizar uma jogada de ataque contra o atacante. Caso seu teste supere o do inimigo, você evita o ataque. Caso tenha mais de uma reação você consegue redirecionar um golpe direcionado a você, mudando o alvo gastando 2 PE e mais uma reação: escolha outra criatura dentro do alcance do golpe e, caso o resultado da jogada de ataque dela seja superior à Defesa do novo alvo, ele recebe o ataque.",
  },
  {
    key: "assumir_postura",
    nome: "Assumir Postura",
    descricao:
      "A postura que uma pessoa mantém em combate molda suas capacidades, fornecendo grandes benefícios. Ao obter esta habilidade, você recebe acesso às posturas, explicadas e listadas no final da especialização. Entrar em uma postura é uma ação bônus.\n\n• Postura da Fortuna. Enquanto estiver na postura da fortuna, ao rodar um d20 e conseguir um resultado igual ou menor ao seu bônus de treinamento, você pode escolher rolar novamente, ficando com o maior resultado. Você pode utilizar este efeito uma quantidade de vezes igual a metade do seu bônus de treinamento por rodada e apenas uma vez no mesmo dado.\n\n• Postura da Tempestade. Enquanto na postura da tempestade, sempre que acertar um ataque o alvo realiza um TR de Fortitude, sendo derrubado em uma falha. Caso acerte um ataque em um alvo já caído, ele deve repetir o teste e, caso falhe, fica imóvel até o começo do seu turno. [Pré-Requisito: ND 10]",
  },
  {
    key: "atracao_combate",
    nome: "Atração em Combate",
    descricao:
      "Não só provocar, mas você é capaz de se transformar no centro da atenção daquele que você deseja desafiar. Uma criatura que seja afetada por uma ação de Provocar sua, ao invés de receber desvantagem para atacar outras criaturas, só pode realizar ataques contra você até que suceda em um teste para escapar da provocação. [Pré-Requisito: 20 de Presença e dominância em Intimidação.]",
    prereq: { presenca: 20, skillMastered: "intimidacao", skillMasteredLabel: "Intimidação" },
  },
  {
    key: "bela_tentativa",
    nome: "Bela Tentativa",
    descricao:
      "Caso esteja utilizando armas, elas são basicamente extensões do seu corpo e um desarme é uma oportunidade de destruir seus inimigos. Ao suceder em desarmar um alvo, você pode gastar 2 pontos de energia amaldiçoada para, como uma reação, realizar um ataque com a arma desarmada contra o mesmo alvo do desarme. Caso esteja com a arma de seu inimigo, como uma ação comum pode realizar um teste de feitiçaria com CD: 25 + 10 para cada grau da arma; caso passe pode danificar a arma e, caso suceda em 3 testes, você quebra a arma da criatura.",
  },
  {
    key: "destruindo_tudo",
    nome: "Destruindo Tudo",
    descricao: DESC_DESTRUINDO,
    descriptionFn: (ctx) => {
      const bt = getBonusTreinamento(ctx?.core?.nd ?? 1);
      const extra = 1.5 * Math.floor(bt / 2);
      const total = 1.5 + extra;
      return `${DESC_DESTRUINDO}\n\nEmpurrão atual: 1,5m + ${fmtMeters(extra)}m = ${fmtMeters(total)}m (1,5m × ½ BT +${bt}).`;
    },
  },
  {
    key: "dominio_fundamentos",
    nome: "Domínio dos Fundamentos",
    descricao:
      "Você tem uma maior dominância sobre os fundamentos da energia amaldiçoada e das suas habilidades. Você pode escolher uma das mudanças de Fundamento abaixo.",
    automation: {
      kind: "sub_choice",
      label: "Fundamento escolhido",
      options: [
        {
          value: "cruel",
          label: "Feitiço Cruel",
          texto:
            "Quando usar um Feitiço que força um Teste de Resistência, você pode gastar 1 ponto de energia amaldiçoada para aumentar a CD do teste em 2, ou 2 pontos para aumentar em 4.",
        },
        {
          value: "duplicado",
          label: "Feitiço Duplicado",
          texto:
            "Uma vez por rodada, quando usar um Feitiço de dano cujo alvo seja apenas uma criatura, você pode gastar pontos de energia para dar um segundo alvo à habilidade. O custo para reproduzir a habilidade em outra criatura é 5 PE.",
        },
      ],
    },
  },
  {
    key: "estudo_amaldicoado",
    nome: "Estudo Amaldiçoado",
    descricao:
      "Você estuda sobre a energia amaldiçoada ao máximo, conseguindo descobrir uma nova maneira de a utilizar. Ao obter este talento, você pode escolher dois Níveis de Aptidão diferentes para serem aumentados em 1. [Pré-Requisito: ND 10 Comum, Desafio ou Calamidade]",
    automation: { kind: "aptidao_budget_bonus", amount: 2 },
    prereq: { nd: 10 },
  },
  {
    key: "expansao_maestral",
    nome: "Expansão Maestral",
    descricao:
      "Você pode utilizar expansões de domínio possuindo apenas uma mão livre, e expandir o domínio não causa ataques de oportunidade em você. [Pré-Requisito: Expansão de Domínio Completa]",
  },
  {
    key: "explosao_cadeia",
    nome: "Explosão em Cadeia",
    descricao: DESC_EXPLOSAO,
    descriptionFn: (ctx) => {
      const bt = getBonusTreinamento(ctx?.core?.nd ?? 1);
      return `${DESC_EXPLOSAO}\n\nPE máx. p/ aumentar a dificuldade do TR: ${bt} (= BT) → +${bt} na CD.`;
    },
  },
  {
    key: "furia_berserker",
    nome: "Fúria Berserker",
    descricao:
      "Durante uma cena de combate uma criatura pode entrar em fúria e liberar seu potencial bestial, se tornando imune a condições que o imobilizam ou que façam ele perder a consciência, porém, a criatura só poderá ter como alvo uma única criatura até que um dos dois cheguem a 0 pontos de vida. Recebe 2 pontos de exaustão caso esteja de pé e a criatura alvo caia. Você consegue sempre perceber um ponto cego na guarda do inimigo, se posicionando em tal. Se mover pelo espaço de um inimigo não conta como terreno difícil, e sempre que você estiver no espaço de um inimigo, faz com que ataques contra você tenham 40% de chance de falhar (1 a 4 em 1d10). A partir do patamar desafio, você pode realizar uma rolagem de furtividade contra um alvo ao qual esteja dentro do espaço dele; caso seu resultado seja superior ao valor de atenção dele, faz com que os ataques da criatura alvo tenham 60% de chance de falhar (1 a 6 em 1d10).",
    // Automação interna (motor) — D5: a imunidade vale SÓ enquanto em fúria
    // (Liga/Desliga no tracker), não é permanente. Por isso NÃO usa mais o
    // `condicao_imune_grant` do builder (que a deixava sempre ligada na ficha).
    motorAuto: {
      rules: [{
        name: "Entrar em Fúria",
        trigger: { type: "activated" },
        activation: "toggle",
        cost: { pe: 0, acao: "" },
        effects: [{
          type: "condition_immunity",
          conditions: ["imovel", "paralisado", "inconsciente", "agarrado", "enredado", "atordoado"],
        }],
      }],
    },
  },
  {
    key: "imitacao",
    nome: "Imitação",
    descricao:
      "Você consegue imitar técnicas e estilos de combate de outras pessoas; uma vez que você consegue enxergar a técnica/estilo de combate, consegue a reproduzir perfeitamente, recebendo um bônus de +2 para acertar, causando +5 de dano fixo e +3 na Defesa. Uma vez por turno, ao realizar um ataque surpresa ou contra um inimigo desprevenido, você pode adicionar +1 dado de dano.",
    // Automação interna (motor) — só a parte SUSTENTADA: enquanto imitando, +2
    // Acerto, +3 Defesa e +5 de dano fixo. O "+1 dado por turno em alvo
    // desprevenido" é condicional (gatilho de evento) e fica para fase futura.
    motorAuto: {
      rules: [{
        name: "Imitação",
        trigger: { type: "activated" },
        activation: "toggle",
        cost: { pe: 0, acao: "" },
        effects: [
          { type: "modify_stat", stat: "acerto", op: "add", value: 2, stack: "highest", duration: { kind: "manual" } },
          { type: "modify_stat", stat: "defesa", op: "add", value: 3, stack: "highest", duration: { kind: "manual" } },
          { type: "action_damage", scope: "corporal", amount: 0, fixed: 5, duration: { kind: "manual" } },
        ],
      }],
    },
  },
  {
    key: "membro_fantasma",
    nome: "Membro Fantasma",
    descricao:
      "Atacar a uma distância grande não impõe desvantagem no seu ataque. Seus ataques a distância ignoram meia cobertura e 3/4 de cobertura. Antes de fazer um ataque você pode escolher receber uma penalidade de -10 para acertar em troca de desabilitar um membro do corpo de uma criatura por 1 rodada (aura anuladora pode remover ao custo de 10 PE). Caso esteja usando uma arma a distância, a desvantagem de atirar corpo-a-corpo é removida. [Pré-Requisito: ND 10 Desafio e Calamidade.]",
    prereq: { nd: 10 },
  },
  {
    key: "mente_corpo_equilibrio",
    nome: "Mente e Corpo em Equilíbrio",
    descricao: DESC_MENTE_CORPO,
    descriptionFn: (ctx) => {
      const bt = getBonusTreinamento(ctx?.core?.nd ?? 1);
      return `${DESC_MENTE_CORPO}\n\nVantagens para resistir a condições mentais/físicas: ${bt} (= BT).`;
    },
  },
  {
    key: "posicionamento_ameacador",
    nome: "Posicionamento Ameaçador",
    descricao:
      "Você sabe se posicionar de maneira estratégica, fazendo com que um inimigo que possa o ver te reconheça como uma constante ameaça, mesmo distante. A menos que esteja furtivo, toda criatura que estiver a 3 metros de você tem sua defesa reduzida em 2. Ao acertar uma criatura com um ataque de oportunidade, o movimento dela é reduzido a 0 até o final do turno dela.",
  },
  {
    key: "presenca_aterrorizante",
    nome: "Presença Aterrorizante",
    descricao:
      "Seus inimigos não possuem apenas medo ao olhar para você, eles sentem algo que nunca sentiram antes, um pavor inestimável por você estar do outro lado do tabuleiro. Todos aqueles que te verem pela primeira vez devem realizar um TR de vontade; aqueles que falharem ficam com a condição de Apavorado, aqueles que tiverem um sucesso ficam com a condição de Amedrontado e aqueles que tiverem um sucesso crítico ignoram ambas as condições. Aqueles que estiverem Apavorados ou Amedrontados repetem o teste no início de seus turnos; ao obterem sucesso, reduzem o nível da condição em 1 (Apavorado → Amedrontado → Abalado → nada), em um sucesso crítico removem duas etapas. [Pré-Requisito: Calamidade de Grau 1]",
    prereq: { patamar: "calamidade", patamarLabel: "patamar Calamidade" },
  },
  {
    key: "purificacao_alma",
    nome: "Purificação da Alma",
    descricao:
      "Você entende seu eu verdadeiro por inteiro, sendo capaz de enxergar até mesmo o traçado de uma alma. Ao utilizar uma ação de cura, com energia reversa ou não, você pode abdicar de metade dessa cura e passar para sua integridade, sendo limitado a utilizar este dote apenas uma vez por descanso longo.",
  },
  {
    key: "reacao_necessaria",
    nome: "Reação Necessária",
    descricao:
      "Você sabe que, em certos momentos, sua reação é necessária, mesmo que isso signifique ir além do esperado. Uma vez por rodada, caso não possua uma reação, você pode gastar 3 pontos de energia amaldiçoada para realizar uma reação adicional. Se você receber dano de um inimigo que esteja dentro de seu alcance, você pode gastar 2 pontos de estamina e usar sua reação para realizar um ataque contra ele.",
  },
  {
    key: "sentidos_afiados",
    nome: "Sentidos Afiados",
    descricao: DESC_SENTIDOS_AFIADOS,
    descriptionFn: (ctx) => {
      const nd = Number(ctx?.core?.nd) || 0;
      return `${DESC_SENTIDOS_AFIADOS}\n\nAtenção +${nd} (= ND); Percepção +${Math.floor(nd / 2)} (= ½ ND).`;
    },
    automation: { kind: "stat_bonus", atencaoPerNd: 1, percepcaoPerHalfNd: 1 },
    excludes: ["sentidos_atentos"],
  },
  {
    key: "sentidos_atentos",
    nome: "Sentidos Atentos",
    descricao:
      "Sua atenção para os arredores nunca falha, mantendo seus sentidos afiados. Você recebe um bônus de +5 em sua Atenção e não pode ser surpreendido caso esteja consciente. Preparado para agir sob pressão e urgência, você sabe como reagir o mais rápido possível. Você recebe +5 de Iniciativa. Após a rolagem de iniciativa, caso você não seja o primeiro, você pode rolar novamente, ficando com o melhor resultado. [Pré-Requisito: Não pode ter o talento Sentidos Afiados]",
    automation: { kind: "stat_bonus", atencao: 5, iniciativa: 5 },
    excludes: ["sentidos_afiados"],
  },
  {
    key: "ultima_investida",
    nome: "Última Investida",
    descricao:
      "Ao reconhecer que em breve você irá cair, você entrega toda sua força e energia antes da derrota inevitável. Se você for cair para 0 de vida, pode gastar uma reação para realizar um ataque ou feitiço de alvo único, causando dano máximo contra uma criatura a até 6 metros de você. [Pré-Requisito: Não possuir Desafiando a Morte]",
  },
  {
    key: "voto_malevolente",
    nome: "Voto Malevolente",
    descricao:
      "Você sabe como manter sua cabeça fria mesmo nos momentos mais tensos, lembrando-se da malícia ao criar votos. Ao realizar votos emergenciais, o voto não precisa ter um malefício maior que o benefício, sendo realizado normalmente. [Pré-Requisito: ND 8 Comum, Desafio, ou Calamidade]",
    prereq: { nd: 8 },
  },
];

// Mapas rápidos
const BY_NOME = Object.fromEntries(DOTES_OFICIAIS.map((d) => [d.nome, d]));
const BY_KEY = Object.fromEntries(DOTES_OFICIAIS.map((d) => [d.key, d]));

export const getDoteByNome = (nome) => BY_NOME[nome] ?? null;
export const getDoteByKey = (key) => BY_KEY[key] ?? null;

/**
 * Texto de exibição de um dote, resolvido no contexto da ficha.
 * - `descriptionFn`: injeta valores calculados (BT, ND) no texto.
 * - sub-escolha (sub_choice): com uma opção escolhida, mostra só ela;
 *   sem escolha (ex.: card do seletor), lista todas as opções.
 * ctx = { core, attributes, subChoice }.
 */
export function resolveDoteDescription(dote, ctx = {}) {
  if (!dote) return "";
  const base =
    typeof dote.descriptionFn === "function"
      ? dote.descriptionFn({ core: ctx.core, attributes: ctx.attributes })
      : dote.descricao;
  const auto = dote.automation;
  if (auto?.kind !== "sub_choice") return base;
  const opts = auto.options || [];
  const fmt = (o) => `• ${o.label}. ${o.texto}`;
  if (ctx.subChoice) {
    const chosen = opts.find((o) => o.value === ctx.subChoice);
    if (chosen) return `${base}\n\n${fmt(chosen)}`;
  }
  return [base, ...opts.map(fmt)].join("\n\n");
}

// ============================================================
// LIMITE DE DOTES — quantidade máxima por Patamar × ND
// ============================================================
// Lacaio e Capanga não recebem dotes. Os demais escalam com o ND
// (mapa esparso: a chave é o ND, o valor é o máximo de dotes).
export const DOTE_LIMITS = {
  lacaio: {},
  capanga: {},
  comum: {
    1: 1, 2: 1, 3: 1, 4: 1, 5: 2, 6: 2, 7: 2, 8: 2, 9: 3, 10: 3,
    11: 3, 12: 3, 13: 4, 14: 4, 15: 4, 16: 4, 17: 5, 18: 5, 19: 5, 20: 5,
  },
  desafio: {
    3: 1, 4: 1, 5: 2, 6: 2, 7: 2, 8: 2, 9: 3, 10: 3,
    11: 3, 12: 3, 13: 4, 14: 4, 15: 4, 16: 4, 17: 5, 18: 5, 19: 5, 20: 5,
  },
  calamidade: {
    5: 2, 6: 2, 7: 2, 8: 2, 9: 3, 10: 3, 11: 3, 12: 3, 13: 4, 14: 4,
    15: 4, 16: 4, 17: 5, 18: 5, 19: 5, 20: 6, 21: 6, 22: 6, 23: 6, 24: 6,
    25: 6, 26: 6, 27: 7, 28: 7, 29: 7, 30: 7,
  },
};

/**
 * Máximo de Dotes para um Patamar + ND. Usa o valor da maior faixa de
 * ND ≤ o informado (clampa pra cima quando o ND passa do topo da tabela;
 * retorna 0 quando abaixo da menor faixa ou em Lacaio/Capanga).
 */
export function getDoteLimit(patamar, nd) {
  const table = DOTE_LIMITS[patamar];
  if (!table) return 0;
  const n = Number(nd) || 0;
  let limit = 0;
  let bestKey = -Infinity;
  for (const [key, val] of Object.entries(table)) {
    const k = Number(key);
    if (k <= n && k > bestKey) {
      bestKey = k;
      limit = val;
    }
  }
  return limit;
}

// ============================================================
// HELPERS DE DERIVAÇÃO
// ============================================================
// Resolve a entrada do catálogo de cada dote do draft. Dotes custom
// (tipo:"custom") são ignorados — não há como saber o efeito. Itens
// novos têm key; legados podem ter só nome (fallback).
const officialDoteEntries = (dotes = []) =>
  dotes
    .map((d) => {
      if (d.tipo === "custom") return null;
      return d.key ? BY_KEY[d.key] : BY_NOME[d.nome];
    })
    .filter(Boolean);

/** Bônus de Atenção concedido pelos dotes (fixo + por ND). */
export function getDotesAtencaoBonus(dotes = [], nd = 0) {
  const ndNum = Number(nd) || 0;
  return officialDoteEntries(dotes).reduce((sum, d) => {
    const a = d.automation;
    if (a?.kind !== "stat_bonus") return sum;
    return sum + (a.atencao || 0) + (a.atencaoPerNd || 0) * ndNum;
  }, 0);
}

/** Bônus de Iniciativa concedido pelos dotes. */
export function getDotesIniciativaBonus(dotes = []) {
  return officialDoteEntries(dotes).reduce((sum, d) => {
    const a = d.automation;
    if (a?.kind !== "stat_bonus") return sum;
    return sum + (a.iniciativa || 0);
  }, 0);
}

/** Bônus em rolagens de Percepção concedido pelos dotes (por ½ ND). */
export function getDotesPercepcaoBonus(dotes = [], nd = 0) {
  const halfNd = Math.floor((Number(nd) || 0) / 2);
  return officialDoteEntries(dotes).reduce((sum, d) => {
    const a = d.automation;
    if (a?.kind !== "stat_bonus") return sum;
    return sum + (a.percepcaoPerHalfNd || 0) * halfNd;
  }, 0);
}

/** +N no orçamento de Aptidões (Estudo Amaldiçoado). */
export function getDotesAptidaoBudgetBonus(dotes = []) {
  return officialDoteEntries(dotes).reduce(
    (sum, d) =>
      d.automation?.kind === "aptidao_budget_bonus" ? sum + (d.automation.amount || 0) : sum,
    0
  );
}

/** Lista (sem duplicatas) de condições a que os dotes concedem imunidade. */
export function getDoteCondicoesImunes(dotes = []) {
  const out = [];
  for (const d of officialDoteEntries(dotes)) {
    if (d.automation?.kind === "condicao_imune_grant") {
      out.push(...(d.automation.condicoes || []));
    }
  }
  return [...new Set(out)];
}

// Kinds que ganham o badge "Programada" (efeito real na ficha).
const BADGED_DOTE_KINDS = new Set(["stat_bonus", "aptidao_budget_bonus", "condicao_imune_grant"]);

/** True se um dote oficial tem automação real (badge "Programada"). */
export function isAutomatedDote(dote) {
  return !!dote && BADGED_DOTE_KINDS.has(dote.automation?.kind);
}

const stripDiacritics = (s) =>
  (s || "").toString().normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

/**
 * Avisos de pré-requisito não-bloqueantes para os dotes do draft.
 * Só checa o que dá pra verificar no draft (ND, atributo, perícia
 * dominada, patamar). Retorna [{ nome, message }].
 */
export function getDotePrereqWarnings(dotes = [], ctx = {}) {
  const { core = {}, attributes = {}, skills = [] } = ctx;
  const nd = Number(core.nd) || 0;
  const out = [];
  for (const d of officialDoteEntries(dotes)) {
    const p = d.prereq;
    if (!p) continue;
    const fails = [];
    if (p.nd && nd < p.nd) fails.push(`ND ${p.nd}`);
    if (p.presenca && (Number(attributes.presenca) || 0) < p.presenca) {
      fails.push(`${p.presenca} de Presença`);
    }
    if (p.skillMastered) {
      const has = skills.some(
        (s) => stripDiacritics(s.name) === p.skillMastered && s.mastered
      );
      if (!has) fails.push(`dominância em ${p.skillMasteredLabel || p.skillMastered}`);
    }
    if (p.patamar && core.patamar !== p.patamar) {
      fails.push(p.patamarLabel || p.patamar);
    }
    if (fails.length) {
      out.push({ nome: d.nome, message: `${d.nome} requer ${fails.join(", ")}.` });
    }
  }
  return out;
}

/**
 * Conflitos de exclusividade mútua entre os dotes do draft (apenas
 * aviso). Retorna [{ nome, conflito }] para cada par em conflito.
 */
export function getDoteExclusionWarnings(dotes = []) {
  const entries = officialDoteEntries(dotes);
  const presentKeys = new Set(entries.map((d) => d.key));
  const seen = new Set();
  const out = [];
  for (const d of entries) {
    for (const exKey of d.excludes || []) {
      if (!presentKeys.has(exKey)) continue;
      // Dedupe por par (A↔B aparece só uma vez, não A→B e B→A).
      const pairKey = [d.key, exKey].sort().join("|");
      if (seen.has(pairKey)) continue;
      seen.add(pairKey);
      const other = BY_KEY[exKey];
      out.push({ nome: d.nome, conflito: other?.nome || exKey });
    }
  }
  return out;
}

/**
 * Avisos para dotes com sub-escolha obrigatória ainda não definida
 * (ex.: Domínio dos Fundamentos sem fundamento escolhido). Itera as
 * instâncias do draft (precisa do d.subChoice salvo), não o catálogo.
 */
export function getDoteSubChoiceWarnings(dotes = []) {
  const out = [];
  for (const d of dotes) {
    if (d.tipo === "custom") continue;
    const cat = d.key ? BY_KEY[d.key] : BY_NOME[d.nome];
    if (cat?.automation?.kind === "sub_choice" && !d.subChoice) {
      const opcoes = (cat.automation.options || []).map((o) => o.label).join(" ou ");
      out.push({ nome: cat.nome, message: `${cat.nome}: escolha ${opcoes}.` });
    }
  }
  return out;
}
