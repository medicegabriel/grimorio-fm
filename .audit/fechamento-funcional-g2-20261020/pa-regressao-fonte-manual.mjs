/* CÓPIA de .audit/correcao-g2-i1-20261019/browser-fonte.mjs (G2-I1), só com a pasta de saída trocada, para conferir que o Registrar Manualmente de
   Fonte Externa continua igual depois dos Pacotes para Aliados (2026-10-19). A auditoria anterior não é sobrescrita. */
/* G2-I1 NO NAVEGADOR (2026-10-19): a Fonte Externa registrada na prévia do G2 tem de contar também na ficha clássica, na MESMA sessão.
   Chrome real (Playwright, channel chrome), contextos isolados, 1280x900, assets externos abortados. Uso: BASE=http://127.0.0.1:5320 node <este arquivo>
   Cada caso registra pela interface do G2 (a aba Efeitos), lê a Defesa do cabeçalho nas duas apresentações e compara com a conta esperada. Não usa `force`. */
import fs from "node:fs";
import { chromium } from "playwright";

const ROOT = process.cwd();
const DIR = `${ROOT}/.audit/fechamento-funcional-g2-20261020/regressao-pa/regressao-fonte-manual`;
const BASE = process.env.BASE ?? "http://127.0.0.1:5320";
const SAIDA = process.env.SAIDA ?? "browser-fonte.json";
const SO = process.env.SO?.split(",") ?? null; // "id:amostra,id:amostra": roda só estes casos
const amostras = JSON.parse(fs.readFileSync("C:/Projetos/Grimorio/prototipos/ficha-final-v2/dados/amostras.json", "utf8")).amostras;
const browser = await chromium.launch({ channel: "chrome" });
const out = { geradoEm: new Date().toISOString(), base: BASE, casos: [], falhas: [] };
const salva = () => fs.writeFileSync(`${DIR}/${SAIDA}`, JSON.stringify(out, null, 2));
const espera = (p) => p.waitForTimeout(700);
const check = (r, id, ok, dados) => { r.checks.push({ id, ok: !!ok, dados }); if (!ok) out.falhas.push({ caso: r.id, id, dados }); };
const rota = (f) => (f.rulesVersion === "player" ? "Player" : "Afty");
const chaveLista = (f) => `fm_creatures_${f.rulesVersion === "player" ? "player" : "afty"}_v1`;

async function abre(p, f, g2) {
  await p.goto(`${BASE}/${rota(f)}${g2 ? "?ficha-g2=1" : ""}`, { waitUntil: "domcontentloaded" });
  await p.getByText(f.name, { exact: true }).first().click();
  await p.locator("#afty-ficha").waitFor();
  await espera(p);
}
const sessao = (p, f) => p.evaluate((id) => JSON.parse(localStorage.getItem(`fm_ficha_sessao_afty_v1:${id}`)), f.id);
const defesa = async (p) => Number((await p.locator('[data-afty-stat="defesa"]').first().textContent()).replace(/[^\d-]/g, ""));
async function emCombate(p) { const fora = p.getByRole("button", { name: /Fora de Combate/ }); if (await fora.count()) await fora.click(); }

async function registra(p, { tipo = "feitico", nome, por, valor, rodadas, somar, origemId }) {
  await p.locator('[data-afty-aba="buffs"]').click();
  await p.getByRole("button", { name: /Adicionar/ }).first().click();
  await p.getByRole("tab", { name: "Fonte Externa", exact: true }).click();
  const form = p.getByRole("form", { name: "Registrar fonte externa" });
  if (tipo !== "feitico") await form.locator(`[data-tipo="${tipo}"]`).click();
  await form.locator('[data-campo="origem"]').fill(nome);
  if (origemId) await form.locator(`[data-origem-id="${origemId}"]`).click();
  if (por) await form.locator('[data-campo="por"]').fill(por);
  await form.locator('[data-campo="valor-0"]').fill(String(valor));
  if (rodadas) await form.locator('[data-campo="rodadas"]').fill(String(rodadas));
  if (somar) await form.locator('[data-campo="presumir"]').check();
  await form.getByRole("button", { name: "Registrar", exact: true }).click();
  await espera(p);
}

async function caso(id, amostra, roteiro) {
  if (SO && !SO.includes(`${id}:${amostra}`)) return;
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await ctx.newPage();
  p.setDefaultTimeout(10000);
  p.setDefaultNavigationTimeout(30000);
  await p.route("**/*", (rt) => { const u = new URL(rt.request().url()); return u.hostname === "127.0.0.1" || u.hostname === "localhost" ? rt.continue() : rt.abort(); });
  const f = { ...amostras.find((x) => x.id === amostra).ficha, id: `g2i1-${amostra}-${id}` };
  const r = { id, amostra, checks: [], erros: [] };
  out.casos.push(r);
  p.on("pageerror", (e) => r.erros.push(e.message));
  try {
    await p.goto(`${BASE}/${rota(f)}`, { waitUntil: "domcontentloaded" });
    await p.evaluate(({ chave, f }) => localStorage.setItem(chave, JSON.stringify([f])), { chave: chaveLista(f), f });
    await abre(p, f, true);
    await emCombate(p);
    await roteiro(p, r, f);
    check(r, "sem erro de página", !r.erros.length, r.erros);
  } catch (e) {
    r.excecao = e.stack;
    out.falhas.push({ caso: id, excecao: e.message });
    await p.screenshot({ path: `${DIR}/${id}-${amostra}-erro.png` }).catch(() => {});
  } finally {
    salva();
    await ctx.close();
    console.log(`${id} (${amostra}): ${r.checks.filter((x) => x.ok).length}/${r.checks.length}${r.excecao ? " EXCEÇÃO" : ""}`);
  }
}

