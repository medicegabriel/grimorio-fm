# Matriz individual dos Talentos

Complemento da [análise aprofundada](10-analise-aprofundada-2026-10-29.md). Data: 2026-10-29. Fonte: Livro de Regras p.163 a 170, SHA-256 `1d0713d52c818a9ab9f47b883d9887a0d227d174d30ffcce358874669a7a733a`.

Esta matriz descreve parcelas existentes e limites encontrados. Não usa ausência no mapa `TALENTO_EFEITOS` como prova de ausência de implementação: escolhas, concessões e tratamentos específicos também foram considerados. Nenhuma linha certifica todas as combinações possíveis com addons.

Referências centrais: [catálogo](../../src/systems/afty/afty-talentos.js), [efeitos diretos](../../src/systems/afty/afty-efeitos-conteudo.js#L2071), [efeitos das escolhas](../../src/systems/afty/afty-efeitos-conteudo.js#L1485), [configurações](../../src/systems/afty/afty-talentos.js#L58), [cálculo de dano e escudo](../../src/systems/afty/afty-derive.js), [sessão](../../src/systems/afty/ficha/ficha-sessao.js). `t-talentos`, `t-talentos-de-estilo`, `t-tr-caso-ja-seja-classe`, `t-critico-fontes`, `t-propriedades-armas`, `t-uniforme-escudo` e os demais asserts aplicáveis passaram na suíte desta sessão. Isso não é prova dos procedimentos que eles não testam.

| Talento | Parcela já localizada | O que resta para a regra inteira |
|---|---|---|
| Afinidade com Técnica | Vagas de Feitiço e seus marcos de nível | Nenhuma lacuna adicional demonstrada nesta passagem |
| Artesão Amaldiçoado | Configuração de Ofício, proficiência e acesso ao sistema de ferramentas | Fechar o procedimento de produção por descanso/Interlúdio e seus testes, sem confundi-lo com autoria de receita |
| Ataque Infalível | Cadastro e requisitos | Rerrolagem de dano uma vez por rodada, substituição obrigatória do resultado e proteção contra redução de níveis de dano |
| Atenção Infalível | +5 de Atenção | Integrar a impossibilidade de surpresa consciente quando houver estado de surpresa |
| Dedicação Recompensadora | Cadastro do benefício por Grau | Concessões e reposições no inventário, com substituição da faixa do Grau |
| Favorecido pela Sorte | Cadastro | Reserva de três pontos, escolha do d20, recuperação por crítico inimigo e recarga |
| Guarda Infalível | Cadastro | Exceção à reação por desastre e +3 situacional ao resistir às reduções nomeadas |
| Incremento de Atributo | Escolha do atributo, valor e limite | Nenhuma lacuna adicional demonstrada nesta passagem, preservada a restrição por atributo |
| Investida Aprimorada | Cadastro | Aplicar movimento, acerto pela investida e teste para derrubar o alvo |
| Mestre das Armas | Configuração do atributo e das armas/grupo | Executar o efeito de crítico do grupo escolhido |
| Mestre Defensivo | Atributo, treino e RD adicional vinculada ao escudo | Nenhuma lacuna adicional demonstrada na parcela numérica. Não confundir RD Física do Player com RD Geral da criatura |
| Perceber Oportunidade | Cadastro | Duas reações de oportunidade por rodada e vantagem no ataque correspondente |
| Provocação Desafiadora | Cadastro | Alvo provocado, obrigação de ataque, usos da ação livre e expiração |
| Resiliência Melhorada | Escolha de TR e aumento do atributo/treino | Conferir a situação já aberta de treino marcado manualmente como fonte, sem reabrir a parcela numérica já implementada |
| Saltador Constante | Cadastro | Sequência de pulos, redução de distância e benefício do ataque ao terminar adjacente |
| Técnicas Ofensivas de Escudo | Linha de dano de escudo calculada no derive | Ação bônus condicionada ao ataque, teste de Empurrar e escolha de distância/derrubar. O livro usa o título Técnicas Agressivas de Escudo, a correspondência é pelo conteúdo |
| Técnicas de Arremesso | Acerto e dano limitados à categoria Arremesso | Nenhuma lacuna adicional demonstrada nesta passagem |
| Técnicas de Reação Rápida | +5 de Iniciativa | Rerrolagem quando não agir primeiro, preservando o melhor resultado |
| Técnicas Defensivas de Escudo | Tratamento numérico de Reflexos com escudo | Uso com reação, limite por BT e margem de sucesso crítico reduzida naquele teste |
| Tempestade de Ideias | Atributo e configurações de perícia/ferramenta | Escolha da perícia e vantagem por usos/descanso |
| Adepto de Medicina | Cadastro e requisitos | Criar a cura do segundo efeito de Suporte em Combate e a metade dos usos. Cenário N14 |
| Adepto de Briga | Acerto e níveis de dano, com exclusões de Pugilato da mesa | Manobra gratuita quando acerta e não causa dano, com o bônus situacional do teste |
| Adepto de Combate | Escolha e aplicação do Estilo | Decisão pendente: nível do personagem só no Estilo recebido pelo Talento ou também nos demais Estilos da classe |
| Adepto de Feitiçaria | Escolha da Mudança de Fundamento | Operação e limite por cena da redução adicional de custo |
| Alma Inquebrável | Treino de Integridade e RD na Alma | Nenhuma lacuna adicional demonstrada na conta. Aplicação de dano exige o procedimento geral de Alma/TR |
| Alma Livre | Acesso a habilidade de outra Especialização e escolhas associadas | Conteúdo adicional do catálogo, sem correspondência de cabeçalho no recorte p.163 a 170. Não contabilizar como falta do Livro. A concessão de uma vaga gratuita não deve ser presumida |
| Apaziguador de Técnica | Cadastro | Reação à conjuração, teste de concentração e alteração/cancelamento do Feitiço do inimigo, com restituições e impedimentos previstos |
| Aptidão Desenvolvida | Escolha e aumento do nível da trilha | Converter excedente no teto em escolha da categoria, pela regra transversal |
| Determinado a Viver | Cadastro | Interceptar a primeira queda diária e aplicar vantagem nos testes posteriores de morte |
| Discurso Motivador | Cadastro | Operação de PV temporário, destinatários e limite de recebimento. A fórmula tem leitura pendente na fila dos Pacotes |
| Especialista em Concussão | Atributo e nível de dano na linha aplicável | Empurrão por turno, alvo e restrição de tamanho |
| Especialista em Cortes | Atributo e nível de dano na linha aplicável | Redução de movimento do alvo e término no turno correto |
| Especialista em Perfuração | Atributo e nível de dano na linha aplicável | Rerrolagem por turno com comparação do total dos dados |
| Mestre da Criação | Cadastro | Duas escolhas de Ofício com +2 e duas oportunidades adicionais por Foco no procedimento de produção |
| Mestre do Arremesso | Dados, acerto e dano por categoria, como melhoria do Talento anterior | Ligar também os 6 m de alcance, sem depender de nova invenção de canal |
| Mestre dos Chicotes | +4 de dano no grupo | Alcance adicional e reação/teste para puxar o alvo |
| Movimentos Acrobáticos | Cadastro | Teste reativo ao ser derrubado, levantar/mover e Defesa temporária pela janela correta |
| Robustez Aprimorada | PV pelo nível e +2 de Fortitude | Nenhuma lacuna adicional demonstrada nesta passagem |
| Técnicas de Empunhadura Dupla | +1 de Defesa condicionado ao estado Duas Armas | Restrições das duas mãos/armas e saque especial, junto da decisão de representação por mão |
| Técnicas de Mobilidade | +3 m de movimento | Teste oposto após ataque e impedimento de oportunidade para o alvo naquela janela |
| Técnicas de Ocultamento | Furtividade pelo BT | Ampliar o prejuízo de Desprevenido nos TRs do alvo na circunstância do Talento |
| Técnicas do Sentinela | Cadastro | Reação contra atacante de outro alvo e redução de movimento no ataque de oportunidade |
| Wrestling | Cadastro | Agarrão vinculado, troca de teste, soltar no ataque, queda/arremesso e dano no objeto/alvo |
| Voto Malevolente | Cadastro | Exceção aplicada pelo validador do Voto Emergencial, que ainda não existe como procedimento próprio |
| Familiaridade com Técnica | Cadastro | Dependência de Marca Registrada: escolhas, descontos e sustentação |
| Manual de Técnica | Redução de uma rodada na recarga da Máxima quando aplicável | Feitiço acima do acesso, aumento de custo, aprendizado obrigatório e reposição da escolha |
| Expansão de Reserva | Cadastro | Melhorias de Energia Antinatural: ação, PE temporário e nova recarga |
| Quebra de Limites | Escolhas e efeitos de atributo/limite | Nenhuma lacuna adicional demonstrada na concessão, mantendo exclusão do maior limite |
| Físico Aperfeiçoado | Opções numéricas de movimento/perícia e distância de empurrão | Salto e aplicação da distância ao movimento do alvo, quando houver esse procedimento |
| Reposição Sanguínea | Cadastro | Modificar uma operação de Vigor Maldito, incluindo cura maior e reação |
| Estudo Amaldiçoado | Escolha de duas trilhas diferentes e níveis concedidos | Excedentes no teto, pela regra transversal |
| Noção e Preparação | Bônus de TR e progressão | Alcance geral do bônus é decisão anterior do autor. Não registrar a ampliação como bug novo |

As linhas com cadastro apenas são lacunas de aplicação, não ausência do texto ou dos pré-requisitos. O trabalho pode ser dividido entre o procedimento comum (ataque, reação, uso, Voto, inventário) e a declaração específica de cada Talento. Não é necessário criar um motor separado por Talento.
