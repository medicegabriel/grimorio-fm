import { useState, useEffect, useCallback } from "react";

/**
 * ============================================================
 * useCreatureStorage — Hook unificado (creatures + folders)
 * ============================================================
 * Expande o hook original pra gerenciar também pastas.
 * Operações cruzadas (apagar pasta → mover criaturas pra raiz)
 * acontecem atomicamente dentro do mesmo setState.
 * ============================================================
 */

const CREATURES_KEY = "fm_creatures_v1";
const CREATURES_META_KEY = "fm_creatures_meta_v1";
const FOLDERS_KEY = "fm_folders_v1";

// ============================================================
// LEITURA/ESCRITA SEGURA
// ============================================================
const readCreatures = () => {
  try {
    const raw = localStorage.getItem(CREATURES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Migração silenciosa: garante folderId em fichas antigas
    return parsed.map((c) => ({
      ...c,
      folderId: c.folderId ?? null,
      isBuiltIn: false, // storage nunca contém built-ins
    }));
  } catch {
    return [];
  }
};

const readFolders = () => {
  try {
    const raw = localStorage.getItem(FOLDERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeCreatures = (creatures) => {
  try {
    localStorage.setItem(CREATURES_KEY, JSON.stringify(creatures));
    localStorage.setItem(CREATURES_META_KEY, JSON.stringify({
      lastSaved: new Date().toISOString(),
      count: creatures.length,
    }));
    return true;
  } catch {
    return false;
  }
};

const writeFolders = (folders) => {
  try {
    localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
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
export default function useCreatureStorage() {
  const [creatures, setCreatures] = useState(() => readCreatures());
  const [folders, setFolders] = useState(() => readFolders());
  const [isSaving, setIsSaving] = useState(false);

  // --- Persistência ---
  useEffect(() => {
    setIsSaving(true);
    const ok = writeCreatures(creatures);
    if (!ok) console.warn("Falha ao salvar criaturas (quota?)");
    const t = setTimeout(() => setIsSaving(false), 300);
    return () => clearTimeout(t);
  }, [creatures]);

  useEffect(() => {
    writeFolders(folders);
  }, [folders]);

  // ============================================================
  // CRIATURAS — CRUD
  // ============================================================
  const create = useCallback((creatureData) => {
    const now = new Date().toISOString();
    const newCreature = {
      ...creatureData,
      id: creatureData.id || generateId(),
      folderId: creatureData.folderId ?? null,
      isBuiltIn: false,
      createdAt: now,
      updatedAt: now,
    };
    setCreatures((prev) => [newCreature, ...prev]);
    return newCreature;
  }, []);

  const update = useCallback((id, patch) => {
    setCreatures((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, ...patch, isBuiltIn: false, updatedAt: new Date().toISOString() }
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
      createdAt: now,
      updatedAt: now,
    };
    setCreatures((prev) => [clone, ...prev]);
    return clone;
  }, []);

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

    // Normaliza creatures (limpa isBuiltIn defensivamente)
    const normalizedCreatures = incomingCreatures.map((c) => ({
      ...c,
      id: c.id || generateId(),
      folderId: c.folderId ?? null,
      isBuiltIn: false,
      updatedAt: now,
    }));

    // Estratégia de merge pra creatures (mesmo dicionário anterior)
    const strategies = {
      append: (prev) => [...normalizedCreatures, ...prev],
      replace: () => normalizedCreatures,
      merge: (prev) => {
        const existingIds = new Set(prev.map((c) => c.id));
        const newOnes = normalizedCreatures.filter((c) => !existingIds.has(c.id));
        const merged = prev.map((c) => {
          const match = normalizedCreatures.find((n) => n.id === c.id);
          return match || c;
        });
        return [...newOnes, ...merged];
      },
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
  }, []);

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
  };
}