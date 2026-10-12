# Prompt de execução: G00 | Inventário, fontes, cobertura e protocolo da campanha

Você é o executor deste lote. Faça a revisão, corrija erros comprovados e implemente as automações confirmadas e necessárias ao escopo. Trabalhe até entregar um resultado verificável, preservando todas as parcelas ainda dependentes de decisão. Este prompt autoriza alterações neste lote, nos mecanismos gerais indispensáveis e em suas provas/documentação. Não autoriza decisões de regra novas.

## Contexto e objetivo do autor

O repositório local é C:/Projetos/Grimorio/grimorio-tracker. Esta campanha revisa o Afty e a Ficha de Player, incluindo conteúdo nativo e addons. Os sistemas são definidos por creature.rulesVersion, não pela rota. Verifique ambos e preserve as diferenças aprovadas.

O autor quer toda Habilidade de Especialização, Aptidão e demais conteúdos conectados ao Motor de Automação. O motor deve crescer para que os jogadores criem suas próprias habilidades com as mesmas capacidades. Resultado correto obtido por cálculo particular escondido não satisfaz a revisão.

Use mecanismo existente quando adequado. Se faltar capacidade, implemente ou proponha uma extensão geral com schema, validação, contexto, consumidor, fontes, editor e addon. A regra de uma habilidade deve ser dado declarativo/DSL usando primitivas gerais. Requisitos, aquisição e transições precisam de mecanismos tipados adequados; não force tudo a caber em canal numérico.

Definição de motor nesta campanha: linguagem e tipos de efeitos, coleta, aplicação, alvos, condições, fontes e primitivas gerais de execução/sessão. Catálogo escolhe configuração; resolvedor genérico executa; interface configura/exibe ou encaminha a ação. Não declare algo como motor apenas por mover um if por ID para outro arquivo.

Fato que depende de julgamento da mesa deve ter entrada explícita quando sua confirmação permite automatizar as consequências. Diferencie procedimento manual intencional, regra sem decisão e lacuna de capacidade. Marcação antiga de mesa não encerra a análise.

## Leitura e fontes

- Leia AGENTS.md e CLAUDE.md na raiz e orientações aplicáveis à área. Resolva instruções históricas contra o código atual e decisões mais recentes, preservando as regras vigentes.
- Leia docs/a-fazer.md para pendências/decisões e procure em docs/afty-status.md somente o histórico pertinente. Registro histórico não é prova do estado atual. Não reapresente decisão já tomada como dúvida.
- Leia docs/afty-motor-referencia-estrutural.md, docs/automacao-dsl.md, docs/afty-player.md, docs/afty-addons.md e os guias específicos listados abaixo, nas seções pertinentes.
- A fonte principal do Livro de Regras 2.5.2 é C:/Projetos/Grimorio/F&M 2.5.2 - Livro de Regras.md (fora do repositório). Confirme leitura e SHA-256 1d0713d52c818a9ab9f47b883d9887a0d227d174d30ffcce358874669a7a733a. Texto pelo Markdown, página pelo último marcador <!-- página N --> acima do trecho, inclusive tabelas. O PDF public/docs/F&M 2.5.2 - Livro de Regras.pdf serve somente para desempate documentado.
- Registre fonteLivroRegras.caminho e fonteLivroRegras.sha256 no lote; inclua o caminho absoluto e esse hash em base.hashesIniciais, base.hashesFinais e auditoria.hashesExaminados. Nas parcelas do livro, fontes[].versao ou fontes[].sha256 deve conter esse hash; preencha paginaImpressa e marcadorPagina. Para desempate, acrescente uso=desempate e motivoDesempate à referência do PDF.
- O Grimório das Maldições continua em public/docs/F&M 2.5.2 - Grimório das Maldições.pdf, com página impressa e página PDF distintas. Para homebrew, localizar a fonte própria e decisões registradas. Catálogo ou addon não é prova independente quando há fonte original.
- Correções e proveniência: C:/Projetos/Grimorio/_backup-livro/correcoes.md. Cópias antigas do Markdown não são prova válida, pois tinham paráfrases e números trocados, inclusive na página 270. Não copie U+2014 para o repositório. Preserve os erros do próprio livro e as decisões Afty/Player vigentes. Fonte inacessível, hash divergente ou conflito real impede aprovação; registre a pendência sem supor regra.

