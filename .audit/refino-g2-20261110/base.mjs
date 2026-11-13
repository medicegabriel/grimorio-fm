import fs from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(new URL("../previa-abas-g2-20261021/lib.mjs", import.meta.url));
const { chromium } = require("playwright");

export const PORTA = Number(process.env.PORTA ?? 5347);
export const BASE = `http://127.0.0.1:${PORTA}`;
export const SAIDA = (process.env.SAIDA ?? new URL("./fotos/", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")).replace(/\/?$/, "/");
fs.mkdirSync(SAIDA, { recursive: true });

export async function monta({ tamanho = "1440x900", ficha = "mesa", aba = "buffs", tema = "escuro", prefixo = "e" }) {
  const [L, A] = tamanho.split("x").map(Number);
  const nav = await chromium.launch({ channel: "chrome" });
  const ctx = await nav.newContext({ viewport: { width: L, height: A }, hasTouch: L < 600, isMobile: L < 600, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  const erros = [];
  const saida = {};
  p.setDefaultTimeout(6000);
  p.on("pageerror", (e) => erros.push(e.message));
  await p.route("**/*", (rt) => { const u = new URL(rt.request().url()); return ["blob:", "data:"].includes(u.protocol) || u.hostname === "127.0.0.1" ? rt.continue() : rt.abort(); });
  await p.goto(`${BASE}/?ficha=${ficha}&tema=${tema}&aba=${aba}`, { waitUntil: "domcontentloaded" });
  await p.locator("#afty-ficha").waitFor();
  await p.waitForTimeout(600);
  const nome = (n) => `${SAIDA}${prefixo}-${ficha}-${L}-${n}.png`;
  const foto = (n, o = {}) => p.screenshot({ path: nome(n), ...o });
  const textos = (sel) => p.locator(sel).evaluateAll((els) => els.map((e) => (e.textContent || e.getAttribute("aria-label") || e.getAttribute("placeholder") || "").replace(/\s+/g, " ").trim().slice(0, 60)));
  const dump = async (n) => { saida[n] = (await textos("#afty-ficha .e-area button, #afty-ficha .e-area [role=button], #afty-ficha .e-area input, #afty-ficha .e-area select")).filter(Boolean); };
  const passo = async (n, f, o = {}) => {
    try { await f(); await p.waitForTimeout(450); await foto(n, o); await dump(n); }
    catch (e) { saida[n + "-ERRO"] = String(e.message).slice(0, 300); await foto(n + "-erro").catch(() => {}); }
  };
  const fim = async () => {
    fs.writeFileSync(`${SAIDA}${prefixo}-${ficha}-${L}.json`, JSON.stringify({ saida, erros }, null, 1));
    await nav.close();
    for (const [k, v] of Object.entries(saida)) console.log("##", k, "\n", Array.isArray(v) ? v.join(" | ") : v);
    console.log("erros de página:", erros.length, erros.slice(0, 3));
  };
  return { p, passo, foto, dump, textos, saida, fim, L, A };
}
