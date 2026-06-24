import { chromium } from "playwright";
import fs from "fs";

const OUT = new URL("./shots/", import.meta.url).pathname.replace(/^\//, "");
fs.mkdirSync(OUT, { recursive: true });
const URL_BASE = "http://localhost:5173";
const shot = (page, name) => page.screenshot({ path: `${OUT}/trk_${name}.png`, fullPage: true });

(async () => {
  let browser;
  try { browser = await chromium.launch({ channel: "chrome" }); }
  catch { browser = await chromium.launch(); }
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 1100 }, deviceScaleFactor: 1.25 });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => console.log("PAGEERROR:", e.message));
  page.on("console", (m) => { if (m.type() === "error") console.log("CONSOLE.ERR:", m.text()); });

  await page.goto(URL_BASE, { waitUntil: "networkidle" });
  await page.click('button[title="Criar nova criatura"]');
  await page.waitForSelector("text=Nova Criatura", { timeout: 8000 });

  // Nome da criatura (obrigatório)
  await page.getByPlaceholder("Ex: Maldição da Varíola").fill("Guerreiro Teste");

  // Característica + automação
  const sec = page.locator("#section-caracteristicas");
  await sec.scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
  await sec.getByRole("button", { name: /Adicionar Característica/ }).first().click();
  await page.getByPlaceholder("Nome").first().fill("Aura de Batalha");
  await sec.getByRole("button", { name: /^Adicionar$/ }).last().click();
  await page.waitForTimeout(300);
  await sec.getByRole("button", { name: /Aura de Batalha/ }).click();
  await sec.getByRole("button", { name: /Automatizar/ }).click();
  await page.waitForTimeout(150);

  // Regra 1: Passiva, Defesa +5
  await sec.getByRole("button", { name: /Adicionar regra/ }).click();
  await page.waitForTimeout(150);
  await sec.getByLabel("Valor").first().fill("5");

  // Regra 2: Ativada, Defesa +3
  await sec.getByRole("button", { name: /Adicionar regra/ }).click();
  await page.waitForTimeout(150);
  await sec.getByLabel("Gatilho").nth(1).selectOption("activated");
  await page.waitForTimeout(150);
  await sec.getByLabel("Valor").nth(1).fill("3");
  await page.waitForTimeout(150);
  console.log("automacao montada");

  // Salvar a ficha
  await page.getByRole("button", { name: /Criar Ficha/ }).click();
  await page.waitForTimeout(800);

  // Abrir o tracker da criatura (clicar no card)
  await page.getByText("Guerreiro Teste", { exact: false }).first().click();
  await page.waitForSelector("text=Modificadores", { timeout: 8000 });
  await page.waitForTimeout(400);
  await shot(page, "01_panel_passivo");
  console.log("tracker aberto -> shot 01");

  // Ativar a regra ativada
  const ativar = page.getByRole("button", { name: /Ativar:/ }).first();
  if (await ativar.isVisible().catch(() => false)) {
    await ativar.click();
    await page.waitForTimeout(400);
    await shot(page, "02_panel_ativado");
    console.log("regra ativada -> shot 02");
  } else {
    console.log("botao Ativar nao encontrado");
  }

  await browser.close();
  console.log("DONE");
})().catch((e) => { console.log("SCRIPT ERROR:", e.message); process.exit(1); });
