# Roadmap: versionamento de regras (2.5.5) e fichas de jogador

Documento de planejamento. Escrito antes da implementação começar, para registrar as
decisões e o porquê delas. Se algo aqui divergir do código, o código venceu — atualize
este arquivo.

Última revisão: 2026-07-09

---

## Objetivo

Três entregas, nesta ordem de dependência:

1. **Rotas de verdade** (`/criaturas/:id`, `/fichas`) + fallback de SPA na Vercel.
2. **Versionamento de regras**: o usuário escolhe 2.5.2 ou 2.5.5 ao criar uma criatura.
3. **Fichas de jogador**: livro de ~400 páginas, 14 capítulos, entregue capítulo a capítulo.

A ordem não é negociável: a rota destrava a URL de teste das fichas, e o versionamento
precisa acontecer **antes** de existirem duas versões para manter simultaneamente.

---

## Estado atual (verificado em 2026-07-09)

- SPA Vite + React 18, **sem backend**. Deploy da branch `main` na Vercel.
- Estado em `localStorage`: `fm_creatures_v1`, `fm_folders_v1`, `fm_creatures_meta_v1`.
- **Sem roteamento.** A view é um `useState` em `src/App.jsx:33`. A URL nunca muda.
- Regras hardcoded como exports soltos em `src/components/fm-tables.js` (579 linhas).
- Já existe precedente de "URL escondida": `?testar-erro=1` em `src/App.jsx:23-28`.
- Já existe um sistema de efeitos/DSL: `fm-dsl.js`, `fm-modifiers.js`, `fm-automation.js`,
  documentado em `docs/automacao-dsl.md`.
- `A Incrível Enciclopédia Digital 0.1.json` é um export de 51 criaturas. **Não** contém
  conteúdo do livro de jogador — esse terá de ser digitado do zero.

---

## 1. Rotas + ambiente de teste

### Decisão

Nada de branch protegida, variável de ambiente por ambiente, ou tree-shaking condicional.
O modelo é o mesmo do `?testar-erro=1`: **a feature está no bundle público, só não tem
link apontando para ela.** Quem souber a URL, entra. Isso é suficiente porque o objetivo
não é sigilo — é mandar a URL manualmente para alguns testadores enquanto a feature não
está pronta para o público geral.

Vale ser explícito sobre a consequência: num SPA sem backend, o código vai no bundle de
qualquer jeito. Uma "URL secreta" nunca esconderia nada de quem abrir o DevTools. Como o
sigilo não é requisito, tudo bem.

### Trabalho

- Adotar `react-router`. Além da URL de teste, isso destrava deep link para uma criatura
  e o botão voltar do navegador — hoje nenhum dos dois funciona.
- Criar `vercel.json` com rewrite de SPA. **Sem isso, `/fichas` funciona ao navegar dentro
  do app mas retorna 404 no F5 ou ao abrir o link direto** — que é exatamente o que os
  testadores vão fazer, já que o link chega por Discord/WhatsApp.
- `/fichas` não aparece em nenhum menu até a decisão de expor.

---

## 2. Versionamento de regras (2.5.2 → 2.5.5)

### Decisão

Um `if (versao === "2.5.5")` dentro de `calculateHP` está **descartado**: em duas versões é
um `if`, em quatro é um pântano, e as tabelas de UI passariam a ler estado global.

O conjunto de regras vira um **objeto passado adiante**, e a 2.5.5 é montada como um
*patch* por spread sobre a 2.5.2:

```
src/rules/
  v252.js     ← o fm-tables.js de hoje, agrupado num objeto
  v255.js     ← { ...v252, calculateHP: ..., RD_GERAL: ... }
  index.js    ← getRuleset(version)
```

O patch por spread tem uma propriedade que vale muito: **`v255.js` é a lista literal do que
mudou entre as versões.** Quando sair a 2.5.6, você lê um arquivo de 40 linhas, não 600.

Como as regras chegam a quem precisa, em duas rotas:

- **Lógica pura** (`fm-derive`, `fm-action-calc`, `fm-conditions`): recebe `rules` como
  parâmetro explícito. `deriveStats(creature)` resolve o ruleset uma vez, no topo, lendo
  `creature.rulesVersion`, e passa para baixo. Funções puras seguem puras e testáveis.
