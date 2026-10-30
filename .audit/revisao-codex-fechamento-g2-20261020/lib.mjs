/* FECHAMENTO FUNCIONAL DO G2: a biblioteca comum dos roteiros de navegador. Chrome real (Playwright, channel chrome), um contexto ISOLADO por cenário, fichas
   SINTÉTICAS de `fichas.json` (nada do autor), cliques reais sem `force`. Tudo que o roteiro grava fica FORA do projeto durante a execução (o servidor de
   desenvolvimento recarrega a página quando aparece arquivo novo no projeto) e é copiado no fim. */
import fs from "node:fs";
import os from "node:os";
import { chromium } from "playwright";

export const DIR = `${process.cwd()}/.audit/revisao-codex-fechamento-g2-20261020`;
export const BASE = process.env.BASE ?? "http://127.0.0.1:5320";
export const TAG = new URL(BASE).port;
export const TMP = fs.mkdtempSync(`${os.tmpdir()}/fechamento-g2-`);
export const { fichas, sessoes } = JSON.parse(fs.readFileSync(`${DIR}/fichas.json`, "utf8"));
export const CHAVES = { player: "fm_creatures_player_v1", afty: "fm_creatures_afty_v1" };

export const navegador = await chromium.launch({ channel: "chrome", args: process.env.COM_BARRA ? [] : [] });
export const saida = { geradoEm: new Date().toISOString(), base: BASE, etapas: [], falhas: [] };
export let etapa = null;
export const passo = (nome) => { etapa = { nome, checks: [], erros: [], observado: {} }; saida.etapas.push(etapa); return etapa; };
export const check = (id, ok, dados) => { etapa.checks.push({ id, ok: !!ok, ...(dados !== undefined ? { dados } : {}) }); if (!ok) { saida.falhas.push({ etapa: etapa.nome, id, dados }); console.log(`FALHOU [${etapa.nome}] ${id}`, JSON.stringify(dados)?.slice(0, 400)); } return !!ok; };
export const espera = (p, ms = 500) => p.waitForTimeout(ms);
export const foto = (p, nome) => p.screenshot({ path: `${TMP}/${TAG}-${nome}.png` });
export const texto = async (loc) => ((await loc.first().textContent().catch(() => "")) ?? "").replace(/\s+/g, " ").trim();
export const numero = (s) => Number(String(s ?? "").replace(/[^\d-]/g, ""));

