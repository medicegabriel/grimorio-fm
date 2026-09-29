# Plano: a aba Buffs para uso em sessão

Pedido do autor (2026-09-22, com captura da aba depois da primeira reforma): *"melhorou mas ainda
está muito ruim. Ficou extremamente feio em quesito Design e confuso ainda para o uso. Faça um
planejamento completo [...] e volte com um plano elaborado"*.

⚠ **As fases 1, 2, 3 e 4 foram feitas em 2026-09-22**, com as decisões do autor da seção 7. O
resultado medido está na seção 6. Sobra a fase 5 (acabamento) e a 6 (Modo Combate).

---

## 1. O que eu medi, e não achei

Números tirados da Ficha de uma criatura de ND 20 com 12 estados ligados, 3 condições e 1 buff, na
tela de 1440px e na de 390px (script `mede-buffs.mjs`), mais o catálogo.

| Medida | Hoje |
|---|---|
| Altura da aba, desktop | 2334px, ou **2,3 telas** de rolagem |
| Altura da aba, celular | 3246px, ou **3,8 telas** |
| Seção Estados | 478px, sempre aberta |
| Seção Temporários | 412px, sempre aberta |
| Ladrilhos de Ligados | 12 caixas de 71px com **16px de sobra cada** |
| Estados no catálogo | 63, sendo 35 interruptores, 22 faixas, 6 escolhas |
| Rótulos acima de 22 caracteres | **27 dos 63** (o maior tem 38) |
| Famílias com irmãos | Golpe Especial (4), Manobra (4), Arte, Brutalidade, Precisão Definitiva, Surto, Estímulo Muscular |

E o que a captura do autor mostra, que a medição confirma:

1. **A fileira da grade estica pelo ladrilho mais alto.** O Invencível sob o Sol tem seis linhas de
   efeito, e a fileira inteira passa a ter a altura dele: quatro caixas quase vazias ao lado de uma
   cheia. É o vazio que dá a impressão de "feio" antes de qualquer outra coisa.
2. **Tudo é roxo.** Estado ligado por escolha e condição sofrida pelo inimigo têm a mesma cor, o
   mesmo peso e a mesma caixa. A tela não distingue "o que eu ganhei" de "o que estão fazendo comigo".
3. **Nome cortado.** "Postura da Devast...", "Estímulo Muscula...", "Comidas · Bônus ...". Com 27
   rótulos longos no catálogo, cortar é o caso comum, e não a exceção.
4. **Vinte caixas iguais com vinte botões × iguais.** Repetição sem hierarquia: nada indica o que é
   importante agora.
5. **Listas dentro do ladrilho.** "Aura do Bastião, Transferência de Aura, Aura Lacerante, Aura
   Movediça, Aura Redirecionadora" e "Energética, Leve, Nutritiva, Picante, Reforçada..." são
   parágrafos dentro de uma caixa de 15rem.
6. **Separador solto.** O ponto médio entre efeitos cai no começo da linha quando o texto quebra
   ("· Acerto +2" sozinho na última linha).
7. **Família repetida.** "Golpe Especial · Atroz", "· Letal", "· Penetrante" ocupam três caixas e
   repetem a palavra mais larga três vezes.

## 2. O que a pesquisa diz

- **Cartão é para explorar, lista é para varrer e comparar.** A NN/g é direta: a lista é eficiente em
  espaço e boa para ordenar e comparar, o cartão é para conteúdo rico e agrupamento visual. A nossa
  pergunta no meio do turno ("o que está ligado, quanto está me dando, como desligo") é varredura e
  comparação. Estamos usando o padrão do outro problema, e a crítica corrente de "cartão virou o
  padrão para tudo porque é o mais seguro" cai exatamente aqui.
- **Divulgação progressiva** (Nielsen, 1995): mostrar o essencial e deixar o resto a um toque. Na
  aba, "essencial" é o saldo e o que está ligado. O "resto" é o que cada efeito faz em detalhe, o texto
  do livro e o catálogo inteiro.
- **Barra de buffs de jogo eletrônico** (WoW, ESO e os addons que a comunidade escreve há vinte
  anos): ícone pequeno, contador de pilha e tempo restante em cima do ícone, detalhe no hover. A
  leitura acontece em um golpe de vista, e o texto só aparece quando pedido.
