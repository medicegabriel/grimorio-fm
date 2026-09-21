# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Leia [AGENTS.md](AGENTS.md) antes de alterar este repositório ou escrever sobre ele. Ele manda no
estilo de escrita e nas regras de colaboração. O que mais pega está repetido aqui.

## Regras que valem em toda edição

- **Nunca use o travessão Unicode U+2014** em texto novo ou alterado: código, comentário,
  documentação, interface, título, descrição. Prefira vírgula, dois-pontos, ponto ou parênteses.
  Confira o diff antes de entregar.
- **Não faça commits nem push.** O autor cuida dessa etapa. O deploy é o push para `main`, que a
  Vercel publica.
- O repositório tem mais de um colaborador. Rode `git fetch` e adiante o `main` antes de editar.
- **`src/components/` e `src/data/enciclopedia-digital-*.json` são somente-leitura.** É o Grimório
  2.5.2, o livro oficial. Correção de regra do livro dentro do Afty é feita por Addon com
  `substitui`, nunca no raw. O `Dashboard.jsx` já recebe algumas props do Player, e a fronteira
  definitiva dessas exceções continua em `docs/a-fazer.md`.
- Pendência nova vai para `docs/a-fazer.md`, nunca só num `// TODO` no código. Ao resolver, apague
  a entrada e registre o que foi feito em `docs/afty-status.md` ou no guia da área.
- Arredondamento no Afty é sempre para baixo (`Math.floor`), salvo quando o texto do livro manda
  outro. Não é bug nem pergunta.
- Texto de regra do livro é fiel à fonte. Regra ambígua ou faltando vira pergunta em
  `docs/a-fazer.md`, não suposição.
- Aviso na tela usa o ícone `<AlertTriangle/>` do lucide, nunca o caractere U+26A0. O lint reprova
  esse caractere em JSX e em string dentro de `src/systems/afty/`, e o deixa livre em comentário.

## Regras de UI do Afty

O autor pediu cada uma destas mais de uma vez. A skill `frontend-design` só roda sob pedido, e fora
dela vale esta lista.

- Rótulos, chips e toggles em Title Case, com conectores curtos em minúscula ("Nível do Efeito",
  "Tipos de Dano Extras").
- Texto de tela sem travessão e sem ponto e vírgula. Vírgula, dois-pontos e parênteses servem.
- Nada de texto explicativo solto no criador: não acrescente `hint`, memória de cálculo cinza nem
  legenda ensinando regra. A tela mostra o resultado e os avisos em âmbar de problema real. A
  descrição de catálogo de suplemento vai no hover com `DicaDeTexto` (`ui/fontes.jsx`), nunca no
  `title` nativo.
- Todo número derivado mostra de onde vem: stat novo no `deriveAfty` sai com `partes` junto do
  valor, e o hover (`PainelDeFontes`) lê essas partes. Parcela vinda do Motor leva o nome da
  Habilidade, Talento ou treino que a gerou.
- Cápsula de raio total (`.afty-chip`) só em rótulo curto de valor fixo. Condição escrita em frase
  sai como texto puro (`afty-rotulo`).
- `src/index.css` é global, compartilhado com a 2.5.2 e escrito fora de `@layer`, então `h1`,
  `h2`, `p` e `code` vencem qualquer utilidade do Tailwind 4. Tamanho ou margem que "não obedece"
  se resolve com o sufixo `!` (`m-0!`), nunca editando o `index.css`.
- Campo de texto livre é marcação (`afty-texto-rico.js`, desenhada por `ui/TextoRico.jsx`), nunca
  HTML nem `dangerouslySetInnerHTML`: a ficha viaja no export e a Ficha Final aceita CSS do usuário.

## Comandos

Tudo a partir de `grimorio-tracker/` (a pasta acima é só um contêiner, o repositório é este).

```bash
npm run dev       # Vite em http://localhost:5173
npm run build     # produção (o vite.config força NODE_ENV=production por causa da Vercel)
npm run lint
npm run asserts   # a suíte de lógica
npm run preview   # serve o dist/ do build de produção
```

### Asserts

Suíte própria, sem framework. Cada arquivo é um `.mjs` que roda sozinho, imprime
`TODOS OS N ASSERTS PASSARAM` e sai com zero. **Não existe `npm test`.**

