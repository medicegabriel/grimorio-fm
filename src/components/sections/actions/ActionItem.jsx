import React, { useState } from "react";
import { Trash2, Copy, Swords, Shield, Bookmark, BookmarkCheck } from "lucide-react";
import { SmallButton, Pill } from "../../builder-controls";
import ActionFormFields from "./ActionFormFields";
import {
  ACTION_TYPE_LABELS,
  BLANK_CONDITION,
  TRADES_ZERO,
  normalizeAction,
  deriveFinalPE,
  deriveFinalDice,
  applyTrades,
  computeDivisor,
  rollStr,
  rollAverage,
  calcAutoRange,
  resetTradesForAttackType,
  enforceMutualExclusion,
  runFullActionCalc,
  reapplyTrades,
  generateActionDescription,
  humanizeAction,
} from "../../fm-action-calc";

// ============================================================
// ACTION ITEM
// ============================================================
export default function ActionItem({ action, patamar, nd, bt, creatureName, onUpdate, onRemove, onDuplicate, onSaveTemplate }) {
  const [expanded, setExpanded] = useState(false);
  const [templateSaved, setTemplateSaved] = useState(false);
  const norm    = normalizeAction(action);
  const finalPE = deriveFinalPE(norm.cost, norm.condition);

  // Recálculo completo (tabela + trades + divisor) — usado quando destravado.
  const runFullCalc = (attackType, condition, narrativeType, rangeType, trades, damageType) =>
    runFullActionCalc({
      patamar, nd, bt, attackType, condition, narrativeType, rangeType, trades, damageType,
      toHitBase: norm.toHitBase ?? norm.toHit ?? 0,
      cdBase:    norm.cdBase    ?? norm.cd    ?? 0,
    });

  // Reaplica trades sobre o dano-base existente — usado quando travado.
  const reapplyTradesHelper = (rangeType, trades) => reapplyTrades(norm, rangeType, trades, bt);

  const update = (patch) => {
    if ("attackType" in patch) {
      const resetTrades = resetTradesForAttackType(patch.attackType, norm.trades ?? TRADES_ZERO);
      const basePatch   = { ...patch, trades: resetTrades };
      if (patch.attackType === "acerto") basePatch.condition = BLANK_CONDITION;
      const av = calcAutoRange(patch.attackType, norm.rangeType, bt);
      if (norm.rangeLocked !== false) basePatch.range = av.range;
      if (norm.areaLocked  !== false) basePatch.area  = av.area;
      if (patch.attackType === "suporte") {
        onUpdate({ ...basePatch, damage: { ...norm.damage, roll: "", average: 0, damageIsLocked: false } });
        return;
      }
      if (!norm.damage?.damageIsLocked) {
        const r = runFullCalc(patch.attackType, norm.condition, norm.damage?.narrativeType, norm.rangeType, resetTrades, norm.damage?.type);
        if (r) { onUpdate({ ...basePatch, ...r, damage: { ...norm.damage, ...r.damage } }); return; }
      }
      const reapplied = reapplyTradesHelper(norm.rangeType, resetTrades);
      onUpdate({ ...basePatch, ...reapplied });
      return;
    }
    if ("toHitBase" in patch) {
      const t = norm.trades ?? TRADES_ZERO;
      onUpdate({ ...patch, toHit: (patch.toHitBase ?? 0) + ((t.sacrifDadosAcerto ?? 0) * 2) - (t.sacrifAcertoDados ?? 0) });
      return;
    }
    if ("cdBase" in patch) {
      const t = norm.trades ?? TRADES_ZERO;
      onUpdate({ ...patch, cd: (patch.cdBase ?? 0) + (t.sacrifDadosCD ?? 0) - (t.sacrifCdDados ?? 0) });
      return;
    }
    onUpdate(patch);
  };

  const updateDamage = (patch) => {
    const isUnlocking        = patch.damageIsLocked === false && norm.damage?.damageIsLocked === true;
    const isNarrativeChange  = "narrativeType" in patch && !norm.damage?.damageIsLocked;
    const isDamageTypeChange = "type" in patch && !norm.damage?.damageIsLocked;

    if (isUnlocking || isNarrativeChange || isDamageTypeChange) {
      const newNarrative = "narrativeType" in patch ? patch.narrativeType : norm.damage?.narrativeType;
      const newType      = "type" in patch ? patch.type : norm.damage?.type;
      const r = runFullCalc(norm.attackType, norm.condition, newNarrative, norm.rangeType, norm.trades, newType);
      if (r) {
        onUpdate({ ...r, damage: { ...norm.damage, ...patch, ...r.damage, damageIsCalculated: true } });
        return;
      }
    }

    const dmg = { ...norm.damage, ...patch };
    if ("numDiceBase" in patch && !("numDice" in patch)) {
      const tradeRes = applyTrades(
        patch.numDiceBase, norm.toHitBase ?? norm.toHit ?? 0, norm.cdBase ?? norm.cd ?? 0,
        norm.rangeType, norm.trades, bt
      );
      const divisor = computeDivisor(norm.attackType, dmg.type ?? "cortante");
      dmg.numDice = divisor === 1 ? tradeRes.dadosFinais : Math.max(1, Math.floor(tradeRes.dadosFinais / divisor));
    }
    dmg.roll    = rollStr(dmg.numDice, dmg.dieSize, dmg.mod);
    dmg.average = rollAverage(deriveFinalDice(dmg), dmg.dieSize, dmg.mod);
    onUpdate({ damage: dmg });
  };

  const updateCond = (patch) => {
    const newCondition = { ...norm.condition, ...patch };
    const condUpdate   = { condition: newCondition };
    if (!norm.damage?.damageIsLocked && ("tier" in patch || "payment" in patch)) {
      const r = runFullCalc(norm.attackType, newCondition, norm.damage?.narrativeType, norm.rangeType, norm.trades, norm.damage?.type);
      if (r) Object.assign(condUpdate, r, { damage: { ...norm.damage, ...r.damage, damageIsCalculated: true } });
    }
    onUpdate(condUpdate);
  };

  const updateTrade = (patch) => {
    const newTrades = enforceMutualExclusion({ ...(norm.trades ?? TRADES_ZERO), ...patch });
    const tradePatch = { trades: newTrades };
    if (!norm.damage?.damageIsLocked) {
      const r = runFullCalc(norm.attackType, norm.condition, norm.damage?.narrativeType, norm.rangeType, newTrades, norm.damage?.type);
      if (r) { onUpdate({ ...tradePatch, ...r, damage: { ...norm.damage, ...r.damage, damageIsLocked: false } }); return; }
    }
    const reapplied = reapplyTradesHelper(norm.rangeType, newTrades);
    onUpdate({ ...tradePatch, ...reapplied });
  };

  const updateRangeType = (newRangeType) => {
    const av = calcAutoRange(norm.attackType, newRangeType, bt);
    const rangePatch = {
      rangeType: newRangeType,
      ...(norm.rangeLocked !== false ? { range: av.range } : {}),
      ...(norm.areaLocked  !== false ? { area:  av.area  } : {}),
    };
    if (!norm.damage?.damageIsLocked) {
      const r = runFullCalc(norm.attackType, norm.condition, norm.damage?.narrativeType, newRangeType, norm.trades, norm.damage?.type);
      if (r) { onUpdate({ ...rangePatch, ...r, damage: { ...norm.damage, ...r.damage, damageIsLocked: false } }); return; }
    }
    const reapplied = reapplyTradesHelper(newRangeType, norm.trades);
    onUpdate({ ...rangePatch, ...reapplied });
  };

  const handleSaveTemplate = () => {
    onSaveTemplate(norm);
    setTemplateSaved(true);
    setTimeout(() => setTemplateSaved(false), 1500);
  };

  return (
    <div className="bg-slate-950/40 border border-slate-800 rounded">
      <div className="flex items-center gap-2 p-2">
        {action.attackType === "suporte"
          ? <Shield className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
          : <Swords className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
        }
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex-1 text-left text-sm font-semibold text-white hover:text-purple-300 min-w-0"
        >
          <span className="truncate block">{action.name || "Ação sem nome"}</span>
        </button>
        <Pill color="slate">{ACTION_TYPE_LABELS[action.type] || action.type}</Pill>
        {finalPE > 0 && <Pill color="purple">{finalPE} PE</Pill>}
        <SmallButton onClick={onDuplicate} title="Duplicar">
          <Copy className="w-3 h-3" />
        </SmallButton>
        <SmallButton onClick={handleSaveTemplate} title={templateSaved ? "Modelo salvo!" : "Salvar como modelo"}>
          {templateSaved
            ? <BookmarkCheck className="w-3 h-3 text-emerald-400" />
            : <Bookmark className="w-3 h-3" />
          }
        </SmallButton>
        <SmallButton onClick={onRemove} variant="danger" title="Remover">
          <Trash2 className="w-3 h-3" />
        </SmallButton>
      </div>

      {expanded ? (
        <div className="border-t border-slate-800 p-3 space-y-3">
          <ActionFormFields
            form={norm}
            bt={bt}
            update={update}
            updateDamage={updateDamage}
            updateCond={updateCond}
            updateTrade={updateTrade}
            updateRangeType={updateRangeType}
          />
        </div>
      ) : (
        <div className="px-3 pb-2">
          <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-wrap">
            {generateActionDescription(norm, creatureName, norm.description) || humanizeAction(norm)}
          </p>
        </div>
      )}
    </div>
  );
}
