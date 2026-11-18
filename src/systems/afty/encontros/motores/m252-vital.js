import {
  createInitialCombatState, computeAlmaStatus, createLogEntry, LOG_TYPES, isAutoDefeated,
} from "../../../../fm-encounter";
import {
  resolveLiveStats, newModifier, MODIFIER_TARGET_GROUPS, MODIFIER_OPS, STACK_MODES, DURATION_KINDS, getTargetLabel,
} from "../../../../components/fm-modifiers";
import {
  collectPassiveModifiers, ruleModifiers, ruleRequiresMet, resolveResourceChanges, resolveConditionEffects,
  ruleHasSustainedEffect, summarizeRule, activatedRulesOf, collectReactionRules, collectImmuneConditions,
} from "../../../../components/fm-automation";
import {
  collectAutomationEntities, applyRoundStartResources, applyTriggeredEffects, drainPeTemp,
} from "../../../../components/fm-automation-entities";
import { collectConditionModifiers } from "../../../../components/fm-conditions";
import { buildDslContext } from "../../../../components/fm-dsl";
import { CONDITIONS, SANGRAMENTO_LADDER } from "../../../../components/fm-tables";
// Quem aplicou cada duração (etapa 5). FOLHA, zero imports.
import { APLICADOR_PROPRIO, aplicadorDe, semMarcaDoTurno } from "../../ficha/ficha-uso-estado";

/**
 * ============================================================
 * A CONTA DA 2.5.2 NO ENCONTRO NOVO (Encontro Unificado, etapa 4, 2026-11-17)
 * ============================================================
 * COPIA FIEL, sem melhorar nem corrigir nada. A conta da criatura da 2.5.2 mora
 * DENTRO de componentes somente-leitura (`src/components/CombatantPanel.jsx`,
 * `src/components/EncounterTracker.jsx`) e de um reducer privado
 * (`src/useEncounter.js`), que não exportam nada disto. Aqui cada trecho foi
 * trazido para funções puras, com a origem anotada em cada uma (arquivo e
 * linhas de quando foi copiado, em 2026-11-17). O `t-encontro-252-porte.mjs`
 * confere os números contra as funções puras que a 2.5.2 exporta, e confere que
 * o `CombatantPanel.jsx` ainda tem o que está citado aqui.
 *
 * O que o painel mandava para `setFeedback`, `window.confirm` e `onCombatStateChange`
 * virou valor de retorno. O que lia `Date.now`, `Math.random` e `new Date()`
 * (ids e carimbos) lê o `ambiente`, que por padrão é o mesmo relógio e o mesmo sorteio.
 *
 * Desvios do original, todos pedidos ou obrigados (nenhum deles muda número):
 *  - o travessão U+2014 das frases do Registro virou dois-pontos (autor, 2026-11-17,
 *    "Trocar por dois-pontos"): `ativarRegra` e as frases dos gatilhos importados
 *    passam por `semTravessao`.
 *  - Descansar é o Reset do painel (autor, 2026-11-17, "Igual ao Reset").
 *  - o painel recebia `stats` AO VIVO por `useMemo`. Aqui o `derivado` (`derivarVivo`)
 *    carrega os mesmos `stats`, o `snapshot` e o `combatSettings`.
 *
 * ⚠ O DERIVADO DA 2.5.2 É UM OBJETO, e não a ficha derivada do Afty:
 *   `{ snapshot, stats, saves, attributes, skills, modified, almaEstado, combatSettings, hpMaxBase }`.
 * Verbo que precisa dele e não o recebe LANÇA "Ficha sem Cálculo": pular calado
 * deixaria a criatura com a Vida errada sem aviso.
 * ============================================================
 */


const clonar = (obj) => (typeof structuredClone === "function" ? structuredClone(obj) : JSON.parse(JSON.stringify(obj)));

/* Origem: CombatantPanel.jsx:331 (`normCond`), com a faixa dos acentos escrita por escape. */
export const normCond = (s) => (s ?? "").toString().normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

/** O relógio e o sorteio dos ids. Por padrão são os do painel. */
export const AMBIENTE_PADRAO = {
  agora: () => Date.now(),
  aleatorio: () => Math.random(),
  dataIso: () => new Date().toISOString(),
};

/* O travessão não entra no Registro do Encontro novo (autor, 2026-11-17). A frase do painel separava o nome do resumo com um travessão, e agora usa dois-pontos. */
const TRAVESSAO = String.fromCharCode(0x2014);
export const semTravessao = (texto) => String(texto ?? "").split(` ${TRAVESSAO} `).join(": ").split(TRAVESSAO).join("-");

export function exigirDerivado(d) {
  if (!d?.snapshot || !d?.stats) throw new Error("Ficha sem Cálculo");
  return d;
}

/* ============================================================ */
/* TABELAS COPIADAS                                              */
/* ============================================================ */

