/* Biblioteca dos roteiros de navegador da revisão (2026-11-05). Chrome real, contexto isolado por cenário, SÓ fichas sintéticas,
   requisições externas bloqueadas, barra de rolagem REAL (sem --hide-scrollbars). Origem: 127.0.0.1:5341, o executor próprio. */
import fs from "node:fs";
import { chromium } from "playwright";

export const DIR = new URL(".", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
export const BASE = process.env.BASE ?? "http://127.0.0.1:5341";
export const CAPTURAS = `${DIR}capturas/`;
fs.mkdirSync(CAPTURAS, { recursive: true });
export const dados = JSON.parse(fs.readFileSync(`${DIR}../previa-abas-g2-20261021/fichas/fichas.json`, "utf8"));

export const navegador = await chromium.launch({ channel: "chrome", ignoreDefaultArgs: ["--hide-scrollbars"] });
export const saida = { geradoEm: new Date().toISOString(), base: BASE, etapas: [], falhas: [] };
export let etapa = null;
export const passo = (nome) => { etapa = { nome, checks: [], erros: [], medidas: {} }; saida.etapas.push(etapa); console.log(`# ${nome}`); return etapa; };
export const check = (id, ok, d) => {
  etapa.checks.push({ id, ok: !!ok, ...(d !== undefined ? { dados: d } : {}) });
  console.log(`  ${ok ? "ok    " : "FALHOU"} ${id}${!ok && d !== undefined ? " " + JSON.stringify(d).slice(0, 240) : ""}`);
  if (!ok) saida.falhas.push({ etapa: etapa.nome, id, dados: d });
  return !!ok;
};
export const espera = (p, ms = 300) => p.waitForTimeout(ms);
export const foto = (p, nome, o = {}) => p.screenshot({ path: `${CAPTURAS}${nome}.png`, ...o });

/** Abre uma ficha do executor. `query` é o resto da URL (tema=, css=, preset=, modo=). */
export async function abre({ ficha, query = "", largura = 1440, altura = 900, toque = false, imprime = false, nav = navegador }) {
  const ctx = await nav.newContext({ viewport: { width: largura, height: altura }, hasTouch: toque, isMobile: toque && largura < 600, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  p.setDefaultTimeout(10000);
  p.on("pageerror", (e) => etapa?.erros.push(e.message));
  p.on("console", (m) => { if (m.type() === "error" && !/favicon|Failed to load resource/.test(m.text())) etapa?.erros.push(`console: ${m.text().slice(0, 200)}`); });
  await p.route("**/*", (rt) => { const u = new URL(rt.request().url()); return ["blob:", "data:"].includes(u.protocol) || u.hostname === "127.0.0.1" ? rt.continue() : rt.abort(); });
  await p.goto(`${BASE}/?ficha=${ficha}${query ? "&" + query : ""}`, { waitUntil: "domcontentloaded" });
  await p.locator("#afty-ficha").waitFor();
  await espera(p, 600);
  if (imprime) await p.emulateMedia({ media: "print" });
  return { ctx, p };
}

export const aba = async (p, id) => { await p.locator(`[data-afty-aba="${id}"]`).click(); await espera(p, 350); };
export const abas = (p) => p.evaluate(() => [...document.querySelectorAll("[data-afty-aba]")].map((b) => b.dataset.aftyAba));

export async function encerra(nome) {
  saida.resumo = saida.etapas.map((x) => `${x.nome}: ${x.checks.filter((c) => c.ok).length}/${x.checks.length}${x.erros.length ? ` (erros de página: ${x.erros.length})` : ""}`);
  fs.writeFileSync(`${DIR}${nome}.json`, JSON.stringify(saida, null, 2));
  await navegador.close();
  console.log(JSON.stringify({ resumo: saida.resumo, falhas: saida.falhas.length }, null, 2));
}
