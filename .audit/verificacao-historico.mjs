import { cpSync, mkdtempSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
const temp = mkdtempSync(join(tmpdir(),'verificacao-lotes-'));
for (const p of ['src','asserts','addons']) cpSync(p,join(temp,p),{recursive:true});
writeFileSync(join(temp,'package.json'),readFileSync('package.json'));
const cases=[
 ['01-conteudo','src/systems/afty/ficha/ficha-conteudo.js','t-ficha-linhas'],
 ['01-item','src/systems/afty/ficha/ItemDeFicha.jsx','t-ficha-linhas'],
 ['01-css','src/systems/afty/ficha/ficha.css','t-ficha-linhas'],
 ['02-editor','src/systems/afty/AftyCreatureBuilder.jsx','t-criador-namespaces'],
 ['03-derive-montante','src/systems/afty/afty-derive.js','t-montante-bancada'],
 ['03-derive-tr','src/systems/afty/afty-derive.js','t-tr-caso-ja-seja-classe'],
 ['03-efeitos','src/systems/afty/afty-efeitos.js','t-montante-bancada'],
 ['03-flugel','addons/flugel.json','t-flugel'],
 ['04-auxiliar','src/systems/afty/afty-combate-conjurador.js','t-alcance-corpo-a-corpo'],
 ['04-conteudo','src/systems/afty/afty-efeitos-conteudo.js','t-alcance-corpo-a-corpo'],
 ['04-maldicao','addons/maldicao-era-de-ouro.json','t-alcance-corpo-a-corpo'],
 ['04-pericias','src/systems/afty/afty-pericias.js','t-alcance-corpo-a-corpo'],
 ['04-fontes','src/systems/afty/ui/fontes.jsx','t-alcance-corpo-a-corpo'],
];
const results=[];
for(const [name,file,test] of cases){
 const atual=readFileSync(join(temp,file));
 const head=spawnSync('git',['show','HEAD:'+file],{maxBuffer:20e6});
 if(head.status!==0)throw Error('HEAD not found '+file);
 writeFileSync(join(temp,file),head.stdout);
 const r=spawnSync(process.execPath,['asserts/'+test+'.mjs'],{cwd:temp,encoding:'utf8',maxBuffer:20e6});
 const log=(r.stdout??'')+(r.stderr??'');
 writeFileSync('.audit/verificacao-evidencias/historico-'+name+'.log',log);
 writeFileSync(join(temp,file),atual);
 results.push({name,file,test,status:r.status,summary:log.split('\n').filter(l=>/FALHA|ASSERTS|Error|error|Syntax/.test(l)).slice(0,7)});
 console.log(JSON.stringify(results.at(-1)));
}
writeFileSync('.audit/verificacao-evidencias/historico.json',JSON.stringify({temp,results},null,2));
