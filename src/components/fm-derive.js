import {
  getBonusTreinamento, getModifier, calculateHP, calculatePE,
  calculateDefesa, calculateAcerto, calculateCD, calculateTR,
  calculatePericiaComum, calculatePericiaDominada,
  calculateGuardaInabavel, calculateResistenciaParcial,
  calculateResistenciaTotal, calculateActions,
  RD_GERAL, RD_IRREDUTIVEL, IGNORAR_RD, VIDA_TEMP_ATAQUE,
  TAMANHO_INFO, getDeslocamentoMultiplier,
  getAttributePoints, ATTRIBUTE_LIMIT,
  DEFENSE_LIMITS, CONDITION_TOTAL_LIMITS, CONDITION_SEVERITY_MAP,
} from "./fm-tables";
import { hasPeAumentoEnergia, hasPeDouble, hasPeEstoqueAdicional, getFrutosDoteBonus, getFrutosAptidaoEspecialBonus } from "./fm-origens";
import {
  getAptidaoLimit, getAptidoesDeslocamentoBonus,
  getAptidoesAtencaoBonus, getAptidoesHpBonus, getAptidoesSkillBonus,
  getAptidaoSubChoiceWarnings,
} from "./fm-aptidoes";
import { getTRCritMarginDeltas, computeConfrontoDominio } from "./fm-treinamentos";
import {
  getDotesAtencaoBonus, getDotesIniciativaBonus,
  getDotesPercepcaoBonus, getDotePrereqWarnings,
  getDoteExclusionWarnings, getDoteLimit, getDoteSubChoiceWarnings,
} from "./fm-dotes";
import {
  getCaracteristicasAcaoBonus, getCaracteristicaSubChoiceWarnings,
  getCaracteristicaPrereqWarnings,
} from "./fm-caracteristicas";

/**
 * ============================================================
 * fm-derive.js — Camada de derivação (v2)
 * ============================================================
 * Novidade: derivação de skills incluída.
 * Mantém-se função PURA: sem efeitos colaterais.
 * ============================================================
 */

const SAVE_ATTRS = {
  astucia: "inteligencia",
  fortitude: "constituicao",
  reflexos: "destreza",
  vontade: "sabedoria",
  integridade: "constituicao",
};

const getHighestMentalMod = (attrs) => {
  const mentals = [attrs.inteligencia, attrs.sabedoria, attrs.presenca];
  return getModifier(Math.max(...mentals));
};

const lookup = (table, patamar, nd) => table?.[patamar]?.[nd] ?? 0;

// ============================================================
// Margem crítica padrão. d20 = 20 sempre é crítico; treinamentos
// podem reduzir a margem necessária (Agilidade/Inteligência/
// Resistência/Vontade reduzem em 2 → crítica em 18+).
// `ataque` fica preparado para receber deltas de poderes futuros.
// ============================================================
const CRIT_MARGIN_DEFAULT = 20;
const CRIT_MARGIN_MIN = 2; // sanidade — nada de "crítica em 1+"

const buildCritMargins = (treinamentos = []) => {
  const trDeltas = getTRCritMarginDeltas(treinamentos);
  const base = {
    astucia: CRIT_MARGIN_DEFAULT,
    fortitude: CRIT_MARGIN_DEFAULT,
    reflexos: CRIT_MARGIN_DEFAULT,
    vontade: CRIT_MARGIN_DEFAULT,
    integridade: CRIT_MARGIN_DEFAULT,
    ataque: CRIT_MARGIN_DEFAULT,
  };
  for (const [save, delta] of Object.entries(trDeltas)) {
    if (!(save in base)) continue;
    base[save] = Math.max(CRIT_MARGIN_MIN, base[save] + delta);
  }
  return base;
};

