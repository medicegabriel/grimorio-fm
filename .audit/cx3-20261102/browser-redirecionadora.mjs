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
 const c = createBlankAfty(); c.id = id; c.name = id; c.rulesVersion = sistema; c.core.nd = 12; c.attrMethod = "fixos";
 c.attributes = { forca: 14, destreza: 15, constituicao: 13, inteligencia: 10, sabedoria: 12, presenca: 8 };
 c.core.origem = { id: "inato", bonusAtributos: { forca: 1, destreza: 2 } }; c.especializacoes = [{ id: "combatente", nivel: 12 }];
 c.pericias = { pontaria: "treinado", feiticaria: "treinado" }; c.ataquesProf = { corpo: true, distancia: true };
 c.aptidoes = { au: 3, cl: 0, er: 0, bar: 0, dom: 0 }; c.aptidoesAmaldicoadas = ["aura_redirecionadora"];
 c.habilidadesGerais = sistema === "afty" ? ["ger_especializacao", "ger_aptidao"] : [];
 c.equipamentos.itens = [{ uid: "arma", tipo: "arma", refId: "arm_pistola", qtd: 1, equipado: true }]; return c;
}
const browser = await chromium.launch({ channel: "chrome", ignoreDefaultArgs: ["--hide-scrollbars"] }), resultados = [];
try {
 for (const sistema of ["player", "afty"]) for (const largura of [1440, 390]) for (const g2 of [false, true]) {
  const c = ficha(sistema, "CX3 Redirecionadora"), ca = ficha(sistema, "CX3 Primeiro Alvo"), cb = ficha(sistema, "CX3 Segundo Alvo"), d = deriveAfty(c);
  const s = { ...S.iniciaTurnoFicha(S.iniciaCombate(S.sessaoEmBranco(d), d), d), rodada: 1 }, encontro = criarEncontro({ nome: "CX3 Aura na Mesa" });
  encontro.combatentes = [c, ca, cb].map((f, i) => definirIniciativa(criarCombatente(f, { derived: deriveAfty(f) }), 20 - i * 5));
  const ctx = await browser.newContext({ viewport: { width: largura, height: 1000 }, isMobile: largura === 390, hasTouch: largura === 390 });
  await ctx.addInitScript(({ sistema, c, s, encontro }) => { if (localStorage.getItem("cx3-redirecionadora")) return; localStorage.setItem("cx3-redirecionadora", "1"); localStorage.setItem(`fm_creatures_${sistema}_v1`, JSON.stringify([c])); localStorage.setItem(`fm_ficha_sessao_afty_v1:${c.id}`, JSON.stringify(s)); localStorage.setItem("afty_encontros_v1", JSON.stringify([encontro])); }, { sistema, c, s, encontro });
  const page = await ctx.newPage(), erros = []; page.on("pageerror", e => erros.push(e.message));
  const vicia = async (el, valor) => { await page.evaluate(v => { globalThis.cx3Random = Math.random; Math.random = () => v; }, valor); try { await el.click(); } finally { await page.evaluate(() => { Math.random = globalThis.cx3Random; delete globalThis.cx3Random; }); } };
  const abre = async (previa = false) => { await page.getByRole("tab", { name: "Habilidades", exact: true }).click(); if (previa) { await page.getByRole("button", { name: "Aura Redirecionadora. Consultar a regra", exact: true }).click(); return page.getByRole("dialog", { name: "Consulta: Aura Redirecionadora", exact: true }); } const el = page.locator('[id="afty-item-aptidao:aura_redirecionadora"]'), b = el.getByRole("button", { name: "Aura Redirecionadora", exact: true }); if (await b.getAttribute("aria-expanded") !== "true") await b.click(); return el; };
  const preparar = async (el, alvo = null) => { await el.getByRole("combobox", { name: "Arma da Aura Redirecionadora" }).selectOption("0"); if (alvo) await el.getByRole("combobox", { name: "Primeiro Alvo da Aura" }).selectOption(alvo); await el.getByText("Descontar PE", { exact: true }).click(); await vicia(el.getByRole("button", { name: "Imbuir e Atacar", exact: true }), 0); };
  await page.goto(`http://127.0.0.1:5193/${sistema}${g2 ? "?ficha-g2=1" : ""}`, { waitUntil: "networkidle" }); await page.getByText(c.name, { exact: true }).click(); let el = await abre(g2); await preparar(el);
  await page.waitForFunction(() => JSON.parse(localStorage.getItem("fm_ficha_sessao_afty_v1:CX3 Redirecionadora")).log.some(r => r.contextoConteudo?.tipo === "auraRedirecionadora"));
  const salva = await page.evaluate(() => JSON.parse(localStorage.getItem("fm_ficha_sessao_afty_v1:CX3 Redirecionadora")));
  const primeiraArma = Object.values(salva.propriedadesArmas.porArma)[0]; assert.equal(salva.peAtual, s.peAtual - 2); assert.deepEqual(salva.uso.acoes, s.uso.acoes); assert.equal(primeiraArma.gastos, 1); assert.equal(primeiraArma.emperrada, true);
  await el.scrollIntoViewIfNeeded(); assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)); await page.screenshot({ path: `.audit/cx3-20261102/${sistema}-${largura}-redirecionadora${g2 ? "-g2" : ""}.png` });
  await page.reload({ waitUntil: "networkidle" }); assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem("fm_ficha_sessao_afty_v1:CX3 Redirecionadora")).peAtual), salva.peAtual);
  if (!g2) {
   await page.getByRole("button", { name: "Encontros", exact: true }).click(); await page.getByText(encontro.nome, { exact: true }).click(); await page.getByRole("button", { name: "Começar", exact: true }).click();
   if (largura === 390) await page.getByRole("button", { name: "Iniciativa", exact: true }).click(); for (const b of await page.getByText(c.name, { exact: true }).all()) if (await b.isVisible()) { await b.click(); break; }
   el = await abre(); await preparar(el, encontro.combatentes[1].id);
   await page.waitForFunction(() => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0].combatentes[0].sessao.log.some(r => r.contextoConteudo?.etapa === "inicial"));
   let mesa = await page.evaluate(() => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0]), r1 = mesa.combatentes[0].sessao.log.find(r => r.contextoConteudo?.etapa === "inicial");
   const confirma = async (ataque, danoId, alvo) => { await page.getByRole("tab", { name: "Ações", exact: true }).click(); await page.getByRole("combobox", { name: "Ataque a Confirmar" }).selectOption(ataque); if (danoId) await page.getByRole("combobox", { name: "Dano do Ataque" }).selectOption(danoId); await page.getByRole("combobox", { name: "Alvo do Ataque" }).selectOption(alvo); await page.getByRole("button", { name: "Confirmar Ataque e Aplicar Dano", exact: true }).click(); await page.waitForFunction(id => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0].combatentes[0].sessao.log.some(r => r.rotulo === "Ataque Confirmado" && r.ataqueId === id), ataque); };
   await confirma(r1.id, null, encontro.combatentes[1].id);
   mesa = await page.evaluate(() => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0]); const falhaA = mesa.combatentes[0].sessao.log.find(r => r.rotulo === "Ataque Confirmado"); assert.equal(falhaA.ataque.desastre, true); assert.equal(mesa.combatentes[1].sessao.uso.sequencia.ataques, 1); const acoes = mesa.combatentes[0].sessao.uso.acoes;
   el = await abre(); await el.getByRole("combobox", { name: "Primeira Falha da Aura" }).selectOption(r1.id); await el.getByRole("combobox", { name: "Segundo Alvo da Aura" }).selectOption(encontro.combatentes[2].id); await el.getByText("Segundo Alvo em 6m do Primeiro", { exact: true }).click(); await vicia(el.getByRole("button", { name: "Redirecionar Projétil", exact: true }), 0.999);
   await page.waitForFunction(() => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0].combatentes[0].sessao.log.some(r => r.contextoConteudo?.etapa === "redirecionado"));
   mesa = await page.evaluate(() => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0]); const r2 = mesa.combatentes[0].sessao.log.find(r => r.contextoConteudo?.etapa === "redirecionado"); assert.equal(r2.bonus - r1.bonus, 2); assert.equal(r2.natural, 20);
   await vicia(el.getByRole("button", { name: "Rolar Dano Redirecionado", exact: true }), 0.5);
   await page.waitForFunction(() => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0].combatentes[0].sessao.log.some(r => r.tipo === "dano"));
   mesa = await page.evaluate(() => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0]); const dano = mesa.combatentes[0].sessao.log.find(r => r.tipo === "dano"); assert.equal(dano.critico, true);
   await confirma(r2.id, dano.id, encontro.combatentes[2].id);
   mesa = await page.evaluate(() => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0]); const arma = Object.values(mesa.combatentes[0].sessao.propriedadesArmas.porArma)[0];
   assert.equal(arma.ataques, 1); assert.equal(arma.gastos, 1); assert.equal(arma.emperrada, true); assert.equal(mesa.combatentes[0].sessao.peAtual, d.pe - 2 + (sistema === "player" ? 1 : 0)); assert.deepEqual(mesa.combatentes[0].sessao.uso.acoes, acoes); assert.equal(mesa.combatentes[1].sessao.uso.sequencia.ataques, 1); assert.equal(mesa.combatentes[2].sessao.uso.sequencia.ataques, 1); assert.deepEqual(mesa.combatentes[0].sessao.log.find(r => r.id === falhaA.id), falhaA);
   await page.screenshot({ path: `.audit/cx3-20261102/${sistema}-${largura}-redirecionadora-encontro.png` }); assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
   await page.reload({ waitUntil: "networkidle" }); const lida = await page.evaluate(() => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0]); assert.equal(lida.combatentes[0].sessao.log.filter(r => r.rotulo === "Ataque Confirmado").length, 2); assert.equal(Object.values(lida.combatentes[0].sessao.propriedadesArmas.porArma)[0].gastos, 1);
  }
  assert.deepEqual(erros, []); resultados.push({ sistema, largura, g2, preparoSemOutraAcao: true, muniçãoUnica: true, falhaMantida: !g2, segundoAlvo: !g2, persistencia: true, erros }); console.log(`${sistema} ${largura} ${g2 ? "G2" : "clássica/Encontro"}: aprovado`); await ctx.close();
 }
} finally { await writeFile(".audit/cx3-20261102/browser-redirecionadora-resultados.json", JSON.stringify(resultados, null, 2)); await browser.close(); }
