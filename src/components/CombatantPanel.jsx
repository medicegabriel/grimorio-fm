// components/CombatantPanel.jsx
// Painel genérico de um combatente. Usado tanto pelo CombatTracker single
// quanto pelo EncounterTracker multi. Só recebe combatant + callbacks.

import { useState, useCallback, useMemo } from 'react';
import {
  Heart, Zap, Shield, Skull, Plus, Minus, ChevronDown, ChevronUp,
  Copy, AlertTriangle, Eye, EyeOff, X, Swords, Dices, RotateCcw,
  ShieldAlert, Activity, Target, Sparkles, Clock
} from 'lucide-react';
import { createInitialCombatState, applyNewRoundEffects, LOG_TYPES, createLogEntry } from '../fm-encounter';

// ============================================================
// DICIONÁRIOS DE TEMA
// ============================================================
const VITAL_THEMES = {
  hp: {
    icon: Heart, label: 'Pontos de Vida', accent: 'text-rose-400',
    fill: 'bg-gradient-to-r from-rose-600 to-red-700',
    border: 'border-rose-900/50', key: 'hpCurrent', maxKey: 'hpMax'
  },
  pe: {
    icon: Zap, label: 'Energia Amaldiçoada', accent: 'text-purple-400',
    fill: 'bg-gradient-to-r from-purple-600 to-fuchsia-700',
    border: 'border-purple-900/50', key: 'peCurrent', maxKey: 'peMax'
  },
  guarda: {
    icon: ShieldAlert, label: 'Guarda Inabalável', accent: 'text-sky-400',
    fill: 'bg-gradient-to-r from-sky-600 to-blue-700',
    border: 'border-sky-900/50', key: 'guardaInabavalCurrent', maxKey: 'guardaInabavalMax'
  }
};

const CONDITION_LEVELS = {
  fraca:   { label: 'Fraca',   color: 'bg-slate-700 text-slate-200 border-slate-600' },
  media:   { label: 'Média',   color: 'bg-amber-900 text-amber-100 border-amber-700' },
  forte:   { label: 'Forte',   color: 'bg-orange-900 text-orange-100 border-orange-700' },
  extrema: { label: 'Extrema', color: 'bg-red-900 text-red-100 border-red-700' }
};

const ACTION_TYPE_COLORS = {
  comum:      'bg-red-950/40 border-red-900 text-red-300',
  rapida:     'bg-amber-950/40 border-amber-900 text-amber-300',
  bonus:      'bg-blue-950/40 border-blue-900 text-blue-300',
  movimento:  'bg-emerald-950/40 border-emerald-900 text-emerald-300',
  reacao:     'bg-purple-950/40 border-purple-900 text-purple-300',
  livre:      'bg-slate-800 border-slate-700 text-slate-300'
};

const DEFENSE_ROWS = {
  imunidades: { dotColor: 'bg-emerald-500', textColor: 'text-emerald-400', label: 'Imune' },
  resistencias: { dotColor: 'bg-sky-500', textColor: 'text-sky-400', label: 'Resist.' },
  vulnerabilidades: { dotColor: 'bg-red-500', textColor: 'text-red-400', label: 'Vulner.' }
};

// ============================================================
// SUBCOMPONENTES
// ============================================================

