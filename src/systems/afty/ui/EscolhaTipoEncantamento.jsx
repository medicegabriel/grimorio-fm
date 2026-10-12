import { Plus, X } from "lucide-react";
import { Select } from "../../../components/builder-controls";
import { escolhasDeTiposEncantamento, tiposDoEncantamento } from "../afty-equipamentos";

/** A escolha pertence ao item, e cada repetição do Isolante ocupa uma vaga. */
export default function EscolhaTipoEncantamento({ enc, tipos, onChange }) {
  const escolhas = escolhasDeTiposEncantamento(enc.id, tipos);
  const opcoes = tiposDoEncantamento(enc.id);
  return (
    <div className="space-y-1.5">
      {escolhas.map((tipo, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <Select
            value={tipo ?? ""}
            onChange={(v) => onChange(escolhas.map((t, j) => j === i ? v || null : t))}
            options={opcoes.filter((t) => t.id === tipo || !escolhas.includes(t.id))
              .map((t) => ({ value: t.id, label: t.label }))}
            placeholder="Tipo de Dano"
            aria-label={enc.repetivel ? `Tipo de dano ${i + 1} de ${enc.nome}` : `Tipo de dano de ${enc.nome}`}
          />
          {enc.repetivel && escolhas.length > 1 && (
            <button
              type="button"
              onClick={() => onChange(escolhas.filter((_, j) => j !== i))}
              title="Remover tipo de dano"
              aria-label={`Remover tipo ${i + 1} de ${enc.nome}`}
              className="p-1.5 text-slate-500 hover:text-rose-400"
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          )}
        </div>
      ))}
      {enc.repetivel && (
        <button
          type="button"
          onClick={() => onChange([...escolhas, null])}
          disabled={escolhas.some((t) => !t) || escolhas.length >= opcoes.length}
          title="Cada tipo adicional ocupa uma vaga de encantamento"
          className="flex items-center gap-1 text-[10px] text-purple-300 enabled:hover:text-purple-200 disabled:opacity-40"
        >
          <Plus className="w-3 h-3" aria-hidden="true" />
          Adicionar tipo
        </button>
      )}
    </div>
  );
}
