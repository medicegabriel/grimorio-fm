// Características no motor: Arena Elemental (toggle acerto+½BT, dano+BT) e
// Transformação (toggle acerto+BT). Via buildCatalogAutomation (caminho do D0).
import { chromium } from "playwright";
let browser;
try { browser = await chromium.launch({ channel: "chrome" }); }
catch { browser = await chromium.launch(); }
const page = await (await browser.newContext()).newPage();
page.on("pageerror", (e) => console.log("PAGEERROR:", e.message));
await page.goto("http://localhost:5173", { waitUntil: "networkidle" });

const r = await page.evaluate(async () => {
  const CA = await import("/src/components/fm-caracteristicas.js");
  const AU = await import("/src/components/fm-automation.js");
  const MO = await import("/src/components/fm-modifiers.js");
  const TB = await import("/src/components/fm-tables.js");
  const { getCaracteristicaByKey } = CA;
  const { buildCatalogAutomation, ruleModifiers, collectActionDamageBoosts, activatedRulesOf } = AU;
  const { resolveLiveStats } = MO;
  const { getBonusTreinamento } = TB;

  const ctx = { core: { nd: 20 }, attributes: {}, aptidoes: {} };
  const bt = getBonusTreinamento(20); // 6

  const snapshot = {
    core: { nd: 20, patamar: "calamidade" },
    attributes: { forca: 14, destreza: 12, constituicao: 13, inteligencia: 10, sabedoria: 10, presenca: 10 },
    stats: { defesa: 17, acerto: 10, cdBase: 20, rdGeral: 0 }, saves: {}, skills: [],
    overrides: {}, attackAttr: "forca", treinamentos: [], aptidoes: {}, dotes: [], aptidoesEspeciais: [], caracteristicas: [],
  };

  // Arena Elemental
  const arenaEntry = getCaracteristicaByKey("arena_elemental");
  const arenaInst = { id: "c1", key: "arena_elemental", nome: "Arena Elemental", tipo: "official" };
  const arenaAuto = buildCatalogAutomation(arenaEntry, arenaInst, ctx);
  const arenaRule = arenaAuto?.rules?.[0];
  const arenaMods = ruleModifiers(arenaRule, { name: "Arena Elemental", kind: "toggle", group: "caracteristica" }, null);
  const arenaLive = resolveLiveStats(snapshot, { activeModifiers: arenaMods });
  const arenaBoost = collectActionDamageBoosts(arenaMods);

  // Transformação
  const transEntry = getCaracteristicaByKey("transformacao");
  const transInst = { id: "c2", key: "transformacao", nome: "Transformação", tipo: "official" };
  const transAuto = buildCatalogAutomation(transEntry, transInst, ctx);
  const transRule = transAuto?.rules?.[0];
  const transMods = ruleModifiers(transRule, { name: "Transformação", kind: "toggle", group: "caracteristica" }, null);
  const transLive = resolveLiveStats(snapshot, { activeModifiers: transMods });

  return {
    bt,
    arena: {
      activatable: activatedRulesOf({ automation: arenaAuto }).length,
      acerto: arenaLive.stats.acerto, acertoMod: !!arenaLive.modified.acerto,
      boostCorporalFixed: arenaBoost.corporal.fixed,
    },
    trans: {
      activatable: activatedRulesOf({ automation: transAuto }).length,
      acerto: transLive.stats.acerto, acertoMod: !!transLive.modified.acerto,
    },
  };
});

console.log(JSON.stringify(r, null, 2));
const meioBt = Math.floor(r.bt / 2);
const checks = [
  ["Arena ativável", r.arena.activatable === 1],
  [`Arena: Acerto 10 → ${10 + meioBt} (+½BT)`, r.arena.acerto === 10 + meioBt && r.arena.acertoMod],
  [`Arena: boost dano corporal +${r.bt} (BT)`, r.arena.boostCorporalFixed === r.bt],
  ["Transformação ativável", r.trans.activatable === 1],
  [`Transformação: Acerto 10 → ${10 + r.bt} (+BT)`, r.trans.acerto === 10 + r.bt && r.trans.acertoMod],
];
let ok = 0; for (const [n, p] of checks) { console.log(`${p ? "OK" : "XX"} ${n}`); if (p) ok++; }
console.log(`\n${ok}/${checks.length} PASS`);
await browser.close();
process.exit(ok === checks.length ? 0 : 1);