```bash
npm run asserts                 # todos, um processo por arquivo
npm run asserts -- addons       # só os que casam com "addons" no nome
npm run asserts -- exemplo familias
node asserts/t-addons.mjs       # um só, o caminho mais rápido enquanto se mexe num arquivo
```

- **Rode a suíte antes de começar.** Nem toda falha é sua, e a linha de base muda.
- ⚠ **A linha de base de hoje tem UM vermelho conhecido**, e ele não é bug:
  `t-invocacoes-motor.mjs` falha em *"a Livre com Motor custa 1 PE, como toda Característica"*,
  porque a cota base de Ações e Características deixou de custar PE em 2026-09-14. É uma PERGUNTA
  AO AUTOR aberta em `docs/a-fazer.md`, esperando decisão de regra. **Não conserte por conta
  própria**: os dois consertos possíveis apontam para lados opostos, e escolher é do autor. Todo o
  resto passa.
- `node asserts/t-ordem-modulos.mjs` sozinho pega quase todo acidente de import, em segundos. É
  obrigatório em qualquer mudança de `import`.
- O lançador roda cada arquivo em processo próprio porque eles reescrevem os catálogos globais com
  `aplicarAddons` e um sujaria o outro. Ele também não usa laço de shell de propósito: script de
  `package.json` roda por `cmd` no Windows, e um `for f in asserts/t-*.mjs` quebraria lá.
- ⚠ `src/systems/afty/asserts/t-filtro-habilidades.mjs` e `t-imitacao.mjs` NÃO são pegos pelo
  lançador, que lê só a pasta `asserts/`. Eles nem imprimem a linha de aprovação padrão. Rode-os à
  mão ao mexer nessas áreas.
- Assert novo segue o padrão dos vizinhos: `register()` com o shim de extensão no topo, depois
  `t(nome, real, esperado)` comparando `JSON.stringify`. Nenhum deles escreve nada. O contrato está
  em `asserts/LEIA.md`, que também traz a tabela do que cada arquivo cobre. ⚠ As CONTAGENS daquele
  arquivo estão velhas (ele diz 62 arquivos, e a pasta já passou de cem); a tabela continua boa.
- Todo arquivo importa `afty-derive.js` PRIMEIRO. Começar por `afty-habilidades.js` estoura o ciclo
  de `afty-combate.js`.
- A pasta fica fora de `src/` e usa `.mjs` de propósito: nem o `vite build` nem o `eslint .` a
  enxergam (o `eslint.config.js` casa só `**/*.{js,jsx}`).

### Lint

`npm run lint` NÃO está limpo, e a sujeira é toda de fora do Afty (`src/components/`,
`src/useEncounter.js`, `vite.config.js`), que é código somente-leitura ou de configuração. Hoje são
22 problemas. O que precisa continuar em zero é:

```bash
npx eslint src/systems/afty
```

### Navegador

`npm run dev` e abra `http://localhost:5173/afty` ou `/player`. A raiz é o 2.5.2.
Depois de editar arquivo pesado (`AftyCreatureBuilder.jsx`, `afty-schema.js`), um
`Cannot access 'X' before initialization` no console pode ser fantasma de HMR: mate o processo do
Vite e suba de novo antes de acreditar no erro.

**Lentidão nunca se mede no `npm run dev`.** Lá a mesma ficha custa de 10x a 20x mais JS, e o
perfil aponta para o Motor (`reavaliarUnica`, `aplicarEfeitos`) sem que ele seja o problema. Meça
com `npm run build` seguido de `npm run preview`.

Para conferência automática de tela existe `.audit/`, um punhado de scripts Playwright soltos
(o Playwright está instalado mas não consta do `package.json`). Com o `dev` de pé em outro
terminal:

```bash
node .audit/smoke.mjs   # carrega a raiz, junta erro de console, tira print em .audit/shots/
```

⚠ Script de `.audit/` ou de `design.local/` roda FORA do app: se ele deriva uma ficha, precisa
chamar `aplicarAddons` antes, ou o número sai mentindo.

## Arquitetura

SPA em Vite mais React 18, Tailwind 4, sem backend. Tudo mora no `localStorage`.

