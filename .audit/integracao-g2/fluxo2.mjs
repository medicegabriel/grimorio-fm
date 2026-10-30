import { abrir } from "./harness.mjs";
import fs from "node:fs";
const pasta = "C:/Projetos/Grimorio/grimorio-tracker/.audit/integracao-g2/capturas";
const { browser, page, erros } = await abrir({ amostraId: "minamoto", viewport: { width: 1280, height: 800 } });
const pe = async () => (await page.locator('.m-medidor[data-recurso="pe"] .afty-vital-numero').innerText()).trim();
try {
  await page.waitForTimeout(500);
  await page.getByRole("button", { name: /Fora de Combate/ }).click();
  await page.locator('[data-afty-aba="buffs"]').click();
  await page.getByRole("button", { name: /Adicionar/ }).first().click();
  await page.getByRole("button", { name: /^Habilidades de Classe/ }).first().click();
  await page.waitForTimeout(400);
  const antes = await pe();
  const linha = page.locator(".e-g2 .e-area").getByText("Ataque Concentrado", { exact: true }).first();
  await linha.click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${pasta}/minamoto-ataque-concentrado-1.png` });
  const btns = await page.locator(".e-g2 .e-area button").allInnerTexts();
  console.log("botoes:", btns.map((s) => s.trim()).filter(Boolean).slice(0, 60).join(" | "));
  console.log("pe antes", antes, "erros", JSON.stringify(erros.slice(0, 4)));
} finally { await browser.close(); }
