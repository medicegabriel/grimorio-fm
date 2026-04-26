// Dashboard.jsx
import { useState, useMemo, useRef, useCallback } from "react";
import {
  Search, Plus, Upload, Download, Trash2, Copy, Edit3, Play,
  X, AlertTriangle, FileJson, Check, MoreVertical, Users,
  FolderInput, Swords, Menu, Filter, Lock
} from "lucide-react";

import FolderSidebar from "./FolderSidebar";
import MoveToFolderMenu from "./MoveToFolderMenu";
import { exportCreaturesToFile, importFromFile } from "./io-utils";

// ============================================================
// DICIONÁRIOS DE ESTILO (mesmo do seu original, mantenha o seu)
// ============================================================
const PATAMAR_STYLES = {
  lacaio:     { label: "Lacaio",     badge: "bg-slate-800 text-slate-300 border-slate-700",      accent: "border-l-slate-600" },
  capanga:    { label: "Capanga",    badge: "bg-zinc-800 text-zinc-200 border-zinc-700",          accent: "border-l-zinc-500" },
  comum:      { label: "Comum",      badge: "bg-sky-950 text-sky-300 border-sky-800",             accent: "border-l-sky-600" },
  desafio:    { label: "Desafio",    badge: "bg-amber-950 text-amber-300 border-amber-800",       accent: "border-l-amber-600" },
  calamidade: { label: "Calamidade", badge: "bg-red-950 text-red-300 border-red-800",             accent: "border-l-red-600" },
};

// Dicionário pra títulos dinâmicos do header
const VIEW_TITLE = {
  all: () => "Todas as Criaturas",
  unfiled: () => "Sem Pasta",
  builtins: () => "Criaturas Base do Sistema",
  folder: (folder) => folder?.name ?? "Pasta",
};

// Dicionário de filtros (regra de ouro #1)
const VIEW_FILTERS = {
  all:      (c) => !c.isBuiltIn,
  unfiled:  (c) => !c.isBuiltIn && (c.folderId == null),
  folder:   (c, ctx) => !c.isBuiltIn && c.folderId === ctx.folderId,
  builtins: (c) => !!c.isBuiltIn,
};

