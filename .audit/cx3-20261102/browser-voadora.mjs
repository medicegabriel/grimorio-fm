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
 c.core.origem = { id: "inato", bonusAtributos: { forca: 2, destreza: 1 } }; c.attrNivel.forca = 3;
 c.attrMethod = "fixos"; c.attributes = { forca: 15, destreza: 14, constituicao: 13, inteligencia: 12, sabedoria: 10, presenca: 8 };
 c.especializacoes = [{ id: "lutador", nivel: 20 }]; c.pericias = { atletismo: "treinado", feiticaria: "treinado" }; c.habilidades = ["lut_voadora"];
 c.habilidadesGerais = sistema === "afty" ? ["ger_especializacao"] : []; return c;
}
const browser = await chromium.launch({ channel: "chrome", ignoreDefaultArgs: ["--hide-scrollbars"] }), resultados = [];
try {
 for (const sistema of ["player", "afty"]) for (const largura of [1440, 390]) for (const g2 of [false, true]) {
  const c = ficha(sistema, "CX3 Voadora"), alvo = ficha(sistema, "CX3 Alvo da Voadora"), d = deriveAfty(c), s = S.iniciaCombate(S.sessaoEmBranco(d), d);
  const encontro = criarEncontro({ nome: "CX3 Voadora na Mesa" }); encontro.combatentes = [c, alvo].map((f) => criarCombatente(f, { derived: deriveAfty(f) }));
  const ctx = await browser.newContext({ viewport: { width: largura, height: 1000 }, isMobile: largura === 390, hasTouch: largura === 390 });
  await ctx.addInitScript(({ sistema, c, s, encontro }) => { if (localStorage.getItem("cx3-voadora-ui")) return; localStorage.setItem("cx3-voadora-ui", "1"); localStorage.setItem(`fm_creatures_${sistema}_v1`, JSON.stringify([c])); localStorage.setItem(`fm_ficha_sessao_afty_v1:${c.id}`, JSON.stringify(s)); localStorage.setItem("afty_encontros_v1", JSON.stringify([encontro])); }, { sistema, c, s, encontro });
  const page = await ctx.newPage(), erros = []; page.on("pageerror", (e) => erros.push(e.message));
  const abre = async (previa = false) => { await page.getByRole("tab", { name: "Habilidades", exact: true }).click(); if (previa) { await page.getByRole("button", { name: "Voadora. Consultar a regra", exact: true }).click(); return page.getByRole("dialog", { name: "Consulta: Voadora", exact: true }); } const el = page.locator('[id="afty-item-especializacao:lut_voadora"]'); await el.getByRole("button", { name: "Voadora", exact: true }).click(); return el; };
  const usa = async (el, alvoId = null) => {
   await el.getByRole("combobox", { name: "Arma da Investida" }).selectOption("0"); if (alvoId) await el.getByRole("combobox", { name: "Alvo da Investida" }).selectOption(alvoId);
   await el.getByRole("spinbutton", { name: "Distância da Investida" }).fill("9"); await el.getByText("Linha Reta sem Terreno Difícil", { exact: true }).click(); await el.getByText("Descontar PE", { exact: true }).click();
   await page.evaluate(() => { globalThis.cx3Random = Math.random; Math.random = () => 0.999; }); try { await el.getByRole("button", { name: "Realizar Investida", exact: true }).click(); } finally { await page.evaluate(() => { Math.random = globalThis.cx3Random; delete globalThis.cx3Random; }); }
   await el.getByRole("button", { name: "Rolar Dano da Investida", exact: true }).click();
  };
  const confere = (salva, peAntes) => { const a = salva.log.find((r) => r.contextoConteudo?.voadora), dano = salva.log.find((r) => r.tipo === "dano"); assert.equal(salva.peAtual, peAntes - 3); assert.equal(salva.uso.acoes.gastas.comum, 1); assert.equal(salva.uso.acoes.gastas.bonus, 1); assert.equal(a.contextoConteudo.aprimorada, false); assert.equal(a.contextoConteudo.maximo, 2 * d.movimento); assert.equal(a.bonus, d.dano.entradas.find((l) => l.id === "basico").acerto + 2); assert.equal(dano.pedidoDano.grupos.at(-1).dados, 3); assert.equal(dano.critico, true); assert.equal(dano.gruposRolados.at(-1).nome, "Voadora"); assert.ok(dano.gruposRolados.at(-1).total >= 6); return { a, dano }; };
  await page.goto(`http://127.0.0.1:5193/${sistema}${g2 ? "?ficha-g2=1" : ""}`, { waitUntil: "networkidle" }); await page.getByText(c.name, { exact: true }).click(); let el = await abre(g2); await usa(el);
  await page.waitForFunction(() => JSON.parse(localStorage.getItem("fm_ficha_sessao_afty_v1:CX3 Voadora")).log.some((r) => r.tipo === "dano"));
  const salva = await page.evaluate(() => JSON.parse(localStorage.getItem("fm_ficha_sessao_afty_v1:CX3 Voadora"))); confere(salva, s.peAtual);
  await el.scrollIntoViewIfNeeded(); assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)); await page.screenshot({ path: `.audit/cx3-20261102/${sistema}-${largura}-voadora${g2 ? "-g2" : ""}.png` });
  await page.reload({ waitUntil: "networkidle" }); await page.getByText(c.name, { exact: true }).click(); assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem("fm_ficha_sessao_afty_v1:CX3 Voadora")).peAtual), salva.peAtual);
  if (!g2) {
   await page.getByRole("button", { name: "Voltar", exact: true }).click(); await page.getByRole("button", { name: "Encontros", exact: true }).click(); await page.getByText(encontro.nome, { exact: true }).click();
   await page.getByRole("button", { name: "Rolar Tudo", exact: true }).click(); await page.getByRole("button", { name: "Começar", exact: true }).click();
   if (largura === 390) await page.getByRole("button", { name: "Iniciativa", exact: true }).click(); for (const candidato of await page.getByText(c.name, { exact: true }).all()) if (await candidato.isVisible()) { await candidato.click(); break; }
   el = await abre(); await usa(el, encontro.combatentes[1].id); const mesa = await page.evaluate(() => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0]); const { a, dano } = confere(mesa.combatentes[0].sessao, s.peAtual);
   assert.equal(await el.getByRole("button", { name: "Rolar Disputa", exact: true }).count(), 0);
   await page.getByRole("tab", { name: "Ações", exact: true }).click(); await page.getByRole("combobox", { name: "Ataque a Confirmar" }).selectOption(a.id); await page.getByRole("combobox", { name: "Alvo do Ataque" }).selectOption(encontro.combatentes[1].id); await page.getByRole("combobox", { name: "Dano do Ataque" }).selectOption(dano.id); await page.getByRole("button", { name: "Confirmar Ataque e Aplicar Dano", exact: true }).click();
   await page.waitForFunction(() => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0].combatentes[0].sessao.log.some((r) => r.rotulo === "Ataque Confirmado"));
   const fim = await page.evaluate(() => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0]); assert.ok(fim.combatentes[1].sessao.hpAtual < mesa.combatentes[1].sessao.hpAtual); assert.equal(fim.combatentes[0].sessao.peAtual, mesa.combatentes[0].sessao.peAtual);
  }
  assert.deepEqual(erros, []); resultados.push({ sistema, largura, g2, voadora: true, investidaComum: true, dadoAdicionalCritico: true, alvoNoEncontro: !g2, persistencia: true, erros }); console.log(`${sistema} ${largura} ${g2 ? "G2" : "clássica/Encontro"}: aprovado`); await ctx.close();
 }
} finally { await writeFile(".audit/cx3-20261102/browser-voadora-resultados.json", JSON.stringify(resultados, null, 2)); await browser.close(); }
