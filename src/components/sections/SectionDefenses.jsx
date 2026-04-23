import React, { useState } from "react";
import { Plus, Shield, ShieldOff, ShieldAlert, AlertTriangle } from "lucide-react";
import { FieldLabel, TextInput, Select, SmallButton, Pill } from "../builder-controls";

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

export default function SectionDefenses({ draft, actions }) {
  const [newEntry, setNewEntry] = useState({
    category: "resistencias",
    tipo: "",
    nivel: "media",
  });
  const [newCondition, setNewCondition] = useState("");

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
    // Reutiliza a lógica de "addDefense" com categoria "condicoesImunes"
    actions.addDefense("condicoesImunes", newCondition.trim().toLowerCase());
    setNewCondition("");
  };

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
        <div className="flex gap-2">
          <TextInput
            value={newCondition}
            onChange={setNewCondition}
            placeholder="Ex: envenenado, atordoado..."
          />
          <SmallButton onClick={handleAddCondition} variant="primary" disabled={!newCondition.trim()}>
            <Plus className="w-3 h-3" />
          </SmallButton>
        </div>
      </div>

      {/* Formulário unificado para adicionar */}
      <div className="pt-3 border-t border-slate-800">
        <h3 className="text-[10px] uppercase tracking-widest text-slate-500 mb-2 font-bold">
          Adicionar Resistência / Imunidade / Vulnerabilidade
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
          <Select
            value={newEntry.category}
            onChange={(v) => setNewEntry({ ...newEntry, category: v })}
            options={CATEGORIES.map((c) => ({ value: c.key, label: c.label }))}
          />
          <TextInput
            value={newEntry.tipo}
            onChange={(v) => setNewEntry({ ...newEntry, tipo: v })}
            placeholder="Ex: queimante, veneno..."
          />
          <Select
            value={newEntry.nivel}
            onChange={(v) => setNewEntry({ ...newEntry, nivel: v })}
            options={LEVELS}
          />
          <SmallButton onClick={handleAddDefense} variant="primary" disabled={!newEntry.tipo.trim()}>
            <Plus className="w-3 h-3" /> Adicionar
          </SmallButton>
        </div>
      </div>
    </div>
  );
}
