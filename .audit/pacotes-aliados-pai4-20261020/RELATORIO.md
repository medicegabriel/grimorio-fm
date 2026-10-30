# Pacotes para Aliados: PA-I4, o prazo herdado da opção também ganha contador

Implementação do Claude para a pendência PA-I4 da reconferência do Codex de 20/10/2026 (`../revisao-codex-pai3-20261020/REVISAO-CODEX.md` e
`DEVOLUTIVA-CLAUDE-PACOTES-ALIADOS.md`). A decisão do autor (cada benefício no próprio prazo) não mudou, e não há regra nova a perguntar. PA-I1, PA-I2 e
PA-I3 não foram refeitos e seguem como regressão. Clássica padrão, G2 prévia (`?ficha-g2=1`). Sem commit, push, merge ou deploy. Não declara a
reconferência do Codex nem o aceite do autor. As pastas anteriores (`../pacotes-aliados-20261019/`, `../revisao-codex-pacotes-20261020/`,
`../pacotes-aliados-correcao-20261020/`, `../reconferencia-codex-pacotes-20261020/`, `../pacotes-aliados-pai3-20261020/`, `../revisao-codex-pai3-20261020/`)
não foram alteradas: os roteiros reaproveitados, inclusive os do próprio Codex, foram copiados para cá com a saída redirecionada.

## Procedência

- HEAD local `68888733deffa9700aa69761fd965a504b9152db`. `git fetch origin` funcionou nesta rodada: `origin/main` continua
  `bcaf978695c3d239b84f0a12ed11479adc428016`, seis commits à frente, sem merge. Dos arquivos desta rodada o remoto só tem quatro documentos
  (`asserts/LEIA.md`, `docs/a-fazer.md`, `docs/afty-status.md`, `docs/automacao-dsl.md`), nenhum de código. O código desta rodada não existe lá.
- `antes/` e `hashes-antes.txt`: desta vez as cópias foram tiradas ANTES da primeira edição de código, dos 36 arquivos da lista da rodada do PA-I3
  (`lista.txt`). Os 30 de código e teste conferem com o manifesto de fim do PA-I3 (`../pacotes-aliados-pai3-20261020/hashes-depois.txt`). Os seis que
  diferem são documentos e coordenação, com as notas da revisão do Codex, preservadas.
- `hashes-depois.txt`: os mesmos 36 depois da rodada, gerados depois da última edição. `src/components/` sem alteração.
- Servidores 5320 (dev) e 5321 (prévia do `dist/`) são os que o Codex subiu, não encerrados. O `dist/` foi refeito: a 5321 serve `index-DXbM09UQ.js`, mais
  novo que todo arquivo de `src/`.
- O autor pediu uma pausa de 49 minutos no meio da rodada (tokens). O trabalho parou depois das regressões de navegador e voltou com o código
  inalterado (conferido: só os quatro arquivos abaixo diferem do snapshot, e o `dist/` seguia mais novo que o `src/`).

## O que mudou

| Arquivo | Mudança |
|---|---|
| `src/systems/afty/ficha/pacotes-aliados.js` | `beneficiosComPrazoEfetivo` (o prazo de cada benefício: o próprio, ou o herdado da opção), usada por `instanciaDaOpcao` para criar o contador de todo benefício cujo prazo efetivo é em rodadas e para o `terminaNoDescanso`; `chaveDaParte` e `partesDaInstancia` mostram o benefício de rodadas sem contador (instância antiga) como parte à parte, de encerramento manual |
| `src/systems/afty/ficha/efeitos/PacotesPecas.jsx`, `RecebidosG2.jsx`, `recebidos.js` | o resumo da opção, o resumo da importação e o texto da busca dizem o prazo efetivo de cada benefício |
| `asserts/t-pacotes-aliados.mjs` | seção 11, PA-I4 (23 asserts) |
| `docs/a-fazer.md`, `afty-status.md`, `afty-ficha-final.md`, `automacao-dsl.md`, `asserts/LEIA.md` e os três da pasta pai | registro |

Nenhum arquivo do motor mudou. A virada (`proximaRodada`) é a mesma: continua descendo só o contador que existe.

