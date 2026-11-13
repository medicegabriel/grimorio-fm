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
aplicarAddons([]);
const browser = await chromium.launch({ channel: "chrome", ignoreDefaultArgs: ["--hide-scrollbars"] }), resultados = [];
try {
 for (const sistema of ["player", "afty"]) for (const largura of [1440, 390]) {
  const c = createBlankAfty(); c.id = "CX3 Renovação"; c.name = c.id; c.rulesVersion = sistema; c.core.nd = 12; c.attrMethod = "fixos";
  c.attributes = { forca: 14, destreza: 12, constituicao: 13, inteligencia: 10, sabedoria: 15, presenca: 8 }; c.core.origem = { id: "inato", bonusAtributos: { forca: 2, sabedoria: 1 } };
  c.especializacoes = [{ id: "combatente", nivel: 12 }]; c.pericias = { atletismo: "treinado", feiticaria: "treinado" }; c.habilidadesGerais = sistema === "afty" ? ["ger_especializacao"] : []; c.habilidades = sistema === "afty" ? ["cmb_renovacao_pelo_sangue"] : [];
  const alvo = structuredClone(c); alvo.id = "CX3 Inimigo"; alvo.name = alvo.id;
  const d = deriveAfty(c), linha = d.dano.entradas.find((l) => l.id === "basico"); assert.deepEqual(d.habilidades.inacessiveis, []); assert.equal(d.habilidades.excedeu, false);
  const ataque = rolarTeste({ rotulo: linha.nome, tipoTeste: "ataque", bonus: linha.acerto, margem: linha.margemCritico, linhaArma: linha }, () => 0.999);
  const dano = rolarDano({ rotulo: linha.nome, grupos: linha.gruposDano, critico: true, linhaArma: linha }, () => 0.5);
  const encontro = criarEncontro({ nome: "CX3 Recuperação de Energia" }); encontro.combatentes = [c, alvo].map((f) => criarCombatente(f, { derived: deriveAfty(f) }));
  encontro.combatentes[0].sessao = { ...S.registraRolagem(S.registraRolagem(encontro.combatentes[0].sessao, ataque), dano), peAtual: d.pe - 5 };
  encontro.combatentes[1].sessao.hpAtual = 1;
  const ctx = await browser.newContext({ viewport: { width: largura, height: 1000 }, isMobile: largura === 390, hasTouch: largura === 390 });
  await ctx.addInitScript(({ encontro }) => { if (localStorage.getItem("cx3-renovacao")) return; localStorage.setItem("cx3-renovacao", "1"); localStorage.setItem("afty_encontros_v1", JSON.stringify([encontro])); }, { encontro });
  const page = await ctx.newPage(), erros = []; page.on("pageerror", (e) => erros.push(e.message));
  await page.goto(`http://127.0.0.1:5193/${sistema}`, { waitUntil: "networkidle" }); await page.getByRole("button", { name: "Encontros", exact: true }).click(); await page.getByText(encontro.nome, { exact: true }).click(); await page.getByRole("button", { name: "Rolar Tudo", exact: true }).click(); await page.getByRole("button", { name: "Começar", exact: true }).click();
  if (largura === 390) await page.getByRole("button", { name: "Iniciativa", exact: true }).click(); for (const candidato of await page.getByText(c.name, { exact: true }).all()) if (await candidato.isVisible()) { await candidato.click(); break; }
  await page.getByRole("combobox", { name: "Ataque a Confirmar" }).selectOption(ataque.id); await page.getByRole("combobox", { name: "Alvo do Ataque" }).selectOption(encontro.combatentes[1].id); await page.getByRole("combobox", { name: "Dano do Ataque" }).selectOption(dano.id); await page.getByRole("button", { name: "Confirmar Ataque e Aplicar Dano", exact: true }).click();
  await page.waitForFunction(() => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0].combatentes[0].sessao.log.some((r) => r.energiaRecuperada === 1));
  const mesa = await page.evaluate(() => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0]), registro = mesa.combatentes[0].sessao.log.find((r) => r.energiaRecuperada === 1);
  assert.equal(mesa.combatentes[0].sessao.peAtual, d.pe - 4); assert.equal(registro.abateu, true); assert.equal(registro.ataque.critico, true); assert.equal(registro.fontes[0].label, "Renovação pelo Sangue");
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)); await page.screenshot({ path: `.audit/cx3-20261102/${sistema}-${largura}-renovacao-encontro.png` });
  await page.reload({ waitUntil: "networkidle" }); const relida = await page.evaluate(() => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0]); assert.equal(relida.combatentes[0].sessao.peAtual, d.pe - 4); assert.equal(relida.combatentes[0].sessao.log.find((r) => r.energiaRecuperada === 1).fontes[0].label, "Renovação pelo Sangue"); assert.deepEqual(erros, []);
  resultados.push({ sistema, largura, criticoEAbate: true, recuperouUm: true, fonte: true, persistencia: true, erros }); console.log(`${sistema} ${largura}: aprovado`); await ctx.close();
 }
} finally { await writeFile(".audit/cx3-20261102/browser-renovacao-resultados.json", JSON.stringify(resultados, null, 2)); await browser.close(); }
