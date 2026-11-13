/* PONTO 5 (isolamento): o CSS de uma ficha pinta o resto do app? No app inteiro (5346), com a ficha sintética: grava um CSS que mira body, h1, o
   cabeçalho do Dashboard e botões, abre a ficha, volta ao Dashboard e mede o computado do que é de FORA da ficha. Também prova o token --afty-fonte-display
   do protótipo (5345). */
import { chromium } from "playwright";
import fs from "node:fs";
const DIR = new URL(".", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const dados = JSON.parse(fs.readFileSync(`${DIR}../previa-abas-g2-20261021/fichas/fichas.json`, "utf8"));
const agora = new Date().toISOString();
const A = { ...dados.fichas.mesa, aparencia: { presetId: "padrao", ligado: true, css: "body, html, h1, h2, button, a, .fixed, #root { background: #ff00ff !important; color: #00ff00 !important; outline: 3px solid #ff0 !important; }\n.e-g2 .afty-card { border-color: #f00; }" }, isBuiltIn: false, createdAt: agora, updatedAt: agora, editLog: [], stats: { hp: 1, pe: 1, defense: 10 } };
const B = { ...dados.fichas.tipica, isBuiltIn: false, createdAt: agora, updatedAt: agora, editLog: [], stats: { hp: 1, pe: 1, defense: 10 } };
const nav = await chromium.launch({ channel: "chrome" });
const out = [];
const check = (id, ok, d) => { out.push({ id, ok: !!ok, d }); console.log(`  ${ok ? "ok    " : "FALHOU"} ${id}${!ok ? " " + JSON.stringify(d) : ""}`); };
const ctx = await nav.newContext({ viewport: { width: 1440, height: 900 } }); const p = await ctx.newPage();
await p.route("**/*", (rt) => (new URL(rt.request().url()).hostname === "127.0.0.1" || /^(blob|data):/.test(rt.request().url())) ? rt.continue() : rt.abort());
await p.goto("http://127.0.0.1:5346/player", { waitUntil: "domcontentloaded" });
await p.evaluate(([a, b]) => localStorage.setItem("fm_creatures_player_v1", JSON.stringify([a, b])), [A, B]);
const medeFora = () => p.evaluate(() => { const g = (e) => e ? { bg: getComputedStyle(e).backgroundColor, cor: getComputedStyle(e).color, ol: getComputedStyle(e).outlineStyle } : null; return { body: g(document.body), root: g(document.getElementById("root")), h1: g(document.querySelector("h1:not(#afty-ficha *)")), botaoFora: g([...document.querySelectorAll("button")].find((b) => !b.closest("#afty-ficha"))), a: null }; });
await p.goto("http://127.0.0.1:5346/player", { waitUntil: "domcontentloaded" }); await p.getByText("Mesa Cheia (Teste Abas)").first().waitFor();
const base = await medeFora();
await p.goto("http://127.0.0.1:5346/player?ficha-g2=1", { waitUntil: "domcontentloaded" });
await p.getByText("Mesa Cheia (Teste Abas)").first().click(); await p.locator("#afty-ficha").waitFor(); await p.waitForTimeout(800);
const dentro = await p.evaluate(() => getComputedStyle(document.querySelector("[data-m-secao]") ?? document.querySelector(".afty-card")).borderTopColor);
check("o CSS vale dentro da ficha A (controle)", dentro === "rgb(255, 0, 0)", dentro);
const naFicha = await medeFora();
const iguais = JSON.stringify(base.body) === JSON.stringify(naFicha.body) && JSON.stringify(base.root) === JSON.stringify(naFicha.root);
check("body e #root, fora de #afty-ficha, NÃO foram pintados (@scope isola a raiz)", iguais, { base: base.body, naFicha: naFicha.body });
const rodape = await p.evaluate(() => { const e = [...document.querySelectorAll("body > div, #root > div")].filter((x) => !x.matches("#afty-ficha") && x.querySelector("#afty-ficha") == null).map((x) => getComputedStyle(x).backgroundColor).slice(0, 4); return e; });
check("irmãos da ficha na página (selo, Livro de Regras) sem o magenta", rodape.every((c) => c !== "rgb(255, 0, 255)"), rodape);
await p.locator('button[aria-label="Voltar"]').first().click(); await p.waitForTimeout(800);
const depois = await medeFora();
check("de volta ao Dashboard nada ficou pintado", JSON.stringify(base.body) === JSON.stringify(depois.body) && JSON.stringify(base.h1) === JSON.stringify(depois.h1), { base: base.body, depois: depois.body });
await p.getByText("Mesa Típica (Teste Abas)").first().click(); await p.locator("#afty-ficha").waitFor(); await p.waitForTimeout(800);
const outra = await p.evaluate(() => getComputedStyle(document.querySelector("[data-m-secao]") ?? document.querySelector(".afty-card")).borderTopColor);
check("a ficha B, aberta depois, NÃO herda o CSS da ficha A", outra !== "rgb(255, 0, 0)", outra);
await ctx.close();
/* token de fonte do protótipo (5345) */
const c2 = await nav.newContext(); const q = await c2.newPage();
await q.goto("http://127.0.0.1:5345/?ficha=mesa&tema=escuro", { waitUntil: "domcontentloaded" }); await q.locator("#afty-ficha").waitFor(); await q.waitForTimeout(600);
const f0 = await q.evaluate(() => getComputedStyle(document.querySelector(".afty-nome")).fontFamily);
await q.evaluate(() => { const s = document.createElement("style"); s.textContent = "#afty-ficha#afty-ficha{--afty-fonte-display: Georgia, serif}"; document.getElementById("afty-ficha").appendChild(s); });
const f1 = await q.evaluate(() => getComputedStyle(document.querySelector(".afty-nome")).fontFamily);
check("protótipo: --afty-fonte-display muda a fonte do nome do G2 (hoje ela é fixa)", /Bahnschrift/.test(f0) && /Georgia/.test(f1), { f0: f0.slice(0, 30), f1: f1.slice(0, 30) });
fs.writeFileSync(`${DIR}isolamento.json`, JSON.stringify(out, null, 2));
await nav.close();
console.log(`${out.filter((x) => x.ok).length}/${out.length}`);
