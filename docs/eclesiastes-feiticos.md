# Eclesiastes: Criando Feitiços (rework por pontos de distribuição)

Texto do autor recebido em 2026-11-22 (`Rework de Feitiços.md`, pasta contêiner), copiado na íntegra. É a fonte da aba de Feitiços das fichas de Eclesiastes, implementada em `src/systems/eclesiastes/feiticos/`. As decisões de leitura e os furos achados estão em `docs/a-fazer.md`, seção "Eclesiastes: Feitiços por pontos".

---

# CRIANDO FEITIÇOS

Com o Funcionamento Básico de sua Técnica Amaldiçoada definido, você pode começar a traduzir suas capacidades em Feitiços. Ao criar um deles, você escolhe quanta Energia Amaldiçoada gasta para conjurá-lo e qual ação utiliza. Os pontos de distribuição são usados para montar o restante do Feitiço, comprando seus dados de dano ou cura, efeitos auxiliares, alcance, área e duração.

## DEFININDO O CUSTO DO FEITIÇO

O primeiro passo é escolher o **ND do Feitiço**, que pode ir de 1 até o seu nível de personagem. Esse ND é o custo-base do Feitiço em Pontos de Energia Amaldiçoada, pago em PE na conjuração.

Para saber quantos pontos você tem para montar o Feitiço, some o ND a **duas vezes seu Bônus de Treinamento (BT)**. Esse é o valor inicial que você pode distribuir entre as compras do Feitiço. A ação escolhida e os requisitos para conjurá-lo podem alterar esse total.

 ## AÇÃO UTILIZADA

Normalmente, conjurar um Feitiço requer uma Ação Comum. Caso queira utilizar outra ação, faça essa escolha na criação e ajuste os pontos disponíveis de acordo com a ação escolhida.

| AÇÃO UTILIZADA | AJUSTE NA DISTRIBUIÇÃO |
| --- | --- |
| Ação Bônus | Reduz os pontos disponíveis em um valor igual ao BT. |
| Ação Comum | Usa o orçamento inicial. |
| Ação Completa | Aumenta os pontos disponíveis em um valor igual ao BT. |
| Reação | Usa o orçamento inicial. |

Para conjurar um Feitiço como ritual, siga a seção Conjuração em Ritual. Feitiços Destrutivos e Cataclísmicos também seguem as regras de seus tipos.

## DEFININDO REQUISITOS PARA O FEITIÇO

Quando criar um Feitiço, você pode incluir pré-requisitos ou desvantagens que limitem seu uso. Cabe ao Mestre avaliar a dificuldade de cada exigência para o personagem. É possível colocar mais de uma no mesmo Feitiço, somando os pontos adicionais de todas as exigências que o Mestre aprovar.

| DIFICULDADE DO REQUISITO | PONTOS ADICIONAIS PARA DISTRIBUIR |
| --- | --- |
| Fácil | 2 |
| Médio | 4 |
| Difícil | 6 |
| Impossível | 10 |

Os pontos da tabela são usados na criação. Para conjurar o Feitiço, você precisa atender a todos os pré-requisitos que colocou nele.

## FADIGA E EXAUSTÃO NA CONJURAÇÃO

Você também pode criar um Feitiço que cause Fadiga ou Exaustão ao próprio conjurador quando utilizado. Cada ponto de Fadiga concede **1 ponto de distribuição**, e cada ponto de Exaustão que o Feitiço causar diretamente concede **4 pontos de distribuição**.

A Fadiga se acumula até alcançar a metade do seu BT, arredondada para baixo. Quando atingir esse valor, volte a 0 pontos de Fadiga e receba 1 ponto de Exaustão. Caso receba vários pontos de Fadiga de uma vez, aplique um de cada vez.

Você perde um Ponto de Fadiga em um Descanso Curto ou Longo. E, caso possua a aptidão Regeneração Aprimorada, você pode gastar uma Ação Bônus e 2 pontos de Energia Reversa. Para cada 2 pontos gastos, você remove um Ponto de Fadiga.

As penalidades da Exaustão seguem a seção Exaustão do capítulo de Combate. Ao fazer um Descanso Longo, você remove 1 ponto de Exaustão.

## LIBERAÇÃO MÁXIMA

Um feiticeiro pode canalizar mais Energia Amaldiçoada em um Feitiço para conjurá-lo em sua Liberação Máxima. Para usar essa forma, você precisa ter **BT 4 ou superior**.

O custo da conjuração aumenta em uma quantidade de PE igual à **metade do ND base**, arredondada para baixo. Cada PE adicional concede um ponto de distribuição para montar a Liberação Máxima. A Liberação também concede **4 pontos adicionais de distribuição**. Use o ND base para verificar os requisitos do Feitiço.

Ao conjurar o Feitiço dessa forma, você recebe **1 ponto de Fadiga** para cada quantidade completa de PE adicionais igual à metade do seu BT, arredondada para baixo. A Fadiga acumulada pode se converter em Exaustão conforme a regra normal. A Fadiga fornecida pela Liberação Máxima não é contabilizada como pontos adicionais de distribuição, sendo esses os 4 já fornecidos pela Liberação Máxima.

## TÉCNICA MÁXIMA

Ao adquirir a Aptidão Técnica Máxima, você recebe um Feitiço que leva ao limite o funcionamento da sua Técnica Amaldiçoada. Para adquirir a Aptidão, você precisa ser **Mestre em Feitiçaria** e ter **BT 5 ou superior**. O Feitiço recebido deve ter um **ND base de pelo menos 12**.

Uma Técnica Máxima custa uma quantidade de PE para Conjurar igual ao seu **ND base mais o BT do conjurador**. Para montar o Feitiço, você tem uma quantidade inicial de pontos de distribuição igual ao **ND base mais quatro vezes o BT**. Aplique os ajustes de ação e de pré-requisitos normalmente. Caso a Técnica Máxima utilize um tipo especial de Feitiço, cumpra seus requisitos e pague os custos correspondentes.

Você pode conjurar uma Técnica Máxima em **Liberação Máxima**. Calcule os PE adicionais, os pontos de distribuição e a Fadiga da Liberação Máxima a partir do ND base do Feitiço. Some o custo adicional em PE ao custo de conjuração da Técnica Máxima.

Depois de resolver a conjuração, a Técnica Máxima entra em recarga por uma quantidade de rodadas igual a **6 menos metade do BT**, arredondando a metade para baixo, com um mínimo de **2 rodadas**. Calcule a recarga normal antes de aplicar reduções de habilidades. Uma habilidade que reduza essa recarga, como Manual de Técnica, pode levá-la a um mínimo de **1 rodada**. Caso o Feitiço tenha efeitos Duradouros ou Sustentados, a recarga começa quando o último desses efeitos terminar.

