# M01: Motor: linguagem, variáveis, canais e validação

Execução de 2026-10-07, bloco G00, M01 a M05, P01, CMB-01 e CMB-02. Estado: **PARCIAL**, aguardando auditoria independente (`entregaEstavel.aguardaAuditoria`). Auditoria: NÃO EXECUTADA.

Fonte: `C:/Projetos/Grimorio/F&M 2.5.2 - Livro de Regras.md`, SHA-256 `1d0713d52c818a9ab9f47b883d9887a0d227d174d30ffcce358874669a7a733a`, páginas pelo último marcador. Base: commit `a0cefc29f32f6bd05e1617fc98014dbda2980483` com 48 arquivos rastreados alterados e os não rastreados preexistentes (lista em `bloco-2026-10-07/entrada/status.txt`), preservados.

Diagnóstico anterior (execução noturna, somente leitura): INCONCLUSIVO, com os achados confirmados por executor e auditor. Esta execução reproduziu os defeitos antes de corrigir (`bloco-2026-10-07/antes/`).

## Itens declarados

| Chave | Nome |
|---|---|
| `afty-dsl.js::NOMES_DE_FUNCAO::@catalogo` | Funções e linguagem da DSL |
| `afty-efeitos.js::EFEITO_CANAIS::@catalogo` | Catálogo de canais do Motor |
| `afty-efeitos.js::EFEITO_CANAIS::vantagemAtaque` | Vantagem no Ataque |
| `afty-efeitos.js::EFEITO_CANAIS::dadosPericia` | Dados em Perícia |
| `afty-efeitos.js::EFEITO_CANAIS::dadosNomeados` | Dados de Dano (tamanho próprio) |
| `afty-efeitos.js::EFEITO_CANAIS::dadosTR` | Dados em Resistência |
| `afty-efeitos.js::EFEITO_CANAIS::dadosAtaque` | Dados em Jogada de Ataque |
| `afty-efeitos.js::EFEITO_CANAIS::peTemporario` | PE Temporário |
| `dominio-contextual::alvos-motor` | Vocabulários de alvo do Motor |

## Parcelas

| Item | Parcela | Regra / Execução / Motor / Autoria | Evidência |
|---|---|---|---|
| `@catalogo` | literal numérico malformado (M01-VAL-01) | CONFIRMADA / COMPLETA / INTEGRADO / INTERFACE | NÃO VERIFICADA |
| `@catalogo` | valor não finito no contexto (M01-NUM-01) | CONFIRMADA / COMPLETA / INTEGRADO / INTERFACE | NÃO VERIFICADA |
| `@catalogo` | variável opt_ de Aptidão de addon (M01-VAR-01) | CONFIRMADA / COMPLETA / INTEGRADO / ADDON | NÃO VERIFICADA |
| `@catalogo` | colisão de variável depois da normalização (M01-VAR-02) | CONFIRMADA / COMPLETA / INTEGRADO / ADDON | NÃO VERIFICADA |
| `@catalogo` | portão de instalação de efeito de pacote (M01-VAL-02 e M04-A01) | CONFIRMADA / COMPLETA / INTEGRADO / ADDON | NÃO VERIFICADA |
| `@catalogo` | persistência do editor de efeitos (M01-PERSIST-01) | CONFIRMADA / COMPLETA / INTEGRADO / INTERFACE | NÃO VERIFICADA |
| `dadosPericia` | alvo obrigatório e seletor no editor visual (M01-UI-01 e M04-A02) | CONFIRMADA / COMPLETA / INTEGRADO / INTERFACE | NÃO VERIFICADA |
| `dadosNomeados` | alvo obrigatório e seletor no editor visual (M01-UI-01 e M04-A02) | CONFIRMADA / COMPLETA / INTEGRADO / INTERFACE | NÃO VERIFICADA |
| `dadosTR` | alvo obrigatório e seletor no editor visual (M01-UI-01 e M04-A02) | CONFIRMADA / COMPLETA / INTEGRADO / INTERFACE | NÃO VERIFICADA |
| `dadosAtaque` | alvo obrigatório e seletor no editor visual (M01-UI-01 e M04-A02) | CONFIRMADA / COMPLETA / INTEGRADO / INTERFACE | NÃO VERIFICADA |
| `peTemporario` | alvo obrigatório e seletor no editor visual (M01-UI-01 e M04-A02) | CONFIRMADA / COMPLETA / INTEGRADO / INTERFACE | NÃO VERIFICADA |
| `vantagemAtaque` | canal novo de vantagem e desvantagem na jogada de ataque | CONFIRMADA / COMPLETA / INTEGRADO / INTERFACE | NÃO VERIFICADA |
| `alvos-motor` | vocabulários de alvo tipoDano, dadoNomeado, gatilho e custo no editor (M01-UI-01 e M04-A02) | CONFIRMADA / COMPLETA / INTEGRADO / INTERFACE | NÃO VERIFICADA |

## O que mudou e o que ficou