- **Foundry VTT**: o sistema base mostra efeito como ícone no token e no campo que ele altera, e os
  módulos mais usados (Visual Active Effects, Status Icon Counters) existem para dar *duração* e
  *contador* ao ícone. Ou seja: a lista de efeitos ativos é um painel pequeno e fixo, e não uma
  seção da ficha.
- **Argon Combat HUD** (o módulo de HUD de combate mais popular do Foundry) parte de uma premissa
  que vale para nós: **a ficha inteira não é a interface do turno**. O turno tem um painel próprio,
  com recursos, ações e estados, e a ficha fica atrás dele.
- **D&D Beyond** e os estudos de redesenho dele repetem o mesmo: PV, recursos e condições no topo,
  sempre à vista, no lugar de espalhados pela ficha.

Conclusão de leitura: a aba não precisa de "cartões mais bonitos". Ela precisa de **três camadas de
leitura** e de **cor com significado**.

## 3. A proposta: três camadas

### Camada 1: Painel do Turno (fixo no topo da aba)

Responde "como eu estou agora" sem rolar.

```
┌───────────────────────────────────────────────────────────────────────────┐
│ AGORA                                    [Em Combate]  [Densidade ▭]      │
│ ┌──────┬──────┬───────┬────────┬────────┬────────┬────────┐              │
│ │ACERTO│ DANO │ DEFESA│  TRs   │ MOVIM. │ PV TEMP│  +4 ▾  │              │
│ │  +6  │ +14  │   -5  │  -2    │  -12m  │  +20   │        │              │
│ │ → 24 │      │  → 30 │        │ → 4,5m │        │        │              │
│ └──────┴──────┴───────┴────────┴────────┴────────┴────────┘              │
│ SOFRENDO  ⬤ Paralisado 2 rod.   ⬤ Envenenado 5 rod.   ⬤ Desprevenido ∞   │
└───────────────────────────────────────────────────────────────────────────┘
```

- **O saldo** já existe (`saldoDoAgora`) e fica. Muda: ordem fixa por importância (Acerto, Dano,
  Dados, Defesa, TRs, Movimento, PV Temp, o resto), teto de 7 marcas visíveis e um `+N` que abre as
  demais. Hoje ele lista tudo e some no meio da própria largura.
- **A faixa SOFRENDO** é a novidade: as condições ativas como pastilhas curtas, na cor de dano, com
  o degrau e as rodadas. Tocar abre o detalhe da condição (camada 3). Some quando não há nenhuma.
- **Fixo**: `position: sticky` no topo da aba, para continuar visível ao rolar até Estados. A Ficha
  já tem a variável `--afty-topo` para quem gruda.

### Camada 2: O que está ligado (lista densa, agrupada)

Substitui os ladrilhos. Uma linha por estado, 28px na densidade confortável e 24px na compacta, em
duas ou três colunas conforme a largura do cartão.

```
LIGADOS AGORA                                                    12 · [Desligar Tudo]
LUTADOR                                  COMBATENTE
  Empolgação          4  Dano +7     ×     Golpe Especial · Atroz  Dano +7 · 1d8   ×
  Brutalidade            Dano +2     ×     · Letal                                 ×
  Impacto Misto          Dano +5     ×     · Penetrante                            ×
  Fúria da Vingança      Defesa +2   ×     Arte · Execução Silenc. Dano +21        ×
```

- **Sem caixa por item.** Fundo só no hover e no foco, separador por fio de 1px. A caixa roxa em
  cada item é o que faz vinte itens brigarem entre si.
- **Cabeçalho de família** (o `organizaEstados` já calcula) resolve o nome longo: "Golpe Especial ·
  Atroz" vira "Atroz" embaixo de "Golpe Especial", e ninguém precisa truncar.
- **Coluna de valor fixa**: o delta alinha na mesma coluna em todas as linhas, que é o que deixa
  varrer de cima para baixo.
- **Notas longas saem da linha**: "Imune a Críticos", "Rodada 1 de 4", a lista de auras escolhidas e
  as comidas consumidas vão para o detalhe (hover no desktop, toque no celular), com no máximo um
  "e mais 3" na linha.
- **Ações**: `×` desliga, a faixa mantém menos e mais, e um clique no nome abre o detalhe. "Desligar
  Tudo" no cabeçalho da seção resolve o fim do combate em um toque.

### Camada 3: Detalhe sob demanda

Um painel que abre no lugar (desktop) ou por baixo (celular) com o que aquela linha faz: as parcelas
com nome, o texto do livro quando existe, as escolhas possíveis (trocar a Postura sem ir até a lista
completa) e o custo em PE. É aqui que mora tudo que hoje está espremido dentro do ladrilho.

