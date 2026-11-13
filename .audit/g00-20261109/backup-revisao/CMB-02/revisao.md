# CMB-02: Combatente: Golpe Especial e suas escolhas

Execução de 2026-10-07, bloco G00, M01 a M05, P01, CMB-01 e CMB-02. Estado: **PARCIAL**, aguardando auditoria independente (`entregaEstavel.aguardaAuditoria`). Auditoria: NÃO EXECUTADA.

Fonte: `C:/Projetos/Grimorio/F&M 2.5.2 - Livro de Regras.md`, SHA-256 `1d0713d52c818a9ab9f47b883d9887a0d227d174d30ffcce358874669a7a733a`, páginas pelo último marcador. Base: commit `a0cefc29f32f6bd05e1617fc98014dbda2980483` com 48 arquivos rastreados alterados e os não rastreados preexistentes (lista em `bloco-2026-10-07/entrada/status.txt`), preservados.

Diagnóstico anterior (execução noturna, somente leitura): INCONCLUSIVO, com os achados confirmados por executor e auditor. Esta execução reproduziu os defeitos antes de corrigir (`bloco-2026-10-07/antes/`).

## Itens declarados

| Chave | Nome |
|---|---|
| `afty-habilidades.js::AFTY_HABILIDADES::cmb_golpe_especial` | Golpe Especial |
| `afty-golpe-especial.js::PROPRIEDADES_GOLPE::@catalogo` | Propriedades do Golpe |
| `afty-golpe-especial.js::PROPRIEDADES_GOLPE::amplo` | amplo |
| `afty-golpe-especial.js::PROPRIEDADES_GOLPE::atroz` | atroz |
| `afty-golpe-especial.js::PROPRIEDADES_GOLPE::impactante` | impactante |
| `afty-golpe-especial.js::PROPRIEDADES_GOLPE::letal` | letal |
| `afty-golpe-especial.js::PROPRIEDADES_GOLPE::longo` | longo |
| `afty-golpe-especial.js::PROPRIEDADES_GOLPE::penetrante` | penetrante |
| `afty-golpe-especial.js::PROPRIEDADES_GOLPE::preciso` | preciso |
| `afty-golpe-especial.js::PROPRIEDADES_GOLPE::sanguinario` | sanguinario |
| `afty-golpe-especial.js::PROPRIEDADES_GOLPE::lento` | lento |
| `afty-golpe-especial.js::PROPRIEDADES_GOLPE::sacrificio` | sacrificio |
| `afty-golpe-especial.js::PROPRIEDADES_GOLPE::desfocado` | desfocado |

## Parcelas

| Item | Parcela | Regra / Execução / Motor / Autoria | Evidência |
|---|---|---|---|
| `amplo` | consequência no alvo ou na ação | CONFIRMADA / PARCIAL / CAPACIDADE AUSENTE / INACESSÍVEL | NÃO VERIFICADA |
| `atroz` | alcance só onde há ataque | CONFIRMADA / COMPLETA / INTEGRADO / ADDON | NÃO VERIFICADA |
| `impactante` | consequência no alvo ou na ação | CONFIRMADA / PARCIAL / CAPACIDADE AUSENTE / INACESSÍVEL | NÃO VERIFICADA |
| `letal` | número na linha | CONFIRMADA / COMPLETA / INTEGRADO / ADDON | NÃO VERIFICADA |
| `longo` | número na linha | CONFIRMADA / COMPLETA / INTEGRADO / ADDON | NÃO VERIFICADA |
| `penetrante` | alcance só onde há ataque | CONFIRMADA / COMPLETA / INTEGRADO / ADDON | NÃO VERIFICADA |
| `preciso` | vantagem no ataque | CONFIRMADA / COMPLETA / INTEGRADO / INTERFACE | NÃO VERIFICADA |
| `sanguinario` | sangramento aplicado | AGUARDA AUTOR / PARCIAL / CAPACIDADE AUSENTE / INACESSÍVEL | NÃO VERIFICADA |
| `lento` | consequência no alvo ou na ação | CONFIRMADA / PARCIAL / CAPACIDADE AUSENTE / INACESSÍVEL | NÃO VERIFICADA |
| `sacrificio` | dano sofrido e custo | CONFIRMADA / COMPLETA / INTEGRADO / INTERFACE | NÃO VERIFICADA |
| `desfocado` | penalidade no acerto | AGUARDA AUTOR / COMPLETA / INTEGRADO / ADDON | NÃO VERIFICADA |
| `cmb_golpe_especial` | montador autorável | CONFIRMADA / PARCIAL / CAPACIDADE AUSENTE / INACESSÍVEL | NÃO VERIFICADA |

