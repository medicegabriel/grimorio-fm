/* Controle da comparação visual: o MESMO build (5341) duas vezes. Se já difere, a diferença é ruído (relógio, sorteio), não da proposta. */
import { chromium } from "playwright";
const nav = await chromium.launch({ channel: "chrome", ignoreDefaultArgs: ["--hide-scrollbars"] });
const tira = async (base, query, largura, aba) => {
  const ctx = await nav.newContext({ viewport: { width: largura, height: 1000 }, reducedMotion: "reduce" });
  const p = await ctx.newPage();
  await p.goto(`${base}/?ficha=mesa&${query}`, { waitUntil: "domcontentloaded" });
  await p.locator("#afty-ficha").waitFor(); await p.waitForTimeout(700);
  await p.locator(`[data-afty-aba="${aba}"]`).click(); await p.waitForTimeout(500);
  await p.addStyleTag({ content: "*,*::before,*::after{animation:none!important;transition:none!important}" });
  const b = await p.screenshot(); await ctx.close(); return b;
};
for (const [aba, l] of [["acoes", 1440], ["habilidades", 1440], ["habilidades", 390], ["pericias", 1440]]) {
  const a = await tira("http://127.0.0.1:5341", "tema=escuro", l, aba), b = await tira("http://127.0.0.1:5341", "tema=escuro", l, aba);
  console.log(`controle ${aba}/${l}: ${Buffer.compare(a, b) === 0 ? "igual" : "DIFERE (ruído)"}`);
}
await nav.close();
