/* A receita do prefixo `.e-g2`: funciona hoje, sem !important e sem mexer no produto? Mede o computado em cada superfície, com o CSS
   escrito dentro do @scope do app. Também registra onde NÃO há ancestral `.e-g2` (o prefixo não alcança). */
import { abre, aba, passo, check, foto, encerra, etapa } from "./lib.mjs";
passo("receita .e-g2 (build atual)");
const { ctx, p } = await abre({ ficha: "mesa", query: "css=receita-g2" });
const m = async (sel, prop) => p.evaluate(({ sel, prop }) => [...new Set([...document.querySelectorAll(sel)].filter((e) => e.offsetParent).map((e) => getComputedStyle(e)[prop]))], { sel, prop });
await aba(p, "acoes");
const casos = [["[data-m-secao]", "borderTopColor", "rgb(225, 29, 72)", "seção de Ações (.afty-card)"], [".m-rolar-num", "color", "rgb(34, 211, 238)", "número da Mesa (.afty-valor)"], ['[data-afty-aba="acoes"]', "color", "rgb(34, 211, 238)", "aba ativa"], [".afty-nome", "color", "rgb(34, 211, 238)", "nome da ficha"], [".e-cabeca", "borderTopColor", "rgb(225, 29, 72)", "cabeçalho (placa)"]];
for (const [sel, prop, esp, rotulo] of casos) { const v = await m(sel, prop); check(`${rotulo}: a receita .e-g2 vence sem !important`, v.includes(esp), v); }
await aba(p, "pericias");
const v = await m(".afty-card", "borderTopColor"); check("Perícias: .afty-card", v.includes("rgb(225, 29, 72)"), v);
const semAncestral = await p.evaluate(() => [...document.querySelectorAll("#afty-ficha .afty-card, #afty-ficha .afty-aba, #afty-ficha .afty-valor")].filter((e) => !e.closest(".e-g2")).length);
etapa.medidas.semAncestralEg2 = semAncestral;
check("todo elemento alvo tem um ancestral .e-g2 (o prefixo alcança)", semAncestral === 0, semAncestral);
await foto(p, "receita-g2-pericias");
await ctx.close();
await encerra("receita-g2");