## O que mudou e o que ficou

- **consequência no alvo ou na ação** (`afty-golpe-especial.js::PROPRIEDADES_GOLPE::amplo`). Só custo (correto); consequência sem execução. Pendente: CMB02-consequencias.
- **alcance só onde há ataque** (`afty-golpe-especial.js::PROPRIEDADES_GOLPE::atroz`). Antes: sem alvo, chegava ao Feitiço de TR. Depois: alvo arma|basico|feitico:resolucao:ataque. Pendente: Feitiço com ataque e jogada Amaldiçoada: pergunta 7 de BLOCO-2026-10-07-perguntas.
- **consequência no alvo ou na ação** (`afty-golpe-especial.js::PROPRIEDADES_GOLPE::impactante`). Só custo (correto); consequência sem execução. Pendente: CMB02-consequencias.
- **número na linha** (`afty-golpe-especial.js::PROPRIEDADES_GOLPE::letal`). Integrado e coberto pelas suítes existentes.
- **número na linha** (`afty-golpe-especial.js::PROPRIEDADES_GOLPE::longo`). Integrado e coberto pelas suítes existentes.
- **alcance só onde há ataque** (`afty-golpe-especial.js::PROPRIEDADES_GOLPE::penetrante`). Antes: sem alvo, chegava ao Feitiço de TR. Depois: alvo arma|basico|feitico:resolucao:ataque. Pendente: Feitiço com ataque e jogada Amaldiçoada: pergunta 7 de BLOCO-2026-10-07-perguntas.
- **vantagem no ataque** (`afty-golpe-especial.js::PROPRIEDADES_GOLPE::preciso`). Antes: só custo, modo manual. Depois: estado de bancada, canal vantagemAtaque, modoCombinado, chip; Ficha e Encontro. Pendente: Feitiço com jogada de ataque não lê o canal: pergunta 7.
- **sangramento aplicado** (`afty-golpe-especial.js::PROPRIEDADES_GOLPE::sanguinario`). Só custo. Pendente: Pergunta 8 de BLOCO-2026-10-07-perguntas; CMB02-consequencias.
- **consequência no alvo ou na ação** (`afty-golpe-especial.js::PROPRIEDADES_GOLPE::lento`). Só custo (correto); consequência sem execução. Pendente: CMB02-consequencias.
- **dano sofrido e custo** (`afty-golpe-especial.js::PROPRIEDADES_GOLPE::sacrificio`). Integrado e coberto pelas suítes existentes.
- **penalidade no acerto** (`afty-golpe-especial.js::PROPRIEDADES_GOLPE::desfocado`). bonusAcerto sem alvo, preservado. Pendente: Pergunta 7 de BLOCO-2026-10-07-perguntas.
- **montador autorável** (`afty-habilidades.js::AFTY_HABILIDADES::cmb_golpe_especial`). PROPRIEDADES_GOLPE é constante fixa. Pendente: CMB02-consequencias.

## Provas

Os testes do bloco estão em `asserts/t-revisao-*.mjs`. Cada parcela lista o comando e a evidência no `registro.json`. Provas marcadas FALHOU com o prefixo "ANTES da correção" registram a reprodução do defeito na árvore de entrada, e não falha atual.

## Não verificado

- Roubo e herança do Golpe.
- Golpe em Feitiço com ataque (pergunta 7).

## Pendências na fila única

- docs/a-fazer.md: BLOCO-2026-10-07-perguntas
- docs/a-fazer.md: CMB02-consequencias

## Revalidação

Mudanças em `afty-addons.js`, `afty-efeitos.js`, `afty-derive.js` e `AftyCreatureBuilder.jsx` são compartilhadas por todos os lotes do bloco. Qualquer prova antiga que tenha consultado esses arquivos (inclusive as do G00) precisa ser revalidada contra a versão do manifesto `entrega-sha256.json`.
