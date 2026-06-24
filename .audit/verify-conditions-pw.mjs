// #1 — efeitos mecânicos das condições. Lógica pura via Vite.
import { chromium } from "playwright";
let browser;
try { browser = await chromium.launch({ channel: "chrome" }); }
catch { browser = await chromium.launch(); }
const page = await (await browser.newContext()).newPage();
page.on("pageerror", (e) => console.log("PAGEERROR:", e.message));
await page.goto("http://localhost:5173", { waitUntil: "networkidle" });

const r = await page.evaluate(async () => {
  const { deriveStats } = await import("/src/components/fm-derive.js");
  const { resolveLiveStats } = await import("/src/components/fm-modifiers.js");
  const { collectConditionModifiers, summarizeConditionMods, conditionNotes } = await import("/src/components/fm-conditions.js");

  const raw = {
    core: { nd: 10, patamar: "comum", difficulty: "intermediario" },
    attributes: { forca: 16, destreza: 14, constituicao: 14, inteligencia: 10, sabedoria: 12, presenca: 8 },
    overrides: {},
    skills: [
      { id: "s1", name: "Atletismo", attribute: "forca", mastered: false },
      { id: "s2", name: "Percepção", attribute: "sabedoria", mastered: false },
    ],
    attackAttr: "forca",
    treinamentos: [], aptidoes: {}, dotes: [], aptidoesEspeciais: [], caracteristicas: [],
  };
  const d = deriveStats(raw);
  const skills = raw.skills.map((s) => ({ ...s, mod: d.skillDerivations[s.id].finalMod }));
  const snap = { ...raw, skills, stats: d.stats, saves: d.saves };

  const live = (names) => resolveLiveStats(snap, { activeModifiers: collectConditionModifiers(names) });
  const skMod = (res, name) => res.skills.find((s) => s.name === name)?.mod;

  const base = { acerto: snap.stats.acerto, defesa: snap.stats.defesa, desloc: snap.stats.deslocamento,
    reflexos: snap.saves.reflexos, atletismo: skMod({ skills }, "Atletismo"), percep: skMod({ skills }, "Percepção") };

  const abal = live(["abalado"]);
  const env = live(["envenenado"]);
  const lento = live(["lento"]);
  const cego = live(["cego"]);
  const amedAbal = live(["amedrontado", "abalado"]); // amedrontado suprime abalado

  return {
    base,
    abalado: { acerto: abal.stats.acerto, atletismo: skMod(abal, "Atletismo") },
    envenenado: { acerto: env.stats.acerto, reflexos: env.saves.reflexos, atletismo: skMod(env, "Atletismo") },
    lento: { desloc: lento.stats.deslocamento },
    cego: { defesa: cego.stats.defesa, reflexos: cego.saves.reflexos, desloc: cego.stats.deslocamento, percep: skMod(cego, "Percepção") },
    amedAbal: { acerto: amedAbal.stats.acerto },
    sumAbalado: summarizeConditionMods("abalado"),
    notesAterrorizado: conditionNotes("aterrorizado"),
  };
});

const ok = [];
const ck = (n, c) => { ok.push(c); console.log(c ? "PASS" : "FAIL", "—", n); };
console.log("base:", JSON.stringify(r.base));
ck("abalado: acerto −1", r.abalado.acerto === r.base.acerto - 1);
ck("abalado: perícias −1 (Atletismo)", r.abalado.atletismo === r.base.atletismo - 1);
ck("envenenado: acerto −2", r.envenenado.acerto === r.base.acerto - 2);
ck("envenenado: TR Reflexos −2", r.envenenado.reflexos === r.base.reflexos - 2);
ck("envenenado: perícias −2", r.envenenado.atletismo === r.base.atletismo - 2);
ck("lento: deslocamento ×0.5", r.lento.desloc === r.base.desloc * 0.5);
ck("cego: defesa −3", r.cego.defesa === r.base.defesa - 3);
ck("cego: reflexos −3", r.cego.reflexos === r.base.reflexos - 3);
ck("cego: deslocamento ×0.5", r.cego.desloc === r.base.desloc * 0.5);
ck("cego: Percepção −5", r.cego.percep === r.base.percep - 5);
ck("amedrontado suprime abalado (acerto −3, não −4)", r.amedAbal.acerto === r.base.acerto - 3);
ck("resumo abalado tem texto", /Acerto/.test(r.sumAbalado));
ck("aterrorizado tem nota comportamental", r.notesAterrorizado.length > 0);

await browser.close();
const all = ok.every(Boolean);
console.log(all ? "\nTODOS PASS" : "\nALGUM FALHOU");
process.exit(all ? 0 : 1);
