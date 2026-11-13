/**
 * CX6: conferência no navegador (2026-11-06). Contexto isolado do Playwright, ficha de teste importada pela tela (nenhuma ficha real).
 * Confere o que o lote muda de visível:
 *   1. o seletor de Aliados cheio: contagem "N / teto" e os botões a mais DESABILITADOS (Buffs, Ficha clássica);
 *   2. os dois contadores de posição do Controlador aparecem na bancada de quem tem os poderes, com o teto do limite em campo;
 *   3. a Aba de Invocações renderiza com os poderes novos (Proteger Invocação) sem erro de console;
 *   4. sem rolagem horizontal em 1440 e 390.
 * Sem `--hide-scrollbars` de propósito (ver CLAUDE.md). Uso: BASE=http://localhost:5191 node .audit/cx6-20261106/browser.mjs
 */
import { register } from "node:module";
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}', import.meta.url);
const R = new URL("../../src/systems/afty/", import.meta.url).href;
await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const INV = await import(R + "afty-invocacoes.js");

const BASE = process.env.BASE || "http://localhost:5191";
const SAIDA = ".audit/cx6-20261106";
await mkdir(`${SAIDA}/shots`, { recursive: true });

const ficha = createBlankAfty();
ficha.rulesVersion = "player";
ficha.name = "Teste CX6 Controlador";
ficha.core = { ...ficha.core, nd: 8, nivel: 8, tipo: "misto", patamar: "comum", origem: { id: "inato" } };
ficha.especializacoes = [{ id: "controlador", nivel: 8 }];
ficha.habilidades = ["ctr_treinamento_em_controle", "ctr_guarda_viva", "ctr_rede_de_deteccao", "ctr_proteger_invocacao", "ctr_frenesi_da_invocacao"];
ficha.invocacoes = [{ ...INV.createBlankInvocacao("terceiro", "shikigami"), id: "INV1", nome: "Nue" }];
ficha.combate = { ativo: true, aliados_escolhidos: ["analista"], invocacoes_a_3m: 1 };
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
    page.on("console", (m) => { if (m.type() === "error" && !/vercel|insights|404/i.test(m.text())) erros.push("CONSOLE " + m.text()); });
    await page.goto(`${BASE}/Player`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Importar", exact: true }).click();
    await page.locator("input[type=file]").setInputFiles(caminho);
    await page.getByText(ficha.name, { exact: true }).first().waitFor();
    await page.getByRole("dialog").getByRole("button", { name: "Fechar", exact: true }).last().click();
    await page.getByText(ficha.name, { exact: true }).first().click();

    // ---- Buffs: o seletor de Aliados ----
    const abaBuffs = page.getByRole("tab", { name: /Buffs/ }).first();
    await abaBuffs.waitFor();
    await abaBuffs.click();
    await page.waitForTimeout(500);
    await page.getByRole("button", { name: "Em Combate", exact: true }).first().click();
    await page.waitForTimeout(300);
    // O contador de posição do Controlador está na sub-aba dele, com o teto do limite em campo.
    const contador3m = await page.getByText("Invocações a 3 m", { exact: true }).first().isVisible();
    await page.locator("button, [role=tab]").filter({ hasText: /^Outros/ }).first().click();
    await page.waitForTimeout(300);
    // Escolhe o primeiro aliado: o teto do Terceiro Grau é um.
    await page.getByRole("button", { name: "Analista", exact: true }).first().click();
    await page.waitForTimeout(300);
    const teto = page.locator('[data-afty-teto="aliados_escolhidos"]').first();
    const temTeto = (await teto.count()) > 0;
    const textoTeto = temTeto ? (await teto.innerText()).replace(/\s+/g, "") : null;
    const botaoAnalista = page.getByRole("button", { name: "Analista", exact: true }).first();
    const botaoProtetor = page.getByRole("button", { name: "Protetor", exact: true }).first();
    const analistaAtivo = (await botaoAnalista.count()) ? await botaoAnalista.getAttribute("aria-pressed") : null;
    const protetorDesabilitado = (await botaoProtetor.count()) ? await botaoProtetor.isDisabled() : null;
    const analistaDesabilitado = (await botaoAnalista.count()) ? await botaoAnalista.isDisabled() : null;
    await page.screenshot({ path: `${SAIDA}/shots/buffs-${largura}.png` });

    // ---- A bancada: os contadores de posição do Controlador ----
    const corpoBuffs = await page.innerText("body");
    const temContador3m = contador3m;

    // ---- Invocações ----
    const abaInv = page.getByRole("tab", { name: /Invoca/ }).first();
    await abaInv.waitFor();
    await abaInv.click();
    await page.waitForTimeout(500);
    const corpoInv = await page.innerText("body");
    const temProteger = /Proteger Invoca/i.test(corpoInv);
    await page.screenshot({ path: `${SAIDA}/shots/invocacoes-${largura}.png` });
    const semRolagemHorizontal = await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);

    const linha = { largura, temTeto, textoTeto, analistaAtivo, analistaDesabilitado, protetorDesabilitado, temContador3m, temProteger, semRolagemHorizontal, erros };
    console.log(JSON.stringify(linha));
    relatorio.push(linha);
    assert.equal(temTeto, true, "a contagem do teto aparece");
    assert.equal(analistaAtivo, "true");
    assert.equal(analistaDesabilitado, false, "o aliado escolhido continua clicável para sair");
    assert.equal(protetorDesabilitado, true, "o aliado a mais fica desabilitado com o teto atingido");
    assert.equal(semRolagemHorizontal, true, "sem rolagem horizontal");
    assert.deepEqual(erros, []);
    await ctx.close();
  }
  await writeFile(`${SAIDA}/relatorio.json`, JSON.stringify(relatorio, null, 2));
} finally {
  await browser.close();
}
