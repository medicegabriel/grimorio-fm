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
  const c = createBlankAfty(); c.id = "CX3 Posturas"; c.name = c.id; c.rulesVersion = sistema; c.core.nd = 20; c.attrMethod = "fixos";
  c.attributes = { forca: 15, destreza: 14, constituicao: 13, inteligencia: 10, sabedoria: 12, presenca: 8 }; c.core.origem = { id: "inato", bonusAtributos: { forca: 2, destreza: 1 } };
  c.especializacoes = [{ id: "combatente", nivel: 20 }]; c.pericias = { feiticaria: "treinado" }; c.habilidadesGerais = sistema === "afty" ? ["ger_especializacao"] : [];
  c.habilidades = ["cmb_assumir_postura", "cmb_mestre_da_postura"]; c.escolhasHabilidade = { cmb_assumir_postura: ["cmb_postura_da_terra", "cmb_postura_do_sol", "cmb_postura_da_fortuna"] };
  const d = deriveAfty(c), s = { ...S.iniciaTurnoFicha(S.iniciaCombate(S.sessaoEmBranco(d), d), d), rodada: 1 };
  assert.deepEqual(d.habilidades.inacessiveis, []); assert.equal(d.habilidades.excedeu, false);
  const e = criarEncontro({ nome: "CX3 Posturas no Encontro" }); e.combatentes = [definirIniciativa(criarCombatente(c, { derived: d }), 20)];
  const ctx = await browser.newContext({ viewport: { width: largura, height: 1000 }, isMobile: largura === 390, hasTouch: largura === 390 });
  await ctx.addInitScript(({ sistema, c, s, e }) => { if (localStorage.getItem("cx3-posturas")) return; localStorage.setItem("cx3-posturas", "1"); localStorage.setItem(`fm_creatures_${sistema}_v1`, JSON.stringify([c])); localStorage.setItem(`fm_ficha_sessao_afty_v1:${c.id}`, JSON.stringify(s)); localStorage.setItem("afty_encontros_v1", JSON.stringify([e])); }, { sistema, c, s, e });
  const page = await ctx.newPage(), erros = []; page.on("pageerror", e => erros.push(e.message));
  const abre = async previa => { await page.getByRole("tab", { name: "Habilidades", exact: true }).click(); if (previa) { try { await page.getByRole("button", { name: "Assumir Postura. Consultar a regra", exact: true }).click({timeout:5000}); } catch(e) { await page.screenshot({path:'.audit/cx3-20261102/posturas-falha-abre.png'}); console.log(await page.locator('body').innerText()); throw e; } return page.getByRole("dialog", { name: "Consulta: Assumir Postura", exact: true }); } const el = page.locator('[id="afty-item-especializacao:cmb_assumir_postura"]'); const b = el.getByRole("button", { name: "Assumir Postura", exact: true }); if (await b.getAttribute("aria-expanded") !== "true") await b.click(); return el; };
  const focoEncontro = async () => { if (largura === 390) await page.getByRole("button", { name: "Iniciativa", exact: true }).click(); for (const candidato of await page.getByText(c.name, { exact: true }).all()) if (await candidato.isVisible()) { await candidato.click(); return; } throw Error("Combatente Não Encontrado"); };
  const exercita = async (encontro, previa) => {
   const le = () => page.evaluate(encontro => encontro ? JSON.parse(localStorage.getItem("afty_encontros_v1"))[0].combatentes[0].sessao : JSON.parse(localStorage.getItem("fm_ficha_sessao_afty_v1:CX3 Posturas")), encontro);
   let el, antes = await le();
   if (previa) {
    await page.getByRole("tab", { name: "Habilidades", exact: true }).click();
    await page.locator('[data-preparo-entrada="especializacao:cmb_assumir_postura"]:visible').first().click();
    const preparo = page.locator('[data-preparo-grupo]');
    await preparo.getByRole("radiogroup", { name: "Postura", exact: true }).getByRole("radio", { name: "Terra", exact: true }).click();
    await preparo.getByRole("radiogroup", { name: "Postura · Segunda", exact: true }).getByRole("radio", { name: "Sol", exact: true }).click();
    assert.equal((await le()).usos["hab:cmb_assumir_postura"] ?? 0, 0);
    await preparo.getByRole("button", { name: "Confirmar Ativação", exact: true }).click();
   } else {
    el = await abre(false);
    await el.getByRole("combobox", { name: "Postura para Assumir", exact: true }).selectOption("terra"); await el.getByRole("combobox", { name: "Segunda Postura para Assumir" }).selectOption("sol"); await el.getByRole("button", { name: "Entrar em Postura", exact: true }).click();
   }
   await page.waitForFunction(encontro => { const s = encontro ? JSON.parse(localStorage.getItem("afty_encontros_v1"))[0].combatentes[0].sessao : JSON.parse(localStorage.getItem("fm_ficha_sessao_afty_v1:CX3 Posturas")); return s.uso.ativos.cmb_assumir_postura?.duracao.restantes === 10; }, encontro);
   let salva = await le(); assert.equal(salva.combate.postura, "terra"); assert.equal(salva.combate.postura2, "sol"); assert.equal(salva.usos["hab:cmb_assumir_postura"], 1); assert.equal(salva.uso.acoes.gastas.bonus, 1); assert.equal(salva.peAtual, antes.peAtual);
   if (!previa) await el.scrollIntoViewIfNeeded(); assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)); await page.screenshot({ path: `.audit/cx3-20261102/${sistema}-${largura}-posturas${encontro ? "-encontro" : previa ? "-g2" : ""}.png` });
   const avanca = async esperado => {
    await page.getByRole("button", { name: encontro ? "Nova Rodada" : "Próxima rodada", exact: true }).click();
    await page.waitForFunction(({ encontro, esperado }) => { const s = encontro ? JSON.parse(localStorage.getItem("afty_encontros_v1"))[0].combatentes[0].sessao : JSON.parse(localStorage.getItem("fm_ficha_sessao_afty_v1:CX3 Posturas")); return esperado === 0 ? !s.uso.ativos.cmb_assumir_postura : s.uso.ativos.cmb_assumir_postura?.duracao.restantes === esperado; }, { encontro, esperado });
   };
   if (previa && await page.locator('.f-acesso').getAttribute('aria-pressed') === 'true') await page.locator('.f-acesso').click();
   await avanca(9); el = await abre(previa); await el.getByRole("combobox", { name: "Postura para Assumir", exact: true }).selectOption("fortuna"); await el.getByRole("combobox", { name: "Segunda Postura para Assumir" }).selectOption(""); await el.getByRole("button", { name: "Trocar Postura", exact: true }).click();
   await page.waitForFunction(encontro => { const s = encontro ? JSON.parse(localStorage.getItem("afty_encontros_v1"))[0].combatentes[0].sessao : JSON.parse(localStorage.getItem("fm_ficha_sessao_afty_v1:CX3 Posturas")); return s.usos["hab:cmb_assumir_postura"] === 2; }, encontro);
   salva = await le(); assert.equal(salva.combate.postura, "fortuna"); assert.equal(salva.combate.postura2, null); assert.equal(salva.uso.ativos.cmb_assumir_postura.duracao.restantes, 10);
   await page.reload({ waitUntil: "networkidle" }); if (!encontro) await page.getByText(c.name, { exact: true }).click(); else { await page.getByRole("button", { name: "Encontros", exact: true }).click(); await page.getByText(e.nome, { exact: true }).click(); if (largura === 390) await focoEncontro(); }
   salva = await le(); assert.equal(salva.combate.postura, "fortuna"); assert.equal(salva.usos["hab:cmb_assumir_postura"], 2);
   for (let resto = 9; resto >= 0; resto--) await avanca(resto);
   salva = await le(); assert.equal(salva.combate.postura, null); assert.equal(salva.combate.postura2, null); assert.equal(salva.usos["hab:cmb_assumir_postura"], 2);
   el = await abre(previa); assert.equal(await el.getByRole("button", { name: "Rerrolar D20", exact: true }).isDisabled(), true);
  };
  await page.goto(`http://127.0.0.1:5193/${sistema}${g2 ? "?ficha-g2=1" : ""}`, { waitUntil: "networkidle" }); await page.getByText(c.name, { exact: true }).click(); await exercita(false, g2);
  if (!g2) {
   await page.getByRole("button", { name: "Voltar", exact: true }).click(); await page.getByRole("button", { name: "Encontros", exact: true }).click(); await page.getByText(e.nome, { exact: true }).click(); await page.getByRole("button", { name: "Começar", exact: true }).click();
   if (largura === 390) await focoEncontro();
   await exercita(true, false);
  }
  assert.deepEqual(erros, []); resultados.push({ sistema, largura, g2, entrada: true, duasPosturas: true, contador: true, troca: true, prazo: true, persistencia: true, encontro: !g2, erros }); console.log(`${sistema} ${largura} ${g2 ? "G2" : "clássica/Encontro"}: aprovado`); await ctx.close();
 }
} finally { await writeFile(".audit/cx3-20261102/browser-posturas-resultados.json", JSON.stringify(resultados, null, 2)); await browser.close(); }
