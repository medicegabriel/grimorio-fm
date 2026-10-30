import { abrir } from "./harness.mjs";
const ids = ["umComArma","brutalidade","ataqueInconsequente","impactoMisto","furiaVinganca","imprudenciaMotivadora","golpeAtroz","golpeLetal","arteExecucaoSilenciosa","espiritoDeLuta","auraExcessiva","auraElemental","faiscasNegras","canalizarEmGolpe"];
const sessao = { combate: { ativo: true, ...Object.fromEntries(ids.map((i) => [i, true])) }, rodada: 3, condicoes: [{ id: "c_1", nome: "Envenenado" }] };
const { browser, page } = await abrir({ amostraId: "calamidade", viewport: { width: 1440, height: 900 }, sessao, query: "?ficha-g2=1" });
const cdp = await page.context().newCDPSession(page);
const log = (...a) => console.log(...a);
try {
  await page.waitForTimeout(2500);
  await page.locator('[data-afty-aba="buffs"]').click();
  await page.waitForTimeout(4000);
  await page.locator(".e-g2 .e-area").getByText("Aura Elemental", { exact: false }).first().click();
  await page.waitForTimeout(600);
  await cdp.send("Profiler.enable"); await cdp.send("Profiler.setSamplingInterval", { interval: 100 }); await cdp.send("Profiler.start");
  await page.getByRole("button", { name: /Encerrar/ }).first().click();
  await page.waitForTimeout(2500);
  const { profile } = await cdp.send("Profiler.stop");
  const { nodes, samples, timeDeltas } = profile;
  const porId = new Map(nodes.map((n) => [n.id, n])); const pai = new Map(); nodes.forEach((n) => (n.children ?? []).forEach((c) => pai.set(c, n.id)));
  const self = new Map(); samples.forEach((s, i) => self.set(s, (self.get(s) ?? 0) + (timeDeltas[i] ?? 0)));
  const incl = new Map(); const quem = new Map();
  for (const [nid, t] of self) {
    const cadeia = []; for (let x = nid; x != null; x = pai.get(x)) cadeia.push(porId.get(x));
    const vistos = new Set();
    for (const n of cadeia) { const k = `${n.callFrame.functionName || "(anon)"} ${n.callFrame.url.split("/").slice(-1)[0].split("?")[0]}:${n.callFrame.lineNumber}`; if (!vistos.has(k)) { vistos.add(k); incl.set(k, (incl.get(k) ?? 0) + t); } }
    const i = cadeia.findIndex((n) => n.callFrame.functionName === "deriveAfty");
    if (i >= 0) { const k = cadeia.slice(i + 1).filter((n) => n.callFrame.url.includes("/ficha/")).map((n) => n.callFrame.functionName || "(anon)").filter((x) => !/^(\(anon\)|comAddons|derivar)$/.test(x)).slice(0, 4).join(" < "); quem.set(k, (quem.get(k) ?? 0) + t); }
  }
  log("--- derive por chamador ---"); [...quem.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).forEach(([k, v]) => log((v / 1000).toFixed(0).padStart(5), "ms", k));
  log("--- inclusivo (app, sem derive) ---");
  [...incl.entries()].filter(([k]) => /(efeitos|ficha|Aba|Afty)/.test(k) && !/afty-(derive|efeitos|addons|pericias|equip)/.test(k)).sort((a, b) => b[1] - a[1]).slice(0, 22).forEach(([k, v]) => log((v / 1000).toFixed(0).padStart(5), "ms", k));
} catch (e) { log("FALHA:", e.message.split("\n")[0]); } finally { await browser.close(); }
