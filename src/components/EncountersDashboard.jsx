// components/EncountersDashboard.jsx
// Tela de listagem de encontros — estrutura e DnD idênticos ao Dashboard de Criaturas.

import { useState, useMemo, useCallback, useRef } from 'react';
import {
  ArrowLeft, Plus, Search, MoreVertical, Play, Copy, Trash2,
  Swords, Flag, Trophy, X, AlertTriangle, Folder,
  Edit3, Menu, FolderInput
} from 'lucide-react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  pointerWithin,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { ENCOUNTER_STATUS } from '../fm-encounter';
import MoveToFolderMenu from './MoveToFolderMenu';
import FolderSidebar from './FolderSidebar';

// ============================================================
// DICIONÁRIOS
// ============================================================
const STATUS_THEMES = {
  planning: {
    label: 'Planejando',
    icon: Flag,
    badge: 'bg-slate-800 text-slate-300 border-slate-700',
    cardAccent: 'border-slate-800 hover:border-slate-700',
    dot: 'bg-slate-500',
    cta: 'Abrir'
  },
  active: {
    label: 'Em Combate',
    icon: Swords,
    badge: 'bg-purple-900/60 text-purple-200 border-purple-800',
    cardAccent: 'border-purple-900/60 hover:border-purple-700 shadow-lg shadow-purple-900/10',
    dot: 'bg-purple-500 animate-pulse',
    cta: 'Retomar'
  },
  finished: {
    label: 'Finalizado',
    icon: Trophy,
    badge: 'bg-amber-900/40 text-amber-300 border-amber-900/60',
    cardAccent: 'border-slate-800 hover:border-amber-900/60 opacity-90',
    dot: 'bg-amber-600',
    cta: 'Ver Resumo'
  }
};

const STATUS_ORDER = [
  ENCOUNTER_STATUS.PLANNING,
  ENCOUNTER_STATUS.ACTIVE,
  ENCOUNTER_STATUS.FINISHED,
];

const ENC_VIEW_FILTERS = {
  all:     () => true,
  unfiled: (e) => e.folderId == null,
  folder:  (e, ctx) => String(e.folderId) === String(ctx.folderId),
};

const ENC_VIEW_TITLE = {
  all:     () => 'Todos os Encontros',
  unfiled: () => 'Sem Pasta',
  folder:  (f) => f?.name ?? 'Pasta',
};

// ============================================================
// HELPERS
// ============================================================
const relativeDate = (ts) => {
  if (!ts) return '—';
  const diff = Date.now() - ts;
  const minutes = Math.floor(diff / 60000);
  const hours   = Math.floor(diff / 3600000);
  const days    = Math.floor(diff / 86400000);
  if (minutes < 1)  return 'agora';
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24)   return `${hours}h`;
  if (days < 7)     return `${days}d`;
  return new Date(ts).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
};

