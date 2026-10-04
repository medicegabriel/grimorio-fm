import fs from 'node:fs';
const arquivo = 'docs/afty-status.md';
const atual = fs.readFileSync(arquivo, 'utf8');
const eol = atual.includes('\r\n') ? '\r\n' : '\n';
const titulo = '## SESSÃO DE 2026-10-03: LOTE 06, ENCANTAMENTOS, SUPORTE E FEITIÇOS DO JOGADOR';
const inicio = atual.indexOf(titulo);
if (inicio < 0 || atual.split(titulo).length !== 2) throw new Error('Sessão não única');
const proxima = atual.indexOf('\n## SESSÃO DE ', inicio + titulo.length);
const fim = proxima < 0 ? atual.length : proxima + 1;
const sessao = `${titulo}

**Decisões do autor:** opção A nas três perguntas. Canalizadora e Otimizada seguem a Balanceada nos dois sistemas, criatura e jogador. Suporte Absoluto usa \`mod_pre_ou_sab\` nos dois. Na Ficha de Player, Conjuração Aprimorada mantém \`n - 1\`: dois Feitiços iniciais no nível 1, um por subida de nível a partir do 2 e os adicionais dos níveis 10 e 20.

**O que mudou:** em \`ENCANTAMENTOS_ARMA\` de \`afty-equipamentos.js\`, Canalizadora e Otimizada ganharam \`naoAcumula: true\`. Duas armas com a mesma propriedade aplicam +2, inclusive quando uma foi comprada e a outra recebeu a propriedade pelo Manejo Especial. A fonte entra uma vez no hover. Em \`sup_suporte_absoluto\` de \`afty-efeitos-conteudo.js\`, a expressão do canal \`curaFixa\` passou de \`mod_tecnica\` para \`mod_pre_ou_sab\`, com o comentário corrigido. A progressão de \`totalFeiticosJogador\` não mudou, e o comentário agora registra a confirmação do autor. As três entradas saíram de \`docs/a-fazer.md\`. Guias atualizados: \`docs/afty-equipamentos.md\` e \`docs/afty-player.md\`.

**Asserts:** linha de base com 147 arquivos e somente o vermelho conhecido \`t-invocacoes-motor.mjs\`, na expectativa de custo da Livre. \`t-balanceada.mjs\` passou de 38 para 52 asserts, com os dois sistemas, duas armas compradas, a fonte única no hover e a combinação com Manejo Especial. Os 14 casos novos falharam contra o código anterior e passam com os dois campos. \`t-suporte-revisao.mjs\` passou de 41 para 49, medindo Presença maior e Sabedoria maior, com a Técnica em Inteligência +5 nos dois sistemas. Os quatro casos da fonte reproduziram o erro anterior e passam com a nova expressão. \`t-sistema.mjs\` passa com 460, incluindo a progressão de Feitiços confirmada. Suíte final: 147 arquivos, 8004 asserts, todos passaram. O vermelho da Livre foi resolvido pelo Lote 05 em paralelo. \`t-ordem-modulos.mjs\` (34) passa na suíte, ESLint da área Afty limpo e build passando. Nenhum import mudou neste lote.

**Verificado ao vivo:** servidor próprio na porta 5186, Chrome em contexto temporário sem ocultar barras de rolagem, /afty e /player a 1440 e 390 px. Duas armas com os dois encantamentos dão +2 de CD e +2 de Iniciativa, com somente uma fonte de cada no hover. Suporte Absoluto soma +4 com Presença 18 e Sabedoria 14, mesmo com a Técnica em Inteligência 20 (+5). No telefone, o toque longo abre as fontes da cura. No criador do jogador, o orçamento do Conjurador mostra 0 / 2 no nível 1 e 0 / 33 no nível 30, nas duas larguras. Sem erro de página ou de console, e sem rolagem horizontal na aba Ações da ficha. Capturas, relatórios e roteiros em \`.audit/lote06-*\`.

**Achado e não mexido:** nenhuma pendência deste lote. A separação entre CD de Especialização e CD Amaldiçoada continua adiada e permanece na fila. Uma execução intermediária da suíte pegou \`soma is not defined\` no assert de tipos especiais enquanto o Lote 05 o editava, e o arquivo corrigido pelo outro chat passa com 89 asserts. O build informa o tamanho do pacote principal. Sem commit ou push.

`;
fs.writeFileSync(arquivo, atual.slice(0, inicio) + sessao.replace(/\r?\n/g, eol) + atual.slice(fim));
console.log('Registro do Lote 06 concluído, preservando a sessão seguinte do Lote 05.');
