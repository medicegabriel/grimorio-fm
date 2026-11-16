# CSS Personalizado no G2: problemas achados escrevendo o tema da Ignia (2026-11-12)

Registro do que apareceu durante a escrita de `docs/tema-ignia.css` (v1 a v11), uma ficha de
CRIATURA em `/Afty` na estrutura G2. Separa o que é defeito ou lacuna do APP do que é pendência do
TEMA, e termina com dois prompts prontos, um para o Opus e um para o Sonnet.

Cada item diz como foi constatado:

- **Código:** a causa foi lida no arquivo e linha citados.
- **Tela:** foi visto em foto da bancada ou em print do autor, e a causa é a mais provável.
- **A confirmar:** foi visto, e a causa ainda não foi lida no código.

Os números de linha são de 2026-11-12. Procure pelo seletor antes de confiar neles.

## Parte A: o app (G2 e contrato de tema)

### A1. Barras que grudam viram retângulos sobre qualquer fundo que não seja chapado

**Resolvido em 2026-11-14 (Opus).** Classe de contrato `.afty-barra-grudada` e dois tokens, `--afty-fundo-grudado` (padrão `--afty-fundo`) e `--afty-peca-grudada` (padrão transparente). O tema padrão não mudou. Ver o relatório no fim.

**Código.** Quatro peças do G2 grudam ao rolar e por isso pintam o próprio fundo com
`background: var(--afty-fundo)`, opaco, na largura da coluna e não da tela:

| Peça | Onde aparece | Regra |
|---|---|---|
| `.e-ferramentas` | busca e filtros da aba Habilidades | `efeitos-g2.css:201` |
| `.x-rola > .x-cabeca` | título "Ativos" com Exaustão e Adicionar, aba Efeitos | `efeitos-g2.css:712` |
| `.g-registro-rodape` | rodapé do registro | `efeitos-g2.css:665` |
| `.g-filtro-compacta` | filtro compacto | `efeitos-g2.css:680` |

Com fundo chapado ninguém vê. Com degradê, imagem ou qualquer figura atrás, cada barra vira um
retângulo que recorta o fundo ("quadrado branco" nos prints do autor). Trocar só `--afty-fundo` não
resolve: o retângulo passa a ter a cor certa e continua recortando a figura.

O tema da Ignia contornou com classes INTERNAS, fora do contrato: faixa transparente e peças de
dentro opacas. A primeira tentativa, estender a barra de ponta a ponta com sombras laterais, foi
rejeitada pelo autor (tampava a luz) e não funciona em `.e-ferramentas`, cuja coluna corta o que
passa da borda.

**O que falta decidir:** como uma barra grudada deve se comportar sobre fundo não chapado
(transparente com peças opacas, véu, ou token próprio), e se essas peças entram no contrato.

### A2. A barra de rolagem cobre o fio de luz do cabeçalho

**Resolvido em 2026-11-14 (Opus).** O fio de 1px do tema padrão NÃO era cortado (a barra termina 1px acima dele, com e sem resultado). O corte vinha do fundo opaco da barra sobre um fio mais grosso ou com brilho. No G2 a barra ficou sem fundo próprio.

**Código.** `.afty-log` tem `z-index: 45` (`ficha.css:3056`), é opaca e mora dentro do cabeçalho.
O fio da base, `.afty-cabecalho::after`, fica por baixo dela: a linha some no trecho da barra,
de "Rolagem" até "Histórico". Fica evidente quando o tema engrossa ou anima a linha, e piora
enquanto a barra mostra um resultado, porque ela cresce. O tema contornou com `z-index: 46` no
`::after`.

**A confirmar:** se o fio de 1px do tema padrão sofre o mesmo corte (não foi fotografado).

### A3. `.afty-cabecalho` do contrato não repinta o cabeçalho do G2

**Resolvido em 2026-11-14 (Opus).** O fundo mora em `.afty-cabecalho:where(.e-ficha-g2 > header)`, uma classe de especificidade.

**Código.** `efeitos-g2.css:1113`:
`.e-ficha-g2 header.afty-cabecalho { background: linear-gradient(to bottom, transparent 6px, var(--afty-fundo) 6px); }`.
Essa regra tem duas classes e um elemento, e vence `.afty-cabecalho { background-color: ...; background-image: none }`
escrito pelo tema. A sonda leu `background-color: rgba(0,0,0,0)` e o degradê do app mesmo com a
regra do tema ativa. O prompt para a IA (regra 7 de `promptParaIA`, em `ficha/ficha-tema.js`)
promete que no G2 "um seletor de classe simples pode alterar a aparência" das superfícies
contratadas. Para o fundo do cabeçalho isso não vale: só dá para mexer trocando `--afty-fundo`.

### A4. Existem dois `.afty-cabecalho`, um dentro do outro

**Resolvido em 2026-11-14 (Opus), mantendo e documentando.** A placa ganhou `.afty-placa` sem perder `.afty-cabecalho`. MAPA_G2 e regra 15 do prompt mostram o aninhamento. Tirar o `.afty-cabecalho` da placa ficou como pergunta ao autor.

**Código.** No G2 o `header.afty-cabecalho` é a faixa que gruda, e dentro dele a placa é
`div.e-cabeca.afty-cabecalho` (o próprio `efeitos-g2.css:1223` comenta isso). Toda regra de tema em
`.afty-cabecalho` pega os dois: fundo, borda e o `::after` saem em dobro. O contrato
(`CONTRATO_DE_CLASSES`) descreve a classe como "a faixa fixa do topo" e o `MAPA_G2` não mostra o
aninhamento. O tema separa com `.afty-cabecalho .afty-cabecalho`, inclusive na impressão.

### A5. Trocar a fonte das abas derruba a barra de rolagem para a linha de baixo

**Resolvido em 2026-11-14 (Opus), em parte.** A barra encolhe de 600 até 560px antes de descer: o orçamento subiu de cerca de 630 para cerca de 670px. Abas que rolam na horizontal não entraram (a revisão de 2026-11-10 recusou a aba Efeitos sumindo de vista).

