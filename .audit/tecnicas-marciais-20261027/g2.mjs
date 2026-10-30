/* Conferência no navegador da linha da Técnica de Ataque no G2 (2026-10-27). Uso: node .audit/tecnicas-marciais-20261027/g2.mjs [jogador|criatura] */
import { chromium } from "playwright";
import os from "node:os";
import path from "node:path";
import assert from "node:assert/strict";

const cena = process.argv[2] ?? "jogador";
const tmp = (n) => path.join(os.tmpdir(), `tm-g2-${cena}-${n}.png`);
const browser = await chromium.launch({ channel: "chrome", ignoreDefaultArgs: ["--hide-scrollbars"] });
try {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
  const page = await ctx.newPage();
  page.setDefaultTimeout(15000);
  const erros = [];
  page.on("pageerror", (e) => erros.push(e.message));
  page.on("console", (m) => { if (m.type() === "error") erros.push("console: " + m.text()); });
  await page.goto(`http://127.0.0.1:5341/?ficha=${cena}`, { waitUntil: "networkidle" });
  await page.getByRole("tab", { name: /^Ações/ }).click();
  await page.waitForTimeout(600);
  const secao = page.locator('[data-m-linha="feitico:tm-golpe"]');
  await secao.waitFor();
  const quebra = page.locator('[data-m-linha="feitico:tm-quebra"]');
  await quebra.waitFor();
  const aux = page.locator('[data-m-linha="feitico:tm-aux"]');
  console.log("AUX presente:", await aux.count());
  console.log("GOLPE", JSON.stringify((await secao.innerText()).split("\n").filter(Boolean)));
  console.log("QUEBRA", JSON.stringify((await quebra.innerText()).split("\n").filter(Boolean)));
  await page.screenshot({ path: tmp(1) });

  // Marca os acertos da Quebra e confere a escada
  const marcas = quebra.getByRole("button", { name: "Acertou" });
  const n = await marcas.count();
  console.log("golpes da Quebra:", n);
  await marcas.nth(0).click();
  await marcas.nth(1).click();
  console.log("APÓS 2 ACERTOS", JSON.stringify((await quebra.locator('[data-m-bloco="condicao"]').innerText()).split("\n")));
  // Rola o primeiro golpe do Golpe Partido
  const historicoAntes = (await page.locator("body").innerText()).length;
  await secao.getByRole("button", { name: /Dano/ }).first().click();
  await page.waitForTimeout(400);
  const arma = secao.locator("select");
  console.log("ARMAS", JSON.stringify(await arma.locator("option").allInnerTexts()));
  await arma.selectOption({ index: 1 });
  await page.waitForTimeout(400);
  console.log("DEPOIS DA ARMA", JSON.stringify((await secao.innerText()).split("\n").filter(Boolean).slice(0, 14)));
  await page.screenshot({ path: tmp(2) });
  console.log("ERROS", JSON.stringify(erros));
  assert.equal(erros.length, 0);
} finally {
  await browser.close();
}