// ============================================================
// STATUS BADGE
// ============================================================
const StatusBadge = ({ status }) => {
  const theme = STATUS_THEMES[status] ?? STATUS_THEMES.planning;
  const Icon = theme.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold border ${theme.badge}`}>
      <Icon className="w-3 h-3" /> {theme.label}
    </span>
  );
};

// ============================================================
// ACTION MENU — onPointerDown stop para não acionar drag
// ============================================================
const ActionMenu = ({ encounter, folders = [], onOpen, onDuplicate, onDelete, onMove, onRename }) => {
  const [open, setOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const ref = useRef(null);
  const theme = STATUS_THEMES[encounter.status] ?? STATUS_THEMES.planning;

  const closeAll = () => { setOpen(false); setMoveOpen(false); };

  return (
    <div
      className="relative flex-shrink-0"
      ref={ref}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="inline-flex items-center justify-center w-7 h-7 rounded text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-colors focus:outline-none focus:ring-1 focus:ring-purple-500/40"
        aria-label="Menu de ações"
        aria-expanded={open}
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={closeAll} />
          <div className="absolute right-0 top-full mt-1 w-48 bg-slate-950 border border-slate-800 rounded-md shadow-xl z-20 overflow-hidden">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); closeAll(); onOpen(); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left text-slate-200 hover:bg-slate-900 focus:outline-none"
            >
              <Play className="w-3.5 h-3.5" /> {theme.cta}
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); closeAll(); onDuplicate(); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left text-slate-200 hover:bg-slate-900 focus:outline-none"
            >
              <Copy className="w-3.5 h-3.5" /> Duplicar
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                closeAll();
                const newName = window.prompt('Novo nome do encontro:', encounter.name);
                if (newName && newName.trim()) onRename(newName.trim());
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left text-slate-200 hover:bg-slate-900 focus:outline-none"
            >
              <Edit3 className="w-3.5 h-3.5" /> Renomear
            </button>
            {folders.length > 0 && (
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setMoveOpen((v) => !v); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left text-slate-200 hover:bg-slate-900 focus:outline-none"
                >
                  <FolderInput className="w-3.5 h-3.5" /> Mover para...
                </button>
                {moveOpen && (
                  <div className="absolute right-full top-0 mr-1 w-48 z-30">
                    <MoveToFolderMenu
                      folders={folders}
                      currentFolderId={encounter.folderId ?? null}
                      onMove={(folderId) => { onMove(folderId); closeAll(); }}
                    />
                  </div>
                )}
              </div>
            )}
            <div className="border-t border-slate-800" />
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); closeAll(); onDelete(); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left text-red-400 hover:bg-red-950/40 focus:outline-none"
            >
              <Trash2 className="w-3.5 h-3.5" /> Excluir
            </button>
          </div>
        </>
      )}
    </div>
  );
};

// ============================================================
// ENCOUNTER CARD — card inteiro arrastável, controles com stop
// ============================================================
const EncounterCard = ({
  encounter, folders = [], selected,
  onOpen, onDuplicate, onDelete, onMove, onRename, onToggleSelect,
  // DnD props
  sortableRef, sortableStyle, sortableAttributes, sortableListeners, isDragging,
}) => {
  const theme = STATUS_THEMES[encounter.status] ?? STATUS_THEMES.planning;
  const totalCombatants = encounter.combatants.length;
  const isDraggable = !!sortableListeners;

  return (
    <article
      ref={sortableRef}
      style={sortableStyle}
      {...(isDraggable ? sortableAttributes : {})}
      {...(isDraggable ? sortableListeners : {})}
      onClick={onOpen}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onOpen())}
      tabIndex={0}
      role="button"
      aria-label={`Abrir encontro ${encounter.name}`}
      className={`bg-slate-900/60 border rounded-lg p-4 transition-all group focus:outline-none focus:ring-2 focus:ring-purple-500/60 ${theme.cardAccent} ${
        isDraggable ? (isDragging ? 'cursor-grabbing opacity-30' : 'cursor-grab') : 'cursor-pointer'
      } ${selected ? 'ring-2 ring-purple-500/60 bg-purple-950/10' : ''}`}
    >
      {/* Controles: onPointerDown stop para não iniciar drag */}
      <div
        className="flex items-start justify-between gap-2 mb-2"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* Checkbox de seleção múltipla */}
          <div
            className={`transition-opacity duration-150 flex-shrink-0 ${selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus-within:opacity-100'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="checkbox"
              checked={!!selected}
              onChange={(e) => { e.stopPropagation(); onToggleSelect?.(encounter.id); }}
              className="w-4 h-4 accent-purple-600 cursor-pointer rounded"
              aria-label={`Selecionar ${encounter.name}`}
            />
          </div>
          <span className={`w-1.5 h-1.5 rounded-full ${theme.dot} flex-shrink-0`} aria-hidden="true" />
          <h3 className="flex-1 min-w-0 text-sm font-bold text-white truncate group-hover:text-purple-200 transition-colors">
            {encounter.name}
          </h3>
        </div>
        <ActionMenu
          encounter={encounter}
          folders={folders}
          onOpen={onOpen}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
          onMove={onMove}
          onRename={onRename}
        />
      </div>

      <div className="mb-3">
        <StatusBadge status={encounter.status} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-1 w-full bg-slate-900/50 rounded-md p-2 mt-3 divide-x divide-slate-700/50">
        <div className="flex flex-col items-center justify-center min-w-0 px-1">
          <span className="text-[9px] text-slate-400 uppercase tracking-wider whitespace-nowrap w-full text-center">Rodada</span>
          <span className="text-sm font-semibold text-slate-200 truncate w-full text-center">{encounter.round}</span>
        </div>
        <div className="flex flex-col items-center justify-center min-w-0 px-1">
          <span className="text-[9px] text-slate-400 uppercase tracking-wider whitespace-nowrap w-full text-center">Criaturas</span>
          <span className="text-sm font-semibold text-slate-200 truncate w-full text-center">{totalCombatants}</span>
        </div>
        <div className="flex flex-col items-center justify-center min-w-0 px-1">
          <span className="text-[9px] text-slate-400 uppercase tracking-wider whitespace-nowrap w-full text-center">Modificado</span>
          <span className="text-sm font-semibold text-slate-200 truncate w-full text-center">{relativeDate(encounter.updatedAt)}</span>
        </div>
      </div>
    </article>
  );
};

