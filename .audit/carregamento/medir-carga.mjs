/* Bancada de carregamento (diagnóstico, 2026-11-26).
 *
 *   node medir-carga.mjs --base local|prod [--dist caminho] [--cenarios a:perfil,b:perfil] --runs 3 [--filme] [--headed]
 *
 * local: serve o build isolado com os cabeçalhos da Vercel (brotli, HTML com revalidação, /assets imutável).
 * prod:  https://fichafm.com.br, com o Vercel Analytics bloqueado para não contar visita.
 * Toda requisição ao Supabase é interceptada e respondida aqui (nada chega ao banco).
 */
import http from "node:http";
import { readFileSync, existsSync, statSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { dirname, extname, join, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import zlib from "node:zlib";
import crypto from "node:crypto";

const AQUI = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(AQUI, "..", "..");
const MEDICOES = join(AQUI, "medicoes");
const arg = (n, p) => { const i = process.argv.indexOf(`--${n}`); return i > 0 ? process.argv[i + 1] : p; };
const BASE_NOME = arg("base", "local");
const DIST = arg("dist") ? resolve(arg("dist")) : null;
const RUNS = Number(arg("runs", "3"));
const CENARIOS = arg("cenarios", "").split(",").filter(Boolean);
const FILME = process.argv.includes("--filme");
const HEADED = process.argv.includes("--headed");
const ROTULO = arg("rotulo", BASE_NOME);
if (!["local", "prod"].includes(BASE_NOME)) throw new Error("Use --base local ou --base prod.");
if (BASE_NOME === "local" && (!DIST || !existsSync(join(DIST, "index.html")))) {
  throw new Error("Passe --dist com a pasta do build isolado do Vite.");
}
if (!Number.isSafeInteger(RUNS) || RUNS < 1) throw new Error("Use --runs com um inteiro positivo.");
if (!/^[a-zA-Z0-9_-]+$/.test(ROTULO ?? "")) throw new Error("Rótulo inválido. Use letras, números, hífen e sublinhado.");

const pw = process.env.PW_PATH ?? "file:///C:/Users/gabri/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs";
const { chromium } = await import(pw.startsWith("file:") ? pw : pathToFileURL(resolve(pw)).href);

/* ---------------------------------------------------------------- servidor com cabeçalhos da Vercel */
const TIPOS = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml",
  ".png": "image/png", ".webp": "image/webp", ".json": "application/json", ".webmanifest": "application/manifest+json", ".pdf": "application/pdf" };
const cacheBr = new Map();
function servir(req, res) {
  const url = new URL(req.url, "http://x");
  const caminho = decodeURIComponent(url.pathname);
  let arquivo = join(DIST, caminho);
  if (arquivo !== DIST && !arquivo.startsWith(DIST + sep)) { res.writeHead(403); return res.end(); }
  const ehAsset = caminho.startsWith("/assets/");
  if (!existsSync(arquivo) || statSync(arquivo).isDirectory()) {
    if (ehAsset) { res.writeHead(404); return res.end(); }
    arquivo = join(DIST, "index.html");
  }
  const ext = extname(arquivo);
  const corpo = readFileSync(arquivo);
  const etag = '"' + crypto.createHash("md5").update(corpo).digest("hex") + '"';
  const cabecalhos = { "Content-Type": TIPOS[ext] ?? "application/octet-stream", ETag: etag,
    "Cache-Control": ehAsset ? "public, max-age=31536000, immutable" : "public, max-age=0, must-revalidate" };
  if (req.headers["if-none-match"] === etag) { res.writeHead(304, cabecalhos); return res.end(); }
  const comprime = /\.(html|js|css|svg|json|webmanifest)$/.test(arquivo) && /br/.test(req.headers["accept-encoding"] ?? "");
  let saida = corpo;
  if (comprime) {
    saida = cacheBr.get(arquivo) ?? zlib.brotliCompressSync(corpo, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 9 } });
    cacheBr.set(arquivo, saida);
    cabecalhos["Content-Encoding"] = "br";
  }
  cabecalhos["Content-Length"] = saida.length;
  res.writeHead(200, cabecalhos);
  res.end(saida);
}
let BASE = "https://fichafm.com.br";

/* ---------------------------------------------------------------- fichas e sessão falsa */
const env = Object.fromEntries(readFileSync(join(REPO, ".env.local"), "utf8").split(/\r?\n/).filter((l) => l.includes("="))
  .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]));
