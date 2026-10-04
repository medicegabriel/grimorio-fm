import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
const out = '.audit/verificacao-evidencias';
mkdirSync(out, { recursive: true });
const run = (name, command, args) => {
 const r = spawnSync(command, args, { encoding: 'utf8', maxBuffer: 24 * 1024 * 1024, shell: false });
 const log = (r.stdout ?? '') + (r.stderr ?? '');
 writeFileSync(join(out, name + '.log'), log);
 console.log(JSON.stringify({ name, status: r.status, error: r.error?.message, tail: log.split('\n').slice(-9).join('\n') }));
 return { name, status: r.status, log };
};
if (process.argv[2] === 'checks') {
 const results = [];
 for (const [name, args] of [['suite', ['asserts/rodar.mjs']], ['filtro', ['src/systems/afty/asserts/t-filtro-habilidades.mjs']], ['imitacao', ['src/systems/afty/asserts/t-imitacao.mjs']], ['ordem', ['asserts/t-ordem-modulos.mjs']], ['eslint', ['node_modules/eslint/bin/eslint.js', 'src/systems/afty', 'src/App.jsx', 'src/components/io-utils.js']], ['build', ['node_modules/vite/bin/vite.js', 'build']]]) {
   const r = run(name, process.execPath, args); results.push({ name, status: r.status });
 }
 writeFileSync(join(out, 'checks.json'), JSON.stringify(results, null, 2));
}
if (process.argv[2] === 'inventory') {
 const git = (...args) => spawnSync('git', args, { encoding: 'utf8', maxBuffer: 24 * 1024 * 1024 }).stdout;
 writeFileSync(join(out, 'status-inicial.txt'), git('status', '--porcelain=v1', '-uall'));
 const diff = git('diff', '--ignore-cr-at-eol', '-U0');
 writeFileSync(join(out, 'diff-inicial.patch'), diff);
 let file, line = 0; const added = [];
 for (const l of diff.split('\n')) {
  if (l.startsWith('+++ b/')) file = l.slice(6);
  else if (l.startsWith('@@')) line = Number(l.match(/\+(\d+)/)?.[1] ?? 0);
  else if (l.startsWith('+') && !l.startsWith('+++')) { if (l.includes('\u2014')) added.push({ file, line, text: l.slice(1).replaceAll('\u2014', '[U+2014]') }); line++; }
  else if (l.startsWith(' ')) line++;
 }
 const files = git('diff', '--ignore-cr-at-eol', '--name-only').trim().split('\n');
 const counts = files.map(file => ({ file, head: (git('show', 'HEAD:' + file).match(/\u2014/g) ?? []).length, current: (readFileSync(file, 'utf8').match(/\u2014/g) ?? []).length }));
 const untracked = git('ls-files', '--others', '--exclude-standard').trim().split('\n').filter(f => /^(src|asserts|addons|docs)\//.test(f)).map(file => ({ file, count: (readFileSync(file, 'utf8').match(/\u2014/g) ?? []).length }));
 writeFileSync(join(out, 'travessoes.json'), JSON.stringify({ added, counts, untracked }, null, 2));
 console.log(JSON.stringify({ modified: files.length, addedWithDash: added.length, countsChanged: counts.filter(x => x.head !== x.current), untrackedWithDash: untracked.filter(x => x.count) }, null, 2));
}
