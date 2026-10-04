import { readFileSync, writeFileSync } from "node:fs";
for (const p of [".audit/lote02-layout.mjs", ".audit/lote02-formulas.mjs"]) {
  const s = readFileSync(p, "utf8").replace('chromium.launch({ channel: "chrome" })', 'chromium.launch({ channel: "chrome", ignoreDefaultArgs: ["--hide-scrollbars"] })');
  writeFileSync(p, s);
}
const p = ".audit/lote02-layout.mjs";
let s = readFileSync(p, "utf8");
s = s.replace('http://127.0.0.1:5174/${rota}', '${process.env.LOTE02_URL ?? "http://127.0.0.1:5174"}/${rota}');
s = s.replace('await page.screenshot({ path: `${pasta}/${fase}-${rota}-${largura}-habilidades.png` });', 'await page.screenshot({ path: `${pasta}/${fase}-${rota}-${largura}-habilidades.png` });');
s = s.replace('medidas.at(-1).perfil = await perfil.evaluate', 'await perfil.screenshot({ path: `${pasta}/${fase}-${rota}-${largura}-perfil.png` });\n          medidas.at(-1).perfil = await perfil.evaluate');
writeFileSync(p, s);
console.log("Roteiros com barras de rolagem e capturas do Perfil");
