import React, { useState, useEffect, useRef } from "react";
import {
  Save, ChevronLeft, AlertTriangle, Info, RotateCcw, Wand2,
  ChevronDown, ChevronUp, Eye, Sparkles,
} from "lucide-react";

import useCreatureBuilder, { blankDraft } from "./useCreatureBuilder";

import SectionIdentity from "./sections/SectionIdentity";
import SectionCore from "./sections/SectionCore";
import SectionAttributes from "./sections/SectionAttributes";
import SectionDerivedStats from "./sections/SectionDerivedStats";
import SectionAptidoes from "./sections/SectionAptidoes";
import SectionActions from "./sections/SectionActions";
import SectionFeatures from "./sections/SectionFeatures";
import SectionTreinamentos from "./sections/SectionTreinamentos";
import SectionAptidoesEspeciais from "./sections/SectionAptidoesEspeciais";
import SectionDotes from "./sections/SectionDotes";
import SectionDefenses from "./sections/SectionDefenses";
import SectionSkills from "./sections/SectionSkills";
import LivePreview from "./sections/LivePreview";

/**
 * ============================================================
 * CreatureBuilder — Tela principal de criação/edição
 * ============================================================
 * Layout em duas colunas em telas grandes:
 *   - Esquerda (2/3): seções do formulário
 *   - Direita (1/3): preview da ficha em tempo real (sticky)
 *
 * Em telas pequenas, o preview vai para o topo como resumo
 * colapsável.
 * ============================================================
 */

// Seções na ordem natural de preenchimento
const SECTIONS = [
  { id: "identity",    label: "Identidade",           component: SectionIdentity },
  { id: "core",        label: "Patamar & Nível",      component: SectionCore },
  { id: "attributes",  label: "Atributos",            component: SectionAttributes },
  { id: "derived",     label: "Valores Calculados",   component: SectionDerivedStats },
  { id: "aptidoes",    label: "Aptidões",             component: SectionAptidoes },
  { id: "skills",      label: "Perícias",             component: SectionSkills },
  { id: "defenses",    label: "Defesas & Imunidades", component: SectionDefenses },
  { id: "actions",     label: "Ações",                component: SectionActions },
  { id: "features",      label: "Características",      component: SectionFeatures },
  { id: "treinamentos",     label: "Treinamentos",            component: SectionTreinamentos },
  { id: "aptidoesEsp",     label: "Aptidões Amaldiçoadas",  component: SectionAptidoesEspeciais },
  { id: "dotes",           label: "Dotes Gerais",           component: SectionDotes },
];

