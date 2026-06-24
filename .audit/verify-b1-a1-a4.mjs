// B1: round_start compartilhado (single+multi) via applyRoundStartResources.
// A1: DSL hp_temp = excedente real (hpCurrent - hpMax).
// A4: collectAutomationEntities alimenta o hub "Habilidades Ativáveis".
import { chromium } from "playwright";
let browser;
try { browser = await chromium.launch({ channel: "chrome" }); }
catch { browser = await chromium.launch(); }
const page = await (await browser.newContext()).newPage();
page.on("pageerror", (e) => console.log("PAGEERROR:", e.message));
await page.goto("http://localhost:5173", { waitUntil: "networkidle" });

const r = await page.evaluate(async () => {
  const AE = await import("/src/components/fm-automation-entities.js");
  const AU = await import("/src/components/fm-automation.js");
  const DSL = await import("/src/components/fm-dsl.js");
  const TB = await import("/src/components/fm-tables.js");
  const { collectAutomationEntities, applyRoundStartResources } = AE;
  const { activatedRulesOf } = AU;
  const { buildDslContext } = DSL;
  const { getBonusTreinamento } = TB;

  const nd = 20, bt = getBonusTreinamento(nd), meio = Math.floor(bt / 2);
  const snapshot = {
    core: { nd, patamar: "calamidade", bonusTreinamento: bt },
    attributes: { constituicao: 14 }, aptidoes: {}, stats: { peMax: 100, hpMax: 200 },
    features: [], actions: { list: [] },
    treinamentos: [{ id: "tr1", key: "energia", nome: "Treino de Energia", tipo: "official" }],
    aptidoesEspeciais: [],
    caracteristicas: [{ id: "ca1", key: "arena_elemental", nome: "Arena Elemental", tipo: "oficial" }],
    dotes: [],
  };

  // A4 — o coletor unificado lista as entidades; o hub filtra as com regra ativável.
  const entities = collectAutomationEntities(snapshot);
  const ativaveis = entities.filter((e) => activatedRulesOf(e).length > 0);
  const temArena = ativaveis.some((e) => e.name === "Arena Elemental");
  // Treino de Energia é round_start (NÃO ativável) → não entra no hub.
  const treinoNoHub = ativaveis.some((e) => e.name === "Treino de Energia");

  // B1 — applyRoundStartResources soma PE com overflow (a partir do máximo).
  const cs0 = { peCurrent: 100, hpCurrent: 200 };
  const round1 = applyRoundStartResources(cs0, snapshot);
  const round2 = applyRoundStartResources(round1.combatState, snapshot);

  // A1 — DSL hp_temp = excedente do PV acima do máximo.
  const ctxTemp = buildDslContext(snapshot, { hpCurrent: 230, peCurrent: 100 });
  const ctxSem = buildDslContext(snapshot, { hpCurrent: 180, peCurrent: 100 });

  return {
    meio,
    hub: { qtdAtivaveis: ativaveis.length, temArena, treinoNoHub },
    b1: { r1: round1.combatState.peCurrent, peGain1: round1.peGain, r2: round2.combatState.peCurrent },
    a1: { tempAcima: ctxTemp.hp_temp, tempAbaixo: ctxSem.hp_temp },
  };
});

console.log(JSON.stringify(r, null, 2));
const checks = [
  ["A4: hub lista Arena (ativável)", r.hub.temArena === true],
  ["A4: Treino round_start NÃO vira botão", r.hub.treinoNoHub === false],
  ["B1: rodada 1 PE 100 → 100+½BT (overflow)", r.b1.r1 === 100 + r.meio && r.b1.peGain1 === r.meio],
  ["B1: rodada 2 NÃO acumula (mesma fonte, maior vence)", r.b1.r2 === 100 + r.meio],
  ["A1: hp_temp = excedente (230-200=30)", r.a1.tempAcima === 30],
  ["A1: sem excedente quando abaixo do máx", r.a1.tempAbaixo === 0],
];
let ok = 0; for (const [n, p] of checks) { console.log(`${p ? "OK" : "XX"} ${n}`); if (p) ok++; }
console.log(`\n${ok}/${checks.length} PASS`);
await browser.close();
process.exit(ok === checks.length ? 0 : 1);
