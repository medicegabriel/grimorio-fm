# CX2: origens, clãs e Anatomias

Evidência da entrega. A fila única permanece em `docs/a-fazer.md`.

## Checagem inicial, 2026-10-29

Fonte externa lida diretamente, páginas impressas 27 a 41, 145, 169, 170 e 200.
SHA-256 confirmado: `1d0713d52c818a9ab9f47b883d9887a0d227d174d30ffcce358874669a7a733a`.
HEAD `d6d6dd77a7999d0df0454eb58d62584c0f46a9a3`, igual à main remota
consultada por `git ls-remote`. Nenhum movimento da base, commit ou publicação.
Alterações locais de CX1, Técnicas Marciais e CL1 preservadas. Corte inicial em
`.audit/cx2-20261029/status-inicial.txt` e `preexistente.patch`.

Contexto lido na ordem exigida, incluindo decisões antigas e guias. CL1 tem módulos
de uso, eventos e dano reais, ainda reservados e em andamento. CL2 e CX4 sem entrega
local. Nenhum chat iniciado ou contactado.

Linha de base: 244/246 arquivos aprovados. Falhas preexistentes em
`t-reconciliacao-g00` (fontes individuais) e `t-revisao-g00` (módulos concorrentes
sem classificação). Log `baseline.txt`. Reprodução em `diagnostico.mjs` usa
Player Conjurador 12, atributos por valores fixos, um Feitiço de nível 1,
uma Anatomia por vez, sem equipamento ou compras conflitantes.

Diagnóstico publicado antes de alterar produto:

| Parcela | Página/decisão | Evidência atual | Veredito |
|---|---|---|---|
| Anatomias | 35 e 36, CX1 | Quatro correções prontas, demais bônus numéricos parciais | Corrigir escolhas e operações confirmadas |
| Marca/Familiaridade | 27, 169, 200 | Vaga existe, identidade e descontos ausentes | Implementar |
| Zenin | 31 | Contador sem modalidade aplicada | Implementar |
| Manual | 169 | Recarga Máxima existente, ciclo ausente | Implementar preservando recarga |
| Derivado/Reserva | 32, 169 | Vaga genérica e recuperação sem operação | Corrigir, temporários dependem de CX4 |
| Inumaki/Resiliência/Vigor/Herança | 30, 33, 34, 170 | Cadastro e parcelas específicas, falta operação integral | Implementar sobre operações disponíveis |
| Kamo | 31 | `nd - 1` e Constituição no nível 10 já emitem PV | Já coberto, rerrolagem depende de PV rolado |
| Mutante | 39 a 41 | CL2 não entregue | Depende de entrega, sem criar outro modelo |

Desenho mínimo: escolhas persistidas na origem, canais existentes e porta única dos
Feitiços para cálculo e consumidores. Operações novas de conteúdo consomem CL1,
sem editar seus arquivos reservados e sem construir outro motor de uso ou modelo vital.
Distribuições de atributos autorizadas e diferenças Player/Afty preservadas.

Decisão direta do autor nesta sessão: usos por dia de Alma Maldita e Energia
Antinatural têm recarga diária manual, separada do Descansar. Expansão de Reserva
continua recarregando por descanso conforme o talento.

## Retomada, 2026-11-01

HEAD agora `deab72cc26a93ab39350b6a781fcb0ca052cc0fd`, movido fora deste lote.
Mudanças locais de CL1, CL2 e CL3 foram lidas e preservadas. Corte em
`.audit/cx2-20261101/retomada.patch`. CL1 e CL2 liberaram os contratos reais.
Os arquivos reservados pelo CL3 continuam sem edição por CX2.

Correção da classificação inicial do Mutante: **divergência intencional, parcela
cancelada**, conforme decisão expressa do autor em 30/10, registrada em AGENTS.md.
Não existe mais dependência ou proposta de construir sua interface.
Carapaça Mutante e núcleos de invocação continuam válidos e são conceitos distintos.

