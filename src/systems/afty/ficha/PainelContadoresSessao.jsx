import React from "react";
import { valorContadorSessao } from "../afty-recursos-addon";
import { defineContadorSessao, bloqueioAcaoContador, aplicaAcaoContador } from "./ficha-sessao";
import { DicaDeTexto } from "../ui/fontes";

/**
 * Os contadores de MESA dos pacotes (`contadoresSessao`, 2026-10-15): Pontos de
 * Sangue, Sangue Guardado e Fome do Golem de Sangue. Cada um tem o menos, o valor
 * digitável, o mais e as ações do pacote. Mora na sessão, então a Ficha e o
 * Encontro usam o mesmo painel.
 */
export default function PainelContadoresSessao({ derived, sessao, onSessao }) {
  const contadores = derived.contadoresSessao ?? [];
  if (!contadores.length) return null;
  const botao = "afty-botao px-2 py-1 text-xs disabled:opacity-40";
  return (
    <section className="afty-card p-3 space-y-2">
      {contadores.map((c) => {
        const valor = valorContadorSessao(sessao, c);
        const rotulo = c.title ? <DicaDeTexto texto={c.title}>{c.label}</DicaDeTexto> : c.label;
        return (
          <div key={c.id} className="flex gap-2 items-center flex-wrap" data-afty-contador={c.id}>
            <span className="flex-1 min-w-[8rem] text-xs font-semibold">{rotulo}</span>
            <button type="button" className={botao} aria-label={`Diminuir ${c.label}`} disabled={valor <= c.min}
              onClick={() => onSessao((s) => defineContadorSessao(s, c, valorContadorSessao(s, c) - 1))}>−</button>
            <input
              type="number"
              inputMode="numeric"
              className="afty-valor text-xs w-14 text-center"
              value={valor}
              min={c.min}
              max={c.max ?? undefined}
              aria-label={c.label}
              onChange={(e) => onSessao((s) => defineContadorSessao(s, c, e.target.value))}
            />
            <button type="button" className={botao} aria-label={`Aumentar ${c.label}`} disabled={c.max != null && valor >= c.max}
              onClick={() => onSessao((s) => defineContadorSessao(s, c, valorContadorSessao(s, c) + 1))}>+</button>
            {c.acoes.map((a) => {
              const bloqueio = bloqueioAcaoContador(sessao, contadores, c, a);
              return (
                <button key={a.id} type="button" className={botao} disabled={!!bloqueio}
                  title={bloqueio || a.title || undefined}
                  onClick={() => onSessao((s) => aplicaAcaoContador(s, contadores, c, a, derived.hp))}>
                  {a.label}
                </button>
              );
            })}
          </div>
        );
      })}
    </section>
  );
}
