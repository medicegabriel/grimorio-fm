# Auditoria da ficha Minamoto no Flugel

Data da leitura: 2026-09-12

Escopo: ficha exportada com `rulesVersion: "player"`, Nível 30, Combatente 20 e Conjurador 11. A auditoria foi feita contra o código presente na árvore de trabalho, incluindo os Addons embutidos no próprio arquivo exportado.

## Legenda

- **OK**: a parte mecânica relevante chega ao cálculo ou à ficha de jogo.
- **PARCIAL**: uma parte chega ao cálculo, mas outra continua apenas como texto, depende de controle manual ou não chega à sessão.
- **AUSENTE**: a escolha existe no catálogo, mas a mecânica principal não tem consumidor.
- **FICHA**: o motor existe, mas a escolha salva está incompleta ou inválida.
- **MESA**: não há número permanente a calcular e o procedimento permanece manual.

Esta classificação mede automação. Um poder marcado como MESA pode estar corretamente catalogado e ser plenamente utilizável por leitura, mas não está automatizado.

## Problemas que afetam a ficha agora

1. **Os níveis de especialização somam 31.** O arquivo guarda Combatente 20 e Conjurador 11. O motor apara o segundo para Conjurador 10, totalizando o Nível 30. A derivação fica coerente, mas o dado salvo está incoerente.
2. **Domínio dos Fundamentos tem duas escolhas disponíveis e nenhuma preenchida.** A ficha deveria ter duas entre Feitiço Cruel, Distante, Duplicado, Expansivo, Potente, Preciso e Rápido.
3. **Dominância em Feitiço não aponta para nenhum Feitiço.** O campo `reducoesCustoFeitico.dominancia` está `null`, então a habilidade escolhida não reduz custo algum.
4. **Apaziguador de Técnica está inacessível.** O motor exige Astúcia treinada no momento da escolha. A ficha só recebe Mestre em Astúcia pelo Anel da Astúcia Genial e o avaliador não aceita essa concessão como requisito permanente do Talento.
5. **A Faixa tem Habilidade Única vazia com um efeito oculto de `+12` Níveis de Dano.** O texto está vazio, mas o efeito é aplicado ao Ataque Básico. Esta é a maior divergência numérica da ficha.
6. **O Cinturão da Força tem a Segunda Habilidade Única vazia com `+8` de Força.** O bônus é aplicado sem texto correspondente.
7. **Há uma Passiva de Nível 1 sem nome, sem descrição e sem efeito.** Ela reduz o PE Máximo em 2 pela regra geral de Passivas do Player.
8. **O Laço da Vida está desequipado, mas aparece como uma cura de 270 PV.** O catálogo de cura recebe o item mesmo com `equipado: false`.
9. **O Anel da Provocação aplica o BT a todos os testes de Intimidação.** O texto limita o bônus a Provocar. A ficha também troca Intimidação inteira para Sabedoria, em vez de trocar apenas a ação Provocar.
10. **Destruidora nas Faixas foi corrigida depois da auditoria.** Potente já funcionava. O dado adicional de Destruidora agora entra apenas na fórmula crítica do Ataque Básico de pugilato.
11. **As vantagens dos três anéis de TR não existem mecanicamente.** Mestre e `+5` funcionam. Vantagem em Vontade, Astúcia e Reflexos não chega à rolagem.
12. **Anéis do Discernimento está parcial.** Metade do BT na Iniciativa funciona. Vantagem na Iniciativa e imunidade a Surpreendido e Desprevenido não têm efeito.
13. **Invencível sob o Sol ganhou estado e cálculo depois da auditoria.** Defesa, TRs, margem, posturas numéricas, custo de 4 PE por rodada, limite de quatro rodadas e Exaustão são aplicados. Os efeitos que dependem de alvo, reação ou escolha de rerrolagem continuam na mesa.

## Especializações escolhidas

### Conjurador

