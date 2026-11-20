# App Era de Ouro (o site como aplicativo de celular)

Guia do trabalho que transforma `https://fichafm.com.br/EraDeOuro` num app instalável e deixa o site usável no
celular. O plano completo, aprovado pelo autor em 2026-11-18, tem 10 etapas (E1 a E10), e cada etapa é um push
próprio. Este documento guarda as decisões, a linha de base medida, as ferramentas, os protocolos de teste e como
desligar cada peça.

## Decisões do autor (2026-11-18)

| Pergunta | Resposta |
|---|---|
| Como chega ao celular | Instalar pelo site (PWA), sem loja |
| Onde o app abre | Sempre na Era de Ouro. O app se chama Era de Ouro |
| Onde vale a interface nova | No app e no site aberto pelo celular |
| Prioridade | 1 Jogar com a Ficha, 2 Criar e Editar Ficha, 3 Entrar na Sala |
| Navegação nova (barra de baixo, lista do celular, Mais) | Só na Era de Ouro. Criador, Ficha e Sala melhoram em todas as rotas, por serem o mesmo código |
| Ícone | O selo dourado de 12 raios com coroa escura (`docs/app-celular/selo-era-de-ouro.svg`), proposto pelo agente e aprovado pelo autor em 2026-11-19. Entra no app na E4 |
| iPhone | Android primeiro. O convite no iPhone fica desligado até um amigo passar o protocolo num iPhone real |
| Aparelhos de teste | o Android do autor e jogadores da Guilda |
| Rolagens no cabeçalho da Ficha | Viram um botão na linha das abas |
| Botão do Livro | Aba na borda na Ficha G2 e no menu Mais da Guilda |
| Voltar do celular | Em todas as rotas |
| Modo sem internet | Depois das telas (última etapa) |

Padrões escolhidos no plano: manifesto com escopo `/` e injetado só em `/EraDeOuro`, service worker com escopo
`/EraDeOuro`, convite dispensado por 14 dias, camada de CSS de celular no criador, nenhuma biblioteca nova e
nenhuma exceção nova em `src/components/`.

## As etapas

| Etapa | O que entrega | Estado |
|---|---|---|
| E1 | Base e consertos rápidos | feita em 2026-11-19 |
| E2 | Voltar do aparelho (histórico em todas as rotas) | feita em 2026-11-19 |
| E3 | Carregamento leve, fase A (telas sob demanda) | feita em 2026-11-19 |
| E4 | App instalável (manifesto, ícones, convite) | feita em 2026-11-19 |
| E5 | Ficha no celular | feita em 2026-11-19, em duas partes (cabeçalho, rolagens, folha da Vida, depois Livro, faixa fina, palco e viewport) |
| E6 | Criador no celular | feita em 2026-11-20 (cabeçalho de uma linha, faixa de resumo, seções na folha, camada de CSS, origem por toque longo) |
| E7 | Sala no celular | |
| E8 | Casca da Guilda (barra de baixo, lista do celular, Mais) | |
| E9 | Sem internet (service worker) | |
| E10 | Depois: carregamento fase B, iPhone, Encontro | |

## A linha de base (2026-11-19, site no ar em `0889ed5`)

Medida com `.audit/app-celular/medir.mjs` contra `https://fichafm.com.br`, com agente de Android e toque emulados,
e duas fichas reais do repositório (Ciel Lucielus e a prévia do Satoru Gojo). O JSON está em
`.audit/app-celular/medicoes/e1-base-producao.json`. Os números foram iguais em 360, 375, 390 e 412 px, salvo onde
indicado.

