import { lazy, Suspense, useId, useRef, useState } from "react";
import { DoorOpen, Ghost, HeartHandshake, Home, LibraryBig, Menu, MessagesSquare, Swords, UserRound, X } from "lucide-react";
import { nuvemAtiva } from "../nuvem/nuvem-config";
import MarcaFichaFm from "./MarcaFichaFm";
import "./barra-lateral-site.css";

const ContaNuvem = lazy(() => import("../nuvem/ContaNuvem"));

export default function BarraLateralSite({ atual, inicio = "/", encontros = "/Criatura/Encontros", onEncontros }) {
  const [aberto, setAberto] = useState(false);
  const botao = useRef(null);
  const id = useId();
  const inicioDasSecoes = atual === "inicio" ? "" : inicio;
  const grupos = [
    [
      { id: "inicio", rotulo: "Início", href: inicio, Icone: Home },
      { id: "player", rotulo: "Jogador", href: "/Jogador", Icone: UserRound },
      { id: "criatura", rotulo: "Criatura", href: "/Criatura", Icone: Ghost },
      { id: "encontros", rotulo: "Encontros", href: encontros, Icone: Swords, onIr: onEncontros },
    ],
    [
      { id: "salas", rotulo: "Salas", href: inicioDasSecoes + "#salas", Icone: DoorOpen },
      { id: "livros", rotulo: "Livros e Regras", href: inicioDasSecoes + "#livros-e-regras", Icone: LibraryBig },
      { id: "comunidade", rotulo: "Comunidade", href: "/Comunidade", Icone: MessagesSquare },
      { id: "catarse", rotulo: "Catarse", Icone: HeartHandshake },
    ],
  ];

  function fecharComEscape(evento) {
    if (!aberto || evento.key !== "Escape") return;
    setAberto(false);
    botao.current?.focus();
  }

  function seguirLink(evento, onIr) {
    if (evento.defaultPrevented || evento.button !== 0 || evento.metaKey || evento.ctrlKey || evento.shiftKey || evento.altKey) return;
    setAberto(false);
    if (!onIr) return;
    evento.preventDefault();
    onIr();
  }

  return (
    <aside className="barra-lateral-site" onKeyDown={fecharComEscape}>
      <MarcaFichaFm href={inicio} />
      <button type="button" className="barra-lateral-menu" ref={botao} aria-expanded={aberto} aria-controls={id}
        onClick={() => setAberto((valor) => !valor)}>
        {aberto ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />} Menu
      </button>
      <div id={id} className="barra-lateral-acessos" data-aberto={aberto}>
        <nav className="barra-lateral-navegacao" aria-label="Menu Principal">
          {grupos.map((grupo) => (
            <div className="barra-lateral-grupo" key={grupo[0].id}>
              {grupo.map(({ id: destino, rotulo, href, Icone, onIr }) => href ? (
                <a key={destino} href={href} title={rotulo} aria-current={atual === destino ? "page" : undefined}
                  onClick={(evento) => seguirLink(evento, onIr)}>
                  <Icone aria-hidden="true" /><span>{rotulo}</span>
                </a>
              ) : (
                <button key={destino} type="button" disabled title="Destino a Definir">
                  <Icone aria-hidden="true" /><span>{rotulo}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>
        {nuvemAtiva && (
          <div className="barra-lateral-conta">
            <Suspense fallback={null}><ContaNuvem lateral /></Suspense>
          </div>
        )}
      </div>
    </aside>
  );
}