| Escolha | Estado | Resultado |
|---|---|---|
| Conhecimento Aplicado | OK | Controle de PE gasto e `+2` por ponto nos TRs existem. A pessoa ainda decide manualmente quando o teste veio de Feitiço. |
| Reação Rápida | OK | Soma o maior modificador entre Inteligência e Sabedoria na Iniciativa. |
| Energia Focalizada, Fortitude | OK | A escolha salva soma metade do maior modificador entre Inteligência e Sabedoria em Fortitude. |
| Movimentos Imprevisíveis | OK | Soma o maior modificador entre Inteligência e Sabedoria na Defesa, limitado pelo Nível. |
| Preparação de Técnicas | AUSENTE | Não existe escolha dos dois Feitiços preparados, consumo por descanso nem redução do primeiro uso. |
| Dominância em Feitiço | FICHA | O motor de redução existe, mas nenhum Feitiço foi escolhido nesta ficha. |
| Correção | MESA | Não existe controle de uso por rodada nem comando para preservar Concentração. |

### Combatente

| Escolha | Estado | Resultado |
|---|---|---|
| Assumir Postura | PARCIAL | Sol, Terra e Céu têm estados e efeitos. Duração, usos e cancelamento por condição continuam manuais. |
| Espírito de Luta | PARCIAL | `+2` no Acerto e PV temporário são calculados. O PV temporário calculado não é colocado automaticamente na sessão. |
| Guarda Estudada, Fortitude | OK | Defesa e `+2` em Fortitude funcionam. |
| Ataque Extra | MESA | A ação extra e o gasto de 2 PE não geram um segundo ataque automaticamente. A habilidade é usada pelo teto de Ataque Concentrado. |
| Crítico Melhorado | OK | Reduz a margem em 1. |
| Ataque Concentrado | OK no estado atual | Há faixa de 0 a 3, custo acumulado 0, 1, 3 e 4 PE, e os dados são aplicados ao próximo Ataque Básico ou arma. O arquivo `asserts/t-ataque-concentrado.mjs` passa com 21 asserts. |
| Indomável | MESA | Não há contador por descanso nem comando de rerrolagem. |
| Crítico Potente | AUSENTE | O dado adicional no crítico não é aplicado. |
| Surto de Ação | PARCIAL | Ainda é procedimento manual, mas passou a definir o teto 3 do Ataque Concentrado. |
| Mestre da Postura | PARCIAL | O segundo espaço de postura existe e os dois efeitos acumulam. Duração e usos continuam manuais. |
| Espírito Incansável | PARCIAL | O Acerto sobe de `+2` para `+5`. O PV temporário é calculado, mas não entra automaticamente na sessão. |
| Preparação Rápida | MESA | A troca para Ação Livre e as exceções de cancelamento não são rastreadas. |
| Extensão do Corpo | PARCIAL | `+2` no Acerto corpo a corpo e `+2` para evitar Desarmar funcionam. O aumento de 1,5 m no alcance não existe. |
| Crítico Aperfeiçoado | OK | Soma mais 1 à redução de Crítico Melhorado e produz redução total de 2. |
| Arsenal Cíclico | PARCIAL | O interruptor soma um dado. O sistema não confere troca entre grupos, janela de rodada nem saque. |
| Manejo Especial, Elemental | AUSENTE | A escolha é salva, mas não escolhe elemento e não altera tipo de dano. |
| Potência Antes de Cair | AUSENTE | Não há interrupção de turno, controle de uso, falhas de morte nem Exaustão automática. |
| Ciclagem Absoluta | PARCIAL | O `+2` no próximo Acerto funciona junto do interruptor de Arsenal Cíclico. As trocas de arma continuam manuais. |
| Manejo Único | AUSENTE | Não concede a segunda propriedade, não abre propriedade única temporária e não controla os 2 PE. |

### Habilidades básicas concedidas pelas classes

