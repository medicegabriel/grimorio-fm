/* A proposta (:where(.e-g2)) NÃO pode mudar a aparência padrão. Mesma ficha, mesmos cliques, dois builds (5341 atual, 5342 proposta):
   compara os PNG byte a byte e, se diferirem, conta pixels diferentes. Animações paradas por emulateMedia reducedMotion. */
import { chromium } from "playwright";
import fs from "node:fs";
let PNG = null; try { PNG = (await import("pngjs")).PNG; } catch { /* sem pngjs: só byte a byte */ }
const nav = await chromium.launch({ channel: "chrome", ignoreDefaultArgs: ["--hide-scrollbars"] });
const DIR = new URL(".", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const tira = async (base, ficha, query, largura, aba) => {
  const ctx = await nav.newContext({ viewport: { width: largura, height: 1000 }, reducedMotion: "reduce" });
  const p = await ctx.newPage();
  await p.route("**/*", (rt) => (["127.0.0.1"].includes(new URL(rt.request().url()).hostname) || rt.request().url().startsWith("data:") || rt.request().url().startsWith("blob:")) ? rt.continue() : rt.abort());
  await p.goto(`${base}/?ficha=${ficha}&${query}`, { waitUntil: "domcontentloaded" });
  await p.locator("#afty-ficha").waitFor(); await p.waitForTimeout(700);
  await p.locator(`[data-afty-aba="${aba}"]`).click(); await p.waitForTimeout(500);
  await p.addStyleTag({ content: "*{caret-color:transparent!important} *,*::before,*::after{animation:none!important;transition:none!important}" });
  const buf = await p.screenshot({ fullPage: false });
  await ctx.close(); return buf;
};
const casos = [];
for (const [ficha, query] of [["mesa", "tema=escuro"], ["mesa", "tema=claro"], ["arsenal", "tema=minamoto"], ["criatura", "tema=escuro"]])
  for (const aba of ["acoes", "pericias", "equipamentos", "habilidades"]) for (const largura of [1440, 390]) casos.push({ ficha, query, aba, largura });
const out = [];
for (const c of casos) {
  const a = await tira("http://127.0.0.1:5341", c.ficha, c.query, c.largura, c.aba);
  const b = await tira("http://127.0.0.1:5342", c.ficha, c.query, c.largura, c.aba);
  let iguais = Buffer.compare(a, b) === 0, difPixels = null, total = null;
  if (!iguais && PNG) { const A = PNG.sync.read(a), B = PNG.sync.read(b); total = A.width * A.height; difPixels = 0; for (let i = 0; i < A.data.length; i += 4) if (A.data[i] !== B.data[i] || A.data[i + 1] !== B.data[i + 1] || A.data[i + 2] !== B.data[i + 2]) difPixels++; }
  out.push({ ...c, iguais, difPixels, total });
  console.log(`${iguais ? "igual " : "DIFERE"} ${c.ficha}/${c.query}/${c.aba}/${c.largura}${difPixels != null ? ` ${difPixels} px` : ""}`);
  if (!iguais) { fs.writeFileSync(`${DIR}capturas/regressao-${c.ficha}-${c.aba}-${c.largura}-atual.png`, a); fs.writeFileSync(`${DIR}capturas/regressao-${c.ficha}-${c.aba}-${c.largura}-proposta.png`, b); }
}
fs.writeFileSync(`${DIR}regressao-visual.json`, JSON.stringify(out, null, 2));
await nav.close();
console.log(JSON.stringify({ casos: out.length, iguais: out.filter((x) => x.iguais).length }));
