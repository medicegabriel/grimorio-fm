/* Quem passa da borda do catálogo, tela a tela, numa largura. */
import { fichas, sessoes, contexto, abre, passo, adicionar, externa, estouro, espera, emCombate, foto, encerra } from "./lib.mjs";
passo("vaza");
const L = Number(process.env.L ?? 390);
const qual = process.env.FICHA ?? "mestre";
const { p } = await contexto({ lista: [fichas[qual]], largura: L, altura: 844, sessoesIniciais: sessoes });
await abre(p, "player", fichas[qual].name);
const vaza = (rot) => p.evaluate((rot) => {
  const cat = document.querySelector(".k-catalogo"); const lim = cat ? cat.getBoundingClientRect().right + 1 : innerWidth;
  const fora = [...document.querySelectorAll(".k-catalogo *")].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.right > lim && !e.closest(".k-trilho") && !e.closest("[hidden]"); }).slice(0, 6).map((e) => `${e.tagName}.${String(e.className).slice(0, 30)} dir=${Math.round(e.getBoundingClientRect().right)}`);
  return { rot, pagina: document.documentElement.scrollWidth - innerWidth, cat: cat ? Math.round(cat.getBoundingClientRect().width) : null, fora };
}, rot);
await emCombate(p);
await adicionar(p); console.log(JSON.stringify(await vaza("da-ficha")));
if (await p.locator("[data-aba-imitacao]").count()) { await p.locator("[data-aba-imitacao]").click(); await espera(p, 300); console.log(JSON.stringify(await vaza("imitacao"))); }
await p.locator("[data-aba-externa]").click(); await espera(p, 300); console.log(JSON.stringify(await vaza("externa")));
for (const [sel, nome] of [["[data-abrir-buff-mesa]", "buff"], ["[data-abrir-concedido]", "concedido"]]) { if (await p.locator(sel).count()) { await p.locator(sel).click(); await espera(p, 300); console.log(JSON.stringify(await vaza(nome))); await foto(p, `vaza-${qual}-${nome}-${L}`); } }
await p.locator("[data-aba-aliados]").click(); await espera(p, 300); console.log(JSON.stringify(await vaza("aliados")));
await encerra();