### Três sistemas, um código só

| Rota | Sistema | Chaves |
|---|---|---|
| `/` | Grimório 2.5.2, o livro oficial, somente-leitura | `fm_*_v1` |
| `/Afty` | criatura do mestre | `fm_*_afty_v1` |
| `/Player` | personagem do jogador, o MESMO código com uma chave de sistema | `fm_*_player_v1` |

A lei está em caixa alta no cabeçalho de `afty-sistema.js`: **o sistema vem da FICHA, não da rota.**
A rota decide só em que sistema uma ficha NOVA nasce, e daí em diante quem responde é
`creature.rulesVersion`. Isso não é preciosismo: os encontros são compartilhados entre as duas
rotas, o combatente guarda a ficha inteira, e a mesma tela renderiza fichas dos dois sistemas ao
mesmo tempo. Um contexto global preso à rota daria a resposta errada para metade da lista, e daria
calada. Por isso `deriveAfty(creature)` não recebe parâmetro de sistema.

Como o código é um só, toda mudança em `src/systems/afty/` pega os dois sistemas por padrão, sem
sintoma. **Antes de editar, pergunte ao autor se a mudança vale para a criatura e para o
personagem, ou só para um.** Quando o comportamento precisa divergir entre os dois, use
`regraDo(sistema, chave)` e registre a linha na tabela `DIVERGENCIAS` de `afty-sistema.js`, nunca
um `if` solto no meio do cálculo. O `asserts/t-sistema.mjs` falha no dia em que
a lista muda sem aviso.

As duas portas de fronteira entre os livros ficam no `src/App.jsx`: a de ENTRADA (o importador do
Grimório público recusa ficha de outro livro, e avisa o que recusou) e a de USO (quem já entrou
abre na tela do livro dela). Nenhuma das duas mexeu em `src/components/`.

### O pipeline: `deriveAfty(creature, opcoes)`

Função pura e síncrona em `afty-derive.js`. Recebe a ficha crua e devolve todo número derivado
(`hp`, `pe`, `defesa`, `testes`, `dano`, `combate`). Estágios, e a ordem importa:

1. Pré-contexto: atributos base, ND, patamar.
2. **MONTANTE**: Treinamentos, Habilidades Gerais e os campos "+ OUTROS". Habilidades, Talentos e
   Aptidões ainda não existem aqui, então `contar()` devolve 0 e `quando` é descartado (só
   `gatilhoSessao` e `quandoProf` funcionam neste estágio).
3. Resolução de Habilidades, Talentos, Aptidões e Especializações.
4. **Motor de Automação**: `efeitosDaTecnica` monta uma linha `{canal, expr, ...}` por efeito e
   descarta entrada inválida em silêncio (validar é papel da UI, não do motor).
5. Aplicação por canal, com `resolverExclusivos` para os pools que competem.
6. Números finais: PV, PE, Defesa, CD, RD, Testes, Dano, Cura.

Dentro do Motor o atributo entra primeiro, e em dois tempos: `atributo` permanente (é o que os
pré-requisitos enxergam), depois `atributo` temporário (é o que a ficha mostra), e só então todos
os outros canais, já lendo o atributo final.

`opcoes` carrega o que só existe em jogo e não na criação: `almaAtual`, `concedido`.

### Motor de Automação e DSL

Um efeito é `{ canal, expr, quando?, alvo?, duracao? }`. Diretriz do autor: **usar o Motor sempre**.
O que não cabe vira extensão do motor (canal novo, variável nova, tipo de efeito novo), nunca um
texto solto que a UI só exibe. Todo efeito aplicado entra em `detalhes`, que é o que alimenta o
painel de fontes no hover.

- `alvo` ausente num canal com destino vale para TODOS.
- Sem `quando` o efeito está sempre ligado. As constantes `sempre` e `nunca` existem para escrever
  isso na UI, porque campo vazio virava 0.
- Só o `duracao: "permanente"` conta para pré-requisito. Os dois contam para os stats.
- `afty-dsl.js` é a cópia do `fm-dsl.js` da 2.5.2, autorizada em 2026-08-20, e é deste lado que a
  linguagem cresce. A 2.5.2 segue com a cópia dela e melhoria daqui não volta para lá. Referência
  em `docs/automacao-dsl.md`.
