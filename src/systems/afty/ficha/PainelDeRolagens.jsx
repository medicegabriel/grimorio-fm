import React from "react";
import { Dices, ChevronDown, ChevronUp, Trash2 } from "lucide-react";

import { MODOS, textoDaRolagem } from "./ficha-rolagem";

/**
 * ============================================================
 * PAINEL DE ROLAGENS — o resultado e o histórico
 * ============================================================
 * Fica FIXO no canto, e não num trilho lateral: o trilho roubaria largura do
 * conteúdo em toda tela, e precisaria de uma segunda implementação no celular.
 * Fechado, ele mostra a última rolagem, que é o que interessa em 90% das vezes.
 * Aberto, mostra as últimas 50.
 *
 * ⚠ A FÓRMULA aparece ao lado do total, sempre. Uma ficha que rola e só cospe um
 * número exige do jogador confiar às cegas, e a mesa não funciona assim: com
 * `17 + 21` escrito, dá para conferir num relance e discutir com o mestre.
 *
 * O modo (vantagem, normal, desvantagem) é PEGAJOSO de propósito. Um modo que se
 * desarma sozinho depois de uma rolagem deixa o jogador sem saber em que estado
 * está na hora de rolar de novo, e a marca colorida do painel resolve o
 * esquecimento melhor do que a mágica resolveria.
 * ============================================================
 */

function Rolagem({ r, destaque }) {
  const marca = r.raioNegro ? "critico" : r.critico ? "critico" : r.pifia ? "pifia" : undefined;
  return (
    <div className="afty-rolagem px-2.5 py-1.5" data-afty-marca={marca} data-afty-nova={destaque ? "sim" : undefined}>
      <div className="flex items-baseline gap-2">
        <span className="flex-1 min-w-0 text-[11px] font-semibold truncate" title={r.rotulo}>
          {r.rotulo}
        </span>
        {r.modo && r.modo !== "normal" && (
          <span className="afty-chip flex-shrink-0">
            {r.modo === "vantagem" ? "Van" : "Des"}
          </span>
        )}
        {r.raioNegro && <span className="afty-chip" data-afty-tom="destaque">Raio Negro</span>}
        {r.critico && <span className="afty-chip" data-afty-tom="destaque">Crítico</span>}
        {r.sucesso === true && <span className="afty-chip" data-afty-tom="destaque">Sucesso</span>}
        {r.sucesso === false && <span className="afty-chip">Falha</span>}
        {r.cd != null && <span className="afty-rotulo text-[10px]">CD {r.cd}</span>}
        <span className="afty-rolagem-total">{r.total}</span>
      </div>
      <div className="flex items-baseline gap-1.5 mt-0.5">
        <span className="afty-rotulo text-[10px] flex-1 min-w-0 truncate">{r.formula}</span>
        {/* Cada dado que caiu. No d20 com vantagem, o descartado fica riscado,
            que é o mesmo vocabulário do perdedor do pool exclusivo. */}
        <span className="flex items-center gap-1 flex-wrap justify-end">
          {(r.tipo === "teste" ? r.d20 : r.dados).map((n, i) => (
            <span
              key={i}
              className="afty-dado"
              data-afty-descartado={r.tipo === "teste" && r.descartado === i ? "sim" : undefined}
            >
              {n}
            </span>
          ))}
          <span className="afty-rotulo text-[10px] whitespace-nowrap">{textoDaRolagem(r)}</span>
        </span>
      </div>
    </div>
  );
}

export default function PainelDeRolagens({ log, modo, onModo, aberto, onAberto, onLimpar }) {
  const ultima = log[0] ?? null;
  return (
    <aside className="afty-log" data-afty-aberto={aberto ? "sim" : "nao"}>
      <div className="afty-log-topo flex items-center gap-1 px-2 py-1.5">
        <Dices className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
        <span className="afty-log-modos flex items-center gap-0.5 flex-1">
          {MODOS.map((m) => (
            <button
              key={m.id}
              type="button"
              className="afty-log-modo"
              data-afty-ativo={modo === m.id ? "sim" : undefined}
              data-afty-modo={m.id}
              aria-pressed={modo === m.id}
              onClick={() => onModo(m.id)}
              title={m.label}
            >
              {m.label.slice(0, 3)}
            </button>
          ))}
        </span>
        {log.length > 0 && (
          <button type="button" className="afty-passo" onClick={onLimpar} title="Limpar o histórico" aria-label="Limpar o histórico">
            <Trash2 className="w-3 h-3" />
          </button>
        )}
        <button
          type="button"
          className="afty-passo"
          onClick={() => onAberto(!aberto)}
          aria-expanded={aberto}
          title={aberto ? "Fechar o histórico" : "Abrir o histórico"}
          aria-label={aberto ? "Fechar o histórico" : "Abrir o histórico"}
        >
          {aberto ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
        </button>
      </div>

      <div className="afty-log-corpo">
        {!ultima ? null : aberto ? (
          log.map((r, i) => <Rolagem key={r.id} r={r} destaque={i === 0} />)
        ) : (
          <Rolagem r={ultima} destaque />
        )}
      </div>
    </aside>
  );
}
