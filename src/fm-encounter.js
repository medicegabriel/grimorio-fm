// fm-encounter.js
// Camada 2 — Funções puras para gerenciamento de encontros.
// Zero React, zero side-effects externos. Math.random é isolado aqui.

import { tickModifiersRound } from './components/fm-modifiers';

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
  hpMaxBase: stats.hpMax ?? 0,
  almaAtual: stats.hpMax ?? 0,
  peCurrent: stats.peMax ?? 0,
  guardaInabavalCurrent: stats.guardaInabavalMax ?? 0,
  // Override situacional de RD (zera no Reset de Combate). Quando ativo, o
  // dano ignora a RD Geral (só a Irredutível continua valendo). O valor é o
  // "ignorar parcial": desconta X da RD Geral antes de reduzir o dano.
  ignorarRdAtivo: false,
  ignorarRdValor: 0,
  resistenciaParcialUsed: 0,
  resistenciaTotalUsed: 0,
  integridadeCurrent: 3, // EXT: se o sistema define isso por patamar, mover para fm-tables.js
  activeConditions: [],
  // Modificadores temporários (buffs/debuffs) aplicados sobre os stats do
  // snapshot. Resolvidos por resolveLiveStats (fm-modifiers.js). Zeram no
  // Reset de Combate; os de duração "rodadas" expiram em applyNewRoundEffects.
  activeModifiers: [],
  // PE temporário por FONTE (round_start; "mesma fonte só o maior"). PV temp =
  // excedente do hpCurrent acima do máximo (sem campo próprio).
  peTempSources: {},
  lastDamage: 0,
  isInDesafiandoMorte: false,
  missCounter: 0,
  susceptivelFinalizacao: false,
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

  // Posição do combatente ativo na ordem COMPLETA (inclui derrotados/ocultos).
  // Procurar na ordem completa — e não na lista de elegíveis — evita "perder
  // o lugar" quando o combatente do turno atual é abatido: ele sai dos
  // elegíveis, mas continua na ordem, então o avanço parte da posição certa.
  const currentIdx = ordered.findIndex(
    (c) => c.id === encounter.activeCombatantId
  );

  // Sem combatente ativo conhecido → começa do primeiro elegível, sem virar rodada.
  if (currentIdx === -1) {
    return {
      nextCombatantId: eligible[0].id,
      newRound: encounter.round,
      isNewRound: false
    };
  }

  // Próximo elegível DEPOIS da posição atual na ordem completa.
  for (let i = currentIdx + 1; i < ordered.length; i++) {
    if (isEligibleForTurn(ordered[i])) {
      return {
        nextCombatantId: ordered[i].id,
        newRound: encounter.round,
        isNewRound: false
      };
    }
  }

  // Ninguém elegível adiante → vira a rodada e volta ao primeiro elegível.
  return {
    nextCombatantId: eligible[0].id,
    newRound: encounter.round + 1,
    isNewRound: true
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
// EXT: adicionar regeneração, etc. (tick de condições é POR TURNO — ver
// tickCombatantConditions — não mais no vira-rodada.)
// ============================================================
// `tickConditions` (default true): decrementa as condições por rodada. No
// multi-tracker (EncounterTracker) passamos `false` porque as condições passaram
// a contar POR TURNO — cada combatente tica as suas no início do próprio turno
// (ver tickCombatantConditions). No single-tracker o padrão true é o correto,
// pois com 1 combatente o turno dele É a rodada.
export const applyNewRoundEffects = (combatant, { tickConditions = true } = {}) => {
  if (!combatant.combatState) return combatant; // PC
  if (combatant.flags.isDefeated) return combatant;

  const stats = combatant.snapshot?.stats ?? {};
  const guardaMax = stats.guardaInabavalMax ?? 0;

  // duracao === null = condição permanente (ex: Caído, Sangramento) — nunca decrementa nem remove
  const updatedConditions = tickConditions
    ? (combatant.combatState.activeConditions ?? [])
        .map((c) => c.duracao == null ? c : { ...c, duracao: c.duracao - 1 })
        .filter((c) => c.duracao == null || c.duracao > 0)
    : (combatant.combatState.activeConditions ?? []);

  return {
    ...combatant,
    combatState: {
      ...combatant.combatState,
      guardaInabavalCurrent: guardaMax,
      activeConditions: updatedConditions,
      activeModifiers: tickModifiersRound(combatant.combatState.activeModifiers ?? [])
    }
  };
};

export const applyNewRoundToAll = (combatants, opts) =>
  combatants.map((c) => applyNewRoundEffects(c, opts));

// Tick de condições de UM combatente — chamado no INÍCIO do turno dele (multi).
// Usa a MESMA matemática do tick de rodada, só localizada no combatente da vez:
// as condições contam/expiram quando chega o turno de cada um, e não quando
// vira a rodada. Retorna o combatente atualizado + as condições que expiraram
// (para log). Condições de duracao === null (permanentes) nunca decrementam.
export const tickCombatantConditions = (combatant) => {
  if (!combatant.combatState) return { combatant, expired: [] };
  const conditions = combatant.combatState.activeConditions ?? [];
  if (!conditions.some((c) => c.duracao != null)) return { combatant, expired: [] };

  const expired = conditions
    .filter((c) => c.duracao != null && c.duracao - 1 <= 0)
    .map((c) => ({ conditionName: c.name, combatantName: combatant.displayName }));
  const updated = conditions
    .map((c) => c.duracao == null ? c : { ...c, duracao: c.duracao - 1 })
    .filter((c) => c.duracao == null || c.duracao > 0);

  return {
    combatant: {
      ...combatant,
      combatState: { ...combatant.combatState, activeConditions: updated },
    },
    expired,
  };
};

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

// ============================================================
// INTEGRIDADE DA ALMA — Derived State
// Retorna o estado calculado on-the-fly sem mutar o combatState.
// ============================================================
export const ALMA_ESTADOS = {
  estavel:   { label: 'Estável',   cor: 'cyan',   penalidade: 0,  desvantagem: false, custoExtra: 0, condicoes: [] },
  danificado:{ label: 'Danificado',cor: 'yellow', penalidade: -3, desvantagem: false, custoExtra: 2, condicoes: [] },
  instavel:  { label: 'Instável',  cor: 'orange', penalidade: -6, desvantagem: false, custoExtra: 3, condicoes: ['Exposto'] },
  critico:   { label: 'Crítico',   cor: 'red',    penalidade: -8, desvantagem: true,  custoExtra: 5, condicoes: ['Exposto', 'Fragilizado'] },
  destruido: { label: 'Destruído', cor: 'dead',   penalidade: 0,  desvantagem: false, custoExtra: 0, condicoes: [] },
};

export const computeAlmaStatus = (almaAtual, hpMaxBase) => {
  const base = hpMaxBase ?? 0;
  const alma = almaAtual ?? base;
  const hpMaxAtual = Math.max(0, alma);

  if (base <= 0 || alma <= 0) {
    return { pct: 0, hpMaxAtual: 0, estadoKey: 'destruido', ...ALMA_ESTADOS.destruido };
  }

  const pct = (alma / base) * 100;

  let estadoKey;
  if (pct > 75)      estadoKey = 'estavel';
  else if (pct > 50) estadoKey = 'danificado';
  else if (pct > 25) estadoKey = 'instavel';
  else               estadoKey = 'critico';

  return { pct, hpMaxAtual, estadoKey, ...ALMA_ESTADOS[estadoKey] };
};