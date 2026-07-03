// PdfFab.jsx
// ============================================================
// Grupo de botões flutuantes (FAB stack) no canto inferior direito.
// O botão principal expande uma pilha com um botão por PDF (PDF_DOCS);
// clicar num PDF abre o PdfViewerModal embutido.
// ============================================================
// Global: montado no fragment raiz do App, aparece em todas as telas.
// z-40 fica abaixo dos modais (z-[100]), então o modal cobre o FAB.
// ============================================================

import { useState } from "react";
import { BookOpen, FileText, X } from "lucide-react";
import { PDF_DOCS } from "./fm-docs";
import PdfViewerModal from "./PdfViewerModal";

export default function PdfFab() {
  const [open, setOpen] = useState(false);
  const [activeDoc, setActiveDoc] = useState(null);

  // Sem documentos configurados → nada a mostrar.
  if (!PDF_DOCS.length) return null;

  const handlePick = (docItem) => {
    setActiveDoc(docItem);
    setOpen(false); // recolhe a pilha ao abrir o PDF
  };

  return (
    <>
      <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2 print:hidden">
        {/* Pilha expansível — um botão por PDF */}
        {open && (
          <div className="flex flex-col items-end gap-2">
            {PDF_DOCS.map((docItem) => (
              <button
                key={docItem.id}
                type="button"
                onClick={() => handlePick(docItem)}
                className="inline-flex items-center gap-2 pl-3 pr-4 py-2 rounded-full text-sm font-semibold text-slate-100 bg-slate-800 border border-slate-700 shadow-lg hover:bg-purple-900/60 hover:border-purple-700 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <FileText className="w-4 h-4 text-purple-400 shrink-0" />
                {docItem.label}
              </button>
            ))}
          </div>
        )}

        {/* Botão principal */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Fechar documentos" : "Abrir documentos"}
          aria-expanded={open}
          className="w-14 h-14 rounded-full flex items-center justify-center text-white bg-purple-700 hover:bg-purple-600 shadow-xl transition-colors focus:outline-none focus:ring-2 focus:ring-purple-400"
        >
          {open ? <X className="w-6 h-6" /> : <BookOpen className="w-6 h-6" />}
        </button>
      </div>

      <PdfViewerModal doc={activeDoc} onClose={() => setActiveDoc(null)} />
    </>
  );
}
