import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
 *   • `PainelDeFontes`  — só o painel, ancorado no pai. Quem o abre é um
 *                         ancestral com a classe `group`, por CSS puro. É o que
 *                         o CRIADOR usa, e ele não mudou.
 *   • `ValorComFontes`  — gatilho e painel juntos, no formato de bônus (`+7`).
 *   • `NumeroComFontes` — o da FICHA FINAL. Abre no hover, no toque e no
 *                         teclado, e o painel dele FLUTUA (ver abaixo).
 * ============================================================
 */

/* Uma linha por fonte e o total. `texto` numa parcela substitui o número, para
   as que não somam (os multiplicadores de Alma e Patamar no PV). Zeros NÃO são
   filtrados: "Destreza +0" diz qual atributo dirige o valor.

   `suplantado` é o perdedor do pool exclusivo (a arma venceu o shikigami). Ele
   aparece riscado e apagado, e não some: sem a linha, o jogador veria o bônus do
   shikigami desaparecer da ficha sem nada explicando. */
function LinhasDeFonte({ partes, total }) {
  return (
    <>
      {(partes || []).filter(Boolean).map((p, i) => (
        <span key={i} className="afty-fonte-linha flex items-baseline justify-between gap-3 whitespace-nowrap">
          <span className={`afty-fonte-rotulo text-[10px] ${p.suplantado ? "line-through opacity-60" : ""}`}>{p.label}</span>
          <span className={`afty-fonte-valor font-mono text-[10px] tabular-nums ${p.suplantado ? "line-through opacity-60" : ""}`}>
            {p.texto ?? sinalDe(p.valor)}
          </span>
        </span>
      ))}
      <span className="afty-fonte-total flex items-baseline justify-between gap-3 whitespace-nowrap mt-1 pt-1">
        <span className="text-[10px] uppercase tracking-wider">Total</span>
        <span className="font-mono text-[10px] font-bold tabular-nums">{total}</span>
      </span>
    </>
  );
}

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
    <span className={`afty-fontes ${aberto ? "block" : `hidden ${aparecer}`} absolute top-full mt-1 z-30 w-max max-w-[min(16rem,calc(100vw-2rem))] p-2 text-left ${
      ancora === "esquerda" ? "left-0" : "right-0"
    }`}>
      <LinhasDeFonte partes={partes} total={total} />
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

/* ============================================================ */
/* O painel FLUTUANTE da Ficha Final                            */
/* ============================================================ */

/**
 * ⚠ POR QUE ELE FLUTUA, em vez de ficar ancorado no pai como no criador.
 *
 * O painel ancorado é `position: absolute` dentro da linha, e isso o prende ao
 * CONTEXTO DE EMPILHAMENTO do cartão em que ele nasceu. Basta o cartão ganhar
 * `backdrop-filter`, `transform`, `filter` ou `opacity` para virar um contexto
 * próprio, e aí NENHUM z-index salva o painel: o cartão seguinte, que vem depois
 * no documento, pinta por cima dele inteiro. `overflow: hidden` num cartão faz
 * pior, corta o painel na borda.
 *
 * No criador isso nunca aconteceu porque o CSS é meu. Na FICHA o CSS é do
 * usuário, e um vidro fosco nos cartões (que é das primeiras coisas que qualquer
 * IA escreve) quebra o hover inteiro. Foi exatamente o que o autor viu.
 *
 * A saída é tirar o painel de dentro do cartão: ele é enviado por PORTAL para a
 * raiz da Ficha e posicionado em `fixed`, a partir do retângulo do gatilho.
 *
 * ⚠ O portal vai para `#afty-ficha`, e NÃO para o `document.body`. Dois motivos,
 * e os dois são fatais se errar: as variáveis `--afty-*` são declaradas em
 * `.afty-ficha` e não chegariam ao body, e o `@scope (#afty-ficha)` do CSS do
 * usuário também não alcançaria o painel. Ele ficaria sem tema nenhum.
 */
const ESPERA_TOQUE_LONGO = 450;

/** O gatilho tem hover de verdade? No dedo, hover não existe. */
const temHover = () =>
  typeof window !== "undefined" && window.matchMedia?.("(hover: hover)").matches;

