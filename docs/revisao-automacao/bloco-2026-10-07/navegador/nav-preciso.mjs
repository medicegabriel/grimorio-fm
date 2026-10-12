/* Verificação de navegador da GE-1 (CMB-02, 2026-10-07): Preciso marcado no
   montador do Golpe Especial liga a vantagem do Motor no Acerto da arma, na
   Ficha Final e no painel de Encontros, nos dois sistemas e nas duas larguras.
   Contexto novo por caso: o armazenamento é isolado. */
import { chromium } from "file:///C:/Projetos/Grimorio/grimorio-tracker/node_modules/playwright/index.mjs";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
const OUT = process.argv[2] ?? "C:/Users/gabri/AppData/Local/Temp/claude/c--Projetos-Grimorio/f3a63944-cea0-4c95-9711-8b3974c02db5/scratchpad/nav";
await mkdir(OUT, { recursive: true });
const BASE = "http://localhost:5173/";
const browser = await chromium.launch({ channel: "chrome", ignoreDefaultArgs: ["--hide-scrollbars"] });
const report = [];

async function semear(p, sistema) {
  await p.evaluate(async (sistema) => {
    const { deriveAfty } = await import("/src/systems/afty/afty-derive.js");
    const { createBlankAfty } = await import("/src/systems/afty/afty-schema.js");
    const { aplicarAddons } = await import("/src/systems/afty/afty-addons.js");
    const { sessaoEmBranco } = await import("/src/systems/afty/ficha/ficha-sessao.js");
    aplicarAddons([]);
    const c = createBlankAfty();
    Object.assign(c, { id: "teste-preciso", name: "Teste Preciso", rulesVersion: sistema, attrMethod: "fixos" });
    c.core = { ...c.core, nd: 8, tipo: "combatente", patamar: "comum" };
    c.especializacoes = [{ id: "combatente", nivel: 8 }];
    c.habilidades = ["cmb_golpe_especial"];
    c.attributes = { forca: 16, destreza: 10, constituicao: 12, inteligencia: 10, sabedoria: 12, presenca: 10 };
    c.ataquesProf = { corpo: true };
    c.equipamentos = { itens: [{ uid: "arma-1", tipo: "arma", refId: "arm_espada_curta", qtd: 1, equipado: true }] };
    c.combate = { ativo: true };
    localStorage.setItem(`fm_creatures_${sistema}_v1`, JSON.stringify([c]));
    localStorage.setItem("fm_ficha_sessao_afty_v1:teste-preciso",
      JSON.stringify({ ...sessaoEmBranco(deriveAfty(c)), combate: { ativo: true } }));
  }, sistema);
}

