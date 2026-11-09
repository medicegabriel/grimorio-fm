# O que falta nos nove lotes, os bloqueios e o prompt para terminar

Levantamento de 2026-11-06 (18:50), feito pelo código atual e pelas entregas, não só pelos relatórios. Este arquivo é o ÚNICO lugar com a lista completa
do que falta e o prompt de execução. Ele é evidência e plano, não substitui a fila oficial `docs/a-fazer.md`, que CX3 estava editando no momento
(por isso não a alterei). Quando a fila estiver livre, o item "Aplicar na fila" do pacote P0 a sincroniza com este arquivo.

Fonte do Livro: `C:/Projetos/Grimorio/F&M 2.5.2 - Livro de Regras.md`, SHA-256 `1d0713d52c818a9ab9f47b883d9887a0d227d174d30ffcce358874669a7a733a`.
Base: HEAD `deab72cc`, `origin/main` `f6433a8a` (dois commits à frente, nunca integrados), 186 caminhos alterados na árvore. Suíte: **282 de 284
arquivos**, falham só `t-reconciliacao-g00` e `t-revisao-g00`. Sem percentuais: nada aqui mede "% do site".

## Respostas do autor registradas hoje (2026-11-06)

1. Proteção Avançada: o d8 SUBSTITUI o d6, e o modificador é ESCOLHA entre Presença e Sabedoria. Já implementado assim.
2. Companheiro Avançado **NÃO conta** no teto de Aliados do Grau. Isso desbloqueia o pacote P2 abaixo.
3. A reação de Proteger Invocação e a Ação Livre da Proteção Avançada não se impedem. Já implementado assim.

Decisões anteriores de hoje que valem: limite em campo e máximo por ação Invocar só AVISAM, seletor de Aliados cheio DESABILITA, posição do Controlador é
CONTADOR NA BANCADA, edição aditiva em arquivo reservado por outro lote é permitida com releitura antes.

## 1. Estado dos nove lotes

Legenda: **Núcleo** é a lógica pura, com operação, estado salvo, recusa e assert. **Tela** é botão ou painel que o usuário aciona no percurso real.

