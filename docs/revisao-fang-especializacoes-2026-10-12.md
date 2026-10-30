# Auditoria da ficha Fang Yuan - Restringido

Pedido: verificar, habilidade por habilidade, a implementação e a automação das Habilidades de Especialização da ficha enviada.

Data da auditoria: 2026-10-12, America/Sao_Paulo. Os quadros abaixo registram a situação inicial.

Atualização de 2026-10-13: ver decisões e correções ao final. A situação inicial não é a fila vigente.

## Fonte e reprodução

- Exportação enviada: versão 2.0, personagem `mv5xvhd1-3pc1ccm`, `rulesVersion: player`, nível de personagem 30.
- Código local e HEAD remoto conferidos: `68888733deffa9700aa69761fd965a504b9152db`. Alterações locais anteriores preservadas.
- Livro de Regras vigente: `C:/Projetos/Grimorio/F&M 2.5.2 - Livro de Regras.md`, SHA-256 `1d0713d52c818a9ab9f47b883d9887a0d227d174d30ffcce358874669a7a733a`.
- Todos os addons congelados na exportação foram aplicados antes de derivar, como faz a Ficha Final. Nenhum problema de validação de addon foi reportado.
- Resultado reproduzido: **4.548 PV, 265 Estamina, Defesa 95, CD 48**.
- Há 24 pegas diretas, sendo 23 habilidades distintas, pois Respeito Celeste aparece duas vezes. Somam-se sete bases automáticas e sete roubadas: **37 habilidades distintas efetivas**. As oito Dádivas selecionadas também foram verificadas.
- Embora o JSON guarde `especializacoes: [{ id: restringido, nivel: 15 }]`, o resolvedor da classe única usa o nível de personagem 30. O contexto final tem `esc_restringido = 30`, `esc_lutador = 0` e `esc_combatente = 0`. O cálculo reproduzido considera esses níveis efetivos, sem editar o arquivo.
- O campo antigo `combatState` não representa a sessão usada pela Ficha Afty/Player. Os valores exportados de `stats` são instantâneos. Esta revisão reproduz a bancada `creature.combate` e testa separadamente as funções da sessão.

## Significado dos estados

**OK**: o benefício numérico ou a concessão está ligado e corresponde ao texto no recorte testado. **Parcial**: há cálculo ou controle, mas parte da regra continua manual. **Erro**: existe comportamento que omite ou aplica incorretamente um benefício. **Texto**: a entrada existe, mas não há uma execução específica de seu efeito.

Ausência em `HABILIDADE_EFEITOS` não foi usada sozinha para decidir cobertura. Foram conferidos resolvedores de escolhas, concessões, Imitação, testes, cura, estados de combate, usos, conteúdo da ficha e transições da sessão. Ações e circunstâncias narrativas continuam exigindo decisão da mesa. Controle manual não foi confundido com execução automática.

## Habilidades escolhidas

