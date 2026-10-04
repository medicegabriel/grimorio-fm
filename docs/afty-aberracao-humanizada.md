# Aberração Humanizada

O addon está em [`addons/aberracao-humanizada.json`](../addons/aberracao-humanizada.json). Para instalar, abra **Outros > Addons**, cole o conteúdo do JSON e ative o pacote na criatura.

## Regras

- Limite natural de 30 em Força, Destreza, Constituição, Inteligência, Sabedoria e Presença.
- Bônus em Atributo: 3 pontos livres, no máximo 2 em um mesmo atributo.
- Herança Maldita e Físico Amaldiçoado usam o texto e o pool de Anatomia do Feto Amaldiçoado Híbrido. Há uma escolha de Anatomia no início e outra a cada 5 níveis.
- Natureza Amaldiçoada usa o texto da Maldição e concede uma vaga de Aptidão no início, mais uma nos níveis 10 e 15, e 1 PE adicional por nível.
- A aba Maldição aparece junto da aba Energia Reversa. A criatura mantém a trilha de Níveis de Aptidão em Energia Reversa, suas Aptidões e a Linha de Treinamento correspondente.
- Físico Aperfeiçoado e Reposição Sanguínea, os Talentos de Origem do Feto Amaldiçoado Híbrido, ficam disponíveis a partir do nível 6.

O campo `categoriasAptidaoAdicionais` na origem permite acrescentar uma aba sem alterar sua origem estrutural. Esta origem não herda as restrições da Maldição do livro. O campo é lido da origem escolhida, então instalar o pacote não abre a categoria para outras origens.

A Reposição Sanguínea menciona Vigor Maldito, característica que a Aberração Humanizada não possui. O Talento fica selecionável; a aplicação desse efeito depende de uma decisão do autor. A redução e a conversão da cura em Herança Maldita continuam como procedimento de mesa, tal como na origem do livro. A escolha de Anatomia e os números da Natureza Amaldiçoada são processados pela ficha.

## Verificação

`node asserts/t-aberracao-humanizada.mjs` cobre instalação, limites, bônus, PE, vagas, acesso simultâneo às categorias e à trilha de Energia Reversa, os Talentos do Feto no nível 6, isolamento e desinstalação. A suíte completa é `npm run asserts`.