- Toda variável é `snake_case`, produzida por `normalizarVariavel`. O nome final depende só do `id`
  final, e é por isso que um addon vira nativo sem reescrever fórmula.

### Pools exclusivos

Algumas famílias não somam entre si. `chaveExclusiva(canal, alvo, sinal)` agrupa, e
`resolverExclusivos` escolhe o maior valor absoluto e marca os outros como `suplantado`, que o
painel de fontes mostra. Positivo e negativo do mesmo canal são grupos separados. Toda linha de
Funcionamento Básico carrega `exclusivo: "funcionamentoBasico"`, inclusive as dos extras nativos.

### ⚠ Ordem de módulos, o invariante mais caro

Existe um ciclo real no grafo de imports
(`afty-equipamentos` para `afty-efeitos` para `afty-combate` para `afty-habilidades` e de volta
para `afty-equipamentos`). Ele só não estoura porque alguns módulos são **FOLHA**, com zero
imports. Em 2026-09-02 o app inteiro caiu em tela branca e nenhum assert pegou, porque eles entram
por `afty-derive.js`, que resolve o ciclo na ordem que funciona, e o navegador entra por outra
porta.

A lista viva de folhas está em `asserts/t-ordem-modulos.mjs`, com o motivo de cada uma escrito ao
lado. **Nunca acrescente um `import` no topo de uma delas.** Se uma folha precisa de dado externo,
o padrão certo é o inverso: escreva a função num módulo que JÁ importa a folha e troque os
call-sites para o wrapper. Foi assim que `afty-extras-nativos.js` resolveu precisar de
`funcionamentosDaFicha`.

O gatilho mais comum é uma aba nova: o `AftyCreatureBuilder.jsx` importa as abas no topo, e uma aba
que puxe `afty-equipamentos` inverte a ordem. Foi assim que o app caiu da primeira vez.

### Addons

A camada em que cada mesa acrescenta conteúdo sem abrir o GitHub. Desenho completo em
`docs/afty-addons.md`, exemplos em `addons/`. Duas frases seguram o sistema:

1. Um addon pode tudo que o Motor já sabe dizer, e nada além. Falta de canal vira trabalho no motor.
2. Addon nunca ganha verbo escondido. Verbo (mecanismo) entra no motor, substantivo (conteúdo da
   mesa) fica no pacote.

⚠ **Addon é DADO, nunca JavaScript**: sem backend, código de terceiro na aba alcança o
`localStorage` inteiro. A "lógica" de um addon é DSL, que só faz aritmética e cai no fallback.

O registro reescreve os arrays de catálogo no lugar e manda cada família religar os índices. Quem
memoriza em cima de catálogo precisa de `epocaAddons()` na dependência do `useMemo`, senão não
recalcula. O addon mora em dois lugares: a BIBLIOTECA (`fm_addons_afty_v1`), onde a pessoa instala e
edita, e `creature.addons`, a cópia congelada que manda no cálculo. Atualizar é um botão, nunca
automático. Campos: `permite` muda a tela, `libera` muda a regra, `substitui` remenda uma entrada
do livro por campo.

### Estados de bancada de combate

`combate` é a bancada de balanceamento, não um rastreador de verdade. `resolveCombate` devolve tudo
zerado quando `!combate.ativo`, então nenhum estado conta fora de "Em Combate". Variáveis que não
são estado de bancada (`alma_atual`, por exemplo) continuam valendo sempre.

Os dois catálogos têm filtros INVERSOS, e é a confusão mais comum:

- `COMBATE_ESTADOS` (`afty-combate.js`): toda linha precisa de dono (`requerHabilidade`,
  `requerTalento`, `requerAptidao`, `requerEscolha`). **Sem dono, a linha nunca aparece.**
- `combate.estadosExtras`: alimentado em `afty-derive.js` com equipamento, estilo, aptidões, addons
  e `ESTADOS_NATIVOS_EXTRAS`. **Quem não declara dono aparece.** É onde entra o que a ficha não
  compra (aliado, comida, o estado da própria alma).

### Ficha, tema e encontros