export function deriveStats(raw) {
  const { core, attributes, overrides = {}, skills = [], attackAttr = 'forca', cdAttr = null, treinamentos = [], aptidoes = {}, dotes = [], aptidoesEspeciais = [], caracteristicas = [] } = raw;
  const { patamar, nd, difficulty = "iniciante", size = "medio" } = core;

  const bt = getBonusTreinamento(nd);
  const mods = {
    forca: getModifier(attributes.forca),
    destreza: getModifier(attributes.destreza),
    constituicao: getModifier(attributes.constituicao),
    inteligencia: getModifier(attributes.inteligencia),
    sabedoria: getModifier(attributes.sabedoria),
    presenca: getModifier(attributes.presenca),
  };
  const modTecnica = getHighestMentalMod(attributes);

  const sizeInfo = TAMANHO_INFO[size] || TAMANHO_INFO.medio;
  const deslocMultiplier = getDeslocamentoMultiplier(nd, patamar);
  const deslocamentoCalc = sizeInfo.deslocamento * deslocMultiplier;

  // Calcula antes para incluir no sistema de overrides
  const cdModAttr = cdAttr ? mods[cdAttr] ?? 0 : modTecnica;
  const cdBaseCalc = calculateCD(nd, cdModAttr, difficulty, patamar);
  const acertoCalc = calculateAcerto(patamar, nd, mods[attackAttr] ?? mods.forca, difficulty);

  // Bônus de PE por origem:
  //  - Maldição com Aumento de Energia (exceto Lacaio): +ND
  //  - Corpo Amaldiçoado com Estoque Adicional: +ND
  //  - Restringido (Corpo por Energia): dobra o total
  const peBase = calculatePE(patamar, nd);
  const peNdBonus = (hasPeAumentoEnergia(core) || hasPeEstoqueAdicional(core)) ? nd : 0;
  const peSubtotal = peBase + peNdBonus;
  const peDoubleMult = hasPeDouble(core) ? 2 : 1;
  const peMaxFinal = peSubtotal * peDoubleMult;

  // Atenção segue o modificador REAL da perícia "Percepção" — mod do
  // atributo dela + dominância + ½ ND de Sentidos Afiados + override —
  // em vez de recalcular pela Sabedoria. A comparação ignora acentos/caixa
  // pra cobrir variações de digitação. Sem perícia "Percepção", cai no
  // cálculo comum por Sabedoria (ainda somando o ½ ND do dote, se houver).
  const stripDiacritics = (s) =>
    (s || "").toString().normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
  // Bônus de Percepção: ½ ND de Sentidos Afiados (dote) + bônus de aptidões
  // (ex.: Olhos Adicionais +2 escalando). Alimenta a perícia Percepção E a
  // Atenção (que segue essa perícia).
  const percepcaoDoteBonus = getDotesPercepcaoBonus(dotes, nd);
  const percepcaoBonus = percepcaoDoteBonus + getAptidoesSkillBonus(aptidoesEspeciais, "percepcao", nd);
  const percepcaoSkill = skills.find((s) => stripDiacritics(s.name) === "percepcao");
  let percepcaoMod;
  if (percepcaoSkill) {
    const attrMod = mods[percepcaoSkill.attribute] ?? mods.sabedoria;
    const calc = (percepcaoSkill.mastered
      ? calculatePericiaDominada(nd, attrMod, patamar)
      : calculatePericiaComum(nd, attrMod, patamar)) + percepcaoBonus;
    percepcaoMod = percepcaoSkill.overrideMod != null ? percepcaoSkill.overrideMod : calc;
  } else {
    percepcaoMod = calculatePericiaComum(nd, mods.sabedoria, patamar) + percepcaoBonus;
  }

  const calculated = {
    hpMax: calculateHP(patamar, nd, attributes.constituicao) + getAptidoesHpBonus(aptidoesEspeciais, nd),
    peMax: peMaxFinal,
    defesa: calculateDefesa(patamar, nd, mods.destreza, difficulty),
    atencao: calcAtencao(patamar, nd, percepcaoMod) + getDotesAtencaoBonus(dotes, nd) + getAptidoesAtencaoBonus(aptidoesEspeciais),
    iniciativa: calcIniciativa(patamar, nd, mods.destreza) + getDotesIniciativaBonus(dotes),
    deslocamento: deslocamentoCalc + getAptidoesDeslocamentoBonus(aptidoesEspeciais, mods.destreza),
    espaco: sizeInfo.espaco,
    guardaInabavalMax: calculateGuardaInabavel(patamar, nd),
    rdGeral: lookup(RD_GERAL, patamar, nd),
    rdIrredutivel: lookup(RD_IRREDUTIVEL, patamar, nd),
    ignorarRd: lookup(IGNORAR_RD, patamar, nd),
    vidaTempPorAtaque: lookup(VIDA_TEMP_ATAQUE, patamar, nd),
    resistenciaParcialMax: calculateResistenciaParcial(patamar, nd),
    resistenciaTotalMax: calculateResistenciaTotal(patamar, nd),
    cdBase: cdBaseCalc,
    acerto: acertoCalc,
  };

  const saves = {};
  for (const [saveName, attrKey] of Object.entries(SAVE_ATTRS)) {
    saves[saveName] = calculateTR(nd, mods[attrKey], difficulty, patamar);
  }

  // Economia de ações + bônus de características (Ímpeto Gradual: +1 de um tipo).
  const actionsTotal = calculateActions(patamar, nd);
  const acaoBonus = getCaracteristicasAcaoBonus(caracteristicas);
  for (const tipo of Object.keys(acaoBonus)) {
    actionsTotal[tipo] = (actionsTotal[tipo] || 0) + acaoBonus[tipo];
  }

  const attrBudget = {
    total: getAttributePoints(patamar, nd, bt),
    spent: Object.values(attributes).reduce((sum, v) => sum + (v - 10), 0),
    limit: ATTRIBUTE_LIMIT[patamar] ?? 26,
  };
  attrBudget.remaining = attrBudget.total - attrBudget.spent;

  // ---------- Aplicação de overrides em stats/saves ----------
  const finalStats = {};
  for (const [key, calcValue] of Object.entries(calculated)) {
    const overrideValue = overrides.stats?.[key];
    finalStats[key] = overrideValue != null ? overrideValue : calcValue;
  }

  const finalSaves = {};
  for (const [key, calcValue] of Object.entries(saves)) {
    const overrideValue = overrides.saves?.[key];
    finalSaves[key] = overrideValue != null ? overrideValue : calcValue;
  }

  // ---------- NOVO: Derivação de perícias ----------
  // Para cada skill, calcula o mod base e resolve override.
  // Retorno indexado por id para consulta rápida.
  // Bônus por perícia: ½ ND de Sentidos Afiados na Percepção (dote) + bônus
  // de aptidões por perícia (Olhos → Percepção, Braços → Prestidigitação...).
  const skillDerivations = {};
  for (const sk of skills) {
    const norm = stripDiacritics(sk.name);
    const attrMod = mods[sk.attribute] ?? 0;
    let calcMod = sk.mastered
      ? calculatePericiaDominada(nd, attrMod, patamar)
      : calculatePericiaComum(nd, attrMod, patamar);
    if (norm === "percepcao") calcMod += percepcaoDoteBonus;
    calcMod += getAptidoesSkillBonus(aptidoesEspeciais, norm, nd);
    const finalMod = sk.overrideMod != null ? sk.overrideMod : calcMod;
    skillDerivations[sk.id] = {
      attrMod,
      calculatedMod: calcMod,
      finalMod,
      isOverridden: sk.overrideMod != null,
    };
  }

  const critMargins = buildCritMargins(treinamentos);

  // Confronto de Domínio: 1d10 + floor(ND/2) + DOM + bônus de treino.
  // Expomos só a parte fixa (modBase) e a fórmula textual — o d10 é
  // rolado na mesa, não no app.
  const confrontoDominio = computeConfrontoDominio({
    nd: nd ?? 0,
    dom: aptidoes?.dom,
    treinamentos,
  });

  return {
    bt,
    mods,
    modTecnica,
    calculated,
    stats: finalStats,
    saves: finalSaves,
    critMargins,
    confrontoDominio,
    cdBase: finalStats.cdBase,
    acertoPrincipal: finalStats.acerto,
    actionsTotal,
    attrBudget,
    pericias: {
      comum:    (attrMod) => calculatePericiaComum(nd, attrMod, patamar),
      dominada: (attrMod) => calculatePericiaDominada(nd, attrMod, patamar),
    },
    skillDerivations,
  };
}

