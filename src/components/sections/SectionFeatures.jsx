import React, { useState } from "react";
import { Plus, Trash2, Sparkles, BookOpen, X, Zap, Lock } from "lucide-react";
import { FieldLabel, TextInput, TextArea, Select, SmallButton, Pill } from "../builder-controls";
import { SaveTemplateButton } from "../TemplateControls";
import useFeatureTemplates from "../useFeatureTemplates";
import { FRUTOS_OPTIONS } from "../fm-origens";
import AutomationEditorPanel from "../AutomationEditorPanel";
import { automationRuleCount } from "../fm-automation";

const CATEGORIES = [
  { value: "geral",            label: "Geral" },
  { value: "especial",         label: "Especial" },
  { value: "dote_geral",       label: "Dote Geral" },
  { value: "dote_amaldicoado", label: "Dote Amaldiçoado" },
  { value: "aptidao",          label: "Aptidão" },
  { value: "treinamento",      label: "Treinamento" },
  { value: "artimanha",        label: "Artimanha" },
];

const TRIGGERS = [
  { value: "passiva",     label: "Passiva" },
  { value: "rodada",      label: "Todo turno" },
  { value: "condicional", label: "Condicional" },
  { value: "acao",        label: "Custa ação" },
];

const CATEGORY_COLORS = {
  geral:            "slate",
  especial:         "rose",
  dote_geral:       "sky",
  dote_amaldicoado: "purple",
  aptidao:          "amber",
  treinamento:      "emerald",
  artimanha:        "rose",
};

const CATEGORY_LABELS = Object.fromEntries(CATEGORIES.map((c) => [c.value, c.label]));

// `sourceFilter` (opcional): "custom" mostra só as criadas pelo usuário (com
// form de criação); "origin" mostra só as derivadas da Origem (somente leitura).
// Sem filtro, mostra todas com o form — comportamento original.
export default function SectionFeatures({ draft, actions, sourceFilter, dslContext = null }) {
  const [showForm, setShowForm] = useState(false);
  const { templates, removeTemplate } = useFeatureTemplates();

  const isOrigin = sourceFilter === "origin";
  const visibleFeatures = (draft.features || []).filter((f) =>
    sourceFilter === "custom" ? f.source !== "origin"
    : sourceFilter === "origin" ? f.source === "origin"
    : true
  );

  const handleAdd = (newFeature) => {
    actions.addFeature({ ...newFeature, id: `feat-${Date.now().toString(36)}` });
    setShowForm(false);
  };

  return (
    <div className="space-y-3">
      {/* Área de criação — acima da lista (escondida nas de Origem). */}
      {!isOrigin && (
        showForm ? (
          <FeatureForm
            onAdd={handleAdd}
            onCancel={() => setShowForm(false)}
            templates={templates}
            onRemoveTemplate={removeTemplate}
            dslContext={dslContext}
          />
        ) : (
          <SmallButton onClick={() => setShowForm(true)} variant="primary">
            <Plus className="w-3 h-3" /> Adicionar Característica
          </SmallButton>
        )
      )}

      {visibleFeatures.length === 0 && (
        <div className="text-center py-6 text-slate-600 text-sm italic border border-dashed border-slate-800 rounded">
          {isOrigin ? "Nenhuma característica de origem nesta ficha." : "Nenhuma característica cadastrada"}
        </div>
      )}

      {visibleFeatures.map((f) => (
        <FeatureItem
          key={f.id}
          feature={f}
          onUpdate={(patch) => actions.updateFeature(f.id, patch)}
          onRemove={() => actions.removeFeature(f.id)}
          origin={draft.core?.origin}
          onPatchOrigin={actions.patchOrigin}
          dslContext={dslContext}
        />
      ))}
    </div>
  );
}

