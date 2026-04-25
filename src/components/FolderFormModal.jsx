// components/FolderFormModal.jsx
// Modal reutilizável para criar OU renomear pastas.
// Mode = 'create' | 'rename' | 'delete'

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { FolderPlus, Edit3, AlertTriangle, X } from "lucide-react";

const MODE_CONFIG = {
  create: {
    icon: FolderPlus,
    title: "Nova Pasta",
    confirmLabel: "Criar",
    confirmClass: "bg-purple-800 hover:bg-purple-700 focus:ring-purple-500",
    iconWrap: "bg-purple-950/60 border-purple-800/60 text-purple-400",
  },
  rename: {
    icon: Edit3,
    title: "Renomear Pasta",
    confirmLabel: "Salvar",
    confirmClass: "bg-purple-800 hover:bg-purple-700 focus:ring-purple-500",
    iconWrap: "bg-purple-950/60 border-purple-800/60 text-purple-400",
  },
  delete: {
    icon: AlertTriangle,
    title: "Apagar Pasta?",
    confirmLabel: "Apagar",
    confirmClass: "bg-red-800 hover:bg-red-700 focus:ring-red-500",
    iconWrap: "bg-red-950/60 border-red-900/60 text-red-400",
  },
};

export default function FolderFormModal({
  mode,              // 'create' | 'rename' | 'delete'
  folder,            // objeto da pasta (em rename/delete)
  creatureCount = 0, // quantas criaturas serão movidas pra raiz em delete
  onSubmit,          // (name) => void para create/rename; () => void para delete
  onCancel,
}) {
  const [name, setName] = useState(folder?.name ?? "");
  const [error, setError] = useState("");
  const inputRef = useRef(null);
  const cfg = MODE_CONFIG[mode] ?? MODE_CONFIG.create;
  const Icon = cfg.icon;

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onCancel();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);

  useEffect(() => {
    if (mode !== "delete") {
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [mode]);

  const handleSubmit = useCallback(() => {
    if (mode === "delete") {
      onSubmit();
      return;
    }
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Nome obrigatório.");
      return;
    }
    if (trimmed.length > 40) {
      setError("Nome muito longo (máx. 40).");
      return;
    }
    onSubmit(trimmed);
  }, [name, mode, onSubmit]);

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="folder-modal-title"
    >
      <div
        className="bg-slate-900 border border-slate-800 rounded-lg p-6 max-w-md w-full shadow-2xl relative z-50"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 mb-5">
          <div className={`w-10 h-10 rounded-full border flex items-center justify-center flex-shrink-0 ${cfg.iconWrap}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 id="folder-modal-title" className="text-lg font-bold text-white mb-1">
              {cfg.title}
            </h3>
            {mode === "delete" && folder && (
              <p className="text-sm text-slate-400 leading-relaxed">
                <span className="text-slate-200 font-semibold">"{folder.name}"</span> será apagada.
                {creatureCount > 0 ? (
                  <> As <span className="text-amber-300 font-semibold">{creatureCount} criatura(s)</span> dentro
                  irão para <span className="text-slate-300">Sem Pasta</span>.</>
                ) : (
                  <> A pasta está vazia.</>
                )}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="text-slate-500 hover:text-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-600 rounded"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {mode !== "delete" && (
          <div className="mb-5">
            <label className="text-[10px] uppercase tracking-wider text-slate-500 mb-1 block">
              Nome da Pasta
            </label>
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="Ex: Campanha do Inverno, Capangas de Hinode..."
              maxLength={40}
              className="w-full h-10 bg-slate-950 border border-slate-700 rounded px-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/40"
            />
            {error && <div className="text-xs text-red-400 mt-1">{error}</div>}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-sm font-semibold text-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className={`px-4 py-2 rounded text-sm font-semibold text-white transition-colors focus:outline-none focus:ring-2 ${cfg.confirmClass}`}
          >
            {cfg.confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}