## Corte de entrega, 2026-11-01

**Estado: implementação parcial, com decisões e integração ainda necessárias.**
CL1 e CL2 foram consumidos pelo código real, sem stubs. CL3 liberou seus arquivos
antes da classificação aditiva de módulos em `revisao-automacao/escopo.json`.
Main remota conferida em `deab72cc26a93ab39350b6a781fcb0ca052cc0fd`, igual ao HEAD
da retomada. A base não foi movida por CX2. Nenhum commit, push ou publicação.

### Matriz das 15 Anatomias nativas

Página impressa 35 até Instinto Sanguinário, página 36 a partir de Olhos Sombrios.
Todas usam a seleção efetiva e o orçamento de Anatomias da ficha. Não se confundem
com Características Amaldiçoadas do addon Era de Ouro, que têm regras próprias.

| Anatomia | Estado real no corte | Caminho e limite |
|---|---|---|
| Alma Maldita | Implementada em CX2 | Contador diário manual, metade antes da Integridade, anulação no 15, botão Novo Dia. Descansar preserva os usos gastos |
| Anatomia Incompreensível | Implementada em CX2 | Rola d4, retira somente o adicional declarado de crítico/furtivo. Chance muda no 15. As demais defesas continuam no CL1 |
| Arma Natural | Coberta por CX1, preservada | Tipo escolhido, Fineza, Enérgica e dado desarmado pelo Motor, respeitando a divergência Player/Afty |
| Articulações Extensas | Coberta por CX1, preservada | Canal de alcance dos ataques corpo a corpo, sem alterar Feitiços ou tamanho |
| Braços Extras | Coberta por CX1, preservada | Prestidigitação, declaração Duas Mãos Livres para Atletismo, mãos no contrato de equipamento. Agarrar continua uma declaração de mesa |
| Capacidade de Voo | Implementada em CX2 | Ação livre, débito de 1 PE, conversão da caminhada por uma rodada no relógio de CL1, persistida na sessão |
| Carapaça Mutante | Completada em CX2 | RD física existente preservada. Escolha física no nível 10 emite resistência com fonte. Editor bloqueia a escolha já feita |
| Corpo Especializado | Coberta por CX1, preservada | Perícia do catálogo ativo, inclusive personalizada, dado real de bônus e fonte |
| Desenvolvimento Exagerado | Já coberta | Tamanho e PV por nível pelo Motor, sem parcela extra de CX2 |
| Devorador de Energia | Operação implementada, integração geral pendente | TR nativo contra Feitiço, sucesso identificado concede 1 PE temporário cumulativo. Evento repetido não concede de novo. Teto/substituição/expiração gerais pertencem a CX4 |
| Instinto Sanguinário | Já coberta | BT na Iniciativa e Atenção somente em combate, pelo contexto existente |
| Olhos Sombrios | Completada em CX2 | Treino e +2 em Percepção preservados. Resultado de Visão no Escuro e de ignorar escuridão Leve/Total no 12 exposto na ficha. Não cria um simulador de iluminação |
| Pernas Extras | Completada em CX2 | Deslocamento existente preservado. Resultado de ignorar terreno difícil no solo exposto na ficha. Não cria mapa ou custo de percurso |
| Presença Nefasta | Implementada em CX2 no Encontro | Alvo hostil, primeiro avistamento declarado, TR de Vontade confirmado, Abalado/Amedrontado por uma rodada. Registro por alvo evita reaplicação |
| Sangue Tóxico | Implementada em CX2 no Encontro | Dano corpo a corpo sofrido provoca perda de vida no atacante. As duas sessões são gravadas juntas. Na ficha isolada o retorno é registrado, pois não existe sessão do atacante |

### Matriz das origens, clãs e talentos consumidos

