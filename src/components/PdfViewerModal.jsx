// PdfViewerModal.jsx
// ============================================================
// Modal embutido que exibe um PDF do sistema numa iframe (visualizador
// nativo do navegador). Segue o mesmo padrão dos demais modais do app:
// createPortal + overlay fixed z-[100] + fechar ao clicar fora / Esc.
// ============================================================
// Fallback: em muitos navegadores mobile a iframe de PDF não renderiza,
// por isso "Abrir em nova aba" fica em destaque no cabeçalho.
// ============================================================

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { FileText, ExternalLink, Download, X } from "lucide-react";

export default function PdfViewerModal({ doc, onClose }) {
  // Fecha com Esc (mesma conveniência de um modal padrão).
  useEffect(() => {
    if (!doc) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [doc, onClose]);

  if (!doc) return null;

  // Nomes de arquivo têm espaços/acentos → encodeURI garante URL válida.
  const src = encodeURI(doc.file);

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800">
          <FileText className="w-4 h-4 text-purple-400 shrink-0" />
          <h3 className="text-sm font-bold text-slate-100 truncate">{doc.label}</h3>

          <div className="ml-auto flex items-center gap-1.5">
            <a
              href={src}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-semibold text-white bg-purple-800 hover:bg-purple-700 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Nova aba</span>
            </a>
            <a
              href={src}
              download
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Baixar</span>
            </a>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar"
              className="ml-1 text-slate-500 hover:text-slate-200 focus:outline-none"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Corpo — iframe do PDF (visualizador nativo) */}
        <div className="flex-1 min-h-0 bg-slate-950 rounded-b-xl">
          <iframe
            src={src}
            title={doc.label}
            className="w-full h-full rounded-b-xl border-0"
          />
        </div>

        {/* Fallback textual — aparece atrás da iframe quando ela não renderiza
            (ex.: alguns navegadores mobile). */}
        <p className="px-4 py-1.5 text-center text-[11px] text-slate-500 border-t border-slate-800">
          Não carregou?{" "}
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-400 hover:text-purple-300 underline"
          >
            Abrir em nova aba
          </a>
        </p>
      </div>
    </div>,
    document.body,
  );
}
