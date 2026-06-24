import React, { useState } from "react";
import { Plus, Trash2, Shapes, Zap, ChevronDown, ChevronUp } from "lucide-react";
import { SmallButton, ExpandableText, MiniTable, SearchInput, TextArea, FieldLabel } from "../builder-controls";
import AutomationEditorPanel from "../AutomationEditorPanel";
import { normalizeText } from "../fm-tables";
import {
  CARACTERISTICAS_CATEGORIAS, getCaracteristicaByKey,
  isAutomatedCaracteristica, resolveCaracteristicaDescription,
  getCaracteristicaTabelaDestaque,
} from "../fm-caracteristicas";

// Re-export para preservar consumidores externos (import legado).
export { CARACTERISTICAS_CATEGORIAS };

// Badge "Programada" reutilizado nos cards e na lista.
function ProgramadaBadge() {
  return (
    <span
      className="inline-flex items-center gap-0.5 text-[9px] uppercase tracking-wide text-amber-300 border border-amber-700/60 rounded px-1 py-0.5"
      title="Efeito aplicado automaticamente na ficha"
    >
      <Zap className="w-2.5 h-2.5" /> Programada
    </span>
  );
}

// `categoriaKeys` (opcional): restringe a seção a certas categorias do catálogo
// (ex.: ["gerais"] ou ["especiais"]) — usado na aba unificada de Características.
export default function SectionCaracteristicas({ draft, actions, categoriaKeys = null, dslContext = null }) {
  const allCaracteristicas = draft.caracteristicas || [];
  const cats = categoriaKeys
    ? CARACTERISTICAS_CATEGORIAS.filter((c) => categoriaKeys.includes(c.key))
    : CARACTERISTICAS_CATEGORIAS;
  const allowedCategorias = new Set(cats.map((c) => c.categoria));
  // Lista exibida respeita o filtro; addedNomes usa TODAS (evita re-adicionar
  // a mesma característica por outra sub-seção).
  const caracteristicas = categoriaKeys
    ? allCaracteristicas.filter((c) => allowedCategorias.has(c.categoria))
    : allCaracteristicas;
  const addedNomes = new Set(allCaracteristicas.map((c) => c.nome));

  // Contexto para os valores computados (computeInfo) e tabelas destacadas.
  const caracCtx = { core: draft.core, attributes: draft.attributes };

  // Estado da UI — picker inicia fechado, igual às demais abas de catálogo.
  const [pickerOpen, setPickerOpen] = useState(false);
  const [expandedKey, setExpandedKey] = useState(null);
  const [query, setQuery] = useState("");

  const q = normalizeText(query);
  const matchesQuery = (c) =>
    q === "" || normalizeText(`${c.nome} ${c.descricao}`).includes(q);
  const isAvailable = (c) => !addedNomes.has(c.nome) && matchesQuery(c);

  // Total de características oficiais ainda não adicionadas (nas categorias visíveis).
  const totalDisponiveis = cats.reduce(
    (n, cat) => n + cat.caracteristicas.filter(isAvailable).length,
    0
  );

  const handleAddOficial = (carac, categoria) => {
    actions.addCaracteristica({
      tipo: "oficial",
      key: carac.key,
      categoria,
      nome: carac.nome,
      descricao: carac.descricao,
    });
  };

  const toggleExpand = (key) => {
    setExpandedKey((prev) => (prev === key ? null : key));
  };

  return (
    // flex + order: a área de adicionar fica acima da lista (adendo #5).
    <div className="flex flex-col gap-4">
      {/* Lista de características adicionadas */}
      {caracteristicas.length === 0 ? (
        <div className="order-2 text-center py-5 text-slate-600 text-sm italic border border-dashed border-slate-800 rounded">
          Nenhuma característica adicionada
        </div>
      ) : (
        <div className="order-2 space-y-2">
          {caracteristicas.map((c) => {
            const catalog = c.key ? getCaracteristicaByKey(c.key) : null;
            const subAuto = catalog?.automation;
            const isSub = subAuto?.kind === "acao_extra" || subAuto?.kind === "sub_choice";
            // Habilidade ABERTA (Aura/Marca/Rastro/Transformação Especial): libera
            // o editor de bloquinhos + nota própria mesmo sendo oficial.
            const userAuto = !!catalog?.userAutomatable;
            const hasUserAuto = userAuto && (c.automation?.rules?.length ?? 0) > 0;
            const destaque = catalog
              ? getCaracteristicaTabelaDestaque(catalog, caracCtx)
              : null;
            return (
              <div
                key={c.id}
                className="flex items-start gap-2.5 bg-slate-950/40 border border-slate-800 rounded p-3"
              >
                <Shapes className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="text-sm font-semibold text-white">{c.nome}</span>
                    <span className="text-[9px] uppercase tracking-wide text-slate-500 border border-slate-700 rounded px-1 py-0.5">
                      {c.categoria}
                    </span>
                    {(isAutomatedCaracteristica(catalog) || hasUserAuto) && <ProgramadaBadge />}
                    {c.tipo === "custom" && (
                      <span className="text-[9px] uppercase tracking-wide text-amber-400 border border-amber-800/60 rounded px-1 py-0.5">
                        Custom
                      </span>
                    )}
                  </div>
                  {c.descricao && (
                    <ExpandableText
                      text={
                        catalog
                          ? resolveCaracteristicaDescription(catalog, { ...caracCtx, subChoice: c.subChoice, notaPersonalizada: c.notaPersonalizada })
                          : c.descricao
                      }
                      extra={catalog?.tabela ? <MiniTable {...catalog.tabela} destaqueIndex={destaque} /> : null}
                    />
                  )}
                  {/* Sub-escolha do Ímpeto Gradual (tipo de ação extra) */}
                  {isSub && (
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                        {subAuto.label}:
                      </span>
                      <div className="relative">
                        <select
                          value={c.subChoice ?? ""}
                          onChange={(e) =>
                            actions.updateCaracteristica(c.id, { subChoice: e.target.value })
                          }
                          className="h-8 bg-slate-950 border border-slate-700 rounded pl-2 pr-7 text-xs text-white appearance-none focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                        >
                          <option value="">Escolha...</option>
                          {(subAuto.options || []).map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                      </div>
                    </div>
                  )}
                  {userAuto && c.tipo !== "custom" && (
                    <div className="mt-2">
                      <FieldLabel hint="fica sob o texto/tabela oficial, sem substituí-lo">Nota personalizada</FieldLabel>
                      <TextArea
                        value={c.notaPersonalizada ?? ""}
                        onChange={(v) => actions.updateCaracteristica(c.id, { notaPersonalizada: v })}
                        rows={2}
                        placeholder="Ex: Minha Marca causa +5 de dano fixo e aplica Lento por 1 rodada."
                      />
                    </div>
                  )}
                  {(c.tipo === "custom" || userAuto) && (
                    <AutomationEditorPanel
                      value={c.automation}
                      onChange={(automation) => actions.updateCaracteristica(c.id, { automation })}
                      dslContext={dslContext}
                      defaultStack="highest"
                    />
                  )}
                </div>
                <SmallButton
                  onClick={() => actions.removeCaracteristica(c.id)}
                  variant="danger"
                  title="Remover característica"
                >
                  <Trash2 className="w-3 h-3" />
                </SmallButton>
              </div>
            );
          })}
        </div>
      )}

      {/* ===== SELETOR — cards agrupados por Tipo ===== */}
      <div className="order-1 pt-3 border-t border-slate-800">
        <button
          type="button"
          onClick={() => setPickerOpen((v) => !v)}
          className={`w-full flex items-center gap-2 px-3 py-2.5 rounded border font-semibold text-sm transition-colors focus:outline-none focus:ring-1 focus:ring-cyan-500/50 ${
            pickerOpen
              ? "bg-cyan-950/40 border-cyan-800/60 text-cyan-200 hover:bg-cyan-950/60"
              : "bg-cyan-900/30 border-cyan-800/60 text-cyan-300 hover:bg-cyan-900/50 hover:text-cyan-200"
          }`}
          aria-expanded={pickerOpen}
        >
          <Plus className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1 text-left">
            {pickerOpen ? "Escolher Característica" : "Adicionar Característica"}
          </span>
          {pickerOpen ? (
            <ChevronUp className="w-4 h-4 flex-shrink-0" />
          ) : (
            <ChevronDown className="w-4 h-4 flex-shrink-0" />
          )}
        </button>

        {pickerOpen && (
          <div className="space-y-4 mt-3">
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Buscar característica..."
            />
            {totalDisponiveis === 0 ? (
              <p className="text-xs text-slate-500 italic">
                {q
                  ? "Nenhuma característica encontrada para a busca."
                  : "Todas as características oficiais já foram adicionadas."}
              </p>
            ) : (
              cats.map((cat) => {
                const disponiveis = cat.caracteristicas.filter(isAvailable);
                if (disponiveis.length === 0) return null;
                return (
                  <div key={cat.key}>
                    {/* Cabeçalho da categoria (Tipo) */}
                    <h4
                      className={`text-[10px] uppercase tracking-widest font-bold mb-2 flex items-center gap-1.5 ${cat.accent}`}
                    >
                      <Shapes className="w-3 h-3" />
                      {cat.categoria}
                      <span className="text-slate-600 font-normal">({disponiveis.length})</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-start">
                      {disponiveis.map((carac) => {
                        const isExpanded = expandedKey === carac.key;
                        return (
                          <div
                            key={carac.key}
                            className="bg-slate-950/40 border border-slate-800 hover:border-slate-700 rounded p-2.5 transition-colors flex flex-col"
                          >
                            <div className="flex items-start gap-2 flex-1 min-h-0">
                              <Shapes className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 mt-0.5" />
                              <div className="flex-1 min-w-0 flex flex-col">
                                <div className="flex items-start gap-1.5 mb-1 flex-wrap min-h-[2.2rem]">
                                  <span className="text-sm font-semibold text-white leading-tight">
                                    {carac.nome}
                                  </span>
                                  {isAutomatedCaracteristica(carac) && <ProgramadaBadge />}
                                </div>
                                <p
                                  className={`text-[11px] text-slate-400 leading-relaxed whitespace-pre-line ${
                                    isExpanded ? "" : "line-clamp-3 min-h-[3.4rem]"
                                  }`}
                                >
                                  {resolveCaracteristicaDescription(carac, caracCtx)}
                                </p>
                                {isExpanded && carac.tabela && (
                                  <MiniTable
                                    {...carac.tabela}
                                    destaqueIndex={getCaracteristicaTabelaDestaque(carac, caracCtx)}
                                  />
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-800/60">
                              <button
                                type="button"
                                onClick={() => toggleExpand(carac.key)}
                                className="inline-flex items-center gap-0.5 text-[10px] text-slate-500 hover:text-slate-300 transition-colors focus:outline-none focus:ring-1 focus:ring-cyan-500/40 rounded"
                              >
                                {isExpanded ? (
                                  <>
                                    <ChevronUp className="w-3 h-3" /> Recolher
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="w-3 h-3" /> Ler mais
                                  </>
                                )}
                              </button>
                              <div className="flex-1" />
                              <SmallButton
                                onClick={() => handleAddOficial(carac, cat.categoria)}
                                variant="primary"
                                title="Adicionar esta característica"
                              >
                                <Plus className="w-3 h-3" /> Adicionar
                              </SmallButton>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
