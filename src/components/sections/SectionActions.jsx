import React, { useState, useRef, useEffect } from "react";
import { Plus, Trash2, Copy, Swords, Info, AlertTriangle, Lock, Unlock } from "lucide-react";
import { FieldLabel, TextInput, TextArea, Select, NumberInput, SmallButton, Pill } from "../builder-controls";
import { getDamage, PATAMAR_ND_RANGE, CONDITIONS } from "../fm-tables";

// ============================================================
// CONSTANTES
// ============================================================
const ACTION_TYPE_OPTIONS = [
  { value: "comum",     label: "Ação Comum" },
  { value: "bonus",     label: "Ação Bônus" },
  { value: "rapida",    label: "Ação Rápida" },
  { value: "reacao",    label: "Reação" },
  { value: "movimento", label: "Movimento" },
  { value: "livre",     label: "Livre" },
];

export const ACTION_TYPE_LABELS = {
  comum: "Ação Comum", bonus: "Ação Bônus", rapida: "Ação Rápida",
  reacao: "Reação", movimento: "Movimento", livre: "Livre",
};

const ATTACK_TYPE_OPTIONS = [
  { value: "acerto",        label: "Teste de Acerto (dano total)" },
  { value: "tr_individual", label: "TR Individual (dano -1 ND)" },
  { value: "tr_area",       label: "TR em Área (dano ÷2)" },
  { value: "suporte",       label: "Suporte / Defesa (sem dano)" },
];

const NARRATIVE_OPTIONS = [
  { value: "padrao", label: "Arma / Padrão" },
  { value: "fisica",  label: "Narrativa Física (Soco, Chute...)" },
];

const TR_TYPE_OPTIONS = [
  { value: "fortitude",   label: "Fortitude" },
  { value: "reflexos",    label: "Reflexos" },
  { value: "vontade",     label: "Vontade" },
  { value: "astucia",     label: "Astúcia" },
  { value: "integridade", label: "Integridade" },
];

const TR_TYPE_LABELS = {
  fortitude: "Fortitude", reflexos: "Reflexos", vontade: "Vontade",
  astucia: "Astúcia", integridade: "Integridade",
};

const DAMAGE_TYPE_GROUPS = [
  { label: "Físicos",    types: ["cortante", "perfurante", "impacto"] },
  { label: "Elementais", types: ["ácido", "congelante", "chocante", "queimante", "sônico"] },
  { label: "Etéreos",    types: ["alma", "energia reversa", "energético", "psíquico", "radiante"] },
  { label: "Biológicos", types: ["necrótico", "venenoso"] },
];

const DAMAGE_TYPE_LABELS = {
  // Valores canônicos
  cortante: "Cortante", perfurante: "Perfurante", impacto: "Impacto",
  "ácido": "Ácido", congelante: "Congelante", chocante: "Chocante", queimante: "Queimante", "sônico": "Sônico",
  alma: "Alma",
  "energia reversa": "Energia Reversa", "energético": "Energético",
  "psíquico": "Psíquico", radiante: "Radiante",
  "necrótico": "Necrótico", venenoso: "Venenoso",
  // Compatibilidade com valores antigos salvos
  psiquico: "Psíquico", sonoro: "Sônico", corrosivo: "Ácido",
  necrotico: "Necrótico", energia_amaldicoada: "Energia Reversa",
};

const CONDITION_TIER_OPTIONS = [
  { value: "nenhuma", label: "Nenhuma" },
  { value: "fraca",   label: "Fraca (2 PE ou -1 ND)" },
  { value: "media",   label: "Média (5 PE ou -2 ND)" },
  { value: "forte",   label: "Forte (8 PE ou -3 ND)" },
  { value: "extrema", label: "Extrema (10 PE ou -4 ND)" },
];

const CONDITION_TIER_LABELS = {
  fraca: "Fraca", media: "Média", forte: "Forte", extrema: "Extrema",
};

const CONDITION_PE_COST  = { fraca: 2, media: 5, forte: 8, extrema: 10 };
const CONDITION_ND_COST  = { fraca: 1, media: 2, forte: 3, extrema: 4 };
const BT_MIN_FOR_TIER    = { fraca: 2, media: 3, forte: 4, extrema: 5 };

const CONDITION_PAYMENT_OPTIONS = [
  { value: "pe", label: "Pagar com PE" },
  { value: "nd", label: "Reduzir ND do Dano" },
];

const CONDITION_NAMES = [
  "Abalado", "Amedrontado", "Apavorado", "Atordoado", "Caído",
  "Cego", "Confuso", "Desprevenido", "Doente", "Em Chamas",
  "Enfeitiçado", "Envenenado", "Exausto", "Fascinado", "Fraco",
  "Imóvel", "Inconsciente", "Lento", "Paralisado", "Sangrando",
  "Surdo", "Vulnerável",
];

const CONDITION_NAME_OPTIONS = [
  { value: "", label: "— Selecione —" },
  ...CONDITION_NAMES.map((n) => ({ value: n, label: n })),
  { value: "outro", label: "Outro / Customizado" },
];

const TIER_TO_CONDITIONS_KEY = {
  fraca: "fracas", media: "medias", forte: "fortes", extrema: "extremas",
};

const BLANK_CONDITION = { tier: "nenhuma", payment: "pe", nameKey: "", name: "" };

const DIE_SIZES = [4, 6, 8, 10, 12, 20];

// ============================================================
// PARÂMETROS DE ALCANCE/ÁREA POR BT
// ============================================================
const ACTION_PARAMETERS = {
  2: { range: 12,  area: 4.5, meleeBonusDice: 1 },
  3: { range: 18,  area: 6,   meleeBonusDice: 1 },
  4: { range: 24,  area: 9,   meleeBonusDice: 2 },
  5: { range: 30,  area: 12,  meleeBonusDice: 2 },
  6: { range: 48,  area: 18,  meleeBonusDice: 3 },
};

const getActionParams = (bt) =>
  ACTION_PARAMETERS[Math.min(6, Math.max(2, bt ?? 2))] ?? ACTION_PARAMETERS[2];

const TRADES_ZERO = { sacrifDadosAcerto: 0, sacrifDadosCD: 0, sacrifAcertoDados: 0, sacrifCdDados: 0 };

// ============================================================
// CALCULATE ACTION DAMAGE — pipeline rigorosa (7 passos)
// ============================================================
export function calculateActionDamage(
  patamar, nd, attackType, isNarrativeFisica = false, conditionNdReduction = 0
) {
  if (!patamar || !nd || attackType === "suporte") return null;

  // Passo 1 — Somar todas as reduções de ND
  const reducaoTr      = attackType === "tr_individual" ? 1 : 0;
  const totalReducaoND = reducaoTr + (conditionNdReduction ?? 0);

  // Passo 2 — Calcular ND alvo, safeND e déficit
  const minND    = PATAMAR_ND_RANGE[patamar]?.min ?? 1;
  const targetND = nd - totalReducaoND;
  const safeND   = Math.max(minND, targetND);
  const deficit  = Math.max(0, minND - targetND);

  // Passo 3 — Buscar na tabela e fazer parse da string de dano
  const entry = getDamage(patamar, safeND);
  if (!entry?.roll) return null;

  const m = entry.roll.match(/^(\d+)d(\d+)([+-]\d+)?$/i);
  if (!m) return null;

  let numDice   = parseInt(m[1]);
  const dieSize = parseInt(m[2]);
  let mod       = parseInt(m[3] ?? "0");

  // Passo 4 — Aplicar o déficit no dano fixo
  mod -= deficit * 4;

  // Passo 5 — Redução por narrativa + trava de segurança
  // Divisão por área/alma ocorre no pipeline runFullCalc após somar todos os dados brutos
  if (isNarrativeFisica) numDice -= 2;
  numDice = Math.max(1, numDice);

  // Passos 6-7 — Trades e string final (trades aplicados externamente via applyTrades)
  const modStr  = mod > 0 ? `+${mod}` : mod < 0 ? `${mod}` : "";
  const average = Math.floor(numDice * ((dieSize + 1) / 2)) + mod;
  return { numDice, dieSize, mod, roll: `${numDice}d${dieSize}${modStr}`, average };
}

// ============================================================
// TRADE HELPERS
// ============================================================
function enforceMutualExclusion(trades) {
  const t = { ...trades };
  if ((t.sacrifDadosAcerto ?? 0) > 0) t.sacrifAcertoDados = 0;
  if ((t.sacrifAcertoDados ?? 0) > 0) t.sacrifDadosAcerto = 0;
  if ((t.sacrifDadosCD    ?? 0) > 0) t.sacrifCdDados      = 0;
  if ((t.sacrifCdDados    ?? 0) > 0) t.sacrifDadosCD      = 0;
  return t;
}

