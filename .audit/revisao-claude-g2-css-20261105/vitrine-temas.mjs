/* Vitrine: seis identidades na MESMA ficha (mesa), nas quatro abas de uso, em 1440 e 390, com contraste computado (AA 4,5) em texto de nome,
   meta, número, título de cartão e chip. Sem esconder função: só a aparência muda. */
import { abre, aba, passo, check, foto, encerra, espera, etapa } from "./lib.mjs";
const contrastes = (p) => p.evaluate(() => {
  const tela = document.createElement("canvas"); tela.width = tela.height = 1; const g2d = tela.getContext("2d", { willReadFrequently: true });
  const rgb = (c) => { g2d.clearRect(0, 0, 1, 1); g2d.fillStyle = "rgba(0,0,0,0)"; g2d.fillStyle = c; g2d.fillRect(0, 0, 1, 1); const [r, g, b, a] = g2d.getImageData(0, 0, 1, 1).data; return { r, g, b, a: a / 255 }; };
  const lum = ({ r, g, b }) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const mix = (c, b) => ({ r: c.r * c.a + b.r * (1 - c.a), g: c.g * c.a + b.g * (1 - c.a), b: c.b * c.a + b.b * (1 - c.a), a: 1 });
  const fundo = (el) => { const cam = []; for (let a = el; a; a = a.parentElement) { const c = rgb(getComputedStyle(a).backgroundColor); if (c.a > 0) cam.push(c); if (c.a >= 1) break; } let base = { ...rgb(getComputedStyle(document.body).backgroundColor), a: 1 }; const raiz = rgb(getComputedStyle(document.getElementById("afty-ficha")).backgroundColor); if (raiz.a > 0) base = mix(raiz, base); for (const c of cam.reverse()) base = mix(c, base); return base; };
  const amostras = { nome: ".m-nome, .m-teste-nome, .afty-nome", meta: ".m-meta", numero: ".m-rolar-num", titulo: ".afty-card-titulo", aba: ".afty-aba", rotulo: ".m-rolar-rotulo" };
  const out = {};
  for (const [k, sel] of Object.entries(amostras)) {
    const els = [...document.querySelectorAll(sel)].filter((e) => e.offsetParent && e.textContent.trim()).slice(0, 30);
    if (!els.length) continue;
    out[k] = Math.round(Math.min(...els.map((e) => { const f = fundo(e); const t = mix(rgb(getComputedStyle(e).color), f); const a = lum(t), b = lum(f); return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05); })) * 100) / 100;
  }
  return out;
});
const TEMAS = [["padrao", "tema=escuro"], ["pergaminho", "tema=claro"], ["minamoto", "tema=minamoto"], ["alter", "tema=alter"], ["vitral", "css=demo-vitral"], ["papel", "css=demo-papel"]];
for (const [nome, query] of TEMAS) for (const largura of [1440, 390]) {
  passo(`${nome} ${largura}`);
  const { ctx, p } = await abre({ ficha: "mesa", query, largura, altura: largura === 390 ? 844 : 900, toque: largura === 390 });
  const medidas = {};
  for (const a of ["acoes", "pericias", "equipamentos", "habilidades"]) {
    await aba(p, a); await espera(p, 200);
    medidas[a] = await contrastes(p);
    await foto(p, `vitrine-${nome}-${largura}-${a}`);
  }
  etapa.medidas = medidas;
  const piores = Object.entries(medidas).flatMap(([a, m]) => Object.entries(m).filter(([, v]) => v < 4.5).map(([k, v]) => `${a}.${k}=${v}`));
  check(`${nome} ${largura}: texto com contraste AA (4,5)`, piores.length === 0, piores);
  const est = await p.evaluate(() => ({ pag: document.documentElement.scrollWidth - document.documentElement.clientWidth }));
  check(`${nome} ${largura}: sem estouro horizontal`, est.pag <= 0, est);
  check(`${nome} ${largura}: sem erro de página`, etapa.erros.length === 0, etapa.erros);
  await ctx.close();
}
await encerra("vitrine-temas");
