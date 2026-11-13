import fs from 'node:fs';import postcss from 'postcss';import{chromium}from'playwright';
const nav=await chromium.launch({channel:'chrome'}),p=await nav.newPage(),out=[];
for(const nome of ['efeitos/efeitos-g2.css','abas-g2/abas-g2.css']) {
 const r=postcss.parse(fs.readFileSync(new URL('../../src/systems/afty/ficha/'+nome,import.meta.url),'utf8')),sels=[];
 r.walkRules(rule=>{if(rule.parent.type==='atrule'&&/keyframes/.test(rule.parent.name))return;sels.push(...rule.selectors)});
 const erros=await p.evaluate(s=>s.filter(x=>!CSS.supports('selector('+x+')')),sels);
 out.push({arquivo:nome,seletores:sels.length,erros});console.log(out.at(-1));
}
fs.writeFileSync(new URL('seletores-validos.json',import.meta.url),JSON.stringify(out,null,2));await nav.close();if(out.some(x=>x.erros.length))process.exitCode=1;
