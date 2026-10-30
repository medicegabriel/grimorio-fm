/* AJUSTES DO ACEITE (21/10): só o que mudou.
   1. Outros saiu de Ações e mora em Perícias, nas seis fichas, sem sumir com o filtro ou a busca local. A referência INDEPENDENTE é o G2
      sem a prop (`modo=g2-sem-previa`), cuja aba Ações é a `AbaAcoes` de sempre, com o próprio `LinhaManobra` montando o pedido: os nomes
      e as rolagens (sorteio fixo, mesmos modos do d20) têm de sair iguais.
   2. A busca global leva `manobra:<id>` a Perícias com as três abas visitadas, sem âncora duplicada, sem rolar e sem mudar a sessão.
   3. As linhas de Dano dividem as colunas: Acerto e Dano na mesma posição em todas as linhas, todas no mesmo arranjo (alvos na fileira
      do nome ou todos abaixo), e a mesma altura base, nas larguras do plano. Também com Crítico e com motivo de recusa à vista. */
import { chromium } from "playwright";
import { abre, aba, passo, check, foto, encerra, espera, etapa, sessaoGravada, dados, estouro, BASE, navegador } from "./lib.mjs";

const semCarimbo = (s) => JSON.stringify({ ...s, atualizadoEm: 0 });
const semVolateis = (e) => { if (!e) return null; const { id: _id, ts: _ts, ...resto } = e; return JSON.stringify(resto); };
const FICHAS = ["arsenal", "conjurador", "mesa", "tipica", "vazia", "criatura"];

/* ---------- 1. Outros: fora de Ações, dentro de Perícias, igual à referência ---------- */
for (const ficha of FICHAS) {
  passo(`Outros em Perícias: ${ficha}`);
  const ref = await navegador.newContext({ viewport: { width: 1440, height: 900 } });
  const pr = await ref.newPage();
  await pr.goto(`${BASE}/?ficha=${ficha}&tema=escuro&modo=g2-sem-previa`, { waitUntil: "domcontentloaded" });
  await pr.locator("#afty-ficha").waitFor();
  await espera(pr, 500);
  const esperados = await pr.locator('[id^="afty-item-manobra:"]').evaluateAll((els) => els.map((el) => el.querySelector("span").textContent.trim()));
  await ref.close();

  const { ctx, p } = await abre({ ficha });
  const acoes = p.locator('[data-aba-g2="acoes"]');
  check("Ações sem a seção Outros", (await acoes.locator('[data-m-secao="outros"], [data-m-linha^="manobra:"]').count()) === 0);
  check("o índice de Ações não oferece Outros", (await acoes.locator(".m-indice-item").filter({ hasText: /^Outros/ }).count()) === 0);
  await aba(p, "pericias");
  const nomes = await p.locator('[data-aba-g2="pericias"] [data-m-secao="outros"] .m-cartao-nome').allTextContents();
  etapa.medidas = { esperados, nomes };
  check(`Perícias tem os mesmos ${esperados.length} cartões da referência, na mesma ordem`, esperados.length > 0 && JSON.stringify(nomes) === JSON.stringify(esperados), { esperados, nomes });
  /* O filtro de treino e a busca local são só da lista de perícias. */
  const lista = p.locator('[data-m-secao="pericias"]');
  if (await lista.count()) {
    await lista.getByRole("radio", { name: /^Mestre/ }).click();
    await lista.locator('input[type="search"]').fill("zzzz");
    await espera(p, 200);
    const visiveis = await p.locator('[data-m-secao="outros"] .m-cartao').evaluateAll((els) => els.filter((el) => el.offsetParent).length);
    check("com filtro Mestre e uma busca sem resultado, os cartões de Outros continuam à vista", visiveis === esperados.length, { visiveis });
  }
  const e = await estouro(p);
  check("Perícias sem estouro horizontal", e.pagina <= 0 && e.culpados.length === 0, e);
  check("sem erro de página", etapa.erros.length === 0, etapa.erros.slice(0, 3));
  await ctx.close();
}

