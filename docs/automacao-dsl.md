<!--
  Espelho da referência da DSL de Automação. DUAS fontes desde 2026-08-20:
    • src/components/fm-dsl.js          o avaliador da 2.5.2 (somente-leitura)
    • src/systems/afty/afty-dsl.js      a cópia do Afty, que é onde a linguagem cresce
  A base é a mesma nos dois. O que só existe no Afty está na seção "o PRÓPRIO
  avaliador" mais abaixo. Ao alterar a DSL do Afty, atualize lá e reflita aqui.
  No app, a referência da 2.5.2 aparece em AutomationDocsModal.
-->

# DSL de Automação — Grimório

Linguagem de expressões para programar habilidades (buffs/efeitos). Em português, sem código de verdade — só expressões matemáticas e lógicas. Uma expressão sempre resulta num **número** (booleanos são 1/0).

Onde se usa:
- **Valor de um efeito** — ex.: um buff de Defesa igual a `metade(nd)`.
- **Pré-requisito de uma regra** — ex.: só vale com `dom >= 3`. Passivas que não atendem são ignoradas; ativadas ficam bloqueadas.

## Variáveis

### Atributos
- `forca, destreza, constituicao, inteligencia, sabedoria, presenca` — Valor do atributo (ex.: 18).
- `mod_forca, mod_destreza, ...` — Modificador do atributo (ex.: +4).

> ⚠ **Canal `atributo` respeita o limite** (2026-07-29). Ele apara no limite daquele atributo (20
> padrão), não no teto de 30. Efeito que diz em texto que o limite sobe junto emite **as duas
> metades**: `atributo` para o valor e `limiteAtributo` para o teto. Ver a seção Sistema de
> ATRIBUTOS em `afty-status.md`.

### Núcleo
- `nd` — Nível de Desafio.
- `bt` — Bônus de Treinamento.
- `dom, au, cl, bar, er` — Níveis de aptidão (Domínio, Aura, Controle/Leitura, Barreira, Energia Reversa).

### Stats de combate (base)
- `defesa, acerto, cd` — Defesa, Acerto e CD.
- `atencao, iniciativa, deslocamento` — Atenção, Iniciativa e Deslocamento.
- `rd_geral, rd_irredutivel` — Redução de Dano.
- `guarda_max, hp_max, pe_max` — Guarda Inabalável, PV e PE máximos.

### Recursos atuais (combate)
- `hp_atual, pe_atual` — PV e PE atuais.
- `guarda_atual, alma_atual, hp_temp` — Guarda atual, Alma atual e PV temporário.
- `hp_pct, pe_pct` — Percentual de PV/PE atual (0–100).

### Estados de combate do Afty

- `fluxo_invencivel` vale 1 somente em combate e com o Ápice Fluxo Invencível escolhido.
  Seus efeitos fixos usam os canais existentes de Defesa, TR, RD Geral, margem, dados de crítico
  e ataques extras. Acerto e dano entram depois de resolver o ataque normal, sem ler o próprio
  bônus. Não há variável pública nova para acerto. A ativação é manual na bancada e na ficha.
- `em_combate` — 1 enquanto a bancada ou a sessão está em combate.
- `dominio_ativo` — 1 quando a sessão selecionou uma Expansão de Domínio válida.
- `estilo_ativo`: 1 com o Domínio Simples do Novo Estilo das Sombras no ar. O rótulo voltou a ser
  "Domínio Simples" em 2026-10-04, e o id não mudou.
- `estilo_tecnica` (2026-10-04) é estado de opção, a "Técnica Atual": gera `estilo_tecnica_<id>`,
  que vale 1 para a Técnica da Expansão imbuída. As linhas dela ligam com
  `estilo_ativo && estilo_tecnica_<id>`, e a Técnica inválida não liga nada.
- `estilo_<id>`: a quantidade imbuída de uma Técnica LEGACY (faixa). O remendo de custo do Estilo
  Liberado lê `estilo_acerto`. Guia em `docs/afty-estilo-sombras.md`.
- Os demais ids de `COMBATE_ESTADOS` viram identificadores normalizados pelo mesmo caminho. Estados
  de opção também geram uma variável para cada opção.
