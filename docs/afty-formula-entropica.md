# Fórmula de Combate Entrópica (Addon)

Homebrew suplementar de **Dr. Xeno**, pedida como Addon pelo autor em 2026-09-28 para um amigo que
conhece pouco o sistema. O objetivo é deixar tudo "mastigado": a ficha faz a conta, mostra a CD e
conta os usos, em vez de o jogador ler regra na mesa.

O PDF original tem 24 páginas (duas são capa e uma está em branco). A transcrição fiel está no fim
deste documento, na seção **Fonte**, e é ela a fonte de verdade: o PDF pode sumir.

## Estado

| Fase | O que é | Estado |
|---|---|---|
| 0 | Fonte, mapa e perguntas | feita (este documento) |
| 1 | Motor: Restringido aceita variação | feita em 2026-09-28 (`asserts/t-restringido-variacao.mjs`, 52) |
| 2 | Núcleo do Addon: origem, Talentos de Origem, classe herdeira, Dádivas | feita em 2026-09-28 (`addons/formula-combate-entropica.json`, `asserts/t-formula-entropica.mjs`, 102) |
| 2b | Engenho Superior ligado à Criação de Equipamentos (decisão 14) | não começada, pede leituras próprias |
| 3 | Doutrina da Guerra Matemática e Técnicas Marciais | não começada |
| 4 | Arsenal: card de Preparação de Terreno, M.E.D.U.S.A., Bomba Atômica | não começada |
| 5 | Veículos como Invocação de ficha fixa | não começada |

Cada fase termina com uma parada para o autor testar. As perguntas de regra de cada fase são feitas
antes de ela começar.

## Decisões do autor (2026-09-28)

1. **Variação do Restringido.** A Restrição Intelectual é uma origem de Addon com
   `variacaoDe: "restringido"`, e a classe é uma Especialização herdeira (`herdaDe: "restringido"`)
   que recebe as habilidades do Restringido e troca só as peças do PDF. Molde:
   `addons/especialista-em-estilo.json`. A alternativa descartada era uma origem própria com classe
   livre, que perdia as Bases do Restringido e contrariava o *"Assim como um Restringido"* do texto.
2. **Dispositivos num card de Preparação** na Ficha Final, e não como itens no inventário: preparar
   não é comprar, e a CD tem de aparecer na linha.
3. **Veículos como Invocação com ficha fixa** (PV, Defesa, movimento e ataques do PDF), com as
   Melhorias escolhidas em até 3 vagas.
4. **Vale nos dois sistemas.** Todo verbo novo de motor é genérico e é testado na criatura (`/Afty`)
   e no personagem (`/Player`).
5. **As Bases do Restringido ficam todas** (Ataque Furtivo, Versatilidade, Esquiva Sobre-humana,
   Implemento Celeste, Libertação do Destino e as demais). Só o Restrito pelos Céus e a Restrição
   Definitiva são trocados pelas versões do PDF. A resposta veio com um "Other" sem texto, lido como
   "as outras também ficam".
6. **Só a INT vai a 30.** Força, Destreza e Constituição ficam no limite comum, e a variação não leva
   o limite 30 que o Tipo Restringido dá na criatura.
7. **Defesa: INT no lugar do bônus físico.** A Destreza continua na base, e o *"+ Força ou
   Constituição na Defesa, limitado pelo nível"* do Restrito pelos Céus vira *"+ Inteligência,
   limitado pelo nível"*.

8. **A Restrição Definitiva Intelectual substitui a do livro inteira** (sem Nível de Dano +1, sem
   +3 m, sem BT inteiro em perícia física de Mestre).
9. **Sem a escada do desarmado do Restringido** (*"por não ser um restringido focado em força"*).
10. **Bônus em Atributo: 4 pontos no total**, até +3 por atributo, e UM desses 4 pode ir para
    qualquer atributo. Os outros vão para os mentais.
11. **Dádivas Intelectuais no calendário das Dádivas do Céu** (4, 8, 12, 16 e 20), e o Respeito
    Celeste dá mais uma no 8 e no 12, do mesmo pool.
12. **Cálculo de Precisão e Análise Balística usam Inteligência.**
13. **A Inferência Rápida SOMA com a Restrição Congênita**: dois contadores, +1 por falha até o BT e
    +2 por falha até o BT.
14. **Engenho Superior liga à Criação de Equipamentos.** Pede leituras próprias, e virou etapa
    separada (ver o Estado).
15. **Análise de Campo é uma vez por combate**, com contador.
16. **INT no acerto E no dano**, quando for maior que FOR ou DES, como as Técnicas de Combate.
17. **Dádiva com contador ou número calculado vira linha própria na Ficha Final**, logo abaixo da mãe.
18. **O bônus contra o mesmo inimigo vale em ataque, TR e perícias** (os dois contadores).

## O que a Fase 2 entregou

O pacote `addons/formula-combate-entropica.json` (autor Dr. Xeno), que é o que se cola na aba Addons.

- **Origem Restrição Intelectual**: variação do Restringido, INT a 30, Bônus em Atributo de 4 pontos
  (um livre), a Restrição Congênita com +2 de INT a cada 6 níveis, Análise de Campo (1 por
  combate, "Bônus dos Aliados" e "Turnos" prontos), Engenho Superior (texto, espera a 2b) e
  Estratagema de Guerra (contador de aliados e o bônus pronto).
- **Especialização Restringido Intelectual**, herdeira do Restringido. A Restrição Congênita
  Intelectual ocupa o Restrito pelos Céus: INT na Defesa (limitada pelo nível), INT no acerto e no
  dano, o contador "Falhas Contra o Alvo" (até o BT, +1 em ataque, TR e perícia por falha) e o
  estado "Mesmo Feitiço Duas Vezes Seguidas" (RD igual ao BT). A Restrição Definitiva Intelectual
  substitui a do livro, com o contador de 1 reação por rodada.
- **11 Dádivas Intelectuais do Céu**: a Inferência Rápida soma +2 por falha no mesmo contador (até
  o BT), a Hipótese Adaptativa tem "Redução" pronta e o estado de +2 de RD, e Cálculo Instantâneo,
  Logística de Campo, Memória Tática, Estratégia Ilusória e Cálculo de Precisão têm contador.
- **8 Talentos de Origem** com os requisitos do PDF. Com número: Observador Incansável, Planejamento
  Perfeito (Iniciativa na primeira cena), Leitura Antecipada (+2 de Defesa na reação),
  Contra-Medida Rápida (metade do BT no TR). Com contador ou número pronto: Diretivas de Combate,
  Análise Balística, Banco de Contingências.