// ============================================================
// WRAPPER SORTABLE
// ============================================================
const SortableEncounterCard = (props) => {
  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging,
  } = useSortable({ id: props.encounter.id });

  return (
    <EncounterCard
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
// DRAG OVERLAY
// ============================================================
const EncounterDragOverlay = ({ encounter, count }) => {
  if (count > 1) {
    return (
      <div className="relative w-72">
        <div className="absolute inset-0 rotate-2 translate-x-2 translate-y-2 bg-slate-800 rounded-lg border border-slate-700 opacity-50" />
        <div className="absolute inset-0 rotate-1 translate-x-1 translate-y-1 bg-slate-800/80 rounded-lg border border-slate-700 opacity-70" />
        <div className="relative bg-slate-900 border border-purple-500/60 rounded-lg p-4 shadow-2xl ring-2 ring-purple-500/50">
          <div className="flex items-center gap-2">
            <Swords className="w-4 h-4 text-purple-400 flex-shrink-0" />
            <span className="text-sm font-bold text-white">Movendo {count} encontros</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Solte em uma pasta para mover todos</p>
        </div>
      </div>
    );
  }

  if (!encounter) return null;
  const theme = STATUS_THEMES[encounter.status] ?? STATUS_THEMES.planning;
  return (
    <div className={`w-72 bg-slate-900/98 border rounded-lg p-4 shadow-2xl ring-2 ring-purple-500/50 cursor-grabbing ${theme.cardAccent}`}>
      <div className="flex items-center gap-2 mb-3">
        <span className={`w-1.5 h-1.5 rounded-full ${theme.dot} flex-shrink-0`} />
        <h3 className="text-base font-bold text-white truncate">{encounter.name}</h3>
      </div>
      <StatusBadge status={encounter.status} />
    </div>
  );
};

// ============================================================
// BARRA DE AÇÕES EM LOTE
// ============================================================
const BulkActionBar = ({ count, folders, onMove, onDelete, onClear }) => {
  const [moveOpen, setMoveOpen] = useState(false);
  if (count === 0) return null;

  return (
    <div className="sticky top-16 z-30 bg-purple-950/80 backdrop-blur border border-purple-800 rounded-lg px-4 py-2 flex items-center gap-3 flex-wrap mb-4 shadow-lg">
      <span className="text-sm font-semibold text-purple-100">{count} selecionado(s)</span>
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
          onClick={onDelete}
          className="inline-flex items-center gap-1 px-3 py-1 rounded bg-red-900/60 hover:bg-red-800 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <Trash2 className="w-3 h-3" /> Excluir
        </button>
        <button type="button" onClick={onClear} className="text-xs text-purple-300 hover:text-purple-100 underline">
          Limpar
        </button>
      </div>
    </div>
  );
};

// ============================================================
// CONFIRM MODAL
// ============================================================
const ConfirmDeleteModal = ({ target, onConfirm, onCancel }) => {
  if (!target) return null;
  const isMulti = Array.isArray(target);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onCancel}
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
            <h3 className="text-lg font-bold text-white mb-1">Excluir encontro{isMulti ? 's' : ''}?</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              {isMulti
                ? <>{target.length} encontro(s) serão removidos permanentemente.</>
                : <><span className="text-slate-200 font-semibold">"{target.name}"</span> será permanentemente removido.</>
              }
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-sm font-semibold text-slate-200">
            Cancelar
          </button>
          <button type="button" onClick={onConfirm} autoFocus className="px-4 py-2 rounded bg-red-800 hover:bg-red-700 text-sm font-semibold text-white">
            Excluir
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// EMPTY STATE
// ============================================================
const EmptyState = ({ onCreate }) => (
  <div className="text-center py-20 border border-dashed border-slate-800 rounded-lg bg-slate-900/30">
    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-950/40 border border-purple-900/60 mb-4">
      <Swords className="w-8 h-8 text-purple-400" />
    </div>
    <h3 className="text-lg font-bold text-slate-200 mb-2">Nenhum encontro ainda</h3>
    <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">
      Crie um encontro para gerenciar iniciativa e combater múltiplas criaturas simultaneamente.
    </p>
    <button
      type="button"
      onClick={onCreate}
      className="inline-flex items-center gap-1.5 px-4 py-2 rounded bg-purple-800 hover:bg-purple-700 text-sm font-bold text-white"
    >
      <Plus className="w-4 h-4" /> Criar primeiro encontro
    </button>
  </div>
);

// ============================================================
// MAIN
// ============================================================
export default function EncountersDashboard({
  manager,
  folders = [],
  onCreateFolder,
  onRenameFolder,
  onRemoveFolder,
  onOpenEncounter,
  onBackToGrimoire,
}) {
  const [view, setView] = useState({ type: 'all', folderId: null });
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(() => new Set());
  const [activeStatusFilters, setActiveStatusFilters] = useState(() => new Set());
  const [confirmDelete, setConfirmDelete] = useState(null); // encounter | encounter[] | null
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // ── DnD state ──
  const [activeId, setActiveId] = useState(null);
  const [isDraggingMultiple, setIsDraggingMultiple] = useState(false);
  const isDraggingMultipleRef = useRef(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const collisionDetectionStrategy = useCallback((args) => {
    const pointerHits = pointerWithin(args);
    const folderHits = pointerHits.filter(({ id }) => {
      const s = String(id);
      return s.startsWith('fld_') || s === 'view_unfiled';
    });
    if (folderHits.length > 0) return folderHits;
    return closestCenter(args);
  }, []);

  // ── Counts para sidebar ──
  const encounterCounts = useMemo(() => {
    const acc = { all: 0, unfiled: 0 };
    folders.forEach((f) => { acc[f.id] = 0; });
    manager.encounters.forEach((e) => {
      acc.all += 1;
      if (e.folderId == null) acc.unfiled += 1;
      else if (acc[e.folderId] != null) acc[e.folderId] += 1;
    });
    return acc;
  }, [manager.encounters, folders]);

  // ── Counts por status (para chips) ──
  const statusCounts = useMemo(() => {
    const acc = { planning: 0, active: 0, finished: 0 };
    manager.encounters.forEach((e) => { acc[e.status] = (acc[e.status] ?? 0) + 1; });
    return acc;
  }, [manager.encounters]);

  // ── Lista filtrada (usa ordem do array — manual drag) ──
  const filtered = useMemo(() => {
    const filterFn = ENC_VIEW_FILTERS[view.type] ?? ENC_VIEW_FILTERS.all;
    const ctx = { folderId: view.folderId };
    const q = search.toLowerCase().trim();
    return manager.encounters.filter((e) => {
      if (!filterFn(e, ctx)) return false;
      if (activeStatusFilters.size > 0 && !activeStatusFilters.has(e.status)) return false;
      if (q && !e.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [manager.encounters, view, activeStatusFilters, search]);

  const activeFolder = useMemo(
    () => view.type === 'folder' ? folders.find((f) => f.id === view.folderId) : null,
    [view, folders]
  );

  const activeEncounter = useMemo(
    () => activeId ? manager.encounters.find((e) => e.id === activeId) ?? null : null,
    [activeId, manager.encounters]
  );

  // ── Seleção ──
  const toggleSelect = useCallback((id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => setSelected(new Set()), []);

  // ── Handlers de DnD ──
  const handleDragStart = useCallback(({ active }) => {
    const id = String(active.id);
    const isMulti = selected.size > 1 && selected.has(id);
    isDraggingMultipleRef.current = isMulti;
    setActiveId(id);
    setIsDraggingMultiple(isMulti);
  }, [selected]);

  const handleDragEnd = useCallback(({ active, over }) => {
    const wasMulti = isDraggingMultipleRef.current;
    isDraggingMultipleRef.current = false;
    setActiveId(null);
    setIsDraggingMultiple(false);

    if (!over || active.id === over.id) return;

    const overId = String(over.id);

    // Drop em pasta
    if (overId.startsWith('fld_') || overId === 'view_unfiled') {
      const targetFolderId = overId === 'view_unfiled' ? null : overId;
      if (wasMulti) {
        manager.moveManyToFolder(Array.from(selected), targetFolderId);
        clearSelection();
      } else {
        manager.moveToFolder(String(active.id), targetFolderId);
      }
      return;
    }

    // Reordenação (só drag simples)
    if (!wasMulti) {
      const oldIdx = filtered.findIndex((e) => e.id === String(active.id));
      const newIdx = filtered.findIndex((e) => e.id === overId);
      if (oldIdx !== -1 && newIdx !== -1 && oldIdx !== newIdx) {
        const newIds = arrayMove(filtered.map((e) => e.id), oldIdx, newIdx);
        manager.reorderEncounters(newIds);
      }
    }
  }, [manager, selected, filtered, clearSelection]);

  const handleDragCancel = useCallback(() => {
    isDraggingMultipleRef.current = false;
    setActiveId(null);
    setIsDraggingMultiple(false);
  }, []);

  // ── Demais handlers ──
  const toggleFilter = useCallback((status) => {
    setActiveStatusFilters((prev) => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status); else next.add(status);
      return next;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setSearch('');
    setActiveStatusFilters(new Set());
  }, []);

  const handleCreate = useCallback(() => {
    const fresh = manager.create({ name: 'Novo Encontro' });
    onOpenEncounter(fresh.id);
  }, [manager, onOpenEncounter]);

  const handleBulkMove = useCallback((folderId) => {
    manager.moveManyToFolder(Array.from(selected), folderId);
    clearSelection();
  }, [manager, selected, clearSelection]);

  const handleBulkDelete = useCallback(() => {
    setConfirmDelete(Array.from(selected).map((id) => manager.encounters.find((e) => e.id === id)).filter(Boolean));
  }, [selected, manager.encounters]);

  const handleConfirmDelete = useCallback(() => {
    if (!confirmDelete) return;
    if (Array.isArray(confirmDelete)) {
      confirmDelete.forEach((e) => manager.remove(e.id));
      clearSelection();
    } else {
      manager.remove(confirmDelete.id);
    }
    setConfirmDelete(null);
  }, [confirmDelete, manager, clearSelection]);

  const viewTitle = view.type === 'folder'
    ? ENC_VIEW_TITLE.folder(activeFolder)
    : (ENC_VIEW_TITLE[view.type] ?? ENC_VIEW_TITLE.all)();

  const hasFilters = search.length > 0 || activeStatusFilters.size > 0;

  const sidebarProps = {
    view,
    onChangeView: setView,
    folders,
    creatureCounts: encounterCounts,
    compendiumCount: 0,
    onCreateFolder,
    onRenameFolder,
    onRemoveFolder,
    showSystemView: false,
  };

  const cardSharedProps = {
    folders,
    onOpen: undefined, // sobrescrito por cada card
    onToggleSelect: toggleSelect,
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetectionStrategy}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950/30 text-white">
        {/* ===== HEADER ===== */}
        <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur border-b border-purple-900/50">
          <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-3 space-y-2">
            {/* Linha superior: título à esquerda, voltar à direita */}
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMobileSidebarOpen(true)}
                  className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/60"
                  aria-label="Abrir menu de pastas"
                >
                  <Menu className="w-4 h-4" />
                </button>
                <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                  <Swords className="w-5 h-5 text-purple-400" /> Encontros
                </h1>
                <div className="hidden sm:block text-xs text-slate-500 uppercase tracking-wider">
                  {manager.encounters.length} total
                  {statusCounts.active > 0 && (
                    <span className="text-purple-400 ml-2">• {statusCounts.active} em combate</span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={onBackToGrimoire}
                className="flex items-center gap-2 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-sm text-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500/60"
              >
                <ArrowLeft className="w-4 h-4" /> Grimório
              </button>
            </div>

            {/* Linha inferior: botão de ação principal */}
            <div>
              <button
                type="button"
                onClick={handleCreate}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded bg-purple-800 hover:bg-purple-700 text-sm font-bold text-white transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <Plus className="w-4 h-4" /> Novo Encontro
              </button>
            </div>
          </div>
        </header>

        {/* ===== LAYOUT 2 COLUNAS ===== */}
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-1 md:grid-cols-[288px_1fr] gap-6">

          {/* SIDEBAR DESKTOP */}
          <div className="hidden md:block">
            <div className="sticky top-20">
              <FolderSidebar {...sidebarProps} />
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
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <FolderSidebar
                  {...sidebarProps}
                  onChangeView={(v) => { setView(v); setMobileSidebarOpen(false); }}
                />
              </div>
            </div>
          )}

          {/* CONTEÚDO PRINCIPAL */}
          <main className="min-w-0">
            {/* Título + busca */}
            <div className="mb-4 flex items-end justify-between gap-3 flex-wrap">
              <div>
                <h2 className="text-xl font-bold text-white">{viewTitle}</h2>
                <div className="text-xs text-slate-500 uppercase tracking-wider mt-0.5">
                  {filtered.length} encontro(s)
                  {filtered.length > 0 && (
                    <span className="ml-2 text-slate-600">· Arraste para reordenar</span>
                  )}
                </div>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar encontro..."
                  className="w-full h-9 bg-slate-900/60 border border-slate-800 rounded pl-9 pr-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* Chips de status */}
            {manager.encounters.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 w-full mb-4">
                {STATUS_ORDER.map((status) => {
                  const theme = STATUS_THEMES[status];
                  const active = activeStatusFilters.has(status);
                  const Icon = theme.icon;
                  return (
                    <button
                      key={status}
                      type="button"
                      onClick={() => toggleFilter(status)}
                      className={`flex-1 min-w-[100px] h-9 whitespace-nowrap inline-flex items-center justify-center gap-1.5 px-3 rounded-full text-xs font-semibold border transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500/60 ${
                        active
                          ? `${theme.badge} ring-1 ring-purple-500/60`
                          : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                      }`}
                      aria-pressed={active}
                    >
                      <Icon className="w-3 h-3" />
                      {theme.label}
                      <span className="opacity-70 tabular-nums">({statusCounts[status]})</span>
                    </button>
                  );
                })}
                {hasFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs text-slate-500 hover:text-slate-300 focus:outline-none"
                  >
                    <X className="w-3 h-3" /> Limpar
                  </button>
                )}
              </div>
            )}

            {/* Barra de ações em lote */}
            <BulkActionBar
              count={selected.size}
              folders={folders}
              onMove={handleBulkMove}
              onDelete={handleBulkDelete}
              onClear={clearSelection}
            />

            {/* Grid de encontros */}
            {manager.encounters.length === 0 ? (
              <EmptyState onCreate={handleCreate} />
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 text-slate-500 border border-dashed border-slate-800 rounded-lg bg-slate-900/30">
                <Search className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                <p className="text-sm">Nenhum encontro combina com os filtros.</p>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-3 text-xs text-purple-400 hover:text-purple-300 underline focus:outline-none"
                >
                  Limpar filtros
                </button>
              </div>
            ) : (
              <SortableContext items={filtered.map((e) => e.id)} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(360px,1fr))] gap-6">
                  {filtered.map((enc) => (
                    <SortableEncounterCard
                      key={enc.id}
                      encounter={enc}
                      folders={folders}
                      selected={selected.has(enc.id)}
                      onOpen={() => onOpenEncounter(enc.id)}
                      onDuplicate={() => manager.duplicate(enc.id)}
                      onDelete={() => setConfirmDelete(enc)}
                      onMove={(folderId) => manager.moveToFolder(enc.id, folderId)}
                      onRename={(name) => manager.update(enc.id, { name })}
                      onToggleSelect={toggleSelect}
                    />
                  ))}
                </div>
              </SortableContext>
            )}
          </main>
        </div>
      </div>

      {/* DRAG OVERLAY */}
      <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
        {activeId && (
          <EncounterDragOverlay
            encounter={activeEncounter}
            count={isDraggingMultiple ? selected.size : 1}
          />
        )}
      </DragOverlay>

      {/* CONFIRM DELETE */}
      <ConfirmDeleteModal
        target={confirmDelete}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </DndContext>
  );
}
