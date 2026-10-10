# Asserts do Afty

Os asserts de lógica do lado do Afty cobrem o avaliador do DSL, as
primitivas novas do motor, o sistema de Addons de ponta a ponta e regras do catálogo que
são fáceis de quebrar sem sintoma.

Nasceram em 2026-08-20 com os Addons, e o autor decidiu no mesmo dia que a pasta **fica**, com um
comando para rodar. O motivo é que os Addons são a única parte do Afty em que **outra pessoa
escreve a entrada**: os 13 validadores de catálogo são o portão de aceitação, e estes asserts são o
que prova que o portão fecha.

## Como rodar

A partir de `grimorio-tracker/`:

```
npm run asserts
```

Ou só os que interessam, filtrando pelo nome:

```
npm run asserts -- addons
npm run asserts -- exemplo familias
```

Um arquivo sozinho continua funcionando direto, que é o mais rápido enquanto se mexe em um só:

```
node asserts/t-addons.mjs
```

O lançador roda cada arquivo em **processo próprio**, e não importando tudo junto. São dois
motivos: eles mexem no mundo global dos Addons (`aplicarAddons` reescreve os catálogos no lugar, e
um arquivo sujaria o outro), e a ordem de importação importa (ver o ciclo abaixo).

Ele só conta como sucesso quem sai com código **zero** E imprime a linha de aprovação. Arquivo que
nem compila aparece com a stack inteira. Falhou algum, o `npm run asserts` sai diferente de zero.

Nenhum assert escreve nada: são todos de leitura, com um `localStorage` de mentira onde precisa.

## Fora do build

A pasta está **fora de `src/`** e os arquivos são `.mjs`. O `vite build` não os enxerga, e o
`eslint .` também não, porque o `eslint.config.js` casa só `**/*.{js,jsx}`. Nada aqui entra no que
vai para o ar.

## O que cada arquivo cobre

