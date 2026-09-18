# Criação de Equipamentos: decisões e dúvidas

Registro de tudo que foi perguntado ao autor sobre o guia **"Criação de Equipamentos e Itens 2.5.2"**
durante a implementação no Grimório Afty e na Ficha de Player, a partir de 2026-09-14. Cada pergunta traz
o contexto, as opções oferecidas e a resposta. Serve para outros colaboradores conferirem se alguma
resposta saiu errada.

As perguntas de 1 a 54 são da implementação das quatro fases, em 2026-09-14. Da 55 em diante são as
revisões posteriores, com a data na própria resposta.

- **O guia**, sem mudança nenhuma: `docs/afty-criacao-equipamentos-fonte.md`
- **Como ficou no sistema**: `docs/afty-criacao-equipamentos.md`
- **Estado**: as quatro fases feitas, 1 (Revestimentos e Escudos), 2 (Armas), 3 (Itens de Custo, com o
  Talismã do Ápice) e 4 (Encantamento de Grau Especial). Três trechos da fase 4 ficaram guardados até
  outro colaborador revisar as respostas (seção 9).

Onde a resposta do autor foi escrita por ele, ela aparece entre aspas. Onde ele escolheu uma opção, o
nome da opção aparece em negrito.

---

## Sumário das respostas

| # | Assunto | Resposta |
|---|---|---|
| 1 | Sistemas | Os dois (Ficha de Player e Grimório Afty) |
| 2 | Relação com a Criação de Armas | Convivem, e não ligam juntas na mesma ficha |
| 3 | Addon ou regra geral | Addon por enquanto |
| 4 | Fatal e Mortal | d8 = 1, d10 = 2, d12 = 3, sem d4 e d6 |
| 5 | Pesada | Não existe abaixo de 12, e a 15 é proibida |
| 6 | Recarga com faixas sobrepostas | Só a faixa mais estreita |
| 7 | Arremessável, Alcance e Emperrar | De graça |
| 8 | Subir o Custo sem mudar o dado | Uma vez só |
| 9 | Dano Desarmado 1.5x | Para cálculo de propriedades |
| 10 | Grau das tabelas de alcance | Grau da Ferramenta |
| 11 | Troca de Defesa no Revestimento | 2 de Defesa por +2 em duas escolhas |
| 12 | RD da troca | RD por Tipo |
| 13 | Quantos degraus trocar | Um só |
| 14 | Espaços do Revestimento | Seguem o Custo, Custo 4 ocupa 6 |
| 15 | Revestimento na ficha de criatura | Custo menos o degrau trocado |
| 16 | Dado do escudo criado | 1d4, 1d6, 1d8 e 1d10 |
| 17 | "Mod. de Atr." | Escolha do jogador na criação |
| 18 | OBS² do Encantamento | Cada efeito dividido pela quantidade |
| 19 | Área e Alcance dos Itens de Custo | Tabela é o bônus, tópico é o próprio item |
| 20 | Texto com erro de digitação | Transcrito como está |
| 21 | Dado da arma criada | Calculado, o campo vira mostrador |
| 22 | Coluna "Peso" das armas | Espaços continuam livres |
| 23 | Versátil | A conta é o dado de uma mão |
| 24 | Qual tabela de alcance | Pela Classe |
| 25 | Arma sem Ferramenta e o "-" | 4° Grau, e o "-" repete o maior |
| 26 | Arma criada sem o Addon | Continua com o dado da conta |
| 27 | Efeitos da Propriedade Especial | Quantos quiser |
| 28 | Rolagens do +2 da Propriedade Especial | Perícia, TR, Iniciativa e Dano |
| 29 | Como o Item de Custo vale | Escolha por item: Passivo ou Ativo |
| 30 | O item Ativo na Ficha Final | Aparece pronto, a mesa aplica |
| 31 | "Especificar" em Acerto e CD | Tipo de ataque, e a CD única |
| 32 | Cura com dados do descanso | Fica toda para depois (não implementada) |
| 33 | Dano do item Passivo | Num tipo de ataque |
| 34 | Aplicar Condição | Fora desta fase (não implementada) |
| 35 | Totem ou Selo | Terceira forma do Ativo |
| 36 | Quem escolhe a forma | Só o Ativo |
| 37 | Tipo de Percepção, Brinco, Exaustão, Curar Condição | Não implementados, registrados aqui |
| 38 | Alcance e Área (bônus), Maximizar, Mudar Tipo de Dano | Entram Maximizar e Mudar Tipo de Dano. Alcance e Área ficam fora |
| 39 | Programar o Talismã do Ápice | Sim, junto com o Maximizar Atributo |
| 40 | "se torna 30" | Vira 30, e 32 com a Habilidade Lendária do +2 |
| 41 | Duração do Ápice | Conta 10 rodadas e desliga sozinho |
| 42 | "e ele se quebra" | Não desconta do inventário |
| 43 | O que é o Encantamento de Grau Especial | A Habilidade Única da Ferramenta de Grau Especial |
| 44 | A conta e as linhas livres do Motor | A conta é opcional, e as duas convivem |
| 45 | Um atributo por quê | Um por efeito, e o valor acompanha o modificador |
| 46 | "RD (Grupo)" | Uma categoria de dano |
| 47 | Onde valem Níveis de Dano, Crítico e Ignorar RD | Na própria arma, ou em tudo quando o item não é arma |
| 48 | Penalidade e divisão | Cada efeito extra escolhe |
| 49 | Melhorar um Encantamento Padrão | Dobra no Motor quando der |
| 50 | Interação com Técnica Inata | Vincular um Feitiço, com avisos e contador de usos |
| 51 | Em quais Habilidades Únicas a conta aparece | Só na da Ferramenta de Grau Especial, e opcional |
| 52 | Alcance, Tipo de Dano da Técnica e Interação com Aptidões | Guardados para depois, esperando revisão |
| 53 | A melhoria conta como efeito | Conta como um efeito |
| 54 | A penalidade de RD (Grupo) | Reduz a RD total contra aqueles tipos |
| 55 | A arma de Dano Desarmado chamada Faixas | É Faixas para todo efeito, e não só para o Adepto de Briga |

---

## 1. Escopo

### 1. Em que sistema o guia vale?

**Contexto.** O guia tem "2.5.2" no título, mas o Grimório 2.5.2 (`src/components/`) é somente-leitura,
então ele só pode entrar como conteúdo do Afty. No Afty há dois sistemas lidos do mesmo código: o
Grimório Afty (fichas de criatura) e a Ficha de Player. Na criatura o dado da arma não entra no dano e a
Defesa do uniforme é o Custo, então a métrica de armas e de uniforme só muda número de verdade no
jogador. Itens de Custo e Encantamentos mudam número nos dois.

**Pergunta.** Vale para a Ficha de Player, para o Grimório Afty ou para os dois?

**Resposta.** "Ambas."

### 2. Qual a relação com a Criação de Armas que já existe?

