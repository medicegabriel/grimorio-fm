/* Verificações do redesenho do G2 no navegador (2026-11-07): teclado, compacta aberta, estouro horizontal, tamanho dos alvos e leitura de Perícias.
   Uso: node verificar.mjs [base] */
import fs from "node:fs";
import { chromium } from "playwright";

const BASE = process.argv[2] ?? "http://127.0.0.1:5330";
const SAIDA = new URL("./depois/", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const b = await chromium.launch({ channel: "chrome" });
const out = { geradoEm: new Date().toISOString(), base: BASE, checks: [], erros: [] };
const check = (id, ok, dados) => {
  out.checks.push({ id, ok: !!ok, ...(dados !== undefined ? { dados } : {}) });
  console.log(ok ? "ok    " : "FALHOU", id, ok ? "" : JSON.stringify(dados)?.slice(0, 300));
};
async function abre(ficha, aba, w, h, tema = "escuro", extra = "") {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: w < 600, isMobile: w < 600 });
  const p = await ctx.newPage();
  p.on("pageerror", (e) => out.erros.push(`${ficha}-${w}: ${e.message}`));
  p.on("console", (m) => { if (m.type() === "error" && !/favicon|Failed to load resource/.test(m.text())) out.erros.push(`${ficha}-${w}: ${m.text().slice(0, 160)}`); });
  await p.route("**/*", (rt) => { const u = new URL(rt.request().url()); return ["blob:", "data:"].includes(u.protocol) || u.hostname === "127.0.0.1" ? rt.continue() : rt.abort(); });
  await p.goto(`${BASE}/?ficha=${ficha}&tema=${tema}&aba=${aba}${extra}`);
  await p.locator("#afty-ficha").waitFor();
  await p.waitForTimeout(800);
  return p;
}

/* 1. Teclado: da aba até a lista, na ordem de leitura (coluna dos testes, depois Perícias). */
{
  const p = await abre("cmp-densa", "pericias", 1440, 900);
  await p.locator('[data-afty-aba="pericias"]').focus();
  const seq = [];
  for (let i = 0; i < 60; i++) {
    await p.keyboard.press("Tab");
    const r = await p.evaluate(() => {
      const e = document.activeElement;
      const l = e?.closest("[data-m-linha]")?.getAttribute("data-m-linha");
      const cs = e ? getComputedStyle(e) : null;
      const wrap = e?.closest(".m-rolar");
      const wcs = wrap ? getComputedStyle(wrap) : null;
      return { linha: l ?? null, outline: cs?.outlineStyle, wrapOutline: wcs?.outlineStyle, aba: !!e?.closest('[data-m-aba="pericias"]') };
    });
    seq.push(r);
  }
  const linhas = seq.filter((x) => x.linha).map((x) => x.linha);
  const iAtq = linhas.findIndex((l) => l.startsWith("ataque:"));
  const iTr = linhas.findIndex((l) => l.startsWith("tr:"));
  const iMan = linhas.findIndex((l) => l.startsWith("manobra:"));
  const iPer = linhas.findIndex((l) => l.startsWith("pericia:"));
  /* Player: sem Jogadas de Ataque (jogadasDeAtaqueNaTela), então a ordem é Resistências, Outros, Perícias. */
  check("teclado: ordem Resistências, Outros, Perícias (sem Jogadas de Ataque no Player)", iAtq === -1 && iTr >= 0 && iTr < iMan && iMan < iPer, { iAtq, iTr, iMan, iPer, amostra: linhas.slice(0, 6) });
  const noFoco = seq.filter((x) => x.linha && x.aba);
  check("teclado: cada foco em linha mostra contorno (do botão ou da pastilha)", noFoco.length > 10 && noFoco.every((x) => x.outline !== "none" || x.wrapOutline !== "none"),
    { n: noFoco.length, semContorno: noFoco.filter((x) => x.outline === "none" && x.wrapOutline === "none").slice(0, 3) });
  await p.screenshot({ path: `${SAIDA}teclado-1440.png` });
  await p.context().close();
}

/* 2. Estouro horizontal e alvos em várias larguras, nas abas de uso. */
for (const w of [331, 390, 768, 1024, 1280, 1440, 1920]) {
  for (const aba of ["acoes", "pericias", "equipamentos"]) {
    const p = await abre("cmp-densa", aba, w, 900);
    const m = await p.evaluate(() => {
      const d = document.documentElement;
      const baixos = [...document.querySelectorAll('[data-m-aba="pericias"] .m-rolar')].filter((e) => e.offsetParent).map((e) => e.getBoundingClientRect().height);
      return { estouro: d.scrollWidth - d.clientWidth, menorAlvo: baixos.length ? Math.min(...baixos) : null };
    });
    check(`sem estouro horizontal ${aba} ${w}`, m.estouro <= 0, m);
    if (aba === "pericias") check(`alvo de rolagem >= 34 px ${w}`, m.menorAlvo >= 34, m);
    await p.context().close();
  }
}

/* 3. Compacta aberta: Perícias com o painel de Efeitos ao lado. */
for (const w of [1280, 1024]) {
  const p = await abre("cmp-densa", "pericias", w, 800);
  await p.locator(".f-acesso").click();
  await p.waitForTimeout(500);
  const m = await p.evaluate(() => {
    const d = document.documentElement;
    const aba = document.querySelector('[data-m-aba="pericias"]');
    const cols = getComputedStyle(document.querySelector(".m-pericias-corpo")).gridTemplateColumns.split(" ").length;
    return { estouro: d.scrollWidth - d.clientWidth, largura: Math.round(aba.getBoundingClientRect().width), colunas: cols };
  });
  check(`compacta aberta ${w}: sem estouro`, m.estouro <= 0, m);
  await p.screenshot({ path: `${SAIDA}compacta-${w}.png` });
  await p.context().close();
}

