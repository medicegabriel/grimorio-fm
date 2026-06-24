// D5 — Imunidade a condição (motor). Fúria Berserker vira toggle ativado que
// concede imunidade SÓ enquanto ativa; o grant PERMANENTE do builder some.
import { chromium } from "playwright";
let browser;
try { browser = await chromium.launch({ channel: "chrome" }); }
catch { browser = await chromium.launch(); }
const page = await (await browser.newContext()).newPage();
page.on("pageerror", (e) => console.log("PAGEERROR:", e.message));
await page.goto("http://localhost:5173", { waitUntil: "networkidle" });

const r = await page.evaluate(async () => {
  const AU = await import("/src/components/fm-automation.js");
  const DO = await import("/src/components/fm-dotes.js");
  const { buildCatalogAutomation, ruleModifiers, collectImmuneConditions, activatedRulesOf, ruleHasSustainedEffect } = AU;
  const { getDoteByKey, getDoteCondicoesImunes } = DO;

  const entry = getDoteByKey("furia_berserker");
  const inst = { id: "d1", key: "furia_berserker", nome: "Fúria Berserker", tipo: "official" };
  const auto = buildCatalogAutomation(entry, inst, {});
  const rule = auto?.rules?.[0];

  // Ativada (toggle) e sustentada → botão "Ativar/Desativar".
  const sustained = ruleHasSustainedEffect(rule);
  const activatable = activatedRulesOf({ automation: auto }).length;

  // Ativar → modificador __immune com as condições.
  const mods = ruleModifiers(rule, { name: "Fúria Berserker", kind: "toggle", group: "dote" }, null);
  const immuneMod = mods.find((m) => m.stat === "__immune");
  const imunes = collectImmuneConditions(mods);

  // Sem ativar (sem modificadores) → nenhuma imunidade.
  const imunesInativo = collectImmuneConditions([]);

  // O grant PERMANENTE do builder não existe mais p/ Fúria.
  const grantPermanente = getDoteCondicoesImunes([{ key: "furia_berserker", nome: "Fúria Berserker" }]);

  return {
    hasMotorAuto: !!entry.motorAuto,
    builderGrant: entry.automation ?? null,
    trigger: rule?.trigger?.type, activation: rule?.activation, sustained, activatable,
    immuneStat: immuneMod?.stat, payloadConds: immuneMod?.payload?.conditions ?? [],
    imunes: imunes.sort(),
    imunesInativo,
    grantPermanente,
  };
});

console.log(JSON.stringify(r, null, 2));
const esperadas = ["agarrado", "atordoado", "enredado", "imovel", "inconsciente", "paralisado"];
const eq = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
const checks = [
  ["Fúria tem motorAuto", r.hasMotorAuto === true],
  ["builder grant REMOVIDO (sem condicao_imune_grant)", r.builderGrant === null],
  ["regra Ativada / toggle", r.trigger === "activated" && r.activation === "toggle"],
  ["sustentada (Ativar/Desativar)", r.sustained === true && r.activatable === 1],
  ["ativar gera modificador __immune", r.immuneStat === "__immune"],
  ["payload com as 6 condições", eq([...r.payloadConds].sort(), esperadas)],
  ["coletor lista as imunidades ativas", eq(r.imunes, esperadas)],
  ["sem ativar → nenhuma imunidade", r.imunesInativo.length === 0],
  ["getDoteCondicoesImunes NÃO concede mais (permanente off)", r.grantPermanente.length === 0],
];
let ok = 0; for (const [n, p] of checks) { console.log(`${p ? "OK" : "XX"} ${n}`); if (p) ok++; }
console.log(`\n${ok}/${checks.length} PASS`);
await browser.close();
process.exit(ok === checks.length ? 0 : 1);
