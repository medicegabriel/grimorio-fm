# Equipamentos (Grimório Afty)

Regras do capítulo de Equipamentos, transcritas em 2026-07-22. O **conteúdo** (52 armas, 48 itens
especiais, 4 modificações de uniforme, 4 escudos, 21 propriedades e 18 traços especiais) mora em
`src/systems/afty/afty-equipamentos.js`, com a descrição de cada um verbatim. Este doc guarda as
**regras de sistema**, que não cabem no catálogo, mais as decisões e o que ficou pendente.

A aba se chamava **Inventário** e foi renomeada para **Equipamentos** a pedido do autor.

---

## Os quatro tipos

- **Armas**, divididas em simples e complexas, com dano, peculiaridades de manejo e propriedades.
- **Uniformes**, que servem de identificação e podem receber modificações defensivas.
- **Escudos**, equipamentos defensivos adicionais.
- **Itens Especiais**, em 5 categorias (Acessórios, Espirituais, Fármacos, Misturas, Talismãs).

Mais os **7 Kits de Ferramentas**, todos de custo 1.

---

## Inventário e carregamento

Medido em **espaços de item**. Por padrão um item ocupa um espaço, com estas exceções:

| Ocupa | O quê |
|---|---|
| 0 | Uniformes sem Revestimento, com Revestimento Leve ou Sob Medida |
| 0,5 | Itens consumíveis como talismãs e misturas |
| 1 | O padrão |
| 2 | Armas de duas mãos, uniformes com Revestimento Médio, escudos e outros itens mais pesados |
| 4 | Armas massivas, uniformes com Revestimento Robusto e outros itens muito volumosos |

**Limite de carregamento = 8 espaços + o dobro do modificador de Força.** O livro escreve "(ou -2 por
modificador de Força negativo)", que é a mesma conta dita de outro jeito: os dois exemplos dele
(+2 de Força carrega 12, -1 de Força carrega 6) batem com a fórmula única.

Passar do limite deixa **Sobrecarregado**: **-5 na Defesa** e Deslocamento **reduzido em 4,5 metros**.
É impossível carregar mais que o **dobro** do limite.

Equipamento manejado ou vestido **continua ocupando espaço**. A mochila não ocupa, e recipientes cuja
única função seja carregar outros itens também não (a bainha está incluída no espaço da espada). O
mestre pode ignorar a regra inteira e usar senso comum.

---

## Equipamento inicial e ganho por grau

Todo personagem inicia com **dois equipamentos de custo 1** (arma, escudo ou item especial), **um
uniforme comum** e **um kit de ferramentas** a sua escolha.

Conjunto concedido gratuitamente no começo de toda missão, pelo grau do feiticeiro:

| Grau | Custo 1 | Custo 2 | Custo 3 | Custo 4 |
|---|---|---|---|---|
| Quarto Grau | 2 | | | |
| Terceiro Grau | 3 | 1 | | |
| Segundo Grau | 3 | 2 | 1 | |
| Primeiro Grau | 3 | 3 | 2 | 1 |
| Grau Especial | Ilimitado | 4 | 3 | 2 |

Pegar uma arma, uniforme, escudo ou acessório é uma **redução permanente** do conjunto enquanto
estiver com ele. Todo kit de ferramentas tem custo 1.

---

## Grau do Feiticeiro

Não é campo da ficha: **sai do ND por faixa** (autor, 2026-07-22), e o motor devolve em
`derived.grauFeiticeiro`.

| ND | Grau |
|---|---|
| 1 a 4 | Quarto Grau |
| 5 a 8 | Terceiro Grau |
| 9 a 12 | Segundo Grau |
| 13 a 16 | Primeiro Grau |
| 17+ | Grau Especial |

São os mesmos 5 graus do `AFTY_INV_GRAUS` das Invocações. **Não existe "Grau Zero"**: ele estava no
`AFTY_GRAUS_ITEM` antigo e foi removido a pedido do autor.

O **Grau de Equipamento** usa os mesmos 5 nomes, mas é outra coisa, e vem com as Ferramentas
Amaldiçoadas.

---

## Uniformes

Um uniforme só pode possuir **uma** modificação, sendo ela uma alteração completa da sua forma e base.
Os espaços vêm da tabela de carregamento, não desta.

| Modificação | Defesa | Penalidade | Custo | Espaços |
|---|---|---|---|---|
| Comum | 0 | 0 | inicial | 0 |
| Revestimento Leve | +2 | 0 | 1 | 0 |
| Revestimento Médio | +4 | -2 | 2 | 2 |
| Revestimento Robusto | +6 | -4 | 3 | 4 |
| Sob Medida | +1 | 0 | 2 | 0 |

⚠ **A coluna de Defesa NÃO vale na ficha de criatura** (autor, 2026-08-01). A tabela fica aqui porque
é o texto do livro e volta a valer na ficha de jogador. Na criatura:

**Defesa da armadura = o CUSTO dela, mais 1 por grau** da Ferramenta Amaldiçoada. Um Revestimento
Robusto (custo 3) de Segundo Grau dá 3 + 3 = 6. Helper: `defesaDaArmadura(def, grauDefesa)`.

