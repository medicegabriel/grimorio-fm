import { abrir } from "./harness.mjs";
import fs from "node:fs";
const pasta = "C:/Projetos/Grimorio/grimorio-tracker/.audit/integracao-g2/capturas";
fs.mkdirSync(pasta, { recursive: true });
const id = process.argv[2] ?? "megumi";
const w = Number(process.argv[3] ?? 1280), h = Number(process.argv[4] ?? 800);
const { browser, page, erros } = await abrir({ amostraId: id, viewport: { width: w, height: h } });
try {
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${pasta}/${id}-${w}-acoes.png` });
  for (const aba of ["habilidades", "buffs", "pericias"]) {
    await page.locator(`[data-afty-aba="${aba}"]`).click();
    await page.waitForTimeout(700);
    await page.screenshot({ path: `${pasta}/${id}-${w}-${aba}.png` });
  }
  console.log("erros:", JSON.stringify(erros.slice(0, 8), null, 1));
} finally { await browser.close(); }
