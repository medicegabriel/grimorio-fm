// PdfViewerModal.jsx
// ============================================================
// Janela flutuante que exibe um PDF do sistema numa iframe (visualizador
// nativo do navegador). NÃO é modal: sem fundo escuro e sem fechar ao clicar
// fora, para a ficha continuar editável com o livro aberto ao lado (autor,
// 2026-10-02, valendo para a 2.5.2, o /Afty e o /Player).
// ============================================================
// Arrasta pelo cabeçalho, redimensiona pelas bordas laterais, pela de baixo e
// pelos dois cantos de baixo, e minimiza para só o cabeçalho (botão ou duplo
// clique no cabeçalho). Posição e tamanho ficam no localStorage. Em tela
// estreita (< 640px) ocupa a tela inteira e não arrasta.
//
// ⚠ Minimizar NÃO desmonta a iframe. A janela encolhe por fora (overflow
// hidden) e o miolo mantém a altura cheia, então o PDF não recarrega nem
// volta para a página 1. Fechar desmonta, e aí recarrega.
//
// ⚠ Durante o arrasto a iframe fica com pointer-events: none. Sem isso o
// ponteiro que passa por cima do PDF é engolido pelo documento da iframe e a
// janela para de seguir o mouse.
//
// ⚠ Sem Esc para fechar. Com a ficha usável por trás, um Esc dado num campo
// dela (ou para fechar outro modal) fecharia o livro junto.
//
// ⚠ z-[120], acima dos modais do app (z-[100] e z-[110]), para o livro
// continuar consultável com um modal aberto.
// ============================================================
// Fallback: em muitos navegadores mobile a iframe de PDF não renderiza,
// por isso "Abrir em nova aba" fica em destaque no cabeçalho.
// ============================================================

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FileText, ExternalLink, Download, Minus, Maximize2, X } from "lucide-react";

const STORAGE_KEY = "grimorio:pdf-janela";
const BAR_H = 48;         // altura do cabeçalho (h-12), que é a altura minimizada
const MIN_W = 320;
const MIN_H = 240;
// Quanto da janela sempre fica na tela ao arrastar para fora. Saindo pela
// direita sobra o ícone e o título. Saindo pela esquerda sobra a ponta com os
// botões (~270px, que não arrastam), então a margem é maior para ainda sobrar
// título onde agarrar.
const KEEP_VISIBLE_LEFT_PART = 120;
const KEEP_VISIBLE_RIGHT_PART = 360;
const COMPACT_BELOW = 640;

const viewport = () => ({ vw: window.innerWidth, vh: window.innerHeight });

// Encostada à direita, livrando o botão do livro no canto de baixo.
function defaultGeometry({ vw, vh }) {
  const w = Math.min(760, Math.max(420, Math.floor(vw * 0.42)));
  return { x: vw - w - 16, y: 16, w, h: Math.max(MIN_H, vh - 16 - 88) };
}

function loadGeometry() {
  try {
    const g = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (g && ["x", "y", "w", "h"].every((k) => Number.isFinite(g[k]))) return g;
  } catch { /* storage bloqueado ou valor estragado: usa o padrão */ }
  return null;
}

function saveGeometry(g) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(g)); } catch { /* sem storage */ }
}

// Apara a geometria salva à janela do navegador de agora. A janela pode sair
// parcialmente pelos lados e por baixo, mas o cabeçalho nunca some.
function clampGeometry(g, { vw, vh }) {
  const w = Math.min(Math.max(g.w, MIN_W), vw);
  const h = Math.min(Math.max(g.h, MIN_H), vh);
  return {
    x: Math.min(Math.max(g.x, Math.min(0, KEEP_VISIBLE_RIGHT_PART - w)), vw - KEEP_VISIBLE_LEFT_PART),
    y: Math.min(Math.max(g.y, 0), vh - BAR_H),
    w,
    h,
  };
}

// dir combina "l", "r" e "b". O topo não redimensiona: é o cabeçalho, que arrasta.
function resizeGeometry(g0, dir, dx, dy, { vw, vh }) {
  let { x, w, h } = g0;
  if (dir.includes("r")) {
    w = Math.max(MIN_W, Math.min(g0.w + dx, Math.max(vw - g0.x, g0.w)));
  }
  if (dir.includes("l")) {
    x = Math.min(Math.max(g0.x + dx, Math.min(0, g0.x)), g0.x + g0.w - MIN_W);
    w = g0.w + (g0.x - x);
  }
  if (dir.includes("b")) {
    h = Math.max(MIN_H, Math.min(g0.h + dy, Math.max(vh - g0.y, g0.h)));
  }
  return { x, y: g0.y, w, h };
}