/* ---------- 1b. A mesma rolagem, com os modos do d20 ---------- */
{
  passo("Executar, Resistir e teste simples rolam igual à referência, nos modos Normal e Vantagem");
  const rolagens = async (modo) => {
    const ctx = await navegador.newContext({ viewport: { width: 1440, height: 900 } });
    const p = await ctx.newPage();
    await p.addInitScript(() => { Math.random = () => 0.5; });
    p.on("pageerror", (e) => etapa.erros.push(e.message));
    await p.goto(`${BASE}/?ficha=arsenal&tema=escuro${modo ? `&modo=${modo}` : ""}`, { waitUntil: "domcontentloaded" });
    await p.locator("#afty-ficha").waitFor();
    await espera(p, 500);
    if (!modo) await aba(p, "pericias");
    const cartao = (nome) => (modo ? p.locator('[id^="afty-item-manobra:"]').filter({ hasText: nome }).first() : p.locator('[data-m-linha^="manobra:"]').filter({ hasText: nome }).first());
    const botoes = (nome) => cartao(nome).locator("button.afty-rolavel");
    const out = [];
    for (const d20 of ["normal", "vantagem"]) {
      await p.locator(`.afty-log-modo[data-afty-modo="${d20}"]`).click();
      for (const [nome, i] of [["Agarrar", 0], ["Agarrar", 1], ["Concentração", 0], ["Teste de Morte", 0]]) {
        await botoes(nome).nth(i).click();
        const s = await sessaoGravada(p, "arsenal");
        out.push(semVolateis(s.log[0]));
      }
    }
    await ctx.close();
    return out;
  };
  const previa = await rolagens(null);
  const referencia = await rolagens("g2-sem-previa");
  etapa.medidas = { previa: previa.map((x) => x?.slice(0, 160)), referencia: referencia.map((x) => x?.slice(0, 160)) };
  check("oito rolagens registradas iguais (Executar, Resistir, Concentração e Teste de Morte, em Normal e Vantagem)",
    previa.length === 8 && previa.every((x, i) => x && x === referencia[i]), etapa.medidas);
  check("o modo Vantagem chegou ao registro", previa.slice(4).every((x) => JSON.parse(x).modo === "vantagem"));
  check("sem erro de página", etapa.erros.length === 0, etapa.erros.slice(0, 3));
}

/* ---------- 2. Busca global para Agarrar e Concentração ---------- */
{
  passo("Ctrl+K leva Agarrar e Concentração a Perícias, com as três abas visitadas");
  const { ctx, p } = await abre({ ficha: "mesa" });
  for (const id of ["acoes", "pericias", "equipamentos"]) await aba(p, id);
  for (const alvo of ["Agarrar", "Concentração"]) {
    const antes = await sessaoGravada(p, "mesa");
    await p.keyboard.press("Control+k");
    await p.locator(".afty-busca input").fill(alvo);
    await espera(p, 200);
    const item = p.locator(".afty-busca-item").filter({ hasText: alvo }).filter({ hasText: "Manobras" }).first();
    check(`${alvo}: o resultado aparece no grupo Manobras`, (await item.count()) === 1);
    await item.click();
    await espera(p, 700);
    const r = await p.evaluate((alvo) => {
      const el = [...document.querySelectorAll('[data-m-linha^="manobra:"]')].find((x) => x.textContent.includes(alvo));
      const rr = el?.getBoundingClientRect();
      const chave = el?.dataset.mLinha;
      return {
        aba: document.querySelector('[data-afty-aba][aria-selected="true"]')?.dataset.aftyAba,
        dentroDePericias: !!el?.closest('[data-aba-g2="pericias"]:not([hidden])'),
        realce: el?.dataset.aftyAlvo, chave,
        aVista: !!rr && rr.top >= 0 && rr.bottom <= innerHeight,
        ancoras: chave ? document.querySelectorAll(`[id="afty-item-${chave}"]`).length : 0,
        ocultas: document.querySelectorAll('[data-aba-g2][hidden] [data-m-linha^="manobra:"], [data-aba-g2][hidden] [id^="afty-item-manobra:"]').length,
      };
    }, alvo);
    etapa.medidas[alvo] = r;
    check(`${alvo}: Perícias à frente, cartão realçado e à vista`, r.aba === "pericias" && r.dentroDePericias && r.realce === "sim" && r.aVista, r);
    check(`${alvo}: uma âncora só, e nenhuma aba escondida oferece o destino`, r.ancoras === 1 && r.ocultas === 0, r);
    const depois = await sessaoGravada(p, "mesa");
    check(`${alvo}: a busca não rolou e não mudou a sessão`, semCarimbo(depois) === semCarimbo(antes), { log: [antes.log.length, depois.log.length] });
    await foto(p, `ajuste-busca-${alvo === "Agarrar" ? "agarrar" : "concentracao"}`);
  }
  const antes = await sessaoGravada(p, "mesa");
  await aba(p, "acoes");
  await aba(p, "pericias");
  check("ir a Ações e voltar não muda a sessão", semCarimbo(await sessaoGravada(p, "mesa")) === semCarimbo(antes));
  check("sem erro de página", etapa.erros.length === 0, etapa.erros.slice(0, 3));
  await ctx.close();
}

