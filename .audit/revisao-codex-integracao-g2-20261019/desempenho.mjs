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
const save=()=>fs.writeFileSync(DIR+'/desempenho-'+new URL(BASE).port+'.json',JSON.stringify(out,null,2));
const wait=p=>p.waitForTimeout(800);
function check(r,id,ok,d){r.checks.push({id,ok:!!ok,dados:d});if(!ok)out.falhas.push({caso:r.id,id,dados:d});}
async function snap(p,f){await wait(p);return p.evaluate(id=>JSON.parse(localStorage.getItem('fm_ficha_sessao_afty_v1:'+id)),f.id);}
async function go(p,f,g2=true){const route=f.rulesVersion==='player'?'Player':'Afty';await p.goto(BASE+'/'+route+(g2?'?ficha-g2=1':''),{waitUntil:'domcontentloaded'});await p.getByText(f.name,{exact:true}).first().click();await p.locator('#afty-ficha').waitFor();await wait(p);}
async function scenario(id,sample,w,run){const ctx=await b.newContext({viewport:{width:w,height:w===1024?720:900}}),p=await ctx.newPage();p.setDefaultTimeout(10000);p.setDefaultNavigationTimeout(30000);await p.route('**/*',route=>{const u=new URL(route.request().url());return u.hostname==='127.0.0.1'||u.hostname==='localhost'?route.continue():route.abort();});const f={...samples.find(x=>x.id===sample).ficha,id:'codex-review-'+sample};const r={id,checks:[],erros:[]};out.casos.push(r);p.on('pageerror',e=>r.erros.push(e.message));
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


for(const sample of ['calamidade','minamoto','player30'])for(const mode of ['classica','g2'])await scenario('perf-'+sample+'-'+mode,sample,1440,async(p,r,f)=>{
 const seed=JSON.parse(fs.readFileSync(DIR+'/perf-seeds.json','utf8'))[sample]; await p.evaluate(({f,seed})=>localStorage.setItem('fm_ficha_sessao_afty_v1:'+f.id,JSON.stringify(seed)),{f,seed});await go(p,f,mode==='g2');await effects(p);await p.waitForTimeout(1700);r.seed={rodada:seed.rodada,ligados:Object.keys(seed.combate).filter(k=>seed.combate[k])};r.medidas=[];
 for(let i=0;i<3;i++){
  let target,label,selector;
  if(mode==='g2'){const cards=p.locator('.g2-cartao[data-chave-ativo]');const cs=await cards.evaluateAll(xs=>xs.map(x=>({key:x.dataset.chaveAtivo,text:x.textContent})));const candidate=cs.find(c=>!c.key.startsWith('condicao:')&&!/invencivel|assumir_postura/i.test(c.key));if(!candidate)break;selector='[data-chave-ativo="'+candidate.key+'"]';label=candidate.text;await p.locator(selector).click();target=p.locator('[data-encerrar]').first();}
  else{target=p.getByRole('button',{name:/^Desligar /}).first();if(!await target.count())break;label=await target.getAttribute('aria-label');selector=label;}
  await target.scrollIntoViewIfNeeded();await p.waitForTimeout(100);
  await p.evaluate(({mode,selector})=>{const metric=window.__codexMetric={longas:[],gaps:[],start:null,end:null,paint:null};let last=performance.now();metric.raf=requestAnimationFrame(function tick(now){metric.gaps.push(now-last);last=now;metric.raf=requestAnimationFrame(tick);});metric.observer=new PerformanceObserver(list=>metric.longas.push(...list.getEntries().map(e=>({start:e.startTime,duration:e.duration}))));metric.observer.observe({type:'longtask'});const ready=()=>mode==='g2'?!document.querySelector(selector):![...document.querySelectorAll('button')].some(x=>x.getAttribute('aria-label')===selector);metric.mutation=new MutationObserver(()=>{if(metric.start!==null&&metric.end===null&&ready()){metric.end=performance.now();requestAnimationFrame(()=>requestAnimationFrame(()=>{metric.paint=performance.now();}));}});metric.mutation.observe(document.getElementById('afty-ficha'),{subtree:true,childList:true,attributes:true,characterData:true});},{mode,selector});
  await target.evaluate(el=>el.addEventListener('pointerdown',()=>{window.__codexMetric.start=performance.now();},{once:true,capture:true}));await target.click();await p.waitForFunction(()=>window.__codexMetric.paint!==null);await p.waitForTimeout(600);const m=await p.evaluate(()=>{const x=window.__codexMetric;x.observer.disconnect();x.mutation.disconnect();cancelAnimationFrame(x.raf);return {tempoDOM:x.end-x.start,tempoDoPonteiroAteDoisQuadros:x.paint-x.start,maxIntervaloEntreQuadros:Math.max(...x.gaps),tarefasLongas:x.longas.map(l=>Math.round(l.duration))};});r.medidas.push({label,...m});
 }
 check(r,'três operações reais medidas',r.medidas.length===3,r.medidas);check(r,'sem congelamento de dois segundos na amostra',r.medidas.length===3&&r.medidas.every(m=>m.tempoDoPonteiroAteDoisQuadros<2000),r.medidas);
 r.depois=await snap(p,f);r.depois={pe:r.depois.peAtual,rodada:r.depois.rodada,ligados:Object.keys(r.depois.combate).filter(k=>r.depois.combate[k]),eventos:r.depois.operacoes?.eventos?.length??0};
});
await b.close();save();console.log(JSON.stringify(out.casos.map(c=>({id:c.id,checks:c.checks,medidas:c.medidas,exception:c.exception}))));