## Como funciona

- O formato aceita o prazo comum na opção e uma exceção no benefício, e isso vale o mesmo que um prazo em cada benefício (o exportador escreve sempre um em
  cada). Ao criar a instância, `beneficiosComPrazoEfetivo` escreve o prazo efetivo em cada benefício da CÓPIA, e o de rodadas leva o contador: com a opção
  em 1 rodada, a Defesa com a exceção de um ataque e o TR sem prazo próprio, a instância sai idêntica à do arquivo com um prazo em cada benefício.
- Sem prazo próprio em nenhum benefício, nada muda: a instância conta as rodadas da opção, como antes.
- A opção da biblioteca não é reescrita (um assert confere). A instância que já estava ativa sem contador também não: a virada a deixa como está, e a tela
  deixou de dizer que a ficha a conta. O TR sem contador aparece como uma parte de encerramento manual, com Encerrar Parte.
- Compatibilidade: arquivo e instância antigos seguem como antes. Quem tem uma instância feita do arquivo "herdado" antes desta correção encerra e reativa a
  opção para ganhar o contador.

## Evidências

- Prova de função nas duas árvores (`prova-pai4.mjs`, só a API que existe antes e depois: resolvedor real, exportador, leitura, biblioteca, instância,
  virada e derive com a tradução compartilhada). Árvore de antes (`prova-antes.json`): na variante A (o caso do Codex) o Reflexos fica em +9 depois de três
  viradas, e na variante D (a Defesa com 1 rodada, o TR herdando as 2 da opção) o TR fica em +9 e nunca sai. As variantes B (herdado/próprio) e C (um
  prazo em cada) já estavam certas, porque nelas o benefício de rodadas tem o prazo escrito. Árvore de depois (`prova-depois.json`): as quatro certas, com
  o TR saindo na primeira virada em A, B e C, e na segunda em D.
- `asserts/t-pacotes-aliados.mjs`: 189 (seção 11 com 23). Cobre as combinações explícito/explícito, próprio/herdado, herdado/próprio, nenhum prazo próprio,
  rodadas diferentes nos dois sentidos e a opção permanente, a instância equivalente, as viradas, a ordem em que o ataque vem primeiro, o texto, a opção
  não reescrita, clássica, G2 e Encontro iguais, a sessão relida e a instância antiga.
- Os doze focados da lista do Codex: 750 (Pacotes 189, Fonte Externa 52, desempenho 30, preferências 42, operações 51, virada 57, invocações na mesa 120,
  Auxiliar ligado 26, métricas do Estilo 43, Novo Estilo 67, ordem de módulos 38, classificação 35).
- Suíte inteira: 223 de 225 (`asserts-depois.txt`), rodada sozinha. Falham `t-prodigio` e `t-reconciliacao-g00`, as mesmas da linha de base, no mesmo ponto.
- `npx eslint` nos arquivos mexidos sem problema, `npx vite build` aprovado (`build.txt`).
- PA-I4 no navegador (`browser-pai4.mjs`): contextos isolados, os arquivos de `variantes.json` (do resolvedor e do exportador reais) importados pela tela,
  cliques reais, em 1024 e 1440, na completa, na compacta e na clássica. 54 de 54 em produção (`browser-pai4-5321.json`) e 54 de 54 em dev
  (`browser-pai4-5320.json`). A: arquivo aceito, resumo da importação e da opção com o prazo efetivo, instância com o contador, detalhe da completa e da
  compacta com "A Ficha Conta as Rodadas e Encerra Sozinha", ORDEM 1 (a virada tira só o TR, mais duas viradas, recarga, clássica), Encerrar e Reativar com o
  contador de novo, recarga, ORDEM 2 (Encerrar Parte na compacta, por mouse em 1024 e por Enter em 1440, tira só a Defesa, e a virada na clássica tira o TR).
  D: a Defesa sai na primeira virada e o TR na segunda, com recarga e clássica. F: a instância antiga com o TR sem contador, que não é reescrita pela
  virada, aparece como parte manual, e o Encerrar Parte tira só o TR. Telas `5321-a-compacta-antes-*.png`, `5321-a-classica-fim-*.png`,
  `5321-f-antiga-detalhe-*.png`.
