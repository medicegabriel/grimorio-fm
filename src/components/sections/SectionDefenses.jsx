import React, { useState } from "react";
import { Plus, Shield, ShieldOff, ShieldAlert, AlertTriangle, BookOpen } from "lucide-react";
import { TextInput, Select, SmallButton, Pill } from "../builder-controls";
import { CONDITIONS } from "../fm-tables";

const CATEGORIES = [
  { key: "resistencias",     label: "Resistências",     icon: Shield,      color: "sky",     accent: "text-sky-400" },
  { key: "imunidades",       label: "Imunidades",       icon: ShieldAlert, color: "emerald", accent: "text-emerald-400" },
  { key: "vulnerabilidades", label: "Vulnerabilidades", icon: ShieldOff,   color: "rose",    accent: "text-rose-400" },
];

const DEFENSE_LIMITS = {
  lacaio:     { imunidades: 0, resistencias: 0, vulnerabilidades: 0 },
  capanga:    { imunidades: 0, resistencias: 0, vulnerabilidades: 0 },
  comum:      { imunidades: 1, resistencias: 2, vulnerabilidades: 1 },
  desafio:    { imunidades: 3, resistencias: 3, vulnerabilidades: 3 },
  calamidade: { imunidades: 6, resistencias: 4, vulnerabilidades: 6 },
};

const CONDITION_TOTAL_LIMITS = {
  lacaio: 0, capanga: 0, comum: 5, desafio: 6, calamidade: 7,
};

const CONDITION_SEVERITY_MAP = Object.fromEntries(
  Object.entries(CONDITIONS).flatMap(([severity, list]) =>
    list.map((c) => [c, severity])
  )
);

const CONDITION_GROUPS = [
  { key: "fracas",   label: "Fracas",   accent: "text-slate-400" },
  { key: "medias",   label: "Médias",   accent: "text-amber-400" },
  { key: "fortes",   label: "Fortes",   accent: "text-orange-400" },
  { key: "extremas", label: "Extremas", accent: "text-red-400" },
];

const DAMAGE_GROUPS = [
  {
    key: "fisicos",
    label: "Físicos",
    accent: "text-slate-300",
    types: ["cortante", "perfurante", "impacto"],
  },
  {
    key: "elementais",
    label: "Elementais",
    accent: "text-orange-400",
    types: ["ácido", "congelante", "chocante", "queimante", "sônico"],
  },
  {
    key: "etereos",
    label: "Etéreos",
    accent: "text-purple-400",
    types: ["dano na alma", "energia reversa", "energético", "psíquico", "radiante"],
  },
  {
    key: "biologicos",
    label: "Biológicos",
    accent: "text-green-400",
    types: ["necrótico", "venenoso"],
  },
];

