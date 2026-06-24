// AutomationBuilder.jsx
// ============================================================
// MOTOR DE AUTOMAÇÃO — Fase 2: editor de "bloquinhos" (no-code)
// ============================================================
// Componente COMPARTILHADO. Recebe `value` (entity.automation | undefined) e
// `onChange(automation)`. Monta regras (Gatilho → Efeitos) sem código. Por
// enquanto: gatilhos Passiva/Ativada e efeitos modify_stat (buff/debuff). A
// aba "código"/DSL entra na Fase 3.
// ============================================================

import { useState } from "react";
import { Plus, Trash2, Zap, ChevronDown, ChevronRight, Sparkles, Power, HelpCircle, FunctionSquare } from "lucide-react";
import {
  MODIFIER_TARGET_GROUPS, STACK_MODES, DURATION_KINDS, MODIFIER_OPS,
} from "./fm-modifiers";
import {
  TRIGGER_TYPES, TRIGGER_ENABLED, ACTION_COST_TYPES, ACTIVATION_MODES,
  EFFECT_TYPES, RESOURCE_TARGETS, RESOURCE_OPS, CONDITION_OPS, CONDITION_OPTIONS,
  ACTION_DAMAGE_SCOPES,
  newRule, newStatEffect, newEffect, newAutomation, summarizeRule,
} from "./fm-automation";
import { validateExpression, DSL_VARIABLE_NAMES, evalNumber } from "./fm-dsl";
import AutomationDocsModal from "./AutomationDocsModal";

// Campo de expressão DSL com validação ao vivo (vermelho quando inválida).
function ExprInput({ value, onChange, placeholder, className = "" }) {
  const res = validateExpression(value, DSL_VARIABLE_NAMES);
  const invalid = value && !res.ok;
  return (
    <div className={className}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        spellCheck={false}
        className={`w-full h-9 bg-slate-950 border rounded px-2 py-1.5 text-sm font-mono leading-tight text-emerald-200 focus:outline-none ${
          invalid ? "border-red-600 focus:border-red-500" : "border-slate-700 focus:border-purple-500"
        }`}
        aria-label="Expressão"
      />
      {invalid && <p className="text-[10px] text-red-400 mt-0.5">{res.error}</p>}
    </div>
  );
}

const selectCls =
  "h-9 w-full bg-slate-950 border border-slate-700 rounded pl-2.5 pr-8 py-1.5 text-sm leading-tight text-white appearance-none focus:outline-none focus:border-purple-500";
const inputCls =
  "h-9 bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-sm leading-tight text-white focus:outline-none focus:border-purple-500";

const Chevron = () => (
  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
);

