import fs from 'node:fs';
import {chromium} from 'playwright';
const ROOT=process.cwd(),DIR=ROOT+'/.audit/revisao-codex-integracao-g2-20261019';
const BASE=process.env.BASE??'http://127.0.0.1:5310';
const samples=JSON.parse(fs.readFileSync('C:/Projetos/Grimorio/prototipos/ficha-final-v2/dados/amostras.json','utf8')).amostras;
const b=await chromium.launch({channel:'chrome'});
const out={geradoEm:new Date().toISOString(),base:BASE,casos:[],falhas:[]};
const AC='especializacao:cmb_ataque_concentrado',GE='especializacao:cmb_golpe_especial';
const eq=(a,z)=>JSON.stringify(a)===JSON.stringify(z);
const energy=s=>Math.max(0,s.peAtual)+Object.values(s.peTempFontes??{}).reduce((a,x)=>a+x,0);
const semRegistro=s=>{const {operacoes,...x}=s;return x;};
const semPE=s=>{const {peAtual,peTempFontes,operacoes,...x}=s;return x;};
const save=()=>fs.writeFileSync(DIR+'/browser.json',JSON.stringify(out,null,2));
const wait=p=>p.waitForTimeout(800);
function check(r,id,ok,d){r.checks.push({id,ok:!!ok,dados:d});if(!ok)out.falhas.push({caso:r.id,id,dados:d});}
async function snap(p,f){await wait(p);return p.evaluate(id=>JSON.parse(localStorage.getItem('fm_ficha_sessao_afty_v1:'+id)),f.id);}
async function go(p,f,g2=true){const route=f.rulesVersion==='player'?'Player':'Afty';await p.goto(BASE+'/'+route+(g2?'?ficha-g2=1':''),{waitUntil:'networkidle'});await p.getByText(f.name,{exact:true}).first().click();await p.locator('#afty-ficha').waitFor();await wait(p);}
async function scenario(id,sample,w,run){const ctx=await b.newContext({viewport:{width:w,height:w===1024?720:900}}),p=await ctx.newPage();p.setDefaultTimeout(6500);const f={...samples.find(x=>x.id===sample).ficha,id:'codex-review-'+sample};const r={id,checks:[],erros:[]};out.casos.push(r);p.on('pageerror',e=>r.erros.push(e.message));
try{await p.goto(BASE+'/'+(f.rulesVersion==='player'?'Player':'Afty'),{waitUntil:'domcontentloaded'});await p.evaluate(f=>localStorage.setItem('fm_creatures_'+(f.rulesVersion==='player'?'player':'afty')+'_v1',JSON.stringify([f])),f);await go(p,f);await run(p,r,f);check(r,'sem erro de página',!r.erros.length,r.erros);}
catch(e){r.exception=e.stack;out.falhas.push({caso:r.id,exception:e.message});await p.screenshot({path:DIR+'/'+id+'-erro.png'}).catch(()=>{});}finally{save();await ctx.close();console.log(id+': '+r.checks.filter(x=>x.ok).length+'/'+r.checks.length+(r.exception?' EXCEPTION':''));}}
async function effects(p){await p.locator('[data-afty-aba="buffs"]').click();}
async function prep(p,name,key){if(!await p.locator('[data-busca-catalogo]').isVisible())await p.getByRole('button',{name:/Adicionar/}).first().click();await p.locator('[data-busca-catalogo]').fill(name);await p.locator('[data-chave-opcao="'+key+'"] [data-tom="ativar"]').click();await p.locator('.k-detalhe [data-confirmar]').waitFor();return p.locator('.k-detalhe');}
async function menu(p,id){await p.getByRole('button',{name:'Mais opções da ficha',exact:true}).click();await p.locator('[data-menu-'+id+']').click();}
async function combate(p){const off=p.getByRole('button',{name:/Fora de Combate/});if(await off.count())await off.click();}
async function engine(p,f,kind,args={}){return p.evaluate(async({f,kind,args})=>{const {mesclaFichaAfty}=await import('/src/systems/afty/afty-schema.js');const {prepararCalculo}=await import('/src/systems/afty/ficha/efeitos/recebidos.js');const S=await import('/src/systems/afty/ficha/ficha-sessao.js');const R=await import('/src/systems/afty/ficha/efeitos/repertorio.js');const P=await import('/src/systems/afty/ficha/efeitos/ponte.js');const s=JSON.parse(localStorage.getItem('fm_ficha_sessao_afty_v1:'+f.id)),fi=mesclaFichaAfty(f),d=prepararCalculo(fi,s).derived;
if(kind==='ac'){const e=P.comAddons(fi,()=>R.estadosDaFicha(d)).find(e=>e.id==='ataqueConcentrado');return {custo:e.custoPE(args.n),depois:S.gastaPe(S.alteraEstadoCombate(s,e,args.n,d),e.custoPE(args.n))};}
if(kind==='golpe'){const G=await import('/src/systems/afty/afty-golpe-especial.js');let z=s;for(const pr of G.PROPRIEDADES_GOLPE){const v=args.ids.includes(pr.id);z=S.marcaPropriedadeGolpe(z,pr.id,pr.max?0:v);}const custo=S.custoDoGolpeDaSessao(z,d,{seis:false}),depois=S.pagaGolpeEspecial(z,d,{seis:false});return {custo,depois};}
if(kind==='derived'){return {defesa:d.defesa,pe:d.pe,hp:d.hp,estados:P.comAddons(fi,()=>R.estadosDaFicha(d)).map(e=>({id:e.id,label:e.label,tipo:e.tipo}))};}
if(kind==='next'){const {avancaRodadaComRegistro}=await import('/src/systems/afty/ficha/efeitos/sessao-g2.js');return avancaRodadaComRegistro(s,d);}
},{f,kind,args});}

