# Ficha Final do Afty (plano)

Plano de construção da **Ficha Final**, a tela de USO da criatura. Escrito em 2026-08-05, antes de
qualquer código. Leia junto com `afty-status.md` (estado do sistema), `automacao-dsl.md` (o DSL) e
`afty-formulas-base.md` (as fórmulas).

> Até aqui o Afty só tinha o **criador**. A Ficha Final é a outra metade: o que fica aberto na mesa
> enquanto se joga. O criador **calcula**, a Ficha **opera**.

---

## ONDE ESTAMOS (atualizado em 2026-08-06)

**Todas as fases estão feitas.** A Ficha está usável na mesa de ponta a ponta. O que
resta é conteúdo travado em decisão do autor, e não tela.

| # | Fase | Estado | O que ela entregou | Seção |
|---|---|---|---|---|
| 0 | Fundação | Feita | rota, sessão isolada, tokens de tema | 13 |
| 1 | Sessão | Feita | PV, PE, Alma, rodada, descanso, autosave | 13 |
| 2 | Ações e rolagem | Feita | Dano, Cura, Manobras, histórico de rolagens | 14 |
| 3 | Locomoção | Feita | busca global (Ctrl+K), Rápido, filtro por aba | 15 |
| 4 | Buffs | Feita | três camadas: catalogados, ad-hoc, condições | 17 |
| 5 | Aparência | Feita | CSS personalizado, presets, prompt para IA | 16 |
| 6 | Acabamento | Feita | celular, densidade, impressão | 19 |
| 7 | Inventário e atributos | Feita | aba Equipamentos, carga, os seis atributos | 22 |
| 8 | Domínios e Invocações | Feita | Domínio nas Ações, Invocações em aba própria | 23 |
| 9 | Nenhuma rolagem de string | Feita | dano estruturado, dois grupos de dado | 25 |

**As seis abas da Ficha hoje:** Ações, Habilidades, Perícias, Equipamentos, Invocações e
Buffs.

**O que falta, e por que não está feito:**

| O que | Travado em |
|---|---|
| Habilidades na aba Ações | **D7**: nenhum catálogo tem metadado de ação, custo ou usos |
| Descanso curto e longo | **D3**: falta a regra do que cada um devolve |
| Condições com mecânica | **D6**: as 26 condições não têm efeito modelado |
| RD abatendo dano sozinha | **D9**: decisão do autor |
| Trilho lateral de Buffs | **D10**: preferência do autor |
| PV por Invocação | pergunta 3 da seção 24 |

**Antes de começar qualquer coisa:** ler a **seção 24**, que é a lista viva de dúvidas e
de decisões que eu tomei sozinho.

---

## 0. As quatro decisões que o autor tomou (2026-08-05)

| Pergunta | Resposta | Consequência |
|---|---|---|
| Ficha de criatura ou de jogador? | **Ficha de jogo da CRIATURA** | Nenhuma regra nova entra antes da tela. Tudo vem do `deriveAfty` que já existe |
| Rola dados? | **Rola tudo, com histórico** | Subsistema novo (`ficha-rolagem.js`) + painel de log. É o maior item de escopo |
| Dispositivo | **75% desktop, 25% celular e tablet** | Desktop dirige o layout, mas 1 em cada 4 sessões é toque: **hover não pode ser o único caminho** |
| Layout | **Vitais fixos no topo, abas embaixo** | Cabeçalho pegajoso com PV, PE e defesas. O corpo troca por aba e rola sozinho |

⚠ **A ficha de JOGADOR continua fora de escopo.** O livro dá ao jogador fórmulas diferentes das da
criatura (o TR do jogador é mod + metade do nível + BT, e a criatura usa a escala por Tipo). Quando
ela vier, a tela é reaproveitada inteira e o que troca é a fonte dos números.

---

## 1. O que a Ficha é, e o que ela NÃO é

**É:** a criatura já montada, aberta para uso. Recursos correntes, ações à mão, buffs ligáveis,
rolagem, e o "de onde vem esse número" a um toque.

**Não é:**
- Não é um segundo criador. Trocar Habilidade, Aptidão ou atributo continua sendo no criador, e o
  botão **Editar** leva para lá.
- Não é o rastreador de encontro da 2.5.2. Uma criatura por vez.
- Não é lugar de texto escrito por nós. ⚠ Vale a distinção: **texto do LIVRO é conteúdo e aparece**
  (a descrição verbatim de uma Habilidade é o que o jogador precisa ler na mesa). **Texto escrito
  por nós explicando um número não aparece**, e continua valendo a regra do criador: explicação de
  número mora no painel de fontes, explicação de item mora no `title`.

---

## 2. Onde o código mora

Tudo em `src/systems/afty/`. O grimório 2.5.2 continua intocado.

```
src/systems/afty/
  ficha/
    AftyFicha.jsx          entrada: cabeçalho fixo, abas, trilho lateral
    ficha-sessao.js        estado de jogo: shape, normalize, reducers puros, persistência
    ficha-acoes.js         monta a lista de Ações a partir do derived
    ficha-buffs.js         buffs ad-hoc (linha do Motor com duração) e expiração por rodada
    ficha-rolagem.js       motor de dados: rolar, crítico, vantagem, log
    ficha-tema.js          tokens, presets e o CSS personalizado
    ficha.css              a pintura por token (a única folha de estilo do Afty)
    abas/
      AbaAcoes.jsx · AbaHabilidades.jsx · AbaPericias.jsx
      AbaEquipamento.jsx · AbaTecnica.jsx · AbaNotas.jsx
  ui/
    fontes.jsx             PainelDeFontes e ValorComFontes, extraídos do builder
    primitivos.jsx         Card, BoolChip, VezesGauge, SecaoRecolhivel
```

### O único arquivo fora do Afty que muda: `src/App.jsx`

Hoje, em `aftyMode`, **clicar na criatura e clicar no lápis levam os dois ao criador**
(`onOpenCreature={aftyMode ? goToBuilder : goToTracker}`). A mudança é de uma linha mais uma view:

- `onOpenCreature` (o card) passa a abrir a **Ficha**.
- `onEditCreature` (o lápis) continua abrindo o **criador**.

⚠ Tudo guardado por `aftyMode`, então o caminho da 2.5.2 não muda em nada. `App.jsx` já carrega
código do Afty (a detecção de rota e o selo), então é onde isso pertence. **`src/components/`
continua sem um diff sequer**, que é o teste do projeto.

### Extração dos primitivos (fase 0)

`PainelDeFontes`, `ValorComFontes`, `Card`, `BoolChip` e `VezesGauge` são funções LOCAIS do
`AftyCreatureBuilder.jsx`, sem export. A Ficha precisa das cinco. **Copiar divergiria na primeira
errata**, então saem para `ui/` e o builder passa a importar. É mecânico e o build cobre.

⚠ Ao extrair, o `PainelDeFontes` ganha o modo TOQUE (ver seção 7). O builder herda de graça.

---

## 3. Estado: o que é ficha e o que é sessão

O `createBlankAfty` diz, na primeira linha, o que a ficha é: **"só ESCOLHAS, os stats são
derivados"**. PV corrente não é escolha, é runtime. Então **a sessão não mora na ficha**.

| | Onde | Quem escreve |
|---|---|---|
| Escolhas (atributos, habilidades, itens...) | a criatura, em `fm_creatures_afty_v1` | o criador |
| Aparência (tema e CSS) | a criatura, em `creature.aparencia` | a Ficha |
| **Sessão** (PV corrente, buffs, log...) | **chave própria**, `fm_ficha_sessao_afty_v1:<id>` | a Ficha |

**Por que chave separada.** O criador tem rascunho automático que restaura sozinho e um Salvar que
grava a ficha inteira. Com a sessão dentro da criatura, abrir o criador com um rascunho de ontem e
salvar **apagaria o PV da luta de agora**, calado. A chave separada mata a classe inteira de bug, e
de quebra o export da criatura não carrega PV de meio combate.

⚠ **O `combatState` que está no schema desde sempre continua morto.** Ele é herança da 2.5.2 e
nunca foi lido pelo Afty. A sessão nova o substitui. Decidir se ele sai do `createBlankAfty` ou fica
como campo morto (pergunta D2).

```js
// ficha-sessao.js
{
  hpAtual, peAtual, pvTempAtual,
  almaAtual,                 // 0 a almaMax. Ver seção 4, ele mexe no PV MÁXIMO
  rodada: 0,
  condicoes: [{ id, nome, forca, rodadas, nota }],
  buffs:     [{ id, nome, canal, alvo, expr, rodadas, fonte }],
  combate:   { ... },        // o mesmo shape do COMBATE_ESTADOS
  usos:      { [fonteId]: gastos },
  favoritos: [ ids ],
  log:       [ { id, ts, rotulo, formula, dados, total, critico } ],
  atualizadoEm
}
```

Persistência por debounce de 600ms, igual ao rascunho do criador. Sem botão Salvar: sessão não é
rascunho, é fato.

### ⚠ A bancada do criador e os buffs da Ficha são o MESMO shape, e devem ser estados DIFERENTES

`creature.combate` existe hoje e é a **bancada de balanceamento**: o autor liga Brutalidade e
Postura para ver o pico ao montar uma criatura de ND alto, e isso fica salvo de propósito.

A Ficha usa exatamente o mesmo catálogo (`COMBATE_ESTADOS`) para os buffs de mesa. Se os dois
escrevessem no mesmo campo, **toda sessão de jogo destruiria o cenário de balanceamento** e vice
versa. Então a sessão tem o `combate` dela, e a Ficha deriva assim:

```js
deriveAfty({ ...creature, combate: sessao.combate })
```

Uma linha, zero mudança no motor. É a recomendação, e é a pergunta **D1**.

---

## 4. O motor não muda (quase)

A Ficha **não recalcula nada**. Ela lê `deriveAfty(creature)` e exibe, que é a convenção do projeto
inteiro. Três acréscimos pequenos e aditivos são necessários:

| # | O quê | Por quê | Tamanho |
|---|---|---|---|
| M1 | `efeitosDaSessao` em `afty-efeitos.js` | os buffs ad-hoc entram no Motor pela mesma porta que o `efeitosDaTecnica` do Funcionamento Básico já usa, com `duracao: "temporaria"` forçada | ~15 linhas |
| M2 | `almaAtual` opcional no `deriveAfty` | ver abaixo | ~5 linhas |
| M3 | nada mais | a bancada, os canais, o pool exclusivo e as fontes já servem | 0 |

### ⚠ M2: dano na Alma muda o PV MÁXIMO, e o motor hoje ignora isso

