# Agora na Mesa como seção única

Lote iniciado em 22/10 e concluído em 23/10/2026. O autor pediu repensar a
composição para reduzir a poluição visual e dar melhor apresentação a esses
controles importantes. O ajuste anterior de largura e tipografia foi insuficiente.

## Composição entregue

Uma seção comum, com cabeçalho visível e a mesma linguagem dos grupos de
Rápido e Dano. As nove molduras individuais foram removidas. Divisórias
discretas separam as entradas, e os botões diretos usam tratamento secundário.
Montar Golpe mantém o destaque de ação de preparação.

Nome e estado compõem uma única área de leitura que abre o painel existente.
O nome continua acessível pelo mesmo rótulo, com o estado associado por
aria-describedby. A ação direta é um botão separado. No telefone, a seção
vira uma lista contínua, com alvos de pelo menos 40 px no toque.

Nenhum acesso, contador ou estado foi retirado. Os textos de resumo continuam
vindo de celulasDaMesa, sem novo cálculo. Abertura automática por pendência,
fechamento voluntário, retenção dos painéis e cobrança do Golpe continuam nos
mesmos caminhos. Os corpos permanecem montados com AbaCongelada.

Somente MesaG2.jsx e abas-g2.css mudaram. A fonte de estados, os verbos,
o motor e os outros componentes aprovados foram preservados.

## Conferência técnica e visual

| Conferência desta entrega | Resultado |
|---|---|
| Lint de Afty | aprovado, saída 0 |
| Build exclusivo da prévia | aprovado |
| Asserts existentes da prévia | 52/52 |
| Leiaute focado, SO_ALTURA=1 | 94/94 |
| Interação das abas, roteiro existente | 53/53 |
| Roteiro próprio da Mesa | 50/50 |

O roteiro próprio cobre seis composições reais, acesso por teclado,
rascunho do Bloodfeast, controles de olhos e aura, Treinos, Preparação do
Golpe e Voltar, operação indisponível fora de combate e pendência de Adaptação.
Testa nome/estado completos, ausência de sobreposição e estouro, alvos de
toque e preservação da sessão durante consulta. A pendência usa só uma cópia
da sessão sintética, com chave obtida do catálogo instalado.

Uma verificação inicial do roteiro comparava o retorno do Golpe com a sessão
anterior a todos os testes de interruptores. A comparação foi corrigida para
o instante imediatamente anterior a Montar Golpe. Logs e JSON iniciais foram
preservados em mesa-inicial.*. Não houve correção de produto por essa diferença.

Inspecionados no navegador: composição completa em 1064 px, lista no telefone,
tema escuro, claro e pendência. Minamoto e CSS personalizado também foram
capturados pelo roteiro. Os controles indisponíveis mantêm a recusa existente
e não recebem o destaque de hover. Foco e estados ativos têm indicação própria.

## Medidas

| Caso | Refinamento anterior | Seção unificada |
|---|---|---|
| Nove entradas, 1064 px | 192,55 px de altura | 181,55 px |
| S2, 1280 com compacta | 302 px | 249 px |
| S2, 1440 | 195 px | 163 px |
| S1, 1280x800 com compacta e barra real | fim de Dano em 788 | 792, ainda na primeira tela |
| S1, coluna efetiva de 331 px | fim de Dano em 962/1024 | 928/1024 |

A folga atual de S1 em 1280x800 é 8 px, antes 12. S2 continua com Dano
abaixo da dobra em 1280 com compacta. No telefone, o livro ainda interfere
no canto, limitação existente e fora desta alteração. A casca da prévia
continua sem o armazenamento real do App. Não houve novo ensaio de desempenho
nem repetição da suíte completa de regras, cujas duas falhas históricas seguem
registradas nos pareceres anteriores.

## Preservação e estado

Os 331 arquivos de src e os 14 do dist diário foram conferidos por hash.
Mudaram somente os dois arquivos previstos. preservacao.json compara também
os arquivos servidos pela 5330 com a compilação em disco. App, clássica,
Encontro, src/components e dados reais preservados. A 5173 não foi usada.
O remoto ao vivo continuou inacessível por conexão, sem integração ou fetch.

Prévia atualizada em http://127.0.0.1:5330/?ficha=mesa&tema=escuro.
Implementação e conferência encerradas, nova avaliação visual fica com o autor.
Os registros anteriores permanecem históricos. Integração nas rotas normais
continua dependendo de autorização própria. Barra antiga 9/10 preservada.
Sem commit, push, merge ou deploy.
