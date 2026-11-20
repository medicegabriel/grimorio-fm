/* A lista das seções do criador numa folha de baixo (etapa E6 do app, 2026-11-20). Abre pelo botão da seção atual no cabeçalho do
   celular. As principais primeiro, depois o grupo Outros, cada item com 48 px. O título é o do criador (Editar Personagem, Nova
   Criatura), que no celular saiu do cabeçalho, e o pé leva o aviso do rascunho com o Descartar, que também saiu de lá. */
import React from "react";
import FolhaInferior from "../../../celular/FolhaInferior";

function Item({ secao, atual, onIr }) {
  const on = secao.id === atual;
  return (
    <button
      type="button"
      onClick={() => onIr(secao.id)}
      aria-current={on ? "page" : undefined}
      className={`w-full min-h-12 px-3 rounded-lg text-left text-[15px] font-semibold transition-colors ${
        on ? "bg-purple-700 text-white" : "text-slate-200 hover:bg-slate-800/80"
      }`}
    >
      {secao.label}
    </button>
  );
}

export default function NavegadorDeSecoes({ aberto, onFechar, titulo, secoes, atual, onIr, rodape = null }) {
  const principais = secoes.filter((s) => s.grupo === "principais");
  const outros = secoes.filter((s) => s.grupo === "outros");
  const ir = (id) => { onIr(id); onFechar(); };
  return (
    <FolhaInferior aberta={aberto} onFechar={onFechar} titulo={titulo} rotulo="Seções">
      <nav aria-label="Seções" className="grid gap-1">
        {principais.map((s) => <Item key={s.id} secao={s} atual={atual} onIr={ir} />)}
        {outros.length > 0 && (
          <>
            <div className="mt-2 px-3 pt-2 border-t border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">Outros</div>
            {outros.map((s) => <Item key={s.id} secao={s} atual={atual} onIr={ir} />)}
          </>
        )}
      </nav>
      {rodape && <div className="mt-3 flex justify-center">{rodape}</div>}
    </FolhaInferior>
  );
}
