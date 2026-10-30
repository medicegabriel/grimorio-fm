/* PRÉVIA DAS TRÊS ABAS: leiaute medido no navegador. Largura útil real da aba, painel da compacta aberto e fechado, os casos S1 e S2 do
   orçamento de altura (Dano na primeira tela), nomes e fórmulas cortados, estouro horizontal, altura dos alvos que rolam, duas colunas. */
import { chromium } from "playwright";
import { abre, aba, passo, check, foto, encerra, estouro, espera, etapa } from "./lib.mjs";

const mede = (p, id) => p.evaluate((id) => {
  const caixa = document.querySelector(`[data-aba-g2="${id}"]:not([hidden]) [data-m-aba]`);
  if (!caixa) return null;
  const raiz = document.getElementById("afty-ficha");
  const topo = parseFloat(getComputedStyle(raiz).getPropertyValue("--afty-ficha-topo")) || 0;
  const linhaDano = caixa.querySelector('[data-m-secao="dano"] .m-linha');
  const r = linhaDano?.getBoundingClientRect();
  const sel = ".m-nome, .m-teste-nome, .e-nome-item, .m-celula-nome > span, .m-rolar-num, .m-item-detalhe-nome, .m-cartao-nome, .m-celula-estado";
  const cortados = [...caixa.querySelectorAll(sel)].filter((el) => el.offsetParent && (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 2) && getComputedStyle(el).overflow !== "visible").map((el) => el.textContent.slice(0, 40));
  const elipses = [...caixa.querySelectorAll(sel)].filter((el) => el.offsetParent && getComputedStyle(el).textOverflow === "ellipsis" && el.scrollWidth > el.clientWidth + 1).map((el) => el.textContent.slice(0, 40));
  const alvos = [...caixa.querySelectorAll(".m-rolar")].filter((el) => el.offsetParent).map((el) => Math.round(el.getBoundingClientRect().height));
  const colunas = caixa.querySelector(".m-colunas") ? getComputedStyle(caixa.querySelector(".m-colunas")).gridTemplateColumns.split(" ").length : null;
  /* Quantas colunas TÊM conteúdo (desde o aceite, Outros mora em Perícias: uma ficha só de armas tem só a primeira). */
  const comConteudo = caixa.querySelectorAll(".m-colunas > .m-coluna").length;
  const grade = caixa.querySelector(".m-grade-pericias") ? getComputedStyle(caixa.querySelector(".m-grade-pericias")).gridTemplateColumns.split(" ").length : null;
  const celulas = [...caixa.querySelectorAll(".m-celula")].map((el) => Math.round(el.getBoundingClientRect().height));
  const mesa = caixa.querySelector(".m-mesa")?.getBoundingClientRect();
  const fontes = [...caixa.querySelectorAll(".m-nome, .m-teste-nome, .m-celula-estado, .m-meta, .m-rolar-num")].filter((el) => el.offsetParent).map((el) => parseFloat(getComputedStyle(el).fontSize));
  return {
    util: Math.round(caixa.clientWidth), alturaJanela: innerHeight, cabecalho: Math.round(topo),
    danoTopo: r ? Math.round(r.top) : null, danoFundo: r ? Math.round(r.bottom) : null,
    mesaAltura: mesa ? Math.round(mesa.height) : null, celulas,
    cortados: [...new Set(cortados)], elipses: [...new Set(elipses)], alvoMin: alvos.length ? Math.min(...alvos) : null,
    colunas, comConteudo, grade, fonteMin: fontes.length ? Math.min(...fontes) : null,
  };
}, id);

const abrePainel = async (p) => { const b = p.locator('button.f-acesso[aria-controls="g-painel"]'); if (await b.count() && (await b.getAttribute("aria-pressed")) !== "true") { await b.click(); await espera(p, 400); } };

