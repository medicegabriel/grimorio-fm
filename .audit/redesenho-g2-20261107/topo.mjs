/* Recorte do topo (cabeçalho) em várias larguras, para conferir a placa. Uso: node topo.mjs <saida> <ficha> <tema> <modo> larguras... */
import { chromium } from "playwright";
const [saida, ficha = "cmp-densa", tema = "escuro", modo = "g2", ...larg] = process.argv.slice(2);
const b = await chromium.launch({ channel: "chrome" });
for (const w of (larg.length ? larg : ["390"]).map(Number)) {
  const p = await (await b.newContext({ viewport: { width: w, height: 800 }, hasTouch: w < 600, isMobile: w < 600 })).newPage();
  await p.goto(`${process.env.BASE ?? "http://127.0.0.1:5330"}/?ficha=${ficha}&tema=${tema}&aba=pericias${modo === "classica" ? "&modo=classica" : ""}`);
  await p.locator("#afty-ficha").waitFor(); await p.waitForTimeout(800);
  const alt = await p.evaluate(() => Math.round(document.querySelector("header.afty-cabecalho").getBoundingClientRect().height));
  await p.screenshot({ path: `${saida}-${w}.png`, clip: { x: 0, y: 0, width: w, height: Math.min(alt + 12, 780) } });
  console.log(w, "altura do cabeçalho:", alt);
}
await b.close();
