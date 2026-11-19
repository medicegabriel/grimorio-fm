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
| E2 | Voltar do aparelho (histórico em todas as rotas) | |
| E3 | Carregamento leve, fase A (telas sob demanda) | |
| E4 | App instalável (manifesto, ícones, convite) | |
| E5 | Ficha no celular | |
| E6 | Criador no celular | |
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
| JS da lista da Guilda (descomprimido) | 6.581 KB | 2,6 MB ou menos (E3), 1,5 MB ou menos (E10) |
| JS ao abrir uma Ficha | 6.975 KB (+394 KB) | +0,6 MB ou menos |
| Cabeçalho da Ficha G2 | 463 px, 57% da tela (413 px, 51% em 412 px) | 35% ou menos |
| Número de Vida, Energia e Alma | 16,5 px | 22 px |
| Campo Nome do criador | a 1.225 px do topo | 300 px ou menos |
| Cabeçalho fixo do criador | 150 px | 56 px |
| Abas do criador inteiras na tela | 3 de 8 | navegador de seções |
| Alvos de toque abaixo de 36 px | lista 4 de 17, Ficha 17 de 54, criador 37 de 70 | nenhum |
| Rótulos abaixo de 11 px | lista 7, criador 48 | nenhum |
| Frases abaixo de 12 px | criador 6 | nenhuma |
| Título da lista | cortado ("E...") | inteiro |
| Voltar do celular | sai do site | fica no app |
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

As etapas seguintes acrescentam chaves próprias (`PILHA_LIGADA`, `SW_LIGADO`, `IOS_LIBERADO`) e o deploy de
desligamento do service worker.
