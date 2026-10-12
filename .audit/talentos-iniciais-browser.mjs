import { register } from "node:module";
import { chromium } from "playwright";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}', import.meta.url);
const R = new URL("../src/systems/afty/", import.meta.url).href;
await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
await mkdir(".audit/talentos-iniciais-shots",{recursive:true});
const json = await readFile("addons/talentos-iniciais.json","utf8");
const browser = await chromium.launch({channel:"chrome",ignoreDefaultArgs:["--hide-scrollbars"]});
const report=[];
try {
 for(const sistema of ["player","afty"]) {
  const ficha=createBlankAfty();ficha.rulesVersion=sistema;ficha.core.nd=1;ficha.name="Teste de Talentos "+sistema;ficha.especializacoes=[{id:"lutador",nivel:1}];
  const path=".audit/talentos-iniciais-"+sistema+".json";
  await writeFile(path,JSON.stringify({version:"2.0",system:"Feiticeiros e Maldições",creatures:[ficha]}));
  for(const largura of [1440,390]) {
   const ctx=await browser.newContext({viewport:{width:largura,height:1000},isMobile:largura===390,hasTouch:largura===390});
   const page=await ctx.newPage();page.setDefaultTimeout(15000);
   const erros=[];page.on("pageerror",e=>erros.push(e.message));
   await page.goto("http://localhost:5173/"+(sistema==="player"?"Player":"Afty"),{waitUntil:"networkidle"});
   await page.getByRole("button",{name:"Importar",exact:true}).click();
   await page.locator("input[type=file]").setInputFiles(path);
   await page.getByText(ficha.name,{exact:true}).first().waitFor();
   await page.getByRole("dialog").getByRole("button",{name:"Fechar",exact:true}).last().click();
   await page.getByText(ficha.name,{exact:true}).first().click();
   await page.locator('button[title="Editar no criador"]').click();
   const addons=async()=>{await page.getByRole("tab",{name:"Outros",exact:true}).click();await page.getByRole("menuitem",{name:"Addons",exact:true}).click();};
   await addons();
   await page.getByRole("button",{name:"Instalar",exact:true}).click();
   await page.locator("textarea").fill(json);
   await page.getByRole("button",{name:"Instalar",exact:true}).last().click();
   const usar=page.locator('button[aria-pressed="false"][title^="Usar"]');
   assert.equal(await usar.count(),1);await usar.click();
   const campo=page.getByRole("spinbutton",{name:"Quantidade de Talentos Iniciais",exact:true});
   assert.equal(await campo.inputValue(),"1");
   assert.equal(await campo.getAttribute("min"),"1");assert.equal(await campo.getAttribute("max"),"4");
   const contador=page.locator('[title="Vagas exclusivas de Talento, que não servem para Habilidade de Especialização"]');
   const total=async()=>Number((await contador.innerText()).split("/")[1].trim());
   let inicial;
   for(const n of [1,2,3,4]) {
    await campo.fill(String(n));await campo.press("Tab");
    await page.getByRole("tab",{name:"Especializações",exact:true}).click();
    const atual=await total();if(n===1) inicial=atual;
    assert.equal(atual,inicial+n-1);await addons();
   }
   for(const [digitado,esperado] of [["0","1"],["5","4"],["","4"],["2.5","4"]]) {
    await campo.fill(digitado);await campo.press("Tab");assert.equal(await campo.inputValue(),esperado);
   }
   await campo.fill("3");await campo.press("Enter");assert.equal(await campo.inputValue(),"3");
   await campo.fill("4");await campo.press("Tab");
   assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem("fm_addons_afty_v1"))[0].regrasAfty.talentosIniciais),1);
   await campo.scrollIntoViewIfNeeded();
   await page.screenshot({path:".audit/talentos-iniciais-shots/campo-"+sistema+"-"+largura+".png"});
   await page.getByRole("tab",{name:"Especializações",exact:true}).click();
   await page.getByRole("tab",{name:/^Talentos/}).click();
   const talento=page.getByRole("button",{name:"Escolher Ataque Infalível",exact:true});
   await talento.click();
   assert.match(await contador.innerText(),/\+1\s*\//);
   await contador.scrollIntoViewIfNeeded();
   await page.screenshot({path:".audit/talentos-iniciais-shots/escolha-"+sistema+"-"+largura+".png"});
   await page.getByRole("button",{name:"Salvar Alterações",exact:true}).click();
   const chave="fm_creatures_"+sistema+"_v1";
   const salvo=await page.evaluate(k=>JSON.parse(localStorage.getItem(k))[0],chave);
   assert.equal(salvo.addons.find(p=>p.id==="talentos-iniciais").regrasAfty.talentosIniciais,4);
   assert.equal(salvo.talentos.includes("tal_ataque_infalivel"),true);
   await page.getByText(ficha.name,{exact:true}).first().click();
   await page.locator('button[title="Editar no criador"]').click();await addons();
   assert.equal(await campo.inputValue(),"4");
   await page.getByRole("button",{name:/Tirar deste personagem|Tirar desta criatura/i}).last().click();
   assert.equal(await campo.count(),0);
   await page.getByRole("tab",{name:"Especializações",exact:true}).click();
   if(inicial===1) assert.equal(await contador.count(),0);else assert.equal(await total(),inicial-1);
   await page.getByRole("tab",{name:/^Talentos/}).click();
   assert.equal(await page.getByRole("button",{name:"Remover Ataque Infalível",exact:true}).count(),1);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   assert.deepEqual(erros,[]);
   report.push({sistema,largura,instalacao:true,quantidades:[1,2,3,4],limites:true,escolha:true,persistencia:true,remocao:true,erros});
   await ctx.close();
  }
 }
 await writeFile(".audit/talentos-iniciais-report.json",JSON.stringify(report,null,2));
 console.log(JSON.stringify(report));
}finally {await browser.close();}
