import { useState, useEffect, useCallback, useMemo } from "react";

/**
 * ============================================================
 * useCreatureStorage — Hook unificado (creatures + folders)
 * ============================================================
 * Expande o hook original pra gerenciar também pastas.
 * Operações cruzadas (apagar pasta → mover criaturas pra raiz)
 * acontecem atomicamente dentro do mesmo setState.
 *
 * NAMESPACE: sem namespace, usa as chaves originais (fm_creatures_v1
 * etc.) — comportamento idêntico ao histórico. Com namespace (ex.:
 * "afty"), usa um conjunto de chaves isolado (fm_creatures_afty_v1),
 * criando um espaço de dados totalmente separado que nunca se mistura
 * com o grimório público. É assim que a rota /Afty fica escondida.
 * ============================================================
 */

// Monta as chaves do LocalStorage a partir do namespace.
// namespace "" → chaves originais; "afty" → chaves _afty_.
const buildKeys = (namespace = "") => {
  const suffix = namespace ? `_${namespace}` : "";
  return {
    creatures: `fm_creatures${suffix}_v1`,
    meta: `fm_creatures_meta${suffix}_v1`,
    folders: `fm_folders${suffix}_v1`,
  };
};

// ============================================================
// LEITURA/ESCRITA SEGURA
// ============================================================
const readCreatures = (key, defaultRulesVersion) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Migração silenciosa: garante folderId e rulesVersion em fichas antigas.
    // Fichas sem versão herdam a versão padrão do espaço (2.5.2 no público,
    // "afty" no espaço homebrew).
    return parsed.map((c) => ({
      ...c,
      folderId: c.folderId ?? null,
      rulesVersion: c.rulesVersion ?? defaultRulesVersion,
      isBuiltIn: false, // storage nunca contém built-ins
    }));
  } catch {
    return [];
  }
};

const readFolders = (key) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeCreatures = (creatures, keys) => {
  try {
    localStorage.setItem(keys.creatures, JSON.stringify(creatures));
    localStorage.setItem(keys.meta, JSON.stringify({
      lastSaved: new Date().toISOString(),
      count: creatures.length,
    }));
    window.dispatchEvent(new Event('storage-update'));
    return true;
  } catch {
    return false;
  }
};

const writeFolders = (folders, key) => {
  try {
    localStorage.setItem(key, JSON.stringify(folders));
    window.dispatchEvent(new Event('storage-update'));
    return true;
  } catch {
    return false;
  }
};