**Código.** `efeitos-g2.css:1331` a `1333`: `.e-linha-abas` é flex com quebra, `.afty-log` tem
`flex: 0 1 600px` e `min-width: min(100%, 560px)`. Numa coluna de 1244px sobram cerca de 630px para
as seis abas. O padrão ocupa 581px. Um tema que troque a fonte de título por uma mais larga, ou
ponha espaçamento entre letras, passa disso e a barra cai, sem aviso nenhum. Com Cinzel em 16.5px
as abas iam a uns 770px.

O contrato convida a mexer em `.afty-aba` e não diz que a largura é orçamento. O autor só percebeu
olhando a ficha. O tema ficou com folga de 8px, e um contador grande em "Efeitos" pode estourar de
novo.

**O que falta decidir:** se as abas devem encolher ou rolar antes de a barra quebrar (o `.e-abas`
já tem `overflow-x: auto`, mas a quebra do flex acontece antes), ou se basta avisar no prompt.

### A6. A barra do título fica quadrada dentro do cartão redondo, em Habilidades

**Não reproduz (2026-11-14, Opus).** Os cartões de Habilidades têm `overflow: hidden` e cortam no raio, com e sem o contorno do tema. O `clip` lido pela sonda era do cartão de Dano da aba Ações.

**Tela, a confirmar.** Nos cartões de Habilidades ("Origem", "Habilidades de Especialização",
"Aptidões Amaldiçoadas") a barra `.e-grupo-topo`, que tem fundo próprio, aparecia com canto reto
dentro do cartão arredondado. `.e-g2 .e-grupo` declara `overflow: hidden` (`efeitos-g2.css:237`),
mas a sonda leu `overflow: clip` nesses cartões, então alguma regra da aba troca o corte. Ver a
memória `sticky-em-grupo-overflow`. O tema contornou arredondando o primeiro filho de todo
`.afty-card`.

**A confirmar:** se acontece no tema padrão (raio de 12px) ou só com raio maior (a Ignia usa 14px).

### A7. A Guarda encosta na placa

**CORRIGIDO em 2026-11-14 (Opus), a pedido do autor depois das fotos.** `.afty-guarda:where(.e-ficha-g2 *)` em `efeitos-g2.css`: vão de 8px, canto `calc(var(--afty-raio, 12px) * 10 / 12)` e `position: relative` acima da sombra da placa. Só o G2. Antes, no tema padrão a Guarda fica a 0px da placa (1440 e 390), com raio 8px contra 18px (14px no celular) e a sombra da placa caindo sobre ela. Proposta: `design.local/proposta-a7.css`.

**Tela.** Em criatura Calamidade ou Beyond, `.afty-guarda` vem logo abaixo da placa, com canto
pequeno (`--afty-raio-peq`) contra o canto grande da placa, sem respiro. Com qualquer sombra na
placa, a sombra cai sobre a tira. O autor: "a combinação do Header com a Guarda definitivamente
ficou ruim". O tema a transformou numa flâmula pendurada (margem lateral, sem borda de cima).

**A confirmar:** quanto disso existe no tema padrão e quanto foi a sombra do tema.

### A8. O contrato descreve a ficha clássica em três pontos onde o G2 é diferente

**Tela e código.**

- `.afty-linha`: no G2 é uma faixa da lista, de borda a borda do cartão, colada na barra do título.
  Borda e canto arredondado nela abrem um vão entre o título e a primeira linha. O prompt manda
  estilizar `.afty-linha`, e o tema de exemplo `docs/tema-abe-no-seimei.css` (da clássica) faz
  exatamente isso.
- `.afty-stat`: no G2 é texto solto na faixa do cabeçalho, sem caixa. Fundo nela vira remendo.
  O contrato diz "cada célula de defesa".
- `.afty-campo`: na busca de Habilidades do G2 o `input` tem fundo próprio (7% do texto). A regra
  antiga "o campo nunca ganha fundo" vale para a clássica.

### A9. Camadas da raiz que um tema pode usar, e ninguém conta

**Código.** `.afty-ficha::before` é a camada fixa do brilho (`ficha.css:119`, `z-index: 0`) e todo
filho direto da raiz tem `z-index: 1` (`ficha.css:227`). Um tema pode redesenhar o `::before` e usar
o `::after` como segunda camada fixa, atrás ou na frente do conteúdo. Nada disso está no prompt, e
a regra 5 ("não ponha transform nem filter na raiz") faz parecer proibido, quando o pseudo-elemento
não prende o painel de fontes.

### A10. O prompt não diz nada sobre movimento

**Tela.** O tema nasceu com tudo animado e acelerando com a Vida baixa. O autor relatou vista
cansada em minutos e tontura com a borda do cabeçalho trocando de cor em 1,1s. O que resolveu:
nenhuma cor corre em menos de 12s, nenhum pulso bate em menos de 2,5s, a Vida baixa cresce em
tamanho e brilho e quase não acelera, nada de linha fina de alto contraste girando, e
`prefers-reduced-motion` desliga tudo. O `promptParaIA` não tem uma linha sobre isso.

### A11. Texto solto sobre o fundo na aba Efeitos

**Tela.** "Nenhum Efeito Ativo" e "Histórico da Sessão" ficam direto sobre o fundo da página, fora
de cartão. Com figura atrás, são o ponto de leitura mais frágil da ficha.

## Parte B: o tema da Ignia (`docs/tema-ignia.css`, v11)

Pendências do tema, nenhuma bloqueia o uso:

1. **Desempenho não medido.** Duas camadas fixas (a glória com máscara, as fagulhas com
   `mix-blend-mode: multiply` por cima de tudo). Medir em build de produção, nunca no dev.
