# Carteira

O livro-caixa das sessões da Guilda: quanto de XP, de dinheiro e de Interlúdios cada sessão rendeu,
o que já saiu, e os totais. Escrito em 2026-09-08, no dia em que o pedido chegou.

> **Addon**: `addons/carteira-da-guilda.json`
> **Módulo**: `src/systems/afty/afty-carteira.js` (folha, sem imports)
> **Tela**: `src/systems/afty/AftyTabCarteira.jsx`
> **Provas**: `asserts/t-carteira.mjs` (136 asserts)

---

## O caso

O autor já mantinha isso numa planilha de Google Sheets, e mandou a imagem dela junto do pedido:

> *"Preciso de o Addon de uma aba chamada 'Carteira' aonde: Nome; Xp; $; Interludios; Tipo. Ela
> serve para anotar o XP, Interludios e Dinheiro recebido em Sessões da Guilda. [...] E preciso de
> uma aba para XP Total, Dinheiro Atual e Total e Interludios Totais"*

A planilha tem três blocos: **Entrada de Recursos** (uma linha por sessão), **Controle de
Transações** (o que saiu) e uma coluna de totais entre as duas, sempre à vista. A aba reproduz os
três, e as três decisões que faltavam foram perguntadas antes de escrever qualquer linha.

---

## As quatro decisões do autor

| Pergunta | Resposta | O que ela custou |
|---|---|---|
| Os Interlúdios anotados alimentam o contador de Focos? | **Sim** | O addon deixou de ser só `permite` e ganhou um `libera` |
| A Carteira registra o que SAI? | **Sim, duas listas** | Sem ela o "Atual" seria sempre igual ao "Total" |
| Onde ficam os totais? | **Faixa grudada no topo** | É a coluna do meio da planilha, e não uma segunda aba |
| O XP interfere no Nível? | **Sim, por tabela** | Uma segunda liberação, e a que mexe em mais coisa no sistema |

---

## ⚠ O addon tem DUAS metades, e elas são campos diferentes

Esta é a parte que importa para quem for mexer aqui depois.

```jsonc
{
  "permite": ["carteira"],                          // TELA: abre a aba. Não move um número.
  "libera":  ["carteiraFocos", "carteiraNivel"]     // REGRA: Interlúdios viram Focos, XP vira Nível.
}
```

As duas liberações são **separadas de propósito**: uma mesa pode querer o livro-caixa alimentando só
os Focos, só o Nível, ou nenhum dos dois.

A separação entre `permite` e `libera` está escrita em `afty-addons.js`, e a Carteira é o caso mais
limpo dela até hoje: a **mesma funcionalidade** tem uma metade que só desenha e uma metade que muda
número, e as duas viajam em campos separados no mesmo pacote.

O `t-carteira.mjs` mede a promessa nos dois sentidos. Com o pacote **sem** o `libera`, e com a
Carteira **cheia**, a ficha deriva idêntica à raw em `hp`, `pe`, `defesa`, `cd`, `rdGeral`,
`movimento`, `iniciativa`, `nd` e `focosTotais`. Com as liberações ligadas, mudam os dois últimos,
e o `nd` arrasta o resto do sistema junto.

**Tirar as duas entradas de `libera` do JSON transforma a Carteira em caderno puro**, sem tocar em nada da ficha.
É a configuração para quem quer só anotar.

---

## O XP vira Nível

Tabela do autor, entregue em 2026-09-08 com três colunas. **Só a primeira virou código.**

⚠ **As outras duas já existiam no sistema, e concordam com ele linha por linha.** O "+N" é a
`maestria(nd)` do `afty-derive.js` (sobe em 5, 9, 13, 17, 21 e 26) e o Grau é o
`AFTY_GRAUS_CRIATURA` do `afty-equipamentos.js` (Terceiro no 5, Segundo no 9, Primeiro no 13,
Semi-Grau Especial no 17). Copiá-las para o addon criaria uma segunda tabela para a mesma regra, e
aí uma errata teria dois donos. O `t-carteira.mjs` compara as duas com a tabela do autor escrita à
mão, então uma divergência futura aparece no assert em vez de aparecer numa ficha.

