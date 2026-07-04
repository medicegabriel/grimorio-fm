// components/CombatantPanel.jsx
// Painel genérico de um combatente. Usado tanto pelo CombatTracker single
// quanto pelo EncounterTracker multi. Só recebe combatant + callbacks.

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Heart, Zap, Shield, Skull, Plus, Minus, ChevronDown, ChevronUp,
  Copy, AlertTriangle, Eye, EyeOff, X, Swords, Dices, RotateCcw,
  ShieldAlert, Activity, Target, Sparkles, Clock, GraduationCap, Star,
  Square, CheckSquare, Crosshair, Sword, Hourglass, Settings, Flame, Shapes, Lock
} from 'lucide-react';
import { createInitialCombatState, applyNewRoundEffects, LOG_TYPES, createLogEntry, computeAlmaStatus, ALMA_ESTADOS } from '../fm-encounter';
import { resolveActionFinalText, ACTION_TYPE_LABELS, actionDamageScope, applyActionDamageBoost, applyActionRangeBoost } from './fm-action-calc';
import { getModifier, calculateCD, calculateAcerto, CONDITIONS } from './fm-tables';
import { computeConfrontoDominio, getTreinamentoByKey, isAutomatedTreinamento, getBarreiraAptidaoBonus } from './fm-treinamentos';
import { getDoteByKey, isAutomatedDote, resolveDoteDescription } from './fm-dotes';
import { getAptidaoByKey, resolveAptidaoDescription } from './fm-aptidoes';
import { getCaracteristicaByKey, resolveCaracteristicaDescription, getCaracteristicaTabelaDestaque } from './fm-caracteristicas';
import { MiniTable } from './builder-controls';
import {
  resolveLiveStats, newModifier, getTargetLabel, durationLabel,
  MODIFIER_TARGET_GROUPS, STACK_MODES, DURATION_KINDS, MODIFIER_OPS
} from './fm-modifiers';
import { collectPassiveModifiers, ruleModifiers, ruleRequiresMet, activatedRulesOf, resolveResourceChanges, resolveConditionEffects, ruleHasSustainedEffect, summarizeRule, hasAutomation, collectActionDamageBoosts, collectActionRangeBoosts, collectImmuneConditions, collectReactionRules } from './fm-automation';
import { collectAutomationEntities, applyRoundStartResources, applyTriggeredEffects, drainPeTemp } from './fm-automation-entities';
import { collectConditionModifiers, summarizeConditionMods, conditionNotes, hasConditionEffect } from './fm-conditions';
import { buildDslContext } from './fm-dsl';

const ATTR_DEFS = [
  { key: 'forca',        label: 'FOR', accent: 'text-red-400' },
  { key: 'destreza',     label: 'DES', accent: 'text-emerald-400' },
  { key: 'constituicao', label: 'CON', accent: 'text-amber-400' },
  { key: 'inteligencia', label: 'INT', accent: 'text-blue-400' },
  { key: 'sabedoria',    label: 'SAB', accent: 'text-purple-400' },
  { key: 'presenca',     label: 'PRE', accent: 'text-pink-400' },
];

// Níveis numéricos de Aptidão (AU/CL/BAR/DOM/ER) — sistema de orçamento.
const APTIDAO_DEFS = [
  { key: 'au',  label: 'AU',  name: 'Aura',               accent: 'text-purple-300' },
  { key: 'cl',  label: 'CL',  name: 'Controle e Leitura', accent: 'text-sky-300' },
  { key: 'bar', label: 'BAR', name: 'Barreira',           accent: 'text-amber-300' },
  { key: 'dom', label: 'DOM', name: 'Domínio',            accent: 'text-rose-300' },
  { key: 'er',  label: 'ER',  name: 'Energia Reversa',    accent: 'text-emerald-300' },
];
const APTIDAO_NIVEL_MAX = 5;

// ============================================================
// DICIONÁRIOS DE TEMA
// ============================================================
const VITAL_THEMES = {
  hp: {
    icon: Heart, label: 'Pontos de Vida', accent: 'text-rose-400',
    fill: 'bg-gradient-to-r from-rose-600 to-red-700',
    // Excedente = PV Temporário (buffer separado), exibido como o PE temp.
    overflowFill: 'bg-gradient-to-r from-emerald-400 to-teal-300',
    border: 'border-rose-900/50', key: 'hpCurrent', maxKey: 'hpMax', overflow: true
  },
  pe: {
    icon: Zap, label: 'Energia Amaldiçoada', accent: 'text-purple-400',
    fill: 'bg-gradient-to-r from-purple-600 to-fuchsia-700',
    // Cor do EXCEDENTE (PE temporário acima do máximo) — sobreposto à barra cheia.
    overflowFill: 'bg-gradient-to-r from-cyan-400 to-sky-300',
    border: 'border-purple-900/50', key: 'peCurrent', maxKey: 'peMax', overflow: true
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
  // Excedente temporário: PV/PE acima do máximo (cura/ganho que transborda). A
  // barra fica cheia e um segmento de outra cor é sobreposto, proporcional ao
  // excesso (capado a 100%). Mesmo modelo do PE — o número também passa do máx.
  const overflow = theme.overflow ? Math.max(0, (current ?? 0) - (max ?? 0)) : 0;
  const overflowPct = overflow > 0 && max > 0 ? Math.min(100, (overflow / max) * 100) : 0;
  const overflowText = kind === 'hp' ? 'text-emerald-300' : 'text-cyan-300';

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
            overflow > 0 ? overflowText : isCritical ? 'text-red-400 animate-pulse' : isLow ? 'text-amber-300' : 'text-white'
          }`}>{current}</span>
          <span className="text-sm text-slate-500">/ {max}</span>
          {overflow > 0 && (
            <span className={`ml-1 text-xs font-bold ${overflowText}`} title={kind === 'hp' ? 'PV Temporário' : 'Temporário acima do máximo'}>+{overflow}</span>
          )}
        </div>
      </div>

      <div className="relative h-2.5 bg-slate-900 rounded-full overflow-hidden mb-3" role="progressbar"
           aria-valuenow={current} aria-valuemax={max} aria-valuemin={0} aria-label={theme.label}>
        <div className={`h-full transition-all duration-300 ${theme.fill} ${isCritical ? 'animate-pulse' : ''}`}
             style={{ width: `${pct}%` }} />
        {overflowPct > 0 && (
          <div className={`absolute top-0 left-0 h-full transition-all duration-300 ${theme.overflowFill}`}
               style={{ width: `${overflowPct}%` }} title={`+${overflow} temporário acima do máximo`} />
        )}
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

// `modified`: marca o card quando um modificador temporário (buff/debuff)
// está alterando o valor — anel azul + ponto, pra leitura rápida no combate.
const StatBlock = ({ icon: Icon, label, value, sublabel, accent = 'text-slate-300', modified = false }) => (
  <div className={`relative bg-slate-900/60 border rounded-md p-3 flex flex-col items-center justify-center text-center h-full w-full ${modified ? 'border-sky-500/70 ring-1 ring-sky-500/40' : 'border-slate-800'}`}>
    {modified && (
      <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-sky-400" title="Valor modificado por um buff/debuff ativo" />
    )}
    <div className="flex items-center justify-center gap-1.5 w-full">
      <Icon className={`w-3.5 h-3.5 ${accent}`} aria-hidden="true" />
      <span className="text-[10px] uppercase tracking-wider text-slate-500">{label}</span>
    </div>
    <div className={`mt-2 text-2xl font-bold tabular-nums w-full text-center ${modified ? 'text-sky-200' : 'text-white'}`}>{value}</div>
    {sublabel && <span className="block text-xs text-slate-400 mt-1">{sublabel}</span>}
  </div>
);

// Sublabel de margem de crítico para um TR/ataque. Retorna null quando
// o valor é o padrão (20) — assim só aparece quando algum poder/treino
// reduziu a margem (ex.: Treino de Agilidade → Reflexos 18+).
const CRIT_DEFAULT_PANEL = 20;
function renderCritSublabel(margin) {
  if (margin == null || margin === CRIT_DEFAULT_PANEL) return null;
  return (
    <span
      className="inline-flex items-center gap-0.5 text-[9px] font-mono text-amber-300 leading-none"
      title={`Crítica automática em ${margin} ou mais (padrão: 20)`}
    >
      <Flame className="w-2.5 h-2.5 text-amber-400" /> crit {margin}+
    </span>
  );
}

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

const normCond = (s) => (s ?? '').toString().normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const ConditionManager = ({ conditions, onAdd, onRemove, immuneConditions = [] }) => {
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
  // Aviso (não-bloqueante) quando a condição escolhida está na lista de imunes.
  const immuneSet = new Set((immuneConditions ?? []).map(normCond));
  const selectedCond = isCustom ? customName : name;
  const isImmuneSelected = !!selectedCond && selectedCond !== '__custom__' && immuneSet.has(normCond(selectedCond));

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

      {/* Efeitos mecânicos das condições ativas (numéricos + notas). */}
      {conditions.some((c) => hasConditionEffect(c.name)) && (
        <div className="mb-3 space-y-1.5">
          {conditions.filter((c) => hasConditionEffect(c.name)).map((c) => {
            const nums = summarizeConditionMods(c.name);
            const notes = conditionNotes(c.name);
            return (
              <div key={`fx_${c.id}`} className="text-[11px] rounded border border-slate-800 bg-slate-950/40 px-2 py-1.5">
                <span className="font-semibold capitalize text-slate-200">{c.name}</span>
                {nums && <span className="text-sky-300 ml-1.5 font-medium">{nums}</span>}
                {notes.map((n, i) => (
                  <div key={i} className="text-slate-400 mt-0.5 leading-snug">• {n}</div>
                ))}
              </div>
            );
          })}
        </div>
      )}

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

      {isImmuneSelected && (
        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-amber-300">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>Imune a <span className="capitalize font-semibold">{selectedCond}</span> no momento — adicionar mesmo assim?</span>
        </div>
      )}
    </div>
  );
};

// ============================================================
// ActivationButtons — botões de ativar/usar regras programadas (sempre visíveis)
// Usado em qualquer entidade com regras ATIVADAS (característica, ação, expansão).
// ============================================================
const ActivationButtons = ({ entityName, group = null, rules, activeModifiers, peCurrent, dslContext, onActivate }) => {
  if (!rules || rules.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5 pl-1">
      {rules.map((rule) => {
        const mode = rule.activation ?? 'toggle';
        // Só é "liga/desliga" de verdade se tiver efeito sustentado (modificador).
        // Regra só com efeitos instantâneos age como uso único (não dá pra desligar).
        const toggleable = mode === 'toggle' && ruleHasSustainedEffect(rule);
        const active = toggleable && (activeModifiers ?? []).some((m) => m.source?.ruleId === rule.id);
        const cost = rule.cost?.pe ?? 0;
        const reqOk = ruleRequiresMet(rule, dslContext);
        const peOk = cost <= 0 || (peCurrent ?? 0) >= cost;
        const blocked = !active && (!reqOk || !peOk);
        const label = active ? 'Desativar' : (toggleable ? 'Ativar' : 'Usar');
        const title = !reqOk
          ? `Pré-requisito não atendido: ${rule.requires}`
          : !peOk ? `PE insuficiente (precisa de ${cost})` : label;
        return (
          <button
            key={rule.id}
            type="button"
            disabled={blocked}
            onClick={() => onActivate(rule, entityName, group)}
            title={title}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-semibold transition-colors focus:outline-none ${
              active
                ? 'bg-emerald-700 border-emerald-500 text-white hover:bg-emerald-600'
                : blocked
                ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                : 'bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700'
            }`}
          >
            <Zap className="w-3 h-3" />
            {label}: {rule.name}
            {cost > 0 && <span className="opacity-70">({cost} PE)</span>}
            {blocked && <Lock className="w-3 h-3 opacity-70" />}
          </button>
        );
      })}
    </div>
  );
};

