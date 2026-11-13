import{chromium}from'playwright';import fs from'node:fs';
const n=await chromium.launch({channel:'chrome'}),c=await n.newContext({viewport:{width:390,height:844}}),p=await c.newPage(),erros=[];
p.on('pageerror',e=>erros.push(e.message));await p.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
await p.goto('http://127.0.0.1:5330/?ficha=mesa&tema=escuro');await p.locator('[data-afty-estrutura="g2"]').waitFor();
await p.getByRole('button',{name:'Mais opções da ficha'}).click();await p.getByRole('menuitem',{name:'Aparência',exact:true}).click();
await p.getByRole('dialog',{name:'Aparência',exact:true}).waitFor();await p.getByRole('tab',{name:'Seletores',exact:true}).click();await p.locator('.afty-aparencia code').first().scrollIntoViewIfNeeded();
await p.screenshot({path:new URL('seletores-padrao-5330.png',import.meta.url).pathname.replace(/^\/([A-Za-z]:)/,'$1')});
await p.keyboard.press('Escape');const out={g2:true,editorFechaComEsc:await p.getByRole('dialog',{name:'Aparência',exact:true}).count()===0,erros};
fs.writeFileSync(new URL('previa-5330.json',import.meta.url),JSON.stringify(out,null,2));console.log(out);await c.close();await n.close();
