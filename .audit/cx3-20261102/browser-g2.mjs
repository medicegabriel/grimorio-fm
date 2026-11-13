import { register } from "node:module";
register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}', import.meta.url);
import { chromium } from "playwright";
import { writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
const R = new URL("../../src/systems/afty/", import.meta.url);
const { deriveAfty } = await import(new URL("afty-derive.js", R));
const { createBlankAfty } = await import(new URL("afty-schema.js", R));
const { aplicarAddons } = await import(new URL("afty-addons.js", R));
const S = await import(new URL("ficha/ficha-sessao.js", R));
aplicarAddons([]);
const browser = await chromium.launch({ channel: "chrome", ignoreDefaultArgs: ["--hide-scrollbars"] }), resultados = [];
try {
 for (const sistema of ["player", "afty"]) for (const largura of [1440, 390]) {
  const c = createBlankAfty(); c.id = "CX3 Prévia"; c.name = c.id; c.rulesVersion = sistema; c.core.nd = 8;
  c.core.origem = { id: "inato", bonusAtributos: { sabedoria: 2, destreza: 1 } }; c.attrMethod = "fixos";
  c.attributes = { forca: 14, destreza: 12, constituicao: 13, inteligencia: 10, sabedoria: 15, presenca: 8 }; c.attrNivel.sabedoria = 3;
  c.especializacoes = [{ id: "combatente", nivel: 8 }]; c.pericias = { medicina: "mestre" }; c.talentos = ["tal_adepto_de_medicina", "tal_perceber_oportunidade"];
  c.habilidadesGerais = sistema === "afty" ? ["ger_especializacao"] : [];
  const d = deriveAfty(c), s = { ...S.iniciaCombate(S.sessaoEmBranco(d), d), hpAtual: d.hp - 20 };
  const ctx = await browser.newContext({ viewport: { width: largura, height: 1000 }, isMobile: largura === 390, hasTouch: largura === 390 });
  await ctx.addInitScript(({ sistema, c, s }) => {
    if (localStorage.getItem("cx3-g2")) return;
    localStorage.setItem("cx3-g2", "1"); localStorage.setItem(`fm_creatures_${sistema}_v1`, JSON.stringify([c]));
    localStorage.setItem(`fm_ficha_sessao_afty_v1:${c.id}`, JSON.stringify(s));
  }, { sistema, c, s });
  const page = await ctx.newPage(), erros = []; page.on("pageerror", (e) => erros.push(e.message));
  await page.goto(`http://127.0.0.1:5193/${sistema}?ficha-g2=1`, { waitUntil: "networkidle" });
  await page.getByText(c.name, { exact: true }).click();
  await page.getByRole("tab", { name: "Habilidades", exact: true }).click();
  await page.getByRole("button", { name: "Adepto de Medicina. Consultar a regra", exact: true }).click();
  const consulta = page.getByRole("dialog", { name: "Consulta: Adepto de Medicina", exact: true });
  await consulta.getByRole("button", { name: "Curar", exact: true }).click();
  await page.waitForFunction(() => JSON.parse(localStorage.getItem("fm_ficha_sessao_afty_v1:CX3 Prévia"))?.usos?.["talento:tal_adepto_de_medicina"] === 1);
  assert.ok(await page.evaluate(() => JSON.parse(localStorage.getItem("fm_ficha_sessao_afty_v1:CX3 Prévia")).hpAtual) > s.hpAtual);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Perceber Oportunidade. Consultar a regra", exact: true }).click();
  const oportunidade = page.getByRole("dialog", { name: "Consulta: Perceber Oportunidade", exact: true });
  await oportunidade.getByRole("combobox", { name: "Arma do Golpe de Oportunidade" }).selectOption("0"); await oportunidade.getByText("Gatilho de Oportunidade", { exact: true }).click();
  await oportunidade.getByRole("button", { name: "Rolar Golpe de Oportunidade", exact: true }).click();
  await page.waitForFunction(() => JSON.parse(localStorage.getItem("fm_ficha_sessao_afty_v1:CX3 Prévia"))?.usos?.["rodada:uso:golpe-oportunidade"] === 1);
  const gravada = await page.evaluate(() => JSON.parse(localStorage.getItem("fm_ficha_sessao_afty_v1:CX3 Prévia")));
  assert.equal(gravada.especializacaoSessao.reacoesGastas, 1); assert.equal(gravada.log[0].tipoTeste, "ataque"); assert.equal(gravada.log[0].modo, "vantagem");
  assert.equal(await page.getByRole("heading", { name: /Algo deu errado/ }).count(), 0);
  assert.deepEqual(erros, []); assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.screenshot({ path: `.audit/cx3-20261102/${sistema}-${largura}-g2.png` });
  await page.reload({ waitUntil: "networkidle" }); await page.getByText(c.name, { exact: true }).click();
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem("fm_ficha_sessao_afty_v1:CX3 Prévia")).especializacaoSessao.reacoesGastas), 1);
  resultados.push({ sistema, largura, previaSomente: true, consulta: true, cura: true, oportunidade: true, persistencia: true, erros });
  console.log(`${sistema} ${largura}: aprovado`); await ctx.close();
 }
} finally { await writeFile(".audit/cx3-20261102/browser-g2-resultados.json", JSON.stringify(resultados, null, 2)); await browser.close(); }
