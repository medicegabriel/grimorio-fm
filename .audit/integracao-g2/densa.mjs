import { abrir } from "./harness.mjs";
const pasta = "C:/Projetos/Grimorio/grimorio-tracker/.audit/integracao-g2/capturas";
const w = Number(process.argv[2] ?? 1024), h = Number(process.argv[3] ?? 720);
const sessao = { combate: { ativo: true, espiritoDeLuta: true, auraExcessiva: true, auraElemental: true, faiscasNegras: true, canalizarEmGolpe: true, sintonizada: true, duelando: true, arteExecucaoSilenciosa: true }, rodada: 3, condicoes: [{ id: "c_1", nome: "Envenenado" }, { id: "c_2", nome: "Desprevenido" }] };
const { browser, page, erros } = await abrir({ amostraId: "minamoto", viewport: { width: w, height: h }, sessao });
try {
  await page.waitForTimeout(700);
  await page.locator('[data-afty-aba="buffs"]').click();
  await page.waitForTimeout(800);
  const n = await page.locator('[data-afty-aba="buffs"] .f-aba-n').innerText();
  console.log("ativos na aba:", n);
  await page.screenshot({ path: `${pasta}/densa-${w}x${h}.png` });
  console.log("erros", JSON.stringify(erros.slice(0, 4)));
} finally { await browser.close(); }
