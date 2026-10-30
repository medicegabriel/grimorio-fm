# Pacotes para Aliados: correção de PA-I1 e PA-I2

Resposta do Claude à devolutiva do Codex de 20/10/2026 (`C:/Projetos/Grimorio/DEVOLUTIVA-CLAUDE-PACOTES-ALIADOS.md`). Corrige os dois defeitos no
mesmo lote, sem refazer os Pacotes nem a integração. Clássica segue padrão e G2 prévia (`?ficha-g2=1`). Sem commit, push, merge ou deploy. Não
declara a reconferência do Codex nem o aceite do autor. A pasta da entrega (`../pacotes-aliados-20261019/`) e a da revisão
(`../revisao-codex-pacotes-20261020/`) não foram alteradas: os roteiros reaproveitados foram copiados para cá.

## Procedência

- HEAD local `68888733deffa9700aa69761fd965a504b9152db`. `git fetch origin` funcionou nesta rodada: `origin/main` continua
  `bcaf978695c3d239b84f0a12ed11479adc428016`, seis commits à frente, sem merge. Entre os arquivos desta correção, o remoto toca só documentos
  (`asserts/LEIA.md`, `docs/a-fazer.md`, `docs/afty-status.md`, `docs/automacao-dsl.md`), nenhum código.
- `hashes-antes.txt`: os 33 arquivos do manifesto da entrega, copiados em `antes/` no começo desta rodada. Os 27 de código e testes conferem com o
  manifesto da entrega. Os seis que mudaram depois dela são documentos e coordenação (`docs/a-fazer.md`, `docs/afty-ficha-final.md`,
  `docs/afty-status.md` e os três da pasta pai), com as notas da revisão do Codex, preservadas.
- `hashes-depois.txt`: os mesmos 33 arquivos depois da correção. `src/components/` sem alteração.
- Servidores: 5320 (dev) e 5321 (prévia do `dist/`) são os que o Codex subiu, e não foram encerrados. O `dist/` foi refeito com a correção, e a
  5321 serve `index-BeqttLoe.js`.

## O que mudou

| Arquivo | Mudança |
|---|---|
| `src/systems/afty/ficha/ficha-recebidos.js` | PA-I1: a condição decide quem disputa o "vale o maior" |
| `src/systems/afty/ficha/pacotes-familias.js` | PA-I2: o prazo do Feitiço Imediato de um ataque |
| `src/systems/afty/ficha/abas/AbaBuffs.jsx` | a linha da clássica diz o prazo do pacote, e o nome não encolhe atrás do rótulo longo |
| `src/systems/afty/ficha/efeitos/g2-dados.js` | o cartão do G2 reconhece "Por Um Ataque" e "Contra Um Ataque" como o prazo curto "Um Ataque" |
| `asserts/t-pacotes-aliados.mjs` | seção 9, a devolutiva (29 asserts novos) |
| `docs/a-fazer.md`, `afty-status.md`, `afty-ficha-final.md`, `automacao-dsl.md`, `asserts/LEIA.md` e os três da pasta pai | registro, a leitura nova 8 e o texto que tinha envelhecido ("a condição nunca entra na disputa") |

### PA-I1

A disputa do "vale o maior" que `ficha-recebidos.js` faz fora do motor (catálogo, auxílio de invocação, Aura numérica e Aura de Dano) rodava sem a
condição, e só a linha gerada do vencedor a levava. Agora só entra na disputa o benefício cuja condição vale AGORA no receptor. A pergunta é a do
motor (`aplicarEfeitos` pula a linha quando `evalNumber(quando)` dá 0) com `combateDslVars` do `combate` resolvido do derive de base do próprio
receptor, o mesmo objeto que o motor põe no contexto (o `combate` exposto difere só no custo em PE dos estados extras, que `combateDslVars` não lê).

- A condição segue na linha gerada do vencedor até o derive final, que confere de novo. Na Aura de Dano, a linha que tira o dado próprio menor leva a
  mesma condição, para as duas valerem juntas.
