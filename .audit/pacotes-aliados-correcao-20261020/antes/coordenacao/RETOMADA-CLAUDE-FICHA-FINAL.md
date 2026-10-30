# Retomada do Claude: Ficha Final G2

## Revisão dos Pacotes em 20/10: devolvido por dois defeitos

Seguir C:/Projetos/Grimorio/DEVOLUTIVA-CLAUDE-PACOTES-ALIADOS.md.
Não executar o prompt original do lote outra vez. PA-I1: maior com condição
de combate não satisfeita apaga o menor elegível. PA-I2: Feitiço de um ataque
vira uma rodada no JSON e expira sem uso. Reprodução própria por interface,
1024/1440, dev/produção e arquivo realmente exportado/importado.

677 asserts focados e lint/build passaram. Nas 64 conferências próprias,
54 passaram e dez falhas repetem os dois defeitos. Evidências em
grimorio-tracker/.audit/revisao-codex-pacotes-20261020/. Suíte inteira e
benchmark da entrega não foram repetidos pelo revisor neste lote.

O autor avisou envio acidental a outro Codex. Não encontrada interferência:
chat idle com histórico importado, sem execução nativa adicional, 33 hashes
do Claude iguais antes e depois das verificações. Nenhum código de produto
alterado pelo revisor, nenhuma mensagem enviada a outro chat. Sete leituras
de regra seguem sem aprovação, clássica padrão, G2 prévia e nove marcos
anteriores preservados. Sem commit, push, merge ou deploy.

## Pacotes para Aliados entregue, à espera de revisão (20/10/2026)

- Implementado na prévia do G2, no destino real. Suporte: Adicionar > Para Aliados (pacote em rascunho, fontes com busca, escolhas, prévia, Salvar, Exportar JSON com revisão). Aliado: Adicionar > Fonte Externa > Recebidos, Importar Pacote com resumo antes de gravar, Registrar Manualmente de sempre. A clássica mostra os mesmos números e as linhas das instâncias.
- Módulos: `ficha/pacotes-aliados.js` (folha: formato, leitura, biblioteca, instância), `ficha/pacotes-familias.js` (resolvedores por família), `ficha/ficha-recebidos.js` (alvo, condição e três regras novas, mais o conserto do benefício próprio menor), `efeitos/ParaAliadosG2.jsx`, `efeitos/RecebidosG2.jsx`, `efeitos/PacotesPecas.jsx`. Persistência: `creature.pacotesAliados` e `creature.pacotesRecebidos` pelo `App.jsx`, e o criador não escreve as duas chaves.
- Provas e limites em `grimorio-tracker/.audit/pacotes-aliados-20261019/RELATORIO.md`. Leituras de regra a confirmar em `docs/a-fazer.md` (PERGUNTAS AO AUTOR, Pacotes para Aliados). Não declarar revisão do Codex nem aceite do autor.
- Os servidores 5320 e 5321 deixados pelo Codex tinham caído. O Claude os subiu de novo nas mesmas portas (dev e prévia do `dist/` atual).

## Pedido novo: pacotes de buffs para aliados

O autor disse que a ficha parece funcionar e pediu outra funcionalidade:
o suporte configura várias fontes com seus atributos, exporta JSON e o
aliado importa opções permanentes para ligar/desligar sem registrar uma a
uma. Exemplos: auras de invocações, Bastião, Comandante, especializações
de suporte, Feitiços e Novo Estilo das Sombras.

Executar o novo lote em C:/Projetos/Grimorio/PROMPT-CLAUDE-PACOTES-BUFFS-ALIADOS.md.
O arquivo foi atualizado para abrir um novo chat do Claude sem depender da
conversa anterior: contém leitura inicial, estado atual, contratos aprovados,
limites e o pedido completo de implementação em lote.
O Codex preparou a especificação e conferiu os pontos atuais, não implementou
produto. O prompt propõe biblioteca no personagem separada de efeitos ativos
na sessão, fotografia calculada no emissor, regras de origem preservadas e
importação com versões sem duplicação. Não se limita ao formulário atual de
sete números nem presume que toda fonte é Feitiço recebido.

É escopo novo. Não reexecutar a integração antiga, promover G2 como padrão
ou diminuir os nove marcos já concluídos. Usar a fila e os relatórios atuais.

## Decisão vigente de 17/10/2026: interface anterior no uso diário

O autor pediu voltar à ficha anterior enquanto o rework não estiver pronto.
A integração parcial foi preservada em `grimorio-tracker/src/systems/afty/ficha/AftyFichaG2.jsx`
e `ficha/efeitos/`. `/Afty` e `/Player` abrem `AftyFichaClassica.jsx` por padrão.
Para desenvolver e revisar o G2, usar a mesma rota com `?ficha-g2=1`.
Não recolocar o G2 como padrão durante as etapas intermediárias. Promover
somente após concluir integração, compatibilidade, revisão e teste do autor.
As duas apresentações usam a mesma sessão. Nenhuma limpeza de dados foi feita.
Os registros abaixo de 16/10 são históricos e não substituem esta decisão.