function applyTrades(numDiceBase, toHitBase, cdBase, rangeType, trades, bt) {
  const params   = getActionParams(bt);
  const bonusCaC = rangeType === "cac" ? params.meleeBonusDice : 0;
  const t        = { ...TRADES_ZERO, ...(trades ?? {}) };
  const dadosFinais = Math.max(1,
    (numDiceBase ?? 0) + bonusCaC
    - t.sacrifDadosAcerto
    - t.sacrifDadosCD
    + Math.floor(t.sacrifAcertoDados / 2)
    + t.sacrifCdDados
  );
  const acertoFinal = (toHitBase ?? 0) + (t.sacrifDadosAcerto * 2) - t.sacrifAcertoDados;
  const cdFinal     = (cdBase     ?? 0) + t.sacrifDadosCD           - t.sacrifCdDados;
  return { dadosFinais, acertoFinal, cdFinal };
}

// Divisor composto: tr_area ×2, alma ×3 (podem se combinar → ×6)
function computeDivisor(attackType, damageType) {
  let divisor = 1;
  if (attackType === "tr_area") divisor *= 2;
  if (damageType === "alma")    divisor *= 3;
  return divisor;
}

// Pipeline Target Average com degradação dinâmica de dado:
// A) Média bruta → B) Média alvo (divisores) → C) Degrada face se necessário → reconstrói dados+fixo
const FACES_VALIDAS = [20, 12, 10, 8, 6, 4, 2];
function applyDivisorFull(dadosBrutos, dieSize, modBase, divisor) {
  if (divisor === 1) return { numDadosFinal: dadosBrutos, danoFixoFinal: modBase, dieSize };
  // Passo A — Média bruta
  const mediaFace0 = (dieSize + 1) / 2;
  const mediaBruta = dadosBrutos * mediaFace0 + modBase;
  // Passo B — Média alvo
  const mediaAlvo  = Math.floor(mediaBruta / divisor);
  // Passo C.1-C.2 — Degrada face enquanto dado for grande demais para a média alvo
  let faceAtual = FACES_VALIDAS.includes(dieSize) ? dieSize : 10;
  while (mediaAlvo < (faceAtual + 1) / 2 && faceAtual > 2) {
    const prox = FACES_VALIDAS[FACES_VALIDAS.indexOf(faceAtual) + 1];
    if (prox == null) break;
    faceAtual = prox;
  }
  // Passo C.3 — Reconstruir com a face final; fixo sempre >= 0
  const mediaFaceFinal = (faceAtual + 1) / 2;
  const numDadosFinal  = Math.max(1, Math.floor(mediaAlvo / mediaFaceFinal));
  const danoFixoBruto  = Math.round(mediaAlvo - numDadosFinal * mediaFaceFinal);
  const danoFixoFinal  = Math.max(0, danoFixoBruto);
  return { numDadosFinal, danoFixoFinal, dieSize: faceAtual };
}

// Zera trades irrelevantes ao trocar o tipo de ofensiva
function resetTradesForAttackType(attackType, currentTrades) {
  const t = { ...currentTrades };
  if (attackType === "acerto") {
    t.sacrifDadosCD = 0;
    t.sacrifCdDados = 0;
  } else if (attackType?.startsWith("tr_")) {
    t.sacrifDadosAcerto = 0;
    t.sacrifAcertoDados = 0;
  }
  return t;
}

// Calcula alcance e área automáticos com base no BT, tipo de ataque e tipo de alcance
const fmtM = (n) => `${String(n).replace(".", ",")} Metros`;
function calcAutoRange(attackType, rangeType, bt) {
  const params = getActionParams(bt);
  if (rangeType === "cac") {
    return {
      range: "Corpo-a-Corpo",
      area:  attackType === "tr_area" ? fmtM(params.area) : "-",
    };
  }
  return {
    range: fmtM(params.range),
    area:  attackType === "tr_area" ? fmtM(params.area) : "-",
  };
}

// ============================================================
// HELPERS DE ROLAGEM
// ============================================================
const rollStr = (numDice, dieSize, mod) => {
  if (!numDice || !dieSize) return mod ? (mod > 0 ? `+${mod}` : `${mod}`) : "";
  const base = `${numDice}d${dieSize}`;
  if (!mod) return base;
  return mod > 0 ? `${base}+${mod}` : `${base}${mod}`;
};

const rollAverage = (numDice, dieSize, mod) => {
  if (!numDice || !dieSize) return mod || 0;
  return Math.round(numDice * (dieSize + 1) / 2 + (mod || 0));
};

const parseRollFromStr = (roll) => {
  const m = (roll ?? "").match(/^(\d+)d(\d+)([+-]\d+)?$/i);
  if (!m) return null;
  return { numDice: parseInt(m[1]), dieSize: parseInt(m[2]), mod: parseInt(m[3] ?? "0") };
};

// ============================================================
// ESTADO DERIVADO (puro — sem React)
// ============================================================
const deriveFinalDice = (dmg) => {
  const base = dmg?.numDice ?? 0;
  if (dmg?.damageIsCalculated) return base;
  return dmg?.isNarrativePhysical ? Math.max(0, base - 2) : base;
};

const deriveCondPE = (condition) => {
  if (!condition) return 0;
  if (condition.tier === "nenhuma" || !condition.tier) return 0;
  if (condition.payment !== "pe") return 0;
  return CONDITION_PE_COST[condition.tier] ?? 0;
};

const deriveFinalPE = (baseCost, condition) => (baseCost ?? 0) + deriveCondPE(condition);

const getCondNdReduction = (condition) => {
  if (!condition || condition.tier === "nenhuma" || condition.payment !== "nd") return 0;
  return CONDITION_ND_COST[condition.tier] ?? 0;
};

// ============================================================
// normalizeAction
// ============================================================
function normalizeAction(action) {
  const dmg = action.damage ?? {};
  let { numDice, dieSize, mod } = dmg;
  if (numDice == null && dmg.roll) {
    const p = parseRollFromStr(dmg.roll);
    if (p) { numDice = p.numDice; dieSize = p.dieSize; mod = p.mod; }
  }
  const existingName = action.condition?.name ?? "";
  const nameKey = action.condition?.nameKey ??
    (CONDITION_NAMES.includes(existingName) ? existingName : existingName ? "outro" : "");
  const trades = { ...TRADES_ZERO, ...(action.trades ?? {}) };
  return {
    rangeType: "distancia",
    trades,
    toHitBase: action.toHitBase ?? action.toHit ?? 0,
    cdBase:    action.cdBase    ?? action.cd    ?? 0,
    condition: { tier: "nenhuma", name: "", nameKey: "", payment: "pe" },
    ...action,
    rangeLocked: action.rangeLocked ?? true,
    areaLocked:  action.areaLocked  ?? true,
    damage: {
      type: "cortante",
      isNarrativePhysical: false,
      narrativeType: "padrao",
      damageIsLocked: true,
      damageIsCalculated: false,
      ...dmg,
      numDice:     numDice ?? 0,
      dieSize:     dieSize ?? 8,
      mod:         mod     ?? 0,
      narrativeType: dmg.narrativeType ?? (dmg.isNarrativePhysical ? "fisica" : "padrao"),
      numDiceBase: dmg.numDiceBase ?? numDice ?? 0,
    },
    condition: {
      tier: "nenhuma",
      payment: "pe",
      nameKey,
      name: nameKey === "outro" ? existingName : nameKey,
      ...(action.condition ?? {}),
      nameKey,
    },
  };
}