### As Condições, especificamente

O autor: *"deixar como uma lista não fala nada sobre nenhuma das condições ou mostra o que elas
fazem"*. O que muda em relação ao que está no ar:

1. **Pastilha na Camada 1** (nome, degrau, rodadas), porque condição é estado de combate e precisa
   ser vista antes de qualquer outra coisa.
2. **Cor própria.** Condição usa a cor de dano (vermelho) e não o roxo dos ganhos. Nenhuma outra
   mudança dá tanto resultado com tão pouca tinta: em um golpe de vista, vermelho é o que está
   contra você.
3. **Ícone por condição.** 29 ícones do `lucide` (olho cortado para Cego, corrente para Agarrado,
   gota para Sangramento...). Ícone é o que os VTTs usam porque funciona a dois metros da mesa.
4. **O detalhe vira painel**, e não cartão na grade: número, resumo, "Inclui", texto do livro e
   rodadas, com espaço para respirar.
5. **O catálogo vira gaveta com busca por teclado.** Abre, o foco cai na busca, digitar filtra, Enter
   aplica a primeira, Esc fecha. O mestre aplica "Atordoado" em três teclas. A grade de 29 tiles com
   parágrafo fica para quem está navegando, e não para quem está no meio do turno.

### O que sai do caminho

- **Estados** (a lista completa de 63) e **Temporários** (412px) passam a nascer **recolhidos**
  quando há algo ligado: são biblioteca, e não painel. O cabeçalho mostra a contagem.
- **Buffs de Mesa**: o formulário de criar (nome, escopo, canal, valor, rodadas) fica atrás de um
  botão "Novo Buff", em vez de ocupar uma linha inteira sempre.

## 4. Cor, tipografia e densidade

| Papel | Cor | Onde |
|---|---|---|
| Ganho | `--afty-cura` (verde) | números positivos do saldo |
| Perda | `--afty-pv` (vermelho) | números negativos, pastilha de condição |
| Escolha sua, ligada | `--afty-destaque` (roxo) | estado ligado, fundo do hover |
| Neutro | `--afty-texto-suave` | nota, rodada, contagem |

Regras que vão junto:

- **Nunca só cor**: sinal (`+`/`−`), ícone e degrau continuam valendo (daltonismo e tela clara).
- **Uma régua de altura**: 28px por linha no confortável, 24px no compacto, 44px de alvo no toque.
- **Zero truncamento silencioso**: ou o nome cabe pela família, ou quebra em duas linhas.
- **Número em fonte tabular**, alinhado à direita na coluna de valor (já é o padrão da Ficha).
- **Sem cápsula de raio total em frase** (regra do autor, 2026-09-03), que a versão atual ainda
  respeita e a nova mantém.

## 5. Fases, e o que cada uma entrega

| Fase | Entrega | Tamanho | Risco |
|---|---|---|---|
| ✅ **1. Densidade e hierarquia** | FEITO. Ladrilhos viraram lista densa agrupada por dono e família, sem truncar e sem nota longa na linha. Estados e Temporários nascem recolhidos, e o formulário de buff foi para trás de um botão. A cor de perda foi RECUSADA pelo autor: quem separa é o ícone. | meio dia | baixo |
| ✅ **2. Painel do Turno** | FEITO, menos o grudar. O saldo tem teto de 8 marcas com `+N`, e a faixa SOFRENDO mostra as condições com ícone e rodadas, levando ao cartão delas. O `position: sticky` ficou de fora: com as seções recolhidas a aba cabe em menos de duas telas, e o cabeçalho da Ficha já é grudado. | meio dia | baixo |
| ✅ **3. Detalhe sob demanda** | FEITO. A linha do estado e a da condição abrem um bloco recuado com o que elas dão por inteiro, as notas, o custo, a TROCA da escolha ali mesmo (a Postura, a Aura, a Manobra) e o texto do livro. A condição deixou de ser cartão e virou linha, e o cartão de 248px virou lista de 30px por condição. | um dia | médio, mexe no controle das escolhas |
| ✅ **4. Catálogo em gaveta** | FEITO. O catálogo virou camada (`GavetaDeCondicoes.jsx`) com a anatomia da busca global: foco no campo ao abrir, setas para andar, Enter aplica (e tira, quando já está aplicada), Esc limpa e depois fecha, clique fora fecha. O Sangramento ganha o campo de faixa no cabeçalho quando está sob o cursor, para o Enter ter o que aplicar. Os ícones já tinham entrado na fase 1. | meio dia | baixo |
| **5. Ícones e acabamento** | Ícone por família de estado, microinterações, revisão da densidade compacta, e a mesma régua no painel do Encontro. | meio dia | baixo |
| **6. Modo Combate (opcional)** | Uma tela cheia só de turno (recursos, ações, estados), no espírito do Argon HUD, para quem joga no tablet. | dois dias | alto, só com o autor querendo |

