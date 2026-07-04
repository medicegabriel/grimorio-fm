// fm-automation.js
// ============================================================
// MOTOR DE AUTOMAÇÃO — Fase 2: modelo da spec + autoria (bloquinhos)
// ============================================================
// Camada PURA. Define o formato de `entity.automation` que o editor de
// bloquinhos (AutomationBuilder) gera e que o tracker consome. Uma automação
// é uma lista de REGRAS; cada regra tem um GATILHO e uma lista de EFEITOS.
//
// Fase 2 cobre: gatilhos `passive` e `activated`; efeito `modify_stat`
// (buff/debuff, reaproveita o runtime de fm-modifiers). Gatilhos por evento,
// alvo cross-combatant e outros tipos de efeito entram nas fases seguintes.
// Ver plano-mestre em memory/project_motor-automacao.md.
// ============================================================

import { newModifier, getTargetLabel } from "./fm-modifiers";
import { evalNumber, evalBoolean } from "./fm-dsl";
import { CONDITIONS } from "./fm-tables";

// ------------------------------------------------------------
// CATÁLOGO DE GATILHOS (Fase 2 expõe os 2 primeiros)
// ------------------------------------------------------------
export const TRIGGER_TYPES = [
  { key: "passive",     label: "Passiva (sempre ativa)" },
  { key: "activated",   label: "Ativada manualmente" },
  { key: "hp_below",    label: "Quando PV ≤ limiar" },
  // Rodada = toda vez que vira a rodada (afeta TODOS). Turno = quando chega a
  // vez do combatente no combate (afeta só ele). Disparam efeitos INSTANTÂNEOS
  // (recurso + condição) no momento certo.
  { key: "round_start", label: "No início de cada rodada" },
  { key: "round_end",   label: "No fim de cada rodada" },
  { key: "turn_start",  label: "No início de cada turno" },
  { key: "turn_end",    label: "No fim de cada turno" },
  { key: "on_damaged",  label: "Ao sofrer dano" },
];
// Gatilhos já funcionais no runtime.
export const TRIGGER_ENABLED = new Set([
  "passive", "activated", "hp_below", "on_damaged",
  "round_start", "round_end", "turn_start", "turn_end",
]);

// Gatilho hp_below: modificadores SUSTENTADOS reativos (recalculados ao vivo,
// auto-aplicam/removem conforme o PV cruza o limiar).
export const triggerRunsSustained = (type) => type === "passive" || type === "hp_below" || type === "activated";

export const ACTION_COST_TYPES = [
  { key: "",           label: "Sem ação" },
  { key: "completa",   label: "Ação Completa" },
  { key: "comum",      label: "Ação Comum" },
  { key: "rapida",     label: "Ação Rápida" },
  { key: "movimento",  label: "Movimento" },
  { key: "reacao",     label: "Reação" },
];

// Como uma regra ATIVADA se comporta ao ser acionada no tracker.
export const ACTIVATION_MODES = [
  { key: "toggle", label: "Liga/Desliga", hint: "Sustentada: aplica os buffs até desativar (ou expirar)." },
  { key: "once",   label: "Uso único",    hint: "Aplica uma vez; expira sozinho pela duração." },
];

// Tipos de efeito que uma regra pode ter.
export const EFFECT_TYPES = [
  { key: "modify_stat",        label: "Modificar atributo / stat" },
  { key: "resource",           label: "Recurso (PV / PE / Guarda)" },
  { key: "condition",          label: "Condição (aplicar / remover)" },
  { key: "action_damage",      label: "Dano de ações (Amplificação)" },
  { key: "action_range",       label: "Alcance / Área de ações" },
  { key: "condition_immunity", label: "Imunidade a condição" },
];

// Escopo do boost de dano de ações (Amplificação de Domínio):
//  • corporal — Testes de Acerto que não causam condição, não são Técnica
//    Máxima nem dano na Alma (ataques armados/desarmados). Nível = +1 ND.
//  • tecnica  — demais ações de dano (Feitiços). Soma dados direto.
export const ACTION_DAMAGE_SCOPES = [
  { key: "corporal", label: "Corporal (ataques de Acerto)" },
  { key: "tecnica",  label: "Técnica (Feitiços)" },
];

