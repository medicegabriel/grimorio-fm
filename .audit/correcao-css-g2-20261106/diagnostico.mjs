import {chromium} from 'playwright';
const nav=await chromium.launch({channel:'chrome'});
const p=await nav.newPage({viewport:{width:Number(process.argv[3]??390),height:844},hasTouch:true,isMobile:true});
await p.goto('http://127.0.0.1:5345/?ficha=mesa&tema='+ (process.argv[2]??'escuro'));
await p.locator('.afty-nome').waitFor();
console.log(await p.evaluate(()=>{
 const e=document.querySelector('.m-valor.afty-stat-valor'); const r=[];
 const walk=(rules,ctx='')=>{for(const x of rules){if(x.cssRules)walk(x.cssRules,ctx+x.cssText.slice(0,x.cssText.indexOf('{')));if(x.selectorText&&e.matches(x.selectorText)&&(x.style.font||x.style.fontSize))r.push({ctx,sel:x.selectorText,font:x.style.font,fontSize:x.style.fontSize});}};
 [...document.styleSheets].forEach(s=>walk(s.cssRules));
 const w=document.documentElement.clientWidth;
 return {font:getComputedStyle(e).font,r,overflow:document.documentElement.scrollWidth-w,largos:[...document.querySelectorAll('#afty-ficha *')].filter(e=>e.getBoundingClientRect().right>w+2).slice(0,8).map(e=>[e.className,e.getBoundingClientRect().width,e.getBoundingClientRect().right])};
}));
await nav.close();
