# A FAZER — pendências do repositório

Arquivo ÚNICO de coisas a fazer. Vale para o Grimório 2.5.2, para o Afty e para o que for geral.

Criado em 2026-08-09 a pedido do autor: *"padronize as anotações de COISAS A FAZER em um único
arquivo md. Para outros colaboradores usarem ele também e ir anotando oq for preciso."*

---

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
### Horda: o PV máximo cai junto com os membros perdidos? E o que acontece a 0 PV?
**Onde:** `src/systems/afty/afty-invocacoes.js` (`resolveHorda`) e `ficha/ficha-sessao.js` (`aplicaDanoHorda`)
**Situação:** o Livro diz que na metade da vida a horda "perde metade dos seus membros [...]
diminuindo todos os efeitos baseados no número de membros". O PV máximo também é "baseado nos
membros" (metade do PV de cada um), e o texto não diz se ele cai. Cair faz a horda recalcular a
metade e perder membros de novo em cascata. Hoje o máximo FICA, e só as escalas (dano, cura, RD,
tamanho, prejuízo) caem. O texto também não diz o que acontece a 0 PV. Hoje a horda acaba, e o
líder e os membros que sobraram caem pela regra do tipo de cada um (exorcizados com o excedente
acima do máximo da horda).
**Precisa:** o autor dizer (1) se o PV máximo cai com os membros perdidos, e (2) se a queda a 0
fica como está.
**Anotado:** 2026-10-01, na Etapa 9 da atualização de Controlador e Invocações

### Hoste Amaldiçoada: o par de hordas conta como uma também no limite em campo?
**Onde:** `src/systems/afty/afty-derive.js` (`idsDaMesa`) e `ficha/abas/AbaInvocacoes.jsx`
**Situação:** a Hoste diz que as duas hordas "contam como apenas uma para o seu limite de hordas
em campo". O Livro diz que cada horda "é contabilizada como uma Invocação" no limite de
Invocações em campo. Hoje o par conta UMA no limite de hordas e DUAS no de Invocações, pela
leitura literal dos dois textos.
**Precisa:** o autor dizer se o par conta como uma também no limite de Invocações em campo.
**Anotado:** 2026-10-01, na Etapa 9 da atualização de Controlador e Invocações

### Quimera do Mecânicas: Invocações Resistentes entra de novo depois da fusão?
**Onde:** `src/systems/afty/afty-invocacoes.js` (`resolveQuimeraMecanicas`)
**Situação:** o *Mecânicas* diz "Efeitos como Visionário, Invocações Resistentes e afins são
aplicados após a criação da Quimera". O PV da fórmula ("Shikigami Base + 1/3 dos PVs dos outros")
sai dos cartões das componentes, que já trazem o PV da Invocações Resistentes. Hoje o PV da
Quimera é esse número, sem somar a Resistentes outra vez, e o Visionário entra normalmente (ele dá
vagas, e não PV).
**Precisa:** o autor dizer se a Resistentes (e afins de PV) (1) fica como está, só dentro dos
cartões, ou (2) sai dos cartões e entra uma vez sobre o PV da Quimera.
**Anotado:** 2026-10-01, na Etapa 9 da atualização de Controlador e Invocações

### Mecha: "maior PV" é o máximo ou o atual? E a 0 PV?
**Onde:** `src/systems/afty/ficha/ficha-sessao.js` (`mechaPermitido`, `formaMecha`, `aplicaDanoMecha`)
**Situação:** "O PV de um Mecha é igual a maior PV de seus componentes com o menor PV sendo
utilizada como PV Temporário". Hoje a maior é a de maior PV MÁXIMO, o Mecha leva o PV ATUAL dela,
e a casca é o PV atual da menor (o Separar devolve esses dois números). A 0 PV, "todas as regras
de Marionete são aplicadas": a maior quebra e o Mecha se desfaz.
**Precisa:** o autor confirmar a leitura, ou dizer se "maior PV" é o PV atual.
**Anotado:** 2026-10-01, na Etapa 9 da atualização de Controlador e Invocações

### Fundamento fora de campo: bloqueia só os Feitiços, ou a Técnica Inata inteira?
**Onde:** `src/systems/afty/afty-derive.js` (`tecnicaInata`, `semTecnicaPerdida`) e
`afty-invocacoes.js` (`estadoDaTecnicaInata`)
**Situação:** o *Mecânicas* diz *"Para utilizar sua Técnica Inata, o feiticeiro deve manter esse
shikigami invocado"*. A DA-07 decidiu a MORTE do Fundamento (bloqueio real, gravado na ficha), e
não fala do Fundamento só fora de campo. Hoje, com mesa e o Fundamento fora de campo, os Feitiços
saem marcados "Fundamento Fora de Campo" (sem rolagem nem Ritual), e os efeitos do Funcionamento e
das Passivas continuam no Motor. Com ele morto, os três saem. "Utilizar" cobre o Feitiço sem
dúvida, e o efeito passivo ficou de fora para não escolher sozinho.
**Precisa:** o autor dizer se, fora de campo, (1) só os Feitiços param, como hoje, ou (2) a Técnica
inteira para, Funcionamento e Passivas inclusive, como na morte. A (2) muda número da ficha toda
vez que o Fundamento sai de campo, e só na mesa (o criador nunca vê).
**Anotado:** 2026-10-01, na Etapa 8 da atualização de Controlador e Invocações

