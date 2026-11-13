---
name: Grimório Tracker
description: Mesa de conferência escura e densa para fichas e encontros de F&M, com roxo raro e cores só semânticas.
colors:
  fundo: "#060910"
  card: "#0f172a"
  poco: "#020617"
  borda: "#1e293b"
  borda-forte: "#334155"
  texto: "#f1f5f9"
  texto-suave: "#94a3b8"
  texto-fraco: "#75849b"
  destaque: "#a855f7"
  destaque-texto: "#d8b4fe"
  destaque-fundo: "#581c8766"
  pv: "#f43f5e"
  pe: "#38bdf8"
  pe-temp: "#67e8f9"
  alma: "#e879f9"
  cura: "#34d399"
  aviso: "#fbbf24"
typography:
  body:
    fontFamily: "ui-sans-serif, system-ui, 'Segoe UI', Roboto, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: "ui-sans-serif, system-ui, 'Segoe UI', Roboto, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 600
  row:
    fontFamily: "ui-sans-serif, system-ui, 'Segoe UI', Roboto, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
  micro:
    fontFamily: "ui-sans-serif, system-ui, 'Segoe UI', Roboto, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 600
  section-title:
    fontFamily: "ui-sans-serif, system-ui, 'Segoe UI', Roboto, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 700
    letterSpacing: "0.09em"
  value:
    fontFamily: "Bahnschrift, 'Segoe UI', system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 600
  vital-number:
    fontFamily: "ui-monospace, Consolas, monospace"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.1
rounded:
  sm: "8px"
  md: "12px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
components:
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.texto}"
    rounded: "{rounded.md}"
  button:
    backgroundColor: "{colors.card}"
    textColor: "{colors.texto-suave}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "6px 12px"
  button-highlight:
    backgroundColor: "{colors.destaque-fundo}"
    textColor: "{colors.destaque-texto}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "6px 12px"
  chip:
    backgroundColor: "{colors.poco}"
    textColor: "{colors.texto-suave}"
    typography: "{typography.micro}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
  chip-highlight:
    backgroundColor: "{colors.destaque-fundo}"
    textColor: "{colors.destaque-texto}"
    typography: "{typography.micro}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
  tab:
    textColor: "{colors.texto-suave}"
    typography: "{typography.label}"
    padding: "8px 14px"
  tab-selected:
    textColor: "{colors.destaque-texto}"
    typography: "{typography.label}"
    padding: "8px 14px"
  vital:
    backgroundColor: "{colors.card}"
    textColor: "{colors.pv}"
    typography: "{typography.vital-number}"
    rounded: "{rounded.md}"
    padding: "10px 12px"
  field:
    backgroundColor: "{colors.poco}"
    textColor: "{colors.texto}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
---

# Design System: Grimório Tracker

## Overview

**Creative North Star: "A Mesa de Conferência"**

O app existe para conferir número contra o livro. Tudo o que está na tela serve a uma pergunta que o mestre ou o jogador faz sob pressa: quanto vale isto, de onde vem, e posso agir agora. O visual é escuro, denso e sóbrio, com camadas de azul-ardósia sobre um fundo quase preto. O roxo é a única cor de marca, e as outras cores só aparecem quando significam recurso ou estado.

A densidade é deliberada. Uma ficha de nível alto mostra nome, vitais, Guarda e até doze defesas num cabeçalho grudado, e o resto rola por baixo. A hierarquia vem de tamanho, peso e posição, não de ornamento. O criador calcula, ele não ensina: a tela mostra o resultado e o aviso de problema real, e a explicação de um número mora no hover das fontes.

O app é um sistema de dois livros. O Grimório 2.5.2 (criador e dashboard, pintados com utilidades do Tailwind) e o Afty (a Ficha Final, pintada por tokens `--afty-*`) convivem. A Ficha Final aceita tema e CSS do usuário, por isso a cor dela nunca é escrita em classe de utilidade: sai sempre de variável.

**Key Characteristics:**
- Tema escuro fixo, sem versão clara do app (o usuário pode trocar o tema da Ficha Final).
- Alta densidade, alvos de toque de 44 px só em ponteiro grosso.
- Roxo raro. PV, PE, Alma, cura e aviso são cores com significado fixo.
- Contornos finos no lugar de sombras pesadas, raio de 8 a 12 px.
- Número em fonte própria, sempre alinhado pela linha de base do texto vizinho.
- Cada número derivado revela suas parcelas no hover.

## Colors

