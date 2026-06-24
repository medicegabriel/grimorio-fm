// PE temporário por FONTE: mesma fonte não acumula (sobe só o maior); gastar
// drena o temp primeiro → round_start seguinte refila. Lógica via dev server.
import { chromium } from "playwright";
let browser;
try { browser = await chromium.launch({ channel: "chrome" }); }
catch { browser = await chromium.launch(); }
const page = await (await browser.newContext()).newPage();
page.on("pageerror", (e) => console.log("PAGEERROR:", e.message));
await page.goto("http://localhost:5173", { waitUntil: "networkidle" });

const r = await page.evaluate(async () => {
  const AE = await import("/src/components/fm-automation-entities.js");
  const TB = await import("/src/components/fm-tables.js");
  const { applyRoundStartResources, drainPeTemp } = AE;
  const bt = TB.getBonusTreinamento(20), meio = Math.floor(bt / 2); // 3

  const snapshot = {
    core: { nd: 20, patamar: "calamidade", bonusTreinamento: bt },
    attributes: {}, aptidoes: {}, stats: { peMax: 100, hpMax: 200 },
    features: [], actions: { list: [] }, aptidoesEspeciais: [], caracteristicas: [], dotes: [],
    treinamentos: [{ id: "tr1", key: "energia", nome: "Treino de Energia", tipo: "official" }],
  };

  // Rodada 1: ganha ½BT temp.
  const r1 = applyRoundStartResources({ peCurrent: 100 }, snapshot);
  // Rodada 2: MESMA fonte → não acumula (sobe só o maior).
  const r2 = applyRoundStartResources(r1.combatState, snapshot);
  // Gasta 5 (drena o temp primeiro): peTempSources zera a fonte; peCurrent baixa.
  const aposGasto = { peCurrent: r2.combatState.peCurrent - 5, peTempSources: drainPeTemp(r2.combatState.peTempSources, 5) };
  // Rodada 3: como a fonte foi drenada, REFILA ½BT.
  const r3 = applyRoundStartResources(aposGasto, snapshot);
  // drainPeTemp direto: tira só até o disponível.
  const drainParcial = drainPeTemp({ energia: 3, outra: 2 }, 4); // tira 3+1 → {outra:1}

  return {
    meio,
    r1pe: r1.combatState.peCurrent, r1gain: r1.peGain, r1src: r1.combatState.peTempSources,
    r2pe: r2.combatState.peCurrent, r2gain: r2.peGain,
    aposGastoSrc: aposGasto.peTempSources,
    r3pe: r3.combatState.peCurrent, r3gain: r3.peGain,
    drainParcial,
  };
});

console.log(JSON.stringify(r, null, 2));
const checks = [
  ["rodada 1: PE 100→103 (+½BT), fonte rastreada", r.r1pe === 100 + r.meio && r.r1gain === r.meio && r.r1src["Treino de Energia"] === r.meio],
  ["rodada 2: NÃO acumula (mesma fonte, maior vence)", r.r2pe === 100 + r.meio && r.r2gain === 0],
  ["gastar drena o temp primeiro (fonte zera)", Object.keys(r.aposGastoSrc).length === 0],
  ["rodada 3: REFILA após gasto (+½BT)", r.r3gain === r.meio],
  ["drainPeTemp parcial: 4 de {3,2} → {outra:1}", r.drainParcial.energia === undefined && r.drainParcial.outra === 1],
];
let ok = 0; for (const [n, p] of checks) { console.log(`${p ? "OK" : "XX"} ${n}`); if (p) ok++; }
console.log(`\n${ok}/${checks.length} PASS`);
await browser.close();
process.exit(ok === checks.length ? 0 : 1);
