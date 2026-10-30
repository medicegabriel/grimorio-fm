import { abrir } from "./harness.mjs";
const pasta = "C:/Projetos/Grimorio/grimorio-tracker/.audit/integracao-g2/capturas";
const id = process.argv[2] ?? "megumi";
const w = Number(process.argv[3] ?? 1280), h = Number(process.argv[4] ?? 800);
const { browser, page, erros } = await abrir({ amostraId: id, viewport: { width: w, height: h } });
const log = (...a) => console.log(...a);
try {
  await page.waitForTimeout(500);
  await page.locator('[data-afty-aba="habilidades"]').click();
  await page.waitForTimeout(400);
  const linha = page.locator(".e-linha-corpo").first();
  const nome = await linha.innerText();
  await linha.click();
  await page.waitForTimeout(400);
  log("consulta aberta:", await page.locator(".e-consulta").count(), "titulo:", (await page.locator(".e-consulta-titulo").innerText()).trim());
  await page.screenshot({ path: `${pasta}/${id}-${w}-consulta.png` });
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);
  log("consulta depois do Esc:", await page.locator(".e-consulta").count(), "foco volta à linha:", await page.evaluate(() => document.activeElement?.className?.includes?.("e-linha-corpo")));
  // painel ao lado nas outras abas
  await page.locator('[data-afty-aba="acoes"]').click();
  await page.waitForTimeout(300);
  log("painel aberto por padrão?", await page.locator(".g-painel").count());
  await page.getByRole("button", { name: /^Efeitos/ }).first().click();
  await page.waitForTimeout(500);
  log("painel após clicar em Efeitos:", await page.locator(".g-painel").count());
  await page.screenshot({ path: `${pasta}/${id}-${w}-painel.png` });
  await page.getByRole("button", { name: /Expandir/ }).first().click();
  await page.waitForTimeout(500);
  log("aba ativa após Expandir:", await page.locator('[data-afty-aba][aria-selected="true"]').getAttribute("data-afty-aba"));
  await page.getByRole("button", { name: /^Efeitos/ }).first().click();
  await page.waitForTimeout(400);
  log("aba ativa após Recolher:", await page.locator('[data-afty-aba][aria-selected="true"]').getAttribute("data-afty-aba"), "painel:", await page.locator(".g-painel").count());
  await page.reload({ waitUntil: "networkidle" });
  await page.getByText(id === "megumi" ? "Megumi Fushiguro" : "Minamoto no Flugel", { exact: true }).first().click();
  await page.waitForSelector("#afty-ficha");
  log("painel lembrado após recarregar:", await page.locator(".g-painel").count());
  log("erros", JSON.stringify(erros.slice(0, 4)));
} catch (e) { log("FALHA:", e.message.split("\n")[0]); log("erros", JSON.stringify(erros.slice(0, 4))); await page.screenshot({ path: `${pasta}/${id}-fluxo7-falha.png` }); } finally { await browser.close(); }
