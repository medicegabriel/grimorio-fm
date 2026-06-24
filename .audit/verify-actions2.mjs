import { chromium } from "playwright";
import fs from "fs";

const OUT = new URL("./shots/", import.meta.url).pathname.replace(/^\//, "");
fs.mkdirSync(OUT, { recursive: true });
const URL_BASE = "http://localhost:5174";

(async () => {
  let browser;
  try { browser = await chromium.launch({ channel: "chrome" }); }
  catch { browser = await chromium.launch(); }
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 }, deviceScaleFactor: 1.5 });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => console.log("PAGEERROR:", e.message));

  await page.goto(URL_BASE, { waitUntil: "networkidle" });
  // Abrir tracker da criatura já salva
  await page.getByText("Espadachim Teste", { exact: false }).first().click();
  await page.waitForSelector("text=Modificadores", { timeout: 8000 });
  await page.waitForTimeout(400);

  const peText = () => page.evaluate(() => {
    const els = [...document.querySelectorAll("*")];
    const pe = els.find((e) => e.children.length === 0 && /Energia Amaldi/i.test(e.textContent || ""));
    return pe ? pe.closest("div")?.parentElement?.textContent?.replace(/\s+/g, " ").trim().slice(0, 60) : "?";
  });

  // Topo (vitals: HP/PE/Guarda) + stats
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `${OUT}/act2_01_topo_antes.png`, clip: { x: 0, y: 0, width: 1280, height: 520 } });

  // Achar e ativar a ação
  const ativar = page.getByRole("button", { name: /Ativar:/ }).first();
  console.log("Ativar visivel:", await ativar.isVisible().catch(() => false));
  console.log("PE antes:", await peText());
  await ativar.scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${OUT}/act2_02_botao_ativar.png`, clip: { x: 0, y: 0, width: 1280, height: 1000 } });
  await ativar.click();
  await page.waitForTimeout(400);
  console.log("PE depois:", await peText());

  // Topo de novo (PE deve ter caído, Defesa deve estar azul)
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `${OUT}/act2_03_topo_depois.png`, clip: { x: 0, y: 0, width: 1280, height: 520 } });
  // Botão agora deve ser Desativar
  const desativar = page.getByRole("button", { name: /Desativar:/ }).first();
  await desativar.scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${OUT}/act2_04_botao_desativar.png`, clip: { x: 0, y: 0, width: 1280, height: 1000 } });

  await browser.close();
  console.log("DONE");
})().catch((e) => { console.log("SCRIPT ERROR:", e.message); process.exit(1); });
