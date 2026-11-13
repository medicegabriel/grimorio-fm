import { register } from "node:module";
register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}', import.meta.url);
import { chromium } from "playwright";
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
const R=new URL("../../src/systems/afty/",import.meta.url);
const {deriveAfty}=await import(new URL("afty-derive.js",R));
const {createBlankAfty}=await import(new URL("afty-schema.js",R));
const {aplicarAddons}=await import(new URL("afty-addons.js",R));
const S=await import(new URL("ficha/ficha-sessao.js",R));
const {criarEncontro,criarCombatente,definirIniciativa}=await import(new URL("encontros/afty-encontro.js",R));
aplicarAddons([]);
const ID="concentrar_aura", NOME="Concentrar Aura", IDS=["aura_drenadora","aura_reforcada"];
function ficha(sistema,nome,auras){
 const c=createBlankAfty();c.id=nome;c.name=nome;c.rulesVersion=sistema;c.core.nd=12;c.attrMethod="fixos";
 c.attributes={forca:15,destreza:14,constituicao:13,inteligencia:10,sabedoria:12,presenca:8};
 c.core.origem={id:"inato",bonusAtributos:{forca:2,destreza:1}};c.especializacoes=[{id:"combatente",nivel:12}];
 c.pericias={feiticaria:"treinado"};
 c.habilidadesGerais=sistema==="afty"?["ger_especializacao",...(auras?["ger_aptidao"]:[])]:[];
 if(auras){c.aptidoes={cl:0,er:0,au:2,dom:0,bar:0};c.aptidoesAmaldicoadas=[...IDS,"aura_embacada",ID];}
 c.equipamentos.itens=[{uid:"espada",tipo:"arma",refId:"arm_espada_curta",qtd:1,equipado:true}];
 return c;
}

