/* Em Combate legível em cada tema: contraste do texto do botão ligado contra o fundo que ele realmente tem (amostrado da captura), nos cinco presets,
   no Minamoto (CSS personalizado) e em dois temas hostis (a cor de cura quase igual ao fundo). A régua é 4,5:1 (WCAG AA para texto de 13 px). */
import { fichas, sessoes, contexto, abre, passo, check, foto, espera, emCombate, encerra, navegador } from "./lib.mjs";

const base = { fonte: null, raio: null, imagem: { url: "", opacidade: 0.25, encaixe: "cover", posicao: "center top" }, css: "" };
const preset = (id, css = "") => ({ presetId: id, vars: {}, ...base, css });
const temas = [
  ["padrao", preset("padrao")], ["pergaminho", preset("pergaminho")], ["sangue", preset("sangue")], ["abissal", preset("abissal")], ["terminal", preset("terminal")],
  ["minamoto", null],
  ["hostil-escuro", preset("padrao", ":scope#afty-ficha, #afty-ficha#afty-ficha { --afty-cura: #0d2a1f; }")],
  ["hostil-claro", preset("pergaminho", ":scope#afty-ficha, #afty-ficha#afty-ficha { --afty-cura: #eaffea; }")],
];
const leitor = await navegador.newPage();
await leitor.setContent("<canvas></canvas>");
const medir = (b64, cor) => leitor.evaluate(async ({ b64, cor }) => {
  const img = new Image(); img.src = `data:image/png;base64,${b64}`; await img.decode();
  const c = document.querySelector("canvas"); c.width = img.width; c.height = img.height;
  const x = c.getContext("2d", { willReadFrequently: true }); x.drawImage(img, 0, 0);
  const d = x.getImageData(0, 0, c.width, c.height).data;
  const lum = (r, g, b) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const taxa = (a, b) => { const [h, l] = a > b ? [a, b] : [b, a]; return (h + 0.05) / (l + 0.05); };
  /* o miolo da caixa: sem a borda e sem o arredondamento */
  const cont = new Map(); const m = Math.max(4, Math.round(img.height * 0.2));
  for (let j = m; j < img.height - m; j++) for (let i = m; i < img.width - m; i++) { const k = (j * img.width + i) * 4; const q = `${d[k] >> 2},${d[k + 1] >> 2},${d[k + 2] >> 2}`; cont.set(q, (cont.get(q) ?? 0) + 1); }
  const [moda] = [...cont.entries()].sort((a, b) => b[1] - a[1])[0];
  const [br, bg, bb] = moda.split(",").map((v) => v * 4 + 2);
  const t = document.createElement("canvas"); t.width = t.height = 1; const tx = t.getContext("2d", { willReadFrequently: true }); tx.fillStyle = cor; tx.fillRect(0, 0, 1, 1);
  const [tr, tg, tb] = tx.getImageData(0, 0, 1, 1).data;
  const lb = lum(br, bg, bb);
  let pior = 1; let melhor = 1;
  for (let j = m; j < img.height - m; j++) for (let i = m; i < img.width - m; i++) { const k = (j * img.width + i) * 4; const r = taxa(lum(d[k], d[k + 1], d[k + 2]), lb); if (r > melhor) melhor = r; }
  return { fundo: [br, bg, bb], texto: [tr, tg, tb], porCor: +taxa(lum(tr, tg, tb), lb).toFixed(2), renderizado: +melhor.toFixed(2) };
}, { b64, cor });

for (const largura of [1440, 390]) {
  passo(`tema ${largura}`);
  for (const [nome, tema] of temas) {
    const chave = nome === "minamoto" ? "minamoto" : "mestre";
    const { ctx, p } = await contexto({ lista: [fichas[chave]], largura, altura: largura < 500 ? 844 : 900, sessoesIniciais: sessoes, tema });
    await abre(p, "player", fichas[chave].name);
    await emCombate(p);
    const btn = p.locator(".e-agora .e-combate");
    check(`${nome}-ligado-${largura}`, (await btn.getAttribute("aria-pressed")) === "true");
    const cor = await btn.evaluate((el) => getComputedStyle(el).color);
    const png = (await btn.screenshot()).toString("base64");
    const r = await medir(png, cor);
    check(`${nome}-contraste-${largura}`, r.porCor >= 4.5, r);
    await foto(p, `tema-${nome}-${largura}`);
    await ctx.close();
  }
}
await encerra();
