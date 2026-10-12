# Olhinhos Lu( Corpo Principal )

Fonte: texto enviado pelo autor em 2026-10-12.

Enquanto de olhos estiverem fechados de alguma forma, o Coded Gigas fornece os seguintes efeitos:

PRO:
- Enquanto com os olhos fechados Ciel recebe 3x seu Nível de Controle e Leitura em Intuição. (Arredondado para Cima)

- Pode mudar o Calculo de Atenção para usar Intuição, além de poder trocar Testes de Percepção por Intuição.

- Consegue enxergar por Técnicas de Barreiras, além de conseguir ativamente ver os Limites de um Domínio e enxergar o Domínio Inato das pessoas.

## Decisões confirmadas

Condição corporal, sem compra de Habilidade ou Talento. Bônus adicional de
`teto(3 * cl)` à Intuição, usando Controle e Leitura efetivo.

Ao escolher Atenção com Intuição, os efeitos destinados à Percepção passam
para a cópia de Intuição usada exclusivamente nesse cálculo, inclusive os
de Talentos e Habilidades Lendárias. Os efeitos diretos de Atenção continuam
aplicados uma vez. As linhas de Percepção e Intuição e suas escolhas gravadas
permanecem independentes. Treino concedido não soma duas faixas Treinado
para inventar Mestre. Dados extras de teste não viram número de Atenção.

Desde a versão 1.1.0, a condição segue o padrão do Vislumbre Celeste:
`permite: ["olhinhosLu"]`, sem entrada de catálogo ou gasto de vaga.
O card próprio fica na aba Habilidades, nos três ramos de origem, junto
das outras condições corporais. Os controles do criador ficam na Simulação
de Combate. A Ficha Final e o Encontro têm painel próprio na aba Ações.

O estado dos olhos vem diretamente de `creature.combate`, que recebe o
combate da sessão durante o jogo. Os efeitos independem de Em Combate,
usam a mesma fonte do card e somam com Feitiços e outras fontes. O motor
emite só o bloco ativo, sem depender de variáveis de contador de origem.
Campos antigos de `origemContadores` são apenas fallback, com precedência
dos estados novos quando presentes. A sessão pode abrir ou fechar os
olhos sem alterar a simulação gravada no criador. Descanso preserva os olhos.

Trocar um Teste de Percepção por Intuição é escolher rolar Intuição na mesa.
Visão de Barreiras, Limites de Domínio e Domínio Inato permanece no texto
integral da condição. Não há teste, alcance ou custo adicional informado.

Pacote: `addons/olhinhos-lu.json`, versão 1.1.0. Atualizar a cópia instalada
na ficha para ativar a primitiva nova. O site precisa receber o motor e os
painéis novos. Arquivos: `afty-olhinhos-lu.js`, `ui/OlhinhosLuCard.jsx`
e `ficha/PainelOlhinhosLu.jsx`, todos em `src/systems/afty/`.