### Técnica Inata perdida: a Passiva continua ocupando PE Máximo?
**Onde:** `src/systems/afty/afty-derive.js` (`peMaximoDasPassivas`)
**Situação:** no jogador, cada Feitiço Passivo encolhe o PE Máximo (divergência
`passivaCustaPeMaximo`). Com o Fundamento morto, os efeitos das Passivas saem do Motor, mas o
custo no PE Máximo continua, porque a DA-07 manda não apagar nada e não diz se a Passiva parada
ainda reserva energia.
**Precisa:** o autor dizer se a Passiva da Técnica perdida (1) segue reservando o PE Máximo, como
hoje, ou (2) deixa de reservar enquanto a Técnica estiver perdida.
**Anotado:** 2026-10-01, na Etapa 8 da atualização de Controlador e Invocações

### Corpo Biológico: qual CD de reparo por Medicina ou Cura Aprimorada?
**Onde:** `src/systems/afty/afty-invocacoes.js` (`reparoDaInvocacao`)
**Situação:** o *Mecânicas* manda o Corpo biológico se reparar *"através de Cura Aprimorada ou pela
perícia Medicina"* e diz *"Em ambos os casos, segue-se as regras abaixo para definir a CD"*, com o
Custo pelo grau. A CD por Custo do Livro é a tabela de Criação de Itens, que só tem colunas de
Ofício (Alquimia, Canalizador e Ferreiro; Entalhador e Farmacêutico; Alfaiate). Medicina não é
Ofício. Hoje a Ficha mostra o Custo e não mostra CD para o biológico.
**Precisa:** o autor dizer a coluna (ou a tabela) da CD do biológico. É só exibição: nenhuma conta
depende dela.
**Anotado:** 2026-10-01, na Etapa 8 da atualização de Controlador e Invocações

### Corpo Amaldiçoado: as Ações e Características extras custam PE?
**Onde:** `src/systems/afty/afty-invocacoes.js` (`detalheCustoInvocacao`)
**Situação:** o *Mecânicas* diz da Marionete *"não possuem custo base de ativação, mas efeitos como
'Autonomia' ou aumento de características devem ser pagos no ato da ativação"*, e da Maldição algo
parecido. Do Corpo diz só *"não possuem custo de ativação, no entanto, eles duram uma quantidade de
rodadas em combate igual ao seu CL"*, sem falar das extras. Hoje o Corpo segue a Marionete: o base
é zero e as Ações e Características além da cota custam, pagas na entrada. Ficou assim para não
escolher sozinho.
**Precisa:** o autor dizer se o Corpo (1) paga as extras na ativação, como a Marionete, ou (2) não
paga nada na ativação, e o custo dele é só a manutenção por rodada depois do CL.
**Anotado:** 2026-09-30, na Etapa 4 da atualização de Controlador e Invocações

### O descanso repara todas as Marionetes, ou uma só?
**Onde:** `src/systems/afty/ficha/ficha-sessao.js` (`descansaInvocacoes`)
**Situação:** o *Mecânicas* diz *"Você repara completamente uma Marionete não destruída em um
Descanso Longo ou todas as suas Marionetes não destruídas em um interlúdio"*. A Ficha tem UM
botão de descanso, que devolve tudo (a D3, decidida em 2026-09-23). Hoje o botão enche todas as
invocações, Marionete inclusive, e zera as quedas dela, que é o que ele fazia antes dos estados.
Ficou assim para não escolher sozinho.
**Precisa:** o autor dizer se o descanso (1) segue reparando todas, (2) repara uma escolhida, ou
(3) não repara nenhuma e a ficha ganha um botão "Reparar" com limite de uma por descanso.
**Anotado:** 2026-09-30, na Etapa 3 da atualização de Controlador e Invocações

### O chip do Shikigami volta a dizer "Shikigami"?
**Onde:** `src/systems/afty/afty-invocacoes-tipos.js` (`label` e `curto` de `shikigami` e `tecnica`)
**Situação:** em 2026-09-02 o autor renomeou os chips para "Invocação" e "Invocação de Técnica",
porque o tipo não mudava nada. Desde 2026-09-30 os tipos têm regra própria, e as decisões do
projeto falam em "Shikigami" e "Shikigami de Técnica", ao lado de Marionete, Corpo Amaldiçoado e
Maldição. Com cinco tipos, "Invocação" passa a nomear um tipo e também o conjunto inteiro. Os
rótulos ficaram como estavam, porque trocar seria escolher sozinho.
**Precisa:** o autor dizer se os rótulos de tela voltam a "Shikigami" e "Shikigami de Técnica"
(só o `label` e o `curto`, sem tocar no `value` gravado nas fichas), ou ficam como estão.
**Anotado:** 2026-09-30, na Etapa 2 da atualização de Controlador e Invocações


Coisas paradas esperando decisão de regra. Nada aqui deve ser resolvido por suposição.

### Canalizadora e Otimizada acumulam entre armas?
**Onde:** `src/systems/afty/afty-equipamentos.js` (`ENCANTAMENTOS_ARMA`, campo `naoAcumula`)
**Situação:** o autor decidiu em 2026-09-29 que duas armas Balanceadas empunhadas dão +2, e não +4, e a Balanceada ganhou `naoAcumula`. Os outros dois encantamentos de arma com bônus do PORTADOR ligados no Motor seguem somando por arma quando são comprados: duas Canalizadoras dão +4 de CD e duas Otimizadas dão +4 de Iniciativa. Pelo Manejo Especial eles já entram uma vez só ("a propriedade é uma").
**Precisa:** o autor dizer se os dois seguem a Balanceada. Se sim, é só `naoAcumula: true` em cada um e um caso no `t-balanceada.mjs`.
**Anotado:** 2026-09-29, ao corrigir a Balanceada
### Suporte Absoluto soma o atributo da Técnica, e o livro pede o da CD de especialização

