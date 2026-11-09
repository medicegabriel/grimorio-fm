# CX3: verificação e integração em andamento

Situação em 2026-11-06: conteúdo, escolhas e operações já foram implementados e
verificados nos percursos registrados abaixo. O lote continua aberto. As seções
iniciais preservam o diagnóstico de 01/11, anterior à liberação das reservas.

## Base e concorrência

- Repositório: `C:/Projetos/Grimorio/grimorio-tracker`.
- HEAD: `deab72cc26a93ab39350b6a781fcb0ca052cc0fd`, branch main.
- A main remota consultada pelo conector GitHub tem o mesmo SHA. A comparação
  local HEAD/origin/main resultou em 0/0. A consulta direta por git não conectou.
- Nenhum pull, merge, reset, stash, commit ou push foi executado.
- Fonte externa consultada diretamente, SHA-256 confirmado:
  `1d0713d52c818a9ab9f47b883d9887a0d227d174d30ffcce358874669a7a733a`.
- Foram preservadas as alterações locais de CX1, CX2, CL1, CL2, CL3 e Técnicas
  Marciais. Não houve edição de código ou documentação do repositório por CX3.
- A reserva do CX2 foi renovada na fila durante esta verificação, com o título
  `CX2: retomado em 2026-11-01`. A fila e arquivos centrais estão efetivamente
  recebendo alterações. Não se trata apenas de uma reserva histórica.
- CL3 também mantém reservas em sua entrega. Os arquivos existentes não
  constituem, por si só, certificação de término daquele núcleo.

## Contexto

Lidos AGENTS.md e CLAUDE.md. Ordem observada: sessão de 2026-07-29 e Contexto
rápido de afty-status, automacao-dsl e afty-formulas-base. Consultados depois
sessões recentes, fila, afty-player, análise de 29/10, matriz dos Talentos,
entregas CX1/CX2/CL1/CL2/CL3, guias de Talentos de Estilo, Técnicas Marciais
e contrato de uso. A conferência por cláusula das seis classes ainda não terminou.

## Catálogo atual, sem instalar addons

- 52 Talentos nativos. 51 correspondem aos títulos das p.163 a 170, considerando
  a correspondência de Técnicas Ofensivas de Escudo com Técnicas Agressivas de
  Escudo. Alma Livre é adicional e não é ausência do Livro.
- 85 Aptidões nativas: 67 nas categorias do capítulo do Livro e 18 da categoria
  Maldição. Não usar 85 como denominador do capítulo. Absorção Elemental aparece
  nas duas famílias, com ids e textos diferentes, e a coincidência do nome não
  torna a versão de Maldição parte da lista de Aura.
- 361 Habilidades: Lutador 69, Combatente 70, Conjurador 65, Suporte 57,
  Controlador 47 e Restringido 53. São contagens do catálogo, não de operações
  integralmente verificadas.

## Tabela inicial

| Parcela | Página ou decisão | Evidência atual | Veredito |
|---|---|---|---|
| Adepto de Medicina | 165 e 102 | Ficha válida de nível 8, Mestre em Medicina, talento acessível e orçamento suficiente continua sem linha de cura | Implementar/corrigir |
| Mestre do Arremesso | 167 | Azagaia equipada conserva 12/24 m com o talento e seu pré-requisito, embora acerto e dano mudem | Implementar/corrigir o alcance |
| Mestre dos Chicotes | 167 | Chicote equipado conserva 3 m, embora receba +4 de dano | Implementar/corrigir o alcance, aprofundar a reação separadamente |
| Alma Livre | Ausente dos títulos de 163 a 170, decisão anterior preservada | Existe como conteúdo adicional e sua concessão tem tratamento específico | Falso positivo como falta do Livro |
| Mestre da Criação | 167 | Catálogo exige dois Ofícios e nível 4, mas o coletor de configurações só trata Tempestade e Artesão | Implementar escolhas, produção depende de entrega CX5 |
| Sorte e rerrolagens de Talentos | 163 a 168 | Existem rolador, melhorRolagem e contrato CL1, mas isso não é uma operação de Sorte nem prova das cláusulas de cada Talento | Implementar/corrigir após aprofundamento de cada cláusula |
| Estilos, posturas e reações das classes | 49 a 126 e decisões preservadas | Há escolhas, efeitos, estados e operações específicas do Restringido. Não é correto tratá-los como catálogo vazio | Aprofundar por família antes de alterar |
| Crítico dos 12 grupos | 308, 164, 343 e 344 | A tabela foi localizada na fonte. CL1 reconhece crítico, mas não aplica essa tabela nos alvos | Implementar conteúdo e ligações, sem reabrir CD separada |
| Canalizações | 178 e 191, decisão de 15/09 | Dano, exclusão entre canalizações, faces e crítico já têm consumidor em afty-combate-aptidoes | Já coberto na conta, falta concluir uso, acerto e expiração |
| Aura Reforçada | 177 | Emite rdFisico de dobro de AU pelo Motor | Já coberto na parcela numérica |
| Outras auras, conversões, estímulos e reações | 174 a 182 | Existem tratamentos próprios além de HABILIDADE_EFEITOS. Falta conferir cada operação contra evento, alvo e prazo | Aprofundar, sem declarar ausência pela chave do mapa |
| Cura de Energia Reversa | 190 e 191 | FONTES_CURA e resolveCura calculam cura por ponto, alcance e modificadores | Já coberto parcialmente, não reconstruir o núcleo |
| Treino de Energia Reversa | 342 | Etapa 1 aumenta curaPontos. Etapa 3 descreve especificamente a redução de Regeneração Aprimorada | Implementar parcelas restantes, sem redução genérica de Aptidão |
| Potencial Físico 2 | 346 | Etapa tem texto sem efeito. pontosAtributo já existe, mas alimenta pool livre | Implementar alocação restrita aos físicos, preservar tetos |
| Excedentes de Aptidão | 366 | resolveNiveisAptidao apara concessão e alocação, não devolve escolha por categoria | Implementar/corrigir, integrar escolhas com CX2 |
| Resistência 2 e Dados de Vida | 346, entrega CL2 | dadosExtrasDeTreinamento já concede dois dados e pilhaDeDadosDeVida os resolve | Já coberto no núcleo, telas de Dados de Vida continuam em CX6 |
| Registro de testes nas Linhas | Decisão específica ainda aberta na fila | O autor autorizou o registro do Treino Especial, não decidiu o das Linhas | Depende de decisão, não reimplementar Treino Especial |
| Temporários e produção | 366, dependências CX4 e CX5 | As cláusulas dependem dos procedimentos desses lotes | Depende de entrega na parcela correspondente |

Esta é a verificação inicial do conjunto. As linhas de aprofundamento não são
certificação individual de ausência ou correção de todas as suas cláusulas.

## Reproduções

As reproduções foram executadas por `createBlankAfty`, `aplicarAddons` e
`deriveAfty`, sem localStorage, sem fichas reais e sem efeitos artificiais no
Funcionamento Básico. Não equivalem a conferência no navegador.

Ficha: Inato, nível 8, Combatente, patamar Comum, sem addons, Valores Fixos
FOR 14, DES 12, CON 13, INT 10, SAB 15, PRE 8. Origem distribui +2 SAB e
+1 DES. São gastos 3 dos 4 pontos de atributo de nível em SAB. Medicina Mestre.
Os cenários são separados, não compram todos os Talentos juntos.

1. Adepto de Medicina acessível, sem Talentos inacessíveis e sem estouro de
   orçamento. SAB efetiva 20. Cura esperada pela p.102: 3d12 + 5, 2 usos após
   o piso da metade. Resultado: `cura.linhas` vazia nos dois sistemas.
2. Uma Azagaia mundana equipada, com Técnicas de Arremesso e Mestre do Arremesso.
   Dois Talentos cabem no orçamento dos dois sistemas. Alcance permanece
   12/24 m. A regra acrescenta 6 m. Acerto e dano adicionais já são aplicados.
3. Um Chicote mundano equipado e Mestre dos Chicotes. Um Talento cabe no
   orçamento, nível 8 atende o requisito 5. Alcance permanece 3 m. A regra
   acrescenta 1,5 m. O dano já recebe +4.

Os testes não demonstram aquisição financeira de equipamento, que não foi
alterada. Uma arma mundana por cenário é o equipamento de reprodução.

## Menor desenho identificado

Adepto de Medicina cabe em `fonteCura` declarada pelo próprio Talento, já
consumida pelo derive, com os canais nativos de cura mirando o id do Talento.
Isso preserva a curva por nível de personagem sem conceder Suporte em Combate
inteiro e sem acoplar o talento aos bônus exclusivos da classe. A integração
precisa também consumir e recarregar usos. A linha clássica de cura atualmente
exibe o máximo e rola, não basta acrescentar uma fórmula para encerrar o caso.

Os dois alcances cabem em `alcanceArma`, com alvos `cat:arremesso` e
`grupo:chicote`, preservando a seleção de armas, categorias e fontes existente.
Não exigem novo canal ou reescrita do dano.

Mestre da Criação deve salvar duas escolhas de Ofício, emitir bonusPericia
direcionado e entregar ao CX5 o benefício de duas oportunidades por Foco.
A definição de Ofício precisa respeitar o catálogo real da ficha e suas
subcategorias, sem transformar o benefício em dois bônus globais.

Os acionamentos de conteúdo devem consumir `usa`, identidade de operação,
eventos, recursos de CL2 e prazos existentes. Não criar outro motor de uso.
As diferenças de Player/Afty continuam decididas por creature.rulesVersion.

## Linha de base medida

- `npm run asserts`: 252 de 255 arquivos aprovados, 16.355 asserts nos aprovados.
- Falhas: t-cx2-origens (Foco alcance, 24 metros contra 36m),
  t-reconciliacao-g00 e t-revisao-g00 (módulos concorrentes sem classificação
  ou proprietário de controle).
- Após o corte inicial do lançador já havia 256 arquivos de assert. A árvore
  mudou durante a execução. Não certificar esses números como corte atômico.
- `npx eslint src/systems/afty/`: saída zero, apenas nota Babel sobre o
  tamanho do criador.
- `npm run build`: saída zero, avisos de tamanho dos blocos e tempo de plugins.
- `src/components/` e dados oficiais da enciclopédia sem diff na conferência.
- Sem mudança de imports, sem teste de navegador nesta verificação.

## Situação de saída

Esta seção registra o corte inicial de 2026-11-01. O trabalho foi retomado após
a liberação de CX2 e CL3, com reserva na fila em 2026-11-02. A seção de retomada
abaixo prevalece para o estado atual, preservando a evidência inicial.

Validado: fonte, revisão local/remota, contagens, reproduções acima e corte da
suíte, lint e build. Nenhuma implementação por CX3. Nenhum estado de lote foi
alterado e nenhuma parcela foi retirada da fila.

Falta liberar a janela de edição da fila e dos arquivos compartilhados com CX2,
concluir a matriz por cláusula das classes e demais famílias, reservar CX3 e
executar as correções confirmadas. As dependências específicas de CX4/CX5 e
as decisões já abertas permanecem distintas desse conflito de edição.

## Retomada de 2026-11-02 e decisão de 2026-11-03

CX2 e CL3 liberaram os arquivos compartilhados. CX3 reservou os módulos e a
documentação antes das alterações do produto. A nova linha de base está em
`.audit/cx3-20261102/baseline.txt`, com apenas a reconciliação de fontes G00
reprovada antes das mudanças de comportamento de CX3.

O autor decidiu: "Cada Aptidão segue seu custo". O teto da cura de Energia
Reversa não limita Regeneração Aprimorada ou Reversão de Técnica. A terceira
etapa de Treino de Energia Reversa desconta 2 PER da regeneração de membros e
ferimentos internos, conforme p.342. Remover veneno mantém 4 PER. A conversão
1 PER em 2 PE está explícita na p.190. Esta decisão substitui a antiga hipótese
de teto global, sem criar um canal genérico de desconto para outras Aptidões.

Implementação e verificações estão em andamento. Este registro ainda não
certifica o fechamento do lote.

### Aprofundamento de Aura e canalização

| Cláusula | Fonte | Caminho verificado | Desenho confirmado |
| --- | --- | --- | --- |
| Aura Elemental Reforçada | p.175 | Aura Elemental valida o elemento e converte a arma, Aura Reforçada emite RD Física, mas a reforçada elemental não emitia RD | RD por Tipo com fonte própria, lendo o valor declarado de Aura Reforçada, somado a AU |
| Canalizar em Golpe, Avançada e Máxima | p.178, decisão de 15/09 | Estados e grupos de dano existentes, inclusive dado adicional da Máxima, sem cliente que arme o próximo acerto | Usar e armar pelo CL1, consumir depois da confirmação do ataque, erro conserva |
| Canalizar Energia Reversa | p.191 | Grupo de 2d6 por BT e exclusão mútua já existentes, sem cobrança e consumo de evento | Custo próprio em PER e pendência elegível contra Maldição, sem aplicar o teto da cura |
| Ataque recebido e Sorte | p.164/307 | CL1 resolve resultado e sequência, Talento tem três usos, faltava consumidor do 20 inimigo | A confirmação do ataque liga os eventos reais e recupera um ponto uma vez |

A confirmação usa as rolagens nativas já guardadas, não rola novamente nem
substitui os núcleos. Dano de tipos distintos segue o contrato atual de CL1 por
instância de tipo. A decisão geral de RD em ataques mistos continua em CL1.

### Aprofundamento de Reversão de Técnica, 2026-11-03

A p.194 exige aumento de custo pelo nível e uma vaga adicional obrigatoriamente
de Reversão. A implementação encontrada só emitia `vagasFeitico: 1`, que também
podia financiar Estilo ou Técnica Marcial, e não tinha identidade de Reversão
nem aumento do custo. Veredito: corrigir com uma marca no Feitiço, propagada
às suas variações, e uma concessão exclusiva no orçamento nativo. A inversão
do conceito permanece na descrição escrita pelo autor da técnica.

Após pedir contexto, o autor decidiu em 03/11: "Permitir, preservando a
diferença atual: reserva 9 PE Máximo no Player e zero no Afty." Portanto,
Reversão é permitida em Passivos, o adicional entra na reserva de Player e
não cria uma cobrança em Afty. As isenções anteriores de Passivos continuam
valendo. Os custos específicos já existentes das Oculares também são
preservados, sem introduzir nelas um adicional de Reversão em Afty.

O aumento no custo ativo usa o nível efetivo da criação e aparece como fonte
própria. A marca do Feitiço base passa às variações, que não ganham outra vaga.
Uma Reversão pode usar a concessão exclusiva, a segunda usa orçamento normal.
Retirar a Aptidão suspende a concessão e o adicional, preservando a marca com
aviso. Não permite gastar a vaga em Feitiço comum, Estilo ou Técnica Marcial.
`t-cx3-reversao.mjs`: 30 verificações aprovadas em Player e Afty. A edição,
salvamento, recarga e custos dos Feitiços ativos e Passivos passaram também no
navegador nos dois sistemas, em 1440 e 390 pixels.

### Continuação de 2026-11-05: diagnóstico antes de novas parcelas

A main consultada diretamente no GitHub passou a
`02a8cdcae4c75fb4ccc98e176afb785188e4acc9` (Servos da Guerra). HEAD permanece
`deab72cc26a93ab39350b6a781fcb0ca052cc0fd`. A referência local origin/main ainda
aponta para a base antiga, portanto o 0/0 local não certifica igualdade com o
remoto. Não houve integração nem movimentação de base. Há sobreposição no
criador, derive, Feitiços, Treinamentos, sessão, rolagens, telas e guias. O autor
precisará conciliar essas alterações ao integrar os trabalhos.

| Cláusula | Fonte | Evidência e operação real | Veredito |
| --- | --- | --- | --- |
| Puxão de Mestre dos Chicotes | p.167 | Alcance e dano já calculados. CL1 confirma o acerto e permite limitar uso por turno, o teste nativo de Fortitude está disponível | Implementar cliente após acerto confirmado, TR contra CD do atacante e registro de até 3 m na falha |
| Empurrão de Concussão | p.167 | Dano e atributo já calculados. O ataque confirmado guarda o dano efetivo por tipo, e derive publica tamanho | Implementar cliente por turno, exigindo impacto corpo a corpo e alvo no tamanho permitido |
| Movimentos Acrobáticos | p.168 | Condição Caído, teste de Acrobacia, ação livre e buff de Defesa com duração já são nativos | Implementar cliente com disputa declarada, levantar apenas no sucesso, Defesa por uma rodada e deslocamento de 3 m registrado |
| Perfuração | p.167 | Rerrolagem e limite já ligados, mas a recusa conferia só o tipo perfurante | Corrigir para exigir ataque corpo a corpo, preservando Infalível em ataques a distância |

Os deslocamentos são resultados registrados para a mesa, como nos críticos de
Bastão e Haste, pois não existe mapa de posições na ficha. Não são substituídos
por penalidades em Movimento. Os clientes novos permanecem sobre CL1.

### Aprofundamento de recuperação e ações das classes

| Cláusula | Fonte | Caminho verificado | Veredito |
| --- | --- | --- | --- |
| Puxar um Ar | p.54 | Fonte nativa de cura e usos por BT presentes. Espelho achatava a pilha mista do desarmado para uma face só | Corrigir o espelho e ligar cura, ação bônus e contador nativos |
| Revigorar | p.68 | Curva de cura e contador hab:cmb_revigorar presentes, falta operação de cura vinculada | Reusar a fonte, cobrar ação bônus e o mesmo contador, conservar descanso único autorizado |
| Surto de Ação | p.73 | usarEfeitoEspecializacao já concede e consome a ação comum extra e limita usos/rodada, sem pagamento de 5 PE nesse verbo | Cliente transacional de uso paga o custo e chama o verbo existente, com recusa integral se o acionamento falhar |

Insistência (p.60) não equivale a uma cura livre: depende da iminência da queda,
reduz o teto de Empolgação até descanso e não será ligada ao botão genérico.
Descarga Reanimadora e remédios também conservam seus gatilhos próprios.

### Testes de Resistência e concentração, diagnóstico de 2026-11-06

| Cláusula | Fonte | Evidência atual | Veredito |
| --- | --- | --- | --- |
| Resistir | p.54 | Estado resistirPE e bonusTR direcionado a Fortitude/Reflexos existentes, sem uso por teste | Cliente com gasto de 1 a 2 PE e um teste, sem deixar bônus global ligado |
| Conhecimento Aplicado | p.82 | Estado e efeito por PE, teto de metade de BT já calculados | Cliente exige teste contra Feitiço, recalcula a contribuição da habilidade no Motor e evita duplicá-la se a bancada já estava ligada |
| Mente Plácida | p.82 | Bônus da manobra presente. CL1 já recebe bonusExtra/reducaoCd e resolve o teste pendente de concentração | Cliente paga 0 a 2 PE, aplica a redução de CD pelo maior modificador e usa a resolução real, incluindo perda de concentração |

