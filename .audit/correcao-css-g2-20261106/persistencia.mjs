/* PONTO 7 do consultor: salvar/reabrir e exportar/importar o CSS Personalizado NO APP INTEIRO (build próprio em app-dist, porta 5346),
   com a ficha SINTÉTICA "Mesa Cheia" semeada num contexto de navegador novo (localStorage vazio, origem 127.0.0.1:5346).
   Não toca o dist diário, a 5173 nem dados reais. G2 aberto por ?ficha-g2=1 na rota /player. */
import { chromium } from "playwright";
import fs from "node:fs";

const DIR = new URL(".", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const BASE = process.env.BASE ?? "http://127.0.0.1:5346";
const dados = JSON.parse(fs.readFileSync(`${DIR}../previa-abas-g2-20261021/fichas/fichas.json`, "utf8"));
const base = { ...dados.fichas.mesa };
const agora = new Date().toISOString();
const semente = { ...base, aparencia: null, isBuiltIn: false, createdAt: agora, updatedAt: agora, editLog: [], stats: base.stats ?? { hp: 1, pe: 1, defense: 10 } };
const nav = await chromium.launch({ channel: "chrome", ignoreDefaultArgs: ["--hide-scrollbars"] });
const saida = { geradoEm: agora, base: BASE, checks: [], erros: [] };
const check = (id, ok, d) => { saida.checks.push({ id, ok: !!ok, ...(d !== undefined ? { dados: d } : {}) }); console.log(`  ${ok ? "ok    " : "FALHOU"} ${id}${!ok && d !== undefined ? " " + JSON.stringify(d).slice(0, 220) : ""}`); return !!ok; };

async function contexto(semear = true) {
  const ctx = await nav.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
  const p = await ctx.newPage();
  p.setDefaultTimeout(12000);
  p.on("pageerror", (e) => saida.erros.push(e.message));
  await p.route("**/*", (rt) => { const u = new URL(rt.request().url()); return ["blob:", "data:"].includes(u.protocol) || (u.hostname === "127.0.0.1" && !u.pathname.startsWith("/_vercel/")) ? rt.continue() : rt.abort(); });
  if (semear) {
    await p.goto(`${BASE}/player`, { waitUntil: "domcontentloaded" });
    await p.evaluate((c) => { localStorage.setItem("fm_creatures_player_v1", JSON.stringify([c])); }, semente);
  }
  return { ctx, p };
}
const abrirFicha = async (p) => {
  await p.goto(`${BASE}/player?ficha-g2=1`, { waitUntil: "domcontentloaded" });
  await p.getByText("Mesa Cheia (Teste Abas)").first().click();
  await p.locator("#afty-ficha").waitFor();
  await p.waitForTimeout(700);
};
const abrirAparencia = async (p) => {
  await p.locator('button[aria-label="Mais opções da ficha"]').click();
  await p.getByRole("menuitem", { name: "Aparência" }).click();
  await p.locator("textarea[aria-label='CSS personalizado']").waitFor();
};
const lerAparencia = (p) => p.evaluate(() => { const c = JSON.parse(localStorage.getItem("fm_creatures_player_v1") ?? "[]")[0]; return c?.aparencia ?? null; });
const nome = (p) => p.evaluate(() => { const e = document.querySelector("#afty-ficha .afty-nome"); return e ? getComputedStyle(e).color : null; });
const CSS = ".e-g2 .afty-nome { color: #ff00aa; }\n/* revisão 2026-11-05 */";

console.log("# P1 semear, abrir no G2 e salvar o CSS");
{
  const { ctx, p } = await contexto();
  await abrirFicha(p);
  const g2 = await p.locator(".e-g2").count();
  check("a ficha sintética abre no G2 pelo app inteiro (?ficha-g2=1)", g2 > 0, g2);
  await p.screenshot({ path: `${DIR}capturas/persist-1-aberta.png` });
  await abrirAparencia(p);
  await p.locator("textarea[aria-label='CSS personalizado']").fill(CSS);
  await p.locator(".afty-busca").getByRole("button", { name: "Pergaminho" }).click();
  await p.locator("textarea[aria-label='CSS personalizado']").fill(CSS);
  await p.waitForTimeout(1500);
  const ap = await lerAparencia(p);
  check("o tema chega ao armazenamento da criatura (aparencia.css e preset)", ap?.css === CSS && ap?.presetId === "pergaminho", ap && { css: ap.css?.length, preset: ap.presetId });
  check("o CSS vale na tela", (await nome(p)) === "rgb(255, 0, 170)", await nome(p));
  await ctx.storageState({ path: `${DIR}.estado-persistencia.json` });
  await ctx.close();
}

console.log("# P2 reabrir (estado salvo, página nova)");
{
  const ctx = await nav.newContext({ viewport: { width: 1440, height: 900 }, storageState: `${DIR}.estado-persistencia.json` });
  const p = await ctx.newPage();
  p.on("pageerror", (e) => saida.erros.push(e.message));
  await p.route("**/*", (rt) => ((new URL(rt.request().url()).hostname === "127.0.0.1" && !new URL(rt.request().url()).pathname.startsWith("/_vercel/")) || /^(blob|data):/.test(rt.request().url())) ? rt.continue() : rt.abort());
  await abrirFicha(p);
  check("o CSS salvo vale ao reabrir a ficha", (await nome(p)) === "rgb(255, 0, 170)", await nome(p));
  const preset = await p.evaluate(() => getComputedStyle(document.getElementById("afty-ficha")).getPropertyValue("--afty-fundo").trim());
  check("e o preset também", preset === "#efe6d3", preset);
  await p.screenshot({ path: `${DIR}capturas/persist-2-reaberta.png` });
  await ctx.close();
}

console.log("# P3 exportar e importar em OUTRO contexto");
let arquivoExportado = null;
{
  const ctx = await nav.newContext({ viewport: { width: 1440, height: 900 }, storageState: `${DIR}.estado-persistencia.json`, acceptDownloads: true });
  const p = await ctx.newPage();
  p.on("pageerror", (e) => saida.erros.push(e.message));
  await p.route("**/*", (rt) => ((new URL(rt.request().url()).hostname === "127.0.0.1" && !new URL(rt.request().url()).pathname.startsWith("/_vercel/")) || /^(blob|data):/.test(rt.request().url())) ? rt.continue() : rt.abort());
  await p.goto(`${BASE}/player`, { waitUntil: "domcontentloaded" });
  await p.getByText("Mesa Cheia (Teste Abas)").first().waitFor();
  /* menu do cartão: Exportar JSON */
  const cartao = p.locator("div,article,li").filter({ hasText: "Mesa Cheia (Teste Abas)" }).filter({ has: p.locator("button") }).last();
  await cartao.hover();
  const botoes = await p.evaluate(() => [...document.querySelectorAll("button")].map((b) => (b.getAttribute("aria-label") || b.title || b.textContent || "").trim()).filter(Boolean).slice(0, 40));
  saida.botoesDoDashboard = botoes;
  let baixou = false;
  try {
    await p.locator('[title*="Exportar"]').first().click();
    const [dl] = await Promise.all([p.waitForEvent("download", { timeout: 8000 }), p.getByRole("button", { name: /^Baixar/ }).first().click()]);
    arquivoExportado = `${DIR}.exportado-sintetico.json`;
    await dl.saveAs(arquivoExportado);
    baixou = true;
  } catch (e) { saida.erroExport = String(e).slice(0, 200); }
  check("Exportar JSON baixa um arquivo", baixou, saida.erroExport);
  if (baixou) {
    const j = JSON.parse(fs.readFileSync(arquivoExportado, "utf8"));
    const lista = Array.isArray(j) ? j : (j.creatures ?? j.criaturas ?? [j]);
    const c = lista[0];
    check("o arquivo exportado carrega aparencia.css e o preset", c?.aparencia?.css === CSS && c?.aparencia?.presetId === "pergaminho", c?.aparencia && { css: c.aparencia.css?.length, preset: c.aparencia.presetId });
  }
  await ctx.close();
}
if (arquivoExportado) {
  const { ctx, p } = await contexto(false);
  await p.goto(`${BASE}/player`, { waitUntil: "domcontentloaded" });
  const antes = await p.evaluate(() => localStorage.getItem("fm_creatures_player_v1"));
  check("o contexto de destino começa vazio", !antes || antes === "[]", antes?.slice(0, 40));
  let importou = false;
  try {
    await p.getByRole("button", { name: /^Importar/ }).first().click();
    await p.waitForTimeout(500);
    await p.locator('[role=dialog] textarea').fill(fs.readFileSync(arquivoExportado, "utf8"));
    await p.locator('[role=dialog]').getByRole("button", { name: /Importar/ }).last().click();
    await p.getByText("Mesa Cheia (Teste Abas)").first().waitFor({ timeout: 8000 });
    importou = true;
  } catch (e) { saida.erroImport = String(e).slice(0, 200); }
  check("Importar o arquivo cria a ficha", importou, saida.erroImport);
  if (importou) {
    const ap = await lerAparencia(p);
    check("a ficha importada traz o CSS e o preset", ap?.css === CSS && ap?.presetId === "pergaminho", ap && { css: ap.css?.length, preset: ap.presetId });
    await p.goto(`${BASE}/player?ficha-g2=1`, { waitUntil: "domcontentloaded" });
    await p.getByText("Mesa Cheia (Teste Abas)").first().click();
    await p.locator("#afty-ficha").waitFor(); await p.waitForTimeout(700);
    check("e o CSS importado vale na ficha aberta no G2", (await nome(p)) === "rgb(255, 0, 170)", await nome(p));
    await p.screenshot({ path: `${DIR}capturas/persist-3-importada.png` });
  }
  await ctx.close();
}

console.log("# P4 sair antes de 600 ms perde a última edição?");
{
  const { ctx, p } = await contexto();
  await abrirFicha(p);
  await abrirAparencia(p);
  await p.locator("textarea[aria-label='CSS personalizado']").fill(".e-g2 .afty-nome { color: #00ffaa; }");
  await p.keyboard.press("Escape");

  await p.locator('button[aria-label="Voltar"]').first().click();
  await p.waitForTimeout(1500);
  const ap = await lerAparencia(p);
  check("sair da ficha logo depois de editar mantém a edição", ap?.css?.includes("#00ffaa"), ap && { css: ap.css });
  await ctx.close();
}

saida.resumo = `${saida.checks.filter((c) => c.ok).length}/${saida.checks.length}, erros de página ${saida.erros.length}`;
fs.writeFileSync(`${DIR}persistencia.json`, JSON.stringify(saida, null, 2));
for (const f of [`${DIR}.estado-persistencia.json`]) try { fs.unlinkSync(f); } catch { /* ok */ }
await nav.close();
console.log(saida.resumo, saida.erros.slice(0, 3));
