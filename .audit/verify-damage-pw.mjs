// #2/#3 — boost de dano de ações (Amplificação). Lógica pura via Vite.
import { chromium } from "playwright";
let browser;
try { browser = await chromium.launch({ channel: "chrome" }); }
catch { browser = await chromium.launch(); }
const page = await (await browser.newContext()).newPage();
page.on("pageerror", (e) => console.log("PAGEERROR:", e.message));
await page.goto("http://localhost:5173", { waitUntil: "networkidle" });

const r = await page.evaluate(async () => {
  const AC = await import("/src/components/fm-action-calc.js");
  const AU = await import("/src/components/fm-automation.js");
  const { actionDamageScope, applyActionDamageBoost, calculateActionDamage, normalizeAction } = AC;
  const { newRule, newActionDamageEffect, ruleModifiers, collectActionDamageBoosts } = AU;

  const patamar = "comum", nd = 10;
  const mkAction = (over) => normalizeAction({
    name: "X", attackType: "acerto",
    damage: { ...calculateActionDamage(patamar, nd, over?.attackType ?? "acerto", false, 0), type: "cortante" },
    ...over,
  });

  // --- scope ---
  const scopes = {
    acertoLimpo: actionDamageScope(mkAction({})),
    tr: actionDamageScope(mkAction({ attackType: "tr_individual", trType: "fortitude" })),
    comCondicao: actionDamageScope(mkAction({ condition: { tier: "fraca", payment: "pe", name: "Abalado" } })),
    alma: actionDamageScope(mkAction({ damage: { ...calculateActionDamage(patamar, nd, "acerto", false, 0), type: "alma" } })),
    tm: actionDamageScope(mkAction({ tecnicaMaxima: true })),
    suporte: actionDamageScope(mkAction({ attackType: "suporte" })),
  };

  // --- aplicação corporal (+2 níveis = +2 ND, +5 fixo) ---
  const corp = mkAction({});
  const corpBoost = applyActionDamageBoost(corp, "corporal", { amount: 2, fixed: 5 }, { patamar, nd });
  const corpRes = {
    antesAvg: corp.damage.average, depoisAvg: corpBoost.damage.average,
    antesRoll: corp.damage.roll, depoisRoll: corpBoost.damage.roll,
    subiu: corpBoost.damage.average > corp.damage.average,
  };

  // --- aplicação técnica (+2 dados, +5 fixo) ---
  const tec = mkAction({ attackType: "tr_individual", trType: "fortitude" });
  const finalDiceAntes = AC.deriveFinalDice(tec.damage);
  const tecBoost = applyActionDamageBoost(tec, "tecnica", { amount: 2, fixed: 5 }, { patamar, nd });
  const tecRes = {
    dadosAntes: finalDiceAntes, dadosDepois: tecBoost.damage.numDice,
    modAntes: tec.damage.mod, modDepois: tecBoost.damage.mod,
    rollDepois: tecBoost.damage.roll,
    ok: tecBoost.damage.numDice === finalDiceAntes + 2 && tecBoost.damage.mod === tec.damage.mod + 5,
  };

  // --- ruleModifiers emite __dmg + payload ---
  const rule = newRule({ trigger: { type: "activated" }, effects: [newActionDamageEffect({ scope: "corporal", amount: 2, fixed: 5 })] });
  const mods = ruleModifiers(rule, { name: "Expansão", entityId: "e1", group: "acao" });
  const dmgMod = mods.find((m) => m.stat === "__dmg");

  // --- coletor agrega por escopo ---
  const agg = collectActionDamageBoosts([
    { stat: "__dmg", payload: { scope: "corporal", amount: 2, fixed: 5 } },
    { stat: "__dmg", payload: { scope: "corporal", amount: 1, fixed: 0 } },
    { stat: "__dmg", payload: { scope: "tecnica", amount: 3, fixed: 2 } },
    { stat: "defesa", value: 5 },
  ]);

  return { scopes, corpRes, tecRes, dmgMod, agg };
});

const ok = [];
const check = (name, cond) => { ok.push(cond); console.log(cond ? "PASS" : "FAIL", "—", name); };

check("scope acerto limpo = corporal", r.scopes.acertoLimpo === "corporal");
check("scope TR = tecnica", r.scopes.tr === "tecnica");
check("scope com condição = tecnica", r.scopes.comCondicao === "tecnica");
check("scope alma = tecnica", r.scopes.alma === "tecnica");
check("scope técnica máxima = tecnica", r.scopes.tm === "tecnica");
check("scope suporte = null", r.scopes.suporte === null);
console.log("  corporal:", r.corpRes.antesRoll, "→", r.corpRes.depoisRoll, `(méd ${r.corpRes.antesAvg}→${r.corpRes.depoisAvg})`);
check("corporal +2ND+5 aumenta dano", r.corpRes.subiu);
console.log("  técnica:", `${r.tecRes.dadosAntes}d → ${r.tecRes.dadosDepois}d`, `mod ${r.tecRes.modAntes}→${r.tecRes.modDepois}`, `(${r.tecRes.rollDepois})`);
check("técnica +2 dados +5 fixo", r.tecRes.ok);
check("ruleModifiers emite __dmg c/ payload", !!r.dmgMod && r.dmgMod.payload?.scope === "corporal" && r.dmgMod.payload.amount === 2 && r.dmgMod.payload.fixed === 5);
check("coletor soma corporal {3,5}", r.agg.corporal.amount === 3 && r.agg.corporal.fixed === 5);
check("coletor soma técnica {3,2}", r.agg.tecnica.amount === 3 && r.agg.tecnica.fixed === 2);

await browser.close();
const allOk = ok.every(Boolean);
console.log(allOk ? "\nTODOS PASS" : "\nALGUM FALHOU");
process.exit(allOk ? 0 : 1);
