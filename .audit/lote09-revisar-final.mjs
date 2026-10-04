import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
const pares={
'afty-derive.js':'src/systems/afty/afty-derive.js',
'afty-invocacoes.js':'src/systems/afty/afty-invocacoes.js',
'ficha-sessao.js':'src/systems/afty/ficha/ficha-sessao.js',
'AbaInvocacoes.jsx':'src/systems/afty/ficha/abas/AbaInvocacoes.jsx',
'AbaAcoes.jsx':'src/systems/afty/ficha/abas/AbaAcoes.jsx',
'AftyFicha.jsx':'src/systems/afty/ficha/AftyFicha.jsx',
'PainelDeCombatente.jsx':'src/systems/afty/encontros/PainelDeCombatente.jsx',
'AftyEncontro.jsx':'src/systems/afty/encontros/AftyEncontro.jsx',
'usar-encontro-afty.js':'src/systems/afty/encontros/usar-encontro-afty.js',
't-invocacao-estados.mjs':'asserts/t-invocacao-estados.mjs',
't-invocacao-tipos-especiais.mjs':'asserts/t-invocacao-tipos-especiais.mjs',
'afty-invocacoes.md':'docs/afty-invocacoes.md',
'afty-ficha-final.md':'docs/afty-ficha-final.md'};
let diff='';let proibidas=[];const resumo=[];
for(const [nome,p] of Object.entries(pares)){
 const r=spawnSync('git',['diff','--no-index','--','.audit/lote09-base/'+nome,p],{encoding:'utf8'});
 if(r.status!==0&&r.status!==1)throw Error(r.stderr);
 const mais=r.stdout.split('\n').filter(l=>l.startsWith('+')&&!l.startsWith('+++'));
 proibidas.push(...mais.filter(l=>l.includes(String.fromCharCode(0x2014))));
 resumo.push({arquivo:p,adicoes:mais.length});diff+=r.stdout;
}
for(const p of ['src/systems/afty/ficha/BotaoDeDescanso.jsx','asserts/t-fundamento-bloqueio.mjs','asserts/t-descanso-marionetes.mjs','.audit/lote09-sessao-concluida.md']){
 if(fs.readFileSync(p,'utf8').includes(String.fromCharCode(0x2014)))proibidas.push(p);
}
fs.writeFileSync('.audit/lote09-diff-final.txt',diff);
if(proibidas.length)throw Error(JSON.stringify(proibidas));
const fila=fs.readFileSync('docs/a-fazer.md','utf8');
for(const titulo of ['Fundamento fora de campo: bloqueia só os Feitiços, ou a Técnica Inata inteira?','Técnica Inata perdida: a Passiva continua ocupando PE Máximo?','O descanso repara todas as Marionetes, ou uma só?'])if(fila.includes('### '+titulo))throw Error('Ainda na fila: '+titulo);
console.log(JSON.stringify(resumo,null,2));console.log('Sem U+2014 nas adições. Três entradas resolvidas fora da fila.');
