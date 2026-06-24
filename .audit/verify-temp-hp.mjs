// Regra nova (#3): cura NORMAL (botão +) capa no máximo; só efeito de
// habilidade (hp_temp) transborda (excedente verde). Dano come o excedente
// primeiro. Ativação agora pelo HUB "Habilidades Ativáveis". E2E no tracker.
import { chromium } from "playwright";
const URL_BASE = "http://localhost:5173";

const FEAT = {
  id: "feat-temp-1", name: "Escudo Temporário", category: "Geral",
  description: "Concede PV temporário (teste).",
  automation: { enabled: true, rules: [{
    id: "rt1", name: "Escudo", enabled: true,
    trigger: { type: "activated" }, activation: "once",
    cost: { pe: 0, acao: "" }, requires: "",
    effects: [{ id: "et1", type: "resource", resource: "hp_temp", op: "add", value: 20 }],
  }]},
};

const readHp = (page) => page.evaluate(() => {
  const cards = [...document.querySelectorAll("section[aria-label='Recursos vitais'] > div")];
  const hpCard = cards.find((d) => /PONTOS DE VIDA/i.test(d.textContent));
  if (!hpCard) return null;
  const big = hpCard.querySelector("span.text-3xl");
  const maxSpan = [...hpCard.querySelectorAll("span")].find((s) => /^\/\s*\d+/.test(s.textContent.trim()));
  const tempSpan = [...hpCard.querySelectorAll("span")].find((s) => s.title === "PV Temporário");
  return {
    hp: parseInt(big?.textContent || "0", 10),
    max: parseInt((maxSpan?.textContent || "").replace(/[^\d]/g, ""), 10),
    over: tempSpan ? parseInt(tempSpan.textContent.replace(/[^\d]/g, ""), 10) : 0,
    overflowBar: !!hpCard.querySelector("[class*='from-emerald-400']"),
  };
});

(async () => {
  let browser;
  try { browser = await chromium.launch({ channel: "chrome" }); }
  catch { browser = await chromium.launch(); }
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 1000 } })).newPage();
  page.on("pageerror", (e) => console.log("PAGEERROR:", e.message));

  await page.goto(URL_BASE, { waitUntil: "domcontentloaded" });
  await page.click('button[title="Criar nova criatura"]');
  await page.waitForSelector("text=Nova Criatura", { timeout: 8000 });
  await page.getByPlaceholder("Ex: Maldição da Varíola").fill("Temp HP Teste");
  await page.getByRole("button", { name: /Criar Ficha/ }).click();
  await page.waitForTimeout(700);
  await page.evaluate((f) => {
    const list = JSON.parse(localStorage.getItem("fm_creatures_v1") || "[]");
    const c = list.find((x) => x.name === "Temp HP Teste");
    c.features = [...(c.features || []), f];
    localStorage.setItem("fm_creatures_v1", JSON.stringify(list));
  }, FEAT);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByText("Temp HP Teste", { exact: false }).first().click();
  await page.waitForSelector("text=Modificadores", { timeout: 8000 });
  await page.waitForTimeout(400);

  const hpCard = page.locator("section[aria-label='Recursos vitais'] > div").filter({ hasText: /PONTOS DE VIDA/i }).first();
  const antes = await readHp(page);

  // (1) Cura NORMAL +120 a partir do máximo → CAPA (não passa).
  await hpCard.getByLabel("Valor para alterar Pontos de Vida").fill("120");
  await hpCard.getByLabel("Aumentar Pontos de Vida").click();
  await page.waitForTimeout(250);
  const aposCura = await readHp(page);

  // (2) Habilidade hp_temp (pelo HUB) → transborda (+20 verde).
  await page.getByRole("button", { name: /Usar: Escudo/ }).first().click().catch(() => {});
  await page.waitForTimeout(250);
  const aposEscudo = await readHp(page);

  // (3) Dano consome o excedente primeiro (30 > RD+Guarda, mas < excedente+absorção).
  await hpCard.getByLabel("Valor para alterar Pontos de Vida").fill("30");
  await hpCard.getByLabel("Reduzir Pontos de Vida").click();
  await page.waitForTimeout(250);
  const aposDano = await readHp(page);

  await browser.close();
  const checks = [
    ["começa cheio, sem excedente", antes.hp === antes.max && antes.over === 0],
    ["cura NORMAL +120 CAPA no máximo (não passa)", aposCura.hp === antes.max && aposCura.over === 0],
    ["habilidade hp_temp TRANSBORDA (+20 verde)", aposEscudo.hp === antes.max + 20 && aposEscudo.over === 20 && aposEscudo.overflowBar],
    ["dano consome o excedente primeiro", aposDano.over < aposEscudo.over && aposDano.hp >= antes.max],
  ];
  let ok = 0; for (const [n, p] of checks) { console.log(`${p ? "OK" : "XX"} ${n}`); if (p) ok++; }
  console.log(`\n${ok}/${checks.length} PASS`);
  process.exit(ok === checks.length ? 0 : 1);
})().catch((e) => { console.log("SCRIPT ERROR:", e.message); process.exit(1); });
