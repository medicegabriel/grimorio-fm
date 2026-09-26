# Asserts do Afty

Os asserts de lógica do lado do Afty. São **3265, em 62 arquivos**, e cobrem o avaliador do DSL, as
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
| `t-adaptacao` | o ciclo do Mahoraga: giros, rodada automática, marcos, Narrativa, Mecânica e escolha aninhada de Acerto |
| `t-primitivas` | o campo `permite`: quem enxerga cada primitiva de Addon, e a prova de que criatura raw não vê nenhuma |
| `t-estilo-liberado` | o campo `libera`: o Estilo das Sombras fora do Sem Técnica, o Gêmeo copiando do Sem Técnica em Verdadeiras Origens, e a QUARTA trava (o card aparecer na aba) |
| `t-estilo-marcial` | a liberacao `feiticosRestritos`: a aba de Feiticos aberta para quem nao conjura e ao mesmo tempo estreitada a Passivo e Personalizado, a terceira porta (ficha com Feitico gravado ve o card sem addon nenhum), a prova de que ela nao tira tipo de quem ja conjurava, o ponta a ponta dos dois tipos (o Passivo somando RD e o Personalizado cobrando o custo do nivel), e a lista de tipos VAZIA, que e resposta e nao falta de dado |
| `t-remendo` | o campo `substitui`: trocar campo de entrada do livro, o id que não se mexe, o alvo que precisa existir, dois pacotes na mesma linha e a volta ao raw ao desinstalar |
| `t-cesta-oca` | o addon `era-da-cesta-oca`, um remendo de UM requisito: Mestre em História sai da Cesta Oca de Vime e ⚠ a CONTRAPROVA de que BAR 1 e ND 5 continuam travando, mais a entrada do livro intacta em todo campo que o remendo não citou |
| `t-custo-pe` | o alcance do canal `custoPE`: os cinco gastos, o piso de 1 PE POR GASTO, base zero que continua zero, sem alvo valendo para todos e com alvo valendo para um, e ⚠ o assert de REGRESSÃO da Expansão de Domínio, que precisou nomear o alvo dela quando o canal cresceu |
| `t-vislumbre-celeste` | a Condição Corporal dos Seis Olhos: as contas dos dois blocos, ⚠ a prova de que eles NUNCA saem na mesma lista (o dia em que saírem, todo bônus dobra), a soma com o resto da ficha, o "de graça" medido contra o contador da aba, a redução ampla de PE chegando no Domínio Simples, e desinstalar devolvendo a ficha |
| `t-criacao-armas` | o padrão de Pontos de Criação do autor: os espelhos do livro dentro do módulo folha, o destino de TODA propriedade (preço, crédito, avaliação da mesa ou fora do padrão), as contas do dado, da margem, do custo, da técnica, dos espaços e da Pesada, e ⚠ a promessa do `permite` medida com a arma equipada, porque a bancada conta e avisa mas não escreve regra nenhuma |
| `t-estilo-conteudo` | o conteúdo do addon do Estilo: Domínio Simples reescrito, a Linha de Treinamento com `soDaOrigem`, os quatro Talentos de Origem, a vaga exclusiva de Estilo e o Estudo Amaldiçoado repetível |
| `t-gemeos-maldicao` | a liberacao `gemeosMaldicao` e a ORIGEM ESTRUTURAL: o Gemeo que copia da Maldicao perde a Energia Reversa e ganha a aba dela, medido pela igualdade com uma Maldicao de verdade |
| `t-bases-automaticas` | as Bases que a Especialização concede sozinha (`automatica: true`): quem recebe, o orçamento intocado, e a escolha aninhada que sobrevive à concessão |
| `t-pugilato` | Faixas, Manoplas e Soco Inglês alimentando o Ataque Básico: os cinco graus, o item que define o golpe, e o efeito de encantamento chegando na linha |
| `t-tamanho-pingente` | Crescimento Corporal repetível, redução de categoria, distância por tamanho e o Pingente de Amaterasu sob o sol ou com os três tesouros |
| `t-interludios` | a varredura das 12 Linhas de Treinamento: os 13 requisitos que deixaram de ser `nota`, a trava do Potencial Físico no Restringido, e ⚠ o assert estrutural que compara efeito DECLARADO contra efeito EMITIDO, para nenhum voltar a ser descartado calado |
| `t-flugel` | o pacote Flugel de ponta a ponta, lido do JSON em `addons/flugel.json` (ele saiu do bundle em 2026-09-01): instalação, Futen, Akutame, Alma Livre no nível menos 4, troca de atributo-chave, Treino não congênito, vagas conjugais, o interruptor de sessão `Cônjuge`, a Dupla Empenhada em metade do BT e ⚠ o Bônus do Cônjuge, que SUBSTITUI a perícia em vez de somar nela |
| `t-liberto` | o pacote Sem Técnica - Liberto, lido de `addons/sem-tecnica-liberto.json`: o verbo `variacaoDe` em cada trava do Sem Técnica (Feitiços, Estilo, Domínio Simples, qualificação, estrutura, Verdadeiras Origens) nos dois sistemas, cada degrau do Caminho até o Fim no nível exato, e a mãe recusada pelo validador |
| `t-maldicao-era-de-ouro` | o pacote Maldição - Era de Ouro, lido de `addons/maldicao-era-de-ouro.json`: a origem que se divide em Tipos, a mãe `maldicao` (⚠ o acesso às Aptidões de Maldição e a perda da Energia Reversa, que ficam vermelhos contra o motor da v1 e foi assim que o relato do autor foi reproduzido), o conteúdo real de cada Característica com escolha e a Ficha Final |
| `t-concentrar-poder-dobrado` | o pacote Concentrar Poder Dobrado, lido de `addons/concentrar-poder-dobrado.json`: as sete linhas de invocação copiando o raw, ⚠ a parcela do addon valendo a do livro em cada canal nos degraus 6, 12 e 18 dos dois sistemas, os totais iguais à tabela do livro em dobro, nada vazando sem a marca, sem a Habilidade ou sem o addon, e o hover fechando |
| `t-tr-mestre-jogador` | o Teste de Resistência Mestre que voltou só no jogador (divergência `trMestreDoJogador`): o dado nas seis classes, a escolha gravada do TR da Classe (`trDaClasse`), o degrau do 8 para o 9, o segundo TR (`trSegundo`) só depois do da Classe, o Restringido mestre nos dois, o Mestre só da Classe inicial, a criatura intocada, a marcação à mão convivendo e ⚠ o aviso `semFonte` da marcação à mão acima das fontes (Classe e Motor), só no jogador |
| `t-combatente-revisao` | a revisão do Especialista em Combate contra o livro (2026-09-23): a progressão nos níveis 1, 4, 6, 8, 12, 16 e 20 (PV, PE, Bases, Estilos, Posturas, Implemento, Estilo Defensivo, Duelista e Preparo), ⚠ nenhum bônus do Combatente vazando para Feitiço nem para a jogada Amaldiçoada, o Espírito Incansável na régua de cada sistema, a trava de "Pré-Requisito: Nível N" das opções pelo nível de escalonamento (Posturas, Feitiço Rápido e Apoio Estratégico), a escolha do Grupo Favorito e o Preparo na sessão, e os três pontos de verificação que eram erro: o Estilo Massivo UMA vez na arma Pesada e de Duas Mãos (alvo com "ou") e na Versátil nas duas mãos, a Postura da Lua tirando o atributo do dano no jogador (e não sob o Invencível sob o Sol), e o teto da Precisão Definitiva pelo escalonamento na multiclasse |
| `t-combatente-automacoes` | as automações do Especialista em Combate (2026-09-23 e 24): o canal `alcanceArma` (Extensão do Corpo, Sincronia Perfeita e o Longo do Golpe Especial, nos dois alcances e antes do dobro do Céu), o Manejo Único somando uma propriedade, a Brutalidade pelo escalonamento, ⚠ o treino de equipamento só da Classe inicial no jogador com o Golpes Potentes na arma `treinada`, a casca de Preparo da Postura do Céu (topa, é gasta primeiro, some no descanso), o contador de usos das seis habilidades e o montador do Golpe Especial (custo, mínimo de 1 PE, Preciso por rodada, Autossuficiente uma vez por cena, Sacrifício e as marcas que ficam) |
| `t-caracteristicas-amaldicoadas` | o MECANISMO das Características Amaldiçoadas com um pacote de teste próprio: `alvos` e `escolha:<id>` (sem resposta o efeito não entra), `opcoes`, o sufixo do alvo composto, `incompativeisIds` nos dois sentidos, o dado em perícia (`dadosPericia`) e o validador da família |
| `t-funcionamento-addon` | o Funcionamento Básico, os modelos de Feitiço e os Estados de Combate trazidos pela cópia congelada do addon: validação, namespace, texto, efeito pelo `deriveAfty`, acesso por Nível de Feitiço, opções por nível e isolamento entre combatentes |
| `t-manipulacao-ceu` | os dois Feitiços de Nível 5, o custo padrão de Refletir Imagem, o custo máximo de Duplicata Perfeita, o contador de duas cópias e a Aura Embaçada em 20%, 30% e 40% |
| `t-dominio-barreira` | a Expansão de Domínio lendo o Motor: os seis canais e o passe pós-aptidão em que rodam, as 4 etapas do Treino de Domínios medidas uma a uma, o Conflito de Domínio, a fórmula das duas aptidões de barreira verbatim, a Cortina valendo 3 paredes e o domo 12, o ciclo inteiro da casca de PE (da cena ao descanso), e ⚠ o assert de ARQUIVO que amarra o `Vital` compartilhado, porque assert de lógica não pega componente duplicado |

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
