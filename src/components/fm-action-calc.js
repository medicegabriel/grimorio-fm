import { getDamage, PATAMAR_ND_RANGE } from "./fm-tables";

/**
 * ============================================================
 * fm-action-calc — núcleo puro do cálculo de ações
 * ============================================================
 * Toda a lógica de regras das ações (cálculo de dano, trades,
 * divisores, normalização e geração de texto) vive aqui, sem
 * dependência de React. Os componentes em sections/actions/
 * apenas consomem este módulo.
 * ============================================================
 */

// ============================================================
// CONSTANTES
// ============================================================
export const ACTION_TYPE_OPTIONS = [
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

export const ATTACK_TYPE_OPTIONS = [
  { value: "acerto",        label: "Teste de Acerto (dano total)" },
  { value: "tr_individual", label: "TR Individual (dano -1 ND)" },
  { value: "tr_area",       label: "TR em Área (dano ÷2)" },
  { value: "suporte",       label: "Suporte / Defesa (sem dano)" },
];

export const NARRATIVE_OPTIONS = [
  { value: "padrao", label: "Arma / Padrão" },
  { value: "fisica",  label: "Narrativa Física (Soco, Chute...)" },
];

export const TR_TYPE_OPTIONS = [
  { value: "fortitude",   label: "Fortitude" },
  { value: "reflexos",    label: "Reflexos" },
  { value: "vontade",     label: "Vontade" },
  { value: "astucia",     label: "Astúcia" },
  { value: "integridade", label: "Integridade" },
];

export const TR_TYPE_LABELS = {
  fortitude: "Fortitude", reflexos: "Reflexos", vontade: "Vontade",
  astucia: "Astúcia", integridade: "Integridade",
};

export const DAMAGE_TYPE_GROUPS = [
  { label: "Físicos",    types: ["cortante", "perfurante", "impacto"] },
  { label: "Elementais", types: ["ácido", "congelante", "chocante", "queimante", "sônico"] },
  { label: "Etéreos",    types: ["alma", "energia reversa", "energético", "psíquico", "radiante"] },
  { label: "Biológicos", types: ["necrótico", "venenoso"] },
];

export const DAMAGE_TYPE_LABELS = {
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

export const CONDITION_TIER_OPTIONS = [
  { value: "nenhuma", label: "Nenhuma" },
  { value: "fraca",   label: "Fraca (2 PE ou -1 ND)" },
  { value: "media",   label: "Média (5 PE ou -2 ND)" },
  { value: "forte",   label: "Forte (8 PE ou -3 ND)" },
  { value: "extrema", label: "Extrema (10 PE ou -4 ND)" },
];

export const CONDITION_TIER_LABELS = {
  fraca: "Fraca", media: "Média", forte: "Forte", extrema: "Extrema",
};

export const CONDITION_PE_COST  = { fraca: 2, media: 5, forte: 8, extrema: 10 };
export const CONDITION_ND_COST  = { fraca: 1, media: 2, forte: 3, extrema: 4 };
export const BT_MIN_FOR_TIER    = { fraca: 2, media: 3, forte: 4, extrema: 5 };

export const CONDITION_PAYMENT_OPTIONS = [
  { value: "pe", label: "Pagar com PE" },
  { value: "nd", label: "Reduzir ND do Dano" },
];

export const CONDITION_NAMES = [
  "Abalado", "Amedrontado", "Apavorado", "Atordoado", "Caído",
  "Cego", "Confuso", "Desprevenido", "Doente", "Em Chamas",
  "Enfeitiçado", "Envenenado", "Exausto", "Fascinado", "Fraco",
  "Imóvel", "Inconsciente", "Lento", "Paralisado", "Sangrando",
  "Surdo", "Vulnerável",
];

export const CONDITION_NAME_OPTIONS = [
  { value: "", label: "— Selecione —" },
  ...CONDITION_NAMES.map((n) => ({ value: n, label: n })),
  { value: "outro", label: "Outro / Customizado" },
];

export const TIER_TO_CONDITIONS_KEY = {
  fraca: "fracas", media: "medias", forte: "fortes", extrema: "extremas",
};

export const BLANK_CONDITION = { tier: "nenhuma", payment: "pe", nameKey: "", name: "" };

export const DIE_SIZES = [4, 6, 8, 10, 12, 20];

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

export const getActionParams = (bt) =>
  ACTION_PARAMETERS[Math.min(6, Math.max(2, bt ?? 2))] ?? ACTION_PARAMETERS[2];

export const TRADES_ZERO = { sacrifDadosAcerto: 0, sacrifDadosCD: 0, sacrifAcertoDados: 0, sacrifCdDados: 0 };

// ============================================================
// MODELO "MÉDIA → SPLIT" (dano sempre ~45% dado / 55% fixo)
// ============================================================
// A tabela DAMAGE_TABLE passa a ser usada só pelo campo `.avg` (média);
// a string de roll vira mero exemplo. Toda modificação age sobre a MÉDIA
// e, no fim, `splitAverage` reconstrói uma expressão com ~45% em dados.

// Penalidade de dano fixo por ND abaixo do mínimo do patamar.
export const BELOW_MIN_PENALTY = { lacaio: 1, capanga: 2, comum: 2, desafio: 3, calamidade: 4 };

const DMG_FACES = [4, 6, 8, 10, 12];
const faceAvgOf = (f) => (f + 1) / 2;
const TARGET_DICE_FRACTION = 0.45;
const PISO_MEDIA = faceAvgOf(4); // 2.5 — piso global: nada abaixo de 1d4

// Face "do nível" pela magnitude da média (d4 → d12).
export function faceForAverage(avg) {
  if (avg < 8) return 4;
  if (avg < 18) return 6;
  if (avg < 38) return 8;
  if (avg < 80) return 10;
  return 12;
}

// Média base da tabela com reduções de ND (TR Individual / Condição por ND).
// Abaixo do mínimo do patamar, subtrai a penalidade por ND.
export function baseAverage(patamar, nd, ndReduction = 0) {
  const minND = PATAMAR_ND_RANGE[patamar]?.min ?? 1;
  const ndCalc = (nd ?? 0) - (ndReduction ?? 0);
  if (ndCalc >= minND) return getDamage(patamar, ndCalc)?.avg ?? null;
  const floorEntry = getDamage(patamar, minND);
  if (!floorEntry) return null;
  const penalty = BELOW_MIN_PENALTY[patamar] ?? 2;
  return floorEntry.avg - (minND - ndCalc) * penalty;
}

// Reconstrói uma expressão NdF+fixo a partir da média alvo, mirando ~45%
// em dados. Testa a face do nível e até ±2 faces vizinhas; piso de 1d4.
export function splitAverage(avg) {
  if (!avg || avg <= PISO_MEDIA) return { numDice: 1, dieSize: 4, mod: 0 };
  const band = faceForAverage(avg);
  const bi = DMG_FACES.indexOf(band);
  let best = null;
  for (const f of DMG_FACES) {
    const step = Math.abs(DMG_FACES.indexOf(f) - bi);
    if (step > 2) continue;
    const m = faceAvgOf(f);
    const ideal = (TARGET_DICE_FRACTION * avg) / m;
    for (const n of [Math.floor(ideal), Math.round(ideal), Math.ceil(ideal)]) {
      if (n < 1 || n > 14) continue;
      const mod = Math.round(avg - n * m);
      if (mod < 0) continue;
      const dice = n * m;
      const frac = dice / (dice + mod);
      const score =
        Math.abs(frac - TARGET_DICE_FRACTION) +
        Math.abs(dice + mod - avg) * 0.003 +
        step * 0.012 +
        n * 0.0015;
      if (!best || score < best.score) best = { numDice: n, dieSize: f, mod, score };
    }
  }
  return best
    ? { numDice: best.numDice, dieSize: best.dieSize, mod: best.mod }
    : { numDice: 1, dieSize: 4, mod: Math.max(0, Math.round(avg - PISO_MEDIA)) };
}

// ============================================================
// CALCULATE ACTION DAMAGE — pipeline rigorosa (7 passos)
// ============================================================
// Dano BASE de uma ação (sem CaC/trades/divisor — esses entram no runFull).
// Aplica reduções de ND (TR Individual + Condição-ND) e a Narrativa Física,
// e devolve já a expressão NdF+fixo via splitAverage. Usado pra semear o form.
export function calculateActionDamage(
  patamar, nd, attackType, isNarrativeFisica = false, conditionNdReduction = 0
) {
  if (!patamar || !nd || attackType === "suporte") return null;
  const ndRed = (attackType === "tr_individual" ? 1 : 0) + (conditionNdReduction ?? 0);
  let avg = baseAverage(patamar, nd, ndRed);
  if (avg == null) return null;
  if (isNarrativeFisica) {
    const lf = faceForAverage(baseAverage(patamar, nd, 0) ?? avg);
    avg -= 2 * faceAvgOf(lf);
  }
  avg = Math.max(PISO_MEDIA, avg);
  const s = splitAverage(avg);
  return {
    numDice: s.numDice,
    dieSize: s.dieSize,
    mod: s.mod,
    roll: rollStr(s.numDice, s.dieSize, s.mod),
    average: rollAverage(s.numDice, s.dieSize, s.mod),
  };
}

// ============================================================
// TRADE HELPERS
// ============================================================
export function enforceMutualExclusion(trades) {
  const t = { ...trades };
  if ((t.sacrifDadosAcerto ?? 0) > 0) t.sacrifAcertoDados = 0;
  if ((t.sacrifAcertoDados ?? 0) > 0) t.sacrifDadosAcerto = 0;
  if ((t.sacrifDadosCD    ?? 0) > 0) t.sacrifCdDados      = 0;
  if ((t.sacrifCdDados    ?? 0) > 0) t.sacrifDadosCD      = 0;
  return t;
}

export function applyTrades(numDiceBase, toHitBase, cdBase, rangeType, trades, bt) {
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
export function computeDivisor(attackType, damageType) {
  let divisor = 1;
  if (attackType === "tr_area") divisor *= 2;
  if (damageType === "alma")    divisor *= 3;
  return divisor;
}

// Pipeline Target Average com degradação dinâmica de dado:
// A) Média bruta → B) Média alvo (divisores) → C) Degrada face se necessário → reconstrói dados+fixo
const FACES_VALIDAS = [20, 12, 10, 8, 6, 4, 2];
export function applyDivisorFull(dadosBrutos, dieSize, modBase, divisor) {
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
export function resetTradesForAttackType(attackType, currentTrades) {
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
export function calcAutoRange(attackType, rangeType, bt) {
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
export const rollStr = (numDice, dieSize, mod) => {
  if (!numDice || !dieSize) return mod ? (mod > 0 ? `+${mod}` : `${mod}`) : "";
  const base = `${numDice}d${dieSize}`;
  if (!mod) return base;
  return mod > 0 ? `${base}+${mod}` : `${base}${mod}`;
};

export const rollAverage = (numDice, dieSize, mod) => {
  if (!numDice || !dieSize) return mod || 0;
  return Math.round(numDice * (dieSize + 1) / 2 + (mod || 0));
};

export const parseRollFromStr = (roll) => {
  const m = (roll ?? "").match(/^(\d+)d(\d+)([+-]\d+)?$/i);
  if (!m) return null;
  return { numDice: parseInt(m[1]), dieSize: parseInt(m[2]), mod: parseInt(m[3] ?? "0") };
};

// ============================================================
// ESTADO DERIVADO (puro — sem React)
// ============================================================
export const deriveFinalDice = (dmg) => {
  const base = dmg?.numDice ?? 0;
  if (dmg?.damageIsCalculated) return base;
  return dmg?.isNarrativePhysical ? Math.max(0, base - 2) : base;
};

export const deriveCondPE = (condition) => {
  if (!condition) return 0;
  if (condition.tier === "nenhuma" || !condition.tier) return 0;
  if (condition.payment !== "pe") return 0;
  return CONDITION_PE_COST[condition.tier] ?? 0;
};

export const deriveFinalPE = (baseCost, condition) => (baseCost ?? 0) + deriveCondPE(condition);

export const getCondNdReduction = (condition) => {
  if (!condition || condition.tier === "nenhuma" || condition.payment !== "nd") return 0;
  return CONDITION_ND_COST[condition.tier] ?? 0;
};

// ============================================================
// COMPATIBILIDADE DE BT — condições e trades exigem BT mínimo
// ============================================================
const TRADE_BT_LABELS = {
  sacrifDadosAcerto: "Dados → Acerto",
  sacrifDadosCD:     "Dados → CD",
  sacrifCdDados:     "CD → Dados",
  sacrifAcertoDados: "Acerto → Dados",
};

// BT mínimo que uma ação exige (maior entre o tier da condição e os trades).
export function actionRequiredBt(action) {
  const t = { ...TRADES_ZERO, ...(action?.trades ?? {}) };
  const tier = action?.condition?.tier;
  const condMin = tier && tier !== "nenhuma" ? (BT_MIN_FOR_TIER[tier] ?? 0) : 0;
  return Math.max(
    condMin,
    t.sacrifDadosAcerto ?? 0,
    t.sacrifDadosCD ?? 0,
    t.sacrifCdDados ?? 0,
    Math.ceil((t.sacrifAcertoDados ?? 0) / 2),
  );
}

// Ajusta uma ação para caber num dado BT: REMOVE a condição cujo tier exige BT
// maior e CORTA cada trade para o cap do BT. Retorna a ação ajustada + a lista
// legível das mudanças (vazia = nada a ajustar). Não recalcula dano/acerto —
// quem aplica reroda o pipeline (applyTemplate/recalc) sobre os novos valores.
export function clampActionToBt(action, bt) {
  const changes = [];
  const next = { ...action };

  const tier = action?.condition?.tier;
  if (tier && tier !== "nenhuma" && (BT_MIN_FOR_TIER[tier] ?? 0) > bt) {
    next.condition = { ...BLANK_CONDITION };
    changes.push(`Condição ${CONDITION_TIER_LABELS[tier] ?? tier} removida (requer BT +${BT_MIN_FOR_TIER[tier]}, criatura tem +${bt}).`);
  }

  const t = { ...TRADES_ZERO, ...(action?.trades ?? {}) };
  const caps = {
    sacrifDadosAcerto: bt,
    sacrifDadosCD:     bt,
    sacrifCdDados:     bt,
    sacrifAcertoDados: bt * 2,
  };
  const nt = { ...t };
  let tradesChanged = false;
  for (const k of Object.keys(caps)) {
    if ((nt[k] ?? 0) > caps[k]) {
      changes.push(`Conversão ${TRADE_BT_LABELS[k]} reduzida de ${nt[k]} para ${caps[k]}.`);
      nt[k] = caps[k];
      tradesChanged = true;
    }
  }
  if (tradesChanged) next.trades = nt;

  return { action: next, changes };
}

// ============================================================
// normalizeAction
// ============================================================
export function normalizeAction(action) {
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
    ...action,
    rangeLocked: action.rangeLocked ?? true,
    areaLocked:  action.areaLocked  ?? true,
    damage: {
      type: "cortante",
      isNarrativePhysical: false,
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
      name: nameKey === "outro" ? existingName : nameKey,
      ...(action.condition ?? {}),
      nameKey,
    },
  };
}

// ============================================================
// TOKENS DO TEXTO FINAL — placeholders que resolvem ao vivo
// ============================================================
// O "Texto Final" manual pode conter marcadores {{dano}}, {{acerto}}, etc.
// que são resolvidos na hora de exibir. Assim a prosa fica livre, mas os
// números acompanham qualquer recálculo (ND, trades, narrativa…) sem
// dessincronizar. Os mesmos marcadores semeiam o editor ao entrar no manual.
export const ACTION_TEXT_TOKENS = [
  { key: "dano",     label: "Dano" },
  { key: "tipoDano", label: "Tipo de Dano" },
  { key: "acerto",   label: "Acerto" },
  { key: "cd",       label: "CD" },
  { key: "alcance",  label: "Alcance" },
  { key: "area",     label: "Área" },
  { key: "custo",    label: "Custo PE" },
  { key: "criatura", label: "Criatura" },
];

// Valor atual de cada token a partir da ação (estrutura mecânica viva).
export function actionTokenValues(action, creatureName) {
  const dmg       = action?.damage;
  const finalDice = deriveFinalDice(dmg);
  const dieSize   = dmg?.dieSize ?? 8;
  const mod       = dmg?.mod ?? 0;
  const dmgType   = dmg?.type === "alma" ? "na Alma" : (DAMAGE_TYPE_LABELS[dmg?.type] || dmg?.type || "");
  return {
    dano:     rollStr(finalDice, dieSize, mod),
    tipoDano: dmgType,
    acerto:   `+${action?.toHit ?? 0}`,
    cd:       `${action?.cd ?? 0}`,
    alcance:  action?.range || "-",
    area:     action?.area  || "-",
    custo:    `${deriveFinalPE(action?.cost, action?.condition)}`,
    nome:     action?.name || "",
    criatura: creatureName?.trim() || "A criatura",
  };
}

const TOKEN_RE = /\{\{\s*(\w+)\s*\}\}/g;

export const hasActionTokens = (text) => TOKEN_RE.test(text || "");

// Substitui {{token}} pelos valores atuais; tokens desconhecidos ficam intactos.
export function resolveActionTokens(text, action, creatureName) {
  if (!text) return text;
  const vals = actionTokenValues(action, creatureName);
  return text.replace(TOKEN_RE, (m, key) => (key in vals ? vals[key] : m));
}

// Troca o nome da criatura de origem pelo token {{criatura}}, tornando o texto
// genérico (vira "A criatura" por padrão e o nome da ficha-alvo ao aplicar).
// Usado ao SALVAR uma ação como Modelo.
export function tokenizeCreatureName(text, creatureName) {
  const name = creatureName?.trim();
  if (!text || !name) return text;
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return text.replace(new RegExp(escaped, "g"), "{{criatura}}");
}

// ============================================================
// resolveActionFinalText — texto final exibido da ação
// ============================================================
// Se o usuário escreveu um "Texto Final" manual (finalTextManual), resolve
// seus tokens e usa o resultado. Caso contrário, gera automaticamente.
export function resolveActionFinalText(action, creatureName) {
  if (action?.finalTextManual?.trim())
    return resolveActionTokens(action.finalTextManual, action, creatureName);
  return generateActionDescription(action, creatureName, action?.description) || humanizeAction(action);
}

// ============================================================
// humanizeAction — consumida por CombatantPanel e LivePreview
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
export function generateActionDescription(action, creatureName, flavorText = "", { tokenize = false } = {}) {
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

  // Valores emitidos: literais (exibição) ou tokens {{…}} (semeia o editor
  // manual). Os GUARDS abaixo seguem usando os valores reais (rollDisplay/
  // finalPE/hasCond) — só o que é IMPRESSO troca para token.
  const vRoll = tokenize ? "{{dano}}"     : rollDisplay;
  const vType = tokenize ? "{{tipoDano}}" : dmgType;
  const vHit  = tokenize ? "{{acerto}}"   : `+${action.toHit ?? 0}`;
  const vCd   = tokenize ? "{{cd}}"       : `${action.cd ?? 0}`;
  const vAlc  = tokenize ? "{{alcance}}"  : alcance;
  const vArea = tokenize ? "{{area}}"     : area;
  const vPE   = tokenize ? "{{custo}}"    : `${finalPE}`;
  const vCreature = tokenize ? "{{criatura}}" : creature;

  if (isAcerto && !isComplex) {
    const opening = flavor || `${vCreature} golpeia utilizando ${action.name || "esta ação"}.`;
    return `${opening} Alcance de ${vAlc}, ${vHit} para acertar, causa ${vRoll} de dano ${vType}.`;
  }

  if (isTR || isComplex) {
    const trAttr   = TR_TYPE_LABELS[action.trType] || "TR";
    const isCaC    = action.rangeType === "cac";
    const targetDesc = isTRArea
      ? (isCaC ? "Toda criatura na área partindo de você" : "Toda criatura na área")
      : "A criatura alvo";
    const areaLine = isTRArea
      ? `Área: ${vArea}${isCaC ? " partindo de si mesmo" : ""}`
      : null;
    const lines    = [
      `Conjuração: ${actionTypeLabel}`,
      `Alcance: ${vAlc}`,
      ...(!isTRArea ? [`Alvo: Uma criatura`] : []),
      ...(areaLine  ? [areaLine]             : []),
      ...(finalPE > 0 ? [`Custo: ${vPE} PE`] : []),
      "",
    ];

    let mechanicalText = "";
    if (isTR && rollDisplay) {
      mechanicalText = `${targetDesc} deve realizar um teste de resistência de ${trAttr} (CD ${vCd}), recebendo ${vRoll} de dano ${vType}, ou apenas metade em um sucesso.`;
    } else if (isTR) {
      mechanicalText = `${targetDesc} deve realizar um teste de resistência de ${trAttr} (CD ${vCd}).`;
    } else if (isAcerto && rollDisplay) {
      mechanicalText = `Alcance de ${vAlc}, ${vHit} para acertar, causa ${vRoll} de dano ${vType}.`;
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
// PIPELINE COMPOSTO — recálculo completo + reaplicação de trades
// ============================================================
// runFullActionCalc: recalcula da tabela + trades + pipeline de divisor.
// Usado quando o dano está destravado. As fontes de toHitBase/cdBase
// variam entre ActionItem (norm) e ActionForm (derived), por isso
// entram como parâmetros.
export function runFullActionCalc({
  patamar, nd, bt, attackType, condition, narrativeType, rangeType, trades, damageType, toHitBase, cdBase,
}) {
  if (!patamar || !nd || attackType === "suporte") return null;
  const t = { ...TRADES_ZERO, ...(trades ?? {}) };

  // 1) Média base (com reduções de ND e penalidade abaixo do mínimo).
  const ndRed = (attackType === "tr_individual" ? 1 : 0) + getCondNdReduction(condition);
  let avg = baseAverage(patamar, nd, ndRed);
  if (avg == null) return null;

  // Face do nível: unidade das modificações "em médias de dado" (estável).
  const fAvg = faceAvgOf(faceForAverage(baseAverage(patamar, nd, 0) ?? avg));

  // 2) Corpo-a-Corpo (+dados por BT) e Narrativa Física (−2 dados), ANTES da divisão.
  if (rangeType === "cac") avg += getActionParams(bt).meleeBonusDice * fAvg;
  if (narrativeType === "fisica") avg -= 2 * fAvg;

  // 3) Trades: mexem na média (mesmas taxas) e no Acerto/CD.
  avg += fAvg * (
    Math.floor((t.sacrifAcertoDados ?? 0) / 2) + (t.sacrifCdDados ?? 0)
    - (t.sacrifDadosAcerto ?? 0) - (t.sacrifDadosCD ?? 0)
  );
  const acertoFinal = (toHitBase ?? 0) + (t.sacrifDadosAcerto ?? 0) * 2 - (t.sacrifAcertoDados ?? 0);
  const cdFinal     = (cdBase ?? 0) + (t.sacrifDadosCD ?? 0) - (t.sacrifCdDados ?? 0);

  // 4) Divisor de Área (÷2) / Alma (÷3) na média (nunca os dois — Alma não é área).
  if (attackType === "tr_area") avg /= 2;
  if (damageType === "alma")    avg /= 3;

  // 5) Piso 1d4 + split (~45% dado / 55% fixo).
  avg = Math.max(PISO_MEDIA, avg);
  const s = splitAverage(avg);
  const roll = rollStr(s.numDice, s.dieSize, s.mod);
  const average = rollAverage(s.numDice, s.dieSize, s.mod);

  return {
    toHit: acertoFinal,
    toHitBase: toHitBase ?? 0,
    cd: cdFinal,
    cdBase: cdBase ?? 0,
    damage: {
      numDice: s.numDice,
      numDiceBase: s.numDice,
      dieSize: s.dieSize,
      mod: s.mod,
      roll,
      average,
      damageIsCalculated: true,
    },
  };
}

// reapplyTrades: caminho do dano TRAVADO (manual). Não recalcula os dados
// (o usuário os digitou) — só atualiza Acerto/CD pelas trocas.
export function reapplyTrades(src, rangeType, trades, bt) { // eslint-disable-line no-unused-vars
  const t = { ...TRADES_ZERO, ...(trades ?? {}) };
  const acerto = (src.toHitBase ?? src.toHit ?? 0) + (t.sacrifDadosAcerto ?? 0) * 2 - (t.sacrifAcertoDados ?? 0);
  const cd     = (src.cdBase ?? src.cd ?? 0) + (t.sacrifDadosCD ?? 0) - (t.sacrifCdDados ?? 0);
  return { toHit: acerto, cd, damage: { ...src.damage } };
}

// ============================================================
// recalcAction — re-deriva UMA ação para o ND/Patamar/BT atuais
// ============================================================
// Usado quando o ND/Patamar muda no builder e o usuário pede pra
// sincronizar as ações. Respeita as travas:
//  - Alcance/Área: só atualiza os que estão em modo automático
//    (rangeLocked/areaLocked !== false).
//  - Dano travado (damageIsLocked): mantém os dados digitados e atualiza
//    só Acerto/CD/Alcance/Área — A NÃO SER que `recalcLockedDamage` peça
//    pra re-derivar o dano também (a trava é preservada nesse caso).
//  - finalTextManual: preservado verbatim; só marca `finalTextStale: true`
//    quando algum número exibido mudou (pra UI avisar que pode estar velho).
// Sempre carimba `calc` com o ND/Patamar/Dificuldade aplicados.
export function recalcAction(action, ctx) {
  const { patamar, nd, difficulty, bt, toHitBase, cdBase, recalcLockedDamage = false } = ctx;
  const norm  = normalizeAction(action);
  const stamp = { nd, patamar, difficulty };

  const av    = calcAutoRange(norm.attackType, norm.rangeType, bt);
  const range = norm.rangeLocked !== false ? av.range : norm.range;
  const area  = norm.areaLocked  !== false ? av.area  : norm.area;

  const finalize = (result) => {
    const changed =
      result.toHit !== norm.toHit ||
      result.cd    !== norm.cd ||
      (result.damage?.roll ?? "") !== (norm.damage?.roll ?? "") ||
      result.range !== norm.range ||
      result.area  !== norm.area;
    // Texto com tokens ({{dano}}…) resolve ao vivo → nunca fica desatualizado.
    // Só texto manual LITERAL (legado) precisa do selo de aviso.
    if (norm.finalTextManual?.trim() && !hasActionTokens(norm.finalTextManual) && changed)
      result.finalTextStale = true;
    return result;
  };

  if (norm.attackType === "suporte") {
    return finalize({ ...action, range, area, calc: stamp });
  }

  const damageLocked = !!norm.damage?.damageIsLocked;

  if (!damageLocked || recalcLockedDamage) {
    const r = runFullActionCalc({
      patamar, nd, bt,
      attackType: norm.attackType,
      condition: norm.condition,
      narrativeType: norm.damage?.narrativeType,
      rangeType: norm.rangeType,
      trades: norm.trades,
      damageType: norm.damage?.type,
      toHitBase, cdBase,
    });
    if (!r) return finalize({ ...action, range, area, calc: stamp });
    return finalize({
      ...action,
      range, area, calc: stamp,
      toHit: r.toHit, toHitBase: r.toHitBase,
      cd: r.cd, cdBase: r.cdBase,
      // Preserva o estado da trava: uma ação manual continua manual,
      // só que agora com os dados re-derivados.
      damage: { ...norm.damage, ...r.damage, damageIsLocked: damageLocked },
    });
  }

  // Dano travado mantido: só Acerto/CD (pelas trocas) + Alcance/Área.
  const reapplied = reapplyTrades(
    { toHitBase, cdBase, toHit: norm.toHit, cd: norm.cd, damage: norm.damage },
    norm.rangeType, norm.trades, bt
  );
  return finalize({
    ...action,
    range, area, calc: stamp,
    toHitBase, cdBase,
    toHit: reapplied.toHit, cd: reapplied.cd,
    damage: { ...norm.damage },
  });
}
