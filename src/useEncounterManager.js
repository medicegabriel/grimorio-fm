// useEncounterManager.js
// Hook de persistência dos encontros. Análogo ao useCreatureStorage.
// Chave separada no LocalStorage: fm_encounters_v1

import { useState, useEffect, useCallback } from 'react';
import { createEncounter, duplicateEncounter as duplicateFn } from './fm-encounter';

const STORAGE_KEY = 'fm_encounters_v1';

const loadFromStorage = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Migração: garante folderId em encontros antigos
    return parsed.map((e) => ({ ...e, folderId: e.folderId ?? null }));
  } catch (err) {
    console.warn('[useEncounterManager] Falha ao carregar encontros:', err);
    return [];
  }
};

const saveToStorage = (encounters) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(encounters));
  } catch (err) {
    console.warn('[useEncounterManager] Falha ao salvar encontros:', err);
  }
};

export default function useEncounterManager() {
  const [encounters, setEncounters] = useState(() => loadFromStorage());

  useEffect(() => {
    saveToStorage(encounters);
  }, [encounters]);

  const create = useCallback((opts = {}) => {
    const fresh = createEncounter(opts);
    setEncounters((prev) => [fresh, ...prev]);
    return fresh;
  }, []);

  const update = useCallback((id, patchOrFn) => {
    setEncounters((prev) =>
      prev.map((e) => {
        if (e.id !== id) return e;
        const next = typeof patchOrFn === 'function' ? patchOrFn(e) : { ...e, ...patchOrFn };
        return { ...next, updatedAt: Date.now() };
      })
    );
  }, []);

  const remove = useCallback((id) => {
    setEncounters((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const duplicate = useCallback((id) => {
    setEncounters((prev) => {
      const src = prev.find((e) => e.id === id);
      if (!src) return prev;
      return [duplicateFn(src), ...prev];
    });
  }, []);

  const getById = useCallback(
    (id) => encounters.find((e) => e.id === id) ?? null,
    [encounters]
  );

  const moveToFolder = useCallback((id, folderId) => {
    setEncounters((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, folderId: folderId ?? null, updatedAt: Date.now() } : e
      )
    );
  }, []);

  const moveManyToFolder = useCallback((ids, folderId) => {
    const idSet = new Set(ids);
    setEncounters((prev) =>
      prev.map((e) =>
        idSet.has(e.id) ? { ...e, folderId: folderId ?? null, updatedAt: Date.now() } : e
      )
    );
  }, []);

  const reorderEncounters = useCallback((orderedIds) => {
    setEncounters((prev) => {
      const idSet = new Set(orderedIds);
      const idOrder = new Map(orderedIds.map((id, i) => [id, i]));
      const sortedSubset = prev
        .filter((e) => idSet.has(e.id))
        .sort((a, b) => idOrder.get(a.id) - idOrder.get(b.id));
      let subIdx = 0;
      return prev.map((e) => (idSet.has(e.id) ? sortedSubset[subIdx++] : e));
    });
  }, []);

  return { encounters, create, update, remove, duplicate, getById, moveToFolder, moveManyToFolder, reorderEncounters };
}