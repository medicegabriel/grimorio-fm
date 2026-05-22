// Dashboard.jsx
import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import {
  Search, Plus, Upload, Download, Trash2, Copy, Edit3,
  X, AlertTriangle, MoreVertical, Users, Image,
  FolderInput, Swords, Menu, Lock, Check, ChevronDown, Filter, CheckSquare
} from "lucide-react";
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
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import FolderSidebar from "./FolderSidebar";
import MoveToFolderMenu from "./MoveToFolderMenu";
import { exportCreaturesToFile, importFromFile, parseImportText, serializeExport } from "./io-utils";
import StorageMeter from "./StorageMeter";

// ============================================================
// CHECKBOX CUSTOMIZADO (tema RPG)
// onToggle(shiftKey: boolean) é chamado ao clicar
// ============================================================
const CustomCheckbox = ({ checked, onToggle, showTooltip = false }) => (
  <div className="relative group/cb">
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={(e) => { e.stopPropagation(); onToggle(e.shiftKey); }}
      className={`flex items-center justify-center w-4 h-4 rounded border transition-all duration-150 focus:outline-none focus:ring-1 focus:ring-purple-500/60 ${
        checked
          ? "bg-purple-600 border-purple-600"
          : "bg-slate-900/80 border-slate-600 hover:border-slate-400"
      }`}
    >
      {checked && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
    </button>
    {showTooltip && (
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 pointer-events-none opacity-0 group-hover/cb:opacity-100 transition-opacity duration-150 z-50 whitespace-nowrap">
        <div className="bg-slate-900 border border-slate-700/60 text-xs text-slate-300 px-2 py-1.5 rounded shadow-lg">
          Dica: Shift + Clique para selecionar um intervalo
        </div>
      </div>
    )}
  </div>
);

// ============================================================
// DICIONÁRIOS DE ESTILO
// ============================================================
const PATAMAR_STYLES = {
  lacaio:     { label: "Lacaio",     badge: "bg-slate-800 text-slate-300 border-slate-700",      accent: "border-l-slate-600" },
  capanga:    { label: "Capanga",    badge: "bg-zinc-800 text-zinc-200 border-zinc-700",          accent: "border-l-zinc-500" },
  comum:      { label: "Comum",      badge: "bg-sky-950 text-sky-300 border-sky-800",             accent: "border-l-sky-600" },
  desafio:    { label: "Desafio",    badge: "bg-amber-950 text-amber-300 border-amber-800",       accent: "border-l-amber-600" },
  calamidade: { label: "Calamidade", badge: "bg-red-950 text-red-300 border-red-800",             accent: "border-l-red-600" },
};

const VIEW_TITLE = {
  all: () => "Todas as Criaturas",
  unfiled: () => "Sem Pasta",
  builtins: () => "Criaturas Base do Sistema",
  folder: (folder) => folder?.name ?? "Pasta",
};

const VIEW_FILTERS = {
  all:      (c) => !c.isBuiltIn,
  unfiled:  (c) => !c.isBuiltIn && (c.folderId == null),
  folder:   (c, ctx) => !c.isBuiltIn && c.folderId === ctx.folderId,
  builtins: (c) => !!c.isBuiltIn,
};

// ============================================================
// AVATAR DE CRIATURA
// ============================================================
const CreatureAvatar = ({ imageUrl, name }) => {
  const [failed, setFailed] = useState(false);
  if (!imageUrl || failed) {
    return (
      <div className="w-14 h-14 rounded-md border border-slate-700/50 shrink-0 bg-slate-800 flex items-center justify-center">
        <Image className="w-6 h-6 text-slate-600" />
      </div>
    );
  }
  return (
    <img
      src={imageUrl}
      alt={name}
      className="w-14 h-14 rounded-md border border-slate-700/50 shrink-0 object-cover object-center"
      onError={() => setFailed(true)}
    />
  );
};

// ============================================================
// CARTÃO DE CRIATURA
// Quando sortableRef/sortableListeners são passados, o card inteiro é arrastável.
// onPointerDown com stopPropagation nos controles previne conflito com o DnD.
// ============================================================
const CreatureCard = ({
  creature, selected, folders, isSelectionMode,
  onToggleSelect, onOpen, onEdit, onDuplicate, onExport, onDelete, onMove,
  // Props de DnD (passadas pelo SortableCreatureCard)
  sortableRef, sortableStyle, sortableAttributes, sortableListeners, isDragging,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const patamarStyle = PATAMAR_STYLES[creature.core?.patamar] ?? PATAMAR_STYLES.comum;
  const isBuiltIn = !!creature.isBuiltIn;
  const isDraggable = !isBuiltIn && !!sortableListeners;

  const handleCardClick = useCallback((e) => {
    if (menuOpen || moveOpen) return;
    if (isSelectionMode && !isBuiltIn) {
      onToggleSelect(creature.id, e?.shiftKey ?? false);
    } else {
      onOpen(creature.id);
    }
  }, [menuOpen, moveOpen, isSelectionMode, isBuiltIn, onToggleSelect, onOpen, creature.id]);

  const showSelect = !isBuiltIn;

  return (
    <article
      ref={sortableRef}
      style={sortableStyle}
      {...(isDraggable ? sortableAttributes : {})}
      {...(isDraggable ? sortableListeners : {})}
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), handleCardClick(e))}
      className={`relative bg-slate-900/60 border-l-4 ${patamarStyle.accent} border-r border-y border-slate-800 rounded-lg p-3 transition-all group focus:outline-none focus:ring-2 focus:ring-purple-500/60 ${
        isDraggable ? (isDragging ? "cursor-grabbing opacity-30" : "cursor-grab") : "cursor-pointer"
      } ${selected ? "ring-2 ring-purple-500/60 bg-purple-950/20" : "hover:border-slate-700"} ${isBuiltIn ? "opacity-95" : ""}`}
    >
      <div className="flex items-start gap-4">
        <div className="mt-1 shrink-0">
          <CreatureAvatar imageUrl={creature.portraitUrl} name={creature.name} />
        </div>
        <div className="flex-1 min-w-0 flex flex-col">
          {/* ── LINHA SUPERIOR ── */}
          <div className="flex justify-between items-center w-full mb-1.5">
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <h3 className="text-sm font-bold text-white truncate leading-tight">{creature.name}</h3>
              {isBuiltIn && (
                <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-wider text-amber-300 bg-amber-950/60 border border-amber-900/60 px-1.5 py-0.5 rounded font-bold flex-shrink-0">
                  <Lock className="w-2.5 h-2.5" /> Base
                </span>
              )}
            </div>

            {/* Controles: onPointerDown stopPropagation para não iniciar drag */}
            <div
              className="flex items-center gap-2 shrink-0"
              onPointerDown={(e) => e.stopPropagation()}
            >
              {showSelect && (
                <div className={`transition-opacity duration-150 ${isSelectionMode ? "opacity-100" : (selected ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus-within:opacity-100")}`}>
                  <CustomCheckbox
                    checked={selected}
                    onToggle={(shiftKey) => onToggleSelect(creature.id, shiftKey)}
                    showTooltip
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
                            <div className="absolute left-0 sm:left-auto sm:right-0 top-full mt-1 w-56 z-50">
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

          {/* ── SEÇÃO INTERMEDIÁRIA: Patamar + ND + Stats (altura mínima fixa para simetria) ── */}
          <div className="min-h-[44px] flex flex-col justify-between">
            {/* Patamar + ND */}
            <div className="flex items-center gap-1.5 flex-nowrap">
              <span className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded border shrink-0 ${patamarStyle.badge}`}>
                {patamarStyle.label}
              </span>
              <span className="text-[10px] text-slate-500 tabular-nums shrink-0">ND {creature.core?.nd}</span>
            </div>

            {/* Stats resumidas */}
            <div className="flex items-center gap-3 text-[10px] text-slate-500 tabular-nums pt-2 border-t border-slate-800">
              <span>HP {creature.stats?.hpMax ?? 0}</span>
              <span>PE {creature.stats?.peMax ?? 0}</span>
              <span>Def {creature.stats?.defesa ?? 0}</span>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};

// ============================================================
// WRAPPER SORTABLE — injeta props de DnD no CreatureCard
// O article do CreatureCard recebe ref e listeners diretamente.
// ============================================================
const SortableCreatureCard = (props) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.creature.id });

  return (
    <CreatureCard
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
// OVERLAY DE ARRASTO (ghost visual durante o drag)
// ============================================================
const CardDragOverlay = ({ creature, count }) => {
  if (count > 1) {
    return (
      <div className="relative w-64">
        {/* Badge contador roxo */}
        <div className="absolute -top-2.5 -right-2.5 z-10 min-w-[1.4rem] h-6 px-1.5 bg-purple-600 border-2 border-slate-950 rounded-full flex items-center justify-center shadow-lg">
          <span className="text-[11px] font-black text-white leading-none">{count}</span>
        </div>
        {/* Cards empilhados atrás */}
        <div className="absolute inset-0 rotate-2 translate-x-2 translate-y-2 bg-slate-800 rounded-lg border border-slate-700 opacity-60" />
        <div className="absolute inset-0 rotate-1 translate-x-1 translate-y-1 bg-slate-800/80 rounded-lg border border-slate-700 opacity-80" />
        {/* Card principal */}
        <div className="relative bg-slate-900 border border-purple-500/60 rounded-lg p-3 shadow-2xl ring-2 ring-purple-500/50">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-400 flex-shrink-0" />
            <span className="text-sm font-bold text-white">{count} fichas selecionadas</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Solte em uma pasta ou posição</p>
        </div>
      </div>
    );
  }

  if (!creature) return null;
  const patamarStyle = PATAMAR_STYLES[creature.core?.patamar] ?? PATAMAR_STYLES.comum;
  return (
    <div className={`w-64 bg-slate-900/98 border-l-4 ${patamarStyle.accent} border-r border-y border-purple-500/40 rounded-lg p-3 shadow-2xl ring-2 ring-purple-500/50 cursor-grabbing opacity-90`}>
      <h3 className="text-sm font-bold text-white truncate mb-1.5">{creature.name}</h3>
      <div className="flex items-center gap-1.5 mb-2">
        <span className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded border ${patamarStyle.badge}`}>
          {patamarStyle.label}
        </span>
        <span className="text-[10px] text-slate-500 tabular-nums">ND {creature.core?.nd}</span>
      </div>
      <div className="flex items-center gap-3 text-[10px] text-slate-500 tabular-nums pt-2 border-t border-slate-800">
        <span>HP {creature.stats?.hpMax ?? 0}</span>
        <span>PE {creature.stats?.peMax ?? 0}</span>
        <span>Def {creature.stats?.defesa ?? 0}</span>
      </div>
    </div>
  );
};