**Contexto.** Desde 2026-09-09 existe o Addon "Criação de Armas", do autor, com a bancada de **Pontos de
Criação**. Ela mede a mesma arma criada com outra conta: bolso de PC por classificação, preço por
propriedade, limites. Com as duas ligadas, a mesma arma teria dois resultados.

**Pergunta.** Esta métrica substitui a bancada de Pontos de Criação, as duas convivem como Addons que
não se instalam juntos, ou são de mesas diferentes?

**Resposta.** "Convivem e não podem ser instaladas juntos."

### 3. Addon ou regra de toda ficha?

**Pergunta.** A Criação de Equipamentos é um Addon instalado por ficha, ou regra de toda ficha?

**Resposta.** "Por enquanto addon. Mas vai virar feature quando eu testar e verificar certinho."

---

## 2. Armas

### 4. Fatal e Mortal: quanto custa cada dado?

**Contexto.** A tabela do guia diz *"Fatal (d8) -1 Nível por passo"* e *"Mortal (d8) -1 Nível por
passo"*, sem dizer de onde o passo conta.

**Pergunta.** O d8 custa 1 Nível e cada dado acima custa mais 1? E o d4 e o d6?

**Resposta.** "d8 (1) > d10 (2) > d12 (3) e por ai vai. Não tem d4 e d6"

### 5. A Pesada que não cabe em nenhuma faixa

**Contexto.** A tabela dá *"Pesada [12 a 14] +1 Nível"* e *"Pesada [16 a 20] +2 Nível"*. A Pesada 15 não
cai em nenhuma das duas, e a tabela não fala de Pesada abaixo de 12.

**Pergunta.** Quanto vale a Pesada 15? E abaixo de 12?

**Resposta.** "Não existe pesada abaixo de 12. E não permita o Pesada 15."

### 6. Recarga com faixas que se sobrepõem

**Contexto.** A tabela dá *"Recarga [13 ou mais] +1 Nível"*, *"Recarga [12 ou menos] +2 Nível"*,
*"Recarga [7 ou menos] +3 Nível"* e *"Recarga [1] +3 Nível"*. Uma Recarga 5 cabe em "12 ou menos" e em
"7 ou menos" ao mesmo tempo. Com as armas do livro:

| Arma | Recarga | Opção A: só a mais estreita | Opção B: as faixas somam |
|---|---|---|---|
| Rifle | 20 | +1 | +1 |
| Pistola | 12 | +2 | +2 |
| Rifle de Precisão | 5 | +3 | +5 |
| Escopeta | 2 | +3 | +5 |
| Bestas e Bazuca | 1 | +3 | +8 |

A recomendação foi a A, porque a linha [1] repete o +3 da [7 ou menos], o que só faz sentido se elas não
somam.

**Resposta.** **Só a faixa mais estreita.**

Na primeira rodada o autor pediu mais contexto para esta pergunta. A resposta veio na segunda rodada.

### 7. As propriedades sem preço na tabela

**Contexto.** Arremessável, Alcance e Emperrar aparecem nas armas do livro e não na tabela do guia.

**Pergunta.** Elas são de graça?

**Resposta.** "Sim"

### 8. Subir o Custo sem mudar o dado, mais de uma vez?

**Contexto.** *"Você pode subir o Custo de uma Arma sem alterar seu dado de dano, utilizando o do custo
anterior. Ao fazer isso você garante +2 níveis de dano a Arma para apenas o gasto de propriedades."*

**Pergunta.** Uma arma de Custo 3 pode usar o dado do Custo 2 (2d10) e ganhar +2. Ela pode descer mais
um degrau e usar o dado do Custo 1 (1d12) com +4?

**Resposta.** **Uma vez só.**

