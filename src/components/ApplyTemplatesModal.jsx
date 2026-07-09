import React, { useState, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  X, Check, Search, Wand2, AlertTriangle, CheckCircle2, Folder, Users,
} from "lucide-react";

import { templateLabel } from "./fm-templates";
import { creatureHasTemplate, applyTemplatesToCreatures } from "./fm-creature-ops";

// ============================================================
// APLICAR MODELOS EM FICHAS
// ============================================================
// Recebe os modelos selecionados na Biblioteca e aplica-os nas fichas que o
// usuário escolher. Só fichas do storage chegam aqui — as criaturas nativas do
// compêndio são imutáveis e nem entram na lista.
//
// Duas etapas: escolha das fichas → relatório. O relatório existe porque a
// aplicação pode estourar limites de Patamar/ND (dotes, aptidões) numa ficha e
// não em outra, e falhar em silêncio seria pior do que aplicar e avisar.

export default function ApplyTemplatesModal({ items, creatures, folders = [], onApply, onClose }) {
  const [selected, setSelected] = useState(() => new Set());
  const [search, setSearch] = useState("");
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [report, setReport] = useState(null);

  const folderName = useMemo(() => {
    const map = new Map(folders.map((f) => [f.id, f.name]));
    return (id) => (id == null ? null : map.get(id) ?? null);
  }, [folders]);

  const visible = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return creatures;
    return creatures.filter((c) => (c.name || "").toLowerCase().includes(q));
  }, [creatures, search]);

  // Quantos dos modelos escolhidos cada ficha JÁ possui (mesma assinatura).
  const dupCount = useMemo(() => {
    const out = {};
    for (const c of creatures) {
      out[c.id] = items.filter(({ type, tpl }) => creatureHasTemplate(c, type, tpl)).length;
    }
    return out;
  }, [creatures, items]);

  const allVisibleSelected = visible.length > 0 && visible.every((c) => selected.has(c.id));

  const toggle = useCallback((id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelected((prev) => (
      visible.length > 0 && visible.every((c) => prev.has(c.id))
        ? new Set()
        : new Set(visible.map((c) => c.id))
    ));
  }, [visible]);

  const handleApply = () => {
    const targets = creatures.filter((c) => selected.has(c.id));
    const { updates, report: rep } = applyTemplatesToCreatures(targets, items, { skipDuplicates });
    onApply(updates);
    setReport(rep);
  };

  const totalApplied = report?.reduce((n, r) => n + r.applied, 0) ?? 0;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="apply-tpl-title"
    >
      <div
        className="bg-slate-900 border border-slate-800 rounded-lg max-w-lg w-full shadow-2xl flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <Wand2 className="w-5 h-5 text-purple-400 flex-shrink-0" />
            <h3 id="apply-tpl-title" className="text-lg font-bold text-white truncate">
              {report ? "Resultado" : "Aplicar em Fichas"}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-200" aria-label="Fechar">
            <X className="w-5 h-5" />
          </button>
        </div>

        {report ? (
          <>
            <div className="p-4 overflow-y-auto space-y-2">
              <p className="text-xs text-slate-400 mb-3">
                {totalApplied} aplicação(ões) em {report.filter((r) => r.applied > 0).length} ficha(s).
              </p>
              {report.map((r) => (
                <div key={r.id} className="rounded border border-slate-800 bg-slate-950/50 p-2.5">
                  <div className="flex items-center gap-2">
                    {r.newErrors.length > 0 || r.blocked.length > 0
                      ? <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      : <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
                    <span className="text-sm font-semibold text-slate-200 truncate">{r.name}</span>
                    <span className="ml-auto text-[11px] text-slate-500 flex-shrink-0">
                      {r.applied} aplicado(s)
                      {r.skipped > 0 && ` · ${r.skipped} já tinha(m)`}
                    </span>
                  </div>
                  {r.blocked.map((b, i) => (
                    <div key={`b${i}`} className="text-[11px] text-rose-300 mt-1 leading-snug pl-6">
                      • <span className="font-semibold">{b.name}</span> não aplicado: {b.reason}
                    </div>
                  ))}
                  {r.newErrors.map((msg, i) => (
                    <div key={i} className="text-[11px] text-amber-300 mt-1 leading-snug pl-6">• {msg}</div>
                  ))}
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-slate-800 flex-shrink-0">
              <button
                onClick={onClose}
                autoFocus
                className="px-4 py-2 rounded bg-purple-700 hover:bg-purple-600 text-sm font-bold text-white transition-colors"
              >
                Concluir
              </button>
            </div>
          </>
        ) : (
          <>
            {/* MODELOS A APLICAR */}
            <div className="px-4 pt-3 flex-shrink-0">
              <p className="text-xs text-slate-400 mb-2">
                {items.length} modelo(s) serão adicionados às fichas escolhidas. Ações e
                Expansões são reescaladas para o ND/Patamar de cada ficha.
              </p>
              <div className="flex flex-wrap gap-1 mb-3">
                {items.slice(0, 6).map(({ type, tpl }) => (
                  <span key={`${type}:${tpl.id}`} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {templateLabel(type, tpl)}
                  </span>
                ))}
                {items.length > 6 && (
                  <span className="text-[10px] px-1.5 py-0.5 text-slate-500">+{items.length - 6}</span>
                )}
              </div>
            </div>

            {/* CONTROLES */}
            <div className="px-4 flex-shrink-0 space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar ficha..."
                  className="w-full h-9 bg-slate-950 border border-slate-700 rounded pl-9 pr-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500"
                  aria-label="Buscar ficha"
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={toggleAll}
                  disabled={visible.length === 0}
                  className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 disabled:opacity-40 focus:outline-none"
                >
                  <span className={`flex items-center justify-center w-4 h-4 rounded border ${
                    allVisibleSelected ? "bg-purple-600 border-purple-600" : "bg-slate-900/80 border-slate-600"
                  }`}>
                    {allVisibleSelected && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                  </span>
                  {allVisibleSelected ? "Limpar seleção" : "Selecionar todas"}
                </button>
                <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={skipDuplicates}
                    onChange={(e) => setSkipDuplicates(e.target.checked)}
                    className="accent-purple-600"
                  />
                  Pular os que a ficha já tem
                </label>
              </div>
            </div>

            {/* LISTA DE FICHAS */}
            <div className="p-4 overflow-y-auto flex-1 min-h-0">
              {creatures.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-slate-800 rounded-lg">
                  <Users className="w-8 h-8 mx-auto mb-2 text-slate-700" />
                  <p className="text-sm text-slate-500">Nenhuma ficha salva.</p>
                  <p className="text-xs text-slate-600 mt-1">
                    Criaturas nativas do compêndio não podem ser editadas.
                  </p>
                </div>
              ) : visible.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-10">Nenhuma ficha combina com a busca.</p>
              ) : (
                <ul className="space-y-1">
                  {visible.map((c) => {
                    const isSel = selected.has(c.id);
                    const dups = dupCount[c.id] ?? 0;
                    const fname = folderName(c.folderId);
                    return (
                      <li key={c.id}>
                        <button
                          type="button"
                          onClick={() => toggle(c.id)}
                          className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded border text-left transition-colors focus:outline-none ${
                            isSel
                              ? "bg-purple-950/30 border-purple-700/60"
                              : "bg-slate-950/40 border-slate-800 hover:border-slate-700"
                          }`}
                        >
                          <span className={`flex items-center justify-center w-4 h-4 rounded border flex-shrink-0 ${
                            isSel ? "bg-purple-600 border-purple-600" : "bg-slate-900/80 border-slate-600"
                          }`}>
                            {isSel && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-slate-200 truncate">{c.name || "(sem nome)"}</div>
                            <div className="flex items-center gap-2 text-[10px] text-slate-500">
                              <span className="uppercase tracking-wider">
                                {c.core?.patamar ?? "?"} · ND {c.core?.nd ?? "?"}
                              </span>
                              {fname && (
                                <span className="inline-flex items-center gap-0.5 truncate">
                                  <Folder className="w-2.5 h-2.5" /> {fname}
                                </span>
                              )}
                            </div>
                          </div>
                          {dups > 0 && (
                            <span
                              className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/60 flex-shrink-0"
                              title="Modelos que esta ficha já possui"
                            >
                              já tem {dups}
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* FOOTER */}
            <div className="flex justify-end gap-2 p-4 border-t border-slate-800 flex-shrink-0">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-sm font-semibold text-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleApply}
                disabled={selected.size === 0}
                className="flex items-center gap-1.5 px-4 py-2 rounded bg-purple-700 hover:bg-purple-600 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-bold text-white transition-colors"
              >
                <Wand2 className="w-4 h-4" />
                Aplicar em {selected.size || ""} ficha(s)
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
