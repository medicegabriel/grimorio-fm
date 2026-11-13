import { register } from "node:module";
register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}', import.meta.url);
import { chromium } from "playwright";
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
const R = new URL("../../src/systems/afty/", import.meta.url);
const { deriveAfty } = await import(new URL("afty-derive.js", R));
const { createBlankAfty } = await import(new URL("afty-schema.js", R));
const { aplicarAddons } = await import(new URL("afty-addons.js", R));
const S = await import(new URL("ficha/ficha-sessao.js", R));
const { criarEncontro, criarCombatente, definirIniciativa } = await import(new URL("encontros/afty-encontro.js", R));
aplicarAddons([]);

const ID = "sup_medicina_infalivel", CURA = "sup_suporte_em_combate", NOME = "Suporte em Combate";
function ficha(sistema,nome) {
 const c = createBlankAfty(); c.id = nome; c.name = nome; c.rulesVersion = sistema; c.core.nd = 12; c.attrMethod = "fixos";
 c.attributes = { forca: 14, destreza: 12, constituicao: 13, inteligencia: 10, sabedoria: 15, presenca: 8 };
 c.core.origem = { id: "inato", bonusAtributos: { forca: 2, sabedoria: 1 } };
 c.especializacoes = [{ id: "suporte", nivel: 12 }];
 c.habilidadesGerais = sistema === "afty" ? ["ger_especializacao"] : [];
 c.habilidades = [CURA, "sup_sintonizacao_vital", ...(sistema === "afty" ? [ID] : [])];
 c.pericias = { medicina:"treinado",feiticaria:"treinado" };
 return c;
}

