# Criação de Equipamentos

O guia "Criação de Equipamentos e Itens 2.5.2", entregue pelo autor em 2026-09-14. Ele abre com
*"Abaixo estaremos explicando como criar equipamentos para a versão 2.5.2. Essa mecânica é baseada no
guia de criação da 2.5.5, disponibilizado por Afty, Camelo e Parker."*

> **Fonte**: `docs/afty-criacao-equipamentos-fonte.md`, cópia do arquivo original sem mudança nenhuma.
> Todo texto de regra das próximas fases sai de lá.
> **Addon**: `addons/criacao-de-equipamentos.json`
> **Módulos**: `src/systems/afty/afty-criacao-equipamentos.js` (fase 1, folha),
> `afty-criacao-equipamentos-armas.js` (fase 2), `afty-criacao-equipamentos-itens.js` (fase 3, folha),
> `afty-talisma-apice.js` (folha) e `afty-criacao-equipamentos-encantamento.js` (fase 4, folha)
> **Telas**: `ui/EquipamentosCriados.jsx` (fases 1 e 3), `ui/BancadaDeNiveis.jsx` (fase 2) e
> `ui/BancadaDoEncantamento.jsx` (fase 4), na aba Equipamentos
> **Provas**: `asserts/t-criacao-equipamentos.mjs` (93), `t-criacao-equipamentos-armas.mjs` (113),
> `t-criacao-equipamentos-itens.mjs` (121) e `t-criacao-equipamentos-encantamento.mjs` (78)
> **Perguntas e respostas**: `docs/afty-criacao-equipamentos-decisoes.md`

---

## As decisões de escopo (autor, 2026-09-14)

| Pergunta | Resposta |
|---|---|
| Que sistema? | **Os dois.** Na criatura a Defesa do uniforme e o dado da arma seguem as regras dela (ver abaixo) |
| E a Criação de Armas (Pontos de Criação)? | **Convivem, e não ligam juntas** na mesma ficha |
| Addon ou regra de toda ficha? | **Addon por enquanto.** Vira regra quando o autor testar e conferir |
| O texto com erros de digitação? | **Transcrito como está.** O autor pede a correção quando achar |

---

## As quatro fases

O guia tem cinco blocos, e eles foram ordenados do mais barato para o mais caro.

| Fase | Bloco | Estado |
|---|---|---|
| 1 | Revestimentos e Escudos | **feita em 2026-09-14** |
| 2 | Armas (Custo e Níveis de Dano), com as Propriedades Especiais | **feita em 2026-09-14** |
| 3 | Itens de Custo, e o Talismã do Ápice | **feita em 2026-09-14** |
| 4 | Encantamento de Grau Especial | **feita em 2026-09-14**, com três trechos guardados para revisão |

## Organização da aba Equipamentos

O Catálogo vem antes de todas as bancadas de criação. Armas, Revestimentos, Escudos, Acessórios Únicos
e Itens de Custo ficam juntos depois dele, mostram a quantidade no cabeçalho e nascem recolhidos.
**Abrir** revela uma bancada; o botão **Novo** correspondente também a abre e já acrescenta o item.
Assim a criação continua acessível sem ocupar permanentemente a passagem principal da aba.

A lista de Acessórios é estável e ocupa toda a largura do cartão, em duas colunas quando houver espaço.
Há um único editor para o acessório selecionado, sempre depois da lista. Trocar a seleção não insere
conteúdo entre as linhas nem desloca os acessórios seguintes.

⚠ **As armas do livro não cabem na métrica de armas.** Medido em 2026-09-14: só 15 das 46 armas com
dado batem com a tabela de Custo e Níveis de Dano. É régua para criar arma nova, e não serve para
conferir o catálogo.

---

## ⚠ Ao contrário da bancada de Pontos de Criação, esta tabela DECIDE o número

A bancada de `afty-criacao-armas.js` conta uma arma que a pessoa já podia escrever campo por campo, e
por isso é `permite` puro. Aqui a ficha grava só o **Custo** e a **troca**, e todo número sai das contas
na leitura: Defesa, RD, penalidade, dado e espaços. Um número que muda a ficha é regra, e por isso o
pacote é **`libera`**, no molde dos Acessórios Únicos da Benção do Grão Mestre da Forja.

Não existe número gravado que possa discordar da tabela, e não existe campo de Defesa para digitar.

---

## Fase 1: Revestimentos

