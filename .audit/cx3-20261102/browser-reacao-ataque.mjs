import { register } from "node:module";
import assert from "node:assert/strict";
import { chromium } from "playwright";
register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}', import.meta.url);
const R = new URL("../../src/systems/afty/", import.meta.url);
const { deriveAfty } = await import(new URL("afty-derive.js", R));
const { createBlankAfty } = await import(new URL("afty-schema.js", R));
const { aplicarAddons } = await import(new URL("afty-addons.js", R));
const { criarEncontro, criarCombatente, definirIniciativa } = await import(new URL("encontros/afty-encontro.js", R));
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
const somente = process.argv.find((arg) => arg.startsWith("--cenario="))?.split("=")[1];
const cenarios = somente ? [somente] : antesDoPatch ? ["lua"] : ["lua", "passar", "cobrir", "esquiva"];
const browser = await chromium.launch({ channel: "chrome", ignoreDefaultArgs: ["--hide-scrollbars"] });
try {
  for (const sistema of ["player", "afty"]) for (const width of [1440, 390]) for (const cenario of cenarios) {
    const lua = cenario === "lua" || cenario === "passar";
    const defensor = ficha(sistema, "CX3 Defensor", lua), atacante = ficha(sistema, "CX3 Atacante", false);
    if (cenario === "cobrir") {
      defensor.aptidoes.cl = 2;
      defensor.aptidoesAmaldicoadas = ["cobrir_se", "cobertura_avancada"];
      assert.ok(deriveAfty(defensor).aptidao.disponiveisConteudo.includes("cobertura_avancada"));
    }
    if (cenario === "esquiva") {
      defensor.especializacoes = [{ id: "lutador", nivel: 12 }];
      defensor.escolhasHabilidade = { lut_empolgacao: ["lut_manobra_esquiva", "lut_manobra_ajuste"] };
      assert.ok(deriveAfty(defensor).habilidades.escolhas.mapa.lut_empolgacao.includes("lut_manobra_esquiva"));
    }
    const encontro = criarEncontro({ nome: "CX3 Reação na Mesa" });
    encontro.combatentes = [defensor, atacante].map((f, i) => definirIniciativa(criarCombatente(f, { derived: deriveAfty(f) }), 20 - 10 * i));
    if (cenario === "esquiva") encontro.combatentes[0].sessao.combate.empolgacao = 2;
    const ctx = await browser.newContext({ viewport: { width, height: 900 }, isMobile: width === 390, hasTouch: width === 390 });
    await ctx.addInitScript(e => {
      if (!localStorage.getItem("afty_encontros_v1")) localStorage.setItem("afty_encontros_v1", JSON.stringify([e]));
    }, encontro);
    const page = await ctx.newPage(), erros = [];
    page.on("pageerror", e => erros.push(e.message));
    const le = () => page.evaluate(() => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0]);
    const foco = async nome => {
      if (width === 390) await page.getByRole("button", { name: "Iniciativa", exact: true }).click();
      for (const el of await page.getByText(nome, { exact: true }).all()) {
        if (await el.isVisible()) { await el.click(); return; }
      }
      throw Error("Combatente Indisponível");
    };
    await page.goto(`http://127.0.0.1:5196/${sistema}`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Encontros", exact: true }).click();
    await page.getByText(encontro.nome, { exact: true }).click();
    await page.getByRole("button", { name: "Começar", exact: true }).click();
    if (lua) {
      await foco(defensor.name);
      await page.getByRole("tab", { name: "Habilidades", exact: true }).click();
      const postura = page.locator('[id="afty-item-especializacao:cmb_assumir_postura"]');
      await postura.getByRole("button", { name: "Assumir Postura", exact: true }).click();
      await postura.getByRole("combobox", { name: "Postura para Assumir", exact: true }).selectOption("lua");
      await postura.getByRole("button", { name: "Entrar em Postura", exact: true }).click();
      await postura.getByRole("button", { name: "Usar Ação Livre da Lua", exact: true }).waitFor();
    }
    await page.getByRole("button", { name: "Próximo Turno", exact: true }).click();
    await foco(atacante.name);
    await page.getByRole("tab", { name: "Ações", exact: true }).click();
    const arma = page.locator('[id="afty-item-dano:arm_espada_curta"]');
    const linha = deriveAfty(atacante).dano.entradas.find(l => l.id === "arm_espada_curta");
    const rola = async (el, valor) => {
      await page.evaluate(v => { globalThis.cx3Random = Math.random; Math.random = () => v; }, valor);
      try { await el.click(); }
      finally { await page.evaluate(() => { Math.random = globalThis.cx3Random; delete globalThis.cx3Random; }); }
    };
    await rola(arma.getByRole("button", { name: `+${linha.acerto}`, exact: true }), 0.89);
    await rola(arma.locator("button.afty-rolavel").last(), 0.8);
    await page.waitForFunction(() => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0].combatentes[1].sessao.log.some(r => r.tipo === "dano"));
    const antes = await le(), sessao = antes.combatentes[1].sessao;
    const atk = sessao.log.find(r => r.tipoTeste === "ataque"), dano = sessao.log.find(r => r.tipo === "dano");
    await page.getByRole("combobox", { name: "Ataque a Confirmar" }).selectOption(atk.id);
    await page.getByRole("combobox", { name: "Dano do Ataque" }).selectOption(dano.id);
    await page.getByRole("combobox", { name: "Alvo do Ataque" }).selectOption(encontro.combatentes[0].id);
    await page.getByRole("button", { name: "Confirmar Ataque e Aplicar Dano", exact: true }).click();
    if (!antesDoPatch) {
      const reacao = page.getByRole("combobox", { name: "Reação ao Dano", exact: true });
      try { await reacao.waitFor({ timeout: 4000 }); }
      catch (e) {
        const depois = await le();
        console.error(JSON.stringify({ sistema, width, cenario, atk, defesa: deriveAfty(defensor).defesa,
          registro: depois.combatentes[1].sessao.log[0], alerta: await page.getByRole("alert").allTextContents() }));
        throw e;
      }
      assert.deepEqual(await le(), antes);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await reacao.selectOption(cenario);
      if (cenario === "cobrir") await page.getByRole("spinbutton", { name: "PE da Reação" }).fill("6");
      await page.getByRole("button", { name: "Aplicar Dano", exact: true }).click();
    }
    await page.waitForFunction(() => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0].combatentes[1].sessao.log.some(r => r.rotulo === "Ataque Confirmado"));
    const depois = await le(), alvo = depois.combatentes[0].sessao;
    const registro = depois.combatentes[1].sessao.log.find(r => r.rotulo === "Ataque Confirmado");
    const perda = antes.combatentes[0].sessao.hpAtual - alvo.hpAtual;
    assert.ok(registro.ataque.acertou);
    assert.equal(alvo.especializacaoSessao?.reacoesGastas ?? 0, antesDoPatch || cenario === "passar" ? 0 : 1);
    if (antesDoPatch || cenario === "passar") {
      assert.ok(perda > 0);
      assert.equal(registro.reacaoDano, undefined);
    } else assert.equal(registro.reacaoDano.id, cenario);
    if (cenario === "cobrir") {
      const final = registro.calculos.reduce((n, g) => n + g.final, 0);
      assert.equal(registro.reacaoDano.pv, 48);
      assert.equal(perda, 0);
      assert.equal(alvo.pvTempFontes["Cobrir-se"], 48 - final);
      assert.equal(antes.combatentes[0].sessao.peAtual - alvo.peAtual, 6);
      await page.reload({ waitUntil: "networkidle" });
      assert.deepEqual((await le()).combatentes[0].sessao.pvTempFontes, alvo.pvTempFontes);
      await page.getByRole("button", { name: "Encontros", exact: true }).click();
      await page.getByText(encontro.nome, { exact: true }).click();
      await page.getByRole("button", { name: "Próximo Turno", exact: true }).click();
      await page.waitForFunction(() => !JSON.parse(localStorage.getItem("afty_encontros_v1"))[0].combatentes[0].sessao.pvTempFontes["Cobrir-se"]);
    }
    if (cenario === "esquiva") assert.ok(registro.reacaoDano.dados.length);
    assert.deepEqual(erros, []);
    console.log(JSON.stringify({ sistema, width, antesDoPatch, cenario, perda, calculos: registro.calculos, reacao: registro.reacaoDano ?? null }));
    await ctx.close();
  }
} finally { await browser.close(); }