O criador tirou o campo de Integridade da Alma de propósito (a criatura nasce íntegra), e o
`almaMult` passou a seguir o **máximo**: `almaMult = almaMax / 100`. O comentário do
`afty-derive.js` já diz onde o corrente deveria viver: *"O valor CORRENTE existe só no jogo"*.

Em jogo isso é mecânica de verdade: uma criatura com Alma em 60 tem **60% do PV máximo**, e o
número grande no topo da Ficha precisa cair junto. Então o derive ganha um argumento opcional, e
sem ele nada muda para o criador.

⚠ **Consequência de UX:** baixar a Alma baixa o PV máximo, e o PV corrente precisa ser aparado no
novo máximo. Isso tem de aparecer, senão o jogador vê vida sumir sem explicação. O painel de fontes
do PV já mostra "Integridade da Alma ×0,6", então a explicação existe. Falta o aviso do momento.

---

## 5. Buffs temporários, em três camadas

Este é o coração do pedido. As três camadas moram no mesmo painel, na mesma ordem.

### Camada 1: os catalogados (já existem e já funcionam)

`COMBATE_ESTADOS` tem **33 estados** hoje, filtrados por `requerHabilidade`, `requerTalento`,
`requerAptidao` e `requerEscolha`, mais os extras vindos da ficha (Habilidade Única de item). Cada
um vira variável do DSL, e o `quando` de cada habilidade liga e desliga sozinho. **Nada disso
precisa ser construído, só reapresentado.**

O que muda em relação ao card do criador:

1. **Agrupados por fonte** (Lutador, Combatente, Restringido, Aptidão, Item) em vez de uma lista
   corrida de 33 linhas.
2. **O delta aparece.** Ligar Brutalidade mostra o que ela fez: `+3 Acerto`, `+2d8 Dano`. O
   mecanismo não exige nada do motor: **roda o `deriveAfty` duas vezes e compara** (com o estado e
   sem ele). O par "tudo ligado contra tudo desligado" custa 2 derives e alimenta o resumo
   permanente do trilho. O delta de UM estado é calculado sob demanda, ao passar o foco na linha.
   ⚠ **Medir antes de prometer:** se o derive de uma ficha de ND 40 custar mais que ~10ms, o delta
   por linha vira clique em vez de foco.
3. **O que está ligado sobe para o trilho**, sempre visível, com o botão de desligar tudo.

### Camada 2: os ad-hoc (o "o mestre deu +2 de Defesa por 3 rodadas")

Não existe hoje, e é o que separa uma bancada de uma ficha de mesa. O shape é o **mesmo do
Funcionamento Básico**, que já é escrito à mão pelo jogador e já passa pelo DSL inteiro:

```js
{ nome: "Bênção do Aliado", canal: "defesa", alvo: null, expr: "2", rodadas: 3 }
```

Ganhos de reusar o shape: o seletor de canal de 3 colunas já existe, o validador de expressão já
existe, o painel de fontes já nomeia a parcela, e a expiração é só decrementar `rodadas`.

⚠ **`duracao: "temporaria"` é forçada.** Um buff de mesa nunca conta para pré-requisito, que é
exatamente a regra que o autor deu em 2026-07-28: *"se o aumento de Força for temporário, não!"*.

### Camada 3: as condições

`CONDICOES_CATALOGO` existe em `afty-feiticos.js` com as 26 condições em quatro forças, mas **é só
nome**: nenhuma tem efeito mecânico modelado. Então a camada 3 nasce como **marcador com duração**,
e qualquer número que a condição imponha entra como buff da camada 2. O painel já fica desenhado
para receber mecânica no dia em que o autor mandar as regras (pergunta D6).

### A régua do tempo

Um contador de **rodada** com o botão "Próxima rodada" decrementa toda duração e avisa o que
expirou. **"Descanso"** zera os `usos` das linhas de cura e o que mais for por descanso. ⚠ O
sistema tem descanso curto e longo, e o que cada um devolve é pergunta aberta (D3).

---

## 6. Rolagem de dados

`ficha-rolagem.js`, puro e testável (o RNG entra por parâmetro, então os asserts rodam com dado
viciado).

**A boa notícia: não há nada para parsear.** O motor já entrega tudo estruturado:

| Fonte | O que já vem pronto |
|---|---|
| Dano | `{ dados, dado, fixo, margemCritico, ignoraRD, acerto, partes, partesAcerto }` |
| Cura | `{ dados, faces, fixo, usos, custo }` |
| Perícia, TR, Ataque | `{ bonus, partes, prof }` |
| Feitiço | `resumoFeiticos` já dá valor, custo em PE e avisos |

Uma rolagem é `{ rotulo, formula, dados: [...], modificador, total, natural, critico }`. O log
guarda as últimas 50 e mostra a fórmula ao lado do total, então ninguém precisa confiar cegamente.

**Vantagem e desvantagem** entram como controle da própria rolagem (2d20 fica o maior ou o menor).

⚠ **Duas regras precisam do autor antes desta fase (D4 e D5):** o que o crítico faz no Afty (dobra
os dados, maximiza, outra coisa) e como a vantagem se marca. O resto da fase não depende delas, e a
`margemCritico` por linha de dano já vem calculada pelo motor.

---

## 7. Navegação: como se locomover numa ficha de ND 40

O problema declarado é carga cognitiva. Sete mecanismos, em ordem de impacto:

1. **Cabeçalho fixo, sempre.** Duas fileiras em desktop (nome e chips, depois PV, PE, PV Temp, Alma
   e a fileira de defesas), que **encolhem para uma** ao rolar. Nada do que se olha o tempo todo
   sai da tela.
2. **Abas por frequência de uso na mesa**, e não pela ordem do criador:
   `Ações · Habilidades · Perícias · Equipamento · Técnica · Notas`.
3. **Trilho direito em telas ≥ 1280px** com **Buffs ativos** e **Log de rolagens**. São as duas
   coisas que se toca a cada turno, e elas não podem custar uma troca de aba. Abaixo disso viram
   gaveta pelo rodapé. ⚠ Isto é um acréscimo ao layout escolhido, e o autor pode vetar.
4. **Busca global (Ctrl+K)** sobre habilidades, talentos, aptidões, feitiços, itens e perícias.
   Numa ficha com 40 habilidades escolhidas, é o maior ganho isolado da lista.
5. **Barra Rápido**: o jogador fixa as 6 a 10 coisas que realmente usa, e elas ficam no topo de
   Ações. Uma ficha de ND 40 tem 40 linhas, e ele usa 6.
6. **Teclado**: `1` a `6` trocam de aba, `Ctrl+K` busca, `Esc` fecha painel, `Espaço` na linha rola.
7. **O que não se aplica SOME.** A convenção já vale no Preview (o card de Cura some inteiro para
   quem não cura, os Níveis de Aptidão somem no Restringido) e vale na Ficha inteira.

Mais um botão de **densidade** (compacto e confortável), que é o que resolve o mesmo layout servindo
monitor grande e tablet.

### O toque, que é 25% do uso

⚠ **O `PainelDeFontes` é hoje `hidden group-hover:block`, CSS puro.** No celular ele nunca abre, e
o "de onde vem esse número" some justo para quem mais precisa. A extração da fase 0 conserta:

- `@media (hover: hover)` mantém o caminho de hover em quem tem mouse.
- No toque, o valor vira botão: um toque abre, toque fora ou `Esc` fecha, um painel por vez.
- Foco de teclado abre também, e o painel é anunciável por leitor de tela.

⚠ Duas armadilhas já conhecidas do projeto valem aqui: **arredondar canto com `overflow-hidden`
corta o painel** das últimas linhas, e **dois gatilhos de hover no mesmo `group` acendem juntos**
(a linha de Dano tem Acerto e Dano, e precisou de grupo nomeado). O cabeçalho fixo acrescenta a
terceira: ele cria contexto de empilhamento, então painel de fonte do cabeçalho precisa de camada
acima do corpo.

---

## 8. A aba Ações, e o metadado que não existe

**Cai pronto do motor:** as linhas de Dano (uma por arma mais o Ataque Básico, com Acerto ao lado),
as 12 linhas de Cura, os Feitiços criados (com custo em PE e nível), as Manobras (Agarrar, Derrubar,
Desarmar, Empurrar), a Expansão de Domínio ativa e as Invocações.

**Não cai:** ⚠ **nenhum catálogo tem metadado de ação.** As 413 Habilidades de Especialização, os 51
Talentos e as 85 Aptidões têm `id`, `nome`, `descricao` e `requisitos`, e mais nada. Não existe
campo dizendo se é ação, ação bônus, reação ou passiva, nem quanto custa em PE, nem quantos usos
tem. **Sem esse metadado a Ficha não pode montar uma lista de ações a partir das habilidades.**

Três caminhos, e o autor escolhe (D7):

| Caminho | Custo | Risco |
|---|---|---|
| **A. Só o que é estruturado** vira Ação, e as habilidades vivem na aba delas, buscáveis, com botão de fixar em Rápido | zero | a lista de Ações fica menor do que o jogador espera |
| **B. Metadado novo no catálogo** (`uso: { acao, custo, usos }`), preenchido aos poucos | alto, 549 entradas | nenhum, é dado explícito |
| **C. Leitor do texto verbatim** marca o card quando a descrição diz "como uma ação bônus", "como uma reação" ou "gaste N pontos" | baixo | falso positivo. ⚠ Nunca muda número nem reescreve texto, só põe uma etiqueta |

Recomendo **A agora, C como etiqueta opcional, B incremental** para as que o autor quiser priorizar.
A ficha nasce honesta e melhora sem retrabalho.

---

## 9. CSS personalizado

O pedido é que cada pessoa formate a aparência da própria ficha, com cor, imagem e gif. Quatro
camadas, da mais fácil para a mais livre.

### ⚠ A decisão que viabiliza tudo: a Ficha é pintada por TOKEN, não por classe do Tailwind

O criador é pintado com `bg-slate-900`, `text-purple-300` e afins. **Cor escrita assim não é
tematizável**: para trocar o roxo o usuário teria que sobrescrever dezenas de classes de utilidade e
adivinhar quais. Então a Ficha inverte:

- **Tailwind só para LAYOUT** (flex, grid, espaçamento, tamanho de fonte).
- **Cor, borda, raio, sombra, fundo e família de fonte saem de variáveis CSS**, num
  `ficha.css` com classes semânticas.