- **Componentes React** (`sections/*`, `CombatantPanel`): leem de um `RulesetProvider` via
  context. Ninguém quer threadar `rules` por seis níveis de props.

### Inventário real de `fm-tables.js`

33 símbolos exportados, importados por 20 arquivos. **Quatro são agnósticos de versão** e
não entram no ruleset:

| Símbolo | Por que é agnóstico |
|---|---|
| `getModifier` | `Math.floor((attr - 10) / 2)` — aritmética, não regra de mesa |
| `normalizeText` | utilitário de string (NFD + lowercase) |
| `PATAMAR_LABELS` | texto de UI |
| `DIFFICULTY_LABELS` | texto de UI |

Esses continuam como exports soltos, de um `src/rules/utils.js`.

**Sete arquivos importam apenas símbolos agnósticos e não precisam de nenhuma mudança:**
`SectionAttributes.jsx`, `SectionDerivedStats.jsx`, `LivePreview.jsx`,
`SectionAptidoesEspeciais.jsx`, `SectionCaracteristicas.jsx`, `SectionDotes.jsx`,
`SectionTreinamentos.jsx`.

**Treze arquivos precisam ser tocados:**

| Arquivo | Símbolos sensíveis a versão |
|---|---|
| `fm-derive.js` | 25 símbolos — o consumidor principal |
| `CombatantPanel.jsx` | `calculateCD`, `calculateAcerto`, `CONDITIONS`, `SANGRAMENTO_LADDER`, `expandCascadingImmunities` |
| `SectionDefenses.jsx` | `CONDITIONS`, `DEFENSE_LIMITS`, `CONDITION_TOTAL_LIMITS`, `CONDITION_SEVERITY_MAP` |
| `fm-action-calc.js` | `getDamage`, `PATAMAR_ND_RANGE` |
| `SectionCore.jsx` | `PATAMAR_ND_RANGE` |
| `fm-aptidoes.js` | `getBonusTreinamento` |
| `fm-caracteristicas.js` | `getBonusTreinamento` |
| `fm-dotes.js` | `getBonusTreinamento` |
| `fm-origens.js` | `getBonusTreinamento` |
| `fm-treinamentos.js` | `getBonusTreinamento` |
| `fm-automation.js` | `CONDITIONS` |
| `fm-automation-entities.js` | `CONDITIONS` |
| `ActionFormFields.jsx` | `CONDITIONS` |

Dois padrões saltam à vista e devem guiar a ordem do trabalho:

- **`getBonusTreinamento` sozinho responde por 5 arquivos**, e em todos eles é o único
  símbolo sensível. Resolver a passagem desse único símbolo já converte 5 dos 13.
- **`CONDITIONS` responde por 4 arquivos** (3 deles importam só ele).

Ou seja: `fm-derive.js` é o trabalho de verdade; o resto é mecânico.

### Persistência e migração

- Criatura ganha o campo `rulesVersion`, gravado **na criação e nunca recalculado sozinho**.
  Uma criatura de 2.5.2 salva ano passado continua 2.5.2 para sempre.
- Fichas antigas não têm o campo. `readCreatures()` em `useCreatureStorage.js:20` já faz
  migração silenciosa de `folderId`; adicionar `rulesVersion: c.rulesVersion ?? "2.5.2"`
  no mesmo lugar.
- As 51 criaturas do compêndio (`fm-compendium.js`) precisam ser marcadas com sua versão.
- Migração manual ("converter para 2.5.5") deve **mostrar um diff dos stats antes/depois**,
  porque os valores mudam debaixo dos pés do usuário.
- **Encontros já guardam `snapshot: creature`.** Como o snapshot carrega o `rulesVersion`
  junto, um encontro misturando criatura 2.5.2 com 2.5.5 funciona de graça. Não quebrar isso.

### Pré-requisito de conteúdo

Antes de escrever `v255.js`: **um documento listando exatamente o que mudou da 2.5.2 para a
2.5.5**, tabela por tabela. Sem isso, mudanças serão descobertas no meio da implementação e
o trabalho será refeito.

---

## 3. Fichas de jogador

O risco aqui não é técnico, é de escopo. 400 páginas e 14 capítulos transcritos como código
viram vinte mil linhas de `if`. Três princípios decidem se dá certo.

