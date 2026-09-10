# Criação de Armas

A régua para inventar a linha seguinte da tabela de armas. Escrita pelo autor ("eu, O Espectro") e
entregue em 2026-09-09, no dia em que o pedido chegou.

> **Addon**: `addons/criacao-de-armas.json`
> **Módulo**: `src/systems/afty/afty-criacao-armas.js` (folha, sem imports)
> **Tela**: `src/systems/afty/ui/BancadaDeArma.jsx`, dentro do card Armas Criadas
> **Provas**: `asserts/t-criacao-armas.mjs` (135 asserts)

---

## O caso

O livro tem uma tabela de armas e nenhuma métrica para a linha seguinte. O texto do autor abre
dizendo exatamente isso:

> *"Armas são um quesito complicado de se avaliar devido a nenhuma métrica para seus custos, dados e
> muito menos para suas propriedades."*

O criador já deixava criar arma própria desde sempre, com dado, margem, custo, espaços e
propriedades livres. O que faltava era a conta. A bancada é essa conta, e ela **não** tira nada do
que já dava para fazer: quem não instala o pacote continua com o editor de antes, campo por campo.

---

## ⚠ A bancada CONTA, e nunca CORRIGE

Esta é a decisão que segura o resto. A bancada lê a arma gravada, soma os Pontos de Criação e
**avisa** quando um limite estoura. Ela não abaixa dado, não devolve propriedade e não mexe em
número da ficha.

É a convenção de todo orçamento do projeto (a Carteira avisa saldo negativo e não o corrige, a aba de
Resistências avisa conflito de estado em vez de escolher um vencedor), e é o que faz este pacote ser
**`permite` puro**: sem `libera`, sem catálogo e sem remendo. Há assert medindo isso com a arma
equipada, comparando `hp`, `pe`, `defesa`, `cd`, `rdGeral`, `movimento`, `iniciativa`, `nd`, o
inventário resolvido e a carga.

**A única escrita** está na arma de técnica, e é decisão do autor. Ver a seção dela.

---

## As cinco decisões do autor (2026-09-09)

Todas vieram por pergunta direta, antes da primeira linha de código.

| Pergunta | Resposta | O que ela custou |
|---|---|---|
| "Tática" é a classe Complexa do livro? | **Sim** | Nenhum campo novo. A bancada lê o `classe` que já existe e troca o rótulo |
| O custo da arma de técnica sai do grau? | **Sim**, e o campo vira mostrador | Um efeito que ESCREVE o custo, e a única escrita do sistema |
| A margem desce abaixo de 18? | **Não**, 18 é o piso | O limite da conta é aparado em duas reduções |
| Qual o efeito da Estabilidade? | **A mesma coisa que a Pesada, só que para Destreza** | Uma propriedade nova no catálogo, e uma conta só para as duas |
| Que dados uma arma criada pode ter? | **Os degraus do Nível de Dano**, sem parar no 2d6 | A lista de seis dados do editor virou a escada do livro |

---

## ⚠ Tática É a Complexa, e por que isso importa

O padrão nomeia duas classificações, Simples e Tática, e o catálogo do livro tem duas classes,
simples e complexa. O próprio texto do autor escreve as duas palavras como sinônimas: a Fatal e a
Mortal dizem *"Só pode ser colocado em armas complexas"*, e não existe classificação com esse nome na
lista dele.

Criar um campo novo faria uma arma ser **Complexa para a proficiência do Lutador e Tática para a
criação**, e as duas leituras divergiriam na primeira arma editada. Então `CLASSIFICACOES_ARMA` usa
o `value` do livro e só troca o `label`, e há assert cobrando que os dois valores sejam exatamente as
classes que o catálogo já usa.

---

## O bolso e os quatro gastos

```
BOLSO   = base da classificação + PC do custo + PC dos espaços + o que a Pesada e a
          Estabilidade rendem
GASTO   = dado de dano + margem de crítico + propriedades + Especial
```

| Classificação | Base | Limite de Propriedades | Limite de Dano | Custo máximo |
|---|---|---|---|---|
| Simples | 8 PC | 6 | 4 | 2 |
| Tática | 12 PC | 8 | 6 | 3 |

