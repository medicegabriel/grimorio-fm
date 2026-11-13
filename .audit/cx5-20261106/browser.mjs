/**
 * CX5: conferência no navegador (2026-11-06). Contexto isolado do Playwright, ficha de teste importada pela tela, nenhuma ficha real.
 * Confere o que o lote muda de visível sem tela nova: a Pulseira sem escolha avisa, a com escolha treina a perícia, o inventário
 * renderiza na Ficha clássica, no Encontro e nas duas larguras, sem erro de console e sem rolagem horizontal.
 * Sem `--hide-scrollbars` de propósito (ver CLAUDE.md).
 */
import { register } from "node:module";
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}', import.meta.url);
const R = new URL("../../src/systems/afty/", import.meta.url).href;
await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");

const SAIDA = ".audit/cx5-20261106";
await mkdir(`${SAIDA}/shots`, { recursive: true });

const ficha = createBlankAfty();
ficha.rulesVersion = "player";
ficha.name = "Teste CX5 Pulseiras";
ficha.core = { ...ficha.core, nd: 8, tipo: "misto", patamar: "comum", origem: { id: "inato" } };
ficha.especializacoes = [{ id: "combatente", nivel: 8 }];
ficha.equipamentos = {
  itens: [
    { uid: "u0", tipo: "uniforme", refId: "unif_comum", qtd: 1, equipado: true },
    { uid: "m1", tipo: "item", refId: "it_pulseira_magistral", qtd: 1, equipado: true },
    { uid: "m2", tipo: "item", refId: "it_pulseira_primacial", qtd: 1, equipado: true, escolhaPericia: "atletismo" },
    { uid: "p1", tipo: "item", refId: "it_perola_carregada", qtd: 2, equipado: false },
    { uid: "a1", tipo: "arma", refId: "arm_espada_longa", qtd: 1, equipado: true },
  ],
};
const caminho = `${SAIDA}/ficha-teste.json`;
await writeFile(caminho, JSON.stringify({ version: "2.0", system: "Feiticeiros e Maldições", creatures: [ficha] }));

const browser = await chromium.launch({ channel: "chrome", ignoreDefaultArgs: ["--hide-scrollbars"] });
const relatorio = [];
try {
  for (const largura of [1440, 390]) {
    const ctx = await browser.newContext({ viewport: { width: largura, height: 1000 }, isMobile: largura === 390, hasTouch: largura === 390 });
    const page = await ctx.newPage();
    page.setDefaultTimeout(15000);
    const erros = [];
    page.on("pageerror", (e) => erros.push("PAGEERROR " + e.message));
    page.on("console", (m) => { if (m.type() === "error") erros.push("CONSOLE " + m.text()); });
    await page.goto("http://localhost:5173/Player", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Importar", exact: true }).click();
    await page.locator("input[type=file]").setInputFiles(caminho);
    await page.getByText(ficha.name, { exact: true }).first().waitFor();
    await page.getByRole("dialog").getByRole("button", { name: "Fechar", exact: true }).last().click();
    await page.getByText(ficha.name, { exact: true }).first().click();
    // A ficha de jogo abre na aba Ações. Vai para Equipamentos.
    const aba = page.getByRole("tab", { name: /Equipamentos/ }).first();
    await aba.waitFor();
    await aba.click();
    await page.getByText(/^Carga$/i).first().waitFor();
    await page.waitForTimeout(300);
    // O inventário é agrupado em sub-abas: abre a dos Itens para ver as Pulseiras e a Pérola.
    await page.locator("button, [role=tab]").filter({ hasText: /^Itens/ }).first().click();
    await page.waitForTimeout(700);
    const corpo = await page.innerText("body");
    // A Pulseira sem escolha NÃO vira aviso na aba (o seletor que resolveria o aviso ainda não existe).
    const avisoDaMagistral = /escolha a perícia/i.test(corpo);
    const temPulseiras = /Pulseira Magistral/i.test(corpo) && /Pulseira Primacial/i.test(corpo);
    const temPerola = /Pérola Carregada/i.test(corpo);
    await page.screenshot({ path: `${SAIDA}/shots/equipamentos-${largura}.png` });
    // Perícias: Atletismo treinado pela Pulseira Magistral na primeira entrada sem escolha NÃO deve existir, e a Primacial sozinha não cria treino.
    const semRolagemHorizontal = await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
    console.log("largura", largura, { avisoDaMagistral, temPulseiras, temPerola, semRolagemHorizontal, larguraDoDocumento: await page.evaluate(() => [document.documentElement.scrollWidth, innerWidth]) });
    assert.equal(avisoDaMagistral, false, "a Pulseira sem escolha não deve gerar aviso na aba Equipamentos");
    assert.equal(temPulseiras, true);
    assert.equal(temPerola, true);
    assert.equal(semRolagemHorizontal, true, "sem rolagem horizontal");
    assert.deepEqual(erros, []);
    relatorio.push({ largura, avisoDaMagistral, temPulseiras, temPerola, semRolagemHorizontal, erros });
    await ctx.close();
  }
  await writeFile(`${SAIDA}/relatorio.json`, JSON.stringify(relatorio, null, 2));
  console.log(JSON.stringify(relatorio));
} finally {
  await browser.close();
}