// ============================================================
// humanizeAction — exportada, consumida por CombatantPanel e LivePreview
// ============================================================
export function humanizeAction(action) {
  if (!action?.name) return "";
  const parts = [];
  const typeLabel = ACTION_TYPE_LABELS[action.type] || action.type || "Ação";
  parts.push(`${action.name} (${typeLabel}).`);

  if (action.description?.trim()) parts.push(action.description.trim());

  const dmg = action.damage;
  const finalDice = deriveFinalDice(dmg);
  const dieSize   = dmg?.dieSize ?? 8;
  const mod       = dmg?.mod ?? 0;
  const roll      = rollStr(finalDice, dieSize, mod) || dmg?.roll || "";
  const hasDamage = action.attackType !== "suporte" && roll;
  const dmgTypeLabel = dmg?.type === "alma" ? "na Alma" : (DAMAGE_TYPE_LABELS[dmg?.type] || dmg?.type || "");
  const dmgStr = hasDamage ? `${roll} de dano ${dmgTypeLabel}` : null;

  if (action.attackType === "acerto") {
    const hitPart   = action.toHit != null ? ` Acerto +${action.toHit}.` : "";
    const rangePart = action.range ? ` Alcance ${action.range}.` : "";
    if (hasDamage) parts.push(`${hitPart}${rangePart} Causa ${dmgStr}.`);
    else if (hitPart || rangePart) parts.push(`${hitPart}${rangePart}`);
  } else if (action.attackType === "tr_individual") {
    const tr = TR_TYPE_LABELS[action.trType] || action.trType || "TR";
    const rangePart = action.range ? ` a ${action.range}` : "";
    if (hasDamage)
      parts.push(`Criatura${rangePart} realiza TR de ${tr} (CD ${action.cd}). Em uma falha, recebe ${dmgStr} (sucesso reduz à metade).`);
    else
      parts.push(`Criatura${rangePart} realiza TR de ${tr} (CD ${action.cd}).`);
  } else if (action.attackType === "tr_area") {
    const tr = TR_TYPE_LABELS[action.trType] || action.trType || "TR";
    const rangePart = action.range ? ` a ${action.range}` : "";
    const areaPart  = action.area  ? `, área de ${action.area}` : "";
    if (hasDamage)
      parts.push(`Criatura${rangePart}${areaPart} realiza TR de ${tr} (CD ${action.cd}). Em uma falha, recebe ${dmgStr} (sucesso reduz à metade).`);
    else
      parts.push(`Criatura${rangePart}${areaPart} realiza TR de ${tr} (CD ${action.cd}).`);
  }

  const cond = action.condition;
  if (cond?.tier && cond.tier !== "nenhuma") {
    const tierLabel = CONDITION_TIER_LABELS[cond.tier] || cond.tier;
    const condName  = cond.name?.trim() ? `[${cond.name}]` : `[condição ${tierLabel}]`;
    if (cond.payment === "nd") {
      const ndCost = CONDITION_ND_COST[cond.tier] ?? "?";
      parts.push(`Aplica a condição ${condName} (${tierLabel} — -${ndCost} ND).`);
    } else {
      parts.push(`Aplica a condição ${condName} (${tierLabel}).`);
    }
  }

  const finalPE = deriveFinalPE(action.cost, cond);
  if (finalPE > 0) parts.push(`Custo: ${finalPE} PE.`);

  return parts.filter(Boolean).join(" ");
}

// ============================================================
// generateActionDescription — gerador de texto mecânico base
// ============================================================
export function generateActionDescription(action, creatureName, flavorText = "") {
  const dmg       = action.damage;
  const finalDice = deriveFinalDice(dmg);
  const dieSize   = dmg?.dieSize ?? 8;
  const mod       = dmg?.mod ?? 0;
  const rollDisplay = rollStr(finalDice, dieSize, mod);
  const dmgType     = dmg?.type === "alma" ? "na Alma" : (DAMAGE_TYPE_LABELS[dmg?.type] || dmg?.type || "");
  const finalPE   = deriveFinalPE(action.cost, action.condition);
  const isTR      = action.attackType?.startsWith("tr_");
  const isTRArea  = action.attackType === "tr_area";
  const isAcerto  = action.attackType === "acerto";
  const hasCond   = action.condition?.tier && action.condition.tier !== "nenhuma";
  const isComplex = finalPE > 0 || hasCond || isTR;
  const alcance   = action.range || "-";
  const area      = action.area  || "-";
  const creature  = creatureName?.trim() || "A criatura";
  const actionTypeLabel = ACTION_TYPE_LABELS[action.type] || "Ação";
  const flavor    = flavorText?.trim() || "";

  if (isAcerto && !isComplex) {
    const opening = flavor || `${creature} golpeia utilizando ${action.name || "esta ação"}.`;
    return `${opening} Alcance de ${alcance}, +${action.toHit ?? 0} para acertar, causa ${rollDisplay} de dano ${dmgType}.`;
  }

  if (isTR || isComplex) {
    const trAttr   = TR_TYPE_LABELS[action.trType] || "TR";
    const isCaC    = action.rangeType === "cac";
    const targetDesc = isTRArea
      ? (isCaC ? "Toda criatura na área partindo de você" : "Toda criatura na área")
      : "A criatura alvo";
    const areaLine = isTRArea
      ? `Área: ${area}${isCaC ? " partindo de si mesmo" : ""}`
      : null;
    const lines    = [
      `Conjuração: ${actionTypeLabel}`,
      `Alcance: ${alcance}`,
      ...(!isTRArea ? [`Alvo: Uma criatura`] : []),
      ...(areaLine  ? [areaLine]             : []),
      ...(finalPE > 0 ? [`Custo: ${finalPE} PE`] : []),
      "",
    ];

    let mechanicalText = "";
    if (isTR && rollDisplay) {
      mechanicalText = `${targetDesc} deve realizar um teste de resistência de ${trAttr} (CD ${action.cd ?? 0}), recebendo ${rollDisplay} de dano ${dmgType}, ou apenas metade em um sucesso.`;
    } else if (isTR) {
      mechanicalText = `${targetDesc} deve realizar um teste de resistência de ${trAttr} (CD ${action.cd ?? 0}).`;
    } else if (isAcerto && rollDisplay) {
      mechanicalText = `Alcance de ${alcance}, +${action.toHit ?? 0} para acertar, causa ${rollDisplay} de dano ${dmgType}.`;
    }
    if (hasCond) {
      const tierLabel = CONDITION_TIER_LABELS[action.condition.tier] || action.condition.tier;
      const rawName   = action.condition.name?.trim();
      const condName  = rawName
        ? rawName.charAt(0).toUpperCase() + rawName.slice(1)
        : tierLabel;
      const condSuffix = rawName ? ` (${tierLabel})` : "";
      mechanicalText += ` Além disso, caso falhe, sofre a condição ${condName}${condSuffix}.`;
    }

    const secondParagraph = [flavor, mechanicalText].filter(Boolean).join(" ");
    if (secondParagraph) lines.push(secondParagraph);
    return lines.join("\n");
  }

  return flavor;
}

// ============================================================
// SECTION ACTIONS
// ============================================================
export default function SectionActions({ draft, derived, actions }) {
  const [showForm, setShowForm] = useState(false);

  const handleAdd = (newAction) => {
    actions.addAction({ ...newAction, id: `act-${Date.now().toString(36)}` });
    setShowForm(false);
  };

  const total   = derived.actionsTotal ?? { comum: 1, bonus: 0, rapida: 0, movimento: 1, reacao: 1 };
  const patamar = draft.core?.patamar;
  const nd      = draft.core?.nd;
  const bt      = derived.bt ?? 2;

  return (
    <div className="space-y-3">
      <div className="bg-slate-950/60 border border-slate-800 rounded px-3 py-2 flex flex-wrap gap-2 text-xs">
        <span className="text-slate-500">Por turno:</span>
        <Pill color="rose">{total.comum} Comum</Pill>
        <Pill color="amber">{total.rapida} Rápida</Pill>
        <Pill color="sky">{total.bonus} Bônus</Pill>
        <Pill color="emerald">{total.movimento} Movimento</Pill>
        <Pill color="purple">{total.reacao} Reação</Pill>
      </div>

      <div className="space-y-2">
        {draft.actions.list.length === 0 && (
          <div className="text-center py-6 text-slate-600 text-sm italic border border-dashed border-slate-800 rounded">
            Nenhuma ação cadastrada
          </div>
        )}
        {draft.actions.list.map((action) => (
          <ActionItem
            key={action.id}
            action={action}
            patamar={patamar}
            nd={nd}
            bt={bt}
            creatureName={draft.name || "A criatura"}
            onUpdate={(patch) => actions.updateAction(action.id, patch)}
            onRemove={() => actions.removeAction(action.id)}
            onDuplicate={() => actions.duplicateAction(action.id)}
          />
        ))}
      </div>

      {showForm ? (
        <ActionForm derived={derived} draft={draft} onAdd={handleAdd} onCancel={() => setShowForm(false)} />
      ) : (
        <SmallButton onClick={() => setShowForm(true)} variant="primary">
          <Plus className="w-3 h-3" /> Adicionar Ação
        </SmallButton>
      )}
    </div>
  );
}

