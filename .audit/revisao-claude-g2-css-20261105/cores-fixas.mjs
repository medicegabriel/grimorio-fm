/* PONTO 3 do consultor: o que na página PINTADA do G2 não responde aos tokens. Duas cargas da mesma ficha (padrão e probe, um tema
   de cores garrafais em todos os tokens), mesmo roteiro de cliques, comparação elemento a elemento (índice no DOM). Elemento cujo
   `color`, fundo, borda, família de fonte ou raio NÃO muda é cor/forma fixa. Cobre as seis abas, a compacta e o menu do cabeçalho. */
import { abre, aba, abas, passo, check, foto, encerra, espera, etapa } from "./lib.mjs";
import fs from "node:fs";

const coleta = (p) => p.evaluate(() => {
  const visivel = (e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none" && cs.opacity !== "0"; };
  const sig = (e) => `${e.tagName.toLowerCase()}${[...e.classList].filter((c) => /^(afty|e|m|f)-/.test(c)).map((c) => "." + c).join("")}`;
  const temTexto = (e) => [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
  const transp = (c) => /rgba\(\s*\d+,\s*\d+,\s*\d+,\s*0\)|transparent/.test(c);
  const raiz = document.querySelector("#afty-ficha");
  const out = [];
  for (const e of [raiz, ...raiz.querySelectorAll("*")]) {
    if (!visivel(e) || e.closest("svg") && e.tagName.toLowerCase() !== "svg") continue;
    const cs = getComputedStyle(e);
    out.push({
      s: sig(e), t: temTexto(e) ? 1 : 0,
      c: cs.color, bg: transp(cs.backgroundColor) ? "" : cs.backgroundColor, bi: cs.backgroundImage === "none" ? "" : cs.backgroundImage.slice(0, 120),
      bd: parseFloat(cs.borderTopWidth) > 0 && cs.borderTopStyle !== "none" ? cs.borderTopColor : "", ff: cs.fontFamily.slice(0, 40), r: cs.borderTopLeftRadius,
    });
  }
  return out;
});

async function carrega(query, ficha) {
  const { ctx, p } = await abre({ ficha, query, largura: 1440, altura: 1000 });
  const estados = {};
  for (const a of await abas(p)) { await aba(p, a); estados[`aba:${a}`] = await coleta(p); }
  await aba(p, "acoes");
  await p.locator(".f-acesso").first().click(); await espera(p, 500);
  estados["compacta"] = await coleta(p);
  await p.locator(".f-acesso").first().click(); await espera(p, 300);
  await p.locator('button[aria-label="Mais opções da ficha"]').click(); await espera(p, 300);
  estados["menu-cabecalho"] = await coleta(p);
  await p.keyboard.press("Escape"); await espera(p, 200);
  await p.locator('.afty-rolavel').first().hover(); await espera(p, 400);
  estados["hover-fontes"] = await coleta(p);
  await ctx.close();
  return estados;
}

const ficha = process.env.FICHA ?? "mesa";
passo(`cores fixas na ficha ${ficha}`);
const A = await carrega("tema=escuro", ficha), B = await carrega("css=probe", ficha);
const achados = new Map();
let total = 0, alinhados = 0;
for (const estado of Object.keys(A)) {
  const a = A[estado], b = B[estado] ?? [];
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    if (a[i].s !== b[i].s) continue;
    total++; alinhados++;
    const x = a[i], y = b[i];
    const regs = [];
    if (x.t && x.c === y.c) regs.push("texto");
    if (x.bg && x.bg === y.bg) regs.push("fundo");
    if (x.bi && x.bi === y.bi) regs.push("gradiente");
    if (x.bd && x.bd === y.bd) regs.push("borda");
    if (x.t && x.ff === y.ff && !/Georgia/.test(x.ff)) regs.push("fonte");
    if (parseFloat(x.r) > 0 && x.r === y.r) regs.push("raio");
    for (const r of regs) {
      const k = `${r}|${x.s}`;
      const o = achados.get(k) ?? { tipo: r, seletor: x.s, n: 0, estados: new Set(), valor: r === "texto" ? x.c : r === "fundo" ? x.bg : r === "gradiente" ? x.bi : r === "borda" ? x.bd : r === "fonte" ? x.ff : x.r };
      o.n++; o.estados.add(estado); achados.set(k, o);
    }
  }
  console.log(`  ${estado}: ${a.length} elementos, ${b.length} no probe`);
}
const lista = [...achados.values()].map((o) => ({ ...o, estados: [...o.estados] })).sort((m, n) => n.n - m.n);
const porTipo = {};
for (const o of lista) porTipo[o.tipo] = (porTipo[o.tipo] ?? 0) + 1;
etapa.medidas = { elementosComparados: alinhados, tiposDistintosFixos: porTipo };
fs.writeFileSync(new URL(`./cores-fixas-${ficha}.json`, import.meta.url), JSON.stringify({ porTipo, lista }, null, 2));
console.log(JSON.stringify({ comparados: alinhados, porTipo }, null, 2));
for (const tipo of ["texto", "fundo", "gradiente", "borda", "fonte", "raio"]) {
  console.log(`\n--- ${tipo} (${lista.filter((o) => o.tipo === tipo).length} seletores)`);
  for (const o of lista.filter((x) => x.tipo === tipo).slice(0, 22)) console.log(`  ${String(o.n).padStart(3)}x ${o.seletor.slice(0, 70)}  ${String(o.valor).slice(0, 60)}  [${o.estados.slice(0, 3).join(",")}]`);
}
await encerra(`cores-fixas-resumo-${ficha}`);
