# M05: Addons: famílias, herança, isolamento e atualização

Execução de 2026-10-07, bloco G00, M01 a M05, P01, CMB-01 e CMB-02. Estado: **PARCIAL**, aguardando auditoria independente (`entregaEstavel.aguardaAuditoria`). Auditoria: NÃO EXECUTADA.

Fonte: `C:/Projetos/Grimorio/F&M 2.5.2 - Livro de Regras.md`, SHA-256 `1d0713d52c818a9ab9f47b883d9887a0d227d174d30ffcce358874669a7a733a`, páginas pelo último marcador. Base: commit `a0cefc29f32f6bd05e1617fc98014dbda2980483` com 48 arquivos rastreados alterados e os não rastreados preexistentes (lista em `bloco-2026-10-07/entrada/status.txt`), preservados.

Diagnóstico anterior (execução noturna, somente leitura): INCONCLUSIVO, com os achados confirmados por executor e auditor. Esta execução reproduziu os defeitos antes de corrigir (`bloco-2026-10-07/antes/`).

## Itens declarados

| Chave | Nome |
|---|---|
| `afty-addons.js::PRIMITIVAS::@catalogo` | Primitivas de addon (âncora do mecanismo do pacote) |
| `afty-addons.js::SEPARADOR::@valor` | Separador do namespace |
| `afty-addons.js::ALCANCES_DE_CURA::@catalogo` | Alcances da linha de cura declarada |

## Parcelas

| Item | Parcela | Regra / Execução / Motor / Autoria | Evidência |
|---|---|---|---|
| `@catalogo` | remendo por ficha no Encontro misto (M05-F01) | CONFIRMADA / COMPLETA / INTEGRADO / ADDON | NÃO VERIFICADA |
| `@catalogo` | concessão automática só para quem carrega o pacote (M05-F02) | CONFIRMADA / COMPLETA / INTEGRADO / ADDON | NÃO VERIFICADA |
| `@valor` | namespace de referência aninhada (M05-F03 e P04) | CONFIRMADA / COMPLETA / INTEGRADO / ADDON | NÃO VERIFICADA |
| `@catalogo` | portão do fonteCura | CONFIRMADA / COMPLETA / INTEGRADO / ADDON | NÃO VERIFICADA |

## O que mudou e o que ficou

- **remendo por ficha no Encontro misto (M05-F01)** (`afty-addons.js::PRIMITIVAS::@catalogo`). Antes: Defesa de B 16 virava 23 (e 23 virava 30). Depois: comEscopoDaFicha em volta do deriveAfty. Pendente: Leitura de catálogo fora da derivação (texto no painel) segue vendo a união: M05-texto-fora-do-derive. O inventário não tem chave para o mecanismo de remendo; a parcela está ancorada no catálogo de primitivas do mesmo módulo.
- **concessão automática só para quem carrega o pacote (M05-F02)** (`afty-addons.js::PRIMITIVAS::@catalogo`). Antes: concedida a B (player) e Defesa 10 -> 13. Depois: filtrada por pacotesDaFicha.
- **namespace de referência aninhada (M05-F03 e P04)** (`afty-addons.js::SEPARADOR::@valor`). Antes: lendariaOr cru, habId cru, remendo da herdeira não casava. Depois: prefixarNoCaminho e caminhos declarados.
- **portão do fonteCura** (`afty-addons.js::ALCANCES_DE_CURA::@catalogo`). Implementado; alcance inválido recusa o pacote.

## Provas

Os testes do bloco estão em `asserts/t-revisao-*.mjs`. Cada parcela lista o comando e a evidência no `registro.json`. Provas marcadas FALHOU com o prefixo "ANTES da correção" registram a reprodução do defeito na árvore de entrada, e não falha atual.

## Não verificado

- Instalar, remover, atualizar e reabrir com armazenamento isolado para o caso de remendo (provado por função, não por tela).
- Encontro misto no navegador com remendo.
- Os 51 pacotes (lotes AD) não foram revisados por conteúdo.

## Pendências na fila única

- docs/a-fazer.md: M05-texto-fora-do-derive
- docs/a-fazer.md: `remendadoPor` existe e nenhuma tela mostra
- docs/a-fazer.md: ASSUNÇÃO: `gemeosSemTecnica` abre as DUAS do Sem Técnica, e não só as nomeadas
- docs/a-fazer.md: Ápice e Lendária que citam habilidade de Conjurador não alcançam a herdeira

## Revalidação

Mudanças em `afty-addons.js`, `afty-efeitos.js`, `afty-derive.js` e `AftyCreatureBuilder.jsx` são compartilhadas por todos os lotes do bloco. Qualquer prova antiga que tenha consultado esses arquivos (inclusive as do G00) precisa ser revalidada contra a versão do manifesto `entrega-sha256.json`.