# ALCANCE, ALVOS E ÁREAS

## ALCANCE DO FEITIÇO

Por padrão, um Feitiço começa com alcance Próprio ou Toque. Quando o alcance é Próprio, o conjurador é o alvo do Feitiço ou serve como origem de sua área. No caso de um Feitiço de Toque, o conjurador precisa estar perto o suficiente para tocar o alvo.

Caso queira atingir um alvo ou colocar a origem de uma área à distância, você pode comprar **9 metros de alcance por ponto de distribuição**. Meça essa distância a partir do conjurador até o alvo ou até a origem da área. As dimensões da própria área são compradas à parte.

## FEITIÇOS EM ÁREA

Alguns Feitiços afetam uma área inteira. Para criar um deles, gaste uma quantidade de pontos de distribuição igual ao seu BT, uma única vez por Feitiço. Depois, escolha o formato da área e compre suas dimensões conforme a tabela.

| FORMATO | DIMENSÃO POR PONTO DE DISTRIBUIÇÃO |
| --- | --- |
| Linha, Faixa Principal |  4,5 m de comprimento |
| Linha, Faixas Adicionais |    9 m de comprimento somado |
| Cone | 3 m de comprimento |
| Esfera | 3 m de raio |

Uma Linha pode ser composta por uma ou mais faixas retas, cada uma com 1,5 metro de largura. Ao criar o Feitiço, você pode colocá-las lado a lado para alargar a Linha, cruzá-las ou uni-las pelas extremidades. Todas as faixas devem formar uma única área conectada. Defina o formato na criação e marque nele o ponto que servirá como sua origem.

Antes de calcular o preço, conte faixas na mesma reta que se tocam ou se sobrepõem como uma única faixa. **A faixa mais longa é sempre a Faixa Principal.** Caso duas ou mais tenham o maior comprimento, escolha uma delas como Principal. As demais são Faixas Adicionais. Para calcular o preço delas, some seus comprimentos, divida o total por 9 metros e arredonde o custo para cima uma única vez.

Quando conjurar o Feitiço, escolha onde colocar a origem dentro de seu Alcance e em qual direção orientar o desenho. Caso a mesma criatura seja alcançada por mais de uma faixa, ela sofre os efeitos do Feitiço uma única vez por aplicação.

Caso o Feitiço aplique Efeitos Auxiliares em área ou permita aplicar integralmente o mesmo Efeito Auxiliar a vários alvos escolhidos, gaste mais uma quantidade de pontos de distribuição igual ao seu BT. Pague esse custo uma vez por Feitiço, além do preço de cada Efeito Auxiliar comprado. Um mesmo Feitiço pode ter efeitos com alvos distintos. Um efeito pessoal continua tendo o conjurador como alvo mesmo quando outro efeito do Feitiço afeta uma área.

## FEITIÇOS COM MÚLTIPLOS ALVOS E ÁREAS

Certos Feitiços podem afetar várias criaturas à escolha do conjurador, lançar vários disparos ou produzir áreas em pontos diferentes. Uma técnica pode, por exemplo, curar três aliados escolhidos ou lançar duas bolas de fogo em direções diferentes.

Para criar um Feitiço desse tipo, gaste um número de pontos de distribuição igual ao seu BT e defina se ele usará alvos escolhidos, disparos, áreas ou uma combinação deles. Compre o Alcance uma vez para o Feitiço inteiro. Caso o Feitiço use áreas, pague o custo de habilitar Área uma única vez e compre as dimensões de cada área separadamente.

Ao conjurar o Feitiço, conte cada alvo escolhido, cada disparo e cada área para um mesmo limite, igual ao seu BT. Escolha as criaturas e posicione a origem de cada área dentro do Alcance do Feitiço antes de realizar as rolagens. O formato de cada área determina quais criaturas ela atinge.

### DISTRIBUINDO OS EFEITOS

Escolha quais alvos, disparos ou áreas recebem cada efeito. Some os dados adicionais que se aplicam à conjuração inteira aos dados de dano ou de cura correspondentes. Em seguida, divida os dados de dano igualmente entre os alvos, disparos ou áreas que causarão dano e faça o mesmo com os dados de cura. Caso sobrem dados de uma divisão, distribua um dado a mais por alvo, disparo ou área até usar todos. Cada criatura atingida por uma área recebe a parcela de dano ou cura destinada àquela área.

Os Efeitos Auxiliares conservam a intensidade e a duração escolhidas na criação. Se o efeito foi comprado para uma só criatura, escolha qual delas o recebe antes de rolar. Para aplicar o efeito inteiro a várias criaturas escolhidas ou a uma área, pague o custo adicional de Efeitos Auxiliares em área na criação do Feitiço.

### RESOLVENDO OS EFEITOS

Quando mais de uma parte do Feitiço atingir a mesma criatura em uma aplicação, reúna todos os dados de dano destinados a ela e faça o mesmo, separadamente, com os dados de cura. Some o Dano Fixo aplicável uma única vez ao dano total e, em seguida, aplique a Redução de Dano uma única vez. Cada Efeito Auxiliar e cada gatilho do Feitiço é resolvido uma vez por criatura em cada aplicação, mesmo que ela seja alcançada de mais de uma forma.

Se o Feitiço exigir um Teste de Resistência contra o dano, cada criatura faz um único teste para resolver todo o dano e os debuffs que o acompanham. Se o Feitiço usar uma jogada de ataque, faça uma única jogada e compare o resultado com a Defesa de cada alvo. Para cada acerto, resolva primeiro o dano e depois o Teste de Resistência de cada debuff aplicável.

### FEITIÇOS DE MÚLTIPLOS DISPAROS

Existem Feitiços que lançam vários projéteis de uma só vez, como uma rajada de agulhas ou um raio que se divide. Cada disparo é dirigido a uma criatura, precisa receber pelo menos um dado de dano e é resolvido pelas regras de jogada de ataque acima. Você pode separar os disparos entre criaturas diferentes ou concentrá-los no mesmo alvo.

Por exemplo, um Feitiço de 12d8 dividido em quatro disparos causa 3d8 por disparo. Se os quatro disparos acertarem criaturas diferentes, cada uma sofre 3d8 mais o Dano Fixo aplicável. Se dois disparos acertarem a mesma criatura, ela sofre 6d8 mais o Dano Fixo uma única vez e aplica sua Redução de Dano ao total.

Para habilidades que consultam a classificação do Feitiço, trate um Feitiço de Múltiplos Disparos como um Feitiço em Área.

# CRIANDO FEITIÇOS DE DANO E CURA

## COMPRANDO DADOS

