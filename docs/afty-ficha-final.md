# Ficha Final do Afty (plano)

Plano de construção da **Ficha Final**, a tela de USO da criatura. Escrito em 2026-08-05, antes de
qualquer código. Leia junto com `afty-status.md` (estado do sistema), `automacao-dsl.md` (o DSL) e
`afty-formulas-base.md` (as fórmulas).

> Até aqui o Afty só tinha o **criador**. A Ficha Final é a outra metade: o que fica aberto na mesa
> enquanto se joga. O criador **calcula**, a Ficha **opera**.

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
| **6. Acabamento** | celular e tablet a sério, impressão, revisão de acessibilidade | todas |

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
