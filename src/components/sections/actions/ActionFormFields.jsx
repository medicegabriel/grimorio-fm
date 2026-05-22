import React from "react";
import { ChevronDown, Info, Lock, Unlock } from "lucide-react";
import { FieldLabel, TextInput, TextArea, Select, NumberInput } from "../../builder-controls";
import { CONDITIONS } from "../../fm-tables";
import {
  TRADES_ZERO,
  getActionParams,
  calcAutoRange,
  deriveFinalDice,
  rollStr,
  rollAverage,
  ACTION_TYPE_OPTIONS,
  ATTACK_TYPE_OPTIONS,
  NARRATIVE_OPTIONS,
  TR_TYPE_OPTIONS,
  DAMAGE_TYPE_GROUPS,
  DAMAGE_TYPE_LABELS,
  CONDITION_TIER_OPTIONS,
  CONDITION_TIER_LABELS,
  CONDITION_PE_COST,
  CONDITION_ND_COST,
  BT_MIN_FOR_TIER,
  CONDITION_PAYMENT_OPTIONS,
  TIER_TO_CONDITIONS_KEY,
  DIE_SIZES,
} from "../../fm-action-calc";

// ============================================================
// TRADE ROW — stepper de conversão equivalente
// ============================================================
function TradeRow({ label, hint, value, onChange, step = 1, blocked, max }) {
  const canDecrease = value > 0;
  const canIncrease = !blocked && (max === undefined || value + step <= max);
  const btnBase = "w-7 h-7 flex items-center justify-center rounded text-sm font-bold border transition-colors focus:outline-none select-none";
  const btnActive   = "border-slate-600 text-white hover:bg-slate-700 hover:border-slate-500 active:scale-95";
  const btnDisabled = "border-slate-800 text-slate-700 cursor-not-allowed";

  return (
    <div className={`flex items-center gap-2 ${blocked ? "opacity-40" : ""}`}>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-slate-300 leading-tight">{label}</div>
        <div className="text-[10px] text-slate-500 leading-tight">{hint}</div>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button
          type="button"
          onClick={() => canDecrease && onChange(Math.max(0, value - step))}
          disabled={!canDecrease}
          className={`${btnBase} shrink-0 ${canDecrease ? btnActive : btnDisabled}`}
        >
          −
        </button>
        <span className={`w-6 text-center text-sm font-mono font-semibold shrink-0 ${value > 0 ? "text-amber-300" : "text-slate-600"}`}>
          {value}
        </span>
        <button
          type="button"
          onClick={() => canIncrease && onChange(value + step)}
          disabled={!canIncrease}
          className={`${btnBase} shrink-0 ${canIncrease ? btnActive : btnDisabled}`}
        >
          +
        </button>
      </div>
    </div>
  );
}

