import { register } from "node:module";
register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}', import.meta.url);
import { chromium } from "playwright";
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
const R = new URL("../../src/systems/afty/",import.meta.url);
const { deriveAfty } = await import(new URL("afty-derive.js",R));
const { createBlankAfty } = await import(new URL("afty-schema.js",R));
const { aplicarAddons } = await import(new URL("afty-addons.js",R));
const { criarEncontro, criarCombatente, definirIniciativa } = await import(new URL("encontros/afty-encontro.js",R));
aplicarAddons([]);

function ficha(sistema,nome,postura=false) {
 const c=createBlankAfty(); c.id=nome; c.name=nome; c.rulesVersion=sistema; c.core.nd=12; c.attrMethod="fixos";
 c.attributes={forca:15,destreza:14,constituicao:13,inteligencia:10,sabedoria:12,presenca:8};
 c.core.origem={id:"inato",bonusAtributos:{forca:2,destreza:1}}; c.especializacoes=[{id:"combatente",nivel:12}];
 c.habilidadesGerais=sistema==="afty"?["ger_especializacao"]:[];
 c.habilidades=postura?["cmb_assumir_postura"]:[];
 c.escolhasHabilidade=postura?{cmb_assumir_postura:["cmb_postura_da_tempestade","cmb_postura_do_sol"]}:{};
 c.pericias={feiticaria:"treinado"};
 c.equipamentos.itens=[{uid:"espada",tipo:"arma",refId:"arm_espada_curta",qtd:1,equipado:true}];
 return c;
}