Ao montar um Feitiço de Dano ou Curativo, você pode comprar quantos dados couberem nos pontos disponíveis, gastando **1 ponto de distribuição por dado**. O Bônus de Treinamento do personagem define qual dado será utilizado, conforme a tabela.

| BÔNUS DE TREINAMENTO | DADO DE DANO E CURA |
| --- | --- |
| +2 a +4 | d8 |
| +5 a +6 | d10 |
| +7 ou superior | d12 |

Você pode combinar dados de dano ou cura com Efeitos Auxiliares. Também é possível dedicar os pontos do Feitiço aos Efeitos Auxiliares e criar um Feitiço composto somente por eles.

## CURA E PONTOS DE VIDA TEMPORÁRIOS

Para que um Feitiço Curativo recupere Pontos de Vida, é necessário que o conjurador possua a Aptidão Energia Reversa. Caso o conjurador esteja sem essa Aptidão, o Feitiço concede Pontos de Vida Temporários em um valor igual ao da cura.

## RESOLUÇÃO DE DANO E DEBUFFS

Quando um Feitiço de Dano que exige um Teste de Resistência também aplica um debuff, o alvo faz um único teste. Utilize o resultado para calcular o dano conforme as regras de Teste de Resistência e aplique o debuff caso o alvo falhe.

Quando um Feitiço reúne dano e debuff em uma jogada de ataque, resolva primeiro o ataque. Em caso de acerto, resolva o dano e, em seguida, o alvo faz o Teste de Resistência do debuff. O efeito é aplicado caso o alvo falhe nesse teste.

O dano causado por Feitiços não são multiplicados ou alterados de qualquer forma por acertos críticos ou falhas críticas na resistência.

## FEITIÇOS DE DANO E CURA CONTÍNUOS

Alguns Feitiços causam dano ou curam ao longo de várias rodadas, como chamas que continuam queimando ou uma técnica que fecha um ferimento aos poucos. Esses são os Feitiços de Dano Contínuo e de Cura Contínua.

Ao criar um desses efeitos, compre pelo menos dois dados de dano ou cura para ele e escolha se será Duradouro ou Sustentado. Siga as regras da duração escolhida, incluindo o benefício correspondente caso o efeito exija Concentração.

Na conjuração, use todos os dados comprados para o impacto inicial. A partir da segunda rodada, role uma vez por rodada metade da quantidade de dados do impacto inicial, arredondada para baixo, mantendo o tamanho dos dados. Para o Dano Contínuo, conte todos os dados adicionais que fizerem parte do dano inicial, independentemente da fonte. Por exemplo, um Feitiço que cause 5d8 no impacto inicial causa 2d8 por rodada enquanto o efeito durar.

O **Dano Contínuo** só é aplicado caso o alvo seja acertado pelo ataque ou falhe no Teste de Resistência inicial. A Redução de Dano (RD) se aplica apenas ao dano inicial. Mesmo que a RD reduza esse dano a zero, o efeito é aplicado se o ataque acertar ou o alvo falhar no teste.

Ao criar o Feitiço, você pode permitir que o alvo faça um Teste de Resistência para encerrar o Dano Contínuo. Escolha na criação qual resistência será usada. Uma criatura sob o efeito faz esse teste depois de resolver o Dano Contínuo de cada rodada. Em caso de sucesso, o efeito termina para ela. A resistência desse teste pode ser diferente da usada contra o impacto inicial.

A **Cura Contínua** é aplicada na conjuração e uma vez por rodada a partir da segunda, enquanto o efeito durar.

Se o efeito for Vinculado, o dano ou a cura das rodadas seguintes afeta a mesma criatura. Se for em Zona, sua área determina quais criaturas podem ser afetadas a cada rodada.

Esses Feitiços podem causar condições, porém, condições seguem suas regras de duração normalmente, e não são reaplicadas continuamente. O Teste para sair de uma condição é realizado junto com o teste encerrar o Dano Contínuo. Efeitos que se aplicam em técnicas como Explosão Encadeada também se aplicariam no dano sustentado.

## FEITIÇOS VAMPÍRICOS

Certos Feitiços de Dano permitem que o conjurador drene a vida de suas vítimas. Para tornar um Feitiço Vampírico, gaste uma quantidade de pontos de distribuição igual ao seu BT durante a criação. Você pode combinar o dreno com outros tipos de Feitiço de Dano, incluindo os Destrutivos, Cataclísmicos e de Dano Contínuo, seguindo as regras de cada tipo.

Um Feitiço Vampírico pode ser conjurado como Ação Bônus, Comum ou Completa. Também é possível conjurá-lo por Ritual Estendido quando usado como Feitiço Destrutivo, Cataclísmico ou pelas regras de Conjuração em Ritual. Você pode conjurar **um Feitiço Vampírico por rodada**.

O dreno é calculado a partir dos Pontos de Vida efetivamente perdidos depois de aplicar a Redução de Dano, Resistências e Imunidades. Quando o Feitiço atingir mais de uma criatura, como em um Feitiço em Área, some a perda de todos os alvos que podem ser drenados. O conjurador recupera **um terço do total**, arredondado para baixo. O Mestre decide se é possível drenar a vida de uma criatura robótica ou semelhante.

Caso o conjurador esteja sem a Aptidão Energia Reversa, o dreno concede Pontos de Vida Temporários no mesmo valor. Esses Pontos de Vida Temporários se acumulam até o limite geral de metade dos Pontos de Vida máximos do conjurador.

Em um Feitiço Vampírico de **Dano Contínuo**, resolva o dreno no impacto inicial e novamente a cada rodada em que o Feitiço causar dano, calculando separadamente a perda de Pontos de Vida em cada aplicação. Para conjurar outro Feitiço Vampírico, é preciso que o efeito contínuo anterior do mesmo conjurador tenha terminado em todos os alvos e zonas.

## FEITIÇOS DESTRUTIVOS

Certos Feitiços são capazes de destruir o cenário ao redor de seus alvos, abrindo crateras ou arruinando estruturas. Para criar um Feitiço Destrutivo, você precisa ter **BT 5 ou superior** e escolher um **ND de pelo menos 12**. O Feitiço sempre afeta uma área e segue o custo normal para habilitar Área e comprar suas dimensões.

Um Feitiço Destrutivo sempre é conjurado por **Ritual Estendido**. Na criação, ele recebe o aumento de pontos de distribuição de uma Ação Completa, igual ao seu BT. Todas as criaturas na área, incluindo os aliados, estão sujeitas aos efeitos do Feitiço. Efeitos que encurtem a conjuração ou poupem alvos dentro da área são incompatíveis com ele.