Esses clientes recalculam apenas os efeitos da habilidade pelo coletor e
avaliador existentes, com o contexto DSL derivado, para conservar remendos e
heranças. Não fazem outro cálculo geral de Resistência ou concentração.

### Rerrolagens de classe, diagnóstico e decisão de 2026-11-06

Conceder Outra Chance (p.105) tem custo de 3 PE, limite por BT e mantém o melhor
teste do aliado visível a até 6 m. A fonte não informa ação. O autor decidiu:
"Não gastar ação". Indomável (p.68) tem custo de 1 PE, metade do nível em usos
e mantém o melhor TR falho do usuário. Veredito: implementar nos testes nativos
ainda sem consequências aplicadas, com contadores e transação de CL1.

Os testes que já resolvem consequências dentro da chamada do núcleo não podem
ser reescritos depois como se a falha não tivesse ocorrido. Exemplos concretos:
`rolaTesteDeMorte`, `testeDeFeridaInterna`, o teste de Alma e
`rolaTesteDeConcentracao`. Esses casos precisam de uma etapa de escolha antes
da resolução no núcleo correspondente. Não desfazer PV, morte ou concentração
por um segundo cálculo no conteúdo. Essa integração específica continua aberta.

### Perceber Oportunidade, diagnóstico de 2026-11-06

A p.164 permite repetir o Golpe de Oportunidade duas vezes por rodada e concede
vantagem. Não concede outra reação ao personagem. A p.293 distingue o golpe
da ação Atacar, vedando Ataque Extra. CL1 já mantém um único saldo de reações
em recursosDeEspecializacao e a repetição por identidade em gastaAcao.
Veredito: cliente de conteúdo limita duas oportunidades, usa duas identidades
da mesma família e gasta o saldo nativo. A rolagem continua no mesmo callback
de armas da Ficha/Encontro, com preparação e propriedades nativas. Posição e
gatilho da oportunidade continuam declarados pela mesa, pois não há mapa.

A reprodução com Instintos Aguçados e Reação Rápida confirmou outra lacuna do
cliente: a operação antiga de Reação Rápida incrementava o saldo, mas não
conferia os 2 pontos de estamina da p.121. Corrigir no adaptador transacional,
conservando a operação do núcleo e a política manual com desconto explícito.
Não acrescentar um segundo contador de reações.

O mesmo aprofundamento de Restringido confirmou que Força Imparável e Barreira
Inamovível também custam 2 pontos de estamina ao corrigir o natural (p.121).
O núcleo corrige o teste, mas não cobrava esse custo. Precisão Forçada custa 3
pontos (p.122), já maximiza o dano no preparador nativo, e seu acionamento ainda
não estava exposto. Veredito: envolver os três verbos com o uso transacional.
A correção do TR é recusada depois de consequências aplicadas. Precisão é
consumida pela declaração do ataque corpo a corpo, inclusive no erro, usando
a pendência de CL1, e o preparador de armas continua responsável pelo máximo.

## Matriz de integração por família no corte de 06/11

Esta tabela descreve cláusulas verificadas e seus limites. As contagens de
catálogo acima continuam sendo contagens, sem certificação das 361 habilidades.

| Família/classe | Cláusula e fonte | Operação ou consumidor real | Prova e situação |
| --- | --- | --- | --- |
| Talentos de cura/criação | Adepto de Medicina p.102/165 e dois Ofícios de Mestre da Criação p.167 | fonteCura, usaCuraConteudo, escolhas do criador, bonusPericia e procedimento de produção entregue por CX5 | t-cx3-conteudo/operacoes, browser/browser-escolhas. Cura e Ofícios ligados. CX5 testa +2 oportunidades por Foco de Itens, sem conceder a Invocações. Falta tela de Interlúdio de CX5 |
| Talentos de rolagem | Sorte p.163, Infalível p.163, Perfuração p.167 e Reação Rápida p.165 | rolaSorte/escolheSorte/recuperaSorte, rerrolaDanoTalento, rerrolaIniciativa | t-cx3-operacoes, teste real no Encontro e salvamento. Testes automáticos com consequências ainda precisam da etapa de escolha do núcleo |
| Talentos situacionais | Guarda p.164, escudo defensivo/Tempestade p.165 | usaTesteConteudo, contadores e ação de CL1 | t-cx3-testes, uso e recarga, escopo do teste e contraprovas |
| Técnicas Agressivas de Escudo | p.165/301, decisão de 06/11: empurrão normal e Caído juntos | rolaEmpurraoEscudo/aplicaEmpurraoEscudo, Ação Bônus, relógio do ataque, dano de CL2 e concentração de CL1 | 92 verificações e navegador clássico/G2/Encontro. Dano rolado opcional sem novo sorteio. Escolha alternativa +4,5m, mesmo id de ficha antiga, sem exigir acerto ou mesmo alvo do ataque anterior |
| Adepto de Briga | p.165/300/301 | rolaManobraDeBriga/aplicaManobraDeBriga, acerto sem dano, bônus nativo e Ação Livre | 72 verificações e navegador clássico/G2/Encontro. Derrubar/Empurrar completos, Agarrar depende do vínculo e fuga do alvo |
| Talentos consumidos por outros núcleos | Reserva p.169/32, Reposição p.170/34 e Voto Malevolente p.168 | usaEnergiaAntinatural/usaVigorMaldito de CX2, realizaVoto e validaVoto de CL3 | t-cx2-origens e 30 verificações de t-cx3-voto. Reserva/Reposição já têm tela. Exceção do Voto pronta na operação, tela do ciclo de vida em CX6 |
| Talentos de movimento | Concussão/Chicote p.167 e Movimentos Acrobáticos p.168 | deslocaAlvoTalento e usaMovimentosAcrobaticos, TR/condição/buff nativos | t-cx3-manobras e browser-manobras em Player/Afty, 1440/390. Deslocamento registrado, sem mapa |
| Especialista em Cortes | p.167/365, redução opcional após dano cortante | aplicaCorteConteudo, recibo de CL1/CL2, Buff e grupoNaoAcumula nativos, término por emissor no controlador de turnos | 90 verificações e navegador de oito fichas/quatro Encontros, Player/Afty, clássica/G2 e 1440/390. Duas origens não somam a redução e conservam seus prazos |
| Ação Ágil | p.55/119/365, Andar/Desengajar/Esconder | usaAcaoAgilConteudo, identidade única com limites de CL1, proteção de oportunidade e Furtividade nativa | 169 verificações e navegador de 16 fichas/oito Encontros, Lutador/Restringido. Sem saldo genérico nem duplicação entre Habilidades iguais |
| Investida Aprimorada | p.164/304, decisão de 06/11: 2 × (Movimento + 3 m) | preparaInvestidaConteudo, callback nativo, confirmação e disputa/aplicação separadas | 110 verificações e browser-investida em clássica/G2/Encontro, Player/Afty, 1440/390. Ação, prazo da Defesa, crítico, Sorte/Outra Chance e salvamento |
| Perceber Oportunidade | p.164 e 293 | preparaOportunidadeConteudo, gastaAcao e callback de armas já usado pela ficha | t-cx3-manobras, browser-classes. Vantagem, duas repetições e saldo nativo, sem conceder reação |
| Técnicas do Sentinela | p.168/293/365 | oportunidade identificada, confirmação, usa no alvo com fimDoTurno e preparaReacaoSentinela | 92 verificações e navegador clássico/G2/Encontro, Player/Afty, 1440/390. Acerto com dano zero também reduz Movimento, reação contra terceiro não vira oportunidade |
| Técnicas de Mobilidade | p.168, decisão do autor: fim do turno em curso | disputa de Reflexos, marcador ativo de CL1 contra oponente específico, leitura antes da oportunidade e fim pelo controlador atual | 82 verificações, redutor real e navegador clássico/G2/Encontro. Ataque pode errar, proteção não abrange terceiro, recusa sem gasto e prazo fora do próprio turno conferidos |
| Críticos das armas | p.308, Mestre das Armas p.164, Grupo Favorito p.69, Manejo/Luta p.343/344 | criticoConcedido, aplicaCriticoDeGrupo e testaSangramentoCritico | 12 grupos, concessões, condições, CD, dano secundário e persistência em t-cx3-operacoes/manobras. Efeito de Pugilato também conferido no Encontro |
| Lutador | Aparar Ataque p.53, Puxar um Ar/Resistir p.54, Voadora/Sobrevivente p.56 | Confirmação do ataque abre a disputa de Aparar. curaNoGasto conserva a pilha, clientes de cura/teste/Investida usam CL1, início de turno consome pedido próprio de regeneração | t-cx3-reacao-ataque/classes/investida/regeneracao. Aparar confirmado no Encontro para linhas corpo a corpo. Aparar e Devolver Projéteis, Golpear Brecha e Redirecionar seguem na fila |
| Combatente | Renovação p.65, Revigorar/Indomável p.68, Surto de Ação p.73 e Grupo Favorito p.69 | recuperação pelo evento real, fontes de cura, contador hab, rerrolaTesteDeClasse e usarEfeitoEspecializacao | t-cx3-classes/manobras/renovacao e navegador. Bases automáticas somente no Player, compra de Base em Afty preservada. Estilos e posturas numéricos preservados. Protetor/Adepto/Golpe conservam as perguntas já abertas |
| Postura da Fortuna | p.76 e decisão do Ápice de 12/09/2026 | escolha acessível, postura nativa, rerrolaFortuna, contador de CL1 e recálculo comum do rolador | 128 verificações e navegador clássico/G2/Encontro, Player/Afty, 1440/390, com quota e persistência. Entrada própria, troca e prazo ligados a CL1 na integração de 06/11 |
| Terra e Barreira Inamovível | p.76/121, decisão das oito posturas do Ápice | canal do Motor, permissão atual e consumidores de movimento, escritor de condições e leitura da sessão | 150 verificações, oito fichas e quatro percursos de Encontro, Player/Afty e 1440/390. Recusas sem consumo, fontes, Imitação, Addon, disputa salva e término por queda/incapacitação. Entrada própria e prazo CL1 integrados, com Preparação Rápida |
| Postura da Lua, ações livres | p.76 e leitura nativa de Livre p.300 | posturaAtivaConteudo e usaAcaoLuaConteudo, uso/ação de CL1 e consumidor de oportunidade | 92 verificações e navegador de oito fichas/quatro Encontros, Player/Afty, clássica/G2 e 1440/390. Imitação, Mestre, Ápice, persistência e término. Reação na linha seguinte |
| Reações ao dano de ataque no Encontro | Lua p.76, Esquiva p.50, Cobrir-se e Cobertura Avançada p.178 | confirmação com alvo, reação e dano de CL1, consequências vitais de CL2 | 50 verificações específicas e 16 percursos no navegador. Outras fontes de dano e reações com disputa ou posição seguem na fila |
| Postura do Dragão | p.76 e concessão do Ápice de 12/09 | rolaDragaoConteudo e aplicaDragaoConteudo, recibo do ataque e dano tipado CL1/CL2 | 87 verificações e navegador de oito fichas/quatro Encontros. Guarda as duas decisões sobre tipos de dano e os provedores sem recibo na fila |
| Conjurador | Conhecimento Aplicado e Mente Plácida p.82 | efeitos emitidos no escopo da ficha, aplicarEfeitos e rolaTesteDeConcentracao | t-cx3-classes, remendo de dois participantes e browser-classes. Interrupção de conjuração adversária não tem janela prospectiva em EVENTOS_DE_COMBATE, que só registra ataque resolvido e turnos |
| Suporte | Cura p.102, Versatilidade p.103, Mobilidade/Outra Chance/Análise p.105, Intervenção p.107 e Incitar Vigor p.108 | clientes de cura/testes, rerrolagem, análise, intervenção, reação à queda e gasto de Dados de Vida do destinatário | t-cx3-operacoes/classes/testes/vigor e navegador. Outra Chance sem ação por decisão, Mobilidade usa reação, Intervenção respeita p.210, Análise espera rerrolagens, Versatilidade preserva ofertas fixas. Incitar paga ação/custo do Suporte, dados/cura do alvo. Pacotes para Aliados existentes. Sintonização integrada a recibo de cura, 80 verificações e navegador, curas por Feitiço ainda aguardam provedor, demais reações/grupo em aprofundamento |
| Restringido | Reação Rápida/Força Imparável/Barreira p.121, Precisão p.122, Ainda de Pé p.121 e Rejeitar p.123 | usaEspecializacaoConteudo chama o verbo existente, custos no uso, Precisão pendente no CL1 | t-cx3-classes/manobras, browser-classes, CL2 preservado. Acionamentos ficam dentro da habilidade. Sem recriar o painel recusado, sem alterar os provisórios de Técnicas Marciais |
| Controlador | Marcadores e contagens p.93 a 101 | resolveMarcadoresInvocacao, resolveControleInvocacoes e consumidores de Invocação | t-controlador, t-controlador-progressao e t-cl3-invocacoes existentes. O marcador Companheiro já existe, não é ausência de escolha. Frenesi não tem operação de ataque de invocação em ficha-invocacao-uso, que entrega Auxílio e Forma de Arma. AbaInvocacoes ainda rola ataques sem essa identidade/evento. Integração necessária com a entrega de invocações/CX6 |
| Aptidões pessoais | Aura Controlada p.174, Elemental Reforçada p.175, Impenetrável p.177, demais ativações e Estímulos p.175/179 | canais nativos, efeitosDeAptidoesConfiguradas, usaAptidaoPessoal e usaTesteConteudo | t-cx3-excedentes-combate/testes/classes e browser-escolhas. Bastião/Comandante já têm emissor de Pacotes para Aliados. Janelas ligadas a outro participante conservam a pendência de prazo por emissor |
| Canalizações | p.178/191 | armaCanalizacao, pendência de CL1 e confirmaAtaqueConteudo | t-cx3-excedentes-combate, browser e Encontro. Erro conserva a canalização, acerto a consome. Raio Negro usa o recibo tipado quando a soma conserva o total |
| Energia Reversa | p.190 a 194 e Treino p.342 | usaCuraConteudo, regeneraFerimento, Reversão no criador/custo/orçamento exclusivo e encerramento do veneno de CX5 por CL1 | Navegador de cura, Fluxo, ferimento, edição, Passivos e seleção de veneno. Decisões de custos próprios e reserva 9/0 preservadas. t-cx3-operacoes/reversao |
| Cura em Grupo | p.191 | Uma rolagem da linha de Energia Reversa e aplicação conjunta por CL2 | 52 verificações, oito fichas e quatro Encontros. Sintonização Vital para uma cura com vários destinatários permanece na fila |
| Aura Drenadora | p.175 | Transição vital atribuída a ataque confirmado, Dragão ou Escudo, PV temporário por fonte | 30 verificações e quatro Encontros com acúmulo e recarga. Outros provedores dependem de autoria |
| Pular e Saltador Constante | p.303 e 164, decisões de 06/11 | Movimento e Livre de CL1, teste e queda nativos, recibo de aterrissagem e próximo ataque contra o alvo | 70 verificações, oito fichas e quatro Encontros. Bônus na confirmação com alvo. Modificadores sem faixa e ataques sem esse provedor estão na fila |
| Provocar e Provocação Desafiadora | p.164, 282 e 302, descanso longo por decisão | Disputa CL1, prazo pela fonte e alvo antes de rolar | 64 verificações e quatro Encontros. A obrigação aparece até ataque confirmado. Bloqueio de passagem e provedores sem recibo ficam na fila |
| Medicina Infalível | p.103 | Bônus passivo nativo, rolagem individual pendente, quota e seleção por dado | 47 verificações, oito fichas e quatro Encontros. Fluxo, cura em grupo e provedores externos permanecem na fila |
| Postura da Devastação | p.76 | Pilha por alvo e identidade de ativação própria, projeção sem dupla aplicação no Encontro | 28 verificações e quatro Encontros, troca, teto, RD e recarga. Origens sem recibo mantêm a via manual |
| Postura da Tempestade, primeira queda | p.76 | Acerto confirmado, Fortitude e escritor de condições | 28 verificações e quatro Encontros. Alvo já caído aguarda prazo da condição Imóvel |
| Concentrar Aura | p.176 | Ação Livre e rodada em CL1, passivas escolhidas e dado de dano Energético na linha | 30 verificações, oito fichas e quatro Encontros. Bancada manual preservada |
| Fluxo Constante | p.190, Treino p.342 | Livre e Reação alternativas, cura própria, Medicina usa recibo da mesma cura | Cobertura ampliada em Operações e Medicina, quatro Encontros. Perda de vida ainda declarada |
| Concessões/Treinos | Excedente p.366, Potencial p.346, Perícia/Luta p.343/345 | duas escolhas de atributo, escolhasDeExcedentes, operacoesDeTreino e clientes de testes | t-cx3-conteudo/excedentes-combate/testes e browser-escolhas. Registro de tentativas das Linhas ainda depende da decisão já aberta. Dados de Vida de Resistência 2 já existem em CL2, tela é de CX6 |

## Contratos, arquivos e provas do corte

Os módulos novos de regra são `afty-conteudo-regras.js` (tabela de críticos) e
`afty-conteudo-feiticos.js` (identidade da Reversão e concessão exclusiva).
Os clientes estão em `ficha-conteudo-uso.js`, `ficha-conteudo-combate.js`,
`ficha-conteudo-testes.js`, `ficha-conteudo-manobras.js` e
`ficha-conteudo-acesso.js`, com controles em `PainelConteudo.jsx`. Consomem CL1,
CL2 e os metadados derivados, sem substituir os núcleos.

Integrações nativas: Talentos, Aptidões, Treinamentos, efeitos de conteúdo,
cura, Feitiços, derive, condições, perícias e rolagens. Escolhas passam pelo
criador. Ficha clássica, Encontro e Consulta da prévia recebem os mesmos
controles. Encontro oferece o histórico do alvo e salva o par de sessões pelo
operarComAlvo de CX2. A regra segue creature.rulesVersion, a prévia G2 continua
exclusiva da URL de teste.

