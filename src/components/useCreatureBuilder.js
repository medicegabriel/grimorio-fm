import { useReducer, useMemo, useCallback } from "react";
import { deriveStats, validateDraft } from "./fm-derive";
import {
  getOriginRawFeatures,
  buildOriginFeature,
  getOriginDefenseItems,
} from "./fm-origens";
import {
  getTreinamentoAptidoesEspeciais,
  getTreinamentoByNome,
} from "./fm-treinamentos";
import { getDoteCondicoesImunes } from "./fm-dotes";
import { getAptidoesImunidadesGrant } from "./fm-aptidoes";
import { recalcAction } from "./fm-action-calc";

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
  combatSettings: { guardaAbsorbsFirst: true, rdReducao: true },
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
  aptidoes: { au: 0, cl: 0, bar: 0, dom: 0, er: 0 },
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
  caracteristicas: [],
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

// ---------- Migração: chave "ea" → "au" ----------
// Fichas antigas guardavam o slot de Aura como "ea" (Energia Amaldiçoada).
// O nome oficial no sistema é "Aura" (AU), então renomeamos a chave. Se a
// ficha carregada já tem "au" prevalece — só copiamos "ea" quando "au" não
// foi definido (= 0/undefined).
const migrateAptidoes = (baseAptidoes, payloadAptidoes = {}) => {
  const out = { ...baseAptidoes, ...payloadAptidoes };
  if (payloadAptidoes && "ea" in payloadAptidoes && !payloadAptidoes.au) {
    out.au = payloadAptidoes.ea;
  }
  delete out.ea;
  return out;
};

// ---------- Normaliza treinamentos legados (sem key) ----------
// Itens antigos só guardavam {tipo, nome, descricao, id}. Para o derive
// conseguir consultar o catálogo, infere a `key` pelo nome quando faltar.
const normalizeTreinamentos = (treinamentos = []) =>
  treinamentos.map((t) => {
    if (t.key || t.tipo === "custom") return t;
    const cat = getTreinamentoByNome(t.nome);
    return cat ? { ...t, key: cat.key } : t;
  });

// ---------- Normaliza um draft completo (fichas antigas / parciais) ----------
// Garante que toda chave estrutural exista antes de o reducer mexer nela,
// evitando crash ao adicionar defesas/ações/características em fichas legadas.
const normalizeDraft = (payload = {}) => {
  const base = blankDraft();
  const core = (() => {
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
  })();
  // Carimbo de "ND em que a ação foi calculada". Fichas legadas (sem `calc`)
  // são carimbadas com o core atual na carga — assume-se que estão em dia —,
  // de modo que só mudanças de ND/Patamar/Dificuldade DENTRO da sessão é que
  // disparam o aviso de recálculo.
  const actionStamp = { nd: core.nd, patamar: core.patamar, difficulty: core.difficulty };
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
    core,
    attributes:  { ...base.attributes, ...(payload.attributes || {}) },
    aptidoes:    migrateAptidoes(base.aptidoes, payload.aptidoes),
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
      doteCondicoesImunes:   payload.defenses?.doteCondicoesImunes || [],
    },
    actions: {
      list: (payload.actions?.list || []).map((a) =>
        a.calc ? a : { ...a, calc: actionStamp }
      ),
    },
    features:          payload.features || [],
    skills:            normalizeSkills(payload.skills),
    treinamentos:      normalizeTreinamentos(payload.treinamentos || []),
    aptidoesEspeciais: payload.aptidoesEspeciais || [],
    caracteristicas:   payload.caracteristicas || [],
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
  // Condições concedidas por dotes são uma terceira fonte protegida — não
  // contam como manuais e devem sobreviver a uma troca de origem.
  const doteConds = state.defenses?.doteCondicoesImunes || [];
  const doteCondsSet = new Set(doteConds);
  const manualConds = (state.defenses?.condicoesImunes || []).filter(
    (c) => !prevOriginConds.has(c) && !doteCondsSet.has(c)
  );
  const newOriginConds = items.condicoesImunes;
  // Ordem: origem → dote → manual, sem duplicar:
  const mergedConds = [
    ...newOriginConds,
    ...doteConds.filter((c) => !newOriginConds.includes(c)),
    ...manualConds.filter((c) => !newOriginConds.includes(c)),
  ];

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

