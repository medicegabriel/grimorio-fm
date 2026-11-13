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
function ficha(sistema, alvo = false) {
 const c = createBlankAfty(); c.id = alvo ? "CX3 Terra" : "CX3 Deslocador"; c.name = c.id; c.rulesVersion = sistema; c.core.nd = 20; c.attrMethod = "fixos";
 c.attributes = { forca: 15, destreza: 14, constituicao: 13, inteligencia: 10, sabedoria: 12, presenca: 8 }; c.core.origem = { id: "inato", bonusAtributos: { forca: 2, destreza: 1 } };
 c.especializacoes = [{ id: "combatente", nivel: 20 }]; c.pericias = { atletismo: "mestre", feiticaria: "treinado" }; c.habilidadesGerais = sistema === "afty" ? ["ger_especializacao"] : [];
 if (alvo) { c.habilidades = ["cmb_assumir_postura"]; c.escolhasHabilidade = { cmb_assumir_postura: ["cmb_postura_da_terra"] }; c.combate = { ativo: true, postura: "terra" }; }
 else { c.talentos = ["tal_especialista_em_concussao", "tal_tecnicas_ofensivas_de_escudo"]; c.equipamentos.itens = [{ uid: "escudo", tipo: "escudo", refId: "esc_medio", qtd: 1, equipado: true }]; }
 return c;
}
const browser = await chromium.launch({ channel: "chrome", ignoreDefaultArgs: ["--hide-scrollbars"] }), resultados = [];
try {
 for (const sistema of ["player", "afty"]) for (const largura of [1440, 390]) for (const g2 of [false, true]) {
  const c = ficha(sistema), ca = ficha(sistema, true), d = deriveAfty(c), da = deriveAfty(ca);
  assert.deepEqual(d.talentos.inacessiveis, []); assert.deepEqual(da.habilidades.inacessiveis, []); assert.equal(d.habilidades.excedeu, false);
  const sa = { ...S.iniciaCombate(S.sessaoEmBranco(da), da), combate: ca.combate };
  const e = criarEncontro({ nome: "CX3 Imunidade de Terra" }); e.combatentes = [c, ca].map((f, i) => definirIniciativa(criarCombatente(f, { derived: i ? da : d }), i ? 10 : 20)); e.combatentes[1].sessao = structuredClone(sa);
  const ctx = await browser.newContext({ viewport: { width: largura, height: 1000 }, isMobile: largura === 390, hasTouch: largura === 390 });
  await ctx.addInitScript(({ sistema, ca, sa, e }) => { if (localStorage.getItem("cx3-imunidade")) return; localStorage.setItem("cx3-imunidade", "1"); localStorage.setItem(`fm_creatures_${sistema}_v1`, JSON.stringify([ca])); localStorage.setItem(`fm_ficha_sessao_afty_v1:${ca.id}`, JSON.stringify(sa)); localStorage.setItem("afty_encontros_v1", JSON.stringify([e])); }, { sistema, ca, sa, e });
  const page = await ctx.newPage(), erros = []; page.on("pageerror", e => erros.push(e.message));
  const le = () => page.evaluate(() => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0]);
  const rngClique = async (el, n) => { await page.evaluate(n => { globalThis.cx3Random = Math.random; Math.random = () => n; }, n); try { await el.click(); } finally { await page.evaluate(() => { Math.random = globalThis.cx3Random; delete globalThis.cx3Random; }); } };
  const abre = async (id, nome) => { await page.getByRole("tab", { name: "Habilidades", exact: true }).click(); const el = page.locator(`[id="afty-item-talento:${id}"]`); const b = el.getByRole("button", { name: nome, exact: true }); if (await b.getAttribute("aria-expanded") !== "true") await b.click(); return el; };
  const queda = async (individual) => {
   await page.getByRole("tab", { name: individual && g2 ? /^Efeitos/ : "Buffs", exact: !(individual && g2) }).click();
   if (individual && g2) {
    await page.getByRole("button", { name: "Adicionar", exact: true }).click(); await page.getByRole("tab", { name: "Fonte Externa", exact: true }).click();
    const form = page.getByRole("form", { name: "Registrar fonte externa", exact: true }); await form.getByRole("radio", { name: "Condição", exact: true }).click(); await form.getByRole("combobox", { name: "Condição", exact: true }).selectOption("Caído"); await form.getByRole("button", { name: "Registrar", exact: true }).click();
   } else {
    await page.getByRole("button", { name: "Adicionar Condição", exact: true }).click();
    const gaveta = page.getByRole("dialog", { name: "Aplicar Condição", exact: true }); await gaveta.getByRole("textbox", { name: "Filtrar as condições" }).fill("Caído"); const botaoCaido = gaveta.getByRole("button", { name: /^Caído(?: Aplicada)?$/ }); await botaoCaido.click();
    if (await gaveta.isVisible()) {
     if (await botaoCaido.getAttribute("aria-pressed") !== "true") await botaoCaido.click();
     if (await gaveta.isVisible()) await gaveta.getByRole("button", { name: "Fechar", exact: true }).click();
    }
   }
   const ler = () => page.evaluate(individual => individual ? JSON.parse(localStorage.getItem("fm_ficha_sessao_afty_v1:CX3 Terra")) : JSON.parse(localStorage.getItem("afty_encontros_v1"))[0].combatentes[1].sessao, individual);
   await page.waitForFunction(individual => { const s = individual ? JSON.parse(localStorage.getItem("fm_ficha_sessao_afty_v1:CX3 Terra")) : JSON.parse(localStorage.getItem("afty_encontros_v1"))[0].combatentes[1].sessao; return s.condicoes.some(c => c.nome === "Caído"); }, individual);
   let s = await ler(); assert.equal(s.combate.postura, null); assert.ok(s.condicoes.some(c => c.nome === "Caído"));
   if (individual && g2) { await page.locator('[data-chave-ativo^="condicao:"]').click(); await page.getByRole("region", { name: "Caído", exact: true }).getByRole("button", { name: "Encerrar", exact: true }).click(); }
   else await page.getByRole("button", { name: "Remover Caído", exact: true }).click();
   await page.waitForFunction(individual => { const s = individual ? JSON.parse(localStorage.getItem("fm_ficha_sessao_afty_v1:CX3 Terra")) : JSON.parse(localStorage.getItem("afty_encontros_v1"))[0].combatentes[1].sessao; return s.condicoes.length === 0; }, individual, { timeout: 5000 }).catch(async e => { console.log(JSON.stringify({ debugCondicoes: (await ler()).condicoes, corpo: (await page.locator("body").innerText()).slice(-1800) })); throw e; });
   s = await ler(); assert.equal(s.combate.postura, null); assert.equal(s.condicoes.length, 0);
  };
  await page.goto(`http://127.0.0.1:5193/${sistema}${g2 ? "?ficha-g2=1" : ""}`, { waitUntil: "networkidle" }); await page.getByText(ca.name, { exact: true }).click();
  console.log(JSON.stringify({ sistema, largura, g2, url: page.url(), abas: await page.getByRole("tab").allTextContents(), estrutura: await page.locator("#afty-ficha").getAttribute("data-afty-estrutura") }));
  await queda(true); await page.reload({ waitUntil: "networkidle" }); assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem("fm_ficha_sessao_afty_v1:CX3 Terra")).combate.postura), null);
  if (!g2) {
   await page.getByRole("button", { name: "Encontros", exact: true }).click(); await page.getByText(e.nome, { exact: true }).click(); await page.getByRole("button", { name: "Começar", exact: true }).click();
   const foco = async nome => { if (largura === 390) await page.getByRole("button", { name: "Iniciativa", exact: true }).click(); for (const b of await page.getByText(nome, { exact: true }).all()) if (await b.isVisible()) { await b.click(); return; } throw Error(nome); };
   await foco(c.name); await page.getByRole("tab", { name: "Ações", exact: true }).click(); const basico = page.locator('[id="afty-item-dano:basico"]'), linha = d.dano.entradas.find(l => l.id === "basico");
   await rngClique(basico.getByRole("button", { name: `+${linha.acerto}`, exact: true }), 0.9); await rngClique(basico.locator("button.afty-rolavel").last(), 0.5);
   let mesa = await le(), s = mesa.combatentes[0].sessao, at = s.log.find(r => r.tipoTeste === "ataque"), dano = s.log.find(r => r.tipo === "dano");
   assert.equal(mesa.combatentes[1].sessao.combate.postura, "terra");
   await page.getByRole("combobox", { name: "Ataque a Confirmar" }).selectOption(at.id); await page.getByRole("combobox", { name: "Alvo do Ataque" }).selectOption(e.combatentes[1].id); await page.getByRole("combobox", { name: "Dano do Ataque" }).selectOption(dano.id); await page.getByRole("button", { name: "Confirmar Ataque e Aplicar Dano", exact: true }).click();
   await page.waitForFunction(() => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0].combatentes[0].sessao.log.some(r => r.rotulo === "Ataque Confirmado"));
   mesa = await le(); const confirmado = mesa.combatentes[0].sessao.log.find(r => r.rotulo === "Ataque Confirmado"); if (!confirmado.calculos.some(r => r.final > 0)) console.log(JSON.stringify({ falhaAtaque: confirmado, ataque: at, dano, defesa: da.defesa })); assert.ok(confirmado.calculos.some(r => r.final > 0));
   let el = await abre("tal_especialista_em_concussao", "Especialista em Concussão"); await el.getByRole("combobox", { name: "Acerto para Deslocar" }).selectOption(at.id); await el.getByRole("combobox", { name: "Alvo do Deslocamento" }).selectOption(e.combatentes[1].id); await el.getByRole("checkbox", { name: "Espaço Desocupado", exact: true }).check();
   const antes = await le(); await el.getByRole("button", { name: "Mover Alvo", exact: true }).click(); assert.equal(await el.getByRole("alert").innerText(), "Alvo Imune a Movimento Forçado"); assert.deepEqual((await le()).combatentes.map(c => c.sessao), antes.combatentes.map(c => c.sessao));
   await el.scrollIntoViewIfNeeded(); assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)); await page.screenshot({ path: `.audit/cx3-20261102/${sistema}-${largura}-imunidade.png` });
   el = await abre("tal_tecnicas_ofensivas_de_escudo", "Técnicas Agressivas de Escudo"); await el.getByRole("combobox", { name: "Ataque do Gatilho de Escudo" }).selectOption(at.id); await el.getByRole("combobox", { name: "Alvo do Empurrão de Escudo" }).selectOption(e.combatentes[1].id); await el.getByRole("checkbox", { name: "Alvo no Alcance do Escudo", exact: true }).check(); await el.getByRole("button", { name: "Rolar Empurrão de Escudo", exact: true }).click();
   assert.equal(await el.getByRole("alert").innerText(), "Alvo Imune a Movimento Forçado"); assert.deepEqual((await le()).combatentes.map(c => c.sessao), antes.combatentes.map(c => c.sessao));
   await foco(ca.name); await queda(false); await page.reload({ waitUntil: "networkidle" }); mesa = await le(); assert.equal(mesa.combatentes[1].sessao.combate.postura, null);
   await page.getByRole("button", { name: "Encontros", exact: true }).click(); await page.getByText(e.nome, { exact: true }).click(); await foco(c.name);
   el = await abre("tal_especialista_em_concussao", "Especialista em Concussão"); await el.getByRole("combobox", { name: "Acerto para Deslocar" }).selectOption(at.id); await el.getByRole("combobox", { name: "Alvo do Deslocamento" }).selectOption(e.combatentes[1].id); await el.getByRole("checkbox", { name: "Espaço Desocupado", exact: true }).check(); await el.getByRole("button", { name: "Mover Alvo", exact: true }).click();
   await page.waitForFunction(() => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0].combatentes[0].sessao.log.some(r => r.rotulo === "Especialista em Concussão" && r.deslocamento === 3));
  }
  assert.deepEqual(erros, []); resultados.push({ sistema, largura, g2, quedaFicha: true, encontro: !g2, erros }); console.log(`${sistema} ${largura} ${g2 ? "G2" : "clássica/Encontro"}: aprovado`); await ctx.close();
 }
} finally { await writeFile(".audit/cx3-20261102/browser-imunidade-resultados.json", JSON.stringify(resultados, null, 2)); await browser.close(); }