```css
.afty-ficha {
  --afty-fundo: #0f172a;      --afty-fundo-card: #1e293b;
  --afty-borda: #334155;      --afty-texto: #f1f5f9;
  --afty-texto-suave: #94a3b8;
  --afty-destaque: #a855f7;   --afty-destaque-suave: #7e22ce33;
  --afty-pv: #f43f5e;         --afty-pe: #38bdf8;   --afty-alma: #e879f9;
  --afty-aviso: #fbbf24;
  --afty-fonte: system-ui;    --afty-fonte-titulo: inherit;
  --afty-raio: 12px;          --afty-sombra: 0 2px 8px #0006;
  --afty-imagem-fundo: none;  --afty-imagem-opacidade: 1;
}
```

Isso também é o que faz o Tailwind v4 jogar a favor: as utilidades dele vivem em `@layer`, e
**CSS sem camada vence CSS em camada, independente de especificidade**. O `<style>` do usuário
sobrepõe a folha do app sem precisar de um `!important` sequer.

### Camada A: presets

Cinco a seis temas prontos, um clique: Padrão Roxo, Pergaminho, Sangue, Neve, Vitral, Terminal.
Cobre a maioria das pessoas sem que ninguém abra um editor.

### Camada B: formulário

Seletor de cor para cada token nomeado, URL de imagem de fundo com ponto focal e opacidade, escolha
de fonte. Zero conhecimento de CSS. Reusa o `RetratoFocoPicker` que já existe.

### Camada C: CSS livre

Um campo de texto injetado como `<style>` dentro da raiz da Ficha.

- **Escopo:** o bloco é embrulhado em `@scope (#afty-ficha) { ... }`. Chrome, Safari e Firefox têm
  desde 2024. ⚠ Em navegador sem `@scope` o CSS **vaza para a página inteira**, então a Ficha
  detecta (`typeof CSSScopeRule`) e avisa em vez de fingir isolamento.
- **`@import` é removido** antes de injetar. É a única regra que busca arquivo remoto por conta
  própria, e ninguém precisa dela para pintar uma ficha.
- **Imagem e gif entram por URL**, não embutidos. ⚠ Um gif em data URI dentro do `localStorage`
  estoura a cota de 5MB e derruba o compêndio inteiro. O editor avisa acima de ~64KB.

### Camada D: o contrato de classes (a parte que quase todo mundo esquece)

Sem um contrato, a pessoa estiliza mirando `.bg-slate-900`, o app é refatorado, e o tema dela
quebra. Então existe uma **lista estável e documentada**, e a promessa é que ela não muda:

| Gancho | O que é |
|---|---|
| `.afty-ficha` | a raiz. Todo tema começa aqui |
| `.afty-cabecalho` | a faixa fixa do topo |
| `.afty-vital`, `[data-afty-vital="pv"\|"pe"\|"alma"]` | as barras de recurso |
| `.afty-stat`, `[data-afty-stat="defesa"\|"cd"\|...]` | cada número derivado |
| `.afty-abas`, `.afty-aba[data-afty-aba="acoes"]` | a navegação |
| `.afty-card`, `.afty-linha`, `.afty-rotulo`, `.afty-valor` | o corpo |
| `.afty-fontes` | o painel de fontes |
| `.afty-trilho`, `.afty-buff`, `.afty-log` | o trilho lateral |

⚠ **Classe do Tailwind não é API.** Fica escrito, e quem mirar nelas assume o risco.

### A saída de emergência, que é obrigatória

CSS livre permite escrever `.afty-ficha * { display: none }`. Se o único jeito de desligar o tema
for um botão dentro da Ficha, a pessoa se tranca para fora da própria ficha.

- Um controle **fora da raiz escopada**, com estilo embutido e `all: revert`, sempre alcançável,
  que desliga o CSS e abre o editor.
- Mais `?semcss=1` na URL, para o caso de o próprio controle sumir.

Sem isso, a funcionalidade não entra.

### Onde o tema mora

`creature.aparencia = { presetId, vars: {}, css: "", ligado: true }`, na ficha, então ele **viaja no
export**. Um padrão global opcional em `fm_ficha_tema_afty_v1` cobre "quero todas as minhas fichas
assim" (fase 5, pergunta D8).

---

## 10. Fases

Cada fase fecha com `npx eslint src/systems/afty/`, `npx vite build` e asserts de lógica pelo
`node --input-type=module`. Cada uma é entregável sozinha.

| Fase | Entrega | Depende de |
|---|---|---|
| ✅ **0. Fundação** | **FEITA em 2026-08-05.** Ver a seção 13 | nada |
| ✅ **1. Sessão** | **FEITA em 2026-08-05.** Ver a seção 13 | 0 |
| ✅ **2. Ações e rolagem** | **FEITA em 2026-08-05.** Ver a seção 14 | 1, mais D4 e D5 |
| ✅ **3. Locomoção** | **FEITA em 2026-08-05.** Ver a seção 15 | 2 |
| ✅ **4. Buffs** | **FEITA em 2026-08-05.** Ver a seção 17 | 1 |
| ✅ **5. Aparência** | **FEITA em 2026-08-05.** Ver a seção 16 | 0 |
| ✅ **6. Acabamento** | **FEITA em 2026-08-06.** Ver a seção 19 | todas |

---

## 11. Riscos nomeados

1. ~~**Custo do `deriveAfty` por render.**~~ ✅ **MEDIDO em 2026-08-05, e o risco não existe.** Uma
   ficha de **ND 40 com tudo escolhido** (139 Habilidades das duas especializações, 51 Talentos, 85
   Aptidões, as 11 Melhorias, as 16 Lendárias, as 5 trilhas no 5 e a bancada ligada) custa
   **1,75ms** por derive. Ficha em branco: 0,83ms.
2. ~~**Delta de buff por derive duplo.**~~ ✅ Pelo número acima, os **34 estados custam ~60ms**
   calculados de uma vez. Cabe até de forma ansiosa ao abrir o painel, e não precisa virar clique.
3. **Cabeçalho fixo e contexto de empilhamento.** Ver seção 7.
4. **Tailwind e o token.** Qualquer cor escrita como utilidade na Ficha é um buraco no tema, e vai
   passar despercebida. Vale um lint próprio no fim: nenhuma classe de cor do Tailwind em
   `src/systems/afty/ficha/**`.
5. **O `⚠` na tela continua proibido** (trava no eslint). Ícone `<AlertTriangle/>`.
6. **Em-dash e ponto-e-vírgula continuam proibidos** em texto visível, e a Ficha vai ter muito texto
   novo de UI.
7. **Texto verbatim do livro contém os dois**, e continua entrando sem alteração. A regra é sobre o
   texto que o código escreve.

---

## 12. Perguntas abertas (o autor decide)

| # | Pergunta | Trava o quê |
|---|---|---|
| **D1** | A bancada do criador e os buffs da Ficha são estados separados (recomendo sim) ou o mesmo? | fase 1 |
| **D2** | O `combatState` morto sai do `createBlankAfty` ou fica? | fase 1 |
| **D3** | Descanso curto e longo: existem os dois, e o que cada um devolve (usos de cura, PE, PV)? | fase 4 |
| ✅ ~~D4~~ | **O crítico DOBRA OS DADOS ROLADOS** (autor, 2026-08-05). `3d8+12` vira `6d8+12`, e o fixo entra uma vez | feito |
| ✅ ~~D5~~ | **Vantagem e desvantagem são 2d20**, ficando o maior ou o menor (autor, 2026-08-05) | feito |
| **D6** | As 26 condições são só marcadores por enquanto, certo? (é como está) | fase 4 |
| **D7** | Índice de ações: caminho A, B ou C da seção 8? | fase 3 |
| ✅ ~~D8~~ | **Os dois**: por ficha (gravado NA CRIATURA, viaja no export) e um padrão global opcional | feito |
| **D9** | Ao aplicar dano, a Ficha abate a RD sozinha ou só mostra quanto ela abateria? | fase 1 |
| **D10** | O trilho direito com Buffs e Log é bem-vindo, ou o layout fica só com as abas? | fase 0 |

⚠ **D1, D2 e D9 já estão IMPLEMENTADOS com o padrão recomendado** (sessão separada, `combatState`
deixado quieto, RD não abatida sozinha). São reversíveis e a pergunta segue aberta.

---

## 13. O que foi construído (fases 0 e 1, 2026-08-05)

**A Ficha abre.** No `/Afty`, clicar no card da criatura abre a Ficha e o lápis continua abrindo o
criador.

### Arquivos novos

| Arquivo | O que é |
|---|---|
| `ficha/AftyFicha.jsx` | a casca: cabeçalho fixo, vitais, defesas, abas |
| `ficha/ficha.css` | a pintura por token, com o contrato de classes da seção 9 |
| `ficha/ficha-sessao.js` | o estado de jogo: shape, saneamento, persistência e os reducers |
| `ficha/abas/AbaAcoes.jsx` | Dano, Cura, Feitiços e Manobras |
| `ficha/abas/AbaPericias.jsx` | os três tipos de teste, com as fontes de cada número |
| `ui/fontes.jsx` | `PainelDeFontes`, `ValorComFontes` e o **`NumeroComFontes`**, que abre no toque |
| `ui/primitivos.jsx` | `Card`, `BoolChip`, `VezesGauge` |
| `ui/formato.js` | `sinalDe` e `numeroBr` |

### O que mudou fora da Ficha

- **`src/App.jsx`**: import, uma view nova e uma linha trocada, tudo guardado por `aftyMode`. É o
  único arquivo fora de `src/systems/afty/`, e **`src/components/` continua sem um diff sequer**.
- **`afty-schema.js`**: o merge defensivo da ficha virou `mesclaFichaAfty` e saiu do criador, porque
  a Ficha precisa exatamente do mesmo saneamento.
- **`afty-derive.js`**: o M2. `deriveAfty(creature, { almaAtual })`, que multiplica o PV e alimenta o
  `alma_atual` do DSL. Sem a opção, nada muda para o criador (coberto por assert).
- **`AftyCreatureBuilder.jsx`**: perdeu as cinco funções locais que foram para `ui/`, e importa.

### Decisões tomadas na construção

1. **O clamp da sessão é de LEITURA, e não um efeito.** Aparar num `useEffect` seria uma
   renderização em cascata para chegar no mesmo número que dá para calcular de primeira (e o
   `react-hooks` reprova, com razão). `aparaSessao` devolve **o mesmo objeto** quando não há o que
   aparar, então nada re-renderiza à toa. Coberto por assert.
2. **O número do recurso é um CAMPO, e não um rótulo.** Digitar 62 é um gesto, e clicar no menos
   dezoito vezes são dezoito. ⚠ Campo VAZIO não vale zero: limpar para redigitar e sair sem terminar
   zeraria o PV do jogador no meio da luta.