O impacto inicial recebe uma quantidade de **dados de dano adicionais igual ao seu BT**, do mesmo tamanho que os demais dados de dano do Feitiço. Para ampliar a área, o Feitiço também recebe pontos de distribuição adicionais iguais à metade dos pontos comprados para as dimensões da área, arredondada para baixo. Use esses pontos adicionais nas dimensões da área durante a criação.

As criaturas afetadas realizam com desvantagem o Teste de Resistência contra o impacto inicial, quando houver. O piso atingido se torna Terreno Difícil enquanto os estragos persistirem. O Mestre determina as demais consequências da destruição conforme o cenário atingido.

É possível comprar efeitos adicionais para o impacto inicial de um Feitiço Destrutivo.

- **Ignorar Resistências.** Gaste uma quantidade de pontos de distribuição igual ao seu BT para que o dano do impacto inicial ignore todas as Resistências a dano e a RD redutível. A RD Irredutível, as Imunidades e o Teste de Resistência continuam se aplicando.
- **Morte Direta.** Um Feitiço Destrutivo de ND 20 ou superior pode comprar este efeito por 2 pontos de distribuição. Uma criatura reduzida a 0 Pontos de Vida pelo impacto inicial morre imediatamente.

## FEITIÇOS CATACLÍSMICOS

Alguns Feitiços devastam todo o mapa de combate. Para criar um Feitiço Cataclísmico, você precisa ter **BT 6 ou superior**, escolher um **ND de pelo menos 18** e incluir ao menos um pré-requisito **Difícil** ou **Impossível**. Cada pré-requisito concede os pontos de distribuição correspondentes à sua dificuldade.

Um Feitiço Cataclísmico sempre é conjurado por **Ritual Estendido**. Na criação, ele recebe o aumento de pontos de distribuição de uma Ação Completa, igual ao seu BT. Sua área abrange todo o mapa de combate definido no início do ritual. Os aliados dentro dessa área também estão sujeitos ao Feitiço. Efeitos que encurtem a conjuração ou poupem alvos dentro da área são incompatíveis com ele.

Para criar o Cataclísmico, gaste **três vezes seu BT em pontos de distribuição**. Esse custo inclui habilitar Área, estendê-la a todo o mapa e conceder os efeitos de Ignorar Resistências e Morte Direta. O tamanho do mapa determina a área do Feitiço, dispensando a compra de alcance e dimensões.

O impacto é Imediato e recebe dados de dano adicionais em quantidade igual a **uma vez e meia o seu BT**, arredondada para baixo, do mesmo tamanho que os demais dados de dano do Feitiço. As criaturas afetadas fazem o Teste de Resistência com desvantagem. Em caso de sucesso, recebem metade do dano. O impacto ignora Resistências a dano e RD redutível. A RD Irredutível e as Imunidades continuam se aplicando. Uma criatura reduzida a 0 Pontos de Vida por esse impacto morre imediatamente.

Ao concluir o ritual, o conjurador sofre **dano igual a um terço do dano rolado no impacto**, arredondado para baixo (Esse dano não pode ser reduzido). Esse dano é aplicado aos Pontos de Vida atuais uma única vez, como efeito do Feitiço sobre o próprio conjurador. Resolva o dano em si antes de aplicar o dano aos demais alvos. Caso o Feitiço também seja Vampírico, resolva o dreno depois do dano.

O piso atingido em um raio de até **45 metros do conjurador** se torna Terreno Difícil enquanto os estragos persistirem. O Mestre determina as demais consequências conforme o cenário atingido.

Você também pode criar um Feitiço Cataclísmico com Dano Contínuo. Siga as regras de duração e aplicação do Dano Contínuo e conte os dados adicionais do Cataclísmico ao calcular o dano das rodadas seguintes.

# CRIANDO FEITIÇOS AUXILIARES

Os Efeitos Auxiliares permitem beneficiar aliados ou impor penalidades aos inimigos. Você pode montar um Feitiço com um único Efeito Auxiliar ou combinar vários no mesmo Feitiço. Cada efeito é comprado separadamente, com seu próprio alvo, intensidade.

Um bônus é concedido diretamente a quem o recebe. Para impor um debuff, o alvo deve realizar um Teste de Resistência, sofrendo o efeito se falhar. Enquanto estiver sob o efeito, a criatura pode repetir o teste ao final de cada um de seus turnos. Em caso de sucesso, o debuff termina para ela.

Você também pode representar uma condição reunindo os Efeitos Auxiliares negativos que o Feitiço aplica. A descrição do Feitiço pode dar um nome a esse conjunto, e cada efeito que o compõe segue as regras da sua própria compra.

As Condições prontas seguem as regras e os custos da seção Condições.

## TABELA DE CUSTOS DOS EFEITOS AUXILIARES

A tabela indica quanto custa cada unidade de um Efeito Auxiliar, tanto para bônus quanto para debuffs. Normalmente, você pode comprar até uma quantidade de unidades igual ao seu BT para cada efeito. A Margem de Crítico pode chegar à metade do BT, arredondada para baixo, e os Níveis de Dano podem chegar ao dobro do BT.

| EFEITO | UNIDADE | CUSTO EM PONTOS DE DISTRIBUIÇÃO |
| --- | --- | --- |
| Acerto | ±1 | 2 |
| Defesa | ±1 | 2 |
| Teste de Resistência | ±1 em um TR escolhido na criação | 2 |
| Perícia | ±1 em uma perícia escolhida na criação | 1 |
| Grupo Temático de Perícias | ±1 em cada perícia do grupo escolhido na criação | 2 |
| Todas as Perícias | ±1 em cada perícia | 3 |
| Iniciativa | ±1 | 2 |
| Classe de Dificuldade | ±1 | 3 |
| Deslocamento | ±1,5 m | 1 |
| Alcance de ataques corpo a corpo | ±1,5 m | 1 |
| Alcance de ataques à distância | ±3 m | 1 |
| Margem de Crítico | ±1 | 3 |
| Atributo | ±1 no valor de um atributo | 2 |
| Aumento de Limite de Atributo | +1 no limite de um atributo | 2 |
| Aumento de Atributo e Limite | +1 no valor e +1 no limite do mesmo atributo | 3 |
| RD Geral | +2 RD Geral | 1 |
| RD por Grupo de Dano | +3 RD contra um grupo de dano escolhido | 1 |
| RD por Tipo de Dano | +4 RD contra um tipo de dano escolhido | 1 |
| Negação de RD | 2 RD negadas | 1 |
| Nível de Dano | ±1 nível | 1 |
| Dano Fixo | +3 de dano | 2 |

Ao criar um Feitiço que modifique um **atributo**, escolha qual atributo será afetado. Uma mudança no valor do atributo respeita seu limite vigente. Já uma mudança no limite eleva o teto daquele atributo. O BT limita separadamente o total de unidades compradas para o valor e o total comprado para o limite. Enquanto o atributo estiver alterado, recalcule os valores que dependem dele, como a Defesa e os Pontos de Vida máximos, e aplique os bônus ou debuffs que também modificarem esses valores diretamente.