Recomendação: **fases 1 e 2 juntas**. Elas resolvem "feio" e "confuso" com pouco código, e o resto
fica mais fácil de decidir com a tela nova na frente.

## 6. Como se prova que melhorou

Além do olho, três medidas objetivas, no mesmo script de medição:

1. **Altura da aba com 12 ligados**: de 2334px para menos de 1200px no desktop (uma tela), e de
   3246px para menos de 1700px no celular (duas).
2. **Nenhum nome truncado** em nenhuma das duas larguras.
3. **Toques para as três tarefas do turno**: desligar um estado (1), aplicar uma condição (2, com
   busca), ver o que uma condição faz (1).

**Medido depois das fases 1 e 2 (2026-09-22):**

| Medida | Antes | Depois | Meta |
|---|---|---|---|
| Altura da aba, desktop | 2334px | **1754px** (1,8 tela) | 1200px |
| Altura da aba, celular | 3246px | **2242px** (2,7 telas) | 1700px |
| Seção Estados | 478px | 64px fechada | recolhida |
| Seção Temporários | 412px | 64px fechada | recolhida |
| Linha de estado ligado | 71px de caixa | **32px de linha** | uma linha |
| Condição aplicada | cartão de 90px | **30px de linha** (fase 3) | uma linha |
| Nomes truncados | 1 | **0** (nas duas larguras) | 0 |

A meta de altura não foi alcançada por inteiro, e o que sobra é sabido: o cabeçalho da Ficha (a Vida,
a Energia, a Alma e a fileira de stats) come 295px antes de a aba começar, e as Condições em cartão
ocupam 248px. Fechar a distância pede a fase 3 (o detalhe sob demanda tira o cartão da frente) ou uma
decisão sobre o cabeçalho, que é de outra aba.

E os asserts que já existem continuam valendo: eles medem número, e nenhuma fase aqui mexe em regra.

## 7. Decisões do autor (2026-09-22)

1. **Sem vermelho nas condições.** Elas seguem no roxo da casa, e a separação entre "o que eu ganhei"
   e "o que estão fazendo comigo" sai do ÍCONE, do agrupamento e da posição na tela, e não da cor. O
   verde e o vermelho continuam só nos números do saldo, que é sinal de grandeza e não de natureza.
2. **Ícones nas condições e nas famílias.** 29 ícones de condição, e um por dono de estado no
   cabeçalho de grupo (e não em cada linha, para a lista densa não virar um mural).
3. **Começar pelas fases 1 e 2**, juntas.
4. **Modo Combate fica para depois**, como pedido próprio.

## 8. Referências

- NN/g, Card View vs. List View: https://www.nngroup.com/videos/card-view-vs-list-view/
- Nielsen, Progressive Disclosure: https://www.nngroup.com/articles/progressive-disclosure/
- Foundry VTT, Active Effects: https://foundryvtt.com/article/active-effects/
- Visual Active Effects (painel fixo de efeitos): https://foundryvtt.com/packages/visual-active-effects
- Status Icon Counters (contador no ícone): https://foundryvtt.com/packages/statuscounter
- Argon Combat HUD (HUD de turno): https://foundryvtt.com/packages/enhancedcombathud

---

# Rodada 2 do plano (2026-09-22, segunda leva de feedback)

O autor voltou com três apontamentos **estruturais**, e pediu pesquisa em VTTs e sites de RPG
consolidados antes de qualquer traço novo:

1. A gaveta de condições ficou com **tamanhos irregulares**, começa **enorme**, e o **efeito mecânico
   aparece colado no efeito narrativo**. Sugestão dele: reduzir e mostrar o texto em si.
2. **Ligados Agora** melhorou mas tem falhas estruturais: **ícone de separação faltando**, **texto
   cortado** e, ao expandir, **a informação fica mal mostrada**.
3. **Temporários não precisa existir.**

