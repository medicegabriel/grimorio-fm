import {
  getBonusTreinamento, getModifier, calculateHP, calculatePE,
  calculateDefesa, calculateAcerto, calculateCD, calculateTR,
  calculatePericiaComum, calculatePericiaDominada,
  calculateGuardaInabavel, calculateResistenciaParcial,
  calculateResistenciaTotal, calculateActions,
  RD_GERAL, RD_IRREDUTIVEL, IGNORAR_RD, VIDA_TEMP_ATAQUE,
  TAMANHO_INFO, getDeslocamentoMultiplier,
  getAttributePoints, ATTRIBUTE_LIMIT,
} from "./fm-tables";
import { hasPeAumentoEnergia, hasPeDouble, hasPeEstoqueAdicional } from "./fm-origens";
import { getTRCritMarginDeltas, computeConfrontoDominio } from "./fm-treinamentos";

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
  const { core, attributes, overrides = {}, skills = [], attackAttr = 'forca', cdAttr = null, treinamentos = [], aptidoes = {} } = raw;
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

  // Atenção depende do bônus de Percepção (perícia). Detecta se há uma
  // perícia chamada "Percepção" marcada como dominada — a comparação
  // ignora acentos/caixa pra cobrir variações que o usuário possa digitar.
  const stripDiacritics = (s) =>
    (s || "").toString().normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
  const percepcaoDominada = skills.some(
    (s) => stripDiacritics(s.name) === "percepcao" && s.mastered
  );

  const calculated = {
    hpMax: calculateHP(patamar, nd, attributes.constituicao),
    peMax: peMaxFinal,
    defesa: calculateDefesa(patamar, nd, mods.destreza, difficulty),
    atencao: calcAtencao(patamar, nd, attributes.sabedoria, percepcaoDominada),
    iniciativa: calcIniciativa(patamar, nd, mods.destreza),
    deslocamento: deslocamentoCalc,
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

  const actionsTotal = calculateActions(patamar, nd);

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
  const skillDerivations = {};
  for (const sk of skills) {
    const attrMod = mods[sk.attribute] ?? 0;
    const calcMod = sk.mastered
      ? calculatePericiaDominada(nd, attrMod, patamar)
      : calculatePericiaComum(nd, attrMod, patamar);
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
// `bônus de Percepção` é a perícia (comum ou dominada) calculada sobre
// o modificador de Sabedoria. Se a ficha tem Percepção marcada como
// dominada, usa-se calculatePericiaDominada — antes esse caminho estava
// quebrado e Atenção ignorava a dominação.
function calcAtencao(patamar, nd, sabedoria, percepcaoDominada = false) {
  const modSab = getModifier(sabedoria);
  const bonusPercepcao = percepcaoDominada
    ? calculatePericiaDominada(nd, modSab, patamar)
    : calculatePericiaComum(nd, modSab, patamar);

  const adicionalPatamar = {
    lacaio:     0,
    capanga:    5,
    comum:      10,
    desafio:    15,
    calamidade: nd >= 20 ? 20 : 15,
  };
  const extra = adicionalPatamar[patamar];
  if (extra == null) return 10;
  return bonusPercepcao + extra;
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

  return warnings;
}
