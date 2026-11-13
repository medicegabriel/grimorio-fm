/* Fumaça do G2 nas seis fichas sintéticas (cinco do Player, uma do Afty): abre cada aba, a compacta e o menu, e a clássica como controle.
   Conta erro de página e estouro horizontal em 1440 e 390. */
import { abre, aba, abas, passo, check, encerra, espera, etapa, dados } from "./lib.mjs";
for (const ficha of Object.keys(dados.fichas)) for (const [modo, rotulo] of [["", "G2 com as três abas"], ["modo=g2-sem-previa", "G2 sem a prévia"], ["modo=classica", "clássica"]]) for (const largura of [1440, 390]) {
  passo(`${ficha} (${dados.fichas[ficha].rulesVersion}) ${rotulo} ${largura}`);
  const { ctx, p } = await abre({ ficha, query: `tema=escuro${modo ? "&" + modo : ""}`, largura, altura: largura === 390 ? 844 : 900, toque: largura === 390 });
  const lista = await abas(p);
  for (const a of lista) await aba(p, a);
  if (rotulo !== "clássica") { await aba(p, "acoes"); const f = p.locator(".f-acesso").first(); if (await f.count()) { await f.click(); await espera(p, 300); await f.click(); } }
  const est = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check("abas percorridas sem erro de página", etapa.erros.length === 0, etapa.erros);
  check("sem estouro horizontal", est <= 0, est);
  etapa.medidas = { abas: lista.length, estouro: est };
  await ctx.close();
}
await encerra("fumaca-g2");
