import { abrir } from "./harness.mjs";
const { browser, page, erros } = await abrir({ amostraId: "minamoto", viewport: { width: 1280, height: 800 } });
const log = (...a) => console.log(...a);
try {
  await page.waitForTimeout(500);
  await page.locator('[data-afty-aba="habilidades"]').click();
  await page.waitForTimeout(400);
  await page.locator(".e-habilidades").evaluate((el) => { el.scrollTop = 420; });
  await page.waitForTimeout(200);
  log("scroll antes:", await page.locator(".e-habilidades").evaluate((el) => el.scrollTop));
  await page.locator('[data-afty-aba="acoes"]').click();
  await page.waitForTimeout(300);
  await page.locator('[data-afty-aba="habilidades"]').click();
  await page.waitForTimeout(400);
  log("scroll depois de ir e voltar:", await page.locator(".e-habilidades").evaluate((el) => el.scrollTop));
  await page.locator('[data-afty-aba="acoes"]').click();
  await page.keyboard.press("6");
  await page.waitForTimeout(400);
  log("tecla 6 leva a:", await page.locator('[data-afty-aba][aria-selected="true"]').getAttribute("data-afty-aba"));
  await page.keyboard.press("2");
  await page.waitForTimeout(300);
  log("tecla 2 leva a:", await page.locator('[data-afty-aba][aria-selected="true"]').getAttribute("data-afty-aba"));
  log("erros", JSON.stringify(erros.slice(0, 3)));
} finally { await browser.close(); }