Sete arquivos de assert de CX3: conteúdo 65, operações 240, excedentes/combate
76, testes 48, Reversão 30, manobras 124 e classes 232, total de 815 verificações
aprovadas individualmente. As provas incluem configuração, falta de acesso,
recurso insuficiente, repetição de operação, limite, duração, retirada da fonte,
salvamento e isolamento de remendos entre participantes, conforme cada cláusula.
Não são 815 regras diferentes nem certificação de todos os addons.

`browser.mjs`, `browser-escolhas.mjs`, `browser-manobras.mjs`,
`browser-classes.mjs` e `browser-g2.mjs` ficam em `.audit/cx3-20261102/`.
Usam perfis descartáveis, Player/Afty e 1440/390, sem fichas reais. Cada script
guarda resultados e imagens. O teste encontrou a falha do histórico ao ler
registros info e a seleção de alvos com rótulo duplicado, ambos corrigidos.

Fontes: a coleta de 06/11 encontrou 15.006 chaves, sem erro de coleta e com
991 sem fonte individual. Foram localizadas 54 chaves específicas de CX3 em
fontes.json, pelas páginas 102/165, 105, 167, 177, 308 e 346. Restam 937 sem
localização individual. A lista fica em fontes-cx3-localizadas.json na auditoria
local. Não foram regenerados inventário/campanha nem aprovadas regras por esse
registro. A reconciliação formal de hashes e remoções continua necessária.

A segunda consulta remota de 06/11 retornou
`f6433a8a3c11f544c82e5f543738ea56e2920b3b`, publicação de Guerra de Feiticeiros
e suporte à regra de Percepção. A base local permanece deab72c. Não houve
integração, commit, push ou publicação de CX3. Sobreposições com as entregas
remotas devem ser conciliadas na integração do autor.

## Continuação após a liberação parcial para CSS/editor

As duas apresentações da ficha, fila e histórico foram liberadas ao outro chat
depois de confirmar a autorização humana de coordenação. CX3 conserva os demais
módulos e sua entrega própria. O corte anterior passou em 263/264 arquivos,
17.531 verificações nos aprovados, com apenas a reconciliação G00 reprovada.
Build, eslint Afty e os percursos G2 de cura/oportunidade passaram. Não editar
as duas apresentações nem os dois documentos centrais enquanto estiverem com CSS.
ConsultaG2.jsx também foi liberado por mensagem direta para acrescentar o gancho
semântico de CSS, preservando renderOperacao e a lógica dos controles. A frente
de CSS ficou responsável por registrar essa liberação na fila e no histórico.

### Investida Aprimorada, diagnóstico e decisão de 2026-11-06

A p.304 define Investida como ação completa, avanço em linha reta de até duas
vezes o Movimento, ataque corpo a corpo com +2 e -2 na Defesa até o próximo
turno, sem terreno difícil. A p.164 troca o bônus do acerto por BT, acrescenta
3 m ao Movimento durante a ação e permite derrubar após disputa de Atletismo
no acerto. Nenhuma operação correspondente foi localizada nas ações nativas.

O autor decidiu: "24 m: 2 × (Movimento + 3)", no exemplo com Movimento 9 m.
Veredito: cliente usa a ação completa de CL1, penalidade com prazo e o callback
de armas existente. A disputa depois do acerto confirmado usa duas rolagens
nativas e uma aplicação separada, permitindo Sorte/rerrolagens antes de Caído.
Metadado do recibo identifica a Investida, o turno e o alvo, sem outro motor
de ataque ou de condições. Distância e trajeto são declarados pela mesa.

Implementação conferida: 110 asserts de Investida em Player/Afty, incluindo
ação completa, BT, penalidade até o turno próprio, contraprova da virada global
no Encontro, confirmação contra o alvo, erro, disputa em duas etapas, Sorte,
Outra Chance e reaproveitamento de Treino de Luta. Os dois testes conservam
identidade, bônus, dados, fontes e vínculos ao salvar e reler.

Navegador em produção local: 8 combinações Player/Afty, 1440/390 e clássica/G2,
mais o percurso completo no Encontro nas quatro combinações clássicas. Foram
executados o uso, acerto crítico nativo, dano crítico, confirmação, disputa,
aplicação de Caído e reload, sem erros ou transbordamento. Evidência em
`.audit/cx3-20261102/browser-investida-resultados.json` e capturas correspondentes.
O teste expôs um defeito real de gravação do Encontro: dois snapshots no mesmo
clique perdiam ação e buff do uso. O callback aceita a sessão preparada no
segundo argumento e conserva essa sessão ao registrar a rolagem. Também se
aplica ao cliente de Perceber Oportunidade, sem reescrever o redutor central.

### Intervenção, diagnóstico antes da implementação (2026-11-06)

Livro p.107: Ação Comum, aliado em toque, encerra uma condição fraca por 3 PE.
Os degraus de nível 6/12/18 liberam média/forte/extrema por 6/9/12 PE.
`sup_intervencao` tem texto e requisito de nível 4 no catálogo. Nenhum verbo
de Intervenção foi localizado nos clientes de ficha. `derived.condicoes.lista`
já fornece id, força e nível das condições explícitas da própria sessão,
incluindo a força resolvida do Sangramento. `defineCondicoes` é o escritor
existente e o par de sessões do Encontro já salva operações com alvo.

Veredito: implementar o cliente na Habilidade, consumindo `usa` para custo
e Ação Comum, exigindo aliado em alcance de toque e id da condição. Usar a
força resolvida do alvo, sem consultar outro catálogo global ou encerrar por
nome todas as condições. Não remove condições apenas incluídas por outra,
não presume força para uma condição desconhecida e preserva as demais.

Implementada e conferida em Player/Afty nos níveis 4/6/12/18, com custo
3/6/9/12, ação, recusas sem cobrança, duas condições de mesmo nome com ids
diferentes, persistência e força variável do Sangramento. Desmembramento é
recusado: p.210 especifica que ele só é tratado como condição por Feitiços,
e Intervenção é uma Habilidade. Não substitui regeneração de membro de CL2.
`t-cx3-classes.mjs` passou em 532 verificações, 300 novas desta parcela.
O navegador removeu Cego por 9 PE, conservou Envenenado e confirmou reload,
Player/Afty em 1440/390, sem erros ou transbordamento. Evidência em
`browser-manobras-resultados.json`, capturas de Intervenção e log
`browser-intervencao.txt`, todos na pasta de auditoria de CX3.

### Versatilidade, diagnóstico antes da implementação (2026-11-06)

A p.103 permite pagar 1 PE para um teste de perícia não treinada como treinada,
MOD SAB usos pelo descanso único autorizado. O catálogo tem o texto, mas não
declara usos nem foi localizado acionamento. `resolveTestes` já calcula a
proficiência, atributos, penalidades e a oferta `periciaFixa`. Somar BT à linha
final cegamente seria incorreto quando uma oferta fixa vence o bônus próprio.

Veredito: emitir uma alternativa de teste como treinado pelo próprio resolvedor,
somente para a ficha com Versatilidade e para perícia sem proficiência efetiva.
O cliente de testes cobra 1 PE e um uso nativo e consome essa alternativa,
preservando oferta fixa, dados extras e fontes. Não altera o treino salvo nem
o orçamento de perícias. Não concede o benefício para perícia já treinada por
qualquer fonte, nem para Teste de Resistência.

Versatilidade implementada: `resolveTestes` oferece a alternativa temporária
antes da comparação com `periciaFixa`. O cliente usa 1 PE e o contador nativo
da Habilidade, sem mudar o treino permanente. `t-cx3-testes.mjs` passou em 94
verificações, 46 novas: ofertas que vencem ou perdem para o treino temporário,
dados extras, fontes, treino concedido, zero usos, custo, descanso e releitura.
O catálogo declara a recarga de descanso e passou novamente pela coleta real
dos addons, sem erros. Navegador de clássica, G2 e Encontro em Player/Afty,
1440/390, com uso e reload. Evidências `browser-versatilidade-resultados.json`
e `browser-manobras-resultados.json` na pasta de auditoria de CX3.

A fonte de usos de Versatilidade foi localizada individualmente na p.103.
São 55 localizações de CX3 acrescentadas nesta continuação. A coleta atual
tem 15.007 chaves, sem erros e 937 ainda sem localização individual global.
Há três fontes históricas dos efeitos genéricos de Reversão que exigem
remoção documentada na reconciliação: `APTIDAO_EFEITOS::reversao_de_tecnica`
em afty-efeitos-conteudo.js e afty-efeitos.js, mais o filho `::@0` no primeiro.
Foram substituídos pela concessão exclusiva de Reversão, com custo e orçamento
nativos. Não apagar essas fontes nem aprovar o G00 por ausência de erro local.
Chaves exatas em `.audit/cx3-20261102/reconciliacao-versatilidade.json`.

### Análise Profunda, diagnóstico antes da implementação (2026-11-06)

Livro p.105: 1 PE e Ação Comum para Percepção contra CD 15 + ND do alvo.
Sucesso descobre uma característica, mais uma por cinco pontos excedentes.
Uma tentativa por criatura por cena. O catálogo contém a Habilidade, mas
nenhum acionamento foi localizado. Percepção e ND já saem resolvidos do
derive, e CL1 oferece limite por cena, pagamento e ação. O Encontro identifica
o alvo real e já grava o par de sessões.

Veredito: cliente paga e rola o teste nativo uma vez. A conclusão é separada,
exige resolver Sorte pendente, lê o resultado atual e registra a quantidade
de características, com fontes. Não revela atributos escondidos nem escolhe
as características pelo Narrador. Após concluir, o teste fica marcado como
consequência resolvida, sem nova tentativa ou cobrança.

Análise Profunda implementada e conferida em 44 testes novos, classes agora
576. Limite por criatura/cena, custo, ação, outra criatura elegível, recarga,
recusa sem consumo, falha/sucesso, excesso de cinco pontos, Sorte e releitura.
Navegador de Player/Afty no Encontro, 1440/390: teste e conclusão separados,
duas características no sucesso e persistência. `browser-analise.txt` e
capturas na pasta CX3. Total específico de oito arquivos: 1.315 verificações.

### Remoção de veneno por Energia Reversa, nova dependência entregue

O núcleo de CX5 entregue em 06/11 inclui `aplicaVenenoNoAlvo`, que grava
`veneno:<item>` no uso ativo, com custo, condições e efeitos de Defesa/PE.
A p.190 permite remover os efeitos de **um** veneno por 4 PER e Ação Bônus.
O cliente de CX3 ainda apagava apenas Envenenado e, portanto, deixaria ativo
o uso do veneno recém-entregue. Também apagava todas as marcações desse nome.

Veredito: escolher o uso ativo ou uma marcação avulsa de Envenenado e encerrar
somente o veneno escolhido, consumindo o verbo de encerramento de CL1.
Condições ainda sustentadas por outro veneno permanecem. Não consultar o
catálogo de itens para recalcular seu efeito, não mudar o núcleo de veneno
e não interpretar 4 PER como remoção de todos os venenos. O treino não reduz
esse custo e não se aplica o teto da cura básica, conforme decisão do autor.

### Concentração após deslocamentos, diagnóstico complementar

Na p.320, ser movido contra a vontade abre Fortitude com CD 5 + distância.
Ser empurrado usa 10 + bônus de Atletismo do responsável. CL1 já entrega
`abreTesteDeConcentracao` sem rolar ou resolver o teste. Os clientes de
Chicote/Concussão e dos críticos de Bastão/Haste ainda não encaminhavam
o deslocamento a esse verbo, embora registrassem os metros.

Veredito: encaminhar ao núcleo o deslocamento efetivamente realizado.
Bastão é empurrão na p.308, Haste é movimento. Chicote e Concussão movem,
conforme p.167. Não criar outro teste ou escolher a maior CD fora do núcleo.
Uma recusa, zero metros ou resistência bem-sucedida não abre teste.

As duas integrações foram implementadas. Venenos: 30 testes novos com o
verbo real de CX5, dois venenos simultâneos, condições compartilhadas, buff
de Defesa, custo sem desconto, ação, fonte removida, marcação avulsa e
releitura. O navegador clássico/G2 de Player/Afty em 1440/390 removeu o
veneno selecionado por 8 PE, encerrou o buff e conservou o outro veneno,
inclusive após reload. `browser-venenos-resultados.json` e capturas na
pasta de auditoria de CX3. Não foi criada outra operação de veneno.

Concentração: 28 verificações novas em `t-cx3-manobras` (agora 138) e
`t-cx3-operacoes` (agora 284). Nenhum teste de concentração é rolado
automaticamente. CD 5 +
deslocamento para Chicote, Concussão e Haste, 10 + Atletismo para Bastão.
A escolha de distância de Bastão entrou no controle, a de Haste permanece
3 m exatos da p.308. Zero deslocamento e TR resistido não ameaçam o foco.
Total de CX3: 1.373 verificações em oito arquivos.

### Mobilidade Avançada, diagnóstico antes da implementação

Livro p.105: +3 m já existem no Motor. Falta a Reação que permite mover
metade do Movimento em direção ao aliado que caiu nas Portas da Morte.
CL2 já retorna `abateu` e o evento real em `aplicaDanoRecebido`, mas a
confirmação de ataque de CX3 descartava esse retorno, salvando só os cálculos.
O alvo do Encontro já possui estado vital e histórico próprios.

Veredito: conservar os eventos de dano e a queda no recibo da confirmação,
sem alterar a aplicação de dano. O cliente valida o aliado ainda nas Portas,
o evento real da rodada, a direção declarada e a Habilidade disponível,
gastando a Reação nativa. Registra a distância disponível para a mesa,
sem mapa nem outro contador. Não reage a alguém já caído antes do ataque,
não repete a queda e não concede reação adicional.

Mobilidade implementada e validada em 38 testes novos, classes agora 614.
O evento de queda é conservado nos dois históricos. Há contraprovas de
aliado já curado, evento ausente/antigo, alvo diferente, sem reação e condição
que impede mover. Não foi acrescentada uma exigência de combate ao texto.
Navegador Player/Afty no Encontro, 1440/390, confirmou um ataque real que
derruba o aliado, reação, metade do Movimento e reload. O aliado permanece
nas Portas, pois a Habilidade não o cura. `browser-mobilidade.txt` e capturas
na pasta de auditoria de CX3. Total atual específico: 1.411 verificações.

### Voadora, diagnóstico antes da implementação

Livro p.56: ao realizar Investida e estar desarmado, pode gastar 3 PE para
causar 1d8 adicional por 3 m de deslocamento, limitado pelo modificador de
Força ou Destreza. O catálogo contém a Habilidade, sem acionamento ou efeito
correspondente. O contexto nativo já define `desarmado`, e o cliente novo
de Investida já valida trajeto, distância, arma, ação completa e prazo.

Veredito: reaproveitar esse cliente, aceitando a Investida comum quando
Voadora estiver disponível, e a Aprimorada quando o Talento também estiver.
Preservar a decisão de alcance da Aprimorada. Cobrança manual/explícita como
nas demais Habilidades, mais dados nomeados Voadora no pedido nativo de dano.
O crítico usa o rolador existente. Sem duplicar cálculo do ataque ou criar
um estado global de dano adicional que afete outros golpes.

Voadora implementada e conferida em 80 verificações novas, Investida agora
190. Investida comum sem o Talento, Aprimorada com ele, limite por Força ou
Destreza, distâncias de fronteira, nenhum dado mínimo inventado, 3 PE,
ação completa, fonte do acerto, crítico e persistência. Navegador de
clássica/G2/Encontro em Player/Afty e 1440/390, com dano adicional nomeado,
pagamento único e aplicação do dano no alvo real. `browser-voadora-resultados.json`
na pasta de auditoria. Total específico atual de CX3: 1.491 verificações.

### Sobrevivente e início do turno, diagnóstico antes da implementação

Livro p.56: menos da metade do PV, não Inconsciente nem nas Portas, cura
1d6 + MOD CON no início do turno, mais 1d6 em 8/12/16/20. O efeito numérico
existe em `lut_sobrevivente`, condicionado a machucado. Não foi localizado
consumidor na Ficha, G2 ou Encontro. O único consumidor de `d.regeneracao`
de classe é Corpo de Aço em `iniciarTurnoEspecializacao`, que usa a pilha
genérica e não distingue as fontes.

O começo do Encontro chama `iniciaCombate` para todos, sem chamar
`iniciaTurnoFicha` para o primeiro participante. Os turnos seguintes já
usam esse verbo. Logo, não basta ligar a cura no hook, pois o primeiro
turno continuaria sem o efeito.

Veredito: emitir o pedido de cura de cada fonte de classe no escopo da ficha,
pelo Motor e preparação de cura existentes. O hook já entregue de início
de turno consome o pedido próprio de Sobrevivente, com as condições reais,
e Corpo de Aço usa seu pedido próprio para evitar absorver outra fonte.
O controlador chama o início de turno também para o primeiro combatente,
uma vez. Não criar outro relógio, botão de cura irrestrita ou motor vital.

Sobrevivente implementado e conferido em 164 verificações novas de
`t-cx3-regeneracao.mjs`: níveis 4/8/12/16/20, requisito com atributo final
permanente, limiar estrito de metade, estados vitais, Inconsciente, cura
sem ação/PE, fontes, persistência e coexistência com Corpo de Aço. Cada
fonte conserva seus dados e modificadores, sem absorver os da outra.
`conteudoTestes` e `conteudoRerrolagens` também usam a disponibilidade final
da Habilidade, que já incorpora o bônus permanente da origem.

O primeiro combatente recebe `iniciaTurnoFicha` ao começar o Encontro,
uma vez. Os demais recebem esse verbo apenas quando chegar seu turno.
Navegador em produção local: clássica/G2/Encontro, Player/Afty, 1440/390,
cura 5d6 + 3, primeiro participante, próximo turno e reload sem cura extra.
Evidências em `browser-sobrevivente-resultados.json` e capturas na auditoria
CX3. A suíte CL2 de vida passou em 316 verificações após a integração.

Corte após Sobrevivente: nove arquivos CX3, 1.655 verificações aprovadas.
A suíte completa passou em 273 de 275 arquivos. As falhas são
`t-reconciliacao-g00` e `t-revisao-g00`, fontes/inventário e classificação
dos nove módulos novos de CX5. Não foram suprimidas ou certificadas por
CX3. Logs `asserts-corte-sobrevivente.txt`, `lint-sobrevivente.txt`,
`build-sobrevivente.txt` e `ordem-sobrevivente.txt` na auditoria. Eslint,
build e as 50 verificações de ordem dos módulos passaram. A referência
local origin/main foi atualizada por outra frente e agora está dois
commits à frente de HEAD, 0/2. A base de trabalho permanece deab72cc.