3. **O PV temporário não é uma quarta barra**, é um pedaço âmbar emendado na de PV. É o que ele é na
   regra, e uma barra separada faria o jogador somar dois números de cabeça.
4. **A fileira de defesas some ao rolar SÓ em tela baixa** (media query de altura). Escondê-la num
   monitor grande seria trocar carga cognitiva por rolagem, que é o oposto do objetivo.
5. **As Habilidades não entraram na aba Ações**, e está anotado no topo do arquivo: sem metadado de
   ação nos catálogos, montar essa lista seria inventar a classificação. É a pergunta D7.

### Verificação

`npx eslint src/systems/afty/ src/App.jsx` limpo, `npx vite build` limpo, e **24 asserts** de lógica
cobrindo o M2, o `mesclaFichaAfty` e os reducers de sessão (dano na casca antes do PV, teto da cura,
clamp quando o máximo desce, expiração por rodada, descanso, lixo no armazenamento e ausência de
`localStorage`).

⚠ **Nada disso foi visto num navegador**: o ambiente não renderiza. O build valida import e JSX, a
lógica está coberta por assert, e o teste visual é o do autor.

---

## 14. Rolagem (fase 2, 2026-08-05)

**A Ficha rola.** Perícia, Teste de Resistência, Jogada de Ataque, manobra, dano e cura.

### As duas regras que o autor fechou

1. **O crítico DOBRA OS DADOS ROLADOS.** `3d8+12` vira `6d8+12`, e o valor fixo entra **uma vez**,
   porque ele não é dado. Coberto por assert com dado viciado.
2. **Vantagem e desvantagem são 2d20**, ficando o maior ou o menor. Os dois saem no painel e o
   **descartado aparece riscado**, que é o mesmo vocabulário do perdedor do pool exclusivo.

### O gesto: clicar no número ROLA

⚠ É uma inversão em relação ao criador, e é deliberada. Rolar é o que se faz o tempo todo na mesa, e
conferir a conta é o que se faz de vez em quando, então a ação comum fica no gesto barato. As fontes
continuam alcançáveis pelos dois caminhos que sobram: **hover** no mouse (75% do uso) e **toque
longo** no dedo, com o clique seguinte suprimido para o painel não rolar sem querer.

Número que rola leva **sublinhado pontilhado**. Sem marca nenhuma, um número clicável e um número
morto ficam idênticos, e o jogador nunca descobre que a ficha rola. Os números do cabeçalho (Defesa,
CD, RD) não rolam, então neles o clique continua abrindo as fontes.

### O crítico do Acerto amarra no Dano seguinte

A linha de dano tem dois números que rolam. Tirar dentro da margem no **Acerto** acende a marca
`Crítico` na linha, e o próximo **Dano** sai com os dados dobrados. É o fluxo da mesa: acerta, vê que
foi crítico, rola o dano. A marca é **consumida** pelo Dano, senão o golpe seguinte herdaria um
crítico que não é dele. Ela é local e **não é persistida**: é um estado de meio segundo entre dois
cliques, e guardá-lo faria a ficha reabrir amanhã com um crítico de hoje engatilhado.

### Cura por ponto gasto ganhou contador

Rolar uma cura que escala por ponto exige saber quantos pontos foram gastos, então essas linhas
ganharam um contador de 1 até o teto. A conta segue a regra de 2026-08-03: **os dados multiplicam
pelo gasto e o valor fixo entra UMA vez**, porque o texto diz "ao TOTAL de cura". Coberto por assert.

### O painel

Fica **fixo no canto**, e não num trilho lateral: o trilho roubaria largura do conteúdo em toda tela
e precisaria de uma segunda implementação no celular. Fechado mostra a última rolagem, aberto mostra
as últimas 50, e o histórico vive na sessão (sobrevive a recarregar).

⚠ **A fórmula aparece ao lado do total, sempre.** Uma ficha que rola e só cospe um número exige
confiar às cegas, e a mesa não funciona assim: com `17 + 21` escrito, dá para conferir num relance e
discutir com o mestre. Cada dado que caiu aparece separado.

O **modo** (vantagem, normal, desvantagem) é **pegajoso** de propósito, e o interruptor ligado muda
de cor. Um modo que se desarma sozinho depois de uma rolagem deixa o jogador sem saber em que estado
está na hora de rolar de novo, e a marca colorida resolve o esquecimento melhor do que a mágica
resolveria.

### O que NÃO rola ainda

Os **Feitiços**. O `resumoFeiticos` entrega `valor` como número pronto para exibir, e não a anatomia
da rolagem (`dados`, `faces`, `fixo`) que dano e cura têm. Ligar isso é mexer no `afty-feiticos.js`,
que é justamente o módulo que **não lê o Motor**, então entra junto daquele trabalho.

### Verificação

`npx eslint src/systems/afty/ src/App.jsx` limpo, `npx vite build` limpo, e **25 asserts** novos
(49 no total) rodando com **dado viciado**: vantagem e desvantagem, o descarte, a margem com piso de
2, o crítico dobrando só os dados, os blocos de cura, a fórmula com sinal negativo e a distribuição
do d20 em 5 mil rolagens.

---

## 15. Locomoção (fase 3, 2026-08-05)

A fase que ataca o problema declarado: **carga cognitiva**. Uma criatura de ND 40 tem, medido numa
ficha de teste com duas especializações cheias, **193 itens escolhidos**. Nenhuma lista resolve isso
sozinha.

### `ficha-conteudo.js`: os seis catálogos numa lista só

As escolhas de uma criatura moram espalhadas em seis lugares (Origem, Habilidades de Especialização,
Talentos, Habilidades Gerais, Aptidões Amaldiçoadas e Níveis Lendários), cada um com resolver e
formato próprios. Um módulo puro faz a travessia uma vez e devolve o formato único que a aba exibe e
a busca varre. Sem ele, os dois consumidores reimplementariam a mesma coisa e divergiriam no dia em
que um catálogo novo entrasse.

⚠ **A `chave` é única na Ficha inteira, e o `id` não serve.** Uma Melhoria repetível aparece mais de
uma vez, e o mesmo id existe em listas diferentes (o Ataque Inconsequente é do Lutador **e** do
Restringido). Coberto por assert.

⚠ **A escolha aninhada sai com o NOME da opção, não com o id.** O mapa da ficha guarda `["lut_manobra_ajuste"]`
e o jogador precisa ler "Ajuste", com a descrição dela junto. Opção que sumiu do catálogo é
descartada em silêncio, que é o que o resolver já fazia.

### Aba Habilidades

Seis grupos na ordem do sistema, grupo vazio some inteiro, e cada item **fechado por padrão**.

⚠ Fechado é escolha, e não preguiça: 193 parágrafos abertos de uma vez é uma parede que ninguém lê.
Quem resolve o "achar" é a busca, não o texto todo à mostra.

O texto é **verbatim**, com medida de leitura limitada a 78 caracteres e entrelinha larga, porque
isto é parágrafo de regra e não rótulo de campo. Coberto por assert que compara o texto exibido com
a `descricao` do catálogo, caractere a caractere.

### Busca global (Ctrl+K)

Varre os 193 itens **mais** as linhas de dano, de cura, os Feitiços, as Manobras, as Jogadas de
Ataque, os cinco TRs e as 20 perícias. Escolher um resultado **troca de aba sozinha**, abre o item e
rola até ele com o anel de destaque.

⚠ **Todos os termos precisam bater**, e não qualquer um: é o que deixa "postura sol" achar a Postura
do Sol sem trazer as outras sete. Sem acento e sem caixa, porque ninguém digita "Aptidão" com til no
meio de uma luta.

⚠ **Opção NÃO escolhida não é encontrável.** Procurar "postura terra" numa criatura que não a
aprendeu devolve vazio, em vez de trazer o Assumir Postura. A busca não pode prometer o que a
criatura não tem. Coberto por assert.

### Rápido: as seis que ele usa

A estrela fixa qualquer item numa seção no **topo da aba Ações**, antes até do Dano. Uma ficha de ND
40 tem 193 itens e o jogador usa seis, e são essas seis que ele quer ver ao abrir a ficha. Some
inteira para quem não fixou nada. Os favoritos vivem na sessão, então sobrevivem a recarregar.

### Teclado

`Ctrl+K` abre a busca, `1` a `3` trocam de aba, `Esc` fecha, e as setas mais `Enter` navegam nos
resultados.

⚠ **Nada dispara enquanto o foco está num campo.** Os vitais e os filtros são campos de texto, e
digitar "1" no PV não pode trocar de aba.

### Duas decisões de implementação

1. **A busca é MONTADA na hora, e não escondida.** Ficar montada com um `if (!aberta) return null`
   obrigaria a zerar o termo e o cursor num efeito ao abrir, e efeito que chama `setState` é
   renderização em cascata. Montando na hora, o estado nasce limpo. É a mesma lição do clamp da
   sessão, na fase 1.
2. **O que está aberto e para onde a busca navegou são estado de TELA**, e não de sessão. Reabrir a
   ficha amanhã com trinta parágrafos abertos não ajuda ninguém.

### Verificação

`npx eslint src/systems/afty/ src/App.jsx` limpo, `npx vite build` limpo, e **20 asserts** novos
(**69 no total**) rodando sobre uma ficha de ND 40 montada de verdade: o verbatim, as chaves únicas,
o filtro por vários termos, a opção não escolhida, e o formato das chaves da busca batendo com a
âncora que cada linha escreve.

---

## 16. Aparência e CSS personalizado (fase 5, 2026-08-05)

O diferencial que o autor pediu: **cada pessoa formata a aparência da própria ficha**, com cor,
imagem e gif, e quem sabe CSS escreve CSS.

Isto só foi possível porque a decisão de pintar por TOKEN foi tomada na fase 0. Um tema é,
literalmente, um mapa de `--afty-*`.

### As quatro camadas

| Camada | O que é | Para quem |
|---|---|---|
| **Preset** | cinco temas prontos: Padrão, Pergaminho, Sangue, Abissal, Terminal | um clique, ninguém precisa saber nada |
| **Formulário** | seletor de cor em 13 tokens nomeados, mais fonte e arredondamento | quem quer a cor dele sem escrever CSS |
| **Imagem** | url de fundo, com opacidade, encaixe e posição | gif e arte de fundo |
| **CSS livre** | um `<style>` dentro da raiz da Ficha | quem sabe CSS |