export default function AutomationBuilder({ value, onChange, dslContext = null, defaultStack = "sum" }) {
  const [docsOpen, setDocsOpen] = useState(false);
  // Regra recém-criada abre expandida; as demais entram recolhidas (resumo).
  const [justAddedId, setJustAddedId] = useState(null);
  const automation = value ?? newAutomation();
  const rules = automation.rules ?? [];

  const setAutomation = (next) => onChange?.(next);
  const updateRule = (id, patch) =>
    setAutomation({ ...automation, rules: rules.map((r) => (r.id === id ? { ...r, ...patch } : r)) });
  const addRule = () => {
    const r = newRule();
    setJustAddedId(r.id);
    setAutomation({ ...automation, enabled: true, rules: [...rules, r] });
  };
  const removeRule = (id) =>
    setAutomation({ ...automation, rules: rules.filter((r) => r.id !== id) });

  const addEffect = (ruleId) => {
    const r = rules.find((x) => x.id === ruleId);
    if (r) updateRule(ruleId, { effects: [...r.effects, newStatEffect({ stack: defaultStack })] });
  };
  const updateEffect = (ruleId, effId, patch) => {
    const r = rules.find((x) => x.id === ruleId);
    if (r) updateRule(ruleId, { effects: r.effects.map((e) => (e.id === effId ? { ...e, ...patch } : e)) });
  };
  const removeEffect = (ruleId, effId) => {
    const r = rules.find((x) => x.id === ruleId);
    if (r) updateRule(ruleId, { effects: r.effects.filter((e) => e.id !== effId) });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-[11px] text-slate-400">
        <Zap className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
        <span className="flex-1">
          Programe esta habilidade com blocos. Cada regra: um <b className="text-slate-200">gatilho</b> e um ou mais{" "}
          <b className="text-slate-200">efeitos</b>. Buffs entram no combate via os modificadores.
        </span>
        <button
          type="button"
          onClick={() => setDocsOpen(true)}
          className="inline-flex items-center gap-1 px-2 py-1 rounded text-purple-300 hover:text-purple-200 hover:bg-slate-800 flex-shrink-0 focus:outline-none"
          title="Ajuda da DSL (variáveis, funções, copiar prompt pra IA)"
        >
          <HelpCircle className="w-3.5 h-3.5" /> DSL
        </button>
      </div>
      <AutomationDocsModal open={docsOpen} onClose={() => setDocsOpen(false)} />

      {rules.length === 0 && (
        <div className="text-center py-4 text-slate-600 text-xs italic border border-dashed border-slate-800 rounded">
          Nenhuma regra ainda. Adicione uma para começar a programar.
        </div>
      )}

      {rules.map((rule) => (
        <RuleBlock
          key={rule.id}
          rule={rule}
          ctx={dslContext}
          defaultStack={defaultStack}
          defaultOpen={rule.id === justAddedId}
          onUpdate={(patch) => updateRule(rule.id, patch)}
          onRemove={() => removeRule(rule.id)}
          onAddEffect={() => addEffect(rule.id)}
          onUpdateEffect={(effId, patch) => updateEffect(rule.id, effId, patch)}
          onRemoveEffect={(effId) => removeEffect(rule.id, effId)}
        />
      ))}

      <button
        type="button"
        onClick={addRule}
        className="w-full flex items-center justify-center gap-1.5 h-9 rounded border border-dashed border-indigo-700/60 text-indigo-300 hover:bg-indigo-950/40 text-sm font-semibold transition-colors"
      >
        <Plus className="w-4 h-4" /> Adicionar regra
      </button>
    </div>
  );
}

