import { fichas, sessoes, contexto, abre, passo, encerra } from "./lib.mjs";
passo("classica");
for (const g2 of [false, true]) for (const l of [390, 600, 768]) {
  const { ctx, p } = await contexto({ lista: [fichas.mestre], largura: l, altura: 844, sessoesIniciais: sessoes });
  await abre(p, "player", fichas.mestre.name, g2);
  console.log(g2 ? "G2" : "classica", l, JSON.stringify(await p.evaluate(() => { const h = document.querySelector("header.afty-cabecalho"); const cs = getComputedStyle(h); return { h: Math.round(h.getBoundingClientRect().height), pos: cs.position, vh: innerHeight }; })));
  await ctx.close();
}
await encerra();
