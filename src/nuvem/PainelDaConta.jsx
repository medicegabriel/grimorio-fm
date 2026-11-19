/* O corpo do menu da Conta: entrar com Google ou Discord, ver o estado da
   sincronização e sair. Extraído de ContaNuvem.jsx em 2026-11-19, porque o mesmo
   corpo serve ao menu suspenso do computador e à folha de baixo do celular (e, na
   casca da Guilda, ao menu Mais). */

import { Cloud, CloudOff, LogOut, RefreshCw } from "lucide-react";
import { entrar, sair } from "./nuvem-sync";
import { ROTULO_FASE } from "./conta-rotulos";

function IconeGoogle() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" aria-hidden="true">
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.8-5.5 3.8-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.2 14.6 2.2 12 2.2 6.6 2.2 2.2 6.6 2.2 12s4.4 9.8 9.8 9.8c5.7 0 9.4-4 9.4-9.6 0-.6-.1-1.1-.2-1.6H12z" />
    </svg>
  );
}
function IconeDiscord() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" aria-hidden="true">
      <path fill="#5865F2" d="M20.3 4.4A19.8 19.8 0 0 0 15.4 3l-.6 1.3a18.4 18.4 0 0 0-5.6 0L8.6 3a19.7 19.7 0 0 0-4.9 1.5C.6 9.1-.3 13.6.1 18.1a19.9 19.9 0 0 0 6 3l1.3-2.1c-.7-.3-1.4-.6-2-1l.5-.4a14.2 14.2 0 0 0 12.2 0l.5.4c-.6.4-1.3.7-2 1l1.3 2.1a19.8 19.8 0 0 0 6-3c.5-5.2-.8-9.7-3.6-13.7zM8.3 15.3c-1.2 0-2.2-1.1-2.2-2.4s1-2.4 2.2-2.4 2.2 1.1 2.2 2.4-1 2.4-2.2 2.4zm7.4 0c-1.2 0-2.2-1.1-2.2-2.4s1-2.4 2.2-2.4 2.2 1.1 2.2 2.4-1 2.4-2.2 2.4z" />
    </svg>
  );
}

export function IconeEstado({ fase }) {
  if (fase === "erro") return <CloudOff className="w-4 h-4 shrink-0 text-amber-400" />;
  if (fase === "enviando" || fase === "sincronizando" || fase === "entrando")
    return <RefreshCw className="w-4 h-4 shrink-0 animate-spin text-slate-300" />;
  return <Cloud className="w-4 h-4 shrink-0 text-emerald-400" />;
}

/* `grande`: itens de 44 px, para o dedo (a folha de baixo do celular). */
export default function PainelDaConta({ estado, aoFechar, grande = false }) {
  const { usuario, fase } = estado;
  const item = `w-full flex items-center gap-2 px-3 text-left text-sm text-slate-200 hover:bg-slate-800 rounded ${grande ? "min-h-11" : "py-2"}`;

  if (usuario) {
    return (
      <>
        <div className="px-3 py-2 border-b border-slate-800 mb-1">
          <div className="text-sm font-semibold text-white truncate">{usuario.nome}</div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
            <IconeEstado fase={fase} />
            {ROTULO_FASE[fase] ?? ""}
          </div>
        </div>
        <button type="button" role="menuitem" className={item} onClick={() => { aoFechar?.(); sair(); }}>
          <LogOut className="w-4 h-4 shrink-0" />
          Sair
        </button>
      </>
    );
  }
  return (
    <>
      <button type="button" role="menuitem" className={item} onClick={() => entrar("google")}>
        <IconeGoogle />
        Entrar com Google
      </button>
      <button type="button" role="menuitem" className={item} onClick={() => entrar("discord")}>
        <IconeDiscord />
        Entrar com Discord
      </button>
      {fase === "erro" && (
        <div className="px-3 py-2 text-xs text-amber-400">Falha ao Entrar</div>
      )}
    </>
  );
}