| Lote | O que está feito (verificado) | O que falta | O que bloqueia |
|---|---|---|---|
| **CX1** Base e correções | Correções de produto (N02 a N08 e outras), contratos de ataque e mãos, testes, navegador. Arma Natural, Articulações, Braços Extras, Corpo Especializado cobertos | Reconciliação G00: 1.235 chaves vivas sem fonte individual em `docs/revisao-automacao/fontes.json` (863 em addons). Classificar em `escopo.json` os módulos novos de CL, CX2, CX5 e CX6 | `fontes.json` e `escopo.json` estão com CX3 em edição. Protocolo de reconciliação do G00 |
| **CX2** Origens, clãs, Anatomias | 15 Anatomias nativas (12 implementadas ou cobertas), Inato, Familiaridade, Manual de Técnica, Zenin com Foco por destino, Inumaki, Derivado, tela de Reserva e Reposição | Integração geral de PE temporário de Devorador e Expansão (teto, substituição, expiração). Herança Maldita nos demais caminhos de cura. Dados extras do Físico Abençoado no descanso curto. Kamo rerrolagem. Braços Extras do addon Era de Ouro. Ver as linhas "integração pendente" na matriz de `entregas/CX2.md` | CX4 (temporários e cura). Decisão de PV rolado (Kamo). Decisão de descanso curto e longo |
| **CX3** Talentos, classes, Aptidões, Treinos | Em andamento por outro editor, ~2.000 verificações próprias. Sorte, Infalível, Perfuração, Reação Rápida, Investida, Intervenção, Versatilidade, Análise, Mobilidade, Voadora, Sobrevivente, Briga (Derrubar e Empurrar), Incitar Vigor, Renovação, Técnicas Agressivas de Escudo, Postura da Fortuna, Sentinela, críticos dos 12 grupos, Energia Reversa, excedentes, Potencial Físico | Agarrar (vínculo e fuga). Aparar, Devolver e Redirecionar (a reação antes do ataque). Interrupção de conjuração adversária (sem janela prospectiva). Raio Negro misto. Duração geral das posturas. Estilos Interceptador e Protetor, quatro efeitos do Golpe Especial. Auras no adversário (Anuladora, Chamativa, Drenadora, Lacerante, Macabra, Movediça, Redirecionadora). Anular Técnica, Revestimento, Pétala, Punho Divergente. Linhas de Treinamento (tentativas). Primacial lendo treino de Talento e Classe (exige `resolveTestes` ou derive). Ferramenta Amaldiçoada (p.153). Conferência por cláusula das 361 Habilidades | Perguntas abertas: Sintonização Vital, Saltador Constante, Atacar e Recuar, Linhas de Treinamento. Etapa de escolha de rerrolagem antes das consequências dos testes de Morte, Ferida Interna, Alma e concentração |
| **CX4** Feitiços e recursos temporários | **NADA entregue.** Verificado no código: não existe efeito de Exaustão comum (`ficha-opcoes-derive.js` só repassa a Exaustão de Técnica), `aplicaPeTemporario` não impõe metade do máximo, `calcularFeiticoPassivo` devolve `efeitosGerados: []`, `TRANSF_SEM_ALVO` ainda exclui atributo e TR, não existe histórico de alteração por nível | Tudo: Exaustão dos seis níveis (p.324, N11), PV e PE temporários com teto, substituição, exceções e expiração (p.366, N12), Regeneração Passiva por rodada (N13, p.237), Dano Passivo Durante e Após com dados, Transformação com escolha de atributo e TR, condições por Feitiço (aplicar e remover com alvo e TR), histórico de alteração por nível, integração de cura, Dados de Vida e descanso | Nada técnico. Só decisões: Dano Passivo (média fixa ou rolagem), controle de edição por nível, PV rolado, descanso único contra dois tipos, desconto de PE do Shikigami |
| **CX5** Inventário, itens, encantamentos, Interlúdios | Núcleos: Pulseiras, 48 Itens Especiais, 16 encantamentos ativos, itens de Feitiço, produção, adaptação, criação de invocações, equipamento inicial, armas improvisadas (860 verificações) | **Todas as telas.** Ligações: `fichaComItensDaSessao` antes de derivar nas três telas, `focosDeProducoes` no orçamento, `escudoSuspenso` na RD, linha de ataque do escudo, traço dos óleos no dano, botão de cura dos Símbolos e do Laço trocado por `usaItem`. Ferramenta Amaldiçoada. Efeito de item em OUTRA ficha (veneno, Bloqueador, Expansão de Escudo) | Arquivos de CX3 (criador, Encontro, derive, Ações). CX4 (teto do PV temporário do Símbolo de Vida Absoluta, efeitos de Exaustão de Adrenalina e Mistura Profana). Decisões: Grau do Player, Intermediário na carga, Modular múltiplo, descanso do Ferreiro |
| **CX6** Aliados, Controlador, telas, fechamento | Hoje: N15, aviso da ação Invocar, seletor de Aliados desabilitado com contagem, contadores de posição, Frenesi, Proteger Invocação (103 verificações, navegador) | Companheiro Avançado (desbloqueado hoje). Telas de CL2, CL3 e CX5. Pacote para Aliados (prejuízo do auxílio sustentado, PV temporário, dados que eram só consulta). Camuflagem, Táticas e Flanco ficam de mesa. Auditoria por cláusula, números e fontes, importação antiga, G2, Encontro, relatório final | CX3 e CX4 abertos. Fechamento só depois deles |
| **CL1** Motor de uso e combate | Núcleo: `usa`, manutenção, recarga, concentração única, ataque com alvo, dano recebido, eventos, Sequência de Ataques, ações e reações. Já consumido por CX3 (`ficha-conteudo-*`) | Ligar nas telas os verbos que nenhum JSX chama: `usa`, `pagaManutencao`, `encerraUso`, `registraAtaqueRealizado`, `registraAtaqueRecebido`, `sofreGolpeNaGuarda` uma vez por ataque, tela do `defesa-conflito`, rótulo "PE Não Descontado", `registro.manutencaoDevida`. `ataqueId` igual em todas as instâncias de um ataque | Decisão: cobrança automática de Armas Absolutas. Lista de condições que impedem concentração (p.320 não enumera) |
| **CL2** Vida, morte, Alma | Núcleo: saldo negativo, Portas da Morte, estabilização, dano massivo, Ferimentos, Dano na Alma com teste, Dados de Vida. Barra de PV com aviso, botões `+` e `-`. CX3 consome Dados de Vida e `ficha-morte` | Telas: teste de morte, Medicina, escolha ou rolagem do Ferimento, lista de ferimentos (tratar, permanente, recuperar), Dano na Alma com teste, cura de Alma, gasto de Dados de Vida, aviso no cabeçalho da Ficha G2. Ligar `recuperaAlmaPorDescanso` ao descanso | Sete leituras ainda sem resposta (dano enquanto morrendo, massivo, cura exata, Ferimento, CD de Integridade, Treino de Resistência 2, Alma no descanso) |
| **CL3** Invocações, Domínios, Votos | Núcleo: Votos tipados, Confronto e Contestação, paredes, Cortina, Cesta, Dano Adicional, prejuízo, Forma de Arma, variáveis de sessão. Hoje: Frenesi e Proteger | Telas: Votos (`realizaVoto`, `quebraVoto`, `desfazVoto`, `avancaVotosNaRodada`, `votosNoInterludio`), Domínios (`iniciaConfronto`, `aplicaResultadoDoConfronto`, `avancaContestacao`, cards de parede, Cortina e Cesta), Invocações (`usaAuxilioDaInvocacao`, `linhaDeFormaArma`, `registraAtaqueRealizado` com `invocacao:<id>`). A Restrição Congênita não chega ao derive | Perguntas de CL3 (Votos Contratuais sem limite de BT, ruptura do Permanente, Expansão contra DOM maior, Cortina e arredondamento, "uso repetido"). Arquivos de CX3 |