/* Origem: CombatantPanel.jsx:82-85. Alvos da penalidade do Estado da Alma. */
const ALMA_PENALTY_TARGETS = ["acerto", "astucia", "fortitude", "reflexos", "vontade", "integridade", "pericias"];

/* Origem: CombatantPanel.jsx:87-92. */
export const CONDITION_LEVEL_MAP = Object.entries({
  fracas: "fraca", medias: "media", fortes: "forte", extremas: "extrema",
}).reduce((acc, [tier, lv]) => {
  (CONDITIONS[tier] ?? []).forEach((n) => { acc[n] = lv; });
  return acc;
}, {});

/* Origem: CombatantPanel.jsx:98-100. Condições sem duração por rodadas. */
export const PERMANENT_CONDITIONS = new Set(["caido", ...SANGRAMENTO_LADDER]);

/* ============================================================ */
/* O ESTADO INICIAL E O DERIVADO                                 */
/* ============================================================ */

/**
 * O `combatState` de uma criatura que entra no Encontro. Origem: fm-encounter.js:98-103
 * (`createCombatant`), que respeita o estado que a ficha já traz para retomar um combate.
 */
export function estadoInicial(snapshot) {
  const existente = snapshot?.combatState && snapshot.combatState.hpCurrent != null;
  return existente ? clonar(snapshot.combatState) : createInitialCombatState(snapshot?.stats);
}

/**
 * Os stats AO VIVO e tudo que o painel lê junto com eles.
 * Origem: CombatantPanel.jsx:1363-1435 (dslContext, entidades de automação, modificadores
 * passivos, Estado da Alma, modificadores de condição, penalidade da Alma e `resolveLiveStats`)
 * e :1525 (`combatSettings`), :1528-1530.
 */
export function derivarVivo(snapshot, combatState) {
  if (!snapshot || !combatState) return null;
  const dslContext = buildDslContext(snapshot, combatState);
  const automationEntities = collectAutomationEntities(snapshot);
  const passiveModifiers = collectPassiveModifiers(automationEntities, dslContext);
  const almaHpMaxBase = combatState.hpMaxBase ?? snapshot.stats?.hpMax ?? 0;
  const almaAtualNow = combatState.almaAtual ?? almaHpMaxBase;
  const almaEstado = computeAlmaStatus(almaAtualNow, almaHpMaxBase);
  const conditionModifiers = collectConditionModifiers([
    ...(combatState.activeConditions ?? []).map((c) => c.name),
    ...(almaEstado.condicoes ?? []),
  ]);
  const pen = almaEstado.penalidade || 0;
  const almaModifiers = !pen ? [] : ALMA_PENALTY_TARGETS.map((stat) => newModifier({
    id: `alma_pen_${stat}`,
    name: `Estado da Alma (${almaEstado.label})`,
    stat, op: "add", value: pen,
    duration: { kind: "manual" },
  }));
  const liveResolved = resolveLiveStats(snapshot, {
    ...combatState,
    activeModifiers: [...passiveModifiers, ...conditionModifiers, ...almaModifiers, ...(combatState.activeModifiers ?? [])],
  });
  return {
    snapshot,
    stats: liveResolved.stats,
    saves: liveResolved.saves,
    attributes: liveResolved.attributes,
    skills: liveResolved.skills ?? snapshot.skills ?? [],
    modified: liveResolved.modified,
    almaEstado,
    combatSettings: snapshot.combatSettings ?? { guardaAbsorbsFirst: true, rdReducao: true },
    hpMaxBase: combatState.hpMaxBase ?? liveResolved.stats?.hpMax ?? 0,
    // A iniciativa AO VIVO, para o Encontro (o painel a mostra em "Iniciativa").
    iniciativa: liveResolved.stats?.iniciativa ?? snapshot.stats?.iniciativa ?? 0,
  };
}

/** O Estado da Alma de um `combatState` (CombatantPanel.jsx:1528-1530, `computeAlmaStatus` com o PV máximo BASE). */
export const estadoDaAlma = (combatState, hpMaxBase) => computeAlmaStatus(combatState.almaAtual ?? hpMaxBase, hpMaxBase);

/**
 * O aviso Desafiando a Morte. Origem: EncounterTracker.jsx:642-648 (e CombatantPanel.jsx:1562-1567).
 * `abatido` é o `flags.isDefeated`, que mora no combatente e não no estado.
 */
export function desafiandoAMorte(combatState, { abatido = false } = {}) {
  const ativo = combatState != null && combatState.hpCurrent <= 0 && !abatido;
  return {
    ativo,
    cd: ativo ? 25 + Math.floor(Math.abs(Math.min(0, combatState.hpCurrent)) / 50) : 0,
    suscetivel: combatState?.susceptivelFinalizacao ?? false,
  };
}

/* ============================================================ */
/* OS HANDLERS DO PAINEL                                         */
/* ============================================================ */

const comPatch = (cs, partial) => ({ ...cs, ...partial });

