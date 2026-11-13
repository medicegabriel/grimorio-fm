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
function ficha(sistema, classe, id) {
 const c = createBlankAfty(); c.id = id; c.name = id; c.rulesVersion = sistema; c.core.nd = 20; c.attrMethod = "fixos";
 c.attributes = { forca: 14, destreza: 15, constituicao: 13, inteligencia: 10, sabedoria: 12, presenca: 8 };
 c.core.origem = classe === "restringido" ? { id: "restringido" } : { id: "inato", bonusAtributos: { forca: 1, destreza: 2 } }; if (classe === "restringido") c.core.tipo = "restringido";
 c.especializacoes = [{ id: classe, nivel: 20 }]; c.habilidades = [classe === "lutador" ? "lut_acao_agil" : "res_acao_agil"];
 c.pericias = { furtividade: "mestre", feiticaria: "treinado" }; c.habilidadesGerais = sistema === "afty" ? ["ger_especializacao"] : []; return c;
}
const browser = await chromium.launch({ channel: "chrome", ignoreDefaultArgs: ["--hide-scrollbars"] }), resultados = [];
try {
 for (const sistema of ["player", "afty"]) for (const classe of ["lutador", "restringido"]) for (const largura of [1440, 390]) for (const g2 of [false, true]) {
  const c = ficha(sistema, classe, "CX3 Ação Ágil"), ca = ficha(sistema, "lutador", "CX3 Oportunidade"), d = deriveAfty(c), id = c.habilidades[0];
  ca.habilidades = []; ca.talentos = ["tal_perceber_oportunidade"];
  const s = { ...S.iniciaTurnoFicha(S.iniciaCombate(S.sessaoEmBranco(d), d), d), rodada: 1 }, encontro = criarEncontro({ nome: "CX3 Desengajar na Mesa" });
  encontro.combatentes = [c, ca].map((f, i) => definirIniciativa(criarCombatente(f, { derived: deriveAfty(f) }), 20 - i * 10));
  const ctx = await browser.newContext({ viewport: { width: largura, height: 1000 }, isMobile: largura === 390, hasTouch: largura === 390 });
  await ctx.addInitScript(({ sistema, c, s, encontro }) => { if (localStorage.getItem("cx3-acao-agil")) return; localStorage.setItem("cx3-acao-agil", "1"); localStorage.setItem(`fm_creatures_${sistema}_v1`, JSON.stringify([c])); localStorage.setItem(`fm_ficha_sessao_afty_v1:${c.id}`, JSON.stringify(s)); localStorage.setItem("afty_encontros_v1", JSON.stringify([encontro])); }, { sistema, c, s, encontro });
  const page = await ctx.newPage(), erros = []; page.on("pageerror", e => erros.push(e.message));
  const le = () => page.evaluate(() => JSON.parse(localStorage.getItem("fm_ficha_sessao_afty_v1:CX3 Ação Ágil")));
  const abre = async (previa = false, nome = "Ação Ágil", chave = `especializacao:${id}`) => { await page.getByRole("tab", { name: "Habilidades", exact: true }).click(); if (previa) { await page.getByRole("button", { name: `${nome}. Consultar a regra`, exact: true }).click(); return page.getByRole("dialog", { name: `Consulta: ${nome}`, exact: true }); } const el = page.locator(`[id="afty-item-${chave}"]`), b = el.getByRole("button", { name: nome, exact: true }); if (await b.getAttribute("aria-expanded") !== "true") await b.click(); return el; };
  const avanca = async () => { const antes = (await le()).rodada; if (g2) await page.getByRole("button", { name: "Fechar a consulta e voltar à lista", exact: true }).click(); await page.getByRole("button", { name: "Próxima rodada", exact: true }).click(); await page.waitForFunction(antes => JSON.parse(localStorage.getItem("fm_ficha_sessao_afty_v1:CX3 Ação Ágil")).rodada === antes + 1, antes); return abre(g2); };
  await page.goto(`http://127.0.0.1:5193/${sistema}${g2 ? "?ficha-g2=1" : ""}`, { waitUntil: "networkidle" }); await page.getByText(c.name, { exact: true }).click(); let el = await abre(g2);
  await el.getByRole("combobox", { name: "Uso da Ação Ágil" }).selectOption("esconder"); await el.getByRole("combobox", { name: "Modo de Furtividade da Ação Ágil" }).selectOption("vantagem"); await el.getByRole("checkbox", { name: "Descontar PE", exact: true }).check();
  await el.getByRole("button", { name: "Usar Ação Ágil", exact: true }).click();
  await page.waitForFunction(() => JSON.parse(localStorage.getItem("fm_ficha_sessao_afty_v1:CX3 Ação Ágil")).log.some(r => r.contextoConteudo?.comando === "esconder"));
  let salva = await le(); assert.equal(salva.peAtual, s.peAtual - 2); assert.deepEqual(salva.uso.acoes, s.uso.acoes); assert.equal(salva.log.find(r => r.periciaId === "furtividade").d20.length, 2);
  await el.getByRole("button", { name: "Usar Ação Ágil", exact: true }).click(); await el.getByRole("alert").waitFor(); assert.equal((await le()).peAtual, salva.peAtual);
  el = await avanca(); await el.getByRole("combobox", { name: "Uso da Ação Ágil" }).selectOption("desengajar"); await el.getByRole("checkbox", { name: "Descontar PE", exact: true }).check(); await el.getByRole("button", { name: "Usar Ação Ágil", exact: true }).click();
  await page.waitForFunction(id => JSON.parse(localStorage.getItem("fm_ficha_sessao_afty_v1:CX3 Ação Ágil")).uso.ativos.acao_agil?.parametros.comando === "desengajar", id); await el.getByText("Desengajado", { exact: true }).waitFor();
  salva = await le(); assert.equal(salva.peAtual, s.peAtual - 4); assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)); await el.scrollIntoViewIfNeeded(); await page.screenshot({ path: `.audit/cx3-20261102/${sistema}-${classe}-${largura}-acao-agil${g2 ? "-g2" : ""}.png` });
  await page.reload({ waitUntil: "networkidle" }); await page.getByText(c.name, { exact: true }).click(); el = await abre(g2); await el.getByText("Desengajado", { exact: true }).waitFor();
  el = await avanca(); assert.equal((await le()).uso.ativos.acao_agil, undefined); await el.getByRole("combobox", { name: "Uso da Ação Ágil" }).selectOption("andar"); await el.getByRole("spinbutton", { name: "Distância da Ação Ágil" }).fill("1.5"); await el.getByRole("checkbox", { name: "Descontar PE", exact: true }).check(); await el.getByRole("button", { name: "Usar Ação Ágil", exact: true }).click();
  await page.waitForFunction(() => JSON.parse(localStorage.getItem("fm_ficha_sessao_afty_v1:CX3 Ação Ágil")).log.some(r => r.comando === "andar")); assert.equal((await le()).log.find(r => r.comando === "andar").deslocamento, 1.5);
  if (!g2) {
   await page.goto(`http://127.0.0.1:5193/${sistema}`, { waitUntil: "networkidle" }); await page.getByRole("button", { name: "Encontros", exact: true }).click(); await page.getByText(encontro.nome, { exact: true }).click(); await page.getByRole("button", { name: "Começar", exact: true }).click();
   const foco = async nome => { if (largura === 390) await page.getByRole("button", { name: "Iniciativa", exact: true }).click(); for (const b of await page.getByText(nome, { exact: true }).all()) if (await b.isVisible()) { await b.click(); return; } throw Error("Combatente Não Encontrado"); };
   await foco(c.name); el = await abre(); await el.getByRole("combobox", { name: "Uso da Ação Ágil" }).selectOption("desengajar"); await el.getByRole("checkbox", { name: "Descontar PE", exact: true }).check(); await el.getByRole("button", { name: "Usar Ação Ágil", exact: true }).click();
   await page.waitForFunction(id => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0].combatentes[0].sessao.uso.ativos.acao_agil, id);
   await foco(ca.name); el = await abre(false, "Perceber Oportunidade", "talento:tal_perceber_oportunidade"); await el.getByRole("combobox", { name: "Arma do Golpe de Oportunidade" }).selectOption("0"); await el.getByRole("combobox", { name: "Alvo do Golpe de Oportunidade" }).selectOption(encontro.combatentes[0].id); await el.getByRole("checkbox", { name: "Gatilho de Oportunidade", exact: true }).check(); await el.getByRole("button", { name: "Rolar Golpe de Oportunidade", exact: true }).click();
   await el.getByRole("alert").filter({ hasText: "Desengajar Impede" }).waitFor(); let mesa = await page.evaluate(() => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0]); assert.equal(mesa.combatentes[1].sessao.especializacaoSessao?.reacoesGastas ?? 0, 0); assert.equal(mesa.combatentes[1].sessao.usos["rodada:uso:golpe-oportunidade"] ?? 0, 0);
   await el.scrollIntoViewIfNeeded(); assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)); await page.screenshot({ path: `.audit/cx3-20261102/${sistema}-${classe}-${largura}-acao-agil-encontro.png` });
   await page.getByRole("button", { name: "Próximo Turno", exact: true }).click(); mesa = await page.evaluate(() => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0]); assert.equal(mesa.combatentes[0].sessao.uso.ativos.acao_agil, undefined);
   await el.getByRole("button", { name: "Rolar Golpe de Oportunidade", exact: true }).click(); await page.waitForFunction(() => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0].combatentes[1].sessao.log.some(r => r.contextoConteudo?.tipo === "golpeOportunidade"));
   await page.reload({ waitUntil: "networkidle" }); mesa = await page.evaluate(() => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0]); assert.equal(mesa.combatentes[0].sessao.uso.ativos.acao_agil, undefined); assert.equal(mesa.combatentes[1].sessao.especializacaoSessao.reacoesGastas, 1);
  }
  assert.deepEqual(erros, []); resultados.push({ sistema, classe, largura, g2, tresAcoes: true, custo: true, semAcaoComumExtra: true, persistencia: true, oportunidadeETermoNoEncontro: !g2, erros }); console.log(`${sistema} ${classe} ${largura} ${g2 ? "G2" : "clássica/Encontro"}: aprovado`); await ctx.close();
 }
} finally { await writeFile(".audit/cx3-20261102/browser-acao-agil-resultados.json", JSON.stringify(resultados, null, 2)); await browser.close(); }