Nenhum módulo de tela dos núcleos de CL2 (exceto o aviso), CL3 e CX5 é importado por JSX. Medido hoje: `ficha-votos`, `ficha-barreiras`, `ficha-dominio-confronto`,
`ficha-invocacao-uso`, `ficha-itens*`, `ficha-encantamentos`, `afty-producao`, `afty-equipamento-inicial` e `ficha-controlador` não têm nenhum importador fora de asserts.

## 2. Pacotes de trabalho (a lista única do que falta)

Ordem sugerida, pelo que destrava o quê. **Dono** diz quem tem a vantagem (Claude para núcleo complexo, Codex para conteúdo e telas), não é regra.

### P0. Housekeeping, assim que CX3 liberar os arquivos compartilhados
- Aplicar na fila (`a-fazer.md`) e no histórico (`afty-status.md`) o texto pronto de `entregas/CX6.md`, `CL1.md` e o que sobrar dos outros, e sincronizar esta lista.
- Classificar em `revisao-automacao/escopo.json` os 12 módulos hoje sem proprietário (nove de CX5 pelo snippet de `entregas/CX5.md`, três de CX6 pelo snippet de `entregas/CX6.md`). Isso deixa `t-revisao-g00` verde.
- Registrar os asserts novos em `asserts/LEIA.md` (nove `t-cx5-*` e três `t-cx6-*`). Acrescentar as duas variáveis `invocacoes_a_3m` e `invocacoes_no_alcance` em `automacao-dsl.md`.
- Reconciliar `fontes.json` (1.235 chaves) pelo protocolo `docs/revisao-automacao/LEIA.md`. Sem fonte genérica, sem relaxar o assert. Dono: Codex.

