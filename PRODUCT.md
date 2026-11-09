# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Quatro públicos, todos confirmados pelo autor:

- **Mestre na preparação:** monta criaturas, fichas, Invocações e Encontros no criador, com calma, antes da sessão.
- **Mestre na mesa:** conduz o combate ao vivo na aba de Encontros e na Simulação de Combate, com pressa e vários números na tela ao mesmo tempo.
- **Jogador na rota `/Player`:** mantém a própria ficha (Perícias, Feitiços, Buffs, Equipamentos) ao longo da campanha.
- **Autor e colaboradores:** escrevem Addons e homebrew e conferem cada número contra o livro. O repositório tem mais de um colaborador.

## Product Purpose

Grimório Tracker é um aplicativo React para criação, consulta e acompanhamento de fichas e encontros do RPG F&M. O Grimório 2.5.2 (o livro oficial) convive com o sistema Afty, que roda nas rotas `/Afty` e `/Player`. O sucesso é a ficha e o combate baterem com o livro, com cada número rastreável até a regra que o gerou.

## Positioning

O que um tracker genérico de RPG não poderia copiar com verdade:

- **Fidelidade ao livro F&M:** o texto de regra é verbatim, o Grimório 2.5.2 em `src/components/` é somente-leitura, e correção de regra do livro dentro do Afty é feita por Addon com `substitui`, nunca no dado cru.
- **Todo número mostra a origem:** stat derivado carrega suas `partes` e o hover das fontes mostra de onde vem cada parcela. O criador calcula, ele não ensina.
- **Motor de automação e Addons:** uma DSL liga Habilidades, Talentos, itens e Feitiços ao cálculo, e Addons trazem conteúdo adicional em pacotes.
- **Dois sistemas, um app:** o Grimório 2.5.2 e o Afty convivem, e a regra de uma ficha vem de `creature.rulesVersion`, não da rota onde ela foi aberta.

## Operating Context

- Trabalho pesado de criação no desktop (criador de criaturas, Habilidades, Feitiços, Addons) e consulta rápida durante a sessão de jogo (Encontros, ficha do jogador, Ficha Final).
- Rotas: raiz para o Grimório 2.5.2, `/Afty` (escondida, com storage isolado) e `/Player`.
- A Ficha Final aceita CSS personalizado do usuário, e a ficha viaja no export. Por isso campo de texto livre é marcação (`afty-texto-rico.js`), nunca HTML.
- Deploy é o push para `main`, que a Vercel publica. Quem faz commit e push é o autor.

## Capabilities and Constraints

- Stack existente: Vite, React 18, Tailwind CSS 4, lucide-react, dnd-kit. `src/index.css` é global, compartilhado com a 2.5.2 e escrito fora de `@layer`.
- Isolamento do Afty: motor, telas e catálogos vivem em `src/systems/afty/`. O Grimório 2.5.2 só muda nas exceções listadas em `AGENTS.md`.
- Arredondamento no Afty é sempre para baixo, salvo quando o texto do livro manda outro.
- Regra ambígua ou faltando vira pergunta em `docs/a-fazer.md`, não suposição.
- O Corpo Amaldiçoado Mutante foi abandonado e excluído em definitivo pelo autor (2026-10-30). Não implementar nem reabrir.
- Regras de texto de tela que o autor pediu mais de uma vez: Title Case em rótulos, sem travessão U+2014, sem ponto e vírgula, sem texto explicativo solto no criador, aviso com o ícone `AlertTriangle` do lucide e nunca o caractere U+26A0. A lista completa está em `CLAUDE.md` e `AGENTS.md`, que mandam sobre este arquivo.
- Em dúvida sobre estilo ou limite de escrita, vale `AGENTS.md`.

## Brand Commitments

- Idioma da interface e da documentação: português do Brasil.
- Nomes de regra e de sistema são os do livro (Patamar, Alma, Feitiços, Invocações, Liberações, Addons, Ficha Final). Não renomear.
- A skill `frontend-design` só roda sob pedido do autor. Este arquivo não a substitui.

## Evidence on Hand

- Livro de regras: `F&M 2.5.2 - Livro de Regras.md` e o PDF `F&M 2.5.2 - Grimório das Maldições.pdf`, na pasta acima do repositório (`C:\Projetos\Grimorio`).
- Documentação do repositório: `README.md`, `AGENTS.md`, `CLAUDE.md`, `docs/afty-status.md`, `docs/a-fazer.md`, `docs/automacao-dsl.md`, `docs/afty-formulas-base.md` e os guias de Player, Addons, Ficha Final e Carteira.
- Catálogos de criaturas: `A Incrível Enciclopédia Digital 0.1` a `0.4` (JSON, na raiz do repositório).
- Suíte de lógica em `asserts/`, rodada por `npm run asserts`.
- Ausências a não fabricar: não há depoimentos, métricas de uso, números de usuários nem estudo de acessibilidade registrados.

## Product Principles

1. **Fidelidade antes de conveniência:** o livro manda, e a divergência é pergunta ou Addon, nunca atalho no dado cru.
2. **Resultado e origem, não lição:** a tela mostra o número e o aviso de problema real. A explicação mora no hover das fontes.
3. **Densidade legível na mesa:** o mestre em combate lê muitos números sob pressa, então hierarquia e escaneabilidade pesam mais que ornamento.
4. **Dois livros, uma fronteira nítida:** o que é do Grimório 2.5.2 e o que é do Afty não se misturam na interface nem no dado.
5. **Texto do usuário é dado, não código:** marcação e CSS do usuário não podem abrir caminho para HTML arbitrário na ficha exportada.