Para a **Redução de Dano**, o máximo concedido é o dobro do BT em RD Geral, o triplo em RD por Grupo e o quádruplo em RD por Tipo. Quando comprar RD por grupo ou por tipo, escolha o grupo ou tipo de dano na criação. Ao receber dano, use apenas o maior valor aplicável entre a RD Geral, a do grupo e a do tipo.

A **Negação de RD** pode chegar ao dobro do BT e pode ser aplicada como bônus ou debuff. Caso seja um bônus, escolha a arma ou o ataque beneficiado. Ao calcular o dano do ataque beneficiado, ignore a quantidade de RD comprada. Caso seja um debuff, o alvo faz um Teste de Resistência e, se falhar, sua RD é reduzida pela quantidade comprada enquanto o efeito durar. Nas duas formas, a RD aplicada ao dano tem como mínimo a RD Irredutível.

Ao modificar o **Nível de Dano** de uma arma, siga a tabela de Níveis de Dano do Livro de Regras para ajustar seus dados. Esses dados fazem parte do dano do ataque e são rolados duas vezes em um acerto crítico.

Você pode aplicar **Dano Fixo** e Níveis de Dano ao mesmo ataque. É possível comprar até uma quantidade de unidades de Dano Fixo igual ao seu BT. Some o Dano Fixo depois de calcular o dano do crítico, quando houver, e antes de aplicar a Redução de Dano.

## REAÇÕES IMEDIATAS

Uma Reação Imediata permite modificar um ataque, Feitiço ou teste que está prestes a ser resolvido. Ela é uma conjuração separada, pela qual você gasta sua Reação e paga em PE o ND do Feitiço de Reação antes da resolução. A Reação Imediata fica reservada a Feitiços sem permuta. A compra do efeito segue seu limite normal. Depois de verificar esse limite, multiplique a intensidade do modificador por 1,5 e arredonde para baixo.

Quando o bônus da Reação e outro bônus de Feitiço modificarem a mesma característica na mesma resolução, aplique apenas o maior. Isso vale para bônus Imediatos, inclusive os comprados no próprio Feitiço, e para os Duradouros e Sustentados.

Você pode usar uma **Reação Defensiva** para aumentar a Defesa contra um único ataque ou para aumentar o Teste de Resistência em uma única rolagem do beneficiado ou aumentar o RD contra um único dano.

Uma **Reação Ofensiva** pode aumentar o Acerto de um único ataque ou Feitiço ou aumentar a Classe de Dificuldade de uma única conjuração ou aumentar o Nivel de Dano, Dano Fixo, Negação de RD de um único ataque ou conjuração. Caso o ajuste ofensivo modifique um Teste de Resistência, ele vale para um único teste.

## FEITIÇOS PERMUTATIVOS

Uma forma de personalizar um Feitiço Auxiliar é transformá-lo em um Feitiço Permutativo. Nesse caso, o Feitiço concede um efeito em troca de uma contrapartida sobre a mesma criatura. O Mestre deve aprovar a troca na criação, considerando a narrativa e a relação entre seus efeitos.

Em um **Permutativo Positivo**, quem aceita a troca recebe o bônus e assume a contrapartida. Quando o efeito é Imediato, a contrapartida começa quando o bônus é utilizado e vai até o início do próximo turno de quem o recebeu.

Já em um **Permutativo Negativo**, o alvo faz um Teste de Resistência contra a troca. Caso falhe, recebe tanto o debuff quanto o benefício concedido como contrapartida.

É possível combinar várias contrapartidas para financiar um mesmo efeito. Some o preço-base de todas elas em pontos de distribuição. **A cada 2 pontos completos em contrapartidas, você ganha 1 ponto de distribuição** para financiar a parte permutativa do efeito. Caso a permuta permita ultrapassar o teto de BT, os pontos da troca financiam a parcela acima desse teto. O efeito pode chegar a uma vez e meia o BT, arredondada para baixo, e também segue seus limites próprios.

Caso a troca exija abrir mão de **Margem de Crítico**, o benefício e a perda devem afetar a mesma arma ou o mesmo ataque. Para fazer essa troca, a arma ou o ataque precisa ter toda a Margem oferecida, preservando o crítico no 20 natural.

Quando a característica já sofre um debuff de outra fonte, a penalidade do Permutativo se soma a esse debuff.

# CONDIÇÕES

Para aplicar uma Condição com um Feitiço, gaste o custo indicado na tabela e siga as regras de aplicação e duração dos Efeitos Auxiliares. Uma Condição pode ser aplicada em área, seguindo as regras de Feitiços em Área. Os preços indicados são em pontos de distribuição.

Ao reunir efeitos em uma Condição, some os preços dos efeitos que puderem atuar separadamente. Quando um efeito cobrir inteiramente outro na mesma aplicação, cobre apenas o mais forte. Quando um efeito só tiver utilidade própria em parte da duração por causa de outro efeito da Condição, cobre metade de seu preço. Quando a criatura sofrer modificadores de Condições diferentes sobre a mesma característica, aplique apenas o mais severo entre os que tiverem o mesmo sentido, respeitando as regras de Feitiços Permutativos.

Ao criar uma variação de uma Condição, você pode incluir formas adicionais de removê-la. O Mestre aprova cada forma de remoção e define seu desconto de acordo com a facilidade de utilizá-la, como um quarto, metade ou três quartos. Aplique o desconto apenas às partes que aquela forma de remoção pode encerrar. Quando mais de uma forma puder encerrar a mesma parte, aplique cada desconto ao valor que restar após o anterior. Some todos os valores antes de arredondar o custo final para baixo.

## CUSTOS DAS CONDIÇÕES

| CONDIÇÃO | CUSTO EM PONTOS DE DISTRIBUIÇÃO |
| --- | ---: |
| Abalado | Em revisão |
| Agarrado | 16 |
| Apavorado | Em revisão |
| Atordoado | 34 |
| Caído | 13 |
| Cego | Em revisão |
| Condenado | 6 |
| Confuso | 8 |
| Debilitado | Em revisão |
| Desprevenido | 12 |
| Enfeitiçado | Em revisão |
| Enjoado | 4 |
| Enredado | 13 |
| Esmorecido | Em revisão |
| Fascinado | 17 |
| Fraco | Em revisão |
| Frustrado | Em revisão |
| Imóvel | 10 |
| Inconsciente | 30 |
| Lento | 5 |
| Ofuscado | 6 |
| Paralisado | 36 |
| Pasmo | 16 |
| Petrificado | 20 |
| Surdo | 15 |

