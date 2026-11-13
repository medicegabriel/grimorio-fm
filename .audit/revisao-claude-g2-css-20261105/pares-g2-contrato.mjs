/* Quais classes do G2 (e-, m-, f-) aparecem NO MESMO elemento que uma classe do contrato afty-*? Essas são as regras do G2 que o usuário
   disputa quando mira a classe do contrato. Coleta no DOM vivo (4 fichas, todas as abas, compacta e menu). */
import { abre, aba, abas, passo, encerra, espera } from "./lib.mjs";
import fs from "node:fs";
const src = fs.readFileSync(new URL("../../src/systems/afty/ficha/ficha-tema.js", import.meta.url), "utf8");
const bloco = src.slice(src.indexOf("export const CONTRATO_DE_CLASSES"), src.indexOf("];", src.indexOf("export const CONTRATO_DE_CLASSES")));
const contrato = [...bloco.matchAll(/seletor: "\.([a-z0-9-]+)"/g)].map((m) => m[1]);
const pares = {};
passo("pares g2 x contrato");
for (const ficha of ["mesa", "criatura", "arsenal", "conjurador"]) {
  const { ctx, p } = await abre({ ficha, query: "tema=escuro" });
  const coleta = async () => {
    const r = await p.evaluate((contrato) => { const o = {}; for (const e of document.querySelectorAll("#afty-ficha *")) { const cs = [...e.classList]; const ct = cs.filter((c) => contrato.includes(c)); if (!ct.length) continue; for (const c of cs) if (/^(e|m|f)-/.test(c)) (o[c] ??= new Set()).add(ct.join("+")); } return Object.fromEntries(Object.entries(o).map(([k, v]) => [k, [...v]])); }, contrato);
    for (const [k, v] of Object.entries(r)) pares[k] = [...new Set([...(pares[k] ?? []), ...v])];
  };
  for (const a of await abas(p)) { await aba(p, a); await coleta(); }
  await aba(p, "acoes"); await p.locator(".f-acesso").first().click(); await espera(p, 400); await coleta(); await p.locator(".f-acesso").first().click();
  await p.locator('button[aria-label="Mais opções da ficha"]').click(); await espera(p, 250); await coleta();
  await ctx.close();
}
fs.writeFileSync(new URL("./pares-g2-contrato.json", import.meta.url), JSON.stringify(pares, null, 2));
console.log(Object.keys(pares).length, "classes do G2 dividem o elemento com uma classe do contrato");
console.log(Object.entries(pares).slice(0, 25).map(([k, v]) => `${k} <- ${v.join(", ")}`).join("\n"));
await encerra("pares-g2-contrato-resumo");
