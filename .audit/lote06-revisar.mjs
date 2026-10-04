import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
const arquivos = ['src/systems/afty/afty-equipamentos.js', 'asserts/t-balanceada.mjs', 'docs/afty-equipamentos.md', 'docs/a-fazer.md', 'docs/afty-status.md'];
for (const f of arquivos) {
  const r = spawnSync('git', ['diff', '--no-index', '--', `.audit/lote06-base/${f}`, f], { encoding: 'utf8' });
  if (![0, 1].includes(r.status)) throw new Error(r.stderr || `Erro no diff: ${f}`);
  const adicionadas = r.stdout.split(/\r?\n/).filter(l => l.startsWith('+') && !l.startsWith('+++'));
  if (adicionadas.some(l => l.includes(String.fromCodePoint(0x2014)))) throw new Error(`U+2014 novo em ${f}`);
  const c = spawnSync('git', ['diff', '--no-index', '--check', '--', `.audit/lote06-base/${f}`, f], { encoding: 'utf8' });
  if (![0, 1].includes(c.status) || c.stdout.trim()) throw new Error(c.stdout + c.stderr);
}
for (const f of ['src/systems/afty/afty-efeitos-conteudo.js', 'src/systems/afty/afty-feiticos.js', 'asserts/t-suporte-revisao.mjs', 'docs/afty-player.md']) {
  if (!fs.readFileSync(f).equals(fs.readFileSync(`.audit/lote06-base/${f}`))) throw new Error(`Mudança inesperada em ${f}`);
}
console.log('Diff próprio sem U+2014 ou erro de espaço. Suporte e Feitiços preservados.');
