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

function ficha(sistema, nome) {
 const c = createBlankAfty(); c.id = nome; c.name = nome; c.rulesVersion = sistema; c.core.nd = 12; c.attrMethod = "fixos";
 c.attributes = { forca: 15, destreza: 14, constituicao: 13, inteligencia: 10, sabedoria: 12, presenca: 8 };
 c.core.origem = { id: "inato", bonusAtributos: { forca: 2, destreza: 1 } };
 c.especializacoes = [{ id: "combatente", nivel: 12 }]; c.pericias = { atletismo: "treinado", feiticaria: "treinado" };
 c.habilidadesGerais = sistema === "afty" ? ["ger_especializacao", "ger_aptidao"] : [];
 c.talentos = ["tal_saltador_constante"];
 c.aptidoes = { cl: 3, er: 0, au: 0, dom: 0, bar: 0 }; c.aptidoesAmaldicoadas = ["estimulo_muscular"];
 return c;
}

const browser = await chromium.launch({ channel: "chrome", ignoreDefaultArgs: ["--hide-scrollbars"] });
const resultados = [];
try {
 for (const sistema of ["player", "afty"]) for (const largura of [1440, 390]) for (const g2 of [false, true]) {
  const c = ficha(sistema, "CX3 Saltador"), d = deriveAfty(c), alvo = ficha(sistema, "CX3 Outro");
  assert.deepEqual(d.talentos.inacessiveis, []);
  const s = { ...S.iniciaTurnoFicha(S.iniciaCombate(S.sessaoEmBranco(d), d), d), rodada: 1 };
  const encontro = criarEncontro({ nome: "CX3 Pular na Mesa" });
  encontro.combatentes = [c, alvo].map((f, i) => definirIniciativa(criarCombatente(f, { derived: deriveAfty(f) }), 30 - i * 10));
  const ctx = await browser.newContext({ viewport: { width: largura, height: 1000 }, isMobile: largura === 390, hasTouch: largura === 390 });
  await ctx.addInitScript(({ sistema, c, s, encontro }) => {
   if (localStorage.getItem("cx3-pular")) return;
   localStorage.setItem("cx3-pular", "1"); localStorage.setItem(`fm_creatures_${sistema}_v1`, JSON.stringify([c]));
   localStorage.setItem(`fm_ficha_sessao_afty_v1:${c.id}`, JSON.stringify(s));
   localStorage.setItem("afty_encontros_v1", JSON.stringify([encontro]));
  }, { sistema, c, s, encontro });
  const page = await ctx.newPage(), erros = [];
  page.setDefaultTimeout(7500);
  page.on("pageerror", e => erros.push(e.message));
  const inicia = () => page.getByRole("button", { name: "Iniciar Pulo", exact: true }).click();
  const conclui = () => page.getByRole("button", { name: "Concluir Pulo", exact: true }).click();
  const distancia = () => page.getByRole("spinbutton", { name: "Distância Percorrida no Pulo" }).inputValue();
  const acoes = () => page.getByRole("tab", { name: "Ações", exact: true }).click();
  const semOverflow = () => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
  const saltador = () => page.getByRole("checkbox", { name: "Pulo Livre de Saltador" });
  const parede = () => page.getByRole("checkbox", { name: "Junto a Parede ou Objeto" });
  const le = () => page.evaluate(() => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0]);
  const foca = async () => {
   const lista = page.getByRole("button", { name: "Iniciativa", exact: true });
   if (largura === 390 && await lista.isVisible()) await lista.click();
   await page.getByText(c.name, { exact: true }).filter({ visible: true }).first().click();
  };

  await page.goto(`http://127.0.0.1:5193/${sistema}${g2 ? "?ficha-g2=1" : ""}`, { waitUntil: "networkidle" });
  await page.getByText(c.name, { exact: true }).click();
  await acoes(); await inicia(); assert.equal(await distancia(), "6");
  await parede().check(); await conclui(); await saltador().check();
  await inicia(); assert.equal(await distancia(), "3");
  await conclui(); assert.equal(await saltador().count(), 0);
  assert.ok(await semOverflow());
  if (g2) await page.screenshot({ path: `.audit/cx3-20261102/${sistema}-${largura}-pular-g2.png` });

  if (!g2) {
   await page.getByRole("button", { name: "Voltar", exact: true }).click();
   await page.getByRole("button", { name: "Encontros", exact: true }).click();
   await page.getByText(encontro.nome, { exact: true }).click();
   await page.getByRole("button", { name: "Começar", exact: true }).click();
   await foca(); await acoes();
   await page.getByRole("checkbox", { name: "Estímulo Muscular (1 PE)" }).check();
   await inicia(); assert.equal(await distancia(), "12");
   await page.waitForFunction(() => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0].combatentes[0].sessao.log.some(r => r.contextoPulo));
   await page.reload({ waitUntil: "networkidle" });
   await page.getByRole("button", { name: "Encontros", exact: true }).click();
   await page.getByText(encontro.nome, { exact: true }).click();
   await foca();
   await acoes(); assert.equal(await distancia(), "12");
   assert.ok(await semOverflow());
   if (largura === 390) {
    await page.getByRole("button", { name: "Concluir Pulo", exact: true }).scrollIntoViewIfNeeded();
    await page.screenshot({ path: `.audit/cx3-20261102/${sistema}-${largura}-pular-encontro.png` });
   }
   const alvoId = encontro.combatentes[1].id;
   const alcance = page.getByRole("combobox", { name: "Alvo em Alcance Corpo a Corpo ao Aterrissar" });
   await alcance.selectOption(alvoId);
   await parede().check(); await conclui(); await saltador().check();
   await inicia(); assert.equal(await distancia(), "3");
   await alcance.selectOption(alvoId); await conclui();
   await page.waitForFunction(() => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0].combatentes[0].sessao.log.filter(r => r.contextoPulo && r.consequenciasAplicadas).length === 2);
   const mesa = await le(), saltos = mesa.combatentes[0].sessao.log.filter(r => r.contextoPulo).map(r => [r.contextoPulo.distancia, r.contextoPulo.livre]);
   assert.deepEqual(saltos, [[3, true], [12, false]]);
   const linha = d.dano.entradas.find(l => l.fonte === "basico");
   const arma = page.locator('[id="afty-item-dano:' + linha.id + '"]');
   const vicia = async (el, valor) => {
    await page.evaluate(v => { globalThis.cx3Random = Math.random; Math.random = () => v; }, valor);
    try { await el.click(); } finally { await page.evaluate(() => { Math.random = globalThis.cx3Random; delete globalThis.cx3Random; }); }
   };
   const alvoDefesa = deriveAfty(alvo).defesa;
   const natural = alvoDefesa - linha.acerto - 1;
   assert.ok(natural > 1 && natural < 20);
   await vicia(arma.getByRole("button", { name: "+" + linha.acerto, exact: true }), (natural - 0.5) / 20);
   await vicia(arma.locator("button.afty-rolavel").last(), 0.5);
   await page.waitForFunction(() => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0].combatentes[0].sessao.log.some(r => r.tipo === "dano"));
   const jogadas = (await le()).combatentes[0].sessao.log;
   const atk = jogadas.find(r => r.tipoTeste === "ataque"), dano = jogadas.find(r => r.tipo === "dano");
   assert.equal(atk.total, alvoDefesa - 1);
   await page.getByRole("combobox", { name: "Ataque a Confirmar" }).selectOption(atk.id);
   await page.getByRole("combobox", { name: "Dano do Ataque" }).selectOption(dano.id);
   await page.getByRole("combobox", { name: "Alvo do Ataque" }).selectOption(alvoId);
   await page.getByRole("button", { name: "Confirmar Ataque e Aplicar Dano", exact: true }).click();
   await page.waitForFunction(() => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0].combatentes[0].sessao.log.some(r => r.fontesSaltador));
   const sessao = (await le()).combatentes[0].sessao, resultado = sessao.log.find(r => r.fontesSaltador);
   assert.equal(resultado.ataque.acertou, true);
   assert.equal(resultado.totalAtaque, alvoDefesa + 1);
   assert.deepEqual(resultado.fontesSaltador.map(x => x.valor), [2, d.mods.forca]);
   assert.equal(resultado.calculos.reduce((soma, x) => soma + x.base, 0), dano.total + d.mods.forca);
   assert.equal(sessao.uso.pendencias.filter(p => p.id.startsWith("saltador:")).length, 0);
   resultados.push({ sistema, largura, encontro: true, saltos, recarga: true, saltador: { acerto: 2, dano: d.mods.forca } });
  }
  assert.deepEqual(erros, []);
  resultados.push({ sistema, largura, ficha: g2 ? "g2" : "classica", comum: 6, livre: 3 });
  console.log(sistema, largura, g2 ? "g2" : "classica e encontro", "OK");
  await ctx.close();
 }
} finally {
 await writeFile(new URL("browser-pular-resultados.json", import.meta.url), JSON.stringify(resultados, null, 2));
 await browser.close();
}



