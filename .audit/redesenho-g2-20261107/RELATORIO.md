# Redesenho do cabeçalho e de Perícias do G2 (2026-11-07)

Escopo: prévia isolada. Nada foi ligado nas rotas normais, o G2 não foi promovido e nada foi publicado.
A prévia está na porta 5330 (`node .audit/previa-abas-g2-20261021/servidor.mjs 5330`, build em
`.audit/previa-abas-g2-20261021/dist`, gerado por `npx vite build --config .audit/previa-abas-g2-20261021/vite.config.mjs`).

As duas capturas de referência do autor (Perícias no G2 e na clássica) não chegaram a esta conversa e eu não as vi. Os comparativos abaixo
foram montados do zero, com a mesma ficha, os mesmos dados, o mesmo tema e a mesma largura nas duas apresentações.

Registro honesto da ordem: o diagnóstico e a direção abaixo foram decididos antes de editar, mas só foram
escritos neste relatório depois da implementação.

## Links diretos

- G2, Perícias, ficha densa: `http://127.0.0.1:5330/?ficha=cmp-densa&tema=escuro&aba=pericias`
- G2, Perícias, ficha simples (Arcane nível 1): `http://127.0.0.1:5330/?ficha=cmp-simples&tema=escuro&aba=pericias`
- G2 com o tema Arcane: `http://127.0.0.1:5330/?ficha=cmp-simples&tema=arcane&aba=pericias`
- Clássica, mesma ficha e mesmo tema: acrescente `&modo=classica` (abre em Ações, clique em Perícias).
- `aba=acoes|habilidades|pericias|equipamentos|buffs` troca a aba inicial do G2 (prop opcional `abaInicial`, padrão `acoes`).

## Diagnóstico

1. **Retrato.** A moldura era um avatar circular de 80 px. A coluna da identidade era o que sobrava depois de quatro medidores
   de 168 px, então o nome quebrava em três linhas, o ponto separador da linhagem abria linha sozinha e o ícone de aviso caía
   em linha própria (o `svg` do Tailwind é `display: block`). Com um tema que pinta o bloco do nome (Arcane), esse bloco
   ocupava a coluna inteira, não o nome.
2. **Perícias.** Ataques e Resistências lado a lado deixavam um vão (3 linhas contra 5), Outros era uma grade de cartões e
   Perícias uma grade de 3 a 5 colunas, com o nome a centenas de pixels do botão. O treino aparecia em três lugares ao mesmo
   tempo (glifo, chip "Mestre" e cor), e "Crít 20" repetia em cinco linhas.
3. **Coerência.** O cabeçalho é grudado (inclui abas e barra de dados) e o caso S1 de Dano estava fora da primeira tela:
   a prévia na 5330 antes do redesenho media `danoFundo` 859 em 1280x800 com a compacta (limite 800).

## Direção visual

- **Retrato como âncora.** Moldura retangular de cantos do tema, 112 px de largura (104 abaixo de 1120 px, 84 no telefone),
  na altura do corpo inteiro (placa e faixa). O anel conic-gradient e as classes que os temas pintam continuam.
- **Identidade acompanha o nome.** A coluna é `fit-content` (teto de 31vw entre 240 e 420 px), a placa do Arcane abraça o texto.
  Separador da linhagem no fim do item anterior, nunca no começo de linha.
- **Grupos reconhecíveis.** Identidade à esquerda, recursos como grupo de quatro medidores (rótulo sobre número) à direita,
  comandos no canto, valores e Agora na faixa de baixo. De 1120 px para baixo os recursos descem para uma segunda fileira.
  No telefone: retrato estreito ao lado do nome e dos comandos, quatro recursos numa fileira.
- **Largura de leitura.** Duas colunas de leitura em Perícias a partir de 820 px de ABA (medida pelo contêiner, a compacta aberta
  conta): testes à esquerda (Ataques, Resistências, Outros), Perícias à direita. Uma coluna no celular, na mesma ordem do DOM e da tecla Tab.
  Em aba de 1500 px ou mais a lista de Perícias ganha duas fileiras.
- **Escala tipográfica.** Nome 26 px (21 no telefone), linhas de teste 15 px, metas 12,5 px, rótulos de seção em caixa alta como já eram.
  Meta fraca usa o tom secundário (o terciário reprovava o contraste AA de 4,5).
- **Estados dos controles.** Linha sem treino neutra (nome 500), Treinada com barra de 2 px e fundo leve (nome 600), Mestre com barra de 3 px
  e fundo firme (nome 700). O botão de rolagem tem largura mínima de 64 px, então os números alinham.
  A palavra do treino vai para leitor de tela e o chip "Mestre" repetido saiu. Crít só aparece quando difere de 20 ou tem mais de uma fonte.

