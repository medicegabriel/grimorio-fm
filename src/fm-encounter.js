// fm-encounter.js
// Camada 2 — Funções puras para gerenciamento de encontros.
// Zero React, zero side-effects externos. Math.random é isolado aqui.

// ============================================================
// STATUS MACHINE
// ============================================================
export const ENCOUNTER_STATUS = {
  PLANNING: 'planning',
  ACTIVE: 'active',
  FINISHED: 'finished'
};

export const STATUS_TRANSITIONS = {
  planning: ['active'],
  active: ['finished', 'planning'],
  finished: ['planning']
};

export const canTransition = (from, to) =>
  STATUS_TRANSITIONS[from]?.includes(to) ?? false;

// ============================================================
// LADOS (flags.side)
// ============================================================
export const COMBATANT_SIDE = {
  ENEMY: 'enemy',
  PC: 'pc',
  ALLY: 'ally'
};

export const SIDE_LABELS = {
  enemy: 'Inimigo',
  pc: 'Jogador',
  ally: 'Aliado'
};

// ============================================================
// UTILS
// ============================================================
const genId = (prefix) =>
  `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

const deepClone = (obj) =>
  typeof structuredClone === 'function'
    ? structuredClone(obj)
    : JSON.parse(JSON.stringify(obj));

const d20 = () => Math.floor(Math.random() * 20) + 1;

// ============================================================
// FACTORY — combatState inicial a partir dos stats da snapshot
// ============================================================
export const createInitialCombatState = (stats = {}) => ({
  isActive: true,
  hpCurrent: stats.hpMax ?? 0,
  peCurrent: stats.peMax ?? 0,
  guardaInabavalCurrent: stats.guardaInabavalMax ?? 0,
  resistenciaParcialUsed: 0,
  resistenciaTotalUsed: 0,
  integridadeCurrent: 3, // EXT: se o sistema define isso por patamar, mover para fm-tables.js
  activeConditions: [],
  temporaryHp: 0,
  isInDesafiandoMorte: false,
  missCounter: 0,
  customCounters: [],
  combatLog: []
});

// ============================================================
// FACTORY — Combatant a partir de creature (snapshot profundo)
// ============================================================
export const createCombatant = (
  creature,
  { copyNumber = null, side = COMBATANT_SIDE.ENEMY } = {}
) => {
  const snapshot = deepClone(creature);
  const baseName = snapshot.name ?? 'Combatente';
  const displayName = copyNumber ? `${baseName} #${copyNumber}` : baseName;

  // Respeita combatState existente (permite retomar combate); senão deriva.
  const hasExistingState =
    snapshot.combatState && snapshot.combatState.hpCurrent != null;
  const combatState = hasExistingState
    ? deepClone(snapshot.combatState)
    : createInitialCombatState(snapshot.stats);

  return {
    id: genId('cmb'),
    creatureId: snapshot.id ?? null,
    displayName,
    snapshot,
    initiative: {
      roll: 0,
      modifier: snapshot.stats?.iniciativa ?? 0,
      total: 0,
      isManual: false
    },
    combatState,
    flags: {
      isDefeated: false,
      isHidden: false,
      side
    }
  };
};

// ============================================================
// FACTORY — PC (placeholder sem ficha, só nome + iniciativa)
// ============================================================
export const createPcCombatant = ({ name, initiativeModifier = 0 } = {}) => ({
  id: genId('cmb'),
  creatureId: null,
  displayName: name || 'Jogador',
  snapshot: null,
  initiative: {
    roll: 0,
    modifier: initiativeModifier,
    total: 0,
    isManual: false
  },
  combatState: null, // PCs não renderizam CombatantPanel
  flags: {
    isDefeated: false,
    isHidden: false,
    side: COMBATANT_SIDE.PC
  }
});

// ============================================================
// INICIATIVA
// ============================================================
export const rollInitiative = (modifier = 0) => {
  const roll = d20();
  return { roll, total: roll + modifier };
};

export const rollAllInitiatives = (combatants, { onlyUnset = false } = {}) =>
  combatants.map((c) => {
    if (c.initiative.isManual) return c;
    if (onlyUnset && c.initiative.roll > 0) return c;
    const { roll, total } = rollInitiative(c.initiative.modifier);
    return { ...c, initiative: { ...c.initiative, roll, total, isManual: false } };
  });

export const setManualInitiative = (combatant, total) => ({
  ...combatant,
  initiative: {
    ...combatant.initiative,
    total,
    roll: total - combatant.initiative.modifier,
    isManual: true
  }
});

// ============================================================
// ORDENAÇÃO — desempate: total → modifier → id (estável)
// ============================================================
export const orderByInitiative = (combatants) =>
  [...combatants].sort((a, b) => {
    if (b.initiative.total !== a.initiative.total)
      return b.initiative.total - a.initiative.total;
    if (b.initiative.modifier !== a.initiative.modifier)
      return b.initiative.modifier - a.initiative.modifier;
    return a.id.localeCompare(b.id);
  });

// ============================================================
// ELEGIBILIDADE PARA TURNO
// ============================================================
const isEligibleForTurn = (c) => !c.flags.isDefeated && !c.flags.isHidden;