## DESCRIÇÃO DAS CONDIÇÕES

- **Abalado.** A criatura sofre −1 no Acerto, em Testes de Resistência e em testes de Perícia.
- **Agarrado.** A criatura fica Desprevenida e Imóvel. Quem a agarra pode arrastá-la ao se mover, reduzindo o próprio deslocamento à metade enquanto o faz. Um ataque à distância contra uma das criaturas envolvidas tem 50% de chance de atingir a outra. No início de seu turno, a criatura agarrada pode realizar um teste de Atletismo para se soltar. Caso tenha sido agarrada por um Feitiço, use a Classe de Dificuldade do Feitiço.
- **Apavorado.** A criatura sofre −3 em testes de Perícia e não pode se aproximar voluntariamente da fonte do medo.
- **Atordoado.** A criatura fica Desprevenida e não pode realizar ações ou reações.
- **Caído.** A criatura sofre −3 no Acerto em ataques corpo a corpo e −3 na Defesa contra ataques corpo a corpo. Contra ataques à distância, recebe +3 na Defesa. Seu deslocamento passa a 1,5 metro, rastejando, e ela pode gastar uma Ação de Movimento para se levantar. Caso esteja voando, perde seu deslocamento de voo até se levantar.
- **Cego.** A criatura fica Desprevenida e Lenta e falha em testes que dependam da visão. Os alvos de seus ataques possuem Camuflagem Total contra ela.
- **Condenado.** O custo em PE das habilidades da criatura aumenta em 1.
- **Confuso.** No início de cada um de seus turnos, a criatura rola 1d6 e segue o resultado da tabela de Confusão.
- **Debilitado.** Funciona como Fraco, com penalidade de −5.
- **Desprevenido.** A criatura sofre −3 na Defesa e em Testes de Resistência de Reflexos.
- **Enfeitiçado.** A criatura sofre −2 em todos os testes que realizar contra quem a enfeitiçou.
- **Enjoado.** A criatura não pode converter suas ações dentro da Hierarquia de Ações.
- **Enredado.** A criatura fica Lenta e sofre −2 na Defesa e no Acerto.
- **Esmorecido.** Funciona como Frustrado, com penalidade de −5.
- **Fascinado.** A criatura sofre −5 em Percepção e só pode agir para observar o que a fascinou. Uma ação hostil contra a criatura encerra a Condição. Um aliado adjacente pode gastar uma Ação Comum para tirá-la desse estado.
- **Fraco.** A criatura sofre −2 em testes diretos de Força, Destreza e Constituição e em testes de Perícias baseadas nesses Atributos. A penalidade não se aplica ao Acerto nem aos Testes de Resistência.
- **Frustrado.** A criatura sofre −2 em testes diretos de Inteligência, Sabedoria e Presença e em testes de Perícias baseadas nesses Atributos. A penalidade não se aplica ao Acerto nem aos Testes de Resistência.
- **Imóvel.** Todas as formas de deslocamento da criatura são reduzidas a 0 metro.
- **Inconsciente.** A criatura não pode realizar ações ou reações, não pode falar, fica Caída e larga o que estiver segurando. Sofre −5 na Defesa e em Testes de Resistência de Reflexos. Ataques contra ela recebem +4 na Margem de Crítico. Enquanto estiver Inconsciente, os modificadores de Defesa de Caído ficam suspensos. Fora das Portas da Morte, a criatura desperta após sofrer dano ou se uma criatura adjacente gastar uma Ação Comum para acordá-la. Ao despertar, continua Caída e os itens permanecem onde caíram.
- **Lento.** Todas as formas de deslocamento da criatura são reduzidas à metade, arredondadas para baixo em incrementos de 1,5 metro. A criatura não pode correr ou realizar investidas.
- **Ofuscado.** A criatura sofre −2 no Acerto e em testes de Percepção.
- **Paralisado.** A criatura não pode realizar ações ou reações, exceto ações completamente mentais. Sofre −3 na Defesa e em Testes de Resistência de Reflexos. Ataques corpo a corpo contra ela recebem +2 na Margem de Crítico.
- **Pasmo.** A criatura não pode realizar ações, mas conserva suas Reações.
- **Petrificado.** A criatura não pode realizar ações ou reações e recebe +8 de RD Geral. Este é o efeito da petrificação completa.
- **Surdo.** A criatura falha em testes que dependam da audição e sofre −5 na Iniciativa. Se já estiver em combate, reduza sua Iniciativa atual em 5 e ajuste sua posição na ordem dos turnos.

| D6 | CONFUSÃO |
| ---: | --- |
| 1 | A criatura se move em uma direção determinada por uma rolagem de 1d8. |
| 2–3 | A criatura perde as Ações do turno e balbucia incoerentemente. |
| 4–5 | A criatura ataca a criatura mais próxima com a arma que estiver empunhando. Se estiver sozinha, ataca a si mesma e rola apenas o dano. |
| 6 | A Condição termina e a criatura pode agir normalmente. |

## CONDIÇÕES ESPECIAIS

- **Indefeso.** Surge apenas nas Portas da Morte. A criatura fica Imóvel e Atordoada. Uma criatura ao seu alcance de Toque pode gastar uma Ação Completa para matá-la ou causar um Ferimento Complexo.
- **Surpreso.** Surge pela Furtividade no início do combate. Na rodada da surpresa, a criatura fica Desprevenida e perde suas Ações e Reações.

Indefeso e Surpreso não podem ser compradas como efeitos de Feitiços. Envenenado, Doente e Sangramento seguem regras próprias.

# DURAÇÃO DE FEITIÇOS

Ao montar um Feitiço, escolha por quanto tempo cada efeito permanecerá ativo. Um mesmo Feitiço pode reunir efeitos Imediatos, Duradouros e Sustentados, e cada um começa a valer no momento em que é resolvido.

## EFEITOS IMEDIATOS

Um efeito **Imediato** é resolvido na conjuração e custa o preço indicado para o efeito. Você pode comprar um modificador Imediato de Acerto ou Classe de Dificuldade para o próprio Feitiço. Ao fazer isso, gaste os pontos de distribuição desse Feitiço e aplique o modificador na mesma ação de conjuração, até o fim da resolução.

Caso o bônus seja concedido a um aliado, o bônus de Acerto vale para a próxima jogada de ataque elegível dele. O de Teste de Resistência vale para o próximo teste da resistência escolhida, e o de Defesa vale contra o próximo ataque que ele sofrer.

## EFEITOS DURADOUROS

Todos os efeitos **Duradouros** de um mesmo Feitiço compartilham uma única duração, escolhida na criação. A rodada da conjuração conta como a primeira. Para cada rodada além da primeira, gaste uma quantidade de pontos de distribuição igual à metade do BT do conjurador, arredondada para cima.