> *"Diferente das Armas, Revestimentos e Armaduras são equipamentos com uma criação mais fácil, podendo
> variar por custo e penalidade. Por padrão, todo Revestimento e Armadura recebe uma penalidade igual
> ao (Valor do Bônus de Defesa do Revestimento - 2) a suas perícias de Destreza."*

| Custo | Defesa | Penalidade | Espaços |
|---|---|---|---|
| 1 | 2 | 0 | 0 |
| 2 | 4 | -2 | 2 |
| 3 | 6 | -4 | 4 |
| 4 | 8 | -6 | **6** |

Defesa e penalidade são a tabela do guia. Os espaços não estão no guia: o 0, 2 e 4 são os do Leve,
Médio e Robusto do livro, e o 6 é do autor (*"Custo 4 vira 6 Espaços, seguindo o padrão de subida"*).

⚠ **Os Custos 1 a 3 são exatamente o Revestimento Leve, o Médio e o Robusto do catálogo**, número a
número, e há assert medindo. É o que sustenta completar o Custo 4 seguindo o degrau.

### A troca de um degrau

> *"Como o Revestimento Sob Medida, você também pode adicionar efeitos especiais, podendo adicionar +no
> em uma Perícias ou RD(Especifico), com um máximo de +2 por Perícia ou RD, sacrificando o aumento de
> Defesa que você receberia ao aumentar o custo."*

O texto não diz quanto de Defesa cada bônus custa. As respostas do autor, por pergunta:

| Pergunta | Resposta |
|---|---|
| Quanto custa? | *"Consome 2 de Defesa para adicionar +2 em duas pericias / rd. Logo um Custo 4 poderia ter 6 de Defesa e -4 de Penalidade e +2 em Atletismo e RD"* |
| Quantos degraus? | **Um só** por Revestimento |
| Que RD? | **RD por Tipo** (canal `rdTipo`), contra um dos tipos de dano |
| Os espaços mudam? | **Não**, seguem o Custo |
| E na criatura? | **Custo menos o degrau** |

Consequências que saem das respostas, e não de leitura nova:

- A troca começa no **Custo 2**. O Custo 1 não tem "aumento de Defesa" para trocar.
- A **penalidade sai da Defesa que sobrou**, que é o que o exemplo do autor mostra (Custo 4 com troca
  fica com -4).
- As duas escolhas **não se repetem**: *"com um máximo de +2 por Perícia ou RD"*. Duas RD por Tipo
  contra tipos diferentes podem.
- Na ficha de **criatura** a Defesa do uniforme é o Custo (divergência `defesaUniforme`), e a troca
  desce 1. É o que o Sob Medida do livro já faz lá: Custo 2 e Defesa 1.

⚠ **O Sob Medida do livro não é um Revestimento criado.** No jogador ele é Custo 2 com Defesa 1, e um
Revestimento criado de Custo 2 com a troca fica com Defesa 2. Os dois continuam existindo, cada um com
o seu número: o do catálogo é texto do livro e o criado é a conta do guia.

### Onde a troca soma

As duas escolhas viram linhas do Motor em `efeito.motor` da entrada, que o `resolveEquipamentos` já lê
de toda modificação de uniforme: `bonusPericia` com a perícia no alvo, ou `rdTipo` com o tipo de dano
no alvo, as duas com `+2`. A **escolha sem alvo fica na ficha e não vira efeito**, porque ela é o
seletor que a pessoa acabou de abrir.

---

## Fase 1: Escudos

> *"Escudos seguem as mesmas regras dos Revestimentos e das Armaduras. O Custo 1 de Escudo, no entanto,
> possui uma regra diferente do Custo 1 de Revestimento, no qual deve ter penalidades aplicadas desde o
> início."* e *"Escudos, por padrão, diferente dos Revestimentos, não podem ter efeitos especiais
> aplicados neles."*

| Custo | RD | Penalidade | Dado | Espaços |
|---|---|---|---|---|
| 1 | 2 | -1 | 1d4 | 2 |
| 2 | 4 | -2 | 1d6 | 2 |
| 3 | 6 | -4 | 1d8 | 2 |
| 4 | 8 | -6 | **1d10** | 2 |

RD e penalidade são a tabela do guia. O dado não está no guia: o autor escolheu seguir o livro (Leve
1d4, Médio 1d6, Pesado 1d8) e fechar o Custo 4 em **1d10**, de **Impacto** como todo escudo do livro. Os
2 espaços são a regra geral de carregamento.

