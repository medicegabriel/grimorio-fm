/* O app de celular, etapa E1 (2026-11-19): o título de cada rota e a rota de cada grupo da Sala.

   1. O `index.html` põe o título da rota ANTES do React, por um script inline. As expressões dele precisam casar com as do
      `App.jsx` e do `era-de-ouro.js` (é a rota que decide o grimório), então este arquivo roda o script com um `location`
      e um `document` de mentira e confere as duas fontes como texto.
   2. A Sala volta para a rota do grupo dela e o Editar abre a mesma rota (`rotaDoGrupo`). Até aqui era sempre `/Player`, e a
      ficha de um jogador da Guilda não existe lá. */
import { register } from "node:module";
import { readFileSync } from "node:fs";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const lê = (p) => readFileSync(new URL(p, import.meta.url), "utf8");
const D = await import(new URL("../src/nuvem/sala-ui/sala-ui-dados.js", import.meta.url).href);

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

/* ---------- 1. o título por rota ---------- */
const HTML = lê("../index.html");
const script = HTML.match(/<script>\s*([\s\S]*?)<\/script>/)?.[1] ?? "";
const tituloEm = (pathname) => {
  const document = { title: "Grimório F&M" };
  new Function("location", "document", script)({ pathname }, document);
  return document.title;
};
t("o título padrão saiu do Vite", /<title>Grimório F&amp;M<\/title>/.test(HTML), true);
t("a cor de tema é o fundo do site", HTML.includes('<meta name="theme-color" content="#060910" />'), true);
t("raiz", tituloEm("/"), "Grimório F&M");
t("Era de Ouro", ["/EraDeOuro", "/eradeouro/", "/ERADEOURO"].map(tituloEm), ["Era de Ouro", "Era de Ouro", "Era de Ouro"]);
t("Jogador", ["/Player", "/player/"].map(tituloEm), ["Ficha de Jogador", "Ficha de Jogador"]);
t("Afty", ["/Afty", "/afty/"].map(tituloEm), ["Grimório Afty", "Grimório Afty"]);
t("Sala", ["/Sala/ABC123", "/sala/nova"].map(tituloEm), ["Sala", "Sala"]);
t("rota desconhecida fica no padrão", ["/foo", "/EraDeOuro/x"].map(tituloEm), ["Grimório F&M", "Grimório F&M"]);

const APP = lê("../src/App.jsx");
const ERA = lê("../src/systems/eradeouro/era-de-ouro.js");
t("o App ainda decide o Afty pela mesma expressão", APP.includes("/^\\/afty\\/?$/i"), true);
t("o App ainda decide o Player pela mesma expressão", APP.includes("/^\\/player\\/?$/i"), true);
t("a Guilda ainda se decide pela mesma expressão", ERA.includes("/^\\/eradeouro\\/?$/i"), true);
t("o index.html usa as três", ["/^\\/eradeouro\\/?$/i", "/^\\/player\\/?$/i", "/^\\/afty\\/?$/i"].every((re) => script.includes(re)), true);
t("o script não tem travessão", new RegExp("\\u2014").test(script), false);

/* ---------- 2. a rota de cada grupo da Sala ---------- */
t("rota de cada grupo", ["site", "afty", "eradeouro"].map(D.rotaDoGrupo), ["/Player", "/Player", "/EraDeOuro"]);
t("grupo desconhecido cai em /Player", [undefined, null, "outro"].map(D.rotaDoGrupo), ["/Player", "/Player", "/Player"]);
t("a rota espelha o armazém (mesmo grupo, mesma lista)",
  Object.keys(D.ROTA_DO_GRUPO).sort(), Object.keys(D.ARMAZEM_DO_GRUPO).sort());
t("a Guilda edita onde guarda", D.ARMAZEM_DO_GRUPO.eradeouro.namespace === "eradeouro" && D.rotaDoGrupo("eradeouro") === "/EraDeOuro", true);

const JOGADOR = lê("../src/nuvem/sala-ui/TelaDoJogador.jsx");
const PAGINA = lê("../src/nuvem/SalaPagina.jsx");
t("o Editar abre a rota do grupo", JOGADOR.includes("window.open(rotaDoGrupo(grupo)"), true);
t("o Editar não abre mais /Player fixo", JOGADOR.includes('window.open("/Player"'), false);
t("a Sala passa o grupo ao Voltar", PAGINA.includes("onVoltar?.(grupoDaSala)"), true);
t("o App volta pela rota do grupo", APP.includes("location.assign(rotaDoGrupo(grupo))"), true);
t("o App não volta mais a /Player fixo", APP.includes('location.assign("/Player")'), false);

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
