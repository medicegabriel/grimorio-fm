/* Os esqueletos de carregamento (2026-11-26, fila "Carregamento" de docs/a-fazer.md).

   1. A MESMA MARCAÇÃO: o #root do index.html e o componente React do fallback (`EsqueletoDaLista.jsx`) são comparados tag por
      tag, porque a troca de um pelo outro não pode piscar. O componente é renderizado pelo Vite.
   2. O que os esqueletos NÃO podem ter: as marcas que a lista e a Ficha de verdade usam (e que a bancada de carregamento
      procura), animação e travessão. Todo `fm-esq-*` usado tem regra no <head>.
   3. As ligações: o main, o AftyFicha, o App e o compêndio. A escolha do desenho é conferida no t-app-rotas. */
import { readFileSync } from "node:fs";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

const lê = (p) => readFileSync(new URL(p, import.meta.url), "utf8").replace(/\r\n/g, "\n");
let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

const HTML = lê("../index.html");
const raiz = HTML.match(/<div id="root">([\s\S]*)<\/div>\s*<script type="module" src="\/src\/main\.jsx">/)?.[1] ?? "";
const junto = (s) => s.replace(/>\s+</g, "><").trim();

const server = await createServer({ server: { middlewareMode: true, ws: false }, appType: "custom", logLevel: "silent", optimizeDeps: { noDiscovery: true } });
try {
  const lista = await server.ssrLoadModule("/src/celular/EsqueletoDaLista.jsx");
  const { default: DaFicha } = await server.ssrLoadModule("/src/systems/afty/ficha/EsqueletoDaFicha.jsx");
  const deAbertura = renderToStaticMarkup(React.createElement(lista.Esqueleto));
  const doApp = renderToStaticMarkup(React.createElement(lista.EsqueletoDoCompendio));
  const ficha = renderToStaticMarkup(React.createElement(DaFicha));

  /* ---------- 1. a mesma marcação ---------- */
  const estatico = junto(raiz);
  // A primeira diferença, com o trecho em volta, para o erro dizer onde mexer.
  let i = 0;
  while (i < estatico.length && estatico[i] === deAbertura[i]) i++;
  const diferenca = estatico === deAbertura ? "igual" : `na posição ${i}: html «${estatico.slice(i - 40, i + 60)}» react «${deAbertura.slice(i - 40, i + 60)}»`;
  t("o #root do index.html é o componente do fallback", diferenca, "igual");
  const painel = (s) => s.slice(s.indexOf('<div class="fm-esq-painel"'), -"</div>".length);
  t("a espera do compêndio usa o mesmo painel", painel(doApp), painel(deAbertura));
  t("a espera do compêndio não repete a barra do site", doApp.includes("fm-esq-barra"), false);

  /* ---------- 2. o que um esqueleto não pode ter ---------- */
  for (const [nome, marcacao] of [["lista", deAbertura], ["compêndio", doApp], ["ficha", ficha]]) {
    t(`${nome}: ocupado, com um aviso só para o leitor de tela`, [
      /^<div class="[^"]+"[^>]*aria-busy="true"/.test(marcacao), (marcacao.match(/role="status"/g) ?? []).length, marcacao.includes('aria-hidden="true"'),
    ], [true, 1, nome !== "compêndio" || marcacao.includes('aria-hidden="true"')]);
    t(`${nome}: sem as marcas da tela de verdade`, /<(header|h1|h2|h3|button|input|a)\b|role="(button|tab|tablist)"|id="afty-ficha"|w-14 h-14/.test(marcacao), false);
    t(`${nome}: sem travessão e sem ponto e vírgula no texto`, /\u2014|;[^<>"]*</.test(marcacao.replace(/&amp;/g, "&")), false);
  }
  t("o aviso da lista", deAbertura.includes('<span class="fm-esq-voz-lista">Carregando Fichas</span>'), true);
  t("o aviso da Ficha", ficha.includes('role="status">Carregando Ficha</div>'), true);

  const ESTILO = HTML.match(/<style>([\s\S]*?)<\/style>/)?.[1] ?? "";
  t("o fundo do site desde o primeiro quadro, acima do :root do index.css", ESTILO.includes("html:root { background: #060910; }"), true);
  t("sem a marca do script, nada aparece", ESTILO.includes(".fm-esq { display: none;"), true);
  const CSS_DA_FICHA = lê("../src/systems/afty/ficha/esqueleto-ficha.css");
  /* D-90 a D-92: parados. Nem no CSS dos dois esqueletos (propriedades longas inclusive), nem na marcação. */
  t("parados: sem animação nem transição no CSS", /@keyframes|\b(animation|transition)(-[a-z-]+)?\s*:|view-transition/.test(ESTILO + CSS_DA_FICHA), false);
  t("parados: sem classe de animação nem SVG animado",
    /class="[^"]*\b(animate-|transition\b|transition-|duration-)|<animate|\sstyle="/.test(deAbertura + doApp + ficha), false);
  /* O primeiro quadro: até o main.jsx acender, só o fundo (senão o desenho segura a rede e a lista). */
  t("os dois esqueletos esperam o main", ESTILO.includes("html:not([data-fm-no-ar]) :is(.fm-esq-abertura, .fm-esq-no-app) > * { display: none !important; }"), true);
  const classes = (s) => [...new Set([...s.matchAll(/class="([^"]+)"/g)].flatMap((m) => m[1].split(" ")))];
  // Os ids dos links só acendem o da rota, e nem todo id tem regra.
  t("toda classe da lista tem regra no <head>",
    classes(deAbertura + doApp).filter((c) => c.startsWith("fm-esq") && !/^fm-esq-l-/.test(c) && !ESTILO.includes(`.${c}`)), []);
  t("toda classe da Ficha tem regra", classes(ficha).filter((c) => !CSS_DA_FICHA.includes(`.${c}`)), []);
  const reservas = [...CSS_DA_FICHA.matchAll(/var\((--afty-[a-z-]+)(\s*[,)])/g)].filter((m) => m[2].trim() === ")").map((m) => m[1]);
  t("todo token da Ficha leva a reserva do tema Padrão", reservas, []);
  const { TOKENS_DOC } = await server.ssrLoadModule("/src/systems/afty/ficha/ficha-tema.js");
  const padrao = Object.fromEntries(TOKENS_DOC.map((x) => [x.id, x.valor]));
  t("e a reserva é o valor do Padrão",
    [...CSS_DA_FICHA.matchAll(/var\((--afty-[a-z-]+),\s*(#[0-9a-fA-F]+)\)/g)].filter((m) => padrao[m[1]] !== m[2]).map((m) => `${m[1]} ${m[2]}`), []);
} finally {
  await server.close();
}

/* ---------- 3. as ligações ---------- */
const MAIN = lê("../src/main.jsx");
t("o main usa o esqueleto no fallback", MAIN.includes("<Suspense fallback={<EsqueletoDeAbertura />}>"), true);
const acende = MAIN.indexOf("setTimeout(() => document.documentElement.setAttribute('data-fm-no-ar', ''), Math.max(0, ESPERA_DO_ESQUELETO - performance.now()))");
t("o main marca a hora de acender depois dos pedidos e antes da primeira espera", [
  acende > MAIN.indexOf("let telaChegando = sessao ? null : pedirTela()"), acende < MAIN.indexOf("await nuvemChegando"), acende > 0,
], [true, true, true]);
// 700 ms: acima da lista com tudo em cache no celular da bancada (perto de 500 ms), e com conta (perto de 690 ms).
t("a espera do esqueleto", /^const ESPERA_DO_ESQUELETO = 700$/m.test(MAIN), true);
t("e nada mais o acende antes", (MAIN.match(/data-fm-no-ar/g) ?? []).length, 1);
const FICHA = lê("../src/systems/afty/ficha/AftyFicha.jsx");
t("a Ficha não fica mais vazia", [FICHA.includes("<Suspense fallback={<EsqueletoDaFicha />}>"), FICHA.includes("fallback={null}")], [true, false]);
const APP = lê("../src/App.jsx");
// Autor, 2026-11-26 ("Sim, como proposto"): só a pasta Criaturas Base e as telas fora da lista esperam o compêndio.
t("só a pasta Criaturas Base e as telas fora da lista esperam o compêndio", [
  APP.includes("const esperaCompendio = precisaCompendio && !compendio\n    && (view.name !== \"dashboard\" || folderView.type === \"builtins\");"),
  APP.includes(") : esperaCompendio ? ("),
  APP.includes(") : precisaCompendio && !compendio ? ("),
], [true, true, false]);
t("a espera mostra o esqueleto e a falha, o botão", [
  APP.includes("compendioFalhou ? <FalhaDoCompendio onTentar={tentarCompendio}"),
  APP.includes('view.name === "dashboard" ? <EsqueletoDoCompendio /> : <Carregando />'),
], [true, true]);
// Autor, 2026-11-26: a falha na pasta Criaturas Base tem saída para Todas as Criaturas, e só na lista.
t("a falha na lista sai para Todas as Criaturas", [
  APP.includes('onSair={view.name === "dashboard" ? () => setFolderView({ type: "all", folderId: null }) : undefined}'),
], [true]);
const COMPENDIO = lê("../src/celular/usar-compendio.js");
t("a falha zera a promessa e não é engolida", [
  /\.catch\(\(erro\) => \{\s*promessa = null;\s*throw erro;/.test(COMPENDIO), COMPENDIO.includes(".catch(() => {})"),
], [true, false]);
t("o pedido do compêndio sai antes da pintura do esqueleto", COMPENDIO.includes("useLayoutEffect(() => {"), true);
t("a falha vira estado, e o Tentar de Novo pede outra vez", [
  COMPENDIO.includes(".catch(() => { if (vivo) setFalhou(true); });"), COMPENDIO.includes("setTentativa((n) => n + 1);"),
], [true, true]);
const FALHA = lê("../src/celular/FalhaDoCompendio.jsx");
t("o aviso usa o ícone do lucide e o botão em Title Case", [
  FALHA.includes("<AlertTriangle"), FALHA.includes("⚠"), FALHA.includes("Tentar de Novo"),
], [true, false, true]);
t("o botão de saída só existe com a prop", [FALHA.includes("{onSair && ("), FALHA.includes("Todas as Criaturas")], [true, true]);

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