## Reconferência de 19/10/2026: G2-I1 encerrado e revisão técnica aprovada

- A correção foi examinada independentemente pelo Codex. Sete contextos próprios de interface, 36 conferências passando. Minamoto, Player 30 e Calamidade mantêm o bônus entre G2 e clássica. Catálogo repetido, combinação de origens, expiração e confirmações rápidas passaram. Os 303 asserts focados e 21 verificações próprias das funções do Encontro passaram. Não declarar inclusão de Fonte Externa pela interface do Encontro.
- Os 17 hashes da entrega conferem antes e depois. Build e lint Afty/App aprovados. Relatório próprio: grimorio-tracker/.audit/revisao-codex-g2-i1-20261019/REVISAO-CODEX.md.
- Desempenho: 26 operações reais com Fonte Externa, dev/produção. Sem pausa de dois segundos nem ativação perdida na amostra. Confirmações G2 em produção pintam em 29 a 43 ms após pointerdown e dois quadros, mas tarefas longas residuais chegam a 72 ms (94 ms em dev). A amostra densa usa também um Feitiço recebido junto dos dois registros de Catálogo. Não sustentar como universal a medida de 54 ms da entrega. O aceite de uso real permanece com o autor.
- Progresso atual 9/10. Marcos 8 e 9 encerrados na base local, marco 10 pendente. Não repetir os prompts históricos de integração/correção. A clássica permanece padrão e o G2 prévia até o teste real. Referências locais indicam seis commits remotos à frente, ainda sem merge. Revalidar após integrá-los antes de publicar.
- Codex deixou os servidores em 5320 (desenvolvimento) e 5321 (produção). Links: http://127.0.0.1:5321/Afty?ficha-g2=1 e /Player?ficha-g2=1. Não usar a porta 5200 como prova da aplicação integrada. Nenhum código de produto ou dado do autor alterado pelo Codex.

## Histórico da primeira revisão em 19/10/2026: devolução superada

- O autor pediu também ler o chat Restaurar versão antiga do localhost. Codex leu os pedidos e o fechamento, confirmando a clássica como padrão e as travadas como bloqueio de lançamento. Não enviou mensagem àquele chat nem mudou a apresentação padrão.
- Fonte de produto não alterada pelo Codex. Evidências próprias em grimorio-tracker/.audit/revisao-codex-integracao-g2-20261019/auditoria.json. Devolutiva executável em C:/Projetos/Grimorio/DEVOLUTIVA-CLAUDE-INTEGRACAO-G2.md.
- G2-I1, P1: registrar Feitiço recebido de Defesa +7 no G2 leva Minamoto de 82 a 89. Voltar à clássica deixa 82, conservando o registro na sessão. O G2 traduz rec/beneficios em prepararCalculo, a clássica chama deriveAfty diretamente e ignora esse formato. Não é uma dúvida de regra. Corrigir interpretação compartilhada, sem apagar dados, duplicar bônus, criar segunda sessão ou carregar CSS do G2 na clássica. Verificar os demais consumidores pertinentes, inclusive Encontro, cujo caso de Fonte Externa não foi reproduzido pelo Codex.
- Testes focados: 244 asserts passaram. Build e lint Afty/App passaram. Oito percursos funcionais, 53 verificações e 52 passando, com G2-I1 como falha material. Custos, clique duplo, estorno, Golpe denso, preferências, recarga e Linha do Tempo foram amostrados. Virada com PE principal zero, renovação antes da cobrança e nota real passaram em três viradas.
- Desempenho: 42 operações atuais medidas em Chrome, Calamidade densa, Minamoto e Player 30, dev/produção. Não houve a pausa de dois segundos na amostra final. Houve tarefas de 73 a 80 ms no Minamoto clássico dev e de 58/57 ms na confirmação da Calamidade G2 dev/produção. Não declarar zero universal de tarefa longa ou aceite do autor. O perfil aponta derive/efeitos como trabalho relevante, e o orçamento é verificado depois do próximo passo do gerador. O antes não foi reconstruído/reexecutado independentemente. Pausas de teste e latência de automação não são ganho de código.
- 84 hashes finais do desenvolvedor conferem com os atuais. A suíte completa fornecida tem três falhas, uma classificação corrigida e passando isolada na revisão. As outras duas constam na linha de base. Não declarar suíte inteira verde sem nova execução final. Remoto local conhecido cinco commits à frente, consulta atual ao GitHub falhou, sem fetch/merge.
- Correção do G2-I1 entregue em 19/10 (noite), à espera de reconferência: interpretação única em grimorio-tracker/src/systems/afty/ficha/ficha-recebidos.js (folha), usada pelo G2, pela clássica, pelo Encontro e pelo delta dos estados. Minamoto 89 nas duas apresentações. 47 de 47 no Chrome e t-g2-fonte-compat com 52 asserts. O Encontro foi provado só na função. Evidências em grimorio-tracker/.audit/correcao-g2-i1-20261019/. Os marcos 9 e 10 não são autodeclarados.
- Desempenho depois da devolutiva: o corte das fatias agora prevê o próximo passo (ficha/fatias.js) e os dois derives de uma Fonte de Catálogo ganharam passos próprios. Com dois registros de Catálogo, de 4 tarefas de 50 a 67 ms para 1 de cerca de 54 ms. Detalhes em grimorio-tracker/docs/afty-ficha-final.md. Lint e build ok, suíte com as duas falhas da linha de base.
- Progresso atualizado para 7/10: integração técnica entregue em prévia. Compatibilidade (8) devolvida e aprovação da revisão (9) pendente, teste do autor (10) pendente. Não promover o G2 como padrão nem executar o prompt de integração inteiro novamente. Seguir a devolutiva em um lote, preservando funcionalidades nativas e dúvidas já resolvidas.