* **Dado**: 1 PC por **Nível de Dano**, na escada do livro. 1d4 custa 1, 1d12 custa 5, e `2d6` custa
  os mesmos 5, porque é o mesmo nível escrito de outra forma. O zero é "sem dano", que é onde as
  Faixas ficam.
* **Margem**: 3 PC por redução. O limite é `metade do custo + 1 a cada dois níveis abaixo de 1d12`,
  aparado em duas reduções pelo piso de 18.
* **Propriedades**: o preço de cada uma, na tabela do padrão.
* **Especial**: o que a mesa avaliar, digitado na bancada.

### Os três créditos

* **Custo**: PC igual ao custo, e mais um de limite (em Propriedades ou Dano, à escolha) ao chegar
  no custo 2 e de novo no 4.
* **Espaços**: 1 PC por espaço acima do primeiro, aparado pelo custo, **descontados os espaços que a
  Pesada cobrou**. Sem o desconto o mesmo espaço seria pago duas vezes, que é a piada do prédio nas
  costas escrita no padrão.
* **Pesada e Estabilidade**: 1 PC a cada 4 pontos de Força (ou de Destreza) acima de 10, aparado em
  `custo - 1`. Só a Pesada aumenta o espaço da arma por PC rendido.

### ⚠ Duas Mãos, Pesada e Estabilidade entram no BOLSO das Propriedades

As três são as únicas propriedades de preço negativo, e as três ficam **debaixo do limite de 6 ou
8**, e não fora dele. A razão está na frase do padrão: *"esta propriedade retira PC gastos"*. Retirar
gasto é mexer no bolso onde o gasto está, então uma arma Simples com Duas Mãos consegue 7 PC de
outras propriedades. O total fecha igual dos dois jeitos, e só o limite muda.

---

## ⚠ A escada de dados é o NÍVEL DE DANO, e não uma lista à parte

Esta seção existe porque a primeira versão errou, e o autor achou o erro pela porta certa:

> *"Para que serve a Opção Dano? Sendo que o Dano fica limitado a 2d6 independente"*

A opção de limite do custo 2 e do custo 4 pode ir para Propriedades ou para Dano. Ir para Dano não
comprava nada numa arma Tática, e a causa não era a opção: era a **escada**.

O padrão diz *"o dado de dano da arma subirá em 1 nível"*, e **Nível de Dano é mecânica transcrita do
livro**, em `afty-niveis-dano.js`. Nela o degrau é o RESULTADO MÁXIMO, e a escada não para no 2d6:

```
5 PC  1d12  (ou 2d6, mesma célula da tabela)
6 PC  1d12 + 1d4  (ou 2d8)
7 PC  1d12 + 1d6
8 PC  1d12 + 1d8  (ou 2d10)
9 PC  1d12 + 1d10
10 PC 2d12
```

A bancada cobrava o índice de `ARMA_DADOS`, uma lista de **seis dados escrita à mão** que parava no
2d6. Duas consequências, as duas caladas:

1. **`2d6` custava 6 e `1d12` custava 5**, sendo o mesmo nível. O mesmo dano por dois preços.
2. **Nada acima de máximo 12 existia**, então o limite 6 da Tática não tinha o que comprar, e a opção
   Dano era letra morta ali.

⚠ **A prova de que os limites do padrão foram escritos NESTA escada:** o limite de Dano da Tática é
6, e 6 PC é exatamente `2d8`, que é a **Espada Colossal**, a maior arma corpo a corpo do livro. Com a
lista velha ela era grande demais para a própria classificação dela. Há assert medindo isso contra o
catálogo, e não contra um número escrito à mão.

A lista de seis também não dava conta do próprio livro: a Espada Colossal (`2d8`), o Rifle de
Precisão (`2d10`) e a Bazuca (`3d12`) não podiam ser recriados como arma própria. Hoje `ARMA_DADOS`
**é gerada da escada**, do `1d4` ao `3d12` da Bazuca.

