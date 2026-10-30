import { abrir } from "./harness.mjs";
const modo = process.argv[2] ?? "classica";
const g2 = modo === "g2";
const sessao = { combate: { ativo: true, espiritoDeLuta: true, auraExcessiva: true, auraElemental: true, faiscasNegras: true, canalizarEmGolpe: true, sintonizada: true, duelando: true, arteExecucaoSilenciosa: true }, rodada: 3, condicoes: [{ id: "c_1", nome: "Envenenado" }, { id: "c_2", nome: "Desprevenido" }] };
const { browser, page } = await abrir({ amostraId: "minamoto", viewport: { width: 1440, height: 900 }, sessao, query: g2 ? "?ficha-g2=1" : "" });
const log = (...a) => console.log(...a);
await page.evaluate(() => { window.__long = []; new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__long.push(Math.round(e.duration)))).observe({ entryTypes: ["longtask"] }); });
try {
  await page.waitForTimeout(2000);
  await page.locator('[data-afty-aba="buffs"]').click();
  await page.waitForTimeout(3500);
  const nomes = ["Aura Elemental", "Sintonizada", "Canalizar em Golpe", "Duelando · Uma Arma, Mão Livre"];
  for (const n of nomes) {
    await page.evaluate(() => { window.__long.length = 0; });
    const t0 = Date.now();
    if (g2) {
      // G2: Encerrar do ativo; abre o cartão e encerra
      await page.locator(".e-g2 .e-area").getByText(n.split(" · ")[0], { exact: false }).first().click();
      await page.getByRole("button", { name: /Encerrar/ }).first().click();
    } else {
      await page.getByRole("button", { name: `Desligar ${n}`, exact: true }).click();
    }
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    const pintou = Date.now() - t0;
    await page.waitForTimeout(2500);
    const longas = await page.evaluate(() => window.__long.slice());
    log(`${n}: pintou em ${pintou} ms | tarefas longas ${JSON.stringify(longas)} soma ${longas.reduce((a, b) => a + b, 0)} ms`);
  }
} catch (e) { log("FALHA:", e.message.split("\n")[0]); } finally { await browser.close(); }