/* S1 e S2: o Dano na primeira tela. */
const casos = [
  { nome: "S1-1280x800-compacta", ficha: "tipica", largura: 1280, altura: 800, painel: true, exigeDano: true },
  { nome: "S1-768x1024-compacta", ficha: "tipica", largura: 768, altura: 1024, painel: true, exigeDano: true },
  { nome: "S1-390x844-telefone", ficha: "tipica", largura: 390, altura: 844, toque: true, exigeDano: false },
  { nome: "S2-1280x800-compacta", ficha: "mesa", largura: 1280, altura: 800, painel: true, exigeDano: false },
  { nome: "S2-1440x900", ficha: "mesa", largura: 1440, altura: 900, exigeDano: false },
  { nome: "S2-2560x1440-compacta", ficha: "mesa", largura: 2560, altura: 1440, painel: true, exigeDano: true },
];
for (const c of casos) {
  passo(`altura ${c.nome}`);
  const { ctx, p } = await abre({ ficha: c.ficha, largura: c.largura, altura: c.altura, toque: !!c.toque });
  if (c.painel) await abrePainel(p);
  await aba(p, "acoes");
  await p.evaluate(() => window.scrollTo(0, 0));
  await espera(p, 200);
  const m = await mede(p, "acoes");
  etapa.medidas = m;
  console.log(`  ${c.nome}`, JSON.stringify({ util: m.util, cab: m.cabecalho, danoTopo: m.danoTopo, danoFundo: m.danoFundo, janela: m.alturaJanela, mesa: m.mesaAltura, celulas: m.celulas }));
  if (c.exigeDano) check("primeira linha de Dano dentro da primeira tela", m.danoFundo != null && m.danoFundo <= m.alturaJanela, m);
  check("nenhum nome ou fórmula cortado", m.cortados.length === 0 && m.elipses.length === 0, { cortados: m.cortados, elipses: m.elipses });
  check("alvos que rolam com 34 px ou mais (40 no toque)", m.alvoMin == null || m.alvoMin >= (c.toque ? 40 : 34), m.alvoMin);
  const e = await estouro(p);
  check("sem estouro horizontal", e.pagina <= 0 && e.culpados.length === 0, e);
  await foto(p, `altura-${c.nome}`);
  check("sem erro de página", etapa.erros.length === 0, etapa.erros.slice(0, 3));
  await ctx.close();
}

/* As larguras da tabela do plano, nas três abas, com a ficha densa de armas e a de Feitiços. */
const larguras = [
  { l: 390, a: 844, toque: true }, { l: 768, a: 1024, painel: true }, { l: 1024, a: 768 }, { l: 1024, a: 768, painel: true },
  { l: 1280, a: 800 }, { l: 1280, a: 800, painel: true }, { l: 1440, a: 900 }, { l: 1920, a: 1080 }, { l: 2560, a: 1440 }, { l: 2560, a: 1440, painel: true },
];
for (const ficha of process.env.SO_ALTURA ? [] : ["arsenal", "conjurador"]) {
  for (const w of larguras) {
    const nome = `${ficha}-${w.l}${w.painel ? "-compacta" : ""}`;
    passo(`largura ${nome}`);
    const { ctx, p } = await abre({ ficha, largura: w.l, altura: w.a, toque: !!w.toque });
    if (w.painel) await abrePainel(p);
    const resumo = {};
    for (const id of ["acoes", "pericias", "equipamentos"]) {
      await aba(p, id);
      const m = await mede(p, id);
      resumo[id] = { util: m.util, colunas: m.colunas, grade: m.grade, alvoMin: m.alvoMin, fonteMin: m.fonteMin };
      check(`${id}: nada cortado`, m.cortados.length === 0 && m.elipses.length === 0, { cortados: m.cortados, elipses: m.elipses });
      check(`${id}: alvo mínimo`, m.alvoMin == null || m.alvoMin >= (w.toque ? 40 : 34), m.alvoMin);
      check(`${id}: fonte mínima 12,5 px`, m.fonteMin == null || m.fonteMin >= 12.5, m.fonteMin);
      if (id === "acoes") check(`acoes: duas colunas só a partir de 1180 px úteis e com conteúdo nas duas`, m.colunas == null || (m.util >= 1180 && m.comConteudo === 2) === (m.colunas === 2), { util: m.util, colunas: m.colunas, comConteudo: m.comConteudo });
      const e = await estouro(p);
      check(`${id}: sem estouro`, e.pagina <= 0 && e.culpados.length === 0, e);
      if ([390, 768, 1280, 2560].includes(w.l)) await foto(p, `largura-${nome}-${id}`);
    }
    etapa.medidas = resumo;
    console.log(`  ${nome}`, JSON.stringify(resumo));
    check("sem erro de página", etapa.erros.length === 0, etapa.erros.slice(0, 3));
    await ctx.close();
  }
}