const VitalBar = ({ kind, current, max, onChange }) => {
  const theme = VITAL_THEMES[kind];
  const Icon = theme.icon;
  const [delta, setDelta] = useState('');
  const pct = max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0;
  const isCritical = pct < 25;
  const isLow = pct < 50;

  const applyDelta = useCallback((sign) => {
    const n = parseInt(delta, 10);
    if (!Number.isFinite(n) || n <= 0) return;
    onChange(current + sign * n);
    setDelta('');
  }, [delta, current, onChange]);

  return (
    <div className={`rounded-lg border bg-slate-900/80 ${theme.border} p-4 transition-shadow hover:shadow-lg overflow-hidden`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 ${theme.accent}`} aria-hidden="true" />
          <span className="font-bold text-sm uppercase tracking-wider text-slate-300">{theme.label}</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className={`text-3xl font-bold tabular-nums ${
            isCritical ? 'text-red-400 animate-pulse' : isLow ? 'text-amber-300' : 'text-white'
          }`}>{current}</span>
          <span className="text-sm text-slate-500">/ {max}</span>
        </div>
      </div>

      <div className="h-2.5 bg-slate-900 rounded-full overflow-hidden mb-3" role="progressbar"
           aria-valuenow={current} aria-valuemax={max} aria-valuemin={0} aria-label={theme.label}>
        <div className={`h-full transition-all duration-300 ${theme.fill} ${isCritical ? 'animate-pulse' : ''}`}
             style={{ width: `${pct}%` }} />
      </div>

      <div className="flex items-center gap-2">
        <button type="button" onClick={() => applyDelta(-1)}
          className="flex items-center justify-center w-9 h-9 rounded bg-red-950 hover:bg-red-900 border border-red-800 text-red-300 font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
          aria-label={`Reduzir ${theme.label}`}>
          <Minus className="w-4 h-4" />
        </button>
        <input type="number" value={delta} onChange={(e) => setDelta(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && applyDelta(-1)}
          placeholder="0"
          className="flex-1 min-w-0 h-9 bg-slate-900 border border-slate-700 rounded px-3 text-center text-white font-mono focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
          aria-label={`Valor para alterar ${theme.label}`} />
        <button type="button" onClick={() => applyDelta(1)}
          className="flex items-center justify-center w-9 h-9 rounded bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
          aria-label={`Aumentar ${theme.label}`}>
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

const StatBlock = ({ icon: Icon, label, value, sublabel, accent = 'text-slate-300' }) => (
  <div className="bg-slate-900/60 border border-slate-800 rounded-md px-3 py-2 min-w-[88px]">
    <div className="flex items-center gap-1.5 mb-0.5">
      <Icon className={`w-3.5 h-3.5 ${accent}`} aria-hidden="true" />
      <span className="text-[10px] uppercase tracking-wider text-slate-500">{label}</span>
    </div>
    <div className="text-xl font-bold text-white tabular-nums">{value}</div>
    {sublabel && <div className="text-[10px] text-slate-500">{sublabel}</div>}
  </div>
);

const Counter = ({ label, used, max, onChange, accent = 'purple' }) => {
  const colors = {
    purple: 'from-purple-900/40 to-purple-950/40 border-purple-800 text-purple-200',
    amber:  'from-amber-900/40 to-amber-950/40 border-amber-800 text-amber-200',
    rose:   'from-rose-900/40 to-rose-950/40 border-rose-800 text-rose-200'
  };
  if (!max) return null;
  const remaining = max - used;

  return (
    <div className={`flex items-center justify-between gap-3 bg-gradient-to-r ${colors[accent]} border rounded-md px-3 py-2`}>
      <div className="flex-1">
        <div className="text-[10px] uppercase tracking-wider opacity-70">{label}</div>
        <div className="text-lg font-bold tabular-nums">{remaining} / {max}</div>
      </div>
      <div className="flex gap-1">
        <button type="button" onClick={() => onChange(Math.max(0, used - 1))} disabled={used === 0}
          className="w-7 h-7 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center focus:outline-none focus:ring-1 focus:ring-purple-500"
          aria-label={`Recuperar ${label}`}>
          <Plus className="w-3 h-3" />
        </button>
        <button type="button" onClick={() => onChange(Math.min(max, used + 1))} disabled={used >= max}
          className="w-7 h-7 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center focus:outline-none focus:ring-1 focus:ring-purple-500"
          aria-label={`Gastar ${label}`}>
          <Minus className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

const ConditionManager = ({ conditions, onAdd, onRemove }) => {
  const [name, setName] = useState('');
  const [level, setLevel] = useState('fraca');

  const handleAdd = useCallback(() => {
    if (!name.trim()) return;
    onAdd({
      id: `cond_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: name.trim(),
      level,
      appliedAt: new Date().toISOString()
    });
    setName('');
  }, [name, level, onAdd]);

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-4 h-4 text-amber-400" />
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">Condições Ativas</h3>
        <span className="ml-auto text-xs text-slate-500">{conditions.length}</span>
      </div>

      <div className="flex flex-wrap gap-2 mb-3 min-h-[36px]">
        {conditions.length === 0 && (
          <span className="text-xs text-slate-600 italic self-center">Nenhuma condição ativa</span>
        )}
        {conditions.map((c) => {
          const theme = CONDITION_LEVELS[c.level] ?? CONDITION_LEVELS.fraca;
          return (
            <span key={c.id}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-medium ${theme.color}`}>
              <span className="capitalize">{c.name}</span>
              <span className="opacity-70">({theme.label})</span>
              <button type="button" onClick={() => onRemove(c.id)}
                className="ml-0.5 hover:text-white focus:outline-none focus:ring-1 focus:ring-white/50 rounded"
                aria-label={`Remover condição ${c.name}`}>
                <X className="w-3 h-3" />
              </button>
            </span>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        <input type="text" value={name} onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Ex: Sangramento, Caído, Exposto..."
          className="flex-1 min-w-0 h-9 bg-slate-950 border border-slate-700 rounded px-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500" />
        <select value={level} onChange={(e) => setLevel(e.target.value)}
          className="flex-shrink-0 h-9 bg-slate-950 border border-slate-700 rounded px-2 text-sm text-white focus:outline-none focus:border-purple-500"
          aria-label="Nível da condição">
          {Object.entries(CONDITION_LEVELS).map(([key, v]) => (
            <option key={key} value={key}>{v.label}</option>
          ))}
        </select>
        <button type="button" onClick={handleAdd}
          className="flex-shrink-0 h-9 px-4 bg-purple-800 hover:bg-purple-700 rounded text-sm font-semibold text-white transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500">
          Adicionar
        </button>
      </div>
    </div>
  );
};

const ActionCard = ({ action }) => {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const typeClass = ACTION_TYPE_COLORS[action.type] ?? ACTION_TYPE_COLORS.livre;

  const copyDamage = useCallback((e) => {
    e.stopPropagation();
    if (!action.damage?.roll) return;
    navigator.clipboard?.writeText(action.damage.roll);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }, [action.damage]);

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-lg overflow-hidden">
      <button type="button" onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-3 hover:bg-slate-900 transition-colors text-left focus:outline-none focus:ring-1 focus:ring-purple-500/40"
        aria-expanded={expanded}>
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${typeClass}`}>
          {action.type}
        </span>
        <span className="flex-1 font-semibold text-white truncate">{action.name}</span>
        {action.cost > 0 && (
          <span className="text-xs text-purple-300 flex items-center gap-1">
            <Zap className="w-3 h-3" /> {action.cost} PE
          </span>
        )}
        {expanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
      </button>

      {expanded && (
        <div className="px-3 pb-3 pt-1 border-t border-slate-800 space-y-2">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {action.toHit != null && (
              <div className="bg-slate-950 rounded px-2 py-1.5">
                <div className="text-slate-500 text-[9px] uppercase">Acerto</div>
                <div className="font-bold text-white">+{action.toHit}</div>
              </div>
            )}
            {action.cd != null && (
              <div className="bg-slate-950 rounded px-2 py-1.5">
                <div className="text-slate-500 text-[9px] uppercase">CD {action.trType || ''}</div>
                <div className="font-bold text-white">{action.cd}</div>
              </div>
            )}
            {action.damage && (
              <div className="bg-slate-950 rounded px-2 py-1.5 col-span-2 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-slate-500 text-[9px] uppercase flex items-center gap-1">
                    <Dices className="w-3 h-3" /> Dano ({action.damage.type})
                  </div>
                  <div className="font-mono font-bold text-white truncate">
                    {action.damage.roll} <span className="text-slate-500 text-[10px]">(méd. {action.damage.average})</span>
                  </div>
                </div>
                <button type="button" onClick={copyDamage}
                  className="flex-shrink-0 inline-flex items-center gap-1 text-[11px] text-purple-300 hover:text-purple-200 focus:outline-none focus:ring-1 focus:ring-purple-500/40 rounded px-1"
                  aria-label="Copiar rolagem de dano">
                  <Copy className="w-3 h-3" />
                  {copied ? 'Copiado!' : 'Copiar'}
                </button>
              </div>
            )}
            {action.range && (
              <div className="bg-slate-950 rounded px-2 py-1.5">
                <div className="text-slate-500 text-[9px] uppercase">Alcance</div>
                <div className="font-bold text-white">{action.range}</div>
              </div>
            )}
            {action.area && (
              <div className="bg-slate-950 rounded px-2 py-1.5">
                <div className="text-slate-500 text-[9px] uppercase">Área</div>
                <div className="font-bold text-white">{action.area}</div>
              </div>
            )}
          </div>
          {action.description && (
            <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-wrap">{action.description}</p>
          )}
        </div>
      )}
    </div>
  );
};

const DefensesList = ({ defenses }) => {
  const hasAny = ['imunidades', 'resistencias', 'vulnerabilidades']
    .some((k) => (defenses?.[k]?.length ?? 0) > 0);
  if (!hasAny) return null;

  return (
    <section className="bg-slate-900/60 border border-slate-800 rounded-lg p-4">
      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
        Imunidades / Resistências
      </h3>
      <div className="space-y-1.5 text-sm">
        {Object.entries(DEFENSE_ROWS).map(([key, theme]) =>
          (defenses[key] ?? []).map((r, i) => (
            <div key={`${key}-${i}`} className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${theme.dotColor}`} />
              <span className="capitalize text-slate-300">{r.tipo}</span>
              <span className={`text-[10px] uppercase ml-auto ${theme.textColor}`}>
                {theme.label} {r.nivel}
              </span>
            </div>
          ))
        )}
      </div>
    </section>
  );
};

// ============================================================
// MAIN — CombatantPanel
// ============================================================
export default function CombatantPanel({
  combatant,
  onCombatStateChange,
  onFlagChange,
  onNewRound,
  onReset,
  readOnly = false,
  showHeader = true,
  suppressDeathBanner = false
}) {
  if (!combatant) return null;

  // PC placeholder — sem ficha
  if (!combatant.combatState || !combatant.snapshot) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-8 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-sky-950/60 border border-sky-800/60 mb-3">
          <Activity className="w-7 h-7 text-sky-300" />
        </div>
        <div className="text-xs uppercase tracking-widest text-slate-500 mb-1">Combatente Jogador</div>
        <div className="text-2xl font-bold text-slate-100">{combatant.displayName}</div>
        <div className="text-xs text-slate-500 mt-3 max-w-xs mx-auto">
          O controle de ficha do PC fica com o jogador. Use a iniciativa dele apenas para organizar turnos.
        </div>
      </div>
    );
  }

  const { snapshot, combatState, flags } = combatant;
  const stats = snapshot.stats ?? {};
  const saves = snapshot.saves ?? {};
  const core = snapshot.core ?? {};
  const defenses = snapshot.defenses ?? {};
  const actionsList = snapshot.actions?.list ?? [];
  const actionsTotal = snapshot.actions?.total ?? {};
  const features = snapshot.features ?? [];

  const [showLog, setShowLog] = useState(false);

  const patch = useCallback((partial) => {
    if (readOnly) return;
    onCombatStateChange?.({ ...combatState, ...partial });
  }, [combatState, onCombatStateChange, readOnly]);

  // ===== Desafiando a Morte =====
  const inDeathChallenge = useMemo(
    () => combatState.hpCurrent <= 0 && !flags.isDefeated,
    [combatState.hpCurrent, flags.isDefeated]
  );
  const deathCD = 25 + Math.floor(Math.abs(Math.min(0, combatState.hpCurrent)) / 50);

  // ===== Handlers (dicionário de ações) =====
  const handlers = useMemo(() => ({
    setVital: (kind, v) => {
      const theme = VITAL_THEMES[kind];
      const max = stats[theme.maxKey] ?? 0;
      const clamped = kind === 'hp'
        ? Math.max(-999, Math.min(max, v))
        : Math.max(0, Math.min(max, v));
      patch({ [theme.key]: clamped });
    },
    setResParcial: (v) => patch({ resistenciaParcialUsed: v }),
    setResTotal: (v) => patch({ resistenciaTotalUsed: v }),
    addCondition: (c) => patch({ activeConditions: [...(combatState.activeConditions ?? []), c] }),
    removeCondition: (id) => patch({
      activeConditions: (combatState.activeConditions ?? []).filter((x) => x.id !== id)
    }),
    setMissCounter: (v) => patch({ missCounter: Math.max(0, Math.min(3, v)) }),
    toggleDefeated: () => onFlagChange?.('isDefeated', !flags.isDefeated),
    toggleHidden: () => onFlagChange?.('isHidden', !flags.isHidden),
    newRound: () => {
      const next = applyNewRoundEffects(combatant).combatState;
      onCombatStateChange?.(next);
      onNewRound?.();
    },
    resetCombat: () => {
      if (!window.confirm('Resetar todo o estado de combate ao valor inicial?')) return;
      onCombatStateChange?.(createInitialCombatState(stats));
      onReset?.();
    }
  }), [patch, combatState, stats, flags, onFlagChange, combatant, onCombatStateChange, onNewRound, onReset]);

  return (
    <div className="space-y-6">
      {/* ===== HEADER ===== */}
      {showHeader && (
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-100 truncate">{combatant.displayName}</h2>
              {flags.isDefeated && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold border bg-slate-950/80 text-slate-400 border-slate-800">
                  <Skull className="w-3 h-3" /> Abatido
                </span>
              )}
              {flags.isHidden && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold border bg-slate-950/80 text-slate-500 border-slate-800">
                  <EyeOff className="w-3 h-3" /> Oculto
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1">
              <span className="px-2 py-0.5 rounded bg-purple-900/50 border border-purple-800 text-purple-200 font-semibold uppercase">
                {core.patamar}
              </span>
              <span>ND {core.nd}</span>
              <span className="text-slate-600">•</span>
              <span>Grau {core.grau}</span>
              <span className="text-slate-600">•</span>
              <span>BT +{core.bonusTreinamento}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {onNewRound !== undefined && (
              <button type="button" onClick={handlers.newRound}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-800 hover:bg-emerald-700 text-sm font-semibold text-white transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
                title="Aplica a Guarda Inabalável (vida temp de início de rodada)">
                <Clock className="w-4 h-4" /> Nova Rodada
              </button>
            )}
            <button type="button" onClick={handlers.toggleDefeated}
              className="inline-flex items-center justify-center w-9 h-9 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500/60"
              aria-label="Alternar abatido">
              <Skull className="w-4 h-4" />
            </button>
            <button type="button" onClick={handlers.toggleHidden}
              className="inline-flex items-center justify-center w-9 h-9 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500/60"
              aria-label="Alternar oculto">
              {flags.isHidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
            <button type="button" onClick={handlers.resetCombat}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-red-900/50 hover:bg-red-800 border border-red-800 text-sm text-red-200 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
              aria-label="Resetar combate">
              <RotateCcw className="w-4 h-4" /> Reset
            </button>
          </div>
        </div>
      )}

      {/* ===== DESAFIANDO A MORTE BANNER ===== */}
      {inDeathChallenge && !suppressDeathBanner && (
        <div className="bg-red-950 border border-red-700 rounded-lg px-4 py-2 flex items-center justify-between gap-3 animate-pulse flex-wrap">
          <div className="flex items-center gap-2">
            <Skull className="w-5 h-5 text-red-300" />
            <span className="text-sm font-bold text-red-200">
              DESAFIANDO A MORTE — Teste de Fortitude CD {deathCD}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-red-300/80 uppercase tracking-wider font-bold">Falhas</span>
            <div className="flex gap-1">
              {[1, 2, 3].map((n) => (
                <button key={n} type="button"
                  onClick={() => handlers.setMissCounter(combatState.missCounter === n ? n - 1 : n)}
                  className={`w-6 h-6 rounded-full border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/60 ${
                    combatState.missCounter >= n
                      ? 'bg-red-600 border-red-400'
                      : 'bg-transparent border-red-900/60 hover:border-red-700'
                  }`}
                  aria-label={`Falha ${n}`} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== VITAIS ===== */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4" aria-label="Recursos vitais">
        {['hp', 'pe', 'guarda'].map((kind) => {
          const theme = VITAL_THEMES[kind];
          return (
            <VitalBar key={kind} kind={kind}
              current={combatState[theme.key]}
              max={stats[theme.maxKey] ?? 0}
              onChange={(v) => handlers.setVital(kind, v)} />
          );
        })}
      </section>

      {/* ===== ESTATÍSTICAS DE COMBATE ===== */}
      <section aria-label="Estatísticas de combate">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-2">
          <Activity className="w-3.5 h-3.5" /> Estatísticas de Combate
        </h3>
        <div className="flex flex-wrap gap-2">
          <StatBlock icon={Shield} label="Defesa" value={stats.defesa ?? 0} accent="text-sky-400" />
          <StatBlock icon={Eye}    label="Atenção" value={stats.atencao ?? 0} accent="text-amber-400" />
          <StatBlock icon={Target} label="Iniciativa" value={`+${stats.iniciativa ?? 0}`} accent="text-emerald-400" />
          <StatBlock icon={Shield} label="RD Geral" value={stats.rdGeral ?? 0}
            sublabel={`Irred. ${stats.rdIrredutivel ?? 0}`} accent="text-slate-400" />
          <StatBlock icon={Swords} label="Ignorar RD" value={stats.ignorarRd ?? 0} accent="text-red-400" />
          <StatBlock icon={Heart}  label="Vida Temp/Atq" value={stats.vidaTempPorAtaque ?? 0} accent="text-rose-300" />
        </div>
      </section>

      {/* ===== TESTES DE RESISTÊNCIA ===== */}
      <section aria-label="Testes de Resistência">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
          Testes de Resistência
        </h3>
        <div className="flex flex-wrap gap-2">
          <StatBlock icon={Activity} label="Astúcia"   value={`+${saves.astucia ?? 0}`} />
          <StatBlock icon={Activity} label="Fortitude" value={`+${saves.fortitude ?? 0}`} />
          <StatBlock icon={Activity} label="Reflexos"  value={`+${saves.reflexos ?? 0}`} />
          <StatBlock icon={Activity} label="Vontade"   value={`+${saves.vontade ?? 0}`} />
          {saves.integridade != null && (
            <StatBlock icon={Sparkles} label="Integridade" value={`+${saves.integridade}`} accent="text-fuchsia-400" />
          )}
        </div>
      </section>

      {/* ===== GRID PRINCIPAL — 2 colunas em lg ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* COLUNA ESQUERDA */}
        <div className="lg:col-span-1 space-y-4">
          {(stats.resistenciaParcialMax > 0 || stats.resistenciaTotalMax > 0) && (
            <section aria-label="Recursos consumíveis">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Recursos</h3>
              <div className="space-y-2">
                <Counter label="Resistência Parcial"
                  used={combatState.resistenciaParcialUsed ?? 0}
                  max={stats.resistenciaParcialMax ?? 0}
                  onChange={handlers.setResParcial} accent="purple" />
                <Counter label="Resistência Total"
                  used={combatState.resistenciaTotalUsed ?? 0}
                  max={stats.resistenciaTotalMax ?? 0}
                  onChange={handlers.setResTotal} accent="amber" />
              </div>
            </section>
          )}

          <ConditionManager
            conditions={combatState.activeConditions ?? []}
            onAdd={handlers.addCondition}
            onRemove={handlers.removeCondition} />

          <DefensesList defenses={defenses} />
        </div>

        {/* COLUNA DIREITA */}
        <div className="lg:col-span-2 space-y-4">
          <section aria-label="Ações disponíveis">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Swords className="w-3.5 h-3.5" /> Ações ({actionsList.length})
              </h3>
              <div className="flex gap-2 text-[10px] text-slate-500 tabular-nums">
                <span>{actionsTotal.comum ?? 0}C</span>
                <span>{actionsTotal.rapida ?? 0}R</span>
                <span>{actionsTotal.bonus ?? 0}B</span>
                <span>{actionsTotal.movimento ?? 0}M</span>
              </div>
            </div>
            <div className="space-y-2">
              {actionsList.length === 0 ? (
                <div className="text-center py-8 text-slate-600 text-sm italic border border-dashed border-slate-800 rounded-lg">
                  Nenhuma ação cadastrada
                </div>
              ) : (
                actionsList.map((a) => <ActionCard key={a.id} action={a} />)
              )}
            </div>
          </section>

          {features.length > 0 && (
            <section aria-label="Características">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5" /> Características
              </h3>
              <div className="space-y-2">
                {features.map((f) => (
                  <div key={f.id} className="bg-slate-900/60 border border-slate-800 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <span className="text-[9px] uppercase tracking-wider text-fuchsia-400 bg-fuchsia-950/50 border border-fuchsia-900 px-1.5 py-0.5 rounded mt-0.5 flex-shrink-0">
                        {f.category}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-white text-sm">{f.name}</div>
                        {f.description && (
                          <div className="text-xs text-slate-400 mt-1 leading-relaxed whitespace-pre-wrap">
                            {f.description}
                          </div>
                        )}
                        {f.trigger && (
                          <div className="text-[10px] text-amber-400 mt-1 uppercase tracking-wider">
                            Gatilho: <span className="normal-case text-amber-300/80">{f.trigger}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* ===== NOTAS DO NARRADOR ===== */}
      {snapshot.narratorNotes && (
        <section className="bg-amber-950/20 border border-amber-900/40 rounded-lg p-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-amber-500 mb-2">
            Notas do Narrador
          </h3>
          <p className="text-sm text-amber-100/80 whitespace-pre-wrap">{snapshot.narratorNotes}</p>
        </section>
      )}

      {/* ===== LOG ===== */}
      {(combatState.combatLog?.length ?? 0) > 0 && (
        <section className="bg-slate-900/60 border border-slate-800 rounded-lg overflow-hidden">
          <button type="button" onClick={() => setShowLog((v) => !v)}
            className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-slate-900 transition-colors focus:outline-none focus:ring-1 focus:ring-purple-500/40"
            aria-expanded={showLog}>
            <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400">
              Log ({combatState.combatLog.length})
            </span>
            {showLog ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </button>
          {showLog && (
            <ul className="border-t border-slate-800 max-h-40 overflow-y-auto">
              {combatState.combatLog.map((e) => (
                <li key={e.id} className="px-3 py-1.5 text-xs text-slate-400 border-b border-slate-800/60 last:border-b-0">
                  <span className="text-slate-600 uppercase tracking-wider text-[10px] mr-2">{e.type}</span>
                  {e.message}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}