### Adepto de Briga, diagnóstico antes da implementação

Livro p.165: +3 de acerto e dois níveis de dano desarmado já têm consumidores,
incluindo a exceção de Faixas decidida pelo autor. A segunda cláusula permite
Agarrar, Derrubar ou Empurrar como Ação Livre após acerto desarmado sem dano,
com metade de BT no teste. Nenhum cliente dessa cláusula foi localizado.
O recibo real de confirmação já identifica alvo, turno, arma e dano final.
`derived.testes.manobras` fornece os bônus de executar/resistir e distância
base. As duas perícias preservam seus dados extras e fontes.

Veredito: ligar Derrubar/Empurrar ao recibo real de dano zero, cobrar a Ação
Livre nativa do Talento (p.300), rolar a disputa e concluir em outra
operação. Caído usa o escritor existente, Empurrar registra a distância da
p.301 e abre a concentração nativa quando houver deslocamento. Sem mapa,
trajeto permanece declarado. Agarrar ainda depende de vínculo e fuga no
início do turno do alvo, não entregues pelo simples escritor de condições.
Não publicar uma condição sem o procedimento de escape como se fosse o
agarrão completo. A operação parcial não certifica o Talento inteiro.

Briga: Derrubar/Empurrar implementados, 72 verificações novas, incluindo
gatilho real, dano absorvido, erro/arma/dano positivo recusados, requisitos,
bônus/dados/fontes de manobra, escolha da perícia do alvo, ação livre nativa,
Sorte pendente, empate, concentração e persistência. Navegador clássico/G2
em Player/Afty e 1440/390, com operação completa no Encontro, confirmações
reais e reload. `browser-briga-resultados.json` registra os oito percursos.

### Incitar Vigor, diagnóstico antes da implementação

Livro p.108: Ação Bônus e 3 PE para uma criatura em toque gastar seus Dados
de Vida. O catálogo contém a Habilidade, mas não foi localizado consumidor.
CL2 entrega `gastaDadosDeVida` e `resumoDadosDeVida`, com pilha por classe,
modificador por dado, custos, recusas, cura e persistência. Não é necessário
outro motor de cura, uma cura aleatória genérica ou descanso artificial.

Veredito: cliente transacional valida Habilidade e toque, cobra ação/custo,
chama o verbo CL2 para a pilha escolhida do destinatário e salva o par de
sessões. Se o gasto de dados for recusado, toda a operação permanece sem
cobrança. A própria ficha também é destinatária possível. O progresso de
Resistência é emitido por `operacoesDeTreino`, com suas travas existentes,
para o núcleo contar os dados extras sem consultar a ficha de outro ator.

Incitar Vigor implementado: 56 verificações novas de custo/ação, dois
participantes, própria ficha, pilhas de multiclasse e Treino, requisitos,
recusas sem cobrança, teto, estado vital, descanso e persistência.
Navegador clássico/G2/Encontro em Player/Afty, 1440/390: própria ficha usa
2d8, destinatário usa dois dados extras d10, ambos com MOD CON por dado.
`browser-vigor-resultados.json` registra os oito percursos. Total de CX3:
11 arquivos, 1.783 verificações. Suíte completa: 275 de 277 arquivos,
somente as duas falhas G00 já descritas. Build e eslint Afty aprovados.

### Voto Malevolente e Talentos já consumidos, diagnóstico complementar

Expansão de Reserva (p.169/32) e Reposição Sanguínea (p.170/34) já possuem
metadados em `afty-origens-uso.js`, operações em `ficha-origens.js` e
controles em `PainelOrigens.jsx`. Os testes de CX2 verificam usos, cura,
ação livre, PE temporário e recarga. A reação de Vigor exige receber dano.
Não são mais ausência de operação, como constava na matriz de 29/10.
Não reconstruir esses clientes nem certificar o restante de CX2 por eles.

Voto Malevolente (p.168) dispensa o malefício um peso acima no Emergencial.
CL3 já entrega Voto Emergencial e seu ciclo de vida, refutando a ausência
antiga do procedimento. Porém `validaProprio` exige a diferença sem ler
Talentos, e `realizaVoto` não transmite a lista acessível do participante.

Veredito: extensão estreita do contexto do validador existente e da chamada
de realização. Somente a exigência adicional do Emergencial é dispensada,
mantendo pesos, escopo, duração, Aptidões, reação, limite e histórico.
Não criar outro validador ou painel. A tela do ciclo de vida de Votos
continua sendo a integração de CX6 já atribuída pela divisão dos lotes.

Voto Malevolente implementado no validador e na realização nativos. São
30 verificações novas em Player/Afty, com requisito, reação, custo,
persistência na ficha, histórico, idempotência e preservação de limite,
escopo, duração e Aptidão possuída. A lista acessível do derive prevalece
sobre uma declaração de Talento do chamador. `t-cl3-votos` passou em 130
verificações e a ordem de módulos em 50. Não há teste de navegador desse
acionamento: a tela do ciclo de vida continua ausente e atribuída a CX6.
O contexto da pré-avaliação deve receber os Talentos acessíveis, conforme
o contrato atualizado em `afty-votos.md`.

O navegador também reconferiu Investida e as manobras após a correção do
primeiro turno. Passaram os oito percursos de Investida e os quatro de
Chicote/Concussão/Outra Chance/Intervenção/Versatilidade/Análise/Mobilidade.
O controle de Bastão foi conferido nas quatro combinações Player/Afty e
1440/390: distância escolhida de 1,5 m, concentração pendente com CD por
Atletismo, sem resolução automática, persistência. Capturas e resultados
em `browser-bastao-resultados.json` e logs pós-Sobrevivente na auditoria.

### Renovação pelo Sangue, diagnóstico antes da implementação

Livro p.65: ao acertar crítico em inimigo ou reduzir seus PV a zero,
recupera 1 PE. O catálogo concede a base de Combatente 6, sem operação
correspondente localizada na confirmação. CL1 já informa crítico e CL2
informa abate, preservados no recibo atual. O alvo inimigo já é declaração
da confirmação e a recuperação de PE real usa o saldo existente, sem
recuperar a casca temporária.

Veredito: após confirmação válida, usar o evento real de crítico/acerto ou
abate, a lista final de Habilidades acessíveis e o teto de PE atual. Uma
recuperação por ataque com o gatilho, sem outra ação, botão, rolagem,
contador ou processamento do dano. A identidade existente da confirmação
impede repetição. O resultado e a fonte ficam no recibo de confirmação.

Renovação implementada, 65 verificações específicas e navegador Player/Afty
no Encontro, 1440/390, com crítico e abate simultâneos recuperando um PE,
fonte e reload. Afty exige a Base escolhida, Player recebe pela progressão
nativa, sem transferir a concessão automática. Contraprovas de aliado,
erro, acerto comum, requisito/remendo, teto, PE temporário e idempotência.
Total específico: 13 arquivos, 1.878 verificações. Suíte completa: 277/279,
apenas as duas falhas G00 descritas. Build e eslint Afty aprovados.
Evidência de navegador atual em `browser-renovacao-atual.txt`, após o build.
A primeira tentativa abriu o build anterior e expirou, não é prova de
regressão ou aprovação. A repetição com o build atual passou nas quatro.

### Técnicas Agressivas de Escudo, decisão e diagnóstico antes da implementação

Livro p.165: ao atacar no próprio turno, Ação Bônus para Empurrar com o
escudo. Sucesso causa MOD FOR d6 + MOD FOR de impacto, além da escolha entre
4,5 m adicionais ou derrubar. O autor respondeu: "Empurrar pela distância
normal e também aplicar Caído". Portanto, a escolha de Caído conserva a
distância normal, incluindo a margem da disputa. A pergunta foi encerrada.

O derive já publica a linha própria do escudo e os bônus de manobra. CL1
fornece ação bônus, rolador e concentração por empurrão, CL2 aplica o dano.
O cliente de Briga já separa disputa de aplicação, conservando rerrolagens.
O gatilho é atacar, não acertar, e o texto não exige que o empurrão escolha
o mesmo alvo do ataque anterior. Não acrescentar essas duas restrições.

Veredito: reutilizar a construção de testes nativos, mantendo operação
própria do escudo e suas consequências. Identificar o ataque real no turno
pelo relógio existente no recibo, validar escudo equipado, alvo em alcance
e próprio turno. Aplicar dano normal do escudo na vitória, movimento base
mais margem, e a alternativa decidida. Sem crítico de dano por um crítico
de Atletismo. Atualizar o título para o cabeçalho da fonte, mantendo o id
das fichas antigas. Não criar outro motor de manobras ou de dano.

Implementação concluída: 68 verificações novas em Player/Afty. O recibo
de novos ataques guarda `contextoTurno`, emitido pelo preparador comum,
e conserva esse metadado nas rerrolagens. Ele lê o relógio existente, não
é outro relógio. O Encontro transmite se o combatente é o ativo, e a
operação recusa também o turno já encerrado. Históricos antigos continuam
legíveis, mas um ataque antigo sem essa prova não aciona o novo empurrão.

Os testes cobrem ataque que errou, escolha da perícia, bônus/dados nativos,
ação bônus, vitória/falha, dano sem crítico por Atletismo, Caído com
distância normal e margem, alternativa de 4,5 m, concentração, Sorte,
requisitos, equipamento, identidade, alvo e releitura. A construção dos
testes é compartilhada com Briga, que passou novamente em 72 verificações.
Renovação tem helper compartilhado de recuperação pelo evento, permitindo
também o abate causado pelo dano do escudo sem repetir o cálculo.

Navegador em produção local: oito percursos de apresentação clássica/G2,
Player/Afty e 1440/390, mais operação completa nos quatro Encontros.
Foram clicados o ataque nativo que errou, disputa, aplicação, passagem de
turno e recusa fora do turno, com dano/condição/distância e reload. As duas
escolhas foram exercidas. Capturas e `browser-escudo-resultados.json` na
auditoria. Inspeção visual em 390 sem transbordamento. O título do catálogo
agora coincide com o cabeçalho p.165 e preserva o id.

Foram localizadas três chaves de Escudo em fontes.json, total de 58
localizações específicas de CX3. Os registros mantêm seus proprietários e
não aprovam execução ou auditoria. O corte de 15.007 chaves e 937 sem fonte
individual citado antes é anterior à entrada dos módulos de CX5 e não é
a contagem atual. Os nove módulos de CX5 ainda impedem a coleta regular.

Corte após Escudo: 14 arquivos específicos, 1.946 verificações. Suíte
completa: 278 de 280 arquivos, falham apenas reconciliação/classificação
G00. Lint Afty, build, 50 verificações de ordem dos módulos e 24 de fontes
aprovados. A main remota foi consultada novamente e permanece f6433a8a,
HEAD deab72cc preservado, referência local 0/2, sem integração. Não houve
certificação global de CX5, mudança em componentes oficiais ou promoção G2.

### Dano já rolado de Escudo e elegibilidade de Infalível

Diagnóstico: o dano do empurrão pode ser rolado pelo callback nativo antes
da aplicação e reaproveitado. Isso conserva o resultado escolhido no
histórico em vez de sortear outra vez ao concluir. Porém Ataque Infalível
(p.163) limita sua rerrolagem a ataque armado ou desarmado, e Empurrar
é uma manobra (p.301). O cliente anterior verificava apenas `armaId`,
que também existe na linha técnica do escudo, sem testar a fonte da linha.
Ser rolável na aba Dano não transforma o empurrão em ataque.

Veredito: manter o reaproveitamento opcional do dano normal próprio,
posterior à disputa e ainda sem consequências. Não conceder Infalível
ao empurrão. Corrigir a elegibilidade no cliente de rerrolagem, preservando
arma, Ataque Básico e os escopos já decididos do Golpe. A sugestão de usar
Infalível aqui foi refutada pelo texto, sem nova decisão do autor.

Implementado o reaproveitamento opcional do dano de Escudo e a elegibilidade
compartilhada de Infalível entre operação e tela. O dano escolhido mantém
id, total e uma única entrada no histórico. Dano de manobra não recebe a
rerrolagem de ataque. São 92 verificações de Escudo, total específico de
14 arquivos e 1.970 verificações. Navegador Player/Afty, clássica/G2 e
Encontro, 1440/390, aprovado em `browser-dano-escudo.txt`. Build e eslint
aprovados. O corte completo anterior tem 278/280 arquivos e não inclui as
quatro últimas contraprovas, executadas separadamente no arquivo de Escudo.

### Postura da Fortuna, diagnóstico antes da implementação

| Parcela | Fonte e evidência atual | Veredito |
|---|---|---|
| Rerrolar um d20 baixo | Livro p.76, escolha e bancada existem, operação não localizada | Implementar |
| Dados extras, vantagem, margem e mínimo natural | Rolador nativo guarda dados individuais, bônus e resultado | Reutilizar o cálculo nativo |
| Usos por rodada | Metade de BT, contadores de CL1 já existem | Consumir o limite nativo |
| Postura copiada | Imitação concede Assumir Postura com a escolha copiada | Preservar a concessão nativa |
| Ativação e término da postura | Bancada guarda a postura ativa, sem ciclo completo de duração. Término por queda/incapacitação ligado em 06/11 | Ação/usos e minuto de duração ainda abertos |

O menor desenho é publicar a fonte da escolha acessível, exigir Fortuna
ativa, repetir um índice de d20 e manter o maior. A mesma função de cálculo
do rolador recompõe total, descarte, sucesso e crítico sem sortear novamente
dados extras. O recibo mantém a tentativa e impede repetir o mesmo dado,
incluindo quando o novo resultado continua baixo. Não cobra ação ou PE.
Testes com consequências, ataque confirmado e Sorte ainda pendente recusam.
O controle fica no item existente da postura. A ativação/duração geral das
posturas permanece na bancada, sem criar um núcleo paralelo neste cliente.

A decisão de 12/09/2026, já registrada na fila para Invencível sob o Sol,
inclui as oito posturas, mesmo não aprendidas. A fonte resolvida do Ápice
também permite Fortuna, usando o mesmo contador, sem duplicar a quantidade
quando a postura normal estiver ativa. Não altera as regras do Ápice.

Fortuna implementada e validada em 128 verificações específicas. O helper
do rolador serve ao sorteio inicial e ao recálculo, preservando os mesmos
critérios de acerto, crítico, mínimo natural e descarte. A operação não
repete bônus ou dados extras, nem permite repetir o mesmo dado que ficou
baixo. A troca efetiva por Sorte/Treino e a melhor rolagem de Indomável
foram conferidas. O derive lê a definição customizada já emitida pela
Imitação, incluindo Mestre da Postura, e os requisitos atuais do Ápice.

Navegador em produção local: oito percursos Player/Afty, clássica/G2 e
1440/390, mais quatro Encontros. Na ficha, um d20 de vantagem foi trocado
por 18, mantendo o outro, depois a tentativa menor do segundo conservou 2.
No Encontro, dois testes normais consumiram a mesma quota. Resultado,
contador, ausência de gasto de ação/PE e releitura foram verificados.
Sem erros de página ou transbordamento, captura de 390 inspecionada.
Evidências em `browser-fortuna.txt`, `browser-fortuna-resultados.json` e
capturas na auditoria. O teste de navegador foi ajustado ao botão real de
acerto da apresentação, sem alteração do produto para acomodar o teste.

Imitação teve 44 verificações de configuração e 124 de fechamento G2
reexecutadas, além dos dois arquivos próprios em src/systems/afty/asserts.
Uma edição concorrente de Controlador causou leitura anterior à criação
de uma variável durante a primeira execução, corrigida pela própria frente
antes da repetição aprovada. Não houve correção de Controlador por CX3.
As duas fontes de Fortuna foram localizadas na p.76, total de 60 fontes
específicas. Corte próprio: 15 arquivos e 2.098 verificações. Duração geral
das posturas e etapas anteriores às consequências automáticas continuam
abertas. Não declarar o lote inteiro concluído por esta parcela.

Rechecagem após as últimas mudanças de Fortuna: 281/283 arquivos aprovados,
somente `t-reconciliacao-g00` e `t-revisao-g00` reprovados. O corte inclui
os dois arquivos concorrentes de CX6 presentes naquele instante, sem
certificação de seu conteúdo por CX3. Eslint Afty, build, fontes (24) e
ordem de módulos (50) aprovados. HEAD deab72cc e referência local 0/2
preservados, livro com o hash esperado, sem diff nos componentes oficiais.
Nenhuma linha nova com U+2014 em relação à entrada. `git diff --check`
continua apontando a linha em branco final preexistente do histórico.
Evidências `asserts-fortuna-final.txt`, `lint-fortuna-final.txt`,
`build-fortuna.txt` e `diff-check-fortuna.txt` na auditoria. O derive foi
liberado temporariamente para a frente concorrente após esta parcela.

### Técnicas do Sentinela, diagnóstico antes da implementação

| Cláusula | Fonte e evidência atual | Veredito |
|---|---|---|
| Acerto de oportunidade reduz Movimento | Livro p.168, ataque confirmado existe, mas não identifica oportunidade | Identificar o pedido nativo e aplicar o efeito |
| Prazo até o fim do turno do alvo | CL1 já tem duração fimDoTurno no próprio destinatário e Encontro encerra esse turno | Reutilizar, não criar relógio por emissor |
| Reação a ataque contra outro alvo a 1,5 m | Livro p.168, recibo confirmado do atacante e saldo de reações existem | Cliente com recibo real e alcance declarado |
| Repetição de oportunidade | Livro p.164/293, Perceber já usa limite e saldo nativos | Reutilizar sem conceder vantagem ou duas repetições a quem só tem Sentinela |
| Acúmulo da redução | Livro p.365, prejuízos iguais da mesma fonte não acumulam | Renovar o mesmo efeito de 4,5 m |

O pedido do Golpe de Oportunidade recebe identidade e contexto próprios,
conservados no teste e nas rerrolagens. A confirmação continua aplicando
o dano pelo núcleo e, se houver acerto e Talento acessível, liga Movimento
-4,5 m no alvo até o fim do turno dele. Dano zero não apaga o acerto.
A outra reação é um ataque próprio, não vira oportunidade por receber o
mesmo Talento. Exige ataque real da criatura contra terceiro no turno
atual dela e declaração de distância, consome a reação existente, sem
ação comum ou PE. Identidades e limite nativos impedem repetir o gatilho.
Sem mapa, ataque artificial ou desfazer o ataque original. Os dois
controles ficam no Talento, e a regra continua vindo da própria ficha.