/* 331 px úteis com a barra de rolagem REAL. O Playwright esconde a barra por padrão, e as medidas acima saem 15 px mais largas que no
   navegador do autor (768 com a compacta mede 346 sem a barra). Aqui o Chrome sobe sem `--hide-scrollbars`: a mesma janela dá os 331 px
   do plano, e a medida PRECISA dar 331 ou menos, senão o caso não foi testado. */
const comBarra = await chromium.launch({ channel: "chrome", ignoreDefaultArgs: ["--hide-scrollbars"] });
for (const ficha of ["tipica", "mesa", "arsenal", "conjurador"]) {
  const nome = `${ficha}-768-compacta-com-barra`;
  passo(`331 ${nome}`);
  const { ctx, p } = await abre({ ficha, largura: 768, altura: 1024, nav: comBarra });
  await abrePainel(p);
  const resumo = {};
  for (const id of ["acoes", "pericias", "equipamentos"]) {
    await aba(p, id);
    await p.evaluate(() => window.scrollTo(0, 0));
    await espera(p, 200);
    const m = await mede(p, id);
    resumo[id] = { util: m.util, danoFundo: m.danoFundo, alturaJanela: m.alturaJanela, alvoMin: m.alvoMin, fonteMin: m.fonteMin };
    check(`${id}: largura útil de 331 px ou menos (barra real)`, m.util <= 331, m.util);
    check(`${id}: nada cortado`, m.cortados.length === 0 && m.elipses.length === 0, { cortados: m.cortados, elipses: m.elipses });
    check(`${id}: alvo mínimo`, m.alvoMin == null || m.alvoMin >= 34, m.alvoMin);
    check(`${id}: fonte mínima 12,5 px`, m.fonteMin == null || m.fonteMin >= 12.5, m.fonteMin);
    if (id === "acoes" && ficha === "tipica") check("S1: primeira linha de Dano dentro da primeira tela", m.danoFundo != null && m.danoFundo <= m.alturaJanela, m);
    const e = await estouro(p);
    check(`${id}: sem estouro`, e.pagina <= 0 && e.culpados.length === 0, e);
    await foto(p, `largura-331-${ficha}-${id}`);
  }
  etapa.medidas = resumo;
  console.log(`  ${nome}`, JSON.stringify(resumo));
  check("sem erro de página", etapa.erros.length === 0, etapa.erros.slice(0, 3));
  await ctx.close();
}
/* S1 em 1280x800 com a compacta e a barra real: sem a barra o Dano termina rente à dobra (800 de 800), então a medida que vale para o
   autor é esta, 15 px mais estreita. */
{
  passo("altura S1-1280x800-compacta-com-barra");
  const { ctx, p } = await abre({ ficha: "tipica", largura: 1280, altura: 800, nav: comBarra });
  await abrePainel(p);
  await aba(p, "acoes");
  await p.evaluate(() => window.scrollTo(0, 0));
  await espera(p, 200);
  const m = await mede(p, "acoes");
  etapa.medidas = m;
  console.log("  S1-1280x800-compacta-com-barra", JSON.stringify({ util: m.util, danoTopo: m.danoTopo, danoFundo: m.danoFundo, janela: m.alturaJanela, mesa: m.mesaAltura }));
  check("primeira linha de Dano dentro da primeira tela", m.danoFundo != null && m.danoFundo <= m.alturaJanela, m);
  check("nenhum nome ou fórmula cortado", m.cortados.length === 0 && m.elipses.length === 0, { cortados: m.cortados, elipses: m.elipses });
  await foto(p, "altura-S1-1280x800-compacta-com-barra");
  await ctx.close();
}
await comBarra.close();
await encerra("layout");
