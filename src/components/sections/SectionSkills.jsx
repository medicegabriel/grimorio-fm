import React, { useState } from "react";
import { Plus, Trash2, Star, BookOpen } from "lucide-react";
import {
  FieldLabel, TextInput, Select, SmallButton, Pill,
} from "../builder-controls";

/**
 * SectionSkills — Gerenciador de perícias customizadas.
 *
 * Estrutura de cada skill:
 *   { id, name, attribute, mastered, overrideMod }
 *
 * O mod exibido é derivado via fm-derive.js (atributo + BT via tabela).
 * Cada perícia tem um toggle de "override" seguindo o mesmo padrão dos StatFields.
 */

// Lista de sugestões do PDF (pg. 10) — dicionário nome → atributo default
const SKILL_SUGGESTIONS = [
  { name: "Atletismo",       attribute: "forca" },
  { name: "Acrobacia",       attribute: "destreza" },
  { name: "Furtividade",     attribute: "destreza" },
  { name: "Prestidigitação", attribute: "destreza" },
  { name: "Direção",         attribute: "sabedoria" },
  { name: "Intuição",        attribute: "sabedoria" },
  { name: "Medicina",        attribute: "sabedoria" },
  { name: "Percepção",       attribute: "sabedoria" },
  { name: "Ocultismo",       attribute: "sabedoria" },
  { name: "Sobrevivência",   attribute: "sabedoria" },
  { name: "Investigação",    attribute: "inteligencia" },
  { name: "História",        attribute: "inteligencia" },
  { name: "Feitiçaria",      attribute: "inteligencia" },
  { name: "Teologia",        attribute: "inteligencia" },
  { name: "Tecnologia",      attribute: "inteligencia" },
  { name: "Persuasão",       attribute: "presenca" },
  { name: "Enganação",       attribute: "presenca" },
  { name: "Intimidação",     attribute: "presenca" },
  { name: "Performance",     attribute: "presenca" },
];

const ATTRIBUTE_OPTIONS = [
  { value: "forca",         label: "FOR" },
  { value: "destreza",      label: "DES" },
  { value: "constituicao",  label: "CON" },
  { value: "inteligencia",  label: "INT" },
  { value: "sabedoria",     label: "SAB" },
  { value: "presenca",      label: "PRE" },
];

const ATTR_COLORS = {
  forca:        "rose",
  destreza:     "emerald",
  constituicao: "amber",
  inteligencia: "sky",
  sabedoria:    "purple",
  presenca:     "rose",
};