// Aplicar ou remover uma condição (instantâneo, na ativação).
export const CONDITION_OPS = [
  { key: "apply",  label: "Aplicar" },
  { key: "remove", label: "Remover" },
];

// Lista achatada de condições do catálogo (fm-tables) p/ o seletor do editor.
export const CONDITION_OPTIONS = Object.values(CONDITIONS)
  .flat()
  .sort()
  .map((n) => ({ key: n, label: n.charAt(0).toUpperCase() + n.slice(1) }));

const CONDITION_LABELS = Object.fromEntries(CONDITION_OPTIONS.map((c) => [c.key, c.label]));

// Recurso de combate que um efeito INSTANTÂNEO pode alterar (aplicado ao ativar,
// não reverte ao desativar). Só faz sentido em gatilho Ativado.
export const RESOURCE_TARGETS = [
  { key: "hp",      label: "PV" },
  { key: "pe",      label: "PE" },
  { key: "hp_temp", label: "PV Temporário" },
  { key: "guarda",  label: "Guarda Inabalável" },
];

export const RESOURCE_OPS = [
  { key: "add",      label: "Recuperar (+)" },
  { key: "subtract", label: "Gastar / Perder (−)" },
  { key: "set",      label: "Definir (=)" },
];

const RESOURCE_LABELS = Object.fromEntries(RESOURCE_TARGETS.map((r) => [r.key, r.label]));

