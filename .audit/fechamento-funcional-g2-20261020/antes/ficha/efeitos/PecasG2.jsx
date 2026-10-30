/* ============================================================
   G2 · PEÇAS PEQUENAS
   ============================================================
   Números com os rótulos do G2, o custo em linguagem de jogo, a instrução
   que diz quem faz, o medidor curto e o resultado de uma operação. Os
   dados vêm de `dados.js`; o PV Temporário e o atalho de gastar vêm do
   gerenciador, como já funcionam.
   ============================================================ */
import React from "react";
import { AlertTriangle, Check, Clock, Hand, X, Zap } from "lucide-react";
import { GastarNaEnergia, PvBeneficio, PvQueFica } from "./Gestor";
import { custoEmJogo, foraDosNumeros, numerosG2, separarGanhos, juntarPorRotulo } from "./g2-dados";

/* Sem número a mostrar: "Sem Mudança nos Seus Números" só quando NÃO há benefício conhecido fora do comparador.
   Com ele (`foraDosNumeros`, no estudo, ou `fora` direto), o texto diz que o benefício existe e não entra nos números
   comparados, e o que muda fica no title. Ausência de número comparado não é ausência de benefício (E2/E3). */
/* Um número com o sinal escrito: entende-se sem cor. `destaque` pinta a perda
   de vermelho, e só no resultado de uma operação. */
export function NumerosG2({ chips, destaque = false, prontos = false }) {
  /* `prontos`: os chips já passaram por `numerosG2`. A regra que tira o chip
     "Dados" duplicado não pode rodar duas vezes: na segunda, sem o chip, os
     grupos voltariam a ser "Dano Extra". */
  const lista = juntarPorRotulo(prontos ? chips : numerosG2(chips));
  if (!lista.length) return null;
  return lista.map((c) => (
    <span key={`${c.rotulo}${Math.sign(c.valor)}`} className="x-num" data-sinal={destaque && c.valor < 0 ? "menos" : undefined}>
      {c.rotulo}<b>{c.textos.join(" ")}</b>
    </span>
  ));
}

export function SemNumeros({ exemplo = null, fora = null }) {
  const f = fora ?? foraDosNumeros(exemplo);
  return f
    ? <span className="x-mesa" data-fora-dos-numeros="" title={f}>Benefício Fora dos Números Comparados</span>
    : <span className="x-mesa">Sem Mudança nos Seus Números</span>;
}

/* Ganha e Perde em duas linhas. A perda nunca some. */
export function GanhaPerde({ chips }) {
  const { ganha, perde } = separarGanhos(numerosG2(chips));
  return (
    <>
      {ganha.length > 0 && <div className="x-nums" data-lado="ganha"><span className="x-lado">Ganha</span><NumerosG2 chips={ganha} prontos /></div>}
      {perde.length > 0 && <div className="x-nums" data-lado="perde"><span className="x-lado">Perde</span><NumerosG2 chips={perde} prontos /></div>}
    </>
  );
}

/* A instrução de jogo: quem faz. Relógio quando a ficha faz, mão quando é o jogador. */
export function Instrucao({ auto, t }) {
  return <span className="x-instrucao" data-auto={auto ? "" : undefined}>{auto ? <Clock aria-hidden="true" /> : <Hand aria-hidden="true" />}{t}</span>;
}

/* O custo em linguagem de jogo. O que o jogador desconta tem o atalho Descontar,
   que abre o painel de Energia com o motivo preenchido. */
export function CustoG2({ custo, m, nome, operacao = false }) {
  const c = custoEmJogo(custo);
  if (!c) return null;
  /* O valor preenchido no Descontar é o da OPERAÇÃO que originou o resultado (`custo.valor`). O custo que fica no
     cartão, depois, não diz o que já foi pago: o campo vem vazio e o jogador diz quanto desconta. */
  const valor = operacao && Number.isFinite(custo.valor) && custo.valor > 0 ? Math.trunc(custo.valor) : null;
  return (
    <span className="x-custo-jogo" data-auto={c.auto ? "" : undefined} data-custo>
      {c.auto ? <Zap aria-hidden="true" /> : <Hand aria-hidden="true" />}{c.texto}
      {!c.auto && <GastarNaEnergia m={m} nome={nome} rotulo="Descontar" valor={valor} />}
    </span>
  );
}

/* O medidor de uma faixa curta: um traço por passo. */
export function Passos({ valor, max }) {
  return <span className="x-medidor" aria-hidden="true">{Array.from({ length: max }, (_, i) => <i key={i} data-on={i < valor ? "" : undefined} />)}</span>;
}

/* O resultado de uma operação, curto, logo abaixo do que foi operado. O PE que
   saiu é MEDIDO (Energia antes e depois), e não presumido. */
export function ResultadoG2({ r, g, m, pvb }) {
  if (!r) return null;
  const chips = (r.chips ?? []).filter((c) => c.chave !== "pvTemporario");
  const encerrou = r.verbo?.startsWith("Encerrad");
  const manual = !r.cobrado && r.custo && !r.custo.cobra;
  return (
    <div className="g2-resultado" role="status" data-tom={r.nadaMudou ? "nada" : undefined} key={r.ts} data-resultado={r.alvo}>
      <span className="g2-resultado-verbo">{r.nadaMudou ? <AlertTriangle aria-hidden="true" /> : <Check aria-hidden="true" />}{r.nadaMudou ? "Nada Mudou" : `${r.verbo}${encerrou ? ` · ${r.nome}` : ""}`}</span>
      {chips.length > 0 && <span className="x-nums"><NumerosG2 chips={chips} destaque /></span>}
      {!encerrou && pvb && <PvBeneficio b={pvb} g={g} curto />}
      {encerrou && <PvQueFica fontes={r.fontesPv} g={g} m={m} />}
      {!chips.length && !pvb && !r.nadaMudou && !r.instantaneo && !encerrou && <SemNumeros fora={r.fora ?? null} />}
      {r.usos && !r.instantaneo && <span className="x-custo" data-usos-restam={r.usos.restam}>Restam {r.usos.restam} de {r.usos.max}</span>}
      {r.instantaneo && <span className="x-mesa">Não Fica Ativo</span>}
      {r.cobrado > 0 && <span className="x-custo-jogo" data-auto="" data-cobrado={r.cobrado}><Zap aria-hidden="true" />Descontou {r.cobrado} PE da Energia</span>}
      {manual && <CustoG2 custo={r.custo} m={m} nome={r.nome} operacao />}
      <button type="button" className="e-icone g2-resultado-x" onClick={g.fecharResultado} aria-label="Fechar o resultado"><X aria-hidden="true" /></button>
    </div>
  );
}
