# Verificação dos Lotes 01 a 11

Auditoria da árvore de trabalho em 2026-10-03, com fechamento após a virada da data local. Repositório: C:/Projetos/Grimorio/grimorio-tracker. Nenhuma correção foi feita.

**Resultado:** as correções principais estão presentes e a suíte está verde. Há um problema reproduzível de largura já declarado, um rótulo de tela esquecido, uma lacuna de proteção no assert do criador e pendências de fila e documentação. Há decisões de escopo a confirmar. **O Lote 11 foi feito:** existe sessão, código, assert e evidência de navegador posteriores à informação do pedido.

## Tabela por Lote

| Lote | Situação | Evidência |
|---|---|---|
| 01 | OK com ressalva | 45 asserts. Categoria pelo tab, filtro único de Anatomias e marcas por largura da linha funcionam na Ficha e no Encontro, nos dois sistemas. Os 15 textos foram comparados com o PDF. Dois achados não entraram na fila. |
| 02 | Problema | Interface corrigida e sem vazamento nas abas do criador em 390 px, inclusive desktop com 375 px úteis. Entretanto, os 26 asserts também passam com AftyCreatureBuilder.jsx do HEAD. |
| 03 | OK com ressalva | 37 + 22 + 113 + 70 asserts. Atenção 12 para 15, TR da Classe e quatro arredondamentos do Flugel corretos. Inventário de 311 efeitos e 48 pacotes: apenas Instinto Sanguinário desce ao estágio principal, sem orçamento. Buffs ainda chega a 632 px. |
| 04 | OK com ressalva | 97 + 123 asserts. Alcance 3 para 7,5 para 10,5 m; distância 39/69 m. Fontes funcionam por mouse, toque e teclado. A alteração compartilhada de toque saiu do escopo inicial. |
| 05 | OK com ressalva | 88 + 89 asserts. Cota base preservada, Corpo cobra extras na ativação, CD biológica 15/20/25/35 confirmada no livro, p. 336. A documentação do vermelho conhecido continua velha. |
| 06 | OK | 52 + 49 + 460 asserts. Canalizadora e Otimizada não acumulam, inclusive compra com Manejo Especial; Suporte usa mod_pre_ou_sab; progressão n - 1 preservada. |
| 07 | OK com ressalva | 120 asserts. Hoste válida conta uma nos dois limites; Horda e Mecha mantêm a regra decidida. A mesma contagem também mudou Controle Sintonizado e Concentrar Poder, além da pergunta sobre limites. |
| 08 | OK com ressalva | 25 asserts. Importação e uso respeitam o livro da ficha. Site público exercitado em 1440/390 px. Só três componentes autorizados têm diff; src/data não tem mudança. Falta registrar o risco de clones antigos. |
| 09 | OK com ressalva | 40 + 50 + 67 + 73 asserts. Técnica bloqueia inteira fora de campo, reserva de PE permanece e descanso escolhe uma Marionete. Ficha, Encontro e Descansar Todos testados. Não há ação explícita de interlúdio para reparar todas. |
| 10 | Problema | 40 + 57 + 76 + 28 asserts. Zenin e Versatilidade preservados, tipos gravados intactos. O vocabulário de DSL ainda exibe “Invocação de Técnica”. |
| 11 | OK com ressalva | 99 asserts novos, mais Quimera 75 e Compostos 73. PV 70 com fontes 39 + 13 - 2 + 20; perda do Fundamento chega à biblioteca preservando edições posteriores. Falta a linha do assert em LEIA.md. |

“Problema” no Lote 02 classifica a proteção de regressão exigida, não uma falha atual do editor. As ressalvas distinguem pendência anterior, extensão de decisão e documentação.

## Método e Verificações Gerais

Foram lidos os 11 prompts em C:/Projetos/Grimorio/prompts-a-fazer, AGENTS.md, CLAUDE.md, os guias de Motor e DSL, as sessões dos lotes e os trechos de código e asserts correspondentes. A sessão parcial e a conclusão do Lote 09 foram consideradas juntas.

Git fetch foi executado. main e origin/main estão iguais, com 0 commits atrás e 0 à frente. git status -sb indica main...origin/main. Não houve pull, troca de branch, stash, reset, restore, clean, commit ou push. O diff foi analisado com --ignore-cr-at-eol. O diff final dos arquivos rastreados é idêntico ao capturado no início, ver [fechamento.json](C:/Projetos/Grimorio/grimorio-tracker/.audit/verificacao-evidencias/fechamento.json).

Os scripts, relatórios e capturas desta auditoria estão somente em .audit/verificacao-*. O build solicitado gerou sua saída automática em dist, ignorada pelo Git. Nenhum código ou documento funcional foi editado. As cópias históricas ficaram fora do repositório, em C:/Users/gabri/AppData/Local/Temp/verificacao-lotes-blgt5A. As fichas de teste usaram contextos temporários de navegador, sem ler ou alterar a biblioteca real do autor. Os scripts de derivação usados na auditoria inicializam aplicarAddons antes de derivar.

| Verificação | Resultado | Evidência |
|---|---|---|
| Suíte, pelo lançador de npm run asserts | 150 arquivos, 8271 asserts, todos passaram | [suite.log](C:/Projetos/Grimorio/grimorio-tracker/.audit/verificacao-evidencias/suite.log) |
| t-filtro-habilidades, fora do lançador | Passou | [filtro.log](C:/Projetos/Grimorio/grimorio-tracker/.audit/verificacao-evidencias/filtro.log) |
| t-imitacao, fora do lançador | Passou em Afty e Player | [imitacao.log](C:/Projetos/Grimorio/grimorio-tracker/.audit/verificacao-evidencias/imitacao.log) |
| t-ordem-modulos | 34 asserts passaram | [ordem.log](C:/Projetos/Grimorio/grimorio-tracker/.audit/verificacao-evidencias/ordem.log) |
| ESLint, src/systems/afty, src/App.jsx e io-utils.js | Limpo, saída 0 | [eslint.log](C:/Projetos/Grimorio/grimorio-tracker/.audit/verificacao-evidencias/eslint.log) |
| Build de produção | Passou; permanece o aviso de pacote maior que 500 kB | [build.log](C:/Projetos/Grimorio/grimorio-tracker/.audit/verificacao-evidencias/build.log) |
| Preview de produção, três rotas, duas larguras | Sem tela branca e sem pageerror/ReferenceError; há 404 local de Analytics | [browser-complemento.json](C:/Projetos/Grimorio/grimorio-tracker/.audit/verificacao-evidencias/browser-complemento.json) e [browser-final.json](C:/Projetos/Grimorio/grimorio-tracker/.audit/verificacao-evidencias/browser-final.json) |

