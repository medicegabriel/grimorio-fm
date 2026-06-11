import { getBonusTreinamento } from "./fm-tables";

// ============================================================
// fm-treinamentos.js — Catálogo de Treinamentos
// ============================================================
// Cada treinamento define nome, descrição (estática ou via
// descriptionFn) e, opcionalmente, um bloco automation.kind:
//
//   "tr_crit_margin"        → reduz em N a margem de crítico de um TR
//                              (default 20). Lido em fm-derive.js.
//   "aptidao_bar_bonus"     → +1 nível de Aptidão Barreira (somado em
//                              derive, sem alterar input).
//   "aptidao_budget_bonus"  → +1 ponto no orçamento de Aptidões.
//   "aptidao_especial_grant"→ injeta uma aptidão especial em
//                              draft.aptidoesEspeciais como locked.
//   "pe_temp_bt"            → info: ganha ½ BT em PE temp/rodada.
//   "estamina_temp_bt"      → info: ganha ½ BT em estamina temp/rodada.
//   "info_only"             → só descrição dinâmica; sem cálculo derivado.
//
// A sincronização draft↔treinamentos (injeção de aptidões especiais
// concedidas) mora em syncTreinamentosDerived (useCreatureBuilder.js).
// O derive (fm-derive.js) consulta os helpers daqui para acumular
// margens críticas, bônus de aptidão BAR e bônus de orçamento.
// ============================================================