### Bloqueio adicional: travamentos ao ativar efeitos

Registro de 17/10, complementado pela revisão de 19/10 acima. Não é uma nova
medição da versão atual. O aceite de uso real continua com o autor.

O autor relata cerca de dois segundos de travamento por efeito no G2,
também presentes em menor escala na ficha clássica. Investigar e corrigir
antes do lançamento. Medir ambas as apresentações com as mesmas fichas,
separando cálculo, renderização e persistência, sem presumir causa visual.
Exigir evidências antes/depois, operações rápidas em sequência e ausência
de regressões de custos, derivados e sessão. Este pedido não foi resolvido
pela restauração da interface. Pendência registrada em `docs/a-fazer.md`.

Estado consolidado em 16/10/2026. Este arquivo resume a situação atual para um novo chat, sem carregar toda a conversa.

## Próximo pedido: integração em lote, prompt preparado
- Depois da revisão do fechamento, o autor pediu o próximo prompt para continuar e uma barra de progresso. O pedido para repasse ao Claude está em C:/Projetos/Grimorio/PROMPT-CLAUDE-INTEGRACAO-G2.md. O Codex preparou o prompt, não implementou a integração.
- O novo prompt substitui os limites antigos de protótipo apenas para este lote: integrar o G2 viável em src/systems/afty/, preservar outras abas, recursos, sessões e temas, com ligação mínima em src/App.jsx se necessária. Permite a correção técnica da nota da virada, inclusive metadados aditivos no verbo e o consumidor do v2 afetado, sem mudar mecânica. Sem src/components/, commit, push ou deploy.
- Não transportar o Estudo como aplicação inteira nem manter uma segunda sessão de combate. Nenhuma dependência de execução em protótipos, aliases externos ou fixtures de estudo. Preservar pagamentos automáticos e custos em Vida das funções nativas fora dos fluxos manuais do estudo.
- O mesmo lote inclui compatibilidade de persistência, preferência por personagem com export/import, outras abas, recursos especiais, CSS/temas e verificações no destino. A dependência do Surto deve ser resolvida tecnicamente na base atual, preservando trabalho local. Pendências de regra e famílias adiadas continuam separadas.
- Progresso em C:/Projetos/Grimorio/PROGRESSO-FICHA-FINAL.md: 6/10 marcos concluídos, por entregas e não por horas. Integração e compatibilidade são os marcos 7 e 8, ainda pendentes até a entrega. Revisão do Codex e teste final do autor são 9 e 10, sem autoaprovação pelo desenvolvedor.
- Na preparação, Codex leu o AGENTS da aplicação e os documentos obrigatórios. Confirmou trabalho paralelo extenso, HEAD local 6888873 e módulo de especializações não rastreado. A comparação com o remoto não foi possível por falha de conexão, sem fetch/merge ou alteração do repositório. Claude precisa registrar a base atual antes de editar.