export default function SectionSkills({ draft, derived, actions }) {
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Perícias já cadastradas (por nome) para não sugerir de novo
  const existingNames = new Set(
    draft.skills.map((s) => (s.name || "").toLowerCase().trim())
  );

  const suggestionsLeft = SKILL_SUGGESTIONS.filter(
    (sug) => !existingNames.has(sug.name.toLowerCase())
  );

  const handleAddCustom = () => {
    actions.addSkill({ name: "", attribute: "forca", mastered: false });
  };

  const handleAddFromSuggestion = (sug) => {
    actions.addSkill({ name: sug.name, attribute: sug.attribute, mastered: false });
  };

  return (
    <div className="space-y-3">
      {/* Info */}
      <p className="text-xs text-slate-500">
        Limite recomendado: <strong className="text-slate-300">{derived.mods ? Math.max(
          derived.mods.inteligencia,
          derived.mods.sabedoria,
          derived.mods.presenca
        ) : 0}</strong> perícias dominadas (maior modificador mental).
      </p>

      {/* Lista de perícias */}
      <div className="space-y-1.5">
        {draft.skills.length === 0 && (
          <div className="text-center py-6 text-slate-600 text-sm italic border border-dashed border-slate-800 rounded">
            Nenhuma perícia cadastrada
          </div>
        )}
        {draft.skills.map((skill) => (
          <SkillRow
            key={skill.id}
            skill={skill}
            derivation={derived.skillDerivations[skill.id]}
            onUpdate={(patch) => actions.updateSkill(skill.id, patch)}
            onRemove={() => actions.removeSkill(skill.id)}
            onOverride={(v) => actions.setSkillOverride(skill.id, v)}
          />
        ))}
      </div>

      {/* Ações */}
      <div className="flex flex-wrap gap-2 pt-2">
        <SmallButton onClick={handleAddCustom} variant="primary">
          <Plus className="w-3 h-3" /> Adicionar Perícia
        </SmallButton>
        <SmallButton
          onClick={() => setShowSuggestions(!showSuggestions)}
          disabled={suggestionsLeft.length === 0}
        >
          <BookOpen className="w-3 h-3" />
          {showSuggestions ? "Ocultar" : "Mostrar"} sugestões
          <span className="opacity-60">({suggestionsLeft.length})</span>
        </SmallButton>
      </div>

      {/* Sugestões rápidas (lista do PDF) */}
      {showSuggestions && suggestionsLeft.length > 0 && (
        <div className="bg-slate-950/60 border border-slate-800 rounded p-3">
          <h4 className="text-[10px] uppercase tracking-widest text-slate-500 mb-2 font-bold">
            Perícias do Livro
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {suggestionsLeft.map((sug) => (
              <button
                key={sug.name}
                onClick={() => handleAddFromSuggestion(sug)}
                className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-slate-900 hover:bg-purple-900/40 border border-slate-800 hover:border-purple-700 text-slate-300 hover:text-white transition-colors"
              >
                <Plus className="w-2.5 h-2.5" />
                {sug.name}
                <span className="text-[9px] text-slate-600 uppercase">
                  {sug.attribute.slice(0, 3)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Linha de perícia (compacta, inline editing) ----------
function SkillRow({ skill, derivation, onUpdate, onRemove, onOverride }) {
  const d = derivation || { calculatedMod: 0, finalMod: 0, isOverridden: false };
  const attrColor = ATTR_COLORS[skill.attribute] || "slate";

  const formatMod = (n) => (n >= 0 ? `+${n}` : `${n}`);

  // Borda levemente dourada se dominada, padrão se não
  const rowBorder = skill.mastered
    ? "border-amber-900/40 bg-amber-950/10"
    : "border-slate-800 bg-slate-950/40";

  // Estado de display do mod (calculado vs overridden)
  const modBg = d.isOverridden
    ? "bg-amber-950/60 border-amber-700 text-amber-200"
    : "bg-slate-900 border-slate-700 text-white";

  return (
    <div className={`grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 items-center p-2 border rounded ${rowBorder}`}>
      {/* Nome */}
      <TextInput
        value={skill.name}
        onChange={(v) => onUpdate({ name: v })}
        placeholder="Nome da perícia"
      />

      {/* Atributo */}
      <div className="w-20">
        <Select
          value={skill.attribute}
          onChange={(v) => onUpdate({ attribute: v })}
          options={ATTRIBUTE_OPTIONS}
        />
      </div>

      {/* Toggle Dominada */}
      <button
        onClick={() => onUpdate({ mastered: !skill.mastered })}
        className={`w-9 h-9 rounded border flex items-center justify-center transition-colors focus:outline-none focus:ring-1 focus:ring-purple-500 ${
          skill.mastered
            ? "bg-amber-900/60 border-amber-700 text-amber-200"
            : "bg-slate-900 border-slate-700 text-slate-600 hover:text-slate-400"
        }`}
        title={skill.mastered ? "Dominada (clique para desmarcar)" : "Não dominada"}
        type="button"
        aria-pressed={skill.mastered}
      >
        <Star className={`w-3.5 h-3.5 ${skill.mastered ? "fill-current" : ""}`} />
      </button>

      {/* Modificador — com override inline */}
      <ModCell
        derivation={d}
        overrideValue={skill.overrideMod}
        onOverride={onOverride}
      />

      {/* Remover */}
      <SmallButton onClick={onRemove} variant="danger">
        <Trash2 className="w-3 h-3" />
      </SmallButton>
    </div>
  );
}

// ---------- Célula de modificador com double-click para editar ----------
function ModCell({ derivation, overrideValue, onOverride }) {
  const [editing, setEditing] = useState(false);
  const isOverridden = derivation.isOverridden;

  const handleToggle = () => {
    if (isOverridden) {
      onOverride(null);     // limpa override → volta ao calculado
      setEditing(false);
    } else {
      onOverride(derivation.calculatedMod); // inicia override com valor atual
      setEditing(true);
    }
  };

  const format = (n) => (n >= 0 ? `+${n}` : `${n}`);

  // Estado visual via dicionário
  const states = {
    calculated: {
      box: "bg-slate-900 border-slate-700 text-white",
      label: "calc.",
    },
    overridden: {
      box: "bg-amber-950/60 border-amber-700 text-amber-200",
      label: "manual",
    },
  };
  const cfg = states[isOverridden ? "overridden" : "calculated"];

  return (
    <div className="flex items-center gap-1">
      <div
        className={`h-9 min-w-[3.5rem] px-2 rounded border flex items-center justify-center font-mono text-sm font-bold ${cfg.box}`}
        title={isOverridden ? `Calculado: ${format(derivation.calculatedMod)}` : ""}
      >
        {isOverridden && editing ? (
          <input
            type="number"
            value={overrideValue ?? ""}
            onChange={(e) => {
              const n = parseInt(e.target.value, 10);
              onOverride(Number.isFinite(n) ? n : 0);
            }}
            onBlur={() => setEditing(false)}
            className="w-full bg-transparent text-center focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            autoFocus
          />
        ) : (
          <button
            onClick={() => isOverridden && setEditing(true)}
            className="w-full h-full flex items-center justify-center"
            type="button"
          >
            {format(derivation.finalMod)}
          </button>
        )}
      </div>
      <button
        onClick={handleToggle}
        className={`text-[9px] uppercase px-1.5 py-0.5 rounded transition-colors ${
          isOverridden
            ? "text-amber-400 hover:bg-amber-950/60"
            : "text-slate-600 hover:text-slate-400 hover:bg-slate-800"
        }`}
        title={isOverridden ? "Restaurar ao calculado" : "Sobrescrever manualmente"}
        type="button"
      >
        {cfg.label}
      </button>
    </div>
  );
}
