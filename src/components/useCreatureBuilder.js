import { useReducer, useMemo, useCallback } from "react";
import { deriveStats, validateDraft } from "./fm-derive";
import { recalcAction } from "./fm-action-calc";
// As operações puras sobre a ficha (normalização + sincronização de derivados)
// moram em fm-creature-ops para que o "Aplicar em fichas" da Biblioteca possa
// reusá-las fora deste hook. Este reducer é só um dos consumidores.
import {
  genId,
  blankDraft,
  clampPercent,
  normalizeDraft,
  syncOriginDerived,
  syncTreinamentosDerived,
  syncDotesDerived,
  syncAptidoesDerived,
  syncAllDerived,
} from "./fm-creature-ops";

export { blankDraft };

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

// ---------- Reducer: dicionário de handlers ----------
const actionHandlers = {
  HYDRATE: (_, payload) => syncAllDerived(normalizeDraft(payload)),

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

  SET_APTIDAO: (s, { key, value }) => {
    // Sem Limites remove o teto de nível de aptidão (normalmente 10 no reducer).
    const cap = s.core?.semLimites ? Infinity : 10;
    return {
      ...s,
      aptidoes: { ...s.aptidoes, [key]: Math.max(0, Math.min(cap, value)) },
    };
  },

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

  // Re-deriva as ações para o ND/Patamar/Dificuldade atuais. Só transforma
  // as que estão fora de sincronia (carimbo `calc` diferente do core) ou sem
  // carimbo; as já em dia passam intactas (evita marcar texto manual como
  // desatualizado à toa). `recalcDamageIds` lista as ações de dano manual
  // cujo dano o usuário autorizou re-derivar.
  RECALC_ACTIONS: (s, payload = {}) => {
    const recalcDamageIds = new Set(payload.recalcDamageIds || []);
    const d = deriveStats(s);
    const { nd, patamar, difficulty } = s.core;
    const ctxBase = { patamar, nd, difficulty, bt: d.bt, toHitBase: d.acertoPrincipal, cdBase: d.cdBase };
    return {
      ...s,
      actions: {
        ...s.actions,
        list: s.actions.list.map((a) => {
          const inSync = a.calc &&
            a.calc.nd === nd && a.calc.patamar === patamar && a.calc.difficulty === difficulty;
          if (inSync) return a;
          return recalcAction(a, { ...ctxBase, recalcLockedDamage: recalcDamageIds.has(a.id) });
        }),
      },
    };
  },

  // ---------- Aptidões Especiais ----------
  // Add/remove/update ressincronizam as imunidades concedidas (Composição Elemental).
  ADD_APTIDAO_ESPECIAL: (s, payload) => syncAptidoesDerived({
    ...s,
    aptidoesEspeciais: [...(s.aptidoesEspeciais || []), { ...payload, id: genId("apt") }],
  }),
  REMOVE_APTIDAO_ESPECIAL: (s, id) => {
    const target = (s.aptidoesEspeciais || []).find((a) => a.id === id);
    // Aptidões concedidas por treinamento são gerenciadas pelo sync.
    if (target?.source === "treino") return s;
    return syncAptidoesDerived({
      ...s,
      aptidoesEspeciais: (s.aptidoesEspeciais || []).filter((a) => a.id !== id),
    });
  },
  // Atualiza uma aptidão já adicionada (ex.: sub-escolha de elemento/perícia).
  UPDATE_APTIDAO_ESPECIAL: (s, { id, patch }) => syncAptidoesDerived({
    ...s,
    aptidoesEspeciais: (s.aptidoesEspeciais || []).map((a) =>
      a.id === id ? { ...a, ...patch } : a
    ),
  }),

  // ---------- Dotes ----------
  // Add/remove ressincronizam as imunidades a condição concedidas (ex.: Fúria
  // Berserker injeta imovel/paralisado/inconsciente/agarrado/enredado/atordoado).
  ADD_DOTE: (s, payload) => syncDotesDerived({
    ...s,
    dotes: [...(s.dotes || []), { ...payload, id: genId("dote") }],
  }),
  REMOVE_DOTE: (s, id) => syncDotesDerived({
    ...s,
    dotes: (s.dotes || []).filter((d) => d.id !== id),
  }),
  // Atualiza um dote já adicionado (ex.: sub-escolha do Domínio dos Fundamentos).
  UPDATE_DOTE: (s, { id, patch }) => ({
    ...s,
    dotes: (s.dotes || []).map((d) => (d.id === id ? { ...d, ...patch } : d)),
  }),

  // ---------- Características Gerais e Especiais ----------
  // Catálogo puramente visual (sem automação por enquanto).
  ADD_CARACTERISTICA: (s, payload) => ({
    ...s,
    caracteristicas: [...(s.caracteristicas || []), { ...payload, id: genId("carac") }],
  }),
  REMOVE_CARACTERISTICA: (s, id) => ({
    ...s,
    caracteristicas: (s.caracteristicas || []).filter((c) => c.id !== id),
  }),
  // Atualiza uma característica já adicionada (ex.: sub-escolha do Ímpeto Gradual).
  UPDATE_CARACTERISTICA: (s, { id, patch }) => ({
    ...s,
    caracteristicas: (s.caracteristicas || []).map((c) =>
      c.id === id ? { ...c, ...patch } : c
    ),
  }),

  // ---------- Treinamentos ----------
  // Add/remove ressincronizam aptidões especiais concedidas pelo treino
  // (ex.: Modificação Completa via Treino de Domínio).
  ADD_TREINAMENTO: (s, payload) => syncTreinamentosDerived({
    ...s,
    treinamentos: [...(s.treinamentos || []), { ...payload, id: genId("treino") }],
  }),
  REMOVE_TREINAMENTO: (s, id) => syncTreinamentosDerived({
    ...s,
    treinamentos: (s.treinamentos || []).filter((t) => t.id !== id),
  }),
  // Patch leve por item (ex.: automation). Não re-sincroniza derivados.
  UPDATE_TREINAMENTO: (s, { id, patch }) => ({
    ...s,
    treinamentos: (s.treinamentos || []).map((t) => (t.id === id ? { ...t, ...patch } : t)),
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
  // Atualiza uma artimanha já adicionada (ex.: automação de uma custom).
  UPDATE_ARTIMANHA: (s, { id, patch }) => ({
    ...s,
    artimanhas: (s.artimanhas || []).map((a) => (a.id === id ? { ...a, ...patch } : a)),
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
    // Evita duplicar o mesmo tipo de dano na mesma categoria (case-insensitive).
    const tipoNorm = (item?.tipo || "").toLowerCase().trim();
    if ((s.defenses[category] || []).some((it) => (it?.tipo || "").toLowerCase().trim() === tipoNorm)) {
      return s;
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
      // Bloqueia remoção de condição registrada como de origem ou de dote
      if ((s.defenses.originCondicoesImunes || []).includes(target)) return s;
      if ((s.defenses.doteCondicoesImunes || []).includes(target)) return s;
    } else if (target?.source === "origin" || target?.source === "aptidao") {
      return s; // bloqueia remoção de defesa tipada de origem ou de aptidão
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
    (init) => syncAllDerived(normalizeDraft(init))
  );

  const derived = useMemo(() => deriveStats(draft), [
    draft.core,
    draft.attributes,
    draft.overrides,
    draft.skills,
    draft.attackAttr,
    draft.cdAttr,
    draft.treinamentos,
    draft.aptidoes,
    draft.dotes,
    draft.aptidoesEspeciais,
    draft.caracteristicas,
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
    recalcActions:   (opts) => dispatch({ type: "RECALC_ACTIONS", payload: opts || {} }),

    // Aptidões Especiais
    addAptidaoEspecial:    (a) => dispatch({ type: "ADD_APTIDAO_ESPECIAL", payload: a }),
    removeAptidaoEspecial: (id) => dispatch({ type: "REMOVE_APTIDAO_ESPECIAL", payload: id }),
    updateAptidaoEspecial: (id, patch) => dispatch({ type: "UPDATE_APTIDAO_ESPECIAL", payload: { id, patch } }),

    // Dotes
    addDote:    (d) => dispatch({ type: "ADD_DOTE", payload: d }),
    removeDote: (id) => dispatch({ type: "REMOVE_DOTE", payload: id }),
    updateDote: (id, patch) => dispatch({ type: "UPDATE_DOTE", payload: { id, patch } }),

    // Características Gerais e Especiais
    addCaracteristica:    (c) => dispatch({ type: "ADD_CARACTERISTICA", payload: c }),
    removeCaracteristica: (id) => dispatch({ type: "REMOVE_CARACTERISTICA", payload: id }),
    updateCaracteristica: (id, patch) => dispatch({ type: "UPDATE_CARACTERISTICA", payload: { id, patch } }),

    // Treinamentos
    addTreinamento:    (t) => dispatch({ type: "ADD_TREINAMENTO", payload: t }),
    removeTreinamento: (id) => dispatch({ type: "REMOVE_TREINAMENTO", payload: id }),
    updateTreinamento: (id, patch) => dispatch({ type: "UPDATE_TREINAMENTO", payload: { id, patch } }),

    // Artimanhas
    addArtimanha:    (a) => dispatch({ type: "ADD_ARTIMANHA", payload: a }),
    removeArtimanha: (id) => dispatch({ type: "REMOVE_ARTIMANHA", payload: id }),
    updateArtimanha: (id, patch) => dispatch({ type: "UPDATE_ARTIMANHA", payload: { id, patch } }),
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
      critMargins: { ...derived.critMargins },
      confrontoDominio: { ...derived.confrontoDominio },
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
        activeModifiers: [],
        isInDesafiandoMorte: false,
        missCounter: 0,
        customCounters: [],
        combatLog: [],
      },
    };
  }, [draft, derived]);

  return { draft, derived, warnings, actions, buildCreature };
}
