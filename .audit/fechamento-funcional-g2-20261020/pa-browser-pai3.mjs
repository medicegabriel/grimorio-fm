/* PA-I3 NO NAVEGADOR: cada benefício termina no próprio prazo. Chrome real (Playwright, channel chrome), suporte e aliado em contextos ISOLADOS,
   arquivo realmente exportado pelo suporte e importado pelo aliado, cliques reais sem `force`, em 1024 e 1440.

   O caso do Codex: Feitiço de Múltiplos Efeitos Imediato de Reação com Defesa (por um golpe) e TR de Reflexos (uma rodada). Confere no G2 e na
   clássica as duas ordens de término (a virada primeiro, o ataque primeiro), as viradas, a recarga, o Encerrar do Feitiço inteiro, o Reativar, a
   Linha do Tempo e o descanso. O Feitiço só de um ataque (PA-I2) vai junto como regressão.
   Auxiliares e fichas do roteiro da correção (`../pacotes-aliados-correcao-20261020/`). Nenhuma ficha do autor. Tudo que o roteiro grava fica FORA
   do projeto durante a execução e é copiado no fim.
   Uso: BASE=http://127.0.0.1:5321 node .audit/fechamento-funcional-g2-20261020/regressao-pa/browser-pai3.mjs */
import fs from "node:fs";
import os from "node:os";
import { chromium } from "playwright";

const DIR = `${process.cwd()}/.audit/fechamento-funcional-g2-20261020/regressao-pa`;
const BASE = process.env.BASE ?? "http://127.0.0.1:5320";
const TAG = new URL(BASE).port;
const TMP = fs.mkdtempSync(`${os.tmpdir()}/pacotes-pai3-`);
const { fichas } = JSON.parse(fs.readFileSync(`${DIR}/fichas.json`, "utf8"));
const browser = await chromium.launch({ channel: "chrome" });
const out = { geradoEm: new Date().toISOString(), base: BASE, etapas: [], falhas: [] };
let etapa = null;
const passo = (nome) => { etapa = { nome, checks: [], erros: [], observado: {} }; out.etapas.push(etapa); };
const check = (id, ok, dados) => { etapa.checks.push({ id, ok: !!ok, ...(dados !== undefined ? { dados } : {}) }); if (!ok) out.falhas.push({ etapa: etapa.nome, id, dados }); };
const CHAVE = "fm_creatures_player_v1";
const espera = (p, ms = 500) => p.waitForTimeout(ms);
const foto = (p, nome) => p.screenshot({ path: `${TMP}/${TAG}-${nome}.png` });

async function contexto(semente) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
  const p = await ctx.newPage();
  p.setDefaultTimeout(12000);
  p.on("pageerror", (e) => etapa?.erros.push(e.message));
  await p.route("**/*", (rt) => { const u = new URL(rt.request().url()); return ["blob:", "data:"].includes(u.protocol) || u.hostname === "127.0.0.1" || u.hostname === "localhost" ? rt.continue() : rt.abort(); });
  await p.goto(`${BASE}/Player`, { waitUntil: "domcontentloaded" });
  await p.evaluate(({ chave, lista }) => localStorage.setItem(chave, JSON.stringify(lista)), { chave: CHAVE, lista: semente });
  return { ctx, p };
}
async function abre(p, nome, g2 = true) {
  await p.goto(`${BASE}/Player${g2 ? "?ficha-g2=1" : ""}`, { waitUntil: "domcontentloaded" });
  await p.getByText(nome, { exact: true }).first().click();
  await p.locator("#afty-ficha").waitFor();
  await espera(p, 700);
}
const ficha = (p, id) => p.evaluate(({ chave, id }) => JSON.parse(localStorage.getItem(chave)).find((c) => c.id === id), { chave: CHAVE, id });
const sessaoCrua = (p, id) => p.evaluate((id) => JSON.parse(localStorage.getItem(`fm_ficha_sessao_afty_v1:${id}`) ?? "null"), id);
const sessao = async (p, id) => { await espera(p, 900); return sessaoCrua(p, id); };
const stat = async (p, id) => { const l = p.locator(`[data-afty-stat="${id}"]`).first(); return (await l.count()) ? Number((await l.textContent()).replace(/[^\d-]/g, "")) : null; };
/* Reflexos pela aba Perícias, como no roteiro do Codex (o mesmo seletor nas duas apresentações). */
const reflexos = async (p) => {
  await p.locator('[data-afty-aba="pericias"]').click();
  await espera(p, 300);
  return Number(((await p.locator('[id="afty-item-tr:reflexos"] .afty-valor').first().textContent()) ?? "").replace(/[^\d-]/g, ""));
};
async function efeitos(p) { await p.locator('[data-afty-aba="buffs"]').click(); await espera(p, 300); }
async function adicionar(p) { await efeitos(p); await p.locator("[data-adicionar]").first().click(); await espera(p, 300); }
async function externa(p) { if (!(await p.locator("[data-aba-externa]").count())) await adicionar(p); await p.locator("[data-aba-externa]").click(); await espera(p, 250); }
const virada = async (p) => { await p.getByRole("button", { name: "Próxima rodada", exact: true }).first().click(); await espera(p, 700); };
const texto = async (loc) => ((await loc.first().textContent().catch(() => "")) ?? "").replace(/\s+/g, " ").trim();
const instDe = (s) => (s?.buffs ?? []).find((b) => b.origemNome === "Guarda e Firmeza") ?? null;
const canais = (s) => instDe(s)?.beneficios.map((b) => b.canal) ?? null;