2. **Painel de fontes no hover não confirmado.** O roteiro não conseguiu abrir o painel no G2.
3. **Contraste só medido com Vida cheia.** Nos níveis baixo e crítico o papel muda de cor.
4. **Celular não revisto desde a v6.** Glória, cores por nível, barras e abas mudaram depois.
5. **Abas com 8px de folga** (ver A5).
6. **Três regras em classes internas** (`.e-ferramentas`, `.x-cabeca`, `.g-registro-rodape`), ver A1.
7. **"Ativos" com lista cheia:** com a faixa transparente, o título flutua sobre os cartões ao rolar.
8. **Abas não revistas:** Equipamentos e Invocações só foram fotografadas.
9. **Avisos do verificador de design:** degradê no nome (intencional) e Cormorant Garamond fora do
   `DESIGN.md` (intencional, fonte da lista do painel). Nenhuma exceção foi gravada.

## Parte C: a bancada (`design.local/`, fora do git)

1. **`auditar-tema.mjs`, regra 5c, falso positivo.** Acusa `transform`, `scale` ou `filter` em
   `:scope#afty-ficha::before` e `::after` como se fossem na raiz.
2. **Playwright sem Chromium.** O pacote instalado pede um Chromium que não está baixado. Os
   roteiros novos usam `chromium.launch({ channel: "chrome" })`. Os antigos (`caes.mjs`,
   `seimei.mjs`) quebram até alguém trocar.
3. **`combatState.hpCurrent` da ficha semeada não baixa a Vida da Ficha.** Para testar Vida baixa
   é preciso clicar na Vida e usar o botão Dano. `ignia.mjs --dano=N` faz isso.
4. **Roteiros que ficaram:** `ignia.mjs` (fotos, contraste, impressão, celular, e o aviso "abas e
   rolagem: na mesma linha") e `ignia-sonda.mjs` (aplica dano, rola um dado e lista quem pinta
   fundo opaco).

## Prompt para o Opus: corrigir o G2 para aceitar tema de verdade

Use para a Parte A. É trabalho de decisão de desenho e de CSS com especificidade delicada.

```text
Você vai corrigir defeitos do G2 da Ficha Final que quebram o CSS Personalizado. O repositório é
C:\Projetos\Grimorio\grimorio-tracker. Antes de qualquer edição leia AGENTS.md, CLAUDE.md,
docs/normas-design.md (normas D-100 a D-103 sobre tema) e a Parte A de docs/tema-g2-problemas.md,
que lista cada problema com arquivo e linha.

Contexto: a Ficha Final é pintada por variáveis --afty-* e aceita CSS do usuário, injetado em
@scope (#afty-ficha). O contrato de classes e o prompt que ensina uma IA a escrever tema moram em
src/systems/afty/ficha/ficha-tema.js (CONTRATO_DE_CLASSES, SUPERFICIES_G2, MAPA_G2, promptParaIA).
O CSS do G2 mora em src/systems/afty/ficha/efeitos/efeitos-g2.css e o da ficha em
src/systems/afty/ficha/ficha.css. O tema que revelou os defeitos é docs/tema-ignia.css.

Regras do repositório que valem aqui:
- A Ficha é a mesma para criatura (/Afty) e personagem (/Player). ANTES de editar, pergunte ao
  autor se cada mudança vale para os dois e se vale também para a ficha clássica.
- Nunca use o travessão U+2014. Não faça commit nem push. Não toque em src/components/.
- Mudar o nome de uma classe afty-* ou de um token quebra tema de quem já fez: só com aviso.
- Rode `npm run asserts` antes de começar e depois de terminar, e `npx eslint src/systems/afty`.

Resolva nesta ordem, um problema por vez, mostrando ao autor a proposta antes de aplicar as que
mudam desenho:

A1. Barras grudadas (.e-ferramentas, .x-rola > .x-cabeca, .g-registro-rodape, .g-filtro-compacta)
    pintam var(--afty-fundo) opaco na largura da coluna e viram retângulos sobre fundo não chapado.
    Proponha um comportamento que funcione com degradê, imagem e figura atrás, sem deixar o
    conteúdo rolado ilegível por baixo. O autor já rejeitou estender a barra de ponta a ponta. O
    que ele aprovou no tema foi faixa transparente com as peças de dentro opacas. Decida se entra
    um token (por exemplo o fundo da barra grudada) e se essas peças ganham classe de contrato.
A2. .afty-log tem z-index 45 e cobre .afty-cabecalho::after. Confira primeiro se o fio de 1px do
    tema padrão também é cortado, e corrija a ordem das camadas.
A3. `.e-ficha-g2 header.afty-cabecalho { background: ... }` (efeitos-g2.css:1113) vence a classe do
    contrato. Deixe o fundo do cabeçalho repintável por `.afty-cabecalho`, do jeito que as outras
    superfícies contratadas do G2 já são (regra em :where ou token), sem mudar o visual padrão.
A4. Há um .afty-cabecalho dentro do outro. Decida com o autor: dar à placa interna uma classe de
    contrato própria e tirar dela o .afty-cabecalho, ou manter e documentar. Lembre que temas
    existentes miram .afty-cabecalho.
A5. Fonte mais larga nas abas derruba .afty-log para a linha de baixo. Avalie fazer as abas
    encolherem ou rolarem antes de a linha quebrar, e mostre o antes e o depois em 1440, 1280 e
    1024 de largura.
A6. Barra de título quadrada nos cartões de Habilidades. Ache qual regra troca o overflow do
    cartão para clip (ver a memória sticky-em-grupo-overflow) e confira se acontece no tema padrão.
A7. Guarda colada na placa. Confira no tema padrão, numa criatura Calamidade, e proponha o ajuste.

Para cada correção: reproduza antes (a bancada design.local/ignia-sonda.mjs lista quem pinta fundo
opaco, e design.local/ignia.mjs fotografa as abas e avisa se a rolagem caiu de linha), aplique,
fotografe depois em desktop e em 390 px, e confira os cinco temas de preset mais docs/tema-ignia.css
e docs/tema-hora-azul.css. Depois de cada correção que torne desnecessário um contorno do tema da
Ignia, avise qual regra do tema pode sair, mas não edite o tema sem o autor pedir.

Ao terminar, atualize docs/tema-g2-problemas.md marcando o que foi resolvido, registre em
docs/afty-status.md o que mudou e por quê, e atualize a seção de tema de docs/afty-ficha-final.md.
Diga com clareza o que foi verificado em tela e o que não foi.
```