## Estado mais recente: fechamento entregue e revisado pelo Codex
- O lote de NOVO-CHAT-CLAUDE-FECHAMENTO-G2.md foi entregue. Não executar esse prompt outra vez nem reabrir o reconhecimento do Golpe, a responsividade ou os fluxos já concluídos sem um novo defeito concreto.
- Codex encerrou G2-E8-1 por amostra independente: nove percursos do Golpe denso, na completa, compacta e catálogo, em 1024x720, 1280x800 e 1440x900. Preparação dentro da coluna, texto quebrando, Confirmar recebendo clique real e uma operação registrada. Também conferiu redimensionar com rascunho e confirmar por Enter.
- Histórico e estatísticas do cabeçalho passaram na amostra independente. Estorno por clique duplo devolve PE uma vez, preserva dano do Sacrifício, marcas, usos e PV. Eventos conservam ordem, rodada e horário da mesa. Cobrança de estado do Invencível mostra Sem Estorno. Consulta, filtros e fechamento preservam sessão e leitura.
- Preferências: ocultar CD, mover Maestria pelo teclado, recarregar, alternar Minamoto/Player 30, retornar e restaurar passaram. Configuração não mudou o negócio da mesa. Dados inválidos, ids ausentes e novos passaram nas funções puras.
- Evidências próprias: C:/Projetos/Grimorio/prototipos/ficha-final-efeitos-refinado/capturas/revisao-codex-fechamento-20261016/auditoria.json. Quinze contextos isolados, 55 conferências de interface e 11 das funções de preferência, sem falha final ou erro de página. Dois erros do verificador foram corrigidos e preservados nos relatórios: comparação de hash completo com prefixo e retorno sem ficha=minamoto que permanecia no Player 30. Não eram defeitos de produto.
- Os 38 arquivos atuais de src coincidem com os três registros finais e precedem as baterias. Os 131 hashes de protótipo nos seis relatórios novos conferem. Treze módulos do motor e três do v2 continuam iguais à E7 e aos atuais. As 27 baterias relatam saída zero, e 24 links relatam sucesso. Os 64 booleanos antigos são idênticos por comparação de arquivos, sem repetição independente de toda a bateria.
- Pacote de passagem: C:/Projetos/Grimorio/prototipos/ficha-final-efeitos-refinado/PACOTE-FECHAMENTO-G2.md. Antes de integrar, corrigir a nota da virada que confunde renovação com gasto e validar o verbo do Surto no motor de destino. A persistência da preferência no personagem é decisão técnica da integração. A Consulta continua uma gaveta que cobre a Preparação enquanto aberta, Esc preserva o rascunho. Isso não é o defeito de Termina já encerrado.
- Próximo passo recomendado: avaliação curta do autor nos fluxos novos, depois integração do escopo viável em um lote com as dependências explícitas. Não presumir autorização para integrar, mexer no motor/v2, fazer commit ou push. Arsenal/Ciclagem, Canalizar/PER e Artes do Combate continuam separados. Codex só atualizou evidências e coordenação, sem implementação de produto ou uso da sessão do autor.

## Histórico do pedido de fechamento (atendido)
- O autor relatou responsividade quebrada com muitos efeitos/propriedades e Confirmar que às vezes não recebe clique. Pediu corrigir e começar o próximo lote na mesma execução, com contexto para um novo chat do Claude, sem entregas de uma habilidade por vez.
- Pedido atual completo: C:/Projetos/Grimorio/NOVO-CHAT-CLAUDE-FECHAMENTO-G2.md. Correções primeiro, depois Histórico/Desfazer delimitado e estatísticas do cabeçalho configuráveis por personagem, requisitos já registrados. Preparar também PACOTE-FECHAMENTO-G2.md no protótipo, sem integrar.
- Codex reproduziu G2-E8-1: com Amplo, Atroz, Impactante, Longo, Penetrante, Preciso e Sacrifício selecionados, a Preparação chega a 661 px e invade a coluna vizinha. Em 1280, Ajustar tem cerca de 361 px; em 1440, 414 px; em 1024, 275 px. Termina intercepta o clique real no Confirmar habilitado, sem bloqueio de regra. O contador não avança. Sem erro de página.
- O vazamento também foi medido na compacta e no catálogo, inclusive sem ativos, com sete propriedades confirmadas na montagem do teste. Nesses caminhos, o clique automático nativo consegue rolar o contêiner e confirmar, o que não resolve a largura inicial. ScrollWidth global igual ao viewport não detecta o vazamento. O resumo data-golpe-partes herda white-space nowrap de x-custo, ponto a investigar na cadeia de tamanho.
- Evidências: capturas/revisao-codex-e8-1792193188442/auditoria.json e reproducao-corrigida.json, sete casos em 1024/1280/1440. A primeira montagem do teste não esperou render entre escolhas e não atingiu a condição densa; preservada no relatório inicial, sem servir de prova do estado do print. Nenhuma implementação ou sessão do autor alterada.
- Os testes anteriores de repetição por DOM não provam recebimento de ponteiro. O novo lote deve medir os componentes e sobreposições e usar cliques reais e teclado, sem force como atalho de aprovação. Preservar guardas de revalidação e repetição, bloqueios legítimos e cancelamento sem mutação.
- A revisão do reconhecimento G2-E6-1 continua encerrada. Não reabrir esse defeito nem refazer a E6/E7. O novo problema é de layout/interação e não equivale a erro no custo do montador. E7 permanece a base funcional; não declarar o lote de fechamento implementado antes da entrega.
- Limites continuam: protótipo apenas, sem motor/v2/aplicação principal, integração, commit ou push. Questões de regra ficam isoladas e não param as frentes independentes. Autor decide visual, Codex revisa e Claude desenvolve.

