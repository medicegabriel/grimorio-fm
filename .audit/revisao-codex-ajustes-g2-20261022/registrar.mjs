import fs from 'node:fs';
import crypto from 'node:crypto';
const repo=new URL('../../',import.meta.url), workspace=new URL('../',repo);
const evidence='grimorio-tracker/.audit/revisao-codex-ajustes-g2-20261022/';
const parecer='C:/Projetos/Grimorio/REVISAO-AJUSTES-PREVIA-TRES-ABAS-20261022.md';
const trace=[];
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
function edit(url,fn){const before=fs.readFileSync(url,'utf8'),nl=before.includes('\r\n')?'\r\n':'\n'; const add=s=>s.replace(/\n/g,nl); const after=fn(before,add);if(after===before)throw Error(`Sem alteração: ${url}`);fs.writeFileSync(url,after);trace.push({path:url.pathname,antes:hash(before),depois:hash(after)});}
const resumo=`Reconferência independente concluída pelo Codex em 22/10. Outros em Perícias,
destinos únicos da busca, filtros, rolagens, foco e callbacks atuais confirmados.
Linhas de armas com colunas comuns confirmadas, inclusive Raio Negro em amostra
sintética separada. Nenhuma correção adicional de produto necessária.

Provas próprias: 52 asserts específicos, lint e build isolado aprovados,
181/181 ajustes, 94/94 leiaute focado, 39/39 complemento e 21/21 temas e
compatibilidade. Suíte 225/227, somente as duas falhas históricas.
S1 segue 788/800 e 956/1024 na coluna efetiva de 331 px. Fontes e dist
diário preservados por hash. Prévia na 5330, 5173 não tocada.

Parecer: ${parecer}.
Evidências: ${evidence}.
Restante já aprovado preservado. Próxima etapa: integração nas rotas normais,
ainda dependente de autorização própria. Barra antiga 9/10 intacta.
Sem commit, push, merge ou deploy.
`;
edit(new URL('docs/a-fazer.md',repo),(s,a)=>{const start=s.indexOf('## Ficha Final: dois ajustes do aceite');const end=s.indexOf('## Ficha Final: integração e desempenho',start);if(start<0||end<0)throw Error('Fila não localizada');return s.slice(0,start)+a(`## Ficha Final: autorização para integrar as três abas do G2

Prévia isolada e os dois ajustes do aceite reconferidos pelo Codex em 22/10.
Não repetir a construção ou reconferência encerrada. Restante já aprovado.
Próxima etapa: autorização própria do autor para integrar Ações, Perícias e
Equipamentos nas rotas normais, seguida de verificação no destino real.
A autorização ainda não foi concedida. Não ligar a prop no App por conta própria.
Parecer e limites: ${parecer}.
Prévia: http://127.0.0.1:5330/. Barra antiga 9/10 preservada.

`)+s.slice(end);});
edit(new URL('docs/afty-status.md',repo),(s,a)=>{const at=s.indexOf('## SESSÃO');return s.slice(0,at)+a(`## SESSÃO DE 2026-10-22: RECONFERÊNCIA DOS DOIS AJUSTES ENCERRADA

${resumo}
`)+s.slice(at);});
edit(new URL('docs/afty-ficha-final.md',repo),(s,a)=>{const at=s.indexOf('## ');return s.slice(0,at)+a(`## Reconferência encerrada em 22/10, integração aguarda autorização

${resumo}
Os registros abaixo descrevem as etapas anteriores. A reconferência não está
mais pendente e foi retirada da fila em docs/a-fazer.md. Permanecem a folga de
12 px de S1, Dano abaixo da dobra em S2, livro no telefone, DOM das abas retidas
e limites do armazenamento da casca isolada.

`)+s.slice(at);});
for(const filename of ['CONTINUIDADE-FICHA-FINAL.md','RETOMADA-CLAUDE-FICHA-FINAL.md'])edit(new URL(filename,workspace),(s,a)=>{const at=s.indexOf('## ');return s.slice(0,at)+a(`## Estado vigente em 22/10: reconferência concluída pelo Codex

${resumo}
As seções seguintes são histórico. Não aguardar nova entrega do Claude nem
reexecutar o lote encerrado. Não integrar sem a autorização própria do autor.

`)+s.slice(at);});
edit(new URL('PROGRESSO-FICHA-FINAL.md',workspace),(s,a)=>{
 s=s.replace('Atualizado em 21/10/2026.','Atualizado em 22/10/2026.');
 const old='continua dependendo de aceite visual e autorização própria posterior.';
 s=s.replace(old,'continua dependendo de autorização própria posterior. O restante já tem aceite.');
 const start=s.indexOf('| Construção e aceite da prévia isolada |');const end=s.indexOf('\n',start);
 if(start<0||end<0)throw Error('Progresso não localizado');
 return s.slice(0,start)+a(`| Construção e aceite da prévia isolada | Encerrada a reconferência dos dois ajustes pelo Codex em 22/10. Restante já aceito. Outros em Perícias, armas uniformes, Raio Negro e callbacks conferidos. Produto preservado. 52 asserts, 181 ajustes, 94 leiaute focado, 39 complemento e 21 temas/compatibilidade aprovados. Suíte 225/227, mesmas duas falhas históricas. Parecer em REVISAO-AJUSTES-PREVIA-TRES-ABAS-20261022.md. |`)+(s[end-1]==='\r'?'\r':'')+s.slice(end);
});
edit(new URL('REVISAO-PREVIA-TRES-ABAS-20261021.md',workspace),(s,a)=>{
const start=s.indexOf('Adendo posterior ao parecer:');const end=s.indexOf('**Parecer:',start);if(start<0||end<0)throw Error('Adendo não localizado');
return s.slice(0,start)+a(`Atualização em 22/10/2026: o autor aprovou o restante, o Claude entregou os
dois ajustes e o Codex concluiu a reconferência independente, sem necessidade
de correção adicional de produto. Parecer atual em
${parecer}.
A integração continua dependendo de autorização própria. O parecer abaixo
descreve a revisão anterior aos ajustes e conserva sua evidência histórica.

`)+s.slice(end);
});
edit(new URL('.audit/previa-abas-g2-20261021/RELATORIO.md',repo),(s,a)=>s+a(`
## 9. Reconferência independente do Codex concluída em 22/10

${resumo}
O par em 1440, compacta fechada e seção de 615 px, mediu 60,84375 e
61,84375 px, diferença de uma borda. Acerto e Dano alinhados nas duas armas.
Os 331 arquivos de src, 14 do dist diário e 11 do build da prévia continuaram
iguais por hash. A resposta HTTP da 5330 corresponde ao build conferido.

O complemento de Raio Negro usa só uma cópia do Arsenal sintético, com id
próprio, Controle e Leitura 3 e a Aptidão existente. Fonte de produto e fichas
da prévia original inalteradas. Passou em 331, 366, 587, 839 e 1724 px.
O servidor auxiliar 5331 foi encerrado. Sem novo ensaio de desempenho.

O roteiro complementar teve dois ajustes de preparação, preservados em
complemento-inicial.*: classes Tailwind da nova raiz e entrada de foco pelo
teclado. A repetição passou em 39/39. Nenhuma falha de produto confirmada.
Os resultados anteriores deste relatório continuam atribuídos ao Claude.
As limitações da seção 6 permanecem válidas. Reconferência fora da fila,
integração nas rotas normais ainda sem autorização própria.
`));
fs.writeFileSync(new URL('registros-alterados.json',import.meta.url),JSON.stringify(trace,null,2));
console.log(`Atualizados ${trace.length} registros, sem mudança na barra 9/10`);
