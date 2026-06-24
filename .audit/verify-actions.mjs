import { chromium } from "playwright";
import fs from "fs";

const OUT = new URL("./shots/", import.meta.url).pathname.replace(/^\//, "");
fs.mkdirSync(OUT, { recursive: true });
const URL_BASE = "http://localhost:5174";
const clip = (page, name, c) => page.screenshot({ path: `${OUT}/act_${name}.png`, clip: c });

(async () => {
  let browser;
  try { browser = await chromium.launch({ channel: "chrome" }); }
  catch { browser = await chromium.launch(); }
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 }, deviceScaleFactor: 1.5 });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => console.log("PAGEERROR:", e.message));
  page.on("console", (m) => { if (m.type() === "error") console.log("CONSOLE.ERR:", m.text()); });

  await page.goto(URL_BASE, { waitUntil: "networkidle" });
  await page.click('button[title="Criar nova criatura"]');
  await page.waitForSelector("text=Nova Criatura", { timeout: 8000 });
  await page.getByPlaceholder("Ex: Maldição da Varíola").fill("Espadachim Teste");

  // Programar uma ação
  const sec = page.locator("#section-actions");
  await sec.scrollIntoViewIfNeeded();
  await sec.getByRole("button", { name: /Adicionar Ação/ }).first().click();
  await page.getByPlaceholder("Ex: Garra Lacerante").fill("Investida Furiosa");
  await sec.getByRole("button", { name: /^Automatizar/ }).click();
  await page.waitForTimeout(150);
  await sec.getByRole("button", { name: /Adicionar regra/ }).click();
  await page.waitForTimeout(150);
  await sec.getByLabel("Gatilho").selectOption("activated");
  await page.waitForTimeout(150);
  await sec.getByLabel("Custo em PE").fill("10");
  await sec.getByLabel("Valor").first().fill("5");
  await page.waitForTimeout(200);
  // clip do editor da ação (a regra programada)
  const box = await sec.boundingBox();
  await clip(page, "01_editor", { x: box.x, y: Math.max(0, box.y), width: box.width, height: Math.min(900, box.height) });
  console.log("editor -> shot 01");

  await sec.getByRole("button", { name: "Adicionar", exact: true }).click();
  await page.waitForTimeout(300);
  await page.getByRole("button", { name: /Criar Ficha/ }).click();
  await page.waitForTimeout(800);

  // Tracker
  await page.getByText("Espadachim Teste", { exact: false }).first().click();
  await page.waitForSelector("text=Modificadores", { timeout: 8000 });
  await page.waitForTimeout(400);

  const peText = () => page.evaluate(() => {
    const lbl = [...document.querySelectorAll("*")].find(
      (e) => e.children.length === 0 && /Energia Amaldi/i.test(e.textContent || "")
    );
    return lbl ? (lbl.closest("[class*='border']")?.textContent || "").replace(/\s+/g, " ").trim().slice(0, 50) : "?";
  });

  const defText = () => page.evaluate(() => {
    const lbl = [...document.querySelectorAll("*")].find(
      (e) => e.children.length === 0 && /^Defesa$/i.test((e.textContent || "").trim())
    );
    return lbl ? (lbl.closest("[class*='rounded']")?.textContent || "").replace(/\s+/g, " ").trim().slice(0, 24) : "?";
  });

  await page.evaluate(() => window.scrollTo(0, 0));
  await clip(page, "02_topo_antes", { x: 0, y: 0, width: 1280, height: 820 });
  console.log("PE antes:", await peText(), "| Defesa antes:", await defText());

  const ativar = page.getByRole("button", { name: /Ativar:/ }).first();
  console.log("Ativar visivel:", await ativar.isVisible().catch(() => false));
  await ativar.scrollIntoViewIfNeeded();
  const ab = await ativar.boundingBox();
  await clip(page, "03_botao", { x: 0, y: Math.max(0, ab.y - 40), width: 1280, height: 160 });
  await ativar.click();
  await page.waitForTimeout(400);
  console.log("PE depois:", await peText(), "| Defesa depois:", await defText());

  await page.evaluate(() => window.scrollTo(0, 0));
  await clip(page, "04_topo_depois", { x: 0, y: 0, width: 1280, height: 820 });

  await browser.close();
  console.log("DONE");
})().catch((e) => { console.log("SCRIPT ERROR:", e.message); process.exit(1); });
