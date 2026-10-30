# Pacotes para Aliados: PA-I3, cada benefício no próprio prazo

Implementação do Claude para a pendência PA-I3 da reconferência do Codex de 20/10/2026
(`../reconferencia-codex-pacotes-20261020/REVISAO-CODEX.md`) com a decisão do autor: "Cada benefício termina no próprio prazo (recomendado)". PA-I1 e
PA-I2 não foram refeitos e seguem como regressão. Clássica padrão, G2 prévia (`?ficha-g2=1`). Sem commit, push, merge ou deploy. Não declara a
reconferência do Codex nem o aceite do autor. As pastas anteriores (`../pacotes-aliados-20261019/`, `../revisao-codex-pacotes-20261020/`,
`../pacotes-aliados-correcao-20261020/`, `../reconferencia-codex-pacotes-20261020/`) não foram alteradas: os roteiros reaproveitados foram copiados.

## Procedência

- HEAD local `68888733deffa9700aa69761fd965a504b9152db`. `git fetch origin` funcionou nesta rodada: `origin/main` continua
  `bcaf978695c3d239b84f0a12ed11479adc428016`, seis commits à frente, sem merge. Dois arquivos desta rodada também mudam lá:
  `afty-combate-conjurador.js` (trechos nas linhas 279 e 334, longe do export novo, que fica depois do `resolveAuxiliaresAtivos`) e `ficha-sessao.js`
  (imports novos vizinhos aos desta rodada, e uma linha no fim do `proximaRodada`, depois do trecho mexido aqui). São vizinhos, não as mesmas linhas:
  a integração junta os dois lados.
- No começo da rodada os 27 arquivos de código e testes do manifesto da correção conferiam com `../pacotes-aliados-correcao-20261020/hashes-depois.txt`,
  e os seis de documentação e coordenação tinham só as notas do Codex.
- `antes/`: ⚠ as cópias NÃO foram tiradas antes da primeira edição desta rodada. Foram recuperadas depois, assim: os arquivos do manifesto saíram do
  histórico de edição do Claude Code e só valeram quando o SHA-256 bateu com o manifesto da correção (todos bateram); os seis documentos ainda não
  tinham sido mexidos e foram copiados como estavam; `afty-combate-conjurador.js` veio do HEAD (o diff contra o HEAD era só o export desta rodada);
  `CompactaG2.jsx` e `g2-linha-do-tempo.js` (não versionados, fora do manifesto) vieram do histórico de edição, na versão cujo diff para a atual é só
  a mudança desta rodada. `hashes-antes.txt` cobre os 36 arquivos (os 33 do manifesto e esses três).
- `hashes-depois.txt`: os mesmos 36 depois da rodada. `src/components/` sem alteração.
- Servidores 5320 (dev) e 5321 (prévia do `dist/`) são os que o Codex subiu, não encerrados. O `dist/` foi refeito: a 5321 serve `index-nJzpcPu0.js`.

## O que mudou

| Arquivo | Mudança |
|---|---|
| `src/systems/afty/afty-combate-conjurador.js` | export novo `efeitosDoAuxiliarPorEfeito`, só leitura: os efeitos de um Feitiço separados pelo efeito resolvido de onde cada linha saiu, pelo mesmo caminho do `resolveAuxiliaresAtivos` (que não mudou) |
| `src/systems/afty/ficha/pacotes-familias.js` | cada benefício do Feitiço leva o prazo do efeito dele quando difere do da opção; a condição de texto "Uma Rodada" saiu |
| `src/systems/afty/ficha/pacotes-aliados.js` | `duracao` opcional no benefício (lida pela mesma lista branca do prazo da opção, prazo ruim recusa a opção com motivo), a instância com o contador próprio do benefício de rodadas, `prazoDoBeneficio`, `temPrazoPorBeneficio`, `partesDaInstancia`, `textoDaParte`, `semParteDaInstancia`, e o texto do benefício com o prazo dele |
| `src/systems/afty/ficha/ficha-sessao.js` | a virada desce o contador de cada benefício e tira só o que zera, com aviso pelo nome da parte; o registro recebido que expira passa a ter nome no aviso |
| `efeitos/gestor-logica.js`, `VisaoG2.jsx`, `CompactaG2.jsx` | Encerrar Parte (só a parte de um ataque; sem parte sobrando é o Encerrar de sempre) |
| `efeitos/efeitos-dados.js`, `g2-dados.js`, `g2-linha-do-tempo.js` | as partes no cartão, no Termina (quem encerra cada uma) e na Linha do Tempo (a barra da parte de rodadas) |
| `efeitos/PacotesPecas.jsx`, `ficha/abas/AbaBuffs.jsx` | o resumo da opção ("Prazo: Por Benefício", cada benefício com o seu) e a linha da clássica |
| `asserts/t-pacotes-aliados.mjs` | seção 10, PA-I3 (21 asserts), e o assert do misto da PA-I2 trocado pela decisão do autor |
| `docs/a-fazer.md`, `afty-status.md`, `afty-ficha-final.md`, `automacao-dsl.md`, `asserts/LEIA.md` e os três da pasta pai | registro, a decisão aplicada e a mudança vista pelo motor |

