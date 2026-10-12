/* Verificação de navegador da revisão de 2026-10-07 (M01-UI-01, M04-A02,
   M01-PERSIST-01, P01). Contexto novo do Playwright por caso: o armazenamento é
   isolado e nada toca o navegador do autor. Roda contra o `npm run dev` em 5173. */
import { register } from "node:module";
import { chromium } from "file:///C:/Projetos/Grimorio/grimorio-tracker/node_modules/playwright/index.mjs";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}', import.meta.url);
const REPO = "C:/Projetos/Grimorio/grimorio-tracker/";
const R = "file:///" + REPO + "src/systems/afty/";
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const OUT = process.argv[2] ?? "C:/Users/gabri/AppData/Local/Temp/claude/c--Projetos-Grimorio/f3a63944-cea0-4c95-9711-8b3974c02db5/scratchpad/nav";
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({ channel: "chrome", ignoreDefaultArgs: ["--hide-scrollbars"] });
const report = [];

async function abrirNoCriador(page, sistema, ficha) {
  const path = `${OUT}/ficha-${sistema}-${ficha.id}.json`;
  await writeFile(path, JSON.stringify({ version: "2.0", system: "Feiticeiros e Maldições", creatures: [ficha] }));
  await page.goto("http://localhost:5173/" + (sistema === "player" ? "Player" : "Afty"), { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Importar", exact: true }).click();
  await page.locator("input[type=file]").setInputFiles(path);
  await page.getByText(ficha.name, { exact: true }).first().waitFor();
  await page.getByRole("dialog").getByRole("button", { name: "Fechar", exact: true }).last().click();
  await page.getByText(ficha.name, { exact: true }).first().click();
  await page.locator('button[title="Editar no criador"]').click();
}
const salvo = (page, sistema, nome) => page.evaluate(([k, n]) =>
  JSON.parse(localStorage.getItem(k)).find((c) => c.name === n), [`fm_creatures_${sistema}_v1`, nome]);

async function escolherCanal(page, linha, rotulo) {
  await linha.getByRole("button", { name: "Canal" }).click();
  const busca = page.getByPlaceholder("Buscar...");
  await busca.fill(rotulo);
  await page.getByRole("button", { name: rotulo, exact: true }).first().click();
}

try {
  /* ============ 1. Motor: alvos novos e persistência ============ */
  for (const sistema of ["player", "afty"]) {
    for (const largura of [1440, 390]) {
      const ficha = createBlankAfty();
      ficha.rulesVersion = sistema;
      ficha.name = `Revisao Motor ${sistema} ${largura}`;
      ficha.core = { ...ficha.core, nd: 4, tecnicaEfeitos: [
        { canal: "proficienciaPericia", alvo: "percepcao", expr: "1", semCredito: true },
        { canal: "defesa", expr: "1" },
      ] };
      const ctx = await browser.newContext({ viewport: { width: largura, height: 1000 }, isMobile: largura === 390, hasTouch: largura === 390 });
      const page = await ctx.newPage();
      page.setDefaultTimeout(15000);
      const erros = [];
      page.on("pageerror", (e) => erros.push(e.message));
      await abrirNoCriador(page, sistema, ficha);
      await page.getByRole("tab", { name: "Habilidades", exact: true }).click();
      const adicionar = page.getByRole("button", { name: "Adicionar efeito", exact: true }).first();
      await adicionar.scrollIntoViewIfNeeded();
      const canaisAntes = await page.getByRole("button", { name: "Canal" }).count();
      await adicionar.click();
      const linhas = page.locator("div.rounded.border.border-slate-800.bg-slate-950\\/50");
      const nova = linhas.nth(2);
      await escolherCanal(page, nova, "Dados em Perícia");
      const pericia = nova.getByRole("combobox", { name: "Perícia" });
      const dado = nova.getByRole("combobox", { name: "Dado" });
      const pericaPadrao = await pericia.inputValue();
      const dadoPadrao = await dado.inputValue();
      await pericia.selectOption("atletismo");
      await dado.selectOption("6");
      await nova.getByPlaceholder("2 + piso(bt / 2)").fill("1");
      await nova.getByPlaceholder("2 + piso(bt / 2)").press("Tab");
      await nova.screenshot({ path: `${OUT}/dados-pericia-${sistema}-${largura}.png` });

      /* Os outros quatro vocabulários, numa linha de prova que é removida depois. */
      await adicionar.click();
      const prova = linhas.nth(3);
      const opcoes = {};
      for (const rotulo of ["Dados de Dano (tamanho próprio)", "RD por Tipo", "PE Temporário", "Custo em PE"]) {
        await escolherCanal(page, prova, rotulo);
        const alvo = prova.getByRole("combobox", { name: "Alvo" });
        opcoes[rotulo] = { valor: await alvo.inputValue(), opcoes: await alvo.locator("option").allInnerTexts() };
      }
      await prova.getByRole("button", { name: /Remover/i }).first().click().catch(async () => {
        await prova.locator("button").last().click();
      });

      await page.getByRole("button", { name: "Salvar Alterações", exact: true }).click();
      const gravada = await salvo(page, sistema, ficha.name);
      const efs = gravada.core.tecnicaEfeitos;
      const semScroll = await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
      const d = deriveAfty(gravada);
      const atletismo = (d.testes?.pericias ?? []).find((p) => p.id === "atletismo");
      report.push({
        caso: "motor", sistema, largura, erros, semScroll,
        canaisAntes, pericaPadrao, dadoPadrao, opcoes,
        gravado: efs,
        dadosAtletismo: atletismo?.dadosExtras ?? null,
      });
      assert.deepEqual(erros, []);
      assert.equal(efs[0].semCredito, true, "semCredito preservado na linha que não foi editada");
      assert.deepEqual(efs.find((e) => e.canal === "dadosPericia"), { canal: "dadosPericia", alvo: "atletismo:d6", expr: "1", ...(efs.find((e) => e.canal === "dadosPericia").modo ? { modo: efs.find((e) => e.canal === "dadosPericia").modo } : {}) });
      assert.equal(opcoes["Dados de Dano (tamanho próprio)"].opcoes.includes("todos"), false);
      assert.equal(opcoes["Dados de Dano (tamanho próprio)"].valor, "d3");
      assert.equal(opcoes["RD por Tipo"].opcoes.includes("Cortante"), true);
      assert.deepEqual(opcoes["PE Temporário"].opcoes.filter((o) => o !== "escolher..."), ["Uma Vez no Combate", "Toda Rodada"]);
      assert.equal(opcoes["Custo em PE"].opcoes.includes("todos") && opcoes["Custo em PE"].opcoes.includes("Feitiço"), true);
      assert.equal(semScroll, true);
      await ctx.close();
    }
  }

  /* ============ 2. Multiclasse ============ */
  const fichaMulti = (sistema, nome, esp, inteligencia) => {
    const f = createBlankAfty();
    f.rulesVersion = sistema;
    f.name = nome;
    f.core = { ...f.core, nd: 4, tipo: "combatente", patamar: "comum" };
    f.especializacoes = esp;
    f.attrMethod = "fixos";
    f.attributes = { forca: 14, destreza: 14, constituicao: 14, inteligencia, sabedoria: 12, presenca: 14 };
    return f;
  };
  for (const sistema of ["player", "afty"]) {
    for (const largura of [1440, 390]) {
      const ctx = await browser.newContext({ viewport: { width: largura, height: 1000 }, isMobile: largura === 390, hasTouch: largura === 390 });
      const page = await ctx.newPage();
      page.setDefaultTimeout(15000);
      const erros = [];
      page.on("pageerror", (e) => erros.push(e.message));
      const resultado = { caso: "multiclasse", sistema, largura, erros };

      const baixa = fichaMulti(sistema, `Revisao Multi Baixa ${sistema} ${largura}`, [{ id: "lutador", nivel: 4 }], 12);
      await abrirNoCriador(page, sistema, baixa);
      await page.getByRole("tab", { name: "Especializações", exact: true }).click();
      const chip = page.getByRole("button", { name: "Conjurador", exact: true }).first();
      resultado.baixa = { desligado: await chip.isDisabled(), title: await chip.getAttribute("title") };
      await chip.scrollIntoViewIfNeeded();
      await page.screenshot({ path: `${OUT}/multi-baixa-${sistema}-${largura}.png` });

      const alta = fichaMulti(sistema, `Revisao Multi Alta ${sistema} ${largura}`, [{ id: "lutador", nivel: 4 }], 16);
      await abrirNoCriador(page, sistema, alta);
      await page.getByRole("tab", { name: "Especializações", exact: true }).click();
      const chip2 = page.getByRole("button", { name: "Conjurador", exact: true }).first();
      resultado.alta = { desligado: await chip2.isDisabled() };
      await chip2.click();
      await page.getByRole("button", { name: "Salvar Alterações", exact: true }).click();
      resultado.alta.gravadas = (await salvo(page, sistema, alta.name)).especializacoes.map((e) => e.id);

      const ja = fichaMulti(sistema, `Revisao Multi Ja ${sistema} ${largura}`, [{ id: "lutador", nivel: 2 }, { id: "conjurador", nivel: 2 }], 12);
      await abrirNoCriador(page, sistema, ja);
      await page.getByRole("tab", { name: "Especializações", exact: true }).click();
      const aviso = page.getByText("sem o Requisito de Multiclasse", { exact: false });
      resultado.ja = { avisos: await aviso.count(), texto: (await aviso.count()) ? await aviso.first().innerText() : null };
      await page.screenshot({ path: `${OUT}/multi-ja-${sistema}-${largura}.png` });
      resultado.semScroll = await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
      report.push(resultado);

      assert.deepEqual(erros, []);
      if (sistema === "player") {
        assert.equal(resultado.baixa.desligado, true);
        assert.equal(resultado.baixa.title, "Requisito de Multiclasse (INT ou SAB 16)");
        assert.equal(resultado.ja.avisos > 0, true);
      } else {
        assert.equal(resultado.baixa.desligado, false);
        assert.equal(resultado.ja.avisos, 0);
      }
      assert.equal(resultado.alta.desligado, false);
      assert.deepEqual(resultado.alta.gravadas, ["lutador", "conjurador"]);
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
  await writeFile(`${OUT}/relatorio.json`, JSON.stringify(report, null, 1));
  console.log(JSON.stringify(report, null, 1).slice(0, 6000));
}
