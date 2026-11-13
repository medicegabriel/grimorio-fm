import fs from 'node:fs';
import {chromium} from 'playwright';
const nav=await chromium.launch({channel:'chrome',ignoreDefaultArgs:['--hide-scrollbars']});
const resultados=[],erros=[];
const check=(nome,ok,dados)=>{resultados.push({nome,ok:!!ok,dados}); console.log(`${ok?'OK':'FALHA'} ${nome}${ok?'':' '+JSON.stringify(dados)}`);};
const abre=async(modo='',tema='escuro',width=1440)=>{
 const ctx=await nav.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
 const p=await ctx.newPage();
 p.on('pageerror',e=>erros.push(e.message));
 await p.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
 await p.goto(`http://127.0.0.1:5345/?ficha=mesa&tema=${tema}&modo=${modo}`);
 await p.locator('.afty-nome').waitFor();
 return {p,ctx};
};
const painel=async(p,modo)=>{
 if(modo==='classica') await p.getByRole('button',{name:/Aparência/}).first().click();
 else {await p.getByRole('button',{name:'Mais opções da ficha'}).click();await p.getByRole('menuitem',{name:'Aparência',exact:true}).click();}
 await p.getByRole('dialog',{name:'Aparência',exact:true}).waitFor();
};
const css='.afty-nome {color: #ff00aa}\n.afty-card {background: #123456}\n.afty-aba {color: #00aaee}\n.afty-valor {color: #12ab34}\n.afty-botao {background: #345678}\n.afty-stat-valor {color: #dc218e}';
for(const modo of ['', 'classica']) for(const width of [1440,390]) {
 const {p,ctx}=await abre(modo,'escuro',width); const id=`${modo||'g2'}/${width}`;
 await painel(p,modo);
 const d=p.getByRole('dialog',{name:'Aparência',exact:true});
 check(`${id} modal acessível`,await d.getAttribute('aria-modal')==='true');
 const ordem=await d.locator('button,input,textarea,select,a[href],[tabindex]').evaluateAll(els=>els.filter(e=>!e.disabled&&e.tabIndex>=0&&e.getClientRects().length).map(e=>e.outerHTML.slice(0,100)));
 const ultimo=d.getByRole('button',{name:'Usar este tema como padrão'});await ultimo.focus();await p.keyboard.press('Tab');
 check(`${id} Tab fica no painel`,await d.evaluate(e=>e.contains(document.activeElement)));
 await d.getByRole('button',{name:'Serifada',exact:true}).click();
 const fontes=await p.locator('.afty-nome').evaluate(e=>getComputedStyle(e).fontFamily);
 check(`${id} fonte escolhida chega ao nome`,fontes.includes('Georgia'),fontes);
 if(!modo){
  const ns=await p.locator('.m-rolar-num').evaluateAll(els=>els.slice(0,4).map(e=>getComputedStyle(e).fontFamily));
  check(`${id} fonte chega aos números`,ns.length&&ns.every(s=>s.includes('Georgia')),ns);
 }
 await d.getByRole('slider',{name:'Arredondamento dos cantos'}).fill('0');
 const raio=await p.locator(modo?'.afty-card':'.m-secao').first().evaluate(e=>getComputedStyle(e).borderTopLeftRadius);
 check(`${id} cantos respondem ao formulário`,raio==='0px',raio);
 await d.getByRole('textbox',{name:'CSS personalizado',exact:true}).fill(css);
 await p.waitForTimeout(300);
 const nome=await p.locator('.afty-nome').evaluate(e=>getComputedStyle(e).color);
 check(`${id} CSS simples muda nome`,nome==='rgb(255, 0, 170)',nome);
 if(!modo){
  const ns=await p.locator('.e-stat .m-valor-botao').evaluateAll(es=>es.filter(e=>e.getClientRects().length).map(e=>getComputedStyle(e).color));
  check(`${id} CSS chega ao número real do cabeçalho`,ns.length&&ns.every(c=>c==='rgb(220, 33, 142)'),ns);
  const valores=await p.locator('.m-rolar-num').evaluateAll(els=>els.map(e=>getComputedStyle(e).color));
  check(`${id} CSS simples muda números`,valores.length&&valores.every(c=>c==='rgb(18, 171, 52)'),valores);
  const tab=await p.locator('[data-afty-aba="acoes"]').evaluate(e=>getComputedStyle(e).color);
  check(`${id} CSS simples muda aba ativa`,tab==='rgb(0, 170, 238)',tab);
  const cards=await p.locator('.e-g2 .afty-card').evaluateAll(els=>els.filter(e=>e.getClientRects().length).map(e=>getComputedStyle(e).backgroundColor));
  check(`${id} CSS simples muda seções`,cards.length&&cards.every(c=>c==='rgb(18, 52, 86)'),cards);
  await d.getByRole('button',{name:'Fechar',exact:true}).click();
  await p.locator('[data-afty-aba="habilidades"]').click();
  const preparos=p.locator('.e-ativar-preparo');
  check(`${id} há controle de preparo para provar três níveis`,await preparos.count()>0);
  const bs=await preparos.evaluateAll(els=>els.map(e=>getComputedStyle(e).backgroundColor));
  check(`${id} CSS simples vence botão de três níveis`,bs.length&&bs.every(c=>c==='rgb(52, 86, 120)'),bs);
  for(const a of ['habilidades','pericias','equipamentos','acoes']) {
   await p.locator(`[data-afty-aba="${a}"]`).click();await p.waitForTimeout(200);
   const cores=await p.locator('.e-g2 .afty-card').evaluateAll(els=>els.filter(e=>e.getClientRects().length).map(e=>getComputedStyle(e).backgroundColor));
   check(`${id} seções em ${a} após revelar`,cores.length&&cores.every(c=>c==='rgb(18, 52, 86)'),cores);
  }
  await painel(p,modo);
 }
 await d.getByRole('button',{name:'Voltar ao tema padrão',exact:true}).click();
 check(`${id} reset limpa`,await d.getByRole('textbox',{name:'CSS personalizado',exact:true}).inputValue()==='');
 await d.getByRole('button',{name:'Restaurar',exact:true}).click();
 check(`${id} Restaurar recupera CSS`,await d.getByRole('textbox',{name:'CSS personalizado',exact:true}).inputValue()===css);
 await d.getByRole('tab',{name:'Seletores',exact:true}).click();
 const codes=await d.locator('code').evaluateAll(els=>els.map(e=>({cor:getComputedStyle(e).color,bg:getComputedStyle(e).backgroundColor,w:e.scrollWidth,c:e.clientWidth})));
 check(`${id} seletores legíveis e sem corte`,codes.length>20&&codes.every(e=>e.bg==='rgba(0, 0, 0, 0)'&&e.w<=e.c+1),codes.slice(0,2));
 await d.locator('code').first().scrollIntoViewIfNeeded();
 await p.screenshot({path:new URL(`seletores-${modo||'g2'}-${width}.png`,import.meta.url).pathname.replace(/^\/([A-Za-z]:)/,'$1')});
 await d.getByRole('tab',{name:'Prompt IA',exact:true}).click();
 const prompt=await d.getByRole('textbox',{name:'Prompt para a IA'}).inputValue();
 check(`${id} prompt descreve a estrutura`,modo?!prompt.includes('O G2 não usa'):prompt.includes('O G2 não usa'));
 if(!modo) check(`${id} contrato exclui moldura antiga`,!prompt.includes('`.afty-retrato-painel`'));
 await p.screenshot({path:new URL(`editor-${modo||'g2'}-${width}.png`,import.meta.url).pathname.replace(/^\/([A-Za-z]:)/,'$1')});
 await p.keyboard.press('Escape');
 check(`${id} Esc fecha`,await d.count()===0);
 check(`${id} foco retorna`,await p.evaluate(()=>document.activeElement?.tagName==='BUTTON'));
 await p.waitForTimeout(750);const n=await p.evaluate(()=>window.__salvos.length);
 await p.waitForTimeout(1250);
 check(`${id} não há laço de gravação`,n>0&&n===await p.evaluate(()=>window.__salvos.length),{n,agora:await p.evaluate(()=>window.__salvos.length)});
 await ctx.close();
}
for(const width of [320,390,1440]) {
 const {p,ctx}=await abre('','alter',width);
 for(const a of ['acoes','habilidades','pericias','equipamentos','invocacoes','buffs']) {
  await p.locator(`[data-afty-aba="${a}"]`).click();
  check(`Alter/${width}/${a} cabe`,await p.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth));
 }
 await p.screenshot({path:new URL(`alter-${width}.png`,import.meta.url).pathname.replace(/^\/([A-Za-z]:)/,'$1')});await ctx.close();
}
check('sem erros de página',!erros.length,erros);
fs.writeFileSync(new URL('editor-resultados.json',import.meta.url),JSON.stringify({resultados,erros},null,2));
await nav.close();
if(resultados.some(r=>!r.ok))process.exitCode=1;
