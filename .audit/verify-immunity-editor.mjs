// BUG: ao escolher "Imunidade a Condição" no editor, o select voltava pra
// "Modificar Stat". Reproduz no editor real (form de Ação → Automatizar).
import { chromium } from "playwright";
const URL_BASE = "http://localhost:5173";

(async () => {
  let browser;
  try { browser = await chromium.launch({ channel: "chrome" }); }
  catch { browser = await chromium.launch(); }
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 1100 } })).newPage();
  page.on("pageerror", (e) => console.log("PAGEERROR:", e.message));

  await page.goto(URL_BASE, { waitUntil: "domcontentloaded" });
  await page.click('button[title="Criar nova criatura"]');
  await page.waitForSelector("text=Nova Criatura", { timeout: 8000 });

  // Abre o form de uma nova Ação (tem o painel "Automatizar")
  const sec = page.locator("#section-actions");
  await sec.scrollIntoViewIfNeeded();
  await sec.getByRole("button", { name: /Adicionar Ação/ }).first().click();
  await page.getByPlaceholder("Ex: Garra Lacerante").fill("Teste Imune");
  await page.waitForTimeout(200);

  // Abre o editor de automação dentro do form
  await page.getByRole("button", { name: /Automatizar/ }).first().click();
  await page.waitForTimeout(200);
  await page.getByRole("button", { name: /Adicionar regra/ }).first().click();
  await page.waitForTimeout(200);
  await page.getByRole("button", { name: /Adicionar efeito/ }).first().click();
  await page.waitForTimeout(200);

  const typeSelect = page.locator('select[aria-label="Tipo de efeito"]').first();
  const antes = await typeSelect.inputValue();

  await typeSelect.selectOption("condition_immunity");
  await page.waitForTimeout(300);
  const depois = await typeSelect.inputValue();

  const temImuneUI = await page.evaluate(() => /Imune a:/i.test(document.body.innerText));

  // Adiciona uma condição → vira chip removível
  let chipOk = false;
  try {
    const addCond = page.locator('select[aria-label="Adicionar condição imune"]').first();
    const val = await addCond.locator("option").nth(1).getAttribute("value");
    if (val) {
      await addCond.selectOption(val);
      await page.waitForTimeout(200);
      chipOk = (await page.locator('[aria-label^="Remover"]').count()) > 0;
    }
  } catch { /* ignore */ }

  await browser.close();
  const checks = [
    ["efeito começa em Modificar Stat", antes === "modify_stat"],
    ["selecionar FICA em condition_immunity (não volta)", depois === "condition_immunity"],
    ["UI 'Imune a:' aparece", temImuneUI === true],
    ["adicionar condição vira chip removível", chipOk === true],
  ];
  let ok = 0; for (const [n, p] of checks) { console.log(`${p ? "OK" : "XX"} ${n}`); if (p) ok++; }
  console.log(`antes=${antes} depois=${depois}`);
  console.log(`\n${ok}/${checks.length} PASS`);
  process.exit(ok === checks.length ? 0 : 1);
})().catch((e) => { console.log("SCRIPT ERROR:", e.message); process.exit(1); });