const browser=await chromium.launch({channel:"chrome",ignoreDefaultArgs:["--hide-scrollbars"]});
const resultados=[];
try {
 for(const sistema of ["player","afty"]) for(const largura of [1440,390]){
  const c=ficha(sistema,"CX3 Tempestade",true), a=ficha(sistema,"CX3 Primeiro Alvo"), b=ficha(sistema,"CX3 Outro Alvo");
  const d=deriveAfty(c), da=deriveAfty(a), db=deriveAfty(b);
  const mesa=criarEncontro({nome:"CX3 Tempestade na Mesa"});
  mesa.combatentes=[c,a,b].map((f,i)=>definirIniciativa(criarCombatente(f,{derived:[d,da,db][i]}),30-10*i));
  mesa.combatentes[1].sessao.buffs=[{id:"rd-a",nome:"RD da Mesa",canal:"rdGeral",expr:"6",rodadas:null}];
  const [,idA,idB]=mesa.combatentes.map(x=>x.id);
  const ctx=await browser.newContext({viewport:{width:largura,height:1000},isMobile:largura===390,hasTouch:largura===390});
  await ctx.addInitScript(({sistema,c,mesa})=>{
   if(localStorage.getItem("cx3-tempestade"))return;
   localStorage.setItem("cx3-tempestade","1");localStorage.setItem("fm_creatures_"+sistema+"_v1",JSON.stringify([c]));
   localStorage.setItem("afty_encontros_v1",JSON.stringify([mesa]));
  },{sistema,c,mesa});
  const page=await ctx.newPage(),erros=[];
  page.on("pageerror",e=>erros.push(e.message)); page.setDefaultTimeout(8500);
  const abrir=async()=>{await page.getByRole("button",{name:"Encontros",exact:true}).click();await page.getByText(mesa.nome,{exact:true}).click();};
  const focar=async()=>{if(largura===390)await page.getByRole("button",{name:"Iniciativa",exact:true}).click();await page.getByText(c.name,{exact:true}).filter({visible:true}).first().click();};
  const acoes=()=>page.getByRole("tab",{name:"Ações",exact:true}).click();
  const ler=()=>page.evaluate(()=>JSON.parse(localStorage.getItem("afty_encontros_v1"))[0].combatentes.map(c=>c.sessao));
  const vicia=async(el,valor)=>{
   await page.evaluate(v=>{globalThis.cx3Random=Math.random;Math.random=()=>v;},valor);
   try{await el.click();}finally{await page.evaluate(()=>{Math.random=globalThis.cx3Random;delete globalThis.cx3Random;});}
  };
  await page.goto("http://127.0.0.1:5193/"+sistema,{waitUntil:"networkidle"});
  await abrir();await page.getByRole("button",{name:"Começar",exact:true}).click();await focar();
  await page.getByRole("tab",{name:"Habilidades",exact:true}).click();
  const post=page.locator('[id="afty-item-especializacao:cmb_assumir_postura"]');
  await post.getByRole("button",{name:"Assumir Postura",exact:true}).click();
  await post.getByRole("combobox",{name:"Postura para Assumir",exact:true}).selectOption("tempestade");
  await post.getByRole("button",{name:"Entrar em Postura",exact:true}).click();
  await page.waitForFunction(()=>Boolean(JSON.parse(localStorage.getItem("afty_encontros_v1"))[0].combatentes[0].sessao.uso.ativos.cmb_assumir_postura?.parametros.operacaoId));
  await acoes();

  const linha=d.dano.entradas.find(l=>l.id==="arm_espada_curta"), arma=page.locator('[id="afty-item-dano:'+linha.id+'"]');
  const jogada=arma.getByRole("button",{name:"+"+linha.acerto,exact:true});
  await vicia(jogada,0.999);
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem("afty_encontros_v1"))[0].combatentes[0].sessao.log.some(r=>r.tipoTeste==="ataque"));
  const atk=(await ler())[0].log.find(r=>r.tipoTeste==="ataque");
  assert.equal(atk.contextoTurno.posturaTempestade,true);
  await vicia(arma.locator("button.afty-rolavel").last(),0);
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem("afty_encontros_v1"))[0].combatentes[0].sessao.log.some(r=>r.tipo==="dano"));
  const dano=(await ler())[0].log.find(r=>r.tipo==="dano");
  await page.getByRole("combobox",{name:"Ataque a Confirmar"}).selectOption(atk.id);
  await page.getByRole("combobox",{name:"Alvo do Ataque"}).selectOption(idA);
  await page.getByRole("combobox",{name:"Dano do Ataque"}).selectOption(dano.id);
  await page.getByRole("button",{name:"Confirmar Ataque e Aplicar Dano",exact:true}).click();
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem("afty_encontros_v1"))[0].combatentes[0].sessao.log.some(r=>r.tempestadeJaCaido===false));
  const abrirPostura=async()=>{
   await page.getByRole("tab",{name:"Habilidades",exact:true}).click();
   const b=post.getByRole("button",{name:"Assumir Postura",exact:true});
   if(await b.getAttribute("aria-expanded")!=="true")await b.click();
   await post.getByRole("combobox",{name:"Acerto da Tempestade"}).selectOption(atk.id);
  };
  await abrirPostura();
  await vicia(post.getByRole("button",{name:"Rolar Fortitude da Tempestade",exact:true}),0);
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem("afty_encontros_v1"))[0].combatentes[1].sessao.log.some(r=>r.contextoConteudo?.tipo==="posturaTempestade"));
  const antes=await ler();
  assert.equal(antes[1].condicoes.some(c=>c.nome==="Caído"),false);
  const tr=antes[1].log.find(r=>r.contextoConteudo?.tipo==="posturaTempestade");
  assert.equal(tr.cd,d.cd);
  await page.reload({waitUntil:"networkidle"});await abrir();await focar();await abrirPostura();
  const aplica=post.getByRole("button",{name:"Aplicar Tempestade",exact:true});
  await aplica.scrollIntoViewIfNeeded();
  if(largura===390)await page.screenshot({path:".audit/cx3-20261102/"+sistema+"-"+largura+"-tempestade.png"});
  await aplica.click();
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem("afty_encontros_v1"))[0].combatentes[1].sessao.condicoes.some(c=>c.nome==="Caído"));
  const depois=await ler();
  assert.equal(depois[1].hpAtual,antes[1].hpAtual);
  assert.equal(depois[1].log.find(r=>r.id===tr.id).consequenciasAplicadas,true);
  assert.deepEqual(depois[0].uso.acoes,antes[0].uso.acoes);
  assert.equal(depois[2].condicoes.some(c=>c.nome==="Caído"),false);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  assert.deepEqual(erros,[]);
  resultados.push({sistema,largura,cd:tr.cd,recarga:true,caido:true});
  console.log(sistema,largura,"Tempestade OK");
  await ctx.close();
 }
}finally{
 await writeFile(new URL("browser-tempestade-resultados.json",import.meta.url),JSON.stringify(resultados,null,2));
 await browser.close();
}
