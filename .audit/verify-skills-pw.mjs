// #4 via Vite (browser resolve imports sem extensão).
import { chromium } from "playwright";
let browser;
try { browser = await chromium.launch({ channel: "chrome" }); }
catch { browser = await chromium.launch(); }
const page = await (await browser.newContext()).newPage();
page.on("pageerror", (e) => console.log("PAGEERROR:", e.message));
await page.goto("http://localhost:5173", { waitUntil: "networkidle" });

const result = await page.evaluate(async () => {
  const { deriveStats } = await import("/src/components/fm-derive.js");
  const { resolveLiveStats, newModifier } = await import("/src/components/fm-modifiers.js");
  const raw = {
    core: { nd: 10, patamar: "comum", difficulty: "intermediario" },
    attributes: { forca: 16, destreza: 12, constituicao: 14, inteligencia: 10, sabedoria: 12, presenca: 8 },
    overrides: {},
    skills: [
      { id: "s1", name: "Atletismo", attribute: "forca", mastered: false },
      { id: "s2", name: "Reflexos", attribute: "destreza", mastered: false },
    ],
    attackAttr: "forca",
    treinamentos: [], aptidoes: {}, dotes: [], aptidoesEspeciais: [], caracteristicas: [],
  };
  const d = deriveStats(raw);
  const skills = raw.skills.map((s) => ({ ...s, mod: d.skillDerivations[s.id].finalMod }));
  const snapshot = { ...raw, skills, stats: d.stats, saves: d.saves };
  const before = Object.fromEntries(snapshot.skills.map((s) => [s.name, s.mod]));
  const live = resolveLiveStats(snapshot, {
    activeModifiers: [newModifier({ name: "Buff", stat: "forca", op: "add", value: 4 })],
  });
  const after = Object.fromEntries(live.skills.map((s) => [s.name, s.mod]));
  return { before, after, modified: live.modified };
});

const { before, after, modified } = result;
const atletismoSubiu = after.Atletismo > before.Atletismo;
const reflexosIgual = after.Reflexos === before.Reflexos;
console.log("Atletismo (forca):", before.Atletismo, "→", after.Atletismo, "| subiu:", atletismoSubiu);
console.log("Reflexos (destreza):", before.Reflexos, "→", after.Reflexos, "| inalterado:", reflexosIgual);
console.log("modified.skill_s1:", !!modified.skill_s1, "| modified.skill_s2 ausente:", !modified.skill_s2);
const ok = atletismoSubiu && reflexosIgual && !!modified.skill_s1 && !modified.skill_s2;
console.log(ok ? "PASS #4" : "FAIL #4");
await browser.close();
process.exit(ok ? 0 : 1);