| Concedida | Estado | Resultado |
|---|---|---|
| Repertório do Especialista | PARCIAL | Estilo Defensivo, Duplo e Duelista estão escolhidos e seus números funcionam. Condições e uso da segunda arma são interruptores manuais. |
| Artes do Combate | PARCIAL | Pontos de Preparo existem. Execução Silenciosa e Golpe Descendente têm números. Arremesso Ágil, Distração Letal, Investida Imediata e recuperação de pontos continuam manuais. |
| Golpe Especial | PARCIAL | Atroz, Letal, Penetrante e Desfocado têm efeito. Amplo, Impactante, Longo, Preciso, Sanguinário e as mudanças de ação e custo não estão completos. |
| Implemento Marcial | OK | Soma `+4` na CD nesta ficha. |
| Renovação pelo Sangue | AUSENTE | Crítico e redução a 0 PV não restauram PE automaticamente. |
| Autossuficiente | PARCIAL | O dado adicional em todos os ataques funciona. Os 3 ou 6 PE temporários não são entregues. |
| Domínio dos Fundamentos | FICHA | Nenhuma das duas escolhas iniciais foi marcada. |
| Conjuração Aprimorada | OK para os números | Progressão de Feitiços e aumento dos Feitiços de dano são lidos pelo motor. |
| Adiantar a Evolução | OK | A progressão de nível máximo de Feitiço é aplicada. |
| Foco Amaldiçoado, Economia | OK | Soma 8 ao PE Máximo. |

## Talentos

| Talento | Estado | Resultado |
|---|---|---|
| Técnicas de Reação Rápida | PARCIAL | `+5` em Iniciativa funciona. A rerrolagem não tem botão nem uso. |
| Incremento de Atributo, Destreza e Sabedoria | OK | As duas compras elevam valor e limite e cobram duas vagas. |
| Provocação Desafiadora | MESA | Efeito em alvos e usos como Ação Livre não são rastreados. |
| Apaziguador de Técnica | FICHA e AUSENTE | Está inacessível pelo requisito de Astúcia e a resolução do Feitiço inimigo também não está automatizada. |
| Adepto de Briga | PARCIAL | Acerto e Níveis de Dano funcionam sem item de Pugilato. Nesta ficha ficam desligados pelas Faixas. A manobra gratuita após dano zero continua manual. |

## Aptidões Amaldiçoadas

| Aptidão | Estado | Resultado |
|---|---|---|
| Abençoado pelas Faíscas Negras | AUSENTE | Margem 19, redução adicional em Consciência Absoluta e bônus pós Kokusen não são aplicados. |
| Raio Negro | PARCIAL | `+30` PE, uma vaga de Aptidão e a fórmula de dano 1,5 vezes existem. Gatilho no d20, progressão da margem e duração da Consciência Absoluta continuam manuais. |
| Energia Reversa | OK | Linha de cura, dados, modificador e teto por PER funcionam. |
| Cura Amplificada | OK | Troca para d8, dobra o modificador e eleva o teto. |
| Fluxo Constante | PARCIAL | O valor de regeneração é calculado por PER. Momento, reação e consumo continuam sob controle da mesa. |
| Regeneração Aprimorada | MESA | Ferimentos, membros, veneno, custos e mudança de ação não têm sistema próprio. |
| Liberação de Energia Reversa | OK para seu efeito | A linha de cura passa de Você para Toque. |
| Cura em Grupo | PARCIAL | O teto recebe `+2` e a linha vira Grupo. O alcance numérico e a divisão entre alvos não são calculados. |
| Técnica Máxima | PARCIAL | O criador aceita Técnica Máxima com seus valores. Recarga por rodadas e uso na sessão não são rastreados. |
| Aura Maciça | OK | Soma 5 à Defesa. |
| Aura Reforçada | OK | Soma 10 de RD Física. |
| Aura Elemental, Chocante | OK | Tipo de dano, dado adicional escalado e interruptor funcionam. |
| Aura Anuladora | AUSENTE | Usos, custo por nível e anulação de condição não são controlados. |
| Canalizar em Golpe | PARCIAL | Controle e dados adicionais funcionam. Consumo em um acerto e preservação após erro são manuais. |
| Canalização Avançada | OK sobre Canalizar | Troca o dado para d8 e informa a reação. |
| Canalização Máxima | OK sobre Canalizar | Troca para d10 e soma Aura ao dano, com 1 PE adicional. |
| Cobrir-se | PARCIAL | O valor de PV temporário é calculado. Ele não é depositado automaticamente na sessão nem expira pelo turno do inimigo. |
| Estímulo Muscular | PARCIAL | Bônus de Acrobacia ou Atletismo e distância de Empurrar funcionam. Movimento e Pular não funcionam. Usos por rodada são manuais. |
| Estímulo Muscular Avançado | PARCIAL | Duplica os números de teste e de Empurrar pelo empilhamento correto. Movimento e limite de dois usos não são controlados. |
| Rastreio Avançado | MESA | É procedimento narrativo e teste manual. |
| Emoção da Pétala Decadente | AUSENTE | Ativação, Concentração, anulação e ataque garantido não têm controle. |
| Canalizar Energia Reversa | AUSENTE | Dano, custo, alvo Maldição e exclusão com Canalizar em Golpe não são implementados. |
| Concentrar Aura | OK para o dano | As quatro escolhas salvas geram 4d8 Após Ataque. Em 2026-09-12 o autor confirmou que Aura Redirecionadora e Aura Lacerante contam como passivas para esta aptidão. |
| Aura Redirecionadora | AUSENTE | O segundo ataque, novo alvo e bônus de Acerto não existem. Pode ser sacrificada por Concentrar Aura conforme decisão do autor. |
| Aura Movediça | AUSENTE | Terreno difícil e raio escalado não aparecem como resultado mecânico. |
| Transferência de Aura | AUSENTE | Não existe seleção de receptor, aptidão transferida, duração ou custo. |
| Aura do Bastião | AUSENTE | A Defesa dos aliados não é alterada. Pode ser sacrificada por Concentrar Aura. |
| Aura Excessiva | OK | Interruptor e 10 de RD Geral, exceto Alma, funcionam. |
| Aura Lacerante | PARCIAL | Existe como opção ofensiva de Golpe com Aura. Sua ativação própria, área, TR e dano no começo do turno não existem. Pode ser sacrificada por Concentrar Aura conforme decisão do autor. |

