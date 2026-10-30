import { abrir } from "./harness.mjs";
const pasta = "C:/Projetos/Grimorio/grimorio-tracker/.audit/integracao-g2/capturas";
const { browser, page, erros } = await abrir({ amostraId: "megumi", viewport: { width: 1280, height: 800 } });
const log = (...a) => console.log(...a);
try {
  await page.waitForTimeout(500);
  await page.keyboard.press("Control+k");
  await page.waitForTimeout(300);
  await page.keyboard.type("Controle Aprimorado");
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${pasta}/busca-1.png` });
  await page.keyboard.press("Enter");
  await page.waitForTimeout(1200);
  log("aba:", await page.locator('[data-afty-aba][aria-selected="true"]').getAttribute("data-afty-aba"));
  log("linha marcada:", await page.locator('.e-linha[data-afty-alvo="sim"]').count());
  await page.screenshot({ path: `${pasta}/busca-2.png` });
  log("erros", JSON.stringify(erros.slice(0, 4)));
} catch (e) { log("FALHA:", e.message.split("\n")[0]); await page.screenshot({ path: `${pasta}/busca-falha.png` }); } finally { await browser.close(); }
