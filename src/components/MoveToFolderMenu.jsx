// components/MoveToFolderMenu.jsx
// Submenu de "Mover para...". Pode ser usado tanto no cartão individual
// (dentro do ActionMenu) quanto na barra de ações em lote.

import { useMemo } from "react";
import { Folder, Inbox, Check } from "lucide-react";

export default function MoveToFolderMenu({
  folders,
  currentFolderId = null,  // null = raiz; ignorado em bulk (todos diferentes)
  onMove,                  // (folderId|null) => void
  isBulk = false           // true = ação em lote (não mostra "atual")
}) {
  const sorted = useMemo(
    () => [...folders].sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
    [folders]
  );

  const items = [
    {
      key: "__unfiled__",
      label: "Sem Pasta (raiz)",
      icon: Inbox,
      folderId: null,
      isCurrent: !isBulk && currentFolderId == null,
    },
    ...sorted.map((f) => ({
      key: f.id,
      label: f.name,
      icon: Folder,
      folderId: f.id,
      isCurrent: !isBulk && currentFolderId === f.id,
    })),
  ];

  return (
    <div className="bg-slate-950 border border-slate-800 rounded shadow-xl overflow-hidden max-h-64 overflow-y-auto">
      <div className="px-3 py-1.5 text-[10px] uppercase tracking-widest text-slate-500 font-bold border-b border-slate-800">
        Mover para...
      </div>
      {items.length === 1 && (
        <div className="px-3 py-3 text-xs text-slate-600 italic">
          Crie uma pasta primeiro.
        </div>
      )}
      <ul role="menu">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <li key={it.key}>
              <button
                type="button"
                onClick={() => onMove(it.folderId)}
                disabled={it.isCurrent}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors focus:outline-none focus:bg-slate-900 ${
                  it.isCurrent
                    ? "bg-purple-950/30 text-purple-300 cursor-default"
                    : "text-slate-200 hover:bg-slate-900"
                }`}
                role="menuitem"
              >
                <Icon className="w-3.5 h-3.5 flex-shrink-0 text-slate-500" />
                <span className="flex-1 truncate">{it.label}</span>
                {it.isCurrent && <Check className="w-3 h-3 text-purple-400" />}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}