## O alcance exato da palavra “parcial”

A frase “diversos poderes estão parcialmente ligados” juntava defeitos diferentes. A inspeção dos consumidores do Motor, das linhas de dano e da sessão separa os casos que afetam esta ficha:

| Camada | Poderes escolhidos | O que funciona | O que ainda não funciona |
|---|---|---|---|
| Número calculado sem entrega na sessão | Espírito de Luta, Espírito Incansável, Cobrir-se, Fluxo Constante, Autossuficiente | Acerto, PV temporários, valor de regeneração e dado de dano aparecem nos derivados | Os PV temporários não entram automaticamente no pote da sessão, a regeneração não sobe o PV corrente e os PE temporários por Golpe Especial não são entregues. A exceção recém-programada é a Terra durante Invencível sob o Sol. |
| Interruptor sem controle de evento ou gasto | Arsenal Cíclico, Ciclagem Absoluta, Canalizar em Golpe, Estímulo Muscular, Golpe Especial | Os bônus numéricos reagem ao estado. Atroz, Letal, Penetrante e Desfocado respondem ao controle. | O sistema não verifica troca de grupo, alvo, acerto, erro, limite de uso ou gasto de PE desses ataques. O jogador liga e desliga o estado na hora adequada. |
| Alcance e resultado sobre terceiros | Extensão do Corpo, Cura em Grupo, Aura Lacerante, Assumir Postura | `+2` no ataque e para evitar Desarmar, teto e rótulo Grupo da cura, dano de Golpe com Aura e números das posturas entram. | Falta o alcance de 1,5 m da Extensão, dividir a cura entre alvos, a área e o TR da Lacerante, além de alguns efeitos de postura que exigem alvo, reação ou condição. |
| Escolha passiva versus uso ativo | Concentrar Aura, Aura Redirecionadora e Aura Lacerante | As quatro escolhas da ficha dão 4d8 após o ataque. O autor confirmou que Redirecionadora e Lacerante são passivas válidas para sacrificar. | Redirecionadora ainda não cria o segundo ataque e Lacerante não executa sua ativação própria. A validade da escolha não significa que esses dois poderes estejam automatizados. |
| Recurso de ação | Artes do Combate e Golpe Especial | O orçamento de Preparo, o dado de Execução Silenciosa e a Defesa de Golpe Descendente são calculados. | O consumo e a recuperação dos Pontos de Preparo, os gastos variáveis de PE, ações e seis propriedades não numéricas de Golpe Especial continuam na mesa. |

