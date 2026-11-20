/**
 * As métricas do app de celular (plano "App Era de Ouro", seção Verificação).
 *
 * Roda o site num Edge invisível, como um celular Android com toque, nas larguras
 * pedidas, e mede a lista da Guilda, a Ficha Final e o criador. Grava um JSON com os
 * números em `.audit/app-celular/medicoes/<rotulo>.json` e imprime um resumo.
 *
 *   node .audit/app-celular/medir.mjs --url https://fichafm.com.br --rotulo e1-base-producao
 *   node .audit/app-celular/medir.mjs --url http://localhost:4173 --rotulo e3-preview --capturas <pasta>
 *
 * As fichas de teste vão para o perfil TEMPORÁRIO do Edge, apagado no fim. Nada do
 * navegador da pessoa é tocado, e com `--url` de produção nada sobe para a nuvem
 * (o perfil não tem conta).
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { abrirEdge, avaliar, espera, navegar } from "./cdp-edge.mjs";

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = resolve(AQUI, "..", "..");

function argumento(nome, padrao) {
  const i = process.argv.indexOf(`--${nome}`);
  return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : padrao;
}

const BASE = argumento("url", "http://localhost:4173").replace(/\/$/, "");
const LARGURAS = argumento("larguras", "360,375,390,412").split(",").map(Number);
const ALTURA = Number(argumento("altura", "812"));
const ROTULO = argumento("rotulo", `medicao-${new Date().toISOString().slice(0, 10)}`);
const CAPTURAS = argumento("capturas", null);
const UA_ANDROID = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36";

/* As duas fichas reais do repositório, carimbadas na Guilda. */
function fichasDeTeste() {
  const ler = (rel) => {
    const j = JSON.parse(readFileSync(join(RAIZ, rel), "utf8"));
    return (Array.isArray(j) ? j : j.creatures ?? [j])[0];
  };
  const criatura = { ...ler("src/systems/afty/exports/ciel-lucielus-automatizado.json"), id: "medir_criatura", mesa: "eradeouro", folderId: null };
  const jogador = { ...ler("previas/satoru-gojo-player.json"), id: "medir_jogador", mesa: "eradeouro", folderId: null };
  return { lista: [criatura, jogador], nomeDoJogador: jogador.name };
}

