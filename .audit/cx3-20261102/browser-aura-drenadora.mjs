import { register } from "node:module";
register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}', import.meta.url);
import { chromium } from "playwright";
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
const R = new URL("../../src/systems/afty/", import.meta.url);
const { deriveAfty } = await import(new URL("afty-derive.js", R));
const { createBlankAfty } = await import(new URL("afty-schema.js", R));
const { aplicarAddons } = await import(new URL("afty-addons.js", R));
const { aplicaDano } = await import(new URL("ficha/ficha-sessao.js", R));
const { criarEncontro, criarCombatente, definirIniciativa } = await import(new URL("encontros/afty-encontro.js", R));
aplicarAddons([]);

function ficha(sistema, nome, aura = false) {
 const c = createBlankAfty(); c.id = nome; c.name = nome; c.rulesVersion = sistema; c.core.nd = 12; c.attrMethod = "fixos";
 c.attributes = { forca: 15, destreza: 14, constituicao: 13, inteligencia: 10, sabedoria: 12, presenca: 8 };
 c.core.origem = { id: "inato", bonusAtributos: { forca: 2, destreza: 1 } };
 c.especializacoes = [{ id: "combatente", nivel: 12 }]; c.pericias = { feiticaria: "treinado" };
 c.habilidadesGerais = sistema === "afty" ? ["ger_especializacao", ...(aura ? ["ger_aptidao"] : [])] : [];
 c.equipamentos.itens = [{ uid: "espada", tipo: "arma", refId: "arm_espada_curta", qtd: 1, equipado: true }];
 if (aura) { c.aptidoes = { au: 2, cl: 0, er: 0, dom: 0, bar: 0 }; c.aptidoesAmaldicoadas = ["aura_drenadora"]; }
 return c;
}

const browser = await chromium.launch({ channel: "chrome", ignoreDefaultArgs: ["--hide-scrollbars"] });
const resultados = [];
try {
 for (const sistema of ["player", "afty"]) for (const largura of [1440, 390]) {
  const c = ficha(sistema, "CX3 Aura Drenadora", true), d = deriveAfty(c);
  const inimigos = [ficha(sistema, "CX3 Primeiro Inimigo"), ficha(sistema, "CX3 Segundo Inimigo")];
  assert.ok(d.aptidao.disponiveisConteudo.includes("aura_drenadora"));
  const encontro = criarEncontro({ nome: "CX3 Dreno na Mesa" });
  encontro.combatentes = [c, ...inimigos].map((f, i) => {
   const df = deriveAfty(f), cmb = definirIniciativa(criarCombatente(f, { derived: df }), 30 - i * 10);
   if (i === 0) return cmb;
   const queda = aplicaDano(cmb.sessao, df.hp + 1, df, { ataqueId: "queda" });
   const falha = aplicaDano(queda, 1, df, { ataqueId: "falha-1" });
   return { ...cmb, sessao: aplicaDano(falha, 1, df, { ataqueId: "falha-2" }) };
  });
  const ctx = await browser.newContext({ viewport: { width: largura, height: 1000 }, isMobile: largura === 390, hasTouch: largura === 390 });
  await ctx.addInitScript(({ sistema, c, encontro }) => {
   if (localStorage.getItem("cx3-drenadora")) return;
   localStorage.setItem("cx3-drenadora", "1"); localStorage.setItem(`fm_creatures_${sistema}_v1`, JSON.stringify([c]));
   localStorage.setItem("afty_encontros_v1", JSON.stringify([encontro]));
  }, { sistema, c, encontro });
  const page = await ctx.newPage(), erros = []; page.on("pageerror", e => erros.push(e.message));
  const vicia = async (el, valor) => {
   await page.evaluate(v => { globalThis.cx3Random = Math.random; Math.random = () => v; }, valor);
   try { await el.click(); } finally { await page.evaluate(() => { Math.random = globalThis.cx3Random; delete globalThis.cx3Random; }); }
  };
  const le = () => page.evaluate(() => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0].combatentes.map(x => x.sessao));
  await page.goto(`http://127.0.0.1:5193/${sistema}`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Encontros", exact: true }).click();
  await page.getByText(encontro.nome, { exact: true }).click();
  await page.getByRole("button", { name: "Começar", exact: true }).click();
  if (largura === 390) await page.getByRole("button", { name: "Iniciativa", exact: true }).click();
  await page.getByText(c.name, { exact: true }).filter({ visible: true }).first().click();
  await page.getByRole("tab", { name: "Ações", exact: true }).click();
  const arma = page.locator('[id="afty-item-dano:arm_espada_curta"]'), linha = d.dano.entradas.find(l => l.id === "arm_espada_curta");
  const ganho = 10 + d.mods.constituicao;
  for (const i of [1, 2]) {
   const antes = (await le())[0].log;
   await vicia(arma.getByRole("button", { name: `+${linha.acerto}`, exact: true }), 0.999);
   await page.waitForFunction(n => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0].combatentes[0].sessao.log.length > n, antes.length);
   const atk = (await le())[0].log.find(r => r.tipoTeste === "ataque");
   await vicia(arma.locator("button.afty-rolavel").last(), 0.5);
   const dano = (await le())[0].log.find(r => r.tipo === "dano" && r.armaId === linha.id);
   await page.getByRole("combobox", { name: "Ataque a Confirmar" }).selectOption(atk.id);
   await page.getByRole("combobox", { name: "Dano do Ataque" }).selectOption(dano.id);
   await page.getByRole("combobox", { name: "Alvo do Ataque" }).selectOption(encontro.combatentes[i].id);
   await vicia(page.getByRole("button", { name: "Confirmar Ataque e Aplicar Dano", exact: true }), 0.5);
   await page.waitForFunction(n => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0].combatentes[n].sessao.vital.estado === "morto", i);
   assert.equal((await le())[0].pvTempFontes["Aura Drenadora"], i * ganho);
  }
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.screenshot({ path: `.audit/cx3-20261102/${sistema}-${largura}-aura-drenadora-encontro.png` });
  await page.reload({ waitUntil: "networkidle" });
  const depois = await le(); assert.equal(depois[0].pvTempFontes["Aura Drenadora"], 2 * ganho);
  assert.equal(depois[0].log.filter(r => r.rotulo === "Aura Drenadora").length, 2);
  assert.deepEqual(erros, []);
  resultados.push({ sistema, largura, ganho, saldo: 2 * ganho, gravacao: true });
  console.log(`${sistema} ${largura}: aprovado`); await ctx.close();
 }
} finally {
 await writeFile(".audit/cx3-20261102/browser-aura-drenadora-resultados.json", JSON.stringify(resultados, null, 2));
 await browser.close();
}
