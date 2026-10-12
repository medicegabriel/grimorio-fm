# CMB-01: Combatente: Repertório do Especialista e suas escolhas

Execução de 2026-10-07, bloco G00, M01 a M05, P01, CMB-01 e CMB-02. Estado: **PARCIAL**, aguardando auditoria independente (`entregaEstavel.aguardaAuditoria`). Auditoria: NÃO EXECUTADA.

Fonte: `C:/Projetos/Grimorio/F&M 2.5.2 - Livro de Regras.md`, SHA-256 `1d0713d52c818a9ab9f47b883d9887a0d227d174d30ffcce358874669a7a733a`, páginas pelo último marcador. Base: commit `a0cefc29f32f6bd05e1617fc98014dbda2980483` com 48 arquivos rastreados alterados e os não rastreados preexistentes (lista em `bloco-2026-10-07/entrada/status.txt`), preservados.

Diagnóstico anterior (execução noturna, somente leitura): INCONCLUSIVO, com os achados confirmados por executor e auditor. Esta execução reproduziu os defeitos antes de corrigir (`bloco-2026-10-07/antes/`).

## Itens declarados

| Chave | Nome |
|---|---|
| `afty-habilidades.js::AFTY_HABILIDADES::cmb_repertorio_do_especialista` | Repertório do Especialista |
| `afty-habilidades.js::ESTILOS_DE_COMBATE::@catalogo` | Estilos de Combate |
| `afty-habilidades.js::ESTILOS_DE_COMBATE::cmb_estilo_defensivo` | cmb_estilo_defensivo |
| `afty-habilidades.js::ESTILOS_DE_COMBATE::cmb_estilo_do_arremessador` | cmb_estilo_do_arremessador |
| `afty-habilidades.js::ESTILOS_DE_COMBATE::cmb_estilo_do_duelista` | cmb_estilo_do_duelista |
| `afty-habilidades.js::ESTILOS_DE_COMBATE::cmb_estilo_do_interceptador` | cmb_estilo_do_interceptador |
| `afty-habilidades.js::ESTILOS_DE_COMBATE::cmb_estilo_do_protetor` | cmb_estilo_do_protetor |
| `afty-habilidades.js::ESTILOS_DE_COMBATE::cmb_estilo_distante` | cmb_estilo_distante |
| `afty-habilidades.js::ESTILOS_DE_COMBATE::cmb_estilo_duplo` | cmb_estilo_duplo |
| `afty-habilidades.js::ESTILOS_DE_COMBATE::cmb_estilo_massivo` | cmb_estilo_massivo |

## Parcelas

| Item | Parcela | Regra / Execução / Motor / Autoria | Evidência |
|---|---|---|---|
| `@catalogo` | o mesmo Estilo pelo Repertório e pelo Adepto | CONFIRMADA / COMPLETA / INTEGRADO / ADDON | NÃO VERIFICADA |
| `@catalogo` | escala do Adepto com Estilos diferentes | AGUARDA AUTOR / PARCIAL / INTEGRADO / ADDON | NÃO VERIFICADA |
| `cmb_estilo_defensivo` | parcela numérica | CONFIRMADA / COMPLETA / INTEGRADO / ADDON | NÃO VERIFICADA |
| `cmb_estilo_do_arremessador` | parcela numérica e parcela de mesa | CONFIRMADA / PARCIAL / PARCIAL / ADDON | NÃO VERIFICADA |
| `cmb_estilo_do_duelista` | parcela numérica | CONFIRMADA / COMPLETA / INTEGRADO / ADDON | NÃO VERIFICADA |
| `cmb_estilo_do_interceptador` | reação sobre o ataque de outra criatura | CONFIRMADA / AUSENTE / CAPACIDADE AUSENTE / INACESSÍVEL | NÃO VERIFICADA |
| `cmb_estilo_do_protetor` | reação sobre o ataque de outra criatura | AGUARDA AUTOR / AUSENTE / CAPACIDADE AUSENTE / INACESSÍVEL | NÃO VERIFICADA |
| `cmb_estilo_distante` | parcela numérica | CONFIRMADA / COMPLETA / INTEGRADO / ADDON | NÃO VERIFICADA |
| `cmb_estilo_duplo` | parcela numérica e parcela de mesa | CONFIRMADA / PARCIAL / PARCIAL / ADDON | NÃO VERIFICADA |
| `cmb_estilo_massivo` | parcela numérica | CONFIRMADA / COMPLETA / INTEGRADO / ADDON | NÃO VERIFICADA |