const supabaseURL = new URL(process.env.VITE_SUPABASE_URL ?? env.VITE_SUPABASE_URL);
const REF = supabaseURL.hostname.split(".")[0];
const ehSupabase = (hostname) => hostname === supabaseURL.hostname || hostname.endsWith(".supabase.co");
const gojo = (() => { const j = JSON.parse(readFileSync(join(REPO, "previas/satoru-gojo-player.json"), "utf8")); return Array.isArray(j) ? j[0] : j.creatures?.[0] ?? j; })();
/* Sem retrato de internet: o avatar externo do Gojo sairia do Pinterest e mediria a rede de outra pessoa. */
/* Acima de 60 fichas a cópia sai sem `aparencia` (25 mil caracteres de tema), senão 100 fichas passam da cota de 5 MB do
   localStorage e a semeadura falha calada. O card da lista não lê a aparência. */
const fichasJogador = (n) => Array.from({ length: n }, (_, i) => {
  const ficha = { ...gojo, id: `medir_${i}`, name: `Ficha Medida ${i + 1}`, folderId: null, imageUrl: "" };
  if (n > 60) delete ficha.aparencia;
  return ficha;
});
const sessaoFalsa = () => ({ access_token: "falso", token_type: "bearer", expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600,
  refresh_token: "falso", user: { id: "00000000-0000-0000-0000-000000000001", aud: "authenticated", role: "authenticated", email: "medida@exemplo.invalid",
    app_metadata: { provider: "google" }, user_metadata: { name: "Medida" } } });

/* ---------------------------------------------------------------- o que roda dentro da página */
function sonda(observar) {
  const m = (window.__m = { marcas: {}, cls: 0, deslocamentos: [], lcp: null, lcps: [], tarefas: [], carregandoVisto: null, carregandoSaiu: null, rootVazioAte: null });
  const descrever = (el) => {
    if (!el || !el.tagName) return null;
    const cls = typeof el.className === "string" ? el.className.split(/\s+/).slice(0, 3).join(".") : "";
    return `${el.tagName.toLowerCase()}${el.id ? "#" + el.id : ""}${cls ? "." + cls : ""} "${(el.textContent || "").trim().slice(0, 40)}"`;
  };
  try {
    new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) {
      m.cls += e.value; m.deslocamentos.push({ t: Math.round(e.startTime), v: +e.value.toFixed(4), fontes: (e.sources || []).map((s) => descrever(s.node)) });
    } }).observe({ type: "layout-shift", buffered: true });
    new PerformanceObserver((l) => { for (const e of l.getEntries()) {
      m.lcp = { t: Math.round(e.startTime), tam: e.size, el: descrever(e.element), url: e.url || null };
      m.lcps.push(m.lcp);
    } }).observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver((l) => { for (const e of l.getEntries()) m.tarefas.push({ t: Math.round(e.startTime), d: Math.round(e.duration) }); })
      .observe({ type: "longtask", buffered: true });
  } catch { /* sem observador */ }
  const checar = () => {
    for (const [nome, js] of Object.entries(observar)) {
      if (m.marcas[nome] != null) continue;
      try { if (new Function(`return (${js})`)()) m.marcas[nome] = Math.round(performance.now()); } catch { /* ainda não */ }
    }
    const raiz = document.getElementById("root");
    if (raiz && raiz.childElementCount > 0 && m.rootVazioAte == null) m.rootVazioAte = Math.round(performance.now());
    const carregando = [...document.querySelectorAll('[role="status"]')].some((e) => /Carregando/.test(e.textContent));
    if (carregando && m.carregandoVisto == null) m.carregandoVisto = Math.round(performance.now());
    if (!carregando && m.carregandoVisto != null && m.carregandoSaiu == null) m.carregandoSaiu = Math.round(performance.now());
    if (carregando) m.carregandoSaiu = null;
  };
  new MutationObserver(checar).observe(document, { childList: true, subtree: true, characterData: true, attributes: true });
  const pintura = () => { checar(); requestAnimationFrame(pintura); };
  requestAnimationFrame(pintura);
}

const OBS = {
  centralConteudo: `document.querySelectorAll('.central-atalho').length >= 3 && document.querySelector('#codigo-da-sala')`,
  barraLateral: `document.querySelector('.barra-lateral-site nav a')`,
  dashTitulo: `[...document.querySelectorAll('header h1')].some(h => /Jogador|Criatura/.test(h.textContent))`,
  dashCards3: `document.querySelectorAll('[role=button] .w-14.h-14').length >= 3 || [...document.querySelectorAll('h2')].some(h => /Todas as Criaturas/.test(h.textContent))`,
  dashNova: `[...document.querySelectorAll('header button')].some(b => /Nov|Criar/.test(b.title || ''))`,
  fichaAberta: `document.querySelector('#afty-ficha [role=tablist]')`,
  telaVaziaAposToque: `window.__toque != null && !document.querySelector('[role=button] .w-14.h-14') && !document.querySelector('#afty-ficha') && !/Carregando/.test(document.body.innerText)`,
};

