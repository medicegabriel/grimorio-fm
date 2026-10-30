/* O hover do Dano do golpe da Técnica no G2 contra o da linha de arma (2026-10-27). */
import { chromium } from "playwright";
import os from "node:os";
import path from "node:path";

const cena = process.argv[2] ?? "jogador";
const browser = await chromium.launch({ channel: "chrome", ignoreDefaultArgs: ["--hide-scrollbars"] });
try {
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 1100 } })).newPage();
  page.setDefaultTimeout(15000);
  await page.goto(`http://127.0.0.1:5341/?ficha=${cena}`, { waitUntil: "networkidle" });
  await page.getByRole("tab", { name: /^Ações/ }).click();
  await page.waitForTimeout(500);
  const golpe = page.locator('[data-m-linha="feitico:tm-golpe"]');
  await golpe.locator("select").selectOption({ label: "Katana" });
  await page.waitForTimeout(300);
  const dano = golpe.getByRole("button", { name: /^Dano/ }).first();
  await dano.hover();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(os.tmpdir(), `tm-hover-golpe-${cena}.png`) });
  const katana = page.locator('[data-m-linha="dano:arma-tm-katana"], [data-m-linha^="dano:"]').nth(1);
  await page.mouse.move(5, 5);
  await katana.getByRole("button", { name: /^Dano/ }).hover();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(os.tmpdir(), `tm-hover-arma-${cena}.png`) });
} finally {
  await browser.close();
}
