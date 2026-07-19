# Invocações (Afty) — regras do livro (referência)

> **Fonte:** transcrição VERBATIM do livro Afty, enviada pelo autor por Ctrl+C/Ctrl+V.
> É material de REFERÊNCIA/contexto: nem tudo aqui vira campo de ficha (o próprio autor
> avisou "tem coisas que não precisa ser usado na criação de ficha, mas é útil como contexto").
> **FATIA 1 (engine) IMPLEMENTADA** (2026-07-17). `src/systems/afty/afty-invocacoes.js` traz os
> tipos, graus (+ trava por Nível de Controlador), atributos point-buy, PV/Defesa/Deslocamento,
> custo, orçamento de ações/características, o contexto de DSL (namespace próprio) e o validador
> `validarCatalogoInvocacoes` (zerado). Ligado em `deriveAfty` como `derived.invocacoes`, e a ficha
> em branco agora tem `creature.invocacoes`. **A UI da aba (`TabInvocacoes`) também já existe**
> (CRUD da lista + editor por invocação: nome, tipo/sabor, grau travado por Controlador, atributos
> point-buy, ataque/TR treinados, e o painel derivado de PV/Defesa/Deslocamento/Custo + orçamento
> de ações-características). **FATIA 2 (engine) IMPLEMENTADA** (2026-07-17): tabelas fixas de dano/
> cura/alcance/área/bônus de defesa-acerto/dano adicional/RD + tabelas de Característica (vida,
> teste, RD, tamanho), `resolveAcao`/`resolveCaracteristica`, CD de ataque por TR, Ação com Custo
> (faixa de PE + limite por grau + benefícios) e o escape hatch de DSL (`modificadorExpr` avaliado
> no namespace da invocação). Validador ampliado e zerado. **A ESCADA DE NÍVEIS DE DADO foi
> transcrita** (autor, 2026-07-17, ver seção "NÍVEIS DE DANO" abaixo) e `subirNiveisDano` está
> implementada, então corpo a corpo (+3), dano adicional complexo (+3) e o benefício de Ação com
> Custo (+2/PE) já resolvem o dado (bate com o exemplo do livro 6d6+1 = 3d12+1d4). **A UI das Ações e
> Características também já existe** (2026-07-17): dentro de cada invocação, duas seções (Ações,
> Características) com CRUD de cartões recolhíveis. Ação: família (Ataque/Auxílio), classe (travada em
> Complexa para Ataque e Cura), tipo de ataque/alvo/corpo a corpo/atributo/TR/forma de área/tipo de
> dano, ou sub de auxílio (cura/defesa/acerto/dano adicional/RD), Ação com Custo (PE + referência dos
> benefícios) e prévia dos valores resolvidos + campo de Modificador DSL. Característica: tipo (vida/
> teste/RD/tamanho/livre) com os campos e a prévia. **FATIA 3 (Horda) IMPLEMENTADA** (2026-07-17):
> `creature.hordas` (líder + membros por id), `resolveHorda`/`resolveHordasList` (custo, PV, tamanho e
> o escalonamento das ações do líder pelas notas "Caso seja uma Horda": dano/cura +1 nível por membro
> dobrando para Grau 2, dano adicional +1 por 2 membros, defesa/acerto +1 por 2 membros de Grau 2, RD
> +1 por membro, prejuízo +1 uso por 2 membros, tamanho +1 por 2 membros), ligado em `deriveAfty`
> (`derived.hordas`), com a UI (card Hordas: líder elegível, membros por chips, prévia dos stats +
> escalonamento + ações do líder ajustadas). **Sistema de Invocações COMPLETO (Fatias 1 a 3).**
> Refinamentos fechados (2026-07-18): (1) alcance corpo a corpo dos auxílios não-cura (defesa/acerto/
> RD/dano adicional), (2) o "grátis no custo" do Ápice do Controle (`custoInvocacao(inv, gratis)` abate
> os itens mais caros), (3) alocador fino dos benefícios de Ação com Custo (dano/cura +2 níveis por PE,
> alcance +6 m, área +3 m, acerto/CD +1, condição por nível, com validação da soma). Ainda depende de
> outros sistemas: limite de campo de membros/hordas (Treinamento em Controle), Perícias/TR treinado,
> características que expandem Deslocamento, e a passada de efeitos ampla.
>
> **Status desta transcrição:** CAPÍTULO COMPLETO (levas 1 a 4). O autor confirmou o fim em
> 2026-07-17 ("FINALIZAMOS O CAPÍTULO DO LIVRO SOBRE SHIKIGAMIS"). A leva 4 trouxe Prejuízo por
> Múltiplos Auxílios, Ações com Custo, Criando Características e as tabelas de referência de
> Característica (Vida, Teste, RD, Tamanho). A seção de **domar maldições** NÃO foi transcrita, e
> o autor confirmou (2026-07-17) que é **desnecessária para a criação de ficha** (fora de escopo
> do app).
>
> **Limpeza de artefato de PDF (só isto, sem mexer no conteúdo):** removidos números de página
> soltos ("261", "265") e parágrafos duplicados por quebra de página; juntadas palavras quebradas
> na linha ("moverse" → "mover-se", "removidoada" → "removido da", "Dia-a-\nDia" → "Dia-a-Dia",
> "criálas" → "criá-las"). A tabela de custo (e as de Vida/Defesa/Ações) vieram com cabeçalho
> impresso como "Nível de Controlador" onde as linhas são por Grau: mantidos os cabeçalhos como
> **Grau da Invocação** (erro claro de rótulo no livro). Uma frase "Há também um valor máximo que
> a Invocação pode possuir em um mesmo atributo..." reaparece DEPOIS da tabela de Pontos de Vida,
> onde não faz sentido (a tabela de PV não tem coluna de máximo): é cópia da seção de Atributos,
> omitida nesse ponto. A "Tabela de Dano Adicional" veio com a coluna rotulada "Bônus em Acerto",
> mas os valores são dados de dano ("1d6 de Dano Adicional"...): renomeada a coluna para **Dano
> Adicional**. As demais inconsistências do livro foram PRESERVADAS (ver "Inconsistências do
> livro" no fim).

---

## Plano de implementação (DECISÃO DO AUTOR, 2026-07-17)

**Escopo escolhido: COMPLETO, usando o MOTOR DE AUTOMAÇÃO.** O autor decidiu mecanizar toda a
criação de Invocação (atributos, PV/Defesa, orçamentos, custo em PE, Ações/Características com
dano/cura/RD calculados, Ações com Custo, matemática de Horda), e que isso será construído com o
motor de automação existente. **Será feito em OUTRO chat** — esta seção é o handoff.

### Fonte da verdade
- **Os números** (todas as tabelas por grau): este arquivo, seções "MONTANDO INVOCAÇÕES",
  "GUIA DE CRIAÇÃO" e "CRIANDO AÇÕES".
- **O motor:** DSL de Automação em `src/components/fm-dsl.js`, referência em
  `docs/automacao-dsl.md` (variáveis, funções `metade/teto/piso/...`, operadores, pré-requisitos).

### ⚠ Restrição dura que o outro chat PRECISA respeitar
`fm-dsl.js` vive em **`src/components/`, que é SOMENTE-LEITURA** (grimório 2.5.2, regra fixa do
autor: usar sim, editar não). Portanto o motor deve ser **REUSADO como está**, não estendido lá
dentro. Toda a lógica de Invocação (novo contexto de variáveis, tabelas por grau, resolvers)
vive em **`src/systems/afty/`** (provável `afty-invocacoes.js`), montando o contexto que a DSL
avalia. Se a DSL precisar de variáveis novas (atributos DA INVOCAÇÃO, grau, nível de Controlador
do dono), isso tem que ser resolvido sem tocar em `fm-dsl.js` — confirmar com o autor como (ex.:
um avaliador Afty que reusa o parser da DSL, ou mapear as variáveis existentes).

### Arquitetura já estabelecida (vale para o outro chat)
- Invocações vivem na ficha da criatura dona: `creature.invocacoes` (array de fichas de
  invocação). A aba `Invocações` já existe como **stub** em `AftyCreatureBuilder.jsx` (TABS +
  STUBS), posicionada entre Aptidões e Inventário.
- **A invocação NÃO é isolada:** PV, Defesa e os bônus de teste dela derivam de valores do DONO
  (nível/ND, Bônus de Treinamento, e o nível de **Controlador** — o lado da multiclasse, não o
  ND). O motor de invocação lê a ficha dona.
- **Acesso a graus** é travado pelo nível de Controlador (tabela em "CLASSIFICAÇÃO DAS
  INVOCAÇÕES"). Aumentar de grau é irreversível.
- **Ações e Características** são o ponto onde o Motor de Automação brilha: em vez de hardcode,
  cada Ação/Característica é um efeito parametrizado (tipo, subtipo, grau-base, modo Simples/
  Complexa, Corpo-a-Corpo, Ação com Custo) que resolve dano/cura/alcance/área/RD pelas tabelas +
  DSL para os modificadores. Orçamentos (atributos, nº de ações/características, ações com custo)
  e custo total em PE são deriváveis.

### Ligações com o resto do Afty (a passada de efeitos, já pendente)
As Habilidades do Controlador (`afty-habilidades.js`) e a seção "Ganchos do Controlador" no fim
deste doc modificam invocações (limites de campo, comandos, graus, hordas, adicionais de ação/
característica). Isso entra na MESMA passada de efeitos ainda pendente de Aptidões e Habilidades
(ver `docs/afty-status.md`). O motor de invocação e essa passada precisam conversar.

### Decisões (autor, 2026-07-17)
1. ✅ **Domar maldições / Maldições Domadas: FORA DE ESCOPO** para criação de ficha. Não precisa
   ser implementado. (O tipo "Maldição Domada" pode existir como rótulo narrativo, mas sem fluxo
   de domar.)
2. ✅ **Corpo Amaldiçoado vs Marionete: escolha SÓ NARRATIVA**, sem mudança mecânica. Os dois
   existem como sabores, mecanicamente idênticos (ambos são o tipo que usa dispositivo como
   Intermediário e "desativar/destruir" no lugar de "dissipar/exorcizar" dos Shikigamis). No
   modelo, tratar como um único tipo mecânico (`tipoMecanico: "dispositivo"`) com um rótulo
   narrativo escolhível (`saborNarrativo`).
3. ✅ **"Nível do Usuário" nas fórmulas de PV e Defesa = o ND do dono** (autor, 2026-07-17). PV usa
   o ND, Defesa usa `maestria(ND)` (o Bônus de Treinamento). Só o Bônus de Teste da invocação usa
   o lado da multiclasse: **Metade do Nível de Controlador**. O acesso a graus também é travado
   pelo Nível de Controlador, não pelo ND.
5. ✅ **Arredondamento: sempre para BAIXO** (autor, 2026-07-18), salvo quando o texto disser o
   contrário. Vale para todo o sistema (ex.: PV de Primeiro Grau `floor(1.5 x ND)`, o `x1,5` da Ação
   Complexa em Defesa/Acerto/RD). Foi a resposta ao code-review dos achados 3 e 5, que não são bugs.
6. ✅ **Correções do code-review (2026-07-18):** (achado 1) Quarto Grau não tem ataque de alvos
   Múltiplos/Área nem cura de alvos Múltiplos, então esses chips ficam travados no Quarto Grau e o
   resolver devolve `dado: null` com aviso (antes vazava "undefined"/"null" na tela). (achado 2) o
   custo obrigatório de 2 PE da Cura deixou de contar como Ação com Custo: só as com custo opt-in do
   jogador (`acaoComCusto`) entram no limite por grau.

4. ✅ **DSL sem editar `fm-dsl.js`** (autor, 2026-07-17): a lógica de Invocação monta um contexto de
   variáveis próprio no lado do Afty (`buildInvocacaoDslContext`) e delega ao `evalNumber`/
   `evalBoolean` existentes, que são agnósticos de variável (só fazem `ctx[nome]`). **Namespace
   próprio da invocação**: as vars da INVOCAÇÃO usam nomes explícitos (`forca`, `mod_destreza`,
   `pv_max`, `grau`...) e as do DONO entram como `nd`, `bt`, `nivel_controlador`, para uma expressão
   distinguir os dois sem ambiguidade. Zero edição em `src/components/`.

---

## INVOCAÇÕES

As Invocações são criaturas ou construtos que são controlados pelos personagens, sendo uma
parte essencial dos Controladores e um eventual auxílio para qualquer outro personagem. Neste
capítulo, você encontrará todas as regras para controlar, criar e domar diferentes invocações.

Existem três tipos principais de invocações: Corpos Amaldiçoados, Maldições Domadas e
Shikigamis. Cada um possui dinâmicas próprias e regras específicas que são aplicadas.

As Marionetes são objetos inanimados imbuídos com maldições e energia, o que confere uma
"vida" e a capacidade de agir a eles. Normalmente, são construídos por feiticeiros para serem
usados como invocações, auxiliando de diferentes maneiras.

As Maldições Domadas são espíritos amaldiçoados que foram subjugados e colocados sob comando
de um feiticeiro, sendo obrigados a agir em prol do mesmo objetivo daquele que o dominou.

Os Shikigamis são seres feitos de energia amaldiçoada, os quais são conjurados e controlados
por feiticeiros. Podem originar tanto de uma técnica inata quanto de talismãs confeccionados e
capazes de os invocar quando queimados com energia.

## OBTENDO INVOCAÇÕES

Como mencionado, as Invocações são um recurso importante e fixo para o Controlador, enquanto é
algo opcional para personagens de outras especializações. Por isso, o método para as obter é
variável.

Caso seja um Controlador, você inicia com duas Invocações no primeiro nível e recebe mais uma a
cada 3 níveis. Se não possuir nenhum nível de Controlador — ou deseje Invocações adicionais
como um — eles devem ser criados durante um Interlúdio, construindo Corpos Amaldiçoados ou
entalhando Talismãs, o que é detalhado no Dia-a-Dia Jujutsu (p.338).

Sempre que receber ou criar uma nova Invocação, você deve montar a ficha dela, seguindo um
modelo específico e um guia para criação.

A outra alternativa, sendo mais complexa, envolve domar maldições encontradas durante as
missões, com uma seção dedicada a isso no final do capítulo.

## CONTROLANDO INVOCAÇÕES

As Invocações são feitas para serem usadas em combate, auxiliando seu dono e influenciando no
campo de batalha. Esta seção explica como as utilizar e controlar durante o jogo.

O primeiro passo é trazer suas Invocações ao campo, utilizando a ação Invocar (p.303). Por
padrão, ela permite trazer duas Invocações ao combate.

Também é possível fazer o processo inverso: durante o seu turno, você pode utilizar uma Ação
Livre para Dissipar uma quantidade qualquer de Invocações à sua escolha. Isso não pode ser
feito na mesma rodada que você invocou elas.

Existe um limite de quantas Invocações um personagem pode manter em campo simultaneamente: por
padrão, você pode manter 1 Invocação em campo; caso seja um Controlador, essa quantidade
aumenta de acordo com a habilidade Treinamento em Controle.

A partir das Invocações em campo, você deve às comandar para agirem, visto que não são
naturalmente capazes de ter independência e autonomia. As regras para isso são:

- Você pode utilizar uma Ação Comum para dar o comando de uma Ação Complexa para uma Invocação.
  Com uma Ação Bônus, você dá o comando de uma Ação Simples.
- Invocações podem se mover como uma Ação Livre, comandando todas para utilizarem seu
  Deslocamento. Vale lembrar que elas só podem, por padrão, mover-se uma vez por rodada.
- Invocações possuem uma Reação própria, com o dono delas podendo decidir que a utilizem quando
  um gatilho válido ocorrer. Elas recuperam uma Reação gasta no turno do dono.

A habilidade Treinamento em Controle permite que seus comandos sejam mais eficientes,
realizando mais de uma Ação Complexa ou Simples como parte dele.

As Invocações se mantêm em campo até que sejam dissipadas voluntariamente pelo usuário ou
retiradas de ação forçadamente por outra fonte, como um Feitiço ou recebendo danos suficientes.

Invocações em campo não possuem um valor de Atenção e apenas procuram algo ou alguém pelo
usuário caso sejam comandados para isso, utilizando Percepção.

Quando uma Invocação chega a 0 pontos de vida, ela é dissipada ou desativada, possuindo
detalhes sobre cada tipo:

- Os Shikigamis são dissipados, o que significa que já estavam entrando em uma área de risco,
  então são chamados de volta. Quando um shikigami é dissipado, ele pode ser invocado novamente
  no seu próximo turno.
- Marionetes são desativadas, o que significa que os danos causados a desgastou o suficiente
  para que ela se esgotasse e ficasse inativo. Quando uma Marionete é desativada, ele pode ser
  abastecido novamente no seu próximo turno.

Uma vez que seja dissipada ou desativada, a Invocação pode ser trazida de volta ao utilizar
Invocar novamente, pagando seu custo outra vez.

Entretanto, quando uma Invocação que já tenha sido desativada é invocada novamente, ela retorna
com metade dos seus pontos de vida máximos, até que seja feito um descanso curto ou longo.

Caso a Invocação seja dissipada voluntariamente, você pode optar por a retornar sem pagar o seu
custo novamente, mas ela retornará com os mesmos pontos de vida que possuía quando dissipada.

Além disso, caso uma Invocação receba dano excedente superior ao seu máximo de vida, ela é
exorcizada ou destruída:

- Shikigamis são exorcizados, o que significa que o dano foi tão massivo que não foi possível o
  chamar de volta a tempo. Quando um shikigami é exorcizado, ele deixa de existir
  permanentemente, sendo removido da lista de invocações do controlador.
- Marionetes são destruídas, o que significa que o dano não só a deixou descarregada, como
  também destruiu de vez a sua estrutura e o seu núcleo. Quando uma Marionete é destruída, ela
  se torna permanentemente inútil, sendo removido da lista de invocações do controlador.

Uma invocação exorcizada ou destruída não pode ser recuperada por métodos convencionais, sendo
perdida permanentemente.

## CRIANDO HORDAS

Através da especialização de Controlador, é possível obter acesso a uma nova ação envolvendo
suas invocações — Criar Horda — a qual fornece uma maneira inédita de utilizar seus recursos
dentro de campo.

Você pode ter um limite de Hordas em campo igual a metade do seu limite de Invocações em campo
e cada uma delas é contabilizada como uma Invocação para esse limite (caso seu máximo de
Invocações em campo seja 4, você poderia ter 2 Invocações e 2 Hordas).

Criar Horda é uma Ação de Invocar e possui o seguinte efeito: quando criar uma Horda, você deve
escolher uma Invocação sua para ser o líder da horda, a qual deve ser de primeiro grau ou
inferior. Após feita essa escolha, você pode escolher Invocações adicionais como membros da
horda, possuindo um limite igual ao seu máximo possível em campo, desconsiderando o líder. Os
membros da horda não podem ser de um grau igual ou superior ao do líder dela.

Ao adicionar um membro a horda, o custo em PE dela aumenta em 1 PE caso seja de quarto grau, 2
PE caso seja de terceiro ou 3 PE caso seja de segundo grau.

Para cada membro colocado em uma horda, o líder da horda recebe os seguintes efeitos:

- Para cada membro colocado na horda, os pontos de vida atuais e máximas dela aumentam em um
  valor igual a metade da Invocação adicionada.
- A horda recebe aumento de efeito nas ações com base no número de membros. Siga o citado na
  ação.
- Para cada 2 membros colocados na horda, ela aumenta 1 categoria de tamanho. Entretanto,
  inimigos podem atravessar e ocupar o espaço ocupado por uma horda, recebendo o prejuízo de
  terreno difícil e sendo considerado flanqueado pela horda.
- Para cada 2 membros colocados na horda, os efeitos de Prejuízo por Múltiplos Ataques/Auxílios
  necessitam de 1 uso adicional para ser aplicados (por exemplo, com 2 membros na Horda,
  recebe-se -3 em jogadas para cada duas ações de ataque, ao invés de para cada uma após a
  primeira).

Outros valores, como o Deslocamento, e as ações/características consideram apenas as do líder da
horda, o qual serve como base para ela.

Uma horda é considerada, dentro de combate, como uma única Invocação (ocupa um único espaço
como criatura e é tratada como um alvo único). Caso uma Horda seja afetada por uma habilidade
ou feitiço em área, ela é considerada como Fragilizada; caso seja afetada por uma habilidade ou
feitiço com alvo único, ela recebe o nível do seu usuário em RD e não pode ter resistências e
RDs negadas.

Quando uma horda chega a metade dos seus pontos de vida máximos, ela perde metade dos seus
membros, iniciando pelos de grau menor, diminuindo todos os efeitos baseados no número de
membros. Caso o dano que ela receba seja metade da vida máxima da horda, ultrapassando o limiar
de metade da vida, toda Invocação que fosse ser dissipada é exorcizada.

Uma Horda só pode ser dissipada voluntariamente no final do combate. Caso seja dissipada
durante o combate, se utilizar o líder da antiga horda em outra horda, ela tem seus pontos de
vida máximos reduzidos pela metade.

## MONTANDO INVOCAÇÕES

Conhecendo as regras para obter e controlar as Invocações, resta apenas aprofundar no como você
pode montar uma delas, preenchendo a ficha e definindo suas características.

### INTERMEDIÁRIOS

Por padrão, toda Invocação é ligada a um Intermediário, o qual é necessário para que ela seja
invocada e manipulada. Cada tipo possui um Intermediário diferente:

- Shikigamis necessitam de Talismãs, que são papéis que podem ser infundidos com energia
  amaldiçoada para trazer a invocação. Cada shikigami é atrelado a um talismã específico, o que
  é definido ao recebê-lo ou criá-lo, sendo necessário o possuir em mãos para os Invocar.
  Certas técnicas inatas permitem que a necessidade de Talismãs seja ignorada, substituindo-a
  apenas por movimentos ou sinais de mão, como é o caso da Dez Sombras.
- Corpos Amaldiçoados são seus próprios Intermediários, tomando a forma de dispositivos
  compactos que, quando imbuídos com energia amaldiçoada, são ativados e passam a ser
  operantes. Alternativamente, pode-se descrever narrativamente que seguem o seu usuário em um
  estado próximo à inatividade, operando com o mínimo de carga.

Todo Intermediário ocupa meio espaço no inventário de um personagem. Se um personagem ter seus
talismãs ou dispositivos roubados, seria necessário os recuperar.

### CLASSIFICAÇÃO DAS INVOCAÇÕES

O primeiro passo para montar uma Invocação é a escolha do seu grau, seguindo a mesma
classificação de feiticeiros e maldições, indo de Quarto Grau até Grau Especial. O Grau de uma
Invocação irá afetar suas capacidades básicas, custo de uso e outros fatores, assim como podem
se mostrar relevantes para algumas técnicas — como a Manipulação de Maldições — e para
habilidades específicas.

Quando criar uma Invocação através de um Interlúdio, o grau dela é escolhido durante o processo
de criar o talismã, seguindo regras próprias e dificuldades crescentes. Confira o capítulo
Dia-a-Dia Jujutsu.

Porém, caso você seja um Controlador, sua capacidade é influenciada diretamente pelo seu nível,
permitindo-o escolher qualquer grau ao qual tenha acesso quando receber ou criar uma nova
Invocação:

| Nível de Controlador | Graus de Invocação |
|---|---|
| Nível 1 a 4 | Quarto Grau |
| Nível 5 a 8 | Quarto e Terceiro Grau |
| Nível 9 a 12 | Quarto, Terceiro e Segundo Grau |
| Nível 13 a 16 | Quarto, Terceiro, Segundo e Primeiro Grau |
| Nível 17 ou superior | Quarto, Terceiro, Segundo, Primeiro e Grau Especial |

As especificidades do como o Grau afeta são explicadas nas seções a seguir, através das tabelas
e passos da criação.

Ao receber acesso a um novo grau, e subir de nível, você também pode escolher alterar o grau de
invocações que já possua, atualizando a sua ficha de invocação. Entretanto, é um processo
irreversível: uma vez que aumente uma invocação de grau, você não pode o abaixar novamente.

O custo para trazer sua Invocação ao campo é definido de acordo com o grau, seguindo a tabela
abaixo:

| Grau | Custo |
|---|---|
| Quarto Grau | 2 Pontos de Energia |
| Terceiro Grau | 4 Pontos de Energia |
| Segundo Grau | 6 Pontos de Energia |
| Primeiro Grau | 8 Pontos de Energia |
| Grau Especial | 12 Pontos de Energia |

Esse custo poderá ser influenciado durante a criação, realizando adições, assim como pode ser
afetado por habilidades ou propriedades especiais.

### PREENCHENDO A FICHA

Após escolher o Grau da sua Invocação, é necessário a preencher através de escolhas, definindo
seus atributos, perícias e criando ações ou características. Dentro da ficha de personagem, você
encontrará uma área dedicada às Fichas de Invocação, possuindo as seguintes partes:

- Atributos, seguindo os seis mesmos atributos padrões de um personagem. Eles impactam outros
  valores e são somados em ataques ou testes.
- Vida e Defesa, medindo o quanto a Invocação é capaz de durar em batalha, juntamente do quão
  difícil é acertá-la.
- Deslocamento, representando o quanto a invocação consegue se mover.
- Perícias, definindo aquelas que a Invocação é capaz de utilizar e os respectivos bônus de
  cada uma.
- Ações, que podem ser tomadas pela invocação ao serem comandadas, divididas em ações simples e
  complexas.
- Características, os aspectos passivos de uma invocação, sempre influenciando nela.

Cada aspecto é definido de uma maneira específica. No decorrer desta seção, todas as
informações necessárias estarão presentes.

### DEFININDO OS ATRIBUTOS

O primeiro passo é definir os atributos. Por padrão, toda Invocação inicia com seus atributos em
8, recebendo uma quantidade específica de pontos para distribuir entre eles, de acordo com a
tabela abaixo:

| Grau da Invocação | Pontos para Distribuir | Máximo de Atributo |
|---|---|---|
| Quarto Grau | 10 Pontos | 16 |
| Terceiro Grau | 15 Pontos | 20 |
| Segundo Grau | 20 Pontos | 24 |
| Primeiro Grau | 30 Pontos | 26 |
| Grau Especial | 40 Pontos | 30 |

Há também um valor máximo que a Invocação pode possuir em um mesmo atributo, de acordo com o
grau, especificado também na tabela.

Além de aumentar os atributos, também é possível reduzi-los até um máximo de 6: ao reduzir um
atributo, você recebe pontos adicionais igual ao valor subtraído. Então, caso reduza a
Inteligência de 8 para 6, você receberia 2 pontos de atributo adicionais para distribuir.

### VIDA E DEFESA

Após definir os atributos, calcule os Pontos de Vida e a Defesa da sua Invocação, com cada um
deles possuindo uma fórmula.

Para os Pontos de Vida, a fórmula utiliza o grau, a Constituição e o nível do seu usuário.
Certas habilidades e características podem influenciar o valor.

| Grau da Invocação | Pontos de Vida |
|---|---|
| Quarto Grau | 10 + Metade do Valor de Constituição + Nível do Usuário |
| Terceiro Grau | 25 + Metade do Valor de Constituição + Nível do Usuário |
| Segundo Grau | 40 + Valor de Constituição + Nível do Usuário |
| Primeiro Grau | 60 + Valor de Constituição + 1.5x Nível do Usuário |
| Grau Especial | 80 + Valor de Constituição + 2x Nível do Usuário |

Para a Defesa, a fórmula utiliza o grau, a Destreza da Invocação e o nível do seu usuário.
Certas habilidades e características podem aumentar o valor ou alterar o atributo utilizado no
cálculo.

| Grau da Invocação | Defesa |
|---|---|
| Quarto Grau | 10 + Mod. de Destreza + Bônus de Treinamento do Usuário |
| Terceiro Grau | 12 + Mod. de Destreza + Bônus de Treinamento do Usuário |
| Segundo Grau | 16 + Mod. de Destreza + Bônus de Treinamento do Usuário |
| Primeiro Grau | 20 + Mod. de Destreza + Bônus de Treinamento do Usuário |
| Grau Especial | 24 + Mod. de Destreza + Bônus de Treinamento do Usuário |

### DESLOCAMENTO

O Deslocamento, por sua vez, possui um valor padrão de 9 Metros de Deslocamento de Caminhada, o
qual pode ser aumentado por habilidades de Controlador e Características, assim como expandido
para outros tipos através delas.

### TREINAMENTOS E PERÍCIAS

Embora as Invocações sejam, em sua maioria, seres mais simples e dependentes dos comandos de
alguém, é possível fazer com que sejam treinadas em certas capacidades e perícias. Primeiramente,
defina uma Jogada de Ataque para ela ser treinada (Corpo a Corpo ou a Distância) e um Teste de
Resistência para ser treinado, com exceção de Integridade.

Após feitas essas escolhas, você pode selecionar uma quantidade de perícias comuns, como
Acrobacia ou Atletismo, igual a 1 + metade do modificador de Inteligência ou Sabedoria para ser
treinado. Entretanto, por padrão, uma Invocação não pode ser treinada em Ofício.

Além do ganho padrão, uma Invocação se torna treinada em perícias adicionais conforme seu grau:
caso seja de Quarto ou Terceiro grau, recebe 1 perícia treinada; caso seja de Segundo ou
Primeiro grau recebe 2 perícias treinadas e, caso seja Grau Especial, recebe 3 perícias
treinadas. Ao aumentar de grau, a Invocação recebe apenas a diferença: uma Invocação de Terceiro
grau, ao se tornar de Segundo, receberia somente mais uma perícia treinada.

Quando se trata de perícias comuns, uma Invocação só pode realizar testes de maneira
independente com aquelas nas quais é treinada, recebendo um comando do seu usuário. Caso não
seja treinada, ela pode utilizar apenas a ação Ajudar, visto que possui acesso a todas as ações
padrões do sistema.

No uso de ações normais, como Agarrar ou Derrubar, não é preciso que a Invocação seja treinada
para poder realizar testes da perícia usada, como Atletismo.

Então, por exemplo, você poderia comandar uma Invocação a utilizar Percepção para procurar
sozinha por algum objeto, desde que ela seja treinada na perícia. Entretanto, a limitação não
estaria presente para comandar uma Invocação a Agarrar.

O cálculo para bônus de testes — seja Ataque, Teste de Resistência ou Perícia — de uma Invocação
é:

> **Bônus de Invocação = Modificador do Atributo Chave + Bônus de Treinamento do Usuário +
> Metade do Nível do Controlador**

Caso esteja utilizando uma perícia na qual a Invocação não seja treinada, o Bônus de Treinamento
do usuário não é somado.

### AÇÕES E CARACTERÍSTICAS

As Ações e Características são o que deixam uma Invocação única, moldando suas capacidades ativas
e passivas. A quantidade de Ações/Características que você pode colocar em uma Invocação depende
do seu grau:

| Grau da Invocação | Quantidades de Ações/Características |
|---|---|
| Quarto ou Terceiro Grau | 2 |
| Segundo ou Primeiro Grau | 3 |
| Grau Especial | 4 |

A quantidade serve tanto para ações quanto características, sendo preciso distribuir. Uma
Invocação de 4° Grau, por exemplo, poderia receber 1 ação e 1 característica ou 2 características.

A partir dessa quantidade, você pode aumentar com Habilidades de Controlador ou aumentando seu
custo: enquanto criando ou evoluindo uma Invocação, você pode adicionar uma quantidade de
Ações/Características adicionais igual a 1 para cada grau.

Logo, uma Invocação de 4° Grau poderia receber uma ação ou característica adicional, enquanto uma
de grau especial poderia receber até 5 ações/características adicionais.

Como mencionado, há um aumento no custo de acordo com as escolhas:

- Uma Ação Simples ou Característica aumenta o custo da invocação em 1 ponto de energia
  amaldiçoada.
- Uma Ação Complexa aumenta o custo da invocação em 2 pontos de energia amaldiçoada.

Com isso, todas as informações básicas estão preenchidas e você consegue saber quantas ações e
características você pode ter, restando apenas criá-las mecanicamente, o que é explicado em "Guia
de Criação".

## GUIA DE CRIAÇÃO

Sendo o aspecto único de cada Invocação, as Ações e Características influenciam como elas se
portam dentro de jogo, sendo necessário não só ter a ideia e conceito, como criá-las
mecanicamente, atribuindo números.

Primeiramente, iremos aprofundar no que cada um dos aspectos significa e a base que devem seguir.

### AÇÕES SIMPLES E COMPLEXAS

As Ações adicionam ou expandem nas maneiras que sua Invocação pode afetar os arredores, como
ataques especiais, benefícios para aliados ou alterar o terreno. Existem dois tipos, com suas
peculiaridades e peso:

- Ações Simples são aquelas que são básicas para a Invocação, exigindo pouco esforço e sendo
  feitas com agilidade. Considere como a Ação Bônus da Invocação, tendo também a limitação de não
  poder causar dano diretamente nem realizar cura. Exemplos de Ação Simples são: uma Invocação
  arqueira mirar, uma Invocação guardiã ajudar um aliado a se proteger ou uma Invocação baseada
  em um cão tentar distrair o inimigo.
- Ações Complexas envolvem a aplicação do potencial e capacidades da Invocação de maneira mais
  efetiva, possuindo uma maior força e impacto. Considere como a Ação Comum da Invocação,
  possuindo menores limitações. Exemplos de Ação Complexa são: uma Invocação golpear um inimigo,
  uma Invocação médica restaurar os pontos de vida de um aliado ou uma Invocação com canhões
  realizar um disparo explosivo em área.

Além das Ações que você criará e colocará na ficha dela, uma Invocação possui acesso a todas as
ações comuns e bônus da Lista de Ações (p.302). Quando se trata de Reações, ela só pode utilizar
as que sejam específicas da sua Ficha de Invocação.

### CARACTERÍSTICAS

As Características são aspectos passivos de uma Invocação, estando sempre em efeito para a
fortalecer e expandir suas capacidades de maneira fixa. Veja como os traços inerentes de um
shikigami ou modificações colocadas em uma marionete.

Não há muitas limitações sobre o que pode ser uma Característica, mas tenha em mente que não são
equivalentes de uma técnica amaldiçoada, abordando aquilo que é natural para a Invocação.

Se você criou uma marionete que busque representar um cavaleiro, ela poderia ter Características
que concedem Redução de Dano ou aumente a Defesa dele. Outros exemplos são um shikigami em forma
de cachorro ter bônus em testes de Percepção com seu olfato ou uma marionete feita para combate
em grupo receber um bônus em ataques realizados enquanto houver um aliado adjacente.

### CRIANDO AÇÕES

Quando for criar ações, você pode as encaixar dentro de dois tipos principais: Ações de Ataque e
Ações de Auxílio.

#### MONTANDO AÇÕES DE ATAQUE

As Ações de Ataque são todas aquelas que possuem a intenção de ferir outras criaturas,
golpeando-as de diferentes maneiras. Obrigatoriamente, uma Ação de Ataque deve ser uma Ação
Complexa. Existem dois tipos de Ações de Ataque:

- Jogadas de Ataque, as quais irão exigir uma rolagem de um dos dois tipos (Corpo a Corpo ou a
  Distância) para tentar acertar, com o resultado sendo comparado a Defesa do alvo. Uma Invocação
  pode utilizar tanto Força quanto Destreza em Jogadas de Ataque, necessitando de uma
  característica para utilizar outros.
- Testes de Resistência, forçando todo inimigo a realizar um TR para evitar ou reduzir os danos e
  efeitos do ataque. A CD padrão é 10 + Metade do Nível do Usuário (mínimo 1) + Modificador do
  Atributo da Invocação relevante e você deve, também, escolher qual TR será feito, com exceção de
  Integridade.

Cada uma possui suas próprias vantagens, com as Jogadas de Ataque possuindo um dano superior
enquanto os Testes de Resistência são mais fracos, mas garantem um mínimo de dano.

O dano é definido de acordo com o tipo, através de tabelas específicas para cada um. Por padrão,
os valores consideram Ataques a Distância, aumentando caso sejam transformados em Corpo a Corpo.

Você deve escolher um tipo de dano para ser causado no ataque, podendo escolher qualquer tipo
exceto Energia Reversa e Dano na Alma.

**Tabela de Dano para Ações Complexas – Alvo Único**

_Rolagem de Ataque_

| Grau da Invocação | Dano | Bônus em Dano |
|---|---|---|
| Quarto Grau | 1d12 | Mod. de Atributo |
| Terceiro Grau | 1d12 + 1d6 | Mod. de Atributo |
| Segundo Grau | 2d12 | Mod. de Atributo |
| Primeiro Grau | 2d12 + 1d6 | Mod. de Atributo |
| Grau Especial | 3d12 | 2 x Mod. de Atributo |

_Teste de Resistência_

| Grau da Invocação | Dano | Bônus em Dano |
|---|---|---|
| Quarto Grau | 1d8 | Mod. de Atributo |
| Terceiro Grau | 1d12 | Mod. de Atributo |
| Segundo Grau | 1d12 + 1d6 | Mod. de Atributo |
| Primeiro Grau | 2d12 | Mod. de Atributo |
| Grau Especial | 2d12 + 1d6 | 2 x Mod. de Atributo |

A tabela acima define o dano para um ataque que tenha um único alvo e, como mencionado, é o dano
para um Ataque a Distância, cujo alcance também deve ser definido, possuindo uma tabela própria.

Caso transforme o ataque em Corpo a Corpo, aumente o dano da tabela em 3 níveis.

**Tabela de Dano para Ações Complexas – Alvos Múltiplos/Área**

_Alvos Múltiplos_

| Grau da Invocação | Dano | Bônus em Dano |
|---|---|---|
| Terceiro Grau | 1d10 | Mod. de Atributo |
| Segundo Grau | 1d12 | Mod. de Atributo |
| Primeiro Grau | 1d12 + 1d6 | Mod. de Atributo |
| Grau Especial | 2d12 | 2 x Mod. de Atributo |

_Área_

| Grau da Invocação | Dano | Bônus em Dano |
|---|---|---|
| Terceiro Grau | 1d8 | Mod. de Atributo |
| Segundo Grau | 1d10 | Mod. de Atributo |
| Primeiro Grau | 1d12 | Mod. de Atributo |
| Grau Especial | 1d12 + 1d8 | 2 x Mod. de Atributo |

A tabela acima apresenta o dano que uma ação de ataque pode causar caso seja de alvo múltiplos —
permitindo-o escolher uma quantidade qualquer de alvos dentro do alcance — ou em área, afetando
todo um espaço específico, de acordo com a Tabela de Área.

**Tabela de Alcance**

| Grau da Invocação | Alcance |
|---|---|
| Quarto Grau | 6 Metros |
| Terceiro Grau | 9 Metros |
| Segundo Grau | 15 Metros |
| Primeiro Grau | 21 Metros |
| Grau Especial | 30 Metros |

Caso sua Ação de Ataque seja a distância, o alcance padrão dela deve seguir a tabela acima.

**Tabela de Área**

| Grau da Invocação | Área |
|---|---|
| Terceiro Grau | 3 Metros |
| Segundo Grau | 4,5 Metros |
| Primeiro Grau | 6 Metros |
| Grau Especial | 7,5 Metros |

Caso sua ação de ataque seja em área, você deve escolher qual formato será usado para ela (linha,
quadrado, cone etc.) e, quando usá-la, ela afetará todas as criaturas dentro dessa área a partir
de um ponto escolhido, o qual deve estar dentro do alcance do ataque.

Se a área for em linha, ela é dobrada.

**BENEFÍCIO EM DANO POR HORDA**

Caso seja uma Horda, aumenta o nível de dano em 1 para cada membro na Horda, dobrando o aumento
caso seja um membro de Grau 2.

#### MONTANDO AÇÕES DE AUXÍLIO

As Ações de Auxílio fornecem suporte para a própria Invocação ou outras criaturas, como o
aumento de defesa, redução de dano ou dano adicional em um próximo ataque.

Quando criar uma ação de auxílio, você deve escolher se ela pode afetar a Invocação ou Aliados,
limitando-se a um deles, por padrão.

Certas ações podem ser feitas tanto como uma Ação Simples quanto Ação Complexa, possuindo
especificações sobre o impacto dessa escolha. Enquanto algumas, como as de Cura, são limitadas à
Ação Complexa.

A seguir, você encontra os valores que uma ação de auxílio pode conceder, considerando que ela
faça apenas o que está especificado.

**Tabela de Cura para Ações Complexas**

_Alvo Único_

| Grau da Invocação | Cura | Bônus em Cura |
|---|---|---|
| Quarto Grau | 1d4 | Mod. de Atributo |
| Terceiro Grau | 1d8 | Mod. de Atributo |
| Segundo Grau | 1d12 | Mod. de Atributo |
| Primeiro Grau | 1d12 + 1d8 | Mod. de Atributo |
| Grau Especial | 2d12 + 1d6 | 2 x Mod. de Atributo |

_Alvos Múltiplos_

| Grau da Invocação | Cura | Bônus em Cura |
|---|---|---|
| Terceiro Grau | 1d4 | Mod. de Atributo |
| Segundo Grau | 1d6 | Mod. de Atributo |
| Primeiro Grau | 1d8 | Mod. de Atributo |
| Grau Especial | 1d12 + 1d4 | 2 x Mod. de Atributo |

A tabela acima possui os valores que uma ação de cura pode recuperar. Entretanto, caso o usuário
não possua Energia Reversa ou a Invocação não possua essa capacidade por si só, como o Cervo
Circular, a ação concede Pontos de Vida Temporários ao invés de recuperar os PVs atuais.

A ação possui um alcance igual ao da tabela para Ações Ofensivas, e segue as mesmas regras para
Alvos Múltiplos, permitindo escolher diversas criaturas dentro do alcance.

Uma Invocação pode somar seu modificador de Sabedoria ou Presença ao total, sendo uma escolha
permanente ao criá-la.

Caso faça com que a ação recupere PVs, ela obrigatoriamente possuirá um custo de 2 PE para ser
usada.

Caso seja uma Horda: Aumenta o nível dos dados de cura em 1 para cada membro na Horda, dobrando o
aumento caso seja um membro de Grau 2.

**Tabela de Bônus de Defesa**

| Grau da Invocação | Bônus em Defesa |
|---|---|
| Quarto Grau | +1 DEF |
| Terceiro Grau | +2 DEF |
| Segundo Grau | +3 DEF |
| Primeiro Grau | +4 DEF |
| Grau Especial | +5 DEF |

A tabela apresenta o quanto de bônus em Defesa uma ação de auxílio pode conceder a um aliado. Uma
ação deste tipo, por padrão, possui alcance corpo a corpo, exigindo uma característica para que
seu alcance possa ser maior. O bônus concedido dura 1 rodada.

Os valores na tabela representam o bônus que uma Ação Simples pode conceder. Caso transforme em
uma Ação Complexa, esse valor é aumentado em 1,5 vezes (uma Terceiro Grau concederia 3 ao invés
de 2).

Caso seja uma Horda: Aumenta em 1 para cada 2 Membros na Horda de Grau 2.

Prejuízo por Múltiplos Auxílios: -1 para cada uso repetido na rodada, podendo chegar até 0.

**Tabela de Bônus de Acerto**

| Grau da Invocação | Bônus em Acerto |
|---|---|
| Quarto Grau | +1 |
| Terceiro Grau | +2 |
| Segundo Grau | +3 |
| Primeiro Grau | +4 |
| Grau Especial | +5 |

A tabela apresenta o quanto de bônus em jogada de ataque uma ação de auxílio pode conceder a um
aliado. Uma ação deste tipo, por padrão, possui alcance corpo a corpo, exigindo uma
característica para que seu alcance possa ser maior. O bônus concedido é efetivo durante o próximo
ataque da criatura afetada.

Os valores na tabela representam o bônus que uma Ação Simples pode conceder. Caso transforme em
uma Ação Complexa, esse valor é aumentado em 1,5 vezes (uma Terceiro Grau concederia 3 ao invés
de 2).

Caso seja uma Horda: Aumenta em 1 para cada 2 Membros na Horda de Grau 2.

Prejuízo por Múltiplos Auxílios: -1 para cada uso repetido na rodada, podendo chegar até 0.

**Tabela de Dano Adicional**

| Grau da Invocação | Dano Adicional |
|---|---|
| Quarto Grau | 1d6 de Dano Adicional |
| Terceiro Grau | 1d10 de Dano Adicional |
| Segundo Grau | 2d6 de Dano Adicional |
| Primeiro Grau | 2d8 de Dano Adicional |
| Grau Especial | 2d12 de Dano Adicional |

A tabela apresenta o quanto de dano adicional uma ação de auxílio pode conceder a um aliado. Uma
ação deste tipo, por padrão, possui alcance corpo a corpo, exigindo uma característica para que
seu alcance possa ser maior. O bônus concedido é efetivo durante o próximo ataque da criatura
afetada.

Os valores na tabela representam o bônus que uma Ação Simples pode conceder. Caso transforme em
uma Ação Complexa, aumente o dano adicional em 3 níveis.

Caso seja uma Horda: Aumenta em 1 nível de dano para cada 2 membros na Horda.

Prejuízo por Múltiplos Auxílios: -2 níveis para cada uso repetido na rodada, podendo chegar até
1d4.

**Tabela de Redução de Dano**

| Grau da Invocação | Redução de Dano |
|---|---|
| Quarto Grau | 2 de RD |
| Terceiro Grau | 4 de RD |
| Segundo Grau | 6 de RD |
| Primeiro Grau | 8 de RD |
| Grau Especial | 10 de RD |

A tabela apresenta o quanto de Redução de Dano uma ação de auxílio pode conceder a um aliado. Uma
ação deste tipo, por padrão, possui alcance corpo a corpo, exigindo uma característica para que
seu alcance possa ser maior. O bônus concedido dura 1 rodada.

A Redução de Dano é específica para um único tipo de dano. Para cada outro tipo de dano que você
adicione, o valor é reduzido em 2.

Os valores na tabela representam o bônus que uma Ação Simples pode conceder. Caso transforme em
uma Ação Complexa, esse valor é aumentado em 1,5 vezes (uma Terceiro Grau concederia 6 ao invés
de 4).

Caso seja uma Horda: Aumenta em 1 para cada membro na Horda.

Prejuízo por Múltiplos Auxílios: -1 para cada uso repetido na rodada, podendo chegar até 0.

### PREJUÍZO POR MÚLTIPLOS AUXÍLIOS

Forçar uma Invocação a realizar as mesmas ações em sequência prejudica a qualidade delas,
trazendo um prejuízo por múltiplos auxílios dentro de uma mesma rodada.

Para cada Ação de Auxílio após a primeira que uma Invocação realizar, na mesma rodada, ela
recebe um prejuízo, o qual é especificado na descrição da tabela de referência do benefício que
ela concede.

Dentro das fichas de Invocação, deve-se sempre especificar o prejuízo por múltiplos auxílios,
assim facilitando o entendimento durante o combate.

Vale notar que este prejuízo é individual para cada Invocação em campo, trazendo uma vantagem
para possuir uma quantidade maior delas.

### AÇÕES COM CUSTO

É possível adicionar um custo a uma ação de uma Invocação, potencializando-a ainda mais e
concedendo um aspecto especial para ela. Quando for criar uma Ação para uma Invocação, você pode
escolher a transformar em uma Ação com Custo.

Uma Invocação só pode utilizar uma Ação com Custo por rodada e ela sempre deve gastar no mínimo 1
PE e um máximo igual a 2 por Grau da Invocação (2PE para Quarto Grau, 4PE para Terceiro Grau e
assim em diante). Certos efeitos podem até mesmo conceder um tempo de recarga maior para elas.
Além disso, há uma limitação em quantas Ações com Custo uma Invocação pode ter: uma Invocação de
Quarto/Terceiro Grau pode ter apenas 1 Ação com Custo; uma de Segundo/Primeiro Grau pode ter 2 e
uma de Grau Especial pode ter 3.

Uma Ação com Custo deve sempre custar pelo menos uma Ação Complexa.

Para criar uma Ação com Custo, usa-se como base as capacidades comuns das ações de uma Invocação,
mas expandindo a partir disso.

#### REFERÊNCIAS PARA AÇÕES COM CUSTO

De acordo com o custo colocado na Ação com Custo, benefícios podem ser colocados conforme a
tabela abaixo:

| Benefício | Efeito |
|---|---|
| Aumento de Alcance | Para cada PE, a ação tem seu alcance aumentado em 6 metros. |
| Aumento de Área | Para cada PE, a ação tem sua área aumentada em 3 metros. |
| Aumento de Dano/Cura | Por 1 PE, o valor de dano ou cura da ação aumenta em 2 níveis. |
| Bônus em Acerto ou CD | Para cada PE, a ação recebe um bônus de +1 na jogada de ataque ou na CD para resistir a ela. |
| Causar Condição | Este efeito pode ser aplicado em uma Ação de Ataque, fazendo com que o alvo receba uma Condição por 1 rodada caso o ataque acerte ou ele falhe no TR. O custo é baseado no nível da Condição: 2 para Fraca, 4 para Média e 6 para Forte. |

### CRIANDO CARACTERÍSTICAS

Criar Características para uma Invocação é parte do processo de definir os aspectos passivos e
inerentes dela. Existe uma infinidade de características que você pode criar então, para tornar o
processo possível, esta seção apresenta tabelas e referências para certas coisas e uma lista do
que se deve evitar em uma característica — limitações que buscam balancear.

Além disso, tenha em mente que não é possível criar mais de uma característica com o mesmo efeito,
impossibilitando o acúmulo deles. Duas características que concedam um aumento de Defesa não
funcionam juntas, sendo limitada a apenas uma.

Você pode encontrar uma breve lista de Características no final deste capítulo, servindo como
base, assim como existe uma lista maior no livro Enciclopédia Amaldiçoada, aprofundando na
criação delas.

#### LIMITAÇÕES NA CRIAÇÃO DE CARACTERÍSTICAS

Para uma criação equilibrada de Características, considere que:

- Uma característica não pode garantir ações, de nenhum tipo, para a invocação.
- A não ser que seja uma maldição domada ou um shikigami de técnica, ela não pode garantir
  imunidades a tipos de dano. Shikigamis de Técnica ainda precisam de um sentido, na própria
  técnica, para se tornarem imunes a um tipo de dano.
- Características não podem garantir dados extras.
- A não ser que seja uma maldição domada, a característica não pode ser uma aptidão.
- Características não podem dar habilidades de especialização ou características que funcionem como
  habilidades de especialização.
- A não ser que seja uma maldição domada, a característica não pode garantir uma técnica inata
  diferente
- Características não podem reduzir ações complexas para simples
- Características não podem conceder movimento teleporte.

#### REFERÊNCIAS PARA CARACTERÍSTICAS

Abaixo você encontrará uma lista de tabelas com o que uma Característica pode fornecer. Os valores
consideram que o único bônus da característica é o que está listado e, conforme o Grau da
Invocação aumenta, os valores também se tornam maiores.

**Tabela de Aumento de Vida**

| Grau da Invocação | Quantidade de Vida Adicional |
|---|---|
| Quarto Grau | 5 Pontos de Vida |
| Terceiro Grau | 10 Pontos de Vida |
| Segundo Grau | 15 Pontos de Vida |
| Primeiro Grau | 20 Pontos de Vida |
| Grau Especial | 30 Pontos de Vida |

A tabela acima apresenta o quanto uma Característica pode aumentar os Pontos de Vida Máximos de
uma Invocação.

**Tabela de Bônus em Teste**

| Grau da Invocação | Bônus em Teste |
|---|---|
| Quarto Grau | +2 de Bônus |
| Terceiro Grau | +4 de Bônus |
| Segundo Grau | +6 de Bônus |
| Primeiro Grau | +8 de Bônus |
| Grau Especial | +10 de Bônus |

A tabela acima apresenta o quanto uma Característica pode conceder de bônus fixo em um teste
específico. Caso seja uma Perícia, o bônus é aplicado por completo.

Caso seja em Jogadas de Ataque ou Testes de Resistência, o bônus é reduzido pela metade, assim
como é necessário um gatilho específico. Para ataques, por exemplo, pode ser necessário possuir
outro aliado adjacente ao alvo para aplicar ou estar em terreno elevado.

**Tabela de Redução de Dano**

| Grau da Invocação | Redução de Dano |
|---|---|
| Quarto Grau | 2 de RD |
| Terceiro Grau | 4 de RD |
| Segundo Grau | 6 de RD |
| Primeiro Grau | 8 de RD |
| Grau Especial | 12 de RD |

A tabela acima apresenta quanta Redução de Dano uma Característica pode conceder a uma Invocação.
A RD da característica é aplicada contra apenas um tipo de dano, escolhido durante sua criação.

Para poder ganhar RD a outros tipos, é preciso criar mais Características, embora seja impossível
acumular RD ao mesmo tipo.

**Tabela de Tamanho**

| Grau da Invocação | Tamanho Mínimo/Máximo |
|---|---|
| Quarto Grau | Médio/Grande |
| Terceiro Grau | Médio/Grande |
| Segundo Grau | Pequeno/Enorme |
| Primeiro Grau | Pequeno/Enorme |
| Grau Especial | Minúsculo/Colossal |

A tabela acima apresenta o mínimo e máximo de tamanho que um Shikigami pode ter com uma
característica, recebendo acesso a todos os tamanhos entre o mínimo e máximo para receber na
característica.

---

## NÍVEIS DE DANO (regra geral, referência para os "+N níveis")

> Enviada pelo autor em 2026-07-17. É uma mecânica GERAL de armas (não exclusiva de Invocação),
> mas é a fonte da verdade para todo "+N níveis" das Ações de Invocação (corpo a corpo +3, dano
> adicional complexo +3, Ação com Custo +2 por PE, e a Horda). VERBATIM.

Os Níveis de Dano fazem parte de uma mecânica adicional das armas, a qual permite a melhoria
delas, extraindo mais do potencial destrutivo que oferecem. Certas habilidades e propriedades
podem aumentar o nível de dano de uma arma, seguindo a tabela presente nesta seção.

Por exemplo, uma espada curta tem 1d6 de dano então, caso seu dano seja aumentado em um nível,
ela passará a causar 1d8 de dano.

Também existem certas habilidades, normalmente de inimigos, que podem diminuir o nível de dano de
uma arma, com o intuito de reduzir o potencial de dano do atacante. Por exemplo, uma espada curta
tem 1d6 de dano então, caso seu dano seja reduzido em um nível, ela passará a causar 1d4 de dano.

Se os dados de uma arma não se encaixarem dentro dos níveis de dano some seu resultado máximo e
tente achar o resultado mais próximo possível dentro dos níveis de dano e converta o dano da arma
para este nível. Por exemplo, se uma arma causar, por base, 6d6 de dano e tiver seu dano aumentado
em 1 nível ela passaria a causar 3d12+1d4 de dano.

| -2 níveis | -1 nível | Padrão | +1 nível | +2 níveis | +3 níveis |
|---|---|---|---|---|---|
| 1 | 1d2 | 1d3 | 1d4 | 1d6 | 1d8 |
| 1d2 | 1d3 | 1d4 | 1d6 | 1d8 | 1d10 |
| 1d3 | 1d4 | 1d6 | 1d8 | 1d10 | 1d12 |
| 1d4 | 1d6 | 1d8 ou 2d4 | 1d10 | 1d12 | 1d12 + 1d4 |
| 1d6 | 1d8 | 1d10 | 1d12 | 1d12 + 1d4 | 1d12 + 1d6 |
| 1d8 | 1d10 | 1d12 ou 2d6 | 1d12 + 1d4 | 1d12 + 1d6 | 1d12 + 1d8 |
| 1d10 | 2d6 | 2d8 | 2d10 | 2d12 | 2d12 + 1d4 |

Caso, de alguma maneira, um personagem consiga aumentar os níveis de dano além do apresentado na
tabela (+3 níveis), o dano da arma continua sendo aumentado para cada nível excedente, mantendo a
mesma lógica de aumento (1d4 > 1d6 > 1d8 > 1d10 > 1d12 > 1d12 + 1d4).

Se isto acontecer com dados adicionais, como em 1d12 + 1d6, aumente o dado adicional — neste caso,
se tornaria 1d12 + 1d8 — até o d12 e, ao passar dele, adiciona-se mais um dado, iniciando no d4. No
caso da redução de níveis de dano, ao ultrapassar -2 níveis, continue o reduzindo normalmente até
chegar em 1 de dano.

Habilidades e efeitos que concedam um dado de dano adicional consideram o maior dado do nível.
Então, ao receber +1 dado com uma arma que causa 1d12 + 1d6, você receberia 1d12 de dano adicional.

**Implementação (afty-invocacoes.js):** `subirNiveisDano(dado, n)` mapeia o dado para um degrau pela
regra do "maior resultado" (soma o máximo do dado e acha o degrau mais próximo), anda `n` degraus na
escada canônica única e renderiza de volta. A escada acima do d12 segue kd12, kd12+1d4/1d6/1d8/1d10,
(k+1)d12, etc. Confere com o exemplo do livro: 6d6 (máx 36) = 3d12 (máx 36), +1 = 3d12+1d4.

---

**FIM DO CAPÍTULO** (o autor confirmou: "FINALIZAMOS O CAPÍTULO DO LIVRO SOBRE SHIKIGAMIS",
2026-07-17). Ver a nota sobre "domar maldições" na seção de pendências abaixo.

---

## Inconsistências do livro (preservadas, para conferir depois)

Registradas aqui em vez de "corrigidas" no texto acima, porque é transcrição:

1. **"Corpos Amaldiçoados" vs "Marionetes".** A intro lista os três tipos como *Corpos
   Amaldiçoados, Maldições Domadas e Shikigamis*, mas descreve o primeiro como *"As Marionetes
   são objetos inanimados..."* e o resto do capítulo alterna os dois termos. **Resolvido pelo
   autor (2026-07-17):** Corpo Amaldiçoado e Marionete são o MESMO tipo mecânico, a diferença é
   só narrativa. Não é erro do livro, são sabores intercambiáveis.
2. **Concordância trocada** em vários pontos ("os danos causados a desgastou", "ele pode ser
   abastecido" para Marionete, "pontos de vida atuais e máximas"). Sem efeito de regra.

---

## Ganchos do Controlador que este sistema precisa atender (planejamento, NÃO implementado)

As Habilidades do Controlador (já transcritas em `src/systems/afty/afty-habilidades.js`) fazem
referência direta a mecânicas de Invocação. Lista para orientar o desenho futuro:

- **Treinamento em Controle** (Base 1): +1 invocação inicial e adicionais em níveis fixos;
  aumenta o limite de invocações ativas em campo; aumenta comandos por Ação Comum/Bônus.
- **Apogeu** (Base 6): estilos alteram limite de campo, custo de invocar (ação livre) e desbloqueiam
  Criar Horda (Controle Disperso).
- **Graus** (Quarto → Especial): tabela de acesso por nível de Controlador + tabela de custo.
  Referenciados por Autonomia, Potencial Superior (pontos de atributo por grau), Hoste
  Amaldiçoada e Buchas de Canhão (custo de membro de horda por grau).
- **Criar Horda / Hordas:** líder + membros, custo por grau, limite = metade do limite de campo,
  escalonamento por nº de membros (Hoste Amaldiçoada, Flanco Avançado, Combate em Alcateia).
- **Ações e Características** como itens que somam ao custo da invocação (Visionário, Ápice do
  Controle dão adicionais grátis).
- **Aliado** (iniciante/veterano/mestre) do Companheiro Avançado / Invocação Às — confirmar se é
  parte deste sistema ou de outro capítulo.
- **Domar maldições** (Domador de Maldições / Maldições Domadas): ✅ **FORA DE ESCOPO** para
  criação de ficha (autor, 2026-07-17). Não precisa ser transcrito nem implementado. A habilidade
  Domador de Maldições segue como texto verbatim no catálogo, sem fluxo mecânico atrelado.

⚠ **A DECIDIR juntos (autor + eu):** o que da criação de invocação vira campo de ficha no app vs
o que fica só como referência de mesa. O autor sinalizou que nem tudo precisa ir para a ficha.

---

## AUTOMAÇÃO DAS HABILIDADES DE CONTROLADOR (2026-07-18)

O autor pediu para automatizar as Habilidades de Especialização de Controlador com o Motor de
Automação, anotando o que o Motor atual não cobre. Os efeitos ESTÁTICOS e numéricos de ficha viram
fórmulas da DSL em `CONTROLADOR_EFEITOS_INVOCACAO` (`afty-habilidades.js`), avaliadas no contexto de
CADA invocação (`buildInvocacaoDslContext` expõe `grau`, `bt`, `nd`, `nivel_controlador`, atributos)
e aplicadas por `resolveInvocacao` canal a canal. `deriveAfty` passa os efeitos das habilidades
escolhidas em `donoInvoc.efeitos`.

### ✅ Automatizado (7 habilidades, efeito de ficha)

| Habilidade | Efeito | Fórmula DSL | Canal |
|---|---|---|---|
| Invocações Resistentes (2°) | +PV | `bt * 5` | pv |
| Invocações Móveis (2°) | +Deslocamento (+1,5 nos níveis 6/12/18) | `1.5 * (1 + (nivel_controlador >= 6) + (nivel_controlador >= 12) + (nivel_controlador >= 18))` | deslocamento |
| Invocações Treinadas (2°) | +perícias treinadas | `piso(bt / 2)` | pericias |
| Visionário (2°) | +ações/características (custo normal) | `piso(bt / 2)` | orcamentoPago |
| Controle Aprimorado (base 4) | +2 em testes, +1 por grau acima do quarto | `1 + grau` | bonusTeste |
| Potencial Superior (4°) | +2 pontos de atributo por grau | `2 * grau` | atributoPontos |
| Ápice do Controle (base 20) | +2 ações/características (capacidade) | `2` | orcamentoLivre |

### ⚠ GAPS DO MOTOR (adicionar depois, não dá com o motor atual)

O motor (fm-dsl) só produz UM NÚMERO para um stat. O que sobra precisa de mecanismos novos:

1. **Efeitos não-numéricos / economia de ação** (o motor não tem tipo de efeito para isso):
   conceder ação/ataque extra, reação, reroll, vantagem/desvantagem. Habilidades: Aceleração,
   Frenesi da Invocação, Chamado Destruidor, Ataque em Conjunto, Invocação Parcial, Atacar e
   Invocar, Golpes Ágeis, Ação Corretiva (reroll), Ápice do Controle (desvantagem inimiga),
   Acompanhamento Amaldiçoado, Companheiro Avançado, Invocação Às, Crítico Brutal, Proteger
   Invocação e Proteção Avançada (reações). **Motor precisaria de:** tipos de efeito além de valor
   (conceder ação/reação/gatilho, vantagem/desvantagem, reroll).
2. **Posicionais / condicionais de campo** (dependem de contagem em alcance ou flanqueamento):
   Guarda Viva, Rede de Detecção, Táticas de Alcateia, Combate em Alcateia, Concentrar Poder (só 1
   em campo). **Motor precisaria de:** variáveis de combate (invocações em alcance / em campo) e
   condições posicionais.
3. **Roster, limite de campo e custo por invocação escolhida:** Treinamento em Controle (limite de
   campo, invocações iniciais, comandos), Reserva para Invocação, Invocações Econômicas, Otimização
   de Energia. **Precisa de:** modelo de "campo" (invocações ativas) e override de custo por
   invocação marcada.
4. **Escolha / repetível / seleção de invocação:** Apogeu (estilo), Melhoria de Controlador
   (repetível + aplica a N invocações), Companheiro Amaldiçoado, Concentrar Poder (marcadas),
   Aptidões de Controle (repetível + concede nível de trilha). **Precisa de:** estado de escolha
   aninhada, habilidade repetível (TODO já existente) e a passada de efeitos das Aptidões.
   > **PARCIAL (2026-07-19):** o estado de **escolha aninhada** existe agora
   > (`creature.escolhasHabilidade` + `resolveEscolhasHabilidade` em afty-habilidades.js,
   > picker em HabilidadeCard). Já ligado: a escolha de **Apogeu** (Estilo de Controle) é um
   > requisito `escolha` verificável de verdade, travando/liberando Concentrar Poder (Concentrado),
   > Hoste Amaldiçoada (Disperso) e Combate em Alcateia (Sintonizado). A **repetibilidade** também:
   > cada Melhoria de Controlador escolhida consome uma vaga de Habilidade (`vagasExtras`).
   > **Falta:** APLICAR os efeitos das Melhorias (dano adicional/Defesa/RD/Deslocamento/acerto-CD,
   > escalando com nível) às invocações, a seleção de QUAIS invocações recebem (limite = BT), e a
   > passada de efeitos das Aptidões de Controle.
5. **Variáveis fora do fm-dsl padrão:** `nivel_controlador` e o `grau` da invocação não existem no
   `buildDslContext` da 2.5.2. Aqui foram montados no lado do Afty (`buildInvocacaoDslContext`), sem
   editar `fm-dsl.js`. Se um dia quisermos essas fórmulas no editor de automação padrão, o Motor
   precisaria expor níveis de especialização e um contexto "de invocação".
6. **"Grátis no custo" do Ápice:** a capacidade +2 é aplicada, mas a parte "não influenciam no
   custo" NÃO é deduzida automaticamente (precisaria de uma flag "grátis" por item). Hoje a
   capacidade sobe e o custo por item segue o normal.
7. **Domar maldições** (Domador de Maldições): fora de escopo (autor).