for(const w of [1024,1440])await scenario('ac-'+w,'minamoto',w,async(p,r,f)=>{
 await combate(p);await effects(p);let pre=await prep(p,'Ataque Concentrado',AC);await pre.locator('[data-valor="2"]').click();const before=await snap(p,f),ex=await engine(p,f,'ac',{n:2});await pre.locator('[data-confirmar]').dblclick({delay:15});const after=await snap(p,f);
 check(r,'confirmar cobra custo público uma vez',after.combate.ataqueConcentrado===2&&energy(before)-energy(after)===ex.custo&&after.peAtual===ex.depois.peAtual&&eq(after.peTempFontes,ex.depois.peTempFontes),{custo:ex.custo,energia:[energy(before),energy(after)]});
 check(r,'uma operação paga no histórico',Object.values(after.operacoes?.ativacoes??{}).filter(a=>a.nome==='Ataque Concentrado').length===1);
 await menu(p,'historico');const btn=p.locator('[data-estornar]').first();await btn.dblclick({delay:15});const refund=await snap(p,f);check(r,'estorno uma vez preserva efeito',energy(refund)===energy(before)&&eq(semPE(after),semPE(refund))&&refund.operacoes.eventos.filter(e=>e.tipo==='desfazer').length===1);
 await p.keyboard.press('Escape');const next=await engine(p,f,'next');await p.getByRole('button',{name:'Próxima rodada',exact:true}).click();const turned=await snap(p,f);check(r,'virada com metadados usa sessão real',eq(semRegistro(turned),semRegistro(next))&&turned.rodada===refund.rodada+1);
 await go(p,f,false);const classic=await snap(p,f);check(r,'clássica mantém sessão e não carrega CSS do G2',eq(turned,classic)&&!await p.locator('.e-g2').count()&&await p.locator('[data-afty-aba]').count()===6);
 await go(p,f,true);check(r,'voltar à prévia conserva sessão',eq(classic,await snap(p,f)));await effects(p);check(r,'cartão conserva intensidade',await p.locator('[data-chave-ativo="'+AC+'"]').innerText().then(x=>/2 de 3/.test(x)));await p.screenshot({path:DIR+'/ac-'+w+'.png'});
});

