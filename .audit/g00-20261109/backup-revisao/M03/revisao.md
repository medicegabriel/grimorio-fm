# M03: Motor: ativação, eventos, custos, usos e duração

Execução de 2026-10-07, bloco G00, M01 a M05, P01, CMB-01 e CMB-02. Estado: **PARCIAL**, aguardando auditoria independente (`entregaEstavel.aguardaAuditoria`). Auditoria: NÃO EXECUTADA.

Fonte: `C:/Projetos/Grimorio/F&M 2.5.2 - Livro de Regras.md`, SHA-256 `1d0713d52c818a9ab9f47b883d9887a0d227d174d30ffcce358874669a7a733a`, páginas pelo último marcador. Base: commit `a0cefc29f32f6bd05e1617fc98014dbda2980483` com 48 arquivos rastreados alterados e os não rastreados preexistentes (lista em `bloco-2026-10-07/entrada/status.txt`), preservados.

Diagnóstico anterior (execução noturna, somente leitura): INCONCLUSIVO, com os achados confirmados por executor e auditor. Esta execução reproduziu os defeitos antes de corrigir (`bloco-2026-10-07/antes/`).

## Itens declarados

| Chave | Nome |
|---|---|
| `afty-combate.js::COMBATE_ESTADOS::@catalogo` | Estados de combate |
| `afty-combate.js::COMBATE_ESTADOS::armasAbsolutas` | Armas Absolutas (estado) |
| `afty-combate.js::COMBATE_ESTADOS::invencivelSobOSol` | Invencível sob o Sol (estado) |
| `afty-combate.js::COMBATE_ESTADOS::golpePreciso` | Golpe Especial · Preciso (estado) |
| `afty-combate.js::COMBATE_VARS::golpe_preciso` | Variável golpe_preciso |

## Parcelas

| Item | Parcela | Regra / Execução / Motor / Autoria | Evidência |
|---|---|---|---|
| `@catalogo` | controles de estado de addon (M03-D07 e M04-A03) | CONFIRMADA / COMPLETA / INTEGRADO / ADDON | NÃO VERIFICADA |
| `@catalogo` | transação genérica de usar uma habilidade (M03-D01) | AGUARDA AUTOR / PARCIAL / CAPACIDADE AUSENTE / ADDON | NÃO VERIFICADA |
| `armasAbsolutas` | custo, manutenção e expiração | AGUARDA AUTOR / PARCIAL / PARCIAL / INACESSÍVEL | NÃO VERIFICADA |
| `invencivelSobOSol` | Condenado no custo de ativação e manutenção | AGUARDA AUTOR / PARCIAL / LÓGICA ESPECÍFICA / INACESSÍVEL | NÃO VERIFICADA |
| `golpePreciso` | Preciso como estado de bancada | CONFIRMADA / COMPLETA / INTEGRADO / INTERFACE | NÃO VERIFICADA |
| `golpe_preciso` | variável da DSL | CONFIRMADA / COMPLETA / INTEGRADO / INTERFACE | NÃO VERIFICADA |

## O que mudou e o que ficou

- **controles de estado de addon (M03-D07 e M04-A03)** (`afty-combate.js::COMBATE_ESTADOS::@catalogo`). Antes: descartados. Depois: transportados, validados e consumidos por alteraEstadoCombate; custoPE exibido. Pendente: A aba Buffs com estado de addon nessas marcas não foi exercitada no navegador.
- **transação genérica de usar uma habilidade (M03-D01)** (`afty-combate.js::COMBATE_ESTADOS::@catalogo`). Operações separadas; cobrança só por ramo de id (Invencível, Talismã); custoPE de estado só exibido por decisão vigente. Pendente: Pergunta 3 de BLOCO-2026-10-07-perguntas e entrada M03-D01-transacao-de-uso. Eventos com alvo (crítico, abate, reação): entrada 'Resolver no Encontro os efeitos de alvo das oito posturas do Ápice'. Contador de usos das outras classes e fim de turno do Vislumbre: entradas preexistentes da fila.
- **custo, manutenção e expiração** (`afty-combate.js::COMBATE_ESTADOS::armasAbsolutas`). Bônus pelo Motor; sem custoPE declarado, sem manutenção e sem expiração. Pendente: Pergunta 3 de BLOCO-2026-10-07-perguntas. Localização da fonte no controle: LUT10-armas-absolutas-fonte.
- **Condenado no custo de ativação e manutenção** (`afty-combate.js::COMBATE_ESTADOS::invencivelSobOSol`). Ativação e manutenção cobram 4 PE fixos por gastaPe, fora do custoEmPe. Pendente: Nota de 2026-10-07 em 'Condições: leituras para confirmar', item 6.
- **Preciso como estado de bancada** (`afty-combate.js::COMBATE_ESTADOS::golpePreciso`). Implementado; a caixa Golpe Especial da aba Buffs tem seis membros; a sub-aba Combatente tem 21 raízes e 14 caixas. Pendente: O teto de 20 raízes de t-estados-organiza virou 21, com um assert novo de 20 caixas de primeiro nível; a auditoria deve conferir a troca.
- **variável da DSL** (`afty-combate.js::COMBATE_VARS::golpe_preciso`). Gerada pelo catálogo, como golpe_atroz.

## Provas

Os testes do bloco estão em `asserts/t-revisao-*.mjs`. Cada parcela lista o comando e a evidência no `registro.json`. Provas marcadas FALHOU com o prefixo "ANTES da correção" registram a reprodução do defeito na árvore de entrada, e não falha atual.

## Não verificado

- Matriz completa das 347 chaves do M03.
- Reabertura, autosave e desfazer da sessão.
- Descanso e fim de combate para os estados novos.

## Pendências na fila única

- docs/a-fazer.md: BLOCO-2026-10-07-perguntas
- docs/a-fazer.md: M03-D01-transacao-de-uso
- docs/a-fazer.md: LUT10-armas-absolutas-fonte
- docs/a-fazer.md: O contador de usos cobre só o Combatente
- docs/a-fazer.md: O ponto de Fadiga do Vislumbre não entra sozinho no fim do turno
- docs/a-fazer.md: Resolver no Encontro os efeitos de alvo das oito posturas do Ápice

## Revalidação

Mudanças em `afty-addons.js`, `afty-efeitos.js`, `afty-derive.js` e `AftyCreatureBuilder.jsx` são compartilhadas por todos os lotes do bloco. Qualquer prova antiga que tenha consultado esses arquivos (inclusive as do G00) precisa ser revalidada contra a versão do manifesto `entrega-sha256.json`.
