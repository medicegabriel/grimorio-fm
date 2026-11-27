import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Info } from "lucide-react";
import {
  definirPreferencia, lerPreferencia, ouvirPreferencia, ID_PREFERENCIAS_BALANCEAMENTO, LINK_PREFERENCIAS_BALANCEAMENTO,
} from "./coleta.js";

const link = "underline underline-offset-4 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-400";
const botao = "min-h-10 shrink-0 rounded-md border border-slate-600 px-3 text-sm font-semibold text-slate-100 hover:bg-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-400";

export function AvisoDeColeta() {
  const [visivel, setVisivel] = useState(() => lerPreferencia() === null);
  const preferencia = useSyncExternalStore(ouvirPreferencia, lerPreferencia);

  useEffect(() => {
    if (!visivel || preferencia !== null) return undefined;
    // Dar tempo de exibir o aviso antes de habilitar o primeiro envio.
    let depois = 0;
    const antes = requestAnimationFrame(() => {
      depois = requestAnimationFrame(() => {
        if (lerPreferencia() === null) definirPreferencia("ativa");
      });
    });
    return () => {
      cancelAnimationFrame(antes);
      cancelAnimationFrame(depois);
    };
  }, [preferencia, visivel]);

  if (!visivel || preferencia === "desativada") return null;
  return (
    <aside aria-label="Coleta de Dados para Balanceamento" className="border-b border-slate-700 bg-slate-900 text-slate-100">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2.5 px-4 py-3">
        <div className="flex min-w-56 flex-1 items-start gap-2.5 text-sm">
          <Info className="mt-0.5 shrink-0 text-violet-300" size={17} aria-hidden="true" />
          <p>
            O site coleta informações sobre suas escolhas na ficha, como especializações e aptidões,
            para ajudar a balancear e melhorar o sistema. Você pode desativar essa opção nas
            {" "}<a className={link} href={LINK_PREFERENCIAS_BALANCEAMENTO}>Preferências de Privacidade</a>.
          </p>
        </div>
        <div className="ml-auto flex gap-2">
          <button type="button" className={botao} onClick={() => {
            if (lerPreferencia() === null) definirPreferencia("ativa");
            setVisivel(false);
          }}>Entendi</button>
        </div>
      </div>
    </aside>
  );
}

export function PreferenciaDeColeta() {
  const preferencia = useSyncExternalStore(ouvirPreferencia, lerPreferencia);
  const detalhes = useRef(null);
  useEffect(() => {
    const abrirPorLink = () => {
      const elemento = detalhes.current;
      if (!elemento || location.hash !== `#${ID_PREFERENCIAS_BALANCEAMENTO}`) return;
      elemento.open = true;
      elemento.scrollIntoView({ block: "nearest" });
      elemento.querySelector("summary")?.focus({ preventScroll: true });
    };
    abrirPorLink();
    window.addEventListener("hashchange", abrirPorLink);
    return () => window.removeEventListener("hashchange", abrirPorLink);
  }, []);
  return (
    <details
      ref={detalhes}
      id={ID_PREFERENCIAS_BALANCEAMENTO}
      className="mx-auto mb-2 max-w-lg text-sm open:mb-4"
    >
      <summary className={`${link} cursor-pointer`}>Preferências de Privacidade</summary>
      <label className="mt-3 inline-flex min-h-10 cursor-pointer items-center gap-2 text-slate-100">
        <input
          className="size-4 accent-violet-400"
          type="checkbox"
          checked={preferencia !== "desativada"}
          onChange={(e) => definirPreferencia(e.target.checked ? "ativa" : "desativada")}
        />
        Enviar Escolhas da Ficha para Balanceamento
      </label>
    </details>
  );
}
