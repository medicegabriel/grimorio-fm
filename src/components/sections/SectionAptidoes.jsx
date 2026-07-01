// sections/SectionAptidoes.jsx
import React, { useMemo } from "react";
import { Zap } from "lucide-react";
import { FieldLabel, NumberInput } from "../builder-controls";
import { getFrutosAptidaoBonus, isRestritoCeleste } from "../fm-origens";
import {
  getBarreiraAptidaoBonus,
  getCompreensaoAptidaoBudgetBonus,
} from "../fm-treinamentos";
import { getDotesAptidaoBudgetBonus } from "../fm-dotes";

// ============================================================
// DICIONÁRIO DE APTIDÕES (regra de ouro #1)
// ============================================================
const APTIDAO_LIST = [
  { key: "au",  label: "Aura",                short: "AU",  accent: "bg-purple-900/30 border-purple-800" },
  { key: "cl",  label: "Controle e Leitura",  short: "CL",  accent: "bg-sky-900/30 border-sky-800" },
  { key: "bar", label: "Barreira",            short: "BAR", accent: "bg-amber-900/30 border-amber-800" },
  { key: "dom", label: "Domínio",             short: "DOM", accent: "bg-rose-900/30 border-rose-800" },
  { key: "er",  label: "Energia Reversa",     short: "ER",  accent: "bg-emerald-900/30 border-emerald-800" },
];

const APTIDAO_MAX_PER_SLOT = 5;

// ============================================================
// FUNÇÃO PURA DE LIMITE (regra de ouro #2)
// ============================================================
// Regra do PDF: 1 ponto de aptidão a cada 2 NDs.
// ND 1 → 0, ND 2 → 1, ND 3 → 1, ND 4 → 2, ... ND 30 → 15.
// EXT: se mudar a regra (ex: ND 0 = 1 ponto bônus, ou patamar altera divisor),
// é só ajustar aqui — resto do componente continua intacto.
const calculateAptidoesBudget = (nd) => {
  const n = Number(nd) || 0;
  return Math.max(0, Math.floor(n / 2));
};

// ============================================================
// DICIONÁRIO DE TEMAS DO INDICADOR
// ============================================================
const BUDGET_THEME = {
  ok:   { bg: "bg-emerald-950/60", border: "border-emerald-800/60", text: "text-emerald-300", label: "exato" },
  warn: { bg: "bg-amber-950/60",   border: "border-amber-800/60",   text: "text-amber-300",   label: "disponível" },
  over: { bg: "bg-red-950/60",     border: "border-red-800/60",     text: "text-red-300",     label: "excedido" },
  idle: { bg: "bg-slate-900/60",   border: "border-slate-800",      text: "text-slate-400",   label: "sem orçamento" },
  nolimit: { bg: "bg-amber-950/40", border: "border-amber-800/50",  text: "text-amber-300",   label: "sem limites" },
};

const getBudgetKey = ({ budget, spent }) => {
  if (budget === 0) return "idle";
  if (spent > budget) return "over";
  if (spent === budget) return "ok";
  return "warn";
};