// ============================================================
// PRÓXIMO TURNO
// Retorna { nextCombatantId, newRound, isNewRound }
// ============================================================
export const getNextTurn = (encounter) => {
  const ordered = orderByInitiative(encounter.combatants);
  const eligible = ordered.filter(isEligibleForTurn);

  if (eligible.length === 0) {
    return {
      nextCombatantId: null,
      newRound: encounter.round,
      isNewRound: false
    };
  }

  const currentIdx = eligible.findIndex(
    (c) => c.id === encounter.activeCombatantId
  );

  // Nenhum ativo OU ativo ficou inelegível → começa do topo sem virar rodada
  if (currentIdx === -1) {
    return {
      nextCombatantId: eligible[0].id,
      newRound: encounter.round,
      isNewRound: false
    };
  }

  const nextIdx = currentIdx + 1;
  const isNewRound = nextIdx >= eligible.length;

  return {
    nextCombatantId: isNewRound ? eligible[0].id : eligible[nextIdx].id,
    newRound: isNewRound ? encounter.round + 1 : encounter.round,
    isNewRound
  };
};

// ============================================================
// AUTO-NUMERAÇÃO DE DUPLICATAS
// Agrupa por creatureId; se >1, renomeia com #1, #2, ...
// ============================================================
export const autoNumberDuplicates = (combatants) => {
  const groups = combatants.reduce((acc, c) => {
    if (!c.creatureId) return acc; // PCs e avulsos ficam de fora
    (acc[c.creatureId] ||= []).push(c);
    return acc;
  }, {});

  const renames = {};
  Object.values(groups).forEach((group) => {
    const baseName = group[0].snapshot?.name ?? 'Combatente';
    if (group.length <= 1) {
      renames[group[0].id] = baseName;
      return;
    }
    group.forEach((c, idx) => {
      renames[c.id] = `${baseName} #${idx + 1}`;
    });
  });

  return combatants.map((c) =>
    renames[c.id] != null ? { ...c, displayName: renames[c.id] } : c
  );
};

// ============================================================
// EFEITOS DE NOVA RODADA
// Regra atual: reseta Guarda Inabalável ao máximo.
// EXT: adicionar regeneração, tick de condições, etc.
// ============================================================
export const applyNewRoundEffects = (combatant) => {
  if (!combatant.combatState) return combatant; // PC
  if (combatant.flags.isDefeated) return combatant;

  const stats = combatant.snapshot?.stats ?? {};
  const guardaMax = stats.guardaInabavalMax ?? 0;
  const hpMax = stats.hpMax ?? 0;
  const currentHp = combatant.combatState.hpCurrent;

  // Regra do sistema: Guarda Inabalável reseta + cura HP até hpMax
  return {
    ...combatant,
    combatState: {
      ...combatant.combatState,
      guardaInabavalCurrent: guardaMax,
      hpCurrent: Math.min(hpMax, currentHp + guardaMax)
    }
  };
};

export const applyNewRoundToAll = (combatants) =>
  combatants.map(applyNewRoundEffects);

// ============================================================
// ENCOUNTER FACTORIES
// ============================================================
export const createEncounter = ({ name = 'Novo Encontro', folderId = null } = {}) => ({
  id: genId('enc'),
  name,
  folderId,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  status: ENCOUNTER_STATUS.PLANNING,
  round: 1,
  activeCombatantId: null,
  combatants: [],
  log: []
});

export const duplicateEncounter = (encounter) => {
  const cloned = deepClone(encounter);
  const newCombatants = cloned.combatants.map((c) => ({
    ...c,
    id: genId('cmb'),
    combatState: c.combatState
      ? createInitialCombatState(c.snapshot?.stats)
      : null,
    initiative: {
      roll: 0,
      modifier: c.initiative.modifier,
      total: 0,
      isManual: false
    },
    flags: { ...c.flags, isDefeated: false, isHidden: false }
  }));

  return {
    ...cloned,
    id: genId('enc'),
    name: `${cloned.name} (cópia)`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    status: ENCOUNTER_STATUS.PLANNING,
    round: 1,
    activeCombatantId: null,
    combatants: newCombatants,
    log: []
  };
};

// ============================================================
// VALIDAÇÃO — antes de transicionar para 'active'
// ============================================================
export const validateReadyToStart = (encounter) => {
  const errors = [];
  if (encounter.combatants.length === 0) {
    errors.push('Adicione pelo menos um combatente.');
  }
  const unset = encounter.combatants.filter(
    (c) => c.initiative.roll === 0 && !c.initiative.isManual
  );
  if (unset.length > 0) {
    errors.push(`${unset.length} combatente(s) sem iniciativa definida.`);
  }
  return { valid: errors.length === 0, errors };
};

// ============================================================
// DETECÇÃO DE ESTADO (dicionário de checks)
// ============================================================
export const DEFEAT_CHECKS = {
  missCounter: (cs) => cs != null && (cs.missCounter ?? 0) >= 3
};

export const isAutoDefeated = (combatant) => {
  if (!combatant.combatState) return false;
  return DEFEAT_CHECKS.missCounter(combatant.combatState);
};

// ============================================================
// HELPERS DE LOG (usados tanto no encounter.log quanto no combatState.combatLog)
// ============================================================
export const LOG_TYPES = {
  DAMAGE: 'damage',
  HEAL: 'heal',
  CONDITION: 'condition',
  TURN: 'turn',
  ROUND: 'round',
  CUSTOM: 'custom'
};

export const createLogEntry = ({
  round,
  type,
  message,
  combatantId = null
}) => ({
  id: genId('log'),
  round,
  timestamp: Date.now(),
  type,
  message,
  combatantId
});