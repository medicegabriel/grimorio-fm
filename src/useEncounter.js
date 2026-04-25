// useEncounter.js
// Hook de um encontro ativo. Reducer PURO + autosave em storage.
// Toda mutação do encounter passa por aqui — e vai direto pra storage.

import { useMemo, useCallback } from 'react';
import {
  createCombatant, createPcCombatant, autoNumberDuplicates,
  orderByInitiative, rollAllInitiatives, setManualInitiative,
  getNextTurn, applyNewRoundToAll, isAutoDefeated,
  validateReadyToStart, ENCOUNTER_STATUS, canTransition,
  createLogEntry, LOG_TYPES, rollInitiative
} from './fm-encounter';

// ============================================================
// REDUCER PURO (dicionário de handlers)
// ============================================================
const HANDLERS = {
  RENAME: (state, { name }) => ({ ...state, name }),

  ADD_COMBATANT: (state, { creature, opts = {} }) => {
    const combatant = createCombatant(creature, opts);
    // Se initiative foi fornecida (adição mid-combat), aplica imediatamente
    const withInitiative = opts.initiative != null
      ? setManualInitiative(combatant, opts.initiative)
      : combatant;
    const combatants = autoNumberDuplicates([...state.combatants, withInitiative]);
    return { ...state, combatants };
  },

  ADD_PC: (state, { name, initiativeModifier, initiative }) => {
    const pc = createPcCombatant({ name, initiativeModifier });
    const withInitiative = initiative != null
      ? setManualInitiative(pc, initiative)
      : pc;
    return { ...state, combatants: [...state.combatants, withInitiative] };
  },

  REMOVE_COMBATANT: (state, { id }) => {
    const filtered = state.combatants.filter((c) => c.id !== id);
    const combatants = autoNumberDuplicates(filtered);
    const activeCombatantId = state.activeCombatantId === id ? null : state.activeCombatantId;
    return { ...state, combatants, activeCombatantId };
  },

  SET_INITIATIVE: (state, { id, total }) => ({
    ...state,
    combatants: state.combatants.map((c) =>
      c.id === id ? setManualInitiative(c, total) : c
    )
  }),

  SET_INITIATIVE_MODIFIER: (state, { id, modifier }) => ({
    ...state,
    combatants: state.combatants.map((c) =>
      c.id === id ? { ...c, initiative: { ...c.initiative, modifier } } : c
    )
  }),

  ROLL_ONE: (state, { id }) => ({
    ...state,
    combatants: state.combatants.map((c) => {
      if (c.id !== id) return c;
      const roll = Math.floor(Math.random() * 20) + 1;
      return {
        ...c,
        initiative: {
          ...c.initiative,
          roll,
          total: roll + c.initiative.modifier,
          isManual: false
        }
      };
    })
  }),

  ROLL_ALL: (state, { onlyUnset = false }) => ({
    ...state,
    combatants: rollAllInitiatives(state.combatants, { onlyUnset })
  }),

  SET_SIDE: (state, { id, side }) => ({
    ...state,
    combatants: state.combatants.map((c) =>
      c.id === id ? { ...c, flags: { ...c.flags, side } } : c
    )
  }),

  SET_FLAG: (state, { id, key, value }) => ({
    ...state,
    combatants: state.combatants.map((c) =>
      c.id === id ? { ...c, flags: { ...c.flags, [key]: value } } : c
    )
  }),

  UPDATE_COMBAT_STATE: (state, { id, combatState }) => ({
    ...state,
    combatants: state.combatants.map((c) => {
      if (c.id !== id) return c;
      const next = { ...c, combatState };
      // Auto-defeat apenas quando missCounter >= 3 (Desafiando a Morte esgotado)
      if (isAutoDefeated(next) && !c.flags.isDefeated) {
        return { ...next, flags: { ...c.flags, isDefeated: true } };
      }
      return next;
    })
  }),

  START_COMBAT: (state) => {
    if (!canTransition(state.status, ENCOUNTER_STATUS.ACTIVE)) return state;
    const ordered = orderByInitiative(state.combatants);
    const firstEligible = ordered.find((c) => !c.flags.isDefeated && !c.flags.isHidden);
    return {
      ...state,
      status: ENCOUNTER_STATUS.ACTIVE,
      round: 1,
      activeCombatantId: firstEligible?.id ?? null,
      log: [
        createLogEntry({ round: 1, type: LOG_TYPES.ROUND, message: 'Combate iniciado. Rodada 1.' }),
        ...state.log
      ]
    };
  },

  NEXT_TURN: (state) => {
    if (state.status !== ENCOUNTER_STATUS.ACTIVE) return state;
    const { nextCombatantId, newRound, isNewRound } = getNextTurn(state);

    let combatants = state.combatants;
    const log = [...state.log];

    if (isNewRound) {
      combatants = applyNewRoundToAll(combatants);
      log.unshift(createLogEntry({
        round: newRound, type: LOG_TYPES.ROUND,
        message: `Rodada ${newRound} iniciada.`
      }));
    }

    if (nextCombatantId) {
      const active = combatants.find((c) => c.id === nextCombatantId);
      log.unshift(createLogEntry({
        round: newRound, type: LOG_TYPES.TURN,
        message: `Turno de ${active?.displayName ?? '—'}.`,
        combatantId: nextCombatantId
      }));
    }

    return { ...state, combatants, round: newRound, activeCombatantId: nextCombatantId, log };
  },

  NEW_ROUND: (state) => {
    // Força nova rodada manualmente (reaplica Guarda + avança contador)
    if (state.status !== ENCOUNTER_STATUS.ACTIVE) return state;
    const combatants = applyNewRoundToAll(state.combatants);
    const round = state.round + 1;
    return {
      ...state, combatants, round,
      log: [
        createLogEntry({ round, type: LOG_TYPES.ROUND, message: `Rodada ${round} forçada manualmente.` }),
        ...state.log
      ]
    };
  },

  END_COMBAT: (state) => {
    if (!canTransition(state.status, ENCOUNTER_STATUS.FINISHED)) return state;
    return {
      ...state,
      status: ENCOUNTER_STATUS.FINISHED,
      activeCombatantId: null,
      log: [
        createLogEntry({ round: state.round, type: LOG_TYPES.ROUND, message: 'Combate encerrado.' }),
        ...state.log
      ]
    };
  },

  REOPEN: (state) => {
    // Volta pra planning (útil quando encerrou sem querer)
    if (!canTransition(state.status, ENCOUNTER_STATUS.PLANNING)) return state;
    return { ...state, status: ENCOUNTER_STATUS.PLANNING, activeCombatantId: null };
  }
};

