/* PRÉVIA DAS TRÊS ABAS: temas (escuro, claro, Minamoto, CSS personalizado), contraste AA nos presets, ganchos `afty-*` alcançados pelo CSS
   do usuário, e compatibilidade: a clássica e o G2 SEM a prop seguem com as abas de sempre e o painel de fontes de sempre. */
import { abre, aba, passo, check, foto, encerra, espera, etapa, sessaoGravada, BASE, navegador } from "./lib.mjs";

const contrastes = (p) => p.evaluate(() => {
  /* Qualquer cor CSS (oklab, color-mix, rgb) vira sRGB com alfa pelo canvas, sem interpretar a string à mão. */
  const tela = document.createElement("canvas"); tela.width = tela.height = 1;
  const g2d = tela.getContext("2d", { willReadFrequently: true });
  const rgb = (c) => { g2d.clearRect(0, 0, 1, 1); g2d.fillStyle = "rgba(0,0,0,0)"; g2d.fillStyle = c; g2d.fillRect(0, 0, 1, 1); const [r, gg, b, al] = g2d.getImageData(0, 0, 1, 1).data; return { r, g: gg, b, a: al / 255 }; };
  const lum = ({ r, g, b }) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const mistura = (cima, baixo) => ({ r: cima.r * cima.a + baixo.r * (1 - cima.a), g: cima.g * cima.a + baixo.g * (1 - cima.a), b: cima.b * cima.a + baixo.b * (1 - cima.a), a: 1 });
  const fundo = (el) => {
    const camadas = [];
    for (let a = el; a; a = a.parentElement) { const c = rgb(getComputedStyle(a).backgroundColor); if (c.a > 0) camadas.push(c); if (c.a >= 1) break; }
    /* A base é o fundo efetivo da página (o corpo e a raiz da Ficha), e não um escuro fixo. */
    let base = { ...rgb(getComputedStyle(document.body).backgroundColor), a: 1 };
    const raiz = rgb(getComputedStyle(document.getElementById("afty-ficha")).backgroundColor);
    if (raiz.a > 0) base = mistura(raiz, base);
    for (const c of camadas.reverse()) base = mistura(c, base);
    return base;
  };
  const amostras = { nome: ".m-nome, .m-teste-nome", meta: ".m-meta", estado: ".m-celula-estado", numero: ".m-rolar-num", chip: ".m-chip", motivo: ".m-motivo", rotulo: ".m-rolar-rotulo" };
  const out = {};
  for (const [k, sel] of Object.entries(amostras)) {
    const els = [...document.querySelectorAll(`[data-aba-g2]:not([hidden]) ${sel.split(", ").join(`, [data-aba-g2]:not([hidden]) `)}`)].filter((el) => el.offsetParent).slice(0, 25);
    if (!els.length) continue;
    const valores = els.map((el) => { const t = mistura(rgb(getComputedStyle(el).color), fundo(el)); const a = lum(t), b = lum(fundo(el)); return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05); });
    out[k] = Math.round(Math.min(...valores) * 100) / 100;
  }
  return out;
});

for (const tema of ["escuro", "claro", "minamoto", "css"]) {
  passo(`tema ${tema}`);
  const { ctx, p } = await abre({ ficha: "arsenal", tema, sorte: 0 });
  await p.locator('[data-m-linha="dano:armc_besta"] .m-rolar').filter({ hasText: "Acerto" }).locator("button.afty-rolavel").click();
  await espera(p, 300);
  const medidas = {};
  for (const id of ["acoes", "pericias", "equipamentos"]) {
    await aba(p, id);
    medidas[id] = await contrastes(p);
    await foto(p, `tema-${tema}-${id}`);
  }
  etapa.medidas = medidas;
  console.log(`  ${tema}`, JSON.stringify(medidas));
  if (tema !== "css") {
    const piores = Object.entries(medidas).flatMap(([id, m]) => Object.entries(m).filter(([, v]) => v < 4.5).map(([k, v]) => `${id}.${k}=${v}`));
    check("texto com contraste AA (4,5) nos presets", piores.length === 0, piores);
  }
  if (tema === "css") {
    await aba(p, "acoes");
    const cor = await p.locator(".m-rolar-num").first().evaluate((el) => getComputedStyle(el).color);
    check("o CSS do usuário alcança o número pelo gancho `.afty-valor`", cor === "rgb(34, 211, 238)", cor);
    const borda = await p.locator('[data-m-secao="dano"]').evaluate((el) => getComputedStyle(el).borderTopColor);
    check("e a seção pelo gancho `.afty-card`", borda === "rgb(225, 29, 72)", borda);
  }
  check("sem erro de página", etapa.erros.length === 0, etapa.erros);
  await ctx.close();
}

/* Compatibilidade: a clássica e o G2 sem a prop, com os mesmos dados. */
for (const modo of ["classica", "g2-sem-previa"]) {
  passo(`compatibilidade ${modo}`);
  const ctx = await navegador.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  p.on("pageerror", (e) => etapa.erros.push(e.message));
  await p.goto(`${BASE}/?ficha=arsenal&tema=escuro&modo=${modo}`, { waitUntil: "domcontentloaded" });
  await p.locator("#afty-ficha").waitFor();
  await espera(p, 600);
  check("as abas novas não aparecem", (await p.locator("[data-m-aba], [data-aba-g2]").count()) === 0);
  check("a aba Ações de sempre aparece (seção Dano da clássica)", (await p.locator("section.afty-card h2").filter({ hasText: /^Dano$/ }).count()) === 1);
  const num = p.locator("#afty-item-dano\\:armc_ampla button.afty-rolavel").last();
  await num.hover();
  await espera(p, 250);
  check("o painel de fontes abre no hover como sempre", await p.locator(".afty-fontes-flutuante").isVisible());
  const n0 = (await sessaoGravada(p, "arsenal"))?.log?.length ?? 0;
  await num.click();
  check("o clique rola como sempre", ((await sessaoGravada(p, "arsenal"))?.log?.length ?? 0) === n0 + 1);
  await p.locator('[data-afty-aba="pericias"]').click();
  await espera(p, 300);
  check("trocar de aba desmonta a anterior (uma aba por vez)", (await p.locator("#afty-item-dano\\:armc_ampla").count()) === 0);
  await foto(p, `compat-${modo}-pericias`);
  check("sem erro de página", etapa.erros.length === 0, etapa.erros);
  await ctx.close();
}
await encerra("temas-compat");
