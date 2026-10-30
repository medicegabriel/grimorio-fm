import { abrir } from "./harness.mjs";
const modo = process.argv[2] ?? "g2";
const g2 = modo === "g2";
const ids = ["umComArma","brutalidade","ataqueInconsequente","impactoMisto","furiaVinganca","imprudenciaMotivadora","golpeAtroz","golpeLetal","arteExecucaoSilenciosa","espiritoDeLuta","auraExcessiva","auraElemental","faiscasNegras","canalizarEmGolpe"];
const sessao = { combate: { ativo: true, ...Object.fromEntries(ids.map((i) => [i, true])) }, rodada: 3, condicoes: [] };
const { browser, page } = await abrir({ amostraId: "calamidade", viewport: { width: 1440, height: 900 }, sessao, query: g2 ? "?ficha-g2=1" : "" });
const log = (...a) => console.log(...a);
await page.evaluate(() => { window.__long = []; new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__long.push(Math.round(e.duration)))).observe({ entryTypes: ["longtask"] }); });
const estado = () => page.evaluate(() => { const k = Object.keys(localStorage).find((x) => x.startsWith("fm_ficha_sessao_afty_v1:")); const s = JSON.parse(localStorage.getItem(k)); return JSON.stringify({ c: s.combate, pe: s.peAtual, hp: s.hpAtual, r: s.rodada }); });
try {
  await page.waitForTimeout(2500);
  await page.locator('[data-afty-aba="buffs"]').click();
  await page.waitForTimeout(3500);
  const nomes = g2 ? ["Aura Elemental", "Brutalidade", "Faíscas Negras", "Canalizar em Golpe", "Sintonizada"] : ["Aura Elemental", "Brutalidade", "Abençoado pelas Faíscas Negras", "Canalizar em Golpe"];
  await page.evaluate(() => { window.__long.length = 0; });
  const t0 = Date.now();
  for (const n of nomes) {
    if (g2) { await page.locator(".e-g2 .e-area").getByText(n, { exact: false }).first().click({ timeout: 3000 }).catch(() => {}); await page.getByRole("button", { name: /Encerrar/ }).first().click({ timeout: 3000 }).catch(() => {}); }
    else await page.getByRole("button", { name: `Desligar ${n}`, exact: true }).click({ timeout: 3000 }).catch(() => {});
  }
  const rapido = Date.now() - t0;
  await page.waitForTimeout(3500);
  const longas = await page.evaluate(() => window.__long.slice());
  await page.waitForTimeout(800);
  const antes = await estado();
  log(`${modo}: ${nomes.length} cliques em sequência em ${rapido} ms | tarefas longas ${JSON.stringify(longas)}`);
  await page.reload({ waitUntil: "networkidle" });
  await page.getByText("Criatura Calamidade ND 40", { exact: true }).first().click();
  await page.waitForSelector("#afty-ficha");
  const depois = await estado();
  log("sessão gravada igual depois de recarregar:", antes === depois, "| ligados restantes:", Object.entries(JSON.parse(depois).c).filter(([k, v]) => k !== "ativo" && v).length);
} catch (e) { log("FALHA:", e.message.split("\n")[0]); } finally { await browser.close(); }