// ============================================================
// FORM FIELDS — compartilhado entre ActionItem e ActionForm
// ============================================================
export default function ActionFormFields({ form, bt = 2, update, updateDamage, updateCond, updateTrade, updateRangeType }) {
  const isTR      = form.attackType?.startsWith("tr_");
  const isAcerto  = form.attackType === "acerto";
  const hasDamage = form.attackType !== "suporte";
  const hasCond   = form.condition?.tier && form.condition.tier !== "nenhuma";

  const dieSize   = form.damage?.dieSize ?? 8;
  const mod       = form.damage?.mod ?? 0;
  const isLocked  = form.damage?.damageIsLocked === true;
  const isAutoCalc = form.damage?.damageIsCalculated === true && !isLocked;
  const narrativeType = form.damage?.narrativeType ?? "padrao";
  const finalDice  = deriveFinalDice(form.damage);

  // Trade / alcance state
  const trades      = { ...TRADES_ZERO, ...(form.trades ?? {}) };
  const rangeType   = form.rangeType ?? "distancia";
  const params      = getActionParams(bt);
  const numDiceBase = form.damage?.numDiceBase ?? form.damage?.numDice ?? 0;
  const toHitBase   = form.toHitBase ?? form.toHit ?? 0;
  const cdBase      = form.cdBase    ?? form.cd    ?? 0;

  // Deltas para mostrar ajuste acima do base
  const tradeToHitDelta = (trades.sacrifDadosAcerto * 2) - trades.sacrifAcertoDados;
  const tradeCdDelta    = trades.sacrifDadosCD - trades.sacrifCdDados;

  // Mutual exclusion: bloqueia lado oposto
  const blockedDadosAcerto  = trades.sacrifAcertoDados > 0;
  const blockedDadosCD      = trades.sacrifCdDados     > 0;
  const blockedAcertoDados  = trades.sacrifDadosAcerto > 0;
  const blockedCdDados      = trades.sacrifDadosCD     > 0;

  // Caps por BT + trava de mínimo 1 dado no pool bruto
  const bonusCaCPool = rangeType === "cac" ? params.meleeBonusDice : 0;
  const rawDicePool  = numDiceBase + bonusCaCPool
    + Math.floor((trades.sacrifAcertoDados ?? 0) / 2)
    + (trades.sacrifCdDados ?? 0);
  const capDadosAcerto  = Math.max(0, Math.min(bt, rawDicePool - 1 - (trades.sacrifDadosCD ?? 0)));
  const capDadosCD      = Math.max(0, Math.min(bt, rawDicePool - 1 - (trades.sacrifDadosAcerto ?? 0)));
  const capCdDados      = bt;
  const capAcertoDados  = bt * 2;

  const hasActiveTrades =
    (isAcerto && (trades.sacrifDadosAcerto > 0 || trades.sacrifAcertoDados > 0)) ||
    (isTR    && (trades.sacrifDadosCD     > 0 || trades.sacrifCdDados      > 0)) ||
    rangeType === "cac";

  const rangeLocked = form.rangeLocked !== false;
  const areaLocked  = form.areaLocked  !== false;
  const autoVals    = calcAutoRange(form.attackType, rangeType, bt);

  const toggleRangeLock = () => {
    if (!rangeLocked) update({ rangeLocked: true, range: autoVals.range });
    else update({ rangeLocked: false });
  };
  const toggleAreaLock = () => {
    if (!areaLocked) update({ areaLocked: true, area: autoVals.area });
    else update({ areaLocked: false });
  };

  const lockBtnStyle = (isLocked) => ({
    borderColor: isLocked ? "rgb(71 85 105)"        : "rgb(217 119 6 / 0.6)",
    color:       isLocked ? "rgb(100 116 139)"       : "rgb(251 191 36)",
    background:  isLocked ? "transparent"            : "rgb(120 53 15 / 0.2)",
  });

  const handleCondNameKey = (key) => {
    if (key === "outro") updateCond({ nameKey: "outro", name: "" });
    else updateCond({ nameKey: key, name: key });
  };

  const handleTierChange = (tier) => {
    const key = TIER_TO_CONDITIONS_KEY[tier];
    const validNames = key ? CONDITIONS[key] : [];
    const currentKey = form.condition?.nameKey ?? "";
    const nameStillValid = currentKey === "outro" || validNames.includes(currentKey);
    updateCond({ tier, ...(nameStillValid ? {} : { nameKey: "", name: "" }) });
  };

  const toggleLock = () => updateDamage({ damageIsLocked: !isLocked });

  return (
    <div className="space-y-3">
      {/* Nome + Tipo de execução */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <FieldLabel required>Nome da Ação</FieldLabel>
          <TextInput value={form.name} onChange={(v) => update({ name: v })} placeholder="Ex: Garra Lacerante" />
        </div>
        <div>
          <FieldLabel>Tipo de Execução</FieldLabel>
          <Select value={form.type} onChange={(v) => update({ type: v })} options={ACTION_TYPE_OPTIONS} />
        </div>
      </div>

      {/* Tipo de ataque + custo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <FieldLabel>Tipo de Ataque / Efeito</FieldLabel>
          <div className="relative">
            <select
              value={form.attackType ?? ""}
              onChange={(e) => update({ attackType: e.target.value })}
              className="w-full h-9 bg-slate-950 border border-slate-700 rounded pl-2 pr-7 text-sm text-white appearance-none focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            >
              {ATTACK_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}
                  disabled={opt.value === "tr_area" && form.damage?.type === "alma"}>
                  {opt.label}{opt.value === "tr_area" && form.damage?.type === "alma" ? " (incompatível com Alma)" : ""}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>
        </div>
        <div>
          <FieldLabel>Custo Base em PE</FieldLabel>
          <NumberInput value={form.cost} onChange={(v) => update({ cost: v })} min={0} />
        </div>
      </div>

      {/* TR ou Acerto — wrapper estável evita insertBefore ao trocar attackType */}
      <div>
        {isTR && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Tipo de TR</FieldLabel>
              <Select value={form.trType} onChange={(v) => update({ trType: v })} options={TR_TYPE_OPTIONS} />
            </div>
            <div>
              <FieldLabel>
                CD{tradeCdDelta !== 0 && <span className="text-slate-500 font-normal ml-1 text-[10px]">(base)</span>}
              </FieldLabel>
              <NumberInput value={cdBase} onChange={(v) => update({ cdBase: v })} min={0} />
              {tradeCdDelta !== 0 && (
                <div className="mt-1 text-[11px] text-slate-400">
                  Final: <span className="font-mono text-white font-semibold">{cdBase + tradeCdDelta}</span>
                  <span className="text-slate-500 ml-1">
                    ({tradeCdDelta > 0 ? "+" : ""}{tradeCdDelta} trades)
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
        {isAcerto && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>
                Bônus de Acerto{tradeToHitDelta !== 0 && <span className="text-slate-500 font-normal ml-1 text-[10px]">(base)</span>}
              </FieldLabel>
              <NumberInput value={toHitBase} onChange={(v) => update({ toHitBase: v })} />
              {tradeToHitDelta !== 0 && (
                <div className="mt-1 text-[11px] text-slate-400">
                  Final: <span className="font-mono text-white font-semibold">+{toHitBase + tradeToHitDelta}</span>
                  <span className="text-slate-500 ml-1">
                    ({tradeToHitDelta > 0 ? "+" : ""}{tradeToHitDelta} trades)
                  </span>
                </div>
              )}
            </div>
            <div />
          </div>
        )}
      </div>

      {/* Tipo de Alcance + Parâmetros do BT */}
      <div className="bg-slate-900/60 border border-slate-800 rounded p-3 space-y-2">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tipo de Alcance</div>
        <div className="flex gap-2">
          {[
            { value: "distancia", label: "À Distância" },
            { value: "cac",       label: "Corpo a Corpo" },
          ].map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => updateRangeType(value)}
              className={`flex-1 py-1.5 px-3 rounded text-xs font-semibold transition-colors border focus:outline-none ${
                rangeType === value
                  ? "bg-purple-900/60 border-purple-700 text-purple-200"
                  : "bg-slate-950 border-slate-700 text-slate-400 hover:text-white hover:border-slate-600"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] font-mono">
          <span className="text-slate-500">
            Alcance Máx: <span className="text-slate-300">{params.range}m</span>
          </span>
          <span className="text-slate-500">
            Área Máx: <span className="text-slate-300">{params.area}m</span>
          </span>
          {rangeType === "cac" && (
            <span className="text-emerald-400 font-semibold">
              +{params.meleeBonusDice} dado{params.meleeBonusDice > 1 ? "s" : ""} CaC
            </span>
          )}
        </div>
      </div>

      {/* Alcance e Área */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <FieldLabel hint={rangeLocked ? "auto" : "livre"}>Alcance</FieldLabel>
          <div className="flex gap-1">
            {rangeLocked ? (
              <div className="flex-1 h-9 bg-slate-950/30 border border-slate-700/50 rounded px-2 text-sm text-slate-400 flex items-center select-none">
                {form.range || "-"}
              </div>
            ) : (
              <div className="flex-1">
                <TextInput value={form.range ?? ""} onChange={(v) => update({ range: v })} placeholder="Ex: Toque, Visão..." />
              </div>
            )}
            <button
              type="button"
              onClick={toggleRangeLock}
              title={rangeLocked ? "Desbloquear para editar manualmente" : "Restaurar valor automático"}
              className="w-9 h-9 flex items-center justify-center rounded border transition-colors flex-shrink-0 focus:outline-none"
              style={lockBtnStyle(rangeLocked)}
            >
              {rangeLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
        <div>
          <FieldLabel hint={areaLocked ? "auto" : "livre"}>Área</FieldLabel>
          <div className="flex gap-1">
            {areaLocked ? (
              <div className="flex-1 h-9 bg-slate-950/30 border border-slate-700/50 rounded px-2 text-sm text-slate-400 flex items-center select-none">
                {form.area || "-"}
              </div>
            ) : (
              <div className="flex-1">
                <TextInput value={form.area ?? ""} onChange={(v) => update({ area: v })} placeholder="Ex: Cone, Esfera..." />
              </div>
            )}
            <button
              type="button"
              onClick={toggleAreaLock}
              title={areaLocked ? "Desbloquear para editar manualmente" : "Restaurar valor automático"}
              className="w-9 h-9 flex items-center justify-center rounded border transition-colors flex-shrink-0 focus:outline-none"
              style={lockBtnStyle(areaLocked)}
            >
              {areaLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Dano base */}
      {hasDamage && (
        <div className="bg-slate-900/60 border border-slate-800 rounded p-3 space-y-2">
          {/* Header com lock */}
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              Dano Base
              {isAutoCalc && (
                <span className="text-[10px] bg-purple-900/40 border border-purple-800 text-purple-300 px-1.5 py-0.5 rounded font-normal tracking-normal">
                  Auto
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={toggleLock}
              title={isLocked ? "Desbloquear (restaurar auto-cálculo)" : "Bloquear (manter valores manuais)"}
              className="flex items-center gap-1 px-2 py-1 rounded text-[10px] border transition-colors focus:outline-none focus:ring-1 focus:ring-purple-500/40"
              style={{
                borderColor: isLocked ? "rgb(217 119 6 / 0.6)" : "rgb(71 85 105)",
                color:       isLocked ? "rgb(251 191 36)"       : "rgb(100 116 139)",
                background:  isLocked ? "rgb(120 53 15 / 0.2)"  : "transparent",
              }}
            >
              {isLocked
                ? <><Lock className="w-3 h-3" /> Manual</>
                : <><Unlock className="w-3 h-3" /> Auto</>
              }
            </button>
          </div>

          {/* Narrativa do ataque */}
          <div>
            <FieldLabel>Narrativa do Ataque</FieldLabel>
            <Select
              value={narrativeType}
              onChange={(v) => updateDamage({ narrativeType: v, isNarrativePhysical: v === "fisica" })}
              options={NARRATIVE_OPTIONS}
            />
          </div>

          {/* Campos de dado */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div>
              <FieldLabel>
                <span className="whitespace-nowrap">Nº Dados</span>
                {hasActiveTrades && <span className="text-slate-400 font-normal ml-1 text-[9px]">base</span>}
              </FieldLabel>
              <NumberInput
                value={numDiceBase}
                onChange={(v) => updateDamage({ numDiceBase: v, damageIsLocked: true })}
                min={0}
              />
            </div>
            <div>
              <FieldLabel><span className="whitespace-nowrap">Dado</span></FieldLabel>
              <div className="relative">
                <select
                  value={dieSize}
                  onChange={(e) => updateDamage({ dieSize: parseInt(e.target.value), damageIsLocked: true })}
                  className="w-full h-9 bg-slate-950 border border-slate-700 rounded pl-2 pr-7 text-sm text-white appearance-none focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                >
                  {DIE_SIZES.map((d) => <option key={d} value={d}>d{d}</option>)}
                </select>
                <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              </div>
            </div>
            <div>
              <FieldLabel><span className="whitespace-nowrap">Fixo</span></FieldLabel>
              <NumberInput
                value={mod}
                onChange={(v) => updateDamage({ mod: v, damageIsLocked: true })}
              />
            </div>
            <div>
              <FieldLabel><span className="whitespace-nowrap">Tipo de Dano</span></FieldLabel>
              <div className="relative">
                <select
                  value={form.damage?.type ?? "cortante"}
                  onChange={(e) => updateDamage({ type: e.target.value })}
                  className="w-full h-9 bg-slate-950 border border-slate-700 rounded pl-2 pr-7 text-sm text-white appearance-none focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                >
                  {DAMAGE_TYPE_GROUPS.map(({ label, types }) => (
                    <optgroup key={label} label={label}>
                      {types.map((t) => (
                        <option key={t} value={t}
                          disabled={t === "alma" && form.attackType === "tr_area"}>
                          {DAMAGE_TYPE_LABELS[t]}{t === "alma" && form.attackType === "tr_area" ? " (incompatível com Área)" : ""}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Preview da rolagem */}
          {(finalDice > 0 || mod !== 0) && (
            <div className="text-xs text-slate-400 flex items-center gap-2 flex-wrap">
              <span>
                Rolagem:{" "}
                <span className="font-mono text-white font-semibold">
                  {rollStr(finalDice, dieSize, mod)}
                </span>
              </span>
              <span className="text-slate-500">(méd. {rollAverage(finalDice, dieSize, mod)})</span>
            </div>
          )}

          {/* Conversão Equivalente — steppers contextuais por tipo de ofensiva */}
          {(isAcerto || isTR) && (
            <div className="border-t border-slate-700/50 pt-2.5 space-y-2.5">
              <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                Conversão Equivalente
              </div>

              {isAcerto && (
                <>
                  <TradeRow
                    label="Dados → Acerto"
                    hint={`Cada dado sacrificado concede +2 Acerto (máx. ${capDadosAcerto})`}
                    value={trades.sacrifDadosAcerto}
                    onChange={(v) => updateTrade({ sacrifDadosAcerto: v })}
                    blocked={blockedDadosAcerto}
                    max={capDadosAcerto}
                  />
                  <TradeRow
                    label="Acerto → Dados"
                    hint={`Cada -2 Acerto concede +1 Dado (máx. ${capAcertoDados} Acerto)`}
                    value={trades.sacrifAcertoDados}
                    onChange={(v) => updateTrade({ sacrifAcertoDados: v })}
                    step={2}
                    blocked={blockedAcertoDados}
                    max={capAcertoDados}
                  />
                </>
              )}

              {isTR && (
                <>
                  <TradeRow
                    label="Dados → CD"
                    hint={`Cada dado sacrificado concede +1 CD (máx. ${capDadosCD})`}
                    value={trades.sacrifDadosCD}
                    onChange={(v) => updateTrade({ sacrifDadosCD: v })}
                    blocked={blockedDadosCD}
                    max={capDadosCD}
                  />
                  <TradeRow
                    label="CD → Dados"
                    hint={`Cada -1 CD concede +1 Dado (máx. ${capCdDados})`}
                    value={trades.sacrifCdDados}
                    onChange={(v) => updateTrade({ sacrifCdDados: v })}
                    blocked={blockedCdDados}
                    max={capCdDados}
                  />
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Condição */}
      <div className="bg-slate-900/60 border border-slate-800 rounded p-3 space-y-2">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Condição (Opcional)</div>
        {isAcerto ? (
          <p className="text-xs text-slate-500 italic">
            Condições só podem ser aplicadas em Testes de Resistência.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <FieldLabel>Força da Condição</FieldLabel>
                <div className="relative">
                  <select
                    value={form.condition?.tier ?? "nenhuma"}
                    onChange={(e) => handleTierChange(e.target.value)}
                    className="w-full h-9 bg-slate-950 border border-slate-700 rounded pl-2 pr-7 text-sm text-white appearance-none focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  >
                    {CONDITION_TIER_OPTIONS.map((opt) => {
                      const minBt = BT_MIN_FOR_TIER[opt.value];
                      const locked = minBt != null && bt < minBt;
                      return (
                        <option key={opt.value} value={opt.value} disabled={locked}>
                          {opt.label}{locked ? ` (BT +${minBt} mín.)` : ""}
                        </option>
                      );
                    })}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                </div>
                {form.condition?.tier && form.condition.tier !== "nenhuma" &&
                  (BT_MIN_FOR_TIER[form.condition.tier] ?? 0) > bt && (
                  <div className="mt-1 text-[10px] text-red-400">
                    BT insuficiente para esta condição (requer +{BT_MIN_FOR_TIER[form.condition.tier]}, atual +{bt})
                  </div>
                )}
              </div>
              {hasCond && (
                <div>
                  <FieldLabel>Método de Custo</FieldLabel>
                  <Select
                    value={form.condition?.payment ?? "pe"}
                    onChange={(v) => updateCond({ payment: v })}
                    options={CONDITION_PAYMENT_OPTIONS}
                  />
                </div>
              )}
            </div>

            {hasCond && (() => {
              const tierKey = TIER_TO_CONDITIONS_KEY[form.condition?.tier ?? ""];
              const condNamesForTier = tierKey ? CONDITIONS[tierKey] : [];
              return (
                <div className="space-y-2">
                  <div>
                    <FieldLabel>Nome da Condição</FieldLabel>
                    <div className="relative">
                      <select
                        value={form.condition?.nameKey ?? ""}
                        onChange={(e) => handleCondNameKey(e.target.value)}
                        className="w-full h-9 bg-slate-950 border border-slate-700 rounded pl-2 pr-7 text-sm text-white appearance-none focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                      >
                        <option value="">— Selecione —</option>
                        {condNamesForTier.map((n) => (
                          <option key={n} value={n}>{n.charAt(0).toUpperCase() + n.slice(1)}</option>
                        ))}
                        <option value="outro">Outro / Customizado</option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                    </div>
                  </div>
                  {form.condition?.nameKey === "outro" && (
                    <div>
                      <FieldLabel hint="campo livre">Nome Customizado</FieldLabel>
                      <TextInput
                        value={form.condition?.name ?? ""}
                        onChange={(v) => updateCond({ name: v })}
                        placeholder="Descreva a condição..."
                      />
                    </div>
                  )}
                </div>
              );
            })()}

          </>
        )}
      </div>

      {/* Flavor Text / Narração */}
      <div>
        <FieldLabel hint="flavor text — aparece antes do texto mecânico no preview">
          Texto Narrativo
        </FieldLabel>
        <TextArea
          value={form.description}
          onChange={(v) => update({ description: v })}
          rows={2}
          placeholder="Ex: Com um rugido, a besta desfere uma garra afiada..."
        />
      </div>

      <RulesReference attackType={form.attackType} conditionTier={form.condition?.tier} />
    </div>
  );
}

// ============================================================
// REFERÊNCIA DE REGRAS
// ============================================================
function RulesReference({ attackType, conditionTier }) {
  const tips = [];

  if (attackType === "tr_individual")
    tips.push("TR Individual: O dano base é equivalente a 1 ND inferior ao Acerto. Falha = Dano completo calculado. Sucesso = Metade do dano.");
  else if (attackType === "tr_area")
    tips.push("TR em Área: falha = dano completo, sucesso = metade do dano.");

  if (conditionTier && conditionTier !== "nenhuma") {
    const pe = CONDITION_PE_COST[conditionTier];
    const nd = CONDITION_ND_COST[conditionTier];
    tips.push(
      `Condição ${CONDITION_TIER_LABELS[conditionTier]}: pagar ${pe} PE ou reduzir ${nd} ND do dano.`
    );
  }

  if (!tips.length) return null;

  return (
    <div className="bg-blue-950/30 border border-blue-900/40 rounded p-2.5 space-y-1">
      {tips.map((tip, i) => (
        <div key={i} className="flex items-start gap-2 text-[11px] text-blue-300">
          <Info className="w-3 h-3 mt-0.5 flex-shrink-0 text-blue-400" />
          {tip}
        </div>
      ))}
    </div>
  );
}