| Habilidade | Página | Estado | O que funciona e o que falta |
|---|---:|---|---|
| Pináculo Físico | 123 | OK | +4 Estamina. As escolhas de Destreza e Constituição emitem +4 cada no nível efetivo 30, respeitando os tetos de atributo. |
| Força Imparável | 121 | Parcial | As duas escolhas concedem treino conforme a proficiência prévia. Não distingue uma escolha de Treinado e outra de Mestre: ambas podem promover TRs previamente treinados a Mestre. A substituição do resultado natural de Reflexos e o gasto de 2 Estamina não são executados. Na ficha, Astúcia e Integridade terminam como Mestre, com outras concessões presentes. |
| Caçador de Feiticeiros | 119 | Parcial | Faixa de 0 a 7 pares. Com 7: +14 RD Geral, +7 TR/acerto e 7d6. Não paga os 14 pontos nem confirma se o alvo é feiticeiro. Enquanto ligado, os bônus entram genericamente. |
| Reação Rápida | 121 | Texto | Não controla reação já gasta, reação adicional, limite por rodada ou pagamento de 2 Estamina. |
| Instintos Aguçados | 123 | Texto | Não compara Vida e Estamina atuais com metade dos máximos nem concede uma reação adicional por essa condição. |
| Foco no Inimigo | 119 | Parcial | Aplica +2 acerto, 1d12 e +5 Percepção no nível 30. A Atenção recebe **+10**, pois o +5 Percepção também chega à Atenção, além do +5 direto. Não guarda um alvo, encerra ao atacar outro ou paga 2 Estamina. |
| Precisão Forçada | 122 | Texto | Não oferece ativação específica para maximizar o dano corpo a corpo após o acerto, cobrar 3 Estamina ou controlar uma utilização por rodada. |
| Roubo de Habilidade | 118 | Erro | As sete escolhas tornam-se habilidades efetivas e o limite de oito pelo BT funciona. As escolhas internas das roubadas não entram no resolvedor, e os efeitos não recebem um contexto de nível de Restringido. O filtro de dependência de energia amaldiçoada também está ausente. |
| Respeito Celeste, duas pegas | 121 | OK | Reconhece as duas pegas, cobra duas vagas e concede uma Dádiva por pega. Nesta ficha: cinco Dádivas base + duas do Respeito + uma do Potencial Físico = oito vagas. |
| Perceber o Ar | 122 | Texto | Apoio no ar, limite de altura, pulos adicionais, imunidade de queda condicionada e desvio por Acrobacia contra Reflexos ficam no texto. Não executa pagamento ou reação. |
| Ainda de Pé | 121 | Parcial | A linha de cura e a rolagem **6d10+30** existem. Mostra máximo de um uso, mas não há contador de consumo dessa cura. Cair a zero não abre a escolha, não aplica a cura nem a alternativa de resistir à morte instantânea. Rolar a cura registra o resultado, sem aplicar automaticamente PV. |
| Rejeitar a Morte | 123 | Texto | Não calcula CD por PV negativos, soma falha de morte, rola a Fortitude específica, restaura 1 PV ou aplica Exaustão. |
| Mesmo Morto | 123 | Texto | Não mantém os turnos a zero, verifica o uso de Ainda de Pé, calcula a CD progressiva ou executa o teste no final do turno e suas consequências. A sessão comum limita PV a zero. |
| Adrenalina Absoluta | 123 | Parcial | Com Surto ativo, soma +3 m e +2 Defesa. Não cobra ativação de 4, manutenção de 2 ou troca automaticamente o custo de Ataque Extra para 1. |
| Barreira Inamovível | 121 | Texto | Não troca o resultado natural de Fortitude pelo modificador de Constituição. Imunidade a movimento forçado e vantagem contra Agarrar não são aplicadas por esta habilidade. Gasto de 2 é manual. |
| Imitação | 117 | Parcial | Painel de cópia, concessão temporária, aprendizagem com CD35 e redução de 2 por tentativa funcionam. Não há opção própria de manobras. Ativas e passivas usam o mesmo catálogo, com declaração manual de elegibilidade. Não controla reação, ação bônus, utilização única ou expiração no turno seguinte. |
| Técnicas de Memorização | 119 | OK | Acrescenta uma capacidade adicional sem Imitação Perfeita ou duas com ela. A ficha com ambas resolve `memorizacao = 2`. O limite é usado no processo de aprendizagem. |
| Imitação Perfeita | 121 | Parcial | Abre passivas e estilos e usa CD40 na aprendizagem. A cópia e seus efeitos não expiram automaticamente no final do próximo turno. |
| Ataque Extra | 120 | Texto | Não adiciona um controle de dois ataques mediante pagamento de 2 Estamina, nem integra o preço de 1 com Adrenalina Absoluta. O ataque extra exibido nesta ficha vem de Fluxo Invencível, outra fonte. |
| Corpo de Aço | 120 | Parcial | Emite +30 PV antes dos multiplicadores. A faixa resolve regeneração **4d8+10** no máximo. Não paga os 4 pontos do máximo nem rola/aplica a cura no início do turno. Na transição de rodada testada, o PV ferido permanece igual. |
| Surto de Adrenalina | 118 | Parcial | Emite +15 RD Geral, +5 Fortitude/Reflexos e +8 Percepção. Ativação, manutenção, falta de Estamina e encerramento não são controlados automaticamente. |
| Resiliência pela Adrenalina | 119 | Erro | Os **2d3 entram em todos os TRs** com Surto ligado, sem uma opção por teste ou pagamento de 1. A rerrolagem após falhar num TR não treinado não está implementada. |
| Adrenalina Intensificadora | 119 | Erro | A distribuição de oito pontos entre Atletismo e Acrobacia funciona. Porém, não há opção de recusar a melhoria ao iniciar o Surto: com Atletismo em zero, Acrobacia recebe os oito automaticamente. Não cobra os dois pontos adicionais nem controla as vantagens de uma vez por cena. |