- O benefício fora pela condição fica na análise como `condicao` e não cobre ninguém. A identidade da disputa (canal, alvo, grupo e sinal) não mudou.
- Feitiço e Estilo não mudaram: a disputa deles é do próprio motor, que avalia o `quando` antes de pôr a linha no pool. Há assert provando isso.
- As condições que um registro pode ter são as de `QUANDOS_PACOTE` (só `em_combate`, uma variável da bancada). Um assert falha se entrar uma condição
  que não seja da bancada, porque a disputa lê só o combate do receptor.
- O derive de base passa a ser pedido também por um auxílio com condição (antes só catálogo e Aura o pediam). Catálogo e Aura já o faziam.

### PA-I2

"Imediatas, cujo benefício irá durar por um ataque ou por uma rodada apenas" (p. 216). O resolvedor exportava o Feitiço de um ataque como 1 rodada com
o texto "Um Ataque", e a virada o encerrava sem ataque nenhum. Agora o prazo vem do `umGolpe` RESOLVIDO pelo motor em cada efeito:

- a marca de Um Ataque, e também a Reação de Defesa e de RD, que o motor já trata como "por um golpe" sem a marca;
- no Múltiplos Efeitos de Reação o `umGolpe` do Feitiço inteiro é falso e o de cada efeito é verdadeiro: ler só o campo cru deixaria o defeito ali.

O Feitiço assim sai com `{ tipo: "proximo", texto: "Por Um Ataque" }`, formato que já existia: a instância não tem rodadas, a virada não a encerra, o
descanso encerra e o jogador encerra pelo Encerrar (o detalhe do G2 diz "A Ficha Não Conta Este Prazo: Encerre Quando Acabar"). A ficha não conta
ataques, e o consumo automático no ataque continua fora. O Feitiço Imediato sem ataque continua 1 rodada.

O Múltiplos Efeitos que mistura um efeito de um ataque com outro de uma rodada existe (132 combinações de Defesa ou RD com outro efeito). A instância
é uma só: o conjunto leva o prazo de uso e as partes de uma rodada vão nas condições ("Bônus em Teste de Resistência: Uma Rodada"). É leitura nova
para o autor (8), em `docs/a-fazer.md`. A equivalência "até o próximo turno do emissor" igual a uma rodada (leitura 4) não foi mexida.

Arquivo exportado antes da correção guarda o prazo antigo, e a leitura não o converte pelo texto. O suporte reexporta (a assinatura muda e a revisão
sobe), o aliado importa a revisão nova e reativa. A instância já ativa guarda a cópia antiga até ser encerrada, como qualquer revisão nova.

## Evidências

- `asserts/t-pacotes-aliados.mjs`: 145 (116 de antes e 29 da devolutiva). Rodado contra uma cópia de `src/` com os quatro arquivos desta correção
  trocados pelos de `antes/`, falha 19 vezes, só na seção nova (`asserts-novos-no-codigo-antes.txt`). Cobre fora, em e fora de combate, a ordem das
  ativações, maior inelegível com empate, fim do maior, a análise, a condição na linha do vencedor, clássica, G2 e Encontro iguais fora e em
  combate, Aura numérica, auxílio, Aura de Dano com e sem o dado próprio, o Feitiço pelo motor, o Feitiço de um ataque, a Reação de Defesa, o
  Múltiplos Efeitos de Reação e o misto, o arquivo, a biblioteca, a instância, duas viradas, o descanso, o cartão do G2 e o arquivo antigo.
- Os doze focados da lista do Codex: 706 (Pacotes 145, Fonte Externa 52, desempenho 30, preferências 42, operações 51, virada 57, invocações na mesa
  120, Auxiliar ligado 26, métricas do Estilo 43, Novo Estilo 67, ordem de módulos 38, classificação 35).
- Suíte inteira no código final: 223 de 225 (`asserts-depois.txt`). Falham `t-prodigio` e `t-reconciliacao-g00`, as mesmas da linha de base
  (`../pacotes-aliados-20261019/asserts-base.txt`), no mesmo ponto.
