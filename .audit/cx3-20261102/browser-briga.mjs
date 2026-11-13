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
const { rolarTeste, rolarDano } = await import(new URL("ficha/ficha-rolagem.js", R));
const { criarEncontro, criarCombatente } = await import(new URL("encontros/afty-encontro.js", R));
const { usa } = await import(new URL("ficha/ficha-uso.js", R));
aplicarAddons([]);
function ficha(sistema, id, alvo = false) {
 const c = createBlankAfty(); c.id = id; c.name = id; c.rulesVersion = sistema; c.core.nd = 20;
 c.attrMethod = "fixos"; c.attributes = { forca: alvo ? 8 : 15, destreza: alvo ? 13 : 14, constituicao: alvo ? 14 : 13, inteligencia: 10, sabedoria: alvo ? 15 : 12, presenca: 8 };
 c.core.origem = { id: "inato", bonusAtributos: { forca: 2, destreza: 1 } };
 c.especializacoes = [{ id: "combatente", nivel: 20 }]; c.pericias = { atletismo: alvo ? "treinado" : "mestre", feiticaria: "treinado" };
 c.habilidadesGerais = sistema === "afty" ? ["ger_especializacao"] : []; c.talentos = alvo ? [] : ["tal_adepto_de_briga"];
 if (alvo) c.buffsSessao = [{ id: "rd", nome: "Proteção de Teste", canal: "rdGeral", expr: "1000" }];
 return c;
}
const browser = await chromium.launch({ channel: "chrome", ignoreDefaultArgs: ["--hide-scrollbars"] }), resultados = [];
try {
 for (const sistema of ["player", "afty"]) for (const largura of [1440, 390]) for (const g2 of [false, true]) {
  const c = ficha(sistema, "CX3 Briga"), alvo = ficha(sistema, "CX3 Alvo da Briga", true), d = deriveAfty(c), linha = d.dano.entradas.find((l) => l.id === "basico");
  const encontro = criarEncontro({ nome: "CX3 Briga na Mesa" }); encontro.combatentes = [c, alvo].map((f) => criarCombatente(f, { derived: deriveAfty(f) }));
  encontro.combatentes[1].sessao.buffs = alvo.buffsSessao;
  const ataque = rolarTeste({ rotulo: linha.nome, bonus: linha.acerto, margem: linha.margemCritico, tipoTeste: "ataque", linhaArma: linha }, () => 0.999);
  const dano = rolarDano({ rotulo: linha.nome, grupos: linha.gruposDano, critico: true, linhaArma: linha }, () => 0.5);
  encontro.combatentes[0].sessao = S.registraRolagem(S.registraRolagem(encontro.combatentes[0].sessao, ataque), dano);
  encontro.combatentes[1].sessao = usa(encontro.combatentes[1].sessao, deriveAfty(alvo), { id: "foco-briga", nome: "Foco da Briga", duracao: { ate: "cena" }, concentracao: true }, { opId: "foco-briga" }).sessao;
  const ctx = await browser.newContext({ viewport: { width: largura, height: 1000 }, isMobile: largura === 390, hasTouch: largura === 390 });
  await ctx.addInitScript(({ sistema, c, encontro }) => { if (localStorage.getItem("cx3-briga-ui")) return; localStorage.setItem("cx3-briga-ui", "1"); localStorage.setItem(`fm_creatures_${sistema}_v1`, JSON.stringify([c])); localStorage.setItem("afty_encontros_v1", JSON.stringify([encontro])); }, { sistema, c, encontro });
  const page = await ctx.newPage(), erros = []; page.on("pageerror", (e) => erros.push(e.message));
  await page.goto(`http://127.0.0.1:5193/${sistema}${g2 ? "?ficha-g2=1" : ""}`, { waitUntil: "networkidle" }); await page.getByText(c.name, { exact: true }).click(); await page.getByRole("tab", { name: "Habilidades", exact: true }).click();
  let el;
  if (g2) { await page.getByRole("button", { name: "Adepto de Briga. Consultar a regra", exact: true }).click(); el = page.getByRole("dialog", { name: "Consulta: Adepto de Briga", exact: true }); }
  else { el = page.locator('[id="afty-item-talento:tal_adepto_de_briga"]'); await el.getByRole("button", { name: "Adepto de Briga", exact: true }).click(); }
  assert.equal(await el.getByRole("button", { name: "Rolar Manobra de Briga", exact: true }).isDisabled(), true);
  await el.scrollIntoViewIfNeeded(); assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)); await page.screenshot({ path: `.audit/cx3-20261102/${sistema}-${largura}-briga${g2 ? "-g2" : ""}.png` });
  if (!g2) {
   await page.getByRole("button", { name: "Voltar", exact: true }).click(); await page.getByRole("button", { name: "Encontros", exact: true }).click(); await page.getByText(encontro.nome, { exact: true }).click();
   await page.getByRole("button", { name: "Rolar Tudo", exact: true }).click(); await page.getByRole("button", { name: "Começar", exact: true }).click();
   if (largura === 390) await page.getByRole("button", { name: "Iniciativa", exact: true }).click();
   for (const candidato of await page.getByText(c.name, { exact: true }).all()) if (await candidato.isVisible()) { await candidato.click(); break; }
   await page.getByRole("tab", { name: "Ações", exact: true }).click(); await page.getByRole("combobox", { name: "Ataque a Confirmar" }).selectOption(ataque.id); await page.getByRole("combobox", { name: "Dano do Ataque" }).selectOption(dano.id); await page.getByRole("combobox", { name: "Alvo do Ataque" }).selectOption(encontro.combatentes[1].id);
   await page.getByRole("button", { name: "Confirmar Ataque e Aplicar Dano", exact: true }).click();
   await page.waitForFunction(() => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0].combatentes[0].sessao.log.some((r) => r.rotulo === "Ataque Confirmado"));
   let mesa = await page.evaluate(() => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0]); assert.ok(mesa.combatentes[0].sessao.log.find((r) => r.rotulo === "Ataque Confirmado").calculos.every((c) => c.final === 0));
   await page.getByRole("tab", { name: "Habilidades", exact: true }).click(); el = page.locator('[id="afty-item-talento:tal_adepto_de_briga"]'); await el.getByRole("button", { name: "Adepto de Briga", exact: true }).click();
   await el.getByRole("combobox", { name: "Acerto sem Dano de Briga" }).selectOption(ataque.id); await el.getByRole("combobox", { name: "Manobra de Briga" }).selectOption(largura === 390 ? "empurrar" : "derrubar");
   await page.evaluate(() => { globalThis.cx3Random = Math.random; Math.random = () => 0.5; }); try { await el.getByRole("button", { name: "Rolar Manobra de Briga", exact: true }).click(); } finally { await page.evaluate(() => { Math.random = globalThis.cx3Random; delete globalThis.cx3Random; }); }
   mesa = await page.evaluate(() => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0]); assert.ok(!mesa.combatentes[1].sessao.condicoes.some((c) => c.nome === "Caído")); assert.equal(mesa.combatentes[0].sessao.uso.acoes.livres.tal_adepto_de_briga, 1);
   await el.getByRole("button", { name: "Aplicar Manobra de Briga", exact: true }).click(); await page.waitForFunction(() => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0].combatentes[0].sessao.log.some((r) => r.rotulo === "Adepto de Briga"));
   mesa = await page.evaluate(() => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0]); const result = mesa.combatentes[0].sessao.log.find((r) => r.rotulo === "Adepto de Briga"); assert.equal(result.resistiu, false); assert.equal(mesa.combatentes[0].sessao.peAtual, d.pe);
   if (largura === 390) { assert.ok(result.distancia > 0); assert.equal(mesa.combatentes[1].sessao.uso.teste.causa, "empurrado"); assert.equal(mesa.combatentes[1].sessao.uso.teste.cd, 10 + d.testes.pericias.find((l) => l.id === "atletismo").bonus); }
   else assert.ok(mesa.combatentes[1].sessao.condicoes.some((c) => c.nome === "Caído"));
   await el.scrollIntoViewIfNeeded(); assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)); await page.screenshot({ path: `.audit/cx3-20261102/${sistema}-${largura}-briga-encontro.png` });
   await page.reload({ waitUntil: "networkidle" }); const relida = await page.evaluate(() => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0]); assert.deepEqual(relida.combatentes[0].sessao.uso.acoes, mesa.combatentes[0].sessao.uso.acoes); assert.deepEqual(relida.combatentes[1].sessao.condicoes, mesa.combatentes[1].sessao.condicoes);
  }
  assert.deepEqual(erros, []); resultados.push({ sistema, largura, g2, controle: true, gatilhoRealNoEncontro: !g2, disputaSeparada: !g2, persistencia: !g2, erros }); console.log(`${sistema} ${largura} ${g2 ? "G2" : "clássica/Encontro"}: aprovado`); await ctx.close();
 }
} finally { await writeFile(".audit/cx3-20261102/browser-briga-resultados.json", JSON.stringify(resultados, null, 2)); await browser.close(); }