Crítico Melhorado, Crítico Aperfeiçoado, Aura Maciça, Aura Reforçada, Aura Elemental, Energia Reversa, Cura Amplificada e Liberação de Energia Reversa **não** pertencem a essa frase: seus efeitos numéricos escolhidos já chegam ao cálculo. Crítico Potente, Canalizar Energia Reversa e Aura Redirecionadora também não são “parciais” no sentido de um bônus incompleto: suas mecânicas centrais ainda não têm consumidor.

## Alto Nível

| Escolha | Estado | Resultado |
|---|---|---|
| Melhoria de Defesa | OK | `+4` na Defesa. |
| Melhoria de Resistência, Fortitude | OK | `+4` e margem crítica reduzida em 4. |
| Melhoria de Perícia, Intuição | OK | `+4` em Intuição. |
| Melhoria de Movimento | OK | `+6 m`. |
| Melhoria de Precisão | OK | `+4` nos ataques. |
| Negar a Morte | AUSENTE | Sem gatilho, vida restaurada ou uso por cena. |
| Resistência Lendária | AUSENTE | Sem comando de sucesso crítico nem dois usos por dia. |
| Atingir Ápice | OK como escolha | Abre e guarda a escolha de Invencível sob o Sol. |
| Preparo Absoluto | OK | `+5` em Iniciativa. |
| Consciência Absoluta da Alma | OK | Alma Máxima sobe para 125. |
| Invencível sob o Sol | PARCIAL | O estado aplica os números, custo, limite e Exaustão. Inclui todas as posturas, mesmo as não aprendidas, conforme resposta do autor. Falta automatizar Dragão, Fortuna, Tempestade, reação da Lua e troca de alvo da Devastação. |

## Treinamentos e Interlúdios

Orçamento confirmado: 129 Focos, 99 gastos nas Linhas, 2 nos Treinos Especiais e 16 na Forja. Restam 12.

| Escolha | Estado | Resultado |
|---|---|---|
| Agilidade completo | OK | Movimento, Acrobacia, Iniciativa, Reflexos e margem crítica funcionam. |
| Compreensão completo | OK | PE, Feitiçaria, Ocultismo e vaga livre de Aptidão funcionam. |
| Controle de Energia completo | OK | PE Máximo, nível de CL e PE temporário de combate e rodada funcionam. |
| Energia Reversa completo | PARCIAL | Nível de ER funciona. Teto por uso, desconto de Regeneração, regenerar membro por Fluxo e Exaustão de Técnica continuam manuais. |
| Luta completo | PARCIAL | Defesa, manobras e Níveis de Dano funcionam. Efeito crítico de pugilato e vantagem por rodada não existem. |
| Resistência completo | PARCIAL | PV, Fortitude e margem crítica funcionam. Dados de vida e ignorar a primeira falha de morte continuam manuais. |
| Treino de Atributo Não Congênito completo | OK | Ofício usa Sabedoria, recebe treinamento, `+2` de Sabedoria e aumento do limite. |
| Treino Cônjuge completo | PARCIAL | O interruptor liga perícia substituída, Defesa, Acerto e Iniciativa. Distâncias, usos e presença real do cônjuge não são verificadas. A herança escolhida abre uma vaga de Talento, mas não copia uma escolha do cônjuge. |
| Treino Cônjuge Pt. 2 completo | PARCIAL | Percepção e Intuição funcionam pelo interruptor. Alcance, Apoiar e herança real continuam manuais. |
| Benção da Adaptação completo | PARCIAL | Troca de atributo, Acerto, limite e atributo funcionam. A Técnica Máxima temporária é criada na mesa. |
| Treino de Perícia, 21 instâncias | PARCIAL | Proficiência e bônus numéricos funcionam. Vantagens e rerrolagens das etapas permanecem manuais. |
| Treinamento para Habilidade, duas vezes | OK | Concede duas vagas e respeita o teto 4 desta ficha. |
| Forja, 16 Focos | OK como caderno | Consome 16 Focos e guarda o texto. Não possui regra mecânica por decisão registrada. |

## Equipamentos, encantamentos e Passivas

