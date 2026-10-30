import { abrir } from "./harness.mjs";
const pasta = "C:/Projetos/Grimorio/grimorio-tracker/.audit/integracao-g2/capturas";
const id = process.argv[2] ?? "megumi";
const { browser, page, erros, sistema } = await abrir({ amostraId: id, viewport: { width: 1280, height: 800 } });
const log = (...a) => console.log(...a);
const stats = () => page.locator(".e-stats .e-stat").evaluateAll((els) => els.map((e) => e.dataset.aftyStat));
const prefSalva = () => page.evaluate((s) => { const l = JSON.parse(localStorage.getItem(`fm_creatures_${s}_v1`)); return l[0].preferenciasFicha ?? null; }, sistema);
try {
  await page.waitForTimeout(500);
  log("stats iniciais:", (await stats()).join(","));
  await page.getByRole("button", { name: /Mais opções da ficha/ }).click();
  await page.getByRole("menuitem", { name: /Estatísticas do Cabeçalho/ }).click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${pasta}/${id}-estatisticas.png` });
  // oculta CD e desce Defesa
  await page.locator('[data-estat-linha="cd"] [data-estat-mostrar]').click();
  await page.locator('[data-estat-linha="defesa"] [data-estat-descer]').click();
  await page.waitForTimeout(300);
  log("stats depois:", (await stats()).join(","));
  await page.keyboard.press("Escape");
  await page.waitForTimeout(500);
  log("pref no personagem:", JSON.stringify(await prefSalva()));
  await page.reload({ waitUntil: "networkidle" });
  await page.getByText(id === "megumi" ? "Megumi Fushiguro" : "Minamoto no Flugel", { exact: true }).first().click();
  await page.waitForSelector("#afty-ficha");
  log("stats após recarregar:", (await stats()).join(","));
  // editar no criador e voltar
  await page.getByRole("button", { name: /Mais opções da ficha/ }).click();
  await page.getByRole("menuitem", { name: /Editar no Criador/ }).click();
  await page.waitForTimeout(1200);
  log("no criador:", (await page.locator("h1, h2").first().innerText().catch(() => "?")).slice(0, 60));
  log("pref após abrir o criador:", JSON.stringify(await prefSalva()));
  log("erros", JSON.stringify(erros.slice(0, 4)));
} catch (e) { log("FALHA:", e.message.split("\n")[0]); log("erros", JSON.stringify(erros.slice(0, 4))); await page.screenshot({ path: `${pasta}/${id}-fluxo5-falha.png` }); } finally { await browser.close(); }