## Escopo deste lote

Objetivo exclusivo: Inventário, fontes, cobertura e protocolo da campanha.

Dependências: . Antes de executar, confira os registros destes lotes. Se faltar capacidade indispensável, registre a dependência específica e avance nas parcelas independentes. Não trate dependência listada como aprovação implícita.

Este lote é de mecanismo ou família funcional. Antes de editar, materialize o inventário dos componentes definidos nos focos abaixo e atribua chave a cada regra, opção ou transição examinada. A aprovação deve cobrir esse inventário explícito.

Inclua opções e subopções próprias, inclusive pools aninhados e valores gerados dinamicamente. Referência a habilidade de outra família exige teste de integração, mas a regra original continua com seu proprietário. Não duplicar aprovação nem ignorar efeitos concedidos.

A lista foi extraída em 2026-10-05. Compare com o catálogo vivo. Item novo não entra silenciosamente no lote; registre a mudança de inventário e atribua proprietário. ID ausente precisa de explicação. Renomeação deve conservar rastreabilidade.

Pontos específicos obrigatórios:

- Criar o controle da campanha em docs/revisao-automacao/ usando o manifesto entregue neste pacote como ponto de partida. Estados iniciais são NÃO REVISADO. O pacote de prompts não é evidência de aprovação.
- Conferir o inventário vivo dos catálogos, as escolhas aninhadas, os conteúdos gerados por herança e todos os arquivos de addons. Comparar com o manifesto, atribuir proprietário único a itens novos e registrar itens removidos. Reconhecer aliases e subconjuntos, sem contar HABILIDADES_ROUBAVEIS como habilidades novas.
- Mapear fontes para cada família, sem considerar descrição de catálogo prova independente da regra. Registrar fontes faltantes ou divergentes e decisões já tomadas.
- Criar uma verificação de cobertura que detecte itens vivos sem registro, registros órfãos e duplicação de proprietário. Ela deve apontar revisão ausente sem fingir que todos os itens existentes foram auditados. Separar a verificação de inventário dos testes comportamentais.
- Registrar linha de base real da suíte, build e lint. Ler avisos históricos de testes vermelhos como histórico e confirmar o estado atual. Mapear também os testes em src/systems/afty/asserts/ que o lançador não executa.
- Definir registro por parcela da regra, dependências de mecanismos, versão da fonte, hashes dos arquivos examinados e estados separados para implementação e auditoria. Integrar pendências exclusivamente a docs/a-fazer.md.
- Estabelecer a passagem do executor para o auditor com lista de arquivos e estado estável. Uma pessoa ou chat edita por vez nesta mesma árvore de trabalho. Não precisa criar coordenação externa, serviço ou sistema de travas automático.

Arquivos iniciais, sem limitar a busca dos consumidores reais:

- C:/Projetos/Grimorio/grimorio-tracker/AGENTS.md
- C:/Projetos/Grimorio/grimorio-tracker/CLAUDE.md
- C:/Projetos/Grimorio/grimorio-tracker/package.json
- C:/Projetos/Grimorio/grimorio-tracker/asserts/rodar.mjs
- C:/Projetos/Grimorio/grimorio-tracker/asserts/LEIA.md
- C:/Projetos/Grimorio/grimorio-tracker/docs/a-fazer.md
- C:/Projetos/Grimorio/grimorio-tracker/docs/afty-status.md

## Restrições de trabalho

