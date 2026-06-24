import { chromium } from "playwright";
import fs from "fs";

const OUT = new URL("./shots/", import.meta.url).pathname.replace(/^\//, "");
fs.mkdirSync(OUT, { recursive: true });

const TAG = process.argv[2] || "before"; // "before" | "after"
const URL_BASE = "http://localhost:5173";

const widths = [
  { name: "m360", w: 360, h: 800 },
  { name: "m390", w: 390, h: 844 },
  { name: "pc1280", w: 1280, h: 900 },
];

async function gotoBuilder(page) {
  await page.goto(URL_BASE, { waitUntil: "networkidle" });
  await page.click('button[title="Criar nova criatura"]');
  await page.waitForSelector("text=Nova Criatura", { timeout: 8000 });
}

async function addAction(page, name) {
  const sec = page.locator("#section-actions");
  await sec.scrollIntoViewIfNeeded();
  // Abrir o form de criação
  await sec.getByRole("button", { name: /Adicionar Ação/ }).click();
  await page.getByPlaceholder("Ex: Garra Lacerante").fill(name);
  // Botão "Adicionar" do form (submit)
  await page.getByRole("button", { name: /^Adicionar$/ }).last().click();
  await page.waitForTimeout(400);
}

(async () => {
  let browser;
  try {
    browser = await chromium.launch({ channel: "chrome" });
  } catch {
    browser = await chromium.launch();
  }

  for (const vp of widths) {
    const ctx = await browser.newContext({
      viewport: { width: vp.w, height: vp.h },
      deviceScaleFactor: 2,
    });
    const page = await ctx.newPage();
    await gotoBuilder(page);

    // 1) Header (topo da página)
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: `${OUT}/${TAG}_${vp.name}_header.png`, clip: { x: 0, y: 0, width: vp.w, height: 150 } });

    // 2) Índice no header — existe? (só pra log)
    const indiceVisible = await page.getByRole("button", { name: /Índice/ }).isVisible().catch(() => false);
    console.log(`${vp.name}: Índice visível no header = ${indiceVisible}`);

    // 3) Adicionar uma Ação e fotografar a seção (reproduz overflow)
    await addAction(page, "Garra Lacerante Devastadora do Abismo");
    const sec = page.locator("#section-actions");
    await sec.scrollIntoViewIfNeeded();
    await sec.screenshot({ path: `${OUT}/${TAG}_${vp.name}_actions.png` });

    // 4) overflow horizontal do documento?
    const overflow = await page.evaluate(() => ({
      docW: document.documentElement.scrollWidth,
      winW: window.innerWidth,
    }));
    console.log(`${vp.name}: scrollWidth=${overflow.docW} innerWidth=${overflow.winW} ${overflow.docW > overflow.winW ? "*** OVERFLOW ***" : "ok"}`);

    await ctx.close();
  }

  await browser.close();
  console.log("done:", TAG);
})();
