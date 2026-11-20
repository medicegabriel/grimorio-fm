/* ============================================================
   O CABEÇALHO DO CRIADOR NO CELULAR (app Era de Ouro, etapa E6, 2026-11-20)
   ============================================================
   No telefone o cabeçalho do criador tinha 150 px fixos: o Voltar, o título, o rascunho e o Salvar em duas linhas, e a faixa de
   abas onde cabiam 2,5 de 9. Aqui ele vira uma linha de 56 px: Voltar, o botão da seção atual (que abre a lista inteira numa folha)
   e Salvar, com um ponto quando há rascunho guardado. O título e o aviso do rascunho com o Descartar vão para a folha das seções,
   então nada some. Fica escondido acima de 720 px, onde o cabeçalho de sempre continua.

   Ele também liga a origem pelo toque longo (`ui/fontes-toque.js`) enquanto o criador está aberto.
   ============================================================ */
import React, { useEffect, useState } from "react";
import { ChevronDown, ChevronLeft, Save } from "lucide-react";
import NavegadorDeSecoes from "./NavegadorDeSecoes";
import { secaoDe } from "./secoes";
import { ligarFontesPorToque } from "../ui/fontes-toque";
import "./criador-celular.css";

export default function CabecalhoCelular({ titulo, secoes, atual, onIr, onVoltar, onSalvar, rotuloSalvar, curtoSalvar, pendente = false, rascunho = null }) {
  const [aberto, setAberto] = useState(false);
  useEffect(() => ligarFontesPorToque(), []);
  const aqui = secaoDe(secoes, atual);
  return (
    <div className="criador-celular-topo min-[721px]:hidden flex items-center gap-2 px-2 h-14">
      <button type="button" onClick={onVoltar} aria-label="Voltar"
        className="shrink-0 inline-flex items-center justify-center w-11 h-11 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700">
        <ChevronLeft className="w-5 h-5" aria-hidden="true" />
      </button>
      <button type="button" onClick={() => setAberto(true)} aria-haspopup="dialog" aria-expanded={aberto}
        aria-label={`Seção: ${aqui?.label ?? ""}. Trocar de seção`}
        className="flex-1 min-w-0 h-11 px-3 inline-flex items-center justify-between gap-2 rounded-lg border border-slate-700 bg-slate-900 text-left text-[15px] font-semibold text-white">
        <span className="truncate">{aqui?.label ?? titulo}</span>
        <ChevronDown className="w-4 h-4 shrink-0 text-slate-400" aria-hidden="true" />
      </button>
      <button type="button" onClick={onSalvar} aria-label={pendente ? `${rotuloSalvar}, há rascunho guardado` : rotuloSalvar}
        className="relative shrink-0 h-11 px-3 inline-flex items-center gap-1.5 rounded-lg bg-purple-700 hover:bg-purple-600 text-sm font-bold text-white">
        <Save className="w-4 h-4" aria-hidden="true" />
        {curtoSalvar}
        {pendente && <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-sky-400 ring-2 ring-slate-950" aria-hidden="true" />}
      </button>
      <NavegadorDeSecoes aberto={aberto} onFechar={() => setAberto(false)} titulo={titulo} secoes={secoes} atual={atual} onIr={onIr} rodape={rascunho} />
    </div>
  );
}
