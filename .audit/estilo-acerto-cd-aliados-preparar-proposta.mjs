import { readFileSync, writeFileSync } from 'node:fs';
const p = JSON.parse(readFileSync('.audit/estilo-acerto-cd-aliados-proposta.json', 'utf8'));
if (p.removidos.length) throw Error('Remoção fora do escopo');
for (const a of p.adicionados) {
  if (a.proprietarioSugerido !== 'TEC-01') throw Error('Adição fora do escopo');
  p.decisoes.adicoes[a.chave] = 'TEC-01';
}
p.decisoes.justificativaAtualizacao = 'Pedido do autor em 2026-10-12: Bônus de Acerto e CD também oferecem Aliados na segunda compra. Limite de duas e exclusão entre opções conservados. Compras anteriores sem marca mantêm BT inteiro pessoal por repeticaoPadrao. Reconciliação restrita ao TEC-01, sem aprovação ou remoção de regras.';
writeFileSync('.audit/estilo-acerto-cd-aliados-proposta-aplicavel.json', JSON.stringify(p, null, 2) + '\n');