Implementação validada em 92 verificações, incluindo requisito, orçamento,
saldo, limite, alvo, identidade, Sorte, erro e dano zero. A redução de
Movimento renova a mesma fonte pelo prazo de CL1, salvamento e término
conferidos. A reação usa o ataque confirmado da criatura contra terceiro,
mesmo quando errou ou foi um ataque fora do turno próprio. O teste de
atualidade usa o relógio nativo, não exige que o atacante seja o combatente
ativo. A interface recebe a identidade real do Sentinela no Encontro.

Oito percursos de ficha clássica/G2, Player/Afty e 1440/390, e oito de
Encontro entre os dois casos passaram. Foram clicados a oportunidade,
o dano e sua confirmação, a passagem do turno do alvo, o ataque que errou
contra terceiro, a reação do Sentinela e a confirmação dela. Movimento
só recebe o prejuízo no primeiro caso. Reload conserva os usos e o efeito
ou término ocorrido. Sem erros de página ou transbordamento. A captura
de reação em 390 foi inspecionada. Provas em `browser-sentinela.txt`,
`browser-sentinela-resultados.json` e capturas na auditoria.

São três localizações da p.168, total específico de 63. Corte próprio:
16 arquivos, 2.190 verificações. Suíte completa: 283/285, duas falhas G00.
O arquivo concorrente de uso do Controlador entrou neste corte, sem
certificação de seu conteúdo por CX3. Lint Afty, build e ordem (50)
aprovados. A reação lê os produtores de ataque confirmado existentes,
Feitiços ou invocações que ainda não emitem esse recibo continuam com
sua integração nas frentes correspondentes. Não foi criado outro produtor
de ataque ou simulado o gatilho de uma conjuração.

### Técnicas de Mobilidade, diagnóstico antes da implementação

| Cláusula | Fonte e evidência atual | Veredito |
|---|---|---|
| Movimento +3 m | Livro p.168, efeito já existe no Motor | Preservar |
| Ao atacar, disputar Reflexos com o alvo | Recibo de ataque confirmado identifica o alvo, mesmo errando | Implementar disputa e conclusão separadas |
| Uma vez por rodada | Contador de CL1 existente | Reutilizar |
| Alvo não pode dar oportunidade até o fim do turno próprio | Uso ativo com id ligado ao oponente persiste e expira por fimDoTurno | Consumir o uso ativo existente |
| Bloqueio de oportunidade contra participante específico | Pedido agora identifica oportunidade, contexto do Encontro fornece os dois participantes | Verificar antes de cobrar, conservar a recusa na confirmação |
| Ataque fora do turno próprio | Decisão do autor recebida nesta continuação | Até o fim do turno em curso |

A classificação anterior de dependência genérica de oportunidade fica
refutada para esses clientes: `usa` já aceita um marcador ativo sem efeito
numérico, com origem e duração. A prova com normalizaSessao e encerramento
do turno preservou o vínculo e retirou o marcador. Não é necessário criar
outro relógio ou ampliar o núcleo de ações. O preparo de oportunidade pode
consultar a sessão real do alvo pelo callback já existente e recusar antes
de consumir a reação. A confirmação também valida o vínculo para não
aceitar uma oportunidade contra outro alvo ou sem identificar quem atacou.

O caso confirmado durante o turno próprio exige o ataque real contra o
destinatário e usa o prazo nativo na sessão de quem tem Mobilidade. Não
reduz globalmente o acerto ou a Defesa, não elimina oportunidades de outras
criaturas e não altera a reação distinta de Sentinela. A janela fora do
turno próprio foi submetida ao autor, com resposta registrada abaixo.

O autor respondeu: até o fim do turno em curso. A pergunta foi encerrada,
incluindo o ataque como reação fora do próprio turno. O desenho passa a
guardar, nos parâmetros do uso ativo de CL1, o id e a sequência do turno
atual do Encontro. O controlador já sabe quando esse turno acaba. O
adaptador de conteúdo encaminhará esse encerramento ao verbo encerraUso,
inclusive quando a proteção estiver na sessão de outro participante.
Não cria outro contador de turnos ou uma duração aproximada por rodada.
Esse ajuste de integração é necessário para cumprir a decisão, não amplia
o núcleo genérico de CL1. Fim do combate retira o uso ligado ao combate.

Mobilidade implementada e validada em 82 verificações específicas em
Player/Afty. A disputa nativa admite ataque que errou, mantém bônus e
fontes de Reflexos e consome uma tentativa por rodada, sem ação ou PE.
A conclusão lê os dois testes atuais, recusa Sorte pendente e marca as
consequências. O marcador específico persiste no uso de CL1, sem número
artificial em Defesa ou acerto. O bloqueio consulta a sessão real do alvo
antes de gastar a reação, e a confirmação volta a validar esse vínculo.
Outra criatura e ataques comuns continuam permitidos.

O contexto do turno atual é copiado pelo callback comum do Encontro para
`contextoTurno.emCurso`, conservado nas rerrolagens e no recibo confirmado.
Não aceita um ataque antigo sem prova do turno atual. Os parâmetros do
marcador guardam id/sequência desse turno e a identidade da aplicação.
Ao passar o turno, o controlador encaminha seu fim a `encerraUso`, mesmo
se a sessão protegida for de outro participante. Remover o ativo também
encerra os vínculos. Forçar outra rodada sem terminar o turno preserva a
proteção, que acaba no fim real. Encerrar o combate limpa o uso nativo.

Oito apresentações clássica/G2 e oito percursos de Encontro, Player/Afty
e 1440/390, passaram. A ficha individual exibe o controle, a operação com
alvo é feita no Encontro. Foram clicados ataque que errou, confirmação,
disputa, aplicação, reload, oportunidade impedida sem gasto, oportunidade
de terceiro permitida e término no turno em curso. O caso fora do turno
usou a reação real de Sentinela ao ataque contra terceiro e confirmou o
fim antes do turno próprio seguinte. A captura de 390 foi inspecionada,
sem transbordamento. Evidências em `browser-mobilidade.txt`,
`browser-mobilidade-resultados.json` e capturas na auditoria.

Sentinela e Investida foram reexecutados no navegador após a mudança,
incluindo a escolha de alvo da oportunidade no Encontro. Logs
`browser-sentinela-pos-mobilidade.txt` e
`browser-investida-pos-mobilidade.txt`. Seis fontes localizadas na p.168,
total específico de 69. Corte próprio: 17 arquivos e 2.272 verificações.
Suíte completa: 284/286, somente as duas falhas G00. Lint Afty, build,
ordem (50), CL1 combate (328), regeneração (164) e fontes (24) aprovados.
Não houve alteração do derive nesta parcela, liberado para a outra frente.
O autor pediu que as dúvidas ainda abertas sejam reunidas apenas no final.

### Aura Redirecionadora, aprofundamento sem alteração de produto

Livro p.177: pagar 2 PE antes de atacar com projétil/arremesso. Se errar,
outra rolagem contra criatura a até 6 m do primeiro alvo, com bônus de
1 + metade de AU. Destreza 16 é requisito. O catálogo reproduz a cláusula
e o derive disponibiliza a Aptidão válida. Arco, pistola e azagaia possuem
linhas nativas elegíveis. A lança Arremessável ainda é linha corpo a corpo,
sem modo nativo de arremesso, não declarar todo ataque dela como projétil.

CL1 já fornece cobrança e pendência consumida por declaração, o rolador
pode preservar a arma e repetir os dados. `resolveAtaque` pode verificar a
falha contra o primeiro alvo. Entretanto, confirmar o primeiro ataque já
produz eventos e conta sua sequência. Criar outro id para a nova rolagem
repetiria a declaração, enquanto reescrever o primeiro antes de confirmar
descartaria seus eventos. A regra não explicita essa interação, sobretudo
quando a primeira tentativa é um desastre que permite uma reação.

Veredito: questão material para o final, sem nova pergunta agora conforme
o autor pediu. Definir se apenas o resultado final gera os eventos, ou
se a primeira falha conta para o primeiro alvo e mantém seu desastre.
Não introduzir uma segunda ação, gasto duplicado de munição ou eventos
inventados. Não há implementação nova dessa família por esta passagem.
O problema não é ausência de rolagem, custo ou número no Motor, mas o
contrato de consequências da tentativa anterior ao mudar o alvo.

### Imunidade a movimento forçado, diagnóstico antes de editar

| Parcela | Fonte | Evidência atual | Veredito |
|---|---|---|---|
| PV temporários da Terra | p.76 | `beneficiosPvTemp` e `registraPv` concedem a reserva nativa por rodada, com fonte e salvamento. Compartilha a reserva com Terra do Ápice | Falso positivo de ausência, preservar |
| Terra, não ser movido à força | p.76 | Fichas de nível 12, Inato, Combatente, Assumir Postura e escolha Terra válidas em Player/Afty. Fortitude e PV temporários calculados, mas `deslocaAlvoTalento` move o alvo 3 m após acerto real de Concussão | Corrigir |
| Barreira Inamovível | p.121 | `recursosDeEspecializacao` publica o sinal, mas os consumidores de movimento de CX3 não o leem. O efeito não tem canal no Motor | Corrigir a integração, preservar as demais cláusulas |
| Terra do Invencível sob o Sol | decisão das oito posturas, p.76/alto nível | O estado de combate já publica a imunidade do Ápice, mas os mesmos consumidores não a consultam | Corrigir a integração |

Prova anterior à alteração: `probe-imunidade-antes.txt`, na auditoria CX3.
Derivação e confirmação reais, sem modificar Defesa, orçamento ou requisitos.
O menor desenho é um sinalizador no Motor, com fontes de Terra, Barreira
e Terra do Ápice, consumido nas operações de conteúdo existentes. Não criar
condição artificial nem alterar o núcleo de dano ou de concentração.
Empurrar, Chicote, Concussão e críticos de Bastão/Haste devem recusar o
deslocamento antes de gastar ação, limite ou aplicar efeitos secundários.
Derrubar sem deslocamento e movimento voluntário continuam seus percursos.
Revalidar a imunidade ao concluir uma disputa que já foi rolada. Não alterar
o derive, temporariamente liberado para CX6, nem a concessão manual de PV.

O aprofundamento da p.76 confirmou outra cláusula independente: ser
derrubado ou incapacitado encerra a postura. `defineCondicoes` hoje grava
Caído sem encerrar os dois espaços, e a sessão antiga recarregada conserva
essa postura. É necessário limpar somente `postura` e `postura2` no escritor
existente de condições e na leitura da sessão. O Ápice é outro estado,
conservado. Isso evita que levantar restaure a postura encerrada, sem
inventar outro relógio ou interferir no PV temporário já concedido. Ação,
usos e duração geral da ativação continuam sendo uma parcela separada.

Implementação concluída nessa parcela: canal `imunidadeMovimentoForcado`
no grupo Defesa, com fontes separadas de Terra, Barreira e Terra do Ápice.
Valor positivo é sinalizador, não distância nem RD. A coleta desse canal
recusa origem inacessível e o segundo espaço exige Mestre disponível.
A permissão publicada em `recursosDeEspecializacao` revalida o acesso
atual ao Ápice, preservando outra fonte independente. O remendo de Addon
que retira o efeito é respeitado. Não muda os demais canais por causa
de uma habilidade inacessível, nem revalida globalmente o Motor.

Os clientes de Chicote/Concussão, Briga Empurrar, Escudo e críticos de
Bastão/Haste recusam o deslocamento antes de ação, quota, sorteio,
concentração ou efeitos secundários. Disputa já rolada é revalidada na
conclusão. Ataque principal e dano confirmado são conservados. Derrubar
sem movimento continua permitido. O escritor `defineCondicoes` e a leitura
de sessão limpam ambos os espaços normais quando entra Caído ou uma das
condições nativas de incapacitação. Remover a condição não os restaura.
Ápice e PV temporário concedido não são apagados. Ação/usos e duração
gerais da postura permanecem em aberto, sem nova máquina de estados.

`t-cx3-imunidade-movimento.mjs`: 150 verificações em Player/Afty, escolhas,
nível, segundo espaço, Imitação válida, Ápice sem postura aprendida,
recusa de cópia fora do pool nativo, fontes, Addon e sessão antiga.
Inclui cada consumidor, recusa antes da cobrança, disputa salva e
revalidação antes de dano/Caído do Escudo. Núcleos de combate (328),
vida (316), virada/registro G2 (57), Fortuna (128) e ordem (50) aprovados.
Suíte completa 285/287, somente as duas falhas G00 já documentadas.
Total próprio: 18 arquivos e 2.422 verificações.

Navegador: oito fichas clássica/G2 e quatro percursos no Encontro,
Player/Afty e 1440/390. Adição/retirada real de Caído na ficha usa Buffs
clássica e o registro de condição nos Efeitos G2, sem recorrer à apresentação
anterior. No Encontro, ataque e dano reais, Concussão/Escudo recusados
com aviso e sessões intactas, queda/retirada, reload e Concussão permitida
após encerrar a postura. Captura de 390 inspecionada, sem transbordamento.
Evidências `browser-imunidade.txt`, `browser-imunidade-resultados.json`
e capturas na auditoria CX3. Lint Afty e build aprovados. Sete localizações
individuais de fonte acrescentadas, total 76. A do Ápice localiza apenas
a imunidade de Terra na p.76 e a decisão das oito posturas, não o restante
do Ápice no livro. Nenhuma aprovação ou reconciliação global foi produzida.

### Entrada e duração das posturas, diagnóstico antes de editar

| Parcela | Fonte | Evidência atual | Veredito |
|---|---|---|---|
| Entrar em postura | p.76 | Escolha e estado nativos, contador de Assumir Postura com máximo BT e recarga já cadastrada. Falta operação que gaste a ação bônus e esse mesmo contador | Ligar a CL1, preservar o contador existente |
| Um minuto e troca de postura | p.76 e rodada de seis segundos p.291 | `usa` já renova o uso com dez rodadas, escreve os estados e desfaz ambos ao encerrar | Implementar cliente, sem novo relógio |
| Mestre da Postura | p.75 | Habilidade e escolhas existentes, segundo espaço na bancada, sem entrada conjunta por um uso | Permitir duas posturas distintas com Mestre acessível |
| Caído/incapacitação | p.76 | Escritor e leitura de sessão corrigidos na parcela anterior | Consumir o término existente |
| Cópias temporárias de Imitação | p.118/121, fluxo nativo | A concessão temporária e a troca de cópia já têm operação e prazo próprios | Preservar esse percurso, não transformar cópia em uma nova postura própria de um minuto |
| Tempestade no alvo | p.76 | Há confirmação de arma com alvo, mas CL1 não possui efeito de condição com desfazer vinculado ao uso e prazo de outro participante. Pacotes para Aliados tratam as condições como texto de mesa | Dependência de ciclo de condição no alvo, não criar motor paralelo |

Menor desenho: um cliente de `usa` para as posturas próprias, com estados
`postura` e `postura2`, ação bônus, usos do derivado, dez rodadas e renovação
ao trocar. Seleções e requisitos vêm do resolvedor e do catálogo atuais.
Não alterar a recarga preexistente nem habilitar cópias temporárias como
pega permanente. A tela fica dentro de Assumir Postura e compartilha o
resultado/contador com clássica, G2 e Encontro. Sem editar o derive.

Correção do diagnóstico ao inspecionar os controles G2: `g2-preparo` e
`operacoes.aplicaEstados` já descontam o contador em Ativar. A falta é a
ação e o prazo, não o contador desse percurso. A entrada G2 deve chamar
o mesmo cliente, sem segundo débito. No corte intermediário, o Ajustar preservou o comportamento manual
enquanto a decisão sobre a troca estava pendente. Esse limite foi superado
pelas respostas de 06/11 e a integração abaixo.

Preparação Rápida (p.72), acessível inclusive por concessão nativa, troca
a ação bônus da entrada por ação livre. A exceção de não cancelar por
empurrão foi confirmada pelo autor em 06/11, conforme integração abaixo.


### Sintonização Vital, diagnóstico antes de editar, 06/11

| Parcela | Fonte/decisão | Evidência atual | Veredito |
|---|---|---|---|
| Cura original e destinatário | Livro p.107, autor: metade antes do teto de PV | `usaCuraConteudo` calcula a cura e aplica o teto com `aplicaCura`, mas não conserva um recibo tipado de cura com o aliado destinatário | Acrescentar o recibo no mesmo percurso, sem nova rolagem |
| Segunda cura, 3 PE e alcance | p.107, autor: parte da cura, sem outra ação | O callback de alvo do Encontro já transaciona a sessão do Suporte e um destinatário. Permite concluir a segunda cura pelo registro da primeira, inclusive no próprio Suporte | Consumir CL1 para custo e CL2 para PV, vincular ao evento original e impedir repetição |
| Feitiço de cura e outras concessões | p.107, dependência de CX4 | Não há ativação de Feitiço com recibo confirmado de cura e destinatário neste cliente. Uma rolagem manual não prova cura aplicada | Não aceitar dados avulsos, manter essa integração dependente do provedor real |

A operação conserva o valor original anterior ao teto de PV, o valor efetivamente recuperado, a identidade do aliado e a ação/rodada. O segundo destinatário precisa ser diferente do primeiro e estar em 3 m, confirmado pela mesa. A segunda cura não gera outro gatilho de Sintonização Vital. Não acrescentar ação, conforme decisão do autor.


### Posturas, integração das decisões de 06/11

Entrar usa Ação Bônus, ou Livre com Preparação Rápida acessível, e um uso do contador nativo. Trocar diretamente gasta outra ação de entrada e outro uso, reiniciando dez rodadas. Mestre permite duas posturas distintas na mesma entrada. Inverter os espaços ou selecionar somente posturas já ativas não gera novo uso. A recarga preexistente e seus remendos continuam válidos.

`assumePosturaConteudo` é chamado pelo controle da Habilidade e por `operacoes.aplicaEstados` no Ativar/Ajustar G2. A transação G2 não chega ao débito antigo depois da chamada, portanto não cobra duas vezes. O plano da troca mostra o uso adicional antes de confirmar. A leitura de detalhes do G2 mostra as rodadas de CL1 e reconhece seu encerramento automático. Controles manuais de estado e bancada continuam manuais. Não há promoção do G2.

Empurrar efetivo de Briga, Escudo ou crítico de Bastão encerra os dois espaços e o uso nativo, salvo Preparação Rápida. Resistir ou escolher zero metros no Bastão conserva a postura. Haste diz apenas que o alvo é movido, p.308, não Empurrar, e conserva essa distinção. Caído ou incapacitação sempre encerram as posturas normais, mesmo com Preparação Rápida. O Ápice, a concentração independente e PV temporário já concedido são conservados.

