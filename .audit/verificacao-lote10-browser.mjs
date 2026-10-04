import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
await mkdir('.audit/verificacao-lote10-shots',{recursive:true});
const browser=await chromium.launch({channel:'chrome',ignoreDefaultArgs:['--hide-scrollbars']});
const report=[];
try {
 for(const sistema of ['afty','player']) for(const largura of [1440,390]) {
  const context=await browser.newContext({viewport:{width:largura,height:1000},isMobile:largura===390,hasTouch:largura===390});
  const page=await context.newPage();
  const erros=[]; page.on('pageerror',e=>erros.push(e.message));page.on('console',m=>{if(m.type()==='error')erros.push(m.text());});
  await page.goto('http://127.0.0.1:5273/'+sistema,{waitUntil:'networkidle'});
  const initial=await page.evaluate(async sistema=>{
   const {deriveAfty}=await import('/src/systems/afty/afty-derive.js');
   const {createBlankAfty}=await import('/src/systems/afty/afty-schema.js');
   const I=await import('/src/systems/afty/afty-invocacoes.js');
   const A=await import('/src/systems/afty/afty-addons.js');
   const c=createBlankAfty();c.id='lote10';c.name='Lote 10 Decisões';c.rulesVersion=sistema;
   c.core.nd=26;c.core.tipo='misto';c.core.origem={id:'herdado',cla:'cla_zenin',bonusAtributos:{inteligencia:2,presenca:1}};
   c.especializacoes=[{id:'controlador',nivel:26}];c.habilidades=['ctr_treinamento_em_controle'];
   c.habilidadesLendarias=['len_versatilidade_extrema'];c.escolhasAltoNivel={len_versatilidade_extrema:['dom']};
   c.core.tecnicaEfeitos=[{canal:'limiteAptidao',alvo:'dom',expr:'1',nome:'Outra Fonte de Limite'}];
   if(sistema==='player')c.addons=[{id:'casa',nome:'Casa',versao:'1.0.0',acrescenta:{},libera:[A.liberacaoSoPorAddon('len_versatilidade_extrema')]}];
   c.invocacoes=['shikigami','tecnica'].map((tipo,i)=>({...I.createBlankInvocacao('quarto',tipo),id:'inv'+i,nome:i?'Sombra da Técnica':'Sombra Livre'}));
   A.aplicarAddons(c.addons);const d=deriveAfty(c);
   localStorage.setItem('fm_creatures_'+sistema+'_v1',JSON.stringify([c]));
   return {limite:d.aptidao.limite.dom,atributos:[d.attrEff.inteligencia,d.attrEff.presenca],tipos:d.invocacoes.lista.map(i=>[i.tipoMecanico,i.tipoLabel]),salva:JSON.stringify(c)};
  },sistema);
  assert.equal(initial.limite,7);assert.deepEqual(initial.atributos,[12,11]);assert.deepEqual(initial.tipos,[['shikigami','Shikigami'],['tecnica','Shikigami de Técnica']]);
  await page.reload({waitUntil:'networkidle'});await page.getByText('Lote 10 Decisões',{exact:true}).click();
  await page.getByRole('tab',{name:'Invocações',exact:true}).click();
  await page.getByText('Shikigami',{exact:true}).first().waitFor({state:'visible'});
  await page.screenshot({path:'.audit/verificacao-lote10-shots/'+sistema+'-'+largura+'-ficha-shikigami.png'});
  await page.getByText('Sombra da Técnica',{exact:true}).first().click();
  await page.getByText('Shikigami de Técnica',{exact:true}).first().waitFor({state:'visible'});
  await page.getByText('Shikigami de Técnica',{exact:true}).first().evaluate(el=>el.scrollIntoView({block:'center'}));
  await page.screenshot({path:'.audit/verificacao-lote10-shots/'+sistema+'-'+largura+'-ficha-tecnica.png'});
  const larguraFicha=await page.evaluate(()=>({janela:innerWidth,pagina:document.documentElement.scrollWidth}));
  await page.locator('button[title="Editar no criador"]').click();
  await page.getByRole('tab',{name:'Invocações',exact:true}).click();
  if(largura===390) await page.getByRole('button').filter({hasText:'Sombra Livre'}).first().click();
  await page.getByRole('button',{name:'Técnica',exact:true}).waitFor({state:'visible'});
  await page.getByRole('button',{name:'Shikigami',exact:true}).first().waitFor({state:'visible'});
  await page.screenshot({path:'.audit/verificacao-lote10-shots/'+sistema+'-'+largura+'-criador-filtros.png'});
  if(largura===390) await page.locator('button[aria-expanded="true"]').filter({hasText:'Sombra Livre'}).click();
  await page.getByRole('tab',{name:'Perfil',exact:true}).click();
  await page.getByRole('button',{name:'Shikigami',exact:true}).first().waitFor({state:'visible'});
  await page.getByRole('button',{name:'Shikigami de Técnica',exact:true}).waitFor({state:'visible'});
  await page.screenshot({path:'.audit/verificacao-lote10-shots/'+sistema+'-'+largura+'-criador-perfil.png'});
  const larguraCriador=await page.evaluate(()=>({janela:innerWidth,pagina:document.documentElement.scrollWidth}));
  const salvo=await page.evaluate(sistema=>JSON.parse(localStorage.getItem('fm_creatures_'+sistema+'_v1'))[0],sistema);
  assert.deepEqual(salvo.invocacoes.map(i=>i.tipoMecanico),['shikigami','tecnica']);assert.deepEqual(salvo.core.origem.bonusAtributos,{inteligencia:2,presenca:1});
  assert.deepEqual(erros,[]);assert.ok(larguraFicha.pagina<=larguraFicha.janela);assert.ok(larguraCriador.pagina<=larguraCriador.janela);
  report.push({sistema,largura,limite:initial.limite,atributos:initial.atributos,tipos:initial.tipos,larguraFicha,larguraCriador,curtos:['Shikigami','Técnica'],erros});
  await context.close();
 }
}finally{await browser.close();}
await writeFile('.audit/verificacao-lote10-browser-resultados.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