## Prompt para o Sonnet: documentação do contrato, bancada e conferência do tema

Use para A8 a A11 e para as Partes B e C. É trabalho de texto, de roteiro e de medição, sem decisão
de desenho.

```text
Você vai fechar pendências de documentação e de conferência do CSS Personalizado da Ficha Final. O
repositório é C:\Projetos\Grimorio\grimorio-tracker. Antes de qualquer edição leia AGENTS.md,
CLAUDE.md e docs/tema-g2-problemas.md inteiro. Você cuida dos itens A8, A9, A10 e A11 e das Partes
B e C. NÃO mexa nos itens A1 a A7: eles mudam o desenho do G2 e são de outra sessão.

Regras que valem aqui:
- Nunca use o travessão U+2014 nem o caractere de aviso U+26A0 em texto de tela ou string.
- Não faça commit nem push. Não toque em src/components/.
- src/systems/afty/ficha/ficha-tema.js serve criatura e personagem ao mesmo tempo. Antes de editar,
  pergunte ao autor se o texto novo vale para os dois sistemas.
- Não renomeie classe nem token. Você só acrescenta texto de contrato e regras ao prompt.
- Rode `npm run asserts` antes e depois, e `npx eslint src/systems/afty`.

Tarefa 1, o contrato e o prompt (ficha-tema.js). Só no texto da estrutura G2:
- A8: diga que no G2 `.afty-linha` é uma faixa de borda a borda colada na barra do título (borda e
  canto nela abrem um vão), que `.afty-stat` é texto sem caixa, e que o campo de busca tem fundo
  próprio. Ajuste o MAPA_G2 se ele ajudar a mostrar isso.
- A9: explique que a raiz tem uma camada fixa em ::before (o brilho) com os filhos em z-index 1, que
  o tema pode redesenhar o ::before e usar o ::after como segunda camada fixa, e que transform e
  filter são proibidos na RAIZ, não nos pseudo-elementos dela.
- A10: acrescente uma regra de movimento: animação só de transform e opacity em camada própria,
  nenhuma cor correndo em menos de 12 segundos, nenhum pulso em menos de 2,5 segundos, não
  multiplicar velocidade por estado (Vida baixa cresce em tamanho e brilho), nada de linha fina de
  alto contraste girando, e um bloco prefers-reduced-motion que desliga tudo.
- A5 e A1, só o AVISO (a correção é da outra sessão): a largura das seis abas é orçamento de cerca
  de 630px e passar disso derruba a barra de rolagem, e fundo que não seja chapado faz as barras
  grudadas aparecerem como retângulos.
Mostre ao autor o texto novo do prompt antes de gravar.

Tarefa 2, a bancada (design.local/, fora do git):
- Corrija a regra 5c de auditar-tema.mjs para não acusar transform, scale ou filter quando o
  seletor é um pseudo-elemento da raiz. Confira contra docs/tema-ignia.css (deve passar) e escreva
  um caso que ainda deve falhar (filter direto em :scope#afty-ficha).
- Troque `chromium.launch()` por `chromium.launch({ channel: "chrome" })` nos roteiros antigos
  (caes.mjs, seimei.mjs e os que mais usarem), sem baixar navegador nenhum.

Tarefa 3, conferir o tema docs/tema-ignia.css (não altere o tema, só relate):
- Desempenho: `npm run build -- --outDir <pasta isolada>` e `npm run preview` apontando para ela
  (nunca medir no dev, e nunca reescrever o dist do projeto). Compare a rolagem de uma ficha longa
  com o tema ligado, com `--ig-fagulhas: 0`, com `--ig-sol: 0` e sem tema. Relate os números.
- Painel de fontes: abra o painel que explica um número (hover numa defesa, toque longo no celular)
  e confirme que ele abre colado ao número com o tema ligado.
- Contraste com Vida baixa e crítica: `node design.local/ignia.mjs x --dano=100 --medir` e
  `--dano=150 --medir`. O medidor não enxerga a camada da glória: confira também no pixel os textos
  que ficam sobre ela, em especial "Nenhum Efeito Ativo" e "Histórico da Sessão" (item A11).
- Celular: 390 de largura, Vida cheia e crítica, as seis abas, com e sem Guarda
  (`--patamar=calamidade`).
- Abas e rolagem: adicione efeitos ativos até o contador de "Efeitos" ter dois dígitos e veja se a
  bancada ainda imprime "na mesma linha".
- "Ativos" com lista cheia: role a aba Efeitos com vários efeitos ativos e fotografe o título
  flutuando sobre os cartões.
- Fotografe e reveja Equipamentos e Invocações.

Entregue um relatório curto no fim de docs/tema-g2-problemas.md, numa seção datada: o que passou, o
que falhou com a foto ou o número, e o que você não conseguiu verificar. Não diga que algo está
certo sem ter visto. Registre em docs/afty-status.md o que mudou no contrato e na bancada.
```

## Relatório da sessão de 2026-11-14 (Sonnet): A5, A8 a A11, Partes B e C

Verificado em tela com o Chrome do sistema contra o dev server (exceto o desempenho, que foi no build de produção isolado). O tema `docs/tema-ignia.css` não foi alterado.

### Gravado no contrato (`ficha-tema.js`, só estrutura G2, vale para `/Afty` e `/Player` por autorização do autor)

