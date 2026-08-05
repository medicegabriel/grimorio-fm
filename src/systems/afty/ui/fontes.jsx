import React, { useEffect, useRef, useState } from "react";
import { sinalDe } from "./formato";

/**
 * ============================================================
 * FONTES DE UM NÚMERO — o painel que explica de onde ele vem
 * ============================================================
 * Extraído do `AftyCreatureBuilder.jsx` em 2026-08-05, quando a Ficha Final
 * passou a precisar do mesmo painel. Eram funções LOCAIS do criador, sem export,
 * e copiar divergiria na primeira errata.
 *
 * A regra de UI do projeto é que o criador CALCULA e não ENSINA: nenhum número
 * derivado carrega fórmula escrita na tela, e a explicação dele mora AQUI.
 *
 * Três componentes, e a diferença entre eles é quem é o gatilho:
 *
 *   • `PainelDeFontes`  — só o painel. Quem o abre é um ancestral com a classe
 *                         `group`, por CSS puro. É o que o criador usa.
 *   • `ValorComFontes`  — gatilho e painel juntos, no formato de bônus (`+7`).
 *   • `NumeroComFontes` — irmão do de cima que TAMBÉM abre no TOQUE. Ver abaixo.
 * ============================================================
 */

/* O painel em si. Uma linha por fonte e o total. `texto` numa parcela substitui
   o número, para as que não somam (os multiplicadores de Alma e Patamar no PV).
   Zeros NÃO são filtrados: "Destreza +0" diz qual atributo dirige o valor. */
/* `aparecer` existe para o caso de DOIS painéis na mesma linha (a de Dano tem
   Acerto e Dano, cada um com as fontes dele). O `group-hover` sem nome responde
   a qualquer ancestral com a classe `group`, então o painel de dentro abriria
   junto com o de fora. Quem precisa de hover próprio passa um grupo NOMEADO, e
   a string vem literal do chamador porque o Tailwind lê o código-fonte e não
   enxerga classe montada em template. */
/* `aberto` é o caminho do TOQUE, e ele TIRA o `hidden` em vez de somar um
   `block` por cima: `hidden` e `block` são utilidades da mesma camada, e quem
   vence é a ordem em que o Tailwind as gerou, não a ordem do atributo class. */
export function PainelDeFontes({ partes, total, ancora = "direita", aparecer = "group-hover:block", aberto = false }) {
  return (
    <span className={`${aberto ? "block" : `hidden ${aparecer}`} absolute top-full mt-1 z-30 w-max max-w-[min(16rem,calc(100vw-2rem))] rounded-lg border border-slate-700 bg-slate-950 shadow-xl shadow-black/50 p-2 text-left ${
      ancora === "esquerda" ? "left-0" : "right-0"
    }`}>
      {/* `suplantado` é o perdedor do pool exclusivo (a arma venceu o shikigami).
          Ele aparece riscado e apagado, e não some: sem a linha, o jogador veria
          o bônus do shikigami desaparecer da ficha sem nada explicando. */}
      {(partes || []).filter(Boolean).map((p, i) => (
        <span key={i} className="flex items-baseline justify-between gap-3 whitespace-nowrap">
          <span className={`text-[10px] ${p.suplantado ? "text-slate-600 line-through" : "text-slate-400"}`}>{p.label}</span>
          <span className={`font-mono text-[10px] tabular-nums ${p.suplantado ? "text-slate-600 line-through" : "text-slate-200"}`}>
            {p.texto ?? sinalDe(p.valor)}
          </span>
        </span>
      ))}
      <span className="flex items-baseline justify-between gap-3 whitespace-nowrap border-t border-slate-800 mt-1 pt-1">
        <span className="text-[10px] uppercase tracking-wider text-slate-500">Total</span>
        <span className="font-mono text-[10px] font-bold tabular-nums text-white">{total}</span>
      </span>
    </span>
  );
}

export function ValorComFontes({ valor, partes }) {
  const lista = (partes || []).filter(Boolean);
  return (
    <span className="relative group flex-shrink-0">
      <span className="font-mono text-sm font-bold tabular-nums text-white w-9 block cursor-help text-right">
        {sinalDe(valor)}
      </span>
      {lista.length > 0 && <PainelDeFontes partes={lista} total={sinalDe(valor)} />}
    </span>
  );
}

