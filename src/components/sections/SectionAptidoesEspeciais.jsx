import React, { useState } from "react";
import { Plus, Trash2, Sparkles, Zap, ChevronDown, ChevronUp } from "lucide-react";
import { TextInput, TextArea, SmallButton, ExpandableText, MiniTable, SearchInput } from "../builder-controls";
import { SaveTemplateButton, TemplateInlinePicker } from "../TemplateControls";
import AutomationEditorPanel from "../AutomationEditorPanel";
import { normalizeText } from "../fm-tables";
import { APTIDOES_CATEGORIAS, getAptidaoByKey, getAptidaoLimit, isAutomatedAptidao, resolveAptidaoDescription } from "../fm-aptidoes";
import { getFrutosAptidaoEspecialBonus } from "../fm-origens";

// Re-export para preservar consumidores externos (import legado).
export { APTIDOES_CATEGORIAS };

export default function SectionAptidoesEspeciais({ draft, actions, dslContext = null }) {
  const aptidoes = draft.aptidoesEspeciais || [];
  const addedNomes = new Set(aptidoes.map((a) => a.nome));

  // Estado da UI — picker inicia fechado, igual às abas de Treinamentos/Dotes.
  const [pickerOpen, setPickerOpen] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [nomeCustom, setNomeCustom] = useState("");
  const [descCustom, setDescCustom] = useState("");
  const [autoCustom, setAutoCustom] = useState(null);
  const [expandedKey, setExpandedKey] = useState(null);
  const [query, setQuery] = useState("");

  const q = normalizeText(query);
  const isAvailable = (a) =>
    !addedNomes.has(a.nome) && (q === "" || normalizeText(`${a.nome} ${a.descricao}`).includes(q));

  // Limite: uma aptidão a cada nível par (+ "+2 Aptidões" do Frutos da
  // Experiência). Concedidas por treino (source:"treino") são extras e não
  // contam para o limite.
  const frutosBonus = getFrutosAptidaoEspecialBonus(draft.core);
  const limite = getAptidaoLimit(draft.core) + frutosBonus;
  const usados = aptidoes.filter((a) => a.source !== "treino").length;
  const slotsRestantes = limite - usados;
  // Sem Limites: ignora os slots — sempre dá pra adicionar.
  const noLimits = !!draft.core?.semLimites;
  const slotsOk = noLimits || slotsRestantes > 0;

  // Contexto para os valores computados (computeInfo): núcleo, atributos e
  // níveis de aptidão (AU/CL/BAR/DOM/ER).
  const aptCtx = { core: draft.core, attributes: draft.attributes, aptidoes: draft.aptidoes };

  // Total de aptidões oficiais disponíveis (não adicionadas e batendo a busca).
  const totalDisponiveis = APTIDOES_CATEGORIAS.reduce(
    (n, cat) => n + cat.aptidoes.filter(isAvailable).length,
    0
  );

  const handleAddOficial = (apt, categoria) => {
    if (!slotsOk) return;
    actions.addAptidaoEspecial({
      tipo: "oficial",
      key: apt.key,
      categoria,
      nome: apt.nome,
      descricao: apt.descricao,
    });
  };

  const handleAddCustom = () => {
    if (!slotsOk || !nomeCustom.trim()) return;
    actions.addAptidaoEspecial({
      tipo: "custom",
      categoria: "Customizada",
      nome: nomeCustom.trim(),
      descricao: descCustom.trim(),
      automation: autoCustom,
    });
    setNomeCustom("");
    setDescCustom("");
    setAutoCustom(null);
    setShowCustom(false);
  };

  const toggleExpand = (key) => {
    setExpandedKey((prev) => (prev === key ? null : key));
  };

  return (
    // flex + order: a área de criação (seletor) fica acima da lista (adendo #5).
    <div className="flex flex-col gap-4">
      {/* Indicador de limite de aptidões */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-xs text-slate-400">
            Aptidões Amaldiçoadas
            {frutosBonus > 0 && (
              <span className="text-amber-400/80"> (+{frutosBonus} Frutos)</span>
            )}
          </span>
          <div className="flex gap-1 flex-wrap">
            {Array.from({ length: limite }).map((_, i) => (
              <div
                key={i}
                className={`w-3.5 h-3.5 rounded-full border transition-colors ${
                  i < usados ? "bg-purple-600 border-purple-500" : "bg-slate-800 border-slate-700"
                }`}
              />
            ))}
            {limite === 0 && (
              <span className="text-[10px] text-slate-600 italic">nenhuma neste caso</span>
            )}
          </div>
        </div>
        <span
          className={`text-xs font-bold tabular-nums ${
            noLimits
              ? "text-amber-300"
              : slotsRestantes < 0
                ? "text-red-400"
                : slotsRestantes === 0
                  ? "text-slate-500"
                  : "text-purple-300"
          }`}
        >
          {noLimits
            ? `${usados} · sem limite`
            : slotsRestantes < 0
              ? `${usados}/${limite} (excedido)`
              : `${slotsRestantes}/${limite} disponíveis`}
        </span>
      </div>

      {/* Lista de aptidões adicionadas */}
      {aptidoes.length === 0 ? (
        <div className="order-3 text-center py-5 text-slate-600 text-sm italic border border-dashed border-slate-800 rounded">
          Nenhuma aptidão amaldiçoada adicionada
        </div>
      ) : (
        <div className="order-3 space-y-2">
          {aptidoes.map((a) => {
            const fromTreino = a.source === "treino";
            const catalog = a.key ? getAptidaoByKey(a.key) : null;
            const subAuto = catalog?.automation;
            const isSub =
              subAuto && (subAuto.kind === "sub_choice" || subAuto.kind === "imunidade_grant");
            const subOptions = subAuto?.optionsFromSkills
              ? (draft.skills || [])
                  .filter((s) => s.name?.trim())
                  .map((s) => ({ value: s.name, label: s.name }))
              : subAuto?.options || [];
            return (
              <div
                key={a.id}
                className="flex items-start gap-2.5 bg-slate-950/40 border border-slate-800 rounded p-3"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="text-sm font-semibold text-white">{a.nome}</span>
                    <span className="text-[9px] uppercase tracking-wide text-slate-500 border border-slate-700 rounded px-1 py-0.5">
                      {a.categoria}
                    </span>
                    {fromTreino && (
                      <span
                        className="inline-flex items-center gap-0.5 text-[9px] uppercase tracking-wide text-amber-300 border border-amber-700/60 rounded px-1 py-0.5"
                        title="Concedida automaticamente por um treinamento"
                      >
                        <Zap className="w-2.5 h-2.5" /> Programada
                      </span>
                    )}
                    {!fromTreino && isAutomatedAptidao(catalog) && (
                      <span
                        className="inline-flex items-center gap-0.5 text-[9px] uppercase tracking-wide text-amber-300 border border-amber-700/60 rounded px-1 py-0.5"
                        title="Efeito aplicado automaticamente na ficha"
                      >
                        <Zap className="w-2.5 h-2.5" /> Programada
                      </span>
                    )}
                    {a.tipo === "custom" && (
                      <span className="text-[9px] uppercase tracking-wide text-amber-400 border border-amber-800/60 rounded px-1 py-0.5">
                        Custom
                      </span>
                    )}
                  </div>
                  {a.descricao && (
                    <ExpandableText
                      text={catalog ? resolveAptidaoDescription(catalog, { ...aptCtx, subChoice: a.subChoice }) : a.descricao}
                      extra={catalog?.tabela ? <MiniTable {...catalog.tabela} /> : null}
                    />
                  )}
                  {/* Sub-escolha (Composição → elemento, Corpo → perícia) */}
                  {isSub && (
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                        {subAuto.label}:
                      </span>
                      <div className="relative">
                        <select
                          value={a.subChoice ?? ""}
                          onChange={(e) =>
                            actions.updateAptidaoEspecial(a.id, { subChoice: e.target.value })
                          }
                          className="h-8 bg-slate-950 border border-slate-700 rounded pl-2 pr-7 text-xs text-white appearance-none focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                        >
                          <option value="">
                            {subAuto.optionsFromSkills && subOptions.length === 0
                              ? "Sem perícias na ficha..."
                              : "Escolha..."}
                          </option>
                          {subOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                      </div>
                    </div>
                  )}
                  {a.tipo === "custom" && (
                    <AutomationEditorPanel
                      value={a.automation}
                      onChange={(automation) => actions.updateAptidaoEspecial(a.id, { automation })}
                      dslContext={dslContext}
                    />
                  )}
                </div>
                {!fromTreino && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {a.tipo === "custom" && <SaveTemplateButton type="aptidao" entity={a} />}
                    <SmallButton
                      onClick={() => actions.removeAptidaoEspecial(a.id)}
                      variant="danger"
                      title="Remover aptidão"
                    >
                      <Trash2 className="w-3 h-3" />
                    </SmallButton>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ===== SELETOR — cards agrupados por Tipo (quando há vagas ou Sem Limites) ===== */}
      {slotsOk ? (
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
            {pickerOpen ? "Escolher Aptidão" : "Adicionar Aptidão"}
          </span>
          <span className="text-[10px] uppercase tracking-wider text-purple-300/90 font-bold bg-purple-950/60 border border-purple-800/60 rounded px-1.5 py-0.5">
            {noLimits ? "∞ vagas" : `${slotsRestantes} vaga${slotsRestantes === 1 ? "" : "s"}`}
          </span>
          {pickerOpen ? (
            <ChevronUp className="w-4 h-4 flex-shrink-0" />
          ) : (
            <ChevronDown className="w-4 h-4 flex-shrink-0" />
          )}
        </button>

        {pickerOpen && (
          <div className="flex flex-col gap-4 mt-3">
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Buscar aptidão..."
            />
            {totalDisponiveis === 0 ? (
              <p className="order-2 text-xs text-slate-500 italic">
                {q
                  ? "Nenhuma aptidão encontrada para a busca."
                  : "Todas as aptidões oficiais já foram adicionadas."}
              </p>
            ) : (
              APTIDOES_CATEGORIAS.map((cat) => {
                const disponiveis = cat.aptidoes.filter(isAvailable);
                if (disponiveis.length === 0) return null;
                return (
                  <div key={cat.key} className="order-2">
                    {/* Cabeçalho da categoria (Tipo) */}
                    <h4
                      className={`text-[10px] uppercase tracking-widest font-bold mb-2 flex items-center gap-1.5 ${cat.accent}`}
                    >
                      <Sparkles className="w-3 h-3" />
                      {cat.categoria}
                      <span className="text-slate-600 font-normal">({disponiveis.length})</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-start">
                      {disponiveis.map((apt) => {
                        const isExpanded = expandedKey === apt.key;
                        return (
                          <div
                            key={apt.key}
                            className="bg-slate-950/40 border border-slate-800 hover:border-slate-700 rounded p-2.5 transition-colors flex flex-col"
                          >
                            <div className="flex items-start gap-2 flex-1 min-h-0">
                              <Sparkles className="w-3.5 h-3.5 text-purple-400 flex-shrink-0 mt-0.5" />
                              <div className="flex-1 min-w-0 flex flex-col">
                                <div className="flex items-start gap-1.5 mb-1 flex-wrap min-h-[2.2rem]">
                                  <span className="text-sm font-semibold text-white leading-tight">
                                    {apt.nome}
                                  </span>
                                  {isAutomatedAptidao(apt) && (
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
                                  {resolveAptidaoDescription(apt, aptCtx)}
                                </p>
                                {isExpanded && apt.tabela && <MiniTable {...apt.tabela} />}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-800/60">
                              <button
                                type="button"
                                onClick={() => toggleExpand(apt.key)}
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
                                onClick={() => handleAddOficial(apt, cat.categoria)}
                                variant="primary"
                                title="Adicionar esta aptidão"
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

            {/* Botão / form de Aptidão Customizada — logo após a busca (order-1). */}
            <div className="order-1 pb-3 border-b border-slate-800/60 space-y-2">
              {showCustom ? (
                <div className="space-y-2 bg-slate-950/40 border border-purple-900/40 rounded p-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] uppercase tracking-widest text-purple-300 font-bold">
                      ✦ Aptidão Customizada
                    </h4>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCustom(false);
                        setNomeCustom("");
                        setDescCustom("");
                        setAutoCustom(null);
                      }}
                      className="text-[10px] text-slate-500 hover:text-slate-300"
                    >
                      Cancelar
                    </button>
                  </div>
                  <TemplateInlinePicker
                    type="aptidao"
                    onPick={(tpl) => { setNomeCustom(tpl.nome ?? ""); setDescCustom(tpl.descricao ?? ""); setAutoCustom(tpl.automation ?? null); }}
                  />
                  <TextInput
                    value={nomeCustom}
                    onChange={setNomeCustom}
                    placeholder="Nome da Aptidão"
                  />
                  <TextArea
                    value={descCustom}
                    onChange={setDescCustom}
                    rows={3}
                    placeholder="Descreva os efeitos desta aptidão..."
                  />
                  <AutomationEditorPanel
                    value={autoCustom}
                    onChange={setAutoCustom}
                    dslContext={dslContext}
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
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded border border-dashed border-purple-900/60 text-xs font-semibold text-purple-300 hover:text-purple-200 hover:border-purple-700/60 hover:bg-purple-950/20 transition-colors focus:outline-none focus:ring-1 focus:ring-purple-500/40"
                >
                  <Plus className="w-3 h-3" /> ✦ Criar Aptidão Customizada
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
            ? "Este tipo de criatura não recebe Aptidões Amaldiçoadas."
            : slotsRestantes < 0
              ? "Limite de aptidões excedido. Remova algumas para respeitar o máximo."
              : "Todas as aptidões permitidas foram adicionadas."}
        </p>
      )}
    </div>
  );
}
