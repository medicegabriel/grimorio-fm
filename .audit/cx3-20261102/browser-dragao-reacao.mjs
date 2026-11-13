import { register } from "node:module";
register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}', import.meta.url);
import { chromium } from "playwright";
import assert from "node:assert/strict";

const R = new URL("../../src/systems/afty/", import.meta.url);
const { deriveAfty } = await import(new URL("afty-derive.js", R));
const { createBlankAfty } = await import(new URL("afty-schema.js", R));
const { aplicarAddons } = await import(new URL("afty-addons.js", R));
const S = await import(new URL("ficha/ficha-sessao.js", R));
const { criarEncontro, criarCombatente, definirIniciativa } = await import(new URL("encontros/afty-encontro.js", R));
aplicarAddons([]);

function ficha(sistema, nome, postura = false) {
 const c = createBlankAfty(); c.id = nome; c.name = nome; c.rulesVersion = sistema; c.core.nd = 12; c.attrMethod = "fixos";
 c.attributes = { forca: 15, destreza: 14, constituicao: 13, inteligencia: 10, sabedoria: 12, presenca: 8 };
 c.core.origem = { id: "inato", bonusAtributos: { forca: 2, destreza: 1 } };
 c.especializacoes = [{ id: "combatente", nivel: 12 }]; c.pericias = { feiticaria: "treinado" };
 c.habilidadesGerais = sistema === "afty" ? ["ger_especializacao"] : [];
 c.habilidades = postura ? ["cmb_assumir_postura"] : [];
 c.escolhasHabilidade = postura ? { cmb_assumir_postura: ["cmb_postura_do_dragao", "cmb_postura_do_sol"] } : {};
 c.equipamentos.itens = [{ uid: "espada", tipo: "arma", refId: "arm_espada_curta", qtd: 1, equipado: true }];
 return c;
}

