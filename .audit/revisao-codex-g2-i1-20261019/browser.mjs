import fs from 'node:fs';
import {chromium} from 'playwright';
const ROOT=process.cwd(),DIR=ROOT+'/.audit/revisao-codex-g2-i1-20261019';
const BASE=process.env.BASE??'http://127.0.0.1:5320';
const samples=JSON.parse(fs.readFileSync('C:/Projetos/Grimorio/prototipos/ficha-final-v2/dados/amostras.json','utf8')).amostras;
const b=await chromium.launch({channel:'chrome'});
const out={geradoEm:new Date().toISOString(),base:BASE,casos:[],falhas:[]};
const AC='especializacao:cmb_ataque_concentrado',GE='especializacao:cmb_golpe_especial';
const canonical=v=>{if(Array.isArray(v))return v.every(x=>x===null)?[]:v.map(canonical);if(v&&typeof v==='object')return Object.fromEntries(Object.entries(v).filter(([k])=>k!=='atualizadoEm').sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>[k,canonical(v)]));return v;};const eq=(a,z)=>JSON.stringify(canonical(a))===JSON.stringify(canonical(z));
const energy=s=>Math.max(0,s.peAtual)+Object.values(s.peTempFontes??{}).reduce((a,x)=>a+x,0);
const semRegistro=s=>{const {operacoes,...x}=s;return x;};
const semPE=s=>{const {peAtual,peTempFontes,operacoes,...x}=s;return x;};
const save=()=>fs.writeFileSync(DIR+'/browser-independente.json',JSON.stringify(out,null,2));
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

const defesa=async p=>Number((await p.locator('[data-afty-stat="defesa"]').first().textContent()).replace(/[^\d-]/g,''));
async function registra(p,{tipo='feitico',nome='Protecao Codex',valor=7,por,rodadas,origemId,somar=false}){
 await effects(p);if(!await p.locator('[data-busca-catalogo]').isVisible())await p.getByRole('button',{name:/Adicionar/}).first().click();
 await p.getByRole('tab',{name:'Fonte Externa',exact:true}).click();const form=p.getByRole('form',{name:'Registrar fonte externa'});
 if(tipo!=='feitico')await form.locator('[data-tipo="'+tipo+'"]').click();await form.locator('[data-campo="origem"]').fill(nome);
 if(origemId)await form.locator('[data-origem-id="'+origemId+'"]').click();if(por)await form.locator('[data-campo="por"]').fill(por);
 await form.locator('[data-campo="valor-0"]').fill(String(valor));if(rodadas)await form.locator('[data-campo="rodadas"]').fill(String(rodadas));
 if(somar)await form.locator('[data-campo="presumir"]').check();await form.getByRole('button',{name:'Registrar',exact:true}).click();await wait(p);
}
for(const sample of ['minamoto','player30','calamidade'])await scenario('fonte-'+sample,sample,1280,async(p,r,f)=>{
 await combate(p);const before=await snap(p,f),base=await defesa(p);await registra(p,{});const saved=await snap(p,f);
 check(r,'registro pela interface soma sete',await defesa(p)===base+7&&saved.buffs.filter(x=>x.rec).length===1,{base,atual:await defesa(p)});
 await go(p,f,false);check(r,'classica conta o mesmo registro sem camada visual G2',await defesa(p)===base+7&&!await p.locator('.e-g2').count());
 await go(p,f,false);check(r,'recarga classica conserva valor e dados',await defesa(p)===base+7&&eq((await snap(p,f)).buffs,saved.buffs));
 await go(p,f,true);check(r,'volta ao G2 nao duplica nem perde',await defesa(p)===base+7&&eq((await snap(p,f)).buffs,saved.buffs)&&energy(before)===energy(await snap(p,f)));
 await p.screenshot({path:DIR+'/fonte-'+sample+'.png'});
});
for(const width of [1024,1440])await scenario('catalogo-'+width,'minamoto',width,async(p,r,f)=>{
 await combate(p);const base=await defesa(p);const opts={tipo:'catalogo',nome:'Aura do Basti',origemId:'aptidao:aura_do_bastiao'};
 await registra(p,{...opts,valor:2,por:'Ana'});await registra(p,{...opts,valor:3,por:'Rui'});
 const s=await snap(p,f);check(r,'duas origens iguais de aliados distintos valem maior',await defesa(p)===base+3&&s.buffs.filter(x=>x.rec).length===2,{base,atual:await defesa(p)});
 await go(p,f,false);check(r,'classica conta maior uma vez',await defesa(p)===base+3);
 await go(p,f,true);await registra(p,{nome:'Protecao combinada',valor:7});check(r,'feitico e catalogo conservam regras diferentes',await defesa(p)===base+10);
 await go(p,f,false);check(r,'classica conserva combinacao',await defesa(p)===base+10);
});
await scenario('prazo-persistencia','minamoto',1280,async(p,r,f)=>{
 await combate(p);const base=await defesa(p);await registra(p,{rodadas:2});await go(p,f,false);
 check(r,'classica ve registro com prazo',await defesa(p)===base+7);
 await p.getByRole('button',{name:'Próxima rodada',exact:true}).click();let s=await snap(p,f);check(r,'virada classica mantem ultimo prazo e valor',s.buffs.find(x=>x.rec)?.rodadas===1&&await defesa(p)===base+7);
 await go(p,f,true);await effects(p);check(r,'G2 ve prazo atualizado apos recarga',await defesa(p)===base+7&&(await snap(p,f)).buffs.find(x=>x.rec)?.rodadas===1);
 await p.getByRole('button',{name:'Próxima rodada',exact:true}).click();s=await snap(p,f);check(r,'virada G2 expira registro e numero',!s.buffs.some(x=>x.rec)&&await defesa(p)===base);
 await go(p,f,false);check(r,'classica ve expiracao',await defesa(p)===base&&!((await snap(p,f)).buffs.some(x=>x.rec)));
});
await scenario('confirmacoes-rapidas','minamoto',1440,async(p,r,f)=>{
 await combate(p);await registra(p,{});const before=await snap(p,f);await effects(p);
 for(const [name,key] of [['Ataque Concentrado',AC],['Espírito de Luta','especializacao:cmb_espirito_de_luta'],['Conhecimento Aplicado','especializacao:cnj_conhecimento_aplicado']]){
   const pr=await prep(p,name,key);await pr.locator('[data-confirmar]').click();
 }
 const after=await snap(p,f);check(r,'tres confirmacoes sem pausa nao perdem estados',after.combate.ataqueConcentrado===1&&after.combate.espiritoDeLuta===true&&after.combate.conhecimentoAplicado>0,after.combate);
 check(r,'so AC automatico cobra PE uma vez',energy(before)-energy(after)===1&&Object.values(after.operacoes?.ativacoes??{}).filter(x=>x.nome.startsWith('Ataque Concentrado')).length===1,{energia:[energy(before),energy(after)],operacoes:after.operacoes});
 const d=await engine(p,f,'derived');check(r,'numero final da tela corresponde a sessao mais recente',await defesa(p)===d.defesa,{tela:await defesa(p),motor:d.defesa});
 await go(p,f,false);check(r,'classica ve mesmos estados e numero',eq(after.combate,(await snap(p,f)).combate)&&await defesa(p)===d.defesa);
});
await b.close();save();console.log(JSON.stringify({casos:out.casos.length,checks:out.casos.reduce((a,x)=>a+x.checks.length,0),falhas:out.falhas}));process.exitCode=out.falhas.length?1:0;
