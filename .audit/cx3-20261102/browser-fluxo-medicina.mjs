import { register } from "node:module";
register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}', import.meta.url);
import { chromium } from "playwright";
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
const R=new URL("../../src/systems/afty/",import.meta.url);
const {deriveAfty}=await import(new URL("afty-derive.js",R));
const {createBlankAfty}=await import(new URL("afty-schema.js",R));
const {aplicarAddons}=await import(new URL("afty-addons.js",R));
const {criarEncontro,criarCombatente,definirIniciativa}=await import(new URL("encontros/afty-encontro.js",R));
aplicarAddons([]);
const ID="fluxo_constante", NOME="Fluxo Constante", MED="hab:sup_medicina_infalivel";
function ficha(sistema,nome,fluxo){
 const c=createBlankAfty();c.id=nome;c.name=nome;c.rulesVersion=sistema;c.core.nd=12;c.attrMethod="fixos";
 c.attributes={forca:14,destreza:12,constituicao:13,inteligencia:10,sabedoria:15,presenca:8};
 c.core.origem={id:"inato",bonusAtributos:{forca:2,sabedoria:1}};c.especializacoes=[{id:"suporte",nivel:12}];
 c.habilidadesGerais=sistema==="afty"?["ger_especializacao",...(fluxo?["ger_aptidao"]:[])]:[];
 c.habilidades=["sup_suporte_em_combate",...(sistema==="afty"?["sup_medicina_infalivel"]:[])];
 c.pericias={medicina:"treinado",feiticaria:"treinado"};
 if(fluxo){c.aptidoes={au:0,cl:3,er:3,dom:0,bar:0};c.aptidoesAmaldicoadas=["energia_reversa",ID,"liberacao_de_energia_reversa"];}
 return c;
}

const browser=await chromium.launch({channel:"chrome",ignoreDefaultArgs:["--hide-scrollbars"]});
const resultados=[];
try{
 for(const sistema of ["player","afty"])for(const largura of [1440,390]){
  const c=ficha(sistema,"CX3 Curador de Fluxo",true),o=ficha(sistema,"CX3 Oponente",false),d=deriveAfty(c),doa=deriveAfty(o);
  const mesa=criarEncontro({nome:"CX3 Fluxo na Mesa"});
  mesa.combatentes=[o,c].map((f,i)=>definirIniciativa(criarCombatente(f,{derived:[doa,d][i]}),20-i*10));
  mesa.combatentes[1].sessao.hpAtual=d.hp-50;
  const ctx=await browser.newContext({viewport:{width:largura,height:1000},isMobile:largura===390,hasTouch:largura===390});
  await ctx.addInitScript(({sistema,c,mesa})=>{
   if(localStorage.getItem("cx3-fluxo-medicina"))return;
   localStorage.setItem("cx3-fluxo-medicina","1");localStorage.setItem("fm_creatures_"+sistema+"_v1",JSON.stringify([c]));
   localStorage.setItem("afty_encontros_v1",JSON.stringify([mesa]));
  },{sistema,c,mesa});
  const page=await ctx.newPage(),erros=[];
  page.setDefaultTimeout(8500);page.on("pageerror",e=>erros.push(e.message));
  const abreMesa=async()=>{
   await page.getByRole("button",{name:"Encontros",exact:true}).click();await page.getByText(mesa.nome,{exact:true}).click();
  };
  const foca=async()=>{
   if(largura===390)await page.getByRole("button",{name:"Iniciativa",exact:true}).click();
   await page.getByText(c.name,{exact:true}).filter({visible:true}).first().click();
  };
  const abreFluxo=async()=>{
   await page.getByRole("tab",{name:"Habilidades",exact:true}).click();
   const el=page.locator('[id="afty-item-aptidao:'+ID+'"]'), b=el.getByRole("button",{name:NOME,exact:true});
   if(await b.getAttribute("aria-expanded")!=="true")await b.click();
   return el;
  };
  const le=()=>page.evaluate(()=>JSON.parse(localStorage.getItem("afty_encontros_v1"))[0].combatentes[1].sessao);
  const prepara=async(el,modo)=>{
   const combo=el.getByRole("combobox",{name:"Gatilho de Fluxo Constante"});await combo.selectOption(modo);
   assert.equal(await el.getByRole("combobox",{name:"Alvo da Cura",exact:true}).count(),0);
   await el.getByRole("checkbox",{name:/^Medicina Infalível/}).check();
   await page.evaluate(()=>{globalThis.cx3Random=Math.random;Math.random=()=>0.25;});
   try{await el.getByRole("button",{name:"Rolar Cura",exact:true}).click();}
   finally{await page.evaluate(()=>{Math.random=globalThis.cx3Random;delete globalThis.cx3Random;});}
   await el.getByRole("checkbox",{name:"Maximizar Dado 1 da Cura",exact:true}).waitFor();
  };
  const conclui=async(el,n)=>{
   await el.getByRole("checkbox",{name:"Maximizar Dado 1 da Cura",exact:true}).check();
   await el.getByRole("button",{name:"Aplicar Cura",exact:true}).click();
   await page.waitForFunction(n=>JSON.parse(localStorage.getItem("afty_encontros_v1"))[0].combatentes[1].sessao.usos["hab:sup_medicina_infalivel"]===n,n);
  };
  await page.goto("http://127.0.0.1:5193/"+sistema,{waitUntil:"networkidle"});
  await abreMesa();await page.getByRole("button",{name:"Começar",exact:true}).click();await foca();let el=await abreFluxo();
  const base=await le();await prepara(el,"dano");
  const reacao=await le();
  assert.equal(reacao.hpAtual,base.hpAtual);assert.equal(base.peAtual-reacao.peAtual,2);assert.ok(reacao.uso.acoes.reacoes["fluxo:reacao"]);
  await page.reload({waitUntil:"networkidle"});await abreMesa();await foca();el=await abreFluxo();await conclui(el,1);
  let atual=await le();assert.deepEqual(atual.uso.acoes,reacao.uso.acoes);assert.equal(atual.peAtual,reacao.peAtual);assert.ok(atual.hpAtual>base.hpAtual);
  await page.getByRole("button",{name:"Próximo Turno",exact:true}).click();await foca();el=await abreFluxo();
  await prepara(el,"inicio");const livre=await le();
  await conclui(el,2);atual=await le();
  assert.equal(atual.usos[MED],2);assert.deepEqual(atual.uso.acoes,livre.uso.acoes);assert.equal(atual.peAtual,livre.peAtual);
  await el.getByRole("combobox",{name:"Gatilho de Fluxo Constante"}).selectOption("dano");
  await el.getByRole("button",{name:"Curar",exact:true}).click();
  await el.getByRole("alert").filter({hasText:"Fluxo Já Usado no Início do Seu Turno"}).waitFor();
  assert.equal((await le()).peAtual,atual.peAtual);
  if(largura===390){await el.scrollIntoViewIfNeeded();await page.screenshot({path:".audit/cx3-20261102/"+sistema+"-390-fluxo-medicina.png"});}
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  assert.deepEqual(erros,[]);
  resultados.push({sistema,largura,reacao:true,livre:true,recarga:true,bloqueio:true,usosMedicina:2});
  console.log(sistema,largura,"Fluxo e Medicina OK");await ctx.close();
 }
}finally{
 await writeFile(new URL("browser-fluxo-medicina-resultados.json",import.meta.url),JSON.stringify(resultados,null,2));
 await browser.close();
}
