import fs from 'node:fs';import crypto from 'node:crypto';import {spawnSync} from 'node:child_process';
const dir='.audit/revisao-codex-g2-i1-20261019';
const manifest=fs.readFileSync('.audit/correcao-g2-i1-20261019/hashes-finais.txt','utf8').trim().split(/\r?\n/).map(l=>{const [expected,path]=l.split(/\s+/);const actual=crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex').slice(0,16);return {path,expected,actual,ok:expected===actual};});
fs.writeFileSync(dir+'/proveniencia.json',JSON.stringify({geradoEm:new Date().toISOString(),head:spawnSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).stdout.trim(),manifest},null,2));
console.log('Manifesto:',manifest.filter(x=>x.ok).length,'/',manifest.length);
const files=['t-g2-fonte-compat','t-g2-desempenho','t-g2-preferencias','t-g2-sessao-operacoes','t-g2-virada-registro','t-ordem-modulos','t-revisao-g00'];
const tests=files.map(name=>{const t0=Date.now(),r=spawnSync(process.execPath,['asserts/'+name+'.mjs'],{encoding:'utf8',timeout:120000});const o={name,exit:r.status,ms:Date.now()-t0,output:r.stdout+r.stderr};console.log(name+': '+r.status+' '+o.output.slice(-350).trim());return o});
fs.writeFileSync(dir+'/asserts-focados.json',JSON.stringify(tests,null,2));process.exitCode=tests.some(t=>t.exit!==0)||manifest.some(x=>!x.ok)?1:0;