- `MAPA_G2`: `.afty-linha` como faixa de borda a borda, `.afty-stat` sem caixa, busca com fundo próprio, `::before` da raiz e filhos em z-index 1 (A8 e A9).
- Regra 5: `transform`, `filter` e afins continuam proibidos na raiz, o `::before` e o `::after` dela ficam liberados (A9). Ressalva da faixa `.afty-linha` no aviso do corpo (A8).
- Regras 12, 13 e 14, só no G2: movimento (A10), orçamento de largura das abas (aviso de A5) e barras grudadas sobre fundo não chapado (aviso de A1). O aviso do prompt não corrige A1 nem A5.
- Conferido: o prompt G2 traz as regras 12 a 14 e a frase do `::after`, o da clássica não traz nada disso. `t-sistema`, `t-audita-css`, `t-fontes-web`, `t-guarda` e `t-invocacoes-mesa` passam. Eslint sem erro no arquivo.
- A11 não ganhou texto no contrato: é uma lista de leitura frágil, vale o resultado da medição abaixo.

### Bancada (`design.local/`, fora do git)

- `auditar-tema.mjs`, regra 5c: só acusa a raiz nua. O `tema-ignia.css` passa as 9 regras. Falham, como devem: `filter` em `:scope#afty-ficha` e a raiz numa lista com vírgula ao lado de outro seletor. Passa: `transform` e `filter` em `::before` e `::after`.
- `chromium.launch()` trocado por `chromium.launch({ channel: "chrome" })` em 14 roteiros antigos. Nenhum deles foi rodado depois da troca.
- Novos: `ignia-pixel.mjs` (contraste no pixel dos textos soltos), `ignia-efeitos.mjs` (rascunho que só abre o Adicionar), `ignia-perf.mjs` (rolagem em quadros, `--cond` e `--cpu`). `ignia.mjs` ganhou `--fontes-alvo=<seletor>`.

### Parte B, conferência do tema

- **Contraste com Vida baixa e crítica (B3), medidor de `ignia.mjs`:** passou. 0 reprovam com Vida cheia, baixa (dano 100) e crítica (dano 150). O pior valor foi 4,59 no número de Vida crítico.
- **Texto sobre a glória no pixel (A11), uma captura por caso, só o rosto do texto, sem as letras:**

| Caso | Nenhum Efeito Ativo | Histórico da Sessão | Ativos |
|---|---|---|---|
| 1440, Vida cheia | 5,23 | 8,54 | 14,84 |
| 1440, crítica | 4,68 | 7,09 | 12,29 |
| 1920, cheia | 5,23 | 8,54 | 14,71 |
| 390, cheia | 4,97 | 7,48 | 14,48 |
| 390, crítica | **3,79, falha (mín. 4,5)** | 5,69 | 10,79 |

Falha real: "Nenhum Efeito Ativo" no celular com Vida crítica. A glória e as fagulhas se mexem, então outro quadro pode dar outro número.
- **Painel de fontes (B2):** abre colado ao número com o tema ligado, só em desktop. Em `.afty-rolavel` (Acerto +9) o painel aparece logo abaixo e alinhado à direita (foto `shots/f-fontes.png`). Em `.afty-stat`, `.afty-vital-numero` e `.afty-stat-valor` ele não abre, nem sem tema: é o roteiro antigo mirando o alvo errado, não o tema. O toque longo no celular NÃO foi testado.
- **Desempenho (B1), build de produção isolado, rolagem da aba Invocações, 77 quadros:** sem diferença nenhuma entre tema, `--ig-fagulhas: 0`, `--ig-sol: 0` e sem tema: 16,7 ms por quadro, p95 16,8 a 16,9, 0 quadros acima de 20 ms, também com a CPU 6x mais lenta e em duas rodadas. É um teste fraco: Chrome headless preso a 60 fps, página de só 541 px de rolagem, GPU rápida. Prova que não há queda grosseira, não prova que o tema é barato em máquina fraca.
- **Abas e rolagem (B5):** a bancada imprime "na mesma linha" com 622 px de abas em 1440 de largura. Com o contador de "Efeitos" com dois dígitos: NÃO verificado (ver abaixo).
- **Equipamentos e Invocações (B8):** fotografadas em 1440 e olhadas (`shots/desk-abas-4.png` e `-5.png`), sem defeito visível. Só Vida cheia, nenhuma conferência de contraste nelas.
- **Celular 390 (B4):** fotografado com Vida cheia e crítica nas seis abas e com `--patamar=calamidade` na primeira. As fotos existem em `design.local/shots/cel-cheia-*`, `cel-crit-*` e `cel-cal-1.png`. Eu NÃO as abri uma a uma, só medi o contraste da aba Efeitos. Em 390 a bancada diz "ROLAGEM CAIU PARA BAIXO", o que é o comportamento esperado quando a coluna é estreita.

### Não verificado

- **Lista cheia de "Ativos" (B7) e contador de dois dígitos em "Efeitos" (B5):** a ficha semeada só oferece 8 opções no Adicionar e a Fonte Externa pede formulário por efeito. Não consegui ativar 10 efeitos. O `ignia-efeitos.mjs` tem só a abertura do Adicionar.
- Toque longo no celular, painel de fontes em celular.
- Fotos de celular e "Ativos" flutuando sobre cartões: não revistos.
- Linha de base dos asserts, antes das minhas mudanças: 2 de 324 falham (`t-reconciliacao-g00.mjs`, `t-revisao-g00.mjs`), causa não investigada. Depois: a suíte inteira dá o mesmo resultado, 2 de 324 falhando, os mesmos dois. Eslint em `src/systems/afty` sem erro e `git status` em `src/components` limpo.
- O 404 de recurso no console do build aparece também sem tema, então não é do tema. Qual arquivo faltou não foi identificado.

## Relatório da sessão de 2026-11-14 (segunda rodada, Sonnet): fechamento das conferências pendentes

Verificado em tela com o Chrome do sistema contra o dev server (o 404 foi no build de produção isolado, apagado no fim). Nada foi alterado no tema nem no app, e os itens A1 a A7 ficaram intocados. Fotos em `design.local/shots/`.

### Passou

