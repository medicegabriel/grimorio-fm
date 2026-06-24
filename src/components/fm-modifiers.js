// fm-modifiers.js
// ============================================================
// MOTOR DE AUTOMAÇÃO — Fase 1: runtime de modificadores (buffs/debuffs)
// ============================================================
// Camada PURA (zero React). Resolve os modificadores temporários que vivem
// no combatState (activeModifiers) sobre os stats congelados do snapshot,
// produzindo os stats "ao vivo" que o tracker exibe.
//
// Um modificador mexe em: atributo cru (cascateia via re-derivação),
// stat derivado (Defesa, Acerto, CD, RD...) ou TR (save). Ver plano-mestre
// em memory/project_motor-automacao.md.
// ============================================================

import { deriveStats } from "./fm-derive";

// ------------------------------------------------------------
// CATÁLOGO DE ALVOS — o que um modificador pode mexer
// ------------------------------------------------------------
export const MODIFIER_ATTRS = [
  { key: "forca",        label: "Força" },
  { key: "destreza",     label: "Destreza" },
  { key: "constituicao", label: "Constituição" },
  { key: "inteligencia", label: "Inteligência" },
  { key: "sabedoria",    label: "Sabedoria" },
  { key: "presenca",     label: "Presença" },
];

export const MODIFIER_STATS = [
  { key: "defesa",             label: "Defesa" },
  { key: "acerto",             label: "Acerto" },
  { key: "cdBase",             label: "CD" },
  { key: "atencao",            label: "Atenção" },
  { key: "iniciativa",         label: "Iniciativa" },
  { key: "deslocamento",       label: "Deslocamento" },
  { key: "rdGeral",            label: "RD Geral" },
  { key: "rdIrredutivel",      label: "RD Irredutível" },
  { key: "guardaInabavalMax",  label: "Guarda Inabalável (máx)" },
  { key: "hpMax",              label: "PV Máximo" },
  { key: "peMax",              label: "PE Máximo" },
  { key: "vidaTempPorAtaque",  label: "Vida Temp. por Ataque" },
];

export const MODIFIER_SAVES = [
  { key: "astucia",     label: "TR Astúcia" },
  { key: "fortitude",   label: "TR Fortitude" },
  { key: "reflexos",    label: "TR Reflexos" },
  { key: "vontade",     label: "TR Vontade" },
  { key: "integridade", label: "TR Integridade" },
];

export const MODIFIER_TARGET_GROUPS = [
  { label: "Atributos",       items: MODIFIER_ATTRS },
  { label: "Combate",         items: MODIFIER_STATS },
  { label: "Resistências",    items: MODIFIER_SAVES },
];

const ATTR_KEY_SET = new Set(MODIFIER_ATTRS.map((a) => a.key));
const SAVE_KEY_SET = new Set(MODIFIER_SAVES.map((s) => s.key));

const TARGET_LABELS = Object.fromEntries(
  [...MODIFIER_ATTRS, ...MODIFIER_STATS, ...MODIFIER_SAVES].map((t) => [t.key, t.label])
);
export const getTargetLabel = (key) => TARGET_LABELS[key] ?? key;
export const isAttrTarget = (key) => ATTR_KEY_SET.has(key);
export const isSaveTarget = (key) => SAVE_KEY_SET.has(key);

// ------------------------------------------------------------
// MODOS DE EMPILHAMENTO E DURAÇÃO
// ------------------------------------------------------------
export const STACK_MODES = [
  { key: "sum",     label: "Soma",        hint: "Todos os valores somam." },
  { key: "highest", label: "Maior vence", hint: "Só o maior valor vale." },
  { key: "unique",  label: "Único",       hint: "Não empilha consigo mesmo (por nome)." },
];

// Fase 1 expõe rounds/manual/scene. 'conditional' fica reservado pra Fase 3
// (precisa do avaliador de expressões da DSL) — tratado como 'manual' por ora.
export const DURATION_KINDS = [
  { key: "rounds", label: "Rodadas" },
  { key: "manual", label: "Até remover" },
  { key: "scene",  label: "Combate inteiro" },
];

export const MODIFIER_OPS = [
  { key: "add", label: "Somar (±)" },
  { key: "set", label: "Definir (=)" },
];

const num = (x) => {
  const n = Number(x);
  return Number.isFinite(n) ? n : 0;
};

