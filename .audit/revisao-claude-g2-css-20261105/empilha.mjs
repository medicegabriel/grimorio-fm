/* Empilha o recorte de duas capturas (atual em cima, proposta embaixo) e grava um PNG. Uso: node empilha.mjs <par> x0 y0 x1 y1 saida */
import { chromium } from "playwright";
import fs from "node:fs";
const DIR = new URL(".", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1") + "capturas/";
const [par, x0, y0, x1, y1, saida] = process.argv.slice(2);
const nav = await chromium.launch({ channel: "chrome" }); const p = await nav.newPage();
const b64 = (n) => fs.readFileSync(DIR + n).toString("base64");
const png = await p.evaluate(async ({ A, B, x0, y0, x1, y1 }) => {
  const carrega = (s) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.src = "data:image/png;base64," + s; });
  const [a, b] = await Promise.all([carrega(A), carrega(B)]);
  const w = x1 - x0 + 1, h = y1 - y0 + 1; const k = document.createElement("canvas"); k.width = w; k.height = h * 2 + 6; const g = k.getContext("2d");
  g.fillStyle = "#f0f"; g.fillRect(0, 0, w, h * 2 + 6); g.drawImage(a, x0, y0, w, h, 0, 0, w, h); g.drawImage(b, x0, y0, w, h, 0, h + 6, w, h);
  return k.toDataURL("image/png").split(",")[1];
}, { A: b64(`regressao-${par}-atual.png`), B: b64(`regressao-${par}-proposta.png`), x0: +x0, y0: +y0, x1: +x1, y1: +y1 });
fs.writeFileSync(DIR + saida, Buffer.from(png, "base64")); await nav.close(); console.log("ok", saida);