const browser=await chromium.launch({channel:"chrome",ignoreDefaultArgs:["--hide-scrollbars"]});
const resultados=[];
try{
 for(const sistema of ["player","afty"])for(const largura of [1440,390])for(const g2 of [false,true]){
  const c=ficha(sistema,"CX3 Concentrar",true),ca=ficha(sistema,"CX3 Alvo Energético",false),d=deriveAfty(c),da=deriveAfty(ca);
  const inicial=S.iniciaTurnoFicha(S.iniciaCombate(S.sessaoEmBranco(d),d),d);
  const s={...inicial,rodada:1,combate:{...inicial.combate,concentrarAura:["aura_reforcada"]}};
  const mesa=criarEncontro({nome:"CX3 Concentrar na Mesa"});
  mesa.combatentes=[c,ca].map((f,i)=>definirIniciativa(criarCombatente(f,{derived:[d,da][i]}),20-i*10));
  const ctx=await browser.newContext({viewport:{width:largura,height:1000},isMobile:largura===390,hasTouch:largura===390});
  await ctx.addInitScript(({sistema,c,s,mesa})=>{
   if(localStorage.getItem("cx3-concentrar"))return;
   localStorage.setItem("cx3-concentrar","1");localStorage.setItem("fm_creatures_"+sistema+"_v1",JSON.stringify([c]));
   localStorage.setItem("fm_ficha_sessao_afty_v1:"+c.id,JSON.stringify(s));
   localStorage.setItem("afty_encontros_v1",JSON.stringify([mesa]));
  },{sistema,c,s,mesa});
  const page=await ctx.newPage(), erros=[];
  page.on("pageerror",e=>erros.push(e.message));page.setDefaultTimeout(8500);
  const abrir=async(previa=false)=>{
   await page.getByRole("tab",{name:"Habilidades",exact:true}).click();
   if(previa){
    await page.getByRole("button",{name:NOME+". Consultar a regra",exact:true}).click();
    return page.getByRole("dialog",{name:"Consulta: "+NOME,exact:true});
   }
   const el=page.locator('[id="afty-item-aptidao:'+ID+'"]'), b=el.getByRole("button",{name:NOME,exact:true}).first();
   if(await b.getAttribute("aria-expanded")!=="true")await b.click();
   return el;
  };
  const usa=async el=>{
   for(const nome of ["Aura Drenadora","Aura Reforçada"])await el.getByRole("checkbox",{name:nome,exact:true}).check();
   assert.equal(await el.getByRole("checkbox",{name:"Aura Embaçada",exact:true}).count(),0);
   await el.getByRole("button",{name:NOME,exact:true}).last().click();
   await el.getByText("Aura Reforçada Suspensa",{exact:true}).waitFor();
  };
  const le=(encontro=false)=>page.evaluate(({encontro,nome})=>encontro?JSON.parse(localStorage.getItem("afty_encontros_v1"))[0].combatentes[0].sessao
   :JSON.parse(localStorage.getItem("fm_ficha_sessao_afty_v1:"+nome)),{encontro,nome:c.id});
  const verifica=async(encontro=false)=>{
   const estado=await le(encontro);assert.deepEqual(estado.combate.concentrarAura,IDS);assert.equal(estado.uso.acoes.livres[ID],1);
   assert.equal(estado.uso.ativos[ID].duracao.restantes,1);assert.equal(estado.peAtual,s.peAtual);
  };
  const abreMesa=async()=>{
   await page.getByRole("button",{name:"Encontros",exact:true}).click();await page.getByText(mesa.nome,{exact:true}).click();
  };
  const foca=async()=>{
   if(largura===390)await page.getByRole("button",{name:"Iniciativa",exact:true}).click();
   await page.getByText(c.name,{exact:true}).filter({visible:true}).first().click();
  };
  await page.goto("http://127.0.0.1:5193/"+sistema+(g2?"?ficha-g2=1":""),{waitUntil:"networkidle"});
  await page.getByText(c.name,{exact:true}).click();let el=await abrir(g2);
  await el.getByRole("button",{name:"Limpar Seleção Manual",exact:true}).click();
  await page.waitForFunction(nome=>JSON.parse(localStorage.getItem("fm_ficha_sessao_afty_v1:"+nome)).combate.concentrarAura.length===0,c.id);
  await usa(el);
  await page.waitForFunction(nome=>!!JSON.parse(localStorage.getItem("fm_ficha_sessao_afty_v1:"+nome)).uso.ativos.concentrar_aura,c.id);
  await verifica();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  if(g2&&largura===390)await page.screenshot({path:".audit/cx3-20261102/"+sistema+"-390-concentrar-aura-g2.png"});
  if(g2)await page.getByRole("button",{name:"Fechar a consulta e voltar à lista",exact:true}).click();
  await page.getByRole("button",{name:"Próxima rodada",exact:true}).click();
  await page.waitForFunction(nome=>!JSON.parse(localStorage.getItem("fm_ficha_sessao_afty_v1:"+nome)).uso.ativos.concentrar_aura,c.id);
  assert.deepEqual((await le()).combate.concentrarAura,[]);

  if(!g2){
   await page.getByRole("button",{name:"Voltar",exact:true}).click();await abreMesa();
   await page.getByRole("button",{name:"Começar",exact:true}).click();await foca();el=await abrir();await usa(el);
   await page.waitForFunction(()=>!!JSON.parse(localStorage.getItem("afty_encontros_v1"))[0].combatentes[0].sessao.uso.ativos.concentrar_aura);
   await page.reload({waitUntil:"networkidle"});await abreMesa();await foca();el=await abrir();
   await el.getByText("Aura Reforçada Suspensa",{exact:true}).waitFor();await verifica(true);
   await page.getByRole("tab",{name:"Ações",exact:true}).click();
   const linha=d.dano.entradas.find(l=>l.id==="arm_espada_curta"), arma=page.locator('[id="afty-item-dano:'+linha.id+'"]');
   const vicia=async(el,valor)=>{
    await page.evaluate(v=>{globalThis.cx3Random=Math.random;Math.random=()=>v;},valor);
    try{await el.click();}finally{await page.evaluate(()=>{Math.random=globalThis.cx3Random;delete globalThis.cx3Random;});}
   };
   await vicia(arma.getByRole("button",{name:"+"+linha.acerto,exact:true}),0.999);
   await vicia(arma.locator("button.afty-rolavel").last(),0.5);
   await page.waitForFunction(()=>JSON.parse(localStorage.getItem("afty_encontros_v1"))[0].combatentes[0].sessao.log.some(r=>r.tipo==="dano"));
   const jogadas=(await le(true)).log, atk=jogadas.find(r=>r.tipoTeste==="ataque"), dano=jogadas.find(r=>r.tipo==="dano");
   assert.equal(dano.gruposRolados.find(r=>r.tipoDano==="energetico").total,10);
   await page.getByRole("combobox",{name:"Ataque a Confirmar"}).selectOption(atk.id);
   await page.getByRole("combobox",{name:"Alvo do Ataque"}).selectOption(mesa.combatentes[1].id);
   await page.getByRole("combobox",{name:"Dano do Ataque"}).selectOption(dano.id);
   await page.getByRole("button",{name:"Confirmar Ataque e Aplicar Dano",exact:true}).click();
   await page.waitForFunction(()=>JSON.parse(localStorage.getItem("afty_encontros_v1"))[0].combatentes[0].sessao.log.some(r=>r.calculos?.some(c=>c.tipoDano==="energetico")));
   await page.getByRole("button",{name:"Nova Rodada",exact:true}).click();
   await page.waitForFunction(()=>!JSON.parse(localStorage.getItem("afty_encontros_v1"))[0].combatentes[0].sessao.uso.ativos.concentrar_aura);
   assert.deepEqual((await le(true)).combate.concentrarAura,[]);
   resultados.push({sistema,largura,encontro:true,energetico:10,recarga:true,prazo:true});
  }
  assert.deepEqual(erros,[]);resultados.push({sistema,largura,g2,ficha:true,prazo:true});
  console.log(sistema,largura,g2?"G2":"Clássica e Encontro","Concentrar Aura OK");await ctx.close();
 }
}finally{
 await writeFile(new URL("browser-concentrar-aura-resultados.json",import.meta.url),JSON.stringify(resultados,null,2));
 await browser.close();
}