| Métrica | Linha de base | Meta do plano |
|---|---|---|
| JS da lista da Guilda (descomprimido) | 6.581 KB (2.089 KB depois da E3) | 2,6 MB ou menos (E3), 1,5 MB ou menos (E10) |
| JS ao abrir uma Ficha | 6.975 KB, +394 KB (2.925 KB, +836 KB depois da E3) | 2,9 MB ou menos ao todo |
| Cabeçalho da Ficha G2 | 463 px, 57% da tela (413 px, 51% em 412 px) | 35% ou menos |
| Número de Vida, Energia e Alma | 16,5 px | 22 px |
| Campo Nome do criador | a 1.225 px do topo | 300 px ou menos |
| Cabeçalho fixo do criador | 150 px | 56 px |
| Abas do criador inteiras na tela | 3 de 8 | navegador de seções |
| Alvos de toque abaixo de 36 px | lista 4 de 17, Ficha 17 de 54, criador 37 de 70 | nenhum |
| Rótulos abaixo de 11 px | lista 7, criador 48 | nenhum |
| Frases abaixo de 12 px | criador 6 | nenhuma |
| Título da lista | cortado ("E...") | inteiro |
| Voltar do celular | sai do site | fica no app (feito na E2) |
| Instalável | não (sem manifesto em rota nenhuma) | sim, só em `/EraDeOuro` |
| Título da aba | "grimorio-tracker" em todas as rotas | o nome da rota |

Build local de `0889ed5`: 7.425 KB de JS ao todo, com o `index` em 4.131 KB e o `ficha-recebidos` em 1.771 KB.

## Ferramentas

As duas usam o Edge do Windows em modo invisível, pelo protocolo de depuração (`.audit/app-celular/cdp-edge.mjs`),
porque o Playwright não está nesta máquina e o projeto evita biblioteca nova. O perfil do Edge é temporário e
apagado no fim: nada do navegador da pessoa é lido nem gravado.

```bash
# as métricas, em 4 larguras de celular
node .audit/app-celular/medir.mjs --url https://fichafm.com.br --rotulo e1-base-producao
node .audit/app-celular/medir.mjs --url http://localhost:4173 --rotulo e3-preview --capturas <pasta>

# os ícones (a prancha de aprovação com --previa)
node .audit/app-celular/gerar-icones.mjs --saida <pasta> --previa
```

## O que a E1 mudou

- **Título por rota e cor de tema** (`index.html`): "Grimório F&M", "Grimório Afty", "Ficha de Jogador", "Era de
  Ouro" e "Sala", postos por um script inline antes do React. A barra do navegador no celular fica com o
  `--afty-fundo` (`#060910`).
- **Login com a query** (`nuvem-config.js`, `destinoDoLogin`): a volta do Google e do Discord cai na mesma página
  com a query dela. A `/Sala/Nova?encontro=<id>&grupo=<g>` perdia o encontro.
- **Chaves do aparelho** (`nuvem-config.js`, `ehChaveDoAparelho`): toda chave que termina em `_aparelho_vN` fica
  fora da nuvem (S-37).
- **Menu da Conta no celular** (`ContaNuvem.jsx`, `PainelDaConta.jsx`): vira a folha de baixo
  (`src/celular/FolhaInferior.jsx`), com itens de 44 px. Antes abria cortado na borda esquerda.
- **Sala** (`sala-ui-dados.js`, `rotaDoGrupo`): o Voltar vai para a rota do grupo da Sala, e o Editar do jogador
  abre a rota do grupo. A ficha de um jogador da Guilda mora em `/EraDeOuro`, e antes os dois iam sempre para
  `/Player`.
- **Livro e barra do Encontro** (`encontro-g2.css`): no celular o botão do Livro some enquanto há combatentes
  selecionados (a barra de ações chega a 210 px de altura em 375 px). Acima de 720 px ele sobe por cima da barra.
- **A consulta única de celular** (`src/celular/pwa-config.js`, `CONSULTA_CELULAR`): até 720 px de largura, ou
  celular deitado (até 500 px de altura com dedo). O hook é `useCelular` (`src/celular/usar-celular.js`).
- **O ícone proposto** (`docs/app-celular/selo-era-de-ouro.svg`): selo dourado de 12 raios com coroa escura, dentro
  do círculo seguro do ícone mascarável. Aprovado pelo autor em 2026-11-19, publicado na E4.

## O que a E2 mudou

