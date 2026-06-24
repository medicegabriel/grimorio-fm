// D2 — Treino de Energia/Potencial Físico: gatilho round_start → +½ BT de PE
// (temporário, pode exceder o máximo). Verifica DSL (metade(bt)), coletor,
// aplicação com overflow e a matemática da barra de excedente.
import { chromium } from "playwright";
let browser;
try { browser = await chromium.launch({ channel: "chrome" }); }
catch { browser = await chromium.launch(); }
const page = await (await browser.newContext()).newPage();
page.on("pageerror", (e) => console.log("PAGEERROR:", e.message));
await page.goto("http://localhost:5173", { waitUntil: "networkidle" });

const r = await page.evaluate(async () => {
  const TR = await import("/src/components/fm-treinamentos.js");
  const AU = await import("/src/components/fm-automation.js");
  const DSL = await import("/src/components/fm-dsl.js");
  const TB = await import("/src/components/fm-tables.js");
  const { getTreinamentoByKey } = TR;
  const { buildCatalogAutomation, collectRoundStartResources, activatedRulesOf } = AU;
  const { buildDslContext } = DSL;
  const { getBonusTreinamento } = TB;

  const nd = 20;
  const btEsperado = getBonusTreinamento(nd);
  const metadeEsperada = Math.floor(btEsperado / 2);

  const entry = getTreinamentoByKey("energia");
  const inst = { id: "tr1", key: "energia", nome: "Treino de Energia", tipo: "official" };
  const auto = buildCatalogAutomation(entry, inst, { core: { nd } });
  const rule = auto?.rules?.[0];

  const snapshot = {
    core: { nd, patamar: "calamidade", bonusTreinamento: btEsperado },
    attributes: { forca: 14, destreza: 12, constituicao: 14, inteligencia: 10, sabedoria: 10, presenca: 10 },
    stats: { peMax: 100 }, saves: {}, skills: [], aptidoes: {},
  };
  const peMax = 100;
  const dslContext = buildDslContext(snapshot, { peCurrent: peMax, hpCurrent: 100 });
  const entities = [{ id: inst.id, name: inst.nome, automation: auto }];
  const changes = collectRoundStartResources(entities, dslContext);

  // round_start NÃO é botão (não-ativável)
  const activatable = activatedRulesOf({ automation: auto }).length;

  // Simula 2 Novas Rodadas começando cheio (100/100) → overflow.
  let pe = peMax;
  const apply = () => { for (const ch of changes) if (ch.resource === "pe" && ch.op === "add") pe = Math.max(0, Math.round(pe + (Number(ch.value) || 0))); };
  apply(); const after1 = pe; apply(); const after2 = pe;

  // Matemática da barra (espelha VitalBar): 105/100 → cheia + 5% excedente.
  const current = 105, max = 100;
  const pct = Math.max(0, Math.min(100, (current / max) * 100));
  const overflow = Math.max(0, current - max);
  const overflowPct = overflow > 0 && max > 0 ? Math.min(100, (overflow / max) * 100) : 0;

  return {
    trigger: rule?.trigger?.type, valueExpr: rule?.effects?.[0]?.valueExpr,
    btEsperado, metadeEsperada,
    changeValue: changes[0]?.value, changeResource: changes[0]?.resource, source: changes[0]?.source,
    activatable,
    after1, after2, peMax,
    barPct: pct, barOverflow: overflow, barOverflowPct: overflowPct,
  };
});

console.log(JSON.stringify(r, null, 2));
const checks = [
  ["gatilho round_start", r.trigger === "round_start"],
  ["valueExpr = metade(bt)", r.valueExpr === "metade(bt)"],
  ["DSL resolve metade(bt) = ½ BT", r.changeValue === r.metadeEsperada && r.changeValue > 0],
  ["recurso = pe", r.changeResource === "pe"],
  ["fonte rotulada (Treino de Energia)", r.source === "Treino de Energia"],
  ["NÃO é ativável (automático, sem botão)", r.activatable === 0],
  ["rodada 1: PE excede o máximo", r.after1 === r.peMax + r.metadeEsperada && r.after1 > r.peMax],
  ["rodada 2: continua acumulando", r.after2 === r.peMax + r.metadeEsperada * 2],
  ["barra: 105/100 → 100% base + 5% excedente", r.barPct === 100 && r.barOverflow === 5 && r.barOverflowPct === 5],
];
let ok = 0; for (const [n, p] of checks) { console.log(`${p ? "OK" : "XX"} ${n}`); if (p) ok++; }
console.log(`\n${ok}/${checks.length} PASS`);
await browser.close();
process.exit(ok === checks.length ? 0 : 1);