function PainelFlutuante({ partes, total, retangulo, ancora }) {
  if (!retangulo) return null;
  const alvo = (typeof document !== "undefined"
    && (document.getElementById("afty-ficha") ?? document.body)) || null;
  if (!alvo) return null;

  // Abre para CIMA quando o gatilho está na metade de baixo da tela, senão o
  // painel nasce fora da área visível e o jogador não vê nada.
  const paraCima = retangulo.bottom > window.innerHeight * 0.6;
  const estilo = {
    position: "fixed",
    ...(paraCima
      ? { bottom: Math.round(window.innerHeight - retangulo.top + 4) }
      : { top: Math.round(retangulo.bottom + 4) }),
    ...(ancora === "esquerda"
      ? { left: Math.round(Math.max(8, retangulo.left)) }
      : { right: Math.round(Math.max(8, window.innerWidth - retangulo.right)) }),
  };

  return createPortal(
    <span className="afty-fontes afty-fontes-flutuante block w-max max-w-[min(16rem,calc(100vw-1rem))] p-2 text-left" style={estilo}>
      <LinhasDeFonte partes={partes} total={total} />
    </span>,
    alvo,
  );
}

/**
 * ⚠ COM `onRolar`, O CLIQUE ROLA. É a inversão que a mesa pede: rolar é o que se
 * faz o tempo todo e conferir a conta é o que se faz de vez em quando, então a
 * ação comum fica no gesto barato. As fontes continuam alcançáveis pelos dois
 * caminhos que sobram: **hover** no mouse (75% do uso) e **toque longo** no
 * dedo. Sem `onRolar`, o clique volta a abrir as fontes, que é o que os números
 * do cabeçalho (Defesa, CD, RD) fazem, porque não se rola nenhum deles.
 */
export function NumeroComFontes({
  valor, partes, total, ancora = "esquerda", className = "", titulo, formatar = true, onRolar,
}) {
  const lista = (partes || []).filter(Boolean);
  const [retangulo, setRetangulo] = useState(null);
  const gatilho = useRef(null);
  const timer = useRef(null);
  const abriuNoSegurar = useRef(false);
  const aberto = !!retangulo;

  const abrir = useCallback(() => {
    const r = gatilho.current?.getBoundingClientRect();
    if (r) setRetangulo(r);
  }, []);
  const fechar = useCallback(() => setRetangulo(null), []);

  useEffect(() => {
    if (!aberto) return undefined;
    const fora = (e) => { if (!gatilho.current?.contains(e.target)) fechar(); };
    const esc = (e) => { if (e.key === "Escape") fechar(); };
    // ⚠ Rolar e redimensionar FECHAM o painel. Ele é `fixed` com coordenadas
    // calculadas na abertura, então rolar a página o deixaria plantado no ar,
    // longe do número que ele explica.
    document.addEventListener("pointerdown", fora);
    document.addEventListener("keydown", esc);
    window.addEventListener("scroll", fechar, true);
    window.addEventListener("resize", fechar);
    return () => {
      document.removeEventListener("pointerdown", fora);
      document.removeEventListener("keydown", esc);
      window.removeEventListener("scroll", fechar, true);
      window.removeEventListener("resize", fechar);
    };
  }, [aberto, fechar]);

  // Limpa o relógio do toque longo ao desmontar, senão um `setRetangulo` chega
  // depois de o componente sair da tela.
  useEffect(() => () => clearTimeout(timer.current), []);

  const seguraComeca = () => {
    if (!onRolar || !lista.length || temHover()) return;
    abriuNoSegurar.current = false;
    timer.current = setTimeout(() => { abriuNoSegurar.current = true; abrir(); }, ESPERA_TOQUE_LONGO);
  };
  const seguraTermina = () => clearTimeout(timer.current);

  const aoClicar = () => {
    if (!onRolar) { if (aberto) fechar(); else abrir(); return; }
    // O toque longo já abriu o painel: o clique que vem junto não pode rolar.
    if (abriuNoSegurar.current) { abriuNoSegurar.current = false; return; }
    onRolar();
  };

  const texto = formatar && typeof valor === "number" ? sinalDe(valor) : valor;
  if (!lista.length && !onRolar) {
    return <span className={className} title={titulo}>{texto}</span>;
  }
  return (
    <span className="afty-fontes-raiz relative inline-flex">
      <button
        ref={gatilho}
        type="button"
        onClick={aoClicar}
        onPointerDown={seguraComeca}
        onPointerUp={seguraTermina}
        onPointerLeave={() => { seguraTermina(); if (temHover()) fechar(); }}
        onPointerEnter={() => { if (lista.length && temHover()) abrir(); }}
        onFocus={() => { if (lista.length) abrir(); }}
        onBlur={fechar}
        onContextMenu={(e) => { if (onRolar && lista.length) e.preventDefault(); }}
        aria-expanded={lista.length ? aberto : undefined}
        title={titulo}
        className={`${onRolar ? "afty-rolavel cursor-pointer" : "cursor-help"} text-left ${className}`}
      >
        {texto}
      </button>
      {aberto && lista.length > 0 && (
        <PainelFlutuante partes={lista} total={total ?? texto} retangulo={retangulo} ancora={ancora} />
      )}
    </span>
  );
}
