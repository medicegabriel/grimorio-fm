# P01: Progressão, características das classes e multiclasse

Execução de 2026-10-07, bloco G00, M01 a M05, P01, CMB-01 e CMB-02. Estado: **PARCIAL**, aguardando auditoria independente (`entregaEstavel.aguardaAuditoria`). Auditoria: NÃO EXECUTADA.

Fonte: `C:/Projetos/Grimorio/F&M 2.5.2 - Livro de Regras.md`, SHA-256 `1d0713d52c818a9ab9f47b883d9887a0d227d174d30ffcce358874669a7a733a`, páginas pelo último marcador. Base: commit `a0cefc29f32f6bd05e1617fc98014dbda2980483` com 48 arquivos rastreados alterados e os não rastreados preexistentes (lista em `bloco-2026-10-07/entrada/status.txt`), preservados.

Diagnóstico anterior (execução noturna, somente leitura): INCONCLUSIVO, com os achados confirmados por executor e auditor. Esta execução reproduziu os defeitos antes de corrigir (`bloco-2026-10-07/antes/`).

## Itens declarados

| Chave | Nome |
|---|---|
| `afty-especializacoes.js::AFTY_ESPECIALIZACOES::@catalogo` | Especializações |
| `afty-especializacoes.js::AFTY_ESPECIALIZACOES::lutador` | Lutador |
| `afty-especializacoes.js::AFTY_ESPECIALIZACOES::combatente` | Combatente |
| `afty-especializacoes.js::AFTY_ESPECIALIZACOES::conjurador` | Conjurador |
| `afty-especializacoes.js::AFTY_ESPECIALIZACOES::controlador` | Controlador |
| `afty-especializacoes.js::AFTY_ESPECIALIZACOES::suporte` | Suporte |

## Parcelas

| Item | Parcela | Regra / Execução / Motor / Autoria | Evidência |
|---|---|---|---|
| `lutador` | requisito de atributo da Multiclasse, jogador (player) | CONFIRMADA / COMPLETA / INTEGRADO / INTERFACE | NÃO VERIFICADA |
| `lutador` | requisito de atributo da Multiclasse, criatura (afty) | AGUARDA AUTOR / AUSENTE / INTEGRADO / INACESSÍVEL | NÃO VERIFICADA |
| `combatente` | requisito de atributo da Multiclasse, jogador (player) | CONFIRMADA / COMPLETA / INTEGRADO / INTERFACE | NÃO VERIFICADA |
| `combatente` | requisito de atributo da Multiclasse, criatura (afty) | AGUARDA AUTOR / AUSENTE / INTEGRADO / INACESSÍVEL | NÃO VERIFICADA |
| `conjurador` | requisito de atributo da Multiclasse, jogador (player) | CONFIRMADA / COMPLETA / INTEGRADO / INTERFACE | NÃO VERIFICADA |
| `conjurador` | requisito de atributo da Multiclasse, criatura (afty) | AGUARDA AUTOR / AUSENTE / INTEGRADO / INACESSÍVEL | NÃO VERIFICADA |
| `controlador` | requisito de atributo da Multiclasse, jogador (player) | CONFIRMADA / COMPLETA / INTEGRADO / INTERFACE | NÃO VERIFICADA |
| `controlador` | requisito de atributo da Multiclasse, criatura (afty) | AGUARDA AUTOR / AUSENTE / INTEGRADO / INACESSÍVEL | NÃO VERIFICADA |
| `suporte` | requisito de atributo da Multiclasse, jogador (player) | CONFIRMADA / COMPLETA / INTEGRADO / INTERFACE | NÃO VERIFICADA |
| `suporte` | requisito de atributo da Multiclasse, criatura (afty) | AGUARDA AUTOR / AUSENTE / INTEGRADO / INACESSÍVEL | NÃO VERIFICADA |
| `@catalogo` | PV por rolagem do dado de vida | AGUARDA AUTOR / PARCIAL / PARCIAL / INACESSÍVEL | NÃO VERIFICADA |

## O que mudou e o que ficou

