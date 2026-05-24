import { useReducer, useMemo, useCallback } from "react";
import { deriveStats, validateDraft } from "./fm-derive";
import {
  getOriginRawFeatures,
  buildOriginFeature,
  getOriginDefenseItems,
} from "./fm-origens";

/**
 * ============================================================
 * useCreatureBuilder — v2 (polimento)
 * ============================================================
 * Novidades desta versão:
 *  - portraitUrl com action creator dedicado
 *  - skills migradas para id-based (mais robusto que index)
 *  - skills com suporte a override de modificador
 *  - DUPLICATE_ACTION adicionado
 * ============================================================
 */

// ---------- Gerador de ID simples (sem biblioteca externa) ----------
const genId = (prefix) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

// ---------- Estado inicial de uma ficha em branco ----------
export const blankDraft = () => ({
  name: "",
  portraitUrl: "",
  portraitFocus: { x: 50, y: 50 },
  combatSettings: { guardaAbsorbsFirst: true },
  core: {
    grau: "3",
    nd: 5,
    patamar: "comum",
    difficulty: "intermediario",
    origin: { type: "maldicao", subtype: "comum", hasAumentoEnergia: false, hasEstoqueAdicional: false, frutosExperiencia: null },
    size: "medio",
  },
  attributes: {
    forca: 10,
    destreza: 10,
    constituicao: 10,
    inteligencia: 10,
    sabedoria: 10,
    presenca: 10,
  },
  aptidoes: { ea: 0, cl: 0, bar: 0, dom: 0, er: 0 },
  attackAttr: 'forca',
  cdAttr: 'inteligencia',
  overrides: { stats: {}, saves: {} },
  skills: [],
  defenses: {
    resistencias: [],
    imunidades: [],
    vulnerabilidades: [],
    condicoesImunes: [],
    originCondicoesImunes: [], // strings de condições inseridas pela origem (paralelo)
  },
  actions: { list: [] },
  features: [],
  treinamentos: [],
  aptidoesEspeciais: [],
  dotes: [],
  artimanhas: [],
  narratorNotes: "",
});

// ---------- Normaliza skills vindas de fichas antigas (sem id) ----------
const normalizeSkills = (skills = []) =>
  skills.map((s) => ({
    id: s.id || genId("skill"),
    name: s.name || "",
    attribute: s.attribute || "forca",
    mastered: Boolean(s.mastered),
    overrideMod: s.overrideMod ?? null,
  }));

// ---------- Normaliza um draft completo (fichas antigas / parciais) ----------
// Garante que toda chave estrutural exista antes de o reducer mexer nela,
// evitando crash ao adicionar defesas/ações/características em fichas legadas.
const normalizeDraft = (payload = {}) => {
  const base = blankDraft();
  return {
    ...base,
    ...payload,
    portraitUrl: payload.portraitUrl || "",
    portraitFocus: {
      x: clampPercent(payload.portraitFocus?.x, 50),
      y: clampPercent(payload.portraitFocus?.y, 50),
    },
    combatSettings: {
      ...base.combatSettings,
      ...(payload.combatSettings || {}),
    },
    attackAttr:  payload.attackAttr || "forca",
    cdAttr:      payload.cdAttr || "inteligencia",
    core: (() => {
      const merged = {
        ...base.core,
        ...(payload.core || {}),
        origin: { ...base.core.origin, ...(payload.core?.origin || {}) },
      };
      // Invariante do livro: Lacaio nunca pode ter Aumento de Energia.
      // Normaliza fichas legadas que possam ter o estado inconsistente.
      if (merged.patamar === "lacaio" && merged.origin?.hasAumentoEnergia) {
        merged.origin = { ...merged.origin, hasAumentoEnergia: false };
      }
      return merged;
    })(),
    attributes:  { ...base.attributes, ...(payload.attributes || {}) },
    aptidoes:    { ...base.aptidoes, ...(payload.aptidoes || {}) },
    overrides: {
      stats: payload.overrides?.stats || {},
      saves: payload.overrides?.saves || {},
    },
    defenses: {
      resistencias:     payload.defenses?.resistencias || [],
      imunidades:       payload.defenses?.imunidades || [],
      vulnerabilidades: payload.defenses?.vulnerabilidades || [],
      condicoesImunes:  payload.defenses?.condicoesImunes || [],
      originCondicoesImunes: payload.defenses?.originCondicoesImunes || [],
    },
    actions:           { list: payload.actions?.list || [] },
    features:          payload.features || [],
    skills:            normalizeSkills(payload.skills),
    treinamentos:      payload.treinamentos || [],
    aptidoesEspeciais: payload.aptidoesEspeciais || [],
    dotes:             payload.dotes || [],
    artimanhas:        payload.artimanhas || [],
  };
};

