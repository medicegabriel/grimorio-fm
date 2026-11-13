import { register } from "node:module";
import assert from "node:assert/strict";
import { chromium } from "playwright";
register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}', import.meta.url);
const R = new URL("../../src/systems/afty/", import.meta.url);
const { deriveAfty } = await import(new URL("afty-derive.js", R));
const { createBlankAfty } = await import(new URL("afty-schema.js", R));
const { aplicarAddons } = await import(new URL("afty-addons.js", R));
const { criarEncontro, criarCombatente, definirIniciativa } = await import(new URL("encontros/afty-encontro.js", R));
const { sessaoEmBranco, iniciaCombate, iniciaTurnoFicha } = await import(new URL("ficha/ficha-sessao.js", R));
aplicarAddons([]);

function ficha(sistema, nome, lua) {
  const c = createBlankAfty();
  c.id = nome; c.name = nome; c.rulesVersion = sistema; c.core.nd = 12; c.attrMethod = "fixos";
  c.attributes = { forca: 15, destreza: 14, constituicao: 13, inteligencia: 10, sabedoria: 12, presenca: 8 };
  c.core.origem = { id: "inato", bonusAtributos: { forca: 2, destreza: 1 } };
  c.especializacoes = [{ id: "combatente", nivel: 12 }];
  c.habilidadesGerais = sistema === "afty" ? ["ger_especializacao"] : [];
  c.habilidades = lua ? ["cmb_assumir_postura"] : [];
  c.escolhasHabilidade = lua ? { cmb_assumir_postura: ["cmb_postura_da_lua", "cmb_postura_do_sol"] } : {};
  c.pericias = { feiticaria: "treinado" };
  c.equipamentos.itens = [{ uid: "espada", tipo: "arma", refId: "arm_espada_curta", qtd: 1, equipado: true }];
  return c;
}

