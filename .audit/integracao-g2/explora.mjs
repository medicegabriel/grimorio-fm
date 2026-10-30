import { abrir } from "./harness.mjs";
import fs from "node:fs";
const pasta = "C:/Projetos/Grimorio/grimorio-tracker/.audit/integracao-g2/capturas";
const id = process.argv[2] ?? "minamoto";
const cat = process.argv[3] ?? "Habilidades de Classe";
const { browser, page, erros } = await abrir({ amostraId: id, viewport: { width: 1280, height: 800 } });
try {
  await page.waitForTimeout(500);
  await page.getByRole("button", { name: /Fora de Combate/ }).click();
  await page.locator('[data-afty-aba="buffs"]').click();
  await page.getByRole("button", { name: /Adicionar/ }).first().click();
  await page.waitForTimeout(500);
  await page.getByRole("button", { name: new RegExp(`^${cat}`) }).first().click().catch(() => {});
  await page.waitForTimeout(500);
  const txt = await page.locator(".e-g2 .e-area").innerText();
  console.log(txt.split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 80).join(" | "));
  await page.screenshot({ path: `${pasta}/${id}-explora.png` });
  console.log("erros", JSON.stringify(erros.slice(0, 4)));
} finally { await browser.close(); }