| Arquivo | O que verifica |
|---|---|
| `t-dsl` | o avaliador copiado, com **30 asserts de paridade** contra o `fm-dsl.js` da 2.5.2, mais o literal de texto e o `contar()` |
| `t-contar` | o `contar()` ponta a ponta, o mapa de marcas, e a descoberta dele no seletor `{ }` |
| `t-hpatributo` | o canal `hpAtributo`, incluindo alvo ausente, empate e as linhas do hover |
| `t-ponta` | o `contar()` passando pelo `deriveAfty` de verdade, pelo Funcionamento Básico |
| `t-addons` | o ciclo completo de um pacote: validar, instalar, namespace, religar, desinstalar |
| `t-biblioteca` | a biblioteca, com `localStorage` corrompido e com `localStorage` indisponível |
| `t-linha-morta` | os três motivos de linha morta, e a garantia de que a ficha SEMPRE abre |
| `t-familias` | as seis famílias de catálogo, num pacote que mexe em todas de uma vez |
| `t-familias2` | Origem e as três de alto nível |
| `t-tabelas` | Tipo de Dano e Condição, que são tabela e não catálogo |
| `t-pericias-pacote` | o pacote de perícias da Classe, o hover do contador e ⚠ a CONCESSÃO QUE CREDITA: subir de uma faixa concedida custa a diferença, e as três entradas de "Caso já seja" (`semCredito`) seguem cobrando cheio. Os dois lados medidos juntos de propósito, porque ligar um sem o outro é o bug de volta |
| `t-exemplo` | **o pacote de exemplo do `docs/afty-addons.md`**, executado de verdade |
| `t-marcas-declaradas` | marca que o addon declara mas a criatura ainda não usa aparece no seletor com zero |
| `t-encontro-addons` | o encontro MISTO: a união põe dois mundos no ar ao mesmo tempo e o de ninguém some depois do laço |
| `t-concessao` | a primitiva 8.3 no MOTOR: as 7 famílias, o "de graça" medido contra a ficha crua, e conceder algo que só existe por addon |
| `t-concessao-sessao` | a 8.3 na SESSÃO: gravar e ler de volta, o aparo que não perde o campo, e a prova de que a ficha salva não é tocada |
| `t-condicoes` | o catálogo das condições: as quatro forças, as três Especiais fora da lista que o Feitiço lê, os 29 textos do autor sem travessão nem ponto e vírgula, e o validador que recusa nome e inclusão que não casam |
| `t-condicoes-efeitos` | as condições no NÚMERO, nos dois sistemas: ⚠ o exemplo do autor (Paralisado e Desprevenido dão -10, e não -13) no número e no hover, a disputa por número exato, condição somando com buff, inclusões contadas uma vez, movimento pelo menor resultado, Fragilizado zerando toda RD, o Condenado depois do piso, a bancada que não vaza, as rodadas e a perda de vida na sessão, o catálogo que diz o que cada uma faz, e o SALDO da faixa Agora (líquido, com perícias agrupadas e a exceção ao lado) |
| `t-adaptacao` | o ciclo do Mahoraga: giros, rodada automática, marcos, Narrativa, Mecânica e escolha aninhada de Acerto |
| `t-primitivas` | o campo `permite`: quem enxerga cada primitiva de Addon, e a prova de que criatura raw não vê nenhuma |
| `t-estilo-liberado` | o campo `libera`: o Estilo das Sombras fora do Sem Técnica, o Gêmeo copiando do Sem Técnica em Verdadeiras Origens, e a QUARTA trava (o card aparecer na aba) |
| `t-estilo-marcial` | a liberacao `feiticosRestritos`: a aba de Feiticos aberta para quem nao conjura e ao mesmo tempo estreitada a Passivo e Personalizado, a terceira porta (ficha com Feitico gravado ve o card sem addon nenhum), a prova de que ela nao tira tipo de quem ja conjurava, o ponta a ponta dos dois tipos (o Passivo somando RD e o Personalizado cobrando o custo do nivel), e a lista de tipos VAZIA, que e resposta e nao falta de dado |
| `t-remendo` | o campo `substitui`: trocar campo de entrada do livro, o id que não se mexe, o alvo que precisa existir, dois pacotes na mesma linha e a volta ao raw ao desinstalar |
| `t-cesta-oca` | o addon `era-da-cesta-oca`, um remendo de UM requisito: Mestre em História sai da Cesta Oca de Vime e ⚠ a CONTRAPROVA de que BAR 1 e ND 5 continuam travando, mais a entrada do livro intacta em todo campo que o remendo não citou |
| `t-custo-pe` | o alcance do canal `custoPE`: os cinco gastos, o piso de 1 PE POR GASTO, base zero que continua zero, valor negativo como aumento depois do piso, sem alvo valendo para todos e com alvo valendo para um, e ⚠ o assert de REGRESSÃO da Expansão de Domínio, que precisou nomear o alvo dela quando o canal cresceu |
| `t-vislumbre-celeste` | a Condição Corporal dos Seis Olhos: as contas dos dois blocos, ⚠ a prova de que eles NUNCA saem na mesma lista (o dia em que saírem, todo bônus dobra), a soma com o resto da ficha, o "de graça" medido contra o contador da aba, a redução ampla de PE chegando no Domínio Simples, e desinstalar devolvendo a ficha |
| `t-criacao-armas` | o padrão de Pontos de Criação do autor: os espelhos do livro dentro do módulo folha, o destino de TODA propriedade (preço, crédito, avaliação da mesa ou fora do padrão), as contas do dado, da margem, do custo, da técnica, dos espaços e da Pesada, e ⚠ a promessa do `permite` medida com a arma equipada, porque a bancada conta e avisa mas não escreve regra nenhuma |
| `t-estilo-conteudo` | o conteúdo do addon do Estilo: Domínio Simples reescrito, a Linha de Treinamento com `soDaOrigem`, os quatro Talentos de Origem, a vaga exclusiva de Estilo e o Estudo Amaldiçoado repetível |
| `t-gemeos-maldicao` | a liberacao `gemeosMaldicao` e a ORIGEM ESTRUTURAL: o Gemeo que copia da Maldicao perde a Energia Reversa e ganha a aba dela, medido pela igualdade com uma Maldicao de verdade |
| `t-bases-automaticas` | as Bases que a Especialização concede sozinha (`automatica: true`): quem recebe, o orçamento intocado, e a escolha aninhada que sobrevive à concessão |
| `t-pugilato` | Faixas, Manoplas e Soco Inglês alimentando o Ataque Básico: os cinco graus, o item que define o golpe, e o efeito de encantamento chegando na linha |
| `t-dano-acerto-amaldicoado` | a divergência `danoDoAcertoAmaldicoado`: na criatura a arma no Acerto Amaldiçoado usa o Atributo de Técnica no dano, no jogador segue o da arma, e as Técnicas de Combate vêm antes |
| `t-tamanho-pingente` | Crescimento Corporal repetível, redução de categoria, distância por tamanho e o Pingente de Amaterasu sob o sol ou com os três tesouros |
| `t-interludios` | a varredura das 12 Linhas de Treinamento: os 13 requisitos que deixaram de ser `nota`, a trava do Potencial Físico no Restringido, e ⚠ o assert estrutural que compara efeito DECLARADO contra efeito EMITIDO, para nenhum voltar a ser descartado calado |
| `t-flugel` | o pacote Flugel de ponta a ponta, lido do JSON em `addons/flugel.json` (ele saiu do bundle em 2026-09-01): instalação, Futen, Akutame, Alma Livre no nível menos 4, troca de atributo-chave, Treino não congênito, vagas conjugais, o interruptor de sessão `Cônjuge`, a Dupla Empenhada em metade do BT, ⚠ o Bônus do Cônjuge, que SUBSTITUI a perícia em vez de somar nela, e ⚠ as quatro metades do BT aparadas para baixo com BT 3 (versão 1.1.1) |
| `t-liberto` | o pacote Sem Técnica - Liberto, lido de `addons/sem-tecnica-liberto.json`: o verbo `variacaoDe` em cada trava do Sem Técnica (Feitiços, Estilo, Domínio Simples, qualificação, estrutura, Verdadeiras Origens) nos dois sistemas, cada degrau do Caminho até o Fim no nível exato, e a mãe recusada pelo validador |
| `t-formula-entropica` | o pacote Fórmula de Combate Entrópica, lido de `addons/formula-combate-entropica.json`: a origem e a herdeira do Restringido, INT na Defesa e no ataque (acerto e dano), o contador de falhas até o BT com a Inferência Rápida somando, as Dádivas e os Talentos com número, os contadores de mesa com as recargas `cena` e `rodada` devolvidas pela sessão, a porta `requerEscolha`, a opção promovida a linha na Ficha, e a escada do desarmado que NÃO desce |
| `t-restringido-variacao` | o Restringido como mãe de variação, com um pacote mínimo escrito no próprio assert: a origem com `variacaoDe: "restringido"` e a classe com `herdaDe`, o `origemMae` e o `especializacaoMae`, a trava de classe e de Tipo, o `semEnergia` do jogador, o limite 30 dos físicos que NÃO desce, o Roubo e o Respeito Celeste da herdeira, e o Restringido do livro derivando igual com e sem o pacote |
| `t-maldicao-era-de-ouro` | o pacote Maldição - Era de Ouro, lido de `addons/maldicao-era-de-ouro.json`: a origem que se divide em Tipos, a mãe `maldicao` (⚠ o acesso às Aptidões de Maldição e a perda da Energia Reversa, que ficam vermelhos contra o motor da v1 e foi assim que o relato do autor foi reproduzido), o conteúdo real de cada Característica com escolha e a Ficha Final |
| `t-alcance-corpo-a-corpo` | Auxiliares de alcance, Ataque Circular e Articulações Extensas nos dois sistemas: alvos, liga/desliga, fontes, exclusões, pool e soma antes do Céu. Espaço/Alcance por Tamanho e Feitiços de Toque preservados |
| `t-concentrar-poder-dobrado` | o pacote Concentrar Poder Dobrado, lido de `addons/concentrar-poder-dobrado.json`: as sete linhas de invocação copiando o raw, ⚠ a parcela do addon valendo a do livro em cada canal nos degraus 6, 12 e 18 dos dois sistemas, os totais iguais à tabela do livro em dobro, nada vazando sem a marca, sem a Habilidade ou sem o addon, e o hover fechando |
| `t-treino-testes-resistencia` | o pacote Treino de Testes de Resistência, lido de `addons/treino-testes-de-resistencia.json`, e as quatro peças que ele pediu ao motor: `alvoTipo: "tr"`, o requisito `atributoDoAlvo`, `soAlvos` e o canal `proficienciaTRCasoJa`. ⚠ O "caso já seja" contando o TR da Classe nos níveis 8 e 13, o Completo diferente por TR, a marcação à mão que não compra o +1 no jogador, o orçamento da criatura e a linha morta da linha repetível |
| `t-novo-estilo-sombras` | o Novo Estilo das Sombras pela Expansão (2026-10-04): a progressão própria das Técnicas (2 no Nível 4, +1 em 7, 10, 13, 16 e 19), a Técnica da Expansão fora do contador de Habilidades, a convivência com as Técnicas `legacy` (que seguem no contador), a vaga `vagasEstilo` somando na progressão e a sobra indo para as legacy, o caminho legacy ignorando a Técnica nova, e a normalização. Até 2026-10-04 o arquivo com este nome testava o Dançarino das Lâminas |
| `t-estilo-sombras-metricas` | os efeitos da Expansão no número FINAL da ficha, nos dois sistemas: o catálogo dos 11 efeitos e a repetição de cada um, o orçamento (DOM + Exaustão), Defesa e a 2ª compra só para aliados, TR só no escolhido, Acerto somando por compra, Perícia, Bônus de CD, Deslocamento 4,5 m, Dano, Alcance, Margem (1 no 9, 2 no 13, nada no 4), Ataque com Gatilho, uma Técnica por vez, e o E-03 (o Domínio liga sem Técnica) |
| `t-estilo-sombras-validacao` | a validação da Expansão (DA-07), nos dois sistemas: efeitos acima do limite, teto de compras, escolha pendente e efeito desconhecido viram ERRO, a Técnica inteira fica sem efeito no número final e os dados ficam na ficha. A progressão estourada invalida todas as Técnicas. AVISO (Efeito Especial) e INFO (gatilho da borda) não bloqueiam, e o Especial não escreve a vaga do próprio Estilo |
| `t-estilo-sombras-aptidoes` | as modificações de Aptidão da Expansão, nos dois sistemas: toda Aptidão e categoria citadas existem, metade do AU para cima (1, 1, 2, 2, 3) na Aura Reforçada, a 2ª compra só para aliados, o Cobrir-se ganhando o extra só quando é usado, Aptidão ausente, de Domínio, errada e sem número viram erro, Energia Reversa ofensiva sem ER, a Cortina sem mudar o raio, e o Punho Divergente com CD + CL só dentro da Técnica |
| `t-estilo-sombras-requisitos` | Pré-Requisito, Contra-Ataque, crítico e Exaustão da Expansão, nos dois sistemas: Fácil a Impossível no efeito apontado (AU 2 dá 1, 2, 2, 3, 3), a Aptidão real intacta, sem vaga e sem vazar para outro efeito, proibido no Ataque com Gatilho e no Contra-Ataque, aviso em efeito por BT; o Contra-Ataque com 1 vaga cada, até o BAR, nos degraus 1-2, 3-4 e 5, sem Reação; o crítico com 1 vaga por modificação, CD + BAR, aviso, e Extrema recusada; a Exaustão no limite e no que a Técnica gera |
| `t-estilo-sombras-sessao` | a sessão, a Ficha Final e o Encontro da Expansão, nos dois sistemas: o interruptor "Domínio Simples" com a "Técnica Atual" (a inválida marcada), a Exaustão só ao FECHAR (nunca ao ligar, imbuir ou trocar), uma vez por fechamento, as Técnicas trocadas no meio somando uma vez cada, a inválida e o Domínio sem Técnica sem Exaustão, o derive dizendo o que está no ar (só em combate), o contador dos Ataques com Gatilho por rodada, a linha da Técnica e a do Domínio Simples na Ficha, e o Funcionamento Básico do Estilo |
| `t-estilo-sombras-migracao` | a migração LEGACY e os Addons da Expansão, nos dois sistemas: os números das Técnicas antigas (tabela com e sem `tipo`, Especial com `custoImbuicao`, o recipiente `modificacao`, o Liberto) MEDIDOS no commit anterior à Expansão e fixados, nada convertido sozinho, o cru da ficha intacto, o rótulo "Domínio Simples" e a variável `estilo_<id>`; a conversão manual (Modificação com o efeito, `legado`, o Acerto pedindo a escolha, a Especial com as mesmas linhas); o Lime Neds seguindo LEGACY; e o pacote com `regra: "expansao"` no validador e no número final, inclusive inválido acima do limite |
| `t-dancarino-estilo` | o Dançarino das Lâminas dentro de Técnicas de Estilo Especial (o antigo `t-novo-estilo-sombras`, renomeado em 2026-10-04 sem mudar o conteúdo) |
| `t-tr-mestre-jogador` | o Teste de Resistência Mestre que voltou só no jogador (divergência `trMestreDoJogador`): o dado nas seis classes, a escolha gravada do TR da Classe (`trDaClasse`), o degrau do 8 para o 9, o segundo TR (`trSegundo`) só depois do da Classe, o Restringido mestre nos dois, o Mestre só da Classe inicial, a criatura intocada, a marcação à mão convivendo e ⚠ o aviso `semFonte` da marcação à mão acima das fontes (Classe e Motor), só no jogador |
| `t-desenvolvimento-inesperado` | o Desenvolvimento Inesperado do Derivado (divergência `desenvolvimentoNoNivel`): na criatura o quadro sobe valor e limite, no jogador o ponto entra livre no contador de Pontos de Nível (`attrNivelExtra`, 1 a cada 4 níveis) e o quadro sobe só o limite, os hovers de valor e de limite, o Inato sem nada, e a ficha salva com pontos no quadro antigo lida como escolha de limite |
| `t-tr-caso-ja-seja-classe` | o "caso já seja" da Força Imparável e da Resiliência Melhorada enxergando o TR da Classe no jogador (o `prof_tr_*` com a faixa da Classe, 2026-10-03): Mestre no TR da Classe e no segundo TR do nível 9, Treinado fora dela, o hover, o orçamento parado e a criatura intocada |
| `t-montante-bancada` | o montante sem bancada (2026-10-03): a Atenção em combate do Instinto Sanguinário nos dois sistemas, com o hover e uma linha só, a regra do `separarEfeitosDeBancada` caso a caso (`quando` e `expr`, nome normalizado, texto entre aspas, função, `contextoDsl`, canal lido cedo que fica) e um Voto Mecânico "em combate", que é texto livre do montante |
| `t-combatente-revisao` | a revisão do Especialista em Combate contra o livro (2026-09-23): a progressão nos níveis 1, 4, 6, 8, 12, 16 e 20 (PV, PE, Bases, Estilos, Posturas, Implemento, Estilo Defensivo, Duelista e Preparo), ⚠ nenhum bônus do Combatente vazando para Feitiço nem para a jogada Amaldiçoada, o Espírito Incansável na régua de cada sistema, a trava de "Pré-Requisito: Nível N" das opções pelo nível de escalonamento (Posturas, Feitiço Rápido e Apoio Estratégico), a escolha do Grupo Favorito e o Preparo na sessão, e os três pontos de verificação que eram erro: o Estilo Massivo UMA vez na arma Pesada e de Duas Mãos (alvo com "ou") e na Versátil nas duas mãos, a Postura da Lua tirando o atributo do dano no jogador (e não sob o Invencível sob o Sol), e o teto da Precisão Definitiva pelo escalonamento na multiclasse |
| `t-combatente-automacoes` | as automações do Especialista em Combate (2026-09-23 e 24): o canal `alcanceArma` (Extensão do Corpo, Sincronia Perfeita e o Longo do Golpe Especial, nos dois alcances e antes do dobro do Céu), o Manejo Único somando uma propriedade, a Brutalidade pelo escalonamento, ⚠ o treino de equipamento só da Classe inicial no jogador com o Golpes Potentes na arma `treinada`, a casca de Preparo da Postura do Céu (topa, é gasta primeiro, some no descanso), o contador de usos das seis habilidades e o montador do Golpe Especial (custo, mínimo de 1 PE, Preciso por rodada, Autossuficiente uma vez por cena, Sacrifício e as marcas que ficam) |
| `t-caracteristicas-amaldicoadas` | o MECANISMO das Características Amaldiçoadas com um pacote de teste próprio: `alvos` e `escolha:<id>` (sem resposta o efeito não entra), `opcoes`, o sufixo do alvo composto, `incompativeisIds` nos dois sentidos, o dado em perícia (`dadosPericia`) e o validador da família |
| `t-funcionamento-addon` | o Funcionamento Básico, os modelos de Feitiço e os Estados de Combate trazidos pela cópia congelada do addon: validação, namespace, texto, efeito pelo `deriveAfty`, acesso por Nível de Feitiço, opções por nível e isolamento entre combatentes |
| `t-manipulacao-ceu` | os dois Feitiços de Nível 5, o custo padrão de Refletir Imagem, o custo máximo de Duplicata Perfeita, o contador de duas cópias e a Aura Embaçada em 20%, 30% e 40% |
| `t-dominio-barreira` | a Expansão de Domínio lendo o Motor: os seis canais e o passe pós-aptidão em que rodam, as 4 etapas do Treino de Domínios medidas uma a uma, o Conflito de Domínio, a fórmula das duas aptidões de barreira verbatim, a Cortina valendo 3 paredes e o domo 12, o ciclo inteiro da casca de PE (da cena ao descanso), e ⚠ o assert de ARQUIVO que amarra o `Vital` compartilhado, porque assert de lógica não pega componente duplicado |
| `t-tecnica-maxima-modelo` | a Técnica Máxima como Feitiço (2026-10-08), nos dois sistemas: a Aptidão concede uma vaga própria (`vagasTecnicaMaxima`), a oficial sai do orçamento comum e a LEGACY continua nele, o excesso e a Aptidão perdida deixam a TM salva e inválida, as naturezas permitidas e proibidas, o requisito de Nível 4 de verdade, e a porta da Expansão em Tipo de Especial (o rascunho em branco sai, o preenchido fica) |
| `t-tecnica-maxima-escala` | a escala derivada: com acesso ao Nível 4 a TM calcula como Nível 5, com acesso ao 5 usa a linha `max`, sempre a 25 PE, e as regras de identidade (Golpeador, Shikigami, Transformação) seguem a TM e não a escala |
| `t-tecnica-maxima-recarga` | a recarga `6 − piso(BT / 2)`, o Manual de Técnica, o Usar da sessão (PE e recarga), o Shikigami aguardando dissipar, a virada de rodada e o descanso |
| `t-tecnica-maxima-custo` | os 25 PE com as reduções genéricas de Feitiço (Dominância, Manipulação Perfeita, `custoPE`, Condenado) e o piso de 1 PE. ⚠ Prende também o conserto do mesmo dia: o `custoPE` do estágio principal não chegava a Feitiço nenhum desde 2026-09-09 |
| `t-tecnica-maxima-dominio` | a TM dentro da Expansão no ar: 25 − DOM, o Ritual da natureza, a Amplificação de dano e de CD, a recarga intacta |
| `t-dominio-versoes` | as três versões: custos 15, 20, +5 e Sem Barreiras sempre 25, duração, área ("Definida pela Mesa" na Sem Barreiras oficial), Acerto Garantido só com a Aptidão e nunca na Incompleta, versão perdida avisando |
| `t-dominio-efeitos` | as onze tabelas do Guia nos DOM 1 a 5, o Fortalecer pelo piso da metade e repetível, o teto da Incompleta, a RD por tipo escolhido, as Condições pelo orçamento em dados, e o que o editor lê (`resolucaoDoEfeito`) |
| `t-dominio-motor` | a Expansão no Motor por fase (Confronto e Estendido sem nada), os efeitos base, o Ritual por categoria, a Amplificação nos Especiais de dano, o +2 de Confronto, o `custoPE` com escopo `dominio` e a CD só de Feitiço |
| `t-dominio-acerto` | o Acerto Garantido estruturado (tipo, referências, letalidade), o modo anterior que escreve o mesmo texto e não muda o JSON, a Abertura de 0,2 Segundos do não letal, o Desmembramento proibido, e o Motor do Efeito Especial só nos canais permitidos |
| `t-dominio-sessao` | a Expansão na sessão: abrir pagando PE, as fases, a duração fechando sozinha, o domo a zero, a Exaustão de Técnica (1, 2, 4, 5) começando no fechamento e não na interrupção, o descanso, o fim do combate, e a TRAVA no derive (Feitiços indisponíveis, Passivos fora do Motor) |
| `t-dominio-migracao` | nada migra: a Expansão gravada antes fica byte a byte igual e é lida no regime de antes, a sessão antiga continua valendo, e o modelo de TM de Addon só aparece com vaga e nasce oficial, sem converter a cópia LEGACY |
| `t-dominio-corpo` | o corpo da Expansão que a Ficha desenha: a Execução em Ação Comum com os requisitos, os efeitos desta Expansão e os de toda Expansão, o domo por versão, e o Acerto Garantido no modo anterior com o texto de sempre |
| `t-herdeiro-celeste` | a origem Herdeiro Celeste, lida de `addons/herdeiro-celeste.json`, nos dois sistemas: o pacote valida, as três características, a RD geral igual ao BT com a fonte nomeada, e o canal `voo` (1,5 × BT, hover, zero para quem não voa, as condições do movimento valendo nele, o Caído zerando só o voo, o multiplicador e a soma de fontes) |
| `t-nao-feiticeiro` | a origem Não-Feiticeiro, lida de `addons/nao-feiticeiro.json`, nos dois sistemas: o pacote valida, Estamina e nenhuma trilha com a classe Lutador (`semEnergia`), o nível travado em 10, Feitiço só Passivo e Personalizado até o Nível 2, a Arma Masterizada (`armaEscolhida`, alvo `@`, `treinoArmaCasoJa`: metade do BT na arma que já soma, o BT na que não soma), o ARMA!!!, os dois contadores, o Perceber o Ar concedido sem vaga, a Artimanha na Ficha e o Bônus em Atributo Mental e Físico |
| `t-espirito-indomavel` | o treino exclusivo do Não-Feiticeiro, lido de `addons/espirito-indomavel.json` com o Não-Feiticeiro 1.1.0, nos dois sistemas: só a origem alcança a linha, as quatro etapas uma a uma (+4 PV, Vontade treinada, +3 no corpo a corpo e não na distância, o Determinado a Viver concedido sem vaga e inacessível abaixo de Constituição 16), a Artimanha a mais abrindo só com o treino completo (`requerTreinoCompleto`), e o id de outro pacote que não ganha prefixo de novo |
| `t-aberracao-humanizada` | o pacote Aberração Humanizada: limite 30 nos seis atributos, distribuição 3/2, pool de Anatomia, PE e vagas da Natureza, Maldição e Energia Reversa acessíveis juntas, os dois Talentos do Feto no nível 6, isolamento e desinstalação |
| `t-yna` | o pacote Yna, lido de `addons/yna.json`, nos dois sistemas: as Caudas nível a nível com o contador de marcos e o teto 10, a Lapidação Prateada ligando em 5 Caudas, o Atletismo Treinado ou Mestre do Salto Gravitacional, o pool de Anatomia do Feto numa origem de Addon (com a Atenção em combate do Instinto Sanguinário), ⚠ a Forma de Raposa como `gatilhoSessao` de ORIGEM (desligada por padrão, valendo fora de combate), os dois treinos e a linha "Caudas: N" da Ficha |
| `t-ficha-linhas` | o que a linha da Ficha Final mostra, nos dois sistemas: a categoria curta (`tab`) em toda Aptidão das sete categorias, ⚠ as Anatomias escolhidas como linha logo abaixo da característica do pool (Feto, Kitsune e Aberração Humanizada) com o texto do livro e pelo MESMO filtro do Motor (origem sem pool: nem linha nem número), e a trava de que nenhum `.afty-chip` usa o `hidden` do Tailwind, que perde para o `display` do chip |
| `t-espinho` | os pacotes Espinho e Alter, lidos de `addons/`, nos dois sistemas: os tetos pelo BT e ⚠ o Alter com UM piso só no fim, cada compra medida como diferença no orçamento certo (vagas, Aptidões, Nível de Aptidão, Focos, Perícias, Alto Nível, Pontos de Atributo), o Aumento de Alma em pontos no jogador e em porcento na criatura, o Talento Adicional sem gastar vaga e fora do seletor, o item marcado virando Grau Especial por derivação com a Habilidade Única do Aprimoramento na família da primeira e sem Slot de Feitiço, os avisos (teto, nível, marcado que sumiu) sem remover nada, e nada rendendo sem o pacote nem mudando sem o `permite` |
| `t-balanceada` | os encantamentos Balanceada e Marcial só nas quatro Manobras, nos dois sistemas: ⚠ nenhum dos dois pode tocar Concentração, Fintar, Provocar e Teste de Morte, a Balanceada nos dois lados e o Marcial só no executar, duas armas Balanceadas (ou uma comprada e outra pelo Manejo Especial) dando +2 e não +4, e o alvo `manobra:todas` escrito à mão no Motor |
| `t-feiticos-permutativos` | o Feitiço Permutativo (2026-10-02, decisões em `docs/afty-feiticos-permutativos.md`): as cinco trocas com taxa e teto, o exemplo do livro aparando no teto, a Margem Nível 1 só pela troca (e a de Nível 0 com Um Único Evento), ⚠ a troca entrando NO FIM sem dobrar nem dividir, o Múltiplos Efeitos com o teto pelo nível do efeito e as combinações proibidas, a célula especial sem troca, e na Ficha o declarado contra o emitido, ⚠ o ganho E o prejuízo FORA do pool (duas penalidades somam, o ganho soma por cima do vencedor), as três travas ao ligar e a Margem só nas armas com margem a perder, nos dois sistemas |