/* 4. Duas colunas no desktop, uma no celular. */
{
  const colunas = async (w) => {
    const p = await abre("cmp-densa", "pericias", w, 900);
    const n = await p.evaluate(() => getComputedStyle(document.querySelector(".m-pericias-corpo")).gridTemplateColumns.split(" ").length);
    await p.context().close();
    return n;
  };
  check("Perícias: duas colunas em 1280", (await colunas(1280)) === 2);
  check("Perícias: uma coluna em 390", (await colunas(390)) === 1);
}

/* 5. Treino e maestria legíveis: três tons de linha, palavra para leitor de tela. */
{
  const p = await abre("cmp-densa", "pericias", 1440, 900);
  const r = await p.evaluate(() => {
    const f = (t) => {
      const e = document.querySelector(`.m-grade-pericias [data-treino="${t}"]`);
      const cs = getComputedStyle(e);
      return { fundo: cs.backgroundColor, sombra: cs.boxShadow, peso: getComputedStyle(e.querySelector(".m-teste-nome")).fontWeight, texto: e.querySelector(".m-so-leitor").textContent };
    };
    return { nenhum: f("nenhum"), treinado: f("treinado"), mestre: f("mestre") };
  });
  check("destaque: três linhas distintas", new Set([r.nenhum.fundo + r.nenhum.sombra, r.treinado.fundo + r.treinado.sombra, r.mestre.fundo + r.mestre.sombra]).size === 3, r);
  check("palavra do treino para leitor de tela", /Sem Treino/.test(r.nenhum.texto) && /Treinada/.test(r.treinado.texto) && /Mestre/.test(r.mestre.texto), r);
  const chips = await p.locator('.m-grade-pericias .m-chip:text-is("Mestre")').count();
  check("o chip Mestre repetido saiu da lista", chips === 0, { chips });
  await p.context().close();
}

/* 6. Busca, filtro e Outros seguem operando. */
{
  const p = await abre("cmp-densa", "pericias", 1440, 900);
  await p.locator('input[type="search"]').fill("atle");
  await p.waitForTimeout(200);
  check("busca local filtra a lista", (await p.locator(".m-grade-pericias .m-teste").count()) === 1);
  check("título mostra N de M com filtro", /1 de 2\d/i.test(await p.locator('[data-m-secao="pericias"] h2').innerText()));
  await p.locator('input[type="search"]').fill("");
  await p.getByRole("radio", { name: /Mestre/ }).click();
  await p.waitForTimeout(200);
  check("filtro Mestre mostra só Mestre", (await p.locator('.m-grade-pericias .m-teste:not([data-treino="mestre"])').count()) === 0);
  const antes = await p.locator('[data-m-secao="outros"] .m-rolar').count();
  check("Outros mantém Executar e Resistir", antes >= 8, { antes });
  await p.locator('[data-m-linha="manobra:agarrar"] .m-rolar button').first().click();
  await p.waitForTimeout(500);
  check("Outros rola (resultado na barra de dados)", !/Sem rolagens/.test(await p.locator(".afty-log").innerText()));
  await p.context().close();
}

/* 7. Coluna única: a chave Testes / Perícias mostra um grupo por vez, e some quando as duas colunas cabem. */
{
  const p = await abre("cmp-densa", "pericias", 390, 844);
  const vis = (sel) => p.locator(sel).first().isVisible();
  check("celular: a chave Testes / Perícias aparece", await vis(".m-pericias-troca"));
  check("celular: abre em Perícias, com os testes escondidos", (await vis('[data-m-secao="pericias"]')) && !(await vis('[data-m-secao="resistencias"]')));
  await p.getByRole("button", { name: "Testes", exact: true }).click();
  await p.waitForTimeout(200);
  check("celular: Testes mostra Resistências e Outros e esconde Perícias", (await vis('[data-m-secao="resistencias"]')) && (await vis('[data-m-secao="outros"]')) && !(await vis('[data-m-secao="pericias"]')));
  const alt = await p.evaluate(() => Math.round(document.querySelector("#afty-painel").scrollHeight));
  check("celular: cada grupo cabe em menos de 1500 px", alt < 1500, { alt });
  await p.getByRole("button", { name: "Perícias", exact: true }).click();
  await p.waitForTimeout(200);
  const alt2 = await p.evaluate(() => Math.round(document.querySelector("#afty-painel").scrollHeight));
  check("celular: Perícias cabe em menos de 1500 px", alt2 < 1500, { alt2 });
  await p.context().close();
  const q = await abre("cmp-densa", "pericias", 1280, 800);
  check("desktop: a chave some e os dois grupos aparecem", !(await q.locator(".m-pericias-troca").first().isVisible()) && (await q.locator('[data-m-secao="resistencias"]').first().isVisible()) && (await q.locator('[data-m-secao="pericias"]').first().isVisible()));
  const hLinha = await q.evaluate(() => Math.round(document.querySelector(".m-grade-pericias .m-teste").getBoundingClientRect().height));
  check("desktop: linha de perícia de 40 a 42 px", hLinha >= 40 && hLinha <= 42, { hLinha });
  await q.context().close();
}

check("sem erro de página nem de console", out.erros.length === 0, out.erros.slice(0, 5));
fs.writeFileSync(new URL("./verificar.json", import.meta.url), JSON.stringify(out, null, 2));
console.log(`${out.checks.filter((c) => c.ok).length}/${out.checks.length}`);
await b.close();
