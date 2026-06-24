import { chromium } from "playwright";
import fs from "fs";

const OUT = new URL("./shots/", import.meta.url).pathname.replace(/^\//, "");
fs.mkdirSync(OUT, { recursive: true });
const URL_BASE = "http://localhost:5176";

const INJECTED = {
  id: "cat-test-1",
  tipo: "custom",
  nome: "Postura Férrea",
  categoria: "Geral",
  descricao: "Programada via catálogo (teste).",
  automation: {
    enabled: true,
    rules: [{
      id: "r1", name: "Postura Férrea", enabled: true,
      trigger: { type: "activated" }, activation: "toggle",
      cost: { pe: 0, acao: "" }, requires: "",
      effects: [{ id: "e1", type: "modify_stat", stat: "defesa", op: "add", value: 5, stack: "sum", valueExpr: "", duration: { kind: "rounds", rounds: 3 } }],
    }],
  },
};

(async () => {
  let browser;
  try { browser = await chromium.launch({ channel: "chrome" }); }
  catch { browser = await chromium.launch(); }
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 }, deviceScaleFactor: 1.5 });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => console.log("PAGEERROR:", e.message));
  page.on("console", (m) => { if (m.type() === "error") console.log("CONSOLE.ERR:", m.text()); });

  // Cria e salva uma criatura
  await page.goto(URL_BASE, { waitUntil: "domcontentloaded" });
  await page.click('button[title="Criar nova criatura"]');
  await page.waitForSelector("text=Nova Criatura", { timeout: 8000 });
  await page.getByPlaceholder("Ex: Maldição da Varíola").fill("Cat Teste");
  await page.getByRole("button", { name: /Criar Ficha/ }).click();
  await page.waitForTimeout(800);

  // Injeta uma característica de catálogo COM automação direto no storage
  const ok = await page.evaluate((inj) => {
    const raw = localStorage.getItem("fm_creatures_v1");
    const list = JSON.parse(raw || "[]");
    const c = list.find((x) => x.name === "Cat Teste");
    if (!c) return "criatura nao encontrada";
    c.caracteristicas = [...(c.caracteristicas || []), inj];
    localStorage.setItem("fm_creatures_v1", JSON.stringify(list));
    return "ok:" + (c.caracteristicas.length);
  }, INJECTED);
  console.log("injecao:", ok);

  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByText("Cat Teste", { exact: false }).first().click();
  await page.waitForSelector("text=Modificadores", { timeout: 8000 });
  await page.waitForTimeout(400);

  const defText = () => page.evaluate(() => {
    const lbl = [...document.querySelectorAll("*")].find(
      (e) => e.children.length === 0 && /^Defesa$/i.test((e.textContent || "").trim())
    );
    return lbl ? (lbl.closest("[class*='rounded']")?.textContent || "").replace(/\s+/g, " ").trim().slice(0, 24) : "?";
  });

  console.log("Defesa antes:", await defText());
  // A seção "Características" (catálogo) inicia recolhida — expande primeiro.
  const header = page.getByRole("button", { name: /^Características \(\d+\)/ }).first();
  if (await header.isVisible().catch(() => false)) { await header.click(); await page.waitForTimeout(300); }
  const ativar = page.getByRole("button", { name: /Ativar: Postura/ }).first();
  console.log("Ativar (catálogo) visivel:", await ativar.isVisible().catch(() => false));
  await ativar.scrollIntoViewIfNeeded();
  const ab = await ativar.boundingBox();
  await page.screenshot({ path: `${OUT}/cat_01_botao.png`, clip: { x: 0, y: Math.max(0, ab.y - 60), width: 1280, height: 180 } });
  await ativar.click();
  await page.waitForTimeout(400);
  console.log("Defesa depois:", await defText());
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `${OUT}/cat_02_topo_depois.png`, clip: { x: 0, y: 0, width: 1280, height: 820 } });

  await browser.close();
  console.log("DONE");
})().catch((e) => { console.log("SCRIPT ERROR:", e.message); process.exit(1); });