- Um estado `multi` gera a CONTAGEM de selecionados no nome dele mais uma booleana por opção
  (`aliados_escolhidos` e `aliados_escolhidos_protetor`).

#### Linha que depende de outra (`requerEstado` e `requerOpcao`)

`requerEstado` diz que a linha só aparece com outra ligada. Desde 2026-09-17 ela aceita companhia:
`requerOpcao` exige que o pai, um estado `multi`, tenha AQUELA opção marcada. Foi o que permitiu os
Aliados serem escolhidos antes de graduados, com uma linha só na bancada em vez de treze.

⚠ **Os dois campos são de TELA, e não de conta.** O `combateDslVars` não consulta nenhum dos dois:
uma graduação gravada continua sendo variável mesmo com o pai desmarcado. Quem precisa que o valor
dependa da escolha tem de escrever isso na PRÓPRIA EXPRESSÃO, e é o que os Aliados fazem
(`aliados_escolhidos_protetor * (...)`). Sem isso o limite de aliados por grau seria cosmético.

⚠ **Linha com valor próprio nunca some** (`estadoVisivel`, afty-combate.js). Esconder uma linha que
está produzindo número deixaria o bônus ativo e sem controle para desligá-lo, que é pior que a
linha sobrando na tela.

## Funções
- `metade(x)` — Metade de x.
- `dobro(x)` — Dobro de x.
- `teto(x)` — Arredonda pra cima.
- `piso(x)` — Arredonda pra baixo.
- `arredonda(x)` — Arredonda ao inteiro mais próximo.
- `abs(x)` — Valor absoluto.
- `min(a, b, ...)` — Menor valor.
- `max(a, b, ...)` — Maior valor.

## Operadores
- `+  -  *  /  %` — Aritmética.
- `<  >  <=  >=  ==  !=` — Comparações (resultam em verdadeiro/falso).
- `e   ou   nao` — Lógicos (também aceitam `&&`, `||`, `!`).
- `verdadeiro / falso` — Constantes booleanas (1 / 0).

## Exemplos
- `metade(nd)` — Metade do ND — bom pra escalar um buff.
- `bt + 2` — Bônus de Treinamento mais 2.
- `dom >= 3` — Pré-requisito: Domínio nível 3 ou mais.
- `hp_atual < metade(hp_max)` — Verdadeiro quando estiver com menos da metade da vida.
- `max(mod_presenca, 1)` — O modificador de Presença, no mínimo 1.
- `dom >= 3 e pe_atual >= 10` — Combina dois pré-requisitos.

## ⚠ Desde 2026-08-20 o Afty tem o PRÓPRIO avaliador

Até essa data o Afty usava o `fm-dsl.js` da 2.5.2 direto. Como ele é somente-leitura,
**função ou operador novo era impossível** sem furar a regra. O autor liberou a cópia ao
desenhar os Addons, e ela vive em **`src/systems/afty/afty-dsl.js`**.

- **A 2.5.2 segue intacta** com o `fm-dsl.js` dela. As duas divergem de propósito a partir
  de agora, e melhoria daqui **não volta para lá**.
- Tudo acima neste arquivo continua valendo nos dois: tokenizer, parser, avaliador, as 8
  funções e os operadores são os mesmos, e há assert de paridade nas duas pontas.

### O que só existe do lado do Afty

**Literal de texto**, entre aspas duplas ou simples. Ele **só vale como argumento de
função**, e o validador reprova em qualquer outro lugar (`2 + "abc"` é erro, e não 2).

**`contar(marca)`** — quantas entradas da ficha carregam aquela marca. É a irmã da booleana
`tem_*`: uma pergunta se você tem, a outra conta quantas. Nasceu para a família de
homebrew *"esta habilidade fica mais forte a cada outra do mesmo arquétipo que eu tiver"*.

```
2 + contar("adaptacao") - 1     // 2, e mais 1 a cada outra além desta
contar("lutador") >= 3          // condição em cima da contagem
```

Cada entrada da ficha rende duas espécies de marca:

