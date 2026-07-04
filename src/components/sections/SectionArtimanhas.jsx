import React, { useState } from "react";
import { Plus, Trash2, Zap, ChevronDown, ChevronUp, Info } from "lucide-react";
import { TextInput, TextArea, SmallButton, ExpandableText } from "../builder-controls";
import AutomationEditorPanel from "../AutomationEditorPanel";
import { ARTIMANHAS_OFICIAIS, getArtimanhasLimit } from "../fm-origens";
import { hasAutomation } from "../fm-automation";

// Badge "Programada" — mesma do resto da criação (Dotes/Características).
const ProgramadaBadge = () => (
  <span
    className="inline-flex items-center gap-0.5 text-[9px] uppercase tracking-wide text-amber-300 border border-amber-700/60 rounded px-1 py-0.5"
    title="Efeito aplicado automaticamente na ficha"
  >
    <Zap className="w-2.5 h-2.5" /> Programada
  </span>
);

export default function SectionArtimanhas({ draft, actions, dslContext = null }) {
  const artimanhas = draft.artimanhas || [];
  const addedNomes = new Set(artimanhas.map((a) => a.nome));

  // Limite de Artimanhas (= BT) para Não-Feiticeiro.
  const limit = getArtimanhasLimit(draft.core);
  const count = artimanhas.length;
  const noLimits = !!draft.core?.semLimites;
  const slotsRestantes = limit - count;
  const slotsOk = noLimits || slotsRestantes > 0;

  // Estado da UI de adicionar — picker inicia fechado (igual a Dotes/Treinamentos).
  const [pickerOpen, setPickerOpen] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [nomeCustom, setNomeCustom] = useState("");
  const [descCustom, setDescCustom] = useState("");
  const [autoCustom, setAutoCustom] = useState(null);

  // Oficial já adicionada some, EXCETO se for repetível.
  const disponiveis = ARTIMANHAS_OFICIAIS.filter(
    (a) => a.repetivel || !addedNomes.has(a.nome)
  );

  const handleAddOficial = (a) => {
    if (!slotsOk) return;
    actions.addArtimanha({
      tipo: "oficial",
      nome: a.nome,
      descricao: a.descricao,
      requisito: a.requisito || null,
    });
  };

  const handleAddCustom = () => {
    if (!slotsOk || !nomeCustom.trim()) return;
    actions.addArtimanha({
      tipo: "custom",
      nome: nomeCustom.trim(),
      descricao: descCustom.trim(),
      automation: autoCustom,
    });
    setNomeCustom("");
    setDescCustom("");
    setAutoCustom(null);
    setShowCustom(false);
  };

  return (
    // flex + order: a área de criação (picker) fica acima da lista.
    <div className="flex flex-col gap-4">
      {/* Indicador de limite */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex items-center gap-1.5 text-xs text-slate-400">
            <Zap className="w-3.5 h-3.5 text-amber-400" /> Artimanhas
          </span>
          <div className="flex gap-1 flex-wrap">
            {Array.from({ length: Math.max(limit, 0) }).map((_, i) => (
              <div
                key={i}
                className={`w-3.5 h-3.5 rounded-full border transition-colors ${
                  i < count ? "bg-amber-600 border-amber-500" : "bg-slate-800 border-slate-700"
                }`}
              />
            ))}
            {limit === 0 && (
              <span className="text-[10px] text-slate-600 italic">nenhuma neste BT</span>
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
                  : "text-amber-400"
          }`}
        >
          {noLimits
            ? `${count} · sem limite`
            : slotsRestantes < 0
              ? `${count}/${limit} (excedido)`
              : `${slotsRestantes}/${limit} disponíveis`}
        </span>
      </div>

      {/* Lista de artimanhas adicionadas */}
      {artimanhas.length === 0 ? (
        <div className="order-3 text-center py-5 text-slate-600 text-sm italic border border-dashed border-slate-800 rounded">
          Nenhuma artimanha adicionada
        </div>
      ) : (
        <div className="order-3 space-y-2">
          {artimanhas.map((a) => (
            <div
              key={a.id}
              className="flex items-start gap-2.5 bg-slate-950/40 border border-slate-800 rounded p-3"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span className="text-sm font-semibold text-white">{a.nome}</span>
                  {a.tipo === "custom" && hasAutomation(a) && <ProgramadaBadge />}
                  {a.tipo === "custom" && (
                    <span className="text-[9px] uppercase tracking-wide text-amber-400 border border-amber-800/60 rounded px-1 py-0.5">
                      Custom
                    </span>
                  )}
                  {a.requisito && (
                    <span className="text-[9px] uppercase tracking-wide text-slate-400 border border-slate-700 rounded px-1 py-0.5">
                      Req: {a.requisito}
                    </span>
                  )}
                </div>
                {a.descricao && <ExpandableText text={a.descricao} />}
                {/* Custom → mesma automação "Automatizar" do resto da criação. */}
                {a.tipo === "custom" && (
                  <AutomationEditorPanel
                    value={a.automation}
                    onChange={(automation) => actions.updateArtimanha(a.id, { automation })}
                    dslContext={dslContext}
                  />
                )}
              </div>
              <SmallButton
                onClick={() => actions.removeArtimanha(a.id)}
                variant="danger"
                title="Remover artimanha"
              >
                <Trash2 className="w-3 h-3" />
              </SmallButton>
            </div>
          ))}
        </div>
      )}

      {/* ===== PICKER — quando há vagas (ou Sem Limites) ===== */}
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
              {pickerOpen ? "Escolher Artimanha" : "Adicionar Artimanha"}
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
            <div className="flex flex-col gap-3 mt-3">
              {/* Artimanha Customizada — logo no topo (order-1). */}
              <div className="order-1 pb-3 border-b border-slate-800/60 space-y-2">
                {showCustom ? (
                  <div className="space-y-2 bg-slate-950/40 border border-amber-900/40 rounded p-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] uppercase tracking-widest text-amber-400 font-bold">
                        ✦ Artimanha Customizada
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
                    <TextInput
                      value={nomeCustom}
                      onChange={setNomeCustom}
                      placeholder="Nome da Artimanha"
                    />
                    <TextArea
                      value={descCustom}
                      onChange={setDescCustom}
                      rows={3}
                      placeholder="Descreva os efeitos desta artimanha..."
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
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded border border-dashed border-amber-900/60 text-xs font-semibold text-amber-400 hover:text-amber-300 hover:border-amber-700/60 hover:bg-amber-950/20 transition-colors focus:outline-none focus:ring-1 focus:ring-amber-500/40"
                  >
                    <Plus className="w-3 h-3" /> ✦ Criar Artimanha Customizada
                  </button>
                )}
              </div>

              {/* Artimanhas oficiais — grid de cards (order-2). */}
              {disponiveis.length === 0 ? (
                <p className="order-2 text-xs text-slate-500 italic">
                  Todas as artimanhas oficiais já foram adicionadas.
                </p>
              ) : (
                <div className="order-2 grid grid-cols-1 sm:grid-cols-2 gap-2 items-start">
                  {disponiveis.map((a) => (
                    <div
                      key={a.nome}
                      className="bg-slate-950/40 border border-slate-800 hover:border-slate-700 rounded p-2.5 transition-colors flex flex-col"
                    >
                      <div className="flex items-start gap-2 flex-1 min-h-0">
                        <Zap className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0 flex flex-col">
                          <div className="flex items-start gap-1.5 mb-1 flex-wrap">
                            <span className="text-sm font-semibold text-white leading-tight">
                              {a.nome}
                            </span>
                            {a.repetivel && (
                              <span className="text-[9px] uppercase tracking-wide text-slate-400 border border-slate-700 rounded px-1 py-0.5">
                                repetível
                              </span>
                            )}
                          </div>
                          {a.requisito && (
                            <p className="text-[10px] uppercase tracking-widest text-amber-400/80 font-bold flex items-center gap-1 mb-1">
                              <Info className="w-3 h-3" /> Req: {a.requisito}
                            </p>
                          )}
                          <ExpandableText text={a.descricao} />
                        </div>
                      </div>
                      <div className="flex items-center mt-2 pt-2 border-t border-slate-800/60">
                        <div className="flex-1" />
                        <SmallButton
                          onClick={() => handleAddOficial(a)}
                          variant="primary"
                          title="Adicionar esta artimanha"
                        >
                          <Plus className="w-3 h-3" /> Adicionar
                        </SmallButton>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <p
          className={`order-2 text-xs italic text-center pt-1 ${
            slotsRestantes < 0 ? "text-red-400/80" : "text-slate-600"
          }`}
        >
          {slotsRestantes < 0
            ? "Limite de artimanhas excedido. Remova algumas para respeitar o máximo."
            : "Todas as artimanhas permitidas foram adicionadas."}
        </p>
      )}
    </div>
  );
}
