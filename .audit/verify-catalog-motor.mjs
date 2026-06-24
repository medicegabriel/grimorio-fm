// D0 — motor em itens OFICIAIS do catálogo (interno). Verifica a cadeia:
// catálogo.motorAuto → buildCatalogAutomation → activatedRulesOf → ruleModifiers
// → resolveLiveStats (buffs) + collectActionDamageBoosts (dano). Via Vite dev.
import { chromium } from "playwright";
let browser;
try { browser = await chromium.launch({ channel: "chrome" }); }
catch { browser = await chromium.launch(); }
const page = await (await browser.newContext()).newPage();
page.on("pageerror", (e) => console.log("PAGEERROR:", e.message));
await page.goto("http://localhost:5173", { waitUntil: "networkidle" });

const r = await page.evaluate(async () => {
  const AU = await import("/src/components/fm-automation.js");
  const MO = await import("/src/components/fm-modifiers.js");
  const DO = await import("/src/components/fm-dotes.js");
  const { buildCatalogAutomation, activatedRulesOf, ruleModifiers, collectActionDamageBoosts, hasAutomation } = AU;
  const { resolveLiveStats } = MO;
  const { getDoteByKey } = DO;

  const entry = getDoteByKey("imitacao");
  const instance = { id: "inst42", key: "imitacao", nome: "Imitação", tipo: "official" };
  const auto = buildCatalogAutomation(entry, instance, { core: { nd: 10 } });

  // custom continua usando a automação do usuário; oficial ignora instance.automation
  const customInstance = { id: "c1", tipo: "custom", automation: { enabled: true, rules: [{ id: "r", trigger: { type: "activated" }, effects: [] }] } };

  const ent = { automation: auto };
  const rules = activatedRulesOf(ent);
  const rule = auto.rules[0];
  const mods = ruleModifiers(rule, { name: "Imitação", kind: "toggle", group: "dote" }, null);

  const snapshot = {
    core: { nd: 10, patamar: "comum" },
    attributes: { forca: 14, destreza: 12, constituicao: 13, inteligencia: 10, sabedoria: 10, presenca: 10 },
    stats: { defesa: 17, acerto: 10, cdBase: 20, rdGeral: 0 },
    saves: {}, skills: [], overrides: {}, attackAttr: "forca",
    treinamentos: [], aptidoes: {}, dotes: [], aptidoesEspeciais: [], caracteristicas: [],
  };
  const live = resolveLiveStats(snapshot, { activeModifiers: mods });
  const boosts = collectActionDamageBoosts(mods);

  return {
    hasMotorAuto: !!entry.motorAuto,
    builtRules: auto?.rules?.length ?? 0,
    ruleIdStable: rule.id,
    activated: rules.length,
    acerto: { base: 10, live: live.stats.acerto, mod: !!live.modified.acerto },
    defesa: { base: 17, live: live.stats.defesa, mod: !!live.modified.defesa },
    boostCorporalFixed: boosts.corporal.fixed,
    customStillWorks: hasAutomation(customInstance),
    sameRuleId: mods.every((m) => m.source.ruleId === rule.id),
  };
});

console.log(JSON.stringify(r, null, 2));
const checks = [
  ["Imitação tem motorAuto", r.hasMotorAuto === true],
  ["1 regra construída", r.builtRules === 1],
  ["id estável por instância", r.ruleIdStable === "cat_inst42_0"],
  ["1 regra ativável", r.activated === 1],
  ["Acerto 10 → 12 (+2)", r.acerto.live === 12 && r.acerto.mod],
  ["Defesa 17 → 20 (+3)", r.defesa.live === 20 && r.defesa.mod],
  ["boost corporal +5 fixo", r.boostCorporalFixed === 5],
  ["custom ainda funciona", r.customStillWorks === true],
  ["mods na mesma regra (toggle)", r.sameRuleId === true],
];
let ok = 0; for (const [n, p] of checks) { console.log(`${p ? "OK" : "XX"} ${n}`); if (p) ok++; }
console.log(`\n${ok}/${checks.length} PASS`);
await browser.close();
process.exit(ok === checks.length ? 0 : 1);
