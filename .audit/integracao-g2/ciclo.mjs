import { abrir } from "./harness.mjs";
const pasta = "C:/Projetos/Grimorio/grimorio-tracker/.audit/integracao-g2/capturas";
const { browser, page, erros } = await abrir({ amostraId: "minamoto", viewport: { width: 1280, height: 800 } });
const num = async (tipo) => Number((await page.locator(`.m-medidor[data-recurso="${tipo}"] .afty-vital-numero`).innerText()).trim());
const log = (...a) => console.log(...a);
const area = () => page.locator(".e-g2 .e-area");
const texto = async () => (await area().innerText()).split("\n").map((s) => s.trim()).filter(Boolean);
try {
  await page.waitForTimeout(500);
  await page.getByRole("button", { name: /Fora de Combate/ }).click();
  await page.locator('[data-afty-aba="buffs"]').click();
  await page.getByRole("button", { name: /Adicionar/ }).first().click();
  await page.getByRole("button", { name: /^Habilidades de Classe/ }).first().click();
  await area().getByText("Ataque Concentrado", { exact: true }).first().click();
  await area().getByRole("button", { name: "Ativar", exact: true }).last().click();
  await page.waitForTimeout(300);
  await page.getByRole("button", { name: /Confirmar Ativação/ }).click();   // intensidade 1: 1 PE
  await page.waitForTimeout(700);
  log("1) ativado na Intensidade 1: pe", await num("pe"), "(178 - 1 = 177)");
  // ajustar para 2 pelo passo "+" do Ajustar
  await area().getByRole("button", { name: /mais|\+/i }).first().click().catch(() => {});
  await page.waitForTimeout(300);
  log("2) Ajustar:", (await texto()).filter((s) => /Ajust|Intensidade|Custo|Confirmar/.test(s)).slice(0, 6).join(" | "));
  await page.screenshot({ path: `${pasta}/ciclo-ajustar.png` });
  const conf = page.getByRole("button", { name: /Confirmar Ajuste/ });
  if (await conf.count()) { await conf.first().click(); await page.waitForTimeout(600); log("   depois de confirmar o ajuste: pe", await num("pe"), "(sobe cobrando só a diferença: 177 - 2 = 175)"); }
  // encerrar
  await area().getByRole("button", { name: /Encerrar/ }).first().click();
  await page.waitForTimeout(500);
  log("3) encerrado: pe", await num("pe"), "(desce sem devolver)");
  log("   Encerrados recolhidos?:", (await texto()).filter((s) => /Encerrado/.test(s)).slice(0, 3).join(" | "));
  await page.screenshot({ path: `${pasta}/ciclo-encerrado.png` });
  // reativar
  const enc = area().getByText(/Encerrados/).first();
  if (await enc.count()) await enc.click().catch(() => {});
  await page.waitForTimeout(300);
  const reat = page.getByRole("button", { name: /Reativar/ });
  log("4) botões Reativar:", await reat.count());
  if (await reat.count()) { await reat.first().click(); await page.waitForTimeout(500); log("   preparação da reativação:", (await texto()).slice(-10).join(" | ")); await page.screenshot({ path: `${pasta}/ciclo-reativar.png` }); }
  log("erros", JSON.stringify(erros.slice(0, 4)));
} catch (e) { log("FALHA:", e.message.split("\n")[0]); log("erros", JSON.stringify(erros.slice(0, 4))); await page.screenshot({ path: `${pasta}/ciclo-falha.png` }); } finally { await browser.close(); }
