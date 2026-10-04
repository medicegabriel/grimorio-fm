import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const arquivos = [
 'src/systems/afty/afty-combate-conjurador.js', 'src/systems/afty/afty-efeitos-conteudo.js',
 'src/systems/afty/afty-pericias.js', 'src/systems/afty/ficha/abas/AbaAcoes.jsx',
 'src/systems/afty/ui/fontes.jsx', 'addons/maldicao-era-de-ouro.json',
 'asserts/t-maldicao-era-de-ouro.mjs', 'docs/a-fazer.md', 'docs/automacao-dsl.md',
 'docs/afty-ficha-final.md', 'docs/afty-status.md', 'asserts/LEIA.md',
];
const proibido = String.fromCharCode(0x2014);
const ruins = [];
for (const arquivo of arquivos) {
 const copia = `.audit/lote04-base/${arquivo.split('/').at(-1)}`;
 const r = spawnSync('git', ['diff', '--no-index', '--', copia, arquivo], { encoding: 'utf8' });
 if (![0,1].includes(r.status)) throw new Error(r.stderr);
 const linhas = r.stdout.split('\n').filter(l => l.startsWith('+') && !l.startsWith('+++'));
 if (linhas.some(l => l.includes(proibido))) ruins.push(arquivo);
}
if (readFileSync('asserts/t-alcance-corpo-a-corpo.mjs', 'utf8').includes(proibido)) ruins.push('assert novo');
if (ruins.length) throw new Error(`Caractere proibido em: ${ruins.join(', ')}`);
console.log('Nenhum U+2014 nas alterações do lote.');
const fontes = spawnSync('git', ['diff', '--no-index', '--', '.audit/lote04-base/fontes.jsx', 'src/systems/afty/ui/fontes.jsx'], { encoding: 'utf8' });
console.log(fontes.stdout);
