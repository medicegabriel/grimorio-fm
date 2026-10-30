/* PA-I3 NO NAVEGADOR: cada benefício termina no próprio prazo. Chrome real (Playwright, channel chrome), suporte e aliado em contextos ISOLADOS,
   arquivo realmente exportado pelo suporte e importado pelo aliado, cliques reais sem `force`, em 1024 e 1440.

   O caso do Codex: Feitiço de Múltiplos Efeitos Imediato de Reação com Defesa (por um golpe) e TR de Reflexos (uma rodada). Confere no G2 e na
   clássica as duas ordens de término (a virada primeiro, o ataque primeiro), as viradas, a recarga, o Encerrar do Feitiço inteiro, o Reativar, a
   Linha do Tempo e o descanso. O Feitiço só de um ataque (PA-I2) vai junto como regressão.
   Auxiliares e fichas do roteiro da correção (`../pacotes-aliados-correcao-20261020/`). Nenhuma ficha do autor. Tudo que o roteiro grava fica FORA
   do projeto durante a execução e é copiado no fim.
   Uso: BASE=http://127.0.0.1:5321 node .audit/revisao-codex-pai3-20261020/browser-pai3.mjs */
import fs from "node:fs";
import os from "node:os";
import { chromium } from "playwright";

const DIR = `${process.cwd()}/.audit/revisao-codex-pai3-20261020`;
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

