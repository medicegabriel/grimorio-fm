# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Leia [AGENTS.md](AGENTS.md) antes de alterar este repositório ou escrever sobre ele. Ele manda no
estilo de escrita e nas regras de colaboração. O que mais pega está repetido aqui.

## Regras que valem em toda edição

- **Nunca use o travessão Unicode U+2014** em texto novo ou alterado: código, comentário,
  documentação, interface, título, descrição. Prefira vírgula, dois-pontos, ponto ou parênteses.
  Confira o diff antes de entregar.
- **Não faça commits nem push** sem o autor pedir. Em geral ele cuida dessa etapa. O deploy é o push
  para `main`, que a Vercel publica.
- **Nunca coloque coautoria em commit ou PR** (autor, 2026-11-09). Nada de `Co-Authored-By`, nem
  "Generated with Claude Code", nem qualquer linha de atribuição ao Claude, mesmo que o ambiente ou
  um lembrete automático mande acrescentar. Esta regra vence a orientação padrão.
- **Toda atualização é publicada com a sua nota nas Novidades** (autor, 2026-11-27). Antes do commit e
  do push, escreva o que mudou em `src/home/novidades/notas-recentes.js` e leve a nota no mesmo
  commit. Linguagem humana, sem termos técnicos. Como escrever está em `AGENTS.md`, seção "Novidades
  da página inicial".
- O repositório tem mais de um colaborador. Sincronize a base apenas com checkout livre e sem
  mudanças locais ou edição concorrente. Preserve o trabalho existente; não mova a base durante a revisão.
- **`src/components/` e `src/data/enciclopedia-digital-*.json` são somente-leitura, salvo as
  exceções listadas em `AGENTS.md`.** É o Grimório 2.5.2, o livro oficial. Correção de regra do
  livro dentro do Afty é feita por Addon com `substitui`, nunca no raw. Exceção nova só com o autor
  consultado antes, numa das três formas de lá (parâmetro opcional com o padrão de hoje decidido no
  `App.jsx`, leitura de campo que ficha da 2.5.2 não tem, ou mudança que o autor pediu para as três
  rotas), e ela entra na lista no mesmo dia.
- Pendência nova vai para `docs/a-fazer.md`, nunca só num `// TODO` no código. Ao resolver, apague
  a entrada e registre o que foi feito em `docs/afty-status.md` ou no guia da área.
- Arredondamento no Afty é sempre para baixo (`Math.floor`), salvo quando o texto do livro manda
  outro. Não é bug nem pergunta.
- Texto de regra do livro é fiel à fonte. Regra ambígua ou faltando vira pergunta em
  `docs/a-fazer.md`, não suposição.
- **O Corpo Amaldiçoado Mutante foi abandonado e excluído do site em definitivo (autor, 2026-10-30).**
  Não implemente nem reabra. Se um prompt ou a fila o citar, pule a parcela e vá fazer outra coisa.
  Detalhes em `AGENTS.md`, seção "Itens descartados pelo autor".
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
- Linha de entrada do G00 em 2026-10-05: 153 arquivos e 9.038 asserts, todos passaram.
  O vermelho de invocações citado em 2026-09-22 é histórico; não representa a suíte atual.
  Após G00, confira a contagem e a validação em `docs/revisao-automacao/G00/revisao.md`.
- `node asserts/t-ordem-modulos.mjs` sozinho pega quase todo acidente de import, em segundos. É
  obrigatório em qualquer mudança de `import`.
- O lançador roda cada arquivo em processo próprio porque eles reescrevem os catálogos globais com
  `aplicarAddons` e um sujaria o outro. Ele também não usa laço de shell de propósito: script de
  `package.json` roda por `cmd` no Windows, e um `for f in asserts/t-*.mjs` quebraria lá.
- ⚠ `src/systems/afty/asserts/t-filtro-habilidades.mjs` e `t-imitacao.mjs` NÃO são pegos pelo
  lançador, que lê só a pasta `asserts/`. Eles nem imprimem a linha de aprovação padrão. Rode-os à
  mão ao mexer nessas áreas.
- Assert novo segue o padrão dos vizinhos: `register()` com o shim de extensão no topo, depois
  `t(nome, real, esperado)` comparando `JSON.stringify`. Nenhum deles escreve no repositório (o
  `t-fontes-revisao.mjs` cria e apaga temporários fora dele). O contrato está
  em `asserts/LEIA.md`, que também traz a tabela do que cada arquivo cobre. A lista efetiva de
  arquivos vem do lançador; a linha de base do G00 preserva a contagem observada.