/* ---------------------------------------------------------------- perfis */
const PERFIS = {
  desktop: { viewport: { width: 1366, height: 768 }, rede: null, cpu: 1 },
  /* O "Slow 4G" do Lighthouse para celular: 150 ms de RTT, 1,6 Mbit/s de descida, 750 kbit/s de subida, CPU 4x. */
  celular: { viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2,
    userAgent: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36",
    rede: { latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 }, cpu: 4 },
};

async function novoContexto(navegador, perfil, { fichas = 0, logado = false, nuvem = { ms: 0 }, esquema = "light", bloquear = null } = {}) {
  const p = PERFIS[perfil];
  const ctx = await navegador.newContext({ viewport: p.viewport, isMobile: p.isMobile, hasTouch: p.hasTouch,
    deviceScaleFactor: p.deviceScaleFactor, userAgent: p.userAgent, colorScheme: esquema, serviceWorkers: "block" });
  ctx.__pedidosNuvem = [];
  ctx.__nuvem = nuvem;
  ctx.__bloquear = bloquear;
  await ctx.addInitScript(({ fichas, sessao, chaveSessao }) => {
    if (localStorage.getItem("__semeado")) return;
    localStorage.setItem("__semeado", "1");
    if (fichas) localStorage.setItem("fm_creatures_player_v1", JSON.stringify(fichas));
    if (sessao) localStorage.setItem(chaveSessao, JSON.stringify(sessao));
  }, { fichas: fichas ? fichasJogador(fichas) : null, sessao: logado ? sessaoFalsa() : null, chaveSessao: `sb-${REF}-auth-token` });
  await ctx.addInitScript(sonda, OBS);
  return ctx;
}

async function aplicarLimites(pagina, perfil, { limitar = true, cacheFrio = false } = {}) {
  const p = PERFIS[perfil];
  const ctx = pagina.context();
  const cdp = await ctx.newCDPSession(pagina);
  await cdp.send("Network.enable");
  if (cacheFrio) await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
  /* Fetch.enable preserva o cache HTTP. context.route o desliga e deixaria os cenários quentes frios sem aviso. */
  /* Toda requisição ao Supabase é respondida no navegador, pois .env.local aponta para o banco de produção.
     O Vercel Analytics é bloqueado para a bancada não contar como visita. */
  const padroes = [{ urlPattern: "*://*.supabase.co/*" }, { urlPattern: `${supabaseURL.origin}/*` },
    { urlPattern: "*/_vercel/*" }, { urlPattern: "*://va.vercel-scripts.com/*" }];
  if (ctx.__bloquear) padroes.push({ urlPattern: ctx.__bloquear });
  cdp.on("Fetch.requestPaused", async (e) => {
    const { requestId, request } = e;
    try {
      if (!ehSupabase(new URL(request.url).hostname)) {
        // `criaturaFalha`: depois que a "rede volta", o que estava bloqueado passa.
        if (ctx.__liberado && !/_vercel|vercel-scripts/.test(request.url)) { await cdp.send("Fetch.continueRequest", { requestId }); return; }
        await cdp.send("Fetch.failRequest", { requestId, errorReason: "BlockedByClient" }); return;
      }
      const origem = request.headers.Origin ?? request.headers.origin ?? "*";
      const cors = [{ name: "access-control-allow-origin", value: origem }, { name: "access-control-allow-headers", value: "*" },
        { name: "access-control-allow-methods", value: "GET,POST,PATCH,PUT,DELETE,OPTIONS" }, { name: "access-control-expose-headers", value: "content-range" }];
      if (request.method === "OPTIONS") { await cdp.send("Fetch.fulfillRequest", { requestId, responseCode: 204, responseHeaders: cors }); return; }
      ctx.__pedidosNuvem.push({ metodo: request.method, url: request.url.replace(/^https:\/\/[^/]+/, "").slice(0, 70), bytes: (request.postData ?? "").length });
      await new Promise((ok) => setTimeout(ok, ctx.__nuvem?.ms ?? 0));
      await cdp.send("Fetch.fulfillRequest", { requestId, responseCode: request.method === "GET" ? 200 : 201,
        responseHeaders: [...cors, { name: "content-type", value: "application/json" }, { name: "content-range", value: "0-0/0" }],
        body: Buffer.from("[]").toString("base64") });
    } catch { /* a página fechou */ }
  });
  await cdp.send("Fetch.enable", { patterns: padroes });
  if (!limitar) return cdp;
  if (p.rede) await cdp.send("Network.emulateNetworkConditions", { offline: false, ...p.rede });
  if (p.cpu > 1) await cdp.send("Emulation.setCPUThrottlingRate", { rate: p.cpu });
  return cdp;
}