| Origem/parcela | Página | Estado real no corte |
|---|---|---|
| Inato, Bônus em Atributo | 27 | Distribuição autorizada preservada, sem alterar limites ou fórmula |
| Inato, Talento Natural | 27 | Vagas exclusivas existentes preservadas, sem duplicação de concessão |
| Inato, Marca Registrada | 27, 200 | Identidade no Feitiço-base, desconto no custo nativo e propagação pelas variações. Referência ausente/cíclica não herda benefício |
| Familiaridade com Técnica | 169 | Requisito real, primeira Marca melhorada, escolha de sustentação, marcas adicionais limitadas a metade do BT. Não inventa uma primeira Marca ausente |
| Herdado, Bônus/Treinamentos/Herança de Clã | 28 a 31 | Continua resolvendo o clã escolhido, com pools específicos e orçamento existente |
| Gojo, Bônus e Treinamentos de Clã | 30 | Escolhas existentes preservadas |
| Gojo, Potencial Lendário | 30 | PE nos níveis pares e Feitiços adicionais já cobertos, sem reimplementar |
| Inumaki, Bônus e Treinamentos de Clã | 30 | Escolhas existentes preservadas |
| Inumaki, Olhos de Cobra e Presas | 30 | Usos BT com recarga longa. No Encontro o comando consome a reação do aliado e grava ambos. Na ficha isolada registra o aliado nomeado |
| Kamo, Bônus e Treinamentos de Clã | 31 | Escolhas existentes preservadas |
| Kamo, Valor do Sangue | 31 | PV adicional por subida e Constituição no 10 já cobertos. Rerrolagem não foi ligada, porque PV rolado ainda depende da decisão central existente |
| Zenin, Bônus e Treinamentos de Clã | 31 | Distribuição e orçamento existentes preservados |
| Zenin, Foco no Poder | 31, 215, 234 e decisão do autor em 01/11 | Modalidade por Feitiço e marcos 1/5/10/15/20. Dado real de dano/cura, alcance e CD. Com vários efeitos/disparos/golpes, um dado no total no destino escolhido, com rolagens individuais e consumidor de Auxiliar. Concentrado recebe uma vez. Em Dano na Alma, dado e alcance integram a criação e valem inteiros. As duas perguntas foram respondidas |
| Manual de Técnica | 169 | Um antecipado por vez, acesso de criação persistido, nível imediatamente superior e custo acrescido de metade do padrão. Fora do orçamento comum até Aprender. Aprender exige acesso e passa ao orçamento normal. A redução de recarga da Máxima no acesso 5 foi preservada |
| Derivado, Bônus em Atributo | 32 | Distribuição autorizada preservada |
| Derivado, Energia Antinatural | 32 | Aura concedida pelo nome, limitada à categoria e requisitos reais. Recuperação em combate usa ação bônus e uso diário manual. Ficha antiga candidata a primeira Aura existente, sem apagar dados |
| Derivado, Desenvolvimento Inesperado | 32 | Valor/limite e divergência autorizada do Player preservados |
| Expansão de Reserva | 169 | Requisito real, ação livre, recarga longa e PE temporário com fonte pelo escritor existente. Política geral de temporários permanece CX4 |
| Restringido, Bônus em Atributo | 33 | Bônus físicos e distribuição existentes preservados |
| Restringido, Físico Abençoado | 33 | Movimento e acesso à especialização preservados. Imunidade a doenças exposta e TR de Veneno com vantagem. Dados extras de cura em descanso curto dependem da integração do descanso em CX4/CX6, sem dividir o botão único por conta própria |
| Restringido, Ápice Corporal Humano | 33 | Limites físicos e alocação a cada seis níveis preservados. Dobro de peso/salto permanece no texto fiel, pois o site não calcula essas distâncias de Atletismo |
| Restringido, Resiliência Imediata | 33 | Redução de um golpe sobre as defesas nativas, usos BT compartilhados com Evitar Desmembramento. A prevenção é declarada antes de aplicar a perda do membro, não regenera Ferimento existente |
| Feto, Bônus em Atributo | 34 | Distribuição autorizada preservada |
| Feto, Herança Maldita | 34 | Operação para cura reversa externa pela metade e cura própria pela linha nativa, pagando 2 PE por PER. Não substitui automaticamente os demais fluxos de cura, cuja integração geral está em CX4/CX6 |
| Feto, Físico Amaldiçoado | 34 a 36 | Vagas e seleção efetiva preservadas, 15 Anatomias conferidas acima |
| Feto, Vigor Maldito | 34 | Usos e cura por nível, vários usos simultâneos multiplicam a cura inteira. Cura passa pelo estado vital de CL2, com fontes |
| Reposição Sanguínea | 170 | Requisito real, +5 por uso e reação ao dano declarado, respeitando usos e economia de ações |
| Feto, Fortitude contra Veneno | 145 | +2 condicional na rolagem nativa, sem afetar outros testes de Fortitude |
| Corpo Amaldiçoado Mutante | Decisão de 30/10 | Cancelado e excluído em definitivo. Nenhuma interface construída ou pendência reaberta |

