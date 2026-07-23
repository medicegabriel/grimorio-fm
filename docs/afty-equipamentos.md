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

A **penalidade** vale em testes de perícia que usem **Destreza**.

---

## Escudos

Cada escudo fornece **Redução de Dano enquanto empunhado**, e essa RD é **RD Física** (autor), não RD
Geral. Penalidades de escudos e uniformes são **cumulativas**. Atacar com o escudo o faz deixar de
fornecer RD até o início do próximo turno (estado de combate, não modelado). O dano do escudo é de
**impacto** (o livro não diz, o autor confirmou).

| Escudo | Dano | RD Física | Penalidade | Custo | Espaços |
|---|---|---|---|---|---|
| Pequeno | 1d3 | 2 | 0 | 2 | 2 |
| Leve | 1d4 | 2 | -1 | 1 | 2 |
| Médio | 1d6 | 4 | -2 | 2 | 2 |
| Pesado | 1d8 | 6 | -4 | 3 | 2 |

O Escudo Pequeno **não ocupa uma das mãos**. O livro escreve "escudo leve" nessa frase, que o autor
confirmou ser erro do texto.

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

- **Encantamentos ACUMULAM** entre os graus (`faEncantamentosPermitidos` soma até o grau atual):
  arma no Primeiro Grau = 1+1+2 = **4**, escudo = **3**, uniforme = **4**. O Especial não ganha
  encantamento novo, concede a **habilidade única** (texto livre criado com o Narrador).
- **Bônus de Arma e RD do escudo NÃO acumulam** entre graus (usam só o valor do grau atual).
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

**Encantamentos com efeito ligado** (os únicos que mapeiam para um stat que o Afty calcula):
- **Canalizadora** (arma): `cd += 2`.
- **Reforçado** (escudo): `rdFisico += 2`.
- **Blindado** (uniforme): `defesa += 2`.
- **Propulsor** (uniforme): `movimento += 3`.

Um efeito só entra se o encantamento **atende ao pré-requisito** (senão fica inerte, além do aviso).

**Habilidade Única (Grau Especial):** além do texto (`fa.habilidadeUnica`), tem um **Motor de
Automação editável pelo jogador** (`fa.habilidadeEfeitos: [{canal, expr}]`), aplicado quando a
ferramenta está equipada. É a via para dar efeito mecânico à habilidade única, que por definição é
livre.

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

## O que o motor aplica

Em `afty-derive.js`, via `resolveEquipamentos` e `resolveCarga`:

| Canal | De onde vem |
|---|---|
| **Defesa** | bônus da modificação do uniforme equipado, mais -5 se sobrecarregado |
| **Deslocamento** | -4,5m se sobrecarregado |
| **RD Física** (`derived.rdFisico`) | escudos equipados. Canal NOVO, separado de RD Geral e Específico |
| **PV máximo** | Bracelete do Vigor (+10) e Ombreiras do Vigor Superior (+20) |
| **CD** | Chaveiro Canalizador (+1) |
| **Atributo** | os 6 acessórios de +2. **Passam o limite** do atributo, teto duro de 30 |
| **Carga** | espaços usados, limite, teto e sobrecarga |
| `derived.penalidadeDestreza` | uniforme + escudos, cumulativos. Calculado mas **não aplicado** |

⚠ **Ordem importa.** Os acessórios de atributo entram DEPOIS do clamp do limite (por isso passam
dele) e ANTES do cálculo de carga (por isso o Bracelete da Força aumenta o quanto você carrega).
`resolveEquipamentos` não calcula carga justamente por causa disso.

⚠ O bônus de **PV máximo de item entra depois da Alma e do Patamar**, ao contrário do treino. Um
item que diz "+10 pontos de vida máximos" dá 10, não 40 num Beyond. **Confirmar com o autor.**

---

## Decisões tomadas

1. **O "X/Y" do dano tem dois sentidos.** Com a propriedade `versátil` é uma mão / duas mãos. Sem ela
   (só Chicote Espinhento e Kusarigama) são dois dados de tipos diferentes, e o tipo de cada um vem
   do texto especial, porque a coluna da tabela ficou sem tipo. O validador cobra isso.
2. **A tabela manda no espaço.** A regra geral ("armas de duas mãos ocupam dois espaços") é só o
   default de item sem valor declarado. Manoplas e Kusarigama ficam em 1 mesmo sendo de duas mãos.
3. **Orçamento é indicativo** (autor). A aba conta e destaca quando passa, mas não bloqueia.
4. **Besta Leve** foi movida do grupo Arco para o grupo **Besta** (autor), casando com a Besta Pesada.
5. **Faixas continuam na tabela de armas** (autor), mesmo o texto dizendo que não são armas, porque
   contam como arma para Ferramenta Amaldiçoada. Marcadas com `contaComoArma: false`.
6. Desvios de gênero da tabela normalizados: "Amplo" do Bastão e "pesado" das Manoplas viram Ampla e
   Pesada. Bazuca com alcance "[9/18]" assumido em metros.

---

## Pendências

### Do autor
1. **Espaço de Fármacos e Espirituais.** O livro diz "itens consumíveis **como** talismãs e misturas
   ocupam meio espaço". Tratei "como" como exemplo, então Fármaco e Espiritual também ocupam 0,5 e
   só Acessório fica em 1. Se a leitura for literal, mude `ESPACOS_POR_CATEGORIA_ITEM`.
2. **PV máximo de item** entra depois da Alma e do Patamar (ver acima).
3. **Espaço de um kit de ferramentas.** O livro não diz, então vale o padrão dele (1 espaço).
4. O título da seção sai como **"FERRAMENTAS DE ALFAITE"** no PDF. Transcrito como **Alfaiate**,
   que é como o corpo do texto escreve.

### Do sistema
- **Ferramentas Amaldiçoadas** foram feitas em 2026-07-22 (ver a seção própria acima), com Motor de
  Automação: os 4 encantamentos com efeito de stat (Canalizadora, Reforçado, Blindado, Propulsor) e a
  Habilidade Única já entram no motor quando equipados. Os demais são situacionais/de combate e seguem
  como texto. Se o Afty passar a calcular Iniciativa, Acerto, manobras, TRs ou RD por elemento, dá para
  ligar mais encantamentos adicionando `efeitos: [{canal, expr}]` a eles.
- **RD Física** existe hoje só como número devolvido pelo motor (escudos comuns + grau da Ferramenta +
  Reforçado). O sistema de RD Física em si ainda não foi definido.
- **Efeitos inertes**, marcados com `aplicado: false` no catálogo, esperando sistema que não existe:
  Perícias (Sob Medida, Amuleto do Vislumbre, Pulseira Magistral, Pulseira Primacial e a própria
  penalidade de Destreza), Estamina, Dados de Vida, Exaustão e condições.
- **Habilidades que cobravam o Inventário** e agora podem ser ligadas: *Otimização de Espaço*
  (espaços adicionais iguais ao BT), *Ajustes em Equipamento*, e o grupo **Pugilato** citado por um
  Talento. Nenhuma foi ligada ainda, porque continua valendo o bloqueio raiz (não existe canal de
  efeito do lado da criatura).