Os comandos internos do lançador, ESLint e Vite foram executados diretamente pelos scripts de auditoria; o resultado corresponde aos scripts do package.json. A suíte lança cada assert em processo próprio, um a um. O lint completo de áreas externas ao Afty não foi usado como critério.

A diferença para 149 arquivos e 8172 asserts é exatamente o Lote 11: um arquivo novo, t-quimera-fundamento-biblioteca.mjs, com 99 asserts. Não há vermelho conhecido atual.

O JavaScript de produção mede 5873,32 kB, ou 1290,96 kB gzip. Isso é um aviso de tamanho já registrado nas sessões, não um erro de execução.

## Problemas, em Ordem de Impacto

### 1. P2: Buffs ainda estoura a largura do telefone

**Onde:** [AbaBuffs.jsx:259](C:/Projetos/Grimorio/grimorio-tracker/src/systems/afty/ficha/abas/AbaBuffs.jsx:259), ramo multi em 272; [ficha.css:1219](C:/Projetos/Grimorio/grimorio-tracker/src/systems/afty/ficha/ficha.css:1219); estado em [afty-extras-nativos.js:324](C:/Projetos/Grimorio/grimorio-tracker/src/systems/afty/afty-extras-nativos.js:324).

**Reprodução:** abrir uma ficha, ir a Buffs e ligar Em Combate, em /afty ou /player com 390 px e barras de rolagem visíveis. Os controles de Refeições Consumidas ficam lado a lado além da tela.

**Atual contra esperado:** clientWidth 390 e scrollWidth 632 nos dois sistemas. Esperado: a linha quebrar dentro dos 390 px. O controle externo usa flex-shrink: 0 e não limita adequadamente a largura do grupo multi. Sem Em Combate o estado não aparece e a medição parece limpa, por isso esse passo importa.

**Proposta:** limitar a largura do controle multi e permitir que ele encolha e quebre. Preservar o alinhamento dos controles simples. Registrar na fila e verificar telefone emulado e desktop estreito. Foi declarado pelo Lote 03; não é uma regressão atribuída à correção do montante.

**Evidência:** [browser-final.json](C:/Projetos/Grimorio/grimorio-tracker/.audit/verificacao-evidencias/browser-final.json) e [captura em 390 px](C:/Projetos/Grimorio/grimorio-tracker/.audit/verificacao-evidencias/buffs-combate-afty-390.png).

### 2. P2: o assert novo do criador não protege a ligação entre editor e validador

**Onde:** [t-criador-namespaces.mjs:23](C:/Projetos/Grimorio/grimorio-tracker/asserts/t-criador-namespaces.mjs:23); ligação real em [AftyCreatureBuilder.jsx:4116](C:/Projetos/Grimorio/grimorio-tracker/src/systems/afty/AftyCreatureBuilder.jsx:4116).

**Reprodução:** na cópia temporária de src, asserts e addons, substituir somente AftyCreatureBuilder.jsx pela versão do HEAD e executar t-criador-namespaces.mjs.

**Atual contra esperado:** os 26 asserts continuam verdes com o editor antigo. O teste monta os conjuntos de nomes e chama validateExpression diretamente. Não verifica que TecnicaMotorEditor, MotorEfeitosEditor e ExprField passam esse conjunto ao validador.

**Proposta:** manter os casos de namespace e acrescentar proteção da ligação usada pelos editores, idealmente exercitando campos reais de expressão e quando. Uma regressão que retire o conjunto conhecido do editor deve ficar vermelha. Os roteiros de navegador atuais detectam a situação; o assert atual não.

**Evidência:** [historico-02-editor.log](C:/Projetos/Grimorio/grimorio-tracker/.audit/verificacao-evidencias/historico-02-editor.log). O editor atual foi testado ao vivo com nome inválido, condição inválida e namespace da Invocação, e funciona.

### 3. P3: sobrou “Invocação de Técnica” no seletor de variáveis

**Onde:** [afty-dsl-vocabulario.js:307](C:/Projetos/Grimorio/grimorio-tracker/src/systems/afty/afty-dsl-vocabulario.js:307); consumidores no criador em [AftyCreatureBuilder.jsx:17343](C:/Projetos/Grimorio/grimorio-tracker/src/systems/afty/AftyCreatureBuilder.jsx:17343) e 18737.

**Reprodução:** no editor de Motor de uma Invocação, abrir o seletor de variáveis e consultar tipo_tecnica em Tipo Mecânico. Também é localizável pela busca literal em src.

**Atual contra esperado:** a descrição de tela é “É uma Invocação de Técnica”. Esperado, conforme o Lote 10: “É um Shikigami de Técnica”. Os outros resultados da busca são comentários históricos, não rótulos.

**Proposta:** atualizar só a descrição visível, preservando tipo_tecnica e os valores gravados. Acrescentar cobertura das descrições de vocabulário usadas na tela. Os asserts de tipos atuais cobrem label e curto do catálogo, mas não esta descrição.

### 4. P3: cinco achados declarados ficaram fora da fila

**Onde:** [a-fazer.md](C:/Projetos/Grimorio/grimorio-tracker/docs/a-fazer.md); declarações em [afty-status.md:15785](C:/Projetos/Grimorio/grimorio-tracker/docs/afty-status.md:15785), 15816 e 15880.

**Reprodução:** comparar Achado e não mexido das sessões 01, 03 e 08 com a fila inteira.

**Atual contra esperado:** faltam o comentário antigo de Anatomias, o texto do Feto, a largura de Refeições Consumidas, o quando do Treinamento e o risco de clones antigos da 2.5.2 marcados como Afty. Esperado: cada achado ter entrada própria.

**Proposta:** registrar os cinco sem duplicar o TR manual, que já está em 1093. Esta auditoria não escreveu na fila, conforme a proibição expressa do pedido.

