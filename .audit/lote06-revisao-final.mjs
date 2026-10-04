import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
const arquivos = ['src/systems/afty/afty-equipamentos.js', 'src/systems/afty/afty-efeitos-conteudo.js', 'src/systems/afty/afty-feiticos.js', 'asserts/t-balanceada.mjs', 'asserts/t-suporte-revisao.mjs', 'docs/afty-equipamentos.md', 'docs/afty-player.md', 'docs/a-fazer.md', 'docs/afty-status.md'];
for (const f of arquivos) {
  const r = spawnSync('git', ['diff', '--no-index', '--', `.audit/lote06-base/${f}`, f], { encoding: 'utf8' });
  if (![0, 1].includes(r.status)) throw new Error(r.stderr || `Erro no diff: ${f}`);
  const adicionadas = r.stdout.split(/\r?\n/).filter(l => l.startsWith('+') && !l.startsWith('+++'));
  if (adicionadas.some(l => l.includes(String.fromCodePoint(0x2014)))) throw new Error(`U+2014 novo em ${f}`);
  const c = spawnSync('git', ['diff', '--no-index', '--check', '--', `.audit/lote06-base/${f}`, f], { encoding: 'utf8' });
  if (![0, 1].includes(c.status) || c.stdout.trim()) throw new Error(c.stdout + c.stderr);
}
const f = 'src/systems/afty/afty-feiticos.js';
const corpo = texto => texto.slice(texto.indexOf('export function totalFeiticosJogador'));
if (corpo(fs.readFileSync(f, 'utf8')) !== corpo(fs.readFileSync(`.audit/lote06-base/${f}`, 'utf8'))) throw new Error('Progressão teve mudança de comportamento');
const fila = fs.readFileSync('docs/a-fazer.md', 'utf8');
for (const titulo of ['### Canalizadora e Otimizada acumulam entre armas?', '### Suporte Absoluto soma o atributo da Técnica', '### ASSUNÇÃO: a Conjuração Aprimorada concede Feitiço']) {
  if (fila.includes(titulo)) throw new Error(`Pendência concluída permanece: ${titulo}`);
}
if (!fila.includes('### A CD de Especialização e a CD Amaldiçoada são duas no livro')) throw new Error('Pendência adiada removida');
console.log('Diff revisto, sem U+2014 ou erros de espaço. Progressão mantida. Três entradas resolvidas removidas e segunda CD preservada.');
