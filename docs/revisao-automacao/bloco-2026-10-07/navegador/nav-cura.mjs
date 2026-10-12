/* Verificação de navegador da AUT-4 (M04, 2026-10-07): um pacote com uma
   Habilidade que declara `fonteCura`, instalado pelo caminho real do jogador
   (Outros, Addons, Instalar, colar o JSON, Usar), ganha a linha de cura na Ficha
   Final, e o editor de efeitos oferece a linha nova como alvo de cura.
   Contexto novo por caso: o armazenamento é isolado. */
import { register } from "node:module";
import { chromium } from "file:///C:/Projetos/Grimorio/grimorio-tracker/node_modules/playwright/index.mjs";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}', import.meta.url);
const R = "file:///C:/Projetos/Grimorio/grimorio-tracker/src/systems/afty/";
const { createBlankAfty } = await import(R + "afty-schema.js");
const OUT = process.argv[2] ?? "C:/Users/gabri/AppData/Local/Temp/claude/c--Projetos-Grimorio/f3a63944-cea0-4c95-9711-8b3974c02db5/scratchpad/nav";
await mkdir(OUT, { recursive: true });

const pacote = {
  id: "m04-cura", nome: "Cura de Teste", versao: "1", paraRaw: "afty",
  acrescenta: { habilidades: [{
    id: "retomar_vigor", nome: "Retomar o Vigor", descricao: "Teste", especializacaoId: "combatente",
    tipo: "nivel", nivel: 2, requisitos: [],
    fonteCura: { alcance: "Você" },
    efeitos: [
      { canal: "curaDados", alvo: "retomar_vigor", expr: "1 + piso(esc_combatente / 4)" },
      { canal: "curaFaces", alvo: "retomar_vigor", expr: "8" },
      { canal: "curaFixa", alvo: "retomar_vigor", expr: "dobro(mod_constituicao) + maestria" },
      { canal: "curaUsos", alvo: "retomar_vigor", expr: "maestria" },
    ],
  }] },
};
const browser = await chromium.launch({ channel: "chrome", ignoreDefaultArgs: ["--hide-scrollbars"] });
const report = [];
try {
  for (const sistema of ["player", "afty"]) {
    for (const largura of [1440, 390]) {
      const ficha = createBlankAfty();
      ficha.rulesVersion = sistema;
      ficha.name = `Revisao Cura ${sistema} ${largura}`;
      ficha.core = { ...ficha.core, nd: 8, tipo: "combatente", patamar: "comum" };
      ficha.especializacoes = [{ id: "combatente", nivel: 8 }];
      ficha.attrMethod = "fixos";
      ficha.attributes = { forca: 10, destreza: 10, constituicao: 16, inteligencia: 10, sabedoria: 10, presenca: 10 };
      ficha.habilidades = ["m04-cura:retomar_vigor"];
      const path = `${OUT}/ficha-cura-${sistema}-${largura}.json`;
      await writeFile(path, JSON.stringify({ version: "2.0", system: "Feiticeiros e Maldições", creatures: [ficha] }));
      const ctx = await browser.newContext({ viewport: { width: largura, height: 1000 }, isMobile: largura === 390, hasTouch: largura === 390 });
      const page = await ctx.newPage();
      page.setDefaultTimeout(15000);
      const erros = [];
      page.on("pageerror", (e) => erros.push(e.message));
      await page.goto("http://localhost:5173/" + (sistema === "player" ? "Player" : "Afty"), { waitUntil: "networkidle" });
      await page.getByRole("button", { name: "Importar", exact: true }).click();
      await page.locator("input[type=file]").setInputFiles(path);
      await page.getByText(ficha.name, { exact: true }).first().waitFor();
      await page.getByRole("dialog").getByRole("button", { name: "Fechar", exact: true }).last().click();
      await page.getByText(ficha.name, { exact: true }).first().click();
      await page.locator('button[title="Editar no criador"]').click();
      await page.getByRole("tab", { name: "Outros", exact: true }).click();
      await page.getByRole("menuitem", { name: "Addons", exact: true }).click();
      await page.getByRole("button", { name: "Instalar", exact: true }).click();
      await page.locator("textarea").fill(JSON.stringify(pacote));
      await page.getByRole("button", { name: "Instalar", exact: true }).last().click();
      const usar = page.locator('button[aria-pressed="false"][title^="Usar"]');
      await usar.first().click();

      /* O editor do Funcionamento oferece a linha nova como alvo de cura. */
      await page.getByRole("tab", { name: "Habilidades", exact: true }).click();
      const adicionar = page.getByRole("button", { name: "Adicionar efeito", exact: true }).first();
      await adicionar.scrollIntoViewIfNeeded();
      await adicionar.click();
      const linha = page.locator("div.rounded.border.border-slate-800.bg-slate-950\\/50").first();
      await linha.getByRole("button", { name: "Canal" }).click();
      await page.getByPlaceholder("Buscar...").fill("Cura: Dados");
      await page.getByRole("button", { name: "Cura: Dados", exact: true }).first().click();
      const alvos = await linha.getByRole("combobox", { name: "Alvo" }).locator("option").allInnerTexts();
      await linha.getByRole("button", { name: /Remover/i }).first().click().catch(async () => { await linha.locator("button").last().click(); });
      await page.getByRole("button", { name: "Salvar Alterações", exact: true }).click();

      /* A Ficha Final mostra a linha de cura com nome, dado e alcance dela. */
      await page.getByText(ficha.name, { exact: true }).first().click();
      const cura = page.locator('[id="afty-item-cura:m04-cura:retomar_vigor"]');
      await cura.waitFor();
      await cura.scrollIntoViewIfNeeded();
      const texto = await cura.innerText();
      await page.screenshot({ path: `${OUT}/cura-${sistema}-${largura}.png` });
      const r = {
        caso: "fonteCura", sistema, largura, erros: [...erros],
        alvoNoEditor: alvos.includes("Retomar o Vigor"),
        linhaNaFicha: texto.replace(/\s+/g, " ").slice(0, 160),
        semScroll: await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      };
      report.push(r);
      assert.deepEqual(erros, []);
      assert.equal(r.alvoNoEditor, true);
      assert.match(r.linhaNaFicha, /Retomar o Vigor/);
      assert.match(r.linhaNaFicha, /3d8/);
      assert.equal(r.semScroll, true);
      await ctx.close();
    }
  }
  report.push({ resultado: "PASSOU" });
} catch (e) {
  report.push({ resultado: "FALHOU", erro: String(e?.stack ?? e) });
  process.exitCode = 1;
} finally {
  await browser.close();
  await writeFile(`${OUT}/relatorio-cura.json`, JSON.stringify(report, null, 1));
  console.log(JSON.stringify(report, null, 1).slice(0, 4000));
}
