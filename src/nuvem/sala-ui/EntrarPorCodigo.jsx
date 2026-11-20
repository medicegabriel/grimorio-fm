/* ============================================================
   ENTRAR NUMA SALA PELO CÓDIGO OU PELO LINK (etapa E7 do app Era de Ouro, 2026-11-20)
   ============================================================
   Até aqui só se entrava numa Sala pelo link. Quem recebeu o código falado na mesa, ou o link num grupo de onde não dá para
   tocar, ficava sem porta. O botão Sala do cabeçalho da Guilda abre um campo que aceita o código ("K7M2QX") ou o link inteiro
   colado (`codigoDoTexto`), e Entrar vai para `/Sala/<código>`, onde o login e a senha seguem como sempre.

   No celular o campo abre na folha de baixo (D-87). No computador, num painel preso ao botão. Os dois fecham no Voltar.
   Só existe com a nuvem ligada: sem conta não há Sala.
   ============================================================ */
import React, { useEffect, useRef, useState } from "react";
import { AlertTriangle, DoorOpen } from "lucide-react";
import FolhaInferior from "../../celular/FolhaInferior";
import { useCamadaDeVoltar } from "../../celular/camadas";
import { useCelular } from "../../celular/usar-celular";
import { codigoDoTexto } from "./sala-ui-dados";

const BOTAO = "inline-flex items-center justify-center gap-1.5 h-9 min-w-9 px-2 lg:px-3 shrink-0 rounded bg-slate-800 hover:bg-slate-700 text-sm font-semibold text-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500/60";

export function FormularioDeCodigo({ grande = false }) {
  const [texto, setTexto] = useState("");
  const [invalido, setInvalido] = useState(false);
  const entrar = (e) => {
    e.preventDefault();
    const codigo = codigoDoTexto(texto);
    if (!codigo) { setInvalido(true); return; }
    location.assign(`/Sala/${codigo}`);
  };
  return (
    <form onSubmit={entrar} className="fm-codigo-sala grid gap-2" data-grande={grande ? "sim" : undefined}>
      <label className="grid gap-1">
        <span className="text-xs font-semibold text-slate-400">Código ou Link da Sala</span>
        <input
          value={texto}
          onChange={(e) => { setTexto(e.target.value); setInvalido(false); }}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          enterKeyHint="go"
          aria-invalid={invalido || undefined}
          className="h-11 px-3 rounded border border-slate-700 bg-slate-950 text-base text-white font-mono tracking-widest focus:outline-none focus:border-purple-500"
        />
      </label>
      {invalido && (
        <p role="alert" className="m-0! flex items-center gap-1.5 text-sm text-amber-300">
          <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />Código Inválido
        </p>
      )}
      <button type="submit" className="h-11 rounded bg-purple-700 hover:bg-purple-600 text-sm font-bold text-white">Entrar</button>
    </form>
  );
}

export default function BotaoEntrarNaSala() {
  const [aberto, setAberto] = useState(false);
  const celular = useCelular();
  const raiz = useRef(null);
  const fechar = () => setAberto(false);
  /* O painel do computador também é camada: o Voltar fecha antes de sair da lista. A folha do celular já é. */
  useCamadaDeVoltar(aberto && !celular, fechar);

  useEffect(() => {
    if (!aberto || celular) return undefined;
    const fora = (e) => { if (!raiz.current?.contains(e.target)) setAberto(false); };
    const tecla = (e) => { if (e.key === "Escape") setAberto(false); };
    document.addEventListener("pointerdown", fora);
    document.addEventListener("keydown", tecla);
    return () => {
      document.removeEventListener("pointerdown", fora);
      document.removeEventListener("keydown", tecla);
    };
  }, [aberto, celular]);

  return (
    <div ref={raiz} className="relative shrink-0">
      <button type="button" className={BOTAO} onClick={() => setAberto((v) => !v)} aria-haspopup="dialog" aria-expanded={aberto} title="Entrar numa Sala">
        <DoorOpen className="w-4 h-4 shrink-0" aria-hidden="true" />
        <span>Sala</span>
      </button>
      {celular ? (
        <FolhaInferior aberta={aberto} onFechar={fechar} titulo="Entrar numa Sala">
          <FormularioDeCodigo grande />
        </FolhaInferior>
      ) : aberto && (
        <div role="dialog" aria-label="Entrar numa Sala" className="absolute right-0 top-full mt-2 w-72 z-50 rounded border border-slate-700 bg-slate-900 p-3 shadow-xl">
          <FormularioDeCodigo />
        </div>
      )}
    </div>
  );
}
