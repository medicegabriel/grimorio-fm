/* O tema Alter Lucielos (feito para a clássica) estoura 28 px na horizontal no G2 em 390. Quem estoura? Compara com a clássica. */
import { abre, aba, abas, passo, encerra, etapa } from "./lib.mjs";
for (const [rotulo, extra] of [["G2", ""], ["clássica", "&modo=classica"]]) {
  passo(`alter 390 ${rotulo}`);
  const { ctx, p } = await abre({ ficha: "mesa", query: `tema=alter${extra}`, largura: 390, altura: 844, toque: true });
  for (const a of await abas(p)) {
    await aba(p, a);
    const r = await p.evaluate(() => { const w = innerWidth; const c = [...document.querySelectorAll("#afty-ficha *")].filter((e) => { const b = e.getBoundingClientRect(); return b.width > 0 && b.right > w + 1 && getComputedStyle(e).position !== "fixed"; }).slice(0, 4).map((e) => `${e.tagName.toLowerCase()}.${String(e.className).slice(0, 50)} ${Math.round(e.getBoundingClientRect().right)}`); return { pag: document.documentElement.scrollWidth - document.documentElement.clientWidth, c }; });
    if (r.pag > 0) console.log(`${rotulo} aba ${a}: +${r.pag}px`, JSON.stringify(r.c));
  }
  await ctx.close();
}
await encerra("alter-estouro");
