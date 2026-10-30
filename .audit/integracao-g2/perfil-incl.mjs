import { abrir } from "./harness.mjs";
import fs from "node:fs";
const id = process.argv[2] ?? "minamoto";
const g2 = process.argv[3] === "g2";
const { browser, page } = await abrir({ amostraId: id, viewport: { width: 1440, height: 900 }, query: g2 ? "?ficha-g2=1" : "" });
const cdp = await page.context().newCDPSession(page);
const log = (...a) => console.log(...a);
try {
  await page.waitForTimeout(1500);
  await page.getByRole("button", { name: /Fora de Combate/ }).click().catch(() => {});
  await page.locator('[data-afty-aba="buffs"]').click();
  await page.getByRole("button", { name: /Adicionar/ }).first().click();
  await page.getByRole("button", { name: /^Habilidades de Classe/ }).first().click();
  await page.locator(".e-g2 .e-area").getByText("Ataque Concentrado", { exact: true }).first().click();
  await page.locator(".e-g2 .e-area").getByRole("button", { name: "Ativar", exact: true }).last().click();
  await page.waitForTimeout(500);
  await cdp.send("Profiler.enable");
  await cdp.send("Profiler.setSamplingInterval", { interval: 100 });
  await cdp.send("Profiler.start");
  await page.getByRole("button", { name: /Confirmar Ativação/ }).click();
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  await page.waitForTimeout(300);
  const { profile } = await cdp.send("Profiler.stop");
  const { nodes, samples, timeDeltas } = profile;
  const porId = new Map(nodes.map((n) => [n.id, n]));
  const pai = new Map(); nodes.forEach((n) => (n.children ?? []).forEach((c) => pai.set(c, n.id)));
  const self = new Map(); samples.forEach((s, i) => self.set(s, (self.get(s) ?? 0) + (timeDeltas[i] ?? 0)));
  const incl = new Map();
  for (const [nid, t] of self) { const vistos = new Set(); for (let x = nid; x != null; x = pai.get(x)) { const n = porId.get(x); const k = `${n.callFrame.functionName || "(anon)"} ${n.callFrame.url.split("/").slice(-2).join("/").split("?")[0]}:${n.callFrame.lineNumber}`; if (vistos.has(k)) continue; vistos.add(k); incl.set(k, (incl.get(k) ?? 0) + t); } }
  // quem chamou o deriveAfty: sobe da raiz do derive até o primeiro quadro fora de afty-derive/afty-addons
  const quem = new Map();
  for (const [nid, tt] of self) {
    let x = nid; let achou = false;
    const cadeia = [];
    for (; x != null; x = pai.get(x)) cadeia.push(porId.get(x));
    const i = cadeia.findIndex((n) => n.callFrame.functionName === "deriveAfty");
    if (i < 0) continue;
    const chamadores = cadeia.slice(i + 1).filter((n) => n.callFrame.url.includes("/ficha/")).map((n) => n.callFrame.functionName || "(anon)").filter((x) => !/^((anon)|comAddons|derivar)$/.test(x)).slice(0, 4);
    const k = chamadores.join(" < ");
    quem.set(k, (quem.get(k) ?? 0) + tt);
  }
  log("--- quem chama o derive (ms, cadeia curta) ---");
  [...quem.entries()].sort((a, b) => b[1] - a[1]).slice(0, 14).forEach(([k, v]) => log((v / 1000).toFixed(0).padStart(5), "ms", k));
  const top = [...incl.entries()].filter(([k]) => /src\/systems|afty/.test(k)).sort((a, b) => b[1] - a[1]).slice(0, 30);
  top.forEach(([k, v]) => log((v / 1000).toFixed(0).padStart(5), "ms", k));
} catch (e) { log("FALHA", e.message.split("\n")[0]); } finally { await browser.close(); }