| XP | Nível | | XP | Nível | | XP | Nível |
|---|---|---|---|---|---|---|---|
| 0 | **3** | | 90 | 12 | | 300 | 22 |
| 10 | 4 | | 110 | 13 | | 330 | 23 |
| 15 | 5 | | 125 | 14 | | 360 | 24 |
| 20 | 6 | | 140 | 15 | | 390 | 25 |
| 30 | 7 | | 160 | 16 | | 430 | 26 |
| 40 | 8 | | 180 | 17 | | 470 | 27 |
| 50 | 9 | | 200 | 18 | | 510 | 28 |
| 60 | 10 | | 220 | 19 | | 550 | 29 |
| 75 | 11 | | 240 | 20 | | 600 | **30** |
| | | | 270 | 21 | | | |

Três regras de leitura, todas com assert:

* **Zero de XP é o Nível 3**, e não o 1. Autor: *"Sempre começamos com 0 de XP no Nível 3"*. Por
  coincidência feliz, é o mesmo piso que o campo de Nível da ficha de criatura já tinha.
* **O XP da linha já dá o nível dela.** 10 de XP é Nível 4, e não "quase".
* **XP quebrado não sobe.** Com 9,5 o nível é 3, porque meio ponto não é o ponto que falta.

Acima de 600 o nível para em 30, que é onde a tabela acaba e onde a Ficha de Jogador já tinha teto.

Na tela, o campo de Nível vira mostrador enquanto a liberação estiver ligada: deixá-lo digitável
aceitaria um número que a próxima derivação joga fora.

⚠ **E AO SALVAR, O `core.nd` GRAVADO É O EFETIVO.** Isto mudou no fim de 2026-09-08, e a razão é a
Tela Inicial: o card do Dashboard escreve `creature.core?.nd` direto, e o Dashboard é da 2.5.2, que é
**somente-leitura**. Ele não importa nada do Afty e não tem como aprender a perguntar ao
`nivelDaFicha`. Como o campo é a única coisa que ele lê, é o campo que precisa estar certo na hora de
gravar. É o mesmo padrão do `stats` que o `handleSave` já escrevia: tela compartilhada lê fotografia
gravada, e não derivado que ela não sabe calcular.

Quem grava é o próprio `nivelDaFicha(draft)`, e não um `if` escrito no `handleSave`: sem a liberação
ele devolve o próprio `core.nd`, então a ficha que não usa a Carteira não é tocada.

⚠ **O preço, deliberado:** o campo deixa de guardar o número digitado antes de instalar o addon.
Desinstalar passa a devolver o **último nível que o XP pagou**, e não o valor fóssil de antes. É o
mais útil dos dois: enquanto o addon está ligado o campo é um mostrador que ninguém consegue editar,
então o que estava lá não era uma escolha guardada, era uma sobra.

⚠ **Ficha já salva mostra o nível velho até ser salva de novo**, exatamente como o `hpMax` do
`stats`. Abrir e salvar resolve.

⚠ **Esta liberação mexe em mais coisa que qualquer outra do projeto.** O Nível é a entrada de quase
toda fórmula do Afty, então o XP anotado passa a decidir Maestria, Grau, PV, PE, orçamentos e limites
de atributo. É a razão de o `resolveCarteira` ter subido para o topo do `deriveAfty`: ele precisa
estar pronto antes da primeira linha que lê o nível.

### ⚠ O defeito de meia funcionalidade, e o `nivelDaFicha`

A primeira versão desta liberação foi escrita **só dentro do `deriveAfty`**, e o autor achou o
buraco no mesmo dia, em duas frases:

> *"eu não consigo colocar Nível de Especialização, mesmo com meu XP me deixando Nível 8"*
> *"Meus pontos de atributo também não aumentaram"*

Os dois eram o mesmo defeito. **Onze lugares do sistema liam `creature.core.nd` cru**, sem passar
pelo derive: `resolveEspecializacoes`, `resumoAtributos`, o Alto Nível, os Treinos Especiais, o grau
do equipamento, as escolhas de origem e três leituras da própria tela. Pior, a UI chama vários deles
com o **rascunho**, que nunca vê o derive. O nível novo chegava ao PV e à Maestria, que saem do
derive, e não chegava a orçamento nenhum, que sai dos catálogos.