- **A tela mora no histórico** (`src/celular/pilha.js`, `usar-pilha-de-telas.js`, ligados no `App.jsx`): cada tela é
  uma entrada `history.state.fm = { v, n, tela, camada? }`. A URL não muda. O Voltar do aparelho volta de tela em
  tela e só sai do site a partir da lista. Recarregar reabre a mesma tela se a ficha ou o encontro ainda existirem.
  Os botões Voltar das telas usam o mesmo histórico: o criador aberto da Ficha volta para a Ficha, e o Salvar também.
- **O criador da 2.5.2 nunca empilha** (`substituir`): o aviso de sair sem salvar dele, em `src/components/`, segue
  protegendo quem aperta Voltar no meio de uma edição.
- **Camadas** (`src/celular/camadas.js`, `useCamadaDeVoltar`): o painel aberto por toque empilha uma entrada, e o
  Voltar o fecha antes da tela. Ligadas: a folha de baixo, o painel flutuante da G2 (menos a dica de hover), o
  diálogo do Encontro, a Busca e a Aparência da G2, a ficha, o colega e a gaveta da Sala, e os dois diálogos do App.
  Ir para outra tela de dentro de um painel troca a entrada do painel, sem deixar painel morto no meio da pilha.
- **O rascunho do criador do Afty** (`afty-rascunho.js`): o pendente é gravado ao sair e no `pagehide`, porque o
  Voltar antes dos 600 ms da espera perdia a última edição. E o rascunho que acabou de passar pelo Salvar nunca é
  regravado: com o Voltar pelo histórico o criador ainda renderiza depois do Salvar, e sem essa marca o rascunho da
  ficha nova ficava vivo por cima da ficha salva (achado no teste desta etapa).
- **Medido** no build local (`.audit/app-celular/medicoes/e2-preview.json`): o Voltar da Ficha fica no site. No
  navegador: diálogo, criador, Salvar, Ficha, painel de Vida, recarregar e Encontro com diálogo, cada Voltar descendo
  um nível.

## O que a E3 mudou

- **Telas sob demanda** (`App.jsx`, S-23): os dois criadores, o rastreador e a biblioteca de modelos da 2.5.2, a lista
  de Encontros e o Encontro são baixados quando aparecem, por `telaSobDemanda` (`src/celular/sob-demanda.js`). A Ficha
  clássica também (`AftyFicha.jsx`). Enquanto chegam, a tela mostra "Carregando" (`src/celular/Carregando.jsx`).
- **Compêndio só no `/`** (`src/celular/usar-compendio.js`): as cinco enciclopédias (2,9 MB no build) iam no pacote de
  abertura de toda rota. Agora só o `/` as baixa, e a lista de lá espera elas chegarem para mostrar as Criaturas Base
  junto. A Guilda e o `/Player` nunca as baixam.
- **O fechamento da Sala** (`sala-fechamento`) entra só com conta, sob demanda.
- **"Nova Versão Disponível"** (`src/celular/TelaNovaVersao.jsx`): se o pedaço de uma tela não chega (o caso comum é um
  deploy novo com a página aberta, e o servidor não tem mais os pedaços da versão antiga), a tela vira o aviso com o
  botão Atualizar, em vez da tela de erro do app inteiro. Nunca recarrega sozinho.
- **`vercel.json`:** `/assets/*` (arquivos com hash no nome) com `max-age=31536000, immutable`, porque o nome muda a cada
  versão e a pessoa não precisa baixar de novo o que já tem. E a reescrita para o `index.html` deixou de cobrir
  `/assets/`: um pedaço que não existe dá 404 de verdade, e não o HTML do site servido como JavaScript.
- **A ordem dos módulos:** com o criador fora da abertura, a primeira porta do motor no navegador passou a ser a lista de
  Encontros. O `t-app-entradas.mjs` importa cada porta sozinha, em processo próprio, e todas as telas sob demanda
  foram abertas a frio no build local sem erro: a raiz com as 165 Criaturas Base, o rastreador, o criador da 2.5.2, os
  Modelos, a lista de Encontros, um Encontro, o criador do Afty, a Ficha G2 e a Ficha clássica.
