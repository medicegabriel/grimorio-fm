import fs from 'node:fs';
const arquivo = 'src/systems/afty/afty-equipamentos.js';
let atual = fs.readFileSync(arquivo, 'utf8');
const eol = atual.includes('\r\n') ? '\r\n' : '\n';
for (const [id, canal] of [['canalizadora', 'cd'], ['otimizada', 'iniciativa']]) {
  const inicio = atual.indexOf(`  { id: "enc_arma_${id}"`);
  const alvo = `    efeitos: [{ canal: "${canal}", expr: "2" }] },`;
  const pos = atual.indexOf(alvo, inicio);
  if (inicio < 0 || pos < 0 || pos - inicio > 600) throw new Error(`Entrada não encontrada: ${id}`);
  atual = atual.slice(0, pos) + `    naoAcumula: true,${eol}` + atual.slice(pos);
}
fs.writeFileSync(arquivo, atual);
console.log('Canalizadora e Otimizada com naoAcumula.');