⚠ **Os Custos 1 a 3 são o Escudo Leve, o Médio e o Pesado do catálogo**, com o dado junto, e há assert
medindo.

⚠ **A coluna do guia se chama "RD(Física)"**, e o destino continua sendo do sistema: RD Física no
jogador e RD Geral na criatura (divergência `rdEscudoFisico`). O escudo criado entra no mesmo
`rdEscudo` de todo escudo, então nada precisou saber que ele é criado.

---

## Onde mora na ficha

```js
creature.revestimentosCriados = [{ id: "revc_...", nome, custo, troca, escolhas: [{ tipo, alvo }] }]
creature.escudosCriados       = [{ id: "escc_...", nome, custo }]
```

- Saneados na **leitura**, sem id repetido, e injetados no catálogo pela `catalogoDoTipo`, que é por onde
  a arma criada e o Acessório Único já chegam ao inventário, ao resolvedor e à Ferramenta Amaldiçoada.
- A entrada tem o **formato do catálogo** (`defesa`, `defesaCriatura`, `penalidade`, `espacos`,
  `efeito.motor` no uniforme, e `rdEscudo`, `dano`, `ocupaMao` no escudo). É isso que dispensou verbo
  novo no motor.
- Criar no card **não põe no inventário**, e o item entra desequipado, como no Acessório Único. O
  cabeçalho avisa "Sem o Addon", "Fora do Inventário" ou "Desequipado".
- Apagar leva junto a entrada do inventário.

### ⚠ Sem o Addon

O item continua no catálogo e no inventário, **marcado como equipado**, e para de entrar em qualquer
efeito: Defesa, RD, penalidade, bônus da troca e Ferramenta. Os espaços e o custo continuam contando,
porque ele continua carregado. A entrada resolvida leva `semAddon: true`.

Tirá-lo do catálogo faria a entrada virar "equipamento desconhecido", e a pessoa perderia o nome do
que tinha. E o `equipado` da entrada não pode ser zerado junto, porque o interruptor da linha lê esse
campo e escreveria o contrário no clique seguinte.

As duas liberações são **independentes**: um pacote que libere só `escudosCriados` deixa o
Revestimento gravado sem contar.

---

## ⚠ Não liga junto com a Criação de Armas

O pacote declara `"incompativeis": ["criacao-de-armas"]`, e a trava é simétrica: basta um dos dois
declarar. A regra do campo está em `docs/afty-addons.md`. As duas bancadas mexem na mesma arma criada
com contas diferentes, e é por isso que não ligam juntas.

---

## Fase 2: Armas

> *"Ao criar uma Arma, você definirá seu custo, a qual define seu Dano base, seu tipo de Dano, o qual
> deve ser Físico e pode adicionar propriedades a ela, reduzindo seu nível de dano baseado na tabela
> abaixo."*

| Custo | Dano | Crítico | Peso |
|---|---|---|---|
| 1 | 1d12 | 20 | 1 |
| 2 | 2d10 | 20 | 2 |
| 3 | 2d12 | 20 | 3 |
| 4 | 3d10 | 20 | 4 |

### ⚠ A conta DECIDE o dado, e não depende do Addon

A arma criada guarda uma **receita** em `arma.niveis` (`custoAnterior`, `desarmado` e os efeitos da
Propriedade Especial). Com a receita, o dado, o de duas mãos e o alcance saem da conta na leitura, no
`saneiaArmaCustom`, e o que estava digitado deixa de valer. O campo Dado vira mostrador.

A receita **vale sem o Addon** (autor: *"Continua com o dado da conta"*). Arma criada já existia sem
Addon, então o pacote só abre a bancada, e por isso a fase 2 é **primitiva** (`armasPorNivel`,
`permite`) e a fase 1 é liberação. Instalar o pacote não muda número nenhum de arma alguma.

Sem receita a arma é a arma criada de sempre. A bancada tem o interruptor **Conta do Guia**, e a arma
nova já nasce com ele ligado. Desligar grava o dado e o alcance calculados na arma, para ela não voltar
a um dado digitado antigo.

### A conta

```
dado base   = o dado do Custo (ou o do Custo anterior, com +2)
gasto       = os Níveis que as propriedades e o crítico tiram
crédito     = Duas Mãos, Pesada, Recarga, Complexa e o Custo anterior
redução     = max(0, gasto - crédito)
dado        = dado base, descendo "redução" degraus na escada de Níveis de Dano
duas mãos   = um degrau acima do dado (só com Versátil)
```

