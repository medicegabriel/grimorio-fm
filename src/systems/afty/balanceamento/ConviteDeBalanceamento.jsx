import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ArrowRight, BarChart3, Check, X } from "lucide-react";
import {
  fichasParaIncluir, incluirFichasJaSalvas, lerPreferencia, ouvirPreferencia,
  ID_PREFERENCIAS_BALANCEAMENTO, LINK_PREFERENCIAS_BALANCEAMENTO,
} from "./coleta.js";

const foco = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-300";

export default function ConviteDeBalanceamento({ fichas }) {
  const preferencia = useSyncExternalStore(ouvirPreferencia, lerPreferencia);
  const [resultado, setResultado] = useState(null);
  const [fechado, setFechado] = useState(() => location.hash === `#${ID_PREFERENCIAS_BALANCEAMENTO}`);
  const envio = useRef(null);

  useEffect(() => () => {
    envio.current?.abort();
    envio.current = null;
  }, []);
  useEffect(() => {
    if (preferencia === "desativada") envio.current?.abort();
  }, [preferencia]);

  const enviando = resultado?.estado === "enviando";
  const concluido = resultado?.estado === "concluida";
  if (fechado || preferencia === "desativada" || (!resultado && !fichasParaIncluir(fichas).length)) return null;

  async function incluir() {
    if (envio.current) return;
    const controller = new AbortController();
    envio.current = controller;
    setResultado({ estado: "enviando", conferidas: 0, total: 0 });
    const resposta = await incluirFichasJaSalvas(fichas, {
      signal: controller.signal,
      onProgresso: (progresso) => setResultado({ estado: "enviando", ...progresso }),
    });
    if (envio.current !== controller) return;
    envio.current = null;
    setResultado(controller.signal.aborted ? null : resposta);
  }

  return (
    <aside aria-labelledby="balanceamento-convite-titulo"
      className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+5rem)] z-30 max-w-88 rounded-xl border border-violet-400/35 bg-slate-900 px-3.5 pb-1 pt-2 text-slate-100 shadow-xl shadow-slate-950/70 sm:right-auto sm:bottom-5 sm:left-5 sm:w-88 print:hidden">
      <div className="flex items-center gap-2">
        <span className="grid size-7 shrink-0 place-items-center rounded-md bg-violet-400/10 text-violet-200" aria-hidden="true">
          {concluido ? <Check size={16} /> : <BarChart3 size={16} />}
        </span>
        <h2 id="balanceamento-convite-titulo" className="m-0! flex-1 text-sm! font-semibold! tracking-normal!">
          {concluido ? "Inclusão concluída" : "Suas Fichas no Balanceamento"}
        </h2>
        <button type="button" aria-label="Fechar convite" onClick={() => setFechado(true)}
          className={`${foco} -mr-1.5 grid size-9 shrink-0 place-items-center rounded-md text-slate-300 hover:bg-slate-700 hover:text-white`}>
          <X size={17} aria-hidden="true" />
        </button>
      </div>
      {concluido ? (
        <p role="status" className="m-0! mb-2! mt-1! text-sm text-slate-300">
          {resultado.enviadas === 0 ? "Nenhuma ficha elegível para incluir."
            : resultado.enviadas === 1 ? "O resumo de 1 ficha foi enviado."
              : `Os resumos de ${resultado.enviadas} fichas foram enviados.`}
        </p>
      ) : (
        <>
          <p className="m-0! mb-2! mt-1! text-sm text-slate-300">
            Envie as escolhas das fichas salvas para ajudar a balancear o sistema.
          </p>
          {enviando && resultado.total > 0 && (
            <div className="mb-2 flex items-center gap-2 text-xs text-slate-300">
              <progress aria-label="Progresso da inclusão" className="h-1.5 min-w-24 flex-1 accent-violet-400"
                value={resultado.conferidas} max={resultado.total} />
              <span>{resultado.conferidas} de {resultado.total}</span>
            </div>
          )}
          {resultado?.estado === "limite" && <p role="status" className="m-0! mb-2! text-sm text-violet-200">
            Algumas fichas ainda estão pendentes. Tente novamente em um minuto.
          </p>}
          {(resultado?.estado === "incompleta" || resultado?.estado === "interrompida") && (
            <p role="status" className="m-0! mb-2! text-sm text-violet-200">
              Algumas fichas ainda estão pendentes. Tente enviar novamente.
            </p>
          )}
          <button type="button" onClick={incluir} disabled={enviando}
            className={`${foco} flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-violet-500/70 bg-violet-700 px-3 py-2 text-sm font-bold text-white hover:border-violet-300 hover:bg-violet-600 disabled:border-slate-600 disabled:bg-slate-800`}>
            {enviando ? "Enviando Resumos…" : resultado ? "Enviar Fichas Pendentes" : "Incluir Fichas Já Salvas"}
            {!enviando && <ArrowRight size={16} className="shrink-0" aria-hidden="true" />}
          </button>
          <a className={`${foco} flex min-h-10 items-center justify-center text-xs font-medium text-slate-300 underline underline-offset-4 hover:text-white`}
            href={LINK_PREFERENCIAS_BALANCEAMENTO} onClick={() => setFechado(true)}>Desativar nas Preferências de Privacidade</a>
        </>
      )}
    </aside>
  );
}
