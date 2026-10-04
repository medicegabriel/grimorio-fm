import { readFileSync,writeFileSync } from 'node:fs';import {spawnSync} from 'node:child_process';
let s=readFileSync('.audit/lote11-browser.mjs','utf8').replaceAll('.audit/lote11','.audit/verificacao-lote11').replaceAll('http://127.0.0.1:5201','http://127.0.0.1:5273');
writeFileSync('.audit/verificacao-lote11-browser.mjs',s);
const r=spawnSync(process.execPath,['.audit/verificacao-lote11-browser.mjs'],{encoding:'utf8',maxBuffer:20e6});
writeFileSync('.audit/verificacao-evidencias/lote11-browser.log',(r.stdout??'')+(r.stderr??''));console.log(r.status,r.stdout,r.stderr);