const encounterReducer = (state, action) => {
  const handler = HANDLERS[action.type];
  if (!handler) {
    console.warn('[useEncounter] Ação desconhecida:', action.type);
    return state;
  }
  return handler(state, action);
};

// ============================================================
// HOOK
// ============================================================
export default function useEncounter(encounterId, manager) {
  const encounter = useMemo(
    () => manager.encounters.find((e) => e.id === encounterId) ?? null,
    [manager.encounters, encounterId]
  );

  const dispatch = useCallback((action) => {
    if (!encounter) return;
    manager.update(encounterId, (prev) => encounterReducer(prev, action));
  }, [encounter, encounterId, manager]);

  // Action creators nomeados
  const actions = useMemo(() => ({
    rename: (name) => dispatch({ type: 'RENAME', name }),
    addCombatant: (creature, opts) => dispatch({ type: 'ADD_COMBATANT', creature, opts }),
    addPc: (name, initiativeModifier = 0, initiative = null) => dispatch({ type: 'ADD_PC', name, initiativeModifier, initiative }),
    removeCombatant: (id) => dispatch({ type: 'REMOVE_COMBATANT', id }),
    setInitiative: (id, total) => dispatch({ type: 'SET_INITIATIVE', id, total }),
    setInitiativeModifier: (id, modifier) => dispatch({ type: 'SET_INITIATIVE_MODIFIER', id, modifier }),
    rollOne: (id) => dispatch({ type: 'ROLL_ONE', id }),
    rollAll: (onlyUnset = false) => dispatch({ type: 'ROLL_ALL', onlyUnset }),
    setSide: (id, side) => dispatch({ type: 'SET_SIDE', id, side }),
    setFlag: (id, key, value) => dispatch({ type: 'SET_FLAG', id, key, value }),
    updateCombatState: (id, combatState) => dispatch({ type: 'UPDATE_COMBAT_STATE', id, combatState }),
    startCombat: () => dispatch({ type: 'START_COMBAT' }),
    nextTurn: () => dispatch({ type: 'NEXT_TURN' }),
    newRound: () => dispatch({ type: 'NEW_ROUND' }),
    endCombat: () => dispatch({ type: 'END_COMBAT' }),
    reopen: () => dispatch({ type: 'REOPEN' })
  }), [dispatch]);

  // Dados derivados
  const derived = useMemo(() => {
    if (!encounter) return null;
    const ordered = orderByInitiative(encounter.combatants);
    const eligible = ordered.filter((c) => !c.flags.isDefeated && !c.flags.isHidden);
    const activeCombatant = encounter.combatants.find((c) => c.id === encounter.activeCombatantId) ?? null;
    const validation = validateReadyToStart(encounter);
    return {
      orderedCombatants: ordered,
      eligibleCombatants: eligible,
      activeCombatant,
      validation,
      totalCombatants: encounter.combatants.length,
      defeatedCount: encounter.combatants.filter((c) => c.flags.isDefeated).length
    };
  }, [encounter]);

  return { encounter, derived, actions };
}