### Guarde escolhas, nunca resultados

A ficha salva `{ classId: "feiticeiro", nivel: 7, picks: ["dote-x", "hab-y"] }`. HP, defesa,
acerto — tudo recalculado toda vez que a ficha abre. É o que o builder de criaturas já faz, e
é o que permite que uma errata conserte todas as fichas de todo mundo sem migração de dados.

### Conteúdo é dado, não código

Origens, classes, itens, encantamentos, habilidades, shikigamis, domínios: tudo em JSON com
ids estáveis. O motor não sabe o que é um shikigami; ele sabe aplicar efeitos.

Com 400 páginas digitadas à mão, um **script de validação de conteúdo** rodando no build
(ids únicos, pré-requisitos apontando para coisas existentes, alvos de efeito válidos) paga
por si na primeira semana.

### Reaproveite a DSL que já existe

`fm-dsl.js`, `fm-modifiers.js` e `docs/automacao-dsl.md` **já são** o sistema de efeitos que
uma ficha de jogador precisa. Um encantamento de item, um dote e uma habilidade de classe são
a mesma coisa vista de ângulos diferentes: uma lista de modificadores com condições. Se essa
peça já funciona para criaturas, adicionar o Capítulo 9 vira adicionar um arquivo de dados —
não escrever código novo.

### Ordem de entrega

A única regra que importa: **chegue rápido a uma ficha que dá para jogar.**

1. Atributos → Perícias → Origens → Classes. Isso já é um personagem funcional na mesa.
2. Depois, um capítulo isolado por vez: Itens → Encantamentos → Habilidades → Shikigamis →
   Expansões de Domínio → regras adicionais.

Tentar modelar os 14 capítulos antes de renderizar a primeira ficha mata o projeto no
capítulo 4.

### Armazenamento

Chave própria (`fm_characters_v1`) e dashboard próprio. **Não** forçar o schema de criatura a
servir aos dois.

---

## Sequência de execução

| # | Passo | Destrava |
|---|---|---|
| 1 | `react-router` + `vercel.json` | URL de teste das fichas, deep links, botão voltar |
| 2 | Refatorar `fm-tables` → ruleset injetado, **só com a 2.5.2 existindo** | Passo 3 |
| 3 | Documentar o diff 2.5.2 → 2.5.5, depois escrever `v255.js` como patch | Seletor de versão |
| 4 | Fichas de jogador em `/fichas`, capítulo a capítulo | — |

O passo 2 não deve ser pulado. Ele **não muda comportamento nenhum** — é a refatoração que se
faz *antes* de ter duas versões para manter, não depois. Fazer o versionamento direto em cima
do código atual significaria tocar em 13 arquivos *enquanto* também se tenta acertar os números
novos da 2.5.5. Separado, cada metade é verificável sozinha.

**Como verificar o passo 2:** exportar os stats derivados das 51 criaturas do compêndio antes
da refatoração, refatorar, exportar de novo, e conferir que os dois arquivos são idênticos.

---

## CORREÇÃO (2026-07-14): Afty é um SISTEMA, não uma versão

O modelo de patch por spread (`v255 = {...v252, calculateHP}`) foi desenhado assumindo que
as versões diferem em *números sobre a mesma estrutura*. Isso vale para **2.5.2 → 2.5.5**
(edições do mesmo livro), mas **NÃO vale para o Afty**.

O Grimório Afty tem: origens diferentes, cálculos diferentes, aptidões e aptidões
amaldiçoadas diferentes, Dotes que viram "Habilidades de Especialização", **Especializações
(classes de RPG) com multiclasse**, **Tipos de criatura** (Combatente, Misto, Conjurador,
Restringido), e **aba de itens** adaptada do livro do jogador. A *forma do documento* é
diferente, não só os valores. Um spread onde 80% dos campos são sobrescritos não é patch —
é uma reimplementação disfarçada, e a "interface compartilhada" vira mentira.

### Nova distinção

- **Versão** (2.5.2 → 2.5.5): patch por spread sobre o mesmo esquema. Modelo original vale.
- **Sistema** (Afty, e depois Ficha de Jogador): módulo próprio que *implementa a mesma
  interface* que a 2.5.2, com esquema e código totalmente diferentes por trás. NÃO estende
  a 2.5.2.

