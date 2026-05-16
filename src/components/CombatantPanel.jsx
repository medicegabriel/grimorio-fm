// components/CombatantPanel.jsx
// Painel genérico de um combatente. Usado tanto pelo CombatTracker single
// quanto pelo EncounterTracker multi. Só recebe combatant + callbacks.

import { useState, useCallback, useMemo } from 'react';
import {
  Heart, Zap, Shield, Skull, Plus, Minus, ChevronDown, ChevronUp,
  Copy, AlertTriangle, Eye, EyeOff, X, Swords, Dices, RotateCcw,
  ShieldAlert, Activity, Target, Sparkles, Clock, GraduationCap, Star,
  Square, CheckSquare, Crosshair, Sword, Hourglass
} from 'lucide-react';
import { createInitialCombatState, applyNewRoundEffects, LOG_TYPES, createLogEntry, computeAlmaStatus, ALMA_ESTADOS } from '../fm-encounter';
import { humanizeAction, generateActionDescription, ACTION_TYPE_LABELS } from './sections/SectionActions';
import { getModifier, calculateCD, calculateAcerto, CONDITIONS } from './fm-tables';

const ATTR_DEFS = [
  { key: 'forca',        label: 'FOR', accent: 'text-red-400' },
  { key: 'destreza',     label: 'DES', accent: 'text-emerald-400' },
  { key: 'constituicao', label: 'CON', accent: 'text-amber-400' },
  { key: 'inteligencia', label: 'INT', accent: 'text-blue-400' },
  { key: 'sabedoria',    label: 'SAB', accent: 'text-purple-400' },
  { key: 'presenca',     label: 'PRE', accent: 'text-pink-400' },
];

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
  fraca:   { label: 'Fraca',        color: 'bg-slate-700 text-slate-200 border-slate-600' },
  media:   { label: 'Média',        color: 'bg-amber-900 text-amber-100 border-amber-700' },
  forte:   { label: 'Forte',        color: 'bg-orange-900 text-orange-100 border-orange-700' },
  extrema: { label: 'Extrema',      color: 'bg-red-900 text-red-100 border-red-700' },
  alma:    { label: 'Estado da Alma', color: 'bg-purple-900/70 text-purple-200 border-purple-700' }
};

const CONDITION_LEVEL_MAP = Object.entries({
  fracas: 'fraca', medias: 'media', fortes: 'forte', extremas: 'extrema'
}).reduce((acc, [tier, lv]) => {
  (CONDITIONS[tier] ?? []).forEach((n) => { acc[n] = lv; });
  return acc;
}, {});

const VARIABLE_CONDITIONS = new Set(['sangramento']);

// Condições sem duração por rodadas — duram até resolução mecânica
const PERMANENT_CONDITIONS = new Set(['caido', 'sangramento']);

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

const ALMA_COR_MAP = {
  cyan:   { accent: 'text-cyan-400',   fill: 'bg-gradient-to-r from-cyan-600 to-teal-700',   border: 'border-cyan-900/50',   badge: 'bg-cyan-900/60 text-cyan-300 border-cyan-700' },
  yellow: { accent: 'text-yellow-400', fill: 'bg-gradient-to-r from-yellow-600 to-amber-700', border: 'border-yellow-900/50', badge: 'bg-yellow-900/60 text-yellow-200 border-yellow-700' },
  orange: { accent: 'text-orange-400', fill: 'bg-gradient-to-r from-orange-600 to-red-700',  border: 'border-orange-900/50', badge: 'bg-orange-900/60 text-orange-200 border-orange-700' },
  red:    { accent: 'text-red-400',    fill: 'bg-gradient-to-r from-red-700 to-red-900',     border: 'border-red-900/50',    badge: 'bg-red-900/60 text-red-200 border-red-700' },
  dead:   { accent: 'text-slate-500',  fill: 'bg-slate-700',                                 border: 'border-slate-700/50',  badge: 'bg-slate-800 text-slate-400 border-slate-600' },
};