/* A conta: a Defesa nas duas apresentações, antes e depois, e a mesma depois de recarregar e de voltar. */
async function confere(p, r, f, antes, esperado, rotulo) {
  const g2 = await defesa(p);
  check(r, `${rotulo}: G2 soma ${esperado}`, g2 - antes === esperado, { antes, g2 });
  await abre(p, f, false);
  const classica = await defesa(p);
  check(r, `${rotulo}: a clássica dá a MESMA Defesa do G2`, classica === g2, { g2, classica });
  await abre(p, f, false); // navegação nova: recarrega a página e reabre a ficha (a ficha aberta não vai na URL)
  check(r, `${rotulo}: recarregar a clássica mantém`, (await defesa(p)) === g2);
  await abre(p, f, true);
  check(r, `${rotulo}: voltar ao G2 mantém`, (await defesa(p)) === g2);
  return g2;
}

for (const amostra of ["minamoto", "player30", "calamidade"]) {
  await caso("feitico-mais7", amostra, async (p, r, f) => {
    const antes = await defesa(p);
    await registra(p, { nome: "Proteção de teste independente", valor: 7 });
    const salvo = await sessao(p, f);
    check(r, "o registro está na sessão uma vez, com benefício +7", salvo.buffs.filter((b) => b.rec && b.beneficios?.some((x) => x.canal === "defesa" && x.valor === 7)).length === 1, salvo.buffs);
    await p.screenshot({ path: `${DIR}/fonte-g2-${amostra}.png` });
    await confere(p, r, f, antes, 7, "Feitiço +7");
    await abre(p, f, false);
    await p.screenshot({ path: `${DIR}/fonte-classica-${amostra}.png` });
    const depois = await sessao(p, f);
    check(r, "o registro continua intacto na sessão depois de alternar e recarregar", JSON.stringify(depois.buffs) === JSON.stringify(salvo.buffs));
  });
}

await caso("outra-origem-somar", "minamoto", async (p, r, f) => {
  const antes = await defesa(p);
  await registra(p, { tipo: "catalogo", nome: "Bênção da mesa de teste", valor: 3, somar: true });
  await confere(p, r, f, antes, 3, "Outra Origem somando");
});

await caso("outra-origem-sem-somar", "minamoto", async (p, r, f) => {
  const antes = await defesa(p);
  await registra(p, { tipo: "catalogo", nome: "Bênção da mesa de teste", valor: 3, somar: false });
  await confere(p, r, f, antes, 0, "Outra Origem sem decidir somar");
});

await caso("catalogo-repetido", "minamoto", async (p, r, f) => {
  const antes = await defesa(p);
  await registra(p, { tipo: "catalogo", nome: "Aura do Basti", origemId: "aptidao:aura_do_bastiao", por: "Ana", valor: 2 });
  await registra(p, { tipo: "catalogo", nome: "Aura do Basti", origemId: "aptidao:aura_do_bastiao", por: "Rui", valor: 3 });
  const salvo = await sessao(p, f);
  check(r, "dois registros da mesma origem na sessão", salvo.buffs.filter((b) => b.rec && b.origemId === "aptidao:aura_do_bastiao").length === 2, salvo.buffs.map((b) => [b.origemId, b.aplicadoPor]));
  await confere(p, r, f, antes, 3, "mesma origem, +2 e +3: vale o maior");
});

await caso("feiticos-dois-aplicadores", "minamoto", async (p, r, f) => {
  const antes = await defesa(p);
  await registra(p, { nome: "Proteção", por: "Ana", valor: 7 });
  await registra(p, { nome: "Proteção", por: "Rui", valor: 7 });
  await confere(p, r, f, antes, 7, "Feitiço de dois aplicadores");
});

await caso("expiracao-por-rodada", "minamoto", async (p, r, f) => {
  const antes = await defesa(p);
  await registra(p, { nome: "Proteção curta", valor: 5, rodadas: 1 });
  check(r, "G2 soma 5 enquanto o prazo dura", (await defesa(p)) - antes === 5);
  await p.getByRole("button", { name: "Próxima rodada", exact: true }).click();
  await espera(p);
  const depois = await sessao(p, f);
  check(r, "o registro expira na virada e sai da sessão", !depois.buffs.some((b) => b.rec), depois.buffs);
  check(r, "G2 volta à Defesa de antes", (await defesa(p)) === antes);
  await abre(p, f, false);
  check(r, "a clássica também volta à Defesa de antes", (await defesa(p)) === antes);
});

await browser.close();
salva();
console.log(JSON.stringify({ casos: out.casos.length, checks: out.casos.reduce((a, r) => a + r.checks.length, 0), falhas: out.falhas }));
