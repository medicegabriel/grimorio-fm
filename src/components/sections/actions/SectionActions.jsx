import React, { useState } from "react";
import { Plus, Sparkles } from "lucide-react";
import { SmallButton, Pill } from "../../builder-controls";
import useActionTemplates from "../../useActionTemplates";
import { isDomainAction } from "../../fm-domain-calc";
import { hasExpansaoDominio } from "../../fm-caracteristicas";
import ActionItem from "./ActionItem";
import ActionForm from "./ActionForm";
import DomainItem from "./DomainItem";
import DomainForm from "./DomainForm";

// ============================================================
// SECTION ACTIONS
// ============================================================
export default function SectionActions({ draft, derived, actions }) {
  const [showForm, setShowForm] = useState(false);
  const [showDomainForm, setShowDomainForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const { templates: actionTemplates, removeTemplate: removeActionTemplate } = useActionTemplates();

  // A Característica Especial "Expansão de Domínio" destrava o construtor próprio.
  const domainUnlocked = hasExpansaoDominio(draft.caracteristicas);

  const handleAdd = (newAction) => {
    actions.addAction({ ...newAction, id: `act-${Date.now().toString(36)}` });
    setShowForm(false);
  };

  const handleAddDomain = (newDomain) => {
    actions.addAction({ ...newDomain, id: `dom-${Date.now().toString(36)}` });
    setShowDomainForm(false);
  };

  // Abrir edição: fecha os forms de criação para não ter dois forms abertos.
  const handleEdit = (id) => {
    setEditingId(id);
    setShowForm(false);
    setShowDomainForm(false);
  };

  const handleSaveEdit = (updatedAction) => {
    actions.updateAction(editingId, updatedAction);
    setEditingId(null);
  };

  const total = derived.actionsTotal ?? { comum: 1, bonus: 0, rapida: 0, movimento: 1, reacao: 1 };

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

      {/* Forms de criação — acima da lista, escondidos durante uma edição. */}
      {editingId === null && (
        <>
          {showForm ? (
            <ActionForm
              derived={derived}
              draft={draft}
              onAdd={handleAdd}
              onCancel={() => setShowForm(false)}
              templates={actionTemplates}
              onRemoveTemplate={removeActionTemplate}
            />
          ) : showDomainForm ? (
            <DomainForm
              draft={draft}
              derived={derived}
              onAdd={handleAddDomain}
              onCancel={() => setShowDomainForm(false)}
            />
          ) : (
            <div className="flex flex-wrap gap-2">
              <SmallButton onClick={() => setShowForm(true)} variant="primary">
                <Plus className="w-3 h-3" /> Adicionar Ação
              </SmallButton>
              {domainUnlocked && (
                <SmallButton onClick={() => setShowDomainForm(true)} variant="primary">
                  <Sparkles className="w-3 h-3" /> Criar Expansão de Domínio
                </SmallButton>
              )}
            </div>
          )}
        </>
      )}

      <div className="space-y-2">
        {draft.actions.list.length === 0 && (
          <div className="text-center py-6 text-slate-600 text-sm italic border border-dashed border-slate-800 rounded">
            Nenhuma ação cadastrada
          </div>
        )}
        {draft.actions.list.map((action) => {
          const domain = isDomainAction(action);
          if (editingId === action.id) {
            return domain ? (
              <DomainForm
                key={action.id}
                draft={draft}
                derived={derived}
                initialAction={action}
                title="Editar Expansão de Domínio"
                submitLabel="Salvar"
                onAdd={handleSaveEdit}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <ActionForm
                key={action.id}
                derived={derived}
                draft={draft}
                initialAction={action}
                title="Editar Ação"
                submitLabel="Salvar"
                onAdd={handleSaveEdit}
                onCancel={() => setEditingId(null)}
                templates={actionTemplates}
                onRemoveTemplate={removeActionTemplate}
              />
            );
          }
          return domain ? (
            <DomainItem
              key={action.id}
              action={action}
              draft={draft}
              derived={derived}
              onEdit={() => handleEdit(action.id)}
              onRemove={() => actions.removeAction(action.id)}
              onDuplicate={() => actions.duplicateAction(action.id)}
            />
          ) : (
            <ActionItem
              key={action.id}
              action={action}
              creatureName={draft.name || "A criatura"}
              onEdit={() => handleEdit(action.id)}
              onRemove={() => actions.removeAction(action.id)}
              onDuplicate={() => actions.duplicateAction(action.id)}
            />
          );
        })}
      </div>
    </div>
  );
}
