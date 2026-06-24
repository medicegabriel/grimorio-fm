// Habilidades ABERTAS (userAutomatable): Aura/Marca/Rastro/Transf. Especial
// liberam automação + nota do usuário na INSTÂNCIA. Oficiais comuns continuam
// não-editáveis (instance.automation ignorada). Logic + E2E.
import { chromium } from "playwright";
const URL_BASE = "http://localhost:5173";

const mkRule = (name, val) => ({ enabled: true, rules: [{
  id: `ur_${name}`, name, enabled: true, trigger: { type: "activated" }, activation: "toggle",
  cost: { pe: 0, acao: "" }, requires: "",
  effects: [{ id: `ue_${name}`, type: "modify_stat", stat: "defesa", op: "add", value: val, stack: "highest", duration: { kind: "manual" } }],
}] });

const AURA = { id: "car-aura", tipo: "oficial", key: "aura", nome: "Aura", categoria: "Características Gerais",
  descricao: "A criatura tem auras que podem aplicar desvantagem em jogadores.",
  notaPersonalizada: "Minha aura impoe Lento nos inimigos.", automation: mkRule("Aura Ativa", 5) };
const DEMO = { id: "car-demo", tipo: "oficial", key: "demolicao", nome: "Demolição", categoria: "Características Gerais",
  descricao: "Danos a estruturas...", automation: mkRule("Nao Deveria", 99) };

(async () => {
  let browser;
  try { browser = await chromium.launch({ channel: "chrome" }); }
  catch { browser = await chromium.launch(); }
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 1000 } })).newPage();
  page.on("pageerror", (e) => console.log("PAGEERROR:", e.message));
  await page.goto(URL_BASE, { waitUntil: "networkidle" });

  // --- Checks de catálogo (lógica pura) ---
  const cat = await page.evaluate(async () => {
    const CA = await import("/src/components/fm-caracteristicas.js");
    const { getCaracteristicaByKey, resolveCaracteristicaDescription, isUserAutomatableCaracteristica } = CA;
    const flagged = ["aura", "marca", "rastro_amaldicoado", "transformacao_especial"].every((k) => isUserAutomatableCaracteristica(getCaracteristicaByKey(k)));
    const notFlagged = !isUserAutomatableCaracteristica(getCaracteristicaByKey("demolicao"));
    const desc = resolveCaracteristicaDescription(getCaracteristicaByKey("aura"), { core: { nd: 10 }, notaPersonalizada: "NOTA-X" });
    return { flagged, notFlagged, notaNaDescricao: desc.includes("NOTA-X") };
  });

  // --- E2E no tracker ---
  await page.click('button[title="Criar nova criatura"]');
  await page.waitForSelector("text=Nova Criatura", { timeout: 8000 });
  await page.getByPlaceholder("Ex: Maldição da Varíola").fill("Aberta Teste");
  await page.getByRole("button", { name: /Criar Ficha/ }).click();
  await page.waitForTimeout(700);
  const inj = await page.evaluate(({ a, d }) => {
    const list = JSON.parse(localStorage.getItem("fm_creatures_v1") || "[]");
    const c = list.find((x) => x.name === "Aberta Teste");
    if (!c) return "no-creature";
    c.caracteristicas = [...(c.caracteristicas || []), a, d];
    localStorage.setItem("fm_creatures_v1", JSON.stringify(list));
    return "ok";
  }, { a: AURA, d: DEMO });

  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByText("Aberta Teste", { exact: false }).first().click();
  await page.waitForSelector("text=Modificadores", { timeout: 8000 });
  await page.waitForTimeout(300);
  // Expande a seção Características.
  await page.getByRole("button", { name: /Características \(\d+\)/ }).first().click().catch(() => {});
  await page.waitForTimeout(300);

  const auraBtn = await page.getByRole("button", { name: /Ativar: Aura Ativa/ }).isVisible().catch(() => false);
  const demoBtn = await page.getByRole("button", { name: /Ativar: Nao Deveria/ }).isVisible().catch(() => false);
  // Expande o card da Aura (a descrição/nota só renderiza expandida).
  await page.locator("button[aria-expanded]").filter({ hasText: "Aura" }).first().click().catch(() => {});
  await page.waitForTimeout(200);
  const notaVisivel = await page.evaluate(() => /impoe Lento/i.test(document.body.innerText));

  // Ativa a Aura → Defesa sobe.
  const defAntes = await page.evaluate(() => {
    const el = [...document.querySelectorAll("*")].find((n) => /DEFESA/i.test(n.textContent) && n.querySelector?.(".text-2xl"));
    return null; // lido abaixo via card
  });
  await page.getByRole("button", { name: /Ativar: Aura Ativa/ }).first().click().catch(() => {});
  await page.waitForTimeout(300);
  const ativou = await page.evaluate(() => /Desativar: Aura Ativa/i.test(document.body.innerText));

  await browser.close();
  const checks = [
    ["4 abertas têm userAutomatable", cat.flagged === true],
    ["Demolição NÃO é aberta", cat.notFlagged === true],
    ["nota entra na descrição", cat.notaNaDescricao === true],
    ["Aura (aberta): botão Ativar aparece", auraBtn === true],
    ["Demolição (não-aberta): SEM botão (base intacta)", demoBtn === false],
    ["nota do usuário visível no tracker", notaVisivel === true],
    ["ativar a Aura funciona (vira Desativar)", ativou === true],
  ];
  let ok = 0; for (const [n, p] of checks) { console.log(`${p ? "OK" : "XX"} ${n}`); if (p) ok++; }
  console.log(`\n${ok}/${checks.length} PASS`);
  process.exit(ok === checks.length ? 0 : 1);
})().catch((e) => { console.log("SCRIPT ERROR:", e.message); process.exit(1); });