// ---------- Sincronização com a origem ----------
// Remove tudo o que estava marcado como source:'origin' (features e defesas
// tipadas) + as condições registradas em originCondicoesImunes, e re-injeta
// a partir do catálogo da origem atual. Idempotente: chamar várias vezes
// produz o mesmo estado.
const syncOriginDerived = (state) => {
  const origin = state.core?.origin;

  // 1) Features: remove as de origem antigas e adiciona as novas.
  // Algumas features (Regeneração) têm descrição computada com patamar/BT/Con,
  // por isso o sync também roda quando esses campos mudam. core é passado pra
  // filtrar features que dependem de patamar (ex.: Aumento de Energia em Lacaio).
  const ctx = { core: state.core, attributes: state.attributes };
  const manualFeatures = (state.features || []).filter((f) => f.source !== "origin");
  const newOriginFeatures = getOriginRawFeatures(origin, state.core).map((raw) => buildOriginFeature(raw, ctx));
  const features = [...newOriginFeatures, ...manualFeatures];

  // 2) Defesas tipadas + condições
  const items = getOriginDefenseItems(origin, state.core);

  const stripOrigin = (arr) => (arr || []).filter((it) => it?.source !== "origin");
  const prevOriginConds = new Set(state.defenses?.originCondicoesImunes || []);
  const manualConds = (state.defenses?.condicoesImunes || []).filter((c) => !prevOriginConds.has(c));
  const newOriginConds = items.condicoesImunes;
  // Une as novas de origem com as manuais, sem duplicar:
  const mergedConds = [...newOriginConds, ...manualConds.filter((c) => !newOriginConds.includes(c))];

  return {
    ...state,
    features,
    defenses: {
      ...state.defenses,
      resistencias:     [...items.resistencias,     ...stripOrigin(state.defenses?.resistencias)],
      imunidades:       [...items.imunidades,       ...stripOrigin(state.defenses?.imunidades)],
      vulnerabilidades: [...items.vulnerabilidades, ...stripOrigin(state.defenses?.vulnerabilidades)],
      condicoesImunes:  mergedConds,
      originCondicoesImunes: newOriginConds,
    },
  };
};