**Onde:** `src/systems/afty/afty-efeitos-conteudo.js` (`sup_suporte_absoluto`)

**Situação:** o texto do nível 20 diz *"você soma seu modificador de atributo escolhido para CD de
especialização em toda cura que realizar"*, e as Características do Suporte definem esse atributo:
*"Um Suporte pode escolher entre Presença ou Sabedoria como atributos para calcular a CD das suas
habilidades de especialização"*. A implementação soma `mod_tecnica`, com o comentário justificando
que *"o Afty tem uma CD só, a Amaldiçoada"*.

O ponto é que isso mistura o VALOR da CD com o ATRIBUTO dela. O livro define o atributo por
especialização, independente de quantas CDs o motor rastreia, e a própria classe já usa
`mod_pre_ou_sab` na cura do Suporte em Combate, que vem da mesma frase do livro. Hoje o mesmo
conceito está resolvido de dois jeitos dentro da mesma especialização.

Na prática só diverge para quem escolheu um atributo de Técnica que não seja Presença nem Sabedoria,
e aí a cura do nível 20 sai maior ou menor que a do livro.

**Precisa:** o autor dizer se o Suporte Absoluto passa a somar `mod_pre_ou_sab`. É uma expressão. A
decisão encosta na entrada "A CD de Especialização e a CD Amaldiçoada são duas no livro", e pode ser
resolvida junto com ela ou antes dela.
**Anotado:** 2026-09-29, na auditoria do Suporte contra o livro

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

### Fórmula de Combate Entrópica: as leituras do PDF que faltam, antes de cada fase
**Onde:** `docs/afty-formula-entropica.md`, seção "Perguntas em aberto" (a lista inteira e numerada mora SÓ lá, para não haver duas cópias)
**Situação:** o Addon da Restrição Intelectual (homebrew de Dr. Xeno) foi planejado em 5 fases em 2026-09-28. As Fases 0, 1 e 2 estão feitas, e as leituras delas foram respondidas. Faltam as das etapas seguintes: o Engenho Superior ligado à Criação de Equipamentos (2b), quantas Técnicas Marciais ele conhece e os nomes das duas de Nível 4 ("aaaaaaaaaaaaaaaaaaa") (3), quatro dispositivos sem Modo de Instalação e Acionamento e a Mina Terrestre repetida com números diferentes (4), e as Características do Avião copiadas do Tanque (5). Mais uma observação da Fase 2: com o contador de falhas ligado a Atenção sobe junto, porque o bônus vale em toda perícia e a Atenção sai da Percepção.
**Precisa:** o autor (ou Dr. Xeno, por ele) responder as perguntas de cada fase ANTES de ela começar. Elas vão por pergunta com opções, em lotes por fase.
**Anotado:** 2026-09-28, no planejamento do Addon

### Maldição - Era de Ouro: o que ainda é só texto, e o que vale mais largo que o livro
**Onde:** `addons/maldicao-era-de-ouro.json` (`acrescenta.caracteristicasAmaldicoadas` e o Tipo De Medo) e `src/systems/afty/afty-efeitos.js` (os canais)
**Situação:** das 18 do pool, 10 têm número no Motor e 8 se declaram `mesa` (a marca "Mesa" na tela, e um assert em `asserts/t-maldicao-era-de-ouro.mjs` cobra que nenhuma fique muda). As de mesa ficam assim por falta de mecanismo, e cada uma pede uma decisão de desenho antes de virar número. Nenhuma foi suposta.
1. **Capacidade de Voo e de Nado** (*"transformar seu deslocamento de caminhada em deslocamento de voo"*, uma vez por rodada, ação livre). O `movimento` é um número só. Proposta: um estado de bancada "Voando" e "Nadando" que apenas rotula o deslocamento já calculado, sem canal novo. Falta o autor dizer se voo e nado têm cálculo próprio (multiplicador, teto) ou se vale o número da caminhada, como o texto diz.
2. **Braços Extras, o "+2 em Atletismo se tiver pelo menos duas mãos livres"**. Não há estado de mãos livres. Proposta: um interruptor de mesa "Mãos Livres" na aba de Estados (`gatilhoSessao`) que liga o +2. Falta confirmar se um interruptor serve para um bônus que depende do inventário.
3. **Alma Maldita** (dano na alma pela metade, anulado no 15°, 2/3/4/5 usos por dia). O `rdAlma` é RD fixa, e o texto é uma fração mais usos por descanso. Proposta: um contador de usos por descanso (a peça que a `curaUsos` já usa) mais a marca Mesa para a metade. Falta o autor dizer se o Afty tem "usos por dia" genérico para característica de origem.
4. **Guia Espiritual** (*"recebe um aliado seguindo as regras da página 348"*). O Afty tem o teto de aliados por Grau (`limiteDeAliados`). Falta o autor dizer se o Guia é UM ALIADO A MAIS que o teto, ou só o direito de ter um dentro dele.
5. **Anatomia Incompreensível, Devorador de Energia, Energia Tóxica e Presença Nefasta** são reações e testes de mesa (chance de 1 em 1d4, 1 PE temporário cumulativo, perda de vida igual ao modificador de Constituição, teste de Vontade contra a CD Amaldiçoada). O Motor não modela reação. Ficam em Mesa até o autor pedir uma "Ação de Reação" nativa na Ficha.
6. **Tipo De Medo, "Resquícios de Emoções"** (*"reduzir o pré-requisito de nível de UM grupo de aptidões em 1"*). O canal `reduzNivelAptidao` não tem alvo por grupo, então o pacote aplica em TODOS os grupos, mais largo que o livro e nunca mais estreito. Proposta: um `alvo` de grupo no canal (Aura, Controle e Leitura, Barreira, Domínio, Maldição, Especiais), com a escolha do grupo no card da Origem, e o `avaliarRequisitoAptidao` lendo o desconto do grupo da aptidão. Falta o autor dizer se a escolha do grupo é fixa ou se pode ser trocada.
**Precisa:** a decisão do autor em cada item, e só então o canal ou o estado correspondente.
**Anotado:** 2026-09-23, ao fazer as Características Amaldiçoadas com escolha mexerem no número
**Nota:** o contador de usos existe desde 2026-09-24 (campo `usos`, com a linha na Ficha e o Descansar zerando, ver `docs/automacao-dsl.md`) e aceita Característica de Origem desde 2026-09-28. Alma Maldita (item 3) continua aguardando a decisão sobre usos por dia e a redução fracionária de dano na alma. Articulações Extensas foi automatizada na versão 2.1.1 do pacote, em 2026-10-03, e saiu desta fila.

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

