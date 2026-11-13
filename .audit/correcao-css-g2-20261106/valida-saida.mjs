import {chromium} from 'playwright';
import fs from 'node:fs';
const dados=JSON.parse(fs.readFileSync(new URL('../previa-abas-g2-20261021/fichas/fichas.json',import.meta.url)));
const nav=await chromium.launch({channel:'chrome'}),out=[];
const check=(nome,ok,dados)=>{out.push({nome,ok:!!ok,dados});console.log(`${ok?'OK':'FALHA'} ${nome} ${JSON.stringify(dados??'')}`)};
for(const g2 of [true,false]) for(const saida of ['voltar','pagehide','recarregar']) {
 const ctx=await nav.newContext({viewport:{width:1440,height:900}});const p=await ctx.newPage();
 await p.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
 await p.goto('http://127.0.0.1:5346/player');
 await p.evaluate(c=>localStorage.setItem('fm_creatures_player_v1',JSON.stringify([{...c,isBuiltIn:false,stats:{hp:1,pe:1,defense:10}}])),dados.fichas.mesa);
 const url=`http://127.0.0.1:5346/player${g2?'?ficha-g2=1':''}`;
 await p.goto(url);await p.getByText('Mesa Cheia (Teste Abas)',{exact:true}).first().click();await p.locator('.afty-nome').waitFor();
 if(g2){await p.getByRole('button',{name:'Mais opções da ficha'}).click();await p.getByRole('menuitem',{name:'Aparência',exact:true}).click()}
 else await p.getByRole('button',{name:/Aparência/}).first().click();
 const css=`.afty-nome{color:#ff00aa}/*${g2}-${saida}*/`;
 await p.getByRole('textbox',{name:'CSS personalizado',exact:true}).fill(css);
 const inicio=Date.now();
 if(saida==='voltar'){
  await p.getByRole('dialog',{name:'Aparência',exact:true}).getByRole('button',{name:'Fechar',exact:true}).click();
  await p.getByRole('button',{name:'Voltar',exact:true}).first().click();
 }else if(saida==='pagehide') await p.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pagehide')));
 else await p.reload();
 const ms=Date.now()-inicio;await p.waitForTimeout(150);
 const ap=await p.evaluate(()=>JSON.parse(localStorage.getItem('fm_creatures_player_v1'))[0]?.aparencia);
 check(`${g2?'G2':'clássica'} ${saida} preserva edição antes de 600ms`,ap?.css===css,{ms,css:ap?.css});
 await p.goto(url);await p.getByText('Mesa Cheia (Teste Abas)',{exact:true}).first().click();
 await p.locator('.afty-nome').waitFor();await p.waitForTimeout(200);
 check(`${g2?'G2':'clássica'} ${saida} reabre com tema`,await p.locator('.afty-nome').evaluate(e=>getComputedStyle(e).color)==='rgb(255, 0, 170)');
 await ctx.close();
}
fs.writeFileSync(new URL('saida-resultados.json',import.meta.url),JSON.stringify(out,null,2));await nav.close();if(out.some(x=>!x.ok))process.exitCode=1;
