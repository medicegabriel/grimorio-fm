import React, { useState } from "react";
import { ChevronDown, ChevronUp, Sparkles, Lock, Shapes } from "lucide-react";
import SectionFeatures from "./SectionFeatures";
import SectionCaracteristicas from "./SectionCaracteristicas";

// ============================================================
// CARACTERÍSTICAS (aba unificada)
// ============================================================
// Junta as antigas abas "Características" (catálogo) e "Características
// Personalizadas" (features) em 4 sub-seções empilhadas e recolhíveis:
//   1. Personalizadas  → features criadas pelo usuário (com form)
//   2. de Origem       → features derivadas da Origem (somente leitura)
//   3. Gerais          → catálogo do sistema, categoria Gerais
//   4. Especiais       → catálogo do sistema, categoria Especiais
// ============================================================

function SubSection({ title, icon: Icon, accent = "text-slate-400", defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="border border-slate-800 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-3 py-2.5 bg-slate-900/60 hover:bg-slate-900 transition-colors focus:outline-none focus:ring-1 focus:ring-purple-500/40"
        aria-expanded={open}
      >
        <Icon className={`w-4 h-4 flex-shrink-0 ${accent}`} />
        <span className="flex-1 text-left text-sm font-bold text-slate-200">{title}</span>
        {open
          ? <ChevronUp className="w-4 h-4 text-slate-500 flex-shrink-0" />
          : <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0" />}
      </button>
      {open && <div className="p-3 border-t border-slate-800">{children}</div>}
    </section>
  );
}

export default function SectionCaracteristicasUnified({ draft, actions, dslContext = null }) {
  return (
    <div className="space-y-3">
      <SubSection title="Características Personalizadas" icon={Sparkles} accent="text-fuchsia-400">
        <SectionFeatures draft={draft} actions={actions} sourceFilter="custom" dslContext={dslContext} />
      </SubSection>

      <SubSection title="Características de Origem" icon={Lock} accent="text-purple-400">
        <SectionFeatures draft={draft} actions={actions} sourceFilter="origin" dslContext={dslContext} />
      </SubSection>

      <SubSection title="Características Gerais" icon={Shapes} accent="text-cyan-400">
        <SectionCaracteristicas draft={draft} actions={actions} categoriaKeys={["gerais"]} dslContext={dslContext} />
      </SubSection>

      <SubSection title="Características Especiais" icon={Shapes} accent="text-cyan-400">
        <SectionCaracteristicas draft={draft} actions={actions} categoriaKeys={["especiais"]} dslContext={dslContext} />
      </SubSection>
    </div>
  );
}
