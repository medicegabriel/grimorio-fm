import React from "react";
import { definirAcaoAddon } from "../afty-acoes-addon";
import { usarAcaoAddon, sustentarAcaoAddon, bloqueioAcaoAddon } from "./ficha-sessao";

export default function PainelAcoesAddon({ derived, sessao, onSessao }) {
  const acoes = (derived.acoesAddon ?? []).filter((a) => a.tipo !== "passivo");
  if (!acoes.length) return null;
  const botao = "afty-botao px-2 py-1 text-xs disabled:opacity-40";
  return <section className="afty-card p-3 space-y-2">
    {acoes.map((a) => {
      const bloqueio = a.valor ? null : bloqueioAcaoAddon(sessao, a, derived);
      return <div key={a.estado} className="flex gap-2 items-center flex-wrap">
      <span className="flex-1 text-xs font-semibold" title={a.descricao}>{a.nome}</span>
      {a.tipo === "contador" ? <>
        <button className={botao} aria-label={`Reduzir ${a.nome}`} disabled={!a.valor}
          onClick={() => onSessao((s) => definirAcaoAddon(s, a, a.valor - 1))}>−</button>
        <span className="afty-valor text-xs">{a.valor}/{a.max}</span>
        <button className={botao} aria-label={`Aumentar ${a.nome}`} disabled={!sessao.combate?.ativo || a.valor >= a.max}
          onClick={() => onSessao((s) => definirAcaoAddon(s, a, a.valor + 1))}>+</button>
      </> : <>
        {bloqueio && <span className="afty-rotulo text-xs">{bloqueio}</span>}
        <button type="button" className={botao} disabled={!!bloqueio}
          aria-label={`${a.valor ? "Concluir" : "Ativar"} ${a.nome}`}
          aria-pressed={!!a.valor}
          onClick={() => onSessao((s) => a.valor ? definirAcaoAddon(s, a, 0) : usarAcaoAddon(s, a, derived))}>
          {a.valor ? a.tipo === "disparo" ? "Concluir disparo" : "Desativar" : "Ativar"}
        </button>
        {a.valor > 0 && a.sustentacaoPV > 0 && <button className={botao}
          onClick={() => onSessao((s) => sustentarAcaoAddon(s, a))}>
          Sustentar ({a.sustentacaoPV} PV)
        </button>}
      </>}
    </div>; })}
  </section>;
}
