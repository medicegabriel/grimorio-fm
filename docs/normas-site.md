# Normas do Site

Escrito em 2026-11-12, a pedido do autor ("criar normas e orientaçoes para criaçao de addons e do site").

Norma de como o site é pensado, organizado, codado, testado e entregue. Soma-se a `AGENTS.md` e `CLAUDE.md`, que
continuam mandando. As regras de aparência estão em `docs/normas-design.md`, e as de pacote em
`docs/normas-addons.md`. Cada regra tem número (S-01) para ser citada.

## 1. Antes de escrever código

| Nº | Regra | Por quê |
|---|---|---|
| S-01 | Toda mudança começa pela pergunta de alcance: vale para a criatura, para o personagem, para uma mesa, ou para todos? | o código é um só, e o padrão é pegar todo mundo sem sintoma |
| S-02 | Regra de jogo ambígua vira pergunta ao autor antes do código, com opções fechadas e a recomendação primeiro. No máximo quatro perguntas por vez | perguntar depois custa refazer |
| S-03 | Rodar `npm run asserts` antes de começar e anotar a linha de base | nem todo vermelho é seu |
| S-04 | Ler as PERGUNTAS AO AUTOR de `docs/a-fazer.md` antes de "consertar" algo estranho | muita coisa estranha é decisão de regra |
| S-05 | Procurar quem já faz o cálculo antes de escrever outro. Uma regra tem um dono só | duas cópias divergem na primeira errata |
| S-06 | Escolher o caminho mais barato que resolve: addon, depois regra de mesa, depois verbo no motor, depois tela nova | o caminho caro tem mais chance de quebrar o que funciona |

## 2. Onde cada coisa mora

| O que é | Onde vai |
|---|---|
| Conteúdo de mesa (origem, talento, treino, arma) | `addons/<id>.json` |
| Regra que só uma mesa tem | `src/systems/<mesa>/`, atrás de `regraDaMesa` |
| Divergência entre criatura e personagem | `regraDo(sistema, chave)` com linha em `DIVERGENCIAS` |
| Catálogo e leitura de uma área do jogo | `src/systems/afty/afty-<área>.js` |
| Cálculo da ficha | `afty-derive.js` e os módulos que ele chama |
| Estado de jogo (Vida, PE, rodada) | a sessão, `ficha/ficha-sessao.js` |
| Tela de criação | `src/systems/afty/` (aba nova em arquivo próprio) |
| Tela de uso em jogo | `src/systems/afty/ficha/` |
| Peça de tela usada em mais de um lugar | `src/systems/afty/ui/` |
| Rota e porta entre os livros | `src/App.jsx` |
| O Grimório 2.5.2 | `src/components/`, somente leitura |

| Nº | Regra |
|---|---|
| S-10 | `src/components/` e as enciclopédias são somente leitura. Exceção nova só com o autor consultado antes, numa das três formas do `AGENTS.md`, e registrada lá no mesmo dia |
| S-11 | Nenhum `if` de rota ou de mesa solto no meio do cálculo. A decisão passa por `regraDo` ou `regraDaMesa` |
| S-12 | O sistema vem da FICHA (`rulesVersion`), nunca da rota. A rota só decide em que sistema uma ficha nova nasce |
| S-13 | Módulo novo de uma mesa vai na pasta da mesa, e não em `src/systems/afty/` |
| S-14 | Nunca um `import` no topo de módulo FOLHA. Se a folha precisa de dado de fora, a função nasce em quem já importa a folha |

## 3. Como o código é escrito

### 3.1 Forma

| Nº | Regra |
|---|---|
| S-20 | Função pura primeiro, React depois. O modelo fica num `.js` sem React, testável no Node, e a tela só desenha |
| S-21 | Arquivo novo de tela com no máximo 600 linhas, e de lógica com no máximo 1.500. Passou, parte antes de continuar |
| S-22 | Nada novo dentro do `AftyCreatureBuilder.jsx` além de ligação (importar e posicionar). Aba e painel novos nascem em arquivo próprio |
| S-23 | Tela pesada e pouco aberta entra sob demanda (`lazy`) |
| S-24 | Biblioteca nova só com o autor consultado. O projeto tem poucas dependências de propósito |
| S-25 | Nomes de função, variável e arquivo em português, como o resto do código. Arquivo de lógica em `kebab-case`, componente em `PascalCase` |
| S-26 | Arredondamento sempre para baixo, salvo o texto do livro mandar outro |

### 3.2 Dados

| Nº | Regra |
|---|---|
| S-30 | Toda chave nova do `localStorage` tem nome com versão (`fm_<coisa>_<dono>_v1`), um campo `versao` dentro e um normalizador que aceita lixo sem quebrar |
| S-31 | Leitura e gravação do armazenamento ficam em `try`. Falha de gravação aparece na tela ("Não foi possível gravar") |
| S-32 | Guarda-se a escolha, nunca o resultado. O número sai do `deriveAfty` toda vez |
| S-33 | Nada que o usuário guardou some calado. Recusa, corte e descarte aparecem com o motivo |
| S-34 | O que é de uma ficha viaja com ela no export (tema, addons, preferências). O que é do aparelho fica fora dela |
| S-35 | Mudança de formato de dado gravado tem migração de leitura: a ficha antiga abre, e não é reescrita até a pessoa salvar |
| S-36 | Cópia de ficha que entra por importação ganha id novo quando pode conviver com a original |

