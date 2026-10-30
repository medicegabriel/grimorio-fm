/* A DEVOLUTIVA DE 20/10 NO NAVEGADOR (PA-I1 e PA-I2), depois do conserto. Chrome real (Playwright, channel chrome), contextos ISOLADOS para o suporte e
   para o aliado, cliques reais sem `force`, em 1024 e 1440.

   É o roteiro do Codex (`.audit/revisao-codex-pacotes-20261020/browser.mjs`, que não é alterado), copiado com os mesmos auxiliares, as mesmas fichas
   (`fichas.json` copiado de lá) e os mesmos passos, mais o que a devolutiva pediu para conferir:
     - fora, em e fora de combate de novo, no G2 e na clássica;
     - o texto do resultado da ativação (lá mostrava Defesa -3);
     - o efeito de um ataque: o prazo na tela do G2 e na linha da clássica, duas viradas (uma no G2, uma na clássica) sem encerrar, o Encerrar do
       jogador, a recarga e o descanso.
   Nenhuma ficha do autor. Tudo que o roteiro grava fica FORA do projeto durante a execução e é copiado no fim (o servidor de desenvolvimento recarrega a
   página quando aparece arquivo novo no projeto).
   Uso: BASE=http://127.0.0.1:5321 node .audit/pacotes-aliados-correcao-20261020/browser-devolutiva.mjs */
import fs from "node:fs";
import os from "node:os";
import { chromium } from "playwright";

const DIR = `${process.cwd()}/.audit/pacotes-aliados-pai3-20261020`;
const BASE = process.env.BASE ?? "http://127.0.0.1:5320";
const TAG = new URL(BASE).port;
const TMP = fs.mkdtempSync(`${os.tmpdir()}/pacotes-devolutiva-`);
const { fichas } = JSON.parse(fs.readFileSync(`${DIR}/fichas.json`, "utf8"));
const browser = await chromium.launch({ channel: "chrome" });
const out = { geradoEm: new Date().toISOString(), base: BASE, etapas: [], falhas: [] };
let etapa = null;
const passo = (nome) => { etapa = { nome, checks: [], erros: [] }; out.etapas.push(etapa); };
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
/* A Ficha grava a sessão com 600 ms de atraso: a leitura espera ela assentar. */
const sessao = async (p, id) => { await espera(p, 900); return sessaoCrua(p, id); };
const stat = async (p, id) => { const l = p.locator(`[data-afty-stat="${id}"]`).first(); return (await l.count()) ? Number((await l.textContent()).replace(/[^\d-]/g, "")) : null; };
const energiaTela = async (p) => Number(((await p.locator('button.m-medidor[data-recurso="pe"] .m-medidor-num').first().textContent()) ?? "").split("/")[0].replace(/[^\d-]/g, ""));
async function efeitos(p) { await p.locator('[data-afty-aba="buffs"]').click(); await espera(p, 300); }
async function adicionar(p) { await efeitos(p); await p.locator("[data-adicionar]").first().click(); await espera(p, 300); }
async function externa(p) { if (!(await p.locator("[data-aba-externa]").count())) await adicionar(p); await p.locator("[data-aba-externa]").click(); await espera(p, 250); }
async function emCombate(p) { const fora = p.getByRole("button", { name: /Fora de Combate/ }); if (await fora.count()) { await fora.first().click(); await espera(p, 400); } }
/* Sai do combate pelo mesmo botão do cabeçalho do G2 (Em Combate), e espera a sessão gravar antes de qualquer navegação. */
async function foraDeCombate(p) { const em = p.locator("button.e-combate[aria-pressed=\"true\"]"); if (await em.count()) { await em.first().click(); await espera(p, 1000); } }

async function exporta(p, nomeArquivo) {
  await p.locator("[data-exportar-pacote]:not([disabled])").waitFor();
  const [d] = await Promise.all([p.waitForEvent("download"), p.locator("[data-exportar-pacote]").click()]);
  const destino = `${TMP}/${nomeArquivo}`;
  await d.saveAs(destino);
  await espera(p, 400);
  return JSON.parse(fs.readFileSync(destino, "utf8"));
}
async function montaPacote(p, { nome, fontes }) {
  await adicionar(p);
  await p.locator("[data-aba-aliados]").click();
  await p.locator("[data-novo-pacote]").click();
  for (const chave of fontes) await p.locator(`[data-fonte="${chave}"] button.k-acao`).click();
  await p.locator("[data-voltar-pacote]").click();
  await p.locator('[data-campo="nome-pacote"]').fill(nome);
  await p.locator("[data-salvar-pacote]").click();
  await espera(p, 600);
}

