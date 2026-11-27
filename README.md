# Grimório Tracker

Aplicação React para criação, consulta e acompanhamento de fichas e encontros. A Central de Jogo fica em `/`, o Grimório 2.5.2 em `/Criatura` e as fichas de personagem em `/Jogador`, com compatibilidade para links antigos de `/Player`.

## Começar

```bash
npm install
npm run dev
```

O projeto usa Vite. Os comandos disponíveis são `npm run build`, `npm run lint` e `npm run asserts`.

## Onde encontrar

- `src/main.jsx`: entrada do site e escolha entre a Central de Jogo e o Grimório.
- `src/App.jsx`: seleção das telas de fichas, encontros e Salas.
- `src/components/`: interface do Grimório 2.5.2 e componentes compartilhados.
- `src/systems/afty/`: criador, ficha, encontros, regras e Addons do Afty e do Player.
- `asserts/`: verificações da lógica do sistema.
- `addons/`: pacotes de exemplo e conteúdo adicional.

## Documentação

Leia [AGENTS.md](AGENTS.md) antes de colaborar com uma IA. A fila atual de trabalho fica em [docs/a-fazer.md](docs/a-fazer.md). O histórico de decisões e sessões fica em [docs/afty-status.md](docs/afty-status.md).

Os guias de [Player](docs/afty-player.md), [Addons](docs/afty-addons.md), [Ficha Final](docs/afty-ficha-final.md), [Carteira](docs/afty-carteira.md), [fórmulas](docs/afty-formulas-base.md) e [DSL de automação](docs/automacao-dsl.md) detalham cada área. Planos e sessões datados registram o contexto em que foram escritos; para saber o que ainda falta, consulte a fila e confirme no código.