/**
 * Origem: CombatantPanel.jsx:1571-1649 (`handlers.setVital`). `v` é o valor NOVO da barra:
 * dano é `v` abaixo do atual, cura e restauro são `v` acima. Devolve o `combatState` novo.
 * O ramo final do original (`VITAL_THEMES[kind]`, para um `kind` que não é hp, guarda nem pe)
 * não é alcançável: o painel só chama com as três barras.
 */
export function emVital(combatState, d, kind, v) {
  const { stats, combatSettings } = exigirDerivado(d);
  const patch = (partial) => comPatch(combatState, partial);
  if (kind === "hp") {
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
        // Guarda absorve primeiro (regra padrão); o resto desce no HP, que
        // pode estar acima do máximo (o dano consome o excedente primeiro).
        const guardaAbsorbed = Math.min(currentGuarda, damage);
        const remainingDamage = damage - guardaAbsorbed;
        return patch({
          guardaInabavalCurrent: currentGuarda - guardaAbsorbed,
          hpCurrent: currentHp - remainingDamage,
          lastDamage: damage, // p/ reações on_damaged (DSL `dano`)
        });
      }
      // Toggle desligado: dano vai direto pro HP, Guarda intacta
      return patch({ hpCurrent: currentHp - damage, lastDamage: damage });
    }
    // Cura NORMAL: capa no máximo (limitado pela Alma). NÃO empurra acima
    // do máximo nem reduz o excedente de PV temp já existente, só efeitos
    // de habilidade (hp_temp) passam do teto.
    const hpMaxBase = combatState.hpMaxBase ?? stats.hpMax ?? 0;
    const hpMaxAtual = computeAlmaStatus(combatState.almaAtual ?? hpMaxBase, hpMaxBase).hpMaxAtual;
    return patch({ hpCurrent: Math.min(v, Math.max(hpMaxAtual, currentHp)) });
  }
  if (kind === "guarda") {
    if (v < 0) {
      // Dano excede a Guarda, overflow para HP
      const overflow = Math.abs(v);
      return patch({
        guardaInabavalCurrent: 0,
        hpCurrent: combatState.hpCurrent - overflow,
      });
    }
    const guardaMax = stats.guardaInabavalMax ?? 0;
    return patch({ guardaInabavalCurrent: Math.min(guardaMax, v) });
  }
  if (kind === "pe") {
    const cur = combatState.peCurrent ?? 0;
    if (v >= cur) {
      // Restauro NORMAL: capa no máximo; não empurra acima nem reduz o
      // excedente de PE temp. Só round_start (PE temp) passa do teto.
      return patch({ peCurrent: Math.min(v, Math.max(stats.peMax ?? 0, cur)) });
    }
    // Gasto manual: drena o PE temporário primeiro (refila no round_start).
    return patch({ peCurrent: Math.max(0, v), peTempSources: drainPeTemp(combatState.peTempSources, cur - v) });
  }
  return combatState;
}

/** Origem: CombatantPanel.jsx:1650-1671 (`handlers.setAlma`). */
export function emAlma(combatState, d, v) {
  const { stats } = exigirDerivado(d);
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
  // Teto de HP por esmagamento da Alma, SÓ quando a Alma reduz o máximo.
  // Com a Alma cheia (hpMaxAtual === hpMaxBase) NÃO clampa, pra preservar o
  // excedente de PV temporário (acima do máximo); senão qualquer ajuste de
  // Alma apagaria o PV temp.
  if (almaStatus.hpMaxAtual < hpMaxBase) newHp = Math.min(newHp, almaStatus.hpMaxAtual);

  const updates = { almaAtual: newAlma, hpCurrent: newHp };
  if (newAlma <= 0) updates.isActive = false;
  return comPatch(combatState, updates);
}

/* Origem: CombatantPanel.jsx:1672-1675 e 1785. */
export const emIgnorarRdAtivo = (cs, v) => comPatch(cs, { ignorarRdAtivo: v });
export const emIgnorarRdValor = (cs, v) => comPatch(cs, { ignorarRdValor: Math.max(0, v) });
export const emResistenciaParcial = (cs, v) => comPatch(cs, { resistenciaParcialUsed: v });
export const emResistenciaTotal = (cs, v) => comPatch(cs, { resistenciaTotalUsed: v });
export const emSuscetivel = (cs, v) => comPatch(cs, { susceptivelFinalizacao: v });

/**
 * Os botões do `Counter` do painel (Resistência Parcial e Total). Origem: CombatantPanel.jsx:314 (Recuperar)
 * e :319 (Gastar). `usados` é o que já foi gasto, e `max` o máximo do stat. Devolve o `usados` novo.
 */
export const contadorRecuperar = (usados) => Math.max(0, usados - 1);
export const contadorGastar = (usados, max) => Math.min(max, usados + 1);