const browser = await chromium.launch({ channel: "chrome", ignoreDefaultArgs: ["--hide-scrollbars"] });
const antesDoPatch = process.argv.includes("--antes");
try {
 for (const sistema of (process.argv.includes("--afty") ? ["afty"] : ["player", "afty"])) for (const largura of [1440, 390]) for (const g2 of (antesDoPatch ? [false] : [false, true])) {
  const c = ficha(sistema, "CX3 Dragão", true), d = deriveAfty(c);
  const original = ficha(sistema, "CX3 Alvo Original"), vizinho = ficha(sistema, "CX3 Vizinho");
  for (const alvo of [original, vizinho]) {
   alvo.core.nd = 3;
   alvo.especializacoes[0].nivel = 3;
  }
  vizinho.aptidoes.cl = 1;
  vizinho.aptidoesAmaldicoadas = ["cobrir_se"];
  assert.ok(deriveAfty(vizinho).aptidao.disponiveisConteudo.includes("cobrir_se"));
  assert.deepEqual(d.habilidades.inacessiveis, []); assert.equal(d.habilidades.excedeu, false);
  const s = { ...S.iniciaTurnoFicha(S.iniciaCombate(S.sessaoEmBranco(d), d), d), rodada: 1 };
  const encontro = criarEncontro({ nome: "CX3 Dragão na Mesa" });
  encontro.combatentes = [c, original, vizinho].map((f, i) => definirIniciativa(criarCombatente(f, { derived: deriveAfty(f) }), 30 - i * 10));
  const ctx = await browser.newContext({ viewport: { width: largura, height: 1000 }, isMobile: largura === 390, hasTouch: largura === 390 });
  await ctx.addInitScript(({ sistema, c, s, encontro }) => {
   if (localStorage.getItem("cx3-dragao")) return;
   localStorage.setItem("cx3-dragao", "1"); localStorage.setItem(`fm_creatures_${sistema}_v1`, JSON.stringify([c]));
   localStorage.setItem(`fm_ficha_sessao_afty_v1:${c.id}`, JSON.stringify(s));
   localStorage.setItem("afty_encontros_v1", JSON.stringify([encontro]));
  }, { sistema, c, s, encontro });
  const page = await ctx.newPage(), erros = [];
  page.on("pageerror", e => erros.push(e.message));
  const abre = async (previa = false) => {
   await page.getByRole("tab", { name: "Habilidades", exact: true }).click();
   if (previa) {
    await page.getByRole("button", { name: "Assumir Postura. Consultar a regra", exact: true }).click();
    return page.getByRole("dialog", { name: "Consulta: Assumir Postura", exact: true });
   }
   const el = page.locator('[id="afty-item-especializacao:cmb_assumir_postura"]');
   const b = el.getByRole("button", { name: "Assumir Postura", exact: true });
   if (await b.getAttribute("aria-expanded") !== "true") await b.click();
   return el;
  };
  const foca = async nome => {
   if (largura === 390) await page.getByRole("button", { name: "Iniciativa", exact: true }).click();
   await page.getByText(nome, { exact: true }).filter({ visible: true }).first().click();
  };
  const entra = async el => {
   await el.getByRole("combobox", { name: "Postura para Assumir", exact: true }).selectOption("dragao");
   await el.getByRole("button", { name: "Entrar em Postura", exact: true }).click();
   await el.getByRole("button", { name: "Rolar Fortitude do Dragão", exact: true }).waitFor();
  };
  const vicia = async (el, valor) => {
   await page.evaluate(v => { globalThis.cx3Random = Math.random; Math.random = () => v; }, valor);
   try { await el.press("Enter"); } finally { await page.evaluate(() => { Math.random = globalThis.cx3Random; delete globalThis.cx3Random; }); }
  };
  const le = () => page.evaluate(() => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0]);
  const abreMesa = async () => {
   await page.getByRole("button", { name: "Encontros", exact: true }).click();
   await page.getByText(encontro.nome, { exact: true }).click();
  };

  await page.goto(`${process.env.CX3_URL ?? "http://127.0.0.1:5196"}/${sistema}${g2 ? "?ficha-g2=1" : ""}`, { waitUntil: "networkidle" });
  await page.getByText(c.name, { exact: true }).click();
  let el = await abre(g2); await entra(el);
  assert.equal(await el.getByRole("button", { name: "Rolar Fortitude do Dragão", exact: true }).isDisabled(), true);
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));

  if (!g2) {
   await page.getByRole("button", { name: "Voltar", exact: true }).click(); await abreMesa();
   await page.getByRole("button", { name: "Começar", exact: true }).click(); await foca(c.name);
   el = await abre(); await entra(el);
   await page.getByRole("tab", { name: "Ações", exact: true }).click();
   const arma = page.locator('[id="afty-item-dano:arm_espada_curta"]');
   const linha = d.dano.entradas.find(l => l.id === "arm_espada_curta");
   await vicia(arma.getByRole("button", { name: `+${linha.acerto}`, exact: true }), 0.999);
   await page.waitForFunction(() => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0].combatentes[0].sessao.log.some(r => r.tipoTeste === "ataque"));
   await vicia(arma.locator("button.afty-rolavel").last(), 0.99);
   await page.waitForFunction(() => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0].combatentes[0].sessao.log.some(r => r.tipo === "dano"));
   const jogadas = (await le()).combatentes[0].sessao.log;
   const atk = jogadas.find(r => r.tipoTeste === "ataque"), dano = jogadas.find(r => r.tipo === "dano");
   assert.equal(atk.contextoTurno.posturaDragao, true); assert.equal(dano.critico, true);
   await page.getByRole("combobox", { name: "Ataque a Confirmar" }).selectOption(atk.id);
   await page.getByRole("combobox", { name: "Dano do Ataque" }).selectOption(dano.id);
   await page.getByRole("combobox", { name: "Alvo do Ataque" }).selectOption(encontro.combatentes[1].id);
   await page.getByRole("button", { name: "Confirmar Ataque e Aplicar Dano", exact: true }).click();
   await page.waitForFunction(() => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0].combatentes[0].sessao.log.some(r => r.rotulo === "Ataque Confirmado"));
   const antes = (await le()).combatentes.map(x => x.sessao);
   const seleciona = async () => {
    el = await abre();
    await el.getByRole("combobox", { name: "Ataque Original do Dragão" }).selectOption(atk.id);
    const alvo = el.getByRole("combobox", { name: "Inimigo Próximo do Alvo do Dragão" });
    assert.equal(await alvo.locator(`option[value="${encontro.combatentes[1].id}"]`).count(), 0);
    await alvo.selectOption(encontro.combatentes[2].id);
   };
   await seleciona();
   await el.getByRole("checkbox", { name: "Em 1,5m do Alvo Original", exact: true }).check();
   await el.getByRole("checkbox", { name: "Inimigo", exact: true }).check();
   await vicia(el.getByRole("button", { name: "Rolar Fortitude do Dragão", exact: true }), 0);
   await page.waitForFunction(() => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0].combatentes[2].sessao.log.some(r => r.contextoConteudo?.tipo === "posturaDragao"));
   assert.equal((await le()).combatentes[2].sessao.hpAtual, antes[2].hpAtual);
   await page.reload({ waitUntil: "networkidle" }); await abreMesa(); await foca(c.name); await seleciona();
   const pendente = (await le()).combatentes.map(x => x.sessao);
   await el.getByRole("button", { name: "Concluir Dragão", exact: true }).click();
   if (!antesDoPatch) {
    await el.getByRole("combobox", { name: "Reação ao Dano" }).selectOption("cobrir");
    assert.deepEqual((await le()).combatentes.map(x => x.sessao), pendente);
    await el.getByRole("button", { name: "Aplicar Dano", exact: true }).click();
   }
   await page.waitForFunction(() => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0].combatentes[0].sessao.log.some(r => r.rotulo === "Postura do Dragão" && r.tr));
   const depois = (await le()).combatentes.map(x => x.sessao);
   const r = depois[0].log.find(r => r.rotulo === "Postura do Dragão" && r.tr);
   assert.equal(r.tr.resultado, "falha");
   assert.equal(r.calculos[0].base, Math.floor(antes[0].log.find(r => r.rotulo === "Ataque Confirmado").calculos[0].final / 2));
   assert.ok(r.calculos[0].final > 0);
   assert.equal(depois[2].hpAtual, Math.max(0, antes[2].hpAtual - Math.max(0, r.calculos[0].final - (antesDoPatch ? 0 : 4))));
   assert.equal(depois[1].hpAtual, antes[1].hpAtual);
   assert.equal(depois[2].peAtual, pendente[2].peAtual - (antesDoPatch ? 0 : 1));
   assert.equal(r.reacaoDano?.id, antesDoPatch ? undefined : "cobrir");
   console.log(JSON.stringify({ sistema, largura, antesDoPatch, danoLiquido: r.calculos[0].final,
    pvAntes: antes[2].hpAtual, pvDepois: depois[2].hpAtual, reacao: r.reacaoDano ?? null }));
   assert.equal(depois[0].peAtual, antes[0].peAtual); assert.deepEqual(depois[0].uso.acoes, antes[0].uso.acoes);
   const concluir = el.getByRole("button", { name: "Concluir Dragão", exact: true });
   if (await concluir.count()) assert.equal(await concluir.isDisabled(), true);
   assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  }
  assert.deepEqual(erros, []);
  console.log(`${sistema} ${largura} ${g2 ? "G2" : "clássica/Encontro"}: aprovado`); await ctx.close();
 }
} finally {
 await browser.close();
}