| Espécie | De onde vem | Exemplo |
|---|---|---|
| escrita | o campo `tags` da entrada | `contar("adaptacao")` |
| automática | a família e a especialização dona | `contar("habilidade")`, `contar("lutador")` |

Marca é normalizada igual a identificador (minúscula, sem acento), então `contar("Adaptação")`
e `contar("adaptacao")` são a mesma. Marca que ninguém tem devolve 0, e não quebra a expressão.

⚠ **No estágio MONTANTE o `contar()` devolve 0**, porque ele roda antes de Habilidades,
Talentos e Aptidões existirem. É a mesma limitação do `tem_*` naquele estágio.

---

## ⚠ No Grimório Afty o vocabulário é MUITO maior

Este arquivo espelha o `fm-dsl.js` da 2.5.2, e ele é só a base. O Afty acrescenta
a maior parte das variáveis em `buildCriaturaDslContext` (`src/systems/afty/afty-efeitos.js`):
patamar e tipo como booleanas, grau, maestria, níveis por especialização, os estados
da bancada de Simulação de Combate, uma booleana por habilidade do catálogo, uma por
perícia, e mais. Numa criatura qualquer são cerca de **660 variáveis**.

**Não existe lista escrita delas, e é de propósito.** Uma lista à mão envelheceria
calada no dia em que alguém somasse uma variável ao contexto. Quem monta a lista é
`vocabularioDsl` (`src/systems/afty/afty-dsl-vocabulario.js`), que **classifica o
contexto real** em grupos: variável nova aparece sozinha, e o que nenhuma regra
reconhece cai num grupo "Outras" em vez de sumir.

👉 **Para ver o vocabulário com o VALOR de cada variável**, use o seletor `{ }` ao lado
de qualquer campo de expressão do Motor de Automação, no criador do Afty. Ele lista as
variáveis agrupadas com o valor atual daquela criatura, busca sem acento, e clicar
insere o nome no ponto do cursor.

⚠ As famílias grandes (`tem_*`, `prof_*`) mostram só o que **não é zero**, porque são
centenas de entradas e apenas uma dúzia costuma valer algo. A busca alcança todas, e o
cabeçalho do grupo mostra quantas estão visíveis do total.

### `sempre` e `nunca`, as duas constantes (2026-08-31, só no Afty)

Não são valor de ficha nenhum, são **vocabulário**: `sempre` vale 1 e `nunca` vale 0.

Elas existem por um engano real. O campo **enquanto** do Motor de Automação tem `sempre` como
placeholder, e escrever a palavra que a própria tela mostra caía no fallback `0` — que numa condição
é justamente o valor que **desliga** o efeito. A condição óbvia era a única forma de apagar a linha.

> Autor: *"O Motor de Automação enquanto: 'sempre' não funciona, só funciona se estiver vazio. Logo
> se eu deixo vazio fica ativado sempre, se eu escrevo sempre para de funcionar."*

⚠ **O editor confere os NOMES, e não só a sintaxe.** `validateExpression(expr, knownVars)` sempre
aceitou um segundo argumento, e o editor do Motor não o passava. Nome inexistente é sintaxe
perfeita: a caixa ficava **verde**, o `evalNumber` estourava e o efeito morria calado. Hoje o
vocabulário do seletor `{ }` é o conjunto de nomes conhecidos, e um nome errado fica vermelho na
hora, com o motivo escrito embaixo.

O criador compartilha `useDslConhecidas` entre `TecnicaMotorEditor`, `MotorEfeitosEditor` e
`ExprField`. Expressão e condição usam os nomes do mesmo vocabulário mostrado no seletor.
Chamadas como `contar("eco")` ficam fora do conjunto de variáveis. Na Habilidade Única, o
contexto do item complementa o da criatura. Nos modificadores de Ação e Característica,
`vocabularioInvocacao` preserva o namespace da invocação, inclusive seus atributos, grau,
tipo e marcadores, além de `nd` e `bt` do dono e das constantes `sempre` e `nunca`.

### `escala_ataque`, a parcela de nível da Jogada de Ataque (2026-09-23, só no Afty)

