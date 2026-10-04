import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
const files = [
  'src/systems/afty/afty-derive.js', 'src/systems/afty/afty-invocacoes.js',
  'src/systems/afty/ficha/ficha-sessao.js', 'src/systems/afty/ficha/abas/AbaInvocacoes.jsx',
  'asserts/t-invocacoes-mesa.mjs', 'asserts/t-invocacao-tipos-especiais.mjs',
  'docs/a-fazer.md', 'docs/afty-status.md', 'docs/afty-invocacoes.md',
];
let diff = '';
const resumo = [];
for (const file of files) {
  const base = '.audit/lote07-base/' + file.split('/').at(-1);
  const r = spawnSync('git', ['diff', '--no-index', '--', base, file], { encoding: 'utf8' });
  if (![0, 1].includes(r.status)) throw Error(r.stderr);
  const added = r.stdout.split('\n').filter(l => l.startsWith('+') && !l.startsWith('+++'));
  if (added.some(l => l.includes(String.fromCharCode(0x2014)))) throw Error('U+2014 em linha adicionada: ' + file);
  if (r.status === 1) resumo.push({ file, linhasAdicionadas: added.length });
  diff += r.stdout;
}
const fila = fs.readFileSync('docs/a-fazer.md', 'utf8');
for (const title of ['### Horda: o PV máximo', '### Hoste Amaldiçoada: o par', '### Mecha: "maior PV"']) {
  if (fila.includes(title)) throw Error('Entrada resolvida ainda na fila: ' + title);
}
if (!fila.includes('### Quimera do Mecânicas: Invocações Resistentes')) throw Error('Entrada vizinha alterada');
fs.writeFileSync('.audit/lote07-diff-final.txt', diff);
console.log(JSON.stringify({ arquivosAlteradosNesteLote: resumo, travessaoNovo: false, tresEntradasRetiradas: true }, null, 2));
