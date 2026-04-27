// components/FolderSidebar.jsx
// Sidebar (desktop) ou drawer (mobile) com lista de pastas.
// Props:
//  - view: { type: 'all'|'unfiled'|'folder'|'builtins', folderId? }
//  - onChangeView
//  - folders (do storage)
//  - creatureCounts (dict folderId|null|'builtins' → count)
//  - onCreateFolder, onRenameFolder, onRemoveFolder (callbacks)
//  - compendiumCount (pra badge da pasta "Sistema")
//  - className (pra desktop vs drawer externo)

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Library, Inbox, Folder, FolderPlus, Edit3, Trash2,
  MoreVertical, Archive, BookOpen
} from "lucide-react";
import { useDroppable } from "@dnd-kit/core";
import FolderFormModal from "./FolderFormModal";

// ============================================================
// DICIONÁRIO DE VIEWS FIXAS (regra de ouro #1)
// ============================================================
const FIXED_VIEWS = [
  {
    key: "all",
    type: "all",
    label: "Todas",
    icon: Library,
    accent: "text-slate-300",
    countKey: "all",
  },
  {
    key: "unfiled",
    type: "unfiled",
    label: "Sem Pasta",
    icon: Inbox,
    accent: "text-slate-400",
    countKey: "unfiled",
  },
];

const SYSTEM_VIEW = {
  key: "builtins",
  type: "builtins",
  label: "Criaturas Base",
  icon: BookOpen,
  accent: "text-amber-400",
  countKey: "builtins",
};

// ============================================================
// ITEM "SEM PASTA" COM SUPORTE A DROP
// ============================================================
const DroppableUnfiledItem = ({ isActive, count, onClick }) => {
  const { setNodeRef, isOver } = useDroppable({ id: "view_unfiled" });
  return (
    <li ref={setNodeRef}>
      <button
        type="button"
        onClick={onClick}
        className={`w-full flex items-center gap-2 px-3 py-2 rounded text-sm text-left transition-colors focus:outline-none focus:ring-1 focus:ring-purple-500/60 ${
          isActive
            ? "bg-purple-950/50 border border-purple-800/60 text-purple-100"
            : isOver
            ? "bg-purple-950/30 border border-purple-700/60 text-slate-200 ring-1 ring-purple-500"
            : "text-slate-300 hover:bg-slate-800/60 border border-transparent"
        }`}
      >
        <Inbox className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-purple-400" : isOver ? "text-purple-400" : "text-slate-400"}`} />
        <span className="flex-1 truncate font-semibold">Sem Pasta</span>
        <span className={`text-[10px] tabular-nums ${isActive ? "text-purple-300" : "text-slate-600"}`}>
          {count}
        </span>
      </button>
    </li>
  );
};