async function exporta(p, nomeArquivo) {
  await p.locator("[data-exportar-pacote]:not([disabled])").waitFor();
  const [d] = await Promise.all([p.waitForEvent("download"), p.locator("[data-exportar-pacote]").click()]);
  const destino = `${TMP}/${nomeArquivo}`;
  await d.saveAs(destino);
  await espera(p, 400);
  return JSON.parse(fs.readFileSync(destino, "utf8"));
}

const A = structuredClone(fichas.suporteA), R = structuredClone(fichas.receptor);
A.feiticos.push(
  { id: "pai3-misto", nome: "Guarda e Firmeza", tipo: "auxiliar", nivel: 1, multiplosAtivo: true, duracaoMult: "imediata", acaoMult: "reacao", efeitosMult: [{ id: "m3", efeito: "defesa" }, { id: "m4", efeito: "tr" }] },
  { id: "codex-um-ataque", nome: "Precisão de Um Ataque", tipo: "auxiliar", nivel: 1, efeitoAux: "ataque", duracaoAux: "imediata", umGolpe: true },
);
let arq;
const key = (n) => `recebido:${arq.emissor.id}:${arq.pacote.id}:${arq.opcoes.find((x) => x.nome === n).id}`;
async function abreOpcao(p, n) { await p.locator(`[data-chave-opcao="${key(n)}"] button.k-item`).click(); await espera(p, 250); }
async function ativar(p, n) { await abreOpcao(p, n); await p.locator(`[data-ativar-recebido="${key(n)}"]`).click(); await espera(p, 400); }
async function cartao(p, id) {
  await efeitos(p);
  const voltar = p.getByRole("button", { name: "Ativos", exact: true });
  if (await voltar.count()) { await voltar.first().click(); await espera(p, 300); }
  const c = p.locator(`[data-chave-ativo="rec:${id}"]`).first();
  if ((await c.getAttribute("aria-expanded")) !== "true") await c.click();
  await espera(p, 300);
  return c;
}

