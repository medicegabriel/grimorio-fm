/* Botão da Conta no cabeçalho: entrar com Google ou Discord, ver o estado da
   sincronização e sair. Sem a nuvem configurada ele não desenha nada.

   ⚠ NO CELULAR O MENU É UMA FOLHA DE BAIXO (2026-11-19). O menu suspenso
   (`absolute right-0 w-56`) se alinha à borda direita do botão, e na lista da Guilda o
   botão fica perto da esquerda: no telefone o menu abria cortado ("com Google",
   "com Discord"). A folha vai pelo `FolhaInferior`, que usa portal. Um `fixed` no lugar
   não serviria, porque o cabeçalho tem `backdrop-filter` e prenderia a folha. */

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { LogIn } from "lucide-react";
import { nuvemAtiva } from "./nuvem-config";
import { lerEstadoNuvem, ouvirNuvem } from "./nuvem-sync";
import PainelDaConta, { IconeEstado } from "./PainelDaConta";
import { ROTULO_FASE } from "./conta-rotulos";
import FolhaInferior from "../celular/FolhaInferior";
import { useCelular } from "../celular/usar-celular";

const BOTAO = "inline-flex items-center justify-center gap-1.5 h-9 min-w-9 lg:px-3 shrink-0 rounded bg-slate-800 hover:bg-slate-700 text-sm font-semibold text-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500/60";

export default function ContaNuvem({ lateral = false }) {
  const estado = useSyncExternalStore(ouvirNuvem, lerEstadoNuvem);
  const [aberto, setAberto] = useState(false);
  const celular = useCelular(lateral ? "(max-width: 760px), (max-height: 500px) and (pointer: coarse)" : undefined);
  const raiz = useRef(null);

  /* Fechar ao tocar fora vale só para o menu suspenso. A folha tem véu próprio, e
     um toque DENTRO dela (que vai para o body, fora de `raiz`) não pode fechá-la. */
  useEffect(() => {
    if (!aberto || celular) return undefined;
    const fechar = (e) => { if (!raiz.current?.contains(e.target)) setAberto(false); };
    const tecla = (e) => { if (e.key === "Escape") setAberto(false); };
    document.addEventListener("pointerdown", fechar);
    document.addEventListener("keydown", tecla);
    return () => {
      document.removeEventListener("pointerdown", fechar);
      document.removeEventListener("keydown", tecla);
    };
  }, [aberto, celular]);

  if (!nuvemAtiva) return null;
  const { usuario, fase } = estado;
  const fecharMenu = () => setAberto(false);

  return (
    <div ref={raiz} className="relative shrink-0">
      <button
        type="button"
        className={BOTAO}
        onClick={() => setAberto((v) => !v)}
        aria-haspopup={celular ? "dialog" : "menu"}
        aria-expanded={aberto}
        title={usuario ? `${usuario.nome} (${ROTULO_FASE[fase] ?? "Conta"})` : "Entrar"}
      >
        {usuario ? (
          <>
            {usuario.avatar
              ? <img src={usuario.avatar} alt="" className="w-6 h-6 rounded object-cover" referrerPolicy="no-referrer" />
              : <span className="w-6 h-6 rounded bg-purple-700 grid place-items-center text-xs">{usuario.nome.slice(0, 1).toUpperCase()}</span>}
            <IconeEstado fase={fase} />
          </>
        ) : (
          <>
            {fase === "entrando" || fase === "sincronizando" ? <IconeEstado fase={fase} /> : <LogIn className="w-4 h-4 shrink-0" />}
            <span className="hidden lg:inline">Entrar</span>
          </>
        )}
      </button>

      {celular ? (
        <FolhaInferior aberta={aberto} onFechar={fecharMenu} titulo={usuario ? "Conta" : "Entrar"}>
          <div role="menu">
            <PainelDaConta estado={estado} aoFechar={fecharMenu} grande />
          </div>
        </FolhaInferior>
      ) : aberto && (
        <div role="menu" className={`absolute w-56 z-50 rounded border border-slate-700 bg-slate-900 p-1 shadow-xl ${lateral ? "bottom-0 left-full ml-2" : "right-0 top-full mt-2"}`}>
          <PainelDaConta estado={estado} aoFechar={fecharMenu} />
        </div>
      )}
    </div>
  );
}