- Todo arquivo importa `afty-derive.js` PRIMEIRO. Começar por `afty-habilidades.js` estoura o ciclo
  de `afty-combate.js`.
- A pasta fica fora de `src/` e usa `.mjs` de propósito: nem o `vite build` nem o `eslint .` a
  enxergam (o `eslint.config.js` casa só `**/*.{js,jsx}`).

### Lint

`npm run lint` não está limpo. Na entrada do G00 em 2026-10-05 foram 748 problemas
(736 erros, 12 avisos), incluindo dependências Vite versionadas em
  .audit/lote02-vite-*/deps, componentes legados e configuração.
  Excluindo .audit/**, são 22 problemas (10 erros e 12 avisos), reproduzidos na rechecagem.
  Essa medição não altera o lint padrão nem remove arquivos versionados.
Use 748 como linha de base do comando padrão e 22 somente quando .audit/** for excluída explicitamente. A área Afty passou sem erros:

```bash
npx eslint src/systems/afty
```

### Navegador

`npm run dev` e abra `http://localhost:5173/afty` ou `/player`. A raiz é o 2.5.2.
Depois de editar arquivo pesado (`AftyCreatureBuilder.jsx`, `afty-schema.js`), um
`Cannot access 'X' before initialization` no console pode ser fantasma de HMR: mate o processo do
Vite e suba de novo antes de acreditar no erro.

⚠ **Tela sob demanda pede abrir a frio** (etapa E3 do app de celular, 2026-11-19). As telas pesadas do `App.jsx` chegam por
`telaSobDemanda` (`src/celular/sob-demanda.js`), e um import a menos na abertura muda a ordem em que os módulos do motor
são avaliados. Ao tornar uma tela sob demanda, rode `node asserts/t-app-entradas.mjs` e abra cada tela num carregamento novo
do `npm run preview`, olhando o console. Desde a E10 (2026-11-20) a lista de Encontros chega ao App por uma ponte sob
demanda (`src/celular/usar-lista-adiada.js`): nunca importe `usar-lista-encontros`, o `modelo` ou o motor no topo do `App.jsx`,
que eles voltam inteiros (1,5 MB) para a abertura de toda rota. O `t-app-entradas` reprova.

⚠ **Service worker do app (etapa E9, 2026-11-20).** Ele só existe no build de produção, na rota `/EraDeOuro` (`src/celular/sw-*.js`):
o `npm run dev` não tem worker. Teste no `npm run preview`, e depois limpe o worker e os caches do navegador de teste
(`navigator.serviceWorker.getRegistrations()` e `caches.keys()`), senão o `localhost:4173` segue servido pelo guardado. As regras de
mudança são S-87 e S-88 em `docs/normas-site.md`.

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

⚠ Bug de leiaute que depende da barra de rolagem não reproduz com `--hide-scrollbars`, que é
justamente o que vários desses scripts passam para o Chromium. Ao caçar largura, corte ou
transbordamento, tire a flag antes de concluir que o bug sumiu.

## Arquitetura

SPA em Vite mais React 18, Tailwind 4. O `localStorage` é a cópia de trabalho de tudo. O único backend é o Supabase, e é opcional: sem as variáveis
`VITE_SUPABASE_*` o site é só local. Com conta (Google ou Discord) a nuvem pessoal sincroniza fichas e chaves (`src/nuvem/nuvem-sync.js`), e a **Sala online**
(`src/nuvem/sala-*.js`, banco em `supabase/salas.sql`) liga Mestre e jogadores num Encontro. Guia da nuvem e da Sala em `docs/nuvem-supabase.md`.

### Três sistemas, um código só

| Rota | Sistema | Chaves |
|---|---|---|
| `/` | Grimório 2.5.2, o livro oficial, somente-leitura | `fm_*_v1` |
| `/Afty` | criatura do mestre | `fm_*_afty_v1` |
| `/Player` | personagem do jogador, o MESMO código com uma chave de sistema | `fm_*_player_v1` |
| `/EraDeOuro` | a Guilda: `mesa` na ficha, storage isolado (`docs/afty-status.md`). É também o app instalável Era de Ouro (manifesto e convite só aqui, `docs/app-celular.md`) | `fm_*_eradeouro_v1` |
| `/Sala/<código>` | a Sala online de um Encontro (login, senha, tela do jogador) | `sala_cache_v1:<id>` (fora da nuvem pessoal) |

A lei está em caixa alta no cabeçalho de `afty-sistema.js`: **o sistema vem da FICHA, não da rota.**
A rota decide só em que sistema uma ficha NOVA nasce, e daí em diante quem responde é
`creature.rulesVersion`. Isso não é preciosismo: os encontros são compartilhados entre as rotas, o
personagem entra ligado à ficha e a criatura como cópia, e a mesma tela renderiza fichas dos dois
sistemas ao mesmo tempo. Um contexto global preso à rota daria a resposta errada para metade da lista, e daria
calada. Por isso `deriveAfty(creature)` não recebe parâmetro de sistema.

Como o código é um só, toda mudança em `src/systems/afty/` pega os dois sistemas por padrão, sem
sintoma. **Antes de editar, pergunte ao autor se a mudança vale para a criatura e para o
personagem, ou só para um.** Quando o comportamento precisa divergir entre os dois, use
`regraDo(sistema, chave)` e registre a linha na tabela `DIVERGENCIAS` de `afty-sistema.js`, nunca
um `if` solto no meio do cálculo. O `asserts/t-sistema.mjs` falha no dia em que
a lista muda sem aviso.

As portas de fronteira entre os livros ficam no `src/App.jsx` e valem nas três rotas desde
2026-10-03: a de ENTRADA (o importador de cada rota recusa ficha de outro livro, inclusive `/Afty`
contra `/Player`, e avisa o que recusou) e a de USO (quem já entrou abre na tela do livro dela, e
as listas dos Encontros e da biblioteca de Modelos são filtradas pelo motor). As Criaturas Base,
que são o compêndio da 2.5.2, só aparecem no Grimório público. Nenhuma das portas mexeu em
`src/components/`.

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
Linhas com o mesmo `blocoExclusivo` somam entre si (a melhor de cada `origem`) e disputam como um
candidato só. Hoje só as Técnicas de Estilo da Expansão usam, para várias ligadas ao mesmo tempo.

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

Desde a E10 a primeira tela sob demanda também escolhe a porta. A Ficha G2 entra pelo `afty-habilidades` e, até a folha
`afty-posturas-catalogo.js` (2026-11-21), derrubava a Ficha e o criador no `npm run dev` com `POSTURAS_DE_COMBATE`. O
`asserts/t-app-entradas.mjs` confere a porta de cada `import()` do `src/`.

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
automático, com duas exceções, que se refazem a partir da fonte do app toda vez que a ficha entra. Os
pacotes EMBUTIDOS (`afty-addons-compostos.js`, hoje só o Guerra de Feiticeiros), em que o mesmo pacote serve
Player e criatura. E os pacotes NATIVOS de mesa (a Guilda da rota /EraDeOuro, ver
`src/systems/eradeouro/era-de-ouro.js`), que a hidratação põe em toda ficha da mesa e a aba Addons não mostra.
Campos: `permite` muda a tela, `libera` muda a regra, `substitui` remenda uma entrada do livro por campo.

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

### Encontros e Sala

Há UM Encontro só, em `src/systems/afty/encontros/` (guia em `docs/afty-encontros.md`, leia antes de mexer). Ele junta a 2.5.2 e o Afty num modelo único: o combatente
tem `motor` (`afty` ou `252`) e `tipo` (personagem, criatura, marcador), e um **adaptador por motor** (`motores/`) fala com a conta de cada livro. O personagem entra
**ligado** à ficha (a sessão é a da Ficha, pela loja `ficha/sessao-loja.js`), e a criatura entra como cópia (`ficha` mais `sessao`, ou `snapshot` mais `combatState`).
Toda mudança é uma **operação** (`operacoes.js`) com delta, pedido e Desfazer, aplicada pelo `redutor.js`. São três listas (`site` para `/` e `/Player`, `afty` e `eradeouro`),
cada uma com chave própria (`afty_encontros_site_v1`, `afty_encontros_v1`, `afty_encontros_eradeouro_v1`). O Encontro antigo da 2.5.2 (`fm_encounters_v1`) é migrado por cópia e
nunca apagado. Regra de duração (2026-11-17): no Encontro, só as durações em rodadas descem, no fim do turno de quem aplicou (`aplicadorId`).

Os Encontros de `/` e `/Player` e a Sala estão abertos a todos desde 2026-11-18 (o cadeado saiu depois da revisão final, a pedido do autor).

Desde o rework (2026-11-18) a aba tem endereço: `/Encontros` e `/Encontros/<id>`, com o prefixo da rota (`/Jogador/Encontros/<id>`). A rota
sai do PREFIXO do caminho (`rota-encontros.js`, FOLHA), e a pilha de telas do app (`usePilhaDeTelas`) grava o caminho de cada tela. O visual novo da moldura (etapas
3 a 7 do rework) só vale com a chave de aparelho `localStorage.dev_moldura_encontros = "site"` até a etapa 8, e nunca alcança a Ficha G2
embutida. Plano e estado em `docs/afty-encontros.md`, seção "Rework visual e de usabilidade".

A **Sala** (`src/nuvem/`) é um Encontro com várias contas: o Mestre abre pelo botão Abrir Sala, os jogadores entram por `/Sala/<código>` com senha. Todo corte do que cada um pode
ver é feito NO BANCO (RLS e RPCs em `supabase/salas.sql`, espelho puro em `sala-projecao.js`), nunca só na tela. Toda escrita é RPC. Nunca rode o SQL no banco: o autor cola.
Guia de banco, cliente, telas e manutenção em `docs/nuvem-supabase.md`. ⚠ Com um `.env.local` o `npm run dev` fala com o Supabase de PRODUÇÃO (o arquivo não existe hoje).

### Onde procurar uma tela

A interface do Afty está em alguns lugares, e saber qual poupa uma busca:

| Onde | O que é |
|---|---|
| `AftyCreatureBuilder.jsx` | o criador, um arquivo só, mais de 18 mil linhas. A maioria das abas de criação mora aqui dentro |
| `AftyTab*.jsx` (raiz do afty) | as abas de criação que ficaram grandes demais para o builder: Addons, Carteira, Catarse, Defesas |
| `ficha/` e `ficha/abas/` | a Ficha Final, suas abas de jogo (Ações, Buffs, Equipamentos, Habilidades, Invocações, Perícias) e os painéis `PainelDe*.jsx` |
| `ui/` | o que criador e ficha compartilham: `fontes.jsx` monta o painel de fontes do hover, mais `vital.jsx`, `TextoRico.jsx` e as bancadas |
| `src/celular/` | o app de celular (`docs/app-celular.md`): a pilha de telas no histórico (`pilha.js`, `usar-pilha-de-telas.js`, `camadas.js`), a folha de baixo (`FolhaInferior.jsx`) e a consulta única de celular (`pwa-config.js`). Painel novo que abre por toque usa `useCamadaDeVoltar` |
| `criador-celular/` (no afty) | o criador no celular (etapa E6): o cabeçalho de uma linha, a faixa de resumo, a folha das seções e a camada de CSS presa a `[data-criador]`. A origem por toque longo do criador mora em `ui/fontes-toque.js` |
| `src/systems/eradeouro/app/` | a casca da Guilda no celular (etapa E8): a barra de baixo, a lista de fichas do celular, a aba Sala e o Mais. Só `/EraDeOuro` e só no telefone (`cascaNoCelular` no `App.jsx`) |
| `encontros/telas/` | as telas do Encontro (lista, planejamento, luta do Mestre, painel da criatura 2.5.2) e `encontro-g2.css` |
| `src/nuvem/sala-ui/` | as telas da Sala (Abrir Sala, Controles, entrada, tela do jogador, painel) e `sala-ui.css` |

A Ficha G2 também é renderizada dentro do Encontro (modo embutido, props `sessao` e `onSessao`, e `naSala` na Sala), então ela tem dois donos e mede por
`@container` ou pela largura da própria coluna, não por largura de janela.

### Arquivos-chave

Na entrada do G00, a raiz de `src/systems/afty/` tem 76 módulos `.js` (75 `afty-*.js`), e o nome é o índice: `afty-<área>.js` guarda o
CATÁLOGO daquela área (as constantes em MAIÚSCULA, tipo `AFTY_ORIGENS` ou `APTIDAO_TRILHAS`) mais
as funções que leem esse catálogo. Procurar conteúdo de regra começa por aí (`afty-habilidades.js`,
`afty-aptidoes.js`, `afty-origens.js`, `afty-pericias.js`, `afty-feiticos.js`,
`afty-equipamentos.js`, `afty-invocacoes.js`, `afty-talentos.js`, `afty-alto-nivel.js`). A tabela
abaixo é só o que não segue essa regra, ou o que se lê antes de tudo.

| Arquivo | Responsabilidade |
|---|---|
| `src/App.jsx` | rotas, as portas entre os livros |
| `afty-derive.js` | o pipeline inteiro, `deriveAfty` |
| `afty-schema.js` | fábrica de ficha em branco. FOLHA, zero imports |
| `afty-efeitos.js` | canais, `efeitosDaTecnica`, pools exclusivos |
| `afty-efeitos-conteudo.js` | os efeitos de cada Habilidade, Talento e Aptidão do catálogo |
| `afty-combate.js` | `COMBATE_ESTADOS`, `resolveCombate` |
| `afty-extras-nativos.js` | estados e funcionamentos sem dono, embutidos |
| `afty-addons.js` | registro de famílias, namespace, `permite` e `libera` |
| `afty-dsl.js` | o avaliador, `normalizarVariavel`. FOLHA |
| `afty-sistema.js` | `regraDo()`, `DIVERGENCIAS`, Afty contra Player. FOLHA |
| `AftyCreatureBuilder.jsx` | o criador, mais de 18 mil linhas |
| `ficha/AftyFicha.jsx` | a Ficha Final |
| `encontros/modelo.js`, `operacoes.js`, `redutor.js`, `motores/` | o Encontro: combatente, operações, redutor e os adaptadores de motor |
| `src/nuvem/sala-cliente.js`, `sala-encontro.js`, `sala-espelho.js` | o cliente da Sala (tempo real, ligação do Mestre, espelho do jogador) |
| `supabase/salas.sql` | o banco da Sala: tabelas, RLS e RPCs |

## Documentação

- `docs/a-fazer.md`: a fila atual, incluindo as PERGUNTAS AO AUTOR paradas esperando decisão.
  **Leia as perguntas antes de "consertar" o que parecer errado.** Várias são decisão de regra do
  autor, não bug. A linha de base atual está no registro do G00.
- `docs/afty-status.md`: o log de sessões e o porquê das coisas. Afirmação datada nele não
  substitui conferir o código de hoje. ⚠ São mais de 14 mil linhas: procure com `grep`, não leia
  inteiro.
- `docs/afty-motor-referencia-estrutural.md`: corte transversal do motor, sem data. É o documento
  para colar no início de uma sessão que vai mexer em `src/systems/afty/*.js`.
- `docs/afty-encontros.md` (o Encontro unificado e as telas da Sala) e `docs/nuvem-supabase.md` (nuvem pessoal e Sala online: banco, cliente, como usar, manutenção).
- `docs/afty-addons.md` para autoria de addon, `docs/automacao-dsl.md` para a linguagem,
  `docs/afty-formulas-base.md` para as fórmulas confirmadas pelo autor, e um guia por área
  (`afty-player`, `afty-ficha-final`, `afty-carteira`, `afty-invocacoes`, `afty-equipamentos`,
  `afty-criacao-equipamentos`, `afty-cofre`).

- `docs/normas-addons.md`, `docs/normas-site.md` e `docs/normas-design.md`: as normas numeradas (A, S e D) de
  como um pacote, uma mudança no site e uma tela são pensados, feitos, verificados e entregues. Leia a da
  área antes de começar. `docs/plano-do-projeto.md` é a análise e o plano por etapas, ainda proposta.

Ao mudar o código, atualize contagem, caminho e estado de implementação nos guias. Não apresente
como pergunta em aberto uma decisão já tomada.

## Fonte do Livro de Regras (2026-10-05)

- Leia o Livro de Regras 2.5.2 em `C:/Projetos/Grimorio/F&M 2.5.2 - Livro de Regras.md`, fora do repositório. Confirme o acesso e o SHA-256 `1d0713d52c818a9ab9f47b883d9887a0d227d174d30ffcce358874669a7a733a` e registre esse hash como versão da fonte nos lotes.
- Cite a página impressa pelo último `<!-- página N -->` acima do trecho. Use o PDF do Livro somente para desempate documentado. O Grimório das Maldições continua em PDF.
- Cópias antigas do Markdown não são prova válida. A proveniência está em `C:/Projetos/Grimorio/_backup-livro/correcoes.md`. Não altere nem copie a fonte externa, nem reproduza U+2014 no repositório. O protocolo dos registros está em `docs/revisao-automacao/LEIA.md`.
