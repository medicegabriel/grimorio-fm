/* A barra de baixo da Guilda no celular (app Era de Ouro, etapa E8, 2026-11-20): Fichas, Encontros, Sala e Mais. Cada item com
   56 px de altura, mais a área segura do aparelho (D-89). Some na Ficha, no criador e na luta, que têm o próprio Voltar. */
import React from "react";
import { DoorOpen, Menu, Swords, Users } from "lucide-react";
import { abasDaCasca } from "./lista-fichas";

const ICONE = { fichas: Users, encontros: Swords, sala: DoorOpen, mais: Menu };

export default function BarraInferior({ aba, onAba, nuvem }) {
  return (
    <nav className="fm-barra-inferior" aria-label="Seções da Guilda">
      {abasDaCasca(nuvem).map((a) => {
        const Icone = ICONE[a.id];
        return (
          <button key={a.id} type="button" className="fm-barra-item" aria-current={a.id === aba ? "page" : undefined} onClick={() => onAba(a.id)}>
            <Icone aria-hidden="true" />
            <span>{a.rotulo}</span>
          </button>
        );
      })}
    </nav>
  );
}