- **Sem redução o dado é o IMPRESSO.** O Custo 4 continua `3d10`, que não é degrau oferecido nem dado
  do livro, e por isso o dado calculado passa por fora da lista de dados aceitos.
- O crédito só abate gasto: *"não podendo ter seu dano acima do já definido pelo seu custo"*.
- O dado para no degrau "1" da escada, e passar disso é aviso.

### As decisões, por pergunta (autor, 2026-09-14)

| Pergunta | Resposta |
|---|---|
| Fatal e Mortal, "-1 Nível por passo" | *"d8 (1) > d10 (2) > d12 (3) e por ai vai. Não tem d4 e d6"* |
| Pesada abaixo de 12 e a 15 | *"Não existe pesada abaixo de 12. E não permita o Pesada 15."* |
| Arremessável, Alcance e Emperrar, sem preço na tabela | **de graça** |
| O "1.5x seu custo" do Dano Desarmado | *"Para calculo de propriedades"* |
| Recarga, com as faixas sobrepostas | **só a faixa mais estreita** (13 ou mais +1, 8 a 12 +2, 2 a 7 +3, 1 +3) |
| Subir o Custo sem mudar o dado | **uma vez só** |
| O dado da arma | **calculado, vira mostrador** |
| O Peso da tabela | **espaços continuam livres** |
| Versátil | **a conta é o dado de uma mão**, e o de duas é um degrau acima |
| Qual tabela de alcance | **pela Classe**: De Arremesso e A Distância Simples na 1, A Distância Complexa na 2 |
| A coluna do grau | o **grau da Ferramenta**. Sem Ferramenta vale o **4° Grau**, e o "-" **repete o maior** |
| Sem o Addon | **continua com o dado da conta** |
| Quantos efeitos na Propriedade Especial | **quantos quiser** |
| O +2 alcança quais rolagens | **Perícia, Teste de Resistência, Iniciativa e Dano** |

Consequências que saem das respostas, e não de leitura nova:

- **Dano Desarmado** usa `piso(1,5 × Custo)`, mínimo 1, como os Níveis da conta (1, 3, 4 e 6). A arma
  não tem dado próprio, entra no grupo Pugilato e vira o Ataque Básico, como as Faixas.
- **E se ela tiver "Faixas" no nome, ela É Faixas** (autor, 2026-09-18, pergunta 55). Vale para toda
  regra que pergunta, e não só para o Adepto de Briga: o item também satisfaz o `enquantoEquipado` de um
  pacote que peça Faixas equipadas, como o Addon Faixas de Sif. As duas condições são cobradas juntas,
  Dano Desarmado E o nome, e o nome vale sem caixa e em qualquer posição. Quem responde é o `ehFaixas`,
  em `afty-equipamentos.js`. ⚠ Renomear o item tira a regra dele sem avisar, porque o nome é a chave.
- **A tabela de alcance pela Classe bate com todas as armas do livro**: Arco Curto, Besta Leve e Pistola
  são Simples, e Arco Longo, Besta Pesada e os rifles são Complexas. Há assert medindo.
- **As duas tabelas andam na diagonal** (o Custo 2 no 4° Grau é o Custo 1 no 3° Grau), e o "-" é só onde
  ela passaria do topo. Há assert medindo as duas.
- **O grau da coluna é o REAL**, e não o de cálculo. A descida por encantamento da criatura é preço de
  Acerto, Dano, Defesa e RD.
- **Arma de Fogo é o grupo Tiro.** *"sempre devem receber as propriedades: Emperrar e Recarga[X]"*: ao
  trocar o grupo para Tiro o Emperrar entra sozinho e trava, e a Recarga pede o [X] com aviso até ser
  marcada.
- Fineza e Pesada **travam uma à outra** na bancada, e juntas numa ficha importada dão aviso.
- A **Estabilidade** chegou com a Criação de Armas e não está no guia. A bancada não a oferece, e uma arma
  que já a tenha gravada recebe aviso em vez de preço inventado.
- O **tipo de dano** fica restrito aos Físicos na bancada, e um tipo que não seja Físico dá aviso.

### A Propriedade Especial personalizada

> *"Além das listadas no livro, que devem seguir a mesma base das Armas apresentadas, você pode criar
> Propriedades especiais personalizadas a Armas junto ao Narrador"*