### Invocações e Controlador

A atualização de Controlador e Invocações (2026-09-30 e 2026-10-01, doze etapas) tem uma suíte por
assunto. As decisões que elas medem estão no topo de `docs/afty-invocacoes.md`.

| Arquivo | O que verifica |
|---|---|
| `t-controlador` | as 47 habilidades de Controlador, LIGADAS e DE MESA, e os efeitos de cada uma na invocação |
| `t-controlador-progressao` | o roster nível a nível (recebidas, comandos, grau, Disperso, Concentrado), os dois níveis (real e escalonamento), o Sintonizado, o Concentrar Poder só com UMA em campo, a Reserva, a Autonomia, a Sobrecarga, o Fantoche e o Controle Aprimorado |
| `t-invocacoes-motor` | ⚠ o VERMELHO CONHECIDO (a Livre com Motor e a cota base, pergunta ao autor). O resto: os canais da invocação e o Motor nas Características |
| `t-invocacoes-mesa` | a sessão de mesa: dano, cura, campo, auxílios, descanso e apara |
| `t-invocacoes-fontes` | o hover de cada número da invocação fechando com o valor |
| `t-invocacao-escrita` | a linha do jogador com `escopo: "invocacao"` chegando na invocação |
| `t-invocacao-tipos` | a tabela de regras por tipo (Shikigami, Técnica, Maldição, Marionete, Corpo) e os sinais de DSL, com o LEGACY `tipo_shikigami` |
| `t-invocacao-estados` | os estados de mesa, a queda por tipo, o formato antigo de três booleanos e a entrada em campo com PE |
| `t-invocacao-custo` | o custo em partes e o orçamento separado (gratuitas, compradas, concedidas) |
| `t-invocacao-caracteristicas` | o catálogo de Características do *Adicionais* (Modificadoras), a TR Treinada e Mestre e a lista fechada de dado extra |
| `t-invocacao-intrinsecas` | as Intrínsecas, as Auras (só no dono, iguais não acumulam) e as Formas de Arma e de Armadura |
| `t-invocacao-tipos-especiais` | Marionete, Corpo (duração, manutenção, refeição), Maldição (Visionário, ficha adaptada, Nível de Aptidão), o Fundamento e a Técnica Inata bloqueada, e o cache do Encontro (E-13) |
| `t-invocacao-compostos` | Horda (E-02, E-07, Hoste, Líder de Horda, a mesa), Quimera do Mecânicas, Corpo de Múltiplos Núcleos e Mecha |
| `t-invocacao-heranca` | a Herança das Sombras persistente: cópia congelada, efeitos, acúmulo e a Herança que passa adiante |
| `t-invocacao-acoes-adicionais` | as regras de Ação do *Adicionais*: Reação, Manobra, Reduzir Cura e Cobertura |
| `t-quimera` | a Quimera do addon (LEGACY): PV, custo, treinos e atributos |
| `t-dez-sombras` | a Herança e a Quimera por marcador com `fontes` (o exemplo antigo, que segue valendo) |
| `t-estrela-zenin`, `t-maldicao`, `t-tita` | o clã com shikigamis, a Maldição e o Titã |

⚠ O `t-exemplo` é o mais importante de manter: ele garante que o JSON que está escrito no doc
realmente funciona. Foi ele que achou a lacuna do `efeitos` que era validado e nunca aplicado.

## Como escrever mais um

Copie a cabeça de qualquer um deles. O contrato é curto:

- importe **`afty-derive.js` primeiro**, sempre (ver a ordem, abaixo);
- use o mesmo `t(nome, achou, esperado)` e o mesmo par `ok` / `bad`;
- termine com a linha do `console.log` e com `process.exitCode = bad.length ? 1 : 0;`, porque é
  ela que o lançador lê;
- chame `limparAddons()` no fim se mexeu no mundo, para não deixar sujeira.

⚠ **Ordem de importação:** todo arquivo importa `afty-derive.js` primeiro. Importar
`afty-habilidades.js` como primeiro módulo estoura um ciclo em `afty-combate.js`
(`Cannot access 'POSTURAS_DE_COMBATE' before initialization`), e isso é anterior a este trabalho
(ver `docs/a-fazer.md`).