## Base já revisada: E6 corrigida na E7
- Claude entregou a consolidação ampliada: desconto contextual, Feitiços com trava, Sustentação em rascunho, montador de Golpe Especial, alinhamento de Habilidades/consulta e Arremessos Potentes. O defeito de Golpe somente com marcas próprias foi corrigido na E7. Não repetir a implementação dessas frentes ou executar novamente DEVOLUTIVA-CLAUDE-E6.md como pedido pendente.
- Codex encerrou G2-E6-1 por amostra independente da E7: dezoito contextos em 1280/1440, 202 verificações passando, sem exceção ou erro de página. Evidências: capturas/revisao-codex-e7-1792192557947/auditoria.json. Os relatórios anteriores da falha continuam preservados na revisão da E6.
- Conferidos os ciclos completos das cinco propriedades próprias na completa e de Amplo/Sacrifício na compacta: cancelar, confirmar com clique duplo, mostrar efeito, catálogo Ativo, Montar Outro, Encerrar e Reativar com pagamento/dano pelo motor. Também passaram as transições entre misto e só próprias e a concordância de Habilidades/consulta. Nenhum estado fictício foi criado. Uma propriedade mostra o nome; duas ou mais, a quantidade, com detalhe completo. Cartão de 76 px preservado.
- Evidências finais do Claude: capturas/e7-devolutiva/final/. Os 34 arquivos de src coincidem com os registros antes/depois das baterias e com os atuais, sem arquivo extra ou ausente. Todos os hashes de protótipo nos dez relatórios novos conferem; última edição anterior ao início das baterias. Treze módulos comparáveis do motor e três do v2 continuam iguais. A pendência de PreparoG2.jsx está encerrada. Os 64 booleanos da lista antiga coincidem por comparação de arquivos, sem reexecução independente da bateria inteira.
- Desconto, Habilidades, trava e Sustentação já haviam passado na amostra da E6 e continuam preservados. Isso é revisão funcional por amostra, não auditoria universal ou aceite visual do autor para o lote novo. A frase do LEIA sobre o resto aceito não substitui a avaliação de uso do autor. Não pedir aprovação por propriedade nem repetir a matriz inteira manualmente.
- Codex só atualizou evidências próprias e continuidade. Sem implementação de produto, integração ou commit. Próximo retorno do autor pode tratar de uma experimentação curta do lote e das dependências já registradas, sem nova rodada geral de redesign.

## Papel e objetivo
- Claude desenvolve o protótipo. Codex revisa independentemente. O autor decide o visual e repassa as mensagens.
- O autor pediu acelerar: trabalhar por famílias de comportamento em entregas maiores, sem aprovação por habilidade ou por retoque menor.
- E2 e E3/E4 foram entregues e passaram nas amostras independentes do Codex. A E3/E4 teve 102 verificações em catorze percursos, nas duas larguras, sem erro de página. Depois da correção de Cobrir-se e Espírito, o autor respondeu que o restante está válido, apontando somente o fluxo de desconto da Energia. Não refazer essas entregas nem abrir nova rodada geral de redesign.
- Pequenos retoques visuais podem ficar para o uso posterior. Erros de regra, cálculo, custo, consumo ou perda de estado precisam ser corrigidos na entrega.

## Ler somente o necessário
1. Este resumo.
2. As seções atuais do LEIA.md em C:/Projetos/Grimorio/prototipos/ficha-final-efeitos-refinado/LEIA.md, principalmente Catálogo e as limitações.
3. Para reaproveitar o inventário e a E2 existentes: C:/Users/gabri/.claude/plans/pasted-content-id-3370-entre-no-virtual-creek.md. As decisões consolidadas deste resumo prevalecem sobre perguntas antigas desse plano.
- Consultar C:/Projetos/Grimorio/CONTINUIDADE-FICHA-FINAL.md e outros arquivos só quando necessário. Não carregar todo o histórico nem refazer o inventário geral.
- Ler as instruções AGENTS.md aplicáveis antes de editar.