// ============================================================
// ACTION ITEM
// ============================================================
function ActionItem({ action, patamar, nd, bt, creatureName, onUpdate, onRemove, onDuplicate }) {
  const [expanded, setExpanded] = useState(false);
  const norm    = normalizeAction(action);
  const finalPE = deriveFinalPE(norm.cost, norm.condition);

  // Full recalc from table + apply trades + divisor pipeline (used when unlocked)
  const runFullCalc = (attackType, condition, narrativeType, rangeType, trades, damageType) => {
    const baseResult = calculateActionDamage(
      patamar, nd, attackType, narrativeType === "fisica", getCondNdReduction(condition)
    );
    if (!baseResult) return null;
    const tHitBase = norm.toHitBase ?? norm.toHit ?? 0;
    const tCdBase  = norm.cdBase    ?? norm.cd    ?? 0;
    const tradeResult = applyTrades(baseResult.numDice, tHitBase, tCdBase, rangeType, trades, bt);
    const { acertoFinal, cdFinal } = tradeResult;
    const divisor = computeDivisor(attackType, damageType ?? norm.damage?.type ?? "cortante");
    const { numDadosFinal, danoFixoFinal, dieSize: dieFinal } = applyDivisorFull(tradeResult.dadosFinais, baseResult.dieSize, baseResult.mod, divisor);
    const finalRoll = rollStr(numDadosFinal, dieFinal, danoFixoFinal);
    const finalAvg  = rollAverage(numDadosFinal, dieFinal, danoFixoFinal);
    return {
      toHit:    acertoFinal,
      toHitBase: tHitBase,
      cd:       cdFinal,
      cdBase:   tCdBase,
      damage:   { ...baseResult, numDice: numDadosFinal, numDiceBase: baseResult.numDice, mod: danoFixoFinal, dieSize: dieFinal, roll: finalRoll, average: finalAvg, damageIsCalculated: true },
    };
  };

  // Re-apply trades (used when locked — aplica divisor simples sem compensação de fração)
  const reapplyTradesHelper = (rangeType, trades) => {
    const numDiceBase = norm.damage?.numDiceBase ?? norm.damage?.numDice ?? 0;
    const tHitBase    = norm.toHitBase ?? norm.toHit ?? 0;
    const tCdBase     = norm.cdBase    ?? norm.cd    ?? 0;
    const tradeRes = applyTrades(numDiceBase, tHitBase, tCdBase, rangeType, trades, bt);
    const divisor  = computeDivisor(norm.attackType, norm.damage?.type ?? "cortante");
    const numDadosFinal = divisor === 1 ? tradeRes.dadosFinais : Math.max(1, Math.floor(tradeRes.dadosFinais / divisor));
    const dieSize = norm.damage?.dieSize ?? 8;
    const modVal  = norm.damage?.mod ?? 0;
    return {
      toHit: tradeRes.acertoFinal,
      cd:    tradeRes.cdFinal,
      damage: {
        ...norm.damage,
        numDice: numDadosFinal,
        roll:    rollStr(numDadosFinal, dieSize, modVal),
        average: rollAverage(numDadosFinal, dieSize, modVal),
      },
    };
  };

  const update = (patch) => {
    if ("attackType" in patch) {
      const resetTrades = resetTradesForAttackType(patch.attackType, norm.trades ?? TRADES_ZERO);
      const basePatch   = { ...patch, trades: resetTrades };
      if (patch.attackType === "acerto") basePatch.condition = BLANK_CONDITION;
      const av = calcAutoRange(patch.attackType, norm.rangeType, bt);
      if (norm.rangeLocked !== false) basePatch.range = av.range;
      if (norm.areaLocked  !== false) basePatch.area  = av.area;
      if (!norm.damage?.damageIsLocked) {
        const r = runFullCalc(patch.attackType, norm.condition, norm.damage?.narrativeType, norm.rangeType, resetTrades, norm.damage?.type);
        if (r) { onUpdate({ ...basePatch, ...r, damage: { ...norm.damage, ...r.damage } }); return; }
      }
      const reapplied = reapplyTradesHelper(norm.rangeType, resetTrades);
      onUpdate({ ...basePatch, ...reapplied });
      return;
    }
    if ("toHitBase" in patch) {
      const t = norm.trades ?? TRADES_ZERO;
      onUpdate({ ...patch, toHit: (patch.toHitBase ?? 0) + ((t.sacrifDadosAcerto ?? 0) * 2) - (t.sacrifAcertoDados ?? 0) });
      return;
    }
    if ("cdBase" in patch) {
      const t = norm.trades ?? TRADES_ZERO;
      onUpdate({ ...patch, cd: (patch.cdBase ?? 0) + (t.sacrifDadosCD ?? 0) - (t.sacrifCdDados ?? 0) });
      return;
    }
    onUpdate(patch);
  };

  const updateDamage = (patch) => {
    const isUnlocking        = patch.damageIsLocked === false && norm.damage?.damageIsLocked === true;
    const isNarrativeChange  = "narrativeType" in patch && !norm.damage?.damageIsLocked;
    const isDamageTypeChange = "type" in patch && !norm.damage?.damageIsLocked;

    if (isUnlocking || isNarrativeChange || isDamageTypeChange) {
      const newNarrative = "narrativeType" in patch ? patch.narrativeType : norm.damage?.narrativeType;
      const newType      = "type" in patch ? patch.type : norm.damage?.type;
      const r = runFullCalc(norm.attackType, norm.condition, newNarrative, norm.rangeType, norm.trades, newType);
      if (r) {
        onUpdate({ ...r, damage: { ...norm.damage, ...patch, ...r.damage, damageIsCalculated: true } });
        return;
      }
    }

    const dmg = { ...norm.damage, ...patch };
    if ("numDiceBase" in patch && !("numDice" in patch)) {
      const tradeRes = applyTrades(
        patch.numDiceBase, norm.toHitBase ?? norm.toHit ?? 0, norm.cdBase ?? norm.cd ?? 0,
        norm.rangeType, norm.trades, bt
      );
      const divisor = computeDivisor(norm.attackType, dmg.type ?? "cortante");
      dmg.numDice = divisor === 1 ? tradeRes.dadosFinais : Math.max(1, Math.floor(tradeRes.dadosFinais / divisor));
    }
    dmg.roll    = rollStr(dmg.numDice, dmg.dieSize, dmg.mod);
    dmg.average = rollAverage(deriveFinalDice(dmg), dmg.dieSize, dmg.mod);
    onUpdate({ damage: dmg });
  };

  const updateCond = (patch) => {
    const newCondition = { ...norm.condition, ...patch };
    const condUpdate   = { condition: newCondition };
    if (!norm.damage?.damageIsLocked && ("tier" in patch || "payment" in patch)) {
      const r = runFullCalc(norm.attackType, newCondition, norm.damage?.narrativeType, norm.rangeType, norm.trades, norm.damage?.type);
      if (r) Object.assign(condUpdate, r, { damage: { ...norm.damage, ...r.damage, damageIsCalculated: true } });
    }
    onUpdate(condUpdate);
  };

  const updateTrade = (patch) => {
    const newTrades = enforceMutualExclusion({ ...(norm.trades ?? TRADES_ZERO), ...patch });
    const tradePatch = { trades: newTrades };
    if (!norm.damage?.damageIsLocked) {
      const r = runFullCalc(norm.attackType, norm.condition, norm.damage?.narrativeType, norm.rangeType, newTrades, norm.damage?.type);
      if (r) { onUpdate({ ...tradePatch, ...r, damage: { ...norm.damage, ...r.damage, damageIsLocked: false } }); return; }
    }
    const reapplied = reapplyTradesHelper(norm.rangeType, newTrades);
    onUpdate({ ...tradePatch, ...reapplied });
  };

  const updateRangeType = (newRangeType) => {
    const av = calcAutoRange(norm.attackType, newRangeType, bt);
    const rangePatch = {
      rangeType: newRangeType,
      ...(norm.rangeLocked !== false ? { range: av.range } : {}),
      ...(norm.areaLocked  !== false ? { area:  av.area  } : {}),
    };
    if (!norm.damage?.damageIsLocked) {
      const r = runFullCalc(norm.attackType, norm.condition, norm.damage?.narrativeType, newRangeType, norm.trades, norm.damage?.type);
      if (r) { onUpdate({ ...rangePatch, ...r, damage: { ...norm.damage, ...r.damage, damageIsLocked: false } }); return; }
    }
    const reapplied = reapplyTradesHelper(newRangeType, norm.trades);
    onUpdate({ ...rangePatch, ...reapplied });
  };

  return (
    <div className="bg-slate-950/40 border border-slate-800 rounded">
      <div className="flex items-center gap-2 p-2">
        <Swords className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex-1 text-left text-sm font-semibold text-white hover:text-purple-300 min-w-0"
        >
          <span className="truncate block">{action.name || "Ação sem nome"}</span>
        </button>
        <Pill color="slate">{ACTION_TYPE_LABELS[action.type] || action.type}</Pill>
        {finalPE > 0 && <Pill color="purple">{finalPE} PE</Pill>}
        <SmallButton onClick={onDuplicate} title="Duplicar">
          <Copy className="w-3 h-3" />
        </SmallButton>
        <SmallButton onClick={onRemove} variant="danger" title="Remover">
          <Trash2 className="w-3 h-3" />
        </SmallButton>
      </div>

      {!expanded && (
        <div className="px-3 pb-2">
          <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-wrap">
            {generateActionDescription(norm, creatureName, norm.description) || humanizeAction(norm)}
          </p>
        </div>
      )}

      {expanded && (
        <div className="border-t border-slate-800 p-3 space-y-3">
          <ActionFormFields
            form={norm}
            bt={bt}
            creatureName={creatureName}
            update={update}
            updateDamage={updateDamage}
            updateCond={updateCond}
            updateTrade={updateTrade}
            updateRangeType={updateRangeType}
          />
        </div>
      )}
    </div>
  );
}