⚠ **Sob Medida é a EXCEÇÃO declarada** (autor, 2026-08-01): custa 2 e dá **1** de Defesa, "já que ela
já dá benefícios em Perícia". É a única modificação com o campo `defesaCriatura`, e o valor bate com
o +1 da tabela do livro.

| Modificação | Custo | Defesa na criatura | Penalidade |
|---|---|---|---|
| Comum | 0 | 0 | 0 |
| Revestimento Leve | 1 | 1 | 0 |
| Revestimento Médio | 2 | 2 | -2 |
| Revestimento Robusto | 3 | 3 | -4 |
| Sob Medida | 2 | **1** (exceção) | 0 |

A **penalidade VALE e é aplicada** (autor, 2026-08-01, segunda passada), em testes de perícia que
usam Destreza, cumulativa com a do escudo. Ver a seção "O que o motor aplica". Os encantamentos
**Ajustado** (uniforme) e **Polido** (escudo) reduzem a penalidade do item, e a redução nunca
inverte o sinal: um Escudo Leve de -1 com Polido fica em 0, não em +1.

A tabela e as descrições foram **reconferidas com o texto do livro em 2026-08-01** e batem com o
catálogo.

✅ A exceção do Sob Medida resolveu de quebra o problema de dominância que a regra do custo tinha
criado: ele e o Revestimento Médio custavam 2 e davam a mesma Defesa, mas só o Médio tinha
penalidade e ocupava espaço. Agora o Médio dá 2 e o Sob Medida dá 1.

O motivo do recorte é a aba: a criatura tem inventário simplificado, para o mestre não precisar
pensar em qual item pegar.

<details><summary>Regra que valeu por algumas horas em 2026-08-01 (histórico)</summary>

A primeira passada do dia dizia "toda armadura fornece +1 de Defesa, mais 1 por grau", com a
penalidade removida. O autor trocou o +1 fixo pelo custo e mandou a penalidade de volta na mesma
sessão.
</details>

---

## Escudos

Cada escudo fornece **Redução de Dano enquanto empunhado**, assim como um valor de penalidade em
testes de perícia que utilizam Destreza. Penalidades de escudos e uniformes são **cumulativas**.
Atacar com o escudo o faz deixar de fornecer RD até o início do próximo turno (estado de combate,
não modelado). O dano do escudo é de **impacto** (o livro não diz, o autor confirmou).

⚠ **A RD do escudo é RD GERAL** (autor, 2026-08-01), e não RD Física como valia desde 2026-07-22.
As palavras dele foram "RD Geral, exceto Alma", que é a definição EXATA da RD Geral no Afty (foi por
isso que o Dano na Alma ganhou canal próprio em 2026-07-29), então não precisou de canal novo. O
campo do catálogo se chama `rdEscudo`, e não `rdFisico`, justamente para não sugerir tipo.

| Escudo | Dano | RD Geral | Penalidade | Custo | Espaços |
|---|---|---|---|---|---|
| Pequeno | 1d3 | 2 | 0 | 2 | 2 |
| Leve | 1d4 | 2 | -1 | 1 | 2 |
| Médio | 1d6 | 4 | -2 | 2 | 2 |
| Pesado | 1d8 | 6 | -4 | 3 | 2 |

A tabela foi **reconferida com o texto do livro em 2026-08-01** e os quatro números batem com o que
já estava no catálogo. Os Espaços não vêm desta tabela, vêm da regra geral de carregamento.

**Exemplo do autor, virado assert:** Escudo Pesado (6) de Grau Especial (5) dá **11 de RD Geral e -4
de penalidade**.

O Escudo Pequeno **não ocupa uma das mãos**. ⚠ O livro escreve "escudo leve" nessa frase, e o autor
já confirmou ser erro do texto, então o catálogo diz "pequeno". O texto reenviado em 2026-08-01
repete o "leve", o que é só a mesma fonte, e não uma retratação. **Confirmar se ainda vale.**

O encantamento **Reforçado** seguiu o escudo e também é **RD Geral** (autor, 2026-08-01), mesmo o
texto dele dizendo "contra dano físico". O encantamento **Isolante de escudo foi removido** na mesma
decisão: ver a seção de Ferramentas Amaldiçoadas.

---

## Ferramentas Amaldiçoadas

Transcritas em 2026-07-22. Qualquer **arma, escudo ou uniforme** do catálogo comum pode virar uma
Ferramenta Amaldiçoada. Isso acrescenta à entrada do inventário um campo opcional:

```
fa: { grau, encantamentos: [ids], habilidadeUnica: "" }
```

**Faixas contam como arma** para este fim (o próprio livro autoriza), então também podem virar
ferramenta mesmo tendo `contaComoArma: false`. Itens especiais e kits NÃO viram ferramenta
(`FA_TIPOS_EQUIP = ["arma", "escudo", "uniforme"]`).

### Grau de Equipamento

Os mesmos 5 nomes do Grau do Feiticeiro (`AFTY_GRAUS`), mas é **outra coisa**: cada ferramenta tem o
seu grau, escolhido pelo jogador, independente do ND. Benefícios por grau (`FA_BONUS_ARMA`,
`FA_RD_ESCUDO`, `FA_ENCANT_GANHO`):

