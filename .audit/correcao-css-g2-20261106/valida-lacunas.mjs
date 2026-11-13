import fs from 'node:fs';import {chromium} from 'playwright';
const nav=await chromium.launch({channel:'chrome'}),checks=[],erros=[];
const check=(nome,ok,dados)=>{checks.push({nome,ok:!!ok,dados});console.log(`${ok?'OK':'FALHA'} ${nome} ${JSON.stringify(dados??'')}`)};
const abre=async(query,width=1440)=>{
 const ctx=await nav.newContext({viewport:{width,height:900}}),p=await ctx.newPage();p.on('pageerror',e=>erros.push(e.message));
 await p.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
 const q=new URLSearchParams({ficha:'mesa',tema:'escuro'});for(const [k,v] of new URLSearchParams(query))q.set(k,v);
 await p.goto('http://127.0.0.1:5345/?'+q);await p.locator('.afty-ficha').waitFor();return {ctx,p};
};
for(const modo of ['','classica','encontro']) {
 const {p,ctx}=await abre('inv=1&modo='+modo,390);
 if(modo==='encontro')await p.getByRole('tab',{name:'Invocações',exact:true}).click();
 else await p.locator('[data-afty-aba="invocacoes"]').click();
 const inv=p.locator('#afty-inv-css-ave');await inv.waitFor();
 check(`${modo||'g2'} tema próprio de invocação`,await inv.locator('.afty-inv-titulo').evaluate(e=>getComputedStyle(e).color)==='rgb(139, 0, 85)');
 const dono=await p.locator('.afty-ficha').first().evaluate(e=>getComputedStyle(e).getPropertyValue('--afty-fundo').trim());
 check(`${modo||'g2'} tema não repinta o dono`,dono==='#060910',dono);
 if(modo!=='encontro') {
  await p.getByRole('button',{name:'Aparência de Ave Sintética',exact:true}).click();
  const d=p.getByRole('dialog',{name:'Aparência · Ave Sintética',exact:true});await d.waitFor();
  await d.getByRole('tab',{name:'Prompt IA',exact:true}).click();const prompt=await d.getByRole('textbox',{name:'Prompt para a IA'}).inputValue();
  check(`${modo||'g2'} prompt usa escopo da invocação`,prompt.includes('@scope (#afty-inv-css-ave)')&&!prompt.includes('├── .afty-cabecalho'));
  await p.keyboard.press('Escape');check(`${modo||'g2'} Esc fecha editor da invocação`,await d.count()===0);
 } else check('Encontro não oferece editor sem gravação',await p.getByRole('button',{name:/Aparência de/}).count()===0);
 await p.screenshot({path:new URL(`invocacao-${modo||'g2'}.png`,import.meta.url).pathname.replace(/^\/([A-Za-z]:)/,'$1')});
 await ctx.close();
}
for(const width of [1440,390]) {
 const {p,ctx}=await abre('',width);
 await p.locator('[data-afty-aba="habilidades"]').click();
 await p.locator('.e-linha .e-linha-topo').first().click();
 await p.locator('.afty-consulta').waitFor();
 await p.addStyleTag({content:'@scope (#afty-ficha) {.afty-consulta {background:#123456} .afty-historico {background:#345678}}'});
 check(`consulta/${width} recebe CSS simples`,await p.locator('.afty-consulta').evaluate(e=>getComputedStyle(e).backgroundColor)==='rgb(18, 52, 86)');
 await p.screenshot({path:new URL(`consulta-${width}.png`,import.meta.url).pathname.replace(/^\/([A-Za-z]:)/,'$1')});
 await p.keyboard.press('Escape');
 await p.getByRole('button',{name:'Mais opções da ficha'}).click();await p.getByRole('menuitem',{name:'Histórico da Sessão',exact:true}).click();
 await p.locator('.afty-historico').waitFor();
 check(`histórico/${width} recebe CSS simples`,await p.locator('.afty-historico').evaluate(e=>getComputedStyle(e).backgroundColor)==='rgb(52, 86, 120)');
 await p.screenshot({path:new URL(`historico-${width}.png`,import.meta.url).pathname.replace(/^\/([A-Za-z]:)/,'$1')});await ctx.close();
}
for(const tema of ['escuro','claro','minamoto','alter']) {
 const {p,ctx}=await abre('tema='+tema);await p.emulateMedia({media:'print'});
 const r=await p.locator('.afty-nome').evaluate(e=>({display:getComputedStyle(e).display,color:getComputedStyle(e).color,rect:e.getBoundingClientRect().toJSON()}));
 check(`impressão/${tema} ficha visível`,r.display!=='none'&&r.rect.width>0,r);
 await p.pdf({path:new URL(`impressao-${tema}.pdf`,import.meta.url).pathname.replace(/^\/([A-Za-z]:)/,'$1'),format:'A4',printBackground:true});await ctx.close();
}
check('sem erros de página nas lacunas',!erros.length,erros);
fs.writeFileSync(new URL('lacunas-resultados.json',import.meta.url),JSON.stringify({checks,erros},null,2));await nav.close();if(checks.some(x=>!x.ok))process.exitCode=1;
