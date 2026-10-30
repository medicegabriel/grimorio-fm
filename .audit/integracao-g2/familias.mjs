import { abrir } from "./harness.mjs";
const pasta = "C:/Projetos/Grimorio/grimorio-tracker/.audit/integracao-g2/capturas";
const { browser, page, erros } = await abrir({ amostraId: "minamoto", viewport: { width: 1280, height: 800 } });
const num = async (tipo) => Number((await page.locator(`.m-medidor[data-recurso="${tipo}"] .afty-vital-numero`).innerText()).trim());
const temp = async (tipo) => Number((await page.locator(`.m-medidor[data-recurso="${tipo}"] em`).first().innerText().catch(() => "0")).replace(/[^\d]/g, "") || 0);
const log = (...a) => console.log(...a);
const area = () => page.locator(".e-g2 .e-area");
async function abreCatalogo(cat = "Habilidades de Classe") {
  const voltar = page.getByRole("button", { name: /^Ativos$/ });
  if (await voltar.count()) { /* ja no catalogo */ } else { await page.getByRole("button", { name: /Adicionar/ }).first().click(); }
  await page.getByRole("button", { name: new RegExp(`^${cat}`) }).first().click();
  await page.waitForTimeout(250);
}
async function detalhe(nome) {
  await area().getByText(nome, { exact: true }).first().click();
  await page.waitForTimeout(300);
}
async function voltaAosAtivos() {
  const v = page.getByRole("button", { name: /^Ativos$/ });
  if (await v.count()) await v.click();
  await page.waitForTimeout(300);
}
try {
  await page.waitForTimeout(500);
  await page.getByRole("button", { name: /Fora de Combate/ }).click();
  await page.locator('[data-afty-aba="buffs"]').click();
  await abreCatalogo();
  log("inicio: pv", await num("pv"), "pe", await num("pe"), "pvtemp", await temp("pv"));

  // 1. Espirito de Luta
  await detalhe("Espírito de Luta");
  await area().getByRole("button", { name: "Ativar", exact: true }).last().click();
  await page.waitForTimeout(400);
  log("[Espírito] preparação:", (await area().innerText()).split("\n").map((s) => s.trim()).filter(Boolean).slice(-14).join(" | "));
  await page.screenshot({ path: `${pasta}/fam-espirito-prep.png` });
  await page.getByRole("button", { name: /Confirmar Ativação/ }).click();
  await page.waitForTimeout(700);
  log("[Espírito] depois: pe", await num("pe"), "pvtemp", await temp("pv"));
  await voltaAosAtivos();
  await page.screenshot({ path: `${pasta}/fam-espirito-ativo.png` });

  // 2. Conhecimento Aplicado
  await abreCatalogo();
  await detalhe("Conhecimento Aplicado");
  await area().getByRole("button", { name: "Ativar", exact: true }).last().click();
  await page.waitForTimeout(400);
  log("[Conhecimento] preparação:", (await area().innerText()).split("\n").map((s) => s.trim()).filter(Boolean).slice(-14).join(" | "));
  await page.screenshot({ path: `${pasta}/fam-conhecimento-prep.png` });
  await page.getByRole("button", { name: /Confirmar Ativação/ }).click();
  await page.waitForTimeout(700);
  log("[Conhecimento] depois: pe", await num("pe"));
  await voltaAosAtivos();

  // 3. Golpe Especial
  await abreCatalogo();
  await detalhe("Golpe Especial");
  await area().getByRole("button", { name: "Ativar", exact: true }).last().click();
  await page.waitForTimeout(400);
  log("[Golpe] preparação:", (await area().innerText()).split("\n").map((s) => s.trim()).filter(Boolean).slice(-18).join(" | "));
  await page.screenshot({ path: `${pasta}/fam-golpe-prep.png` });

  log("erros", JSON.stringify(erros.slice(0, 4)));
} catch (e) { log("FALHA:", e.message.split("\n")[0]); log("erros", JSON.stringify(erros.slice(0, 4))); await page.screenshot({ path: `${pasta}/fam-falha.png` }); } finally { await browser.close(); }