⚠ **O Pergaminho é um tema CLARO**, e ele existe para provar a tokenização: se um único lugar da
Ficha tivesse cor escrita como classe do Tailwind, ele apareceria como uma mancha escura.

### A ordem de precedência é a regra

Três blocos, todos sem camada e de mesma especificidade, então **quem vem depois vence**:

```
ficha.css (padrão)  →  <style> das variáveis (preset, depois formulário)  →  <style> do usuário
```

E os três vencem as utilidades do Tailwind, que vivem em `@layer`. Nenhum `!important` em lugar
nenhum. Coberto por assert que confere a ordem dentro do bloco gerado.

⚠ **Trocar de preset LIMPA o que o formulário mudou.** Sem isso, escolher Pergaminho depois de mexer
nas cores deixaria um fundo claro com o texto que foi escolhido para o escuro.

### O contrato de classes

17 seletores documentados, **na tela** (fechados, atrás do botão Seletores) e no código. A promessa é
que eles não mudam. Classe do Tailwind não é API.

⚠ **Um assert varre o `ficha.css` e todo o JSX e reprova se o contrato prometer um seletor que não
existe.** Foi ele que pegou o `[data-afty-stat]` anunciado e nunca emitido, na primeira rodada. Um
contrato que promete gancho inexistente é pior que nenhum contrato.

### A saída de emergência, em três camadas

CSS livre permite escrever `.afty-ficha * { display: none }` e se trancar para fora da própria ficha.

1. **O interruptor Ligado/Desligado**, dentro do painel.
2. **O bote salva-vidas**, um botão que mora **FORA da raiz da Ficha**, com estilo embutido (que
   vence qualquer folha sem `!important`) e `z-index` máximo. Só aparece para quem tem CSS livre
   ligado: um botão permanente seria sujeira para quem nunca vai abrir o editor.
3. **`?semcss=1` na URL**, lido antes de o tema existir e sem depender de nenhum botão continuar
   clicável. É a saída à prova de tudo.

### Isolamento e sanidade

- **`@scope (#afty-ficha)`** embrulha o CSS do usuário. Chegou no Chrome, no Safari e no Firefox em
  2024. ⚠ Sem ele o CSS **vaza para a página inteira**, e o painel **avisa** em vez de fingir
  isolamento.
- **`@import` é removido**: é a única regra que busca arquivo remoto por conta própria.
- **`</style` é removido**, defensivamente.
- **A url da imagem é saneada** contra aspas e parênteses, senão dá para sair do `url()` e escrever
  CSS por fora. Coberto por assert com uma url maliciosa de verdade.
- ⚠ **Isto não é uma caixa de areia**, e não tenta ser: quem escreve CSS na própria ficha pode se
  atrapalhar sozinho, e é para isso que existem as três saídas.

### Onde o tema mora

Chave própria (`fm_ficha_tema_afty_v1:<id>`), **não dentro da criatura**, pelo mesmo motivo da
sessão: o Salvar do criador não tem como pisar nele. Com um **padrão global** como segunda tentativa,
que responde o D8: é por ficha **e** global.

⚠ **O preço é que o tema não viaja no export da criatura.** Se isso incomodar, o caminho é um
exportar e importar do tema como texto, que não custa quase nada.

### Uma duplicação deliberada, com trava

O preset Padrão repete os 13 valores que o `ficha.css` já declara, porque o seletor de cor precisa
saber a cor de partida sem ler o CSS computado (que só existe depois de o elemento estar na tela).
**Um assert lê os dois arquivos e compara**, então divergir quebra o teste.

### Verificação

`npx eslint src/systems/afty/ src/App.jsx` limpo, `npx vite build` limpo, e **24 asserts** novos
(**93 no total**).

---

## 17. Buffs, e o tema viajando junto (2026-08-05, tarde)

### O tema MUDOU DE CASA: agora ele mora na criatura

⚠ **Isto reverte a decisão da seção 16.** O motivo é do autor e é decisivo: *"quero mandar minha
ficha bonitinha para os outros"*. Um tema em chave local nunca sai do navegador de quem o fez.

O risco que me fez começar pela chave separada **não existe**, e bastava ter olhado: o
`update(id, patch)` do armazenamento faz **merge** (`{ ...c, ...patch }`), então um Salvar do criador
que não conhece o campo `aparencia` **preserva** o que já está lá. E o export e o import copiam a
criatura inteira (`...c`), então o tema viaja de graça nos dois sentidos.

- `aparencia: null` novo no `createBlankAfty`.
- `carregarTema(creature, id)` procura em três lugares, nesta ordem: a criatura, a chave local
  (fichas temadas antes desta mudança, que continuam funcionando) e o padrão global.
- A Ficha grava por `onSalvarTema`, que o `App.jsx` liga em `storage.update(id, { aparencia })`.
- O **padrão global** continua no `localStorage`, porque ele é preferência de quem usa e não da ficha.

### A aba Prompt IA

⚠ **Quem quer a ficha bonita nem sempre sabe CSS, mas todo mundo tem uma IA à mão.** O que falta a
essa IA é o CONTEXTO: sem saber que existe uma ficha do Afty, quais variáveis existem e quais classes
são estáveis, ela chuta seletor e escreve CSS que não pega em nada.

A seção CSS do painel virou três abas: **CSS**, **Seletores** e **Prompt IA**. A terceira gera um
prompt completo e o copia com um clique. O que ele leva:

- o que a ficha é e como ela é montada;
- que o CSS entra dentro de `@scope (#afty-ficha)`, então não se repete o `#afty-ficha`;
- **as 29 variáveis, com valor padrão e o que cada uma pinta**;
- **os 17 seletores do contrato**, mais os atributos `data-afty-*`;
- as sete regras (só CSS na resposta, `@import` não funciona, imagem por URL e nunca data URI, não
  esconder a ficha, cuidar do contraste, nada de `!important`, teto de 64 KB);
- **o CSS que já está na ficha**, já saneado, para a IA continuar de onde parou.

O prompt sai da MESMA fonte que a Ficha usa, e **seis asserts** conferem que ele cita toda variável e
todo seletor. Um prompt que descreve uma variável morta é pior que nenhum prompt.

### Uma duplicação a menos: `TOKENS_DOC`

Os valores padrão eram escritos em dois lugares (o `ficha.css` e o preset Padrão) e o prompt seria o
terceiro. Agora existe **`TOKENS_DOC`**, uma lista com id, valor e o que cada token pinta, e dela
saem as três coisas. Dois asserts fecham o cerco: um compara token a token com o `ficha.css`, e o
outro reprova se o CSS tiver uma variável que a documentação desconhece.

### Fase 4: os buffs

**Camada 1, os catalogados.** Os `COMBATE_ESTADOS` reapresentados na aba, com a mesma filtragem da
bancada do criador. Fora de combate a lista fica **apagada em vez de sumir**: o jogador precisa ver o
que existe para saber que tem de entrar em combate primeiro.

**O delta, que é a parte nova.** Cada estado ligado mostra em chip o que ele está fazendo agora
(`Dano +14`, `Defesa +2`, `Dados +2d8`). ⚠ **O mecanismo não pede nada do Motor**: roda o
`deriveAfty` de novo com aquele estado desligado e compara. É exato por construção, porque quem
calcula a diferença é o mesmo código que calcula a ficha.

⚠ **Só os estados LIGADOS entram na conta**, e não é economia: a pergunta útil é "o que a Brutalidade
está me dando AGORA". De quebra o custo cai de um derive por linha visível para um por linha ligada,
que na prática são três ou quatro (uns 7ms).

**Camada 2, os ad-hoc** (M1). "+2 de Defesa por 3 rodadas" entra por `efeitosDaSessao`, no mesmo
shape do Funcionamento Básico, então o seletor de canal, o DSL inteiro e o painel de fontes vieram de
graça: o buff aparece **nomeado** na lista de fontes do número que ele mudou.

⚠ **`duracao: "temporaria"` é FORÇADA**, e não é escolha do jogador. Um +4 de Força emprestado pelo
aliado não pode destravar uma Habilidade que pede Força 18, que é exatamente a regra do autor de
2026-07-28. Coberto por assert que compara `attrEff` com `attrPermanente`.

**Camada 3, as condições.** Marcadores com duração, e **sem número**. ⚠ Isso é honestidade: as 26
condições do `CONDICOES_CATALOGO` não têm efeito mecânico modelado no Afty, e marcar "Cego" com um -4
inventado seria número saído do nada. Qualquer número que a condição imponha entra como buff ad-hoc,
onde fica visível e rastreável. É a pergunta D6.

### Verificação

`npx eslint src/systems/afty/ src/App.jsx` limpo, `npx vite build` limpo, **117 asserts** no total
(24 sessão, 25 rolagem, 20 conteúdo, 33 tema, 15 buffs).

---

## 18. Dois consertos do CSS personalizado (2026-08-06)

Os dois vieram do autor usando a coisa de verdade, e os dois eram meus.

### O painel de fontes ficava ATRÁS do conteúdo

O painel era `position: absolute` dentro da linha, o que o prende ao **contexto de empilhamento** do
cartão em que ele nasceu. Basta o cartão ganhar `backdrop-filter`, `transform`, `filter` ou
`opacity` para virar um contexto próprio, e a partir daí **nenhum z-index salva**: o cartão seguinte,
que vem depois no documento, pinta por cima dele inteiro.

⚠ No criador isso nunca apareceu porque o CSS é meu. Na Ficha o CSS é do usuário, e **vidro fosco nos
cartões é das primeiras coisas que qualquer IA escreve**.

**O conserto:** na Ficha o painel virou **flutuante**. Ele é enviado por portal e posicionado em
`fixed`, a partir do retângulo do gatilho, e com isso sai de dentro do cartão de vez.

⚠ **O portal vai para `#afty-ficha`, e NÃO para o `document.body`.** Dois motivos, e os dois são
fatais se errar: as variáveis `--afty-*` são declaradas em `.afty-ficha` e não chegariam ao body, e o
`@scope (#afty-ficha)` do CSS do usuário também não alcançaria o painel. Ele ficaria sem tema nenhum.

Com o painel em `fixed` e coordenadas calculadas na abertura, **rolar e redimensionar fecham**, senão
ele fica plantado no ar longe do número que explica. Ele também abre para CIMA quando o gatilho está
na metade de baixo da tela.

**De quebra, o painel passou a ser tematizável.** Ele era pintado com classe do Tailwind
(`bg-slate-950`), então num tema Pergaminho seria uma caixa preta. Agora sai de token, com
**fallback em todo `var()`**: o mesmo componente é usado pelo criador, que não tem a raiz
`.afty-ficha` e portanto não tem variável nenhuma declarada.

