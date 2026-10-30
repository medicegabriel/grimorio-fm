import { fichas, sessoes, contexto, abre, passo, check, espera, adicionar, externa, encerra } from "./lib.mjs";
passo("diag390");
const { p } = await contexto({ lista: [fichas.mestre], largura: 390, altura: 844, sessoesIniciais: sessoes });
await abre(p, "player", fichas.mestre.name);
const ler = (rot) => p.evaluate((rot) => {
  const achados = [];
  for (const el of document.querySelectorAll("*")) { if (el.scrollLeft > 0) achados.push(`${el.tagName}.${String(el.className).slice(0,40)} scrollLeft=${el.scrollLeft}`); }
  const w = (s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.right), Math.round(e.scrollWidth)]; };
  return { rot, win: [scrollX, innerWidth, document.documentElement.scrollWidth], achados, cab: w(".e-cabeca"), ficha: w("#afty-ficha"), placa: w(".e-placa"), faixa: w(".e-faixa"), agora: w(".e-agora"), catalogo: w(".k-catalogo"), corpo: w(".k-corpo") };
}, rot);
console.log(JSON.stringify(await ler("inicial")));
await adicionar(p); console.log(JSON.stringify(await ler("catalogo")));
await externa(p); console.log(JSON.stringify(await ler("externa")));
await p.locator("[data-abrir-buff-mesa]").click(); await espera(p, 400); console.log(JSON.stringify(await ler("buff")));
await encerra();