- **requisito de atributo da Multiclasse, jogador** (`afty-especializacoes.js::AFTY_ESPECIALIZACOES::lutador`). Implementado: chip desligado com o motivo, aviso âmbar, derive.especializacoes.semRequisito.
- **requisito de atributo da Multiclasse, criatura** (`afty-especializacoes.js::AFTY_ESPECIALIZACOES::lutador`). Comportamento preservado: sem cobrança. Pendente: Pergunta 1 de BLOCO-2026-10-07-perguntas.
- **requisito de atributo da Multiclasse, jogador** (`afty-especializacoes.js::AFTY_ESPECIALIZACOES::combatente`). Implementado: chip desligado com o motivo, aviso âmbar, derive.especializacoes.semRequisito.
- **requisito de atributo da Multiclasse, criatura** (`afty-especializacoes.js::AFTY_ESPECIALIZACOES::combatente`). Comportamento preservado: sem cobrança. Pendente: Pergunta 1 de BLOCO-2026-10-07-perguntas.
- **requisito de atributo da Multiclasse, jogador** (`afty-especializacoes.js::AFTY_ESPECIALIZACOES::conjurador`). Implementado: chip desligado com o motivo, aviso âmbar, derive.especializacoes.semRequisito.
- **requisito de atributo da Multiclasse, criatura** (`afty-especializacoes.js::AFTY_ESPECIALIZACOES::conjurador`). Comportamento preservado: sem cobrança. Pendente: Pergunta 1 de BLOCO-2026-10-07-perguntas.
- **requisito de atributo da Multiclasse, jogador** (`afty-especializacoes.js::AFTY_ESPECIALIZACOES::controlador`). Implementado: chip desligado com o motivo, aviso âmbar, derive.especializacoes.semRequisito.
- **requisito de atributo da Multiclasse, criatura** (`afty-especializacoes.js::AFTY_ESPECIALIZACOES::controlador`). Comportamento preservado: sem cobrança. Pendente: Pergunta 1 de BLOCO-2026-10-07-perguntas.
- **requisito de atributo da Multiclasse, jogador** (`afty-especializacoes.js::AFTY_ESPECIALIZACOES::suporte`). Implementado: chip desligado com o motivo, aviso âmbar, derive.especializacoes.semRequisito.
- **requisito de atributo da Multiclasse, criatura** (`afty-especializacoes.js::AFTY_ESPECIALIZACOES::suporte`). Comportamento preservado: sem cobrança. Pendente: Pergunta 1 de BLOCO-2026-10-07-perguntas.
- **PV por rolagem do dado de vida** (`afty-especializacoes.js::AFTY_ESPECIALIZACOES::@catalogo`). pvDado declarado e validado; o PV usa sempre o valor fixo. Pendente: Pergunta 2 de BLOCO-2026-10-07-perguntas.

## Provas

Os testes do bloco estão em `asserts/t-revisao-*.mjs`. Cada parcela lista o comando e a evidência no `registro.json`. Provas marcadas FALHOU com o prefixo "ANTES da correção" registram a reprodução do defeito na árvore de entrada, e não falha atual.

## Não verificado

- As quatro contagens de perícias (pendência preexistente).
- Separação das CDs (decisão do autor: não fazer agora).
- Restringido: proibição da multiclasse não reexaminada nesta execução.
- Matriz das 493 chaves do P01.

## Pendências na fila única

- docs/a-fazer.md: BLOCO-2026-10-07-perguntas
- docs/a-fazer.md: Confirmar o total de perícias das quatro Classes que o autor não citou
- docs/a-fazer.md: A CD de Especialização e a CD Amaldiçoada são duas no livro

## Revalidação

Mudanças em `afty-addons.js`, `afty-efeitos.js`, `afty-derive.js` e `AftyCreatureBuilder.jsx` são compartilhadas por todos os lotes do bloco. Qualquer prova antiga que tenha consultado esses arquivos (inclusive as do G00) precisa ser revalidada contra a versão do manifesto `entrega-sha256.json`.