⚠ Na primeira rodada, a resposta desta pergunta veio igual à da Pesada ("Não existe pesada abaixo de
12. E não permita o Pesada 15."), provavelmente por engano de colagem. A pergunta foi refeita com
opções, e a resposta acima é a da segunda rodada.

### 9. A arma de Dano Desarmado

**Contexto.** *"Ao criar uma Arma que utilize seu Dano DesArmado, a Arma é considerada como se tivesse
uma quantidade de Níveis de Dano igual a 1.5x seu custo (Mínimo 1) para cálculos de propriedade"*.

**Pergunta.** Os "Níveis de Dano igual a 1.5x seu custo" são o crédito para propriedades? Arredondando
para baixo, o Custo 3 dá 4.

**Resposta.** "Para calculo de propriedades."

### 10. O grau das tabelas de alcance

**Contexto.** As duas tabelas de alcance cruzam o Custo com colunas de grau (4° Grau a Grau Especial).

**Pergunta.** As tabelas usam o grau da Ferramenta Amaldiçoada ou o grau do feiticeiro?

**Resposta.** "Ferramenta."

### 21. O dado da arma criada

**Contexto.** Com o Addon, o dado da arma criada sai da conta do guia: o dado do Custo menos os Níveis
gastos em propriedades e crítico. Exemplo mostrado: Custo 2 (2d10) com Marcial -1, Modular -1, Duas Mãos
+1 e Crítico 19 -1 tem gasto 3 e crédito 1, e o dado desce dois degraus.

**Pergunta.** Como o editor trata o campo Dado?

**Opções.**
- **Calculado, vira mostrador** (recomendada): a ficha grava Custo, propriedades e crítico, e o dado sai
  da conta. Não dá para digitar um dado que a tabela não dá.
- Livre, a bancada avisa: a pessoa escolhe o dado, e a bancada mostra o que a conta permite e avisa.

**Resposta.** **Calculado, vira mostrador.**

### 22. A coluna "Peso"

**Contexto.** A tabela de Armas do guia tem "Peso" 1, 2, 3 e 4 pelo Custo. No livro os espaços não seguem
o Custo: no Custo 1 há 24 armas de 1 espaço e 8 de 2, no Custo 2 há 6 de 1 e 9 de 2, e no Custo 3 há 1 de
1 e 3 de 4.

**Pergunta.** O Peso é o número de Espaços da arma criada?

**Opções.**
- Peso é Espaços, pelo Custo: a arma ocupa 1 a 4 espaços, e o campo vira mostrador.
- **Espaços continuam livres**: o Peso fica só como referência.

**Resposta.** **Espaços continuam livres.**

### 23. Versátil

**Contexto.** Uma arma Versátil tem o dado de uma mão e o de duas. No livro o de duas mãos é um degrau
acima (Clava 1d8/1d10, Bastão 1d6/1d8).

**Pergunta.** Na arma criada, o dado da conta é qual dos dois?

**Opções.**
- **A conta é o de uma mão** (recomendada): o de duas mãos é um degrau acima, como no livro.
- A conta é o de duas mãos: o de uma mão é um degrau abaixo.

**Resposta.** **A conta é o de uma mão.**

### 24. Qual tabela de alcance

**Contexto.** A tabela 1 é *"Arcos curto, Pistola, Besta (Geral) e Arremesso (Geral)"*, e a tabela 2 é
*"Arco Longo, Armas de fogo(Menos Pistolas) e Besta Pesada"*. A ficha tem os grupos Arco, Besta e Tiro,
sem separar curto de longo.

**Pergunta.** Como a arma criada escolhe a tabela?

**Opções.**
- **Pela Classe** (recomendada): De Arremesso usa a 1, A Distância Simples usa a 1, A Distância Complexa
  usa a 2. Bate com todas as armas do livro: Arco Curto, Besta Leve e Pistola são Simples, e Arco Longo,
  Besta Pesada e os rifles são Complexas.
- Escolha na criação: um seletor "Alcance Curto" ou "Alcance Longo".

**Resposta.** **Pela Classe.**

### 25. Arma sem Ferramenta, e a célula "-"

**Contexto.** Com a coluna sendo o grau da Ferramenta (pergunta 10), falta dizer o que vale para arma
comum. E há células "-" na tabela, como o Custo 2 no Grau Especial. A tabela anda na diagonal (o Custo 2
no 4° Grau é igual ao Custo 1 no 3° Grau), e o "-" é onde ela passaria do topo.

**Pergunta.** Uma arma sem Ferramenta usa qual coluna? E a célula "-"?

**Opções.**
- **4° Grau, e "-" repete o maior** (recomendada).
- 4° Grau, e "-" não pode, com aviso.
- Sem Ferramenta, alcance livre (a tabela só vale para Ferramenta).

**Resposta.** **4° Grau, e "-" repete o maior.**

### 26. A arma criada sem o Addon

**Pergunta.** Sem o Addon, uma arma que foi criada pela conta do guia fica como?

**Opções.**
- **Continua com o dado da conta** (recomendada): a receita é dado da arma, e o Addon só abre a bancada.
- Volta a ser arma livre, partindo do último dado calculado.

**Resposta.** **Continua com o dado da conta.**

### 27. Quantos efeitos cabem na Propriedade Especial personalizada

**Contexto.** O guia lista três efeitos: *"Se for um Valor Numérico, você pode adicionar um bônus de até
no máximo +2 em alguma rolagem que não seja Jogadas de Ataque."*, *"Treinamentos também podem ser
adicionados, garantindo treinamento em 2 perícias ou em 1 Teste de Resistência. Esse efeito não pode
conceder Mestre em Perícia ou Ofício."* e a interação com o cenário.

**Opções.** Um efeito só / Cada um no máximo uma vez / **Quantos quiser**.

**Resposta.** **Quantos quiser.**

### 28. Quais rolagens o +2 alcança

**Contexto.** *"um bônus de até no máximo +2 em alguma rolagem que não seja Jogadas de Ataque"*.

**Pergunta.** Quais rolagens o seletor oferece? (várias escolhas)

**Opções.** Uma Perícia / Um Teste de Resistência / Iniciativa / Dano (na linha da própria arma).

**Resposta.** **Todas as quatro.**

### 55. A arma de Dano Desarmado que se chama Faixas

**Contexto.** A arma criada com Dano Desarmado entra no grupo Pugilato e vira o Ataque Básico, como as
Faixas do livro (ver a pergunta 9). Só que o resto do sistema reconhecia Faixas pelo id `arm_faixas`, e
não pelo que a arma é: uma Faixa criada na bancada **desligava** o Talento Adepto de Briga, exatamente
como uma Manopla, e não servia para o Addon Faixas de Sif, que concede as Aptidões de Armas Naturais
enquanto as Faixas estiverem equipadas.

**Pergunta.** Até onde vai o "considerado como Faixas"?

**Opções.**
- **Identidade completa** (recomendada): além de liberar o Adepto de Briga, o item criado satisfaz
  `enquantoEquipado: "arm_faixas"`, então o Addon Faixas de Sif e qualquer pacote futuro que peça Faixas
  equipadas enxergam o item.
- Só o Adepto de Briga: o item criado deixa de desligar o Talento, e o Addon Faixas de Sif continua
  exigindo o item do livro.

**Resposta.** **Identidade completa.** (2026-09-18)

**Como ficou.** Uma arma **com Dano Desarmado E com "Faixas" no nome** é Faixas. As duas condições são
cobradas juntas: uma espada chamada "Faixas de Sif" continua sendo uma espada, e o Dano Desarmado sozinho
é o que as Manoplas também têm, e elas bloqueiam o Talento de propósito (ver a seção 7). O nome é
comparado sem caixa e em qualquer posição, então "FAIXAS pretas" e "Minhas faixas" valem. Quem responde é
a função `ehFaixas`, em `afty-equipamentos.js`.

⚠ **O nome é a chave, e renomear o item tira a regra dele sem avisar.** É o preço aceito para não precisar
de um campo novo na bancada. Uma marca explícita ("conta como Faixas") seria mais firme, e é a troca a
fazer no dia em que um renome surpreender alguém.

---

## 3. Revestimentos e Escudos

### 11. Quanto de Defesa custa o bônus do Revestimento

**Contexto.** *"Como o Revestimento Sob Medida, você também pode adicionar efeitos especiais, podendo
adicionar +no em uma Perícias ou RD(Especifico), com um máximo de +2 por Perícia ou RD, sacrificando o
aumento de Defesa que você receberia ao aumentar o custo."* A tabela dá 2 de Defesa por Custo (2, 4, 6,
8). O Sob Medida do livro é Custo 2, Defesa 1, +2 em Acrobacia e +2 em Furtividade, penalidade 0.

**Pergunta.** Qual a Defesa e a penalidade destes três?

| Revestimento | Palpite oferecido |
|---|---|
| Custo 3 com +1 em Percepção | Defesa 5, penalidade -3 |
| Custo 3 com +2 em Percepção | Defesa 4, penalidade -2 |
| Custo 2 com +2 em Acrobacia e +2 em Furtividade | Defesa 0, penalidade 0 |

O palpite ("cada +1 custa 1 de Defesa") deixava o Sob Medida com 1 de Defesa a menos que o livro.

**Resposta.** "Consome 2 de Defesa para adicionar +2 em duas pericias / rd. Logo um CUsto 4 poderia ter 6
de Defesa e -4 de Penalidade e +2 em Atletismo e RD (Especifico)"

Na primeira rodada o autor pediu mais contexto para esta pergunta. A resposta acima veio na segunda
rodada.

### 12. Qual RD o "RD(Especifico)" é

**Contexto.** A ficha tem a **RD Específica**, uma pilha sem tipo de dano que o autor decidiu em
2026-07-30 que vai virar RD por tipo, e a **RD por Tipo**, contra um dos 15 tipos de dano.

**Opções.**
- **RD por Tipo** (recomendada): o jogador escolhe o tipo de dano na criação.
- RD Específica: a pilha sem tipo.
- RD Física: os três danos físicos.

**Resposta.** **RD por Tipo.**

### 13. Quantos degraus de Defesa um Revestimento pode trocar

**Opções.**
- Todos acima do Custo 1 (recomendada): um Custo 4 poderia chegar a Defesa 2 com seis bônus.
- **Só um degrau.**

