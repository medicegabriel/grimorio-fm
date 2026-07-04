import React, { useState } from "react";
import { BookOpen, Wand2, Shield, Zap, Info } from "lucide-react";
import {
  SUPORTE_OFENSIVO, SUPORTE_DEFENSIVO, SUPORTE_REACOES, SUPORTE_REGRAS,
  SUPORTE_MODES, clampSuporteBt, fmtMetros,
  getSuporteRow, getSuporteBenefits, suporteBenefitDescricao,
} from "../../fm-suporte";

// ============================================================
// PAINEL DE PADRÕES DE SUPORTE — Grimório das Maldições, pg. 28
// ============================================================
// Sempre visível quando o Tipo de Ataque = "suporte". Mostra as tabelas por
// BT (Ofensivo/Defensivo) com a linha do BT da criatura destacada, as reações
// por Treinamento e as regras de PE.
// Uma ação de Suporte escolhe UM benefício: os chips do BT ativo aplicam o
// custo em PE + descrevem aquele único bônus na ação.
// ============================================================

// Config de colunas por modo. Cada coluna: header + acessor da linha.
const COLUMNS = {
  ofensivo: [
    { key: "custoPE",  label: "Custo",     fmt: (r) => `${r.custoPE} PE` },
    { key: "danoFixo", label: "Dano Fixo", fmt: (r) => r.danoFixo },
    { key: "acerto",   label: "Acerto",    fmt: (r) => `+${r.acerto}` },
    { key: "cd",       label: "CD",        fmt: (r) => `+${r.cd}` },
    { key: "alcance",  label: "Alcance",   fmt: (r) => fmtMetros(r.alcance) },
    { key: "area",     label: "Área",      fmt: (r) => fmtMetros(r.area) },
    { key: "vantagem", label: "Vantagem",  fmt: (r) => `${r.vantagem} PE` },
  ],
  defensivo: [
    { key: "custoPE",  label: "Custo",             fmt: (r) => `${r.custoPE} PE` },
    { key: "tr",       label: "TR (especificar)",  fmt: (r) => `+${r.tr}` },
    { key: "defesa",   label: "Defesa",            fmt: (r) => `+${r.defesa}` },
    { key: "pericias", label: "Perícias",          fmt: (r) => `+${r.pericias}` },
    { key: "vantagem", label: "Vantagem",          fmt: (r) => `${r.vantagem} PE` },
  ],
};

function StandardsTable({ mode, activeBt }) {
  const table = mode === "defensivo" ? SUPORTE_DEFENSIVO : SUPORTE_OFENSIVO;
  const cols = COLUMNS[mode];
  const rows = [2, 3, 4, 5, 6];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[11px] border-collapse">
        <thead>
          <tr className="text-slate-500 uppercase tracking-wider">
            <th className="text-left font-bold px-2 py-1">BT</th>
            {cols.map((c) => (
              <th key={c.key} className="text-left font-bold px-2 py-1 whitespace-nowrap">{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody className="font-mono">
          {rows.map((bt) => {
            const r = table[bt];
            const active = bt === activeBt;
            return (
              <tr
                key={bt}
                className={active
                  ? "bg-purple-900/40 text-purple-100 ring-1 ring-purple-700/60"
                  : "text-slate-300 odd:bg-slate-900/40"}
              >
                <td className="px-2 py-1 font-bold whitespace-nowrap">
                  +{bt}{active && <span className="ml-1 text-[9px] text-purple-300">◄ seu BT</span>}
                </td>
                {cols.map((c) => (
                  <td key={c.key} className="px-2 py-1 whitespace-nowrap">{c.fmt(r)}</td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function SuporteStandardsPanel({ bt = 2, onApply }) {
  const [mode, setMode] = useState("ofensivo");
  const activeBt = clampSuporteBt(bt);
  const row = getSuporteRow(mode, activeBt);
  const benefits = getSuporteBenefits(mode, activeBt);

  const handlePick = (benefit) => {
    onApply?.({
      cost: row.custoPE,
      descricao: suporteBenefitDescricao(mode, activeBt, benefit),
      auto: benefit.auto,
      ruleName: `Suporte: ${benefit.label}`,
    });
  };

  return (
    <div className="bg-slate-950/60 border border-purple-900/40 rounded p-3 space-y-3">
      {/* Cabeçalho */}
      <div className="flex items-center gap-2 flex-wrap">
        <BookOpen className="w-3.5 h-3.5 text-purple-400" />
        <span className="text-xs font-semibold text-purple-200">Padrões de Suporte</span>
        <span className="text-[10px] text-slate-500">(BT +{activeBt} · pg. 28)</span>
        <span className="text-[10px] text-slate-500 ml-auto">Escolha só 1 benefício por ação</span>
      </div>

      {/* Toggle de modo */}
      <div className="flex gap-2">
        {SUPORTE_MODES.map((m) => {
          const on = mode === m.value;
          const Icon = m.value === "defensivo" ? Shield : Wand2;
          return (
            <button
              key={m.value}
              type="button"
              onClick={() => setMode(m.value)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded text-xs font-semibold transition-colors border focus:outline-none ${
                on
                  ? "bg-purple-900/60 border-purple-700 text-purple-200"
                  : "bg-slate-950 border-slate-700 text-slate-400 hover:text-white hover:border-slate-600"
              }`}
            >
              <Icon className="w-3.5 h-3.5" /> {m.label}
            </button>
          );
        })}
      </div>

      <StandardsTable mode={mode} activeBt={activeBt} />

      {/* Escolha do benefício (aplica custo + descrição) */}
      {onApply && (
        <div className="space-y-1.5">
          <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
            Aplicar 1 benefício do BT +{activeBt} <span className="text-purple-300 normal-case tracking-normal">(gasta {row.custoPE} PE)</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {benefits.map((b) => (
              <button
                key={b.key}
                type="button"
                onClick={() => handlePick(b)}
                title={b.auto
                  ? `Custo ${row.custoPE} PE · concede ${b.efeito} · cria a automação`
                  : `Custo ${row.custoPE} PE · concede ${b.efeito}`}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold text-slate-200 bg-slate-900 border border-slate-700 hover:bg-purple-900/50 hover:border-purple-700 hover:text-white transition-colors focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                <Zap className={`w-3 h-3 ${b.auto ? "text-emerald-400" : "text-slate-600"}`} />
                {b.label}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-slate-500">
            Clicar define o Custo em PE e descreve o bônus no Texto Narrativo. <span className="text-emerald-400">⚡ verde</span> também cria a automação. Para conceder Vantagem, some +{row.vantagem} PE.
          </p>
        </div>
      )}

      {/* Reações por Treinamento */}
      <div className="space-y-1">
        <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
          Reações por Treinamento <span className="text-slate-600 normal-case tracking-normal">(custo de PE = BT)</span>
        </div>
        <ul className="space-y-0.5">
          {SUPORTE_REACOES.map((r) => (
            <li key={r.bt} className="flex items-start gap-2 text-[11px] text-slate-300">
              <span className="font-mono font-bold text-purple-300 shrink-0">+{r.bt}</span>
              <span>{r.texto}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Regras de PE */}
      <div className="bg-blue-950/30 border border-blue-900/40 rounded p-2.5 space-y-1">
        {SUPORTE_REGRAS.map((regra, i) => (
          <div key={i} className="flex items-start gap-2 text-blue-300">
            <Info className="w-3 h-3 mt-[3px] flex-shrink-0 text-blue-400" />
            <span className="text-[11px] leading-snug">{regra}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