- **Medido** (`.audit/app-celular/medicoes/e3-preview.json`, 375 px): a lista da Guilda caiu de 6.579 KB para 2.089 KB
  de JavaScript. O `index` do build caiu de 4,1 MB para 90 KB.
- **O que ainda pesa na lista:** o motor (cerca de 1,5 MB), que entra pela lista de Encontros no começo do `App.jsx`.
  Tirar isso é a fase B (E10).

## O que a E4 mudou

- **Manifesto** (`public/manifest.webmanifest`): "Era de Ouro", início e identidade em `/EraDeOuro`, escopo `/` (a Sala e
  os links do WhatsApp ficam dentro do app), tela cheia, cor `#060910`. Os ícones em `public/icons/` saem do selo aprovado
  pelo autor (`docs/app-celular/selo-era-de-ouro.svg`, gerados por `.audit/app-celular/gerar-icones.mjs`): 192 e 512,
  normal e mascarável, o SVG e o de 180 da Apple. O `vercel.json` serve o manifesto como `application/manifest+json`.
- **O segundo script do `index.html`** (o primeiro segue sendo o do título, que o `t-app-rotas` lê): guarda o pedido de
  instalação do Chrome em `window.__fmPedidoInstalar` em toda rota, porque ele chega uma vez só e às vezes antes do React,
  e avisa por `fm:instalavel` e `fm:instalado`. Em `/EraDeOuro`, e só nos hosts `fichafm.com.br`, `www.fichafm.com.br`,
  `localhost` e `127.0.0.1`, põe o manifesto, o ícone da Apple, os metas do app e troca o favicon pelo selo. O endereço
  antigo da Vercel nunca oferece instalar. `/`, `/Player` e `/Afty` também não.
- **O convite** (`src/celular/convite.js`, puro, e `ConviteInstalar.jsx`): um cartão embaixo da lista da Guilda,
  "Instalar o App Era de Ouro", com "Agora Não" e "Instalar". Aparece só na lista, no celular, fora do app, com o pedido do
  Chrome na mão, e não volta por 14 dias depois do "Agora Não". O registro mora em `fm_app_convite_aparelho_v1`, que pela
  regra `_aparelho_` nunca sobe para a nuvem. O cartão deixa 80 px livres à direita para o botão dos Livros.
- **iPhone:** desligado (`IOS_LIBERADO = false`). Com ele ligado, ou com `?convite-ios=1` num iPhone, o botão vira "Como
  Instalar" e abre a folha com os três passos do Safari e o aviso de que o app começa vazio até entrar na conta.
- **Sempre à mão:** "Instalar o App" no menu da Conta, em `/EraDeOuro`, quando há pedido (vai para o Mais na E8).
- **Ficou para a E5:** `viewport-fit=cover` e `interactive-widget=resizes-content` no viewport, que mudam o leiaute de
  todas as telas e pedem a medição da Ficha junto.
- **Medido** (`.audit/app-celular/medicoes/e4-preview.json`, 375 px): zero erro de instalação em `/EraDeOuro`
  (`Page.getInstallabilityErrors`), nenhum manifesto em `/`, `/Player` e `/Afty`. No navegador, em 375 px: o cartão
  aparece com o pedido, os dois botões têm 44 px, nenhuma rolagem lateral, o "Agora Não" grava e o cartão não volta com
  um pedido novo.

## O que a E5 mudou (parte 1)

- **O cabeçalho da Ficha G2 no celular** (`efeitos-g2.css`, bloco "O CABEÇALHO NO CELULAR"): voltar, retrato de 52 px, nome e
  linhagem numa linha cada com reticências, e os controles, numa fileira só. Os recursos com número de 22 px (18 px com quatro
  recursos ou mais, para a Vida de quatro dígitos da criatura caber numa fileira). O Agora (Combate, Rodada, Efeitos) cabe numa
  fileira até 360 px: os três acessos ficam mais justos e as espadas do Combate, que são enfeite, saem até 420 px. Nada sai do
  cabeçalho parado (`afty-ficha-final.md` §19), e o recolher ao rolar continua.
