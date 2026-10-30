import { readFileSync, writeFileSync } from 'node:fs';
const p = JSON.parse(readFileSync('.audit/estilo-repeticao-proposta.json', 'utf8'));
for (const a of p.adicionados) {
  if (a.proprietarioSugerido !== 'TEC-01') throw Error('Adição fora do escopo');
  p.decisoes.adicoes[a.chave] = a.proprietarioSugerido;
}
for (const r of p.removidos) {
  if (!r.chave.startsWith('afty-estilo-sombras-catalogo.js::PROGRESSAO_TECNICAS::extras')) throw Error('Remoção fora do escopo');
  p.decisoes.remocoes[r.chave] = { justificativa: 'Decisão do autor em 2026-10-12: progressão continua a cada três níveis sem parar no 19. A lista finita extras e suas posições foram substituídas por intervalo: 3. Os marcos anteriores continuam produzindo os mesmos ganhos; registros históricos são conservados.' };
}
p.decisoes.justificativaAtualizacao = 'Decisões do autor em 2026-10-12: continuidade da progressão do Novo Estilo das Sombras e alternativa pessoal na segunda compra, incompatível com aliados. Acerto e CD limitados a duas compras, metade do BT ou BT inteiro. Reconciliação restrita ao TEC-01, sem aprovação de regras ou alteração de estados alheios.';
writeFileSync('.audit/estilo-repeticao-proposta-aplicavel.json', JSON.stringify(p, null, 2) + '\n');
