import fs from 'node:fs';
function replaceOne(file, before, after) {
  const s = fs.readFileSync(file, 'utf8');
  const nl = s.includes('\r\n') ? '\r\n' : '\n';
  before = before.replaceAll('\n', nl); after = after.replaceAll('\n', nl);
  if (s.split(before).length !== 2) throw Error('Trecho nao unico: ' + file);
  fs.writeFileSync(file, s.replace(before, after));
}
for (const title of [
  'Horda: o PV máximo cai junto com os membros perdidos? E o que acontece a 0 PV?',
  'Hoste Amaldiçoada: o par de hordas conta como uma também no limite em campo?',
  'Mecha: "maior PV" é o máximo ou o atual? E a 0 PV?',
]) {
  const file = 'docs/a-fazer.md';
  const s = fs.readFileSync(file, 'utf8');
  const start = s.indexOf('### ' + title);
  if (start < 0) throw Error('Entrada ausente: ' + title);
  const next = s.indexOf('\n### ', start + 4);
  if (next < 0) throw Error('Proxima entrada ausente');
  fs.writeFileSync(file, s.slice(0, start) + s.slice(next + 1));
}
replaceOne('docs/afty-invocacoes.md', '| **Dados extras** |',
`| **Horda, PV e queda** (2026-10-03) | O PV máximo fica ao perder membros. Só as escalas caem, sem cascata. A 0 PV a horda acaba, e líder e membros restantes caem pela regra do próprio tipo. O exorcismo exige excedente superior ao máximo da horda |
| **Hoste Amaldiçoada** (2026-10-03) | O par conta como uma tanto no limite de Hordas quanto no de Invocações em campo. As duas precisam estar em campo, marcadas como Hoste e apontar uma para a outra |
| **Mecha, maior PV** (2026-10-03) | A maior é escolhida pelo PV máximo. O Mecha leva o PV atual dela e o atual da menor como PV temporário. Separar devolve esses dois números. A 0 PV a principal quebra e o Mecha se desfaz, com as regras de Marionete |
| **Dados extras** |`);
replaceOne('docs/afty-invocacoes.md', '1 (o par da Hoste, 1 no limite de hordas)', '1 (o par da Hoste, 1 nos dois limites)');
replaceOne('docs/afty-invocacoes.md', '### A Herança das Sombras persistente (Etapa 10, 2026-10-01)',
`A contagem do par da Hoste sai do \`deriveAfty\`, antes dos efeitos que leem
\`invocacoes_em_campo\`. A aba da mesa lê os mesmos totais em \`invocacoes.emCampo\`
e \`hordas.emCampo\`. Um par ocupa uma vaga também para Controle Sintonizado e
Concentrar Poder. Só uma horda do par em campo continua ocupando uma vaga.
Vínculo incompleto ou sem volta conta cada horda separadamente.

### A Herança das Sombras persistente (Etapa 10, 2026-10-01)`);
const statusFile = 'docs/afty-status.md';
const status = fs.readFileSync(statusFile, 'utf8');
const nl = status.includes('\r\n') ? '\r\n' : '\n';
if (status.includes('## SESSÃO DE 2026-10-03: LOTE 07,')) throw Error('Sessao ja registrada');
const session = `

## SESSÃO DE 2026-10-03: LOTE 07, INVOCAÇÕES EM MESA, HORDA, HOSTE E MECHA

**Decisões do autor:** A, B e A, numa rodada só. Horda mantém o PV máximo quando perde membros e a queda a 0 PV como estava. Hoste Amaldiçoada conta uma nos dois limites, de Hordas e de Invocações em campo. No Mecha, a maior é escolhida pelo PV máximo, levando o PV atual dela e o atual da menor como casca. A principal quebra a 0 PV e o Mecha se desfaz. Aplicadas aos dois sistemas, conforme o escopo compartilhado do lote.

**O que mudou:** em \`deriveAfty\` (\`afty-derive.js\`), \`idsDaMesa\` agrupa o par da Hoste quando ambas estão em campo, marcadas e com vínculo recíproco. Quando uma sai, a outra ocupa sua própria vaga. A mesma contagem chega ao Motor (Controle Sintonizado e Concentrar Poder) e à aba por \`invocacoes.emCampo\` e \`hordas.emCampo\`. \`AbaInvocacoes.jsx\` usa esses totais e atualiza o texto do chip Hoste. \`resolveHorda\` só teve o comentário da dúvida trocado pela confirmação. \`aplicaDanoHorda\`, \`mechaPermitido\`, \`formaMecha\` e \`aplicaDanoMecha\` mantêm os números e as transições confirmados. As três entradas saíram de \`a-fazer.md\`, e o guia \`afty-invocacoes.md\` registra as decisões e a contagem compartilhada.

**Asserts:** linha de base com 147 arquivos e 8004 asserts, todos verdes. O vermelho antigo da Livre já foi resolvido pelo Lote 05 antes desta execução. \`t-invocacoes-mesa.mjs\` passou de 86 para 120, com 34 casos novos nos dois sistemas: par, cada horda isolada, saída de uma, nenhuma em campo, invocação adicional, dois pares, hordas comuns, vínculo incompleto, marca ausente, sessão antiga, linha órfã, ordem da lista, Controle Sintonizado com fonte nomeada e Concentrar Poder ligando e desligando. Antes da implementação, os casos do Motor reproduziram Sintonizado +2 em vez de +1 e Concentrar Poder desligado em vez de +10. Suíte final com 147 arquivos e 8038 asserts, todos passaram, incluindo os tipos especiais e os compostos. \`t-ordem-modulos.mjs\` passa com 34. ESLint da área Afty limpo e build passando. Nenhum import do app mudou.

**Verificado ao vivo:** servidor próprio na porta 5197, Chrome em contextos temporários sem ocultar barras de rolagem, /afty e /player a 1440 e 390 px. Entrar a primeira Hoste mostra Em Campo 1 / 3 e Hordas 1 / 1. Entrar a segunda conserva ambos os totais. A Horda com 82 PV perde um de dois membros em 41 PV, mantém máximo 82 e não perde outro no dano seguinte. A 0 PV acaba, e o par restante continua contando uma vaga. Retirar a última zera os dois totais. Mecha com Alfa (máximo 39, atual 3) e Beta (atual 7): Alfa segue principal, Mecha nasce com 3 PV e casca 7. Dano 10 quebra ambas e desfaz o Mecha. Sem erro de página ou console, nem rolagem horizontal. Capturas, roteiro e relatório em \`.audit/lote07-*\`.

**Achado e não mexido:** nenhuma pendência deste lote. O build continua informando o tamanho do pacote principal. Mudanças preexistentes e o trabalho paralelo em \`src/App.jsx\` foram preservados. Nenhum U+2014 foi introduzido nas linhas deste lote. Sem commit ou push.
`;
fs.appendFileSync(statusFile, session.replaceAll('\n', nl));
console.log('Fila e guia atualizados, sessao acrescentada ao fim do historico.');