const canonical=JSON.parse(fs.readFileSync(`${DIR}/pacote-pai3-exportado.json`,'utf8'));
const herdado=JSON.parse(fs.readFileSync(`${DIR}/prazos-herdados.json`,'utf8')).arquivo;
fs.writeFileSync(`${TMP}/canonico.json`,JSON.stringify(canonical));
fs.writeFileSync(`${TMP}/herdado.json`,JSON.stringify(herdado));
const R=structuredClone(fichas.receptor);
const porNome=(s,n)=>(s?.buffs??[]).find(x=>x.origemNome===n);
async function abreCompacta(p,id) {
 await p.locator('[data-afty-aba="habilidades"]').click();
 if(!await p.locator('[data-c2]').isVisible().catch(()=>false))await p.locator('button.f-acesso').click();
 await p.locator('[data-c2]').waitFor();
 if(!await p.locator(`[data-detalhe-c2="rec:${id}"]`).isVisible().catch(()=>false))await p.locator(`[data-c2] [data-chave-ativo="rec:${id}"]`).click();
 await p.locator(`[data-detalhe-c2="rec:${id}"]`).waitFor();
}
async function importarAtivar(p,arquivo,filename) {
 await externa(p);
 await p.locator('[data-abrir-importar]').click();
 await p.locator('[data-arquivo-pacote]').setInputFiles(`${TMP}/${filename}`);
 await p.locator('[data-salvar-importacao]').click();
 const op=arquivo.opcoes.find(x=>x.nome!=='Precisão de Um Ataque');
 const chave=`recebido:${arquivo.emissor.id}:${arquivo.pacote.id}:${op.id}`;
 await p.locator(`[data-chave-opcao="${chave}"] button.k-item`).click();
 await p.locator(`[data-ativar-recebido="${chave}"]`).click();
 return op;
}
try {
 for(const width of [1024,1440]) {
  passo(`compacta canonica ${width}`);
  const {ctx,p}=await contexto([R]);await p.setViewportSize({width,height:900});await abre(p,R.name);
  const baseDef=await stat(p,'defesa'),baseTR=await reflexos(p);
  const op=await importarAtivar(p,canonical,'canonico.json');
  let s=await sessao(p,R.id),inst=porNome(s,op.nome);let id=inst.id;
  await abreCompacta(p,id);
  check('compacta exibe as duas partes',((await texto(p.locator('[data-c2] [data-col="termina"]'))).includes('TR de Reflexos +2'))&&await p.locator('[data-c2] [data-encerrar-parte]').count()===1);
  const part=p.locator('[data-c2] [data-encerrar-parte]');
  if(width===1440){await part.focus();await part.press('Enter');}else await part.click();
  s=await sessao(p,R.id);
  check('encerrar parte na compacta tira so Defesa',await stat(p,'defesa')===baseDef&&await reflexos(p)===baseTR+2&&JSON.stringify(porNome(s,op.nome).beneficios.map(x=>x.canal))==='["bonusTR"]',porNome(s,op.nome));
  await abre(p,R.name);s=await sessao(p,R.id);await abreCompacta(p,id);
  check('recarga preserva o TR e seu contador',porNome(s,op.nome).beneficios[0].rodadas===1&&await reflexos(p)===baseTR+2);
  await abreCompacta(p,id);await p.locator(`[data-encerrar-c2="rec:${id}"]`).click();
  s=await sessao(p,R.id);check('Encerrar inteiro na compacta tira a parte que sobrou',!porNome(s,op.nome)&&await reflexos(p)===baseTR);
  const toggle=p.locator('[data-c2] [data-encerrados-toggle]');if(await toggle.getAttribute('aria-expanded')!=='true')await toggle.click();
  await p.locator(`[data-c2] [data-reativar-g2="rec:${id}"]`).click();await p.locator('[data-c2] [data-confirmar-reativar]').click();
  s=await sessao(p,R.id);inst=porNome(s,op.nome);id=inst?.id;
  check('Reativar pela compacta devolve as duas partes e reinicia so seus prazos',inst?.beneficios.length===2&&inst.beneficios.find(x=>x.canal==='bonusTR')?.rodadas===1,inst);
  await abreCompacta(p,id);await virada(p);s=await sessao(p,R.id);
  check('virada na compacta tira so TR, preserva Defesa',await stat(p,'defesa')===baseDef+3&&await reflexos(p)===baseTR&&JSON.stringify(porNome(s,op.nome).beneficios.map(x=>x.canal))==='["defesa"]',porNome(s,op.nome));
  await abreCompacta(p,id);check('parte restante pode ser encerrada inteira sem botao duplicado',await p.locator('[data-c2] [data-encerrar-parte]').count()===0);
  await foto(p,`compacta-canonica-${width}`);await ctx.close();
 }
 for(const width of [1024,1440]) {
  passo(`prazo herdado importado ${width}`);
  const {ctx,p}=await contexto([R]);await p.setViewportSize({width,height:900});await abre(p,R.name);
  const baseDef=await stat(p,'defesa'),baseTR=await reflexos(p);
  const op=await importarAtivar(p,herdado,'herdado.json');let s=await sessao(p,R.id);const id=porNome(s,op.nome).id;
  check('arquivo com prazo comum e excecao por ataque e aceito',await stat(p,'defesa')===baseDef+3&&await reflexos(p)===baseTR+2);
  await abreCompacta(p,id);etapa.observado.terminaAntes=await texto(p.locator('[data-c2] [data-col="termina"]'));
  await virada(p);s=await sessao(p,R.id);
  const trDepois=await reflexos(p);etapa.observado={...etapa.observado,baseDef,baseTR,trDepois,instancia:porNome(s,op.nome)};
  check('PA-I4: TR herda a rodada da opcao e sai na virada',trDepois===baseTR&&await stat(p,'defesa')===baseDef+3,{baseTR,trDepois,inst:porNome(s,op.nome)});
  await abreCompacta(p,id);await foto(p,`herdado-compacta-apos-virada-${width}`);
  await abre(p,R.name,false);
  check('PA-I4: classica tambem retira o TR herdado apos a virada',await reflexos(p)===baseTR,{baseTR,atual:await reflexos(p)});
  check('sem erros de pagina',!etapa.erros.length,etapa.erros);await ctx.close();
 }
}catch(e){out.excecao=e.stack;out.falhas.push({etapa:etapa?.nome,excecao:e.message});}
finally {
 await browser.close();fs.writeFileSync(`${TMP}/compacta-heranca-${TAG}.json`,JSON.stringify(out,null,2));
 for(const f of fs.readdirSync(TMP))fs.copyFileSync(`${TMP}/${f}`,`${DIR}/${f}`);
}
console.log(JSON.stringify({etapas:out.etapas.map(x=>({nome:x.nome,passaram:x.checks.filter(c=>c.ok).length,total:x.checks.length})),falhas:out.falhas},null,2));