export const TREINAMENTOS_OFICIAIS = [
  {
    key: "agilidade",
    nome: "Treino de Agilidade",
    descricao:
      "Com grande velocidade e agilidade, você se torna rápido e capaz de um nível superior de mobilidade e esquivas. Sua margem necessária para conseguir um sucesso crítico em um TR de Reflexos reduz em 2.",
    automation: { kind: "tr_crit_margin", save: "reflexos", delta: -2 },
  },
  {
    key: "barreira",
    nome: "Treino de Barreira",
    descricao:
      "Você domina a técnica de barreiras, conseguindo as conferir uma resistência elevada. Toda parede que você criar com Técnicas de Barreira recebe RD igual ao seu Nível de Aptidão em Barreiras, e você também recebe a capacidade de criar 2 barreiras adicionais e +1 Nível de Aptidão em Barreira.",
    automation: { kind: "aptidao_bar_bonus", amount: 1 },
  },
  {
    key: "compreensao",
    nome: "Treino de Compreensão",
    descricao:
      "Você chega muito perto de compreender profundamente a energia amaldiçoada, tornando-se familiar com ela e entendendo melhor uma parte dela. Com isso, você aumenta um nível de aptidão a sua escolha em 1.",
    automation: { kind: "aptidao_budget_bonus", amount: 1 },
  },
  {
    key: "dominio",
    nome: "Treino de Domínio",
    descricao:
      "Você se torna um mestre das expansões, entendendo como conseguir moldá-las perfeitamente diante a sua vontade e necessidade do momento. Como resultado, você recebe a aptidão amaldiçoada Modificação Completa e recebe +4 em confrontos.",
    automation: {
      kind: "aptidao_especial_grant",
      aptidao: {
        nome: "Modificação Completa",
        categoria: "Aptidões de Domínio",
        // Mantido em sincronia com o catálogo (fm-aptidoes.js → modificacao_completa).
        descricao:
          "Seu controle sobre os domínios é tão refinado que, mesmo no imediato momento de expandir seu domínio, você consegue o modificar. Ao utilizar uma expansão de domínio, você pode aplicar as seguintes modificações:\n\n• Inversão de Resistência. Você inverte a resistência interna e externa da sua expansão de domínio, conseguindo lidar melhor com ataques que venham de fora. Ao utilizar essa modificação, troque os pontos de vida do lado interno pelos do lado externo.\n\n• Mudança de Tamanho. Você muda e controla o tamanho da expansão. Você pode expandir ou encolher o espaço da expansão. Para cada 1,5m que encolher a expansão, ela recebe 20 pontos de vida adicionais em sua resistência interna e externa. Para cada 1,5m que expandir, a resistência interna e externa diminui em 20 pontos de vida. Uma expansão não pode ser encolhida para menos de 3 metros e nem expandida para mais que o triplo do tamanho comum. Ambas as mudanças de tamanho são consideradas na área da expansão, a qual por padrão é de 9 metros.\n\nAlém disso, a Expansão sem Barreiras possui uma interação única com o Treinamento de Domínios. Caso possua a aptidão amaldiçoada Modificação Completa, ela pode ser usada para, ao utilizar uma expansão sem barreiras, dobrar a área afetada por ela. Não há nenhum custo adicional ou limitação, sendo este apenas o resultado de uma expansão divina e um treinamento completo, permitindo alcançar um espaço próximo ao do próprio Santuário Malevolente, que é capaz de devastar extensas áreas.",
      },
      confrontoBonus: 4,
    },
  },
  {
    key: "energia",
    nome: "Treino de Energia",
    descricao:
      "Você já estabeleceu uma profunda conexão com a energia amaldiçoada, assim como a conhece cada vez mais completamente. Em uma situação de combate, imerso no fervor da batalha, você consegue gerar energia. Durante uma cena de combate, no começo de toda rodada, você ganha PE temporário igual a metade do seu BT.",
    descriptionFn: (ctx) => {
      const bt = getBonusTreinamento(ctx?.core?.nd ?? 1);
      const metade = Math.floor(bt / 2);
      return `Você já estabeleceu uma profunda conexão com a energia amaldiçoada, assim como a conhece cada vez mais completamente. Em uma situação de combate, imerso no fervor da batalha, você consegue gerar energia. Durante uma cena de combate, no começo de toda rodada, você ganha PE temporário igual a metade do seu BT.\n\nPE temp por rodada: ${metade} (½ × BT +${bt}).`;
    },
    automation: { kind: "pe_temp_bt" },
  },
  {
    key: "energia_reversa",
    nome: "Treino de Energia Reversa",
    descricao:
      "Sua maestria sobre a energia reversa te permite recuperar até mesmo aquilo que parece impossível. Você pode usar a aptidão amaldiçoada Regeneração Aprimorada para curar sua exaustão de técnica após usar expansão de domínio, reduzindo em um turno para 2 pontos de energia reversa gastos.",
  },
  {
    key: "inteligencia",
    nome: "Treino de Inteligência",
    descricao:
      "Cálculos matemáticos, equações complexas e noções de espaço são meras conveniências para você. Sua margem necessária para conseguir um sucesso crítico em um TR de Astúcia reduz em 2.",
    automation: { kind: "tr_crit_margin", save: "astucia", delta: -2 },
  },
  {
    key: "luta",
    nome: "Treino de Luta",
    descricao:
      "Você se torna altamente proficiente em luta, conseguindo extrair ao máximo de seu corpo e manobras. Você recebe acesso ao efeito de crítico de ataques desarmados, como pugilato. Além disso, você pode, uma vez por rodada, escolher realizar uma rolagem de Acrobacia ou Atletismo com vantagem.",
  },
  {
    key: "manejo_arma",
    nome: "Treino de Manejo de Arma",
    descricao:
      "Você se torna um mestre no manejo da arma para qual se dedicou a treinar e dominar. Enquanto estiver manuseando a arma escolhida, ela recebe um encantamento de ferramenta amaldiçoada adicional.",
  },
  {
    key: "pericia",
    nome: "Treino de Perícia",
    descricao:
      "Você treinou e se dedicou tanto a uma perícia específica que ela se tornou algo no qual você é quase incapaz de falhar, mantendo uma consistência invejável. Caso realize um teste da perícia escolhida e obtenha um resultado menor do que 5 no d20, você pode rolar novamente e manter o melhor resultado. Você também pode suceder em um teste automaticamente caso não seja um teste competido.",
  },
  {
    key: "potencial_fisico",
    nome: "Treino de Potencial Físico",
    descricao:
      "Você conseguiu chegar em um ponto onde seu corpo constantemente se renova e sua energia parece nunca ter fim. Durante uma cena de combate, no começo de toda rodada, você recebe uma quantidade de pontos de estamina temporários igual a metade do seu bônus de treinamento. Este treino é válido apenas para Restringidos Celestes.",
    descriptionFn: (ctx) => {
      const bt = getBonusTreinamento(ctx?.core?.nd ?? 1);
      const metade = Math.floor(bt / 2);
      return `Você conseguiu chegar em um ponto onde seu corpo constantemente se renova e sua energia parece nunca ter fim. Durante uma cena de combate, no começo de toda rodada, você recebe uma quantidade de pontos de estamina temporários igual a metade do seu bônus de treinamento. Este treino é válido apenas para Restringidos Celestes.\n\nEstamina temp por rodada: ${metade} (½ × BT +${bt}).`;
    },
    automation: { kind: "estamina_temp_bt" },
  },
  {
    key: "presenca",
    nome: "Treino de Presença",
    descricao:
      "Você se torna uma celebridade. Toda vez que você começar uma conversa com alguém, uma vez por pessoa, role um 1d20. Caso caia 15 ou maior, a pessoa te conhece e todos os seus testes de carisma contra ela recebem +5.",
  },
  {
    key: "resistencia",
    nome: "Treino de Resistência",
    descricao:
      "Seu físico atinge um nível superior, concedendo-lhe uma grande resistência e vigor. Sua margem necessária para conseguir um sucesso crítico em um TR de Fortitude reduz em 2.",
    automation: { kind: "tr_crit_margin", save: "fortitude", delta: -2 },
  },
  {
    key: "vontade",
    nome: "Treino de Vontade",
    descricao:
      "Seus estudos finalmente deram frutos. Sua margem necessária para conseguir um sucesso crítico em um TR de Vontade reduz em 2.",
    automation: { kind: "tr_crit_margin", save: "vontade", delta: -2 },
  },
];