- Não fazer commit, push, deploy ou publicar mudanças. Preservar alterações de outros chats e arquivos do autor. Conferir git status e diff na entrada e na saída. Nunca resetar, descartar, stashar ou substituir trabalho de outra pessoa.
- Nesta mesma árvore de trabalho existe apenas um executor editando código/docs por vez. O auditor trabalha por leitura e resultados em chat. Sincronização de Git prevista em CLAUDE.md só ocorre com checkout livre; não mover a base durante edição concorrente ou com mudanças locais. Não criar novo checkout automaticamente.
- src/components/ e src/data/enciclopedia-digital-*.json conservam as restrições do AGENTS.md. Este prompt não autoriza exceção nova. Escalar apenas a mudança indispensável que dependa de exceção, continuando o trabalho independente.
- Texto de regra precisa permanecer fiel à fonte e aos ajustes do autor. Ambiguidade não autoriza fórmula suposta. Não alterar balanceamento, pré-requisito, alvo, custo ou duração para facilitar implementação.
- Não introduzir U+2014. Respeitar UI do Afty, sem explicações de regra soltas, sem redesign amplo, com controles no padrão atual e fontes consultáveis.
- Addon é dado/DSL, sem eval, execução de JavaScript de terceiros ou verbo exclusivo escondido. Estado de jogo permanece na sessão; configuração permanente na ficha.
- Há módulos folha e ciclos de imports. Ler a lista viva de asserts/t-ordem-modulos.mjs, preservar suas restrições e verificar a ordem quando imports mudarem.
- Usar somente fichas e sessões de teste isoladas. Preservar dados reais, armazenamento pessoal e arquivos exportados do autor.

## Método obrigatório

1. Conferir checkout, mudanças preexistentes, fontes, decisões e testes atuais. Criar a linha de base do lote e inventário por parcela, incluindo todos os IDs acima.
2. Traçar o percurso real de cada parcela e avaliar os estados separados abaixo. Inspecionar o que realmente executa, não apenas a presença da chave em um mapa de efeitos.
3. Para dúvidas: procurar decisão vigente; se continuar em aberto, perguntar ao autor com trecho/local da fonte, leituras possíveis e consequências. Manter a parcela sem alteração até resposta e continuar nas independentes. Resposta anterior vale para seu escopo e não precisa ser pedida novamente.
4. Corrigir diferenças objetivas e integrar o motor. Capacidade ausente exige desenho geral pequeno e verificável, com pelo menos outro uso configurável. Completar validação, fonte, consumidor, autoria, addon e persistência necessários à capacidade.
5. Provar resultados com testes de regra, uso em sessão e reprodução pelo jogador. Conferir integrações atingidas por mudança compartilhada. Evitar refatoração ampla não necessária ao lote.
6. Registrar resultado, dependências e evidências. Entregar arquivos examinados/alterados, seus hashes finais e intervalo da validação para auditoria independente. Revisar diff, alterações alheias e U+2014 antes de encerrar.

## Registro por parcela

No G00, copiar o schema de C:/Projetos/Grimorio/prompts-a-fazer/revisao-automacao-2026-10-05/schema-registro.json para docs/revisao-automacao/schema-registro.json e usá-lo como estrutura comum. Os demais lotes devem seguir esse schema, sem renomear seus campos/estados. O mapa de opções em C:/Projetos/Grimorio/prompts-a-fazer/revisao-automacao-2026-10-05/mapa-opcoes-catalogos.json indica os donos iniciais das opções e componentes. Conferir ambos contra o código atual.

- Identificação: chave de família/ID, nome, fonte/versionamento, página, sistemas em que vale, aquisição e opções internas.
- Regra: descrever cada parcela separadamente e confirmar efeito, alvo, condição, fórmula, dado, arredondamento, escalonamento, limite, acúmulo, ação, custo, usos e duração. N/A exige justificativa curta.
- Percurso: registrar configuração -> catálogo -> coletor/contexto -> primitiva/canal -> consumidor -> resultado/fontes -> acionamento/sessão -> telas. Citar caminhos e funções atuais. Dado declarado sem consumidor é efeito ausente.
- Estados separados: regra CONFIRMADA / AGUARDA AUTOR / DIVERGÊNCIA; execução COMPLETA / PARCIAL / AUSENTE / MANUAL INTENCIONAL; motor INTEGRADO / PARCIAL / LÓGICA ESPECÍFICA / CAPACIDADE AUSENTE; autoria INTERFACE / ADDON / INACESSÍVEL; evidência NÃO VERIFICADA / APROVADA / FALHOU.
- Criatividade: construir reprodução com nome/ID próprio usando as ferramentas reais e parâmetros controlados. Demonstrar paridade de comportamento e fontes; se a interface não permite, registrar a limitação separadamente, mesmo que um teste programático passe.
- Manutenção: vincular a parcela aos canais, variáveis, mecanismos, aquisição, sessão, editor e persistência de que depende, indicando quais mudanças exigem revalidação.

