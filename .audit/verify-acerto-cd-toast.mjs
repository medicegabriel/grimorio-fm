// #1: buff de Acerto reflete no Acerto da AÇÃO (badge + valor). #2: toast de
// feedback ao ativar. E2E no tracker.
import { chromium } from "playwright";
const URL_BASE = "http://localhost:5173";

const FEAT = {
  id: "feat-foco", name: "Foco", category: "Geral", description: "+5 Acerto (teste).",
  automation: { enabled: true, rules: [{
    id: "rf", name: "Foco", enabled: true,
    trigger: { type: "activated" }, activation: "toggle", cost: { pe: 0, acao: "" }, requires: "",
    effects: [{ id: "ef", type: "modify_stat", stat: "acerto", op: "add", value: 5, stack: "highest", duration: { kind: "manual" } }],
  }]},
};

(async () => {
  let browser;
  try { browser = await chromium.launch({ channel: "chrome" }); }
  catch { browser = await chromium.launch(); }
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 1000 } })).newPage();
  page.on("pageerror", (e) => console.log("PAGEERROR:", e.message));

  await page.goto(URL_BASE, { waitUntil: "domcontentloaded" });
  await page.click('button[title="Criar nova criatura"]');
  await page.waitForSelector("text=Nova Criatura", { timeout: 8000 });
  await page.getByPlaceholder("Ex: Maldição da Varíola").fill("Acerto Teste");
  // Adiciona uma ação de Acerto.
  const sec = page.locator("#section-actions");
  await sec.scrollIntoViewIfNeeded();
  await sec.getByRole("button", { name: /Adicionar Ação/ }).first().click();
  await page.getByPlaceholder("Ex: Garra Lacerante").fill("Golpe");
  await page.waitForTimeout(200);
  await sec.getByRole("button", { name: "Adicionar", exact: true }).click();
  await page.waitForTimeout(300);
  await page.getByRole("button", { name: /Criar Ficha/ }).click();
  await page.waitForTimeout(700);

  await page.evaluate((f) => {
    const list = JSON.parse(localStorage.getItem("fm_creatures_v1") || "[]");
    const c = list.find((x) => x.name === "Acerto Teste");
    c.features = [...(c.features || []), f];
    localStorage.setItem("fm_creatures_v1", JSON.stringify(list));
  }, FEAT);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByText("Acerto Teste", { exact: false }).first().click();
  await page.waitForSelector("text=Modificadores", { timeout: 8000 });
  await page.waitForTimeout(400);

  const badgeAntes = await page.evaluate(() => /Acerto \+\d/.test(document.body.innerText));

  // Ativa o Foco pelo HUB.
  await page.getByRole("button", { name: /Ativar: Foco/ }).first().click();
  await page.waitForTimeout(250);

  const toast = await page.evaluate(() => {
    const el = document.querySelector("[role='status']");
    return el ? el.textContent.trim() : null;
  });
  const badgeDepois = await page.evaluate(() => {
    const m = document.body.innerText.match(/Acerto \+(\d+)/);
    return m ? parseInt(m[1], 10) : null;
  });

  await browser.close();
  const checks = [
    ["sem badge de Acerto antes do buff", badgeAntes === false],
    ["após ativar: badge 'Acerto +5' na ação", badgeDepois === 5],
    ["toast de feedback apareceu", !!toast && /Foco/i.test(toast)],
  ];
  let ok = 0; for (const [n, p] of checks) { console.log(`${p ? "OK" : "XX"} ${n}`); if (p) ok++; }
  console.log(`toast="${toast}" badge=${badgeDepois}`);
  console.log(`\n${ok}/${checks.length} PASS`);
  process.exit(ok === checks.length ? 0 : 1);
})().catch((e) => { console.log("SCRIPT ERROR:", e.message); process.exit(1); });
