// AutomationDocsModal.jsx
// ============================================================
// MOTOR DE AUTOMAÇÃO — Fase 3: documentação da DSL (no app)
// ============================================================
// Referência completa da linguagem de expressões + botões de cópia:
// "Copiar prompt" (pronto pra colar numa IA) e "Copiar referência".
// Fonte única dos dados: fm-dsl.js (catálogos). O .md do repositório
// (docs/automacao-dsl.md) espelha o mesmo conteúdo.
// ============================================================

import { useState } from "react";
import { createPortal } from "react-dom";
import { X, Copy, Check, Sparkles } from "lucide-react";
import {
  DSL_VARIABLE_GROUPS, DSL_FUNCTIONS, DSL_OPERATORS, DSL_EXAMPLES,
  dslReferenceMarkdown, dslLlmPrompt,
} from "./fm-dsl";

function CopyButton({ label, getText, accent = "purple" }) {
  const [copied, setCopied] = useState(false);
  const onClick = () => {
    navigator.clipboard?.writeText(getText());
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };
  const cls = accent === "emerald"
    ? "bg-emerald-800 hover:bg-emerald-700 focus:ring-emerald-500"
    : "bg-purple-800 hover:bg-purple-700 focus:ring-purple-500";
  return (
    <button type="button" onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold text-white transition-colors focus:outline-none focus:ring-2 ${cls}`}>
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? "Copiado!" : label}
    </button>
  );
}

const Section = ({ title, children }) => (
  <div className="space-y-1.5">
    <h4 className="text-[10px] uppercase tracking-widest font-bold text-slate-400">{title}</h4>
    {children}
  </div>
);

const Row = ({ code, desc }) => (
  <div className="flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-2">
    <code className="text-xs font-mono text-emerald-300 bg-slate-950/60 rounded px-1.5 py-0.5 whitespace-pre-wrap">{code}</code>
    <span className="text-xs text-slate-400">{desc}</span>
  </div>
);

export default function AutomationDocsModal({ open, onClose }) {
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70" onClick={onClose}>
      <div
        className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-bold text-slate-100">DSL de Automação — Referência</h3>
          <button type="button" onClick={onClose}
            className="ml-auto text-slate-500 hover:text-slate-200 focus:outline-none">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Corpo */}
        <div className="overflow-y-auto p-4 space-y-4">
          <p className="text-xs text-slate-400 leading-relaxed">
            Programe habilidades com expressões em português. Uma expressão sempre resulta num{" "}
            <b className="text-slate-200">número</b> (verdadeiro/falso são 1/0). Use no{" "}
            <b className="text-slate-200">valor</b> de um efeito ou no{" "}
            <b className="text-slate-200">pré-requisito</b> de uma regra.
          </p>

          {DSL_VARIABLE_GROUPS.map((g) => (
            <Section key={g.label} title={`Variáveis · ${g.label}`}>
              {g.items.map(([code, desc]) => <Row key={code} code={code} desc={desc} />)}
            </Section>
          ))}

          <Section title="Funções">
            {DSL_FUNCTIONS.map(([code, desc]) => <Row key={code} code={code} desc={desc} />)}
          </Section>

          <Section title="Operadores">
            {DSL_OPERATORS.map(([code, desc]) => <Row key={code} code={code} desc={desc} />)}
          </Section>

          <Section title="Exemplos">
            {DSL_EXAMPLES.map(([code, desc]) => <Row key={code} code={code} desc={desc} />)}
          </Section>
        </div>

        {/* Rodapé */}
        <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-t border-slate-800">
          <span className="text-[11px] text-slate-500 mr-auto">
            Cole o prompt numa IA, descreva a habilidade, e ela escreve a expressão.
          </span>
          <CopyButton label="Copiar referência" getText={dslReferenceMarkdown} accent="emerald" />
          <CopyButton label="Copiar prompt pra IA" getText={dslLlmPrompt} accent="purple" />
        </div>
      </div>
    </div>,
    document.body
  );
}