## Validação e critérios de aceitação

- Registrar linha de base atual antes de editar. Não assumir contagens, teste vermelho ou lint antigo como estado de hoje. Separar falha anterior, regressão introduzida e falha causada por arquivo ainda mudando.
- Usar testes existentes como ponto de partida e criar apenas provas relevantes das regras e lacunas corrigidas. A expectativa deve ser derivada da fonte e decisão do autor, não copiada da implementação.
- Para efeitos relevantes: cenário sem aquisição, com aquisição, condição falsa/verdadeira, alvo permitido/indevido, nível antes/no/depois do limiar, limite/piso/teto, repetição, remoção e combinação. Selecionar casos pertinentes e justificar os não aplicáveis.
- Para ativos: conferir saldo antes/depois, insuficiência de recursos, duas execuções legítimas, evitar gasto por renderização/derivação, expiração, descanso, fim de combate e reabertura conforme regra. Quando há rolagem, conferir fórmula e aplicação separadamente da média.
- Testar os dois sistemas explicitamente, via rulesVersion, e casos de multiclasse, addon e herança envolvidos. Se corrigir regressão, demonstrar que o cenário reproduz o defeito anterior e passa depois, sem desfazer alterações alheias.
- Executar testes focados durante o trabalho. Na entrega de lógica, rodar npm run asserts; rodar npm run build e lint dos arquivos/área alterados. Se imports mudaram, node asserts/t-ordem-modulos.mjs. Ao tocar filtro/Imitação, rodar também os testes em src/systems/afty/asserts/ pertinentes.
- Para UI, sessão ou autoria, conferir navegador real em criador, Ficha Final e painel de Encontros, nos dois sistemas, em desktop e largura móvel. Usar estados isolados e registrar passos e resultados. Um teste de deriveAfty não prova que o controle aparece ou funciona.
- Reprodução de autoria deve usar o caminho realmente acessível ao jogador. Teste de configuração montada manualmente é prova do contrato de dados e precisa de evidência de interface/addon utilizável. Cobrir valores diferentes para afastar dependência de ID nativo.
- Se ferramenta, fonte ou decisão estiver indisponível, registrar exatamente o que não foi verificado e a dependência. Não declarar aprovado por ausência de erro ou por a suíte geral passar.

Uma parcela só é APROVADA quando a regra está confirmada, o comportamento foi observado, a integração usa mecanismo geral, a configuração equivalente está disponível ao jogador e há evidência adequada. Parcela manual intencional precisa de justificativa de regra e decisão, e não pode esconder consequências objetivas que ainda faltam no motor. Aprovação do lote exige cobertura explícita de todos os itens/parcelas aplicáveis e auditoria independente registrada. Até a auditoria, usar IMPLEMENTADO, AGUARDA AUDITORIA, mesmo que os testes passem.

## Entrega persistente e resposta final

Criar/atualizar docs/revisao-automacao/G00/revisao.md e docs/revisao-automacao/G00/registro.json com inventário, matrizes por parcela, fontes, decisões, percurso, provas, dependências e hashes. Testes novos seguem o padrão do repositório em asserts/t-revisao-g00.mjs quando houver necessidade comportamental real. Não criar teste apenas para confirmar que um arquivo existe.

Pendências novas ou decisões de regra nascem em docs/a-fazer.md, com referência ao lote. As descobertas deste lote não ficam somente no relatório. Ao resolver, remover a entrada correspondente e registrar implementação no guia pertinente ou docs/afty-status.md. Não reescrever pendência de outra pessoa; anexar nota. O registro guarda link/chave da pendência e não uma fila concorrente.

Na resposta final, apresentar: itens e parcelas examinados; diferenças antes/depois; mecanismos ampliados; como o jogador configura os recursos; testes e navegador com resultados reais; arquivos alterados; questões que ainda exigem decisão; parcelas não verificadas; estado por item; dependências e pontos para o auditor. Evitar a frase genérica tudo automatizado. Não terminar apenas com um diagnóstico quando há correção confirmada e autorizada a executar.
