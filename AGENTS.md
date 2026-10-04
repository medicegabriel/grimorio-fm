# agente.md: Diretrizes do Agente e Instruções Globais

Este arquivo define as regras de comportamento do agente de IA e de qualquer colaborador no repositório do Grimório do Afty (localizado em `work/grimorio-fm`). Você é um agente atuando em um ambiente colaborativo. O respeito estrito a estas regras é fundamental para o bom convívio do projeto e para evitar retrabalho, conflitos de código ou corrupção do sistema principal.

Antes de iniciar qualquer tarefa, leia os seguintes documentos nesta ordem:
1. `grimorio-tracker/docs/afty-status.md` (Comece pela seção "SESSÃO DE 2026-07-29" e depois leia "Contexto rápido").
2. `grimorio-tracker/docs/automacao-dsl.md`
3. `grimorio-tracker/docs/afty-formulas-base.md`

## 1. Regras de Atuação do Agente e Workflow (Git)
- **Verificação Inicial de Contexto:** Sempre que iniciar uma sessão de trabalho, verifique se houve alguma alteração no repositório base (https://github.com/medicegabriel/grimorio-fm) para garantir que você está operando na versão mais recente do código.
- **Prevenção de Conflitos:** Por ser um projeto com vários colaboradores, ao preparar entregas ou mudanças, verifique sempre se há conflitos com o repositório remoto. Proteja o trabalho da equipe.
- **Limites de Autonomia (Commits):** O agente **nunca** deve rodar `git commit` ou `git push`. Apenas prepare as mudanças, avise sobre possíveis conflitos e deixe o autor humano realizar o commit.
- **Comunicação Ativa:** Pare e pergunte sempre que tiver dúvida de regra. É obrigatório pedir esclarecimentos em vez de agir com base em suposições.

## 2. Arquitetura e Limites de Código (A Regra de Ouro)
- **NÃO TOQUE NO GRIMÓRIO 2.5.2:** O sistema base está em produção e é estritamente **somente-leitura**.
- Tudo dentro de `src/components/` (incluindo `builder-controls.jsx`, `AutomationBuilder.jsx`, `fm-dsl.js` e as pastas `sections/`) pode ser importado, mas **nunca editado**.
- Se precisar de algo do 2.5.2 que não pode ser importado, copie para o lado do Afty e documente no código a origem do arquivo.
- **Isolamento do Afty:** Todo o sistema Afty (motor, telas, catálogos) vive **exclusivamente** em `src/systems/afty/`. A rota correspondente é `/Afty`, que é escondida e possui storage isolado.
- A regra de qual ficha usar vem sempre de `creature.rulesVersion`, não da rota onde ela foi aberta.
- **Validação de isolamento:** Ao terminar qualquer tarefa, o comando `git diff --name-only | grep src/components/` **deve** retornar vazio.

## 3. UI, Escrita e Regras de Negócio
- **Fidelidade (VERBATIM):** O texto de regra vem exatamente como está no livro. Não parafraseie, não resuma, não invente. Se a regra for ambígua ou estiver faltando, registre a dúvida em `grimorio-tracker/docs/a-fazer.md` e pergunte ao autor.
- **Caracteres Proibidos:**
  - É expressamente proibido usar o travessão Unicode (U+2014 / em-dash) em qualquer texto novo ou alterado (documentação, UI, comentários, mensagens). Prefira vírgula, dois-pontos ou parênteses. Não introduza este caractere ao editar textos antigos.
  - Nunca use ponto-e-vírgula (`;`) em textos que aparecem na interface (UI).
- **Sem Explicações na UI:** Nada de textos explicativos na interface (sem hint, nota, lore ou fórmulas matemáticas escritas). Mostre apenas resultados e avisos.
  - A explicação de cálculos e números vai no `hover` das fontes.
  - A explicação de itens vai no atributo `title`.
  - O criador de fichas calcula, ele não ensina.

## 4. Validação de Entrega
Antes de devolver o código ao usuário, execute mentalmente ou sugira a execução do seguinte checklist:
1. `npx eslint src/systems/afty/`
2. `npx vite build`
3. `npm run asserts` (incluindo asserts de lógica rodando o `deriveAfty` via `node --input-type=module`).
4. Conferência do comportamento no navegador.
5. Conferência do diff para garantir a ausência de conflitos não resolvidos, de alterações na pasta `src/components/` e de uso do caractere U+2014.

## 5. Atualização de Documentação e Registro de Tarefas (OBRIGATÓRIO)
O agente nunca deve terminar uma tarefa sem registrar seu rastro de desenvolvimento:
- **Fechamento de Tarefa:** Ao concluir qualquer demanda, retire imediatamente a entrada correspondente da fila em `grimorio-tracker/docs/a-fazer.md`.
- **Histórico de Sessão:** Registre um resumo claro da decisão tomada ou da implementação concluída em `grimorio-tracker/docs/afty-status.md` (atualizando a sessão atual).
- **Manutenção do Motor de Automação:** Se você criar, editar ou corrigir qualquer comportamento do Motor de Automação, do DSL ou das fórmulas, é **obrigatório** documentar essa mudança atualizando os arquivos `grimorio-tracker/docs/automacao-dsl.md` e/ou `grimorio-tracker/docs/afty-formulas-base.md`.
- **Consistência Final:** Atualize contagens, caminhos e estados de implementação ao alterar o código. Não deixe decisões já tomadas marcadas como perguntas em aberto.

## 6. Registro de exceções existentes no remoto (2026-10-03)

Lista recebida da main atualizada. Preserva o registro das alterações já aceitas pelo autor. Esta integração não altera arquivos de `src/components/`.

No registro abaixo, Forma 1 é parâmetro opcional com o padrão preservado e valor decidido em `src/App.jsx`. Forma 2 é leitura de campo exclusivo de fichas novas, comparando a string crua, sem importar Afty na 2.5.2. Forma 3 é mudança pedida pelo autor para as três rotas.

- As exceções aceitas em `src/components/`:
  - `useCreatureStorage.js`: `namespace` e `defaultRulesVersion` (2026-07-15, o nascimento do `/Afty`). Forma 1.
  - `Dashboard.jsx`: a entrada `beyond` no `PATAMAR_STYLES` (2026-08-18). Forma 2.
  - `Dashboard.jsx`: o card e o fantasma do arrasto da ficha de jogador escondem Patamar, HP, PE e Defesa e trocam "ND" por "Nível" (2026-08-30). Forma 2.
  - `Dashboard.jsx`: `titulo` e `showSystemView` (2026-09-09). Forma 1.
  - `Dashboard.jsx`: `vocab` (2026-09-10). Forma 1.
  - `PdfFab.jsx` e `PdfViewerModal.jsx`: a janela do Livro de Regras virou flutuante, arrastável, redimensionável e minimizável, em `z-[120]` (2026-10-02). Forma 3.
  - `io-utils.js`: o `parseImportText` dá "Sem nome" à ficha sem nome em vez de derrubar o pacote inteiro (2026-10-03). Forma 3.