/* Origem: CombatantPanel.jsx:1676-1683. */
export const emCondicaoAdicionada = (cs, c) => comPatch(cs, { activeConditions: [...(cs.activeConditions ?? []), c] });
export const emCondicaoRemovida = (cs, id) => comPatch(cs, {
  activeConditions: (cs.activeConditions ?? []).filter((x) => x.id !== id),
});
export const emModificadorAdicionado = (cs, m) => comPatch(cs, { activeModifiers: [...(cs.activeModifiers ?? []), m] });
export const emModificadorRemovido = (cs, id) => comPatch(cs, {
  activeModifiers: (cs.activeModifiers ?? []).filter((x) => x.id !== id),
});

/**
 * Monta um modificador como o `ModifierManager` do painel. Origem: CombatantPanel.jsx:742-754
 * (`handleAdd`). `null` quando o painel não adicionaria (somar zero).
 */
export function novoModificadorManual({ nome = "", stat = "defesa", op = "add", valor = 2, empilha = "sum", duracao = "manual", rodadas = 3 } = {}, rotuloDoAlvo = (s) => s) {
  const v = parseInt(valor, 10) || 0;
  if (op === "add" && v === 0) return null;
  return newModifier({
    name: nome.trim() || rotuloDoAlvo(stat),
    stat, op, value: v, stack: empilha,
    duration: duracao === "rounds"
      ? { kind: "rounds", rounds: Math.max(1, parseInt(rodadas, 10) || 1) }
      : { kind: duracao },
  });
}

/**
 * Monta uma condição como o `ConditionManager` do painel. Origem: CombatantPanel.jsx:355-360 (nível e
 * duração por nome) e :382-398 (`handleAdd`). Nome vazio devolve `null`.
 * `nivel` e `duracao` ausentes seguem o painel: o nível da tabela (ou "fraca"), a duração 1 (ou nenhuma
 * para as permanentes). `duracao: null` pedido de fora vale como permanente.
 */
export function novaCondicao({ nome, nivel, duracao } = {}, ambiente = AMBIENTE_PADRAO) {
  const finalName = String(nome ?? "").trim();
  if (!finalName) return null;
  const level = nivel ?? CONDITION_LEVEL_MAP[finalName] ?? "fraca";
  const dur = duracao !== undefined ? duracao : (PERMANENT_CONDITIONS.has(finalName) ? null : 1);
  return {
    id: `cond_${ambiente.agora()}_${ambiente.aleatorio().toString(36).slice(2, 6)}`,
    name: finalName,
    level,
    duracao: dur,
    appliedAt: ambiente.dataIso(),
  };
}

/**
 * A condição que o painel recusa por já estar ativa. Origem: CombatantPanel.jsx:377-380 e :386. A lista
 * do painel (`todasCondicoes`, :1538) inclui as condições do Estado da Alma, que não se duplicam à mão.
 */
export function condicaoJaAtiva(combatState, d, nome) {
  const daAlma = d?.almaEstado?.condicoes ?? computeAlmaStatus(
    combatState.almaAtual ?? (combatState.hpMaxBase ?? 0), combatState.hpMaxBase ?? 0,
  ).condicoes;
  const nomes = [...(combatState.activeConditions ?? []).map((c) => c.name), ...daAlma].map(normCond);
  return nomes.includes(normCond(nome));
}

/**
 * Reset de Combate. Origem: CombatantPanel.jsx:1821-1827 (`handlers.resetCombat`, sem o `window.confirm`),
 * a partir dos stats BASE do snapshot. É o Descansar da 2.5.2 no Encontro novo (autor, 2026-11-17).
 */
export function emReset(d) {
  return createInitialCombatState(exigirDerivado(d).snapshot.stats ?? {});
}

/* ============================================================ */
/* ATIVAR REGRA                                                  */
/* ============================================================ */

/**
 * Liga, desliga ou usa uma regra ATIVADA de uma habilidade. Origem: CombatantPanel.jsx:1684-1784
 * (`handlers.activateRule`). Devolve `{ estado, feedback }`: `feedback` é o que o painel mandava para
 * `setFeedback` (`{ kind: "on" | "off" | "block", text }`, sem o `id`), e `estado` é o mesmo `combatState`
 * quando a regra foi bloqueada. O PE gasto sai do PE temporário primeiro (`drainPeTemp`).
 */