export default function CreatureBuilder({ existingCreature, onSave, onCancel }) {
  const { draft, derived, warnings, actions, buildCreature } =
    useCreatureBuilder(existingCreature);

  // Hidrata quando recebe ficha existente (evita re-hidratar em cada render)
  useEffect(() => {
    if (existingCreature && existingCreature.id !== draft.id) {
      actions.hydrate(existingCreature);
    }
  }, [existingCreature?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Mede a altura real do header (cresce quando o WarningBar aparece)
  // para que o preview sticky nunca fique atrás dele.
  const headerRef = useRef(null);
  const [headerHeight, setHeaderHeight] = useState(80);
  useEffect(() => {
    if (!headerRef.current) return;
    const obs = new ResizeObserver(() => {
      setHeaderHeight(headerRef.current.offsetHeight);
    });
    obs.observe(headerRef.current);
    setHeaderHeight(headerRef.current.offsetHeight);
    return () => obs.disconnect();
  }, []);

  // Estado de UI: quais seções estão expandidas
  const [openSections, setOpenSections] = useState(() =>
    new Set(SECTIONS.map((s) => s.id)) // todas abertas por padrão
  );
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);

  const toggleSection = (id) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const collapseAll = () => setOpenSections(new Set());
  const expandAll = () => setOpenSections(new Set(SECTIONS.map((s) => s.id)));

  // ---------- Salvar ----------
  const hasErrors = warnings.some((w) => w.severity === "error");

  const handleSave = () => {
    if (hasErrors) return;
    const creature = buildCreature();
    onSave(creature);
  };

  const isEditing = !!existingCreature;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950/30 text-white">
      {/* ========== HEADER FIXO ========== */}
      <header ref={headerRef} className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur border-b border-purple-900/50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={onCancel}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-sm text-slate-300 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Voltar
          </button>

          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Wand2 className="w-5 h-5 text-purple-400 flex-shrink-0" />
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold truncate">
                {isEditing ? "Editar Criatura" : "Nova Criatura"}
              </h1>
              <p className="text-xs text-slate-500">
                {draft.name ? `"${draft.name}"` : "Ficha em branco"}
              </p>
            </div>
          </div>

          {/* Toggles de layout (desktop) */}
          <div className="hidden md:flex items-center gap-1 text-xs text-slate-500">
            <button onClick={collapseAll} className="px-2 py-1 hover:text-white transition-colors">
              Recolher tudo
            </button>
            <span className="text-slate-700">|</span>
            <button onClick={expandAll} className="px-2 py-1 hover:text-white transition-colors">
              Expandir tudo
            </button>
          </div>

          {/* Toggle de preview (mobile) */}
          <button
            onClick={() => setMobilePreviewOpen(!mobilePreviewOpen)}
            className="lg:hidden flex items-center gap-1 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300"
          >
            <Eye className="w-3.5 h-3.5" /> Preview
          </button>

          <button
            onClick={handleSave}
            disabled={hasErrors}
            className={`flex items-center gap-1.5 px-4 py-2 rounded text-sm font-bold transition-colors focus:outline-none focus:ring-2 ${
              hasErrors
                ? "bg-slate-800 text-slate-600 cursor-not-allowed"
                : "bg-purple-700 hover:bg-purple-600 text-white focus:ring-purple-500"
            }`}
            title={hasErrors ? "Corrija os erros para salvar" : "Salvar ficha"}
          >
            <Save className="w-4 h-4" />
            {isEditing ? "Salvar Alterações" : "Criar Ficha"}
          </button>
        </div>

        {/* Barra de warnings/erros */}
        {warnings.length > 0 && (
          <WarningBar warnings={warnings} />
        )}
      </header>

      {/* ========== GRID PRINCIPAL ========== */}
      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* --- Coluna da esquerda: formulário --- */}
        <div className="lg:col-span-2 space-y-4">
          {SECTIONS.map((section) => {
            const SectionComponent = section.component;
            const isOpen = openSections.has(section.id);
            return (
              <SectionWrapper
                key={section.id}
                id={section.id}
                label={section.label}
                isOpen={isOpen}
                onToggle={() => toggleSection(section.id)}
              >
                <SectionComponent
                  draft={draft}
                  derived={derived}
                  actions={actions}
                />
              </SectionWrapper>
            );
          })}
        </div>

        {/* --- Coluna da direita: preview (desktop) --- */}
        <div className="hidden lg:block">
          <div
            className="sticky overflow-y-auto rounded-lg"
            style={{
              top: headerHeight + 8,
              maxHeight: `calc(100vh - ${headerHeight + 16}px)`,
            }}
          >
            <LivePreview draft={draft} derived={derived} />
          </div>
        </div>
      </div>

      {/* Preview mobile (drawer) */}
      {mobilePreviewOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
             onClick={() => setMobilePreviewOpen(false)}>
          <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto bg-slate-950 border-t border-purple-900 rounded-t-xl p-4"
               onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Eye className="w-4 h-4 text-purple-400" /> Preview
              </h3>
              <button onClick={() => setMobilePreviewOpen(false)}
                      className="text-slate-400 hover:text-white">
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>
            <LivePreview draft={draft} derived={derived} />
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Wrapper de seção (collapsible) ----------
function SectionWrapper({ id, label, isOpen, onToggle, children }) {
  return (
    <section
      id={`section-${id}`}
      className="bg-slate-900/60 border border-slate-800 rounded-lg overflow-hidden"
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-3 hover:bg-slate-900 transition-colors text-left focus:outline-none focus:bg-slate-900"
        aria-expanded={isOpen}
      >
        <h2 className="font-bold text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          {label}
        </h2>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-slate-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-500" />
        )}
      </button>
      {isOpen && <div className="px-5 pb-5 pt-1 border-t border-slate-800/50">{children}</div>}
    </section>
  );
}

// ---------- Barra de warnings no header ----------
function WarningBar({ warnings }) {
  const errors = warnings.filter((w) => w.severity === "error");
  const warns = warnings.filter((w) => w.severity === "warn");
  const hasErrors = errors.length > 0;

  const bgColor = hasErrors ? "bg-red-950/60 border-red-900" : "bg-amber-950/60 border-amber-900";
  const textColor = hasErrors ? "text-red-300" : "text-amber-300";
  const icon = hasErrors ? AlertTriangle : Info;
  const Icon = icon;

  return (
    <div className={`${bgColor} border-t px-4 py-2`}>
      <div className="max-w-7xl mx-auto flex items-center gap-2 text-xs">
        <Icon className={`w-3.5 h-3.5 ${textColor} flex-shrink-0`} />
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {(hasErrors ? errors : warns).slice(0, 3).map((w, i) => (
            <span key={i} className={textColor}>
              {w.message}
            </span>
          ))}
          {warnings.length > 3 && (
            <span className="text-slate-500">+{warnings.length - 3} outros</span>
          )}
        </div>
      </div>
    </div>
  );
}