Vira mental: de **"ruleset = tabelas"** para **"sistema = esquema + motor + builder + ficha
+ adaptador de combate"**. O app deixa de ser "o grimório 2.5.2 com temas" e passa a ser uma
**casca multi-sistema**.

### Interface do módulo de sistema

Casca compartilhada (escrita uma vez): roteamento, storage/pastas, dashboard, import/export,
o *chrome* do rastreador de combate, encontros, PDF.

Cada sistema fornece:

```
getSystem(rulesVersion) -> {
  id, label,
  createBlank(),                    // forma do documento + defaults — esquema é DELE
  migrate(creature),                // migrações de versão
  derive(creature) -> derived,      // motor de cálculo puro
  toRuntime(creature, derived) -> { // <-- PEÇA-CHAVE: objeto de combate NORMALIZADO
    hpMax, peMax, defesa, iniciativa, deslocamento,
    condicoes, acoes, resistencias, ...
  },
  Builder,                          // componente de autoria (system-specific)
  Sheet,                            // componente de visualização (system-specific)
  validateContent?,                 // para conteúdo orientado a dados
}
```

**`toRuntime` é o linchpin.** O rastreador de combate hoje lê `creature.stats.hpMax` e
`creature.combatState` direto. Como a criatura Afty tem outra forma, isso quebraria. Cada
sistema produz um objeto de combate normalizado e o rastreador consome só isso — sem saber
de qual sistema veio. É o que permite uma criatura 2.5.2 e uma Afty no mesmo encontro. Sem
essa costura, viram dois apps.

O `rulesVersion` (já plantado na ficha) é o que o dashboard usa para abrir o `Builder`/`Sheet`
certo. Uma criatura Afty NUNCA pode ser aberta pelo builder da 2.5.2 — são tipos de documento
diferentes.

Justificativa do investimento: são **quatro consumidores** (252, 255, Afty, Jogador). O Afty
é o **piloto que tira o risco da Ficha de Jogador** — resolve classes/multiclasse, itens e
habilidades escolhíveis num escopo que o autor domina, antes de enfrentar as 400 páginas.

### Design: criar vs. visualizar

1. **Builder e Ficha são componentes SEPARADOS por conteúdo, mas com a MESMA CASCA.** Ambos =
   cabeçalho + banda de stats fixa no topo + as mesmas abas. A diferença é o conteúdo de cada
   aba: editores no modo Criar, leitura no modo Ver. "Um sistema, dois modos."
2. **Seções orientadas a dados**, renderizadas de um catálogo JSON (ids estáveis + validador),
   não JSX hardcoded por feature.
3. **IA do builder = ABAS, não linha reta / wizard numerado.** (Decisão do autor, 2026-07-14.)
   Criar criatura NÃO é linear — é trabalho de referência, com idas-e-voltas entre partes
   conferindo números. Uma trilha numerada (01→02→03) *pune* esse ir-e-voltar; abas o
   convidam. Abas: Identidade · Tipo & Nível · Atributos · Especializações · Habilidades ·
   Itens · Ações [FIM] · Alto Nível 21+ [FIM]. Navegação livre, sem ordem imposta.
4. **Anti-atrito do pré-requisito** (motivado por caso real do autor: escolher uma Habilidade,
   descobrir que o nível não bate, ter que sair pra Níveis e voltar):
   - A **distribuição de níveis da multiclasse fica sempre visível no cabeçalho** (ex.: Punho
     12 / Véu 8) com ± inline — ajustável de QUALQUER aba, sem sair de Habilidades.
   - Habilidade travada **diz o que falta** ("requer Nível 14 em Véu · faltam 6"), não some.
   - Redistribuir níveis entre classes NÃO altera stats de combate (só o Tipo dirige cálculo),
     então a banda fica estável enquanto se mexe na distribuição — reforça a regra ao usuário.
5. **Primitivas de UI compartilhadas** extraídas antes do builder grande: Field, Picker,
   NumberStepper, Chip, ChoiceList (com validação de pré-req), StatBand, Card, Tabs.
6. **Tabulada, mobile-first**: banda de combate sempre visível (HP/PE/Defesa) + abas com
   scroll horizontal no mobile.
7. **Visual final = o design system do app** (mais bonito que o wireframe). O mockup só define
   estrutura/IA; a pele vem do app existente.

