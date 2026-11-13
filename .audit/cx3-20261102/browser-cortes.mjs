import { register } from "node:module";
register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}', import.meta.url);
import { chromium } from "playwright";
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
const R = new URL("../../src/systems/afty/", import.meta.url);
const { deriveAfty } = await import(new URL("afty-derive.js", R));
const { createBlankAfty } = await import(new URL("afty-schema.js", R));
const { aplicarAddons } = await import(new URL("afty-addons.js", R));
const { getTalento } = await import(new URL("afty-talentos.js", R));
const S = await import(new URL("ficha/ficha-sessao.js", R));
const { opcoesDeriveDaSessao } = await import(new URL("ficha/ficha-opcoes-derive.js", R));
const { criarEncontro, criarCombatente, definirIniciativa } = await import(new URL("encontros/afty-encontro.js", R));
aplicarAddons([]);
function ficha(sistema, nome, talento = true) {
 const c = createBlankAfty(); c.id = nome; c.name = nome; c.rulesVersion = sistema; c.core.nd = 12; c.attrMethod = "fixos";
 c.attributes = { forca: 15, destreza: 14, constituicao: 13, inteligencia: 10, sabedoria: 12, presenca: 8 };
 c.core.origem = { id: "inato", bonusAtributos: { forca: 2, destreza: 1 } }; c.especializacoes = [{ id: "combatente", nivel: 12 }]; c.pericias = { feiticaria: "treinado" };
 c.habilidadesGerais = sistema === "afty" ? ["ger_especializacao"] : []; c.talentos = talento ? ["tal_especialista_em_cortes"] : [];
 c.escolhasTalento = talento ? { tal_especialista_em_cortes: [getTalento("tal_especialista_em_cortes").escolha.opcoes[0].id] } : {};
 c.equipamentos.itens = [{ uid: "espada", tipo: "arma", refId: "arm_espada_curta", qtd: 1, equipado: true }]; return c;
}
const browser = await chromium.launch({ channel: "chrome", ignoreDefaultArgs: ["--hide-scrollbars"] }), resultados = [];
try {
 for (const sistema of ["player", "afty"]) for (const largura of [1440, 390]) for (const g2 of [false, true]) {
  const c = ficha(sistema, "CX3 Cortes"), cb = ficha(sistema, "CX3 Segundo Cortador"), ct = ficha(sistema, "CX3 Alvo dos Cortes", false), d = deriveAfty(c), dt = deriveAfty(ct);
  const s = { ...S.iniciaTurnoFicha(S.iniciaCombate(S.sessaoEmBranco(d), d), d), rodada: 1 }, encontro = criarEncontro({ nome: "CX3 Cortes na Mesa" });
  encontro.combatentes = [c, cb, ct].map((f, i) => definirIniciativa(criarCombatente(f, { derived: deriveAfty(f) }), 30 - i * 10));
  const ctx = await browser.newContext({ viewport: { width: largura, height: 1000 }, isMobile: largura === 390, hasTouch: largura === 390 });
  await ctx.addInitScript(({ sistema, c, s, encontro }) => { if (localStorage.getItem("cx3-cortes")) return; localStorage.setItem("cx3-cortes", "1"); localStorage.setItem(`fm_creatures_${sistema}_v1`, JSON.stringify([c])); localStorage.setItem(`fm_ficha_sessao_afty_v1:${c.id}`, JSON.stringify(s)); localStorage.setItem("afty_encontros_v1", JSON.stringify([encontro])); }, { sistema, c, s, encontro });
  const page = await ctx.newPage(), erros = []; page.on("pageerror", e => erros.push(e.message));
  const abre = async (previa = false) => { await page.getByRole("tab", { name: "Habilidades", exact: true }).click(); if (previa) { await page.getByRole("button", { name: "Especialista em Cortes. Consultar a regra", exact: true }).click(); return page.getByRole("dialog", { name: "Consulta: Especialista em Cortes", exact: true }); } const el = page.locator('[id="afty-item-talento:tal_especialista_em_cortes"]'), b = el.getByRole("button", { name: "Especialista em Cortes", exact: true }); if (await b.getAttribute("aria-expanded") !== "true") await b.click(); return el; };
  const vicia = async (el, valor) => { await page.evaluate(v => { globalThis.cx3Random = Math.random; Math.random = () => v; }, valor); try { await el.click(); } finally { await page.evaluate(() => { Math.random = globalThis.cx3Random; delete globalThis.cx3Random; }); } };
  await page.goto(`http://127.0.0.1:5193/${sistema}${g2 ? "?ficha-g2=1" : ""}`, { waitUntil: "networkidle" }); await page.getByText(c.name, { exact: true }).click(); let el = await abre(g2);
  assert.equal(await el.getByRole("button", { name: "Reduzir Movimento", exact: true }).isDisabled(), true); await el.scrollIntoViewIfNeeded(); assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)); await page.screenshot({ path: `.audit/cx3-20261102/${sistema}-${largura}-cortes${g2 ? "-g2" : ""}.png` });
  if (!g2) {
   await page.getByRole("button", { name: "Voltar", exact: true }).click(); await page.getByRole("button", { name: "Encontros", exact: true }).click(); await page.getByText(encontro.nome, { exact: true }).click(); await page.getByRole("button", { name: "Começar", exact: true }).click();
   const le = () => page.evaluate(() => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0]);
   const foco = async nome => { if (largura === 390) await page.getByRole("button", { name: "Iniciativa", exact: true }).click(); for (const b of await page.getByText(nome, { exact: true }).all()) if (await b.isVisible()) { await b.click(); return; } throw Error("Combatente Não Encontrado"); };
   const movimento = s => deriveAfty({ ...ct, combate: s.combate, buffsSessao: s.buffs }, opcoesDeriveDaSessao(s)).movimento;
   for (const [i, f] of [c, cb].entries()) {
    if (i) await page.getByRole("button", { name: "Próximo Turno", exact: true }).click(); await foco(f.name);
    const df = deriveAfty(f), linha = df.dano.entradas.find(l => l.id === "arm_espada_curta");
    await page.getByRole("tab", { name: "Ações", exact: true }).click(); const arma = page.locator('[id="afty-item-dano:arm_espada_curta"]');
    await vicia(arma.getByRole("button", { name: `+${linha.acerto}`, exact: true }), 0.75);
    await page.waitForFunction(i => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0].combatentes[i].sessao.log.some(r => r.tipoTeste === "ataque"), i);
    await vicia(arma.locator("button.afty-rolavel").last(), 0.5);
    await page.waitForFunction(i => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0].combatentes[i].sessao.log.some(r => r.tipo === "dano"), i);
    let mesa = await le(), atk = mesa.combatentes[i].sessao.log.find(r => r.tipoTeste === "ataque"), dano = mesa.combatentes[i].sessao.log.find(r => r.tipo === "dano");
    assert.equal(atk.critico, false); await page.getByRole("combobox", { name: "Ataque a Confirmar" }).selectOption(atk.id); await page.getByRole("combobox", { name: "Dano do Ataque" }).selectOption(dano.id); await page.getByRole("combobox", { name: "Alvo do Ataque" }).selectOption(encontro.combatentes[2].id); await page.getByRole("button", { name: "Confirmar Ataque e Aplicar Dano", exact: true }).click();
    await page.waitForFunction(i => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0].combatentes[i].sessao.log.some(r => r.rotulo === "Ataque Confirmado"), i);
    mesa = await le(); const antes = mesa.combatentes[i].sessao; assert.ok(antes.log.find(r => r.rotulo === "Ataque Confirmado").calculos.some(c => c.tipoDano === "ct" && c.final > 0));
    el = await abre(); await el.getByRole("combobox", { name: "Ataque Cortante Confirmado" }).selectOption(atk.id); await el.getByRole("button", { name: "Reduzir Movimento", exact: true }).click();
    await page.waitForFunction(({ i, id }) => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0].combatentes[2].sessao.uso.ativos[`tal_especialista_em_cortes:${id}`], { i, id: encontro.combatentes[i].id });
    mesa = await le(); assert.equal(movimento(mesa.combatentes[2].sessao), dt.movimento - 4.5); assert.equal(mesa.combatentes[i].sessao.peAtual, antes.peAtual); assert.deepEqual(mesa.combatentes[i].sessao.uso.acoes, antes.uso.acoes); assert.equal(Object.values(mesa.combatentes[2].sessao.uso.ativos).filter(x => x.origem === "tal_especialista_em_cortes").length, i + 1);
   }
   await foco(ct.name); await page.screenshot({ path: `.audit/cx3-20261102/${sistema}-${largura}-cortes-encontro.png` }); assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
   const antesReload = await le(); await page.reload({ waitUntil: "networkidle" }); let mesa = await le(); assert.deepEqual(mesa.combatentes[2].sessao.uso.ativos, antesReload.combatentes[2].sessao.uso.ativos); assert.equal(movimento(mesa.combatentes[2].sessao), dt.movimento - 4.5);
   await page.getByRole("button", { name: "Encontros", exact: true }).click(); await page.getByText(encontro.nome, { exact: true }).click();
   await page.getByRole("button", { name: "Próximo Turno", exact: true }).click(); await page.waitForFunction(id => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0].ativoId === id, encontro.combatentes[2].id);
   mesa = await le(); assert.equal(Object.values(mesa.combatentes[2].sessao.uso.ativos).filter(x => x.origem === "tal_especialista_em_cortes").length, 2);
   await page.getByRole("button", { name: "Próximo Turno", exact: true }).click(); await page.waitForFunction(id => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0].ativoId === id, encontro.combatentes[0].id);
   mesa = await le(); assert.equal(mesa.combatentes[2].sessao.uso.ativos[`tal_especialista_em_cortes:${encontro.combatentes[0].id}`], undefined); assert.equal(movimento(mesa.combatentes[2].sessao), dt.movimento - 4.5);
   await page.getByRole("button", { name: "Próximo Turno", exact: true }).click(); await page.waitForFunction(id => !Object.values(JSON.parse(localStorage.getItem("afty_encontros_v1"))[0].combatentes[2].sessao.uso.ativos).some(x => x.origem === "tal_especialista_em_cortes"), encontro.combatentes[1].id);
   mesa = await le(); assert.equal(movimento(mesa.combatentes[2].sessao), dt.movimento);
  }
  assert.deepEqual(erros, []); resultados.push({ sistema, largura, g2, controle: true, duasFontesEPrazoNoEncontro: !g2, semCustoAdicional: !g2, persistencia: !g2, erros }); console.log(`${sistema} ${largura} ${g2 ? "G2" : "clássica/Encontro"}: aprovado`); await ctx.close();
 }
} finally { await writeFile(".audit/cx3-20261102/browser-cortes-resultados.json", JSON.stringify(resultados, null, 2)); await browser.close(); }