⚠ O `PainelDeFontes` ancorado **continua igual** para o criador. Lá o hover é CSS puro e funciona.

### As IAs pintavam só o cabeçalho

Não era limitação do modelo: **o contrato tinha 17 seletores e quase todos eram do cabeçalho**. A IA
não tinha como saber que existia um corpo com quatro abas.

Três mudanças no prompt:

1. **O contrato foi para 45 seletores**, agrupados em Estrutura, Cabeçalho, Corpo, Controles e
   Camadas. O grupo **Corpo** sozinho tem 10.
2. **`MAPA_DA_PAGINA`**, uma árvore que mostra o cabeçalho, as quatro abas e o que cada uma contém.
3. Um aviso explícito de que **o corpo é a maior parte da ficha** e um tema que pinta só o topo fica
   pela metade.

Mais **`ATRIBUTOS_DOC`**, com os nove `data-afty-*` que permitem mira fina, e uma regra nova: **não
pôr `overflow: hidden` em `.afty-card` nem em `.afty-linha`**, que era a outra metade do bug do
painel.

Também entrou o `data-afty-aba` nos botões de aba, que o contrato prometia e ninguém emitia. Foi o
assert de contrato que pegou.

### Verificação

`npx eslint src/systems/afty/ src/App.jsx` limpo, `npx vite build` limpo, **121 asserts** (24 sessão,
25 rolagem, 20 conteúdo, 37 tema, 15 buffs). Sete asserts novos, entre eles um que reprova se o
prompt deixar de citar o mapa, as quatro abas ou os seletores do corpo.

### Sobre o repositório com mais gente

O commit **#018 do GoliasK** (perícias personalizadas e ofícios) entrou em cima do #017 e foi trazido
por fast-forward antes de qualquer edição. Ele mexe em `afty-pericias.js`, `afty-derive.js` e
`afty-schema.js`, que a Ficha consome, e **não quebrou nada**: perícia personalizada e Ofício chegam
na aba Perícias com o shape de sempre, são roláveis e a busca global as acha. O campo `aparencia` que
eu tinha somado ao schema sobreviveu ao merge dele.

---

## 19. Fase 6, o acabamento (2026-08-06)

A última fase do plano: **celular e tablet a sério, densidade e impressão**. Nenhum
número novo e nenhuma regra nova, só a Ficha se comportando em tela pequena e em papel.

### Densidade, e o que ela NÃO faz

Duas posições, num interruptor no cabeçalho: **Confortável** e **Compacta**. A raiz
carrega `data-afty-densidade`, e o resto é CSS.

A decisão que vale registrar é o **limite**: a compacta **aperta e não esconde**.
Nenhum número, nenhuma linha e nenhum texto sai da tela. Uma densidade que apaga
conteúdo obriga a voltar para a confortável para conferir qualquer coisa, o que é o
oposto de por que alguém troca de densidade: quem escolhe compacta quer ver **mais**
de uma vez. Tem assert varrendo as regras da compacta e reprovando qualquer
`display: none` ou `visibility: hidden`.

A exceção interna é o **texto do livro**, que não encolhe junto. Parágrafo de regra
em corpo menor é o primeiro lugar onde a compacta viraria ilegível, então lá só a
entrelinha cede.

**Onde ela mora:** chave global no `localStorage`, e **não** na criatura como o tema.
Densidade é preferência de **aparelho** e não de personagem: a mesma ficha quer
compacta no tablet de mesa e confortável no monitor, e se viajasse no export chegaria
imposta na tela dos outros. É a razão de ela não ter entrado no objeto do tema.

### Celular: o problema é ALTURA, não largura

O cabeçalho é fixo e leva identidade, três vitais, até doze defesas e as abas. Numa
tela de 360×740 isso come a tela inteira, e o corpo da ficha (que é o que se veio ler)
nasce fora dela.

Duas mudanças:

1. **A fileira de controles vai para linha própria.** São sete botões mais o contador
   de rodada, e com o alvo de toque de 44px que o `pointer: coarse` já impunha eles
   somam mais de 300px. Ao lado do nome, numa tela de 360, esmagavam o nome da
   criatura até três letras.
2. **O cabeçalho encolhe ao rolar, e só então.** Rolou: as barras dos vitais somem, os
   passos de `−`/`+` somem, o retrato sai, e os vitais viram uma faixa de números com
   o campo ainda editável, que é o que importa no meio da luta.

O ponto 2 tem uma regra explícita: **nada some do cabeçalho parado**. Tudo que
desaparece está atrás do `data-afty-compacto="sim"`, senão o jogador abre a ficha e
não vê a barra de PV nenhuma vez. Um assert varre a media query do celular e reprova
qualquer `display: none` que não esteja atrás desse atributo.

O painel de rolagens passa a ocupar a largura toda no celular: encolhido no canto ele
ficava com duas palavras por linha.

### Impressão

**O que imprime é o que está na tela.** A aba aberta imprime, as outras três não
existem no documento, e Habilidade fechada não tem o texto renderizado. Isso é
deliberado e não é limitação a corrigir: abrir tudo para imprimir sairia com trinta
páginas de regra que ninguém pediu. Quem quer o texto de uma Habilidade no papel abre
ela antes.

O papel é preto no branco, o cabeçalho fixo vira estático (fixo em papel repete em
toda página ou cobre o conteúdo), cartão e linha ganham `break-inside: avoid`, e nada
que só serve para clicar vai para o papel: botões, abas, passos, estrelas de favorito,
o painel de rolagens e o painel de fontes.

**A decisão técnica:** a impressão **reescreve os tokens**, e não pinta com cor
literal. Se ela pintasse com cor escrita à mão, o CSS do usuário (que vem depois e no
mesmo peso, ver a seção 14) brigaria com ela e o papel sairia escuro de novo.
Reescrevendo `--afty-fundo` e companhia, o tema do usuário sai claro junto, de graça.

### Contrato

Duas entradas novas, e as duas entram no prompt para a IA: a classe
`.afty-controles` (a fileira de botões do cabeçalho) e o atributo
`[data-afty-densidade]`. O respiro do fim do `<main>`, que era mirado por
`main > .h-24`, ganhou a classe `.afty-respiro`: classe de utilidade do Tailwind não é
API, e trocar o respiro de 24 para 28 quebraria a impressão em silêncio.

### Verificação

`npx eslint src/systems/afty/` e `npx vite build` limpos, **133 asserts** (24 sessão,
25 rolagem, 20 conteúdo, 37 tema, 15 buffs, **12 da fase 6**), `src/components/`
intocado.

### O que fica de fora, e por quê

- **Impressão de tudo de uma vez.** Ver acima: é decisão, não pendência.
- **Rolagem de Feitiço**, que continua parada no `resumoFeiticos` devolver `valor`
  pronto para exibir em vez de `{dados, faces, fixo}`. Ela entra junto com o
  `afty-feiticos.js` passar a ler o Motor.
- **Habilidades na aba Ações**, que continua na pergunta D7: nenhum catálogo tem
  metadado de ação, custo ou usos.
- **D3, D6, D9 e D10** seguem sem resposta do autor.

---

## 20. Feitiço que rola, seletor de canal e dois consertos (2026-08-06, tarde)

### O Feitiço passou a rolar

Era a lacuna funcional mais antiga da aba Ações: o Feitiço mostrava `8d6` como texto
morto enquanto Dano, Cura e Manobra já rolavam.

**A causa não era o motor, era o formato.** O `resumoFeiticos` devolvia só o `valor` já
pronto para exibir (`"8d6"`, `"3× 4d8"`, `"Somente Condição"`), e a Ficha não parseia
string: reler os dados de uma notação seria desfazer trabalho que o motor já fez, e
quebraria no primeiro formato novo. Os números sempre estiveram lá, em `calc.dados` e
`calc.tipoDado`, no mesmo lugar de onde a notação sai.

Entrou o `rolagensDoFeitico(f, calc)`, exportado do `afty-feiticos.js`, e o campo
`rolagens` no resumo. É uma **lista** porque um Feitiço tem mais de uma rolagem de
verdade:

| Caso | O que sai |
|---|---|
| Dano comum, Dano na Alma | uma rolagem |
| Curativo | uma rolagem, com `tom: "cura"` (senão o log pinta cura de vermelho) |
| Dano contínuo | **duas**: o Golpe Inicial e o Por Rodada |
| Múltiplos Disparos | uma, com `vezes` = os disparos |
| Golpeador com vários golpes | uma, com `vezes` = os golpes |
| Somente Condição | **nenhuma** |
| Auxiliar de Múltiplos Efeitos, Passivo, Especial sem dano | nenhuma |

Duas decisões:

- **`vezes` não multiplica os dados.** Cada disparo e cada golpe tem acerto próprio, e
  somar tudo numa rolagem só sairia com o dano de todos acertando. Ele vira um contador
  `×3` ao lado, e cada clique rola um.
- **"Somente Condição" não oferece botão.** O Feitiço trocou o dano inteiro pela
  condição, e um botão ali mentiria sobre o que ele faz.

Uma linha nova no `calcularFeiticoDano`: `contDadosPorRodada`, a **quantidade** de dados
do contínuo e não só a notação, pelo mesmo motivo de sempre.

### O seletor de canal dos Buffs

Pedido do autor: o `<select>` nativo de canais no buff ad-hoc virou o **seletor do
Motor** (Habilidades > Funcionamento Básico). São dezenas de canais, e o nativo os
despeja num tubo de 300px sem grupo nenhum: achar "Margem de Crítico" era rolar até
topar com ele. O do Motor usa a **largura**, com três colunas, e procurar vira varrer
com o olho. Busca sem acento, setas, Enter e Esc.

⚠ Ele foi **copiado e repintado**, não importado. O `CanalPicker` do criador é uma
função local sem export, e a pintura dele é classe de cor do Tailwind (`bg-slate-950`),
que não sobrevive ao tema da Ficha. A lógica é a mesma de propósito; a pintura saiu por
token, e um assert reprova se qualquer `bg-slate` ou `text-purple` voltar para a cópia.
As quatro classes novas entraram no contrato do tema.

O `<select>` das **Condições** continua nativo, e está certo: são 26 nomes numa lista
chapada, sem grupo e sem nota, que é exatamente o caso em que o nativo serve.

### Dois consertos

