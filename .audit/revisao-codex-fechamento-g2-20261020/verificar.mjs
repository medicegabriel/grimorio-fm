import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const dir = path.join(root, '.audit/revisao-codex-fechamento-g2-20261020');
const source = path.join(root, '.audit/fechamento-funcional-g2-20261020');
const hash = f => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const readManifest = name => Object.fromEntries(fs.readFileSync(path.join(source, name), 'utf8').split(/\r?\n/).filter(Boolean).map(line => {
  const m = line.match(/^([a-f0-9]{64})\s+\*?(.+)$/i);
  if (!m) throw new Error(`Formato inesperado: ${line}`);
  return [m[2].replaceAll('\\', '/'), m[1].toLowerCase()];
}));
fs.mkdirSync(dir, { recursive: true });
if (process.argv[2] === 'focados') {
  const files = ['t-imitacao-configuracoes', 't-concessao', 't-concessao-sessao', 't-condicoes', 't-condicoes-efeitos', 't-delta-buffs', 't-g2-desempenho', 't-g2-fonte-compat', 't-g2-preferencias', 't-g2-sessao-operacoes', 't-g2-virada-registro', 't-pacotes-aliados', 't-ordem-modulos', 't-revisao-g00', 't-fechamento-g2'];
  const results = [];
  for (const name of files) {
    const now = Date.now();
    const r = spawnSync(process.execPath, [`asserts/${name}.mjs`], { cwd: root, encoding: 'utf8', timeout: 180000 });
    const result = { name, status: r.status, error: r.error?.message, ms: Date.now() - now, stdout: r.stdout, stderr: r.stderr };
    results.push(result);
    console.log(`${name}: ${r.status === 0 ? 'PASS' : 'FAIL'} (${result.ms} ms)`);
  }
  fs.writeFileSync(path.join(dir, 'asserts-focados.json'), JSON.stringify(results, null, 2));
  process.exitCode = results.some(r => r.status !== 0) ? 1 : 0;
} else {
  const before = readManifest('hashes-antes-src-asserts.txt');
  const delivered = readManifest('hashes-depois-src-asserts.txt');
  const actual = Object.fromEntries(Object.keys(delivered).map(f => [f, fs.existsSync(path.join(root, f)) ? hash(path.join(root, f)) : null]));
  const mismatches = Object.entries(delivered).filter(([f, h]) => actual[f] !== h);
  const changed = Object.keys(delivered).filter(f => before[f] !== delivered[f]);
  const metadata = { at: new Date().toISOString(), files: Object.keys(actual).length, mismatches, changed: changed.map(f => ({ file: f, new: !before[f], hash: actual[f] })), removed: Object.keys(before).filter(f => !(f in delivered)), actual };
  const stage = process.argv[2] || 'antes';
  fs.writeFileSync(path.join(dir, `hashes-${stage}.json`), JSON.stringify(metadata, null, 2));
  console.log(JSON.stringify({ stage, files: metadata.files, mismatches, changed: metadata.changed, removed: metadata.removed }, null, 2));
  process.exitCode = mismatches.length ? 1 : 0;
}