// ============================================================
// ITEM DE PASTA (com menu de ações + droppable)
// ============================================================
const FolderItem = ({ folder, isActive, count, onSelect, onRename, onRemove }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
  const btnRef = useRef(null);
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: folder.id });

  useEffect(() => {
    if (!menuOpen) return;
    const close = () => setMenuOpen(false);
    const onKey = (e) => { if (e.key === 'Escape') setMenuOpen(false); };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const handleOpenMenu = (e) => {
    e.stopPropagation();
    const rect = btnRef.current.getBoundingClientRect();
    setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    setMenuOpen((v) => !v);
  };

  return (
    <li
      ref={setDropRef}
      className={`group flex items-center rounded transition-colors ${
        isOver ? "ring-1 ring-purple-500 bg-purple-950/20" : ""
      }`}
    >
      {/* Botão principal de seleção */}
      <button
        type="button"
        onClick={onSelect}
        className={`flex-1 min-w-0 flex items-center gap-2 px-3 py-2 rounded text-sm text-left transition-colors focus:outline-none focus:ring-1 focus:ring-purple-500/60 ${
          isActive
            ? "bg-purple-950/50 border border-purple-800/60 text-purple-100"
            : isOver
            ? "border border-purple-800/40 text-slate-200"
            : "text-slate-300 hover:bg-slate-800/60 border border-transparent"
        }`}
        aria-current={isActive ? "true" : undefined}
      >
        <Folder className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-purple-400" : "text-slate-500"}`} />
        <span className="flex-1 truncate min-w-0">{folder.name}</span>
      </button>

      {/* Slot fixo: número ↔ menu — alternância no hover via group */}
      <div className="flex-shrink-0 flex items-center justify-center w-8 pr-1">
        <span className={`block group-hover:hidden text-[10px] tabular-nums ${
          isActive ? "text-purple-300" : "text-slate-600"
        }`}>
          {count}
        </span>
        <button
          ref={btnRef}
          type="button"
          onClick={handleOpenMenu}
          className="hidden group-hover:flex items-center justify-center w-6 h-6 rounded text-slate-600 hover:text-slate-200 hover:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-500/40"
          aria-label={`Ações da pasta ${folder.name}`}
          aria-expanded={menuOpen}
        >
          <MoreVertical className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Dropdown via portal — escapa do overflow da sidebar */}
      {menuOpen && createPortal(
        <>
          <div className="fixed inset-0 z-[9998]" onMouseDown={() => setMenuOpen(false)} />
          <div
            className="fixed z-[9999] w-36 bg-slate-950 border border-slate-800 rounded shadow-xl overflow-hidden"
            style={{ top: menuPos.top, right: menuPos.right }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onRename(); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-200 hover:bg-slate-900 text-left focus:outline-none focus:bg-slate-900"
            >
              <Edit3 className="w-3 h-3" /> Renomear
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onRemove(); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-950/40 text-left focus:outline-none focus:bg-red-950/40"
            >
              <Trash2 className="w-3 h-3" /> Apagar
            </button>
          </div>
        </>,
        document.body
      )}
    </li>
  );
};

// ============================================================
// MAIN
// ============================================================
export default function FolderSidebar({
  view,
  onChangeView,
  folders,
  creatureCounts,       // { all, unfiled, builtins, [folderId]: n }
  compendiumCount = 0,
  onCreateFolder,
  onRenameFolder,
  onRemoveFolder,
  showSystemView = true, // false para esconder a seção "Criaturas Base"
  className = "",
}) {
  const [modalState, setModalState] = useState(null); // { mode, folder? }

  // Ordem: alfabética por nome
  const sortedFolders = useMemo(
    () => [...folders].sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
    [folders]
  );

  const isActive = useCallback((type, folderId = null) => {
    if (view.type !== type) return false;
    if (type === "folder") return view.folderId === folderId;
    return true;
  }, [view]);

  const handleModalSubmit = useCallback((value) => {
    if (!modalState) return;
    const actions = {
      create: () => onCreateFolder?.(value),
      rename: () => onRenameFolder?.(modalState.folder.id, value),
      delete: () => {
        onRemoveFolder?.(modalState.folder.id);
        // Se a pasta apagada era a view ativa, volta pra "Todas"
        if (view.type === "folder" && view.folderId === modalState.folder.id) {
          onChangeView({ type: "all" });
        }
      },
    };
    actions[modalState.mode]?.();
    setModalState(null);
  }, [modalState, onCreateFolder, onRenameFolder, onRemoveFolder, view, onChangeView]);

  return (
    <aside className={`bg-slate-900/60 border border-slate-800 rounded-lg p-3 ${className}`}>
      {/* Views fixas */}
      <ul className="space-y-1 mb-3">
        {/* "Todas" — não é droppable */}
        <li>
          <button
            type="button"
            onClick={() => onChangeView({ type: "all" })}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded text-sm text-left transition-colors focus:outline-none focus:ring-1 focus:ring-purple-500/60 ${
              isActive("all")
                ? "bg-purple-950/50 border border-purple-800/60 text-purple-100"
                : "text-slate-300 hover:bg-slate-800/60 border border-transparent"
            }`}
          >
            <Library className={`w-4 h-4 flex-shrink-0 ${isActive("all") ? "text-purple-400" : "text-slate-300"}`} />
            <span className="flex-1 truncate font-semibold">Todas</span>
            <span className={`text-[10px] tabular-nums ${isActive("all") ? "text-purple-300" : "text-slate-600"}`}>
              {creatureCounts.all ?? 0}
            </span>
          </button>
        </li>
        {/* "Sem Pasta" — droppable */}
        <DroppableUnfiledItem
          isActive={isActive("unfiled")}
          count={creatureCounts.unfiled ?? 0}
          onClick={() => onChangeView({ type: "unfiled" })}
        />
      </ul>

      {/* Divisor + pastas customizadas */}
      <div className="flex items-center justify-between px-2 mb-2">
        <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Pastas</span>
        <button
          type="button"
          onClick={() => setModalState({ mode: "create" })}
          className="inline-flex items-center gap-1 text-[10px] text-purple-400 hover:text-purple-300 uppercase tracking-wider font-bold focus:outline-none focus:ring-1 focus:ring-purple-500/40 rounded px-1"
          aria-label="Nova pasta"
        >
          <FolderPlus className="w-3 h-3" /> Nova
        </button>
      </div>

      {sortedFolders.length === 0 ? (
        <div className="text-center py-4 px-2 text-[11px] text-slate-600 italic border border-dashed border-slate-800 rounded mb-3">
          Nenhuma pasta criada ainda.
        </div>
      ) : (
        <ul className="space-y-1 mb-3 max-h-96 overflow-y-auto pr-1">
          {sortedFolders.map((f) => (
            <FolderItem
              key={f.id}
              folder={f}
              isActive={isActive("folder", f.id)}
              count={creatureCounts[f.id] ?? 0}
              onSelect={() => onChangeView({ type: "folder", folderId: f.id })}
              onRename={() => setModalState({ mode: "rename", folder: f })}
              onRemove={() => setModalState({ mode: "delete", folder: f })}
            />
          ))}
        </ul>
      )}

      {/* Divisor + pasta do sistema (opcional) */}
      {showSystemView && <div className="pt-3 border-t border-slate-800">
        <button
          type="button"
          onClick={() => onChangeView({ type: "builtins" })}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded text-sm text-left transition-colors focus:outline-none focus:ring-1 focus:ring-amber-500/60 ${
            isActive("builtins")
              ? "bg-amber-950/40 border border-amber-900/60 text-amber-100"
              : "text-slate-300 hover:bg-slate-800/60 border border-transparent"
          }`}
        >
          <SYSTEM_VIEW.icon className={`w-4 h-4 flex-shrink-0 ${
            isActive("builtins") ? "text-amber-400" : SYSTEM_VIEW.accent
          }`} />
          <span className="flex-1 truncate font-semibold">{SYSTEM_VIEW.label}</span>
          <span className={`text-[10px] tabular-nums ${
            isActive("builtins") ? "text-amber-300" : "text-slate-600"
          }`}>
            {compendiumCount}
          </span>
        </button>
      </div>}

      {modalState && (
        <FolderFormModal
          mode={modalState.mode}
          folder={modalState.folder}
          creatureCount={
            modalState.mode === "delete"
              ? (creatureCounts[modalState.folder.id] ?? 0)
              : 0
          }
          onSubmit={handleModalSubmit}
          onCancel={() => setModalState(null)}
        />
      )}
    </aside>
  );
}