## Reservas e arquivos tocados

Reserva conferida em `docs/a-fazer.md`: CX3 listava `PericiasG2.jsx`, `rolagens-acoes.js` e `AcoesG2.jsx`, e o lote de CSS reservava `AftyFichaG2.jsx`.
Os dois foram encerrados (CSS em 06/11, CX3 em 07/11, "as reservas exclusivas de CX3 estão liberadas"). Só `afty-derive.js` segue reservado, por CX6, e
não foi tocado. Eu não registrei este lote na fila antes de editar, como a regra pede. O registro foi feito agora, na entrada de avaliação da Mesa.

A árvore já tinha trabalho não commitado de outros nos mesmos arquivos (por exemplo `rolagens-acoes.js`, que não toquei). O que é meu:

- `AftyFichaG2.jsx`: duas linhas, a prop `abaInicial = "acoes"` e `useState(abaInicial)`.
- `PericiasG2.jsx`: o `return` (colunas e Secao sem contagem), `LinhaTeste` (chip Mestre, palavra do treino, `mostraCritico`) e o filtro (contagem fora de "Todas").
- `CabecalhoG2.jsx`: o `.e-corpo` e a moldura fora da placa.
- `efeitos-g2.css`: o bloco da placa, do retrato, da linhagem, dos recursos, os dois blocos de quebras. Os blocos de Efeitos não foram tocados.
- `abas-g2.css`: os blocos Outros e Perícias.

## O que mudou

- `ficha/efeitos/CabecalhoG2.jsx`: o retrato é irmão do novo `.e-corpo` (placa e faixa), fora da placa. Nenhum gancho de tema saiu.
- `ficha/efeitos/efeitos-g2.css`: grade do cabeçalho, medidor com rótulo sobre número, três quebras (1120, 720, 360), linhagem, retrato vazio.
- `ficha/abas-g2/PericiasG2.jsx` e `abas-g2.css`: composição em duas colunas, linha em colunas fixas, Outros em lista, atributos em faixa baixa.
- `ficha/AftyFichaG2.jsx`: prop opcional `abaInicial` (padrão `acoes`), usada só pelo link direto da prévia.
- `.audit/previa-abas-g2-20261021/main.jsx`: cenas `cmp-simples` e `cmp-densa` (retrato local, sem rede) e parâmetro `aba`.
- `asserts/t-abas-g2-previa.mjs`: seção 8, ganchos de tema e estrutura (52 para 60 asserts).
- Preservados sem alteração: Efeitos (aba, compacta, detalhe), a Mesa unificada, as linhas de armas, `themes/arcane-g2.css`, `src/components/`.
- Pintura nova: o destaque do treino, o fundo e a borda das linhas, dos atributos e do retrato vazio usam `:where(.e-g2)`, no padrão da correção
  de 06/11. Algumas peças seguem como `.e-g2 .x` (moldura do retrato, cor da meta, cor do nome por treino) e um tema escrito pelo contrato
  só as vence com mais especificidade ou escopo. Não foi feita varredura completa das 44 cores e raios.

## Medido

Altura do cabeçalho grudado (abas e barra de dados incluídas), mesma ficha:

| Caso | Antes | Depois |
|---|---|---|
| S1 1280x800 compacta, cabeçalho | 285 px | 227 px |
| S1 1280x800 compacta, fundo da 1ª linha de Dano | 859 (limite 800) | 797 |
| S1 768x1024 compacta, fundo da 1ª linha de Dano | 1042 (limite 1024) | 1024 |
| S1 390x844 telefone, cabeçalho | 414 px | 372 px |
| S2 1280x800 compacta, cabeçalho | 262 px | 227 px |

Verificações (dev e build da prévia, mesmas respostas):

- `verificar.mjs`: 43 de 43. Teclado (ordem Ataques, Resistências, Outros, Perícias, com contorno em cada foco), ausência de estouro horizontal
  em 331, 390, 768, 1024, 1280, 1440 e 1920 nas abas Ações, Perícias e Equipamentos, alvo de rolagem de 34 px ou mais, compacta aberta
  em 1280 e 1024, duas colunas contra uma, três tons de linha, busca e filtro, Executar e Resistir de Outros rolando.
- Scripts da prévia antiga (`layout`, `ajustes`, `interacao-abas`, `interacao-armas`, `fumaca`, `temas-compat`): 0 falhas. O `temas-compat`
  reprovou o contraste da meta de Perícias (3,03 a 3,56) na primeira passada e foi corrigido.