// ============================================================
// ACTION FORM (nova ação)
// ============================================================
function ActionForm({ derived, draft, onAdd, onCancel }) {
  const patamar = draft?.core?.patamar;
  const nd      = draft?.core?.nd;
  const bt      = derived?.bt ?? 2;

  const [isMechanicalTextLocked, setIsMechanicalTextLocked] = useState(true);
  const [manualMechanicalText,   setManualMechanicalText]   = useState("");
  const textareaRef = useRef(null);

  const [form, setForm] = useState(() => {
    const calcDmg    = calculateActionDamage(patamar, nd, "acerto", false);
    const tHitBase   = derived?.acertoPrincipal ?? 0;
    const tCdBase    = derived?.cdBase ?? 0;
    const numDiceBase = calcDmg?.numDice ?? 0;
    const initAuto   = calcAutoRange("acerto", "distancia", bt);
    return {
      name:      "",
      type:      "comum",
      attackType: "acerto",
      toHit:     tHitBase,
      toHitBase: tHitBase,
      cd:        tCdBase,
      cdBase:    tCdBase,
      trType:    "fortitude",
      range:     initAuto.range,
      area:      initAuto.area,
      rangeType: "distancia",
      rangeLocked: true,
      areaLocked:  true,
      trades:    { ...TRADES_ZERO },
      damage: {
        type:              "cortante",
        narrativeType:     "padrao",
        isNarrativePhysical: false,
        damageIsLocked:    false,
        damageIsCalculated: true,
        numDice:           numDiceBase,
        numDiceBase,
        dieSize:           calcDmg?.dieSize ?? 8,
        mod:               calcDmg?.mod ?? 0,
        roll:              calcDmg?.roll ?? "",
        average:           calcDmg?.average ?? 0,
      },
      condition: { tier: "nenhuma", name: "", nameKey: "", payment: "pe" },
      cost:        0,
      description: "",
    };
  });

  const runFullCalc = (attackType, condition, narrativeType, rangeType, trades, damageType) => {
    const baseResult = calculateActionDamage(
      patamar, nd, attackType, narrativeType === "fisica", getCondNdReduction(condition)
    );
    if (!baseResult) return null;
    const tHitBase = derived?.acertoPrincipal ?? 0;
    const tCdBase  = derived?.cdBase ?? 0;
    const tradeResult = applyTrades(baseResult.numDice, tHitBase, tCdBase, rangeType, trades, bt);
    const { acertoFinal, cdFinal } = tradeResult;
    const divisor = computeDivisor(attackType, damageType ?? "cortante");
    const { numDadosFinal, danoFixoFinal, dieSize: dieFinal } = applyDivisorFull(tradeResult.dadosFinais, baseResult.dieSize, baseResult.mod, divisor);
    const finalRoll = rollStr(numDadosFinal, dieFinal, danoFixoFinal);
    const finalAvg  = rollAverage(numDadosFinal, dieFinal, danoFixoFinal);
    return {
      toHit:    acertoFinal,
      toHitBase: tHitBase,
      cd:       cdFinal,
      cdBase:   tCdBase,
      damage:   { ...baseResult, numDice: numDadosFinal, numDiceBase: baseResult.numDice, mod: danoFixoFinal, dieSize: dieFinal, roll: finalRoll, average: finalAvg, damageIsCalculated: true },
    };
  };

  const reapplyTradesHelper = (prev, rangeType, trades) => {
    const numDiceBase = prev.damage?.numDiceBase ?? prev.damage?.numDice ?? 0;
    const tHitBase    = prev.toHitBase ?? prev.toHit ?? 0;
    const tCdBase     = prev.cdBase    ?? prev.cd    ?? 0;
    const tradeRes = applyTrades(numDiceBase, tHitBase, tCdBase, rangeType, trades, bt);
    const divisor  = computeDivisor(prev.attackType, prev.damage?.type ?? "cortante");
    const numDadosFinal = divisor === 1 ? tradeRes.dadosFinais : Math.max(1, Math.floor(tradeRes.dadosFinais / divisor));
    const dieSize = prev.damage?.dieSize ?? 8;
    const modVal  = prev.damage?.mod ?? 0;
    return {
      toHit: tradeRes.acertoFinal,
      cd:    tradeRes.cdFinal,
      damage: {
        ...prev.damage,
        numDice: numDadosFinal,
        roll:    rollStr(numDadosFinal, dieSize, modVal),
        average: rollAverage(numDadosFinal, dieSize, modVal),
      },
    };
  };

  const update = (patch) =>
    setForm((prev) => {
      let next = { ...prev, ...patch };

      if ("attackType" in patch) {
        const resetTrades = resetTradesForAttackType(patch.attackType, prev.trades ?? TRADES_ZERO);
        next.trades = resetTrades;
        if (patch.attackType === "acerto") next.condition = BLANK_CONDITION;
        const av = calcAutoRange(patch.attackType, next.rangeType, bt);
        if (next.rangeLocked !== false) next.range = av.range;
        if (next.areaLocked  !== false) next.area  = av.area;
        if (!prev.damage?.damageIsLocked) {
          const r = runFullCalc(patch.attackType, prev.condition, prev.damage?.narrativeType, prev.rangeType, resetTrades, prev.damage?.type);
          if (r) Object.assign(next, r, { damage: { ...prev.damage, ...r.damage, damageIsLocked: false } });
        } else {
          const reapplied = reapplyTradesHelper(next, prev.rangeType, resetTrades);
          Object.assign(next, reapplied);
        }
      }

      if ("toHitBase" in patch) {
        const t = next.trades ?? TRADES_ZERO;
        next.toHit = (patch.toHitBase ?? 0) + ((t.sacrifDadosAcerto ?? 0) * 2) - (t.sacrifAcertoDados ?? 0);
      }
      if ("cdBase" in patch) {
        const t = next.trades ?? TRADES_ZERO;
        next.cd = (patch.cdBase ?? 0) + (t.sacrifDadosCD ?? 0) - (t.sacrifCdDados ?? 0);
      }

      return next;
    });

  const updateDamage = (patch) =>
    setForm((prev) => {
      const isUnlocking        = patch.damageIsLocked === false && prev.damage?.damageIsLocked === true;
      const isNarrativeChange  = "narrativeType" in patch && !prev.damage?.damageIsLocked;
      const isDamageTypeChange = "type" in patch && !prev.damage?.damageIsLocked;

      if (isUnlocking || isNarrativeChange || isDamageTypeChange) {
        const newNarrative = "narrativeType" in patch ? patch.narrativeType : prev.damage?.narrativeType;
        const newType      = "type" in patch ? patch.type : prev.damage?.type;
        const r = runFullCalc(prev.attackType, prev.condition, newNarrative, prev.rangeType, prev.trades, newType);
        if (r) return { ...prev, ...r, damage: { ...prev.damage, ...patch, ...r.damage, damageIsCalculated: true } };
      }

      const dmg = { ...prev.damage, ...patch };
      if ("numDiceBase" in patch && !("numDice" in patch)) {
        const tradeRes = applyTrades(
          patch.numDiceBase, prev.toHitBase ?? prev.toHit ?? 0, prev.cdBase ?? prev.cd ?? 0,
          prev.rangeType, prev.trades, bt
        );
        const divisor = computeDivisor(prev.attackType, dmg.type ?? "cortante");
        dmg.numDice = divisor === 1 ? tradeRes.dadosFinais : Math.max(1, Math.floor(tradeRes.dadosFinais / divisor));
      }
      if (!("damageIsLocked" in patch) && !("narrativeType" in patch) && !isDamageTypeChange) {
        dmg.roll    = rollStr(dmg.numDice, dmg.dieSize, dmg.mod);
        dmg.average = rollAverage(deriveFinalDice(dmg), dmg.dieSize, dmg.mod);
      }
      return { ...prev, damage: dmg };
    });

  const updateCond = (patch) =>
    setForm((prev) => {
      const newCondition = { ...prev.condition, ...patch };
      let next = { ...prev, condition: newCondition };
      if (!prev.damage?.damageIsLocked && ("tier" in patch || "payment" in patch)) {
        const r = runFullCalc(prev.attackType, newCondition, prev.damage?.narrativeType, prev.rangeType, prev.trades, prev.damage?.type);
        if (r) Object.assign(next, r, { damage: { ...prev.damage, ...r.damage, damageIsCalculated: true } });
      }
      return next;
    });

  const updateTrade = (patch) =>
    setForm((prev) => {
      const newTrades = enforceMutualExclusion({ ...(prev.trades ?? TRADES_ZERO), ...patch });
      if (!prev.damage?.damageIsLocked) {
        const r = runFullCalc(prev.attackType, prev.condition, prev.damage?.narrativeType, prev.rangeType, newTrades, prev.damage?.type);
        if (r) return { ...prev, trades: newTrades, ...r, damage: { ...prev.damage, ...r.damage, damageIsLocked: false } };
      }
      const reapplied = reapplyTradesHelper(prev, prev.rangeType, newTrades);
      return { ...prev, trades: newTrades, ...reapplied };
    });

  const updateRangeType = (newRangeType) =>
    setForm((prev) => {
      const av = calcAutoRange(prev.attackType, newRangeType, bt);
      const rangeUpdates = {
        rangeType: newRangeType,
        ...(prev.rangeLocked !== false ? { range: av.range } : {}),
        ...(prev.areaLocked  !== false ? { area:  av.area  } : {}),
      };
      if (!prev.damage?.damageIsLocked) {
        const r = runFullCalc(prev.attackType, prev.condition, prev.damage?.narrativeType, newRangeType, prev.trades, prev.damage?.type);
        if (r) return { ...prev, ...rangeUpdates, ...r, damage: { ...prev.damage, ...r.damage, damageIsLocked: false } };
      }
      const reapplied = reapplyTradesHelper(prev, newRangeType, prev.trades);
      return { ...prev, ...rangeUpdates, ...reapplied };
    });

  const handleResize = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  useEffect(() => {
    handleResize();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, isMechanicalTextLocked, manualMechanicalText]);

  return (
    <div className="bg-slate-950/70 border border-purple-900/50 rounded p-4 space-y-3">
      <h4 className="text-sm font-bold text-purple-300 flex items-center gap-2">
        <Plus className="w-4 h-4" /> Nova Ação
      </h4>

      <ActionFormFields
        form={form}
        bt={bt}
        creatureName={draft?.name || "A criatura"}
        update={update}
        updateDamage={updateDamage}
        updateCond={updateCond}
        updateTrade={updateTrade}
        updateRangeType={updateRangeType}
      />

      {form.name?.trim() && form.attackType !== "suporte" && (() => {
          const autoText = generateActionDescription(form, draft?.name, form.description);
          if (!autoText) return null;
          const displayText = isMechanicalTextLocked ? autoText : manualMechanicalText;
          const toggleLockMechanical = () => {
            if (isMechanicalTextLocked) {
              setManualMechanicalText(autoText);
              setIsMechanicalTextLocked(false);
            } else {
              setIsMechanicalTextLocked(true);
            }
          };
          return (
            <div className="bg-slate-900/60 border border-slate-700 rounded p-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                  Texto Final
                </div>
                <button
                  type="button"
                  onClick={toggleLockMechanical}
                  title={isMechanicalTextLocked ? "Clique para editar manualmente" : "Clique para voltar ao texto automático"}
                  style={{
                    borderColor: isMechanicalTextLocked ? "rgb(71 85 105)"        : "rgb(217 119 6 / 0.6)",
                    color:       isMechanicalTextLocked ? "rgb(100 116 139)"       : "rgb(251 191 36)",
                    background:  isMechanicalTextLocked ? "transparent"            : "rgb(120 53 15 / 0.2)",
                  }}
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] transition-colors"
                >
                  {isMechanicalTextLocked
                    ? <><Lock   className="w-3 h-3" /> Auto</>
                    : <><Unlock className="w-3 h-3" /> Manual</>}
                </button>
              </div>
              <textarea
                ref={textareaRef}
                readOnly={isMechanicalTextLocked}
                value={displayText}
                onChange={(e) => { if (!isMechanicalTextLocked) { setManualMechanicalText(e.target.value); handleResize(); } }}
                className={`w-full bg-slate-950 border rounded px-2.5 py-2 text-xs text-slate-300 leading-relaxed resize-none overflow-hidden focus:outline-none transition-colors ${
                  isMechanicalTextLocked
                    ? "border-slate-800 cursor-default text-slate-400"
                    : "border-amber-700/60 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30"
                }`}
              />
              {!isMechanicalTextLocked && (
                <p className="text-[10px] text-amber-500/70 italic">
                  Editando manualmente — feche o cadeado para voltar ao texto automático.
                </p>
              )}
            </div>
          );
        })()}

      <div className="flex justify-end gap-2 pt-1">
        <SmallButton onClick={onCancel}>Cancelar</SmallButton>
        <SmallButton onClick={() => onAdd(form)} variant="primary" disabled={!form.name.trim()}>
          <Plus className="w-3 h-3" /> Adicionar
        </SmallButton>
      </div>
    </div>
  );
}

