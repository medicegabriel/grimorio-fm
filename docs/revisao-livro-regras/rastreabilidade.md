# Rastreabilidade e arquitetura relevante

## Base e preservação

- Data da leitura e entrega: 2026-10-29.
- HEAD local consultado: `68888733deffa9700aa69761fd965a504b9152db`.
- HEAD remoto observado com `git ls-remote origin HEAD`: `2308bc193e9d5e806630d00745e3cc654042d9f7`.
- Os hashes diferem. Isso não determina sozinho a relação de ancestralidade. Nenhuma sincronização, checkout, merge, commit ou push foi feito.
- `git status --short` mostrou numerosas alterações preexistentes, inclusive código e docs. Elas não foram revertidas nem formatadas. A pasta desta entrega não existia com conteúdo na entrada.
- Escopo de escrita desta tarefa: somente Markdown em `docs/revisao-livro-regras/`. Nem `afty-status.md` nem a fila foram editados, respeitando o escopo explícito do pedido.
- Fonte externa: hash inicial e final `1d0713d52c818a9ab9f47b883d9887a0d227d174d30ffcce358874669a7a733a`, ambos iguais ao exigido. Sem cópia e sem edição da fonte.
- Não foram executados testes, lint, build, instalação, aplicação de addons ou navegador, conforme escopo documental.

## Leituras e método

Instruções AGENTS.md e CLAUDE.md lidas antes da escrita. Ordem de contexto: sessão SESSÃO DE 2026-07-29 do status, Contexto rápido, DSL e fórmulas base. Foram consultados também o guia Player, a arquitetura histórica, perguntas já abertas e o protocolo de automação. Informação histórica foi usada como contexto, não como prova do comportamento atual.

`rg` não está instalado no gateway. A localização direcionada foi feita com Python, sed e leitura de trechos, sem procurar em outros projetos. O livro foi consultado diretamente no caminho externo, usando marcadores impressos. Não foi usado PDF. Hashes abaixo identificam dependências examinadas, não certificam o conteúdo inteiro desses arquivos nem uma auditoria semântica.

## Nota curta de arquitetura para retomada

O código comum está em `src/systems/afty/`. `creature.rulesVersion` define Player/Afty por `sistemaDaFicha`; `regraDo` aplica divergências. A rota não decide cálculos de fichas existentes. `deriveAfty` integra classes, origens, equipamentos, treinos, concessões e efeitos. Os estágios permanentes antecedem os temporários e os consumidores finais. `aplicarEfeitos` avalia canais e `resolverExclusivos` disputa fontes. O criador é `AftyCreatureBuilder.jsx`; a sessão de jogo fica em `ficha/ficha-sessao.js`, fora da ficha crua. Ler consumidores e telas antes de atribuir completude a um catálogo. Há alterações locais e arquivos novos anteriores à tarefa, portanto HEAD sozinho não representa o código examinado.

## SHA-256 dos arquivos consultados no fechamento

