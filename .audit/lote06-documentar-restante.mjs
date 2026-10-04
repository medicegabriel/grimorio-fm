import fs from 'node:fs';
const fila = 'docs/a-fazer.md';
let atual = fs.readFileSync(fila, 'utf8');
for (const titulo of [
  '### Suporte Absoluto soma o atributo da Técnica, e o livro pede o da CD de especialização',
  '### ASSUNÇÃO: a Conjuração Aprimorada concede Feitiço no 1° nível também?',
]) {
  const inicio = atual.indexOf(titulo);
  const fim = atual.indexOf('### ', inicio + titulo.length);
  if (inicio < 0 || fim < 0) throw new Error(`Entrada não encontrada: ${titulo}`);
  atual = atual.slice(0, inicio) + atual.slice(fim);
}
fs.writeFileSync(fila, atual);
const guia = 'docs/afty-player.md';
atual = fs.readFileSync(guia, 'utf8');
const eol = atual.includes('\r\n') ? '\r\n' : '\n';
const ancora = '## MULTICLASSE DO JOGADOR';
if (atual.split(ancora).length !== 2) throw new Error('Seção do guia não única');
const texto = `## PROGRESSÃO DE FEITIÇOS DO JOGADOR

O orçamento próprio de Feitiços usa \`totalFeiticosJogador\` (divergência
\`progressaoDeFeiticos\`). O jogador começa com dois Feitiços. A regra padrão soma
\`piso(n / 2)\`, pelos níveis pares. Com Conjuração Aprimorada soma \`n - 1\`, um
Feitiço por subida de nível a partir do nível 2. Nos dois casos, os níveis 10 e 20
concedem um Feitiço adicional cada.

O autor confirmou \`n - 1\` em 2026-10-03. Um Conjurador começa com dois Feitiços
no nível 1 e chega a 33 no nível 30. A função devolve \`total\` e \`partes\` para
mostrar a origem do orçamento.

`;
fs.writeFileSync(guia, atual.replace(ancora, texto.replace(/\r?\n/g, eol) + ancora));
console.log('Duas perguntas resolvidas retiradas da fila. Progressão confirmada registrada no guia do jogador.');
