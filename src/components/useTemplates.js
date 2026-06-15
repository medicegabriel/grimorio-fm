import { useSyncExternalStore, useCallback } from "react";
import {
  subscribeTemplates,
  getTemplatesSnapshot,
  getAllTemplatesSnapshot,
  getTemplateFoldersSnapshot,
  saveTemplateFromEntity,
  removeTemplate as removeTemplateStore,
  renameTemplate as renameTemplateStore,
  clearTemplates as clearTemplatesStore,
} from "./fm-templates";

// Hook de um tipo de modelo. Lê do store externo (localStorage) via
// useSyncExternalStore, então builder e Biblioteca ficam em sincronia
// quando qualquer um escreve (evento `fm-templates-changed`).
export function useTemplates(type) {
  const templates = useSyncExternalStore(
    subscribeTemplates,
    () => getTemplatesSnapshot(type)
  );

  const saveTemplate = useCallback((entity) => saveTemplateFromEntity(type, entity), [type]);
  const removeTemplate = useCallback((id) => removeTemplateStore(type, id), [type]);
  const renameTemplate = useCallback((id, name) => renameTemplateStore(type, id, name), [type]);
  const clearAll = useCallback(() => clearTemplatesStore(type), [type]);

  return { templates, saveTemplate, removeTemplate, renameTemplate, clearAll };
}

// Hook que observa TODOS os tipos — usado pela Biblioteca de Modelos.
export function useAllTemplates() {
  return useSyncExternalStore(subscribeTemplates, getAllTemplatesSnapshot);
}

// Hook que observa as Pastas de modelos (mesmo evento dos modelos).
export function useTemplateFolders() {
  return useSyncExternalStore(subscribeTemplates, getTemplateFoldersSnapshot);
}
