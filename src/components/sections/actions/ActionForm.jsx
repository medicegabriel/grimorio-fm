import React, { useState, useRef, useEffect } from "react";
import { Plus, BookOpen, X, Lock, Unlock } from "lucide-react";
import { SmallButton, Pill } from "../../builder-controls";
import ActionFormFields from "./ActionFormFields";
import {
  ACTION_TYPE_LABELS,
  BLANK_CONDITION,
  TRADES_ZERO,
  calculateActionDamage,
  calcAutoRange,
  resetTradesForAttackType,
  enforceMutualExclusion,
  applyTrades,
  computeDivisor,
  rollStr,
  rollAverage,
  deriveFinalDice,
  runFullActionCalc,
  reapplyTrades,
  generateActionDescription,
} from "../../fm-action-calc";

// ============================================================
// ACTION FORM (nova ação)
// ============================================================
export default function ActionForm({ derived, draft, onAdd, onCancel, templates = [], onRemoveTemplate }) {
  const patamar = draft?.core?.patamar;
  const nd      = draft?.core?.nd;
  const bt      = derived?.bt ?? 2;

  const [isMechanicalTextLocked, setIsMechanicalTextLocked] = useState(true);
  const [manualMechanicalText,   setManualMechanicalText]   = useState("");
  const [showTemplates,          setShowTemplates]           = useState(false);
  const textareaRef = useRef(null);

  const [form, setForm] = useState(() => {
    const calcDmg    = calculateActionDamage(patamar, nd, "acerto", false);
    const tHitBase   = derived?.acertoPrincipal ?? 0;
    const tCdBase    = derived?.cdBase ?? 0;
    const numDiceBase = calcDmg?.numDice ?? 0;
    const initAuto   = calcAutoRange("acerto", "distancia", bt);
    return {
      name:      "",
      type:      "comum",
      attackType: "acerto",
      toHit:     tHitBase,
      toHitBase: tHitBase,
      cd:        tCdBase,
      cdBase:    tCdBase,
      trType:    "fortitude",
      range:     initAuto.range,
      area:      initAuto.area,
      rangeType: "distancia",
      rangeLocked: true,
      areaLocked:  true,
      trades:    { ...TRADES_ZERO },
      damage: {
        type:              "cortante",
        narrativeType:     "padrao",
        isNarrativePhysical: false,
        damageIsLocked:    false,
        damageIsCalculated: true,
        numDice:           numDiceBase,
        numDiceBase,
        dieSize:           calcDmg?.dieSize ?? 8,
        mod:               calcDmg?.mod ?? 0,
        roll:              calcDmg?.roll ?? "",
        average:           calcDmg?.average ?? 0,
      },
      condition: { tier: "nenhuma", name: "", nameKey: "", payment: "pe" },
      cost:        0,
      description: "",
    };
  });

  // Recálculo completo (tabela + trades + divisor) — usado quando destravado.
  const runFullCalc = (attackType, condition, narrativeType, rangeType, trades, damageType) =>
    runFullActionCalc({
      patamar, nd, bt, attackType, condition, narrativeType, rangeType, trades, damageType,
      toHitBase: derived?.acertoPrincipal ?? 0,
      cdBase:    derived?.cdBase ?? 0,
    });

  // Reaplica trades sobre o dano-base existente — usado quando travado.
  const reapplyTradesHelper = (prev, rangeType, trades) => reapplyTrades(prev, rangeType, trades, bt);

  const update = (patch) =>
    setForm((prev) => {
      let next = { ...prev, ...patch };

      if ("attackType" in patch) {
        const resetTrades = resetTradesForAttackType(patch.attackType, prev.trades ?? TRADES_ZERO);
        next.trades = resetTrades;
        if (patch.attackType === "acerto") next.condition = BLANK_CONDITION;
        const av = calcAutoRange(patch.attackType, next.rangeType, bt);
        if (next.rangeLocked !== false) next.range = av.range;
        if (next.areaLocked  !== false) next.area  = av.area;
        if (patch.attackType === "suporte") {
          next.damage = { ...prev.damage, roll: "", average: 0, damageIsLocked: false };
        } else if (!prev.damage?.damageIsLocked) {
          const r = runFullCalc(patch.attackType, prev.condition, prev.damage?.narrativeType, prev.rangeType, resetTrades, prev.damage?.type);
          if (r) Object.assign(next, r, { damage: { ...prev.damage, ...r.damage, damageIsLocked: false } });
        } else {
          const reapplied = reapplyTradesHelper(next, prev.rangeType, resetTrades);
          Object.assign(next, reapplied);
        }
      }

      if ("toHitBase" in patch) {
        const t = next.trades ?? TRADES_ZERO;
        next.toHit = (patch.toHitBase ?? 0) + ((t.sacrifDadosAcerto ?? 0) * 2) - (t.sacrifAcertoDados ?? 0);
      }
      if ("cdBase" in patch) {
        const t = next.trades ?? TRADES_ZERO;
        next.cd = (patch.cdBase ?? 0) + (t.sacrifDadosCD ?? 0) - (t.sacrifCdDados ?? 0);
      }

      return next;
    });

  const updateDamage = (patch) =>
    setForm((prev) => {
      const isUnlocking        = patch.damageIsLocked === false && prev.damage?.damageIsLocked === true;
      const isNarrativeChange  = "narrativeType" in patch && !prev.damage?.damageIsLocked;
      const isDamageTypeChange = "type" in patch && !prev.damage?.damageIsLocked;

      if (isUnlocking || isNarrativeChange || isDamageTypeChange) {
        const newNarrative = "narrativeType" in patch ? patch.narrativeType : prev.damage?.narrativeType;
        const newType      = "type" in patch ? patch.type : prev.damage?.type;
        const r = runFullCalc(prev.attackType, prev.condition, newNarrative, prev.rangeType, prev.trades, newType);
        if (r) return { ...prev, ...r, damage: { ...prev.damage, ...patch, ...r.damage, damageIsCalculated: true } };
      }

      const dmg = { ...prev.damage, ...patch };
      if ("numDiceBase" in patch && !("numDice" in patch)) {
        const tradeRes = applyTrades(
          patch.numDiceBase, prev.toHitBase ?? prev.toHit ?? 0, prev.cdBase ?? prev.cd ?? 0,
          prev.rangeType, prev.trades, bt
        );
        const divisor = computeDivisor(prev.attackType, dmg.type ?? "cortante");
        dmg.numDice = divisor === 1 ? tradeRes.dadosFinais : Math.max(1, Math.floor(tradeRes.dadosFinais / divisor));
      }
      if (!("damageIsLocked" in patch) && !("narrativeType" in patch) && !isDamageTypeChange) {
        dmg.roll    = rollStr(dmg.numDice, dmg.dieSize, dmg.mod);
        dmg.average = rollAverage(deriveFinalDice(dmg), dmg.dieSize, dmg.mod);
      }
      return { ...prev, damage: dmg };
    });

  const updateCond = (patch) =>
    setForm((prev) => {
      const newCondition = { ...prev.condition, ...patch };
      let next = { ...prev, condition: newCondition };
      if (!prev.damage?.damageIsLocked && ("tier" in patch || "payment" in patch)) {
        const r = runFullCalc(prev.attackType, newCondition, prev.damage?.narrativeType, prev.rangeType, prev.trades, prev.damage?.type);
        if (r) Object.assign(next, r, { damage: { ...prev.damage, ...r.damage, damageIsCalculated: true } });
      }
      return next;
    });

  const updateTrade = (patch) =>
    setForm((prev) => {
      const newTrades = enforceMutualExclusion({ ...(prev.trades ?? TRADES_ZERO), ...patch });
      if (!prev.damage?.damageIsLocked) {
        const r = runFullCalc(prev.attackType, prev.condition, prev.damage?.narrativeType, prev.rangeType, newTrades, prev.damage?.type);
        if (r) return { ...prev, trades: newTrades, ...r, damage: { ...prev.damage, ...r.damage, damageIsLocked: false } };
      }
      const reapplied = reapplyTradesHelper(prev, prev.rangeType, newTrades);
      return { ...prev, trades: newTrades, ...reapplied };
    });

  const updateRangeType = (newRangeType) =>
    setForm((prev) => {
      const av = calcAutoRange(prev.attackType, newRangeType, bt);
      const rangeUpdates = {
        rangeType: newRangeType,
        ...(prev.rangeLocked !== false ? { range: av.range } : {}),
        ...(prev.areaLocked  !== false ? { area:  av.area  } : {}),
      };
      if (!prev.damage?.damageIsLocked) {
        const r = runFullCalc(prev.attackType, prev.condition, prev.damage?.narrativeType, newRangeType, prev.trades, prev.damage?.type);
        if (r) return { ...prev, ...rangeUpdates, ...r, damage: { ...prev.damage, ...r.damage, damageIsLocked: false } };
      }
      const reapplied = reapplyTradesHelper(prev, newRangeType, prev.trades);
      return { ...prev, ...rangeUpdates, ...reapplied };
    });

  const handleResize = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  useEffect(() => {
    handleResize();
  }, [form, isMechanicalTextLocked, manualMechanicalText]);

  const applyTemplate = (tpl) => {
    setForm((prev) => {
      const newAttackType = tpl.attackType ?? prev.attackType;
      const newRangeType  = tpl.rangeType  ?? prev.rangeType;
      const newCondition  = tpl.condition  ? { ...prev.condition, ...tpl.condition } : prev.condition;

      const next = {
        ...prev,
        name:        tpl.name        ?? prev.name,
        type:        tpl.type        ?? prev.type,
        attackType:  newAttackType,
        trType:      tpl.trType      ?? prev.trType,
        rangeType:   newRangeType,
        cost:        tpl.cost        ?? prev.cost,
        description: tpl.description ?? prev.description,
        condition:   newCondition,
      };

      const resetTrades = resetTradesForAttackType(newAttackType, TRADES_ZERO);
      next.trades = resetTrades;
      if (newAttackType === "acerto") next.condition = BLANK_CONDITION;

      const av = calcAutoRange(newAttackType, newRangeType, bt);
      if (next.rangeLocked !== false) next.range = av.range;
      if (next.areaLocked  !== false) next.area  = av.area;

      if (newAttackType === "suporte") {
        next.damage = { ...prev.damage, roll: "", average: 0, damageIsLocked: false };
      } else {
        // Recalcula dano para a criatura atual, ignorando valores salvos no template
        const r = runFullCalc(newAttackType, next.condition, prev.damage?.narrativeType, newRangeType, resetTrades, prev.damage?.type);
        if (r) Object.assign(next, r, { damage: { ...prev.damage, ...r.damage, damageIsLocked: false } });
      }

      return next;
    });
    setShowTemplates(false);
  };

  return (
    <div className="bg-slate-950/70 border border-purple-900/50 rounded p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-sm font-bold text-purple-300 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nova Ação
        </h4>
        {templates.length > 0 && (
          <button
            type="button"
            onClick={() => setShowTemplates(!showTemplates)}
            className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded transition-colors focus:outline-none ${
              showTemplates
                ? "bg-amber-900/40 text-amber-300 border border-amber-800/60"
                : "text-slate-400 hover:text-amber-300 hover:bg-slate-800"
            }`}
          >
            <BookOpen className="w-3 h-3" />
            Modelos ({templates.length})
          </button>
        )}
      </div>

      {showTemplates && (
        <div className="bg-slate-950 border border-slate-700 rounded overflow-hidden">
          <div className="px-3 py-2 border-b border-slate-800 flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
              Modelos Salvos
            </span>
            <button
              type="button"
              onClick={() => setShowTemplates(false)}
              className="text-slate-600 hover:text-slate-300"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          <div className="overflow-y-auto max-h-44 divide-y divide-slate-800/60">
            {templates.map((tpl) => (
              <div key={tpl.id} className="flex items-center gap-2 px-3 py-2 hover:bg-slate-800/60 group">
                <button
                  type="button"
                  onClick={() => applyTemplate(tpl)}
                  className="flex-1 min-w-0 text-left"
                >
                  <span className="text-sm text-slate-200 truncate block group-hover:text-white">
                    {tpl.name}
                  </span>
                </button>
                <Pill color="slate">{ACTION_TYPE_LABELS[tpl.type] || tpl.type}</Pill>
                <button
                  type="button"
                  onClick={() => onRemoveTemplate(tpl.id)}
                  className="text-slate-600 hover:text-red-400 transition-colors flex-shrink-0"
                  title="Remover modelo"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <ActionFormFields
        form={form}
        bt={bt}
        update={update}
        updateDamage={updateDamage}
        updateCond={updateCond}
        updateTrade={updateTrade}
        updateRangeType={updateRangeType}
      />

      {form.name?.trim() && form.attackType !== "suporte" && (() => {
          const autoText = generateActionDescription(form, draft?.name, form.description);
          if (!autoText) return null;
          const displayText = isMechanicalTextLocked ? autoText : manualMechanicalText;
          const toggleLockMechanical = () => {
            if (isMechanicalTextLocked) {
              setManualMechanicalText(autoText);
              setIsMechanicalTextLocked(false);
            } else {
              setIsMechanicalTextLocked(true);
            }
          };
          return (
            <div className="bg-slate-900/60 border border-slate-700 rounded p-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                  Texto Final
                </div>
                <button
                  type="button"
                  onClick={toggleLockMechanical}
                  title={isMechanicalTextLocked ? "Clique para editar manualmente" : "Clique para voltar ao texto automático"}
                  style={{
                    borderColor: isMechanicalTextLocked ? "rgb(71 85 105)"        : "rgb(217 119 6 / 0.6)",
                    color:       isMechanicalTextLocked ? "rgb(100 116 139)"       : "rgb(251 191 36)",
                    background:  isMechanicalTextLocked ? "transparent"            : "rgb(120 53 15 / 0.2)",
                  }}
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] transition-colors"
                >
                  {isMechanicalTextLocked
                    ? <><Lock   className="w-3 h-3" /> Auto</>
                    : <><Unlock className="w-3 h-3" /> Manual</>}
                </button>
              </div>
              <textarea
                ref={textareaRef}
                readOnly={isMechanicalTextLocked}
                value={displayText}
                onChange={(e) => { if (!isMechanicalTextLocked) { setManualMechanicalText(e.target.value); handleResize(); } }}
                className={`w-full bg-slate-950 border rounded px-2.5 py-2 text-xs text-slate-300 leading-relaxed resize-none overflow-hidden focus:outline-none transition-colors ${
                  isMechanicalTextLocked
                    ? "border-slate-800 cursor-default text-slate-400"
                    : "border-amber-700/60 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30"
                }`}
              />
              {!isMechanicalTextLocked && (
                <p className="text-[10px] text-amber-500/70 italic">
                  Editando manualmente — feche o cadeado para voltar ao texto automático.
                </p>
              )}
            </div>
          );
        })()}

      <div className="flex justify-end gap-2 pt-1">
        <SmallButton onClick={onCancel}>Cancelar</SmallButton>
        <SmallButton onClick={() => onAdd(form)} variant="primary" disabled={!form.name.trim()}>
          <Plus className="w-3 h-3" /> Adicionar
        </SmallButton>
      </div>
    </div>
  );
}
