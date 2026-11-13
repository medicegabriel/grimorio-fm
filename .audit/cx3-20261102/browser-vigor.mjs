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
const { criarEncontro, criarCombatente } = await import(new URL("encontros/afty-encontro.js", R));
aplicarAddons([]);
function ficha(sistema, id) {
 const c = createBlankAfty(); c.id = id; c.name = id; c.rulesVersion = sistema; c.core.nd = 20;
 c.attrMethod = "fixos"; c.attributes = { forca: 14, destreza: 12, constituicao: 13, inteligencia: 10, sabedoria: 15, presenca: 8 };
 c.core.origem = { id: "inato", bonusAtributos: { forca: 2, sabedoria: 1 } };
 c.especializacoes = [{ id: "suporte", nivel: 20 }]; c.habilidades = ["sup_incitar_vigor"]; c.pericias = { medicina: "treinado", feiticaria: "treinado" };
 c.habilidadesGerais = sistema === "afty" ? ["ger_especializacao"] : []; return c;
}
const browser = await chromium.launch({ channel: "chrome", ignoreDefaultArgs: ["--hide-scrollbars"] }), resultados = [];
try {
 for (const sistema of ["player", "afty"]) for (const largura of [1440, 390]) for (const g2 of [false, true]) {
  const c = ficha(sistema, "CX3 Vigor"), alvo = ficha(sistema, "CX3 Alvo do Vigor"); alvo.habilidades = []; alvo.especializacoes = [{ id: "lutador", nivel: 20 }]; alvo.treinamentos = { resistencia: 2 }; alvo.focosLivres = 2;
  const d = deriveAfty(c), s = { ...S.iniciaCombate(S.sessaoEmBranco(d), d), hpAtual: 1 };
  const encontro = criarEncontro({ nome: "CX3 Incitar Vigor" }); encontro.combatentes = [c, alvo].map((f) => criarCombatente(f, { derived: deriveAfty(f) })); encontro.combatentes[1].sessao.hpAtual = 1;
  const ctx = await browser.newContext({ viewport: { width: largura, height: 1000 }, isMobile: largura === 390, hasTouch: largura === 390 });
  await ctx.addInitScript(({ sistema, c, s, encontro }) => { if (localStorage.getItem("cx3-vigor-ui")) return; localStorage.setItem("cx3-vigor-ui", "1"); localStorage.setItem(`fm_creatures_${sistema}_v1`, JSON.stringify([c])); localStorage.setItem(`fm_ficha_sessao_afty_v1:${c.id}`, JSON.stringify(s)); localStorage.setItem("afty_encontros_v1", JSON.stringify([encontro])); }, { sistema, c, s, encontro });
  const page = await ctx.newPage(), erros = []; page.on("pageerror", (e) => erros.push(e.message));
  const maxClique = async (el) => { await page.evaluate(() => { globalThis.cx3Random = Math.random; Math.random = () => 0.999; }); try { await el.click(); } finally { await page.evaluate(() => { Math.random = globalThis.cx3Random; delete globalThis.cx3Random; }); } };
  const abre = async (previa = false) => { await page.getByRole("tab", { name: "Habilidades", exact: true }).click(); if (previa) { await page.getByRole("button", { name: "Incitar Vigor. Consultar a regra", exact: true }).click(); return page.getByRole("dialog", { name: "Consulta: Incitar Vigor", exact: true }); } const el = page.locator('[id="afty-item-especializacao:sup_incitar_vigor"]'); if (await el.getByRole("button", { name: "Incitar Vigor", exact: true }).getAttribute("aria-expanded") !== "true") await el.getByRole("button", { name: "Incitar Vigor", exact: true }).click(); return el; };
  await page.goto(`http://127.0.0.1:5193/${sistema}${g2 ? "?ficha-g2=1" : ""}`, { waitUntil: "networkidle" }); await page.getByText(c.name, { exact: true }).click(); let el = await abre(g2);
  await el.getByRole("combobox", { name: "Pilha de Dados de Vida" }).selectOption("suporte"); await el.getByRole("spinbutton", { name: "Quantidade de Dados de Vida" }).fill("2"); await el.getByText("Descontar PE", { exact: true }).click(); await maxClique(el.getByRole("button", { name: "Gastar Dados de Vida", exact: true }));
  await page.waitForFunction(() => JSON.parse(localStorage.getItem("fm_ficha_sessao_afty_v1:CX3 Vigor")).dadosVida.gastos.suporte === 2);
  const salva = await page.evaluate(() => JSON.parse(localStorage.getItem("fm_ficha_sessao_afty_v1:CX3 Vigor"))); assert.equal(salva.hpAtual, 19); assert.equal(salva.peAtual, d.pe - 3); assert.equal(salva.uso.acoes.gastas.bonus, 1); assert.equal(salva.log[0].fontes[1].label, "Suporte");
  await el.scrollIntoViewIfNeeded(); assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)); await page.screenshot({ path: `.audit/cx3-20261102/${sistema}-${largura}-vigor${g2 ? "-g2" : ""}.png` });
  await page.reload({ waitUntil: "networkidle" }); await page.getByText(c.name, { exact: true }).click(); assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem("fm_ficha_sessao_afty_v1:CX3 Vigor")).hpAtual), 19);
  if (!g2) {
   await page.getByRole("button", { name: "Voltar", exact: true }).click(); await page.getByRole("button", { name: "Encontros", exact: true }).click(); await page.getByText(encontro.nome, { exact: true }).click(); await page.getByRole("button", { name: "Rolar Tudo", exact: true }).click(); await page.getByRole("button", { name: "Começar", exact: true }).click();
   if (largura === 390) await page.getByRole("button", { name: "Iniciativa", exact: true }).click(); for (const candidato of await page.getByText(c.name, { exact: true }).all()) if (await candidato.isVisible()) { await candidato.click(); break; }
   el = await abre(); await el.getByRole("combobox", { name: "Destinatário de Incitar Vigor" }).selectOption(encontro.combatentes[1].id); await el.getByRole("combobox", { name: "Pilha de Dados de Vida" }).selectOption("treino:resistencia"); await el.getByRole("spinbutton", { name: "Quantidade de Dados de Vida" }).fill("2"); await el.getByText("Destinatário em Toque", { exact: true }).click(); await el.getByText("Descontar PE", { exact: true }).click(); await maxClique(el.getByRole("button", { name: "Gastar Dados de Vida", exact: true }));
   await page.waitForFunction(() => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0].combatentes[1].sessao.dadosVida.gastos["treino:resistencia"] === 2);
   let mesa = await page.evaluate(() => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0]); assert.equal(mesa.combatentes[1].sessao.hpAtual, 23); assert.equal(mesa.combatentes[0].sessao.peAtual, d.pe - 3); assert.equal(mesa.combatentes[0].sessao.uso.acoes.gastas.bonus, 1); assert.deepEqual(mesa.combatentes[0].sessao.dadosVida.gastos, {}); assert.equal(mesa.combatentes[1].sessao.uso.acoes.gastas.bonus, 0);
   await el.scrollIntoViewIfNeeded(); assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)); await page.screenshot({ path: `.audit/cx3-20261102/${sistema}-${largura}-vigor-encontro.png` });
   await page.reload({ waitUntil: "networkidle" }); mesa = await page.evaluate(() => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0]); assert.equal(mesa.combatentes[1].sessao.hpAtual, 23); assert.equal(mesa.combatentes[1].sessao.dadosVida.gastos["treino:resistencia"], 2);
  }
  assert.deepEqual(erros, []); resultados.push({ sistema, largura, g2, propriaFicha: true, custoAcao: true, destinatarioEncontro: !g2, dadosTreino: !g2, persistencia: true, erros }); console.log(`${sistema} ${largura} ${g2 ? "G2" : "clássica/Encontro"}: aprovado`); await ctx.close();
 }
} finally { await writeFile(".audit/cx3-20261102/browser-vigor-resultados.json", JSON.stringify(resultados, null, 2)); await browser.close(); }
