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
const save=()=>fs.writeFileSync(DIR+'/diagnostico.json',JSON.stringify(out,null,2));
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


await scenario('diagnostico-ac','minamoto',1280,async(p,r,f)=>{
 await combate(p);await effects(p);const pre=await prep(p,'Ataque Concentrado',AC);await pre.locator('[data-valor="2"]').click();r.before=await snap(p,f);await pre.locator('[data-confirmar]').dblclick({delay:15});r.after=await snap(p,f);await menu(p,'historico');r.hist=await p.locator('[data-historico-lista]').innerText();r.botoes=await p.locator('[data-estornar]').evaluateAll(xs=>xs.map(x=>({id:x.dataset.estornar,label:x.textContent,disabled:x.disabled})));await p.locator('[data-estornar]').first().dblclick({delay:15});r.refund=await snap(p,f);await p.keyboard.press('Escape');r.next=await engine(p,f,'next');await p.getByRole('button',{name:'Próxima rodada',exact:true}).click();r.turned=await snap(p,f);await go(p,f,false);r.classic=await snap(p,f);await go(p,f,true);r.back=await snap(p,f);await effects(p);await p.getByRole('button',{name:/Adicionar/}).first().click();r.catalogoButtons=await p.locator('.e-area button').evaluateAll(xs=>xs.map(x=>({name:x.textContent,role:x.getAttribute('role')})).filter(x=>/Fonte|Ficha/.test(x.name)));
});await b.close();save();
