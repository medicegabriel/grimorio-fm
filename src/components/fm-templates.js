// ============================================================
// fm-templates — Biblioteca unificada de Modelos (templates)
// ============================================================
// Centraliza os "Modelos" reutilizáveis das 5 categorias do builder:
//   acao · caracteristica (Características Personalizadas) · dote ·
//   treinamento · aptidao (Aptidões Amaldiçoadas)
//
// Cada tipo guarda sua lista em uma chave própria do localStorage
// (mantendo as chaves legadas de Ações e Características). Toda escrita
// dispara um CustomEvent `fm-templates-changed`, de modo que múltiplas
// instâncias de hooks (builder + Biblioteca) ficam em sincronia.
// ============================================================

export const TEMPLATES_EVENT = "fm-templates-changed";

// Registro dos tipos. `nameField` indica onde mora o título (name vs nome).
export const TEMPLATE_TYPES = {
  acao: {
    label: "Ações",
    storageKey: "fm_action_templates_v1",
    idPrefix: "atpl",
    nameField: "name",
  },
  expansao: {
    label: "Expansões de Domínio",
    storageKey: "fm_expansao_templates_v1",
    idPrefix: "etpl",
    nameField: "name",
  },
  caracteristica: {
    label: "Características Personalizadas",
    storageKey: "fm_feature_templates_v1",
    idPrefix: "ftpl",
    nameField: "name",
  },
  dote: {
    label: "Dotes",
    storageKey: "fm_dote_templates_v1",
    idPrefix: "dtpl",
    nameField: "nome",
  },
  treinamento: {
    label: "Treinamentos",
    storageKey: "fm_treinamento_templates_v1",
    idPrefix: "ttpl",
    nameField: "nome",
  },
  aptidao: {
    label: "Aptidões Amaldiçoadas",
    storageKey: "fm_aptidao_templates_v1",
    idPrefix: "aptpl",
    nameField: "nome",
  },
};

export const TEMPLATE_TYPE_ORDER = ["acao", "expansao", "caracteristica", "dote", "treinamento", "aptidao"];

export const isTemplateType = (t) => Object.prototype.hasOwnProperty.call(TEMPLATE_TYPES, t);

// Chave do store de Pastas (organização multi-tipo, igual ao Dashboard).
const FOLDERS_STORAGE_KEY = "fm_template_folders_v1";

// ------------------------------------------------------------
// Extratores: a partir de uma ENTIDADE da ficha, monta os campos
// do modelo (só o que faz sentido reaproveitar).
// ------------------------------------------------------------
const BUILDERS = {
  acao: (a) => ({
    name: a.name,
    type: a.type,
    attackType: a.attackType,
    trType: a.trType,
    rangeType: a.rangeType,
    cost: a.cost,
    description: a.description,
    damage: a.damage ? { ...a.damage } : null,
    condition: a.condition ? { ...a.condition } : null,
    trades: a.trades ? { ...a.trades } : null,
    toHitBase: a.toHitBase,
    cdBase: a.cdBase,
    // Texto Final customizado (com tokens {{dano}}/{{criatura}}…). Preservado
    // para o modelo manter a narração própria; tokens resolvem na criatura-alvo.
    finalTextManual: a.finalTextManual ?? "",
    // Snapshot da criatura-base (só para exibição na Biblioteca; ignorado no
    // apply, que reescala tudo para a criatura-alvo).
    toHit: a.toHit,
    cd: a.cd,
    range: a.range,
    area: a.area,
    calc: a.calc ? { ...a.calc } : null,
  }),
  expansao: (a) => ({
    name: a.name,
    type: a.type ?? "comum",
    versao: a.versao ?? "",
    cost: a.cost ?? 0,
    lore: a.lore ?? "",
    description: a.description ?? "",
    effects: Array.isArray(a.effects) ? a.effects.map((e) => ({ ...e })) : [],
    acertoGarantido: a.acertoGarantido ? { ...a.acertoGarantido } : { ativo: false, escopo: "" },
    modificacaoCompleta: a.modificacaoCompleta ? { ...a.modificacaoCompleta } : { inversaoResistencia: false, mudancaTamanho: false, tamanho: 9 },
    finalTextManual: a.finalTextManual ?? "",
    // Snapshot só para exibição na Biblioteca (reresolvido na criatura ao aplicar).
    finalText: a.finalText ?? "",
    // Contexto (DOM/ND/BT/BAR) p/ reabrir a edição com os valores corretos.
    calc: a.calc ? { ...a.calc } : null,
  }),
  caracteristica: (f) => ({
    name: f.name,
    category: f.category,
    trigger: f.trigger,
    description: f.description,
  }),
  dote: (d) => ({ nome: d.nome, descricao: d.descricao }),
  treinamento: (t) => ({ nome: t.nome, descricao: t.descricao }),
  aptidao: (a) => ({
    nome: a.nome,
    descricao: a.descricao,
    categoria: a.categoria ?? "Customizada",
  }),
};

