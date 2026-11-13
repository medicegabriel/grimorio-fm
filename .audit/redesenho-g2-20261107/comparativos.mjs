/* Comparativos lado a lado: G2 antes, G2 depois e clássica, com a mesma ficha, os mesmos dados, o mesmo tema e a mesma largura.
   Uso: node comparativos.mjs (lê antes/ e depois/, grava comparativo-*.png nesta pasta). */
import fs from "node:fs";
import { chromium } from "playwright";

const DIR = new URL("./", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const url = (rel) => `file:///${DIR}${rel}`;
const CASOS = [
  { id: "densa-1440", ficha: "cmp-densa", w: 1440, larguraPainel: 640 },
  { id: "simples-1440", ficha: "cmp-simples", w: 1440, larguraPainel: 640 },
  { id: "densa-390", ficha: "cmp-densa", w: 390, larguraPainel: 390 },
  { id: "simples-390", ficha: "cmp-simples", w: 390, larguraPainel: 390 },
];
const PAINEIS = [
  { rotulo: "G2 antes", arq: (c) => `antes/${c.ficha}-g2-pericias-${c.w}.png` },
  { rotulo: "G2 depois", arq: (c) => `depois/${c.ficha}-g2-pericias-${c.w}.png` },
  { rotulo: "Clássica", arq: (c) => `antes/${c.ficha}-classica-pericias-${c.w}.png` },
];
const b = await chromium.launch({ channel: "chrome" });
for (const c of CASOS) {
  const html = `<!doctype html><meta charset="utf-8"><style>
    body{margin:0;background:#0b0f19;color:#e5e7eb;font:600 14px system-ui;display:flex;gap:12px;padding:12px;align-items:flex-start}
    figure{margin:0;width:${c.larguraPainel}px;flex:none}figcaption{padding:4px 2px 8px;letter-spacing:.04em}
    img{display:block;width:${c.larguraPainel}px;height:auto;border:1px solid #334155}</style>
    ${PAINEIS.map((p) => `<figure><figcaption>${p.rotulo}</figcaption><img src="${url(p.arq(c))}"></figure>`).join("")}`;
  const arq = `${DIR}_comparativo-${c.id}.html`;
  fs.writeFileSync(arq, html);
  const ctx = await b.newContext({ viewport: { width: c.larguraPainel * 3 + 60, height: 900 } });
  const p = await ctx.newPage();
  await p.goto(`file:///${arq}`);
  await p.waitForLoadState("load");
  await p.waitForTimeout(400);
  await p.screenshot({ path: `${DIR}comparativo-${c.id}.png`, fullPage: true });
  await ctx.close();
  fs.unlinkSync(arq);
  console.log("comparativo", c.id);
}
await b.close();
