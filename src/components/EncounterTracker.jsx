// components/EncounterTracker.jsx
// View única que delega para sub-renderizadores por status do encontro.

import { useState, useMemo, useCallback } from 'react';
import {
  ArrowLeft, Plus, X, Dices, Play, Pause, SkipForward, Clock,
  Users, UserPlus, Search, Swords, Trophy, Skull, Eye, EyeOff,
  Copy, ChevronDown, ChevronUp, Edit3, Shield
} from 'lucide-react';
import CombatantPanel from './CombatantPanel';
import useEncounter from '../useEncounter';
import {
  ENCOUNTER_STATUS, COMBATANT_SIDE, SIDE_LABELS
} from '../fm-encounter';

// ============================================================
// DICIONÁRIOS
// ============================================================
const SIDE_STYLES = {
  enemy: 'border-rose-900/60 bg-rose-950/20',
  pc:    'border-sky-900/60 bg-sky-950/20',
  ally:  'border-emerald-900/60 bg-emerald-950/20'
};

const SIDE_BADGE = {
  enemy: 'bg-rose-900/60 text-rose-200 border-rose-800',
  pc:    'bg-sky-900/60 text-sky-200 border-sky-800',
  ally:  'bg-emerald-900/60 text-emerald-200 border-emerald-800'
};

const PATAMAR_BADGE = {
  lacaio:     'bg-slate-800 text-slate-300',
  capanga:    'bg-amber-900/60 text-amber-200',
  comum:      'bg-purple-900/60 text-purple-200',
  desafio:    'bg-fuchsia-900/60 text-fuchsia-200',
  calamidade: 'bg-red-900/60 text-red-200'
};

