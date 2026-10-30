/* PA-I4 NO NAVEGADOR: o benefício que herda as rodadas da opção também sai na virada. Chrome real (Playwright, channel chrome), contextos ISOLADOS,
   arquivo importado pela tela (Importar Pacote), cliques reais sem `force`, em 1024 e 1440, na completa, na compacta e na clássica.

   Os arquivos (`variantes.json`, de `gerar-variantes.mjs`) saem do resolvedor e do exportador reais, com a duração comum na opção e o prazo escrito só
   onde ele é exceção:
     A  o caso do Codex: opção em 1 rodada, a Defesa com a exceção de um ataque, o TR herdando
     D  a Defesa com 1 rodada própria, o TR herdando as 2 da opção
   Confere as duas ordens de término (a virada primeiro, o ataque primeiro pelo Encerrar Parte na compacta), recarga, o Encerrar e o Reativar, e a
   instância que já existia antes da correção (o TR sem contador), que não pode ser reescrita nem fingir que a ficha a conta.
   Nenhuma ficha do autor. Tudo que o roteiro grava fica FORA do projeto durante a execução e é copiado no fim.
   Uso: BASE=http://127.0.0.1:5321 node .audit/pacotes-aliados-pai4-20261020/browser-pai4.mjs */
import fs from "node:fs";
import os from "node:os";
import { chromium } from "playwright";

const DIR = `${process.cwd()}/.audit/pacotes-aliados-pai4-20261020`;
const BASE = process.env.BASE ?? "http://127.0.0.1:5320";
const TAG = new URL(BASE).port;
const TMP = fs.mkdtempSync(`${os.tmpdir()}/pacotes-pai4-`);
const { fichas } = JSON.parse(fs.readFileSync(`${DIR}/fichas.json`, "utf8"));
const variantes = JSON.parse(fs.readFileSync(`${DIR}/variantes.json`, "utf8"));
for (const [k, a] of Object.entries(variantes)) fs.writeFileSync(`${TMP}/variante-${k}.json`, JSON.stringify(a));
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
const resumoBen = (s) => instDe(s)?.beneficios.map((b) => [b.canal, b.rodadas ?? null]) ?? null;
async function cartao(p, id) {
  await efeitos(p);
  const voltar = p.getByRole("button", { name: "Ativos", exact: true });
  if (await voltar.count()) { await voltar.first().click(); await espera(p, 300); }
  const c = p.locator(`[data-chave-ativo="rec:${id}"]`).first();
  if ((await c.getAttribute("aria-expanded")) !== "true") await c.click();
  await espera(p, 300);
  return c;
}
async function abreCompacta(p, id) {
  await p.locator('[data-afty-aba="habilidades"]').click();
  if (!(await p.locator("[data-c2]").isVisible().catch(() => false))) await p.locator("button.f-acesso").click();
  await p.locator("[data-c2]").waitFor();
  if (!(await p.locator(`[data-detalhe-c2="rec:${id}"]`).isVisible().catch(() => false))) await p.locator(`[data-c2] [data-chave-ativo="rec:${id}"]`).click();
  await p.locator(`[data-detalhe-c2="rec:${id}"]`).waitFor();
}
let chaveOpcao;
async function importar(p, variante) {
  const arq = variantes[variante];
  chaveOpcao = `recebido:${arq.emissor.id}:${arq.pacote.id}:${arq.opcoes[0].id}`;
  await externa(p);
  await p.locator("[data-abrir-importar]").click();
  await p.locator("[data-arquivo-pacote]").setInputFiles(`${TMP}/variante-${variante}.json`);
  await p.locator("[data-resumo-importacao],[data-importacao-recusada]").first().waitFor();
  const aceito = (await p.locator("[data-importacao-recusada]").count()) === 0;
  const resumoImport = await texto(p.locator("[data-opcoes-importadas]"));
  await p.locator("[data-salvar-importacao]").click();
  await espera(p, 700);
  return { aceito, resumoImport };
}
async function abreOpcao(p) { await p.locator(`[data-chave-opcao="${chaveOpcao}"] button.k-item`).click(); await espera(p, 250); }
async function ativar(p) { await abreOpcao(p); await p.locator(`[data-ativar-recebido="${chaveOpcao}"]`).click(); await espera(p, 500); }