async function filme(cdp, pasta, largura) {
  const quadros = [];
  cdp.on("Page.screencastFrame", async (f) => {
    quadros.push({ ts: f.metadata.timestamp * 1000, data: f.data });
    try { await cdp.send("Page.screencastFrameAck", { sessionId: f.sessionId }); } catch { /* fechou */ }
  });
  await cdp.send("Page.startScreencast", { format: "jpeg", quality: 50, maxWidth: largura, maxHeight: 900, everyNthFrame: 1 });
  return async (origem) => {
    await cdp.send("Page.stopScreencast").catch(() => {});
    rmSync(pasta, { recursive: true, force: true });
    mkdirSync(pasta, { recursive: true });
    const lista = quadros.map((q) => ({ t: Math.round(q.ts - origem), data: q.data }));
    for (const q of lista) writeFileSync(join(pasta, `q-${String(Math.max(0, q.t)).padStart(5, "0")}.jpg`), Buffer.from(q.data, "base64"));
    return lista.map((q) => q.t);
  };
}

async function coletar(pagina) {
  return pagina.evaluate(() => {
    const nav = performance.getEntriesByType("navigation")[0];
    const pinturas = Object.fromEntries(performance.getEntriesByType("paint").map((p) => [p.name, Math.round(p.startTime)]));
    const recursos = performance.getEntriesByType("resource").map((r) => ({
      nome: r.name.replace(location.origin, "").replace(/^https:\/\/[^/]+\.supabase\.co/, "[supabase]"),
      tipo: r.initiatorType, ini: Math.round(r.startTime), fim: Math.round(r.responseEnd),
      transf: r.transferSize, corpo: r.decodedBodySize,
    }));
    const caixa = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; };
    const cards = [...document.querySelectorAll("[role=button]")].filter((b) => b.querySelector(".w-14.h-14")).slice(0, 3);
    const caixas = {
      cabecalho: caixa(document.querySelector("header")),
      barraLateral: caixa(document.querySelector(".barra-lateral-site")),
      pastas: caixa(document.querySelector("header + div > .hidden.lg\\:block, .lg\\:grid-cols-\\[260px_1fr\\] > div")),
      cards: cards.map(caixa),
      tituloLista: caixa([...document.querySelectorAll("h2")].find((h) => /Todos|Criaturas|Personagens/.test(h.textContent))),
    };
    return { origem: performance.timeOrigin, ttfb: Math.round(nav.responseStart), docFim: Math.round(nav.responseEnd),
      dcl: Math.round(nav.domContentLoadedEventEnd), load: Math.round(nav.loadEventEnd), pinturas, recursos, caixas, ...window.__m,
      cls: +window.__m.cls.toFixed(4), ultimaTarefa: window.__m.tarefas.reduce((a, t) => Math.max(a, t.t + t.d), 0),
      tbt: window.__m.tarefas.reduce((a, t) => a + Math.max(0, t.d - 50), 0),
      htmlFundo: getComputedStyle(document.documentElement).backgroundColor, bodyFundo: getComputedStyle(document.body).backgroundColor };
  });
}

/* Espera a marca principal (com teto longo), depois uma cauda para o CLS e o LCP fecharem. */
async function esperarMarca(pagina, marca, { teto = 30000, cauda = 1500 } = {}) {
  let faltou = false;
  if (marca) {
    try { await pagina.waitForFunction((n) => window.__m?.marcas?.[n] != null, marca, { timeout: teto }); }
    catch { faltou = true; }
  } else {
    await pagina.waitForLoadState("load").catch(() => {});
  }
  await pagina.waitForTimeout(cauda);
  return faltou;
}

async function medirCarga(ctx, perfil, url, { marca, nome, cauda, teto, cacheFrio } = {}) {
  const pg = await ctx.newPage();
  const cdp = await aplicarLimites(pg, perfil, { cacheFrio });
  const parar = FILME ? await filme(cdp, join(AQUI, "filme", `${nome}-${perfil}`), PERFIS[perfil].viewport.width) : null;
  await pg.goto(url, { waitUntil: "commit" });
  const faltou = await esperarMarca(pg, marca, { teto, cauda: cauda ?? (perfil === "celular" ? 2500 : 1500) });
  const r = await coletar(pg);
  r.faltouMarca = faltou;
  if (parar) r.quadros = await parar(r.origem);
  return { pg, r };
}

