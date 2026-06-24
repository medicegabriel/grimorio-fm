import { chromium } from "playwright";
import fs from "fs";
const OUT = new URL("./shots/", import.meta.url).pathname.replace(/^\//, "");
fs.mkdirSync(OUT, { recursive: true });
let browser;
try { browser = await chromium.launch({ channel: "chrome" }); }
catch { browser = await chromium.launch(); }
const page = await (await browser.newContext({ viewport: { width: 390, height: 850 }, deviceScaleFactor: 2 })).newPage();
page.on("pageerror", (e) => console.log("PAGEERROR:", e.message));
await page.goto("http://localhost:5173", { waitUntil: "networkidle" });
await page.click('button[title="Criar nova criatura"]');
await page.waitForSelector("text=Nova Criatura", { timeout: 8000 });

const sec = page.locator("#section-actions");
await sec.scrollIntoViewIfNeeded();
await sec.getByRole("button", { name: /Adicionar Ação/ }).first().click();
await page.getByPlaceholder("Ex: Garra Lacerante").fill("Teste Mobile");
await sec.getByRole("button", { name: /^Automatizar/ }).click();
await page.waitForTimeout(150);
await sec.getByRole("button", { name: /Adicionar regra/ }).click();
await page.waitForTimeout(150);
// Clicar no botão "fx" (Usar expressão DSL)
await sec.getByRole("button", { name: "Usar expressão (DSL)" }).first().click();
await page.waitForTimeout(200);
// Digitar uma expressão de exemplo p/ ver se o campo mostra tudo
await sec.getByLabel("Expressão").first().fill("");
await page.waitForTimeout(150);
const exprBox = await sec.getByLabel("Expressão").first().boundingBox();
console.log("largura do campo de expressão (px):", Math.round(exprBox?.width ?? 0), "| viewport=390");
await sec.getByRole("button", { name: /Adicionar regra/ }).scrollIntoViewIfNeeded();
await page.screenshot({ path: `${OUT}/mobile_expr.png` });
console.log("DONE");
await browser.close();
