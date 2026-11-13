import fs from'node:fs';import cp from'node:child_process';import crypto from'node:crypto';
const nomes=['AftyFichaG2.jsx','AftyFichaClassica.jsx','PainelDeAparencia.jsx','usar-gravacao-tema.js','ficha-tema.js','ficha.css','efeitos/efeitos-g2.css','abas-g2/abas-g2.css','efeitos/pecas.jsx','efeitos/ConsultaG2.jsx','efeitos/HistoricoSessao.jsx'].map(n=>'src/systems/afty/ficha/'+n);
nomes.push('themes/alter-lucielos.css','docs/a-fazer.md','docs/afty-status.md','docs/afty-ficha-final.md');
const diff=cp.execFileSync('git',['diff','--no-ext-diff','--unified=0','--',...nomes],{encoding:'utf8',maxBuffer:1<<25});
const adicionadas=diff.split(/\r?\n/).filter(l=>l.startsWith('+')&&!l.startsWith('+++'));
const problemas=adicionadas.filter(l=>l.includes(String.fromCharCode(0x2014))||/^\+(<{7}|={7}|>{7})( |$)/.test(l));
const hook=fs.readFileSync(nomes[3],'utf8');if(hook.includes(String.fromCharCode(0x2014)))problemas.push('hook contém caractere proibido');
const res={arquivos:nomes,problemas,componentes:cp.execFileSync('git',['diff','--name-only','--','src/components/'],{encoding:'utf8'}).trim(),hashDistFinal:crypto.createHash('sha256').update(fs.readFileSync('dist/index.html')).digest('hex'),geradoEm:new Date().toISOString()};
fs.writeFileSync(new URL('conferencia-final.json',import.meta.url),JSON.stringify(res,null,2));console.log(JSON.stringify({problemas:res.problemas,componentes:res.componentes,arquivos:nomes.length}));
