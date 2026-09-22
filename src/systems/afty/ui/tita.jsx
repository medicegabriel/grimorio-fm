import React from "react";
import { Skull, Heart, AlertTriangle } from "lucide-react";
import { Vital } from "./vital";

/**
 * ============================================================
 * TITÃ — a Vida separada por parte do corpo (Mechamaru Supremo)
 * ============================================================
 * "Dobrar a vida máxima, dividi-la pelos membros, e a Cabeça fica com o dobro
 * inteiro": o painel é UMA barra de Cabeça mais UMA barra por Membro, cada uma
 * o mesmo `Vital` do PV comum. Ver `afty-tita.js` para os números e
 * `ficha-sessao.js` para o estado corrente.
 *
 * ⚠ NASCE COMPARTILHADO, mesma razão da Guarda (`ui/guarda.jsx`): a Ficha e o
 * painel de Encontros mexem na MESMA sessão, e uma cópia por tela divergiria na
 * primeira errata.
 *
 * `titaColosso` é o `derived.titaColosso` (afty-tita.js). `estado` é o
 * `estadoTita(sessao)` (ficha-sessao.js): `{ cabeca, membros }`, com `null`
 * valendo "cheio". Quem não tem o Titã ativo não renderiza nada.
 */
export function PainelTita({
  titaColosso, estado,
  onDanoCabeca, onCuraCabeca, onSetCabeca,
  onDanoMembro, onCuraMembro, onSetMembro,
}) {
  if (!titaColosso?.ativo) return null;
  const cabecaAtual = estado?.cabeca ?? titaColosso.cabecaMax;
  return (
    <div className="afty-card p-3 space-y-2">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        <Skull className="w-3.5 h-3.5" aria-hidden="true" />
        Titã
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <Vital
          tipo="pv" icone={Skull} rotulo="Cabeça"
          atual={cabecaAtual} max={titaColosso.cabecaMax}
          onSet={(v) => onSetCabeca(v)}
          onDelta={(n) => (n < 0 ? onDanoCabeca(-n) : onCuraCabeca(n))}
        />
        {titaColosso.nomes.map((nome, i) => {
          const atual = estado?.membros?.[i] ?? titaColosso.membroMax;
          const desabilitado = atual === 0;
          return (
            <div key={nome} className={desabilitado ? "opacity-60" : undefined}>
              <Vital
                tipo="pv" icone={Heart} rotulo={nome}
                atual={atual} max={titaColosso.membroMax}
                onSet={(v) => onSetMembro(i, v)}
                onDelta={(n) => (n < 0 ? onDanoMembro(i, -n) : onCuraMembro(i, n))}
              />
              {desabilitado && (
                <p className="text-[10px] text-amber-400 flex items-center gap-1 mt-0.5">
                  <AlertTriangle className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
                  Membro perdido: penalidade de membro perdido, só regenera se a criatura regenera
                  membros, com o custo em dobro.
                </p>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-[10px] text-slate-500">
        Acertar a Cabeça é sempre crítico, desde que acerte. O Titã só morre quando a Cabeça
        chega a 0.
      </p>
    </div>
  );
}
