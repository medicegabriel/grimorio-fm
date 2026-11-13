import { register } from "node:module";
register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}', import.meta.url);
import { chromium } from "playwright";
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
const R = new URL("../../src/systems/afty/", import.meta.url);
const { deriveAfty } = await import(new URL("afty-derive.js", R));
const { createBlankAfty } = await import(new URL("afty-schema.js", R));
const { aplicarAddons } = await import(new URL("afty-addons.js", R));
const S = await import(new URL("ficha/ficha-sessao.js", R));
aplicarAddons([]);
const browser = await chromium.launch({ channel: "chrome", ignoreDefaultArgs: ["--hide-scrollbars"] }), resultados = [];
try {
 for (const sistema of ["player", "afty"]) for (const largura of [1440, 390]) for (const g2 of [false, true]) {
  const c = createBlankAfty(); c.id = "CX3 Versatilidade"; c.name = c.id; c.rulesVersion = sistema; c.core.nd = 16;
  c.core.origem = { id: "inato", bonusAtributos: { sabedoria: 2, destreza: 1 } }; c.attrNivel.sabedoria = 3;
  c.attrMethod = "fixos"; c.attributes = { forca: 14, destreza: 12, constituicao: 13, inteligencia: 10, sabedoria: 15, presenca: 8 };
  c.especializacoes = [{ id: "suporte", nivel: 16 }]; c.habilidades = ["sup_versatilidade"]; c.pericias = { feiticaria: "treinado", acrobacia: "treinado" }; c.habilidadesGerais = sistema === "afty" ? ["ger_especializacao"] : [];
  const d = deriveAfty(c), s = S.sessaoEmBranco(d), linha = d.testes.pericias.find((l) => l.id === "atletismo");
  const ctx = await browser.newContext({ viewport: { width: largura, height: 1000 }, isMobile: largura === 390, hasTouch: largura === 390 });
  await ctx.addInitScript(({ sistema, c, s }) => { if (localStorage.getItem("cx3-versa")) return; localStorage.setItem("cx3-versa", "1"); localStorage.setItem(`fm_creatures_${sistema}_v1`, JSON.stringify([c])); localStorage.setItem(`fm_ficha_sessao_afty_v1:${c.id}`, JSON.stringify(s)); }, { sistema, c, s });
  const page = await ctx.newPage(), erros = []; page.on("pageerror", (e) => erros.push(e.message));
  await page.goto(`http://127.0.0.1:5193/${sistema}${g2 ? "?ficha-g2=1" : ""}`, { waitUntil: "networkidle" }); await page.getByText(c.name, { exact: true }).click(); await page.getByRole("tab", { name: "Habilidades", exact: true }).click();
  let el;
  if (g2) { await page.getByRole("button", { name: "Versatilidade. Consultar a regra", exact: true }).click(); el = page.getByRole("dialog", { name: "Consulta: Versatilidade", exact: true }); }
  else { el = page.locator('[id="afty-item-especializacao:sup_versatilidade"]'); await el.getByRole("button", { name: "Versatilidade", exact: true }).click(); }
  const escolhas = await el.getByRole("combobox", { name: "Teste do Benefício" }).locator("option").evaluateAll((els) => els.map((e) => e.value)); assert.ok(!escolhas.includes("acrobacia")); assert.ok(escolhas.includes("atletismo"));
  await el.getByRole("combobox", { name: "Teste do Benefício" }).selectOption("atletismo"); await el.getByText("Descontar PE", { exact: true }).click(); await el.getByRole("button", { name: "Realizar Teste", exact: true }).click();
  await page.waitForFunction(() => JSON.parse(localStorage.getItem("fm_ficha_sessao_afty_v1:CX3 Versatilidade")).usos["hab:sup_versatilidade"] === 1);
  const salva = await page.evaluate(() => JSON.parse(localStorage.getItem("fm_ficha_sessao_afty_v1:CX3 Versatilidade"))); assert.equal(salva.peAtual, s.peAtual - 1); assert.equal(salva.log[0].bonus, linha.versatilidade.bonus); assert.deepEqual(salva.uso.acoes, s.uso.acoes);
  await el.scrollIntoViewIfNeeded(); assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)); await page.screenshot({ path: `.audit/cx3-20261102/${sistema}-${largura}-versatilidade${g2 ? "-g2" : ""}.png` });
  await page.reload({ waitUntil: "networkidle" }); await page.getByText(c.name, { exact: true }).click(); const relida = await page.evaluate(() => JSON.parse(localStorage.getItem("fm_ficha_sessao_afty_v1:CX3 Versatilidade"))); assert.equal(relida.usos["hab:sup_versatilidade"], 1); assert.equal(relida.log[0].bonus, salva.log[0].bonus);
  assert.deepEqual(erros, []); resultados.push({ sistema, largura, g2, versatilidade: true, persistencia: true, erros }); console.log(`${sistema} ${largura} ${g2 ? "G2" : "clássica"}: aprovado`); await ctx.close();
 }
} finally { await writeFile(".audit/cx3-20261102/browser-versatilidade-resultados.json", JSON.stringify(resultados, null, 2)); await browser.close(); }
