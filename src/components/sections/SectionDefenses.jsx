import React, { useState } from "react";
import { Plus, Shield, ShieldOff, ShieldAlert, AlertTriangle, BookOpen } from "lucide-react";
import { FieldLabel, TextInput, Select, SmallButton, Pill } from "../builder-controls";
import { CONDITIONS } from "../fm-tables";

const LEVELS = [
  { value: "fraca",   label: "Fraca" },
  { value: "media",   label: "Média" },
  { value: "forte",   label: "Forte" },
  { value: "extrema", label: "Extrema" },
];

const CATEGORIES = [
  { key: "resistencias",     label: "Resistências",     icon: Shield,      color: "sky",     accent: "text-sky-400" },
  { key: "imunidades",       label: "Imunidades",       icon: ShieldAlert, color: "emerald", accent: "text-emerald-400" },
  { key: "vulnerabilidades", label: "Vulnerabilidades", icon: ShieldOff,   color: "rose",    accent: "text-rose-400" },
];

const CONDITION_GROUPS = [
  { key: "fracas",   label: "Fracas",   accent: "text-slate-400" },
  { key: "medias",   label: "Médias",   accent: "text-amber-400" },
  { key: "fortes",   label: "Fortes",   accent: "text-orange-400" },
  { key: "extremas", label: "Extremas", accent: "text-red-400" },
];

export default function SectionDefenses({ draft, actions }) {
  const [newEntry, setNewEntry] = useState({
    category: "resistencias",
    tipo: "",
    nivel: "media",
  });
  const [newCondition, setNewCondition] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleAddDefense = () => {
    if (!newEntry.tipo.trim()) return;
    actions.addDefense(newEntry.category, {
      tipo: newEntry.tipo.trim().toLowerCase(),
      nivel: newEntry.nivel,
    });
    setNewEntry({ ...newEntry, tipo: "" });
  };

  const handleAddCondition = () => {
    if (!newCondition.trim()) return;
    actions.addDefense("condicoesImunes", newCondition.trim().toLowerCase());
    setNewCondition("");
  };

  const addedConditions = new Set(draft.defenses.condicoesImunes);
  const suggestionsLeft = Object.values(CONDITIONS).flat().filter((c) => !addedConditions.has(c)).length;

  return (
    <div className="space-y-4">
      {/* Listas por categoria */}
      {CATEGORIES.map(({ key, label, icon: Icon, color, accent }) => (
        <div key={key}>
          <h3 className={`text-[10px] uppercase tracking-widest font-bold mb-2 flex items-center gap-1.5 ${accent}`}>
            <Icon className="w-3 h-3" /> {label}
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {draft.defenses[key].length === 0 && (
              <span className="text-xs text-slate-600 italic">Nenhuma</span>
            )}
            {draft.defenses[key].map((item, i) => (
              <Pill
                key={`${key}-${i}`}
                color={color}
                onRemove={() => actions.removeDefense(key, i)}
              >
                {item.tipo} <span className="opacity-60">({item.nivel})</span>
              </Pill>
            ))}
          </div>
        </div>
      ))}

      {/* Condições imunes */}
      <div>
        <h3 className="text-[10px] uppercase tracking-widest text-amber-400 font-bold mb-2 flex items-center gap-1.5">
          <AlertTriangle className="w-3 h-3" /> Imunidade a Condições
        </h3>

        {/* Pills de condições adicionadas */}
        <div className="flex flex-wrap gap-1.5 mb-2">
          {draft.defenses.condicoesImunes.length === 0 && (
            <span className="text-xs text-slate-600 italic">Nenhuma</span>
          )}
          {draft.defenses.condicoesImunes.map((cond, i) => (
            <Pill key={`c-${i}`} color="amber" onRemove={() => actions.removeDefense("condicoesImunes", i)}>
              {cond}
            </Pill>
          ))}
        </div>

        {/* Linha de input + botões */}
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex-1 min-w-0 basis-32">
            <TextInput
              value={newCondition}
              onChange={setNewCondition}
              placeholder="Ex: envenenado, atordoado..."
            />
          </div>
          <div className="flex-shrink-0">
            <SmallButton onClick={handleAddCondition} variant="primary" disabled={!newCondition.trim()}>
              <Plus className="w-3 h-3" />
            </SmallButton>
          </div>
          <div className="flex-shrink-0">
            <SmallButton
              onClick={() => setShowSuggestions(!showSuggestions)}
              disabled={suggestionsLeft === 0}
            >
              <BookOpen className="w-3 h-3" />
              {showSuggestions ? "Ocultar" : "Mostrar"} sugestões
              <span className="opacity-60">({suggestionsLeft})</span>
            </SmallButton>
          </div>
        </div>

        {/* Painel de sugestões por nível */}
        {showSuggestions && suggestionsLeft > 0 && (
          <div className="border border-slate-800 rounded-lg p-4 bg-slate-900/30 mt-3 space-y-3">
            {CONDITION_GROUPS.map(({ key, label, accent }) => {
              const available = CONDITIONS[key].filter((c) => !addedConditions.has(c));
              if (available.length === 0) return null;
              return (
                <div key={key}>
                  <h4 className={`text-[10px] uppercase tracking-widest font-bold mb-1.5 ${accent}`}>
                    {label}
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {available.map((cond) => (
                      <button
                        key={cond}
                        type="button"
                        onClick={() => actions.addDefense("condicoesImunes", cond)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-slate-900 hover:bg-amber-900/30 border border-slate-800 hover:border-amber-700 text-slate-300 hover:text-white transition-colors capitalize"
                      >
                        <Plus className="w-2.5 h-2.5" /> {cond}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Formulário unificado para adicionar */}
      <div className="pt-3 border-t border-slate-800">
        <h3 className="text-[10px] uppercase tracking-widest text-slate-500 mb-2 font-bold">
          Adicionar Resistência / Imunidade / Vulnerabilidade
        </h3>
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex-shrink-0">
            <Select
              value={newEntry.category}
              onChange={(v) => setNewEntry({ ...newEntry, category: v })}
              options={CATEGORIES.map((c) => ({ value: c.key, label: c.label }))}
            />
          </div>
          <div className="min-w-0 flex-1 basis-32">
            <TextInput
              value={newEntry.tipo}
              onChange={(v) => setNewEntry({ ...newEntry, tipo: v })}
              placeholder="Ex: queimante, veneno..."
            />
          </div>
          <div className="flex-shrink-0">
            <Select
              value={newEntry.nivel}
              onChange={(v) => setNewEntry({ ...newEntry, nivel: v })}
              options={LEVELS}
            />
          </div>
          <div className="flex-shrink-0">
            <SmallButton onClick={handleAddDefense} variant="primary" disabled={!newEntry.tipo.trim()}>
              <Plus className="w-3 h-3" /> Adicionar
            </SmallButton>
          </div>
        </div>
      </div>
    </div>
  );
}