- **A barra de rolagens vira um botão na linha das abas** (`PainelDeRolagens` com `compacto`, ligado pela Ficha G2 com
  `useCelular`, decisão do autor de 2026-11-18): o dado, o total da última rolagem e a marca Van ou Des quando o modo não é o
  normal. Tocar abre o modo (DES, NOR, VAN), o histórico inteiro com a fórmula e o Limpar. A Ficha clássica e o computador seguem
  com a barra larga.
- **A folha do recurso** (`PainelVital` com `atalhos`, numa `FolhaInferior` que agora aceita `dentro` e `classe` para levar o
  tema): no celular, tocar em Vida, Energia, Alma, Preparo ou no recurso próprio abre a folha de baixo com o número grande e os
  atalhos −1 −5 −10 +1 +5 (`atalhosDoRecurso`, em `pecas-logica.js`), que usam os verbos do próprio painel (Dano e Cura, Gastar e
  Recuperar). O foco vai para a folha, nunca para o campo, então o teclado não sobe sozinho (D-88). O campo tem 16 px. O Voltar
  fecha a folha. No computador continua o painel flutuante.
- **Medido** (`.audit/app-celular/medicoes/e5-preview.json`): o cabeçalho parado caiu de 463 px (57%) para **271 px (33%)** em
  360, 375, 390 e 412 px, sem rolagem lateral. Rolado, só a linha das abas fica (47 px). A Vida −5 leva 2 toques, sem teclado.
  Uma ficha com Guarda, Titã ou Voo soma o painel próprio (o Ciel, com a Guarda, fica em 356 px), e ele também recolhe ao rolar.
- A parte 2 está na seção seguinte.

## O que a E5 mudou (parte 2)

- **A aba do Livro na borda também na G2** (`ficha.css`, decisão do autor de 2026-11-18): até 640 px o botão dos Livros fica
  fechado como uma aba de 28 px na borda direita, como já era na Ficha clássica. No computador continua redondo.
- **Os números da faixa fina viram botões** (`FinaG2` com `onAbrir`): quando a placa sai de vista, Vida, Energia, Alma e Preparo
  aparecem na faixa de 44 px abaixo das abas, e tocar num deles abre a mesma folha do recurso (`pedidoVital` do `AftyFichaG2` para
  o `CabecalhoG2`, atendido só no celular). Dano e Cura sem rolar de volta até a placa.
- **O palco mede pelo cabeçalho recolhido** (`--afty-ficha-topo-recolhido`, escrita pelo `AftyFichaG2` ao lado do
  `--afty-ficha-topo`): em Habilidades e Efeitos a lista ocupava 533 de 812 px e passou a ocupar 757. Com o palco à vista a página
  rola só até o cabeçalho recolher (o corpo e a camada de ambiente tinham a altura da tela inteira e a página rolava 51 px além,
  com o cabeçalho cobrindo a busca do palco). Nessas duas abas a faixa fina não aparece, porque a página não rola além do
  cabeçalho. Ela fica para as abas de lista longa.
- **Um texto de leitor de tela esticava a página** (`.e-so-leitor` do aviso de uma Habilidade): ancorado no palco, fora da lista
  que rola, ele ficava na altura da linha. Agora se ancora no próprio aviso.
- **O viewport do app** (`index.html`, só em `/EraDeOuro`): `viewport-fit=cover` e `interactive-widget=resizes-content`, para o
  teclado encolher a página e a folha subir junto com ele. A raiz ganha `data-fm-app`, e com ela as laterais recuam pela área
  segura no celular deitado (`celular.css`, D-89).
