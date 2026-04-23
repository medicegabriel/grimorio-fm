import React from "react";
import { FieldLabel, NumberInput } from "../builder-controls";

const APTIDAO_LIST = [
  { key: "ea",  label: "Energia Amaldiçoada", short: "EA",  accent: "bg-purple-900/30 border-purple-800" },
  { key: "cl",  label: "Controle e Leitura",  short: "CL",  accent: "bg-sky-900/30 border-sky-800" },
  { key: "bar", label: "Barreira",            short: "BAR", accent: "bg-amber-900/30 border-amber-800" },
  { key: "dom", label: "Domínio",             short: "DOM", accent: "bg-rose-900/30 border-rose-800" },
  { key: "er",  label: "Energia Reversa",     short: "ER",  accent: "bg-emerald-900/30 border-emerald-800" },
];

export default function SectionAptidoes({ draft, actions }) {
  return (
    <div className="space-y-3">
      <p className="text-[10px] text-slate-500">
        Conforme o PDF: 1 Aptidão a cada 2 NDs. Níveis variam de 0 a 10.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
        {APTIDAO_LIST.map(({ key, label, short, accent }) => (
          <div key={key} className={`border rounded p-2.5 ${accent}`}>
            <FieldLabel>
              {short}
              <span className="text-slate-500 ml-1 font-normal">{label}</span>
            </FieldLabel>
            <NumberInput
              value={draft.aptidoes[key]}
              onChange={(v) => actions.setAptidao(key, v)}
              min={0}
              max={10}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
