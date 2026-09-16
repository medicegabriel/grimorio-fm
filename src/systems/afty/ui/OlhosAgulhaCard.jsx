import { AlertTriangle } from "lucide-react";
import { Card } from "./primitivos";
import {
  AGULHA_OLHOS, AGULHA_TEXTO, AGULHA_HABILIDADES_TEXTO, AGULHA_VOTO, modeloPassivaAgulha,
} from "../afty-olhos-agulha";

export default function OlhosAgulhaCard({ derived, patchCore, addFeitico, updateFeitico, removeFeitico }) {
  const v = derived.olhosAgulha;
  if (!v?.tem) return null;
  const escolher = (h, nivel) => {
    if (!nivel) return removeFeitico(h.id);
    const modelo = modeloPassivaAgulha(h.id, nivel);
    return h.nivel ? updateFeitico(modelo) : addFeitico(modelo);
  };
  return (
    <Card title="Olhos de Agulha">
      <div className="space-y-3">
        <label className="flex items-center justify-between gap-2 text-sm text-slate-300">
          Olhos restantes
          <select aria-label="Olhos restantes" value={v.olhos} onChange={(e) => patchCore({ [AGULHA_OLHOS]: Number(e.target.value) })} className="bg-slate-950 border border-slate-700 rounded px-2 py-1">
            {[2, 1, 0].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <div className="flex flex-wrap gap-3 text-sm text-slate-200">
          <span title="Metade do seu Bônus de Treinamento em Rolagens de Percepção.">Percepção +{v.pericia}</span>
          {v.imuneCego && <span title="Se torna imune às condições: Cego.(A menos que seja por ferimento complexo)">Imune a Cego</span>}
          {v.visaoCega > 0 && <span title="Olhos que Tudo Veem">Visão às cegas {v.visaoCega}m</span>}
        </div>
        <div className="space-y-2" title={AGULHA_HABILIDADES_TEXTO}>
          {v.habilidades.map((h) => (
            <div key={h.id} className="space-y-1">
              <label className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-300">
                <span title={Object.values(h.textos).join("\n\n")}>{h.nome}</span>
                <select aria-label={h.nome} value={h.nivel} onChange={(e) => escolher(h, Number(e.target.value))} className="bg-slate-950 border border-slate-700 rounded px-2 py-1">
                  <option value={0}>Não escolhida</option>
                  {h.niveis.map((n) => <option key={n} value={n} disabled={n > v.nivelMax}>Nível {n} · −{n * 2} PE máx.</option>)}
                </select>
              </label>
              {h.nivel > v.nivelMax && <p className="text-amber-400 text-xs flex gap-1"><AlertTriangle size={14} />Requer liberação de Feitiço de nível {h.nivel}</p>}
            </div>
          ))}
        </div>
        {v.olhos === 0 && <p className="text-amber-400 text-xs flex gap-1"><AlertTriangle size={14} />Sem benefícios oculares</p>}
        <span className="block text-xs text-slate-400" title={AGULHA_TEXTO}>{AGULHA_VOTO}</span>
      </div>
    </Card>
  );
}