const AlmaBar = ({ almaAtual, hpMaxBase, onChange }) => {
  const status = computeAlmaStatus(almaAtual, hpMaxBase);
  const theme = ALMA_COR_MAP[status.cor] ?? ALMA_COR_MAP.cyan;
  const [delta, setDelta] = useState('');
  const pct = Math.max(0, Math.min(100, status.pct));
  const isCritico = status.estadoKey === 'critico';
  const isDestruido = status.estadoKey === 'destruido';

  const applyDelta = useCallback((sign) => {
    const n = parseInt(delta, 10);
    if (!Number.isFinite(n) || n <= 0) return;
    onChange(Math.max(0, Math.min(hpMaxBase, almaAtual + sign * n)));
    setDelta('');
  }, [delta, almaAtual, hpMaxBase, onChange]);

  return (
    <div className={`rounded-lg border bg-slate-900/80 ${theme.border} p-4 transition-shadow hover:shadow-lg overflow-hidden col-span-1 md:col-span-3`}>
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className={`w-5 h-5 ${theme.accent} ${isCritico ? 'animate-pulse' : ''}`} aria-hidden="true" />
          <span className={`font-bold text-sm uppercase tracking-wider text-slate-300`}>Integridade da Alma</span>
          <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${theme.badge} ${isCritico ? 'animate-pulse' : ''}`}>
            {status.label}
          </span>
          {status.penalidade !== 0 && (
            <span className="text-[10px] text-slate-400">
              {status.penalidade} testes{status.desvantagem ? ' + Desvantagem' : ''}
              {status.custoExtra > 0 ? ` / +${status.custoExtra} PE` : ''}
            </span>
          )}
        </div>
        <div className="flex items-baseline gap-1">
          <span className={`text-3xl font-bold tabular-nums ${theme.accent} ${isCritico ? 'animate-pulse' : ''}`}>
            {isDestruido ? 0 : almaAtual}
          </span>
          <span className="text-sm text-slate-500">/ {hpMaxBase}</span>
        </div>
      </div>

      <div className="h-2.5 bg-slate-900 rounded-full overflow-hidden mb-3" role="progressbar"
           aria-valuenow={almaAtual} aria-valuemax={hpMaxBase} aria-valuemin={0} aria-label="Integridade da Alma">
        <div className={`h-full transition-all duration-300 ${theme.fill} ${isCritico ? 'animate-pulse' : ''}`}
             style={{ width: `${pct}%` }} />
      </div>

      <div className="flex items-center gap-2">
        <button type="button" onClick={() => applyDelta(-1)}
          className="flex items-center justify-center w-9 h-9 rounded bg-red-950 hover:bg-red-900 border border-red-800 text-red-300 font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
          aria-label="Reduzir Alma">
          <Minus className="w-4 h-4" />
        </button>
        <input type="number" value={delta} onChange={(e) => setDelta(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && applyDelta(-1)}
          placeholder="0"
          className="flex-1 min-w-0 h-9 bg-slate-900 border border-slate-700 rounded px-3 text-center text-white font-mono focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
          aria-label="Valor para alterar Alma" />
        <button type="button" onClick={() => applyDelta(1)}
          className="flex items-center justify-center w-9 h-9 rounded bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
          aria-label="Recuperar Alma">
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

const StatBlock = ({ icon: Icon, label, value, sublabel, accent = 'text-slate-300' }) => (
  <div className="bg-slate-900/60 border border-slate-800 rounded-md p-3 flex flex-col items-center justify-center text-center h-full w-full">
    <div className="flex items-center justify-center gap-1.5 w-full">
      <Icon className={`w-3.5 h-3.5 ${accent}`} aria-hidden="true" />
      <span className="text-[10px] uppercase tracking-wider text-slate-500">{label}</span>
    </div>
    <div className="mt-2 text-2xl font-bold text-white tabular-nums w-full text-center">{value}</div>
    {sublabel && <span className="block text-xs text-slate-400 mt-1">{sublabel}</span>}
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

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const ConditionManager = ({ conditions, onAdd, onRemove }) => {
  const [name, setName] = useState('');
  const [level, setLevel] = useState('fraca');
  const [duracao, setDuracao] = useState(1);
  const [isCustom, setIsCustom] = useState(false);
  const [customName, setCustomName] = useState('');

  const revertToSelect = useCallback(() => {
    setIsCustom(false);
    setName('');
    setCustomName('');
    setDuracao(1);
  }, []);

  const handleConditionChange = useCallback((val) => {
    if (val === '__custom__') {
      setIsCustom(true);
      setCustomName('');
      setName('__custom__');
      setDuracao((prev) => prev ?? 1);
      return;
    }
    setName(val);
    const mapped = CONDITION_LEVEL_MAP[val];
    if (mapped) setLevel(mapped);
    if (PERMANENT_CONDITIONS.has(val)) {
      setDuracao(null);
    } else {
      setDuracao((prev) => prev ?? 1);
    }
  }, []);

  // Reverte para o select quando o input perde foco com campo vazio.
  // Se o foco foi para o botão "Adicionar", deixa o click acontecer primeiro.
  const handleCustomBlur = useCallback((e) => {
    if (e.relatedTarget?.dataset?.action === 'add') return;
    if (!customName.trim()) revertToSelect();
  }, [customName, revertToSelect]);

  const levelLocked = !isCustom && !!name && !VARIABLE_CONDITIONS.has(name) && CONDITION_LEVEL_MAP[name] != null;
  const isPermanent = !isCustom && PERMANENT_CONDITIONS.has(name);

  const handleAdd = useCallback(() => {
    const finalName = isCustom ? customName.trim() : name.trim();
    if (!finalName) return;
    onAdd({
      id: `cond_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: finalName,
      level,
      duracao,
      appliedAt: new Date().toISOString()
    });
    setName('');
    setCustomName('');
    setIsCustom(false);
    setDuracao(1);
  }, [isCustom, customName, name, level, duracao, onAdd]);

  const inputCls = 'flex-1 min-w-[120px] h-10 bg-slate-950 border rounded px-2 py-2 text-sm leading-tight text-white focus:outline-none';
  const selectCls = 'h-10 w-full bg-slate-950 border border-slate-700 rounded pl-3 pr-10 py-2 text-sm leading-tight text-white appearance-none focus:outline-none focus:border-purple-500';

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
              {c.duracao != null
                ? <span className="font-mono opacity-80">⏳{c.duracao}</span>
                : <span className="opacity-60">∞</span>
              }
              {c.isAlma ? (
                <span title="Condição atrelada à Integridade da Alma" className="ml-0.5 opacity-30 cursor-not-allowed">
                  <X className="w-3 h-3" />
                </span>
              ) : (
                <button type="button" onClick={() => onRemove(c.id)}
                  className="ml-0.5 hover:text-white focus:outline-none focus:ring-1 focus:ring-white/50 rounded"
                  aria-label={`Remover condição ${c.name}`}>
                  <X className="w-3 h-3" />
                </button>
              )}
            </span>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Seletor ou input de condição */}
        {isCustom ? (
          <input
            type="text"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            onBlur={handleCustomBlur}
            placeholder="Nome da condição..."
            autoFocus
            className={`${inputCls} border-purple-600 focus:border-purple-400 placeholder:text-slate-500`}
            aria-label="Nome da condição personalizada"
          />
        ) : (
          <div className="relative flex-1 min-w-[140px]">
            <select
              value={name}
              onChange={(e) => handleConditionChange(e.target.value)}
              className={selectCls}
              aria-label="Condição"
            >
              <option value="">— Condição —</option>
              <optgroup label="Fracas">
                {CONDITIONS.fracas.map((n) => <option key={n} value={n}>{cap(n)}</option>)}
              </optgroup>
              <optgroup label="Médias">
                {CONDITIONS.medias.map((n) => <option key={n} value={n}>{cap(n)}</option>)}
              </optgroup>
              <optgroup label="Fortes">
                {CONDITIONS.fortes.map((n) => <option key={n} value={n}>{cap(n)}</option>)}
              </optgroup>
              <optgroup label="Extremas">
                {CONDITIONS.extremas.map((n) => <option key={n} value={n}>{cap(n)}</option>)}
              </optgroup>
              <optgroup label="Personalizada">
                <option value="__custom__">✦ Outra / Personalizada</option>
              </optgroup>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        )}

        {/* Seletor de nível — travado quando a condição tem nível fixo */}
        <div className={`relative flex-shrink-0 transition-opacity ${levelLocked ? 'opacity-50' : ''}`}>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            disabled={levelLocked}
            className={`${selectCls} ${levelLocked ? 'cursor-not-allowed' : ''}`}
            aria-label="Nível da condição"
          >
            {Object.entries(CONDITION_LEVELS).map(([key, v]) => (
              <option key={key} value={key}>{v.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>

        {/* Duração com ícone — desabilitado para condições permanentes */}
        <div className={`flex items-center gap-1 flex-shrink-0 bg-slate-950 border border-slate-700 rounded h-10 px-2 focus-within:border-purple-500 ${isPermanent ? 'opacity-50' : ''}`}>
          <Hourglass className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
          {isPermanent ? (
            <span className="w-14 text-center text-sm leading-tight text-slate-500 select-none" title="Duração contínua">—</span>
          ) : (
            <input
              type="number"
              value={duracao ?? 1}
              onChange={(e) => setDuracao(Math.max(1, parseInt(e.target.value, 10) || 1))}
              min={1}
              placeholder="Rdds"
              title="Duração (Rodadas)"
              aria-label="Duração (Rodadas)"
              className="w-14 h-full bg-transparent text-center text-sm leading-tight text-white placeholder:text-slate-600 focus:outline-none"
            />
          )}
        </div>

        <button
          type="button"
          data-action="add"
          onClick={handleAdd}
          className="flex-shrink-0 h-10 px-4 bg-purple-800 hover:bg-purple-700 rounded text-sm font-semibold text-white transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          Adicionar
        </button>
      </div>
    </div>
  );
};

const ActionCard = ({ action, creatureName }) => {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const typeClass = ACTION_TYPE_COLORS[action.type] ?? ACTION_TYPE_COLORS.livre;
  const typeLabel = ACTION_TYPE_LABELS[action.type] || action.type;

  const dmgRoll = action.damage?.roll;

  const copyDamage = useCallback((e) => {
    e.stopPropagation();
    if (!dmgRoll) return;
    navigator.clipboard?.writeText(dmgRoll);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }, [dmgRoll]);

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-lg overflow-hidden">
      <button type="button" onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-3 hover:bg-slate-900 transition-colors text-left focus:outline-none focus:ring-1 focus:ring-purple-500/40"
        aria-expanded={expanded}>
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border flex-shrink-0 ${typeClass}`}>
          {typeLabel}
        </span>
        <span className="flex-1 font-semibold text-white truncate">{action.name}</span>
        {action.cost > 0 && (
          <span className="text-xs text-purple-300 flex items-center gap-1 flex-shrink-0">
            <Zap className="w-3 h-3" /> {action.cost} PE
          </span>
        )}
        {expanded ? <ChevronUp className="w-4 h-4 text-slate-500 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0" />}
      </button>

      {expanded && (
        <div className="px-3 pb-3 pt-2 border-t border-slate-800 space-y-2">
          <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{generateActionDescription(action, creatureName, action.description) || humanizeAction(action)}</p>
          {dmgRoll && (
            <div className="flex items-center justify-between bg-slate-950 rounded px-2.5 py-2">
              <div className="flex items-center gap-1.5 text-xs min-w-0">
                <Dices className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                <span className="font-mono font-bold text-white">{dmgRoll}</span>
                {action.damage?.average != null && (
                  <span className="text-slate-500">(méd. {action.damage.average})</span>
                )}
              </div>
              <button type="button" onClick={copyDamage}
                className="flex-shrink-0 inline-flex items-center gap-1 text-[11px] text-purple-300 hover:text-purple-200 focus:outline-none focus:ring-1 focus:ring-purple-500/40 rounded px-1.5 py-1"
                aria-label="Copiar rolagem de dano">
                <Copy className="w-3 h-3" />
                {copied ? 'Copiado!' : 'Copiar'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const AbilityCard = ({ title, tag, tagClass, description, footer }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-lg overflow-hidden">
      <button type="button" onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-3 hover:bg-slate-900 transition-colors text-left focus:outline-none focus:ring-1 focus:ring-purple-500/40"
        aria-expanded={expanded}>
        {tag && (
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border flex-shrink-0 ${tagClass}`}>
            {tag}
          </span>
        )}
        <span className="flex-1 font-semibold text-white truncate">{title}</span>
        {expanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
      </button>
      {expanded && (
        <div className="px-3 pb-3 pt-1 border-t border-slate-800 space-y-2">
          {description && (
            <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-wrap">{description}</p>
          )}
          {footer}
        </div>
      )}
    </div>
  );
};

