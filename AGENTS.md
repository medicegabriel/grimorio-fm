# Instruções para IAs e colaboradores

Este arquivo vale para todo o repositório. Leia também o guia específico da área em que for trabalhar.

## Escrita

- É proibido usar o travessão Unicode U+2014 em qualquer texto novo ou alterado pela IA. A regra vale para documentação, interface, comentários, mensagens, títulos e descrições. Prefira vírgula, dois-pontos, ponto ou parênteses, conforme a frase.
- Não introduza novas ocorrências desse caractere ao editar texto antigo. Se uma fonte contiver o caractere, referencie a fonte sem reproduzi-lo.
- Texto de regra do livro deve permanecer fiel à fonte. Se a regra estiver ambígua ou faltar, registre a dúvida em `docs/a-fazer.md` e peça a decisão do autor.

## Projeto

- `src/components/` contém o Grimório 2.5.2. Preserve seu comportamento. O `Dashboard.jsx` já recebe algumas opções do Player; a fronteira definitiva dessas exceções continua pendente em `docs/a-fazer.md`.
- `src/systems/afty/` concentra o motor, as telas e os catálogos compartilhados por `/Afty` e `/Player`. A regra de uma ficha vem de `creature.rulesVersion`, não da rota em que ela foi aberta.
- Não faça commits nem envie alterações. O autor cuida dessa etapa.
- Antes de mudar código, confira a documentação específica e a implementação. Para mudanças de lógica, use `npm run asserts`; para mudanças de tela, confira também o comportamento no navegador.

## Documentação

- `docs/a-fazer.md` é a fila atual. Ao concluir uma entrada, retire-a da fila e registre a decisão ou a implementação no guia correspondente ou em `docs/afty-status.md`.
- `docs/afty-status.md` é o histórico de sessões. Afirmações datadas nele não substituem a verificação do código atual.
- Atualize contagens, caminhos, estados de implementação e instruções de navegação quando o código mudar. Não apresente uma decisão já tomada como pergunta em aberto. Antes de entregar, confira o diff e a resposta para garantir que não foi introduzido nenhum U+2014.
