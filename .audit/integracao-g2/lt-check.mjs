import { abrir } from "./harness.mjs";
const { browser, page, erros } = await abrir({ amostraId: "minamoto", viewport: { width: 1440, height: 900 }, query: "?ficha-g2=1" });
try {
  await page.waitForTimeout(800);
  await page.getByRole("button", { name: /Fora de Combate/ }).click().catch(() => {});
  await page.locator('[data-afty-aba="buffs"]').click();
  await page.getByRole("button", { name: /Adicionar/ }).first().click();
  await page.getByRole("button", { name: /^Habilidades de Classe/ }).first().click();
  await page.locator(".e-g2 .e-area").getByText("Assumir Postura", { exact: true }).first().click();
  await page.locator(".e-g2 .e-area").getByRole("button", { name: "Ativar", exact: true }).last().click();
  await page.getByRole("button", { name: /Confirmar Ativação/ }).click();
  await page.waitForTimeout(1500);
  const txt = await page.locator("#afty-ficha").innerText();
  console.log("prazos:", await page.locator("[data-linha-do-tempo]").count(), "colunas:", await page.locator("[data-linha-do-tempo] .lt-cab-r").count(), "linhas:", await page.locator("[data-linha-do-tempo] .lt-linha[data-linha]").count());
  await page.screenshot({ path: "capturas/lt-final.png" });
} catch (e) { console.log("FALHA", e.message.split("\n")[0]); }
console.log("erros", JSON.stringify(erros));
await browser.close();
