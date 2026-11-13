/* Bug candidato: na aba Seletores os nomes dos seletores (<code className="afty-valor">) herdam o `code {}` global de src/index.css
   (fundo --code-bg bege, padding 4x8, 15px) e a cor clara do tema escuro: texto claro sobre bege. Mede o contraste computado. */
import { abre, passo, check, foto, encerra, espera, etapa } from "./lib.mjs";
const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
const rgb = (s) => (s.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
for (const [rotulo, query] of [["G2 escuro", "tema=escuro"], ["G2 Abissal", "preset=abissal"], ["G2 Pergaminho", "preset=pergaminho"], ["Clássica escuro", "tema=escuro&modo=classica"]]) {
  passo(`Seletores, ${rotulo}`);
  const { ctx, p } = await abre({ ficha: "mesa", query });
  await p.locator('button[aria-label="Mais opções da ficha"], [aria-label*="Aparência"], button:has-text("Aparência")').first().click().catch(() => {});
  if (!(await p.locator(".afty-busca").count())) {
    if (query.includes("classica")) { await p.getByRole("button", { name: /Aparência/ }).first().click(); }
    else await p.getByRole("menuitem", { name: "Aparência" }).click();
  }
  await p.locator(".afty-busca").waitFor();
  await p.locator(".afty-busca").getByRole("tab", { name: "Seletores" }).click(); await espera(p, 300);
  const m = await p.evaluate(() => { const c = document.querySelector(".afty-busca code"); const cs = getComputedStyle(c); return { cor: cs.color, fundo: cs.backgroundColor, fonte: cs.fontSize, pad: cs.padding, texto: c.textContent }; });
  const L1 = lum(rgb(m.cor)), L2 = lum(rgb(m.fundo)); const razao = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
  etapa.medidas = { ...m, contraste: Math.round(razao * 100) / 100 };
  check(`o nome do seletor tem contraste AA (>= 4,5): ${razao.toFixed(2)}`, razao >= 4.5, m);
  await foto(p, `seletores-code-${rotulo.replace(/\s+/g, "-").toLowerCase()}`, { clip: { x: 0, y: 0, width: 1440, height: 900 } });
  await ctx.close();
}
await encerra("seletores-code");