Validação: `t-cx3-posturas.mjs`, 200 verificações, e regressões de imunidade 150, sessão G2 52 e ordem dos módulos 50. Navegador: oito fichas clássica/G2 e quatro percursos no Encontro, Player/Afty, 1440/390, com Ativar G2 nativo, Mestre, troca, prazo, reload e expiração. Mais oito percursos de Briga Empurrar no Encontro, com e sem Preparação Rápida, preservando contador e concentração. Logs `browser-posturas-final.txt` e `browser-postura-empurrar.txt`, capturas e resultados na auditoria CX3. Suíte completa no corte anterior à Sintonização: 286/288 arquivos, somente G00.

### Sintonização Vital, integração de 06/11

O cliente de cura conserva `contextoCura` no resultado realmente aplicado: origem, operação, valor anterior ao teto, recuperação efetiva, aliado destinatário e contexto de turno. `curasParaSintonizar` aceita somente esse recibo atual, vinculado à operação, ainda não consumido. A conclusão paga 3 PE segundo a política nativa, sem outra ação, e usa `aplicaCura` para metade do valor original, com piso e teto próprios do segundo destinatário. Pode ser o Suporte, ou outro combatente diferente do aliado original, em 3 m confirmados. Não lança dados de novo, não cura morto, não consome recursos do destinatário e não cria cascata. A marca no evento original impede repetir depois de salvar.

Verificação: `t-cx3-sintonizacao.mjs`, 76 verificações, incluindo cura 20/recuperação 6/segunda cura 10, recusa sem custo, ausência da Habilidade, nível, troca de turno, rolagem avulsa e persistência. Navegador: oito fichas clássica/G2 e quatro percursos reais no Encontro, Player/Afty, 1440/390. O Encontro incluiu curar o aliado pela tela, declarar aliado, pagar a Sintonização, curar terceiro ou a própria ficha sem outra ação e reler a sessão. Capturas inspecionadas sem estouro horizontal. Logs `browser-sintonizacao.txt` e resultados/capturas na auditoria. Regressões de operações 284, classes 614, regeneração 164 e Incitar Vigor 56 aprovadas. Duas fontes individuais localizadas, total CX3 78, sem aprovação ou reconciliação global.

O provedor de cura por Feitiço e outros procedimentos não integrados ainda precisa publicar o mesmo recibo de cura aplicada. A tela não aceita rolagem manual como prova. Esta limitação mantém a família de cura do lote aberta. Corte próprio atual: 20 arquivos, 2.698 verificações.


### Aura Redirecionadora, diagnóstico antes de editar, 06/11

| Parcela | Fonte/decisão | Evidência atual | Veredito |
|---|---|---|---|
| Imbuir antes de atacar | p.177, autor: 2 PE sem outra ação | Catálogo/requisito de Destreza e rolador de arma existem, sem operação da Aura. `prepararRolagem` confere os bloqueios reais antes de cobrar | Cliente de CL1, pagamento e primeira rolagem nativa |
| Falha contra A e nova tentativa contra B | p.177, autor: a primeira falha mantém gatilhos e conta para A | `confirmaAtaqueConteudo` e CL1 já conservam cada confirmação e a sequência do destinatário. Não há contador separado de ataques realizados em CL1 | Conservar a confirmação inicial, gerar outra rolagem vinculada a ela e confirmar B pelo mesmo consumidor |
| Mesmo projétil, munição e dano | p.177, propriedades nativas | `registraRolagemArma` avança número e munição em toda nova jogada. Reutilizá-lo na segunda jogada gastaria outro disparo. O dano usa o acerto pendente da arma | Extensão estreita no módulo existente de propriedades para substituir somente o acerto pendente, conservando número, gasto e emperramento |
| Arma corpo a corpo com Arremessável | catálogo real e p.307 | A linha da lança permanece corpo a corpo, sem modo separado de arremesso | Não tratá-la como projétil por ter apenas a propriedade, depende da linha real de ataque arremessado |

O segundo alvo precisa ser diferente do primeiro e estar a 6 m dele, declarado pela mesa. A conclusão exige falha efetivamente confirmada, Aura paga antes da primeira jogada e a mesma arma/turno pendente. Não aceitar ataque anterior à ativação nem terceira tentativa. A nova jogada não passa novamente pelo registro que gasta munição. Eventos da primeira falha não são apagados. O dano da nova jogada mantém a fonte e o resultado crítico nativos.


### Aura Redirecionadora, integração de 06/11

O preparo nativo verifica a arma real antes de pagar 2 PE e rolar. O autor confirmou ausência de outra ação. A primeira jogada usa o mesmo rolador e registro da arma. Depois de confirmar a falha contra A, redirecionar exige o mesmo projétil pendente, Aura disponível e B diferente em 6 m de A. A nova jogada soma 1 + piso(AU / 2), preserva o modo e a margem originais, tem identidade própria e vínculo com a primeira. Não há terceira tentativa.

`redirecionaRolagemArma`, extensão estreita no módulo existente de propriedades, substitui somente o acerto pendente e a identidade da última jogada. Número de ataques, munição gasta, emperramento e outros estados da arma permanecem. Assim o dano pode usar a segunda jogada, mesmo quando a pistola emperrou no primeiro desastre, sem outro disparo. Não foi criado contador paralelo. O registro de A, desastre e sequência de ataques recebidos são preservados, conforme decisão do autor. B recebe sua própria confirmação pelo consumidor de CL1/CL2 existente. Crítico/abate de B continuam passando pela Renovação pelo Sangue nativa, incluindo a diferença de concessão entre Player/Afty.

A reprodução com Azagaia confirmou outra falha do adaptador existente: ele enviava a categoria de arma `arremesso` diretamente a `resolveAtaque`, que só aceita `corpo`, `distancia` e `amaldicoado`. O cliente agora traduz arremesso para a categoria de jogada `distancia`, como `ataqueDaArma` já faz no equipamento, sem alterar CL1 nem o derive reservado a CX6. Lança corpo a corpo não é convertida em projétil por ter Arremessável.

Validação: `t-cx3-redirecionadora.mjs`, 220 verificações, arco/pistola/azagaia em Player/Afty, custo/política manual, desastre, camuflagem, sequência A/B, acerto de primeira, nova falha em B, bônus, crítico/dano nativo, munição/estado único, recusas, turno atual e persistência. Propriedades 158, manobras 138, mobilidade 82, Sentinela 92, CL1 combate 328 e ordem 50 aprovados. Navegador: oito fichas clássica/G2 e quatro percursos de Encontro, Player/Afty e 1440/390, imbuir pela tela, confirmar A, redirecionar/rolar dano/confirmar B e reload. Capturas de 390 inspecionadas sem estouro horizontal. Logs e resultados `browser-redirecionadora*` na auditoria.

Suíte completa atual: 288/290 arquivos, somente reconciliação e classificação G00. Lint Afty e build aprovados. Fontes específicas CX3 agora 82, sem aprovação/reconciliação global. Corte próprio: 21 arquivos e 2.918 verificações. As questões de Aura estão encerradas. O lote continua aberto para o restante do escopo e provedores/decisões já registrados.


### Ação Ágil, diagnóstico antes de editar, 06/11

| Parcela | Fonte | Evidência atual | Veredito |
|---|---|---|---|
| Escolha e custo | p.55 (Lutador), p.119 (Restringido) | As duas Habilidades existem, sem acionamento nos clientes de classe. `usa` já cobra 2 PE/Estamina e limita por rodada/turno | Cliente restrito a Andar, Desengajar e Esconder, sem criar ação comum extra |
| Cadência | p.55/119 | O Lutador escreve uma vez por rodada, o Restringido escreve por turno. CL1 oferece ambas as cadências | Preservar o texto de cada Habilidade e o identificador de origem acessível |
| Andar | p.303 | Movimento e fontes já são derivados. Não há mapa de posições | Validar a distância declarada contra Movimento, registrar o deslocamento |
| Desengajar | p.301 | CL1 tem fimDoTurno. Os clientes de oportunidade já consultam uma proteção no alvo antes de cobrar e ao confirmar | Uso nativo até o fim do próprio turno, bloqueando somente oportunidade |
| Esconder | p.302/297 | Furtividade e rolador nativos existem. Posição/visibilidade dependem da mesa | Rolar Furtividade com a ação adicional. Não declarar Escondido automaticamente sem resolver as criaturas observadoras |

A operação realiza uma das três ações no próprio turno e gasta somente o recurso da Habilidade. Não concede saldo genérico nem um segundo contador de ações. Desengajar não impede a reação distinta de Sentinela. Requisitos, falha de pagamento e incapacidade são conferidos antes de qualquer dado ou alteração.

Aprofundamento da combinação de Ações Ágeis: a p.365 impede receber o efeito de duas Habilidades iguais ao mesmo tempo. Portanto, Lutador e Restringido não podem dar duas ações adicionais por terem ids diferentes. O cliente usa uma identidade comum de uso, escolhendo a cadência mais favorável acessível e marcando os dois limites nativos de janela (rodada/turno). Isso também impede obter outro uso ao trocar a origem da concessão no mesmo turno. Não cria saldo de ações ou cronômetro paralelo. A restrição de energia do pool de Roubo continua sendo a decisão anterior, sem alteração.


### Ação Ágil, integração de 06/11

O controle está dentro das duas Habilidades, preservando 2 PE/Estamina e a cadência de Lutador por rodada ou Restringido por turno. Realiza apenas Andar, Desengajar ou Esconder no próprio turno, sem conceder saldo genérico nem consumir/devolver ações comuns, bônus ou de movimento. Andar confere a distância contra o Movimento derivado e registra sua fonte. Esconder rola Furtividade nativa, com modo, extras e mínimo, ainda permitindo Sorte, sem aplicar condição de posição sem observadores. Desengajar tem um uso de CL1 até o fim do turno e bloqueia oportunidades no preparo e novamente na confirmação, sem impedir a reação distinta de Sentinela.

A identidade `acao_agil` compartilha os limites nativos de turno/rodada entre as duas Habilidades de mesmo nome. A cadência melhor disponível é a do Restringido, conforme p.365. Ganhar ou perder a origem da concessão no mesmo turno não devolve o uso. A prova combinada usa Alma Livre nativa, liberada explicitamente por Addon no Player, sem alterar o filtro ainda pendente de Roubo. Não há novo contador de ações.

Na revisão dos clientes sem ação adicional, foi ligado o portão vital de CL2 em Ação Ágil, Aura Redirecionadora e Sintonização Vital: morto ou Morrendo não ativa, preservando a exceção de Mesmo Morto. Essa verificação ocorre antes de custo e dados. Não se acrescentou uma ação base para forçar o portão. Testes de Sintonização agora 80 e de Aura 244, com regressões dos casos já verificados.

Validação de Ação Ágil: 169 verificações, requisitos/orçamento, três comandos, cadências distintas, concessão combinada, fonte dinâmica, custos/recusas, ações normais esgotadas, Sorte, proteção, persistência e término. Navegador: 16 fichas clássica/G2 e oito Encontros, Player/Afty, Lutador/Restringido, 1440/390. Os três comandos foram exercitados, com quota/custo, reload, Desengajar barrando oportunidade sem gastar reação e liberação no fim do turno. Capturas de 390 inspecionadas. Logs e resultados `browser-acao-agil-final*` na auditoria. Lint Afty e build final aprovados, ordem 50, fontes 24, CL2 vital 316, propriedades 158 e G2 virada 57. Quatro fontes localizadas, total CX3 86. Corte próprio atual: 22 arquivos, 3.115 verificações.


### Especialista em Cortes, diagnóstico antes de editar, 06/11

| Parcela | Fonte | Evidência atual | Veredito |
|---|---|---|---|
| Atributo e nível de dano corpo a corpo | p.167 | Escolha do atributo e `nivelDano` no escopo corpo/ct existentes | Preservar |
| Redução opcional após infligir dano cortante | p.167 | Acerto real com Espada Curta e escolha válida em Player/Afty, dano cortante final 14/43, sem consumidor da redução | Ligar o recibo tipado de dano à operação, sem reduzir por acerto absorvido |
| Uma vez por turno | p.167 | CL1 tem contador nativo. O Encontro já publica identidade/sequência do turno em curso | Limitar pelo turno realmente em curso, incluindo ataque fora do próprio turno |
| Até o começo do próximo turno de quem cortou | p.167 | Há início de turno e encerramento de uso nativos. O alvo não pode usar seu próprio início como prazo | Adaptador de conteúdo encerra a instância vinculada ao emissor, sem outro relógio |
| Cópias do mesmo benefício | p.365 | `grupoNaoAcumula` já funciona no Motor. `efeitosDaSessao` não o encaminha. Duas instâncias CL1 com esse metadado resultam em -9 m, quando deveriam competir | Encaminhar o grupo existente, conservar instâncias/prazos separados e outras fontes de Movimento |

Reprodução anterior: `probe-cortes-antes.mjs/json`, auditoria CX3. O ataque continua sem redução automática porque o benefício é opcional, o achado é a falta da operação. A segunda reprodução isola a passagem do metadado de agrupamento em Buffs de Mesa nativos, sem afirmar que o consumidor do Talento já existia. Não restringir a cláusula opcional a corpo a corpo, pois essa restrição aparece no nível de dano da frase anterior. Não confundir redução numérica de Movimento com deslocamento forçado.

Nota sobre a evidência de Cortes: a reexecução da sonda após o patch sobrescreveu seu JSON anterior. Os valores do corte anterior foram recuperados da saída observada no chat, com essa proveniência explícita no arquivo. A saída posterior e as próximas execuções usam `probe-cortes-depois.json`. Player passou de duas reduções somadas (Movimento 0) para uma (4,5), Afty de 4,5 para 9, preservando as bases diferentes 9/13,5. O primeiro ataque real continuou com dano cortante 14/43.

### Especialista em Cortes, integração de 06/11

`aplicaCorteConteudo` consome a confirmação real do ataque contra o alvo, no turno global em curso, com dano cortante final positivo. A operação não usa o dano bruto ou apenas a perda de PV: absorção por PV temporário conta, redução que zera todo o cortante não conta, mesmo que outro tipo cause dano. A redução é opcional, sem nova ação ou custo, limitada uma vez por turno real, incluindo reação fora do próprio turno. A parcela de atributo e nível de dano corpo a corpo existente foi conservada. Ataque arremessado com tipo cortante realmente configurado também pode aplicar a cláusula opcional.

O uso de CL1 no alvo guarda o emissor e possui Buff/desfazer nativos. O controlador do Encontro encerra apenas as instâncias desse emissor antes de começar seu próximo turno. Começar o turno do alvo ou forçar nova rodada não encerra prematuramente. Remover o emissor e encerrar combate limpam o efeito. Não há outro contador de rodadas. `efeitosDaSessao` passa o metadado `grupoNaoAcumula` ao Motor, que já resolve a competição. Duas origens mantêm instâncias e prazos, mas reduzem só 4,5 m. O metadado é anotado no Buff real com `comBuff`, sem reconstruir CL1. Sentinela e outras origens distintas ainda somam suas parcelas. A redução numérica não desloca o alvo nem cancela Terra.

Validação: `t-cx3-cortes.mjs`, 90 verificações em Player/Afty, origem/nível/escolha/orçamento válidos, dano/absorção/escopos, condições, limite, reação, persistência, dois emissores, início/remoção/fim reais do redutor, arma arremessada cortante, Terra e Sentinela. Regressões: Sentinela 92, Mobilidade 82, Ação Ágil 169, imunidade 150, G2 sessão 52, ordem 50 e delta de Buffs 10 aprovadas. Navegador: oito fichas clássica/G2 e quatro Encontros, Player/Afty e 1440/390. Os dois emissores atacam/confirmam/aplicam pela tela, reload mantém as instâncias e o turno de cada emissor encerra somente a sua. Capturas de 390 inspecionadas sem transbordamento horizontal. Evidências `browser-cortes*` na auditoria CX3.

Suíte completa: 290/292 arquivos, somente reconciliação e classificação G00. Lint Afty e build aprovados. Dez fontes individuais localizadas, total CX3 96, sem aprovação/reconciliação global. Corte próprio: 23 arquivos e 3.205 verificações. O restante do lote continua em andamento.

### Postura da Lua, diagnóstico antes de editar, 06/11

| Cláusula | Fonte/evidência atual | Veredito |
|---|---|---|
| +3 Defesa, -4 ataque, retirar atributo do dano | p.76, efeitos existentes e reprodução válida Combatente 12 Player/Afty | Preservar |
| Andar/Desengajar como Ação Livre | p.76, não há cliente. CL1 já gasta a Livre com identidade por ação e rodada. Desengajar já tem consumidor no conteúdo | Ligar as duas ações à postura acessível, sem PE ou saldo extra |
| Movimento e oportunidade | p.301/303, Movimento derivado com fontes e proteção por fimDoTurno existentes | Validar distância, registrar Andar e reutilizar o uso nativo de Desengajar |
| Reação reduzindo dano recebido pelo nível | p.76, confirmação atual já aplica CL2. Alterar o histórico depois não recompõe reserva/vida/Alma | Manter dependência de janela prospectiva de reação |

Reprodução admissível `probe-lua-antes.mjs/json`: Combatente Inato 12, duas posturas aprendidas, sem excesso de Habilidades/testes e sem inacessíveis, Player/Afty, Movimento 9/13,5. Fonte de Lua já existe no Motor. O menor desenho para as ações livres é um cliente de `usa`, com ids distintos de Andar/Desengajar e o saldo nativo de ações livres, sem editar o derive reservado a CX6. A escolha acessível, o segundo espaço de Mestre e a concessão das oito posturas do Ápice precisam ser revalidados antes do uso.

Decisão do autor de 06/11: Provocação Desafiadora recupera seus usos de Ação Livre em descanso longo. Essa questão está encerrada, não implica que o teste oposto, a obrigação de atacar e os modos por alvo já estejam integrados.

### Postura da Lua, ações livres integradas em 06/11

`posturaAtivaConteudo` consulta as escolhas resolvidas e seus pais acessíveis, incluindo a definição de Imitação e o segundo espaço somente com Mestre. O Ápice é revalidado pelo avaliador nativo de Alto Nível e concede Lua mesmo sem a postura aprendida, conforme decisão das oito posturas. O cliente não edita `afty-derive.js`, ainda liberado para CX6, nem aplica uma regra pela rota.

