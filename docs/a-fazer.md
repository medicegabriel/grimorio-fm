# A FAZER — pendências do repositório

Arquivo ÚNICO de coisas a fazer. Vale para o Grimório 2.5.2, para o Afty e para o que for geral.

Criado em 2026-08-09 a pedido do autor: *"padronize as anotações de COISAS A FAZER em um único
arquivo md. Para outros colaboradores usarem ele também e ir anotando oq for preciso."*

---

## Ficha Final no celular: o botão Livros vira aba na borda (2026-11-08, resolvido na Ficha clássica)

O botão flutuante do Livro de Regras (`PdfFab.jsx`, em `src/components/`, somente-leitura) cobria o bônus da perícia, o custo de PE e o Crítico na borda direita. Resolvido só em CSS, sem tocar o componente: no celular (até 640 px), dentro da Ficha clássica, ele fica fechado como uma aba de 28 px na borda e volta ao lugar de sempre ao abrir a pilha. Em 390x700 e 360x640, nas abas Ações, Habilidades e Perícias, os alvos cobertos pelo botão foram de 0 a 10 por aba para 0, nas duas rotas. A regra se pendura no `aria-label` (`asserts/t-livros-aba.mjs` avisa se ele mudar).
**Falta:** a G2 continua com a trilha reservada de 72 px que o autor decidiu antes, e não recebeu a aba. Se o autor quiser a mesma aba nela, é trocar o escopo em `ficha.css`.

## Ficha Final: G2, aba Efeitos, o que a critique de 2026-11-09 deixou aberto

**Catálogo:** itens de Aptidão (por exemplo Aura Controlada) mostram só "Para Usar, Siga a Regra Completa", sem botão, no mesmo catálogo de itens com "Ativar". Um rótulo curto como "Só Consulta" ajudaria, mas é texto novo e fica para o autor decidir. Em 390 px a busca corta o placeholder ("Buscar pelo nome ou pela fir") e a fileira de filtros do catálogo passa da tela.
**Cabeçalho G2:** em 390 px os valores colapsam em "Mais 3 valores" sem dizer quais. "Histórico" (menu da barra) e "Histórico da Sessão" (pé da aba) são dois nomes para coisas diferentes.
**Livros:** a aba recolhida do botão Livros vale só na Ficha clássica. A G2 mantém a trilha de 72 px do autor, e o botão volta a cobrir a borda direita nas abas dela.

## Ficha Final: seleção e aviso em faixa lateral no G2 (2026-11-08)

O detector do Impeccable marca seis bordas laterais (`border-left` de 2 e 3 px) em `abas-g2.css` e `efeitos-g2.css`, mais as cinco de `ficha.css` que já constavam. Em todas a faixa carrega estado (item selecionado, aviso, condição). Nenhum ignore foi gravado: só trocar ou ignorar com o aval do autor.

## Pacote privado da mesa: verbos genéricos que faltam (2026-11-07)

Prontos: marcas de Origem, `contar()` e `tem_*` no montante, grupo de Talento por Addon, vaga de Talento por grupo e a troca fixa de atributo de perícia por Origem. Faltam, na ordem do plano:

- `bonus.passo` no `distribuir` de Origem (alocação em passos de 2, senão 2+2+1+1 passa).
- Opções geradas de catálogo em escolha de Addon (`gerarOpcoes`: perícias, Testes de Resistência e ataques).
- Contagem de marcas exposta no `derived` com as partes, para o hover.
- Requisito de Talento por marca (`{ tipo: "marca", marca, min }`), que desconta o próprio Talento.
- Origem sem Alma (`semAlma`): varredura do que é ligado à Integridade, mostrar a lista ao autor antes de vetar. Decidido: esconde e deixa inerte, `Alma Livre` fica de fora.
- Aviso por pacote para limite de atributo (`avisos`).
- Corrupção visual: a régua, o campo do pacote e as camadas das quatro telas estão prontas (V8). Falta conferir o painel do combatente do Encontro no navegador, o reset de impressão com o tema do usuário por cima, um interruptor de reduzir por quem vê e a medição de pintura em build + preview.
- Aviso do validador contra vaga que lê `contar()` (seria circular).

O conteúdo da mesa é privado e não é citado aqui.

---

## ⚠ DESCARTADO PELO AUTOR: Corpo Amaldiçoado Mutante (2026-10-30). NÃO IMPLEMENTAR

**O Corpo Amaldiçoado Mutante (Livro p.39 a 41, os três núcleos) foi abandonado e excluído do site em
definitivo.** Decisão do autor durante o CL2: *"Desisto de Corpo Amaldiçoado Mutante, cancela tudo que
foi feito e EXCLUI isso do site de maneira permanente. E coloca um aviso para o próximo que tentar
programar isso, DESISTIR DA IDEIA E IR FAZER ALGUMA OUTRA COISA."*

Quem encontrar o Mutante num prompt, numa análise ou num lote (CL2, CX2, CX6, N01 da análise de 29/10):
**desista da ideia, pule a parcela e vá fazer outra coisa.** Não reabra, não pergunte de novo, não
recoloque a origem no catálogo. A entrada `corpo_amaldicoado_mutante` saiu de `afty-origens.js`, os quatro
registros dela no `inventario.json` do G00 viraram `REMOVIDO` com justificativa, e
`asserts/t-mutante-descartado.mjs` falha se ela voltar. Continuam valendo e não são o Mutante: os
`multiplosNucleos` das invocações, a Anatomia Carapaça Mutante e a origem Maldição.

## Livro de Regras: lacunas confirmadas na análise aprofundada (2026-10-29)

**Onde:** [análise](revisao-livro-regras/10-analise-aprofundada-2026-10-29.md),
[matriz dos Talentos](revisao-livro-regras/11-matriz-talentos-2026-10-29.md), evidências em
`.audit/livro-20261029/`. A análise não altera os estados dos lotes da campanha de automação.

**Situação:** análise histórica de 29/10, com parcelas de CX1 implementadas e verificadas nesta sessão.
Entrega e contratos: [CX1](revisao-livro-regras/entregas/CX1.md). As demais lacunas continuam ativas.
Pendências novas ou detalhadas que não devem ficar escondidas no histórico:

- Produção adicional do Mestre da Criação: o procedimento de CX5 existe (`afty-producao.js`, +2 testes por foco de Criação de Itens) e falta a tela do Interlúdio. As duas escolhas de Ofício e a cura com usos do Adepto de Medicina foram ligadas e verificadas por CX3. Benefícios de clãs e origens seguem as parcelas específicas de CX2.
- Regeneração Passiva calculada sem operação de rodada. Dano Passivo convertido em média fixa sem preservar Durante/Após e dados. Confirmar a simplificação ou ligar a rolagem fiel.
- Reinvocação após dissipação por dano sem espera até o próximo turno (p.257).

**Precisa:** implementar e verificar por grupos de dependência indicados na análise. As entradas já existentes de
Marca Registrada, excedentes de Aptidão, Temporários, Golpe Especial, Controlador, Votos, descanso, CD, treinos e G2
continuam com suas decisões e escopos, sem duplicar suas perguntas aqui. Exaustão está na p.324, efeitos de crítico
na p.308 e prosa dos Auxiliares nas p.215 a 227: não é mais necessário solicitar esses textos ao autor.
Potencial Físico 2 já concede dois pontos por escolhas restritas aos físicos, com salvamento e retirada da etapa verificados por CX3.

**Verificação CX1:** base local e remoto iguais em `d6d6dd77`. Linha inicial 241/243 arquivos aprovados.
Resultado atual: 243/244 arquivos e 14.876 asserts nos arquivos aprovados, build e eslint Afty aprovados.
O lançador de Prodigio e a expectativa obsoleta de 32 remendos foram corrigidos. Existem 33 remendos.

**Pendência de fechamento CX1, reconciliação G00:** o assert agora alcança uma rejeição correta:
1.235 chaves vivas sem fonte individual em `docs/revisao-automacao/fontes.json`, 863 delas em
addons/heranças. Inclui conteúdo anterior e as entradas novas de CX1. Coleta sem erros.
Reconciliar inventário, donos e fontes pelo protocolo vigente, preservando estados e histórico,
antes de encerrar CX1. Não remover a exigência do assert nem atribuir fontes genéricas para passá-lo.
Evidência detalhada em `.audit/cx1-20261029/fontes-pendentes.json` e na entrega de CX1.

**Último corte concorrente:** após a entrada dos módulos de CL1, a repetição listou 244 arquivos
e aprovou 242, com 14.843 asserts nos aprovados. Além de `t-reconciliacao-g00`, falhou
`t-revisao-g00`: os novos `ficha/ficha-acoes.js`, `ficha-uso-estado.js` e `ficha-uso.js`
ainda estavam sem classificação no controle G00. Não foram editados por CX1. O resultado
243/244 acima identifica a conferência de CX1 anterior a essa entrada, não a árvore inteira
de CL1 em andamento. Novos asserts de CL1 surgiram depois da lista inicial do lançador.

### Divisão de execução: Codex e Claude (2026-10-29)

**Plano vigente: nove lotes grandes, seis do Codex e três do Claude.** Substitui a divisão anterior de 31 lotes,
reduzida a pedido do autor. Todo o escopo anterior foi preservado dentro dos blocos abaixo.
CX1 está implementado e validado nas parcelas de produto, com fechamento dependente da reconciliação acima.
CL1, CL2 e CL3 entregaram seus núcleos, conforme os registros de entrega, com ligações de tela
ainda atribuídas ao Codex. CX2 tem implementação parcial entregue em 2026-11-01. Os demais
lotes mantêm o estado específico registrado abaixo.

**Prompts para chats novos:** [índice dos nove prompts completos](revisao-livro-regras/prompts/README.md).
Antes de programar, cada responsável deve confrontar o pedido com livro, decisões e implementação atual,
reproduzir os casos por um percurso válido e apresentar o diagnóstico. Achados antigos são hipóteses a revalidar.
Depois, executar as parcelas confirmadas, sem pedir aprovação genérica adicional. A criação dos prompts não
altera os estados dos lotes nem inicia outros chats.

Codex assume o maior volume de correções, conteúdo, interface, integração e conferência. Claude entrega os
mecanismos de maior complexidade, com modelo, operações, testes e instruções para ligar o conteúdo às telas.
As parcelas internas são um checklist do lote, sem criar outra fila de pequenos lotes.

**Referências:** [análise completa](revisao-livro-regras/10-analise-aprofundada-2026-10-29.md),
[matriz dos Talentos](revisao-livro-regras/11-matriz-talentos-2026-10-29.md), AGENTS.md e guias específicos.
Fonte do livro: SHA-256 `1d0713d52c818a9ab9f47b883d9887a0d227d174d30ffcce358874669a7a733a`.

#### Claude: três lotes grandes de mecanismos complexos

| ID | Lote | Escopo e entrega | Dependências |
|---|---|---|---|
| CL1 | Motor de uso e combate, núcleo entregue | Operações de uso, ataque, dano, ações, eventos e concentração entregues. Integração geral das telas segue em CX6. CX2 consome os verbos de origem | Contratos e limites em `entregas/CL1.md` e `afty-motor-uso-combate.md`, sem certificação por outro lote |
| CL2 | Vida, morte e Alma | Núcleo entregue em 2026-10-30: saldo negativo (N09 e N10), Portas da Morte, estabilização, dano massivo, Ferimentos Complexos, TR de Integridade e cura de Alma, Dados de Vida. **O Corpo Amaldiçoado Mutante saiu do escopo: abandonado e excluído pelo autor, ver o aviso abaixo.** Falta ligar as telas de ação (Codex, CX6) e as perguntas de CL2 abaixo. Lote não encerrado | Contrato em `afty-vital.md`. Registro em `entregas/CL2.md` |
| CL3 | Invocações, Domínios e Votos, núcleo entregue | Núcleo entregue em 2026-11-01: Votos (tipos, pesos, prazo, ruptura, histórico, Restrição Congênita), Confronto e Contestação entre dois participantes, paredes, Cortinas e Cesta Oca de Vime, Dano Adicional no próximo ataque, prejuízo por repetição, Forma de Arma e estado de sessão na Característica Livre. Falta ligar as telas (Codex, CX6) e as perguntas de CL3 abaixo. Lote não encerrado | Guias em `afty-votos.md`, `afty-dominio-confronto.md` e na seção CL3 de `afty-invocacoes.md`. Evidência e limites em `entregas/CL3.md`, sem certificação por CX2 |

**Encerramento do Claude:** cada núcleo precisa ter operações e persistência verificadas, testes relevantes e
pontos de integração documentados. A entrega deve ser utilizável pelo Codex sem reconstruir a regra ou criar
outro mecanismo equivalente. Decisões pendentes não impedem liberar as partes já definidas.

#### Codex: seis lotes grandes de conteúdo e integração