### P1. CX4 inteiro (o maior bloco sem dono e sem decisão que o bloqueie)
Dono: Claude para o núcleo (Exaustão, temporários, Regeneração, condições), Codex para Transformação, histórico e telas.
1. Exaustão comum dos seis níveis (p.324), efeito em Defesa, CD, movimento e PV conforme o texto, morte no sexto, recuperação de um nível no descanso (N11). Reusar o adaptador `ficha-opcoes-derive.js`.
2. PV e PE temporários (p.366): teto de metade do máximo, substituição como padrão, exceções expressas (Cobrir-se, Guarda e outras), expiração, identidade da fonte (N12). Consumidores já prontos esperando: Devorador de Energia e Expansão (CX2), Símbolo de Vida Absoluta (CX5), Presença Inspiradora e Pacotes.
3. Regeneração Passiva por rodada com conversão em PV temporário quando não há o que curar (N13, p.237).
4. Dano Passivo Durante e Após: preservar a rolagem, ou registrar a simplificação da média como decisão (depende da pergunta B3).
5. Transformação com escolha de atributo e de TR por efeito (retirar `atributo` e `tr` de `TRANSF_SEM_ALVO` com alvo informado).
6. Condições por Feitiço: operação geral que recebe alvo e resultado do TR e aplica ou remove a condição, inclusive cura de condição e Ferimento Complexo.
7. Histórico de alteração por nível e limite de BT, se a mesa quiser a legalidade (depende de B3).
8. Integrar cura, Dados de Vida e descanso aos percursos autorizados. Mantém o botão único de descanso.

### P2. Companheiro Avançado (desbloqueado hoje)
Dono: Codex. Não reutilizar `aliados_escolhidos`, que é aparado pelo teto do Grau.
- Dar `opcoes` (os oito tipos de Aliado) ao marcador `companheiro` quando houver `ctr_companheiro_avancado`, guardando a escolha na invocação.
- Graduação pelo nível de Controlador: iniciante no 4, veterano no 6, mestre no 12 (p.98). Os números são os de `ALIADOS_TIPOS` em `afty-extras-nativos.js`.
- Efeito "para você ou para o aliado mais próximo da invocação": aplicar no dono por padrão e oferecer o envio por Pacote para Aliados quando houver alvo (posição é declarada). Ficha de teste com companheiro em campo e fora, salvar e reabrir.
- Frenesi: a segunda execução do ataque e a vantagem do atacante continuam de mesa.

### P3. Telas de vida e Alma (CL2)
Dono: Codex. Mapa em `docs/afty-vital.md` seção 5. Botão do teste de morte (`resumoVital(...).pode.rolarTesteDeMorte`), Medicina, escolha ou rolagem do Ferimento, lista de ferimentos, Dano na Alma com teste, cura de Alma, Dados de Vida, aviso no cabeçalho do G2, `ataqueId` único por ataque. Ligar `recuperaAlmaPorDescanso` só depois de B4. Teste de sessão com duas fichas: dano até as Portas da Morte, Medicina da outra ficha, três sucessos, salvar e reabrir.

### P4. Telas de Votos, Domínios e invocações (CL3)
Dono: Codex. Mapas nas seções 6 de `afty-votos.md`, `afty-dominio-confronto.md` e `afty-invocacoes.md` (seção CL3). Também: botões de `ativaFrenesi` e `protegeInvocacao` (`ficha-controlador.js`), os contadores de posição já existem na bancada. Pacote para Aliados com o prejuízo do auxílio sustentado. Ligar a Restrição Congênita ao derive (limite de atributo e PV por nível), que hoje só é validada. Passar `ctx.talentos` na pré-avaliação do Voto e `derived` na realização (pedido de CX3).

### P5. Telas e ligações de itens (CX5)
Dono: Codex. Lista em `entregas/CX5.md`, "O que falta". Inclui seletor de perícia das Pulseiras, botão Usar, usar encantamento e cargas, criar por Feitiço, abas de Produção e Adaptação, equipamento inicial e conjunto de missão, `fichaComItensDaSessao` nas três telas, e o texto Especial da arma criada no criador (`textoEspecialDaArma`). Depende de P1 para o teto do PV temporário e a Exaustão.

