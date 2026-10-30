import { abrir } from "./harness.mjs";
import fs from "node:fs";
const pasta = "C:/Projetos/Grimorio/grimorio-tracker/.audit/integracao-g2/capturas";
fs.mkdirSync(pasta, { recursive: true });
const id = process.argv[2] ?? "megumi";
const w = Number(process.argv[3] ?? 1280), h = Number(process.argv[4] ?? 800);
const { browser, page, erros } = await abrir({ amostraId: id, viewport: { width: w, height: h } });
const log = [];
try {
  await page.waitForTimeout(600);
  // entra em combate
  await page.getByRole("button", { name: /Fora de Combate/ }).click();
  await page.locator('[data-afty-aba="buffs"]').click();
  await page.waitForTimeout(500);
  await page.getByRole("button", { name: /Adicionar/ }).first().click();
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${pasta}/${id}-${w}-catalogo.png` });
  const linhas = await page.locator('.e-g2 [data-chave], .e-g2 .x-linha, .e-g2 .c-linha').count();
  log.push({ linhas });
  console.log(JSON.stringify(log), "erros:", JSON.stringify(erros.slice(0, 6)));
} finally { await browser.close(); }
