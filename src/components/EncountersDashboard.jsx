// components/EncountersDashboard.jsx
import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  ArrowLeft, Plus, Search, MoreVertical, Play, Copy, Trash2,
  Swords, Flag, Trophy, X, AlertTriangle, Folder,
  Edit3, Menu, FolderInput, Filter, CheckSquare, Check, ChevronDown
} from 'lucide-react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
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
import StorageMeter from './StorageMeter';

// ============================================================
// CHECKBOX CUSTOMIZADO (tema RPG, Shift+click para range)
// ============================================================
const CustomCheckbox = ({ checked, onToggle }) => (
  <button
    type="button"
    role="checkbox"
    aria-checked={checked}
    onClick={(e) => { e.stopPropagation(); onToggle(e.shiftKey); }}
    className={`flex items-center justify-center w-4 h-4 rounded border transition-all duration-150 focus:outline-none focus:ring-1 focus:ring-purple-500/60 ${
      checked
        ? 'bg-purple-600 border-purple-600'
        : 'bg-slate-900/80 border-slate-600 hover:border-slate-400'
    }`}
  >
    {checked && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
  </button>
);

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
// ACTION MENU
// ============================================================
const ActionMenu = ({ encounter, folders = [], onOpen, onDuplicate, onDelete, onMove, onRename }) => {
  const [open, setOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const ref = useRef(null);
  const theme = STATUS_THEMES[encounter.status] ?? STATUS_THEMES.planning;

  const closeAll = () => { setOpen(false); setMoveOpen(false); };

  return (
    <div className="relative flex-shrink-0" ref={ref} onPointerDown={(e) => e.stopPropagation()}>
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
            <button type="button" onClick={(e) => { e.stopPropagation(); closeAll(); onOpen(); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left text-slate-200 hover:bg-slate-900 focus:outline-none">
              <Play className="w-3.5 h-3.5" /> {theme.cta}
            </button>
            <button type="button" onClick={(e) => { e.stopPropagation(); closeAll(); onDuplicate(); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left text-slate-200 hover:bg-slate-900 focus:outline-none">
              <Copy className="w-3.5 h-3.5" /> Duplicar
            </button>
            <button type="button" onClick={(e) => {
                e.stopPropagation(); closeAll();
                const newName = window.prompt('Novo nome do encontro:', encounter.name);
                if (newName && newName.trim()) onRename(newName.trim());
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left text-slate-200 hover:bg-slate-900 focus:outline-none">
              <Edit3 className="w-3.5 h-3.5" /> Renomear
            </button>
            {folders.length > 0 && (
              <div className="relative">
                <button type="button" onClick={(e) => { e.stopPropagation(); setMoveOpen((v) => !v); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left text-slate-200 hover:bg-slate-900 focus:outline-none">
                  <FolderInput className="w-3.5 h-3.5" /> Mover para...
                </button>
                {moveOpen && (
                  <div className="absolute right-full top-0 mr-1 w-48 z-30">
                    <MoveToFolderMenu folders={folders} currentFolderId={encounter.folderId ?? null}
                      onMove={(folderId) => { onMove(folderId); closeAll(); }} />
                  </div>
                )}
              </div>
            )}
            <div className="border-t border-slate-800" />
            <button type="button" onClick={(e) => { e.stopPropagation(); closeAll(); onDelete(); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left text-red-400 hover:bg-red-950/40 focus:outline-none">
              <Trash2 className="w-3.5 h-3.5" /> Excluir
            </button>
          </div>
        </>
      )}
    </div>
  );
};

// ============================================================
// ENCOUNTER CARD
// ============================================================
const EncounterCard = ({
  encounter, folders = [], selected, isSelectionMode,
  onOpen, onDuplicate, onDelete, onMove, onRename, onToggleSelect,
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
      onClick={(e) => {
        if (isSelectionMode) {
          onToggleSelect?.(encounter.id, e.shiftKey);
        } else {
          onOpen();
        }
      }}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), isSelectionMode ? onToggleSelect?.(encounter.id, false) : onOpen())}
      tabIndex={0}
      role="button"
      aria-label={`Abrir encontro ${encounter.name}`}
      className={`bg-slate-900/60 border rounded-lg p-4 transition-all group focus:outline-none focus:ring-2 focus:ring-purple-500/60 ${theme.cardAccent} ${
        isDraggable ? (isDragging ? 'cursor-grabbing opacity-30' : 'cursor-grab') : 'cursor-pointer'
      } ${selected ? 'ring-2 ring-purple-500/60 bg-purple-950/10' : ''}`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* onPointerDown.stop só no checkbox — não bloqueia drag do título */}
          <div
            className={`transition-opacity duration-150 flex-shrink-0 ${
              selected || isSelectionMode ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus-within:opacity-100'
            }`}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <CustomCheckbox
              checked={!!selected}
              onToggle={(shiftKey) => onToggleSelect?.(encounter.id, shiftKey)}
            />
          </div>
          <span className={`w-1.5 h-1.5 rounded-full ${theme.dot} flex-shrink-0`} aria-hidden="true" />
          <h3 className="flex-1 min-w-0 text-sm font-bold text-white truncate group-hover:text-purple-200 transition-colors">
            {encounter.name}
          </h3>
        </div>
        <ActionMenu encounter={encounter} folders={folders} onOpen={onOpen}
          onDuplicate={onDuplicate} onDelete={onDelete} onMove={onMove} onRename={onRename} />
      </div>

      <div className="mb-3">
        <StatusBadge status={encounter.status} />
      </div>

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
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: props.encounter.id });

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
        <div className="absolute -top-2.5 -right-2.5 z-10 min-w-[1.4rem] h-6 px-1.5 bg-purple-600 border-2 border-slate-950 rounded-full flex items-center justify-center shadow-lg">
          <span className="text-[11px] font-black text-white leading-none">{count}</span>
        </div>
        <div className="absolute inset-0 rotate-2 translate-x-2 translate-y-2 bg-slate-800 rounded-lg border border-slate-700 opacity-50" />
        <div className="absolute inset-0 rotate-1 translate-x-1 translate-y-1 bg-slate-800/80 rounded-lg border border-slate-700 opacity-70" />
        <div className="relative bg-slate-900 border border-purple-500/60 rounded-lg p-4 shadow-2xl ring-2 ring-purple-500/50">
          <div className="flex items-center gap-2">
            <Swords className="w-4 h-4 text-purple-400 flex-shrink-0" />
            <span className="text-sm font-bold text-white">Movendo {count} encontros</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Solte em pasta ou encontro para mover/reordenar</p>
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
const BulkActionBar = ({ count, folders, onMove, onDelete, onClear, top }) => {
  const [moveOpen, setMoveOpen] = useState(false);
  if (count === 0) return null;

  return (
    <div
      className="sticky z-30 bg-purple-950/80 backdrop-blur border border-purple-800 rounded-lg px-4 py-2 flex items-center gap-3 flex-wrap mb-4 shadow-lg"
      style={{ top: top ?? 72 }}
    >
      <span className="text-sm font-semibold text-purple-100">{count} selecionado(s)</span>
      <div className="flex items-center gap-2 ml-auto flex-wrap">
        <div className="relative">
          <button type="button" onClick={() => setMoveOpen(!moveOpen)}
            className="inline-flex items-center gap-1 px-3 py-1 rounded bg-slate-900/80 hover:bg-slate-800 text-xs font-semibold text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/60">
            <FolderInput className="w-3 h-3" /> Mover
          </button>
          {moveOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMoveOpen(false)} />
              <div className="absolute right-0 top-full mt-1 w-48 z-20">
                <MoveToFolderMenu folders={folders} isBulk
                  onMove={(folderId) => { onMove(folderId); setMoveOpen(false); }} />
              </div>
            </>
          )}
        </div>
        <button type="button" onClick={onDelete}
          className="inline-flex items-center gap-1 px-3 py-1 rounded bg-red-900/60 hover:bg-red-800 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-red-500">
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onCancel} role="dialog" aria-modal="true">
      <div className="bg-slate-900 border border-red-900/60 rounded-lg p-6 max-w-md w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}>
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
          <button type="button" onClick={onCancel}
            className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-sm font-semibold text-slate-200">
            Cancelar
          </button>
          <button type="button" onClick={onConfirm} autoFocus
            className="px-4 py-2 rounded bg-red-800 hover:bg-red-700 text-sm font-semibold text-white">
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
    <button type="button" onClick={onCreate}
      className="inline-flex items-center gap-1.5 px-4 py-2 rounded bg-purple-800 hover:bg-purple-700 text-sm font-bold text-white">
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
  creatures = [],
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
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sortOrder, setSortOrder] = useState('manual');

  // Sticky dinâmico: mede altura real do header
  const headerRef = useRef(null);
  const [headerH, setHeaderH] = useState(80);
  useEffect(() => {
    if (!headerRef.current) return;
    const obs = new ResizeObserver(() => {
      if (headerRef.current) setHeaderH(headerRef.current.offsetHeight);
    });
    obs.observe(headerRef.current);
    setHeaderH(headerRef.current.offsetHeight);
    return () => obs.disconnect();
  }, []);

  const lastSelectedIdRef = useRef(null);

  // ── DnD state ──
  const [activeId, setActiveId] = useState(null);
  const [isDraggingMultiple, setIsDraggingMultiple] = useState(false);
  const isDraggingMultipleRef = useRef(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    // Long press de 200ms libera scroll vertical no celular
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
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

  // ── Counts por status ──
  const statusCounts = useMemo(() => {
    const acc = { planning: 0, active: 0, finished: 0 };
    manager.encounters.forEach((e) => { acc[e.status] = (acc[e.status] ?? 0) + 1; });
    return acc;
  }, [manager.encounters]);

  // ── Lista filtrada + ordenada ──
  const filtered = useMemo(() => {
    const filterFn = ENC_VIEW_FILTERS[view.type] ?? ENC_VIEW_FILTERS.all;
    const ctx = { folderId: view.folderId };
    const q = search.toLowerCase().trim();
    const result = manager.encounters.filter((e) => {
      if (!filterFn(e, ctx)) return false;
      if (activeStatusFilters.size > 0 && !activeStatusFilters.has(e.status)) return false;
      if (q && !e.name.toLowerCase().includes(q)) return false;
      return true;
    });
    if (sortOrder === 'recent') return [...result].sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
    if (sortOrder === 'oldest') return [...result].sort((a, b) => (a.updatedAt ?? 0) - (b.updatedAt ?? 0));
    if (sortOrder === 'name')   return [...result].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    return result; // 'manual' — preserva ordem do storage
  }, [manager.encounters, view, activeStatusFilters, search, sortOrder]);

  const activeFolder = useMemo(
    () => view.type === 'folder' ? folders.find((f) => f.id === view.folderId) : null,
    [view, folders]
  );

  const activeEncounter = useMemo(
    () => activeId ? manager.encounters.find((e) => e.id === activeId) ?? null : null,
    [activeId, manager.encounters]
  );

  // ── Seleção ──
  const selectableFiltered = useMemo(() => filtered.map((e) => e.id), [filtered]);
  const allFilteredSelected = selectableFiltered.length > 0 && selectableFiltered.every((id) => selected.has(id));

  const toggleSelect = useCallback((id, shiftKey = false) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (shiftKey && lastSelectedIdRef.current) {
        const ids = filtered.map((e) => e.id);
        const a = ids.indexOf(lastSelectedIdRef.current);
        const b = ids.indexOf(id);
        if (a !== -1 && b !== -1) {
          const [lo, hi] = [Math.min(a, b), Math.max(a, b)];
          ids.slice(lo, hi + 1).forEach((sid) => next.add(sid));
          return next;
        }
      }
      if (next.has(id)) next.delete(id); else next.add(id);
      lastSelectedIdRef.current = id;
      return next;
    });
  }, [filtered]);

  const handleSelectAll = useCallback(() => {
    if (allFilteredSelected) {
      setSelected(new Set());
    } else {
      setIsSelectionMode(true);
      setSelected(new Set(selectableFiltered));
      lastSelectedIdRef.current = selectableFiltered[selectableFiltered.length - 1] ?? null;
    }
  }, [allFilteredSelected, selectableFiltered]);

  const clearSelection = useCallback(() => setSelected(new Set()), []);

  const toggleSelectionMode = useCallback(() => {
    setIsSelectionMode((v) => {
      if (v) setSelected(new Set());
      return !v;
    });
  }, []);

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

    // Reordenação — desabilitada com sort ativo
    if (sortOrder !== 'manual') return;

    if (!wasMulti) {
      const oldIdx = filtered.findIndex((e) => e.id === String(active.id));
      const newIdx = filtered.findIndex((e) => e.id === overId);
      if (oldIdx !== -1 && newIdx !== -1 && oldIdx !== newIdx) {
        const newIds = arrayMove(filtered.map((e) => e.id), oldIdx, newIdx);
        manager.reorderEncounters(newIds);
      }
    } else {
      // Multi-reorder: insere o bloco selecionado na posição do alvo.
      // O índice precisa ser calculado no array SEM os selecionados (rest),
      // não em `filtered` — senão a posição final fica deslocada.
      const selectedIds = new Set(selected);
      const selectedOrdered = filtered.filter((e) => selectedIds.has(e.id)).map((e) => e.id);
      const rest = filtered.filter((e) => !selectedIds.has(e.id)).map((e) => e.id);
      const cleanIdx = rest.indexOf(overId);
      const insertAt = cleanIdx < 0 ? 0 : cleanIdx;
      rest.splice(insertAt, 0, ...selectedOrdered);
      manager.reorderEncounters(rest);
    }
  }, [manager, selected, filtered, clearSelection, sortOrder]);

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
    setSortOrder('manual');
  }, []);

  // Limpa só os filtros sempre visíveis (busca + chips de status)
  const clearVisibleFilters = useCallback(() => {
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

  // Badge do botão Filtro reflete só o conteúdo do painel (ordenação),
  // igual ao Dashboard, onde a busca sempre visível não conta.
  const hasActiveFilters = sortOrder !== 'manual';
  // Filtros sempre visíveis (busca + chips de status) — controlam o "Limpar" da barra de status.
  const hasVisibleFilters = search.length > 0 || activeStatusFilters.size > 0;

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

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetectionStrategy}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950/30 text-white">

        {/* ===== HEADER ===== */}
        <header ref={headerRef} className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur border-b border-purple-900/50">
          <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-3 space-y-2">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 w-full">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMobileSidebarOpen(true)}
                  className="lg:hidden inline-flex items-center justify-center w-9 h-9 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/60"
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

              <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto shrink-0">
                <button type="button" onClick={onBackToGrimoire}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-sm text-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500/60">
                  <ArrowLeft className="w-4 h-4" /> Grimório
                </button>
                <button type="button" onClick={handleCreate}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded bg-purple-800 hover:bg-purple-700 text-sm font-bold text-white transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500">
                  <Plus className="w-4 h-4" /> Novo Encontro
                </button>
              </div>
            </div>

            <StorageMeter creatures={creatures} folders={folders} encounters={manager.encounters} />
          </div>
        </header>

        {/* ===== LAYOUT 2 COLUNAS ===== */}
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">

          {/* SIDEBAR DESKTOP */}
          <div className="hidden lg:block">
            <div className="sticky" style={{ top: headerH + 8 }}>
              <FolderSidebar {...sidebarProps} />
            </div>
          </div>

          {/* DRAWER MOBILE */}
          {mobileSidebarOpen && (
            <div className="lg:hidden fixed inset-0 z-50 bg-black/80"
              onClick={() => setMobileSidebarOpen(false)} role="dialog" aria-modal="true">
              <div className="absolute left-0 top-0 bottom-0 w-72 bg-slate-950 border-r border-slate-800 p-3 overflow-y-auto"
                onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold text-slate-200">Pastas</span>
                  <button type="button" onClick={() => setMobileSidebarOpen(false)}
                    className="w-7 h-7 rounded text-slate-400 hover:text-slate-200 focus:outline-none">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <FolderSidebar {...sidebarProps}
                  onChangeView={(v) => { setView(v); setMobileSidebarOpen(false); }} />
              </div>
            </div>
          )}

          {/* CONTEÚDO PRINCIPAL */}
          <main className="min-w-0">

            {/* ── Título + Toolbar unificada ── */}
            <div className="flex flex-col gap-4 w-full mb-6 border-b border-slate-800/50 pb-4">

              <div className="flex flex-col shrink-0">
                <h2 className="text-xl font-bold text-white">{viewTitle}</h2>
                <span className="text-xs text-slate-500 uppercase tracking-wider mt-0.5">
                  {filtered.length} encontro(s)
                  {filtered.length > 0 && sortOrder === 'manual' && (
                    <span className="ml-2 text-slate-600">· Arraste para reordenar</span>
                  )}
                </span>
              </div>

              {/* Toolbar unificada */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 w-full bg-slate-900/20 p-2 rounded-lg border border-slate-800/40">

                {/* Selecionar tudo — sempre visível; ativa o modo de seleção ao clicar */}
                {selectableFiltered.length > 0 && (
                  <div className="flex items-center gap-2 w-full md:w-auto py-1 md:py-0 shrink-0 select-none border-b border-slate-800/40 md:border-none pb-2 md:pb-0">
                    <button type="button" onClick={handleSelectAll}
                      className="flex items-center gap-2 group focus:outline-none">
                      <CustomCheckbox checked={allFilteredSelected} onToggle={() => handleSelectAll()} />
                      <span className="text-xs text-slate-500 group-hover:text-slate-300 transition-colors whitespace-nowrap">
                        {allFilteredSelected ? 'Limpar seleção' : 'Selecionar tudo'}
                      </span>
                    </button>
                  </div>
                )}

                {/* Busca + Filtros + Modo de seleção */}
                <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end shrink-0 flex-nowrap mt-1 md:mt-0">
                  <div className="relative flex-1 md:flex-initial md:w-64">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Buscar encontro..."
                      className="w-full h-9 bg-slate-900/60 border border-slate-800 rounded pl-9 pr-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500"
                      aria-label="Buscar encontros"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowFilters((v) => !v)}
                    className={`relative h-9 w-9 flex items-center justify-center rounded border transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500/60 shrink-0 ${
                      showFilters || hasActiveFilters
                        ? 'bg-purple-900/60 border-purple-700 text-purple-300'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                    aria-label="Filtros avançados"
                    title="Filtros avançados"
                  >
                    <Filter className="w-4 h-4" />
                    {hasActiveFilters && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-purple-500 rounded-full" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={toggleSelectionMode}
                    className={`inline-flex items-center justify-center gap-1.5 h-9 w-9 xl:w-auto xl:px-3 rounded border text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500/60 shrink-0 ${
                      isSelectionMode
                        ? 'bg-purple-950/60 border-purple-700 text-purple-300 hover:bg-purple-900/60'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                    title={isSelectionMode ? 'Cancelar modo de seleção' : 'Ativar seleção em massa'}
                  >
                    <CheckSquare className="w-4 h-4 shrink-0" />
                    <span className="hidden xl:inline">{isSelectionMode ? 'Cancelar' : 'Selecionar em Massa'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Status chips — sempre visíveis quando há encontros */}
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
                {hasVisibleFilters && (
                  <button type="button" onClick={clearVisibleFilters}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs text-slate-500 hover:text-slate-300 focus:outline-none">
                    <X className="w-3 h-3" /> Limpar
                  </button>
                )}
              </div>
            )}

            {/* Painel de filtros avançados (ordenação) */}
            {showFilters && (
              <div className="mb-4 p-3 bg-slate-900/60 border border-slate-800 rounded-lg flex items-end gap-4 flex-wrap">
                <div className="flex flex-col gap-1.5 min-w-[160px]">
                  <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Ordenar por</label>
                  <div className="relative">
                    <select
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value)}
                      className="w-full h-8 bg-slate-950 border border-slate-700 rounded pl-2 pr-7 text-xs text-slate-200 appearance-none focus:outline-none focus:border-purple-500"
                    >
                      <option value="manual">Ordem manual</option>
                      <option value="recent">Mais recentes</option>
                      <option value="oldest">Mais antigos</option>
                      <option value="name">Nome A–Z</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  </div>
                </div>
                {sortOrder !== 'manual' && (
                  <button type="button" onClick={() => setSortOrder('manual')}
                    className="inline-flex items-center gap-1 px-2 py-1.5 rounded text-xs text-slate-500 hover:text-slate-300 focus:outline-none">
                    <X className="w-3 h-3" /> Resetar ordem
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
              top={headerH}
            />

            {/* Grid de encontros */}
            {manager.encounters.length === 0 ? (
              <EmptyState onCreate={handleCreate} />
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 text-slate-500 border border-dashed border-slate-800 rounded-lg bg-slate-900/30">
                <Search className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                <p className="text-sm">Nenhum encontro combina com os filtros.</p>
                <button type="button" onClick={clearFilters}
                  className="mt-3 text-xs text-purple-400 hover:text-purple-300 underline focus:outline-none">
                  Limpar filtros
                </button>
              </div>
            ) : (
              <SortableContext items={filtered.map((e) => e.id)} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 px-1 items-start">
                  {filtered.map((enc) => {
                    const isGhosted = activeId !== null && selected.has(enc.id) && selected.has(activeId);
                    return (
                      <div key={enc.id} className={isGhosted ? 'opacity-0 pointer-events-none' : undefined}>
                        <SortableEncounterCard
                          encounter={enc}
                          folders={folders}
                          selected={selected.has(enc.id)}
                          isSelectionMode={isSelectionMode}
                          onOpen={() => onOpenEncounter(enc.id)}
                          onDuplicate={() => manager.duplicate(enc.id)}
                          onDelete={() => setConfirmDelete(enc)}
                          onMove={(folderId) => manager.moveToFolder(enc.id, folderId)}
                          onRename={(name) => manager.update(enc.id, { name })}
                          onToggleSelect={toggleSelect}
                        />
                      </div>
                    );
                  })}
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