- **O painel de rolagens cobria o botão dos Livros.** O `PdfFab.jsx` do grimório 2.5.2
  é um círculo de 56px fixo em `bottom-4 right-4`, e o painel caía em cima dele. Aquilo
  é somente-leitura, então quem desvia é o Afty: o painel subiu para `bottom: 5.5rem` e
  o respiro do fim da aba cresceu junto. Tem assert, porque a correção é um número que
  parece arbitrário e alguém "arrumaria" o painel de volta para o canto.
- **O rodapé de feedback e o aviso de abertura saíram**, a pedido do autor: a pesquisa
  fechou. É a única mudança fora de `src/systems/afty/`, e foi autorizada
  explicitamente. O `components/FeedbackPrompt.jsx` continua no lugar, sem uso, e
  `src/components/` não foi editado.

### Verificação

`npx eslint src/App.jsx src/systems/afty/` e `npx vite build` limpos, **150 asserts**
(24 sessão, 25 rolagem, 20 conteúdo, 37 tema, 15 buffs, 16 da fase 6, **13 do Feitiço
que rola**), `src/components/` intocado.

---

## 21. Sub-abas na aba Habilidades (2026-08-06)

Pedido do autor: a lista de **Habilidades de Especialização** ficou grande demais em
ficha de nível alto, e os **Níveis Lendários** precisavam separar Melhorias Superiores
de Habilidades Lendárias.

### Como a divisão funciona

Cada item ganhou um campo `sub` (`{ id, label }`), e o componente monta as sub-abas a
partir do que os itens trazem. Duas fontes:

- **Especialização**: a sub sai do próprio `h.especializacaoId`, e não de uma lista
  escrita à mão. Classe nova entra sozinha, sem tocar em nada.
- **Níveis Lendários**: divisão fixa em `SUBS_ALTO_NIVEL`, com Melhorias Superiores,
  Habilidades Lendárias e Habilidade Ápice. São três coisas de natureza diferente que
  nunca foram uma lista só de verdade. O Ápice ganhou aba própria em vez de ser
  empurrado para dentro das Lendárias: é um item só, e a aba dele é auto-explicativa.

Quatro regras, todas com assert:

1. **Uma divisão só não vira aba.** Numa ficha de classe única, "Lutador" apareceria
   sozinho por cima de uma lista que já é toda do Lutador: pura perda de fileira. As
   sub-abas aparecem a partir de duas.
2. **Dividir não some com item nenhum.** A soma das divisões é a lista inteira, e há
   assert conferindo isso: é o que impede a sub-aba de virar um filtro que engole
   conteúdo.
3. **A busca abre a divisão onde o item mora.** Sem isso o jogador buscaria uma
   Habilidade, a Ficha trocaria para a aba certa e não mostraria nada.
4. **A divisão vazia cede a vez.** O filtro local pode esvaziar a que está aberta, e aí
   a primeira com item assume.

A etiqueta que virou aba saiu das linhas: "Melhoria Superior" repetido em toda linha,
logo abaixo de um cabeçalho que já diz "Melhorias Superiores", é ruído. O mesmo vale
para o nome da Especialização quando ela é a aba aberta.

### A decisão técnica que se repetiu

A sub-aba ativa é conta de **leitura**, e não estado escrito por efeito. A escolha
guarda junto qual destaque estava valendo quando ela foi feita (`destaqueVisto`), e é
isso que deixa a busca mandar na aba sem precisar de um `useEffect` que escreveria
estado. É a terceira vez que o `react-hooks/set-state-in-effect` do projeto empurra
para a solução melhor: já tinha acontecido com o clamp da sessão e com a busca global.

### Verificação

Lint e build limpos, **163 asserts** (28 no conteúdo, 21 na fase 6), `src/components/`
intocado.

---

## 22. Fase 7: o inventário e os atributos (2026-08-06)

As sete fases do plano estavam fechadas, então esta fase saiu de uma varredura do que
o `deriveAfty` calcula e a Ficha nunca mostrava. Achei quatro coisas: **atributos**,
**equipamentos**, **domínios** e **invocações**. Esta fase entrega as duas primeiras.

### Os seis atributos

Buraco antigo e simples: a Ficha mostrava os derivados (Defesa, CD, os três tipos de
teste) e não mostrava **de onde eles saem**. Na mesa, "faz um teste de Força pura"
acontece o tempo todo, e não havia onde ler o número.

Entraram no topo da aba Perícias, que é a aba dos testes. O **valor** é o número
grande e o **modificador** é a pastilha embaixo, porque os dois se usam: o valor em
pré-requisito e em regra que lê atributo, o modificador em toda conta. **Só o
modificador rola**, como teste puro. O valor exibido é o `attrEff`, já com o que o
Motor soma e já aparado no limite, com as fontes no hover como todo número da Ficha.

### O inventário

Armas, uniformes, escudos e itens existiam no criador e **nunca chegavam à mesa**: quem
quisesse ler o que o próprio talismã faz voltava ao criador. Agora há uma aba
**Equipamentos**, com sub-abas por tipo (as mesmas da fase anterior, com o componente
extraído para `GrupoComSubAbas.jsx` e usado pelas duas abas).

Três decisões:

1. **O inventário é uma lista SEPARADA do conteúdo**, e não um sétimo grupo da aba
   Habilidades. Os critérios são outros: aquela lista é "o que a criatura **sabe
   fazer**" e esta é "o que ela **carrega**". Juntas, a aba Habilidades mostraria espada
   no meio de Habilidade e o contador de 193 itens contaria bandagem. O **formato**,
   porém, é o mesmo de propósito, e é o que dá ao inventário o texto verbatim, o
   Rápido, o destaque da busca e o filtro sem uma linha nova.
2. **Os números do equipamento não se repetem na aba.** O bônus de Defesa do uniforme,
   a RD do escudo e o acerto da Ferramenta já entram na Defesa, na RD e na linha de
   Dano, com as fontes no hover de cada um. Repetir aqui seria convidar a somar duas
   vezes. A aba mostra o que não está em lugar nenhum: o que se carrega, quanto pesa e
   o texto de cada item.
3. **A sobrecarga ganhou destaque**, com barra e as duas penalidades escritas. É
   penalidade que se esquece: −5 de Defesa e −4,5m de Deslocamento saem do nada se
   ninguém disser de onde vêm. Os dois já estão descontados nos números do topo.

A chave de cada linha é o `uid` da **entrada**, e não o id do catálogo: duas Katanas
com encantamentos diferentes são duas linhas, e chave repetida faria as duas abrirem
juntas. Os encantamentos da Ferramenta Amaldiçoada aparecem como as opções aninhadas de
uma Habilidade, porque é a mesma coisa: uma escolha dentro do item.

Como em Habilidades, **a aba não edita nada**. Comprar, equipar e encantar são escolhas
de ficha, e escolha mora no criador. Tem assert reprovando qualquer controle de edição
que apareça no arquivo.

### Verificação

Lint e build limpos, **176 asserts** (13 novos do inventário e dos atributos),
`src/components/` intocado.

### O que sobrou desta varredura

- **Domínios** (`derived.dominios`) e **Invocações e Hordas** (`derived.invocacoes`,
  `derived.hordas`) continuam fora da Ficha. Os dois são conteúdo de combate, com texto
  e números já resolvidos, e a casa deles provavelmente é a aba Ações. É o próximo
  passo natural.
- **D3, D6, D9 e D10** seguem sem resposta do autor, e **D7** (Habilidades na aba
  Ações) continua travada na falta de metadado de ação nos catálogos.

---

## 23. Fase 8: Domínios e Invocações, e o chip serrilhado (2026-08-06)

### O conserto: marca que é número tem largura fixa

O autor apontou que **os Níveis nas Habilidades de Especialização estavam em tamanhos
diferentes**. "Nível 1" e "Nível 20" são textos de larguras diferentes, e como chip eles
serrilhavam a coluna da direita: cada linha empurrava o próprio chip para um lugar. É
exatamente o mesmo problema que a grade de defesas teve no cabeçalho, e a resposta é a
mesma: **célula de tamanho igual**.

As marcas deixaram de ser string e viraram `{ label, tipo }`. Só as que são **número**
ganham tipo (`nivel`, `vezes`, `espacos`), e só elas recebem largura mínima e número
tabular. As que são palavra ("Lutador", "Equipado") ficam do tamanho do texto, porque
forçar largura nelas abriria buraco no meio da linha. Tem assert reprovando `min-width`
no `.afty-chip` genérico.

### Domínios

A **Expansão de Domínio** entrou na aba **Ações**, e não em aba própria: ela É uma ação
de combate, com custo em PE e duração em rodadas, e o jogador procura por ela onde
procura o resto do turno dele. Cada linha traz área, duração, PV da barreira e custo, e
abre com o texto inteiro. O texto **já vem montado** pelo `textoDoDominio`, o mesmo que
o criador usa: a Ficha não remonta nada.

### Invocações

Ganharam **aba própria**, e o motivo é o oposto do anterior: uma Invocação não é uma
ação, é uma **criatura**, com PV, Defesa, Deslocamento, CD, cinco Testes de Resistência
e ações próprias. Empurrá-la para a aba Ações misturaria dois níveis de coisa.

O ponto inteiro da aba é que **as ações dela rolam**, com o acerto e o dano da própria
Invocação: no meio da luta o jogador rola pela Invocação sem sair da Ficha. Os avisos do
resolver aparecem, no cartão e por ação, porque eles dizem que a Invocação está fora das
regras e escondê-los seria esconder o que precisa ser consertado. As Hordas entram numa
lista simples no fim.

### Verificação

Lint e build limpos, **186 asserts** (9 novos), `src/components/` intocado.

---

## 24. DÚVIDAS E PROBLEMAS PARA REVISAR COM O AUTOR

Lista pedida pelo autor em 2026-08-06. Nada aqui está errado a ponto de travar o uso, e
nada aqui foi decidido por mim sem estar escrito.

### Achados no código, que podem ser bug de regra

1. **Domínio sem a Aptidão fica meio resolvido.** Uma criatura que tem um Domínio
   gravado mas não tem nenhuma das três Aptidões de Expansão recebe `versao: ""`, e daí
   saem `area: ""` e `custo: 0` — mas o **texto continua sendo gerado inteiro**, com
   área e duração dentro dele. Na Ficha isso aparece como uma linha sem área e sem
   custo, com um parágrafo completo embaixo. É inconsistência do resolver, não da Ficha.
   **Pergunta:** domínio sem Aptidão deveria sumir da Ficha, ou aparecer com um aviso?

2. **A Invocação valida a ação mas o criador deixa gravar.** Uma Ação de Ataque marcada
   como Simples gera o aviso "Ação de Ataque deve ser Complexa" e continua valendo.
   Segue a convenção do projeto (avisa, não impede), então só confirmo se é intencional
   aqui também.