**Resposta.** **Só um degrau.**

### 14. Os espaços do Revestimento

**Contexto.** O guia não fala de espaço. O livro dá 0 ao Revestimento Leve, 2 ao Médio e 4 ao Robusto.

**Pergunta A.** E o Custo 4? **Resposta.** "Custo 4 vira 6 Espaços, seguindo o padrão de subida."

**Pergunta B.** Com a troca, os espaços seguem o Custo ou a Defesa que sobrou? (O Sob Medida do livro é
Custo 2 e ocupa 0, como o Leve.)

**Opções.** **Seguem o Custo** / Seguem a Defesa.

**Resposta.** **Seguem o Custo.**

### 15. O Revestimento criado na ficha de criatura

**Contexto.** Na ficha de criatura a Defesa do uniforme é o Custo, e não a coluna do livro.

**Pergunta.** Um Revestimento criado que trocou um degrau dá quanto de Defesa lá?

**Opções.**
- **Custo menos os degraus** (recomendada): é o que o Sob Medida já faz na criatura (Custo 2, Defesa 1).
- Custo cheio.

**Resposta.** **Custo menos os degraus.**

### 16. O dado do escudo criado

**Contexto.** A tabela de Escudos do guia não tem a coluna de dano. Os Custos 1 a 3 do guia são
exatamente os escudos do livro:

| Escudo do livro | Custo | RD | Penalidade | Dado |
|---|---|---|---|---|
| Leve | 1 | 2 | -1 | 1d4 |
| Médio | 2 | 4 | -2 | 1d6 |
| Pesado | 3 | 6 | -4 | 1d8 |

**Sugestões oferecidas.** Um degrau por Custo seguindo o livro, com 1d10 no Custo 4 (recomendada) / O
mesmo, com o jogador podendo escolher um dado menor / 1d4 em todos / Escudo criado não ataca.

**Resposta.** "Pode seguir sua recomendação e deixar o custo 4 como 1d10."

---

## 4. Encantamento de Grau Especial

### 17. "Mod. de Atr."

**Contexto.** A tabela de Interações Simples usa *"Mod. de Atr. / 2"*, *"Mod. de Atr."* e *"Mod. de Atr.
/ 5"* sem dizer de qual atributo.

**Resposta.** "Escolha do Jogador na criação."

### 18. A divisão da OBS²

**Contexto.** *"Se seu Encantamento de Grau Especial for conceder mais de um dos bônus acima ao mesmo
tempo, você pode dividir o valor total que receberia de todos os efeitos pela quantidade de efeitos
adicionados no total (Mínimo 0)."* Exemplo com Mod. +5, Defesa (5 / 2 = 2) e Níveis de Dano (5):

| Leitura | Defesa | Níveis de Dano |
|---|---|---|
| **Cada efeito dividido pela quantidade** | 1 | 2 |
| Soma tudo e divide igual | 3 | 3 |

Na segunda leitura, acrescentar os Níveis de Dano faz a Defesa subir de 2 para 3.

**Resposta.** **Cada efeito dividido.**

Na primeira rodada o autor pediu mais contexto. A resposta veio na segunda rodada.

### 43. O que é o Encantamento de Grau Especial

**Contexto.** Toda Ferramenta Amaldiçoada de Grau Especial já tem na ficha uma **Habilidade Única**, um
campo de texto com linhas do Motor de Automação. O guia fala em *"Um Encantamento de Grau Especial pode
garantir bônus numéricos simples, os quais são aplicados ao usuário enquanto ele utiliza a Ferramenta"*,
sem dizer se é a mesma coisa.

**Pergunta.** O "Encantamento de Grau Especial" do guia é a Habilidade Única que toda Ferramenta
Amaldiçoada de Grau Especial já tem na ficha (o campo com o Motor de Automação)?

**Opções.**
- **Sim, é a Habilidade Única** (recomendada): a conta do guia monta as linhas da Habilidade Única da
  Ferramenta de Grau Especial, e ela continua disputando no pool exclusivo como hoje.
- É um encantamento a mais: além da Habilidade Única, o item de Grau Especial ganha um Encantamento de
  Grau Especial próprio, que soma com ela.

**Resposta.** **Sim, é a Habilidade Única.**

**Consequência.** O que a conta gera entra na família `habilidadeUnica` do pool exclusivo, e por isso não
acumula com Feitiço Auxiliar nem com Shikigami, como qualquer Habilidade Única.

### 44. A conta e as linhas livres do Motor

**Contexto.** A Habilidade Única aceita linhas livres, escritas à mão. A conta do guia gera linhas
também. Na arma pela conta (fase 2), ligar a conta esconde o campo livre.

**Pergunta.** Com a Conta do Guia ligada, o que acontece com as linhas livres do Motor da Habilidade
Única?

**Opções.**
- A conta substitui as livres (recomendada): enquanto a conta está ligada, as linhas saem dela e o
  editor livre fica escondido. Desligar devolve o editor livre.
- As duas convivem: as linhas da conta somam com as linhas livres que a pessoa escrever.

**Resposta.** "Deixe o Guia Novo como Opcional. Alguns efeitos unicos não são númericos ou são
diferentes do guia atual"

**Como foi lido.** A conta é um interruptor ("Conta do Guia") que começa desligado, e o campo livre
continua aberto. Com a conta ligada, as linhas dela **somam** com as livres. A recomendação não foi
seguida, porque a resposta diz que há Habilidades Únicas que o guia não cobre.

### 45. Um atributo por quê

**Contexto.** A pergunta 17 decidiu que o "Mod. de Atr." é escolha do jogador. Faltava saber o alcance da
escolha e se o valor é fixo.

**Pergunta.** Um atributo vale para o encantamento inteiro ou cada efeito escolhe o seu? E o valor
acompanha o modificador atual?

**Opções.**
- Um por encantamento, acompanha o Mod (recomendada): o encantamento escolhe um atributo, e todo efeito
  dele usa esse modificador. Se o atributo subir, o bônus sobe junto.
- **Um por efeito, acompanha o Mod**: cada efeito escolhe o seu atributo.
- Um por encantamento, valor fixo: o valor é calculado na criação e gravado. Subir o atributo depois não
  muda o bônus.

**Resposta.** **Um por efeito, acompanha o Mod.**

### 46. "RD (Grupo)"

**Contexto.** A tabela de Interações Simples tem a linha *"RD (Grupo)"* com valor Mod / 2. O texto da
penalidade dá o exemplo *"Como reduzir RD de um Grupo inteiro para ganhar o efeito de Níveis de Dano"*.

**Pergunta.** "RD (Grupo)" com valor Mod/2: o que é o Grupo?

**Opções.**
- **Uma categoria de dano** (recomendada): Físicos, Elementais, Etéreos ou Biológicos. A RD vale contra
  todos os tipos daquela categoria.
- RD Geral: o "Grupo" é a RD Geral, que vale contra todo tipo menos alma.
- Um tipo de dano só: o "Grupo" é um tipo escolhido.

