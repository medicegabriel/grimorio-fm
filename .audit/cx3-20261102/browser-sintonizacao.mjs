import { register } from "node:module";
register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}', import.meta.url);
import { chromium } from "playwright";
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
const R = new URL("../../src/systems/afty/", import.meta.url);
const { deriveAfty } = await import(new URL("afty-derive.js", R));
const { createBlankAfty } = await import(new URL("afty-schema.js", R));
const { aplicarAddons } = await import(new URL("afty-addons.js", R));
const { usaCuraConteudo } = await import(new URL("ficha/ficha-conteudo-uso.js", R));
const S = await import(new URL("ficha/ficha-sessao.js", R));
const { criarEncontro, criarCombatente, definirIniciativa } = await import(new URL("encontros/afty-encontro.js", R));
aplicarAddons([]);
function ficha(sistema, id) {
 const c = createBlankAfty(); c.id = id; c.name = id; c.rulesVersion = sistema; c.core.nd = 6; c.attrMethod = "fixos";
 c.attributes = { forca: 14, destreza: 12, constituicao: 13, inteligencia: 10, sabedoria: 15, presenca: 8 };
 c.core.origem = { id: "inato", bonusAtributos: { forca: 2, sabedoria: 1 } }; c.especializacoes = [{ id: "suporte", nivel: 6 }];
 c.habilidades = ["sup_suporte_em_combate", "sup_sintonizacao_vital"]; c.pericias = { medicina: "treinado", feiticaria: "treinado" };
 c.habilidadesGerais = sistema === "afty" ? ["ger_especializacao"] : []; return c;
}
const browser = await chromium.launch({ channel: "chrome", ignoreDefaultArgs: ["--hide-scrollbars"] }), resultados = [];
try {
 for (const sistema of ["player", "afty"]) for (const largura of [1440, 390]) for (const g2 of [false, true]) {
  const c = ficha(sistema, "CX3 Sintonização"), ca = ficha(sistema, "CX3 Primeiro Aliado"), cb = ficha(sistema, "CX3 Segundo Destinatário"), d = deriveAfty(c), da = deriveAfty(ca);
  const inicio = d => ({ ...S.iniciaTurnoFicha(S.iniciaCombate(S.sessaoEmBranco(d), d), d), rodada: 1 });
  const antes = { ...inicio(d), hpAtual: d.hp - 20 }, sa = { ...inicio(da), hpAtual: da.hp - 6 }; let i = 0;
  const cura = usaCuraConteudo(antes, d, { id: "cura_suporte_em_combate", alvoId: ca.id, aliado: true, rng: () => [0.6, 0.7][i++] }, { opId: "cura-inicial", registraAcao: true }, { sessao: sa, derived: da });
  assert.equal(cura.aplicado, true); assert.equal(cura.cura, 20);
  const s = cura.sessao, encontro = criarEncontro({ nome: "CX3 Sintonização no Encontro" });
  encontro.combatentes = [c, ca, cb].map((f, i) => definirIniciativa(criarCombatente(f, { derived: deriveAfty(f) }), 20 - i * 5));
  encontro.combatentes[0].sessao.hpAtual = d.hp - 20; encontro.combatentes[1].sessao.hpAtual = da.hp - 6; encontro.combatentes[2].sessao.hpAtual = 1;
  const ctx = await browser.newContext({ viewport: { width: largura, height: 1000 }, isMobile: largura === 390, hasTouch: largura === 390 });
  await ctx.addInitScript(({ sistema, c, s, encontro }) => { if (localStorage.getItem("cx3-sintonizacao")) return; localStorage.setItem("cx3-sintonizacao", "1"); localStorage.setItem(`fm_creatures_${sistema}_v1`, JSON.stringify([c])); localStorage.setItem(`fm_ficha_sessao_afty_v1:${c.id}`, JSON.stringify(s)); localStorage.setItem("afty_encontros_v1", JSON.stringify([encontro])); }, { sistema, c, s, encontro });
  const page = await ctx.newPage(), erros = []; page.on("pageerror", e => erros.push(e.message));
  const abre = async (nome, id, previa = false) => {
   await page.getByRole("tab", { name: "Habilidades", exact: true }).click();
   if (previa) { await page.getByRole("button", { name: `${nome}. Consultar a regra`, exact: true }).click(); return page.getByRole("dialog", { name: `Consulta: ${nome}`, exact: true }); }
   const el = page.locator(`[id="afty-item-especializacao:${id}"]`), b = el.getByRole("button", { name: nome, exact: true }); if (await b.getAttribute("aria-expanded") !== "true") await b.click(); return el;
  };
  await page.goto(`http://127.0.0.1:5193/${sistema}${g2 ? "?ficha-g2=1" : ""}`, { waitUntil: "networkidle" }); await page.getByText(c.name, { exact: true }).click();
  let el = await abre("Sintonização Vital", "sup_sintonizacao_vital", g2);
  await el.getByRole("combobox", { name: "Cura Original da Sintonização" }).selectOption(cura.rolagem.id); await el.getByText("Destinatário em 3m", { exact: true }).click(); await el.getByText("Descontar PE", { exact: true }).click(); await el.getByRole("button", { name: "Aplicar Sintonização", exact: true }).click();
  await page.waitForFunction(() => JSON.parse(localStorage.getItem("fm_ficha_sessao_afty_v1:CX3 Sintonização")).log.some(r => r.rotulo === "Sintonização Vital"));
  const salva = await page.evaluate(() => JSON.parse(localStorage.getItem("fm_ficha_sessao_afty_v1:CX3 Sintonização")));
  assert.equal(salva.hpAtual, s.hpAtual + 10); assert.equal(salva.peAtual, s.peAtual - 3); assert.deepEqual(salva.uso.acoes, s.uso.acoes); assert.equal(await el.getByRole("button", { name: "Aplicar Sintonização", exact: true }).isDisabled(), true);
  await el.scrollIntoViewIfNeeded(); assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)); await page.screenshot({ path: `.audit/cx3-20261102/${sistema}-${largura}-sintonizacao${g2 ? "-g2" : ""}.png` });
  await page.reload({ waitUntil: "networkidle" }); await page.getByText(c.name, { exact: true }).click(); el = await abre("Sintonização Vital", "sup_sintonizacao_vital", g2); assert.equal(await el.getByRole("combobox", { name: "Cura Original da Sintonização" }).locator("option").count(), 1);
  if (!g2) {
   await page.getByRole("button", { name: "Voltar", exact: true }).click(); await page.getByRole("button", { name: "Encontros", exact: true }).click(); await page.getByText(encontro.nome, { exact: true }).click(); await page.getByRole("button", { name: "Começar", exact: true }).click();
   if (largura === 390) await page.getByRole("button", { name: "Iniciativa", exact: true }).click(); for (const b of await page.getByText(c.name, { exact: true }).all()) if (await b.isVisible()) { await b.click(); break; }
   el = await abre("Suporte em Combate", "sup_suporte_em_combate"); await el.getByRole("combobox", { name: "Alvo da Cura" }).selectOption(encontro.combatentes[1].id); await el.getByText("Alvo é Aliado", { exact: true }).click();
   await page.evaluate(() => { globalThis.cx3Random = Math.random; Math.random = () => 0.999; }); try { await el.getByRole("button", { name: "Curar", exact: true }).click(); } finally { await page.evaluate(() => { Math.random = globalThis.cx3Random; delete globalThis.cx3Random; }); }
   await page.waitForFunction(() => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0].combatentes[0].sessao.log.some(r => r.contextoCura?.aliado));
   let mesa = await page.evaluate(() => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0]); const original = mesa.combatentes[0].sessao.log.find(r => r.contextoCura?.aliado), acoes = mesa.combatentes[0].sessao.uso.acoes;
   assert.equal(original.contextoCura.valor, 27); assert.equal(original.contextoCura.recuperado, 6);
   el = await abre("Sintonização Vital", "sup_sintonizacao_vital"); await el.getByRole("combobox", { name: "Cura Original da Sintonização" }).selectOption(original.id);
   assert.equal(await el.getByRole("combobox", { name: "Destinatário da Sintonização" }).locator(`option[value="${encontro.combatentes[1].id}"]`).count(), 0);
   if (largura === 1440) await el.getByRole("combobox", { name: "Destinatário da Sintonização" }).selectOption(encontro.combatentes[2].id);
   await el.getByText("Destinatário em 3m", { exact: true }).click(); await el.getByText("Descontar PE", { exact: true }).click(); await el.getByRole("button", { name: "Aplicar Sintonização", exact: true }).click();
   await page.waitForFunction(() => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0].combatentes[0].sessao.log.some(r => r.rotulo === "Sintonização Vital"));
   mesa = await page.evaluate(() => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0]); const sec = mesa.combatentes[largura === 1440 ? 2 : 0].sessao;
   assert.equal(sec.hpAtual, (largura === 1440 ? 1 : d.hp - 20) + 13); assert.equal(mesa.combatentes[0].sessao.peAtual, d.pe - 3); assert.deepEqual(mesa.combatentes[0].sessao.uso.acoes, acoes); assert.equal(mesa.combatentes[1].sessao.hpAtual, da.hp);
   await el.scrollIntoViewIfNeeded(); assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)); await page.screenshot({ path: `.audit/cx3-20261102/${sistema}-${largura}-sintonizacao-encontro.png` });
   await page.reload({ waitUntil: "networkidle" }); const lida = await page.evaluate(() => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0]); assert.equal(lida.combatentes[largura === 1440 ? 2 : 0].sessao.hpAtual, sec.hpAtual); assert.deepEqual(lida.combatentes[0].sessao.uso.acoes, acoes);
  }
  assert.deepEqual(erros, []); resultados.push({ sistema, largura, g2, metadeAntesDoTeto: true, semOutraAcao: true, custo: true, persistencia: true, encontro: !g2, erros }); console.log(`${sistema} ${largura} ${g2 ? "G2" : "clássica/Encontro"}: aprovado`); await ctx.close();
 }
} finally { await writeFile(".audit/cx3-20261102/browser-sintonizacao-resultados.json", JSON.stringify(resultados, null, 2)); await browser.close(); }
