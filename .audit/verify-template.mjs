import { chromium } from "playwright";
import fs from "fs";

const OUT = new URL("./shots/", import.meta.url).pathname.replace(/^\//, "");
fs.mkdirSync(OUT, { recursive: true });
const URL_BASE = "http://localhost:5175";
const clip = (page, name, c) => page.screenshot({ path: `${OUT}/tpl_${name}.png`, clip: c });

const addProgrammedAction = async (page, name) => {
  const sec = page.locator("#section-actions");
  await sec.scrollIntoViewIfNeeded();
  await sec.getByRole("button", { name: /Adicionar Ação/ }).first().click();
  await page.getByPlaceholder("Ex: Garra Lacerante").fill(name);
  await sec.getByRole("button", { name: /^Automatizar/ }).click();
  await page.waitForTimeout(150);
  await sec.getByRole("button", { name: /Adicionar regra/ }).click();
  await page.waitForTimeout(150);
  await sec.getByLabel("Gatilho").selectOption("activated");
  await sec.getByLabel("Custo em PE").fill("20");
  await sec.getByLabel("Valor").first().fill("5");
  await page.waitForTimeout(150);
  await sec.getByRole("button", { name: "Adicionar", exact: true }).click();
  await page.waitForTimeout(300);
};

(async () => {
  let browser;
  try { browser = await chromium.launch({ channel: "chrome" }); }
  catch { browser = await chromium.launch(); }
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 }, deviceScaleFactor: 1.4 });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => console.log("PAGEERROR:", e.message));
  page.on("console", (m) => { if (m.type() === "error") console.log("CONSOLE.ERR:", m.text()); });

  // --- Criatura 1: programa a ação e salva como modelo ---
  await page.goto(URL_BASE, { waitUntil: "networkidle" });
  await page.click('button[title="Criar nova criatura"]');
  await page.waitForSelector("text=Nova Criatura", { timeout: 8000 });
  await page.getByPlaceholder("Ex: Maldição da Varíola").fill("Criatura Origem");
  await addProgrammedAction(page, "Expansão Programada");

  const sec = page.locator("#section-actions");
  await sec.getByTitle("Salvar como modelo").first().click();
  await page.waitForTimeout(400);
  console.log("acao programada salva como modelo");

  // Volta ao dashboard (descarta criatura 1)
  await page.getByRole("button", { name: /Voltar/ }).first().click();
  await page.waitForTimeout(500);
  // pode aparecer confirmacao de sair sem salvar
  const sairBtn = page.getByRole("button", { name: /Sair sem salvar|Descartar|Sair/ }).first();
  if (await sairBtn.isVisible().catch(() => false)) { await sairBtn.click(); await page.waitForTimeout(400); }

  // --- Criatura 2: aplica o modelo ---
  await page.click('button[title="Criar nova criatura"]');
  await page.waitForSelector("text=Nova Criatura", { timeout: 8000 });
  await page.getByPlaceholder("Ex: Maldição da Varíola").fill("Criatura Destino");
  const sec2 = page.locator("#section-actions");
  await sec2.scrollIntoViewIfNeeded();
  await sec2.getByRole("button", { name: /Adicionar Ação/ }).first().click();
  await page.waitForTimeout(200);
  // Abrir painel de Modelos
  await sec2.getByRole("button", { name: /Modelos \(/ }).click();
  await page.waitForTimeout(200);
  // Clicar no modelo salvo
  await sec2.getByText("Expansão Programada", { exact: false }).first().click();
  await page.waitForTimeout(400);

  // Verificar: o form deve mostrar "Automatizar (1)"
  const autoBtn = sec2.getByRole("button", { name: /Automatizar \(1\)/ });
  const ok = await autoBtn.isVisible().catch(() => false);
  console.log("Automatizar (1) visivel apos aplicar modelo:", ok);
  const box = await sec2.boundingBox();
  await clip(page, "01_apply", { x: box.x, y: Math.max(0, box.y), width: box.width, height: Math.min(820, box.height) });

  await browser.close();
  console.log("DONE");
})().catch((e) => { console.log("SCRIPT ERROR:", e.message); process.exit(1); });