3. **O PV das Invocações não entra na sessão.** O número que a Ficha mostra é o
   **máximo**, e não um recurso que se gasta. Dar barra própria a cada Invocação sem o
   descanso saber o que fazer com elas deixaria a ficha com números que ninguém zera.
   **Pergunta:** a Invocação deve ter PV rastreado na sessão?

### Dívida técnica que eu criei ou herdei

4. **O dano da Invocação ainda é string.** O `resolveInvocacao` guarda o dado como
   `"2d12"` e a aba quebra o texto para rolar. É a última coisa da Ficha que parseia
   notação, e é o mesmo problema que o Feitiço tinha antes do `rolagensDoFeitico`. O
   conserto é do mesmo tamanho: devolver `{ dados, faces }` do lugar onde a notação é
   montada.

5. **A Ficha está com sete abas.** Ações, Habilidades, Perícias, Equipamentos,
   Invocações, Buffs. No celular elas rolam na horizontal, o que funciona, mas passou do
   ponto em que tudo cabe de uma vez num monitor estreito. **Pergunta:** vale agrupar,
   ou sete está bom?

6. **Domínio na aba Ações e Invocação em aba própria** é uma assimetria deliberada, e
   está justificada acima, mas é decisão minha e o autor pode discordar.

### Do que já estava aberto

7. **D3** (descanso curto e longo, e o que cada um devolve), **D6** (condições com
   mecânica), **D9** (RD abatendo dano automaticamente) e **D10** (trilho lateral)
   continuam sem resposta.

8. **D7** segue travada: nenhum catálogo tem metadado de ação, custo ou usos, então as
   Habilidades não podem entrar na aba Ações sem inventar a classificação.

9. **Sub-aba única não aparece** (uma Especialização só). Foi decisão minha, e é
   reversível numa linha se o autor preferir a aba sempre visível.

10. **O Ápice ganhou sub-aba própria** nos Níveis Lendários, em vez de entrar junto das
    Lendárias. Também é decisão minha.

---

## 25. Fase 9: nenhuma rolagem nasce de string (2026-08-06)

Fase curta e de uma regra só, que fecha a dívida número 4 da seção 24: **quem tem o
número entrega o número, e ninguém relê notação de volta de uma string.**

### O bug que quase chegou à mesa

Ao ligar as ações da Invocação na fase anterior eu quebrei a notação no `"d"`, porque o
`resolveInvocacao` guarda o dado como texto. Funciona em `"2d12"`. **Não funciona na
escada de dano do Afty**, que a partir do oitavo degrau devolve dois dados diferentes:
`"3d12 + 1d8"`. Quebrado no `"d"`, aquilo vira `["3", "12 + 1", "8"]`, ou seja três
dados de face inválida, e a Invocação rolaria um dano errado **sem avisar ninguém**.

Foi achado escrevendo o assert, e não em jogo.

### O conserto

- `dadosDaNotacao(str)` no `afty-invocacoes.js` devolve `[{ dados, faces }, ...]`. É uma
  **lista** exatamente por causa dos degraus de dois dados, e devolve **vazio** no piso
  da escada (o dado fixo `"1"`), porque ali não há dado a rolar e um `1d1` inventado
  rolaria um d1.
- O `resolveInvocacao` anexa `grupos` ao dano, à cura e ao dano adicional **num lugar
  só**: o `resolveAcao` remonta o dado em vários pontos, e estruturar em cada um seria
  quatro cópias da mesma conta.
- O `rolarDano` aceita `grupos` e rola tudo numa **rolagem só**, com o crítico dobrando
  todos os grupos e o valor fixo entrando uma vez. Sem isso, rolar `"2d12 + 1d6"`
  exigiria duas chamadas e uma soma de cabeça, e o log mostraria duas rolagens onde a
  regra vê uma. O caminho de um grupo (`dados`/`faces`) continua idêntico, porque é o de
  quase toda linha da Ficha.

### O assert que impede a volta

Uma varredura em `ficha/` reprova qualquer `split("d")` ou regex de notação. A exceção
nomeada é o `facesDe`, que lê `"d8"` (só a face) nas linhas de dano e cura, e existe para
esse caso e só para ele. Outro assert percorre **os 40 primeiros degraus da escada** e
confere que cada um vira rolagem com o máximo certo.

### Verificação

Lint e build limpos, **193 asserts** (7 novos), `src/components/` intocado.

---

## 26. Revisão do trabalho do GoliasK (2026-08-07)

Dois commits novos no `origin/main`, os dois dele, trazidos por fast-forward com a
árvore limpa. Ele mexeu em treze arquivos, **incluindo três meus** (`AftyFicha.jsx`,
`AbaAcoes.jsx` e `ficha.css`).

### O que ele entregou

| Frente | O que mudou |
|---|---|
| **Conjuração Aprimorada** | bônus FIXO de dano em todo Feitiço, grátis para toda criatura. Modificador da Técnica mais ND, por nível do Feitiço |
| **Alma Livre** | Talento novo, a partir do ND 10: dá uma aba de outra Especialização com uma Habilidade comprável, e o nível efetivo dela é o ND |
| **Cura por gasto** | `curaNoGasto` fecha a linha no gasto escolhido, e o bônus por dado passou a nascer da quantidade REALMENTE rolada |
| **Retrato da Ficha** | virou painel vertical na lateral do cabeçalho, em tablet e desktop, com o ponto focal do criador |
| **Modificador de Força** | a Habilidade Única de equipamento é reavaliada depois do fechamento dos atributos, então `mod_forca` usa o valor final |
| **RD Física** | ganhou as fontes no hover, que faltavam |
| **Motor** | as linhas de efeito ficaram alinhadas entre si |

### O que eu verifiquei

**Ele respeitou as convenções da Ficha, e isso importa mais do que parece.** A regra da
Conjuração Aprimorada exigia mexer na rolagem que eu tinha acabado de escrever, e ele fez
o caminho inteiro: `rolagensDoFeitico` ganhou `fixo` e `partes`, e a linha da aba passa os
dois adiante, com as fontes no hover. Nada ficou pela metade e nada precisou ser refeito.

**Um assert meu quebrou, e o errado era o assert.** Eu tinha travado o valor exibido do
Feitiço em "termina com NdM", e agora ele termina com o bônus ("3× 5d10+20"). Corrigido.

**Sete asserts novos** trancam a regra dele, porque ela entrou DEPOIS da rolagem e uma
regressão ali mentiria em todo dano da mesa: o bônus sobe com o nível, entra no total,
**não dobra no crítico** (o crítico dobra dados, e bônus não é dado), fica **só no golpe
inicial** do dano contínuo, é **por disparo** nos Múltiplos Disparos e **não vaza** para
Cura nem para os Especiais.

**Uma lacuna que a integração deixou:** o retrato virou painel e o **contrato do tema não
sabia disso**. A entrada `.afty-retrato` descrevia "a miniatura do retrato", que não existe
mais, e as três classes novas não estavam listadas. Corrigido: entraram
`.afty-cabecalho-conteudo`, `.afty-cabecalho-principal`, `.afty-retrato-painel` e o
atributo `[data-afty-com-retrato]`, e o mapa da página foi redesenhado. Sem isso, quem
pedisse um tema a uma IA receberia CSS mirando um seletor morto.

⚠ **A lição para a próxima:** o assert de contrato só confere **contrato → existe**, e não
**existe → contrato**. Classe nova de outra pessoa entra sem ninguém notar. Vale inverter
a varredura um dia.

### Verificação

Lint e build limpos, **200 asserts**, `src/components/` intocado.

### Para confirmar com o autor

- **O bônus fora do golpe inicial no dano contínuo.** Ele documentou "em Dano Contínuo
  contra o mesmo alvo, o bônus entra apenas no golpe inicial". Está implementado assim e
  eu travei com assert, mas é regra e vale a confirmação de quem manda no livro.

---

## FASE: FUNCIONAMENTO BÁSICO E BUFFS TEMPORÁRIOS (2026-08-08)

Duas coisas que a criatura tinha e a Ficha não mostrava.

### O Funcionamento Básico

O `core.tecnicaDescricao` não era exibido em lugar nenhum além do campo de edição do criador. O
autor tinha acabado de ganhar negrito, títulos e tabelas nele, e nada disso chegava à mesa.

O renderizador saiu do criador e virou `src/systems/afty/ui/TextoRico.jsx`, ao lado dos outros
primitivos compartilhados. **Cor por variável CSS com fallback**, porque criador e Ficha têm paletas
diferentes e o componente é o mesmo.

Na Ficha ele é um cartão no topo da aba Habilidades, dobrável e **aberto por padrão**: é um só, e é
o texto que descreve a criatura, ao contrário dos 40 itens do livro que abrem fechados. Obedece ao
filtro local da aba, casando contra o `textoPuro`.

⚠ **Não é um `ItemDeFicha`.** O item renderiza um `<p>` corrido e achataria a formatação justamente
onde ela foi pedida.

**Classes novas no contrato do tema:** `.afty-tr`, `.afty-tr-h1`, `.afty-tr-h2`, `.afty-tr-p`,
`.afty-tr-forte`, `.afty-tr-tabela`, `.afty-tr-tabela-caixa`, `.afty-tr-vazio`, `.afty-tecnica`.

⚠ **A cor do Texto Rico vai por `style` inline**, e não por regra de folha. Isso é o preço de o
componente servir aos dois donos, e significa que o CSS do usuário precisa de `!important` para
repintar esses sete seletores. É a única parte da Ficha onde isso vale. Se incomodar, o conserto é
mover as regras para o `ficha.css` e dar ao criador uma folha própria.

### Buffs Temporários

`duracao` passou a viajar nos `detalhes` do Motor, e a aba Buffs ganhou a seção **Temporários**
(nome, origem, canal, valor, marca de *Suplantado*). É **só leitura**, seguindo a assunção de que
efeito temporário fica sempre ligado na ficha.

### Para confirmar com o autor

- **O cartão do Funcionamento Básico mora na aba Habilidades.** Foi escolha minha, por ser o texto
  da Técnica e as Habilidades serem o que ele descreve. Se o lugar dele é o topo da aba Ações, ou um
  bloco no cabeçalho, é troca de uma linha.
- **Temporário não se desliga.** Se a intenção é poder apagar um buff temporário na mesa (a magia
  acabou antes da cena), isso é mudança no Motor e não na aba, porque hoje nada carrega quantas
  rodadas o efeito ainda tem.