const DefensesList = ({ defenses }) => {
  const hasAny = ['imunidades', 'resistencias', 'vulnerabilidades']
    .some((k) => (defenses?.[k]?.length ?? 0) > 0);
  const condImunes = defenses?.condicoesImunes ?? [];
  if (!hasAny && condImunes.length === 0) return null;

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
      {condImunes.length > 0 && (
        <div className="mt-2 pt-2 border-t border-slate-800">
          <span className="font-bold text-amber-400/80 text-xs uppercase tracking-widest">Imune a Condições: </span>
          <span className="text-slate-300 text-sm capitalize">{condImunes.join(', ')}.</span>
        </div>
      )}
    </section>
  );
};

// ============================================================
// AVATAR DE COMBATENTE
// ============================================================
const CombatantAvatar = ({ imageUrl, name, className }) => {
  const [failed, setFailed] = useState(false);
  if (!imageUrl || failed) {
    return (
      <div className={`${className} rounded-lg border border-slate-700 bg-slate-800 flex items-center justify-center flex-shrink-0`}>
        <Skull className="w-8 h-8 text-slate-600" />
      </div>
    );
  }
  return (
    <img
      src={imageUrl}
      alt={name}
      className={`${className} rounded-lg border border-slate-700 object-cover object-center flex-shrink-0 shadow-lg`}
      onError={() => setFailed(true)}
    />
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
  suppressDeathBanner = false,
  isTrackerMode = false
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
  const skills = snapshot.skills ?? [];

  // CD e Acerto: usa valores salvos ou recalcula a partir dos atributos do snapshot
  const _attrs = snapshot.attributes ?? {};
  const _modTecnica = getModifier(Math.max(
    _attrs.inteligencia ?? 10,
    _attrs.sabedoria ?? 10,
    _attrs.presenca ?? 10
  ));
  const cdValue = stats.cdBase || calculateCD(core.nd ?? 5, _modTecnica, core.difficulty ?? 'intermediario');
  const _attackAttr = snapshot.attackAttr ?? 'forca';
  const _attackMod = getModifier(_attrs[_attackAttr] ?? 10);
  const acertoValue = stats.acerto || calculateAcerto(core.patamar ?? 'comum', core.nd ?? 5, _attackMod, core.difficulty ?? 'intermediario');
  const actionsList = snapshot.actions?.list ?? [];
  const actionsTotal = snapshot.actions?.total ?? {};
  const features = snapshot.features ?? [];
  const treinamentos = snapshot.treinamentos ?? [];
  const aptidoesEspeciais = snapshot.aptidoesEspeciais ?? [];
  const dotes = snapshot.dotes ?? [];

  // Derived: alma conditions injected visually only — never persisted
  const _hpMaxBase = combatState.hpMaxBase ?? stats.hpMax ?? 0;
  const _almaAtual = combatState.almaAtual ?? _hpMaxBase;
  const almaStatus = computeAlmaStatus(_almaAtual, _hpMaxBase);
  const condicoesAlmaVisuais = almaStatus.condicoes.map((condNome) => ({
    id: `alma-${condNome}`,
    name: condNome,
    level: 'alma',
    duracao: null,
    isAlma: true
  }));
  const todasCondicoes = [...(combatState.activeConditions ?? []), ...condicoesAlmaVisuais];

  const [showLog, setShowLog] = useState(false);
  const [showAtributos, setShowAtributos] = useState(true);
  const [showAcoes, setShowAcoes] = useState(true);
  const [showCaracteristicas, setShowCaracteristicas] = useState(true);
  const [showAptidoes, setShowAptidoes] = useState(false);
  const [showDotes, setShowDotes] = useState(false);
  const [showTreinamentos, setShowTreinamentos] = useState(false);

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
      if (kind === 'hp') {
        const hpMaxBase = combatState.hpMaxBase ?? stats.hpMax ?? 0;
        const almaAtual = combatState.almaAtual ?? hpMaxBase;
        const almaStatus = computeAlmaStatus(almaAtual, hpMaxBase);
        const hpMax = almaStatus.hpMaxAtual; // HP máximo limitado pela Alma
        const currentHp = combatState.hpCurrent;
        const currentGuarda = combatState.guardaInabavalCurrent ?? 0;

        if (v < currentHp) {
          // Dano recebido — Guarda absorve primeiro
          const damage = currentHp - v;
          const guardaAbsorbed = Math.min(currentGuarda, damage);
          const remainingDamage = damage - guardaAbsorbed;
          patch({
            guardaInabavalCurrent: currentGuarda - guardaAbsorbed,
            hpCurrent: currentHp - remainingDamage,
          });
        } else {
          // Cura — aplica direto no HP, limitado pela Alma
          patch({ hpCurrent: Math.min(hpMax, v) });
        }
        return;
      }
      if (kind === 'guarda') {
        if (v < 0) {
          // Dano excede a Guarda — overflow para HP
          const overflow = Math.abs(v);
          patch({
            guardaInabavalCurrent: 0,
            hpCurrent: combatState.hpCurrent - overflow,
          });
        } else {
          const guardaMax = stats.guardaInabavalMax ?? 0;
          patch({ guardaInabavalCurrent: Math.min(guardaMax, v) });
        }
        return;
      }
      const theme = VITAL_THEMES[kind];
      const max = stats[theme.maxKey] ?? 0;
      patch({ [theme.key]: Math.max(0, Math.min(max, v)) });
    },
    setAlma: (v) => {
      const hpMaxBase = combatState.hpMaxBase ?? stats.hpMax ?? 0;
      const almaAntes = combatState.almaAtual ?? hpMaxBase;
      const newAlma = Math.max(0, Math.min(hpMaxBase, v));
      const almaStatus = computeAlmaStatus(newAlma, hpMaxBase);

      let newHp = combatState.hpCurrent;
      if (newAlma < almaAntes) {
        // Dano na Alma: dedução direta no HP, ignorando Guarda Inabalável
        const almaDano = almaAntes - newAlma;
        newHp = Math.max(0, combatState.hpCurrent - almaDano);
      }
      // Teto de HP derivado da Alma (esmagamento)
      newHp = Math.min(newHp, almaStatus.hpMaxAtual);

      const updates = { almaAtual: newAlma, hpCurrent: newHp };
      if (newAlma <= 0) updates.isActive = false;
      patch(updates);
    },
    setResParcial: (v) => patch({ resistenciaParcialUsed: v }),
    setResTotal: (v) => patch({ resistenciaTotalUsed: v }),
    addCondition: (c) => patch({ activeConditions: [...(combatState.activeConditions ?? []), c] }),
    removeCondition: (id) => patch({
      activeConditions: (combatState.activeConditions ?? []).filter((x) => x.id !== id)
    }),
    setSusceptivel: (v) => patch({ susceptivelFinalizacao: v }),
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
        <div className="flex gap-3 sm:gap-4 items-start">
          <CombatantAvatar
            imageUrl={snapshot.portraitUrl}
            name={combatant.displayName}
            className="w-24 h-24 sm:w-32 sm:h-32"
          />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {onNewRound !== undefined && (
                <button type="button" onClick={handlers.newRound}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-800 hover:bg-emerald-700 text-sm font-semibold text-white transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  title="Aplica a Guarda Inabalável (vida temp de início de rodada)">
                  <Clock className="w-4 h-4" /> Nova Rodada
                </button>
              )}
              {isTrackerMode && (
                <>
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
                </>
              )}
              <button type="button" onClick={handlers.resetCombat}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-red-900/50 hover:bg-red-800 border border-red-800 text-sm text-red-200 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                aria-label="Resetar combate">
                <RotateCcw className="w-4 h-4" /> Reset
              </button>
            </div>
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
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-400 mt-1">
              <span className="px-2 py-0.5 rounded bg-purple-900/50 border border-purple-800 text-purple-200 font-semibold uppercase text-xs">
                {core.patamar}
              </span>
              <span>ND {core.nd}</span>
              <span>&bull;</span>
              <span>Grau {core.grau}</span>
              <span>&bull;</span>
              <span>BT +{core.bonusTreinamento}</span>
            </div>
          </div>
        </div>
      )}

      {/* ===== DESAFIANDO A MORTE BANNER ===== */}
      {inDeathChallenge && !suppressDeathBanner && (
        <div className="bg-red-950/80 border-2 border-red-700 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Skull className="w-5 h-5 text-red-300 animate-pulse" />
            <span className="text-base font-black text-red-200 uppercase tracking-wide">
              ☠️ Desafiando a Morte
            </span>
            <span className="ml-auto px-2.5 py-1 rounded-full bg-red-900 border border-red-600 text-red-100 text-sm font-bold">
              Fortitude CD {deathCD}
            </span>
          </div>
          <button
            type="button"
            onClick={() => handlers.setSusceptivel(!(combatState.susceptivelFinalizacao ?? false))}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border font-bold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-red-500/60 ${
              combatState.susceptivelFinalizacao
                ? 'bg-red-600 hover:bg-red-500 border-red-400 text-white'
                : 'bg-slate-800/60 hover:bg-slate-700 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            {combatState.susceptivelFinalizacao
              ? <CheckSquare className="w-5 h-5 flex-shrink-0" />
              : <Square className="w-5 h-5 flex-shrink-0" />}
            <span>
              {combatState.susceptivelFinalizacao
                ? '⚠️ VULNERÁVEL À FINALIZAÇÃO (1 Ação Completa)'
                : 'Marcar como Suscetível a Finalização'}
            </span>
          </button>
        </div>
      )}

      {/* ===== VITAIS ===== */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4" aria-label="Recursos vitais">
        {['hp', 'pe', 'guarda'].map((kind) => {
          const theme = VITAL_THEMES[kind];
          const hpMaxBase = combatState.hpMaxBase ?? stats.hpMax ?? 0;
          const almaAtual = combatState.almaAtual ?? hpMaxBase;
          const hpMax = kind === 'hp'
            ? computeAlmaStatus(almaAtual, hpMaxBase).hpMaxAtual
            : (stats[theme.maxKey] ?? 0);
          return (
            <VitalBar key={kind} kind={kind}
              current={combatState[theme.key]}
              max={hpMax}
              onChange={(v) => handlers.setVital(kind, v)} />
          );
        })}
        <AlmaBar
          almaAtual={combatState.almaAtual ?? (combatState.hpMaxBase ?? stats.hpMax ?? 0)}
          hpMaxBase={combatState.hpMaxBase ?? stats.hpMax ?? 0}
          onChange={(v) => handlers.setAlma(v)} />
      </section>

      {/* ===== ESTATÍSTICAS DE COMBATE ===== */}
      <section aria-label="Estatísticas de combate">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-2">
          <Activity className="w-3.5 h-3.5" /> Estatísticas de Combate
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 items-stretch">
          <StatBlock icon={Shield}     label="Defesa"       value={stats.defesa ?? 0}           accent="text-sky-400" />
          <StatBlock icon={Eye}        label="Atenção"      value={stats.atencao ?? 0}          accent="text-amber-400" />
          <StatBlock icon={Sword}       label="Acerto"      value={`+${acertoValue}`}            accent="text-red-400" />
          <StatBlock icon={Crosshair}   label="CD"          value={cdValue}                     accent="text-orange-400" />
          <StatBlock icon={Target}     label="Iniciativa"   value={`+${stats.iniciativa ?? 0}`} accent="text-emerald-400" />
          <StatBlock icon={Shield}     label="RD Geral"     value={stats.rdGeral ?? 0}
            sublabel={`Irred. ${stats.rdIrredutivel ?? 0}`} accent="text-slate-400" />
          <StatBlock icon={Swords}     label="Ignorar RD"   value={stats.ignorarRd ?? 0}        accent="text-red-400" />
          <StatBlock icon={Heart}      label="Vida Temp/Atq" value={stats.vidaTempPorAtaque ?? 0} accent="text-rose-300" />
        </div>
      </section>

      {/* ===== TESTES DE RESISTÊNCIA ===== */}
      <section aria-label="Testes de Resistência">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
          Testes de Resistência
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2 items-stretch">
          <StatBlock icon={Activity} label="Astúcia"   value={`+${saves.astucia ?? 0}`} />
          <StatBlock icon={Activity} label="Fortitude" value={`+${saves.fortitude ?? 0}`} />
          <StatBlock icon={Activity} label="Reflexos"  value={`+${saves.reflexos ?? 0}`} />
          <StatBlock icon={Activity} label="Vontade"   value={`+${saves.vontade ?? 0}`} />
          {saves.integridade != null && (
            <StatBlock icon={Sparkles} label="Integridade" value={`+${saves.integridade}`} accent="text-fuchsia-400" />
          )}
        </div>
      </section>

      {/* ===== ATRIBUTOS & CD ===== */}
      <section aria-label="Atributos Base">
        <button type="button" onClick={() => setShowAtributos((v) => !v)}
          className="w-full flex items-center justify-between mb-2 text-slate-100 hover:text-slate-300 focus:outline-none focus:ring-1 focus:ring-purple-500/40 rounded"
          aria-expanded={showAtributos}>
          <h3 className="text-xs font-bold uppercase tracking-widest !text-slate-400 flex items-center gap-2">
            <Activity className="w-3.5 h-3.5" /> Atributos Base
          </h3>
          {showAtributos ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
        </button>
        {showAtributos && (
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {ATTR_DEFS.map(({ key, label, accent }) => {
              const value = snapshot.attributes?.[key] ?? 10;
              const mod = getModifier(value);
              const modStr = mod >= 0 ? `+${mod}` : `${mod}`;
              return (
                <div key={key} className="bg-slate-900/60 border border-slate-800 rounded-md p-2 flex flex-col items-center justify-center text-center">
                  <span className={`text-[10px] uppercase tracking-wider font-bold ${accent}`}>{label}</span>
                  <span className="text-xl font-bold text-white tabular-nums mt-1">{value}</span>
                  <span className="text-xs text-slate-400">{modStr}</span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ===== PERÍCIAS ===== */}
      {skills.filter((s) => s.name?.trim()).length > 0 && (
        <section aria-label="Perícias">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-2">
            <Target className="w-3.5 h-3.5" /> Perícias
          </h3>
          <div className="flex flex-wrap gap-2 mt-2">
            {skills
              .filter((s) => s.name?.trim())
              .sort((a, b) => (b.mod ?? 0) - (a.mod ?? 0))
              .map((s) => (
                <span
                  key={s.id}
                  className={`px-2 py-1 bg-slate-800/80 border rounded-md text-sm font-medium ${
                    s.mastered
                      ? 'border-purple-700/60 text-purple-200'
                      : 'border-slate-700 text-slate-300'
                  }`}
                >
                  {s.name} {(s.mod ?? 0) >= 0 ? '+' : ''}{s.mod ?? 0}
                </span>
              ))}
          </div>
        </section>
      )}

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
            conditions={todasCondicoes}
            onAdd={handlers.addCondition}
            onRemove={handlers.removeCondition} />

          <DefensesList defenses={defenses} />
        </div>

        {/* COLUNA DIREITA */}
        <div className="lg:col-span-2 space-y-4">
          <section aria-label="Ações disponíveis">
            <button type="button" onClick={() => setShowAcoes((v) => !v)}
              className="w-full flex items-center justify-between mb-2 text-slate-100 hover:text-slate-300 focus:outline-none focus:ring-1 focus:ring-purple-500/40 rounded"
              aria-expanded={showAcoes}>
              <h3 className="text-xs font-bold uppercase tracking-widest !text-slate-400 flex items-center gap-2">
                <Swords className="w-3.5 h-3.5" /> Ações ({actionsList.length})
              </h3>
              <div className="flex items-center gap-3">
                <div className="flex gap-2 text-[10px] text-slate-500 tabular-nums">
                  <span>{actionsTotal.comum ?? 0}C</span>
                  <span>{actionsTotal.rapida ?? 0}R</span>
                  <span>{actionsTotal.bonus ?? 0}B</span>
                  <span>{actionsTotal.movimento ?? 0}M</span>
                </div>
                {showAcoes ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
              </div>
            </button>
            {showAcoes && (
              <div className="space-y-2">
                {actionsList.length === 0 ? (
                  <div className="text-center py-8 text-slate-600 text-sm italic border border-dashed border-slate-800 rounded-lg">
                    Nenhuma ação cadastrada
                  </div>
                ) : (
                  actionsList.map((a) => <ActionCard key={a.id} action={a} creatureName={combatant.displayName} />)
                )}
              </div>
            )}
          </section>

          {features.length > 0 && (
            <section aria-label="Características">
              <button type="button" onClick={() => setShowCaracteristicas((v) => !v)}
                className="w-full flex items-center justify-between mb-2 text-slate-100 hover:text-slate-300 focus:outline-none focus:ring-1 focus:ring-purple-500/40 rounded"
                aria-expanded={showCaracteristicas}>
                <h3 className="text-xs font-bold uppercase tracking-widest !text-slate-400 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5" /> Características ({features.length})
                </h3>
                {showCaracteristicas ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
              </button>
              {showCaracteristicas && (
                <div className="space-y-2">
                  {features.map((f) => (
                    <AbilityCard
                      key={f.id}
                      title={f.name}
                      tag={f.category}
                      tagClass="text-fuchsia-400 bg-fuchsia-950/50 border-fuchsia-900"
                      description={f.description}
                      footer={f.trigger && (
                        <div className="text-[10px] text-amber-400 uppercase tracking-wider">
                          Gatilho: <span className="normal-case text-amber-300/80">{f.trigger}</span>
                        </div>
                      )}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          {aptidoesEspeciais.length > 0 && (
            <section aria-label="Aptidões Amaldiçoadas">
              <button type="button" onClick={() => setShowAptidoes((v) => !v)}
                className="w-full flex items-center justify-between mb-2 text-slate-100 hover:text-slate-300 focus:outline-none focus:ring-1 focus:ring-purple-500/40 rounded"
                aria-expanded={showAptidoes}>
                <h3 className="text-xs font-bold uppercase tracking-widest !text-slate-400 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Aptidões Amaldiçoadas ({aptidoesEspeciais.length})
                </h3>
                {showAptidoes ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
              </button>
              {showAptidoes && (
                <div className="space-y-2">
                  {aptidoesEspeciais.map((a) => (
                    <AbilityCard
                      key={a.id}
                      title={a.nome}
                      tag={a.categoria}
                      tagClass="text-purple-400 bg-purple-950/50 border-purple-900"
                      description={a.descricao}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          {dotes.length > 0 && (
            <section aria-label="Dotes Gerais">
              <button type="button" onClick={() => setShowDotes((v) => !v)}
                className="w-full flex items-center justify-between mb-2 text-slate-100 hover:text-slate-300 focus:outline-none focus:ring-1 focus:ring-purple-500/40 rounded"
                aria-expanded={showDotes}>
                <h3 className="text-xs font-bold uppercase tracking-widest !text-slate-400 flex items-center gap-2">
                  <Star className="w-3.5 h-3.5 text-amber-400" /> Dotes Gerais ({dotes.length})
                </h3>
                {showDotes ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
              </button>
              {showDotes && (
                <div className="space-y-2">
                  {dotes.map((d) => (
                    <AbilityCard
                      key={d.id}
                      title={d.nome}
                      description={d.descricao}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          {treinamentos.length > 0 && (
            <section aria-label="Treinamentos">
              <button type="button" onClick={() => setShowTreinamentos((v) => !v)}
                className="w-full flex items-center justify-between mb-2 text-slate-100 hover:text-slate-300 focus:outline-none focus:ring-1 focus:ring-purple-500/40 rounded"
                aria-expanded={showTreinamentos}>
                <h3 className="text-xs font-bold uppercase tracking-widest !text-slate-400 flex items-center gap-2">
                  <GraduationCap className="w-3.5 h-3.5 text-emerald-400" /> Treinamentos ({treinamentos.length})
                </h3>
                {showTreinamentos ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
              </button>
              {showTreinamentos && (
                <div className="space-y-2">
                  {treinamentos.map((t) => (
                    <AbilityCard
                      key={t.id}
                      title={t.nome}
                      description={t.descricao}
                    />
                  ))}
                </div>
              )}
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