// ---------- Sincronização com os treinamentos ----------
// Remove tudo o que estava marcado como source:'treino' em aptidoesEspeciais
// e re-injeta a partir do catálogo. Treinos como Domínio concedem aptidões
// (Modificação Completa) que devem aparecer automaticamente e não podem ser
// removidas manualmente — o sync garante a propriedade idempotente.
const syncTreinamentosDerived = (state) => {
  const treinamentos = state.treinamentos || [];
  const granted = getTreinamentoAptidoesEspeciais(treinamentos);

  const manual = (state.aptidoesEspeciais || []).filter((a) => a.source !== "treino");
  const injected = granted.map((a) => ({
    id: `apt-treino-${a.treinoKey}`,
    nome: a.nome,
    categoria: a.categoria,
    descricao: a.descricao,
    tipo: "oficial",
    source: "treino",
    treinoKey: a.treinoKey,
    locked: true,
  }));

  return {
    ...state,
    aptidoesEspeciais: [...injected, ...manual],
  };
};

// ---------- Sincronização com os dotes ----------
// Injeta as imunidades a condição concedidas por dotes (ex.: Fúria
// Berserker) em defenses.condicoesImunes, registrando-as em
// doteCondicoesImunes para que não contem no limite do patamar nem
// possam ser removidas manualmente. Idempotente: condições que saem
// do conjunto de dotes são removidas; manuais e de origem ficam intactas.
const syncDotesDerived = (state) => {
  const granted = getDoteCondicoesImunes(state.dotes || []);
  const grantedSet = new Set(granted);
  const originConds = state.defenses?.originCondicoesImunes || [];
  const originSet = new Set(originConds);
  const prevDoteSet = new Set(state.defenses?.doteCondicoesImunes || []);

  // Manuais = o que não é de origem nem era de dote antes.
  const manualConds = (state.defenses?.condicoesImunes || []).filter(
    (c) => !originSet.has(c) && !prevDoteSet.has(c)
  );
  // Dote só "possui" o que ainda não veio da origem (evita dupla contagem).
  const doteList = granted.filter((c) => !originSet.has(c));

  const condicoesImunes = [
    ...originConds,
    ...doteList,
    ...manualConds.filter((c) => !grantedSet.has(c)),
  ];

  return {
    ...state,
    defenses: {
      ...state.defenses,
      condicoesImunes,
      doteCondicoesImunes: doteList,
    },
  };
};

// ---------- Sincronização com as aptidões ----------
// Injeta as imunidades a tipo de dano concedidas por aptidões (ex.: Composição
// Elemental → imunidade ao elemento escolhido) em defenses.imunidades com
// source:"aptidao". Idempotente: remove as antigas de aptidão e re-injeta a
// partir das escolhas atuais. Não duplica tipos que já venham de origem/manual.
const syncAptidoesDerived = (state) => {
  const granted = getAptidoesImunidadesGrant(state.aptidoesEspeciais || []);
  const semAptidao = (state.defenses?.imunidades || []).filter((it) => it?.source !== "aptidao");
  const existingTipos = new Set(semAptidao.map((it) => it.tipo));
  const novos = granted
    .filter((g) => !existingTipos.has(g.tipo))
    .map((g) => ({ tipo: g.tipo, source: "aptidao", aptidaoKey: g.aptidaoKey }));
  return {
    ...state,
    defenses: { ...state.defenses, imunidades: [...semAptidao, ...novos] },
  };
};

// ---------- Reducer: dicionário de handlers ----------
const actionHandlers = {
  HYDRATE: (_, payload) => syncAptidoesDerived(syncDotesDerived(syncTreinamentosDerived(syncOriginDerived(normalizeDraft(payload))))),

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
    (init) => syncAptidoesDerived(syncDotesDerived(syncTreinamentosDerived(syncOriginDerived(normalizeDraft(init)))))
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