/* Roda DENTRO da página. Sem fechamento: só o que o navegador tem. */
function medirNaPagina(tela) {
  const vw = innerWidth;
  const vh = innerHeight;
  const visivel = (el) => {
    const r = el.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return false;
    for (let e = el; e; e = e.parentElement) {
      const s = getComputedStyle(e);
      if (s.display === "none" || s.visibility === "hidden" || Number(s.opacity) === 0) return false;
    }
    return true;
  };
  const nomeDe = (el) => (el.getAttribute("aria-label") || el.getAttribute("title") || el.textContent || el.getAttribute("placeholder") || el.tagName).trim().replace(/\s+/g, " ").slice(0, 32);

  const SELETOR = "button, a[href], input:not([type=hidden]), select, textarea, summary, [role=button], [role=tab], [role=checkbox], [role=menuitem]";
  /* A área de toque conta a área invisível que o CSS dá por `::before` ou `::after` (posição absoluta, com conteúdo, que recebe o toque). Sem isso os
     números da G2, que têm 44 px de toque por `::after`, saíam como alvos de 22 px (2026-11-20). */
  const areaDoPseudo = (el) => {
    let l = 0, a = 0;
    for (const p of ["::before", "::after"]) {
      const s = getComputedStyle(el, p);
      if (s.content === "none" || s.position !== "absolute" || s.pointerEvents === "none") continue;
      l = Math.max(l, parseFloat(s.width) || 0);
      a = Math.max(a, parseFloat(s.height) || 0);
    }
    return { l, a };
  };
  const alvos = [...document.querySelectorAll(SELETOR)].filter(visivel).map((el) => {
    const alvo = el.matches("input[type=checkbox], input[type=radio]") && el.closest("label") ? el.closest("label") : el;
    const r = alvo.getBoundingClientRect();
    const p = areaDoPseudo(alvo);
    const l = Math.max(r.width, p.l), a = Math.max(r.height, p.a);
    return { nome: nomeDe(el), l: Math.round(l), a: Math.round(a), menor: Math.min(l, a) };
  });
  const pequenos = alvos.filter((x) => x.menor < 36).sort((a, b) => a.menor - b.menor);

  const frasesPequenas = new Set();
  const rotulosPequenos = new Set();
  const andar = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let no = andar.nextNode(); no; no = andar.nextNode()) {
    const texto = no.textContent.trim();
    const pai = no.parentElement;
    if (texto.length < 2 || !pai || ["SCRIPT", "STYLE", "NOSCRIPT"].includes(pai.tagName) || !visivel(pai)) continue;
    const fs = parseFloat(getComputedStyle(pai).fontSize);
    const ehFrase = texto.split(/\s+/).length >= 4;
    if (ehFrase && fs < 12) frasesPequenas.add(pai);
    if (!ehFrase && fs < 11) rotulosPequenos.add(pai);
  }

  const out = {
    tela,
    ponteiroGrosso: matchMedia("(pointer: coarse)").matches,
    semHover: matchMedia("(hover: none)").matches,
    titulo: document.title,
    manifesto: !!document.querySelector('link[rel="manifest"]'),
    rolagemLateral: document.documentElement.scrollWidth > vw,
    larguraDoc: document.documentElement.scrollWidth,
    alturaDoc: document.documentElement.scrollHeight,
    alvos: alvos.length,
    alvosAbaixo36: pequenos.length,
    alvosAbaixo24: alvos.filter((x) => x.menor < 24).length,
    piores: pequenos.slice(0, 10).map((x) => `${x.nome} ${x.l}x${x.a}`),
    frasesAbaixo12: frasesPequenas.size,
    rotulosAbaixo11: rotulosPequenos.size,
  };

  if (tela === "lista") {
    const h1 = document.querySelector("header h1, h1");
    out.tituloCortado = !!h1 && h1.scrollWidth > h1.clientWidth + 1;
    out.cabecalho = Math.round(document.querySelector("header")?.getBoundingClientRect().height ?? 0);
    out.botoesSoIcone = [...document.querySelectorAll("header button")].filter((b) => visivel(b) && !b.innerText.trim()).length;
  }
  if (tela === "criador") {
    const nome = document.querySelector('input[placeholder*="ome" i]');
    out.nomeTopo = nome ? Math.round(nome.getBoundingClientRect().top + scrollY) : null;
    out.cabecalhoFixo = Math.round(document.querySelector("header")?.getBoundingClientRect().height ?? 0);
    const abas = [...document.querySelectorAll("header button")].filter((b) => /^(Identidade|Informações|Perícias|Habilidades|Especializações|Aptidões|Invocações|Equipamentos|Interlúdios)$/.test(b.textContent.trim()));
    out.abasTotal = abas.length;
    out.abasInteirasNaTela = abas.filter((b) => { const r = b.getBoundingClientRect(); return r.left >= 0 && r.right <= vw && r.width > 0; }).length;
  }
  if (tela === "ficha") {
    const cab = document.querySelector(".afty-cabecalho");
    const h = cab ? cab.getBoundingClientRect().height : 0;
    out.cabecalho = Math.round(h);
    out.cabecalhoPct = Math.round((h / vh) * 100);
    const area = cab?.querySelector(".e-recursos") ?? cab;
    let maior = 0;
    if (area) {
      const w = document.createTreeWalker(area, NodeFilter.SHOW_TEXT);
      for (let no = w.nextNode(); no; no = w.nextNode()) {
        if (/^\d+$/.test(no.textContent.trim()) && no.parentElement && visivel(no.parentElement)) {
          maior = Math.max(maior, parseFloat(getComputedStyle(no.parentElement).fontSize));
        }
      }
    }
    out.numeroDoRecursoPx = maior;
  }
  return out;
}

const JS_CARREGADO = `(() => Math.round(performance.getEntriesByType("resource")
  .filter((r) => /\\.js(\\?|$)/.test(r.name))
  .reduce((s, r) => s + (r.decodedBodySize || 0), 0) / 1024))()`;