Com a propriedade **Especial** marcada, a bancada abre a lista de efeitos, e cabem quantos a mesa
quiser. Cada efeito vira linha do Motor enquanto a arma está equipada, pelo `efeitosEspeciaisDeArma`:

| Efeito | Canal |
|---|---|
| +1 ou +2 numa Perícia | `bonusPericia` |
| +1 ou +2 num Teste de Resistência | `bonusTR` |
| +1 ou +2 de Iniciativa | `iniciativa` |
| +1 ou +2 de Dano | `danoBonus`, só na linha desta arma |
| Treino em 2 Perícias | `proficienciaPericia` com faixa 1 |
| Treino em 1 Teste de Resistência | `proficienciaTR` com faixa 1 |
| Cenário | texto, sem número |

⚠ **O treino é sempre faixa 1**: *"Esse efeito não pode conceder Mestre em Perícia ou Ofício"*. O canal
nunca rebaixa o que a ficha já escolheu. O Integridade fica fora do seletor de TR, como no resto do
sistema.

As duas Observações de Recarga viram resultado na bancada, com o texto no `title`: a Recarga 1 mostra
"Área 3m · Ação Completa", e a Especial junto de Recarga mostra "Recarregar: Ação Comum".

---

## Fase 3: Itens de Custo

> *"Ao criar um Item de Custo, você pode apenas aplicar um dos efeitos das tabelas baseadas em seu
> custo"*

O item mora em `creature.itensCustoCriados`, entra no catálogo de **Itens Especiais** pela
`catalogoDoTipo`, e a descrição dele é o resumo calculado (forma, efeito e valor). Liberação
`itensDeCusto`, com a mesma porta dos Revestimentos: sem o Addon o item continua carregado e deixa de
contar. A categoria (Acessório, Espiritual, Fármaco, Mistura, Talismã) decide os espaços, pela regra de
carregamento de sempre.

### As decisões, por pergunta (autor, 2026-09-14)

| Pergunta | Resposta |
|---|---|
| Como o item vale | **escolha por item**: Passivo (vale equipado e soma na ficha) ou Ativo (de uso) |
| O que o Ativo faz na Ficha Final | **aparece pronto, e a mesa aplica**. A quantidade continua à mão |
| "Acerto (Especificar)" e "CD (Especificar)" | **o tipo de ataque**, e a **CD única** da ficha |
| O Dano do Passivo | **num tipo de ataque** |
| A forma (Arremessável ou Área) | **só o Ativo escolhe**, e o Totem ou Selo é a terceira forma |
| Área e Alcance | a linha da tabela é o **bônus**, e o tópico é a área e o alcance do **próprio item** |
| Cura | *"Anota isso por enquanto, ainda não programamos os Dados de Cura por descanso"*, e depois **fica toda para depois** |
| Condição | **fora desta fase** |
| Tipo de Percepção, Brinco Comunicador, Reduzir Exaustão, Curar Condição | *"Guarde isso no arquivo falando que não foi implementado."* |
| Alcance e Área (bônus) | **fora** (não marcados) |
| Maximizar Atributo e Mudar Tipo de Dano | **entram**. *"Maximizar Atributo já existe 'Talismã do Apice' e deveria estar programado"* |

### ⚠ O que NÃO foi implementado

Por decisão do autor, estes efeitos da tabela **não aparecem** no seletor. As linhas continuam no
módulo com `implementado: false`, porque são o texto do guia e a fila de amanhã:

- **Cura** (e PV Temporário): espera os Dados de Cura por descanso, que a ficha não tem.
- **Condição** e **Curar Condição**: esperam o sistema de condições (`CONDICAO_TEXTOS` está vazio).
- **Tipo de Percepção**, **Brinco Comunicador** e **Reduzir Exaustão**: sem sistema na ficha.
- **Alcance** e **Área** como bônus: não há canal de alcance nem de área.

### Como o Passivo soma

