/* PACOTES PARA ALIADOS NO NAVEGADOR (2026-10-19). Chrome real (Playwright, channel chrome), um contexto ISOLADO por "computador":
     A  o suporte Yuki (sintético) monta e exporta o pacote, e exporta a revisão 2 depois de mudar a Presença;
     B  o suporte Rin (sintético, Sem Técnica) exporta o Estilo;
     R  o aliado Kai (sintético) importa os arquivos, ativa, conta prazo, encerra, reativa, descansa e recarrega.
   Nenhuma ficha do autor: todas levam "(Teste Pacotes)" e entram só no localStorage do contexto de teste. Cliques reais, sem `force`.
   Uso: BASE=http://127.0.0.1:5320 node .audit/pacotes-aliados-20261019/e2e.mjs */
import fs from "node:fs";
import os from "node:os";
import { chromium } from "playwright";

const DIR = `${process.cwd()}/.audit/pacotes-aliados-20261019`;
const BASE = process.env.BASE ?? "http://127.0.0.1:5320";
const TAG = new URL(BASE).port;
/* ⚠ Os arquivos baixados e os de teste ficam FORA do projeto durante a execução: o plugin do Tailwind varre as pastas não ignoradas, e um JSON novo em
   .audit/ recarrega a página do servidor de desenvolvimento no meio do roteiro. No fim eles são copiados para a pasta da auditoria. */
const TMP = fs.mkdtempSync(`${os.tmpdir()}/pacotes-aliados-e2e-`);
const { fichas } = JSON.parse(fs.readFileSync(`${DIR}/fichas.json`, "utf8"));
const browser = await chromium.launch({ channel: "chrome" });
const out = { geradoEm: new Date().toISOString(), base: BASE, etapas: [], falhas: [] };
const salva = () => fs.writeFileSync(`${DIR}/e2e-${TAG}.json`, JSON.stringify(out, null, 2));
let etapa = null;
const passo = (nome) => { etapa = { nome, checks: [], erros: [] }; out.etapas.push(etapa); };
const check = (id, ok, dados) => { etapa.checks.push({ id, ok: !!ok, ...(ok ? {} : { dados }) }); if (!ok) out.falhas.push({ etapa: etapa.nome, id, dados }); };
const CHAVE = "fm_creatures_player_v1";
const espera = (p, ms = 500) => p.waitForTimeout(ms);

async function contexto(semente, rastro = null) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
  if (rastro) await ctx.tracing.start({ screenshots: true, snapshots: true });
  ctx.rastro = rastro;
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
/* A Ficha grava a sessão com 600 ms de atraso (debounce): a leitura espera ela assentar. */
const sessao = async (p, id) => { await espera(p, 900); return sessaoCrua(p, id); };
const stat = async (p, id) => { const l = p.locator(`[data-afty-stat="${id}"]`).first(); return (await l.count()) ? Number((await l.textContent()).replace(/[^\d-]/g, "")) : null; };
const stats = async (p) => ({ defesa: await stat(p, "defesa"), iniciativa: await stat(p, "iniciativa"), atencao: await stat(p, "atencao") });
/* A Energia do cabeçalho do G2 (o primeiro número do medidor). Na produção a sessão só é gravada depois da primeira mudança. */
const energiaTela = async (p) => Number(((await p.locator('button.m-medidor[data-recurso="pe"] .m-medidor-num').first().textContent()) ?? "").split("/")[0].replace(/[^\d-]/g, ""));
async function efeitos(p) { await p.locator('[data-afty-aba="buffs"]').click(); await espera(p, 300); }
async function adicionar(p) { await efeitos(p); await p.locator("[data-adicionar]").first().click(); await espera(p, 300); }
async function externa(p) { if (!(await p.locator("[data-aba-externa]").count())) await adicionar(p); await p.locator("[data-aba-externa]").click(); await espera(p, 250); }
async function emCombate(p) { const fora = p.getByRole("button", { name: /Fora de Combate/ }); if (await fora.count()) { await fora.first().click(); await espera(p, 400); } }

