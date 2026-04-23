import React, { useState } from "react";
import { Plus, Trash2, Sparkles } from "lucide-react";
import { FieldLabel, TextInput, TextArea, Select, SmallButton, Pill } from "../builder-controls";

const CATEGORIES = [
  { value: "geral",           label: "Geral" },
  { value: "especial",        label: "Especial" },
  { value: "dote_geral",      label: "Dote Geral" },
  { value: "dote_amaldicoado", label: "Dote Amaldiçoado" },
  { value: "aptidao",         label: "Aptidão" },
  { value: "treinamento",     label: "Treinamento" },
  { value: "artimanha",       label: "Artimanha" },
];

const TRIGGERS = [
  { value: "passiva",      label: "Passiva" },
  { value: "rodada",       label: "Todo turno" },
  { value: "condicional",  label: "Condicional" },
  { value: "acao",         label: "Custa ação" },
];

const CATEGORY_COLORS = {
  geral: "slate",
  especial: "rose",
  dote_geral: "sky",
  dote_amaldicoado: "purple",
  aptidao: "amber",
  treinamento: "emerald",
  artimanha: "rose",
};

export default function SectionFeatures({ draft, actions }) {
  const [showForm, setShowForm] = useState(false);

  const handleAdd = (newFeature) => {
    actions.addFeature({ ...newFeature, id: `feat-${Date.now().toString(36)}` });
    setShowForm(false);
  };

  return (
    <div className="space-y-3">
      {draft.features.length === 0 && (
        <div className="text-center py-6 text-slate-600 text-sm italic border border-dashed border-slate-800 rounded">
          Nenhuma característica cadastrada
        </div>
      )}

      {draft.features.map((f) => (
        <FeatureItem
          key={f.id}
          feature={f}
          onUpdate={(patch) => actions.updateFeature(f.id, patch)}
          onRemove={() => actions.removeFeature(f.id)}
        />
      ))}

      {showForm ? (
        <FeatureForm onAdd={handleAdd} onCancel={() => setShowForm(false)} />
      ) : (
        <SmallButton onClick={() => setShowForm(true)} variant="primary">
          <Plus className="w-3 h-3" /> Adicionar Característica
        </SmallButton>
      )}
    </div>
  );
}

function FeatureItem({ feature, onUpdate, onRemove }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="bg-slate-950/40 border border-slate-800 rounded">
      <div className="flex items-center gap-2 p-2">
        <Sparkles className="w-3.5 h-3.5 text-fuchsia-400 flex-shrink-0" />
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex-1 text-left text-sm font-semibold text-white hover:text-purple-300 truncate"
        >
          {feature.name || "Sem nome"}
        </button>
        <Pill color={CATEGORY_COLORS[feature.category] || "slate"}>{feature.category}</Pill>
        <SmallButton onClick={onRemove} variant="danger">
          <Trash2 className="w-3 h-3" />
        </SmallButton>
      </div>
      {expanded && (
        <div className="border-t border-slate-800 p-3 space-y-2">
          <TextInput value={feature.name} onChange={(v) => onUpdate({ name: v })} placeholder="Nome" />
          <TextArea
            value={feature.description}
            onChange={(v) => onUpdate({ description: v })}
            rows={2}
            placeholder="Descrição..."
          />
          <div className="grid grid-cols-2 gap-2">
            <Select
              value={feature.category}
              onChange={(v) => onUpdate({ category: v })}
              options={CATEGORIES}
            />
            <Select
              value={feature.trigger}
              onChange={(v) => onUpdate({ trigger: v })}
              options={TRIGGERS}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function FeatureForm({ onAdd, onCancel }) {
  const [form, setForm] = useState({
    name: "",
    category: "geral",
    trigger: "passiva",
    description: "",
  });
  const update = (p) => setForm((prev) => ({ ...prev, ...p }));

  return (
    <div className="bg-slate-950/70 border border-purple-900/50 rounded p-4 space-y-3">
      <h4 className="text-sm font-bold text-purple-300">Nova Característica</h4>
      <TextInput value={form.name} onChange={(v) => update({ name: v })} placeholder="Nome" />
      <div className="grid grid-cols-2 gap-2">
        <Select value={form.category} onChange={(v) => update({ category: v })} options={CATEGORIES} />
        <Select value={form.trigger} onChange={(v) => update({ trigger: v })} options={TRIGGERS} />
      </div>
      <TextArea
        value={form.description}
        onChange={(v) => update({ description: v })}
        rows={3}
        placeholder="Como funciona..."
      />
      <div className="flex justify-end gap-2">
        <SmallButton onClick={onCancel}>Cancelar</SmallButton>
        <SmallButton onClick={() => onAdd(form)} variant="primary" disabled={!form.name.trim()}>
          Adicionar
        </SmallButton>
      </div>
    </div>
  );
}
