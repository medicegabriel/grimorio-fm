import { chromium } from "playwright";
import fs from "fs";

const OUT = new URL("./shots/", import.meta.url).pathname.replace(/^\//, "");
fs.mkdirSync(OUT, { recursive: true });
const URL_BASE = "http://localhost:5173";
const shot = (page, name) => page.screenshot({ path: `${OUT}/fix_${name}.png` });

(async () => {
  let browser;
  try { browser = await chromium.launch({ channel: "chrome" }); }
  catch { browser = await chromium.launch(); }
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 }, deviceScaleFactor: 1.25 });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => console.log("PAGEERROR:", e.message));
  page.on("console", (m) => { if (m.type() === "error") console.log("CONSOLE.ERR:", m.text()); });

  await page.goto(URL_BASE, { waitUntil: "networkidle" });
  await page.click('button[title="Criar nova criatura"]');
  await page.waitForSelector("text=Nova Criatura", { timeout: 8000 });
  await page.getByPlaceholder("Ex: Maldição da Varíola").fill("Bruxo Teste");

  // Programar uma ação com efeito de CONDIÇÃO
  const sec = page.locator("#section-actions");
  await sec.scrollIntoViewIfNeeded();
  await sec.getByRole("button", { name: /Adicionar Ação/ }).first().click();
  await page.getByPlaceholder("Ex: Garra Lacerante").fill("Olhar Petrificante");
  await sec.getByRole("button", { name: /^Automatizar/ }).click();
  await page.waitForTimeout(150);
  await sec.getByRole("button", { name: /Adicionar regra/ }).click();
  await page.waitForTimeout(150);
  await sec.getByLabel("Gatilho").selectOption("activated");
  await page.waitForTimeout(150);

  // ----- #1: trocar tipo de efeito para "condition" -----
  const tipo = sec.getByLabel("Tipo de efeito").first();
  await tipo.selectOption("condition");
  await page.waitForTimeout(200);

  // O select de Condição deve aparecer (antes do fix sumia, voltando p/ modify_stat)
  const condSel = sec.getByLabel("Condição").first();
  const condVisible = await condSel.isVisible().catch(() => false);
  console.log("ASSERT #1 — seletor de Condição visível:", condVisible);

  // O select de tipo deve PERMANECER em "condition" (antes voltava p/ modify_stat)
  const tipoVal = await tipo.inputValue();
  console.log("ASSERT #1 — tipo permanece 'condition':", tipoVal === "condition", `(=${tipoVal})`);

  // Escolher uma condição ESPECÍFICA (a 4ª opção, p/ garantir != default abalado)
  const opts = await condSel.locator("option").allTextContents();
  const chosenLabel = opts[3] ?? opts[1] ?? opts[0];
  await condSel.selectOption({ label: chosenLabel });
  await page.waitForTimeout(150);
  const chosenVal = await condSel.inputValue();
  console.log("ASSERT #1 — condição escolhida:", chosenLabel, `(val=${chosenVal})`);

  await shot(page, "01_builder_condicao");

  // Salvar ação + ficha
  await sec.getByRole("button", { name: "Adicionar", exact: true }).click();
  await page.waitForTimeout(300);
  await page.getByRole("button", { name: /Criar Ficha/ }).click();
  await page.waitForTimeout(800);

  // ----- Tracker: usar a ação e conferir a condição aplicada -----
  await page.getByText("Bruxo Teste", { exact: false }).first().click();
  await page.waitForSelector("text=Modificadores", { timeout: 8000 });
  await page.waitForTimeout(400);

  // #5: inspetor de Automações Programadas deve existir
  const inspector = page.getByRole("button", { name: /Automações Programadas/ });
  console.log("ASSERT #5 — inspetor presente:", await inspector.isVisible().catch(() => false));
  await inspector.click().catch(() => {});
  await page.waitForTimeout(200);
  await shot(page, "02_inspector");

  // Acionar a regra (condição-only → botão "Usar:")
  const usar = page.getByRole("button", { name: /Usar:|Ativar:/ }).first();
  await usar.scrollIntoViewIfNeeded().catch(() => {});
  console.log("botão usar/ativar visível:", await usar.isVisible().catch(() => false));
  await usar.click();
  await page.waitForTimeout(400);

  // #3: a condição aplicada deve ser a ESCOLHIDA, não "Abalado"
  const bodyTxt = await page.innerText("body");
  const appliedChosen = bodyTxt.toLowerCase().includes(chosenLabel.toLowerCase());
  const appliedAbalado = /abalado/i.test(bodyTxt) && chosenLabel.toLowerCase() !== "abalado";
  console.log("ASSERT #3 — condição escolhida aplicada:", appliedChosen);
  console.log("ASSERT #3 — NÃO aplicou 'Abalado' por engano:", !appliedAbalado);
  await shot(page, "03_tracker_condicao");

  await browser.close();
  console.log("DONE");
})().catch((e) => { console.log("SCRIPT ERROR:", e.message); process.exit(1); });