## Habilidades roubadas

| Habilidade | Página | Estado | O que funciona e o que falta |
|---|---:|---|---|
| Corpo Supremo | 61 | Parcial | +3 m, +4 Defesa, RD15 contra físico e RD7 contra demais tipos abrangidos pela RD Geral. Falta escolher o tipo adicional que deve receber RD15. |
| Surto de Ação | 73 | Parcial | Contador de **quatro usos** por descanso longo existe, inclusive quando roubada. Não paga os cinco pontos, limita o uso à rodada ou concede a ação comum por execução específica. O texto cita gasto de energia amaldiçoada, mas o Roubo não filtra a dependência dessa energia. A elegibilidade precisa ser conciliada com a regra do Roubo antes de uma correção. |
| Corpo Calejado | 57 | Erro | +5 Defesa funciona. PV consulta `esc_lutador = 0`, portanto a parcela de vida desaparece. Simulação usando `esc_restringido = 30`: +30 na base, multiplicado por 2,2 de Alma, 2 do Regras Grimorio e 1,5 da ascensão. **4.548 → 4.746 PV, diferença 198**. Somente a expressão em memória foi trocada para a prova e restaurada, sem edição de código. |
| Guarda Estudada | 69 | Erro | +5 Defesa funciona. O +2 num TR escolhido falta: a habilidade roubada é acrescentada às efetivas depois de resolver escolhas. Mesmo injetando `cmb_guarda_vontade` apenas na simulação, a escolha é ignorada. |
| Especialista em Escudo | 69 | OK | Emite +6 para Fortitude e Reflexos, correspondendo à RD base do escudo pesado. Não usa a RD total do item encantado. |
| Espírito de Luta | 69 | Parcial | +2 acerto e 30 PV temporários calculados. Controle de ativação existe. Não desconta 1 Estamina nem aplica por execução própria o ganho à pilha de PV temporários. |
| Espírito Incansável | 73 | Parcial | Exige Espírito de Luta ligado e eleva o bônus a +5. A fórmula resolve 38 PV temporários para o conjunto, usando escala, BT, maior modificador físico e +5. Não paga 2 Estamina. A fórmula não lê todos os bônus finais do ataque: a jogada corporal desta bancada é +78. A leitura de "bônus de ataque" já tem decisões históricas e precisa ser conciliada antes de ampliar a fórmula. |

## Bases automáticas