## Onde trabalhar e testar
- Protótipo: C:/Projetos/Grimorio/prototipos/ficha-final-efeitos-refinado.
- Completa com cinco: http://localhost:5200/?cena=cinco&aba=efeitos
- Completa com quinze: http://localhost:5200/?cena=quinze&aba=efeitos
- Habilidades e compacta: http://localhost:5200/?cena=quinze
- O modelo esquemas-efeitos.html é referência visual estática, não prova de funcionamento.
- Só Habilidades e Efeitos estão habilitadas neste estudo. Ações está fora.
- O protótipo importa módulos vivos de grimorio-tracker, com trabalho paralelo local. Preservar esse trabalho e registrar hashes dos módulos importados nas evidências.
- Sem mudanças no grimorio-tracker, motor, v2, integração, commit ou push. CONTINUIDADE fica com o Codex.

## O que já foi entregue e aceito
- G2 Cartão Etiqueta, composição de Mosaico e Linha do Tempo, catálogo e compacta G2 padrão.
- Cartões de 76 px, sem etiqueta vazia, informações extensas no detalhe. Estados em 17 px. Avisos operacionais roxos.
- Catálogo: categorias, busca, linhas de 44 px sem subtítulo, estrelas cheia/vazia alinhadas, Ativar/Ativo como textos discretos e alinhados. Habilidades: linhas de 48 px sem subtítulo.
- Compacta: itens de 58 px, detalhe de um efeito por vez. Adicionar/Voltar e Expandir preservam contexto. Encerrados compartilhados, recolhidos ao entrar, com Reativar.
- Linha do Tempo usa cópias da sessão e a virada real do motor, com quatro colunas gerais. Marcadores pequenos e explicação por hover, foco e clique. Invencível e sua Exaustão estão conferidos, incluindo PE temporário renovado antes da manutenção.
- Resumos aceitos: Concentrar Aura como quantidade de Auras; Espírito Incansável como melhoria do Espírito de Luta; Repertório como Duelando, Duas Armas ou 2 Estilos.
- Não pedir novamente aprovação desses resultados ou executar outra comparação geral de layouts.

## Contrato funcional existente
- Ataque Concentrado: Preparação e prévia reais, custos acumulados 1/3/4 PE cobrados ao confirmar. Ajuste para cima cobra diferença, para baixo não devolve. É exceção deliberada de cobrança.
- Concentrar Aura: Preparação, escolhas e limite do motor, sem custo registrado.
- Conhecimento Aplicado: Preparação e custo manual. No mesmo uso, 2 para 3 pede apenas 1 PE adicional e mostra total 3. Descer não devolve. Reativar é uso novo, custo inteiro.
- Invencível: Preparação, cobrança real de 4 PE ao ligar e manutenção pelo motor. Preservar contador e Exaustão pendente.
- Golpe Especial: o montador usa as funções públicas da ficha para custo e pagamento. Cada confirmação é um golpe novo, com as mesmas marcas ou outras, protegido contra clique repetido. Inclui as marcas de sessao.combate e sessao.golpeEspecial, sem rolar o ataque. É o contrato específico de cobrança do montador, não cobrança automática para todo efeito.
- Confirmações revalidam estado e Energia atuais, são protegidas contra repetição e aplicam tudo ou nada. Cancelar e consultar não alteram a mesa.
- O desconto manual aparece somente depois de confirmar, nunca como ação funcional no rascunho. Confirmar não prova pagamento manual.
- Ativação vinda da compacta retorna à compacta com o efeito aberto. Catálogo preserva categoria, busca, seleção e rolagem.
- Desfazer gasto não desfaz o estado. Não introduzir retorno no tempo.

## E2 entregue, sem repetir implementação
- Preparação comum acrescentada a sete opções: Faíscas, Aura Excessiva, Aura Embaçada, Golpe com Aura, Repertório, Potência Concentrada e Sintonizada. É lista fechada, não filtro genérico.
- Faíscas: sem escolhas, Sem Custo Registrado e condição do Kokusen. Sem custo registrado não significa grátis.
- Aura Excessiva: custo atual de 2 PE, bloqueio sem Energia, confirmação sem débito ou registro de pagamento. Descontar só depois. Manutenção futura opcional/manual, sem cobrança pela virada ou pagamento presumido nos marcadores.
- Repertório: Ajustar também é rascunho. Nenhum estilo bloqueia a confirmação; usar Encerrar para desligar. Só Duas Armas permanece assim no Ajustar e no Reativar, sem religar Duelando por padrão.
- Registrar Uso consome os usos reais: Indomável usa marcaUso e Surto usa usarEfeitoEspecializacao. Surto bloqueia na mesma rodada. PE continua manual, e usos esgotados bloqueiam. Ataque Extra só registra evento porque não tem contador; não inventar limite.
- O verbo do Surto está em ficha/ficha-especializacoes.js, local ainda sem commit. Validar a dependência antes da integração; não pedir ao autor decidir isso como regra visual.
- Sempre Valendo foi aplicado aos dois Feitiços Passivos explicitamente identificados pelo catálogo. Não exigir agora classificar os 61 candidatos ambíguos nem presumir passividade por haver número permanente no derive.
- Codex executou dez percursos isolados e 110 verificações em 1280/1440, todas passando, sem erro de página. Evidências: capturas/revisao-codex-e2-1792118159027/auditoria.json e complemento-corrigido.json. Erros iniciais de seletor dos roteiros próprios estão documentados e preservados, não eram falhas de produto.
- Os 29 hashes da entrega conferiram; os onze módulos do motor e três do v2 comparáveis à entrega anterior permaneceram iguais. Os 64 booleanos da lista antiga coincidiram por comparação de arquivos, sem reexecução independente de toda a bateria.
- O autor não relatou um novo teste manual da E2, mas autorizou seguir para a próxima etapa. Não bloquear o lote seguinte esperando repetir a E2 nem pedir aprovação por habilidade.