/* ---------- o suporte: monta, salva e exporta ---------- */
async function exporta(p, nomeArquivo) {
  let d;
  try {
    await p.locator("[data-exportar-pacote]:not([disabled])").waitFor();
    [d] = await Promise.all([p.waitForEvent("download"), p.locator("[data-exportar-pacote]").click()]);
  } catch (e) {
    await p.screenshot({ path: `${DIR}/e2e-${TAG}-exporta-falhou.png` });
    await p.context().tracing.stop({ path: `${DIR}/trace-falha-${TAG}.zip` }).catch(() => {});
    etapa.erros.push(`exporta: ${await p.locator("[data-saida-pacote]").textContent().catch(() => "sem saída")}`);
    throw e;
  }
  const destino = `${TMP}/${nomeArquivo}`;
  await d.saveAs(destino);
  await espera(p, 400);
  return JSON.parse(fs.readFileSync(destino, "utf8"));
}
async function montaPacote(p, { nome, fontes, escolhas = {} }) {
  await adicionar(p);
  await p.locator("[data-aba-aliados]").click();
  await p.locator("[data-novo-pacote]").click();
  for (const chave of fontes) await p.locator(`[data-fonte="${chave}"] button.k-acao`).click();
  await p.locator("[data-voltar-pacote]").click();
  await p.locator('[data-campo="nome-pacote"]').fill(nome);
  for (const [fonte, valores] of Object.entries(escolhas)) {
    await p.locator(".k-fila[data-item]").filter({ hasText: fonte }).first().locator(".k-item").click();
    for (const [campo, valor] of Object.entries(valores)) await p.locator(`[data-campo="escolha-${campo}"]`).selectOption(valor);
  }
  await p.locator("[data-salvar-pacote]").click();
  await espera(p, 600);
}

