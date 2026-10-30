import fs from 'node:fs';
import { register } from 'node:module';
register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}', import.meta.url);
const {deriveAfty}=await import('../src/systems/afty/afty-derive.js');
const H=await import('../src/systems/afty/afty-habilidades.js');
const E=await import('../src/systems/afty/afty-efeitos.js');
const C=await import('../src/systems/afty/afty-combate.js');
const c=JSON.parse(fs.readFileSync('C:/Users/gabri/.codex/attachments/c2c829c0-1dac-444e-9669-ee7e171779dd/Texto colado.txt','utf8')).creatures[0];
const A=await import('../src/systems/afty/afty-addons.js'); A.aplicarAddons(c.addons??[]); const d=deriveAfty(c);
fs.writeFileSync('.audit/fang-derivado.json',JSON.stringify(d,(k,v)=>v instanceof Set?[...v]:v,2));
const resumo={nome:c.name,habilidades:d.habilidades,especializacoes:d.especializacoes,ctx:Object.fromEntries(Object.entries(d.contextoDsl??{}).filter(([k])=>/^(esc_|nivel_|surto|adrenalina|corpo_de|cacador|mod_const|constituicao)/.test(k))),combate:d.combate,stats:{hp:d.hp,pe:d.pe,defesa:d.defesa,cd:d.cd},partes:d.partes};
fs.writeFileSync('.audit/fang-resumo.json',JSON.stringify(resumo,null,2));
const ids=[...new Set([...(d.habilidades.efetivas??[])])];
const registros=ids.map(id=>({id,catalogo:H.getHabilidade(id),efeitos:E.HABILIDADE_EFEITOS[id]}));
fs.writeFileSync('.audit/fang-catalogo.json',JSON.stringify(registros,null,2));
console.log(JSON.stringify({nome:c.name,ids:ids.length,ctx:resumo.ctx,stats:resumo.stats,addonProblemas:d.addonProblemas,partesHp:d.partes.hp}));

