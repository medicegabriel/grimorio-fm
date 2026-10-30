import { abrir } from "./harness.mjs";
const pasta = "C:/Projetos/Grimorio/grimorio-tracker/.audit/integracao-g2/capturas";
const id = process.argv[2] ?? "minamoto";
const { browser, page, erros } = await abrir({ amostraId: id, viewport: { width: 1280, height: 800 } });
const num = async (tipo) => Number((await page.locator(`.m-medidor[data-recurso="${tipo}"] .afty-vital-numero`).innerText()).trim());
const log = (...a) => console.log(...a);
try {
  await page.waitForTimeout(500);
  log("antes: pv", await num("pv"), "pe", await num("pe"), "alma", await num("alma"));
  // dano na vida
  await page.locator('.m-medidor[data-recurso="pv"]').click();
  await page.locator(".m-painel-vital input").fill("10");
  await page.getByRole("button", { name: "Dano", exact: true }).click();
  await page.waitForTimeout(300);
  log("pv depois do dano 10:", await num("pv"));
  await page.locator(".m-painel-vital input").fill("4");
  await page.getByRole("button", { name: "Cura", exact: true }).click();
  await page.waitForTimeout(300);
  log("pv depois da cura 4:", await num("pv"));
  await page.keyboard.press("Escape");
  // gasto de PE
  await page.locator('.m-medidor[data-recurso="pe"]').click();
  await page.locator(".m-painel-vital input").fill("5");
  await page.getByRole("button", { name: "Gastar", exact: true }).click();
  await page.waitForTimeout(300);
  log("pe depois de gastar 5:", await num("pe"));
  await page.keyboard.press("Escape");
  // alma
  await page.locator('.m-medidor[data-recurso="alma"]').click();
  await page.locator(".m-painel-vital input").fill("7");
  await page.getByRole("button", { name: "Dano", exact: true }).click();
  await page.waitForTimeout(300);
  log("alma depois de dano 7:", await num("alma"), "pv:", await num("pv"));
  await page.keyboard.press("Escape");
  // preparo (se houver)
  if (await page.locator('.m-medidor[data-recurso="preparo"]').count()) {
    await page.locator('.m-medidor[data-recurso="preparo"]').click();
    await page.locator(".m-painel-vital input").fill("2");
    await page.getByRole("button", { name: "Gastar", exact: true }).click();
    await page.waitForTimeout(300);
    log("preparo depois de gastar 2:", await num("preparo"), "pe (nao muda):", await num("pe"));
    await page.keyboard.press("Escape");
  }
  await page.screenshot({ path: `${pasta}/${id}-recursos.png` });
  // histórico
  await page.getByRole("button", { name: /Mais opções da ficha/ }).click();
  await page.getByRole("menuitem", { name: /Histórico da Sessão/ }).click();
  log("historico:", (await page.locator("[data-historico-lista]").innerText()).replace(/\n+/g, " | ").slice(0, 500));
  await page.keyboard.press("Escape");
  log("erros", JSON.stringify(erros.slice(0, 4)));
} catch (e) { log("FALHA:", e.message.split("\n")[0]); log("erros", JSON.stringify(erros.slice(0, 4))); await page.screenshot({ path: `${pasta}/${id}-fluxo4-falha.png` }); } finally { await browser.close(); }
