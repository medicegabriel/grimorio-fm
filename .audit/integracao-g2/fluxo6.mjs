import { abrir } from "./harness.mjs";
const id = process.argv[2] ?? "megumi";
const { browser, page, erros, sistema } = await abrir({ amostraId: id, viewport: { width: 1280, height: 800 } });
const log = (...a) => console.log(...a);
const prefSalva = () => page.evaluate((s) => { const l = JSON.parse(localStorage.getItem(`fm_creatures_${s}_v1`)); return l[0].preferenciasFicha ?? null; }, sistema);
try {
  await page.waitForTimeout(500);
  await page.getByRole("button", { name: /Mais opções da ficha/ }).click();
  await page.getByRole("menuitem", { name: /Estatísticas do Cabeçalho/ }).click();
  await page.locator('[data-estat-linha="cd"] [data-estat-mostrar]').click();
  await page.keyboard.press("Escape");
  await page.waitForTimeout(600);
  log("antes:", JSON.stringify(await prefSalva()));
  await page.getByRole("button", { name: /Mais opções da ficha/ }).click();
  await page.getByRole("menuitem", { name: /Editar no Criador/ }).click();
  await page.waitForTimeout(1200);
  const botoes = await page.getByRole("button").allInnerTexts();
  log("botões do criador:", botoes.map((b) => b.trim()).filter(Boolean).filter((b) => /salv|voltar|ficha|sair/i.test(b)).join(" | "));
  await page.getByRole("button", { name: /Salvar/ }).first().click();
  await page.waitForTimeout(1200);
  log("depois de salvar no criador:", JSON.stringify(await prefSalva()));
  log("url/titulo:", (await page.locator("h1,h2").first().innerText().catch(() => "?")).slice(0, 60));
  log("erros", JSON.stringify(erros.slice(0, 4)));
} catch (e) { log("FALHA:", e.message.split("\n")[0]); log("erros", JSON.stringify(erros.slice(0, 4))); } finally { await browser.close(); }