| Grau | Bônus de Arma | RD do Escudo | Enc. Arma | Enc. Escudo | Enc. Uniforme |
|---|---|---|---|---|---|
| Quarto | +1 | 1 | — | — | +1 |
| Terceiro | +2 | 2 | +1 | +1 | +1 |
| Segundo | +3 | 3 | +1 | +1 | +1 |
| Primeiro | +4 | 4 | +2 | +1 | +1 |
| Especial | +5 | 5 | hab. única | hab. única | hab. única |

⚠ **O que cada grau entrega na ficha de criatura mudou em 2026-08-01.** O rank do grau (1 no Quarto,
5 no Especial) é o mesmo número em três lugares, e o dano é o único que escala diferente:

| Grau | Acerto da arma | Defesa da armadura | RD do escudo | Dano fixo da arma |
|---|---|---|---|---|
| Quarto | +1 | +1 | +1 | +4 |
| Terceiro | +2 | +2 | +2 | +8 |
| Segundo | +3 | +3 | +3 | +12 |
| Primeiro | +4 | +4 | +4 | +16 |
| Especial | +5 | +5 | +5 | +20 |

As três primeiras colunas são o **próprio rank do grau**, e somam por cima do equipamento comum: a
Defesa parte do **custo da armadura** e a RD parte da **RD do escudo**. Só o Dano escala diferente.

O **Acerto** entra na **linha daquela arma**, na aba Habilidades, e não no Ataque da aba Perícias:
o bônus é da arma, e somá-lo na categoria faria duas armas de graus diferentes disputarem o mesmo
número. O **Dano fixo** já existia, em `DANO_ADICIONAL_ARMA` (`afty-pericias.js`).

### Encantamento desce um grau (ficha de criatura)

Encantamento **não é recomendado para criatura**, e o preço é o grau: cada encantamento escolhido
faz o item **descer um degrau** nas quatro contas acima. Uma arma de Grau Especial com o encantamento
Potente calcula como **Primeiro Grau**, com dois calcula como Segundo, e assim por diante. O piso é
**zero**, que é grau nenhum e não soma nada (uma arma de Quarto Grau com um encantamento vira uma
arma comum para efeito de números).

Duas coisas ficam **de fora** da redução:

- A **Habilidade Única** do Grau Especial (autor). Ela não é encantamento, e o `grau` que a expressão
  dela lê no Motor é o **real**.
- **Quantos encantamentos o item aceita**, que segue vindo do grau real. Se descesse junto, a conta
  se morderia: pegar um encantamento cortaria o limite que autorizou pegá-lo.

Em código: `grauRankCalculo(grauValue, nEncantamentos)` e `grauDoRank(rank)`, e o resolver devolve
`rankCalculo`, `grauCalculoLabel` e `reduzido`. A UI mostra um chip âmbar "Calcula como X" quando há
redução.

- **Encantamentos ACUMULAM** entre os graus (`faEncantamentosPermitidos` soma até o grau atual):
  arma no Primeiro Grau = 1+1+2 = **4**, escudo = **3**, uniforme = **4**. O Especial não ganha
  encantamento novo, concede a **habilidade única** (texto livre criado com o Narrador).
- **Acerto, Dano, Defesa e RD NÃO acumulam** entre graus (usam só o valor do grau atual).
- **RD do escudo SOMA com a RD do escudo comum** (decisão do autor, 2026-07-22): Escudo Pesado (6) de
  Segundo Grau = 6 + 3 = 9. É a única regra desta seção que **o motor aplica** hoje, via `rdFisico`.
- **Cargas de Encantamento = bônus de treinamento do portador** (`derived.maestria`), compartilhadas
  por todos os encantamentos com carga do mesmo item. `resolveEquipamentos(creature, bt)` recebe o BT
  só para isso (o `deriveAfty` calcula o BT antes de chamar).

### Encantamentos

Três listas verbatim, ids prefixados por lista (`enc_arma_*`, `enc_esc_*`, `enc_unif_*`), porque
nomes repetem entre listas (Isolante existe em escudo e uniforme, textos diferentes). Campos:

- `usaCargas` (5 uniformes: Distorcivo, Estimulante, Impulso, Repulsor, Ricochete).
- `exclusivoCom` (Certeira ↔ Destruidora).
- `preReq` (texto do `[Pré-Requisito]` verbatim) + `requisitos` estruturado quando dá para checar.

`avaliarRequisitoEncantamento(req, ctx)` resolve os tipos: `grauMin`, `encantamento`,
`outroEncantamento`, `danoArma` (Afiada pede corte/perfuração, lê `def.dano`), `categoriaArma`,
`refEscudo` (Disco pede escudo leve/médio), `refUniforme` (Material Pesado pede revestimento médio ou
robusto). **Nada bloqueia** a escolha (filosofia indicativa da aba): pré-requisito não atendido,
exclusão e exceder o permitido viram **aviso** em `fa.avisos`, com chip âmbar/cadeado na UI.

### Motor de Automação (efeitos de encantamento e da Habilidade Única)

