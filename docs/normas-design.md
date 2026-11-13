# Normas de Design

Escrito em 2026-11-12, a pedido do autor ("no design instrua a partir de normas e regras para criaçao e
idealizaçao").

Norma de como uma tela é IDEALIZADA (antes de existir) e CRIADA (como é desenhada e escrita). Vale para toda
tela nova do Afty, da Ficha de Jogador e das mesas. O Grimório 2.5.2 (`src/components/`) é somente leitura e
fica fora, salvo decisão do autor. As regras de UI que o `CLAUDE.md` já traz continuam valendo, e estão
repetidas aqui onde importam. Cada regra tem número (D-01).

## 1. O que o site é, em uma frase

**Uma ferramenta de mesa: quem usa está no meio de uma sessão de jogo, com pressa, muitas vezes no celular.**

Disso saem os cinco princípios. Quando duas regras brigarem, vence a que vem antes.

| Nº | Princípio | O que significa na prática |
|---|---|---|
| D-01 | O número certo, rápido | Vida, PE, Defesa e o que se rola aparecem sem clique e sem rolagem |
| D-02 | A tela mostra, não ensina | resultado e aviso de problema real na tela. Regra e origem do número no hover |
| D-03 | Uma coisa parece a mesma em todo lugar | a barra de Vida da Ficha é a do Encontro e a da Mesa do Mestre. Peça igual, componente igual |
| D-04 | O tema é do jogador | toda cor passa por variável, para a ficha "bonitinha" dele continuar bonita |
| D-05 | Calmo | escuro, pouco movimento, uma cor de destaque por vez. Só o perigo real chama atenção |

## 2. Idealização: antes de desenhar

Nenhuma tela começa pelo código. Começa por estas sete respostas, escritas em poucas linhas no pedido ou na
conversa com o autor.

| Nº | Pergunta | Exemplo (Mesa do Mestre) |
|---|---|---|
| D-10 | **Quem** usa, e em que momento da sessão? | o mestre, durante a luta |
| D-11 | **Qual a única tarefa** que a tela tem de deixar fácil? | tirar Vida e PE de vários de uma vez |
| D-12 | **O que precisa estar à vista** sem clique? | nome, Vida, PE, quem caiu |
| D-13 | **Quais são os verbos?** No máximo sete na tela | Dano, Metade, Cura, Gastar PE, Recuperar PE, Descansar, Tirar |
| D-14 | **De onde vêm os dados** e onde ficam gravados? | a lista da Guilda e arquivos importados, sessão da Ficha |
| D-15 | **O que já existe** que faz parte disso? | a barra `Vital`, os verbos da sessão, o visual dos Encontros |
| D-16 | **O que fica de fora**, de propósito? | iniciativa (é do Encontro), histórico, desfazer |

Depois das respostas, três passos:

1. **Esboço em texto.** Uma lista das regiões da tela de cima para baixo, com o que cada uma mostra. Sem cor
   e sem código.
2. **Os cinco estados** (seção 7) de cada região, também em texto.
3. **Perguntas ao autor** sobre o que o esboço não resolve: onde fica a entrada, o que é opcional. No máximo
   quatro, com a recomendação primeiro.

| Nº | Regra |
|---|---|
| D-17 | Recurso "legal de ter" entra como opção numa pergunta ao autor, nunca por conta própria |
| D-18 | Toda tela nova nomeia o que ela NÃO faz. Tela sem limite cresce até ninguém achar nada |
| D-19 | Antes de criar uma peça, procurar em `ui/` e na Ficha. Peça nova só quando nenhuma serve, e ela nasce em `ui/` se for servir a duas telas |

## 3. Estrutura da tela

| Nº | Regra |
|---|---|
| D-20 | Uma tela tem UMA ação principal, e só ela usa o tom de destaque. As outras são botões comuns |
| D-21 | Ordem de leitura: quem é, como está (Vida, PE), o que pode fazer, o resto. O mais usado em jogo fica em cima |
| D-22 | Cabeçalho de página: voltar à esquerda, título e contagem no meio, ações à direita. No celular as ações descem para uma linha própria |
| D-23 | Conteúdo agrupado por significado, com título de grupo e contagem (Jogadores 3, Criaturas 5) |
| D-24 | Ação sobre vários itens aparece numa barra fixa embaixo só quando há seleção, e some sem ela |
| D-25 | Ação destrutiva fica afastada das outras e pede confirmação quando não tem volta. A confirmação diz o que some e o que fica |
| D-26 | Largura máxima do conteúdo: `max-w-7xl`. Grade de cartões: 1 coluna no celular, 2 a partir de `sm`, 3 a partir de `lg` |
| D-27 | Peça que também aparece dentro de outra tela (aba da Ficha dentro do Encontro) mede por `@container`, e não pela largura da janela |
| D-28 | Painel por cima da tela (diálogo) fecha no Esc e no clique fora, e põe o foco no primeiro campo ou no botão seguro |

## 4. Cor

A cor tem significado fixo. Usar uma cor fora do significado dela é erro.

| Token | Significado | Nunca usar para |
|---|---|---|
| `--afty-destaque` | a marca: ação principal, aba ativa, foco, selecionado | perigo ou sucesso |
| `--afty-pv` | Vida e dano | erro de formulário |
| `--afty-pe` | Energia e custo | link ou informação |
| `--afty-alma` | Alma | destaque genérico |
| `--afty-cura` | cura e confirmação de que deu certo | botão principal |
| `--afty-aviso` | problema real que pede atenção | enfeite ou rótulo |
| `--afty-pvtemp`, `--afty-petemp` | a casca temporária por cima da barra | qualquer outra coisa |
| `--afty-texto`, `-suave`, `-fraco` | três níveis de importância do texto | |
| `--afty-fundo`, `--afty-card`, `--afty-poco` | três profundidades: página, cartão, campo | |
| `--afty-borda`, `--afty-borda-forte`, `--afty-borda-controle` | divisor, borda de cartão, borda de controle | |

| Nº | Regra |
|---|---|
| D-30 | Tela nova usa só os tokens `--afty-*`. Classe de cor fixa do Tailwind (`bg-slate-800`, `text-purple-300`) é proibida em tela nova |
| D-31 | Cor nova vira token: entra em `ficha.css` e no `TOKENS_DOC` de `ficha-tema.js`, com o que ela pinta. Um assert reprova a divergência |
| D-32 | Cor nunca é a única pista. Estado importante leva também ícone ou palavra (Caído, Morto, Selecionado) |
| D-33 | Âmbar é só para problema real. Vaga não gasta, campo opcional e "ainda não fez" não são problema |
| D-34 | Vermelho pulsando é só da Vida abaixo de um quarto. Nada mais pisca |
| D-35 | Contraste mínimo de 4,5 para texto e de 3 para borda de controle, medido nos cinco temas (Padrão, Pergaminho, Sangue, Abissal, Terminal) |
| D-36 | Véu, sombra e brilho também são tokens. Um véu preto fixo empasta um tema claro |

## 5. Texto e tipografia

### 5.1 Tamanhos

| Uso | Tamanho | Peso |
|---|---|---|
| Título de página | 20 px | negrito |
| Título de grupo ou de cartão | 14 a 16 px | negrito |
| Texto de regra e descrição | 12 a 13 px | normal |
| Rótulo pequeno em maiúsculas | 11 px, com espaçamento de letra | negrito |
| Número principal (Vida, PE) | 22 px, fonte de números | negrito |
| Número secundário | 12 a 14 px, fonte de números | normal |

| Nº | Regra |
|---|---|
| D-40 | Mínimo de 11 px para rótulo e 12 px para qualquer texto que se lê em frase. Nada de 10 px em tela nova |
| D-41 | Número usa `--afty-fonte-num` (monoespaçada). Texto usa `--afty-fonte`. Título usa `--afty-fonte-titulo` |
| D-42 | Número ao lado de texto assenta na mesma base (`afty-base`), e ícone e botão voltam para o centro |
| D-43 | Texto longo de catálogo respeita parágrafo (`whitespace-pre-line`) e tem linha de 60 a 90 caracteres |
| D-44 | Nome que não cabe é cortado com reticências e mostra o nome inteiro no hover. Nunca quebra o leiaute |

### 5.2 Escrita

| Nº | Regra |
|---|---|
| D-50 | Rótulo, chip, botão e interruptor em Title Case, com conectores curtos em minúscula ("Tirar da Mesa", "Dano pela Metade") |
| D-51 | Sem travessão e sem ponto e vírgula em texto de tela. Vírgula, dois-pontos e parênteses servem |
| D-52 | Botão é verbo no infinitivo ou verbo mais objeto ("Importar Fichas", "Descansar"). Nunca "OK" ou "Sim" sozinho numa ação destrutiva |
| D-53 | Sem texto explicativo solto: nada de dica, legenda ensinando regra ou memória de cálculo cinza |
| D-54 | A origem de um número vai no hover de fontes (`PainelDeFontes`). Descrição de catálogo vai no `DicaDeTexto`, nunca no `title` nativo |
| D-55 | Aviso diz o que aconteceu e, se houver, o que fazer. Em frase curta, sem ponto final quando for uma linha só |
| D-56 | Tela vazia diz o que falta e oferece a ação que resolve ("Nenhuma ficha na mesa" e os dois botões) |
| D-57 | O vocabulário é o do jogo e o da mesa: Vida ou PV, Energia ou PE, Nível para personagem e ND para criatura. Uma palavra por coisa na mesma tela |
| D-58 | Singular e plural certos ("1 ficha", "2 fichas"). Nada de "ficha(s)" em tela nova |
| D-59 | Texto livre do usuário é marcação (`afty-texto-rico.js`), nunca HTML |

## 6. Peças

Usar as que existem. A lista abaixo é o que uma tela nova tem à mão.

| Peça | Classe ou componente | Para quê |
|---|---|---|
| Página | `afty-ficha min-h-screen` | o fundo e os tokens |
| Cabeçalho | `afty-cabecalho` | topo fixo da página |
| Cartão | `afty-card` | um bloco de conteúdo |
| Linha | `afty-linha` | item dentro de cartão, campo de busca |
| Botão | `afty-botao`, com `data-afty-tom="destaque"`, `"dano"` ou `"cura"` | ação com texto |
| Passo | `afty-passo` | botão pequeno só com ícone ou sinal |
| Chip | `afty-chip`, com `data-afty-tom="aviso"` ou `"destaque"` | rótulo CURTO de valor fixo |
| Rótulo | `afty-rotulo` | texto secundário e condição escrita em frase |
| Campo | `afty-campo` | entrada de texto |
| Barra de recurso | `Vital` (`ui/vital.jsx`) | Vida, PE, Alma, com a casca temporária |
| Número com origem | `NumeroComFontes` (`ui/fontes.jsx`) | todo número derivado |
| Dica | `DicaDeTexto` (`ui/fontes.jsx`) | descrição de catálogo no hover |
| Texto do usuário | `TextoRico` (`ui/TextoRico.jsx`) | campo de texto livre |
| Ícone | `lucide-react` | todo ícone |

| Nº | Regra |
|---|---|
| D-60 | Chip é só para rótulo curto de valor fixo. Condição em frase sai como texto puro (`afty-rotulo`) |
| D-61 | Ícone é do lucide, em 12, 14 ou 16 px. Aviso usa `<AlertTriangle/>`, nunca o caractere U+26A0 |
| D-62 | Botão só com ícone tem `aria-label` e `title`. Ícone ao lado de texto tem `aria-hidden` |
| D-63 | Um ícone, um significado em todo o site: X tira ou fecha, lixeira apaga, seta em círculo atualiza, coroa é o mestre |
| D-64 | Margem ou tamanho que "não obedece" em `h1`, `h2`, `p` ou `code` se resolve com o sufixo `!` (`m-0!`), nunca editando o `index.css` |
| D-65 | Espaçamento em múltiplos de 4 px. Entre cartões 12 px, dentro do cartão 12 px, entre grupos 20 px |
| D-66 | Raio de `--afty-raio` em cartão e de `--afty-raio-peq` em botão, linha e campo |

## 7. Os cinco estados

Toda região de tela é desenhada nos cinco. Faltou um, a tela não está pronta.

| Estado | O que se desenha |
|---|---|
| **Vazio** | o que falta e a ação que resolve |
| **Normal** | o caso comum |
| **Cheio** | muitos itens, nome longo, número grande. Nada estoura nem empurra o vizinho |
| **Erro** | o que deu errado, com o ícone de aviso, perto de onde aconteceu |
| **Indisponível** | controle apagado (opacidade 40 a 50%) quando não pode ser usado agora, sem sumir do lugar |

| Nº | Regra |
|---|---|
| D-70 | Controle que depende de outro (valor para aplicar Dano) fica desabilitado até poder, em vez de falhar no clique |
| D-71 | Seleção tem três sinais: borda de destaque, caixa marcada e a contagem na barra de ação |
| D-72 | Foco de teclado sempre visível. Enter confirma a ação principal do campo e Esc cancela ou limpa |
| D-73 | Falha de gravação aparece no topo da página e fica até a pessoa ver |
| D-74 | Resultado de uma ação em lote é dito em uma linha ("2 fichas entraram na mesa. 1 de outro grimório ficou de fora") |

## 8. Celular e toque

| Nº | Regra |
|---|---|
| D-80 | Toda tela nova é conferida em 375 px de largura, sem rolagem lateral |
| D-81 | Alvo de toque com pelo menos 36 px de lado |
| D-82 | Nada depende só de hover no celular: o que o hover mostra tem outro caminho por toque |
| D-83 | Barra fixa embaixo deixa espaço no fim da página, para o último item não ficar coberto |
| D-84 | Título de página não quebra em várias linhas. As ações é que descem |
| D-85 | Campo numérico usa `inputMode="numeric"`, para abrir o teclado de números |

## 9. Movimento

| Nº | Regra |
|---|---|
| D-90 | Transição só em mudança de estado que a pessoa causou: barra que encolhe, painel que abre, borda no hover |
| D-91 | Duração de 120 a 200 ms. Nada de animação de entrada em lista, nem de número contando |
| D-92 | Respeitar `prefers-reduced-motion`: com ele ligado, só troca de cor |

## 10. Tema

| Nº | Regra |
|---|---|
| D-100 | A Ficha é pintada por variável `--afty-*`, e é isso que torna o tema possível. Cor fixa em peça da Ficha quebra o tema de alguém |
| D-101 | O tema mora na ficha (`creature.aparencia`) e viaja no export, em quatro camadas: preset, formulário, imagem, CSS livre |
| D-102 | Peça nova da Ficha é conferida nos cinco presets e com uma imagem de fundo |
| D-103 | Mudar o nome de uma classe `afty-*` ou de um token quebra o CSS livre de quem já fez tema. Só com aviso ao autor e nota no guia da Ficha |
| D-104 | Imagem de terceiros não entra no repositório sem o autor dizer de onde veio |

## 11. Revisão de uma tela (antes de entregar)

Responder sim a todas.

1. A tarefa principal (D-11) se faz em até três toques?
2. O que precisa estar à vista (D-12) está, sem rolagem, em 375 px?
3. Só uma ação usa o destaque?
4. Os cinco estados existem?
5. Toda cor é token, e cada uma no significado dela?
6. Todo rótulo está em Title Case, sem travessão e sem ponto e vírgula?
7. Não há texto ensinando regra na tela?
8. Todo número derivado mostra a origem no hover?
9. As peças são as que já existem?
10. Funciona só com teclado, e todo botão de ícone tem nome?
11. Passou nos cinco temas?
12. O console está limpo?

## 12. Quando usar as skills de design

As skills (`frontend-design`, `emil-design-eng`, `design-review`, `design-deslop`) só rodam a pedido do autor, e
ficam ABAIXO destas normas. Se uma skill sugerir fonte externa, biblioteca nova, animação de entrada ou cor
fora dos tokens, a norma vence e a sugestão vira pergunta ao autor.
