import React, { useState } from "react";
import { Plus } from "lucide-react";
import { SmallButton, Pill } from "../../builder-controls";
import useActionTemplates from "../../useActionTemplates";
import ActionItem from "./ActionItem";
import ActionForm from "./ActionForm";

// ============================================================
// SECTION ACTIONS
// ============================================================
export default function SectionActions({ draft, derived, actions }) {
  const [showForm, setShowForm] = useState(false);
  const { templates: actionTemplates, saveTemplate: saveActionTemplate, removeTemplate: removeActionTemplate } = useActionTemplates();

  const handleAdd = (newAction) => {
    actions.addAction({ ...newAction, id: `act-${Date.now().toString(36)}` });
    setShowForm(false);
  };

  const total   = derived.actionsTotal ?? { comum: 1, bonus: 0, rapida: 0, movimento: 1, reacao: 1 };
  const patamar = draft.core?.patamar;
  const nd      = draft.core?.nd;
  const bt      = derived.bt ?? 2;

  return (
    <div className="space-y-3">
      <div className="bg-slate-950/60 border border-slate-800 rounded px-3 py-2 flex flex-wrap gap-2 text-xs">
        <span className="text-slate-500">Por turno:</span>
        <Pill color="rose">{total.comum} Comum</Pill>
        <Pill color="amber">{total.rapida} Rápida</Pill>
        <Pill color="sky">{total.bonus} Bônus</Pill>
        <Pill color="emerald">{total.movimento} Movimento</Pill>
        <Pill color="purple">{total.reacao} Reação</Pill>
      </div>

      <div className="space-y-2">
        {draft.actions.list.length === 0 && (
          <div className="text-center py-6 text-slate-600 text-sm italic border border-dashed border-slate-800 rounded">
            Nenhuma ação cadastrada
          </div>
        )}
        {draft.actions.list.map((action) => (
          <ActionItem
            key={action.id}
            action={action}
            patamar={patamar}
            nd={nd}
            bt={bt}
            creatureName={draft.name || "A criatura"}
            onUpdate={(patch) => actions.updateAction(action.id, patch)}
            onRemove={() => actions.removeAction(action.id)}
            onDuplicate={() => actions.duplicateAction(action.id)}
            onSaveTemplate={saveActionTemplate}
          />
        ))}
      </div>

      {showForm ? (
        <ActionForm
          derived={derived}
          draft={draft}
          onAdd={handleAdd}
          onCancel={() => setShowForm(false)}
          templates={actionTemplates}
          onRemoveTemplate={removeActionTemplate}
        />
      ) : (
        <SmallButton onClick={() => setShowForm(true)} variant="primary">
          <Plus className="w-3 h-3" /> Adicionar Ação
        </SmallButton>
      )}
    </div>
  );
}
