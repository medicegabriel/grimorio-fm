import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { RefreshCw, X, CheckSquare, Square } from "lucide-react";

const STATUS_LABELS = {
  planning: "Planejamento",
  active: "Em andamento",
  finished: "Encerrado",
};

const STATUS_COLORS = {
  planning: "text-slate-400",
  active: "text-emerald-400",
  finished: "text-slate-500",
};

export default function EncounterSyncModal({
  creature,
  affectedEncounters,
  onConfirm,
  onSkip,
  onCancel,
}) {
  const [selected, setSelected] = useState(
    () => new Set(affectedEncounters.map((e) => e.id))
  );

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onCancel();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected(
      selected.size === affectedEncounters.length
        ? new Set()
        : new Set(affectedEncounters.map((e) => e.id))
    );
  };

  const handleConfirm = useCallback(() => {
    onConfirm(Array.from(selected));
  }, [selected, onConfirm]);

  const allSelected = selected.size === affectedEncounters.length;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="encounter-sync-title"
    >
      <div
        className="bg-slate-900 border border-slate-800 rounded-lg max-w-lg w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start gap-3 p-5 pb-4 border-b border-slate-800">
          <div className="w-10 h-10 rounded-full border border-purple-800/60 bg-purple-950/60 flex items-center justify-center flex-shrink-0">
            <RefreshCw className="w-5 h-5 text-purple-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 id="encounter-sync-title" className="text-base font-bold text-white">
              Atualizar Encontros?
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
              <span className="text-slate-200 font-medium">"{creature?.name}"</span>
              {" "}está em{" "}
              <span className="text-purple-300 font-semibold">{affectedEncounters.length}</span>
              {" "}encontro(s). Deseja atualizar o snapshot da criatura lá também?
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="text-slate-500 hover:text-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-slate-600 flex-shrink-0"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Lista de encontros */}
        <div className="p-4 space-y-2">
          <button
            type="button"
            onClick={toggleAll}
            className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors"
          >
            {allSelected
              ? <CheckSquare className="w-3.5 h-3.5 text-purple-400" />
              : <Square className="w-3.5 h-3.5" />
            }
            {allSelected ? "Desmarcar todos" : "Selecionar todos"}
          </button>

          <div className="space-y-1 overflow-y-auto max-h-52">
            {affectedEncounters.map((enc) => {
              const count = enc.combatants?.filter((c) => c.creatureId === creature?.id).length ?? 0;
              const isChecked = selected.has(enc.id);
              return (
                <label
                  key={enc.id}
                  className={`flex items-center gap-3 p-2.5 rounded cursor-pointer transition-colors ${
                    isChecked
                      ? "bg-purple-900/30 border border-purple-800/50"
                      : "bg-slate-800/40 border border-transparent hover:bg-slate-800/60"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggle(enc.id)}
                    className="sr-only"
                  />
                  {isChecked
                    ? <CheckSquare className="w-4 h-4 text-purple-400 flex-shrink-0" />
                    : <Square className="w-4 h-4 text-slate-600 flex-shrink-0" />
                  }
                  <span className="flex-1 text-sm text-white truncate min-w-0">
                    {enc.name || "Encontro sem nome"}
                  </span>
                  <span className={`text-[10px] flex-shrink-0 ${STATUS_COLORS[enc.status] ?? "text-slate-500"}`}>
                    {STATUS_LABELS[enc.status] ?? enc.status}
                  </span>
                  {count > 1 && (
                    <span className="text-[10px] text-slate-500 flex-shrink-0 ml-1">{count}×</span>
                  )}
                </label>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 p-4 pt-0">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-sm font-semibold text-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onSkip}
            className="px-4 py-2 rounded bg-slate-700 hover:bg-slate-600 text-sm font-semibold text-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500"
          >
            Salvar Sem Atualizar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={selected.size === 0}
            className={`px-4 py-2 rounded text-sm font-semibold text-white transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 ${
              selected.size === 0
                ? "bg-slate-700 text-slate-500 cursor-not-allowed"
                : "bg-purple-700 hover:bg-purple-600"
            }`}
          >
            Salvar e Atualizar ({selected.size})
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
