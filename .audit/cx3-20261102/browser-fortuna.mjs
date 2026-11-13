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
const browser = await chromium.launch({ channel: "chrome", ignoreDefaultArgs: ["--hide-scrollbars"] }), resultados = [];
try {
 for (const sistema of ["player", "afty"]) for (const largura of [1440, 390]) for (const g2 of [false, true]) {
  const c = createBlankAfty(); c.id = "CX3 Fortuna"; c.name = c.id; c.rulesVersion = sistema; c.core.nd = 12; c.attrMethod = "fixos";
  c.attributes = { forca: 15, destreza: 14, constituicao: 13, inteligencia: 10, sabedoria: 12, presenca: 8 }; c.core.origem = { id: "inato", bonusAtributos: { forca: 2, destreza: 1 } };
  c.especializacoes = [{ id: "combatente", nivel: 12 }]; c.pericias = { atletismo: "treinado", feiticaria: "treinado" }; c.habilidadesGerais = sistema === "afty" ? ["ger_especializacao"] : [];
  c.habilidades = ["cmb_assumir_postura"]; c.escolhasHabilidade = { cmb_assumir_postura: ["cmb_postura_da_fortuna", "cmb_postura_do_sol"] }; c.combate = { ...c.combate, ativo: true, postura: "fortuna" };
  const d = deriveAfty(c), linha = d.dano.entradas.find((l) => l.id === "basico"), s = { ...S.iniciaCombate(S.sessaoEmBranco(d), d), combate: c.combate, modoRolagem: "vantagem" };
  assert.deepEqual(d.habilidades.inacessiveis, []); assert.equal(d.habilidades.excedeu, false); assert.equal(d.conteudoPosturaFortuna.ativa, true);
  const encontro = criarEncontro({ nome: "CX3 Fortuna no Encontro" }); encontro.combatentes = [definirIniciativa(criarCombatente(c, { derived: d }), 20)]; encontro.combatentes[0].sessao = structuredClone(s);
  const ctx = await browser.newContext({ viewport: { width: largura, height: 1000 }, isMobile: largura === 390, hasTouch: largura === 390 });
  await ctx.addInitScript(({ sistema, c, s, encontro }) => { if (localStorage.getItem("cx3-fortuna")) return; localStorage.setItem("cx3-fortuna", "1"); localStorage.setItem(`fm_creatures_${sistema}_v1`, JSON.stringify([c])); localStorage.setItem(`fm_ficha_sessao_afty_v1:${c.id}`, JSON.stringify(s)); localStorage.setItem("afty_encontros_v1", JSON.stringify([encontro])); }, { sistema, c, s, encontro });
  const page = await ctx.newPage(), erros = []; page.on("pageerror", (e) => erros.push(e.message));
  const rngClique = async (el, n) => { await page.evaluate((n) => { globalThis.cx3Random = Math.random; Math.random = () => n; }, n); try { await el.click(); } finally { await page.evaluate(() => { Math.random = globalThis.cx3Random; delete globalThis.cx3Random; }); } };
  const abre = async (previa = false) => { await page.getByRole("tab", { name: "Habilidades", exact: true }).click(); if (previa) { await page.getByRole("button", { name: "Assumir Postura. Consultar a regra", exact: true }).click(); return page.getByRole("dialog", { name: "Consulta: Assumir Postura", exact: true }); } const el = page.locator('[id="afty-item-especializacao:cmb_assumir_postura"]'); const b = el.getByRole("button", { name: "Assumir Postura", exact: true }); if (await b.getAttribute("aria-expanded") !== "true") await b.click(); return el; };
  const exercita = async (encontro = false, previa = false) => {
   const le = () => page.evaluate((encontro) => encontro ? JSON.parse(localStorage.getItem("afty_encontros_v1"))[0].combatentes[0].sessao : JSON.parse(localStorage.getItem("fm_ficha_sessao_afty_v1:CX3 Fortuna")), encontro);
   await page.getByRole("tab", { name: "Ações", exact: true }).click();
   if (!encontro) await page.getByRole("button", { name: "Vantagem", exact: true }).click();
   const basico = page.locator('[id="afty-item-dano:basico"]');
   await rngClique(basico.getByRole("button", { name: `+${linha.acerto}`, exact: true }), 0.05);
   await page.waitForFunction((encontro) => { const s = encontro ? JSON.parse(localStorage.getItem("afty_encontros_v1"))[0].combatentes[0].sessao : JSON.parse(localStorage.getItem("fm_ficha_sessao_afty_v1:CX3 Fortuna")); return s.log.some((r) => r.tipoTeste === "ataque"); }, encontro);
   const antes = await le(); let teste = antes.log.find((r) => r.tipoTeste === "ataque"); assert.deepEqual(teste.d20, encontro ? [2] : [2, 2]);
   let el = await abre(previa); await el.getByRole("combobox", { name: "Teste de Fortuna" }).selectOption(teste.id); await el.getByRole("combobox", { name: "Dado de Fortuna" }).selectOption("0");
   await rngClique(el.getByRole("button", { name: "Rerrolar D20", exact: true }), 0.85);
   await page.waitForFunction(({ encontro, id }) => { const s = encontro ? JSON.parse(localStorage.getItem("afty_encontros_v1"))[0].combatentes[0].sessao : JSON.parse(localStorage.getItem("fm_ficha_sessao_afty_v1:CX3 Fortuna")); return s.log.find((r) => r.id === id)?.fortuna?.length === 1; }, { encontro, id: teste.id });
   let salva = await le(), r = salva.log.find((r) => r.id === teste.id); assert.deepEqual(r.d20, encontro ? [18] : [18, 2]); assert.equal(r.natural, 18); assert.equal(r.descartado, encontro ? null : 1); assert.equal(r.total, 18 + teste.bonus + teste.somaExtras); assert.deepEqual(salva.uso.acoes, antes.uso.acoes); assert.equal(salva.peAtual, antes.peAtual);
   const valores = await el.getByRole("combobox", { name: "Dado de Fortuna" }).locator("option").evaluateAll((xs) => xs.map((x) => x.value)); assert.deepEqual(valores, encontro ? [""] : ["", "1"]);
   if (encontro) {
    await page.getByRole("tab", { name: "Ações", exact: true }).click(); await rngClique(basico.getByRole("button", { name: `+${linha.acerto}`, exact: true }), 0.05);
    await page.waitForFunction(() => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0].combatentes[0].sessao.log.filter((r) => r.tipoTeste === "ataque").length === 2);
    teste = (await le()).log.find((r) => r.tipoTeste === "ataque"); el = await abre(); await el.getByRole("combobox", { name: "Teste de Fortuna" }).selectOption(teste.id);
   }
   await el.getByRole("combobox", { name: "Dado de Fortuna" }).selectOption(encontro ? "0" : "1"); await rngClique(el.getByRole("button", { name: "Rerrolar D20", exact: true }), 0);
   await page.waitForFunction((encontro) => { const s = encontro ? JSON.parse(localStorage.getItem("afty_encontros_v1"))[0].combatentes[0].sessao : JSON.parse(localStorage.getItem("fm_ficha_sessao_afty_v1:CX3 Fortuna")); return s.usos["rodada:uso:cmb_postura_da_fortuna"] === 2; }, encontro);
   salva = await le(); r = salva.log.find((r) => r.id === teste.id); assert.deepEqual(r.d20, encontro ? [2] : [18, 2]); assert.equal(r.fortuna.length, encontro ? 1 : 2); assert.equal(salva.usos["rodada:uso:cmb_postura_da_fortuna"], 2); assert.equal(await el.getByRole("button", { name: "Rerrolar D20", exact: true }).isDisabled(), true); assert.equal(salva.log.filter((r) => r.id === teste.id).length, 1);
   await el.scrollIntoViewIfNeeded(); assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)); await page.screenshot({ path: `.audit/cx3-20261102/${sistema}-${largura}-fortuna${encontro ? "-encontro" : previa ? "-g2" : ""}.png` });
   await page.reload({ waitUntil: "networkidle" }); if (!encontro) await page.getByText(c.name, { exact: true }).click(); const relida = await le(); assert.equal(relida.usos["rodada:uso:cmb_postura_da_fortuna"], 2); assert.deepEqual(relida.log.find((r) => r.id === teste.id).fortuna, r.fortuna);
  };
  await page.goto(`http://127.0.0.1:5193/${sistema}${g2 ? "?ficha-g2=1" : ""}`, { waitUntil: "networkidle" }); await page.getByText(c.name, { exact: true }).click(); await exercita(false, g2);
  if (!g2) {
   await page.getByRole("button", { name: "Voltar", exact: true }).click(); await page.getByRole("button", { name: "Encontros", exact: true }).click(); await page.getByText(encontro.nome, { exact: true }).click(); await page.getByRole("button", { name: "Começar", exact: true }).click();
   if (largura === 390) await page.getByRole("button", { name: "Iniciativa", exact: true }).click(); for (const candidato of await page.getByText(c.name, { exact: true }).all()) if (await candidato.isVisible()) { await candidato.click(); break; }
   await exercita(true, false);
  }
  assert.deepEqual(erros, []); resultados.push({ sistema, largura, g2, dadosIndividuais: true, quota: true, persistencia: true, encontro: !g2, erros }); console.log(`${sistema} ${largura} ${g2 ? "G2" : "clássica/Encontro"}: aprovado`); await ctx.close();
 }
} finally { await writeFile(".audit/cx3-20261102/browser-fortuna-resultados.json", JSON.stringify(resultados, null, 2)); await browser.close(); }