## Como funciona

- Resolvedor: o benefício recebe `duracao` própria só quando o prazo natural do EFEITO de onde saiu (um ataque, pelo `umGolpe` resolvido, ou uma
  rodada, na Imediata) difere do prazo da opção. No caso do Codex: Defesa `{ proximo, "Por Um Ataque" }` e Reflexos `{ rodadas: 1 }`. O Feitiço só de
  um ataque e o só de uma rodada continuam sem o campo.
- Instância: `rodadas` da instância nulo, e o benefício de rodadas leva o contador dele. As partes são os benefícios do mesmo prazo, a de rodadas
  primeiro. O descanso encerra a instância (`terminaNoDescanso`).
- Virada: só o contador do benefício desce. O que zera sai sem levar os outros, e a instância sai quando não sobra benefício. O aviso da virada diz
  "Guarda e Firmeza (TR de Reflexos)".
- Encerrar Parte (G2, no Termina do detalhe; a versão compacta recebe o mesmo botão, mas não foi exercitada no navegador): tira só a parte de um
  ataque, e a de rodadas segue com o contador. Encerrar tira o
  Feitiço inteiro, vai para os Encerrados, e Reativar é uma ativação nova com as duas partes e os prazos de novo.
- Compatibilidade: arquivo antigo sem o campo é lido com o prazo da opção, e a instância antiga já ativa não é reescrita (a virada não mexe nela).
  Para o prazo novo: o suporte reexporta (a revisão sobe), o aliado importa, encerra e reativa.
