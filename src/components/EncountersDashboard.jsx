// components/EncountersDashboard.jsx
// Tela de listagem de encontros. Análoga ao Dashboard principal,
// mas focada em encounters em vez de creatures.

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  ArrowLeft, Plus, Search, MoreVertical, Play, Copy, Trash2,
  Swords, Flag, Trophy, X, AlertTriangle, Clock, Users, Folder, Edit3
} from 'lucide-react';
import { ENCOUNTER_STATUS } from '../fm-encounter';
import MoveToFolderMenu from './MoveToFolderMenu';

// ============================================================
// DICIONÁRIOS (regra de ouro #1)
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
  ENCOUNTER_STATUS.FINISHED
];

// ============================================================
// HELPERS
// ============================================================
const relativeDate = (ts) => {
  if (!ts) return '—';
  const diff = Date.now() - ts;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return 'agora';
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;
  return new Date(ts).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
};

const countBySide = (combatants) => {
  const acc = { enemy: 0, pc: 0, ally: 0 };
  combatants.forEach((c) => {
    acc[c.flags?.side] = (acc[c.flags?.side] ?? 0) + 1;
  });
  return acc;
};

// ============================================================
// ACTION MENU (três pontos)
// ============================================================
const ActionMenu = ({ encounter, folders = [], onOpen, onDuplicate, onDelete, onMove, onRename }) => {
  const [open, setOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const ref = useRef(null);
  const theme = STATUS_THEMES[encounter.status] ?? STATUS_THEMES.planning;

  useEffect(() => {
    if (!open) { setMoveOpen(false); return; }
    const close = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const closeAll = () => { setOpen(false); setMoveOpen(false); };

  return (
    <div className="relative flex-shrink-0" ref={ref}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="inline-flex items-center justify-center w-7 h-7 rounded text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-colors focus:outline-none focus:ring-1 focus:ring-purple-500/40"
        aria-label="Menu de ações"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && (
        <div
          className="absolute right-0 top-full mt-1 w-48 bg-slate-950 border border-slate-800 rounded-md shadow-xl z-20 overflow-hidden"
          role="menu"
        >
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); closeAll(); onOpen(); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left text-slate-200 hover:bg-slate-900 transition-colors focus:outline-none focus:bg-slate-900"
            role="menuitem"
          >
            <Play className="w-3.5 h-3.5" /> {theme.cta}
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); closeAll(); onDuplicate(); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left text-slate-200 hover:bg-slate-900 transition-colors focus:outline-none focus:bg-slate-900"
            role="menuitem"
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
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left text-slate-200 hover:bg-slate-900 transition-colors focus:outline-none focus:bg-slate-900"
            role="menuitem"
          >
            <Edit3 className="w-3.5 h-3.5" /> Renomear
          </button>
          {folders.length > 0 && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setMoveOpen((v) => !v); }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors focus:outline-none focus:bg-slate-900 ${
                  moveOpen ? 'bg-slate-900 text-purple-300' : 'text-slate-200 hover:bg-slate-900'
                }`}
                role="menuitem"
              >
                <Folder className="w-3.5 h-3.5" /> Mover para Pasta
              </button>
              {moveOpen && (
                <MoveToFolderMenu
                  folders={folders}
                  currentFolderId={encounter.folderId ?? null}
                  onMove={(folderId) => { onMove(folderId); closeAll(); }}
                />
              )}
            </>
          )}
          <div className="border-t border-slate-800 mt-0.5" />
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); closeAll(); onDelete(); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left text-red-400 hover:bg-red-950/40 transition-colors focus:outline-none focus:bg-red-950/40"
            role="menuitem"
          >
            <Trash2 className="w-3.5 h-3.5" /> Excluir
          </button>
        </div>
      )}
    </div>
  );
};

// ============================================================
// STATUS BADGE
// ============================================================
const StatusBadge = ({ status }) => {
  const theme = STATUS_THEMES[status] ?? STATUS_THEMES.planning;
  const Icon = theme.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold border ${theme.badge}`}
    >
      <Icon className="w-3 h-3" /> {theme.label}
    </span>
  );
};

// ============================================================
// ENCOUNTER CARD
// ============================================================
const EncounterCard = ({ encounter, folders = [], onOpen, onDuplicate, onDelete, onMove, onRename }) => {
  const theme = STATUS_THEMES[encounter.status] ?? STATUS_THEMES.planning;
  const sideCount = useMemo(() => countBySide(encounter.combatants), [encounter.combatants]);
  const totalCombatants = encounter.combatants.length;
  const folderName = encounter.folderId
    ? (folders.find((f) => String(f.id) === String(encounter.folderId))?.name ?? null)
    : null;

  return (
    <article
      onClick={onOpen}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onOpen())}
      tabIndex={0}
      role="button"
      aria-label={`Abrir encontro ${encounter.name}`}
      className={`bg-slate-900/60 border rounded-lg p-4 transition-all cursor-pointer group focus:outline-none focus:ring-2 focus:ring-purple-500/60 ${theme.cardAccent}`}
    >
      {/* Folder badge */}
      {folderName && (
        <div className="inline-flex items-center gap-1 bg-slate-800 text-slate-300 px-2 py-1 mb-2 rounded-md text-xs font-medium w-fit max-w-full">
          <Folder className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{folderName}</span>
        </div>
      )}
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span
            className={`w-1.5 h-1.5 rounded-full ${theme.dot} flex-shrink-0`}
            aria-hidden="true"
          />
          <h3 className="text-base font-bold text-white truncate group-hover:text-purple-200 transition-colors">
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
      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800">
        <div>
          <div className="flex items-center gap-1 text-[9px] uppercase tracking-wider text-slate-500 mb-0.5">
            <Clock className="w-2.5 h-2.5" /> Rodada
          </div>
          <div className="text-lg font-bold text-white tabular-nums">{encounter.round}</div>
        </div>
        <div>
          <div className="flex items-center gap-1 text-[9px] uppercase tracking-wider text-slate-500 mb-0.5">
            <Users className="w-2.5 h-2.5" /> Combatentes
          </div>
          <div className="text-lg font-bold text-white tabular-nums">{totalCombatants}</div>
          {totalCombatants > 0 && (
            <div className="text-[10px] text-slate-500 tabular-nums mt-0.5">
              {sideCount.enemy > 0 && <span className="text-rose-400">{sideCount.enemy}I</span>}
              {sideCount.enemy > 0 && sideCount.pc > 0 && <span className="text-slate-700"> · </span>}
              {sideCount.pc > 0 && <span className="text-sky-400">{sideCount.pc}P</span>}
              {(sideCount.enemy > 0 || sideCount.pc > 0) && sideCount.ally > 0 && <span className="text-slate-700"> · </span>}
              {sideCount.ally > 0 && <span className="text-emerald-400">{sideCount.ally}A</span>}
            </div>
          )}
        </div>
        <div>
          <div className="text-[9px] uppercase tracking-wider text-slate-500 mb-0.5">Atualizado</div>
          <div className="text-sm font-bold text-slate-300 tabular-nums">
            {relativeDate(encounter.updatedAt)}
          </div>
        </div>
      </div>
    </article>
  );
};

