import { abrir } from "./harness.mjs";
const sessao = { combate: { ativo: true, espiritoDeLuta: true, auraExcessiva: true, auraElemental: true, faiscasNegras: true, canalizarEmGolpe: true, sintonizada: true, duelando: true, arteExecucaoSilenciosa: true }, rodada: 3, condicoes: [{ id: "c_1", nome: "Envenenado" }, { id: "c_2", nome: "Desprevenido" }] };
const { browser, page } = await abrir({ amostraId: "minamoto", viewport: { width: 1440, height: 900 }, sessao });
const cdp = await page.context().newCDPSession(page);
try {
  await page.waitForTimeout(1500);
  await page.locator('[data-afty-aba="buffs"]').click();
  await page.waitForTimeout(3000);
  const rot = await page.getByRole("button").evaluateAll((els) => els.map((e) => (e.getAttribute("aria-label") || e.innerText || "").trim()).filter(Boolean));
  console.log(rot.filter((r) => /desligar|ligar|×|remover|encerrar/i.test(r)).slice(0, 14).join(" | "));
} finally { await browser.close(); }