const R = structuredClone(fichas.receptor);
try {
  for (const width of [1024, 1440]) {
    /* ---------- A: o caso do Codex ---------- */
    passo(`A próprio/herdado, largura ${width}`);
    {
      const { ctx, p } = await contexto([R]);
      await p.setViewportSize({ width, height: 900 });
      await abre(p, R.name);
      const def0 = await stat(p, "defesa");
      const ref0 = await reflexos(p);
      etapa.observado.base = { defesa: def0, reflexos: ref0 };
      const imp = await importar(p, "A");
      check("o arquivo que herda o prazo é aceito sem recusa", imp.aceito, imp.resumoImport);
      check("o resumo da importação diz o prazo efetivo de cada benefício, inclusive o herdado", imp.resumoImport.includes("Defesa +3 · Por Um Ataque") && imp.resumoImport.includes("TR de Reflexos +2 · 1 Rodada"), imp.resumoImport);
      await abreOpcao(p);
      const det = await texto(p.locator("[data-resumo-opcao]"));
      check("o detalhe da opção diz o prazo efetivo de cada benefício antes de ativar", det.includes("Defesa +3 · Por Um Ataque") && det.includes("TR de Reflexos +2 · 1 Rodada") && det.includes("Por Benefício"), det);
      await p.locator(`[data-ativar-recebido="${chaveOpcao}"]`).click();
      await espera(p, 500);
      check("ligada: Defesa +3 e Reflexos +2", (await stat(p, "defesa")) === def0 + 3 && (await reflexos(p)) === ref0 + 2, { defesa: await stat(p, "defesa"), reflexos: await reflexos(p) });
      let s = await sessao(p, R.id);
      const id1 = instDe(s)?.id;
      check("a instância nasce com o contador do benefício que herda", JSON.stringify(resumoBen(s)) === JSON.stringify([["defesa", null], ["bonusTR", 1]]), instDe(s));
      await cartao(p, id1);
      const termina = await texto(p.locator('[data-col="termina"]'));
      check("o detalhe da completa diz que a ficha conta a rodada do TR e encerra sozinha", termina.includes("1 Rodada · TR de Reflexos +2") && termina.includes("A Ficha Conta as Rodadas e Encerra Sozinha") && (await p.locator("[data-encerrar-parte]").count()) === 1, termina);
      await abreCompacta(p, id1);
      const terminaC = await texto(p.locator("[data-c2] [data-col=\"termina\"]"));
      check("o detalhe da compacta diz o mesmo", terminaC.includes("1 Rodada · TR de Reflexos +2") && terminaC.includes("A Ficha Conta as Rodadas e Encerra Sozinha"), terminaC);
      await foto(p, `a-compacta-antes-${width}`);
      /* ORDEM 1: a virada primeiro. */
      await virada(p);
      s = await sessao(p, R.id);
      check("ordem 1: a virada tira só o TR herdado, e a Defesa de um ataque fica", (await stat(p, "defesa")) === def0 + 3 && (await reflexos(p)) === ref0 && JSON.stringify(resumoBen(s)) === JSON.stringify([["defesa", null]]), { defesa: await stat(p, "defesa"), reflexos: await reflexos(p), inst: instDe(s) });
      await virada(p);
      await virada(p);
      s = await sessao(p, R.id);
      check("ordem 1: mais duas viradas, a Defesa continua e o TR não volta", (await stat(p, "defesa")) === def0 + 3 && (await reflexos(p)) === ref0, resumoBen(s));
      await abre(p, R.name, true);
      s = await sessao(p, R.id);
      check("a recarga conserva o que sobrou", JSON.stringify(resumoBen(s)) === JSON.stringify([["defesa", null]]) && (await stat(p, "defesa")) === def0 + 3);
      await abre(p, R.name, false);
      check("a clássica dá os mesmos números", (await stat(p, "defesa")) === def0 + 3 && (await reflexos(p)) === ref0);
      /* O Encerrar do Feitiço inteiro e o Reativar: a ativação nova leva as duas partes, o TR com o contador da opção. */
      await abre(p, R.name, true);
      await cartao(p, id1);
      await p.locator(`[data-encerrar="rec:${id1}"]`).click();
      await espera(p, 500);
      const toggle = p.locator("[data-encerrados-toggle]").first();
      if ((await toggle.getAttribute("aria-expanded")) !== "true") await toggle.click();
      await p.locator(`[data-reativar-g2="rec:${id1}"]`).click();
      await p.locator("[data-confirmar-reativar]").click();
      await espera(p, 500);
      s = await sessao(p, R.id);
      const id2 = instDe(s)?.id;
      check("Reativar leva as duas partes, o TR com o contador de novo", !!id2 && id2 !== id1 && JSON.stringify(resumoBen(s)) === JSON.stringify([["defesa", null], ["bonusTR", 1]]), instDe(s));
      await abre(p, R.name, true);
      s = await sessao(p, R.id);
      check("a recarga conserva o contador do TR reativado", JSON.stringify(resumoBen(s)) === JSON.stringify([["defesa", null], ["bonusTR", 1]]));
      /* ORDEM 2: o ataque primeiro, pelo Encerrar Parte da compacta. */
      await abreCompacta(p, id2);
      const parte = p.locator("[data-c2] [data-encerrar-parte]");
      if (width === 1440) { await parte.focus(); await parte.press("Enter"); } else await parte.click();
      await espera(p, 500);
      s = await sessao(p, R.id);
      check("ordem 2: Encerrar Parte na compacta tira só a Defesa, e o TR herdado segue com o contador", (await stat(p, "defesa")) === def0 && (await reflexos(p)) === ref0 + 2 && JSON.stringify(resumoBen(s)) === JSON.stringify([["bonusTR", 1]]), { defesa: await stat(p, "defesa"), reflexos: await reflexos(p), inst: instDe(s) });
      await abre(p, R.name, false);
      await virada(p);
      s = await sessao(p, R.id);
      check("ordem 2: a virada na clássica tira o TR e a instância", !instDe(s) && (await reflexos(p)) === ref0 && (await stat(p, "defesa")) === def0, s.buffs.map((b) => b.origemNome));
      check("sem erro de página", !etapa.erros.length, etapa.erros);
      await foto(p, `a-classica-fim-${width}`);
      await ctx.close();
    }

    /* ---------- D: rodadas diferentes ---------- */
    passo(`D rodadas diferentes, largura ${width}`);
    {
      const { ctx, p } = await contexto([R]);
      await p.setViewportSize({ width, height: 900 });
      await abre(p, R.name);
      const def0 = await stat(p, "defesa");
      const ref0 = await reflexos(p);
      const imp = await importar(p, "D");
      check("o arquivo é aceito", imp.aceito, imp.resumoImport);
      await ativar(p);
      let s = await sessao(p, R.id);
      check("ligada: Defesa +3 e Reflexos +2, a Defesa com 1 rodada e o TR com as 2 da opção", (await stat(p, "defesa")) === def0 + 3 && (await reflexos(p)) === ref0 + 2 && JSON.stringify(resumoBen(s)) === JSON.stringify([["defesa", 1], ["bonusTR", 2]]), resumoBen(s));
      await virada(p);
      s = await sessao(p, R.id);
      check("primeira virada: a Defesa sai e o TR fica com 1 rodada", (await stat(p, "defesa")) === def0 && (await reflexos(p)) === ref0 + 2 && JSON.stringify(resumoBen(s)) === JSON.stringify([["bonusTR", 1]]), { defesa: await stat(p, "defesa"), reflexos: await reflexos(p), inst: instDe(s) });
      await abre(p, R.name, false);
      check("a clássica, depois da recarga, dá os mesmos números", (await stat(p, "defesa")) === def0 && (await reflexos(p)) === ref0 + 2);
      await virada(p);
      s = await sessao(p, R.id);
      check("segunda virada: o TR sai e a instância também", !instDe(s) && (await reflexos(p)) === ref0, s.buffs.map((b) => b.origemNome));
      check("sem erro de página", !etapa.erros.length, etapa.erros);
      await ctx.close();
    }

    /* ---------- F: a instância que já existia antes da correção ---------- */
    passo(`F instância antiga com o TR sem contador, largura ${width}`);
    {
      const { ctx, p } = await contexto([R]);
      await p.setViewportSize({ width, height: 900 });
      await abre(p, R.name);
      const def0 = await stat(p, "defesa");
      const ref0 = await reflexos(p);
      await importar(p, "A");
      await ativar(p);
      let s = await sessao(p, R.id);
      const id = instDe(s)?.id;
      /* Reproduz o estado que o código anterior gravava para esse arquivo: o TR sem prazo e sem contador. */
      await p.evaluate(({ chave, id }) => {
        const bruto = JSON.parse(localStorage.getItem(chave));
        const inst = bruto.buffs.find((b) => b.id === id);
        inst.beneficios = inst.beneficios.map((b) => (b.canal === "bonusTR" ? { canal: b.canal, valor: b.valor, alvo: b.alvo } : b));
        localStorage.setItem(chave, JSON.stringify(bruto));
      }, { chave: `fm_ficha_sessao_afty_v1:${R.id}`, id });
      await abre(p, R.name, true);
      const antes = JSON.stringify(instDe(await sessao(p, R.id)));
      check("a instância antiga conta o TR (Reflexos +2) e a Defesa (+3)", (await stat(p, "defesa")) === def0 + 3 && (await reflexos(p)) === ref0 + 2);
      await cartao(p, id);
      const termina = await texto(p.locator('[data-col="termina"]'));
      check("a tela não finge que a ficha conta o TR: ele é uma parte de encerramento manual", termina.includes("TR de Reflexos +2") && !termina.includes("A Ficha Conta as Rodadas") && (await p.locator("[data-encerrar-parte]").count()) === 2, termina);
      await foto(p, `f-antiga-detalhe-${width}`);
      await virada(p);
      const depois = JSON.stringify(instDe(await sessao(p, R.id)));
      check("a virada não reescreve a instância antiga, e o TR continua até o jogador encerrar", antes === depois && (await reflexos(p)) === ref0 + 2, { antes, depois });
      await cartao(p, id);
      await p.locator('[data-encerrar-parte="rodadas|sem contador"]').click();
      await espera(p, 500);
      s = await sessao(p, R.id);
      check("Encerrar Parte no TR sem contador tira só o TR", (await reflexos(p)) === ref0 && (await stat(p, "defesa")) === def0 + 3 && JSON.stringify(resumoBen(s)) === JSON.stringify([["defesa", null]]), instDe(s));
      check("sem erro de página", !etapa.erros.length, etapa.erros);
      await ctx.close();
    }
  }
} catch (e) {
  out.excecao = e.stack;
  out.falhas.push({ etapa: etapa?.nome, excecao: e.message });
} finally {
  out.resumo = out.etapas.map((x) => `${x.nome}: ${x.checks.filter((c) => c.ok).length}/${x.checks.length}`);
  fs.writeFileSync(`${TMP}/browser-pai4-${TAG}.json`, JSON.stringify(out, null, 2));
  for (const f of fs.readdirSync(TMP)) fs.copyFileSync(`${TMP}/${f}`, `${DIR}/${f}`);
  await browser.close();
}
console.log(JSON.stringify({ resumo: out.resumo, falhas: out.falhas }, null, 2));
