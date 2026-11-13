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
function ficha(sistema, id, sentinela = false) {
 const c = createBlankAfty(); c.id = id; c.name = id; c.rulesVersion = sistema; c.core.nd = 12; c.attrMethod = "fixos";
 c.attributes = { forca: 15, destreza: 14, constituicao: 13, inteligencia: 10, sabedoria: 12, presenca: 8 }; c.core.origem = { id: "inato", bonusAtributos: { forca: 2, destreza: 1 } };
 c.especializacoes = [{ id: "combatente", nivel: 12 }]; c.pericias = { atletismo: "treinado", feiticaria: "treinado" }; c.habilidadesGerais = sistema === "afty" ? ["ger_especializacao"] : [];
 c.talentos = sentinela ? ["tal_tecnicas_do_sentinela"] : []; return c;
}
const browser = await chromium.launch({ channel: "chrome", ignoreDefaultArgs: ["--hide-scrollbars"] }), resultados = [];
try {
 for (const sistema of ["player", "afty"]) for (const largura of [1440, 390]) for (const g2 of [false, true]) {
  const c = ficha(sistema, "CX3 Sentinela", true), ca = ficha(sistema, "CX3 Atacante"), ct = ficha(sistema, "CX3 Terceiro"), d = deriveAfty(c);
  assert.deepEqual(d.talentos.inacessiveis, []); assert.equal(d.habilidades.excedeu, false);
  const s = S.iniciaCombate(S.sessaoEmBranco(d), d), encontros = ["Oportunidade", "Reação"].map((nome) => {
   const e = criarEncontro({ nome: `CX3 Sentinela: ${nome}` }); e.combatentes = [ca, c, ct].map((f, i) => definirIniciativa(criarCombatente(f, { derived: deriveAfty(f) }), 30 - i * 10)); return e;
  });
  const ctx = await browser.newContext({ viewport: { width: largura, height: 1000 }, isMobile: largura === 390, hasTouch: largura === 390 });
  await ctx.addInitScript(({ sistema, c, s, encontros }) => { if (localStorage.getItem("cx3-sentinela")) return; localStorage.setItem("cx3-sentinela", "1"); localStorage.setItem(`fm_creatures_${sistema}_v1`, JSON.stringify([c])); localStorage.setItem(`fm_ficha_sessao_afty_v1:${c.id}`, JSON.stringify(s)); localStorage.setItem("afty_encontros_v1", JSON.stringify(encontros)); }, { sistema, c, s, encontros });
  const page = await ctx.newPage(), erros = []; page.on("pageerror", (e) => erros.push(e.message));
  const rngClique = async (el, n) => { await page.evaluate((n) => { globalThis.cx3Random = Math.random; Math.random = () => n; }, n); try { await el.click(); } finally { await page.evaluate(() => { Math.random = globalThis.cx3Random; delete globalThis.cx3Random; }); } };
  const abre = async (previa = false) => { await page.getByRole("tab", { name: "Habilidades", exact: true }).click(); if (previa) { await page.getByRole("button", { name: "Técnicas do Sentinela. Consultar a regra", exact: true }).click(); return page.getByRole("dialog", { name: "Consulta: Técnicas do Sentinela", exact: true }); } const el = page.locator('[id="afty-item-talento:tal_tecnicas_do_sentinela"]'); const b = el.getByRole("button", { name: "Técnicas do Sentinela", exact: true }); if (await b.getAttribute("aria-expanded") !== "true") await b.click(); return el; };
  const escolheGO = async (el, alvoId = null) => { await el.getByRole("combobox", { name: "Arma do Golpe de Oportunidade" }).selectOption("0"); if (alvoId) await el.getByRole("combobox", { name: "Alvo do Golpe de Oportunidade" }).selectOption(alvoId); await el.getByRole("checkbox", { name: "Gatilho de Oportunidade", exact: true }).check(); await rngClique(el.getByRole("button", { name: "Rolar Golpe de Oportunidade", exact: true }), 0.8); };
  await page.goto(`http://127.0.0.1:5193/${sistema}${g2 ? "?ficha-g2=1" : ""}`, { waitUntil: "networkidle" }); await page.getByText(c.name, { exact: true }).click(); let el = await abre(g2); await escolheGO(el);
  await page.waitForFunction(() => JSON.parse(localStorage.getItem("fm_ficha_sessao_afty_v1:CX3 Sentinela")).log.some((r) => r.contextoConteudo?.tipo === "golpeOportunidade"));
  const salva = await page.evaluate(() => JSON.parse(localStorage.getItem("fm_ficha_sessao_afty_v1:CX3 Sentinela"))); assert.equal(salva.especializacaoSessao.reacoesGastas, 1); assert.equal(salva.usos["rodada:uso:golpe-oportunidade"], 1); assert.equal(salva.log.find((r) => r.tipoTeste === "ataque").modo, "normal"); assert.equal(salva.peAtual, s.peAtual);
  await el.scrollIntoViewIfNeeded(); assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)); await page.screenshot({ path: `.audit/cx3-20261102/${sistema}-${largura}-sentinela${g2 ? "-g2" : ""}.png` });
  await page.reload({ waitUntil: "networkidle" }); await page.getByText(c.name, { exact: true }).click(); assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem("fm_ficha_sessao_afty_v1:CX3 Sentinela")).usos["rodada:uso:golpe-oportunidade"]), 1);
  if (!g2) {
   for (const [i, e] of encontros.entries()) {
    await page.goto(`http://127.0.0.1:5193/${sistema}`, { waitUntil: "networkidle" }); await page.getByRole("button", { name: "Encontros", exact: true }).click(); await page.getByText(e.nome, { exact: true }).click(); await page.getByRole("button", { name: "Começar", exact: true }).click();
    const le = () => page.evaluate((id) => JSON.parse(localStorage.getItem("afty_encontros_v1")).find((e) => e.id === id), e.id);
    const foco = async (nome) => { if (largura === 390) await page.getByRole("button", { name: "Iniciativa", exact: true }).click(); for (const candidato of await page.getByText(nome, { exact: true }).all()) if (await candidato.isVisible()) { await candidato.click(); return; } throw Error("Combatente não encontrado"); };
    const confirma = async (indice, ataque, alvoId, comDano = true) => {
     await page.getByRole("tab", { name: "Ações", exact: true }).click();
     if (comDano) await rngClique(page.locator('[id="afty-item-dano:basico"]').locator("button.afty-rolavel").last(), 0);
     if (comDano) await page.waitForFunction(({ id, indice }) => JSON.parse(localStorage.getItem("afty_encontros_v1")).find((e) => e.id === id).combatentes[indice].sessao.log.some((r) => r.tipo === "dano"), { id: e.id, indice });
     const mesa = await le(), dano = mesa.combatentes[indice].sessao.log.find((r) => r.tipo === "dano");
     await page.getByRole("combobox", { name: "Ataque a Confirmar" }).selectOption(ataque.id); await page.getByRole("combobox", { name: "Alvo do Ataque" }).selectOption(alvoId); if (comDano) await page.getByRole("combobox", { name: "Dano do Ataque" }).selectOption(dano.id);
     await page.getByRole("button", { name: "Confirmar Ataque e Aplicar Dano", exact: true }).click(); await page.waitForFunction(({ id, indice, ataqueId }) => JSON.parse(localStorage.getItem("afty_encontros_v1")).find((e) => e.id === id).combatentes[indice].sessao.log.some((r) => r.rotulo === "Ataque Confirmado" && r.ataqueId === ataqueId), { id: e.id, indice, ataqueId: ataque.id });
    };
    if (i === 0) {
     await foco(c.name); el = await abre(); await escolheGO(el, e.combatentes[0].id); await page.waitForFunction((id) => JSON.parse(localStorage.getItem("afty_encontros_v1")).find((e) => e.id === id).combatentes[1].sessao.log.some((r) => r.contextoConteudo?.tipo === "golpeOportunidade"), e.id);
     let mesa = await le(); const ataque = mesa.combatentes[1].sessao.log.find((r) => r.contextoConteudo?.tipo === "golpeOportunidade"); await confirma(1, ataque, e.combatentes[0].id); mesa = await le();
     assert.equal(mesa.combatentes[0].sessao.uso.ativos["tal_tecnicas_do_sentinela:movimento"].duracao.tipo, "fimDoTurno"); assert.equal(mesa.combatentes[0].sessao.buffs.find((b) => b.nome === "Técnicas do Sentinela").expr, "-4.5"); assert.equal(mesa.combatentes[1].sessao.log.find((r) => r.rotulo === "Ataque Confirmado").reducaoMovimento, 4.5);
     await page.getByRole("button", { name: "Próximo Turno", exact: true }).click(); mesa = await le(); assert.equal(mesa.ativoId, e.combatentes[1].id); assert.equal(mesa.combatentes[0].sessao.uso.ativos["tal_tecnicas_do_sentinela:movimento"], undefined); assert.ok(!mesa.combatentes[0].sessao.buffs.some((b) => b.nome === "Técnicas do Sentinela"));
    } else {
     await foco(ca.name); await page.getByRole("tab", { name: "Ações", exact: true }).click(); const linha = deriveAfty(ca).dano.entradas.find((l) => l.id === "basico"); await rngClique(page.locator('[id="afty-item-dano:basico"]').getByRole("button", { name: `+${linha.acerto}`, exact: true }), 0);
     await page.waitForFunction((id) => JSON.parse(localStorage.getItem("afty_encontros_v1")).find((e) => e.id === id).combatentes[0].sessao.log.some((r) => r.tipoTeste === "ataque"), e.id); let mesa = await le(); const original = mesa.combatentes[0].sessao.log.find((r) => r.tipoTeste === "ataque"); await confirma(0, original, e.combatentes[2].id, false);
     await foco(c.name); el = await abre(); await el.getByRole("combobox", { name: "Atacante do Gatilho de Sentinela" }).selectOption(e.combatentes[0].id); await el.getByRole("combobox", { name: "Ataque contra Outra Criatura" }).selectOption(original.id); await el.getByRole("combobox", { name: "Arma da Reação de Sentinela" }).selectOption("0"); await el.getByRole("checkbox", { name: "Atacante a Até 1,5m e Gatilho Atual", exact: true }).check(); await rngClique(el.getByRole("button", { name: "Rolar Reação de Sentinela", exact: true }), 0.8);
     await page.waitForFunction((id) => JSON.parse(localStorage.getItem("afty_encontros_v1")).find((e) => e.id === id).combatentes[1].sessao.log.some((r) => r.contextoConteudo?.tipo === "reacaoSentinela"), e.id); mesa = await le(); const reacao = mesa.combatentes[1].sessao.log.find((r) => r.contextoConteudo?.tipo === "reacaoSentinela"); assert.equal(reacao.contextoConteudo.alvoId, e.combatentes[0].id); assert.equal(reacao.modo, "normal"); assert.equal(mesa.combatentes[1].sessao.especializacaoSessao.reacoesGastas, 1); assert.equal(mesa.combatentes[1].sessao.uso.acoes.gastas.comum, 0);
     await confirma(1, reacao, e.combatentes[0].id); mesa = await le(); assert.equal(mesa.combatentes[0].sessao.uso.ativos["tal_tecnicas_do_sentinela:movimento"], undefined); assert.equal(mesa.combatentes[1].sessao.usos["rodada:uso:golpe-oportunidade"] ?? 0, 0);
     el = await abre(); await el.scrollIntoViewIfNeeded(); assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)); await page.screenshot({ path: `.audit/cx3-20261102/${sistema}-${largura}-sentinela-reacao.png` });
    }
    const antesReload = await le(); await page.reload({ waitUntil: "networkidle" }); const relida = await le(); assert.deepEqual(relida.combatentes.map((c) => c.sessao.usos), antesReload.combatentes.map((c) => c.sessao.usos)); assert.deepEqual(relida.combatentes[0].sessao.uso.ativos, antesReload.combatentes[0].sessao.uso.ativos);
   }
  }
  assert.deepEqual(erros, []); resultados.push({ sistema, largura, g2, oportunidade: true, reacaoETermoNoEncontro: !g2, persistencia: true, erros }); console.log(`${sistema} ${largura} ${g2 ? "G2" : "clássica/Encontro"}: aprovado`); await ctx.close();
 }
} finally { await writeFile(".audit/cx3-20261102/browser-sentinela-resultados.json", JSON.stringify(resultados, null, 2)); await browser.close(); }
