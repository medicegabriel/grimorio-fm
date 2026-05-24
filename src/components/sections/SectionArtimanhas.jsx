import React, { useState } from "react";
import { Plus, Trash2, Zap, ChevronDown, Info } from "lucide-react";
import { TextInput, TextArea, SmallButton } from "../builder-controls";
import { ARTIMANHAS_OFICIAIS, getArtimanhasLimit } from "../fm-origens";

const CUSTOM_KEY = "__custom__";

const ARTIMANHA_BY_NOME = Object.fromEntries(
  ARTIMANHAS_OFICIAIS.map((a) => [a.nome, a])
);

export default function SectionArtimanhas({ draft, actions }) {
  const artimanhas = draft.artimanhas || [];
  const addedNomes = new Set(artimanhas.map((a) => a.nome));

  const [selecao, setSelecao] = useState("");
  const [nomeCustom, setNomeCustom] = useState("");
  const [descCustom, setDescCustom] = useState("");

  const oficialSelecionada = ARTIMANHA_BY_NOME[selecao];

  const limit = getArtimanhasLimit(draft.core);
  const count = artimanhas.length;
  const exceeded = count > limit;

  const handleAdd = () => {
    if (selecao === CUSTOM_KEY) {
      if (!nomeCustom.trim()) return;
      actions.addArtimanha({
        tipo: "custom",
        nome: nomeCustom.trim(),
        descricao: descCustom.trim(),
      });
    } else if (oficialSelecionada) {
      actions.addArtimanha({
        tipo: "oficial",
        nome: oficialSelecionada.nome,
        descricao: oficialSelecionada.descricao,
        requisito: oficialSelecionada.requisito || null,
      });
    }
    setSelecao("");
    setNomeCustom("");
    setDescCustom("");
  };

  const podeAdicionar =
    selecao === CUSTOM_KEY ? !!nomeCustom.trim() : !!oficialSelecionada;

  // Opções do select: oficial já adicionada some, EXCETO se for repetível
  const opcoesDisponiveis = ARTIMANHAS_OFICIAIS.filter(
    (a) => a.repetivel || !addedNomes.has(a.nome)
  );

  return (
    <div className="space-y-4">
      {/* Cabeçalho com contagem */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>Limite por BT:</span>
          <span className={`font-mono font-bold ${exceeded ? "text-red-400" : "text-slate-200"}`}>
            {count}/{limit}
          </span>
        </div>
        {exceeded && (
          <span className="text-[10px] uppercase tracking-wide text-red-400 font-bold">
            Excedido em {count - limit}
          </span>
        )}
      </div>

      {/* Lista de artimanhas adicionadas */}
      {artimanhas.length === 0 ? (
        <div className="text-center py-5 text-slate-600 text-sm italic border border-dashed border-slate-800 rounded">
          Nenhuma artimanha adicionada
        </div>
      ) : (
        <div className="space-y-2">
          {artimanhas.map((a) => (
            <div
              key={a.id}
              className="flex items-start gap-2.5 bg-slate-950/40 border border-slate-800 rounded p-3"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span className="text-sm font-semibold text-white">{a.nome}</span>
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
                {a.descricao && (
                  <p className="text-xs text-slate-400 leading-relaxed">{a.descricao}</p>
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

      {/* Formulário de adição */}
      <div className="pt-3 border-t border-slate-800 space-y-3">
        <h3 className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
          Adicionar Artimanha
        </h3>

        <div className="relative">
          <select
            value={selecao}
            onChange={(e) => setSelecao(e.target.value)}
            className="w-full h-9 bg-slate-950 border border-slate-700 rounded pl-2 pr-7 text-sm text-white appearance-none focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
          >
            <option value="">Escolha uma artimanha...</option>
            {opcoesDisponiveis.map((a) => (
              <option key={a.nome} value={a.nome}>
                {a.nome}{a.repetivel ? " (repetível)" : ""}
              </option>
            ))}
            <option value={CUSTOM_KEY}>✦ Artimanha Customizada</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        </div>

        {/* Preview da descrição oficial */}
        {oficialSelecionada && (
          <div className="bg-slate-900/50 border border-slate-800 rounded p-3 space-y-2">
            {oficialSelecionada.requisito && (
              <p className="text-[10px] uppercase tracking-widest text-amber-400/80 font-bold flex items-center gap-1">
                <Info className="w-3 h-3" /> Requisito: {oficialSelecionada.requisito}
              </p>
            )}
            <p className="text-xs text-slate-400 leading-relaxed">{oficialSelecionada.descricao}</p>
          </div>
        )}

        {/* Campos para artimanha customizada */}
        {selecao === CUSTOM_KEY && (
          <div className="space-y-2">
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
          </div>
        )}

        <SmallButton onClick={handleAdd} variant="primary" disabled={!podeAdicionar}>
          <Plus className="w-3 h-3" /> Adicionar
        </SmallButton>
      </div>
    </div>
  );
}
