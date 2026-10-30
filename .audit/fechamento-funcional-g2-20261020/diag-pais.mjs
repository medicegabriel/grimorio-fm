import { fichas, sessoes, contexto, abre, passo, adicionar, encerra } from "./lib.mjs";
passo("pais");
const { p } = await contexto({ lista: [fichas.mestre], largura: Number(process.env.L ?? 390), altura: 844, sessoesIniciais: sessoes });
await abre(p, "player", fichas.mestre.name);
await adicionar(p);
console.log((await p.evaluate(() => { const r = []; for (let e = document.querySelector(".k-catalogo"); e && e.id !== "afty-ficha"; e = e.parentElement) { const cs = getComputedStyle(e); const b = e.getBoundingClientRect(); r.push(`${e.tagName}.${String(e.className).slice(0, 34)} [${Math.round(b.left)},${Math.round(b.right)}] mr=${cs.marginRight} pr=${cs.paddingRight} disp=${cs.display}`); } return r; })).join("\n"));
await encerra();