/* ---------------------------------------------------------------- cenários */
const C = {
  /* Primeiro acesso ao / com cache frio. */
  async centralFrio(nav, perfil, o = {}) {
    const ctx = await novoContexto(nav, perfil, o);
    const { r } = await medirCarga(ctx, perfil, BASE + "/", { marca: "centralConteudo", nome: "centralFrio" + (o.esquema === "dark" ? "Escuro" : "") });
    await ctx.close();
    return r;
  },
  async centralFrioEscuro(nav, perfil) { return C.centralFrio(nav, perfil, { esquema: "dark" }); },
  /* Volta ao / com o cache aquecido. */
  async centralQuente(nav, perfil) {
    const ctx = await novoContexto(nav, perfil);
    const a = await ctx.newPage();
    await aplicarLimites(a, perfil, { limitar: false });
    await a.goto(BASE + "/", { waitUntil: "load" });
    await a.waitForTimeout(1500);
    await a.close();
    const { r } = await medirCarga(ctx, perfil, BASE + "/", { marca: "centralConteudo", nome: "centralQuente" });
    await ctx.close();
    return r;
  },
  /* Do / pelo atalho Jogador até a lista (12 fichas). É um <a href>: a página inteira recarrega. */
  async navJogador(nav, perfil) {
    const ctx = await novoContexto(nav, perfil, { fichas: 12 });
    const pg = await ctx.newPage();
    await aplicarLimites(pg, perfil);
    await pg.goto(BASE + "/", { waitUntil: "load" });
    await pg.waitForSelector(".central-atalho");
    await pg.waitForTimeout(1500);
    const antes = Date.now();
    await Promise.all([pg.waitForURL(/\/Jogador/), pg.click('.central-atalho[href="/Jogador"]')]);
    const faltou = await esperarMarca(pg, "dashCards3", { cauda: perfil === "celular" ? 2500 : 1500 });
    const r = await coletar(pg);
    r.faltouMarca = faltou;
    r.cliqueAteOrigem = Math.round(r.origem - antes);
    await ctx.close();
    return r;
  },
  /* /Jogador direto, frio, 12 fichas no aparelho. */
  async jogadorFrio(nav, perfil, o = {}) {
    const ctx = await novoContexto(nav, perfil, { fichas: 12, ...o });
    const { r } = await medirCarga(ctx, perfil, BASE + "/Jogador", { marca: "dashCards3", nome: "jogadorFrio" + (o.esquema === "dark" ? "Escuro" : "") });
    await ctx.close();
    return r;
  },
  async jogadorFrioEscuro(nav, perfil) { return C.jogadorFrio(nav, perfil, { esquema: "dark" }); },
  /* /Jogador numa segunda visita (App-* e as telas já em cache). */
  async jogadorQuente(nav, perfil) {
    const ctx = await novoContexto(nav, perfil, { fichas: 12 });
    const a = await ctx.newPage();
    await aplicarLimites(a, perfil, { limitar: false });
    await a.goto(BASE + "/Jogador", { waitUntil: "load" });
    await a.waitForFunction(() => window.__m?.marcas?.dashCards3 != null, null, { timeout: 30000 });
    await a.waitForTimeout(1000);
    await a.close();
    const { r } = await medirCarga(ctx, perfil, BASE + "/Jogador", { marca: "dashCards3", nome: "jogadorQuente" });
    await ctx.close();
    return r;
  },
  /* Quem VOLTA com conta: a primeira carga sobe as 12 fichas (fora da medida), a segunda é medida com a nuvem a `ms` por pedido. */
  async logado(nav, perfil, ms, cacheFrio = false) {
    const nuvem = { ms: 30 };
    const ctx = await novoContexto(nav, perfil, { fichas: 12, logado: true, nuvem });
    const a = await ctx.newPage();
    await aplicarLimites(a, perfil, { limitar: false });
    await a.goto(BASE + "/Jogador", { waitUntil: "load" });
    await a.waitForFunction(() => window.__m?.marcas?.dashCards3 != null, null, { timeout: 30000 });
    await a.waitForTimeout(6000);
    const primeira = ctx.__pedidosNuvem.length;
    const retrato = await a.evaluate(() => Object.keys(localStorage).filter((k) => /nuvem|retrato/i.test(k)));
    await a.close();
    nuvem.ms = ms;
    ctx.__pedidosNuvem.length = 0;
    const { r } = await medirCarga(ctx, perfil, BASE + "/Jogador", {
      marca: "dashCards3", nome: `logado${cacheFrio ? "Frio" : ""}${ms}`, cauda: 3000, cacheFrio,
    });
    r.pedidosNuvemPrimeira = primeira;
    r.pedidosNuvem = [...ctx.__pedidosNuvem];
    r.chavesRetrato = retrato;
    await ctx.close();
    return r;
  },
  async logado150(nav, perfil) { return C.logado(nav, perfil, 150); },
  async logado2000(nav, perfil) { return C.logado(nav, perfil, 2000); },
  async logadoFrio150(nav, perfil) { return C.logado(nav, perfil, 150, true); },
  async logadoFrio2000(nav, perfil) { return C.logado(nav, perfil, 2000, true); },
  /* /Criatura direto, frio (a lista espera o compêndio). */
  async criaturaFrio(nav, perfil) {
    const ctx = await novoContexto(nav, perfil);
    const { r } = await medirCarga(ctx, perfil, BASE + "/Criatura", { marca: "dashCards3", nome: "criaturaFrio" });
    await ctx.close();
    return r;
  },
  /* A AÇÃO PRINCIPAL: tocar no primeiro card e esperar a Ficha. A lista carrega, espera `folga` ms (o ocioso de quem tem conta
     baixa o motor nesse tempo), e o toque é medido no mesmo documento (a troca de tela é pela pilha, sem navegação). */
  async abrirFicha(nav, perfil, { logado = false, quente = false, folga = 6000, nome = "ficha" } = {}) {
    const ctx = await novoContexto(nav, perfil, { fichas: 12, logado, nuvem: { ms: 150 } });
    if (quente) {
      const a = await ctx.newPage();
      await aplicarLimites(a, perfil, { limitar: false });
      await a.goto(BASE + "/Jogador", { waitUntil: "load" });
      await a.waitForFunction(() => window.__m?.marcas?.dashCards3 != null, null, { timeout: 30000 });
      await a.click("[role=button] h3");
      await a.waitForFunction(() => window.__m?.marcas?.fichaAberta != null, null, { timeout: 30000 });
      await a.waitForTimeout(1500);
      await a.close();
    }
    const pg = await ctx.newPage();
    const cdp = await aplicarLimites(pg, perfil);
    await pg.goto(BASE + "/Jogador", { waitUntil: "commit" });
    await esperarMarca(pg, "dashCards3", { cauda: folga });
    /* O filme da Ficha começa no toque: o nome de cada quadro é o tempo depois dele. */
    const parar = FILME ? await filme(cdp, join(AQUI, "filme", `${nome}-${perfil}`), PERFIS[perfil].viewport.width) : null;
    await pg.evaluate(() => { window.__toque = Math.round(performance.now()); });
    await pg.click("[role=button] h3");
    const faltou = await esperarMarca(pg, "fichaAberta", { cauda: 1500 });
    const r = await coletar(pg);
    r.faltouMarca = faltou;
    r.toque = await pg.evaluate(() => window.__toque);
    if (parar) r.quadros = await parar(r.origem + r.toque);
    r.toqueAteFicha = r.marcas.fichaAberta != null ? r.marcas.fichaAberta - r.toque : null;
    r.tarefasAposToque = r.tarefas.filter((t) => t.t >= r.toque);
    r.recursosAposToque = r.recursos.filter((x) => x.ini >= r.toque).map((x) => `${x.nome.split("/").pop().slice(0, 30)} ${Math.round(x.transf / 1024)}k ${x.ini - r.toque}..${x.fim - r.toque}`);
    await ctx.close();
    return r;
  },
  async fichaFrio(nav, perfil) { return C.abrirFicha(nav, perfil, { nome: "fichaFrio" }); },
  async fichaQuente(nav, perfil) { return C.abrirFicha(nav, perfil, { quente: true, folga: 1500, nome: "fichaQuente" }); },
  async fichaLogadoFrio(nav, perfil) { return C.abrirFicha(nav, perfil, { logado: true, nome: "fichaLogadoFrio" }); },
  async fichaJaNaLista(nav, perfil) { return C.abrirFicha(nav, perfil, { folga: 300, nome: "fichaJaNaLista" }); },
  /* Gravação de Performance (CDP Profiler) da lista com N fichas, cache quente. */
  async perfilLista(nav, perfil) {
    const ctx = await novoContexto(nav, perfil, { fichas: Number(process.env.FICHAS ?? 60) });
    const a = await ctx.newPage();
    await aplicarLimites(a, perfil, { limitar: false });
    await a.goto(BASE + "/Jogador", { waitUntil: "load" });
    await a.waitForFunction(() => window.__m?.marcas?.dashCards3 != null, null, { timeout: 30000 });
    await a.waitForTimeout(1000);
    await a.close();
    const pg = await ctx.newPage();
    const cdp = await aplicarLimites(pg, perfil);
    await cdp.send("Profiler.enable");
    await cdp.send("Profiler.setSamplingInterval", { interval: 200 });
    await cdp.send("Profiler.start");
    await pg.goto(BASE + "/Jogador", { waitUntil: "commit" });
    await esperarMarca(pg, "dashCards3", { cauda: 1500 });
    const { profile } = await cdp.send("Profiler.stop");
    const r = await coletar(pg);
    const dt = {};
    profile.timeDeltas.forEach((d, i) => { const id = profile.samples[i]; dt[id] = (dt[id] ?? 0) + d; });
    const porUrl = {}; const porFuncao = {};
    for (const n of profile.nodes) {
      const us = dt[n.id] ?? 0; if (!us) continue;
      const cf = n.callFrame; const arq = (cf.url || "(nativo)").split("/").pop().replace(/-[A-Za-z0-9_]{8}\.js$/, ".js");
      porUrl[arq] = (porUrl[arq] ?? 0) + us;
      const k = `${cf.functionName || "(anônima)"} @ ${arq}:${cf.lineNumber}`;
      porFuncao[k] = (porFuncao[k] ?? 0) + us;
    }
    const top = (o, n) => Object.entries(o).sort((x, y) => y[1] - x[1]).slice(0, n).map(([k, v]) => `${Math.round(v / 1000)}ms ${k}`);
    r.perfilPorArquivo = top(porUrl, 14);
    r.perfilPorFuncao = top(porFuncao, 20);
    await ctx.close();
    return r;
  },
  /* O compêndio não chega (rede caiu, deploy novo): o que a pessoa vê depois de 10 s. Se o botão Tentar de Novo estiver lá, a
     rede volta e o toque nele precisa trazer a lista, com um pedido novo. */
  async criaturaFalha(nav, perfil) {
    const ctx = await novoContexto(nav, perfil, { bloquear: "**/assets/fm-compendium-*.js" });
    const { pg, r } = await medirCarga(ctx, perfil, BASE + "/Criatura", { marca: "dashCards3", nome: "criaturaFalha", cauda: 0, teto: 10000 });
    const restante = await pg.evaluate(() => Math.max(0, 10000 - performance.now()));
    await pg.waitForTimeout(restante);
    r.depoisDe10s = await pg.evaluate(() => ({ texto: document.body.innerText.slice(0, 200), botoes: [...document.querySelectorAll("button")].map((b) => b.textContent.trim()).slice(0, 10) }));
    const tentar = pg.getByRole("button", { name: "Tentar de Novo" });
    r.botaoDeTentar = await tentar.count() > 0;
    if (r.botaoDeTentar) {
      const pedidos = () => pg.evaluate(() => performance.getEntriesByType("resource").filter((x) => /fm-compendium-/.test(x.name)).length);
      r.pedidosDoCompendioAntes = await pedidos();
      ctx.__liberado = true;
      const toque = await pg.evaluate(() => Math.round(performance.now()));
      await tentar.click();
      try {
        await pg.waitForFunction(() => window.__m?.marcas?.dashCards3 != null || [...document.querySelectorAll("main h2")].some((h) => /Todas as Criaturas/.test(h.textContent)), null, { timeout: 30000 });
        r.tentarAteLista = await pg.evaluate((t) => Math.round(performance.now()) - t, toque);
      } catch { r.tentarAteLista = null; }
      r.pedidosDoCompendioDepois = await pedidos();
    }
    await ctx.close();
    return r;
  },
};