- **Medido** (`.audit/app-celular/medicoes/e5b-preview.json`): o cabeçalho continua em 271 px nas quatro larguras, sem rolagem
  lateral, instalável. No navegador em 375 px: o palco de 47 a 804 px com a busca à vista, a aba do Livro com 28 px à mostra, a
  faixa fina com botões de 44 px, a Vida de 194 para 189 com −5, o Voltar fechando a folha, e o mesmo recurso reabrindo. Em
  1280 px nada mudou (palco, Livro redondo, sem faixa fina).
- **A faixa fina segue o cabeçalho** (autor, 2026-11-19, "Seguir o Cabeçalho"): num tema com cabeçalho colorido e página clara
  (a prévia do Gojo) ela pintava o fundo da página com o texto do cabeçalho, claro sobre claro. Agora ela leva `.afty-cabecalho` e
  o nome de contrato `.afty-faixa-fina`, como a placa leva `.afty-placa`, e cada recurso leva as classes do recurso da placa
  (`.afty-vital`, `data-afty-vital`, rótulo e número). No Gojo a faixa ficou azul com as pastilhas brancas da placa. Sem tema (o
  Ciel) ela continua como era, sem cartão e sem o fio de luz. O guia de tema (`ficha-tema.js`, regra 15, superfícies e mapa da G2)
  ensina a mirar só nela.

## O que a E6 mudou

- **O cabeçalho do criador no celular** (`src/systems/afty/criador-celular/CabecalhoCelular.jsx`): até 720 px a linha de cima
  (Voltar, título, rascunho, Salvar) e a faixa de nove abas dão lugar a uma linha de 56 px: Voltar, o botão da seção atual e
  Salvar (ou Criar), com um ponto azul quando há rascunho guardado. O botão da seção abre a lista inteira numa folha de baixo
  (`NavegadorDeSecoes.jsx`), com as principais, o grupo Outros, o título do criador e o aviso do rascunho com o Descartar, que
  saíram do cabeçalho. Nada some.
- **A faixa de resumo** (`ResumoDoCriador.jsx`): presa logo abaixo, com Vida, o recurso (Energia ou Estamina), Defesa e CD, e o
  Anterior e o Próxima nas pontas (`secoes.js`: andam dentro do grupo, então o fim das principais não cai no Outros). Tocar num
  número abre a prévia inteira (`AftyPreview`) numa folha. Segurar mostra de onde ele vem. A prévia saiu do fluxo no celular,
  e é por isso que o campo Nome subiu.
- **A origem pelo toque longo** (`src/systems/afty/ui/fontes-toque.js`, D-82 e D-105): uma escuta no documento, só dentro de
  `[data-criador]` e só para toque. Segurar 450 ms num número com origem mostra o mesmo painel do hover, o clique do gesto é
  engolido, arrastar cancela, e o próximo toque fecha. O mouse continua no hover.
- **A camada de CSS** (`criador-celular/criador-celular.css`, toda regra começa em `[data-criador]`): o texto de 8 a 11 px sobe
  para 12 px (o rótulo em caixa alta para 11), o cabeçalho perde o vidro, os controles de toque ganham 36 px de altura, os
  botões quadrados pequenos crescem para 36 px nas duas direções, os segmentos de Treinado e Mestre (`VezesGauge`) viram
  quadrados de 36 px, o número com − e + deixa o campo encolher em vez dos botões, e o alocador de atributo da origem fica em uma
  coluna. No iPhone os campos têm 16 px.
- **No `AftyCreatureBuilder.jsx`, só ligação:** três imports, `data-criador` na raiz, `max-[720px]:hidden` na linha de cima, na
  faixa de abas e na prévia, o título num `const` (o mesmo texto), e a lista de seções com o `irParaSecao` (troca a aba e volta
  ao topo).
- **Medido** (`.audit/app-celular/medicoes/e6-preview.json`, a tela de abertura do criador de personagem, nas quatro larguras):
  o campo Nome de 1.225 para **206 px** do topo, o cabeçalho fixo de 150 para **105 px**, alvos abaixo de 36 px de 37 de 70 para
  **0 de 68**, rótulos abaixo de 11 px de 48 para **0**, frases abaixo de 12 px de 6 para 1 (o "Distribuir · Máx 2/Atributo",
  rótulo em caixa alta de 11 px). Sem rolagem lateral. A métrica "abas inteiras" do script ficou sem sentido no celular, porque
  a faixa de abas não aparece mais. Em 1280 px nada mudou.