**Resposta.** **Uma categoria de dano.**

### 47. Onde valem Níveis de Dano, Crítico e Ignorar RD

**Contexto.** As linhas *"Níveis de Dano"* (Mod), *"Crítico"* (Mod / 5) e *"Ignorar RD"* (Mod) não dizem
em que ataque valem. A Ferramenta pode ser arma, escudo, uniforme ou acessório.

**Pergunta.** Níveis de Dano (Mod), Crítico (Mod/5) e Ignorar RD (Mod): em que ataques eles valem?

**Opções.**
- **Na própria arma, ou em tudo** (recomendada): se a Ferramenta é uma arma, só na linha dela. Se é
  escudo, uniforme ou acessório, em toda linha de dano.
- Em toda linha de dano: vale em todo ataque, qualquer que seja o item.
- Num tipo de ataque escolhido: Corpo a Corpo, A Distância ou Amaldiçoado, como o Dano do Item de Custo.

**Resposta.** **Na própria arma, ou em tudo.**

### 48. Penalidade e divisão

**Contexto.** A OBS² tem duas saídas para mais de um efeito. A primeira é a divisão (pergunta 18). A
segunda: *"Você também pode, em vez disso, receber uma penalidade em um valor igual a metade do seu BT
baseado em um dos valores da tabela para receber um efeito adicional."*

**Pergunta.** Como a penalidade convive com a divisão?

**Opções.**
- **Cada efeito extra escolhe** (recomendada): o primeiro efeito vale cheio. Cada efeito a mais escolhe:
  ou entra na divisão, ou traz uma penalidade de metade do BT num tipo da tabela e vale cheio.
- Tudo ou nada: ou todos os efeitos se dividem, ou todos os extras trazem penalidade.

**Resposta.** **Cada efeito extra escolhe.**

**Exemplo com Sabedoria 20 (Mod. +5) e BT 5.** Defesa (5 / 2 = 2) sozinha dá Defesa +2. Com a CD entrando
na divisão, ficam Defesa 1 e CD 2. Com a CD trazendo penalidade em RD (Grupo) Elementais, ficam Defesa +2,
CD +5 e RD -2 contra Ácido, Congelante, Chocante, Queimante e Sônico.

### 49. Melhorar um Encantamento Padrão

**Contexto.** *"Você pode escolher melhorar um Encantamento Padrão, como Armazenadora, em vez de aplicar um
dos efeitos acima, podendo dobrar seu valor numérico ou dobrar a quantidade de usos do encantamento, com
exceção de Potente e Sintonizada, os quais não podem ser melhorados."* Só 17 dos 52 encantamentos têm
número no Motor. Os outros são texto.

**Pergunta.** O que esta fase faz com a melhoria?

**Opções.**
- **Dobra no Motor quando der** (recomendada): o encantamento escolhido tem o número dobrado quando o
  Motor já o calcula. Dobrar usos, ou dobrar um encantamento que é texto, vira anotação no item.
- Só anotação: a escolha fica gravada e aparece no item, e a mesa aplica.
- Fora desta fase: não é oferecido agora.

**Resposta.** **Dobra no Motor quando der.**

### 50. Interação com Técnica Inata

**Contexto.** *"Você pode colocar um feitiço seu como Encantamento especial, o qual não terá custo para
utilização. Ele ficará disponível para a utilização a partir de seu equipamento, podendo ser conjurado uma
quantidade de vezes igual a metade do seu BT."* O Feitiço tem de ser Nível 5, de tipo Auxiliar,
Transformação, Cura ou Dano, sem condições Fortes ou Extremas, e o Auxiliar é sempre Duradouro.

**Pergunta.** O que esta fase faz com a Técnica Inata?

**Opções.**
- **Vincular um Feitiço com avisos** (recomendada): o item aponta um Feitiço da ficha, a bancada avisa o
  que foge da regra (nível, tipo, condição), e a Ficha Final conta os usos (metade do BT), zerando no
  descanso.
- Só o vínculo, sem contador: o item aponta o Feitiço e avisa, e os usos ficam com a mesa.
- Fora desta fase: fica anotado para depois.

**Resposta.** **Vincular um Feitiço com avisos.**

### 51. Em quais Habilidades Únicas a conta aparece

**Contexto.** A ficha tem quatro blocos de Habilidade Única: a da Ferramenta de Grau Especial, a Segunda
(Addon Benção do Grão Mestre da Forja) e as duas de cada Acessório Único.

**Pergunta.** A Conta do Guia (opcional) aparece em quais Habilidades Únicas?

**Opções.**
- Em todas as quatro (recomendada): o mesmo bloco de Habilidade Única serve as quatro, e a conta vem junto
  em todas.
- Só na da Ferramenta: a conta só aparece na primeira Habilidade Única da Ferramenta de Grau Especial.

**Resposta.** "Só na Ferramenta de Grau Especial. E deixe como OPCIONAL"

### 52. Alcance, Tipo de Dano da Técnica e Interação com Aptidões

**Contexto.** Três trechos não têm canal nem sistema na ficha:
- **Alcance**, a linha da tabela: 1,5 × (Mod / 2) metros. Não há canal de alcance (o mesmo motivo do
  Item de Custo).
- **Tipo de Dano da Técnica**: *"Sua Ferramenta causa o Tipo de Dano principal da sua Técnica sem a
  necessidade."* A ficha não guarda um tipo de dano principal da técnica.
- **Interação com Aptidões**: os seis exemplos do guia (usos, alcance, Nível de Dano +2, valor +2, área,
  usar Aptidão que não possui), que o guia manda combinar com o Narrador.

**Pergunta.** Quais entram como texto no item nesta fase? Os não marcados ficam fora e vão para o arquivo
como não implementados.

**Resposta.** "Só guarde para fazermos depois, ainda precisa ser revisado por outro colaborador se minhas
decisões foram certeiras"

**Consequência.** Nenhum dos três aparece na tela. A linha de Alcance continua no código com
`implementado: false`.

### 53. A melhoria conta como efeito

**Contexto.** A melhoria vem *"em vez de aplicar um dos efeitos acima"*. Isso importa para a divisão da
OBS² e para a penalidade.

**Pergunta.** A melhoria conta como um efeito para a divisão da OBS² e para a penalidade?

**Opções.**
- **Conta como um efeito** (recomendada): ela ocupa o lugar de um efeito da tabela, então entra na
  quantidade que divide os valores, e pode trazer penalidade como um efeito extra.
- Não entra na conta: a melhoria é por fora, e não divide nem pede penalidade.

**Resposta.** **Conta como um efeito.**

### 54. A penalidade de RD (Grupo)

**Contexto.** A penalidade em RD (Grupo) vira RD por Tipo negativa nos tipos daquela categoria. Até aqui a
ficha aparava a RD por Tipo em zero antes de somar, e a penalidade sumia sem aviso. Esta pergunta nasceu
de um teste da fase 4.

**Pergunta.** O que a penalidade deve reduzir?

