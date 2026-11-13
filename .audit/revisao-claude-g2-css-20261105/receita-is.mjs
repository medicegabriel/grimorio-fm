/* A receita universal `:is(.e-g2, :scope)` cobre também o que fica fora de .e-g2 (botões do painel, barra de rolagens)? E o `.afty-abas.e-g2`? */
import { abre, aba, passo, check, foto, encerra, espera, etapa } from "./lib.mjs";
passo("receita :is(.e-g2, :scope)");
const { ctx, p } = await abre({ ficha: "mesa", query: "css=receita-is" });
await aba(p, "acoes");
const m = async (sel, prop) => p.evaluate(({ sel, prop }) => [...document.querySelectorAll(sel)].filter((e) => e.offsetParent).map((e) => getComputedStyle(e)[prop]), { sel, prop });
const todos = (arr, v) => arr.length > 0 && arr.every((x) => x === v);
check("seções (.afty-card.e-grupo)", todos(await m("[data-m-secao]", "borderTopColor"), "rgb(225, 29, 72)"), await m("[data-m-secao]", "borderTopColor"));
check("números (.afty-valor)", (await m(".m-rolar-num", "color")).every((c) => c === "rgb(34, 211, 238)"), (await m(".m-rolar-num", "color")).slice(0, 2));
check("aba ativa", todos(await m('[data-afty-aba][aria-selected="true"]', "color"), "rgb(34, 211, 238)"), await m('[data-afty-aba][aria-selected="true"]', "color"));
check("nome da ficha", todos(await m(".afty-nome", "color"), "rgb(34, 211, 238)"), await m(".afty-nome", "color"));
const botoes = await p.evaluate(() => [...document.querySelectorAll(".afty-botao")].filter((e) => e.offsetParent).map((e) => ({ sob: !!e.closest(".e-g2"), cor: getComputedStyle(e).borderTopColor })));
check(`.afty-botao: os ${botoes.length} botões visíveis, sob .e-g2 ou fora dele`, botoes.length > 0 && botoes.every((b) => b.cor === "rgb(225, 29, 72)"), { sob: botoes.filter((b) => b.sob).length, fora: botoes.filter((b) => !b.sob).length, erradas: botoes.filter((b) => b.cor !== "rgb(225, 29, 72)").length });
check(".afty-abas.e-g2 (mesmo elemento)", todos(await m(".afty-abas", "borderBottomColor"), "rgb(225, 29, 72)"), await m(".afty-abas", "borderBottomColor"));
await ctx.close();
await encerra("receita-is");
