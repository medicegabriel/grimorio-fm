/* PACOTES PARA ALIADOS NO NAVEGADOR (2026-10-19). Chrome real (Playwright, channel chrome), um contexto ISOLADO por "computador":
     A  o suporte Yuki (sintético) monta e exporta o pacote, e exporta a revisão 2 depois de mudar a Presença;
     B  o suporte Rin (sintético, Sem Técnica) exporta o Estilo;
     R  o aliado Kai (sintético) importa os arquivos, ativa, conta prazo, encerra, reativa, descansa e recarrega.
   Nenhuma ficha do autor: todas levam "(Teste Pacotes)" e entram só no localStorage do contexto de teste. Cliques reais, sem `force`.
   Uso: BASE=http://127.0.0.1:5321 node .audit/revisao-codex-pacotes-20261020/e2e.mjs */
import fs from "node:fs";
import os from "node:os";
import { chromium } from "playwright";

const DIR = `${process.cwd()}/.audit/revisao-codex-pacotes-20261020`;
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

const A=structuredClone(fichas.suporteA),R=structuredClone(fichas.receptor);
A.feiticos.push({id:'codex-um-ataque',nome:'Precisão de Um Ataque',tipo:'auxiliar',nivel:1,efeitoAux:'ataque',duracaoAux:'imediata',umGolpe:true});
const selecionadas=['aptidao|aura_do_bastiao','aptidao|aura_do_comandante','feitico|tp-f1','feitico|tp-f2','invAux|tp-inv1|tp-a1','invAura|tp-inv1|tp-c1','invAura|tp-inv1|tp-c2','habilidade|sup_presenca_inspiradora','feitico|codex-um-ataque'];
const key=(arq,n)=>`recebido:${arq.emissor.id}:${arq.pacote.id}:${arq.opcoes.find(x=>x.nome===n).id}`;
const nomes=['Aura do Bastião','Aura do Comandante','Escudo Dourado','Bênção Tripla','Nue · Escudo de Raios','Nue · Halo','Nue · Faíscas','Presença Inspiradora','Precisão de Um Ataque'];
async function importar(p,path){await externa(p);await p.locator('[data-abrir-importar]').click();await p.locator('[data-arquivo-pacote]').setInputFiles(path);await p.locator('[data-resumo-importacao],[data-importacao-recusada]').first().waitFor();}
async function ativar(p,arq,n,double=false){await p.locator(`[data-chave-opcao="${key(arq,n)}"] button.k-item`).click();const btn=p.locator(`[data-ativar-recebido="${key(arq,n)}"]`);if(double)await btn.dblclick({delay:15});else await btn.click();}
let arq;
try{
 passo('suporte cria e exporta pacote por clique real');
 const {ctx,p}=await contexto([A]);await abre(p,A.name);const energiaAntes=await energiaTela(p),sAntes=await sessao(p,A.id);
 await montaPacote(p,{nome:'Pacote Codex de Dez Fontes',fontes:selecionadas});
 await p.locator('[data-adicionar-efeito]').click();await p.getByRole('button',{name:'Definir um efeito à mão',exact:true}).click();
 await p.locator('[data-campo="manual-nome"]').fill('Bastião Condicional');await p.locator('[data-campo="manual-origem"]').fill('Aura do Basti');
 await p.getByRole('option',{name:/Aura do Bastião/}).click();await p.locator('[data-campo="manual-valor-0"]').fill('5');await p.getByLabel('Só em Combate',{exact:true}).check();
 await p.locator('[data-campo="manual-duracao"]').selectOption('alcance');await p.locator('[data-salvar-pacote]').click();
 arq=await exporta(p,'pacote-codex-exportado.json');
 check('arquivo baixado tem dez opcoes de quatro familias',arq.opcoes.length===10&&new Set(arq.opcoes.map(x=>x.familia)).size>=4,{total:arq.opcoes.length});
 const sg=await sessao(p,A.id);check('montagem e exportacao nao gastam energia nem ligam estados',await energiaTela(p)===energiaAntes&&JSON.stringify(sg?.combate??{})===JSON.stringify(sAntes?.combate??{}));
 const single=arq.opcoes.find(x=>x.nome==='Precisão de Um Ataque');check('um ataque conserva prazo de uso, sem rodada inventada',single?.duracao.tipo==='proximo',single?.duracao);
 await p.setViewportSize({width:1024,height:768});await p.locator('.k-fila[data-item]').filter({hasText:'Bastião Condicional'}).locator('.k-item').click();
 const medidas=await p.locator('[data-para-aliados] .k-corpo').evaluate(el=>[...el.children].map(x=>({tag:x.tagName,scroll:x.scrollWidth,width:x.clientWidth,left:x.getBoundingClientRect().left,right:x.getBoundingClientRect().right})));
 check('painel do suporte nao vaza em 1024',medidas.every(x=>x.scroll<=x.width+2),medidas);await p.screenshot({path:DIR+'/suporte-1024.png'});await ctx.close();
 for(const width of [1024,1440]){
  passo('aliado importa e usa, largura '+width);const {ctx,p}=await contexto([R]);await p.setViewportSize({width,height:900});await abre(p,R.name);
  const base=await stat(p,'defesa'),pe=await energiaTela(p);await importar(p,TMP+'/pacote-codex-exportado.json');
  check('conferir arquivo nao grava biblioteca ou ativa',!(await ficha(p,R.id)).pacotesRecebidos&&!((await sessao(p,R.id))?.buffs??[]).length);
  check('resumo da importacao lista dez opcoes',await p.locator('[data-opcoes-importadas] li').count()===10);
  await p.locator('[data-salvar-importacao]').click();await espera(p,700);
  check('salvar biblioteca nao muda energia nem numeros',await stat(p,'defesa')===base&&await energiaTela(p)===pe&&(await ficha(p,R.id)).pacotesRecebidos?.length===1);
  await ativar(p,arq,'Aura do Bastião',true);await ativar(p,arq,'Bastião Condicional');let s=await sessao(p,R.id);
  check('clique duplo so cria uma instancia',s.buffs.filter(x=>x.origemNome==='Aura do Bastião').length===1);
  check('fora de combate maior inelegivel nao apaga menor',await stat(p,'defesa')===base+3,{base,atual:await stat(p,'defesa')});await p.screenshot({path:DIR+'/condicao-fora-'+width+'.png'});
  await emCombate(p);await espera(p,700);check('em combate vale o maior elegivel',await stat(p,'defesa')===base+5,{base,atual:await stat(p,'defesa')});
  await abre(p,R.name,false);check('classica ve mesmo numero com os dois ativos',await stat(p,'defesa')===base+5);await abre(p,R.name,true);await externa(p);
  await p.locator(`[data-chave-opcao="${key(arq,'Bastião Condicional')}"] button.k-item`).click();await p.locator('[data-encerrar-recebido]').click();
  for(const n of nomes.slice(1))await ativar(p,arq,n);
  s=await sessao(p,R.id);check('nove opcoes coexistem sem gasto do aliado',s.buffs.length===9&&await energiaTela(p)===pe,s.buffs.map(x=>x.origemNome));
  check('familias somam sem duplicar feiticos',await stat(p,'defesa')===base+11,{base,atual:await stat(p,'defesa')});
  await p.locator(`[data-chave-opcao="${key(arq,'Precisão de Um Ataque')}"] button.k-item`).click();await p.screenshot({path:DIR+'/um-ataque-'+width+'.png'});
  await p.getByRole('button',{name:'Próxima rodada',exact:true}).click();s=await sessao(p,R.id);
  check('virada conserva efeito de um ataque ainda nao utilizado',s.buffs.some(x=>x.origemNome==='Precisão de Um Ataque'),s.buffs.map(x=>[x.origemNome,x.rodadas]));
  check('fontes de rodadas contam independentemente',s.buffs.find(x=>x.origemNome==='Escudo Dourado')?.rodadas===1&&!s.buffs.some(x=>x.origemNome==='Bênção Tripla'));
  await abre(p,R.name,true);check('recarga conserva biblioteca e ativos remanescentes',(await ficha(p,R.id)).pacotesRecebidos[0].opcoes.length===10&&(await sessao(p,R.id)).buffs.length===s.buffs.length);
  await p.getByRole('button',{name:'Descanso',exact:true}).first().click();s=await sessao(p,R.id);check('descanso nao remove biblioteca ou religa instancias',(await ficha(p,R.id)).pacotesRecebidos[0].opcoes.length===10&&!s.buffs.some(x=>x.pacote));
  check('sem erro de pagina',!etapa.erros.length,etapa.erros);await ctx.close();
 }
}catch(e){out.excecao=e.stack;out.falhas.push({etapa:etapa?.nome,excecao:e.message});}
finally{for(const f of fs.readdirSync(TMP))fs.copyFileSync(TMP+'/'+f,DIR+'/'+f);salva();await browser.close();}
console.log(JSON.stringify({etapas:out.etapas.map(x=>({nome:x.nome,total:x.checks.length,passaram:x.checks.filter(c=>c.ok).length})),falhas:out.falhas},null,2));
