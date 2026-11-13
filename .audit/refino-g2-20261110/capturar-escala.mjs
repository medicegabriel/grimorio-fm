import fs from "node:fs";
import { monta, SAIDA } from "./base.mjs";
const pasta = `${SAIDA}${process.env.NOME ?? "depois-escala"}/`;
fs.mkdirSync(pasta, { recursive: true });
const medidas = {};
for (const tamanho of ["1440x900", "390x844"]) {
  const L = tamanho.split("x")[0];
  const { p, saida, fim } = await monta({ tamanho, ficha: "mesa", aba: "acoes", prefixo: "esc" });
  for (const id of ["acoes", "habilidades", "pericias", "equipamentos", "invocacoes", "buffs"]) {
    await p.locator(`[data-afty-aba="${id}"]`).first().click(); await p.waitForTimeout(450);
    await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(150);
    await p.screenshot({ path: `${pasta}${id}-${L}.png`, fullPage: false });
    if (L === "1440") {
      medidas[id] = await p.evaluate(() => { const m = {}; for (const el of document.querySelectorAll("#afty-ficha *")) { if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) || !el.getBoundingClientRect().width) continue; const k = `${parseFloat(getComputedStyle(el).fontSize).toFixed(1)}`; m[k] = (m[k] ?? 0) + 1; } return m; });
    }
  }
  await fim();
}
fs.writeFileSync(`${pasta}tamanhos-1440.json`, JSON.stringify(medidas, null, 1));
const total = {}; for (const m of Object.values(medidas)) for (const [k, v] of Object.entries(m)) total[k] = (total[k] ?? 0) + v;
console.log(Object.entries(total).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}px:${v}`).join("  "));