export default function SectionDefenses({ draft, actions }) {
  const [newEntry, setNewEntry] = useState({ category: "resistencias", tipo: "" });
  const [newCondition, setNewCondition] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showDamageSuggestions, setShowDamageSuggestions] = useState(false);

  const handleAddDefense = () => {
    if (!newEntry.tipo.trim()) return;
    actions.addDefense(newEntry.category, { tipo: newEntry.tipo.trim().toLowerCase() });
    setNewEntry({ ...newEntry, tipo: "" });
  };

  const handleAddCondition = () => {
    if (!newCondition.trim()) return;
    actions.addDefense("condicoesImunes", newCondition.trim().toLowerCase());
    setNewCondition("");
  };

  const addedConditions = new Set(draft.defenses.condicoesImunes);
  const suggestionsLeft = Object.values(CONDITIONS).flat().filter((c) => !addedConditions.has(c)).length;

  const patamar = draft.core.patamar ?? "comum";
  const limits = DEFENSE_LIMITS[patamar] ?? DEFENSE_LIMITS.comum;

  const counts = {
    imunidades:       draft.defenses.imunidades.length,
    resistencias:     draft.defenses.resistencias.length,
    vulnerabilidades: draft.defenses.vulnerabilidades.length,
  };

  const overLimit = CATEGORIES.filter(({ key }) => counts[key] > limits[key]);
  const missingVulnerabilidades = counts.imunidades > counts.vulnerabilidades;

  const condTotalLimit = CONDITION_TOTAL_LIMITS[patamar] ?? 5;
  const condCount = draft.defenses.condicoesImunes.length;
  const condExceeded = condCount > condTotalLimit;
  const extremaCount = draft.defenses.condicoesImunes.filter((c) => CONDITION_SEVERITY_MAP[c] === "extremas").length;
  const forteCount   = draft.defenses.condicoesImunes.filter((c) => CONDITION_SEVERITY_MAP[c] === "fortes").length;
  const extremaExceeded = extremaCount > 1;
  const forteExceeded   = forteCount > 2;

  return (
    <div className="space-y-4">
      {/* Listas por categoria */}
      {CATEGORIES.map(({ key, label, icon: Icon, color, accent }) => {
        const count = counts[key];
        const limit = limits[key];
        const exceeded = count > limit;
        return (
          <div key={key}>
            <h3 className={`text-[10px] uppercase tracking-widest font-bold mb-2 flex items-center gap-1.5 ${accent}`}>
              <Icon className="w-3 h-3" /> {label}
              <span className={`ml-auto font-mono tabular-nums ${exceeded ? "text-red-400" : "text-slate-400"}`}>
                ({count}/{limit})
              </span>
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {draft.defenses[key].length === 0 && (
                <span className="text-xs text-slate-600 italic">Nenhuma</span>
              )}
              {draft.defenses[key].map((item, i) => (
                <Pill key={`${key}-${i}`} color={color} onRemove={() => actions.removeDefense(key, i)}>
                  {item.tipo}{item.nivel ? <span className="opacity-60"> ({item.nivel})</span> : null}
                </Pill>
              ))}
            </div>
          </div>
        );
      })}

      {/* Condições imunes */}
      <div>
        <h3 className="text-[10px] uppercase tracking-widest text-amber-400 font-bold mb-1.5 flex items-center gap-1.5">
          <AlertTriangle className="w-3 h-3" /> Imunidade a Condições
          <span className={`ml-auto font-mono tabular-nums ${condExceeded ? "text-red-500" : "text-slate-400"}`}>
            ({condCount}/{condTotalLimit})
          </span>
        </h3>
        <div className="flex gap-3 mb-2 text-[10px] font-mono">
          <span className={extremaExceeded ? "text-red-400" : "text-slate-400"}>
            Extrema: ({extremaCount}/1)
          </span>
          <span className={forteExceeded ? "text-red-400" : "text-slate-400"}>
            Forte: ({forteCount}/2)
          </span>
        </div>
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
        {(condExceeded || extremaExceeded || forteExceeded) && (
          <div className="space-y-1.5 mt-2">
            {condExceeded && (
              <div className="flex items-start gap-2 px-3 py-2 rounded border bg-amber-950/30 border-amber-700 text-amber-300 text-xs">
                <span className="flex-shrink-0">⚠️</span>
                <span><b>Limite excedido:</b> O Patamar <b>{patamar.charAt(0).toUpperCase() + patamar.slice(1)}</b> permite no máximo <b>{condTotalLimit}</b> imunidades a condições.</span>
              </div>
            )}
            {extremaExceeded && (
              <div className="flex items-start gap-2 px-3 py-2 rounded border bg-amber-950/30 border-amber-700 text-amber-300 text-xs">
                <span className="flex-shrink-0">⚠️</span>
                <span><b>Limite excedido:</b> Máximo de <b>1</b> condição Extrema permitida ({extremaCount} selecionadas).</span>
              </div>
            )}
            {forteExceeded && (
              <div className="flex items-start gap-2 px-3 py-2 rounded border bg-amber-950/30 border-amber-700 text-amber-300 text-xs">
                <span className="flex-shrink-0">⚠️</span>
                <span><b>Limite excedido:</b> Máximo de <b>2</b> condições Fortes permitidas ({forteCount} selecionadas).</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Alertas de soft cap */}
      {(overLimit.length > 0 || missingVulnerabilidades) && (
        <div className="space-y-2">
          {overLimit.map(({ key, label }) => (
            <div key={key} className="flex items-start gap-2 px-3 py-2.5 rounded border bg-amber-950/30 border-amber-700 text-amber-300 text-xs">
              <span className="flex-shrink-0">⚠️</span>
              <span>
                <b>Limite excedido:</b> O Patamar <b>{patamar.charAt(0).toUpperCase() + patamar.slice(1)}</b> permite apenas <b>{limits[key]}</b> {label.toLowerCase()}.
              </span>
            </div>
          ))}
          {missingVulnerabilidades && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded border bg-red-950/40 border-red-600 text-red-300 text-xs">
              <span className="flex-shrink-0">⚠️</span>
              <span>
                <b>Troca Equivalente:</b> Para cada Imunidade, a criatura deve possuir pelo menos uma Vulnerabilidade condizente.{" "}
                <span className="text-red-400 font-semibold">({counts.imunidades} imunidade(s) — {counts.vulnerabilidades} vulnerabilidade(s))</span>
              </span>
            </div>
          )}
        </div>
      )}

      {/* Formulário de dano */}
      <div className="pt-3 border-t border-slate-800">
        <h3 className="text-[10px] uppercase tracking-widest text-slate-500 mb-2 font-bold">
          Adicionar Resistência / Imunidade / Vulnerabilidade a Dano
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
              placeholder="Ex: cortante, queimante..."
            />
          </div>
          <div className="flex-shrink-0">
            <SmallButton onClick={handleAddDefense} variant="primary" disabled={!newEntry.tipo.trim()}>
              <Plus className="w-3 h-3" /> Adicionar
            </SmallButton>
          </div>
          <div className="flex-shrink-0">
            <SmallButton onClick={() => setShowDamageSuggestions((v) => !v)}>
              <BookOpen className="w-3 h-3" />
              {showDamageSuggestions ? "Ocultar" : "Mostrar"} sugestões
            </SmallButton>
          </div>
        </div>

        {/* Painel de sugestões por grupo */}
        {showDamageSuggestions && (
          <div className="border border-slate-800 rounded-lg p-4 bg-slate-900/30 mt-3 space-y-3">
            {DAMAGE_GROUPS.map(({ key, label, accent, types }) => (
              <div key={key}>
                <h4 className={`text-[10px] uppercase tracking-widest font-bold mb-1.5 ${accent}`}>
                  {label}
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {types.map((tipo) => (
                    <button
                      key={tipo}
                      type="button"
                      onClick={() => setNewEntry((prev) => ({ ...prev, tipo }))}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs border transition-colors capitalize focus:outline-none focus:ring-1 focus:ring-purple-500/40 ${
                        newEntry.tipo === tipo
                          ? "bg-purple-900/60 border-purple-700 text-purple-200"
                          : "bg-slate-900 hover:bg-purple-900/20 border-slate-800 hover:border-purple-700 text-slate-300 hover:text-white"
                      }`}
                    >
                      {newEntry.tipo !== tipo && <Plus className="w-2.5 h-2.5" />}
                      {tipo}
                    </button>
                  ))}
                </div>
              </div>
            ))}

          </div>
        )}
      </div>
    </div>
  );
}