export function ativarRegra(combatState, d, rule, entityName, group = null, { combatenteId = null, ambiente = AMBIENTE_PADRAO } = {}) {
  const { snapshot, stats } = exigirDerivado(d);
  const dslContext = buildDslContext(snapshot, combatState);
  const patch = (partial) => comPatch(combatState, partial);
  const mode = rule.activation ?? "toggle";
  const list = combatState.activeModifiers ?? [];
  const isActive = list.some((m) => m.source?.ruleId === rule.id);

  // Desativar (só toggle): remove os modificadores; não devolve PE.
  if (mode === "toggle" && isActive) {
    const offLog = createLogEntry({
      round: 0, type: LOG_TYPES.CUSTOM,
      message: `${entityName}: desativou ${rule.name}`,
      combatantId: combatenteId,
    });
    return {
      estado: patch({
        activeModifiers: list.filter((m) => m.source?.ruleId !== rule.id),
        combatLog: [...(combatState.combatLog ?? []), offLog].slice(-50),
      }),
      feedback: { kind: "off", text: `Desativou ${rule.name}` },
    };
  }
  // Ativar: checa pré-requisito e custo.
  if (!ruleRequiresMet(rule, dslContext)) return { estado: combatState, feedback: { kind: "block", text: `Pré-requisito não atendido: ${rule.name}` } };
  const cost = rule.cost?.pe ?? 0;
  const peCur = combatState.peCurrent ?? 0;
  if (cost > 0 && peCur < cost) return { estado: combatState, feedback: { kind: "block", text: `PE insuficiente para ${rule.name} (precisa de ${cost})` } };

  const mods = ruleModifiers(rule, { name: entityName, kind: mode, group }, dslContext);
  // 'once': ids únicos por uso (pode reusar; os efeitos só expiram pela duração).
  const tagged = mode === "once"
    ? mods.map((m) => ({ ...m, id: `${m.id}__${ambiente.agora().toString(36)}${ambiente.aleatorio().toString(36).slice(2, 4)}` }))
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
    let v = op === "set" ? val : op === "subtract" ? base - val : base + val;
    v = Math.max(0, Math.round(v));
    return max != null ? Math.min(v, max) : v;
  };
  for (const ch of resolveResourceChanges(rule, dslContext)) {
    if (ch.resource === "hp") {
      next.hpCurrent = applyRes(next.hpCurrent ?? combatState.hpCurrent, ch.op, ch.value, combatState.hpMaxBase ?? stats.hpMax ?? null);
    } else if (ch.resource === "pe") {
      next.peCurrent = applyRes(next.peCurrent ?? combatState.peCurrent, ch.op, ch.value, stats.peMax ?? null);
    } else if (ch.resource === "hp_temp") {
      // PV Temporário = ganho de PV que PODE exceder o máximo (excedente verde).
      next.hpCurrent = applyRes(next.hpCurrent ?? combatState.hpCurrent, ch.op, ch.value, null);
    } else if (ch.resource === "guarda") {
      next.guardaInabavalCurrent = applyRes(next.guardaInabavalCurrent ?? combatState.guardaInabavalCurrent, ch.op, ch.value, stats.guardaInabavalMax ?? null);
    }
  }

  // Efeitos de CONDIÇÃO (instantâneos): aplica/remove no activeConditions.
  const condEffects = resolveConditionEffects(rule);
  if (condEffects.length) {
    let conds = [...(combatState.activeConditions ?? [])];
    for (const ce of condEffects) {
      if (ce.op === "remove") {
        conds = conds.filter((c) => c.name !== ce.condition);
      } else {
        const dur = ce.duration?.kind === "rounds" ? (ce.duration.rounds ?? 1) : null;
        conds.push({
          id: `cond_${ambiente.agora().toString(36)}_${ambiente.aleatorio().toString(36).slice(2, 6)}`,
          name: ce.condition,
          level: CONDITION_LEVEL_MAP[ce.condition] ?? "fraca",
          duracao: dur,
          appliedAt: ambiente.dataIso(),
          source: { ruleId: rule.id },
        });
      }
    }
    next.activeConditions = conds;
  }

  // Registra no log de combate o que a ativação fez.
  const sum = summarizeRule(rule, dslContext);
  const verb = (ruleHasSustainedEffect(rule) && mode !== "once") ? "ativou" : "usou";
  const efx = sum?.effects?.length ? `: ${semTravessao(sum.effects.join(", "))}` : "";
  const peStr = cost > 0 ? ` (−${cost} PE)` : "";
  next.combatLog = [
    ...(combatState.combatLog ?? []),
    createLogEntry({
      round: 0, type: LOG_TYPES.CUSTOM,
      message: `${entityName}: ${verb} ${rule.name}${efx}${peStr}`,
      combatantId: combatenteId,
    }),
  ].slice(-50);
  return { estado: patch(next), feedback: { kind: "on", text: `${rule.name}${efx || " aplicado"}${peStr}` } };
}

/* ============================================================ */
/* O CONTADOR DE ERROS                                           */
/* ============================================================ */

/**
 * A criatura cai sozinha quando o contador de erros chega a 3. Origem: fm-encounter.js:402-409
 * (`DEFEAT_CHECKS`, `isAutoDefeated`) e useEncounter.js:103-114 (`UPDATE_COMBAT_STATE`: só liga o
 * abatido, nunca desliga). O abatido mora no combatente, então quem aplica é o redutor.
 */
export const abatidoAutomatico = (combatState) => isAutoDefeated({ combatState });

/* ============================================================ */
/* O FLUXO DE TURNO (useEncounter.js)                            */
/* ============================================================ */

