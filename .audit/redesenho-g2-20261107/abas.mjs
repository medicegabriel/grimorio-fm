/* Captura as abas do G2 de uma ficha. Uso: node abas.mjs <pasta> <ficha> [larguras] [abas] [tema] */
import fs from "node:fs";
import { chromium } from "playwright";
const [pasta, ficha, larg = "1440,390", abas = "acoes,habilidades", tema = "escuro"] = process.argv.slice(2);
const BASE = process.env.BASE ?? "http://127.0.0.1:5330";
const SAIDA = new URL(`./${pasta}/`, import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
fs.mkdirSync(SAIDA, { recursive: true });
const b = await chromium.launch({ channel: "chrome" });
for (const w of larg.split(",").map(Number)) for (const aba of abas.split(",")) {
  const p = await (await b.newContext({ viewport: { width: w, height: w < 600 ? 844 : 900 }, hasTouch: w < 600, isMobile: w < 600 })).newPage();
  const erros = [];
  p.on("pageerror", (e) => erros.push(e.message));
  await p.route("**/*", (rt) => { const u = new URL(rt.request().url()); return ["blob:", "data:"].includes(u.protocol) || u.hostname === "127.0.0.1" ? rt.continue() : rt.abort(); });
  await p.goto(`${BASE}/?ficha=${ficha}&tema=${tema}&aba=${aba}`);
  await p.locator("#afty-ficha").waitFor(); await p.waitForTimeout(900);
  await p.screenshot({ path: `${SAIDA}${ficha}-${aba}-${w}.png`, fullPage: true });
  console.log(ficha, aba, w, erros.length ? erros : "ok");
  await p.close();
}
await b.close();