// ============================================================
// TRADE ROW — stepper de conversão equivalente
// ============================================================
function TradeRow({ label, hint, value, onChange, step = 1, blocked, max }) {
  const canDecrease = value > 0;
  const canIncrease = !blocked && (max === undefined || value + step <= max);
  const btnBase = "w-7 h-7 flex items-center justify-center rounded text-sm font-bold border transition-colors focus:outline-none select-none";
  const btnActive   = "border-slate-600 text-white hover:bg-slate-700 hover:border-slate-500 active:scale-95";
  const btnDisabled = "border-slate-800 text-slate-700 cursor-not-allowed";

  return (
    <div className={`flex items-center gap-2 ${blocked ? "opacity-40" : ""}`}>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-slate-300 leading-tight">{label}</div>
        <div className="text-[10px] text-slate-500 leading-tight">{hint}</div>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button
          type="button"
          onClick={() => canDecrease && onChange(Math.max(0, value - step))}
          disabled={!canDecrease}
          className={`${btnBase} shrink-0 ${canDecrease ? btnActive : btnDisabled}`}
        >
          −
        </button>
        <span className={`w-6 text-center text-sm font-mono font-semibold shrink-0 ${value > 0 ? "text-amber-300" : "text-slate-600"}`}>
          {value}
        </span>
        <button
          type="button"
          onClick={() => canIncrease && onChange(value + step)}
          disabled={!canIncrease}
          className={`${btnBase} shrink-0 ${canIncrease ? btnActive : btnDisabled}`}
        >
          +
        </button>
      </div>
    </div>
  );
}