// ReactionPanel — reações ao sofrer dano (gatilho on_damaged). Aparece quando
// há dano recente e o combatente tem alguma reação programada (ex.: Absorção
// Elemental). O narrador clica pra aplicar (decide se a condição da habilidade
// foi atendida, ex.: tipo de dano certo). O valor usa `dano` na DSL.
// ReactionPanel + ActivableHub usam ActivationButtons (definido acima).
// ActivableHub: junta TODAS as habilidades ativáveis (de qualquer seção) num
// painel SEMPRE visível — o usuário ativa sem precisar abrir/fechar seções.
const ActivableHub = ({ entities, activeModifiers, peCurrent, dslContext, onActivate }) => {
  const [open, setOpen] = useState(true);
  const items = (entities ?? []).filter((e) => activatedRulesOf(e).length > 0);
  if (!items.length) return null;
  const total = items.reduce((s, e) => s + activatedRulesOf(e).length, 0);
  return (
    <section className="bg-emerald-950/20 border border-emerald-900/50 rounded-lg p-3" aria-label="Habilidades ativáveis">
      <button type="button" onClick={() => setOpen((v) => !v)} className="w-full flex items-center gap-2 focus:outline-none" aria-expanded={open}>
        <Zap className="w-4 h-4 text-emerald-300" />
        <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-200">Habilidades Ativáveis</h3>
        <span className="ml-auto inline-flex items-center gap-1.5 text-[11px] text-emerald-300/80">
          {total}
          {open ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
        </span>
      </button>
      {open && (
        <div className="space-y-1.5 mt-2">
          {items.map((e) => (
            <div key={e.id} className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-[11px] text-slate-400 truncate max-w-[130px]" title={e.name}>{e.name}</span>
              <ActivationButtons
                entityName={e.name} group={e.__autoGroup} rules={activatedRulesOf(e)}
                activeModifiers={activeModifiers} peCurrent={peCurrent} dslContext={dslContext} onActivate={onActivate} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

// Toast transitório: confirma visualmente o que uma ativação fez (some sozinho).
// Fica fixo na base da tela — o usuário não precisa rolar até as barras de cima.
const ActivationToast = ({ feedback, onClear }) => {
  useEffect(() => {
    if (!feedback) return undefined;
    const t = setTimeout(onClear, 2600);
    return () => clearTimeout(t);
  }, [feedback, onClear]);
  if (!feedback) return null;
  const theme = feedback.kind === 'block'
    ? 'bg-amber-900/95 border-amber-600 text-amber-100'
    : feedback.kind === 'off'
      ? 'bg-slate-800/95 border-slate-600 text-slate-200'
      : 'bg-emerald-900/95 border-emerald-500 text-emerald-100';
  const Icon = feedback.kind === 'block' ? AlertTriangle : Zap;
  return createPortal(
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] flex items-center gap-2 px-4 py-2.5 rounded-lg border shadow-2xl text-sm font-semibold max-w-[92vw] ${theme}`} role="status">
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span className="truncate">{feedback.text}</span>
    </div>,
    document.body
  );
};

const ReactionPanel = ({ reactionRules, lastDamage, dslContext, onReact }) => {
  if (!reactionRules?.length || !(lastDamage > 0)) return null;
  return (
    <div className="bg-rose-950/20 border border-rose-900/50 rounded-lg p-3">
      <div className="flex items-center gap-2 mb-2">
        <ShieldAlert className="w-4 h-4 text-rose-300" />
        <h3 className="text-sm font-bold uppercase tracking-wider text-rose-200">Reações ao sofrer dano</h3>
        <span className="ml-auto text-[11px] text-slate-400">Último dano: <span className="font-mono text-rose-200">{lastDamage}</span></span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {reactionRules.map(({ rule, entityName, group }) => {
          const summary = summarizeRule(rule, dslContext);
          const fx = summary?.effects?.join(' · ') || '';
          return (
            <button key={rule.id} type="button"
              onClick={() => onReact(rule, entityName, group)}
              title={`${entityName} — Reagir`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-semibold bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700 transition-colors focus:outline-none">
              <Zap className="w-3 h-3" /> Reagir: {rule.name}
              {fx && <span className="opacity-70">({fx})</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// Badge no cabeçalho de uma seção: sinaliza quantas habilidades ATIVÁVEIS
// programadas há ali, mesmo com a seção recolhida (senão os botões "Ativar"
// ficariam escondidos).
const AutoCountBadge = ({ n }) => (n > 0 ? (
  <span
    title={`${n} habilidade(s) ativável(is) programada(s) nesta seção`}
    className="inline-flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-300 border border-emerald-800/60 bg-emerald-950/50 rounded px-1.5 py-0.5"
  >
    <Zap className="w-2.5 h-2.5" /> {n}
  </span>
) : null);

// Conta regras ATIVÁVEIS de uma lista de instâncias via mapa id→automação
// (badge ⚡N por seção). A resolução da automação mora em fm-automation-entities.
const countActivatable = (arr, autoById) =>
  (arr ?? []).reduce((s, x) => s + activatedRulesOf({ automation: autoById?.[x.id] }).length, 0);

// ============================================================
// ModifierManager — buffs/debuffs temporários (Motor de Automação, Fase 1)
// Aplicação MANUAL: o narrador adiciona um modificador que mexe num
// atributo/stat/TR, com modo de empilhamento e duração. resolveLiveStats
// (fm-modifiers.js) os resolve sobre o snapshot; o painel exibe o valor vivo.
// ============================================================
const ModifierManager = ({ modifiers, passiveModifiers = [], onAdd, onRemove }) => {
  const [name, setName] = useState('');
  const [stat, setStat] = useState('defesa');
  const [op, setOp] = useState('add');
  const [value, setValue] = useState(2);
  const [stack, setStack] = useState('sum');
  const [durKind, setDurKind] = useState('manual');
  const [rounds, setRounds] = useState(3);

  const handleAdd = useCallback(() => {
    const v = parseInt(value, 10) || 0;
    if (op === 'add' && v === 0) return;
    onAdd(newModifier({
      name: name.trim() || getTargetLabel(stat),
      stat, op, value: v, stack,
      duration: durKind === 'rounds'
        ? { kind: 'rounds', rounds: Math.max(1, parseInt(rounds, 10) || 1) }
        : { kind: durKind },
    }));
    setName('');
    setValue(2);
  }, [name, stat, op, value, stack, durKind, rounds, onAdd]);

  const inputCls = 'h-10 bg-slate-950 border border-slate-700 rounded px-2 py-2 text-sm leading-tight text-white focus:outline-none focus:border-purple-500';
  const selectCls = 'h-10 w-full bg-slate-950 border border-slate-700 rounded pl-3 pr-9 py-2 text-sm leading-tight text-white appearance-none focus:outline-none focus:border-purple-500';

  // Modificadores "__dmg" (boost de dano) e "__immune" (imunidade) não são
  // stats — aparecem no card da ação / na lista de imunidades / no inspetor,
  // não como chip aqui.
  const isHiddenStat = (m) => m.stat === '__dmg' || m.stat === '__immune' || m.stat === '__range';
  const visibleMods = (modifiers ?? []).filter((m) => !isHiddenStat(m));
  const visiblePassive = (passiveModifiers ?? []).filter((m) => !isHiddenStat(m));

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-sky-400" />
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">Modificadores</h3>
        <span className="ml-auto text-xs text-slate-500">{visibleMods.length}</span>
      </div>

      {/* Modificadores PASSIVOS (de automações) — somente leitura */}
      {visiblePassive.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {visiblePassive.map((m) => {
            const v = Number(m.value) || 0;
            const valStr = m.op === 'set' ? `= ${v}` : `${v >= 0 ? '+' : ''}${v}`;
            return (
              <span key={m.id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-medium bg-indigo-950/50 border-indigo-800/60 text-indigo-300"
                title={`Passivo via ${m.name}`}>
                <Zap className="w-3 h-3 opacity-80" />
                <span className="font-semibold">{m.name}</span>
                <span className="opacity-80">{getTargetLabel(m.stat)} {valStr}</span>
                <span className="opacity-50 uppercase text-[9px] tracking-wide">passiva</span>
              </span>
            );
          })}
        </div>
      )}

      {/* Modificadores ativos (manuais + regras ativadas) */}
      <div className="flex flex-wrap gap-2 mb-3 min-h-[36px]">
        {visibleMods.length === 0 && (
          <span className="text-xs text-slate-600 italic self-center">Nenhum modificador ativo</span>
        )}
        {visibleMods.map((m) => {
          const v = Number(m.value) || 0;
          const positive = m.op === 'set' ? true : v >= 0;
          const valStr = m.op === 'set' ? `= ${v}` : `${v >= 0 ? '+' : ''}${v}`;
          const theme = positive
            ? 'bg-emerald-950/60 border-emerald-800/60 text-emerald-300'
            : 'bg-rose-950/60 border-rose-800/60 text-rose-300';
          return (
            <span key={m.id}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-medium ${theme}`}>
              <span className="font-semibold">{m.name}</span>
              <span className="opacity-80">{getTargetLabel(m.stat)} {valStr}</span>
              <span className="font-mono opacity-70" title="Duração">⏳{durationLabel(m.duration)}</span>
              <button type="button" onClick={() => onRemove(m.id)}
                className="ml-0.5 hover:text-white focus:outline-none focus:ring-1 focus:ring-white/50 rounded"
                aria-label={`Remover modificador ${m.name}`}>
                <X className="w-3 h-3" />
              </button>
            </span>
          );
        })}
      </div>

      {/* Form de criação */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome (ex.: Expansão de Domínio)"
          className={`${inputCls} flex-1 min-w-[140px] placeholder:text-slate-600`}
          aria-label="Nome do modificador"
        />

        <div className="relative flex-1 min-w-[130px]">
          <select value={stat} onChange={(e) => setStat(e.target.value)} className={selectCls} aria-label="Alvo do modificador">
            {MODIFIER_TARGET_GROUPS.map((g) => (
              <optgroup key={g.label} label={g.label}>
                {g.items.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
              </optgroup>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>

        <div className="relative flex-shrink-0">
          <select value={op} onChange={(e) => setOp(e.target.value)} className={`${selectCls} pr-9 w-auto`} aria-label="Operação">
            {MODIFIER_OPS.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>

        <input
          type="number"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className={`${inputCls} w-16 text-center`}
          aria-label="Valor"
          title="Valor (negativo = penalidade)"
        />

        <div className="relative flex-shrink-0">
          <select value={stack} onChange={(e) => setStack(e.target.value)} className={`${selectCls} pr-9 w-auto`} aria-label="Empilhamento">
            {STACK_MODES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>

        <div className="relative flex-shrink-0">
          <select value={durKind} onChange={(e) => setDurKind(e.target.value)} className={`${selectCls} pr-9 w-auto`} aria-label="Duração">
            {DURATION_KINDS.map((d) => <option key={d.key} value={d.key}>{d.label}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>

        {durKind === 'rounds' && (
          <div className="flex items-center gap-1 flex-shrink-0 bg-slate-950 border border-slate-700 rounded h-10 px-2 focus-within:border-purple-500">
            <Hourglass className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
            <input
              type="number" min={1} value={rounds}
              onChange={(e) => setRounds(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="w-12 h-full bg-transparent text-center text-sm leading-tight text-white focus:outline-none"
              aria-label="Rodadas"
            />
          </div>
        )}

        <button
          type="button"
          onClick={handleAdd}
          className="flex-shrink-0 h-10 px-4 bg-purple-800 hover:bg-purple-700 rounded text-sm font-semibold text-white transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          Adicionar
        </button>
      </div>
    </div>
  );
};

// ============================================================
// INSPETOR DE AUTOMAÇÕES — somente leitura. Lista TODAS as regras programadas
// das entidades do combatente (ações/características/dotes/aptidões/treinos),
// com gatilho + efeitos resumidos (summarizeRule). Serve pra conferir, no
// tracker, o que cada habilidade faz sem reabrir o Builder.
// ============================================================
const AUTO_TRIGGER_THEME = {
  Passiva: 'text-indigo-300 border-indigo-800/60 bg-indigo-950/40',
};
const AutomationInspector = ({ entities = [], ctx = null }) => {
  const [open, setOpen] = useState(false);
  const programmed = useMemo(() => {
    const out = [];
    for (const ent of entities) {
      if (!hasAutomation(ent)) continue;
      for (const rule of ent.automation.rules) {
        const summary = summarizeRule(rule, ctx);
        if (summary) out.push({ entityName: ent.name, ruleName: rule.name, summary });
      }
    }
    return out;
  }, [entities, ctx]);

  if (programmed.length === 0) return null;

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-4">
      <button type="button" onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 focus:outline-none"
        aria-expanded={open}>
        <Sparkles className="w-4 h-4 text-fuchsia-400" />
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">Automações Programadas</h3>
        <span className="ml-auto text-xs text-slate-500">{programmed.length}</span>
        {open ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
      </button>

      {open && (
        <div className="mt-3 space-y-2">
          {programmed.map((p, i) => (
            <div key={i} className="rounded border border-slate-800 bg-slate-950/50 p-2.5">
              <div className="flex flex-wrap items-center gap-1.5 mb-1">
                <span className={`uppercase tracking-wide font-bold px-1.5 py-0.5 rounded border text-[10px] ${
                  p.summary.disabled
                    ? 'text-slate-500 border-slate-700 bg-slate-800/60'
                    : AUTO_TRIGGER_THEME[p.summary.trigger] ?? 'text-emerald-300 border-emerald-800/60 bg-emerald-950/40'
                }`}>
                  {p.summary.trigger}
                </span>
                <span className="text-sm font-semibold text-white truncate">{p.ruleName || 'Sem nome'}</span>
                <span className="text-[10px] text-slate-500 truncate">· {p.entityName}</span>
                {p.summary.disabled && <span className="text-[10px] text-slate-500 italic">(desativada)</span>}
              </div>
              {p.summary.effects.length === 0 ? (
                <div className="text-[11px] text-slate-500 italic">sem efeitos</div>
              ) : (
                <div className="text-[11px] text-slate-300">{p.summary.effects.join(' · ')}</div>
              )}
              {p.summary.requires && (
                <div className="text-[10px] text-amber-400/80 mt-0.5">Só se: <span className="font-mono">{p.summary.requires}</span></div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ActionCard = ({ action, creatureName, boosted = false }) => {
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
        {(action._acertoBuff || action._cdBuff) && (
          <span className="text-[9px] uppercase tracking-wide text-sky-300 border border-sky-700/60 bg-sky-950/40 rounded px-1 py-0.5 flex-shrink-0"
            title="Acerto/CD modificado por um efeito ativo">
            {action._acertoBuff ? `Acerto ${action._acertoBuff > 0 ? '+' : ''}${action._acertoBuff}` : `CD ${action._cdBuff > 0 ? '+' : ''}${action._cdBuff}`}
          </span>
        )}
        {action.cost > 0 && (
          <span className="text-xs text-purple-300 flex items-center gap-1 flex-shrink-0">
            <Zap className="w-3 h-3" /> {action.cost} PE
          </span>
        )}
        {expanded ? <ChevronUp className="w-4 h-4 text-slate-500 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0" />}
      </button>

      {expanded && (
        <div className="px-3 pb-3 pt-2 border-t border-slate-800 space-y-2">
          <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{resolveActionFinalText(action, creatureName)}</p>
          {dmgRoll && action.attackType !== "suporte" && (
            <div className={`flex items-center justify-between rounded px-2.5 py-2 ${boosted ? 'bg-sky-950/50 ring-1 ring-sky-600/50' : 'bg-slate-950'}`}>
              <div className="flex items-center gap-1.5 text-xs min-w-0">
                <Dices className={`w-3.5 h-3.5 flex-shrink-0 ${boosted ? 'text-sky-300' : 'text-rose-400'}`} />
                <span className={`font-mono font-bold ${boosted ? 'text-sky-200' : 'text-white'}`}>{dmgRoll}</span>
                {action.damage?.average != null && (
                  <span className="text-slate-500">(méd. {action.damage.average})</span>
                )}
                {boosted && <span className="text-[9px] uppercase tracking-wide text-sky-400/80 font-bold">amplificado</span>}
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

const DefensesList = ({ defenses, activeImmunities = [] }) => {
  const hasAny = ['imunidades', 'resistencias', 'vulnerabilidades']
    .some((k) => (defenses?.[k]?.length ?? 0) > 0);
  const condImunes = defenses?.condicoesImunes ?? [];
  // Imunidades concedidas AGORA por automação (ex.: Fúria ativa) que não estão
  // na lista permanente — exibidas em destaque (verde) ao lado das fixas.
  const sheetSet = new Set(condImunes.map(normCond));
  const extraImmune = (activeImmunities ?? []).filter((c) => !sheetSet.has(normCond(c)));
  if (!hasAny && condImunes.length === 0 && extraImmune.length === 0) return null;

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
      {(condImunes.length > 0 || extraImmune.length > 0) && (
        <div className="mt-2 pt-2 border-t border-slate-800">
          <span className="font-bold text-amber-400/80 text-xs uppercase tracking-widest">Imune a Condições: </span>
          {condImunes.length > 0 && (
            <span className="text-slate-300 text-sm capitalize">{condImunes.join(', ')}</span>
          )}
          {extraImmune.length > 0 && (
            <span className="text-emerald-300 text-sm capitalize">
              {condImunes.length > 0 ? ', ' : ''}{extraImmune.join(', ')} <span className="text-[10px] uppercase tracking-wide not-italic">(ativa)</span>
            </span>
          )}
          <span className="text-slate-300 text-sm">.</span>
        </div>
      )}
    </section>
  );
};

// ============================================================
// AVATAR DE COMBATENTE
// ============================================================
const CombatantAvatar = ({ imageUrl, name, className, focus }) => {
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
      className={`${className} rounded-lg border border-slate-700 object-cover flex-shrink-0 shadow-lg`}
      style={{ objectPosition: `${focus?.x ?? 50}% ${focus?.y ?? 50}%` }}
      onError={() => setFailed(true)}
    />
  );
};

// ============================================================
// MENU DE AJUSTES DE COMBATE (popover)
// ============================================================
const POPOVER_MARGIN = 8;       // distância mínima entre popover e borda do viewport
const POPOVER_GAP = 8;           // distância entre botão e popover

const CombatSettingsMenu = ({ settings, onChange, rdState, onRdState, rdStats, disabled = false }) => {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState(null);
  const buttonRef = useRef(null);
  const popoverRef = useRef(null);

  const recalculatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const buttonRect = buttonRef.current.getBoundingClientRect();
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;

    // Largura: 320 desktop, mais estreito em mobile, sempre cabendo no viewport
    const desiredWidth = viewportW >= 640 ? 320 : 288;
    const width = Math.min(desiredWidth, viewportW - POPOVER_MARGIN * 2);

    // Altura aproximada — usada para tentar abrir pra cima se não couber pra baixo
    const popoverH = popoverRef.current?.offsetHeight ?? 160;

    // Eixo X — preferimos alinhar com a borda direita do botão e estender pra esquerda;
    // se vazar, clampamos nas bordas do viewport
    let left = buttonRect.right - width;
    if (left < POPOVER_MARGIN) left = POPOVER_MARGIN;
    if (left + width > viewportW - POPOVER_MARGIN) {
      left = viewportW - width - POPOVER_MARGIN;
    }

    // Eixo Y — abaixo do botão por padrão; se não couber, abre pra cima
    let top = buttonRect.bottom + POPOVER_GAP;
    if (top + popoverH > viewportH - POPOVER_MARGIN) {
      const topAbove = buttonRect.top - POPOVER_GAP - popoverH;
      if (topAbove >= POPOVER_MARGIN) top = topAbove;
      else top = Math.max(POPOVER_MARGIN, viewportH - popoverH - POPOVER_MARGIN);
    }

    setPosition({ top, left, width });
  }, []);

  useEffect(() => {
    if (!open) {
      setPosition(null);
      return;
    }

    recalculatePosition();
    // Segundo cálculo após o popover ter dimensões reais (corrige altura no eixo Y)
    const raf = requestAnimationFrame(recalculatePosition);

    const handleClick = (e) => {
      const insideButton = buttonRef.current?.contains(e.target);
      const insidePopover = popoverRef.current?.contains(e.target);
      if (!insideButton && !insidePopover) setOpen(false);
    };
    const handleKey = (e) => { if (e.key === 'Escape') setOpen(false); };

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    window.addEventListener('resize', recalculatePosition);
    window.addEventListener('scroll', recalculatePosition, true);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
      window.removeEventListener('resize', recalculatePosition);
      window.removeEventListener('scroll', recalculatePosition, true);
    };
  }, [open, recalculatePosition]);

  const guardaAbsorbsFirst = settings?.guardaAbsorbsFirst ?? true;
  const rdReducao = settings?.rdReducao ?? true;
  const rdGeral = rdStats?.geral ?? 0;
  const rdIrredutivel = rdStats?.irredutivel ?? 0;
  const ignorarRdAtivo = rdState?.ativo ?? false;
  const ignorarRdValor = rdState?.valor ?? 0;

  const toggle = (key, value) => {
    onChange?.({ ...(settings || {}), [key]: value });
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={disabled}
        className="inline-flex items-center justify-center w-9 h-9 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500/60 disabled:opacity-40 disabled:cursor-not-allowed"
        aria-label="Ajustes de combate"
        aria-haspopup="menu"
        aria-expanded={open}
        title="Ajustes de combate"
      >
        <Settings className="w-4 h-4" />
      </button>

      {open && createPortal(
        <div
          ref={popoverRef}
          role="menu"
          style={{
            position: 'fixed',
            top: position?.top ?? -9999,
            left: position?.left ?? -9999,
            width: position?.width,
            visibility: position ? 'visible' : 'hidden',
          }}
          className="z-50 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl p-3 space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-widest text-slate-400 font-bold">
              Regras de combate
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-slate-500 hover:text-slate-300"
              aria-label="Fechar"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <SettingToggle
            label="Guarda Inabalável absorve dano antes do HP"
            checked={guardaAbsorbsFirst}
            onChange={(v) => toggle('guardaAbsorbsFirst', v)}
            disabled={disabled}
          />

          <div className="border-t border-slate-800 pt-2">
            <SettingToggle
              label="RD reduz dano automaticamente"
              description={`RD Geral ${rdGeral} · Irredutível ${rdIrredutivel}. Reduz o dano antes da Guarda.`}
              checked={rdReducao}
              onChange={(v) => toggle('rdReducao', v)}
              disabled={disabled}
            />

            {rdReducao && (
              <div className="pl-2 mt-1 space-y-2">
                <SettingToggle
                  label="Ignorar RD (mantém a Irredutível)"
                  description="Para ataques que perfuram a RD. A RD Irredutível continua valendo."
                  checked={ignorarRdAtivo}
                  onChange={(v) => onRdState?.setAtivo?.(v)}
                  disabled={disabled}
                />
                <label className={`flex items-center gap-2 p-2 rounded ${ignorarRdAtivo ? 'opacity-40' : ''}`}>
                  <span className="flex-1 text-sm text-slate-300">Ignorar parte da RD</span>
                  <input
                    type="number"
                    min={0}
                    value={ignorarRdValor || ''}
                    onChange={(e) => onRdState?.setValor?.(parseInt(e.target.value, 10) || 0)}
                    placeholder="0"
                    disabled={disabled || ignorarRdAtivo}
                    aria-label="Quantidade de RD a ignorar"
                    className="w-16 h-8 bg-slate-950 border border-slate-700 rounded px-2 text-center text-sm text-white focus:outline-none focus:border-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </label>
                <p className="px-2 text-[11px] text-slate-500 leading-snug">
                  RD aplicada no próximo dano: <span className="font-mono text-slate-300">
                    {ignorarRdAtivo
                      ? rdIrredutivel
                      : Math.min(rdGeral, Math.max(rdIrredutivel, rdGeral - ignorarRdValor))}
                  </span>
                </p>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

const SettingToggle = ({ label, description, checked, onChange, disabled }) => (
  <label className={`flex gap-3 items-start p-2 rounded hover:bg-slate-800/60 transition-colors cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange?.(e.target.checked)}
      disabled={disabled}
      className="mt-0.5 w-4 h-4 accent-purple-500 cursor-pointer"
    />
    <span className="flex-1">
      <span className="block text-sm font-semibold text-slate-200">{label}</span>
      {description && (
        <span className="block text-xs text-slate-400 mt-0.5 leading-snug">{description}</span>
      )}
    </span>
  </label>
);

// ============================================================
// MAIN — CombatantPanel
// ============================================================
export default function CombatantPanel({
  combatant,
  onCombatStateChange,
  onFlagChange,
  onNewRound,
  onReset,
  onCreatureUpdate,
  readOnly = false,
  showHeader = true,
  suppressDeathBanner = false,
  isTrackerMode = false
}) {
  // PC placeholder (sem ficha) ou combatant ausente: todos os Hooks abaixo
  // precisam ser chamados em TODA renderização (Regras dos Hooks), então
  // apenas marcamos o caso aqui e fazemos o early-return depois dos Hooks.
  const isPlaceholder = !combatant || !combatant.combatState || !combatant.snapshot;

  // Feedback transitório de ativação (toast): o usuário vê o que a habilidade
  // fez sem precisar rolar a tela até as barras de recurso.
  const [feedback, setFeedback] = useState(null);
  const clearFeedback = useCallback(() => setFeedback(null), []);

  // Derivados null-safe: produzem defaults inofensivos no caso placeholder,
  // permitindo que os Hooks rodem sem quebrar antes do return.
  const snapshot = combatant?.snapshot ?? {};
  const combatState = combatant?.combatState ?? {};
  const flags = combatant?.flags ?? {};
  // Stats BASE (congelados no snapshot) e stats AO VIVO (com os modificadores
  // temporários do combate aplicados — buffs/debuffs). O resto do painel lê
  // `stats`/`saves` ao vivo; `baseStats` serve pro Reset e pros indicadores.
  const baseStats = snapshot.stats ?? {};
  // Modificadores PASSIVOS vindos das automações das features (sempre-ativos;
  // recalculados ao vivo, nunca persistem no combatState). Concatenados aos
  // modificadores do combatState (manuais + regras ativadas) na resolução.
  // Contexto da DSL (variáveis: stats base + recursos atuais + núcleo).
  const dslContext = useMemo(
    () => buildDslContext(snapshot, combatState),
    [snapshot, combatState]
  );
  // Entidades que podem carregar automação: características custom + ações
  // (inclui Expansão de Domínio) + itens de catálogo (aptidões/características/
  // dotes/treinamentos). Catálogo usa `nome`; normalizamos para `name`.
  // Expansões de Domínio: a automação SAI dos efeitos estruturados (tabelas) —
  // sintetizada ao vivo (reflete DOM/ND atuais) e mesclada com quaisquer
  // bloquinhos manuais. Mapa id-da-ação → automação efetiva.
  // Automação efetiva de TODAS as entidades (custom + motorAuto oficial +
  // Expansão sintetizada das tabelas + features de origem). Fonte ÚNICA,
  // compartilhada com o avanço de rodada (fm-automation-entities) — assim
  // single e multi-combatente disparam round_start igual. `autoById` mapeia
  // instância→automação pros botões/badges por seção.
  const automationEntities = useMemo(() => collectAutomationEntities(snapshot), [snapshot]);
  const autoById = useMemo(() => {
    const m = {};
    for (const e of automationEntities) m[e.id] = e.automation;
    return m;
  }, [automationEntities]);
  const passiveModifiers = useMemo(
    () => collectPassiveModifiers(automationEntities, dslContext),
    [automationEntities, dslContext]
  );
  // Modificadores das CONDIÇÕES ativas (efeitos mecânicos numéricos). Aplicados
  // ao vivo junto dos modificadores de automação; as TRs/Defesa/Perícias/etc.
  // afetadas aparecem destacadas. A parte comportamental fica como nota no
  // ConditionManager. Alma é mecânica à parte (não entra aqui).
  const conditionModifiers = useMemo(
    () => collectConditionModifiers((combatState.activeConditions ?? []).map((c) => c.name)),
    [combatState.activeConditions]
  );
  const liveResolved = useMemo(
    () => resolveLiveStats(snapshot, {
      ...combatState,
      activeModifiers: [...passiveModifiers, ...conditionModifiers, ...(combatState.activeModifiers ?? [])],
    }),
    [snapshot, combatState, passiveModifiers, conditionModifiers]
  );
  const stats = liveResolved.stats;
  const saves = liveResolved.saves;
  const modifiedStats = liveResolved.modified;
  const critMargins = snapshot.critMargins ?? {};
  // Fallback pra fichas legadas que ainda não tinham confrontoDominio
  // persistido no snapshot: recalcula a partir do estado bruto.
  const confrontoDominio = snapshot.confrontoDominio ?? computeConfrontoDominio({
    nd: snapshot.core?.nd,
    dom: snapshot.aptidoes?.dom,
    treinamentos: snapshot.treinamentos,
  });
  const core = snapshot.core ?? {};
  const defenses = snapshot.defenses ?? {};
  const skills = liveResolved.skills ?? snapshot.skills ?? [];

  // CD e Acerto: usa valores salvos ou recalcula a partir dos atributos (ao vivo)
  const _attrs = liveResolved.attributes ?? {};
  const _modTecnica = getModifier(Math.max(
    _attrs.inteligencia ?? 10,
    _attrs.sabedoria ?? 10,
    _attrs.presenca ?? 10
  ));
  const cdValue = stats.cdBase || calculateCD(core.nd ?? 5, _modTecnica, core.difficulty ?? 'intermediario');
  const _attackAttr = snapshot.attackAttr ?? 'forca';
  const _attackMod = getModifier(_attrs[_attackAttr] ?? 10);
  const acertoValue = stats.acerto || calculateAcerto(core.patamar ?? 'comum', core.nd ?? 5, _attackMod, core.difficulty ?? 'intermediario');
  // Delta de Acerto/CD causado por buffs ATIVOS (modificadores). O StatBlock
  // global já reflete via `stats`; aqui isolamos o delta pra aplicar TAMBÉM no
  // Acerto/CD exibido em cada ação (que guarda o próprio toHit/cd congelado).
  const _baseAcerto = baseStats.acerto || calculateAcerto(core.patamar ?? 'comum', core.nd ?? 5, getModifier(snapshot.attributes?.[_attackAttr] ?? 10), core.difficulty ?? 'intermediario');
  const acertoDelta = Math.round(acertoValue - _baseAcerto);
  const _baseCd = baseStats.cdBase || calculateCD(core.nd ?? 5, getModifier(Math.max(snapshot.attributes?.inteligencia ?? 10, snapshot.attributes?.sabedoria ?? 10, snapshot.attributes?.presenca ?? 10)), core.difficulty ?? 'intermediario');
  const cdDelta = Math.round(cdValue - _baseCd);
  const actionsList = snapshot.actions?.list ?? [];
  const actionsTotal = snapshot.actions?.total ?? {};
  // Boost de dano (Amplificação de Domínio): soma os efeitos action_damage
  // ativos por escopo e reexibe o dano das ações afetadas ao vivo no tracker.
  const damageBoosts = useMemo(
    () => collectActionDamageBoosts([...passiveModifiers, ...(combatState.activeModifiers ?? [])]),
    [passiveModifiers, combatState.activeModifiers]
  );
  // Boost de Alcance/Área (automação): soma os efeitos action_range ativos e
  // reexibe alcance (ataques e feitiços) e área (feitiços) ao vivo.
  const rangeBoosts = useMemo(
    () => collectActionRangeBoosts([...passiveModifiers, ...(combatState.activeModifiers ?? [])]),
    [passiveModifiers, combatState.activeModifiers]
  );
  // Condições a que o combatente está imune AGORA por automação (ex.: Fúria
  // Berserker enquanto ativa). Some-se às imunidades permanentes da ficha.
  const activeImmunities = useMemo(
    () => collectImmuneConditions([...passiveModifiers, ...(combatState.activeModifiers ?? [])]),
    [passiveModifiers, combatState.activeModifiers]
  );
  // Reações ao sofrer dano (on_damaged) de todas as entidades — oferecidas no
  // painel de Reações quando há dano recente.
  const reactionRules = useMemo(() => collectReactionRules(automationEntities), [automationEntities]);
  const liveActionsList = useMemo(() => {
    const hasBoost = damageBoosts.corporal.amount || damageBoosts.corporal.fixed
      || damageBoosts.tecnica.amount || damageBoosts.tecnica.fixed;
    const hasRange = rangeBoosts.range || rangeBoosts.area;
    if (!hasBoost && !hasRange && !acertoDelta && !cdDelta) return actionsList;
    return actionsList.map((a) => {
      let out = a;
      // Dano (Amplificação de Domínio etc.)
      if (hasBoost) {
        const scope = actionDamageScope(a);
        const b = scope ? damageBoosts[scope] : null;
        if (b && (b.amount !== 0 || b.fixed !== 0)) {
          const boosted = applyActionDamageBoost(a, scope, b, { patamar: core.patamar, nd: core.nd });
          if (boosted !== a) out = { ...boosted, _damageBoosted: true };
        }
      }
      // Alcance (ataques e feitiços) e Área (feitiços) refletem os buffs ativos.
      if (hasRange) {
        const boosted = applyActionRangeBoost(out, rangeBoosts);
        if (boosted !== out) out = { ...boosted, _rangeBoosted: true };
      }
      // Acerto (ataques de Acerto) e CD (TRs) refletem os buffs ativos.
      if (acertoDelta && a.attackType === 'acerto' && out.toHit != null) {
        out = { ...out, toHit: (out.toHit ?? 0) + acertoDelta, _acertoBuff: acertoDelta };
      }
      if (cdDelta && a.attackType?.startsWith('tr_') && out.cd != null) {
        out = { ...out, cd: (out.cd ?? 0) + cdDelta, _cdBuff: cdDelta };
      }
      return out;
    });
  }, [actionsList, damageBoosts, rangeBoosts, acertoDelta, cdDelta, core.patamar, core.nd]);
  const features = snapshot.features ?? [];
  const treinamentos = snapshot.treinamentos ?? [];
  const aptidoesEspeciais = snapshot.aptidoesEspeciais ?? [];
  const caracteristicas = snapshot.caracteristicas ?? [];
  const dotes = snapshot.dotes ?? [];
  const combatSettings = snapshot.combatSettings ?? { guardaAbsorbsFirst: true, rdReducao: true };

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
  const [showCaracteristicasCat, setShowCaracteristicasCat] = useState(false);
  const [showDotes, setShowDotes] = useState(false);
  const [showTreinamentos, setShowTreinamentos] = useState(false);

  const patch = useCallback((partial) => {
    if (readOnly) return;
    onCombatStateChange?.({ ...combatState, ...partial });
  }, [combatState, onCombatStateChange, readOnly]);

  const handleCombatSettingsChange = useCallback((nextSettings) => {
    if (readOnly || !onCreatureUpdate) return;
    onCreatureUpdate({
      ...snapshot,
      combatSettings: { ...(snapshot.combatSettings ?? {}), ...nextSettings },
    });
  }, [onCreatureUpdate, readOnly, snapshot]);

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
        // Cura/ganho pode exceder o máximo (excedente temporário), então não há
        // teto aqui. O limite por Alma (esmagamento) é aplicado em setAlma.
        const currentHp = combatState.hpCurrent;
        const currentGuarda = combatState.guardaInabavalCurrent ?? 0;

        if (v < currentHp) {
          // Dano recebido. Ordem: dano → RD → Guarda → HP.
          // A RD reduz o dano bruto primeiro; o que sobra a Guarda absorve.
          const rawDamage = currentHp - v;
          const rdReducaoOn = combatSettings.rdReducao ?? true;
          let effectiveRd = 0;
          if (rdReducaoOn) {
            const rdGeral = stats.rdGeral ?? 0;
            const rdIrredutivel = stats.rdIrredutivel ?? 0;
            // "Ignorar RD": ativo zera a RD Geral (sobra só a Irredutível);
            // ignorarRdValor desconta parcialmente. A Irredutível é o piso e
            // a RD nunca passa da Geral.
            const ignorado = (combatState.ignorarRdAtivo ?? false)
              ? rdGeral
              : (combatState.ignorarRdValor ?? 0);
            effectiveRd = Math.min(rdGeral, Math.max(rdIrredutivel, rdGeral - ignorado));
          }
          const damage = Math.max(0, rawDamage - effectiveRd);
          if (combatSettings.guardaAbsorbsFirst) {
            // Guarda absorve primeiro (regra padrão); o resto desce no HP — que
            // pode estar acima do máximo (o dano consome o excedente primeiro).
            const guardaAbsorbed = Math.min(currentGuarda, damage);
            const remainingDamage = damage - guardaAbsorbed;
            patch({
              guardaInabavalCurrent: currentGuarda - guardaAbsorbed,
              hpCurrent: currentHp - remainingDamage,
              lastDamage: damage, // p/ reações on_damaged (DSL `dano`)
            });
          } else {
            // Toggle desligado: dano vai direto pro HP, Guarda intacta
            patch({ hpCurrent: currentHp - damage, lastDamage: damage });
          }
        } else {
          // Cura NORMAL: capa no máximo (limitado pela Alma). NÃO empurra acima
          // do máximo nem reduz o excedente de PV temp já existente — só efeitos
          // de habilidade (hp_temp) passam do teto.
          const hpMaxBase = combatState.hpMaxBase ?? stats.hpMax ?? 0;
          const hpMaxAtual = computeAlmaStatus(combatState.almaAtual ?? hpMaxBase, hpMaxBase).hpMaxAtual;
          patch({ hpCurrent: Math.min(v, Math.max(hpMaxAtual, currentHp)) });
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
      if (kind === 'pe') {
        const cur = combatState.peCurrent ?? 0;
        if (v >= cur) {
          // Restauro NORMAL: capa no máximo; não empurra acima nem reduz o
          // excedente de PE temp. Só round_start (PE temp) passa do teto.
          patch({ peCurrent: Math.min(v, Math.max(stats.peMax ?? 0, cur)) });
        } else {
          // Gasto manual: drena o PE temporário primeiro (refila no round_start).
          patch({ peCurrent: Math.max(0, v), peTempSources: drainPeTemp(combatState.peTempSources, cur - v) });
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
      // Teto de HP por esmagamento da Alma — SÓ quando a Alma reduz o máximo.
      // Com a Alma cheia (hpMaxAtual === hpMaxBase) NÃO clampa, pra preservar o
      // excedente de PV temporário (acima do máximo); senão qualquer ajuste de
      // Alma apagaria o PV temp.
      if (almaStatus.hpMaxAtual < hpMaxBase) newHp = Math.min(newHp, almaStatus.hpMaxAtual);

      const updates = { almaAtual: newAlma, hpCurrent: newHp };
      if (newAlma <= 0) updates.isActive = false;
      patch(updates);
    },
    setIgnorarRdAtivo: (v) => patch({ ignorarRdAtivo: v }),
    setIgnorarRdValor: (v) => patch({ ignorarRdValor: Math.max(0, v) }),
    setResParcial: (v) => patch({ resistenciaParcialUsed: v }),
    setResTotal: (v) => patch({ resistenciaTotalUsed: v }),
    addCondition: (c) => patch({ activeConditions: [...(combatState.activeConditions ?? []), c] }),
    removeCondition: (id) => patch({
      activeConditions: (combatState.activeConditions ?? []).filter((x) => x.id !== id)
    }),
    addModifier: (m) => patch({ activeModifiers: [...(combatState.activeModifiers ?? []), m] }),
    removeModifier: (id) => patch({
      activeModifiers: (combatState.activeModifiers ?? []).filter((x) => x.id !== id)
    }),
    // Liga/desliga uma regra ATIVADA: empurra/remove os modificadores dela
    // (marcados com source.ruleId) no combatState.
    // Aciona uma regra ATIVADA de uma habilidade (característica/ação/expansão).
    // 'toggle' liga/desliga (marcado por source.ruleId); 'once' aplica e expira
    // sozinho. Ao ATIVAR, desconta o PE do custo e bloqueia se faltar.
    activateRule: (rule, entityName, group = null) => {
      const mode = rule.activation ?? 'toggle';
      const list = combatState.activeModifiers ?? [];
      const isActive = list.some((m) => m.source?.ruleId === rule.id);

      // Desativar (só toggle): remove os modificadores; não devolve PE.
      if (mode === 'toggle' && isActive) {
        const offLog = createLogEntry({
          round: 0, type: LOG_TYPES.CUSTOM,
          message: `${entityName}: desativou ${rule.name}`,
          combatantId: combatant?.id ?? null,
        });
        patch({
          activeModifiers: list.filter((m) => m.source?.ruleId !== rule.id),
          combatLog: [...(combatState.combatLog ?? []), offLog].slice(-50),
        });
        setFeedback({ id: Date.now(), kind: 'off', text: `Desativou ${rule.name}` });
        return;
      }
      // Ativar: checa pré-requisito e custo.
      if (!ruleRequiresMet(rule, dslContext)) { setFeedback({ id: Date.now(), kind: 'block', text: `Pré-requisito não atendido: ${rule.name}` }); return; }
      const cost = rule.cost?.pe ?? 0;
      const peCur = combatState.peCurrent ?? 0;
      if (cost > 0 && peCur < cost) { setFeedback({ id: Date.now(), kind: 'block', text: `PE insuficiente para ${rule.name} (precisa de ${cost})` }); return; }

      const mods = ruleModifiers(rule, { name: entityName, kind: mode, group }, dslContext);
      // 'once': ids únicos por uso (pode reusar; os efeitos só expiram pela duração).
      const tagged = mode === 'once'
        ? mods.map((m) => ({ ...m, id: `${m.id}__${Date.now().toString(36)}${Math.random().toString(36).slice(2, 4)}` }))
        : mods;
      const next = { activeModifiers: [...list, ...tagged] };
      if (cost > 0) {
        next.peCurrent = Math.max(0, peCur - cost);
        // Gasta o PE temporário primeiro (refila no round_start seguinte).
        next.peTempSources = drainPeTemp(combatState.peTempSources, cost);
      }

      // Efeitos de RECURSO (instantâneos): aplicam ao ativar; não revertem ao
      // desativar. Operam sobre o valor já pós-custo de PE.
      const applyRes = (cur, op, val, max) => {
        const base = cur ?? 0;
        let v = op === 'set' ? val : op === 'subtract' ? base - val : base + val;
        v = Math.max(0, Math.round(v));
        return max != null ? Math.min(v, max) : v;
      };
      for (const ch of resolveResourceChanges(rule, dslContext)) {
        if (ch.resource === 'hp') {
          next.hpCurrent = applyRes(next.hpCurrent ?? combatState.hpCurrent, ch.op, ch.value, combatState.hpMaxBase ?? stats.hpMax ?? null);
        } else if (ch.resource === 'pe') {
          next.peCurrent = applyRes(next.peCurrent ?? combatState.peCurrent, ch.op, ch.value, stats.peMax ?? null);
        } else if (ch.resource === 'hp_temp') {
          // PV Temporário = ganho de PV que PODE exceder o máximo (excedente verde).
          next.hpCurrent = applyRes(next.hpCurrent ?? combatState.hpCurrent, ch.op, ch.value, null);
        } else if (ch.resource === 'guarda') {
          next.guardaInabavalCurrent = applyRes(next.guardaInabavalCurrent ?? combatState.guardaInabavalCurrent, ch.op, ch.value, stats.guardaInabavalMax ?? null);
        }
      }

      // Efeitos de CONDIÇÃO (instantâneos): aplica/remove no activeConditions.
      const condEffects = resolveConditionEffects(rule);
      if (condEffects.length) {
        let conds = [...(combatState.activeConditions ?? [])];
        for (const ce of condEffects) {
          if (ce.op === 'remove') {
            conds = conds.filter((c) => c.name !== ce.condition);
          } else {
            const dur = ce.duration?.kind === 'rounds' ? (ce.duration.rounds ?? 1) : null;
            conds.push({
              id: `cond_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
              name: ce.condition,
              level: CONDITION_LEVEL_MAP[ce.condition] ?? 'fraca',
              duracao: dur,
              appliedAt: new Date().toISOString(),
              source: { ruleId: rule.id },
            });
          }
        }
        next.activeConditions = conds;
      }

      // Registra no log de combate o que a ativação fez.
      const sum = summarizeRule(rule, dslContext);
      const verb = (ruleHasSustainedEffect(rule) && mode !== 'once') ? 'ativou' : 'usou';
      const efx = sum?.effects?.length ? ` — ${sum.effects.join(', ')}` : '';
      const peStr = cost > 0 ? ` (−${cost} PE)` : '';
      next.combatLog = [
        ...(combatState.combatLog ?? []),
        createLogEntry({
          round: 0, type: LOG_TYPES.CUSTOM,
          message: `${entityName}: ${verb} ${rule.name}${efx}${peStr}`,
          combatantId: combatant?.id ?? null,
        }),
      ].slice(-50);
      patch(next);
      setFeedback({ id: Date.now(), kind: 'on', text: `${rule.name}${efx || ' aplicado'}${peStr}` });
    },
    setSusceptivel: (v) => patch({ susceptivelFinalizacao: v }),
    toggleDefeated: () => onFlagChange?.('isDefeated', !flags.isDefeated),
    toggleHidden: () => onFlagChange?.('isHidden', !flags.isHidden),
    newRound: () => {
      // 1 criatura: turno = rodada. Cada "Nova Rodada" é a fronteira, então
      // dispara os 4 gatilhos (fim de turno/rodada → início de rodada/turno).
      const logs = [];
      const fire = (cs, trig, opts) => {
        const r = applyTriggeredEffects(cs, snapshot, trig, opts);
        logs.push(...r.logs);
        return r.combatState;
      };

      // Fim da rodada/turno que termina (sobre o estado atual).
      let ending = combatState;
      ending = fire(ending, 'turn_end');
      ending = fire(ending, 'round_end');

      // Tick de condições/modificadores + round_start (Treino de Energia/
      // Potencial Físico = +½ BT de PE, com overflow). Mesma lógica do multi.
      const base = { ...applyNewRoundEffects({ ...combatant, combatState: ending }).combatState, lastDamage: 0 };
      const { combatState: afterRes, peGain } = applyRoundStartResources(base, snapshot);

      // Início da rodada/turno (condições round_start + turn_start; recursos já vieram).
      let next = fire(afterRes, 'round_start', { resources: false, conditions: true });
      next = fire(next, 'turn_start');

      const entries = [];
      if (peGain > 0) entries.push(createLogEntry({ round: 0, type: LOG_TYPES.CUSTOM, message: `${combatant.displayName}: +${peGain} PE (início da rodada)`, combatantId: combatant?.id ?? null }));
      logs.forEach((message) => entries.push(createLogEntry({ round: 0, type: LOG_TYPES.CUSTOM, message, combatantId: combatant?.id ?? null })));
      if (entries.length) {
        next = { ...next, combatLog: [...(next.combatLog ?? combatState.combatLog ?? []), ...entries].slice(-50) };
      }
      onCombatStateChange?.(next);
      onNewRound?.();
    },
    resetCombat: () => {
      if (!window.confirm('Resetar todo o estado de combate ao valor inicial?')) return;
      // Reset parte dos stats BASE (sem buffs) — createInitialCombatState já
      // zera os activeModifiers.
      onCombatStateChange?.(createInitialCombatState(baseStats));
      onReset?.();
    }
  }), [patch, combatState, stats, baseStats, flags, onFlagChange, combatant, onCombatStateChange, onNewRound, onReset, combatSettings, dslContext]);

  // ===== Early returns (depois de TODOS os Hooks) =====
  if (!combatant) return null;
  if (isPlaceholder) {
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

  return (
    <div className="space-y-6">
      <ActivationToast feedback={feedback} onClear={clearFeedback} />
      {/* ===== HEADER ===== */}
      {showHeader && (
        <div className="flex gap-3 sm:gap-4 items-start">
          <CombatantAvatar
            imageUrl={snapshot.portraitUrl}
            focus={snapshot.portraitFocus}
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
              <CombatSettingsMenu
                settings={combatSettings}
                onChange={handleCombatSettingsChange}
                rdState={{ ativo: combatState.ignorarRdAtivo ?? false, valor: combatState.ignorarRdValor ?? 0 }}
                onRdState={{ setAtivo: handlers.setIgnorarRdAtivo, setValor: handlers.setIgnorarRdValor }}
                rdStats={{ geral: stats.rdGeral ?? 0, irredutivel: stats.rdIrredutivel ?? 0 }}
                disabled={readOnly || !onCreatureUpdate}
              />
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
        {/* auto-rows-fr garante altura uniforme entre todas as linhas —
            sem isso, a 3ª linha (incompleta) ficava mais baixa que as
            demais quando algum card tinha sublabel. */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 auto-rows-fr">
          <StatBlock icon={Shield}     label="Defesa"       value={stats.defesa ?? 0}           accent="text-sky-400" modified={modifiedStats.defesa} />
          <StatBlock icon={Eye}        label="Atenção"      value={stats.atencao ?? 0}          accent="text-amber-400" modified={modifiedStats.atencao} />
          <StatBlock icon={Sword}       label="Acerto"      value={`+${acertoValue}`}            accent="text-red-400" modified={modifiedStats.acerto} />
          <StatBlock icon={Crosshair}   label="CD"          value={cdValue}                     accent="text-orange-400" modified={modifiedStats.cdBase} />
          <StatBlock icon={Target}     label="Iniciativa"   value={`+${stats.iniciativa ?? 0}`} accent="text-emerald-400" modified={modifiedStats.iniciativa} />
          <StatBlock icon={Activity}   label="Deslocamento" value={`${stats.deslocamento ?? 0}m`} accent="text-slate-300" modified={modifiedStats.deslocamento} />
          <StatBlock icon={Shield}     label="RD Geral"     value={stats.rdGeral ?? 0}
            sublabel={`Irred. ${stats.rdIrredutivel ?? 0}`} accent="text-slate-400" modified={modifiedStats.rdGeral || modifiedStats.rdIrredutivel} />
          <StatBlock icon={Swords}     label="Ignorar RD"   value={stats.ignorarRd ?? 0}        accent="text-red-400" />
          <StatBlock icon={Heart}      label="Vida Temp/Atq" value={stats.vidaTempPorAtaque ?? 0} accent="text-rose-300" modified={modifiedStats.vidaTempPorAtaque} />
          {confrontoDominio && (
            <StatBlock
              icon={Dices}
              label="Conf. Domínio"
              value={confrontoDominio.formula}
              accent="text-rose-400"
            />
          )}
        </div>
      </section>

      {/* ===== TESTES DE RESISTÊNCIA ===== */}
      <section aria-label="Testes de Resistência">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
          Testes de Resistência
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2 auto-rows-fr">
          <StatBlock icon={Activity} label="Astúcia"   value={`+${saves.astucia ?? 0}`}   sublabel={renderCritSublabel(critMargins.astucia)}   modified={modifiedStats.save_astucia} />
          <StatBlock icon={Activity} label="Fortitude" value={`+${saves.fortitude ?? 0}`} sublabel={renderCritSublabel(critMargins.fortitude)} modified={modifiedStats.save_fortitude} />
          <StatBlock icon={Activity} label="Reflexos"  value={`+${saves.reflexos ?? 0}`}  sublabel={renderCritSublabel(critMargins.reflexos)}  modified={modifiedStats.save_reflexos} />
          <StatBlock icon={Activity} label="Vontade"   value={`+${saves.vontade ?? 0}`}   sublabel={renderCritSublabel(critMargins.vontade)}   modified={modifiedStats.save_vontade} />
          {saves.integridade != null && (
            <StatBlock icon={Sparkles} label="Integridade" value={`+${saves.integridade}`} accent="text-fuchsia-400" sublabel={renderCritSublabel(critMargins.integridade)} modified={modifiedStats.save_integridade} />
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
              const value = _attrs?.[key] ?? snapshot.attributes?.[key] ?? 10;
              const mod = getModifier(value);
              const modStr = mod >= 0 ? `+${mod}` : `${mod}`;
              const isMod = !!modifiedStats[key];
              return (
                <div key={key} className={`relative bg-slate-900/60 border rounded-md p-2 flex flex-col items-center justify-center text-center ${isMod ? 'border-sky-500/70 ring-1 ring-sky-500/40' : 'border-slate-800'}`}>
                  {isMod && <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-sky-400" title="Atributo modificado por um buff/debuff ativo" />}
                  <span className={`text-[10px] uppercase tracking-wider font-bold ${accent}`}>{label}</span>
                  <span className={`text-xl font-bold tabular-nums mt-1 ${isMod ? 'text-sky-200' : 'text-white'}`}>{value}</span>
                  <span className="text-xs text-slate-400">{modStr}</span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ===== NÍVEIS DE APTIDÃO ===== */}
      {(() => {
        const barBonus = getBarreiraAptidaoBonus(treinamentos);
        const levels = APTIDAO_DEFS.map(({ key, label, name, accent }) => {
          const base = Number(snapshot.aptidoes?.[key]) || 0;
          const eff = key === 'bar' ? Math.min(base + barBonus, APTIDAO_NIVEL_MAX) : base;
          return { key, label, name, accent, eff, bonus: eff - base };
        });
        if (!levels.some((l) => l.eff > 0)) return null;
        return (
          <section aria-label="Níveis de Aptidão">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" /> Níveis de Aptidão
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {levels.map(({ key, label, name, accent, eff, bonus }) => (
                <div key={key} title={name} className="relative bg-slate-900/60 border border-slate-800 rounded-md p-2 flex flex-col items-center justify-center text-center">
                  <span className={`text-[10px] uppercase tracking-wider font-bold ${accent}`}>{label}</span>
                  <span className="text-xl font-bold tabular-nums mt-1 text-white">{eff}</span>
                  <span className="text-[10px] text-slate-500 leading-tight">{name}</span>
                  {bonus > 0 && (
                    <span className="mt-0.5 inline-flex items-center gap-0.5 text-[9px] text-amber-300" title="Bônus do Treino de Barreira">
                      <Zap className="w-2.5 h-2.5" /> +{bonus}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>
        );
      })()}

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
              .map((s) => {
                const isMod = modifiedStats[`skill_${s.id}`];
                return (
                  <span
                    key={s.id}
                    title={isMod ? 'Modificado por buff de atributo' : undefined}
                    className={`px-2 py-1 bg-slate-800/80 border rounded-md text-sm font-medium ${
                      isMod
                        ? 'border-sky-600/70 text-sky-200 ring-1 ring-sky-500/40'
                        : s.mastered
                          ? 'border-purple-700/60 text-purple-200'
                          : 'border-slate-700 text-slate-300'
                    }`}
                  >
                    {s.name} {(s.mod ?? 0) >= 0 ? '+' : ''}{s.mod ?? 0}
                  </span>
                );
              })}
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

          <ActivableHub
            entities={automationEntities}
            activeModifiers={combatState.activeModifiers}
            peCurrent={combatState.peCurrent}
            dslContext={dslContext}
            onActivate={handlers.activateRule} />

          <ReactionPanel
            reactionRules={reactionRules}
            lastDamage={combatState.lastDamage ?? 0}
            dslContext={dslContext}
            onReact={handlers.activateRule} />

          <ConditionManager
            conditions={todasCondicoes}
            onAdd={handlers.addCondition}
            onRemove={handlers.removeCondition}
            immuneConditions={[...(defenses?.condicoesImunes ?? []), ...activeImmunities]} />

          <ModifierManager
            modifiers={combatState.activeModifiers ?? []}
            passiveModifiers={passiveModifiers}
            onAdd={handlers.addModifier}
            onRemove={handlers.removeModifier} />

          <AutomationInspector entities={automationEntities} ctx={dslContext} />

          <DefensesList defenses={defenses} activeImmunities={activeImmunities} />
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
                  <span>{actionsTotal.reacao ?? 0}Rç</span>
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
                  liveActionsList.map((a) => (
                    <div key={a.id} className="space-y-1.5">
                      <ActionCard action={a} creatureName={combatant.displayName} boosted={a._damageBoosted} />
                    </div>
                  ))
                )}
              </div>
            )}
          </section>

          {features.length > 0 && (
            <section aria-label="Características Personalizadas">
              <button type="button" onClick={() => setShowCaracteristicas((v) => !v)}
                className="w-full flex items-center justify-between mb-2 text-slate-100 hover:text-slate-300 focus:outline-none focus:ring-1 focus:ring-purple-500/40 rounded"
                aria-expanded={showCaracteristicas}>
                <h3 className="text-xs font-bold uppercase tracking-widest !text-slate-400 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5" /> Características Personalizadas ({features.length})
                </h3>
                {showCaracteristicas ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
              </button>
              {showCaracteristicas && (
                <div className="space-y-2">
                  {features.map((f) => (
                    <div key={f.id} className="space-y-1.5">
                      <AbilityCard
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
                    </div>
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
                  <AutoCountBadge n={countActivatable(aptidoesEspeciais, autoById)} />
                </h3>
                {showAptidoes ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
              </button>
              {showAptidoes && (
                <div className="space-y-2">
                  {aptidoesEspeciais.map((a) => {
                    const catalog = a.key ? getAptidaoByKey(a.key) : null;
                    const desc = catalog
                      ? resolveAptidaoDescription(catalog, {
                          core: snapshot.core,
                          attributes: snapshot.attributes,
                          aptidoes: snapshot.aptidoes,
                          subChoice: a.subChoice,
                        })
                      : a.descricao;
                    return (
                      <div key={a.id} className="space-y-1.5">
                        <AbilityCard
                          title={a.nome}
                          tag={a.categoria}
                          tagClass="text-purple-400 bg-purple-950/50 border-purple-900"
                          description={desc}
                          footer={catalog?.tabela ? <MiniTable {...catalog.tabela} /> : undefined}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {caracteristicas.length > 0 && (
            <section aria-label="Características">
              <button type="button" onClick={() => setShowCaracteristicasCat((v) => !v)}
                className="w-full flex items-center justify-between mb-2 text-slate-100 hover:text-slate-300 focus:outline-none focus:ring-1 focus:ring-cyan-500/40 rounded"
                aria-expanded={showCaracteristicasCat}>
                <h3 className="text-xs font-bold uppercase tracking-widest !text-slate-400 flex items-center gap-2">
                  <Shapes className="w-3.5 h-3.5 text-cyan-400" /> Características ({caracteristicas.length})
                  <AutoCountBadge n={countActivatable(caracteristicas, autoById)} />
                </h3>
                {showCaracteristicasCat ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
              </button>
              {showCaracteristicasCat && (
                <div className="space-y-2">
                  {caracteristicas.map((c) => {
                    const catalog = c.key ? getCaracteristicaByKey(c.key) : null;
                    const ctx = { core: snapshot.core, attributes: snapshot.attributes, subChoice: c.subChoice, notaPersonalizada: c.notaPersonalizada };
                    const desc = catalog ? resolveCaracteristicaDescription(catalog, ctx) : c.descricao;
                    const destaque = catalog ? getCaracteristicaTabelaDestaque(catalog, ctx) : null;
                    return (
                      <div key={c.id} className="space-y-1.5">
                        <AbilityCard
                          title={c.nome}
                          tag={c.categoria}
                          tagClass="text-cyan-400 bg-cyan-950/50 border-cyan-900"
                          description={desc}
                          footer={catalog?.tabela ? <MiniTable {...catalog.tabela} destaqueIndex={destaque} /> : undefined}
                        />
                      </div>
                    );
                  })}
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
                  <AutoCountBadge n={countActivatable(dotes, autoById)} />
                </h3>
                {showDotes ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
              </button>
              {showDotes && (
                <div className="space-y-2">
                  {dotes.map((d) => {
                    const catalog = d.key ? getDoteByKey(d.key) : null;
                    const desc = catalog
                      ? resolveDoteDescription(catalog, {
                          core: snapshot.core,
                          attributes: snapshot.attributes,
                          subChoice: d.subChoice,
                        })
                      : d.descricao;
                    const automated = isAutomatedDote(catalog) || !!catalog?.motorAuto;
                    return (
                      <div key={d.id} className="space-y-1.5">
                        <AbilityCard
                          title={d.nome}
                          tag={automated ? 'Programada' : undefined}
                          tagClass="text-amber-300 border-amber-700/60 bg-amber-950/40"
                          description={desc}
                        />
                      </div>
                    );
                  })}
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
                  <AutoCountBadge n={countActivatable(treinamentos, autoById)} />
                </h3>
                {showTreinamentos ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
              </button>
              {showTreinamentos && (
                <div className="space-y-2">
                  {treinamentos.map((t) => {
                    const catalog = t.key ? getTreinamentoByKey(t.key) : null;
                    const desc = catalog
                      ? (typeof catalog.descriptionFn === 'function'
                          ? catalog.descriptionFn({ core: snapshot.core, attributes: snapshot.attributes })
                          : catalog.descricao)
                      : t.descricao;
                    const automated = isAutomatedTreinamento(catalog) || !!catalog?.motorAuto;
                    return (
                      <div key={t.id} className="space-y-1.5">
                        <AbilityCard
                          title={t.nome}
                          tag={automated ? 'Programada' : undefined}
                          tagClass="text-amber-300 border-amber-700/60 bg-amber-950/40"
                          description={desc}
                        />
                      </div>
                    );
                  })}
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