Vale `piso(nd / 1.5)` na criatura e `piso(nd / 2)` no jogador. É a mesma conta do `escalaFixa` de
`resolveTestes` (`afty-pericias.js`), que muda de régua pela divergência `escalaDosTestes`. Montada
no `afty-derive.js` e exposta em `buildCriaturaDslContext`.

Nasceu para o Espírito Incansável (Combatente 8°), cujo *"os pontos de vida temporários ganhos se
tornam o seu bônus de ataque"* era montado com `piso(nd / 1.5)` também no jogador. Um Combatente 20
com Força 16 tinha +24 de acerto na espada e ganhava 27 de PV temporário. Quem escrever uma
expressão que depende do bônus de ataque usa esta variável, e não a divisão escrita à mão: o
`acerto` em si continua fora do contexto (`VARS_ADIADAS`).

### O alvo com "ou" e o escopo `empunho:` (2026-09-23, só no Afty)

Um alvo pode listar escopos separados por `|`: `empunho:duas_maos|prop:pesada` vale para a linha que
responde a **qualquer** uma das partes, e entra **uma vez só**, por mais partes que a linha tenha.
Funciona nos leitores por escopo (`valorCanalEscopos` e `detalhesDoCanalEscopos` em `afty-efeitos.js`),
que são os das linhas de dano e de acerto, das Perícias e dos TR. Alvo sem `|` não muda nada.

Nasceu no Estilo Massivo, cujo "+1 em rolagens de dano com a arma" vale numa arma "que esteja usando
em duas mãos ou que possua a propriedade pesada". Eram duas linhas de efeito, uma por propriedade, e
as dez armas que são Pesadas **e** de Duas Mãos recebiam o bônus duas vezes.

O escopo `empunho:duas_maos` nasceu junto: ele marca a arma que está nas duas mãos agora, que é a
propriedade Duas Mãos ou a Versátil com o interruptor de duas mãos ligado. `prop:duas_maos` fala da
propriedade e não cobria a Versátil.

### O canal `semAtributoDano` (2026-09-23)

Sinalizador por fonte de dano: a linha deixa de somar o modificador de atributo. Nasceu na Postura da
Lua ("não recebem seu bônus de atributo no dano"). ⚠ Vale **só na ficha de jogador**, onde o atributo
é uma parcela da linha (dado mais modificador). Na criatura o atributo também decide quantos dados a
linha rola, e o canal é ignorado lá por decisão do autor (2026-09-23: *"Deixar como está"*). Com o
canal ativo, o hover mostra a parcela zerada com a fonte ("Força (Postura da Lua)").

### O canal `alcanceArma` (2026-09-23)

Metros a mais no alcance de uma fonte de dano (`alvo` de fonte, com os escopos de arma). Na arma corpo
a corpo ele soma ao alcance dela, e na de distância e na de arremesso soma aos **dois** alcances (curto
e longo). Entra **antes** do multiplicador, porque a Postura do Céu dobra "o alcance dos seus
ataques" e o bônus já faz parte desse alcance: um Arco Longo (30/60) com o Longo do Golpe Especial e
o Céu fica 78/138. O texto da linha usa vírgula ("1,5m").

Clientes: Extensão do Corpo e Sincronia Perfeita (`cat:corpo`, 1,5 cada) e o Longo do Golpe Especial
(`cat:corpo` 1,5 e `cat:distancia|cat:arremesso` 9). O Ataque Básico não é arma e não recebe os três.
Quem lê é o `alcanceDe` do `resolveDano` (`afty-pericias.js`).

Desde 2026-10-03, por decisão do autor nos dois sistemas, Alcance Corpo a Corpo do Auxiliar,
Ataque Circular (Manobras Finalizadoras do Lutador) e Articulações Extensas (Maldição Era de Ouro)
miram `basico|cat:corpo`. Não alteram Feitiços nem o Espaço/Alcance derivado do Tamanho.
O Circular soma 3 m somente com a manobra ligada e Empolgação pelo menos 5. Articulações Extensas
soma 1,5 m permanente. Alcance a Distância do Auxiliar mira `cat:distancia|cat:arremesso`.