- **A Carteira no celular** (aviso do autor no meio da etapa: "está sendo coberto"): a faixa de totais caiu de 460 para cerca de
  140 px (três colunas com o card estreito) e as linhas de sessão e de gasto viraram duas no telefone, sem cortar número.
  Detalhes em `docs/afty-carteira.md`.
- **Varrido seção por seção** em 375 px: nenhuma tem rolagem lateral. Oito ficaram sem alvo abaixo de 36 px. Sobram alvos
  estreitos em Perícias (37, a pontuação de Ofício e os rótulos de atributo entre parênteses), Aptidões (31, os níveis de 21 px de
  largura) e Equipamentos (17, o − e o + da quantidade com 20 px). Ficam em `docs/a-fazer.md`, junto da conversão das classes de
  texto miúdo.

## Protocolos de teste em aparelho real

**Android do autor (a cada etapa de tela)**
- instalar pelo convite e abrir frio em `/EraDeOuro`;
- Voltar na Ficha, no criador, nas folhas e na Sala;
- a conta já logada no app;
- o teclado numérico sem zoom;
- o link da Sala pelo WhatsApp;
- depois da E9: modo avião e o "Nova Versão" depois de um push.

**iPhone (amigos, iOS 16.4 ou mais novo)**
1. Entrar na conta pelo Safari.
2. Compartilhar, Adicionar à Tela de Início. Conferir nome e ícone.
3. Abrir pelo ícone: tela cheia, em `/EraDeOuro`, lista vazia.
4. Entrar com Google dentro do app, anotando onde a página do Google abre.
5. Conferir se as fichas chegam em 10 s.
6. Repetir com Discord.
7. Fechar e reabrir: continua logado?
8. Deslizar para voltar a partir de uma Ficha.
9. Entrar numa Sala por código, usar Editar e voltar.
10. Modo avião e reabrir.
11. Tocar nos campos: sem zoom.

O convite do iPhone só liga se os passos 4 a 7 passarem, ao menos com Google. Os resultados entram aqui.

## Como desligar cada peça

| Peça | Como desligar |
|---|---|
| Menu da Conta como folha | `CONSULTA_CELULAR` que nunca casa, ou revert do commit da E1 |
| O resto da E1 | revert do commit da E1 |
| A pilha de telas e as camadas (E2) | `PILHA_LIGADA = false` em `src/celular/pwa-config.js`: o App volta a trocar de tela só pelo estado do React |
| As telas sob demanda (E3) | revert do commit da E3 |
| O app instalável (E4) | tirar o `link("manifest", ...)` do segundo script do `index.html`: o site deixa de ser instalável e o convite some sozinho, porque o Chrome não entrega mais o pedido. Quem já instalou segue com o ícone, que abre o site |
| O convite do iPhone | `IOS_LIBERADO` em `src/celular/pwa-config.js` (hoje `false`) |
| A Ficha G2 no celular (E5) | revert do commit da E5. Só a aba do Livro na G2: voltar o `:not([data-afty-estrutura="g2"])` nas duas regras do `ficha.css`. Só o viewport: apagar o bloco `viewport-fit` do segundo script do `index.html`. Só a barra de rolagens: tirar o `compacto={celular}` do `AftyFichaG2.jsx`. Só a folha do recurso: trocar `celular` por `false` no `CabecalhoG2.jsx` |
| O criador no celular (E6) | revert do commit da E6. Só a camada de CSS: tirar o import de `criador-celular.css` do `CabecalhoCelular.jsx`. Só o toque longo: tirar o `useEffect` do `CabecalhoCelular.jsx` |

A E9 acrescenta a chave `SW_LIGADO` e o deploy de desligamento do service
worker.