`usaAcaoLuaConteudo` realiza Andar ou Desengajar no próprio turno, com Ação Livre nativa obrigatória e identidade distinta por comando. Conserva a leitura por rodada de CL1 para a mesma Livre, p.300, sem novo contador, PE ou ação normal. Andar registra a distância até o Movimento derivado e suas partes. Desengajar tem uso de CL1 até o fim do turno, sem conceder movimento. O consumidor já existente recusa oportunidade antes de cobrar reação e novamente ao confirmar. A reação distinta de Sentinela continua permitida. O fim da postura não desfaz uma ação Desengajar já realizada. Não foi implementada a reação da Lua que reduz dano, pois ela precisa anteceder a aplicação de CL2.

Validação: `t-cx3-lua.mjs`, 92 verificações de origem/nível/escolha/orçamento, recusas, gasto nativo de Livre, recuperação, fontes, duas ações distintas, salvamento, proteção e término, Mestre no nível válido, Imitação e Ápice com contraprovas de acesso. Regressões de posturas 200, Ação Ágil 169, Sentinela 92 e ordem 50 aprovadas. Navegador: oito fichas clássica/G2 e quatro Encontros, Player/Afty e 1440/390, com entrada em Lua, duas ações pela tela, repetição recusada, salvamento, oportunidade recusada sem reação e permitida após o fim do turno. Capturas de 390 inspecionadas sem transbordamento horizontal. A sonda de tela foi corrigida para esperar a persistência, após o estado já aparecer na tela, antes de comparar ações salvas. Não houve mudança de produto por essa espera.

Suíte completa `asserts-lua.txt`: 291/293 arquivos, somente reconciliação e classificação G00. Lint Afty e build aprovados. Sete fontes individuais localizadas, total CX3 103, sem aprovação/reconciliação global. Corte próprio: 24 arquivos e 3.297 verificações. Evidências `browser-lua*`, `build-lua.txt`, `lint-lua.txt` e `probe-lua-antes*` na auditoria CX3. O lote continua em andamento.

### Postura do Dragão, diagnóstico antes de editar, 06/11

| Cláusula | Fonte/evidência atual | Veredito |
|---|---|---|
| Ataque sob Dragão | p.76, escolha e postura existem. Reprodução válida Combatente Inato 12, Player/Afty, acerto confirmado com dano cortante final 11/34, sem consumidor secundário | Ligar o recibo, registrar a postura no pedido original para não aceitar ataque anterior à entrada |
| Inimigos a 1,5 m do alvo original | p.76, Encontro já transaciona um alvo por operação e declara alcances | Resolver cada inimigo declarado, sem mapa nem segundo ataque |
| TR de Fortitude | p.76, rolador e CD atuais já existem, CD separada continua adiada | Rolar na sessão do inimigo, concluir depois das rerrolagens |
| Metade do dano recebido pelo alvo original | p.76, confirmação contém instâncias de dano final por tipo. CL2 aceita essas instâncias com defesas e concentração | Consumir o dano confirmado e aplicar pelo núcleo, sem sortear outro dano nem reduzir novamente o alvo original |
| Concessão das oito posturas | decisão de 12/09, avaliador nativo de Ápice e cópia de Imitação existentes | Reutilizar o acesso de postura conferido na Lua, sem alterar o derive |

Evidência `probe-dragao-antes.mjs/json`, auditoria CX3. A sonda deriva do percurso real usado na reprodução de Cortes, trocando a concessão pela escolha válida de Dragão. O menor desenho acrescenta somente um marcador de postura ao contexto do pedido nativo e um cliente em duas etapas sobre `usa`, rolador e `aplicaDanoRecebido`. Cada par ataque/inimigo é resolvido uma vez, o turno original é revalidado e a resolução não gera outro ataque recebido ou crítico. Provedores sem recibo de ataque confirmado continuam uma integração separada.

### Ponto de retomada, 07/11, 09:30 no horário de São Paulo

O usuário pediu a pausa e autorizou uma retomada única neste chat. Novas perguntas aguardam seu aviso de que acordou. Provocação Desafiadora já tem decisão de descanso longo. Atacar e Recuar, a lacuna de Pular e o prazo de Absorção Elemental continuam aguardando resposta.

Dragão está em validação. O marcador no pedido, as duas etapas do cliente e os controles já estão no workspace. A primeira execução aprovou 68 verificações de Dragão, 128 de Fortuna, 190 de Investida e 50 de ordem. Build e lint dessa versão têm logs `build-dragao.txt` e `lint-dragao.txt`. Depois disso, `AftyEncontro.jsx` passou a oferecer os conflitos reais por tipo, o controle passou a aceitar o desempate da mesa e o cliente ganhou uma recusa para dano de Energia Reversa em alvo secundário de outra origem. Esse último ajuste ainda precisa de teste e revisão de escopo. A reação de redução de dano da Lua segue dependente da janela prospectiva.

Ao retomar, conferir o trecho final de Dragão com dano misto, Energia Reversa, mais de um inimigo, ataque fora do turno e origens de postura. A leitura em implementação divide cada instância tipada do dano final original antes de aplicar as defesas do secundário. Fazer o navegador no build atual, rodar a suíte e atualizar a matriz e as fontes. O último corte concluído permanece o da Lua, 24 arquivos próprios e 3.297 verificações. `afty-derive.js` continua liberado para CX6.

### Postura do Dragão, verificação em 07/11

O pedido nativo registra se o ataque foi feito em Dragão. A confirmação
vincula rodada, turno, alvo original e dano efetivamente recebido. No
Encontro, escolhe-se cada inimigo próximo, rola-se sua Fortitude e resolve-se
após eventuais rerrolagens. O sucesso encerra sem dano. Na falha, as metades
por tipo preservam o total arredondado da metade e passam pelas defesas e
concentração de CL2 do destinatário. Quando duas ou mais parcelas ímpares
deixam uma escolha de tipo para o resto, a conclusão fica com a mesa.
A falha com parcela de Energia Reversa em secundário de outra origem também
fica com a mesa. O TR permanece registrado e as recusas não aplicam dano parcial.

`t-cx3-dragao.mjs` passou 87 verificações em Player/Afty, incluindo reação
fora do turno, Imitação, Ápice, múltiplos inimigos, acerto misto real com
Canalização Reversa, defesas, repetição, rerrolagem e salvamento. O navegador
validou oito fichas e quatro Encontros em 1440/390, com gravação entre o TR e
a conclusão e alteração de PV somente no secundário. Evidências em
`browser-dragao.txt` e `browser-dragao-resultados.json` da auditoria CX3.
Ordem 50, lint Afty e build aprovados. Suíte 292/294, com as duas falhas
conhecidas de reconciliação e classificação de G00. Corte próprio de 25
arquivos e 3.384 verificações. Sete fontes da postura localizadas, total 110.

### Cura em Grupo, diagnóstico antes de editar, 07/11

Livro p.191. A linha `cura_energia_reversa` já publica o teto ampliado e o
rótulo Grupo. `usaCuraConteudo` aplica imediatamente a um único destinatário.
Não existe divisão de uma mesma rolagem. O Encontro possui `PATCH_SESSOES`
atômico e já usa esse redutor para a operação de dois combatentes.

Usar a linha e os dados atuais para uma rolagem paga, com todos os
destinatários declarados no alcance 4,5 + 1,5 × ER. A mesa informa parcelas
inteiras cuja soma conserva o total, inclusive eventual sobra. O Livro não
determina quem fica com a sobra nem descreve um algoritmo de divisão.
Validar o grupo todo antes de aplicar cada parcela pelo núcleo vital.
Registrar identidade e turno da rolagem, sem novo contador ou relógio.

### Cura em Grupo, verificação em 07/11

O Encontro valida o grupo declarado, registra uma Ação Comum e debita 2 PE
por PER pela linha nativa. A rolagem fica pendente no histórico com o turno e
as identidades dos destinatários. As parcelas informadas devem somar o total
da cura antes de Herança Maldita e do teto de PV. `PATCH_SESSOES` aplica
em conjunto as sessões validadas e preserva as sessões em caso de conflito.
O usuário pode incluir o próprio curador quando a mesa o conta no alcance.
O Livro não indica como repartir uma sobra. O painel aceita a distribuição
da mesa e não decide quem a recebe. Sintonização Vital continua vinculada ao
recibo de cura de um destinatário. A interação com Cura em Grupo ficou na fila.

`t-cx3-cura-grupo.mjs` passou 52 verificações. Ordem 50, Sintonização 80,
Operações 284, lint Afty e build aprovados. Navegador de oito fichas e
quatro Encontros, Player/Afty em 1440/390, com três destinatários, Herança,
teto, alcance declarado e persistência entre rolagem e aplicação.
Evidências `browser-cura-grupo.txt` e `browser-cura-grupo-resultados.json`.
Suíte 293/295, com as duas falhas conhecidas de G00. Corte de 26 arquivos e
3.436 verificações. Seis fontes localizadas, total 116.

### Aura Drenadora, diagnóstico antes de editar, 07/11

Livro p.175. Ao matar inimigo, rolar AU d8 + MOD CON em PV temporário,
com acumulação. O catálogo e os requisitos existem. Os clientes de ataque,
Dragão e Escudo já têm a sessão anterior e posterior a `aplicaDanoRecebido`
e sabem se a mesa declarou um inimigo. `abateu` significa reduzir a 0 PV,
inclusive Portas da Morte, e sozinho não comprova que o dano matou.

Consumir a transição vital real para morto uma vez por ocorrência, usando
o pote por fonte da sessão e o rolador nativo. Dano que só derruba, morte
de outra origem e reaplicação do mesmo evento não concedem PV. Operações
sem atribuição de autoria ficam dependentes do provedor de morte.

### Aura Drenadora, verificação em 07/11

`drenaAuraAoMatar` usa as sessões antes e depois do dano atribuído ao
atacante, com identidade do ataque e da vítima. A morte efetiva de inimigo
dispara AU d8 + MOD CON e soma o ganho ao saldo de Aura Drenadora. O dano
subsequente usa o consumo nativo. A reserva e os dados persistem no histórico.
O adaptador está ligado à confirmação, ao Dragão e ao Escudo. Queda sem
morte, alvo aliado ou já morto, Aura concentrada e recibo repetido não disparam.

30 verificações em `t-cx3-aura-drenadora.mjs` e quatro Encontros Player/Afty
em 1440/390, com duas mortes, ganho acumulado e recarga. Ordem 50, build,
lint Afty, Renovação 65, Dragão 87 e Escudo 92 aprovados. Suíte 294/296 com
as falhas conhecidas de G00. Corte de 27 arquivos e 3.466 verificações.
Quatro fontes localizadas, total 120. Provedores sem autoria ainda na fila.

### Pular e salto livre, diagnóstico antes de editar, 07/11

Livro p.303. A tabela de salto e o teste opcional de CD 15 não têm operação
de sessão. Ação de Movimento, rolagem e condição Caído já têm núcleos nativos.
Acrobata troca o atributo da distância e dá opção de Acrobacia no teste.
O salto livre de Saltador depende de aterrissagem junto a parede ou objeto.
Um recibo nativo de uso e rolagem permite finalizar o salto após rerrolagens
e validar esse gatilho. Preservar as faixas do Livro sem extrapolar lacunas.
Separar o bônus de ataque, que exige o alvo antes da rolagem e consumo no
primeiro ataque contra ele, conforme decisão do autor.

### Saltador Constante, diagnóstico antes de editar, 07/11

Livro p.164 e decisões do autor. Um Pular concluído em alcance corpo a
corpo de um alvo permite +2 no acerto e MOD FOR no dano do primeiro ataque
contra ele. Vale para o Pular de Movimento e para o Livre. O Encontro não
tem mapa de posição, então a mesa declara o alvo na aterrissagem. A
confirmação de ataque existente só recebe esse alvo depois da rolagem de
d20. Aplicar o ajuste quando o alvo for conhecido, antes de comparar a
Defesa e sem repetir a jogada ou seu gasto. Mostrar o ajuste na confirmação.
Usar pendência CL1 por alvo, consumida mesmo em erro e encerrada com o
turno do salto. O recibo de aterrissagem separa as jogadas anteriores.
Ataques sem confirmação de alvo continuam fora da cobertura.

### Pular e Saltador Constante, verificação em 07/11

Pular está em Ações durante o combate. Usa Movimento, tabela da p.303,
a mesma distância em altura, teste opcional CD 15 para a faixa superior
e Caído na falha. Acrobata altera o atributo e permite Acrobacia. Físico
Aperfeiçoado, Força Devastadora e Estímulo Muscular aparecem nas fontes.
Estímulo paga 1 PE ao iniciar o salto. O salto pendente sobrevive à
releitura e aguarda a escolha de Sorte. Valores fora das faixas impressas
são recusados antes de consumir ação.

Saltador dá um novo Pular livre pela metade após a declaração de parede
ou objeto, sem encadear saltos livres. Qualquer Pular pode registrar um
alvo em alcance corpo a corpo na aterrissagem do Encontro. O primeiro
ataque confirmado contra o alvo recebe +2 antes da comparação de Defesa,
preservando a rolagem natural. No acerto soma MOD FOR ao tipo-base antes
das defesas. Erro consome a pendência, outro alvo e jogada anterior à
aterrissagem não consomem. A pendência dura até o fim do turno. Duas
aterrissagens antes de uma mesma jogada elegível não acumulam o bônus.
A confirmação com alvo cobre armas e ataque básico. Outros provedores
e ficha avulsa sem alvo não calculam o bônus.

70 verificações em `t-cx3-pular.mjs`. Oito fichas clássica/G2 e quatro
Encontros Player/Afty, 1440/390. A confirmação com 1 abaixo da Defesa acertou
com o ajuste, somou MOD FOR ao dano e consumiu a pendência. A releitura
conservou a distância e o custo do Estímulo. Ver `browser-pular.txt`,
`browser-pular-resultados.json` e capturas. Suíte 295/297, com as duas falhas
conhecidas de G00. Corte de 28 arquivos, 3.536 verificações e 126 fontes.
Retomada das 12h permanece no mesmo chat.

### Provocar e Provocação Desafiadora, diagnóstico antes de editar, 07/11

Livro p.302, p.164 e regra de modos da p.282. A linha em Outros rola
Intimidação avulsa. Não usa Ação Comum, não valida os 9 m, não registra a
oposição escolhida pelo alvo e não gera efeito de combate. O Talento
está no catálogo. O autor decidiu que os usos livres, metade de MOD PRE,
retornam no descanso longo. A sessão atual tem um único botão de descanso
que devolve usos curtos e longos, conforme a decisão existente de 23/09.

Reusar uso CL1 e os testes dos dois participantes, com finalização após
eventuais rerrolagens. O estado deve guardar a fonte e terminar no início
do próximo turno dela. O modo de ataque depende do alvo declarado antes
da jogada e deve compor com outras fontes no rolador existente. A obrigação
de atacar de Provocação Desafiadora será exibida para a mesa. A passagem
de turno ainda depende de definir o que ocorre quando o alvo não consegue
atacar ou tem obrigações simultâneas.

### Provocar e Provocação Desafiadora, verificação em 07/11

No Encontro, Provocar mantém a Intimidação da linha nativa, usa os
9 m declarados e confronta Intuição ou Intimidação do alvo. A disputa
separada conserva a escolha de Sorte e os dois recibos após recarregar.
A Ação Comum ou Livre é registrada em CL1. A versão Livre gasta uma
quota de metade de MOD PRE. O descanso da ficha a restaura e a virada
de rodada não a repõe. O botão único foi preservado.

O efeito fica na sessão do alvo até o próximo turno da fonte. O Encontro
pede alvo antes de rolar, combina a vantagem/desvantagem com as fontes
já existentes e vincula a confirmação. O primeiro ataque confirmado ao
provocador satisfaz a obrigação visível mesmo errando. A mesa mantém
controle da passagem de turno quando o ataque é impossível ou não tem
recibo de alvo. A ficha avulsa mantém o teste simples sem oposição.

64 verificações em `t-cx3-provocar.mjs`, regressões de Cortes 90,
Aura Redirecionadora 244, Pular 70, ordem 50, build e lint Afty.
Quatro Encontros Player/Afty, 1440/390, em `browser-provocar.txt` e
`browser-provocar-resultados.json`. Suíte 296/298, com as duas falhas
conhecidas de G00. Corte de 29 arquivos, 3.600 verificações e 128 fontes.

### Medicina Infalível, diagnóstico antes de editar, 07/11

Livro p.103. O Motor já acrescenta BT em toda cura do usuário. A Base do
Suporte de nível 10 só tem a parcela passiva. Falta a quota de metade do
nível de Suporte mais BT e o uso de um por dado maximizado. As curas
por conteúdo hoje rolam e aplicam imediatamente. Preservar a aplicação
imediata por padrão e oferecer uma escolha de dados da mesma rolagem,
antes da cura efetiva. A seleção atua depois das rerrolagens nativas de
cura e antes de Herança Maldita, do teto de PV e do recibo de Sintonização.
A operação começa pelas curas individuais já ligadas a destinatário.
A Cura em Grupo e as outras origens exigem confirmação de seus contratos.

### Medicina Infalível, verificação em 07/11

O BT fixo segue no Motor. As curas individuais dos clientes de conteúdo
permitem rolar, escolher dados e aplicar. A quota é piso de metade do
nível de Suporte mais BT. A aplicação gasta um uso por dado maximizado,
pode aplicar sem maximizar e usa o mesmo recibo. O destinatário só recebe
PV na conclusão. O total final antecede Herança e teto de PV, e a
Sintonização lê o resultado final da cura individual.

47 verificações em `t-cx3-medicina.mjs`, regressões Sintonização 80,
Operações 284 e ordem 50, build, lint Afty e navegador nas oito fichas
clássica/G2 e quatro Encontros Player/Afty, 1440/390. Curas pendentes
reabertas antes da aplicação e dois dados maximizados, com gasto exato.
Suíte 297/299, com as duas falhas conhecidas de G00. Corte de 30
arquivos, 3.647 verificações e 130 fontes. Fluxo Constante, Cura em Grupo
e as curas sem provedor de alvo continuam na fila.

### Postura da Devastação, diagnóstico antes de editar, 07/11

Livro p.76. O Motor já conhece as duas fórmulas e a pilha manual. A ficha
avulsa ainda depende da mesa para trocar o alvo e registrar acertos. No
Encontro, a confirmação já resolve alvo, acerto e dano com RD. Vincular
a sequência à ativação própria da postura, usar a pilha anterior contra
o mesmo alvo e zerar ao trocar, mesmo errando. Um acerto incrementa só
para os próximos ataques, até BT. Não somar a pilha manual do mesmo
efeito. Posturas salvas sem a identidade e outras origens conservam a
via manual até terem recibo próprio.