try {
  for (const sistema of ["player", "afty"]) {
    for (const largura of [1440, 390]) {
      const ctx = await browser.newContext({ viewport: { width: largura, height: 1000 }, isMobile: largura === 390, hasTouch: largura === 390 });
      const p = await ctx.newPage();
      p.setDefaultTimeout(15000);
      const erros = [];
      p.on("pageerror", (e) => erros.push(e.message));
      const rota = sistema === "player" ? "Player" : "Afty";
      await p.goto(BASE + rota, { waitUntil: "networkidle" });
      await semear(p, sistema);
      await p.reload({ waitUntil: "networkidle" });
      await p.getByText("Teste Preciso", { exact: true }).first().click();

      /* ---- Ficha Final ---- */
      const linha = p.locator('[id="afty-item-dano:arm_espada_curta"]');
      await linha.waitFor();
      const chip = () => linha.locator(".afty-chip", { hasText: "Vantagem" });
      const antes = await chip().count();
      const preciso = p.locator('button[data-afty-golpe="preciso"]').first();
      await preciso.scrollIntoViewIfNeeded();
      await preciso.click();
      await chip().first().waitFor();
      const depois = await chip().count();
      await linha.scrollIntoViewIfNeeded();
      await p.screenshot({ path: `${OUT}/preciso-ficha-${sistema}-${largura}.png` });
      await linha.locator("button.afty-rolavel").first().click();
      await p.waitForTimeout(1500);
      const sessao = await p.evaluate(() => {
        const k = Object.keys(localStorage).find((x) => x.includes("sessao") && x.endsWith(":teste-preciso"));
        return k ? { chave: k, ...JSON.parse(localStorage.getItem(k)) } : {};
      });
      const rolagem = sessao.log?.[0] ?? null;
      const resultado = {
        caso: "ficha", sistema, largura, erros: [...erros],
        chipAntes: antes, chipDepois: depois,
        chaveDaSessao: sessao.chave ?? null,
        marcaNoCombate: sessao.combate?.golpePreciso ?? null,
        rolagem: rolagem ? { rotulo: rolagem.rotulo, modo: rolagem.modo, d20: rolagem.d20 ?? rolagem.dados ?? null } : null,
        semScroll: await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      };

      /* ---- Encontro: o painel chama a rolagem sem modo ---- */
      await p.evaluate(async (sistema) => {
        const { deriveAfty } = await import("/src/systems/afty/afty-derive.js");
        const { criarCombatente, criarEncontro, definirIniciativa } = await import("/src/systems/afty/encontros/afty-encontro.js");
        const c = JSON.parse(localStorage.getItem(`fm_creatures_${sistema}_v1`))[0];
        const a = definirIniciativa(criarCombatente(c, deriveAfty(c)), 20);
        a.id = "combatente-1"; a.nome = "Combatente Preciso";
        a.sessao = { ...a.sessao, combate: { ...(a.sessao?.combate ?? {}), ativo: true, golpePreciso: true } };
        const e = { ...criarEncontro({ nome: "Encontro Preciso" }), id: "teste-encontro", status: "ativo", ativoId: a.id, combatentes: [a] };
        localStorage.setItem("afty_encontros_v1", JSON.stringify([e]));
      }, sistema);
      await p.goto(BASE + rota, { waitUntil: "networkidle" });
      await p.locator('button[title="Encontros"]').click();
      await p.getByRole("button", { name: "Retomar", exact: true }).click();
      const linhaE = p.locator('[id="afty-item-dano:arm_espada_curta"]');
      await linhaE.waitFor();
      if (await linhaE.locator("summary").count()) await linhaE.locator("summary").first().click();
      resultado.encontroChip = await linhaE.locator(".afty-chip", { hasText: "Vantagem" }).count();
      await linhaE.locator("button.afty-rolavel").first().click();
      await p.waitForTimeout(400);
      const enc = await p.evaluate(() => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0]);
      const rolE = enc.combatentes[0].sessao.log?.[0] ?? null;
      resultado.encontroRolagem = rolE ? { rotulo: rolE.rotulo, modo: rolE.modo } : null;
      await linhaE.scrollIntoViewIfNeeded();
      await p.screenshot({ path: `${OUT}/preciso-encontro-${sistema}-${largura}.png` });
      resultado.erros = erros;
      report.push(resultado);

      assert.deepEqual(erros, []);
      assert.equal(resultado.chipAntes, 0);
      assert.equal(resultado.chipDepois > 0, true);
      assert.equal(resultado.marcaNoCombate, true);
      assert.equal(resultado.rolagem?.modo, "vantagem");
      assert.equal(resultado.encontroChip > 0, true);
      assert.equal(resultado.encontroRolagem?.modo, "vantagem");
      assert.equal(resultado.semScroll, true);
      await ctx.close();
    }
  }
  report.push({ resultado: "PASSOU" });
} catch (e) {
  report.push({ resultado: "FALHOU", erro: String(e?.stack ?? e) });
  process.exitCode = 1;
} finally {
  await browser.close();
  await writeFile(`${OUT}/relatorio-preciso.json`, JSON.stringify(report, null, 1));
  console.log(JSON.stringify(report, null, 1).slice(0, 5000));
}
