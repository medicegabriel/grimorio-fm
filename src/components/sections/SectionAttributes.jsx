import React from "react";
import { FieldLabel, NumberInput } from "../builder-controls";
import { getModifier } from "../fm-tables";

const ATTRIBUTES = [
  { key: "forca",         label: "Força",        short: "FOR" },
  { key: "destreza",      label: "Destreza",     short: "DES" },
  { key: "constituicao",  label: "Constituição", short: "CON" },
  { key: "inteligencia",  label: "Inteligência", short: "INT" },
  { key: "sabedoria",     label: "Sabedoria",    short: "SAB" },
  { key: "presenca",      label: "Presença",     short: "PRE" },
];

export default function SectionAttributes({ draft, derived, actions }) {
  const { attrBudget } = derived;
  const budgetStatus =
    attrBudget.remaining < 0 ? "over" :
    attrBudget.remaining === 0 ? "exact" : "under";

  // Cores do orçamento via dicionário
  const budgetColors = {
    over:  "text-red-400 bg-red-950/30 border-red-900",
    exact: "text-emerald-400 bg-emerald-950/30 border-emerald-900",
    under: "text-amber-400 bg-amber-950/30 border-amber-900",
  };

  return (
    <div className="space-y-4">
      {/* Orçamento visual */}
      <div className={`flex items-center justify-between px-3 py-2 rounded border text-xs font-semibold ${budgetColors[budgetStatus]}`}>
        <span>Pontos gastos: {attrBudget.spent} / {attrBudget.total}</span>
        <span className="tabular-nums">
          {attrBudget.remaining >= 0 ? `${attrBudget.remaining} restante(s)` : `${Math.abs(attrBudget.remaining)} a mais`}
        </span>
      </div>

      <div className="text-[10px] text-slate-500">
        Atributos começam em 10 (ou 8, para liberar pontos). Limite por atributo: <b>{attrBudget.limit}</b>.
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {ATTRIBUTES.map(({ key, label, short }) => {
          const value = draft.attributes[key];
          const mod = getModifier(value);
          const modStr = mod >= 0 ? `+${mod}` : `${mod}`;
          const isOverLimit = value > attrBudget.limit;

          return (
            <div key={key} className={`bg-slate-950/60 border rounded p-3 ${
              isOverLimit ? "border-red-700" : "border-slate-800"
            }`}>
              <div className="flex items-center justify-between mb-1">
                <FieldLabel>
                  {short}
                  <span className="text-slate-600 ml-1 font-normal">{label}</span>
                </FieldLabel>
                <span className={`text-sm font-mono tabular-nums ${
                  isOverLimit ? "text-red-400 font-bold" :
                  mod > 0 ? "text-emerald-400" : mod < 0 ? "text-red-400" : "text-slate-500"
                }`}>
                  {modStr}
                </span>
              </div>
              <NumberInput
                value={value}
                onChange={(v) => actions.setAttribute(key, v)}
                min={8}
                max={99}
              />
            </div>
          );
        })}
      </div>

      {attrBudget.remaining < 0 && (
        <div className="flex items-start gap-2 px-3 py-2.5 rounded border bg-amber-950/30 border-amber-700 text-amber-300 text-xs">
          <span className="text-base leading-none flex-shrink-0">⚠️</span>
          <span>
            Os atributos distribuídos ultrapassam o limite padrão para o Grau e Nível desta criatura.
            {Object.entries(draft.attributes).some(([k, v]) => v > attrBudget.limit) && (
              <span className="block mt-0.5 text-red-300">
                Um ou mais atributos excedem o limite individual de <b>{attrBudget.limit}</b>.
              </span>
            )}
          </span>
        </div>
      )}
      {attrBudget.remaining >= 0 &&
        Object.entries(draft.attributes).some(([k, v]) => v > attrBudget.limit) && (
        <div className="flex items-start gap-2 px-3 py-2.5 rounded border bg-red-950/30 border-red-700 text-red-300 text-xs">
          <span className="text-base leading-none flex-shrink-0">⚠️</span>
          <span>
            Um ou mais atributos excedem o limite individual de <b>{attrBudget.limit}</b> para este Grau/ND.
          </span>
        </div>
      )}
    </div>
  );
}