/* ---------- 3. Linhas de Dano em colunas comuns ---------- */
const linhasDeDano = (p) => p.evaluate(() => {
  const sec = document.querySelector('[data-aba-g2="acoes"]:not([hidden]) [data-m-secao="dano"]');
  if (!sec) return null;
  const caixa = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height), cy: Math.round(r.top + r.height / 2) }; };
  const linhas = [...sec.querySelectorAll(".m-linha")].map((l) => {
    const nome = l.querySelector(".m-linha-nome");
    const acerto = l.querySelector(".m-acoes > .m-rolar:not(.m-rolar-dano)");
    const dano = l.querySelector(".m-rolar-dano");
    const linhasDe = (el) => { if (!el) return 0; const lh = parseFloat(getComputedStyle(el).lineHeight) || 18; return Math.round(el.getBoundingClientRect().height / lh); };
    const topo = l.querySelector(".m-motivos") ? l.querySelector(".m-motivos").getBoundingClientRect().top - l.getBoundingClientRect().top : l.getBoundingClientRect().height;
    return {
      nome: l.querySelector(".m-nome").textContent.slice(0, 24), alt: Math.round(l.getBoundingClientRect().height), topo: Math.round(topo),
      linhasNome: linhasDe(l.querySelector(".m-nome")), metas: caixa(l.querySelector(".m-metas")), cxNome: caixa(nome), acerto: caixa(acerto), dano: caixa(dano),
      motivo: !!l.querySelector(".m-motivos"),
      cortados: [...l.querySelectorAll(".m-nome, .m-meta, .m-rolar-num, .m-motivo")].filter((el) => el.offsetParent && el.scrollWidth > el.clientWidth + 1).map((el) => el.textContent.slice(0, 30)),
    };
  });
  return { largura: Math.round(sec.getBoundingClientRect().width), linhas };
});
const confereDano = (m, rotulo, { mesmaAltura = true } = {}) => {
  const ls = m.linhas;
  /* O arranjo de cada linha: os alvos ao lado do bloco nome e metas, ou abaixo dele. */
  const arranjo = ls.map((l) => {
    const fimDoBloco = Math.max(l.cxNome.y + l.cxNome.h, l.metas ? l.metas.y + l.metas.h : 0);
    const metasAbaixo = l.metas && l.metas.y >= l.cxNome.y + l.cxNome.h - 2;
    return `${l.dano && l.dano.y >= fimDoBloco - 2 ? "alvos abaixo" : "alvos ao lado"}, ${metasAbaixo ? "metas sob o nome" : "metas ao lado"}`;
  });
  check(`${rotulo}: todas as linhas no mesmo arranjo`, new Set(arranjo).size === 1, arranjo);
  const xs = (k) => [...new Set(ls.filter((l) => l[k]).map((l) => l[k].x))];
  check(`${rotulo}: Acerto na mesma coluna em todas as linhas`, xs("acerto").length <= 1, xs("acerto"));
  check(`${rotulo}: Dano na mesma coluna em todas as linhas`, xs("dano").length === 1, xs("dano"));
  check(`${rotulo}: metas na mesma coluna`, xs("metas").length === 1, xs("metas"));
  if (mesmaAltura) {
    /* Altura base: só entre linhas sem motivo e com o nome numa linha (nome longo quebra, e isso é permitido). */
    const base = ls.filter((l) => !l.motivo && l.linhasNome <= 1).map((l) => l.topo);
    check(`${rotulo}: mesma altura base (nome de uma linha, sem motivo)`, base.length < 2 || Math.max(...base) - Math.min(...base) <= 3, ls.map((l) => [l.nome, l.topo]));
  }
  check(`${rotulo}: nada cortado`, ls.every((l) => l.cortados.length === 0), ls.flatMap((l) => l.cortados));
};