// ============================================================
// BARRA DE AÇÕES EM LOTE
// ============================================================
const BulkActionBar = ({ count, folders, onExport, onDelete, onMove, onClear, stickyTop = 72 }) => {
  const [moveOpen, setMoveOpen] = useState(false);
  if (count === 0) return null;

  return (
    <div className="sticky z-30 mb-4 shadow-lg" style={{ top: stickyTop }}>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-purple-900 border border-purple-700/60 rounded-lg p-3 w-full">
      <span className="text-sm font-semibold text-purple-100 shrink-0">
        {count} selecionada(s)
      </span>
      <div className="flex items-center flex-wrap gap-2 w-full sm:w-auto justify-center sm:justify-end">
        {/* Mover */}
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
              <div className="absolute left-0 sm:left-auto sm:right-0 top-full mt-1 w-56 z-50">
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
  const [copied, setCopied] = useState(false);
  const taRef = useRef(null);

  // JSON das criaturas atualmente selecionadas — pronto para copiar.
  const jsonText = useMemo(
    () => serializeExport(creatures.filter((c) => sel.has(c.id))),
    [creatures, sel]
  );

  const copyJson = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(jsonText);
    } catch {
      // Fallback (contexto não-seguro / sem permissão): seleciona o texto.
      taRef.current?.select();
      try { document.execCommand("copy"); } catch { /* sem suporte */ }
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [jsonText]);

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
        className="bg-slate-900 border border-slate-800 rounded-lg p-6 max-w-lg w-full shadow-2xl flex flex-col max-h-[85vh]"
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

        {/* Copiar como texto */}
        <div className="mb-3 flex-shrink-0">
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              Copiar como Texto
            </label>
            <button
              type="button"
              onClick={copyJson}
              disabled={sel.size === 0}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-purple-500"
            >
              {copied
                ? <><Check className="w-3.5 h-3.5 text-emerald-400" /> Copiado!</>
                : <><Copy className="w-3.5 h-3.5" /> Copiar JSON</>}
            </button>
          </div>
          <textarea
            ref={taRef}
            readOnly
            value={jsonText}
            onFocus={(e) => e.target.select()}
            rows={4}
            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-[11px] font-mono text-slate-300 resize-none focus:outline-none focus:border-purple-500"
          />
        </div>

        {/* Baixar como arquivo */}
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
              className="flex-1 h-9 bg-slate-950 border border-slate-700 rounded px-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
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
            <Download className="w-4 h-4" /> Baixar ({sel.size})
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// IMPORT MODAL — colar JSON ou escolher arquivo
// ============================================================
const ImportModal = ({ onImport, onCancel }) => {
  const [text, setText] = useState("");
  const [status, setStatus] = useState(null); // { type: "success" | "error", message }
  const fileRef = useRef(null);

  const applyResult = (result) => {
    onImport(result);
    setStatus({
      type: "success",
      message: `${result.creatures.length} criatura(s) importada(s) com sucesso.`,
    });
    setText("");
  };

  const importFromText = () => {
    if (!text.trim()) {
      setStatus({ type: "error", message: "Cole o JSON antes de importar." });
      return;
    }
    try {
      applyResult(parseImportText(text));
    } catch (err) {
      setStatus({ type: "error", message: err.message });
    }
  };

  const handleFile = async (file) => {
    try {
      applyResult(await importFromFile(file));
    } catch (err) {
      setStatus({ type: "error", message: err.message });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-slate-900 border border-slate-800 rounded-lg p-6 max-w-lg w-full shadow-2xl flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-purple-950/60 border border-purple-900/60 flex items-center justify-center flex-shrink-0">
            <Upload className="w-5 h-5 text-purple-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-white">Importar Criaturas</h3>
            <p className="text-sm text-slate-400">Cole o JSON ou escolha um arquivo</p>
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

        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
          Colar JSON
        </label>
        <textarea
          value={text}
          onChange={(e) => { setText(e.target.value); setStatus(null); }}
          rows={9}
          placeholder="Cole aqui o JSON exportado de uma ou mais fichas..."
          className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-[11px] font-mono text-slate-200 placeholder:text-slate-500 resize-none focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
        />

        {status && (
          <div className={`mt-3 flex items-start gap-2 rounded border px-3 py-2 text-xs ${
            status.type === "success"
              ? "bg-emerald-950/50 border-emerald-900 text-emerald-300"
              : "bg-red-950/50 border-red-900 text-red-300"
          }`}>
            {status.type === "success"
              ? <Check className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              : <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />}
            <span className="leading-relaxed">{status.message}</span>
          </div>
        )}

        <div className="flex items-center justify-between gap-2 mt-4 flex-shrink-0">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded bg-slate-800 hover:bg-slate-700 text-sm font-semibold text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/60"
          >
            <Upload className="w-4 h-4" /> Arquivo .json
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = "";
            }}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-sm font-semibold text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/60"
            >
              Fechar
            </button>
            <button
              type="button"
              onClick={importFromText}
              className="inline-flex items-center gap-2 px-4 py-2 rounded bg-purple-800 hover:bg-purple-700 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <Upload className="w-4 h-4" /> Importar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// MAIN
// ============================================================
export default function Dashboard({
  manager,
  compendium = [],
  encounters = [],
  onOpenCreature,
  onEditCreature,
  onCreateNew,
  onGoToEncounters,
}) {
  const [view, setView] = useState({ type: "all", folderId: null });
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(() => new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [exportModal, setExportModal] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ nd: "", patamar: "", grau: "", dificuldade: "", origin: "" });
  const headerRef = useRef(null);
  const [headerH, setHeaderH] = useState(72);

  // ── DnD state ──
  const [activeId, setActiveId] = useState(null);
  const [isDraggingMultiple, setIsDraggingMultiple] = useState(false);
  // Ref evita closure stale no onDragEnd
  const isDraggingMultipleRef = useRef(false);
  // Ancoragem para Shift+Click range selection
  const lastSelectedIndexRef = useRef(-1);

  // Mede a altura real do header (varia por breakpoint) para ancorar elementos sticky
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const update = () => setHeaderH(el.offsetHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      // Long press de 200ms libera scroll vertical no celular
      activationConstraint: { delay: 200, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Detecção de colisão: prioriza pastas (pointer-within), fallback sortable
  const collisionDetectionStrategy = useCallback((args) => {
    const pointerHits = pointerWithin(args);
    const folderHits = pointerHits.filter(({ id }) => {
      const s = String(id);
      return s.startsWith("fld_") || s === "view_unfiled";
    });
    if (folderHits.length > 0) return folderHits;
    return closestCenter(args);
  }, []);

  // União de criaturas (built-ins nunca tocam storage)
  const allCreatures = useMemo(
    () => [...manager.creatures, ...compendium],
    [manager.creatures, compendium]
  );

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

  const uniqueNDs = useMemo(() => {
    const nds = new Set(manager.creatures.filter((c) => c.core?.nd != null).map((c) => c.core.nd));
    return Array.from(nds).sort((a, b) => a - b);
  }, [manager.creatures]);

  const hasActiveFilters = Object.values(filters).some(Boolean);

  const filtered = useMemo(() => {
    const filterFn = VIEW_FILTERS[view.type] ?? VIEW_FILTERS.all;
    const ctx = { folderId: view.folderId };
    const q = search.toLowerCase().trim();
    return allCreatures.filter((c) => {
      if (!filterFn(c, ctx)) return false;
      if (q && !c.name.toLowerCase().includes(q)) return false;
      if (filters.nd && String(c.core?.nd) !== filters.nd) return false;
      if (filters.patamar && c.core?.patamar !== filters.patamar) return false;
      if (filters.grau && c.core?.grau !== filters.grau) return false;
      if (filters.dificuldade && c.core?.difficulty !== filters.dificuldade) return false;
      if (filters.origin && c.core?.origin?.type !== filters.origin) return false;
      return true;
    });
  }, [allCreatures, view, search, filters]);

  const selectableFiltered = useMemo(
    () => filtered.filter((c) => !c.isBuiltIn),
    [filtered]
  );

  const allFilteredSelected = selectableFiltered.length > 0 && selectableFiltered.every((c) => selected.has(c.id));

  const activeFolder = useMemo(
    () => view.type === "folder" ? manager.folders.find((f) => f.id === view.folderId) : null,
    [view, manager.folders]
  );

  // Criatura ativa no drag (para o overlay)
  const activeCreature = useMemo(
    () => activeId ? allCreatures.find((c) => c.id === activeId) ?? null : null,
    [activeId, allCreatures]
  );

  // ===== Handlers de seleção =====
  const toggleSelect = useCallback((id, shiftKey = false) => {
    const idx = selectableFiltered.findIndex((c) => c.id === id);

    if (shiftKey && lastSelectedIndexRef.current >= 0 && idx >= 0) {
      const start = Math.min(lastSelectedIndexRef.current, idx);
      const end = Math.max(lastSelectedIndexRef.current, idx);
      const rangeIds = selectableFiltered.slice(start, end + 1).map((c) => c.id);
      setSelected((prev) => {
        const next = new Set(prev);
        rangeIds.forEach((rid) => next.add(rid));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id); else next.add(id);
        return next;
      });
      if (idx >= 0) lastSelectedIndexRef.current = idx;
    }
  }, [selectableFiltered]);

  const clearSelection = useCallback(() => {
    setSelected(new Set());
    lastSelectedIndexRef.current = -1;
  }, []);

  const toggleSelectionMode = useCallback(() => {
    setIsSelectionMode((prev) => {
      if (prev) {
        setSelected(new Set());
        lastSelectedIndexRef.current = -1;
      }
      return !prev;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (allFilteredSelected) {
      clearSelection();
    } else {
      setIsSelectionMode(true);
      setSelected(new Set(selectableFiltered.map((c) => c.id)));
      lastSelectedIndexRef.current = selectableFiltered.length - 1;
    }
  }, [allFilteredSelected, selectableFiltered, clearSelection]);

  // ===== Handlers de DnD =====
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

    // Drop em pasta ou "Sem Pasta"
    if (overId.startsWith("fld_") || overId === "view_unfiled") {
      const targetFolderId = overId === "view_unfiled" ? null : overId;
      if (wasMulti) {
        manager.moveCreaturesToFolder(Array.from(selected), targetFolderId);
        clearSelection();
      } else {
        manager.moveCreatureToFolder(String(active.id), targetFolderId);
      }
      return;
    }

    // Reordenação
    if (wasMulti) {
      // 1. Separa selecionados (em ordem relativa) e não-selecionados
      const selectedInOrder = filtered.filter((c) => selected.has(c.id)).map((c) => c.id);
      const nonSelected = filtered.filter((c) => !selected.has(c.id)).map((c) => c.id);

      // 2. Encontra o índice real do alvo no array limpo (sem selecionados)
      const cleanIdx = nonSelected.indexOf(overId);

      // 3. Se overId é um item selecionado (cleanIdx === -1) ou é o topo, insere no índice 0;
      //    caso contrário insere na posição cleanIdx (antes do alvo)
      const insertAt = cleanIdx < 0 ? 0 : cleanIdx;

      nonSelected.splice(insertAt, 0, ...selectedInOrder);
      manager.reorderCreatures(nonSelected);
    } else {
      const oldIdx = filtered.findIndex((c) => c.id === String(active.id));
      const newIdx = filtered.findIndex((c) => c.id === overId);
      if (oldIdx !== -1 && newIdx !== -1 && oldIdx !== newIdx) {
        const newIds = arrayMove(filtered.map((c) => c.id), oldIdx, newIdx);
        manager.reorderCreatures(newIds);
      }
    }
  }, [manager, selected, filtered, clearSelection]);

  const handleDragCancel = useCallback(() => {
    isDraggingMultipleRef.current = false;
    setActiveId(null);
    setIsDraggingMultiple(false);
  }, []);

  // ===== Demais handlers =====
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

  // O ImportModal cuida do parse (arquivo ou texto) e do feedback de status.
  // Aqui só aplicamos o resultado já validado ao storage.
  const handleImportResult = useCallback((result) => {
    manager.importMany(result, { mergeStrategy: "append" });
  }, [manager]);

  const viewTitle = view.type === "folder"
    ? VIEW_TITLE.folder(activeFolder)
    : (VIEW_TITLE[view.type] ?? VIEW_TITLE.all)();

  const canCreate = view.type !== "builtins";
  const isSortableView = view.type !== "builtins";

  // Props compartilhadas para os cards
  const cardSharedProps = {
    folders: manager.folders,
    isSelectionMode,
    onToggleSelect: toggleSelect,
    onOpen: onOpenCreature,
    onEdit: onEditCreature,
    onDuplicate: handleDuplicate,
    onExport: handleExportOne,
    onDelete: handleDelete,
    onMove: handleMove,
  };

  const sidebarProps = {
    view,
    onChangeView: setView,
    folders: manager.folders,
    creatureCounts,
    compendiumCount: compendium.length,
    onCreateFolder: manager.createFolder,
    onRenameFolder: manager.renameFolder,
    onRemoveFolder: manager.removeFolder,
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
          <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-3">
            {/* Linha principal: navegação + ações */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(true)}
                className="lg:hidden inline-flex items-center justify-center w-9 h-9 shrink-0 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/60"
                aria-label="Abrir menu de pastas"
              >
                <Menu className="w-4 h-4" />
              </button>

              <h1 className="text-xl sm:text-2xl font-bold text-white truncate">Grimório</h1>

              <div className="flex-1" />

              <button
                type="button"
                onClick={onGoToEncounters}
                className="inline-flex items-center justify-center gap-1.5 h-9 w-9 lg:w-auto lg:px-3 shrink-0 rounded bg-slate-800 hover:bg-slate-700 text-sm font-semibold text-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500/60"
                title="Encontros"
              >
                <Swords className="w-4 h-4 shrink-0" />
                <span className="hidden lg:inline">Encontros</span>
              </button>
              <button
                type="button"
                onClick={() => setShowImportModal(true)}
                className="inline-flex items-center justify-center gap-1.5 h-9 w-9 lg:w-auto lg:px-3 shrink-0 rounded bg-slate-800 hover:bg-slate-700 text-sm font-semibold text-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500/60"
                title="Importar"
              >
                <Upload className="w-4 h-4 shrink-0" />
                <span className="hidden lg:inline">Importar</span>
              </button>
              <button
                type="button"
                onClick={handleExportCurrentView}
                disabled={filtered.filter((c) => !c.isBuiltIn).length === 0}
                className="inline-flex items-center justify-center gap-1.5 h-9 w-9 lg:w-auto lg:px-3 shrink-0 rounded bg-slate-800 hover:bg-slate-700 text-sm font-semibold text-slate-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-purple-500/60"
                title="Exportar criaturas da visualização atual"
              >
                <Download className="w-4 h-4 shrink-0" />
                <span className="hidden lg:inline">Exportar</span>
              </button>
              <button
                type="button"
                onClick={onCreateNew}
                disabled={!canCreate}
                className="inline-flex items-center justify-center gap-1.5 h-9 w-9 lg:w-auto lg:px-4 shrink-0 rounded bg-purple-800 hover:bg-purple-700 text-sm font-bold text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-purple-500"
                title={canCreate ? "Criar nova criatura" : "Não é possível criar na pasta Sistema"}
              >
                <Plus className="w-4 h-4 shrink-0" />
                <span className="hidden lg:inline">Nova Criatura</span>
              </button>
            </div>

            {/* Linha do medidor de armazenamento */}
            <StorageMeter
              creatures={manager.creatures}
              folders={manager.folders}
              encounters={encounters}
            />
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
            <div
              className="lg:hidden fixed inset-0 z-50 bg-black/80"
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
                  {...sidebarProps}
                  onChangeView={(v) => { setView(v); setMobileSidebarOpen(false); }}
                />
              </div>
            </div>
          )}

          {/* CONTEÚDO PRINCIPAL */}
          <main className="min-w-0">
            {/* ── Header: Título + Barra de Ferramentas (sempre empilhados) ── */}
            <div className="flex flex-col gap-4 w-full mb-6 border-b border-slate-800/50 pb-4">

              {/* Bloco Esquerdo: Título + subtítulo */}
              <div className="flex flex-col shrink-0">
                <h2 className="text-xl font-bold text-white">{viewTitle}</h2>
                <span className="text-xs text-slate-500 uppercase tracking-wider mt-0.5">
                  {filtered.length} criatura(s)
                  {view.type === "builtins" && " · Somente leitura — edite para clonar"}
                  {isSortableView && filtered.length > 0 && (
                    <span className="ml-2 text-slate-600">· Arraste para reordenar</span>
                  )}
                </span>
              </div>

              {/* Barra de ferramentas unificada — ocupa 100% da largura do conteúdo */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 w-full bg-slate-900/20 p-2 rounded-lg border border-slate-800/40">

                {/* Linha 1 (mobile) / Lado esquerdo (desktop): Selecionar Tudo */}
                {isSortableView && selectableFiltered.length > 0 && (
                  <div className="flex items-center gap-2 w-full md:w-auto py-1 md:py-0 shrink-0 select-none border-b border-slate-800/40 md:border-none pb-2 md:pb-0">
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="flex items-center gap-2 group focus:outline-none"
                    >
                      <CustomCheckbox
                        checked={allFilteredSelected}
                        onToggle={() => handleSelectAll()}
                      />
                      <span className="text-xs text-slate-500 group-hover:text-slate-300 transition-colors whitespace-nowrap">
                        {allFilteredSelected ? "Limpar seleção" : "Selecionar tudo"}
                      </span>
                    </button>
                  </div>
                )}

                {/* Linha 2 (mobile) / Lado direito (desktop): Busca + Filtro + Modo de Seleção */}
                <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end shrink-0 flex-nowrap mt-1 md:mt-0">
                  <div className="relative flex-1 md:flex-initial md:w-64">
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

                  <button
                    type="button"
                    onClick={() => setShowFilters((v) => !v)}
                    className={`relative h-9 w-9 flex items-center justify-center rounded border transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500/60 shrink-0 ${
                      showFilters || hasActiveFilters
                        ? "bg-purple-900/60 border-purple-700 text-purple-300"
                        : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                    }`}
                    aria-label="Filtros avançados"
                    title="Filtros avançados"
                  >
                    <Filter className="w-4 h-4" />
                    {hasActiveFilters && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-purple-500 rounded-full" />
                    )}
                  </button>

                  {view.type !== "builtins" && (
                    <button
                      type="button"
                      onClick={toggleSelectionMode}
                      className={`inline-flex items-center justify-center gap-1.5 h-9 w-9 xl:w-auto xl:px-3 rounded border text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500/60 shrink-0 ${
                        isSelectionMode
                          ? "bg-purple-950/60 border-purple-700 text-purple-300 hover:bg-purple-900/60"
                          : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                      }`}
                      title={isSelectionMode ? "Cancelar modo de seleção" : "Ativar seleção em massa"}
                    >
                      <CheckSquare className="w-4 h-4 shrink-0" />
                      <span className="hidden xl:inline">{isSelectionMode ? "Cancelar" : "Selecionar em Massa"}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Painel de filtros avançados */}
            {showFilters && (
              <div className="mb-4 p-3 bg-slate-900/60 border border-slate-800 rounded-lg grid grid-cols-2 md:grid-cols-5 gap-2">
                {/* ND */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">ND</label>
                  <div className="relative">
                    <select
                      value={filters.nd}
                      onChange={(e) => setFilters((f) => ({ ...f, nd: e.target.value }))}
                      className="w-full h-8 bg-slate-950 border border-slate-700 rounded pl-2 pr-7 text-xs text-slate-200 appearance-none focus:outline-none focus:border-purple-500"
                    >
                      <option value="">Todos</option>
                      {uniqueNDs.map((nd) => <option key={nd} value={String(nd)}>{nd}</option>)}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  </div>
                </div>
                {/* Patamar */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Patamar</label>
                  <div className="relative">
                    <select
                      value={filters.patamar}
                      onChange={(e) => setFilters((f) => ({ ...f, patamar: e.target.value }))}
                      className="w-full h-8 bg-slate-950 border border-slate-700 rounded pl-2 pr-7 text-xs text-slate-200 appearance-none focus:outline-none focus:border-purple-500"
                    >
                      <option value="">Todos</option>
                      <option value="lacaio">Lacaio</option>
                      <option value="capanga">Capanga</option>
                      <option value="comum">Comum</option>
                      <option value="desafio">Desafio</option>
                      <option value="calamidade">Calamidade</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  </div>
                </div>
                {/* Grau */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Grau</label>
                  <div className="relative">
                    <select
                      value={filters.grau}
                      onChange={(e) => setFilters((f) => ({ ...f, grau: e.target.value }))}
                      className="w-full h-8 bg-slate-950 border border-slate-700 rounded pl-2 pr-7 text-xs text-slate-200 appearance-none focus:outline-none focus:border-purple-500"
                    >
                      <option value="">Todos</option>
                      <option value="especial">Especial</option>
                      <option value="4">4</option>
                      <option value="3">3</option>
                      <option value="2">2</option>
                      <option value="1">1</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  </div>
                </div>
                {/* Dificuldade */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Dificuldade</label>
                  <div className="relative">
                    <select
                      value={filters.dificuldade}
                      onChange={(e) => setFilters((f) => ({ ...f, dificuldade: e.target.value }))}
                      className="w-full h-8 bg-slate-950 border border-slate-700 rounded pl-2 pr-7 text-xs text-slate-200 appearance-none focus:outline-none focus:border-purple-500"
                    >
                      <option value="">Todas</option>
                      <option value="iniciante">Iniciante</option>
                      <option value="intermediario">Intermediário</option>
                      <option value="experiente">Experiente</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  </div>
                </div>
                {/* Origem */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Origem</label>
                  <div className="relative">
                    <select
                      value={filters.origin}
                      onChange={(e) => setFilters((f) => ({ ...f, origin: e.target.value }))}
                      className="w-full h-8 bg-slate-950 border border-slate-700 rounded pl-2 pr-7 text-xs text-slate-200 appearance-none focus:outline-none focus:border-purple-500"
                    >
                      <option value="">Todas</option>
                      <option value="maldicao">Maldição</option>
                      <option value="feiticeiro">Feiticeiro</option>
                      <option value="nao_feiticeiro">Não-Feiticeiro</option>
                      <option value="restringido">Restringido</option>
                      <option value="corpo_amaldicoado">Corpo Amaldiçoado</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  </div>
                </div>
                {/* Limpar filtros */}
                {hasActiveFilters && (
                  <div className="col-span-2 md:col-span-5 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setFilters({ nd: "", patamar: "", grau: "", dificuldade: "", origin: "" })}
                      className="text-xs text-purple-400 hover:text-purple-200 focus:outline-none"
                    >
                      Limpar filtros
                    </button>
                  </div>
                )}
              </div>
            )}

            {isSelectionMode && (
              <BulkActionBar
                count={selected.size}
                folders={manager.folders}
                onMove={handleBulkMove}
                onExport={handleExportSelected}
                onDelete={handleBulkDelete}
                onClear={clearSelection}
                stickyTop={headerH}
              />
            )}

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
            ) : isSortableView ? (
              <SortableContext
                items={filtered.map((c) => c.id)}
                strategy={rectSortingStrategy}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 px-1 items-start">
                  {filtered.map((c) => {
                    const isGhosted = activeId !== null && selected.has(c.id) && selected.has(activeId);
                    return (
                      <div key={c.id} className={isGhosted ? "opacity-0 pointer-events-none" : undefined}>
                        <SortableCreatureCard
                          creature={c}
                          selected={selected.has(c.id)}
                          {...cardSharedProps}
                        />
                      </div>
                    );
                  })}
                </div>
              </SortableContext>
            ) : (
              // Vista "Criaturas Base" — sem DnD
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 px-1 items-start">
                {filtered.map((c) => (
                  <CreatureCard
                    key={c.id}
                    creature={c}
                    selected={false}
                    {...cardSharedProps}
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

        {/* ===== MODAL DE IMPORTAÇÃO ===== */}
        {showImportModal && (
          <ImportModal
            onImport={handleImportResult}
            onCancel={() => setShowImportModal(false)}
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

      {/* ===== DRAG OVERLAY ===== */}
      <DragOverlay
        dropAnimation={{
          duration: 200,
          easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
        }}
      >
        {activeId && (
          <CardDragOverlay
            creature={activeCreature}
            count={isDraggingMultiple ? selected.size : 1}
          />
        )}
      </DragOverlay>
    </DndContext>
  );
}