// ============================================================
// CONFIRM MODAL (inline, minimalista)
// ============================================================
const ConfirmDeleteModal = ({ encounter, onConfirm, onCancel }) => {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onCancel();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onCancel]);

  if (!encounter) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-in fade-in"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
    >
      <div
        className="bg-slate-900 border border-red-900/60 rounded-lg p-6 max-w-md w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-red-950/60 border border-red-900/60 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div className="min-w-0">
            <h3 id="confirm-title" className="text-lg font-bold text-white mb-1">
              Excluir encontro?
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              <span className="text-slate-200 font-semibold">"{encounter.name}"</span> será
              permanentemente removido. Esta ação não pode ser desfeita.
            </p>
          </div>
        </div>
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
            onClick={onConfirm}
            autoFocus
            className="px-4 py-2 rounded bg-red-800 hover:bg-red-700 text-sm font-semibold text-white transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
          >
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
      className="inline-flex items-center gap-1.5 px-4 py-2 rounded bg-purple-800 hover:bg-purple-700 text-sm font-bold text-white transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
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
  onOpenEncounter,
  onBackToGrimoire
}) {
  const [search, setSearch] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('__all__');
  const [activeStatusFilters, setActiveStatusFilters] = useState(() => new Set());
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Contagem por status (pros chips)
  const counts = useMemo(() => {
    const acc = { planning: 0, active: 0, finished: 0 };
    manager.encounters.forEach((e) => {
      acc[e.status] = (acc[e.status] ?? 0) + 1;
    });
    return acc;
  }, [manager.encounters]);

  // Lista filtrada + ordenada (pasta → status → busca → data)
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    const list = manager.encounters.filter((e) => {
      // 1. Filtro de pasta (String() para evitar mismatch number/string)
      if (selectedFolder === '__unfiled__' && e.folderId != null) return false;
      if (selectedFolder !== '__all__' && selectedFolder !== '__unfiled__' && String(e.folderId) !== String(selectedFolder)) return false;
      // 2. Filtro de status
      if (activeStatusFilters.size > 0 && !activeStatusFilters.has(e.status)) return false;
      // 3. Busca textual
      if (q && !e.name.toLowerCase().includes(q)) return false;
      return true;
    });

    // Dicionário de prioridades pra ordenação (ativos no topo)
    const STATUS_PRIORITY = { active: 0, planning: 1, finished: 2 };

    return list.sort((a, b) => {
      const pa = STATUS_PRIORITY[a.status] ?? 99;
      const pb = STATUS_PRIORITY[b.status] ?? 99;
      if (pa !== pb) return pa - pb;
      return (b.updatedAt ?? 0) - (a.updatedAt ?? 0);
    });
  }, [manager.encounters, search, activeStatusFilters, selectedFolder]);

  // Handlers
  const toggleFilter = useCallback((status) => {
    setActiveStatusFilters((prev) => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setSearch('');
    setSelectedFolder('__all__');
    setActiveStatusFilters(new Set());
  }, []);

  const handleCreateNew = useCallback(() => {
    const fresh = manager.create({ name: 'Novo Encontro' });
    onOpenEncounter(fresh.id);
  }, [manager, onOpenEncounter]);

  const handleConfirmDelete = useCallback(() => {
    if (!confirmDelete) return;
    manager.remove(confirmDelete.id);
    setConfirmDelete(null);
  }, [confirmDelete, manager]);

  const hasFilters = search.length > 0 || selectedFolder !== '__all__' || activeStatusFilters.size > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950/30 text-white">
      {/* ===== HEADER ===== */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur border-b border-purple-900/50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={onBackToGrimoire}
            className="flex items-center gap-2 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-sm text-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500/60"
            aria-label="Voltar ao Grimório"
          >
            <ArrowLeft className="w-4 h-4" /> Grimório
          </button>

          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <Swords className="w-5 h-5 text-purple-400" />
              Encontros
            </h1>
            <div className="text-xs text-slate-500 uppercase tracking-wider">
              {manager.encounters.length} total
              {counts.active > 0 && (
                <span className="text-purple-400 ml-2">• {counts.active} em combate</span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleCreateNew}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded bg-purple-800 hover:bg-purple-700 text-sm font-bold text-white transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <Plus className="w-4 h-4" /> Novo Encontro
          </button>
        </div>
      </header>

      {/* ===== CONTEÚDO ===== */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Busca + chips — só renderiza se houver algo */}
        {manager.encounters.length > 0 && (
          <div className="mb-6 space-y-3">
            <div className="flex gap-2 flex-wrap">
              <div className="relative flex-1 min-w-0 basis-48">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar encontro por nome..."
                  className="w-full h-10 bg-slate-900/60 border border-slate-800 rounded-lg pl-10 pr-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/40"
                  aria-label="Buscar encontros"
                />
              </div>
              {folders.length > 0 && (
                <select
                  value={selectedFolder}
                  onChange={(e) => setSelectedFolder(e.target.value)}
                  className="flex-shrink-0 h-10 bg-slate-900/60 border border-slate-800 rounded-lg px-3 text-sm text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/40"
                  aria-label="Filtrar por pasta"
                >
                  <option value="__all__">Todas as Pastas</option>
                  <option value="__unfiled__">Sem Pasta</option>
                  {folders.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {STATUS_ORDER.map((status) => {
                const theme = STATUS_THEMES[status];
                const active = activeStatusFilters.has(status);
                const Icon = theme.icon;
                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => toggleFilter(status)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500/60 ${
                      active
                        ? `${theme.badge} ring-1 ring-purple-500/60`
                        : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                    }`}
                    aria-pressed={active}
                  >
                    <Icon className="w-3 h-3" />
                    {theme.label}
                    <span className="opacity-70 tabular-nums">({counts[status]})</span>
                  </button>
                );
              })}
              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs text-slate-500 hover:text-slate-300 transition-colors focus:outline-none focus:ring-1 focus:ring-purple-500/40"
                >
                  <X className="w-3 h-3" /> Limpar
                </button>
              )}
            </div>
          </div>
        )}

        {/* Grid / Empty States */}
        {manager.encounters.length === 0 ? (
          <EmptyState onCreate={handleCreateNew} />
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-500 border border-dashed border-slate-800 rounded-lg bg-slate-900/30">
            <Search className="w-8 h-8 text-slate-700 mx-auto mb-3" />
            <p className="text-sm">Nenhum encontro combina com os filtros.</p>
            <button
              type="button"
              onClick={clearFilters}
              className="mt-3 text-xs text-purple-400 hover:text-purple-300 underline focus:outline-none focus:ring-1 focus:ring-purple-500/40 rounded"
            >
              Limpar filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filtered.map((enc) => (
              <EncounterCard
                key={enc.id}
                encounter={enc}
                folders={folders}
                onOpen={() => onOpenEncounter(enc.id)}
                onDuplicate={() => manager.duplicate(enc.id)}
                onDelete={() => setConfirmDelete(enc)}
                onMove={(folderId) => manager.moveToFolder(enc.id, folderId)}
                onRename={(name) => manager.update(enc.id, { name })}
              />
            ))}
          </div>
        )}
      </main>

      <ConfirmDeleteModal
        encounter={confirmDelete}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}