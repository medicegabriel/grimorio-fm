import { register } from "node:module";
import assert from "node:assert/strict";
import { chromium } from "playwright";
register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}', import.meta.url);
const R = new URL("../../src/systems/afty/", import.meta.url);
const { deriveAfty } = await import(new URL("afty-derive.js", R));
const { createBlankAfty } = await import(new URL("afty-schema.js", R));
const { aplicarAddons } = await import(new URL("afty-addons.js", R));
const { energiaDaSessao } = await import(new URL("ficha/ficha-uso.js", R));
const S = await import(new URL("ficha/ficha-sessao.js", R));
const { criarEncontro, criarCombatente, definirIniciativa } = await import(new URL("encontros/afty-encontro.js", R));
aplicarAddons([]);

const browser = await chromium.launch({ channel: "chrome", ignoreDefaultArgs: ["--hide-scrollbars"] });
try {
  for (const sistema of ["player", "afty"]) for (const width of [1440, 390]) for (const modo of ["clássica", "G2", "Encontro"]) {
    const c = createBlankAfty();
    c.id = "expandir"; c.name = "CX3 Expansor"; c.rulesVersion = sistema; c.core.nd = 12; c.attrMethod = "fixos";
    c.attributes = { forca: 15, destreza: 14, constituicao: 13, inteligencia: 10, sabedoria: 12, presenca: 18 };
    c.core.origem = { id: "inato", bonusAtributos: { forca: 2, destreza: 1 } };
    c.especializacoes = [{ id: "combatente", nivel: 12 }];
    c.habilidadesGerais = sistema === "afty" ? ["ger_especializacao", "ger_aptidao"] : [];
    c.aptidoes.au = 3;
    c.aptidoesAmaldicoadas = ["expandir_aura", "aura_do_bastiao", "aura_movedica"];
    const d = deriveAfty(c);
    assert.deepEqual(d.aptidao.disponiveisConteudo.filter(id => c.aptidoesAmaldicoadas.includes(id)).sort(), [...c.aptidoesAmaldicoadas].sort());
    const sessao = S.iniciaTurnoFicha(S.iniciaCombate({ ...S.sessaoEmBranco(d), rodada: 1 }, d), d);
    const encontro = criarEncontro({ nome: "CX3 Expandir Aura na Mesa" });
    encontro.combatentes = [definirIniciativa(criarCombatente(c, { derived: d }), 20)];
    const ctx = await browser.newContext({ viewport: { width, height: 900 }, isMobile: width === 390, hasTouch: width === 390 });
    await ctx.addInitScript(({ c, sessao, encontro, sistema }) => {
      if (localStorage.getItem("cx3-expandir")) return;
      localStorage.setItem("cx3-expandir", "1");
      localStorage.setItem(`fm_creatures_${sistema}_v1`, JSON.stringify([c]));
      localStorage.setItem("fm_ficha_sessao_afty_v1:expandir", JSON.stringify(sessao));
      localStorage.setItem("afty_encontros_v1", JSON.stringify([encontro]));
    }, { c, sessao, encontro, sistema });
    const page = await ctx.newPage(), erros = [];
    page.on("pageerror", e => erros.push(e.message));
    page.setDefaultTimeout(7000);
    const le = () => page.evaluate(m => m === "Encontro"
      ? JSON.parse(localStorage.getItem("afty_encontros_v1"))[0].combatentes[0].sessao
      : JSON.parse(localStorage.getItem("fm_ficha_sessao_afty_v1:expandir")), modo);
    const aguardaUso = (mantidas) => page.waitForFunction(({ modo, mantidas }) => {
      const s = modo === "Encontro" ? JSON.parse(localStorage.getItem("afty_encontros_v1"))[0].combatentes[0].sessao
        : JSON.parse(localStorage.getItem("fm_ficha_sessao_afty_v1:expandir"));
      return (s.uso.ativos.expandir_aura?.manutencao.mantidas ?? null) === mantidas;
    }, { modo, mantidas });
    const entra = async (inicial) => {
      if (modo === "Encontro") {
        await page.getByRole("button", { name: "Encontros", exact: true }).click();
        await page.getByText(encontro.nome, { exact: true }).click();
        if (inicial) await page.getByRole("button", { name: "Começar", exact: true }).click();
        if (width === 390) await page.getByRole("button", { name: "Iniciativa", exact: true }).click();
        for (const el of await page.getByText(c.name, { exact: true }).all()) if (await el.isVisible()) { await el.click(); break; }
      } else await page.getByText(c.name, { exact: true }).click();
    };
    const abre = async () => {
      await page.getByRole("tab", { name: "Habilidades", exact: true }).click();
      if (modo === "G2") {
        await page.getByRole("button", { name: "Expandir Aura. Consultar a regra", exact: true }).click();
        return page.getByRole("dialog", { name: "Consulta: Expandir Aura", exact: true });
      }
      const item = page.locator('[id="afty-item-aptidao:expandir_aura"]');
      const abrir = item.getByRole("button", { name: "Expandir Aura", exact: true }).first();
      if (await abrir.getAttribute("aria-expanded") !== "true") await abrir.click();
      return item;
    };
    await page.goto(`http://127.0.0.1:5196/${sistema}${modo === "G2" ? "?ficha-g2=1" : ""}`, { waitUntil: "networkidle" });
    await entra(true);
    let item = await abre();
    const antes = await le();
    await item.getByText("4.5 m", { exact: true }).waitFor();
    await item.getByRole("button", { name: "Expandir Aura", exact: true }).last().click();
    await item.getByText("9 m", { exact: true }).waitFor();
    await item.getByText("3 m", { exact: true }).waitFor();
    await aguardaUso(0);
    const pago = await le();
    assert.equal(energiaDaSessao(antes) - energiaDaSessao(pago), 2);
    assert.equal(pago.uso.acoes.livres.expandir_aura, 1);
    assert.deepEqual(pago.uso.acoes.gastas, antes.uso.acoes.gastas);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.reload({ waitUntil: "networkidle" });
    await entra(false);
    item = await abre();
    await item.getByText("9 m", { exact: true }).waitFor();
    if (modo === "G2") await page.getByRole("button", { name: "Fechar a consulta e voltar à lista", exact: true }).click();
    await page.getByRole("button", { name: modo === "Encontro" ? "Próximo Turno" : "Próxima rodada", exact: true }).click();
    if (modo === "G2") item = await abre();
    await item.getByText("4.5 m", { exact: true }).waitFor();
    const antesDeManter = await le();
    await item.getByRole("button", { name: "Pagar Manutenção" }).click();
    await item.getByText("9 m", { exact: true }).waitFor();
    await aguardaUso(1);
    assert.equal(energiaDaSessao(antesDeManter) - energiaDaSessao(await le()), 1);
    await item.getByRole("button", { name: "Encerrar Aura" }).click();
    await item.getByText("4.5 m", { exact: true }).waitFor();
    await aguardaUso(null);
    assert.deepEqual(erros, []);
    console.log(`${sistema} ${width} ${modo}: ativação, alcance, recarga, manutenção e encerramento`);
    await ctx.close();
  }
} finally { await browser.close(); }
