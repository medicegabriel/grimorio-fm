// Origens no motor: features de origem com motorAuto resolvem para automação
// que o tracker escaneia. Regeneração (Maldição) = cura ativada; Segunda Fase
// (Corpo Amaldiçoado) = PV temp ativado. Via Vite dev.
import { chromium } from "playwright";
let browser;
try { browser = await chromium.launch({ channel: "chrome" }); }
catch { browser = await chromium.launch(); }
const page = await (await browser.newContext()).newPage();
page.on("pageerror", (e) => console.log("PAGEERROR:", e.message));
await page.goto("http://localhost:5173", { waitUntil: "networkidle" });

const r = await page.evaluate(async () => {
  const OR = await import("/src/components/fm-origens.js");
  const AU = await import("/src/components/fm-automation.js");
  const TB = await import("/src/components/fm-tables.js");
  const { getOriginRawFeatures, buildOriginFeature, getRegeneracaoCura } = OR;
  const { activatedRulesOf, resolveResourceChanges } = AU;
  const { getBonusTreinamento, getModifier } = TB;

  // Regeneração — Maldição, Calamidade ND20, Con 16.
  const coreM = { nd: 20, patamar: "calamidade", origin: { type: "maldicao" } };
  const attrM = { constituicao: 16 };
  const rawsM = getOriginRawFeatures(coreM.origin, coreM);
  const rawRegen = rawsM.find((x) => x.key === "regeneracao");
  const featRegen = buildOriginFeature(rawRegen, { core: coreM, attributes: attrM });
  const regenRules = activatedRulesOf(featRegen);
  const regenRule = featRegen.automation?.rules?.[0];
  const regenRes = resolveResourceChanges(regenRule, null);
  const curaEsperada = getRegeneracaoCura(coreM, attrM); // ModCon(3) × mult cal/BT6(12) = 36

  // Segunda Fase — Corpo Amaldiçoado, Con 16, BT 6 → 16 × 12 = 192.
  const coreC = { nd: 20, patamar: "calamidade", origin: { type: "corpo_amaldicoado" } };
  const attrC = { constituicao: 16 };
  const rawsC = getOriginRawFeatures(coreC.origin, coreC);
  const rawSeg = rawsC.find((x) => x.key === "segunda_fase");
  const featSeg = buildOriginFeature(rawSeg, { core: coreC, attributes: attrC });
  const segRule = featSeg.automation?.rules?.[0];
  const segRes = resolveResourceChanges(segRule, null);
  const vidaEsperada = 16 * (getBonusTreinamento(20) * 2);

  // Faixa sem cura (Lacaio) → Regeneração não gera regra.
  const coreL = { nd: 5, patamar: "lacaio", origin: { type: "maldicao" } };
  const rawRegenL = getOriginRawFeatures(coreL.origin, coreL).find((x) => x.key === "regeneracao");
  const featRegenL = rawRegenL ? buildOriginFeature(rawRegenL, { core: coreL, attributes: attrM }) : null;

  return {
    regen: {
      hasAuto: !!featRegen.automation, ruleId: regenRule?.id, name: regenRule?.name,
      trigger: regenRule?.trigger?.type, pe: regenRule?.cost?.pe,
      res: regenRes?.[0], curaEsperada, activatable: regenRules.length,
    },
    seg: {
      hasAuto: !!featSeg.automation, name: segRule?.name, trigger: segRule?.trigger?.type,
      res: segRes?.[0], vidaEsperada,
    },
    lacaioSemRegra: featRegenL ? !featRegenL.automation : true,
  };
});

console.log(JSON.stringify(r, null, 2));
const checks = [
  ["Regeneração vira automação", r.regen.hasAuto === true],
  ["id estável por feature", r.regen.ruleId === "cat_origin-regeneracao_0"],
  ["regra Ativada 'Regenerar', 4 PE", r.regen.name === "Regenerar" && r.regen.trigger === "activated" && r.regen.pe === 4],
  ["1 regra ativável", r.regen.activatable === 1],
  ["cura = Mod Con × mult (= resolver)", r.regen.res?.resource === "hp" && r.regen.res?.value === r.regen.curaEsperada && r.regen.curaEsperada === 36],
  ["Segunda Fase vira automação", r.seg.hasAuto === true],
  ["Segunda Fase = PV temp Con×(BT×2)", r.seg.res?.resource === "hp_temp" && r.seg.res?.value === r.seg.vidaEsperada && r.seg.vidaEsperada === 192],
  ["Lacaio (sem cura) → sem regra", r.lacaioSemRegra === true],
];
let ok = 0; for (const [n, p] of checks) { console.log(`${p ? "OK" : "XX"} ${n}`); if (p) ok++; }
console.log(`\n${ok}/${checks.length} PASS`);
await browser.close();
process.exit(ok === checks.length ? 0 : 1);
