import React from "react";
import { Search, X } from "lucide-react";
import { FILTROS_HABILIDADE } from "../afty-filtro-habilidades";

export default function FiltroDeHabilidades({ efeito, onEfeito, termo, onTermo, total, visiveis, variante = "ficha", rotulo = "Filtrar habilidades" }) {
  const criador = variante === "criador";
  const limpar = () => { onEfeito("todos"); onTermo(""); };
  return (
    <div className="space-y-2 mb-3" role="group" aria-label={rotulo}>
      <div className="flex flex-wrap gap-1" role="group" aria-label="Efeito da habilidade">
        {[{ id: "todos", label: "Todos" }, ...FILTROS_HABILIDADE].map((f) => (
          <button key={f.id} type="button" aria-pressed={efeito === f.id} onClick={() => onEfeito(f.id)}
            title={f.id === "todos" ? "Todos os efeitos" : `Habilidades relacionadas a ${f.label.toLowerCase()}`}
            className={criador
              ? `px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${efeito === f.id ? "bg-purple-700 text-white" : "bg-slate-900 text-slate-400 hover:text-white"}`
              : "afty-botao"}
            data-afty-tom={!criador && efeito === f.id ? "destaque" : undefined}>
            {f.label}
          </button>
        ))}
      </div>
      <div className={`flex items-center gap-2 p-2 ${criador ? "border border-slate-800 bg-slate-950/50 rounded-md text-slate-400" : "afty-linha"}`}>
        <Search className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
        <input type="text" value={termo} onChange={(e) => onTermo(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Escape") limpar(); }}
          placeholder="Buscar" aria-label={`${rotulo} por texto`}
          className={`flex-1 min-w-0 bg-transparent outline-none ${criador ? "text-xs text-slate-200" : "afty-campo"}`} />
        <span className={`text-[11px] tabular-nums flex-shrink-0 ${criador ? "text-slate-400" : "afty-rotulo"}`} aria-label="Resultados do filtro">
          {visiveis} / {total}
        </span>
        {(efeito !== "todos" || termo) && <button type="button" onClick={limpar} aria-label="Limpar filtros"
          className={criador ? "p-1 rounded text-slate-400 hover:text-white" : "afty-passo"}>
          <X className="w-3.5 h-3.5" aria-hidden="true" />
        </button>}
      </div>
    </div>
  );
}