const A = fichas.suporteA;
const B = fichas.suporteB;
const R = fichas.receptor;
const arquivos = {};
try {
  /* ============ A ============ */
  passo("suporte A monta e exporta");
  {
    const { ctx, p } = await contexto([A], "trace-suporte-a.zip");
    await abre(p, A.name);
    const fontes = ["aptidao|aura_do_bastiao", "aptidao|aura_do_comandante", "feitico|tp-f1", "feitico|tp-f2", "feitico|tp-f5", "invAux|tp-inv1|tp-a1",
      "invAura|tp-inv1|tp-c1", "invAura|tp-inv1|tp-c2", "invAura|tp-inv1|tp-c3", "habilidade|sup_presenca_inspiradora", "habilidade|sup_inimigo_comum",
      "habilidade|sup_taticas_defensivas", "habilidade|sup_comando_motivador"];
    const peAntes = (await sessao(p, A.id))?.peAtual ?? null;
    await adicionar(p);
    await p.locator("[data-aba-aliados]").click();
    await p.locator("[data-novo-pacote]").click();
    check("a fonte de Alcance Próprio aparece sem Incluir", (await p.locator('[data-fonte="feitico|tp-f4"][data-bloqueada] button.k-acao').count()) === 0
      && (await p.locator('[data-fonte="feitico|tp-f4"][data-bloqueada]').count()) === 1);
    check("o auxílio da própria invocação não é fonte para aliados", (await p.locator('[data-fonte="invAux|tp-inv1|tp-a2"]').count()) === 0);
    await p.locator("[data-aba-externa]").click();
    await p.locator("[data-aba-aliados]").click();
    await p.locator("[data-novo-pacote]").click();
    for (const chave of fontes) await p.locator(`[data-fonte="${chave}"] button.k-acao`).click();
    await p.locator("[data-voltar-pacote]").click();
    await p.locator('[data-campo="nome-pacote"]').fill("Apoio do Grupo");
    await p.locator(".k-fila[data-item]").filter({ hasText: "Aura do Comandante" }).first().locator(".k-item").click();
    await p.locator('[data-campo="escolha-versao"]').selectOption("evoluida");
    await espera(p, 200);
    const resumo = await p.locator("[data-detalhe-item] [data-beneficios]").textContent();
    check("a prévia do suporte mostra a Evoluída com Acerto e TR", /Acerto \+2/.test(resumo) && /Testes de Resistência \+2/.test(resumo), resumo);
    check("Exportar fica travado com rascunho por salvar", await p.locator("[data-exportar-pacote]").isDisabled());
    await p.locator("[data-salvar-pacote]").click();
    await espera(p, 700);
    const salvo = await ficha(p, A.id);
    check("o pacote foi gravado no personagem", salvo.pacotesAliados?.pacotes?.length === 1 && salvo.pacotesAliados.pacotes[0].itens.length === fontes.length, salvo.pacotesAliados);
    check("o emissor ganhou id estável", /^emi_/.test(salvo.pacotesAliados?.emissorId ?? ""));
    check("montar o pacote não mexeu na sessão do suporte", ((await sessao(p, A.id))?.peAtual ?? null) === peAntes);
    const arq = await exporta(p, "pacote-yuki-rev1.json");
    arquivos.aRev1 = arq;
    check("o arquivo tem formato e versão", arq.formato === "grimorio-afty-pacote-aliados" && arq.versao === 1, { formato: arq.formato, versao: arq.versao });
    check("revisão 1", arq.pacote.revisao === 1);
    const op = (nome) => arq.opcoes.find((o) => o.nome === nome);
    check("Bastião leva o Nível de Aura do emissor (3)", op("Aura do Bastião")?.beneficios?.[0]?.valor === 3, op("Aura do Bastião"));
    check("Comandante Evoluída: dano e perícias 3 em combate, acerto e TR 2", JSON.stringify(op("Aura do Comandante Evoluída")?.beneficios) === JSON.stringify([
      { canal: "danoBonus", valor: 3, quando: "em_combate" }, { canal: "bonusPericia", valor: 3, quando: "em_combate" }, { canal: "bonusAcerto", valor: 2 }, { canal: "bonusTR", valor: 2 }]), op("Aura do Comandante Evoluída"));
    check("Inimigo Comum com a Presença do emissor (mod 4)", JSON.stringify(op("Inimigo Comum")?.beneficios) === JSON.stringify([{ canal: "bonusAcerto", valor: 2 }, { canal: "danoBonus", valor: 4 }]), op("Inimigo Comum"));
    check("Lâmina Viva vai só como consulta", op("Lâmina Viva")?.beneficios?.length === 0 && op("Lâmina Viva")?.consulta?.length === 1);
    check("o Feitiço de Alcance Próprio não está no arquivo", !op("Só Meu"));
    check("o arquivo não leva a ficha do emissor", !("attributes" in arq) && !JSON.stringify(arq).includes("\"habilidades\""));
    const arq2 = await exporta(p, "pacote-yuki-rev1-de-novo.json");
    check("exportar de novo sem mudança repete a revisão", arq2.pacote.revisao === 1 && JSON.stringify(arq2.opcoes) === JSON.stringify(arq.opcoes));
    await p.screenshot({ path: `${DIR}/e2e-${TAG}-suporte-pacote.png` });
    /* O suporte evolui: Presença 18 para 20 (como o criador gravaria), recarrega e exporta a revisão 2. */
    await p.evaluate(({ chave, id }) => { const l = JSON.parse(localStorage.getItem(chave)); const c = l.find((x) => x.id === id); c.attributes.presenca = 20; localStorage.setItem(chave, JSON.stringify(l)); }, { chave: CHAVE, id: A.id });
    await abre(p, A.name);
    await adicionar(p);
    await p.locator("[data-aba-aliados]").click();
    const arq3 = await exporta(p, "pacote-yuki-rev2.json");
    arquivos.aRev2 = arq3;
    const ic = arq3.opcoes.find((o) => o.nome === "Inimigo Comum");
    check("a revisão 2 recalcula com a Presença nova (dano 5)", arq3.pacote.revisao === 2 && ic?.beneficios?.[1]?.valor === 5, ic);
    check("os ids de pacote, emissor e opções são estáveis entre revisões", arq3.pacote.id === arq.pacote.id && arq3.emissor.id === arq.emissor.id
      && JSON.stringify(arq3.opcoes.map((o) => o.id)) === JSON.stringify(arq.opcoes.map((o) => o.id)));
    check("sem erro de página", !etapa.erros.length, etapa.erros);
    await ctx.tracing.stop().catch(() => {});
    await ctx.close();
  }

  /* ============ B ============ */
  passo("suporte B (Estilo) exporta");
  {
    const { ctx, p } = await contexto([B]);
    await abre(p, B.name);
    await montaPacote(p, { nome: "Sombra do Grupo", fontes: ["estilo|tp-tec1", "habilidade|sup_presenca_inspiradora"] });
    const arq = await exporta(p, "pacote-rin-rev1.json");
    arquivos.b = arq;
    const est = arq.opcoes.find((o) => o.familia === "estilo");
    check("o Estilo vai com Defesa e TR de Vontade dos aliados", JSON.stringify(est?.beneficios?.map((b) => [b.canal, b.valor, b.alvo ?? null])) === JSON.stringify([["defesa", 2, null], ["bonusTR", 2, "vontade"]]), est);
    check("acúmulo do Estilo declarado", est?.acumulo?.regra === "estilo");
    check("sem erro de página", !etapa.erros.length, etapa.erros);
    await ctx.close();
  }

  /* ============ R ============ */
  const { ctx, p } = await contexto([R, { ...R, id: "teste-pacotes-kai-2", name: "Kai Gêmeo (Teste Pacotes)" }]);
  const chaveOp = (arq, nome) => `recebido:${arq.emissor.id}:${arq.pacote.id}:${arq.opcoes.find((o) => o.nome === nome).id}`;
  async function importa(arquivo) {
    await externa(p);
    await p.locator("[data-abrir-importar]").click();
    await p.locator("[data-arquivo-pacote]").setInputFiles(arquivo);
    await espera(p, 300);
    await p.locator("[data-resumo-importacao], [data-importacao-recusada]").first().waitFor();
    return p.locator("[data-resumo-importacao]").count().then(async (n) => (n ? p.locator("[data-resumo-importacao]").getAttribute("data-estado") : "recusado"));
  }
  async function ativa(chave) {
    await p.locator(`[data-chave-opcao="${chave}"] button.k-item`).click();
    await p.locator(`[data-ativar-recebido="${chave}"]`).click();
    await espera(p, 450);
  }

  passo("aliado importa sem ativar");
  await abre(p, R.name);
  const base0 = await stats(p);
  const s0 = await sessao(p, R.id);
  const estado = await importa(`${TMP}/pacote-yuki-rev1.json`);
  check("o resumo diz Pacote Novo antes de gravar", estado === "novo", estado);
  check("o resumo lista as opções", (await p.locator("[data-opcoes-importadas] li").count()) === arquivos.aRev1.opcoes.length);
  check("nada gravado antes de Salvar", !(await ficha(p, R.id)).pacotesRecebidos);
  await p.screenshot({ path: `${DIR}/e2e-${TAG}-importar-resumo.png` });
  await p.locator("[data-salvar-importacao]").click();
  await espera(p, 700);
  let fr = await ficha(p, R.id);
  check("a biblioteca foi gravada no personagem", fr.pacotesRecebidos?.length === 1 && fr.pacotesRecebidos[0].opcoes.length === arquivos.aRev1.opcoes.length);
  const s1 = await sessao(p, R.id);
  const pe0 = await energiaTela(p);
  check("importar não ativou nada nem cobrou", !(s1?.buffs ?? []).some((b) => b.rec) && (s1?.peAtual ?? null) === (s0?.peAtual ?? null));
  check("os números não mudaram ao importar", JSON.stringify(await stats(p)) === JSON.stringify(base0), { antes: base0, depois: await stats(p) });
  check("a outra ficha do mesmo navegador não recebeu a biblioteca", !(await ficha(p, "teste-pacotes-kai-2")).pacotesRecebidos);
  await p.screenshot({ path: `${DIR}/e2e-${TAG}-recebidos.png` });

  passo("mesmo arquivo de novo");
  check("reimportar o mesmo arquivo diz Já Está na Biblioteca", (await importa(`${TMP}/pacote-yuki-rev1.json`)) === "igual");
  check("e não deixa salvar de novo", await p.locator("[data-salvar-importacao]").isDisabled());
  await p.locator("[data-cancelar-importacao]").click();
  check("a biblioteca continua com uma entrada", (await ficha(p, R.id)).pacotesRecebidos.length === 1);

  passo("arquivo inválido");
  fs.writeFileSync(`${TMP}/pacote-invalido.json`, JSON.stringify({ ...arquivos.aRev1, versao: 99 }));
  check("versão desconhecida é recusada inteira", (await importa(`${TMP}/pacote-invalido.json`)) === "recusado");
  check("e não grava nada", (await ficha(p, R.id)).pacotesRecebidos.length === 1 && JSON.stringify((await ficha(p, R.id)).pacotesRecebidos) === JSON.stringify(fr.pacotesRecebidos));
  const ruim = JSON.parse(JSON.stringify(arquivos.aRev1));
  ruim.opcoes[0].beneficios[0].valor = "3";
  ruim.opcoes[1].beneficios[0].canal = "hpMult";
  fs.writeFileSync(`${TMP}/pacote-opcoes-ruins.json`, JSON.stringify(ruim));
  const estadoRuim = await importa(`${TMP}/pacote-opcoes-ruins.json`);
  const recusadas = await p.locator("[data-opcoes-recusadas] li").allTextContents();
  check("opções ruins ficam de fora com motivo, e o resto entra", estadoRuim === "diferente" && recusadas.length === 2, { estadoRuim, recusadas });
  await p.locator("[data-cancelar-importacao]").click();

  passo("ativar oito opções de famílias diferentes");
  await abre(p, R.name);
  await emCombate(p);
  const antes = await stats(p);
  await externa(p);
  const nomes = ["Aura do Bastião", "Aura do Comandante Evoluída", "Escudo Dourado", "Bênção Tripla", "Nue · Escudo de Raios", "Nue · Halo", "Nue · Faíscas", "Nue · Clareza", "Presença Inspiradora", "Inimigo Comum", "Táticas Defensivas"];
  for (const n of nomes) await ativa(chaveOp(arquivos.aRev1, n));
  const s2 = await sessao(p, R.id);
  const insts = (s2.buffs ?? []).filter((b) => b.pacote);
  check("uma instância por opção ativada", insts.length === nomes.length, insts.map((b) => b.origemNome));
  check("cada instância guarda a origem e a revisão", insts.every((b) => b.pacote.revisao === 1 && b.pacote.emissorNome === A.name && b.aplicadoPor === A.name));
  check("prazo contado a partir da ativação: Escudo Dourado 2 rodadas, Bênção Tripla 1", insts.find((b) => b.origemNome === "Escudo Dourado")?.rodadas === 2 && insts.find((b) => b.origemNome === "Bênção Tripla")?.rodadas === 1);
  check("alcance e manutenção não ganham rodadas", insts.filter((b) => ["alcance", "mantida", "cena", "permanente"].includes(b.pacote.duracao.tipo)).every((b) => b.rodadas == null));
  check("nada foi cobrado do aliado", s2.peAtual === pe0 && (await energiaTela(p)) === pe0, { antes: pe0, depois: s2.peAtual });
  /* Clique duplo numa opção já ativa: o botão some (vira Abrir nos Ativos) e a sessão não ganha outra. */
  await p.locator(`[data-chave-opcao="${chaveOp(arquivos.aRev1, "Aura do Bastião")}"] button.k-item`).click();
  check("a opção ativa não oferece Ativar de novo", (await p.locator(`[data-ativar-recebido="${chaveOp(arquivos.aRev1, "Aura do Bastião")}"]`).count()) === 0);
  await p.locator("[data-voltar-ativos]").click();
  await espera(p, 500);
  const depois = await stats(p);
  /* Defesa: Bastião 3 + Feitiços 2 (Escudo e Bênção empatam: vale uma vez) + auxílio 4 + Aura de Defesa 2. */
  check("Defesa soma 11 (Bastião 3, Feitiços 2 uma vez, auxílio 4, aura 2)", depois.defesa - antes.defesa === 11, { antes, depois });
  check("Iniciativa não foi tocada", depois.iniciativa === antes.iniciativa);
  await p.screenshot({ path: `${DIR}/e2e-${TAG}-ativos.png` });
  await abre(p, R.name, false);
  const classica = await stats(p);
  check("a ficha clássica mostra os MESMOS números", JSON.stringify(classica) === JSON.stringify(depois), { g2: depois, classica });
  await p.screenshot({ path: `${DIR}/e2e-${TAG}-classica.png` });
  await abre(p, R.name);

  passo("prazo e expiração");
  await p.getByRole("button", { name: "Próxima rodada", exact: true }).click();
  await espera(p, 500);
  let s3 = await sessao(p, R.id);
  check("a Bênção Tripla (1 rodada) expirou e o Escudo Dourado tem 1", !s3.buffs.some((b) => b.origemNome === "Bênção Tripla") && s3.buffs.find((b) => b.origemNome === "Escudo Dourado")?.rodadas === 1);
  await p.getByRole("button", { name: "Próxima rodada", exact: true }).click();
  await espera(p, 500);
  s3 = await sessao(p, R.id);
  check("o Escudo Dourado expirou na segunda virada", !s3.buffs.some((b) => b.origemNome === "Escudo Dourado"));
  check("o que não tem rodadas segue ativo", s3.buffs.filter((b) => b.pacote).length === nomes.length - 2);
  fr = await ficha(p, R.id);
  check("expirar não mexeu na biblioteca", fr.pacotesRecebidos[0].opcoes.some((o) => o.nome === "Escudo Dourado") && fr.pacotesRecebidos[0].opcoes.some((o) => o.nome === "Bênção Tripla"));

  passo("encerrar e reativar");
  await efeitos(p);
  const cartaoB = (await sessao(p, R.id)).buffs.find((b) => b.origemNome === "Aura do Bastião");
  await p.locator(`[data-chave-ativo="rec:${cartaoB.id}"]`).click();
  await p.locator(`[data-encerrar="rec:${cartaoB.id}"]`).click();
  await espera(p, 500);
  check("encerrar tira a instância", !(await sessao(p, R.id)).buffs.some((b) => b.origemNome === "Aura do Bastião"));
  check("e a opção fica na biblioteca", (await ficha(p, R.id)).pacotesRecebidos[0].opcoes.some((o) => o.nome === "Aura do Bastião"));
  /* Os Encerrados do G2: abrir a lista, Reativar, e confirmar (uma ativação NOVA da opção da biblioteca). */
  const toggle = p.locator("[data-encerrados-toggle]").first();
  check("Encerrados lista o Bastião para reativar", (await toggle.count()) > 0);
  if (await toggle.count()) {
    if ((await toggle.getAttribute("aria-expanded")) !== "true") await toggle.click();
    await p.locator(`[data-reativar-g2="rec:${cartaoB.id}"]`).click();
    await p.locator("[data-confirmar-reativar]").click();
    await espera(p, 400);
    const nova = (await sessao(p, R.id)).buffs.find((b) => b.origemNome === "Aura do Bastião");
    check("reativar cria uma instância nova, com outro id", !!nova && nova.id !== cartaoB.id, nova);
  }

  passo("nova revisão e segundo emissor");
  const icAntes = (await sessao(p, R.id)).buffs.find((b) => b.origemNome === "Inimigo Comum");
  check("revisão 2 é reconhecida como Nova Revisão", (await importa(`${TMP}/pacote-yuki-rev2.json`)) === "revisao");
  await p.locator("[data-salvar-importacao]").click();
  await espera(p, 600);
  fr = await ficha(p, R.id);
  check("a biblioteca foi atualizada para a revisão 2, sem duplicar", fr.pacotesRecebidos.length === 1 && fr.pacotesRecebidos[0].revisao === 2);
  const icDepois = (await sessao(p, R.id)).buffs.find((b) => b.origemNome === "Inimigo Comum");
  check("a instância ativa conserva o valor e o prazo de antes", JSON.stringify(icDepois) === JSON.stringify(icAntes));
  check("o segundo emissor entra ao lado", (await importa(`${TMP}/pacote-rin-rev1.json`)) === "novo");
  await p.locator("[data-salvar-importacao]").click();
  await espera(p, 600);
  fr = await ficha(p, R.id);
  check("dois pacotes de dois emissores coexistem", fr.pacotesRecebidos.length === 2 && new Set(fr.pacotesRecebidos.map((x) => x.emissor.id)).size === 2);

  passo("descanso, recarga e criador");
  await p.getByRole("button", { name: "Descanso", exact: true }).first().click();
  await espera(p, 600);
  let s4 = await sessao(p, R.id);
  check("o descanso tira o que é de cena e deixa o permanente", s4.buffs.filter((b) => b.pacote).map((b) => b.origemNome).join(",") === "Táticas Defensivas", s4.buffs.map((b) => b.origemNome));
  fr = await ficha(p, R.id);
  check("a biblioteca sobrevive ao descanso", fr.pacotesRecebidos.length === 2);
  await abre(p, R.name);
  s4 = await sessao(p, R.id);
  check("recarregar não reativa nada sozinho", s4.buffs.filter((b) => b.pacote).length === 1);
  check("a biblioteca sobrevive à recarga", (await ficha(p, R.id)).pacotesRecebidos.length === 2);
  /* O criador grava a ficha inteira: a biblioteca não pode sumir. */
  await p.getByRole("button", { name: "Mais opções da ficha" }).first().click();
  const lapis = p.locator("[data-menu-editar]");
  if (await lapis.count()) {
    await lapis.first().click();
    await espera(p, 1500);
    const salvar = p.getByRole("button", { name: /^Salvar/ }).first();
    if (await salvar.count()) { await salvar.click(); await espera(p, 1000); }
    check("salvar no criador conserva a biblioteca", (await ficha(p, R.id)).pacotesRecebidos?.length === 2, (await ficha(p, R.id)).pacotesRecebidos?.length);
  } else check("o botão Editar existe na ficha", false);
  /* O export e import da ficha inteira copiam a criatura com outro id (useCreatureStorage.importMany). */
  await p.evaluate(({ chave, id }) => { const l = JSON.parse(localStorage.getItem(chave)); const c = JSON.parse(JSON.stringify(l.find((x) => x.id === id))); c.id = "teste-pacotes-kai-importado"; c.name = "Kai Importado (Teste Pacotes)"; l.push(c); localStorage.setItem(chave, JSON.stringify(l)); }, { chave: CHAVE, id: R.id });
  await abre(p, "Kai Importado (Teste Pacotes)");
  const imp = await ficha(p, "teste-pacotes-kai-importado");
  check("a ficha importada traz a biblioteca", imp.pacotesRecebidos?.length === 2);
  check("e nenhuma instância ativa", !((await sessao(p, "teste-pacotes-kai-importado"))?.buffs ?? []).some((b) => b.pacote));
  check("sem erro de página", !etapa.erros.length, etapa.erros);
  await ctx.close();
} catch (e) {
  out.excecao = e.stack;
  out.falhas.push({ etapa: etapa?.nome, excecao: e.message });
} finally {
  for (const f of fs.readdirSync(TMP)) fs.copyFileSync(`${TMP}/${f}`, `${DIR}/${f}`);
  salva();
  await browser.close();
}
console.log(JSON.stringify({ etapas: out.etapas.map((x) => `${x.nome}: ${x.checks.filter((c) => c.ok).length}/${x.checks.length}`), falhas: out.falhas }, null, 1));
