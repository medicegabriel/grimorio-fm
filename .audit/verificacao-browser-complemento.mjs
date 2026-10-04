import { chromium } from 'playwright'; import {writeFile,mkdir} from 'node:fs/promises';
const out='.audit/verificacao-evidencias';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',ignoreDefaultArgs:['--hide-scrollbars']});
const report=[];
try{
 for(const base of ['http://127.0.0.1:5274'])for(const route of ['', 'afty','player'])for(const width of [1440,390]){
  const ctx=await browser.newContext({viewport:{width,height:1000},hasTouch:width===390,isMobile:width===390});
  const p=await ctx.newPage();const errors=[];
  p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await p.goto(base+'/'+route,{waitUntil:'networkidle'});
  const title=await p.locator('body').innerText();
  report.push({production:true,route,width,errors,bodyLength:title.length,widthPage:await p.evaluate(()=>document.documentElement.scrollWidth)});
  await p.screenshot({path:out+'/producao-'+(route||'publico')+'-'+width+'.png'});
  await ctx.close();
 }
 for(const route of ['afty','player'])for(const width of [1440,390]){
  const ctx=await browser.newContext({viewport:{width,height:1000},hasTouch:width===390,isMobile:width===390});
  const p=await ctx.newPage();p.setDefaultTimeout(9000);const errors=[];
  p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  const base='http://127.0.0.1:5273/'+route;
  await p.goto(base,{waitUntil:'networkidle'});
  await p.evaluate(async system=>{
   const {deriveAfty}=await import('/src/systems/afty/afty-derive.js');
   const {createBlankAfty}=await import('/src/systems/afty/afty-schema.js');
   const {aplicarAddons}=await import('/src/systems/afty/afty-addons.js');aplicarAddons([]);
   const {AFTY_APTIDOES}=await import('/src/systems/afty/afty-aptidoes.js');
   const E=await import('/src/systems/afty/encontros/afty-encontro.js');
   const S=await import('/src/systems/afty/ficha/ficha-sessao.js');
   const f=createBlankAfty();Object.assign(f,{id:'verificacao-feto',name:'Verificação Feto',rulesVersion:system});
   f.core.nd=5;f.core.origem={id:'feto_amaldicoado_hibrido',anatomias:['instinto_sanguinario','olhos_sombrios']};
   f.aptidoesAmaldicoadas=[...new Set(AFTY_APTIDOES.map(a=>a.categoria))].map(cat=>AFTY_APTIDOES.find(a=>a.categoria===cat).id);
   const d=deriveAfty(f);const enc=E.criarEncontro({nome:'Verificação Encontro'});enc.id='verificacao-encontro';enc.status='ativo';enc.rodada=1;
   enc.combatentes=[{...E.criarCombatente(f,{derived:d}),id:'cmb-feto',sessao:{...S.sessaoEmBranco(d),rodada:1,combate:{ativo:true}}}];enc.ativoId='cmb-feto';
   localStorage.setItem('fm_creatures_'+system+'_v1',JSON.stringify([f]));localStorage.setItem('afty_encontros_v1',JSON.stringify([enc]));
  },route);
  await p.reload({waitUntil:'networkidle'});await p.getByText('Verificação Feto',{exact:true}).click();
  const dims=async label=>({label,...await p.evaluate(()=>({client:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth,viewport:innerWidth}))});
  const measures=[];
  const tabs=await p.getByRole('tab').allTextContents();
  for(const tab of tabs){
   await p.getByRole('tab',{name:tab,exact:true}).click();await p.waitForTimeout(100);const measure=await dims('ficha:'+tab);
   if(measure.scroll>measure.client+1){
    measure.overflow=await p.locator('.afty-estado-linha').evaluateAll(els=>els.filter(e=>e.getBoundingClientRect().right>document.documentElement.clientWidth).map(e=>({text:e.innerText,right:e.getBoundingClientRect().right,scroll:e.scrollWidth,width:e.clientWidth})));
    await p.screenshot({path:out+'/overflow-'+route+'-'+width+'-'+tab+'.png'});
   }
   measures.push(measure);
  }
  await p.getByRole('tab',{name:'Habilidades',exact:true}).click();
  const item=p.locator('[id="afty-item-anatomia:instinto_sanguinario"]');
  const anatomyText=await item.innerText();
  const marks=await item.locator('.afty-marca-fechada').evaluateAll(els=>els.map(e=>getComputedStyle(e).display));
  await item.locator('button[aria-expanded]').first().click();
  const open=await item.locator('.afty-mesa-aberta').innerText();
  await p.screenshot({path:out+'/anatomias-'+route+'-'+width+'.png'});
  // Source hover, touch and keyboard in the final sheet.
  const target=p.locator('[data-afty-stat="defesa"] .afty-stat-valor').first();
  await target.scrollIntoViewIfNeeded();
  if(width===390){await target.tap();}else{await target.hover();}
  const sources=await p.locator('.afty-fonte-linha:visible').allTextContents();
  if(width===390)await target.tap();else await p.mouse.move(0,0);
  await target.focus();await p.keyboard.press('Tab');await p.keyboard.press('Shift+Tab');await p.waitForTimeout(100);
  const keyboardSources=await p.locator('.afty-fonte-linha:visible').allTextContents();
  await p.keyboard.press('Tab');
  await p.getByRole('button',{name:'Voltar',exact:true}).click();
  await p.getByRole('button',{name:'Encontros',exact:true}).first().click();
  await p.locator('.afty-encontro-card').filter({hasText:'Verificação Encontro'}).getByRole('button',{name:'Retomar',exact:true}).click();
  await p.getByRole('tab',{name:'Habilidades',exact:true}).click();
  const encItem=p.locator('[id="afty-item-anatomia:instinto_sanguinario"]');
  const encounterMarks=await encItem.locator('.afty-marca-fechada').evaluateAll(els=>els.map(e=>getComputedStyle(e).display));
  const encTarget=p.locator('[data-afty-stat="defesa"] .afty-stat-valor').first();await encTarget.scrollIntoViewIfNeeded();
  if(width===390)await encTarget.tap();else await encTarget.hover();
  const encounterSources=await p.locator('.afty-fonte-linha:visible').allTextContents();
  await p.screenshot({path:out+'/encontro-feto-'+route+'-'+width+'.png'});
  measures.push(await dims('encontro'));
  await p.goto(base,{waitUntil:'networkidle'});
  await p.getByTitle(route==='afty'?'Criar nova criatura':'Criar novo personagem',{exact:true}).click();
  const creatorTabs=(await p.getByRole('tab').allTextContents()).filter(t=>t!=='Outros');
  for(const tab of creatorTabs){await p.getByRole('tab',{name:tab,exact:true}).click();await p.waitForTimeout(100);measures.push(await dims('criador:'+tab));}
  report.push({route,width,anatomyText,marks,open,sources,keyboardSources,encounterMarks,encounterSources,measures,errors});
  await ctx.close();
 }
}finally{await browser.close();await writeFile(out+'/browser-complemento.json',JSON.stringify(report,null,2));}
console.log(JSON.stringify(report,null,2));
