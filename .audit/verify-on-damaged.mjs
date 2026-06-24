// D4 — gatilho on_damaged (reações ao sofrer dano). Absorção Elemental:
// reação que dá PV temp = metade(dano). Painel de Reações + aplicação. E2E.
import { chromium } from "playwright";
const URL_BASE = "http://localhost:5173";

const APT = { id: "apt-abs-1", key: "absorcao_elemental", nome: "Absorção Elemental",
  categoria: "Aptidões de Anatomia", tipo: "official" };

const readHpBig = (page) => page.evaluate(() => {
  const cards = [...document.querySelectorAll("section[aria-label='Recursos vitais'] > div")];
  const hpCard = cards.find((d) => /PONTOS DE VIDA/i.test(d.textContent));
  return parseInt(hpCard?.querySelector("span.text-3xl")?.textContent || "0", 10);
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
  await page.getByPlaceholder("Ex: Maldição da Varíola").fill("D4 Teste");
  await page.getByRole("button", { name: /Criar Ficha/ }).click();
  await page.waitForTimeout(700);

  const inj = await page.evaluate((a) => {
    const list = JSON.parse(localStorage.getItem("fm_creatures_v1") || "[]");
    const c = list.find((x) => x.name === "D4 Teste");
    if (!c) return "no-creature";
    c.aptidoesEspeciais = [...(c.aptidoesEspeciais || []), a];
    localStorage.setItem("fm_creatures_v1", JSON.stringify(list));
    return "ok";
  }, APT);
  console.log("injeção:", inj);

  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByText("D4 Teste", { exact: false }).first().click();
  await page.waitForSelector("text=Modificadores", { timeout: 8000 });
  await page.waitForTimeout(400);

  // Painel de Reações NÃO aparece sem dano.
  const painelAntes = await page.evaluate(() => /Reações ao sofrer dano/i.test(document.body.innerText));

  // Causa 30 de dano.
  const hpCard = page.locator("section[aria-label='Recursos vitais'] > div").filter({ hasText: /PONTOS DE VIDA/i }).first();
  await hpCard.getByLabel("Valor para alterar Pontos de Vida").fill("30");
  await hpCard.getByLabel("Reduzir Pontos de Vida").click();
  await page.waitForTimeout(300);

  const painelDepois = await page.evaluate(() => /Reações ao sofrer dano/i.test(document.body.innerText));
  const ultimoDano = await page.evaluate(() => {
    const m = document.body.innerText.match(/Último dano:\s*(\d+)/i);
    return m ? parseInt(m[1], 10) : null;
  });
  const hpAntesReagir = await readHpBig(page);

  // Clica "Reagir: Absorver Elemento".
  const btn = page.getByRole("button", { name: /Reagir: Absorver Elemento/ }).first();
  const btnVisivel = await btn.isVisible().catch(() => false);
  await btn.click().catch(() => {});
  await page.waitForTimeout(300);
  const hpDepoisReagir = await readHpBig(page);

  await browser.close();
  const ganho = hpDepoisReagir - hpAntesReagir;
  const esperado = Math.floor((ultimoDano ?? 0) / 2);
  const checks = [
    ["painel não aparece sem dano", painelAntes === false],
    ["painel aparece após o dano", painelDepois === true],
    ["mostra 'Último dano'", ultimoDano != null && ultimoDano > 0],
    ["botão Reagir presente", btnVisivel === true],
    ["reagir dá PV temp = metade(dano)", ganho === esperado && ganho > 0],
  ];
  console.log(`ultimoDano=${ultimoDano} hpAntes=${hpAntesReagir} hpDepois=${hpDepoisReagir} ganho=${ganho} esperado=${esperado}`);
  let ok = 0; for (const [n, p] of checks) { console.log(`${p ? "OK" : "XX"} ${n}`); if (p) ok++; }
  console.log(`\n${ok}/${checks.length} PASS`);
  process.exit(ok === checks.length ? 0 : 1);
})().catch((e) => { console.log("SCRIPT ERROR:", e.message); process.exit(1); });
