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
function ficha(sistema, nome, lua) {
 const c = createBlankAfty(); c.id = nome; c.name = nome; c.rulesVersion = sistema; c.core.nd = 12; c.attrMethod = "fixos";
 c.attributes = { forca: 15, destreza: 14, constituicao: 13, inteligencia: 10, sabedoria: 12, presenca: 8 };
 c.core.origem = { id: "inato", bonusAtributos: { forca: 2, destreza: 1 } }; c.especializacoes = [{ id: "combatente", nivel: 12 }];
 c.habilidadesGerais = sistema === "afty" ? ["ger_especializacao"] : []; c.habilidades = lua ? ["cmb_assumir_postura"] : [];
 c.escolhasHabilidade = lua ? { cmb_assumir_postura: ["cmb_postura_da_lua", "cmb_postura_do_sol"] } : {};
 c.talentos = lua ? [] : ["tal_perceber_oportunidade"]; c.pericias = { feiticaria: "treinado" }; return c;
}
const browser = await chromium.launch({ channel: "chrome", ignoreDefaultArgs: ["--hide-scrollbars"] }), resultados = [];
try {
 for (const sistema of ["player", "afty"]) for (const largura of [1440, 390]) for (const g2 of [false, true]) {
  const c = ficha(sistema, "CX3 Lua", true), ca = ficha(sistema, "CX3 Oportunidade", false), d = deriveAfty(c);
  assert.deepEqual(d.habilidades.inacessiveis, []); assert.equal(d.habilidades.excedeu, false); assert.equal(d.testes.orcamento.excedeu, false);
  const s = { ...S.iniciaTurnoFicha(S.iniciaCombate(S.sessaoEmBranco(d), d), d), rodada: 1 }, e = criarEncontro({ nome: "CX3 Lua na Mesa" });
  e.combatentes = [c, ca].map((f, i) => definirIniciativa(criarCombatente(f, { derived: deriveAfty(f) }), 20 - i * 10));
  const ctx = await browser.newContext({ viewport: { width: largura, height: 1000 }, isMobile: largura === 390, hasTouch: largura === 390 });
  await ctx.addInitScript(({ sistema, c, s, e }) => { if (localStorage.getItem("cx3-lua")) return; localStorage.setItem("cx3-lua", "1"); localStorage.setItem(`fm_creatures_${sistema}_v1`, JSON.stringify([c])); localStorage.setItem(`fm_ficha_sessao_afty_v1:${c.id}`, JSON.stringify(s)); localStorage.setItem("afty_encontros_v1", JSON.stringify([e])); }, { sistema, c, s, e });
  const page = await ctx.newPage(), erros = []; page.on("pageerror", err => erros.push(err.message));
  const abre = async (previa = false) => { await page.getByRole("tab", { name: "Habilidades", exact: true }).click(); if (previa) { await page.getByRole("button", { name: "Assumir Postura. Consultar a regra", exact: true }).click(); return page.getByRole("dialog", { name: "Consulta: Assumir Postura", exact: true }); } const el = page.locator('[id="afty-item-especializacao:cmb_assumir_postura"]'), b = el.getByRole("button", { name: "Assumir Postura", exact: true }); if (await b.getAttribute("aria-expanded") !== "true") await b.click(); return el; };
  const foco = async nome => { if (largura === 390) await page.getByRole("button", { name: "Iniciativa", exact: true }).click(); for (const b of await page.getByText(nome, { exact: true }).all()) if (await b.isVisible()) { await b.click(); return; } throw Error("Combatente Não Encontrado"); };
  const le = encontro => page.evaluate(encontro => encontro ? JSON.parse(localStorage.getItem("afty_encontros_v1"))[0].combatentes[0].sessao : JSON.parse(localStorage.getItem("fm_ficha_sessao_afty_v1:CX3 Lua")), encontro);
  const exercita = async (encontro, previa) => {
   let el = await abre(previa); assert.equal(await el.getByRole("button", { name: "Usar Ação Livre da Lua", exact: true }).count(), 0);
   await el.getByRole("combobox", { name: "Postura para Assumir", exact: true }).selectOption("lua"); await el.getByRole("button", { name: "Entrar em Postura", exact: true }).click();
   await el.getByRole("button", { name: "Usar Ação Livre da Lua", exact: true }).waitFor();
   await page.waitForFunction(encontro => { const s = encontro ? JSON.parse(localStorage.getItem("afty_encontros_v1"))[0].combatentes[0].sessao : JSON.parse(localStorage.getItem("fm_ficha_sessao_afty_v1:CX3 Lua")); return s.uso.acoes.gastas.bonus === 1 && s.combate.postura === "lua"; }, encontro);
   const antes = await le(encontro);
   await el.getByRole("spinbutton", { name: "Distância da Lua" }).fill("1.5"); await el.getByRole("button", { name: "Usar Ação Livre da Lua", exact: true }).click();
   await page.waitForFunction(encontro => { const s = encontro ? JSON.parse(localStorage.getItem("afty_encontros_v1"))[0].combatentes[0].sessao : JSON.parse(localStorage.getItem("fm_ficha_sessao_afty_v1:CX3 Lua")); return s.log.some(r => r.rotulo === "Postura da Lua" && r.deslocamento === 1.5); }, encontro);
   let salva = await le(encontro); assert.equal(salva.peAtual, antes.peAtual); assert.deepEqual(salva.uso.acoes.gastas, antes.uso.acoes.gastas); assert.equal(salva.uso.acoes.livres["cmb_postura_da_lua:andar"], 1);
   await el.getByRole("button", { name: "Usar Ação Livre da Lua", exact: true }).click(); await el.getByRole("alert").filter({ hasText: "Ação Livre Já Usada" }).waitFor();
   await el.getByRole("combobox", { name: "Ação Livre da Lua" }).selectOption("desengajar"); await el.getByRole("button", { name: "Usar Ação Livre da Lua", exact: true }).click(); await el.getByText("Desengajado", { exact: true }).waitFor();
   await page.waitForFunction(encontro => { const s = encontro ? JSON.parse(localStorage.getItem("afty_encontros_v1"))[0].combatentes[0].sessao : JSON.parse(localStorage.getItem("fm_ficha_sessao_afty_v1:CX3 Lua")); return !!s.uso.ativos["cmb_postura_da_lua:desengajar"]; }, encontro);
   salva = await le(encontro); assert.equal(salva.uso.ativos["cmb_postura_da_lua:desengajar"].duracao.tipo, "fimDoTurno"); assert.equal(salva.peAtual, antes.peAtual); assert.deepEqual(salva.uso.acoes.gastas, antes.uso.acoes.gastas);
   assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)); await el.scrollIntoViewIfNeeded(); await page.screenshot({ path: `.audit/cx3-20261102/${sistema}-${largura}-lua${encontro ? "-encontro" : previa ? "-g2" : ""}.png` });
   await page.reload({ waitUntil: "networkidle" });
   if (encontro) { await page.getByRole("button", { name: "Encontros", exact: true }).click(); await page.getByText(e.nome, { exact: true }).click(); await foco(c.name); } else await page.getByText(c.name, { exact: true }).click();
   el = await abre(previa); await el.getByText("Desengajado", { exact: true }).waitFor(); assert.deepEqual((await le(encontro)).uso.acoes.livres, salva.uso.acoes.livres);
   if (encontro) {
    await foco(ca.name); await page.getByRole("tab", { name: "Habilidades", exact: true }).click(); const op = page.locator('[id="afty-item-talento:tal_perceber_oportunidade"]'); await op.getByRole("button", { name: "Perceber Oportunidade", exact: true }).click();
    await op.getByRole("combobox", { name: "Arma do Golpe de Oportunidade" }).selectOption("0"); await op.getByRole("combobox", { name: "Alvo do Golpe de Oportunidade" }).selectOption(e.combatentes[0].id); await op.getByRole("checkbox", { name: "Gatilho de Oportunidade", exact: true }).check(); await op.getByRole("button", { name: "Rolar Golpe de Oportunidade", exact: true }).click();
    await op.getByRole("alert").filter({ hasText: "Desengajar Impede" }).waitFor(); let mesa = await page.evaluate(() => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0]); assert.equal(mesa.combatentes[1].sessao.especializacaoSessao?.reacoesGastas ?? 0, 0);
    await page.getByRole("button", { name: "Próximo Turno", exact: true }).click(); mesa = await page.evaluate(() => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0]); assert.equal(mesa.combatentes[0].sessao.uso.ativos["cmb_postura_da_lua:desengajar"], undefined);
    await op.getByRole("button", { name: "Rolar Golpe de Oportunidade", exact: true }).click(); await page.waitForFunction(() => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0].combatentes[1].sessao.especializacaoSessao.reacoesGastas === 1);
   } else {
    if (previa) await page.getByRole("button", { name: "Fechar a consulta e voltar à lista", exact: true }).click(); await page.getByRole("button", { name: "Próxima rodada", exact: true }).click();
    await page.waitForFunction(() => JSON.parse(localStorage.getItem("fm_ficha_sessao_afty_v1:CX3 Lua")).rodada === 2); assert.equal((await le(false)).uso.ativos["cmb_postura_da_lua:desengajar"], undefined);
    el = await abre(previa); await el.getByRole("combobox", { name: "Ação Livre da Lua" }).selectOption("andar"); await el.getByRole("button", { name: "Usar Ação Livre da Lua", exact: true }).click();
    await page.waitForFunction(() => JSON.parse(localStorage.getItem("fm_ficha_sessao_afty_v1:CX3 Lua")).uso.acoes.livres["cmb_postura_da_lua:andar"] === 2);
   }
  };
  await page.goto(`http://127.0.0.1:5193/${sistema}${g2 ? "?ficha-g2=1" : ""}`, { waitUntil: "networkidle" }); await page.getByText(c.name, { exact: true }).click(); await exercita(false, g2);
  if (!g2) { await page.goto(`http://127.0.0.1:5193/${sistema}`, { waitUntil: "networkidle" }); await page.getByRole("button", { name: "Encontros", exact: true }).click(); await page.getByText(e.nome, { exact: true }).click(); await page.getByRole("button", { name: "Começar", exact: true }).click(); await foco(c.name); await exercita(true, false); }
  assert.deepEqual(erros, []); resultados.push({ sistema, largura, g2, andar: true, desengajar: true, livreNativa: true, custoZero: true, persistencia: true, prazo: true, oportunidadeNoEncontro: !g2 }); console.log(`${sistema} ${largura} ${g2 ? "G2" : "clássica/Encontro"}: aprovado`); await ctx.close();
 }
} finally { await writeFile(".audit/cx3-20261102/browser-lua-resultados.json", JSON.stringify(resultados, null, 2)); await browser.close(); }
