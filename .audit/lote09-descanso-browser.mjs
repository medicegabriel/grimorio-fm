import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const base='http://127.0.0.1:5199';
await mkdir('.audit/lote09-shots',{recursive:true});
const browser=await chromium.launch({channel:'chrome',ignoreDefaultArgs:['--hide-scrollbars']});
const resultado=[];
try {
 for(const rota of ['afty','player']) for(const largura of [1440,390]) for(const modo of ['ficha','encontro','todos']) {
  const ctx=await browser.newContext({viewport:{width:largura,height:1000},isMobile:largura===390,hasTouch:largura===390});
  const page=await ctx.newPage(); const erros=[];
  page.on('pageerror',e=>erros.push(e.message));
  page.on('console',m=>{if(m.type()==='error')erros.push(m.text());});
  await page.goto(base+'/'+rota,{waitUntil:'networkidle'});
  const esperado=await page.evaluate(async ({sistema,modo})=>{
   const {deriveAfty}=await import('/src/systems/afty/afty-derive.js');
   const {createBlankAfty}=await import('/src/systems/afty/afty-schema.js');
   const I=await import('/src/systems/afty/afty-invocacoes.js');
   const S=await import('/src/systems/afty/ficha/ficha-sessao.js');
   const E=await import('/src/systems/afty/encontros/afty-encontro.js');
   const {aplicarAddons}=await import('/src/systems/afty/afty-addons.js');
   aplicarAddons([]);
   const preparar=(sistema,id,nome)=>{
    const c=createBlankAfty(); c.id=id;c.name=nome;c.rulesVersion=sistema;c.core.nd=10;c.core.nivel=10;
    c.especializacoes=[{id:'controlador',nivel:10}];
    c.invocacoes=['A','B','C','D','H'].map(id=>({...I.createBlankInvocacao('quarto','marionete'),id,nome:'Marionete '+id}));
    const d=deriveAfty(c,{invocacoes:{}});
    const s={...S.sessaoEmBranco(d),hpAtual:1,peAtual:2,rodada:4,invocacoes:{
     A:{estado:'ativa',pvAtual:4,quedas:1},B:{estado:'recolhida',pvAtual:0,quedas:2,retorno:0.25},
     C:{estado:'guardada',pvAtual:7,quedas:1},D:{estado:'destruida',pvAtual:0,quedas:3}}};
    return {c,d,s};
   };
   const x=preparar(sistema,'lote09-descanso','Lote 09 Descanso');
   localStorage.setItem('fm_creatures_'+sistema+'_v1',JSON.stringify([x.c]));
   localStorage.setItem('fm_ficha_sessao_afty_v1:'+x.c.id,JSON.stringify(x.s));
   const enc=E.criarEncontro({nome:'Lote 09 Descanso'});enc.id='lote09-encontro';enc.status=modo==='todos'?'finalizado':'ativo';enc.rodada=4;
   enc.combatentes=[{...E.criarCombatente(x.c,{derived:x.d}),id:'c1',sessao:x.s}];enc.ativoId=modo==='todos'?null:'c1';
   const y=preparar(sistema==='afty'?'player':'afty','lote09-outro','Lote 09 Outro');
   if(modo==='todos')enc.combatentes.push({...E.criarCombatente(y.c,{derived:y.d}),id:'c2',sessao:y.s});
   localStorage.setItem('afty_encontros_v1',JSON.stringify([enc]));
   return {hp:x.d.hp,pe:x.d.pe,outro:{hp:y.d.hp,pe:y.d.pe}};
  },{sistema:rota,modo});
  await page.reload({waitUntil:'networkidle'});
  if(modo==='ficha') await page.getByText('Lote 09 Descanso',{exact:true}).click();
  else {
   await page.getByRole('button',{name:'Encontros',exact:true}).first().click();
   await page.locator('.afty-encontro-card').filter({hasText:'Lote 09 Descanso'}).getByRole('button',{name:modo==='todos'?'Ver Resumo':'Retomar',exact:true}).click();
  }
  const botao=page.getByRole('button',{name:modo==='ficha'?'Descanso':modo==='todos'?'Descansar Todos':'Descansar',exact:true});
  const ler=()=>page.evaluate(modo=>modo==='ficha'?JSON.parse(localStorage.getItem('fm_ficha_sessao_afty_v1:lote09-descanso')):JSON.parse(localStorage.getItem('afty_encontros_v1')).find(e=>e.id==='lote09-encontro').combatentes.map(c=>c.sessao),modo);
  const antes=await ler();
  await botao.click();
  const modal=page.getByRole('dialog',{name:'Descanso',exact:true});await modal.waitFor();
  const submit=modal.getByRole('button',{name:'Descansar',exact:true});
  assert.equal(await submit.isEnabled(),false);
  const selecoes=modal.locator('select');assert.equal(await selecoes.count(),modo==='todos'?2:1);
  assert.deepEqual(await selecoes.first().locator('option').evaluateAll(els=>els.map(e=>e.value)),['','A','B','C']);
  const tamanho=await modal.evaluate(el=>({left:el.getBoundingClientRect().left,right:el.getBoundingClientRect().right,viewport:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth}));
  assert.ok(tamanho.left>=0 && tamanho.right<=tamanho.viewport);assert.equal(tamanho.overflow,false);
  await page.screenshot({path:'.audit/lote09-shots/'+rota+'-'+largura+'-'+modo+'-escolha.png'});
  await page.keyboard.press('Escape');await modal.waitFor({state:'hidden'});assert.deepEqual(await ler(),antes);
  await botao.click();await modal.getByRole('button',{name:'Cancelar',exact:true}).click();await modal.waitFor({state:'hidden'});assert.deepEqual(await ler(),antes);
  await botao.click();await selecoes.first().selectOption('B');
  if(modo==='todos'){assert.equal(await submit.isEnabled(),false);await selecoes.nth(1).selectOption('A');}
  assert.equal(await submit.isEnabled(),true);await submit.click();await modal.waitFor({state:'hidden'});
  await page.waitForFunction(modo=>{
   const s=modo==='ficha'?JSON.parse(localStorage.getItem('fm_ficha_sessao_afty_v1:lote09-descanso')):JSON.parse(localStorage.getItem('afty_encontros_v1')).find(e=>e.id==='lote09-encontro').combatentes[0].sessao;
   return s.invocacoes.B.pvAtual===null&&s.invocacoes.B.quedas===0;
  },modo);
  const depois=await ler();const primeiro=modo==='ficha'?depois:depois[0];
  const vitais=(s,id)=>[s.invocacoes[id].estado,s.invocacoes[id].pvAtual,s.invocacoes[id].quedas];
  assert.deepEqual(vitais(primeiro,'A'),['ativa',4,1]);assert.deepEqual(vitais(primeiro,'B'),['fora',null,0]);
  assert.deepEqual(vitais(primeiro,'C'),['guardada',7,1]);assert.deepEqual(vitais(primeiro,'D'),['destruida',0,3]);
  assert.deepEqual([primeiro.hpAtual,primeiro.peAtual,primeiro.rodada],[esperado.hp,esperado.pe,0]);
  if(modo==='todos'){
   assert.deepEqual(vitais(depois[1],'A'),['ativa',null,0]);assert.deepEqual(vitais(depois[1],'B'),['recolhida',0,2]);
   assert.deepEqual([depois[1].hpAtual,depois[1].peAtual],[esperado.outro.hp,esperado.outro.pe]);
  }
  assert.deepEqual(erros,[]);resultado.push({rota,largura,modo,cancelamento:true,escolha:'B',demaisPreservadas:true,sistemaDaFicha:true,erros});
  console.log('PASSOU '+rota+' '+largura+' '+modo);await ctx.close();
 }
 await writeFile('.audit/lote09-descanso-browser.json',JSON.stringify(resultado,null,2));
} finally {await browser.close();}
