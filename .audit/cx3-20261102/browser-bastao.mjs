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
const { rolarTeste } = await import(new URL("ficha/ficha-rolagem.js", R));
const { usa } = await import(new URL("ficha/ficha-uso.js", R));
const { criarEncontro, criarCombatente } = await import(new URL("encontros/afty-encontro.js", R));
aplicarAddons([]);
const browser = await chromium.launch({ channel: "chrome", ignoreDefaultArgs: ["--hide-scrollbars"] }), resultados = [];
try {
 for (const sistema of ["player", "afty"]) for (const largura of [1440, 390]) {
  const c = createBlankAfty(); c.id = "CX3 Bastão"; c.name = c.id; c.rulesVersion = sistema; c.core.nd = 20; c.attrMethod = "fixos";
  c.attributes = { forca: 15, destreza: 14, constituicao: 13, inteligencia: 10, sabedoria: 12, presenca: 8 }; c.core.origem = { id: "inato", bonusAtributos: { forca: 2, destreza: 1 } };
  c.especializacoes = [{ id: "combatente", nivel: 20 }]; c.pericias = { atletismo: "treinado", feiticaria: "treinado" }; c.habilidadesGerais = sistema === "afty" ? ["ger_especializacao"] : [];
  c.talentos = ["tal_mestre_das_armas"]; c.escolhasTalento = { tal_mestre_das_armas: ["tal_mestre_armas_forca"] }; c.talentosConfig.tal_mestre_das_armas = { modo: "grupo", grupo: "bastao" };
  c.equipamentos.itens = [{ uid: "bastao", tipo: "arma", refId: "arm_bastao", qtd: 1, equipado: true }];
  const alvo = structuredClone(c); alvo.id = "CX3 Alvo do Bastão"; alvo.name = alvo.id; alvo.talentos = []; alvo.equipamentos.itens = [];
  const d = deriveAfty(c), linha = d.dano.entradas.find((l) => l.id === "arm_bastao"), da = deriveAfty(alvo);
  const ataque = rolarTeste({ rotulo: linha.nome, tipoTeste: "ataque", bonus: linha.acerto, margem: linha.margemCritico, linhaArma: linha }, () => 0.999);
  const encontro = criarEncontro({ nome: "CX3 Crítico de Bastão" }); encontro.combatentes = [c, alvo].map((f) => criarCombatente(f, { derived: deriveAfty(f) }));
  encontro.combatentes[0].sessao = S.registraRolagem(encontro.combatentes[0].sessao, ataque);
  encontro.combatentes[1].sessao = usa(encontro.combatentes[1].sessao, da, { id: "foco-bastao", nome: "Foco", duracao: { ate: "cena" }, concentracao: true }, { opId: "foco-bastao" }).sessao;
  const ctx = await browser.newContext({ viewport: { width: largura, height: 1000 }, isMobile: largura === 390, hasTouch: largura === 390 });
  await ctx.addInitScript(({ encontro }) => { if (localStorage.getItem("cx3-bastao")) return; localStorage.setItem("cx3-bastao", "1"); localStorage.setItem("afty_encontros_v1", JSON.stringify([encontro])); }, { encontro });
  const page = await ctx.newPage(), erros = []; page.on("pageerror", (e) => erros.push(e.message));
  await page.goto(`http://127.0.0.1:5193/${sistema}`, { waitUntil: "networkidle" }); await page.getByRole("button", { name: "Encontros", exact: true }).click(); await page.getByText(encontro.nome, { exact: true }).click(); await page.getByRole("button", { name: "Rolar Tudo", exact: true }).click(); await page.getByRole("button", { name: "Começar", exact: true }).click();
  if (largura === 390) await page.getByRole("button", { name: "Iniciativa", exact: true }).click(); for (const candidato of await page.getByText(c.name, { exact: true }).all()) if (await candidato.isVisible()) { await candidato.click(); break; }
  const el = page.getByRole("heading", { name: "Efeito de Crítico", exact: true }).locator("..");
  await el.getByRole("combobox", { name: "Crítico da Arma" }).selectOption(ataque.id); await el.getByRole("combobox", { name: "Alvo do Crítico" }).selectOption(encontro.combatentes[1].id); await el.getByText("Acertou", { exact: true }).click(); await el.getByRole("spinbutton", { name: "Distância do Crítico de Bastão" }).fill("1.5"); await el.getByRole("button", { name: "Aplicar Efeito de Crítico", exact: true }).click();
  await page.waitForFunction(() => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0].combatentes[1].sessao.uso.teste?.causa === "empurrado"); const mesa = await page.evaluate(() => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0]);
  assert.equal(mesa.combatentes[1].sessao.uso.teste.cd, 10 + d.testes.pericias.find((l) => l.id === "atletismo").bonus); assert.equal(mesa.combatentes[1].sessao.uso.concentracao.id, "foco-bastao"); assert.equal(mesa.combatentes[1].sessao.log[0].detalhe, "Movido 1.5m");
  await el.scrollIntoViewIfNeeded(); assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)); await page.screenshot({ path: `.audit/cx3-20261102/${sistema}-${largura}-bastao-encontro.png` });
  await page.reload({ waitUntil: "networkidle" }); const relida = await page.evaluate(() => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0]); assert.equal(relida.combatentes[1].sessao.uso.teste.cd, mesa.combatentes[1].sessao.uso.teste.cd); assert.deepEqual(erros, []);
  resultados.push({ sistema, largura, distanciaEscolhida: 1.5, concentracaoPendente: true, persistencia: true, erros }); console.log(`${sistema} ${largura}: aprovado`); await ctx.close();
 }
} finally { await writeFile(".audit/cx3-20261102/browser-bastao-resultados.json", JSON.stringify(resultados, null, 2)); await browser.close(); }
