// Programar a Expansão de Domínio — ponte efeitos estruturados → motor.
// Verifica a cadeia pura: domainAutomation → ruleModifiers → resolveLiveStats
// (buffs de stat) + collectActionDamageBoosts (boost de dano). Via Vite dev.
import { chromium } from "playwright";
let browser;
try { browser = await chromium.launch({ channel: "chrome" }); }
catch { browser = await chromium.launch(); }
const page = await (await browser.newContext()).newPage();
page.on("pageerror", (e) => console.log("PAGEERROR:", e.message));
await page.goto("http://localhost:5173", { waitUntil: "networkidle" });

const r = await page.evaluate(async () => {
  const DC = await import("/src/components/fm-domain-calc.js");
  const AU = await import("/src/components/fm-automation.js");
  const MO = await import("/src/components/fm-modifiers.js");
  const { domainAutomation, newEffect } = DC;
  const { ruleModifiers, collectActionDamageBoosts, activatedRulesOf, hasAutomation } = AU;
  const { resolveLiveStats } = MO;

  const mk = (category, type, extra = {}) => ({ ...newEffect(category), type, ...extra });
  const domain = {
    id: "act99", name: "Santuário", kind: "expansao_dominio", cost: 20,
    effects: [
      mk("amp_corporal", "defesa"),                                 // DOM3 → +7 def
      mk("amp_corporal", "dano"),                                   // corporal +6 níveis / +10
      mk("amp_tecnica",  "dano"),                                   // técnica +3 dados / +10
      mk("amp_corporal", "atributo", { attrs: ["forca", "constituicao"] }), // +6 cada
      mk("amp_tecnica",  "cd"),                                     // CD +6
    ],
  };
  const auto = domainAutomation(domain, { dom: 3, nd: 10 });

  // activatedRulesOf enxerga a regra sintetizada (como no tracker)
  const ent = { automation: auto };
  const actRules = activatedRulesOf(ent);

  // Ativação: ruleModifiers → modificadores
  const rule = auto.rules[0];
  const mods = ruleModifiers(rule, { name: rule.name, kind: "toggle", group: "acao" }, null);

  // Snapshot mínimo p/ resolveLiveStats (base: defesa 17, cdBase 20, forca 14)
  const snapshot = {
    core: { nd: 10, patamar: "comum" },
    attributes: { forca: 14, destreza: 12, constituicao: 13, inteligencia: 10, sabedoria: 10, presenca: 10 },
    stats: { defesa: 17, cdBase: 20, acerto: 10, rdGeral: 0 },
    saves: {}, skills: [], overrides: {}, attackAttr: "forca",
    treinamentos: [], aptidoes: {}, dotes: [], aptidoesEspeciais: [], caracteristicas: [],
  };
  const live = resolveLiveStats(snapshot, { activeModifiers: mods });
  const boosts = collectActionDamageBoosts(mods);

  return {
    hasAuto: hasAutomation(ent),
    activatedCount: actRules.length,
    ruleName: rule.name, pe: rule.cost.pe, dur: rule.effects[0].duration.rounds,
    defesa: { base: snapshot.stats.defesa, live: live.stats.defesa, modified: !!live.modified.defesa },
    cd: { base: snapshot.stats.cdBase, live: live.stats.cdBase },
    forca: { base: snapshot.attributes.forca, live: live.attributes.forca, modified: !!live.modified.forca },
    boosts,
    sameRuleId: mods.every((m) => m.source.ruleId === rule.id),
  };
});

console.log(JSON.stringify(r, null, 2));

const checks = [
  ["tem automação sintetizada", r.hasAuto === true],
  ["1 regra ativável", r.activatedCount === 1],
  ["PE = 20", r.pe === 20],
  ["duração 6 rodadas (3+DOM3)", r.dur === 6],
  ["Defesa 17 → 24 (+7)", r.defesa.live === 24 && r.defesa.modified],
  ["CD 20 → 26 (+6)", r.cd.live === 26],
  ["Força 14 → 20 (+6)", r.forca.live === 20 && r.forca.modified],
  ["boost corporal +6 níveis / +10 fixo", r.boosts.corporal.amount === 6 && r.boosts.corporal.fixed === 10],
  ["boost técnica +3 dados / +10 fixo", r.boosts.tecnica.amount === 3 && r.boosts.tecnica.fixed === 10],
  ["todos mods ligados à mesma regra", r.sameRuleId === true],
];
let ok = 0;
for (const [name, pass] of checks) { console.log(`${pass ? "✓" : "✗"} ${name}`); if (pass) ok++; }
console.log(`\n${ok}/${checks.length} PASS`);
await browser.close();
process.exit(ok === checks.length ? 0 : 1);