### 3.3 Motor

| Nº | Regra |
|---|---|
| S-40 | Todo número derivado novo sai com `partes`, e a parcela do Motor leva o nome de quem a gerou |
| S-41 | O que não cabe no Motor vira extensão do Motor (canal, variável, tipo de efeito), nunca texto que a tela só exibe |
| S-42 | Mexeu no Motor, na DSL ou em fórmula: atualizar `docs/automacao-dsl.md` e/ou `docs/afty-formulas-base.md` no mesmo lote |
| S-43 | Quem memoriza em cima de catálogo põe `epocaAddons()` na dependência |
| S-44 | Tela que mostra várias fichas aplica a UNIÃO dos addons uma vez, antes de derivar, e não um por ficha |
| S-45 | Script fora do app que deriva ficha chama `aplicarAddons` antes |

### 3.4 Comentários

| Nº | Regra |
|---|---|
| S-50 | Comentário diz o PORQUÊ e a armadilha, não o que a linha faz |
| S-51 | Decisão do autor citada no código leva a data e, quando couber, as palavras dele |
| S-52 | Pendência nunca fica só num comentário. Vai para `docs/a-fazer.md` |
| S-53 | Nenhum travessão U+2014, nem em comentário |

## 4. Testes

| Nº | Regra |
|---|---|
| S-60 | Regra de jogo nova nasce com assert no mesmo lote |
| S-61 | O assert importa `afty-derive.js` primeiro e compara com `t(nome, real, esperado)` |
| S-62 | Todo assert de regra tem a contraprova: o caso em que a regra NÃO vale dá o número antigo |
| S-63 | Assert não escreve no repositório e não depende de outro assert |
| S-64 | Antes de afirmar que um campo existe no derivado, olhar o derivado. Comparar campo que não existe passa vazio contra vazio |
| S-65 | Vermelho novo na suíte é seu até prova em contrário. Vermelho antigo fica anotado pelo nome no relatório |
| S-66 | Lentidão só se mede no build de produção (`npm run build` e `npm run preview`), nunca no `npm run dev` |

## 5. A lista de entrega

Em ordem. Nada é dado como pronto sem os oito.

1. `npx eslint` na área tocada, limpo.
2. `node asserts/t-ordem-modulos.mjs`, se algum `import` mudou.
3. `npx vite build`.
4. `npm run asserts` inteiro, com os vermelhos comparados à linha de base.
5. Navegador: o caminho feliz, o caso de erro e o caso vazio. Console sem erro.
6. Celular (375 px), quando a tela mudou.
7. Diff: sem U+2014, sem `src/components/` fora de exceção registrada, sem marcador de conflito.
8. Limpeza: dados de teste apagados, servidor desligado, entrada temporária removida.

## 6. Registro

| Nº | Regra |
|---|---|
| S-70 | Toda sessão que muda código fecha com uma entrada em `docs/afty-status.md`: o pedido nas palavras do autor, a tabela de decisões, o que mudou e o que foi verificado |
| S-71 | Pendência nova entra em `docs/a-fazer.md` no formato de lá (Onde, Situação, Precisa, Anotado). Resolvida, sai |
| S-72 | Guia de área (`docs/afty-<área>.md`) é atualizado quando o comportamento da área muda: contagem, caminho, estado |
| S-73 | Decisão tomada não é apresentada de novo como pergunta |
| S-74 | Assert novo ganha linha em `asserts/LEIA.md` |
| S-75 | Documento novo só quando há leitor para ele. Relatório de sessão solto não é documento |

## 7. Git e publicação

| Nº | Regra |
|---|---|
| S-80 | Commit e push são do autor, sempre. Entregam-se os comandos em PowerShell, um por bloco, começando por `cd D:\Git\grimorio-fm` |
| S-81 | Nenhuma linha de coautoria ou de atribuição a ferramenta em commit ou PR |
| S-82 | Mensagem no formato `tipo(área): o que mudou`, com `feat`, `fix`, `docs` ou `chore`. Um assunto por commit |
| S-83 | O push na `main` publica o site. O que não pode ir ao ar pela metade não é empurrado pela metade |
| S-84 | Motor e pacote que depende dele vão no mesmo push |
| S-85 | Relato de defeito minutos depois de um push: conferir primeiro se o deploy novo já está no ar |
| S-86 | Sincronizar a base só com a árvore limpa, sem edição concorrente |

## 8. O relatório de fim de tarefa

Curto, em português, na ordem:

1. **O que mudou**, em uma frase, e onde vale (criatura, personagem, mesa).
2. **O que foi feito**, por assunto.
3. **Verificação**, com os números (asserts, suíte, o que foi visto no navegador).
4. **Mudanças de passagem**, se houve.
5. **Pendências com o autor**, numeradas.
6. **Comandos**, um por bloco.

## 9. O que é proibido

1. Rodar `git commit` ou `git push`.
2. Editar `src/components/` ou as enciclopédias sem exceção registrada.
3. Supor regra de jogo.
4. Deixar número novo sem `partes` ou regra nova sem assert.
5. Texto explicativo solto no criador (dica, legenda, memória de cálculo).
6. HTML em campo de texto livre, ou `dangerouslySetInnerHTML`.
7. JavaScript dentro de addon.
8. Reabrir item descartado pelo autor (ver `AGENTS.md`).
