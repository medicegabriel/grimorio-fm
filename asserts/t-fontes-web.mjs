/* As fontes da internet do tema (ficha-tema.js, 2026-11-10): a lista fechada, o endereço montado só da tabela, a fonte de tema recebido presa à
   lista, o bloco de variáveis que não deixa valor fugir da declaração, e o Prompt IA que cita a lista, a escala e a impressão. */
import { register } from "node:module";
register("data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(!/\\.[a-z]+$/.test(s)&&s.startsWith('.'))return n(s+'.js',c);throw e}}", import.meta.url);

await import("../src/systems/afty/afty-derive.js");
const { FONTES, FONTES_WEB, normalizaTema, fontesWebDoTema, urlDasFontesWeb, cssDasVars, cssDasVarsDaInvocacao, promptParaIA } = await import("../src/systems/afty/ficha/ficha-tema.js");

let n = 0;
let falhas = 0;
const t = (nome, real, esperado) => {
  n += 1;
  if (JSON.stringify(real) !== JSON.stringify(esperado)) { falhas += 1; console.error(`FALHOU ${nome}\n  real:     ${JSON.stringify(real)}\n  esperado: ${JSON.stringify(esperado)}`); process.exitCode = 1; }
};
const cinzel = FONTES_WEB.find((f) => f.familia === "Cinzel");
const lora = FONTES_WEB.find((f) => f.familia === "Lora");

/* A lista que o autor aprovou, e cada pilha com reserva do sistema. */
t("doze famílias", FONTES_WEB.map((f) => f.familia), ["Inter", "Lora", "Merriweather", "Playfair Display", "Cormorant Garamond", "Cinzel", "Oswald", "Barlow Condensed", "Chakra Petch", "Shippori Mincho", "JetBrains Mono", "Caveat"]);
t("toda pilha termina numa família genérica", FONTES_WEB.every((f) => /(serif|sans-serif|monospace|cursive)$/.test(f.id)), true);
t("nenhuma pilha repete uma do sistema", FONTES_WEB.some((f) => FONTES.some((x) => x.id === f.id)), false);

/* Tema recebido: só fonte das listas. */
t("fonte da lista fica", normalizaTema({ fonte: cinzel.id }).fonte, cinzel.id);
t("fonte do sistema fica", normalizaTema({ fonte: FONTES[1].id }).fonte, FONTES[1].id);
t("fonte fora da lista cai", normalizaTema({ fonte: "\"Comic Sans MS\", cursive" }).fonte, null);
t("fonte que tenta fugir do bloco cai", normalizaTema({ fonte: "x; } @font-face { src: url(https://mal.example/a.woff2) } a {" }).fonte, null);

/* Quem a ficha baixa. */
t("sem nada, nenhuma", fontesWebDoTema({}), []);
t("pelo painel", fontesWebDoTema({ fonte: cinzel.id }).map((f) => f.familia), ["Cinzel"]);
t("pelo nome no CSS livre", fontesWebDoTema({ css: ".afty-nome { font-family: \"Lora\", serif; }" }).map((f) => f.familia), ["Lora"]);
t("CSS livre desligado não baixa", fontesWebDoTema({ css: ".afty-nome { font-family: Lora; }", ligado: false }), []);
t("família fora da lista no CSS não baixa", fontesWebDoTema({ css: ".afty-nome { font-family: Roboto; }" }), []);
t("cursor: pointer não baixa a Inter", fontesWebDoTema({ css: ".afty-botao { cursor: pointer; pointer-events: none; }" }), []);
t("comentário não baixa", fontesWebDoTema({ css: "/* explora a Lora e o Cinzel */ .afty-card { color: red; }" }), []);
t("nome sem aspas no font abreviado", fontesWebDoTema({ css: ".afty-nome { font: 600 20px Cinzel, serif; }" }).map((f) => f.familia), ["Cinzel"]);
t("nome composto com aspas", fontesWebDoTema({ css: ".afty-nome { font-family: 'Playfair Display', serif; }" }).map((f) => f.familia), ["Playfair Display"]);
t("pela variável de fonte", fontesWebDoTema({ css: ":scope#afty-ficha { --afty-fonte-display: \"Oswald\", sans-serif; }" }).map((f) => f.familia), ["Oswald"]);
t("Inter dentro de outro nome não conta", fontesWebDoTema({ css: ".afty-nome { font-family: Interstate, sans-serif; }" }), []);
/* Os temas do repositório só baixam o que nomeiam de fato. */
const fs = await import("node:fs");
for (const arq of ["arcane-g2", "minamoto-no-flugel", "alter-lucielos"]) {
  const css = fs.readFileSync(new URL(`../themes/${arq}.css`, import.meta.url), "utf8");
  const nomeia = FONTES_WEB.filter((f) => new RegExp(`font[^;{}]*["'\\s,]${f.familia}["'\\s,;]`, "i").test(css.replace(/\/\*[\s\S]*?\*\//g, ""))).map((f) => f.familia);
  t(`tema ${arq} só baixa o que nomeia`, fontesWebDoTema({ css }).map((f) => f.familia), nomeia);
}

/* O endereço sai só da tabela. */
t("endereço de uma família", urlDasFontesWeb([cinzel]), "https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&display=swap");
t("duas famílias, em ordem", urlDasFontesWeb([lora, cinzel]), "https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Lora:wght@400;500;600;700&display=swap");
t("nada, sem endereço", urlDasFontesWeb([]), "");
t("entrada forjada é ignorada", urlDasFontesWeb([{ familia: "X", google: "X&family=Y:url(https://mal.example)" }]), "");
t("prévia com text em vez de display", urlDasFontesWeb([cinzel], "Cinzel").endsWith("&text=Cinzel"), true);

/* O bloco de variáveis, fora do @scope, não deixa valor escapar. */
const vars = cssDasVars({ vars: { "--afty-card": "red; } @font-face { src: url(https://mal.example/a.woff2) } a {", "--afty-borda": "#123456" } });
t("valor com chave some do bloco", vars.includes("mal.example"), false);
t("valor limpo continua", vars.includes("--afty-borda: #123456;"), true);
t("nome de variável estranho some", cssDasVars({ vars: { "color: red; --afty-x": "1" } }).includes("color: red"), false);
t("invocação tem a mesma trava", cssDasVarsDaInvocacao({ vars: { "--afty-card": "a{b}" } }, "#afty-inv-1"), "");
t("fonte da lista entra nas quatro variáveis de fonte", (cssDasVars({ fonte: cinzel.id }).match(/"Cinzel"/g) ?? []).length, 4);

/* O Prompt IA. */
const g2 = promptParaIA({}, { estrutura: "g2" });
const classica = promptParaIA({}, { estrutura: "classica" });
t("G2: cita a lista", FONTES_WEB.every((f) => g2.includes(f.id)), true);
t("G2: cita a escala", ["--e-fs-micro", "--e-fs-corpo", "--e-fs-destaque"].every((x) => g2.includes(x)), true);
t("clássica: sem lista nem escala", classica.includes("Cinzel") || classica.includes("--e-fs-corpo"), false);
t("os dois dizem que a impressão é do app", [g2, classica].every((p) => p.includes("@media print")), true);
t("invocação: sem lista", promptParaIA({}, { escopo: "#afty-inv-1", estrutura: "g2" }).includes("Cinzel"), false);

console.log(falhas ? `${falhas} DE ${n} ASSERTS FALHARAM` : `TODOS OS ${n} ASSERTS PASSARAM`);