// Mapa rápido para lookup por key
const BY_KEY = Object.fromEntries(TREINAMENTOS_OFICIAIS.map((t) => [t.key, t]));
// Mapa por nome — usado para inferir a key de itens legados que só têm nome.
const BY_NOME = Object.fromEntries(TREINAMENTOS_OFICIAIS.map((t) => [t.nome, t]));

export function getTreinamentoByKey(key) {
  return BY_KEY[key] || null;
}

export function getTreinamentoByNome(nome) {
  return BY_NOME[nome] || null;
}

// ============================================================
// HELPERS DE DERIVAÇÃO
// ============================================================
// Cada helper recebe a lista draft.treinamentos e retorna o agregado
// daquele efeito. Treinamentos custom (tipo:"custom") sempre são
// ignorados — não há como saber que efeito teriam.
// ============================================================

const officialEntries = (treinamentos = []) =>
  treinamentos
    .map((t) => {
      if (t.tipo === "custom") return null;
      // Itens novos têm key; legados só nome — fallback por nome.
      const cat = t.key ? BY_KEY[t.key] : BY_NOME[t.nome];
      return cat || null;
    })
    .filter(Boolean);

/** Soma de bônus +1 no orçamento de Aptidões (Treino de Compreensão). */
export function getCompreensaoAptidaoBudgetBonus(treinamentos = []) {
  return officialEntries(treinamentos)
    .filter((t) => t.automation?.kind === "aptidao_budget_bonus")
    .reduce((sum, t) => sum + (t.automation.amount || 0), 0);
}

