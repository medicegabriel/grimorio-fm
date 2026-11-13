/* Lacunas do consultor, parte do app inteiro (5343), fichas sintéticas em contexto limpo:
   G1 o padrão GLOBAL "Usar este tema como padrão" é por sistema (Player não contamina /Afty)
   G2 sair da ficha CLÁSSICA logo depois de editar perde a edição? (o P4 só tinha sido provado no G2) */
import { chromium } from "playwright";
import fs from "node:fs";
const DIR = new URL(".", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const dados = JSON.parse(fs.readFileSync(`${DIR}../previa-abas-g2-20261021/fichas/fichas.json`, "utf8"));
const agora = new Date().toISOString();
const ficha = (k) => ({ ...dados.fichas[k], aparencia: null, isBuiltIn: false, createdAt: agora, updatedAt: agora, editLog: [], stats: { hp: 1, pe: 1, defense: 10 } });
const nav = await chromium.launch({ channel: "chrome" });
const saida = { checks: [] };
const check = (id, ok, d) => { saida.checks.push({ id, ok: !!ok, d }); console.log(`  ${ok ? "ok    " : "FALHOU"} ${id}${!ok ? " " + JSON.stringify(d).slice(0, 200) : ""}`); };
const abre = async () => { const ctx = await nav.newContext({ viewport: { width: 1440, height: 900 } }); const p = await ctx.newPage(); await p.route("**/*", (rt) => (new URL(rt.request().url()).hostname === "127.0.0.1" || /^(blob|data):/.test(rt.request().url())) ? rt.continue() : rt.abort()); return { ctx, p }; };
const fundo = (p) => p.evaluate(() => getComputedStyle(document.getElementById("afty-ficha")).getPropertyValue("--afty-fundo").trim());
const semear = async (p, rota, chave, lista) => { await p.goto(`http://127.0.0.1:5343${rota}`, { waitUntil: "domcontentloaded" }); await p.evaluate(([k, l]) => localStorage.setItem(k, JSON.stringify(l)), [chave, lista]); };

console.log("# G1 padrão global por sistema");
{
  const { ctx, p } = await abre();
  await semear(p, "/player", "fm_creatures_player_v1", [ficha("mesa"), ficha("tipica")]);
  await p.evaluate((c) => localStorage.setItem("fm_creatures_afty_v1", JSON.stringify([c])), ficha("criatura"));
  await p.goto("http://127.0.0.1:5343/player?ficha-g2=1", { waitUntil: "domcontentloaded" });
  await p.getByText("Mesa Cheia (Teste Abas)").first().click(); await p.locator("#afty-ficha").waitFor(); await p.waitForTimeout(600);
  await p.locator('button[aria-label="Mais opções da ficha"]').click(); await p.getByRole("menuitem", { name: "Aparência" }).click();
  await p.locator(".afty-busca").getByRole("button", { name: "Pergaminho" }).click();
  await p.getByRole("button", { name: /Usar este tema como padrão/ }).click(); await p.waitForTimeout(500);
  check("a ficha A ficou Pergaminho", (await fundo(p)) === "#efe6d3", await fundo(p));
  await p.goto("http://127.0.0.1:5343/player?ficha-g2=1", { waitUntil: "domcontentloaded" });
  await p.getByText("Mesa Típica (Teste Abas)").first().click(); await p.locator("#afty-ficha").waitFor(); await p.waitForTimeout(600);
  check("outra ficha do Player, sem tema próprio, herda o padrão global", (await fundo(p)) === "#efe6d3", await fundo(p));
  await p.goto("http://127.0.0.1:5343/afty?ficha-g2=1", { waitUntil: "domcontentloaded" });
  await p.getByText("Criatura (Teste Abas)").first().click(); await p.locator("#afty-ficha").waitFor(); await p.waitForTimeout(600);
  check("uma criatura de /afty, sem tema próprio, NÃO herda o padrão do Player", (await fundo(p)) === "#060910", await fundo(p));
  await ctx.close();
}

console.log("# G2 sair da ficha clássica logo depois de editar");
{
  const { ctx, p } = await abre();
  await semear(p, "/player", "fm_creatures_player_v1", [ficha("mesa")]);
  await p.goto("http://127.0.0.1:5343/player", { waitUntil: "domcontentloaded" });
  await p.getByText("Mesa Cheia (Teste Abas)").first().click(); await p.locator("#afty-ficha").waitFor(); await p.waitForTimeout(600);
  const classica = await p.locator(".e-g2").count();
  check("a ficha aberta é a clássica (sem .e-g2)", classica === 0, classica);
  await p.getByRole("button", { name: /Aparência/ }).first().click();
  await p.locator("textarea[aria-label='CSS personalizado']").fill(".afty-nome { color: #00ffaa; }");
  await p.locator('.afty-busca button[aria-label="Fechar"]').click();
  await p.locator('button[aria-label="Voltar"]').first().click();
  await p.waitForTimeout(1500);
  const ap = await p.evaluate(() => JSON.parse(localStorage.getItem("fm_creatures_player_v1") ?? "[]")[0]?.aparencia ?? null);
  check("sair da ficha clássica logo depois de editar mantém a edição", ap?.css?.includes("#00ffaa"), ap);
  await ctx.close();
}
fs.writeFileSync(`${DIR}lacunas-app.json`, JSON.stringify(saida, null, 2));
await nav.close();
console.log(`${saida.checks.filter((c) => c.ok).length}/${saida.checks.length}`);
