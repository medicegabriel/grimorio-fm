import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft, Download, Upload, Trash2, Pencil, Check, X,
  BookOpen, Copy, Library, Menu, Search, Filter, CheckSquare,
  FolderInput,
} from "lucide-react";
import {
  DndContext, DragOverlay, PointerSensor, TouchSensor, KeyboardSensor,
  useSensor, useSensors, closestCenter, pointerWithin,
} from "@dnd-kit/core";
import {
  SortableContext, useSortable, rectSortingStrategy, arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import FolderSidebar from "./FolderSidebar";
import MoveToFolderMenu from "./MoveToFolderMenu";
import TemplateDetailModal from "./TemplateDetail";
import { useAllTemplates, useTemplateFolders } from "./useTemplates";
import {
  TEMPLATE_TYPES, TEMPLATE_TYPE_ORDER, templateLabel, templateDescription,
  removeTemplate, moveTemplateToFolder, moveTemplatesToFolder,
  reorderTemplates, getTemplateFolderCounts,
  createTemplateFolder, renameTemplateFolder, removeTemplateFolder,
  serializeTemplatesExport, exportTemplatesToFile,
  parseTemplatesImportText, importFromFile, importTemplates,
} from "./fm-templates";

const keyOf = (type, id) => `${type}:${id}`;
const parseKey = (k) => { const i = k.indexOf(":"); return [k.slice(0, i), k.slice(i + 1)]; };
const isFolderDropId = (id) => id === "view_unfiled" || String(id).startsWith("fld");

// Estilo por tipo (badge singular no card; o label plural vem de TEMPLATE_TYPES).
const TYPE_STYLES = {
  acao:           { label: "Ação",          badge: "bg-rose-950 text-rose-300 border-rose-800",       accent: "border-l-rose-600" },
  caracteristica: { label: "Característica", badge: "bg-sky-950 text-sky-300 border-sky-800",          accent: "border-l-sky-600" },
  dote:           { label: "Dote",          badge: "bg-amber-950 text-amber-300 border-amber-800",     accent: "border-l-amber-600" },
  treinamento:    { label: "Treinamento",   badge: "bg-emerald-950 text-emerald-300 border-emerald-800", accent: "border-l-emerald-600" },
  aptidao:        { label: "Aptidão",       badge: "bg-purple-950 text-purple-300 border-purple-800",  accent: "border-l-purple-600" },
};

// ============================================================
// CARD DE MODELO (apresentacional)
// Card inteiro arrastável (igual ao Dashboard); controles usam
// onPointerDown stopPropagation pra não disparar o drag.
// ============================================================
const TemplateCard = ({
  type, tpl, folders, selected, isSelectionMode,
  onToggleSelect, onOpenDetail, onDelete, onMove,
  sortableRef, sortableStyle, sortableAttributes, sortableListeners, isDragging,
}) => {
  const [moveOpen, setMoveOpen] = useState(false);
  const style = TYPE_STYLES[type] ?? TYPE_STYLES.acao;
  const label = templateLabel(type, tpl) || "(sem nome)";
  const desc = templateDescription(tpl);

  // Clique no card: seleciona (modo seleção) ou abre o modal de ver/editar.
  const handleCardClick = () => {
    if (moveOpen) return;
    if (isSelectionMode) onToggleSelect(type, tpl.id);
    else onOpenDetail(type, tpl);
  };

  const stop = (e) => e.stopPropagation();

  return (
    <article
      ref={sortableRef}
      style={sortableStyle}
      {...sortableAttributes}
      {...sortableListeners}
      onClick={handleCardClick}
      className={`relative bg-slate-900/60 border-l-4 ${style.accent} border-r border-y border-slate-800 rounded-lg p-3 transition-all group focus:outline-none ${
        isDragging ? "cursor-grabbing opacity-30" : "cursor-grab"
      } ${selected ? "ring-2 ring-purple-500/60 bg-purple-950/20" : "hover:border-slate-700"}`}
    >
      <div className="flex items-start gap-2">
        {isSelectionMode && (
          <button
            type="button"
            onPointerDown={stop}
            onClick={(e) => { stop(e); onToggleSelect(type, tpl.id); }}
            className="mt-0.5 text-slate-400 hover:text-white flex-shrink-0 focus:outline-none"
            aria-label={selected ? "Desmarcar" : "Selecionar"}
          >
            <span className={`flex items-center justify-center w-4 h-4 rounded border ${
              selected ? "bg-purple-600 border-purple-600" : "bg-slate-900/80 border-slate-600 hover:border-slate-400"
            }`}>
              {selected && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
            </span>
          </button>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded border flex-shrink-0 ${style.badge}`}>
              {style.label}
            </span>
          </div>
          <div className="text-sm text-slate-200 font-medium break-words">{label}</div>
          {desc && (
            <div className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{desc}</div>
          )}
        </div>

        <div className="flex items-center gap-0.5 flex-shrink-0" onPointerDown={stop} onClick={stop}>
            {/* Mover para... */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setMoveOpen((o) => !o)}
                className="p-1 text-slate-500 hover:text-slate-200 focus:outline-none"
                title="Mover para pasta"
              >
                <FolderInput className="w-3.5 h-3.5" />
              </button>
              {moveOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMoveOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 w-56 z-50">
                    <MoveToFolderMenu
                      folders={folders}
                      currentFolderId={tpl.folderId ?? null}
                      onMove={(folderId) => { onMove(type, tpl.id, folderId); setMoveOpen(false); }}
                    />
                  </div>
                </>
              )}
            </div>
            {!isSelectionMode && (
              <button onClick={() => onOpenDetail(type, tpl)} className="p-1 text-slate-500 hover:text-slate-200" title="Ver / editar">
                <Pencil className="w-3.5 h-3.5" />
              </button>
            )}
            <button onClick={() => onDelete(type, tpl)} className="p-1 text-slate-500 hover:text-red-400" title="Excluir modelo">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
      </div>
    </article>
  );
};

// Wrapper sortable — injeta props de DnD no card.
const SortableTemplateCard = (props) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: keyOf(props.type, props.tpl.id) });
  return (
    <TemplateCard
      {...props}
      sortableRef={setNodeRef}
      sortableStyle={{ transform: CSS.Transform.toString(transform), transition }}
      sortableAttributes={attributes}
      sortableListeners={listeners}
      isDragging={isDragging}
    />
  );
};

// ============================================================
// MAIN
// ============================================================
export default function TemplateLibrary({ onBack }) {
  const all = useAllTemplates();
  const folders = useTemplateFolders();

  const [view, setView] = useState({ type: "all", folderId: null });
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState(""); // "" = todos
  const [selected, setSelected] = useState(() => new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [detail, setDetail] = useState(null); // { type, tpl } — modal ver/editar
  const [confirmDelete, setConfirmDelete] = useState(null); // { type:"one"|"many", payload }
  const [showExport, setShowExport] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [activeKey, setActiveKey] = useState(null);

  const headerRef = useRef(null);
  const [headerH, setHeaderH] = useState(64);
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const update = () => setHeaderH(el.offsetHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── Contagens para a sidebar ──
  const counts = useMemo(() => getTemplateFolderCounts(all), [all]);
  const total = counts.all;

  // ── Base por tipo (view + busca, ignora o filtro de tipo) ──
  const baseByType = useMemo(() => {
    const q = search.toLowerCase().trim();
    const out = {};
    for (const type of TEMPLATE_TYPE_ORDER) {
      let list = all[type] ?? [];
      if (view.type === "unfiled") list = list.filter((t) => t.folderId == null);
      else if (view.type === "folder") list = list.filter((t) => t.folderId === view.folderId);
      if (q) {
        list = list.filter(
          (t) =>
            templateLabel(type, t).toLowerCase().includes(q) ||
            templateDescription(t).toLowerCase().includes(q)
        );
      }
      out[type] = list;
    }
    return out;
  }, [all, view, search]);

  // ── Visível (aplica o filtro de tipo) ──
  const visibleByType = useMemo(() => {
    if (!typeFilter) return baseByType;
    const out = {};
    for (const type of TEMPLATE_TYPE_ORDER) out[type] = type === typeFilter ? baseByType[type] : [];
    return out;
  }, [baseByType, typeFilter]);

  const visibleKeys = useMemo(() => {
    const keys = [];
    for (const type of TEMPLATE_TYPE_ORDER) for (const t of visibleByType[type]) keys.push(keyOf(type, t.id));
    return keys;
  }, [visibleByType]);
  const visibleTotal = visibleKeys.length;

  const selectedItems = useMemo(
    () => Array.from(selected).map(parseKey).map(([type, id]) => ({ type, id })),
    [selected]
  );
  const selectedByType = useMemo(() => {
    const out = {};
    for (const { type, id } of selectedItems) {
      const tpl = (all[type] ?? []).find((t) => t.id === id);
      if (tpl) (out[type] ??= []).push(tpl);
    }
    return out;
  }, [selectedItems, all]);

  const allVisibleSelected = visibleKeys.length > 0 && visibleKeys.every((k) => selected.has(k));

  const activeFolder = useMemo(
    () => (view.type === "folder" ? folders.find((f) => f.id === view.folderId) : null),
    [view, folders]
  );
  const viewTitle =
    view.type === "folder" ? (activeFolder?.name ?? "Pasta")
    : view.type === "unfiled" ? "Sem Pasta"
    : "Todos os Modelos";

  // ── Seleção ──
  const toggleSelect = useCallback((type, id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      const k = keyOf(type, id);
      if (next.has(k)) next.delete(k); else next.add(k);
      return next;
    });
  }, []);
  const clearSelection = useCallback(() => setSelected(new Set()), []);
  const toggleSelectionMode = useCallback(() => {
    setIsSelectionMode((prev) => { if (prev) setSelected(new Set()); return !prev; });
  }, []);
  const handleSelectAll = useCallback(() => {
    if (allVisibleSelected) { clearSelection(); }
    else { setIsSelectionMode(true); setSelected(new Set(visibleKeys)); }
  }, [allVisibleSelected, visibleKeys, clearSelection]);

  // ── Ver / editar (modal) ──
  const openDetail = (type, tpl) => setDetail({ type, tpl });

  // ── Exclusão (modal próprio) ──
  // Se o card faz parte da seleção, a ação vale para TODOS os selecionados;
  // se não, age só nele (mesma regra do arraste — adendos #8/#9).
  const requestDeleteOne = (type, tpl) =>
    setConfirmDelete(
      selected.has(keyOf(type, tpl.id)) && selected.size > 0
        ? { kind: "many", items: selectedItems }
        : { kind: "one", type, tpl }
    );
  const requestDeleteMany = () => setConfirmDelete({ kind: "many", items: selectedItems });
  const confirmDeleteAction = () => {
    if (!confirmDelete) return;
    if (confirmDelete.kind === "one") {
      removeTemplate(confirmDelete.type, confirmDelete.tpl.id);
    } else {
      for (const { type, id } of confirmDelete.items) removeTemplate(type, id);
      clearSelection();
    }
    setConfirmDelete(null);
  };

  // ── Mover ──
  // Mesma regra de seleção dos adendos #8/#9: card selecionado move todos.
  const handleMoveOne = useCallback((type, id, folderId) => {
    if (selected.has(keyOf(type, id)) && selected.size > 0) {
      moveTemplatesToFolder(selectedItems, folderId);
      clearSelection();
    } else {
      moveTemplateToFolder(type, id, folderId);
    }
  }, [selected, selectedItems, clearSelection]);
  const handleBulkMove = useCallback((folderId) => {
    moveTemplatesToFolder(selectedItems, folderId);
    clearSelection();
  }, [selectedItems, clearSelection]);

  // ── DnD ──
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  const collisionDetectionStrategy = useCallback((args) => {
    const folderHits = pointerWithin(args).filter(({ id }) => isFolderDropId(id));
    return folderHits.length > 0 ? folderHits : closestCenter(args);
  }, []);

  const activeTpl = useMemo(() => {
    if (!activeKey) return null;
    const [type, id] = parseKey(activeKey);
    const tpl = (all[type] ?? []).find((t) => t.id === id);
    return tpl ? { type, tpl } : null;
  }, [activeKey, all]);

  const handleDragEnd = useCallback(({ active, over }) => {
    setActiveKey(null);
    if (!over) return;
    const overId = String(over.id);
    const [aType, aId] = parseKey(String(active.id));

    // Soltar numa pasta (ou "Sem Pasta")
    if (isFolderDropId(overId)) {
      const target = overId === "view_unfiled" ? null : overId;
      if (selected.size > 1 && selected.has(String(active.id))) {
        moveTemplatesToFolder(selectedItems, target);
        clearSelection();
      } else {
        moveTemplateToFolder(aType, aId, target);
      }
      return;
    }

    // Reordenar dentro do mesmo tipo
    const [oType, oId] = parseKey(overId);
    if (aType !== oType) return;
    const list = visibleByType[aType] ?? [];
    const isMulti = selected.size > 1 && selected.has(String(active.id));

    if (isMulti) {
      // Move o bloco de selecionados (deste tipo) para antes do alvo.
      const selIds = list.filter((t) => selected.has(keyOf(aType, t.id))).map((t) => t.id);
      const nonSel = list.filter((t) => !selected.has(keyOf(aType, t.id))).map((t) => t.id);
      const cleanIdx = nonSel.indexOf(oId);
      nonSel.splice(cleanIdx < 0 ? 0 : cleanIdx, 0, ...selIds);
      reorderTemplates(aType, nonSel);
    } else {
      const oldIdx = list.findIndex((t) => t.id === aId);
      const newIdx = list.findIndex((t) => t.id === oId);
      if (oldIdx !== -1 && newIdx !== -1 && oldIdx !== newIdx) {
        reorderTemplates(aType, arrayMove(list.map((t) => t.id), oldIdx, newIdx));
      }
    }
  }, [selected, selectedItems, visibleByType, clearSelection]);

  // ── Pastas (CRUD pela sidebar) ──
  const sidebarProps = {
    view,
    onChangeView: setView,
    folders,
    creatureCounts: counts,
    onCreateFolder: createTemplateFolder,
    onRenameFolder: renameTemplateFolder,
    onRemoveFolder: removeTemplateFolder,
    showSystemView: false,
    itemLabel: "modelo(s)",
  };

  const cardSharedProps = {
    folders,
    isSelectionMode,
    onToggleSelect: toggleSelect,
    onOpenDetail: openDetail,
    onDelete: requestDeleteOne,
    onMove: handleMoveOne,
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetectionStrategy}
      onDragStart={({ active }) => setActiveKey(String(active.id))}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveKey(null)}
    >
      <div className="min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950/30 text-white">
        {/* HEADER */}
        <header ref={headerRef} className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur border-b border-purple-900/50">
          <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden inline-flex items-center justify-center w-9 h-9 shrink-0 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/60"
              aria-label="Abrir menu de pastas"
            >
              <Menu className="w-4 h-4" />
            </button>
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-sm text-slate-300 transition-colors shrink-0"
            >
              <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline">Voltar</span>
            </button>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Library className="w-5 h-5 text-purple-400 flex-shrink-0" />
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-bold truncate">Biblioteca de Modelos</h1>
                <p className="text-xs text-slate-500">{total} modelo(s) salvos</p>
              </div>
            </div>
            <button
              onClick={() => setShowImport(true)}
              className="inline-flex items-center justify-center gap-1.5 h-9 w-9 lg:w-auto lg:px-3 shrink-0 rounded bg-slate-800 hover:bg-slate-700 text-sm font-semibold text-slate-200 transition-colors"
              title="Importar"
            >
              <Upload className="w-4 h-4" /> <span className="hidden lg:inline">Importar</span>
            </button>
            <button
              onClick={() => setShowExport(true)}
              disabled={selected.size === 0}
              className="inline-flex items-center justify-center gap-1.5 h-9 w-9 lg:w-auto lg:px-3 shrink-0 rounded bg-purple-700 hover:bg-purple-600 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-bold text-white transition-colors"
              title="Exportar selecionados"
            >
              <Download className="w-4 h-4" /> <span className="hidden lg:inline">Exportar{selected.size > 0 ? ` (${selected.size})` : ""}</span>
            </button>
          </div>
        </header>

        {/* LAYOUT 2 COLUNAS */}
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
          {/* SIDEBAR DESKTOP */}
          <div className="hidden lg:block">
            <div className="sticky" style={{ top: headerH + 8 }}>
              <FolderSidebar {...sidebarProps} />
            </div>
          </div>

          {/* DRAWER MOBILE */}
          {mobileSidebarOpen && (
            <div className="lg:hidden fixed inset-0 z-50 bg-black/80" onClick={() => setMobileSidebarOpen(false)} role="dialog" aria-modal="true">
              <div className="absolute left-0 top-0 bottom-0 w-72 bg-slate-950 border-r border-slate-800 p-3 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold text-slate-200">Pastas</span>
                  <button type="button" onClick={() => setMobileSidebarOpen(false)} className="w-7 h-7 rounded text-slate-400 hover:text-slate-200 focus:outline-none" aria-label="Fechar">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <FolderSidebar {...sidebarProps} onChangeView={(v) => { setView(v); setMobileSidebarOpen(false); }} />
              </div>
            </div>
          )}

          {/* CONTEÚDO */}
          <main className="min-w-0">
            <div className="flex flex-col gap-4 w-full mb-6 border-b border-slate-800/50 pb-4">
              <div className="flex flex-col shrink-0">
                <h2 className="text-xl font-bold text-white">{viewTitle}</h2>
                <span className="text-xs text-slate-500 uppercase tracking-wider mt-0.5">
                  {visibleTotal} modelo(s)
                  {visibleTotal > 0 && <span className="ml-2 text-slate-600">· Arraste para reordenar ou soltar numa pasta</span>}
                </span>
              </div>

              {/* Barra de ferramentas */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 w-full bg-slate-900/20 p-2 rounded-lg border border-slate-800/40">
                {visibleTotal > 0 && (
                  <div className="flex items-center gap-2 w-full md:w-auto py-1 md:py-0 shrink-0 select-none border-b border-slate-800/40 md:border-none pb-2 md:pb-0">
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="flex items-center gap-2 group focus:outline-none cursor-pointer text-xs text-slate-500 hover:text-slate-300"
                    >
                      <span className={`flex items-center justify-center w-4 h-4 rounded border ${
                        allVisibleSelected ? "bg-purple-600 border-purple-600" : "bg-slate-900/80 border-slate-600 group-hover:border-slate-400"
                      }`}>
                        {allVisibleSelected && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                      </span>
                      {allVisibleSelected ? "Limpar seleção" : "Selecionar tudo"}
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end shrink-0 flex-nowrap">
                  <div className="relative flex-1 md:flex-initial md:w-64">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Buscar modelos..."
                      className="w-full h-9 bg-slate-900/60 border border-slate-800 rounded pl-9 pr-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500"
                      aria-label="Buscar modelos"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowFilters((v) => !v)}
                    className={`relative h-9 w-9 flex items-center justify-center rounded border transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500/60 shrink-0 ${
                      showFilters || typeFilter
                        ? "bg-purple-900/60 border-purple-700 text-purple-300"
                        : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                    }`}
                    aria-label="Filtrar por tipo"
                    title="Filtrar por tipo"
                  >
                    <Filter className="w-4 h-4" />
                    {typeFilter && <span className="absolute -top-1 -right-1 w-2 h-2 bg-purple-500 rounded-full" />}
                  </button>
                  <button
                    type="button"
                    onClick={toggleSelectionMode}
                    className={`inline-flex items-center justify-center gap-1.5 h-9 w-9 xl:w-auto xl:px-3 rounded border text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500/60 shrink-0 ${
                      isSelectionMode
                        ? "bg-purple-950/60 border-purple-700 text-purple-300 hover:bg-purple-900/60"
                        : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                    }`}
                    title={isSelectionMode ? "Cancelar seleção" : "Selecionar em massa"}
                  >
                    <CheckSquare className="w-4 h-4 shrink-0" />
                    <span className="hidden xl:inline">{isSelectionMode ? "Cancelar" : "Selecionar"}</span>
                  </button>
                </div>
              </div>

              {/* Filtro por tipo (pills) */}
              {showFilters && (
                <div className="flex items-center gap-1.5 flex-wrap p-1">
                  <TypePill active={!typeFilter} onClick={() => setTypeFilter("")} label="Todos" count={null} />
                  {TEMPLATE_TYPE_ORDER.map((t) => (
                    <TypePill
                      key={t}
                      active={typeFilter === t}
                      onClick={() => setTypeFilter((cur) => (cur === t ? "" : t))}
                      label={TEMPLATE_TYPES[t].label}
                      count={baseByType[t]?.length ?? 0}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Barra de ações em lote */}
            {isSelectionMode && selected.size > 0 && (
              <BulkBar
                count={selected.size}
                folders={folders}
                onMove={handleBulkMove}
                onExport={() => setShowExport(true)}
                onDelete={requestDeleteMany}
                onClear={clearSelection}
                stickyTop={headerH}
              />
            )}

            {/* Conteúdo */}
            {total === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="Nenhum modelo salvo ainda."
                hint="Salve modelos pelo construtor (ícone de marcador) ou importe um arquivo."
              />
            ) : visibleTotal === 0 ? (
              <EmptyState
                icon={search ? Search : BookOpen}
                title={search ? "Nenhum modelo combina com sua busca." : "Nada por aqui."}
                hint={typeFilter ? "Tente remover o filtro de tipo." : "Esta visão está vazia."}
              />
            ) : (
              <div className="space-y-6">
                {TEMPLATE_TYPE_ORDER.map((type) => {
                  const list = visibleByType[type];
                  if (!list || list.length === 0) return null;
                  const cfg = TEMPLATE_TYPES[type];
                  return (
                    <section key={type}>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-sm font-bold text-slate-200">{cfg.label}</h3>
                        <span className="text-xs text-slate-500">({list.length})</span>
                      </div>
                      <SortableContext items={list.map((t) => keyOf(type, t.id))} strategy={rectSortingStrategy}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 items-start">
                          {list.map((tpl) => {
                            const k = keyOf(type, tpl.id);
                            const isGhosted = activeKey !== null && selected.has(k) && selected.has(activeKey);
                            return (
                              <div key={tpl.id} className={isGhosted ? "opacity-0 pointer-events-none" : undefined}>
                                <SortableTemplateCard
                                  type={type}
                                  tpl={tpl}
                                  selected={selected.has(k)}
                                  {...cardSharedProps}
                                />
                              </div>
                            );
                          })}
                        </div>
                      </SortableContext>
                    </section>
                  );
                })}
              </div>
            )}
          </main>
        </div>

        {/* MODAIS */}
        {detail && (
          <TemplateDetailModal
            key={`${detail.type}:${detail.tpl.id}`}
            type={detail.type}
            tpl={detail.tpl}
            onClose={() => setDetail(null)}
          />
        )}
        {showExport && <ExportModal templatesByType={selectedByType} onClose={() => setShowExport(false)} />}
        {showImport && <ImportModal onClose={() => setShowImport(false)} />}
        {confirmDelete && (
          <ConfirmDeleteModal
            confirm={confirmDelete}
            onCancel={() => setConfirmDelete(null)}
            onConfirm={confirmDeleteAction}
          />
        )}
      </div>

      {/* DRAG OVERLAY */}
      <DragOverlay dropAnimation={{ duration: 200, easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)" }}>
        {activeTpl && (
          <CardDragOverlay
            active={activeTpl}
            count={selected.size > 1 && selected.has(activeKey) ? selected.size : 1}
          />
        )}
      </DragOverlay>
    </DndContext>
  );
}

// ============================================================
// SUBCOMPONENTES
// ============================================================
// Ghost visual durante o arraste (igual ao Dashboard): pilha + contador
// quando vários estão selecionados, preview do card quando é só um.
const CardDragOverlay = ({ active, count }) => {
  const style = TYPE_STYLES[active.type] ?? TYPE_STYLES.acao;
  if (count > 1) {
    return (
      <div className="relative w-64">
        <div className="absolute -top-2.5 -right-2.5 z-10 min-w-[1.4rem] h-6 px-1.5 bg-purple-600 border-2 border-slate-950 rounded-full flex items-center justify-center shadow-lg">
          <span className="text-[11px] font-black text-white leading-none">{count}</span>
        </div>
        <div className="absolute inset-0 rotate-2 translate-x-2 translate-y-2 bg-slate-800 rounded-lg border border-slate-700 opacity-60" />
        <div className="absolute inset-0 rotate-1 translate-x-1 translate-y-1 bg-slate-800/80 rounded-lg border border-slate-700 opacity-80" />
        <div className="relative bg-slate-900 border border-purple-500/60 rounded-lg p-3 shadow-2xl ring-2 ring-purple-500/50">
          <div className="flex items-center gap-2">
            <Library className="w-4 h-4 text-purple-400 flex-shrink-0" />
            <span className="text-sm font-bold text-white">{count} modelos selecionados</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Solte em uma pasta ou posição</p>
        </div>
      </div>
    );
  }
  return (
    <div className={`w-64 bg-slate-900/98 border-l-4 ${style.accent} border-r border-y border-purple-500/40 rounded-lg p-3 shadow-2xl ring-2 ring-purple-500/50 cursor-grabbing`}>
      <span className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded border ${style.badge}`}>
        {style.label}
      </span>
      <div className="text-sm font-bold text-white truncate mt-1.5">{templateLabel(active.type, active.tpl)}</div>
    </div>
  );
};

const TypePill = ({ active, onClick, label, count }) => (
  <button
    type="button"
    onClick={onClick}
    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors focus:outline-none focus:ring-1 focus:ring-purple-500/60 ${
      active
        ? "bg-purple-700 border-purple-600 text-white"
        : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
    }`}
  >
    {label}
    {count != null && <span className={active ? "text-purple-200" : "text-slate-600"}>{count}</span>}
  </button>
);

const EmptyState = ({ icon: Icon, title, hint }) => (
  <div className="text-center py-16 border border-dashed border-slate-800 rounded-lg bg-slate-900/30">
    <Icon className="w-10 h-10 mx-auto mb-3 text-slate-700" />
    <p className="text-sm text-slate-500">{title}</p>
    {hint && <p className="text-xs text-slate-600 mt-1">{hint}</p>}
  </div>
);

const BulkBar = ({ count, folders, onMove, onExport, onDelete, onClear, stickyTop }) => {
  const [moveOpen, setMoveOpen] = useState(false);
  return (
    <div className="sticky z-30 mb-4 shadow-lg" style={{ top: stickyTop }}>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-purple-900 border border-purple-700/60 rounded-lg p-3 w-full">
        <span className="text-sm font-semibold text-purple-100 shrink-0">{count} selecionado(s)</span>
        <div className="flex items-center flex-wrap gap-2 w-full sm:w-auto justify-center sm:justify-end">
          <div className="relative">
            <button
              type="button"
              onClick={() => setMoveOpen((o) => !o)}
              className="inline-flex items-center gap-1 px-3 py-1 rounded bg-slate-900/80 hover:bg-slate-800 text-xs font-semibold text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/60"
            >
              <FolderInput className="w-3 h-3" /> Mover
            </button>
            {moveOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMoveOpen(false)} />
                <div className="absolute left-0 sm:left-auto sm:right-0 top-full mt-1 w-56 z-50">
                  <MoveToFolderMenu folders={folders} isBulk onMove={(folderId) => { onMove(folderId); setMoveOpen(false); }} />
                </div>
              </>
            )}
          </div>
          <button type="button" onClick={onExport} className="inline-flex items-center gap-1 px-3 py-1 rounded bg-slate-900/80 hover:bg-slate-800 text-xs font-semibold text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/60">
            <Download className="w-3 h-3" /> Exportar
          </button>
          <button type="button" onClick={onDelete} className="inline-flex items-center gap-1 px-3 py-1 rounded bg-red-900/60 hover:bg-red-800 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-red-500">
            <Trash2 className="w-3 h-3" /> Excluir
          </button>
          <button type="button" onClick={onClear} className="text-xs text-purple-300 hover:text-purple-100 underline">Limpar</button>
        </div>
      </div>
    </div>
  );
};

const ConfirmDeleteModal = ({ confirm, onCancel, onConfirm }) =>
  createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4" onClick={onCancel} role="dialog" aria-modal="true">
      <div className="bg-slate-900 border border-red-900/60 rounded-lg p-6 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-red-950/60 border border-red-900/60 flex items-center justify-center flex-shrink-0">
            <Trash2 className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white mb-1">Excluir modelo?</h3>
            <p className="text-sm text-slate-400">
              {confirm.kind === "one"
                ? <><span className="text-slate-200 font-semibold">"{templateLabel(confirm.type, confirm.tpl)}"</span> será removido permanentemente.</>
                : <>{confirm.items.length} modelo(s) serão removidos permanentemente.</>}
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-sm font-semibold text-slate-200">Cancelar</button>
          <button type="button" onClick={onConfirm} autoFocus className="px-4 py-2 rounded bg-red-800 hover:bg-red-700 text-sm font-semibold text-white">Excluir</button>
        </div>
      </div>
    </div>,
    document.body
  );

// ---------- Modal de exportação ----------
function ExportModal({ templatesByType, onClose }) {
  const [filename, setFilename] = useState("grimorio-modelos");
  const [copied, setCopied] = useState(false);
  const json = useMemo(() => serializeTemplatesExport(templatesByType), [templatesByType]);
  const count = useMemo(
    () => Object.values(templatesByType).reduce((n, l) => n + l.length, 0),
    [templatesByType]
  );

  const copy = () => { navigator.clipboard?.writeText(json); setCopied(true); setTimeout(() => setCopied(false), 1200); };
  const download = () => {
    const safe = filename.replace(/[^a-z0-9-_]/gi, "-").toLowerCase() || "grimorio-modelos";
    exportTemplatesToFile(templatesByType, `${safe}.json`);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4" onClick={onClose} role="dialog" aria-modal="true">
      <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-lg w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <h3 className="text-lg font-bold text-white">Exportar Modelos</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-200"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-4 space-y-3">
          <p className="text-xs text-slate-400">{count} modelo(s) selecionado(s). As pastas usadas vão junto.</p>
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Nome do arquivo</label>
            <div className="flex items-center gap-2">
              <input value={filename} onChange={(e) => setFilename(e.target.value)} className="flex-1 h-9 bg-slate-950 border border-slate-700 rounded px-3 text-sm text-white focus:outline-none focus:border-purple-500" />
              <span className="text-sm text-slate-500">.json</span>
            </div>
          </div>
          <textarea readOnly value={json} className="w-full h-40 bg-slate-950 border border-slate-700 rounded px-2.5 py-2 text-[11px] font-mono text-slate-400 resize-none focus:outline-none" />
        </div>
        <div className="flex justify-end gap-2 p-4 pt-0">
          <button onClick={copy} className="flex items-center gap-1.5 px-3 py-2 rounded bg-slate-800 hover:bg-slate-700 text-sm font-semibold text-slate-200 transition-colors">
            <Copy className="w-4 h-4" /> {copied ? "Copiado!" : "Copiar JSON"}
          </button>
          <button onClick={download} className="flex items-center gap-1.5 px-3 py-2 rounded bg-purple-700 hover:bg-purple-600 text-sm font-bold text-white transition-colors">
            <Download className="w-4 h-4" /> Baixar arquivo
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ---------- Modal de importação ----------
function ImportModal({ onClose }) {
  const [text, setText] = useState("");
  const [status, setStatus] = useState(null); // { type, message }
  const fileRef = useRef(null);

  const apply = (parsed) => {
    const { added, skipped, foldersAdded } = importTemplates(parsed.templates, { folders: parsed.folders });
    const parts = [`${added} modelo(s) importado(s)`];
    if (foldersAdded) parts.push(`${foldersAdded} pasta(s)`);
    if (skipped) parts.push(`${skipped} duplicado(s) ignorado(s)`);
    setStatus({ type: "success", message: `${parts.join(", ")}.` });
  };

  const fromText = () => {
    if (!text.trim()) { setStatus({ type: "error", message: "Cole o JSON antes de importar." }); return; }
    try { apply(parseTemplatesImportText(text)); setText(""); }
    catch (e) { setStatus({ type: "error", message: e.message }); }
  };

  const fromFile = async (file) => {
    if (!file) return;
    try { apply(await importFromFile(file)); }
    catch (e) { setStatus({ type: "error", message: e.message }); }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4" onClick={onClose} role="dialog" aria-modal="true">
      <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-lg w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <h3 className="text-lg font-bold text-white">Importar Modelos</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-200"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-4 space-y-3">
          <button onClick={() => fileRef.current?.click()} className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded border border-dashed border-slate-700 text-sm text-slate-300 hover:border-purple-700 hover:text-white transition-colors">
            <Upload className="w-4 h-4" /> Escolher arquivo .json
          </button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => { fromFile(e.target.files?.[0]); e.target.value = ""; }} />
          <div className="text-center text-[10px] uppercase tracking-widest text-slate-600">ou cole o JSON</div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder='{ "kind": "fm-templates", "templates": { ... } }'
            className="w-full h-32 bg-slate-950 border border-slate-700 rounded px-2.5 py-2 text-[11px] font-mono text-slate-300 resize-none focus:outline-none focus:border-purple-500"
          />
          {status && (
            <p className={`text-xs ${status.type === "error" ? "text-red-400" : "text-emerald-400"}`}>{status.message}</p>
          )}
        </div>
        <div className="flex justify-end gap-2 p-4 pt-0">
          <button onClick={onClose} className="px-3 py-2 rounded bg-slate-800 hover:bg-slate-700 text-sm font-semibold text-slate-200 transition-colors">Fechar</button>
          <button onClick={fromText} className="flex items-center gap-1.5 px-3 py-2 rounded bg-purple-700 hover:bg-purple-600 text-sm font-bold text-white transition-colors">
            <Upload className="w-4 h-4" /> Importar do texto
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