// ============================================================
// FORM FIELDS — compartilhado entre ActionItem e ActionForm
// ============================================================
function ActionFormFields({ form, bt = 2, creatureName, update, updateDamage, updateCond, updateTrade, updateRangeType }) {
  const isTR      = form.attackType?.startsWith("tr_");
  const isAcerto  = form.attackType === "acerto";
  const hasDamage = form.attackType !== "suporte";
  const hasCond   = form.condition?.tier && form.condition.tier !== "nenhuma";

  const dieSize   = form.damage?.dieSize ?? 8;
  const mod       = form.damage?.mod ?? 0;
  const isLocked  = form.damage?.damageIsLocked === true;
  const isAutoCalc = form.damage?.damageIsCalculated === true && !isLocked;
  const narrativeType = form.damage?.narrativeType ?? "padrao";
  const finalDice  = deriveFinalDice(form.damage);

  const condPE  = deriveCondPE(form.condition);
  const finalPE = deriveFinalPE(form.cost, form.condition);
  const isCondND = hasCond && form.condition?.payment === "nd";

  // Trade / alcance state
  const trades      = { ...TRADES_ZERO, ...(form.trades ?? {}) };
  const rangeType   = form.rangeType ?? "distancia";
  const params      = getActionParams(bt);
  const numDiceBase = form.damage?.numDiceBase ?? form.damage?.numDice ?? 0;
  const toHitBase   = form.toHitBase ?? form.toHit ?? 0;
  const cdBase      = form.cdBase    ?? form.cd    ?? 0;

  // Deltas para mostrar ajuste acima do base
  const tradeToHitDelta = (trades.sacrifDadosAcerto * 2) - trades.sacrifAcertoDados;
  const tradeCdDelta    = trades.sacrifDadosCD - trades.sacrifCdDados;

  // Mutual exclusion: bloqueia lado oposto
  const blockedDadosAcerto  = trades.sacrifAcertoDados > 0;
  const blockedDadosCD      = trades.sacrifCdDados     > 0;
  const blockedAcertoDados  = trades.sacrifDadosAcerto > 0;
  const blockedCdDados      = trades.sacrifDadosCD     > 0;

  // Caps por BT + trava de mínimo 1 dado no pool bruto
  const bonusCaCPool = rangeType === "cac" ? params.meleeBonusDice : 0;
  const rawDicePool  = numDiceBase + bonusCaCPool
    + Math.floor((trades.sacrifAcertoDados ?? 0) / 2)
    + (trades.sacrifCdDados ?? 0);
  const capDadosAcerto  = Math.max(0, Math.min(bt, rawDicePool - 1 - (trades.sacrifDadosCD ?? 0)));
  const capDadosCD      = Math.max(0, Math.min(bt, rawDicePool - 1 - (trades.sacrifDadosAcerto ?? 0)));
  const capCdDados      = bt;
  const capAcertoDados  = bt * 2;

  const hasActiveTrades =
    (isAcerto && (trades.sacrifDadosAcerto > 0 || trades.sacrifAcertoDados > 0)) ||
    (isTR    && (trades.sacrifDadosCD     > 0 || trades.sacrifCdDados      > 0)) ||
    rangeType === "cac";

  const rangeLocked = form.rangeLocked !== false;
  const areaLocked  = form.areaLocked  !== false;
  const autoVals    = calcAutoRange(form.attackType, rangeType, bt);

  const toggleRangeLock = () => {
    if (!rangeLocked) update({ rangeLocked: true, range: autoVals.range });
    else update({ rangeLocked: false });
  };
  const toggleAreaLock = () => {
    if (!areaLocked) update({ areaLocked: true, area: autoVals.area });
    else update({ areaLocked: false });
  };

  const lockBtnStyle = (isLocked) => ({
    borderColor: isLocked ? "rgb(71 85 105)"        : "rgb(217 119 6 / 0.6)",
    color:       isLocked ? "rgb(100 116 139)"       : "rgb(251 191 36)",
    background:  isLocked ? "transparent"            : "rgb(120 53 15 / 0.2)",
  });

  const handleCondNameKey = (key) => {
    if (key === "outro") updateCond({ nameKey: "outro", name: "" });
    else updateCond({ nameKey: key, name: key });
  };

  const handleTierChange = (tier) => {
    const key = TIER_TO_CONDITIONS_KEY[tier];
    const validNames = key ? CONDITIONS[key] : [];
    const currentKey = form.condition?.nameKey ?? "";
    const nameStillValid = currentKey === "outro" || validNames.includes(currentKey);
    updateCond({ tier, ...(nameStillValid ? {} : { nameKey: "", name: "" }) });
  };

  const toggleLock = () => updateDamage({ damageIsLocked: !isLocked });

  return (
    <div className="space-y-3">
      {/* Nome + Tipo de execução */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <FieldLabel required>Nome da Ação</FieldLabel>
          <TextInput value={form.name} onChange={(v) => update({ name: v })} placeholder="Ex: Garra Lacerante" />
        </div>
        <div>
          <FieldLabel>Tipo de Execução</FieldLabel>
          <Select value={form.type} onChange={(v) => update({ type: v })} options={ACTION_TYPE_OPTIONS} />
        </div>
      </div>

      {/* Tipo de ataque + custo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <FieldLabel>Tipo de Ataque / Efeito</FieldLabel>
          <select
            value={form.attackType ?? ""}
            onChange={(e) => update({ attackType: e.target.value })}
            className="w-full h-9 bg-slate-950 border border-slate-700 rounded px-2 text-sm text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 appearance-none"
          >
            {ATTACK_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}
                disabled={opt.value === "tr_area" && form.damage?.type === "alma"}>
                {opt.label}{opt.value === "tr_area" && form.damage?.type === "alma" ? " (incompatível com Alma)" : ""}
              </option>
            ))}
          </select>
        </div>
        <div>
          <FieldLabel>Custo Base em PE</FieldLabel>
          <NumberInput value={form.cost} onChange={(v) => update({ cost: v })} min={0} />
        </div>
      </div>

      {/* TR ou Acerto */}
      {isTR && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel>Tipo de TR</FieldLabel>
            <Select value={form.trType} onChange={(v) => update({ trType: v })} options={TR_TYPE_OPTIONS} />
          </div>
          <div>
            <FieldLabel>
              CD{tradeCdDelta !== 0 && <span className="text-slate-500 font-normal ml-1 text-[10px]">(base)</span>}
            </FieldLabel>
            <NumberInput value={cdBase} onChange={(v) => update({ cdBase: v })} min={0} />
            {tradeCdDelta !== 0 && (
              <div className="mt-1 text-[11px] text-slate-400">
                Final: <span className="font-mono text-white font-semibold">{cdBase + tradeCdDelta}</span>
                <span className="text-slate-500 ml-1">
                  ({tradeCdDelta > 0 ? "+" : ""}{tradeCdDelta} trades)
                </span>
              </div>
            )}
          </div>
        </div>
      )}
      {isAcerto && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel>
              Bônus de Acerto{tradeToHitDelta !== 0 && <span className="text-slate-500 font-normal ml-1 text-[10px]">(base)</span>}
            </FieldLabel>
            <NumberInput value={toHitBase} onChange={(v) => update({ toHitBase: v })} />
            {tradeToHitDelta !== 0 && (
              <div className="mt-1 text-[11px] text-slate-400">
                Final: <span className="font-mono text-white font-semibold">+{toHitBase + tradeToHitDelta}</span>
                <span className="text-slate-500 ml-1">
                  ({tradeToHitDelta > 0 ? "+" : ""}{tradeToHitDelta} trades)
                </span>
              </div>
            )}
          </div>
          <div />
        </div>
      )}

      {/* Tipo de Alcance + Parâmetros do BT */}
      <div className="bg-slate-900/60 border border-slate-800 rounded p-3 space-y-2">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tipo de Alcance</div>
        <div className="flex gap-2">
          {[
            { value: "distancia", label: "À Distância" },
            { value: "cac",       label: "Corpo a Corpo" },
          ].map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => updateRangeType(value)}
              className={`flex-1 py-1.5 px-3 rounded text-xs font-semibold transition-colors border focus:outline-none ${
                rangeType === value
                  ? "bg-purple-900/60 border-purple-700 text-purple-200"
                  : "bg-slate-950 border-slate-700 text-slate-400 hover:text-white hover:border-slate-600"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] font-mono">
          <span className="text-slate-500">
            Alcance Máx: <span className="text-slate-300">{params.range}m</span>
          </span>
          <span className="text-slate-500">
            Área Máx: <span className="text-slate-300">{params.area}m</span>
          </span>
          {rangeType === "cac" && (
            <span className="text-emerald-400 font-semibold">
              +{params.meleeBonusDice} dado{params.meleeBonusDice > 1 ? "s" : ""} CaC
            </span>
          )}
        </div>
      </div>

      {/* Alcance e Área */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <FieldLabel hint={rangeLocked ? "auto" : "livre"}>Alcance</FieldLabel>
          <div className="flex gap-1">
            {rangeLocked ? (
              <div className="flex-1 h-9 bg-slate-950/30 border border-slate-700/50 rounded px-2 text-sm text-slate-400 flex items-center select-none">
                {form.range || "-"}
              </div>
            ) : (
              <div className="flex-1">
                <TextInput value={form.range ?? ""} onChange={(v) => update({ range: v })} placeholder="Ex: Toque, Visão..." />
              </div>
            )}
            <button
              type="button"
              onClick={toggleRangeLock}
              title={rangeLocked ? "Desbloquear para editar manualmente" : "Restaurar valor automático"}
              className="w-9 h-9 flex items-center justify-center rounded border transition-colors flex-shrink-0 focus:outline-none"
              style={lockBtnStyle(rangeLocked)}
            >
              {rangeLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
        <div>
          <FieldLabel hint={areaLocked ? "auto" : "livre"}>Área</FieldLabel>
          <div className="flex gap-1">
            {areaLocked ? (
              <div className="flex-1 h-9 bg-slate-950/30 border border-slate-700/50 rounded px-2 text-sm text-slate-400 flex items-center select-none">
                {form.area || "-"}
              </div>
            ) : (
              <div className="flex-1">
                <TextInput value={form.area ?? ""} onChange={(v) => update({ area: v })} placeholder="Ex: Cone, Esfera..." />
              </div>
            )}
            <button
              type="button"
              onClick={toggleAreaLock}
              title={areaLocked ? "Desbloquear para editar manualmente" : "Restaurar valor automático"}
              className="w-9 h-9 flex items-center justify-center rounded border transition-colors flex-shrink-0 focus:outline-none"
              style={lockBtnStyle(areaLocked)}
            >
              {areaLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Dano base */}
      {hasDamage && (
        <div className="bg-slate-900/60 border border-slate-800 rounded p-3 space-y-2">
          {/* Header com lock */}
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              Dano Base
              {isAutoCalc && (
                <span className="text-[10px] bg-purple-900/40 border border-purple-800 text-purple-300 px-1.5 py-0.5 rounded font-normal tracking-normal">
                  Auto
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={toggleLock}
              title={isLocked ? "Desbloquear (restaurar auto-cálculo)" : "Bloquear (manter valores manuais)"}
              className="flex items-center gap-1 px-2 py-1 rounded text-[10px] border transition-colors focus:outline-none focus:ring-1 focus:ring-purple-500/40"
              style={{
                borderColor: isLocked ? "rgb(217 119 6 / 0.6)" : "rgb(71 85 105)",
                color:       isLocked ? "rgb(251 191 36)"       : "rgb(100 116 139)",
                background:  isLocked ? "rgb(120 53 15 / 0.2)"  : "transparent",
              }}
            >
              {isLocked
                ? <><Lock className="w-3 h-3" /> Manual</>
                : <><Unlock className="w-3 h-3" /> Auto</>
              }
            </button>
          </div>

          {/* Narrativa do ataque */}
          <div>
            <FieldLabel>Narrativa do Ataque</FieldLabel>
            <Select
              value={narrativeType}
              onChange={(v) => updateDamage({ narrativeType: v, isNarrativePhysical: v === "fisica" })}
              options={NARRATIVE_OPTIONS}
            />
          </div>

          {/* Campos de dado */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div>
              <FieldLabel>
                <span className="whitespace-nowrap">Nº Dados</span>
                {hasActiveTrades && <span className="text-slate-600 font-normal ml-1 text-[9px]">base</span>}
              </FieldLabel>
              <NumberInput
                value={numDiceBase}
                onChange={(v) => updateDamage({ numDiceBase: v, damageIsLocked: true })}
                min={0}
              />
            </div>
            <div>
              <FieldLabel><span className="whitespace-nowrap">Dado</span></FieldLabel>
              <select
                value={dieSize}
                onChange={(e) => updateDamage({ dieSize: parseInt(e.target.value), damageIsLocked: true })}
                className="w-full h-9 bg-slate-950 border border-slate-700 rounded px-2 text-sm text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              >
                {DIE_SIZES.map((d) => <option key={d} value={d}>d{d}</option>)}
              </select>
            </div>
            <div>
              <FieldLabel><span className="whitespace-nowrap">Fixo</span></FieldLabel>
              <NumberInput
                value={mod}
                onChange={(v) => updateDamage({ mod: v, damageIsLocked: true })}
              />
            </div>
            <div>
              <FieldLabel><span className="whitespace-nowrap">Tipo de Dano</span></FieldLabel>
              <select
                value={form.damage?.type ?? "cortante"}
                onChange={(e) => updateDamage({ type: e.target.value })}
                className="w-full h-9 bg-slate-950 border border-slate-700 rounded px-2 text-sm text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              >
                {DAMAGE_TYPE_GROUPS.map(({ label, types }) => (
                  <optgroup key={label} label={label}>
                    {types.map((t) => (
                      <option key={t} value={t}
                        disabled={t === "alma" && form.attackType === "tr_area"}>
                        {DAMAGE_TYPE_LABELS[t]}{t === "alma" && form.attackType === "tr_area" ? " (incompatível com Área)" : ""}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          </div>

          {/* Preview da rolagem */}
          {(finalDice > 0 || mod !== 0) && (
            <div className="text-xs text-slate-400 flex items-center gap-2 flex-wrap">
              <span>
                Rolagem:{" "}
                <span className="font-mono text-white font-semibold">
                  {rollStr(finalDice, dieSize, mod)}
                </span>
              </span>
              <span className="text-slate-500">(méd. {rollAverage(finalDice, dieSize, mod)})</span>
            </div>
          )}

          {/* Conversão Equivalente — steppers contextuais por tipo de ofensiva */}
          {(isAcerto || isTR) && (
            <div className="border-t border-slate-700/50 pt-2.5 space-y-2.5">
              <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                Conversão Equivalente
              </div>

              {isAcerto && (
                <>
                  <TradeRow
                    label="Dados → Acerto"
                    hint={`Cada dado sacrificado concede +2 Acerto (máx. ${capDadosAcerto})`}
                    value={trades.sacrifDadosAcerto}
                    onChange={(v) => updateTrade({ sacrifDadosAcerto: v })}
                    blocked={blockedDadosAcerto}
                    max={capDadosAcerto}
                  />
                  <TradeRow
                    label="Acerto → Dados"
                    hint={`Cada -2 Acerto concede +1 Dado (máx. ${capAcertoDados} Acerto)`}
                    value={trades.sacrifAcertoDados}
                    onChange={(v) => updateTrade({ sacrifAcertoDados: v })}
                    step={2}
                    blocked={blockedAcertoDados}
                    max={capAcertoDados}
                  />
                </>
              )}

              {isTR && (
                <>
                  <TradeRow
                    label="Dados → CD"
                    hint={`Cada dado sacrificado concede +1 CD (máx. ${capDadosCD})`}
                    value={trades.sacrifDadosCD}
                    onChange={(v) => updateTrade({ sacrifDadosCD: v })}
                    blocked={blockedDadosCD}
                    max={capDadosCD}
                  />
                  <TradeRow
                    label="CD → Dados"
                    hint={`Cada -1 CD concede +1 Dado (máx. ${capCdDados})`}
                    value={trades.sacrifCdDados}
                    onChange={(v) => updateTrade({ sacrifCdDados: v })}
                    blocked={blockedCdDados}
                    max={capCdDados}
                  />
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Condição */}
      <div className="bg-slate-900/60 border border-slate-800 rounded p-3 space-y-2">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Condição (Opcional)</div>
        {isAcerto ? (
          <p className="text-xs text-slate-500 italic">
            Condições só podem ser aplicadas em Testes de Resistência.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <FieldLabel>Força da Condição</FieldLabel>
                <select
                  value={form.condition?.tier ?? "nenhuma"}
                  onChange={(e) => handleTierChange(e.target.value)}
                  className="w-full h-9 bg-slate-950 border border-slate-700 rounded px-2 text-sm text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                >
                  {CONDITION_TIER_OPTIONS.map((opt) => {
                    const minBt = BT_MIN_FOR_TIER[opt.value];
                    const locked = minBt != null && bt < minBt;
                    return (
                      <option key={opt.value} value={opt.value} disabled={locked}>
                        {opt.label}{locked ? ` (BT +${minBt} mín.)` : ""}
                      </option>
                    );
                  })}
                </select>
                {form.condition?.tier && form.condition.tier !== "nenhuma" &&
                  (BT_MIN_FOR_TIER[form.condition.tier] ?? 0) > bt && (
                  <div className="mt-1 text-[10px] text-red-400">
                    BT insuficiente para esta condição (requer +{BT_MIN_FOR_TIER[form.condition.tier]}, atual +{bt})
                  </div>
                )}
              </div>
              {hasCond && (
                <div>
                  <FieldLabel>Método de Custo</FieldLabel>
                  <Select
                    value={form.condition?.payment ?? "pe"}
                    onChange={(v) => updateCond({ payment: v })}
                    options={CONDITION_PAYMENT_OPTIONS}
                  />
                </div>
              )}
            </div>

            {hasCond && (() => {
              const tierKey = TIER_TO_CONDITIONS_KEY[form.condition?.tier ?? ""];
              const condNamesForTier = tierKey ? CONDITIONS[tierKey] : [];
              return (
                <div className="space-y-2">
                  <div>
                    <FieldLabel>Nome da Condição</FieldLabel>
                    <select
                      value={form.condition?.nameKey ?? ""}
                      onChange={(e) => handleCondNameKey(e.target.value)}
                      className="w-full h-9 bg-slate-950 border border-slate-700 rounded px-2 text-sm text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                    >
                      <option value="">— Selecione —</option>
                      {condNamesForTier.map((n) => (
                        <option key={n} value={n}>{n.charAt(0).toUpperCase() + n.slice(1)}</option>
                      ))}
                      <option value="outro">Outro / Customizado</option>
                    </select>
                  </div>
                  {form.condition?.nameKey === "outro" && (
                    <div>
                      <FieldLabel hint="campo livre">Nome Customizado</FieldLabel>
                      <TextInput
                        value={form.condition?.name ?? ""}
                        onChange={(v) => updateCond({ name: v })}
                        placeholder="Descreva a condição..."
                      />
                    </div>
                  )}
                </div>
              );
            })()}

          </>
        )}
      </div>

      {/* Flavor Text / Narração */}
      <div>
        <FieldLabel hint="flavor text — aparece antes do texto mecânico no preview">
          Texto Narrativo
        </FieldLabel>
        <TextArea
          value={form.description}
          onChange={(v) => update({ description: v })}
          rows={2}
          placeholder="Ex: Com um rugido, a besta desfere uma garra afiada..."
        />
      </div>

      <RulesReference attackType={form.attackType} conditionTier={form.condition?.tier} />
    </div>
  );
}

// ============================================================
// REFERÊNCIA DE REGRAS
// ============================================================
function RulesReference({ attackType, conditionTier }) {
  const tips = [];

  if (attackType === "tr_individual")
    tips.push("TR Individual: O dano base é equivalente a 1 ND inferior ao Acerto. Falha = Dano completo calculado. Sucesso = Metade do dano.");
  else if (attackType === "tr_area")
    tips.push("TR em Área: falha = dano completo, sucesso = metade do dano.");

  if (conditionTier && conditionTier !== "nenhuma") {
    const pe = CONDITION_PE_COST[conditionTier];
    const nd = CONDITION_ND_COST[conditionTier];
    tips.push(
      `Condição ${CONDITION_TIER_LABELS[conditionTier]}: pagar ${pe} PE ou reduzir ${nd} ND do dano.`
    );
  }

  if (!tips.length) return null;

  return (
    <div className="bg-blue-950/30 border border-blue-900/40 rounded p-2.5 space-y-1">
      {tips.map((tip, i) => (
        <div key={i} className="flex items-start gap-2 text-[11px] text-blue-300">
          <Info className="w-3 h-3 mt-0.5 flex-shrink-0 text-blue-400" />
          {tip}
        </div>
      ))}
    </div>
  );
}
