import { abrir } from "./harness.mjs";
import fs from "node:fs";
const id = process.argv[2] ?? "calamidade";
const g2 = process.argv[3] === "g2";
const N = Number(process.argv[4] ?? 4);
const pasta = "C:/Projetos/Grimorio/grimorio-tracker/.audit/integracao-g2/perf";
fs.mkdirSync(pasta, { recursive: true });
const { browser, page, erros } = await abrir({ amostraId: id, viewport: { width: 1440, height: 900 }, query: g2 ? "?ficha-g2=1" : "" });
const cdp = await page.context().newCDPSession(page);
const log = (...a) => console.log(...a);
// mede: tempo ate 2 quadros apos o clique e tarefas longas
await page.evaluate(() => { window.__long = []; new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__long.push(Math.round(e.duration)))).observe({ entryTypes: ["longtask"] }); });
async function medido(nome, fn) {
  await page.evaluate(() => { window.__long.length = 0; });
  const t0 = Date.now();
  await fn();
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  const ms = Date.now() - t0;
  const longas = await page.evaluate(() => window.__long.slice());
  log(`${nome}: ${ms} ms, tarefas longas ${JSON.stringify(longas)}`);
  return ms;
}
try {
  await page.waitForTimeout(800);
  await page.getByRole("button", { name: /Fora de Combate/ }).click().catch(() => {});
  if (g2) {
    await page.locator('[data-afty-aba="buffs"]').click();
    await page.getByRole("button", { name: /Adicionar/ }).first().click();
    await page.getByRole("button", { name: /^Habilidades de Classe/ }).first().click().catch(() => {});
  } else {
    await page.locator('[data-afty-aba="buffs"]').click();
  }
  await page.waitForTimeout(500);
  await cdp.send("Profiler.enable");
  await cdp.send("Profiler.setSamplingInterval", { interval: 200 });
  await cdp.send("Profiler.start");
  if (g2) {
    const nomes = ["Ataque Concentrado", "Espírito de Luta", "Conhecimento Aplicado", "Arsenal Cíclico", "Repertório do Especialista", "Assumir Postura"];
    let feitos = 0;
    for (const nome of nomes) {
      if (feitos >= N) break;
      const voltar = page.getByRole("button", { name: /^Ativos$/ });
      if (!(await voltar.count())) { await page.getByRole("button", { name: /Adicionar/ }).first().click(); }
      await page.getByRole("button", { name: /^Habilidades de Classe/ }).first().click();
      await page.locator(".e-g2 .e-area").getByText(nome, { exact: true }).first().click();
      await medido(`abrir preparação de ${nome}`, async () => { await page.locator(".e-g2 .e-area").getByRole("button", { name: "Ativar", exact: true }).last().click(); });
      const ok = await medido(`confirmar ${nome}`, async () => { await page.getByRole("button", { name: /Confirmar (Ativação|Golpe)/ }).first().click({ timeout: 4000 }).catch(() => {}); });
      feitos++;
      await page.waitForTimeout(300);
    }
  } else {
    log("classica: lista de estados na aba Buffs");
    const ctrls = page.locator('[data-afty-aba="buffs"]');
    const liga = page.getByRole("button", { name: /^Ligar|Ligado|Desligado/ });
    log("botoes liga:", await liga.count());
    const sw = page.locator('button[role="switch"], .afty-chave');
    log("switches:", await sw.count());
  }
  const perfil = await cdp.send("Profiler.stop");
  fs.writeFileSync(`${pasta}/${id}-${g2 ? "g2" : "classica"}.cpuprofile`, JSON.stringify(perfil.profile));
  // top self time por funcao
  const { nodes, samples, timeDeltas } = perfil.profile;
  const porId = new Map(nodes.map((n) => [n.id, n]));
  const self = new Map();
  samples.forEach((s, i) => { const n = porId.get(s); const k = `${n.callFrame.functionName || "(anon)"} ${n.callFrame.url.split("/").slice(-1)[0].split("?")[0]}:${n.callFrame.lineNumber}`; self.set(k, (self.get(k) ?? 0) + (timeDeltas[i] ?? 0)); });
  const top = [...self.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);
  log("top self (ms):"); top.forEach(([k, v]) => log("  ", (v / 1000).toFixed(0).padStart(5), k));
  log("erros", JSON.stringify(erros.slice(0, 3)));
} catch (e) { log("FALHA:", e.message.split("\n")[0]); } finally { await browser.close(); }
