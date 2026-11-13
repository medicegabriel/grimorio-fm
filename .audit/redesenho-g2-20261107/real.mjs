/* A ficha real do autor na prévia: abre, confere erros e tira capturas (retrato externo bloqueado nos testes). Uso: node real.mjs [base] */
import { chromium } from "playwright";
const BASE = process.argv[2] ?? "http://127.0.0.1:5330";
const SAIDA = new URL("./depois/", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const b = await chromium.launch({ channel: "chrome" });
for (const [w, h, aba] of [[1440, 900, "pericias"], [1440, 900, "acoes"], [390, 844, "pericias"]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: w < 600, isMobile: w < 600 });
  const p = await ctx.newPage();
  const erros = [];
  p.on("pageerror", (e) => erros.push(e.message));
  p.on("console", (m) => { if (m.type() === "error" && !/favicon|Failed to load resource|ERR_/.test(m.text())) erros.push(m.text().slice(0, 160)); });
  await p.route("**/*", (rt) => { const u = new URL(rt.request().url()); return ["blob:", "data:"].includes(u.protocol) || u.hostname === "127.0.0.1" ? rt.continue() : rt.abort(); });
  await p.goto(`${BASE}/?ficha=real&aba=${aba}`);
  await p.locator("#afty-ficha").waitFor(); await p.waitForTimeout(900);
  const r = await p.evaluate(() => ({ nome: document.querySelector(".afty-nome")?.textContent, linhagem: document.querySelector(".e-linhagem")?.innerText.replace(/\s+/g, " "), recursos: [...document.querySelectorAll(".e-recursos .m-medidor")].map((m) => m.innerText.replace(/\s+/g, " ")), ataques: document.querySelectorAll('[data-m-linha^="ataque:"]').length, over: document.documentElement.scrollWidth - document.documentElement.clientWidth }));
  console.log(w, aba, JSON.stringify(r), "erros:", erros.length, erros.slice(0, 2));
  await p.screenshot({ path: `${SAIDA}real-${aba}-${w}.png`, fullPage: true });
  await ctx.close();
}
await b.close();