| Habilidade | Página | Estado | O que funciona e o que falta |
|---|---:|---|---|
| Restrito pelos Céus | 114 | Parcial | +10 Defesa nesta ficha, Estamina e vagas de Dádiva ligadas. Escolhe o maior modificador entre Força e Constituição automaticamente, sem um seletor da escolha textual. Arsenal e equipamento inicial não são concedidos automaticamente. O descanso único existente recupera tudo por decisão anterior do autor, não distingue a metade de Estamina do descanso curto. |
| Ataque Furtivo | 115 | Parcial | Interruptor ativa **6d8** no nível 30. Não detecta surpresa, desprevenido ou flanco nem limita automaticamente uma aplicação por turno. |
| Versatilidade | 115 | OK | +2 em todas as perícias no nível efetivo 30. |
| Esquiva Sobre-humana | 115 | OK | +3 Defesa/Reflexos e redução de quatro na margem de sucesso crítico de Reflexos, com BT8. |
| Implemento Celeste | 115 | OK | +4 CD no nível efetivo 30. |
| Restrição Definitiva | 115 | Erro | +1 nível de dano nas armas e +3 m ligados. Falta a parcela adicional de treinamento nos testes de Mestre com atributo físico. O cálculo comum continua em BT + metade do BT, **12**, em vez de BT + BT, **16**, com BT8. Furtividade condicionada, percepção adversária e imunidade a Domínio são procedimentos manuais. |
| Libertação do Destino | 115 | Erro | +5 acerto e +15 dano ligados. Resistência aos três tipos físicos não é concedida: todos estão sem estado de Resistência na derivação enviada. Também falta escolher o tipo adicional. RD Física de outras fontes não substitui essa Resistência. |

O **Teste de Resistência Mestre** da página 115 não é um ID adicional na lista de habilidades. É atendido pelo resolvedor das proficiências da especialização: nesta ficha, Fortitude e Reflexos são Mestre. Isso foi contado como cobertura do pacote da classe, sem inventar uma 38ª entrada efetiva.

## Dádivas escolhidas

Todas estão na página impressa 126 do livro.

| Dádiva | Estado | O que funciona e o que falta |
|---|---|---|
| Vigor Infindável | OK | +30 PV antes dos multiplicadores e +15 Estamina máxima. |
| Mente Afiada | Parcial | +2 em testes ligados à Inteligência funciona. Faltam duas perícias treinadas adicionais e a escolha de uma perícia para Mestre, concedidas por esta Dádiva. As marcações manuais da ficha não comprovam a concessão. |
| Percepção Aguçada | OK | +15 Atenção direto, +3 Percepção e +2 em testes de Sabedoria. A Atenção também recebe o aumento da perícia conforme a fórmula comum. |
| Físico Robusto | Parcial | +15 RD Geral e +2 em testes de Constituição ligados. A RD Geral do motor exclui Alma, embora o texto diga todo tipo. A incidência sobre Alma deve ser conciliada com a regra de dano na Alma. |
| Agilidade Exímia | Parcial | +2 em testes de Destreza e +3 m ligados. Ignorar terreno difícil permanece no texto. |
| Indulgente a Feitiçaria | Erro | +2 em Vontade/Fortitude/Reflexos entra genericamente, sem filtrar fontes de técnica ou aptidão. A RD15 específica contra essas fontes está ausente. |
| Semblante Cativante | Parcial | +2 em perícias de Presença ligado. Falta elevar o resultado inferior a 15 para 15 nesta ficha e conceder Mestre numa perícia de Presença escolhida. |
| Força Devastadora | Parcial | +2 em perícias de Força e +4,5 m na distância de empurrão ligados. Os +3 m de pulo não têm cálculo próprio. |

## Prioridades e limites

Correções diretamente reproduzíveis: contexto de nível e escolhas das roubadas, distribuição permanente de Intensificadora, proficiência física de Restrição Definitiva e Resistências de Libertação do Destino.

Automação de sessão ainda necessária: pagamento/escassez/manutenção de Estamina, usos por turno e por rodada, consumo das curas, cura recorrente, ações/reação, morte, cópias e seleção de alvo. Há decisões anteriores de deixar alguns procedimentos manuais. Uma futura implementação deve respeitar essas decisões e oferecer confirmações de circunstâncias que o sistema não conhece.

Decisões posteriores do autor: Surto de Adrenalina e Físico Robusto não cobrem Alma, Surto de Ação pode ser roubado e Espírito Incansável mantém sua fórmula. Foco no Inimigo concede +10 Atenção, conforme a soma de +5 Percepção com +5 direto. Resiliência permanece como está e Custos/Usos são planejados em outro chat.

## Verificação

