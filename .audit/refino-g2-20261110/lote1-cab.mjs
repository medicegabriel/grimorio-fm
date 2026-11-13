import { monta } from "./base.mjs";
const ok = (saida, nome, cond, extra = "") => { saida[`${cond ? "OK   " : "FALHA"} ${nome}`] = extra; };
{
  const { p, foto, saida, fim } = await monta({ tamanho: "1440x900", ficha: "mesa", aba: "acoes", prefixo: "L1c" });
  const m = await p.evaluate(() => {
    const l = document.querySelector(".e-linha-abas").getBoundingClientRect();
    const a = document.querySelector(".e-abas").getBoundingClientRect();
    const g = document.querySelector(".e-linha-abas > .afty-log").getBoundingClientRect();
    const h = document.querySelector("header.afty-cabecalho").getBoundingClientRect();
    return { linhaAlt: Math.round(l.height), abasAlt: Math.round(a.height), logAlt: Math.round(g.height), mesmaLinha: Math.abs(a.top - g.top) < 20, cabecalhoAlt: Math.round(h.height), estouro: document.documentElement.scrollWidth - innerWidth };
  });
  saida.medidas = JSON.stringify(m);
  ok(saida, "rolagem na linha das abas (desktop)", m.mesmaLinha && m.logAlt <= 52, `log ${m.logAlt}px, linha ${m.linhaAlt}px`);
  ok(saida, "sem estouro horizontal", m.estouro <= 0);
  await foto("01-desktop-acoes");
  // rolar uma rolagem e abrir o histórico
  await p.getByText("Ataque Básico").first().waitFor().catch(() => {});
  await p.locator('[data-afty-aba="habilidades"]').click(); await p.waitForTimeout(300);
  await foto("02-desktop-habilidades");
  await fim();
}
{
  const { p, foto, saida, fim } = await monta({ tamanho: "390x844", ficha: "mesa", aba: "acoes", prefixo: "L1c" });
  const r0 = await p.evaluate(() => ({ rec: getComputedStyle(document.querySelector("header.afty-cabecalho")).getPropertyValue("--afty-cabecalho-recolhido"), alt: Math.round(document.querySelector("header.afty-cabecalho").getBoundingClientRect().height), fina: document.querySelector(".e-fina")?.dataset.visivel ?? "nao" }));
  saida.topo = JSON.stringify(r0);
  await foto("03-celular-topo");
  await p.evaluate(() => window.scrollTo(0, 600)); await p.waitForTimeout(500);
  const r1 = await p.evaluate(() => { const h = document.querySelector("header.afty-cabecalho").getBoundingClientRect(); const f = document.querySelector(".e-fina"); const fr = f.getBoundingClientRect(); return { headerTop: Math.round(h.top), headerBottom: Math.round(h.bottom), finaVisivel: f.dataset.visivel ?? "nao", finaTop: Math.round(fr.top), finaAlt: Math.round(fr.height), texto: f.innerText.replace(/\n+/g, " ") }; });
  saida.rolado = JSON.stringify(r1);
  ok(saida, "faixa fina aparece ao rolar", r1.finaVisivel === "sim" && r1.finaAlt > 20, r1.texto);
  ok(saida, "cabeçalho recolhido cobre pouco", r1.headerBottom < 200, `bottom ${r1.headerBottom}`);
  await foto("04-celular-rolado");
  // oscilação: pequenas rolagens ao redor do limite
  const trocas = await p.evaluate(async () => {
    const f = document.querySelector(".e-fina"); let n = 0; let ult = f.dataset.visivel;
    for (const y of [300, 330, 360, 330, 300, 360, 340, 320, 360]) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); const v = f.dataset.visivel; if (v !== ult) { n++; ult = v; } }
    return n;
  });
  saida.trocasNoLimite = trocas;
  await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(400);
  ok(saida, "faixa some no topo", (await p.locator(".e-fina").getAttribute("data-visivel")) === null);
  // índice salta com o recolhido
  await p.locator(".m-indice-item", { hasText: "Dano" }).first().click().catch(() => {}); await p.waitForTimeout(900);
  await foto("05-celular-salto-dano");
  await fim();
}