// ============================================================
// CARTÃO DE CRIATURA (com menu + Move To)
// ============================================================
const CreatureCard = ({
  creature, selected, viewType, folders,
  onToggleSelect, onOpen, onEdit, onDuplicate, onExport, onDelete, onMove
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const patamarStyle = PATAMAR_STYLES[creature.core?.patamar] ?? PATAMAR_STYLES.comum;
  const isBuiltIn = !!creature.isBuiltIn;

  const handleCardClick = useCallback(() => {
    if (menuOpen || moveOpen) return;
    onOpen(creature.id);
  }, [menuOpen, moveOpen, onOpen, creature.id]);

  // Built-ins não mostram checkbox de seleção (evita confusão em bulk)
  const showSelect = !isBuiltIn;

  return (
    <article
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), handleCardClick())}
      className={`relative bg-slate-900/60 border-l-4 ${patamarStyle.accent} border-r border-y border-slate-800 rounded-lg p-3 transition-all cursor-pointer group focus:outline-none focus:ring-2 focus:ring-purple-500/60 ${
        selected ? "ring-2 ring-purple-500/60 bg-purple-950/20" : "hover:border-slate-700"
      } ${isBuiltIn ? "opacity-95" : ""}`}
    >
      {/* ── LINHA SUPERIOR: título (esquerda) + checkbox + ⋮ (direita) ── */}
      <div className="flex justify-between items-center w-full mb-1.5">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <h3 className="text-sm font-bold text-white truncate">{creature.name}</h3>
          {isBuiltIn && (
            <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-wider text-amber-300 bg-amber-950/60 border border-amber-900/60 px-1.5 py-0.5 rounded font-bold flex-shrink-0">
              <Lock className="w-2.5 h-2.5" /> Base
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {showSelect && (
            <div
              className={`transition-opacity duration-150 ${selected ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus-within:opacity-100"}`}
              onClick={(e) => e.stopPropagation()}
            >
              <input
                type="checkbox"
                checked={selected}
                onChange={(e) => { e.stopPropagation(); onToggleSelect(creature.id); }}
                className="w-4 h-4 accent-purple-600 cursor-pointer rounded m-0 translate-y-px"
                aria-label={`Selecionar ${creature.name}`}
              />
            </div>
          )}

          {/* Menu de 3 pontos */}
          <div className="relative">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); setMoveOpen(false); }}
              className="w-7 h-7 flex items-center justify-center rounded text-slate-500 hover:text-slate-200 hover:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-500/40"
              aria-label="Menu de ações"
              aria-expanded={menuOpen}
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setMenuOpen(false); setMoveOpen(false); }} />
                <div className="absolute right-0 top-full mt-1 w-44 bg-slate-950 border border-slate-800 rounded shadow-xl z-20">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onEdit(creature.id); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-200 hover:bg-slate-900 text-left"
                  >
                    <Edit3 className="w-3 h-3" /> {isBuiltIn ? "Clonar e Editar" : "Editar"}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDuplicate(creature); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-200 hover:bg-slate-900 text-left"
                  >
                    <Copy className="w-3 h-3" /> Duplicar
                  </button>
                  {!isBuiltIn && (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setMoveOpen(!moveOpen); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-200 hover:bg-slate-900 text-left"
                        aria-expanded={moveOpen}
                      >
                        <FolderInput className="w-3 h-3" /> Mover para...
                      </button>
                      {moveOpen && (
                        <div className="absolute right-full top-0 mr-1 w-48 z-30">
                          <MoveToFolderMenu
                            folders={folders}
                            currentFolderId={creature.folderId}
                            onMove={(folderId) => {
                              onMove(creature.id, folderId);
                              setMenuOpen(false);
                              setMoveOpen(false);
                            }}
                          />
                        </div>
                      )}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onExport(creature); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-200 hover:bg-slate-900 text-left"
                  >
                    <Download className="w-3 h-3" /> Exportar JSON
                  </button>
                  {!isBuiltIn && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDelete(creature); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-950/40 text-left border-t border-slate-800"
                    >
                      <Trash2 className="w-3 h-3" /> Excluir
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── LINHA INFERIOR: tags patamar + ND ── */}
      <div className="flex items-center gap-1.5 flex-wrap mb-2">
        <span className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded border ${patamarStyle.badge}`}>
          {patamarStyle.label}
        </span>
        <span className="text-[10px] text-slate-500 tabular-nums">ND {creature.core?.nd}</span>
      </div>

      {/* Stats resumidas */}
      <div className="flex items-center gap-3 text-[10px] text-slate-500 tabular-nums pt-2 border-t border-slate-800">
        <span>HP {creature.stats?.hpMax ?? 0}</span>
        <span>PE {creature.stats?.peMax ?? 0}</span>
        <span>Def {creature.stats?.defesa ?? 0}</span>
      </div>
    </article>
  );
};

// ============================================================
// BARRA DE AÇÕES EM LOTE
// ============================================================
const BulkActionBar = ({ count, folders, onExport, onDelete, onMove, onClear }) => {
  const [moveOpen, setMoveOpen] = useState(false);
  if (count === 0) return null;

  return (
    <div className="sticky top-16 z-30 bg-purple-950/80 backdrop-blur border border-purple-800 rounded-lg px-4 py-2 flex items-center gap-3 flex-wrap mb-4 shadow-lg">
      <span className="text-sm font-semibold text-purple-100">
        {count} selecionada(s)
      </span>
      <div className="flex items-center gap-2 ml-auto flex-wrap">
        <div className="relative">
          <button
            type="button"
            onClick={() => setMoveOpen(!moveOpen)}
            className="inline-flex items-center gap-1 px-3 py-1 rounded bg-slate-900/80 hover:bg-slate-800 text-xs font-semibold text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/60"
          >
            <FolderInput className="w-3 h-3" /> Mover
          </button>
          {moveOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMoveOpen(false)} />
              <div className="absolute right-0 top-full mt-1 w-48 z-20">
                <MoveToFolderMenu
                  folders={folders}
                  isBulk
                  onMove={(folderId) => { onMove(folderId); setMoveOpen(false); }}
                />
              </div>
            </>
          )}
        </div>
        <button
          type="button"
          onClick={onExport}
          className="inline-flex items-center gap-1 px-3 py-1 rounded bg-slate-900/80 hover:bg-slate-800 text-xs font-semibold text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/60"
        >
          <Download className="w-3 h-3" /> Exportar
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="inline-flex items-center gap-1 px-3 py-1 rounded bg-red-900/60 hover:bg-red-800 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <Trash2 className="w-3 h-3" /> Excluir
        </button>
        <button
          type="button"
          onClick={onClear}
          className="text-xs text-purple-300 hover:text-purple-100 underline"
        >
          Limpar
        </button>
      </div>
    </div>
  );
};

// ============================================================
// MODAL DE EXPORTAÇÃO
// ============================================================
const ExportModal = ({ creatures, onConfirm, onCancel }) => {
  const [sel, setSel] = useState(() => new Set(creatures.map((c) => c.id)));
  const defaultName = creatures.length === 1
    ? creatures[0].name.replace(/[^a-z0-9]/gi, "_").toLowerCase()
    : "criaturas_exportadas";
  const [filename, setFilename] = useState(defaultName);

  const toggle = useCallback((id) => {
    setSel((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const handleConfirm = useCallback(() => {
    const toExport = creatures.filter((c) => sel.has(c.id));
    if (toExport.length === 0) return;
    const safeName = (filename.trim() || defaultName).replace(/\.json$/i, "") + ".json";
    onConfirm(toExport, safeName);
  }, [creatures, sel, filename, defaultName, onConfirm]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-slate-900 border border-slate-800 rounded-lg p-6 max-w-md w-full shadow-2xl flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-purple-950/60 border border-purple-900/60 flex items-center justify-center flex-shrink-0">
            <Download className="w-5 h-5 text-purple-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-white">Exportar Criaturas</h3>
            <p className="text-sm text-slate-400">{sel.size} de {creatures.length} selecionada(s)</p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="w-7 h-7 flex items-center justify-center rounded text-slate-500 hover:text-slate-200 hover:bg-slate-800 focus:outline-none flex-shrink-0"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 border border-slate-800 rounded-lg mb-4">
          {creatures.map((c) => {
            const ps = PATAMAR_STYLES[c.core?.patamar] ?? PATAMAR_STYLES.comum;
            return (
              <label
                key={c.id}
                className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-800/60 cursor-pointer border-b border-slate-800/60 last:border-b-0"
              >
                <input
                  type="checkbox"
                  checked={sel.has(c.id)}
                  onChange={() => toggle(c.id)}
                  className="w-4 h-4 accent-purple-600 cursor-pointer flex-shrink-0"
                />
                <span className="flex-1 text-sm text-slate-200 truncate">{c.name}</span>
                <span className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded border flex-shrink-0 ${ps.badge}`}>
                  {ps.label}
                </span>
              </label>
            );
          })}
        </div>

        <div className="mb-4 flex-shrink-0">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            Nome do Arquivo
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder={defaultName}
              className="flex-1 h-9 bg-slate-950 border border-slate-700 rounded px-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            />
            <span className="text-sm text-slate-500 flex-shrink-0">.json</span>
          </div>
        </div>

        <div className="flex justify-end gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-sm font-semibold text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/60"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={sel.size === 0}
            className="inline-flex items-center gap-2 px-4 py-2 rounded bg-purple-800 hover:bg-purple-700 text-sm font-bold text-white disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <Download className="w-4 h-4" /> Confirmar ({sel.size})
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// MAIN
// ============================================================
export default function Dashboard({
  manager,                 // useCreatureStorage expandido
  compendium = [],         // array do fm-compendium
  onOpenCreature,          // (id) => void — App intercepta built-ins
  onEditCreature,          // (id) => void — App intercepta built-ins
  onCreateNew,             // () => void
  onGoToEncounters,        // () => void
}) {
  const [view, setView] = useState({ type: "all", folderId: null });
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(() => new Set());
  const [confirmDelete, setConfirmDelete] = useState(null); // { type: 'one'|'many', payload }
  const [exportModal, setExportModal] = useState(null);    // array de criaturas | null
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const fileInputRef = useRef(null);

  // União só na renderização (built-ins nunca tocam storage)
  const allCreatures = useMemo(
    () => [...manager.creatures, ...compendium],
    [manager.creatures, compendium]
  );

  // Contagens pro sidebar
  const creatureCounts = useMemo(() => {
    const acc = { all: 0, unfiled: 0, builtins: compendium.length };
    manager.folders.forEach((f) => { acc[f.id] = 0; });
    manager.creatures.forEach((c) => {
      acc.all += 1;
      if (c.folderId == null) acc.unfiled += 1;
      else if (acc[c.folderId] != null) acc[c.folderId] += 1;
    });
    return acc;
  }, [manager.creatures, manager.folders, compendium.length]);

  // Filtragem por view + busca
  const filtered = useMemo(() => {
    const filterFn = VIEW_FILTERS[view.type] ?? VIEW_FILTERS.all;
    const ctx = { folderId: view.folderId };
    const q = search.toLowerCase().trim();
    return allCreatures.filter((c) => {
      if (!filterFn(c, ctx)) return false;
      if (q && !c.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [allCreatures, view, search]);

  const activeFolder = useMemo(
    () => view.type === "folder" ? manager.folders.find((f) => f.id === view.folderId) : null,
    [view, manager.folders]
  );

  // ===== Handlers =====
  const toggleSelect = useCallback((id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => setSelected(new Set()), []);

  const handleDuplicate = useCallback((creature) => {
    if (creature.isBuiltIn) {
      manager.cloneFromBuiltIn(creature, { folderId: null, renameSuffix: " (Cópia)" });
    } else {
      manager.duplicate(creature.id);
    }
  }, [manager]);

  const handleMove = useCallback((creatureId, folderId) => {
    manager.moveCreatureToFolder(creatureId, folderId);
  }, [manager]);

  const handleBulkMove = useCallback((folderId) => {
    manager.moveCreaturesToFolder(Array.from(selected), folderId);
    clearSelection();
  }, [manager, selected, clearSelection]);

  const handleExportOne = useCallback((creature) => {
    setExportModal([creature]);
  }, []);

  const handleExportSelected = useCallback(() => {
    const list = manager.creatures.filter((c) => selected.has(c.id));
    if (list.length > 0) setExportModal(list);
  }, [manager.creatures, selected]);

  const handleExportCurrentView = useCallback(() => {
    const exportable = filtered.filter((c) => !c.isBuiltIn);
    if (exportable.length > 0) setExportModal(exportable);
  }, [filtered]);

  const handleConfirmExport = useCallback((creatures, filename) => {
    exportCreaturesToFile(creatures, filename);
    setExportModal(null);
  }, []);

  const handleDelete = useCallback((creature) => {
    setConfirmDelete({ type: "one", payload: creature });
  }, []);

  const handleBulkDelete = useCallback(() => {
    setConfirmDelete({ type: "many", payload: Array.from(selected) });
  }, [selected]);

  const confirmDeleteAction = useCallback(() => {
    if (!confirmDelete) return;
    if (confirmDelete.type === "one") {
      manager.remove(confirmDelete.payload.id);
    } else {
      manager.removeMany(confirmDelete.payload);
      clearSelection();
    }
    setConfirmDelete(null);
  }, [confirmDelete, manager, clearSelection]);

  const handleImport = useCallback(async (file) => {
    try {
      const result = await importFromFile(file);
      manager.importMany(result, { mergeStrategy: "append" });
      // EXT: toast de sucesso — use seu sistema de toast atual
      alert(`Importadas ${result.creatures?.length ?? 0} criaturas`);
    } catch (err) {
      alert(`Falha na importação: ${err.message}`);
    }
  }, [manager]);

  const viewTitle = view.type === "folder"
    ? VIEW_TITLE.folder(activeFolder)
    : (VIEW_TITLE[view.type] ?? VIEW_TITLE.all)();

  const canCreate = view.type !== "builtins";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950/30 text-white">
      {/* ===== HEADER ===== */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur border-b border-purple-900/50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(true)}
            className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/60"
            aria-label="Abrir menu de pastas"
          >
            <Menu className="w-4 h-4" />
          </button>

          <h1 className="text-xl sm:text-2xl font-bold text-white">Grimório</h1>

          <div className="flex-1" />

          <button
            type="button"
            onClick={onGoToEncounters}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-sm font-semibold text-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500/60"
          >
            <Swords className="w-4 h-4" /> Encontros
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-sm font-semibold text-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500/60"
          >
            <Upload className="w-4 h-4" /> Importar
          </button>
          <button
            type="button"
            onClick={handleExportCurrentView}
            disabled={filtered.filter((c) => !c.isBuiltIn).length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-sm font-semibold text-slate-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-purple-500/60"
            title="Exportar criaturas da visualização atual"
          >
            <Download className="w-4 h-4" /> Exportar
          </button>
          <button
            type="button"
            onClick={onCreateNew}
            disabled={!canCreate}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded bg-purple-800 hover:bg-purple-700 text-sm font-bold text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-purple-500"
            title={canCreate ? "Criar nova criatura" : "Não é possível criar na pasta Sistema"}
          >
            <Plus className="w-4 h-4" /> Nova Criatura
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImport(file);
              e.target.value = "";
            }}
          />
        </div>
      </header>

      {/* ===== LAYOUT 2 COLUNAS ===== */}
      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-[288px_1fr] gap-6">

        {/* SIDEBAR DESKTOP */}
        <div className="hidden md:block">
          <div className="sticky top-20">
            <FolderSidebar
              view={view}
              onChangeView={setView}
              folders={manager.folders}
              creatureCounts={creatureCounts}
              compendiumCount={compendium.length}
              onCreateFolder={manager.createFolder}
              onRenameFolder={manager.renameFolder}
              onRemoveFolder={manager.removeFolder}
            />
          </div>
        </div>

        {/* DRAWER MOBILE */}
        {mobileSidebarOpen && (
          <div
            className="md:hidden fixed inset-0 z-50 bg-black/80"
            onClick={() => setMobileSidebarOpen(false)}
            role="dialog"
            aria-modal="true"
          >
            <div
              className="absolute left-0 top-0 bottom-0 w-72 bg-slate-950 border-r border-slate-800 p-3 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-slate-200">Pastas</span>
                <button
                  type="button"
                  onClick={() => setMobileSidebarOpen(false)}
                  className="w-7 h-7 rounded text-slate-400 hover:text-slate-200 focus:outline-none"
                  aria-label="Fechar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <FolderSidebar
                view={view}
                onChangeView={(v) => { setView(v); setMobileSidebarOpen(false); }}
                folders={manager.folders}
                creatureCounts={creatureCounts}
                compendiumCount={compendium.length}
                onCreateFolder={manager.createFolder}
                onRenameFolder={manager.renameFolder}
                onRemoveFolder={manager.removeFolder}
              />
            </div>
          </div>
        )}

        {/* CONTEÚDO PRINCIPAL */}
        <main className="min-w-0">
          <div className="mb-4 flex items-end justify-between gap-3 flex-wrap">
            <div>
              <h2 className="text-xl font-bold text-white">{viewTitle}</h2>
              <div className="text-xs text-slate-500 uppercase tracking-wider mt-0.5">
                {filtered.length} criatura(s)
                {view.type === "builtins" && " · Somente leitura — edite para clonar"}
              </div>
            </div>

            {/* Busca */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar..."
                className="w-full h-9 bg-slate-900/60 border border-slate-800 rounded pl-9 pr-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500"
                aria-label="Buscar criaturas"
              />
            </div>
          </div>

          <BulkActionBar
            count={selected.size}
            folders={manager.folders}
            onMove={handleBulkMove}
            onExport={handleExportSelected}
            onDelete={handleBulkDelete}
            onClear={clearSelection}
          />

          {filtered.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-slate-800 rounded-lg bg-slate-900/30">
              <Users className="w-10 h-10 text-slate-700 mx-auto mb-3" />
              <p className="text-sm text-slate-500 mb-4">
                {search
                  ? "Nenhuma criatura combina com sua busca."
                  : view.type === "builtins"
                    ? "Nenhuma criatura base carregada."
                    : "Esta pasta está vazia."}
              </p>
              {canCreate && !search && (
                <button
                  type="button"
                  onClick={onCreateNew}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded bg-purple-800 hover:bg-purple-700 text-sm font-bold text-white"
                >
                  <Plus className="w-4 h-4" /> Criar criatura
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filtered.map((c) => (
                <CreatureCard
                  key={c.id}
                  creature={c}
                  selected={selected.has(c.id)}
                  viewType={view.type}
                  folders={manager.folders}
                  onToggleSelect={toggleSelect}
                  onOpen={onOpenCreature}
                  onEdit={onEditCreature}
                  onDuplicate={handleDuplicate}
                  onExport={handleExportOne}
                  onDelete={handleDelete}
                  onMove={handleMove}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* ===== MODAL DE EXPORTAÇÃO ===== */}
      {exportModal && (
        <ExportModal
          creatures={exportModal}
          onConfirm={handleConfirmExport}
          onCancel={() => setExportModal(null)}
        />
      )}

      {/* ===== CONFIRMAÇÃO DE DELETE ===== */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setConfirmDelete(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-slate-900 border border-red-900/60 rounded-lg p-6 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-red-950/60 border border-red-900/60 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-1">Excluir?</h3>
                <p className="text-sm text-slate-400">
                  {confirmDelete.type === "one"
                    ? <><span className="text-slate-200 font-semibold">"{confirmDelete.payload.name}"</span> será removida permanentemente.</>
                    : <>{confirmDelete.payload.length} criatura(s) serão removidas permanentemente.</>
                  }
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-sm font-semibold text-slate-200"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDeleteAction}
                className="px-4 py-2 rounded bg-red-800 hover:bg-red-700 text-sm font-semibold text-white"
                autoFocus
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}