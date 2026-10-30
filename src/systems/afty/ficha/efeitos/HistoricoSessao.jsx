/* ============================================================
   HISTÓRICO DA SESSÃO, SOB DEMANDA (fechamento do G2, 2026-10-16)
   ============================================================
   Os DADOS são os da sessão da Ficha (`operacoes.eventos` e `operacoes.ativacoes`, vistos como `mesa.eventos` e `mesa.ativacoes`), e o VERBO de estornar é
   o de `mesa-verbos.js` (`desfazer`, pelo `m.historicoProps.onDesfazer`) com a conferência dele (`podeDesfazer`). Não existe um segundo histórico
   calculado do texto da tela. Cada evento tem o horário REAL e a rodada em que aconteceu; o evento legado sem horário não ganha um. As rolagens do painel de
   rolagens da Ficha (`sessao.log`) entram só para LER, com a identidade e o horário delas, e limpá-las não toca o registro que controla um estorno.
   Os filtros e o resumo de cada tipo de evento dizem o dano do Sacrifício que o Golpe também causa e o uso registrado.

   SOB DEMANDA: um acesso discreto ao pé dos Ativos (completa e compacta) e no menu do cabeçalho abrem um painel flutuante (`Flutuante`, como os
   outros do estudo: Esc fecha, o foco volta a quem abriu). Consultar, filtrar, abrir e fechar NÃO tocam a mesa, e o painel fica POR CIMA: o efeito aberto,
   a seleção e a rolagem de quem abriu continuam onde estavam.

   ESTORNAR PE NÃO É DESFAZER O EFEITO. O estorno devolve só os PE do gasto (a Energia, e o PE Temporário só na mesma rodada). Não desliga estado, não
   devolve um uso, não remove concessão de PV Temporário e não desfaz o dano do Sacrifício. O rótulo diz "Estornar PE", e o hover diz o resto.
   Onde o mecanismo não permite (a cobrança que o próprio motor faz ao ligar o Invencível sob o Sol), o botão é "Sem Estorno".
   ============================================================ */
import React, { useContext, useMemo, useRef } from "react";
import { AlertTriangle, History, Undo2, X } from "lucide-react";
import { podeDesfazer } from "./mesa-verbos";
import { Flutuante } from "./pecas";

import { HistoricoCtx, horaDoEvento, registrosDoHistorico, resumoDoEvento } from "./historico-logica";
const FILTROS = [
  { id: "tudo", rotulo: "Todos", serve: () => true },
  { id: "gastos", rotulo: "Gastos e Usos", serve: (ev) => ["gasto", "ativacao", "desfazer", "uso"].includes(ev.tipo) },
  { id: "rolagens", rotulo: "Rolagens", serve: (ev) => ev.tipo === "rolagem" },
  { id: "vida", rotulo: "Vida e Alma", serve: (ev) => ev.tipo === "dano" || ev.tipo === "cura" || ev.tipo === "perda" },
  { id: "rodadas", rotulo: "Rodadas", serve: (ev) => ev.tipo === "rodada" || ev.tipo === "info" },
];


/** De onde saiu o PE de um gasto ("Energia 3 · Temporário 1"), para o estorno não surpreender. */
const origemDoPago = (pago) => {
  if (!pago) return null;
  const casca = Object.values(pago.casca ?? {}).reduce((a, v) => a + v, 0);
  const partes = [pago.reserva > 0 ? `Energia ${pago.reserva}` : null, casca > 0 ? `Temporário ${casca}` : null].filter(Boolean);
  return partes.length ? partes.join(" · ") : null;
};

const AJUDA_ESTORNO = "Devolve só os PE deste gasto. O efeito, os usos, o PV Temporário e o dano do Sacrifício continuam como estão.";

function Entrada({ ev, mesa, onEstornar }) {
  const at = ev.ativacaoId ? mesa.ativacoes[ev.ativacaoId] : null;
  const gasta = at && (ev.tipo === "ativacao" || ev.tipo === "gasto");
  const pode = gasta ? podeDesfazer(mesa, at.id) : null;
  const origem = gasta ? origemDoPago(at.pago) : null;
  return (
    <li className="h-hist-item" data-tipo={ev.tipo} data-evento={ev.id} data-estornado={gasta && at.desfeita ? "sim" : undefined}>
      <span className="h-hist-meta">
        {ev.rodada != null && <b>R{ev.rodada}</b>}
        {ev.ts != null && <time dateTime={new Date(ev.ts).toISOString()} title={new Date(ev.ts).toLocaleString("pt-BR")} data-hora={ev.ts}>{horaDoEvento(ev.ts)}</time>}
      </span>
      <span className="h-hist-texto">
        <span data-resumo>{resumoDoEvento(ev)}</span>
        {origem && <small className="h-hist-origem">{origem}</small>}
        {ev.tipo === "rolagem" && <small className="h-hist-origem">{ev.r.formula} = <b>{ev.r.total}</b></small>}
        {ev.tipo === "desfazer" && ev.limites?.length > 0 && (
          <ul className="h-hist-limites">{ev.limites.map((l) => <li key={l}><AlertTriangle aria-hidden="true" />{l}</li>)}</ul>
        )}
      </span>
      {gasta && (
        <button type="button" className="m-botao h-hist-acao" disabled={!pode.ok} onClick={() => onEstornar(at.id)} data-estornar={at.id}
          title={at.desfeita ? "Este gasto já foi estornado" : pode.ok ? AJUDA_ESTORNO : pode.motivo}
          aria-label={`${at.desfeita ? "Estornado" : pode.ok ? "Estornar PE" : "Sem Estorno"}: ${ev.nome}`}>
          <Undo2 aria-hidden="true" />{at.desfeita ? "Estornado" : pode.ok ? "Estornar PE" : "Sem Estorno"}
        </button>
      )}
    </li>
  );
}