### 5. P3: documentação continua mandando preservar um vermelho que já foi resolvido

**Onde:** [CLAUDE.md:79](C:/Projetos/Grimorio/grimorio-tracker/CLAUDE.md:79), contagem 110 em 80; [asserts/LEIA.md:119](C:/Projetos/Grimorio/grimorio-tracker/asserts/LEIA.md:119).

**Reprodução:** ler os trechos após rodar a suíte.

**Atual contra esperado:** CLAUDE ainda descreve uma pergunta aberta e um assert vermelho, com instrução de não consertá-lo. LEIA ainda chama t-invocacoes-motor de VERMELHO CONHECIDO. Esperado: a decisão do Lote 05 e a situação verde atual, com data da conferência.

**Proposta:** atualizar as duas referências e a linha de base; acrescentar as quatro linhas de asserts faltantes na tabela de LEIA, listadas adiante.

### 6. P3: texto do Feto na Ficha não é a redação fiel do livro

**Onde:** [afty-origens.js:482](C:/Projetos/Grimorio/grimorio-tracker/src/systems/afty/afty-origens.js:482), Bônus em Atributo do Feto.

**Reprodução:** abrir a característica do Feto Amaldiçoado Híbrido na Ficha Final.

**Atual contra esperado:** “3 pontos para distribuir”, máximo 2 no mesmo atributo; o livro exige aumentar um atributo em 2 e outro em 1. O texto atual permite ler uma distribuição 1 + 1 + 1 que a redação da fonte não autoriza.

**Proposta:** separar resumo do criador e texto fiel da Ficha, como foi feito nas Anatomias. Qualquer alteração da distribuição mecânica deve ser decidida pelo autor. É um achado anterior declarado pelo Lote 01, sem conserto nesta auditoria.

### 7. P3: a confirmação do import conta fichas recusadas

**Onde:** [Dashboard.jsx:646](C:/Projetos/Grimorio/grimorio-tracker/src/components/Dashboard.jsx:646), mensagem baseada em result.creatures.length; wrapper em [App.jsx:154](C:/Projetos/Grimorio/grimorio-tracker/src/App.jsx:154).

**Reprodução:** importar pacote de cinco fichas, misturando livros, em uma rota privada.

**Atual contra esperado:** o modal mostra cinco importadas embora só duas tenham entrado. No público, o mesmo pacote admite três e a mensagem também usa cinco. O aviso de recusa do App identifica corretamente o que ficou fora, e o armazenamento está correto.

**Proposta:** contar o resultado efetivamente aceito ou passar esse resultado ao modal. A fila já registra a pergunta em 312; o componente é protegido e requer a decisão prevista na regra. Não é falha do filtro novo.

### 8. Observação de ambiente: o console do preview não fica literalmente vazio

**Onde:** [App.jsx:620](C:/Projetos/Grimorio/grimorio-tracker/src/App.jsx:620), Analytics.

**Reprodução:** carregar /, /afty ou /player em npm run preview local.

**Atual contra esperado:** há 404 em /_vercel/insights/script.js. Não houve erro de JavaScript, ciclo de import, ReferenceError ou tela branca. O endpoint de métricas pertence ao ambiente Vercel e não é servido pelo preview local. Analytics não foi introduzido por estes lotes.

**Proposta:** documentar essa diferença de preview ou decidir separadamente sobre habilitação de métricas nesse ambiente. Não atribuir o 404 ao Lote 03 nem declarar “console limpo” sem a ressalva. O site publicado não foi acessado nesta auditoria.

## Pedido, Código, Escopo e Efeitos Colaterais

### Lote 01

As três entradas foram resolvidas e removidas. conteudoDaFicha usa getCategoriaAptidao(...).tab, e Anatomias vêm de anatomiasEscolhidas, também chamado por coletarEfeitosOrigem. Origem sem pool não recebe uma linha ou número indevido. A marca sai da linha fechada pela largura do item, não pela rota ou largura global; reaparece na linha aberta. Ficha dentro de Encontro passa nos dois sistemas.

A sessão registra autorização para tocar afty-efeitos.js e afty-origens.js fora da lista original. O novo catálogo textoLivro também ultrapassa os três arquivos iniciais da Ficha e é a solução registrada pelo autor. descricao continua como resumo do criador.

O PDF foi encontrado em [Livro de Regras](<C:/Projetos/Grimorio/grimorio-tracker/public/docs/F&M 2.5.2 - Livro de Regras.pdf>). As páginas 35 e 36 foram extraídas, renderizadas e inspecionadas. As 15 entradas preservam palavras, números e condições. Há diferenças tipográficas pequenas: aspas retas em Anatomia Incompreensível e ordinal º no código contra ° em Olhos Sombrios. Não são diferenças de regra; não afirmo identidade literal de caracteres. Capturas: [p. 35](C:/Projetos/Grimorio/grimorio-tracker/.audit/verificacao-evidencias/livro-035.png), [p. 36](C:/Projetos/Grimorio/grimorio-tracker/.audit/verificacao-evidencias/livro-036.png).

### Lote 02

As quatro entradas saíram. useDslConhecidas alimenta os editores, incluindo quando. Habilidade Única usa o contexto da criatura com o contexto do item; ExprField de Ações e Características usa o vocabulário da Invocação. Fórmula inválida fica vermelha, fórmula válida de Ferramenta Especial volta a 8 e a expressão de Invocação mostra +33 nos dois sistemas.

Card mantém headerEmpilhadoNoTelefone desligado por padrão, e só PerfilAmaldicoadoCard ativa a opção. O h1 neutraliza margem e tipografia do index.css. Em 390 px, cabeçalho 150 px, h1 18 px/28 px e margens 0; título fica acima do seletor. No desktop estreito, largura útil e scrollWidth 375 px, devido à barra vertical. Abas principais e Outros foram percorridas. A lacuna histórica do assert está descrita no problema 2.

### Lote 03

separarEfeitosDeBancada divide uma lista; cada linha vai para uma das duas listas. O derive aplica os efeitos que ficaram no montante e insere os que desceram uma vez em efeitosTodos. A proteção de canais lidos cedo conserva pontosAptidao, vagasHabilidade, vagasTalento, vagasMelhoria, vagasLendaria, nivelAptidao, limiteAptidao, empolgacaoMaxima e limiteAtributo. O conjunto de COMBATE_VARS é construído preguiçosamente em ehVarDaBancada, sem avaliar o import cíclico no topo.

