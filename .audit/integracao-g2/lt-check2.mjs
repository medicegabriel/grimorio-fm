import { abrir } from "./harness.mjs";
const sessao = { combate: { ativo: true }, rodada: 3, condicoes: [{ id: "c_1", nome: "Envenenado", rodadas: 3 }] };
const { browser, page, erros } = await abrir({ amostraId: "minamoto", viewport: { width: 1440, height: 900 }, sessao, query: "?ficha-g2=1" });
try {
  await page.waitForTimeout(1000);
  await page.locator('[data-afty-aba="buffs"]').click();
  await page.waitForTimeout(2500);
  console.log("prazos:", await page.locator("[data-linha-do-tempo]").count(), "colunas:", await page.locator("[data-linha-do-tempo] .lt-cab-r").count(), "linhas:", await page.locator("[data-linha-do-tempo] .lt-linha[data-linha]").count());
  await page.screenshot({ path: "capturas/lt-final.png" });
} catch (e) { console.log("FALHA", e.message.split("\n")[0]); }
console.log("erros", JSON.stringify(erros));
await browser.close();