// ------------------------------------------------------------
// FACTORIES
// ------------------------------------------------------------
const genId = (p) => `${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

export function newStatEffect(partial = {}) {
  return {
    id: partial.id ?? genId("eff"),
    type: "modify_stat",
    stat: partial.stat ?? "defesa",
    op: partial.op ?? "add",
    value: Number(partial.value) || 0,
    // Quando preenchido, o valor vem de uma expressão DSL (ex.: "metade(nd)")
    // e o campo `value` vira só fallback. Vazio = valor fixo.
    valueExpr: partial.valueExpr ?? "",
    stack: partial.stack ?? "sum",
    // Duração só importa para gatilho 'activated' (passivas valem enquanto ativas).
    duration: partial.duration ?? { kind: "rounds", rounds: 3 },
  };
}

export function newResourceEffect(partial = {}) {
  return {
    id: partial.id ?? genId("eff"),
    type: "resource",
    resource: partial.resource ?? "hp",
    op: partial.op ?? "add",            // 'add' | 'subtract' | 'set'
    value: Number(partial.value) || 0,
    valueExpr: partial.valueExpr ?? "", // expressão DSL opcional
  };
}

export function newConditionEffect(partial = {}) {
  return {
    id: partial.id ?? genId("eff"),
    type: "condition",
    op: partial.op ?? "apply",            // 'apply' | 'remove'
    condition: partial.condition ?? CONDITION_OPTIONS[0]?.key ?? "abalado",
    duration: partial.duration ?? { kind: "rounds", rounds: 1 },
  };
}

export function newActionDamageEffect(partial = {}) {
  return {
    id: partial.id ?? genId("eff"),
    type: "action_damage",
    scope: partial.scope ?? "corporal",   // 'corporal' | 'tecnica'
    amount: Number(partial.amount) || 0,   // corporal: níveis de dano (+ND); tecnica: dados
    fixed: Number(partial.fixed) || 0,     // dano fixo extra
    // Sustentado (vira modificador): em gatilho Ativado usa a duração.
    duration: partial.duration ?? { kind: "rounds", rounds: 3 },
  };
}

// Aumenta o Alcance (ataques E feitiços) e a Área (feitiços apenas) das ações,
// em metros. Sustentado: vira um modificador "__range" + payload.
export function newActionRangeEffect(partial = {}) {
  return {
    id: partial.id ?? genId("eff"),
    type: "action_range",
    range: Number(partial.range) || 0,   // metros somados ao Alcance (ataques e feitiços)
    area: Number(partial.area) || 0,      // metros somados à Área (feitiços apenas)
    duration: partial.duration ?? { kind: "rounds", rounds: 3 },
  };
}

// Imunidade a uma ou mais condições enquanto a regra estiver ativa (toggle) ou
// sempre (passiva). Sustentado: vira um modificador "__immune" + payload.
export function newImmunityEffect(partial = {}) {
  return {
    id: partial.id ?? genId("eff"),
    type: "condition_immunity",
    conditions: Array.isArray(partial.conditions) ? partial.conditions : [],
  };
}

// Cria um efeito do tipo pedido (preserva o id quando informado). Usado pelo
// editor ao trocar o tipo de um efeito.
export function newEffect(type, partial = {}) {
  if (type === "resource") return newResourceEffect(partial);
  if (type === "condition") return newConditionEffect(partial);
  if (type === "action_damage") return newActionDamageEffect(partial);
  if (type === "action_range") return newActionRangeEffect(partial);
  if (type === "condition_immunity") return newImmunityEffect(partial);
  return newStatEffect(partial);
}

export function newRule(partial = {}) {
  return {
    id: partial.id ?? genId("rule"),
    name: partial.name ?? "Nova regra",
    enabled: partial.enabled !== false,
    trigger: partial.trigger ?? { type: "passive" },
    // Como a regra ativada é acionada: 'toggle' (liga/desliga) ou 'once' (uso único).
    activation: partial.activation ?? "toggle",
    // custo/gating só para 'activated'
    cost: partial.cost ?? { pe: 0, acao: "" },
    // Pré-requisito (expressão DSL). Vazio = sem pré-requisito. Quando falso,
    // a regra não aplica (passiva é ignorada; ativada fica bloqueada).
    requires: partial.requires ?? "",
    effects: partial.effects ?? [newStatEffect()],
  };
}

export function newAutomation(partial = {}) {
  return {
    enabled: partial.enabled !== false,
    rules: partial.rules ?? [],
  };
}

// ------------------------------------------------------------
// NORMALIZAÇÃO (fichas legadas / templates)
// ------------------------------------------------------------
export function normalizeAutomation(automation) {
  if (!automation || !Array.isArray(automation.rules)) return null;
  return {
    enabled: automation.enabled !== false,
    rules: automation.rules.map((r) => ({
      ...newRule(r),
      effects: (r.effects ?? []).map((e) => newEffect(e?.type ?? "modify_stat", e)),
    })),
  };
}

// ------------------------------------------------------------
// AUTOMAÇÃO DE ITENS OFICIAIS DO CATÁLOGO (interna — D0)
// ------------------------------------------------------------
// As Habilidades-Base do sistema NÃO são editáveis pelo usuário (o editor de
// bloquinhos é travado a tipo:"custom"). Quando uma entrada oficial precisa de
// efeito mecânico, ela declara um `motorAuto` no próprio catálogo — uma spec do
// motor (igual à `entity.automation`) OU uma função `(ctx) => spec` p/ valores
// que dependem da ficha. Esta função resolve essa spec para UMA instância do
// draft, carimbando ids estáveis (por instância) p/ o toggle/ativação funcionar.
// O usuário que quiser modificar uma base cria uma Custom de mesmo nome.
export function buildCatalogAutomation(entry, instance, ctx = null) {
  if (!entry?.motorAuto || !instance) return null;
  const raw = typeof entry.motorAuto === "function" ? entry.motorAuto(ctx) : entry.motorAuto;
  if (!raw || !Array.isArray(raw.rules) || !raw.rules.length) return null;
  const base = instance.id ?? entry.key ?? "x";
  return {
    enabled: raw.enabled !== false,
    rules: raw.rules.map((r, ri) => {
      const rule = newRule({ ...r, name: r.name ?? instance.nome ?? entry.nome });
      rule.id = `cat_${base}_${ri}`;
      rule.effects = (r.effects ?? []).map((e, ei) => {
        const eff = newEffect(e?.type ?? "modify_stat", e);
        eff.id = `cat_${base}_${ri}_${ei}`;
        return eff;
      });
      return rule;
    }),
  };
}

// ------------------------------------------------------------
// CONSULTAS
// ------------------------------------------------------------
export const hasAutomation = (entity) =>
  !!entity?.automation?.enabled && (entity.automation.rules?.length ?? 0) > 0;

export const automationRuleCount = (entity) =>
  hasAutomation(entity) ? entity.automation.rules.length : 0;

// ------------------------------------------------------------
// RESOLUÇÃO → modificadores (ponte com o runtime da Fase 1)
// ------------------------------------------------------------
// Converte os efeitos modify_stat de UMA regra em objetos de modificador
// (fm-modifiers). `source` carrega a origem (nome da habilidade, ids) pra
// exibição e pra ligar/desligar regras ativadas. IDs determinísticos por
// regra+efeito (evita stacking duplicado ao reativar e chaves React estáveis).
// Avalia o pré-requisito (DSL) de uma regra. Sem `requires` ou sem contexto → true.
export function ruleRequiresMet(rule, ctx = null) {
  if (!rule?.requires || !ctx) return true;
  return evalBoolean(rule.requires, ctx, true);
}

export function ruleModifiers(rule, source = {}, ctx = null) {
  // 'live' = recalculado ao vivo a cada render (passiva/hp_below): não persiste,
  // não tica — duração 'manual'. Ativada usa a duração declarada no efeito.
  const isLive = rule?.trigger?.type === "passive" || rule?.trigger?.type === "hp_below";
  return (rule?.effects ?? [])
    .filter((e) => e.type === "modify_stat" || e.type === "action_damage" || e.type === "condition_immunity" || e.type === "action_range")
    .map((e) => {
      const duration = isLive ? { kind: "manual" } : (e.duration ?? { kind: "manual" });
      // Imunidade a condição: sustentada enquanto a regra vale. Reusa o runtime
      // via stat "__immune" + payload (resolveLiveStats ignora; coletor lê).
      if (e.type === "condition_immunity") {
        return newModifier({
          id: `${rule.id}__${e.id}`,
          name: source.name || rule.name || "Habilidade",
          stat: "__immune",
          op: "add", value: 0,
          group: source.group ?? null,
          duration: { kind: "manual" },
          payload: { conditions: Array.isArray(e.conditions) ? e.conditions : [] },
          source: { ...source, ruleId: rule.id },
        });
      }
      // Boost de Alcance/Área de ação: reusa o runtime via stat "__range"
      // + payload (resolveLiveStats ignora; um coletor próprio lê de volta).
      if (e.type === "action_range") {
        return newModifier({
          id: `${rule.id}__${e.id}`,
          name: source.name || rule.name || "Habilidade",
          stat: "__range",
          op: "add",
          value: 0,
          group: source.group ?? null,
          duration,
          payload: { range: Number(e.range) || 0, area: Number(e.area) || 0 },
          source: { ...source, ruleId: rule.id },
        });
      }
      // Boost de dano de ação: reusa o runtime de modificadores via stat "__dmg"
      // + payload (resolveLiveStats ignora; um coletor próprio lê de volta).
      if (e.type === "action_damage") {
        return newModifier({
          id: `${rule.id}__${e.id}`,
          name: source.name || rule.name || "Habilidade",
          stat: "__dmg",
          op: "add",
          value: 0,
          group: source.group ?? null,
          duration,
          payload: { scope: e.scope ?? "corporal", amount: Number(e.amount) || 0, fixed: Number(e.fixed) || 0 },
          source: { ...source, ruleId: rule.id },
        });
      }
      return newModifier({
        id: `${rule.id}__${e.id}`,
        name: source.name || rule.name || "Habilidade",
        stat: e.stat,
        op: e.op,
        // Valor por expressão DSL quando houver `valueExpr` e contexto; senão fixo.
        value: (ctx && e.valueExpr) ? Math.round(evalNumber(e.valueExpr, ctx, e.value)) : e.value,
        stack: e.stack,
        group: source.group ?? null,
        duration,
        source: { ...source, ruleId: rule.id },
      });
    });
}

// Agrega os boosts de dano ATIVOS (modificadores stat "__dmg") por escopo. Soma
// níveis/dados e dano fixo de cada escopo. Lido no tracker para reexibir o dano
// das ações afetadas. Ver applyActionDamageBoost em fm-action-calc.
// Lista (deduplicada) das condições a que o combatente está imune AGORA, lendo
// os modificadores "__immune" ativos (regras passivas + ativadas ligadas).
export function collectImmuneConditions(modifiers = []) {
  const out = new Set();
  for (const m of modifiers) {
    if (!m || m.stat !== "__immune" || m.enabled === false || !m.payload) continue;
    for (const c of (m.payload.conditions ?? [])) out.add(c);
  }
  return [...out];
}

export function collectActionDamageBoosts(modifiers = []) {
  const out = { corporal: { amount: 0, fixed: 0 }, tecnica: { amount: 0, fixed: 0 } };
  for (const m of modifiers) {
    if (!m || m.stat !== "__dmg" || !m.payload || m.enabled === false) continue;
    const sc = m.payload.scope === "tecnica" ? "tecnica" : "corporal";
    out[sc].amount += Number(m.payload.amount) || 0;
    out[sc].fixed += Number(m.payload.fixed) || 0;
  }
  return out;
}

// Agrega os boosts de Alcance/Área ATIVOS (modificadores stat "__range"). Soma
// os metros de alcance (ataques e feitiços) e de área (feitiços). Lido no
// tracker para reexibir o alcance/área das ações afetadas. Ver
// applyActionRangeBoost em fm-action-calc.
export function collectActionRangeBoosts(modifiers = []) {
  const out = { range: 0, area: 0 };
  for (const m of modifiers) {
    if (!m || m.stat !== "__range" || !m.payload || m.enabled === false) continue;
    out.range += Number(m.payload.range) || 0;
    out.area += Number(m.payload.area) || 0;
  }
  return out;
}

// Junta os modificadores de TODAS as regras PASSIVAS de uma lista de entidades
// (features, ações, dotes, aptidões, treinamentos, características...). Cada
// entidade só precisa ter { id, name, automation }. Recalculado ao vivo no
// tracker e concatenado na resolução (nunca persiste no combatState).
export function collectPassiveModifiers(entities = [], ctx = null) {
  const out = [];
  for (const ent of entities) {
    if (!hasAutomation(ent)) continue;
    for (const rule of ent.automation.rules) {
      if (rule.enabled === false) continue;
      const t = rule.trigger?.type;
      // Modificadores reativos: passiva (sempre) e hp_below (quando PV ≤ limiar%).
      if (t !== "passive" && t !== "hp_below") continue;
      if (t === "hp_below") {
        const thr = Number(rule.trigger?.threshold ?? 50);
        if ((ctx?.hp_pct ?? 100) > thr) continue; // PV acima do limiar → não aplica
      }
      if (!ruleRequiresMet(rule, ctx)) continue; // pré-requisito não atendido
      out.push(...ruleModifiers(rule, { name: ent.name, entityId: ent.id, kind: t, group: ent.__autoGroup }, ctx));
    }
  }
  return out;
}

// Mudanças INSTANTÂNEAS de recurso de uma regra (PV/PE/Guarda/PV temp),
// aplicadas no momento da ativação (não viram modificador, não revertem).
// Retorna [{ resource, op, value }] com o valor já resolvido pela DSL.
export function resolveResourceChanges(rule, ctx = null) {
  return (rule?.effects ?? [])
    .filter((e) => e.type === "resource")
    .map((e) => ({
      resource: e.resource,
      op: e.op ?? "add",
      value: (ctx && e.valueExpr) ? Math.round(evalNumber(e.valueExpr, ctx, e.value)) : (Number(e.value) || 0),
    }));
}

// Coleta as mudanças de RECURSO das regras `round_start` de todas as entidades
// (Treino de Energia/Potencial Físico = +½ BT de PE por rodada). Disparam
// AUTOMATICAMENTE no início de cada rodada (não têm botão). Retorna
// [{ resource, op, value }] já resolvidas pela DSL (ex.: valueExpr "metade(bt)").
export function collectRoundStartResources(entities = [], ctx = null) {
  const out = [];
  for (const ent of entities) {
    if (!hasAutomation(ent)) continue;
    for (const rule of ent.automation.rules) {
      if (rule.enabled === false) continue;
      if (rule.trigger?.type !== "round_start") continue;
      if (!ruleRequiresMet(rule, ctx)) continue;
      for (const ch of resolveResourceChanges(rule, ctx)) {
        out.push({ ...ch, source: ent.name });
      }
    }
  }
  return out;
}

// Efeitos de CONDIÇÃO de uma regra (aplicar/remover), aplicados na ativação.
export function resolveConditionEffects(rule) {
  return (rule?.effects ?? [])
    .filter((e) => e.type === "condition")
    .map((e) => ({
      op: e.op ?? "apply",
      condition: e.condition,
      duration: e.duration ?? { kind: "rounds", rounds: 1 },
    }));
}

// Reações ao sofrer dano (gatilho on_damaged) de TODAS as entidades. Não
// disparam sozinhas — o tracker as oferece como botões "Reagir" após o dano
// (o narrador decide, sabendo se a condição da habilidade foi atendida, ex.:
// tipo de dano). O valor pode usar `dano` na DSL (ex.: "metade(dano)").
export function collectReactionRules(entities = []) {
  const out = [];
  for (const ent of entities) {
    if (!hasAutomation(ent)) continue;
    for (const rule of ent.automation.rules) {
      if (rule.enabled === false) continue;
      if (rule.trigger?.type !== "on_damaged") continue;
      out.push({ rule, entityName: ent.name, group: ent.__autoGroup });
    }
  }
  return out;
}

// Lista as regras ATIVADAS de uma entidade (com botão de ativação no tracker).
export function activatedRulesOf(entity) {
  if (!hasAutomation(entity)) return [];
  return entity.automation.rules.filter(
    (r) => r.enabled !== false && r.trigger?.type === "activated"
  );
}

// True se a regra tem ao menos um efeito SUSTENTADO (modify_stat → vira um
// modificador que dura). Regras só com efeitos INSTANTÂNEOS (recurso/condição)
// não têm o que "desligar": agem como uso único mesmo no modo Liga/Desliga.
export function ruleHasSustainedEffect(rule) {
  return (rule?.effects ?? []).some((e) =>
    e.type === "modify_stat" || e.type === "action_damage" || e.type === "condition_immunity" || e.type === "action_range");
}

// ------------------------------------------------------------
// RESUMO LEGÍVEL (UI) — descreve uma regra em português claro. Com `ctx` (da
// DSL) resolve o valor das expressões pra mostrar o número na ficha atual
// (ex.: "metade(nd) (+5)"). Usado nos cards recolhidos e na Biblioteca, pra
// confirmar o que a automação faz sem reabrir o editor.
// ------------------------------------------------------------
function durationPhrase(duration) {
  if (!duration) return "";
  if (duration.kind === "rounds") return `por ${duration.rounds ?? 0} rodada(s)`;
  if (duration.kind === "scene") return "no combate inteiro";
  return "até remover";
}

export function summarizeEffect(effect, { isActivated = false, ctx = null } = {}) {
  if (!effect) return "";

  // Efeitos instantâneos (recurso/condição) só rodam em gatilho Ativado; numa
  // regra passiva ficam inertes — o resumo marca isso pra não enganar.
  const instantSuffix = isActivated ? "" : " (só ativada)";

  // Imunidade a condições: "Imune a: Imóvel, Paralisado".
  if (effect.type === "condition_immunity") {
    const list = (effect.conditions ?? []).map((c) => CONDITION_LABELS[c] ?? c).join(", ");
    return `Imune a: ${list || "—"}`;
  }

  // Efeito de condição: "Aplica Atordoado por 2 rodadas" / "Remove Lento".
  if (effect.type === "condition") {
    const label = CONDITION_LABELS[effect.condition] ?? effect.condition;
    if (effect.op === "remove") return `Remove ${label}${instantSuffix}`;
    const d = effect.duration;
    const dur = d?.kind === "rounds" ? ` por ${d.rounds ?? 1} rodada(s)`
      : d?.kind === "scene" ? " (combate inteiro)" : "";
    return `Aplica ${label}${dur}${instantSuffix}`;
  }

  // Boost de Alcance/Área: "Alcance +3m (ataques e feitiços) · Área +1,5m (feitiços)".
  if (effect.type === "action_range") {
    const fmtM = (n) => `${String(n).replace(".", ",")}m`;
    const parts = [];
    if (Number(effect.range)) parts.push(`Alcance +${fmtM(effect.range)} (ataques e feitiços)`);
    if (Number(effect.area))  parts.push(`Área +${fmtM(effect.area)} (feitiços)`);
    let s = parts.length ? parts.join(" · ") : "sem mudança de alcance/área";
    if (isActivated) { const dur = durationPhrase(effect.duration); if (dur) s += ` ${dur}`; }
    return s;
  }

  // Boost de dano de ação: "Ataques de Acerto: +2 níveis +5 fixo por 3 rodadas".
  if (effect.type === "action_damage") {
    const sc = effect.scope === "tecnica" ? "Feitiços" : "Ataques de Acerto";
    const amt = Number(effect.amount) || 0;
    const fx = Number(effect.fixed) || 0;
    const unit = effect.scope === "tecnica" ? `${amt} dado(s)` : `${amt} nível(is) de dano`;
    const parts = [];
    if (amt) parts.push(`+${unit}`);
    if (fx) parts.push(`+${fx} fixo`);
    let s = `${sc}: ${parts.length ? parts.join(" e ") : "sem mudança"}`;
    if (isActivated) { const dur = durationPhrase(effect.duration); if (dur) s += ` ${dur}`; }
    return s;
  }

  // Efeito de recurso (instantâneo): "PV +10", "PE −5", "Guarda = metade(nd) (5)".
  if (effect.type === "resource") {
    const label = RESOURCE_LABELS[effect.resource] ?? effect.resource;
    const hasExpr = !!effect.valueExpr;
    const resolved = hasExpr
      ? (ctx ? Math.round(evalNumber(effect.valueExpr, ctx, effect.value)) : null)
      : (Number(effect.value) || 0);
    const opWord = effect.op === "subtract" ? "−" : effect.op === "set" ? "=" : "+";
    let v = hasExpr ? effect.valueExpr : `${Math.abs(resolved)}`;
    if (hasExpr && resolved != null) v += ` (${resolved})`;
    return `${label} ${opWord}${v}${instantSuffix}`;
  }

  if (effect.type !== "modify_stat") return "";
  const target = getTargetLabel(effect.stat);
  const hasExpr = !!effect.valueExpr;
  const resolved = hasExpr
    ? (ctx ? Math.round(evalNumber(effect.valueExpr, ctx, effect.value)) : null)
    : (Number(effect.value) || 0);

  let valuePart;
  if (effect.op === "set") {
    valuePart = `= ${hasExpr ? effect.valueExpr : resolved}`;
    if (hasExpr && resolved != null) valuePart += ` (${resolved})`;
  } else if (hasExpr) {
    valuePart = effect.valueExpr;
    if (resolved != null) valuePart += ` (${resolved >= 0 ? "+" : ""}${resolved})`;
  } else {
    valuePart = `${resolved >= 0 ? "+" : ""}${resolved}`;
  }

  let s = `${target} ${valuePart}`;
  if (isActivated) {
    const dur = durationPhrase(effect.duration);
    if (dur) s += ` ${dur}`;
  }
  return s;
}

export function summarizeRule(rule, ctx = null) {
  if (!rule) return null;
  const type = rule.trigger?.type ?? "passive";
  const isActivated = type === "activated";
  let trigger;
  if (type === "passive") trigger = "Passiva";
  else if (isActivated) {
    const mode = rule.activation === "once" ? "Uso único" : "Liga/Desliga";
    const pe = rule.cost?.pe ? ` · ${rule.cost.pe} PE` : "";
    trigger = `${mode}${pe}`;
  } else if (type === "hp_below") {
    trigger = `Quando PV ≤ ${rule.trigger?.threshold ?? 50}%`;
  } else if (type === "round_start") {
    trigger = "Início da rodada";
  } else {
    trigger = TRIGGER_TYPES.find((t) => t.key === type)?.label ?? type;
  }
  const effects = (rule.effects ?? [])
    .map((e) => summarizeEffect(e, { isActivated, ctx }))
    .filter(Boolean);
  return {
    trigger,
    effects,
    requires: rule.requires?.trim() || "",
    disabled: rule.enabled === false,
  };
}