**Opções.**
- **A RD total contra aqueles tipos** (recomendada): a penalidade desconta da RD que a pessoa tem contra
  cada tipo do grupo, inclusive a que vem da RD Geral. A RD total contra o tipo nunca fica abaixo de zero.
- Só a RD por Tipo, que não fica negativa: como antes. A penalidade só tira de RD por Tipo que a pessoa já
  tenha naquele tipo. Sem RD por Tipo, ela não faz nada.

**Resposta.** **A RD total contra aqueles tipos.**

⚠ **Essa mudança vale para os dois sistemas e para qualquer fonte de RD por Tipo negativa**, e não só para
o Encantamento. O hover da RD mostra a parcela "RD não fica negativa" quando o total foi aparado.

---

## 5. Itens de Custo

### 19. Área e Alcance

**Contexto.** A tabela de cada Custo tem as linhas "Área" (1,5 / 3 / 4,5 / 6m) e "Alcance" (6 / 9 / 12 /
15m). Os tópicos de cada Custo dizem *"Caso seja um Item arremessável ele tem alcance de 6m"* (6 / 9 / 12
/ 18m) e *"Se houver área para afetar ele possui uma área de 4,5m"* (4,5 / 6 / 9 / 12m). Os números não
batem.

**Opções.**
- **Tabela é bônus, tópico é o item** (recomendada): a linha da tabela é o efeito que o item pode dar, e
  o tópico é a área e o alcance do próprio item.
- Vale a tabela.
- Vale o tópico.

**Resposta.** **Tabela é bônus, tópico é o item.**

Na primeira rodada o autor pediu para responder depois, porque precisava ler. A resposta veio na segunda
rodada.

### 29. Como o Item de Custo vale na ficha

**Contexto.** A tabela dos Itens de Custo mistura bônus permanentes (PV Máximo, PE, Atributo, Treino) com
efeitos de uso (Cura, Curar Condição, Reduzir Exaustão). O guia fala em *"itens ativos"* no Custo 4. Hoje a
Ficha Final não tem ação de "usar item": o consumível é só uma entrada do inventário com quantidade.

**Opções.**
- **Escolha por item: Passivo ou Ativo** (recomendada): o Passivo vale enquanto equipado e soma no
  número da ficha. O Ativo é de uso, aparece pronto na Ficha Final e pede Arremessável ou Área.
- Pela categoria: Acessório é Passivo, e Espiritual, Fármaco, Mistura e Talismã são Ativos.
- Todo item é Passivo.

**Resposta.** **Escolha por item: Passivo ou Ativo.**

### 30. O que o item Ativo faz na Ficha Final

**Opções.**
- **Mostra pronto, a mesa aplica** (recomendada): o item aparece com o efeito calculado, e a quantidade
  continua descontada à mão, como hoje.
- Botão Usar que aplica: desconta 1 da quantidade e aplica na sessão (cura no PV, bônus temporário,
  duração). É sistema novo na Ficha Final e no Encontro.

**Resposta.** **Mostra pronto, a mesa aplica.**

### 31. O que "Especificar" abre em Acerto e em CD

**Contexto.** A ficha do Afty tem uma CD só.

**Opções.**
- **Tipo de ataque, e a CD única** (recomendada): Acerto escolhe Corpo a Corpo, A Distância ou
  Amaldiçoado, e a CD vale na CD da ficha.
- Uma arma do inventário, e a CD única.
- Texto livre nos dois.

**Resposta.** **Tipo de ataque, e a CD única.**

### 32. A Cura com os dados do descanso

**Contexto.** O guia dá *"4 dados dos seus dados de cura do descanso longo ou +10 de cura/PV temporária
fixa"* no Custo 1, 8 dados ou +20 no 2, 12 dados ou +40 no 3, e no 4 *"maximiza a PV ou a quantidade de PV
temporária"*. A ficha não tem "dados de cura do descanso longo".

**Primeira rodada, opções.** Só o valor fixo por agora (recomendada) / Os dois, com um campo novo na
ficha / Dados como texto.

**Primeira resposta.** "Anota isso por enquanto, ainda não programamos os Dados de Cura por descanso"

**Segunda rodada, para confirmar.** Enquanto os dados não existem, o item de Cura sai com o valor fixo?
Opções: Sim, fixo agora e dados anotados (recomendada) / **Não, a Cura fica toda para depois**.

**Resposta.** **Não, a Cura fica toda para depois.** O efeito Cura não aparece nos Itens de Custo.

### 33. Onde o Dano do item Passivo soma

**Opções.**
- **Num tipo de ataque** (recomendada): Corpo a Corpo, A Distância ou Amaldiçoado, em toda linha de dano
  daquele tipo.
- Em toda linha de dano.
- Numa arma escolhida.

**Resposta.** **Num tipo de ataque.**

### 34. Aplicar Condição

**Contexto.** *"Caso o Item aplique uma condição ele possui apenas 3 dados para condições Fracas e Médias
e ela dura apenas 1 rodada."* A ficha não tem o texto das condições, e não está claro o que são os "3
dados".

**Opções.** Fica como texto (recomendada) / **Fora desta fase**.

**Resposta.** **Fora desta fase.**

### 35. Totem ou Selo

**Contexto.** *"Caso seja um totem ou selo, ele tem 10 de PV, 10 de defesa e concede bônus em uma área de
4,5m."* (20/15/6m no Custo 2, 30/20/7,5m no 3, 40/25/9m no 4).

**Opções.** **Terceira forma do Ativo** (recomendada): mostra PV, Defesa e área prontos, e o bônus nos
aliados da área fica com a mesa / Fora desta fase.

**Resposta.** **Terceira forma do Ativo.**

### 36. Quem escolhe a forma

**Contexto.** *"Ao adicionar um efeito, você deve escolher se ele é arremessável (Tem alcance) ou tem
Área."*

**Opções.** **Só o Ativo** (recomendada): o Passivo vale em quem equipa e não tem forma / Todo item
escolhe.

**Resposta.** **Só o Ativo.**

### 37. Os efeitos sem sistema na ficha

**Pergunta.** Quais entram como texto nesta fase? (várias escolhas: Tipo de Percepção, Brinco
Comunicador, Reduzir Exaustão, Curar Condição)

**Resposta.** "Guarde isso no arquivo falando que não foi implementado."

Nenhum dos quatro foi implementado. Ver a seção "O que NÃO foi implementado" abaixo.

### 38. Alcance e Área (bônus), Maximizar Atributo e Mudar Tipo de Dano

**Pergunta.** Estes três também não têm canal. Quais entram como texto? (várias escolhas: Alcance e Área
como bônus / Maximizar Atributo / Mudar Tipo de Dano)

**Resposta.** Marcados **Maximizar Atributo** e **Mudar Tipo de Dano**, com a nota: "Maximizar Atributo já
existe "Talismã do Apice" e deveria estar programado".

Alcance e Área como bônus ficaram fora.

### 39. Programar o Talismã do Ápice