// ------------------------------------------------------------
// Aplicadores: a partir de um MODELO, monta a entidade a ser
// adicionada na ficha (via actions.addX). Usado por Dote/Treino/
// Aptidão. Ações e Características têm fluxo próprio nos forms.
// ------------------------------------------------------------
const APPLIERS = {
  dote: (tpl) => ({ tipo: "custom", nome: tpl.nome, descricao: tpl.descricao }),
  treinamento: (tpl) => ({ tipo: "custom", nome: tpl.nome, descricao: tpl.descricao }),
  aptidao: (tpl) => ({
    tipo: "custom",
    categoria: tpl.categoria ?? "Customizada",
    nome: tpl.nome,
    descricao: tpl.descricao,
  }),
};

export const buildTemplateFromEntity = (type, entity) =>
  (BUILDERS[type] ? BUILDERS[type](entity) : { ...entity });

export const buildEntityFromTemplate = (type, tpl) =>
  (APPLIERS[type] ? APPLIERS[type](tpl) : { ...tpl });

// Título legível de um modelo, independente do tipo.
export const templateLabel = (type, tpl) => {
  const field = TEMPLATE_TYPES[type]?.nameField ?? "name";
  return (tpl?.[field] ?? tpl?.name ?? tpl?.nome ?? "").toString();
};

// Descrição legível (para preview na Biblioteca). Expansões usam `lore`.
export const templateDescription = (tpl) =>
  (tpl?.description || tpl?.descricao || tpl?.lore || "").toString();

// Assinatura para de-duplicação no import (tipo + título + descrição).
const templateSignature = (type, tpl) =>
  `${type}::${templateLabel(type, tpl).trim().toLowerCase()}::${templateDescription(tpl).trim().toLowerCase()}`;

// Verdadeiro se já existe na lista um modelo equivalente à entidade
// (mesma assinatura tipo+título+descrição). Usado pela bandeirinha de salvar.
export function entityHasTemplate(type, entity, templates) {
  if (!entity || !TEMPLATE_TYPES[type]) return false;
  const sig = templateSignature(type, buildTemplateFromEntity(type, entity));
  return (templates || []).some((t) => templateSignature(type, t) === sig);
}

const genId = (prefix) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