- `npx eslint src/systems/afty` limpo, `t-abas-g2-previa` 60 de 60, `t-fechamento-g2` e `t-ordem-modulos` ok, build do app em pasta isolada ok.
- Efeitos com um efeito ATIVO de verdade (`efeitos-ativo.mjs`, Ataque Concentrado ativado pelo catálogo, Energia 79/80): o detalhe mostra Agora, Ajustar e
  Termina em 1440, 1280 e 390, e o painel compacto lista o ativo. 15 de 15. Os seletores de Efeitos não foram tocados e as classes de recursos
  (`m-medidor`, `m-barra`) só são usadas pelo cabeçalho e pelo painel de cada recurso. A bateria de pixels da revisão de 05/11 NÃO foi rodada.
- Temas conferidos: padrão escuro, Claro (Pergaminho), Minamoto, Arcane e CSS de teste. Alter Lucielos: sem estouro de página em 331, 390, 768 e 1440,
  mas no telefone o medidor de Preparo perde cerca de 7 px à direita porque o tema impõe número maior e mínimo zero (o tema vence). Arcane em 390:
  "Efeitos" cai na terceira fileira do Agora por regra do próprio `arcane-g2.css` (quebra de linha até 600 px), como já caía antes.
- Suíte `npm run asserts`: 312 de 314. Falham `t-reconciliacao-g00` e `t-revisao-g00` por módulos novos de outros lotes sem proprietário de controle
  (`afty-armas-improvisadas.js`, `afty-controlador-posicao.js`, `afty-corrupcao.js` e outros). Nenhum arquivo meu aparece na saída.

## Capturas

Comparáveis (mesma ficha, dados, tema escuro e largura):

- `comparativo-densa-1440.png`, `comparativo-simples-1440.png`, `comparativo-densa-390.png`, `comparativo-simples-390.png`: G2 antes, G2 depois e clássica.
- `antes/` e `depois/`: Perícias, Ações, Habilidades, Equipamentos e Efeitos do G2 em 1440 e 390, mais a clássica em Perícias.
- `antes-arcane/` e `depois-arcane/`, `depois-claro/`, `depois-minamoto/`.
- `depois/compacta-1280.png`, `compacta-1024.png`, `teclado-1440.png`, `efeitos-adicionar-*.png`.
- Scripts: `capturar.mjs`, `comparativos.mjs`, `verificar.mjs`, `efeitos.mjs`, `topo.mjs`.

## Ajustes posteriores

- **Jogadas de Ataque (07/11).** Saíram da ficha de Player no criador, na clássica, no G2 e na busca (divergência de tela `jogadasDeAtaqueNaTela`). A criatura mantém.
  O derive não mudou. Roteiros `criador.mjs` e `jogadas.mjs`.
- **Perícias mais curta (08/11).** Linha de 40 px (42 no toque) e, em coluna única, a chave Testes / Perícias (um grupo por vez, a busca global troca o grupo).
  Perícias de Player: 1293 para 1182 px no desktop e 2195 para 1380 px no celular. `verificar.mjs` 50 de 50, `alturas.mjs` mede as abas.
  `capturas`: `depois/celular-grupo-testes.png` e `celular-grupo-pericias.png`.

- Ficha real do autor (08/11): cena `real` da prévia, com o export em `.audit/previa-abas-g2-20261021/fichas/arcane-real.json` (retrato e CSS dela incluídos).
  Link `http://127.0.0.1:5330/?ficha=real&aba=pericias`, e `&tema=semcss` mostra o tema padrão. `real.mjs` confere erros e tira capturas.

- **Ações e Habilidades no estilo de Perícias (08/11).** Pular como seção com segmentos, Golpe Especial e a Mesa com a mesma ação, índice só com quatro
  seções, listas de Habilidades de fios. S1 de Dano em 783 e 1021. Comparar `antes-abas/` e `depois-abas/` (real, mesa, cmp-densa, conjurador).

## Ainda precisa de avaliação

- O retrato de 112 px é menor que o painel da clássica (216 px). Maior só cabe gastando altura do cabeçalho grudado, que hoje está justa em S1.
- O botão dos Livros (canto de baixo, à direita) continua passando sobre botões de rolagem na borda direita das listas, como já passava antes.
- De 721 a 1119 px, valores e Agora dividem uma fileira e o excedente vai para "+N". Quebrar em duas fileiras custaria altura.
- Crít 20 deixou de aparecer nas Resistências. Se o autor preferir ver sempre, é uma linha em `PericiasG2.jsx` (`mostraCritico`).
- O servidor estático da 5330 cai se o build é refeito enquanto ele entrega um arquivo (a leitura do arquivo apagado derruba o processo). Aconteceu
  uma vez nesta sessão, foi religado com o mesmo comando. Refaça o build com a prévia parada, ou religue.
- Habilidades e Ações ainda têm outro desenho de linha (caixa por linha em Habilidades). Não ligado ao redesenho, não tocado.
- A coluna do nome tem teto de 420 px: nomes muito longos quebram em duas linhas.