## 9. O que a captura mostra, item por item

| # | Defeito | Causa no código |
|---|---|---|
| 9.1 | Ladrilhos da gaveta com alturas de 1 a 5 linhas | `grid-template-columns: repeat(auto-fill, minmax(13rem,1fr))` estica a fileira pelo mais alto, e o conteúdo de cada condição tem tamanho livre |
| 9.2 | A gaveta nasce com a altura da lista inteira | `max-height: 80dvh` sem `height`: 29 ladrilhos definem a altura, e ela muda a cada tecla do filtro |
| 9.3 | Mecânica e narrativa empilhadas | `.afty-cat-efeitos` e `.afty-cat-resumo` são dois `<span>` seguidos, sem rótulo que diga qual é qual |
| 9.4 | "Sangramento" com quatro botões de faixa no ladrilho | a segunda escolha mora no item da lista, e é ela que faz o ladrilho mais alto da grade |
| 9.5 | `efesa −4` | `.afty-estado-delta` tem `justify-content: flex-end` e `.afty-ligada-delta` tem `overflow: hidden`: o conteúdo transborda **para a esquerda** e é cortado no começo, comendo a primeira letra |
| 9.6 | `S...` no lugar de "Sol" | `.afty-ligada-escolha` é `flex-shrink: 1` com `min-width: 0`, então ela encolhe até nada antes de o delta ceder |
| 9.7 | "Postura S... efesa −4 · Dano +7" lido como uma frase só | nome, escolha e deltas são irmãos do mesmo flex, com o mesmo `gap`: não há divisor entre as três zonas da linha |
| 9.8 | Grupos sem separação visível | `.afty-ligados-dono` é só um texto em versalete, e `.afty-ligados-familia` não tem ícone nem fio |
| 9.9 | Detalhe expandido confuso | `.afty-detalhe-linha` é `flex-wrap` com rótulo de largura mínima: com rótulo curto e valor longo, as colunas não alinham entre linhas |

## 10. O que a pesquisa devolveu, e o que eu tirei dela

**Altura fixa em caixa de escolha.** O achado mais direto: uma caixa que cresce e encolhe conforme o
filtro estreita **move a linha que está debaixo do cursor no instante em que ela está sendo lida**.
A correção usada é dar altura fixa à caixa e rolagem à lista de dentro. É o 9.2 e metade do 9.1.

**Archives of Nethys (Pathfinder 2e), a referência de catálogo de condições da indústria.** Índice em
**coluna única**, agrupado por tema, e cada condição abre com **uma frase mecânica em negrito** antes
de qualquer detalhe. Nada de grade. A leitura de uma condição é: nome, o que ela faz, o resto.

**Painel de efeitos do Foundry (núcleo, PF2e e Visual Active Effects).** O efeito ativo aparece como
**ícone com uma etiqueta de contagem** (`[2/6]`), e o texto inteiro vem por **tooltip ou clique**.
Nunca por extenso na lista. Confirma o que a fase 3 já fez com as pastilhas do painel do turno, e
diz que o lugar do texto longo é o detalhe, não a linha.

**NN/g, cartão contra lista.** Cartão serve para conteúdo heterogêneo que se navega; lista serve para
itens iguais que se comparam e se ordenam. Vinte e nove condições são itens iguais. E o diagnóstico
de altura irregular em grade de cartões é exatamente "conteúdo de tamanho inconsistente".

**Mestre-detalhe.** O padrão nomeado para "lista de itens de um lado, o item inteiro do outro", com a
variante de o detalhe ficar **ao lado** em tela larga e **embaixo** em tela estreita. É o desenho que
resolve 9.1, 9.2, 9.3 e 9.4 de uma vez, porque tira todo o conteúdo variável da lista.

**Divulgação progressiva (Nielsen).** Primeiro o primário, o secundário atrás de um passo. Vale para
a linha do estado ligado: o número é primário, a escolha e as notas são secundárias, o texto do
catálogo é terciário.

## 11. O plano

### Fase A. A gaveta vira mestre-detalhe de altura fixa

- A gaveta passa a ter **`height` fixa** (`min(34rem, 80dvh)`), e não `max-height`: filtrar deixa de
  redimensionar a caixa.
- **Mestre**, coluna da esquerda de 17rem: uma **linha por condição**, todas com a mesma altura
  (ícone, nome, marca de aplicada). Cabeçalho de força **grudado** no topo da rolagem. Nada de
  efeito, resumo ou botão de faixa dentro da lista, que é o que fazia a altura variar.
