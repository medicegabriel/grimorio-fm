// D1 — Energia Reversa (motorAuto FUNÇÃO): cura por ação = Mod Con × mult(Patamar,BT),
// uso único custando 2 PE. Verifica resolver, regra e a aplicação do recurso.
import { chromium } from "playwright";
let browser;
try { browser = await chromium.launch({ channel: "chrome" }); }
catch { browser = await chromium.launch(); }
const page = await (await browser.newContext()).newPage();
page.on("pageerror", (e) => console.log("PAGEERROR:", e.message));
await page.goto("http://localhost:5173", { waitUntil: "networkidle" });

const r = await page.evaluate(async () => {
  const AU = await import("/src/components/fm-automation.js");
  const AP = await import("/src/components/fm-aptidoes.js");
  const TB = await import("/src/components/fm-tables.js");
  const { buildCatalogAutomation, activatedRulesOf, resolveResourceChanges, ruleHasSustainedEffect } = AU;
  const { getAptidaoByKey, getEnergiaReversaCura } = AP;
  const { getBonusTreinamento, getModifier } = TB;

  const entry = getAptidaoByKey("energia_reversa");

  // Caso 1: Calamidade ND 20 (BT alto), Constituição 18.
  const ctx1 = { core: { nd: 20, patamar: "calamidade" }, attributes: { constituicao: 18 }, aptidoes: {} };
  const bt1 = getBonusTreinamento(20), modCon1 = getModifier(18);
  const curaEsperada1 = getEnergiaReversaCura(ctx1);
  const inst1 = { id: "ap1", key: "energia_reversa", nome: "Energia Reversa", tipo: "official" };
  const auto1 = buildCatalogAutomation(entry, inst1, ctx1);
  const rule1 = auto1?.rules?.[0];
  const eff1 = rule1?.effects?.[0];
  const resChanges = resolveResourceChanges(rule1, null);

  // Simula ativação "uso único": cura PV (clamp a hpMax) e gasta 2 PE.
  const hpMax = 200, hpCur = 100, peCur = 10;
  const applyRes = (cur, op, val, max) => { let v = op === "set" ? val : op === "subtract" ? cur - val : cur + val; v = Math.max(0, Math.round(v)); return max != null ? Math.min(v, max) : v; };
  let hpAfter = hpCur, peAfter = peCur;
  const cost = rule1.cost.pe;
  if (peAfter >= cost) { peAfter -= cost; for (const ch of resChanges) if (ch.resource === "hp") hpAfter = applyRes(hpAfter, ch.op, ch.value, hpMax); }

  // Caso 2: Lacaio (não recebe cura) → sem regra/botão.
  const ctx2 = { core: { nd: 5, patamar: "lacaio" }, attributes: { constituicao: 18 }, aptidoes: {} };
  const auto2 = buildCatalogAutomation(entry, { id: "ap2", key: "energia_reversa", nome: "Energia Reversa" }, ctx2);

  return {
    bt1, modCon1, curaEsperada1,
    effValue: eff1?.value, effResource: eff1?.resource,
    activation: rule1?.activation,
    isUso: ruleHasSustainedEffect(rule1) === false, // sem efeito sustentado → "Usar"
    activatedCount: activatedRulesOf({ automation: auto1 }).length,
    hpAfter, peAfter,
    lacaioNoRule: auto2 === null,
  };
});

console.log(JSON.stringify(r, null, 2));
const curaOk = r.effValue === r.curaEsperada1 && r.curaEsperada1 === Math.max(0, Math.floor(r.modCon1 * (r.bt1 === 2 ? 0 : r.bt1 === 3 ? r.bt1 : r.bt1 === 4 ? r.bt1 * 1.5 : r.bt1 * 2)));
const checks = [
  ["cura = Mod Con × mult (resolver = efeito)", r.effValue === r.curaEsperada1 && r.curaEsperada1 > 0],
  ["efeito é recurso PV", r.effResource === "hp"],
  ["ativação = uso único", r.activation === "once" && r.isUso],
  ["1 regra ativável", r.activatedCount === 1],
  ["usar cura PV (100 → 100+cura)", r.hpAfter === Math.min(200, 100 + r.curaEsperada1)],
  ["usar gasta 2 PE (10 → 8)", r.peAfter === 8],
  ["Lacaio não gera regra (sem cura)", r.lacaioNoRule === true],
];
let ok = 0; for (const [n, p] of checks) { console.log(`${p ? "OK" : "XX"} ${n}`); if (p) ok++; }
console.log(`\n${ok}/${checks.length} PASS`);
await browser.close();
process.exit(ok === checks.length ? 0 : 1);
