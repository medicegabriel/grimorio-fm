# Player: Progressão Épica e Alto Nível Afty

Implementado em 2026-10-05 para converter a ficha de Satoru Gojo do Grimório Afty para Player.
As regras pertencem à ficha e seguem rulesVersion, inclusive em Encontros.

## Arquivos e importação

- addons/player-progressao-epica.json: nível acima de 30, progressão de Aptidão e Interlúdios.
- addons/player-alto-nivel-afty.json: 11 Melhorias e 20 Lendárias, incluindo Atingir Ápice.
- previas/satoru-gojo-player.json: exportação versão 2.0, pronta para Importar na rota /Player.

A prévia leva os dois addons novos e os dois originais (Criação de Equipamentos e Vislumbre Celeste).
Não precisa instalar os pacotes separadamente para importar essa ficha. Para usar em outra ficha,
instale os JSONs em Outros > Addons e ative cada pacote desejado.

## Progressão

| Regra | Resultado |
|---|---|
| Nível | Sem teto de 30 quando o addon está ativo |
| Nível de Aptidão após 20 | +1 no 22, 24, 26, 28, 30, 32 e seguintes |
| Interlúdios | piso(1,5 × Nível); 52 no nível 35 |
| Atributos por nível | 3 pontos a cada 4 níveis, preservando os 24 distribuídos do Gojo |
| Melhorias Superiores | Uma a cada nível ímpar a partir de 21; 8 no nível 35 |
| Habilidades Lendárias | Uma a cada nível par a partir de 22; 7 no nível 35 |
| Atingir Ápice | Pré-requisito normal, nível 26; Ápices permanecem iguais |
| Treino para Habilidade e Aptidão | Teto normal de Player: 2 ganhos a partir do nível 10 |

O Treino para Feitiço conserva a escada de Player. Nenhum Treino Especial recebe teto de criatura.
O total de Interlúdios é calculado e o campo fica somente para leitura. Canais que concedem Focos
continuam somando; uma Carteira que substitua os Focos conserva sua precedência.
Remover o addon restaura o teto normal de 30, sem apagar o nível gravado ou as escolhas.

## Melhorias Superiores

As descrições e repetições seguem o texto fornecido pelo autor. Defesa e CD usam metade do BT,
Energia usa BT e Movimento usa piso(BT / 2) × 1,5 m. Dano concede BT em ataques e Aptidões;
Feitiço de Dano recebe o Nível em lugar de BT. Alma concede 15 e depois 10, com duas pegas.
Vida concede 20 e depois 15 em cada uma das outras duas pegas.

Perícia recebe metade do BT apenas na escolha. Resistência soma metade do BT em todos os TRs
e reduz a margem de crítico apenas no escolhido. As metades seguem o arredondamento para baixo do motor.
A Integridade da Alma conserva a regra de Player: é uma pilha de PV e os aumentos também somam nos PV.

## Habilidades Lendárias

Dominância em Técnica pede escolher entre 3 vagas compartilhadas de Feitiço/Técnica Marcial/Estilo
e 5 vagas exclusivas para Variação de Feitiço. Na segunda opção, marque os Feitiços no editor como
"Variação de Feitiço (Dominância em Técnica)". O orçamento usa essas cinco vagas primeiro.
As variações de Liberação Máxima continuam separadas e gratuitas pelas regras já existentes.

Conhecimento Iluminado só oferece perícias previamente treinadas e promove até três a Mestre.
Versatilidade Extrema volta ao Player, concede um Nível de Aptidão e eleva o limite escolhido para 6.
Invencível exige nível 26 e Intocável ou Inquebrável; sua RD também cobre dano à Alma.
Manipulação Avançada exige Favorecido pela Energia ou Inesgotável e reduz metade de Controle e Leitura.
Ela disputa com outras reduções gerais de PE, aplicando o maior benefício, sem somá-los.
Reduções específicas de um gasto e aumentos de custo continuam seguindo suas próprias regras.

Negar a Morte mostra um uso por cena e PV igual ao dobro do Nível. Resistência Lendária mostra
dois usos por dia, recuperados pelo controle de descanso. Incansável mostra o bônus de metade do Nível
ao receber Cura ou PV Temporários; Agilidade, Motivação Constante e Visar o Sucesso mostram seus
valores de mesa. Os gatilhos narrativos dessas habilidades continuam sendo aplicados pelo jogador.
Não há detecção automática de morte, cura recebida ou acerto crítico para disparar uma Lendária.

## Prévia de Gojo

Atributos finais preservados: FOR 16, DES 22, CON 32, INT 24, SAB 20, PRE 18.
Classes preservadas: Conjurador 20, Lutador 7 e Combatente 8. As habilidades de Especialização
e as 28 Aptidões Amaldiçoadas escolhidas foram mantidas. Perícias e TRs conservam as marcações
originais para o autor revisar manualmente; nenhuma escolha nova foi feita.

A prévia usa outro id, não tem pasta pendente e começa fora de combate. Recursos atuais e o cache
de máximos foram recalculados como Player: 881 PV, 253 PE, 881 Integridade, Defesa 72 e CD 64 (Implemento Marcial aplicado uma vez).
A bancada de simulação conserva suas configurações e começa desligada.
As Habilidades Gerais exclusivas de criatura foram retiradas. Oito ganhos de Treino para Feitiço
foram mantidos e os ganhos de Treino para Habilidade e Aptidão foram aparados a dois cada.

**Revisão pendente do autor:** as Linhas e Treinos Especiais mantidos gastam 82 Focos para um total de 52.
O aviso de excesso continua visível. Não foi concedido bônus oculto de Focos nem foram retiradas
Linhas de Treinamento. Feitiços, Domínio, votos, equipamentos e aparência foram preservados.

## Implementação e validação

As regras opcionais estão em afty-regras-addon.js e o nível efetivo é centralizado em nivelDaFicha.
Remendos e entradas de Alto Nível são lidos dos addons da própria ficha, evitando vazamento em
Encontros mistos. efeitosAlvo permite remendar bônus cujo destino é uma escolha.
O canal vagasVariacao conta apenas o campo variacaoDeTecnica, sem reutilizar variacaoDe da Liberação.

asserts/t-player-progressao-epica.mjs cobre progressão até nível 50, limites, cálculos, escolhas,
pré-requisitos, não acumulação de PE, remoção dos addons e a prévia real.