O conserto é um leitor só: **`nivelDaFicha(creature)`**, em `afty-addons.js`. Ele junta as duas
metades da pergunta ("qual o campo" e "esta ficha usa a tabela?"), aceita o rascunho, e hoje é o
único lugar do sistema que lê `core.nd`. O `deriveAfty` é mais um cliente dele.

Três asserts prendem isso, e o terceiro é o que impede a volta:

1. **Equivalência**: uma ficha com a Carteira ligada deriva **igual** a uma ficha digitada naquele
   nível, em `nd`, Maestria, Grau, PV, PE, Defesa, CD, movimento, iniciativa, orçamento de perícias,
   Especialização e pontos de atributo. Um assert de valor solto passaria com metade do sistema
   ainda lendo o campo antigo.
2. **Contraprova**: no Nível 3 os mesmos orçamentos são menores, senão dois zeros iguais passariam.
3. **Varredura**: nenhum `.js` do Afty pode conter `core.nd` fora de comentário, com uma exceção
   nomeada, o próprio `nivelDaFicha`.

⚠ **A lição, que vale para a próxima**: trocar a FONTE de um número não é a tarefa inteira. Falta
procurar quem mais lê aquele número, e o `grep` custa dez segundos. É a mesma forma do erro que
abriu o campo `permite` em 2026-08-20, escrito em `docs/afty-addons.md`: acrescentar o verbo ao
motor não era a tarefa inteira.

---

## Os Focos: substituir, e não somar

```js
const baseFocos = carteiraAlimentaFocos
  ? carteira.interludios
  : (ehJogador("focosLivres") ? focosLivres : nd);
const focosTotais = baseFocos + canal("focos");
```

Três coisas de uma vez, e nenhuma é acidente:

1. **A Carteira SUBSTITUI a base.** Somar cobraria o mesmo Interlúdio duas vezes, uma pelo ND e
   outra pela anotação. Numa criatura de ND 20 com 9 Interlúdios anotados, o total é **9**. Se algum
   dia isso virar 29, alguém trocou o `?:` por um `+`.
2. **A Carteira vence o campo digitado do jogador.** Na Ficha de Player o total de Focos é um campo
   que o mestre preenche. Com o addon, o campo **sai da tela**: deixá-lo aceso mostraria um número
   que a próxima derivação joga fora, que é a pior forma de mentir na tela.
3. **O canal `focos` continua entrando por cima nos três casos.** Uma habilidade que concede Foco
   não pode virar letra morta por causa de um addon de anotação.

Carteira vazia com a liberação ligada dá **zero** Foco, e é o certo: quem não anotou Interlúdio
nenhum não ganhou Interlúdio nenhum.

---

## ⚠ A vírgula do teclado brasileiro

O autor digita dinheiro como `1.050,00` e XP como `10,5`. Um `input[type=number]` devolve **string
vazia** quando o que está escrito nele não casa com o formato que o navegador espera, e a vírgula
cai nesse caso em boa parte das combinações de navegador e idioma: o valor sumiria enquanto se
digita.

Por isso os campos de XP e de dinheiro são `type="text"` com `inputMode="decimal"`, e quem
interpreta é o `numero()` do módulo:

| Digitado | Lido | Por quê |
|---|---|---|
| `10,5` | 10.5 | tem vírgula, a vírgula é o decimal |
| `1.050,00` | 1050 | tem vírgula, os pontos são milhar |
| `1.5` | 1.5 | sem vírgula, o ponto é o decimal, como em JS |
| `1050` | 1050 | número puro |
| `abc`, `""` | 0 | campo vazio vale zero, e nunca NaN |

**⚠ Resta um caso ambíguo, e ele fica assumido:** `1.050` sem vírgula nenhuma é lido como **1,05**.
Não há como distinguir milhar de decimal aí sem adivinhar, e adivinhar erraria o outro lado. Quem
escreve mil e cinquenta digita `1050` ou `1.050,00`, e os dois caem certos.

