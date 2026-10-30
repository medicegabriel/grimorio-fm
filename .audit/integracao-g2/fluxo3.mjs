import { abrir } from "./harness.mjs";
const pasta = "C:/Projetos/Grimorio/grimorio-tracker/.audit/integracao-g2/capturas";
const { browser, page, erros } = await abrir({ amostraId: "minamoto", viewport: { width: 1280, height: 800 } });
const pe = async () => Number((await page.locator('.m-medidor[data-recurso="pe"] .afty-vital-numero').innerText()).trim());
const log = (...a) => console.log(...a);
const sessaoSalva = () => page.evaluate(() => { const k = Object.keys(localStorage).find((x) => x.startsWith("fm_ficha_sessao_afty_v1:")); return k ? JSON.parse(localStorage.getItem(k)) : null; });
try {
  await page.waitForTimeout(500);
  await page.getByRole("button", { name: /Fora de Combate/ }).click();
  await page.locator('[data-afty-aba="buffs"]').click();
  await page.getByRole("button", { name: /Adicionar/ }).first().click();
  await page.getByRole("button", { name: /^Habilidades de Classe/ }).first().click();
  await page.locator(".e-g2 .e-area").getByText("Ataque Concentrado", { exact: true }).first().click();
  const antes = await pe();
  await page.locator(".e-g2 .e-area").getByRole("button", { name: "Ativar", exact: true }).last().click();
  await page.waitForTimeout(400);
  await page.locator(".e-g2 .m-seg-op", { hasText: /^3$/ }).first().click();
  await page.getByRole("button", { name: /Confirmar Ativação/ }).click();
  await page.waitForTimeout(900);
  log("PE:", antes, "->", await pe(), "(esperado -3)");
  await page.screenshot({ path: `${pasta}/minamoto-ac-confirmado.png` });
  const aba = (await page.locator('[data-afty-aba="buffs"]').innerText()).replace(/\s+/g, " ");
  log("aba:", aba);
  // histórico
  await page.getByRole("button", { name: /Mais opções da ficha/ }).click();
  await page.getByRole("menuitem", { name: /Histórico da Sessão/ }).click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${pasta}/minamoto-historico.png` });
  const h = (await page.locator("[data-historico-lista]").innerText()).replace(/\n+/g, " | ");
  log("historico:", h.slice(0, 300));
  await page.locator("[data-estornar]").first().click();
  await page.waitForTimeout(500);
  log("PE após estorno:", await pe());
  log("historico 2:", (await page.locator("[data-historico-lista]").innerText()).replace(/\n+/g, " | ").slice(0, 400));
  await page.keyboard.press("Escape");
  // persistência
  await page.waitForTimeout(1200);
  const s = await sessaoSalva();
  log("salva: pe", s?.peAtual, "operacoes.eventos", s?.operacoes?.eventos?.length, "ativacoes", Object.keys(s?.operacoes?.ativacoes ?? {}).length);
  await page.reload({ waitUntil: "networkidle" });
  await page.getByText("Minamoto no Flugel", { exact: true }).first().click();
  await page.waitForSelector("#afty-ficha");
  log("após recarregar: PE", await pe());
  await page.locator('[data-afty-aba="buffs"]').click();
  await page.waitForTimeout(500);
  log("aba depois:", (await page.locator('[data-afty-aba="buffs"]').innerText()).replace(/\s+/g, " "));
  await page.screenshot({ path: `${pasta}/minamoto-ac-recarregado.png` });
  log("erros", JSON.stringify(erros.slice(0, 4)));
} catch (e) { log("FALHA:", e.message.split("\n")[0]); log("erros", JSON.stringify(erros.slice(0, 4))); await page.screenshot({ path: `${pasta}/minamoto-fluxo3-falha.png` }); } finally { await browser.close(); }