O tradutor `efeitosDaTabelaDoAuxiliar` em `afty-combate-conjurador.js` emite as linhas de alcance
e mantém o pool exclusivo dos Auxiliares. O `alcanceDe` já lê o canal no Ataque Básico e agora
devolve `alcance.partes`, com base, Estendida, nomes das fontes do Motor (incluindo suplantados)
e multiplicador. A Ficha usa essas partes no hover do alcance, por `NumeroComFontes`.

### O escopo `treinada` (2026-09-23)

`escoposDaArma` marca com `treinada` a arma com que a ficha é treinada (o mesmo `treinada` que decide
se a jogada soma o Bônus de Treinamento). Nasceu no Golpes Potentes: *"Sempre que você estiver usando
uma arma com a qual você seja treinado"*. Importa desde que, no jogador, só a Classe inicial treina
equipamento (divergência `treinoDaClasseInicial`): um Suporte que multiclassa para Combatente segue
sem treino na Espada Longa, e o Golpes Potentes não pega nela.

### O canal `preparoTemporario` (2026-09-23)

Sem alvo. É o valor da casca de Pontos de Preparo temporários que a sessão TOPA no começo de cada
rodada (e no começo do combate), e não soma no máximo. Nasceu na Postura do Céu (*"você recebe 2
pontos de preparo temporários no começo de todo turno"*), e topa em vez de acumular por decisão do
autor. A casca é gasta antes do Preparo corrente e some no descanso (`ficha-sessao.js`).

### O contador de usos de Habilidade (`usos`, 2026-09-24)

Não é canal: é um campo da entrada de Habilidade no catálogo, `usos: { expr, recarga }`. O `expr` é
DSL avaliada no contexto final (lê atributo fechado, `maestria`, `nd`), e a `recarga` é `"curto"`,
`"longo"` ou `"descanso"` (quando o texto diz "curto ou longo" ou não diz). O validador do catálogo
recusa `expr` que não avalia e recarga fora da lista.

O derive devolve `usosHabilidades` (`{ [id]: { max, recarga } }`), a linha da Habilidade na Ficha
mostra "Usos restantes/máximo" com o menos gastando e o mais devolvendo, e a sessão guarda os
GASTOS sob `usos["hab:<id>"]`: subir de nível aumenta o máximo e os usos novos já nascem livres. O
Descansar zera tudo, porque o botão é um só (D3). A `recarga` fica gravada como dado para o dia em
que os dois descansos se separarem.

Hoje só as seis do Combatente declaram o campo (decisão do autor, 2026-09-23): Assumir Postura,
Indomável, Revigorar, Marcar Inimigo, Surto de Ação e Potência Antes de Cair. As outras classes
estão listadas em `docs/a-fazer.md`.

### O canal `proficienciaTRCasoJa` (2026-09-26)

O "Caso já seja" de Teste de Resistência, com alvo de TR e valor igual à faixa (1 Treinado, 2
Mestre). Nasceu no Treino de Testes de Resistência (`addons/treino-testes-de-resistencia.json`):
*"Você se torna treinado no TR escolhido. Caso já fosse treinado, recebe +1"*, e *"Você se torna
mestre [...] Caso já fosse mestre, recebe +2"*.

- **Cada efeito é lido sozinho** pelo `resolveTestes`, e não pela soma do canal. A 1ª e a 2ª etapa
  do mesmo treino dão 1 e 2, e somadas virariam outra coisa.
- **Cada um é comparado com as OUTRAS fontes do TR**: o pacote da Classe (com o Teste de
  Resistência Mestre), o `proficienciaTR` do Motor e, na criatura, a marcação da aba. Quando elas já
  dão aquela faixa, o efeito vira o mesmo número no teste (+1 no Treinado, +2 no Mestre), com o nome
  da fonte no hover. Senão, ele concede a faixa.
- ⚠ **No jogador a marcação à mão NÃO conta como outra fonte** (a divergência `trForaDoOrcamento`,
  "NÃO PODE SER ESCOLHIDO DE FORMA LIVRE"). Sem isso, marcar à mão por cima do treino daria o +1 de
  graça. Na criatura ela conta, e é paga: o canal nunca credita no orçamento, como o `semCredito` do
  Treino de Perícia.
- Ele é fonte para o aviso de TR marcado à mão (`semFonte`), mesmo quando virou número.

⚠ **O `proficienciaTR` comum SOMA as concessões** (duas de Treinado dão Mestre), e o `prof_tr_*` do
DSL lê a marcação à mão e, no jogador, a faixa da Classe (desde 2026-10-03, a maior das duas), mas
não as concessões do Motor. Por isso o "caso já seja" de TR que soma no teste não coube numa
expressão com `prof_tr_*`. A Força Imparável e a Resiliência Melhorada seguem nele (`1 +
(prof_tr_<tr> >= 1)`, com `semCredito`) e passaram a enxergar o TR da Classe no jogador.

## A LINHA PODE CAIR NA INVOCAÇÃO (`escopo`, 2026-09-15)

Uma linha do Motor escrita pelo jogador vale, por padrão, na CRIATURA. Com `escopo: "invocacao"`
ela passa a valer nas invocações dela, e aí ela lê **outro espaço de canais**: `INV_EFEITO_CANAIS`
(`src/systems/afty/afty-invocacoes.js`), que tem PV, Defesa, Acerto, TR, Perícia, atributo, limite
de atributo, orçamento de Ações e custo em PE, todos no sentido do shikigami.

Vale nas quatro fontes que o jogador escreve à mão, e em qualquer Addon que use o mesmo formato:
Técnica (Funcionamento Básico principal), Funcionamentos adicionais, Feitiço Passivo e buff de mesa
da Ficha Final. Quem colhe é `efeitosInvocacaoEscritos`.

⚠ **Os dois espaços repetem nomes de canal com sentidos diferentes.** `pv` na criatura é o PV do
personagem e `pv` na invocação é o do shikigami. Por isso a marca obriga um descarte do outro lado:
`efeitosDeLinhas`, `efeitosDosPassivos` e `efeitosDaSessao` (`afty-efeitos.js`) ignoram a linha
marcada. Sem esse descarte a linha contaria nos dois lugares, e o PV do personagem cresceria calado.

A mira tem duas camadas, as mesmas das Linhas de Treinamento:

| Campo | O que faz | Sem ele |
|---|---|---|
| `invocacaoAlvo` | o id de UMA invocação | vale para todas |
| `acaoAlvo` | o id de UMA Ação dentro dela | vale para todas as Ações |

⚠ **`acaoAlvo` só entrega em sete canais**, os que o `resolveAcao` busca no balde `porAcao`:
`danoNivel`, `danoBonus`, `curaNivel`, `curaBonus`, `ataqueDanoAdicional`, `acerto` e `cd`. Em
qualquer outro o balde nunca é consultado e o efeito sumiria sem erro. A lista é `CANAIS_POR_ACAO`,
declarada ao lado do `daAcao` que a consome, e ela vale em três pontos: a tela esconde o seletor de
Ação fora dela, o editor não grava a mira, e o coletor descarta a que chegar assim mesmo, deixando a
linha valer para a invocação inteira.

Detalhe completo em `docs/afty-invocacoes.md`. Assert: `asserts/t-invocacao-escrita.mjs`.

### As variáveis de invocação e de mesa (2026-10-01)

A atualização de Controlador e Invocações acrescentou estas, com o motivo de cada uma em
`docs/afty-invocacoes.md`:

| Variável | Onde | O que vale |
|---|---|---|
| `tipo_shikigami_puro`, `tipo_tecnica`, `tipo_maldicao`, `tipo_marionete`, `tipo_corpo` | contexto da invocação | 1 no tipo dela, um sinal por tipo. Código oficial novo usa só estes |
| `tipo_shikigami` | contexto da invocação | ⚠ LEGACY (DA-05): liga no Shikigami e na Maldição, o sentido antigo. Fica para addon antigo que o escreveu, e código novo não o lê |
| `marc_concentrar_poder` | contexto da invocação | a marca, e, na mesa, só com UMA invocação no total em campo (DA-15, condição `unicaEmCampo` do marcador). No criador segue acesa |
| `invocacoes_em_campo` | contexto da criatura | quantas invocações ocupam vaga em campo agora (a Horda, a Quimera e o Corpo de Múltiplos Núcleos contam 1, o Mecha 2). Só existe com mesa: no criador vale 0. É o número do Controle Sintonizado |

## Notas
- Identificadores são normalizados (minúsculas, sem acento): `Constituição` e `constituicao` são a mesma variável.
- As expressões leem os valores **base** (sem os próprios buffs) + os recursos atuais — então um efeito que modifica Defesa não lê a Defesa já modificada (evita laço).
- Em caso de erro na expressão, o valor cai no fallback (valor fixo do efeito, ou pré-requisito tratado como atendido), sem quebrar o app.
- Os canais são consumidores do resultado da DSL, não parte da linguagem. A integração de Domínio
  usa `movimentoMult` para multiplicar o movimento final, `custoPE` como redução de custo,
  `removeResistencia` como sinalizador por fonte de dano e `nivelAptidao` com `limiteAptidao` para o
  bônus que pode passar do teto normal.
- Dois canais de PV e Passivas (2026-09-18), liberados pela primitiva `pvEPassivas` (`permite:
  ["pvEPassivas"]` no Addon): `hpMult` multiplica o PV FINAL, depois da Integridade da Alma e do
  Patamar (o valor é o multiplicador, `2` dobra; as fontes somam entre si e o total tem piso de 1,
  igual ao `movimentoMult`), e `passivaSemCusto` é um sinalizador que isenta TODA Passiva do PE
  Máximo. Sem a primitiva os dois somem do seletor de canal, mas continuam valendo no motor.

## Bloodfeast (2026-10-01)

Primitiva optativa `bloodfeast` (o registro tem 23, com a `heranca` do mesmo dia). O pacote retém `bloodfeast.passivas`
(id, nome, descrição, nível e custoPV). O gate lê exclusivamente creature.addons.
Escolhas ficam em creature.bloodfeast, recursos em sessao.bloodfeast, nunca no
catálogo global. Bleed pode atingir uma sessão sem addon, sem conceder poderes.
Os efeitos usam os canais nativos de vulnerabilidade, resistência, imunidade,
RD e bônus. Conjuração consome nível vezes BT, saldo parcial é consumido e
insuficiência aplica Bleed igual ao nível. Consumo de pelo menos BT gera uma
carga de Hardblood por evento. Melhorias compartilham teto BT e saldo disponível.
`bloodfeastBase` preserva rolagens/CD antes de melhorias, impedindo acumulação
entre conjurações. A arma optativa aceita atributoAtaque e usarDadoArma,
resolvidos por linha de dano, sem mudar a política global do sistema.

## Grande Roda do Dharma (2026-10-07)

A primitiva optativa `rodaDharma` usa `opcoes.dharma` no derive, sem criar
variáveis DSL nem alterar o Ciclo de Adaptação existente. `efeitosDharma`
emite os canais nativos com fonte nomeada por adaptação e alvo.

- Ataque, contra o alvo selecionado: giro 2, `bonusAcerto = 2 * bt` e
  `ignoraTodaRD`. Giro 4, `removeResistencia`. Giro 6, `ignoraImunidade` e
  `dadosDano = 2`.
- Existência no giro 6, contra o mesmo alvo: mais `dadosDano = 2`.
- Defesa por tipo: giro 2, `rdTipo = bt`. Giro 4,
  `resistenciaDano`. Giro 6, `imunidadeDano` substitui a resistência da roda.
- Geral, somente no fenômeno recebido selecionado: giro 2, `rdGeral = 2 * bt`
  e `rdAlma = 2 * bt`, cobrindo os caminhos separados do motor. Giro 6,
  `imunidadeDano` nos tipos conhecidos, restrita por essa seleção de contexto.

As fontes não usam exclusividade: Geral e Defesa somam suas RDs, e Ataque e
Existência somam quatro dados. Seletores sem alvo não concedem efeitos globais.
Sem addon ou fora de `rulesVersion: afty`, estado salvo fica inerte.
Curas, contadores e anotações pertencem à sessão, não ao avaliador DSL.

Confirmações do autor em 2026-10-07: dois giros por fenômeno por rodada,
registro dos gatilhos pelo narrador, +4 dados de Ataque e Existência e
acúmulo das RDs de Geral e Defesa. A confirmação final definiu Geral
como dobro do BT e Defesa como BT. Somam `3 * bt`, ou 18 com BT 6.
Essa decisão substitui os valores de RD do texto original preservado.

## Técnica Máxima e Expansão de Domínio (2026-10-08)

Guia da área: `docs/afty-tecnica-maxima-dominio.md`.

- Variável `nivel_feitico_max`: o nível de Feitiço que a ficha já acessa (0 a 5), o mesmo
  `nivelMaxFeitico` que decide a escala da Técnica Máxima. O Talento Manual de Técnica usa
  `quando: "nivel_feitico_max >= 5"`.
- Canal `vagasTecnicaMaxima` (Orçamentos): vagas EXCLUSIVAS de Técnica Máxima. A Aptidão
  `tecnica_maxima` dá 1. É por ele que um Addon concede uma Técnica Máxima: o modelo `nivel: "max"`
  sozinho não concede nada.
- Canal `recargaTecnicaMaxima` (Vitalidade e Recursos): soma à recarga em rodadas. Negativo
  reduz (o Manual de Técnica escreve `-1`). A recarga nunca fica abaixo de 0.
- Canal `cdFeitico` (Ataque e Dano): CD só dos Feitiços. O `cd` continua sendo a CD única
  (Feitiços e Aptidões). É onde a Amplificação de Técnica da Expansão escreve (DA-13).
- O `custoPE` ganhou o escopo `dominio` no custo da Expansão. Uma linha só de `feitico` não
  alcança a Expansão, e uma sem alvo (o Condenado) alcança.
- O Efeito Especial de uma Expansão pode trazer linhas de Motor (`efeitos[].motor`), com a
  mesma forma `{ canal, expr, alvo? }`, ligadas só com a Expansão no ar. Ficam de fora os
  canais de Orçamentos, de Barreira e Domínio, e `nivelAptidao` e `limiteAptidao`
  (`canalPermitidoEmExpansao`).

## Deslocamento de Voo (2026-10-09)

- Canal `voo` (Movimento e Percepção), em metros, aceita 1,5. Zero é não voar, e a Ficha e o
  Preview só mostram a linha Voo quando há fonte. Nasceu com o addon Herdeiro Celeste
  (`addons/herdeiro-celeste.json`, Passos Celeste: `1.5 * bt`).
- O voo passa pelo `movimentoMult` e pelas condições do movimento (Lento e Enredado pela
  metade, Sofrendo -3, Imóvel zero), e o Caído o zera (regra `vooZero` em
  `CONDICAO_EFEITOS`). O hover (`partes.voo`) mostra as três camadas, como o do movimento.
- O multiplicador valer no voo é leitura de "Seu movimento dobra" da Expansão, registrada em
  `docs/a-fazer.md`.

## A arma escolhida pela origem e o treino na arma (2026-10-09)

- Canal `treinoArmaCasoJa` (Ataque e Dano, alvo de arma): a arma passa a somar o Bônus de
  Treinamento, e se ela já somava, o valor da expressão entra no Acerto e no Dano dela. O derive o
  converte em treino (jogador) ou em `acertoArma` e `danoBonus` com o nome da fonte, antes do dano.
- Alvo `@<id>` em efeito de origem: vira a arma que a ficha marcou em `armasDaOrigem[<id>]`
  (declarada por `armaEscolhida` numa característica ou opção). Sem arma marcada, a linha sai.
- Exemplo, o Grão Mestre em Arma do Não-Feiticeiro:
  `{ "canal": "treinoArmaCasoJa", "alvo": "@arma_masterizada", "expr": "piso(bt / 2)" }`.
- Os campos de origem que não são canal (`semEnergia`, `nivelMaximo`, `tetoNivelFeitico`,
  `concedeHabilidades`) estão em `docs/afty-addons.md`.
