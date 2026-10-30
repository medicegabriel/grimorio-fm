import fs from 'node:fs';
import {chromium} from 'playwright';
const DIR=process.cwd()+'/.audit/revisao-codex-g2-i1-20261019';
const BASE=process.env.BASE??'http://127.0.0.1:5320';
const amostras=JSON.parse(fs.readFileSync('C:/Projetos/Grimorio/prototipos/ficha-final-v2/dados/amostras.json','utf8')).amostras;
const seeds=JSON.parse(fs.readFileSync('.audit/revisao-codex-integracao-g2-20261019/perf-seeds.json','utf8'));
const b=await chromium.launch({channel:'chrome'}),out={geradoEm:new Date().toISOString(),base:BASE,casos:[],falhas:[]};
const save=()=>fs.writeFileSync(DIR+'/desempenho-'+new URL(BASE).port+'.json',JSON.stringify(out,null,2));
const AC='especializacao:cmb_ataque_concentrado',EL='especializacao:cmb_espirito_de_luta',KA='especializacao:cnj_conhecimento_aplicado';
const feit={id:'codex-feit',rec:true,tipoFonte:'feitico',origemNome:'Defesa externa',beneficios:[{canal:'defesa',valor:7}],rodadas:null};
const cat=(n,v)=>({id:'codex-cat'+n,rec:true,tipoFonte:'catalogo',origemNome:'Aura do Bastião',origemId:'aptidao:aura_do_bastiao',aplicadoPor:'Aliado '+n,beneficios:[{canal:'defesa',valor:v}],rodadas:null});
const energy=s=>Math.max(0,s.peAtual)+Object.values(s.peTempFontes??{}).reduce((a,x)=>a+x,0);
const checks=(r,id,ok,dados)=>{r.checks.push({id,ok:!!ok,dados});if(!ok)out.falhas.push({caso:r.id,id,dados});};
async function prepare(p,n,k){
 if(!await p.locator('[data-busca-catalogo]').isVisible())await p.getByRole('button',{name:/Adicionar/}).first().click();
 await p.locator('[data-busca-catalogo]').fill(n);await p.evaluate(k=>window.__perf.next=k,k);
 await p.locator('[data-chave-opcao="'+k+'"] [data-tom="ativar"]').click();
 await p.locator('.k-detalhe [data-confirmar]').click();
}
for(const sample of ['minamoto','calamidade'])for(const source of ['feitico','catalogo'])for(const g2 of [true,false]){
 if(sample==='calamidade'&&(source!=='catalogo'||!g2))continue;
 const ctx=await b.newContext({viewport:{width:1440,height:900}}),p=await ctx.newPage(),r={id:[sample,source,g2?'g2':'classica'].join('-'),checks:[],erros:[]};out.casos.push(r);
 p.setDefaultTimeout(10000);p.on('pageerror',e=>r.erros.push(e.message));await p.route('**/*',route=>['127.0.0.1','localhost'].includes(new URL(route.request().url()).hostname)?route.continue():route.abort());
 try{
  const f={...amostras.find(x=>x.id===sample).ficha,id:'codex-perf-'+r.id},route=f.rulesVersion==='player'?'Player':'Afty';
  const seed=structuredClone(seeds[sample]);seed.buffs=source==='catalogo'?[feit,cat(1,2),cat(2,3)]:[feit];
  seed.combate={...seed.combate,espiritoDeLuta:false,espiritoIncansavel:false,conhecimentoAplicado:0,ataqueConcentrado:0};
  await p.goto(BASE+'/'+route,{waitUntil:'domcontentloaded'});await p.evaluate(({f,seed})=>{localStorage.setItem('fm_creatures_'+(f.rulesVersion==='player'?'player':'afty')+'_v1',JSON.stringify([f]));localStorage.setItem('fm_ficha_sessao_afty_v1:'+f.id,JSON.stringify(seed));},{f,seed});
  await p.goto(BASE+'/'+route+(g2?'?ficha-g2=1':''),{waitUntil:'domcontentloaded'});await p.getByText(f.name,{exact:true}).first().click();await p.locator('#afty-ficha').waitFor();await p.locator('[data-afty-aba="buffs"]').click();await p.waitForTimeout(900);
  const before=await p.evaluate(id=>JSON.parse(localStorage.getItem('fm_ficha_sessao_afty_v1:'+id)),f.id);
  await p.evaluate(()=>{
   const x=window.__perf={longas:[],cliques:[],next:null,current:null,phase:'confirmacao'};
   x.obs=new PerformanceObserver(l=>x.longas.push(...l.getEntries().map(e=>({duracao:e.duration,inicio:e.startTime,phase:x.phase}))));x.obs.observe({type:'longtask'});
   document.addEventListener('pointerdown',ev=>{if(!ev.target.closest('[data-confirmar]'))return;const z={chave:x.next,inicio:performance.now(),phase:x.phase};x.cliques.push(z);x.current=z;},true);
   x.mut=new MutationObserver(()=>{const z=x.current;if(!z||z.pintura)return;if(document.querySelector('[data-chave-ativo="'+z.chave+'"]')){z.pintura=-1;requestAnimationFrame(()=>requestAnimationFrame(()=>{z.pintura=performance.now();}));}});x.mut.observe(document.getElementById('afty-ficha'),{childList:true,attributes:true,subtree:true});
  });
  if(g2){
   await prepare(p,'Ataque Concentrado',AC);await p.waitForFunction(()=>window.__perf.cliques[0]?.pintura>0);await p.waitForTimeout(650);
   await p.evaluate(()=>window.__perf.phase='sequencia');
   for(const [n,k]of [['Espírito de Luta',EL],['Conhecimento Aplicado',KA]]){
    if(sample==='calamidade')break;
    await prepare(p,n,k);
   }
  }else{
   await p.evaluate(()=>window.__perf.phase='estados-classica');
   r.estados=[];
   for(let i=0;i<3;i++){
    const button=p.locator('button[aria-label^="Desligar "]:not([aria-label="Desligar o CSS personalizado"]):not([aria-label="Desligar tudo"])').first();
    const label=await button.getAttribute('aria-label');r.estados.push(label);await button.click();
   }
  }
  await p.waitForTimeout(900);
  r.medidas=await p.evaluate(()=>{const x=window.__perf;x.obs.disconnect();x.mut.disconnect();return {tarefasLongas:x.longas,cliques:x.cliques.map(z=>({...z,ponteiroAteDoisQuadros:z.pintura-z.inicio}))};});
  const after=await p.evaluate(id=>JSON.parse(localStorage.getItem('fm_ficha_sessao_afty_v1:'+id)),f.id);r.energia=[energy(before),energy(after)];r.estadosFinais=after.combate;
  if(g2){checks(r,'AC ligado uma vez e custo publico de intensidade 1',after.combate.ataqueConcentrado===1&&energy(before)-energy(after)===1,r.energia);
   checks(r,'confirmacao recebe ponteiro e pinta',r.medidas.cliques.length===(sample==='calamidade'?1:3)&&r.medidas.cliques.every(z=>z.pintura>0),r.medidas.cliques);
   if(sample==='minamoto')checks(r,'sequencia mantem os tres efeitos',after.combate.espiritoDeLuta===true&&after.combate.conhecimentoAplicado>0&&after.combate.ataqueConcentrado===1);
  }else checks(r,'tres encerramentos reais sem operacao perdida',Object.entries(before.combate).filter(([k,v])=>v&&!after.combate[k]).length===3,r.estados);
  checks(r,'nenhuma pausa de dois segundos na amostra',r.medidas.tarefasLongas.every(x=>x.duracao<2000));checks(r,'sem erro de pagina',!r.erros.length,r.erros);
 }catch(e){r.excecao=e.stack;out.falhas.push({caso:r.id,erro:e.message});await p.screenshot({path:DIR+'/'+r.id+'-'+new URL(BASE).port+'-erro.png'}).catch(()=>{});}
 finally{save();await ctx.close();console.log(r.id+': '+r.checks.filter(x=>x.ok).length+'/'+r.checks.length+(r.excecao?' EXCECAO':'')+' longas '+JSON.stringify(r.medidas?.tarefasLongas.map(x=>Math.round(x.duracao))));}
}
await b.close();save();process.exitCode=out.falhas.length?1:0;