function RuleBlock({ rule, ctx = null, defaultStack = "sum", defaultOpen = false, onUpdate, onRemove, onAddEffect, onUpdateEffect, onRemoveEffect }) {
  const triggerType = rule.trigger?.type ?? "passive";
  const isActivated = triggerType === "activated";
  const [open, setOpen] = useState(defaultOpen);

  const setTrigger = (type) => onUpdate({
    trigger: type === "hp_below"
      ? { type, threshold: rule.trigger?.threshold ?? 50 }
      : { type },
  });
  const summary = summarizeRule(rule, ctx);

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/40 overflow-hidden">
      {/* Cabeçalho da regra */}
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-900/60 border-b border-slate-800">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center justify-center w-6 h-7 rounded text-slate-400 hover:text-slate-200 flex-shrink-0 focus:outline-none"
          aria-label={open ? "Recolher regra" : "Expandir regra"}
          aria-expanded={open}
        >
          {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
        <Sparkles className="w-3.5 h-3.5 text-fuchsia-400 flex-shrink-0" />
        {open ? (
          <input
            type="text"
            value={rule.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder="Nome da regra"
            className={`${inputCls} flex-1 min-w-0 h-8 bg-transparent border-transparent hover:border-slate-700 focus:border-purple-500 font-semibold`}
            aria-label="Nome da regra"
          />
        ) : (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex-1 min-w-0 text-left text-sm font-semibold text-white truncate hover:text-purple-300"
          >
            {rule.name || "Sem nome"}
          </button>
        )}
        <button
          type="button"
          onClick={() => onUpdate({ enabled: rule.enabled === false })}
          title={rule.enabled === false ? "Regra desativada" : "Regra ativa"}
          className={`inline-flex items-center justify-center w-7 h-7 rounded border transition-colors flex-shrink-0 ${
            rule.enabled === false
              ? "bg-slate-800 border-slate-700 text-slate-500"
              : "bg-emerald-950/50 border-emerald-800 text-emerald-300"
          }`}
        >
          <Power className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="inline-flex items-center justify-center w-7 h-7 rounded border border-red-900/60 bg-red-950/30 text-red-400 hover:bg-red-950/60 transition-colors flex-shrink-0"
          aria-label="Remover regra"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Resumo legível quando recolhida — confirma o que a regra faz. */}
      {!open && summary && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full text-left px-3 py-2 hover:bg-slate-900/40 focus:outline-none"
        >
          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className={`uppercase tracking-wide font-bold px-1.5 py-0.5 rounded border ${
              summary.disabled
                ? "text-slate-500 border-slate-700 bg-slate-800/60"
                : "text-indigo-300 border-indigo-800/60 bg-indigo-950/40"
            }`}>
              {summary.trigger}
            </span>
            {summary.effects.length === 0 ? (
              <span className="text-slate-500 italic">sem efeitos</span>
            ) : (
              <span className="text-slate-300">{summary.effects.join(" · ")}</span>
            )}
            {summary.disabled && <span className="text-slate-500 italic">(desativada)</span>}
          </div>
          {summary.requires && (
            <div className="text-[10px] text-amber-400/80 mt-0.5">Só se: <span className="font-mono">{summary.requires}</span></div>
          )}
        </button>
      )}

      {open && (
      <div className="p-3 space-y-3">
        {/* BLOCO: Gatilho */}
        <div className="rounded-md border-l-2 border-indigo-500 bg-indigo-950/20 p-2.5">
          <div className="text-[10px] uppercase tracking-widest font-bold text-indigo-300 mb-1.5">
            Quando (gatilho)
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[180px]">
              <select value={triggerType} onChange={(e) => setTrigger(e.target.value)} className={selectCls} aria-label="Gatilho">
                {TRIGGER_TYPES.map((t) => (
                  <option key={t.key} value={t.key} disabled={!TRIGGER_ENABLED.has(t.key)}>
                    {t.label}{TRIGGER_ENABLED.has(t.key) ? "" : " (em breve)"}
                  </option>
                ))}
              </select>
              <Chevron />
            </div>

            {triggerType === "hp_below" && (
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className="text-[11px] text-slate-400">PV ≤</span>
                <input
                  type="number" min={1} max={100} value={rule.trigger?.threshold ?? 50}
                  onChange={(e) => onUpdate({ trigger: { type: "hp_below", threshold: Math.min(100, Math.max(1, parseInt(e.target.value, 10) || 1)) } })}
                  className={`${inputCls} w-16 text-center`}
                  aria-label="Limiar de PV (%)"
                />
                <span className="text-[11px] text-slate-400">%</span>
              </div>
            )}

            {isActivated && (
              <>
                <div className="relative flex-shrink-0 min-w-[130px]">
                  <select
                    value={rule.activation ?? "toggle"}
                    onChange={(e) => onUpdate({ activation: e.target.value })}
                    className={selectCls} aria-label="Modo de ativação"
                  >
                    {ACTIVATION_MODES.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
                  </select>
                  <Chevron />
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="text-[11px] text-slate-400">Custa</span>
                  <input
                    type="number" min={0} value={rule.cost?.pe ?? 0}
                    onChange={(e) => onUpdate({ cost: { ...rule.cost, pe: Math.max(0, parseInt(e.target.value, 10) || 0) } })}
                    className={`${inputCls} w-14 text-center`}
                    aria-label="Custo em PE"
                  />
                  <span className="text-[11px] text-slate-400">PE</span>
                </div>
                <div className="relative flex-shrink-0 min-w-[140px]">
                  <select
                    value={rule.cost?.acao ?? ""}
                    onChange={(e) => onUpdate({ cost: { ...rule.cost, acao: e.target.value } })}
                    className={selectCls} aria-label="Custo de ação"
                  >
                    {ACTION_COST_TYPES.map((a) => <option key={a.key} value={a.key}>{a.label}</option>)}
                  </select>
                  <Chevron />
                </div>
              </>
            )}
          </div>
          {triggerType === "passive" && (
            <p className="text-[10px] text-slate-500 mt-1.5">Os efeitos valem enquanto a criatura tiver esta habilidade.</p>
          )}
          {triggerType === "hp_below" && (
            <p className="text-[10px] text-slate-500 mt-1.5">Os modificadores aplicam sozinhos quando o PV cai a esse limiar e somem quando sobe. (Use efeitos do tipo atributo/stat — recurso/condição precisam de gatilho Ativado.)</p>
          )}

          {/* Pré-requisito (expressão DSL) — opcional */}
          <div className="mt-2">
            <span className="text-[10px] uppercase tracking-widest font-semibold text-slate-500">Pré-requisito (opcional)</span>
            <ExprInput
              value={rule.requires ?? ""}
              onChange={(v) => onUpdate({ requires: v })}
              placeholder="ex.: dom >= 3  ou  hp_atual < metade(hp_max)"
              className="mt-1"
            />
          </div>
        </div>

        {/* BLOCO: Efeitos */}
        <div className="rounded-md border-l-2 border-emerald-500 bg-emerald-950/15 p-2.5 space-y-2">
          <div className="text-[10px] uppercase tracking-widest font-bold text-emerald-300">
            Faz (efeitos)
          </div>
          {(rule.effects ?? []).map((eff) => (
            <EffectRow
              key={eff.id}
              effect={eff}
              isActivated={isActivated}
              ctx={ctx}
              defaultStack={defaultStack}
              onUpdate={(patch) => onUpdateEffect(eff.id, patch)}
              onReplace={(next) => onUpdateEffect(eff.id, next)}
              onRemove={() => onRemoveEffect(eff.id)}
            />
          ))}
          <button
            type="button"
            onClick={onAddEffect}
            className="flex items-center gap-1.5 text-xs text-emerald-300 hover:text-emerald-200 font-semibold"
          >
            <Plus className="w-3.5 h-3.5" /> Adicionar efeito
          </button>
        </div>
      </div>
      )}
    </div>
  );
}