### Contratos, persistência e arquivos

- `afty-origens-feiticos.js` e `afty-feiticos.js`: vínculos no próprio Feitiço,
  cadeia de variação, cálculo e fontes pelo consumidor existente. O contexto também
  chega ao consumidor de manutenção de Auxiliares. Técnicas Marciais não recebem
  descontos próprios de Feitiço. Dados de seleção inválidos ficam preservados e inertes.
- `afty-derive.js`, `afty-efeitos.js`, `afty-efeitos-conteudo.js`, `afty-origens.js`
  e `afty-anatomias.js`: concessões, resistência escolhida, resultados e conteúdo.
  Aura é validada contra a derivação sem sua própria concessão.
- `afty-origens-uso.js`: resumo de conteúdo sem estado. `ficha/ficha-origens.js`
  adapta `usa`, ações, usos, dano, cura, Alma e PE temporário dos núcleos reais.
  Recusa preserva a sessão. `opId`/identidade de evento impedem duplicação.
- `AftyCreatureBuilder.jsx`: Marca/Familiaridade, Foco, Manual, Aura e Carapaça.
  `ficha/PainelOrigens.jsx`, `ficha/AftyFichaClassica.jsx` e
  `encontros/PainelDeCombatente.jsx`: uso nas telas existentes. Nenhuma promoção do G2.
- `ficha/ficha-opcoes-derive.js`: estado ativo do voo chega à derivação.
  `ficha/ficha-conteudo.js`: usos e resultados das Anatomias.
  `encontros/AftyEncontro.jsx` e `encontros/usar-encontro-afty.js`: alvos e gravação
  conjunta. O redutor recusa o pacote inteiro se uma sessão mudou desde o cálculo.
- Testes em `asserts/t-cx2-origens.mjs` e adaptação estreita do contrato em
  `asserts/t-g2-sessao-operacoes.mjs`. Guias de DSL, fórmulas, Player e histórico atualizados.
  `escopo.json` classifica somente os novos módulos de CX2. Inventário e fontes globais
  não foram reconciliados nem certificados por este lote.

### Verificação do primeiro corte

`t-cx2-origens`: 155 asserts aprovados em Player e Afty, incluindo requisitos,
orçamento, remoção da origem, variações, manutenção real, falhas sem gasto,
duplicação, duração, recarga, estado vital e alvos. `t-g2-sessao-operacoes`: 52.
`t-cx1-base`: 186 preservados. `t-ordem-modulos`: 48. Lint de Afty e build aprovados.

Suíte completa do corte: **255 de 256 arquivos aprovados, 16.665 asserts nos aprovados**. Falha
`t-reconciliacao-g00`, na exigência de fontes individuais para cada chave viva.
Diagnóstico de coleta encontrou 936 chaves sem entrada de fonte no estado local,
incluindo conteúdo anterior e metadados novos. A mesma classe de falha existia
na linha de base. Não houve enfraquecimento do assert nem aprovação do G00.
`t-revisao-g00` passou após a classificação dos módulos já liberados.

