import React, { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  Save, ChevronLeft, AlertTriangle, Info, RotateCcw, Wand2,
  ChevronDown, ChevronUp, Eye, Sparkles, X, List,
} from "lucide-react";

import useCreatureBuilder from "./useCreatureBuilder";

import SectionIdentity from "./sections/SectionIdentity";
import SectionCore from "./sections/SectionCore";
import SectionAttributes from "./sections/SectionAttributes";
import SectionDerivedStats from "./sections/SectionDerivedStats";
import SectionAptidoes from "./sections/SectionAptidoes";
import SectionActions from "./sections/actions/SectionActions";
import SectionFeatures from "./sections/SectionFeatures";
import SectionTreinamentos from "./sections/SectionTreinamentos";
import SectionAptidoesEspeciais from "./sections/SectionAptidoesEspeciais";
import SectionDotes from "./sections/SectionDotes";
import SectionArtimanhas from "./sections/SectionArtimanhas";
import SectionDefenses from "./sections/SectionDefenses";
import SectionSkills from "./sections/SectionSkills";
import LivePreview from "./sections/LivePreview";
import { isNaoFeiticeiro } from "./fm-origens";

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

// Seções na ordem natural de preenchimento (id + rótulo).
// `visibleWhen` (opcional) controla se a seção aparece no builder/índice.
// Os elementos em si são montados/memoizados dentro do CreatureBuilder.
const ALL_SECTIONS = [
  { id: "identity",     label: "Identidade" },
  { id: "core",         label: "Patamar & Nível" },
  { id: "attributes",   label: "Atributos" },
  { id: "derived",      label: "Valores Calculados" },
  { id: "aptidoes",     label: "Aptidões" },
  { id: "skills",       label: "Perícias" },
  { id: "defenses",     label: "Defesas & Imunidades" },
  { id: "actions",      label: "Ações" },
  { id: "features",     label: "Características" },
  { id: "treinamentos", label: "Treinamentos" },
  { id: "aptidoesEsp",  label: "Aptidões Amaldiçoadas" },
  { id: "dotes",        label: "Dotes Gerais" },
  { id: "artimanhas",   label: "Artimanhas", visibleWhen: (draft) => isNaoFeiticeiro(draft.core?.origin) },
];

// Mapeia o campo de um warning (validateDraft) para o id da seção.
const WARNING_FIELD_TO_SECTION = {
  name: "identity",
  attributes: "attributes",
  skills: "skills",
};
const sectionOfWarning = (field) => {
  const root = String(field || "").split(".")[0];
  return WARNING_FIELD_TO_SECTION[root] ?? null;
};

// Chave de autosave do rascunho — uma por alvo (id da criatura ou "new").
const DRAFT_KEY_PREFIX = "fm_builder_draft_v1:";
const draftKeyFor = (id) => DRAFT_KEY_PREFIX + (id ?? "new");