| Efeito | Onde entra |
|---|---|
| Acerto (Especificar) | `bonusAcerto` no tipo de ataque |
| CD (Especificar) | `cd` |
| Perícia e Ofício (Especificar) | `bonusPericia` na perícia ou no Ofício |
| TR (Especificar) | `bonusTR` |
| Dano | `danoBonus` com alvo `atq:<tipo de ataque>` |
| PE (Energia ou Estamina) | `pe` |
| PV Máximo | o campo `hpMax` dos itens do livro, que entra antes da Alma |
| Deslocamento | `movimento`, em metros |
| Atributo | o campo `atributo` dos itens do livro, que passa o limite até 30 |
| Treinamento (Perícia) | `proficienciaPericia` faixa 1, em 1, 2 ou 4 perícias pelo Custo |
| Mestre (Perícia) | `proficienciaPericia` faixa 2, em 1 ou 2 perícias pelo Custo |

⚠ **O escopo `atq:` nasceu aqui.** O canal de Dano mirava arma, categoria, grupo, tipo e propriedade, e
não mirava a jogada. Agora toda linha de arma responde por `atq:<ataqueId>` (uma arma corpo a corpo pode
rolar como Amaldiçoado), e o **Ataque Básico responde por `atq:corpo`**, porque ele rola sempre Corpo a
Corpo.

### O Ativo

O item Ativo não soma nada na ficha. Ele escolhe a forma, e os números saem dos tópicos de cada Custo:

| Custo | Arremessável | Área | Totem ou Selo |
|---|---|---|---|
| 1 | 6m | 4,5m | 10 PV, Defesa 10, área 4,5m |
| 2 | 9m | 6m | 20 PV, Defesa 15, área 6m |
| 3 | 12m | 9m | 30 PV, Defesa 20, área 7,5m |
| 4 | 18m | 12m | 40 PV, Defesa 25, área 9m |

**Mudar Tipo de Dano** é texto: o Custo 1 alcança os Elementais, o 2 também os Biológicos, e o 3 e o 4
também os Etéreos, exceto Dano na Alma e Energia Reversa. A leitura é cumulativa.

### ⚠ O Talismã do Ápice

> *"Ao usar o talismã, o valor de um atributo a sua escolha se torna 30 durante um minuto (10 rodadas
> dentro de um combate) e ele se quebra."* e *"No custo 4 itens ativos podem maximizar um atributo por
> 10m ou 10 rodadas."*

Os dois são a mesma regra, e o autor mandou programar os dois agora (`afty-talisma-apice.js`):

| Pergunta | Resposta |
|---|---|
| O limite e os outros bônus | *"Vira 30, se possuir a Habilidade Lendaria que aumenta em +2. Fica como 32."* |
| A duração | **conta 10 rodadas e desliga sozinho** |
| "e ele se quebra" | **não desconta** do inventário, a quantidade é à mão |

- Carregar o Talismã do Ápice do livro, ou um Item de Custo criado de Custo 4 Ativo com Maximizar
  Atributo (com o Addon), abre o estado **Talismã do Ápice** na aba Buffs, com a escolha do atributo.
- O atributo sobe até o **teto do sistema** dele, que já é 30, ou 32 onde o Aperfeiçoamento de Atributo
  bateu, e nunca desce. Entra depois dos dois estágios de atributo e antes dos modificadores. O hover do
  atributo ganha a parcela "Talismã do Ápice".
- A sessão conta como o Invencível sob o Sol: ligar é a rodada 1, trocar o atributo mantém a contagem, e
  a virada da décima desliga. Encerrar o combate e descansar também desligam.
- ⚠ **É estado de combate**, e a bancada zera todo estado fora de combate. O "um minuto" fora de combate
  fica com a mesa.

---

## Fase 4: Encantamento de Grau Especial

> *"Um Encantamento de Grau Especial pode garantir bônus numéricos simples, os quais são aplicados ao
> usuário enquanto ele utiliza a Ferramenta, seguindo a tabela abaixo:"*

O Encantamento de Grau Especial **é a Habilidade Única** da Ferramenta Amaldiçoada de Grau Especial. A
conta do guia é um interruptor, **"Conta do Guia"**, logo depois da primeira Habilidade Única, e começa
desligado: *"Deixe o Guia Novo como Opcional. Alguns efeitos unicos não são númericos ou são diferentes
do guia atual"*. Com ele ligado, as linhas da conta **somam** com as linhas livres do Motor, e as duas
disputam juntas o pool exclusivo da família `habilidadeUnica`.

A receita mora em `fa.guiaUnica` (`{ ligada, efeitos, feitico }`), separada de `fa.habilidadeEfeitos`. A
bancada só aparece com a primitiva **`encantamentoGuia`**, e a receita gravada vale sem ela.

### As decisões, por pergunta (autor, 2026-09-14)