Navegador em build de produção com armazenamento isolado: Player e Afty, 1440 e
390 px. Escolha/salvamento/releitura de Carapaça, Marca, Foco e Aura, voo pago
e persistido, Vigor, cura reversa externa, recarga diária, aprendizado do Manual,
Encontro e Sangue Tóxico gravando as duas sessões. Quatro cenários aprovados,
sem erro de página ou transbordamento horizontal. Operações de Presença/Inumaki
e casos negativos cobertos nos asserts, sem alegar percurso de navegador adicional.
Evidências locais em `.audit/cx2-20261101/`, incluindo `browser-resultados.json`.

Diff conferido para áreas somente-leitura, conflitos e U+2014 novo. Alterações
concorrentes preservadas. Reservas de CX2 liberadas no corte de entrega.

### Limites do corte

A integração geral de temporários/curas/descanso e PV
rolado permanece na fila única. As duas decisões de Foco foram respondidas e
implementadas no complemento abaixo. A integração de Braços Extras do addon Era de
Ouro também permanece: o pacote declara seu próprio conteúdo e não foi reescrito
nem substituído por uma regra nativa. Seu voo é gratuito, sua Carapaça tem outra
progressão e seus Braços incluem ritualização, portanto os ids não foram tratados
como aliases das Anatomias nativas. O lote não está encerrado.

## Complemento: respostas de Foco Zenin, 2026-11-01

O autor respondeu as duas perguntas pendentes neste chat:

- Um dado no total, em um efeito ou disparo escolhido. Essa decisão substitui
  a interpretação de Foco por disparo do primeiro corte. A regra dos demais
  bônus de Múltiplos Disparos não foi alterada.
- Em Dano na Alma, Foco é parte da criação e seu benefício é integral.

`focoZeninDestino` persiste `disparo:N`, `golpe:N` ou `efeito:ID` no Feitiço.
Variações herdam o destino da base e podem escolher outro. O seletor usa somente
destinos presentes no cálculo nativo. Sem escolha válida, uma distribuição com
vários destinos gera aviso e não recebe o dado. Se há um único destino válido,
nada precisa ser escolhido. Seleção antiga não é apagada ao remover a origem.

O dado entra depois da divisão de disparos/golpes, somente na rolagem escolhida.
No concentrado entra uma vez. O resumo, fontes e rolagens individuais usam os
mesmos dados. Em Auxiliar Múltiplos Efeitos apenas o efeito escolhido muda, com
o mesmo resultado no consumidor ativo. Em Dano na Alma o dado passa a compor
o pool de criação, e o alcance dobra integralmente. Os aumentos externos
continuam recebendo a metade da p.234.

Arquivos de produto: `afty-origens-feiticos.js`, `afty-feiticos.js` e
`AftyCreatureBuilder.jsx`, além dos testes e guias já listados. HEAD/main remoto
conferidos novamente, sem movimento de base. Nenhum commit ou publicação.
`t-cx2-origens` ampliado de 155 para **195 verificações aprovadas**.
As duas perguntas saíram da fila. As dependências dos outros lotes não mudaram.

Revalidação do complemento: suíte completa com **255/256 arquivos aprovados,
16.705 asserts nos aprovados**, com a mesma falha global de fontes individuais
em `t-reconciliacao-g00`. Lint de Afty, ordem de módulos (48) e build aprovados.
No navegador de produção, Player/Afty em 1440/390 px: três seleções de destino
salvas e relidas, quatro rolagens reais conferidas por cenário, dano/alcance de
Alma integrais e disparo escolhido também rolado e salvo no Encontro. Quatro
cenários aprovados, sem erros de página ou transbordamento. Evidências em
`.audit/cx2-20261101/foco-browser-resultados.json`, `asserts-foco.txt`,
`lint-foco.txt` e `build-foco.txt`. Reservas liberadas.