- `npx eslint` nos arquivos mexidos sem problema, `npx vite build` aprovado (`build.txt`).
- Roteiro da devolutiva (`browser-devolutiva.mjs`): o do Codex copiado, com os mesmos auxiliares, as mesmas fichas, o mesmo pacote feito por clique
  (dez fontes, a definição à mão de +5 Só em Combate com a origem da Aura do Bastião) e o arquivo realmente baixado e importado, mais os pontos que a
  devolutiva pediu: fora, em e fora de novo no G2 e na clássica, o texto do resultado da ativação, o prazo no detalhe e no cartão do G2 e na linha
  da clássica, o detalhe do cartão ("Termina: Por Um Ataque", "A Ficha Não Conta Este Prazo: Encerre Quando Acabar"), uma virada no G2 e outra na
  clássica sem encerrar o de um ataque, a recarga, o Encerrar e o descanso. 48 de 48 em dev (`browser-5320.json`) e 48 de 48 em produção
  (`browser-5321.json`), em 1024 e 1440. Telas `5320-*.png` e `5321-*.png` (`condicao-fora`, `condicao-fora-de-novo`, `um-ataque`,
  `um-ataque-ativos`, `um-ataque-classica`).
- Percurso da entrega (`e2e-anterior.mjs`, cópia de `../pacotes-aliados-20261019/e2e.mjs` com a saída aqui): 65 de 65 em dev e 65 de 65 em produção.
- Fonte Externa manual (`regressao-fonte-manual.mjs`, cópia do roteiro do G2-I1): 47 de 47 em produção (`regressao-fonte-manual/browser-fonte.json`).
- Uma execução do roteiro da devolutiva em dev, rodada AO MESMO TEMPO que a suíte inteira, falhou uma conferência ("em combate vale o +5" leu a
  Defesa como vazia, sem o número na página). A causa provável, não confirmada, é o servidor de desenvolvimento recarregando a página no meio do
  roteiro. Repetido sozinho logo depois, passou inteiro, e todas as execuções seguintes também. O JSON daquela execução foi sobrescrito pelo
  seguinte, e fica registrado aqui.

### Desempenho (build de produção, `perf-5321.json`)

Chrome local, 1440 x 900, Player 30 Volumoso, três repetições, no bundle `index-BeqttLoe.js`, sem nada rodando junto. Do pointerdown à mudança no
DOM e dois quadros, com as tarefas longas da janela mais 1,5 s.

| Operação | Sem pacote | Biblioteca e oito recebidos ligados |
|---|---|---|
| Abrir a Preparação do Ataque Concentrado e confirmar | 30 a 33 ms, nenhuma tarefa longa | 31 a 32 ms, nenhuma |
| Ativar uma nona opção recebida | | 45 a 52 ms, nenhuma |
| Duas ativações recebidas em sequência | | 2 de 2 ligadas nas três vezes, nenhuma |
| Clássica: abrir a aba Buffs | 31 a 33 ms, nenhuma | 33 a 36 ms, nenhuma |

Uma máquina e uma amostra: não é promessa de ausência universal de tarefa longa.

## O que continua separado

- As oito leituras de regra (as sete do lote e a nova 8) seguem com o autor, sem aprovação implícita por esta correção.
- A separação da entrega não mudou: o que calcula sozinho, o que o suporte configura uma vez, o que é só consulta e o que não tem representação
  estão no relatório da entrega. Só Consulta, PV Temporário por pacote, Permutativo em aliado e o resto sem representação continuam fora.
- Mudanças de tela desta correção, pequenas e sem redesenho: a linha da clássica ganhou o prazo do pacote no rótulo ("De Yuki · Por Um Ataque") e o
  nome tem largura mínima (a menor entre 8rem e 35% da linha), e o cartão do G2 mostra "Um Ataque".

## Para o autor (no máximo cinco tarefas)

1. Abra http://127.0.0.1:5321/Player?ficha-g2=1 com o suporte numa janela normal e o aliado numa janela anônima.
2. No suporte, monte um pacote com a Aura do Bastião e uma Definição à Mão da mesma origem com Defesa maior e Só em Combate. Exporte.
3. No aliado, importe e ative as duas. Fora de combate a Defesa sobe pelo menor, em combate pelo maior, e fora de novo volta ao menor. Confira também
   na clássica (sem `?ficha-g2=1`).
4. Inclua um Feitiço Auxiliar Imediato com Um Ataque. No aliado, avance rodadas: ele fica até você encerrar. Um pacote exportado antes desta
   correção precisa ser exportado de novo.
5. Responda as oito leituras em `docs/a-fazer.md`, PERGUNTAS AO AUTOR, "Pacotes para Aliados: leituras feitas no lote, para confirmar".
