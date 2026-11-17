/* Aviso do endereço antigo. Só desenha no host antigo exato e com o endereço
   novo configurado (VITE_DOMINIO_NOVO). */

import { useState } from "react";
import { ArrowRight, Check, Send } from "lucide-react";
import { ORIGEM_NOVA, ehHostAntigo } from "./nuvem-config";
import { levarFichas } from "./nuvem-mudanca";

export default function AvisoMudanca() {
  const [enviado, setEnviado] = useState(false);
  if (!ehHostAntigo()) return null;
  const host = new URL(ORIGEM_NOVA).host;
  return (
    // A borda direita fica livre para o botão do Livro de Regras (PdfFab).
    <div className="fixed left-0 right-20 sm:right-24 bottom-0 z-[130] border-t border-r border-purple-700 bg-slate-950/95 backdrop-blur px-4 py-3">
      <div className="mx-auto max-w-[1600px] flex flex-wrap items-center gap-3">
        <strong className="text-white text-sm sm:text-base mr-auto">O Grimório Mudou para {host}</strong>
        <button
          type="button"
          onClick={() => levarFichas({ aoEnviar: () => setEnviado(true) })}
          className="inline-flex items-center gap-1.5 h-9 px-3 rounded bg-purple-600 hover:bg-purple-500 text-sm font-semibold text-white"
        >
          {enviado ? <Check className="w-4 h-4" /> : <Send className="w-4 h-4" />}
          {enviado ? "Fichas Enviadas" : "Levar Minhas Fichas"}
        </button>
        <a
          href={ORIGEM_NOVA + location.pathname}
          className="inline-flex items-center gap-1.5 h-9 px-3 rounded bg-slate-800 hover:bg-slate-700 text-sm font-semibold text-slate-200 no-underline"
        >
          Abrir {host}
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}
