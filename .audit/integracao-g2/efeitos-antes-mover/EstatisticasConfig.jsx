/* ============================================================
   CONFIGURAR AS ESTATÍSTICAS DO CABEÇALHO (fechamento do G2, 2026-10-16)
   ============================================================
   Um painel sob demanda (o `Flutuante` do estudo, com Esc e foco como os outros): cada estatística da ficha numa linha, com Mostrar e as
   setas para subir e descer. Sem arrastar: tudo por controle e por teclado (Tab, Espaço no Mostrar e Alt+Seta nas linhas). Só estatísticas:
   Vida, Energia, Alma, Em Combate, Rodada e Efeitos não estão aqui. A conta e as fontes não mudam, e nada disto toca a ficha.
   A preferência é a da MESA do personagem (`ui.estatisticas`, ver `estatisticas.js`), e Restaurar Padrão a apaga.
   ============================================================ */
import React, { useRef } from "react";
import { ArrowDown, ArrowUp, RotateCcw } from "lucide-react";
import { Flutuante } from "./pecas";
import { alternaVisivel, aplicaPreferencia, move, restauraPadrao } from "./estatisticas";

export default function EstatisticasConfig({ ancora, stats, preferencia, onMuda, onFechar }) {
  const lista = useRef(null);
  const { todas, padrao } = aplicaPreferencia(stats, preferencia);
  /* Depois de mover pelo teclado o foco acompanha a linha, que mudou de lugar. */
  const foco = (id, qual) => requestAnimationFrame(() => {
    const linha = lista.current?.querySelector(`[data-estat-linha="${CSS.escape(id)}"]`);
    const alvo = linha?.querySelector(qual);
    (alvo && !alvo.disabled ? alvo : linha?.querySelector("[data-estat-mostrar]"))?.focus();
  });
  const sobe = (id, qual = "[data-estat-subir]") => { onMuda(move(stats, preferencia, id, -1)); foco(id, qual); };
  const desce = (id, qual = "[data-estat-descer]") => { onMuda(move(stats, preferencia, id, 1)); foco(id, qual); };
  const aoTeclar = (e, id) => {
    if (!e.altKey || (e.key !== "ArrowUp" && e.key !== "ArrowDown")) return;
    e.preventDefault();
    if (e.key === "ArrowUp") sobe(id, "[data-estat-mostrar]"); else desce(id, "[data-estat-mostrar]");
  };
  return (
    <Flutuante ancora={ancora} onFechar={onFechar} largura={320} rotulo="Estatísticas do Cabeçalho" classe="h-estat-painel">
      <div className="h-estat" data-estat-config>
        <div className="h-estat-topo"><b>Estatísticas do Cabeçalho</b></div>
        <ul ref={lista} className="h-estat-lista">
          {todas.map((s, i) => (
            <li key={s.id} className="h-estat-linha" data-estat-linha={s.id} data-visivel={s.visivel ? "sim" : "nao"} onKeyDown={(e) => aoTeclar(e, s.id)}>
              <label className="h-estat-nome">
                <input type="checkbox" checked={s.visivel} onChange={() => onMuda(alternaVisivel(stats, preferencia, s.id))} data-estat-mostrar aria-label={`Mostrar ${s.k}`} />
                <span>{s.k}</span>
              </label>
              <span className="h-estat-setas">
                <button type="button" className="e-icone" disabled={i === 0} onClick={() => sobe(s.id)} aria-label={`Subir ${s.k}`} data-estat-subir><ArrowUp aria-hidden="true" /></button>
                <button type="button" className="e-icone" disabled={i === todas.length - 1} onClick={() => desce(s.id)} aria-label={`Descer ${s.k}`} data-estat-descer><ArrowDown aria-hidden="true" /></button>
              </span>
            </li>
          ))}
        </ul>
        <div className="h-estat-rodape">
          <button type="button" className="m-botao" disabled={padrao} onClick={() => onMuda(restauraPadrao())} data-estat-restaurar><RotateCcw aria-hidden="true" />Restaurar Padrão</button>
          <button type="button" className="m-botao" onClick={onFechar} data-estat-fechar>Fechar</button>
        </div>
      </div>
    </Flutuante>
  );
}