try {
  passo("suporte monta e exporta");
  {
    const { ctx, p } = await contexto([A]);
    await abre(p, A.name);
    await adicionar(p);
    await p.locator("[data-aba-aliados]").click();
    await p.locator("[data-novo-pacote]").click();
    for (const chave of ["feitico|pai3-misto", "feitico|codex-um-ataque"]) await p.locator(`[data-fonte="${chave}"] button.k-acao`).click();
    await p.locator("[data-voltar-pacote]").click();
    await p.locator('[data-campo="nome-pacote"]').fill("Pacote PA-I3");
    await p.locator(".k-fila[data-item]").filter({ hasText: "Guarda e Firmeza" }).first().locator(".k-item").click();
    await espera(p, 300);
    const resumo = await texto(p.locator("[data-resumo-opcao]"));
    check("o suporte vê o prazo de cada benefício antes de exportar", resumo.includes("Por Um Ataque") && resumo.includes("1 Rodada") && resumo.includes("Por Benefício"), resumo);
    await foto(p, "suporte-resumo");
    await p.locator("[data-salvar-pacote]").click();
    await espera(p, 600);
    arq = await exporta(p, "pacote-pai3-exportado.json");
    const g = arq.opcoes.find((x) => x.nome === "Guarda e Firmeza");
    check("o arquivo guarda o prazo de cada benefício (Defesa por um ataque, TR uma rodada)", JSON.stringify(g?.beneficios.map((b) => [b.canal, b.duracao])) === JSON.stringify([["defesa", { tipo: "proximo", texto: "Por Um Ataque" }], ["bonusTR", { tipo: "rodadas", rodadas: 1 }]]), g?.beneficios);
    check("e não há mais a condição de texto Uma Rodada", !(g?.condicoes ?? []).some((c) => /Uma Rodada/.test(c)), g?.condicoes);
    check("o Feitiço só de um ataque segue com o prazo da opção", arq.opcoes.find((x) => x.nome === "Precisão de Um Ataque")?.duracao?.tipo === "proximo");
    check("sem erro de página", !etapa.erros.length, etapa.erros);
    await ctx.close();
  }
  for (const width of [1024, 1440]) {
    passo(`aliado, largura ${width}`);
    const { ctx, p } = await contexto([R]);
    await p.setViewportSize({ width, height: 900 });
    await abre(p, R.name);
    const def0 = await stat(p, "defesa");
    const ref0 = await reflexos(p);
    etapa.observado.base = { defesa: def0, reflexos: ref0 };
    await externa(p);
    await p.locator("[data-abrir-importar]").click();
    await p.locator("[data-arquivo-pacote]").setInputFiles(`${TMP}/pacote-pai3-exportado.json`);
    await p.locator("[data-salvar-importacao]").click();
    await espera(p, 700);
    await abreOpcao(p, "Guarda e Firmeza");
    const det = await texto(p.locator("[data-resumo-opcao]"));
    check("o aliado vê o prazo de cada benefício antes de ativar", det.includes("Defesa +3 · Por Um Ataque") && det.includes("TR de Reflexos +2 · 1 Rodada"), det);
    await p.locator(`[data-ativar-recebido="${key("Guarda e Firmeza")}"]`).click();
    await espera(p, 500);
    await ativar(p, "Precisão de Um Ataque");
    check("ligada: Defesa +3 e Reflexos +2", (await stat(p, "defesa")) === def0 + 3 && (await reflexos(p)) === ref0 + 2, { defesa: await stat(p, "defesa"), reflexos: await reflexos(p) });
    let s = await sessao(p, R.id);
    const id1 = instDe(s)?.id;
    /* A Linha do Tempo do G2 mostra a parte de rodadas. */
    await efeitos(p);
    const voltar = p.getByRole("button", { name: "Ativos", exact: true });
    if (await voltar.count()) { await voltar.first().click(); await espera(p, 300); }
    const lt = await texto(p.locator(`[data-linha="rec:${id1}:rodadas"]`));
    check("a Linha do Tempo do G2 tem a barra da parte de uma rodada", lt.includes("TR de Reflexos") && lt.includes("Última Rodada"), lt);
    const c = await cartao(p, id1);
    const termina = await texto(p.locator('[data-col="termina"]'));
    check("o detalhe diz o prazo de cada parte, e quem encerra cada uma", termina.includes("1 Rodada · TR de Reflexos +2") && termina.includes("Por Um Ataque · Defesa +3") && (await p.locator("[data-encerrar-parte]").count()) === 1, termina);
    check("o cartão mostra a parte que acaba antes", (await texto(c)).includes("1 Rodada"), await texto(c));
    await foto(p, `detalhe-duas-partes-${width}`);

    /* ORDEM 1: a virada primeiro. O TR sai, a Defesa fica, e fica por mais viradas. */
    await virada(p);
    s = await sessao(p, R.id);
    check("ordem 1: a virada tira só o TR, e a Defesa de um ataque fica", (await stat(p, "defesa")) === def0 + 3 && (await reflexos(p)) === ref0 && JSON.stringify(canais(s)) === JSON.stringify(["defesa"]), { defesa: await stat(p, "defesa"), reflexos: await reflexos(p), canais: canais(s) });
    await virada(p);
    await virada(p);
    s = await sessao(p, R.id);
    check("ordem 1: mais duas viradas sem ataque, a Defesa continua", (await stat(p, "defesa")) === def0 + 3 && JSON.stringify(canais(s)) === JSON.stringify(["defesa"]), canais(s));
    check("o efeito só de um ataque também continua (PA-I2)", s.buffs.some((b) => b.origemNome === "Precisão de Um Ataque"));
    await abre(p, R.name, true);
    s = await sessao(p, R.id);
    check("a recarga conserva o que sobrou de cada instância", JSON.stringify(canais(s)) === JSON.stringify(["defesa"]) && (await stat(p, "defesa")) === def0 + 3);
    await abre(p, R.name, false);
    check("a clássica dá os mesmos números", (await stat(p, "defesa")) === def0 + 3 && (await reflexos(p)) === ref0);
    await p.locator('[data-afty-aba="buffs"]').click();
    await espera(p, 400);
    await p.locator(".afty-linha").filter({ hasText: "Guarda e Firmeza" }).first().scrollIntoViewIfNeeded();
    const linha1 = await texto(p.locator(".afty-linha").filter({ hasText: "Guarda e Firmeza" }));
    check("a linha da clássica diz o que sobrou e o prazo dele", linha1.includes("Defesa +3 · Por Um Ataque") && !linha1.includes("Reflexos"), linha1);
    await foto(p, `classica-ordem1-${width}`);
    /* O Encerrar do Feitiço inteiro, no G2, e o Reativar: uma ativação nova, com as duas partes de novo. */
    await abre(p, R.name, true);
    await cartao(p, id1);
    await p.locator(`[data-encerrar="rec:${id1}"]`).click();
    await espera(p, 500);
    s = await sessao(p, R.id);
    check("o Encerrar do Feitiço inteiro tira a instância", !instDe(s) && (await stat(p, "defesa")) === def0);
    const toggle = p.locator("[data-encerrados-toggle]").first();
    if ((await toggle.getAttribute("aria-expanded")) !== "true") await toggle.click();
    await p.locator(`[data-reativar-g2="rec:${id1}"]`).click();
    await p.locator("[data-confirmar-reativar]").click();
    await espera(p, 500);
    s = await sessao(p, R.id);
    const id2 = instDe(s)?.id;
    check("Reativar é uma ativação nova, com as duas partes e os prazos de novo", !!id2 && id2 !== id1 && JSON.stringify(instDe(s).beneficios.map((b) => [b.canal, b.rodadas ?? null])) === JSON.stringify([["defesa", null], ["bonusTR", 1]]), instDe(s));
    check("de novo: Defesa +3 e Reflexos +2", (await stat(p, "defesa")) === def0 + 3 && (await reflexos(p)) === ref0 + 2);

    /* ORDEM 2: o ataque primeiro. Encerrar Parte tira a Defesa e deixa o TR. */
    await cartao(p, id2);
    await p.locator("[data-encerrar-parte]").click();
    await espera(p, 500);
    s = await sessao(p, R.id);
    check("ordem 2: Encerrar Parte tira só a Defesa, e o TR segue com o prazo dele", (await stat(p, "defesa")) === def0 && (await reflexos(p)) === ref0 + 2 && JSON.stringify(instDe(s)?.beneficios.map((b) => [b.canal, b.rodadas])) === JSON.stringify([["bonusTR", 1]]), { defesa: await stat(p, "defesa"), reflexos: await reflexos(p), inst: instDe(s) });
    await foto(p, `ordem2-apos-ataque-${width}`);
    await abre(p, R.name, false);
    check("ordem 2: a clássica mostra Reflexos +2 e a Defesa da base", (await stat(p, "defesa")) === def0 && (await reflexos(p)) === ref0 + 2);
    /* A virada pela clássica: o TR sai, e a instância sai (não sobrou parte). */
    await virada(p);
    s = await sessao(p, R.id);
    check("ordem 2: a virada na clássica tira o TR e a instância", !instDe(s) && (await reflexos(p)) === ref0 && (await stat(p, "defesa")) === def0, s.buffs.map((b) => b.origemNome));

    /* Descanso: liga de novo e descansa. A biblioteca fica, nada volta ligado. */
    await abre(p, R.name, true);
    await externa(p);
    await ativar(p, "Guarda e Firmeza");
    await p.getByRole("button", { name: "Descanso", exact: true }).first().click();
    s = await sessao(p, R.id);
    check("o descanso tira a instância e conserva a biblioteca", !instDe(s) && (await ficha(p, R.id)).pacotesRecebidos[0].opcoes.length === 2);
    check("sem erro de página", !etapa.erros.length, etapa.erros);
    await ctx.close();
  }
} catch (e) {
  out.excecao = e.stack;
  out.falhas.push({ etapa: etapa?.nome, excecao: e.message });
} finally {
  out.resumo = out.etapas.map((x) => `${x.nome}: ${x.checks.filter((c) => c.ok).length}/${x.checks.length}`);
  fs.writeFileSync(`${TMP}/browser-pai3-${TAG}.json`, JSON.stringify(out, null, 2));
  for (const f of fs.readdirSync(TMP)) fs.copyFileSync(`${TMP}/${f}`, `${DIR}/${f}`);
  await browser.close();
}
console.log(JSON.stringify({ resumo: out.resumo, falhas: out.falhas }, null, 2));
