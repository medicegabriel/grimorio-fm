import fs from 'node:fs';
import { chromium } from 'playwright';
const dir = new URL('.', import.meta.url);
const nav = await chromium.launch({channel:'chrome',ignoreDefaultArgs:['--hide-scrollbars']});
const props = ['color','backgroundColor','borderTopColor','borderBottomColor','borderTopWidth','borderBottomWidth','borderRadius','fontFamily','fontSize','fontWeight','lineHeight','marginTop','marginBottom','paddingTop','paddingBottom','paddingLeft','height','width','display','position','boxShadow','outlineStyle','textDecorationColor'];
const out = [];
for(const [ficha,tema] of [['mesa','escuro'],['mesa','claro'],['arsenal','minamoto'],['criatura','escuro']]) {
 for(const largura of [1440,390]) for(const aba of ['acoes','habilidades','pericias','equipamentos']) {
  const valores=[];
  for(const porta of [5344,5345]) {
   const ctx=await nav.newContext({viewport:{width:largura,height:1000},reducedMotion:'reduce'});
   const p=await ctx.newPage();
   await p.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
   await p.goto(`http://127.0.0.1:${porta}/?ficha=${ficha}&tema=${tema}`);
   await p.locator(`[data-afty-aba="${aba}"]`).click();
   await p.waitForTimeout(100);
   await p.addStyleTag({content:'*{caret-color:transparent!important;animation:none!important;transition:none!important}'});
   valores.push(await p.evaluate(props=>[...document.querySelectorAll('#afty-ficha *')].filter(e=>e.getClientRects().length).map(e=>({tag:e.tagName,classes:typeof e.className==='string'?e.className:'svg',texto:e.childElementCount?'':e.textContent.slice(0,40),v:Object.fromEntries(props.map(k=>[k,getComputedStyle(e)[k]]))})),props));
   await p.screenshot({path:new URL(`${ficha}-${tema}-${largura}-${aba}-${porta}.png`,dir).pathname.replace(/^\/([A-Za-z]:)/,'$1')});
   await ctx.close();
  }
  const dif=[];
  for(let i=0;i<valores[0].length;i++) {
   const a=valores[0][i],b=valores[1][i];
   if(!b||a.classes!==b.classes){dif.push({i,dom:[a?.classes,b?.classes]});continue;}
   const v=Object.fromEntries(props.filter(k=>a.v[k]!==b.v[k]).map(k=>[k,[a.v[k],b.v[k]]]));
   if(Object.keys(v).length) dif.push({i,classes:a.classes,texto:a.texto,v});
  }
  out.push({ficha,tema,largura,aba,dif});
  fs.writeFileSync(new URL('comparacao-parcial.json',dir),JSON.stringify(out,null,2));
  console.log(`${ficha}/${tema}/${largura}/${aba}: ${dif.length}`);
 }
}
fs.writeFileSync(new URL('comparacao.json',dir),JSON.stringify(out,null,2));
await nav.close();
