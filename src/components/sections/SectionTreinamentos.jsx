import React, { useState } from "react";
import { Plus, Trash2, GraduationCap, Zap, ChevronDown, ChevronUp } from "lucide-react";
import { TextInput, TextArea, SmallButton, ExpandableText, SearchInput } from "../builder-controls";
import { SaveTemplateButton, TemplateInlinePicker } from "../TemplateControls";
import { normalizeText } from "../fm-tables";
import {
  TREINAMENTOS_OFICIAIS,
  getTreinamentoByKey,
  isAutomatedTreinamento,
} from "../fm-treinamentos";

// Re-export para preservar consumidores externos (import legado).
export { TREINAMENTOS_OFICIAIS };

// 4° Grau é o mais fraco (0 bônus) → Grau Especial é o mais forte (4 bônus)
const GRAU_BONUS = { "4": 0, "3": 1, "2": 2, "1": 3, especial: 4 };

// Descrição resolvida no contexto da ficha (alguns treinos têm
// descriptionFn que injetam ½ BT calculado etc.).
const resolveDesc = (treino, draft) =>
  typeof treino.descriptionFn === "function"
    ? treino.descriptionFn({ core: draft.core, attributes: draft.attributes })
    : treino.descricao;

export default function SectionTreinamentos({ draft, actions }) {
  const pontosTotal = 1 + (GRAU_BONUS[draft.core?.grau] ?? 0);
  const treinamentos = draft.treinamentos || [];
  const pontosUsados = treinamentos.length;
  const pontosDisponiveis = pontosTotal - pontosUsados;

  // Estado da UI de adicionar
  // Painel inicia sempre fechado — o usuário abre o seletor quando quiser
  // escolher um treinamento, evitando um muro de cards ao abrir a aba.
  const [pickerOpen, setPickerOpen] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [nomeCustom, setNomeCustom] = useState("");
  const [descCustom, setDescCustom] = useState("");
  const [expandedKey, setExpandedKey] = useState(null);
  const [query, setQuery] = useState("");

  const addedKeys = new Set(treinamentos.map((t) => t.key).filter(Boolean));
  const disponiveis = TREINAMENTOS_OFICIAIS.filter((t) => !addedKeys.has(t.key));
  const q = normalizeText(query);
  const visiveis = disponiveis.filter(
    (t) => q === "" || normalizeText(`${t.nome} ${t.descricao}`).includes(q)
  );

  const handleAddOficial = (treino) => {
    if (pontosDisponiveis <= 0) return;
    actions.addTreinamento({
      tipo: "oficial",
      key: treino.key,
      nome: treino.nome,
      descricao: treino.descricao,
    });
  };

  const handleAddCustom = () => {
    if (pontosDisponiveis <= 0 || !nomeCustom.trim()) return;
    actions.addTreinamento({
      tipo: "custom",
      nome: nomeCustom.trim(),
      descricao: descCustom.trim(),
    });
    setNomeCustom("");
    setDescCustom("");
    setShowCustom(false);
  };

  const toggleExpand = (key) => {
    setExpandedKey((prev) => (prev === key ? null : key));
  };

  return (
    // flex + order: a área de criação (seletor) fica acima da lista (adendo #5).
    <div className="flex flex-col gap-4">
      {/* Indicador de pontos */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-xs text-slate-400">Pontos de Treinamento</span>
          <div className="flex gap-1">
            {Array.from({ length: pontosTotal }).map((_, i) => (
              <div
                key={i}
                className={`w-3.5 h-3.5 rounded-full border transition-colors ${
                  i < pontosUsados
                    ? "bg-emerald-600 border-emerald-500"
                    : "bg-slate-800 border-slate-700"
                }`}
              />
            ))}
          </div>
        </div>
        <span
          className={`text-xs font-bold tabular-nums ${
            pontosDisponiveis === 0 ? "text-slate-500" : "text-emerald-400"
          }`}
        >
          {pontosDisponiveis}/{pontosTotal} disponíveis
        </span>
      </div>

      {/* Lista de treinamentos adicionados */}
      {treinamentos.length === 0 ? (
        <div className="order-3 text-center py-5 text-slate-600 text-sm italic border border-dashed border-slate-800 rounded">
          Nenhum treinamento adicionado
        </div>
      ) : (
        <div className="order-3 space-y-2">
          {treinamentos.map((t) => {
            const catalog = t.key ? getTreinamentoByKey(t.key) : null;
            const desc = catalog ? resolveDesc(catalog, draft) : t.descricao;
            const automated = isAutomatedTreinamento(catalog);
            return (
              <div
                key={t.id}
                className="flex items-start gap-2.5 bg-slate-950/40 border border-slate-800 rounded p-3"
              >
                <GraduationCap className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="text-sm font-semibold text-white">{t.nome}</span>
                    {automated && (
                      <span
                        className="inline-flex items-center gap-0.5 text-[9px] uppercase tracking-wide text-amber-300 border border-amber-700/60 rounded px-1 py-0.5"
                        title="Efeito aplicado automaticamente na ficha"
                      >
                        <Zap className="w-2.5 h-2.5" /> Programada
                      </span>
                    )}
                    {t.tipo === "custom" && (
                      <span className="text-[9px] uppercase tracking-wide text-amber-400 border border-amber-800/60 rounded px-1 py-0.5">
                        Custom
                      </span>
                    )}
                  </div>
                  {desc && <ExpandableText text={desc} />}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {t.tipo === "custom" && <SaveTemplateButton type="treinamento" entity={t} />}
                  <SmallButton
                    onClick={() => actions.removeTreinamento(t.id)}
                    variant="danger"
                    title="Remover treinamento"
                  >
                    <Trash2 className="w-3 h-3" />
                  </SmallButton>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ===== SELETOR — só quando há pontos disponíveis ===== */}
      {pontosDisponiveis > 0 ? (
        <div className="order-2 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={() => setPickerOpen((v) => !v)}
            className={`w-full flex items-center gap-2 px-3 py-2.5 rounded border font-semibold text-sm transition-colors focus:outline-none focus:ring-1 focus:ring-purple-500/50 ${
              pickerOpen
                ? "bg-purple-950/40 border-purple-800/60 text-purple-200 hover:bg-purple-950/60"
                : "bg-purple-900/30 border-purple-800/60 text-purple-300 hover:bg-purple-900/50 hover:text-purple-200"
            }`}
            aria-expanded={pickerOpen}
          >
            <Plus className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1 text-left">
              {pickerOpen ? "Escolher Treinamento" : "Adicionar Treinamento"}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-purple-300/90 font-bold bg-purple-950/60 border border-purple-800/60 rounded px-1.5 py-0.5">
              {disponiveis.length} disp.
            </span>
            {pickerOpen ? (
              <ChevronUp className="w-4 h-4 flex-shrink-0" />
            ) : (
              <ChevronDown className="w-4 h-4 flex-shrink-0" />
            )}
          </button>

          {pickerOpen && (
            <div className="space-y-3 mt-3">
              <SearchInput value={query} onChange={setQuery} placeholder="Buscar treinamento..." />
              {visiveis.length === 0 ? (
                <p className="text-xs text-slate-500 italic">
                  {q
                    ? "Nenhum treinamento encontrado para a busca."
                    : "Todos os treinamentos oficiais já foram adicionados."}
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-start">
                  {visiveis.map((t) => {
                    const automated = isAutomatedTreinamento(t);
                    const isExpanded = expandedKey === t.key;
                    const desc = resolveDesc(t, draft);
                    return (
                      <div
                        key={t.key}
                        className={`bg-slate-950/40 border rounded p-2.5 transition-colors flex flex-col ${
                          automated
                            ? "border-amber-900/40 hover:border-amber-700/60"
                            : "border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-start gap-2 flex-1 min-h-0">
                          <GraduationCap
                            className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${
                              automated ? "text-amber-400" : "text-emerald-400"
                            }`}
                          />
                          <div className="flex-1 min-w-0 flex flex-col">
                            {/* min-h reserva 2 linhas no título: o badge
                                "Programada" não deixa os automatizados mais altos. */}
                            <div className="flex items-start gap-1.5 mb-1 flex-wrap min-h-[2.2rem]">
                              <span className="text-sm font-semibold text-white leading-tight">
                                {t.nome}
                              </span>
                              {automated && (
                                <span
                                  className="inline-flex items-center gap-0.5 text-[9px] uppercase tracking-wide text-amber-300 border border-amber-700/60 rounded px-1 py-0.5"
                                  title="Efeito aplicado automaticamente na ficha"
                                >
                                  <Zap className="w-2.5 h-2.5" /> Programada
                                </span>
                              )}
                            </div>
                            <p
                              className={`text-[11px] text-slate-400 leading-relaxed whitespace-pre-line ${
                                isExpanded ? "" : "line-clamp-3 min-h-[3.4rem]"
                              }`}
                            >
                              {desc}
                            </p>
                          </div>
                        </div>
                        {/* Rodapé fixo no final do card — mt-auto encosta no fundo
                            independente do tamanho da descrição. */}
                        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-800/60">
                          <button
                            type="button"
                            onClick={() => toggleExpand(t.key)}
                            className="inline-flex items-center gap-0.5 text-[10px] text-slate-500 hover:text-slate-300 transition-colors focus:outline-none focus:ring-1 focus:ring-purple-500/40 rounded"
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
                            onClick={() => handleAddOficial(t)}
                            variant="primary"
                            title="Adicionar este treinamento"
                          >
                            <Plus className="w-3 h-3" /> Adicionar
                          </SmallButton>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Botão / form de Treinamento Customizado */}
              <div className="pt-3 border-t border-slate-800/60 space-y-2">
                {showCustom ? (
                  <div className="space-y-2 bg-slate-950/40 border border-amber-900/40 rounded p-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] uppercase tracking-widest text-amber-400 font-bold">
                        ✦ Treinamento Customizado
                      </h4>
                      <button
                        type="button"
                        onClick={() => {
                          setShowCustom(false);
                          setNomeCustom("");
                          setDescCustom("");
                        }}
                        className="text-[10px] text-slate-500 hover:text-slate-300"
                      >
                        Cancelar
                      </button>
                    </div>
                    <TemplateInlinePicker
                      type="treinamento"
                      onPick={(tpl) => { setNomeCustom(tpl.nome ?? ""); setDescCustom(tpl.descricao ?? ""); }}
                    />
                    <TextInput
                      value={nomeCustom}
                      onChange={setNomeCustom}
                      placeholder="Nome do Treinamento"
                    />
                    <TextArea
                      value={descCustom}
                      onChange={setDescCustom}
                      rows={3}
                      placeholder="Descreva os efeitos deste treinamento..."
                    />
                    <SmallButton
                      onClick={handleAddCustom}
                      variant="primary"
                      disabled={!nomeCustom.trim()}
                    >
                      <Plus className="w-3 h-3" /> Adicionar
                    </SmallButton>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowCustom(true)}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded border border-dashed border-amber-900/60 text-xs font-semibold text-amber-400 hover:text-amber-300 hover:border-amber-700/60 hover:bg-amber-950/20 transition-colors focus:outline-none focus:ring-1 focus:ring-amber-500/40"
                  >
                    <Plus className="w-3 h-3" /> ✦ Criar Treinamento Customizado
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        treinamentos.length > 0 && (
          <p className="order-2 text-xs text-slate-600 italic text-center pt-1">
            Todos os pontos de treinamento foram utilizados.
          </p>
        )
      )}
    </div>
  );
}
