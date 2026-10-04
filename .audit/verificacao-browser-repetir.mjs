import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawn } from 'node:child_process';
const files=['lote02-formulas','lote02-layout-telefone','lote03-browser','lote04-browser','lote05-browser','lote06-browser','lote07-browser','lote08-browser','lote08-encontro','lote09-browser','lote09-descanso-browser','lote10-browser','lote11-browser'];
const run=async name=>{
 let src=readFileSync('.audit/'+name+'.mjs','utf8');
 src=src.replaceAll('.audit/lote','.audit/verificacao-lote').replaceAll('./lote02','./verificacao-lote02');
 src=src.replace(/http:\/\/(?:localhost|127\.0\.0\.1):\d+/g,'http://127.0.0.1:5273');
 src=src.replace('http://localhost:'+ '$' + '{PORTA}','http://127.0.0.1:'+ '$' + '{PORTA}');
 if(!src.includes('ignoreDefaultArgs')) throw Error('Scrollbars check missing '+name);
 if(/writeFile.*(?:src\/|docs\/|addons\/)/.test(src)) throw Error('Unsafe writing '+name);
 src=src.replace(/const (c|f) = createBlankAfty\(\);/g, "const { aplicarAddons: verificarAplicarAddons } = await import('/src/systems/afty/afty-addons.js'); verificarAplicarAddons([]); const $1 = createBlankAfty();");
 // Don't clear packages in scripts that installed them before creating the fixture.
 if(['lote03-browser','lote04-browser','lote06-browser','lote10-browser'].includes(name)) src=src.replaceAll("verificarAplicarAddons([]); ", "");
 const n='.audit/verificacao-'+name+'.mjs'; writeFileSync(n,src);
 mkdirSync('.audit/verificacao-'+name.slice(0,6)+'-shots',{recursive:true});
 return new Promise(resolve=>{
 const p=spawn(process.execPath,[n,'atual'],{env:{...process.env,PORTA:'5273',LOTE02_URL:'http://127.0.0.1:5273'}});
 let log='';p.stdout.on('data',b=>log+=b);p.stderr.on('data',b=>log+=b);
 const timer=setTimeout(()=>p.kill(),240000);
 p.on('exit',code=>{clearTimeout(timer);writeFileSync('.audit/verificacao-evidencias/'+name+'.log',log); console.log(JSON.stringify({name,code,tail:log.slice(-1200)}));resolve({name,code});});
 });
};
const results=[];
for(let i=0;i<files.length;i+=2)results.push(...await Promise.all(files.slice(i,i+2).map(run)));
writeFileSync('.audit/verificacao-evidencias/browser-repeticao.json',JSON.stringify(results,null,2));