Os efeitos numéricos das Ferramentas usam o **Motor de Automação**, `{ canal, expr }` da DSL (mesmo
espírito do Motor das Invocações), aplicados **enquanto a ferramenta está equipada**. `resolveFerramenta`
avalia cada `expr` num contexto com `bt, nd, grau` (rank da ferramenta) e atributos/mods **base**
(o efetivo ainda não fechou quando o equipamento resolve, mas os efeitos são constantes, então não
muda nada hoje). Canais aceitos (`EQUIP_EFEITO_CANAIS`): `defesa, rdFisico, rdGeral, cd, movimento,
pvMax, peMax`. `resolveEquipamentos` soma `fa.efeitosPorCanal` nos acumuladores e `deriveAfty` os
aplica (novos canais: `equip.defesaBonus, movimentoBonus, rdGeralBonus, peBonus`, mais os já
existentes `cdBonus, rdFisico, hpMaxBonus`).

⚠ **`EQUIP_EFEITO_CANAIS` MORREU em 2026-08-01.** Era a lista de sete canais (defesa, rdFisico,
rdGeral, cd, movimento, pvMax, peMax) e era o teto que mantinha metade dos encantamentos como texto
morto, porque Perícia, Manobra, TR, Iniciativa, Acerto e Dano não cabiam nela. Os encantamentos
seguiram a Habilidade Única e passaram a escrever no **catálogo inteiro do Motor**, saindo por
`equip.efeitosEncantamento`. Diferença para a Habilidade Única: encantamento **não leva `exclusivo`**,
porque soma normal e não é fonte do pool exclusivo.

Dois campos são só deste arquivo e não chegam ao Motor:

- `alvoItem: true` no efeito: o alvo é o id do item. É como os canais de `fonteDano` miram "esta
  arma" em vez de uma categoria.
- Dois **pseudo-canais**: `acertoArma` (Acerto só manejando ESTA arma, porque o `bonusAcerto` do
  Motor mira categoria e vazaria para as outras) e `penalidadeEquip` (quanto a penalidade de
  Destreza deste item é reduzida).

A DSL do item ganhou `custo` e `penalidade`, além do `grau` que já tinha.

**Os 17 encantamentos ligados**, de 52:

| Encantamento | Onde | Como |
|---|---|---|
| Balanceada | arma | `bonusManobra` 2, nas quatro |
| Canalizadora | arma | `cd` 2 |
| Certeira | arma | `margemCritico` 1, nesta arma |
| Cruel | arma | `danoBonus` 3, nesta arma |
| Otimizada | arma | `iniciativa` 2 |
| Penetrante | arma | `ignoraRD` = BT, nesta arma |
| Poderosa | arma | `danoBonus` 2, nesta arma |
| Potente | arma | `dadosDano` 1, nesta arma |
| Precisa | arma | `acertoArma` 2 |
| Polido | escudo | `penalidadeEquip` 2 |
| Reforçado | escudo | `rdGeral` 2 |
| Ajustado | uniforme | `penalidadeEquip` 1, mais Furtividade 2 se a penalidade base for zero |
| Blindado | uniforme | `defesa` 2 |
| Furtivo | uniforme | `bonusPericia` furtividade = custo do uniforme |
| Marcial | uniforme | `bonusManobra` 2 |
| Material Pesado | uniforme | `bonusTR` fortitude 2 |
| Propulsor | uniforme | `movimento` 3 |

⚠ **Reforçado é `rdGeral`, e não `rdFisico`** (autor, 2026-08-01), mesmo o texto dizendo "contra dano
físico": a RD do escudo inteira virou Geral, e o adicional acompanha.

