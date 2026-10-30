import { fichas, sessoes, contexto, abre, passo, encerra } from "./lib.mjs";
passo("sticky");
const { p } = await contexto({ lista: [fichas.minamoto], largura: 390, altura: 844, sessoesIniciais: sessoes });
await abre(p, "player", fichas.minamoto.name);
console.log(JSON.stringify(await p.evaluate(() => {
  const r = [];
  for (let e = document.querySelector(".e-cabeca"); e && e !== document.documentElement; e = e.parentElement) { const cs = getComputedStyle(e); r.push(`${e.tagName}.${String(e.className).slice(0, 40)} pos=${cs.position} top=${cs.top} ov=${cs.overflowY} h=${Math.round(e.getBoundingClientRect().height)}`); }
  return r;
})));
await p.mouse.wheel(0, 700); await p.waitForTimeout(500);
console.log(JSON.stringify(await p.evaluate(() => ({ cabeca: document.querySelector(".e-cabeca").getBoundingClientRect().top, ferr: document.querySelector(".e-ferramentas")?.getBoundingClientRect().top, y: scrollY }))));
await encerra();
