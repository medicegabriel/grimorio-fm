import { chromium } from "playwright";
import fs from "fs";

const OUT = new URL("./shots/", import.meta.url).pathname.replace(/^\//, "");
fs.mkdirSync(OUT, { recursive: true });
const URL_BASE = "http://localhost:5173";
const shot = (page, name) => page.screenshot({ path: `${OUT}/auto_${name}.png` });

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
  console.log("builder aberto");

  // Ir até a seção Características
  const sec = page.locator("#section-caracteristicas");
  await sec.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);

  // Criar uma característica personalizada
  await sec.getByRole("button", { name: /Adicionar Característica/ }).first().click();
  await page.getByPlaceholder("Nome").first().fill("Postura de Combate");
  await sec.getByRole("button", { name: /^Adicionar$/ }).last().click();
  await page.waitForTimeout(400);
  console.log("feature criada");

  // Expandir a feature criada e abrir Automatizar
  await sec.getByRole("button", { name: /Postura de Combate/ }).click();
  await page.waitForTimeout(200);
  await sec.getByRole("button", { name: /Automatizar/ }).click();
  await page.waitForTimeout(200);

  // Adicionar uma regra (vem com 1 efeito)
  await sec.getByRole("button", { name: /Adicionar regra/ }).click();
  await page.waitForTimeout(300);
  await sec.scrollIntoViewIfNeeded();
  await shot(page, "01_editor_regra");
  console.log("regra adicionada -> shot 01");

  // Trocar valor do efeito para expressão DSL
  await sec.getByTitle("Usar expressão (DSL)").first().click();
  await page.waitForTimeout(150);
  await sec.getByPlaceholder("ex.: metade(nd)").first().fill("metade(nd) + bt");
  // Pré-requisito
  await sec.getByPlaceholder(/dom >= 3/).first().fill("dom >= 3 e pe_atual >= 5");
  await page.waitForTimeout(200);
  await shot(page, "02_editor_dsl");
  console.log("DSL preenchida -> shot 02");

  // Testar validação: expressão inválida
  await sec.getByPlaceholder("ex.: metade(nd)").first().fill("metade(xpto");
  await page.waitForTimeout(200);
  await shot(page, "03_editor_validacao");
  console.log("validacao -> shot 03");
  // voltar pra expressão válida
  await sec.getByPlaceholder("ex.: metade(nd)").first().fill("metade(nd) + bt");

  // Abrir modal de documentação da DSL
  await sec.getByRole("button", { name: /^DSL$/ }).click();
  await page.waitForTimeout(300);
  await shot(page, "04_docs_modal");
  console.log("docs modal -> shot 04");

  await browser.close();
  console.log("DONE");
})().catch((e) => { console.log("SCRIPT ERROR:", e.message); process.exit(1); });
