/* PRÉVIA DAS TRÊS ABAS DO G2: biblioteca comum dos roteiros de navegador. Chrome real (Playwright, channel chrome), um contexto ISOLADO por
   cenário, fichas SINTÉTICAS da prévia, cliques reais sem `force`, requisições externas bloqueadas. Só a origem da prévia (127.0.0.1:5330). */
import fs from "node:fs";
import { chromium } from "playwright";

export const DIR = new URL(".", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
export const BASE = process.env.BASE ?? "http://127.0.0.1:5330";
export const CAPTURAS = `${DIR}capturas/`;
fs.mkdirSync(CAPTURAS, { recursive: true });
export const dados = JSON.parse(fs.readFileSync(`${DIR}fichas/fichas.json`, "utf8"));

export const navegador = await chromium.launch({ channel: "chrome" });
export const saida = { geradoEm: new Date().toISOString(), base: BASE, etapas: [], falhas: [] };
export let etapa = null;
export const passo = (nome) => { etapa = { nome, checks: [], erros: [], medidas: {} }; saida.etapas.push(etapa); console.log(`# ${nome}`); return etapa; };
export const check = (id, ok, dados) => {
  etapa.checks.push({ id, ok: !!ok, ...(dados !== undefined ? { dados } : {}) });
  if (!ok) { saida.falhas.push({ etapa: etapa.nome, id, dados }); console.log(`  FALHOU ${id}`, JSON.stringify(dados)?.slice(0, 300)); }
  return !!ok;
};
export const espera = (p, ms = 300) => p.waitForTimeout(ms);
export const foto = (p, nome, opcoes = {}) => p.screenshot({ path: `${CAPTURAS}${nome}.png`, ...opcoes });
export const texto = async (loc) => ((await loc.first().textContent().catch(() => "")) ?? "").replace(/\s+/g, " ").trim();

export async function abre({ ficha, tema = "escuro", largura = 1440, altura = 900, toque = false, sessao = null, sorte = null, nav = navegador }) {
  const ctx = await nav.newContext({ viewport: { width: largura, height: altura }, hasTouch: toque, isMobile: toque && largura < 600, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  /* `sorte`: o sorteio fixo (Math.random sempre igual), para provocar crítico (0.999) ou pífia (0) sem depender da sorte. */
  if (sorte != null) await p.addInitScript((v) => { Math.random = () => v; }, sorte);
  p.setDefaultTimeout(10000);
  p.on("pageerror", (e) => etapa?.erros.push(e.message));
  p.on("console", (m) => { if (m.type() === "error" && !/favicon|Failed to load resource/.test(m.text())) etapa?.erros.push(`console: ${m.text().slice(0, 200)}`); });
  await p.route("**/*", (rt) => { const u = new URL(rt.request().url()); return ["blob:", "data:"].includes(u.protocol) || u.hostname === "127.0.0.1" ? rt.continue() : rt.abort(); });
  if (sessao) {
    await p.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
    await p.evaluate(({ id, s }) => localStorage.setItem(`fm_ficha_sessao_afty_v1:${id}`, JSON.stringify(s)), { id: dados.fichas[ficha].id, s: sessao });
  }
  await p.goto(`${BASE}/?ficha=${ficha}&tema=${tema}`, { waitUntil: "domcontentloaded" });
  await p.locator("#afty-ficha").waitFor();
  await espera(p, 500);
  return { ctx, p };
}

/* A sessão gravada (a Ficha grava por debounce de 600 ms): a leitura espera ela assentar. */
export const sessaoGravada = async (p, ficha) => { await espera(p, 900); return p.evaluate((id) => JSON.parse(localStorage.getItem(`fm_ficha_sessao_afty_v1:${id}`) ?? "null"), dados.fichas[ficha].id); };
export const aba = async (p, id) => { await p.locator(`[data-afty-aba="${id}"]`).click(); await espera(p, 250); };
export const log = (p) => p.evaluate(() => JSON.parse(localStorage.getItem(Object.keys(localStorage).find((k) => k.startsWith("fm_ficha_sessao_afty_v1:")) ?? "null"))?.log?.length ?? 0);

/* Estouro horizontal da página e dos contêineres da Ficha. */
export const estouro = (p) => p.evaluate(() => {
  const doc = document.documentElement;
  const rolaNaHorizontal = (el) => { for (let a = el.parentElement; a && a !== document.documentElement; a = a.parentElement) { const ox = getComputedStyle(a).overflowX; if (["auto", "scroll", "hidden", "clip"].includes(ox) && a.getBoundingClientRect().right <= innerWidth + 1) return true; } return false; };
  const culpados = [...document.querySelectorAll("#afty-ficha [data-m-aba] *")].filter((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.right > innerWidth + 1 && getComputedStyle(el).position !== "fixed" && !rolaNaHorizontal(el); }).slice(0, 5).map((el) => `${el.tagName}.${String(el.className).slice(0, 40)}`);
  return { pagina: doc.scrollWidth - doc.clientWidth, culpados };
});

export async function encerra(nome) {
  saida.resumo = saida.etapas.map((x) => `${x.nome}: ${x.checks.filter((c) => c.ok).length}/${x.checks.length}${x.erros.length ? ` (erros de página: ${x.erros.length})` : ""}`);
  fs.writeFileSync(`${DIR}${nome}.json`, JSON.stringify(saida, null, 2));
  await navegador.close();
  console.log(JSON.stringify({ resumo: saida.resumo, falhas: saida.falhas.length }, null, 2));
}

/* A sessão crua de agora, sem esperar a gravação (lida do armazenamento logo depois da espera de gravação). */
export const pe = async (p, ficha) => (await sessaoGravada(p, ficha))?.peAtual;
export const linha = (p, chave) => p.locator(`[data-m-linha="${chave}"]`);
export const rolarDe = (p, chave, rotulo) => linha(p, chave).locator(".m-rolar").filter({ hasText: rotulo }).locator("button.afty-rolavel").first();
export const nosLogs = (p, ficha) => sessaoGravada(p, ficha).then((s) => s?.log?.length ?? 0);