O Interlúdio é inteiro e continua `type="number"`, porque não passa por nada disso.

---

## O que a lista aceita, e o que ela recusa

| Campo | Regra | Razão |
|---|---|---|
| XP, $ e Interlúdios da **Entrada** | aceitam negativo | É o único lugar onde cabe correção de XP e de Interlúdio, porque não existe lista de gasto para os dois |
| Valor do **Gasto** | aparado em zero | Gasto negativo é entrada de dinheiro, e a lista de entradas está logo acima |
| Dinheiro atual negativo | **avisa**, e nada é corrigido | Convenção de todo orçamento do projeto: reporta, não remove |
| Linha com tipo desconhecido | fica, com os números valendo | O tipo é etiqueta e não decide conta nenhuma |

⚠ **A última é o CONTRÁRIO da Loja de Catarse, e de propósito.** Lá, família desconhecida vira linha
morta e riscada, porque a família decide o **canal** em que a compra vira vaga e uma família que
ninguém conhece não tem para onde ir. Aqui o tipo não decide nada: apagar a linha por causa dele
jogaria dinheiro fora por um rótulo. O que estava gravado é preservado em `tipoCru`, e a tela o
mostra no `title`.

---

## Filtro, ordem e alinhamento

Tudo desta seção é da segunda rodada, no mesmo 2026-09-08.

**Os tipos de sessão são**: Sem Tipo, Jogada, Mestrado, Domingo, Transferência, Staff e Outros.
**Bônus Externos saiu.** A ficha que já tinha `externo` gravado não perde nada: a linha fica, os
números dela valem, o tipo cai no neutro, o valor antigo vai para `tipoCru` e o extrato avisa. É
exatamente para isso que o tipo desconhecido nunca matou a linha.

**As duas listas filtram** por tipo (chips) e por texto (busca sem acento, olhando Nome e Fonte),
com o contador `visíveis / total` e um `X` que só aparece quando há o que limpar. Mesmo desenho do
`FiltroDeHabilidades`, copiado e não importado porque aquele componente é casado com os eixos de
efeito de habilidade.

⚠ **O filtro não encosta em total nenhum.** Os cinco números da faixa somam a ficha inteira, porque
respondem "quanto eu tenho" e não "quanto aparece agora". Um total que mudasse junto com o filtro
seria a forma mais fácil de alguém ler o saldo errado.

**As duas listas reordenam arrastando**, pela pega da primeira coluna, com os mesmos sensores da aba
de Perícias (`distance: 6`, para o clique seco continuar sendo clique num campo de digitar).

⚠ **`moverNaCarteira` é por ID, e não por índice**, e é isso que faz o arraste continuar correto
**com o filtro ligado**: na lista filtrada o índice da tela não é o índice da ficha. Por id, "põe A
onde B está" é a mesma frase nas duas, e as linhas escondidas guardam a posição relativa delas.

⚠ **Não há `DragOverlay` aqui, e na aba de Perícias há.** Não é esquecimento: a linha de Perícias é
uma caixa própria, e esta é um conjunto de trilhas de uma grade, então uma cópia flutuante nasceria
sem as colunas e com outra largura. O que segue o cursor é a linha de verdade, com um anel roxo.

**A aba veste a roupa da aba de Resistências.** A faixa de totais era uma tira `slate-950/95`, uma
cor que não existe em mais lugar nenhum do criador, e o autor apontou que saltava aos olhos. Agora
ela é o `PilhaRd` de lá: fundo do próprio card, e o escuro só dentro dos ladrilhos, com o rótulo
pequeno em cima e o número embaixo. Ela continua grudando no topo, e continua opaca, senão a lista
passaria por baixo dos números ao rolar.

Junto vieram outros dois consertos do mesmo dia. Os chips do filtro passaram a ser o `BoolChip` do
projeto: a versão anterior copiava o chip do `FiltroDeHabilidades`, que é `bg-slate-900` quando
desligado, e que dentro de um card `bg-slate-900` ficava da cor exata do que estava atrás dele. E o
botão de acrescentar linha virou o mesmo do "Nova perícia", com o roxo de acento, porque cinza sobre
cinza lia como texto desligado em vez de ação.