const comBarra = await chromium.launch({ channel: "chrome", ignoreDefaultArgs: ["--hide-scrollbars"] });
/* Pelo índice, como a pessoa faria: a seção para logo abaixo do cabeçalho grudado, que cobriria o modo do Dano numa rolagem qualquer. */
const vaiAoDano = async (p) => {
  const chip = p.locator('[data-aba-g2="acoes"]:not([hidden]) .m-indice-item').filter({ hasText: /^Dano/ });
  if (await chip.count()) { await chip.click(); await espera(p, 800); } else await p.locator('[data-aba-g2="acoes"]:not([hidden]) [data-m-secao="dano"]').scrollIntoViewIfNeeded();
};
const abrePainel = async (p) => { const b = p.locator('button.f-acesso[aria-controls="g-painel"]'); if (await b.count() && (await b.getAttribute("aria-pressed")) !== "true") { await b.click(); await espera(p, 400); } };
const casos = [
  { nome: "par do autor (mesa, 1440)", ficha: "mesa", l: 1440, a: 900, foto: "ajuste-dano-par-1440" },
  { nome: "tipica 1280x800 com a compacta", ficha: "tipica", l: 1280, a: 800, painel: true, foto: "ajuste-dano-tipica-1280-compacta" },
  { nome: "arsenal 1280x800 com a compacta", ficha: "arsenal", l: 1280, a: 800, painel: true, foto: "ajuste-dano-arsenal-1280-compacta" },
  { nome: "arsenal 1024 com a compacta", ficha: "arsenal", l: 1024, a: 768, painel: true, foto: "ajuste-dano-arsenal-1024-compacta" },
  { nome: "arsenal 331 úteis (768 com a compacta)", ficha: "arsenal", l: 768, a: 1024, painel: true, foto: "ajuste-dano-arsenal-331" },
  { nome: "arsenal telefone 390", ficha: "arsenal", l: 390, a: 844, toque: true, foto: "ajuste-dano-arsenal-390" },
  { nome: "mesa Quad HD com a compacta", ficha: "mesa", l: 2560, a: 1440, painel: true, foto: "ajuste-dano-mesa-qhd" },
  { nome: "arsenal Quad HD", ficha: "arsenal", l: 2560, a: 1440, foto: "ajuste-dano-arsenal-qhd" },
];
for (const c of casos) {
  passo(`Dano em colunas comuns: ${c.nome}`);
  const { ctx, p } = await abre({ ficha: c.ficha, largura: c.l, altura: c.a, toque: !!c.toque, nav: c.toque ? navegador : comBarra, sorte: 0.5 });
  if (c.painel) await abrePainel(p);
  await aba(p, "acoes");
  const sec = p.locator('[data-aba-g2="acoes"]:not([hidden]) [data-m-secao="dano"]');
  await vaiAoDano(p);
  const m = await linhasDeDano(p);
  etapa.medidas.normal = m;
  console.log(`  ${c.nome}: seção ${m.largura}px`, JSON.stringify(m.linhas.map((l) => [l.nome, l.alt, l.acerto?.x, l.dano?.x])));
  confereDano(m, "Normal");
  /* A captura de elemento rola a página e põe a seção sob o cabeçalho grudado: no telefone vale a tela, e depois volta pelo índice. */
  if (c.toque) await foto(p, c.foto); else await sec.screenshot({ path: `${import.meta.dirname}/capturas/${c.foto}.png` });
  await vaiAoDano(p);
  /* Crítico: a fórmula maior alarga a coluna do Dano para TODAS as linhas. */
  await sec.getByRole("radio", { name: "Crítico" }).click();
  await espera(p, 200);
  const mc = await linhasDeDano(p);
  etapa.medidas.critico = mc;
  confereDano(mc, "Crítico");
  await sec.getByRole("radio", { name: "Normal" }).click();
  const e = await estouro(p);
  check("sem estouro horizontal", e.pagina <= 0 && e.culpados.length === 0, e);
  check("sem erro de página", etapa.erros.length === 0, etapa.erros.slice(0, 3));
  await ctx.close();
}