const browser = await chromium.launch({ channel: "chrome", ignoreDefaultArgs: ["--hide-scrollbars"] });
const resultados = [];
try {
 for (const sistema of ["player","afty"]) for (const largura of [1440,390]) for (const g2 of [false,true]) {
  const c = ficha(sistema,"CX3 Medicina"), a = ficha(sistema,"CX3 Paciente"), d = deriveAfty(c), da = deriveAfty(a);
  const s = { ...S.sessaoEmBranco(d),hpAtual:d.hp-50 }, encontro = criarEncontro({nome:"CX3 Medicina na Mesa"});
  assert.ok(d.habilidades.efetivas.includes(ID)); assert.deepEqual(d.habilidades.inacessiveis,[]);
  encontro.combatentes = [c,a].map((f,i)=>definirIniciativa(criarCombatente(f,{derived:[d,da][i]}),20-i*5));
  encontro.combatentes[1].sessao.hpAtual=da.hp-6;
  const ctx = await browser.newContext({viewport:{width:largura,height:1000},isMobile:largura===390,hasTouch:largura===390});
  await ctx.addInitScript(({sistema,c,s,encontro})=>{
   if (localStorage.getItem("cx3-medicina")) return;
   localStorage.setItem("cx3-medicina","1"); localStorage.setItem("fm_creatures_"+sistema+"_v1",JSON.stringify([c]));
   localStorage.setItem("fm_ficha_sessao_afty_v1:"+c.id,JSON.stringify(s));
   localStorage.setItem("afty_encontros_v1",JSON.stringify([encontro]));
  },{sistema,c,s,encontro});
  const page = await ctx.newPage(), erros = [];
  page.on("pageerror",e=>erros.push(e.message)); page.setDefaultTimeout(8500);
  const abreItem = async (previa=false)=>{
   await page.getByRole("tab",{name:"Habilidades",exact:true}).click();
   if (previa) {
    await page.getByRole("button",{name:NOME+". Consultar a regra",exact:true}).click();
    return page.getByRole("dialog",{name:"Consulta: "+NOME,exact:true});
   }
   const el = page.locator('[id="afty-item-especializacao:'+CURA+'"]'), bt=el.getByRole("button",{name:NOME,exact:true});
   if (await bt.getAttribute("aria-expanded")!=="true") await bt.click();
   return el;
  };
  const rolar = async el=>{
   await el.getByRole("checkbox",{name:/^Medicina Infalível/}).check();
   await page.evaluate(()=>{ globalThis.cx3Random = Math.random; Math.random = ()=>0.25; });
   try { await el.getByRole("button",{name:"Rolar Cura",exact:true}).click(); }
   finally { await page.evaluate(()=>{ Math.random = globalThis.cx3Random; delete globalThis.cx3Random; }); }
   await el.getByRole("checkbox",{name:"Maximizar Dado 1 da Cura",exact:true}).waitFor();
  };
  const conclui = async el=>{
   await el.getByRole("checkbox",{name:"Maximizar Dado 1 da Cura",exact:true}).check();
   await el.getByRole("checkbox",{name:"Maximizar Dado 2 da Cura",exact:true}).check();
   await el.getByRole("button",{name:"Aplicar Cura",exact:true}).click();
  };
  const le = (mesa=false)=>page.evaluate(({mesa,nome})=>mesa?JSON.parse(localStorage.getItem("afty_encontros_v1"))[0].combatentes.map(c=>c.sessao)
   :JSON.parse(localStorage.getItem("fm_ficha_sessao_afty_v1:"+nome)),{mesa,nome:c.id});
  const abreFicha = ()=>page.getByText(c.name,{exact:true}).click();
  const abreMesa = async ()=>{
   await page.getByRole("button",{name:"Encontros",exact:true}).click(); await page.getByText(encontro.nome,{exact:true}).click();
  };
  const foca = async ()=>{
   if (largura===390) await page.getByRole("button",{name:"Iniciativa",exact:true}).click();
   await page.getByText(c.name,{exact:true}).filter({visible:true}).first().click();
  };
  const verifica = async (antes,leitura,mesa=false)=>{
   const depois = mesa ? leitura[0] : leitura;
   const r = depois.log.find(x=>x.id===antes.id);
   const mod = r.medicinaInfalivel.reduce((n,x)=>n+x.para-x.de,0);
   assert.equal(r.total,antes.total+mod); assert.equal(r.medicinaInfalivel.length,2);
   assert.equal(depois.usos["hab:"+ID],2); assert.equal(depois.log.filter(x=>x.id===r.id).length,1);
   assert.equal(mesa?leitura[1].hpAtual:depois.hpAtual,mesa?da.hp:Math.min(d.hp,s.hpAtual+r.total));
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   return {total:r.total,usos:2,pv:r.contextoCura.recuperado};
  };

  await page.goto("http://127.0.0.1:5193/"+sistema+(g2?"?ficha-g2=1":""),{waitUntil:"networkidle"});
  await abreFicha(); let el=await abreItem(g2); await rolar(el);
  await page.waitForFunction(nome=>JSON.parse(localStorage.getItem("fm_ficha_sessao_afty_v1:"+nome)).log.some(r=>r.contextoCura?.tipo==="medicinaPendente"),c.id);
  let antes=(await le()).log.find(r=>r.contextoCura?.tipo==="medicinaPendente");
  assert.equal((await le()).hpAtual,s.hpAtual);
  await page.reload({waitUntil:"networkidle"}); await abreFicha(); el=await abreItem(g2);
  await el.getByRole("button",{name:"Aplicar Cura",exact:true}).scrollIntoViewIfNeeded();
  if (largura===390) await page.screenshot({path:".audit/cx3-20261102/"+sistema+"-"+largura+"-medicina-"+(g2?"g2":"classica")+".png"});
  await conclui(el);
  await page.waitForFunction(nome=>JSON.parse(localStorage.getItem("fm_ficha_sessao_afty_v1:"+nome)).log.some(r=>r.medicinaInfalivel),c.id);
  resultados.push({sistema,largura,g2,ficha:await verifica(antes,await le())});

  if (!g2) {
   await page.getByRole("button",{name:"Voltar",exact:true}).click(); await abreMesa();
   await page.getByRole("button",{name:"Começar",exact:true}).click(); await foca(); el=await abreItem();
   await el.getByRole("combobox",{name:"Alvo da Cura",exact:true}).selectOption(encontro.combatentes[1].id);
   await el.getByText("Alvo é Aliado",{exact:true}).click(); await rolar(el);
   await page.waitForFunction(()=>JSON.parse(localStorage.getItem("afty_encontros_v1"))[0].combatentes[0].sessao.log.some(r=>r.contextoCura?.tipo==="medicinaPendente"));
   const [suporte,paciente] = await le(true);
   assert.equal(paciente.hpAtual,da.hp-6);
   antes=suporte.log.find(r=>r.contextoCura?.tipo==="medicinaPendente");
   await page.reload({waitUntil:"networkidle"}); await abreMesa(); await foca(); el=await abreItem();
   await conclui(el);
   await page.waitForFunction(()=>JSON.parse(localStorage.getItem("afty_encontros_v1"))[0].combatentes[0].sessao.log.some(r=>r.medicinaInfalivel));
   const depois=await le(true);
   assert.deepEqual(depois[0].uso.acoes,suporte.uso.acoes); assert.equal(depois[0].peAtual,suporte.peAtual);
   resultados.push({sistema,largura,mesa:await verifica(antes,depois,true)});
  }
  assert.deepEqual(erros,[]); console.log(sistema,largura,g2?"G2":"Clássica e Encontro","Medicina OK"); await ctx.close();
 }
} finally {
 await writeFile(new URL("browser-medicina-resultados.json",import.meta.url),JSON.stringify(resultados,null,2));
 await browser.close();
}