⚠ **Não há mais `overflow-x-auto` na lista.** A primeira versão dava largura fixa em `rem` a cada
coluna e punha um `min-w` embaixo de um `overflow-x-auto`, para a linha nunca embrulhar. A soma
passava da caixa em boa parte das telas e o navegador desenhava uma barra de rolagem horizontal, que
o autor pediu para tirar. As colunas do meio agora são `minmax(0, Nfr)`: a soma é sempre a largura
disponível, elas encolhem juntas, e a linha continua sendo uma linha. O `minmax(0, ...)` não é
enfeite, porque o mínimo automático de uma trilha `fr` é o conteúdo dela, e um `<select>` com
"Transferência" dentro se recusaria a encolher.

⚠ **O arraste anda só na vertical**, por um modificador de uma linha (`{ ...transform, x: 0 }`) e
não pelo `@dnd-kit/modifiers`, que não é dependência deste projeto. Sem ele a linha saía pela
direita enquanto estava na mão, e era a segunda origem da barra de rolagem.

**Alinhamento:** XP, $, Inter. e Tipo alinham pelo **centro**, rótulo e valor. É a regra da tela
desde a aba de Defesas, e alinhar pela borda falha aqui, onde "Inter." é várias vezes mais largo que
o "4" embaixo dele. O `<select>` perdeu o chrome nativo (`appearance-none` mais a seta do lucide a
8px da borda) por duas razões do autor: a seta nativa é colada na borda e não sai de lá por CSS, e o
chrome nativo era o que fazia a caixa sair de outra altura que os campos vizinhos. O padding do
select é simétrico, senão o texto centrado cairia 10px à esquerda do centro real.

---

## O arredondamento aqui é de CENTAVO

Todo arredondamento do Afty é `floor`. Este não é, e a exceção é declarada: a regra do floor vale
para fórmula de sistema (metade de nível, bônus por patamar), e não para somar dinheiro que a pessoa
digitou. `floor` num extrato comeria os centavos de cada total.

Os totais fecham em duas casas, senão `0.1 + 0.2` chegaria à tela como `0.30000000000000004`.

---

## Onde está

| Peça | Arquivo |
|---|---|
| Modelo, saneamento e as contas | `src/systems/afty/afty-carteira.js` |
| A aba | `src/systems/afty/AftyTabCarteira.jsx` |
| Primitiva `carteira` e liberação `carteiraFocos` | `src/systems/afty/afty-addons.js` |
| `creature.carteira` | `src/systems/afty/afty-schema.js` |
| `derived.carteira` e os Focos | `src/systems/afty/afty-derive.js` |
| A aba na fileira, o `patchCarteira` e o contador de Focos | `src/systems/afty/AftyCreatureBuilder.jsx` |
| `moedaBr` e `decimalBr` | `src/systems/afty/ui/formato.js` |
| O pacote | `addons/carteira-da-guilda.json` |
| As provas | `asserts/t-carteira.mjs` |

O extrato é calculado **mesmo sem o addon instalado**. O portão é de tela: uma ficha que perdeu o
addon não pode devolver zero e deixar a pessoa achar que as linhas dela sumiram. É a mesma regra da
Concessão do Mestre, que continua valendo sem a primitiva permitida.

---

## O que ficou de fora

* **A coluna "Mestre" da planilha.** A imagem tem `Nome | Mestre | XP | $ | Inter. | Tipo`, e o
  pedido escrito lista cinco colunas, sem ela. Seguiu o pedido escrito. Acrescentá-la é um campo de
  texto a mais na linha e uma coluna na régua `GRADE_ENTRADA`.
* **A Carteira na Ficha Final.** Ela vive só no criador, como a Loja de Catarse. Dinheiro gasto no
  meio da mesa não tem por onde entrar sem passar pela sessão, e sessão é outro mecanismo.
* **Vínculo entre a Carteira e a Loja de Catarse.** São duas moedas de mesa diferentes e nenhuma
  compra a outra.