- **Detalhe**, à direita, com o que a linha não carrega, e **cada coisa com seu rótulo**:
  - `No Número`: os efeitos numéricos numa tabela de duas colunas (rótulo à esquerda, valor à
    direita), uma por linha, em vez de uma frase com pontos médios.
  - `Inclui`: as condições que vêm junto.
  - `Na Mesa`: o que ela faz fora do número.
  - `No Livro`: **o texto verbatim**, que é o pedido do autor de "mostrar o texto em si".
  - Rodapé com a **Faixa do Sangramento** (só nele), as **Rodadas** e o botão Aplicar ou Tirar.
- Em tela estreita o detalhe desce para **baixo** da lista, e a caixa continua com a mesma altura.
- Teclado igual: setas andam no mestre e o detalhe acompanha, Enter aplica, Esc limpa e fecha.
- O mesmo desenho vai para o catálogo do **criador**, que tem a mesma grade irregular.

### Fase B. Ligados Agora: duas linhas, zonas separadas e detalhe em tabela

- A linha vira **duas**: em cima nome, escolha e controles; embaixo os **deltas com quebra livre**.
  Acaba o corte de `overflow: hidden` (9.5) e o encolhimento da escolha (9.6).
- O ponto médio entre deltas passa a ser `::after` do item anterior, e nunca abre uma linha nova
  começando com `·` (defeito 6 da rodada 1, que sobreviveu).
- O cabeçalho do dono ganha **ícone, contagem e um fio** que corre até a borda: é o separador que
  faltava (9.8). A família ganha **trilho à esquerda** ligando as linhas dela.
- O detalhe vira **grade de duas colunas** com rótulos alinhados entre as linhas (9.9), e não mais
  `flex-wrap` com largura mínima.

### Fase C. Temporários sai

A seção inteira, o memo que a calcula e os imports que só ela usava. O que ela dizia continua
alcançável no hover de cada número da Ficha, que é onde as fontes já moram.

## 12. Referências desta rodada

- NN/g, Progressive Disclosure: https://www.nngroup.com/articles/progressive-disclosure/
- Padrão mestre-detalhe: https://en.wikipedia.org/wiki/Master%E2%80%93detail_interface
- Oracle Alta, Master-Detail (detalhe ao lado ou embaixo): https://www.oracle.com/webfolder/ux/middleware/alta/patterns/MasterDetail.html
- Archives of Nethys, Conditions: https://2e.aonprd.com/Conditions.aspx
- Foundry VTT, Active Effects: https://foundryvtt.com/article/active-effects/
- Visual Active Effects: https://foundryvtt.com/packages/visual-active-effects
- Status Icon Counters: https://foundryvtt.com/packages/statuscounter

## 13. Resultado da rodada 2 (medido em 2026-09-22)

As três fases foram feitas no mesmo dia do apontamento. Medições na mesma criatura de sempre (ND 20,
13 estados ligados, 3 condições, 1 buff), a 1440px e a 390px.

| Medida | Rodada 1 | Rodada 2 |
|---|---|---|
| Gaveta de condições, altura | variável, da lista inteira | **fixa em 612px**, e a mesma com o filtro aplicado |
| Ladrilhos ou linhas da gaveta | alturas de 1 a 5 linhas | **29 linhas, todas de 32px** |
| Mecânica separada da narrativa | dois parágrafos seguidos | rótulos `No Número`, `Inclui`, `Na Mesa` e `No Livro` |
| Texto cortado em Ligados Agora | escolha em "S...", delta em "efesa −4" | **nenhum** (medido por `scrollWidth`) |
| Setas em Ligados Agora | uma por linha, 13 | **3**, só onde há o que abrir |
| Altura da aba, desktop | 2048px | **1985px** |
| Seção Temporários | 64px fechada | **não existe** |

Três coisas mudaram além do pedido, e todas pela mesma razão (a linha passou a dizer tudo):

1. O detalhe do estado **não repete mais** `Está Dando` nem `Também`.
2. `Quanto` virou leitura (`3 de 5`), e não um segundo par de botões para o mesmo número.
3. A seta só aparece quando há detalhe. Um interruptor simples não abre caixa vazia.

E o catálogo do **criador** recebeu o mesmo mestre-detalhe, com as condições aplicadas em linha:
o painel fica com 398px de altura, com filtro ou sem.
