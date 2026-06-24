import { chromium } from "playwright";
import fs from "fs";
const OUT = new URL("./shots/", import.meta.url).pathname.replace(/^\//, "");
fs.mkdirSync(OUT, { recursive: true });
const URL_BASE = "http://localhost:5173";

const statVal = (page, label) => page.evaluate((lbl) => {
  const el = [...document.querySelectorAll("*")].find(
    (e) => e.children.length === 0 && new RegExp(`^${lbl}$`, "i").test((e.textContent || "").trim())
  );
  if (!el) return "?";
  const card = el.closest("[class*='rounded']");
  const num = card ? [...card.querySelectorAll("*")].map(x => x.textContent.trim()).find(t => /^[+-]?\d+$/.test(t)) : null;
  return num ?? "?";
}, label);

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
  await page.getByPlaceholder("Ex: Maldição da Varíola").fill("Cond Teste");
  await page.getByRole("button", { name: /Criar Ficha/ }).click();
  await page.waitForTimeout(800);

  await page.getByText("Cond Teste", { exact: false }).first().click();
  await page.waitForSelector("text=Condições Ativas", { timeout: 8000 });
  await page.waitForTimeout(300);

  const acertoAntes = await statVal(page, "Acerto");
  const defesaAntes = await statVal(page, "Defesa");
  console.log("ANTES — Acerto:", acertoAntes, "Defesa:", defesaAntes);

  // Adiciona condição "envenenado" (acerto −2, TRs −2, perícias −2)
  const condSelect = page.getByLabel("Condição").first().or(page.locator("section[aria-label] select").first());
  // Seleciona via o select da seção de Condições
  const sel = page.locator("div").filter({ hasText: /^Condições Ativas/ }).locator("select").first();
  await sel.selectOption("envenenado").catch(async () => {
    // fallback: primeiro select dentro do bloco de condições
    await page.locator("select").nth(0).selectOption("envenenado");
  });
  await page.waitForTimeout(200);
  await page.getByRole("button", { name: "Adicionar", exact: true }).first().click();
  await page.waitForTimeout(400);

  const acertoDepois = await statVal(page, "Acerto");
  const defesaDepois = await statVal(page, "Defesa");
  console.log("DEPOIS — Acerto:", acertoDepois, "Defesa:", defesaDepois);

  const efeitoVisivel = await page.evaluate(() => /Acerto\s*−?-?2|TRs?\s*−?-?2|Perícias\s*−?-?2/i.test(document.body.innerText));
  console.log("bloco de efeito da condição visível:", efeitoVisivel);

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `${OUT}/cond_tracker.png`, clip: { x: 0, y: 0, width: 1280, height: 900 } });
  await browser.close();
  const ok = acertoAntes !== "?" && parseInt(acertoDepois) === parseInt(acertoAntes) - 2;
  console.log(ok ? "PASS condição aplicada no tracker" : "CONFERIR");
})().catch((e) => { console.log("SCRIPT ERROR:", e.message); process.exit(1); });