O inventário conferiu os mapas nativos de Gerais, Origem, Clã, Anatomia e escolhas, os Treinamentos e os 48 JSON de addons, incluindo acrescenta e substitui nas famílias de montante. Efeitos de Invocação, bancada e mesa não foram classificados como montante. Todos os pacotes passaram pela normalização e aplicação dos Addons. O arquivo completo lista cada pacote: [montante-inventario.json](C:/Projetos/Grimorio/grimorio-tracker/.audit/verificacao-evidencias/montante-inventario.json).

**Lista completa dos efeitos catalogados que agora descem:**

| Fonte | Canal | Expressão | Condição | Orçamento |
|---|---|---|---|---|
| Instinto Sanguinário, ANATOMIA_EFEITOS, entrada 1 | atencao | maestria | em_combate | Não |

Nenhum efeito catalogado de vaga ou orçamento desceu. O caminho também alcança fórmulas livres de Votos, Modificações, Catarse e Espinho; não existe lista finita de tudo que o usuário pode escrever. O assert inclui um Voto sintético dependente de combate. Não foi examinado o conteúdo real da biblioteca do autor.

faixasTrDaClasse chega a buildCriaturaDslContext apenas pelo caminho já divergente do jogador. pacoteInicial e trDaClasse estão antes de montarCtx e continuam alimentando resolveTestes. semCredito permanece. O TR manual ainda dá o “já seja” no jogador, como já declarado e registrado na fila, sem regressão nova atribuída ao lote.

Flugel é 1.1.1 e tem as quatro piso(bt / 2). O pacote salvo em uma ficha só recebe a nova versão quando atualizado na biblioteca. Treinamento paraCanal ainda descarta quando nos retornos de canal direto, [afty-treinamentos.js:705](C:/Projetos/Grimorio/grimorio-tracker/src/systems/afty/afty-treinamentos.js:705). Não foi encontrado pacote atual que dependa de quando nesse caminho, mas a limitação merece fila.

### Lote 04

Os alvos são cat:corpo|basico e cat:distancia|cat:arremesso; Circular exige estar ligado e Empolgação pelo menos 5. Maldição Era de Ouro 2.1.1 tem 10 características no Motor e 8 de Mesa. Articulações não muda Espaço/Alcance do Tamanho, nem os Feitiços recebem esses bônus. alcanceDe devolve parcelas nomeadas, inclusive fontes suplantadas e o multiplicador de Postura do Céu ou Invencível sob o Sol.

AbaAcoes.jsx foi anunciado antes ao autor, segundo a sessão. ui/fontes.jsx também saiu da lista inicial e mudou o tratamento compartilhado de foco de NumeroComFontes. Não altera literalmente toda classe de tooltip existente: o ramo alterado é NumeroInterativo. A confirmação de escopo fica no fim.

O trecho de automacao-dsl.md em 228 ainda diz que Ataque Básico não recebe “os três”, mas refere-se aos bônus antigos Extensão Corporal, Sincronia Perfeita e Longo. O parágrafo novo em 238 explica os três bônus deste lote. Não há contradição mecânica demonstrada; uma redação mais explícita dos nomes antigos evitaria leitura ambígua.

### Lote 05

Cota base e cobrança do Corpo foram confirmações do comportamento existente. O teste antigo que esperava custo da Livre dentro da cota foi ajustado para a decisão, e os casos de excedente continuam cobrando PE. reparoDaInvocacao devolve partesCd em todo reparo com CD; os números da fonte fecham com o total.

O documento afty-criacao-equipamentos-fonte.md e o código de criação tratam custos e propriedades de equipamentos, não contêm a tabela de CDs por Ofício pedida. A verificação foi feita com a fonte efetiva: Livro de Regras 2.5.2, p. 336, tabela Criação de Itens. Farmacêutico: 15, 20, 25 e 35. Alfaiate: 15, 20, 30 e 40. Captura [tabela p. 336](C:/Projetos/Grimorio/grimorio-tracker/.audit/verificacao-evidencias/tabela-336.png).

t-invocacao-tipos-especiais não estava na lista original deste lote; a sessão declara sua alteração para atualizar a regra antiga do biológico. É cobertura pertinente da decisão, sem mudança adicional de regra. O hover foi observado no biológico e no boneco; os demais reparos com CD são cobertos pela função e pelos asserts.

A contagem real de U+2014 em afty-invocacoes.js é **17 no HEAD e 17 agora**. A sessão diz um comentário antigo e “outros 16 pontos”, totalizando 17. O resumo do pedido fala em 16; nenhum é novo.

### Lote 06

naoAcumula está nas duas propriedades e usa o mesmo caminho já aplicado à Balanceada. Duas fontes dão +2, não +4, e só uma parcela permanece, inclusive propriedade recebida pelo Manejo Especial. Suporte Absoluto usa mod_pre_ou_sab em curaFixa. Conjuração Aprimorada preserva n - 1: a decisão não gerou feitiço extra no nível 1. A pergunta sobre duas CDs permanece na fila em 72.

### Lote 07

Agrupamento da Hoste exige ambas em campo, marcadas e com vínculo recíproco. Um par inválido ou parcialmente fora não é fundido indevidamente na contagem. A ordem da lista não muda o resultado. Os dois limites mostram uma. O mesmo total chega ao contexto do Motor: Controle Sintonizado recebe +1 e Concentrar Poder reconhece o par como uma. Essa extensão é protegida pelos asserts, mas a pergunta original tratava do limite, por isso exige confirmação de intenção.

Horda mantém máximo 82 no caso de teste e cai como antes; Mecha preserva soma de componentes, dano e quebra. Os consumidores da contagem e os caminhos de dano/descanso foram conferidos com os testes dos lotes 07 e 09 juntos.

### Lote 08

