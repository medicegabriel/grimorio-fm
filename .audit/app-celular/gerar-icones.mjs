/**
 * Os ícones do app Era de Ouro, gerados do selo em SVG (docs/app-celular/selo-era-de-ouro.svg).
 *
 *   node .audit/app-celular/gerar-icones.mjs --saida <pasta>            os PNG e o SVG do app
 *   node .audit/app-celular/gerar-icones.mjs --saida <pasta> --previa   também a prancha de aprovação
 *
 * Variantes:
 *   era-de-ouro-{192,512}.png           "any": cantos arredondados, fora deles transparente
 *   era-de-ouro-mascara-{192,512}.png   "maskable": quadrado cheio, o Android recorta (o selo cabe no
 *                                       círculo seguro de 40% do raio, por isso o anel para em 202 px)
 *   era-de-ouro-180.png                 ícone de toque da Apple, quadrado cheio (o iPhone arredonda)
 *   era-de-ouro.svg                     o "any" em vetor, para o manifesto e o favicon
 *
 * Usa o Edge do Windows pelo cdp-edge.mjs, sem biblioteca nova.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { abrirEdge, espera } from "./cdp-edge.mjs";

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = resolve(AQUI, "..", "..");
const arg = (nome, padrao) => {
  const i = process.argv.indexOf(`--${nome}`);
  return i > 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[i + 1] : padrao;
};
const SAIDA = resolve(arg("saida", join(AQUI, "icones")));
const PREVIA = process.argv.includes("--previa");

const SELO = readFileSync(join(RAIZ, "docs", "app-celular", "selo-era-de-ouro.svg"), "utf8");
/* O "any" arredonda o fundo (e o brilho) e deixa o resto igual. */
const ARREDONDADO = SELO.replaceAll('<rect width="512" height="512" ', '<rect width="512" height="512" rx="112" ');

const comoImagem = (svg) => `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;

async function renderizar(aba, html, largura, altura) {
  await aba.enviar("Emulation.setDeviceMetricsOverride", { width: largura, height: altura, deviceScaleFactor: 1, mobile: false });
  await aba.enviar("Emulation.setDefaultBackgroundColorOverride", { color: { r: 0, g: 0, b: 0, a: 0 } });
  await aba.enviar("Page.navigate", { url: `data:text/html;base64,${Buffer.from(html).toString("base64")}` });
  await espera(700);
  const { data } = await aba.enviar("Page.captureScreenshot", {
    format: "png", clip: { x: 0, y: 0, width: largura, height: altura, scale: 1 },
  });
  return Buffer.from(data, "base64");
}

const soImagem = (svg, lado) =>
  `<!doctype html><html><body style="margin:0;background:transparent"><img src="${comoImagem(svg)}" width="${lado}" height="${lado}" style="display:block"></body></html>`;

/* A prancha de aprovação: tamanhos reais de tela inicial, fundos claro e escuro, e os recortes do Android. */
function prancha() {
  const any = comoImagem(ARREDONDADO);
  const cheio = comoImagem(SELO);
  const recorte = (raio, rotulo) => `<figure><div style="width:96px;height:96px;border-radius:${raio};overflow:hidden"><img src="${cheio}" width="96" height="96"></div><figcaption>${rotulo}</figcaption></figure>`;
  const tamanho = (lado, fundo) => `<figure style="background:${fundo}"><img src="${any}" width="${lado}" height="${lado}"><figcaption style="color:${fundo === "#f1f5f9" ? "#0f172a" : "#cbd5e1"}">${lado} px</figcaption></figure>`;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    body{margin:0;padding:24px;background:#0b1020;font:14px system-ui,Segoe UI,sans-serif;color:#e2e8f0}
    h2{font-size:15px;margin:20px 0 10px;color:#f7dc8f} section{display:flex;gap:16px;flex-wrap:wrap;align-items:flex-end}
    figure{margin:0;padding:12px;border-radius:12px;display:flex;flex-direction:column;align-items:center;gap:8px}
    figcaption{font-size:12px;color:#cbd5e1}
  </style></head><body>
    <h2>Era de Ouro · Tamanhos na Tela Inicial</h2>
    <section>${tamanho(48, "#111827")}${tamanho(72, "#111827")}${tamanho(96, "#111827")}${tamanho(48, "#f1f5f9")}${tamanho(96, "#f1f5f9")}</section>
    <h2>Recortes do Android (Ícone Mascarável)</h2>
    <section>${recorte("50%", "Círculo")}${recorte("30%", "Arredondado")}${recorte("16px", "Quadrado Suave")}${recorte("0", "Sem Recorte")}</section>
    <h2>Grande</h2>
    <section><figure><img src="${any}" width="256" height="256"><figcaption>256 px</figcaption></figure></section>
  </body></html>`;
}

mkdirSync(SAIDA, { recursive: true });
const edge = await abrirEdge();
try {
  const aba = await edge.novaAba();
  await aba.enviar("Page.enable");
  const saidas = [
    ["era-de-ouro-192.png", ARREDONDADO, 192],
    ["era-de-ouro-512.png", ARREDONDADO, 512],
    ["era-de-ouro-mascara-192.png", SELO, 192],
    ["era-de-ouro-mascara-512.png", SELO, 512],
    ["era-de-ouro-180.png", SELO, 180],
  ];
  for (const [nome, svg, lado] of saidas) {
    writeFileSync(join(SAIDA, nome), await renderizar(aba, soImagem(svg, lado), lado, lado));
    console.log(`gerado ${nome}`);
  }
  writeFileSync(join(SAIDA, "era-de-ouro.svg"), ARREDONDADO);
  console.log("gerado era-de-ouro.svg");
  if (PREVIA) {
    writeFileSync(join(SAIDA, "previa-icones.png"), await renderizar(aba, prancha(), 760, 820));
    console.log("gerada previa-icones.png");
  }
  await aba.fecharAba();
} finally {
  await edge.fechar();
}
console.log(`pasta: ${SAIDA}`);