const A = structuredClone(fichas.suporteA), R = structuredClone(fichas.receptor);
A.feiticos.push({ id: "codex-um-ataque", nome: "Precisão de Um Ataque", tipo: "auxiliar", nivel: 1, efeitoAux: "ataque", duracaoAux: "imediata", umGolpe: true });
const selecionadas = ["aptidao|aura_do_bastiao", "aptidao|aura_do_comandante", "feitico|tp-f1", "feitico|tp-f2", "invAux|tp-inv1|tp-a1", "invAura|tp-inv1|tp-c1", "invAura|tp-inv1|tp-c2", "habilidade|sup_presenca_inspiradora", "feitico|codex-um-ataque"];
const key = (arq, n) => `recebido:${arq.emissor.id}:${arq.pacote.id}:${arq.opcoes.find((x) => x.nome === n).id}`;
const nomes = ["Aura do Bastião", "Aura do Comandante", "Escudo Dourado", "Bênção Tripla", "Nue · Escudo de Raios", "Nue · Halo", "Nue · Faíscas", "Presença Inspiradora", "Precisão de Um Ataque"];
async function importar(p, path) { await externa(p); await p.locator("[data-abrir-importar]").click(); await p.locator("[data-arquivo-pacote]").setInputFiles(path); await p.locator("[data-resumo-importacao],[data-importacao-recusada]").first().waitFor(); }
async function abreOpcao(p, arq, n) { await p.locator(`[data-chave-opcao="${key(arq, n)}"] button.k-item`).click(); await espera(p, 250); }
async function ativar(p, arq, n, double = false) { await abreOpcao(p, arq, n); const btn = p.locator(`[data-ativar-recebido="${key(arq, n)}"]`); if (double) await btn.dblclick({ delay: 15 }); else await btn.click(); }
const resultado = async (p) => ((await p.locator(".g2-resultado[data-resultado]").last().textContent().catch(() => "")) ?? "").replace(/\s+/g, " ").trim();
/* A linha de um buff na aba Buffs da clássica. */
async function linhaClassica(p, nome) {
  await p.locator('[data-afty-aba="buffs"]').click();
  await espera(p, 400);
  const linha = p.locator(".afty-linha").filter({ hasText: nome }).first();
  if (!(await linha.count())) return null;
  await linha.scrollIntoViewIfNeeded();
  return ((await linha.textContent()) ?? "").replace(/\s+/g, " ").trim();
}