const antesDoPatch = process.argv.includes("--antes");
const fichas = process.argv.includes("--fichas");
const browser = await chromium.launch({ channel: "chrome", ignoreDefaultArgs: ["--hide-scrollbars"] });
try {
  for (const sistema of ["player", "afty"]) for (const width of [1440, 390]) for (const g2 of (fichas ? [false, true] : [false])) {
    const cenario = "raio-negro";
    const defensor = ficha(sistema, "CX3 Defensor", false), atacante = ficha(sistema, "CX3 Atacante", false);
    atacante.aptidoes.cl = 3;
    atacante.aptidoes.au = 3;
    atacante.aptidoesAmaldicoadas = ["raio_negro", "aura_elemental"];
    atacante.aptidaoOpcoes = { aura_elemental: "queimante" };
    if (sistema === "afty") atacante.habilidadesGerais.push("ger_aptidao");
    const d = deriveAfty(atacante);
    assert.ok(d.aptidoesEscolhidas.includes("raio_negro"));
    const encontro = criarEncontro({ nome: "CX3 Reação na Mesa" });
    encontro.combatentes = [defensor, atacante].map((f, i) => definirIniciativa(criarCombatente(f, { derived: deriveAfty(f) }), 20 - 10 * i));
    const ctx = await browser.newContext({ viewport: { width, height: 900 }, isMobile: width === 390, hasTouch: width === 390 });
    await ctx.addInitScript(e => {
      if (!localStorage.getItem("afty_encontros_v1")) localStorage.setItem("afty_encontros_v1", JSON.stringify([e]));
    }, encontro);
    const page = await ctx.newPage(), erros = []; page.setDefaultTimeout(10000);
    page.on("pageerror", e => erros.push(e.message));
    const url = `${process.env.CX3_URL ?? "http://127.0.0.1:5196"}/${sistema}`;
    const arma = page.locator('[id="afty-item-dano:arm_espada_curta"]');
    const linha = d.dano.entradas.find(l => l.id === "arm_espada_curta");
    const rola = async (el, valor) => {
      await page.evaluate(v => { globalThis.cx3Random = Math.random; Math.random = () => v; }, valor);
      try { await el.click(); }
      finally { await page.evaluate(() => { Math.random = globalThis.cx3Random; delete globalThis.cx3Random; }); }
    };
    if (fichas) {
      const sessao = iniciaTurnoFicha(iniciaCombate(sessaoEmBranco(d), d), d);
      const sessaoKey = `fm_ficha_sessao_afty_v1:${atacante.id}`;
      await ctx.addInitScript(({ ficha, sistema, sessao, sessaoKey }) => {
        if (localStorage.getItem(sessaoKey)) return;
        localStorage.setItem(`fm_creatures_${sistema}_v1`, JSON.stringify([ficha]));
        localStorage.setItem(sessaoKey, JSON.stringify(sessao));
      }, { ficha: atacante, sistema, sessao, sessaoKey });
      await page.goto(`${url}${g2 ? "?ficha-g2=1" : ""}`, { waitUntil: "networkidle" });
      await page.getByText(atacante.name, { exact: true }).click();
      if (g2) await page.locator('#afty-ficha[data-afty-estrutura="g2"]').waitFor();
      await page.getByRole("tab", { name: "Ações", exact: true }).click();
      await rola(arma.getByRole("button", { name: `+${linha.acerto}` }), 0.99);
      await page.getByRole("button", { name: "Raio Negro", exact: true }).click();
      await rola(arma.locator("button.afty-rolavel").last(), 0.5);
      await page.waitForFunction(k => JSON.parse(localStorage.getItem(k)).log.some(r => r.raioNegro), sessaoKey);
      const leDano = () => page.evaluate(k => JSON.parse(localStorage.getItem(k)).log.find(r => r.raioNegro), sessaoKey);
      const dano = await leDano();
      assert.ok(dano.gruposRolados.some(g => g.tipoDano === "queimante" && g.subtotalRaioNegro > 0));
      assert.ok(dano.gruposRolados.some(g => g.tipoDano === "ct" && g.subtotalRaioNegro > 0));
      await page.reload({ waitUntil: "networkidle" });
      assert.deepEqual(await leDano(), dano);
      assert.deepEqual(erros, []);
      console.log(JSON.stringify({ sistema, width, ficha: g2 ? "g2" : "classica", grupos: dano.gruposRolados, total: dano.total }));
      await ctx.close();
      continue;
    }
    const le = () => page.evaluate(() => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0]);
    const foco = async nome => {
      if (width === 390) await page.getByRole("button", { name: "Iniciativa", exact: true }).click();
      for (const el of await page.getByText(nome, { exact: true }).all()) {
        if (await el.isVisible()) { await el.click(); return; }
      }
      throw Error("Combatente Indisponível");
    };
    await page.goto(url, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Encontros", exact: true }).click();
    await page.getByText(encontro.nome, { exact: true }).click();
    await page.getByRole("button", { name: "Começar", exact: true }).click();
    await page.getByRole("button", { name: "Próximo Turno", exact: true }).click();
    await foco(atacante.name);
    await page.getByRole("tab", { name: "Ações", exact: true }).click();
    await rola(arma.getByRole("button", { name: `+${linha.acerto}`, exact: true }), 0.99);
    await page.getByRole("button", { name: "Raio Negro", exact: true }).click();

    await rola(arma.locator("button.afty-rolavel").last(), 0.5);
    await page.waitForFunction(() => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0].combatentes[1].sessao.log.some(r => r.tipo === "dano"));
    const antes = await le(), sessao = antes.combatentes[1].sessao;
    const atk = sessao.log.find(r => r.tipoTeste === "ataque"), dano = sessao.log.find(r => r.tipo === "dano");
    await page.getByRole("combobox", { name: "Ataque a Confirmar" }).selectOption(atk.id);
    await page.getByRole("combobox", { name: "Dano do Ataque" }).selectOption(dano.id);
    await page.getByRole("combobox", { name: "Alvo do Ataque" }).selectOption(encontro.combatentes[0].id);
    await page.getByRole("button", { name: "Confirmar Ataque e Aplicar Dano", exact: true }).click();
    assert.equal(dano.raioNegro, true);
    assert.ok(dano.gruposRolados.some(g => g.tipoDano === "queimante"));
    if (antesDoPatch) {
      await page.getByText("Raio Negro Requer Resolução de Dano na Mesa", { exact: true }).waitFor();
      assert.deepEqual(await le(), antes);
    } else {
      await page.waitForFunction(() => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0].combatentes[1].sessao.log.some(r => r.rotulo === "Ataque Confirmado"));
      const depois = await le(), alvo = depois.combatentes[0].sessao;
      const registro = depois.combatentes[1].sessao.log[0];
      assert.ok(registro.ataque.raioNegro);
      assert.deepEqual(registro.calculos.map(c => c.tipoDano), ["ct", "queimante"]);
      assert.equal(registro.calculos.reduce((n, c) => n + c.final, 0), dano.total);
      assert.equal(antes.combatentes[0].sessao.hpAtual - alvo.hpAtual, dano.total);
      await page.reload({ waitUntil: "networkidle" });
      assert.deepEqual((await le()).combatentes[0].sessao, alvo);
    }
    assert.deepEqual(erros, []);
    console.log(JSON.stringify({ sistema, width, antesDoPatch, cenario, grupos: dano.gruposRolados, total: dano.total }));
        await ctx.close();
  }
} finally { await browser.close(); }
