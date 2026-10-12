import { useState } from "react";
import { ChevronDown, Eye, EyeOff } from "lucide-react";
import { Card } from "./primitivos";
import TextoRico from "./TextoRico";

export default function OlhinhosLuCard({ olhinhos }) {
  const [aberto, setAberto] = useState(false);
  if (!olhinhos?.tem) return null;
  const o = olhinhos;
  return (
    <Card title={o.nome} headerRight={
      <span className="inline-flex items-center gap-1.5 text-[11px] text-purple-200">
        {o.fechados ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
        {o.fechados ? "Olhos fechados" : "Olhos abertos"}
      </span>
    }>
      <div className="grid grid-cols-3 gap-1.5">
        {[["Nível de CL", o.cl], ["Intuição", `+${o.bonusIntuicao}`], ["Atenção", o.atencaoIntuicao ? "Intuição" : "Percepção"]].map(([label, valor]) => (
          <div key={label} className="bg-slate-950/50 border border-slate-800 rounded-lg px-2.5 py-1.5" title={o.texto}>
            <div className="text-[10px] uppercase text-slate-500">{label}</div>
            <div className="font-mono font-bold text-sm text-white">{valor}</div>
          </div>
        ))}
      </div>
      <button type="button" className="flex items-center gap-1.5 mt-2 text-[11px] text-slate-400" aria-expanded={aberto} onClick={() => setAberto((v) => !v)}>
        <ChevronDown className={`w-3.5 h-3.5 ${aberto ? "" : "-rotate-90"}`} />
        {o.nome}
      </button>
      {aberto && <div className="mt-2 text-[11px] text-slate-300"><TextoRico texto={o.texto} /></div>}
    </Card>
  );
}
