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
    /* ⚠ `pointer-events-none` NÃO É DETALHE, É O CONSERTO DE 2026-09-02.

       O painel é FILHO do gatilho, e `:hover` sobe para os ancestrais: encostar
       nele mantinha o gatilho em hover, então ele ficava aberto. Como ele é bem
       maior que o gatilho (80 a 165px de altura contra 30), ele cobria as filas
       de baixo e as ROUBAVA: no bloco de detalhe da Invocação, abrir o painel de
       Corpo tapava a fila de Acerto, e a tentativa de passar o mouse em Acerto
       caía dentro do painel de Corpo, que não fechava. Da tela, isso é
       exatamente "o hover está bugado".

       Sem receber ponteiro, o painel deixa de ser alvo: o mouse atravessa ele e
       chega em quem está embaixo. Ninguém precisa clicar num painel de leitura. */
    <span className={`afty-fontes pointer-events-none ${aberto ? "block" : `hidden ${aparecer}`} absolute top-full mt-1 z-30 w-max max-w-[min(16rem,calc(100vw-2rem))] p-2 text-left ${
      ancora === "esquerda" ? "left-0" : "right-0"
    }`}>
      <LinhasDeFonte partes={partes} total={total} />
    </span>
  );
}

export function ValorComFontes({ valor, partes, texto = null }) {
  const lista = (partes || []).filter(Boolean);
  /* ⚠ `texto` SUBSTITUI O NÚMERO quando a linha tem uma ROLAGEM, e não só um
     bônus fixo. O primeiro caso é o Teste de Resistência que ganha dado ("+7 +
     2d3", Resiliência pela Adrenalina): mostrar só o "+7" leria como se fosse
     tudo. A caixa alarga porque a expressão não cabe na largura do número. */
  const mostrado = texto ?? sinalDe(valor);
  return (
    <span className="relative group flex-shrink-0">
      <span className={`font-mono text-sm font-bold tabular-nums text-white block cursor-help text-right ${texto ? "w-20" : "w-9"}`}>
        {mostrado}
      </span>
      {lista.length > 0 && <PainelDeFontes partes={lista} total={mostrado} />}
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
 * ⚠ O portal vai para o container do TEMA, e NÃO para o `document.body`. Dois
 * motivos, e os dois são fatais se errar: as variáveis `--afty-*` são declaradas
 * em `.afty-ficha` e não chegariam ao body, e o `@scope (#afty-ficha)` do CSS do
 * usuário também não alcançaria o painel. Ele ficaria sem tema nenhum.
 *
 * ⚠ Quem acha o container é o `closest(".afty-ficha")` A PARTIR DO GATILHO
 * (2026-08-10), e não mais o `getElementById` direto. O id só existe na
 * `AftyFicha`, e a tela de ENCONTRO tem a classe sem o id: todo hover de dentro
 * do painel do combatente estava escapando para o `document.body` e caindo nos
 * fallbacks embutidos, com sombra e cor erradas. Procurar pelo ancestral resolve
 * as duas telas e qualquer outra que reuse as abas, sem precisar espalhar um id
 * que tem que ser único.
 */
const ESPERA_TOQUE_LONGO = 450;

/** O gatilho tem hover de verdade? No dedo, hover não existe. */
const temHover = () =>
  typeof window !== "undefined" && window.matchMedia?.("(hover: hover)").matches;

/**
 * A MOLDURA flutuante: portal, posicionamento e nada mais.
 *
 * ⚠ Extraída em 2026-08-10, quando a descrição das melhorias de Liberação
 * Máxima passou a precisar do mesmo painel. Havia UMA implementação de portal
 * bem comentada aqui e a alternativa era copiá-la, o que garantiria duas versões
 * divergentes na primeira errata de posicionamento.
 */
function MolduraFlutuante({ retangulo, ancora, gatilho, largura = "16rem", children }) {
  if (!retangulo) return null;
  // O gatilho já está montado aqui: só existe `retangulo` porque o `abrir()`
  // mediu o elemento. `getElementById` fica de rede de segurança para um gatilho
  // que por algum motivo não esteja dentro de um `.afty-ficha`.
  const alvo = (typeof document !== "undefined"
    && (gatilho?.current?.closest?.(".afty-ficha")
      ?? document.getElementById("afty-ficha")
      ?? document.body)) || null;
  if (!alvo) return null;

  // Abre para CIMA quando o gatilho está na metade de baixo da tela, senão o
  // painel nasce fora da área visível e o jogador não vê nada.
  const paraCima = retangulo.bottom > window.innerHeight * 0.6;
  const estilo = {
    position: "fixed",
    maxWidth: `min(${largura}, calc(100vw - 1rem))`,
    ...(paraCima
      ? { bottom: Math.round(window.innerHeight - retangulo.top + 4) }
      : { top: Math.round(retangulo.bottom + 4) }),
    ...(ancora === "esquerda"
      ? { left: Math.round(Math.max(8, retangulo.left)) }
      : { right: Math.round(Math.max(8, window.innerWidth - retangulo.right)) }),
  };

  return createPortal(
    <span className="afty-fontes afty-fontes-flutuante block w-max p-2 text-left" style={estilo}>
      {children}
    </span>,
    alvo,
  );
}

function PainelFlutuante({ partes, total, retangulo, ancora, gatilho }) {
  return (
    <MolduraFlutuante retangulo={retangulo} ancora={ancora} gatilho={gatilho}>
      <LinhasDeFonte partes={partes} total={total} />
    </MolduraFlutuante>
  );
}

/**
 * A mecânica de abrir e fechar um painel flutuante: medir o gatilho, fechar no
 * Escape, no clique fora, ao rolar e ao redimensionar.
 *
 * ⚠ Rolar e redimensionar FECHAM. O painel é `fixed` com coordenadas calculadas
 * na abertura, então rolar a página o deixaria plantado no ar, longe do que ele
 * explica.
 */
function useFlutuante() {
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

  /* O TOQUE LONGO mora aqui dentro, e não em quem chama: o relógio e a marca são
     estado do painel, e mexer neles de fora é o que o `react-hooks` proíbe (com
     razão, era a mesma lógica escrita duas vezes). */
  const segurarComeca = useCallback((habilitado) => {
    if (!habilitado || temHover()) return;
    abriuNoSegurar.current = false;
    timer.current = setTimeout(() => { abriuNoSegurar.current = true; abrir(); }, ESPERA_TOQUE_LONGO);
  }, [abrir]);
  const segurarTermina = useCallback(() => clearTimeout(timer.current), []);
  /* Devolve `true` quando o clique que acabou de chegar é o do gesto que ABRIU o
     painel, e portanto não deve acionar nada. Consome a marca ao responder. */
  const consumiuToqueLongo = useCallback(() => {
    if (!abriuNoSegurar.current) return false;
    abriuNoSegurar.current = false;
    return true;
  }, []);

  return { gatilho, retangulo, aberto, abrir, fechar, segurarComeca, segurarTermina, consumiuToqueLongo };
}

/**
 * ============================================================
 * DICA DE TEXTO — a regra do livro, no hover
 * ============================================================
 * Autor, 2026-08-10: *"coloca a descrição nos efeitos de Liberação Máxima
 * quando eu passar o mouse em cima. Por ser suplemento, fica difícil acessar."*
 *
 * ⚠ Isto NÃO contradiz a regra de "nada de texto explicativo na UI". A regra
 * sempre teve a saída de que explicação de ITEM vive no hover. O que muda é o
 * veículo: o `title` nativo demora quase um segundo para nascer, some ao mexer o
 * mouse, não abre no teclado e não existe no toque. Para um catálogo de
 * suplemento, que é justamente o texto que ninguém tem na mão, isso é o mesmo
 * que não ter.
 *
 * ⚠ ENVOLVE o gatilho em vez de virar o gatilho. A pastilha da melhoria já é um
 * botão com ação própria (ligar e desligar), e botão dentro de botão é HTML
 * inválido. O `<span>` de fora escuta o ponteiro e o foco, e o botão de dentro
 * segue sendo o que clica.
 * ============================================================
 */
export function DicaDeTexto({ titulo, texto, nota, ancora = "esquerda", children }) {
  const {
    gatilho, retangulo, aberto, abrir, fechar, segurarComeca, segurarTermina, consumiuToqueLongo,
  } = useFlutuante();
  const temTexto = !!(texto || nota);

  if (!temTexto) return children;
  return (
    <span
      ref={gatilho}
      className="inline-flex"
      onPointerEnter={() => { if (temHover()) abrir(); }}
      onPointerLeave={() => { segurarTermina(); if (temHover()) fechar(); }}
      onPointerDown={() => segurarComeca(true)}
      onPointerUp={segurarTermina}
      // O toque longo abriu a dica: o clique que vem junto não pode acionar o
      // botão de dentro, ou ler a regra ligaria a melhoria sem querer.
      onClickCapture={(e) => {
        if (consumiuToqueLongo()) { e.stopPropagation(); e.preventDefault(); }
      }}
      onFocusCapture={abrir}
      onBlurCapture={fechar}
    >
      {children}
      {aberto && (
        <MolduraFlutuante retangulo={retangulo} ancora={ancora} gatilho={gatilho} largura="22rem">
          {titulo && <span className="afty-dica-titulo block">{titulo}</span>}
          {texto && <span className="afty-dica-texto block">{texto}</span>}
          {nota && <span className="afty-dica-nota block">{nota}</span>}
        </MolduraFlutuante>
      )}
    </span>
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
  const {
    gatilho, retangulo, aberto, abrir, fechar, segurarComeca, segurarTermina, consumiuToqueLongo,
  } = useFlutuante();

  const seguraComeca = () => segurarComeca(!!onRolar && lista.length > 0);
  const seguraTermina = segurarTermina;

  const aoClicar = () => {
    if (!onRolar) { if (aberto) fechar(); else abrir(); return; }
    // O toque longo já abriu o painel: o clique que vem junto não pode rolar.
    if (consumiuToqueLongo()) return;
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
        <PainelFlutuante partes={lista} total={total ?? texto} retangulo={retangulo} ancora={ancora} gatilho={gatilho} />
      )}
    </span>
  );
}