const clicarPorTexto = (texto) => `(() => {
  const alvo = [...document.querySelectorAll("button, [role=button], a, h1, h2, h3, h4, span, div, p")]
    .find((e) => e.children.length === 0 && e.textContent.trim() === ${JSON.stringify(texto)});
  if (!alvo) return false;
  (alvo.closest("button, [role=button], a") ?? alvo).click();
  return true;
})()`;

const clicarPorNome = (padrao) => `(() => {
  const re = new RegExp(${JSON.stringify(padrao)}, "i");
  const alvo = [...document.querySelectorAll("button, [role=button], a")]
    .find((b) => re.test(b.getAttribute("aria-label") || b.getAttribute("title") || b.textContent.trim()));
  if (!alvo) return false;
  alvo.click();
  return true;
})()`;

async function emular(aba, largura) {
  await aba.enviar("Emulation.setDeviceMetricsOverride", { width: largura, height: ALTURA, deviceScaleFactor: 2, mobile: true });
  await aba.enviar("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
  await aba.enviar("Emulation.setEmitTouchEventsForMouse", { enabled: true, configuration: "mobile" });
  await aba.enviar("Emulation.setUserAgentOverride", { userAgent: UA_ANDROID, platform: "Linux armv8l" });
}

async function capturar(aba, nome) {
  if (!CAPTURAS) return;
  const { data } = await aba.enviar("Page.captureScreenshot", { format: "png" });
  mkdirSync(CAPTURAS, { recursive: true });
  writeFileSync(join(CAPTURAS, `${nome}.png`), Buffer.from(data, "base64"));
}

async function medirLargura(edge, largura, fichas) {
  const aba = await edge.novaAba();
  const erros = [];
  aba.aoEvento("Runtime.exceptionThrown", (p) => erros.push(p.exceptionDetails?.exception?.description?.split("\n")[0] ?? p.exceptionDetails?.text));
  aba.aoEvento("Runtime.consoleAPICalled", (p) => { if (p.type === "error") erros.push(p.args?.map((a) => a.value ?? a.description).join(" ").slice(0, 200)); });
  aba.aoEvento("Log.entryAdded", (p) => { if (p.entry.level === "error") erros.push(`${p.entry.source}: ${p.entry.text}`.slice(0, 200)); });
  for (const d of ["Page.enable", "Runtime.enable", "Log.enable", "Network.enable"]) await aba.enviar(d);
  await aba.enviar("Network.setCacheDisabled", { cacheDisabled: true });
  await emular(aba, largura);

  /* Semear: abre a origem, grava as fichas e recarrega a frio. */
  await navegar(aba, `${BASE}/EraDeOuro`);
  await avaliar(aba, `(() => { localStorage.clear(); localStorage.setItem("fm_creatures_eradeouro_v1", ${JSON.stringify(JSON.stringify(fichas.lista))}); return true; })()`);
  await aba.enviar("Network.clearBrowserCache");
  erros.length = 0;
  await navegar(aba, `${BASE}/EraDeOuro`, { respiroMs: 3000 });

  const r = { largura };
  r.lista = await avaliar(aba, `(${medirNaPagina})("lista")`);
  r.lista.jsKB = await avaliar(aba, JS_CARREGADO);
  try {
    const { installabilityErrors } = await aba.enviar("Page.getInstallabilityErrors");
    r.lista.instalavel = installabilityErrors.length === 0;
    r.lista.errosDeInstalacao = installabilityErrors.map((e) => e.errorId);
  } catch (e) {
    r.lista.errosDeInstalacao = [`indisponível: ${e.message}`];
  }
  await capturar(aba, `${largura}-lista`);

  /* A Ficha Final do personagem. */
  r.ficha = { aberta: await avaliar(aba, clicarPorTexto(fichas.nomeDoJogador)) };
  await espera(3500);
  Object.assign(r.ficha, await avaliar(aba, `(${medirNaPagina})("ficha")`));
  r.ficha.jsKB = await avaliar(aba, JS_CARREGADO);
  await capturar(aba, `${largura}-ficha`);

  /* O Voltar do aparelho: marca a página e volta. Se a marca some, a página saiu. */
  await avaliar(aba, "window.__fmMarca = 1");
  /* O Voltar vem DEPOIS da resposta: navegar no meio da avaliação derruba o CDP. */
  await avaliar(aba, "setTimeout(() => history.back(), 50), true").catch(() => {});
  await espera(2500);
  r.voltarFicaNoSite = (await avaliar(aba, "window.__fmMarca === 1").catch(() => false)) === true;
  if (!r.voltarFicaNoSite) await navegar(aba, `${BASE}/EraDeOuro`, { respiroMs: 3000 });
  else await avaliar(aba, clicarPorNome("^voltar"));
  await espera(1200);

  /* O criador de personagem. */
  await avaliar(aba, clicarPorNome("^criar nova ficha$"));
  await espera(800);
  await avaliar(aba, clicarPorTexto("Personagem"));
  await espera(3500);
  await avaliar(aba, "scrollTo(0, 0)");
  r.criador = await avaliar(aba, `(${medirNaPagina})("criador")`);
  await capturar(aba, `${largura}-criador`);

  r.errosNoConsole = [...new Set(erros)].slice(0, 12);
  await aba.fecharAba();
  return r;
}

async function manifestoNasRotas(edge) {
  const aba = await edge.novaAba();
  await aba.enviar("Page.enable");
  await aba.enviar("Runtime.enable");
  const out = {};
  for (const rota of ["/", "/Player", "/Afty", "/EraDeOuro"]) {
    await navegar(aba, `${BASE}${rota}`, { respiroMs: 1200 });
    out[rota] = await avaliar(aba, `({ manifesto: !!document.querySelector('link[rel="manifest"]'), titulo: document.title })`);
  }
  await aba.fecharAba();
  return out;
}

const edge = await abrirEdge();
const resultado = { quando: new Date().toISOString(), url: BASE, rotulo: ROTULO, altura: ALTURA, larguras: {} };
try {
  const fichas = fichasDeTeste();
  for (const largura of LARGURAS) {
    process.stdout.write(`medindo ${largura} px... `);
    resultado.larguras[largura] = await medirLargura(edge, largura, fichas);
    console.log("ok");
  }
  resultado.rotas = await manifestoNasRotas(edge);
} finally {
  await edge.fechar();
}

const saida = join(AQUI, "medicoes", `${ROTULO}.json`);
mkdirSync(dirname(saida), { recursive: true });
writeFileSync(saida, `${JSON.stringify(resultado, null, 2)}\n`);

console.log(`\n${ROTULO} (${BASE})`);
for (const [w, r] of Object.entries(resultado.larguras)) {
  const l = r.lista, f = r.ficha, c = r.criador;
  console.log(`\n${w} px · toque: ${l.ponteiroGrosso} · Voltar fica no site: ${r.voltarFicaNoSite}`);
  console.log(`  lista   JS ${l.jsKB} KB · alvos <36: ${l.alvosAbaixo36}/${l.alvos} · frases <12: ${l.frasesAbaixo12} · rótulos <11: ${l.rotulosAbaixo11} · título cortado: ${l.tituloCortado} · instalável: ${l.instalavel ?? "?"} · lateral: ${l.rolagemLateral}`);
  console.log(`  ficha   JS ${f.jsKB} KB · cabeçalho ${f.cabecalho}px (${f.cabecalhoPct}%) · número do recurso ${f.numeroDoRecursoPx}px · alvos <36: ${f.alvosAbaixo36}/${f.alvos} · frases <12: ${f.frasesAbaixo12} · lateral: ${f.rolagemLateral}`);
  console.log(`  criador Nome em ${c.nomeTopo}px · cabeçalho ${c.cabecalhoFixo}px · abas inteiras ${c.abasInteirasNaTela}/${c.abasTotal} · alvos <36: ${c.alvosAbaixo36}/${c.alvos} · frases <12: ${c.frasesAbaixo12} · rótulos <11: ${c.rotulosAbaixo11} · lateral: ${c.rolagemLateral}`);
  if (r.errosNoConsole.length) console.log(`  erros: ${r.errosNoConsole.join(" | ")}`);
}
console.log(`\nmanifesto e título por rota: ${JSON.stringify(resultado.rotas)}`);
console.log(`\ngravado em ${saida}`);
