import { useTemplates } from "./useTemplates";

// Modelos de Ações. Agora delega ao store unificado (fm-templates) para
// ficar em sincronia com a Biblioteca de Modelos. API preservada.
export default function useActionTemplates() {
  const { templates, saveTemplate, removeTemplate } = useTemplates("acao");
  return { templates, saveTemplate, removeTemplate };
}