- **Lista cheia em "Ativos" e contador de dois dígitos (B5 e B7).** `ignia-efeitos.mjs` agora semeia N buffs de mesa direto na sessão (`fm_ficha_sessao_afty_v1:IGNIA-DESIGN`), com `--n=`. Com 12 e com 30 efeitos o contador da aba mostra "Efeitos 12" e "Efeitos 30" e a bancada imprime "abas 629px, na mesma linha" em 1440 (foi 622px com contador de um dígito, ver o relatório anterior). Os 8px de folga de A5 aguentaram o contador de dois dígitos.
- **Toque longo no celular (B2).** Com toque emulado em 390 (`hover: hover` falso, `pointer: coarse` verdadeiro) e 450 ms de toque, o painel abre em `.afty-rolavel` (Acerto +9): painel em x 97 a 186, y 536 a 636, alvo em x 162 a 186, y 639. Ou seja, colado ao número, 3px acima dele, alinhado à direita, com as parcelas Força +1, Nível ÷ 1,5 +8 e Total +9. Foto `shots/toque-aftyrolavel.png`. `.afty-stat` e `.afty-vital-numero` não abrem, como no desktop, e é o alvo errado do roteiro (novo: `ignia-toque.mjs`).
- **Celular 390, Vida cheia, crítica e Calamidade, seis abas (B4)** (`shots/m-cheia-*`, `m-crit-*`, `m-cal-*`, refeitas hoje). A glória aparece como feixe ao pé da tela, mais forte e alaranjada na crítica. A Vida crítica ganha borda e número alaranjados. Barras e títulos de cartão legíveis. As abas rolam na horizontal (Equipamentos fica cortado, esperado), a rolagem cai para a linha de baixo (esperado em 390).
- **Chrome do sistema nos roteiros antigos (item 4).** `seimei.mjs` e `caes.mjs` abrem o Chrome e tiram todas as fotos. Ambos terminam com "nao achei a aba buffs": o roteiro procura uma aba chamada buffs que não existe mais na barra (as abas são Ações, Habilidades, Perícias, Equipamentos, Invocações, Efeitos). É defeito do roteiro, não da troca de navegador.
- **404 do console (item 4).** É `/_vercel/insights/script.js`, o script do Vercel Analytics, que só existe na hospedagem da Vercel. Aparece em `/`, `/Afty` e `/Player`, com e sem tema, e não é bug do app. Roteiro: `ignia-404.mjs`.
- **Os dois asserts que falham (item 4).** Não são do tema. Ambos reprovam o inventário de controle do G00 por três módulos novos sem classificação: `afty-orbitas.js` ("Módulo novo sem proprietário de controle"), `ficha/efeitos/catalogo-logica.js` e `ficha/useFontesWeb.js` ("Módulo de subpasta sem classificação"). Para fechar, classificar esses três no inventário do G00.

### Falhou

