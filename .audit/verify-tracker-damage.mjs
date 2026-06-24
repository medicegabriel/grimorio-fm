import { chromium } from "playwright";
import fs from "fs";
const OUT = new URL("./shots/", import.meta.url).pathname.replace(/^\//, "");
fs.mkdirSync(OUT, { recursive: true });
const URL_BASE = "http://localhost:5173";

const FEAT = {
  id: "feat-dmg-1", name: "Amplificação Corporal", category: "Geral",
  description: "Boost de dano (teste).",
  automation: { enabled: true, rules: [{
    id: "rd1", name: "Amplificar Corporal", enabled: true,
    trigger: { type: "activated" }, activation: "toggle",
    cost: { pe: 0, acao: "" }, requires: "",
    effects: [{ id: "ed1", type: "action_damage", scope: "corporal", amount: 2, fixed: 5, duration: { kind: "rounds", rounds: 3 } }],
  }]},
};

const rollOf = (page, actionName) => page.evaluate((nm) => {
  const card = [...document.querySelectorAll("div")].find((d) =>
    /font-mono/.test([...d.querySelectorAll("span")].map(s=>s.className).join(" ")) &&
    d.textContent.includes("d") && d.closest("section")?.getAttribute("aria-label") === "Ações disponíveis"
  );
  // mais simples: pega o span font-mono dentro da seção de Ações
  const sec = [...document.querySelectorAll("section")].find(s => s.getAttribute("aria-label") === "Ações disponíveis");
  if (!sec) return "no-section";
  const mono = [...sec.querySelectorAll("span.font-mono")].map(s => s.textContent.trim()).filter(t => /\dd\d/.test(t));
  return mono.join(" | ") || "no-roll";
}, actionName);

(async () => {
  let browser;
  try { browser = await chromium.launch({ channel: "chrome" }); }
  catch { browser = await chromium.launch(); }
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 1000 }, deviceScaleFactor: 1.25 })).newPage();
  page.on("pageerror", (e) => console.log("PAGEERROR:", e.message));
  page.on("console", (m) => { if (m.type() === "error") console.log("CONSOLE.ERR:", m.text()); });

  await page.goto(URL_BASE, { waitUntil: "domcontentloaded" });
  await page.click('button[title="Criar nova criatura"]');
  await page.waitForSelector("text=Nova Criatura", { timeout: 8000 });
  await page.getByPlaceholder("Ex: Maldição da Varíola").fill("Dmg Teste");

  // Adiciona uma ação de Acerto (corporal-elegível)
  const sec = page.locator("#section-actions");
  await sec.scrollIntoViewIfNeeded();
  await sec.getByRole("button", { name: /Adicionar Ação/ }).first().click();
  await page.getByPlaceholder("Ex: Garra Lacerante").fill("Soco");
  await page.waitForTimeout(200);
  await sec.getByRole("button", { name: "Adicionar", exact: true }).click();
  await page.waitForTimeout(300);
  await page.getByRole("button", { name: /Criar Ficha/ }).click();
  await page.waitForTimeout(800);

  // Injeta a Característica com o boost
  const inj = await page.evaluate((f) => {
    const list = JSON.parse(localStorage.getItem("fm_creatures_v1") || "[]");
    const c = list.find((x) => x.name === "Dmg Teste");
    if (!c) return "no-creature";
    c.features = [...(c.features || []), f];
    localStorage.setItem("fm_creatures_v1", JSON.stringify(list));
    return "ok features=" + c.features.length + " actions=" + ((c.actions?.list || c.actions || []).length);
  }, FEAT);
  console.log("injeção:", inj);

  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByText("Dmg Teste", { exact: false }).first().click();
  await page.waitForSelector("text=Modificadores", { timeout: 8000 });
  await page.waitForTimeout(400);

  // Expande a ação Soco
  const expandSoco = async () => {
    const btn = page.getByRole("button").filter({ hasText: /Soco/ }).first();
    if ((await btn.getAttribute("aria-expanded")) === "false") { await btn.click(); await page.waitForTimeout(200); }
  };
  await expandSoco();
  const danoAntes = await rollOf(page, "Soco");
  console.log("dano ANTES:", danoAntes);

  // Ativa o boost (Característica Personalizada)
  const ativar = page.getByRole("button", { name: /Ativar: Amplificar Corporal/ }).first();
  await ativar.scrollIntoViewIfNeeded().catch(() => {});
  console.log("botão Ativar visível:", await ativar.isVisible().catch(() => false));
  await ativar.click();
  await page.waitForTimeout(400);

  // Reexpande a ação (caso tenha recolhido) e lê o dano
  await expandSoco();
  const danoDepois = await rollOf(page, "Soco");
  console.log("dano DEPOIS:", danoDepois);
  const amplificado = await page.evaluate(() => /amplificado/i.test(document.body.innerText));
  console.log("badge 'amplificado' presente:", amplificado);

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `${OUT}/dmg_tracker.png`, clip: { x: 0, y: 0, width: 1280, height: 900 } });
  await browser.close();
  const ok = danoAntes !== danoDepois && danoAntes !== "no-roll" && amplificado;
  console.log(ok ? "PASS tracker boost" : "CONFERIR (ver dano antes/depois)");
})().catch((e) => { console.log("SCRIPT ERROR:", e.message); process.exit(1); });
