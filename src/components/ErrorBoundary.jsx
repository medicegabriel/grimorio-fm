import React from "react";

// Prefixo das chaves de autosave do rascunho do builder (espelha
// CreatureBuilder.DRAFT_KEY_PREFIX). Mantido aqui para o botão de
// recuperação poder limpar rascunhos sem importar o builder.
const DRAFT_KEY_PREFIX = "fm_builder_draft_v1:";
const LAST_ERROR_KEY = "fm_last_error_v1";

// Canal do Discord onde os jogadores reportam o erro.
const DISCORD_REPORT_URL =
  "https://discord.com/channels/1049884632033808525/1505245226422374500";

/**
 * ============================================================
 * ErrorBoundary — rede de segurança contra crashes de render
 * ============================================================
 * Sem isto, qualquer exceção durante o render desmonta a árvore inteira
 * e o usuário fica com a tela em branco (precisa recarregar "no escuro").
 *
 * Aqui mostramos uma tela amigável com:
 *  - mensagem clara (público leigo);
 *  - botão de recarregar;
 *  - botão de "descartar rascunhos e recarregar" — escapa de um eventual
 *    loop de crash causado por um rascunho autossalvo problemático;
 *  - os detalhes técnicos do erro (para o usuário printar/copiar e reportar).
 *
 * Também guardamos o último erro em localStorage para diagnóstico posterior.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, info: null, copied: false };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    this.setState({ info });
    try {
      localStorage.setItem(
        LAST_ERROR_KEY,
        JSON.stringify({
          at: new Date().toISOString(),
          message: String(error?.message || error),
          stack: String(error?.stack || ""),
          componentStack: String(info?.componentStack || ""),
          url: typeof location !== "undefined" ? location.href : "",
          ua: typeof navigator !== "undefined" ? navigator.userAgent : "",
        })
      );
    } catch { /* localStorage indisponível — ignora */ }
    // Mantém o erro no console para quem estiver com o DevTools aberto.
    // eslint-disable-next-line no-console
    console.error("[ErrorBoundary]", error, info);
  }

  reload = () => {
    location.reload();
  };

  discardDraftsAndReload = () => {
    try {
      const toRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(DRAFT_KEY_PREFIX)) toRemove.push(k);
      }
      toRemove.forEach((k) => localStorage.removeItem(k));
    } catch { /* ignora */ }
    location.reload();
  };

  copyError = () => {
    const { error, info } = this.state;
    const text = [
      `Erro: ${error?.message || error}`,
      error?.stack ? `\nStack:\n${error.stack}` : "",
      info?.componentStack ? `\nComponente:\n${info.componentStack}` : "",
      `\nURL: ${typeof location !== "undefined" ? location.href : ""}`,
      `Navegador: ${typeof navigator !== "undefined" ? navigator.userAgent : ""}`,
    ].join("");
    try {
      navigator.clipboard?.writeText(text);
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    } catch { /* clipboard indisponível */ }
  };

  render() {
    const { error, info, copied } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden">
          <div className="p-6 border-b border-slate-800">
            <h1 className="text-xl font-bold text-white">Algo deu errado 😕</h1>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed">
              A página travou por causa de um erro inesperado. Suas fichas
              salvas estão a salvo. Tente recarregar — se continuar travando ao
              fazer a mesma coisa, use "Descartar rascunho e recarregar".
            </p>
          </div>

          <div className="p-6 flex flex-col gap-2">
            <button
              onClick={this.reload}
              className="w-full px-4 py-2.5 rounded bg-purple-700 hover:bg-purple-600 text-white text-sm font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              Recarregar a página
            </button>
            <button
              onClick={this.discardDraftsAndReload}
              className="w-full px-4 py-2.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500"
            >
              Descartar rascunho e recarregar
            </button>
          </div>

          {/* Tutorial: como capturar o erro para reportar */}
          <div className="px-6 pb-2">
            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
              <p className="text-xs font-bold text-purple-300 mb-2">
                Como me ajudar a consertar 🔧
              </p>
              <p className="text-[12px] text-slate-400 mb-3 leading-relaxed">
                Tire um print do erro e mande no nosso Discord (botão no final). Assim a gente conserta rápido!
              </p>
              <p className="text-[12px] text-slate-300 mb-2 leading-relaxed">
                <span className="font-semibold text-slate-200">📱 No celular (mais fácil):</span>
              </p>
              <ol className="list-decimal list-inside text-[12px] text-slate-400 space-y-1 mb-3 leading-relaxed">
                <li>Toque em <span className="text-slate-200 font-semibold">"Detalhes técnicos"</span> aqui embaixo para abrir.</li>
                <li>Tire um <span className="text-slate-200 font-semibold">print da tela</span> (geralmente <span className="text-slate-200">Ligar + Volume&nbsp;–</span>).</li>
                <li>Envie o print para o criador do site. Pronto!</li>
              </ol>
              <p className="text-[12px] text-slate-300 mb-2 leading-relaxed">
                <span className="font-semibold text-slate-200">💻 No computador (mais completo):</span>
              </p>
              <ol className="list-decimal list-inside text-[12px] text-slate-400 space-y-1 leading-relaxed">
                <li>Aperte <span className="text-slate-200 font-semibold">F12</span> (ou clique direito → "Inspecionar").</li>
                <li>Abra a aba <span className="text-slate-200 font-semibold">"Console"</span> no painel que aparecer.</li>
                <li>Tire um print das <span className="text-rose-300 font-semibold">mensagens em vermelho</span> e envie.</li>
              </ol>
              <p className="text-[11px] text-slate-500 mt-3">
                Dica: o botão <span className="text-slate-300">"Copiar"</span> abaixo copia o erro como texto.
              </p>

              <a
                href={DISCORD_REPORT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded font-bold text-sm text-white transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400"
                style={{ backgroundColor: "#5865F2" }}
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden="true">
                  <path d="M20.317 4.369A19.79 19.79 0 0 0 16.558 3a13.6 13.6 0 0 0-.62 1.27 18.27 18.27 0 0 0-5.487 0A12.6 12.6 0 0 0 9.83 3a19.74 19.74 0 0 0-3.76 1.37C2.07 8.18 1.41 11.89 1.74 15.56a19.93 19.93 0 0 0 6.06 3.07c.49-.67.93-1.38 1.3-2.13-.71-.27-1.39-.6-2.03-.99.17-.13.34-.26.5-.39a14.23 14.23 0 0 0 12.18 0c.16.13.33.26.5.39-.64.39-1.32.72-2.03.99.37.75.81 1.46 1.3 2.13a19.9 19.9 0 0 0 6.06-3.07c.39-4.25-.66-7.93-2.97-11.19ZM8.55 13.69c-.97 0-1.77-.9-1.77-2s.78-2 1.77-2 1.79.9 1.77 2c0 1.1-.78 2-1.77 2Zm6.9 0c-.97 0-1.77-.9-1.77-2s.78-2 1.77-2 1.79.9 1.77 2c0 1.1-.78 2-1.77 2Z" />
                </svg>
                Reportar o erro no Discord
              </a>
            </div>
          </div>

          <details open className="px-6 pb-6 group">
            <summary className="cursor-pointer text-xs uppercase tracking-wider text-slate-500 font-bold hover:text-slate-300 select-none">
              Detalhes técnicos (para reportar o bug)
            </summary>
            <div className="mt-3 flex items-center justify-between gap-2">
              <span className="text-[11px] text-slate-500">
                Tire um print disto e envie para o desenvolvedor.
              </span>
              <button
                onClick={this.copyError}
                className="text-[11px] px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 focus:outline-none"
              >
                {copied ? "Copiado!" : "Copiar"}
              </button>
            </div>
            <pre className="mt-2 max-h-60 overflow-auto rounded bg-slate-950 border border-slate-800 p-3 text-[11px] leading-relaxed text-rose-300 whitespace-pre-wrap break-words">
{String(error?.message || error)}
{error?.stack ? "\n\n" + error.stack : ""}
{info?.componentStack ? "\n\nComponente:" + info.componentStack : ""}
            </pre>
          </details>
        </div>
      </div>
    );
  }
}
