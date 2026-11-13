/* Alter Lucielos no G2 depois do redesenho: estouro horizontal e culpados. Uso: node alter.mjs [base] */
import { chromium } from "playwright";
const BASE = process.argv[2] ?? "http://127.0.0.1:5330";
const SAIDA = new URL("./depois/", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const b = await chromium.launch({ channel: "chrome" });
for (const w of [331, 390, 768, 1440]) for (const aba of ["acoes", "pericias"]) {
  const p = await (await b.newContext({ viewport: { width: w, height: 844 }, hasTouch: w < 600, isMobile: w < 600 })).newPage();
  await p.goto(`${BASE}/?ficha=cmp-densa&tema=alter&aba=${aba}`);
  await p.locator("#afty-ficha").waitFor(); await p.waitForTimeout(800);
  const r = await p.evaluate(() => {
    const d = document.documentElement; const over = d.scrollWidth - d.clientWidth;
    const culpados = [...document.querySelectorAll("#afty-ficha *")].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.right > innerWidth + 1 && getComputedStyle(e).position !== "fixed"; }).slice(0, 4).map((e) => `${e.tagName}.${String(e.className).slice(0, 40)}`);
    return { over, culpados };
  });
  console.log(`alter ${aba} ${w}:`, JSON.stringify(r));
  if (aba === "pericias" && (w === 390 || w === 1440)) await p.screenshot({ path: `${SAIDA}alter-${aba}-${w}.png` });
  await p.close();
}
await b.close();