## O que mudou e o que ficou

- **o mesmo Estilo pelo Repertório e pelo Adepto** (`afty-habilidades.js::ESTILOS_DE_COMBATE::@catalogo`). Antes: +12 de Defesa no nível 16. Depois: +6, cópia suplantada no hover.
- **escala do Adepto com Estilos diferentes** (`afty-habilidades.js::ESTILOS_DE_COMBATE::@catalogo`). NIVEL_ESTILO = max(esc_combatente, nd * tem_tal_adepto_de_combate) para todo Estilo. Pendente: Pergunta 6 de BLOCO-2026-10-07-perguntas.
- **parcela numérica** (`afty-habilidades.js::ESTILOS_DE_COMBATE::cmb_estilo_defensivo`). Integrado e conferido pelas suítes existentes.
- **parcela numérica e parcela de mesa** (`afty-habilidades.js::ESTILOS_DE_COMBATE::cmb_estilo_do_arremessador`). Bônus integrado; saque (Arremessador) e atributo da segunda arma (Duplo, decisão de 2026-09-01) sem execução. Pendente: CMB01-reacoes (parcelas de mão e de saque)
- **parcela numérica** (`afty-habilidades.js::ESTILOS_DE_COMBATE::cmb_estilo_do_duelista`). Integrado e conferido pelas suítes existentes.
- **reação sobre o ataque de outra criatura** (`afty-habilidades.js::ESTILOS_DE_COMBATE::cmb_estilo_do_interceptador`). Só texto: a ficha só conhece a si. Pendente: CMB01-reacoes
- **reação sobre o ataque de outra criatura** (`afty-habilidades.js::ESTILOS_DE_COMBATE::cmb_estilo_do_protetor`). Só texto: a ficha só conhece a si. Pendente: CMB01-reacoes; pergunta 5 de BLOCO-2026-10-07-perguntas
- **parcela numérica** (`afty-habilidades.js::ESTILOS_DE_COMBATE::cmb_estilo_distante`). Integrado e conferido pelas suítes existentes.
- **parcela numérica e parcela de mesa** (`afty-habilidades.js::ESTILOS_DE_COMBATE::cmb_estilo_duplo`). Bônus integrado; saque (Arremessador) e atributo da segunda arma (Duplo, decisão de 2026-09-01) sem execução. Pendente: CMB01-reacoes (parcelas de mão e de saque)
- **parcela numérica** (`afty-habilidades.js::ESTILOS_DE_COMBATE::cmb_estilo_massivo`). Integrado e conferido pelas suítes existentes.

## Provas

Os testes do bloco estão em `asserts/t-revisao-*.mjs`. Cada parcela lista o comando e a evidência no `registro.json`. Provas marcadas FALHOU com o prefixo "ANTES da correção" registram a reprodução do defeito na árvore de entrada, e não falha atual.

## Não verificado

- Estilos pelo navegador.
- Imitação de Estilos além do Defensivo.

## Pendências na fila única

- docs/a-fazer.md: BLOCO-2026-10-07-perguntas
- docs/a-fazer.md: CMB01-reacoes

## Revalidação

Mudanças em `afty-addons.js`, `afty-efeitos.js`, `afty-derive.js` e `AftyCreatureBuilder.jsx` são compartilhadas por todos os lotes do bloco. Qualquer prova antiga que tenha consultado esses arquivos (inclusive as do G00) precisa ser revalidada contra a versão do manifesto `entrega-sha256.json`.