| ID | Lote | Escopo e entrega | Dependências |
|---|---|---|---|
| CX1 | Base e correções comprovadas, fechamento parcial | Correções de produto, contratos de ataque/mãos, testes e navegador entregues. Restante: reconciliação de fontes de G00, sem suprimir sua rejeição correta | Protocolo de reconciliação e donos/fontes confirmados. Entrega em `entregas/CX1.md` |
| CX2 | Origens, clãs e Anatomias, parcial entregue | Escolhas, cálculos e operações integrados à clássica e ao Encontro. Foco respondido e implementado. Restam as integrações especificadas abaixo. Mutante cancelado em definitivo | CL1 e CL2 consumidos. Temporários, cura e descanso gerais em CX4/CX6. Matriz em `entregas/CX2.md` |
| CX3 | Talentos, Especializações, Aptidões e Treinos | **Encerrado com entrega parcial por decisão do autor em 07/11.** O restante fica na seção [CX3 depois da publicação](#cx3-depois-da-publicação) | Retomada por item, conforme as dependências registradas na fila |
| CX4 | Feitiços e recursos temporários | Transformações com escolhas de atributo/TR, Regeneração Passiva, dano Durante/Após, aplicação/cura de condições e histórico de edição por nível. Penalidades dos seis níveis de Exaustão, PV/PE temporários, teto, substituição, exceções e expiração. Integrar cura, Dados de Vida e descanso aos percursos autorizados | CL1 e CL2. Dano Passivo, controle de edição, PV rolado, descanso e desconto de Shikigami obedecem às decisões específicas |
| CX5 | Inventário, itens, encantamentos e Interlúdios | Equipamento inicial, aquisição por missão/grau, carga/Intermediários, itens criados por Feitiço, Pulseiras, consumíveis, venenos e demais itens ativos. Os 16 encantamentos de uniforme/escudo. Adaptação, produção e criação de invocações, Focos, testes, vestígios, Mestre da Criação e Ferreiro. Conferir fontes externas/equipamentos próprios sem ampliar os escopos recusados | CL1 para consumo, CL2 para efeitos vitais, CX4 para temporários e CL3 para vínculos de invocação. Reutilizar as escolhas de CX3 |
| CX6 | Aliados, Controlador, telas e fechamento | Completar Pacotes/Aliados e poderes de Controlador, limites em campo/por Invocar, espera após queda, posição declarada, proteção, Frenesi e Companheiro. Integrar telas de uso, vida, Votos e Domínios. Conferir catálogos por cláusula, fontes, persistência/importação, Player/Afty, clássica/G2 autorizado e Encontro | Contratos de CL1 a CL3 e conteúdo de CX2 a CX5 conforme entregue. Integração e revisão são incrementais, com fechamento após os demais |

**Encerramento do Codex:** conteúdo chega à operação real e à interface, com fonte do número, salvamento e
contraprovas pertinentes. Conferir ambos os sistemas, testes, lint/build e navegador conforme a mudança.
As 412 células já conferidas e funcionalidades concluídas não são trabalho a reconstruir. Auditoria restante
é verificação, não indicação automática de ausência.

### CX3 depois da publicação

Em 07/11, o autor encerrou o lote com o escopo já entregue e adiou os
itens abaixo para depois da publicação. As reservas exclusivas de CX3
estão liberadas. A reserva de `afty-derive.js` pertence a CX6.
Os registros de execução mais abaixo são históricos.

| Frente adiada | Trabalho e dependências |
| --- | --- |
| **Aptidões e Treinos** | Integrar os sete módulos testados de Absorção Elemental, Auras por posição e destinatário, Golpe com Aura, Estímulo, Punho Divergente, Anti-Domínios e Teste de Morte em duas etapas. Aplicar os patches compartilhados conforme as decisões de regra. Preservar Treino Especial e Dados de Vida de Resistência 2. Registro de tentativas das Linhas segue condicionado à decisão já aberta. |
| **Feitiços, invocações e Domínios** | Vincular cobrança, rolagem, nível, tipo de efeito e alvos de Feitiços, inclusive em área, para Apaziguador, interrupções, Anular e Revestimento. Ligar ataques de invocação e Acertos Garantidos à janela prospectiva. Ligar abertura e Acerto Garantido físico de CL3 à Pétala. Vínculo de sessão e posição para Pacotes, incluindo o alcance temporário de Expandir Aura, dependem de CX6. |
| **Testes vitais e cura** | Oferecer escolhas antes das consequências de Morte, Ferida Interna, Alma e concentração, com os limites de Sorte, Indomável e Outra Chance. Ligar Resistência Completo à entrada de CX6. Completar curas externas, Medicina em Cura em Grupo e Regeneração, Sintonização em grupo e o gatilho de perda de PV de Fluxo Constante. Estender Aura Drenadora a mortes com autoria comprovada. |
| **Combate e classes** | Agarrar e Fuga com CL1, Adepto de Briga, Wrestling, Aparar e Devolver Projéteis, Golpear Brecha, Redirecionar Força, Deboche, Insistência e Explosão Defensiva. Interceptador e Protetor com alvo, posição e reação. Arremessador, Duplo e Empunhadura Dupla seguem as decisões por mão. Ligar Amplo, Impactante, Sanguinário e Lento. Completar os provedores de posturas, Saltador e Provocação e os acionamentos de Suporte, Restringido e Controlador. Companheiro Avançado segue em CX6. |
| **Talentos e encaixes entre lotes** | Rever as lacunas por cláusula na matriz dos 52 Talentos, incluindo Atenção Infalível, Determinado a Viver, Discurso Motivador, Adepto de Feitiçaria, Ocultamento, Resiliência Melhorada e movimento de Físico Aperfeiçoado. Conferir Marca Registrada, Familiaridade e Manual com CX2, temporários com CX4, e Artesão, Mestre da Criação, Dedicação, Primacial e produção com CX5. Ferramenta Amaldiçoada fica no lote posterior indicado nesta fila. |
| **Decisões de regra** | Prazo, segunda carga e demais casos de Absorção, composição de Macabra e manutenção pulada, relógio e dano misto de Punho, custo e empate de Anular, escalada e unidade de redução de Revestimento, contato físico e DOM da Pétala, d20 1 e cena de Resistência Completo. Mantêm-se as dúvidas registradas de Cobrir-se, Esquiva com Empolgação 1, Armas Absolutas, Adepto de Combate, Sintonização em Cura em Grupo, Imóvel da Tempestade, restos de Dragão e Raio Negro, Energia Reversa do Dragão, Provocação impossível, Atacar e Recuar, Pular e escopo de Golpe Especial. |
| **Validação da retomada** | Atualizar a matriz e as fontes por cláusula. Rodar os asserts afetados, a suíte, ordem de módulos, lint e build. Verificar Player/Afty, clássica, G2 autorizado e Encontro, incluindo custo, recusa, prazo, recarga e fichas antigas. Na última suíte passaram 306 de 308 arquivos. As duas falhas de G00 já existiam e também listam a classificação pendente dos sete módulos. O patch de classificação foi verificado em cópia. |

Detalhes, decisões e patches nos repasses de [CX3](revisao-livro-regras/entregas/CX3.md)
e [Aptidões e Treinos](revisao-livro-regras/entregas/CX3-aptidoes-treinos.md).
A [matriz dos Talentos](revisao-livro-regras/11-matriz-talentos-2026-10-29.md)
separa Livro, conteúdo adicional nativo e catálogos externos.

#### Ordem e trabalho em paralelo

1. **Primeiro:** Codex começa CX1 pela conferência da base. Claude já pode preparar CL1 sobre essa base identificada.
2. **Enquanto Claude faz CL1:** Codex conclui as correções de CX1 e adianta escolhas/contas independentes de CX2 e CX3.
3. **Enquanto Claude faz CL2 e depois CL3:** Codex avança CX2 a CX5 conforme cada operação é liberada.
4. **Durante toda a execução:** Codex integra e verifica em CX6. O fechamento final só ocorre quando todas as parcelas
   aplicáveis estiverem ligadas ou identificadas como decisão pendente do autor.

Uma dependência vale para a parcela que a usa. Não esperar o fim de um lote inteiro para consumir uma operação
já entregue e verificada. Também não marcar o lote inteiro como concluído quando só parte dele funciona.

#### Coordenação e decisões preservadas

**CX1: reservas liberadas em 2026-10-29.** Parcelas de produto entregues,
fechamento dependente somente da reconciliação acima. Lista de arquivos reservados,
alterados e liberados em `revisao-livro-regras/entregas/CX1.md`. Base observada:
`d6d6dd77a7999d0df0454eb58d62584c0f46a9a3`, sem mover HEAD.
Alterações preexistentes de Técnicas Marciais preservadas, com ajuste estreito
da contraprova de Passiva no assert, documentado na entrega.

**CL1: núcleo entregue, reservas liberadas.** Estado conforme a seção Liberação de
`revisao-livro-regras/entregas/CL1.md`. Integração geral de telas em CX6, mapa em
`afty-motor-uso-combate.md`, seção 9. O núcleo não foi reescrito por CX2.

**CL2: núcleo entregue em 2026-10-30, sem reserva em pé.** Registro em `revisao-livro-regras/entregas/CL2.md` e contrato em
`afty-vital.md`. Arquivos novos: `ficha/ficha-vital.js` (folha), `ficha-morte.js`, `ficha-alma.js`, `ficha-dados-vida.js` e seus asserts.
Editados em trechos pequenos: `ficha/ficha-sessao.js`, `ficha-especializacoes.js`, `ficha-dano-recebido.js`, `ficha-acoes.js`, `ui/vital.jsx`, a barra de PV
da Ficha clássica e do Encontro, e `afty-origens.js` (só a exclusão do Mutante). Os arquivos do CL1 que a nota acima ainda lista como reservados já
tinham sido liberados na seção Liberação de `entregas/CL1.md`.

**Perguntas ao autor (CL2), sem bloquear nada:**

1. Dano enquanto nas Portas da Morte: soma ao saldo negativo e dá uma falha por ataque? Adotado: sim (a pergunta ficou sem resposta).
2. Dano massivo: o saldo estritamente maior que o PV máximo mata, e o saldo acumulado também conta? Adotado: sim.
3. Cura que quita a dívida exatamente deixa o corpo em 0 PV estabilizado e agindo? Medicina e três sucessos deixam com 1 PV. Adotado: sim.
4. Ferimento Complexo: o gatilho conta o dano inteiro do ataque (casca de PV temporário inclusa)? Ferida interna tratada fica com CD 10 + nível? Adotado: sim aos dois.
5. A recuperação de metade do dano na Alma no descanso longo (p.311) deve ser ligada ao botão de descanso único? Hoje a função existe e não está ligada.
6. O Treino de Resistência 2 soma 2 Dados de Vida de que tamanho (o texto não diz)? Adotado: o do maior dado da pilha.
7. A CD do teste de Integridade antes do Dano na Alma é a da fonte do dano (o livro não traz uma)? Adotado: a operação exige a CD.

**Ligações para o Codex (CL2):** botão do teste de morte (`resumoVital(...).pode.rolarTesteDeMorte`), Medicina, escolha ou rolagem do Ferimento, lista de
ferimentos (tratar, permanente, recuperar), Dano na Alma com teste, cura de Alma, gasto de Dados de Vida, o aviso no cabeçalho da Ficha G2 e o mesmo
`ataqueId` em todas as instâncias de um ataque. Mapa em `afty-vital.md`, seção 5.

**CL3: núcleo entregue em 2026-11-01, sem reserva em pé.** Registro em `revisao-livro-regras/entregas/CL3.md` e contratos em
`afty-votos.md`, `afty-dominio-confronto.md` e na seção CL3 de `afty-invocacoes.md`. Arquivos novos em `ficha/`: `ficha-votos-regras.js`
(folha), `ficha-votos.js`, `ficha-barreiras-estado.js` (folha), `ficha-barreiras.js`, `ficha-dominio-confronto.js`, `ficha-invocacao-uso.js` e os asserts
`t-cl3-votos`, `t-cl3-dominios`, `t-cl3-invocacoes`. Editados em trechos pequenos: `afty-votos.js`, `afty-invocacoes.js`, `ficha-sessao.js`,
`ficha-uso-estado.js`, `ficha-concentracao.js`, `ficha-uso.js`. Nada no derive, nos efeitos nem no criador.

**Perguntas ao autor (CL3), sem bloquear nada** (cada uma está implementada na leitura mais conservadora):

1. Votos: os Contratuais sem limite de BT contra a p.350 (decisão de 2026-09-20 preservada). Romper um Voto Próprio Permanente não está escrito (a operação recusa). O custo de desfazer um Voto Temporário não tem número (texto da mesa). Quebrar um Voto com duração: o malefício vale direto até o interlúdio ("ao invés disso", p.351)?
2. Domínios: Expansão já ativa contra um desafiante com DOM **maior**: vale a regra geral (o maior vence, p.185) e não a Contestação (p.186)? O dano do usuário que também vai ao domo vale a metade, pela resistência do interior? Contestar um alvo sem barreira (Sem Barreiras) é possível? Condição que impede concentração derruba a Cesta Oca de Vime (a lista do CL1 nasce vazia)?
3. Barreiras: o custo da Cortina ("1 PE a cada 9 metros") arredonda para cima por bloco, mínimo 1? O texto não dá ação nem RD à Cortina (adotado: nenhuma ação registrada e RD zero). Parede e Cortina não têm duração no livro.
4. Invocações: "uso repetido" conta qualquer auxílio da mesma invocação ou só o mesmo benefício (`CONTAGEM_DO_PREJUIZO`)? O Dano Adicional é consumido no ataque declarado, acertando ou errando? A Forma de Arma sem a arma empunhada usa o acerto e o fixo do Ataque Básico do dono? A linha da Forma de Arma usa o fixo do dono, e não o bônus de dano da Ação Complexa?
5. A Restrição Congênita (limites de atributo, pontos recebidos, PV por nível) é validada e o balanço é calculado, mas **não chega ao derive**: só os efeitos escritos em cada lado do Voto entram no Motor.

**Ligações para o Codex (CL3):** Votos: `realizaVoto`, `quebraVoto`, `desfazVoto`, `avancaVotosNaRodada`, `votosAoFimDoCombate` e o botão do interlúdio
(`votosNoInterludio`), com `creature.votos` gravado pela tela. Domínios: `participanteDeDominio`, `resolveConfronto`, `iniciaConfronto`, `aplicaResultadoDoConfronto`, `reconciliaConfronto`,
`avancaContestacao` por par na virada de rodada, os cards de paredes, Cortina e Cesta, e `iniciaTurnoDaCesta` perguntando à mesa se o Acerto Garantido o
atingiria. Invocações: trocar o interruptor da aba por `usaAuxilioDaInvocacao`, mostrar `linhaDeFormaArma` nas Ações do dono e chamar
`registraAtaqueRealizado` com `invocacao:<id>` nas categorias dos ataques da invocação. O Pacote para Aliados ainda leva o auxílio sustentado SEM prejuízo.
Rotular `custo.pe.naoDescontado` como "PE Não Descontado". Mapas nas seções 6 dos guias.

**CX2: parcial entregue em 2026-11-01, reservas liberadas.** Diagnóstico inicial
de 29/10 preservado. Escolhas, cálculos, fontes e operações de origem na clássica
e no Encontro, sobre CL1/CL2 reais. Recarga diária manual incorporada. Matriz,
arquivos alterados, contratos, testes e limites em `revisao-livro-regras/entregas/CX2.md`.
Nenhum arquivo continua reservado por CX2. CL3 liberou seus arquivos antes da
classificação dos módulos novos. CX4 continua sem entrega local.

**Histórico de CX3, 2026-11-02 a 07/11.** Diagnóstico inicial publicado em 01/11,
retomado após liberação das reservas de CX2 e CL3. Arquivos reservados durante a execução: `afty-talentos.js`,
`afty-aptidoes.js`, `afty-treinamentos.js`, `afty-atributos.js`,
`afty-efeitos-conteudo.js`, `afty-efeitos.js`, `afty-combate-aptidoes.js`,
`afty-propriedades-armas.js` (somente preservar o mesmo projétil no redirecionamento da Aura),
`afty-combate.js`, `afty-habilidades.js`, `afty-cura.js`, `afty-schema.js`,
`afty-feiticos.js`,
`AftyCreatureBuilder.jsx`, módulos próprios `afty-conteudo-*.js`,
`ficha/ficha-conteudo-*.js` (incluindo `ficha-conteudo-posturas.js`, entrada e prazo das posturas próprias), `ficha/PainelConteudo.jsx`,
`ficha/efeitos/operacoes.js` (somente a entrada de Assumir Postura pelo catálogo G2),
`ficha/efeitos/g2-preparo.js` (contador da troca de postura, decisão de 06/11),
`ficha/efeitos/efeitos-dados.js` (somente leitura do prazo nativo de Assumir Postura),
`ficha/abas/AbaAcoes.jsx`, `ficha/abas-g2/AcoesG2.jsx`,
`ficha/ficha-sessao.js`,
`ficha/ficha-opcoes-derive.js`, `encontros/PainelDeCombatente.jsx`,
`ficha/ficha-rolagem.js`, `afty-condicoes.js`, `afty-pericias.js`,
`ficha/ficha-especializacoes.js` (Sobrevivente, regeneração própria de classe, imunidade a movimento forçado de Terra/Barreira e registro da postura Dragão no pedido de ataque),
`ficha/ficha-votos-regras.js`, `ficha/ficha-votos.js` e `docs/afty-votos.md`
(somente a exceção de conteúdo de Voto Malevolente sobre CL3),
`ficha/abas/AbaHabilidades.jsx`, `ficha/GrupoComSubAbas.jsx`, `ficha/ItemDeFicha.jsx`,
`ficha/abas/AbaPericias.jsx`, `ficha/abas-g2/PericiasG2.jsx`,
`ficha/abas-g2/rolagens-acoes.js`, `ficha/efeitos/ConsultaG2.jsx`,
`ficha/PainelDeRolagens.jsx`,
`encontros/AftyEncontro.jsx`, `encontros/usar-encontro-afty.js`,
`asserts/t-cx3-*.mjs` (incluindo `asserts/t-cx3-investida.mjs`), `asserts/t-talentos.mjs`, `asserts/LEIA.md`, `asserts/t-ordem-modulos.mjs`,
`afty-player.md`, `automacao-dsl.md`,
`afty-formulas-base.md`, `revisao-automacao/escopo.json` e `entregas/CX3.md`.
Reserva ampliada em 06/11: `revisao-automacao/fontes.json`, somente localização
individual das chaves de conteúdo de CX3, sem aprovação ou reconciliação global.
Núcleos CL1 a CL3 são consumidos, não reconstruídos. Sem promoção do G2.

**Coordenação CSS/editor encerrada, 2026-11-06.** O lote autorizado preservou
callbacks e controles de CX3. A reserva exclusiva de CSS sobre
`ficha/AftyFichaClassica.jsx`, `ficha/AftyFichaG2.jsx`, `ficha/efeitos/ConsultaG2.jsx`,
esta fila e `afty-status.md` está encerrada. CX3 pode voltar a editá-los,
reservando os que precisar. Os demais módulos e guias de CX3 mantêm suas reservas.

**CX3 retomou a edição desta fila e de `afty-status.md` após a liberação explícita
do CSS/editor.** Os cinco arquivos liberados preservam os ajustes de aparência e
persistência entregues. As duas apresentações e ConsultaG2 não exigiram nova
alteração para Investida, Intervenção, Versatilidade ou Análise Profunda.

Corte informado por CX3 durante este lote: Investida (110 verificações) e
Intervenção entregues com navegador Player/Afty, clássica/G2/Encontro e 1440/390.
Versatilidade também validada em 46 testes novos e navegador com uso, custo e
reload. Total específico informado: 1.271 verificações. CX3 continua em andamento.
Esse corte não é conclusão do lote nem certificação global.

Complemento de CX3: Análise Profunda (p.105) foi ligada ao teste nativo,
pagamento, Ação Comum e limite por criatura/cena, com conclusão separada
para permitir Sorte antes da descoberta. São 44 testes novos, classes agora
576 e total específico 1.315. Navegador Player/Afty no Encontro, 1440/390,
incluiu uso, resultado de duas características e reload. O lote segue aberto.

Complemento atual de CX3: Mobilidade Avançada usa o recibo real de queda do
aliado e a reação nativa, Voadora acrescenta seu grupo de dados na Investida
e Sobrevivente cura pelo início do turno, sem misturar Corpo de Aço. O
primeiro combatente também recebe esse início ao começar o Encontro.
Nove arquivos específicos passaram em 1.655 verificações, com navegador
Player/Afty, clássica/G2/Encontro e 1440/390 nos percursos aplicáveis.
Suíte completa: 273/275 arquivos, somente reconciliação e classificação
G00 reprovadas. Build, eslint Afty e ordem dos módulos aprovados. O lote
continua aberto pelas parcelas e decisões registradas, sem certificar CX5.

Adepto de Briga: Derrubar e Empurrar ligados ao acerto desarmado confirmado
sem dano, disputa em duas etapas e Ação Livre nativa, 72 verificações e
navegador. A opção Agarrar ainda depende do vínculo com quem agarrou e do
procedimento de fuga no início do turno do alvo. Não encerrar esse Talento
inteiro pela aplicação isolada da condição Agarrado.

Sintonização Vital (p.107) ligada às curas realmente aplicadas pelo cliente
de conteúdo, com metade anterior ao teto de PV e sem outra ação, por 3 PE.
São 80 verificações e navegador. Feitiços de cura e procedimentos sem
recibo tipado continuam dependendo da integração de seu provedor.

Incitar Vigor ligado à própria ficha e ao destinatário no Encontro, com
Dados de Vida de CL2, ação/custo do Suporte e transação sem cobrança na
recusa. Voto Malevolente ligado ao validador/realização de CL3, mantendo
as demais regras. CX6 precisa passar `ctx.talentos` acessíveis na
pré-avaliação e `derived` na realização ao ligar a tela do ciclo de vida.
Nenhuma tela de Voto foi certificada por CX3. Total específico atual:
12 arquivos, 1.813 verificações. O lote permanece em andamento.

Corte após Renovação pelo Sangue e Técnicas Agressivas de Escudo: 14 arquivos
específicos, 1.946 verificações. Escudo cumpre a decisão do autor, Caído
conserva o empurrão normal, disputa/aplicação separadas, Ação Bônus e dano
nativo. Pergunta encerrada e retirada. Renovação recupera um PE pelo
crítico ou abate real, preservando a concessão diferente de Base em Afty.
Navegador Player/Afty, clássica/G2 e Encontro nos percursos aplicáveis,
1440/390, com salvamento e recusa fora do próprio turno. Suíte completa:
278/280 arquivos, duas falhas G00, lint/build e ordem dos módulos aprovados.

Fortuna (p.76) ligada ao d20 individual, mantendo o maior, uma vez por dado
e metade de BT por rodada. Usa a escolha e postura nativas, inclusive
Imitação, e preserva a decisão das oito posturas de Invencível sob o Sol.
São 128 verificações específicas, total atual de 15 arquivos CX3 e 2.098.
Navegador Player/Afty, clássica/G2 e Encontro, 1440/390, com salvamento.
O reaproveitamento opcional de dano de Escudo também foi verificado,
92 verificações nesse arquivo. Infalível recusa dano de manobra.
A entrada e duração das posturas foram ligadas na continuação abaixo.

Após Fortuna, CX3 libera temporariamente `afty-derive.js` para a integração
concorrente de Controlador/CX6, sem liberar os demais arquivos próprios.
Sentinela foi ligado nos clientes de manobra, confirmação e controle de
conteúdo já reservados, sem alterar o derive. Oportunidade tem identidade
própria e o acerto reduz Movimento até o fim do turno do alvo. A outra
reação usa ataque real contra terceiro, sem virar oportunidade. São 92
verificações e navegador Player/Afty, clássica/G2 e Encontro, 1440/390.
Corte próprio: 16 arquivos e 2.190 verificações. Suíte: 283/285 arquivos,
somente as duas falhas G00, incluindo módulos concorrentes de CX6 ainda
sem certificação por CX3. Lint Afty, build e ordem aprovados.

Técnicas de Mobilidade ligada: disputa real de Reflexos ao atacar, uma
vez por rodada, proteção somente contra o oponente vencido. O preparo
da oportunidade lê o alvo antes de gastar reação e a confirmação repete
a checagem. **Decisão do autor, p.168:** termina no fim do turno em curso,
inclusive se atacar como reação fora do próprio turno. O Encontro guarda
o id e a sequência nativa desse turno e encaminha seu fim a CL1. São 82
verificações, total próprio atual de 17 arquivos CX3 e 2.272 verificações.
Navegador de apresentação clássica/G2 e operação no Encontro, Player/Afty,
1440/390, incluiu oportunidade bloqueada sem gasto, terceiro permitido,
salvamento e término fora do próprio turno. Pergunta encerrada.

Orientação anterior de reunir dúvidas ao final revogada pelo autor em 06/11:
pode voltar a perguntar durante o trabalho. Não presumir respostas para as
parcelas pendentes, continuar o trabalho independente.

**Complemento de CX3, imunidade a movimento forçado (p.76/121):** Terra,
Barreira e Terra do Ápice ligadas ao Motor e aos consumidores de Chicote,
Concussão, Briga Empurrar, Escudo e críticos de Bastão/Haste. Recusa antes
de cobrar ou aplicar efeitos, com revalidação da disputa salva. Cair ou
sofrer incapacitação encerra ambos os espaços de postura, inclusive na
leitura de sessão antiga. Levantar não os restaura. PV temporário manual
da Terra já existia e foi preservado. Ativação/duração geral continuam
em aberto. São 150 verificações específicas, total de 18 arquivos e 2.422.
Navegador: oito fichas clássica/G2 e quatro percursos no Encontro, Player/Afty
e 1440/390, com recusa sem consumo, queda e persistência. Corte completo
285/287, somente G00. Fontes localizadas por CX3: 76, sem aprovação global.

Posturas próprias (p.72/75/76): entrada/troca, Preparação Rápida, prazo CL1
e cancelamento por Empurrar entregues. São 200 verificações e navegador,
incluindo o Ativar G2 nativo sem segundo débito e a troca com novo uso,
ação e dez rodadas. As decisões estão encerradas, histórico em CX3.md.

Aura Redirecionadora integrada ao preparo e à confirmação nativos, 244
verificações e navegador, preservando falha/eventos de A e o mesmo projétil
na nova jogada contra B. Sem nova ação ou munição. Questões encerradas.
Ação Ágil integrada em Lutador/Restringido, 169 verificações e navegador
de 16 fichas/oito Encontros, sem duplicar Habilidades de mesmo nome.
Cortes integrado ao acerto com dano cortante efetivo, uma vez por turno,
até o início do próximo turno de quem o aplicou. Cópias do mesmo benefício
competem no grupo nativo, conservando seus prazos. São 90 verificações e
navegador de oito fichas/quatro Encontros, Player/Afty e 1440/390.
Corte próprio: 23 arquivos, 3.205 verificações. Última suíte encerrada:
290/292, somente G00. Fontes CX3 96. Restante do lote continua em andamento.

**Saltador Constante (Livro p.164), decisão de 06/11, integrada no Encontro:**
o bônus de +2 no ataque e o dano adicional de Força valem após qualquer ação
Pular que termine em alcance corpo a corpo. O segundo salto junto a parede
ou objeto permanece um benefício separado. Bônus apenas no primeiro ataque
contra esse alvo, confirmado pelo autor. As questões estão encerradas, assim
como a decisão da Investida (Movimento 9 resulta em 24 m).

**Pular, lacuna da tabela (p.303), decisão pendente:** não há faixa para
MOD FOR -3 e -2 entre as linhas -5/-4 (1,5 m) e -1/0 (3 m). Pergunta
enviada ao autor, sem inventar a distância dos modificadores ausentes.

**Provocação Desafiadora (p.164), decisão de 06/11:** os usos de Provocar
como Ação Livre, iguais à metade do modificador de Presença, voltam no
descanso longo. No Encontro, disputa, gasto, modo do ataque por alvo e
prazo pelo provocador foram verificados. A obrigação fica visível até um
ataque contra ele, mesmo se errar. Sem bloqueio de fim de turno nos casos
em que o ataque é impossível ou a origem não tem recibo de confirmação.

Postura da Lua (p.76): Andar/Desengajar como Ação Livre integrados, 92
verificações e oito fichas/quatro Encontros no navegador. Identidades de
Livre distintas, proteção de oportunidade até o fim do turno, sem PE.
Inclui Imitação, Mestre e Ápice. Corte próprio: 24 arquivos, 3.297
verificações, 103 fontes localizadas. Suíte completa 291/293, somente G00,
lint Afty e build aprovados. A reação agora está ligada à janela do ataque
com alvo do turno corrente no Encontro. Outros provedores continuam abaixo.

**CX3, integrações e decisões de reação pendentes.**

- Cobrir-se (p.178) tem a reserva avulsa até o fim do turno da fonte.
  Para ataques fora do turno da fonte, falta definir qual fim de turno
  encerra a reserva. Confirmar também se o +1 de Físico Amaldiçoado
  Defensivo com Cobertura Avançada (p.87) substitui o +2 ou se soma a ele.
  A combinação usa a faixa base até essa decisão.
- A janela recebe dano corporal de arma e dano secundário do Dragão
  com origem, alvo e turno conferidos no Encontro. Ligar invocação,
  Feitiço e Acerto Garantido quando entregarem recibo prospectivo.
- Esquiva (p.50) já usa o dado de Empolgação disponível. Confirmar o caso
  de Empolgação 1, quando a tabela ainda não fornece dado. Aparar Ataque
  (p.53) já disputa antes do acerto para as linhas corpo a corpo no
  Encontro. Confirmar se a resposta do defensor pode usar uma linha à
  distância. A extensão de Golpear Brecha continua pendente. Aparar
  Projéteis precisa do atributo-chave do Lutador e da identificação de
  projétil (p.53).
  Explosão Defensiva precisa integrar o deslocamento forçado e a
  concentração, além da redução de dano (p.84). Reações de aliados
  precisam de alcance e transação entre os participantes.
- Anular Técnica e Revestimento (p.182) aguardam aplicação de Feitiço
  com conjurador, nível, custo efetivo, conjunto de alvos e efeitos
  pendentes. Pétala (p.181) aguarda a abertura da Expansão por afetado
  e a instância física de Acerto Garantido com origem, nível de DOM e
  alvo. Os recibos parciais existentes estão no repasse de CX3.
- Expandir Aura (p.179) já mostra os alcances com manutenção. A aplicação
  dos efeitos em destinatários depende da posição. Confirmar o tratamento
  de rodadas de manutenção puladas além da cadência de CL1.
- Absorção Elemental (p.175) já deriva o grupo tipado quando existe
  carga. A entrada proposta lê dano já aplicado. Integrar a ativação
  à janela prospectiva depois de acertar prazo e destino da segunda
  carga. O prazo já foi perguntado ao autor.
- Treino de Resistência Completo (p.346) tem um cliente para o teste
  de morte e aguarda a entrada de CX6. Confirmar o d20 1 e o limite
  por cena fora do combate antes de ligar a tela.
- Punho Divergente (p.181) precisa definir de quem é o turno seguinte,
  a composição do dano misto e o conflito de Vulnerabilidade com
  Resistência. Para Anular Técnica, Revestimento e Pétala, conferir
  disputa, custo, manutenção, efeitos suprimidos e contato físico
  conforme as perguntas da seção 7 de `entregas/CX3-aptidoes-treinos.md`.

**CX3, decisões do repasse que aguardam revisão.** De quem é o turno
que encerra Imóvel da Tempestade? Como distribuir restos ímpares e
Energia Reversa no alvo secundário do Dragão? Sintonização Vital em Cura
em Grupo se conta por parcela ou pelo uso original? Como registrar
Provocação quando atacar é impossível? Ação de Atacar e Recuar, faixas
-3/-2 de Pular e prazo de Absorção Elemental já foram enviados.

**Dragão (p.76), entrega no Encontro em 07/11.** Fortitude e dano secundário
ligados ao recibo do ataque, com dois inimigos, Imitação, Ápice e ataque fora
do turno. Lua e Cobrir-se podem responder ao dano secundário conforme seus
gatilhos e o saldo de reação. Restam os provedores sem recibo e duas decisões
de mesa: distribuir
o resto de dois ou mais tipos ímpares e determinar a parcela de Energia Reversa
do Dragão contra um secundário que não seja Maldição. A recusa vem após o TR
em falha e preserva as duas sessões. Essas perguntas aguardam o autor acordar.

**Raio Negro misto (p.192 e p.307).** A confirmação nativa aplica as
parcelas quando o subtotal critável de cada tipo conserva a rolagem inteira.
Qual tipo recebe o ponto que sobra ao aplicar o piso global com dois
subtotais critáveis ímpares? O caso continua com resolução na mesa.
Recibos mistos antigos precisam da nova rolagem para publicar os subtotais.
O limiar dinâmico de Consciência Absoluta precisa de recibo de sessão.

**Retomada em 07/11.** Trabalho retomado por pedido do autor, com nova
continuação única às 12:00 no mesmo chat, horário de São Paulo. Novas
perguntas aguardam até o autor avisar que acordou.

**Cura em Grupo (p.191), entrega no Encontro em 07/11.** Uma rolagem e
divisão pela mesa, total conservado, aplicação conjunta e salvamento.
A interação de Sintonização Vital com uma rolagem de vários destinatários
continua pendente. Definir se o gatilho é por parcela ou pelo uso original.

**Absorção Elemental, p.175.** Prazo da carga entre combates e descansos
perguntado ao autor. CL1 limpa as pendências no fim do combate e no descanso.
O dano adicional pode usar grupos tipados de `afty-combate-aptidoes.js`.
O consumo de declaração em CL1 ocorre ao registrar o ataque resolvido,
inclusive o erro. Verificar esse percurso e aguardar a decisão sobre o prazo.

**Aura Drenadora (p.175), entrega em 07/11.** Ataque confirmado, Dragão e
Escudo concedem a reserva na morte atribuída ao dano. Provedores de morte
sem autoria verificável ainda dependem de integração. A queda a 0 PV não
é suficiente para a Aptidão.

**Pular e Saltador Constante, corte de 07/11.** Ação de Movimento, teste
opcional, queda e salto livre ligados às fichas clássica/G2 e ao Encontro.
O alvo corpo a corpo é declarado ao aterrissar. O bônus de ataque é
aplicado ao confirmar o primeiro ataque contra ele, inclusive o consumo
no erro. Provedores sem confirmação de ataque por alvo continuam na fila.
70 verificações, oito fichas e quatro Encontros no navegador. Corte de 28
arquivos, 3.536 verificações e 126 fontes. Reserva pontual da aba Ações
em `AftyFichaG2.jsx`, mantendo o acesso por `?ficha-g2=1`.

**Medicina Infalível (p.103), corte de 07/11.** A cura individual pode
aguardar a escolha de dados, com quota e aplicação nativas. A cura
final conserva a ação e o custo e serve de fonte para Sintonização.
A cura de Fluxo foi integrada no corte posterior. Cura em Grupo,
Regeneração e provedores externos aguardam o respectivo contrato.
São 63 verificações, oito fichas e oito Encontros somando os cortes.

**Devastação e Tempestade (p.76), corte de 07/11.** Devastação própria
usa pilhas por alvo no Encontro. Tempestade aplica Caído após Fortitude
do alvo de um acerto. O Imóvel contra alvo já caído ainda exige a
definição de “seu turno” e vínculo da condição. São 56 verificações e
oito Encontros. Corte de 32 arquivos, 3.703 verificações e 134 fontes.

**Concentrar Aura (p.176) e Fluxo Constante (p.190), corte de 07/11.**
A concentração usa Livre, restaura passivas na rodada seguinte e
acrescenta dado Energético após acerto. A bancada manual continua
disponível para simulação. Fluxo é cura própria e a Livre exclui a
Reação até o próximo turno do usuário. A cura individual de Fluxo
pode usar Medicina Infalível. Perda de vida segue declaração da mesa.
Corte de 33 arquivos, 3.751 verificações e 136 fontes.

**Decisão pendente de CX3, Atacar e Recuar (Livro p.55):** o movimento por
1 PE após acerto faz parte do acerto, sem outra ação, ou consome Ação de
Movimento ou Reação? O texto define até 4,5 m, afastar-se do alvo, uma vez
por turno e sem ataques de oportunidade, mas não nomeia a ação. Pergunta
enviada ao autor no chat de CX3, sem presumir a resposta de Outra Chance.

**CX5: núcleos entregues em 2026-11-06, lote ABERTO, sem reserva em pé.** Registro, matrizes
dos 48 Itens Especiais e dos 16 encantamentos, procedimentos e verificação em
`revisao-livro-regras/entregas/CX5.md`; contrato em `afty-equipamentos.md`, seção CX5.
Linha de base 264 de 265 arquivos, depois 272 de 274 (os 9 asserts novos `t-cx5-*` passam, 860
verificações). Arquivos novos: `afty-itens-uso.js`, `afty-encantamentos-ativos.js`,
`afty-producao.js`, `afty-equipamento-inicial.js`, `afty-armas-improvisadas.js`,
`ficha/ficha-itens.js`, `ficha-itens-feitico.js`, `ficha-itens-especiais.js` e
`ficha-encantamentos.js`. Os arquivos reservados por CX3 (derive, sessão, opções do derive,
criador, Encontro, Feitiços, `t-ordem-modulos.mjs`, `LEIA.md`, guias do Motor,
`escopo.json`) **não** foram tocados. Sem tela nova, sem promoção do G2.

**Pendências específicas de CX5 (ligações que dependem de arquivo reservado):**

1. **Telas, para o Codex:** seletor de perícia das Pulseiras no criador (`escolhaPericia` na
   entrada), botão Usar no inventário (`usaItem`, `bloqueioDeItem`), usar encantamento e
   cargas (`usaEncantamento`, `resumoDeCargas`), criar por Feitiço (`criaItensDoFeitico`),
   abas de Produção e Adaptação (`afty-producao.js`), equipamento inicial e conjunto de missão.
2. **Derive e sessão:** chamar `fichaComItensDaSessao` antes de derivar nas três telas; somar
   `focosDeProducoes` ao orçamento de Focos; ler `escudoSuspenso` na RD do escudo; a linha de
   ataque do escudo (`danoDoEscudoAtacando`); a mão livre do Intangível; o traço dos óleos no
   dano (`tracosTemporariosDasArmas`); trocar o botão de cura dos Símbolos e do Laço no card
   de Cura (`afty-cura.js`) pelo `usaItem`, para não haver dois caminhos.
3. **G00:** classificar os 9 módulos novos em `revisao-automacao/escopo.json`. Hoje
   `t-revisao-g00` está vermelho por isso (snippet em `entregas/CX5.md`). Não enfraquecer o assert. Registrar também os 9 asserts em `asserts/LEIA.md`.
4. **CX4 (sem entrega):** teto e substituição do PV temporário (Símbolo de Vida Absoluta). Os
   efeitos dos Níveis de Exaustão foram feitos em 2026-11-09 (ver "LEITURAS ADOTADAS: o que um Nível de Exaustão FAZ").
5. **Primacial:** o "desde que já seja treinado" só enxerga treino marcado na ficha ou dado pela Magistral, não o de Talento
   (provado com Tempestade de Ideias) nem, talvez, o de Classe. Fechar exige `resolveTestes` ou o derive.
6. **CX6:** efeito de item e de encantamento em OUTRA ficha (Bloqueador, Expansão de Escudo,
   veneno por Pacote). `aplicaVenenoNoAlvo` já recebe a sessão do alvo.
7. **Ferramenta Amaldiçoada (p.153):** o processo de duas rolagens com limite de falhas antes
   de quebrar segue sem procedimento de produção.

**Decisões do autor (CX5), 2026-11-06:** as 14 perguntas do lote foram respondidas, e a tabela completa está em `entregas/CX5.md`.
Já implementadas: consumível conta no conjunto de missão (kit não), Mestre da Criação com 2 testes a mais por foco, Exaustão automática da
Mistura Profana, todos os graus de Invocação para quem não é Controlador, vestígios por via, Adaptação sem recusa por pré-requisito,
`+Grau` de item de Feitiço como Ferramenta de Quarto Grau para cima, escudo com o maior nível, Impulso com a CD da ficha, Escaldante com
Fortitude, Laço da Vida zerando falhas e saldo, prazo manual para Debilitante e Injeção Estimulante, kit no conjunto, equipamento inicial
só no Personagem. **Decidido e ainda não implementado:** a Primacial conta todo treino, inclusive o de Talento e de Classe (exige
`resolveTestes` ou o derive, item 5 acima). Itens de Custo `implementado: false` continuam para depois. A Ferramenta Amaldiçoada (p.153)
fica para um lote seguinte.

Continuam sem resposta, e nenhuma foi decidida por CX5, as perguntas antigas de Intermediário na carga,
Grau do Player, Modular múltiplo e tipo de descanso do Ferreiro (`limiteDeMelhoriasDoFerreiro` recebe o
tipo de descanso como parâmetro).

**Integração de rerrolagens com consequências, CX3/CL1/CL2 (2026-11-06):**
Conceder Outra Chance não gasta ação, por decisão do autor de 06/11. Sorte,
Indomável e a rerrolagem do aliado precisam de uma escolha antes de os testes
de Morte, Ferida Interna, Alma e concentração aplicarem suas consequências.
Hoje os verbos desses núcleos rolam e resolvem na mesma chamada. Os clientes
de conteúdo não devem reescrever o dado depois mantendo uma consequência antiga
ou desfazê-la com outro cálculo. Falta essa etapa de escolha nos percursos
automáticos, preservando os usos e a identidade da operação.

**CX2: ajuste de Foco entregue após resposta do autor, 2026-11-01.**
Reservas novamente liberadas. Evidência do complemento em `entregas/CX2.md`.
Decisões recebidas: um dado no total, em um efeito/disparo escolhido, e Foco como
parte da criação em Dano na Alma, com benefício integral. Substituem a interpretação
anterior de Foco por disparo. Outros efeitos da p.215 conservam seu comportamento.

**Pendências específicas de CX2, implementação parcial:**

1. **Integração geral em CX4/CX6:** teto, substituição e expiração de PE temporário
   de Devorador/Expansão, Herança nos demais percursos de cura e dados extras do
   Físico Abençoado no descanso curto. Preservar a decisão vigente de descanso
   único e o escritor de temporários existente. As operações específicas já funcionam.
2. **Kamo:** rerrolagem permanece vinculada à decisão central de PV rolado,
   sem mudar a progressão fixa e sem nova pergunta duplicada.
3. **Addon Era de Ouro:** integrar Braços Extras ao gatilho já aprovado, mantendo
   o conteúdo do pacote. Detalhes na entrada específica do addon abaixo. As 15
   Anatomias nativas não substituem as Características Amaldiçoadas do suplemento.

Decisão encerrada: Alma Maldita e Energia Antinatural básica recarregam por **Novo
Dia manual**, separado de Descansar. Expansão de Reserva usa descanso longo.
Mutante está cancelado em definitivo, sem dependência de interface.
Decisões de Foco respondidas em 01/11 e implementadas: um dado no total em um
destino escolhido, com seleção persistida e aplicação na rolagem real. Em Dano
na Alma, Foco integra a criação e vale inteiro. Não restam perguntas de Foco.

- Antes de editar, registrar nesta entrada o lote em andamento e os arquivos reservados. Arquivos centrais e
  documentação têm um editor por vez. Não editar o mesmo arquivo simultaneamente, mesmo em regiões diferentes.
- Claude concentra os núcleos em módulos próprios quando adequado e documenta entradas, saídas, estados salvos,
  recusas e pontos de ligação. Codex coordena a maior parte da integração nos arquivos centrais e nas telas.
- Preservar trabalho local e compatibilidade de fichas antigas. Nenhum commit, push ou promoção do G2 está incluído.
- Dúvidas de regra entram na pendência específica já existente. Mantêm-se as decisões atuais sobre CD separada,
  descanso único, PV fixo/rolado, gastos manuais, acúmulo, Golpe/Sangramento, Dano Passivo, PE máximo de Shikigami,
  Grau/carga e as perguntas de Domínios, Técnicas Marciais, Pacotes e Linhas de Treinamento.
- O bloqueio de uma dessas decisões não bloqueia o restante do lote. Texto já localizado no livro não precisa
  ser solicitado novamente. Repartir trabalho não altera as regras nem concede exceção a AGENTS.md.
- Ao encerrar um lote, retirar a linha da fila ativa e registrar o ID, a entrega e a validação em `afty-status.md`.
  A divisão vigente fica somente aqui, os relatórios continuam como referência.

#### Correspondência com a divisão anterior

Este mapa conserva o escopo, sem manter os 31 lotes antigos como tarefas ativas.

| Lote atual | Absorve os lotes anteriores |
|---|---|
| CX1 | CO01 a CO06 |
| CX2 | CO07 a CO11 |
| CX3 | CO12 a CO14 e CO21 |
| CX4 | CO15 e CO16 |
| CX5 | CO17 a CO20 |
| CX6 | CO22 a CO24 |
| CL1 | CL01 e CL02 |
| CL2 | CL03 e CL04 |
| CL3 | CL05, CL06 e CL07 |

## Pacote composto privado da mesa: pendências (2026-11-01)

O pacote da mesa do autor é composto e PRIVADO: não está no app nem no repositório, é instalado por JSON em
`addons/privado/` (fora do git). O mecanismo está em `docs/afty-addons.md` e o conteúdo, as decisões e as medições em
um documento `docs/*.private.md` do pacote, que também fica fora do git.

- **Decidido pelo autor em 2026-11-01:** a maestria acima do 36 fica GLOBAL (toda ficha com ND 41 ou mais muda, tenha o
  pacote ou não), e a versão 1.0.0, que esteve pública desde o commit `d6d6dd7`, fica no histórico do git como está.
  Não reabrir nenhum dos dois.
- **Depois do deploy, colar o JSON na produção.** Sem isso as fichas que já tinham o pacote ligado ficam congeladas na
  cópia antiga (e com um pacote antigo de PV ao lado, o PV dobra).
- **Pacotes antigos.** Os 16 arquivos seguem em `addons/` porque fichas que não ligaram o composto ainda os usam e os
  asserts testam a mecânica deles. Apagar só depois que todas as fichas da mesa tiverem o composto ligado.
---

## Ficha Final: avaliação da Mesa e autorização para integrar as três abas do G2

**Redesenho do cabeçalho e de Perícias do G2 aplicado na prévia em 07/11, aguardando avaliação visual do autor.**
Relatório em `.audit/redesenho-g2-20261107/RELATORIO.md`. Para avaliar: retrato de 112 px (a clássica usa 216 px), botão dos Livros
sobre os botões de rolagem na borda direita, valores do cabeçalho com "+N" entre 721 e 1119 px, Crít 20 oculto nas Resistências.
Arquivos tocados: `ficha/efeitos/CabecalhoG2.jsx`, `ficha/efeitos/efeitos-g2.css` (só placa, retrato, recursos e quebras), `ficha/abas-g2/PericiasG2.jsx`,
`ficha/abas-g2/abas-g2.css` (só Outros e Perícias), `ficha/AftyFichaG2.jsx` (prop `abaInicial`), `asserts/t-abas-g2-previa.mjs` e o executor da prévia.
Alter Lucielos no telefone corta cerca de 7 px do medidor de Preparo, tema pede a própria passada no G2.
Integração nas rotas normais, promoção e publicação continuam dependendo de autorização própria.

**CSS/editor autorizados e entregues em 06/11.** Cascata das superfícies G2,
contrato semântico, fontes/cantos, legibilidade, teclado/foco, reset com
Restaurar, salvamento ao sair/recarregar e Alter responsivo corrigidos.
Guia em `afty-ficha-final.md`, provas em
`.audit/correcao-css-g2-20261106/RELATORIO.md`. Integração, promoção e publicação
continuam dependendo de autorização própria. Barra antiga preservada em 9/10.

**Revisão do Claude entregue em 05/11** (relatório
C:/Projetos/Grimorio/REVISAO-CLAUDE-G2-CSS-PERSONALIZADO-20261105.md, evidências em
.audit/revisao-claude-g2-css-20261105/). Não é autorização de publicação, nem
certificação das frentes de regras parciais, nem aceite visual. Pendências que
saíram dela, todas com prova no relatório:

- **Publicação:** fechamento recalculado em 06/11: 32 arquivos novos de `src/`,
  26 exigidos por imports e 6 sem importador. O hook `usar-gravacao-tema.js`
  integra os 26 obrigatórios. Recalcular perto do commit humano. Script e JSON
  em `.audit/correcao-css-g2-20261106/`.
- **Ligação das novidades ao G2:** com as três abas, a aba Ações já monta `PainelConteudo`
  (CL1 e CX3). `efeitos/operacoes-uso.js` (CL1, camada da mesa) está pronto e sem
  chamador, o aviso de vida do CL2 e o `PainelOrigens` do CX2 não existem no G2. Votos,
  Domínios, Dados de Vida e uso de invocação (CL3 e CL2) estão sem tela também na
  clássica. A ligação pede fonte compartilhada, não ordem de telas. CX4 a CX6 sem entrega publicada.

**Retomada em 05/11:** 52 asserts e build isolado novamente aprovados.
Prévia da 5330 reativada, sem integrar. Avaliação visual e autorização própria
continuam pendentes. Conferir integração na base atual, que recebeu outras
operações desde outubro. Registro em .audit/retomada-g2-20261105/RETOMADA.md.

Prévia isolada e os dois ajustes do aceite reconferidos pelo Codex em 22/10.
Retoque posterior das bordas concluído na prévia, registro em
.audit/ajuste-bordas-abas-g2-20261022/RELATORIO.md.
O autor pediu repensar o refinamento visual de Agora na Mesa. Nova composição
como seção única aplicada e conferida em 23/10, aguardando avaliação visual
do autor. Registro atual em .audit/mesa-unificada-g2-20261022/RELATORIO.md.
Não repetir a construção ou reconferência encerrada. Restante já aprovado.
Próxima etapa: autorização própria do autor para integrar Ações, Perícias e
Equipamentos nas rotas normais, seguida de verificação no destino real.
A autorização ainda não foi concedida. Não ligar a prop no App por conta própria.
Parecer e limites: C:/Projetos/Grimorio/REVISAO-AJUSTES-PREVIA-TRES-ABAS-20261022.md.
Prévia: http://127.0.0.1:5330/. Barra antiga 9/10 preservada.

## Ficha Final: integração e desempenho

### Pacotes para Aliados: revisão, aceite e o que ficou de fora
**Onde:** `ficha/pacotes-aliados.js`, `ficha/pacotes-familias.js`,
`ficha/ficha-recebidos.js`, `ficha/efeitos/ParaAliadosG2.jsx` e
`ficha/efeitos/RecebidosG2.jsx`.
**Situação:** implementado na prévia do G2. Revisão técnica das correções
PA-I1 a PA-I4 concluída pelo Codex em 20/10/2026, sem novo bloqueio identificado
na última correção. 750 asserts focados, 98 conferências de interface em
1024/1440 (22 dev, 76 produção), lint/build passando. Relatório atual:
`.audit/revisao-codex-pai4-20261020/REVISAO-CODEX.md`.
Os quatro defeitos saíram da fila de correções. Não refazer o lote.
**Precisa:** teste real do autor, com pacote exportado pelo suporte e importado
no aliado, ativação/desativação, rodadas e recarga. Confirmar as sete leituras
em PERGUNTAS AO AUTOR, sem tratá-las como aprovadas pela revisão técnica.
A decisão de cada benefício no próprio prazo já foi dada, antiga pergunta 8
resolvida. Clássica permanece padrão, G2 prévia.
**Cobertura separada:** ficam SÓ COMO CONSULTA (número mostrado, sem mudar a
ficha do aliado) os dados de dano de Feitiço Auxiliar, Comando Motivador,
Guarda Sincronizada, Inspirar Aliados, Elevar Sucesso, Motivação pelo Triunfo,
Apoio Focado e o bônus de Aptidão estendido do Estilo. PV Temporário concedido
por pacote não existe ainda. Matriz e limites nos relatórios da entrega.
**Compatibilidade:** arquivo e instância antigos não são reescritos. Para
instância antiga sem contador herdado, encerrar e reativar. Reexportar/importar
quando a biblioteca ainda tem o prazo anterior às correções.
**Anotado:** 2026-10-19, pedido do autor depois da revisão técnica da integração.
Escopo adicional, não reabre os nove marcos técnicos anteriores do G2.

### Concluir e revisar o G2 antes de torná-lo padrão
**Onde:** `src/systems/afty/ficha/AftyFichaG2.jsx` e `ficha/efeitos/`
**Teste real (2026-10-21):** cabeçalho e corpo alinhados num contêiner comum
em Quad HD, com largura maior em telas grandes. Clique fora do detalhe na
completa fecha só a leitura. Compacta e consulta cabem no telefone. Correções
implementadas e verificadas pelo Codex, sem nova pendência de código neste
ajuste. 20 checks de interação, 17 medições de layout e 196 asserts focados
aprovados, lint/build limpos. Evidências em
`.audit/ajustes-teste-real-g2-20261021/`. Falta o autor atualizar a 5173 e
continuar seu teste visual e de sessão. Não declarar o marco 10.
**Situação:** integração preservada na prévia `?ficha-g2=1`. Por pedido
do autor, a ficha anterior é o padrão diário em Afty e Player desde 17/10/2026.
**Precisa:** teste final e aceite do autor, mais revalidação após eventual
integração do remoto antes de promover o rework. Retomada e progresso em
`C:/Projetos/Grimorio/RETOMADA-CLAUDE-FICHA-FINAL.md` e
`C:/Projetos/Grimorio/PROGRESSO-FICHA-FINAL.md`. Preservar a abertura clássica
durante esse trabalho.
**Anotado:** 2026-10-17, restauração do uso diário solicitada pelo autor
**Nota (2026-10-19):** integração feita (marcos 7 e 8). Seguem em aberto, sem
autodeclarar: revisão independente (9) e teste do autor (10).
**Revisão Codex (2026-10-19):** marco 7 entregue tecnicamente em prévia.
Marco 8 devolvido por G2-I1, marco 9 aguarda correção e conferência. Clássica
continua padrão. Em 42 operações atuais medidas não houve pausa de dois
segundos, com tarefas de 57 a 80 ms em alguns casos. Não declarar ausência
universal de tarefa longa nem aceite do autor. Evidências na pasta acima.
**Nota (2026-10-19, noite):** G2-I1 corrigido e saído da fila (módulo
`ficha/ficha-recebidos.js`, 47 de 47 no navegador, 52 asserts novos). Falta o
Codex reconferir o marco 8 e decidir o 9. O corte das fatias agora é previsivo
(`ficha/fatias.js`). Com dois registros de Catálogo fica uma tarefa de cerca de
54 ms, que é o derive síncrono do número pintado. O Encontro com Fonte Externa só
foi provado na função, sem caminho de interface.

**Reconferência Codex (2026-10-19):** G2-I1 encerrado. Marcos 8 e 9 concluídos
na base local, marco 10 aguarda o autor. São 36 conferências próprias de
interface, 303 asserts focados e 21 das funções do Encontro passando.
Relatório em `.audit/revisao-codex-g2-i1-20261019/REVISAO-CODEX.md`. O teste
real e a revalidação após integrar o remoto continuam antes da promoção.

### Fechamento funcional do G2: teste e aceite do autor
**Onde:** `ficha/AftyFichaG2.jsx`, `ficha/efeitos/` (módulos novos
`imitacao-logica.js`, `concedido-logica.js`, `buff-mesa-logica.js`,
`exaustao-logica.js` e os componentes `ImitacaoG2`, `ConcedidoG2`,
`BuffDeMesaG2`, `ExaustaoG2`)
**Situação:** implementado e verificado por Claude em 2026-10-20. Imitação,
Concedido pelo Mestre, Exaustão desde zero, Sangramento e buff de mesa rodam
no G2 (completa e compacta onde há ação), sem a Apresentação Anterior, que
fica no menu só como comparação. A pergunta de cobertura foi resolvida pelo
autor e a pendência técnica de implementação saiu da fila. Em Combate legível
no Minamoto, cabeçalho mais baixo em largura estreita e catálogo sem estouro
em 390 px entraram no mesmo lote. 124 asserts novos (`t-fechamento-g2`),
986 focados, suíte completa 224 de 226 (só as duas históricas), 387
conferências de interface por ambiente em produção e dev. Relatório:
`.audit/fechamento-funcional-g2-20261020/RELATORIO.md`.
**Revisão Codex (2026-10-20):** aprovada na base local, sem novo bloqueio
identificado. 986 asserts focados, 499 checks de interface executados,
495 efetivos após descartar quatro tautológicos, todos aprovados. Suíte
completa 224/226 com as duas falhas históricas, lint/build passando.
Relatório em `.audit/revisao-codex-fechamento-g2-20261020/REVISAO-CODEX.md`.
A revisão independente saiu da fila.
**Precisa:** teste real e aceite visual do autor (roteiro de cinco tarefas
no relatório da entrega). Não declarar o marco 10. A clássica continua
padrão e o G2 segue prévia. Revalidar após eventual integração do remoto.
**Teste em sessão (2026-10-20):** o autor pediu o endereço habitual com suas
fichas normais. A prévia local em http://localhost:5173/Player e /Afty agora
acrescenta ficha-g2=1 automaticamente. ?ficha-g2=0 mantém a clássica. O
direcionamento é só do servidor local de teste, sem mudar produto/build.
Abrir no navegador/perfil habitual e atualizar a página para usar os dados
locais existentes. O interno do Codex tem armazenamento separado. Nove
verificações HTTP aprovadas, evidências em .audit/teste-real-localhost-20261020/.
Nenhuma migração, importação de amostras ou alteração de fichas foi feita.
**Limites conhecidos:** (a penalidade de cada nível de Exaustão passou a existir em 2026-11-09). Condição Sangramento sem faixa gravada não
ganha o botão de perda, como na tela anterior. A cópia da Imitação sai da
lista de candidatas enquanto está ativa. O "+" inicial do valor de um buff de
mesa é descartado (o DSL não o aceita).
**Integração:** `origin/main` está 6 commits à frente e toca os mesmos
`asserts/LEIA.md`, `docs/a-fazer.md`, `docs/afty-status.md` e
`docs/revisao-automacao/escopo.json`. Nada foi integrado. O código novo lê
`CanalPicker.jsx`, `ficha-sessao.js` e `afty-derive.js`, que o remoto altera:
depois de integrar, rodar `t-fechamento-g2` e o roteiro de interface de novo.
**Anotado:** 2026-10-19, implementado em 2026-10-20

### Conflito com o remoto antes de promover o G2
**Onde:** AftyFicha.jsx, ficha-sessao.js, AbaAcoes, AbaInvocacoes,
PainelDeCombatente, afty-derive
**Situação:** o remoto está 5 commits à frente e sobrepõe esses arquivos.
Nenhum merge foi feito. ficha-especializacoes.js não é rastreado.
**Nota Codex (2026-10-19):** referências locais agora indicam seis commits
à frente, não cinco. A consulta atual ao GitHub falhou. Nenhum merge feito.
**Precisa:** integrar o remoto por quem commita, conferindo o seletor de
AftyFicha.jsx e a relação de arquivos que seguem juntos.
**Anotado:** 2026-10-19

### Polimento do G2
**Onde:** `efeitos/efeitos-g2.css`
**Situação:** feito e reconferido em 2026-10-20 no fechamento funcional,
à espera do teste visual do autor. Em Combate ligado lê pelo texto do tema (contraste 1,21
para 6,59 no Minamoto, 11,5 ou mais nos presets). Cabeçalho grudado em 390 px
de 481 para 407 px, em 768 px de 342 para 300. Catálogo e detalhe do Ativo sem
estouro em 390 px, medidos pelo contêiner. Tudo escopado em `.e-g2`.
**Precisa:** olhar do autor em tela real. O cabeçalho em 390 px ainda ocupa
48% da altura de 844 px (o resto é identidade, quatro recursos, valores,
Agora, abas e barra de dados, todos mantidos), e a trilha de 72 px do botão dos
Livros continua reservada à direita, como o autor decidiu antes.
**Anotado:** 2026-10-19

### Eliminar as travadas ao ativar efeitos antes de lançar o G2
**Onde:** Ficha Final clássica, `AftyFichaG2.jsx` e módulos compartilhados
**Situação:** autor relata congelamentos de aproximadamente dois segundos
a cada efeito ativado no G2. O problema também aparece na ficha anterior,
com menor intensidade. A restauração visual não resolve essa causa.
**Precisa:** reproduzir com fichas isoladas, medir interação até atualização
visível em ambas as apresentações, localizar o custo por perfil de execução
e corrigir a causa. Comparar antes/depois, incluindo uso rápido em sequência,
ficha densa, custos, valores derivados e persistência. Não mascarar com atraso
na confirmação nem liberar o G2 antes da correção e revisão independente.
**Anotado:** 2026-10-17, bloqueio de lançamento relatado pelo autor
**Nota (2026-10-19):** causa medida e corrigida (derive guardado e geradores
fatiados), sem tarefa longa nas duas apresentações. Falta o autor confirmar no
uso real com a ficha densa antes de apagar esta entrada. Números em
`docs/afty-ficha-final.md`.

**Reconferência Codex (2026-10-19):** a frase anterior sobre ausência de
tarefa longa não vale para a amostra independente. Em 26 operações com Fonte
Externa não houve pausa de dois segundos nem perda de ativação, mas houve
tarefas de até 94 ms em dev e 72 ms em produção. Confirmações G2 em produção
pintaram em 29 a 43 ms após pointerdown e dois quadros. A amostra usa fichas
densas, Feitiço recebido e dois registros de Catálogo. A revisão técnica foi
aprovada com esses limites, o teste real do autor continua pendente.

## Como usar

1. **Toda pendência nasce aqui.** Não abra `// TODO` no código sem deixar a linha correspondente
   neste arquivo. O comentário no código envelhece escondido, este arquivo não.
2. **Uma pendência = uma entrada** com o cabeçalho abaixo. Se você não consegue preencher o
   **Precisa**, o que você tem é uma dúvida, e ela vai para `PERGUNTAS AO AUTOR`.
3. **Ao resolver, APAGUE a entrada** e escreva o que foi feito na sessão do dia em
   `afty-status.md` (ou no doc do sistema correspondente). Este arquivo é uma fila, não um
   histórico: se ele virar log, ninguém lê até o fim.
4. **Não reescreva a entrada de outra pessoa.** Acrescente uma linha `**Nota:**` embaixo.
5. `afty-status.md` continua sendo o **log de sessões** e a explicação de por que as coisas são
   como são. Ele não é a fila de trabalho.

### Formato de uma entrada

```
### Título curto, no imperativo ou descrevendo o buraco
**Onde:** caminho/do/arquivo.js (ou o sistema, se for espalhado)
**Situação:** o que existe hoje, e por que não basta
**Precisa:** o que fazer, concreto
**Anotado:** AAAA-MM-DD, por quem / em que contexto
```

---

## PERGUNTAS AO AUTOR

### Vespa Crabro: definir o bônus futuro do Novo Estilo das Sombras
**Onde:** `addons/vespa-crabro.json`, `docs/afty-vespa-crabro.md`.
**Situação:** pacote 1.1.0 tem treino, duas armas, duas manobras, oito
modelos nativos e ressonância por alvo com números aprovados pelo autor.
Shin é ativável manualmente, separado do Estilo e da Sanidade.
**Precisa:** confirmar qual valor recebe até metade de BT e qual condição
ativa esse bônus na futura adaptação ao Novo Estilo das Sombras.
**Anotado:** 2026-10-25, ampliação do addon do Vespa.

### Camellya: validar a fonte e o equilíbrio das regras propostas
**Onde:** `docs/afty-camellya.md`, documento Camellya enviado em 2026-10-21.
**Situação:** addon 1.2.0 usa categorias nativas, por pedido do autor em
2026-10-22. Perfil com só o Funcionamento Básico e oito modelos em Feitiços.
Custos, danos e bônus seguem as tabelas atuais. Chicote nível 5 custa 20 PE,
Vinha nível 0 é gratuita e Germinação passou ao nível 3 para poder aplicar a
condição forte Imóvel. A fonte Markdown obrigatória está ausente no caminho.
**Precisa:** conferir a fonte oficial antes de aprovar legalidade, dano,
exaustão e acumulação de RD. Sementes por alvo, duração, sustentação, limite
por combate, RD de evento e gatilho do adicional são manuais, no guia.
**Anotado:** 2026-10-21, entrega inicial de Camellya.

### Reconciliar o inventário do pacote privado de Oda Nobunaga
**Onde:** `addons/oda-nobunaga.private.json`, `docs/revisao-automacao/`
**Situação:** a coleta encontra 267 chaves preexistentes desse pacote sem
registro no inventário e no mapa de fontes. Em 2026-10-16, após registrar
as 31 chaves de Tauropolos, t-reconciliacao-g00 continua falhando na comparação
13.606 fontes contra 13.873 itens vivos. Os outros 203 arquivos passaram.
**Precisa:** definir o proprietário e reconciliar o pacote privado no escopo
da sua entrega, preservando a fonte e sem aprovar regra automaticamente.
**Anotado:** 2026-10-16, validação do addon de Tauropolos.
**Nota 2026-10-17:** após integrar a main d4a0ed2 e renumerar Tauropolos
para AD-72, a mesma diferença de 267 chaves permanece: 13.762 fontes para
14.029 itens vivos. O inventário novo e os registros remotos foram preservados.
**Nota 2026-10-21:** após registrar as 42 chaves de Camellya em AD-73,
continuam faltando as mesmas 267 identidades: 13.804 fontes para 14.071 itens
vivos. Os outros 207 arquivos da suíte passaram.
**Nota 2026-10-22:** reorganização de Camellya 1.1.0 preservou a diferença de
267 entradas, com 13.803 fontes para 14.070 itens vivos. A única falha na suíte
continua sendo t-reconciliacao-g00, os demais 207 arquivos passaram.
**Nota Camellya 1.2.0:** adaptação às categorias nativas preservou a diferença
anterior de 267 identidades: 13.792 fontes para 14.059 itens vivos. Suíte com
207 de 208 arquivos aprovados, restando apenas t-reconciliacao-g00.
**Nota 2026-10-25:** addon do Vespa registrado em AD-74 com 41 adições.
Diferença anterior de Oda preservada: 13.833 fontes para 14.100 itens vivos.
Suíte com 208 de 209 arquivos aprovados, mesma falha em t-reconciliacao-g00.
**Nota Vespa 1.1.0:** permanecem as mesmas 267 identidades de Oda,
13.879 fontes para 14.146 itens vivos. A lista esperada de primitivas foi
atualizada e passou na rechecagem, restando a falha anterior de reconciliação.

### Aliados, Comidas e Ferreiro: o que a conferência de 2026-10-26 deixou aberto
**Onde:** `afty-extras-nativos.js`, `afty-equipamentos.js` (`grauFeiticeiro`) e `afty-feiticos.js`.
1. **Elementalista.** FEITO em 2026-10-27 junto das Técnicas Marciais: o dado saiu das linhas de arma e entra só no
   primeiro ataque da Técnica e na primeira rolagem do Feitiço de Dano (`docs/afty-tecnicas-marciais.md`, seção 7).
2. **Grau do feiticeiro do Player.** O livro (p.45) dá como referência nível 1 a 4 Quarto, 5 a 7 Terceiro, 8 a 13
   Segundo e 14 a 18 Primeiro, e diz que não é regra. O Afty usa a escala da criatura (5, 9, 13 e 17, decisão de
   2026-08-19) também no Player. O teto de aliados sai dela: nos níveis 13, 17 e 18 o Player tem um aliado a mais que
   pela referência do livro. Vale a escala da criatura, ou o Player ganha a do livro?
3. **Ferreiro, quantidade de equipamentos.** O livro limita a BT/2 equipamentos no descanso curto e a BT no longo. A
   bancada só tem `maxSelecionados: 2` (arma e escudo) e o limite mora no hover. Vale um contador que aplique o teto
   pelo tipo de descanso?
4. **Seletor de Aliados cheio.** Clicar num aliado a mais quando o teto do grau já foi atingido não faz nada e não
   avisa, porque o botão não fica desabilitado. Vale desabilitar ou avisar?
5. **Combatente e Disparador com Ataque Amaldiçoado.** O escopo usa o tipo de ataque da linha (`atq:corpo` e
   `atq:distancia`). Uma arma rolada como Ataque Amaldiçoado não recebe nenhum dos dois dados. Confere, ou o
   Amaldiçoado conta como corpo a corpo?
**Anotado:** 2026-10-26.

### Pacotes para Aliados: leituras feitas no lote, para confirmar
**Onde:** `ficha/pacotes-familias.js` e `ficha/pacotes-aliados.js`
**Situação:** o lote seguiu o texto onde ele fecha a conta, e nestes pontos
escolheu a leitura abaixo, reversível, sem inventar número:
1. Feitiço Permutativo em aliado NÃO vai no pacote: o livro não diz em quem a
   perda cai quando o alvo é outro. Vale mandar o ganho e a perda para o aliado?
2. Aura do Comandante: "dentro do combate" vale no dano e nas perícias, e o +2 da
   Evoluída em ataque e TR vale sem essa condição. Confere?
3. Presença Inspiradora: "uma quantidade de PE adicional igual a metade do seu
   modificador de Presença" virou um teto, com o suporte escolhendo de 0 até ele.
   Ou é sempre o valor inteiro?
4. Apoio Defensivo ("até o começo do próximo turno") virou uma rodada contada.
5. O descanso encerra toda instância recebida que não é permanente, inclusive
   Bastião e auras (posição da cena). Táticas Defensivas e Pronto para Agir ficam.
6. Pronto para Agir do próprio aliado e o recebido são a MESMA habilidade (regra
   do catálogo): só o que passa do próprio soma.
7. Discurso Motivador (Talento) ficou fora: "o dobro do seu nível + seu
   modificador de Presença multiplicado pela metade do seu bônus de treinamento,
   arredondado para cima" tem mais de uma leitura de precedência.
**Anotado:** 2026-10-19, lote dos Pacotes para Aliados.

**Decisão já tomada (20/10):** a antiga pergunta 8, sobre Múltiplos Efeitos
com prazos mistos, foi respondida: cada benefício termina no próprio prazo.
Ela saiu das perguntas abertas. PA-I3 e PA-I4 foram implementados e
reconferidos pelo Codex em 20/10. As correções técnicas estão encerradas,
com teste real do autor ainda pendente.
A equivalência entre próximo turno do emissor e rodada do receptor (item 4)
continua sem decisão. As outras sete leituras não foram aprovadas por esta
resposta nem pelo encerramento técnico de PA-I1 a PA-I4.

### Revisão de 2026-10-07: nove leituras de regra do bloco G00 a CMB-02
**Chave:** BLOCO-2026-10-07-perguntas
**Onde:** `docs/revisao-automacao/<lote>/revisao.md` de cada lote citado
**Situação:** a revisão do bloco corrigiu o que tinha regra fechada. Estas ficaram paradas, sem leitura presumida, e o código continua como estava em cada uma:
1. **P01, multiclasse na criatura.** Livro, página 47: "você deve atender os requisitos para Multiclasse especificados nas características da outra especialização". Desde 2026-10-07 isso vale na ficha de jogador (divergência `requisitoMulticlasse`). Na criatura do mestre a multiclasse já segue outra régua (ND, terceira classe no 31). Vale lá também? Se sim, a divergência some e o Afty passa a travar e avisar igual.
2. **P01, PV por rolagem.** Página 46: ao subir de nível o PV pode ser a rolagem do dado de vida ou o valor fixo. O catálogo declara `pvDado` e só o valor fixo é usado. A ficha deve oferecer a rolagem (guardando o resultado de cada nível), ou o fixo é a regra da mesa?
3. **M03, Armas Absolutas.** Página 61: 2 PE para os bônus por uma rodada, e mais 2 PE por rodada para manter, senão encerram. A regra vigente é "custoPE de estado só é exibido, sem cobrança automática" (só o Invencível sob o Sol cobra). Cobrar e expirar automaticamente como o Invencível, ou exibir o custo e deixar a manutenção com a pessoa (marcando "PE Não Descontado")?
4. **M02, Funcionamento global e Funcionamento por arma.** Um Funcionamento com `danoBonus` sem alvo (+3) e outro mirando uma arma (+5) dão +8 naquela arma: a disputa do pool é por alvo LITERAL, e o global não briga com o direcionado. Somam (como hoje) ou vale o maior?
5. **CMB-01, Estilo do Protetor.** Página 64: a reação impõe desvantagem a quem ataca aliado a 1,5 m, e "além disso" você concede vantagem no TR de aliado a 1,5 m. O segundo benefício também consome a reação?
6. **CMB-01, Adepto de Combate com Estilos diferentes.** Página 166: o Adepto "considera seu Nível de Personagem para os efeitos" do Estilo que ele ensina. Hoje todo Estilo escala por `max(esc_combatente, nd * tem_tal_adepto_de_combate)`, então um Combatente 4 / Lutador 12 com Defensivo pelo Repertório e Massivo pelo Adepto ganha o ND também no Defensivo (+6 em vez de +4). O nível de personagem vale só para o Estilo do Adepto?
7. **CMB-02, Golpe Especial em Feitiço.** Página 65: "Quando realizar um ataque, ou arte do combate que envolva um ataque". O Golpe vale em Feitiço com jogada de ataque e na jogada Amaldiçoada, ou só em arma e Ataque Básico? Hoje Atroz e Penetrante valem em arma, Básico e Feitiço com ataque (o Feitiço de TR saiu, porque lá não há ataque em leitura nenhuma), Desfocado vale em toda jogada de ataque e o Preciso só na arma e no Básico.
8. **CMB-02, Sanguinário.** Página 65 fala em sangramento "leve" e "médio"; a tabela da página 211 usa Fraco, Médio, Forte e Extremo. O leve é o Fraco (2d6)? Sem isso a condição não pode ser aplicada pelo montador.
9. **M03, Condenado no Ápice.** Ver a nota de 2026-10-07 na entrada "Condições: leituras para confirmar" (item 6).
**Precisa:** a resposta de cada item. As do Golpe (7 e 8) e a do Protetor (5) destravam consequências que já têm desenho na seção da campanha, mais abaixo.
**Anotado:** 2026-10-07, revisão do bloco G00, M01 a M05, P01, CMB-01 e CMB-02

### Conciliar aprovação inicial e evolução do arsenal de Ryuma
**Onde:** `docs/arsenal-ryuma-aprovacao-inicial.md`, `addons/arsenal-de-ryuma.json`
**Situação:** nova fonte inicial tem Murasama +2 Percepção situacional em
vez de BT e Yagen penalidade -6 em vez de 0. Murasama tem crítico 19 na
fonte, cadastro usa base 20 com Certeira para resultado 19. Dano cadastrado
2d10 já inclui Potente, conforme resposta anterior. Corrente está ausente.
**Precisa:** esclarecer se crítico 19 e dano 2d10 iniciais são bases ou
totais com encantamentos, pergunta enviada. Confirmar equivalência de Peso
para espaços (Yagen Peso 1, Corrente Peso 0,5), preservando aprovações
posteriores de Grau Especial. Revisão não alterou ficha nem addon.
**Anotado:** 2026-10-08, aprovação inicial encontrada após a integração.
**Nota:** autor confirmou ausência de Manejo Especial. Não é mais campo
pendente, não conceder a habilidade automaticamente. Export foi verificado
sem a habilidade, sem treino `manejo_arma` e sem vaga adicional de treino.
Novas perguntas enviadas: correções de +2 Percepção e -6 penalidade/carga 1,
base versus total do crítico, e desbloqueio do próximo encantamento pelo
Treino de Manejo de Arma completo daquela arma. Remoto igual ao HEAD,
publicação condicionada a resolver diferenças de regra.

### Definir regras ausentes das habilidades especiais do arsenal de Ryuma
**Onde:** `addons/arsenal-de-ryuma.json`, `docs/arsenal-ryuma-relatorio.md`
**Situação:** oito itens cadastrados, export atualizado e passivas definidas
automatizadas. Procedimentos que dependem da mesa têm texto integral, sem
automação fictícia ou consumo automático. Cadastro e valores confirmados
foram concluídos, não são mais perguntas abertas.
**Precisa:** definir dados ausentes de Fatal/Mortal/Versátil, tipos físicos
e alcances ausentes. Confirmar conversão PE/acúmulos, dado liberado,
arredondamentos e destruição de arma da Dragon Bone. Definir cargas e
substituição de custo de Perceber o Ar no Impulso personalizado. Definir
duração do modo Radiante e níveis/acúmulo de Ler Intenções. Pulo não possui
canal de cálculo. Manter esses pontos descritivos até confirmação.
Dragon Bone tem cinco encantamentos confirmados para quatro vagas normais,
mantidos com aviso. Falta informar o grau de Destruidora ou origem da vaga.
Material Pesado tem requisito de revestimento Médio/Robusto por ID, sem
equivalência definida para Lobo Saltitante. Não concede Fortitude até isso.
**Anotado:** 2026-10-08, limites da automação dos oito equipamentos.

### Demônios Primordiais: o que falta e o que segue de mesa
**Onde:** `addons/demonios-primordiais.json`
**Situação:** o autor enviou a origem, as três Aptidões Demoníacas, os Níveis de Medo (só até o Nível 0) e a Trilha Demônio Primordial. Leituras feitas sem ele:
1. **As Aptidões Demoníacas ficam em Especiais**, presas à origem Demônio Primordial, sem tirar a Energia Reversa (o texto diz "diferente da Energia Reversa", e não que ela some).
2. **"Origem Demônio ou Contrato de Hibridismo"** (pré-requisito da Regeneração Demoníaca): nenhuma das duas existe no app, então só a Demônio Primordial libera a Aptidão.
3. **"+2 Pontos em Todos os Atributos"** é fixo (+2 nos seis, respeitando o limite), e não pontos para distribuir.
4. **"Habilidade de Especialização adicional"** é +1 vaga de Habilidade, e "Aptidão Amaldiçoada adicional" é +1 vaga de Aptidão.
5. **A faixa de PE do Fluxo** vai de 0 a 2 + metade de CL, e o PE não é descontado sozinho (como a Regeneração Corporal).
6. **O Nível de Medo 4 inicial** é o valor padrão do contador, que o criador ajusta de 0 a 5.

Ficaram de mesa: a imunidade a Abalado e Amedrontado e o -2 nos TRs dos hostis, a Reação do Nível II, o TR de Vontade do Nível III, a aura do Nível IV, o TR de Vontade e as penalidades do Nível V, o Ciclo Infernal, a condição Esquecido do Nível 0, a cura maximizada pelo sangue fresco e a Reação do Fluxo Sanguíneo Constante.
**Precisa:** o texto dos Níveis de Medo 1 a 5 (a página do livro parou no Nível 0, e a "Sua Significância" promete benefícios e limitações por nível), outras Trilhas Demoníacas se o autor quiser, e a confirmação de 1 a 6. A revisão G00 (lote de addon) deste pacote ainda não foi aberta.
**Anotado:** 2026-10-31, ao fazer o addon Demônios Primordiais

### Golem de Sangue: leituras para confirmar e o que segue de mesa
**Onde:** `addons/golem-de-sangue.json`
**Situação:** o autor decidiu em 2026-10-15 a Prisão da Besta como Voto automático, o Corpo Morto em
texto e as 5 Especiais de Maldição no lugar da Energia Reversa. Em 2026-10-16 (1.1.0) decidiu o
Frenesi como Feitiço de Transformação ligado no criador, Duradouro, com CADA efeito um nível acima
(podendo passar do acesso), o Hemólito partindo do golpe desarmado da ficha (as Armas Naturais
Aprimoradas da Briar) e a Maldição Carmesim automatizada (PE em PV e os contadores de sessão). Estas
leituras foram feitas sem ele, e estão no número:
1. **"Dano: Desarmado +6 Níveis"** do Hemólito parte do DADO do golpe desarmado (o das Armas
   Naturais Aprimoradas), sem os níveis que miram o Ataque Básico. O "+1 nível de dano nos níveis 8,
   12, 16 e 20" das Aprimoradas fica só no Ataque Básico. Fora do Frenesi a linha mostra só esse dado.
2. **"-2 em testes físicos"** vale nas perícias de Força, Destreza e Constituição. Testes de
   Resistência e ataques ficam de fora.
3. **Bêbada de Sangue** vale em todo acerto e dano com o interruptor "Alvo com Sangue Absorvido".
4. **Desenvolvimento Físico e Carapaça Mutante** seguem o texto da Maldição Era de Ouro (+2 no
   atributo e no limite, +1 no 15 e no 20, e resistência a um tipo físico). O livro não tem o
   Desenvolvimento Físico.
5. **Bônus de Origem** não diz o máximo no mesmo atributo, e ficou 3.
6. **A troca da Energia Reversa vale para a ficha que liga o pacote**, seja qual for a origem, porque
   o campo `substituiEnergiaReversa` é do pacote, e não da origem.
7. **Os pagamentos automáticos seguem olhando o PE**, que é 0 (Técnica Máxima, Invocar, ação de
   addon com `custoPE`). Os Pontos de Sangue se pagam à mão no contador.
8. **O Sangue Guardado vira Pontos de Sangue 5 por 1**, a mesma métrica do PV ("cada de sangue
   equivale a 5 pontos de vida").
9. **Pontos de Sangue e Sangue Guardado zeram no Descansar** ("começa com 0 PS" a cada sessão). A
   Fome fica, e o PV Inicial é um botão, não acontece sozinho.
10. **As rodadas a mais do Voto valem só na Duradoura**, e a Exaustão segue o nível escrito.

E ficaram de mesa: o Corpo Morto (decisão), a Imunidade a Sangramento (o motor não tem imunidade a
condição), o "Manejo Único" das Preciosas Amarras (o texto não diz o que é), o Sangramento Leve do
crítico do Hemólito, o efeito do Valorizar Alimento (só o contador), "considerado como sem ambos os
braços", a obrigação de atacar a primeira criatura, o requisito da Maldição Carmesim, o +1
sangramento acumulado, o 1d4 da Fome, o teste de Vontade no início de cada cena (a CD está na Ficha)
e a caçada da Fome 4.
**Precisa:** o autor confirmar o 1 ao 10 e dizer o que é o Manejo Único.
**Anotado:** 2026-10-15, ao fazer o addon Golem de Sangue (7 ao 10 em 2026-10-16, na 1.1.0)

### Quimera de Maldições: leituras para confirmar
**Onde:** `addons/quimera-de-maldicoes.json`, `resolveQuimeraMecanicas` (afty-invocacoes.js) e `aplicaDanoQuimera` (ficha/ficha-sessao.js)
**Situação:** o autor decidiu em 2026-10-14 que Maldição funde só com Maldição, que cada uma soma o
custo base do grau e que o pedido de 5 níveis de Controlador continua. Estas leituras foram feitas sem
ele, e estão no número:
1. **A Quimera de Maldições cai pela regra da Maldição:** a 0 PV ela é exorcizada, e as componentes
   ficam presas até o fim da cena, sem morrer (o texto da Quimera para "exorcizada"). A de Shikigamis
   segue dissipando a 0 PV, com as componentes.
2. **Ela é do tipo Maldição em tudo o mais** (herda da principal): é ativada, não dissipa, a
   Autonomia é paga no início do combate e não recebe cura por Energia Reversa.
3. **A mistura avisa e não trava**, como a Maldição já avisava na Quimera sem o addon. A Quimera
   misturada continua aparecendo, com o aviso em âmbar.
**Precisa:** o autor confirmar o 1 ao 3.
**Anotado:** 2026-10-14, ao fazer o addon Quimera de Maldições

### Reconciliar H Corp, Talentos da H Corp e Morador da Cidade no inventário do G00
**Onde:** `docs/revisao-automacao/` (`fontes.json`, `inventario.json`, `reconciliacao.json`)
**Situação:** os três Addons novos entram no inventário vivo e o `t-reconciliacao-g00.mjs` falha em
"fontes individuais cobrem cada chave viva". Não reconciliei porque esses arquivos estavam com
edições não commitadas de outra sessão (Estilo das Sombras), e o protocolo pede um editor por vez.
**Precisa:** com a árvore livre, rodar `npm run revisao:reconciliar` nas duas etapas do guia das
ferramentas e registrar o dono dos itens novos.
**Anotado:** 2026-10-12, na criação dos Addons H Corp, Talentos da H Corp e Morador da Cidade

**Complemento de 2026-10-25:** incluir também os dois Talentos de
`addons/talentos-de-estilo.json` e o catálogo `AFTY_OPCOES_TALENTO` na
reconciliação dos conteúdos da casa. O módulo novo
`afty-talentos-estilo.js` já tem proprietário de mecanismo `M05` no escopo.
O conteúdo não recebeu aprovação de regra do Livro. A suíte final da
implementação manteve as duas falhas anteriores, sem novo erro de coleta.

### Vampiro da Máscara de Pedra: leituras para confirmar e o que segue de mesa
**Onde:** `addons/vampiro-mascara-de-pedra.json`
**Situação:** o autor decidiu quatro leituras em 2026-10-12 (as penalidades de atributo da fome se
substituem, a Aprimorada dá +10 na cura, só os 5 Talentos do texto, e a Pedra Aja tira também a
vulnerabilidade a Energia Reversa do Rei). Estas outras foram feitas sem ele, e estão no número:
1. **Regeneração Vampírica:** a frase *"No início de cada um dos seus turnos, você recupera pontos de
   vida igual a:"* termina sem valor, e foi lida como sobra de rascunho. Só a ação bônus com Doses
   está no número. Cada Dose cura a base inteira (como os usos a mais do Vigor Maldito), e as Doses a
   mais vão até metade do BT. Com fome (2 dias ou mais) a Cura por Dose vira 0, inclusive no frenesi.
2. **Patente:** as faixas do texto se encostam (0-40, 40-100). O número de baixo de cada faixa já é
   dela: 40 é Intermediário, 100 Experiente, 200 Conde e 500 Rei. Os benefícios somam (o Conde tem o
   +1 de Anatomia do Intermediário e o dele).
3. **Fraqueza Ignorada:** a escolha aparece sempre na aba Origem e só vale com 100 Doses Consumidas.
   Só a Vulnerabilidade à Luz tem número, as outras três seguem de mesa.
4. **"-4 em todas as rolagens"** (10 a 13 dias) vale em Perícias, Testes de Resistência, ataques e
   Iniciativa. Dano fica de fora.
5. **Forma de Morcego:** o "deslocamento terrestre padrão" é o de 9 metros (sem bônus), e o tamanho
   desce dois degraus a partir do Médio. Vale só com o interruptor da bancada (em combate).
6. **Servos:** "uma Invocação a cada três níveis" é `piso(nd / 3)`, contando desde o nível 1.
7. **A Pedra Aja** tira as vulnerabilidades mesmo sem a Patente Rei: o contador é marcado por quem
   usou a Máscara com a Pedra.

E ficaram de mesa, escritos no texto de cada item:
8. **Consumir Sangue:** a desvantagem em técnicas e aptidões, o Condenado permanente e o custo dele,
   o Confuso no início do combate, o teste de Vontade a cada turno (a CD está pronta) e o frenesi. Os
   Dias sem Sangue e as Doses Consumidas só se mexem no criador (Recursos de Origem), como o contador
   do Arauto da Corrupção.
9. **Patente:** não perder Doses e o enjoado do Experiente, os dados a mais do sol, o "treinamento de
   vampiro" do Conde (o texto não o define) e as Aptidões de Maldição do Rei ("precisando de uma
   narrativa").
10. **Herança Maldita, Máscara de Pedra, Criar Vampiro, Bote e Coleta de Sangue:** só texto e os
    números prontos (CD da Transformação, Testes).
11. **Características de Anatomia:** Capacidade de Voo e de Nado, Devorador de Energia, Presença
    Nefasta, Servo, Anatomia Incompreensível, o Atletismo dos Braços Extras e a regeneração de membro
    da Aprimorada (só o contador). Os "100 pontos de sangue" da Aprimorada são nota.
12. **Uma ficha com o Vampiro e a Maldição Era de Ouro instalados** vê os dois catálogos na mesma aba,
    porque a família é uma só.
**Precisa:** o autor confirmar o 1 ao 7.
**Anotado:** 2026-10-12, ao fazer o addon Vampiro da Máscara de Pedra

### Stark: leituras para confirmar e o que segue de mesa
**Onde:** `addons/stark.json`
**Situação:** o pacote saiu com os números que o motor sabe dizer. Estas leituras foram feitas sem o
autor, e estão no número:
1. **O Estilo sem o Domínio Simples ligado.** A nota do PDF diz que *"qualquer estilo das sombras
   que seja especial (a maioria que estará presente) não requer o domínio simples ativo"*, e o motor
   liga toda Técnica da Expansão só com o interruptor do Domínio Simples. Hoje: precisa do
   interruptor (o Legado sem a Aptidão também o tem, porque conhece Técnicas). Alternativa: um campo
   `semDominio` na Técnica de pacote, que ligue só pela Técnica Ativa.
2. **"RD igual a sua Aptidão em Aura"** (Impacto Trovejante) entrou como RD Geral. O bloco da Aura do
   Reforço Corporal foi decidido pelo autor em 2026-10-11 pela planilha do Stark (ver afty-addons.md,
   seção Stark), e o BM é o BT.
3. **O Impacto Trovejante tira a Defesa do Golpe Descendente** ("ao invés de ganhar defesa"), por
   uma linha de Defesa negativa igual à do Golpe.
4. **Maldição - Instinto Corrompido:** a Inteligência 6 é `limiteAtributo -14`, então outra fonte
   que suba o limite sobe o teto junto. "Não pode aprender Aptidões de CL" é o limite da trilha CL em
   zero, e uma Aptidão de CL sem requisito de nível continua escolhível na aba. Desde a 1.1.0 (autor,
   2026-10-11) o CL deixa de ser requisito nas Aptidões de outras trilhas (`ignoraRequisitoTrilha`).
5. **Os três treinos valem para qualquer origem**, porque o texto não restringe.

E ficaram de mesa, escritos no texto de cada item:
6. **Legado do Guerreiro:** o máximo de 3 pontos no mesmo atributo não junta o pool de 3 com o ponto
   físico, que são duas alocações.
7. **O Covarde:** o teste de Vontade e a tabela de CD, as condições, a desvantagem, o −1 PE/PP das
   habilidades com Estilo relacionado, e "recuperando a diferença" do PE ao superar o medo.
8. **Técnicas:** a área de 1,5m e a RD que não pode ser ignorada (Reforço Corporal), os degraus de
   Aura e de Domínio que não são número, a cura do Tempo para um Covarde (e a recarga de metade no
   descanso curto), a Mente Inabalável e a Cobertura da Vanguarda inteiras.
9. **Instinto Corrompido:** a desvantagem em Testes de Intelecto.
10. **Treinos:** o Completo do Escudo (RD contra BT tipos), a Etapa 4 e o Completo da Firmeza, e as
    Etapas 1 a 3 do Corporal (cura a mais e dados de vida, que o Afty não tem).
**Precisa:** o autor confirmar o 1 ao 5.
**Anotado:** 2026-10-11, ao fazer o addon Stark

### Herdado da Era de Ouro: leituras para confirmar e o que segue de mesa
**Onde:** `addons/herdado-era-de-ouro.json`
**Situação:** a origem saiu própria (não conta como o Herdado do livro), com os três clãs e os 7
Talentos. Estas leituras foram feitas sem o autor, e estão no número:
1. **"Recebendo Acerto e Defesa"** do Talento Akutame vale nos TRÊS ataques (corpo a corpo, a
   distância e amaldiçoado), porque o texto não restringe.
2. **"Quando realiza a ação Atacar"** da Postura do Matador de Yokai vale no corpo a corpo e a
   distância, e NÃO no Ataque Amaldiçoado, lendo "ação Atacar" como o ataque armado ou desarmado.
3. **Fundamentos Imponentes** soma no canal `cd` inteiro (Feitiço, Aptidão e Habilidade), lendo
   "CD Amaldiçoado e de Aptidões Amaldiçoada" como a CD única do Afty.

E ficaram de mesa, escritos na descrição:
4. **Compreensão Avançada**: "Possuir ao menos 1 nível nas Aptidões selecionadas" é `nota`. A
   escolha de Talento não tem requisito por opção, e as 5 trilhas aparecem sempre.
5. **Manuscrito Ancestral**: o Feitiço um nível acima do acesso e os 2 espaços que ele ocupa até o
   nível liberar. Só o −1 na recarga da Técnica Máxima está no motor, igual ao Manual de Técnica.
6. **Fortes Convicções** (vantagem a cada 2 rodadas), **Arsenal do Maior Clã** (item que não evolui
   de grau) e o **Feitiço Focado** do Fujiwara (só o contador, igual ao do Zenin).
7. **O addon Clã Sugawara antigo** (`addons/sugawara.json`) põe um Clã Sugawara no Herdado do livro,
   com dois Talentos de mesmo nome. Os dois pacotes convivem sem conflito de id, mas uma ficha com os
   dois instalados vê dois Fundamentos Imponentes e duas Compreensões Avançadas na lista.
**Precisa:** o autor confirmar o 1 ao 3, dizer se o 4 vira trava (requisito por opção de Talento é
verbo novo) e se o addon Clã Sugawara antigo continua.
**Anotado:** 2026-10-11, ao fazer o addon Herdado da Era de Ouro

### Não-Feiticeiro (Regras Opcionais): o que segue de mesa
**Onde:** `addons/nao-feiticeiro.json`, `src/systems/afty/afty-origens.js` (escolhas de origem)
**Situação:** o pacote saiu com os números e as travas que o motor já sabe dizer (sem energia,
nível 10, Feitiço até o Nível 2, Arma Masterizada, Perceber o Ar, os dois contadores). Ficaram de
mesa, escritos na descrição de cada item:
1. **Pré-requisitos do ARMA!!!** ("Nível 5, Grão Mestre em Arma e Armas Escolhidas"). Opção de
   escolha de origem não tem `requisitos`. Hoje só as escolhas do nível 5 e do 10 o oferecem, e o
   Grão Mestre e o Armas Escolhidas não são conferidos.
2. **A mesma Artimanha em duas escolhas.** Só o Conhecimento Inatural "pode ser pego várias vezes",
   e nada impede repetir as outras entre as três escolhas.
3. **Planejamentos Assíduos** pede o Arsenal do Restringido, que não existe no Afty.
4. **Habilidades de Especialização com Energia Amaldiçoada na narrativa** ("como Precisão
   Definitiva") não são vetadas: não há lista delas, e a leitura é da mesa.
5. **"não pode mudá-los ao elevar seu nível"** (o Estilo e o Fundamento Marcial) não é travado.
6. **Conhecimento Inatural** dá um Nível de Aptidão "caso você se torne um Feiticeiro", e a regra
   das Artimanhas diz "Caso você mude de origem, você perde todas as suas artimanhas". O texto
   parece se contradizer, e é PERGUNTA AO AUTOR: o nível vem antes de perder a Artimanha, ou não vem?
**Precisa:** o autor dizer se algum destes vira trava (o 1 e o 2 pedem `requisitos` e exclusividade
em opção de escolha de origem, um verbo novo) e responder o 6.
**Anotado:** 2026-10-09, ao fazer o addon Não-Feiticeiro

### Técnica Máxima e Expansão de Domínio: NOVA DECISÃO NECESSÁRIA
**Onde:** `docs/afty-tecnica-maxima-dominio.md`, `src/systems/afty/afty-dominios.js`, `afty-feiticos.js`
**Situação:** as decisões de 2026-10-08 cobriram o projeto, e a implementação achou estes pontos que
nenhuma delas responde. Cada um está implementado na leitura mais conservadora, marcada abaixo, e
nada mais depende deles para funcionar.

1. **Área da Sem Barreiras oficial.**
   - Fonte: Livro, Expansão sem Barreiras ("mesmos efeitos e custo de uma expansão completa com
     acerto garantido, mas não levanta barreiras, tendo um alcance superior para o acerto garantido").
   - Problema: a DA-11 tirou o `9 m × BT` e o Totem, e falou do alcance do Acerto Garantido. A área da
     própria Expansão ficou sem número.
   - Alternativas: (a) "Definida pela Mesa", sem número (**implementado**); (b) 9 m, como a
     Completa, lendo "mesmos efeitos"; (c) outro número do autor.
   - Impacto: a linha da Ficha e do criador da Sem Barreiras oficial.
2. **Golpeador de vários golpes dentro da Expansão.**
   - Fonte: Golpeador ("dividindo o dano adicional entre golpes") e Amplificação de Técnica ("o
     aumento de dano é aplicado em todos os Feitiços").
   - Problema: o dano fixo da Amplificação e do Ritual pode ser dividido entre os golpes, como o
     dano adicional, ou valer em cada golpe.
   - Alternativas: (a) dividido entre os golpes, com piso (**implementado**); (b) em cada golpe.
   - Impacto: o fixo de cada golpe do Golpeador com a Expansão no ar.
3. **Fortalecer a Redução de Dano Corporal.**
   - Fonte: Guia ("aplique metade do efeito como um bônus adicional") e DA-12 ("só fortalecer
     grandezas objetivamente numéricas previstas pela regra").
   - Problema: a linha tem dois números, a RD e a quantidade de tipos.
   - Alternativas: (a) só a RD (**implementado**, o que o código antigo também fazia); (b) a RD e
     metade dos tipos.
   - Impacto: a RD Corporal fortalecida.
4. **Quantas condições cabem num Acerto Garantido de Condição.**
   - Fonte: Guia, Acerto Garantido ("é apenas um efeito... desde que seja apenas uma" e "escolher
     causar condições garantidas, como Paralisia ou Atordoamento, mas não Desmembramento").
   - Problema: "um efeito só" pode ser uma condição só, ou um pacote de condições que chega junto.
   - Alternativas: (a) várias, sem trava, com o Desmembramento proibido (**implementado**); (b) uma
     condição só, com ERRO acima disso; (c) um AVISO acima de uma.
   - Impacto: o editor do Acerto Garantido e a validação da Expansão.
5. **Abrir uma Expansão durante a Exaustão de Técnica.**
   - Fonte: Livro ("deixa a técnica inutilizável") e DA-16 ("Não bloqueia Aptidões").
   - Problema: a Expansão é uma Aptidão, mas ela imbui a técnica na barreira.
   - Alternativas: (a) abre normalmente, lendo a DA-16 ao pé da letra (**implementado**); (b) a
     Exaustão trava a abertura.
   - Impacto: o botão Abrir da Ficha e o seletor da Aba Buffs.
6. **O Funcionamento Básico durante a Exaustão de Técnica.**
   - Fonte: DA-16 ("suprime passivos da Técnica quando identificáveis").
   - Problema: o Funcionamento Básico é o núcleo da técnica, e não é Feitiço. Não está claro se ele é
     um "passivo da Técnica".
   - Alternativas: (a) continua valendo, só os Feitiços (Passivos e Auxiliares ligados) saem
     (**implementado**); (b) sai do Motor junto, como na Técnica Inata bloqueada.
   - Impacto: os números da ficha durante a Exaustão.
7. **O fim do combate com a Expansão aberta.**
   - Fonte: Livro ("A exaustão só é aplicada após o domínio ser desmanchado, seja a força ou por
     realmente ter tido o seu efeito finalizado"). O Livro não fala do fim do combate.
   - Problema: a bancada zera os estados fora de combate, e a Expansão aberta precisa fechar de
     algum jeito.
   - Alternativas: (a) fecha e cobra a Exaustão de Técnica (**implementado**); (b) fecha sem cobrar;
     (c) fica aberta, sem efeito, até alguém fechar.
   - Impacto: a Exaustão de Técnica que sobra depois da luta.
8. **O dobro de movimento da Expansão vale no voo?** (anotado em 2026-10-09, com o canal `voo`)
   - Fonte: Expansão ("Seu movimento dobra dentro da sua própria expansão") e Lento ("Toda forma de
     movimento do personagem", que mostra que "movimento" no Livro cobre o voo).
   - Problema: o texto da Expansão fala de "movimento", e o voo é um Deslocamento à parte.
   - Alternativas: (a) dobra o voo também, pelo mesmo `movimentoMult` (**implementado**); (b) dobra
     só a caminhada.
   - Impacto: o voo do Herdeiro Celeste (e de qualquer fonte de `voo`) com a Expansão no ar.

**Precisa:** o autor responder cada item.
**Anotado:** 2026-10-08, na implementação da Técnica Máxima e da Expansão de Domínio

### Novo Estilo das Sombras: leituras da Expansão que a DA-09 manda perguntar
**Onde:** `docs/afty-estilo-sombras.md`, `src/systems/afty/afty-estilo-sombras.js` e o catálogo do Estilo
**Situação:** o autor adotou a *Expansão do Novo Estilo das Sombras (F&M 2.5)* em 2026-10-04 e decidiu as
leituras principais. Estas oito ficaram fora das decisões e são interpretação de regra, então cada
uma é **NOVA DECISÃO NECESSÁRIA**. Enquanto não houver resposta, o ponto fica como texto na ficha.

1. **Margem Crítica no Nível 4.** Fonte: *"recebe um bônus igual a -1 na margem crítica no nível 5,
   no nível 13 sua margem crítica é reduzida em -2"*. Problema: o Estilo começa no Nível 4, e o texto
   não diz o que o efeito dá antes do 5. Alternativas: (a) nada até o 5; (b) -1 desde o 4. Impacto:
   uma Técnica de Nível 4 com Margem. Hoje: (a), sem número no Nível 4.
2. **"Usa Reação".** Fonte: *"Caso seja um estilo que utilize sua reação ao invés de usar metade do
   seu BT, você utiliza seu BT inteiro durante a reação."* Problema: não diz o que fica valendo fora
   da reação. Alternativas: (a) a Técnica inteira só vale na Reação, com BT inteiro; (b) os efeitos
   de metade do BT viram BT inteiro só no instante da Reação, e fora dela seguem metade. Impacto: o
   número de toda Técnica marcada. Hoje: a marca é guardada e aparece na ficha, sem mudar número.
3. **Recarga do Contra-Ataque.** Fonte: *"você deve definir a quantidade de contra ataques que serão
   usados"*. Problema: não diz se a quantidade é por rodada ou por Domínio aberto. Alternativas:
   (a) por rodada; (b) por Domínio aberto. Impacto: o contador da Ficha e do Encontro. Hoje: a
   quantidade aparece na ficha, sem contador, até a resposta.
4. **Troca da Durabilidade no Funcionamento Básico.** Fonte: *"você pode trocar a aptidão de Domínio
   (Durabilidade) para o Estilo da sua esgrima"*. Problema: no Livro a Durabilidade do Domínio
   Simples é o Nível de BAR + 1, e não Domínio, e o Afty não calcula a Durabilidade. Alternativas:
   (a) a Durabilidade passa a ser a Aptidão escolhida + 1 no lugar do BAR; (b) outra fórmula do
   autor. Impacto: só a Durabilidade. Hoje: a escolha é guardada e mostrada, sem número.
5. **Bônus de Acerto "(ESPECIFICAR)".** Problema: o texto não diz o que se especifica. Alternativas:
   (a) o tipo de ataque (corpo a corpo, à distância, amaldiçoado); (b) uma arma; (c) as duas formas.
   Impacto: o alvo do bônus. Hoje: (a), a única que o canal `bonusAcerto` já sabe, com a escolha
   marcada como provisória até a resposta.
6. **BAR 5 contra TR de alvo único.** Fonte: *"Você também no nível 5 de BAR, caso seja alvo de uma
   TR (Fortitude ou Reflexos) de alvo único, você pode utilizar sua rolagem de Reflexos contra a CD
   do ataque"*. Problema: não diz se isso vem junto do Contra-Ataque ou se é uma modificação à parte,
   que ocupa vaga. Alternativas: (a) vem com o Contra-Ataque no BAR 5, sem vaga; (b) modificação
   própria de 1 vaga. Impacto: o orçamento da Técnica. Hoje: texto na ficha do Contra-Ataque no BAR 5,
   sem custo nem automação.
7. **Dois Pré-Requisitos no mesmo efeito.** Fonte: *"consideram que sua Aptidão para um dos efeitos é
   aumentada em 1, 2, 3 ou 4"*. Problema: o texto não diz se dois Pré-Requisitos podem apontar para o
   mesmo efeito, nem se somam. Alternativas: (a) somam; (b) vale o maior; (c) um por efeito.
   Impacto: o bônus de Aptidão considerado. Hoje: (a), com aviso na Técnica até a resposta.
8. **Exaustão quando a Técnica foi trocada no meio.** Fonte: *"Pontos de Exaustão são recebidos no
   momento em que o Domínio Simples é fechado"* e a decisão do autor (DA-08: "Se a Técnica utilizada
   possui exaustao: 2, ao fechar o Domínio: +2"). Problema: com a troca no meio, e desde 2026-10-11
   com várias Técnicas ligadas ao mesmo tempo (a DA-04 foi revogada), mais de uma Técnica pode ser
   usada na mesma ativação. Alternativas: (a) somam as Técnicas usadas, cada uma uma vez; (b) só as
   ligadas no fechamento; (c) a maior delas. Impacto: a Exaustão de quem liga ou troca. Hoje: (a),
   porque (b) deixaria trocar para uma Técnica sem Exaustão antes de fechar.

**Precisa:** o autor responder cada item. Cada resposta é uma linha do catálogo ou da sessão.
**Anotado:** 2026-10-04, na implementação da Expansão do Novo Estilo das Sombras

### The Crimsom Queen: definir Catalisadora
**Onde:** `addons/the-crimsom-queen.json`, Yearning Mircalla
**Situação:** addon implementado, propriedade Catalisadora preservada no texto da arma. PDF e catálogo nativo não trazem seu efeito numérico.
**Precisa:** autor informar a regra de Catalisadora para automatizar eventual modificador. Pergunta enviada, demais encantamentos e manifestação implementados.
**Anotado:** 2026-10-01, validação final de Bloodfeast

### Yna: cinco leituras para confirmar
**Onde:** `addons/yna.json` e `docs/afty-yna.md`
**Situação:** o pacote da Yna (Kitsune, Clã Getsurin, Treino de Cônjuge e Treino de Desenvolvimento Amaldiçoado) entrou em 2026-09-29 com quatro decisões do autor por pergunta com opções. Estas cinco leituras ficaram por conta própria, cada uma no lado mais simples, e nenhuma muda o que já foi decidido:
1. **Forma de Raposa com Desenvolvimento Exagerado.** O texto diz *"você é considerado como tamanho pequeno"*, que é tamanho ABSOLUTO. O canal `tamanho` conta degrau, então a Forma escreve `-1`: uma Kitsune com a Anatomia Desenvolvimento Exagerado (+1, Grande) vira Médio na Forma, e não Pequeno. Para quem não tem a Anatomia, dá Pequeno certo.
2. **O +2 de Percepção vale em toda Percepção** enquanto a Forma está ligada. O texto restringe a *"(Faro e audição)"*. A linha aparece no hover como "Forma de Raposa (Faro e Audição)" para dizer o recorte.
3. **"O nível de sua menor aptidão"**, na etapa 4 do Treino de Desenvolvimento, vira um ponto LIVRE de Nível de Aptidão, igual ao Estudo do Jujutsu. O Motor não sabe qual é a menor, e o jogador põe o ponto onde quiser.
4. **Pensamento Mútuo** soma metade do BT DA PRÓPRIA ficha na Iniciativa (aparado para baixo), e vale para os dois cônjuges sem conferir quem tem a maior Iniciativa. É o mesmo desenho que o autor aceitou na Dupla Empenhada do Flugel. O texto diz *"metade do BT de seu parceiro"* e só para a maior Iniciativa da dupla.
5. **Focos das etapas 1 a 3 do Treino de Desenvolvimento.** O texto só marca a etapa 4 ("2 focos"), e as outras ficaram com 1 Foco cada.
**Precisa:** o autor confirmar cada item ou dizer qual muda. O 1 pede uma variável de tamanho no DSL ou um canal que FIXA o tamanho, e os outros são uma linha do JSON.
**Anotado:** 2026-09-29, ao fazer o pacote da Yna

### Técnicas Marciais: o que ficou provisório (2026-10-27)
**Onde:** `src/systems/afty/afty-tecnicas-marciais.js`, `afty-derive.js`, `afty-feiticos.js`. Guia: `docs/afty-tecnicas-marciais.md` (seção 9 tem a lista inteira).
**Situação:** a calculadora está feita nos dois sistemas, e o plano seguiu a recomendação nas dezesseis perguntas que o autor não respondeu. As que mais mudam número: (1) a ordem em que a vaga `vagasFeitico` serve Estilo, Técnica Marcial e Feitiço (provisório nessa ordem), (2) Dominância, Manipulação Perfeita e Treinos com `escolhaFeiticos` NÃO reduzem o custo da Técnica, (3) o Sangramento da Técnica de Ataque fica só como Fraca, sem a tabela variável, (4) o Encantamento Complementar ("+2 na CD de Especialização e de Estilo Marcial") segue fora porque o Afty tem uma CD só, (5) Técnica Marcial não conta como Feitiço no requisito "Possuir Feitiços" de Talento, (6) os dados do Elementalista e da Amplificadora entram Após Ataque e não dobram no crítico, (7) o contador de acertos da Ficha é manual e a expiração da Amplificadora também.
**Também fica sem conferência no navegador:** o painel do Encontro com a linha nova, o Gêmeo Restringido, o Não-Feiticeiro e o Sem Técnica com o Addon Estilo Marcial (cobertos só pelos asserts `t-tecnicas-marciais`, `t-estilo-marcial` e `t-nao-feiticeiro`), e a aba G2, que só abre pela prévia (`.audit/tecnicas-marciais-20261027/`).
**Precisa:** o autor responder as dezesseis, por pergunta com opções, e abrir uma ficha de cada origem acima na tela.
**Anotado:** 2026-10-27, ao entregar as Técnicas Marciais

### Fórmula de Combate Entrópica: as leituras do PDF que faltam, antes de cada fase
**Onde:** `docs/afty-formula-entropica.md`, seção "Perguntas em aberto" (a lista inteira e numerada mora SÓ lá, para não haver duas cópias)
**Situação:** o Addon da Restrição Intelectual (homebrew de Dr. Xeno) foi planejado em 5 fases em 2026-09-28. As Fases 0, 1 e 2 estão feitas, e as leituras delas foram respondidas. Faltam as das etapas seguintes: o Engenho Superior ligado à Criação de Equipamentos (2b), quantas Técnicas Marciais ele conhece e os nomes das duas de Nível 4 ("aaaaaaaaaaaaaaaaaaa") (3), quatro dispositivos sem Modo de Instalação e Acionamento e a Mina Terrestre repetida com números diferentes (4), e as Características do Avião copiadas do Tanque (5). Mais uma observação da Fase 2: com o contador de falhas ligado a Atenção sobe junto, porque o bônus vale em toda perícia e a Atenção sai da Percepção.
**Precisa:** o autor (ou Dr. Xeno, por ele) responder as perguntas de cada fase ANTES de ela começar. Elas vão por pergunta com opções, em lotes por fase.
**Anotado:** 2026-09-28, no planejamento do Addon

### Maldição - Era de Ouro: o que ainda é só texto, e o que vale mais largo que o livro
**Onde:** `addons/maldicao-era-de-ouro.json` (`acrescenta.caracteristicasAmaldicoadas` e o Tipo De Medo) e `src/systems/afty/afty-efeitos.js` (os canais)
**Situação:** das 18 do pool, 10 têm número no Motor e 8 se declaram `mesa` (a marca "Mesa" na tela, e um assert em `asserts/t-maldicao-era-de-ouro.mjs` cobra que nenhuma fique muda). As de mesa ficam assim por falta de mecanismo, e cada uma pede uma decisão de desenho antes de virar número. Nenhuma foi suposta.
1. **Capacidade de Voo e de Nado** (*"transformar seu deslocamento de caminhada em deslocamento de voo"*, uma vez por rodada, ação livre). O `movimento` é um número só. Proposta: um estado de bancada "Voando" e "Nadando" que apenas rotula o deslocamento já calculado, sem canal novo. Falta o autor dizer se voo e nado têm cálculo próprio (multiplicador, teto) ou se vale o número da caminhada, como o texto diz.
2. **Braços Extras, o "+2 em Atletismo se tiver pelo menos duas mãos livres"**. O autor aprovou em CX1 a declaração manual Duas Mãos Livres, desligada por padrão na sessão. A Anatomia nativa está integrada com `gatilhoSessao: anatomia_duas_maos_livres`. Falta integrar a característica do addon em CX2, reutilizando o mesmo estado, sem reabrir essa decisão.
3. **Alma Maldita** do addon: falta integrar o conteúdo à operação fracionária e ao contador diário de CX2. A decisão de recarga foi respondida: **Novo Dia manual, separado de Descansar**. O mecanismo nativo já existe, não usar `rdAlma` fixa nem recarga por descanso para representar a regra.
4. **Guia Espiritual** (*"recebe um aliado seguindo as regras da página 348"*). O Afty tem o teto de aliados por Grau (`limiteDeAliados`). Falta o autor dizer se o Guia é UM ALIADO A MAIS que o teto, ou só o direito de ter um dentro dele.
5. **Anatomia Incompreensível, Devorador de Energia, Energia Tóxica e Presença Nefasta** do addon ainda precisam de ligação de conteúdo às operações. CX2 entregou os mecanismos das Anatomias nativas sobre CL1/CL2. Não é mais ausência de motor de reação. Conferir cada regra do suplemento antes de mapear o pacote, incluindo suas diferenças de nível e duração.
6. **Tipo De Medo, "Resquícios de Emoções"** (*"reduzir o pré-requisito de nível de UM grupo de aptidões em 1"*). O canal `reduzNivelAptidao` não tem alvo por grupo, então o pacote aplica em TODOS os grupos, mais largo que o livro e nunca mais estreito. Proposta: um `alvo` de grupo no canal (Aura, Controle e Leitura, Barreira, Domínio, Maldição, Especiais), com a escolha do grupo no card da Origem, e o `avaliarRequisitoAptidao` lendo o desconto do grupo da aptidão. Falta o autor dizer se a escolha do grupo é fixa ou se pode ser trocada.
**Precisa:** a decisão do autor em cada item, e só então o canal ou o estado correspondente.
**Anotado:** 2026-09-23, ao fazer as Características Amaldiçoadas com escolha mexerem no número
**Nota:** a recarga diária manual e a redução fracionária de Alma Maldita foram entregues para a Anatomia nativa em CX2 (2026-11-01). Falta a integração própria deste addon, sem reabrir a decisão respondida. Articulações Extensas foi automatizada na versão 2.1.1 do pacote, em 2026-10-03, e saiu desta fila.

### A CD de Especialização e a CD Amaldiçoada são duas no livro
**Onde:** `src/systems/afty/afty-derive.js` (a `cd` única) e o canal `cd`
**Situação:** o livro separa as duas: cada classe tem "Atributos Chave" para "calcular a CD das suas habilidades de especialização" (Combatente: Força, Destreza ou Sabedoria), e o Reforço Amaldiçoado diz "Sua CD de Especialização e Amaldiçoada aumenta em +2". O sistema tem uma CD só, pelo Atributo da Técnica, e o `atributosChave` do catálogo não é lido. Consequências: um Combatente com Técnica em Inteligência resiste pela INT nas habilidades de classe, e o Aprimoramento Especializado ("metade do modificador do seu atributo chave em sua CD de Especialização") sobe também a CD de Feitiço e Aptidão.
**Precisa:** decidir se o sistema ganha a segunda CD (a escolha do atributo-chave por classe, e o destino de cada fonte: Implemento Marcial nas duas, Aprimoramento Especializado e Complementar só na de Especialização).
**Anotado:** 2026-09-23
**Nota:** o autor respondeu *"Não fazer agora"* em 2026-09-23, na rodada de automação do Combatente. A entrada fica.

### A camada de imagem do tema pode virar ambiente FIXO?
**Onde:** `src/systems/afty/ficha/ficha.css`, `.afty-ficha-corpo::before` (e o `::after` dos modos Caber e Tamanho Real)
**Situação:** saiu da entrega de performance de 2026-09-22, que atacou a lentidão da Ficha Final em nível alto. O `::before` usa `position: absolute` com `inset: 0` dentro de um `.afty-ficha-corpo` que embrulha o `<main>` inteiro, então ele estica por TODA a altura rolável. Numa ficha de nível alto isso é uma superfície de milhares de pixels que o navegador reescala para `cover` e repinta junto com a rolagem. Trocar para `position: fixed` limitaria a camada à tela e casaria com o brilho de fundo, que virou camada fixa na mesma entrega.
O conserto NÃO foi feito porque o comentário logo acima da regra diz que acompanhar toda a altura da aba é proposital, e nos modos Caber e Tamanho Real a cópia de ambiente existe justamente para a imagem não terminar numa faixa preta quando a aba é mais alta do que ela. Mudar sem decisão quebraria um enquadramento escolhido a dedo.
Vale notar que o custo só aparece em ficha COM imagem de tema: sem ela a camada é `background-image: none` e não pesa.
**Precisa:** o autor dizer se a imagem de ambiente pode ficar presa à tela (mais barata, e some a faixa preta de graça) ou se ela tem de continuar acompanhando a altura da aba.
**Anotado:** 2026-09-22, na entrega de performance da Ficha Final

### Feitiços Permutativos: leituras para confirmar
**Onde:** `src/systems/afty/afty-feiticos.js` (bloco FEITIÇOS PERMUTATIVOS), `afty-combate-conjurador.js` (`travaDaPermuta`) e `asserts/t-feiticos-permutativos.mjs`
**Situação:** os Permutativos foram entregues em 2026-10-02 com as dez decisões do autor (em `docs/afty-feiticos-permutativos.md`). Sobraram pontos que o texto não fecha, e cada um saiu pela leitura abaixo. Os três primeiros são dado do motor, e trocar é editar uma linha e o assert.
1. **Margem só pela troca no Nível 1 existe só na Imediata** (`PERMUTA_ABRE_CELULA`), a coluna em que a Margem nasce na tabela. Duradoura e Sustentada seguem sem Margem nos Níveis 0 e 1.
2. **O bônus original (teto da Perícia) é lido antes da Liberação Máxima**, que é de mesa, para o teto não mudar entre o criador e a Ficha.
3. **O Bônus em Rolagem ganhou alvo de perícia**, e sem ele segue Toda Rolagem (perícia, TR e ataque, como antes). A troca de perícia só abre com uma perícia escolhida.
4. **A base da Defesa é 10 + o atributo que a Defesa usa**, então o Músculos Desenvolvidos (Força no lugar da Destreza) também muda a base.
5. **"RD Geral a perder" é RD Geral menos a redução não ficar abaixo de zero** ("o mesmo se aplica para a RD").
6. **Margem a perder numa arma é o crítico dela estar pelo menos a redução abaixo de 20** (uma arma 19-20 tem 1 de margem). A troca é tudo ou nada por arma.
7. **A RD ganha vai para a RD Geral**, o mesmo canal que a RD do Feitiço já usa, e por isso cobre todos os tipos dele ("A RD recebida é aplicada para todos os tipos de RD do Feitiço").
8. **Transformação e Passivo não recebem Permutativo**, porque o texto fala só do Auxiliar.
**Precisa:** confirmação do autor, ou a leitura certa de cada item.
**Anotado:** 2026-10-02, na entrega dos Feitiços Permutativos

### Condições: leituras para confirmar
**Onde:** `src/systems/afty/afty-condicoes.js` (`CONDICAO_EFEITOS`) e `asserts/t-condicoes-efeitos.mjs`
**Situação:** as condições mexem no número desde 2026-09-21, sem acumular entre si (a regra do autor). O texto deixou pontos abertos, e cada um saiu pela leitura abaixo. Os cinco primeiros são dado do catálogo, e trocar é editar uma linha e o assert. Os outros cinco são código.
1. **Caído entra como -3 na Defesa**, como o próprio livro o conta no exemplo "enredado e caído sofre -3 na Defesa, não -5". O +3 contra ataque a distância fica no texto, e não muda número.
2. **Sofrendo: os -5 valem na Concentração** (o teste nomeado do Motor). Os -5 em Prestidigitação só valem para ritual e ficam no texto.
3. **Confuso não mexe em número.** Os -4 são só "para se manter de pé".
4. **Exposto não mexe em número da ficha dele.** O +4 e o dano extra são do atacante.
5. **Metade do movimento arredonda para baixo no quadrado de 1,5m** (15m viram 7,5m, 10,5m viram 4,5m).
6. **Condenado vale nos cinco gastos** (Feitiço, Domínio, Estilo, Invocação e Aptidão) e entra DEPOIS do piso de 1 PE: um gasto de 3 com redução 5 fica em 1 e o Condenado leva a 2.
7. **Perda de vida do Sangramento não é dano**: o PV Temporário não protege e a Guarda não se quebra. A rolagem é por botão, e não automática na virada de rodada.
8. **As três Especiais (Indefeso, Invisível, Surpreso) são oferecidas na Ficha e na bancada**, e não no editor de Feitiço, porque ficam fora da lista de níveis.
9. **Surdo em combate:** a Iniciativa da ficha cai 5, mas a ordem de turnos já rolada no Encontro não é mexida sozinha.
10. **Valor manual da aba Cálculos vence a condição**, como vence todo efeito: uma Defesa sobrescrita à mão não cai com o Paralisado.
**Precisa:** confirmação do autor, ou a leitura certa de cada item.
**Anotado:** 2026-09-21, na entrega das Condições
**Nota (2026-10-07, revisão M03):** o item 6 não alcança o Invencível sob o Sol. A ativação e a manutenção dele cobram 4 PE fixos por `gastaPe` (`alteraEstadoCombate` e `avancaInvencivelSobOSol`, ficha-sessao.js), fora do `custoEmPe` onde o Condenado entra, e a fonte própria do Ápice não está no Livro de Regras. Precisa: dizer se o Condenado aumenta o custo de ativação e o de manutenção do Ápice. Se sim, os dois passam pelo `custoEmPe`.

### Sem Técnica - Liberto: seis leituras para confirmar
**Onde:** `addons/sem-tecnica-liberto.json` (o pacote) e `asserts/t-liberto.mjs` (as expectativas)
**Situação:** o pacote foi entregue em 2026-09-21 e funciona, mas o texto do autor deixou seis pontos abertos, e cada um saiu pela leitura abaixo. Todas são DADO do pacote, então trocar qualquer uma é editar o JSON e o assert, sem código.
1. **Conta como Sem Técnica para Talento de Origem.** O Liberto alcança Estudo de Aptidão e Noção e Preparação, porque o `variacaoDe` o qualifica como a mãe.
2. **Restrições copiadas do Sem Técnica.** O texto não as repete: sem Feitiços (vem da mãe) e sem Especialista em Técnicas (`especializacoesVetadas`, escrito no pacote).
3. **"Técnica de estilo adicional" (10 e 15) é vaga EXCLUSIVA de Técnica de Estilo** (`vagasEstilo`), que não serve para Feitiço nem Habilidade Geral.
4. **"Alcance" do Domínio Simples (19) é a área**, o canal `areaDominioSimples`, que soma no raio. O Domínio Simples do Afty não tem outro número de alcance.
5. **Nível 3, "+2 em 1 perícia ou TR", é UMA escolha** entre as perícias e os cinco TRs, sem jogada de ataque.
6. **As listas de perícia deixam de fora as complementares** (Direção, Sobrevivência, Teologia), o mesmo recorte do Sem Técnica do livro. Vale para os bônus e para a troca de atributo do Inquebrável.
**Precisa:** confirmação do autor, ou a leitura certa de cada item.
**Anotado:** 2026-09-21, na entrega do pacote

### A escada do desarmado básico vale Nível de Dano na criatura?
**Onde:** `src/systems/afty/afty-efeitos-conteudo.js` (as linhas `(escada)` do Corpo Treinado e das Armas Naturais) e `afty-niveis-dano.js` (`DESARMADO_BASE`)
**Situação:** na criatura o dado do desarmado não existe, e a escada do Corpo Treinado virou `nivelDano`
(um degrau por subida, ver `afty-escada-dado-nivel-dano`). A regra nova do livro dá a TODO personagem
uma escada (1d4 a 1d12 nos níveis 5, 9, 13 e 17) e ao Restringido a do Lutador. Na ficha de jogador as
duas entraram como dado. Na criatura não entrou nada, porque ninguém decidiu se "personagem" alcança
criatura, nem se cada subida vale +1 Nível de Dano lá.
**Precisa:** o autor dizer se a criatura ganha as duas escadas como Nível de Dano. Se sim, emitir as
linhas `(escada)` e acrescentá-las a `ESCADAS_DESARMADO_NO_MOTOR`, para o jogador não contar duas vezes.
**Anotado:** 2026-09-16, ao implementar os Ataques Desarmados.

### Poder da Trindade: recuperação diária e encerramento do estado

**Onde:** `src/systems/afty/afty-alto-nivel.js` (`api_poder_da_trindade`), `afty-combate.js` e `ficha/ficha-sessao.js`.

**Situação:** o texto enviado pelo autor já consta no catálogo. Falta a ativação e a ligação dos efeitos. O motor separa RD geral de RD à alma, portanto os 40 contra todos os tipos precisam alcançar ambas. A ficha possui um único descanso e ainda não representa sucesso automático nas rolagens.

**Precisa:** definir se o uso diário é recuperado manualmente ou pelo botão Descansar. Confirmar quando cobrar os 2 pontos de exaustão se o estado for desligado ou o combate terminar antes da virada de rodada. Confirmar se os acertos automáticos e os +10 de dano também abrangem Feitiços com jogada de ataque.

**Anotado:** 2026-09-14, pedido de ativação de Poder da Trindade. Perguntas enviadas ao autor, implementação aguardando essas decisões.

### Controlador: as reações que rolam dado não têm onde aparecer

**Onde:** `src/systems/afty/afty-invocacoes.js` (`opcoesDeUso`)

**Situação:** duas habilidades fecham um número que a mesa precisa no meio da luta e não têm
onde aparecer.

- **Proteger Invocação (2°)** *"reduzir o dano que ela receberá em um valor igual a Xd6 + seu
  modificador de Presença ou Sabedoria. X é igual ao seu bônus de treinamento."*
- **Proteção Avançada de Invocação (6°)** *"a reação para reduzir dano normal tem seu valor
  aumentado para Xd8"*, e *"você receberá apenas metade do dano total"*.

Isso é exatamente o formato de **Autonomia** e **Resistência Sobrecarregada**, que já viram
pílula na linha "Uso" do card da invocação com o número pronto (`2 * grau PE`, `N PE, +N0 PV`).
As duas de cima ficaram de fora, e a mesa reabre o livro para saber quanto rola.

**Precisa:** o autor confirmar duas coisas antes de eu ligar.
1. O modificador é **escolha do jogador** entre Presença e Sabedoria, ou é sempre o maior?
2. Com Proteção Avançada, o `Xd8` **substitui** o `Xd6` (é o que "aumentado para" sugere), certo?

**Anotado:** 2026-09-02, na revisão de todos os poderes de Controlador

---

### Controlador: seis poderes dão bônus que dependem de POSICIONAMENTO

**Onde:** o Motor não tem canal para isto em nenhum sistema

**Situação:** seis habilidades dão número, e o número depende de quantas invocações estão perto
de alguém. A ficha não sabe posição, então nenhuma delas está ligada:

| habilidade | o que dá | de quem depende |
|---|---|---|
| Guarda Viva (2°) | +1 de Defesa **ao dono** por invocação a 3 m | quantas estão a 3 m |
| Rede de Detecção (2°) | +2 em Percepção e +2 de Atenção **ao dono**, por invocação a 3 m | idem |
| Camuflagem Aprimorada (2°) | 10% de erro por invocação adjacente | adjacência |
| Combate em Alcateia (6°) | +1 Nível de Dano **ao dono** por invocação no alcance do alvo | posição do alvo |
| Táticas de Alcateia (6°) | −metade do BT na Defesa e nos TRs **do inimigo** flanqueado | flanqueamento |
| Flanco Avançado (10°) | idem, ampliado | idem |

Elas caem em duas famílias diferentes: as quatro primeiras mexem no DONO, as duas últimas no
INIMIGO. A do inimigo não tem ficha onde escrever, e provavelmente é de mesa para sempre.

As do dono têm uma saída pronta e usada no projeto: a **bancada de combate**
(`COMBATE_ESTADOS`), onde um estado vira variável de DSL e o `quando` liga o efeito. Bastaria um
estado numérico do tipo "invocações a 3 metros" para as três primeiras passarem a somar.

**Precisa:** o autor dizer se quer esse estado na bancada. Ele é um contador (0 a N), e a
bancada hoje tem interruptores e faixas, não contadores livres.

**Anotado:** 2026-09-02, na revisão de todos os poderes de Controlador

---

### Controlador: Frenesi da Invocação e Companheiro Avançado

**Onde:** `src/systems/afty/afty-invocacoes.js`

**Situação:** dois casos que não cabem em nenhuma das listas acima.

**Frenesi da Invocação (2°)** dá à invocação, por uma rodada, **−5 de Defesa e −5 em testes de
resistência**, em troca de atacar duas vezes. É estado temporário, e a invocação **não tem
bancada de combate** (a bancada é da criatura). Ligar isso é criar uma bancada para a invocação,
que é sistema novo, não um canal.

**Companheiro Avançado (4°)** faz o companheiro *"se tornar também um aliado de um tipo a sua
escolha... começa como iniciante, no nível 6 veterano e no 12 mestre"*. Depende do sistema de
**Aliados**, que o Afty ainda não tem como catálogo próprio.

**Precisa:** o autor dizer a prioridade das duas. Nenhuma é conserto, as duas são sistema novo.

**Anotado:** 2026-09-02, na revisão de todos os poderes de Controlador

---

### Invocação: o bônus de Característica em Jogadas de Ataque não chega às Ações

**Onde:** `src/systems/afty/afty-invocacoes.js` (`acertoDe` em `resolveTestesInvocacao`, e
`resolveAcao`)

**Situação:** a Característica de Teste com alvo **Ataque** soma só na Jogada de Ataque da própria
criatura, a linha do golpe improvisado. O `bonusAtaque` de cada Ação não a lê: ele soma atributo,
treino, metade do Nível de Controlador e o canal `acerto`, e para aí. Já o canal `acerto` do Motor
alcança as duas.

Achado ao ligar o Motor na Característica Livre. A regra "duas Características com o mesmo efeito não
acumulam" pedia que o `acerto` de uma Livre disputasse com a Característica de Ataque, e as duas não
mexem no mesmo número. Por isso hoje elas **não** disputam, e isso está escrito no
`agregarCaracteristicas`.

**Precisa:** o autor dizer se "bônus em Jogadas de Ataque" vale para as Ações da invocação. Se valer,
a Característica passa a somar no `bonusAtaque` das Ações, e aí ela e o `acerto` da Livre viram o
mesmo efeito e passam a disputar.
**Anotado:** 2026-09-10, ao ligar o Motor na Característica Livre

### O "enquanto" da Característica Livre não enxerga estado de mesa

**Onde:** `src/systems/afty/afty-invocacoes.js` (`buildInvocacaoDslContext`)

**Situação:** o Motor da Livre avalia no namespace da invocação: grau, atributos, tipo, marcadores, o
`nd` e o `bt` do dono, mais `sempre` e `nunca`. Nada de sessão: em campo, auxílio ligado, PV atual ou
os estados da bancada do dono. Uma Característica que valha "enquanto estiver em campo" não tem
variável, e o nome que não existe fica vermelho no editor.

**Precisa:** o autor dizer se o contexto da invocação ganha o estado da sessão dela. O
`sessao.invocacoes` já chega ao `resolveInvocacao` para os auxílios, então o cano existe. É o mesmo
caminho que a Frenesi da Invocação pediria.
**Anotado:** 2026-09-10, ao ligar o Motor na Característica Livre

### ASSUNÇÃO: no pool do jogador, cada família de Invocação disputa só consigo mesma

**Onde:** `src/systems/afty/afty-efeitos.js` (`FAMILIAS_EXCLUSIVAS`, campo `grupoJogador`)

**Situação:** a divergência `poolExclusivo` (2026-09-11) partiu o pool do jogador em grupos. O autor
listou *"SE ACUMULAM COM OS ACIMAS E ENTRE SI (Ações Invocações, Caracteristicas Invocações;
Habilidades Únicas de Itens)"*, e na mesma conversa explicou que a Habilidade Única de um item **não**
soma com a de outro item. Por isso o "entre si" foi lido como "entre as categorias", e não "dentro da
mesma família".

As duas famílias de Invocação (`shikigamiAcao` e `shikigamiCaracteristica`) ficaram com a mesma
leitura: cada uma no próprio grupo, somando com todo o resto e disputando só consigo mesma. Hoje isso
não move número nenhum, porque **nenhuma das duas emite efeito** (não existe cano da invocação para o
pool do dono). Os auxílios de Invocação ligados na mesa somam sem `exclusivo`.

**Precisa:** o autor confirmar. Duas Ações de Shikigami dando +2 de Defesa ao dono somam (+4) ou vale
a maior (+2)? E uma Ação com uma Característica? Se somarem, o `grupoJogador` delas deixa de existir e
o assert `t-bencao-forja.mjs` muda na tabela dos grupos.
**Anotado:** 2026-09-11, ao ligar o pool em grupos do jogador

### Ficha de Player: as etapas de Linha de Treinamento que pedem teste

**Onde:** `src/systems/afty/afty-treinamentos.js`, `AftyCreatureBuilder.jsx` (`TreinoLinha`)

**Situação:** o Treino Especial do jogador passou a anotar a tentativa em 2026-09-16 (Interlúdios,
Sucessos, Ganhos e a CD, divergência `interludioComTeste`). As etapas das Linhas de Treinamento que
pedem teste continuam como antes: marcar a etapa já concede, e o jogador só marca depois de passar
na mesa.

**Precisa:** o autor dizer se as etapas com teste ganham a mesma anotação. O pedido de 2026-09-16
falou só de Feitiço e Habilidade.
**Anotado:** 2026-09-10, na varredura dos restos de "criatura" no /Player
**Nota:** reescrita em 2026-09-16, quando a metade do Treino Especial foi feita.

### PERGUNTA AO AUTOR: o desempate entre Imunidade e Vulnerabilidade
**Onde:** `src/systems/afty/afty-defesas-dano.js`, `asserts/t-defesas-dano.mjs`
**Situação:** a aba de Resistências (então chamada Defesas) nasceu em 2026-09-02 e resolve as quatro
coisas por tipo de dano. O
que ela NÃO faz é escolher um vencedor quando o mesmo tipo recebe dois estados (a ficha diz
vulnerável e uma habilidade concede imunidade, por exemplo): ela mostra os dois e levanta um AVISO.

Isso é deliberado, e não um estado provisório por preguiça: a regra de desempate é do LIVRO. Escolher
aqui um "imunidade sempre ganha", ou o "resistência e vulnerabilidade se cancelam" que é convenção de
outros sistemas e não deste, esconderia a pergunta dentro de um número que parece certo.

Conflito é raro por construção: a Composição Elemental, a única aptidão que dá os dois, dá imunidade
a um tipo e vulnerabilidade ao tipo OPOSTO, que são tipos diferentes.

**Precisa:** o autor dizer o que acontece quando dois estados caem no mesmo tipo. Se houver regra, o
`resolveDefesasDano` passa a aplicá-la e o assert do conflito em `t-defesas-dano.mjs` é o primeiro
que tem de mudar.
**Anotado:** 2026-09-02, ao criar a aba de Defesas

### PERGUNTA AO AUTOR: o modal de import diz "N importadas" contando as recusadas
**Onde:** `src/components/Dashboard.jsx` (`ImportModal`, o `applyResult`, e o `handleImportResult`)
**Situação:** a mensagem de sucesso do modal de import conta o que o `parseImportText` leu, e não o
que entrou. Desde 2026-10-03 a porta de entrada vale nas três rotas, e um pacote com uma ficha de
cada livro importado no `/Afty` mostra "5 criatura(s) importada(s) com sucesso" quando só 2
entraram. O aviso "Fichas de Outro Grimório" do `App.jsx` abre por cima e diz o número certo, mas
ao fechá-lo a mensagem errada continua no modal. No Grimório público isso acontece desde
2026-09-12, com a primeira porta.

O número certo já existe: o `importMany` devolve `imported` e `skipped`, e o `handleImportResult`
do Dashboard só não o repassa para o modal.
**Precisa:** o autor dizer se o modal passa a contar o que entrou. A mudança é em `src/components/`
e vale para a 2.5.2 também, então entra pela forma 3 da lista do `AGENTS.md` (pedido do autor).
**Anotado:** 2026-10-03, ao medir a porta de entrada nas três rotas

### PERGUNTA AO AUTOR: a RD Específica pode ser aposentada?
**Onde:** `src/systems/afty/afty-derive.js` (`rdEspecifico`), `AftyTabDefesas.jsx`, o Preview e a
Ficha Final
**Situação:** em 2026-07-30 o autor decidiu que a RD Específica *"vai VIRAR RD POR TIPO DE DANO"*.
Ela era o jeito dele de tratar RD contra um tipo único quando eram poucos casos. O bloqueio de então
era a lista de tipos, que tinha só quatro, e **esse bloqueio caiu em 2026-09-02**: `TIPOS_DANO` tem
os quinze do livro e o canal `rdTipo` existe.

Hoje ela é uma quarta pilha que ninguém alimenta: nasce da fórmula por Tipo na criatura (Conjurador
e Misto), aceita override, aparece no Preview e na Ficha, e **não tem nenhum tipo de dano associado**,
que é justamente o que a substituição resolveria.

Na aba de Resistências ela já entra escondida quando vale zero (2026-09-05), para não dar destaque a uma
pilha de saída. Isso é paliativo, e não decisão.

**Precisa:** o autor dizer se a substituição vale agora. Se valer, o trabalho é migrar a fórmula por
Tipo para linhas de `rdTipo` e tirar `rdEspecifico` do `OVERRIDABLE`, do Preview e da Ficha, com
migração para as fichas que tenham override gravado nela.
**Anotado:** 2026-09-05, ao pôr as fontes de RD na aba de Defesas

### Automatizar os 16 encantamentos de Uniforme e Escudo que dependem de combate
**Onde:** `src/systems/afty/afty-equipamentos.js`, Ficha Final e Encontros
**Situação:** a revisão de 2026-10-05 ligou Resiliente e os dois Isolante; os 11 efeitos passivos
das duas listas agora funcionam. Os outros 16 ainda conservam apenas o texto da regra.
Uniforme: Aeronauta, Distorcivo, Escaldante, Estimulante, Impulso, Repulsor, Revestido com Espinhos
e Ricochete. Escudo: Avassalador, Bloqueador, Destruidor, Disco, Espinhoso, Esponja,
Expansão de Escudo e Intangível. Detalhamento em `docs/afty-equipamentos.md`.
**Atualização 2026-11-06 (CX5):** os controles de cargas, reações, duração e números dos 16 existem
em `ficha/ficha-encantamentos.js` (matriz em `entregas/CX5.md`), com asserts. Falta o que depende
de arquivo reservado: a linha de ataque do escudo nas Ações e a leitura de `escudoSuspenso` na RD
(derive), a mão livre do Intangível nos requisitos, e as telas de uso. O efeito em outra criatura
(Bloqueador, Expansão de Escudo, Repulsor sobre o alvo) é da mesa e do CX6.
**Precisa:** ligar as telas e o derive como acima. Os pré-requisitos já estão estruturados e devem
continuar valendo.
**Anotado:** 2026-10-05, revisão pedida pelo autor

### Confirmar o total de perícias das quatro Classes que o autor não citou
**Onde:** `src/systems/afty/afty-especializacoes.js`, `caracteristicas.pericias`
**Situação:** em 2026-08-31 o autor desmontou a frase do pacote de Classe: *"Especialista em Combate
(Combatente) fornece 2 Ofícios, Atletismo ou Acrobacia e 3 a Escolha. Totalizando 6 Perícias."* A
frase tem três partes, e o que separa a segunda da terceira é a pontuação: **"ou" é escolha, vírgula
é as duas**.

O parse foi aplicado às seis, e **duas estão confirmadas pelo autor** (Combatente 6 e Conjurador 6,
este da mensagem anterior). As outras quatro saem do mesmo parse e ninguém confirmou:

| Classe | Como ficou | Total |
|---|---|---|
| Lutador | 1 Ofício + 1 entre Atletismo ou Acrobacia + 3 quaisquer | 5 |
| Suporte | 2 Ofícios + Medicina + Prestidigitação + 3 quaisquer | **7** |
| Controlador | 1 Ofício + Percepção + Persuasão + 2 quaisquer | 5 |
| Restringido | 1 Ofício + 4 quaisquer, exceto Feitiçaria | 5 |

O que chama atenção é o **Suporte com 7**, o maior de todos, e é consequência de a lista dele ser por
vírgula ("Medicina, Prestidigitação") em vez de "ou".
**Precisa:** o autor conferir os quatro números. Se algum estiver errado, o que muda é só a linha
`pericias:` daquela Classe.
**Anotado:** 2026-08-31, ao aplicar o parse que o autor deu para o Combatente

### ASSUNÇÃO: `gemeosSemTecnica` abre as DUAS do Sem Técnica, e não só as nomeadas

**Onde:** `src/systems/afty/afty-origens.js` (`opcoesVerdadeirasOrigens`)
**Situação:** o autor pediu (2026-08-21) que o Gêmeo pudesse copiar **Estudos Dedicados** e
**Empenho Implacável**. A liberação foi implementada tirando o **Sem Técnica inteiro** da lista de
proibidas, e não nomeando as duas.

Hoje o resultado é idêntico: o Sem Técnica tem três características, e a terceira é o Bônus em
Atributo, que o filtro genérico já tira de toda origem. Sobram exatamente as duas.

**Onde isso diverge:** no dia em que o Sem Técnica ganhar uma QUARTA característica, ela entra
sozinha na lista do Gêmeo, sem ninguém decidir. É o mesmo envelhecimento calado do requisito `nota`.
**Precisa:** o autor dizer se a regra é "o Gêmeo pode copiar do Sem Técnica" (e aí está certo como
está) ou "o Gêmeo pode copiar estas duas" (e aí a liberação tem de nomeá-las).
**Anotado:** 2026-08-21, ao implementar a segunda liberação

### Coleta de Talismãs concede shikigami e a aba de Invocações não sabe

**Onde:** `asserts/exemplo-estilo-liberado.json` (o Talento `coleta_de_talismas`)
**Situação:** o Talento dá um shikigami de 4° grau, e mais um de 3°, 2° e 1° nos níveis 5, 10 e 15.
A aba de Invocações **não tem orçamento**: a pessoa cria a invocação que quiser, e nada conta quantas
ela pode ter. Então o Talento entra como texto e a criação acontece à mão, do jeito que já acontece
com toda invocação.
**Onde isso incomoda:** o "conforme as regras padrão de invocações" fica com o Mestre, e ninguém
avisa se a pessoa criar cinco talismãs em vez de um.
**Precisa:** o autor dizer se a Invocação vai ganhar orçamento algum dia. Se ganhar, este Talento é
o primeiro cliente, e o canal seria algo como `vagasInvocacao` por grau.
**Anotado:** 2026-08-22

### O Domínio Simples remendado perdeu a Durabilidade, e outra Aptidão a cita

**Onde:** `asserts/exemplo-estilo-liberado.json` (o remendo em `dominio_simples`)
**Situação:** o texto novo do autor troca o parágrafo inteiro de Concentração e Durabilidade por
"pagar 2 PE para sustentar". Nenhum número do Afty lia aquela Durabilidade (ela era só texto), então
o motor não sente. Mas o **Anular Técnica** (`anular_tecnica`) diz *"Você aprimora o seu domínio
simples"* e pede `dominio_simples` como pré-requisito, e outras entradas citam o Domínio Simples no
texto delas sem saber que ele mudou.
**Precisa:** o autor conferir se alguma outra Aptidão de Domínio precisa acompanhar a mudança.
**Anotado:** 2026-08-22

### `remendadoPor` existe e nenhuma tela mostra

**Onde:** `src/systems/afty/afty-addons.js` (`remendarLista`)
**Situação:** uma entrada remendada por Addon carrega `remendadoPor: [{ id, nome }]`, e nada na
interface diz que aquela linha não é mais a do livro. Quem abre a ficha de outra mesa lê o Domínio
Simples com sustentação em PE e não tem como saber que aquilo veio de um pacote.

O chip de "não raw" no cabeçalho da Ficha já avisa que a criatura tem Addon, mas ele não aponta QUAL
linha mudou.
**Precisa:** decidir onde a marca aparece. O candidato natural é o mesmo chip verde das fontes
concedidas, na linha da entrada.
**Anotado:** 2026-08-22, ao construir o remendo

### Os números da Natureza Amaldiçoada estão escritos em DOIS lugares

**Onde:** `src/systems/afty/afty-efeitos-conteudo.js` (`ORIGEM_EFEITOS.maldicao`) e
`src/systems/afty/afty-origens.js` (`ORIGEM_ESCOLHA_EFEITOS.vo_maldicao_natureza_amaldicoada`)
**Situação:** as duas linhas da Natureza Amaldiçoada (`vagasAptidao: 1 + (nd >= 10) + (nd >= 15)` e
`pe: nd`) foram COPIADAS para o segundo lugar em 2026-08-29, para a característica copiada em
Verdadeiras Origens trazer os números dela.

A cópia é literal e existe por um motivo estrutural: `ORIGEM_EFEITOS` é chaveado pela ORIGEM inteira,
e a Maldição tem três características. Não há como perguntar àquele mapa qual linha pertence à
Natureza Amaldiçoada.

**Onde isso quebra:** o dia em que a Maldição ganhar uma quarta característica COM NÚMERO, ou em que
os números da Natureza Amaldiçoada mudarem no livro. A Maldição de verdade muda e o Gêmeo que copiou
continua no valor velho, em silêncio. Há assert prendendo a igualdade dos dois lados, então o
sintoma aparece ao rodar `npm run asserts`, mas só se alguém rodar.
**Precisa:** se aparecer uma terceira característica com número, quebrar o `ORIGEM_EFEITOS` por
característica de vez, em vez de copiar de novo.
**Anotado:** 2026-08-29

### Requisito de Aptidão do tipo `origem` não enxerga a origem COPIADA

**Onde:** `src/systems/afty/afty-aptidoes.js` (`avaliarRequisitoAptidao`, `ctx.origemId ===
requisito.id`) e `AftyCreatureBuilder.jsx`, que passa `draft.core?.origem?.id`
**Situação:** o Talento já respeita `origensQualificadas` no requisito de origem desde 2026-08-07,
porque o texto do Gêmeo diz *"considera a origem escolhida como sua para todos os fins de
qualificação"*. A Aptidão continua comparando com a origem GRAVADA.

Hoje só uma aptidão tem esse requisito, e ela pede o **Herdado**. Então um Gêmeo que copiasse uma
característica de clã Herdado deveria alcançá-la e não alcança.
**Onde isso vai doer mais:** se alguma Aptidão de Maldição ganhar `{ tipo: "origem", id: "maldicao" }`
algum dia, o Gêmeo que copiou da Maldição veria a aba e não conseguiria pegar a aptidão.
**Precisa:** o autor dizer se "todos os fins de qualificação" cobre Aptidão Amaldiçoada. Se cobrir, é
trocar por `origensQualificadas().includes(...)`, do mesmo jeito que o Talento faz.
**Anotado:** 2026-08-29, ao ligar a origem estrutural

### Conceder FEITIÇO no meio da luta ainda não dá

**Onde:** `src/systems/afty/afty-concessao.js` (`FAMILIAS_CONCESSAO`)
**Situação:** a primitiva 8.3 concede as **7 famílias de id de catálogo**, e o autor pediu
"Habilidades de Especialização, **Feitiços**, Treinos e qualquer coisa". O Feitiço ficou de fora
porque ele NÃO é id de catálogo: é objeto criado dentro da ficha (`creature.feiticos`), então
conceder um não é acrescentar um id, é escolher **de onde copiar**. As outras seis famílias
entraram pelo mesmo caminho de uma linha cada, e esta precisa de uma interação nova.
**Precisa:** decidir de onde vem o Feitiço concedido. Três leituras que já dão telas diferentes:
copiar de outra criatura salva, escolher de uma lista que um addon traga pronta, ou o mestre
montar na hora com a calculadora de criação que já existe.
**Anotado:** 2026-08-20, ao fechar a 8.3

### Concessão de item com escolha aninhada entra com a escolha VAZIA

**Onde:** `src/systems/afty/afty-concessao.js` e os `resolveEscolhas*` das famílias
**Situação:** vários Talentos e Habilidades têm escolha aninhada (qual atributo, qual perícia, qual
estilo). A escolha mora em `creature.escolhasTalento` / `escolhasHabilidade`, que são campos da
FICHA, e a concessão vive na sessão e não encosta na ficha. Resultado: conceder um item com escolha
aninhada faz valer o que ele dá sem escolha, e a parte que dependia da escolha fica em nada.
Não é silencioso a ponto de enganar (o item aparece na lista de concedidos), mas também não avisa.
**Precisa:** decidir se a escolha da concessão vai junto na pega (um campo `escolhas` ao lado do
`alvo`, que já existe para o Treino Especial) ou se concessão com escolha simplesmente não é
oferecida. O `alvo` já abriu meio caminho.
**Anotado:** 2026-08-20, ao fechar a 8.3

### "Agilidade no Campo de Batalha" nasceu no Conjurador, e o Ápice do Controlador a cobra
**Onde:** `src/systems/afty/afty-alto-nivel.js` (`api_rei_do_tabuleiro`) e
`src/systems/afty/afty-habilidades.js` (`cnj_agilidade_no_campo_de_batalha`)
**Situação:** o Ápice *Rei do Tabuleiro* (Controlador 20°) sempre citou "Agilidade no Campo de
Batalha" como requisito `nota`, porque a habilidade não existia no Afty. Em 2026-08-12 ela entrou,
vinda da versão **2.0** do livro, mas como habilidade de **Conjurador** de 6° nível. O texto do
Ápice bate com ela ("o custo para utilizar Agilidade no Campo de Batalha se torna zero, além de
você poder a utilizar uma segunda vez dentro de seu turno" contra "gastar 2 pontos de energia para
realizar uma segunda ação bônus"), então provavelmente é a mesma. Apontar o requisito para o id
dela transformaria o Ápice do Controlador em exigência de **multiclasse** Conjurador 6, e por isso
ficou como `nota`.
**Precisa:** o autor dizer se o Controlador tem a versão dele da habilidade (que ainda não foi
transcrita) ou se o Ápice passa a exigir a do Conjurador. Se for a segunda, é trocar a `nota` por
`{ tipo: "habilidade", id: "cnj_agilidade_no_campo_de_batalha" }`.
**Anotado:** 2026-08-12, ao transcrever a primeira habilidade `[2.0]`

### Com a Expansão de Domínio no ar, dá para COMPRAR o 6° e o 7° nível de trilha
**Onde:** `src/systems/afty/afty-aptidoes.js` (`resolveNiveisAptidao`) e o `NivelPicker` do criador
**Situação:** as duas metades nasceram no mesmo dia, de lados diferentes. A Expansão de Domínio
(GoliasK) sobe o nível E o limite de Aura, Controle e Leitura e Energia Reversa em 2, e a
Versatilidade Extrema (mesma data) obrigou a ALOCAÇÃO a respeitar o limite da trilha em vez do 5
fixo. Juntas, elas fazem o seletor de níveis oferecer o 6° e o 7° enquanto o domínio está ligado na
bancada, gastando orçamento comum.
Não é destrutivo: o aparo é de leitura, então desligar o domínio devolve o ponto ao orçamento e a
trilha volta a 5. Mas é compra PERMANENTE dentro de uma janela TEMPORÁRIA, e ninguém decidiu isso.
**Precisa:** o autor dizer se o limite temporário deve valer só para concessão (aí a alocação passa
a ser aparada no limite PERMANENTE, e é uma linha) ou se comprar ali é legítimo.
**Anotado:** 2026-08-12, ao integrar o commit 985bb79 com o trabalho local

### ASSUNÇÃO: em que ORDEM o Ritual e a Liberação Máxima se compõem
**Onde:** `src/systems/afty/afty-feiticos.js` (`calcularFeiticoDano` e `calcularFeiticoCurativo`)
**Situação:** os dois suplementos mexem nos mesmos números e **nenhum dos dois textos fala do
outro**. A Expansão de Área do Ritual SOMA metros e a melhoria Área da Liberação DOBRA. O Aumento
de Alcance do Ritual SOMA e a Expansão de Limites da Liberação MULTIPLICA.

Hoje o motor **multiplica primeiro (Liberação) e soma depois (Ritual)**. O critério foi que os
metros do Ritual estão escritos em ABSOLUTO no texto dele: somar antes faria a Liberação dobrar
também o bônus do Ritual, e aí os números impressos na regra do Ritual deixariam de bater com a
tela. Exemplo real, Feitiço de Nível 4 em área: base 12m, com as duas vira `(12 × 2) + 1,5 = 25,5m`.
Na outra ordem daria `(12 + 1,5) × 2 = 27m`.

CD e Acerto não têm essa dúvida: os dois lados somam, e soma não tem ordem.
**Precisa:** o autor confirmar a ordem ou inverter. É uma linha em cada calculador.
**Anotado:** 2026-08-10, no merge com a Conjuração em Ritual

### ASSUNÇÃO: Estímulo de Saída num Auxiliar de vários alvos
**Onde:** `src/systems/afty/afty-feiticos.js` (`calcularEfeitoAux`)
**Situação:** o valor de um efeito auxiliar se DIVIDE entre os alvos. O Estímulo de Saída foi
somado **depois** dessa divisão, então cada alvo recebe o bônus inteiro da melhoria. Somar antes
faria a mesma Liberação Máxima valer menos em cada alvo quanto mais alvos o Feitiço tivesse, e o
texto da melhoria fala do "valor do bônus", que é o número que chega em quem recebe.
**Precisa:** o autor confirmar ou inverter. É uma linha de código, mas muda bastante o valor de
um Auxiliar de área.
**Anotado:** 2026-08-09, chat de Liberações Máximas (não foi perguntado, apareceu na implementação)

### ASSUNÇÃO: Otimização de Energia vale só para Ação com Custo
**Onde:** `src/systems/afty/afty-invocacoes.js` (`resolveAcao`)
**Situação:** a habilidade diz *"escolher uma habilidade com custo de cada invocação para ter esse
custo reduzido em 1PE"*. Foi implementada valendo só para **Ação com Custo**, que é o termo
definido do capítulo. A outra leitura possível é "qualquer ação que tenha custo", e aí ela também
morderia os **2 PE obrigatórios da Cura**, que são custo de regra e não a mecânica opcional.
**Precisa:** o autor confirmar. É uma condição só, no ponto em que hoje se lê `acaoComCusto`.
**Anotado:** 2026-08-16, ao ligar a habilidade

### ASSUNÇÃO: Crítico Aprimorado desce a margem só das JOGADAS DE ATAQUE
**Onde:** `src/systems/afty/afty-invocacoes.js` (`margemCritico`) e `ficha/abas/AbaInvocacoes.jsx`
**Situação:** o texto diz *"Um 19 se torna crítico também para suas invocações"*, sem dizer em quê.
Como ele é pré-requisitado por Crítico Brutal, que fala de acertos críticos em ação de ataque, a
margem 19 foi aplicada só às Jogadas de Ataque da invocação. Perícias e Testes de Resistência dela
continuam em 20.
**Precisa:** o autor confirmar, ou dizer que vale para toda rolagem dela.
**Anotado:** 2026-08-16, ao ligar a habilidade

### FALTA o texto em prosa dos Feitiços Auxiliares
**Onde:** `src/systems/afty/afty-feiticos.js` (bloco FEITIÇOS AUXILIARES)
**Situação:** o sistema tem as TABELAS dos 17 efeitos, transcritas verbatim (17 × 7 níveis × 3
durações), e uma auditoria em 2026-09-07 varreu as 357 células sem achar erro de transcrição:
nenhum buraco no meio de coluna, nenhum valor caindo ao subir de nível, nenhuma coluna mais longa
valendo mais que uma mais curta, e todo metro na grade de 1,5m. O bloco 8 de
`asserts/t-auxiliar-atributo.mjs` tranca as quatro propriedades.

O que NÃO existe é a PROSA. As regras que hoje estão no código foram reconstruídas de decisões do
autor em conversa, e não de texto de livro: o que cada duração significa, o "um único ataque", os
tipos de dano extras do RD, a Concentração, o Múltiplos Efeitos e o Aumento de Atributo. Sem elas
não dá para auditar exceção nenhuma, só número.

**Precisa:** o autor mandar o texto em prosa dos Auxiliares. Aí a auditoria de exceções sai.
**Anotado:** 2026-09-07, na auditoria numérica dos Auxiliares

### A Duradoura no mínimo de rodadas domina a Sustentada em 62 de 68 pares
**Onde:** `src/systems/afty/afty-feiticos.js` (`valorDuradoura`, `faixaRodadasDuradoura`)
**Situação:** pelo mesmo custo em PE e sem pagar upkeep, a Duradoura no MÍNIMO de rodadas entrega
mais que a Sustentada do mesmo nível em 62 dos 68 pares em que as duas colunas existem. E esticar a
duração perde valor mais que proporcionalmente: Defesa nível 5 dá 9 por 4 rodadas (36
pontos-rodada), 4 por 5 rodadas (20) ou 3 por 6 rodadas (18).

Não é bug: é o que a fórmula `valor ÷ (rodadas − ⌈nível/2⌉)` do livro faz, e ela está implementada
certo. O efeito colateral é que o seletor de rodadas, em valor total, é uma descida: existe uma
escolha boa (o mínimo) e várias piores.

**Precisa:** o autor dizer se é intencional. Se a ideia era oferecer troca de altura por duração, a
fórmula precisa de outro divisor.
**Anotado:** 2026-09-07, na auditoria numérica dos Auxiliares

### A Transformação aceita o MESMO efeito em vários slots
**Onde:** `src/systems/afty/afty-feiticos.js` (`calcularFeiticoTransformacao`) e o
`TransformacaoEditor` em `AftyCreatureBuilder.jsx`
**Situação:** três Aumentos de Defesa nos três slots de uma Transformação passam sem aviso nenhum,
e o `Select` de cada slot oferece o catálogo inteiro. Já o **Múltiplos Efeitos** do Auxiliar
PROÍBE repetir (*"dois Aumentos de Defesa no mesmo Feitiço não existem"*, autor), e lá o seletor
nem mostra o efeito já usado (`efeitosDisponiveisMult`). As duas telas concedem conjuntos de
efeitos auxiliares, então a divergência parece descuido.

**Nota (2026-09-07):** o **Aumento de Atributo** virou EXCEÇÃO à trava de não repetir, por decisão
do autor: *"não está dando duas vezes o mesmo efeito, está fornecendo Atributo para Atributos
DIFERENTES"*. A trava dele passou a ser por ATRIBUTO, medida sobre o Feitiço inteiro
(`atributosRepetidos`). Se a Transformação seguir a regra do Múltiplos Efeitos, ela herda a exceção
junto.
**Precisa:** o autor dizer se a Transformação segue a mesma regra. Se seguir, é filtrar o `Select`
pelo mesmo caminho que o Múltiplos Efeitos já usa.
**Anotado:** 2026-08-09, revisão de Transformação e Auxiliares

### FALTA o texto verbatim do Estudos
**Onde:** `src/systems/afty/afty-treinos-especiais.js` (catálogo) e o card
`Interlúdios · Treinos Especiais` do criador
**Situação:** os Treinos Especiais (Interlúdios Adicionais, Livro do Narrador p. 22) ganharam
sistema em 2026-08-18. Três estão no catálogo (**Treinamento para Feitiço**, **Treinamento para
Habilidade** e **Treinamento para Aptidão**) e o **Estudos** segue como cartão "em breve", porque
só existe a paráfrase da aba
("4 testes de INT/SAB, CD 12 + maestria, 2 sucessos concedem maestria, ou 3 testes CD 15 + nível
para especialista"), nunca conferida contra o livro.
**Precisa:** o autor mandar o texto. Entra como DADO no catálogo (`id`, `nome`, `focos`,
`vezesACada`, `concede`, `descricao`, `efeitos`, e no jogador `sucessosNecessarios`, `cdTeste` e
`tetoJogador`), sem tocar em código, e apaga o `InterludioInfo` correspondente. Ele provavelmente é
o primeiro a usar o campo `alvo` da instância (ele nomeia uma perícia) e o canal
`proficienciaPericia`. A CD dele não é a metade do Nível, e o `cdTeste` já aceita outra expressão.
**Anotado:** 2026-08-18, ao criar os Treinos Especiais
**Nota:** o texto do Treinamento para Habilidade chegou em 2026-09-16 e já está no catálogo.
**Nota:** o Treinamento para Aptidão entrou em 2026-10-04 por pedido do autor, seguindo os parâmetros da Habilidade e concedendo Aptidões Amaldiçoadas.

### DECIDIR: fonte display baixada para a Ficha (arquivo no repositório)
**Onde:** `public/` mais um `@font-face` em `src/systems/afty/ficha/ficha.css`
**Situação:** o tema Santuário Malevolente (Sukuna) pede uma display com peso e verticalidade, e
**tema nenhum consegue trazer fonte**: `@import` é removido pelo `saneiaCss` e `@font-face` não vale
dentro de `@scope`, ou seja, morre exatamente quando o escopo funciona. Hoje o tema usa pilha mincho
do sistema (`Yu Mincho`, `Hiragino Mincho ProN`, `Songti SC`, `MS PMincho`) com Georgia atrás, e
compensa na ESCALA. Funciona, mas o resultado muda de máquina para máquina: quem não tem mincho cai
no Georgia.
**Precisa:** o autor decidir se quer um `.woff2` no repositório. É barato (um arquivo em `public/` e
um `@font-face` na folha), mas **é mudança de app, não de tema**: a fonte passaria a existir para
TODAS as fichas, e o peso do arquivo entra no bundle de todo mundo. Se sim, definir também a licença
da fonte escolhida.
**Anotado:** 2026-08-18, ao montar o tema do Sukuna

### ASSUNÇÃO: Treinamento para Feitiço vale para Restringido e Sem Técnica
**Onde:** `src/systems/afty/afty-treinos-especiais.js` (`tes_feitico`)
**Situação:** o texto diz "Feitiço", e o Restringido não tem Feitiço (tem Técnica Marcial) e o
Sem Técnica também não (tem Técnica de Estilo). Foi deixado **aberto a toda origem**, porque a vaga
que ele concede é o canal `vagasFeitico`, cuja própria nota diz que ela vale para "Feitiço, Estilo
das Sombras ou Técnica Marcial", e porque o `deriveAfty` já soma `feiticos + estilo` no mesmo
gasto. Se estivesse errado, o conserto é um `foraDaOrigem: [...]` na entrada, igual às cinco Linhas
de energia amaldiçoada.
**Precisa:** o autor confirmar, ou dizer quais origens ficam de fora.
**Anotado:** 2026-08-18, ao criar os Treinos Especiais

### Especialista em Estilo: "manter dois Estilos da sombra durante uma rodada"
**Onde:** `addons/especialista-em-estilo.json` (regra de buff da Especialização)
**Situação:** a frase está no texto que o autor mandou em 2026-09-07, no fim do parágrafo de
*Habilidades de buff ou feitiço rápido*, verbatim: *"Ao utilizar do feitiço rápido segue a mesma
redução de ação, também é possível manter dois Estilos da sombra durante uma rodada quando essa
habilidade é utilizada em uma técnica de estilo."* Perguntado, o autor respondeu *"Não achei onde
está escrito isso"*, então ela **ficou de fora do pacote**: o texto da Especialização vai só até a
redução de ação.

Ela é a única parte mecânica daquele parágrafo, e tem duas leituras que dão sistemas diferentes.
Hoje o Estilo tem UM interruptor por ficha (`ESTADO_ESTILO_ATIVO` em `afty-estilo-sombras.js`), e
quem está no ar é o Domínio Simples.

1. **Dois Domínios Simples no ar ao mesmo tempo.** Pede um segundo interruptor e uma segunda conta
   de sustentação em PE.
2. **Duas Técnicas de Estilo imbuídas de graça naquela rodada.** Para as Técnicas da Expansão isto
   já vale para todo mundo desde 2026-10-11 (o autor liberou ligar quantas a ficha conhecer, e a
   DA-04 foi revogada). Só restaria nas LEGACY, pelo canal `imbuicoesEstilo`.

**Precisa:** o autor dizer se a frase vale e qual das duas ela é. Se for a segunda, para a Expansão
não há mais nada a fazer.
**Anotado:** 2026-09-07, ao montar o Especialista em Estilo

### Ritualizar Técnica de Estilo é procedimento de mesa
**Onde:** `src/systems/afty/afty-rituais.js`, `addons/especialista-em-estilo.json`
**Situação:** a regra de *Conjuração em ritual* do Especialista em Estilo diz que, ao ritualizar um
Estilo da Sombra, *"para cada efeito de ritual que você receber dele, você conta como se tivesse +1
nível de domínio extra"*. O autor decidiu em 2026-09-07: **procedimento de mesa por ora.** O texto
está no `descricao` da Especialização e nada do motor o calcula.

O que falta não é canal: `nivelAptidao` com alvo `dom` já existe e já apara no teto. Falta o
GATILHO. O `afty-rituais.js` inteiro só conhece Feitiço (as 12 melhorias dele falam em "nível do
Feitiço"), e a Técnica de Estilo não tem estado de ritual em lugar nenhum. Ritualizar Estilo é
sistema novo, e não uma linha.

**Precisa:** quando o autor quiser, abrir ritual para o Estilo. Aí o +1 por efeito vira
`nivelAptidao` com alvo `dom` lido do estado de ritual daquela conjuração.
**Anotado:** 2026-09-07, decisão 4 do autor

### Ápice e Lendária que citam habilidade de Conjurador não alcançam a herdeira
**Onde:** `src/systems/afty/afty-alto-nivel.js`, `src/systems/afty/afty-habilidades.js`
**Situação:** o `nivelEspec` do Alto Nível e os requisitos `{ tipo: "habilidade", id: "cnj_..." }`
apontam para ids do livro. Uma Especialização que HERDA do Conjurador tem clones com id próprio
(`<esp>__cnj_...`), então um Especialista em Estilo de ND 21+ não consegue pegar o Ápice que pede
*20 Níveis de Conjurador* mais `cnj_manipulacao_perfeita` e `cnj_dominancia_em_feitico`.

Aliasar só o `nivelEspec` não resolveria: os dois requisitos de habilidade continuariam presos ao
id cru. O conserto é fazer o avaliador resolver a herança nos DOIS eixos, provavelmente expondo do
`resolveHabilidades` uma lista de ids escolhidos já expandida com o original de cada clone
(`habilidadeHerdadaDe` já existe e responde isso).

**Precisa:** decidir se a herdeira herda também os pré-requisitos da mãe. Vale a pena só quando
alguém jogar um Especialista em Estilo acima do ND 20.
**Anotado:** 2026-09-07, ao montar a herança de Especialização
**Nota:** desde 2026-09-28 vale também para a herdeira do Restringido (Addon Fórmula de Combate Entrópica): o Ápice que pede *20 Níveis de Restringido* (`afty-alto-nivel.js`) lê o `niveisPorEspec` pelo id do livro. O nível de EFEITO já responde pela mãe (`niveisPorEfeito`), e o de pré-requisito ficou de fora de propósito, esperando esta decisão.

### LEITURAS ADOTADAS: o que um Nível de Exaustão FAZ (Livro p.324)
**Onde:** `src/systems/afty/afty-exaustao.js` (a regra), `afty-derive.js` (`opcoes.exaustao`), `ficha/ficha-sessao.js`
**Situação:** RESOLVIDA EM 2026-11-09. O autor pediu as penalidades dos Níveis 1 a 5, o teto de 6 e as
Condições automáticas, e disse que o resto é do mestre e NÃO entra no site: a morte no Nível 6, o descanso
longo tirar um Nível, os gatilhos de dia (fome, 8 horas sem descanso, cenas de combate) e o desmaio por
Descansos Longos. Não acrescente nenhum deles sem o autor pedir. Guia em `docs/afty-status.md`.
**Leituras minhas, sem resposta do autor** (a única pergunta feita foi a do Dano, respondida):
1. *"Todas as suas rolagens"* é Ataque, Resistência, Perícia, Iniciativa e Teste de Morte. O DANO não entra
   (resposta do autor).
2. O Nível 5 SUBSTITUI a perda de PV máximo do 3 (*"ao invés do padrão"*), e não soma. O Nível 6 segue a conta do 5.
3. A redução de 1,5 m por Nível entra no Motor e vale ANTES das Condições de movimento: com Lento, a metade corta o
   que sobrou.
4. Se a perda de PV máximo zeraria a vida, o livro manda desmaiar e não perder PV. A ficha NÃO aplica a perda e
   acende o aviso Desmaio na aba Buffs. O desmaio em si é do mestre.
5. As Condições impostas valem como as marcadas à mão e NÃO acumulam com elas. Desprevenido, Exposto e Desorientado
   derrubam a Guarda Inabalável, e o Enjoado do Nível 5 tira a conversão de ações.
6. A regra vale para a criatura e para o personagem, porque o contador já era dos dois. Se a criatura deve divergir,
   a linha entra em `DIVERGENCIAS` (`afty-sistema.js`).
**Anotado:** 2026-09-09, ao fazer o addon Vislumbre Celeste. **Fechada:** 2026-11-09

---

### PERGUNTA AO AUTOR: o texto de "Ler Energia" e "Ler Intenções"
**Onde:** `src/systems/afty/afty-vislumbre-celeste.js` (`VISLUMBRE_TEXTOS`)
**Situação:** o texto do Vislumbre cita três ações de leitura e define UMA, a Ler Técnica (teste de
Feitiçaria ou Percepção, CD 20 + 5 por grau acima do Quarto). As outras duas não existem em lugar
nenhum do sistema: o que existe são as Aptidões Leitura de Aura e Leitura Rápida de Energia, que são
parecidas e têm texto próprio. Hoje o benefício muda só a AÇÃO delas (Movimento coberto, Livre uma
vez por rodada descoberto), e o efeito é de mesa.
**Precisa:** o texto das duas, ou a confirmação de que elas são as Aptidões que já existem.
**Anotado:** 2026-09-09, ao fazer o addon Vislumbre Celeste

---

### O ponto de Fadiga do Vislumbre não entra sozinho no fim do turno
**Onde:** `src/systems/afty/ficha/PainelDoVislumbre.jsx`
**Situação:** *"No final de cada um dos seus turnos em que seus olhos estiverem descobertos, você
recebe 1 Ponto de Fadiga"*. A conversão em Exaustão ao chegar em 4 já é automática
(`acumulaFadiga`), e o que continua manual é o ponto POR TURNO: o painel tem o botão, a um clique.
A Ficha tem rodada, mas não tem um gancho de FIM DE TURNO onde um addon possa pendurar efeito.
**Precisa:** decidir se vale abrir esse gancho. Ele serviria a mais coisa que este addon: toda
sustentação por rodada hoje é lembrada pela pessoa.
**Anotado:** 2026-09-09, ao fazer o painel do Vislumbre na Ficha Final

---

### A Capacidade Impossível do Vislumbre não tem trava
**Onde:** `src/systems/afty/afty-vislumbre-celeste.js`, `afty-feiticos.js`
**Situação:** *"os Seis Olhos permitem ao usuário fazer um Feitiço c/ Pré-Requisito Impossível que só
pode ser utilizado enquanto os olhos estiverem descobertos"*. Um Feitiço com requisito Impossível já
é criável por qualquer um (é escolha do Feitiço, que troca dificuldade por dados e PE), então o que
falta é a TRAVA: marcar UM Feitiço como preso ao estado, e ele avisar na Ficha Final enquanto os
olhos estiverem cobertos.
**Precisa:** o autor dizer se a marca é escolha do jogador (um Feitiço qualquer) e se ela é uma só.
O desenho é o mesmo dos marcadores de Invocação.
**Anotado:** 2026-09-09, ao fazer o addon Vislumbre Celeste

---

### Energia Reversa não é recurso com pontos próprios
**Onde:** `src/systems/afty/afty-aptidoes.js`, `ficha/ficha-sessao.js`
**Situação:** a Mitigação do Vislumbre diz *"gastando 1 Ponto de energia reversa para cada ponto de
fadiga"*, e Energia Reversa hoje é uma trilha de Aptidão e um tipo de dano, e não um recurso contado.
Outras entradas do livro falam a mesma língua ("2 pontos de energia reversa gastos", no Treinamento
da 2.5.2).
**Precisa:** o autor dizer se Ponto de Energia Reversa é PE com outro nome (como a Estamina do
Restringido é) ou um recurso próprio, com teto próprio.
**Anotado:** 2026-09-09, ao fazer o addon Vislumbre Celeste

---

### ASSUNÇÃO: o alcance de 3 PC da propriedade Alcance é 36/72
**Onde:** `src/systems/afty/afty-criacao-armas.js` (`pcDeAlcance`)
**Situação:** o padrão diz *"para cada ponto desta propriedade a arma ganha 12 de alcance em seu
acerto e o dobro disso em seu alcance máximo. Ou seja, 1 PC dá alcance [12/24] enquanto 3 PCs dão
alcance [36/76]"*. O dobro de 36 é 72, e o 76 escrito parece erro de digitação. O código segue a
REGRA (12 por ponto, o dobro no máximo) e não o exemplo.
**Precisa:** confirmar que é 72. Se for 76 mesmo, a conta deixa de ser "o dobro" e vira tabela.
**Anotado:** 2026-09-09, ao fazer o addon de Criação de Armas

---

### ASSUNÇÃO: o dado de duas mãos da Versátil não gasta PC
**Onde:** `src/systems/afty/afty-criacao-armas.js` (`orcamentoDaArma`)
**Situação:** a Versátil custa 1 PC e a arma passa a ter dois dados, o de uma mão e o de duas. O
padrão precifica o dado de dano uma vez só, e não diz nada sobre o segundo. Nas armas do livro ele é
sempre um degrau acima do primeiro (Bastão 1d6/1d8, Clava 1d8/1d10). A bancada cobra só o dado base,
e o segundo sai de graça.
**Precisa:** o autor dizer se o segundo dado custa PC, e se ele é livre ou preso a um degrau acima.
**Anotado:** 2026-09-09, ao fazer o addon de Criação de Armas

---

### Criação de Equipamentos: revisar as respostas da fase 4, e os três trechos guardados

**Onde:** `docs/afty-criacao-equipamentos-decisoes.md` (perguntas 43 a 54 e a seção 7) e
`src/systems/afty/afty-criacao-equipamentos-encantamento.js`
**Situação:** as quatro fases foram feitas em 2026-09-14. O autor pediu que outro colaborador confira as
respostas da fase 4, e guardou três trechos do Encantamento de Grau Especial até essa revisão: *"Só
guarde para fazermos depois, ainda precisa ser revisado por outro colaborador se minhas decisões foram
certeiras"*.

- **Alcance** (1,5 × Mod / 2): não há canal de alcance. A linha está na tabela com `implementado: false`.
- **Tipo de Dano da Técnica**: *"Sua Ferramenta causa o Tipo de Dano principal da sua Técnica sem a
  necessidade."* A ficha não guarda um tipo de dano principal da técnica, e o trecho parece cortado.
- **Interação com Aptidões**: os seis exemplos do guia, combinados com o Narrador.
- **"Dobrar Usos"** da melhoria é só registro, porque os usos de encantamento são à mão.

⚠ A pergunta 54 mudou código dos dois sistemas: a RD por Tipo negativa passou a descontar da RD total
contra o tipo, em vez de ser aparada em zero antes da soma. Se a revisão desfizer essa resposta, o
conserto é no `afty-defesas-dano.js`, e ele pega toda fonte de RD por Tipo negativa.
**Precisa:** a revisão das respostas, e depois decidir com o autor se cada trecho guardado entra.
**Anotado:** 2026-09-14, ao fechar a fase 4 da Criação de Equipamentos
**Nota:** o "não há canal de alcance" do primeiro trecho deixou de valer em 2026-09-23 (`alcanceArma`, ver `docs/automacao-dsl.md`). O Alcance do encantamento continua guardado pela revisão, e não pelo canal.

### Itens de Custo: os efeitos que ficaram fora da fase 3

**Onde:** `src/systems/afty/afty-criacao-equipamentos-itens.js` (as linhas com `implementado: false`)
**Situação:** o autor decidiu em 2026-09-14 deixar estes efeitos da tabela dos Itens de Custo fora do
seletor, e pediu que ficasse escrito que não foram implementados:

- **Cura e PV Temporário**: *"4 dados dos seus dados de cura do descanso longo ou +10"*. A ficha não tem
  os Dados de Cura por descanso. O autor: *"Anota isso por enquanto, ainda não programamos os Dados de
  Cura por descanso"*, e depois *"a Cura fica toda para depois"*.
- **Condição** (*"3 dados para condições Fracas e Médias"*) e **Curar Condição**: esperam o sistema de
  condições (`CONDICAO_TEXTOS` vazio). Os "3 dados" também não estão explicados.
- **Tipo de Percepção**, **Brinco Comunicador** e **Reduzir Exaustão**: sem sistema na ficha.
- **Alcance** e **Área** como bônus: não há canal de alcance nem de área.

**Precisa:** cada um entra quando o sistema dele existir. Ligar é trocar `implementado` para `true` e dar
à linha o seu caminho no `efeitoDoItemCusto`.
**Anotado:** 2026-09-14, na fase 3 da Criação de Equipamentos
**Nota:** o canal de alcance existe desde 2026-09-23 (`alcanceArma`, por escopo de arma). Área continua sem canal.

---

## AFTY — Feitiços

### A Transformação não escolhe o alvo de Atributo e de TR
**Onde:** `src/systems/afty/afty-combate-conjurador.js` (`TRANSF_SEM_ALVO`) e o
`TransformacaoEditor` em `AftyCreatureBuilder.jsx`
**Situação:** o Auxiliar escolhe qual atributo (`alvoAuxAtributo`) e qual TR (`alvoAuxTR`), e o
editor da Transformação escolhe só o EFEITO de cada espaço. Desde 2026-09-10 a Transformação liga na
aba Buffs, e um espaço de Atributo ou de TR ficaria sem alvo: o tradutor cairia sozinho em Força e
Reflexos. Por isso esses dois espaços ficam **fora do número**, e uma Transformação que só tenha
eles não é oferecida.
**Precisa:** o autor dizer se cada espaço de Atributo e de TR ganha a sua escolha de alvo (e aí o
editor ganha o seletor e a lista sai do `TRANSF_SEM_ALVO`), ou se esses efeitos não cabem numa
Transformação.
**Anotado:** 2026-09-10, ao dar interruptor à Transformação

### LARGURA DE LINHA não existe no modelo de área
**Onde:** `src/systems/afty/afty-feiticos.js`
**Situação:** a área de um Feitiço é UM número. Linha e Cone são esse número × 1,5 (o
comprimento), e **largura nunca foi modelada**. Existe só um resto de comentário citando
`trocas.larguraLinhaSteps`, que nenhum código lê nem escreve.
Isso já tem consequência: a melhoria **Área** da Liberação Máxima diz *"Linhas ganham o dobro de
sua Largura também"*, e essa metade da regra não tem onde cair. Hoje ela dobra só o comprimento.
**Precisa:** largura de linha como dado de verdade (largura base por nível, e provavelmente uma
troca do guia para alterá-la), e aí a melhoria Área passa a dobrar as duas dimensões.
**Anotado:** 2026-08-09, autor, no chat de Liberações Máximas: *"ANOTE ISSO, VAMOS PRECISAR DA
LARGURA DA LINHA, pq eu esqueci disso."*

### Estímulo de Saída cobre 6 dos 17 efeitos auxiliares
**Onde:** `src/systems/afty/afty-liberacoes.js` (`ESTIMULO_EFEITOS`)
**Situação:** o texto da melhoria lista *"Defesa, Acerto, Perícia, CD, Testes de Resistência"*, e
só esses foram ligados (`defesa`, `ataque`, `rolagem`, `prejuizoRolagem`, `cd`, `tr`). Ficaram de
fora, sem decisão: `rd`, `atributo`, `movimento`, `margemCritico`, `negacaoRd`, `alcanceCaC`,
`alcanceDistancia`. Os 4 do grupo de dano (`danoDurante`, `danoApos`, `danoFixo`, `niveisDano`)
são de propósito: quem cuida deles é a Explosão Extrema.
**Precisa:** o autor decidir um a um quais dos 7 restantes entram. Entrar é acrescentar o id ao
Set, nada mais.
**Anotado:** 2026-08-09, autor: *"Faça somente os que estão escritos e anote. Vou verificar um a
um depois. Para ir adicionando todos os tipos."*

### Liberação Máxima em Feitiços ESPECIAIS e PASSIVOS
**Onde:** `src/systems/afty/afty-liberacoes.js` (`categoriasDoFeitico`)
**Situação:** só Dano, Auxiliar e Curativo podem virar Liberação Máxima. O suplemento mapeia
Dano na Doutrina da Destruição e Auxiliar/Curativo no Manto da Proteção, e não diz nada dos
Especiais nem dos Passivos. Golpeador e Dano na Alma causam dano e provavelmente vão para a
Doutrina, mas Itens, Shikigami, Transformação e Invisibilidade não são nem um nem outro.
**Precisa:** decisão do autor por subtipo.
**Anotado:** 2026-08-09, autor: *"Os Especiais e Passivos deixamos para depois. Com calma."*

### Técnica Máxima não tem Liberação Máxima
**Onde:** `src/systems/afty/afty-liberacoes.js` (`LIBERACAO_CUSTO_PE`)
**Situação:** a tabela de custo do suplemento vai do Nível 3 ao 5. A Técnica Máxima (`"max"`,
um degrau acima do 5) fica de fora, e o motor a rejeita.
**Precisa:** nada por ora. O autor respondeu *"Por enquanto ainda não"* quando perguntado se a
Técnica Máxima podia ser Liberação. Reabrir quando ele decidir.
**Anotado:** 2026-08-09, chat de Liberações Máximas (pergunta 8)

### Limite de uma Liberação Máxima por Cena ou Combate é só texto
**Onde:** `src/systems/afty/ficha/` e `src/systems/afty/encontros/`
**Situação:** a regra existe e aparece escrita, mas nada na Ficha Final nem no Encontro conta o
uso. O jogador pode declarar quantas quiser.
**Precisa:** um marcador de gasto na sessão, se o autor quiser rastrear.
**Anotado:** 2026-08-09, autor: *"Por enquanto Regra Escrita."*

---

## AFTY — fragilidades achadas por assert

### Importar `afty-habilidades.js` PRIMEIRO estoura um ciclo
**Onde:** `src/systems/afty/afty-combate.js` linha 36, `POSTURA_OPCOES`
**Situação:** `await import("afty-habilidades.js")` como primeiro módulo do processo morre com
*"Cannot access 'POSTURAS_DE_COMBATE' before initialization"*. É ciclo entre `afty-habilidades.js` e
`afty-combate.js`, e a ordem de avaliação só fecha certo quando alguém entra pelo `afty-derive.js`.
**Confirmado ANTERIOR a 2026-08-20:** a mesma falha acontece com o arquivo do HEAD, então não veio
dos Addons. Hoje é latente porque o app entra sempre pelo derive e o `vite build` passa.
**Precisa:** ou quebrar o ciclo (mover `POSTURAS_DE_COMBATE` para um módulo folha, no espírito do
`afty-pericias-catalogo.js`), ou aceitar e deixar escrito que `afty-derive.js` é a única porta de
entrada. Enquanto não, todo assert novo tem de importar o derive primeiro.
**Anotado:** 2026-08-20, ao escrever os asserts do registro de Addons

---

## AFTY — sobras do code review de 2026-08-09

> As quatro que eram conserto puro (buff duplicado na aba Buffs, iniciativa negativa impossível,
> painel de fontes escapando do tema e os dois `useMemo` faltando) foram **feitas em 2026-08-10**.
> Ver a sessão daquele dia em `afty-status.md`. O que sobrou aqui depende de decisão sua.

### Encontro duplicado herda o estado mas perde a iniciativa
**Onde:** `src/systems/afty/encontros/afty-encontro.js` (`duplicarEncontro`)
**Situação:** o autor decidiu (2026-08-09) que a cópia herda PV, PE, buffs, condições e flags,
porque duplicar serve para ramificar uma luta em andamento. Mas a cópia continua voltando para
`status: PLANEJANDO` e com a **iniciativa zerada**, que é o comportamento de quem quer um molde
novo. Para ramificar de verdade, a ordem de turno e a rodada também teriam que vir junto.
**Precisa:** o autor dizer se duplicar deve preservar iniciativa, rodada e status, ou se são dois
comandos diferentes ("duplicar como molde" e "ramificar").
**Anotado:** 2026-08-09, ficou de fora do conserto por ser escolha de produto, não bug

### Remover habilidade do catálogo não avisa ninguém
**Onde:** `src/systems/afty/afty-habilidades.js` (`resolveHabilidades`)
**Situação:** id que não existe mais é descartado em silêncio (`if (!BY_ID[id]) continue`), e os
`inacessiveis` só reportam habilidades que existem. Uma ficha salva com a habilidade abre sem ela e
com uma vaga livre que apareceu do nada. ⚠ **Não é regressão da remoção de "Liberações
Expandidas"**: é como o catálogo sempre funcionou, e "Teste de Resistência Mestre" saiu em julho
pelo mesmo caminho. Hoje só morde o rascunho automático do autor.
**Precisa:** decidir se vale um aviso de "esta ficha tinha N escolhas que não existem mais".
**Anotado:** 2026-08-09, code review

---

## AFTY — Guarda Inabalável (2026-08-26)

### ASSUNÇÃO: a Guarda drena ANTES das outras cascas de PV temporário

**Onde:** `src/systems/afty/ficha/ficha-sessao.js` (`drenaPvTemp`)
**Situação:** o autor respondeu que a Vida da Guarda entra no mesmo pote do PV temporário e
**acumula** com as outras fontes dele, mas não disse em que ordem o dano come as fontes. Está
implementado com a Guarda PRIMEIRO, por dois motivos: ela é a camada de fora (a criatura a reergue
toda rodada, e as outras cascas não voltam sozinhas), e ela precisa ser alcançável para a regra
funcionar como está escrita, senão uma casca comprada a blindaria e a Guarda ficaria praticamente
inquebrável.
**Onde isso ainda não morde:** a Guarda é hoje a ÚNICA fonte deste pote, então a ordem não muda
número nenhum. Ela passa a valer no dia em que uma segunda fonte de PV temporário existir, e a
primeira candidata é a entrada logo abaixo.
**Precisa:** o autor confirmar a ordem, ou dizer que a casca comprada some antes.
**Anotado:** 2026-08-26, ao construir a Guarda Inabalável

### O `pvTemporario` da bancada nunca chegou à sessão

**Onde:** `src/systems/afty/afty-derive.js` (`pvTemporario`) e `ficha/ficha-sessao.js`
**Situação:** achado ao converter o `pvTempAtual` em mapa por fonte. O canal `pvTemporario` existe,
é somado, aparece no Preview do criador com hover de fontes, e **nunca chegava à Ficha**: na sessão o
campo nascia em zero, só o `aplicaDano` o tocava (para baixo) e nada o subia. Quem emite hoje são
Fluxo, Brutalidade Aprimorada e Eliminar e Continuar, todos pela bancada de Simulação de Combate.

É o irmão exato do buraco que a Guarda acabou de tapar, e a mesma classe do efeito morto do Potencial
Físico 2ª: número calculado, mostrado, e jogado fora do outro lado.
**Precisa:** decidir QUANDO ele entra, porque a resposta muda o desenho. Se ele é casca de efeito
temporário ligado na bancada, ele não é da mesa e a Ficha não deveria mostrá-lo. Se ele é casca de
começo de cena, é uma linha no `iniciaCombate`, no molde do `peTemporario` do gatilho `combate`. Com
o mapa por fonte já pronto, o segundo caminho custa uma linha.
**Anotado:** 2026-08-26, ao construir a Guarda Inabalável

### As duas metades da Guarda não têm fonte no catálogo

**Onde:** `src/systems/afty/afty-efeitos.js` (canais `guardaBonus` e `guardaVida`)
**Situação:** os dois canais nasceram junto com a característica e **nenhuma entrada do livro os
emite**. Isso é de propósito e não é bug: foi a falta de DESTINO que deixou o Treino de Domínios sem
automação nenhuma até esta mesma data, e a Guarda é o tipo de número que um Addon vai querer mexer.
**Precisa:** nada agora. A entrada existe para os dois não envelhecerem esquecidos, e para quem
transcrever uma habilidade que fale de Guarda saber que o cano já está lá.
**Anotado:** 2026-08-26, ao construir a Guarda Inabalável

---

## AFTY — outros

### Conferir Olhinhos Lu no navegador
**Onde:** `addons/olhinhos-lu.json`, `src/systems/afty/ui/OlhinhosLuCard.jsx`,
`src/systems/afty/ficha/PainelOlhinhosLu.jsx`
**Situação:** versão 1.1.0 segue o Vislumbre Celeste, com card de Habilidades
e painel de Ações na Ficha e no Encontro. ESLint, build e testes de lógica
e renderização passaram. Navegador disponível não acessou o servidor local,
retornando timeout em 127.0.0.1 e localhost.
**Precisa:** conferir controles no criador, Ficha Final e Encontro,
Intuição e Atenção com olhos abertos e fechados, fontes e texto integral,
nas larguras de computador e telefone, após integrar o motor ao site.
**Anotado:** 2026-10-12, Olhinhos Lu.

### Lapidação Prateada: alcance e área de Feitiço e de Aptidão não têm canal
**Onde:** `addons/yna.json` (Clã Getsurin) e `src/systems/afty/afty-feiticos.js` (a calculadora de alcance e área)
**Situação:** *"o alcance/área de qualquer feitiço ou aptidão aumenta em 4,5m/3m respectivamente"* ficou no texto, por decisão do autor em 2026-09-29 ("Só Texto por Ora"). O +1 Nível de Aptidão da mesma característica está no Motor. O alcance e a área do Feitiço saem da calculadora de criação (`ALCANCE_POR_NIVEL` mais as trocas). O Alcance do Auxiliar usa `alcanceArma` nas linhas de armas e do Ataque Básico desde 2026-10-03, sem alterar o alcance dos Feitiços.
**Precisa:** dois canais (alcance e área) somados ao Feitiço já calculado, e o autor dizer quais Aptidões "de alcance ou área" entram (Domínio Simples, Expansão de Domínio, Cortina) antes de ligar a metade da Aptidão.
**Anotado:** 2026-09-29

### No jogador, o TR marcado à mão ainda conta como "já treinado" na Força Imparável e na Resiliência Melhorada
**Onde:** `src/systems/afty/afty-efeitos.js` (as variáveis `prof_tr_*`, no `buildCriaturaDslContext`)
**Situação:** desde 2026-10-03 o `prof_tr_*` do jogador lê a maior entre a marcação à mão e a faixa da Classe, e com isso as duas enxergam o TR da Classe. A marcação à mão continua contando, e no jogador o livro diz que TR "NÃO PODE SER ESCOLHIDO DE FORMA LIVRE". Medido: Combatente 8 com Reflexos pela Classe, Fortitude marcada à mão e a Resiliência Melhorada na Fortitude dá Mestre, e o aviso `semFonte` some, porque o Mestre concedido cobre a marcação. O `proficienciaTRCasoJa` (Treino de Testes de Resistência) já ignora a marcação à mão no jogador pela divergência `trForaDoOrcamento`. Na criatura a marcação é a fonte de verdade e está certo.
**Precisa:** o autor dizer se o `prof_tr_*` do jogador passa a ignorar a marcação à mão, como o `proficienciaTRCasoJa`. Seria ler a mesma divergência, sem linha nova em `DIVERGENCIAS`.
**Anotado:** 2026-10-03, ao fechar o TR da Classe (Lote 03)

### O contador de usos cobre só o Combatente
**Onde:** `src/systems/afty/afty-habilidades.js` (o campo `usos` de cada Habilidade)
**Situação:** o contador de usos por Habilidade nasceu em 2026-09-24 com as seis do Combatente (Assumir Postura, Indomável, Revigorar, Marcar Inimigo, Surto de Ação e Potência Antes de Cair), por decisão do autor (*"Só o Combatente agora"*). Ligar outra é declarar `usos: { expr, recarga }` na entrada, e o resto já existe: o máximo no derive, a linha na Ficha, os gastos na sessão e o Descansar zerando. Candidatas "por descanso" nas outras classes: Puxar um Ar, Um com a Arma e Empolgar-se (Lutador); Abastecido pelo Sangue, Até a Última Gota e Preparação de Técnicas (Conjurador); Versatilidade, Conceder Outra Chance e Contra-Ataque (Suporte); Reserva para Invocação, Ataque em Conjunto, Invocação Às e Fantoche Supremo (Controlador); Ainda de Pé (Restringido). As "por cena" (Insistência, Inspirar Aliados, Negação Crítica, Contaminar com Determinação, Necessidade de Continuar) pedem saber quando a cena acaba, e hoje quem marca isso é o começo do combate e o descanso (é o que devolve a troca por 6 do Autossuficiente). O Ritualista já conta pelos usos dele (`usosRitualista`), e as curas com `curaUsos` mostram só o máximo.
**Precisa:** o autor dizer quais entram, e se "por cena" zera no começo de cada combate.
**Anotado:** 2026-09-24, ao fazer o contador do Combatente
**Nota:** desde 2026-09-28 existem as recargas `cena` e `rodada` (`USOS_RECARGAS`), devolvidas pela sessão na cena nova (o `iniciaCombate` e a saída da rodada 0, a mesma porta do Autossuficiente) e na virada da rodada, e o `usos` vale também em característica de origem, Talento e opção de escolha (`mesa` no derive). Nasceu com a Fórmula de Combate Entrópica. Ligar uma das candidatas "por cena" acima agora é só declarar `recarga: "cena"`, falta o autor escolher quais.

### O painel de Encontros mostra só a RD Geral
**Onde:** `src/systems/afty/encontros/PainelDeCombatente.jsx` (o ladrilho `{ k: "RD", v: derived.rdGeral }`)
**Situação:** no jogador a RD do escudo cai na RD Física (divergência `rdEscudoFisico`), e o ladrilho do
painel lê só a Geral. Uma personagem com escudo aparece com RD 0 no Encontro e RD Física 6 na Ficha
Final. Achado em 2026-09-14 no teste do Escudo criado, e vale igual para os escudos do livro.
**Precisa:** decidir o que o ladrilho mostra na ficha de jogador: a RD Física no lugar, as duas lado a
lado, ou a soma. É tela compartilhada pelos dois sistemas.
**Anotado:** 2026-09-14, no teste de navegador da Criação de Equipamentos

### Resolver no Encontro os efeitos de alvo das oito posturas do Ápice
**Onde:** `src/systems/afty/afty-combate.js`, `ficha/abas/AbaAcoes.jsx` e `encontros/`
**Situação:** Invencível sob o Sol aplica os bônus da própria habilidade e os números positivos das
posturas, inclusive não aprendidas, com custo, duração e Exaustão. CX3 já entrega confirmação de
ataque de arma com alvo e resultado, sem resolver por isso todos os procedimentos de postura.
Dragão, Tempestade, a reação da Lua e a troca de alvo da Devastação continuam em aprofundamento
pelas cláusulas próprias. O autor confirmou em 2026-09-12 que todas as oito posturas valem no Ápice.
Andar/Desengajar da Lua foram ligados por CX3 em 06/11, como Ação Livre
nativa com identidades distintas. Essa parcela saiu da pendência.
Fortuna foi ligada por CX3 em 06/11, inclusive pelo Ápice, com rerrolagem
individual e limite comum por rodada. Essa parcela saiu da pendência.
Terra também saiu da pendência de imunidade a movimento forçado nos consumidores
de CX3, com fonte, acesso ao Ápice e recusas antes de consequência. O término de
posturas normais por queda/incapacitação foi ligado ao escritor de condições.
**Precisa:** abrir os eventos de ataque e defesa com alvo na sessão, registrar a escolha de
reação da Lua, os TRs de Dragão e Tempestade
e o reset de pilhas ao trocar o alvo da Devastação. Aplicar a mesma passagem na Ficha e no
Encontro, sem condicionar pela rota.
**Anotado:** 2026-09-12, ao automatizar Invencível sob o Sol

### O filtro de patamar do Dashboard não lista Beyond
**Onde:** `src/components/Dashboard.jsx` (o `<select>` de patamar, dentro do painel de filtros)
**Situação:** o CARD já mostra Beyond certo desde 2026-08-17 (o autor liberou a linha no
`PATAMAR_STYLES`, que sem ela caía no fallback `?? comum` e rotulava toda criatura Beyond como
"Comum"). O **filtro** continua com os cinco patamares da 2.5.2, então em `/Afty` não dá para
filtrar por Beyond.
Não incluí na mesma liberação porque é outra superfície: a entrada no `PATAMAR_STYLES` é invisível
para a 2.5.2 (nenhuma criatura de lá é `beyond`), enquanto uma `<option>` nova **aparece** no
filtro da 2.5.2 e nunca casa com nada.
**Precisa:** o autor dizer se aceita a opção visível na 2.5.2, ou se prefere que ela só exista
quando o app está em `aftyMode` (o que exigiria passar a flag para o Dashboard).
**Anotado:** 2026-08-17, ao consertar o rótulo do card

### O Intermediário ocupa meio espaço e ninguém conta
**Onde:** `src/systems/afty/afty-invocacoes.js` (`espacosDeIntermediario`) e
`afty-equipamentos.js` (`resolveCarga`)
**Situação:** o capítulo diz, sem margem, *"Todo Intermediário ocupa meio espaço no inventário de
um personagem"*, e toda Invocação tem um (Talismã para shikigami, o próprio dispositivo para
Corpo Amaldiçoado). O número passou a ser **calculado e mostrado** no cabeçalho da aba em
2026-08-16, mas **não entra no `resolveCarga`**.
Não liguei porque a carga alimenta os penais de Sobrecarga (-Defesa e -Movimento), e um Controlador
de nível alto tem até 9 invocações, ou seja, 4,5 espaços que apareceriam do nada em fichas já
prontas. É mudança visível de número, e a decisão é sua.
**Precisa:** o autor dizer se liga. Se sim, é somar `derived.invocacoes.espacosIntermediarios` ao
`espacosUsados` antes do `resolveCarga`, no `deriveAfty`.
**Anotado:** 2026-08-16, ao dar tela ao tipo mecânico da Invocação

### Forma de Arma: a invocação ainda não vira arma no arsenal do dono
**Onde:** `src/systems/afty/afty-derive.js` (lista de armas do dono), `ficha/abas/AbaInvocacoes.jsx`
**Situação (2026-11-01, CL3):** núcleo entregue em `ficha/ficha-invocacao-uso.js`: `transformaEmArma`, `linhaDeFormaArma` (a linha de ataque do
dono, com o dado e o tipo da Ação Complexa escolhida) e `reacaoDoPortadorNaForma`, sem tocar o derive. **Falta ligar a tela** (CX6) e a Encantada, que segue
texto. O texto abaixo é o da anotação original.
**Situação anterior:** a Forma de Arma (Adicionais) já tem a escolha da arma, o custo pelo grau, o requisito
de treino do dono e o interruptor de mesa, que não tira a invocação de campo. O que falta é o
ataque: *"você usa suas ações e não as da invocação para atacar, mas você usa seu tipo de dano e
dado de dano da ação complexa da invocação"*. Hoje a Ficha não monta essa linha de ataque, e a mesa
rola pela arma do dono.
**Precisa:** o derive montar uma ARMA VIRTUAL na lista de armas do dono enquanto a sessão diz
`forma: "arma"`, com o dado e o tipo de dano da Ação Complexa de ataque da invocação, e a reação
do portador (levar o dano inteiro de um ataque de alvo único, ignorando a RD) na tela. A
Encantada, que hoje é texto, entra junto.
**Anotado:** 2026-09-30, na Etapa 6 da atualização de Controlador e Invocações

### Auxílio de Dano Adicional não vira número no dono
**Onde:** `src/systems/afty/afty-invocacoes.js` (`AUXILIO_SUSTENTAVEL`)
**Situação (2026-11-01, CL3):** entregue como DISPARO, e o bloqueio abaixo não existe mais (`dadosNomeados` com `alvo: "dX"` já aceita o dado de face
própria). `usaAuxilioDaInvocacao` põe na sessão de quem recebe um Buff de Mesa mais uma pendência do CL1, e o ataque elegível a consome. **Falta ligar a tela**
(CX6). O texto abaixo é o da anotação original.
**Situação anterior:** os auxílios de Defesa, Acerto e RD viraram interruptor na Ficha Final e mexem no
número do dono e no dela (2026-08-31). O de **Dano Adicional** ficou de fora porque ele é um DADO
("1d6 de Dano Adicional") e vale *"em um próximo ataque"*, e o canal `danoBonus` do Motor soma um
número fixo, enquanto o `dadosDano` conta dados da PRÓPRIA arma. Hoje ele aparece na lista de
Bônus com o dado escrito, para a mesa somar à mão.
**Precisa:** um canal que aceite um dado de face própria na linha de dano, que é o mesmo bloqueio
das Aptidões (ver a memória `afty-aptidoes-motor`). Quando ele existir, o Dano Adicional entra.
**Anotado:** 2026-08-31

### Prejuízo por Múltiplos Auxílios não é contado
**Onde:** `src/systems/afty/afty-invocacoes.js`, `ficha/abas/AbaInvocacoes.jsx`
**Situação (2026-11-01, CL3):** a Ficha passa a CONTAR (`usaAuxilioDaInvocacao`, contagem em `sessao.usos["rodada:aux:<id>"]`) e a reduzir o benefício, com a
Técnica imune e o uso extra da Horda. A pergunta de contar qualquer auxílio ou só o mesmo benefício está nas perguntas de CL3. **Falta ligar a tela** (CX6) e o Pacote
para Aliados. O texto abaixo é o da anotação original.
**Situação anterior:** o `resolveAcao` devolve o texto do prejuízo (`-1 por uso repetido na rodada`,
`-2 níveis` no Dano Adicional) e a Ficha o mostra como chip. Com os auxílios virando interruptor,
ligar o mesmo duas vezes na mesma rodada agora É possível na tela, e o número não desce.
**Precisa:** decidir se a Ficha conta usos por rodada do auxílio (a sessão já tem `rodada` e `usos`)
ou se isso continua sendo controle de mesa. O Shikigami de Técnica é imune, e isso já está no motor
(`imunePrejuizoMultiplos`).
**Anotado:** 2026-08-31

### Shikigami: a redução permanente de PE não sai do painel
**Onde:** `src/systems/afty/afty-feiticos.js` (`calcularFeiticoShikigami`), `afty-derive.js`
**Situação:** o Feitiço de Criação de Shikigamis calcula `reducaoPE = 2 × nível` (Técnica Máxima
conta como Nível 6, então 12) e o painel do Feitiço mostra o número. **Ele nunca é descontado do
PE máximo do dono.** É o mesmo tipo de ligação de mão única que o `ajusteAcoes` e o custo tinham,
e que foi consertado do lado da invocação em 2026-08-15. Este ficou porque mexe na fórmula de PE
da criatura, e não na ficha da invocação.
**Precisa:** o autor confirmar quando a redução vale. O texto diz "enquanto existir", e o
shikigami existe desde que o Feitiço é criado, o que faria a redução ser sempre ativa, some ela
com quantos Feitiços de Shikigami a ficha tiver. Se for isso, é um canal de `pe` a menos no
derive.
**Anotado:** 2026-08-15
**Nota:** a fórmula GÊMEA foi ligada em 2026-09-09. As Passivas passaram a tirar `2 × nível` do PE
Máximo na Ficha de Jogador (Técnica Máxima = 12), que é exatamente a conta desta `reducaoPE`, e o
caminho de desconto já existe agora. Perguntado ao autor na mesma conversa se as duas são a mesma
regra, ele respondeu que **só as Passivas por enquanto**, então esta entrada continua aberta de
propósito. Quando ela for ligada, o encaixe é o mesmo: a parcela entra na conta do PE em
`afty-derive.js` e sai como linha nomeada no hover. (2026-09-09)

### A arma criada só guarda UMA opção de Modular
**Onde:** `src/systems/afty/afty-equipamentos.js` (`saneiaValorProp`, `param: "tipo"`)
**Situação:** o padrão de criação diz *"Modular: 1 PC | Cada 1 PC adiciona uma opção de dano FÍSICO
à arma"*, e o modelo de arma guarda **um** tipo só (`props.modular: "ct"`). A bancada cobra 1 PC e o
campo aceita um tipo, então a segunda opção não tem onde existir.
**Precisa:** decidir se o `modular` passa a aceitar lista. Mexe em quatro leitores
(`saneiaValorProp`, `rotuloPropriedade`, `propriedadesDaArma` e o campo do editor), e o catálogo do
livro continuaria com um tipo só em toda arma.
**Anotado:** 2026-09-09, ao fazer o addon de Criação de Armas

---

### O traço Especial da arma criada não aparece fora da bancada
**Onde:** `src/systems/afty/afty-equipamentos.js` (`getEspecial`), `ficha/`
**Situação:** com o addon de Criação de Armas a arma própria pode marcar a propriedade Especial e
guardar o preço em PC mais o texto do traço (`criacao.especialTexto`). O texto é mostrado na bancada
e em mais lugar nenhum: a linha do inventário e a Ficha Final leem o texto especial do CATÁLOGO,
pelo campo `especial` da arma, que é um id de `ARMA_ESPECIAIS` e arma custom não tem.
**Atualização 2026-11-06 (CX5):** a arma criada responde por si: `saneiaArmaCustom` grava o texto em
`especialTexto` e em `descricao`, que é o que a Ficha Final lê, e `textoEspecialDaArma(def)` devolve
o texto do livro (pelo id) ou o da arma criada. Fechado para a Ficha. A linha do criador
(`AftyCreatureBuilder.jsx`, `getEspecial(def.especial)`, reservado por CX3) ainda lê só o catálogo.
**Precisa:** trocar essa linha do criador por `textoEspecialDaArma(def)`.
**Anotado:** 2026-09-09, ao fazer o addon de Criação de Armas

---

---

## Migração pendente deste próprio arquivo

`afty-status.md` ainda tem possíveis pendências espalhadas pelas seções de sessão, como Marca
Registrada com a redução de PE desligada, subsistemas nunca enviados como Apoio, Imitação, Votos e
técnicas marciais, e a lista de retomada das Especializações. Elas **não** foram movidas para cá:
exigem conferência individual no código e nas decisões posteriores antes de entrarem na fila. O
autor pediu padronização daqui para frente, não migração automática do histórico.

**Precisa:** o autor dizer se quer a migração completa. Se sim, é uma passada só, de preferência
logo depois de um commit, para o diff ficar isolado.

### Reposição Sanguínea na Aberração Humanizada

**Situação:** o addon Aberração Humanizada libera os Talentos de Origem do Feto Amaldiçoado Híbrido a partir do nível 6. Reposição Sanguínea melhora Vigor Maldito, mas essa característica não faz parte da Aberração Humanizada.

**Precisa:** decisão do autor sobre conceder Vigor Maldito, adaptar Reposição Sanguínea a outra cura da origem ou manter o Talento selecionável sem efeito próprio.


## Campanha de revisão da automação

### G00: auditar inventário, fontes, cobertura e protocolo
**Chave:** G00-auditoria-independente
**Onde:** [revisao.md](revisao-automacao/G00/revisao.md), [registro.json](revisao-automacao/G00/registro.json) e [entrega-sha256.json](revisao-automacao/G00/entrega-sha256.json)
**Situação:** auditoria externa REPROVADO, registrada como AUDITADO COM PENDÊNCIAS. Correções implementadas aguardam rechecagem independente. Os demais lotes permanecem NÃO REVISADO.
**Precisa:** rechecagem independente dos novos hashes e das correções, incluindo reconciliação, fontes individuais, remendos, liberações, subpastas e preservação. Achado 9: decisão do autor sobre restaurar a instrução geral de sincronização anterior e manter a restrição apenas na campanha. A pergunta já foi apresentada e ainda aguarda resposta. Entregar achados em chat, por leitura, sem editar esta árvore.
**Nota:** o autor autorizou ignorar por enquanto F&M 2.0, Livro do Narrador e fontes próprias dos homebrews não localizadas. Estão marcadas como adiadas nos lotes correspondentes, sem aprovação de regra e sem nova pergunta neste G00. As pendências de regra preexistentes conservam seu escopo.
**Decisão do achado 6:** o autor exige motor e autoria em toda parcela. MANUAL INTENCIONAL não recebe exceção de aprovação.
**Anotado:** 2026-10-05, execução e correção do G00.
**Nota (2026-10-07):** a imprecisão que a auditoria do G00 apontou ("nenhum assert escreve", e o `t-fontes-revisao.mjs` cria e apaga temporários fora do repositório) foi corrigida em `asserts/LEIA.md` e no CLAUDE.md. O achado 9 continua aberto.

### Reconciliação: a chave removida continua em fontes.json
**Chave:** G00-reconciliar-remocao
**Onde:** `scripts/revisao-automacao/reconciliar.mjs` (`--aplicar`) e `docs/revisao-automacao/fontes.json`
**Situação:** ao aplicar uma proposta com remoção, o inventário perde a chave e a entrada dela em
`fontes.json` fica, e o `t-reconciliacao` reprova pela contagem (13732 contra 13731 no Golem de
Sangue 1.1.0, com a remoção do `frenesi_sanguinario`). Foi apagada à mão.
**Precisa:** o `--aplicar` tirar de `fontes.json` a entrada da chave removida, ou dizer que ela ficou.
**Anotado:** 2026-10-16, Golem de Sangue 1.1.0

### Encontro: leitura de catálogo FORA da derivação ainda vê a união dos addons
**Chave:** M05-texto-fora-do-derive
**Onde:** `src/systems/afty/encontros/` e as abas da Ficha que leem catálogo no render
**Situação:** desde 2026-10-07 o remendo de addon é da ficha (`comEscopoDaFicha` em volta do `deriveAfty`), então todo NÚMERO sai certo no Encontro misto. Quem lê catálogo no render, fora da derivação (o texto de uma habilidade remendada no painel de um combatente), ainda enxerga a união, com o remendo do vizinho. A versão divergente do mesmo pacote em duas fichas segue a regra antiga: vale a primeira, e a divergência é relatada.
**Precisa:** decidir se o painel do Encontro abre o escopo do combatente para o render (um provedor por combatente, como o `permite`) ou se o texto da união basta.
**Anotado:** 2026-10-07, revisão M05

### Não existe a transação genérica de "usar" uma habilidade
**Chave:** M03-D01-transacao-de-uso
**Onde:** `src/systems/afty/ficha/ficha-sessao.js` (`alteraEstadoCombate`, `marcaUso`, `gastaPe`)
**Situação:** validar aquisição e recursos, cobrar uma vez, aplicar efeitos e registrar são operações separadas, e a cobrança na ativação existe só por ramo de id (Invencível sob o Sol, Talismã do Ápice). O `custoPE` de estado é exibido. Desde 2026-10-07 o estado de addon transporta `custoPE`, `umaVezPorRodada` e `exclusivoCom`, então a autoria já descreve o custo, mas nada o desconta.
**Precisa:** a resposta da pergunta 3 de 2026-10-07 (Armas Absolutas). Com "cobrar", o desenho é um descritor de custo e manutenção por rodada no próprio estado (`custoPE`, `manutencaoPE`, expiração sem pagamento), consumido por um resolvedor único que valida antes de cobrar, e o Invencível passa a usá-lo em vez do ramo próprio.
**Anotado:** 2026-10-07, revisão M03

### O Fluxo Invencível lê a jogada resolvida por um ramo próprio do derive
**Chave:** M02-A03-leitor-tardio
**Onde:** `src/systems/afty/afty-derive.js` (`if (combate.fluxoInvencivel)`) e `VARS_ADIADAS` em afty-efeitos.js
**Situação:** o número está certo (`t-fluxo-invencivel.mjs`), mas o bônus de acerto e de dano que lê "o acerto normal" é montado por um ramo que chama `resolveTestes` e cria constantes. Um addon não consegue escrever um efeito equivalente, porque `acerto` está em `VARS_ADIADAS`.
**Precisa:** um estágio tardio geral, irmão do `dados_dano_final`: o efeito que lê `acerto_<ataque>` roda depois dos testes, lê o valor ANTES dele mesmo e soma uma vez. O Fluxo passa a ser dado em `APICE_EFEITOS`. Sem decisão de regra pendente: é capacidade.
**Anotado:** 2026-10-07, revisão M02

### Golpe Especial: Amplo, Impactante, Sanguinário e Lento não têm consequência, e o montador não é autorável
**Chave:** CMB02-consequencias
**Onde:** `src/systems/afty/afty-golpe-especial.js`, `ficha/ficha-sessao.js` (`pagaGolpeEspecial`)
**Situação:** as quatro entram só no custo. Alvo a mais, empurrão com Fortitude, sangramento e a troca de ação pedem um evento de ataque com ALVO e o resultado do TR, que a sessão não tem (é a mesma lacuna das posturas do Ápice, abaixo em "AFTY, outros"). `PROPRIEDADES_GOLPE` é constante fixa, e um segundo montador com propriedades e preços próprios não tem contrato de dado. Atroz, Letal, Penetrante, Desfocado, Longo e Preciso (este desde 2026-10-07) já são do Motor.
**Precisa:** as perguntas 7 e 8 de 2026-10-07, e depois o evento de ataque com alvo confirmado pela mesa. O montador vira família de addon quando houver um segundo cliente.
**Anotado:** 2026-10-07, revisão CMB-02

### Estilos de Combate: Interceptador, Protetor, saque do Arremessador e a segunda arma do Duplo
**Chave:** CMB01-reacoes
**Onde:** `src/systems/afty/afty-efeitos-conteudo.js` (fim dos Estilos)
**Situação:** Interceptador e Protetor agem no ataque de OUTRA criatura, e a ficha só conhece a si (a primitiva de vínculo entre criaturas, 8.4 do docs/afty-addons.md, não chegou à sessão). O saque como parte do ataque é economia de ação sem canal. O atributo na segunda arma do Duplo é de mesa por decisão de 2026-09-01: a ficha tem uma linha por ARMA, e não por MÃO.
**Precisa:** a pergunta 5 de 2026-10-07 para o Protetor; para os dois de reação, uma entrada de reação com alvo confirmado pela mesa. Os dois de mão ficam como estão até haver linha por mão.
**Anotado:** 2026-10-07, revisão CMB-01

### Armas Absolutas está na página 61, e o controle de fontes diz NÃO LOCALIZADA
**Chave:** LUT10-armas-absolutas-fonte
**Onde:** `docs/revisao-automacao/fontes.json`, item `afty-habilidades.js::AFTY_HABILIDADES::lut_armas_absolutas`
**Situação:** o executor e o auditor do M03 leram o texto no Markdown vigente, página impressa 61 (marcador `<!-- página 61 -->`). A localização é do lote dono (LUT-10), e este bloco não altera o controle de outro lote.
**Precisa:** o LUT-10 registrar a fonte localizada ao revisar a habilidade.
**Anotado:** 2026-10-07, revisão M03

### Especializações: acionamentos opcionais após remoção do painel
**Chave:** FANG-2026-10-12-especializacoes
**Onde:** ficha/ficha-especializacoes.js e interações existentes da ficha
**Situação:** cálculos, escolhas roubadas, proficiências físicas, Resistência, Imitação e ajustes de interface corrigidos em 2026-10-13. O autor recusou painel separado de Restringido, Novo turno e Ataques Extras em Dano. Custos/Usos são planejados em outro chat e Resiliência fica como está. As funções de reação, Força Imparável/Barreira, alternativa letal de Ainda de Pé e Rejeitar a Morte existem no motor de sessão, mas o acionamento opcional não deve depender do painel removido. O teste de Mesmo Morto e as curas por turno acompanham a rodada existente.
**Precisa:** integrar os acionamentos opcionais às interações existentes, sem recriar painel ou barra de ações. Alvo de Foco, reação de desvio e circunstâncias de queda ainda exigem informação de mesa. Preservar gastos manuais. Decisões já fechadas: RD de Surto/Físico não cobre Alma, Surto de Ação pode ser roubado, Espírito Incansável está certo, Foco concede +10 Atenção, Roubo exige pré-requisitos de outras habilidades, e apenas Imitação os dispensa.
**Anotado:** 2026-10-13, escopo ajustado pelo autor
