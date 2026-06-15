import React, { useState } from "react";
import { Plus, Trash2, Star, Zap, ChevronDown, ChevronUp } from "lucide-react";
import { TextInput, TextArea, SmallButton, ExpandableText, SearchInput } from "../builder-controls";
import { SaveTemplateButton, TemplateInlinePicker } from "../TemplateControls";
import { normalizeText } from "../fm-tables";
import { DOTES_OFICIAIS, getDoteByKey, isAutomatedDote, getDoteLimit, resolveDoteDescription } from "../fm-dotes";
import { getFrutosDoteBonus } from "../fm-origens";

// Re-export para preservar consumidores externos (import legado).
export { DOTES_OFICIAIS };

// Descrição resolvida no contexto da ficha (descriptionFn + sub-escolha).
const resolveDesc = (dote, draft, subChoice) =>
  resolveDoteDescription(dote, {
    core: draft.core,
    attributes: draft.attributes,
    subChoice,
  });

// Badge "Programada" reutilizado em vários pontos.
const ProgramadaBadge = () => (
  <span
    className="inline-flex items-center gap-0.5 text-[9px] uppercase tracking-wide text-amber-300 border border-amber-700/60 rounded px-1 py-0.5"
    title="Efeito aplicado automaticamente na ficha"
  >
    <Zap className="w-2.5 h-2.5" /> Programada
  </span>
);