As rodadas adicionais são compradas na criação. Quando utilizar o Feitiço, o conjurador paga seu custo de conjuração em PE.

## EFEITOS SUSTENTADOS

Um efeito **Sustentado** permanece ativo enquanto o conjurador paga por sua manutenção. Para criar um Feitiço com essa duração, gaste uma quantidade de pontos de distribuição igual ao BT do conjurador. Esse custo é pago uma vez por Feitiço.

A primeira rodada é resolvida com a conjuração. No início de cada um de seus turnos seguintes, o conjurador escolhe quais efeitos deseja manter e paga em PE a manutenção de cada Feitiço separadamente. Assim que deixar de pagar por um efeito, ele se encerra. É possível manter vários Feitiços Sustentados ao mesmo tempo, respeitando o limite de Concentração para os efeitos que a exigem.

Para manter um Feitiço, pague **1 PE mais 1 PE para cada 10 pontos completos investidos nos efeitos mantidos**. Para calcular o valor, some apenas os pontos de distribuição gastos diretamente nos efeitos que você quer manter naquela rodada. A taxa para habilitar Sustentação, o alcance, a área e as compras de efeitos Imediatos e Duradouros são pagos na criação.

Quando sustentar um efeito Permutativo, mantenha também suas contrapartidas. A parte financiada pela permuta continua fazendo parte da intensidade do efeito, e o cálculo da manutenção considera a parcela comprada com os pontos do Feitiço.

## CONCENTRAÇÃO

Ao criar um efeito Duradouro ou Sustentado, você pode exigir que o conjurador mantenha a Concentração nele. Isso vale mesmo quando o efeito é aplicado em outra criatura. Caso o conjurador perca a Concentração, os efeitos que dependem dela terminam. Por padrão, você só pode se concentrar em uma habilidade por vez. Para os testes necessários para manter a Concentração, siga a seção Concentração do capítulo de Combate.

Em um **efeito Duradouro com Concentração**, a segunda e a terceira rodadas são gratuitas na criação. A partir da quarta, compre cada rodada pelo custo normal.

Quando todos os efeitos **Sustentados** de um Feitiço exigem Concentração, você fica dispensado da taxa de sustentação igual ao BT na criação. Em cada rodada adicional, pague a manutenção em PE conforme a regra de Efeitos Sustentados.

# CONJURAÇÃO EM RITUAL

Ao conjurar um Feitiço por meio de um ritual, o feiticeiro acrescenta componentes à sua conjuração, como palavras, sinais de mão ou gestos. Defina esses componentes na criação do Feitiço. Para iniciar e concluir o ritual, você precisa ser capaz de realizá-los.

Uma vez por turno, você pode escolher conjurar como ritual um Feitiço de Ação Bônus ou Comum. Ao aumentar a conjuração em um passo, de Ação Bônus para Comum ou de Ação Comum para Completa, escolha **uma melhoria**. Ao aumentar de Ação Bônus diretamente para Completa, escolha **duas melhorias**.

Escolha as melhorias ao iniciar a conjuração. Elas são aplicadas ao Feitiço já criado, que utiliza seu custo em PE e seus pontos de distribuição originais. Cada melhoria custa uma escolha, salvo quando indicado outro custo. As restrições do tipo do Feitiço também se aplicam à escolha das melhorias.

Quando uma circunstância dificultar a execução dos componentes de um ritual comum, o Mestre pode exigir um teste de Prestidigitação. Em caso de falha, escolha entre cancelar o ritual, perdendo a ação utilizada, ou concluir a conjuração no início do seu próximo turno.

## RITUAL ESTENDIDO

Um Feitiço de Ação Bônus, Comum ou Completa pode ser conjurado por meio de um Ritual Estendido. Ao iniciar um Ritual Estendido, escolha **cinco melhorias no total**. Para realizar o ritual, siga as etapas abaixo.

- No primeiro turno, gaste uma Ação Completa e sua Ação de Movimento para iniciar a preparação.
- Entre o primeiro e o segundo turno, mantenha a Concentração no ritual. Você permanece Desprevenido durante a preparação.
- No segundo turno, gaste uma Ação Completa para concluir a conjuração. Pague o custo do Feitiço em PE ao concluí-la.

Caso perca a Concentração antes de concluir, o ritual é interrompido. Feitiços Destrutivos e Cataclísmicos são sempre conjurados dessa forma e seguem suas próprias restrições de Área e de alvos.

## LISTA DE MELHORIAS PARA RITUAIS

- **Potência.** Acrescente ao impacto inicial uma quantidade de Dano Fixo ou Cura Fixa igual ao dobro do BT. Escolha um efeito de Dano ou Cura do Feitiço a cada vez. Você pode escolher esta melhoria até duas vezes.
- **Aumento de Acerto.** Acrescente +1 à jogada de ataque do Feitiço. Você pode escolher esta melhoria até duas vezes.
- **Aumento de Dificuldade.** Acrescente +1 à Classe de Dificuldade do Feitiço. Você pode escolher esta melhoria até duas vezes.
- **Aumento de Alcance.** Aumente em 9 metros um alcance do Feitiço medido em metros. Você pode escolher esta melhoria até duas vezes.
- **Expansão de Área.** Aumente em 3 metros o comprimento de um Cone ou o raio de uma Esfera. Em uma Linha, aumente em 4,5 metros o comprimento de uma das faixas. Cada escolha afeta uma área. Você pode escolher esta melhoria até duas vezes.
- **Ajuste de Alvos.** Escolha uma criatura para ser poupada dos efeitos da Área. Cada vez que escolher esta melhoria, você pode poupar outra criatura.
- **Penetração.** O impacto inicial ignora uma quantidade de RD redutível igual a **três vezes o BT**. Você pode escolher esta melhoria uma vez.
- **Prolongar Efeito.** Aumente em uma rodada a duração compartilhada pelos efeitos Duradouros do Feitiço. Você pode escolher esta melhoria uma vez.
- **Economizar Sustentação.** Reduza em 1 PE a manutenção do Feitiço a cada rodada, até o mínimo de 1 PE. Você pode escolher esta melhoria até duas vezes.
- **Estabilizar Concentração.** Na primeira falha em um teste para manter a Concentração no Feitiço após a conjuração, você mantém a Concentração. Você pode escolher esta melhoria uma vez.

Ao reunir o dano de disparos ou áreas diferentes sobre a mesma criatura, aplique o Dano Fixo da Potência uma única vez. Para determinar quantos dados de Dano Contínuo serão rolados nas rodadas seguintes, use a quantidade de dados do impacto inicial.

### MELHORIAS DE EFEITOS AUXILIARES