// ============================================================
// STORE (localStorage + evento)
// ============================================================
export function loadTemplates(type) {
  const cfg = TEMPLATE_TYPES[type];
  if (!cfg) return [];
  try {
    const raw = localStorage.getItem(cfg.storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    // Migração silenciosa: garante folderId (null = sem pasta) em modelos antigos.
    return Array.isArray(parsed) ? parsed.map((t) => ({ ...t, folderId: t.folderId ?? null })) : [];
  } catch {
    return [];
  }
}

export function loadAllTemplates() {
  const out = {};
  for (const type of TEMPLATE_TYPE_ORDER) out[type] = loadTemplates(type);
  return out;
}

// Cache de snapshots para useSyncExternalStore (identidade estável entre
// renders; só muda quando `persist` reescreve o tipo).
const _snapshot = {};
let _allSnapshot = null;

export function getTemplatesSnapshot(type) {
  if (!(type in _snapshot)) _snapshot[type] = loadTemplates(type);
  return _snapshot[type];
}

export function getAllTemplatesSnapshot() {
  if (_allSnapshot == null) {
    _allSnapshot = {};
    for (const t of TEMPLATE_TYPE_ORDER) _allSnapshot[t] = getTemplatesSnapshot(t);
  }
  return _allSnapshot;
}

export function subscribeTemplates(callback) {
  window.addEventListener(TEMPLATES_EVENT, callback);
  return () => window.removeEventListener(TEMPLATES_EVENT, callback);
}

function persist(type, list) {
  const cfg = TEMPLATE_TYPES[type];
  if (!cfg) return;
  try {
    localStorage.setItem(cfg.storageKey, JSON.stringify(list));
  } catch {
    /* quota / modo privado — falha silenciosa */
  }
  _snapshot[type] = list; // mantém o snapshot em sincronia (mesma referência)
  _allSnapshot = null;
  try {
    window.dispatchEvent(new CustomEvent(TEMPLATES_EVENT, { detail: { type } }));
  } catch {
    /* SSR / sem window */
  }
}

// Salva um novo modelo a partir de uma entidade. Retorna o modelo criado.
// `folderId` (opcional) coloca o modelo direto numa pasta.
export function saveTemplateFromEntity(type, entity, { folderId = null } = {}) {
  if (!TEMPLATE_TYPES[type]) return null;
  const tpl = {
    id: genId(TEMPLATE_TYPES[type].idPrefix),
    savedAt: new Date().toISOString(),
    folderId: folderId ?? null,
    ...buildTemplateFromEntity(type, entity),
  };
  persist(type, [tpl, ...loadTemplates(type)]);
  return tpl;
}

export function removeTemplate(type, id) {
  persist(type, loadTemplates(type).filter((t) => t.id !== id));
}

export function renameTemplate(type, id, newName) {
  const field = TEMPLATE_TYPES[type]?.nameField ?? "name";
  persist(
    type,
    loadTemplates(type).map((t) => (t.id === id ? { ...t, [field]: newName } : t))
  );
}

// Atualiza campos arbitrários de um modelo (preserva id/savedAt/folderId).
export function updateTemplate(type, id, patch) {
  if (!TEMPLATE_TYPES[type]) return;
  persist(
    type,
    loadTemplates(type).map((t) =>
      t.id === id ? { ...t, ...patch, id: t.id, savedAt: t.savedAt, folderId: t.folderId } : t
    )
  );
}

export function clearTemplates(type) {
  persist(type, []);
}

// Move um modelo para uma pasta (ou raiz, folderId = null).
export function moveTemplateToFolder(type, id, folderId) {
  persist(
    type,
    loadTemplates(type).map((t) => (t.id === id ? { ...t, folderId: folderId ?? null } : t))
  );
}

// Move vários modelos de uma vez. `items` = [{ type, id }, ...].
export function moveTemplatesToFolder(items, folderId) {
  const byType = {};
  for (const { type, id } of items) {
    if (!TEMPLATE_TYPES[type]) continue;
    (byType[type] ??= new Set()).add(id);
  }
  for (const type of Object.keys(byType)) {
    const ids = byType[type];
    persist(
      type,
      loadTemplates(type).map((t) => (ids.has(t.id) ? { ...t, folderId: folderId ?? null } : t))
    );
  }
}

// Reordena os modelos de UM tipo. `orderedIds` traz o subconjunto a reordenar
// (ex.: os visíveis na pasta atual); os demais mantêm suas posições.
export function reorderTemplates(type, orderedIds) {
  const list = loadTemplates(type);
  const idSet = new Set(orderedIds);
  const order = new Map(orderedIds.map((id, i) => [id, i]));
  const subset = list.filter((t) => idSet.has(t.id)).sort((a, b) => order.get(a.id) - order.get(b.id));
  let i = 0;
  persist(type, list.map((t) => (idSet.has(t.id) ? subset[i++] : t)));
}

// ============================================================
// PASTAS (folders) — store próprio, multi-tipo
// ============================================================
export function loadTemplateFolders() {
  try {
    const raw = localStorage.getItem(FOLDERS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

let _foldersSnapshot = null;
export function getTemplateFoldersSnapshot() {
  if (_foldersSnapshot == null) _foldersSnapshot = loadTemplateFolders();
  return _foldersSnapshot;
}

function persistFolders(list) {
  try {
    localStorage.setItem(FOLDERS_STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* quota / modo privado — falha silenciosa */
  }
  _foldersSnapshot = list;
  try {
    window.dispatchEvent(new CustomEvent(TEMPLATES_EVENT, { detail: { folders: true } }));
  } catch {
    /* SSR / sem window */
  }
}

export function createTemplateFolder(name) {
  const trimmed = (name || "").trim();
  if (!trimmed) return null;
  const now = new Date().toISOString();
  const folder = { id: genId("fld"), name: trimmed, createdAt: now, updatedAt: now };
  persistFolders([...loadTemplateFolders(), folder]);
  return folder;
}

export function renameTemplateFolder(id, name) {
  const trimmed = (name || "").trim();
  if (!trimmed) return;
  persistFolders(
    loadTemplateFolders().map((f) =>
      f.id === id ? { ...f, name: trimmed, updatedAt: new Date().toISOString() } : f
    )
  );
}

// Apaga a pasta e devolve seus modelos para a raiz (folderId = null).
export function removeTemplateFolder(id) {
  for (const type of TEMPLATE_TYPE_ORDER) {
    const list = loadTemplates(type);
    if (list.some((t) => t.folderId === id)) {
      persist(type, list.map((t) => (t.folderId === id ? { ...t, folderId: null } : t)));
    }
  }
  persistFolders(loadTemplateFolders().filter((f) => f.id !== id));
}

// Contagem de modelos por pasta (+ all / unfiled) para a sidebar.
export function getTemplateFolderCounts(templatesByType) {
  const counts = { all: 0, unfiled: 0 };
  for (const type of TEMPLATE_TYPE_ORDER) {
    for (const t of templatesByType?.[type] ?? []) {
      counts.all += 1;
      if (t.folderId == null) counts.unfiled += 1;
      else counts[t.folderId] = (counts[t.folderId] ?? 0) + 1;
    }
  }
  return counts;
}

// ============================================================
// IMPORT / EXPORT (arquivo e texto) — bundle único multi-tipo
// ============================================================
export const buildTemplatesExportPayload = (templatesByType) => {
  const templates = {};
  const referencedFolders = new Set();
  let count = 0;
  for (const type of TEMPLATE_TYPE_ORDER) {
    const list = templatesByType?.[type] ?? [];
    if (list.length) {
      templates[type] = list;
      count += list.length;
      for (const t of list) if (t.folderId != null) referencedFolders.add(t.folderId);
    }
  }
  // Inclui só as pastas realmente usadas pelos modelos exportados.
  const folders = loadTemplateFolders().filter((f) => referencedFolders.has(f.id));
  return {
    version: "1.0",
    kind: "fm-templates",
    exportedAt: new Date().toISOString(),
    system: "Feiticeiros & Maldições 2.5",
    count,
    folders,
    templates,
  };
};

export const serializeTemplatesExport = (templatesByType) =>
  JSON.stringify(buildTemplatesExportPayload(templatesByType), null, 2);

export const exportTemplatesToFile = (templatesByType, filename) => {
  const blob = new Blob([serializeTemplatesExport(templatesByType)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || "grimorio-modelos.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// Faz parse + validação de um JSON de modelos. Aceita o bundle
// { kind:"fm-templates", templates:{...} }. Lança Error amigável.
export const parseTemplatesImportText = (text) => {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("JSON inválido — verifique o texto colado.");
  }
  const raw = parsed?.templates;
  if (!raw || typeof raw !== "object") {
    throw new Error("Formato inválido: nenhum modelo encontrado neste arquivo.");
  }
  const templates = {};
  let count = 0;
  for (const type of TEMPLATE_TYPE_ORDER) {
    const list = Array.isArray(raw[type]) ? raw[type] : [];
    const valid = list.filter((t) => t && typeof t === "object" && templateLabel(type, t).trim());
    if (valid.length) {
      templates[type] = valid;
      count += valid.length;
    }
  }
  if (count === 0) {
    throw new Error("Nenhum modelo válido encontrado no arquivo.");
  }
  const folders = (Array.isArray(parsed?.folders) ? parsed.folders : [])
    .filter((f) => f && typeof f === "object" && f.id && String(f.name ?? "").trim())
    .map((f) => ({ id: f.id, name: String(f.name).trim() }));
  return {
    templates,
    folders,
    meta: {
      system: parsed.system || "Desconhecido",
      exportedAt: parsed.exportedAt,
      count,
    },
  };
};

export const importFromFile = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        resolve(parseTemplatesImportText(e.target.result));
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("Falha ao ler o arquivo."));
    reader.readAsText(file);
  });

// Mescla modelos importados no store. Por padrão pula duplicados exatos
// (mesma assinatura tipo+título+descrição) e regera ids para evitar colisão.
// Retorna { added, skipped } por total.
export function importTemplates(templatesByType, { dedupe = true, folders = [] } = {}) {
  let added = 0;
  let skipped = 0;
  let foldersAdded = 0;

  // 1) Mescla as pastas por id (não duplica as já existentes).
  if (Array.isArray(folders) && folders.length) {
    const existingFolders = loadTemplateFolders();
    const existingIds = new Set(existingFolders.map((f) => f.id));
    const now = new Date().toISOString();
    const toAdd = folders
      .filter((f) => f && f.id && !existingIds.has(f.id))
      .map((f) => ({ id: f.id, name: f.name, createdAt: now, updatedAt: now }));
    if (toAdd.length) {
      persistFolders([...existingFolders, ...toAdd]);
      foldersAdded = toAdd.length;
    }
  }
  // Conjunto de pastas válidas após a mescla (para nullar referências órfãs).
  const validFolderIds = new Set(loadTemplateFolders().map((f) => f.id));

  // 2) Mescla os modelos (regera id, preserva folderId quando a pasta existe).
  for (const type of TEMPLATE_TYPE_ORDER) {
    const incoming = templatesByType?.[type] ?? [];
    if (!incoming.length) continue;
    const existing = loadTemplates(type);
    const seen = new Set(existing.map((t) => templateSignature(type, t)));
    const toAdd = [];
    for (const t of incoming) {
      const sig = templateSignature(type, t);
      if (dedupe && seen.has(sig)) {
        skipped += 1;
        continue;
      }
      seen.add(sig);
      toAdd.push({
        ...t,
        id: genId(TEMPLATE_TYPES[type].idPrefix),
        savedAt: t.savedAt || new Date().toISOString(),
        folderId: t.folderId != null && validFolderIds.has(t.folderId) ? t.folderId : null,
      });
      added += 1;
    }
    if (toAdd.length) persist(type, [...toAdd, ...existing]);
  }
  return { added, skipped, foldersAdded };
}