### A cota base de Ações e Características isenta de PE deixou um assert vermelho

**Onde:** `src/systems/afty/afty-invocacoes.js` (`custoInvocacao`), `asserts/t-invocacoes-motor.mjs`

**Situação:** uma mudança de 2026-09-14, ainda não commitada, fez a QUANTIDADE BASE do grau
(`INV_ACOES_CARACT_BASE`: 2 no Quarto e no Terceiro, 3 no Segundo e no Primeiro, 4 no Especial)
deixar de custar PE, com a justificativa escrita no código de que é o texto verbatim do livro e de
que o cálculo antigo cobrava a ficha inteira e só abatia os grátis de Habilidade por cima.

O assert `t-invocacoes-motor.mjs` ainda cobra a regra ANTIGA na linha *"a Livre com Motor custa 1
PE, como toda Característica"*, que era verdade quando toda Característica custava. Com a cota base
isenta, a primeira Característica de uma invocação de Terceiro Grau passa a custar zero, e o assert
falha. Ele é a única falha da suíte hoje (86 de 87 arquivos passam).

**Precisa:** o autor confirmar a regra nova. Se ela vale, o assert muda para cobrar a cota (as duas
primeiras de graça, a terceira custando), e a frase daquele bloco sai. Se não vale, o `+ base` do
`custoInvocacao` é que sai.
**Anotado:** 2026-09-15, ao sincronizar o repositório antes de abrir a Técnica para o shikigami

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

### PERGUNTA AO AUTOR: a porta do ambiente PRIVADO ficou aberta (o caminho espelho)
**Onde:** `src/App.jsx`, bloco "A FRONTEIRA ENTRE OS DOIS LIVROS" (o `useMemo` do `storage`)
**Situação:** em 2026-09-12 um usuário do Grimório público mandou este erro:

```
TypeError: (e ?? []) is not iterable
  em collectAutomationEntities <- CombatantPanel <- CombatTracker
```

Era uma ficha do Grimório Afty morando no inventário da 2.5.2, aberta no painel de combate da 2.5.2.
O campo `treinamentos` é LISTA num livro e MAPA no outro, e o `?? []` do coletor só cobre nulo.
Consertado no mesmo dia com duas portas, e as duas no `App.jsx`: o importador do Grimório público
recusa ficha de outro livro e avisa, e o clique e o lápis passaram a escolher a tela pelo
`rulesVersion` da ficha em vez de pela rota. Os encontros e a biblioteca de modelos da 2.5.2
passaram a receber a lista filtrada.

⚠ **O QUE FICOU ABERTO É O CAMINHO INVERSO.** Importar uma ficha da **2.5.2 dentro do `/Afty` ou do
`/Player`** continua entrando. Ela não estoura, e é justamente isso que a torna pior: o `rulesVersion`
"2.5.2" não é um id conhecido, então o `sistemaDaFicha` cai no padrão e o `deriveAfty` roda régua do
Afty sobre uma ficha da 2.5.2, com números plausíveis e trocados. O autor escolheu em 2026-09-12
fechar só a porta do Grimório público, que era a do erro relatado, e esta entrada existe para o
espelho não envelhecer calado.

**Ligada a ela:** a porta entre `/Afty` e `/Player`. Hoje uma ficha de personagem entra no inventário
do mestre e vice-versa. As fichas são isoladas por storage, então isso só acontece por
export e import, e pode muito bem ser o jeito que o autor usa para mover uma ficha de lado.

**Precisa:** o autor escolher.
1. Fechar a porta do privado também, com a mesma regra (`sistemaGravado(ficha) === sistemaDaRota`).
   É trocar o `aftyMode ? storageDaRota : {...}` por um envoltório sem ternário. Fecha o espelho e
   fecha `/Afty` contra `/Player` junto.
2. Fechar só contra a 2.5.2, e deixar `/Afty` e `/Player` trocarem ficha por import. Exige separar as
   duas comparações.
3. Não mexer. O privado é rota escondida, e quem importa lá sabe o que está fazendo.
**Anotado:** 2026-09-12, ao consertar o erro de produção

### PERGUNTA AO AUTOR: uma ficha sem nome derruba o PACOTE de import inteiro
**Onde:** `src/components/io-utils.js` (`parseImportText`, a linha do `throw`)
**Situação:** o `parseImportText` reprova criatura com `name` vazio e **LANÇA em vez de pular**:

```js
if (!c || !c.name || typeof c.name !== "string") {
  throw new Error(`Criatura inválida: ${JSON.stringify(c)}`);
}
```