/* Motivo de recusa à vista: a Besta de capacidade 1 depois do disparo. O motivo ocupa a fileira dele, e os alvos não saem da coluna. */
for (const [l, painel] of [[1280, true], [768, true]]) {
  passo(`Dano com motivo de recusa: arsenal ${l}${painel ? " com a compacta" : ""}`);
  const { ctx, p } = await abre({ ficha: "arsenal", largura: l, altura: l === 768 ? 1024 : 800, nav: comBarra, sorte: 0.5 });
  if (painel) await abrePainel(p);
  await vaiAoDano(p);
  const besta = p.locator('[data-m-linha="dano:armc_besta"]');
  await besta.locator(".m-rolar").filter({ hasText: "Acerto" }).locator("button.afty-rolavel").click();
  await espera(p, 300);
  await besta.locator(".m-rolar-dano button.afty-rolavel").click();
  await espera(p, 300);
  const m = await linhasDeDano(p);
  etapa.medidas = m;
  const linhaBesta = m.linhas.find((x) => x.nome.startsWith("Besta"));
  check("o motivo está à vista na linha da Besta", !!linhaBesta?.motivo && (await besta.locator(".m-motivo").textContent()).includes("Recarregue a Arma"));
  confereDano(m, "com motivo", { mesmaAltura: true });
  await p.mouse.move(2, 2);
  await espera(p, 300);
  await p.locator('[data-aba-g2="acoes"]:not([hidden]) [data-m-secao="dano"]').screenshot({ path: `${import.meta.dirname}/capturas/ajuste-dano-motivo-${l}.png` });
  check("sem erro de página", etapa.erros.length === 0, etapa.erros.slice(0, 3));
  await ctx.close();
}

/* Perícias com Outros, para o aceite: 1280 com a compacta e telefone. */
for (const [l, a, painel, toque] of [[1280, 800, true, false], [390, 844, false, true]]) {
  passo(`captura de Perícias com Outros: ${l}`);
  const { ctx, p } = await abre({ ficha: "tipica", largura: l, altura: a, toque, nav: toque ? navegador : comBarra });
  if (painel) await abrePainel(p);
  await aba(p, "pericias");
  const outros = p.locator('[data-aba-g2="pericias"] [data-m-secao="outros"]');
  await outros.scrollIntoViewIfNeeded();
  await foto(p, `ajuste-pericias-outros-${l}`);
  const e = await estouro(p);
  check("sem estouro horizontal", e.pagina <= 0 && e.culpados.length === 0, e);
  const alvos = await outros.locator(".m-rolar").evaluateAll((els) => Math.min(...els.map((el) => Math.round(el.getBoundingClientRect().height))));
  check(`alvos de Outros com ${toque ? 40 : 34} px ou mais`, alvos >= (toque ? 40 : 34), alvos);
  await ctx.close();
}
await comBarra.close();
await encerra("ajustes");
