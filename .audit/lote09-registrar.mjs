import { readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const fila = 'docs/a-fazer.md';
let texto = readFileSync(fila, 'utf8');
const nl = texto.includes('\r\n') ? '\r\n' : '\n';
const inicio = texto.indexOf('### Técnica Inata perdida: a Passiva continua ocupando PE Máximo?');
const fim = texto.indexOf('\n### ', inicio + 4);
if (inicio < 0 || fim < 0) throw new Error('Entrada de PE ausente');
const nova = [
  '### Técnica Inata perdida: a Passiva continua ocupando PE Máximo?',
  '**Onde:** `src/systems/afty/afty-derive.js` (`peMaximoDasPassivas`)',
  '**Situação:** no jogador, cada Feitiço Passivo encolhe o PE Máximo (divergência',
  '`passivaCustaPeMaximo`). O autor decidiu em 2026-10-03 que fora de campo o Fundamento',
  'bloqueia a Técnica inteira na mesa, incluindo Funcionamento e Passivas. O custo no PE Máximo',
  'continua tanto fora de campo quanto com a Técnica perdida pela morte do Fundamento.',
  '**Precisa:** falta a resposta à pergunta feita no Lote 09: manter a reserva nos dois casos,',
  'liberá-la nos dois casos ou liberá-la apenas com a Técnica perdida. Escopo: Ficha de Player.',
  '**Anotado:** 2026-10-01, na Etapa 8 da atualização de Controlador e Invocações',
  '', '',
].join(nl);
texto = texto.slice(0, inicio) + nova + texto.slice(fim + 1);
writeFileSync(fila, texto);
const status = 'docs/afty-status.md';
const atual = readFileSync(status, 'utf8');
const titulo = '## SESSÃO DE 2026-10-03: LOTE 09, FUNDAMENTO E TÉCNICA INATA (PARCIAL)';
if (atual.includes(titulo)) throw new Error('Sessão já registrada');
const registro = readFileSync('.audit/lote09-sessao.md', 'utf8').replace(/\r\n/g, '\n');
const proibido = String.fromCharCode(0x2014);
if (registro.includes(proibido)) throw new Error('Caractere proibido no registro');
appendFileSync(status, '\n' + registro.replace(/\n/g, atual.includes('\r\n') ? '\r\n' : '\n'));
const pares = [
 ['afty-derive.js', 'src/systems/afty/afty-derive.js'],
 ['afty-invocacoes.js', 'src/systems/afty/afty-invocacoes.js'],
 ['AbaInvocacoes.jsx', 'src/systems/afty/ficha/abas/AbaInvocacoes.jsx'],
 ['t-invocacao-tipos-especiais.mjs', 'asserts/t-invocacao-tipos-especiais.mjs'],
 ['afty-invocacoes.md', 'docs/afty-invocacoes.md'],
];
for (const [base, alvo] of pares) {
 const r = spawnSync('git', ['diff', '--no-index', '--', '.audit/lote09-base/' + base, alvo], { encoding: 'utf8' });
 if (r.status > 1) throw new Error(r.stderr);
 const linhas = r.stdout.split('\n').filter(l => l.startsWith('+') && !l.startsWith('+++'));
 if (linhas.some(l => l.includes(proibido))) throw new Error('Caractere proibido em ' + alvo);
}
if (readFileSync('asserts/t-fundamento-bloqueio.mjs', 'utf8').includes(proibido)) throw new Error('Caractere proibido no assert novo');
console.log('Sessão parcial registrada. Diff do lote sem U+2014.');
