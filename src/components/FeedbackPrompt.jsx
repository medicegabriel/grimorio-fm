// FeedbackPrompt.jsx
// ============================================================
// Pop-up de feedback + link fixo no rodapé.
//
// - FeedbackPopup: aparece UMA vez por abertura do site (por sessão).
//   Como o app é uma SPA, o App monta uma única vez, então o pop-up
//   não reaparece enquanto a pessoa navega. Ao recarregar/reabrir o
//   site, ele volta a aparecer — a menos que a pessoa tenha clicado
//   em "Não ver novamente", que grava a escolha no localStorage.
//
// - FeedbackFooter: link discreto no rodapé para acessar o formulário
//   a qualquer momento.
// ============================================================

import { useEffect, useState } from "react";
import { MessageSquareHeart, X } from "lucide-react";

// Link do Google Forms de feedback.
export const FEEDBACK_FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSeSLOgfL7zW8awBxbnRRcJHJjr_njYkMXsQduTnK-rzdXi_eA/viewform?usp=publish-editor";

// Chave do localStorage: "1" = a pessoa optou por não ver mais o pop-up.
const HIDE_KEY = "grimorio-feedback-hidden";

const isHidden = () => {
  try {
    return localStorage.getItem(HIDE_KEY) === "1";
  } catch {
    return false;
  }
};

export function FeedbackPopup() {
  // Só mostra se a pessoa ainda não pediu para esconder de vez.
  const [open, setOpen] = useState(() => !isHidden());

  // Fecha com a tecla Esc.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) return null;

  const dismissForever = () => {
    try {
      localStorage.setItem(HIDE_KEY, "1");
    } catch {
      // Ignora ambientes sem localStorage (ex.: modo privado restrito).
    }
    setOpen(false);
  };

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm print:hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-title"
      onClick={() => setOpen(false)}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl shadow-purple-950/40"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Fechar (reaparece na próxima vez que abrir o site) */}
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Fechar"
          className="absolute top-4 right-4 z-10 p-1.5 rounded-full text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Faixa de destaque no topo */}
        <div className="bg-gradient-to-br from-purple-800/40 to-slate-900 px-8 pt-9 pb-7 border-b border-slate-800">
          <div className="w-14 h-14 rounded-2xl bg-purple-700/30 border border-purple-600/60 flex items-center justify-center mb-5">
            <MessageSquareHeart className="w-7 h-7 text-purple-300" />
          </div>
          <span className="inline-block mb-3 px-2.5 py-1 rounded-full bg-purple-600/20 border border-purple-600/40 text-xs font-semibold uppercase tracking-wide text-purple-200">
            Grimório em hotfix
          </span>
          <h2 id="feedback-title" className="text-xl font-bold text-slate-50 leading-snug">
            O que você achou do Grimório?
          </h2>
        </div>

        {/* Corpo */}
        <div className="px-8 pt-6 pb-8">
          <p className="text-sm text-slate-300 leading-relaxed">
            O <span className="font-semibold text-purple-300">Grimório</span> está
            passando por uma rodada de ajustes e correções. Sua opinião sobre ele e
            sobre o site é essencial pra deixar tudo redondo.
          </p>
          <p className="mt-3 text-sm text-slate-400 leading-relaxed">
            São poucas perguntas rápidas e leva menos de um minuto.
          </p>

          <a
            href={FEEDBACK_FORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="mt-7 block w-full text-center px-4 py-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold shadow-lg shadow-purple-900/40 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-400"
          >
            Responder o formulário
          </a>

          <div className="mt-5 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-sm font-medium text-slate-300 hover:text-slate-100 transition-colors"
            >
              Agora não
            </button>
            <button
              type="button"
              onClick={dismissForever}
              className="text-sm font-medium text-slate-500 hover:text-slate-300 transition-colors"
            >
              Não ver novamente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function FeedbackFooter() {
  return (
    <footer className="w-full py-6 px-4 text-center border-t border-slate-800 bg-slate-950 print:hidden">
      <p className="text-sm text-slate-400">
        Tem uma sugestão sobre o Grimório ou o site?{" "}
        <a
          href={FEEDBACK_FORM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 font-semibold text-purple-400 hover:text-purple-300 underline decoration-purple-700/50 underline-offset-2 transition-colors"
        >
          <MessageSquareHeart className="w-4 h-4" />
          Deixe seu feedback
        </a>
      </p>
    </footer>
  );
}
