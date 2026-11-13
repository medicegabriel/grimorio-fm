import { register } from "node:module";
register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}', import.meta.url);
import { chromium } from "playwright";
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
const R = new URL("../../src/systems/afty/", import.meta.url);
const { deriveAfty } = await import(new URL("afty-derive.js", R));
const { createBlankAfty } = await import(new URL("afty-schema.js", R));
const { aplicarAddons } = await import(new URL("afty-addons.js", R));
const { criarEncontro, criarCombatente, definirIniciativa } = await import(new URL("encontros/afty-encontro.js", R));
aplicarAddons([]);
const browser = await chromium.launch({ channel: "chrome", ignoreDefaultArgs: ["--hide-scrollbars"] }), resultados = [];
try {
 for (const sistema of ["player", "afty"]) for (const largura of [1440, 390]) for (const g2 of [false, true]) {
  const c = createBlankAfty(); c.id = "CX3 Escudo"; c.name = c.id; c.rulesVersion = sistema; c.core.nd = 12; c.attrMethod = "fixos";
  c.attributes = { forca: 15, destreza: 14, constituicao: 13, inteligencia: 10, sabedoria: 12, presenca: 8 }; c.core.origem = { id: "inato", bonusAtributos: { forca: 2, destreza: 1 } };
  c.especializacoes = [{ id: "combatente", nivel: 12 }]; c.pericias = { atletismo: "mestre", feiticaria: "treinado" }; c.habilidadesGerais = sistema === "afty" ? ["ger_especializacao"] : [];
  c.talentos = ["tal_tecnicas_ofensivas_de_escudo", "tal_ataque_infalivel"]; c.equipamentos.itens = [{ uid: "escudo", tipo: "escudo", refId: "esc_medio", qtd: 1, equipado: true }];
  const alvo = structuredClone(c); alvo.id = "CX3 Alvo do Escudo"; alvo.name = alvo.id; alvo.talentos = []; alvo.equipamentos.itens = []; alvo.pericias = { acrobacia: "treinado", feiticaria: "treinado" }; alvo.attributes = { forca: 8, destreza: 13, constituicao: 14, inteligencia: 10, sabedoria: 15, presenca: 12 };
  const d = deriveAfty(c), linha = d.dano.entradas.find((l) => l.id === "basico"); assert.deepEqual(d.talentos.inacessiveis, []); assert.equal(d.habilidades.excedeu, false);
  const encontro = criarEncontro({ nome: "CX3 Técnicas Agressivas de Escudo" }); encontro.combatentes = [c, alvo].map((f, i) => definirIniciativa(criarCombatente(f, { derived: deriveAfty(f) }), i ? 10 : 20));
  const ctx = await browser.newContext({ viewport: { width: largura, height: 1000 }, isMobile: largura === 390, hasTouch: largura === 390 });
  await ctx.addInitScript(({ sistema, c, encontro }) => { if (localStorage.getItem("cx3-escudo")) return; localStorage.setItem("cx3-escudo", "1"); localStorage.setItem(`fm_creatures_${sistema}_v1`, JSON.stringify([c])); localStorage.setItem("afty_encontros_v1", JSON.stringify([encontro])); }, { sistema, c, encontro });
  const page = await ctx.newPage(), erros = []; page.on("pageerror", (e) => erros.push(e.message));
  const rngClique = async (el, n) => { await page.evaluate((n) => { globalThis.cx3Random = Math.random; Math.random = () => n; }, n); try { await el.click(); } finally { await page.evaluate(() => { Math.random = globalThis.cx3Random; delete globalThis.cx3Random; }); } };
  const abre = async (previa = false) => { await page.getByRole("tab", { name: "Habilidades", exact: true }).click(); if (previa) { await page.getByRole("button", { name: "Técnicas Agressivas de Escudo. Consultar a regra", exact: true }).click(); return page.getByRole("dialog", { name: "Consulta: Técnicas Agressivas de Escudo", exact: true }); } const el = page.locator('[id="afty-item-talento:tal_tecnicas_ofensivas_de_escudo"]'); if (await el.getByRole("button", { name: "Técnicas Agressivas de Escudo", exact: true }).getAttribute("aria-expanded") !== "true") await el.getByRole("button", { name: "Técnicas Agressivas de Escudo", exact: true }).click(); return el; };
  await page.goto(`http://127.0.0.1:5193/${sistema}${g2 ? "?ficha-g2=1" : ""}`, { waitUntil: "networkidle" }); await page.getByText(c.name, { exact: true }).click(); let el = await abre(g2);
  assert.equal(await el.getByRole("button", { name: "Rolar Empurrão de Escudo", exact: true }).isDisabled(), true); await el.scrollIntoViewIfNeeded(); assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)); await page.screenshot({ path: `.audit/cx3-20261102/${sistema}-${largura}-escudo${g2 ? "-g2" : ""}.png` });
  if (!g2) {
   await page.getByRole("button", { name: "Voltar", exact: true }).click(); await page.getByRole("button", { name: "Encontros", exact: true }).click(); await page.getByText(encontro.nome, { exact: true }).click(); await page.getByRole("button", { name: "Começar", exact: true }).click();
   if (largura === 390) await page.getByRole("button", { name: "Iniciativa", exact: true }).click(); for (const candidato of await page.getByText(c.name, { exact: true }).all()) if (await candidato.isVisible()) { await candidato.click(); break; }
   await page.getByRole("tab", { name: "Ações", exact: true }).click(); const basico = page.locator('[id="afty-item-dano:basico"]'); await rngClique(basico.getByRole("button", { name: `+${linha.acerto}`, exact: true }), 0);
   await page.waitForFunction(() => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0].combatentes[0].sessao.log.some((r) => r.tipoTeste === "ataque" && r.contextoTurno));
   let mesa = await page.evaluate(() => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0]), ataque = mesa.combatentes[0].sessao.log.find((r) => r.tipoTeste === "ataque"); assert.equal(ataque.sucesso, false); assert.equal(ataque.contextoTurno.turno, mesa.combatentes[0].sessao.uso.acoes.turno); const hpAntes = mesa.combatentes[1].sessao.hpAtual;
   el = await abre(); await el.getByRole("combobox", { name: "Ataque do Gatilho de Escudo" }).selectOption(ataque.id); await el.getByRole("combobox", { name: "Alvo do Empurrão de Escudo" }).selectOption(encontro.combatentes[1].id); await el.getByRole("combobox", { name: "Resistência ao Escudo" }).selectOption("acrobacia"); await el.getByRole("combobox", { name: "Benefício do Empurrão de Escudo" }).selectOption(largura === 1440 ? "caido" : "distancia"); await el.getByText("Alvo no Alcance do Escudo", { exact: true }).click();
   await rngClique(el.getByRole("button", { name: "Rolar Empurrão de Escudo", exact: true }), 0.5); mesa = await page.evaluate(() => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0]); assert.equal(mesa.combatentes[0].sessao.uso.acoes.gastas.bonus, 1); assert.equal(mesa.combatentes[1].sessao.hpAtual, hpAntes); assert.ok(!mesa.combatentes[1].sessao.condicoes.some((c) => c.nome === "Caído"));
   const seu = mesa.combatentes[0].sessao.log.find((r) => r.contextoConteudo?.tipo === "manobraEscudo"), dele = mesa.combatentes[1].sessao.log.find((r) => r.contextoConteudo?.tipo === "manobraEscudo"); const normal = d.testes.manobras.find((m) => m.id === "empurrar").distancia + 1.5 * Math.floor((seu.total - dele.total) / 5);
   let danoEscolhido = null;
   if (largura === 1440) {
    await rngClique(el.getByRole("button", { name: "Rolar Dano do Escudo", exact: true }), 0);
    await page.waitForFunction(() => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0].combatentes[0].sessao.log.some((r) => r.tipo === "dano" && r.armaId === "tal_tecnicas_ofensivas_de_escudo"));
    mesa = await page.evaluate(() => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0]); danoEscolhido = mesa.combatentes[0].sessao.log.find((r) => r.tipo === "dano");
    assert.equal(mesa.combatentes[1].sessao.hpAtual, hpAntes); assert.equal(await el.getByRole("combobox", { name: "Dano Rolado do Escudo" }).inputValue(), danoEscolhido.id);
    const infalivel = page.locator('[id="afty-item-talento:tal_ataque_infalivel"]'); await infalivel.getByRole("button", { name: "Ataque Infalível", exact: true }).click(); assert.equal(await infalivel.getByRole("combobox", { name: "Rolagem para Repetir" }).locator("option").count(), 1);
   }
   await rngClique(el.getByRole("button", { name: "Aplicar Empurrão de Escudo", exact: true }), 0.5); await page.waitForFunction(() => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0].combatentes[0].sessao.log.some((r) => r.rotulo === "Técnicas Agressivas de Escudo"));
   mesa = await page.evaluate(() => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0]); const resultado = mesa.combatentes[0].sessao.log.find((r) => r.rotulo === "Técnicas Agressivas de Escudo"); assert.equal(resultado.resistiu, false); assert.equal(resultado.distancia, normal + (largura === 390 ? 4.5 : 0)); assert.equal(mesa.combatentes[1].sessao.condicoes.some((c) => c.nome === "Caído"), largura === 1440); assert.equal(mesa.combatentes[1].sessao.hpAtual, hpAntes - resultado.calculo.final); assert.equal(mesa.combatentes[0].sessao.log.find((r) => r.tipo === "dano").critico, false);
   if (danoEscolhido) { assert.equal(resultado.calculo.base, danoEscolhido.total); assert.equal(mesa.combatentes[0].sessao.log.filter((r) => r.id === danoEscolhido.id).length, 1); assert.equal(mesa.combatentes[0].sessao.log.find((r) => r.id === danoEscolhido.id).consequenciasAplicadas, true); }
   await el.scrollIntoViewIfNeeded(); assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)); await page.screenshot({ path: `.audit/cx3-20261102/${sistema}-${largura}-escudo-encontro.png` });
   await page.getByRole("button", { name: "Próximo Turno", exact: true }).click();
   if (largura === 390) await page.getByRole("button", { name: "Iniciativa", exact: true }).click(); for (const candidato of await page.getByText(c.name, { exact: true }).all()) if (await candidato.isVisible()) { await candidato.click(); break; }
   el = await abre(); await el.getByRole("combobox", { name: "Ataque do Gatilho de Escudo" }).selectOption(ataque.id); await el.getByRole("combobox", { name: "Alvo do Empurrão de Escudo" }).selectOption(encontro.combatentes[1].id); if (!await el.getByRole("checkbox", { name: "Alvo no Alcance do Escudo", exact: true }).isChecked()) await el.getByRole("checkbox", { name: "Alvo no Alcance do Escudo", exact: true }).check();
   assert.equal(await el.getByRole("button", { name: "Rolar Empurrão de Escudo", exact: true }).isDisabled(), true);
   await page.reload({ waitUntil: "networkidle" }); const relida = await page.evaluate(() => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0]); assert.deepEqual(relida.combatentes[1].sessao.condicoes, mesa.combatentes[1].sessao.condicoes); assert.equal(relida.combatentes[1].sessao.hpAtual, mesa.combatentes[1].sessao.hpAtual);
  }
  assert.deepEqual(erros, []); resultados.push({ sistema, largura, g2, tituloCorreto: true, proprioTurno: !g2, ataquePodeErrar: !g2, disputaSeparada: !g2, distanciaECaido: !g2 && largura === 1440, distanciaAdicional: !g2 && largura === 390, persistencia: !g2, erros }); console.log(`${sistema} ${largura} ${g2 ? "G2" : "clássica/Encontro"}: aprovado`); await ctx.close();
 }
} finally { await writeFile(".audit/cx3-20261102/browser-escudo-resultados.json", JSON.stringify(resultados, null, 2)); await browser.close(); }