Você pode intensificar até dois Efeitos Auxiliares comprados no Feitiço, aplicando uma intensificação a cada efeito. Aumente a intensidade do bônus ou da penalidade conforme o tipo escolhido. A intensificação pode superar o teto da compra em até o valor que ela acrescenta. Cada intensificação custa uma melhoria, salvo quando indicado outro custo.

- **Reforçar Acerto ou CD.** Aumente em 1 um modificador de Acerto ou de Classe de Dificuldade concedido pelo Feitiço como Efeito Auxiliar.
- **Reforçar Defesa.** Aumente em 1 o modificador de Defesa.
- **Reforçar TR ou Perícia.** Aumente em 1 o modificador do Teste de Resistência ou da perícia escolhida na criação.
- **Ampliar Deslocamento.** Aumente em 1,5 metro o modificador de Deslocamento.
- **Ampliar Alcance de Ataque.** Aumente em 1,5 metro o modificador de alcance de ataques corpo a corpo ou em 3 metros o de ataques à distância.
- **Reforçar RD.** Aumente em 2 a RD Geral, em 3 a RD por Grupo ou em 4 a RD por Tipo, conforme o efeito comprado.
- **Intensificar Negação de RD.** Aumente em 2 a Negação de RD concedida pelo bônus ou debuff.
- **Intensificar Dano Fixo ou Nível de Dano.** Acrescente 3 ao Dano Fixo ou 1 ao modificador de Nível de Dano, conforme o efeito comprado.
- **Intensificar Margem de Crítico.** Aumente em 1 o modificador de Margem de Crítico na arma ou no ataque escolhido. Esta intensificação custa **duas melhorias**.
- **Intensificar Atributo ou Limite.** Aumente em 2 a modificação do valor ou do limite do atributo escolhido. Caso o efeito comprado aumente o valor e o limite do mesmo atributo, aumente ambos em 2. Esta intensificação custa **duas melhorias**.

# TESTES DE RESISTÊNCIA

Quando um Feitiço exigir um Teste de Resistência, tome como referência a chance média de sucesso da criatura naquela resistência para escolher o teste e definir sua Classe de Dificuldade.

| RESISTÊNCIA DA CRIATURA | CHANCE MÉDIA DE SUCESSO |
| --- | --- |
| Forte | 80% |
| Média | 50% |
| Fraca | 20% |

# CRIANDO FEITIÇOS PASSIVOS

Os Feitiços Passivos representam características da sua Técnica Amaldiçoada que concedem benefícios mecânicos ou narrativos ao personagem. Quando receber um Feitiço, você pode usar essa aquisição para aprender um Passivo ou aprimorar um que já conheça. Os Passivos são montados com pontos de distribuição e utilizam os preços e limites dos efeitos comprados.

Para cada Feitiço adicional investido no aprimoramento do mesmo Passivo, aumente seu orçamento em uma quantidade de pontos igual à **metade do seu BT**, arredondada para baixo. Quando seu BT aumentar, recalcule o orçamento inicial e os pontos de cada aprimoramento.

Quando dois bônus de Feitiço modificarem a mesma característica e um deles vier de um Passivo, aplique apenas o maior. Isso vale tanto entre Passivos quanto entre um Passivo e um Feitiço Ativo.

## PASSIVOS PERMANENTES E CONDICIONAIS

Um **Passivo Permanente** tem um orçamento inicial igual ao seu BT. Seus efeitos ficam disponíveis nas situações em que se aplicam, sem necessidade de ativação.

Um **Passivo Condicional** também tem um orçamento inicial igual ao seu BT. Seus efeitos condicionais funcionam enquanto os requisitos estiverem sendo cumpridos. Para cada requisito aprovado pelo Mestre, use os pontos adicionais da seção Definindo Requisitos para o Feitiço, conforme a dificuldade da condição. A dificuldade depende de quão acessível a condição é na campanha. Use esses pontos apenas nos efeitos que dependem dela.

## PASSIVOS SEMIATIVOS

Um **Passivo Semiativo** tem um orçamento inicial igual a **uma vez e meia o seu BT**, arredondado para baixo. Ao criá-lo, defina o gatilho da ativação e o efeito que o personagem recebe ao gastar um uso. Se o mesmo Passivo reunir efeitos permanentes e ativados, os pontos acima do BT concedidos por ser Semiativo são usados nos efeitos que exigem ativação.

Por padrão, um Passivo Semiativo tem um número de usos igual à metade do BT, arredondada para baixo, e recupera os usos no início de cada Cena. Na criação, escolha uma opção de limite de usos e uma opção de recarga. Os ajustes das duas tabelas são somados e só podem financiar efeitos sujeitos a essas limitações.

| LIMITE DE USOS POR RECARGA | AJUSTE NA DISTRIBUIÇÃO |
| --- | --- |
| Metade do BT, arredondada para baixo | 0 |
| Um uso | +2, se reduzir o limite padrão |
| BT inteiro | −2 |

| RECARGA DOS USOS | AJUSTE NA DISTRIBUIÇÃO |
| --- | --- |
| No início de cada Cena | 0 |
| Após um Descanso Longo | +2 |
| Após um Interlúdio | +4 |

Quando o gatilho ocorrer, você pode gastar um uso como **Ação Livre no seu turno** ou gastar um uso e sua **Reação**. As duas formas compartilham o mesmo estoque e o limite de **uma ativação por rodada** para aquele Passivo. Declare a ativação antes da rolagem. Um bônus Imediato vale para a jogada, o ataque ou a conjuração a que o gatilho se refere. Ao usar uma Reação, aplique as regras de resolução de Reações Imediatas. Depois de verificar o limite de compra do efeito, multiplique o modificador por **1,5** e arredonde para baixo.

O Semiativo pode causar Fadiga ou Exaustão ao personagem a cada ativação. Na criação, receba **1 ponto de distribuição por Fadiga** e **4 pontos por Exaustão direta**, gastos nos efeitos que cobram esse desgaste. Aplique o desgaste após resolver o uso. Se a Fadiga acumulada se converter em Exaustão, os pontos de distribuição já estão incluídos no crédito de Fadiga.

<!--
PENDÊNCIAS DO REWORK DE FEITIÇOS

- Feitiços Especiais e alcances de Cena, Mapa e Global.
- Concluir os preços em revisão na tabela de Condições, incluindo o custo da Camuflagem Total de Cego.
- Definir regras específicas para Condições em área que retiram ações.
- Definir Condições Progressivas, Envenenado, Doente, Sangramento e buffs únicos, incluindo Invisibilidade.
- Remoção de debuffs e cura de ferimentos complexos. Avaliar o custo de 1 ponto de distribuição para cada ponto gasto no debuff a ser removido.
-->