⚠ **O dado impresso do livro continua ACEITO, e não é mais oferecido.** `2d4`, `2d6`, `2d8` e `2d10`
são o mesmo nível escrito de outra forma, e a lista oferece um nome por nível. Mas o saneamento os
aceita, senão toda arma do catálogo e toda arma própria salva antes disto perderia o dano na leitura
seguinte. E o select acrescenta o dado GRAVADO quando ele não está na lista, que é a mesma regra do
chip de tipo de Feitiço: sem isso o campo abriria em branco e a primeira edição trocaria o dado da
arma por acidente.

⚠ **A Fatal e a Mortal NÃO cresceram junto.** Elas dizem *"é especificado um tamanho de dado"*, que é
um dado e não um degrau: a lista delas é `ARMA_DADOS_PROP`, e vai de `1d4` a `1d12`.

⚠ **A lição, que já estava escrita:** a métrica tinha uma função `nivelDoDado` e o
`afty-niveis-dano.js` tinha OUTRA com o mesmo nome, dizendo coisa diferente. É "Regra escrita duas
vezes" outra vez. Hoje a da criação se chama `pcDoDado`, e ela lê a do livro.

---

## ⚠ A Estabilidade é entrada de CATÁLOGO, e não do addon

Ela chegou junto do padrão, em 2026-09-09, e **não está na lista de propriedades do livro**. Mesmo
assim mora em `ARMA_PROPRIEDADES`, ao lado da Pesada, e não dentro do pacote.

A razão é o que ela é: uma propriedade de arma com efeito em jogo, e não uma conta de criação. Quem
não instala o addon continua podendo marcá-la numa arma, exatamente como marca a Pesada, e o escopo
`prop:estabilidade` do Motor passou a existir de graça, porque `escoposDaArma` sai da lista de
propriedades. Guardá-la no pacote faria o contrário: uma arma com Estabilidade gravada perderia a
propriedade calada ao desinstalar, porque o saneamento descarta o que não está no catálogo.

Há precedente no mesmo arquivo, uma linha abaixo: a **Alcance** também não está na lista de
propriedades do livro e está no catálogo, porque aparece na tabela das armas.

O texto do efeito é o da Pesada com o atributo trocado, e nada além disso, o que é literalmente a
resposta do autor: *"Estabilidade é a mesma coisa que Pesada, só que para Destreza"*. Há assert
comparando as duas descrições campo a campo, então mexer numa e esquecer a outra fica vermelho.

**A conta de PC das duas é uma função só** (`creditoDeAtributoExigido`). Duas contas iguais escritas
em dois lugares divergem no primeiro conserto, e a única coisa que as separa é uma tabela de uma
linha: `CREDITO_COBRA_ESPACO`.

---

## A arma de técnica, e a única escrita do sistema

> *"Para cada vez que o usuário subir de grau, o custo de sua arma irá subir em 1. Começando com
> custo 1 no grau 4 e terminando em custo 4 no grau 1. Assim como Receberá o dobro de PC e limites
> provindas deste custo."*

O custo sai do **grau do usuário**, e não do campo: Quarto Grau dá 1, Terceiro 2, Segundo 3 e
Primeiro 4. Do Semi-Grau Especial para cima ele **fica em 4**, que é onde a escada do padrão acaba e
onde o teto de custo de todo item do sistema já estava.

Dobra o PC do custo e dobra o limite extra que ele concede. Uma Tática de técnica no Primeiro Grau
tem 12 + 8 de bolso e 8 + 4 de limite de Propriedades.

⚠ **A técnica passa por cima do custo máximo da classificação.** A Tática para no 3 e a escada de
técnica termina no 4: cobrar os dois deixaria toda arma de técnica de Primeiro Grau avisando para
sempre, sem nada a corrigir.

⚠ **E o custo é ESCRITO na arma, e não calculado na leitura.** É a única coisa que a bancada muda na
ficha, e ela é resposta ao pedido do autor de o campo virar mostrador. O motivo de escrever em vez de
só mostrar: o `custo` é campo da arma e conta no orçamento de equipamento do grau, então calcular só
dentro da bancada deixaria a ficha com **dois números chamados Custo**, o gravado e o da bancada. A
escrita acontece num efeito do editor, converge numa passada e só toca em arma que a pessoa marcou
como de técnica.

---

## O que a bancada avisa

Doze avisos, cada um com o caso negativo medido no assert. Nenhum deles corrige nada.