/**
 * ⚠ O PONTO ONDE A DURAÇÃO DESCE, já na REGRA NOVA (etapa 5, 2026-11-17): as condições (`duracao`) e os modificadores
 * (`duration.kind === "rounds"`) descem no FIM DO TURNO DE QUEM APLICOU, e não mais as condições no começo do turno de quem
 * as tem nem os modificadores na virada. Quem aplicou mora na entrada (`aplicadorId`, ausente lê `"proprio"`, ver
 * ficha-uso-estado.js), e `vale(aplicadorId)` diz quais entram (nulo: todas). A entrada com a marca do turno
 * (`aguardaFimDoTurno`) só a perde. É uma divergência DE PROPÓSITO da 2.5.2 (autor: "nas rotas todas"), e o `CombatTracker`
 * da ficha única no `/` não muda.
 *
 * Um passo vale o mesmo que os da 2.5.2: com `vale` nulo e sem marca, dá exatamente `tickModifiersRound`
 * (fm-modifiers.js:302-309) e `tickCombatantConditions` (fm-encounter.js:314-333) juntos, e o assert confere.
 * Devolve `{ estado, expirou: [{ nome, combatente }] }` (as condições que chegaram ao fim). Sem nada a descer, o MESMO estado.
 */
export function descerDuracoes252(combatState, { vale = null, nome = "" } = {}) {
  const toca = (x) => !vale || vale(aplicadorDe(x));
  const expirou = [];
  let mexeu = false;
  const conds = [];
  for (const c of combatState.activeConditions ?? []) {
    if (c?.duracao == null || !toca(c)) { conds.push(c); continue; }
    mexeu = true;
    if (vale && c.aguardaFimDoTurno) { conds.push(semMarcaDoTurno(c)); continue; }
    if (c.duracao - 1 <= 0) { expirou.push({ nome: c.name, combatente: nome }); continue; }
    conds.push({ ...semMarcaDoTurno(c), duracao: c.duracao - 1 });
  }
  const mods = [];
  for (const m of combatState.activeModifiers ?? []) {
    if (m?.duration?.kind !== "rounds" || !toca(m)) { mods.push(m); continue; }
    mexeu = true;
    if (vale && m.aguardaFimDoTurno) { mods.push(semMarcaDoTurno(m)); continue; }
    const rounds = (m.duration.rounds ?? 0) - 1;
    if (rounds <= 0) continue;
    mods.push({ ...semMarcaDoTurno(m), duration: { ...m.duration, rounds } });
  }
  if (!mexeu) return { estado: combatState, expirou };
  return { estado: { ...combatState, activeConditions: conds, activeModifiers: mods }, expirou };
}

/** Carimba quem aplicou nas condições e nos modificadores com rodadas que nasceram entre `antes` e `depois` (etapa 5). */
export function marcarAplicador252(antes, depois, { aplicadorId = APLICADOR_PROPRIO, noTurno = false } = {}) {
  const proprio = !aplicadorId || aplicadorId === APLICADOR_PROPRIO;
  if (!depois || (proprio && !noTurno)) return depois;
  const carimba = (x) => ({ ...x, ...(proprio ? {} : { aplicadorId }), ...(noTurno ? { aguardaFimDoTurno: true } : {}) });
  const idsC = new Set((antes?.activeConditions ?? []).map((c) => c?.id));
  const idsM = new Set((antes?.activeModifiers ?? []).map((m) => m?.id));
  let mexeu = false;
  const activeConditions = (depois.activeConditions ?? []).map((c) => {
    if (c?.duracao == null || idsC.has(c.id)) return c;
    mexeu = true;
    return carimba(c);
  });
  const activeModifiers = (depois.activeModifiers ?? []).map((m) => {
    if (m?.duration?.kind !== "rounds" || idsM.has(m.id)) return m;
    mexeu = true;
    return carimba(m);
  });
  return mexeu ? { ...depois, activeConditions, activeModifiers } : depois;
}

/** Quem saiu da luta (etapa 5): o que `deId` aplicou passa a ser da própria criatura. Sem nada a repassar, o MESMO estado. */
export function repassarAplicador252(combatState, deId) {
  const repassa = (x) => {
    if (aplicadorDe(x) !== deId) return x;
    const { aplicadorId: _id, ...resto } = x;
    return semMarcaDoTurno(resto);
  };
  const deles = (l) => (l ?? []).some((x) => aplicadorDe(x) === deId);
  if (!deId || (!deles(combatState.activeConditions) && !deles(combatState.activeModifiers))) return combatState;
  return {
    ...combatState,
    activeConditions: (combatState.activeConditions ?? []).map(repassa),
    activeModifiers: (combatState.activeModifiers ?? []).map(repassa),
  };
}

/**
 * A Guarda Inabalável volta ao máximo BASE do snapshot. Origem: fm-encounter.js:281-304
 * (`applyNewRoundEffects`), a metade que não é duração. Até a etapa 5, junto com a descida dos modificadores na
 * virada, dava exatamente `applyNewRoundEffects(c, { tickConditions: false })`. Desde 2026-11-17 a descida mudou de lugar
 * (fim do turno de quem aplicou), e a virada da criatura é só esta metade.
 */