/** A âncora do painel, sempre DENTRO da janela: o botão que o abriu mora numa lista que rola, e ao redimensionar (ou rolar) ele pode ficar fora de vista.
 *  O `Flutuante` posiciona pelo retângulo da âncora, e fora de vista o painel sairia da janela: aqui o retângulo é preso à janela. */
const ancoraNaJanela = (el) => ({
  contains: (n) => el?.contains?.(n),
  getBoundingClientRect() {
    const r = el.getBoundingClientRect();
    const alto = window.innerHeight;
    const topo = Math.min(Math.max(r.top, 8), alto - 44);
    const base = Math.min(Math.max(r.bottom, topo + 28), alto - 8);
    return { top: topo, bottom: base, left: r.left, right: r.right, width: r.width, height: base - topo, x: r.left, y: topo };
  },
});

/** O painel. `filtro` e `onFiltro` moram em quem abre (o painel pode ser refeito ao redimensionar a janela sem perder o filtro). */
export function HistoricoPainel({ ancora, m, nome, filtro, onFiltro, onFechar }) {
  const mesa = m.mesa;
  const ancoraPresa = useMemo(() => ancoraNaJanela(ancora), [ancora]);
  const eventos = useMemo(() => registrosDoHistorico(mesa, m.sessao), [mesa, m.sessao]);
  const ativo = FILTROS.find((f) => f.id === filtro) ?? FILTROS[0];
  const lista = eventos.filter(ativo.serve);
  /* Estornar uma vez só: o clique repetido (ou um segundo clique antes de a tela refletir o primeiro) não estorna de novo. A conferência da ativação
     (`podeDesfazer`) é refeita pelo próprio verbo na mesa que estiver valendo. */
  const emCurso = useRef(new Set());
  const estornar = (id) => {
    if (emCurso.current.has(id)) return;
    emCurso.current.add(id);
    m.historicoProps.onDesfazer(id);
    setTimeout(() => emCurso.current.delete(id), 500);
  };
  return (
    <Flutuante ancora={ancoraPresa} onFechar={onFechar} largura={460} rotulo="Histórico da Sessão" classe="h-hist-painel">
      <section className="h-hist" data-historico aria-label="Histórico da Sessão" data-mesa={m.mesaId}>
        <header className="h-hist-topo">
          <History aria-hidden="true" />
          <h2>Histórico da Sessão<small>{nome}</small></h2>
          <button type="button" className="e-icone" onClick={onFechar} aria-label="Fechar o Histórico" data-historico-fechar><X aria-hidden="true" /></button>
        </header>
        <div className="h-hist-filtros m-seg" role="group" aria-label="Quais eventos">
          {FILTROS.map((f) => {
            const n = eventos.filter(f.serve).length;
            return (
              <button key={f.id} type="button" className="m-seg-op" aria-pressed={f.id === ativo.id} disabled={!n && f.id !== "tudo"} onClick={() => onFiltro(f.id)} data-historico-filtro={f.id}>
                {f.rotulo}<small>{n}</small>
              </button>
            );
          })}
        </div>
        <ol className="h-hist-lista" aria-label="Eventos, do mais recente ao mais antigo" data-historico-lista>
          {lista.length === 0 && <li className="h-hist-vazio">Nada Aconteceu Ainda</li>}
          {lista.map((ev) => <Entrada key={ev.id} ev={ev} mesa={mesa} onEstornar={estornar} />)}
        </ol>
      </section>
    </Flutuante>
  );
}

/** O acesso discreto, ao pé dos Ativos e da lista do painel: um botão de texto com o total. Nada aberto, nada empilhado. */
export function AcessoAoHistorico({ onde }) {
  const ctx = useContext(HistoricoCtx);
  if (!ctx) return null;
  return (
    <div className="h-acesso" data-historico-acesso={onde}>
      <button type="button" className="e2-toggle" aria-haspopup="dialog" onClick={(e) => ctx.abrir(e.currentTarget)} data-historico-abrir>
        <History aria-hidden="true" />Histórico da Sessão<small>{ctx.total}</small>
      </button>
    </div>
  );
}
