/* Harness de navegador da integração do G2: abre a Ficha de uma amostra em /Afty ou /Player. */
import { chromium } from "playwright";
import fs from "node:fs";

export const BASE = process.env.BASE ?? "http://127.0.0.1:5310";
const amostras = JSON.parse(fs.readFileSync("C:/Projetos/Grimorio/prototipos/ficha-final-v2/dados/amostras.json", "utf8")).amostras;
export const amostra = (id) => amostras.find((a) => a.id === id);

export async function abrir({ amostraId, viewport = { width: 1280, height: 800 }, sessao = null, headless = true, hasTouch = false, preCondicao = null, query = process.env.QUERY ?? "" }) {
  const browser = await chromium.launch({ channel: "chrome", headless });
  const context = await browser.newContext({ viewport, hasTouch });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  const erros = [];
  page.on("pageerror", (e) => erros.push(`pageerror: ${e.message}`));
  page.on("console", (msg) => { if (msg.type() === "error") erros.push(`console: ${msg.text()}`); });
  const a = amostra(amostraId);
  const sistema = a.ficha.rulesVersion === "player" ? "player" : "afty";
  const ficha = { ...a.ficha, id: `g2-${amostraId}` };
  if (preCondicao) preCondicao(ficha);
  await page.goto(`${BASE}/${sistema}`, { waitUntil: "domcontentloaded" });
  await page.evaluate(([sis, f, s]) => {
    localStorage.setItem(`fm_creatures_${sis}_v1`, JSON.stringify([f]));
    if (s) localStorage.setItem(`fm_ficha_sessao_afty_v1:${f.id}`, JSON.stringify(s));
  }, [sistema, ficha, sessao]);
  await page.goto(`${BASE}/${sistema}${query}`, { waitUntil: "networkidle" });
  await page.getByText(ficha.name, { exact: true }).first().click();
  await page.waitForSelector("#afty-ficha", { timeout: 20000 });
  return { browser, context, page, erros, ficha, sistema };
}