| Pergunta | Resposta |
|---|---|
| Em quais Habilidades Únicas | **só na da Ferramenta de Grau Especial**, e opcional |
| "Mod. de Atr." | **um atributo por efeito**, e o valor acompanha o modificador |
| "RD (Grupo)" | **uma categoria de dano** |
| Níveis de Dano, Crítico e Ignorar RD | **na própria arma**, ou em toda linha de dano quando o item não é arma |
| OBS², a divisão | **cada efeito dividido** pela quantidade, para baixo |
| OBS², a penalidade | **cada efeito extra escolhe** entre a divisão e a penalidade de metade do BT |
| Melhorar um Encantamento Padrão | **dobra no Motor quando der**, e **conta como um efeito** |
| Técnica Inata | **vincular um Feitiço**, com avisos e contador de usos |
| A penalidade de RD (Grupo) | **reduz a RD total** contra os tipos do grupo |
| Alcance, Tipo de Dano da Técnica e Interação com Aptidões | *"Só guarde para fazermos depois, ainda precisa ser revisado por outro colaborador se minhas decisões foram certeiras"* |

### A conta

| Linha do guia | Valor cheio | Onde entra |
|---|---|---|
| TR (Específico) | Mod / 2 | `bonusTR` no TR escolhido |
| Iniciativa e Atenção | Mod / 2 | `iniciativa` e `atencao` |
| RD (Grupo) | Mod / 2 | `rdTipo` em cada tipo da categoria |
| Defesa | Mod / 2 | `defesa` |
| Acerto (Geral) | Mod / 2 | `bonusAcerto` |
| Crítico | Mod / 5 | `margemCritico`, na arma |
| Deslocamento | 1,5 × (Mod / 2) | `movimento`, em metros |
| Classe de Dificuldade | Mod | `cd` |
| Perícia (Grupo do Atributo) | Mod / 2 | `bonusPericia` com alvo `atr:` do mesmo atributo |
| Ignorar RD | Mod | `ignoraRD`, na arma |
| Níveis de Dano | Mod | `nivelDano`, na arma |

- Toda divisão é para baixo, e o valor cheio **nunca é negativo**.
- **O primeiro efeito vale cheio.** Cada efeito a mais escolhe **Dividir** ou **Penalidade**. Os que
  dividem (o primeiro incluído) têm o valor dividido pela quantidade deles. No Deslocamento a divisão é
  dos degraus de 1,5m.
- **A penalidade vale -(BT / 2)** na linha escolhida, e o efeito que a trouxe vale cheio. A ficha não
  confere se ela *"faz sentido ao efeito adicionado"*.
- Efeito não se repete. A melhoria de Encantamento Padrão é um tipo de efeito, então cabe uma por
  Ferramenta.
- Receita incompleta **avisa e não gera linha**: efeito sem atributo ou sem alvo, melhoria sem
  encantamento, penalidade sem tipo, sem alvo ou sem atributo.

Com Sabedoria 20 e BT 5: Defesa sozinha dá +2. Com a CD dividindo, Defesa +1 e CD +2. Com a CD trazendo
penalidade em RD (Grupo) Elementais, Defesa +2, CD +5 e RD -2 contra os cinco Elementais.

### ⚠ A penalidade de RD desconta da RD TOTAL

A RD por Tipo era aparada em zero antes de somar com a RD Geral, e uma penalidade de RD (Grupo) sumia
calada em quem não tinha RD por Tipo. Agora a soma crua entra inteira e **o total contra o tipo** é que
não fica negativo (`afty-defesas-dano.js`), com a parcela "RD não fica negativa" no hover quando aparou.
Vale para os dois sistemas e para qualquer fonte de RD por Tipo negativa.

### A melhoria de Encantamento Padrão

> *"podendo dobrar seu valor numérico ou dobrar a quantidade de usos do encantamento, com exceção de
> Potente e Sintonizada, os quais não podem ser melhorados."*

- **Dobrar Valor** multiplica por 2, no `resolveFerramenta`, cada número que o Motor já calcula no
  encantamento: efeitos de canal, o Acerto, a redução de penalidade e a RD do escudo.
- **Dobrar Usos** é registro. Os usos de encantamento continuam à mão.
- O seletor mostra só os encantamentos do item, sem Potente e Sintonizada. Encantamento que é texto não
  tem número para dobrar.

### A Técnica Inata