- **literal numérico malformado (M01-VAL-01)** (`afty-dsl.js::NOMES_DE_FUNCAO::@catalogo`). Antes: tokenizado como 1.2, aceito calado. Depois: 'Número malformado', fallback.
- **valor não finito no contexto (M01-NUM-01)** (`afty-dsl.js::NOMES_DE_FUNCAO::@catalogo`). Antes: evalBoolean(Infinity) era true. Depois: fallback nos dois; NaN segue zero.
- **variável opt_ de Aptidão de addon (M01-VAR-01)** (`afty-dsl.js::NOMES_DE_FUNCAO::@catalogo`). Antes: opt_mesa:foco_eco, intokenizável. Depois: opt_mesa_x_foco_eco declarado a zero e ligado pela escolha.
- **colisão de variável depois da normalização (M01-VAR-02)** (`afty-dsl.js::NOMES_DE_FUNCAO::@catalogo`). Antes: nenhum relato. Depois: problema '(variáveis da DSL)' na aplicação; os 51 addons do repositório não colidem. Pendente: Tela: o relato aparece na lista de problemas da aba Addons; não conferido no navegador nesta execução.
- **portão de instalação de efeito de pacote (M01-VAL-02 e M04-A01)** (`afty-efeitos.js::EFEITO_CANAIS::@catalogo`). Antes: só presença de canal e expr. Depois: conferência completa, também na Técnica de Estilo; 51 addons aceitos.
- **persistência do editor de efeitos (M01-PERSIST-01)** (`afty-efeitos.js::EFEITO_CANAIS::@catalogo`). Antes: o Funcionamento perdia semCredito e a Habilidade Única perdia também quando e duracao. Depois: lista única em efeitoGravavel.
- **alvo obrigatório e seletor no editor visual (M01-UI-01 e M04-A02)** (`afty-efeitos.js::EFEITO_CANAIS::dadosPericia`). Antes: canal selecionável sem controle de alvo. Depois: seletor duplo (perícia e dado), grava percepcao:d4 e o derive soma {faces 6, qtd 1} em Atletismo.
- **alvo obrigatório e seletor no editor visual (M01-UI-01 e M04-A02)** (`afty-efeitos.js::EFEITO_CANAIS::dadosNomeados`). Antes: canal selecionável sem controle de alvo. Depois: seletor sem 'todos', primeiro alvo ao trocar de canal.
- **alvo obrigatório e seletor no editor visual (M01-UI-01 e M04-A02)** (`afty-efeitos.js::EFEITO_CANAIS::dadosTR`). Antes: canal selecionável sem controle de alvo. Depois: seletor sem 'todos', primeiro alvo ao trocar de canal.
- **alvo obrigatório e seletor no editor visual (M01-UI-01 e M04-A02)** (`afty-efeitos.js::EFEITO_CANAIS::dadosAtaque`). Antes: canal selecionável sem controle de alvo. Depois: seletor sem 'todos', primeiro alvo ao trocar de canal.
- **alvo obrigatório e seletor no editor visual (M01-UI-01 e M04-A02)** (`afty-efeitos.js::EFEITO_CANAIS::peTemporario`). Antes: canal selecionável sem controle de alvo. Depois: seletor sem 'todos', primeiro alvo ao trocar de canal.
- **canal novo de vantagem e desvantagem na jogada de ataque** (`afty-efeitos.js::EFEITO_CANAIS::vantagemAtaque`). Implementado: canal, consumidor por linha (vantagemAtaque com fontes), modoCombinado na rolagem, chip na linha. Primeiro cliente: Preciso. Pendente: O Feitiço com jogada de ataque rola por outro caminho e não lê o canal; depende da pergunta 7 de BLOCO-2026-10-07-perguntas. Autoria do canal pelo editor visual não exercitada no navegador; o percurso do Motor foi provado pelo Preciso.
- **vocabulários de alvo tipoDano, dadoNomeado, gatilho e custo no editor (M01-UI-01 e M04-A02)** (`dominio-contextual::alvos-motor`). Tipos de dano (15, com 'todos'), d3 a d12 (sem 'todos'), Uma Vez no Combate e Toda Rodada (sem 'todos'), os cinco gastos (com 'todos').

## Provas

Os testes do bloco estão em `asserts/t-revisao-*.mjs`. Cada parcela lista o comando e a evidência no `registro.json`. Provas marcadas FALHOU com o prefixo "ANTES da correção" registram a reprodução do defeito na árvore de entrada, e não falha atual.

## Não verificado

- Matriz semântica completa das 345 chaves do M01 (canais, grupos, referências, estágios e escopos): só as parcelas acima foram examinadas nesta execução.
- Paridade fm-dsl da 2.5.2 para os casos novos: a 2.5.2 segue com o avaliador dela e não foi alterada (somente leitura).

## Pendências na fila única

- docs/a-fazer.md: BLOCO-2026-10-07-perguntas

## Revalidação

Mudanças em `afty-addons.js`, `afty-efeitos.js`, `afty-derive.js` e `AftyCreatureBuilder.jsx` são compartilhadas por todos os lotes do bloco. Qualquer prova antiga que tenha consultado esses arquivos (inclusive as do G00) precisa ser revalidada contra a versão do manifesto `entrega-sha256.json`.
