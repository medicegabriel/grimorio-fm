import fs from'node:fs';import{chromium}from'playwright';
const n=await chromium.launch({channel:'chrome'}),out=[];
const t=(nome,ok)=>{out.push({nome,ok:!!ok});console.log(ok?'OK':'FALHA',nome)};
for(const q of ['tema=quebrado','tema=quebrado&semcss=1']){
 const c=await n.newContext(),p=await c.newPage();await p.goto('http://127.0.0.1:5345/?ficha=mesa&'+q);await p.locator('#afty-ficha').waitFor();
 if(q.includes('semcss'))t('semcss recupera a ficha',await p.locator('.afty-cabecalho').first().isVisible());
 else{t('CSS quebrado esconde o cabeçalho',!await p.locator('.afty-cabecalho').first().isVisible());await p.getByRole('button',{name:'Desligar o CSS personalizado',exact:true}).click();t('escape externo recupera a ficha',await p.locator('.afty-cabecalho').first().isVisible())}
 await c.close();
}
const c=await n.newContext(),p=await c.newPage();await p.goto('http://127.0.0.1:5345/?ficha=mesa&tema=escuro');await p.locator('.e-aba').first().waitFor();
t('indicador da aba preservado',await p.locator('.e-aba[aria-selected="true"]').evaluate(e=>getComputedStyle(e,'::after').backgroundColor)==='rgb(168, 85, 247)');
await p.locator('.m-rolar button').first().focus();t('foco do controle de rolagem preservado',await p.locator('.m-rolar').first().evaluate(e=>getComputedStyle(e).outlineStyle)==='solid');
const cor=await p.locator('.m-valor-botao').first().evaluate(e=>{e.closest('.e-stat').dataset.efeito='sim';return getComputedStyle(e).color});
t('sonda CSS conserva cor da estatística alterada',cor==='rgb(216, 180, 254)');
await c.close();await n.close();fs.writeFileSync(new URL('escape-estados.json',import.meta.url),JSON.stringify(out,null,2));if(out.some(x=>!x.ok))process.exitCode=1;