export function renovarGuarda(combatState, snapshot) {
  return {
    ...combatState,
    guardaInabavalCurrent: snapshot?.stats?.guardaInabavalMax ?? 0,
    activeConditions: combatState.activeConditions ?? [],
  };
}

const TIPO_AVISO = { custom: "livre", condicao: "condicao" };

const avisarTodos = (op, tipo, textos) => {
  for (const t of textos) op?.avisar?.(TIPO_AVISO[tipo] ?? tipo, semTravessao(t));
};

/** Dispara os efeitos instantâneos de um gatilho. Origem: useEncounter.js:171-176 (`fireTrigger`). */
function dispararGatilho(combatState, snapshot, gatilho, opts, op) {
  const r = applyTriggeredEffects(combatState, snapshot, gatilho, opts);
  avisarTodos(op, "custom", r.logs);
  return r.combatState;
}

/**
 * O começo da rodada de UM combatente: Guarda, modificadores, `lastDamage: 0`, PE temporário por fonte e os
 * gatilhos `round_start`. Origem: useEncounter.js:127-140 (START_COMBAT) e :190-205 (NEXT_TURN, virada).
 */
function comecoDaRodada(combatState, d, op) {
  const { snapshot } = exigirDerivado(d);
  // Etapa 5: os modificadores não descem mais aqui, e sim no fim do turno de quem aplicou (`descerDuracoes252`).
  const s = renovarGuarda(combatState, snapshot);
  const base = { ...s, lastDamage: 0 };
  const { combatState: afterRes, peGain } = applyRoundStartResources(base, snapshot);
  if (peGain > 0) avisarTodos(op, "custom", [`${op?.nome ?? "Combatente"}: +${peGain} PE (início da rodada)`]);
  // round_start: recursos já vieram acima (PE temp), aqui só as condições.
  return dispararGatilho(afterRes, snapshot, "round_start", { resources: false, conditions: true }, op);
}

/**
 * Cada verbo de turno recebe `op` (o terceiro argumento do verbo): `{ abatido, nome, avisar, forcada,
 * comecoDoCombate }`. O abatido não recebe nada (`applyNewRoundEffects`, `fireTrigger`), e `avisar(tipo,
 * mensagem)` leva as frases do Registro para o Encontro.
 */

/** Origem: useEncounter.js:116-140 (START_COMBAT, o começo da rodada 1 de cada combatente). */
export function turnoIniciaCombate(combatState, d, op) {
  if (op?.abatido) return combatState;
  return comecoDaRodada(combatState, d, op);
}

/** Origem: useEncounter.js:142-150 (START_COMBAT, o turno do primeiro) e :212-228 (NEXT_TURN, o turno que entra). */
export function turnoIniciaTurno(combatState, d, op) {
  if (op?.abatido) return combatState;
  const { snapshot } = exigirDerivado(d);
  /* Etapa 5: o tick das condições de quem inicia o turno (useEncounter.js:212-228) saiu. As condições descem no fim do
     turno de quem as aplicou (`turnoDesceDuracoes`). */
  return dispararGatilho(combatState, snapshot, "turn_start", {}, op);
}

/**
 * O fim do turno de quem aplicou, nesta criatura (etapa 5): `op.vale` diz de quem são as entradas que descem. A frase da
 * condição que acaba é a mesma do `useEncounter.js` (o Registro). O abatido não recebe nada, como em toda a 2.5.2.
 */
export function turnoDesceDuracoes(combatState, d, op) {
  if (op?.abatido) return combatState;
  const r = descerDuracoes252(combatState, { vale: op?.vale ?? null, nome: op?.nome ?? "" });
  avisarTodos(op, "condicao", r.expirou.map((e) => `A condição [${e.nome}] de ${e.combatente} chegou ao fim e foi removida.`));
  return r.estado;
}

/** Origem: useEncounter.js:178-181 (NEXT_TURN, o fim do turno de quem sai). */
export function turnoEncerraTurno(combatState, d, op) {
  if (op?.abatido) return combatState;
  const { snapshot } = exigirDerivado(d);
  return dispararGatilho(combatState, snapshot, "turn_end", {}, op);
}

/**
 * Origem: useEncounter.js:183-210 (NEXT_TURN, a virada: `round_end` e depois o começo da rodada) e
 * :241-251 (NEW_ROUND, o forçado: só a Guarda e os modificadores, sem PE, sem gatilho e sem `lastDamage`).
 */
export function turnoViraRodada(combatState, d, op) {
  if (op?.abatido) return { estado: combatState, expirou: [] };
  const { snapshot } = exigirDerivado(d);
  // Etapa 5: o forçado renova só a Guarda. Os modificadores descem no fim do turno de quem os aplicou.
  if (op?.forcada) return { estado: renovarGuarda(combatState, snapshot), expirou: [] };
  const fim = dispararGatilho(combatState, snapshot, "round_end", {}, op);
  return { estado: comecoDaRodada(fim, d, op), expirou: [] };
}