export default function SectionDotes({ draft, actions }) {
  const dotes = draft.dotes || [];

  // Limite de dotes por Patamar × ND (+ bônus de Frutos da Experiência).
  const limiteBase = getDoteLimit(draft.core?.patamar, draft.core?.nd);
  const frutosBonus = getFrutosDoteBonus(draft.core);
  const limite = limiteBase + frutosBonus;
  const usados = dotes.length;
  const slotsRestantes = limite - usados;

  // Estado da UI de adicionar — picker inicia fechado, igual à aba de
  // Treinamentos, evitando um muro de cards ao abrir a seção.
  const [pickerOpen, setPickerOpen] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [nomeCustom, setNomeCustom] = useState("");
  const [descCustom, setDescCustom] = useState("");
  const [expandedKey, setExpandedKey] = useState(null);
  const [query, setQuery] = useState("");

  const q = normalizeText(query);
  const addedNomes = new Set(dotes.map((d) => d.nome));
  const disponiveis = DOTES_OFICIAIS.filter(
    (d) => !addedNomes.has(d.nome) && (q === "" || normalizeText(`${d.nome} ${d.descricao}`).includes(q))
  );

  const handleAddOficial = (dote) => {
    if (slotsRestantes <= 0) return;
    actions.addDote({
      tipo: "oficial",
      key: dote.key,
      nome: dote.nome,
      descricao: dote.descricao,
    });
  };

  const handleAddCustom = () => {
    if (slotsRestantes <= 0 || !nomeCustom.trim()) return;
    actions.addDote({
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
      {/* Indicador de limite de dotes */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-xs text-slate-400">
            Dotes Gerais
            {frutosBonus > 0 && (
              <span className="text-amber-400/80"> (+{frutosBonus} Frutos)</span>
            )}
          </span>
          <div className="flex gap-1 flex-wrap">
            {Array.from({ length: limite }).map((_, i) => (
              <div
                key={i}
                className={`w-3.5 h-3.5 rounded-full border transition-colors ${
                  i < usados
                    ? "bg-amber-600 border-amber-500"
                    : "bg-slate-800 border-slate-700"
                }`}
              />
            ))}
            {limite === 0 && (
              <span className="text-[10px] text-slate-600 italic">nenhum neste Patamar</span>
            )}
          </div>
        </div>
        <span
          className={`text-xs font-bold tabular-nums ${
            slotsRestantes < 0
              ? "text-red-400"
              : slotsRestantes === 0
                ? "text-slate-500"
                : "text-amber-400"
          }`}
        >
          {slotsRestantes < 0
            ? `${usados}/${limite} (excedido)`
            : `${slotsRestantes}/${limite} disponíveis`}
        </span>
      </div>

      {/* Lista de dotes adicionados */}
      {dotes.length === 0 ? (
        <div className="order-3 text-center py-5 text-slate-600 text-sm italic border border-dashed border-slate-800 rounded">
          Nenhum dote adicionado
        </div>
      ) : (
        <div className="order-3 space-y-2">
          {dotes.map((d) => {
            const catalog = d.key ? getDoteByKey(d.key) : null;
            const desc = catalog ? resolveDesc(catalog, draft, d.subChoice) : d.descricao;
            const automated = isAutomatedDote(catalog);
            const subChoice = catalog?.automation?.kind === "sub_choice" ? catalog.automation : null;
            return (
              <div
                key={d.id}
                className="flex items-start gap-2.5 bg-slate-950/40 border border-slate-800 rounded p-3"
              >
                <Star className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="text-sm font-semibold text-white">{d.nome}</span>
                    {automated && <ProgramadaBadge />}
                    {d.tipo === "custom" && (
                      <span className="text-[9px] uppercase tracking-wide text-amber-400 border border-amber-800/60 rounded px-1 py-0.5">
                        Custom
                      </span>
                    )}
                  </div>
                  {desc && <ExpandableText text={desc} />}
                  {/* Sub-escolha (ex.: Domínio dos Fundamentos: Cruel × Duplicado) */}
                  {subChoice && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                        {subChoice.label}:
                      </span>
                      <div className="relative">
                        <select
                          value={d.subChoice ?? ""}
                          onChange={(e) => actions.updateDote(d.id, { subChoice: e.target.value })}
                          className="h-8 bg-slate-950 border border-slate-700 rounded pl-2 pr-7 text-xs text-white appearance-none focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                        >
                          <option value="">Escolha...</option>
                          {subChoice.options.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {d.tipo === "custom" && <SaveTemplateButton type="dote" entity={d} />}
                  <SmallButton
                    onClick={() => actions.removeDote(d.id)}
                    variant="danger"
                    title="Remover dote"
                  >
                    <Trash2 className="w-3 h-3" />
                  </SmallButton>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ===== SELETOR — só quando ainda há slots disponíveis ===== */}
      {slotsRestantes > 0 ? (
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
            {pickerOpen ? "Escolher Dote" : "Adicionar Dote"}
          </span>
          <span className="text-[10px] uppercase tracking-wider text-purple-300/90 font-bold bg-purple-950/60 border border-purple-800/60 rounded px-1.5 py-0.5">
            {slotsRestantes} vaga{slotsRestantes === 1 ? "" : "s"}
          </span>
          {pickerOpen ? (
            <ChevronUp className="w-4 h-4 flex-shrink-0" />
          ) : (
            <ChevronDown className="w-4 h-4 flex-shrink-0" />
          )}
        </button>

        {pickerOpen && (
          <div className="space-y-3 mt-3">
            <SearchInput value={query} onChange={setQuery} placeholder="Buscar dote..." />
            {disponiveis.length === 0 ? (
              <p className="text-xs text-slate-500 italic">
                {q
                  ? "Nenhum dote encontrado para a busca."
                  : "Todos os dotes oficiais já foram adicionados."}
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-start">
                {disponiveis.map((dote) => {
                  const isExpanded = expandedKey === dote.key;
                  const automated = isAutomatedDote(dote);
                  const desc = resolveDesc(dote, draft);
                  return (
                    <div
                      key={dote.key}
                      className={`bg-slate-950/40 border rounded p-2.5 transition-colors flex flex-col ${
                        automated
                          ? "border-amber-900/40 hover:border-amber-700/60"
                          : "border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-start gap-2 flex-1 min-h-0">
                        <Star className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0 flex flex-col">
                          {/* min-h reserva 2 linhas no título: assim o badge
                              "Programada" (que quebra pra 2ª linha em cards
                              estreitos) não deixa os cards automatizados mais
                              altos que os demais. */}
                          <div className="flex items-start gap-1.5 mb-1 flex-wrap min-h-[2.2rem]">
                            <span className="text-sm font-semibold text-white leading-tight">
                              {dote.nome}
                            </span>
                            {automated && <ProgramadaBadge />}
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
                          onClick={() => toggleExpand(dote.key)}
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
                          onClick={() => handleAddOficial(dote)}
                          variant="primary"
                          title="Adicionar este dote"
                        >
                          <Plus className="w-3 h-3" /> Adicionar
                        </SmallButton>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Botão / form de Dote Customizado */}
            <div className="pt-3 border-t border-slate-800/60 space-y-2">
              {showCustom ? (
                <div className="space-y-2 bg-slate-950/40 border border-amber-900/40 rounded p-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] uppercase tracking-widest text-amber-400 font-bold">
                      ✦ Dote Customizado
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
                    type="dote"
                    onPick={(tpl) => { setNomeCustom(tpl.nome ?? ""); setDescCustom(tpl.descricao ?? ""); }}
                  />
                  <TextInput
                    value={nomeCustom}
                    onChange={setNomeCustom}
                    placeholder="Nome do Dote"
                  />
                  <TextArea
                    value={descCustom}
                    onChange={setDescCustom}
                    rows={3}
                    placeholder="Descreva os efeitos deste dote..."
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
                  <Plus className="w-3 h-3" /> ✦ Criar Dote Customizado
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      ) : (
        <p
          className={`order-2 text-xs italic text-center pt-1 ${
            slotsRestantes < 0 ? "text-red-400/80" : "text-slate-600"
          }`}
        >
          {limite === 0
            ? "Este Patamar não permite Dotes Gerais."
            : slotsRestantes < 0
              ? "Limite de dotes excedido — remova alguns para respeitar o máximo."
              : "Todos os dotes permitidos foram adicionados."}
        </p>
      )}
    </div>
  );
}
