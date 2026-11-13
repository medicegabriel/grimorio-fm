# M04: Ferramentas do jogador: autoria de habilidades e efeitos

Execução de 2026-10-07, bloco G00, M01 a M05, P01, CMB-01 e CMB-02. Estado: **PARCIAL**, aguardando auditoria independente (`entregaEstavel.aguardaAuditoria`). Auditoria: NÃO EXECUTADA.

Fonte: `C:/Projetos/Grimorio/F&M 2.5.2 - Livro de Regras.md`, SHA-256 `1d0713d52c818a9ab9f47b883d9887a0d227d174d30ffcce358874669a7a733a`, páginas pelo último marcador. Base: commit `a0cefc29f32f6bd05e1617fc98014dbda2980483` com 48 arquivos rastreados alterados e os não rastreados preexistentes (lista em `bloco-2026-10-07/entrada/status.txt`), preservados.

Diagnóstico anterior (execução noturna, somente leitura): INCONCLUSIVO, com os achados confirmados por executor e auditor. Esta execução reproduziu os defeitos antes de corrigir (`bloco-2026-10-07/antes/`).

## Itens declarados

| Chave | Nome |
|---|---|
| `afty-schema.js::FUNCIONAMENTO_PRINCIPAL_ID::@valor` | Funcionamento Básico principal (âncora de autoria) |

## Parcelas

| Item | Parcela | Regra / Execução / Motor / Autoria | Evidência |
|---|---|---|---|
| `@valor` | alvos dos cinco tipos no editor visual (M04-A02) | CONFIRMADA / COMPLETA / INTEGRADO / INTERFACE | NÃO VERIFICADA |
| `@valor` | validação do Funcionamento de addon (M04-A01) | CONFIRMADA / COMPLETA / INTEGRADO / ADDON | NÃO VERIFICADA |
| `@valor` | controles de estado de addon (M04-A03) | CONFIRMADA / COMPLETA / INTEGRADO / ADDON | NÃO VERIFICADA |
| `@valor` | linha de cura própria declarada (M04-A04) | CONFIRMADA / COMPLETA / INTEGRADO / ADDON | NÃO VERIFICADA |
| `@valor` | Habilidade, Talento e Aptidão novos pela interface | CONFIRMADA / PARCIAL / INTEGRADO / ADDON | NÃO VERIFICADA |

## O que mudou e o que ficou

- **alvos dos cinco tipos no editor visual (M04-A02)** (`afty-schema.js::FUNCIONAMENTO_PRINCIPAL_ID::@valor`). Ver M01 (mesmas provas): seletores e alvo obrigatório.
- **validação do Funcionamento de addon (M04-A01)** (`afty-schema.js::FUNCIONAMENTO_PRINCIPAL_ID::@valor`). Ver M01-VAL-02.
- **controles de estado de addon (M04-A03)** (`afty-schema.js::FUNCIONAMENTO_PRINCIPAL_ID::@valor`). Ver M03.
- **linha de cura própria declarada (M04-A04)** (`afty-schema.js::FUNCIONAMENTO_PRINCIPAL_ID::@valor`). Antes: impossível (FONTES_CURA fixa). Depois: fonteCura + canais de cura mirando o próprio id; linha na Ficha e alvo no editor.
- **Habilidade, Talento e Aptidão novos pela interface** (`afty-schema.js::FUNCIONAMENTO_PRINCIPAL_ID::@valor`). Sem mudança nesta execução.

## Provas

Os testes do bloco estão em `asserts/t-revisao-*.mjs`. Cada parcela lista o comando e a evidência no `registro.json`. Provas marcadas FALHOU com o prefixo "ANTES da correção" registram a reprodução do defeito na árvore de entrada, e não falha atual.

## Não verificado

- Matriz das 162 chaves do M04 (schemas, filtros, texto rico, conteúdo da Ficha).
- Exportar e importar a ficha com as configurações novas (os roteiros importam fichas e salvam; não exportam).

## Pendências na fila única

- docs/a-fazer.md: BLOCO-2026-10-07-perguntas

## Revalidação

Mudanças em `afty-addons.js`, `afty-efeitos.js`, `afty-derive.js` e `AftyCreatureBuilder.jsx` são compartilhadas por todos os lotes do bloco. Qualquer prova antiga que tenha consultado esses arquivos (inclusive as do G00) precisa ser revalidada contra a versão do manifesto `entrega-sha256.json`.
