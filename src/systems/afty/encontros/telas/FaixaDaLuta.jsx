import React, { useLayoutEffect, useRef } from "react";
import { Swords, SkipForward, EyeOff } from "lucide-react";

import "../encontro-g2.css";
import { BarraCurta } from "./pecas-encontro";
import { FAIXA_DE_EXEMPLO } from "./pecas-dados";

/**
 * ============================================================
 * A FAIXA DA LUTA DO JOGADOR (etapa 6a, 2026-11-17)
 * ============================================================
 * A tela do jogador é a própria Ficha G2 com esta faixa grudada em cima (plano,
 * "Tela do jogador"): a rodada, de quem é a vez, a ordem que ele pode ver e o
 * Encerrar Meu Turno, que só acende na vez dele.
 *
 * LIGADA À SALA NA ETAPA 7c (2026-11-18): `faixaDoJogador` (src/nuvem/sala-telas.js)
 * monta os dados só dos resumos que o jogador pode ler (a criatura Oculta não
 * aparece, e na vez dela a faixa diz só que não é a vez dele). Sem número de
 * iniciativa (o banco só dá a posição), e a Vida em Barra vem em cinco faixas, sem
 * número. `FAIXA_DE_EXEMPLO` segue como padrão da prévia.
 *
 * `dados.ativa === false` é a Sala planejando: a faixa diz Planejando e o Encerrar
 * Meu Turno fica apagado. `acoes` é o lugar dos botões da Sala (abrir o painel).
 *
 * A altura da faixa vai para `--ec-faixa-h` na raiz que a envolve, e o cabeçalho
 * da Ficha gruda logo abaixo dela (`encontro-g2.css`).
 * ============================================================
 */

export default function FaixaDaLuta({ dados = FAIXA_DE_EXEMPLO, onEncerrar = () => {}, raizComFaixa = null, acoes = null, enviando = false }) {
  const ref = useRef(null);
  /* A altura medida vai para a raiz, para o cabeçalho da Ficha grudar embaixo (ela muda quando a ordem quebra a linha). */
  useLayoutEffect(() => {
    const el = ref.current;
    const raiz = raizComFaixa?.current ?? el?.parentElement?.parentElement;
    if (!el || !raiz) return undefined;
    const medir = () => raiz.style.setProperty("--ec-faixa-h", `${Math.ceil(el.getBoundingClientRect().height)}px`);
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, [raizComFaixa]);

  const ativa = dados.ativa !== false;
  const vez = dados.ordem.find((c) => c.id === dados.vezId) ?? null;
  const minha = ativa && !!vez && dados.minhas.includes(vez.id);
  return (
    /* A raiz `.afty-ficha` dá os tokens do tema padrão à faixa, que fica fora da Ficha. É ela que gruda no topo. */
    <div className="afty-ficha ec-faixa-raiz">
    <div ref={ref} className="ec-faixa" data-minha-vez={minha ? "sim" : undefined} role="region" aria-label="Luta em Andamento">
      {ativa ? (
        <span className="ec-faixa-rodada"><Swords aria-hidden="true" />Rodada <b className="afty-valor">{dados.rodada}</b></span>
      ) : (
        <span className="ec-faixa-rodada"><Swords aria-hidden="true" />Planejando</span>
      )}
      {ativa && (
        <span className="ec-faixa-vez" aria-live="polite">
          {minha ? <b>Sua Vez</b> : vez ? <>Vez de <b title={vez.nome}>{vez.nome}</b></> : <><EyeOff aria-hidden="true" />Não É a Sua Vez</>}
        </span>
      )}
      <ol className="ec-faixa-ordem" aria-label="Ordem de Iniciativa">
        {dados.ordem.map((c) => (
          <li key={c.id} className="ec-faixa-item" data-vez={c.id === dados.vezId ? "sim" : undefined} data-tipo={c.tipo}>
            <span className="ec-faixa-ini afty-valor" title={c.iniciativa == null ? "Posição na Ordem" : "Iniciativa"}>{c.iniciativa ?? c.posicao}</span>
            <span className="ec-faixa-nome" title={c.nome}>{c.nome}</span>
            {c.barra && c.barra.faixa == null && <BarraCurta tipo="pv" rotulo="PV" atual={c.barra.atual} max={c.barra.max} semNumero />}
            {c.barra && c.barra.faixa != null && <span title={c.barra.rotulo}><BarraCurta tipo="pv" rotulo="PV" atual={Math.round(c.barra.fracao * 100)} max={100} semNumero /><span className="ec-sr">{c.barra.rotulo}</span></span>}
          </li>
        ))}
      </ol>
      <button type="button" className="afty-botao ec-faixa-encerrar" data-afty-tom={minha ? "destaque" : undefined} disabled={!minha || enviando} onClick={onEncerrar}>
        <SkipForward aria-hidden="true" />Encerrar Meu Turno
      </button>
      {acoes}
    </div>
    </div>
  );
}