Verbos de motor que a fase pediu (detalhe no `docs/afty-addons.md`, seção "O que a Fórmula de
Combate Entrópica acrescentou ao motor"):

| Verbo | Onde |
|---|---|
| `bonus.livres` na distribuição de atributo da origem | `AftyCreatureBuilder.jsx` (o alocador) |
| canal `ataqueAtributo`, com a primitiva de mesmo nome | `afty-pericias.js` (acerto e dano), `afty-efeitos.js` |
| teto de `faixa` por expressão nos estados de Addon | `estadosCombateDeAddon` em `afty-addons.js` |
| `efeitos` escritos na opção de escolha aninhada | `coletarEfeitosDeEscolha` em `afty-efeitos.js` |
| `usos` e `resultados` em origem, Talento, Habilidade e opção | `mesa` em `afty-derive.js`, `ficha-conteudo.js` |
| recargas `cena` e `rodada`, devolvidas pela sessão | `USOS_RECARGAS`, `ficha/ficha-sessao.js` |
| porta `requerEscolha` nos estados de Addon | `comDono`, `ficha-buffs.js` e a bancada do criador |
| a variação não recebe a escada do desarmado | `afty-derive.js` |
| opção com contador ou número vira linha própria na Ficha | `ficha-conteudo.js` |

Conferido na tela (`/player`, 1440 e 390 px, console limpo): o cabeçalho, a aba Habilidades com os
contadores e os números, a aba Buffs com o grupo do pacote, o contador de falhas mexendo no acerto
(+16 para +22 com 2 falhas e a Inferência) e o criador com o distribuidor "1 em Qualquer".

Duas observações de tela, anotadas no `docs/a-fazer.md`:

- **Com o contador de falhas ligado, a Atenção sobe junto**, porque ela sai da Percepção e o bônus
  vale em toda perícia (decisão 18). Não mexi.
- **No telefone as linhas com contador espremem o nome.** Os números de mesa já saem da linha
  fechada abaixo de 560 px, mas as marcas das linhas (a origem, a Especialização, o Nível) deviam
  sumir no telefone pelo `hidden sm:inline-flex` e não somem, porque o `display` do `.afty-chip` no
  CSS da Ficha vence o `hidden` do Tailwind. É anterior a este pacote e vale para toda ficha.

## O que a Fase 1 entregou

- `restringido` em `VARIACOES_ACEITAS`, `ehVariacaoDoRestringido` (`afty-origens.js`) e
  `especializacaoMae` (`afty-especializacoes.js`).
- A variação força o Tipo Restringido, fica presa à própria herdeira (ou à classe do livro, se não
  trouxer uma) e não faz multiclasse.
- No jogador, a herdeira é sem energia: Estamina, zero Aptidões, zero orçamento de Feitiço.
- A herdeira publica o nível de efeito sob o nome da mãe, e as travas por id de habilidade
  (Restrição Definitiva, Imitação, Ainda de Pé, Roubo) enxergam o clone.
- Conserto da herança que valia para todo `herdaDe`: o clone do Respeito Celeste concedia as Dádivas
  extras ao Restrito pelos Céus do livro.
- Detalhe no `docs/afty-addons.md`, seção "A variação do Restringido".

## Mapa: o PDF espelha a classe Restringido

| PDF (página) | Peça do Restringido que substitui | Onde vive no site |
|---|---|---|
| Restrição Intelectual (2) | Origem Restringido | origem de Addon, `variacaoDe: "restringido"` |
| Talentos de Origem (3), 8 talentos | o Restringido não tem | família `talentos`, `grupo: "origem"` |
| Restrição Congênita Intelectual (4) | Ápice Corporal Humano e Restrito pelos Céus | origem (limite e alocação de INT) e remendo em `res_restrito_pelos_ceus` na herdeira |
| Restrição Definitiva Intelectual (4) | Restrição Definitiva (Base 10) | remendo em `res_restricao_definitiva` na herdeira |
| Dádivas Intelectuais do Céu (5), 11 | Dádivas do Céu | escolha aninhada da herdeira |
| Doutrina da Guerra Matemática (6) | Estilo Marcial, nunca enviado | habilidade da herdeira e estados de combate |
| Técnicas Marciais Nvl. 1 a 4 (7 a 10), 12 | técnicas marciais | modelos de Feitiço Personalizado. O custo 2/5/8/12 é a tabela `FEITICO_CUSTO_PE` |
| Arsenal das Possibilidades e Preparação de Terreno (11 a 17) | Arsenal Amaldiçoado, nunca enviado | card novo de Preparação de Terreno |
| M.E.D.U.S.A. e Bomba Atômica (18 e 19) | nada | dispositivos únicos no mesmo card |
| Veículos de Combate (20 a 24) | nada | Invocação do tipo Veículo, com ficha fixa |

## O que o motor precisa ganhar

Levantado em 2026-09-28. Cada verbo nasce com o seu portão (`permite` para tela, `libera` para regra).

| Verbo | Por quê | Fase |
|---|---|---|
| `restringido` em `VARIACOES_ACEITAS` e `especializacaoMae` | hoje uma origem de Addon não consegue ser sem energia no Player: o `semEnergia` lê o id literal da classe (`afty-derive.js:361`), e cerca de 30 travas comparam `"restringido"` cru | 1 |
| efeitos e usos inline em opção de escolha aninhada de Addon | `coletarEfeitosDeEscolha` (`afty-efeitos.js`) só lê o mapa estático, e várias Dádivas têm número | 2 |
| canal `ataqueAtributo` | não existe canal que troque o atributo do ataque por INT (o `finezaAtaque` só aceita DES) | 2 |
| teto de `faixa` por expressão em `estadosCombate` de Addon | o `max` de Addon só aceita número, e o "+1 cumulativo até o BT" pede `bt` | 2 |
| primitiva `preparacaoTerreno` e campo `dispositivos` | não há família de item para Addon nem contador de preparados | 4 |
| tipo de Invocação `veiculo` e campo `veiculos` | a Invocação tira PV, Defesa e movimento de fórmula por grau, e o veículo tem número fixo | 5 |

## Perguntas em aberto

Todas vão ao autor por pergunta com opções no começo da fase correspondente. Enquanto não houver
resposta, nada disto é decidido por suposição.

**Estrutura (fase 1 e 2)**
1. ~~Quais Bases do Restringido o Intelectual mantém?~~ Respondida: todas (decisão 5).
2. ~~O limite 30 físico do Tipo vale para ele?~~ Respondida: não, só a INT (decisão 6).
3. ~~A INT na Defesa troca a Destreza?~~ Respondida: a INT troca o bônus físico do Restrito pelos
   Céus, e a Destreza fica (decisão 7).
4. ~~A Definitiva Intelectual substitui ou soma?~~ Respondida: substitui inteira (decisão 8).
4b. ~~A Restrição Intelectual recebe a escada do desarmado?~~ Respondida: não (decisão 9).

**Origem (fase 2)**
5. ~~5 pontos ou 4?~~ Respondida: 4 no total, um deles livre (decisão 10).
6. O que são *"1.5x mais eficiência"* e *"até 2 efeitos especiais de grau"* no Engenho Superior?
   O autor decidiu ligar à Criação de Equipamentos (decisão 14), e as leituras vêm na etapa 2b.
7. ~~A Análise de Campo é uma vez por combate?~~ Respondida: sim (decisão 15).

**Dádivas (fase 2)**
8. ~~Níveis das Dádivas?~~ Respondida: os das Dádivas do Céu (decisão 11).
9. ~~Qual atributo?~~ Respondida: Inteligência (decisão 12).
10. ~~Inferência soma ou substitui?~~ Respondida: soma (decisão 13). Na ficha é o MESMO contador
    de falhas, e a Dádiva soma +2 por falha até o BT por cima do +1 da Congênita.

**Doutrina e Técnicas (fase 3)**
11. *"Pontos de Vigor"* na Doutrina é a Estamina (o PE)?
12. Quantas Técnicas Marciais ele conhece, e quando ganha novas? (O Desenvolver Ideias do Restringido
    dá "duas técnicas marciais".)
13. Nomes das duas Técnicas de Nível 4 que estão como "aaaaaaaaaaaaaaaaaaa".
14. O prejuízo do Alvo Previsível (metade do BT em Defesa e Acerto contra você) pode virar bônus DELE
    contra o alvo, que é o que a ficha dele consegue mostrar?

**Arsenal (fase 4)**
15. Dispositivo Adesivo, Campo Eletromagnético, Marcador Tático e Cápsula de Emergência estão com Modo
    de Instalação e Acionamento vazios.
16. A Mina Terrestre aparece duas vezes: Custo 2 (2d4 impacto + 1d6 perfurante, desorientado) e
    Custo 3 (5d8 impacto, sem desorientado). São duas versões?
17. Taser, Termita, Míssil Anti-Aéreo e Gás Mostarda só aparecem na lista de Itens. Entram na
    Preparação e contam no limite de BT?
18. O Custo (1 a 4) pesa na preparação (por exemplo, contando nos BT dispositivos) ou só na compra do
    item pelo orçamento de grau?
19. Quem pode ter a M.E.D.U.S.A. e a Bomba Atômica? E o Restringido, sem energia, rola Ofício de
    Canalizador?

**Veículos (fase 5)**
20. O Avião usa as mesmas Características do Tanque? O texto delas diz "tanque".
21. As duas listas têm uma "Motor Experimental" com efeitos diferentes. É o mesmo nome de propósito?
22. Como se obtém um veículo (custo, nível, aprovação do mestre)?
23. O bônus de ataque do veículo é fixo (+10 e +8) ou do piloto? O Sistema de Autopilotagem fala em
    INT do criador.

---

## Fonte

Transcrição fiel do PDF, com os erros do original. Correção só a pedido do autor.

### Restrição Intelectual (página 2)

Nem toda Restrição Celestial se manifesta através do porte físico. Em casos raros, um humano pode
nascer privado de sua Energia Amaldiçoada em troca de uma mente capaz de processar informações,
formular estratégias e compreender padrões em um nível além do comum. Aqueles que carregam essa
Restrição desenvolvem capacidades analíticas e criativas que desafiam a lógica, sendo capazes de
prever comportamentos, elaborar diversos e inúmerosos planos complexos em instantes e criar
invenções que ultrapassam os limites tecnológicos de sua era.

**Características da Origem**

**Bônus em Atributo.** Como um ser de extrema Inteligência você possui uma mente sem igual para todas
as pessoas de sua era, você recebe +4 pontos para distribuir entre os seus atributos mentais, com um
limite máximo de +3 no mesmo atributo e +1 o qual você pode distribuir em que quiser.

**Análise de Campo.** No início de cada combate pode gastar uma ação bônus para analisar o inimigo,
identificando fraquezas, hábitos e padrões comportamentais. Durante uma quantidade de turnos igual a
seu modificador de inteligência, os aliados que seguirem suas instruções recebem um bônus igual à
metade do seu BT (mínimo +1) em jogadas de ataque ou Defesa contra esse inimigo.

**Engenho Superior.** Sempre que o usuário cria ou modifica um equipamento, ele pode atribuir até 2
efeitos especiais de grau. Itens criados por ele têm 1.5x mais eficiência e se aliados usarem itens
do usuário, eles ganham vantagem na primeira rolagem que fizerem com ele.

**Estratagema de Guerra.** Durante um descanso curto, você pode elaborar planos e instruções para sua
equipe. Escolha um número de aliados igual ao seu modificador de Sabedoria (mínimo 1). Até o próximo
descanso, cada aliado escolhido recebe uma utilização de Estratagema. Quando ativado, o aliado pode
adicionar seu Bônus de Treinamento a uma jogada de ataque, Defesa ou Teste de Resistência após
realizar a rolagem até o final da cena.

### Talentos de Origem (página 3)

**Planejamento Perfeito.** Sempre que você tiver ao menos 1 minuto para preparar terreno, montar
posição ou armar emboscadas antes de um combate, o número máximo de armadilhas que você pode preparar
aumenta em 1 e a CD delas aumenta em 2. Além disso, na primeira cena de combate, você recebe bônus
igual à metade do seu BT em Iniciativa. **[Pré-Requisito: Inteligência 16]**

**Contra-Medida Rápida.** Quando um inimigo visível usar uma técnica, feitiço ou habilidade contra
você, você pode gastar sua reação para analisar sua execução. Ao fazê-lo, você recebe vantagem no
primeiro teste de resistência realizado contra aquele efeito e soma metade do seu Bônus de
Treinamento na rolagem. **[Pré-Requisito: Sabedoria 16.]**

**Inventor Prolífico.** O usuário consegue criar itens em metade do tempo normal e pode manter até 2
equipamentos ativos com efeitos extras simultâneos, desde que esses efeitos sejam diferentes entre
si. Além disso, se torna capaz de realizar testes com vantagem que envolvam a criação ou uma
modificação de equipamentos. **[Pré-Requisito: Inteligência 18, Percepção Mestre]**

**Leitura Antecipada.** Sua capacidade de interpretar linguagem corporal, padrões de movimento e
intenções hostis alcançou níveis excepcionais. Uma vez por rodada, quando uma criatura visível
realizar um ataque contra você, você pode utilizar sua reação para receber +2 na Defesa contra
aquele ataque. Caso o ataque erre, você recebe vantagem no primeiro teste realizado contra aquele
alvo até o fim do seu próximo turno. **[Pré-Requisito: Inteligência 16, Intuição Treinada e Mestre]**

**Diretivas de Combate.** Sua capacidade de coordenar aliados pode transmitir instruções precisas
mesmo durante o caos da batalha. Uma vez por rodada, quando um aliado em sua linha de visão realizar
uma jogada de ataque ou teste de resistência, você pode utilizar sua reação para conceder um bônus
igual à metade do seu Bônus de Treinamento naquela rolagem. Você deve declarar o uso antes de saber
o resultado. **[Pré-Requisito: Sabedoria 16, Intuição Treinada]**

**Análise Balística.** Após observar uma criatura por pelo menos uma rodada, você identifica falhas
em sua postura defensiva. Uma vez por turno, quando atingir uma criatura com um ataque realizado
através de uma ferramenta, arma ou equipamento criado por você, causa dano adicional igual à metade
do seu Mod de Atributo. **[Pré-Requisito: Inteligência 16, Percepção Treinada]**

**Banco de Contingências.** Você está sempre preparado para situações inesperadas. No início de cada
cena, escolha um número de itens comuns ou equipamentos criados por você igual ao seu modificador de
Inteligência. Enquanto estiver portando esses itens, você pode sacar ou guardar um deles uma vez por
rodada como Ação Livre. **[Pré-Requisito: Inteligência 18, Intuição Treinada ]**

**Observador Incansável.** Sua atenção aos detalhes dificilmente deixa algo escapar. Você soma metade
do seu Bônus de Treinamento em testes de Percepção e Intuição. Caso já seja Mestre em uma dessas
perícias, passa a somar seu Bônus de Treinamento nela. **[Pré-Requisito: Percepção Treinada ou
Intuição Treinada]**

### Restrição Congênita Intelectual (página 4)

Seu limite de atributo de Inteligência é 30 e, a cada 6 níveis, você pode aumentar em +2
Inteligência, no lugar de Força, Destreza ou Constituição. Além disso, você pode usar Inteligência
em vez de Força ou Destreza para realizar ações de ataque e para cálculos de Defesa. Sempre que você
falhar em um teste contra o mesmo inimigo, você recebe +1 cumulativo contra ele, até o máximo do seu
Bônus de Treinamento. Se um inimigo usar o mesmo feitiço contra você duas vezes seguidas, você recebe
redução de dano contra esse efeito até um limite igual ao seu bônus de treinamento.

Ao atingir o décimo nível, o usuário adquire a Restrição Definitiva Intelectual. Se tornando capaz de
prever padrões de energia amaldiçoada, mesmo sem possuí-la. Isso funciona como "ver a alma" do
inimigo, mas não apenas isso: você também passa a poder reagir antes de um ataque, 1 vez por rodada,
gastando sua reação para dar instrução a um aliado, permitindo que ele se mova 3m ou receba +2 de
Defesa extra. Além disso, qualquer salvaguarda envolvendo vontade ou astúcia que seja bem-sucedida é
considerada um sucesso crítico. Assim como um Restringido, o usuário é imune a expansão de domínio e
possui vantagem em testes de furtividade contra qualquer usuário de energia amaldiçoada, enquanto
possuem desvantagem em testes para percebê-lo. Além disso, devido ao seu intelecto aprimorado, além
disso por não ser um restringido focado em força ele adquire a mecânica única da restrição sendo ela
a Preparação de Terreno e Equipamentos.

### Dádivas Intelectuais do Céu (página 5)

**Cálculo Instantâneo.** Uma vez por rodada, você pode substituir um teste de Reflexos por um teste
de Vontade ou Astúcia, desde que ela dependa de leitura, reação mental ou previsão de movimento.

**Engenho de Batalha.** Ao adquirir uma dádiva que estende ainda mais os seus conhecimentos faz com
que os seus protótipos ou armadilhas durem o dobro do tempo e tenham CD +2.

**Logística de Campo.** No início de um combate, antes da primeira rodada, você pode reposicionar até
2 aliados em até 4,5 metros, desde que ambos estejam conscientes e possam ouvi-lo. Esse
reposicionamento não provoca ataques de oportunidade.

**Memória Tática.** Uma vez por cena, você pode repetir uma jogada de ataque ou teste de perícia de
um aliado, como se tivesse previsto a ação dele e a corrigido, qual o novo resultado substitui o
anterior. Ao atingir o nível 10 você passa a conseguir utilizá-la duas vezes por cena

**Inferência Rápida.** Sempre que falhar em um teste contra o mesmo inimigo, você recebe um bônus
cumulativo de +2 em novos testes contra ele até o fim da cena, até um máximo igual ao seu Bônus de
Treinamento.

**Rede de Comando.** Enquanto estiver consciente, todos os aliados em até 6 metros recebem +1 em
Defesa e +1 em Testes de Resistência, desde que possam ouvir suas instruções.

**Hipótese Adaptativa.** A primeira vez em cada combate que você sofrer dano de uma fonte, você reduz
esse dano igual ao seu modificador de inteligência + modificador de sabedoria. Além disso, até o fim
da cena, você recebe +2 de redução de dano contra o mesmo tipo de dano de um ataque.

**Estratégia Ilusória.** Uma vez por combate, quando um inimigo declarar um ataque contra você ou um
aliado em sua linha de visão, você pode impor uma nova rolagem para o ataque, obrigando-o a repetir o
teste contra sua CD. Se falhar, o ataque da criatura inimiga sofre desvantagem.

**Efeito Dominó.** Sempre que você derrubar um inimigo, pode imediatamente dar uma instrução a um
aliado visível para que ele se mova até 3m ou realize uma Ação Livre que ainda não tenha agido.

**Mapeamento Perfeito.** Você não pode ser surpreendido ou pego desprevenido em combate. Além disso,
sempre que rolar Iniciativa, os aliados que puderem ouvi-lo podem receber +2 na rolagem.

**Cálculo de Precisão.** Uma quantidade de vezes igual a seu modificador de atributo por descanso
longo, quando você ou um aliado errar um ataque, você pode corrigir a análise e adicionar +1d6 ao
resultado, representando um ajuste instantâneo de cálculo.

### Doutrina da Guerra Matemática (página 6)

Você analisa padrões de movimento, tempo de resposta e intenção do alvo, convertendo informação em
vantagem tática. Quanto mais o combate se repete, mais o campo passa a trabalhar a seu favor.
Durante o combate, você pode gastar sua ação bônus para analisar um inimigo visível e registrar seus
padrões. Faça um teste de Investigação ou Intuição contra Enganação ou Furtividade do alvo. Em caso
de sucesso, o alvo se torna previsível até o fim da cena. Em falha, nada acontece e o alvo fica
imune a novas tentativas de Análise de Padrão por 1 rodada. Você também pode tentar registrar um
inimigo sempre que ele realizar um ataque contra você, mesmo fora do seu turno, desde que não esteja
previsível. Enquanto estiver Previsível, o alvo sofre um prejuízo igual a metade do seu valor de
Treinamento em Defesa e Acerto contra você. Além disso, ele não pode usar reações para contra atacar
ou anular as suas técnicas marciais. Sempre que o alvo repetir uma ação idêntica como o mesmo
ataque, aptidão ou feitiço você ganha 1 acúmulo de Leitura Tática, até um máximo igual ao seu BT.
Cada acúmulo concede +1 em testes de resistência contra esse alvo, ou em rolagens de ataque contra
esse alvo por acúmulo, sendo a escolha do usuário. No início do turno, a partir da rodada seguinte
ao momento em que se tornou Previsível, o alvo pode tentar quebrar sua leitura realizando um teste de
enganação contra sua Investigação ou Intuição. Se vencer, ignora os efeitos de Alvo Previsível
apenas nesta rodada. Se falhar, permanece Previsível normalmente.

Uma vez por rodada, ao gastar uma ação de movimento e Pontos de Vigor iguais ao seu valor de
treinamento, você pode instruir um aliado que esteja em sua linha de visão. Até o início do seu
próximo turno, esse aliado recebe bônus igual à metade do seu treinamento em jogadas de ataque e
Defesa contra um alvo que você tenha tornado Previsível. Sempre que um inimigo Previsível for
derrotado, você pode transferir instantaneamente sua análise para outro inimigo, sem custo de ação.

### Técnicas Marciais (páginas 7 a 10)

Cada técnica traz Custo, Ação, Alcance, Duração e Alvo.

**Técnica Marcial [ Nvl. 1 ]-: Sinal de Prioridade**
Custo 2 PdE · Ação Comum · Alcance 6 Metros · Duração Imediata · Alvo Aliado ou Inimigo
Escolha um aliado ou inimigo visível em até 6m. Até o início do seu próximo turno, o primeiro aliado
que interagir ofensivamente com esse alvo recebe um bônus de +1 contra a criatura, entretanto para
isso deve ter preparado uma área com um marcador tático.

**Técnica Marcial [ Nvl. 1 ]-: Cobertura Instantânea**
Custo 2 PdE · Ação Reação · Alcance 6 Metros · Duração Imediata · Alvo Aliado
Quando um aliado em até 6m for alvo de um ataque que você possa ver, você pode impor cobertura
improvisada imediata. O aliado recebe +1 de Defesa contra esse ataque. Se houver uma Barreira
Improvisada ou uma cobertura preparada, o bônus aumenta em +2.

**Técnica Marcial [ Nvl. 1 ]-: Corredor de Evacuação**
Custo 2 PdE · Ação Comum · Alcance 12 Metros · Duração Imediata · Alvo Aliados
Escolha até 2 aliados em até 12m. Cada um pode se mover até 3m sem provocar ataques de
oportunidade, e ignora terreno difícil criado por seus próprios dispositivos até o início do seu
próximo turno. Se algum deles terminar o movimento ao lado de um equipamento seu, ele pode sacar ou
interagir com esse item como parte do mesmo deslocamento

**Técnica Marcial [ Nvl. 2 ]-: Sincronização de Arsenal**
Custo 5 PdE · Ação Comum · Alcance 18 Metros · Duração Imediato · Alvo Aliado
Escolha um aliado em até 18m que possa ver e ouvir você. Até o final da rodada, a primeira vez que
esse aliado usar um item preparado por você, ele recebe vantagem na jogada associada ao item e soma
o seu Bônus de Treinamento à CD do efeito, caso o item exija resistência. Se o item causar dano, ele
soma metade do Bônus de Treinamento ao dano.

**Técnica Marcial [ Nvl. 2 ]-: Rede de Coordenação**
Custo 5 PdE · Ação Comum · Alcance 18 Metros · Duração Imediato · Alvo Aliados
Escolha até 2 aliados em até 18m que possam ouvir você. Até o início do seu próximo turno, cada um
deles recebe +2 em jogadas de ataque e em sua Defesa. Se um desses aliados usar um item preparado
por você, ele também recebe +1 na primeira jogada.

**Técnica Marcial [ Nvl. 2 ]-: Campo deDesvio** (o título da página escreve "Campo de Desvio")
Custo 5 PdE · Ação Reação · Alcance 18 Metros · Duração Imediato · Alvo Inimigo
Quando uma criatura hostil em até 18m declarar um ataque contra você ou um aliado, você pode alterar
levemente a leitura do campo utilizando um sensor de movimento já preparado. O alvo sofre -2 na
jogada de ataque e, se errar, não poderá repetir o mesmo ataque contra o mesmo alvo até o fim da
rodada.

**Técnica Marcial [ Nvl. 3 ]-: Janela de Execução**
Custo 8 PdE · Ação Reação · Alcance 18 Metros · Duração Imediato · Alvo Próprio
Quando você ou um aliado em até 18m acertar um alvo que esteja sob efeito de um de seus
dispositivos, armadilhas ou marcações táticas, você pode "fechar a leitura" do padrão do inimigo. O
próximo uso de item ou dispositivo contra esse mesmo alvo até o fim da cena recebe +2 na jogada de
ataque ou +2 na CD do efeito, à sua escolha. Se o item causar dano, esse dano também recebe um bônus
igual ao seu Bônus de Treinamento.

**Técnica Marcial [ Nvl. 3 ]-: Marcação Prioritária**
Custo 8 PdE · Ação Comum · Alcance 18 Metros · Duração Imediato · Alvo Próprio
Escolha um inimigo visível em até 18m. Até o final da cena, o primeiro ataque de cada aliado contra
esse alvo recebe +2 na jogada de ataque. Se um aliado o atingir com um item seu, o alvo também sofre
-2 na próxima Defesa até o início do próximo turno desse aliado. No entanto para isso é necessário
ter preparado com antecedência um campo tático

**Técnica Marcial [ Nvl. 3 ]-: Barreira de Resposta**
Custo 8 PdE · Ação Reação · Alcance 18 Metros · Duração Imediato · Alvo Próprio
Quando um aliado em até 18m for alvo de um ataque ou efeito ofensivo, você pode impor uma cobertura
improvisada tática. O aliado recebe +4 em Defesa contra aquela ocorrência. Se o ataque errar, o
aliado pode se mover até 3m sem provocar ataques de oportunidade. Para isso o usuário deve ter
preparado um projetor de fumaça e cápsula de emergência

**Técnica Marcial [ Nvl. 4 ]-: Comando de Saturação**
Custo 12 PdE · Ação Comum · Alcance 18 Metros · Duração Imediato · Alvo Próprio
Até o início do seu próximo turno, todos os aliados em até 18m recebem um bônus igual à metade do
seu Bônus de Treinamento em Defesa e Testes de Resistência. Além disso, uma vez durante a duração,
você pode ativar uma armadilha, equipamento ou dispositivo preparado por você como uma ação livre,
mesmo que normalmente ele exigisse outra ação.

**Técnica Marcial [ Nvl. 4 ]-: aaaaaaaaaaaaaaaaaaa** (primeira sem nome)
Custo 12 PdE · Ação Bônus · Alcance 18 Metros · Duração Imediato · Alvo Próprio
Escolha até 3 aliados em até 18m. Na primeira vez que cada um deles acertar um ataque até o fim da
cena, ele pode causar +1d10 de dano adicional ou aplicar +2 na CD de um efeito ligado a um item seu.
Se o ataque for feito com um dispositivo preparado por você, o bônus dobra para +2d10.

**Técnica Marcial [ Nvl. 4 ]-: aaaaaaaaaaaaaaaaaaa** (segunda sem nome)
Custo 12 PdE · Ação Reação · Alcance 18 Metros · Duração Imediato · Alvo Próprio
Quando um inimigo em até 18m realizar uma ação ofensiva contra você ou um aliado, você pode
interromper a leitura dele e forçar um desvio tático. O inimigo deve refazer a jogada, ficando com o
segundo resultado. Se ainda assim acertar, o alvo da ação recebe +2 de Defesa contra o restante do
efeito e pode se mover 3m imediatamente.

### Arsenal das Possibilidades (página 11, capa)

*Ferramentas, equipamentos e artefatos para todo tipo de combate. A mente é a arma mais eficaz.*

### Preparação de Terreno (página 12)

Através de planejamento, engenharia improvisada e recursos previamente preparados, você é capaz de
criar dispositivos, armadilhas e equipamentos. Fora de combate, você pode gastar 1 minuto para
preparar um número de dispositivos igual ao seu BT. Ao preparar um dispositivo, escolha uma opção da
lista de Armadilhas ou Equipamentos. Todos os dispositivos preparados utilizam sua Classe de
Dificuldade padrão e eles permanecem funcionais até serem utilizados, destruídos ou substituídos por
novos dispositivos preparados. Sempre que concluir um descanso curto ou longo, você pode desmontar,
reparar ou substituir qualquer quantidade de dispositivos preparados. Caso um aliado utilize um
dispositivo criado por você, ele recebe vantagem na primeira rolagem realizada.

**Preparação de Armadilhas.** As armadilhas devem ser instaladas em um ponto do terreno durante a
preparação. Uma criatura pode tentar localizar uma armadilha através de um teste contra sua Classe de
Dificuldade. Salvo caso possuam indicação contrária, uma armadilha é acionada automaticamente quando
uma criatura entra na área definida por ela, não exigindo ações, reações ou qualquer gasto adicional
do usuário. Após serem ativadas, armadilhas são destruídas e não podem ser utilizadas novamente

**Preparação de Equipamentos.** Equipamentos são dispositivos portáteis carregados pelo usuário ou
por seus aliados. Ativar um equipamento exige uma Ação Bônus. Cada equipamento possui sua própria
forma de utilização descrita em seu efeito, além disso após todos os usos serem consumidos, o
equipamento deixa de funcionar até ser preparado novamente pelo próprio usuário ou por seus aliados
durante uma cena

### Armadilhas & Equipamentos (páginas 13 e 14)

**Armadilha Explosiva**
Modo de Instalação: Solo ou superfície sólida · Acionamento: Criaturas em um raio de 1,5m da armadilha
A armadilha explode em chamas. Criaturas em um raio de até 3 metros sofrem 2d8 de dano queimante. Um
Teste de Resistência de Reflexos contra a Classe de Dificuldade do Usuário e suceder ao teste reduz o
dano à metade.

**Armadilha Mecânica**
Modo de Instalação: Solo ou superfície sólida · Acionamento: Uma criatura pisa sobre a armadilha
Garras metálicas emergem e prendem o alvo. Ele deve realizar um Teste de Resistência (TR) de
Fortitude contra a classe de dificuldade (CD) do usuário ou ficará enredado até o final do próximo
turno parando de funcionar totalmente após ele.

**Campo Tático**
Modo de Instalação: Solo e área de até 4,5m de raio. · Acionamento: Automático após a instalação
Redes, fios e obstáculos ocultos transformam a área em terreno difícil por 2 turnos quando o combate
se inicia. Criaturas que passarem por uma área de 4,5m em raio deve realizar um teste de resistência
de reflexos para não ser afetada pelo terreno.

**Mina Terrestre**
Modo de Instalação: Solo ou superfície sólida · Acionamento: Uma criatura pisa ou atravessa a área da mina
A mina explode em fragmentação. Criaturas em 3m sofrem 2d4 de dano de impacto + 1d6 de dano
perfurante. Quem falhar em um Teste de Resistência de Reflexos contra sua Classe de Dificuldade
também fica desorientado durante um turno.

**Torreta Improvisada**
Modo de Instalação: Solo ou superfície sólida · Acionamento: Ação Bônus
A torreta permanece ativa por até 6 disparos. Sempre que ativada, realiza um ataque à distância
contra um alvo em até 9m para cada disparo que tenha sido realizado, podendo disparar até 3 tiros
por turno, causando 1d8 de dano perfurante.

**Dardo Químico**
Modo de Instalação: Nenhuma · Acionamento: Ação Bônus
Realize um ataque à distância contra uma criatura em até 9 metros. Se atingir, ela deve realizar um
Teste de Resistência de Fortitude contra sua Classe de Dificuldade ou ficará envenenada até o final
da próxima rodada.

**Granada de Luz**
Modo de Instalação: Nenhuma · Acionamento: Ação Bônus
Inimigos em um raio de 6m devem realizar um Teste de Resistência de Reflexos ou ficam Cegos até o
final do próximo turno.

**Dispositivo Adesivo**
Modo de Instalação: (vazio) · Acionamento: (vazio)
Emite uma interferência em um raio de 6m. Até o seu próximo turno, ferramentas amaldiçoadas perdem
seus encantamentos.

**Campo Eletromagnético**
Modo de Instalação: (vazio) · Acionamento: (vazio)
Até o final da cena, aliados em até 18m recebem +2 em Iniciativa e tem o alcance dos feitiços
aumentados em 1,5 metros

**Sensor de Movimento**
Modo de Instalação: Solo ou superfície sólida · Acionamento: Automatica
Escolha um ponto em até 18m. Até o final da cena, sempre que uma criatura atravessar uma área de 3m
ao redor do sensor, você é imediatamente informado de sua posição exata, desde humanos, fetos até
espíritos amaldiçoados que passam nela.

**Projetor de Fumaça**
Modo de Instalação: Solo ou superfície sólida · Acionamento: Uma criatura pisa sobre a armadilha
Cria uma nuvem de fumaça em um raio de 3m que deixa criaturas dentro dela cegas até o final da
próxima rodada.

**Bomba Sonora**
Modo de Instalação: Solo e área de até 4,5m de raio. · Acionamento: Automático após a instalação
Escolha um ponto em até 18m. Sons são emitidos naquele local em 4,5 m de raio até o final da rodada,
forçando a realizarem um Teste de Resistência de Fortitude contra sua Classe de Dificuldade, caso as
criaturas fahem no teste ficam surdos.

**Barreira Improvisada**
Modo de Instalação: Corporal · Acionamento: Reação
Quando um aliado em até 9m sofrer um ataque, você pode erguer uma cobertura emergencial. O alvo
recebe +2 de Defesa contra aquele ataque, após seu único uso que dura até o seu próximo turno a
barreira improvisada é totalmente desfeita.

**Marcador Tático**
Modo de Instalação: (vazio) · Acionamento: (vazio)
Escolha uma criatura em até 18m. Até o final da cena, o primeiro ataque realizado por cada aliado
contra ela recebe +1 na jogada de ataque, além disso caso o alvo esteja sob a condição desprevenida
esse bônus aumenta para +3 por um turno.

**Cápsula de Emergência**
Modo de Instalação: (vazio) · Acionamento: (vazio)
Quando você ou um aliado em até 9m sofrer dano, reduza esse dano em um valor igual ao seu Bônus de
Treinamento.

Armadilhas e equipamentos podem ser utilizados em conjunto com seus ataques marciais, desde que seus
pré-requisitos, condições de acionamento e limitações específicas sejam respeitados.

### Itens Especiais de Custo 1 (página 15)

**Armadilha Mecânica [Dispositivo].** Armadilha de contenção capaz de imobilizar temporariamente uma
criatura através de mecanismos ocultos. Consulte a característica Preparação de Terreno.

**Campo Tático [Dispositivo].** Redes, fios e obstáculos estrategicamente posicionados para
dificultar movimentação inimiga e controlar áreas do campo. Consulte a característica Preparação de
Terreno

**Sensor de Movimento [Dispositivo].** Um detector capaz de identificar movimentações dentro de uma
área delimitada, permitindo monitoramento. Consulte a característica Preparação de Terreno.

**Marcador Tático [Dispositivo].** Um sistema de marcação e priorização de alvos que auxilia aliados
a concentrarem seus ataques sobre um mesmo inimigo. Consulte a característica Preparação de Terreno.

**Cápsula de Emergência [Dispositivo].** Um pequeno mecanismo defensivo utilizado para amortecer
impactos e reduzir danos sofridos por aliados. Consulte a característica Preparação de Terreno.

### Itens Especiais de Custo 2 (página 15)

**Armadilha Explosiva [Mistura Explosiva].** Uma carga incendiária oculta capaz de explodir quando
acionada por inimigos próximos. Consulte a característica Preparação de Terreno.

**Mina Terrestre [Mistura Explosiva].** Um explosivo improvisado é acionado por pressão, capaz de
causar dano e desorientar alvos próximos. Consulte a característica Preparação de Terreno.

**Torreta Improvisada [Dispositivo].** Uma plataforma automatizada de disparo capaz de fornecer
cobertura de fogo durante o combate. Consulte a característica Preparação de Terreno.

**Dardo Químico [Mistura Química].** Um projétil carregado com compostos tóxicos capazes de envenenar
o seu alvo. Consulte a característica Preparação de Terreno para suas regras completas.

**Granada de Luz [Dispositivo].** Um dispositivo de dispersão luminosa desenvolvido para incapacitar
temporariamente inimigos através de um clarão. Consulte a característica Preparação de Terreno.

**Barreira Improvisada [Dispositivo Defensivo].** Uma cobertura emergencial portátil capaz de
proteger aliados contra ataques iminentes. Consulte a característica Preparação de Terreno.

**Taser [Mistura / Dispositivo Elétrico].** Um pequeno dispositivo elétrico portátil, desenvolvido
para incapacitar alvos através de uma descarga concentrada. Como uma ação bônus, você pode realizar
uma descarga contra uma criatura em até 3 metros. O alvo deve realizar um Teste de Resistência de
Fortitude contra sua Classe de Dificuldade. Em falha, sofre 2d6 de dano elétrico e fica Desorientado
até o final do próximo turno. Em sucesso, sofre apenas metade do dano e não fica Desorientado.

**Termita [Mistura Química].** Uma substância incendiária extremamente instável, capaz de gerar
calor suficiente para derreter metal. Como uma ação bônus, você pode aplicar a termita em uma arma
ou superfície. Uma arma afetada recebe o traço Modular Queimante, causando 2d6 de dano queimante
adicional durante 10 rodadas. Alternativamente, a termita pode ser aplicada sobre estruturas,
escudos, armaduras ou equipamentos não amaldiçoados, destruindo-os caso sejam de terceiro grau ou
inferior ao serem atingidas, ja para equipamentos de grau superior ela causa dano aos pontos de vida
da vestimenta ou da ferramenta amaldiçoada como se fossem objetos.

(A página 16 do PDF está em branco.)

### Itens Especiais de Custo 3 (página 17)

**Projetor de Fumaça [Dispositivo].** Um mecanismo de dispersão que cria uma densa cortina de
fumaça, prejudicando a visão dos inimigos e facilitando reposicionamentos estratégicos. Consulte a
característica Preparação de Terreno para suas regras completas.

**Bomba Sonora [Dispositivo Sônico].** Um emissor de ondas sonoras concentradas capaz de desorientar
e prejudicar a audição de múltiplos alvos simultaneamente. Consulte a característica Preparação de
Terreno para suas regras completas.

**Dispositivo Adesivo [Dispositivo Especial].** Um equipamento desenvolvido para interferir
temporariamente no funcionamento de ferramentas amaldiçoadas e outros mecanismos energéticos.
Consulte a característica Preparação de Terreno para suas regras completas.

**Campo Eletromagnético [Dispositivo de Comando].** Um sistema avançado de comunicação e
sincronização capaz de coordenar aliados em combate e otimizar suas capacidades operacionais.
Consulte a característica Preparação de Terreno para suas regras completas.

**Mina Terrestre [Mistura Explosiva].** Um explosivo improvisado acionado por pressão, normalmente
ocultado sob o terreno. A mina exige 1 minuto para ser instalada fora de combate. Quando ativada,
explode em uma área de 3 metros de raio, causando 5d8 de dano de impacto. Criaturas afetadas podem
realizar um Teste de Resistência de Reflexos contra sua Classe de Dificuldade para reduzir o dano à
metade.

**Míssil Anti-Aéreo [Dispositivo Explosivo].** Um projétil portátil equipado com um sistema
rudimentar de rastreamento. Como uma ação completa, você pode dispará-lo contra uma criatura que
esteja voando em até 30 metros. O alvo deve realizar um Teste de Resistência de Reflexos contra sua
Classe de Dificuldade. Em falha, sofre 6d10 de dano de impacto. Em sucesso, sofre apenas metade.

### Itens Especiais de Custo 4 (página 17)

Gás Mostarda [Mistura Química]. Uma ampola contendo uma mistura corrosiva e tóxica capaz de
contaminar grandes áreas. Como uma ação completa, você pode lançá-la em um ponto em até 18 metros. O
gás ocupa uma área de 6 metros de raio durante 4 rodadas. Uma criatura que entrar na área pela
primeira vez em um turno ou iniciar seu turno nela deve realizar um Teste de Resistência de
Fortitude contra sua Classe de Dificuldade. Em falha, fica Envenenada durante 2 rodadas. Além disso,
enquanto permanecer na área contaminada, sofre 8d12 de dano necrótico no início de cada turno, além
disso ao permanecer nessa área durante as duas rodadas e falhar nos dois testes requisitados o alvo
deve realizar um novo teste de resistência ficando enjoado e exposto por 1 turno.

### M.E.D.U.S.A (página 18)

Um dispositivo em formato de nó de trevo, alimentado por um diamante lapidado de alta pureza que
funciona como núcleo de energia. A M.E.D.U.S.A. responde a comandos de voz e libera o Raio Petri,
uma onda expansiva de energia destinada à petrificar todos os alvos biológicos. Para ativá-la, deve
emitir um comando de voz completo, especificando o raio de efeito e o tempo de ativação, qual o raio
de efeito mínimo de alcance é de 6 metros e o alcance máximo de 36 metros, já o Tempo de ativação é
mínimo de 1 turno e máximo de 10. Caso o comando seja interrompido, incompleto ou formulado de
maneira incorreta, ela não dispara. Ao fim do tempo de ativação, ela libera uma energia que se
expande até alcançar o raio, petrificando os seus alvos. Toda criatura biológica atingida deve
realizar um Teste de Resistência de Fortitude contra uma CD igual a 45 + Modificador de Inteligência
+ BT, caso falhem o alvo é Petrificado por um tempo indefinido; caso suceda ao teste o alvo apenas
sofre Lentidão durante 1 minuto, mas resiste à petrificação. Um alvo petrificado tem seus tecidos e
pele convertidos em pedra, tornando-se Inconsciente e Indestrutível, embora ainda esteja vivo. O
estado pode ser revertido por compostos químicos preparados especificamente para isso, por energia
reversa adequada ou por uma segunda M.E.D.U.S.A. utilizada em modo de reversão.

**Núcleo | Cargas | Substituição | Preparação**

Cada uso depende de um Diamante Lapidado como bateria. Cada diamante suporta 1 + Bônus de
Treinamento ativações, onde cada ativação consome uma carga tendo uso de cargas adicionais
dependendo do seu uso, se o raio escolhido ultrapassar 18m, consome 1 carga adicional e tendo o seu
custo aumentado em um para cada 9 metros adicionais, além de que para aumentos de turnos para a
ativação se o tempo de ativação ultrapassar 5 turnos, consome 1 carga adicional. Quando a última
carga é gasta, o usuário deve realizar um teste de ofício de canalizador para manter a integridade do
núcleo. Para isso, realize uma rolagem contra uma CD igual a 10 + metade do nível do personagem. Em
caso de falha, o diamante se parte e se torna inútil. Se esse era o núcleo ativo da M.E.D.U.S.A., o
dispositivo colapsa e precisa ser reconstruído do zero para voltar a funcionar.

Trocar o diamante é uma ação completa fora de combate ou 10 turnos em combate. Criar um novo
Diamante Lapidado exige Ferramentas de Ofício de Ferreiro e um teste apropriado. Caso venha a suceder
o usuário fabrica um novo núcleo funciona, se falhar o diamante é destruído e a tentativa desperdiça
o material, além de que em uma Falha crítica além de acabar destruindo o diamante, a M.E.D.U.S.A.
entra em colapso e precisa de reparo durante um interlúdio antes de voltar a operar.

### Bomba Atômica (página 19)

Uma Bomba Atômica é tratada no jogo como uma arma amaldiçoada de grau especial: um artefato de
destruição total que combina ciência e jujutsu, criado para apagar por completo tudo o que estiver
em seu alcance. Sua ativação exige 1 minuto de preparação. Uma vez armada, a bomba explode após 1d4
rodadas, a menos que seja desarmada por um teste de Ferreiro contra uma CD igual a 30 + Modificador
de Inteligência + BT do ativador da bomba. Ao detonar, a bomba libera uma explosão de raio que
devasta uma área massiva. Toda criatura dentro da zona de explosão deve realizar um Teste de
Resistência de Fortitude contra uma CD igual a 50. Em falha, a criatura sofre 60d12 de dano radiante
e necrótico; em sucesso, sofre metade desse dano. Após a detonação, a área torna-se uma Zona
Radioativa. Criaturas que iniciarem seu turno ou entrarem na área devem realizar um Teste de
Resistência de Fortitude contra CD 55. Em falha, sofrem 20d12 necrótico e ficam envenenadas,
sangramento extremo e expostas durante cinco turnos até deixarem a zona. A Bomba Atômica não
distingue aliados e inimigos, destrói estruturas e equipamentos conforme decisão do Narrador e
possui consequências políticas, narrativas e estratégicas severas quando utilizada. Trata-se de um
artefato único, cuja criação exige componentes raríssimos, tecnologias e aprovação do Narrador.

**Construção da Bomba Atômica**

A construção de uma Bomba Atômica exige acesso a um laboratório apropriado, materiais raros e no
mínimo 7 dias de trabalho ininterruptos. Durante esse período, o criador deve concluir três etapas
distintas: Projeto, Estruturação e Canalização. O usuário deve realizar um teste de ofício de
ferreiro contra CD 40 para desenvolver os cálculos necessários para estabilizar a reação interna da
bomba. Em caso de falha, o projeto é inutilizado e todos os materiais utilizados nesta etapa são
perdidos.

Após concluir o projeto, o usuário deve realizar um teste de Ferreiro contra CD 45 para construir a
carcaça, os mecanismos de contenção e os sistemas de detonação. Em caso de falha, a estrutura
apresenta falhas críticas e é destruída, exigindo que esta etapa seja reiniciada. Por fim, o usuário
deve realizar um teste de ofício de Canalizador contra CD 50 para imbuir a bomba com a quantidade
necessária de energia amaldiçoada e estabilizar o Núcleo Amaldiçoado. Em caso de falha, o núcleo
entra em colapso e explode prematuramente, destruindo todos os materiais utilizados na construção.
Em caso de falha crítica, além da destruição dos materiais, uma explosão de energia amaldiçoada
ocorre em um raio de 18m, causando 20d12 de dano necrótico a todas as criaturas na área. Ao concluir
as três etapas com sucesso ela é criada e permanece estável até seu uso. Apenas uma Bomba Atômica
pode existir simultaneamente para cada usuário. Caso uma nova seja construída, a anterior torna-se
instável e perde sua funcionalidade. Devido à complexidade extrema do projeto, cada tentativa de
construção consome recursos equivalentes a um artefato de Grau Especial.

### Veículos de Combate (página 20)

Em certas ocasiões, o domínio sobre o campo de batalha não vem apenas do corpo, das armas ou das
técnicas, mas também da capacidade de transformar máquinas em extensões táticas de combate. Dentro
desta homebrew, o usuário é capaz de operar veículos de guerra desenvolvidos para suportar confrontos
diretos, perseguições, bombardeios e manobras de supressão, tornando-se uma verdadeira força móvel
em combate. Esses veículos representam estruturas de grande porte, com blindagem, sistemas internos,
armamentos próprios e espaço para operação por parte de seus tripulantes. Cada veículo possui
características únicas, ações próprias e resistências específicas.

Além disso, os veículos podem receber Melhorias, que representam módulos adicionais, prototipagens
avançadas e adaptações especiais criadas para ampliar sua eficiência. Essas melhorias são
construídas por meio da mecânica de Preparação de Equipamentos, exigindo tempo, recursos e
conhecimento técnico. Cada veículo possui um limite de melhorias ativas, e suas alterações devem ser
feitas com cuidado, pois desmontagens inadequadas podem comprometer seu funcionamento. A seguir, você
encontrará os dois principais veículos desta homebrew, bem como suas respectivas listas de
melhorias, organizadas para refletir suas funções em combate.

### Tanque de Guerra (página 21)

*Veículo de Guerra*
**Pontos de Vida:** 280 **Classe de Armadura:** 30
**Tamanho:** Grande **Movimento:** 15 Metros
**Resistências:** Resistente a Dano Físico

**Ações (Possui 2 Ações e 3 Ações Rápidas)**

**Canhão Central - [Ação Comum].** O tanque carrega seu disparo principal antes de lançar um
projétil de alto impacto contra um único alvo em alcance. Realize uma jogada de ataque com +10 de
bônus. Em acerto, o alvo sofre 3d10 + 13 de dano perfurante e deve realizar um Teste de Resistência
de Fortitude contra CD 30. Em falha, o alvo fica sob a condição de lento até o final de duas
rodadas.

**Rajada de Mísseis - [Ação Comum].** O tanque dispara uma salva explosiva em uma área de 6 metros de
raio. Todas as criaturas na área devem realizar um Teste de Resistência de Reflexos contra CD 36. Em
falha, sofrem 2d10 + 13 de dano perfurante. Em sucesso, sofrem metade do dano.

**Recarregar - [Ação Rápida].** O tanque realoca sua energia interna para os sistemas principais. Na
próxima vez que causar dano com um ataque, adicione 1d10 + 7 de dano adicional. Esse efeito se
aplica apenas uma vez por recarga.

**Características**

**Montaria.** O tanque de guerra foi construído para ser operado por humanos. Até quatro criaturas
podem ocupá-lo ao mesmo tempo. Enquanto estiverem dentro dele, recebem cobertura total contra
ataques externos, e o tanque ocupa a linha de frente do combate como uma fortaleza móvel.

**Blindagem Firme.** No início de cada rodada, o tanque recebe 25 pontos de vida temporários. Esses
pontos não cumulam com os da rodada anterior, além de que criaturas que acertem um ataque corpo a
corpo contra o tanque sofrem 1d8 de dano de impacto, pelo retorno da força da blindagem.

**Torre Reforçada.** O tanque possui uma estrutura de comando exposta no topo. Ataques que atingem
essa área ignoram a resistência de dano físico de Dano do veículo, para uma criatura localizar esta
fraqueza deve realizar um teste de intuição com uma Classe de Dificuldade (CD) de 25.

### Lista de Melhorias do Tanque (página 22)

Essas melhorias podem ser construídas como prototipagens modulares durante a Preparação de
Equipamentos, exigindo **3 Interlúdios de montagem** cada. Cada tanque pode ter até **3 melhorias
ativas por vez**, e substituí-las exige uma desmontagem cuidadosa e um teste de **Ofício de
Ferreiro** contra CD **30 + número de melhorias instaladas**.

| Melhoria | Efeito |
|---|---|
| Blindagem Reforçada | O tanque recebe +5 na Defesa e passa a ter resistência a dano amaldiçoado. Além disso, todo ataque ou efeito que causaria menos de 10 de dano ao tanque é completamente anulado |
| Canhão de Alta Pressão | Os disparos passam a causar 2d10 + Modificador de Inteligência adicional de dano perfurante. Além disso, ao atingir um alvo, o ataque ignora até 5 pontos de Redução de Dano do alvo. |
| Módulo de Mira Assistida | Os ataques à distância do tanque recebem vantagem. Além disso, sempre que o tanque errar um ataque à distância, o projétil ricocheteia e causa metade do dano a um alvo adjacente |
| Campo Cinético | O tanque projeta uma barreira invisível que reduz em 10 pontos todo dano físico recebido. |
| Sistema de Autorreparo | No início de cada turno, o tanque recupera 10 pontos de vida +1 de até 5 máximo de RD físico |
| Blindagem Especializada | Escolha entre Impacto, Corte ou Perfurante para que ele se torne imune ao tipo de dano físico. |
| Motor Experimental | O movimento do tanque aumenta para 21 metros sem provocar ataques de oportunidade |
| IA de Combate Tática | O tanque adquire um sistema semi autônomo. Ele passa a receber 1 Ação Rápida adicional |

### Avião Teco Teco (página 23)

*Veículo Voador*
**Pontos de Vida:** 240 **Classe de Armadura:** 24
**Tamanho:** Grande **Movimento:** 18 Metros
**Resistências:** Resistente a Dano Físico

**Ações (Possui 2 Ações e 2 Ações Rápidas)**

**Metralhadora - [Ação Comum].** O avião dispara uma rajada de projéteis contra um único alvo.
Realize uma jogada de ataque com +8 de bônus. Em acerto, o alvo sofre 4d8 + 24 de dano perfurante.
Além disso, deve realizar um Teste de Resistência de Fortitude contra CD 26. Em falha, fica Surdo
até o final do próximo turno.

**Bombardeio Aéreo- [Ação Comum].** O avião lança explosivos sobre uma área de 9 metros de raio.
Todas as criaturas na área devem realizar um Teste de Resistência de Reflexos contra CD 28. Em
falha, sofrem 3d8 + 20 de dano de impacto. Em sucesso, sofrem metade do dano.

**Recarregar - [Ação Rápida].** O avião marca uma criatura em até 30 metros. Até o final da próxima
rodada, ataques realizados contra a criatura recebem +2 nas jogadas de ataque.

**Características**

**Montaria.** O tanque de guerra foi construído para ser operado por humanos. Até quatro criaturas
podem ocupá-lo ao mesmo tempo. Enquanto estiverem dentro dele, recebem cobertura total contra
ataques externos, e o tanque ocupa a linha de frente do combate como uma fortaleza móvel.

**Blindagem Firme.** No início de cada rodada, o tanque recebe 25 pontos de vida temporários. Esses
pontos não cumulam com os da rodada anterior, além de que criaturas que acertem um ataque corpo a
corpo contra o tanque sofrem 1d8 de dano de impacto, pelo retorno da força da blindagem.

**Torre Reforçada.** O tanque possui uma estrutura de comando exposta no topo. Ataques que atingem
essa área ignoram a resistência de dano físico de Dano do veículo, para uma criatura localizar esta
fraqueza deve realizar um teste de intuição com uma Classe de Dificuldade (CD) de 25.

### Lista de Melhorias do Avião (página 24)

Essas melhorias podem ser construídas como prototipagens modulares durante a Preparação de
Equipamentos, exigindo **3 Interlúdios de montagem** cada. Cada tanque pode ter até **3 melhorias
ativas por vez**, e substituí-las exige uma desmontagem cuidadosa e um teste de **Ofício de
Ferreiro** contra CD **30 + número de melhorias instaladas**.

| Melhoria | Efeito |
|---|---|
| Propulsão Sônica | O deslocamento de voo aumenta para 27 metros sem provocar ataques de oportunidade. |
| Blindagem Aerodinâmica | O avião recebe +4 na Defesa e resistência a dano de feitiço, além de ser imune a críticos. |
| Módulo de Bombardeio | O Bombardeio Aéreo pode afetar até três áreas diferentes de 3m de raio dentro do alcance. |
| Sistema de Autopilotagem | O avião utiliza o Modificador de Atributo de Inteligência do criador em suas jogadas de ataque. |
| Canhões de Energia | A Metralhadora é substituída por um disparo energético. O ataque passa a causar +2 dados. |
| Camuflagem Óptica | Uma vez por cena, o avião pode se tornar totalmente invisível até o início do próximo turno. |
| Motor Experimental | O avião recebe dois drones de suporte. Cada drone concede +1 na defesa e redução de dano. |
| Computador de Trajetória | Os ataques à distância do avião recebem vantagem uma quantidade de vezes igual ao seu BT. |
