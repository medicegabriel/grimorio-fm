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
const { aplicaVenenoNoAlvo } = await import(new URL("ficha/ficha-itens-especiais.js", R));
aplicarAddons([]);
const browser = await chromium.launch({ channel: "chrome", ignoreDefaultArgs: ["--hide-scrollbars"] }), resultados = [];
try {
 for (const sistema of ["player", "afty"]) for (const largura of [1440, 390]) for (const g2 of [false, true]) {
  const c = createBlankAfty(); c.id = "CX3 Remoção de Veneno"; c.name = c.id; c.rulesVersion = sistema; c.core.nd = 20;
  c.core.origem = { id: "inato", bonusAtributos: { sabedoria: 2, destreza: 1 } }; c.attrNivel.sabedoria = 3;
  c.attrMethod = "fixos"; c.attributes = { forca: 14, destreza: 12, constituicao: 13, inteligencia: 10, sabedoria: 15, presenca: 8 };
  c.especializacoes = [{ id: "combatente", nivel: 20 }]; c.pericias = { feiticaria: "treinado" }; c.habilidadesGerais = sistema === "afty" ? ["ger_especializacao", "ger_aptidao"] : [];
  c.aptidoes = { cl: 3, er: 5, au: 0, dom: 0, bar: 0 }; c.aptidoesAmaldicoadas = ["energia_reversa", "cura_amplificada", "regeneracao_aprimorada"]; c.treinamentos = { energia_reversa: 3 }; c.focosLivres = 3;
  const d = deriveAfty(c); let s = S.iniciaCombate(S.sessaoEmBranco(d), d);
  for (const itemId of ["it_lagrima_de_shinigami", "it_veneno_maldito"]) s = aplicaVenenoNoAlvo(s, d, { itemId, tr: { sucesso: false }, opId: `veneno-ui:${itemId}`, rng: () => 0 }).sessao;
  const ctx = await browser.newContext({ viewport: { width: largura, height: 1000 }, isMobile: largura === 390, hasTouch: largura === 390 });
  await ctx.addInitScript(({ sistema, c, s }) => { if (localStorage.getItem("cx3-veneno-ui")) return; localStorage.setItem("cx3-veneno-ui", "1"); localStorage.setItem(`fm_creatures_${sistema}_v1`, JSON.stringify([c])); localStorage.setItem(`fm_ficha_sessao_afty_v1:${c.id}`, JSON.stringify(s)); }, { sistema, c, s });
  const page = await ctx.newPage(), erros = []; page.on("pageerror", (e) => erros.push(e.message));
  await page.goto(`http://127.0.0.1:5193/${sistema}${g2 ? "?ficha-g2=1" : ""}`, { waitUntil: "networkidle" }); await page.getByText(c.name, { exact: true }).click(); await page.getByRole("tab", { name: "Habilidades", exact: true }).click();
  let el;
  if (g2) { await page.getByRole("button", { name: "Regeneração Aprimorada. Consultar a regra", exact: true }).click(); el = page.getByRole("dialog", { name: "Consulta: Regeneração Aprimorada", exact: true }); }
  else { el = page.locator('[id="afty-item-aptidao:regeneracao_aprimorada"]'); await el.getByRole("button", { name: "Regeneração Aprimorada", exact: true }).click(); }
  await el.getByRole("combobox", { name: "Uso de Regeneração Aprimorada" }).selectOption("veneno"); await el.getByRole("button", { name: "Usar Regeneração", exact: true }).click(); await el.getByRole("alert").waitFor();
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem("fm_ficha_sessao_afty_v1:CX3 Remoção de Veneno")).peAtual), s.peAtual);
  await el.getByRole("combobox", { name: "Veneno a Remover" }).selectOption("veneno:it_lagrima_de_shinigami"); await el.getByRole("button", { name: "Usar Regeneração", exact: true }).click();
  await page.waitForFunction(() => !JSON.parse(localStorage.getItem("fm_ficha_sessao_afty_v1:CX3 Remoção de Veneno")).uso.ativos["veneno:it_lagrima_de_shinigami"]);
  const salva = await page.evaluate(() => JSON.parse(localStorage.getItem("fm_ficha_sessao_afty_v1:CX3 Remoção de Veneno"))); assert.equal(salva.peAtual, s.peAtual - 8); assert.equal(salva.uso.acoes.gastas.bonus, 1); assert.ok(salva.uso.ativos["veneno:it_veneno_maldito"]);
  assert.deepEqual(salva.condicoes.map((c) => c.nome).sort(), ["Envenenado", "Exposto"]); assert.equal(salva.buffs.some((b) => b.canal === "defesa" && b.expr === "-4"), false);
  await el.scrollIntoViewIfNeeded(); assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)); await page.screenshot({ path: `.audit/cx3-20261102/${sistema}-${largura}-veneno${g2 ? "-g2" : ""}.png` });
  await page.reload({ waitUntil: "networkidle" }); await page.getByText(c.name, { exact: true }).click(); const relida = await page.evaluate(() => JSON.parse(localStorage.getItem("fm_ficha_sessao_afty_v1:CX3 Remoção de Veneno"))); assert.equal(relida.peAtual, salva.peAtual); assert.ok(!relida.uso.ativos["veneno:it_lagrima_de_shinigami"]); assert.ok(relida.uso.ativos["veneno:it_veneno_maldito"]);
  assert.deepEqual(erros, []); resultados.push({ sistema, largura, g2, venenoEscolhido: true, custoQuatroPER: true, outroVenenoPreservado: true, persistencia: true, erros }); console.log(`${sistema} ${largura} ${g2 ? "G2" : "clássica"}: aprovado`); await ctx.close();
 }
} finally { await writeFile(".audit/cx3-20261102/browser-venenos-resultados.json", JSON.stringify(resultados, null, 2)); await browser.close(); }
