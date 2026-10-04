import fs from 'node:fs';
const guia = 'docs/afty-equipamentos.md';
let atual = fs.readFileSync(guia, 'utf8');
for (const [antes, depois] of [
 ['| Canalizadora | arma | `cd` 2 |', '| Canalizadora | arma | `cd` 2. Não acumula entre armas (`naoAcumula`) |'],
 ['| Otimizada | arma | `iniciativa` 2 |', '| Otimizada | arma | `iniciativa` 2. Não acumula entre armas (`naoAcumula`) |'],
]) {
  if (atual.split(antes).length !== 2) throw new Error(`Trecho não único: ${antes}`);
  atual = atual.replace(antes, depois);
}
fs.writeFileSync(guia, atual);
const fila = 'docs/a-fazer.md';
atual = fs.readFileSync(fila, 'utf8');
const titulo = '### Canalizadora e Otimizada acumulam entre armas?';
const inicio = atual.indexOf(titulo);
const fim = atual.indexOf('### ', inicio + titulo.length);
if (inicio < 0 || fim < 0) throw new Error('Entrada da fila não encontrada');
fs.writeFileSync(fila, atual.slice(0, inicio) + atual.slice(fim));
console.log('Guia dos dois encantamentos atualizado e pendência resolvida retirada da fila.');
