/* ============================================================
   PEÇAS COMUNS DAS TRÊS ABAS DA PRÉVIA (Ações, Perícias, Equipamentos)
   ============================================================
   Seção, alvo de rolagem com disponibilidade, motivo visível e o destaque da busca. Escopo `.e-g2 .m-aba` (`abas-g2.css`): nada daqui
   pinta a clássica, o criador ou o Encontro.
   ============================================================ */
import React, { useId } from "react";
import { AlertTriangle } from "lucide-react";
import { NumeroComFontes } from "../../ui/fontes";

/** Um grupo de linhas com título e contagem, no desenho dos grupos de Habilidades do G2. */
export function Secao({ id, titulo, contagem = null, controles = null, children, className = "" }) {
  const idTitulo = useId();
  return (
    <section className={`afty-card e-grupo m-secao ${className}`} aria-labelledby={idTitulo} data-m-secao={id}>
      <header className="e-grupo-topo m-secao-topo">
        <h2 id={idTitulo} className="afty-card-titulo e-grupo-titulo" tabIndex={-1}>
          {titulo}{contagem != null && <small>{contagem}</small>}
        </h2>
        {controles && <div className="m-secao-controles">{controles}</div>}
      </header>
      <div className="m-secao-corpo">{children}</div>
    </section>
  );
}

/** O motivo de uma operação recusada, VISÍVEL na linha (o toque não tem `title`) e ligado ao botão por `aria-describedby`. */
export function Motivo({ id, texto }) {
  if (!texto) return null;
  return (
    <span id={id} className="m-motivo" data-m-motivo="">
      <AlertTriangle aria-hidden="true" />
      {texto}
    </span>
  );
}

/**
 * Um alvo que ROLA: rótulo curto e o número. O clique rola (gesto do `NumeroComFontes`), as fontes abrem no hover, no foco do teclado e
 * no toque longo. Indisponível, continua focável: o clique anuncia o motivo pelo aviso do G2 e não rola nada.
 * `motivo` vem de quem chama (a disponibilidade real da operação). `idMotivo` aponta o texto visível na linha.
 */
export function Rolar({ rotulo = null, valor, partes, total, onRolar, motivo = null, idMotivo, avisar, ancora = "direita", titulo, className = "" }) {
  const nome = [rotulo, valor].filter(Boolean).join(" ");
  return (
    <span className={`m-rolar ${className}`} data-indisponivel={motivo ? "sim" : undefined}>
      {rotulo && <span className="m-rolar-rotulo" aria-hidden="true">{rotulo}</span>}
      <NumeroComFontes
        valor={valor}
        partes={partes}
        total={total ?? valor}
        formatar={false}
        className="afty-valor m-rolar-num"
        ancora={ancora}
        titulo={titulo}
        rotuloAria={motivo ? `${nome}, ${motivo}` : nome}
        indisponivel={!!motivo}
        descritoPor={motivo ? idMotivo : undefined}
        onRolar={motivo ? () => avisar?.(motivo) : onRolar}
      />
    </span>
  );
}

/** Estado vazio de uma lista, com a saída quando é filtro. */
export function Vazio({ texto, acao = null }) {
  return (
    <div className="e-vazio m-vazio" role="status">
      <p>{texto}</p>
      {acao}
    </div>
  );
}
