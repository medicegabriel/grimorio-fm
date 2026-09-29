# Condições no Afty

Feito em 2026-09-21, a pedido do autor: *"Vamos programar no Grimorio do Afty e Ficha de Player na
aba de Calculos / Buffs as Condições. Tanto no criador, tanto na Ficha Final. Preciso que você
considere os efeitos númericos delas de maneira automatica e conte as rodadas que faltam para acabar
na Ficha Final."*

Vale para os dois sistemas (criatura em `/Afty` e jogador em `/Player`). A Grimório 2.5.2 não foi
tocada.

## A regra que manda em tudo: condição não acumula com condição

Autor, 2026-09-21: *"CONDIÇÕES NÃO SE ACUMULAM OS EFEITOS. LOGO PARALISADO (-10 DE DEFESA) E
DESPREVINIDO (-3 DE DEFESA) FICA COMO -10 DE DEFESA E NÃO COMO -13"*. O livro diz o mesmo:
*"Condições com os mesmos efeitos não se acumulam, aplique apenas os mais severos. Por exemplo, um
personagem enredado e caído sofre -3 na Defesa, não -5."*

Como o código lê isso:

- **A disputa é por número exato.** Cego dá -5 em Percepção e Envenenado dá -2 em toda perícia:
  Percepção fica em -5 e as outras perícias em -2. O `*` de cada alvo ("toda perícia", "todo TR",
  "todo ataque") é expandido nos ids concretos da ficha antes da disputa, inclusive Ofícios repetidos
  e perícias personalizadas.
- **Penalidade fica com a pior e bônus com o maior**, e os dois somam (Invisível +10 e Envenenado -2
  dão +8 em Furtividade). É a mesma regra do pool exclusivo, aplicada só entre condições.
- **Condição soma com o que não é condição.** Um buff de +2 na Defesa com Paralisado dá -8. Por isso
  as condições NÃO entram no pool exclusivo do Motor, que na criatura é plano.
- **Movimento vale o menor resultado.** Lento e Enredado são a mesma metade (não um quarto), e Imóvel
  zera por cima de tudo.
- **Quem perdeu aparece riscado**, no hover do número e na linha da condição, dizendo por que o -3 do
  Desprevenido não está na Defesa.

## Onde mora

| O quê | Onde |
|---|---|
| Texto do livro, efeitos, disputa | `src/systems/afty/afty-condicoes.js` (`CONDICAO_TEXTOS`, `CONDICAO_EFEITOS`, `resolveCondicoes`) |
| Entrada no número | `afty-derive.js`, bloco "CONDIÇÕES" (efeitos no Motor, movimento, RD, falha automática) |
| RD por tipo e Resistência | `afty-defesas-dano.js`, parâmetro `fragilizado` |
| Aumento de custo em PE | `custoEmPe` (afty-efeitos.js) e os leitores de Feitiço, Domínio Simples e Invocação |
| Bancada do criador | card **Condições** na aba Cálculos, gravado em `combate.condicoes` |
| Ficha Final e Encontro | aba **Buffs**, seção Condições, gravado na sessão (`sessao.condicoes`) |
| Falha automática | aba Perícias da Ficha, marca "Falha" no TR |
| Asserts | `asserts/t-condicoes.mjs` (catálogo) e `asserts/t-condicoes-efeitos.mjs` (número, nos dois sistemas) |

A Ficha troca o `combate` da ficha pelo da sessão, então a bancada do criador nunca vaza para a mesa.
Quando a sessão manda a lista dela (`opcoes.condicoes`), ela vence a da bancada, mesmo vazia.

## O que cada condição faz no número

Só o que o texto escreve como número fixo e sempre valendo. O resto fica no texto do livro, que abre
na linha da condição.