// Linha de efeito. Dois tipos: `modify_stat` (buff/debuff que vira modificador)
// e `resource` (mexe em PV/PE/Guarda na hora da ativação — instantâneo).
function EffectRow({ effect, isActivated, ctx = null, defaultStack = "sum", onUpdate, onReplace, onRemove }) {
  const KNOWN_EFFECT_TYPES = ["resource", "condition", "action_damage"];
  const type = KNOWN_EFFECT_TYPES.includes(effect.type) ? effect.type : "modify_stat";
  const durKind = effect.duration?.kind ?? "rounds";
  // Prévia do valor da expressão na ficha atual (quando há contexto da DSL).
  const exprResolved = (ctx && effect.valueExpr)
    ? Math.round(evalNumber(effect.valueExpr, ctx, effect.value))
    : null;
  // Modo expressão é estado próprio (não inferido do conteúdo), pra permitir
  // expressão vazia em edição e não "voltar pra fixo" ao apagar o texto.
  const [exprMode, setExprMode] = useState(!!effect.valueExpr);
  const toggleExpr = () => {
    if (exprMode) { onUpdate({ valueExpr: "" }); setExprMode(false); }
    else { setExprMode(true); }
  };
  // Trocar o tipo reseta os campos para os defaults daquele tipo (preserva id)
  // e volta ao modo de valor fixo (o novo efeito não traz expressão).
  const changeType = (t) => {
    if (t === type) return;
    onReplace(newEffect(t, t === "modify_stat" ? { id: effect.id, stack: defaultStack } : { id: effect.id }));
    setExprMode(false);
  };

  const valueField = exprMode ? (
    <ExprInput
      value={effect.valueExpr}
      onChange={(v) => onUpdate({ valueExpr: v })}
      placeholder="ex.: metade(nd)"
      className="flex-1 basis-full sm:basis-auto min-w-[160px]"
    />
  ) : (
    <input
      type="number" value={effect.value}
      onChange={(e) => onUpdate({ value: parseInt(e.target.value, 10) || 0 })}
      className={`${inputCls} w-16 text-center`}
      aria-label="Valor" title="Valor"
    />
  );
  const fxButton = (
    <button
      type="button"
      onClick={toggleExpr}
      className={`inline-flex items-center justify-center w-8 h-9 rounded border flex-shrink-0 transition-colors ${
        exprMode
          ? "bg-emerald-900/50 border-emerald-700 text-emerald-300"
          : "bg-slate-900 border-slate-700 text-slate-400 hover:text-emerald-300"
      }`}
      title={exprMode ? "Usar valor fixo" : "Usar expressão (DSL)"}
    >
      <FunctionSquare className="w-3.5 h-3.5" />
    </button>
  );
  const removeButton = (
    <button
      type="button"
      onClick={onRemove}
      className="ml-auto inline-flex items-center justify-center w-7 h-7 rounded text-slate-500 hover:text-red-400 hover:bg-red-950/40 transition-colors flex-shrink-0"
      aria-label="Remover efeito"
    >
      <Trash2 className="w-3.5 h-3.5" />
    </button>
  );

  // Sinal/valor da prévia, conforme o tipo e a operação.
  const previewSign =
    effect.op === "set" ? "=" :
    effect.op === "subtract" ? "−" :
    (type === "resource" ? "+" : (exprResolved >= 0 ? "+" : ""));
  const previewVal = type === "resource" ? Math.abs(exprResolved ?? 0) : exprResolved;

  return (
    <div className="rounded border border-slate-800 bg-slate-950/50 p-2">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-shrink-0 min-w-[130px]">
          <select value={type} onChange={(e) => changeType(e.target.value)} className={selectCls} aria-label="Tipo de efeito">
            {EFFECT_TYPES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
          </select>
          <Chevron />
        </div>

        {type === "modify_stat" ? (
          <>
            <div className="relative flex-1 min-w-[130px]">
              <select value={effect.stat} onChange={(e) => onUpdate({ stat: e.target.value })} className={selectCls} aria-label="Alvo">
                {MODIFIER_TARGET_GROUPS.map((g) => (
                  <optgroup key={g.label} label={g.label}>
                    {g.items.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
                  </optgroup>
                ))}
              </select>
              <Chevron />
            </div>
            <div className="relative flex-shrink-0">
              <select value={effect.op} onChange={(e) => onUpdate({ op: e.target.value })} className={`${selectCls} w-auto pr-8`} aria-label="Operação">
                {MODIFIER_OPS.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
              </select>
              <Chevron />
            </div>
            {valueField}
            {fxButton}
            <div className="relative flex-shrink-0">
              <select value={effect.stack} onChange={(e) => onUpdate({ stack: e.target.value })} className={`${selectCls} w-auto pr-8`} aria-label="Empilhamento">
                {STACK_MODES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
              <Chevron />
            </div>
            {removeButton}
          </>
        ) : type === "resource" ? (
          <>
            <div className="relative flex-1 min-w-[120px]">
              <select value={effect.resource} onChange={(e) => onUpdate({ resource: e.target.value })} className={selectCls} aria-label="Recurso">
                {RESOURCE_TARGETS.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
              </select>
              <Chevron />
            </div>
            <div className="relative flex-shrink-0">
              <select value={effect.op} onChange={(e) => onUpdate({ op: e.target.value })} className={`${selectCls} w-auto pr-8`} aria-label="Operação">
                {RESOURCE_OPS.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
              </select>
              <Chevron />
            </div>
            {valueField}
            {fxButton}
            {removeButton}
          </>
        ) : type === "action_damage" ? (
          <>
            <div className="relative flex-1 min-w-[150px]">
              <select value={effect.scope ?? "corporal"} onChange={(e) => onUpdate({ scope: e.target.value })} className={selectCls} aria-label="Escopo do dano">
                {ACTION_DAMAGE_SCOPES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
              <Chevron />
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <span className="text-[11px] text-slate-400">{effect.scope === "tecnica" ? "+dados" : "+níveis"}</span>
              <input
                type="number" min={0} value={effect.amount ?? 0}
                onChange={(e) => onUpdate({ amount: Math.max(0, parseInt(e.target.value, 10) || 0) })}
                className={`${inputCls} w-14 text-center`} aria-label="Quantidade"
              />
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <span className="text-[11px] text-slate-400">+fixo</span>
              <input
                type="number" value={effect.fixed ?? 0}
                onChange={(e) => onUpdate({ fixed: parseInt(e.target.value, 10) || 0 })}
                className={`${inputCls} w-14 text-center`} aria-label="Dano fixo"
              />
            </div>
            {removeButton}
          </>
        ) : (
          <>
            <div className="relative flex-shrink-0 min-w-[110px]">
              <select value={effect.op} onChange={(e) => onUpdate({ op: e.target.value })} className={`${selectCls} w-auto pr-8`} aria-label="Operação">
                {CONDITION_OPS.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
              </select>
              <Chevron />
            </div>
            <div className="relative flex-1 min-w-[140px]">
              <select value={effect.condition} onChange={(e) => onUpdate({ condition: e.target.value })} className={selectCls} aria-label="Condição">
                {CONDITION_OPTIONS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
              <Chevron />
            </div>
            {effect.op === "apply" && (
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className="text-[11px] text-slate-500">por</span>
                <input
                  type="number" min={1} value={effect.duration?.rounds ?? 1}
                  onChange={(e) => onUpdate({ duration: { kind: "rounds", rounds: Math.max(1, parseInt(e.target.value, 10) || 1) } })}
                  className={`${inputCls} w-14 text-center`}
                  aria-label="Rodadas"
                />
                <span className="text-[11px] text-slate-500">rod.</span>
              </div>
            )}
            {removeButton}
          </>
        )}
      </div>

      {/* Prévia: valor que a expressão dá na ficha atual (quando há contexto). */}
      {exprMode && exprResolved != null && (
        <div className="text-[10px] text-emerald-400/80 mt-1 pl-1">
          Nesta ficha: <span className="font-mono font-bold">{previewSign}{previewVal}</span>
        </div>
      )}

      {/* Nota de escopo do boost de dano. */}
      {type === "action_damage" && (
        <div className="text-[10px] mt-1 pl-1 text-slate-500">
          {effect.scope === "tecnica"
            ? "Afeta Feitiços: TR, dano na Alma, que causam condição ou Técnica Máxima."
            : "Afeta Testes de Acerto sem condição, sem Técnica Máxima e sem dano na Alma. Cada nível = +1 ND."}
        </div>
      )}

      {/* modify_stat / boost de dano + Ativado: duração (passiva é sempre-ativa). */}
      {(type === "modify_stat" || type === "action_damage") && isActivated && (
        <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-slate-800/60">
          <span className="text-[11px] text-slate-500 flex-shrink-0">Dura</span>
          <div className="relative flex-shrink-0">
            <select
              value={durKind}
              onChange={(e) => onUpdate({ duration: e.target.value === "rounds" ? { kind: "rounds", rounds: effect.duration?.rounds ?? 3 } : { kind: e.target.value } })}
              className={`${selectCls} w-auto pr-8`} aria-label="Tipo de duração"
            >
              {DURATION_KINDS.map((d) => <option key={d.key} value={d.key}>{d.label}</option>)}
            </select>
            <Chevron />
          </div>
          {durKind === "rounds" && (
            <input
              type="number" min={1} value={effect.duration?.rounds ?? 3}
              onChange={(e) => onUpdate({ duration: { kind: "rounds", rounds: Math.max(1, parseInt(e.target.value, 10) || 1) } })}
              className={`${inputCls} w-14 text-center`}
              aria-label="Rodadas"
            />
          )}
        </div>
      )}

      {/* resource/condition: instantâneo; só funciona em gatilho Ativado. */}
      {(type === "resource" || type === "condition") && (
        <div className={`text-[10px] mt-1 pl-1 ${isActivated ? "text-slate-500" : "text-amber-400/90"}`}>
          {isActivated
            ? "Aplica no momento da ativação — não reverte ao desativar."
            : `⚠ Efeito de ${type === "condition" ? "condição" : "recurso"} só é aplicado por gatilho Ativado.`}
        </div>
      )}
    </div>
  );
}