const formatSavedAt = (ts) => {
  try {
    return new Date(ts).toLocaleString("pt-BR", {
      day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return "";
  }
};

export default function CreatureBuilder({ existingCreature, onSave, onCancel }) {
  const { draft, derived, warnings, actions, buildCreature } =
    useCreatureBuilder(existingCreature);

  // Hidrata quando recebe ficha existente (evita re-hidratar em cada render)
  useEffect(() => {
    if (existingCreature && existingCreature.id !== draft.id) {
      actions.hydrate(existingCreature);
    }
  }, [existingCreature?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------- Autosave do rascunho ----------
  const draftKey = useMemo(
    () => draftKeyFor(existingCreature?.id),
    [existingCreature?.id]
  );

  // Snapshot do draft inicial — base para detectar alterações não salvas.
  // useState com inicializador lazy: capturado uma única vez, na montagem.
  const [initialSnapshot] = useState(() => JSON.stringify(draft));
  const hasUnsavedChanges = useMemo(
    () => JSON.stringify(draft) !== initialSnapshot,
    [draft, initialSnapshot]
  );

  // Rascunho recuperável: lido do localStorage na montagem (init lazy).
  // Só conta como recuperável se diferir do estado inicial da ficha.
  const [recoverable, setRecoverable] = useState(() => {
    try {
      const raw = localStorage.getItem(draftKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed?.draft && JSON.stringify(parsed.draft) !== initialSnapshot) {
        return { savedAt: parsed.savedAt, draft: parsed.draft };
      }
    } catch { /* localStorage indisponível — ignora */ }
    return null;
  });

  // O banner de restauração só faz sentido enquanto a ficha não foi editada
  // (depois disso o autosave já sobrescreveu o rascunho antigo).
  const showRecovery = recoverable && !hasUnsavedChanges;

  // Autosave com debounce. Só grava quando há alterações, para não
  // sobrescrever um rascunho recuperável antes de o usuário tratá-lo.
  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(
          draftKey,
          JSON.stringify({ savedAt: Date.now(), draft })
        );
      } catch { /* quota / modo privado — falha silenciosa */ }
    }, 800);
    return () => clearTimeout(t);
  }, [draft, hasUnsavedChanges, draftKey]);

  // Aviso nativo ao fechar/recarregar a aba com alterações não salvas.
  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasUnsavedChanges]);

  const clearAutosave = () => {
    try { localStorage.removeItem(draftKey); } catch { /* ignora */ }
  };

  const restoreDraft = () => {
    if (recoverable) actions.hydrate(recoverable.draft);
    setRecoverable(null);
  };

  const discardRecoverable = () => {
    clearAutosave();
    setRecoverable(null);
  };

  // Mede a altura real do header (cresce quando o WarningBar aparece)
  // para que o preview sticky nunca fique atrás dele.
  const headerRef = useRef(null);
  const [headerHeight, setHeaderHeight] = useState(80);
  useEffect(() => {
    if (!headerRef.current) return;
    const obs = new ResizeObserver(() => {
      if (!headerRef.current) return;
      setHeaderHeight(headerRef.current.offsetHeight);
    });
    obs.observe(headerRef.current);
    setHeaderHeight(headerRef.current.offsetHeight);
    return () => obs.disconnect();
  }, []);

  // Seções visíveis dado o estado atual do draft (esconde, ex., Artimanhas
  // quando origem não é Não-Feiticeiro).
  const SECTIONS = useMemo(
    () => ALL_SECTIONS.filter((s) => !s.visibleWhen || s.visibleWhen(draft)),
    [draft]
  );

  // Estado de UI: quais seções estão expandidas
  const [openSections, setOpenSections] = useState(() =>
    new Set(ALL_SECTIONS.map((s) => s.id)) // todas abertas por padrão
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

  // Abre a seção (se fechada) e rola até ela, compensando o header fixo.
  const goToSection = (id) => {
    if (!id) return;
    setOpenSections((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
    requestAnimationFrame(() => {
      const el = document.getElementById(`section-${id}`);
      if (!el) return;
      const top = el.getBoundingClientRect().top + window.scrollY - headerHeight - 8;
      window.scrollTo({ top, behavior: "smooth" });
    });
  };

  // Severidade do warning mais grave de cada seção (para marcadores no índice).
  const warningSections = useMemo(() => {
    const map = {};
    for (const w of warnings) {
      const id = sectionOfWarning(w.field);
      if (!id) continue;
      if (w.severity === "error" || !map[id]) map[id] = w.severity;
    }
    return map;
  }, [warnings]);

  const isEditing = !!existingCreature;

  // ---------- Salvar ----------
  const hasErrors = warnings.some((w) => w.severity === "error");
  const errorList = warnings.filter((w) => w.severity === "error");
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  // Com erros (inclusive ao criar): abre o modal listando-os, com a opção
  // "Salvar Mesmo Assim". Sem erros: salva direto.
  const handleSave = () => {
    if (hasErrors) {
      setShowSaveConfirm(true);
      return;
    }
    clearAutosave();
    onSave(buildCreature());
  };

  const forceSave = () => {
    setShowSaveConfirm(false);
    clearAutosave();
    onSave(buildCreature());
  };

  // Voltar: se há alterações não salvas, abre o modal de confirmação.
  const handleCancel = () => {
    if (hasUnsavedChanges) {
      setShowLeaveConfirm(true);
      return;
    }
    onCancel();
  };

  // Confirmou a saída: persiste o rascunho (para poder restaurá-lo) e sai.
  const confirmLeave = () => {
    setShowLeaveConfirm(false);
    try {
      localStorage.setItem(
        draftKey,
        JSON.stringify({ savedAt: Date.now(), draft })
      );
    } catch { /* ignora */ }
    onCancel();
  };

  // ---------- Seções memoizadas por fatia do draft ----------
  // O objeto `draft` é recriado a cada dispatch, mas suas fatias aninhadas
  // (core, attributes, skills, ...) mantêm a referência quando não mudam.
  // Memoizar o elemento de cada seção pelas fatias que ela de fato usa faz
  // o React reaproveitar o elemento e pular a re-renderização das seções
  // não afetadas — digitar no nome deixa de re-renderizar as 12 seções.
  //
  // exhaustive-deps fica desligado de propósito no bloco abaixo: depender de
  // `draft` inteiro (em vez das fatias) anularia a memoização, já que o
  // objeto `draft` é recriado a cada dispatch.
  /* eslint-disable react-hooks/exhaustive-deps */
  const identityEl = useMemo(
    () => <SectionIdentity draft={draft} actions={actions} />,
    [draft.name, draft.portraitUrl, draft.portraitFocus, draft.narratorNotes, actions]
  );
  const coreEl = useMemo(
    () => <SectionCore draft={draft} derived={derived} actions={actions} />,
    [draft.core, draft.artimanhas, derived, actions]
  );
  const attributesEl = useMemo(
    () => <SectionAttributes draft={draft} derived={derived} actions={actions} />,
    [draft.attributes, derived, actions]
  );
  const derivedEl = useMemo(
    () => <SectionDerivedStats draft={draft} derived={derived} actions={actions} />,
    [draft.overrides, draft.attributes, draft.attackAttr, draft.cdAttr, derived, actions]
  );
  const aptidoesEl = useMemo(
    () => <SectionAptidoes draft={draft} actions={actions} />,
    [draft.core, draft.aptidoes, actions]
  );
  const skillsEl = useMemo(
    () => <SectionSkills draft={draft} derived={derived} actions={actions} />,
    [draft.skills, derived, actions]
  );
  const defensesEl = useMemo(
    () => <SectionDefenses draft={draft} actions={actions} />,
    [draft.defenses, draft.core, actions]
  );
  const actionsEl = useMemo(
    () => <SectionActions draft={draft} derived={derived} actions={actions} />,
    [draft.core, draft.actions, draft.name, derived, actions]
  );
  const featuresEl = useMemo(
    () => <SectionFeatures draft={draft} actions={actions} />,
    [draft.features, draft.core, actions]
  );
  const treinamentosEl = useMemo(
    () => <SectionTreinamentos draft={draft} actions={actions} />,
    [draft.core, draft.treinamentos, actions]
  );
  const aptidoesEspEl = useMemo(
    () => <SectionAptidoesEspeciais draft={draft} actions={actions} />,
    [draft.aptidoesEspeciais, actions]
  );
  const dotesEl = useMemo(
    () => <SectionDotes draft={draft} actions={actions} />,
    [draft.dotes, actions]
  );
  const artimanhasEl = useMemo(
    () => <SectionArtimanhas draft={draft} actions={actions} />,
    [draft.core, draft.artimanhas, actions]
  );
  /* eslint-enable react-hooks/exhaustive-deps */

  const sectionEls = {
    identity:     identityEl,
    core:         coreEl,
    attributes:   attributesEl,
    derived:      derivedEl,
    aptidoes:     aptidoesEl,
    skills:       skillsEl,
    defenses:     defensesEl,
    actions:      actionsEl,
    features:     featuresEl,
    treinamentos: treinamentosEl,
    aptidoesEsp:  aptidoesEspEl,
    dotes:        dotesEl,
    artimanhas:   artimanhasEl,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950/30 text-white">
      {/* ========== HEADER FIXO ========== */}
      <header ref={headerRef} className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur border-b border-purple-900/50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={handleCancel}
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

          {/* Índice + toggles de layout (desktop) */}
          <div className="hidden md:flex items-center gap-1 text-xs text-slate-500">
            <SectionIndex
              sections={SECTIONS}
              warningSections={warningSections}
              onJump={goToSection}
            />
            <span className="text-slate-700">|</span>
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
            className="flex items-center gap-1.5 px-4 py-2 rounded text-sm font-bold transition-colors focus:outline-none focus:ring-2 bg-purple-700 hover:bg-purple-600 text-white focus:ring-purple-500"
            title="Salvar ficha"
          >
            <Save className="w-4 h-4" />
            {isEditing ? "Salvar Alterações" : "Criar Ficha"}
          </button>
        </div>

        {/* Barra de warnings/erros */}
        {warnings.length > 0 && (
          <WarningBar warnings={warnings} onWarningClick={goToSection} />
        )}
      </header>

      {/* ========== BANNER DE RASCUNHO RECUPERÁVEL ========== */}
      {showRecovery && (
        <div className="bg-sky-950/70 border-b border-sky-900">
          <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center gap-3 text-sm">
            <RotateCcw className="w-4 h-4 text-sky-400 flex-shrink-0" />
            <span className="flex-1 min-w-0 text-sky-200">
              Rascunho não salvo encontrado
              {recoverable.savedAt && (
                <span className="text-sky-400/70"> · {formatSavedAt(recoverable.savedAt)}</span>
              )}
            </span>
            <button
              onClick={restoreDraft}
              className="px-3 py-1 rounded bg-sky-700 hover:bg-sky-600 text-white text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              Restaurar
            </button>
            <button
              onClick={discardRecoverable}
              className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500"
            >
              Descartar
            </button>
          </div>
        </div>
      )}

      {/* ========== GRID PRINCIPAL ========== */}
      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* --- Coluna da esquerda: formulário --- */}
        <div className="lg:col-span-2 space-y-4">
          {SECTIONS.map((section) => (
            <SectionWrapper
              key={section.id}
              id={section.id}
              label={section.label}
              isOpen={openSections.has(section.id)}
              onToggle={() => toggleSection(section.id)}
            >
              {sectionEls[section.id]}
            </SectionWrapper>
          ))}
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

      {/* Modal de confirmação — salvar com erros (apenas no modo edição) */}
      {showSaveConfirm && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4"
          onClick={() => setShowSaveConfirm(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="save-confirm-title"
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-lg max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start gap-3 p-5 pb-4 border-b border-slate-800">
              <div className="w-10 h-10 rounded-full border border-red-800/60 bg-red-950/60 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 id="save-confirm-title" className="text-base font-bold text-white">
                  Salvar com erros?
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  A ficha possui {errorList.length} erro(s) de validação. Salvar assim pode gerar valores inconsistentes.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSaveConfirm(false)}
                className="text-slate-500 hover:text-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-slate-600 flex-shrink-0"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Lista de erros */}
            <div className="p-4 space-y-2 overflow-y-auto max-h-52">
              {errorList.map((w, i) => (
                <div key={i} className="flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                  <span className="text-xs text-red-300 leading-relaxed">{w.message}</span>
                </div>
              ))}
            </div>

            {/* Botões */}
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 p-4 pt-0">
              <button
                type="button"
                onClick={() => setShowSaveConfirm(false)}
                className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-sm font-semibold text-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500"
              >
                Corrigir
              </button>
              <button
                type="button"
                onClick={forceSave}
                className="px-4 py-2 rounded bg-red-800 hover:bg-red-700 text-sm font-semibold text-white transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Salvar Mesmo Assim
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal de confirmação — sair com alterações não salvas */}
      {showLeaveConfirm && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4"
          onClick={() => setShowLeaveConfirm(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="leave-confirm-title"
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-lg max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 p-5 pb-4 border-b border-slate-800">
              <div className="w-10 h-10 rounded-full border border-amber-800/60 bg-amber-950/60 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 id="leave-confirm-title" className="text-base font-bold text-white">
                  Sair sem salvar?
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  Há alterações não salvas nesta ficha. O rascunho fica guardado — você poderá restaurá-lo ao reabrir o construtor.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowLeaveConfirm(false)}
                className="text-slate-500 hover:text-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-slate-600 flex-shrink-0"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 p-4">
              <button
                type="button"
                onClick={() => setShowLeaveConfirm(false)}
                className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-sm font-semibold text-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500"
              >
                Continuar editando
              </button>
              <button
                type="button"
                onClick={confirmLeave}
                className="px-4 py-2 rounded bg-amber-700 hover:bg-amber-600 text-sm font-semibold text-white transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                Sair mesmo assim
              </button>
            </div>
          </div>
        </div>,
        document.body
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
        <h2 className="font-bold !text-slate-100 flex items-center gap-2">
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

// ---------- Índice de seções (dropdown de navegação) ----------
function SectionIndex({ sections, warningSections, onJump }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 px-2 py-1 rounded hover:text-white hover:bg-slate-800 transition-colors focus:outline-none focus:ring-1 focus:ring-purple-500"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <List className="w-3.5 h-3.5" /> Índice
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            role="menu"
            className="absolute right-0 mt-1 z-50 w-56 max-h-[70vh] overflow-y-auto bg-slate-900 border border-slate-700 rounded-lg shadow-2xl py-1"
          >
            {sections.map((s) => {
              const mark = warningSections[s.id];
              return (
                <button
                  key={s.id}
                  type="button"
                  role="menuitem"
                  onClick={() => { onJump(s.id); setOpen(false); }}
                  className="w-full flex items-center justify-between gap-2 px-3 py-1.5 text-left text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors focus:outline-none focus:bg-slate-800"
                >
                  <span className="truncate">{s.label}</span>
                  {mark && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                        mark === "error" ? "bg-red-400" : "bg-amber-400"
                      }`}
                      title={mark === "error" ? "Possui erro" : "Possui aviso"}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ---------- Barra de warnings no header ----------
function WarningBar({ warnings, onWarningClick }) {
  const errors = warnings.filter((w) => w.severity === "error");
  const warns = warnings.filter((w) => w.severity === "warn");
  const hasErrors = errors.length > 0;

  const bgColor = hasErrors ? "bg-red-950/60 border-red-900" : "bg-amber-950/60 border-amber-900";
  const textColor = hasErrors ? "text-red-300" : "text-amber-300";
  const Icon = hasErrors ? AlertTriangle : Info;

  return (
    <div className={`${bgColor} border-t px-4 py-2`}>
      <div className="max-w-7xl mx-auto flex items-center gap-2 text-xs">
        <Icon className={`w-3.5 h-3.5 ${textColor} flex-shrink-0`} />
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {(hasErrors ? errors : warns).slice(0, 3).map((w, i) => {
            const target = sectionOfWarning(w.field);
            return target ? (
              <button
                key={i}
                type="button"
                onClick={() => onWarningClick(target)}
                title="Ir para a seção"
                className={`${textColor} underline decoration-dotted underline-offset-2 hover:decoration-solid focus:outline-none focus:ring-1 focus:ring-current rounded`}
              >
                {w.message}
              </button>
            ) : (
              <span key={i} className={textColor}>
                {w.message}
              </span>
            );
          })}
          {warnings.length > 3 && (
            <span className="text-slate-500">+{warnings.length - 3} outros</span>
          )}
        </div>
      </div>
    </div>
  );
}