### Postura da Tempestade, diagnóstico antes de editar, 07/11

Livro p.76. Um acerto enquanto a postura está ativa aciona Fortitude do
próprio alvo, sem ação adicional. O Encontro tem o recibo do acerto,
as condições de antes do dano e o verbo nativo para Caído. Implementar
a primeira queda sem reescrever condições. A segunda cláusula exige
identificar a duração de Imóvel no trecho “até o começo do seu turno”.
Guardar essa dúvida para o autor e manter o caso de alvo já caído fora
da aplicação automática até a decisão.

### Devastação e Tempestade, verificações em 07/11

Devastação própria vincula o acerto e o dano à identidade da ativação.
A pilha anterior beneficia só o mesmo alvo. A confirmação contra outro
alvo zera antes de resolver, mesmo se errar. Um acerto sobe a pilha do
próximo ataque, com teto BT. O Encontro retira a pilha manual quando
há identidade própria e conserva a via antiga em sessões sem ela.
O recorte cobre armas e ataque básico com confirmação. A ficha avulsa,
Imitação e Ápice sem recibo próprio mantêm o controle manual.

A primeira queda de Tempestade usa a condição do alvo antes do dano
e o acerto confirmado. Fortitude vai para o alvo com a CD da postura.
A aplicação lê o TR atual após Sorte e usa Caído nativo. O ataque em
alvo já caído conserva a pendência de prazo de Imóvel.

28 verificações por postura. Quatro Encontros por postura em
`browser-devastacao.txt` e `browser-tempestade.txt`, Player/Afty,
1440/390, com recarga antes de resolver. A sequência de ataques do
alvo baixou sua Defesa na prova da Devastação e foi considerada no
caso final da troca. Build, lint Afty e ordem aprovados. Suíte
299/301, com as duas falhas conhecidas de G00. Corte de 32 arquivos,
3.703 verificações e 134 fontes.

### Concentrar Aura, diagnóstico antes de editar, 07/11

Livro p.176. O estado manual já suspende auras e acrescenta dados após
o ataque, mas não registra Ação Livre nem a rodada. O grupo adicional
herda o tipo-base da arma no consumidor, embora a fonte diga Energético.
Manter a conta nativa, identificar seu tipo e usar um acionamento com
prazo no CL1. O acionamento deve aceitar só as aptidões cuja parcela
passiva é identificável no Livro, até 1 + AU. Preservar a bancada
manual para simulação e não certificar como passivas as auras ambíguas.

### Fluxo Constante, diagnóstico antes de editar, 07/11

Livro p.190 e Treino p.342. A cura livre no começo do turno e a reação
à perda de vida são alternativas. O cliente grava a primeira na quota
nativa de turno, mas a reação consulta só a cota de Reação. Além disso,
Liberação pode oferecer alvo externo para Fluxo, que é cura no próprio
corpo. Validar alternativa e destinatário nos clientes de cura e
regeneração sem alterar PER, custos próprios ou quotas de CL1.

A cura individual do Fluxo usa a mesma rolagem da cura básica. Estender
Medicina Infalível a essa rolagem sem segunda reação, custo ou uso de
Fluxo. A escolha preparada durante uma reação deve poder ser concluída
no turno em curso e caducar quando ele terminar. A etapa que transforma
o dano confirmado em janela automática continua separada.

### Concentrar Aura e Fluxo Constante, verificações em 07/11

Concentrar Aura registra a Ação Livre, aceita até 1 + AU passivas
identificadas e usa uma rodada nativa. No fim da duração, desfaz o
estado de suspensão. O dano de cada aura é 1d8 Energético após acerto,
sem duplicação no crítico. A ficha oferece o acionamento na Aptidão,
conservando a bancada manual e uma forma de limpar seleções de
sessões anteriores. A confirmação continua agrupando as parcelas que
têm o mesmo tipo, como no contrato de dano existente. A classificação
de auras ambíguas continua na fila.

Fluxo lê a ação livre usada no turno antes de aceitar reação, inclusive
em Regeneração do Treino 4. A cura é própria e exige declarar um dos
gatilhos. A cura individual pode maximizar dados com Medicina Infalível
sem pagar novamente PE, ação ou reação. No Encontro, o término do
turno em curso descarta a cura pendente de uma reação. Regeneração em
Fluxo, Cura em Grupo e origens de cura externas ainda aguardam a
ligação à Medicina. O gatilho de perda de vida permanece declarado.

30 verificações de Concentrar Aura. Medicina ampliada a 63 e Operações
a 286. As oito fichas clássica/G2 e quatro Encontros de Concentrar Aura
passaram. Quatro Encontros de Fluxo conferiram reação, livre e recarga,
Player/Afty em 1440/390. Provas em `browser-concentrar-aura-corte.txt`
e `browser-fluxo-medicina.txt`. Corte de 33 arquivos, 3.751
verificações e 136 fontes. A retomada única está agendada para 12h,
horário de São Paulo.

### Repasse para Codex e Claude, 07/11 às 12h

O CX3 continua aberto. O último corte foi Conferir Concentrar Aura,
Fluxo Constante e Medicina Infalível. Há 33 arquivos de assert do
CX3, com 3.751 verificações e 136 localizações de fonte. Build e lint
Afty passaram. A suíte do corte passou em 300 de 302 arquivos.
As falhas conhecidas são `t-reconciliacao-g00.mjs` e
`t-revisao-g00.mjs`. Provas em `.audit/cx3-20261102`, incluindo
`asserts-corte-1142.txt`, `browser-concentrar-aura-corte.txt`,
`browser-fluxo-medicina.txt` e `seguranca-1143.json`. O aviso de
linha em branco no fim de `afty-status.md` já existia. O Livro e os
arquivos oficiais conferidos ficaram íntegros. A retomada única das
12h disparou e foi removida após o pedido de repasse para dois chats.

**Codex, responsável pela integração.** Reusar CL1, CL2 e CL3 e
controlar os arquivos compartilhados do Encontro, confirmação,
painéis, sessões, catálogos e documentos. Começar pelo contrato de
reação antes de aplicar dano ou efeito. Reproduzir uma entrada real
antes de integrar a redução da Lua, Cobrir-se e as reações de classe.
Provedores de Feitiço/Domínio exigidos por Anular Técnica, Revestimento
e Pétala dependem de recibo real de origem, custo, alvo e janela. Não
certificar efeito implementado apenas porque o catálogo tem o texto.
Depois, integrar os módulos ou patches isolados do Claude e executar
a verificação do conjunto.

**Claude, responsável por Aptidões e Treinos em paralelo.** Auditar
e reproduzir Absorção Elemental de Aura, Expandir Aura com passivas,
Punho Divergente, Anular Técnica, Revestimento de Domínio, Emoção da
Pétala Decadente e pendências de Treinos. Separar parcelas numéricas e
validações independentes dos contratos de janela e posição. Entregar
provas e propostas de patch. Se tiver acesso ao workspace, limitar
a escrita a módulos novos exclusivos e asserts próprios, com nomes
distintos combinados pelo escopo. Os pontos de integração compartilhados
e a matriz final ficam com o Codex. Se só tiver os arquivos anexados,
devolver os patches em texto com dependências e testes.

**Decisões ainda abertas.** Perguntas já enviadas sobre Ação de Atacar
e Recuar, faixas -3/-2 de Pular e prazo da carga de Absorção Elemental.
Não repetir. Ainda registrar para o autor o início de turno que encerra
Imóvel da Tempestade, a distribuição de restos ímpares e Energia Reversa
no alvo secundário do Dragão, a interação de Sintonização com Cura em
Grupo, e casos de Provocação em que é impossível atacar. Também faltam
provedores de cura externos, Medicina em Cura em Grupo/Regeneração,
regras dependentes de posição e o registro de tentativas das Linhas.
Continuar apenas nas parcelas independentes enquanto uma decisão falta.

**Coordenação.** Ler `AGENTS.md`, `CLAUDE.md` e as reservas de
`docs/a-fazer.md`. Trabalhar sobre o estado local existente, que
contém mudanças ainda sem commit de outros lotes. O Livro é fonte de
leitura e a página é a impressa. `afty-derive.js` está com CX6.
Não editar `src/components`, conteúdo oficial ou o Livro, nem
promover G2. Não reabrir Mutante ou as decisões já fechadas. Sem commit,
push, pull, merge, reset, stash ou publicação por conta própria.

### Continuação da integração, 07/11

**Reprodução antes da alteração.** No Encontro, entrar em Lua, avançar
para o turno do atacante, rolar Espada Curta, selecionar o defensor e
confirmar aplicou 8 PV em Player e 22 PV em Afty sem oferecer reação.
Quatro percursos, 1440 e 390, em `.audit/cx3-20261102/browser-reacao-ataque-antes.txt`.

**Janela do ataque.** `confirmaAtaqueConteudo` consulta o dano de CL1
por tipo e abre opções quando um recibo de arma com alvo pertence ao
turno real e contém dano corporal acima de zero. Nenhum uso, registro
de ataque, dano, evento, consumo ou teste de concentração é publicado
durante a escolha. Ao prosseguir, a operação revalida o recibo, turno,
opções e dano e publica as duas sessões juntas. O mesmo acerto e o
mesmo dano continuam com as travas de confirmação de CL1. A escolha
na tela dura enquanto o formulário estiver aberto. Após recarregar
antes da aplicação, a mesa pode abrir a janela de novo pelo recibo.

| Regra | Parcela integrada |
| --- | --- |
| Lua, p.76 | Reduz uma instância de dano líquido pelo nível. Usa o acesso nativo à postura, inclusive suas origens já validadas. |
| Cobrir-se e Cobertura Avançada, p.178 | Custo confirmado pela faixa de CL e casca avulsa de 4 ou 8 PV por PE antes do impacto. A sobra permanece após recarga e expira no fim do turno da fonte. |
| Físico Amaldiçoado Defensivo, p.87 | +2 PE de faixa sem Cobertura Avançada. A combinação com Cobertura Avançada permanece na faixa base até a decisão na fila. |
| Esquiva, p.50 | Em acerto corpo a corpo, rola o dado de Empolgação disponível e soma Destreza para reduzir uma instância de dano líquido. |

O dano misto oferece a escolha explícita da instância de Lua ou Esquiva.
Cobrir-se absorve pela pilha nativa de PV temporário, com o débito
antes do dano. As reações passam pelo saldo de CL1 e pelo portão vital.
O recebimento, a concentração e as consequências vitais seguem nos
verbos CL1/CL2. O prazo de Cobrir-se fora do turno da fonte e as outras
reações de classe estão discriminados em `docs/a-fazer.md`.

**Recibos conferidos para a próxima integração.**

| Provedor atual | O que publica | O que falta para a reação |
| --- | --- | --- |
| `usarFeitico` no catálogo G2 | Id da ativação, chave do Feitiço, custo e origem do pagamento, rodada, estorno | Vincular a conjuração do combatente às rolagens e aos alvos afetados, nível e efeito por aplicar. Anular Técnica também exige a disputa de Feitiçaria e uma decisão única sobre a área. |
| Rolagens de Feitiço e Ritual nas fichas | Dados, resultado e identidade parcial do Feitiço para gatilho de dano ou ritual | Recibo de aplicação com a mesma identidade da cobrança, natureza do efeito e alvos. Revestimento também precisa rastrear efeitos ativos de Feitiço no alvo. |
| Criação de Itens por Feitiço e Pacotes para Aliados | Criação vinculada à ficha com custo e itens, ou benefício exportado com origem | São percursos próprios. O primeiro é autocontido e o segundo é um dado de importação/ativação do destinatário. Falta um evento prospectivo compartilhado de conjuração. |
| `abreExpansao`, Confronto e Contestação de CL3 | Versão, fase, custo da abertura, duração e domo na sessão. Confronto e Contestação têm identidades e participantes próprios | Evento de abertura com afetados e instância de Acerto Garantido com origem, DOM, alvo e contato físico antes do efeito. |
| Cesta Oca de Vime e supressão de CL3 | Proteção e concentração do usuário. O início de turno da Cesta recebe da mesa se haveria Acerto Garantido | A confirmação da mesa não identifica a instância original. Pétala precisa do recibo de abertura e do recibo do acerto físico. |

**Módulos isolados de Aptidões e Treinos.** O repasse
`CX3-aptidoes-treinos.md` separa as parcelas e as decisões. Expandir
Aura entrou na clássica, G2 e Encontro como Livre, custo confirmado de
2 PE e manutenção de 1 PE por CL1. Os alcances voltam à base enquanto
a manutenção está devida. Movediça conserva o alcance próprio e
Concentrar Aura mantém as passivas suspensas fora da expansão. O
alcance temporário ainda não foi levado ao pacote exportado. O formato
do pacote salva um texto estático e precisa do vínculo com a sessão
do emissor para refletir a duração da expansão.

A parte numérica da Absorção Elemental entrou em
`afty-combate-aptidoes.js`. O assert já deriva o grupo tipado da carga
e prova que ele sai ao consumir a pendência. A ativação na janela
permanece pendente pelo prazo e pela segunda carga. O módulo de
Resistência Completo tem 57 verificações, mas ainda aguarda a entrada
de Teste de Morte de CX6. Os 24 asserts dos números de Punho Divergente,
Anular Técnica, Revestimento e Pétala validam apenas os cálculos.

**Verificação.** Janela no navegador em 16 percursos, quatro escolhas
em Player/Afty a 1440 e 390. Expandir Aura em 12 percursos, clássica,
G2 e Encontro, com recarga e manutenção. O corte CX3 soma 38 arquivos
e 4.031 verificações, com 54 verificações de ordem de módulos.
Build e lint Afty aprovados. A suíte completa passou em 305 de 307
arquivos, com as duas falhas G00 do corte anterior. Evidências
`browser-reacao-ataque.txt` e `browser-expandir-aura.txt`. Dez
localizações individuais adicionais no Livro conferido, total de 146
do CX3. A referência local de `origin/main` tem dois commits acima
da base e sobrepõe o arquivo do Encontro e documentos. Os dois hunks
do Encontro nessa referência são de cache e opções de derive. A consulta
ao GitHub por rede falhou neste ambiente.

#### Janela de acerto e dano secundário, 07/11

Fonte conferida pelo SHA-256
`1d0713d52c818a9ab9f47b883d9887a0d227d174d30ffcce358874669a7a733a`.
Linha de entrada com 305 de 307 arquivos aprovados. As falhas foram
`t-reconciliacao-g00.mjs` e `t-revisao-g00.mjs`. A referência local do
remoto tem dois commits adicionais. O GitHub confirmou a mesma ponta
`f6433a8a3c11f544c82e5f543738ea56e2920b3b` de `main` via conector.

| Parcela | Fonte impressa | Reprodução e consumidor | Estado |
| --- | --- | --- | --- |
| Aparar Ataque | p.53 | Antes da alteração, o Lutador com a habilidade perdeu 2 PV em Player e 22 em Afty sem poder disputar. O Encontro agora consulta a linha de ataque do defensor, prepara a rolagem nativa, gasta 1 PE e Reação por CL1 e exige total superior ao do atacante. O recibo guarda a jogada, o custo e o resultado | Entregue para linhas corpo a corpo. A confirmação do defensor precede a aplicação. Dano compatível é exigido ao resolver um ataque que acertaria sem a parada |
| Dano secundário do Dragão | p.76 e p.178 | `aplicaDragaoConteudo` usa o TR de Fortitude e verifica emissor, inimigo, turno e ataque. `preparaReacaoAoDano` abre Lua ou Cobrir-se conforme a disponibilidade. A mesma operação publica a reação, a consequência do TR e o dano no Encontro | Entregue para dano com tipo resolvido. As decisões de restos e Energia Reversa seguem na fila |
| Raio Negro misto | p.192 e p.307, dados critáveis conforme decisão de 15/09 | O percurso com Espada Curta e Aura Elemental era recusado pelo Encontro. `rolarDano` publica o subtotal critável por grupo. `confirmaAtaqueConteudo` calcula a metade por tipo e usa CL1 para defesa, dano e concentração. O acerto derruba a Guarda | Entregue quando a divisão conserva o total. Com resto sem tipo, a mesa resolve. Recibo antigo misto exige nova rolagem |

Uma reação adicional ao dano pode ser declarada condicionalmente após
escolher Aparar, se houver saldo de CL1. A rolagem acontece após as escolhas.
A reação condicional é debitada apenas se o ataque acertar. As duas etapas
conferem a identidade, a opção e o estado atual. O resultado é publicado
em conjunto nas sessões da origem e do alvo.

O Encontro usa `EscolhaDeReacao` tanto no ataque de arma quanto no Dragão.
A clássica e o G2 usam o controle próprio de Postura. A confirmação do dano
com alvo ocorre no Encontro, que tem as duas sessões. A integração de
Feitiços, invocações e Acertos Garantidos ainda precisa dos respectivos
recibos. As dependências de CX6 são Teste de Morte em tela, vínculo de
sessão e posição para Pacotes, e a aplicação em tela de CL3. Os patches de
Revestimento e a ativação de Absorção Elemental ainda têm decisões
pendentes no repasse de Aptidões e Treinos.

Evidência da passagem em `.audit/cx3-20261102`, com os prefixos
`browser-aparar-ataque`, `browser-dragao-reacao` e `browser-raio-negro`.
Asserts específicos `t-cx3-reacao-ataque` (82) e `t-cx3-dragao` (95).
Na prévia local do build, Player e Afty passaram em 390 e 1440 px.
São 12 percursos de Aparar (sucesso, falha e passar), quatro de Raio
Negro misto e quatro de Dragão no Encontro. Oito fichas clássica e G2
verificam a ativação de Dragão e outras oito verificam a rolagem e a
persistência do recibo de Raio Negro. Os testes de navegador conferem
o custo, o dano, a recarga da página e a consequência do TR. Os asserts
cobrem duplicidade, reação indisponível e recibos antigos.
Ordem de módulos com 54 verificações, lint Afty e build aprovados.
A suíte final mantém 305 de 307 arquivos aprovados, com as duas falhas
G00 da entrada. O módulo do Dragão ganhou classificação no escopo G00.

#### Encerramento para a publicação, 07/11

O autor encerrou o CX3 com a entrega parcial. O restante foi adiado e
consolidado em [CX3 depois da publicação](../../a-fazer.md#cx3-depois-da-publicação).
O repasse de Aptidões e Treinos registra os módulos testados em isolamento,
os patches compartilhados e as decisões que ainda dependem de integração.