**Contexto.** O item do livro diz *"Ao usar o talismã, o valor de um atributo a sua escolha se torna 30
durante um minuto (10 rodadas dentro de um combate) e ele se quebra."* Estava só como texto. O guia tem
*"No custo 4 itens ativos podem maximizar um atributo por 10m ou 10 rodadas."*, que é a mesma regra.

**Opções.** **Sim, na fase 3** (recomendada): um interruptor na aba Buffs da Ficha Final e do Encontro,
com a escolha do atributo / Anotar e fazer depois.

**Resposta.** **Sim, na fase 3.**

### 40. "se torna 30"

**Opções oferecidas.** Vira 30, e bônus por cima seguem o teto de sempre (30, ou 32 com fura-teto)
(recomendada) / Vira 30 exato, nada soma por cima / Vira o maior entre 30 e o atual.

**Resposta.** "Vira 30, se possuir a Habilidade Lendaria que aumenta em +2. Fica como 32."

A Habilidade Lendária é o **Aperfeiçoamento de Atributo**, a única entrada do sistema que passa do teto
de 30.

### 41. A duração do Ápice

**Opções.** **Conta 10 rodadas e desliga sozinho** (recomendada) / Interruptor manual.

**Resposta.** **Conta 10 rodadas e desliga sozinho.**

### 42. "e ele se quebra"

**Opções.** **Não, a quantidade é à mão** (recomendada) / Sim, ligar desconta 1 do inventário.

**Resposta.** **Não, a quantidade é à mão.**

---

## 6. Texto do guia

### 20. Trechos que parecem com erro

**Contexto.** Três trechos parecem cortados ou com erro: *"+no em uma Perícias"* (Revestimentos), *"sem a
necessidade."* (Interação com Técnica Inata) e *"DesArmado"* (Armas).

**Pergunta.** Transcrevo como está, ou há versão corrigida?

**Resposta.** "Transcreva como está, quando eu achar o problema peço eu peço para vc corrigir"

---

## 7. Decisões de implementação que NÃO foram perguntadas

Escolhas feitas durante o código, a partir das respostas acima. Nenhuma foi perguntada ao autor, e todas
podem ser contestadas.

### Pacote

- **A trava entre os dois Addons é por ficha, e não por biblioteca.** A máquina guarda os dois pacotes,
  e uma mesa pode ter um personagem com cada um. Na aba Addons o segundo não liga.
- **A trava é simétrica**: basta um dos dois pacotes declarar o outro, porque as cópias antigas da
  Criação de Armas nunca vão declarar nada.
- Uma ficha importada que já tenha os dois abre normalmente e mostra um aviso.

### Revestimentos e Escudos

- **Revestimento e Escudo criados sem o Addon** continuam no inventário, marcados como equipados, e
  param de dar Defesa, RD, penalidade e bônus. Os espaços continuam contando.
- **A troca começa no Custo 2**, porque o texto troca o "aumento" de Defesa, e o Custo 1 não tem aumento.
- **A penalidade sai da Defesa que sobrou**, pela fórmula *"(Valor do Bônus de Defesa do Revestimento -
  2)"*. O exemplo do autor (Custo 4 com troca fica com -4) confirma.
- As duas escolhas da troca não se repetem, mas duas RD por Tipo contra tipos diferentes podem.
- O escudo criado ocupa 2 espaços (regra geral de carregamento), causa dano de Impacto (como os escudos
  do livro) e ocupa uma mão.
- **O Sob Medida do livro continua com o número dele.** No jogador ele é Custo 2 com Defesa 1, e um
  Revestimento criado de Custo 2 com a troca fica com Defesa 2.
- Criar um item no card não o põe no inventário. É preciso adicioná-lo pelo catálogo, como o Acessório
  Único.

### Armas

- **O grupo "Tiro" é o que o guia chama de Armas de Fogo.** Ao escolher Tiro, o Emperrar entra sozinho e
  fica travado. A Recarga pede o valor e mostra aviso até ser marcada.
- **A Estabilidade não é oferecida.** Ela veio com a Criação de Armas e não está no guia. Arma que já a
  tenha gravada recebe aviso.
- **O tipo de dano fica restrito aos Físicos** (*"o qual deve ser Físico"*). Tipo que não seja Físico dá
  aviso.
- **Sem nenhuma redução, o dado é o impresso na tabela.** O Custo 4 continua `3d10`, e não vira o degrau
  equivalente da escada de Níveis de Dano.
- **O dado nunca desce abaixo do degrau "1"** da escada, e propriedade demais dá aviso.
- **A coluna de alcance usa o grau REAL da Ferramenta**, e não o grau de cálculo (na criatura, cada
  encantamento desce o grau de cálculo, e isso é preço de Acerto, Dano, Defesa e RD).
- **A arma de Dano Desarmado entra no grupo Pugilato**, sem dado próprio, e vira o Ataque Básico, como as
  Faixas.
- **O treino da Propriedade Especial é sempre "Treinado"**, nunca Mestre, e nunca rebaixa o que a ficha
  já tinha.
- **O Integridade fica fora do seletor de Teste de Resistência**, como no resto do sistema.
- **O +2 de Dano da Propriedade Especial vale só na linha da própria arma.**
- Os efeitos da Propriedade Especial valem enquanto a arma está **equipada**.
- Com o Addon, a **arma nova já nasce com a conta ligada**. Desligar a conta grava o dado calculado na
  arma, para ela não voltar a um dado digitado antigo.
- A Recarga [1] (*"área de 3m em volta de seu alvo"*, *"sempre é Ação Completa"*) e a Especial junto de
  Recarga (*"aumenta de Ação Bônus para Comum"*) aparecem como resultado na bancada, sem mecânica de
  área nem de ação.

### Itens de Custo

- **Um efeito por item**, como o guia diz (*"você pode apenas aplicar um dos efeitos"*).
- **O item Passivo só vale equipado.** O Ativo não precisa estar equipado para aparecer.
- **PV Máximo e Atributo do Passivo entram pelo mesmo caminho dos itens do livro**: o PV antes da Alma, e
  o Atributo podendo passar o limite do atributo até 30.
- **Perícia (Especificar) não oferece Ofício**, e Ofício (Especificar) oferece só os Ofícios da ficha.
- **Treinamento concede "Treinado" e Mestre concede "Mestre"**, na quantidade de perícias que a tabela
  dá (1, 2 ou 4 no Treinamento, 1 ou 2 no Mestre), sem repetir perícia.
- **O Integridade fica fora do seletor de TR.**
- **O Ataque Básico conta como Corpo a Corpo** para o Dano do item, porque ele rola sempre assim.
- **Mudar Tipo de Dano é cumulativo**: o Custo 2 também muda para Elemental, e o 3 e o 4 também para
  Biológico.
- **Mudar Tipo de Dano e Maximizar Atributo só existem no item Ativo.**
- **A categoria decide os espaços** pela regra de carregamento de sempre (Acessório 1, os outros 0,5).
- **Sem o Addon** o item continua carregado, deixa de contar, e o item criado que maximiza atributo deixa
  de abrir o Ápice.

