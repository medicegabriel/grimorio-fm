# M02: Motor: estágios, acúmulo, alvos e rastreabilidade

Execução de 2026-10-07, bloco G00, M01 a M05, P01, CMB-01 e CMB-02. Estado: **PARCIAL**, aguardando auditoria independente (`entregaEstavel.aguardaAuditoria`). Auditoria: NÃO EXECUTADA.

Fonte: `C:/Projetos/Grimorio/F&M 2.5.2 - Livro de Regras.md`, SHA-256 `1d0713d52c818a9ab9f47b883d9887a0d227d174d30ffcce358874669a7a733a`, páginas pelo último marcador. Base: commit `a0cefc29f32f6bd05e1617fc98014dbda2980483` com 48 arquivos rastreados alterados e os não rastreados preexistentes (lista em `bloco-2026-10-07/entrada/status.txt`), preservados.

Diagnóstico anterior (execução noturna, somente leitura): INCONCLUSIVO, com os achados confirmados por executor e auditor. Esta execução reproduziu os defeitos antes de corrigir (`bloco-2026-10-07/antes/`).

## Itens declarados

| Chave | Nome |
|---|---|
| `afty-efeitos.js::FAMILIAS_EXCLUSIVAS::@catalogo` | Famílias exclusivas |
| `afty-efeitos.js::FAMILIAS_EXCLUSIVAS::funcionamentoBasico` | Funcionamento Básico |
| `afty-efeitos.js::ESCOLHA_EFEITOS::@catalogo` | Efeitos das opções de escolha |
| `afty-efeitos.js::APICE_EFEITOS::@catalogo` | Efeitos das Ápices |
| `afty-sistema.js::DIVERGENCIAS::requisitoMulticlasse` | Divergência: requisito de Multiclasse |

## Parcelas

| Item | Parcela | Regra / Execução / Motor / Autoria | Evidência |
|---|---|---|---|
| `@catalogo` | rastreabilidade do atributo em dois estágios (M02-A02) | CONFIRMADA / COMPLETA / INTEGRADO / INTERFACE | NÃO VERIFICADA |
| `funcionamentoBasico` | Funcionamento global e Funcionamento por arma (M02-A01) | AGUARDA AUTOR / PARCIAL / INTEGRADO / INTERFACE | NÃO VERIFICADA |
| `@catalogo` | opção que não acumula entre fontes (mecanismo novo) | CONFIRMADA / COMPLETA / INTEGRADO / ADDON | NÃO VERIFICADA |
| `@catalogo` | leitura da jogada resolvida pelo Fluxo Invencível (M02-A03) | CONFIRMADA / COMPLETA / LÓGICA ESPECÍFICA / INACESSÍVEL | NÃO VERIFICADA |
| `requisitoMulticlasse` | divergência requisitoMulticlasse | AGUARDA AUTOR / PARCIAL / INTEGRADO / INACESSÍVEL | NÃO VERIFICADA |

## O que mudou e o que ficou

- **rastreabilidade do atributo em dois estágios (M02-A02)** (`afty-efeitos.js::FAMILIAS_EXCLUSIVAS::@catalogo`). Antes: +2 e +5 no hover de uma Força 15 (17). Depois: +2 e +3 com declarado 5. Pendente: O hover (PainelDeFontes) lê o valor novo; não conferido no navegador. O campo declarado ainda não é desenhado na tela.
- **Funcionamento global e Funcionamento por arma (M02-A01)** (`afty-efeitos.js::FAMILIAS_EXCLUSIVAS::funcionamentoBasico`). Somam: a chave exclusiva usa o alvo literal (danoBonus|*|+ e danoBonus|arm_x|+). Comportamento preservado. Pendente: Pergunta 4 de BLOCO-2026-10-07-perguntas (docs/a-fazer.md).
- **opção que não acumula entre fontes (mecanismo novo)** (`afty-efeitos.js::ESCOLHA_EFEITOS::@catalogo`). Implementado em coletarEfeitosDeEscolha; usado pelos oito Estilos.
- **leitura da jogada resolvida pelo Fluxo Invencível (M02-A03)** (`afty-efeitos.js::APICE_EFEITOS::@catalogo`). Número certo (t-fluxo-invencivel), mas montado por ramo próprio no derive; acerto está em VARS_ADIADAS. Pendente: Capacidade ausente registrada em docs/a-fazer.md (M02-A03-leitor-tardio). A regra do Ápice pertence ao lote dono.
- **divergência requisitoMulticlasse** (`afty-sistema.js::DIVERGENCIAS::requisitoMulticlasse`). Divergência ativa e listada; t-sistema atualizado. Pendente: Pergunta 1 de BLOCO-2026-10-07-perguntas. Divergência é escolha de código, sem autoria pelo jogador.

## Provas

Os testes do bloco estão em `asserts/t-revisao-*.mjs`. Cada parcela lista o comando e a evidência no `registro.json`. Provas marcadas FALHOU com o prefixo "ANTES da correção" registram a reprodução do defeito na árvore de entrada, e não falha atual.

## Não verificado

- Matriz completa das 142 chaves do M02 (estágios, escopos, leitores tardios, duplicações entre resolvedor e Motor).
- Hover do atributo no navegador.

## Pendências na fila única

- docs/a-fazer.md: BLOCO-2026-10-07-perguntas
- docs/a-fazer.md: M02-A03-leitor-tardio
- docs/a-fazer.md: ASSUNÇÃO: no pool do jogador, cada família de Invocação disputa só consigo mesma

## Revalidação

Mudanças em `afty-addons.js`, `afty-efeitos.js`, `afty-derive.js` e `AftyCreatureBuilder.jsx` são compartilhadas por todos os lotes do bloco. Qualquer prova antiga que tenha consultado esses arquivos (inclusive as do G00) precisa ser revalidada contra a versão do manifesto `entrega-sha256.json`.