> *"Ele ficará disponível para a utilização a partir de seu equipamento, podendo ser conjurado uma
> quantidade de vezes igual a metade do seu BT."*

- O seletor "Técnica Inata" aponta um **Feitiço da ficha**. A bancada mostra os usos e "Ação de
  Conjurar", e no Auxiliar "Duradouro" com as rodadas. O texto do guia vai no `title`.
- **Avisos**: tipo fora de Auxiliar, Transformação, Cura ou Dano, Nível diferente de 5, condição Forte ou
  Extrema (menos no Feitiço de Cura, cujas condições são as que ele remove), e Feitiço apagado da ficha.
- **Os usos são metade do BT, para baixo.** Com o item equipado, viram um contador de faixa na aba Buffs,
  "Feitiço (Item)", que **volta a zero só no Descanso**.
- ⚠ **`zeraNoDescanso` não é `expiraNaRodada`.** Os dois passam pelo `expirarEstadosDaRodada`, que serve a
  virada de rodada e o descanso, e só o `descansar` passa `{ descanso: true }`. Antes disso o contador
  zerava a cada rodada.

### ⚠ Guardados para depois

Nenhum destes aparece na tela, até outro colaborador revisar as respostas da fase 4:

- **Alcance** (1,5 × Mod / 2): não há canal de alcance. A linha continua na tabela com
  `implementado: false`.
- **Tipo de Dano da Técnica**: a ficha não guarda um tipo de dano principal da técnica.
- **Interação com Aptidões**: os seis exemplos do guia são combinados com o Narrador.

---

## Onde está

| Peça | Arquivo |
|---|---|
| Tabelas, contas e o texto da fase 1 | `src/systems/afty/afty-criacao-equipamentos.js` |
| Os dois cards da fase 1 | `src/systems/afty/ui/EquipamentosCriados.jsx` |
| Tabelas, conta e texto da fase 2 | `src/systems/afty/afty-criacao-equipamentos-armas.js` |
| A bancada da fase 2 | `src/systems/afty/ui/BancadaDeNiveis.jsx` |
| Tabelas, tópicos e contas da fase 3 | `src/systems/afty/afty-criacao-equipamentos-itens.js` |
| O card da fase 3 | `src/systems/afty/ui/EquipamentosCriados.jsx` (`ItensCustoCriadosCard`) |
| O Talismã do Ápice | `afty-talisma-apice.js`, o derive (atributo e estado), `ficha/ficha-sessao.js` (rodadas), `ficha/abas/AbaBuffs.jsx` (contador) |
| O escopo `atq:` | `afty-efeitos.js` (`escoposDaArma`) e `afty-pericias.js` (Ataque Básico) |
| Tabela, texto e conta da fase 4 | `src/systems/afty/afty-criacao-equipamentos-encantamento.js` |
| A bancada da fase 4 | `src/systems/afty/ui/BancadaDoEncantamento.jsx`, aberta no `FerramentaEditor` |
| A receita, a melhoria e o Feitiço vinculado | `afty-equipamentos.js` (`resolveFerramenta` e `resolveEquipamentos`) |
| O contador de usos | `ficha/ficha-sessao.js` (`expirarEstadosDaRodada` com `{ descanso: true }`) |
| A RD total que não fica negativa | `src/systems/afty/afty-defesas-dano.js` |
| O editor, o interruptor e as travas | `src/systems/afty/AftyCreatureBuilder.jsx` (`ArmaCustomEditor`, `PropriedadeCustom`) |
| Leitura da ficha, receita e portão da liberação | `src/systems/afty/afty-equipamentos.js` (`catalogoDoTipo`, `saneiaArmaCustom`, `alcanceDaArma`, `resolveEquipamentos`) |
| O grau da Ferramenta no alcance | `src/systems/afty/afty-derive.js` (a linha de cada arma) |
| Liberações, primitiva e o campo `incompativeis` | `src/systems/afty/afty-addons.js` |
| A trava na tela | `src/systems/afty/AftyTabAddons.jsx` |
| Os manipuladores | `src/systems/afty/AftyCreatureBuilder.jsx` (`criados`, `addArmaCustom`) |
| O pacote | `addons/criacao-de-equipamentos.json` |
| As provas | `asserts/t-criacao-equipamentos.mjs`, `t-criacao-equipamentos-armas.mjs`, `t-criacao-equipamentos-itens.mjs` e `t-criacao-equipamentos-encantamento.mjs` |