/**
 * O número da FICHA FINAL, com as fontes ao passar o mouse OU ao tocar.
 *
 * ⚠ O painel do criador é `hidden group-hover:block`, CSS puro, e no celular ele
 * nunca abre: o "de onde vem esse número" some justo para quem não tem como
 * conferir a conta na mão. Um quarto do uso da Ficha é toque (autor,
 * 2026-08-05), então aqui o valor é um BOTÃO de verdade.
 *
 * O hover continua valendo para quem tem mouse, e os dois caminhos convivem sem
 * estado compartilhado: tocar num segundo número fecha o primeiro sozinho,
 * porque o clique cai FORA dele.
 */
/**
 * ⚠ COM `onRolar`, O CLIQUE ROLA. É a inversão que a mesa pede: rolar é o que se
 * faz o tempo todo e conferir a conta é o que se faz de vez em quando, então a
 * ação comum fica no gesto barato. As fontes continuam alcançáveis pelos dois
 * caminhos que sobram: **hover** no mouse (75% do uso) e **toque longo** no
 * dedo. Sem `onRolar`, o clique volta a abrir as fontes, que é o que os números
 * do cabeçalho (Defesa, CD, RD) fazem, porque não se rola nenhum deles.
 */
const ESPERA_TOQUE_LONGO = 450;

export function NumeroComFontes({
  valor, partes, total, ancora = "esquerda", className = "", titulo, formatar = true, onRolar,
}) {
  const lista = (partes || []).filter(Boolean);
  const [aberto, setAberto] = useState(false);
  const raiz = useRef(null);
  const timer = useRef(null);
  const abriuNoSegurar = useRef(false);

  useEffect(() => {
    if (!aberto) return undefined;
    const fora = (e) => { if (!raiz.current?.contains(e.target)) setAberto(false); };
    const esc = (e) => { if (e.key === "Escape") setAberto(false); };
    // `pointerdown` e não `click`: fechar no começo do toque evita o painel
    // piscar aberto enquanto o dedo ainda está descendo sobre o próximo número.
    document.addEventListener("pointerdown", fora);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", fora);
      document.removeEventListener("keydown", esc);
    };
  }, [aberto]);

  // Limpa o relógio do toque longo ao desmontar, senão um `setAberto` chega
  // depois de o componente sair da tela.
  useEffect(() => () => clearTimeout(timer.current), []);

  const seguraComeca = () => {
    if (!onRolar || !lista.length) return;
    abriuNoSegurar.current = false;
    timer.current = setTimeout(() => {
      abriuNoSegurar.current = true;
      setAberto(true);
    }, ESPERA_TOQUE_LONGO);
  };
  const seguraTermina = () => clearTimeout(timer.current);

  const aoClicar = () => {
    if (!onRolar) { setAberto((a) => !a); return; }
    // O toque longo já abriu o painel: o clique que vem junto não pode rolar.
    if (abriuNoSegurar.current) { abriuNoSegurar.current = false; return; }
    onRolar();
  };

  const texto = formatar && typeof valor === "number" ? sinalDe(valor) : valor;
  if (!lista.length && !onRolar) {
    return <span className={className} title={titulo}>{texto}</span>;
  }
  return (
    <span ref={raiz} className="afty-fontes-raiz relative group inline-flex">
      <button
        type="button"
        onClick={aoClicar}
        onPointerDown={seguraComeca}
        onPointerUp={seguraTermina}
        onPointerLeave={seguraTermina}
        onContextMenu={(e) => { if (onRolar && lista.length) e.preventDefault(); }}
        aria-expanded={lista.length ? aberto : undefined}
        title={titulo}
        className={`${onRolar ? "afty-rolavel cursor-pointer" : "cursor-help"} text-left ${className}`}
      >
        {texto}
      </button>
      {lista.length > 0 && (
        <PainelDeFontes
          partes={lista}
          total={total ?? texto}
          ancora={ancora}
          aberto={aberto}
        />
      )}
    </span>
  );
}