### P6. Motor de uso nas telas (CL1)
Dono: Codex. Ligar `usa`, `pagaManutencao`, `encerraUso`, ataque e dano recebido com `opId` por clique (`novaOperacao()`), "PE Não Descontado", `registro.manutencaoDevida` da virada, tela do `defesa-conflito`, `sofreGolpeNaGuarda` na sessão do alvo. Cobrança automática só depois de B2.

### P7. Resto de CX3 e CX2
Dono: o editor que estiver com CX3. Não duplicar. As linhas de "O que falta" do quadro acima. CX2: integração de temporários, Herança e Físico Abençoado depois de P1, Braços Extras do addon.

### P8. Pacote para Aliados e dados que eram só consulta
Dono: Codex. Dados de dano auxiliar, efeitos de teste e reação, PV temporário e prazo individual por benefício nos Pacotes. Discurso Motivador (leitura de precedência). Aceite do autor nas telas G2 antes de qualquer promoção.

### P9. Fechamento final (só depois de P1 a P8)
Auditoria por cláusula das 361 Habilidades, 85 Aptidões e dos parâmetros de tipo especial das invocações. Números derivados com fonte coerente. Importação de ficha antiga. Funcionamento conjunto Player e Afty, Ficha clássica, G2 autorizado e Encontro. Teste de sessão com duas fichas para CADA recurso: ativar, pagar, aplicar no alvo, mudar o turno, expirar, salvar, reabrir, importar, remover a fonte, recusas e ausência de aplicação duplicada. Relatório com o estado real dos nove lotes. Sem percentual inventado, sem aprovação de catálogo por nomes, sem aceite visual presumido, sem promoção do G2 sem autorização.

## 3. Decisões do autor que ainda faltam (cada uma bloqueia só a parcela dita)

| Id | Pergunta | Bloqueia |
|---|---|---|
| B1 | Grau do Player: escala da criatura (5, 9, 13, 17) ou a de referência do livro (p.45)? | Teto de aliados do Player, Grau em itens (P5) |
| B2 | Armas Absolutas e custo de estado: cobrar e expirar sozinho, ou só exibir? | Política automática de cobrança (P6) |
| B3 | Dano Passivo: média fixa ou rolagem Durante e Após? Controle de edição e BT por nível? PV fixo ou rolado? Desconto de PE do Shikigami? | P1 itens 4 e 7, Kamo (CX2) |
| B4 | Descanso: manter o botão único? Recuperar metade da Alma no descanso longo (p.311)? Tipo de descanso do Ferreiro (BT/2 curto, BT longo)? | Alma (P3), Ferreiro (P5), Físico Abençoado (CX2) |
| B5 | Intermediário ocupa meio espaço e entra na carga? | Carga (P5) |
| B6 | Modular com várias opções na arma criada? | Criação de armas |
| B7 | CL2: dano enquanto morrendo, dano massivo, cura que quita a dívida, gatilho do Ferimento, CD da Integridade, dado do Treino de Resistência 2 | Ajuste fino de P3 (já implementadas na leitura conservadora) |
| B8 | CL3: Votos Contratuais sem limite de BT, ruptura do Voto Próprio Permanente, Expansão ativa contra DOM maior, Cortina (arredondamento, ação, RD), "uso repetido" por invocação ou por benefício | Ajuste fino de P4 |
| B9 | CL1: condições que impedem concentração (p.320), segunda concentração, Dano na Alma antes ou depois do TR | Ajuste fino |
| B10 | CX3: Sintonização Vital (cura rolada ou efetivamente recuperada), Saltador Constante, Atacar e Recuar, Linhas de Treinamento (registrar tentativas) | Essas Habilidades |
| B11 | Pacotes para Aliados: as sete leituras da fila (Permutativo, Aura do Comandante, Presença Inspiradora, Apoio Defensivo, descanso, Pronto para Agir, Discurso Motivador) | P8 |
| B12 | Acúmulo global ou direcionado, grupos de benefício das invocações, Característica com bônus de ataque nas Ações da invocação, Característica Livre com estado de mesa | Invocações |
| B13 | Técnica Máxima e Domínios (perguntas abertas na fila), 16 pontos provisórios de Técnicas Marciais, CD de Especialização separada | Esses conteúdos |

