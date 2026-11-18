import React from "react";
import { Activity, Clock, Dices, EyeOff, Heart, Inbox, MessageSquare, ScrollText, SkipForward, Swords } from "lucide-react";

/**
 * As linhas do Registro de uma Sala (etapa 7c, 2026-11-18): a lista que o painel da Sala (ao vivo) e o Encontro Finalizado
 * (guardado) mostram igual. `linhas` vem de `linhasDoRegistro` e `linhasDoFinalizado` (`src/nuvem/sala-telas.js`), da mais
 * antiga para a mais nova. O ícone diz o tipo (D-32: a cor sozinha não diz), a rolagem escondida leva a palavra Escondida.
 */

const ICONES = {
  dano: Swords, cura: Heart, turno: SkipForward, rodada: Clock, chat: MessageSquare, rolagem: Dices, escondida: EyeOff,
  pedido: Inbox, operacao: Activity, sistema: Clock, livre: ScrollText,
};

const hora = (t) => {
  const d = new Date(t);
  return Number.isFinite(d.getTime()) ? d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "";
};

export default function LinhasDoRegistro({ linhas, className = "", refLista = null }) {
  return (
    <ol className={`ec-linhas ${className}`.trim()} ref={refLista} aria-label="Registro da Sala">
      {linhas.map((l) => {
        const Icone = ICONES[l.tipo] ?? ScrollText;
        const comAutor = l.especie === "operacao" || l.especie === "pedido";
        return (
          <li key={l.chave} className="ec-linha" data-tipo={l.tipo} data-estado={l.estado ?? undefined}>
            <Icone aria-hidden="true" />
            <span className="ec-linha-texto">
              {comAutor && <span className="ec-linha-quem">{l.autor}</span>}
              {l.escondida && <span className="afty-chip ec-linha-marca">Escondida</span>}
              {l.texto}
            </span>
            <time className="ec-linha-hora">{hora(l.quando)}</time>
          </li>
        );
      })}
    </ol>
  );
}
