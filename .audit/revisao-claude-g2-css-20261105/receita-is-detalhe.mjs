import { abre, aba, passo, encerra } from "./lib.mjs";
passo("detalhe da receita :is");
const { ctx, p } = await abre({ ficha: "mesa", query: "css=receita-is" });
await aba(p, "acoes");
const r = await p.evaluate(() => {
  const desc = (e) => `${e.tagName.toLowerCase()}${[...e.classList].slice(0, 5).map((c) => "." + c).join("")}`;
  const b = [...document.querySelectorAll(".afty-botao")].filter((e) => e.offsetParent && getComputedStyle(e).borderTopColor !== "rgb(225, 29, 72)").map((e) => ({ el: desc(e), sob: !!e.closest(".e-g2"), borda: getComputedStyle(e).borderTopWidth + " " + getComputedStyle(e).borderTopStyle }));
  const v = [...document.querySelectorAll(".afty-valor")].filter((e) => e.offsetParent && getComputedStyle(e).color !== "rgb(34, 211, 238)").map((e) => ({ el: desc(e), cor: getComputedStyle(e).color })).slice(0, 5);
  return { botoesErrados: b, valoresErrados: v, totalValor: document.querySelectorAll(".afty-valor").length };
});
console.log(JSON.stringify(r, null, 1));
await ctx.close(); await encerra("receita-is-detalhe");