A Ficha Final (`ficha/AftyFicha.jsx`) é a tela de uso em jogo, pintada por variável CSS `--afty-*`
e não por classe de cor do Tailwind, o que é o que torna o tema possível. O tema mora em
`creature.aparencia`, dentro da criatura, para viajar de graça no export. Quatro camadas: preset,
formulário, imagem, CSS livre. Ver `ficha/ficha-tema.js` e os exemplos em `themes/`.

O Encontro do Afty tem gerenciador próprio (`encontros/`, chave `afty_encontros_v1`): o combatente
guarda `ficha` e `sessao`, enquanto o da 2.5.2 guarda `snapshot` e `combatState`.

### Onde procurar uma tela

A interface do Afty está em quatro lugares, e saber qual poupa uma busca:

| Onde | O que é |
|---|---|
| `AftyCreatureBuilder.jsx` | o criador, um arquivo só, mais de 17 mil linhas. A maioria das abas de criação mora aqui dentro |
| `AftyTab*.jsx` (raiz do afty) | as abas de criação que ficaram grandes demais para o builder: Addons, Carteira, Catarse, Defesas |
| `ficha/` e `ficha/abas/` | a Ficha Final, suas abas de jogo (Ações, Buffs, Equipamentos, Habilidades, Invocações, Perícias) e os painéis `PainelDe*.jsx` |
| `ui/` | o que criador e ficha compartilham: `fontes.jsx` monta o painel de fontes do hover, mais `vital.jsx`, `TextoRico.jsx` e as bancadas |

Uma aba da Ficha também é renderizada dentro do Encontro, então ela tem dois donos e mede por
`@container`, não por largura de janela.

### Arquivos-chave

| Arquivo | Responsabilidade |
|---|---|
| `src/App.jsx` | rotas, as duas portas entre os livros |
| `afty-derive.js` | o pipeline inteiro, `deriveAfty` |
| `afty-schema.js` | fábrica de ficha em branco. FOLHA, zero imports |
| `afty-efeitos.js` | canais, `efeitosDaTecnica`, pools exclusivos |
| `afty-efeitos-conteudo.js` | os efeitos de cada Habilidade, Talento e Aptidão do catálogo |
| `afty-combate.js` | `COMBATE_ESTADOS`, `resolveCombate` |
| `afty-extras-nativos.js` | estados e funcionamentos sem dono, embutidos |
| `afty-addons.js` | registro de famílias, namespace, `permite` e `libera` |
| `afty-dsl.js` | o avaliador, `normalizarVariavel`. FOLHA |
| `afty-sistema.js` | `regraDo()`, `DIVERGENCIAS`, Afty contra Player. FOLHA |
| `AftyCreatureBuilder.jsx` | o criador, mais de 17 mil linhas |
| `ficha/AftyFicha.jsx` | a Ficha Final |
| `encontros/PainelDeCombatente.jsx` | o combatente dentro do Encontro |

## Documentação

- `docs/a-fazer.md`: a fila atual, incluindo as PERGUNTAS AO AUTOR paradas esperando decisão.
  **Leia as perguntas antes de "consertar" o que parecer errado.** Várias são decisão de regra do
  autor, não bug, e uma delas é o assert vermelho da suíte.
- `docs/afty-status.md`: o log de sessões e o porquê das coisas. Afirmação datada nele não
  substitui conferir o código de hoje. ⚠ São quase 14 mil linhas: procure com `grep`, não leia
  inteiro.
- `docs/afty-motor-referencia-estrutural.md`: corte transversal do motor, sem data. É o documento
  para colar no início de uma sessão que vai mexer em `src/systems/afty/*.js`.
- `docs/afty-addons.md` para autoria de addon, `docs/automacao-dsl.md` para a linguagem,
  `docs/afty-formulas-base.md` para as fórmulas confirmadas pelo autor, e um guia por área
  (`afty-player`, `afty-ficha-final`, `afty-carteira`, `afty-invocacoes`, `afty-equipamentos`,
  `afty-criacao-equipamentos`, `afty-cofre`).

Ao mudar o código, atualize contagem, caminho e estado de implementação nos guias. Não apresente
como pergunta em aberto uma decisão já tomada.
