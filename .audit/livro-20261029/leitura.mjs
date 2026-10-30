import fs from 'node:fs';
import path from 'node:path';
const base = path.resolve(import.meta.dirname, '../..');
const source = path.resolve(base, '../F&M 2.5.2 - Livro de Regras.md');
const args = process.argv.slice(2);
if (args[0] === 'livro') {
  let page = 0;
  const from = Number(args[1]);
  const to = Number(args[2] || args[1]);
  for (const [i, line] of fs.readFileSync(source, 'utf8').split(/\r?\n/).entries()) {
    const m = line.match(/<!-- página (\d+) -->/);
    if (m) page = Number(m[1]);
    if (page >= from && page <= to) process.stdout.write(`${i + 1} [p.${page}] ${line}\n`);
  }
} else if (args[0] === 'tabelas') {
  let page = 0;
  let heading = '';
  let inTable = false;
  for (const line of fs.readFileSync(source, 'utf8').split(/\r?\n/)) {
    const m = line.match(/<!-- página (\d+) -->/);
    if (m) page = Number(m[1]);
    if (/^#{1,3} /.test(line)) heading = line;
    if (page < Number(args[1]) || page > Number(args[2] || args[1])) continue;
    if (line.startsWith('|')) {
      if (!inTable) console.log(`p.${page} ${heading}`);
      console.log(line);
      inTable = true;
    } else inTable = false;
  }
} else if (args[0] === 'codigo') {
  const lines = fs.readFileSync(path.resolve(base, args[1]), 'utf8').split(/\r?\n/);
  const from = Number(args[2] || 1);
  const to = Number(args[3] || lines.length);
  for (let i = from - 1; i < Math.min(to, lines.length); i++) process.stdout.write(`${i + 1} ${lines[i]}\n`);
} else if (args[0] === 'indice') {
  let page = 0;
  for (const [i, line] of fs.readFileSync(source, 'utf8').split(/\r?\n/).entries()) {
    const m = line.match(/<!-- página (\d+) -->/);
    if (m) page = Number(m[1]);
    if (/^#{1,2} /.test(line) && page >= Number(args[1] || 0) && page <= Number(args[2] || 999)) process.stdout.write(`${i + 1} p.${page} ${line}\n`);
  }
}