storage usa o wrapper para todas as rotas. abrirFicha escolhe a tela pelo sistema gravado; uma ficha 2.5.2 antiga no privado abre no tracker 2.5.2, não no deriveAfty. criaturasDoLivro separa os motores para Encontro, permitindo criatura e jogador Afty juntos e excluindo 2.5.2. Modelos recebe fichasDa252. showSystemView={!aftyMode} remove Criaturas Base dos dois ambientes privados. parseImportText mantém os nomes válidos e dá Sem nome aos vazios, sem aceitar entradas que não sejam objetos.

No site público, em 1440 e 390 px, foram testados: abrir ficha salva, importar cinco fichas misturadas, aviso dos dois livros recusados, nome de reserva, abrir, selecionar e aplicar Modelo na ficha correta, listar e abrir uma das 165 Criaturas Base, criar Encontro, adicionar ficha, rolar e iniciar combate. Não houve pageerror ou erro de console no servidor de desenvolvimento. A aplicação foi confirmada no armazenamento da ficha pública em ambas as larguras.

O diff protegido lista somente PdfFab.jsx, PdfViewerModal.jsx e io-utils.js. Todos estão nas exceções de AGENTS.md. src/data não tem diff. O PDF é mudança anterior de 2026-10-02. CLAUDE aponta para a lista de exceções e não contradiz a fronteira. onSalvarEspinho continua em App.jsx:431. A autorização de io-utils está registrada na regra e na sessão.

### Lote 09

semTecnicaBloqueada filtra Funcionamento, Feitiços e Passivas, inclusive efeitos de Invocação e resistências. Fora de campo o aviso é âmbar com AlertTriangle. PE Máximo continua 40 na criatura e 48 no jogador na amostra; as parcelas da reserva permanecem com a Técnica perdida ou bloqueada.

marionetesParaReparo separa o Mecha antes e exclui destruídas. Descansar recebe marioneteId: enche e zera quedas só da escolhida; as demais preservam PV, quedas, retorno e estado. O descanso do dono e das outras Invocações continua restaurando o que já restaurava. Cancelar e Escape não chamam descanso. Sem Marionete danificada, o botão descansa sem escolha. Descansar Todos pede uma por dono.

BotaoDeDescanso.jsx e as integrações na Ficha e no Encontro ampliam os arquivos inicialmente listados, para concretizar a escolha decidida. A conclusão da sessão registra os três locais. Não foi localizado um comando de “interlúdio: reparar todas”, nem um caminho equivalente de reparo coletivo. O descanso longo implementado está correto para a decisão B; o interlúdio fica como pergunta.

### Lote 10

Clã Zenin continua 3 pontos, máximo 2 no mesmo atributo, sem obrigar distribuição fixa. Versatilidade Extrema continua somando limite, chegando a 7 no caso combinado. label e curto são Shikigami e Shikigami de Técnica / Técnica. Os values shikigami e tecnica não mudaram. A omissão no vocabulário de DSL é o único rótulo de tela antigo encontrado pela busca exigida.

### Lote 11

Há sessão em afty-status.md:15909, arquivos .audit/lote11-* e mudanças registradas. As três entradas foram removidas da fila. Não executei correções do lote, apenas verifiquei o que já existe.

resolveQuimeraMecanicas calcula as componentes sem os bônus aditivos de PV do dono; mantém tipo, Características e segundo passe de fontes. Depois da fusão, o Motor aplica o bônus uma vez. Os cartões individuais e a fórmula antiga do addon continuam como antes. Visionário permanece sob conferência manual, conforme a decisão registrada.

REGISTRAR_FUNDAMENTO_PERDIDO continua puro. sincronizarFundamentosNaBiblioteca relê a biblioteca atual pelo rulesVersion da ficha, une perdas por invocacaoId e preserva edições posteriores. Não recria ficha removida, não escolhe ID duplicado por suposição e não atravessa bibliotecas. Abrir Encontro antigo sincroniza perdas; repetir não regrava. Falha de escrita mostra AlertTriangle e Tentar Novamente. A amostra real testou quota bloqueada e recuperação no telefone. O App recebe a biblioteca atual inteira, preservando inclusões, exclusões, campos removidos e ordem.

O criador recebeu fontes de PV fora da condição inicial “só se o problema 2 pedir marcação”. É uma extensão de UI útil para cumprir a regra geral de fontes e está explicitamente registrada na sessão; não altera a escolha manual de Visionário.

## Prova Histórica dos Asserts 01 a 04

Foi trocado **um arquivo de cada vez**, apenas na cópia temporária externa. Os resultados não podem ser somados como se fossem uma reversão conjunta, porque cada rodada conserva as outras alterações atuais. O HEAD também antecede mudanças anteriores aos lotes.

| Lote e assert | Arquivo trocado pelo HEAD | Resultado |
|---|---|---|
| 01, Ficha 45 | ficha-conteudo.js | 23 falhas de comportamento |
| 01, Ficha 45 | ItemDeFicha.jsx | 2 falhas de estrutura da linha |
| 01, Ficha 45 | ficha.css | 1 falha de proteção de estilo |
| 02, Criador 26 | AftyCreatureBuilder.jsx | 26 verdes; não protege o defeito antigo da interface |
| 03, Montante 37 | afty-derive.js | 10 falhas |
| 03, TR 22 | afty-derive.js | 8 falhas |
| 03, Montante 37 | afty-efeitos.js | Import falha: HEAD não exporta separarEfeitosDeBancada; prova de contrato, não de número |
| 03, Flugel 70 | addons/flugel.json | 6 falhas; inclui números fracionários antigos e versão |
| 04, Alcance 97 | afty-combate-conjurador.js | 32 falhas |
| 04, Alcance 97 | afty-efeitos-conteudo.js | 12 falhas |
| 04, Alcance 97 | addons/maldicao-era-de-ouro.json | 19 falhas |
| 04, Alcance 97 | afty-pericias.js | TypeError pela ausência de partes; prova de contrato, sem concluir todos os casos numéricos |
| 04, Alcance 97 | ui/fontes.jsx | 97 verdes; assert de regra não protege o gesto de toque |

Logs e resumo em [historico.json](C:/Projetos/Grimorio/grimorio-tracker/.audit/verificacao-evidencias/historico.json). Os testes ao vivo cobrem a interface que os asserts de regra não importam. Isso não substitui a proteção automatizada ausente do Lote 02.

## Navegador e Trabalho Paralelo

