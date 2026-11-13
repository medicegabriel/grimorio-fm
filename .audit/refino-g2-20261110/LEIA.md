# Roteiros de conferência do refinamento do G2 (2026-11-10)

Roteiros de navegador (Playwright) usados nos três lotes do refinamento da Ficha Final G2. Eles rodam contra um BUILD ISOLADO, nunca contra a 5330 nem contra o `dist` diário do app. Registro dos lotes: `docs/afty-status.md`, seção "Ficha Final G2: lotes de uso, escala de texto e motor de tema", e `docs/afty-ficha-final.md`.

## Como rodar

Tudo a partir de `grimorio-tracker/`. Sem commit, sem escrever fora desta pasta e da saída que você escolher.

1. **Build isolado** num diretório à parte (o Playwright e o config vêm da prévia `previa-abas-g2-20261021`):

   `npx vite build --config .audit/previa-abas-g2-20261021/vite.config.mjs --outDir <pasta>/dist`

   O `--outDir` isolado é obrigatório: sem ele o build cai em `previa-abas-g2-20261021/dist`.

2. **Servidor estático** próprio, numa porta livre (padrão 5347, NUNCA a 5330):

   `PORTA=5347 node .audit/refino-g2-20261110/servidor.mjs <pasta>/dist`

3. **Roteiro**, com a mesma porta e uma pasta de saída para as capturas (padrão `./fotos/` aqui dentro, que não deve ir ao git):

   `PORTA=5347 SAIDA=<pasta>/fotos node .audit/refino-g2-20261110/lote1-efeitos.mjs`

No PowerShell as variáveis ficam em `$env:PORTA = "5347"; $env:SAIDA = "..."` antes do `node`.

Cada roteiro imprime uma linha por verificação, `OK` ou `FALHA`, e no fim `erros de página: 0 []`. Falha de verdade é qualquer linha `FALHA` ou erro de página.

## Os roteiros

| Arquivo | O que confere | Ficha |
|---|---|---|
| `base.mjs` | Ajudante de todos: abre `?ficha=<cena>&tema=<tema>&aba=<aba>`, `monta()`, `passo()`, `foto()` e `fim()`. A aba de Efeitos tem id `buffs`. Não roda sozinho | |
| `servidor.mjs` | Servidor estático do build, sem cache | |
| `lote1-efeitos.mjs` | Aba Efeitos: Favoritos, catálogo em dois blocos, Ativar direto, Postura, motivo do Confirmar, detalhe sem coluna vazia | `mesa` |
| `lote1-resto.mjs` | Pular no fim de Ações, leitor de Habilidades uma por vez e reclique fecha, rolagens na linha das abas | `mesa` |
| `lote1-cab.mjs` | Cabeçalho: faixa fina do celular (390 px), histerese, barra de rolagens | `mesa` |
| `imprimir.mjs` | `@media print` no app: o tema escuro de usuário imprime claro (escuro, arcane, minamoto) | `mesa` |
| `copiar-tema.mjs` | Copiar e Colar Tema no painel de Aparência, com a área de transferência | `mesa` |
| `avisos-css.mjs` | Avisos do auditor dentro do editor de CSS personalizado | `mesa` |
| `capturar-escala.mjs` | Seis abas em 1440 e 390 px, mais a contagem de tamanhos de fonte por aba. `NOME=antes-escala` ou `depois-escala` escolhe a subpasta | `mesa` |
| `reverter-escala.mjs` | Gera o CSS do "antes" da escala dentro de uma `git worktree` de HEAD (ver abaixo) | |

## Pegadinhas

- **Confirmar uma Preparação** no catálogo só dá para conferir numa ficha com PE. A `mesa` não tem, use a `arsenal` (Ataque Concentrado) ou a `conjurador`. O `lote1-resto.mjs` já confirma uma Preparação na `arsenal`.
- **`imprimir.mjs`** normaliza `#fff` e `#ffffff` antes de comparar. O navegador devolve a variável como foi escrita no CSS, e a comparação direta acusava falha falsa.
- **O Playwright usa `channel: "chrome"`** (o Chrome instalado). Os roteiros bloqueiam toda rede que não seja `127.0.0.1`.
- **Capturas de outros roteiros**: depois de rodar `layout.mjs` ou `temas-compat.mjs` da prévia, `git checkout -- .audit/previa-abas-g2-20261021` devolve as capturas versionadas.

## Antes e depois da escala de texto

`capturar-escala.mjs` tira as duas pontas. O "depois" é o build da árvore atual. O "antes" precisa dos valores antigos de `font-size`, que só estão no HEAD:

1. `git worktree add --detach <pasta>/wt-antes HEAD`, copie para lá os arquivos modificados e novos de `src/` e de `themes/`, e faça uma junção de `node_modules`.
2. `node .audit/refino-g2-20261110/reverter-escala.mjs <pasta>/wt-antes` devolve ao CSS da worktree as linhas que só trocaram tamanho.
3. Builde a worktree com outro `--outDir`, sirva numa segunda porta e rode o `capturar-escala.mjs` nas duas.
4. `git worktree remove --force <pasta>/wt-antes` e `git worktree prune`. A árvore real nunca é tocada.

Linhas que o `reverter-escala.mjs` não devolve são as de elementos novos (por exemplo `.k-bloco` e a faixa fina), que não têm "antes".

A página para o autor está em `C:\Projetos\Grimorio\prototipos\ficha-final-escala\index.html`.
