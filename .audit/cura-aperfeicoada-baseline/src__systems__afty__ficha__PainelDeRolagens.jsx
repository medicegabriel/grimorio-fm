import React, { useEffect, useId, useRef } from "react";
import { Dices, History, ChevronDown, ChevronUp, Trash2 } from "lucide-react";

import { MODOS, textoDaRolagem } from "./ficha-rolagem";

/**
 * ============================================================
 * PAINEL DE ROLAGENS: o resultado e o histórico
 * ============================================================
 * Integra o cabeçalho, abaixo das abas. A última rolagem permanece na barra;
 * o histórico abre abaixo dela, sem aumentar a altura do cabeçalho.
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
  /* O dado rolado de novo (Estilo Massivo) aparece como o par: o velho riscado
     e o novo logo depois. Registro antigo não tem o campo. */
  const velhoEm = new Map((Array.isArray(r.rerrolados) ? r.rerrolados : []).map((x) => [x.indice, x.de]));
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
            <React.Fragment key={i}>
              {velhoEm.has(i) && (
                <span className="afty-dado" data-afty-descartado="sim" title={r.rerrolaFonte ?? undefined}>
                  {velhoEm.get(i)}
                </span>
              )}
              <span
                className="afty-dado"
                data-afty-descartado={r.tipo === "teste" && r.descartado === i ? "sim" : undefined}
              >
                {n}
              </span>
            </React.Fragment>
          ))}
          <span className="afty-rotulo text-[10px] whitespace-nowrap">{textoDaRolagem(r)}</span>
        </span>
      </div>
    </div>
  );
}

export default function PainelDeRolagens({ log, modo, onModo, aberto, onAberto, onLimpar }) {
  const ultima = log[0] ?? null;
  const painelRef = useRef(null);
  const historicoId = useId();

  useEffect(() => {
    const painel = painelRef.current;
    const cabecalho = painel.closest("header");
    const ajustarAltura = () => {
      if (cabecalho) {
        const abas = cabecalho.querySelector(".afty-abas");
        cabecalho.style.setProperty("--afty-cabecalho-recolhido", `${Math.max(0, painel.offsetTop - (abas?.offsetHeight ?? 0))}px`);
      }
      const disponivel = window.innerHeight - painel.getBoundingClientRect().bottom - 24;
      painel.style.setProperty("--afty-log-altura", `${Math.max(48, disponivel)}px`);
    };
    ajustarAltura();
    const observer = new ResizeObserver(ajustarAltura);
    observer.observe(painel);
    if (cabecalho) observer.observe(cabecalho);
    window.addEventListener("resize", ajustarAltura);
    if (aberto) window.addEventListener("scroll", ajustarAltura, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", ajustarAltura);
      window.removeEventListener("scroll", ajustarAltura);
    };
  }, [aberto]);

  useEffect(() => {
    if (!aberto) return;
    const painel = painelRef.current;
    const aoClicarFora = (event) => {
      if (!painel.contains(event.target)) onAberto(false);
    };
    const aoTeclar = (event) => {
      if (event.key === "Escape") {
        onAberto(false);
        painel.querySelector("[aria-controls]")?.focus();
      }
    };
    document.addEventListener("pointerdown", aoClicarFora);
    document.addEventListener("keydown", aoTeclar);
    return () => {
      document.removeEventListener("pointerdown", aoClicarFora);
      document.removeEventListener("keydown", aoTeclar);
    };
  }, [aberto, onAberto]);

  return (
    <aside ref={painelRef} className="afty-log" data-afty-aberto={aberto ? "sim" : "nao"} aria-label="Rolagens de dados">
      <div className="afty-log-topo flex items-center gap-1">
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
              aria-label={m.label}
              onClick={() => onModo(m.id)}
              title={m.label}
            >
              {m.label.slice(0, 3)}
            </button>
          ))}
        </span>
      </div>

      <div className="afty-log-ultima" aria-live="polite" aria-atomic="true">
        {ultima ? <Rolagem r={ultima} destaque /> : <span className="afty-rotulo text-[11px]">Sem rolagens</span>}
      </div>

      <button
        type="button"
        className="afty-botao afty-log-historico"
        onClick={() => onAberto(!aberto)}
        aria-expanded={aberto}
        aria-controls={historicoId}
        disabled={!ultima}
        title={aberto ? "Fechar o histórico" : "Abrir o histórico"}
        aria-label={aberto ? "Fechar o histórico" : "Abrir o histórico"}
      >
        <History className="w-3.5 h-3.5" aria-hidden="true" />
        <span>Histórico</span>
        {aberto ? <ChevronUp className="w-3 h-3" aria-hidden="true" /> : <ChevronDown className="w-3 h-3" aria-hidden="true" />}
      </button>

      <div id={historicoId} className="afty-log-corpo" hidden={!aberto}>
        <div className="afty-log-corpo-topo flex items-center justify-between px-2.5 py-1.5">
          <span className="afty-rotulo text-[11px]">Histórico</span>
          <button type="button" className="afty-passo" onClick={() => { onLimpar(); onAberto(false); }} title="Limpar o histórico" aria-label="Limpar o histórico">
            <Trash2 className="w-3 h-3" aria-hidden="true" />
          </button>
        </div>
        {aberto && log.map((r, i) => <Rolagem key={r.id} r={r} destaque={i === 0} />)}
      </div>
    </aside>
  );
}
