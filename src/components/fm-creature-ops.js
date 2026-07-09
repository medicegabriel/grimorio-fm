// ============================================================
// fm-creature-ops — Operações puras sobre uma ficha
// ============================================================
// Extraído do reducer de useCreatureBuilder para que a MESMA lógica possa
// rodar fora do hook (que é amarrado a uma ficha aberta). Sem isso, aplicar
// um modelo em lote duplicaria as regras de sincronização e elas divergiriam.
//
// Regra de ouro: tudo aqui é função pura (state → state). O reducer do
// builder e o "Aplicar em fichas" da Biblioteca são os dois consumidores.
// ============================================================

import { deriveStats, validateDraft } from "./fm-derive";
import { templateSignature, buildTemplateFromEntity, templateLabel } from "./fm-templates";
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
import {
  getAptidoesImunidadesGrant,
  hasAcertoGarantido,
  hasModificacaoCompleta,
} from "./fm-aptidoes";
import { recalcAction } from "./fm-action-calc";
import {
  normalizeDomain,
  generateDomainText,
  getDomainVersion,
  getAvailableVersions,
  getDomainCost,
  isDomainAction,
} from "./fm-domain-calc";

// ---------- Gerador de ID simples (sem biblioteca externa) ----------
export const genId = (prefix) =>
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
    // "Sem Limites": ignora TODAS as travas/avisos de regra da ficha (orçamentos,
    // limites de dotes/aptidões/defesas, teto de nível de aptidão, etc.).
    semLimites: false,
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