const generateId = (prefix = "") =>
  `${prefix}${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;

// ============================================================
// HOOK
// ============================================================
export default function useCreatureStorage({ namespace = "", defaultRulesVersion = "2.5.2" } = {}) {
  // namespace é fixo durante a vida do componente (definido pela rota),
  // então as chaves são estáveis — sem risco de loop nos efeitos.
  const keys = useMemo(() => buildKeys(namespace), [namespace]);

  const [creatures, setCreatures] = useState(() => readCreatures(keys.creatures, defaultRulesVersion));
  const [folders, setFolders] = useState(() => readFolders(keys.folders));
  const [isSaving, setIsSaving] = useState(false);

  // --- Persistência ---
  useEffect(() => {
    setIsSaving(true);
    const ok = writeCreatures(creatures, keys);
    if (!ok) console.warn("Falha ao salvar criaturas (quota?)");
    const t = setTimeout(() => setIsSaving(false), 300);
    return () => clearTimeout(t);
  }, [creatures, keys]);

  useEffect(() => {
    writeFolders(folders, keys.folders);
  }, [folders, keys]);

  // ============================================================
  // CRIATURAS — CRUD
  // ============================================================
  const create = useCallback((creatureData) => {
    const now = new Date().toISOString();
    const newCreature = {
      ...creatureData,
      id: creatureData.id || generateId(),
      folderId: creatureData.folderId ?? null,
      rulesVersion: creatureData.rulesVersion ?? defaultRulesVersion,
      isBuiltIn: false,
      createdAt: now,
      updatedAt: now,
      editLog: creatureData.editLog ?? [],
    };
    setCreatures((prev) => [newCreature, ...prev]);
    return newCreature;
  }, [defaultRulesVersion]);

  const update = useCallback((id, patch) => {
    setCreatures((prev) =>
      prev.map((c) =>
        c.id === id
          // Honra um updatedAt já vindo no patch (save do builder, casado com o
          // editLog); senão carimba agora (mudanças de combate, mover pasta...).
          ? { ...c, ...patch, isBuiltIn: false, updatedAt: patch.updatedAt ?? new Date().toISOString() }
          : c
      )
    );
  }, []);

  const remove = useCallback((id) => {
    setCreatures((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const removeMany = useCallback((ids) => {
    const idSet = new Set(ids);
    setCreatures((prev) => prev.filter((c) => !idSet.has(c.id)));
  }, []);

  const duplicate = useCallback((id) => {
    let cloneRef = null;
    setCreatures((prev) => {
      const original = prev.find((c) => c.id === id);
      if (!original) return prev;
      const copy = {
        ...JSON.parse(JSON.stringify(original)),
        id: generateId(),
        name: `${original.name} (Cópia)`,
        isBuiltIn: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        editLog: [], // cópia começa com histórico de edições zerado
      };
      cloneRef = copy;
      return [copy, ...prev];
    });
    return cloneRef;
  }, []);

  // Clona uma criatura built-in (ou qualquer objeto externo) pro storage.
  // Remove a flag isBuiltIn e joga na raiz por padrão.
  const cloneFromBuiltIn = useCallback((builtIn, { folderId = null, renameSuffix = "" } = {}) => {
    const now = new Date().toISOString();
    const clone = {
      ...JSON.parse(JSON.stringify(builtIn)),
      id: generateId(),
      name: renameSuffix ? `${builtIn.name}${renameSuffix}` : builtIn.name,
      isBuiltIn: false,
      folderId,
      rulesVersion: builtIn.rulesVersion ?? defaultRulesVersion,
      createdAt: now,
      updatedAt: now,
      editLog: [], // clone começa com histórico de edições zerado
    };
    setCreatures((prev) => [clone, ...prev]);
    return clone;
  }, [defaultRulesVersion]);

  // ============================================================
  // PASTAS — CRUD
  // ============================================================
  const createFolder = useCallback((name) => {
    const trimmed = (name || "").trim();
    if (!trimmed) return null;
    const now = new Date().toISOString();
    const folder = {
      id: generateId("fld_"),
      name: trimmed,
      createdAt: now,
      updatedAt: now,
    };
    setFolders((prev) => [...prev, folder]);
    return folder;
  }, []);

  const renameFolder = useCallback((id, name) => {
    const trimmed = (name || "").trim();
    if (!trimmed) return;
    setFolders((prev) =>
      prev.map((f) =>
        f.id === id ? { ...f, name: trimmed, updatedAt: new Date().toISOString() } : f
      )
    );
  }, []);

  // Apagar pasta: as criaturas órfãs vão pra raiz (folderId = null).
  // A operação em creatures E folders acontece juntas — sem race.
  const removeFolder = useCallback((id) => {
    setCreatures((prev) =>
      prev.map((c) =>
        c.folderId === id
          ? { ...c, folderId: null, updatedAt: new Date().toISOString() }
          : c
      )
    );
    setFolders((prev) => prev.filter((f) => f.id !== id));
  }, []);

  // ============================================================
  // MOVIMENTAÇÃO
  // ============================================================
  const moveCreatureToFolder = useCallback((creatureId, folderId) => {
    setCreatures((prev) =>
      prev.map((c) =>
        c.id === creatureId
          ? { ...c, folderId: folderId ?? null, updatedAt: new Date().toISOString() }
          : c
      )
    );
  }, []);

  const moveCreaturesToFolder = useCallback((creatureIds, folderId) => {
    const idSet = new Set(creatureIds);
    setCreatures((prev) =>
      prev.map((c) =>
        idSet.has(c.id)
          ? { ...c, folderId: folderId ?? null, updatedAt: new Date().toISOString() }
          : c
      )
    );
  }, []);

  // ============================================================
  // REORDENAÇÃO — mantém o restante do array intacto
  // ============================================================
  // orderedIds: novo array de IDs na ordem desejada (subconjunto de creatures).
  // As criaturas não incluídas em orderedIds permanecem nas suas posições originais.
  const reorderCreatures = useCallback((orderedIds) => {
    setCreatures((prev) => {
      const idSet = new Set(orderedIds);
      const idOrder = new Map(orderedIds.map((id, i) => [id, i]));
      const sortedSubset = prev
        .filter((c) => idSet.has(c.id))
        .sort((a, b) => idOrder.get(a.id) - idOrder.get(b.id));
      let subIdx = 0;
      return prev.map((c) => (idSet.has(c.id) ? sortedSubset[subIdx++] : c));
    });
  }, []);

  // ============================================================
  // IMPORT — aceita array puro (retrocompat) ou { creatures, folders }
  // ============================================================
  const importMany = useCallback((payload, { mergeStrategy = "append" } = {}) => {
    // Detecta formato
    const shapes = {
      array: (p) => Array.isArray(p),
      bundle: (p) => p && typeof p === "object" && Array.isArray(p.creatures),
    };

    const shape = Object.keys(shapes).find((k) => shapes[k](payload));
    if (!shape) return { imported: 0, skipped: 0, foldersImported: 0 };

    const incomingCreatures = shape === "array" ? payload : (payload.creatures || []);
    const incomingFolders = shape === "bundle" ? (payload.folders || []) : [];

    if (incomingCreatures.length === 0 && incomingFolders.length === 0) {
      return { imported: 0, skipped: 0, foldersImported: 0 };
    }

    const now = new Date().toISOString();

    // Normaliza folders
    const normalizedFolders = incomingFolders.map((f) => ({
      id: f.id || generateId("fld_"),
      name: f.name || "Pasta importada",
      createdAt: f.createdAt || now,
      updatedAt: now,
    }));

    // Normaliza creatures: SEMPRE gera novo ID para evitar colisão
    const normalizedCreatures = incomingCreatures.map((c) => ({
      ...c,
      id: generateId(),           // novo ID garantido — sem colisão possível
      folderId: c.folderId ?? null,
      rulesVersion: c.rulesVersion ?? defaultRulesVersion,
      isBuiltIn: false,
      updatedAt: now,
    }));

    // Estratégia de merge pra creatures
    const strategies = {
      append: (prev) => {
        const existingNames = new Set(prev.map((c) => c.name));
        const tagged = normalizedCreatures.map((c) => ({
          ...c,
          name: existingNames.has(c.name) ? `${c.name} (Importado)` : c.name,
        }));
        return [...tagged, ...prev];
      },
      replace: () => normalizedCreatures,
    };
    const strategy = strategies[mergeStrategy] || strategies.append;
    setCreatures(strategy);

    // Folders: sempre merge por id (não duplica se já existe)
    if (normalizedFolders.length > 0) {
      setFolders((prev) => {
        const existingIds = new Set(prev.map((f) => f.id));
        const newFolders = normalizedFolders.filter((f) => !existingIds.has(f.id));
        return [...prev, ...newFolders];
      });
    }

    return {
      imported: normalizedCreatures.length,
      skipped: 0,
      foldersImported: normalizedFolders.length,
    };
  }, [defaultRulesVersion]);

  return {
    // State
    creatures,
    folders,
    isSaving,
    // Creatures CRUD
    create,
    update,
    remove,
    removeMany,
    duplicate,
    cloneFromBuiltIn,
    // Folders CRUD
    createFolder,
    renameFolder,
    removeFolder,
    // Movement
    moveCreatureToFolder,
    moveCreaturesToFolder,
    // IO
    importMany,
    // Order
    reorderCreatures,
  };
}