for(const w of [1024,1440])await scenario('golpe-'+w,'minamoto',w,async(p,r,f)=>{
 await combate(p);await effects(p);const pre=await prep(p,'Golpe Especial',GE),ids=['amplo','atroz','impactante','longo','penetrante','preciso','sacrificio'];for(const id of await pre.locator('[data-golpe]').evaluateAll(xs=>xs.map(x=>x.dataset.golpe))){const btn=pre.locator('[data-golpe="'+id+'"]');if((await btn.getAttribute('aria-pressed')==='true')!==ids.includes(id))await btn.click();}
 const before=await snap(p,f),ex=await engine(p,f,'golpe',{ids});await pre.locator('[data-confirmar]').scrollIntoViewIfNeeded();const geom=await pre.evaluate(el=>{const r=el.getBoundingClientRect(),a=el.closest('.k-detalhe').getBoundingClientRect(),b=el.querySelector('[data-confirmar]'),br=b.getBoundingClientRect();return {largura:r.width,painel:a.width,dentro:r.left>=a.left&&r.right<=a.right+1,recebe:b.contains(document.elementFromPoint(br.x+br.width/2,br.y+br.height/2))};});check(r,'montador dentro do painel e Confirmar alcançável',geom.dentro&&geom.recebe,geom);await pre.locator('[data-confirmar]').dblclick({delay:15});const after=await snap(p,f);check(r,'Golpe paga e aplica Sacrifício uma vez',energy(after)===energy(ex.depois)&&after.hpAtual===ex.depois.hpAtual&&after.operacoes.reusos[GE]===1,{energia:[energy(before),energy(after)],vida:[before.hpAtual,after.hpAtual]});check(r,'sete propriedades no cartão',await p.locator('[data-chave-ativo="'+GE+'"]').innerText().then(x=>/7 Propriedades/.test(x)));
 await p.locator('[data-encerrar]').click();await p.locator('[data-encerrados-toggle]').click();await p.locator('[data-reativar-g2="'+GE+'"]').click();check(r,'reativar preserva escolhas e cancelar não muda sessão',await p.locator('[data-preparo-golpe] [data-golpe][aria-pressed="true"]').count()===7);await p.locator('[data-voltar-preparo]').click();const canceled=await snap(p,f);check(r,'cancelar reativação não paga de novo',energy(canceled)===energy(after)&&canceled.hpAtual===after.hpAtual&&canceled.operacoes.reusos[GE]===1);
});

for(const sample of ['megumi','player30'])await scenario('preferencia-'+sample,sample,1280,async(p,r,f)=>{
 const before=await snap(p,f);await menu(p,'estatisticas');await p.locator('[data-estat-linha="cd"] [data-estat-mostrar]').uncheck();await p.locator('[data-estat-linha="defesa"] [data-estat-descer]').click();await p.keyboard.press('Escape');await wait(p);const stored=()=>p.evaluate(f=>JSON.parse(localStorage.getItem('fm_creatures_'+(f.rulesVersion==='player'?'player':'afty')+'_v1')).find(x=>x.id===f.id),f);const chosen=await stored();check(r,'preferência salva no personagem sem mudar jogo',chosen.preferenciasFicha.estatisticasCabecalho.ocultas.includes('cd')&&eq(before,await snap(p,f)));
 await go(p,f);check(r,'preferência persiste e CD oculta',!await p.locator('.e-stat[data-afty-stat="cd"]').count()&&eq(chosen.preferenciasFicha,(await stored()).preferenciasFicha));await menu(p,'editar');await p.getByRole('button',{name:/Salvar/}).first().click();await wait(p);check(r,'salvar no criador mantém preferência',(await stored()).preferenciasFicha.estatisticasCabecalho.ocultas.includes('cd'));
 // Nova importação isolada da serialização integral do personagem, preservando campo desconhecido para o criador.
 const exported=JSON.stringify(await stored());await p.evaluate(({f,exported})=>{const key='fm_creatures_'+(f.rulesVersion==='player'?'player':'afty')+'_v1';localStorage.setItem(key,JSON.stringify([JSON.parse(exported)]));},{f,exported});await go(p,f);check(r,'round trip do personagem conserva preferência',eq(chosen.preferenciasFicha,(await stored()).preferenciasFicha)&&!await p.locator('.e-stat[data-afty-stat="cd"]').count());
});

await scenario('fonte-compartilhada','minamoto',1280,async(p,r,f)=>{
 await combate(p);await effects(p);const def=()=>p.locator('[data-afty-stat="defesa"]').first().textContent();r.defAntes=await def();await p.getByRole('button',{name:/Adicionar/}).first().click();await p.getByRole('button',{name:'Fonte Externa',exact:true}).click();const form=p.getByRole('form',{name:'Registrar fonte externa'});await form.locator('[data-campo="origem"]').fill('Proteção de teste independente');await form.locator('[data-campo="valor-0"]').fill('7');await form.getByRole('button',{name:'Registrar',exact:true}).click();const saved=await snap(p,f);r.defG2=await def();check(r,'fonte externa registrada uma vez',saved.buffs.some(x=>x.rec&&x.beneficios?.some(b=>b.canal==='defesa'&&b.valor===7)));
 await go(p,f,false);r.defClassica=await def();const classical=await snap(p,f);check(r,'apresentações conservam o mesmo bônus registrado',r.defG2===r.defClassica,{antes:r.defAntes,g2:r.defG2,classica:r.defClassica,buffs:classical.buffs});check(r,'registro não desaparece ao alternar',eq(saved.buffs,classical.buffs));
});

await b.close();save();console.log(JSON.stringify({casos:out.casos.length,checks:out.casos.reduce((a,r)=>a+r.checks.length,0),falhas:out.falhas}));