- O consumo automático do ataque continua fora: a parte de um ataque segue com o encerramento manual honesto ("A Ficha Não Conta Este Prazo: Encerre
  Quando Acabar"), sem rodada equivalente inventada.

## Evidências

- Prova de função nas duas árvores (`prova-pai3.mjs`, só a API que existe antes e depois: resolvedor real, arquivo, leitura, instância, virada e
  derive com a tradução compartilhada). Antes (`prova-antes.json`, árvore com `antes/`): Defesa 17 vira 20 e Reflexos 7 vira 9, e depois de três
  viradas segue 20 e 9, o defeito do Codex. Depois (`prova-depois.json`): 20 e 9 ligada, e na primeira virada 20 e 7, até a terceira.
- `asserts/t-pacotes-aliados.mjs`: 166 (seção 10 com 21). A separação por efeito é igual à lista do resolvedor, linha por linha, em todo Feitiço das
  fichas de teste. Cobre o arquivo, a recusa do prazo ruim, o arquivo antigo, a instância e as partes, o texto, as duas ordens de término, o aviso,
  clássica, G2 e Encontro iguais, a sessão relida, o descanso, o reativar, a instância antiga não reescrita e o prazo do cartão.
- Os doze focados da lista do Codex: 727 (Pacotes 166, Fonte Externa 52, desempenho 30, preferências 42, operações 51, virada 57, invocações na mesa
  120, Auxiliar ligado 26, métricas do Estilo 43, Novo Estilo 67, ordem de módulos 38, classificação 35).
- Suíte inteira: 223 de 225 (`asserts-depois.txt`), rodada sozinha. Falham `t-prodigio` e `t-reconciliacao-g00`, as mesmas da linha de base, no mesmo
  ponto.
- `npx eslint` nos arquivos mexidos sem problema, `npx vite build` aprovado (`build.txt`).
- PA-I3 no navegador (`browser-pai3.mjs`): suporte e aliado em contextos isolados, o arquivo realmente exportado e importado, cliques reais, em 1024 e
  1440. 43 de 43 em dev (`browser-pai3-5320.json`) e 43 de 43 em produção (`browser-pai3-5321.json`). O resumo do suporte e o do aliado com o prazo de
  cada benefício, o arquivo, Defesa +3 e Reflexos +2 ligada, a Linha do Tempo com a barra do TR, o detalhe com as duas partes e um Encerrar Parte,
  ORDEM 1 (a virada tira só o TR, mais duas viradas e a Defesa fica, recarga, clássica com os mesmos números e a linha certa), o Encerrar do Feitiço
  inteiro, o Reativar com as duas partes, ORDEM 2 (Encerrar Parte tira só a Defesa, a clássica mostra Reflexos +2, a virada na clássica tira o TR e a
  instância) e o descanso. Telas `5320-*.png` e `5321-*.png` (`suporte-resumo`, `detalhe-duas-partes`, `classica-ordem1`, `ordem2-apos-ataque`).
- Regressões, cópias dos roteiros anteriores com a saída aqui: devolutiva de PA-I1 e PA-I2 (`browser-devolutiva.mjs`) 48 de 48 em dev e em produção,
  percurso da entrega (`e2e-anterior.mjs`) 65 de 65 em dev e em produção, Fonte Externa manual (`regressao-fonte-manual.mjs`) 47 de 47 em produção.
  Cada roteiro rodou sozinho.

### Desempenho (build de produção, `perf-5321.json`)

Chrome local, 1440 x 900, Player 30 Volumoso, três repetições, `index-nJzpcPu0.js`, nada rodando junto.

| Operação | Sem pacote | Biblioteca e oito recebidos ligados |
|---|---|---|
| Abrir a Preparação do Ataque Concentrado e confirmar | 30 a 35 ms, nenhuma tarefa longa | 30 a 35 ms, nenhuma |
| Ativar uma nona opção recebida | | 49 a 56 ms, nenhuma |
| Duas ativações recebidas em sequência | | 2 de 2 ligadas nas três vezes, nenhuma |
| Clássica: abrir a aba Buffs | 30 a 32 ms, nenhuma | 34 a 35 ms, nenhuma |

Uma máquina e uma amostra: não é promessa de ausência universal de tarefa longa.

## O que continua separado

- As sete leituras de regra restantes seguem com o autor. A equivalência "até o próximo turno do emissor" igual a uma rodada (leitura 4) não foi
  mexida.
- O consumo automático do ataque, Só Consulta, PV Temporário por pacote, Permutativo em aliado e o resto sem representação continuam fora.
- Na clássica não há Encerrar Parte: ela mostra os números, o prazo de cada benefício e conta a virada, e o X da linha tira a instância inteira, como
  antes. Encerrar só a parte de um ataque é no G2.

## Para o autor (no máximo cinco tarefas)

1. Abra http://127.0.0.1:5321/Player?ficha-g2=1 com o suporte numa janela normal e o aliado numa janela anônima.
2. No suporte, crie um Feitiço Auxiliar de Múltiplos Efeitos Imediato de Reação com Defesa e TR, ponha num pacote e exporte. Confira no resumo o
   prazo de cada benefício.
3. No aliado, importe, ative e avance uma rodada: o TR sai e a Defesa fica. Avance mais e confira na clássica.
4. Encerre e reative pelo Encerrados, e desta vez use o Encerrar Parte no detalhe antes da virada: a Defesa sai e o TR fica até a virada.
5. Um pacote exportado antes desta rodada precisa ser exportado de novo. Encerre e reative a opção no aliado depois de importar.