- **Contraste de "Nenhum Efeito Ativo" no celular com Vida crítica (3).** Três execuções seguidas de `ignia-pixel.mjs --largura=390 --altura=844 --dano=150` deram o mesmo 3,79 (a quarta, com a leitura de fundos acrescentada, deu 3,76). Mínimo 4,5. Cor do texto: rgb(135, 84, 92). Origem: `.e-g2 .x-mesa` usa `--e-t3`, que é 80% de `--afty-texto-suave` (#6a3541 no tema) misturado com 20% de `--afty-fundo`, e na Vida crítica o tema troca `--afty-fundo` para #ffddd3, o que clareia o texto. Fundo atrás das letras: de rgb(251, 189, 174) a rgb(255, 221, 211), com a glória pondo mancha dourada de até rgb(253, 185, 143). Tem solução no tema, sem tocar no app: escurecer `--afty-texto-suave` só no bloco da Vida crítica (a conta com o pior fundo dá 4,32 com #5a2834, 4,87 com #501e2d e 5,29 com #461926). O cuidado é que `--afty-texto-suave` colore outras coisas (rótulos, linha 552 em diante do tema), então o ajuste muda todas. Alternativa no app: `--e-t3` deixar de misturar com o fundo. A decisão é do autor.
- **Defeito visível: a Guarda em Calamidade no celular.** Em `shots/m-cal-1.png` a tira "Guarda +0, 0/60 Quebrada, Golpe, Raio Negro" fica parcialmente escondida atrás da placa do cabeçalho e desbotada, com os chips cortados. É o caso A7 (Guarda colada na placa), agora visto em 390. Não corrigi, é do Opus.
- **"Ativos" não flutua sobre os cartões: some.** Com a lista rolada, o título "Ativos" (sticky, top 0, 54px de altura) fica em y 0 a 54, e a placa do cabeçalho (y 0 a 185) está por cima: `elementFromPoint` no meio do título devolve `afty-retrato`. Nenhuma faixa transparente com título aparece sobre os cartões, o título simplesmente desaparece atrás do cabeçalho grudado. É igual sem tema (`--sem-tema`: título y 0 a 54, cabeçalho y 0 a 184). Fotos: `shots/ef30-rolado-700.png` (700 de altura, 30 efeitos, a lista rola dentro de `.x-rola.g2-ativos`) e `ef12-rolado-700.png` (12 efeitos). Com 12 efeitos a página só rola 185px. O que o autor deve decidir: o `top` do sticky do título ignora a altura do cabeçalho grudado, então o sticky é inócuo na prática. É assunto do app (família de A1), não do tema.
- Nas fotos de celular, uma aba vizinha da ativa aparece alaranjada (Habilidades em `m-cal-1`, Invocações em `m-crit-4`). Provável hover do ponteiro do Playwright depois do clique, não confirmado.

### Não foi possível verificar

- Desempenho do tema em aparelho de verdade (o teste anterior continua o único, com limites já descritos).
- Se o título "Ativos" some também no tema padrão do app com a ficha clássica, ou só no G2. Só vi o G2.
- A orientação horizontal do celular e telas de 360 de largura.
- Nada em Safari ou em celular físico: o toque foi emulado pelo Chrome.

### Bancada (`design.local/`, fora do git)

`ignia-efeitos.mjs` (agora com `--n=`, `--dano=`, rola e fotografa o título), `ignia-toque.mjs` (toque longo), `ignia-404.mjs` (lista recursos que falham no preview) e `ignia-pixel.mjs` (agora imprime também o fundo mais escuro e o mais claro sob o texto).

## Relatório da sessão de 2026-11-14 (Opus): A1 a A7

O autor estava fora e pediu para não parar com perguntas. Apliquei só o que não muda o desenho do
tema padrão (mecanismo, tokens, classes somadas) e deixei como proposta o que muda (A7). As
perguntas estão no fim. O tema `docs/tema-ignia.css` não foi alterado.

### O que mudou no app

- `efeitos-g2.css`: A3 (fundo do header em `.afty-cabecalho:where(.e-ficha-g2 > header)`), A2
  (`.afty-log:where(.e-ficha-g2 *) { background: transparent }`), A1 (bloco "AS BARRAS QUE GRUDAM", com o fundo em `.afty-barra-grudada:where(.e-g2 *)`,
  com `--afty-fundo-grudado` e `--afty-peca-grudada`), A5 (`.afty-log` com `flex: 1 1 560px;
  max-width: 600px` na linha das abas).
- JSX: `afty-barra-grudada` em `HabilidadesG2.jsx`, `VisaoG2.jsx`, `BuffDeMesaG2.jsx` e `Gestor.jsx`.
  `afty-placa` na placa, em `CabecalhoG2.jsx`.
- `ficha-tema.js`: `.afty-placa` e `.afty-barra-grudada` em `SUPERFICIES_G2`, `MAPA_G2` com o
  aninhamento, regras 13 e 14 revistas e regra 15 nova. Só o prompt do G2 mudou: o da clássica não
  cita nenhuma das duas classes (conferido gerando os dois prompts).
- Nada renomeado nem retirado. `.g-filtro-compacta` é CSS sem uso no JSX e ficou como estava.

### Verificado em tela (Chrome do sistema contra o dev, `design.local/g2-tema.mjs`)

- **Antes e depois, pixel a pixel** (`g2-lote.sh` e `g2-compara.mjs`): os cinco presets, a Ignia, a
  Hora Azul e uma camada listrada com Calamidade, em 1440 e 390, nas seis abas (112 pares).
  - Padrão, Sangue, Abissal e Terminal em 1440: abas Ações e Habilidades idênticas. Nas outras, de 2
    a 63 pixels de antialiasing (canto do botão Exaustão, sublinhado da aba), sem mudança de cor.
  - Em 390, em todos os presets, de 790 a 1030 pixels mudam no texto da barra de rolagem (Rolagem,
    DES, NOR, VAN, Histórico): o texto passou de antialiasing colorido para tons de cinza porque a
    barra deixou de ter fundo próprio. A cor do texto e a do fundo são as mesmas.
  - Pergaminho em 1440: a barra de rolagem era um retângulo claro que cortava a sombra da placa
    (`cmp-pergaminho-log.png`, em cima). Agora a sombra corre inteira. É defeito do preset que sumiu.
  - Hora Azul: a faixa do topo agora mostra o degradê roxo que o tema já escrevia em
    `.afty-cabecalho` e o G2 ignorava (`cmp-hora-azul.png`). É o A3 funcionando, e muda a cara desse
    tema no G2.
  - Ignia: só antialiasing de texto no cabeçalho e as fagulhas, que se mexem (`cmp-ignia.png`).
- **A3 e A4** (`design.local/teste-a3.css`): `.afty-cabecalho { background-color; background-image:
  none }` repinta a faixa e `.afty-placa { background }` repinta só a placa, em 1440 e 390.
- **A2**: um fio de 3px com brilho passa inteiro por baixo da barra com um resultado de rolagem
  mostrado, em 1440 e 390 (`teste-a3-fio.png`, `teste-a3-390.png`). O fio de 1px do tema padrão não
  era cortado: a barra termina em 182 (209 com resultado) e o fio ocupa 183 a 184 (209 a 210).
- **A1** (`design.local/teste-a1.css` sobre listras): em Habilidades a faixa da busca sumiu e o campo
  e o filtro ficaram opacos. Em Efeitos, Exaustão e Adicionar ficaram opacos e o título solto. Sem
  os tokens, a mesma camada listrada mostrava o retângulo preto (`antes-listras-cal-1440-a1.png`).
  - Lista rolada por baixo (Habilidades a 520 de altura, `a1-rola-hab-rolado.png`): as peças ficam
    legíveis, e pedaços da lista (o título "Origem", "Bônus em Atributo") aparecem cortados nos vãos
    entre o campo e o filtro. Com o véu de 85% (`teste-a1-veu.css`, `a1-veu-hab-rolado.png`) a lista
    some sob a faixa e as listras ainda passam, fracas.
  - `.afty-barra-grudada { background: ... }` sozinho repinta a faixa em Habilidades e em Efeitos
    (`teste-a1-classe.css`). A primeira versão usava `:is()` e tinha duas classes de especificidade,
    o que fazia a classe do tema perder. Corrigido e conferido de novo contra o padrão (idêntico).
  - Hover de Adicionar e de Exaustão com o token ligado: a base continua opaca e o tom troca do
    realce para o hover, como no padrão (lido no estilo computado, sem foto).
- **A5** (`design.local/a5-largo*.css`, abas de 634px): com a regra antiga a barra caía em 1440 e
  1280 e agora fica na mesma linha (596px). Em 1024 a coluna tem 992px e a barra desce nos dois
  casos, inclusive no tema padrão, como já descia antes (fotos `a5-largo-antes-*` e `a5-largo-*`).
- **A6**: Habilidades com a Ignia sem a regra de contorno, ampliado: cantos redondos.
- **A7**: medido no tema padrão em Calamidade. A proposta fotografada em 1440 e 390.
- Suíte: 1 de 324 falha antes e depois, o mesmo `t-reconciliacao-g00.mjs` (a linha de base do
  prompt dizia 2, o `t-revisao-g00` passou a passar antes desta sessão). Eslint de
  `src/systems/afty` sem erro. Build de produção isolado passa, e no CSS gerado as regras novas de
  uma classe vêm depois das do `ficha.css`. `src/components/` intocado e nenhum U+2014 no diff.

### Não verificado

- O histórico de rolagens ABERTO por cima do fio grosso, e o cabeçalho recolhido do celular depois
  de rolar a página. A geometria diz que o histórico nasce 6px abaixo da barra, mas não fotografei.
- "Ativos" com lista cheia rolando por baixo da faixa transparente (só Habilidades foi rolada).
- Os dois rodapés de registro (`.g-registro-rodape`): só pelo código, nenhuma foto.
- Foco do campo de busca com `--afty-peca-grudada` ligado: só pelo cálculo de especificidade.
- A ficha clássica, o Encontro e o `/Player` em tela. As regras novas estão todas presas a
  `.e-ficha-g2` ou `.e-g2`, e a ficha do `/Player` usa o mesmo componente.

### Regras do tema da Ignia que podem sair (sem editar o tema)

- As três regras de "AS BARRAS QUE GRUDAM" (`:is(.e-ferramentas, .x-cabeca, .g-registro-rodape)`,
  o campo e o filtro, e o `.afty-botao` das barras): trocar por `--afty-fundo-grudado: transparent`
  e `--afty-peca-grudada: var(--afty-card)` no bloco da raiz. Hoje elas também nem alcançavam os
  botões, que são `.m-botao` e `.g-botao`, não `.afty-botao`.
- `.afty-cabecalho::after { z-index: 46 }`: a barra não tem mais fundo para cobrir o fio.
- `.afty-card > :first-child` com o canto do cartão (A6): os cartões já cortam no raio.
- `.afty-cabecalho .afty-cabecalho` pode virar `.afty-placa` (as duas formas continuam valendo).
- O aviso do comentário acima de `.afty-cabecalho` ("a barra de rolagem pinta o próprio fundo") não
  vale mais: um degradê na faixa agora aparece inteiro, sem retângulo.

### Achado de passagem

- Nas abas de estágio (Habilidades, Efeitos) a JANELA ainda rola alguns pixels, e aí a barra grudada
  some atrás do cabeçalho em vez de grudar (é o "Ativos some" da segunda rodada do Sonnet, visto
  também na busca de Habilidades). Não mexi: é leiaute do estágio, fora de A1 a A7.

### Perguntas ao autor

1. Tudo isto vale para `/Afty` e `/Player`? (Apliquei nos dois, porque o G2 é um componente só.) E
   para a ficha clássica? (Não apliquei nada nela: a clássica não tem barras grudadas, nem placa, e
   a barra de rolagem dela segue com fundo próprio.)
2. Quatro temas da pasta `docs/` pintavam `.afty-cabecalho` e o G2 ignorava. Agora aparece: a Hora
   Azul ganha o degradê roxo na faixa do topo, o Cão Divino Preto fica marrom em vez de preto, o Abe
   no Seimei ganha a trama de papel (`cmp-hora-azul.png` e `cmp-temas-antigos.png`, o antigo em
   cima). O Cão Divino Branco segue a mesma regra e não foi fotografado. Fica assim ou os temas mudam?
3. A4: tirar o `.afty-cabecalho` da placa (quebra temas que pintam a placa por ele, a Ignia
   inclusive) ou manter as duas classes, como está agora?
4. A placa também desenha o fio do `::after` (o mesmo `.afty-cabecalho::after`). No tema padrão é
   uma linha fraca na base da placa. Esconder no app?
5. A1: manter a faixa opaca no padrão e o tema liga pelos tokens (como está), ou mudar o padrão? E
   no tema, faixa transparente (pedaços da lista nos vãos) ou véu de 85% (lista apagada)?
6. A7: aplicar `design.local/proposta-a7.css` no app (8px entre placa e Guarda, canto de 10px e a
   Guarda por cima da sombra da placa)?

### Respostas do autor (2026-11-14)

1. Vale para `/Afty` e `/Player`. A ficha clássica fica como está.
2. Os quatro temas antigos ficam como estão: a faixa do topo mostra o fundo que eles escreveram.
3. A placa mantém as duas classes, `.afty-cabecalho` e `.afty-placa`.
4. Fio da placa escondido no app: `.afty-placa:where(.e-ficha-g2 *)::after { display: none }` em
   `efeitos-g2.css`. Fotografado no padrão e no Pergaminho, em 1440 e 390: some só a linha da base
   da placa (`antes-fio-*` e `depois-fio-*`). A Ignia já escondia o mesmo fio sozinha, então
   `.afty-cabecalho .afty-cabecalho::after { display: none }` do tema também pode sair.
5. A faixa continua opaca no padrão. No tema, a receita recomendada é o véu de 85%
   (`--afty-fundo-grudado: color-mix(in srgb, var(--afty-fundo) 85%, transparent)` com
   `--afty-peca-grudada: var(--afty-card)`). A regra 14 do Prompt para IA foi reescrita assim, e a
   faixa transparente fica só para quando o autor do tema pedir.
6. A7: o autor quer ver as fotos antes. Par enviado: `a7-hoje-1440-alvo.png` e
   `a7-proposta-1440-alvo.png`, `a7-hoje-390.png` e `a7-proposta-390.png`, com a ficha em
   Calamidade para a Guarda aparecer. Depois das fotos o autor mandou aplicar: a proposta foi para
   `efeitos-g2.css` como `.afty-guarda:where(.e-ficha-g2 *)`. Medido nos 5 presets e na Hora Azul,
   em 1440 e 390: vão de 8px e canto de 10px (3,3px no Terminal, que tem raio 4). A Ignia segue com
   a flâmula dela (margem lateral, sem vão), porque o `.afty-guarda` do tema vence pela proximidade
   do escopo. Fotos `a7-app-*`. Não visto: o cabeçalho recolhido do celular com a Guarda.

Também decidido: `docs/tema-ignia.css` (v11) e as três entradas novas de
`docs/revisao-automacao/escopo.json`, sobras não commitadas de sessões anteriores, entram no próximo
commit junto com estas correções.