**O Ajustado num único efeito declarativo.** As duas metades da regra ("a penalidade é reduzida em 1,
caso possua" e "se já possuir 0 de penalidade, +2 em Furtividade") viram
`2 * (penalidade == 0)` na expressão do bônus, e um efeito que resolve em zero não vira linha. Foi
isso que evitou um caso especial em código.

**Os 35 que seguem como texto** caem em cinco bloqueios: efeito por gatilho ou reação (Amplificadora,
Harmonizada, Drenadora, Destruidora, Reluzente, Esponja, Repulsor, Ricochete, Revestido com
Espinhos, Escaldante, Distorcivo, Impulso, Estimulante), traço de arma que a linha de dano não usa
(Afiada, Defensora, Disco, Espinhoso, Destruidor, Avassalador), alcance e manejo (Cano Alongado,
Longa, Retorno, Compartimento, Armazenadora, Intangível, Aeronauta), efeito em OUTRA criatura
(Bloqueador, Expansão de Escudo), e **RD ou dano por tipo elemental** (Elemental, Sintonizada,
Isolante de uniforme, Resiliente), que esperam a lista de tipos de dano do autor.

⚠ Uma pendência real: **Complementar** dá "+2 na sua CD de Especialização e de Estilo Marcial". O
Afty tem UMA CD só (a Amaldiçoada, que a Canalizadora usa). Se as duas forem a mesma coisa, é uma
linha de `cd`. **Confirmar com o autor.**

⚠ **Discreta** dá "+5 em Furtividade e Prestidigitação **para esconder apenas a arma**". Ficou como
texto porque aplicá-lo sempre seria errado: o bônus é para um uso específico da perícia.

Um efeito só entra se o encantamento **atende ao pré-requisito** (senão fica inerte, além do aviso).

**Removido: o encantamento Isolante de ESCUDO** (autor, 2026-08-01). Ele dizia "a redução de dano do
escudo passa também a ser aplicada a um tipo de dano elemental à sua escolha", e virou letra morta
quando a RD do escudo passou a ser RD Geral, que já cobre todo tipo menos alma. O **Isolante de
uniforme é outro encantamento**, com outro texto, e continua existindo.

**Efeitos de perícia de ITEM também foram ligados** na mesma passada, pelo mesmo cano: Sob Medida
(+2 Acrobacia e Furtividade) e Amuleto do Vislumbre (+2 Percepção). Sobraram as duas Pulseiras
(Magistral e Primacial), que concedem treino numa perícia **à escolha do jogador** e precisam de uma
escolha na UI.

**Habilidade Única (Grau Especial):** além do texto (`fa.habilidadeUnica`), tem um **Motor de
Automação editável pelo jogador** (`fa.habilidadeEfeitos: [{canal, expr}]`), aplicado quando a
ferramenta está equipada. É a via para dar efeito mecânico à habilidade única, que por definição é
livre.

O editor usa o mesmo guia de variáveis e funções dos Funcionamentos Básicos. O valor exibido de
`grau` é o grau real da Ferramenta, e o contexto também oferece `custo` e `penalidade`. Canais que
pedem uma fonte de dano oferecem Ataque Básico, todas as armas, categorias, grupos, propriedades,
tipos de dano, Feitiços de Dano e as fontes concretas da ficha. Sem alvo continua significando
`todos`. Canais que pedem uma fonte de Cura oferecem as fontes catalogadas em `afty-cura.js`.

Compatibilidade de ficha: o alvo literal `"todos"`, gravado por versões anteriores, é lido como alvo
vazio. Sem essa normalização o Motor calculava o valor, mas o colocava numa fonte inexistente chamada
`todos`, e a Habilidade Única não alterava nenhuma linha final.

Expressões com `dados_dano_final` são resolvidas depois que cada linha de dano fecha sua quantidade
comum de dados. No canal Dados de Dano, esse valor é acrescentado uma vez ao Ataque Básico, às armas
e aos Feitiços atingidos pelo alvo da Habilidade Única.

### O que o motor NÃO aplica

- **Bônus de Arma** (dano de arma não é stat da ficha, igual às armas comuns): só exibido no item.
- **Encantamentos situacionais / de combate**, ou que dependem de stat que o Afty ainda não calcula
  (Iniciativa, Acerto, manobras, TRs, Perícias, RD por tipo elemental): seguem só como texto na
  descrição. São a maioria dos ~53 encantamentos.

### Criação e Identificação (só referência, não modeladas)

Criação (`FA_CRIACAO`): precisa do talento **Artesão Amaldiçoado** e treino em Ferramentas de
Canalizador ou de Ferreiro. Duas rolagens (Ofício Ferreiro + Ofício Canalizador) contra a CD do grau
(20/25/30/35/45, BT necessário +2/+3/+4/+5/+6). Identificação (`FA_IDENTIFICACAO_CD`): Feitiçaria CD
20 + 5 por grau acima do quarto (20/25/30/35/40), +10 para a habilidade única de uma Especial. Nada
disso é validado (Perícias, Ofícios e Talentos do personagem não existem).

### UI

Na linha do item carregado, uma **varinha** (`Wand2`) aparece para arma/escudo/uniforme: transforma em
ferramenta e abre o `FerramentaEditor`. Dentro dele, **Grau de Equipamento** e **Encantamentos** são
seções **recolhíveis** (`SecaoRecolhivel`, colapsadas por padrão, a pedido do autor), com o resumo no
cabeçalho. A **Habilidade Única** (só no Especial) tem a textarea de narrativa mais o `MotorEfeitosEditor`
(linhas de canal + expressão DSL com prévia do resultado). No fim da aba, o card **Ferramentas
Amaldiçoadas · Referência** (recolhido) traz as tabelas, criação, identificação, o catálogo completo
dos encantamentos e o exemplo Nuvem Brincalhona. Os efeitos ligados aparecem no card **Efeito do
Equipado**.

---

## Kits de Ferramentas

Usados durante descansos ou interlúdios. Um personagem só pode usar um kit no qual **possua
treinamento**, e ser treinado num **Ofício** dá treinamento no kit dele (Ofício (Cozinheiro) dá
ferramentas de cozinheiro). Todo teste com o kit é um teste do Ofício respectivo. ⚠ Nada disso é
validado, porque Perícias e Ofícios do personagem não existem.

Custo máximo do item que dá para **criar**, por nível (`custoMaximoCriacao`):

| Nível | Cria até |
|---|---|
| 1 a 5 | custo 1 |
| 6 a 10 | custo 2 |
| 11 a 16 | custo 3 |
| 17 a 20 | custo 4 |

O livro para no 20. Acima disso o motor mantém 4, que é o teto da tabela de custos.

Os 7 kits, na ordem do livro (Ferreiro vem antes de Farmacêutico): **Alfaiate** (acessórios e
uniformes, com limite por interlúdio), **Alquimia** (Misturas), **Canalizador** (Espirituais),
**Cozinheiro** (mecânica própria de refeições), **Entalhador** (Talismãs), **Ferreiro** (armas,
escudos e ferramentas amaldiçoadas, mais melhoria temporária em descanso), **Farmacêutico**
(Fármacos). Só Alfaiate, Cozinheiro e Ferreiro têm limite, o resto é ilimitado.

**Refeições do cozinheiro:** 7 benefícios, CD 15 no Ofício (Cozinheiro) com +5 por benefício
adicional, duram até o próximo descanso longo e beneficiam um número de criaturas igual ao BT.
Leve e Revigorante escalam pelo **rank do grau** do cozinheiro (3m e 5 PV temporários por rank),
que é o mesmo `rank` de `AFTY_GRAUS`.

Criar item é um **foco de interlúdio**, que o livro detalha no capítulo de Interlúdios (p.337, não
enviado). A aba de Interlúdios da ficha hoje só tem Treinamentos, então o foco de Criação de Itens
**não existe**.

---

## Níveis de Dano

O autor decidiu (2026-07-22): **siga sempre a escada canônica**. A tabela impressa do livro existe
para o jogador que não quer calcular na mão, e a **linha 7** (a das armas que começam em 2d8, 2d10)
não bate com a escada de propósito, porque foi montada subindo cada dado individualmente. Ela é
informativa e **não vira código**.

A escada já existe em `afty-invocacoes.js` (`subirNiveisDano`, `degrau`, `degrauDe`) e vale igual
para armas. Nada no equipamento base sobe nível de dano, então a extração dela para um arquivo comum
fica para quando as **Ferramentas Amaldiçoadas** chegarem, que é quem vai precisar.

Regra de conversão do livro, já implementada: se os dados de uma arma não caem na escada, some o
resultado máximo e ache o degrau mais próximo.

---

## Pugilato: as três que NÃO viram linha de ataque

**Faixas, Manoplas e Soco Inglês** (`grupo: "pugilato"`) ficam na tabela de armas, mas não são armas
para o cálculo: elas **são o Ataque Básico**. O `deriveAfty` filtra o grupo para fora das linhas de
arma e passa o item para a linha básica, que é a mesma que existe com a criatura de mãos vazias.

Consequência: uma Faixas equipada não acrescenta linha nenhuma na aba, ela muda os números da linha
que já estava lá.

**O que rende número, e o que não rende:**

| Situação | Efeito |
|---|---|
| Faixas na mochila | nada, só espaço e custo |
| Faixas equipada, sem Ferramenta Amaldiçoada | nada |
| Faixas equipada, com Ferramenta | +1 de Acerto por degrau do grau de cálculo, e o dano da `DANO_ADICIONAL_ARMA` (4, 8, 12, 16, 20) |

### ⚠ UM item define o golpe (2026-08-20)

Com duas de pugilato equipadas vale **uma só**, a de maior grau de cálculo, e nunca a soma. A regra
do grau sempre foi essa, e desde 2026-08-20 o **resto do item vem do MESMO item**: o encantamento e
a Fineza. Somar dois pares de Manoplas empilharia encantamento de duas armas num golpe só.

Item **sem** Ferramenta entra na disputa com rank 0. Ele não muda grau nenhum, mas pode ser o dono do
golpe quando é o único equipado, e é assim que ele recebe encantamento do **Manejo Especial**, que
vale para toda arma manejada.

### O que o item leva para a linha básica

1. **O grau**, que é Acerto e Dano (sempre foi).
2. **Os efeitos de encantamento com `alvoItem`** (Potente, Poderosa, Penetrante, Cruel). O efeito é
   gravado com o alvo do ITEM, e a linha básica passou a responder também pelo **id do item**, que é
   como ela escuta. Antes de 2026-08-20 esses efeitos eram descartados calados, e o encantamento
   ainda descia o degrau do grau: pôr Potente numas Faixas era prejuízo puro.
   ⚠ Só o id entra no escopo. `"arma"`, a categoria e o grupo ficam de fora **de propósito**, porque
   o livro diz que Faixas não são armas.
3. **As fontes de Acerto que não são o grau** (o encantamento Precisa), para o hover mostrar cada
   uma com o nome dela. Antes o bônus inteiro aparecia dentro de "Grau da Ferramenta".
4. **A Fineza** (Soco Inglês). O golpe básico abria a escolha de Destreza só pelo canal
   `finezaAtaque` (Corpo Treinado), e a propriedade impressa na tabela não chegava a lugar nenhum.

### O que o item NÃO leva

- **A jogada de ataque.** O básico rola sempre **Corpo a Corpo**, e por isso o seletor de Ataque
  (Corpo a Corpo ou Amaldiçoado) **não aparece** nas três de pugilato. Ele aparecia e gravava o
  campo sem mudar número nenhum. Se o Ataque Amaldiçoado tiver de valer para golpe desarmado, é
  regra nova e o seletor não mora no card do item, porque o golpe básico existe sem item nenhum.
- **A margem de crítico**, que é 20 fixa no básico. As três têm `critico: null` na tabela.
- **O tipo de dano**, que o golpe desarmado não tem. Quem mira `tipo:im` não alcança o básico.

---

## O que o motor aplica

Em `afty-derive.js`, via `resolveEquipamentos` e `resolveCarga`:

| Canal | De onde vem |
|---|---|
| **Defesa** | custo da armadura vestida, mais o grau da Ferramenta, mais -5 se sobrecarregado |
| **Acerto** | grau da Ferramenta da arma, na linha de dano daquela arma |
| **Dano** | grau da Ferramenta da arma (`DANO_ADICIONAL_ARMA`), na linha daquela arma |
| **Acerto e Dano do golpe básico** | o item de pugilato equipado, na linha do Ataque Básico (ver a seção acima) |
| **Deslocamento** | -4,5m se sobrecarregado |
| **RD Geral** | escudos equipados + grau da Ferramenta |
| **RD Física** (`derived.rdFisico`) | só o que nomeia o tipo (encantamento Reforçado, Aura Reforçada). O ESCUDO saiu daqui em 2026-08-01 |
| **Perícias de Destreza** (`derived.penalidadeDestreza`) | penalidade da armadura + a dos escudos, cumulativas. Não pega TR nem Jogada de Ataque |
| **PV máximo** | Bracelete do Vigor (+10) e Ombreiras do Vigor Superior (+20) |
| **CD** | Chaveiro Canalizador (+1) |
| **Atributo** | os 6 acessórios de +2. **Passam o limite** do atributo, teto duro de 30 |
| **Cura** | Apanhador de Saúde (+1 por dado, teto = metade do ND), por `efeito.motor` |
| **Carga** | espaços usados, limite, teto e sobrecarga |

### Item no Motor: `efeito.motor` (2026-08-03)

Saída GERAL do item para o catálogo inteiro de canais, `[{ canal, alvo?, expr }]`, no mesmo caminho
dos encantamentos. Até aqui o item só alcançava o Motor por campo NOMEADO (`hpMax`, `cd`,
`atributo`, `pericia`), cada um com um `if` no `resolveEquipamentos`, e o **Apanhador de Saúde** não
cabia em nenhum. Item novo usa o `motor` e não precisa de campo nem de `if`.

O valor viaja resolvido, como literal, pelo mesmo motivo dos encantamentos: a expressão lê `grau`,
`custo` e `penalidade`, que são do item e não existem no contexto da criatura. O `grau` que ela vê é
o `rankCalculo`, já rebaixado por encantamento. Efeito que resolve em zero não vira linha.

### Item que CURA: o campo `cura` (2026-08-03)

`{ fixo }` ou `{ fracaoPV }` mais `alcance`, e vira uma linha no card de Cura da aba Habilidades
(ver `afty-cura.js`). Hoje são quatro: Símbolo da Vida (10), Símbolo de Vida Florescente (25),
Símbolo de Vida Absoluta (`fracaoPV: 1`) e Laço da Vida (`fracaoPV: 0,5`).

⚠ **Item que CURA basta CARREGAR. Item que MELHORA cura precisa estar EQUIPADO.** Consumir um
talismã ou um remédio não pede equipar, e o botão de equipar é dos itens que valem enquanto
vestidos. É a única exceção ao "só o que está equipado conta" logo abaixo, e ela é da regra, não do
código.

⚠ **Item que cura é FLAT**: os canais de cura não entram nele. "Curando-se em 10 pontos de vida" é
número do talismã, e não uma cura que a criatura realiza.

⚠ Os três **Remédios** e o **Elixir da Vida** ficaram de fora, e o bloqueio é nomeado: os quatro
gastam **Dados de Vida**, que não existe no Afty.

⚠ **Ordem importa.** Os acessórios de atributo entram DEPOIS do clamp do limite (por isso passam
dele) e ANTES do cálculo de carga (por isso o Bracelete da Força aumenta o quanto você carrega).
`resolveEquipamentos` não calcula carga justamente por causa disso.

✅ O bônus de **PV máximo de item entra ANTES da Alma e do Patamar** (autor, 2026-08-01), junto do
treino e do canal `hp` do Motor. Um item de "+10 pontos de vida máximos" vale 40 num Beyond.

⚠ **Só o que está EQUIPADO conta**, e desde 2026-08-01 isso inclui as **armas**, que ganharam botão
de equipar. A linha de dano da arma só sai com ela equipada, o que **muda a decisão de 2026-07-27**
("uma linha para cada Tipo de Arma colocado"). O motivo é o Acerto: carregar uma arma na mochila não
pode render número.

A penalidade vale só em **"testes de perícia que utilizam Destreza"**, que é o que o livro escreve:
não pega Teste de Resistência (nem o de Reflexos) nem Jogada de Ataque. Aparece no hover da perícia
como a fonte "Armadura e Escudo". As Manobras herdam de graça pela Acrobacia, que é o que elas leem.

---

## Decisões tomadas

1. **O "X/Y" do dano tem dois sentidos.** Com a propriedade `versátil` é uma mão / duas mãos. Sem ela
   (só Chicote Espinhento e Kusarigama) são dois dados de tipos diferentes, e o tipo de cada um vem
   do texto especial, porque a coluna da tabela ficou sem tipo. O validador cobra isso.
2. **A tabela manda no espaço.** A regra geral ("armas de duas mãos ocupam dois espaços") é só o
   default de item sem valor declarado. Manoplas e Kusarigama ficam em 1 mesmo sendo de duas mãos.
3. **Orçamento é indicativo** (autor). A aba conta e destaca quando passa, mas não bloqueia. O
   catálogo tem **filtro por custo** (2026-08-01), que é a pergunta direta do orçamento: "o que
   ainda cabe na vaga que me sobrou". Os chips oferecidos saem dos custos que EXISTEM no recorte
   atual (aba mais sub-filtro), então a aba de Kits, onde tudo custa 1, não mostra filtro nenhum, e
   Armas Simples oferece só C1 e C2 enquanto as Complexas vão até C4. O recorte para no sub-filtro
   de propósito: incluir a busca faria as opções mudarem a cada tecla. O custo escolhido é
   **derivado, não corrigido em estado**: se a aba nova não tiver aquele custo, ele é ignorado em
   vez de esvaziar a lista, e sem `useEffect` com `setState` (que o eslint barra por renderização
   em cascata).
4. **Besta Leve** foi movida do grupo Arco para o grupo **Besta** (autor), casando com a Besta Pesada.
5. **Faixas continuam na tabela de armas** (autor), mesmo o texto dizendo que não são armas, porque
   contam como arma para Ferramenta Amaldiçoada. Marcadas com `contaComoArma: false`. O que separa
   as três do resto no CÁLCULO é o `grupo: "pugilato"`, e não essa marca: `contaComoArma` e
   `dano: { desarmado: true }` documentam, não fazem. Ver a seção Pugilato.
6. Desvios de gênero da tabela normalizados: "Amplo" do Bastão e "pesado" das Manoplas viram Ampla e
   Pesada. Bazuca com alcance "[9/18]" assumido em metros.

---

## Pendências

### Do autor
1. **Espaço de Fármacos e Espirituais.** O livro diz "itens consumíveis **como** talismãs e misturas
   ocupam meio espaço". Tratei "como" como exemplo, então Fármaco e Espiritual também ocupam 0,5 e
   só Acessório fica em 1. Se a leitura for literal, mude `ESPACOS_POR_CATEGORIA_ITEM`.
2. ✅ **PV máximo de item**: entra ANTES da Alma e do Patamar (autor, 2026-08-01). Feito.
3. ✅ **Espaço de um kit de ferramentas**: 1 espaço (autor, 2026-08-01), que já era o padrão.
4. O título da seção sai como **"FERRAMENTAS DE ALFAITE"** no PDF. Transcrito como **Alfaiate**,
   que é como o corpo do texto escreve.
5. ✅ **Números dos escudos**: reenviados em 2026-08-01 e idênticos aos que já estavam. Só a RD
   trocou de canal (Física para Geral).
6. ⬜ **"Escudo leve" na descrição do Escudo Pequeno**: o texto reenviado repete o erro. Confirmar
   que a correção para "pequeno" segue valendo.
7. ✅ **Sob Medida**: dá 1 de Defesa, quebrando a regra do custo (autor, 2026-08-01).
8. ⬜ **Complementar** (encantamento de arma) dá "+2 na CD de Especialização e de Estilo Marcial". O
   Afty tem uma CD só. Se for a mesma, é uma linha de `cd`.
9. ⬜ **Tipos de dano elementais**: `TIPOS_DANO` tem só os quatro das armas (Cortante, Impacto,
   Perfurante, Queimante). O autor vai mandar a lista completa, que é o que destrava a RD por tipo
   de dano prometida na sessão de 2026-07-30.

### Do sistema
- **Ferramentas Amaldiçoadas** foram feitas em 2026-07-22 (ver a seção própria acima), com Motor de
  Automação: os 4 encantamentos com efeito de stat (Canalizadora, Reforçado, Blindado, Propulsor) e a
  Habilidade Única já entram no motor quando equipados. Os demais são situacionais/de combate e seguem
  como texto. Se o Afty passar a calcular Iniciativa, Acerto, manobras, TRs ou RD por elemento, dá para
  ligar mais encantamentos adicionando `efeitos: [{canal, expr}]` a eles.
- **RD Física** existe hoje só como número devolvido pelo motor (escudos comuns + grau da Ferramenta +
  Reforçado). O sistema de RD Física em si ainda não foi definido.
- **Efeitos inertes**, marcados com `aplicado: false` no catálogo, esperando sistema que não existe:
  Perícias (Sob Medida, Amuleto do Vislumbre, Pulseira Magistral, Pulseira Primacial), Estamina,
  Dados de Vida, Exaustão e condições. ⚠ As **Perícias existem desde 2026-07-29**, com canal
  `bonusPericia`: os quatro itens de perícia podem ser ligados a qualquer momento, e ninguém voltou
  para fazê-lo. É o mesmo envelhecimento calado do requisito `nota` das Aptidões.
- **Habilidades que cobravam o Inventário** e agora podem ser ligadas: *Otimização de Espaço*
  (espaços adicionais iguais ao BT), *Ajustes em Equipamento*, e o grupo **Pugilato** citado por um
  Talento. Nenhuma foi ligada ainda, porque continua valendo o bloqueio raiz (não existe canal de
  efeito do lado da criatura).
