/* Fumaça: cada cenário abre, as três abas desenham, sem erro de página. */
import { abre, aba, passo, check, foto, encerra, estouro, etapa } from "./lib.mjs";
for (const ficha of ["arsenal", "conjurador", "mesa", "vazia", "criatura"]) {
  passo(`fumaça ${ficha}`);
  const { ctx, p } = await abre({ ficha });
  for (const id of ["acoes", "pericias", "equipamentos"]) {
    await aba(p, id);
    check(`${id} desenha`, await p.locator(`[data-m-aba="${id}"]`).isVisible());
    const e = await estouro(p);
    check(`${id} sem estouro`, e.pagina <= 0 && e.culpados.length === 0, e);
    await foto(p, `fumaca-${ficha}-${id}-1440`, { fullPage: true });
  }
  check("sem erro de página", etapa.erros.length === 0, etapa.erros.slice(0, 5));
  await ctx.close();
}
await encerra("fumaca");