Uma ficha sem nome no meio de um arquivo derruba a importação inteira, levando junto todas as outras
que vieram no mesmo pacote. Quem exporta cinco fichas e tem uma sem nome perde as cinco, e a mensagem
de erro é o JSON cru daquela ficha, que não diz qual das cinco é nem o que fazer.

⚠ **A ORIGEM já está consertada** (2026-09-05): o criador do Afty passou a gravar "Sem nome" quando o
campo está vazio, então ficha NOVA não cai mais nisso. O que sobra é (a) as fichas antigas que já
foram exportadas com `name: ""`, e (b) a fragilidade de um pacote inteiro morrer por causa de uma
entrada.

⚠ **O arquivo é da 2.5.2, e a regra número 1 diz que `src/components/` é somente-leitura.** Por isso
isto é pergunta e não conserto. O import não tem nenhum ponto de entrada do lado do Afty: o `throw`
acontece dentro do `parseImportText`, antes de qualquer código que o Afty controle.

**Precisa:** o autor escolher uma das três.
1. Deixar o importador dar um nome de reserva em vez de lançar (é a mesma regra do
   `nomeParaGravar` do Afty). Uma linha, e conserta as fichas antigas também. Exige tocar em
   `src/components/`.
2. Deixar o importador PULAR a entrada inválida e avisar quantas pulou, em vez de derrubar o pacote.
   Mais robusto e mais invasivo, e também em `src/components/`.
3. Não mexer. Ficha antiga sem nome continua exigindo edição do JSON à mão antes de importar.

**Anotado:** 2026-09-05, ao investigar o "Criatura inválida" que o autor recebeu

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

### Os três encantamentos de RD por tipo esperam agora só a ESCOLHA DE TIPO
**Onde:** `src/systems/afty/afty-equipamentos.js` (os três), `AftyTabEquipamentos`
**Situação:** ⚠ **METADE DESTA PENDÊNCIA MORREU EM 2026-09-02.** Ela tinha dois bloqueios, e a aba de
Defesas resolveu os dois que eram do sistema: o canal `rdTipo` (com o tipo no alvo) existe, e a ficha
tem onde mostrar "RD 6 contra Queimante".

O que resta é só o terceiro bloqueio, e ele é de UI: dois dos três encantamentos pedem uma ESCOLHA DE
TIPO por encantamento, e encantamento não tem mecanismo de escolha nenhum.

| Encantamento | Texto | O que falta |
|---|---|---|
| **Isolante** (uniforme) | *"5 de RD contra dano Queimante e Congelante"* | **NADA. É ligável hoje** |
| **Isolante** (escudo, só jogador) | *"a redução de dano do escudo passa também a ser aplicado a um tipo de dano elemental à sua escolha"* | escolha de tipo elemental, repetível, valor = RD do escudo |
| **Resiliente** (uniforme) | *"redução de dano igual a 5 contra um tipo de dano (exceto os danos físicos, alma e energética). A RD aumenta para 10 se for uma ferramenta de Grau Especial"* | escolha de tipo, com veto |

⚠ **Ligar só o de uniforme é pior do que os três parados**, porque o jogador passaria a acreditar que
os outros dois também funcionam. Há assert em `asserts/t-uniforme-escudo.mjs` prendendo os três
juntos: ligar um faz falhar, para a decisão ser consciente.

**Precisa:** dar aos encantamentos um mecanismo de escolha (o de habilidade não serve: o dono aqui é
uma instância de item, e o do escudo é repetível). Depois ligar os três de uma vez.
**Anotado:** 2026-08-31, e reduzido à metade em 2026-09-02 com a aba de Defesas

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

### ASSUNÇÃO: a Conjuração Aprimorada concede Feitiço no 1° nível também?

**Onde:** `src/systems/afty/afty-feiticos.js` (`totalFeiticosJogador`)
**Situação:** o livro diz *"inicia com dois Feitiços"* e *"obtém novos Feitiços conforme sobe de
nível, recebendo um novo Feitiço em todo nível par"*, e a Conjuração Aprimorada troca isso por
*"todo nível, ao invés de apenas nos níveis pares"*.

Foi implementado como **quem concede é o nível que se SOBE**: o 1° nível nunca concede (é onde os
dois iniciais já estão), então a cadência padrão vale `piso(n / 2)` e a da Conjuração Aprimorada vale
`n − 1`. A leitura alternativa é que "todo nível" inclua o 1°, e aí um Conjurador de 1° nível teria
**três** Feitiços.

A escolhida foi a primeira porque a outra contradiz "por padrão, inicia com dois Feitiços" na mesma
página. As duas só divergem a partir do **3° nível**, e no 30° a distância é de 1 Feitiço (33 contra
34).
**Precisa:** o autor confirmar. É um `n - 1` contra um `n`, numa linha só.
**Anotado:** 2026-08-31, ao ligar a progressão de Feitiços do jogador

### Um arquivo do grimório 2.5.2 está modificado na árvore de trabalho

**Onde:** `src/components/Dashboard.jsx`
**Situação:** a regra número 1 diz que `src/components/` é somente-leitura. O arquivo ganhou, numa
sessão anterior, a lógica que esconde Patamar, HP, PE e Defesa no card de uma ficha de jogador, com
comentário justificando e comparação pela string crua (`creature.rulesVersion === "player"`) para não
fazer a 2.5.2 depender do Afty.