| Dependência | SHA-256 |
|---|---|
| `AGENTS.md` | `2211f6ea673714709fee66b0742a57a800309d612587903590430c94b89b61d1` |
| `CLAUDE.md` | `c2ef547e5547bd5ce291bd1ce03f331dd5e48af1aa49c98cef0be77a97a3d3e4` |
| `docs/afty-status.md` | `19ee148cd44eef1d6f6636219cdd2b4a77051f1af40a4b6da0ba0b8a143e714d` |
| `docs/automacao-dsl.md` | `4e2924ecc78030bb36a309d7486db30521bd02abc94099b710bcfc84418c559c` |
| `docs/afty-formulas-base.md` | `87f641120a3c025e70b9a37795fc41d074f7c074963176fd1a3b64a85661ae60` |
| `docs/afty-player.md` | `9e8e04522f5d93d143c020223fdf83b0a1a5f004b64c5a3db61d428ff073f101` |
| `docs/roadmap-versionamento-e-fichas.md` | `4545235fd5a4ce81c861c545f9c41d0be37009e6400f0e84da537df7d376a670` |
| `docs/a-fazer.md` | `40489502f227b3364fb2b652edfc19e37f36d52104c61fae8a6daa035a7687a1` |
| `docs/revisao-automacao/LEIA.md` | `fbb23c5c1f54fd4cf352925a595b10bdd0d05eed1c0b08289264784e05d753e4` |
| `src/systems/afty/afty-sistema.js` | `f48f91d076984723aeca7e0c6a4b080e9dbc152aed44c122b7b287f8c99161d0` |
| `src/systems/afty/afty-atributos.js` | `cb71df492dfb5e47164946c570310eb6346e8831ae404e2373e548681c22e4c9` |
| `src/systems/afty/afty-derive.js` | `50eac500a6132d347973e1b05c77e69dc1f4c8608e94548a5a052c753ca8e972` |
| `src/systems/afty/afty-especializacoes.js` | `78d1c78a510f4af1fbbc8c28d117e388bb17e0b2e695ee0b2e5d7054392f6379` |
| `src/systems/afty/afty-origens.js` | `372306212d5cc388c33e5a5046871a66f6b93d4bddd9974066f400f117135850` |
| `src/systems/afty/afty-talentos.js` | `c88e47cd734747afe56931ea87a7632f5e58d460e2b62e8821847b6d602a5ac5` |
| `src/systems/afty/afty-pericias.js` | `c5938544090dbe3cb3b7edc3dcc7f27f5f1fd58b541599baa6ad0025e5f42c66` |
| `src/systems/afty/afty-aptidoes.js` | `46d79d67a157566bfc0dc54e78357782b6f099985dc7ea87a8d63237c731b898` |
| `src/systems/afty/afty-equipamentos.js` | `ffb350f7aaff405003964f78646546360940d60c3f9df74e8f0709bf0dfaadca` |
| `src/systems/afty/afty-feiticos.js` | `8659d0602b9b3ca8b069143fe8fb13dd93c34f69db2ec5fe33b764e7b5f852c5` |
| `src/systems/afty/afty-efeitos.js` | `1631c8ceae37f7fb6c018c4615ef4c3b2c6381a6b7b27883a387524be0fd71e8` |
| `src/systems/afty/afty-efeitos-conteudo.js` | `456ac81d35507eaf1ffcea8cd1502137895733daaac0b433791e95dab5068ef1` |
| `src/systems/afty/afty-invocacoes.js` | `d1710bf5662278bd903feaa42bf01aa188fc8854a720851208b26a89657ca305` |
| `src/systems/afty/afty-dano.js` | `643e8d75e7d77c52fbd04063b4ce4445e268de117d2d880b70f00b1e1ac81f80` |
| `src/systems/afty/afty-treinamentos.js` | `f642fc35aae8e347c5f4b97bbab63cca3240c701947d967b413c2a8e1719e713` |
| `src/systems/afty/afty-votos.js` | `7a3aab93cb1adb2b5f59fe588c85469d7608b8ab6ef5c5eb46747ef06c072735` |
| `src/systems/afty/AftyCreatureBuilder.jsx` | `5c01f9b3c9751b457284acd6aa0a97522cef3ae738de9e1742f606a5d345683e` |
| `src/systems/afty/ficha/ficha-sessao.js` | `da763e26e6a563991b1721b31cf152ee4c8819b394a7d75554f7b7d407f30048` |
| `src/systems/afty/ficha/abas/AbaInvocacoes.jsx` | `5847d47c5248d08a88746216039d9416ae3a9f107b772c2353f26be855981fd9` |
| `src/systems/afty/ficha/BotaoDeDescanso.jsx` | `4ea6ef13c580b3c6c5785190fc43e8995d4d4e61aed00cb4511cba4428b1c30a` |

## Validação documental

Verificados ao fechar: IDs únicos LR01 a LR27, contagens de estados, destinos locais dos links, páginas impressas das citações, ausência de U+2014 nos arquivos criados e SHA-256 da fonte. Nenhuma dessas verificações é teste de comportamento do aplicativo. O resumo de progresso mantém separados implementação constatada, leitura incompleta e auditoria.