function FeatureItem({ feature, onUpdate, onRemove, origin, onPatchOrigin, dslContext = null }) {
  const [expanded, setExpanded] = useState(false);

  const isFromOrigin = feature.source === "origin";
  const isAutomated = !!feature.automated;
  const isLocked = !!feature.locked;
  const ruleCount = automationRuleCount(feature);

  // Visual ligeiramente destacado pra features de origem
  const containerClass = isFromOrigin
    ? "bg-purple-950/20 border-purple-900/50 rounded"
    : "bg-slate-950/40 border-slate-800 rounded";

  return (
    <div className={`${containerClass} border`}>
      {/* flex-wrap: no mobile as badges descem pra próxima linha em vez de
          espremer o nome até sumir; no desktop tudo cabe numa linha (sem mudança). */}
      <div className="flex items-center flex-wrap gap-2 p-2">
        <Sparkles className="w-3.5 h-3.5 flex-shrink-0 text-fuchsia-400" />
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex-1 text-left text-sm font-semibold text-white hover:text-purple-300 truncate min-w-0"
        >
          {feature.name || "Sem nome"}
        </button>
        {isFromOrigin && (
          <span
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] uppercase tracking-wide bg-purple-950/60 text-purple-300 border-purple-800"
            title="Característica derivada da Origem — para alterá-la, mude a origem na seção Patamar & Nível."
          >
            <Lock className="w-2.5 h-2.5" /> Origem
          </span>
        )}
        <Pill color={CATEGORY_COLORS[feature.category] || "slate"}>
          {CATEGORY_LABELS[feature.category] || feature.category}
        </Pill>
        {isAutomated && (
          <span
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] uppercase tracking-wide bg-amber-950/60 text-amber-300 border-amber-800"
            title="Habilidade programada: aplicada automaticamente nos cálculos da ficha."
          >
            <Zap className="w-2.5 h-2.5" /> Programada
          </span>
        )}
        {ruleCount > 0 && (
          <span
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] uppercase tracking-wide bg-emerald-950/60 text-emerald-300 border-emerald-800"
            title="Esta habilidade tem automação (buffs/efeitos no combate)."
          >
            <Zap className="w-2.5 h-2.5" /> Automação ({ruleCount})
          </span>
        )}
        {!isFromOrigin && <SaveTemplateButton type="caracteristica" entity={feature} />}
        {!isFromOrigin && (
          <SmallButton onClick={onRemove} variant="danger">
            <Trash2 className="w-3 h-3" />
          </SmallButton>
        )}
      </div>
      {expanded && (
        <div className="border-t border-slate-800 p-3 space-y-2">
          {isLocked ? (
            <>
              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                {feature.description}
              </p>
              {feature.originKey === "frutos_experiencia" && onPatchOrigin && (
                <FrutosSelector
                  value={origin?.frutosExperiencia ?? null}
                  onChange={(v) => onPatchOrigin({ frutosExperiencia: v })}
                />
              )}
            </>
          ) : (
            <>
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

              {/* Automação (bloquinhos) — Motor de Automação */}
              <AutomationEditorPanel
                value={feature.automation}
                onChange={(automation) => onUpdate({ automation })}
                dslContext={dslContext}
                defaultStack="highest"
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}

// Seletor de bônus de Frutos da Experiência — radio group inline.
function FrutosSelector({ value, onChange }) {
  return (
    <div className="mt-2 pt-2 border-t border-purple-900/40">
      <p className="text-[10px] uppercase tracking-widest font-bold text-purple-300 mb-2">
        Escolha o bônus
      </p>
      <div className="space-y-1.5">
        {FRUTOS_OPTIONS.map((opt) => {
          const selected = value === opt.value;
          return (
            <label
              key={opt.value}
              className={`flex items-start gap-2 px-2 py-1.5 rounded border cursor-pointer transition-colors ${
                selected
                  ? "bg-amber-950/40 border-amber-700"
                  : "bg-slate-950/50 border-slate-800 hover:border-slate-700"
              }`}
            >
              <input
                type="radio"
                name="frutos-experiencia"
                checked={selected}
                onChange={() => onChange(opt.value)}
                className="mt-0.5 text-amber-500 bg-slate-950 border-slate-600 focus:ring-amber-500"
              />
              <span className="flex-1 min-w-0">
                <span className={`block text-xs font-semibold ${selected ? "text-amber-200" : "text-slate-200"}`}>
                  {opt.label}
                </span>
                <span className="block text-[11px] text-slate-400 leading-snug">
                  {opt.description}
                </span>
              </span>
            </label>
          );
        })}
        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-[10px] text-slate-500 hover:text-slate-300 underline decoration-dotted"
          >
            Limpar escolha
          </button>
        )}
      </div>
    </div>
  );
}

function FeatureForm({ onAdd, onCancel, templates, onRemoveTemplate, dslContext = null }) {
  const [form, setForm] = useState({
    name: "",
    category: "geral",
    trigger: "passiva",
    description: "",
    automation: null,
  });
  const [showTemplates, setShowTemplates] = useState(false);
  const update = (p) => setForm((prev) => ({ ...prev, ...p }));

  const applyTemplate = (tpl) => {
    setForm({
      name: tpl.name,
      category: tpl.category,
      trigger: tpl.trigger,
      description: tpl.description,
      // Automação programada (bloquinhos) — vem junto do modelo.
      automation: tpl.automation ?? null,
    });
    setShowTemplates(false);
  };

  return (
    <div className="bg-slate-950/70 border border-purple-900/50 rounded p-4 space-y-3">
      {/* Cabeçalho com botão de modelos */}
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-sm font-bold text-purple-300">Nova Característica</h4>
        {templates.length > 0 && (
          <button
            type="button"
            onClick={() => setShowTemplates(!showTemplates)}
            className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded transition-colors focus:outline-none ${
              showTemplates
                ? "bg-amber-900/40 text-amber-300 border border-amber-800/60"
                : "text-slate-400 hover:text-amber-300 hover:bg-slate-800"
            }`}
          >
            <BookOpen className="w-3 h-3" />
            Modelos ({templates.length})
          </button>
        )}
      </div>

      {/* Painel de modelos */}
      {showTemplates && (
        <div className="bg-slate-950 border border-slate-700 rounded overflow-hidden">
          <div className="px-3 py-2 border-b border-slate-800 flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
              Modelos Salvos
            </span>
            <button
              type="button"
              onClick={() => setShowTemplates(false)}
              className="text-slate-600 hover:text-slate-300"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          <div className="overflow-y-auto max-h-44 divide-y divide-slate-800/60">
            {templates.map((tpl) => (
              <div
                key={tpl.id}
                className="flex items-center gap-2 px-3 py-2 hover:bg-slate-800/60 group"
              >
                <button
                  type="button"
                  onClick={() => applyTemplate(tpl)}
                  className="flex-1 min-w-0 text-left"
                >
                  <span className="text-sm text-slate-200 truncate block group-hover:text-white">
                    {tpl.name}
                  </span>
                </button>
                <Pill color={CATEGORY_COLORS[tpl.category] || "slate"}>
                  {CATEGORY_LABELS[tpl.category] || tpl.category}
                </Pill>
                <button
                  type="button"
                  onClick={() => onRemoveTemplate(tpl.id)}
                  className="text-slate-600 hover:text-red-400 transition-colors flex-shrink-0"
                  title="Remover modelo"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Campos do formulário */}
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

      {/* Automação (bloquinhos) — já durante a criação da característica. */}
      <AutomationEditorPanel
        value={form.automation}
        onChange={(automation) => update({ automation })}
        dslContext={dslContext}
        defaultStack="highest"
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
