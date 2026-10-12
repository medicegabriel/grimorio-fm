import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
const out = ".audit/resiliente-shots";
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: "chrome" });
const report = [];
let page;
async function click(loc) {
  await loc.scrollIntoViewIfNeeded();
  await loc.click();
}
async function abrirEditor(p) {
  await click(p.getByText("Teste Encantamentos", { exact: true }).first());
  await click(p.locator('button[title="Editar no criador"]'));
  await equipamentos(p);
}
async function equipamentos(p) {
  await click(p.getByRole("tab", { name: "Equipamentos", exact: true }));
  const ferramentas = p.locator('button[title="Editar Ferramenta Amaldiçoada"]');
  await ferramentas.first().waitFor();
  for (const b of await ferramentas.all()) if (await b.getAttribute("aria-expanded") !== "true") await click(b);
}
async function resistencias(p) {
  await click(p.getByRole("tab", { name: "Outros", exact: true }));
  await click(p.getByRole("menuitem", { name: "Resistências", exact: true }));
}
async function abrirEncantamentos(p, n) {
  const headers = p.getByRole("button", { name: /^Encantamentos \d+\// });
  if (await headers.nth(n).getAttribute("aria-expanded") !== "true") await click(headers.nth(n));
}
async function total(p, nome) {
  const row = p.getByLabel("RD contra " + nome).locator("..");
  return Number(await row.locator(":scope > div").last().locator(":scope > span").first().innerText());
}
try {
  for (const route of ["Player", "Afty"]) for (const width of [1440, 390]) {
    const ctx = await browser.newContext({ viewport: { width, height: 1000 }, isMobile: width === 390, hasTouch: width === 390 });
    page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", e => { errors.push(e.message); console.log("PAGE ERROR", e.message); });
    await page.goto("http://localhost:5173/" + route, { waitUntil: "networkidle" });
    await page.evaluate(async (sistema) => {
      const { createBlankAfty } = await import("/src/systems/afty/afty-schema.js");
      const f = createBlankAfty();
      f.id = "teste-encantamentos"; f.name = "Teste Encantamentos"; f.rulesVersion = sistema;
      f.core = { ...f.core, nd: 10, tipo: "misto", patamar: "comum" };
      f.especializacoes = [{ id: "combatente", nivel: 10 }];
      f.attributes = { forca: 30, destreza: 12, constituicao: 12, inteligencia: 12, sabedoria: 12, presenca: 12 };
      f.equipamentos = { itens: [
        { uid: "uniforme", refId: "unif_revestimento_robusto", tipo: "uniforme", qtd: 1, equipado: true,
          fa: { grau: "quarto", encantamentos: ["enc_unif_resiliente"] } },
        { uid: "escudo", refId: "esc_pesado", tipo: "escudo", qtd: 1, equipado: true,
          fa: { grau: "especial", encantamentos: ["enc_esc_reforcado"] } },
      ] };
      localStorage.setItem("fm_creatures_" + sistema + "_v1", JSON.stringify([f]));
    }, route.toLowerCase());
    await page.reload({ waitUntil: "networkidle" });
    await abrirEditor(page);
    await abrirEncantamentos(page, 0);
    const escolha = page.getByLabel("Tipo de dano de Resiliente", { exact: true });
    assert.equal(await escolha.inputValue(), "");
    const allowed = await escolha.locator("option").evaluateAll(es => es.map(e => e.value).filter(Boolean));
    assert.equal(allowed.length, 10);
    assert.equal(allowed.some(v => ["ct", "im", "pf", "alma", "energetico"].includes(v)), false);
    await escolha.selectOption("queimante");
    await resistencias(page);
    const first = await total(page, "Queimante");
    const coldFirst = await total(page, "Congelante");
    assert.equal(first - coldFirst, 5);
    await page.screenshot({ path: out + "/" + route + "-" + width + "-rd5.png", fullPage: true });
    await equipamentos(page);
    await click(page.getByRole("button", { name: /^Grau de Equipamento/ }).first());
    await click(page.getByRole("button", { name: "Grau Especial", exact: true }).first());
    await abrirEncantamentos(page, 0);
    assert.equal(await escolha.inputValue(), "queimante");
    const isoUnif = page.getByRole("button", { name: "Isolante", exact: true }).first().locator("..").locator("..");
    await click(isoUnif.getByRole("button", { name: "Adicionar encantamento", exact: true }));
    if (route === "Player") {
      await abrirEncantamentos(page, 1);
      const isoShield = page.getByRole("button", { name: "Isolante", exact: true }).nth(1).locator("..").locator("..");
      await click(isoShield.getByRole("button", { name: "Adicionar encantamento", exact: true }));
      const shieldChoice = page.getByLabel("Tipo de dano 1 de Isolante", { exact: true });
      assert.equal(await shieldChoice.locator("option").count(), 6);
      await shieldChoice.selectOption("queimante");
      await click(page.getByRole("button", { name: "Adicionar tipo", exact: true }));
      await page.getByLabel("Tipo de dano 2 de Isolante", { exact: true }).selectOption("congelante");
      assert.equal(await shieldChoice.locator('option[value="congelante"]').count(), 0);
      await page.screenshot({ path: out + "/" + route + "-" + width + "-escolhas.png", fullPage: true });
    }
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await resistencias(page);
    const fire = await total(page, "Queimante"), cold = await total(page, "Congelante");
    assert.equal(fire - cold, 10);
    const acid = await total(page, "Ácido");
    assert.equal(cold - acid, route === "Player" ? 18 : 5);
    assert.equal(fire - acid, route === "Player" ? 28 : 15);
    await page.screenshot({ path: out + "/" + route + "-" + width + "-resistencias.png", fullPage: true });
    await click(page.getByRole("button", { name: "Salvar Alterações", exact: true }));
    await page.waitForTimeout(700);
    const saved = await page.evaluate(sis => JSON.parse(localStorage.getItem("fm_creatures_" + sis + "_v1"))[0], route.toLowerCase());
    assert.deepEqual(saved.equipamentos.itens[0].fa.encantamentoTipos.enc_unif_resiliente, ["queimante"]);
    if (route === "Player") assert.deepEqual(saved.equipamentos.itens[1].fa.encantamentoTipos.enc_esc_isolante, ["queimante", "congelante"]);
    await page.reload({ waitUntil: "networkidle" });
    await abrirEditor(page);
    await abrirEncantamentos(page, 0);
    assert.equal(await page.getByLabel("Tipo de dano de Resiliente", { exact: true }).inputValue(), "queimante");
    await resistencias(page);
    assert.equal(await total(page, "Queimante"), fire);
    assert.deepEqual(errors, []);
    report.push({ route, width, fire, cold, acid, errors });
    console.log("PASS", route, width);
    await ctx.close();
  }
} catch (e) {
  await page?.screenshot({ path: out + "/failure.png", fullPage: true });
  report.push({ failure: e.stack });
  process.exitCode = 1;
} finally {
  await browser.close();
  await writeFile(".audit/resiliente-browser-report.json", JSON.stringify(report, null, 2));
}
console.log(JSON.stringify(report, null, 2));