const isControl = (target) => target.closest("a, button");

export default function PdfViewerModal({ doc, minimized, onToggleMinimize, onClose }) {
  const [geometry, setGeometry] = useState(loadGeometry);
  const [vp, setVp] = useState(viewport);
  // Arrasto em curso: { kind, px, py, g0 }. kind é "move" ou a direção do
  // redimensionamento. Enquanto existe, a iframe não recebe ponteiro.
  const [gesture, setGesture] = useState(null);

  useEffect(() => {
    if (!doc) return;
    const onResize = () => setVp(viewport());
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [doc]);

  // Salva uma vez quando o arrasto termina, e não a cada movimento.
  useEffect(() => {
    if (!gesture && geometry) saveGeometry(geometry);
  }, [gesture, geometry]);

  if (!doc) return null;

  const compact = vp.vw < COMPACT_BELOW;
  const g = compact
    ? { x: 8, y: 8, w: vp.vw - 16, h: vp.vh - 16 }
    : clampGeometry(geometry ?? defaultGeometry(vp), vp);

  const endGesture = () => setGesture(null);

  // Props de uma alça de arrasto.
  const handle = (kind) => ({
    onPointerDown: (e) => {
      if (e.button !== 0 || isControl(e.target)) return;
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      setGesture({ kind, px: e.clientX, py: e.clientY, g0: g });
    },
    onPointerMove: (e) => {
      if (!gesture) return;
      const { px, py, g0 } = gesture;
      const dx = e.clientX - px;
      const dy = e.clientY - py;
      const now = viewport();
      setGeometry(gesture.kind === "move"
        ? clampGeometry({ ...g0, x: g0.x + dx, y: g0.y + dy }, now)
        : resizeGeometry(g0, gesture.kind, dx, dy, now));
    },
    onPointerUp: endGesture,
    onPointerCancel: endGesture,
    onLostPointerCapture: endGesture,
    style: { touchAction: "none" },
  });

  // Nomes de arquivo têm espaços/acentos → encodeURI garante URL válida.
  const src = encodeURI(doc.file);
  const resizable = !compact && !minimized;

  return createPortal(
    <div
      role="dialog"
      aria-label={doc.label}
      className="fixed z-[120] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden print:hidden"
      style={{ left: g.x, top: g.y, width: g.w, height: minimized ? BAR_H + 2 : g.h }}
    >
      {/* Miolo com a altura cheia mesmo minimizado, para a iframe não mudar de tamanho. */}
      <div className="flex flex-col" style={{ height: g.h - 2 }}>
        {/* Cabeçalho, que também é a alça de arrasto */}
        <div
          className={`h-12 shrink-0 flex items-center gap-2 px-4 select-none ${minimized ? "" : "border-b border-slate-800"} ${compact ? "" : "cursor-move"}`}
          onDoubleClick={(e) => { if (!isControl(e.target)) onToggleMinimize(); }}
          {...(compact ? {} : handle("move"))}
        >
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
              onClick={onToggleMinimize}
              aria-label={minimized ? "Restaurar" : "Minimizar"}
              className="ml-1 text-slate-500 hover:text-slate-200 focus:outline-none"
            >
              {minimized ? <Maximize2 className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar"
              className="text-slate-500 hover:text-slate-200 focus:outline-none"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Corpo — iframe do PDF (visualizador nativo) */}
        <div className="flex-1 min-h-0 bg-slate-950">
          <iframe
            src={src}
            title={doc.label}
            className="w-full h-full border-0"
            style={gesture ? { pointerEvents: "none" } : undefined}
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

      {/* Alças de redimensionamento, por cima das bordas da iframe */}
      {resizable && (
        <>
          <div className="absolute z-10 left-0 top-12 bottom-3 w-1.5 cursor-ew-resize" {...handle("l")} />
          <div className="absolute z-10 right-0 top-12 bottom-4 w-1.5 cursor-ew-resize" {...handle("r")} />
          <div className="absolute z-10 left-3 right-4 bottom-0 h-1.5 cursor-ns-resize" {...handle("b")} />
          <div className="absolute z-10 left-0 bottom-0 w-3 h-3 cursor-nesw-resize" {...handle("lb")} />
          <div
            className="absolute z-10 right-0 bottom-0 w-4 h-4 cursor-nwse-resize text-slate-500 hover:text-slate-300"
            {...handle("rb")}
          >
            <svg viewBox="0 0 16 16" className="w-4 h-4" aria-hidden="true">
              <path d="M14 6 6 14M14 10l-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
        </>
      )}
    </div>,
    document.body,
  );
}
