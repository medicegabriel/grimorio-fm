import fs from 'node:fs';
import crypto from 'node:crypto';
const here=new URL('.',import.meta.url);
const repo=new URL('../../',import.meta.url);
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const before=JSON.parse(fs.readFileSync(new URL('hashes-antes.json',here),'utf8').replace(/^\uFEFF/,''));
const after=before.map(e=>({...e,sha256:hash(fs.readFileSync(new URL(e.path,repo)))}));
fs.writeFileSync(new URL('hashes-depois.json',here),JSON.stringify(after,null,2));
const changed=after.filter((e,i)=>e.sha256!==before[i].sha256).map(e=>e.path);
const claude=JSON.parse(fs.readFileSync(new URL('../previa-abas-g2-20261021/hashes/ajustes-depois.json',here),'utf8'));
const divergence=Object.entries(claude.out).filter(([p,h])=>hash(fs.readFileSync(new URL(p,repo)))!==h).map(([p])=>p);
const served=[];
for(const e of after.filter(e=>e.path.startsWith('.audit/previa-abas-g2-20261021/dist/'))){
  const relative=e.path.split('/dist/')[1];
  const response=await fetch(`http://127.0.0.1:5330/${relative}`);
  served.push({path:relative,status:response.status,same:hash(Buffer.from(await response.arrayBuffer()))===e.sha256});
}
const result={em:new Date().toISOString(),arquivosFonte:after.filter(e=>e.path.startsWith('src/')).length,distDiario:after.filter(e=>e.path.startsWith('dist/')).length,alterados:changed,divergenciasEntregaClaude:divergence,servido:served};
fs.writeFileSync(new URL('preservacao.json',here),JSON.stringify(result,null,2));
console.log(JSON.stringify(result,null,2));
if(changed.length||divergence.length||served.some(e=>!e.same||e.status!==200))process.exitCode=1;