// ------------------------------------------------------------
// FACTORY
// ------------------------------------------------------------
export function newModifier(partial = {}) {
  return {
    id: partial.id ?? `mod_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    name: partial.name ?? "",
    stat: partial.stat ?? "defesa",
    op: partial.op ?? "add",            // 'add' | 'set'
    value: num(partial.value),
    stack: partial.stack ?? "sum",       // 'sum' | 'highest' | 'unique'
    // Grupo do empilhamento "highest": só o maior vence DENTRO do mesmo grupo
    // (ex.: categoria de origem). Grupos diferentes somam. null = grupo único.
    group: partial.group ?? null,
    duration: partial.duration ?? { kind: "manual" }, // { kind, rounds? }
    source: partial.source ?? null,      // { combatantId, ruleId, name } — usado na Fase 4
    // Carga extra de efeitos NÃO-stat que reusam o runtime de modificadores
    // (toggle/duração/tick/reset). Ex.: boost de dano de ação usa stat "__dmg"
    // + payload { scope, amount, fixed }. resolveLiveStats ignora stats fora
    // dos catálogos, então o payload trafega intacto sem poluir os stats.
    payload: partial.payload ?? null,
    enabled: partial.enabled !== false,
  };
}

// ------------------------------------------------------------
// EMPILHAMENTO — resolve um conjunto de mods sobre um valor base
// ------------------------------------------------------------
function applyStatMods(base, ms) {
  let val = num(base);

  // 'set' (definir): o último definido vence.
  const sets = ms.filter((m) => m.op === "set");
  if (sets.length) val = num(sets[sets.length - 1].value);

  // 'add' (somar): agrupado por modo de empilhamento. 'mul' é tratado à parte.
  const adds = ms.filter((m) => m.op !== "set" && m.op !== "mul");
  let total = adds
    .filter((m) => (m.stack ?? "sum") === "sum")
    .reduce((a, m) => a + num(m.value), 0);

  // 'highest' (maior vence): só o maior vale DENTRO de cada grupo; grupos
  // distintos somam (ex.: o maior buff de Ação + o maior buff de Característica).
  const highGroups = {};
  for (const m of adds.filter((m) => m.stack === "highest")) {
    const k = m.group ?? "__hi__";
    highGroups[k] = Math.max(highGroups[k] ?? -Infinity, num(m.value));
  }
  total += Object.values(highGroups).reduce((a, v) => a + v, 0);

  const uniq = {};
  for (const m of adds.filter((m) => m.stack === "unique")) {
    const k = m.name || m.id;
    uniq[k] = Math.max(uniq[k] ?? -Infinity, num(m.value));
  }
  total += Object.values(uniq).reduce((a, v) => a + v, 0);

  // 'mul' (multiplicar): aplicado por ÚLTIMO sobre (base + somas). Usado por
  // condições ("metade do deslocamento" = ×0,5). Vários multiplicam em cadeia.
  let result = val + total;
  for (const m of ms.filter((x) => x.op === "mul")) result *= num(m.value);
  return result;
}

// ------------------------------------------------------------
// Re-deriva os stats com um conjunto de atributos (pra cascata).
// Reconstrói o `raw` a partir do snapshot. Falha silenciosa → null.
// ------------------------------------------------------------
function deriveSafe(snapshot, attributes) {
  if (!snapshot?.core) return null;
  try {
    return deriveStats({
      core: snapshot.core,
      attributes,
      overrides: snapshot.overrides ?? {},
      skills: snapshot.skills ?? [],
      attackAttr: snapshot.attackAttr ?? "forca",
      cdAttr: snapshot.cdAttr ?? null,
      treinamentos: snapshot.treinamentos ?? [],
      aptidoes: snapshot.aptidoes ?? {},
      dotes: snapshot.dotes ?? [],
      aptidoesEspeciais: snapshot.aptidoesEspeciais ?? [],
      caracteristicas: snapshot.caracteristicas ?? [],
    });
  } catch {
    return null;
  }
}

// ------------------------------------------------------------
// RESOLUÇÃO PRINCIPAL — stats/saves/atributos "ao vivo"
// ------------------------------------------------------------
// Retorna { stats, saves, attributes, modified } onde `modified` é um mapa
// de chaves alteradas (pra UI marcar buff/debuff). Sem modificadores, devolve
// o base intacto (caminho rápido, custo zero).
export function resolveLiveStats(snapshot, combatState) {
  const baseStats = snapshot?.stats ?? {};
  const baseSaves = snapshot?.saves ?? {};
  const baseAttrs = snapshot?.attributes ?? {};
  const baseSkills = snapshot?.skills ?? [];

  const mods = (combatState?.activeModifiers ?? []).filter(
    (m) => m && m.enabled !== false
  );
  if (!mods.length) {
    return { stats: baseStats, saves: baseSaves, attributes: baseAttrs, skills: baseSkills, modified: {} };
  }

  // Base completa (garante chaves derivadas em runtime, ex.: acerto/cdBase,
  // que nem sempre estão persistidas no snapshot.stats). O snapshot vence
  // onde já tem valor; a derivação só preenche lacunas.
  const baseDerived = deriveSafe(snapshot, baseAttrs);
  const baseFullStats = { ...(baseDerived?.stats ?? {}), ...baseStats };
  const baseFullSaves = { ...(baseDerived?.saves ?? {}), ...baseSaves };

  const outStats = { ...baseFullStats };
  const outSaves = { ...baseFullSaves };
  let outAttrs = baseAttrs;
  let outSkills = baseSkills;

  // 1) Atributos crus → cascata via DELTA de re-derivação (preserva os
  //    números persistidos; soma apenas a variação que o atributo causou).
  const attrMods = mods.filter((m) => ATTR_KEY_SET.has(m.stat));
  if (attrMods.length) {
    const patchedAttrs = { ...baseAttrs };
    for (const a of MODIFIER_ATTRS) {
      const ms = attrMods.filter((m) => m.stat === a.key);
      if (ms.length) patchedAttrs[a.key] = applyStatMods(baseAttrs[a.key] ?? 10, ms);
    }
    outAttrs = patchedAttrs;

    const patchedDerived = deriveSafe(snapshot, patchedAttrs);
    if (baseDerived && patchedDerived) {
      for (const key of Object.keys(patchedDerived.stats)) {
        const delta = num(patchedDerived.stats[key]) - num(baseDerived.stats[key]);
        if (delta) outStats[key] = num(outStats[key]) + delta;
      }
      for (const key of Object.keys(patchedDerived.saves)) {
        const delta = num(patchedDerived.saves[key]) - num(baseDerived.saves[key]);
        if (delta) outSaves[key] = num(outSaves[key]) + delta;
      }
      // Perícias: o mod de cada skill depende do atributo → recalcula por DELTA
      // do skillDerivations (preserva overrides: finalMod já os respeita, delta=0).
      const baseSD = baseDerived.skillDerivations ?? {};
      const patchedSD = patchedDerived.skillDerivations ?? {};
      outSkills = baseSkills.map((sk) => {
        const b = baseSD[sk.id]?.finalMod;
        const p = patchedSD[sk.id]?.finalMod;
        if (b == null || p == null) return sk;
        const delta = num(p) - num(b);
        return delta ? { ...sk, mod: num(sk.mod) + delta } : sk;
      });
    }
  }

  // 2) Stats derivados diretos
  for (const t of MODIFIER_STATS) {
    const ms = mods.filter((m) => m.stat === t.key);
    if (ms.length) outStats[t.key] = applyStatMods(outStats[t.key], ms);
  }

  // 3) TRs (saves) diretos + agregado 'resistencias' (todas as TRs).
  const resistMods = mods.filter((m) => m.stat === "resistencias");
  for (const t of MODIFIER_SAVES) {
    const ms = mods.filter((m) => m.stat === t.key).concat(resistMods);
    if (ms.length) outSaves[t.key] = applyStatMods(outSaves[t.key], ms);
  }

  // 4) Perícias: modificadores planos (condições). 'pericias' = todas;
  //    'skill:<nome>' = uma específica (match por nome normalizado). Aplicado
  //    sobre o mod já ajustado por atributo.
  const periciaMods = mods.filter(
    (m) => m.stat === "pericias" || (typeof m.stat === "string" && m.stat.startsWith("skill:"))
  );
  if (periciaMods.length) {
    const normName = (s) => (s ?? "").toString().normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
    outSkills = outSkills.map((sk) => {
      const n = normName(sk.name);
      const applicable = periciaMods.filter((m) => m.stat === "pericias" || m.stat === `skill:${n}`);
      if (!applicable.length) return sk;
      return { ...sk, mod: applyStatMods(num(sk.mod), applicable) };
    });
  }

  // Mapa de chaves alteradas (pra indicadores visuais).
  const modified = {};
  for (const key of Object.keys(outStats)) {
    if (num(outStats[key]) !== num(baseFullStats[key])) modified[key] = true;
  }
  for (const a of MODIFIER_ATTRS) {
    if (num(outAttrs[a.key]) !== num(baseAttrs[a.key])) modified[a.key] = true;
  }
  for (const t of MODIFIER_SAVES) {
    if (num(outSaves[t.key]) !== num(baseFullSaves[t.key])) modified[`save_${t.key}`] = true;
  }
  if (outSkills !== baseSkills) {
    for (let i = 0; i < outSkills.length; i++) {
      if (outSkills[i] !== baseSkills[i]) modified[`skill_${outSkills[i].id}`] = true;
    }
  }

  return { stats: outStats, saves: outSaves, attributes: outAttrs, skills: outSkills, modified };
}

// ------------------------------------------------------------
// TICK DE RODADA — decrementa as durações em rodadas e expira as zeradas.
// Demais durações (manual/scene/conditional) passam intactas.
// ------------------------------------------------------------
export function tickModifiersRound(modifiers = []) {
  return modifiers
    .map((m) => {
      if (m?.duration?.kind !== "rounds") return m;
      return { ...m, duration: { ...m.duration, rounds: (m.duration.rounds ?? 0) - 1 } };
    })
    .filter((m) => !(m?.duration?.kind === "rounds" && (m.duration.rounds ?? 0) <= 0));
}

// ------------------------------------------------------------
// Resumo textual da duração (pra badges).
// ------------------------------------------------------------
export function durationLabel(duration) {
  if (!duration) return "∞";
  if (duration.kind === "rounds") return `${duration.rounds ?? 0} rod.`;
  if (duration.kind === "scene") return "combate";
  return "∞";
}