Chrome foi aberto sem ocultar barras de rolagem, em contextos descartáveis. Desenvolvimento em 5273, preview em 5274. Repeti cópias dos roteiros dos lotes, mantive os originais intactos e acrescentei amostras independentes. Os dois sistemas foram exercitados em 1440 e 390 px, com Feto, Restringido 8, Hoste, Mecha, Marionetes, Fundamento e Quimera.

No criador, nenhuma aba percorrida, inclusive Outros, excedeu a área útil de 390 px. Isso também foi medido em desktop estreito, com scrollWidth 375 px e barra vertical visível. Na Ficha, as abas ficaram na largura útil, **exceto Buffs com Em Combate**, que mede 632 px. Não uso a amostra sem combate para declarar que toda a Ficha está limpa.

Fontes foram observadas com mouse e toque na Ficha, no Encontro e no criador. Foco de teclado foi exercitado nas três telas. O painel fecha ao rolar, comportamento já existente; os testes de foco usaram o gatilho visível e centralizado. No criador, PV 70 exibe quatro parcelas, inclusive Invocações Resistentes +20. Em Afty e Player, Defesa do Encontro abre suas respectivas parcelas por teclado.

As mudanças concorrentes permanecem presentes:

- afty-derive.js contém separação do montante, TR da Classe, agrupamento da Hoste e filtro da Técnica.
- afty-invocacoes.js contém CDs de reparo, Horda/Mecha, estado da Técnica e Quimera.
- AbaInvocacoes.jsx contém hover de CD, contadores e aviso do Fundamento.
- afty-efeitos-conteudo.js conserva Circular, TR semCredito, Suporte e Versatilidade.
- afty-efeitos.js conserva filtro único de Anatomias, separação da bancada e TR da Classe.
- afty-origens.js conserva Anatomias e a confirmação do Zenin.
- App.jsx conserva a fronteira do Lote 08, onSalvarEspinho anterior e a sincronização do Lote 11.

Não foi encontrado sinal de uma correção desses arquivos compartilhados ter sido apagada por outra. A suíte e as amostras conjuntas dão suporte a essa conclusão, sem prometer cobertura de qualquer combinação possível de ficha.

Evidências principais:
- [Repetição dos roteiros](C:/Projetos/Grimorio/grimorio-tracker/.audit/verificacao-evidencias/browser-repeticao.json).
- [Complementos de Ficha e Encontro](C:/Projetos/Grimorio/grimorio-tracker/.audit/verificacao-evidencias/browser-complemento.json).
- [Desktop estreito](C:/Projetos/Grimorio/grimorio-tracker/.audit/verificacao-lote02-desktop390-depois.json).
- [Fontes por teclado](C:/Projetos/Grimorio/grimorio-tracker/.audit/verificacao-evidencias/fontes-teclado.json).
- [Navegação pública](C:/Projetos/Grimorio/grimorio-tracker/.audit/verificacao-evidencias/publico-navegacao.json).
- [Modelo aplicado no site público](C:/Projetos/Grimorio/grimorio-tracker/.audit/verificacao-evidencias/publico-modelo-aplicado.json).
- [Encontro público ativo](C:/Projetos/Grimorio/grimorio-tracker/.audit/verificacao-evidencias/publico-encontro.json).
- [Lote 11 corrigido na repetição](C:/Projetos/Grimorio/grimorio-tracker/.audit/verificacao-evidencias/lote11-browser.log).

O primeiro lançamento da cópia do roteiro 11 falhou por uma adaptação do próprio script de auditoria, antes de testar o app. A cópia foi corrigida e as quatro combinações passaram. O code 1 inicial em browser-repeticao.json deve ser lido com o log final acima; não é erro da aplicação.

## Fila e Documentação

| Lote | Estado das entradas originais |
|---|---|
| 01 | As três saíram. Faltam os dois achados declarados. |
| 02 | As quatro saíram. |
| 03 | As três saíram; TR manual entrou em 1093. Faltam Buffs e quando do Treinamento. |
| 04 | Duas saíram; Articulações saiu da entrada composta. Os seis itens restantes continuam em 59. |
| 05 | As três saíram. |
| 06 | As três saíram. A pergunta das duas CDs permanece em 72. |
| 07 | As três saíram. |
| 08 | As três saíram. Modal de import entrou em 312. Falta o risco dos clones antigos. |
| 09 | As três saíram após a conclusão. Interlúdio precisa de decisão explícita. |
| 10 | As três saíram. Falta registrar o rótulo que sobrou. |
| 11 | As três saíram, coerentes com a sessão nova. |

Não há títulos de entrada duplicados na fila atual. Essa conferência não prova que duas entradas com títulos diferentes nunca tratem de assuntos parecidos.

**Faltam entrar na fila:**

1. Comentário de anatomias em afty-schema.js:357 ainda limita o pool ao Feto Híbrido, embora Kitsune e Aberração Humanizada também usem.
2. Texto de Bônus em Atributo do Feto, afty-origens.js:482.
3. Largura de Refeições Consumidas em Buffs.
4. quando descartado por paraCanal nos efeitos de Treinamento.
5. Possíveis clones antigos da 2.5.2 marcados como Afty pelo lápis das Criaturas Base. O caminho novo foi fechado; fichas já salvas não foram migradas.
6. Lacuna do assert do criador, achada nesta auditoria.
7. Rótulo antigo no vocabulário da Invocação, achado nesta auditoria.

O interlúdio e a contagem da Hoste no Motor devem ser registrados conforme a resposta às perguntas finais, sem supor uma regra.

**Documentação a atualizar:**

- CLAUDE.md:79-85 e asserts/LEIA.md:119, vermelho conhecido e linha de base antigos.
- Faltam linhas para t-criador-namespaces, t-fundamento-bloqueio, t-descanso-marionetes e t-quimera-fundamento-biblioteca na tabela de asserts/LEIA.md. As linhas de t-ficha-linhas, t-montante-bancada, t-tr-caso-ja-seja-classe e t-alcance-corpo-a-corpo existem.
- A fonte da CD por Ofício deve apontar ao livro, p. 336; o documento de criação de equipamentos não comprova essa tabela.
- O comentário de anatomias deve refletir o filtro compartilhado.
- Os guias citados receberam seções pertinentes aos lotes: ficha-final, formula-entropica, motor-referencia-estrutural, automacao-dsl, addons, equipamentos, player e invocacoes. As regras descritas nos trechos atualizados correspondem ao código conferido.
- CLAUDE e AGENTS estão alinhados sobre src/components; a inconsistência atual de CLAUDE é a linha de base, não a fronteira.
- A frase de alcance em automacao-dsl pode explicitar os três bônus antigos para evitar confusão, sem mudar a regra.

