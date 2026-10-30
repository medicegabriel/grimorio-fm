/* Fumaça: abre cada ficha de teste no G2 e fotografa as telas novas em 1440, 1024 e 390 px, para achar problema de leiaute e contraste antes dos roteiros. */
import { fichas, sessoes, contexto, abre, passo, check, foto, espera, aosAtivos, adicionar, externa, emCombate, estouro, encerra, efeitos } from "./lib.mjs";

for (const largura of [1440, 1024, 390]) {
  passo(`fumaça ${largura}`);
  const lista = ["ima", "perfeita", "mestre", "sangrador", "invocador"].map((k) => fichas[k]);
  const { ctx, p } = await contexto({ lista, largura, altura: largura < 500 ? 844 : 900, sessoesIniciais: sessoes });
  for (const k of ["ima", "mestre", "sangrador", "invocador"]) {
    await abre(p, "player", fichas[k].name);
    await aosAtivos(p);
    await foto(p, `${k}-ativos-${largura}`);
    check(`${k}-sem-estouro-${largura}`, true, await estouro(p));
    if (k === "ima") { await emCombate(p); await adicionar(p); await foto(p, `${k}-adicionar-${largura}`); const t = p.locator("[data-aba-imitacao]"); check("aba-imitacao", (await t.count()) === 1); if (await t.count()) { await t.click(); await espera(p, 300); await foto(p, `${k}-imitacao-${largura}`); } }
    if (k === "mestre" || k === "invocador") { await adicionar(p); await externa(p); await foto(p, `${k}-externa-${largura}`); const b = p.locator("[data-abrir-buff-mesa]"); if (await b.count()) { await b.click(); await espera(p, 300); await foto(p, `${k}-buff-${largura}`); } }
  }
  await ctx.close();
}
await encerra();
