import fs from 'node:fs';
import postcss from 'postcss';
import { transforma } from './executor/vite.candidato.config.mjs';
const base = new URL('../../src/systems/afty/ficha/', import.meta.url);
const manifest = [];
for(const nome of ['efeitos/efeitos-g2.css','abas-g2/abas-g2.css']) {
  const arquivo = new URL(nome,base);
  const original = fs.readFileSync(arquivo,'utf8');
  if (original.startsWith('/* Aparência contratada:')) throw new Error('Migração já aplicada, não executar novamente');
  fs.writeFileSync(new URL(nome.replaceAll('/','-')+'.antes',import.meta.url), original);
  const raiz = postcss.parse(transforma(original));
  raiz.walkDecls(d=> {
    if(d.prop==='--e-display') d.value='var(--afty-fonte-display, "Bahnschrift", "Segoe UI", system-ui, sans-serif)';
    if(d.prop==='--m-raio-secao') d.value='var(--afty-raio, 12px)';
    if(!/^border.*radius$/.test(d.prop)) return;
    const antes=d.value;
    d.value=d.value.replace(/(\d+(?:\.\d+)?)px/g,(v,n)=>Number(n)===12?'var(--afty-raio, 12px)':`calc(var(--afty-raio, 12px) * ${Number(n)/12})`);
    if(d.value!==antes) manifest.push({arquivo:nome,seletor:d.parent.selector,antes,depois:d.value});
  });
  fs.writeFileSync(arquivo,'/* Aparência contratada: especificidade de uma classe em escopo da ficha.\n   O CSS do usuário, no mesmo escopo e posterior, vence sem alterar o layout. */\n'+raiz.toString());
}
fs.writeFileSync(new URL('raios.json',import.meta.url),JSON.stringify(manifest,null,2));
console.log(`${manifest.length} declarações de cantos derivadas do token`);