A justificativa tem pé: o `/Player` reusa o dashboard da 2.5.2 para listar as fichas, então não havia
outro lugar. Mas a exceção não foi decidida por ninguém, e a regra segue escrita como absoluta em
quatro documentos.
**Precisa:** o autor decidir entre três saídas. Aceitar a exceção e anotá-la na regra (o card do
dashboard é a fronteira, e ela é só de leitura de campo). Copiar o `CreatureCard` para
`src/systems/afty/` como o resto do Afty faz. Ou dar ao `/Player` uma listagem própria.
**Anotado:** 2026-08-31, ao conferir a regra ao fim da sessão
**Nota:** a mudança foi COMMITADA em `ae3a08f` (Ficha Player #001), então a árvore de trabalho está
limpa e o `git diff` não acusa mais nada. A exceção continua de pé, só que agora no histórico: a
verificação de fim de sessão deixou de conseguir enxergá-la. (2026-08-31)

**Nota:** e agora são DUAS. Em 2026-09-09 o autor pediu que o `/Player` dissesse "Jogador" no lugar
de "Grimório" e perdesse a seção "Criaturas Base", e as duas moram nesse arquivo. Ele foi consultado
antes, escolheu **duas props opcionais** (`titulo` e `showSystemView`, com o padrão igual ao de hoje)
e recusou forkar o `Dashboard` e o `FolderSidebar` para o Afty, por 1876 linhas duplicadas para
mudar uma string e um booleano.

Isso não resolve a entrada, ele decidiu um CASO e não a regra. O que mudou é que a segunda exceção
tem forma diferente da primeira e é mais fácil de defender: a primeira lê `creature.rulesVersion`
dentro do componente, e a segunda só acrescenta parâmetro com padrão, deixando quem decide no
`src/App.jsx`. Se a saída escolhida um dia for "aceitar a exceção e anotá-la na regra", é essa
segunda forma que vale a pena virar a fronteira escrita. (2026-09-09)

**Nota:** e agora são TRÊS. Em 2026-09-10 o autor achou "Editar Criatura" no /Player, pediu a
varredura dos restos de criatura, e escolheu **"Uma prop opcional"** para a lista de fichas: o
`Dashboard` ganhou `vocab`, com `VOCAB_PADRAO` igual ao texto de sempre, e o `src/App.jsx` passa o
vocabulário do jogador (`vocabularioDoDashboard`, em `afty-sistema.js`) só no /Player. É a mesma
forma da segunda exceção: parâmetro com padrão, e quem decide é o `App.jsx`. (2026-09-10)

### O Ataque Básico pode rolar como Ataque Amaldiçoado?

**Onde:** `src/systems/afty/afty-pericias.js` (`resolveDano`, a linha `basico`)
**Situação:** toda entrada de arma do inventário escolhe entre a jogada física da categoria e o
Ataque Amaldiçoado (`ataqueId`, 2026-08-18). As três de pugilato (Faixas, Manoplas, Soco Inglês) não
têm linha própria, elas são o Ataque Básico, e o básico rola sempre Corpo a Corpo. O seletor aparecia
nas três e gravava o campo sem mudar número nenhum, e por isso ele foi **escondido** nelas em
2026-08-20. Esconder um controle que mentia não decidiu a regra.
**Precisa:** decidir se um golpe desarmado (ou com Faixas) pode usar a jogada de Ataque Amaldiçoado.
Se puder, o controle não volta para o card do item: o Ataque Básico existe sem item nenhum, então a
escolha mora na linha do golpe, na aba de Perícias e Testes.
**Anotado:** 2026-08-20, ao consertar os quatro buracos das Faixas

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

### ASSUNÇÃO: o limite da Versatilidade Extrema SOMA ou para no 6
**Onde:** `src/systems/afty/afty-efeitos-conteudo.js` (`LENDARIA_EFEITOS_ALVO`)
**Situação:** a Lendária diz "você pode aumentar o limite de um Nível de Aptidão **para 6**", que é
um número absoluto. O canal `limiteAptidao` é SOMA desde que nasceu, e a soma é a convenção do
sistema (duas fontes na mesma trilha levam o teto a 7, como está escrito na sessão de 2026-07-29).
Numa trilha em que nada mais mexeu as duas leituras dão o mesmo 6, e elas só divergem se outra
fonte de limite cair na MESMA trilha: somando dá 7, absoluto para em 6.
**Precisa:** o autor confirmar a soma ou pedir o teto absoluto. É uma linha.
**Anotado:** 2026-08-12, na entrada da Versatilidade Extrema
**Nota:** desde 2026-09-17 a Versatilidade Extrema não existe na Ficha de Jogador (divergência
`perdidoNoJogador`), então a dúvida vale só para a criatura e para um jogador cujo Addon a devolva.

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
sistema em 2026-08-18. Dois estão no catálogo (**Treinamento para Feitiço** e **Treinamento para
Habilidade**) e o **Estudos** segue como cartão "em breve", porque só existe a paráfrase da aba
("4 testes de INT/SAB, CD 12 + maestria, 2 sucessos concedem maestria, ou 3 testes CD 15 + nível
para especialista"), nunca conferida contra o livro.
**Precisa:** o autor mandar o texto. Entra como DADO no catálogo (`id`, `nome`, `focos`,
`vezesACada`, `concede`, `descricao`, `efeitos`, e no jogador `sucessosNecessarios`, `cdTeste` e
`tetoJogador`), sem tocar em código, e apaga o `InterludioInfo` correspondente. Ele provavelmente é
o primeiro a usar o campo `alvo` da instância (ele nomeia uma perícia) e o canal
`proficienciaPericia`. A CD dele não é a metade do Nível, e o `cdTeste` já aceita outra expressão.
**Anotado:** 2026-08-18, ao criar os Treinos Especiais
**Nota:** o texto do Treinamento para Habilidade chegou em 2026-09-16 e já está no catálogo.

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
**Situação:** o texto diz "Feitiço", e o Restringido não tem Feitiço (tem Habilidade Marcial) e o
Sem Técnica também não (tem Técnica de Estilo). Foi deixado **aberto a toda origem**, porque a vaga
que ele concede é o canal `vagasFeitico`, cuja própria nota diz que ela vale para "Feitiço, Estilo
das Sombras ou Habilidade Marcial", e porque o `deriveAfty` já soma `feiticos + estilo` no mesmo
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
2. **Duas Técnicas de Estilo imbuídas de graça naquela rodada.** Cabe no canal `imbuicoesEstilo`,
   que já existe, e é uma linha.

**Precisa:** o autor dizer se a frase vale e qual das duas ela é. Se valer a segunda, é um efeito
no remendo de `cnj_conjuracao_aprimorada`.
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

### PERGUNTA AO AUTOR: o que um Nível de Exaustão FAZ
**Onde:** `src/systems/afty/ficha/ficha-sessao.js` (`exaustao`), `afty-condicoes.js`
**Situação:** o contador de Nível de Exaustão nasceu em 2026-09-09, com o Vislumbre Celeste, e é da
sessão de todo mundo: seis Habilidades Lendárias e a Expansão de Domínio dizem *"você recebe um ponto
de exaustão"* desde sempre e não tinham onde marcar. O que falta é o EFEITO: "Exausto" existe como
nome de condição na lista da 2.5.2, e o `CONDICAO_TEXTOS` do Afty está vazio esperando o autor. Hoje
o contador conta e mostra, e a penalidade é de mesa.
**Precisa:** o texto do que cada nível impõe, e se há teto. Com ele, o contador vira canal.
**Anotado:** 2026-09-09, ao fazer o addon Vislumbre Celeste

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

## AFTY — Interlúdios (varredura de 2026-08-26)

Os buracos que a revisão das 12 Linhas de Treinamento achou. Todos são **canal que
não existe**, e não erro no catálogo: o texto de cada etapa está verbatim e no lugar.
O que já dava para consertar sem decisão de regra foi consertado na mesma sessão
(os 13 requisitos e a trava do Potencial Físico).

### Não existe orçamento LIVRE de atributo

**Onde:** `src/systems/afty/afty-treinamentos.js` (Potencial Físico, 2ª etapa)
**Situação:** ⚠ era um efeito MORTO até 2026-08-26. A etapa declarava
`{ tipo: "atributo", valor: 2 }`, e o `paraCanal` devolve null nesse tipo quando não há
alvo de instância. A linha não é repetível, então nunca houve alvo, e o efeito era
descartado calado desde que foi escrito. A declaração saiu e o benefício continua
verbatim no texto. A planilha (`AJ18`, em `afty-formulas-base.md`) confirma a intenção:
Potencial Físico 2ª = +2 Atributos.
**Precisa:** um canal de orçamento livre de atributo, o irmão do `pontosAptidao` do lado
do atributo, e ele nasce com três perguntas de regra: os 2 pontos respeitam o limite de
20 do atributo, somam no mesmo pool dos pontos de nível ou moram num pool próprio, e a
restrição aos três físicos (`ATRIBUTOS_FISICOS`, em `afty-dominios.js`) é do canal ou
da etapa. O canal `atributo` é direcionado e não serve.
**Anotado:** 2026-08-26, na varredura dos Interlúdios

### Não existe vaga extra de escolha aninhada

**Onde:** `src/systems/afty/afty-habilidades.js` (`resolveEscolhasHabilidade`)
**Situação:** Potencial Físico 4ª diz "Você recebe uma Dádiva do Céu adicional", e as
Dádivas são escolha aninhada de Restrito pelos Céus. O mecanismo que dá vaga a mais num
pool aninhado é o `concedeEscolha`, e ele lê **só** `escolhidasIds`, ou seja, vai de
habilidade para habilidade. Uma Linha de Treinamento não tem como emitir.
**Precisa:** ou um canal (`vagasEscolha`, com alvo sendo o id da habilidade dona), ou
estender `resolveEscolhasHabilidade` para aceitar concessões vindas do Motor. O segundo
caminho serve também para Addon, que hoje tem o mesmo teto.
**Anotado:** 2026-08-26, na varredura dos Interlúdios

### O teto de PER por uso vale a trilha, e o canal só alcança a linha de cura

**Onde:** `src/systems/afty/afty-cura.js` (`curaPontos`) e `afty-treinamentos.js` (Energia Reversa)
**Situação:** ✅ **A 1ª etapa foi ligada em 2026-09-16**, depois que o autor viu o teto
parado em 8 onde a conta dava 9. Ela emite +1 em `curaPontos` na linha de Cura, e o
Fluxo Constante passou a ler o mesmo teto (`tetoPERDaCura` no derive), que antes era
uma conta à parte escrita duas vezes. Preso por `asserts/t-teto-per.mjs`. A leitura
antiga de que `curaPontos` SUBSTITUI estava errada: o `max(porBloco, canal)` é só um
piso, e o canal soma, que é como a Cura em Grupo já funcionava.
**O que sobra:** a Regeneração Aprimorada e a Reversão de Técnica não têm teto de
pontos modelado, então o +1 não chega nelas. A 3ª etapa reduz em 2 o custo de UMA
aptidão nomeada, e não existe canal de redução de custo por aptidão.
**Anotado:** 2026-08-26, na varredura dos Interlúdios

### Dois benefícios de Interlúdio esperam sistema que nunca chegou

**Onde:** `src/systems/afty/afty-treinamentos.js`
**Situação:** cada um espera um sistema inteiro, e não um canal:
- **efeito de crítico** por grupo de arma e de pugilato (Manejo de Arma 3ª, Luta Completo e
  o ramo de grupo do Talento Mestre das Armas). A escolha do grupo do Talento já fica salva e
  mostra um aviso, mas a tabela de efeitos de crítico nunca foi enviada.
- **dados de vida por descanso** (Resistência 2ª). A pilha de dados de vida não é modelada,
  e três itens do capítulo de Equipamentos já a citam na descrição.

⚠ Eram quatro. O **máximo de paredes** (Barreiras 4ª) e a **rolagem de confronto de**
**expansões** (Domínios 1ª e 3ª) saíram em 2026-08-26, quando o autor mandou o Domínio ler o
Motor e deu a fórmula do Conflito.
**Precisa:** nada, por enquanto. A entrada existe para os dois não envelhecerem calados, que
é o que aconteceu com os 13 requisitos `nota`.
**Anotado:** 2026-08-26, na varredura dos Interlúdios

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
posturas, inclusive não aprendidas, com custo, duração e Exaustão. Ainda não há alvo associado ao
ataque, defesa inimiga, dano recebido por reação nem escolha de rerrolagem. Por isso Dragão,
Fortuna, Tempestade, a reação da Lua e a troca de alvo da Devastação não conseguem disparar seus
procedimentos no painel. O autor confirmou em 2026-09-12 que todas as oito posturas valem no Ápice.
**Precisa:** abrir os eventos de ataque e defesa com alvo na sessão, registrar a escolha de
rerrolagem de Fortuna e sua quantidade de usos, a reação da Lua, os TRs de Dragão e Tempestade
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

### Quimera do Mecânicas: as Ações e Características de Visionário das componentes entram
**Onde:** `src/systems/afty/afty-invocacoes.js` (`resolveQuimeraMecanicas`)
**Situação:** o *Mecânicas* diz que a Quimera "não recebe as Ações ou Características provindas de
efeitos como Visionário dos Shikigamis componentes". A ficha não marca de onde veio cada Ação ou
Característica (a vaga do Visionário é um número, e não um item), então a Quimera recebe todas as
da principal e as escolhas, sem saber quais ocuparam vaga de Visionário.
**Precisa:** marcar na ficha da invocação os itens que usam vaga concedida, ou o autor dizer que a
mesa confere isso à mão.
**Anotado:** 2026-10-01, na Etapa 9 da atualização de Controlador e Invocações

### Morte do Fundamento no Encontro não chega à criatura da biblioteca
**Onde:** `src/systems/afty/encontros/usar-encontro-afty.js` (`REGISTRAR_FUNDAMENTO_PERDIDO`)
**Situação:** a perda da Técnica Inata (DA-07) é gravada na ficha. Na Ficha Final ela vai para a
criatura (`creature.fundamentosPerdidos`). No Encontro, o combatente guarda uma CÓPIA da ficha, e a
gravação vai para essa cópia, que vale para o resto do Encontro. A criatura da biblioteca não sabe
da morte, e abrir a Ficha dela depois mostra a Técnica inteira.
**Precisa:** um caminho do Encontro para a biblioteca (o mesmo que um dia levar PV, PE ou estado
de volta), ou um aviso no fim do Encontro com as perdas a copiar.
**Anotado:** 2026-10-01, na Etapa 8 da atualização de Controlador e Invocações

### Forma de Arma: a invocação ainda não vira arma no arsenal do dono
**Onde:** `src/systems/afty/afty-derive.js` (lista de armas do dono), `ficha/abas/AbaInvocacoes.jsx`
**Situação:** a Forma de Arma (Adicionais) já tem a escolha da arma, o custo pelo grau, o requisito
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
**Situação:** os auxílios de Defesa, Acerto e RD viraram interruptor na Ficha Final e mexem no
número do dono e no dela (2026-08-31). O de **Dano Adicional** ficou de fora porque ele é um DADO
("1d6 de Dano Adicional") e vale *"em um próximo ataque"*, e o canal `danoBonus` do Motor soma um
número fixo, enquanto o `dadosDano` conta dados da PRÓPRIA arma. Hoje ele aparece na lista de
Bônus com o dado escrito, para a mesa somar à mão.
**Precisa:** um canal que aceite um dado de face própria na linha de dano, que é o mesmo bloqueio
das Aptidões (ver a memória `afty-aptidoes-motor`). Quando ele existir, o Dano Adicional entra.
**Anotado:** 2026-08-31

### Prejuízo por Múltiplos Auxílios não é contado
**Onde:** `src/systems/afty/afty-invocacoes.js`, `ficha/abas/AbaInvocacoes.jsx`
**Situação:** o `resolveAcao` devolve o texto do prejuízo (`-1 por uso repetido na rodada`,
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
**Precisa:** fazer os dois leitores caírem no texto da arma quando ela for custom. É a mesma forma do
`alcancePorTreino`: o catálogo continua respondendo pelo id, e a arma própria responde por si.
**Anotado:** 2026-09-09, ao fazer o addon de Criação de Armas

---

### Clã Zenin ficou com bônus de atributo livre
**Onde:** `src/systems/afty/afty-origens.js`
**Situação:** Gojo, Inumaki e Kamo têm `entre` com um par de atributos. O Zenin ficou livre entre
os 6, e não se sabe se foi decisão ou esquecimento.
**Precisa:** o autor dizer se o Zenin é restrito também e, se for, quais dois atributos.
**Anotado:** 2026-07-29, migrado de `afty-status.md` em 2026-08-09

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
