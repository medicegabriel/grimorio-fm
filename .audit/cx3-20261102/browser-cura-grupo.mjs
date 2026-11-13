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

function ficha(sistema, nome, curador = false, origem = "inato") {
 const c = createBlankAfty(); c.id = nome; c.name = nome; c.rulesVersion = sistema; c.core.nd = 20; c.attrMethod = "fixos";
 c.attributes = { forca: 14, destreza: 12, constituicao: 13, inteligencia: 10, sabedoria: 15, presenca: 8 };
 c.core.origem = { id: origem, bonusAtributos: { sabedoria: 2, destreza: 1 } }; c.attrNivel.sabedoria = 3;
 c.especializacoes = [{ id: "combatente", nivel: 20 }]; c.pericias = { feiticaria: "treinado" };
 c.habilidadesGerais = sistema === "afty" ? ["ger_especializacao", "ger_aptidao"] : [];
 if (curador) {
  c.aptidoes = { cl: 3, er: 4, au: 0, dom: 0, bar: 0 };
  c.aptidoesAmaldicoadas = ["energia_reversa", "liberacao_de_energia_reversa", "cura_em_grupo"];
 }
 return c;
}

const browser = await chromium.launch({ channel: "chrome", ignoreDefaultArgs: ["--hide-scrollbars"] });
const resultados = [];
try {
 for (const sistema of ["player", "afty"]) for (const largura of [1440, 390]) for (const g2 of [false, true]) {
  const c = ficha(sistema, "CX3 Curador", true), a = ficha(sistema, "CX3 Aliado"), h = ficha(sistema, "CX3 Híbrido", false, "feto_amaldicoado_hibrido");
  const d = deriveAfty(c); assert.ok(d.aptidao.disponiveisConteudo.includes("cura_em_grupo"));
  const encontro = criarEncontro({ nome: "CX3 Cura em Grupo na Mesa" });
  encontro.combatentes = [c, a, h].map((f, i) => {
   const df = deriveAfty(f), cmb = definirIniciativa(criarCombatente(f, { derived: df }), 30 - i * 10);
   return { ...cmb, sessao: { ...cmb.sessao, hpAtual: df.hp - (i === 1 ? 2 : 25) } };
  });
  const ctx = await browser.newContext({ viewport: { width: largura, height: 1000 }, isMobile: largura === 390, hasTouch: largura === 390 });
  await ctx.addInitScript(({ sistema, c, encontro }) => {
   if (localStorage.getItem("cx3-cura-grupo")) return;
   localStorage.setItem("cx3-cura-grupo", "1"); localStorage.setItem(`fm_creatures_${sistema}_v1`, JSON.stringify([c]));
   localStorage.setItem("afty_encontros_v1", JSON.stringify([encontro]));
  }, { sistema, c, encontro });
  const page = await ctx.newPage(), erros = [];
  page.on("pageerror", e => erros.push(e.message));
  const abre = async (previa = false) => {
   await page.getByRole("tab", { name: "Habilidades", exact: true }).click();
   if (previa) {
    await page.getByRole("button", { name: "Cura em Grupo. Consultar a regra", exact: true }).click();
    return page.getByRole("dialog", { name: "Consulta: Cura em Grupo", exact: true });
   }
   const el = page.locator('[id="afty-item-aptidao:cura_em_grupo"]');
   const b = el.getByRole("button", { name: "Cura em Grupo", exact: true });
   if (await b.getAttribute("aria-expanded") !== "true") await b.click();
   return el;
  };
  const foca = async () => {
   if (largura === 390) await page.getByRole("button", { name: "Iniciativa", exact: true }).click();
   await page.getByText(c.name, { exact: true }).filter({ visible: true }).first().click();
  };
  const abreMesa = async () => {
   await page.getByRole("button", { name: "Encontros", exact: true }).click();
   await page.getByText(encontro.nome, { exact: true }).click();
  };
  const le = () => page.evaluate(() => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0].combatentes.map(x => x.sessao));

  await page.goto(`http://127.0.0.1:5193/${sistema}${g2 ? "?ficha-g2=1" : ""}`, { waitUntil: "networkidle" });
  await page.getByText(c.name, { exact: true }).click();
  let el = await abre(g2);
  assert.equal(await el.getByRole("button", { name: "Rolar Cura em Grupo", exact: true }).count(), 0);
  if (!g2) {
   await page.getByRole("button", { name: "Voltar", exact: true }).click(); await abreMesa();
   await page.getByRole("button", { name: "Começar", exact: true }).click(); await foca(); el = await abre();
   const antes = await le();
   for (const nome of ["Você", a.name, h.name]) await el.getByRole("checkbox", { name: nome, exact: true }).check();
   const rolar = el.getByRole("button", { name: "Rolar Cura em Grupo", exact: true });
   assert.equal(await rolar.isDisabled(), true);
   await el.getByRole("checkbox", { name: "Todos os Destinatários no Alcance", exact: true }).check();
   await page.evaluate(() => { globalThis.cx3Random = Math.random; Math.random = () => 0.5; });
   try { await rolar.click(); } finally { await page.evaluate(() => { Math.random = globalThis.cx3Random; delete globalThis.cx3Random; }); }
   await page.waitForFunction(() => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0].combatentes[0].sessao.log.some(r => r.contextoCuraGrupo));
   const rodada = await le(), cura = rodada[0].log.find(r => r.contextoCuraGrupo);
   assert.equal(antes[0].peAtual - rodada[0].peAtual, 2);
   assert.deepEqual(rodada.map(s => s.hpAtual), antes.map(s => s.hpAtual));
   await page.reload({ waitUntil: "networkidle" }); await abreMesa(); await foca(); el = await abre();
   const aplicar = el.getByRole("button", { name: "Aplicar Cura em Grupo", exact: true });
   assert.equal(await aplicar.isDisabled(), true);
   const parcelas = [5, 4, cura.total - 9];
   for (const [i, nome] of ["Você", a.name, h.name].entries()) await el.getByRole("spinbutton", { name: `Parcela de ${nome}`, exact: true }).fill(String(parcelas[i]));
   assert.equal(await aplicar.isDisabled(), false);
   assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
   await aplicar.scrollIntoViewIfNeeded();
   await page.screenshot({ path: `.audit/cx3-20261102/${sistema}-${largura}-cura-grupo-encontro.png` });
   await aplicar.click();
   await page.waitForFunction(id => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0].combatentes[0].sessao.log.some(r => r.id === id && r.consequenciasAplicadas), cura.id);
   const fim = await le();
   assert.deepEqual(fim.map((s, i) => s.hpAtual - antes[i].hpAtual), [5, 2, Math.floor(parcelas[2] / 2)]);
   assert.equal(fim[0].peAtual, rodada[0].peAtual); assert.deepEqual(fim[0].uso.acoes, rodada[0].uso.acoes);
   assert.equal(await aplicar.count(), 0);
  }
  assert.deepEqual(erros, []);
  resultados.push({ sistema, largura, g2, catalogo: true, encontro: !g2, persistenciaDaRolagem: !g2 });
  console.log(`${sistema} ${largura} ${g2 ? "G2" : "clássica/Encontro"}: aprovado`); await ctx.close();
 }
} finally {
 await writeFile(".audit/cx3-20261102/browser-cura-grupo-resultados.json", JSON.stringify(resultados, null, 2));
 await browser.close();
}