// ============================================================
// PLANNER — ADICIONAR COMBATENTES
// ============================================================
const CreaturePicker = ({ creatures, onAdd }) => {
  const [search, setSearch] = useState('');
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return creatures;
    return creatures.filter((c) =>
      c.name.toLowerCase().includes(q) ||
      c.core?.patamar?.toLowerCase().includes(q)
    );
  }, [creatures, search]);

  return (
    <section className="bg-slate-900/60 border border-slate-800 rounded-lg p-4">
      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
        <Users className="w-3.5 h-3.5" /> Adicionar do Grimório
      </h3>
      <div className="relative mb-3">
        <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-slate-600" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar criatura..."
          className="w-full h-9 bg-slate-950 border border-slate-700 rounded pl-8 pr-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500" />
      </div>
      {filtered.length === 0 ? (
        <div className="text-xs text-slate-600 italic py-4 text-center">
          {creatures.length === 0 ? 'Nenhuma criatura no grimório ainda.' : 'Nenhum resultado.'}
        </div>
      ) : (
        <ul className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
          {filtered.map((c) => {
            const patamarClass = PATAMAR_BADGE[c.core?.patamar] ?? 'bg-slate-800 text-slate-300';
            return (
              <li key={c.id}
                className="flex items-center gap-2 bg-slate-950/60 border border-slate-800 rounded p-2 hover:border-purple-700/60 transition-colors">
                <span className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${patamarClass}`}>
                  {c.core?.patamar ?? '?'}
                </span>
                <span className="flex-1 text-sm text-slate-200 truncate">{c.name}</span>
                <span className="text-[10px] text-slate-500 tabular-nums">ND {c.core?.nd}</span>
                <button type="button" onClick={() => onAdd(c)}
                  className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded bg-purple-900/60 hover:bg-purple-800 text-xs font-semibold text-white transition-colors focus:outline-none focus:ring-1 focus:ring-purple-500"
                  aria-label={`Adicionar ${c.name}`}>
                  <Plus className="w-3 h-3" /> Adicionar
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};

const PcAdder = ({ onAdd }) => {
  const [name, setName] = useState('');
  const [mod, setMod] = useState(0);

  const handleAdd = useCallback(() => {
    if (!name.trim()) return;
    onAdd(name.trim(), Number(mod) || 0);
    setName('');
    setMod(0);
  }, [name, mod, onAdd]);

  return (
    <section className="bg-slate-900/60 border border-slate-800 rounded-lg p-4">
      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
        <UserPlus className="w-3.5 h-3.5" /> Adicionar Jogador (PC)
      </h3>
      <div className="space-y-2">
        <input type="text" value={name} onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Nome do personagem"
          className="w-full h-9 bg-slate-950 border border-slate-700 rounded px-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-sky-500" />
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-[10px] uppercase tracking-wider text-slate-500 mb-0.5 block">
              Mod. Iniciativa
            </label>
            <input type="number" value={mod} onChange={(e) => setMod(e.target.value)}
              className="w-full h-9 bg-slate-950 border border-slate-700 rounded px-3 text-sm text-white focus:outline-none focus:border-sky-500" />
          </div>
          <button type="button" onClick={handleAdd}
            className="self-end h-9 px-4 bg-sky-800 hover:bg-sky-700 rounded text-sm font-semibold text-white transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500">
            Adicionar
          </button>
        </div>
      </div>
    </section>
  );
};

const CombatantRow = ({ combatant, onRoll, onSetInitiative, onSetMod, onSetSide, onRemove }) => {
  const [editMode, setEditMode] = useState(false);
  const sideStyle = SIDE_STYLES[combatant.flags.side] ?? SIDE_STYLES.enemy;
  const badgeStyle = SIDE_BADGE[combatant.flags.side] ?? SIDE_BADGE.enemy;

  return (
    <li className={`border rounded-lg p-3 ${sideStyle}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded border ${badgeStyle}`}>
          {SIDE_LABELS[combatant.flags.side]}
        </span>
        <span className="flex-1 text-sm font-semibold text-white truncate">{combatant.displayName}</span>
        <button type="button" onClick={onRemove}
          className="text-slate-500 hover:text-red-400 focus:outline-none focus:ring-1 focus:ring-red-500/40 rounded"
          aria-label="Remover combatente">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-end gap-2 flex-wrap">
        <div>
          <label className="text-[10px] uppercase tracking-wider text-slate-500 mb-0.5 block">Mod</label>
          <input type="number" value={combatant.initiative.modifier}
            onChange={(e) => onSetMod(Number(e.target.value) || 0)}
            className="w-16 h-8 bg-slate-950 border border-slate-700 rounded px-2 text-sm text-white tabular-nums focus:outline-none focus:border-purple-500" />
        </div>

        <div>
          <label className="text-[10px] uppercase tracking-wider text-slate-500 mb-0.5 block">Iniciativa</label>
          {editMode ? (
            <input type="number" value={combatant.initiative.total}
              onChange={(e) => onSetInitiative(Number(e.target.value) || 0)}
              onBlur={() => setEditMode(false)}
              onKeyDown={(e) => e.key === 'Enter' && setEditMode(false)}
              autoFocus
              className="w-16 h-8 bg-slate-950 border border-amber-700 rounded px-2 text-sm text-amber-200 tabular-nums focus:outline-none" />
          ) : (
            <button type="button" onClick={() => setEditMode(true)}
              className={`w-16 h-8 rounded px-2 text-sm tabular-nums font-bold text-left border transition-colors focus:outline-none focus:ring-1 focus:ring-purple-500/40 ${
                combatant.initiative.isManual
                  ? 'bg-amber-950/40 border-amber-900 text-amber-200'
                  : 'bg-slate-950 border-slate-700 text-white'
              }`}
              aria-label="Editar iniciativa">
              {combatant.initiative.total || '—'}
            </button>
          )}
        </div>

        <button type="button" onClick={onRoll}
          className="h-8 px-3 rounded bg-purple-900/60 hover:bg-purple-800 border border-purple-800 text-xs font-semibold text-purple-100 inline-flex items-center gap-1 focus:outline-none focus:ring-1 focus:ring-purple-500">
          <Dices className="w-3.5 h-3.5" /> Rolar
        </button>

        <select value={combatant.flags.side}
          onChange={(e) => onSetSide(e.target.value)}
          className="h-8 bg-slate-950 border border-slate-700 rounded px-2 text-xs text-white focus:outline-none focus:border-purple-500"
          aria-label="Lado do combatente">
          {Object.entries(SIDE_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>
    </li>
  );
};

const EncounterPlanner = ({ encounter, derived, actions, creatures, onBack }) => {
  const [nameEdit, setNameEdit] = useState(false);
  const [tempName, setTempName] = useState(encounter.name);

  const commitName = useCallback(() => {
    if (tempName.trim() && tempName !== encounter.name) {
      actions.rename(tempName.trim());
    }
    setNameEdit(false);
  }, [tempName, encounter.name, actions]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950/30 text-white">
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur border-b border-purple-900/50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4 flex-wrap">
          <button type="button" onClick={onBack}
            className="flex items-center gap-2 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-sm text-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500/60">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>

          <div className="flex-1 min-w-0">
            {nameEdit ? (
              <input type="text" value={tempName} onChange={(e) => setTempName(e.target.value)}
                onBlur={commitName} onKeyDown={(e) => e.key === 'Enter' && commitName()}
                autoFocus
                className="w-full bg-transparent text-xl sm:text-2xl font-bold text-white border-b border-purple-500 focus:outline-none" />
            ) : (
              <button type="button" onClick={() => { setTempName(encounter.name); setNameEdit(true); }}
                className="text-xl sm:text-2xl font-bold text-white inline-flex items-center gap-2 hover:text-purple-300 focus:outline-none focus:ring-1 focus:ring-purple-500/40 rounded">
                {encounter.name} <Edit3 className="w-4 h-4 text-slate-500" />
              </button>
            )}
            <div className="text-xs text-slate-500 uppercase tracking-wider mt-0.5">
              Planejando · {derived.totalCombatants} combatente(s)
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button type="button" onClick={() => actions.rollAll(true)}
              disabled={derived.totalCombatants === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-sm font-semibold text-slate-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-purple-500/60"
              title="Rola iniciativa apenas dos combatentes ainda não rolados">
              <Dices className="w-4 h-4" /> Rolar Vazios
            </button>
            <button type="button" onClick={() => actions.rollAll(false)}
              disabled={derived.totalCombatants === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-purple-800 hover:bg-purple-700 text-sm font-semibold text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-purple-500">
              <Dices className="w-4 h-4" /> Rolar Tudo
            </button>
            <button type="button" onClick={actions.startCombat}
              disabled={!derived.validation.valid}
              title={derived.validation.valid ? 'Começar combate' : derived.validation.errors.join(' · ')}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded bg-emerald-800 hover:bg-emerald-700 text-sm font-semibold text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <Play className="w-4 h-4" /> Começar
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <CreaturePicker creatures={creatures} onAdd={(c) => actions.addCombatant(c)} />
            <PcAdder onAdd={actions.addPc} />
          </div>

          <div className="lg:col-span-2">
            <section className="bg-slate-900/60 border border-slate-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <Swords className="w-3.5 h-3.5" /> Combatentes ({derived.totalCombatants})
                </h3>
                {!derived.validation.valid && (
                  <span className="text-[10px] text-amber-400 uppercase tracking-wider">
                    {derived.validation.errors[0]}
                  </span>
                )}
              </div>

              {derived.totalCombatants === 0 ? (
                <div className="text-center py-12 text-slate-600 text-sm italic border border-dashed border-slate-800 rounded-lg">
                  Adicione combatentes do painel à esquerda.
                </div>
              ) : (
                <ul className="space-y-2">
                  {derived.orderedCombatants.map((c) => (
                    <CombatantRow key={c.id} combatant={c}
                      onRoll={() => actions.rollOne(c.id)}
                      onSetInitiative={(v) => actions.setInitiative(c.id, v)}
                      onSetMod={(v) => actions.setInitiativeModifier(c.id, v)}
                      onSetSide={(v) => actions.setSide(c.id, v)}
                      onRemove={() => actions.removeCombatant(c.id)} />
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

// ============================================================
// ACTIVE — COMBATE EM ANDAMENTO
// ============================================================
const InitiativeSidebar = ({ derived, encounter, focusedId, onFocus }) => (
  <aside className="bg-slate-900/60 border border-slate-800 rounded-lg p-3">
    <div className="flex items-center justify-between mb-2">
      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
        <Clock className="w-3.5 h-3.5" /> Rodada {encounter.round}
      </h3>
      <span className="text-[10px] text-slate-500">
        {derived.eligibleCombatants.length} / {derived.totalCombatants}
      </span>
    </div>
    <ul className="space-y-1.5">
      {derived.orderedCombatants.map((c) => {
        const isActive = c.id === encounter.activeCombatantId;
        const isFocused = c.id === focusedId;
        const isDefeated = c.flags.isDefeated;
        const isHidden = c.flags.isHidden;
        const hpMax = c.snapshot?.stats?.hpMax ?? 0;
        const hpCur = c.combatState?.hpCurrent ?? 0;
        const hpPct = hpMax > 0 ? Math.max(0, Math.min(100, (hpCur / hpMax) * 100)) : 0;
        const sideBadge = SIDE_BADGE[c.flags.side] ?? SIDE_BADGE.enemy;

        return (
          <li key={c.id}>
            <button type="button" onClick={() => onFocus(c.id)}
              className={`w-full text-left px-2.5 py-2 rounded border transition-all focus:outline-none focus:ring-1 focus:ring-purple-500/60 ${
                isActive
                  ? 'bg-purple-950/40 border-l-4 border-purple-500 border-y-purple-800 border-r-purple-800'
                  : isFocused
                    ? 'bg-slate-800/60 border-slate-600'
                    : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
              } ${isDefeated ? 'opacity-40 grayscale' : ''} ${isHidden ? 'opacity-60' : ''}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-bold text-white tabular-nums w-7">{c.initiative.total}</span>
                {isActive && <span className="text-purple-300" aria-label="Turno ativo">⚡</span>}
                <span className="flex-1 text-sm text-slate-200 truncate">{c.displayName}</span>
                {isDefeated && <Skull className="w-3.5 h-3.5 text-slate-500" aria-label="Abatido" />}
                {isHidden && <EyeOff className="w-3.5 h-3.5 text-slate-500" aria-label="Oculto" />}
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[9px] uppercase tracking-wider font-bold px-1 py-0.5 rounded border ${sideBadge}`}>
                  {SIDE_LABELS[c.flags.side]}
                </span>
                {c.combatState && hpMax > 0 && (
                  <div className="flex-1 h-1 bg-slate-900 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-rose-600 to-red-700 transition-all"
                      style={{ width: `${hpPct}%` }} />
                  </div>
                )}
                {c.combatState && (
                  <span className="text-[10px] text-slate-500 tabular-nums">{hpCur}/{hpMax}</span>
                )}
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  </aside>
);

const EncounterActive = ({ encounter, derived, actions, onBack }) => {
  const [focusedId, setFocusedId] = useState(encounter.activeCombatantId);
  const [showSidebar, setShowSidebar] = useState(false);

  // Sincroniza foco com o turno ativo quando ele muda (o usuário pode desviar o foco)
  const effectiveFocusId = focusedId ?? encounter.activeCombatantId;
  const focusedCombatant = useMemo(
    () => encounter.combatants.find((c) => c.id === effectiveFocusId) ?? derived.activeCombatant,
    [encounter.combatants, effectiveFocusId, derived.activeCombatant]
  );

  const handleNextTurn = useCallback(() => {
    actions.nextTurn();
    // Ao avançar, muda o foco pro novo ativo
    setFocusedId(null);
  }, [actions]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950/30 text-white">
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur border-b border-purple-900/50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3 flex-wrap">
          <button type="button" onClick={onBack}
            className="flex items-center gap-2 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-sm text-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500/60">
            <ArrowLeft className="w-4 h-4" /> Sair
          </button>

          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-white truncate">{encounter.name}</h1>
            <div className="text-xs text-slate-500 uppercase tracking-wider">
              Rodada {encounter.round} · {derived.eligibleCombatants.length} em combate
            </div>
          </div>

          <button type="button" onClick={() => setShowSidebar((v) => !v)}
            className="lg:hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/60"
            aria-label="Alternar lista de iniciativa">
            <Users className="w-4 h-4" /> Iniciativa
          </button>

          <button type="button" onClick={actions.newRound}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-900/60 hover:bg-emerald-800 border border-emerald-800 text-sm font-semibold text-emerald-100 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
            title="Força início de nova rodada (reaplica Guarda Inabalável em todos)">
            <Clock className="w-4 h-4" /> Nova Rodada
          </button>
          <button type="button" onClick={handleNextTurn}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded bg-purple-800 hover:bg-purple-700 text-sm font-bold text-white transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500">
            <SkipForward className="w-4 h-4" /> Próximo Turno
          </button>
          <button type="button" onClick={actions.endCombat}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-red-900/50 hover:bg-red-800 border border-red-800 text-sm text-red-200 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500">
            <Pause className="w-4 h-4" /> Encerrar
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Sidebar desktop */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="sticky top-20">
              <InitiativeSidebar derived={derived} encounter={encounter}
                focusedId={effectiveFocusId} onFocus={setFocusedId} />
            </div>
          </div>

          {/* Drawer mobile */}
          {showSidebar && (
            <div className="lg:hidden col-span-1">
              <InitiativeSidebar derived={derived} encounter={encounter}
                focusedId={effectiveFocusId}
                onFocus={(id) => { setFocusedId(id); setShowSidebar(false); }} />
            </div>
          )}

          {/* Painel principal */}
          <div className="lg:col-span-3">
            {focusedCombatant ? (
              <CombatantPanel
                combatant={focusedCombatant}
                onCombatStateChange={(cs) => actions.updateCombatState(focusedCombatant.id, cs)}
                onFlagChange={(key, value) => actions.setFlag(focusedCombatant.id, key, value)}
                onNewRound={undefined /* nova rodada é global aqui, feita pelo header */} />
            ) : (
              <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-12 text-center">
                <div className="text-slate-500">Selecione um combatente na lista.</div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

// ============================================================
// FINISHED — ENCONTRO ENCERRADO
// ============================================================
const EncounterFinished = ({ encounter, derived, actions, onBack, onDuplicate }) => (
  <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950/30 text-white">
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur border-b border-purple-900/50">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-4">
        <button type="button" onClick={onBack}
          className="flex items-center gap-2 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-sm text-slate-300 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-white truncate">{encounter.name}</h1>
          <div className="text-xs text-slate-500 uppercase tracking-wider">Encontro encerrado</div>
        </div>
        <button type="button" onClick={onDuplicate}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-purple-800 hover:bg-purple-700 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
          <Copy className="w-4 h-4" /> Duplicar para Nova Sessão
        </button>
        <button type="button" onClick={actions.reopen}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/60"
          title="Voltar para planejamento (edição)">
          <Edit3 className="w-4 h-4" /> Reabrir
        </button>
      </div>
    </header>

    <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <section className="bg-slate-900/60 border border-slate-800 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <Trophy className="w-8 h-8 text-amber-400" />
          <div>
            <div className="text-xs uppercase tracking-widest text-slate-500">Resumo</div>
            <div className="text-lg font-bold text-white">
              {encounter.round} rodada(s) · {derived.totalCombatants} combatente(s)
            </div>
          </div>
        </div>
        <ul className="space-y-2">
          {derived.orderedCombatants.map((c) => (
            <li key={c.id}
              className={`flex items-center gap-3 px-3 py-2 rounded border ${
                c.flags.isDefeated
                  ? 'bg-red-950/20 border-red-900/60 opacity-70'
                  : 'bg-slate-950/40 border-slate-800'
              }`}>
              <span className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded border ${SIDE_BADGE[c.flags.side]}`}>
                {SIDE_LABELS[c.flags.side]}
              </span>
              <span className="flex-1 text-sm text-slate-200">{c.displayName}</span>
              {c.flags.isDefeated ? (
                <span className="inline-flex items-center gap-1 text-xs text-red-400">
                  <Skull className="w-3 h-3" /> Abatido
                </span>
              ) : c.combatState ? (
                <span className="text-xs text-slate-500 tabular-nums">
                  HP {c.combatState.hpCurrent}/{c.snapshot?.stats?.hpMax ?? 0}
                </span>
              ) : (
                <span className="text-xs text-slate-500">—</span>
              )}
            </li>
          ))}
        </ul>
      </section>

      {encounter.log.length > 0 && (
        <section className="bg-slate-900/60 border border-slate-800 rounded-lg p-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
            Log ({encounter.log.length})
          </h3>
          <ul className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
            {encounter.log.map((e) => (
              <li key={e.id} className="py-1.5 text-xs text-slate-400">
                <span className="text-slate-600 uppercase tracking-wider text-[10px] mr-2">
                  R{e.round} · {e.type}
                </span>
                {e.message}
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  </div>
);

// ============================================================
// ROUTER POR STATUS
// ============================================================
const STATUS_RENDERERS = {
  [ENCOUNTER_STATUS.PLANNING]: EncounterPlanner,
  [ENCOUNTER_STATUS.ACTIVE]: EncounterActive,
  [ENCOUNTER_STATUS.FINISHED]: EncounterFinished
};

// ============================================================
// COMPONENTE EXPORTADO
// ============================================================
export default function EncounterTracker({ encounterId, manager, creatures, onBack, onDuplicate }) {
  const { encounter, derived, actions } = useEncounter(encounterId, manager);

  if (!encounter) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-slate-400 mb-3">Encontro não encontrado.</div>
          <button type="button" onClick={onBack}
            className="px-4 py-2 rounded bg-purple-800 hover:bg-purple-700 text-white">
            Voltar
          </button>
        </div>
      </div>
    );
  }

  const Renderer = STATUS_RENDERERS[encounter.status] ?? EncounterPlanner;

  return (
    <Renderer
      encounter={encounter}
      derived={derived}
      actions={actions}
      creatures={creatures}
      onBack={onBack}
      onDuplicate={() => onDuplicate?.(encounter.id)} />
  );
}