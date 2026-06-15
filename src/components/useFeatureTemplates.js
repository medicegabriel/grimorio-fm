import { useTemplates } from "./useTemplates";

// Modelos de Características Personalizadas. Delega ao store unificado
// (fm-templates) para sincronizar com a Biblioteca de Modelos. API preservada.
export default function useFeatureTemplates() {
  const { templates, saveTemplate, removeTemplate } = useTemplates("caracteristica");
  return { templates, saveTemplate, removeTemplate };
}