## E3/E4 entregue e revisada, não refazer
- Preparação comum em Cobrir-se, Estímulo Muscular, Mente Plácida, Precisão Definitiva, Assumir Postura e Espírito de Luta. Quantidades, escolhas, limites, cancelamento, confirmação, ajuste, reativação e compacta já foram implementados.
- PV distingue concede, registrado e resta. Registro revalidado na mesa atual, uma reserva por benefício, consumo sem reabrir concessão e dados antigos da Terra normalizados ao carregar pelo maior saldo. Espírito mantém registro manual, sem concessão automática ao ativar ou ao trocar a melhoria.
- Postura gasta um uso ao Ativar/Reativar na mesma operação dos estados. Rascunho e Ajustar não gastam. Quais trocas deveriam gastar ainda é pendência de regra, sem decisão nova do Codex.
- A prévia incompleta agora diz Benefício Fora dos Números Comparados, com explicação no title. A referência documental das regressões da E2 foi corrigida. Não repetir esses ajustes.
- Auditoria de empates, prazos e Fonte Externa entregue pelo Claude. Codex leu as evidências, sem repetir todos os percursos. Na amostra player30Neds conferiu independentemente a linha do Addon expirar na virada real, mantendo o estado sem prazo; a cópia do Addon é idêntica à do repositório.
- Evidências próprias: capturas/revisao-codex-e3e4-1792150700685/auditoria.json, revisao-corrigida.json, complemento-espirito.json e addon.json. As correções dos seletores e da espera pela gravação nos testes próprios estão documentadas. Os 32 hashes da entrega conferem; os doze módulos do motor e três do v2 comparáveis à E2 ficaram iguais.
- O autor já experimentou a correção e validou o restante, com a ressalva do desconto de Energia descrita abaixo. Não pedir novamente os mesmos testes nem aprovação por habilidade.
- O autor corrigiu as premissas e a implementação JÁ foi corrigida: Cobrir-se tem Usar Novamente, custo inteiro, valor igual permitido, reserva pelo maior, cancelamento intacto e proteção contra repetição por mesa.reusos. Não existe mais o ajuste incremental do uso atual. O prazo continua manual, sem contador de turno inventado.
- Espírito de Luta e Espírito Incansável já aparecem como escolhas por nome ao preparar o uso. A regra do Incansável foi conferida no Livro de Regras p. 73 (SHA-256 1d0713d52c818a9ab9f47b883d9887a0d227d174d30ffcce358874669a7a733a). O efeito ativo não oferece upgrade; a mudança de escolha é feita ao Encerrar/Reativar. Custos e registro de PV continuam manuais e não há dois efeitos acumuláveis. A amostra identificada minamotoSemIncansavel não oferece a escolha.
- Essa correção foi revisada pelo Codex: setenta verificações válidas em 1280/1440, sem erro de página, em capturas/revisao-codex-correcao-1792158931528/. Os 32 hashes conferem; treze módulos do motor e três do v2 permaneceram iguais. As duas falhas de seletor do roteiro próprio e o complemento correto estão documentados. O autor validou os fluxos, com a ressalva do desconto de Energia. Não repetir a implementação ou pedir aprovação por habilidade. A pasta e5-correcao não encerra a E5 original do plano.
- A pergunta de custo de troca de versão foi retirada nesse formato, não respondida como adicional de 1 PE. A correção de Cobrir-se não decide todas as concessões das outras habilidades. Primeira Terra, turno versus rodada, PER e consumo ambíguo de usos continuam pendências específicas.
- A manutenção da Aura Embaçada fica no texto da regra e ainda não tem linha temporal. Sua forma de acompanhamento pode ser decidida na frente de duração/manutenção. Não presumir cobrança automática, pagamento ou gratuidade.
- Decisões rotineiras de implementação ficam com Claude. Se um item exigir regra nova ou mudança no motor, isolar a pendência, agrupar as dúvidas no relatório final e continuar o trabalho independente.

