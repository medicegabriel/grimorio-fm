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
const { usa } = await import(new URL("ficha/ficha-uso.js", R));
const { abreTesteDeConcentracao } = await import(new URL("ficha/ficha-concentracao.js", R));
const { rolarTeste } = await import(new URL("ficha/ficha-rolagem.js", R));
aplicarAddons([]);
function ficha(sistema, classe, habilidade) {
 const c = createBlankAfty(); c.id = habilidade; c.name = habilidade; c.rulesVersion = sistema; c.core.nd = 20;
 c.core.origem = { id: "inato", bonusAtributos: { sabedoria: 2, destreza: 1 } }; c.attrNivel.sabedoria = 3;
 c.attrMethod = "fixos"; c.attributes = { forca: 14, destreza: 12, constituicao: 13, inteligencia: 10, sabedoria: 15, presenca: 8 };
 c.especializacoes = [{ id: classe, nivel: 20 }]; c.habilidades = [habilidade]; c.pericias = { feiticaria: "treinado" };
 c.habilidadesGerais = sistema === "afty" ? ["ger_especializacao"] : [];
 if (classe === "lutador") { c.treinamentos = { luta: 3 }; c.focosLivres = 10; } return c;
}
const browser = await chromium.launch({ channel: "chrome", ignoreDefaultArgs: ["--hide-scrollbars"] }), resultados = [];
try {
 for (const sistema of ["player", "afty"]) for (const largura of [1440, 390]) {
  const fichas = [ficha(sistema, "lutador", "lut_puxar_um_ar"), ficha(sistema, "combatente", "cmb_revigorar"), ficha(sistema, "combatente", "cmb_surto_de_acao"),
    ficha(sistema, "lutador", "lut_resistir"), ficha(sistema, "conjurador", "cnj_conhecimento_aplicado"), ficha(sistema, "conjurador", "cnj_mente_placida"), ficha(sistema, "combatente", "cmb_indomavel")];
  const oportunidade = ficha(sistema, "restringido", "res_instintos_agucados"); oportunidade.core.origem = { id: "restringido" }; oportunidade.core.tipo = "restringido";
  oportunidade.habilidades = ["res_reacao_rapida", "res_instintos_agucados"]; oportunidade.talentos = ["tal_perceber_oportunidade"]; fichas.push(oportunidade);
  for (const id of ["res_forca_imparavel", "res_barreira_inamovivel", "res_precisao_forcada"]) {
    const c = ficha(sistema, "restringido", id); c.core.origem = { id: "restringido" }; c.core.tipo = "restringido"; c.attrNivel.destreza = 3; c.attrNivel.constituicao = 3;
    if (id === "res_forca_imparavel") c.escolhasHabilidade = { [id]: ["res_imparavel_astucia", "res_imparavel_fortitude"] }; fichas.push(c);
  }
  const sessoes = Object.fromEntries(fichas.map((c) => { const d = deriveAfty(c); return [c.id, { ...S.iniciaCombate(S.sessaoEmBranco(d), d), hpAtual: 1 }]; }));
  sessoes[oportunidade.id].hpAtual = deriveAfty(oportunidade).hp;
  const mente = fichas.find((c) => c.id === "cnj_mente_placida"), dm = deriveAfty(mente);
  sessoes[mente.id] = usa(sessoes[mente.id], dm, { id: "concentracao-ui", nome: "Concentração de Teste", concentracao: true, duracao: { ate: "cena" } }, { opId: "semente-concentracao" }).sessao;
  sessoes[mente.id] = abreTesteDeConcentracao(sessoes[mente.id], "movido", { distancia: 5 }).sessao;
  const indomavel = fichas.find((c) => c.id === "cmb_indomavel"), di = deriveAfty(indomavel), trInd = di.testes.resistencias.find((t) => t.value === "fortitude");
  const falhou = rolarTeste({ rotulo: "Fortitude", bonus: trInd.bonus, cd: 99 }, () => 0);
  sessoes[indomavel.id] = S.registraRolagem(sessoes[indomavel.id], falhou);
  for (const [id, rotulo] of [["res_forca_imparavel", "Reflexos"], ["res_barreira_inamovivel", "Fortitude"]]) {
   const d = deriveAfty(fichas.find((c) => c.id === id)); const tr = d.testes.resistencias.find((t) => t.label === rotulo);
   sessoes[id] = S.registraRolagem(sessoes[id], rolarTeste({ rotulo, bonus: tr.bonus, cd: 99 }, () => 0));
  }
  const ctx = await browser.newContext({ viewport: { width: largura, height: 1000 }, isMobile: largura === 390, hasTouch: largura === 390 });
  await ctx.addInitScript(({ sistema, fichas, sessoes }) => { if (localStorage.getItem("cx3-classe-ui")) return; localStorage.setItem("cx3-classe-ui", "1"); localStorage.setItem(`fm_creatures_${sistema}_v1`, JSON.stringify(fichas)); for (const [id, s] of Object.entries(sessoes)) localStorage.setItem(`fm_ficha_sessao_afty_v1:${id}`, JSON.stringify(s)); }, { sistema, fichas, sessoes });
  const page = await ctx.newPage(), erros = []; page.on("pageerror", (e) => erros.push(e.message));
  await page.goto(`http://127.0.0.1:5193/${sistema}`, { waitUntil: "networkidle" });
  for (const c of fichas) {
   await page.getByText(c.name, { exact: true }).click(); await page.getByRole("tab", { name: "Habilidades", exact: true }).click();
   if (c === oportunidade) {
    const el = page.locator('[id="afty-item-talento:tal_perceber_oportunidade"]'); await el.locator("button[aria-expanded]").click();
    await el.getByRole("combobox", { name: "Arma do Golpe de Oportunidade" }).selectOption("0"); await el.getByText("Gatilho de Oportunidade", { exact: true }).click();
    for (const n of [1, 2]) { await el.getByRole("button", { name: "Rolar Golpe de Oportunidade" }).click(); await page.waitForFunction(({ id, n }) => JSON.parse(localStorage.getItem(`fm_ficha_sessao_afty_v1:${id}`)).usos["rodada:uso:golpe-oportunidade"] === n, { id: c.id, n }); }
    const salva = await page.evaluate((id) => JSON.parse(localStorage.getItem(`fm_ficha_sessao_afty_v1:${id}`)), c.id);
    assert.equal(salva.especializacaoSessao.reacoesGastas, 2); assert.equal(salva.log.filter((r) => r.detalhe === "Perceber Oportunidade" && r.modo === "vantagem").length, 2); assert.equal(salva.uso.acoes.gastas.comum, 0);
    await el.getByRole("button", { name: "Rolar Golpe de Oportunidade" }).click(); await el.getByRole("alert").waitFor();
    await el.scrollIntoViewIfNeeded(); assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)); await page.screenshot({ path: `.audit/cx3-20261102/${sistema}-${largura}-oportunidade.png` });
    await page.getByRole("button", { name: "Voltar", exact: true }).click(); continue;
   }
   const el = page.locator(`[id="afty-item-especializacao:${c.id}"]`); await el.locator("button[aria-expanded]").click();
   const surto = c.id === "cmb_surto_de_acao", concentracao = c.id === "cnj_mente_placida", repetir = c.id === "cmb_indomavel", tr = ["lut_resistir", "cnj_conhecimento_aplicado"].includes(c.id);
   const corrigir = ["res_forca_imparavel", "res_barreira_inamovivel"].includes(c.id), precisao = c.id === "res_precisao_forcada";
   if (tr) { await el.getByRole("combobox", { name: "Teste do Benefício" }).selectOption("fortitude"); await el.getByRole("spinbutton", { name: "PE do Teste" }).fill("2"); }
   if (c.id === "cnj_conhecimento_aplicado") await el.getByText("Contra Efeito de Feitiço", { exact: true }).click();
   if (concentracao) await el.getByRole("spinbutton", { name: "PE de Mente Plácida" }).fill("2");
   if (repetir) { await el.getByRole("combobox", { name: "Teste para Rerrolagem de Classe" }).selectOption(falhou.id); await el.getByText("Consequências Ainda Não Aplicadas", { exact: true }).click(); }
   if (surto || concentracao || tr || repetir || corrigir || precisao) await el.getByText("Descontar PE", { exact: true }).click();
   const nomeRes = { res_forca_imparavel: "Usar Força Imparável", res_barreira_inamovivel: "Usar Barreira Inamovível", res_precisao_forcada: "Usar Precisão Forçada" }[c.id];
   await el.getByRole("button", { name: nomeRes ?? (repetir ? "Repetir Teste de Classe" : surto ? "Usar Surto de Ação" : concentracao ? "Testar Concentração" : tr ? "Realizar Teste" : "Curar"), exact: true }).click();
   const chave = repetir ? "hab:cmb_indomavel" : surto ? "hab:cmb_surto_de_acao" : c.id === "cmb_revigorar" ? "hab:cmb_revigorar" : "cura:cura_puxar_um_ar";
   await page.waitForFunction(({ id, chave, outro, pe, custo }) => { const s = JSON.parse(localStorage.getItem(`fm_ficha_sessao_afty_v1:${id}`)); return outro ? s.peAtual === pe - custo : s.usos[chave] === 1; }, { id: c.id, chave, outro: tr || concentracao || corrigir || precisao, pe: sessoes[c.id].peAtual, custo: precisao ? 3 : 2 });
   const salva = await page.evaluate((id) => JSON.parse(localStorage.getItem(`fm_ficha_sessao_afty_v1:${id}`)), c.id);
   if (surto) { assert.equal(salva.peAtual, sessoes[c.id].peAtual - 5); assert.equal(salva.especializacaoSessao.acoesComuns, 1); }
   else if (concentracao) { assert.equal(salva.uso.teste, null); assert.equal(salva.log[0].rotulo, "Concentração"); }
   else if (tr) assert.equal(salva.log[0].resistenciaId, "fortitude");
   else if (repetir) { assert.equal(salva.peAtual, sessoes[c.id].peAtual - 1); assert.equal(salva.log[0].rerrolagensClasse[0].fonte, "Indomável"); }
   else if (corrigir) assert.equal(salva.log[0].natural, deriveAfty(c).mods[c.id === "res_forca_imparavel" ? "destreza" : "constituicao"]);
   else if (precisao) { assert.equal(salva.combate.precisaoForcada, true); assert.ok(salva.uso.pendencias.some((p) => p.id.startsWith("precisao:"))); }
   else { assert.ok(salva.hpAtual > 1); assert.equal(salva.uso.acoes.gastas.bonus, 1); }
   await el.scrollIntoViewIfNeeded(); assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)); await page.screenshot({ path: `.audit/cx3-20261102/${sistema}-${largura}-${c.id}.png` });
   await page.reload({ waitUntil: "networkidle" }); await page.getByText(c.name, { exact: true }).click();
   assert.equal(await page.evaluate((id) => JSON.parse(localStorage.getItem(`fm_ficha_sessao_afty_v1:${id}`)).peAtual, c.id), salva.peAtual);
   await page.getByRole("button", { name: "Voltar", exact: true }).click();
  }
  assert.deepEqual(erros, []); resultados.push({ sistema, largura, puxarUmAr: true, revigorar: true, surtoDeAcao: true, resistir: true, conhecimentoAplicado: true, mentePlacida: true, indomavel: true, oportunidade: true, forcaImparavel: true, barreiraInamovivel: true, precisaoForcada: true, persistencia: true, erros }); console.log(`${sistema} ${largura}: aprovado`); await ctx.close();
 }
} finally { await writeFile(".audit/cx3-20261102/browser-classes-resultados.json", JSON.stringify(resultados, null, 2)); await browser.close(); }
