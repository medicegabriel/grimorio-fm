/* DESEMPENHO das cinco rotinas novas, no build de produção, na ficha mais densa (a Player 30 do protótipo, com o addon da concessão, a Imitação e um
   Sangramento). Do pointerdown no gatilho até o resultado existir no DOM, mais dois quadros, com cliques reais e sem pausa artificial antes do clique. */
import fs from "node:fs";
import os from "node:os";
import { chromium } from "playwright";

const DIR = `${process.cwd()}/.audit/revisao-codex-fechamento-g2-20261020`;
const BASE = process.env.BASE ?? "http://127.0.0.1:5321";
const REPETE = Number(process.env.REPETE ?? 3);
const TMP = fs.mkdtempSync(`${os.tmpdir()}/perf-fechamento-`);
const amostra = JSON.parse(fs.readFileSync("C:/Projetos/Grimorio/prototipos/ficha-final-v2/dados/amostras.json", "utf8")).amostras.find((a) => a.id === "player30").ficha;
const ADDON = { id: "teste-concessao", nome: "Concessão de Teste", acrescenta: { habilidades: [] }, permite: ["concessao"] };
const denso = { ...amostra, id: "perf-fechamento", name: `${amostra.name} (Perf G2)`, addons: [...(amostra.addons ?? []), ADDON], habilidades: [...new Set([...(amostra.habilidades ?? []), "res_imitacao"])] };
const sessaoInicial = { combate: { ativo: true }, rodada: 1, buffs: [], condicoes: [{ id: "cond_1", nome: "Sangramento", forca: "fraca", rodadas: null, sangramento: "fraco" }] };
const out = { geradoEm: new Date().toISOString(), base: BASE, amostra: denso.name, medidas: [], erros: [] };
const browser = await chromium.launch({ channel: "chrome" });

async function abre() {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  p.setDefaultTimeout(20000);
  p.on("pageerror", (e) => out.erros.push(e.message));
  await p.route("**/*", (rt) => { const u = new URL(rt.request().url()); return ["blob:", "data:"].includes(u.protocol) || u.hostname === "127.0.0.1" || u.hostname === "localhost" ? rt.continue() : rt.abort(); });
  await p.goto(`${BASE}/Player`, { waitUntil: "domcontentloaded" });
  await p.evaluate(([f, s]) => { localStorage.setItem("fm_creatures_player_v1", JSON.stringify([f])); localStorage.setItem(`fm_ficha_sessao_afty_v1:${f.id}`, JSON.stringify(s)); }, [denso, sessaoInicial]);
  await p.goto(`${BASE}/Player?ficha-g2=1`, { waitUntil: "domcontentloaded" });
  await p.getByText(denso.name, { exact: true }).first().click();
  await p.locator("#afty-ficha").waitFor();
  await p.waitForTimeout(1500);
  await p.evaluate(() => {
    window.__long = [];
    new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__long.push({ ms: Math.round(e.duration), t: e.startTime }))).observe({ entryTypes: ["longtask"] });
  });
  return { ctx, p };
}
async function medir(p, rotulo, gatilho, pronto) {
  await p.evaluate(({ pronto }) => {
    window.__t0 = null; window.__t1 = null; window.__long.length = 0;
    document.addEventListener("pointerdown", () => { window.__t0 ??= performance.now(); }, { capture: true, once: true });
    const fim = () => requestAnimationFrame(() => requestAnimationFrame(() => { window.__t1 = performance.now(); }));
    if (document.querySelector(pronto)) return;
    const mo = new MutationObserver(() => { if (document.querySelector(pronto)) { mo.disconnect(); fim(); } });
    mo.observe(document.body, { subtree: true, childList: true, attributes: true });
  }, { pronto });
  await p.locator(gatilho).first().click();
  await p.waitForFunction(() => window.__t1 != null, null, { timeout: 15000 });
  await p.waitForTimeout(1200);
  const r = await p.evaluate(() => ({ ms: Math.round(window.__t1 - window.__t0), longas: window.__long.filter((x) => x.t >= window.__t0 - 5).map((x) => x.ms) }));
  out.medidas.push({ rotulo, ...r });
  console.log(`${rotulo}: ${r.ms} ms até pintar, tarefas longas ${JSON.stringify(r.longas)}`);
}

for (let i = 0; i < REPETE; i++) {
  const { ctx, p } = await abre();
  try {
    await p.locator('[data-afty-aba="buffs"]').click();
    await p.waitForTimeout(1200);
    /* Exaustão */
    await p.locator('[data-acesso-exaustao="completa"]').click();
    await medir(p, "Exaustão mais 1", "[data-exaustao-mais]", "[data-exaustao-nivel]");
    await p.keyboard.press("Escape");
    /* Sangramento */
    await p.locator('[data-chave-ativo="condicao:cond_1"]').click();
    await medir(p, "Perda de Vida do Sangramento", '[data-sangrar="cond_1"]', "[data-sangramento-resultado]");
    /* Imitação */
    await p.locator("[data-adicionar]").first().click();
    await p.locator("[data-aba-imitacao]").click();
    await p.locator('[data-chave-copia="cmb_postura_do_sol"] .k-item').click();
    await medir(p, "Confirmar Cópia da Imitação", "[data-confirmar-copia]", '[data-copia-atual="cmb_postura_do_sol"]');
    /* Buff de Mesa */
    await p.locator("[data-aba-externa]").click();
    await p.locator("[data-abrir-buff-mesa]").click();
    await p.locator('[data-campo="buff-nome"]').fill("Perf");
    await p.locator('[data-campo="buff-expr"]').fill("2");
    await medir(p, "Criar Buff de Mesa", "[data-criar-buff]", "[data-buff-criado]");
    /* Concedido */
    await p.locator("[data-abrir-concedido]").click();
    await p.locator('[data-campo="concedido-familia"]').selectOption("habilidades");
    await p.locator("[data-busca-concedido]").fill("Defesa Marcial");
    await p.waitForTimeout(500);
    await medir(p, "Conceder pelo Mestre", '[data-chave-concessao="lut_defesa_marcial"] button', "[data-aviso-concedido]");
  } catch (e) { out.erros.push(`rodada ${i}: ${e.message.split("\n")[0]}`); console.log("ERRO", e.message.split("\n")[0]); }
  await ctx.close();
}
await browser.close();
const resumo = {};
for (const m of out.medidas) (resumo[m.rotulo] ??= []).push(m.ms);
out.resumo = Object.fromEntries(Object.entries(resumo).map(([k, v]) => [k, { ms: v, maximo: Math.max(...v), tarefasLongas: out.medidas.filter((m) => m.rotulo === k).flatMap((m) => m.longas).length }]));
fs.writeFileSync(`${TMP}/perf-fechamento.json`, JSON.stringify(out, null, 2));
fs.copyFileSync(`${TMP}/perf-fechamento.json`, `${DIR}/perf-fechamento.json`);
console.log(JSON.stringify({ erros: out.erros, resumo: out.resumo }, null, 2));