/** Soma de bônus em Aptidão Barreira (Treino de Barreira). */
export function getBarreiraAptidaoBonus(treinamentos = []) {
  return officialEntries(treinamentos)
    .filter((t) => t.automation?.kind === "aptidao_bar_bonus")
    .reduce((sum, t) => sum + (t.automation.amount || 0), 0);
}

/** True se o conjunto de treinamentos concede uma aptidão especial via grant. */
export function hasAptidaoEspecialGrant(treinamentos, nome) {
  return officialEntries(treinamentos).some(
    (t) =>
      t.automation?.kind === "aptidao_especial_grant" &&
      t.automation.aptidao?.nome === nome
  );
}

/** Lista de aptidões especiais concedidas pelos treinamentos atuais. */
export function getTreinamentoAptidoesEspeciais(treinamentos = []) {
  return officialEntries(treinamentos)
    .filter((t) => t.automation?.kind === "aptidao_especial_grant")
    .map((t) => ({ ...t.automation.aptidao, treinoKey: t.key }));
}

/**
 * Margens críticas de TR por treinamentos. Retorna um mapa
 * { astucia, fortitude, reflexos, vontade } com o delta acumulado
 * (negativo = margem menor = mais fácil de crítica). Saves que não
 * receberam treinamento não aparecem no mapa.
 */
export function getTRCritMarginDeltas(treinamentos = []) {
  const out = {};
  for (const t of officialEntries(treinamentos)) {
    if (t.automation?.kind !== "tr_crit_margin") continue;
    const { save, delta } = t.automation;
    out[save] = (out[save] || 0) + (delta || 0);
  }
  return out;
}

/** Bônus em Confronto de Domínio concedido pelos treinamentos atuais (ex: Domínio = +4). */
export function getConfrontoDominioBonusFromTreinos(treinamentos = []) {
  return officialEntries(treinamentos).reduce((sum, t) => {
    const bonus = t.automation?.confrontoBonus;
    return bonus ? sum + bonus : sum;
  }, 0);
}

/**
 * Calcula a fórmula de Confronto de Domínio: 1d10 + ½ ND + DOM + bônus de treino.
 * Compartilhado entre o derive (criação) e o CombatantPanel (fallback para
 * fichas legadas cujo snapshot não tem `confrontoDominio` pré-calculado).
 */
export function computeConfrontoDominio({ nd = 0, dom = 0, treinamentos = [] } = {}) {
  const meiaND = Math.floor((Number(nd) || 0) / 2);
  const domNum = Number(dom) || 0;
  const treinoBonus = getConfrontoDominioBonusFromTreinos(treinamentos);
  const modBase = meiaND + domNum + treinoBonus;
  return {
    modBase,
    meiaND,
    dom: domNum,
    treinoBonus,
    formula: `1d10 ${modBase >= 0 ? "+" : "−"} ${Math.abs(modBase)}`,
  };
}

/** True se o Treino de Energia está ativo (PE temp = ½ BT por rodada). */
export function hasEnergiaPeTemp(treinamentos = []) {
  return officialEntries(treinamentos).some(
    (t) => t.automation?.kind === "pe_temp_bt"
  );
}

/** True se o Treino de Potencial Físico está ativo (estamina temp = ½ BT). */
export function hasPotencialFisicoEstamina(treinamentos = []) {
  return officialEntries(treinamentos).some(
    (t) => t.automation?.kind === "estamina_temp_bt"
  );
}

// Kinds que NÃO recebem o badge "Programada" mesmo tendo automação,
// porque o efeito só aparece como valor calculado na descrição
// (PE/estamina temp por rodada não alteram nada na ficha hoje).
const NON_BADGED_KINDS = new Set([
  "info_only",
  "pe_temp_bt",
  "estamina_temp_bt",
]);

/** True se um treinamento oficial tem automação real (badge "Programada"). */
export function isAutomatedTreinamento(treino) {
  if (!treino) return false;
  const kind = treino.automation?.kind;
  if (!kind) return false;
  return !NON_BADGED_KINDS.has(kind);
}
