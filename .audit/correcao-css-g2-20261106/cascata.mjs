import {chromium} from 'playwright';
const nav=await chromium.launch({channel:'chrome'});const p=await nav.newPage();
await p.goto('http://127.0.0.1:5345/?ficha=mesa&tema=escuro');
await p.getByRole('button',{name:'Mais opções da ficha'}).click();await p.getByRole('menuitem',{name:'Aparência',exact:true}).click();
await p.getByRole('textbox',{name:'CSS personalizado',exact:true}).fill('.afty-nome{color:#ff00aa}.afty-valor{color:#12ab34}.afty-aba{color:#00aaee}.afty-card{background:#123456}');
await p.waitForTimeout(100);
console.log(JSON.stringify(await p.evaluate(()=>{
 const out={};
 for(const sel of ['.afty-nome','.m-rolar-num','[data-afty-aba="acoes"]','.m-celula']) {
 const e=document.querySelector(sel);if(!e)continue;const r=[];
 const walk=(rules,ctx='')=>{for(const x of rules){if(x.cssRules)walk(x.cssRules,ctx+x.cssText.slice(0,x.cssText.indexOf('{')));if(x.selectorText&&e.matches(x.selectorText)&&(x.style.color||x.style.background))r.push({ctx,sel:x.selectorText,color:x.style.color,bg:x.style.background});}};
 [...document.styleSheets].forEach(s=>walk(s.cssRules));
 out[sel]={classes:e.className,color:getComputedStyle(e).color,r};
 }
 out.cards=[...document.querySelectorAll('.e-g2 .afty-card')].map(e=>({classes:e.className,style:e.getAttribute('style'),bg:getComputedStyle(e).backgroundColor,visivel:!!e.getClientRects().length}));
 return out;
}),null,2));await nav.close();
