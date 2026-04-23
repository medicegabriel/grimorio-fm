import { useMemo, useCallback } from 'react';
import { ArrowLeft } from 'lucide-react';
import CombatantPanel from './CombatantPanel';
import { createInitialCombatState } from '../fm-encounter';

export default function CombatTracker({ creature, onUpdate, onExit }) {
  const combatant = useMemo(() => ({
    id: `single_${creature.id}`,
    creatureId: creature.id,
    displayName: creature.name,
    snapshot: creature,
    combatState: creature.combatState ?? createInitialCombatState(creature.stats),
    initiative: { roll: 0, modifier: creature.stats?.iniciativa ?? 0, total: 0, isManual: false },
    flags: { isDefeated: false, isHidden: false, side: 'enemy' }
  }), [creature]);

  const handleCombatStateChange = useCallback((nextCombatState) => {
    onUpdate?.({ ...creature, combatState: nextCombatState, updatedAt: new Date().toISOString() });
  }, [creature, onUpdate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950/30 text-white">
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur border-b border-purple-900/50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <button type="button" onClick={onExit}
            className="flex items-center gap-2 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-sm text-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500/60"
            aria-label="Voltar ao Dashboard">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-6">
        <CombatantPanel
          combatant={combatant}
          onCombatStateChange={handleCombatStateChange}
          onFlagChange={() => { /* no-op em single-mode */ }}
          onNewRound={() => { /* efeitos já aplicados no panel */ }} />
      </main>
    </div>
  );
}