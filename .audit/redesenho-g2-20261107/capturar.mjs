/* Capturas COMPARÁVEIS do redesenho do G2 (2026-11-07): mesma ficha, mesmos dados, mesmo tema e mesma largura na clássica e no G2.
   Uso (na raiz do grimorio-tracker, com a prévia de pé): node .audit/redesenho-g2-20261107/capturar.mjs <antes|depois> [base] */
import fs from "node:fs";
import { chromium } from "playwright";

const FASE = process.argv[2] ?? "antes";
const BASE = process.argv[3] ?? "http://127.0.0.1:5330";
const SAIDA = new URL(`./${FASE}/`, import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
fs.mkdirSync(SAIDA, { recursive: true });
const navegador = await chromium.launch({ channel: "chrome" });
const ABAS = (process.env.ABAS ?? "pericias").split(",");
const LARGURAS = (process.env.LARGURAS ?? "1440,390").split(",").map(Number);
const FICHAS = (process.env.FICHAS ?? "cmp-simples,cmp-densa").split(",");
const MODOS = (process.env.MODOS ?? "g2,classica").split(",");
const TEMA = process.env.TEMA ?? "escuro";

for (const ficha of FICHAS) for (const modo of MODOS) for (const aba of ABAS) for (const w of LARGURAS) {
  const ctx = await navegador.newContext({ viewport: { width: w, height: w < 600 ? 844 : 900 }, hasTouch: w < 600, isMobile: w < 600, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  const erros = [];
  p.on("pageerror", (e) => erros.push(e.message));
  p.on("console", (m) => { if (m.type() === "error" && !/favicon|Failed to load resource/.test(m.text())) erros.push(m.text().slice(0, 200)); });
  await p.route("**/*", (rt) => { const u = new URL(rt.request().url()); return ["blob:", "data:"].includes(u.protocol) || u.hostname === "127.0.0.1" ? rt.continue() : rt.abort(); });
  const url = `${BASE}/?ficha=${ficha}&tema=${TEMA}${modo === "classica" ? "&modo=classica" : ""}${modo === "g2" ? `&aba=${aba}` : ""}`;
  await p.goto(url, { waitUntil: "domcontentloaded" });
  await p.locator("#afty-ficha").waitFor();
  if (modo === "classica") await p.locator(`[data-afty-aba="${aba}"]`).click();
  await p.waitForTimeout(900);
  const nome = `${ficha}-${modo}-${aba}-${w}`;
  await p.screenshot({ path: `${SAIDA}${nome}.png`, fullPage: true });
  console.log(nome, erros.length ? `ERROS: ${erros.join(" | ")}` : "ok");
  await ctx.close();
}
await navegador.close();
