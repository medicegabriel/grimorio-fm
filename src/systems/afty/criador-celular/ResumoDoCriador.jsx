/* ============================================================
   A FAIXA DE RESUMO DO CRIADOR NO CELULAR (app Era de Ouro, etapa E6, 2026-11-20)
   ============================================================
   No telefone a prévia inteira (`AftyPreview`) vinha ANTES do formulário, e o campo Nome ficava a 1.225 px do topo. Ela sai do
   fluxo e fica a um toque: esta faixa, presa logo abaixo do cabeçalho, mostra Vida, o recurso, Defesa e CD, e tocar num deles
   abre a prévia inteira numa folha. Segurar um número mostra de onde ele vem (o painel de origem de sempre, pelo toque longo de
   `ui/fontes-toque.js`). Nas pontas, Anterior e Próxima andam pelas seções. Escondida acima de 720 px.
   ============================================================ */
import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import FolhaInferior from "../../../celular/FolhaInferior";
import { PainelDeFontes } from "../ui/fontes";
import { numerosDoResumo, vizinhas } from "./secoes";

const TOM = { vida: "text-purple-300", energia: "text-sky-400" };

function Ponta({ secao, lado, onIr }) {
  const Icone = lado === "anterior" ? ChevronLeft : ChevronRight;
  return (
    <button type="button" disabled={!secao} onClick={() => secao && onIr(secao.id)}
      aria-label={secao ? `${lado === "anterior" ? "Seção Anterior" : "Próxima Seção"}: ${secao.label}` : (lado === "anterior" ? "Sem Seção Anterior" : "Sem Próxima Seção")}
      className="shrink-0 inline-flex items-center justify-center w-11 h-11 rounded-lg text-slate-300 hover:bg-slate-800 disabled:opacity-30">
      <Icone className="w-5 h-5" aria-hidden="true" />
    </button>
  );
}

export default function ResumoDoCriador({ derived, secoes, atual, onIr, previa }) {
  const [aberta, setAberta] = useState(false);
  const { anterior, proxima } = vizinhas(secoes, atual);
  const numeros = numerosDoResumo(derived);
  return (
    <div className="criador-celular-resumo min-[721px]:hidden flex items-center gap-1 px-1 h-12 border-t border-slate-800/70">
      <Ponta secao={anterior} lado="anterior" onIr={onIr} />
      <div className="flex-1 min-w-0 grid grid-cols-4 gap-1">
        {numeros.map((n, i) => {
          const partes = (derived.partes?.[n.p] ?? []).filter(Boolean);
          return (
            <span key={n.p} className="relative group min-w-0">
              <button type="button" onClick={() => setAberta(true)} aria-label={`${n.k} ${n.v}. Abrir Prévia`}
                className="w-full h-11 rounded-lg flex flex-col items-center justify-center leading-none hover:bg-slate-800/70">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 truncate max-w-full">{n.k}</span>
                <span className={`mt-1 font-mono text-base font-bold tabular-nums ${TOM[n.tom] ?? "text-white"}`}>{n.v}</span>
              </button>
              {partes.length > 0 && <PainelDeFontes partes={partes} total={n.v} ancora={i < 2 ? "esquerda" : "direita"} />}
            </span>
          );
        })}
      </div>
      <Ponta secao={proxima} lado="proxima" onIr={onIr} />
      <FolhaInferior aberta={aberta} onFechar={() => setAberta(false)} titulo="Prévia">
        {previa}
      </FolhaInferior>
    </div>
  );
}