// ---------- Reducer: dicionário de handlers ----------
const actionHandlers = {
  HYDRATE: (_, payload) => syncOriginDerived(normalizeDraft(payload)),

  SET_NAME:     (s, payload) => ({ ...s, name: payload }),
  SET_PORTRAIT: (s, payload) => ({ ...s, portraitUrl: payload }),
  SET_PORTRAIT_FOCUS: (s, payload) => ({
    ...s,
    portraitFocus: {
      x: clampPercent(payload?.x, s.portraitFocus?.x ?? 50),
      y: clampPercent(payload?.y, s.portraitFocus?.y ?? 50),
    },
  }),
  SET_NOTES:    (s, payload) => ({ ...s, narratorNotes: payload }),

  PATCH_CORE:   (s, payload) => {
    let nextCore = { ...s.core, ...payload };
    // Lacaio não pode ter Aumento de Energia — força a flag pra false e re-sincroniza.
    if (payload?.patamar === "lacaio" && nextCore.origin?.hasAumentoEnergia) {
      nextCore = { ...nextCore, origin: { ...nextCore.origin, hasAumentoEnergia: false } };
    }
    const next = { ...s, core: nextCore };
    // Patamar muda multiplicador de Regeneração; ND muda BT (que também afeta).
    const needsSync = "patamar" in (payload || {}) || "nd" in (payload || {});
    return needsSync ? syncOriginDerived(next) : next;
  },
  PATCH_ORIGIN: (s, payload) => syncOriginDerived({
    ...s,
    core: { ...s.core, origin: { ...s.core.origin, ...payload } },
  }),

  SET_ATTRIBUTE: (s, { attr, value }) => {
    const next = {
      ...s,
      attributes: { ...s.attributes, [attr]: Math.max(8, Math.min(99, value)) },
    };
    // Constituição entra na fórmula de cura de Regeneração — ressincroniza.
    return attr === "constituicao" ? syncOriginDerived(next) : next;
  },

  SET_ATTACK_ATTR: (s, payload) => ({ ...s, attackAttr: payload }),
  SET_CD_ATTR:     (s, payload) => ({ ...s, cdAttr: payload }),

  SET_APTIDAO: (s, { key, value }) => ({
    ...s,
    aptidoes: { ...s.aptidoes, [key]: Math.max(0, Math.min(10, value)) },
  }),

  SET_STAT_OVERRIDE: (s, { key, value }) => ({
    ...s,
    overrides: {
      ...s.overrides,
      stats: cleanNull({ ...s.overrides.stats, [key]: value }),
    },
  }),
  SET_SAVE_OVERRIDE: (s, { key, value }) => ({
    ...s,
    overrides: {
      ...s.overrides,
      saves: cleanNull({ ...s.overrides.saves, [key]: value }),
    },
  }),
  CLEAR_ALL_OVERRIDES: (s) => ({ ...s, overrides: { stats: {}, saves: {} } }),

  // ---------- Perícias (id-based agora) ----------
  ADD_SKILL: (s, payload) => ({
    ...s,
    skills: [
      ...s.skills,
      {
        id: genId("skill"),
        name: "",
        attribute: "forca",
        mastered: false,
        overrideMod: null,
        ...payload,
      },
    ],
  }),
  UPDATE_SKILL: (s, { id, patch }) => ({
    ...s,
    skills: s.skills.map((sk) => (sk.id === id ? { ...sk, ...patch } : sk)),
  }),
  REMOVE_SKILL: (s, id) => ({
    ...s,
    skills: s.skills.filter((sk) => sk.id !== id),
  }),
  SET_SKILL_OVERRIDE: (s, { id, value }) => ({
    ...s,
    skills: s.skills.map((sk) =>
      sk.id === id ? { ...sk, overrideMod: value } : sk
    ),
  }),

  // ---------- Ações ----------
  ADD_ACTION: (s, payload) => ({
    ...s,
    actions: {
      ...s.actions,
      list: [...s.actions.list, { ...payload, id: payload.id || genId("act") }],
    },
  }),
  UPDATE_ACTION: (s, { id, patch }) => ({
    ...s,
    actions: {
      ...s.actions,
      list: s.actions.list.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    },
  }),
  REMOVE_ACTION: (s, id) => ({
    ...s,
    actions: { ...s.actions, list: s.actions.list.filter((a) => a.id !== id) },
  }),
  DUPLICATE_ACTION: (s, id) => {
    const idx = s.actions.list.findIndex((a) => a.id === id);
    if (idx === -1) return s;
    const original = s.actions.list[idx];
    const copy = {
      ...JSON.parse(JSON.stringify(original)),
      id: genId("act"),
      name: `${original.name} (cópia)`,
    };
    // Insere logo após o original para dar feedback visual
    const newList = [
      ...s.actions.list.slice(0, idx + 1),
      copy,
      ...s.actions.list.slice(idx + 1),
    ];
    return { ...s, actions: { ...s.actions, list: newList } };
  },

  // ---------- Aptidões Especiais ----------
  ADD_APTIDAO_ESPECIAL: (s, payload) => ({
    ...s,
    aptidoesEspeciais: [...(s.aptidoesEspeciais || []), { ...payload, id: genId("apt") }],
  }),
  REMOVE_APTIDAO_ESPECIAL: (s, id) => ({
    ...s,
    aptidoesEspeciais: (s.aptidoesEspeciais || []).filter((a) => a.id !== id),
  }),

  // ---------- Dotes ----------
  ADD_DOTE: (s, payload) => ({
    ...s,
    dotes: [...(s.dotes || []), { ...payload, id: genId("dote") }],
  }),
  REMOVE_DOTE: (s, id) => ({
    ...s,
    dotes: (s.dotes || []).filter((d) => d.id !== id),
  }),

  // ---------- Treinamentos ----------
  ADD_TREINAMENTO: (s, payload) => ({
    ...s,
    treinamentos: [...(s.treinamentos || []), { ...payload, id: genId("treino") }],
  }),
  REMOVE_TREINAMENTO: (s, id) => ({
    ...s,
    treinamentos: (s.treinamentos || []).filter((t) => t.id !== id),
  }),

  // ---------- Artimanhas (Não-Feiticeiro) ----------
  ADD_ARTIMANHA: (s, payload) => ({
    ...s,
    artimanhas: [...(s.artimanhas || []), { ...payload, id: genId("artim") }],
  }),
  REMOVE_ARTIMANHA: (s, id) => ({
    ...s,
    artimanhas: (s.artimanhas || []).filter((a) => a.id !== id),
  }),
  CLEAR_ARTIMANHAS: (s) => ({ ...s, artimanhas: [] }),

  // ---------- Features ----------
  ADD_FEATURE: (s, payload) => ({ ...s, features: [...s.features, payload] }),
  UPDATE_FEATURE: (s, { id, patch }) => ({
    ...s,
    features: s.features.map((f) => {
      if (f.id !== id) return f;
      if (f.locked) return f; // features de origem são imutáveis
      return { ...f, ...patch };
    }),
  }),
  REMOVE_FEATURE: (s, id) => ({
    ...s,
    // Não permite remover feature de origem por id — só via troca de origem.
    features: s.features.filter((f) => f.id !== id || f.source === "origin"),
  }),

  // ---------- Defesas ----------
  ADD_DEFENSE: (s, { category, item }) => {
    if (category === "condicoesImunes") {
      // Evita duplicar com condição já vinda da origem
      if (s.defenses.condicoesImunes.includes(item)) return s;
      return {
        ...s,
        defenses: { ...s.defenses, condicoesImunes: [...s.defenses.condicoesImunes, item] },
      };
    }
    return {
      ...s,
      defenses: { ...s.defenses, [category]: [...s.defenses[category], item] },
    };
  },
  REMOVE_DEFENSE: (s, { category, index }) => {
    const list = s.defenses[category] || [];
    const target = list[index];
    if (category === "condicoesImunes") {
      // Bloqueia remoção de condição registrada como de origem
      if ((s.defenses.originCondicoesImunes || []).includes(target)) return s;
    } else if (target?.source === "origin") {
      return s; // bloqueia remoção de defesa tipada de origem
    }
    return {
      ...s,
      defenses: {
        ...s.defenses,
        [category]: list.filter((_, i) => i !== index),
      },
    };
  },
};