// ---------- Utils ----------
export const clampPercent = (value, fallback) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(100, n));
};

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
export const normalizeDraft = (payload = {}) => {
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
export const syncOriginDerived = (state) => {
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
export const syncTreinamentosDerived = (state) => {
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
export const syncDotesDerived = (state) => {
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
export const syncAptidoesDerived = (state) => {
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

// Cadeia completa de sincronização. É a mesma ordem usada no HYDRATE e no
// init do reducer — treinos concedem aptidões, aptidões concedem imunidades,
// portanto treinamentos precede aptidões.
export const syncAllDerived = (state) =>
  syncAptidoesDerived(syncDotesDerived(syncTreinamentosDerived(syncOriginDerived(state))));

// ============================================================
// APLICAÇÃO DE MODELOS EM UMA FICHA
// ============================================================
// Cada tipo entra num array diferente da ficha e exige um tratamento próprio.
// Ações e Expansões carregam um snapshot da criatura de ORIGEM que precisa ser
// descartado e reescalado para a criatura-ALVO — é aí que mora o risco de bug
// (dano/CD de um ND que não é o desta ficha).

// Devolve uma cópia do objeto sem as chaves listadas.
const omit = (obj, keys) =>
  Object.fromEntries(Object.entries(obj).filter(([k]) => !keys.includes(k)));

// Campos que só existem no registro do modelo (Biblioteca), nunca na ficha.
const TEMPLATE_META = ["id", "savedAt", "folderId"];
const stripTemplateMeta = (tpl) => omit(tpl, TEMPLATE_META);

// Snapshot da criatura de ORIGEM. Precisa sair, senão a ficha-alvo herda
// dano/CD/alcance calculados para outro ND.
const ACAO_SNAPSHOT = ["toHit", "cd", "range", "area", "calc"];

// Ação: sem `calc`, o recalc abaixo enxerga a ação como fora de sincronia e
// reescala tudo para o ND/Patamar/BT da ficha-alvo.
const buildAcao = (tpl) => ({
  ...omit(stripTemplateMeta(tpl), ACAO_SNAPSHOT),
  id: genId("act"),
});

// Expansão de Domínio: recalcAction devolve domínios intactos, então a
// re-derivação é feita aqui, espelhando o handleSubmit do DomainForm.
const buildExpansao = (tpl, creature) => {
  const form = normalizeDomain(stripTemplateMeta(tpl));
  const dom = Number(creature?.aptidoes?.dom) || 0;
  const bar = Number(creature?.aptidoes?.bar) || 0;
  const nd  = Number(creature?.core?.nd) || 0;
  const bt  = Number(deriveStats(creature)?.bt) || 2;

  const hasMC = hasModificacaoCompleta(creature?.aptidoesEspeciais);
  const agUnlocked = hasAcertoGarantido(creature?.aptidoesEspeciais);
  // A versão salva no modelo só vale se o ND da ficha-alvo a destravar.
  const versao = (form.versao && getAvailableVersions(nd).some((v) => v.value === form.versao))
    ? form.versao
    : getDomainVersion(nd);
  const agActive = agUnlocked && form.acertoGarantido?.ativo;

  return {
    ...form,
    id: genId("dom"),
    kind: "expansao_dominio",
    type: "comum",
    versao,
    cost: getDomainCost(versao, agActive),
    finalText: generateDomainText({ ...form, versao }, { dom, nd, bt, bar, hasMC }),
    finalTextManual: tpl.finalTextManual ?? "",
    calc: { dom, nd, bt, bar },
  };
};

// Onde cada tipo de modelo aterrissa na ficha, e como a entidade é montada.
// `build` recebe (tpl, creature) e devolve a entidade pronta, com id.
const TEMPLATE_APPLY = {
  acao: {
    build: buildAcao,
    insert: (c, entity) => ({ ...c, actions: { ...c.actions, list: [...c.actions.list, entity] } }),
  },
  expansao: {
    build: buildExpansao,
    insert: (c, entity) => ({ ...c, actions: { ...c.actions, list: [...c.actions.list, entity] } }),
  },
  caracteristica: {
    build: (tpl) => ({ ...stripTemplateMeta(tpl), id: genId("feat") }),
    insert: (c, entity) => ({ ...c, features: [...(c.features || []), entity] }),
  },
  dote: {
    build: (tpl) => ({
      tipo: "custom", nome: tpl.nome, descricao: tpl.descricao,
      automation: tpl.automation ?? null, id: genId("dote"),
    }),
    insert: (c, entity) => ({ ...c, dotes: [...(c.dotes || []), entity] }),
  },
  treinamento: {
    build: (tpl) => ({
      tipo: "custom", nome: tpl.nome, descricao: tpl.descricao,
      automation: tpl.automation ?? null, id: genId("treino"),
    }),
    insert: (c, entity) => ({ ...c, treinamentos: [...(c.treinamentos || []), entity] }),
  },
  aptidao: {
    build: (tpl) => ({
      tipo: "custom", categoria: tpl.categoria ?? "Customizada",
      nome: tpl.nome, descricao: tpl.descricao,
      automation: tpl.automation ?? null, id: genId("apt"),
    }),
    insert: (c, entity) => ({ ...c, aptidoesEspeciais: [...(c.aptidoesEspeciais || []), entity] }),
  },
};

export const isApplicableTemplateType = (type) =>
  Object.prototype.hasOwnProperty.call(TEMPLATE_APPLY, type);

/**
 * Um modelo pode simplesmente não caber numa ficha. Hoje só as Expansões têm
 * esse caso: abaixo de certo ND nenhuma versão de Domínio está disponível, e
 * aplicar mesmo assim geraria uma entidade quebrada (versao null, custo 0,
 * texto com lacunas). O DomainForm impede pelo `canSubmit`; aqui é o análogo.
 *
 * @returns {{ ok: true } | { ok: false, reason: string }}
 */
export function canApplyTemplateToCreature(creature, type, tpl) {
  if (!isApplicableTemplateType(type)) return { ok: false, reason: "Tipo de modelo desconhecido." };
  if (type === "expansao") {
    const nd = Number(creature?.core?.nd) || 0;
    const form = normalizeDomain(stripTemplateMeta(tpl));
    const versao = (form.versao && getAvailableVersions(nd).some((v) => v.value === form.versao))
      ? form.versao
      : getDomainVersion(nd);
    if (!versao) {
      return { ok: false, reason: `ND ${nd} não desbloqueia nenhuma versão de Expansão de Domínio.` };
    }
  }
  return { ok: true };
}

// Reescala para o ND/Patamar/BT da ficha SÓ as ações sem carimbo `calc`
// (as recém-aplicadas). Espelha o reducer RECALC_ACTIONS, que ignora as que
// já estão em dia — assim aplicar um modelo não mexe nas ações preexistentes.
const recalcNewActions = (creature) => {
  const d = deriveStats(creature);
  const { nd, patamar, difficulty } = creature.core;
  const ctxBase = { patamar, nd, difficulty, bt: d.bt, toHitBase: d.acertoPrincipal, cdBase: d.cdBase };
  return {
    ...creature,
    actions: {
      ...creature.actions,
      list: creature.actions.list.map((a) => (a.calc ? a : recalcAction(a, ctxBase))),
    },
  };
};

/**
 * Aplica UM modelo a UMA ficha. Puro: devolve uma nova ficha.
 * Não valida vagas — quem chama roda validateDraft depois e reporta.
 */
export function applyTemplateToCreature(creature, type, tpl) {
  const spec = TEMPLATE_APPLY[type];
  if (!spec) return creature;
  const draft = normalizeDraft(creature);
  const next = spec.insert(draft, spec.build(tpl, draft));
  // Ação/Expansão nunca alteram derivados; os outros quatro sim. Rodar a
  // cadeia inteira é idempotente, então vale para todos os casos.
  return syncAllDerived(type === "acao" ? recalcNewActions(next) : next);
}

/**
 * Aplica VÁRIOS modelos a UMA ficha, em ordem. `items` = [{ type, tpl }, ...].
 * O recalc de ações roda uma vez por modelo, mas só toca nas ações sem `calc`,
 * então aplicar N ações de uma vez continua correto.
 */
export function applyTemplatesToCreature(creature, items) {
  return items.reduce(
    (acc, { type, tpl }) => applyTemplateToCreature(acc, type, tpl),
    creature
  );
}

// ============================================================
// DETECÇÃO DE DUPLICATAS
// ============================================================
// Onde procurar, na ficha, as entidades de cada tipo de modelo. Ações e
// Expansões dividem `actions.list`, separadas pelo `kind`.
const CREATURE_ENTITIES_BY_TYPE = {
  acao:           (c) => (c.actions?.list || []).filter((a) => !isDomainAction(a)),
  expansao:       (c) => (c.actions?.list || []).filter(isDomainAction),
  caracteristica: (c) => c.features || [],
  dote:           (c) => c.dotes || [],
  treinamento:    (c) => c.treinamentos || [],
  aptidao:        (c) => c.aptidoesEspeciais || [],
};

/** True se a ficha já contém uma entidade equivalente ao modelo (mesma
 *  assinatura tipo+título+descrição usada no import). */
export function creatureHasTemplate(creature, type, tpl) {
  const pick = CREATURE_ENTITIES_BY_TYPE[type];
  if (!pick) return false;
  const target = templateSignature(type, tpl);
  return pick(creature).some(
    (e) => templateSignature(type, buildTemplateFromEntity(type, e)) === target
  );
}

// ============================================================
// APLICAÇÃO EM LOTE (Biblioteca → várias fichas)
// ============================================================
// Só reporta os erros que a aplicação INTRODUZIU. Uma ficha que já estourava
// o limite de dotes antes não deve ser acusada por isso agora.
const errorsOf = (draft) =>
  validateDraft(draft, deriveStats(draft))
    .filter((w) => w.severity === "error")
    .map((w) => w.message);

/**
 * Aplica `items` ([{type, tpl}]) em cada ficha de `targets`.
 * Não persiste nada — devolve os drafts prontos e um relatório por ficha.
 *
 * @returns {{ updates: Array<{id, draft}>, report: Array<{id, name, applied, skipped, newErrors}> }}
 */
export function applyTemplatesToCreatures(targets, items, { skipDuplicates = true } = {}) {
  const updates = [];
  const report = [];

  for (const creature of targets) {
    let draft = normalizeDraft(creature);
    const before = new Set(errorsOf(draft));

    let applied = 0;
    let skipped = 0;
    const blocked = [];
    for (const { type, tpl } of items) {
      if (!isApplicableTemplateType(type)) continue;
      if (skipDuplicates && creatureHasTemplate(draft, type, tpl)) {
        skipped += 1;
        continue;
      }
      const check = canApplyTemplateToCreature(draft, type, tpl);
      if (!check.ok) {
        blocked.push({ name: templateLabel(type, tpl), reason: check.reason });
        continue;
      }
      draft = applyTemplateToCreature(draft, type, tpl);
      applied += 1;
    }

    const newErrors = applied ? errorsOf(draft).filter((m) => !before.has(m)) : [];
    report.push({ id: creature.id, name: creature.name, applied, skipped, blocked, newErrors });
    if (applied) updates.push({ id: creature.id, draft });
  }

  return { updates, report };
}
