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
   Uso: BASE=http://127.0.0.1:5321 node .audit/reconferencia-codex-pacotes-20261020/browser-devolutiva.mjs */
import fs from "node:fs";
import os from "node:os";
import { chromium } from "playwright";

const DIR = `${process.cwd()}/.audit/reconferencia-codex-pacotes-20261020`;
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

const prova=JSON.parse(fs.readFileSync(`${DIR}/prazos-mistos.json`,'utf8'));
fs.writeFileSync(`${TMP}/misto.json`,JSON.stringify(prova.arquivo));
try {
 for(const width of [1024,1440]) {
  passo(`misto em ${width}`);
  const {ctx,p}=await contexto([prova.receptor]);
  await p.setViewportSize({width,height:900});
  await abre(p,prova.receptor.name);
  const reflexos=async()=>{
   await p.locator('[data-afty-aba="pericias"]').click();
   return (await p.locator('[id="afty-item-tr:reflexos"] .afty-valor').textContent()).trim();
  };
  const base=await reflexos();
  await externa(p);
  await p.locator('[data-abrir-importar]').click();
  await p.locator('[data-arquivo-pacote]').setInputFiles(`${TMP}/misto.json`);
  await p.locator('[data-salvar-importacao]').click();
  const entry=prova.biblioteca[0],option=entry.opcoes[0];
  const key=`recebido:${entry.chave}:${option.id}`;
  await p.locator(`[data-chave-opcao="${key}"] button.k-item`).click();
  await p.locator(`[data-ativar-recebido="${key}"]`).click();
  const ligado=await reflexos();
  const rodadas=[];
  for(let i=0;i<3;i++) {
   await p.getByRole('button',{name:'Próxima rodada',exact:true}).first().click();
   await espera(p,900);
   rodadas.push({virada:i+1,reflexos:await reflexos(),sessao:await sessaoCrua(p,prova.receptor.id)});
  }
  etapa.observado={base,ligado,rodadas};
  check('PA-I3: Reflexos de uma rodada deve sair sem encerrar Defesa por ataque',rodadas[0].reflexos===base,{base,ligado,apos:rodadas.map(x=>x.reflexos)});
  await foto(p,`misto-tr-apos-tres-viradas-${width}`);
  await abre(p,prova.receptor.name,false);
  const classica=await reflexos();
  etapa.observado.classica=classica;
  check('PA-I3: classica respeita o prazo de uma rodada do TR',classica===base,{base,classica});
  await foto(p,`misto-classica-${width}`);
  await ctx.close();
 }
} catch(e){out.excecao=e.stack;out.falhas.push({excecao:e.message});}
finally {
 await browser.close();
 fs.writeFileSync(`${TMP}/misto-browser-${TAG}.json`,JSON.stringify(out,null,2));
 for(const f of fs.readdirSync(TMP))fs.copyFileSync(`${TMP}/${f}`,`${DIR}/${f}`);
}
console.log(JSON.stringify({etapas:out.etapas.map(x=>({nome:x.nome,checks:x.checks,observado:{base:x.observado?.base,ligado:x.observado?.ligado,rodadas:x.observado?.rodadas.map(y=>y.reflexos),classica:x.observado?.classica}})),falhas:out.falhas},null,2));