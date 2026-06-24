import { chromium } from "playwright";
let browser;
try { browser = await chromium.launch({ channel: "chrome" }); }
catch { browser = await chromium.launch(); }
const page = await (await browser.newContext()).newPage();
page.on("pageerror", (e) => console.log("PAGEERROR:", e.message));
await page.goto("http://localhost:5173", { waitUntil: "networkidle" });

const r = await page.evaluate(async () => {
  const AC = await import("/src/components/fm-action-calc.js");
  const { baseAverage, applyActionDamageBoost, calculateActionDamage, normalizeAction, rollAverage, deriveFinalDice } = AC;
  const patamar = "calamidade", nd = 30;
  const ba = { nd30: baseAverage(patamar,30), nd31: baseAverage(patamar,31), nd32: baseAverage(patamar,32), nd35: baseAverage(patamar,35) };
  const act = normalizeAction({ name:"Soco", attackType:"acerto",
    damage:{ ...calculateActionDamage(patamar, nd, "acerto", false, 0), type:"cortante" } });
  const baseAvgRoll = rollAverage(deriveFinalDice(act.damage), act.damage.dieSize, act.damage.mod);
  const b2 = applyActionDamageBoost(act, "corporal", { amount:2, fixed:0 }, { patamar, nd });
  const b2Avg = rollAverage(deriveFinalDice(b2.damage), b2.damage.dieSize, b2.damage.mod);
  const b2f = applyActionDamageBoost(act, "corporal", { amount:2, fixed:10 }, { patamar, nd });
  return {
    baseAverages: ba,
    base: { roll: act.damage.roll, avg: baseAvgRoll },
    boost2niveis: { roll: b2.damage.roll, avg: b2Avg, subiuDado: b2Avg > baseAvgRoll },
    boost2mais10: { roll: b2f.damage.roll },
  };
});
console.log(JSON.stringify(r, null, 2));
const checks = [
  ["baseAverage 31 = 154", r.baseAverages.nd31 === 154],
  ["baseAverage 32 = 158", r.baseAverages.nd32 === 158],
  ["baseAverage 35 = 170", r.baseAverages.nd35 === 170],
  ["boost +2 niveis sobe a media (nao so fixo)", r.boost2niveis.subiuDado === true],
];
let ok=0; for (const [n,p] of checks){ console.log(`${p?"OK":"XX"} ${n}`); if(p) ok++; }
console.log(`\n${ok}/${checks.length} PASS`);
await browser.close();
process.exit(ok===checks.length?0:1);
