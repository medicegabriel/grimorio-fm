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
function ficha(sistema, nome, movel = false) {
 const c = createBlankAfty(); c.id = nome; c.name = nome; c.rulesVersion = sistema; c.core.nd = 12; c.attrMethod = "fixos";
 c.attributes = { forca: 15, destreza: movel ? 14 : 8, constituicao: 13, inteligencia: 10, sabedoria: 12, presenca: movel ? 8 : 14 }; c.core.origem = { id: "inato", bonusAtributos: { forca: 2, destreza: 1 } };
 c.especializacoes = [{ id: "combatente", nivel: 12 }]; c.pericias = { atletismo: "treinado", feiticaria: "treinado" }; c.habilidadesGerais = sistema === "afty" ? ["ger_especializacao"] : [];
 c.talentos = movel ? ["tal_tecnicas_de_mobilidade", "tal_tecnicas_do_sentinela"] : ["tal_perceber_oportunidade"]; return c;
}
const browser = await chromium.launch({ channel: "chrome", ignoreDefaultArgs: ["--hide-scrollbars"] }), resultados = [];
try {
 for (const sistema of ["player", "afty"]) for (const largura of [1440, 390]) for (const g2 of [false, true]) {
  const c = ficha(sistema, "CX3 Móvel", true), cb = ficha(sistema, "CX3 Oponente"), cc = ficha(sistema, "CX3 Terceiro"), fichas = [c, cb, cc], ds = fichas.map((f) => deriveAfty(f));
  for (const d of ds) { assert.deepEqual(d.talentos.inacessiveis, []); assert.equal(d.habilidades.excedeu, false); }
  const encontros = [false, true].map((fora) => { const e = criarEncontro({ nome: `CX3 Mobilidade: ${fora ? "Fora" : "Próprio"}` }); e.combatentes = fichas.map((f, i) => definirIniciativa(criarCombatente(f, { derived: ds[i] }), (fora ? [20, 30, 10] : [30, 20, 10])[i])); return e; });
  const ctx = await browser.newContext({ viewport: { width: largura, height: 1000 }, isMobile: largura === 390, hasTouch: largura === 390 });
  await ctx.addInitScript(({ sistema, c, encontros }) => { if (localStorage.getItem("cx3-mobilidade")) return; localStorage.setItem("cx3-mobilidade", "1"); localStorage.setItem(`fm_creatures_${sistema}_v1`, JSON.stringify([c])); localStorage.setItem("afty_encontros_v1", JSON.stringify(encontros)); }, { sistema, c, encontros });
  const page = await ctx.newPage(), erros = []; page.on("pageerror", (e) => erros.push(e.message));
  const rngClique = async (el, n) => { await page.evaluate((n) => { globalThis.cx3Random = Math.random; Math.random = () => n; }, n); try { await el.click(); } finally { await page.evaluate(() => { Math.random = globalThis.cx3Random; delete globalThis.cx3Random; }); } };
  const abre = async (nome, id, previa = false) => { await page.getByRole("tab", { name: "Habilidades", exact: true }).click(); if (previa) { await page.getByRole("button", { name: `${nome}. Consultar a regra`, exact: true }).click(); return page.getByRole("dialog", { name: `Consulta: ${nome}`, exact: true }); } const el = page.locator(`[id="afty-item-talento:${id}"]`); const b = el.getByRole("button", { name: nome, exact: true }); if (await b.getAttribute("aria-expanded") !== "true") await b.click(); return el; };
  await page.goto(`http://127.0.0.1:5193/${sistema}${g2 ? "?ficha-g2=1" : ""}`, { waitUntil: "networkidle" }); await page.getByText(c.name, { exact: true }).click(); let el = await abre("Técnicas de Mobilidade", "tal_tecnicas_de_mobilidade", g2);
  assert.equal(await el.getByRole("button", { name: "Rolar Disputa de Mobilidade", exact: true }).isDisabled(), true); assert.equal(await el.getByRole("button", { name: "Aplicar Mobilidade", exact: true }).isDisabled(), true); await el.scrollIntoViewIfNeeded(); assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)); await page.screenshot({ path: `.audit/cx3-20261102/${sistema}-${largura}-mobilidade${g2 ? "-g2" : ""}.png` });
  if (!g2) for (const [i, e] of encontros.entries()) {
   await page.goto(`http://127.0.0.1:5193/${sistema}`, { waitUntil: "networkidle" }); await page.getByRole("button", { name: "Encontros", exact: true }).click(); await page.getByText(e.nome, { exact: true }).click(); await page.getByRole("button", { name: "Começar", exact: true }).click();
   const le = () => page.evaluate((id) => JSON.parse(localStorage.getItem("afty_encontros_v1")).find((e) => e.id === id), e.id);
   const foco = async (nome) => { if (largura === 390) await page.getByRole("button", { name: "Iniciativa", exact: true }).click(); for (const candidato of await page.getByText(nome, { exact: true }).all()) if (await candidato.isVisible()) { await candidato.click(); return; } throw Error("Combatente não encontrado"); };
   const confirmaErro = async (indice, ataqueId, alvoId) => { await page.getByRole("tab", { name: "Ações", exact: true }).click(); await page.getByRole("combobox", { name: "Ataque a Confirmar" }).selectOption(ataqueId); await page.getByRole("combobox", { name: "Alvo do Ataque" }).selectOption(alvoId); await page.getByRole("button", { name: "Confirmar Ataque e Aplicar Dano", exact: true }).click(); await page.waitForFunction(({ id, indice, ataqueId }) => JSON.parse(localStorage.getItem("afty_encontros_v1")).find((e) => e.id === id).combatentes[indice].sessao.log.some((r) => r.rotulo === "Ataque Confirmado" && r.ataqueId === ataqueId), { id: e.id, indice, ataqueId }); };
   const ataca = async (indice, alvoId) => { await foco(fichas[indice].name); await page.getByRole("tab", { name: "Ações", exact: true }).click(); await rngClique(page.locator('[id="afty-item-dano:basico"]').getByRole("button", { name: `+${ds[indice].dano.entradas.find((l) => l.id === "basico").acerto}`, exact: true }), 0); await page.waitForFunction(({ id, indice }) => JSON.parse(localStorage.getItem("afty_encontros_v1")).find((e) => e.id === id).combatentes[indice].sessao.log.some((r) => r.tipoTeste === "ataque"), { id: e.id, indice }); const mesa = await le(), ataque = mesa.combatentes[indice].sessao.log.find((r) => r.tipoTeste === "ataque"); await confirmaErro(indice, ataque.id, alvoId); return ataque; };
   let ataque;
   if (i === 0) ataque = await ataca(0, e.combatentes[1].id);
   else {
    const gatilho = await ataca(1, e.combatentes[2].id); await foco(c.name); el = await abre("Técnicas do Sentinela", "tal_tecnicas_do_sentinela");
    await el.getByRole("combobox", { name: "Atacante do Gatilho de Sentinela" }).selectOption(e.combatentes[1].id); await el.getByRole("combobox", { name: "Ataque contra Outra Criatura" }).selectOption(gatilho.id); await el.getByRole("combobox", { name: "Arma da Reação de Sentinela" }).selectOption("0"); await el.getByRole("checkbox", { name: "Atacante a Até 1,5m e Gatilho Atual", exact: true }).check(); await rngClique(el.getByRole("button", { name: "Rolar Reação de Sentinela", exact: true }), 0);
    await page.waitForFunction((id) => JSON.parse(localStorage.getItem("afty_encontros_v1")).find((e) => e.id === id).combatentes[0].sessao.log.some((r) => r.contextoConteudo?.tipo === "reacaoSentinela"), e.id); ataque = (await le()).combatentes[0].sessao.log.find((r) => r.contextoConteudo?.tipo === "reacaoSentinela"); await confirmaErro(0, ataque.id, e.combatentes[1].id);
   }
   el = await abre("Técnicas de Mobilidade", "tal_tecnicas_de_mobilidade"); await el.getByRole("combobox", { name: "Ataque de Técnicas de Mobilidade" }).selectOption(ataque.id);
   const antes = await le(); await rngClique(el.getByRole("button", { name: "Rolar Disputa de Mobilidade", exact: true }), 0.5);
   await page.waitForFunction((id) => JSON.parse(localStorage.getItem("afty_encontros_v1")).find((e) => e.id === id).combatentes[0].sessao.log.some((r) => r.contextoConteudo?.tipo === "mobilidade"), e.id);
   let mesa = await le(); const chave = `tal_tecnicas_de_mobilidade:${e.combatentes[1].id}`; assert.equal(mesa.combatentes[0].sessao.uso.ativos[chave], undefined); assert.deepEqual(mesa.combatentes[0].sessao.uso.acoes, antes.combatentes[0].sessao.uso.acoes); assert.equal(mesa.combatentes[0].sessao.peAtual, antes.combatentes[0].sessao.peAtual);
   await el.getByRole("button", { name: "Aplicar Mobilidade", exact: true }).click(); await page.waitForFunction(({ id, chave }) => !!JSON.parse(localStorage.getItem("afty_encontros_v1")).find((e) => e.id === id).combatentes[0].sessao.uso.ativos[chave], { id: e.id, chave });
   mesa = await le(); const ativo = mesa.combatentes[0].sessao.uso.ativos[chave]; assert.equal(ativo.parametros.turnoEmCurso, e.combatentes[i === 0 ? 0 : 1].id); assert.equal(ativo.parametros.sequenciaTurno, mesa.combatentes[i === 0 ? 0 : 1].sessao.uso.acoes.turno); assert.equal(mesa.combatentes[0].sessao.usos["rodada:uso:tal_tecnicas_de_mobilidade"], 1);
   await el.scrollIntoViewIfNeeded(); assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)); await page.screenshot({ path: `.audit/cx3-20261102/${sistema}-${largura}-mobilidade-${i ? "fora" : "proprio"}.png` });
   await page.reload({ waitUntil: "networkidle" }); mesa = await le(); assert.deepEqual(mesa.combatentes[0].sessao.uso.ativos[chave], ativo);
   await page.getByRole("button", { name: "Encontros", exact: true }).click(); await page.getByText(e.nome, { exact: true }).click();
   const oportunidade = async (indice) => { await foco(fichas[indice].name); const el = await abre("Perceber Oportunidade", "tal_perceber_oportunidade"); await el.getByRole("combobox", { name: "Alvo do Golpe de Oportunidade" }).selectOption(e.combatentes[0].id); await el.getByRole("combobox", { name: "Arma do Golpe de Oportunidade" }).selectOption("0"); await el.getByRole("checkbox", { name: "Gatilho de Oportunidade", exact: true }).check(); await rngClique(el.getByRole("button", { name: "Rolar Golpe de Oportunidade", exact: true }), 0.5); return el; };
   if (i === 0) {
    const o = await oportunidade(1); assert.ok((await o.getByRole("alert").innerText()).includes("Técnicas de Mobilidade")); mesa = await le(); assert.equal(mesa.combatentes[1].sessao.especializacaoSessao?.reacoesGastas ?? 0, 0); assert.equal(mesa.combatentes[1].sessao.usos["rodada:uso:golpe-oportunidade"] ?? 0, 0);
    await oportunidade(2); await page.waitForFunction((id) => JSON.parse(localStorage.getItem("afty_encontros_v1")).find((e) => e.id === id).combatentes[2].sessao.usos["rodada:uso:golpe-oportunidade"] === 1, e.id);
   }
   await page.getByRole("button", { name: "Próximo Turno", exact: true }).click(); mesa = await le(); assert.equal(mesa.combatentes[0].sessao.uso.ativos[chave], undefined); assert.equal(mesa.ativoId, e.combatentes[i === 0 ? 1 : 0].id);
   if (i === 0) { await oportunidade(1); await page.waitForFunction((id) => JSON.parse(localStorage.getItem("afty_encontros_v1")).find((e) => e.id === id).combatentes[1].sessao.usos["rodada:uso:golpe-oportunidade"] === 1, e.id); }
   await page.reload({ waitUntil: "networkidle" }); assert.equal((await le()).combatentes[0].sessao.uso.ativos[chave], undefined);
  }
  assert.deepEqual(erros, []); resultados.push({ sistema, largura, g2, apresentacao: true, proprioEForaDoTurno: !g2, bloqueioComAlvo: !g2, persistencia: !g2, erros }); console.log(`${sistema} ${largura} ${g2 ? "G2" : "clássica/Encontro"}: aprovado`); await ctx.close();
 }
} finally { await writeFile(".audit/cx3-20261102/browser-mobilidade-resultados.json", JSON.stringify(resultados, null, 2)); await browser.close(); }