### Talismã do Ápice

- **Basta carregar o talismã** para o estado aparecer. Ele não precisa estar equipado.
- **O Ápice só vale com o combate ativo**, porque a ficha zera todo estado fora de combate. O "um minuto"
  fora de combate fica com a mesa.
- **Trocar o atributo com o Ápice ligado mantém a contagem de rodadas.**
- **Encerrar o combate e descansar desligam o Ápice.**
- **Um estado só por ficha**, mesmo carregando dois talismãs.
- **Respeita limite de Addon**: se um Addon fixar o teto de um atributo abaixo de 30, o Ápice para nele.

### Encantamento de Grau Especial

- **O valor cheio de um efeito é o modificador dividido pelo divisor da tabela, para baixo, e nunca
  negativo.** Com Mod. -1 a Defesa fica 0, e não -1 (*"(Mínimo 0)"*).
- **Deslocamento anda de 1,5m em 1,5m**: o valor é 1,5 × (Mod / 2), e a divisão divide os degraus, e não
  os metros.
- **O primeiro efeito sempre vale cheio e nunca traz penalidade.** A escolha entre dividir e penalidade só
  aparece a partir do segundo.
- **A divisão conta os efeitos que não trouxeram penalidade**, o primeiro sempre incluído, e a melhoria de
  Encantamento Padrão também (pergunta 53).
- **A penalidade vale -(BT / 2), para baixo**, na linha escolhida da tabela. No Deslocamento ela é -1,5 ×
  (BT / 2) metros. Níveis de Dano, Crítico e Ignorar RD como penalidade miram a arma, como os efeitos.
- **A ficha não confere se a penalidade "faz sentido"** (*"a escolha de penalidade deve fazer sentido ao
  efeito adicionado"*). Qualquer linha implementada da tabela pode ser a penalidade, e a mesa julga.
- **A penalidade pode cair num tipo que já é efeito** (uma Defesa de efeito e outra de penalidade). O
  *"Efeitos adicionados não podem ser repetidos"* foi lido só para os efeitos.
- **Uma melhoria só por Ferramenta.** "Melhorar Encantamento Padrão" conta como um tipo de efeito, e
  efeito não se repete. Duas melhorias em encantamentos diferentes não são oferecidas.
- **"Perícia (Grupo do Atributo)" usa o mesmo atributo para o valor e para o grupo.** Com Destreza, o bônus
  é Mod. de Destreza / 2 nas perícias de Destreza.
- **"Iniciativa e Atenção" dá o mesmo valor às duas.**
- **O Integridade fica fora do seletor de TR**, como no resto do sistema.
- **"Dobrar Valor" dobra todo número que o Motor calcula no encantamento**, inclusive o bônus de Acerto,
  a redução de penalidade e a RD do Reforçado. **"Dobrar Usos" é só registro**: os usos de encantamento
  continuam à mão.
- **O seletor da melhoria mostra só os encantamentos do próprio item**, sem Potente e Sintonizada. Uma
  receita gravada que aponte um dos dois dá aviso e não dobra nada.
- **A Conta do Guia só aparece com o Addon**, mas a receita gravada continua valendo sem ele. É o molde de
  todo `permite`: muda a tela, e nunca o número.
- **Uma receita incompleta avisa e não gera nada**: efeito sem atributo, sem Teste de Resistência ou sem
  categoria, e penalidade sem tipo, sem alvo ou sem atributo.
- **O Feitiço vinculado é um Feitiço da própria ficha.** Os avisos são os do guia: tipo (Auxiliar,
  Transformação, Cura ou Dano), Nível 5, e condição Forte ou Extrema. O Feitiço de Cura não recebe o aviso
  de condição, porque nele as condições da ficha são as que ele **remove**. Feitiço apagado da ficha dá
  aviso.
- **Os usos são metade do BT, para baixo**, e viram um contador na aba Buffs com o nome "Feitiço (Item)",
  de 0 até os usos. O contador só existe com o item **equipado**, **volta a zero só no Descanso**, e não
  na virada de rodada nem ao encerrar o combate.
- **O Alcance da Ferramenta, o "não podem receber benefícios de pré-requisito" e o Duradouro do Auxiliar
  não são conferidos.** A bancada mostra "Ação de Conjurar" e, no Auxiliar, "Duradouro" com as rodadas, e
  o texto do guia fica no `title`.

---

## 8. Achados de passagem

- **As armas do livro não cabem na métrica do guia.** Medido com as leituras acima: só 15 das 46 armas
  com dado batem. A métrica serve para criar arma nova, e não para conferir o catálogo.
- **O painel de Encontros mostra só a RD Geral.** No jogador a RD do escudo cai na RD Física, então uma
  personagem com escudo aparece com RD 0 no Encontro. Vale para os escudos do livro também. Está na fila
  em `docs/a-fazer.md`, sem conserto.
- **A RD por Tipo negativa sumia sem aviso** antes da pergunta 54. Qualquer fonte que tirasse RD por Tipo
  (e não só o Encantamento) era aparada em zero antes da soma.

---

## 9. O que NÃO foi implementado

Registro pedido pelo autor. Estes efeitos dos Itens de Custo não aparecem no seletor. As linhas continuam
no código (`implementado: false`) e na fila (`docs/a-fazer.md`).

| Efeito | Por quê |
|---|---|
| Cura e PV Temporário | a ficha não tem os Dados de Cura por descanso (perguntas 32) |
| Condição | falta o sistema de condições, e os "3 dados" não estão explicados (pergunta 34) |
| Curar Condição | falta o sistema de condições (pergunta 37) |
| Tipo de Percepção | sem sistema na ficha (pergunta 37) |
| Brinco Comunicador | sem sistema na ficha (pergunta 37) |
| Reduzir Exaustão | sem sistema de cena na ficha (pergunta 37) |
| Alcance e Área como bônus | não há canal de alcance nem de área (pergunta 38) |

Do Encantamento de Grau Especial, guardados até outro colaborador revisar as respostas (pergunta 52):

| Trecho | Por quê |
|---|---|
| Alcance (1,5 × Mod / 2) | não há canal de alcance. A linha continua no código com `implementado: false` |
| Tipo de Dano da Técnica | a ficha não guarda um tipo de dano principal da técnica |
| Interação com Aptidões | os seis exemplos do guia são combinados com o Narrador |
| "Dobrar Usos" da melhoria | só registro, os usos de encantamento são à mão (pergunta 49) |
| Melhoria de encantamento que é texto | não há número para dobrar, e a mesa aplica (pergunta 49) |

---

## 10. O que ainda falta perguntar

Nenhuma pergunta de desenho em aberto. O que falta é revisão:

- **As respostas das perguntas 43 a 54**, que o autor pediu para outro colaborador conferir.
- **Os três trechos guardados da pergunta 52** (Alcance, Tipo de Dano da Técnica e Interação com Aptidões),
  que esperam essa revisão para voltar à fila.
- **As decisões da seção 7**, que nunca foram perguntadas.
