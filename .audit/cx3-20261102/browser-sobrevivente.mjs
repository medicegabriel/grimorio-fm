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
const { criarEncontro, criarCombatente, definirIniciativa } = await import(new URL("encontros/afty-encontro.js", R));
aplicarAddons([]);
function ficha(sistema, id) {
 const c = createBlankAfty(); c.id = id; c.name = id; c.rulesVersion = sistema; c.core.nd = 20;
 c.core.origem = { id: "inato", bonusAtributos: { constituicao: 2, destreza: 1 } }; c.attrNivel = {};
 c.attrMethod = "fixos"; c.attributes = { forca: 14, destreza: 12, constituicao: 15, inteligencia: 10, sabedoria: 13, presenca: 8 };
 c.especializacoes = [{ id: "lutador", nivel: 20 }]; c.pericias = { atletismo: "treinado", feiticaria: "treinado" }; c.habilidades = ["lut_sobrevivente"];
 c.habilidadesGerais = sistema === "afty" ? ["ger_especializacao"] : []; return c;
}
const browser = await chromium.launch({ channel: "chrome", ignoreDefaultArgs: ["--hide-scrollbars"] }), resultados = [];
try {
 for (const sistema of ["player", "afty"]) for (const largura of [1440, 390]) for (const g2 of [false, true]) {
  const c = ficha(sistema, "CX3 Sobrevivente"), outro = ficha(sistema, "CX3 Outro Sobrevivente"), d = deriveAfty(c), s = { ...S.iniciaCombate(S.sessaoEmBranco(d), d), hpAtual: 1 };
  const encontro = criarEncontro({ nome: "CX3 Início do Turno" }); encontro.combatentes = [c, outro].map((f, i) => { const a = definirIniciativa(criarCombatente(f, { derived: deriveAfty(f) }), i ? 10 : 20); a.sessao.hpAtual = 1; return a; });
  const ctx = await browser.newContext({ viewport: { width: largura, height: 1000 }, isMobile: largura === 390, hasTouch: largura === 390 });
  await ctx.addInitScript(({ sistema, c, s, encontro }) => { if (localStorage.getItem("cx3-sobrevivente-ui")) return; localStorage.setItem("cx3-sobrevivente-ui", "1"); localStorage.setItem(`fm_creatures_${sistema}_v1`, JSON.stringify([c])); localStorage.setItem(`fm_ficha_sessao_afty_v1:${c.id}`, JSON.stringify(s)); localStorage.setItem("afty_encontros_v1", JSON.stringify([encontro])); }, { sistema, c, s, encontro });
  const page = await ctx.newPage(), erros = []; page.on("pageerror", (e) => erros.push(e.message));
  const cliqueMaximo = async (el) => { await page.evaluate(() => { globalThis.cx3Random = Math.random; Math.random = () => 0.999; }); try { await el.click(); } finally { await page.evaluate(() => { Math.random = globalThis.cx3Random; delete globalThis.cx3Random; }); } };
  await page.goto(`http://127.0.0.1:5193/${sistema}${g2 ? "?ficha-g2=1" : ""}`, { waitUntil: "networkidle" }); await page.getByText(c.name, { exact: true }).click();
  await cliqueMaximo(page.getByRole("button", { name: "Próxima rodada", exact: true }));
  await page.waitForFunction(() => JSON.parse(localStorage.getItem("fm_ficha_sessao_afty_v1:CX3 Sobrevivente")).hpAtual === 34);
  const salva = await page.evaluate(() => JSON.parse(localStorage.getItem("fm_ficha_sessao_afty_v1:CX3 Sobrevivente"))); assert.equal(salva.log.filter((r) => r.rotulo === "Sobrevivente").length, 1); assert.equal(salva.log[0].fontes[0].label, "Sobrevivente");
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)); await page.screenshot({ path: `.audit/cx3-20261102/${sistema}-${largura}-sobrevivente${g2 ? "-g2" : ""}.png` });
  await page.reload({ waitUntil: "networkidle" }); await page.getByText(c.name, { exact: true }).click(); assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem("fm_ficha_sessao_afty_v1:CX3 Sobrevivente")).hpAtual), 34);
  if (!g2) {
   await page.getByRole("button", { name: "Voltar", exact: true }).click(); await page.getByRole("button", { name: "Encontros", exact: true }).click(); await page.getByText(encontro.nome, { exact: true }).click();
   await cliqueMaximo(page.getByRole("button", { name: "Começar", exact: true })); await page.waitForFunction(() => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0].combatentes[0].sessao.hpAtual === 34);
   let mesa = await page.evaluate(() => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0]); assert.deepEqual(mesa.combatentes.map((a) => a.sessao.hpAtual), [34, 1]);
   await cliqueMaximo(page.getByRole("button", { name: "Próximo Turno", exact: true })); await page.waitForFunction(() => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0].combatentes[1].sessao.hpAtual === 34);
   mesa = await page.evaluate(() => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0]); assert.deepEqual(mesa.combatentes.map((a) => a.sessao.hpAtual), [34, 34]); assert.equal(mesa.combatentes[0].sessao.log.filter((r) => r.rotulo === "Sobrevivente").length, 1);
   assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)); await page.screenshot({ path: `.audit/cx3-20261102/${sistema}-${largura}-sobrevivente-encontro.png` });
   await page.reload({ waitUntil: "networkidle" }); mesa = await page.evaluate(() => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0]); assert.deepEqual(mesa.combatentes.map((a) => a.sessao.hpAtual), [34, 34]);
  }
  assert.deepEqual(erros, []); resultados.push({ sistema, largura, g2, curaNoTurno: true, umaCura: true, primeiroTurnoEncontro: !g2, proximoTurnoEncontro: !g2, persistencia: true, erros }); console.log(`${sistema} ${largura} ${g2 ? "G2" : "clássica/Encontro"}: aprovado`); await ctx.close();
 }
} finally { await writeFile(".audit/cx3-20261102/browser-sobrevivente-resultados.json", JSON.stringify(resultados, null, 2)); await browser.close(); }
