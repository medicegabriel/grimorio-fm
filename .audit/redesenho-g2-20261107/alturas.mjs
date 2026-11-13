/* Altura do conteúdo de cada aba do G2 (Player), para comparar Perícias com as outras. Uso: node alturas.mjs [base] */
import { chromium } from "playwright";
const BASE = process.argv[2] ?? "http://127.0.0.1:5330";
const b = await chromium.launch({ channel: "chrome" });
for (const ficha of ["cmp-simples", "cmp-densa", "mesa"]) for (const w of [1440, 1280, 390]) {
  const linha = [];
  for (const aba of ["acoes", "habilidades", "pericias", "equipamentos", "buffs"]) {
    const p = await (await b.newContext({ viewport: { width: w, height: 900 }, hasTouch: w < 600, isMobile: w < 600 })).newPage();
    await p.goto(`${BASE}/?ficha=${ficha}&tema=escuro&aba=${aba}`);
    await p.locator("#afty-ficha").waitFor(); await p.waitForTimeout(600);
    const h = await p.evaluate(() => { const m = document.querySelector("#afty-painel"); return { pagina: Math.round(m.scrollHeight), cab: 0 }; });
    linha.push(`${aba}=${h.pagina - h.cab}`);
    await p.close();
  }
  console.log(`${ficha} ${w}: ${linha.join("  ")}`);
}
await b.close();