// Atenção = bônus de Percepção + adicional do patamar.
// `percepcaoMod` é o modificador REAL da perícia Percepção (resolvido em
// deriveStats: mod do atributo + dominância + ½ ND de Sentidos Afiados +
// override), ou o fallback comum por Sabedoria quando não há a perícia.
function calcAtencao(patamar, nd, percepcaoMod) {
  const adicionalPatamar = {
    lacaio:     0,
    capanga:    5,
    comum:      10,
    desafio:    15,
    calamidade: nd >= 20 ? 20 : 15,
  };
  const extra = adicionalPatamar[patamar];
  if (extra == null) return 10;
  return percepcaoMod + extra;
}

// Iniciativa Calamidade tem cap em "20 + metade do Mod" (PDF p.45).
function calcIniciativa(patamar, nd, modDex) {
  const halfDex = Math.floor(modDex / 2);
  const table = {
    lacaio:     () => modDex,
    capanga:    () => nd + halfDex,
    comum:      () => nd + halfDex,
    desafio:    () => nd + halfDex,
    calamidade: () => Math.min(20, nd) + halfDex,
  };
  return table[patamar]?.() ?? modDex;
}

export function validateDraft(raw, derived) {
  // Modo "Sem Limites": ignora todas as regras convencionais — nenhum aviso
  // (orçamentos, limites de dotes/aptidões/defesas, integridade, pré-requisitos).
  if (raw.core?.semLimites) return [];

  const warnings = [];
  const { attrBudget } = derived;

  if (attrBudget.remaining < 0) {
    warnings.push({
      field: "attributes",
      severity: "error",
      message: `Você distribuiu ${Math.abs(attrBudget.remaining)} pontos além do permitido`,
    });
  }

  if (attrBudget.remaining > 0) {
    warnings.push({
      field: "attributes",
      severity: "warn",
      message: `${attrBudget.remaining} pontos de atributo não distribuídos`,
    });
  }

  for (const [attr, value] of Object.entries(raw.attributes)) {
    if (value > attrBudget.limit) {
      warnings.push({
        field: `attributes.${attr}`,
        severity: "error",
        message: `${attr} (${value}) acima do limite do patamar (${attrBudget.limit})`,
      });
    }
  }

  if (!raw.name || raw.name.trim().length === 0) {
    warnings.push({ field: "name", severity: "error", message: "Nome é obrigatório" });
  }

  // Aviso leve sobre skills sem nome
  const unnamedSkills = (raw.skills || []).filter((s) => !s.name?.trim()).length;
  if (unnamedSkills > 0) {
    warnings.push({
      field: "skills",
      severity: "warn",
      message: `${unnamedSkills} perícia(s) sem nome`,
    });
  }

  // Dotes: excesso de quantidade pelo limite do Patamar × ND (+ Frutos da Experiência).
  const doteLimit = getDoteLimit(raw.core?.patamar, raw.core?.nd) + getFrutosDoteBonus(raw.core);
  const doteCount = (raw.dotes || []).length;
  if (doteCount > doteLimit) {
    warnings.push({
      field: "dotes",
      severity: "error",
      message: `${doteCount - doteLimit} dote(s) além do limite do Patamar/ND (máx. ${doteLimit}).`,
    });
  }

  // Aptidões Amaldiçoadas: excesso pelo limite (uma a cada nível par + Frutos).
  // Concedidas por treino (source:"treino") são extras e não contam.
  const aptLimit = getAptidaoLimit(raw.core) + getFrutosAptidaoEspecialBonus(raw.core);
  const aptCount = (raw.aptidoesEspeciais || []).filter((a) => a.source !== "treino").length;
  if (aptCount > aptLimit) {
    warnings.push({
      field: "aptidoesEsp",
      severity: "error",
      message: `${aptCount - aptLimit} aptidão(ões) além do limite do Patamar/ND (máx. ${aptLimit}).`,
    });
  }
  for (const w of getAptidaoSubChoiceWarnings(raw.aptidoesEspeciais)) {
    warnings.push({ field: "aptidoesEsp", severity: "warn", message: w.message });
  }

  // Dotes: pré-requisitos não atendidos + exclusividade mútua (não-bloqueantes).
  for (const w of getDotePrereqWarnings(raw.dotes, {
    core: raw.core,
    attributes: raw.attributes,
    skills: raw.skills,
  })) {
    warnings.push({ field: "dotes", severity: "warn", message: w.message });
  }
  for (const w of getDoteExclusionWarnings(raw.dotes)) {
    warnings.push({
      field: "dotes",
      severity: "warn",
      message: `${w.nome} e ${w.conflito} são mutuamente exclusivos.`,
    });
  }
  for (const w of getDoteSubChoiceWarnings(raw.dotes)) {
    warnings.push({ field: "dotes", severity: "warn", message: w.message });
  }

  // Características: sub-escolha pendente (Ímpeto Gradual) + pré-requisitos.
  for (const w of getCaracteristicaSubChoiceWarnings(raw.caracteristicas)) {
    warnings.push({ field: "caracteristicas", severity: "warn", message: w.message });
  }
  for (const w of getCaracteristicaPrereqWarnings(raw.caracteristicas, { core: raw.core })) {
    warnings.push({ field: "caracteristicas", severity: "warn", message: w.message });
  }

  // Defesas: soft caps por Patamar (espelha SectionDefenses). Só as manuais
  // contam — defesas de origem/aptidão e condições de origem/dote são extras.
  const defenses = raw.defenses || {};
  const patamarDef = raw.core?.patamar ?? "comum";
  const defLimits = DEFENSE_LIMITS[patamarDef] ?? DEFENSE_LIMITS.comum;
  const isManualDef = (it) => it?.source !== "origin" && it?.source !== "aptidao";
  const manualDef = {
    imunidades:       (defenses.imunidades || []).filter(isManualDef).length,
    resistencias:     (defenses.resistencias || []).filter(isManualDef).length,
    vulnerabilidades: (defenses.vulnerabilidades || []).filter(isManualDef).length,
  };
  const DEF_LABELS = { imunidades: "imunidades", resistencias: "resistências", vulnerabilidades: "vulnerabilidades" };
  for (const cat of ["imunidades", "resistencias", "vulnerabilidades"]) {
    if (manualDef[cat] > defLimits[cat]) {
      warnings.push({
        field: "defenses",
        severity: "warn",
        message: `${manualDef[cat] - defLimits[cat]} ${DEF_LABELS[cat]} além do limite do Patamar (máx. ${defLimits[cat]}).`,
      });
    }
  }
  // Troca Equivalente: cada Imunidade precisa de ao menos uma Vulnerabilidade.
  if (manualDef.imunidades > manualDef.vulnerabilidades) {
    warnings.push({
      field: "defenses",
      severity: "warn",
      message: `Troca Equivalente: ${manualDef.imunidades} imunidade(s) para ${manualDef.vulnerabilidades} vulnerabilidade(s) — cada imunidade pede uma vulnerabilidade condizente.`,
    });
  }
  // Condições imunes: limite total + sub-limites de Forte/Extrema.
  const condTotalLimit = CONDITION_TOTAL_LIMITS[patamarDef] ?? 5;
  const originConds = new Set(defenses.originCondicoesImunes || []);
  const doteConds = new Set(defenses.doteCondicoesImunes || []);
  const manualConds = (defenses.condicoesImunes || []).filter((c) => !originConds.has(c) && !doteConds.has(c));
  if (manualConds.length > condTotalLimit) {
    warnings.push({
      field: "defenses",
      severity: "warn",
      message: `${manualConds.length - condTotalLimit} imunidade(s) a condição além do limite do Patamar (máx. ${condTotalLimit}).`,
    });
  }
  const extremaCount = manualConds.filter((c) => CONDITION_SEVERITY_MAP[c] === "extremas").length;
  const forteCount = manualConds.filter((c) => CONDITION_SEVERITY_MAP[c] === "fortes").length;
  if (extremaCount > 1) {
    warnings.push({ field: "defenses", severity: "warn", message: `Máximo de 1 condição Extrema (${extremaCount} selecionadas).` });
  }
  if (forteCount > 2) {
    warnings.push({ field: "defenses", severity: "warn", message: `Máximo de 2 condições Fortes (${forteCount} selecionadas).` });
  }

  return warnings;
}
