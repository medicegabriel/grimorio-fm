# Instruções para IAs e colaboradores

Este arquivo vale para todo o repositório. Leia também o guia específico da área em que for trabalhar.

## Escrita

- É proibido usar o travessão Unicode U+2014 em qualquer texto novo ou alterado pela IA. A regra vale para documentação, interface, comentários, mensagens, títulos e descrições. Prefira vírgula, dois-pontos, ponto ou parênteses, conforme a frase.
- Não introduza novas ocorrências desse caractere ao editar texto antigo. Se uma fonte contiver o caractere, referencie a fonte sem reproduzi-lo.
- Texto de regra do livro deve permanecer fiel à fonte. Se a regra estiver ambígua ou faltar, registre a dúvida em `docs/a-fazer.md` e peça a decisão do autor.

## Projeto

- `src/components/` contém o Grimório 2.5.2 e é somente-leitura, salvo as exceções listadas abaixo. Exceção nova só entra com o autor consultado antes, numa destas três formas, e entra na lista no mesmo dia (regra decidida pelo autor em 2026-10-03):
  1. Parâmetro opcional cujo padrão é o comportamento de hoje, com o valor decidido em `src/App.jsx`.
  2. Leitura de um campo que nenhuma ficha da 2.5.2 tem (`rulesVersion` "player", Patamar "beyond"), comparando a string crua, para a 2.5.2 não importar nada do Afty.
  3. Mudança que o autor pediu para as três rotas.
- As exceções aceitas em `src/components/`:
  - `useCreatureStorage.js`: `namespace` e `defaultRulesVersion` (2026-07-15, o nascimento do `/Afty`). Forma 1.
  - `Dashboard.jsx`: a entrada `beyond` no `PATAMAR_STYLES` (2026-08-18). Forma 2.
  - `Dashboard.jsx`: o card e o fantasma do arrasto da ficha de jogador escondem Patamar, HP, PE e Defesa e trocam "ND" por "Nível" (2026-08-30). Forma 2.
  - `Dashboard.jsx`: `titulo` e `showSystemView` (2026-09-09). Forma 1.
  - `Dashboard.jsx`: `vocab` (2026-09-10). Forma 1.
  - `PdfFab.jsx` e `PdfViewerModal.jsx`: a janela do Livro de Regras virou flutuante, arrastável, redimensionável e minimizável, em `z-[120]` (2026-10-02). Forma 3.
  - `io-utils.js`: o `parseImportText` dá "Sem nome" à ficha sem nome em vez de derrubar o pacote inteiro (2026-10-03). Forma 3.
- `src/systems/afty/` concentra o motor, as telas e os catálogos compartilhados por `/Afty` e `/Player`. A regra de uma ficha vem de `creature.rulesVersion`, não da rota em que ela foi aberta.
- Não faça commits nem envie alterações. O autor cuida dessa etapa.
- Antes de mudar código, confira a documentação específica e a implementação. Para mudanças de lógica, use `npm run asserts`; para mudanças de tela, confira também o comportamento no navegador.

## Documentação

- `docs/a-fazer.md` é a fila atual. Ao concluir uma entrada, retire-a da fila e registre a decisão ou a implementação no guia correspondente ou em `docs/afty-status.md`.
- `docs/afty-status.md` é o histórico de sessões. Afirmações datadas nele não substituem a verificação do código atual.
- Atualize contagens, caminhos, estados de implementação e instruções de navegação quando o código mudar. Não apresente uma decisão já tomada como pergunta em aberto. Antes de entregar, confira o diff e a resposta para garantir que não foi introduzido nenhum U+2014.