| Aviso | Quando |
|---|---|
| Gasto acima dos PC | o total estourou o bolso |
| Dano acima do limite | o dado passou do limite da classificação |
| Propriedades acima do limite | a soma das marcadas passou |
| Margem além do limite | mais reduções do que a conta permite |
| Custo acima do máximo | arma comum acima do custo da classificação |
| Fatal ou Mortal na Simples | as duas só entram em arma Tática |
| Fatal ou Mortal com dado fora | o padrão só precifica 1d8 e 1d12 |
| Alcance fora do arremesso | *"Só pode ser pego em armas de arremesso"* |
| Alcance ou Arremessável além do custo | o limite de PC das duas é o custo |
| Pesada ou Estabilidade sem render | o custo apara as duas em `custo - 1` |
| Pesada sem os espaços | cada PC rendido por ela pede um espaço |
| Espaços além do custo | o rendimento é aparado |
| Modular sem tipo físico | *"adiciona uma opção de dano FÍSICO"* |
| Especial sem avaliação | a mesa ainda não deu o preço |
| Propriedade sem preço | Emperrar, Recarga e o que um Addon inventar |

---

## ⚠ O módulo é FOLHA, e o preço disso são os espelhos

`afty-criacao-armas.js` não importa nada, porque o `afty-equipamentos.js` o chama no saneamento da
arma e um import de volta fecharia o ciclo que deixou o app em tela branca em 2026-09-02 (ver
`asserts/t-ordem-modulos.mjs`).

O preço é que quatro tabelas do livro aparecem lá como cópia: a escada de dados, a faixa de crítico,
o teto de custo e os tipos de dano físicos. **Cada uma é comparada com a original no assert**, pela
mesma razão que a tabela de XP da Carteira é: cópia sem assert envelhece calada.

A lista de físicos ainda entra por opção (`tiposFisicos`), porque um Addon pode acrescentar um tipo
físico que o espelho não conhece, e a tela passa a lista viva.

---

## Onde a métrica mora na arma

O que o padrão precisa e a arma do livro não guarda vive em `creature.armasCustom[].criacao`:

```js
{ tecnica, especialPc, especialTexto, bonus2, bonus4 }
```

⚠ **O campo só nasce quando alguém mexe na bancada**, e **não some quando o addon sai**. É a regra da
Carteira: uma ficha que perdeu o pacote não pode devolver zero e deixar a pessoa achar que o trabalho
dela sumiu. Reinstalar mostra tudo de volta.

Todo o resto do gasto é derivado da própria arma. Dado, margem, propriedades, espaços e custo já
eram campos, e a bancada os LÊ: é isso que faz a arma continuar editável pelos controles que sempre
existiram, e que impede a ficha de ter duas verdades sobre a mesma arma.

---

## O que ficou de fora

* **A segunda opção de Modular.** *"Cada 1 PC adiciona uma opção de dano físico"*, e o modelo de arma
  guarda **uma** só. A bancada cobra 1 PC e o campo aceita um tipo. Entrada em `a-fazer.md`.
* **O texto do traço Especial fora da bancada.** Ele é gravado e mostrado ali, e não aparece na linha
  do inventário nem na Ficha Final, onde o texto especial vem do catálogo do livro pelo id. Entrada
  em `a-fazer.md`.
* **Armas de fogo**, por escrito no padrão: *"Não farei para armas de fogo porque ainda não é
  necessário"*. Emperrar e Recarga continuam marcáveis e avisam que estão fora do padrão, em vez de
  fingir um preço.

---

## Onde está

| Peça | Arquivo |
|---|---|
| As tabelas e as contas | `src/systems/afty/afty-criacao-armas.js` |
| A bancada | `src/systems/afty/ui/BancadaDeArma.jsx` |
| O portão, o editor e o efeito do custo | `src/systems/afty/AftyCreatureBuilder.jsx` (`ArmaCustomEditor`) |
| Primitiva `criacaoArmas` | `src/systems/afty/afty-addons.js` |
| O bloco `criacao` no saneamento | `src/systems/afty/afty-equipamentos.js` (`saneiaArmaCustom`) |
| O pacote | `addons/criacao-de-armas.json` |
| As provas | `asserts/t-criacao-armas.mjs` |