/* Um contexto isolado: o `semente` é a lista de fichas que entra no armazenamento, e `sessoesIniciais` as sessões semeadas por id. */
export async function contexto({ lista, rota = "Player", largura = 1440, altura = 900, sessoesIniciais = {}, tema = null }) {
  const ctx = await navegador.newContext({ viewport: { width: largura, height: altura }, acceptDownloads: true });
  const p = await ctx.newPage();
  p.setDefaultTimeout(12000);
  p.on("pageerror", (e) => etapa?.erros.push(e.message));
  p.on("console", (m) => { if (m.type() === "error" && !/favicon|Failed to load resource/.test(m.text())) etapa?.erros.push(`console: ${m.text().slice(0, 200)}`); });
  await p.route("**/*", (rt) => { const u = new URL(rt.request().url()); return ["blob:", "data:"].includes(u.protocol) || u.hostname === "127.0.0.1" || u.hostname === "localhost" ? rt.continue() : rt.abort(); });
  await p.goto(`${BASE}/${rota}`, { waitUntil: "domcontentloaded" });
  const semente = lista.map((f) => (tema ? { ...f, aparencia: tema } : f));
  await p.evaluate(({ chave, lista, sessoes }) => {
    localStorage.setItem(chave, JSON.stringify(lista));
    for (const [id, s] of Object.entries(sessoes)) localStorage.setItem(`fm_ficha_sessao_afty_v1:${id}`, JSON.stringify(s));
  }, { chave: CHAVES[rota.toLowerCase()], lista: semente, sessoes: sessoesIniciais });
  return { ctx, p, rota: rota.toLowerCase() };
}
export async function abre(p, rota, nome, g2 = true) {
  await p.goto(`${BASE}/${rota[0].toUpperCase()}${rota.slice(1)}${g2 ? "?ficha-g2=1" : ""}`, { waitUntil: "domcontentloaded" });
  await p.getByText(nome, { exact: true }).first().click();
  await p.locator("#afty-ficha").waitFor();
  await espera(p, 700);
}
/* A sessão gravada (a Ficha grava por debounce de 600 ms): a leitura espera ela assentar. */
export const sessaoCrua = (p, id) => p.evaluate((id) => JSON.parse(localStorage.getItem(`fm_ficha_sessao_afty_v1:${id}`) ?? "null"), id);
export const sessao = async (p, id) => { await espera(p, 900); return sessaoCrua(p, id); };
export const fichaGravada = (p, rota, id) => p.evaluate(({ chave, id }) => JSON.parse(localStorage.getItem(chave)).find((c) => c.id === id), { chave: CHAVES[rota], id });
export const stat = async (p, id) => { const l = p.locator(`[data-afty-stat="${id}"]`).first(); return (await l.count()) ? numero(await l.textContent()) : null; };
export const efeitos = async (p) => { await p.locator('[data-afty-aba="buffs"]').click(); await espera(p, 300); };
export async function aosAtivos(p) { await efeitos(p); const v = p.getByRole("button", { name: "Ativos", exact: true }); if (await v.count()) { await v.first().click(); await espera(p, 300); } }
export async function adicionar(p) { await efeitos(p); if (!(await p.locator("[data-adicionar]").count())) { const v = p.getByRole("button", { name: "Ativos", exact: true }); if (await v.count()) await v.first().click(); } await p.locator("[data-adicionar]").first().click(); await espera(p, 300); }
export async function externa(p) { if (!(await p.locator("[data-aba-externa]").count())) await adicionar(p); await p.locator("[data-aba-externa]").click(); await espera(p, 250); }
export const emCombate = async (p) => { const fora = p.getByRole("button", { name: /Fora de Combate/ }); if (await fora.count()) { await fora.first().click(); await espera(p, 400); } };
export const foraDeCombate = async (p) => { const em = p.locator('button.e-combate[aria-pressed="true"]'); if (await em.count()) { await em.first().click(); await espera(p, 400); } };
export const virada = async (p) => { await p.getByRole("button", { name: "Próxima rodada", exact: true }).first().click(); await espera(p, 700); };
/* Quem está no topo do ponto: o clique de verdade só chega se o botão não estiver coberto. */
export const noTopo = (p, seletor) => p.evaluate((s) => { const el = document.querySelector(s); if (!el) return null; const r = el.getBoundingClientRect(); const x = r.left + r.width / 2; const y = r.top + r.height / 2; const topo = document.elementFromPoint(x, y); return { achou: true, ok: !!topo && (el === topo || el.contains(topo)), visivel: r.width > 0 && r.height > 0, dentro: y >= 0 && y <= innerHeight && x >= 0 && x <= innerWidth, tag: topo?.tagName, classe: String(topo?.className ?? "").slice(0, 60) }; }, seletor);
/* O estouro horizontal: a página e os contêineres do G2. */
export const estouro = (p) => p.evaluate(() => {
  const doc = document.documentElement;
  const raiz = document.querySelector("#afty-ficha");
  /* Quem está dentro de uma faixa que rola na horizontal (as abas, o trilho do catálogo) não vaza: a faixa recorta e o dedo rola. */
  const rolaNaHorizontal = (el) => { for (let a = el.parentElement; a && a !== document.documentElement; a = a.parentElement) { const ox = getComputedStyle(a).overflowX; if (["auto", "scroll", "hidden", "clip"].includes(ox) && a.getBoundingClientRect().right <= innerWidth + 1) return true; } return false; };
  const culpados = [...document.querySelectorAll("#afty-ficha *")].filter((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.right > innerWidth + 1 && getComputedStyle(el).position !== "fixed" && !rolaNaHorizontal(el); }).slice(0, 5).map((el) => `${el.tagName}.${String(el.className).slice(0, 40)}`);
  return { pagina: doc.scrollWidth - doc.clientWidth, raiz: raiz ? raiz.scrollWidth - raiz.clientWidth : null, culpados, largura: innerWidth };
});

export async function encerra() {
  saida.resumo = saida.etapas.map((x) => `${x.nome}: ${x.checks.filter((c) => c.ok).length}/${x.checks.length}${x.erros.length ? ` (erros de página: ${x.erros.length})` : ""}`);
  fs.writeFileSync(`${TMP}/${process.env.NOME ?? "roteiro"}-${TAG}.json`, JSON.stringify(saida, null, 2));
  for (const f of fs.readdirSync(TMP)) fs.copyFileSync(`${TMP}/${f}`, `${DIR}/${f}`);
  await navegador.close();
  console.log(JSON.stringify({ resumo: saida.resumo, falhas: saida.falhas }, null, 2));
}