## U+2014

Existe **uma linha adicionada** com U+2014 no diff normalizado:

| Arquivo | Linha atual | Conteúdo, com o caractere representado por nome |
|---|---|---|
| src/systems/afty/afty-derive.js | 4129 | altoNivel: altoNivelFinal, comentário “{ ativo, melhorias, lendarias, escolhas, apiceId } [U+2014] orçamentos próprios” |

O comentário já aparece no HEAD, linha 4008, junto de altoNivel. A mudança para altoNivelFinal e o agregador final pertence à sessão de 2026-10-02, antes dos lotes. Portanto a linha é adicionada no diff, mas o caractere não foi criado pelos lotes. A contagem de derive permanece 18.

Há quatro arquivos não rastreados com um caractere cada: t-estilo-massivo.mjs:2, t-teste-atributo.mjs:2, t-vagas-agregado-final.mjs:2 e afty-feiticos-permutativos.md:37. Os três cabeçalhos e as sessões correspondentes são de 2026-10-02; o documento pertence à sessão de Feitiços Permutativos dessa data. Sem versão HEAD desses arquivos não há comparação histórica independente do conteúdo inteiro. Os novos asserts e arquivos dos lotes 01 a 11 não contêm o caractere.

afty-invocacoes.js tem 17 antes e depois. Anatomias caiu de 2 para 0 e o guia estrutural de 38 para 37. Nenhum arquivo rastreado alterado aumentou sua contagem. A tabela completa segue; os dados brutos estão em [travessoes.json](C:/Projetos/Grimorio/grimorio-tracker/.audit/verificacao-evidencias/travessoes.json).

| Arquivo alterado | HEAD | Atual |
|---|---:|---:|
| AGENTS.md | 0 | 0 |
| CLAUDE.md | 0 | 0 |
| addons/flugel.json | 0 | 0 |
| addons/maldicao-era-de-ouro.json | 0 | 0 |
| asserts/LEIA.md | 0 | 0 |
| asserts/t-estados-organiza.mjs | 0 | 0 |
| asserts/t-estrela-zenin.mjs | 1 | 1 |
| asserts/t-flugel.mjs | 0 | 0 |
| asserts/t-invocacao-estados.mjs | 0 | 0 |
| asserts/t-invocacao-tipos-especiais.mjs | 0 | 0 |
| asserts/t-invocacao-tipos.mjs | 0 | 0 |
| asserts/t-invocacoes-mesa.mjs | 0 | 0 |
| asserts/t-invocacoes-motor.mjs | 0 | 0 |
| asserts/t-maldicao-era-de-ouro.mjs | 0 | 0 |
| asserts/t-maldicao.mjs | 0 | 0 |
| asserts/t-melhorias-jogador.mjs | 0 | 0 |
| asserts/t-nome-ficha.mjs | 1 | 1 |
| asserts/t-ordem-modulos.mjs | 0 | 0 |
| asserts/t-primitivas.mjs | 0 | 0 |
| asserts/t-sistema.mjs | 1 | 1 |
| asserts/t-suporte-revisao.mjs | 0 | 0 |
| asserts/t-yna.mjs | 0 | 0 |
| docs/a-fazer.md | 7 | 7 |
| docs/afty-addons.md | 0 | 0 |
| docs/afty-equipamentos.md | 5 | 5 |
| docs/afty-ficha-final.md | 3 | 3 |
| docs/afty-formula-entropica.md | 0 | 0 |
| docs/afty-invocacoes.md | 21 | 21 |
| docs/afty-motor-referencia-estrutural.md | 38 | 37 |
| docs/afty-player.md | 1 | 1 |
| docs/afty-status.md | 63 | 63 |
| docs/automacao-dsl.md | 40 | 40 |
| src/App.jsx | 4 | 4 |
| src/components/PdfFab.jsx | 1 | 1 |
| src/components/PdfViewerModal.jsx | 2 | 2 |
| src/components/io-utils.js | 5 | 5 |
| src/systems/afty/AftyCreatureBuilder.jsx | 24 | 24 |
| src/systems/afty/afty-addons.js | 2 | 2 |
| src/systems/afty/afty-alto-nivel.js | 0 | 0 |
| src/systems/afty/afty-anatomias.js | 2 | 0 |
| src/systems/afty/afty-aptidoes.js | 4 | 4 |
| src/systems/afty/afty-atributos.js | 2 | 2 |
| src/systems/afty/afty-combate-conjurador.js | 0 | 0 |
| src/systems/afty/afty-derive.js | 18 | 18 |
| src/systems/afty/afty-efeitos-conteudo.js | 15 | 15 |
| src/systems/afty/afty-efeitos.js | 18 | 18 |
| src/systems/afty/afty-equipamentos.js | 7 | 7 |
| src/systems/afty/afty-feiticos.js | 24 | 24 |
| src/systems/afty/afty-habilidades.js | 0 | 0 |
| src/systems/afty/afty-invocacoes-tipos.js | 0 | 0 |
| src/systems/afty/afty-invocacoes.js | 17 | 17 |
| src/systems/afty/afty-origens.js | 8 | 8 |
| src/systems/afty/afty-pericias-catalogo.js | 2 | 2 |
| src/systems/afty/afty-pericias.js | 9 | 9 |
| src/systems/afty/afty-schema.js | 16 | 16 |
| src/systems/afty/afty-sistema.js | 1 | 1 |
| src/systems/afty/afty-talentos.js | 0 | 0 |
| src/systems/afty/encontros/AftyEncontro.jsx | 2 | 2 |
| src/systems/afty/encontros/PainelDeCombatente.jsx | 4 | 4 |
| src/systems/afty/encontros/usar-encontro-afty.js | 2 | 2 |
| src/systems/afty/ficha/AftyFicha.jsx | 1 | 1 |
| src/systems/afty/ficha/ItemDeFicha.jsx | 1 | 1 |
| src/systems/afty/ficha/PainelDeRolagens.jsx | 1 | 1 |
| src/systems/afty/ficha/abas/AbaAcoes.jsx | 1 | 1 |
| src/systems/afty/ficha/abas/AbaBuffs.jsx | 2 | 2 |
| src/systems/afty/ficha/abas/AbaHabilidades.jsx | 2 | 2 |
| src/systems/afty/ficha/abas/AbaInvocacoes.jsx | 1 | 1 |
| src/systems/afty/ficha/ficha-buffs.js | 2 | 2 |
| src/systems/afty/ficha/ficha-conteudo.js | 1 | 1 |
| src/systems/afty/ficha/ficha-estados.js | 1 | 1 |
| src/systems/afty/ficha/ficha-rolagem.js | 1 | 1 |
| src/systems/afty/ficha/ficha-sessao.js | 3 | 3 |
| src/systems/afty/ficha/ficha-tema.js | 1 | 1 |
| src/systems/afty/ficha/ficha.css | 13 | 13 |
| src/systems/afty/ui/fontes.jsx | 5 | 5 |
| src/systems/afty/ui/primitivos.jsx | 2 | 2 |