- `.audit/fang-auditar.mjs`: carrega a exportação, aplica addons e salva catálogos/resumo/derivado.
- `.audit/fang-verificar.mjs`: **20 verificações diagnósticas aprovadas**, reproduzindo números e lacunas. Aprovar uma verificação diagnóstica significa confirmar o comportamento descrito, inclusive o defeito, não aprovar a implementação da regra.
- `.audit/fang-evidencias.json`: resultados, parcelas de cada habilidade e referências de páginas.
- `npm run asserts -- restringido combatente imitacao motor habilidades`: **400 asserts, sete arquivos, aprovados**. Eles cobrem os mecanismos existentes e não eliminam as lacunas reproduzidas.
- `node src/systems/afty/asserts/t-imitacao.mjs`: categorias, aprendizagem, CD e orçamento aprovados nos dois sistemas.
- Sem alteração de motor/UI, importação em storage, commit ou push. A interação visual no navegador não foi testada nesta auditoria. Lint/build completos não foram necessários para mudanças apenas de documentação e scripts diagnósticos.


## Correções e interface em 2026-10-13

- Corpo Calejado roubado utiliza o nível de Restringido. A exportação passa a 4746 PV.
- Escolhas internas roubadas de Guarda Estudada e Corpo Supremo passam pelo motor e criador.
- Correção expressa do autor: Roubo exige os pré-requisitos das outras habilidades. Crítico Aperfeiçoado exige Crítico Melhorado no seletor de Roubo. Somente Imitação pode copiar só a final, sem a anterior. A cópia reduz a margem em 2, e possuir as duas continua reduzindo em 2.
- Libertação do Destino concede Resistência física e tipo adicional. Restrição Definitiva completa BT de Mestres físicos.
- Mente Afiada, Semblante e distribuição permanente de Adrenalina recebem escolhas no criador. Piso de Semblante aplicado no rolador.
- Indulgente a Feitiçaria fica condicionado à fonte, na aba Buffs.
- Cópias recebem escolhas internas, categoria Manobras e duração pela rodada existente. As listas de habilidades são divididas por especialização e nível e ocultam opções já possuídas, inclusive roubadas, herdadas, concedidas e aprendidas.
- Aprendidas ficam na seção própria. Busca, contagens e abas não exibem as possuídas como novas opções.
- Painel de Restringido, Novo turno e Ataques Extras em Dano foram removidos a pedido do autor.
- Custos de Estamina ficam manuais. Acionamentos opcionais sem interação existente estão na fila vigente, sem esconder a limitação com um novo menu.

Verificações: 84 regressões específicas e 511 asserts focados aprovados. Lint e build aprovados. Navegador em 1440 e 390 px: todas as abas, ocultação de possuídas, aprendidas preservadas, persistência e expiração pelo avanço de rodada passaram, sem erro de página ou rolagem horizontal. Suíte completa com duas falhas anteriores, discriminadas no status.

Correção de requisitos verificada em 2026-10-13: 106 regressões e 423 asserts focados
aprovados. Roubo bloqueia sem a anterior, libera ao possuí-la e reporta sua remoção,
enquanto Imitação copia a final sem requisito. As aquisições já gravadas são
preservadas e recebem aviso quando perderem o pré-requisito.


## Integração das aprendidas em 2026-10-13

As aprendidas por Imitação e a cópia em uso aparecem em Habilidades Roubadas do criador.
Mestre da Postura imitado configura duas Posturas e habilita seus efeitos simultâneos
sem conceder Assumir Postura. Escolhas de habilidades que concedem opções a outra
habilidade também passam a ser configuráveis na própria imitação. Conhecimentos e
escolhas viajam com a ficha, e Salvar atualiza a sessão. O botão Imitar da linha
aberta permite ativar uma aprendida, incluindo Crítico Aperfeiçoado com crítico 18 no
cenário base. A duração continua pela rodada existente e os gastos ficam manuais.

44 regressões novas aprovadas, além das 106 de Fang e do teste próprio de Imitação.
Browser validou escolha, persistência e uso das duas Posturas e do crítico sem as
habilidades anteriores em Afty e Player. As pendências de ações/reação narrativas
anteriores permanecem apenas na fila vigente.