let arq;
try {
  passo("suporte monta e exporta pelo clique real");
  {
    const { ctx, p } = await contexto([A]);
    await abre(p, A.name);
    await montaPacote(p, { nome: "Pacote da Devolutiva", fontes: selecionadas });
    await p.locator("[data-adicionar-efeito]").click();
    await p.getByRole("button", { name: "Definir um efeito à mão", exact: true }).click();
    await p.locator('[data-campo="manual-nome"]').fill("Bastião Condicional");
    await p.locator('[data-campo="manual-origem"]').fill("Aura do Basti");
    await p.getByRole("option", { name: /Aura do Bastião/ }).click();
    await p.locator('[data-campo="manual-valor-0"]').fill("5");
    await p.getByLabel("Só em Combate", { exact: true }).check();
    await p.locator('[data-campo="manual-duracao"]').selectOption("alcance");
    await p.locator("[data-salvar-pacote]").click();
    arq = await exporta(p, "pacote-devolutiva-exportado.json");
    check("o arquivo tem as dez opções", arq.opcoes.length === 10, arq.opcoes.length);
    const um = arq.opcoes.find((x) => x.nome === "Precisão de Um Ataque");
    check("PA-I2: o arquivo guarda o prazo de uso do efeito de um ataque", JSON.stringify(um?.duracao) === JSON.stringify({ tipo: "proximo", texto: "Por Um Ataque" }), um?.duracao);
    const cond = arq.opcoes.find((x) => x.nome === "Bastião Condicional");
    check("PA-I1: a definição à mão leva +5 Só em Combate com a origem da Aura do Bastião", cond?.beneficios?.[0]?.valor === 5 && cond.beneficios[0].quando === "em_combate" && cond.acumulo?.origemId === "aptidao:aura_do_bastiao", cond);
    check("sem erro de página", !etapa.erros.length, etapa.erros);
    await ctx.close();
  }
  for (const width of [1024, 1440]) {
    passo(`aliado importa e usa, largura ${width}`);
    const { ctx, p } = await contexto([R]);
    await p.setViewportSize({ width, height: 900 });
    await abre(p, R.name);
    const base = await stat(p, "defesa");
    const pe = await energiaTela(p);
    await importar(p, `${TMP}/pacote-devolutiva-exportado.json`);
    await p.locator("[data-salvar-importacao]").click();
    await espera(p, 700);
    check("a biblioteca grava sem mudar Defesa nem Energia", (await stat(p, "defesa")) === base && (await energiaTela(p)) === pe && (await ficha(p, R.id)).pacotesRecebidos?.length === 1);

    /* PA-I1 pela tela: fora, em, fora. */
    await ativar(p, arq, "Aura do Bastião", true);
    await espera(p, 400);
    await abreOpcao(p, arq, "Bastião Condicional");
    const previa = ((await p.locator("[data-previa-recebido]").textContent().catch(() => "")) ?? "").replace(/\s+/g, " ").trim();
    await p.locator(`[data-ativar-recebido="${key(arq, "Bastião Condicional")}"]`).click();
    await espera(p, 500);
    const res = await resultado(p);
    let s = await sessao(p, R.id);
    check("o clique duplo cria uma instância só", s.buffs.filter((x) => x.origemNome === "Aura do Bastião").length === 1);
    check("PA-I1: fora de combate, com as duas ligadas, vale o +3", (await stat(p, "defesa")) === base + 3, { base, atual: await stat(p, "defesa") });
    check("PA-I1: o resultado da segunda ativação não tira Defesa", !/Defesa\s*[−-]\s*\d/.test(res), { resultado: res, previa });
    await foto(p, `condicao-fora-${width}`);
    await emCombate(p);
    await espera(p, 700);
    check("PA-I1: em combate vale o +5", (await stat(p, "defesa")) === base + 5, { base, atual: await stat(p, "defesa") });
    await abre(p, R.name, false);
    check("PA-I1: a clássica em combate também dá +5", (await stat(p, "defesa")) === base + 5, { base, atual: await stat(p, "defesa") });
    await abre(p, R.name, true);
    await foraDeCombate(p);
    check("PA-I1: fora de combate de novo, volta ao +3", (await stat(p, "defesa")) === base + 3, { base, atual: await stat(p, "defesa") });
    await foto(p, `condicao-fora-de-novo-${width}`);
    await abre(p, R.name, false);
    check("PA-I1: a clássica fora de combate também dá +3", (await stat(p, "defesa")) === base + 3, { base, atual: await stat(p, "defesa") });
    await abre(p, R.name, true);
    await emCombate(p);
    await espera(p, 700);
    check("PA-I1: e em combate de novo, +5", (await stat(p, "defesa")) === base + 5, { base, atual: await stat(p, "defesa") });

    /* O resto do pacote, como no roteiro do Codex: encerra o condicional e liga as outras oito. */
    await externa(p);
    await abreOpcao(p, arq, "Bastião Condicional");
    await p.locator("[data-encerrar-recebido]").click();
    for (const n of nomes.slice(1)) await ativar(p, arq, n);
    s = await sessao(p, R.id);
    check("nove opções convivem sem gasto do aliado", s.buffs.length === 9 && (await energiaTela(p)) === pe, s.buffs.map((x) => x.origemNome));
    check("as famílias somam sem duplicar Feitiços", (await stat(p, "defesa")) === base + 11, { base, atual: await stat(p, "defesa") });

    /* PA-I2 pela tela. Ela foi a última ativada e está aberta: clicar de novo fecharia o detalhe, então abre outra antes. */
    await abreOpcao(p, arq, "Nue · Halo");
    await abreOpcao(p, arq, "Precisão de Um Ataque");
    check("PA-I2: o G2 mostra o prazo de uso", await p.getByText("Por Um Ataque").first().isVisible().catch(() => false));
    await foto(p, `um-ataque-${width}`);
    await p.getByRole("button", { name: "Próxima rodada", exact: true }).click();
    s = await sessao(p, R.id);
    check("PA-I2: a virada no G2 conserva o efeito de um ataque não usado", s.buffs.some((x) => x.origemNome === "Precisão de Um Ataque" && x.rodadas == null), s.buffs.map((x) => [x.origemNome, x.rodadas]));
    check("as fontes de rodadas contam cada uma o seu prazo", s.buffs.find((x) => x.origemNome === "Escudo Dourado")?.rodadas === 1 && !s.buffs.some((x) => x.origemNome === "Bênção Tripla"), s.buffs.map((x) => [x.origemNome, x.rodadas]));
    /* O cartão nos Ativos do G2 diz o prazo curto. */
    const idUm = s.buffs.find((x) => x.origemNome === "Precisão de Um Ataque")?.id;
    await p.getByRole("button", { name: "Ativos", exact: true }).first().click();
    await espera(p, 400);
    const cartaoUm = ((await p.locator(`[data-chave-ativo="rec:${idUm}"]`).first().textContent().catch(() => "")) ?? "").replace(/\s+/g, " ").trim();
    check("PA-I2: o cartão nos Ativos do G2 mostra Um Ataque", cartaoUm.includes("Um Ataque"), cartaoUm);
    await p.locator(`[data-chave-ativo="rec:${idUm}"]`).first().click();
    await espera(p, 400);
    check("PA-I2: o detalhe do cartão diz o prazo e que quem encerra é o jogador", (await p.getByText("Por Um Ataque").first().isVisible().catch(() => false)) && (await p.getByText("A Ficha Não Conta Este Prazo: Encerre Quando Acabar").first().isVisible().catch(() => false)));
    await foto(p, `um-ataque-ativos-${width}`);
    await abre(p, R.name, false);
    const linha = await linhaClassica(p, "Precisão de Um Ataque");
    check("PA-I2: a linha da clássica diz o prazo", !!linha && linha.includes("Por Um Ataque"), linha);
    await foto(p, `um-ataque-classica-${width}`);
    await p.getByRole("button", { name: "Próxima rodada", exact: true }).first().click();
    s = await sessao(p, R.id);
    check("PA-I2: a virada na clássica também o conserva, e a Duradoura de 2 rodadas sai", s.buffs.some((x) => x.origemNome === "Precisão de Um Ataque") && !s.buffs.some((x) => x.origemNome === "Escudo Dourado"), s.buffs.map((x) => [x.origemNome, x.rodadas]));
    await abre(p, R.name, true);
    const depois = await sessao(p, R.id);
    check("a recarga conserva a biblioteca e os ativos", (await ficha(p, R.id)).pacotesRecebidos[0].opcoes.length === 10 && depois.buffs.length === s.buffs.length && depois.buffs.some((x) => x.origemNome === "Precisão de Um Ataque"));
    await externa(p);
    await abreOpcao(p, arq, "Precisão de Um Ataque");
    await p.locator("[data-encerrar-recebido]").click();
    s = await sessao(p, R.id);
    check("PA-I2: o Encerrar do jogador tira o efeito de um ataque", !s.buffs.some((x) => x.origemNome === "Precisão de Um Ataque"), s.buffs.map((x) => x.origemNome));
    await p.getByRole("button", { name: "Descanso", exact: true }).first().click();
    s = await sessao(p, R.id);
    check("o descanso conserva a biblioteca e não religa nada", (await ficha(p, R.id)).pacotesRecebidos[0].opcoes.length === 10 && !s.buffs.some((x) => x.pacote));
    check("sem erro de página", !etapa.erros.length, etapa.erros);
    await ctx.close();
  }
} catch (e) {
  out.excecao = e.stack;
  out.falhas.push({ etapa: etapa?.nome, excecao: e.message });
} finally {
  out.resumo = out.etapas.map((x) => `${x.nome}: ${x.checks.filter((c) => c.ok).length}/${x.checks.length}`);
  fs.writeFileSync(`${TMP}/browser-${TAG}.json`, JSON.stringify(out, null, 2));
  for (const f of fs.readdirSync(TMP)) fs.copyFileSync(`${TMP}/${f}`, `${DIR}/${f}`);
  await browser.close();
}
console.log(JSON.stringify({ resumo: out.resumo, falhas: out.falhas }, null, 2));