// ============================================================
// COMPONENTE
// ============================================================
export default function SectionAptidoes({ draft, actions }) {
  const noLimits = !!draft.core?.semLimites;
  // Teto por slot: 5 normalmente; livre no modo Sem Limites.
  const slotMax = noLimits ? 99 : APTIDAO_MAX_PER_SLOT;

  // Derivações memoizadas
  // O bônus de Compreensão soma ao orçamento total (pode gastar onde quiser).
  // O bônus de Barreira é EXTRA: não consome ponto do orçamento, só aparece
  // como nível efetivo a mais no slot BAR.
  const {
    budget, baseBudget, frutosBonus, compreensaoBonus, estudoBonus, barreiraBonus,
    spent, remaining, budgetKey, theme,
  } = useMemo(() => {
    // Restrito Celeste (Restringido puro) não tem acesso a Aptidões — orçamento
    // zerado. A Restrição de Corpo por Energia recebe normalmente.
    const restrito = isRestritoCeleste(draft.core);
    const base = restrito ? 0 : calculateAptidoesBudget(draft.core?.nd);
    const frutos = restrito ? 0 : getFrutosAptidaoBonus(draft.core);
    const compreensao = restrito ? 0 : getCompreensaoAptidaoBudgetBonus(draft.treinamentos);
    const barreira = restrito ? 0 : getBarreiraAptidaoBonus(draft.treinamentos);
    const estudo = restrito ? 0 : getDotesAptidaoBudgetBonus(draft.dotes);
    const b = base + frutos + compreensao + estudo;
    const s = Object.values(draft.aptidoes ?? {}).reduce((sum, v) => sum + (Number(v) || 0), 0);
    const r = b - s;
    const key = noLimits ? "nolimit" : getBudgetKey({ budget: b, spent: s });
    return {
      budget: b,
      baseBudget: base,
      frutosBonus: frutos,
      compreensaoBonus: compreensao,
      estudoBonus: estudo,
      barreiraBonus: barreira,
      spent: s,
      remaining: r,
      budgetKey: key,
      theme: BUDGET_THEME[key],
    };
  }, [draft.core, draft.aptidoes, draft.treinamentos, draft.dotes]);

  // Handler de mudança com clamp defensivo.
  // Não bloqueia digitar valores acima do orçamento (warning não-bloqueante,
  // conforme filosofia do validateDraft), só garante o range 0-10 individual.
  const handleChange = (key, newValue) => {
    const clamped = Math.max(0, Math.min(slotMax, Number(newValue) || 0));
    actions.setAptidao(key, clamped);
  };

  // Barra de progresso proporcional — capada em 100% mesmo quando estourou,
  // para não fazer a barra sangrar fora do container.
  const progressPct = budget > 0
    ? Math.min(100, (spent / budget) * 100)
    : 0;

  return (
    <div className="space-y-3">
      {/* ===== INDICADOR DE ORÇAMENTO ===== */}
      <div className={`rounded-lg border p-3 ${theme.bg} ${theme.border}`}>
        <div className="flex items-center justify-between gap-3 flex-wrap mb-2">
          <div className="flex items-center gap-2">
            <span className={`text-2xl font-bold tabular-nums ${theme.text}`}>
              {spent}
            </span>
            <span className="text-slate-500 text-sm">/</span>
            <span className="text-slate-400 text-lg tabular-nums">{budget}</span>
            <span className="text-[10px] uppercase tracking-wider text-slate-500 ml-1">
              pontos gastos
            </span>
          </div>

          <div className={`text-[10px] uppercase tracking-wider font-bold ${theme.text}`}>
            {budgetKey === "over" && `Excedeu em ${Math.abs(remaining)}`}
            {budgetKey === "ok" && "Limite exato"}
            {budgetKey === "warn" && `${remaining} disponível(is)`}
            {budgetKey === "nolimit" && "Sem Limites ativo"}
            {budgetKey === "idle" &&
              (isRestritoCeleste(draft.core)
                ? "Restrito Celeste não recebe Aptidões"
                : "ND muito baixo para aptidões")}
          </div>
        </div>

        {/* Barra de progresso */}
        {budget > 0 && (
          <div className="h-1.5 bg-slate-950/60 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                budgetKey === "over"
                  ? "bg-red-500"
                  : budgetKey === "ok"
                    ? "bg-emerald-500"
                    : "bg-amber-500"
              }`}
              style={{ width: `${progressPct}%` }}
              role="progressbar"
              aria-valuenow={spent}
              aria-valuemin={0}
              aria-valuemax={budget}
              aria-label="Progresso do orçamento de aptidões"
            />
          </div>
        )}

        <p className="text-[10px] text-slate-500 mt-2">
          Regra: 1 ponto de Aptidão a cada 2 NDs · Criatura ND {draft.core?.nd ?? "?"} tem {baseBudget} ponto(s)
          {frutosBonus > 0 && (
            <>
              {" "}+ <span className="text-amber-300">{frutosBonus}</span>
              <span className="text-amber-400/80"> por Frutos da Experiência</span>
            </>
          )}
          {compreensaoBonus > 0 && (
            <>
              {" "}+ <span className="text-emerald-300">{compreensaoBonus}</span>
              <span className="text-emerald-400/80"> por Treino de Compreensão</span>
            </>
          )}
          {estudoBonus > 0 && (
            <>
              {" "}+ <span className="text-amber-300">{estudoBonus}</span>
              <span className="text-amber-400/80"> por Estudo Amaldiçoado</span>
            </>
          )}
          {(frutosBonus > 0 || compreensaoBonus > 0 || estudoBonus > 0) && (
            <>
              {" "}= <strong className="text-slate-300">{budget}</strong>
            </>
          )}
          .
        </p>
      </div>

      {/* ===== GRID DE APTIDÕES ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
        {APTIDAO_LIST.map(({ key, label, short, accent }) => {
          const current = draft.aptidoes?.[key] ?? 0;
          const rawBonus = key === "bar" ? barreiraBonus : 0;
          // Cap absoluto: o bônus do treino nunca pode levar o slot acima
          // do limite individual (5). Quando o input já atingiu o cap, o
          // bônus é "desperdiçado" — mostramos isso explicitamente.
          const effective = Math.min(current + rawBonus, slotMax);
          const appliedBonus = effective - current;
          const wastedBonus = rawBonus - appliedBonus;

          // Destaque visual sutil quando o slot está em uso
          const hasValue = effective > 0;

          return (
            <div
              key={key}
              className={`border rounded p-2.5 transition-opacity ${accent} ${
                hasValue ? "" : "opacity-90"
              }`}
            >
              <FieldLabel>
                {short}
                <span className="text-slate-500 ml-1 font-normal">{label}</span>
                {appliedBonus > 0 && (
                  <span
                    className="inline-flex items-center gap-0.5 ml-1.5 text-[9px] uppercase tracking-wide text-amber-300 border border-amber-700/60 rounded px-1 py-0.5"
                    title="Bônus automático do Treino de Barreira (limitado pelo cap 5)"
                  >
                    <Zap className="w-2.5 h-2.5" /> +{appliedBonus} auto
                  </span>
                )}
              </FieldLabel>
              <NumberInput
                value={current}
                onChange={(v) => handleChange(key, v)}
                min={0}
                max={slotMax}
              />
              {appliedBonus > 0 && (
                <p className="text-[10px] text-amber-300/80 mt-1 font-mono">
                  Nível efetivo: {effective}
                </p>
              )}
              {wastedBonus > 0 && (
                <p className="text-[10px] text-slate-500 mt-1 italic">
                  Limite {APTIDAO_MAX_PER_SLOT} atingido: bônus do treino sem efeito.
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* ===== DICA QUANDO EXCEDEU ===== */}
      {budgetKey === "over" && (
        <p className="text-[11px] text-red-400/90 leading-relaxed">
          Essa criatura tem mais pontos de aptidão do que o sistema base permite.
          Pode ser intencional (criaturas especiais/únicas), mas o sistema vai sinalizar isso como um warning na ficha.
        </p>
      )}
    </div>
  );
}