/* ---------------------------------------------------------------- execução */
const lista = CENARIOS.length ? CENARIOS : ["centralFrio:desktop", "centralQuente:desktop", "navJogador:desktop", "jogadorFrio:desktop", "jogadorQuente:desktop",
  "centralFrio:celular", "centralQuente:celular", "navJogador:celular", "jogadorFrio:celular", "jogadorQuente:celular",
  "logado150:celular", "logado2000:celular", "logadoFrio150:celular", "logadoFrio2000:celular", "criaturaFrio:desktop", "criaturaFrio:celular",
  "fichaFrio:celular", "fichaQuente:celular", "fichaLogadoFrio:celular", "fichaJaNaLista:celular", "perfilLista:celular", "criaturaFalha:celular",
  "centralFrioEscuro:celular", "jogadorFrioEscuro:celular"];
for (const item of lista) {
  const [nome, perfil, extra] = item.split(":");
  if (!Object.hasOwn(C, nome) || ["logado", "abrirFicha"].includes(nome) || !Object.hasOwn(PERFIS, perfil) || extra !== undefined) {
    throw new Error(`Cenário inválido: ${item}. Use nome:desktop ou nome:celular.`);
  }
}
const servidor = BASE_NOME === "local" ? http.createServer(servir) : null;
if (servidor) {
  await new Promise((ok, falhar) => {
    servidor.once("error", falhar);
    servidor.listen(0, "127.0.0.1", ok);
  });
  BASE = `http://localhost:${servidor.address().port}`;
}
const navegador = await chromium.launch({ channel: "chrome", headless: !HEADED,
  // Barreira adicional para conexões fora do Fetch, como WebSockets.
  args: [`--host-resolver-rules=MAP *.supabase.co ~NOTFOUND, MAP ${supabaseURL.hostname} ~NOTFOUND`],
}).catch((erro) => { servidor?.close(); throw erro; });
/* Uma navegação de aquecimento: a primeira página de um navegador recém-aberto paga a partida dele. */
{
  const ctx = await novoContexto(navegador, "desktop");
  const pg = await ctx.newPage();
  await aplicarLimites(pg, "desktop", { limitar: false });
  await pg.goto(BASE + "/privacidade.html").catch(() => {});
  await ctx.close();
}
const saida = { condicoes: { chrome: navegador.version(), headless: !HEADED, base: BASE, perfis: PERFIS, data: new Date().toISOString() } };
const med = (ok, f) => { const v = ok.map(f).filter((x) => x != null).sort((a, b) => a - b); return v.length ? v[Math.floor(v.length / 2)] : null; };
for (const item of lista) {
  const [nome, perfil] = item.split(":");
  saida[item] = [];
  for (let i = 0; i < RUNS; i++) {
    try { saida[item].push(await C[nome](navegador, perfil)); }
    catch (e) {
      saida[item].push({ erro: String(e.message ?? e).slice(0, 300) });
      await Promise.all(navegador.contexts().map((ctx) => ctx.close()));
    }
  }
  const ok = saida[item].filter((r) => !r.erro);
  const marcas = Object.keys(OBS).map((k) => `${k}=${med(ok, (r) => r.marcas?.[k])}${ok.some((r) => r.marcas?.[k] == null) ? `(faltou ${ok.filter((r) => r.marcas?.[k] == null).length})` : ""}`);
  console.log(`${item.padEnd(22)} ttfb=${med(ok, (r) => r.ttfb)} fcp=${med(ok, (r) => r.pinturas?.["first-contentful-paint"])} lcp=${med(ok, (r) => r.lcp?.t)} cls=${med(ok, (r) => r.cls)}`
    + ` root=${med(ok, (r) => r.rootVazioAte)} carregando=${med(ok, (r) => r.carregandoVisto)}..${med(ok, (r) => r.carregandoSaiu)} ${marcas.join(" ")}`
    + ` ultimaTarefa=${med(ok, (r) => r.ultimaTarefa)} tbt=${med(ok, (r) => r.tbt)}`
    + (ok[0]?.cliqueAteOrigem != null ? ` clique->doc=${med(ok, (r) => r.cliqueAteOrigem)}` : "")
    + (ok[0] && "botaoDeTentar" in ok[0] ? ` BOTAO=${ok.filter((r) => r.botaoDeTentar).length}/${ok.length} TENTAR->LISTA=${med(ok, (r) => r.tentarAteLista)} pedidosCompendio=${med(ok, (r) => r.pedidosDoCompendioAntes)}->${med(ok, (r) => r.pedidosDoCompendioDepois)}` : "")
    + (ok[0] && "toqueAteFicha" in ok[0] ? ` TOQUE->FICHA=${med(ok, (r) => r.toqueAteFicha)} vazia=${med(ok, (r) => r.marcas.telaVaziaAposToque != null ? r.marcas.telaVaziaAposToque - r.toque : null)}` : "")
    + ` pedidos=${med(ok, (r) => r.recursos?.length)} kb=${med(ok, (r) => Math.round(r.recursos.reduce((a, x) => a + (x.transf || 0), 0) / 1024))}`
    + ` erros=${saida[item].length - ok.length}${ok.some((r) => r.faltouMarca) ? " FALTOU-MARCA" : ""}`);
}
await navegador.close();
servidor?.close();
mkdirSync(MEDICOES, { recursive: true });
writeFileSync(join(MEDICOES, `${ROTULO}.json`), JSON.stringify(saida, null, 1) + "\n");
