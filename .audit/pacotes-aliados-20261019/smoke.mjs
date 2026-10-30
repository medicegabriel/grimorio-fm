/* Fumaça visual do Para Aliados e dos Recebidos (2026-10-19). Contexto isolado, fichas sintéticas. Uso: BASE=http://127.0.0.1:5320 node <este arquivo> */
import fs from "node:fs";
import { chromium } from "playwright";
const DIR = `${process.cwd()}/.audit/pacotes-aliados-20261019`;
const BASE = process.env.BASE ?? "http://127.0.0.1:5320";
const { fichas } = JSON.parse(fs.readFileSync(`${DIR}/fichas.json`, "utf8"));
const browser = await chromium.launch({ channel: "chrome" });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
const p = await ctx.newPage();
const erros = [];
p.on("pageerror", (e) => erros.push(e.message));
p.on("console", (m) => { if (m.type() === "error") erros.push(`console: ${m.text()}`); });
await p.route("**/*", (rt) => { const u = new URL(rt.request().url()); return u.hostname === "127.0.0.1" || u.hostname === "localhost" ? rt.continue() : rt.abort(); });
await p.goto(`${BASE}/Player`, { waitUntil: "domcontentloaded" });
await p.evaluate((f) => localStorage.setItem("fm_creatures_player_v1", JSON.stringify([f.suporteA, f.receptor])), fichas);
await p.goto(`${BASE}/Player?ficha-g2=1`, { waitUntil: "domcontentloaded" });
await p.getByText(fichas.suporteA.name, { exact: true }).first().click();
await p.locator("#afty-ficha").waitFor();
await p.waitForTimeout(800);
await p.locator('[data-afty-aba="buffs"]').click();
await p.getByRole("button", { name: /Adicionar/ }).first().click();
await p.locator("[data-aba-aliados]").click();
await p.waitForTimeout(400);
await p.screenshot({ path: `${DIR}/smoke-1-para-aliados-vazio.png` });
await p.locator("[data-novo-pacote]").click();
await p.waitForTimeout(400);
await p.screenshot({ path: `${DIR}/smoke-2-fontes.png` });
for (const chave of ["aptidao|aura_do_bastiao", "aptidao|aura_do_comandante", "feitico|tp-f1", "invAura|tp-inv1|tp-c2"]) {
  await p.locator(`[data-fonte="${chave}"] .k-acao`).click();
}
await p.locator('[data-fonte="feitico|tp-f4"] .k-item').click();
await p.waitForTimeout(300);
await p.screenshot({ path: `${DIR}/smoke-3-fonte-bloqueada.png` });
await p.locator("[data-voltar-pacote]").click();
await p.waitForTimeout(300);
await p.screenshot({ path: `${DIR}/smoke-4-pacote.png` });
console.log(JSON.stringify({ erros }, null, 1));
await browser.close();