- Os scripts do próprio Codex, em cópia (`compacta-heranca-codex.mjs` e `prazos-herdados-codex.mjs`): o de função dá `defesaPreservada` e `trExpira`
  verdadeiros, e o do navegador, que na revisão reprovou quatro dos oito casos do prazo herdado, passa 22 de 22 em produção (`compacta-heranca-5321.json`) e
  22 de 22 em dev.
- Regressões, cópias dos roteiros anteriores com a saída aqui, em produção e em dev: PA-I3 (`browser-pai3.mjs`) 43 de 43, devolutiva de PA-I1 e PA-I2
  (`browser-devolutiva.mjs`) 48 de 48, percurso da entrega (`e2e-anterior.mjs`) 65 de 65. Fonte Externa manual (`regressao-fonte-manual.mjs`) 47 de 47 em
  produção. Cada roteiro rodou sozinho.
- Um tropeço do meu lado, sem efeito no resultado: chamei `python` por engano para um script de edição, ele travou (é o atalho da Loja no Windows), parei a
  tarefa e conferi que o arquivo estava intacto (mesmo SHA-256 do snapshot) antes de refazer as edições pela ferramenta de edição.

### Desempenho (build de produção, `perf-5321.json`)

Chrome local, 1440 x 900, Player 30 Volumoso, três repetições, `index-DXbM09UQ.js`, nada rodando junto.

| Operação | Sem pacote | Biblioteca e oito recebidos ligados |
|---|---|---|
| Abrir a Preparação do Ataque Concentrado e confirmar | 53 a 56 ms, nenhuma tarefa longa | 53 ms nas três, nenhuma |
| Ativar uma nona opção recebida | | 48 a 49 ms, nenhuma |
| Duas ativações recebidas em sequência | | 2 de 2 ligadas nas três vezes, nenhuma |
| Clássica: abrir a aba Buffs | 31 a 32 ms, nenhuma | 31 a 34 ms, nenhuma |

O "confirmar" ficou em 53 a 56 ms nesta execução, contra 30 a 35 ms na rodada do PA-I3 e 51 a 60 ms na primeira entrega. Subiu igual com e sem pacote,
então a diferença é da máquina naquele momento, e não do lote. Uma máquina e uma amostra: não é promessa de ausência universal de tarefa longa.

## O que continua separado

- As sete leituras de regra restantes seguem com o autor. A equivalência "até o próximo turno do emissor" igual a uma rodada (leitura 4) não foi mexida.
- O consumo automático do ataque, Só Consulta, PV Temporário por pacote, Permutativo em aliado e o resto sem representação continuam fora.
- O Encerrar Parte continua só no G2 (completa e compacta). A clássica mostra o prazo de cada benefício e conta a virada.
- Não testei no navegador a opção permanente herdada (só em função, nos asserts) nem o caso "nenhum prazo próprio" (também só em função).

## Para o autor (no máximo cinco tarefas)

1. Abra http://127.0.0.1:5321/Player?ficha-g2=1 com o suporte numa janela normal e o aliado numa janela anônima.
2. Os pacotes que o seu suporte exporta já trazem o prazo escrito em cada benefício, então o caso novo só aparece com um arquivo que herda o prazo da
   opção. Para vê-lo, use `.audit/pacotes-aliados-pai4-20261020/variante-A.json` (a Defesa com a exceção de um ataque e o TR herdando 1 rodada) ou
   `variante-D.json` (a Defesa com 1 rodada e o TR herdando 2). São arquivos de teste, feitos do resolvedor real, e não vêm de uma ficha sua.
3. No aliado, importe esse arquivo, ative e avance uma rodada: o TR sai e a Defesa de um ataque fica. Repita na clássica.
4. Reative e use o Encerrar Parte no detalhe antes da virada: só a Defesa sai, o TR fica até a virada.
5. Se você já ativou antes de hoje uma opção que herdava o prazo, o TR dela não tem contador: encerre e reative a opção para ganhar o contador.