| Condição | Número |
|---|---|
| Abalado | -1 em ataques e perícias |
| Amedrontado | -3 em ataques e perícias |
| Caído | -3 em ataque corpo a corpo, -3 na Defesa, movimento até 4,5m |
| Cego | -5 em Percepção, e inclui Surpreso e Lento |
| Condenado | +1 no custo em PE de todo gasto, depois do piso de 1 PE |
| Desprevenido | -3 na Defesa e em Reflexos |
| Enredado | -2 na Defesa e em ataques, movimento pela metade |
| Envenenado | -2 em ataques, TRs e perícias |
| Fragilizado | toda RD a zero (Geral, Específica, Física, a da Alma e a por tipo), Resistência anulada, Imunidade mantida |
| Imóvel | movimento zero |
| Invisível (Especial) | +10 em Furtividade |
| Lento | movimento pela metade |
| Paralisado | -10 na Defesa, falha automática em Reflexos |
| Inconsciente | inclui Caído, falha automática em Reflexos |
| Sofrendo | -5 em Concentração, -3m de movimento |
| Surdo | -5 na Iniciativa |
| Agarrado | inclui Desprevenido e Imóvel |
| Atordoado | inclui Desprevenido |
| Indefeso (Especial) | inclui Imóvel e Atordoado |
| Surpreso (Especial) | inclui Desprevenido |
| Sangramento | perda de vida pela faixa: Fraco 2d6, Médio 3d8, Forte 4d10, Extremo 6d10 |

Sem número: Aterrorizado, Confuso, Desmembramento, Desorientado, Enfeitiçado, Engasgando, Enjoado,
Exposto.

**Inclusão.** Condição que cita outra a aplica, de forma recursiva (Cego inclui Surpreso, que inclui
Desprevenido). A incluída conta uma vez só: marcada à mão e por inclusão, é a mesma, e o hover diz o
nome direto.

**A Concentração é um TR de Fortitude**, então o -2 do Envenenado já chega nela pela base. O Sofrendo
leva só o que passa disso, e os dois juntos dão -5, e não -7.

**Movimento anda em quadrados de 1,5m**, e a metade arredonda para baixo no quadrado: 15m viram
7,5m, e 10,5m viram 4,5m.

## Na tela: cartão e catálogo (2026-09-22)

O autor, na primeira versão: *"Deixar como uma lista não fala nada sobre nenhuma das condições ou
mostra o que elas fazem."* Duas respostas, iguais na Ficha, no Encontro e na bancada do criador:

- **A condição aplicada é um cartão.** Nome e degrau, o que ela faz no número (com o riscado de quem
  perdeu a disputa), "Inclui Desprevenido e Imóvel" quando ela aplica outras, o `resumo` do que ela
  faz FORA do número ("Sem ações e reações"), e as rodadas. O texto do livro fica no nome: passar o
  mouse, toque longo ou foco na Ficha, e toque no criador.
- **O seletor virou catálogo.** Cada condição com o número e o resumo dela, agrupada pela força, com
  filtro. Tocar aplica com as rodadas do campo de cima, e tocar numa aplicada tira. O Sangramento
  mostra as quatro faixas, e é a faixa que aplica. O `descreveCondicao` monta o texto de cada uma sem
  precisar de ficha.

O `resumo` mora em `CONDICAO_TEXTOS`, ao lado do texto, e é paráfrase curta do livro: ele diz o que a
condição faz e nunca inventa número. O assert de pontuação vale para ele também.

## As rodadas

Na Ficha Final cada condição tem as rodadas que faltam, com botões de menos e mais. O campo vazio ao
adicionar é "sem duração" (o infinito, igual ao buff). A virada de rodada da Ficha desce o número e
tira a condição quando ele zera, e o Descansar tira as que têm duração. No criador não há rodada.

O Sangramento acaba num TR de Fortitude, e não por tempo: nasce sem duração, e a linha tem o botão
**Perda de Vida**, que rola o dado da faixa, grava no histórico e desconta do PV.

## As três Especiais

Indefeso, Invisível e Surpreso ficam fora da lista de níveis, e o livro diz que *"as condições não
especificadas aqui não podem ser aplicadas de nenhuma forma"*. Por isso elas NÃO entram no
`CONDICOES_CATALOGO`, que é o que o editor de Feitiço oferece. A Ficha, o Encontro e a bancada as
oferecem num grupo "Especial" no fim do seletor, porque elas acontecem na mesa (Cego deixa Surpreso).

## Texto do livro

`CONDICAO_TEXTOS` tem o texto do autor, verbatim, com duas trocas de pontuação pela regra de tela
dele: o travessão do Lento virou vírgula, e o ponto e vírgula do Sangramento virou ponto.

## Leituras a confirmar com o autor

Estão em `docs/a-fazer.md`, em "Condições: leituras para confirmar".