// ---------- Utils ----------
const clampPercent = (value, fallback) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(100, n));
};

const cleanNull = (obj) => {
  const result = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== null && v !== undefined && v !== "") result[k] = v;
  }
  return result;
};

function reducer(state, action) {
  const handler = actionHandlers[action.type];
  if (!handler) {
    console.warn(`Unknown action: ${action.type}`);
    return state;
  }
  return handler(state, action.payload);
}

// ---------- Hook principal ----------
export default function useCreatureBuilder(initialDraft = null) {
  const [draft, dispatch] = useReducer(
    reducer,
    initialDraft || blankDraft(),
    (init) => syncOriginDerived(normalizeDraft(init))
  );

  const derived = useMemo(() => deriveStats(draft), [
    draft.core,
    draft.attributes,
    draft.overrides,
    draft.skills,
    draft.attackAttr,
    draft.cdAttr,
  ]);

  const warnings = useMemo(() => validateDraft(draft, derived), [draft, derived]);

  // Objeto de actions memoizado: identidade estável entre renders.
  // `dispatch` do useReducer já é estável, então as funções são criadas uma vez.
  // Isso permite que as seções memoizadas (React.memo) não re-renderizem à toa.
  const actions = useMemo(() => ({
    hydrate:       (data) => dispatch({ type: "HYDRATE", payload: data }),
    setName:       (name) => dispatch({ type: "SET_NAME", payload: name }),
    setPortrait:   (url) => dispatch({ type: "SET_PORTRAIT", payload: url }),
    setPortraitFocus: (focus) => dispatch({ type: "SET_PORTRAIT_FOCUS", payload: focus }),
    setNotes:      (n) => dispatch({ type: "SET_NOTES", payload: n }),
    patchCore:     (patch) => dispatch({ type: "PATCH_CORE", payload: patch }),
    patchOrigin:   (patch) => dispatch({ type: "PATCH_ORIGIN", payload: patch }),

    setAttribute:  (attr, value) => dispatch({ type: "SET_ATTRIBUTE", payload: { attr, value } }),
    setAttackAttr: (v) => dispatch({ type: "SET_ATTACK_ATTR", payload: v }),
    setCdAttr:     (v) => dispatch({ type: "SET_CD_ATTR", payload: v }),
    setAptidao:    (key, value) => dispatch({ type: "SET_APTIDAO", payload: { key, value } }),

    setStatOverride: (key, value) => dispatch({ type: "SET_STAT_OVERRIDE", payload: { key, value } }),
    setSaveOverride: (key, value) => dispatch({ type: "SET_SAVE_OVERRIDE", payload: { key, value } }),
    clearOverrides:  () => dispatch({ type: "CLEAR_ALL_OVERRIDES" }),

    // Skills — API id-based
    addSkill:    (skill = {}) => dispatch({ type: "ADD_SKILL", payload: skill }),
    updateSkill: (id, patch) => dispatch({ type: "UPDATE_SKILL", payload: { id, patch } }),
    removeSkill: (id) => dispatch({ type: "REMOVE_SKILL", payload: id }),
    setSkillOverride: (id, value) => dispatch({ type: "SET_SKILL_OVERRIDE", payload: { id, value } }),

    // Actions
    addAction:       (a) => dispatch({ type: "ADD_ACTION", payload: a }),
    updateAction:    (id, patch) => dispatch({ type: "UPDATE_ACTION", payload: { id, patch } }),
    removeAction:    (id) => dispatch({ type: "REMOVE_ACTION", payload: id }),
    duplicateAction: (id) => dispatch({ type: "DUPLICATE_ACTION", payload: id }),

    // Aptidões Especiais
    addAptidaoEspecial:    (a) => dispatch({ type: "ADD_APTIDAO_ESPECIAL", payload: a }),
    removeAptidaoEspecial: (id) => dispatch({ type: "REMOVE_APTIDAO_ESPECIAL", payload: id }),

    // Dotes
    addDote:    (d) => dispatch({ type: "ADD_DOTE", payload: d }),
    removeDote: (id) => dispatch({ type: "REMOVE_DOTE", payload: id }),

    // Treinamentos
    addTreinamento:    (t) => dispatch({ type: "ADD_TREINAMENTO", payload: t }),
    removeTreinamento: (id) => dispatch({ type: "REMOVE_TREINAMENTO", payload: id }),

    // Artimanhas
    addArtimanha:    (a) => dispatch({ type: "ADD_ARTIMANHA", payload: a }),
    removeArtimanha: (id) => dispatch({ type: "REMOVE_ARTIMANHA", payload: id }),
    clearArtimanhas: () => dispatch({ type: "CLEAR_ARTIMANHAS" }),

    // Features
    addFeature:    (f) => dispatch({ type: "ADD_FEATURE", payload: f }),
    updateFeature: (id, patch) => dispatch({ type: "UPDATE_FEATURE", payload: { id, patch } }),
    removeFeature: (id) => dispatch({ type: "REMOVE_FEATURE", payload: id }),

    // Defenses
    addDefense:    (category, item) => dispatch({ type: "ADD_DEFENSE", payload: { category, item } }),
    removeDefense: (category, index) => dispatch({ type: "REMOVE_DEFENSE", payload: { category, index } }),
  }), []);

  /**
   * Converte o draft + derivados em uma ficha pronta para salvar.
   * As skills são persistidas com o modificador final (calculado ou override).
   */
  const buildCreature = useCallback(() => {
    const skillsResolved = draft.skills.map((sk) => {
      const derivedSkill = derived.skillDerivations[sk.id];
      return {
        ...sk,
        mod: derivedSkill ? derivedSkill.finalMod : 0,
      };
    });

    return {
      ...draft,
      core: { ...draft.core, bonusTreinamento: derived.bt },
      attackAttr: draft.attackAttr,
      cdAttr: draft.cdAttr,
      stats: { ...derived.stats },
      saves: { ...derived.saves },
      skills: skillsResolved,
      actions: {
        total: derived.actionsTotal,
        list: draft.actions.list,
      },
      combatState: {
        isActive: false,
        hpCurrent: derived.stats.hpMax,
        peCurrent: derived.stats.peMax,
        guardaInabavalCurrent: derived.stats.guardaInabavalMax,
        resistenciaParcialUsed: 0,
        resistenciaTotalUsed: 0,
        integridadeCurrent: 100,
        activeConditions: [],
        temporaryHp: 0,
        isInDesafiandoMorte: false,
        missCounter: 0,
        customCounters: [],
        combatLog: [],
      },
    };
  }, [draft, derived]);

  return { draft, derived, warnings, actions, buildCreature };
}
