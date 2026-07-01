import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Plus, BookOpen, X, Lock, Unlock, AlertTriangle } from "lucide-react";
import { SmallButton, Pill } from "../../builder-controls";
import ActionFormFields from "./ActionFormFields";
import AutomationEditorPanel from "../../AutomationEditorPanel";
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
  resolveActionTokens,
  ACTION_TEXT_TOKENS,
  normalizeAction,
  clampActionToBt,
} from "../../fm-action-calc";
import { hasTecnicaMaxima } from "../../fm-aptidoes";

// ============================================================
// ACTION FORM (nova ação OU edição de uma existente)
// ============================================================
// `initialAction` (opcional) pré-preenche o form para edição; nesse caso
// `onAdd` recebe o form atualizado e o chamador faz o updateAction.
// `context` (opcional) substitui draft/derived quando o form é usado fora do
// builder (ex.: editar um Modelo na Biblioteca, sem criatura). Quando ausente,
// os valores vêm de draft/derived como antes.
export default function ActionForm({
  derived, draft, onAdd, onCancel, templates = [], onRemoveTemplate,
  initialAction = null, submitLabel = "Adicionar", title = "Nova Ação",
  context = null, showFinalText = true, templateMode = false, dslContext = null,
}) {
  const patamar = context ? context.patamar : draft?.core?.patamar;
  const nd      = context ? context.nd      : draft?.core?.nd;
  const bt      = context ? (context.bt ?? 2) : (derived?.bt ?? 2);
  const acertoPrincipal = context ? (context.acertoPrincipal ?? 0) : (derived?.acertoPrincipal ?? 0);
  const cdBaseDerived   = context ? (context.cdBase ?? 0)          : (derived?.cdBase ?? 0);
  const creatureName    = context ? (context.creatureName ?? "")  : draft?.name;
  const difficulty      = context ? context.difficulty            : draft?.core?.difficulty;
  // A Aptidão "Técnica Máxima" destrava o toggle de Técnica Máxima nas ações.
  // Fora do builder (edição de Modelo via context) não há ficha → bloqueado.
  const tecnicaMaximaUnlocked = context ? false : hasTecnicaMaxima(draft?.aptidoesEspeciais);

  // Em edição, reabre já no modo manual se a ação tinha um Texto Final manual.
  const [isMechanicalTextLocked, setIsMechanicalTextLocked] = useState(
    () => !initialAction?.finalTextManual?.trim()
  );
  const [manualMechanicalText,   setManualMechanicalText]   = useState(
    () => initialAction?.finalTextManual ?? ""
  );
  const [showTemplates,          setShowTemplates]           = useState(false);
  // Modelo aguardando confirmação de ajuste de BT (condição/trades acima do BT).
  const [pendingTemplate,        setPendingTemplate]         = useState(null);
  const textareaRef = useRef(null);

  const [form, setForm] = useState(() => {
    // Edição: parte dos valores salvos (normalizados), preservando o que o
    // usuário já tinha montado (dano travado, trades, alcance manual etc.).
    if (initialAction) return normalizeAction(initialAction);
    const calcDmg    = calculateActionDamage(patamar, nd, "acerto", false);
    const tHitBase   = acertoPrincipal;
    const tCdBase    = cdBaseDerived;
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
  // `tmOverride` permite recalcular com o novo valor de Técnica Máxima no exato
  // momento do toggle (quando `form.tecnicaMaxima` ainda é o valor antigo).
  const runFullCalc = (attackType, condition, narrativeType, rangeType, trades, damageType, tmOverride) =>
    runFullActionCalc({
      patamar, nd, bt, attackType, condition, narrativeType, rangeType, trades, damageType,
      toHitBase: acertoPrincipal,
      cdBase:    cdBaseDerived,
      tecnicaMaxima: tmOverride ?? form.tecnicaMaxima,
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

      // Técnica Máxima: ao ligar, zera as conversões (indefensável — Acerto/CD
      // não se aplicam) e fixa o custo em 20 PE. Em qualquer caso, re-deriva o
      // dano quando destravado usando o NOVO valor do toggle (bônus por patamar).
      if ("tecnicaMaxima" in patch) {
        if (patch.tecnicaMaxima) {
          next.trades = { ...TRADES_ZERO };
          next.cost = 20;
        }
        if (next.attackType !== "suporte" && !next.damage?.damageIsLocked) {
          const r = runFullCalc(next.attackType, next.condition, next.damage?.narrativeType, next.rangeType, next.trades, next.damage?.type, patch.tecnicaMaxima);
          if (r) Object.assign(next, r, { damage: { ...next.damage, ...r.damage, damageIsLocked: false } });
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

  // Monta a ação para salvar, embutindo o Texto Final manual (ou limpando-o
  // quando o usuário voltou ao modo automático).
  const handleSubmit = () => {
    const finalTextManual =
      !isMechanicalTextLocked && manualMechanicalText.trim() ? manualMechanicalText : "";
    // Carimba o ND/Patamar/Dificuldade em que a ação foi montada e limpa o
    // selo de "texto desatualizado" (acabou de ser revisada manualmente).
    const calc = { nd, patamar, difficulty };
    onAdd({ ...form, finalTextManual, finalTextStale: false, calc });
  };

  const handleResize = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  // Insere um token {{…}} na posição do cursor do editor manual.
  const insertToken = (key) => {
    const tokenStr = `{{${key}}}`;
    const ta = textareaRef.current;
    if (!ta) {
      setManualMechanicalText((t) => t + tokenStr);
      return;
    }
    const start = ta.selectionStart ?? manualMechanicalText.length;
    const end   = ta.selectionEnd   ?? start;
    const next  = manualMechanicalText.slice(0, start) + tokenStr + manualMechanicalText.slice(end);
    setManualMechanicalText(next);
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + tokenStr.length;
      ta.setSelectionRange(pos, pos);
      handleResize();
    });
  };

  useEffect(() => {
    handleResize();
  }, [form, isMechanicalTextLocked, manualMechanicalText]);

  // Verifica compatibilidade de BT antes de aplicar. Se a condição/trades do
  // modelo excedem o BT da criatura, abre o modal de confirmação; senão aplica.
  const applyTemplate = (tpl) => {
    const { action: clamped, changes } = clampActionToBt(tpl, bt);
    if (changes.length === 0) { applyTemplateNow(tpl); return; }
    setPendingTemplate({ tpl: clamped, changes });
    setShowTemplates(false);
  };

  const applyTemplateNow = (tpl) => {
    setForm((prev) => {
      const tplDamage     = tpl.damage ?? null;
      const newAttackType = tpl.attackType ?? prev.attackType;
      const newRangeType  = tpl.rangeType  ?? prev.rangeType;
      const newCondition  = tpl.condition  ? { ...prev.condition, ...tpl.condition } : prev.condition;
      // Carrega os sacrifícios (trades) salvos, zerando os incompatíveis com o tipo de ataque.
      const newTrades     = resetTradesForAttackType(newAttackType, { ...TRADES_ZERO, ...(tpl.trades ?? {}) });

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
        trades:      newTrades,
        // Automação programada (bloquinhos) — vem junto do modelo.
        automation:  tpl.automation ?? prev.automation,
      };

      if (newAttackType === "acerto") next.condition = BLANK_CONDITION;

      const av = calcAutoRange(newAttackType, newRangeType, bt);
      if (next.rangeLocked !== false) next.range = av.range;
      if (next.areaLocked  !== false) next.area  = av.area;

      if (newAttackType === "suporte") {
        next.damage = { ...prev.damage, roll: "", average: 0, damageIsLocked: false };
      } else if (tplDamage?.damageIsLocked) {
        // Dano MANUAL salvo no modelo: preserva os números exatos; Acerto/CD
        // ainda seguem a criatura atual (trades reaplicados sobre o dano travado).
        next.damage = { ...prev.damage, ...tplDamage, damageIsLocked: true };
        Object.assign(next, reapplyTradesHelper(next, newRangeType, newTrades));
      } else {
        // Dano AUTOMÁTICO: preserva os campos qualitativos do modelo (tipo de
        // dano, narrativa, condição, trades) e reescala só os dados pro ND atual.
        const narrativeType = tplDamage?.narrativeType ?? prev.damage?.narrativeType;
        const damageType    = tplDamage?.type ?? prev.damage?.type;
        const r = runFullCalc(newAttackType, next.condition, narrativeType, newRangeType, newTrades, damageType);
        if (r) {
          Object.assign(next, r, {
            damage: {
              ...prev.damage, ...tplDamage, ...r.damage,
              type: damageType, narrativeType, damageIsLocked: false,
            },
          });
        }
      }

      return next;
    });
    // Carrega o Texto Final customizado do modelo (tokens resolvem na criatura atual).
    if (tpl.finalTextManual?.trim()) {
      setManualMechanicalText(tpl.finalTextManual);
      setIsMechanicalTextLocked(false);
    }
    setShowTemplates(false);
    setPendingTemplate(null);
  };

  return (
    <div className="bg-slate-950/70 border border-purple-900/50 rounded p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-sm font-bold text-purple-300 flex items-center gap-2">
          <Plus className="w-4 h-4" /> {title}
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
        templateMode={templateMode}
        tecnicaMaximaUnlocked={tecnicaMaximaUnlocked}
        update={update}
        updateDamage={updateDamage}
        updateCond={updateCond}
        updateTrade={updateTrade}
        updateRangeType={updateRangeType}
      />

      {showFinalText && form.name?.trim() && form.attackType !== "suporte" && (() => {
          const autoText = generateActionDescription(form, creatureName, form.description);
          if (!autoText) return null;
          // Seed do modo manual usa TOKENS ({{dano}}…) em vez de números fixos,
          // pra prosa e mecânica nunca dessincronizarem.
          const tokenSeed = generateActionDescription(form, creatureName, form.description, { tokenize: true });
          const displayText = isMechanicalTextLocked ? autoText : manualMechanicalText;
          const resolvedPreview = !isMechanicalTextLocked
            ? resolveActionTokens(manualMechanicalText, form, creatureName)
            : "";
          const toggleLockMechanical = () => {
            if (isMechanicalTextLocked) {
              setManualMechanicalText(tokenSeed);
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
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-1">
                    <span className="text-[10px] text-slate-500 mr-0.5">Inserir:</span>
                    {ACTION_TEXT_TOKENS.map((tk) => (
                      <button
                        key={tk.key}
                        type="button"
                        // eslint-disable-next-line react-hooks/refs -- ref lido em handler de clique (uso válido)
                        onClick={() => insertToken(tk.key)}
                        title={`Insere {{${tk.key}}}, atualiza sozinho`}
                        className="px-1.5 py-0.5 rounded border border-amber-800/60 bg-amber-950/30 text-amber-300/90 text-[10px] font-mono hover:bg-amber-900/40 hover:text-amber-200 transition-colors focus:outline-none"
                      >
                        {tk.label}
                      </button>
                    ))}
                  </div>
                  {resolvedPreview && (
                    <div className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5">
                      <div className="text-[9px] uppercase tracking-widest text-slate-600 font-bold mb-0.5">
                        Prévia
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {resolvedPreview}
                      </p>
                    </div>
                  )}
                  <p className="text-[10px] text-amber-500/70 italic">
                    Os marcadores <span className="font-mono">{"{{dano}}"}</span>, <span className="font-mono">{"{{acerto}}"}</span> etc. se atualizam sozinhos quando o dano muda. Feche o cadeado para voltar ao automático.
                  </p>
                </div>
              )}
            </div>
          );
        })()}

      {/* Programar a ação (bloquinhos) — ativar no combate aplica os buffs */}
      <AutomationEditorPanel
        value={form.automation}
        onChange={(automation) => update({ automation })}
        dslContext={dslContext}
        defaultStack="highest"
      />

      <div className="flex justify-end gap-2 pt-1">
        <SmallButton onClick={onCancel}>Cancelar</SmallButton>
        <SmallButton onClick={handleSubmit} variant="primary" disabled={!form.name.trim()}>
          <Plus className="w-3 h-3" /> {submitLabel}
        </SmallButton>
      </div>

      {pendingTemplate && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4"
          onClick={() => setPendingTemplate(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-slate-900 border border-amber-800/60 rounded-lg max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 p-4 border-b border-slate-800">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <h3 className="text-sm font-bold text-amber-200">Ajuste de BT necessário</h3>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-xs text-slate-400 leading-relaxed">
                Este modelo foi feito para um BT maior que o desta criatura (+{bt}).
                Para aplicar, os seguintes ajustes serão feitos automaticamente:
              </p>
              <ul className="space-y-1.5">
                {pendingTemplate.changes.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-amber-200/90">
                    <span className="text-amber-500 mt-0.5">•</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-slate-800">
              <SmallButton onClick={() => setPendingTemplate(null)}>Cancelar</SmallButton>
              <SmallButton onClick={() => applyTemplateNow(pendingTemplate.tpl)} variant="primary">
                Ajustar e aplicar
              </SmallButton>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