## Arsenal/Ciclagem: dependência adiada, não alterar neste lote
- O mesmo estado arsenalCiclico hoje dispara o dado extra do Arsenal e o +2 da Ciclagem.
- O autor decidiu Arsenal até o fim da próxima rodada, mas Ciclagem somente na próxima jogada de ataque. Consumir um não pode consumir ou renovar o outro.
- Separar de verdade depende de estado próprio no motor e ligação do consumo nos percursos de ataque. Não compensar com fonte fictícia de -2 nem remover habilidade de uma cópia da ficha.
- Neste lote, Arsenal fica como hoje, sem prazo novo ou nova linha temporal. Registrar a limitação, sem apresentar isso como conclusão da regra desejada.
- Ataque de Feitiço consumir Ciclagem continua pergunta futura. A recomendação anterior do Claude não equivale a decisão do autor.

## Dependências e frentes ainda abertas
- A base de quantidades/modos e PV/Terra já foi entregue na E3/E4. Restam as decisões específicas listadas acima e a revisão/integração futuras. Empates, duração e Fonte Externa tiveram auditoria no protótipo, sem equivaler a conclusão da aplicação principal ou cobertura universal.
- Espírito de Luta, Assumir Postura e Cobrir-se já usam a Preparação comum. Montador de Golpe Especial, Sustentação e Feitiços ligáveis com trava entraram na E6, e o defeito de reconhecimento do montador foi encerrado na E7. Artes do Combate e políticas novas de manutenção continuam separadas, sem inclusão por filtro genérico.
- Canalizar em Golpe e Canalizar Energia Reversa dependem de quantidade no motor. Recursos PER exigem tratamento próprio, não desconto disfarçado de PE.
- Habilidades e consulta agora encaminham os grupos já cobertos pela Preparação ao mesmo fluxo aprovado, preservando a lista e os contadores simples. Dependências adiadas, como Arsenal/Ciclagem, Canalizar e PER, mantêm os controles anteriores. Não refazer o alinhamento entregue.
- Antes da integração ainda é preciso corrigir a nota de histórico que confunde renovação e cobrança de PE. Addon com expiraNaRodada foi coberto na amostra player30Neds; não generalizar a todos os Addons. Motor/v2 não estão liberados neste pedido.

## Verificação e entrega
- Cobrir automaticamente todas as opções alteradas, aprofundando um ciclo completo por comportamento e suas exceções. Comparar com o motor, não com números fixos de uma cena.
- Verificar cancelar, custo, limites, falta de Energia/usos, clique repetido, confirmar, Encerrar/Reativar e retorno, na completa e compacta, em 1280/1440 com as amostras pertinentes.
- Rodar as regressões afetadas ao final do lote. Repetir depois somente quando mudanças ou falhas justificarem. Não sobrescrever evidências antigas.
- Atualizar o LEIA.md com implementado, dependências adiadas e limitações. Distinguir teste executado de teste apenas previsto.
- Entregar links localhost verificados, um roteiro do autor com até cinco tarefas representativas, evidências e uma lista consolidada das pendências. Não enviar cada habilidade como uma entrega para aprovação separada.
- Não transformar pequenos retoques visuais em bloqueios da entrega. Não ocultar erros funcionais sob o rótulo de polimento.

## Pedido do lote em 16/10: consolidação ampliada (entregue e corrigida)
- O autor validou o restante da correção de Cobrir-se/Espírito e perguntou por que a Energia oferece Definir em vez de Descontar. Pediu explicitamente prompts maiores e mais avanço por entrega.
- Codex confirmou por leitura que GastarNaEnergia abre PainelVital genérico, que oferece Gastar, Recuperar e Definir. Definir chama acoes.definir e substitui o saldo, enquanto gastar chama gastoManual. Não resolver renomeando Definir para Descontar. Esta constatação é de código, sem reprodução nova do clique no navegador.
- O prompt de origem está em C:/Projetos/Grimorio/PROMPT-CLAUDE-CONSOLIDACAO-AMPLIADA-G2.md. O lote e a correção específica do Golpe foram entregues e passaram nas amostras independentes descritas no topo. Não executar os prompts de origem e devolutiva como se o trabalho ainda estivesse pendente.
- Custo manual continua manual: abrir não desconta. O fluxo contextual deve oferecer a operação de gasto, com o valor conhecido da operação preenchido, sem confundir com saldo absoluto. Preservar o editor geral do cabeçalho e as exceções automáticas existentes.
- A proposta é execução em lote, com uma entrega e até cinco tarefas para o autor. Isolar dúvidas de regra e dependências reais sem parar as frentes independentes. Permanecem fora motor, v2, aplicação principal, integração, commit e push.
