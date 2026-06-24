// AutomationEditorPanel.jsx
// ============================================================
// MOTOR DE AUTOMAÇÃO — painel "Automatizar" reutilizável
// ============================================================
// Botão "Automatizar (N)" que abre/fecha o AutomationBuilder. Plugado em
// qualquer editor de entidade (Característica, Ação, Expansão de Domínio,
// item de catálogo...). Recebe `value` (entity.automation) e `onChange`.
// ============================================================

import { useState } from "react";
import { Zap } from "lucide-react";
import AutomationBuilder from "./AutomationBuilder";
import { automationRuleCount } from "./fm-automation";

export default function AutomationEditorPanel({ value, onChange, label = "Automatizar", defaultOpen = false, dslContext = null, defaultStack = "sum" }) {
  const [open, setOpen] = useState(defaultOpen);
  const count = automationRuleCount({ automation: value });
  return (
    <div className="pt-2 mt-1 border-t border-slate-800">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded transition-colors focus:outline-none ${
          open || count > 0
            ? "bg-emerald-900/40 text-emerald-300 border border-emerald-800/60"
            : "text-slate-400 hover:text-emerald-300 hover:bg-slate-800 border border-transparent"
        }`}
      >
        <Zap className="w-3 h-3" />
        {label}{count > 0 ? ` (${count})` : ""}
      </button>
      {open && (
        <div className="mt-2">
          <AutomationBuilder value={value} onChange={onChange} dslContext={dslContext} defaultStack={defaultStack} />
        </div>
      )}
    </div>
  );
}