| Entrada | Estado | Resultado |
|---|---|---|
| Revestimento Robusto, Grau Especial | OK na base | Defesa 6 e penalidade são aplicadas. |
| Blindado | OK | `+2` na Defesa. |
| Propulsor | OK | `+3 m`. |
| Impulso | PARCIAL | Cargas aparecem. Linha, deslocamento e dano por distância continuam manuais. |
| Ajustado | OK | Reduz a penalidade em 1. |
| Faixas, Grau Especial | PARCIAL | Alimenta o Ataque Básico. A Habilidade Única vazia injeta `+12` Níveis de Dano sem regra visível. |
| Precisa | OK no estado atual | Soma `+2` sem criar a parcela negativa de Grau na Ficha de Player. O teste específico passa. |
| Potente | OK | Soma um dado e o dado dobra no crítico. |
| Destruidora | CORRIGIDO | Soma um dado próprio somente na fórmula crítica do Ataque Básico definido pelas Faixas. |
| Otimizada | PARCIAL | `+2` em Iniciativa funciona. Saque livre continua manual. |
| Anéis do Conhecimento | OK | `+2` Sabedoria. |
| Faixas Céleres | OK | `+2` Destreza. |
| Laço da Vida, desequipado | ERRO | Ainda oferece cura de metade do PV, 270 nesta ficha. |
| Cinturão do Inabalável | OK | `+2` Constituição. |
| Ombreiras do Vigor Superior | OK | `+20` PV Máximo. |
| Anel da Vitalidade | OK | Limite e Constituição chegam a 30. |
| Anel da Destreza | OK | Limite e Destreza chegam a 30. |
| Anel da Força de Vontade | PARCIAL | Mestre e `+5` funcionam. Vantagem não. |
| Anel da Astúcia Genial | PARCIAL | Mestre e `+5` funcionam. Vantagem não e a proficiência não qualifica Apaziguador. |
| Anel dos Reflexos Ágeis | PARCIAL | Mestre e `+5` funcionam. Vantagem não. |
| Anéis do Discernimento | PARCIAL | Metade do BT na Iniciativa funciona. Vantagem e imunidades não. |
| Anel do Desarme | PARCIAL | `+BT` para resistir funciona. Sucesso garantido e uso por rodada não. |
| Anel da Manobra | PARCIAL | `+BT` para resistir a Agarrar funciona. Sucesso garantido e uso por rodada não. |
| Anel da Provocação | ERRO | O bônus e a troca de atributo vazam para toda Intimidação, não apenas Provocar. |
| Anel da Atração em Combate | MESA | As duas mudanças de Provocar não têm alvo inimigo onde serem aplicadas. |
| Cinturão da Força | ERRO e PARCIAL | `+12` Carga funciona e saque livre é manual. `+8` Força é aplicado por uma Segunda Habilidade sem texto. |
| Benção da Carga, Passiva Nível 5 | PARCIAL | `+20` Carga funciona e custa 10 PE Máximo. Está sem descrição. |
| Benção da Penalidade de Armadura, Passiva Nível 5 | OK | Reduz a penalidade em 3 e custa 10 PE Máximo. |
| Passiva Nível 1 sem nome | FICHA | Não faz nada e custa 2 PE Máximo. |

## Verificações executadas

- `npx eslint src/systems/afty/ asserts/`: passou.
- `npx vite build`: passou. Apenas o aviso conhecido de tamanho do bundle.
- `npm run asserts`: 82 arquivos e 4.333 asserts, todos passaram.
- `node asserts/t-ataque-concentrado.mjs`: 21 asserts passaram.
- `node asserts/t-pugilato.mjs`: 59 asserts passaram.
- `node asserts/t-invencivel-sob-o-sol.mjs`: 24 asserts passaram.
- Navegador: `/Player`, `/Afty` e o painel de Encontros em 1440px e 390px, com a ficha exportada. Sem erro de página nem rolagem horizontal. Ativação do Ápice e virada de rodada conferidas também no Encontro.
- `git diff --name-only -- src/components/`: vazio no estado final observado.

Esta auditoria começou como leitura. As correções de Destruidora, Fatal, Mortal e Invencível sob o Sol foram aplicadas na continuação da sessão. A árvore já continha outras mudanças em andamento, que foram preservadas.
