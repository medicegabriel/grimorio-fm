import { chromium } from "playwright";
import fs from "node:fs";
const BASE = "http://127.0.0.1:5310";
const pasta = "C:/Projetos/Grimorio/grimorio-tracker/.audit/integracao-g2/capturas";
const amostras = JSON.parse(fs.readFileSync("C:/Projetos/Grimorio/prototipos/ficha-final-v2/dados/amostras.json", "utf8")).amostras;
const a = amostras.find((x) => x.id === "megumi");
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
const erros = [];
page.on("pageerror", (e) => erros.push(e.message));
page.on("console", (m) => { if (m.type() === "error") erros.push("console: " + m.text().slice(0, 200)); });
const log = (...x) => console.log(...x);
try {
  await page.goto(`${BASE}/afty`, { waitUntil: "domcontentloaded" });
  await page.evaluate((f) => localStorage.setItem("fm_creatures_afty_v1", JSON.stringify([f])), { ...a.ficha, id: "g2-enc-megumi" });
  await page.goto(`${BASE}/afty`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /^Encontros/ }).click();
  await page.getByRole("button", { name: /Novo Encontro/ }).first().click();
  await page.waitForTimeout(500);
  await page.locator("button", { hasText: "Adicionar" }).first().click();
  await page.waitForTimeout(600);
  log("combatentes:", (await page.locator("body").innerText()).match(/COMBATENTES \((\d+)\)/i)?.[1]);
  await page.getByRole("button", { name: "Rolar", exact: true }).first().click();
  await page.waitForTimeout(300);
  await page.locator("button", { hasText: "Começar" }).first().click({ timeout: 5000 }).catch((e) => log("Começar:", e.message.split("\n")[0]));
  await page.waitForTimeout(800);
  await page.getByRole("button", { name: "Nova Rodada" }).first().click();
  await page.waitForTimeout(400);
  log("rodada:", (await page.locator("body").innerText()).match(/RODADA d+/)?.[0]);
  for (const aba of ["Habilidades", "Buffs"]) { await page.getByRole("button", { name: aba, exact: true }).first().click().catch(() => page.getByText(aba, { exact: true }).first().click()); await page.waitForTimeout(500); log(aba, "ok, erros:", erros.length); }
  await page.screenshot({ path: `${pasta}/encontros-3.png` });
  log("tela:", (await page.locator("body").innerText()).split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 50).join(" | "));
  log("erros", JSON.stringify(erros.slice(0, 4)));
} catch (e) { log("FALHA:", e.message.split("\n")[0]); log("erros", JSON.stringify(erros.slice(0, 4))); await page.screenshot({ path: `${pasta}/encontros-falha.png` }); } finally { await browser.close(); }