/* ============================================================ */
/* PARA A TELA (etapa 6a, 2026-11-17)                            */
/* ============================================================ */

/** As condições da tabela da 2.5.2 por faixa (`fm-tables.js`, `CONDITIONS`), para o seletor do painel novo. A tela não importa de `src/components`. */
export const CONDICOES_252 = CONDITIONS;

/* ============================================================ */
/* O QUE O PAINEL MOSTRA ALÉM DOS VITAIS (etapa 6b, 2026-11-17)  */
/* ============================================================ */

/* As listas de escolha do formulário de modificador. Origem: fm-modifiers.js (`MODIFIER_TARGET_GROUPS`, `MODIFIER_OPS`,
   `STACK_MODES`, `DURATION_KINDS`), reexportadas para a tela não importar de src/components. */
export const ALVOS_DO_MODIFICADOR = MODIFIER_TARGET_GROUPS;
export const OPERACOES_DO_MODIFICADOR = MODIFIER_OPS;
export const EMPILHAMENTOS = STACK_MODES;
export const DURACOES_DO_MODIFICADOR = DURATION_KINDS;
export const rotuloDoAlvo = getTargetLabel;

/** Os modificadores que o painel não lista como chip (boost de dano, imunidade e alcance). Origem: CombatantPanel.jsx:764-765. */
const SO_DE_MOTOR = new Set(["__dmg", "__immune", "__range"]);
export const modificadorVisivel = (m) => !SO_DE_MOTOR.has(m?.stat);

/**
 * As habilidades ativáveis, as reações, as imunidades e os modificadores passivos de uma criatura. Origem:
 * CombatantPanel.jsx:1383 (`collectAutomationEntities`), :1388 (passivos), :1483 (imunes), :1488 (reações) e o
 * `ActivableHub` (:627-652), que lista as entidades com regra ativada.
 */
export function extrasDoPainel(d, combatState) {
  const snapshot = exigirDerivado(d).snapshot;
  const contexto = buildDslContext(snapshot, combatState);
  const entidades = collectAutomationEntities(snapshot);
  const passivos = collectPassiveModifiers(entidades, contexto);
  return {
    contexto,
    ativaveis: entidades.filter((e) => activatedRulesOf(e).length > 0)
      .map((e) => ({ id: e.id, nome: e.name, grupo: e.__autoGroup ?? null, regras: activatedRulesOf(e) })),
    reacoes: collectReactionRules(entidades),
    imunes: collectImmuneConditions([...passivos, ...(combatState.activeModifiers ?? [])]),
    passivos: passivos.filter(modificadorVisivel),
  };
}

/**
 * O estado de um botão de regra. Origem: CombatantPanel.jsx:581-593 (`ActivationButtons`). `ativa` só existe para regra que liga e
 * desliga de verdade (tem efeito sustentado), e `bloqueada` quando o pré-requisito ou o PE faltam (só se ela não está ativa).
 */
export function estadoDaRegra(regra, combatState, contexto) {
  const modo = regra.activation ?? "toggle";
  const liga = modo === "toggle" && ruleHasSustainedEffect(regra);
  const ativa = liga && (combatState.activeModifiers ?? []).some((m) => m.source?.ruleId === regra.id);
  const custo = regra.cost?.pe ?? 0;
  const reqOk = ruleRequiresMet(regra, contexto);
  const peOk = custo <= 0 || (combatState.peCurrent ?? 0) >= custo;
  return {
    ativa, custo, bloqueada: !ativa && (!reqOk || !peOk),
    rotulo: ativa ? "Desativar" : liga ? "Ativar" : "Usar",
    motivo: !reqOk ? `Pré-requisito não atendido: ${regra.requires}` : !peOk ? `PE insuficiente (precisa de ${custo})` : null,
  };
}

/** O efeito de uma regra em texto curto, para o botão de reação. Origem: CombatantPanel.jsx:684-686. */
export const efeitoDaRegra = (regra, contexto) => semTravessao(summarizeRule(regra, contexto)?.effects?.join(" · ") ?? "");

/**
 * A RD que o próximo dano vai encontrar. Origem: CombatantPanel.jsx:1286-1289 (a linha "RD aplicada no próximo dano" do menu de
 * ajustes): com Ignorar RD ligado, só a Irredutível. Senão, a Geral menos a parte ignorada, sem passar abaixo da Irredutível.
 */
export function rdNoProximoDano(stats, { ignorarRdAtivo = false, ignorarRdValor = 0 } = {}) {
  const geral = stats?.rdGeral ?? 0;
  const irredutivel = stats?.rdIrredutivel ?? 0;
  return ignorarRdAtivo ? irredutivel : Math.min(geral, Math.max(irredutivel, geral - ignorarRdValor));
}
