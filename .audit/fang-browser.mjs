import {chromium} from 'playwright';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const original=JSON.parse(fs.readFileSync('C:/Users/gabri/.codex/attachments/c2c829c0-1dac-444e-9669-ee7e171779dd/Texto colado.txt','utf8')).creatures[0];
const browser=await chromium.launch({channel:'chrome',headless:true});const report=[];
try{for(const width of [1440,390]){
 const context=await browser.newContext({viewport:{width,height:1000}});const page=await context.newPage();page.setDefaultTimeout(15000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5301/player',{waitUntil:'networkidle'});
 const expected=await page.evaluate(async raw=>{
  const c={...raw,rulesVersion:'player'};localStorage.setItem('fm_creatures_player_v1',JSON.stringify([c]));
  const {deriveAfty}=await import('/src/systems/afty/afty-derive.js');const {aplicarAddons}=await import('/src/systems/afty/afty-addons.js');const {sessaoEmBranco}=await import('/src/systems/afty/ficha/ficha-sessao.js');const {catalogoImitacao,idsPossuidosNaImitacao}=await import('/src/systems/afty/afty-imitacao.js');
  aplicarAddons(c.addons);const d=deriveAfty(c);const aprendidas=[{id:'cmb_critico_melhorado',tipo:'passiva'}];const sessao={...sessaoEmBranco(d),combate:{ativo:true,imitacao:{aprendidas}}};localStorage.setItem('fm_ficha_sessao_afty_v1:'+c.id,JSON.stringify(sessao));const owned=idsPossuidosNaImitacao(d,aprendidas);
  return catalogoImitacao('passiva').filter(h=>!owned.has(h.id)).map(h=>h.nome).sort();
 },original);
 await page.reload({waitUntil:'networkidle'});await page.getByText(original.name,{exact:true}).click();
 assert.equal(await page.getByRole('button',{name:'Novo turno',exact:true}).count(),0);assert.equal(await page.getByText(/^Ataques Extras/).count(),0);
 await page.getByRole('tab',{name:'Buffs',exact:true}).click();const panel=page.locator('section').filter({has:page.getByRole('heading',{name:'Imitação Perfeita',exact:true})});
 const types=panel.getByRole('tablist',{name:'Tipos de cópia'});await types.getByRole('tab',{name:/Habilidades passivas/}).click();
 const observed=[];const specs=panel.getByRole('tablist',{name:'Especializações de cópia'});for(const st of await specs.getByRole('tab').all()){
  await st.click();const levels=panel.getByRole('tablist',{name:'Níveis de cópia'});for(const lt of await levels.getByRole('tab').all()) {await lt.click();observed.push(...await panel.getByRole('region',{name:'Opções de cópia'}).getByRole('button').allTextContents());}
 }
 assert.deepEqual(observed.sort(),expected);assert.equal(observed.includes('Crítico Melhorado'),false);assert.equal(observed.includes('Corpo Calejado'),false);
 await panel.getByRole('textbox',{name:'Buscar cópia por texto'}).fill('Crítico Aperfeiçoado');assert.equal(await panel.getByRole('tablist',{name:'Especializações de cópia'}).getByRole('tab').count(),1);assert.equal(await panel.getByRole('tablist',{name:'Níveis de cópia'}).getByRole('tab').count(),1);
 await panel.getByRole('checkbox').check();await panel.getByRole('region',{name:'Opções de cópia'}).getByRole('button',{name:'Crítico Aperfeiçoado',exact:true}).click();
 await panel.getByRole('button',{name:'Encerrar cópia',exact:true}).waitFor();await page.getByRole('button',{name:'Próxima rodada',exact:true}).click();assert.equal(await panel.getByRole('button',{name:'Encerrar cópia'}).count(),1);
 await page.getByRole('button',{name:'Próxima rodada',exact:true}).click();assert.equal(await panel.getByRole('button',{name:'Encerrar cópia'}).count(),0);
 await panel.getByRole('textbox',{name:'Buscar cópia por texto'}).fill('Corpo Calejado');assert.equal(await panel.getByRole('region',{name:'Opções de cópia'}).getByRole('button').count(),0);
 await panel.getByRole('textbox',{name:'Buscar cópia por texto'}).fill('');await panel.screenshot({path:'.audit/fang-imitacao-'+width+'.png'});
 const horizontal=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);assert.equal(horizontal,false);assert.deepEqual(errors,[]);
 await page.reload({waitUntil:'networkidle'});await page.getByText(original.name,{exact:true}).click();await page.getByRole('tab',{name:'Buffs',exact:true}).click();await types.getByRole('tab',{name:/Habilidades ativas/}).click();await panel.getByRole('textbox',{name:'Buscar cópia por texto'}).fill('Crítico Melhorado');assert.equal(await panel.getByRole('region',{name:'Opções de cópia'}).getByRole('button').count(),0);
 report.push({width,disponiveis:expected.length,divisao:true,possuidasOcultas:true,aprendidasPreservadas:true,duracaoPelaRodada:true,persistencia:true,horizontal,errors});await context.close();
}}finally{fs.writeFileSync('.audit/fang-browser-report.json',JSON.stringify(report,null,2));await browser.close();}
console.log(JSON.stringify(report));