### Preparação — ordem

1. Escrever o **esquema da criatura Afty** como documento de dados, antes de qualquer tela.
2. Definir a **interface do módulo de sistema** (contrato acima).
3. Refatorar a **2.5.2 para trás dessa interface**, sem mudar comportamento (primeiro sistema).
4. Montar o **catálogo de conteúdo Afty** (especializações, habilidades, itens + validador).
5. **Builder e Ficha do Afty**, compostos das primitivas, alimentados pelo catálogo.

### Perguntas em aberto sobre o Afty (bloqueiam o esquema)

- **Tipo × Especialização**: o Tipo (Combatente/Misto/Conjurador/Restringido) é escolhido
  na frente e *restringe* quais Especializações a criatura pode pegar, ou é *derivado* das
  Especializações escolhidas?
- **Multiclasse**: como os níveis se dividem? Há nível total com teto? Cada Especialização
  tem nível próprio (`especializacoes: [{id, nivel}]`)?
- **Habilidades de Especialização** (ex-Dotes): são liberadas por Especialização+nível, ou
  são escolhas livres a partir de um pool? Como guardar as escolhidas?
- **Itens**: inventário simples (lista), ou com slots/equipar + encantamentos (mais perto do
  livro do jogador)?
- **Ações/Características**: em que exatamente diferem estruturalmente da 2.5.2?

---

## REFINAMENTO (2026-07-14): respostas do autor + descope da costura universal

### Descope: combate cruzado NÃO é universal

Correção da correção: `toRuntime` **não** precisa normalizar todos os sistemas entre si.
Só brigam no mesmo encontro **2.5.5-criatura e 2.5.5-jogador** — problema *daquela família*,
tratado quando ela for construída. Afty, 2.5.2 e 2.5.5 **não** se misturam em combate.

Consequência: o Afty é **quase um app separado**. O compartilhado é só a *casca*: Tela
Inicial, Aba de Encontros, Modelos, pastas, storage, IO. As fichas (builder + view) são
independentes. Não arrastar nada da estrutura de ficha da 2.5.2 pro Afty.

### Modelo de cálculo do Afty (confirmado pelo autor)

- **Tipo dirige o cálculo.** `Combatente | Misto | Conjurador | Restringido`. Combatente
  pende pra defensivo (Defesa, RD); Conjurador pende pra CD e derivados. O Tipo é o driver
  das fórmulas — é só um jeito fácil de escolher o arquétipo.
- **Especializações NÃO mudam cálculo** (≠ jogador). Só (a) definem pré-requisito de
  Habilidades de Especialização e (b) definem escalonamento de algumas habilidades.
- **Multiclasse trivial.** Nível total N; distribuído livremente entre **até 2** classes,
  `soma(niveis) === N`. Ex.: 20 níveis → 12 numa classe, 8 na outra.
- **Habilidades de Especialização** = Dotes renomeados. Agora cada uma pertence a uma
  Especialização, exige pré-req de nível *naquela* Especialização, e escala com esse nível
  (e outros fatores).
- **Itens = equipar + slots.** Contam Espaços de Itens + Encantamentos + Encantamentos
  Especiais. **Tudo realimenta os cálculos** (Defesa, Acerto, Dano). Parte pesada do motor.
- **Nível 1 → ∞, sem teto.** Cálculos são **fórmula matemática, não tabela**. O `derive()`
  do Afty é fundamentalmente diferente do da 2.5.2 (que é lookup capado em ND 30).
- **Ações e Características**: seguem o **padrão do jogador** (quase 100% compatíveis criatura
  ↔ jogador), exceto o **Ataque Básico** (dano simplificado na criatura, pra facilitar cálculo
  manual na mesa). São 100% diferentes das atuais da 2.5.2, mais complexas. **Trabalhadas por
  último.**
- **Nível 21+**: abas de **Melhorias Superiores** e **Habilidades Lendárias**. Importantes pra
  alto nível, mas **deixadas para o fim**.

### Assunções ainda a confirmar (não bloqueiam o esquema v0)

- Afty usa os mesmos 6 atributos da 2.5.2? (assumido que sim no esquema v0)
- Origens do Afty diferem — forma exata TBD (placeholder no esquema).
- Perícias/Testes de Resistência — forma exata TBD (placeholder).