## O Que Não Foi Verificado

- Não li fichas reais nem a biblioteca do autor. A existência dos clones antigos marcados como Afty depende de conferir esses dados.
- Não acessei o site publicado na Vercel nem usei telefone físico. Foi usado Chrome local, com toque emulado e desktop com barras visíveis.
- Não conferi cada tooltip e cada combinação possível de classes, addons e campos livres. Cobri os caminhos afetados e as amostras descritas, incluindo mouse, toque e teclado.
- Não foi possível provar regressão numérica por troca isolada de afty-efeitos.js e afty-pericias.js: houve falha de contrato antes de completar os asserts. Os demais testes históricos demonstram falhas de comportamento.
- O assert do Lote 02 não falhou com o editor antigo. Isso foi verificado e relatado, não presumido como proteção existente.
- Não tenho a transcrição integral das respostas dos chats anteriores. As autorizações e decisões são confirmadas pelo registro das sessões e das regras, com as extensões abaixo separadas para confirmação.
- Não alterei a fila nem qualquer código ou documentação funcional. As propostas aguardam a escolha do autor.

## Decisões a Confirmar com o Autor

As opções recomendadas vêm primeiro. Estas perguntas registram o limite das decisões anteriores; não autorizam correção automática nesta auditoria.

### 1. Lote 03: a separação deve continuar valendo para todo o montante?

A sessão registra aprovação do montante inteiro. O código também faz descer efeitos comuns que leem qualquer nome ausente do contexto reduzido, não apenas em_combate. O inventário atual não mostrou orçamento deslocado.

- **A, recomendada:** confirmar o montante inteiro e a detecção de nomes ausentes, preservando os canais lidos cedo e protegendo a separação com os testes.
- **B:** limitar às fontes dependentes da bancada explicitamente conhecidas; decidir como tratar nomes ausentes sem descartá-los silenciosamente.
- **C:** limitar ao Instinto Sanguinário, reabrindo a regra das demais fontes.

### 2. Lote 07: “Hoste conta uma” também vale para os benefícios do Motor?

A pergunta original era sobre os dois limites. Hoje Controle Sintonizado passou de +2 para +1 por par, e Concentrar Poder trata o par como uma Invocação.

- **A, recomendada:** confirmar uma unidade também para o Motor, mantendo uma contagem coerente para o par.
- **B:** contar uma só nos limites e duas nos benefícios do Motor.
- **C:** decidir individualmente Controle Sintonizado e Concentrar Poder.

### 3. Lote 08: confirmar a retirada de Criaturas Base dos ambientes privados?

Fechar a importação foi decidido. Retirar as Criaturas Base também fecha o caminho de uso e clonagem do catálogo 2.5.2 no Afty; a sessão registra uma segunda rodada.

- **A, recomendada:** confirmar a retirada de /Afty e /Player e conferir separadamente se há clones antigos a classificar.
- **B:** oferecer o catálogo privado somente para consulta na tela 2.5.2, sem clonagem ou derivação Afty.
- **C:** manter uma porta de cópia, exigindo conversão explícita entre livros.

### 4. Lote 08: Modelos deve continuar oferecendo apenas fichas 2.5.2?

Hoje a biblioteca compartilhada filtra os destinatários pelo motor da ficha, inclusive quando aberta de uma rota privada.

- **A, recomendada:** confirmar o filtro para fichas 2.5.2, preservando a fronteira atual.
- **B:** desenhar Modelos próprios de Afty e Player em tarefa separada.
- **C:** permitir aplicação entre livros mediante regra explícita de conversão.

### 5. Lote 04: confirmar o comportamento compartilhado de toque nas fontes?

A alteração de ui/fontes.jsx faz o primeiro toque abrir pelo clique, evita abrir e fechar no mesmo gesto e mantém foco visível de teclado. Foram testados criador, Ficha e Encontro.

- **A, recomendada:** confirmar a alteração compartilhada de NumeroComFontes.
- **B:** restringir o ajuste aos números de alcance, mantendo os outros gatilhos como antes.

### 6. Lote 09: como oferecer “todas em um interlúdio”?

O descanso longo escolhe uma Marionete, como decidido. Não há comando explícito de reparo coletivo por interlúdio.

- **A, recomendada:** registrar uma ação específica de interlúdio que repara todas as Marionetes elegíveis, separada do descanso longo, preservando destruídas.
- **B:** manter o interlúdio como conferência manual fora do app e documentar isso.
- **C:** deixar a ação pendente até decidir duração e custo do interlúdio.

### 7. Lote 08: existem clones antigos de Criaturas Base feitos no Afty?

A porta atual está fechada, mas 86 das 165 bases não tinham rulesVersion no catálogo e podiam ser clonadas com a marca da rota. Não é seguro reclassificar qualquer ficha só pelo formato.

- **A, recomendada:** conferir uma exportação da biblioteca para identificar os clones e decidir a classificação antes de propor migração.
- **B:** confirmar que não houve esses clones e encerrar o risco como histórico.