As respostas já dadas (veja o topo e as entregas) não devem ser perguntadas de novo.

## 4. Mapa de bloqueios

- **CX3 ativo** nos arquivos compartilhados (fila, histórico, `escopo.json`, `fontes.json`, `LEIA.md`, guias do Motor, criador, Encontro, derive, Ações). Bloqueia P0 e a integração de telas de P3 a P6. Contorno usado até aqui: núcleos em módulos próprios e texto de documentação em `entregas/`.
- **CX4 inexistente** bloqueia: temporários de CX2 e CX5, Exaustão de Adrenalina, Mistura Profana e Laço, Presença Inspiradora e a Guarda. É o bloqueio técnico mais valioso de remover.
- **Telas ausentes** bloqueiam o fechamento: sem botão no percurso real não existe teste de sessão honesto para Votos, Domínios, itens e vida.
- **Decisões B1 a B13** bloqueiam apenas a parcela dita.

## 5. Prompt para executar (copiar em um chat novo)

```
# CX7: terminar o que falta nos nove lotes do Livro de Regras

> AVISO (autor, 2026-10-30): o Corpo Amaldiçoado Mutante foi abandonado e excluído do site em definitivo. Não implemente, não reabra e não pergunte de novo.

Você está num chat novo. Execute o plano de docs/revisao-livro-regras/FALTA-E-PROMPT-2026-11-06.md, pacote por pacote, começando pela verificação de que cada
pacote ainda faz sentido na base atual. Não presuma que um relatório continua correto, nem que uma pendência significa ausência de código.

Repositório: C:/Projetos/Grimorio/grimorio-tracker. Leia AGENTS.md e CLAUDE.md. Em docs/afty-status.md leia a sessão mais recente e "Contexto rápido", depois docs/automacao-dsl.md,
docs/afty-formulas-base.md, docs/afty-motor-uso-combate.md, docs/afty-vital.md, docs/afty-votos.md, docs/afty-dominio-confronto.md, a seção CL3 de docs/afty-invocacoes.md,
docs/afty-equipamentos.md (seção CX5) e as entregas em docs/revisao-livro-regras/entregas/ (CL1, CL2, CL3, CX1, CX2, CX3, CX5, CX6). Livro: C:/Projetos/Grimorio/F&M 2.5.2 - Livro de Regras.md,
SHA-256 1d0713d52c818a9ab9f47b883d9887a0d227d174d30ffcce358874669a7a733a (se divergir, pare e esclareça). Cite a página impressa pelo último marcador acima da regra.

Antes de editar:
1. Meça a base: git status, git rev-list contra origin/main, npm run asserts (linha de base, esperada 282 de 284 com t-reconciliacao-g00 e t-revisao-g00 vermelhos), eslint e build com --outDir isolado
   (npm run build reescreve o dist da abertura diária). Não faça pull, merge, reset, stash, commit nem push. Não promova o G2 nem altere a abertura diária.
2. Confira concorrência: find -mmin nos arquivos que pretende editar. Outro editor (CX3) alterou fila, histórico, escopo.json, fontes.json, LEIA.md e guias do Motor. Um editor por vez em arquivo
   central e em documentação. Se estiver reservado, avance em módulo novo e deixe o texto de documentação em entregas/CX7.md para aplicar depois.
3. Publique um diagnóstico curto (tabela: pacote, página, evidência atual, veredito) e prossiga sem pedir aprovação genérica. Pergunte só o que for dúvida material de regra, uma pergunta por
   parcela, com opções, e siga no trabalho independente. Não reabra decisão respondida (as da seção "Respostas do autor" e as já registradas nas entregas).

Ordem dos pacotes (cada um com fonte, escolha, requisito, conta, consumidor, operação de sessão, persistência, tela e origem do número):
P0 housekeeping (só se os arquivos estiverem livres): classificar os 12 módulos sem proprietário em revisao-automacao/escopo.json, registrar os asserts em asserts/LEIA.md, variáveis
   invocacoes_a_3m e invocacoes_no_alcance em automacao-dsl.md, sincronizar a fila com o arquivo de plano, reconciliar fontes.json pelo protocolo do G00 sem relaxar o assert.
P1 CX4 inteiro: Exaustão comum dos seis níveis (p.324), PV e PE temporários com teto, substituição, exceções e expiração (p.366), Regeneração Passiva por rodada (p.237), Dano Passivo Durante e Após
   (ou a simplificação registrada, conforme B3), Transformação com escolha de atributo e TR, condições por Feitiço com alvo e TR, histórico de alteração por nível, integração de cura, Dados de Vida e descanso.
   Preserve o botão único de descanso. Reaproveite o adaptador de ficha-opcoes-derive.js, o escritor de PV temporário e o contrato de uso do CL1. Depois ligue os consumidores que esperavam CX4 (CX2 e CX5).
P2 Companheiro Avançado (p.98): o companheiro NÃO conta no teto de Aliados do Grau (decisão do autor). Não use aliados_escolhidos. Tipo escolhido no marcador companheiro, graduação por nível
   (4 iniciante, 6 veterano, 12 mestre), efeito no dono por padrão e por Pacote para Aliados quando houver alvo.
P3 telas de vida e Alma (CL2), P4 telas de Votos, Domínios e invocações (CL3, inclusive ativaFrenesi, protegeInvocacao e a Restrição Congênita no derive), P5 telas e ligações de itens (CX5),
   P6 motor de uso nas telas (CL1), P7 resto de CX3 e CX2 sem duplicar quem está editando, P8 Pacotes para Aliados e dados que eram só consulta.
P9 só depois dos anteriores: auditoria por cláusula do catálogo, números e fontes, importação antiga, Player e Afty, Ficha clássica, G2 autorizado e Encontro, relatório final dos nove lotes.

Regras que valem em toda edição:
- Texto de regra é verbatim do Livro. Rótulos em Title Case, sem U+2014, sem ponto e vírgula em texto de tela, sem texto explicativo solto (explicação vai no hover com DicaDeTexto), aviso com o ícone
  AlertTriangle, número derivado com partes para o hover. Use as categorias, tabelas e o Motor existentes. Personalizado e Funcionamento Básico não são atalho.
- Não toque em src/components/. A regra vem de creature.rulesVersion, nunca da rota. Confirme com o autor antes de aplicar ao Afty o que for exclusivo do Player (regraDo e DIVERGENCIAS).
- Se mudar import, rode node asserts/t-ordem-modulos.mjs. Respeite as folhas listadas nele. Em Windows o python3 trava (use node), e arquivo CRLF não aceita Edit multilinha (use um script que normaliza).
- Todo núcleo novo: opId por clique, recusa com motivo devolvendo a mesma sessão, estado normalizado e salvo, teste com mutação deliberada, duas fichas reais, salvar e reabrir, sessão antiga.

Verificação e entrega: npm run asserts, npx eslint src/systems/afty/, build com --outDir isolado, navegador (1440 e 390, sem --hide-scrollbars, Ficha clássica, G2 autorizado e Encontro, Player e Afty,
dados de teste isolados, nunca regravar ficha real). Desempenho só em build de produção. Atualize docs/a-fazer.md (retire só o que fechou) e docs/afty-status.md, os guias do Motor se o Motor mudou,
e registre em docs/revisao-livro-regras/entregas/CX7.md a checagem inicial, achados confirmados e refutados, implementação, contratos, arquivos, testes, dependências e pendências.
Na resposta final separe: validado, implementado, falta e o motivo concreto. Não declare lote completo com dependência pendente.
```