Azul-ardósia quase preto como chão, branco-azulado frio como texto, e um roxo como única voz de marca. Vermelho, azul, magenta, verde e âmbar são vocabulário de jogo, não decoração.

### Primary
- **Roxo de Destaque** (#a855f7): seleção, foco, borda de item ativo, o fio de luz sob o cabeçalho e o hover de botões. É a cor de marca e a única que aparece sem representar um recurso.
- **Lilás de Texto** (#d8b4fe): texto sobre destaque, aba selecionada, chip ativo, e o ícone e o texto do aviso operacional do G2 no tema padrão.
- **Véu Roxo** (#581c8766): fundo de chip, botão e aba selecionados. Sempre acompanhado da borda de destaque a 55% de opacidade.

### Secondary (recursos de jogo, cada um com um único significado)
- **Rosa de Vida** (#f43f5e): PV, dano ao passar o mouse, número do vital de PV.
- **Azul de Energia** (#38bdf8): PE. A casca temporária de PE usa o ciano mais claro (#67e8f9), nunca o âmbar.
- **Magenta de Alma** (#e879f9): a Alma e o seu vital.
- **Verde de Cura** (#34d399): cura e ganho.
- **Âmbar de Aviso** (#fbbf24): PV temporário, estado de recurso (Carga e Sobrecarga) e o aviso da Ficha clássica. No G2 o aviso operacional (cobrança, bloqueio, pré-requisito não atendido, PE que o controle não desconta) usa a cor do tema, Lilás de Texto no padrão, por decisão do autor em 2026-10-14 (`--e-aviso`). O ícone de aviso é sempre o `AlertTriangle`, nas duas cores.

### Neutral
- **Chão** (#060910): fundo da Ficha Final, com um brilho roxo radial fraco no alto numa camada separada.
- **Card** (#0f172a): superfície de card e de vital.
- **Poço** (#020617): campo, chip em repouso, tudo o que está "afundado".
- **Borda** (#1e293b) e **Borda Forte** (#334155): contorno de card, divisor e chip, discretos de propósito.
- **Borda de Controle** (Texto a 38% sobre o Card, cerca de #656b79): o contorno de quem é controle, como botão e passo. Fica em 3:1 contra o Card (WCAG 1.4.11) e acompanha qualquer tema por ser derivada (`--afty-borda-controle`).
- **Texto** (#f1f5f9), **Texto Suave** (#94a3b8), **Texto Fraco** (#75849b): três degraus de leitura, todos acima de 4,5:1 sobre Card, Chão e Poço. O último serve a contagem, rótulo de grade e placeholder.

### Named Rules
**A Regra do Roxo Raro.** Roxo marca seleção, foco e o que está ativo agora. Se uma tela inteira fica roxa, o destaque perdeu o sentido.

**A Regra da Cor com Significado.** PV é rosa, PE é azul, Alma é magenta, cura é verde, aviso de recurso é âmbar e o aviso operacional do G2 segue o tema. Nenhuma dessas cores serve de decoração, e nenhum recurso novo ganha cor sem o autor aprovar.

**A Regra do Token.** Na Ficha Final cor, borda, raio, sombra, fundo e fonte saem de `--afty-*`. Utilidade de cor do Tailwind é permitida só no criador, nunca na Ficha, porque o tema do usuário não alcança uma classe de utilidade.

## Typography

**Display Font:** Bahnschrift (com Segoe UI e system-ui), semicondensada, só nos valores do G2
**Body Font:** ui-sans-serif, system-ui, Segoe UI, Roboto
**Label/Mono Font:** ui-monospace, Consolas, para números de vital e contagens

**Character:** Sistema de fontes nativas no tema padrão, sem fonte baixada. A única personalidade vem de tipografia numérica: Bahnschrift semicondensada para valores no G2 e monoespaçada tabular para vitais, para que colunas de número não balancem.

**Fontes da internet, só por escolha do tema (autor, 2026-11-10).** O painel de Aparência da Ficha G2 oferece uma lista fechada de doze famílias do Google Fonts (Inter, Lora, Merriweather, Playfair Display, Cormorant Garamond, Cinzel, Oswald, Barlow Condensed, Chakra Petch, Shippori Mincho, JetBrains Mono e Caveat), em `FONTES_WEB` (`ficha-tema.js`). A família só baixa quando o tema a pede, pelo painel ou pelo nome num `font-family` do CSS livre, por um `<link>` no `<head>` (`useFontesWeb.js`), e cada pilha traz a reserva do sistema para quando não há internet. O endereço sai da tabela, nunca de texto do tema, e um tema recebido de outra pessoa só consegue pedir família da lista. A clássica e o cartão da invocação seguem só com as fontes do sistema.

### Hierarchy
- **Vital** (700, 1.5rem, 1.1): o número grande de PV, PE e Alma, em Consolas tabular.
- **Valor** (600 a 700, 15 a 16 px, semicondensada): valores derivados no G2, como bônus, defesa e dano.
- **Body** (400, 0.875rem, 1.45): texto de linha, descrição de Habilidade. Texto do livro tem medida limitada e entrelinha larga.
- **Label** (600, 0.8125rem): botões, abas, campos.
- **Linha** (600, 0.75rem): nome de item e de linha de lista (`text-[12px]`), o degrau entre Micro e Label que a Ficha já usa em dezenas de pontos.
- **Micro** (600, 0.6875rem): chips e marcas de valor fixo.
- **Título de Seção** (700, 0.6875rem, caixa alta, 0.09em): `.afty-card-titulo`, sempre em Texto Suave.

### Escala do G2 (2026-11-10, espera aprovação do autor)
A Ficha Final G2 usa seis degraus, num bloco só na raiz `.e-ficha-g2` (`efeitos-g2.css`), no lugar de 17 tamanhos soltos. Cada uso é `var(--e-fs-x, Npx)`, com o padrão do degrau junto, então apagar o bloco não quebra nada. Um tema do usuário reajusta o degrau com `:scope { --e-fs-corpo: 15px }`.
- **`--e-fs-micro`** (11,5 px): marcas, contagens, texto de apoio.
- **`--e-fs-meta`** (12,5 px): rótulo de dado, como o `dt` de um stat.
- **`--e-fs-corpo`** (13,5 px): o texto corrente da aba e dos botões.
- **`--e-fs-leitura`** (15 px): texto de leitura e valor de linha.
- **`--e-fs-titulo`** (16,5 px): título de lista e valor do cabeçalho.
- **`--e-fs-destaque`** (22 px): o número grande do recurso.
Os números dos recursos (26 a 28 px) ficam fora da escala. O piso de 11 px abaixo continua valendo.

### Named Rules
**A Regra da Linha de Base.** Número ao lado de texto alinha pela base, não pelo centro (`.afty-base`). Quem não tem base de verdade, como ícone, imagem, botão e rótulo aparado, volta ao centro com `data-afty-alinha="centro"`. O `t-alinhamento.mjs` trava isso.

**A Regra do Piso de 11 px.** Nenhum texto da Ficha Final fica abaixo de 11 px (`0.6875rem`, que a raiz de 16 px ou 18 px mantém em 11 a 12 px). Rótulo, contagem e chip usam o Micro como menor degrau, e `text-[9px]` e `text-[10px]` não entram em JSX da Ficha.

**A Regra do Title Case.** Rótulos, chips e toggles escrevem em Title Case com conectores curtos em minúscula. Sem travessão e sem ponto e vírgula em texto de tela.

## Layout

Largura é responsiva por contêiner, não por janela: as abas do G2 usam `container: aba / inline-size`, porque a ficha compacta aberta estreita a aba sem mudar a janela. Os pontos de corte observados na Ficha são 480 px, 640 px, 768 px, 1024 px, e o Grimório 2.5.2 usa 1024 px.

O cabeçalho da Ficha é grudado (`position: sticky`, `top: 0`, z 40), de fundo opaco, e dita o orçamento de altura de tudo o que rola abaixo. As seções são cards com topo (título e controles) e corpo, em coluna única com 12 px entre elas, e as listas usam linhas de 42 a 48 px com divisor leve de 9% do texto. A grade de células se organiza em colunas automáticas de no mínimo 340 px.

Em tela larga as abas e a barra de rolagens dividem a `.e-linha-abas`: as abas à esquerda, no tamanho natural, e à direita o modo da rolagem, a última rolagem e o Histórico (`.afty-log`, de 560 a 600 px). Quando as duas não cabem juntas (de 721 a uns 1280 px) a barra quebra para a linha de baixo, à direita, em vez de encolher. A faixa própria de 60 px sob as abas saiu. No celular a barra continua abaixo das abas, e o cabeçalho rolado vira uma faixa fina com nome e os mesmos recursos do cabeçalho em número (`FinaG2.jsx`, fora do fluxo, com histerese). Abaixo de 380 px, com quatro recursos, o nome sai.

O ritmo de espaçamento é de 4, 8, 12 e 16 px. Controles em ponteiro grosso (`pointer: coarse`) sobem para 44 px de altura mínima.

`src/index.css` é global e escrito fora de `@layer`, então `h1`, `h2`, `p` e `code` vencem utilidade do Tailwind. Tamanho ou margem que não obedece se resolve com o sufixo `!` (`m-0!`), nunca editando o `index.css`.

## Elevation & Depth

Hierarquia vem de camadas tonais e contorno, não de sombra. Chão, Card e Poço são três degraus de escuridão, e a borda fina separa. A sombra do card é curta e escura (`0 2px 10px rgb(0 0 0 / 0.45)`). O cabeçalho separa o que é fixo do que rola com um fio de luz de 1 px com gradiente roxo transparente nas pontas, a 50% de opacidade, sem sombra.

Não há `backdrop-filter`. O cabeçalho já foi vidro borrado e foi trocado por fundo opaco porque o desfoque re-amostrava a tela a cada quadro e engasgava a rolagem em fichas de nível alto. O brilho de fundo mora numa camada `position: fixed` própria, nunca em `background-attachment: fixed`.

### Shadow Vocabulary
- **Card** (`box-shadow: 0 2px 10px rgb(0 0 0 / 0.45)`): cards de seção e vitais.
- **Véu de camada** (`rgb(0 0 0 / 0.55)`): fundo atrás de busca e painel de aparência. É token porque, num tema claro, um véu preto empasta a tela.

### Named Rules
**A Regra do Chão Barato.** Efeito que re-pinta a tela a cada quadro (`backdrop-filter`, `background-attachment: fixed`) não entra em área grudada nem em área que rola.

## Shapes

Cantos contidos. O raio grande (12 px) fica em card, seção e vital. O raio pequeno (8 px) fica em botão, passo, campo e seletor de cor. A cápsula total (9999 px) existe, mas só em rótulo curto de valor fixo (`.afty-chip`) e na sub-aba. Condição escrita em frase sai como texto puro (`afty-rotulo`), nunca como cápsula.

Bordas são sempre de 1 px. Estado ativo troca a cor da borda e nunca a espessura. Ícones vêm do lucide-react e o aviso é sempre o `AlertTriangle`.

## Components

Todos os componentes são contidos e precisos: borda fina, raio de 8 a 12 px, e o hover só troca a cor da borda ou do texto. Nada pula, brilha ou escala.

**Escala de controle da G2.** Um só raio para todo controle (8/12 do raio do tema), e três alturas: chip de 28 px, botão e passo de 32 px, alvo que rola (`.m-rolar`) de 36 px. `.m-chip` e `.m-passo` têm uma única definição, em `abas-g2.css`, e o `efeitos-g2.css` guarda só os estados. A borda do chip informativo é a suave (`--e-chip-borda`), e a de quem recebe clique é a de controle (`--e-ctrl-borda`, 38%).

### Buttons
- **Shape:** retângulo de cantos suaves (8 px), borda de 1 px em Borda de Controle.
- **Default:** fundo Card, texto Texto Suave, 0.8125rem peso 600, padding 6 px por 12 px.
- **Hover:** texto vai a Texto e a borda vai a Roxo de Destaque, em 140 ms.
- **Destaque (`data-afty-tom="destaque"`):** fundo Véu Roxo, borda de destaque a 55%, texto Lilás.
- **Dano e Cura (`data-afty-tom`):** só no hover, a borda e o texto vão a Rosa de Vida ou Verde de Cura.
- **Toque:** altura mínima de 44 px em ponteiro grosso.

### Chips
- **Style:** cápsula de fundo Poço, borda Borda Forte, texto Texto Suave, 0.6875rem peso 600, sem quebra de linha.
- **State:** `data-afty-tom="destaque"` troca para Véu Roxo e Lilás. Chip que é botão (`button.afty-chip`) ganha cursor e borda de destaque no hover. O desligado por cota cheia se distingue do desligado por escolha.
- **Regra de uso:** só para rótulo curto de valor fixo.

### Cards / Containers
- **Corner Style:** 12 px.
- **Background:** Card sobre Chão.
- **Shadow Strategy:** sombra curta e escura, mais contorno de 1 px.
- **Border:** Borda.
- **Internal Padding:** 16 px lateral nos topos de seção, 10 a 12 px nos vitais. Título de seção em caixa alta pequena.

### Inputs / Fields
- **Style:** fundo Poço, borda Borda Forte, raio de 8 px, texto 0.8125rem.
- **Focus:** borda vai à cor do contexto (o vital usa a própria cor, o resto usa o destaque) e o fundo escurece para Poço.
- **Placeholder:** Texto Fraco.

### Navigation
- **Abas (`.afty-aba`):** texto, sem caixa, sublinhado de 2 px. Em repouso Texto Suave, selecionada Lilás com o sublinhado em Roxo de Destaque. Rolagem horizontal sem barra.
- **Sub-abas (`.afty-subaba`):** cápsula pequena, 0.75rem, com a contagem de itens ao lado em Consolas. Selecionada usa Véu Roxo.
- **Mobile:** a barra de abas rola na horizontal e o alvo sobe a 44 px em ponteiro grosso.

### Efeitos (contrato de tema, 2026-11-10)
Quatro classes estáveis na aba Efeitos, que o CSS do usuário pode pintar sem `!important` (a cor do app mora em `:where(.e-g2)`):
- **`.afty-efeito`:** o cartão de um efeito ativo, só com o nome. O aberto tem `aria-current="true"`.
- **`.afty-efeito-detalhe`:** a faixa que abre logo abaixo do cartão, com o que o efeito vale agora. Colunas sem conteúdo somem (`data-vazio`).
- **`.afty-catalogo-linha`:** a linha de uma opção no Adicionar e nos Favoritos. A escolhida tem `aria-current="true"`. O catálogo separa "Para Ativar" de "Demais Opções".
- **`.afty-catalogo-painel`:** o painel da opção escolhida, com a regra, a operação do item e o Confirmar.
A lista viva está em `ficha-tema.js` (catálogo de seletores do Prompt IA).

### Vital (assinatura)
Card com borda tingida pela cor do recurso (28% sobre a Borda, 55% no hover), ícone, rótulo, número grande em Consolas tabular na cor do recurso, máximo ao lado e trilho de barra embaixo. A cor vem de `--afty-vital-cor` e muda por `data-afty-vital` (pv, pe, pvtemp, alma).

### Passo de Número
Botão quadrado de 1,5 rem (2 rem em ponteiro grosso) com Borda de Controle, que soma ou subtrai. No hover a borda assume a cor do vital.

## Do's and Don'ts

### Do:
- **Do** pintar a Ficha Final só com `--afty-*` e usar Tailwind nela apenas para layout.
- **Do** mostrar o resultado e o aviso de problema real com o ícone `AlertTriangle`, em âmbar para recurso e na cor do tema para o aviso operacional do G2, sempre com rótulo legível (o ícone sozinho não chega a teclado, leitor de tela nem toque). A explicação de cálculo vai no hover de fontes (`PainelDeFontes`), e a descrição de catálogo vai em `DicaDeTexto`.
- **Do** alinhar número e texto pela linha de base (`.afty-base`).
- **Do** usar Title Case em rótulos, chips e toggles ("Nível do Efeito", "Tipos de Dano Extras").
- **Do** reservar o roxo para seleção, foco e o que está ativo.
- **Do** manter alvos de 44 px em `pointer: coarse` e respeitar `prefers-reduced-motion`.
- **Do** manter a origem de um número que rola alcançável no toque: o toque curto rola e o toque longo (450 ms) abre as fontes, o mesmo painel do hover. O número que rola não tem outra pista visual além do tracejado sob ele.
- **Do** tratar campo de texto livre como marcação (`afty-texto-rico.js`), nunca como HTML.

### Don't:
- **Don't** usar travessão (U+2014) nem ponto e vírgula em texto de tela.
- **Don't** escrever texto explicativo solto no criador: sem `hint`, sem memória de cálculo cinza, sem legenda ensinando regra.
- **Don't** usar cápsula de raio total em frase. Cápsula é só para rótulo curto de valor fixo.
- **Don't** usar `backdrop-filter` nem `background-attachment: fixed` em área grudada ou rolável.
- **Don't** usar o caractere U+26A0 como aviso. O lint reprova em JSX e em string do Afty.
- **Don't** dar a PV, PE, Alma, cura ou aviso uma cor diferente da sua, nem usar essas cores como decoração. O aviso operacional do G2 pinta com o tema e não com o âmbar.
- **Don't** editar `src/index.css` nem `src/components/` (o Grimório 2.5.2 é somente-leitura). Correção de regra do livro dentro do Afty é feita por Addon.
- **Don't** usar o título nativo `title` para descrição de catálogo, e não mirar em classe de utilidade do Tailwind ao escrever tema: os nomes `afty-*` são a API pública.
