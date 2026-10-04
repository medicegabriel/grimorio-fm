import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
const arquivo = 'docs/afty-status.md';
const atual = fs.readFileSync(arquivo, 'utf8');
const titulo = '## SESSÃO DE 2026-10-03: LOTE 06, ENCANTAMENTOS, SUPORTE E FEITIÇOS DO JOGADOR';
if (atual.includes(titulo)) throw new Error('Sessão já registrada');
const eol = atual.includes('\r\n') ? '\r\n' : '\n';
const sessao = `

${titulo}

**Decisões do autor:** Canalizadora e Otimizada seguem a Balanceada nos dois sistemas, criatura e jogador (opção A). As perguntas de Suporte Absoluto e da progressão de Conjuração Aprimorada foram enviadas na mesma rodada e ainda aguardam resposta. O lote está parcialmente concluído.

**O que mudou:** em \`ENCANTAMENTOS_ARMA\` de \`afty-equipamentos.js\`, Canalizadora e Otimizada ganharam \`naoAcumula: true\`. Duas armas com a mesma propriedade aplicam +2, inclusive quando uma foi comprada e a outra recebeu a propriedade pelo Manejo Especial. A fonte entra uma vez no hover. A pergunta dos encantamentos saiu de \`docs/a-fazer.md\` e as duas linhas do guia \`docs/afty-equipamentos.md\` foram atualizadas. Suporte Absoluto e \`totalFeiticosJogador\` continuam como estavam.

**Asserts:** linha de base com 147 arquivos e somente o vermelho conhecido \`t-invocacoes-motor.mjs\`, na expectativa de custo da Livre. \`t-balanceada.mjs\` passou de 38 para 52 asserts, com os dois sistemas, duas armas compradas, a fonte única no hover e a combinação com Manejo Especial. Os 14 casos novos falharam contra o código anterior e passam com os dois campos. A suíte após a alteração permanece com 147 arquivos e apenas o mesmo vermelho. ESLint da área Afty limpo e build passando. Nenhum import mudou.

**Verificado ao vivo:** servidor próprio na porta 5186, Chrome em contexto temporário sem ocultar barras de rolagem, /afty e /player a 1440 e 390 px. Duas armas com os dois encantamentos dão +2 de CD e +2 de Iniciativa. Cada hover mostra somente Espada Curta (Canalizadora) ou Espada Curta (Otimizada), com +2. Sem erro de página, erro de console ou rolagem horizontal na aba Ações. Capturas, relatório e roteiro em \`.audit/lote06-*\`.

**Achado e não mexido:** o custo da Livre pertence ao Lote 05. A separação entre CD de Especialização e CD Amaldiçoada continua adiada. Faltam as decisões 2 e 3 para concluir este lote. O build informa o tamanho do pacote principal. Sem commit ou push.
`;
fs.appendFileSync(arquivo, sessao.replace(/\r?\n/g, eol));
const arquivos = ['src/systems/afty/afty-equipamentos.js', 'asserts/t-balanceada.mjs', 'docs/afty-equipamentos.md', 'docs/a-fazer.md', 'docs/afty-status.md'];
for (const f of arquivos) {
  const r = spawnSync('git', ['diff', '--no-index', '--', `.audit/lote06-base/${f}`, f], { encoding: 'utf8' });
  if (r.status !== 0 && r.status !== 1) throw new Error(r.stderr || `Erro no diff: ${f}`);
  const adicionadas = r.stdout.split(/\r?\n/).filter(l => l.startsWith('+') && !l.startsWith('+++'));
  if (adicionadas.some(l => l.includes(String.fromCodePoint(0x2014)))) throw new Error(`U+2014 novo em ${f}`);
  const c = spawnSync('git', ['diff', '--no-index', '--check', '--', `.audit/lote06-base/${f}`, f], { encoding: 'utf8' });
  if (c.status !== 0) throw new Error(c.stdout + c.stderr);
}
for (const f of ['src/systems/afty/afty-efeitos-conteudo.js', 'src/systems/afty/afty-feiticos.js', 'asserts/t-suporte-revisao.mjs', 'docs/afty-player.md']) {
  if (!fs.readFileSync(f).equals(fs.readFileSync(`.audit/lote06-base/${f}`))) throw new Error(`Mudança inesperada em ${f}`);
}
console.log('Sessão parcial registrada. Diff próprio sem U+2014 ou erro de espaço. Suporte e Feitiços preservados.');
