# Status do Grimório Afty (handoff para chat novo)

Estado atual do sistema Afty (atualizado 2026-08-18). Leia junto com:
`docs/roadmap-versionamento-e-fichas.md` (arquitetura) e `docs/afty-formulas-base.md` (fórmulas).

> 📋 **A FILA DE TRABALHO NÃO É ESTE ARQUIVO.** Desde 2026-08-09 toda pendência mora em
> **`docs/a-fazer.md`**, que vale para o repositório inteiro (2.5.2 e Afty) e é onde os outros
> colaboradores também anotam. Este doc é o LOG das sessões e o porquê das decisões.

> ⚠ **Este documento começou em 2026-07-17 e o trabalho posterior está registrado por sessão.**
> Ao retomar, leia primeiro a sessão mais recente e depois o Contexto rápido.
>
> **AS 6 ESPECIALIZAÇÕES ESTÃO FECHADAS** (2026-07-22): Combatente 70, Lutador 69, Conjurador 64,
> Suporte 57, Restringido 53, Controlador 47 = **360 habilidades**. Mais **Talentos** (51), em
> sistema próprio (`afty-talentos.js`).
>
> ⚠ Eram 367. O autor mandou **remover "Teste de Resistência Mestre"** (2026-07-27), que existia
> nas seis, uma por especialização. Não reintroduzir.
>
> ⚠ E **"Liberações Expandidas"** (Conjurador nível 8) saiu em 2026-08-09, levando o Conjurador de
> 65 para 64. Ela dava VAGAS de Liberação Máxima, e o suplemento acabou com a ideia de vaga. Não
> reintroduzir. Ver a sessão de 2026-08-09.
>
> **NÍVEIS LENDÁRIOS FECHADOS** (2026-07-22): **11 Melhorias Superiores**, **16 Habilidades Lendárias**
> e **6 Habilidades Ápice**, em sistema próprio (`afty-alto-nivel.js`), com card próprio no fim
> da aba Especializações. Ver [NÍVEIS LENDÁRIOS](#-níveis-lendários-21-catálogo-completo).
>
> **Falta transcrever:** Arsenal Amaldiçoado e Estilo Marcial (citados pelo Restringido).
>
> **HABILIDADES GERAIS** (2026-07-26/27), em `src/systems/afty/afty-gerais.js`, card próprio na
> aba Habilidades. São 5, abertas a QUALQUER origem: Especialização, Aptidão, Melhoria Superior,
> Habilidade Lendária e Treinamentos. Três consequências que **invalidam números escritos mais
> abaixo neste doc**:
>
> 1. **Contador único da aba Habilidades** = `2 × Maestria`, **+2** Desafio, **+4** Calamidade,
>    `3 × Maestria` no Beyond (troca o dobro, não soma). Feitiços e Habilidades Gerais gastam o
>    MESMO caixa. Matou o `totalFeiticos(nd)` (era `2 + ND/2 + marcos de 10 e 20`).
> 2. **O ND não concede mais Habilidades de Especialização nem Aptidões Amaldiçoadas.** As duas
>    fórmulas `1 + floor(ND/3)` foram removidas. Só as Gerais Especialização e Aptidão dão vaga, e
>    cada uma sai metade da Maestria de vezes. Por pega, a Especialização dá `1 + metade da
>    Maestria` e a **Aptidão dá `1 + Grau`** (mudou em 2026-08-12, ver a sessão daquele dia).
> 3. **Melhorias Superiores e Habilidades Lendárias exigem a Geral correspondente** para
>    destravar, além do ND 21/22 de sempre. A Geral em si pede ND 21 e ND 22.
>    Treinamentos dá `metade do ND` em Focos, e sai `1 + ND/10` de vezes.
>
> **APTIDÕES**: 11/62 em 2026-07-30, mais **13 das 18 de Maldição** em 2026-08-01 (a origem que as
> destrava foi criada no mesmo dia). A razão da Maldição é melhor porque as dela são passivas de
> corpo, e não ativas pagas em PE com efeito sobre terceiros.
>
> **MOTOR DE AUTOMAÇÃO — placar RECONTADO em 2026-07-29: 155/412.**
> Combatente **30/70** · Lutador **35/69** · Restringido **28/53** · Talentos **28/51** ·
> Conjurador **16/64** · Suporte **10/57** · Controlador **8/47** · **Origens** (Herdado com os
> 4 clãs, Restringido, Feto Amaldiçoado Híbrido e Sem Técnica). Faltam as **Ápices (6)**.
>
> ⚠ **Contar só `HABILIDADE_EFEITOS` SUBESTIMA o placar.** Existem OITO caminhos de ligação, e
> uma contagem que olha um só erra feio (a de 2026-07-29 errou, e mandou 57 habilidades para uma
> lista de "livres" que não eram):
>
> | # | Caminho | Onde |
> |---|---|---|
> | 1 | efeito direto | `HABILIDADE_EFEITOS` / `TALENTO_EFEITOS` (116) |
> | 2 | opção da escolha aninhada | `ESCOLHA_EFEITOS` (27) |
> | 3 | canal de invocação | `CONTROLADOR_EFEITOS_INVOCACAO` (8) |
> | 4 | estado da bancada | `requerHabilidade` em `COMBATE_ESTADOS` (33) |
> | 5 | parâmetro passado no derive | `resolveCombate({ pistoleiroEmperrar... })` (3) |
> | 6 | `quando` de OUTRA habilidade | `tem_cmb_armas_perfeitas` na opção de Armas Escolhidas (3) |
> | 7 | `concedeEscolha` | soma vaga no pool de outra habilidade (5) |
> | 8 | caminho próprio | `efeitosArmasDedicadas`, `ESCOLHAS_DE_HABILIDADE` do Roubo (2) |
> | 9 | linha do catálogo de CURA | `requer` em `FONTES_CURA` (afty-cura.js). A Descarga Reanimadora não tem canal nenhum e mesmo assim tem linha, porque ela ESPELHA outra (1) |
>
> **Não existe habilidade "somável e livre" sobrando.** O que falta cai todo em bloqueio nomeado:
> Feitiços ainda têm efeitos pendentes (39), mas os Feitiços de Dano passaram a ler os canais
> `dadosDano` e `danoBonus` em 2026-08-07. ~~Canal de CURA não existe (20)~~ ✅ **RESOLVIDO em 2026-08-03**
> (ver a sessão), invocação precisa de marcador por-invocação para as Melhorias e de stat de **RD**
> e **dados de dano** (36), subsistemas nunca enviados (Apoio, Imitação, Votos, técnicas marciais),
> e canais que faltam (troca de atributo na fórmula, vantagem por condição, vaga de pool,
> proficiência de arma, PE de Aptidão).
>
> ⚠ **Duas afirmações VELHAS deste doc morreram:** "estados ligáveis em combate são nunca
> automatizáveis" (a bancada existe, com 31 estados, e `quando` resolve) e "os 4 recursos de
> classe não existem" (3 existem: `pontosPreparo`, `empolgacaoMaxima`/`Inicial`, e Estamina que É
> o PE. Falta só o PE temporário exclusivo de Aptidão).
>
> A automação do Conjurador ainda tem bloqueios estruturais, mas `afty-feiticos.js` já lê
> `dadosDano`, `danoBonus`, CD, reduções de custo por Feitiço-base e melhorias de Ritual. A ficha
> final mostra as propriedades calculadas do Feitiço e atualiza alcance, área, dano, CD, acerto,
> conjuração e demais resultados afetados pelo Ritual. Auxiliares, Especiais e outras fontes de
> custo continuam pendentes conforme a revisão de 2026-08-09.
> **CURA virou sistema em 2026-08-03** (`afty-cura.js`), com 7 canais novos e card próprio na aba
> Habilidades.
>
> Canais abertos nesta leva: **`rdAlma`** (a RD Geral cobre todo tipo MENOS alma) e
> **`espacosCarga`** (sobe o limite de carga).
>
> **POOL EXCLUSIVO** (2026-07-30): cinco fontes de bônus numérico **não acumulam
> entre si**, e vale o maior valor de cada canal. Habilidade Única de item já está
> ligada, as outras quatro esperam cano. Ver a seção da sessão de 2026-07-30.
>
> **EQUIPAMENTOS revisado** (2026-08-01): a aba de inventário da CRIATURA é simplificada por
> decisão. Defesa da armadura = o CUSTO dela mais o grau, RD do escudo virou **RD Geral**, a arma
> dá +1 de Acerto por grau na linha dela, a arma virou EQUIPÁVEL (e a linha de dano exige isso),
> cada encantamento DESCE UM GRAU nas contas, e a **penalidade de Destreza passou a ser aplicada**
> (era calculada e ficava parada desde 2026-07-22). Ver a sessão de 2026-08-01.
>
> **RESTRINGIDO fechado** (2026-08-03): a trava Tipo ↔ Origem virou BIDIRECIONAL, e ele perdeu os 5
> Treinamentos de energia amaldiçoada. **VAGA EXCLUSIVA DE TALENTO** (`vagasTalento`) nasceu na mesma
> sessão, irmã da de Feitiço. E o criador ganhou **RASCUNHO AUTOMÁTICO** (`afty-rascunho.js`), que
> não existia: até aqui recarregar a página perdia a ficha inteira. Ver a sessão de 2026-08-03.
>
> **FICHA FINAL construída:** a rota de uso da criatura possui vitais, abas, rolagens com histórico,
> estados de combate, Feitiços e Rituais. O plano original permanece em `docs/afty-ficha-final.md`.
> Os Feitiços ficam recolhidos por padrão e, quando abertos, mostram propriedades, descrição
> verbatim, resultados clicáveis e os controles de Ritual.
>
> 👉 **Começando um chat novo? Vá direto para
> [PENDÊNCIAS DE ESPECIALIZAÇÕES](#-pendências-de-especializações-lista-de-retomada).**

---

## SESSÃO DE 2026-08-20 (parte 3): O QUE AS FAIXAS NÃO ESTAVAM ENTREGANDO

Pergunta do autor: *"como está funcionando Faixas atualmente? E o Acerto de Faixas, aumento de Dano
e etc"*. A varredura respondeu e achou quatro buracos, e ele mandou consertar os quatro.

**O desenho continua o mesmo, e ele está certo.** Faixas, Manoplas e Soco Inglês (`grupo: "pugilato"`)
não viram linha de ataque: elas **são** o Ataque Básico. Sem Ferramenta Amaldiçoada não rendem número
nenhum, e com ela dão +1 de Acerto por degrau mais o dano da `DANO_ADICIONAL_ARMA`. O que estava
quebrado era o que o item levava para a linha ALÉM do grau.

### 1. ⚠ O encantamento de item era descartado calado, e ainda cobrava o degrau

Potente, Poderosa, Penetrante e Cruel emitem efeito com `alvoItem`, ou seja, com o alvo sendo o id do
item. A linha do Ataque Básico respondia só pelo escopo `basico`, então **ninguém escutava**. E como
cada encantamento desce um degrau do grau de cálculo, pôr Potente numas Faixas de Primeiro Grau era
prejuízo puro: perdia 4 de dano e não ganhava o dado.

Agora a linha básica responde por `basico` **mais o id do item de pugilato equipado**. Medido: Faixas
de Primeiro com Potente saiu de `1d8+28` para `2d8+28`, e a mesma Espada Curta com o mesmo
encantamento continua exatamente onde estava.

⚠ **Só o id entra no escopo.** `"arma"`, a categoria e o grupo ficam de fora de propósito, porque o
livro diz que Faixas não são armas, e um efeito que diz "com arma" não pode passar a valer para o
soco.

### 2. O hover somava o Precisa dentro do Grau

`fa.fontesAcerto` existe justamente para repartir isso, e a linha básica era a única que não o
recebia: Faixas de Primeiro com Precisa mostrava "Grau da Ferramenta: 5" em vez de 3 mais 2. Número
certo, detalhamento errado, que é a mesma classe de bug do `defesaAtributo`.

### 3. O seletor de Ataque aparecia nas três e não fazia nada

O card de arma oferece Corpo a Corpo ou Amaldiçoado para toda entrada, mas o golpe básico rola sempre
Corpo a Corpo. Escolher Amaldiçoado gravava o campo e não mudava número nenhum. O seletor saiu das
três de pugilato.

⚠ **Isso NÃO decidiu a regra.** Se o Ataque Amaldiçoado tiver de valer para golpe desarmado, a
pergunta é do autor, e o controle não moraria no card do item de qualquer jeito, porque o Ataque
Básico existe sem item nenhum.

### 4. A Fineza do Soco Inglês era decorativa

O básico abria Destreza só pelo canal `finezaAtaque` (Corpo Treinado), e a propriedade impressa na
tabela do Soco Inglês não chegava a lugar nenhum. Com Força 8 e Destreza 18 o golpe saía `1d8+31` de
Força, e agora sai `5d8+18` de Destreza.

### A regra que os quatro consertos obrigaram a escrever: UM item define o golpe

O grau sempre foi o **maior** entre as de pugilato equipadas, e nunca a soma. Agora que o item leva
encantamento e Fineza junto, tudo isso vem do **mesmo** item, senão dois pares de Manoplas
empilhariam encantamento de duas armas num golpe só.

Item **sem** Ferramenta passou a entrar na disputa com rank 0. Ele não muda grau nenhum, e serve para
ser o dono do golpe quando é o único equipado, que é como ele recebe o encantamento do **Manejo
Especial** ("toda arma que você estiver manejando").

### O que ficou de fora, e por quê

- **A jogada de ataque com Fineza** continua saindo da marcação da ficha (`ataqueFineza`), e não da
  arma. Vale igual para a Espada Curta, é anterior a esta sessão, e mexer nisso é decisão de regra.
- `contaComoArma: false` e `dano: { desarmado: true }` continuam **sem leitor**. Quem separa o
  pugilato no cálculo é o `grupo`. Os dois campos documentam, e agora o doc diz isso.

### Verificação

- `npx eslint src/systems/afty/` passou.
- `npx vite build` passou.
- `npm run asserts`: **585 asserts em 17 arquivos**. O novo é o `t-pugilato.mjs` (37): os cinco graus
  medidos um a um, a Faixas na mochila e a sem Ferramenta valendo zero, as duas equipadas valendo a
  maior, os quatro consertos, e a Espada Curta como régua de que nada mudou para arma de verdade.
- `src/components/` sem alteração.

---

## SESSÃO DE 2026-08-20 (parte 2): ARTES DO COMBATE E EMPOLGAÇÃO CHEGAM SOZINHAS

Pedido do autor: **Artes do Combate** (Combatente 1°) e **Empolgação** (Lutador 1°) são recebidas de
graça, ao alcançar o nível.

**Não foi preciso motor novo, de novo.** É o mesmo caminho aberto em 2026-08-10 para o Suporte e
reusado em 2026-08-16 pelo Controlador: `automatica: true` na entrada,
`habilidadesConcedidasPelasEspecializacoes` lê a flag, e `resolveHabilidades` junta `concedidas` em
`escolhidas` **depois** de contar o orçamento. Somam **nove** automáticas, e o comentário do topo do
`afty-habilidades.js` continua listando todas, uma a uma.

**O que muda na mesa:**

- todo Combatente 1 passa a ter **Pontos de Preparo** (nível de Combatente mais o modificador de
  Sabedoria). Antes eram zero para quem não gastasse vaga na Base, e a Base é a única fonte deles;
- todo Lutador 1 tem o **quadro de Empolgação** ligado, e as **duas Manobras** do nível 1 continuam
  sendo escolha dele. Conceder a habilidade não engole a escolha aninhada: `resolveEscolhasHabilidade`
  recebe `escolhidas`, que já vem com as concedidas dentro.

⚠ **A concedida CONTA no `contar()`**, e foi isso que um assert antigo pegou. O `t-ponta.mjs` media
`contar("lutador")` num Lutador ND 12 e esperava 0 com a ficha sem habilidade nenhuma. Agora é 1,
porque a Empolgação está na ficha sem ninguém ter escolhido. Não é efeito colateral, é a definição:
as marcas saem de `habilidades.escolhidas`, e a concedida mora lá. Os números foram corrigidos e
entrou o assert que amarra as duas pontas, trocando o Lutador por um Restringido para a conta zerar.

**Ficha antiga não cobra duas vezes.** Quem já tinha gravado as duas na mão continua com elas
efetivas, e elas saem do contador de gasto pelo descarte contra o `concedidasSet` que
`resolveHabilidades` já fazia desde o Controlador.

### Verificação

- `npx eslint src/systems/afty/` passou.
- `npx vite build` passou.
- `npm run asserts`: **548 asserts em 16 arquivos**. O novo é o `t-bases-automaticas.mjs` (34), que
  cobre quem recebe e quem não recebe, o orçamento medido contra o Restringido (a única
  especialização sem Base automática nenhuma), a ficha antiga sem duplicata, os Pontos de Preparo e
  o quadro de Empolgação chegando sem escolha, e as Manobras sobrevivendo à concessão.
- `src/components/` sem alteração, conferido por `git status`.

---

## SESSÃO DE 2026-08-20: ADDONS, E POR QUE O CASO MAIS EXTREMO NÃO PEDIA CÓDIGO

Pedido do autor: idealizar uma ferramenta para as pessoas escreverem Addons e Plugins, mudando o
site para o contexto da mesa delas sem abrir o GitHub. *"O site é para usar o Raw do sistema"*, e
muita gente faz modificação pequena na hora de criar criatura.

**Nada de código nesta sessão.** O desenho inteiro mora em **`docs/afty-addons.md`**, com as 7
decisões dele datadas. O que segue é só o porquê.

### O achado que mudou o plano

O autor pediu, explicitamente, para o addon virar quase uma linguagem, e aceitou o risco de
segurança ("escopo pequeno de pessoas de confiança"). Mesmo assim a camada de JavaScript saiu da
primeira fase, e o motivo não é segurança: **ela não resolve os casos dele**.

Ele deu quatro exemplos reais de coisas que já tentou fazer e não couberam. Medidos contra o código:

| O caso | O que falta de verdade | Tamanho |
|---|---|---|
| Habilidade que escala com quantas do mesmo arquétipo você tem | campo `tags` na entrada, mais `contar()` no DSL | pequeno |
| Trocar o atributo do cálculo de PV | canal `hpAtributo`, irmão exato do `defesaAtributo` que já existe | pequeno |
| *Ciclo de Adaptação* (Mahoraga): o mestre acrescenta habilidade no meio da luta, já calculando | conceder entrada de catálogo a partir da SESSÃO | médio |
| Somar a barra de PV e PE com a de outra criatura | vínculo entre DUAS criaturas | atravessa a arquitetura |

**Zero dos quatro são destravados por deixar escrever JavaScript.** Três pedem primitiva que falta no
motor, e o quarto pede DADO que a derivação não tem: `deriveAfty` é função pura de UMA criatura,
então um gancho em JS rodando dentro dela também não enxergaria o amigo.

Daí saiu o princípio que segura o sistema: **o motor ganha o VERBO, o addon guarda o SUBSTANTIVO.**
`contar()`, `hpAtributo`, conceder-da-sessão e vínculo entram no motor e são genéricos. Mahoraga fica
no addon do autor e ninguém mais vê. É a diretriz de 2026-07-27 do cabeçalho do `afty-efeitos.js`,
agora valendo para o homebrew.

### "Generalista" não quer dizer "deixar programar"

Os seis exemplos que o autor deu de conteúdo homebrew (Tipo de Dano novo, Condição nova,
Especialização nova, Aptidão nova, Treino novo, mudar coisa existente) são **todos linha de tabela**.
Nenhum precisa de código. Então generalista quer dizer abrir TODA tabela pelo mesmo caminho, e são
209 constantes de catálogo exportadas no Afty hoje.

### O encontro misto partiu o addon em duas metades

O autor mandou permitir encontro com criaturas de addons diferentes, porque *"nem sempre é mudança
geral de sistema, pode ser mudança mínima em uma única criatura"*. Isso obriga:

- **Acrescentar é global**, e é seguro porque todo id nasce com o namespace do pacote.
- **Remendar e desligar são por criatura**, senão desligar *Corpo Treinado* na sua ficha quebraria a
  do vizinho no mesmo encontro.

A segunda metade pareceu cara e não é: `deriveAfty` é síncrona, tem 8 pontos de chamada, e JS não
interleava, então um escopo de módulo aberto e fechado em volta da derivação dá remendo por criatura
sem passar registro por 209 constantes.

### A recomendação que ele aprovou

Fase 0 (as 4 primitivas) e fase 1 (acrescentar por JSON), e **parada obrigatória** depois. O motivo é
que o autor escreve JSON: as primitivas mais uma caixa de colar JSON já põem os quatro casos dele na
mesa dele, fora do raw. A Oficina serve a quem NÃO escreve JSON, e ela é a parte cara.

Remendo e desligamento **foram pedidos por ele e estão adiados, não recusados**. O remendo é a única
parte com preço que não termina: ele aponta para id do raw, e refatorar o catálogo apodrece o
remendo dos outros calado, que é o problema do requisito `nota` com o agravante de o conteúdo ser de
terceiro.

### Uma trava do 2.5.2 caiu

Função nova do DSL exigiria editar `src/components/fm-dsl.js`, que é somente-leitura, e o cabeçalho
do `afty-efeitos.js` mandava parar e perguntar nesse caso. **Perguntei e o autor liberou a cópia do
avaliador para `src/systems/afty/`.** Daqui para frente a linguagem cresce do lado do Afty.

### O que foi CONSTRUÍDO no mesmo dia: as duas primitivas pequenas

O autor aprovou a recomendação, e a fase 0 começou pelas duas que dá para testar de imediato.

**`src/systems/afty/afty-dsl.js`** nasceu da cópia do `fm-dsl.js`, e os **6 pontos de importação**
do Afty passaram a apontar para ela (derive, efeitos, equipamentos, habilidades, invocações e o
builder). A 2.5.2 segue com a cópia dela, intacta, e as duas divergem de propósito daqui em diante.

Duas coisas novas na linguagem:

1. **Literal de texto**, que o `fm-dsl` não tem. Só vale como argumento de função, e o validador
   reprova em qualquer outro lugar: `2 + "abc"` é erro, e não 2. Deixar o texto virar zero calado
   esconderia o engano de quem escreveu.
2. **`contar(marca)`**, a irmã da booleana `tem_*`: uma pergunta se você tem, a outra conta quantas.
   O caso do autor, `2 + contar("adaptacao") - 1`, roda de ponta a ponta.

⚠ **As marcas AUTOMÁTICAS são decisão minha, e estão anotadas como tal no código e no doc.** Cada
entrada rende a marca escrita nela (`tags`, que é por onde o Addon vai marcar as dele) mais a
família e a especialização dona. Sem as automáticas a função nasceria morta, porque nenhuma entrada
do catálogo raw tem `tags` e só a fase 1 traria a primeira. Com elas, `contar("lutador")` já
responde hoje. Apagar o bloco é uma linha.

**Canal `hpAtributo`**, irmão exato do `defesaAtributo`: o PV lê `modHp` no lugar de `modCon`, e o
hover troca "Constituição × ND" por "Força × ND (no lugar da Constituição)" mais a fonte que
substituiu. Alvo AUSENTE dá literalmente o texto do autor ("para um a minha escolha"): a convenção
do motor é que canal com destino e sem alvo vale para todos, o que aqui quer dizer o melhor dos
seis.

### Um bug pré-existente que os asserts acharam

`deriveAfty(null)` morria com *"Cannot read properties of null (reading 'feiticos')"*. Era o **único
acesso cru a `creature.`** sobrando no arquivo (linha 1076 no HEAD, conferida), e a invariante de
"ficha suja não derruba o derive" já é assert padrão do projeto desde os Treinos Especiais. Conserto
de um caractere, e não tem relação com os Addons.

### A FASE 1 inteira, na mesma madrugada

O autor foi dormir por volta das 01:30 e mandou: *"Vá programando isso até chegar no limite. Qualquer
coisa que precisar de mim, você guarda e continua fazendo o que não precisa."* As duas primitivas
que faltavam (8.3 e 8.4) travam em decisão dele, então as perguntas foram para o `a-fazer.md` e a
noite foi gasta na **fase 1**, que estava aprovada e não dependia de resposta.

**Está de pé o caminho inteiro, de colar o JSON até o número mudar na Ficha.**

| Arquivo novo | O que é |
|---|---|
| `afty-addons.js` | o registro: famílias, pacote, namespace, validação, reconstrução do mundo |
| `afty-addons-biblioteca.js` | a morada de instalação (`fm_addons_afty_v1`) |
| `AftyTabAddons.jsx` | a aba, com a biblioteca em cima e o que a criatura usa embaixo |

**A decisão que carrega o resto: o registro reescreve o array do catálogo NO LUGAR** e manda a
família religar os índices dela. É estado mutável de módulo, e a escolha é consciente, porque compra
duas coisas grandes: zero mudança nos ~60 pontos que leem catálogo hoje, e **os 13
`validarCatalogo*` passam a validar conteúdo de addon de graça**, já que leem o mesmo array. O
portão de aceitação que o doc prometia já estava escrito desde sempre.

**DOZE famílias ligadas**, e elas cobrem os **seis exemplos de homebrew que o autor deu**:
habilidades, talentos, aptidões, especializações, origens, treinamentos, treinos especiais, as três
de alto nível, tipos de dano e condições. O trabalho por família é o RELIGADOR que conhece as estruturas derivadas daquele módulo,
e esquecer uma dá bug calado. Habilidades tinha **três** (o array, o pool do Roubo de Habilidade e o
índice) e Tipo de Dano tinha **duas** (o objeto e o `TIPO_DANO_OK`, que sanea arma custom: sem
religar o `Set`, um tipo de addon apareceria na lista e seria rejeitado calado ao gravar a arma).

As duas últimas são **TABELA e não catálogo**, e provam que a mesma `registrarFamilia` serve para as
duas formas. A Condição trouxe uma consequência assumida: ela é gravada no Feitiço **pelo NOME**, e
não por id, então o namespace vale só para o `id` da entrada, o nome entra limpo, e **não existe
linha morta para condição**. É honesto, porque condição é rótulo, e rótulo que perde a fonte
continua sendo rótulo.

### Duas lacunas que só o exemplo de ponta a ponta achou

1. **O `efeitos` do addon era validado e nunca aplicado.** O motor lia só o `HABILIDADE_EFEITOS`, e
   as habilidades de addon entravam na ficha sem somar número nenhum. `coletarEfeitos` passou a ler
   o mapa PRIMEIRO e a entrada como fallback, o que vale para todas as famílias de uma vez e não
   muda nada para o raw (nenhuma entrada do livro tem `efeitos` inline). É o argumento para todo
   exemplo de doc ser coberto por assert: o pacote de exemplo do `afty-addons.md` é executado.
2. **O validador de Treino Especial reprovava todo addon.** Ele cobrava a convenção de id `tes_`, e
   o id de addon vem com o namespace na frente. Era a única checagem de FORMATO de id do sistema, e
   agora ela usa `partirId`.

**Onde os addons entram antes da derivação:** builder, Ficha Final e Encontro, sempre no MESMO memo
do `deriveAfty`. Num `useEffect` rodaria depois do render e a primeira derivação sairia com o
catálogo velho.

**Namespace:** o autor do addon escreve id sem prefixo, e o registro prefixa (`minha-mesa:x`).
Referência a um irmão do próprio pacote ganha o prefixo junto, e referência que não achar irmão fica
crua e vai procurar no raw, que é o caso comum.

**Linha morta e marcada** (decisão 4), com os dois portões separados: instalar addon quebrado é
**recusado**, e ficha salva **sempre abre**. O que o mundo não tem aparece marcado, não soma nada, e
diz de qual addon veio, o que falhou e o que fazer.

### A REVISÃO da madrugada, às 05:33

O trabalho da fase 1 saiu rápido, então a retomada foi gasta revisando o que eu mesmo tinha escrito,
antes de somar família nova. Achou quatro coisas, e três eram defeito de verdade.

**1. O Encontro contradizia o próprio doc.** A seção 3 do `afty-addons.md` diz que a união dos
addons entra UMA vez, e eu implementei reaplicação POR COMBATENTE. Dois defeitos: depois do laço o
mundo ficava com o addon do ÚLTIMO derivado, então qualquer leitura de catálogo no render (um
`getHabilidade` num painel) via um mundo arbitrário, e o catálogo era reescrito N vezes em vez de
uma. Agora é `unirAddons` uma vez, antes do laço.

**2. O catálogo dividia OBJETO com a ficha salva.** O pacote que está em `creature.addons` era o
mesmo que alimentava o mundo, e o `{ ...entrada }` do `prefixarEntrada` é raso: `escolha`,
`requisitos` e afins continuavam sendo a mesma referência dos dois lados. Como o sistema MUTA
entrada de catálogo em pelo menos um lugar (`dona.escolha.opcoes = HABILIDADES_ROUBAVEIS`), uma
mutação do catálogo vazava para dentro da criatura gravada. Agora a entrada é clonada na aplicação,
por ida e volta em JSON, que de brinde tira o que não for serializável.

**3. Duas funções minhas eram código morto.** `unirAddons` e `epocaAddons` foram escritas na noite e
nunca chamadas. As duas viraram a solução do item 1: a união é o que se aplica, e a **época entra na
chave do cache** de derivação do Encontro. Hoje a época quase nunca muda número, porque addon só
acrescenta e id é prefixado, mas essa invariante é da FASE 1 e a fase 3 a quebra. Deixar a época
fora da chave seria plantar um bug para aquele dia, e custa zero.

**4. A linha morta faltava no Encontro.** Ela estava no criador e na Ficha, e não no painel de
combatente, que é justamente onde o mestre abre a criatura de OUTRA pessoa. Ou seja: faltava
exatamente no caso em que o addon está faltando. Agora está nas três telas.

**5. A aba tinha um beco sem saída.** Addon que chega DENTRO de uma ficha de fora não tinha como ser
guardado, e addon da biblioteca não tinha como sair. Entraram os dois botões que fecham o ciclo:
guardar na biblioteca e copiar o JSON. O formato é o mesmo dos dois lados, então o que sai por
cópia entra de volta por texto colado.

### Verificação

- `npx eslint src/systems/afty/` passou.
- `npx vite build` passou.
- **371 asserts** em treze suítes, salvos em `asserts/` (ver a pergunta no `a-fazer.md`). As duas primitivas: 30 de **paridade** entre o avaliador copiado e o da 2.5.2 (mesma
  entrada, mesmo número, inclusive nos erros e no `validateExpression`), o `contar()` ponta a ponta
  pelo Funcionamento Básico (0, 1, 2 e 3 habilidades na ficha, marca inexistente, expressão
  quebrada, e o mapa de marcas não vazando para o seletor `{ }`), e o `hpAtributo` (troca, troca
  para atributo pior não fazendo nada, duas concedidas valendo a melhor, `quando` ligando e
  desligando, o Patamar multiplicando por cima, e as quatro linhas do hover).
- Os da **fase 1**: o ciclo inteiro de instalar, usar e desinstalar sem deixar resto (aplicar A e
  depois B tem de dar o mesmo que aplicar os dois de uma vez), o namespace com referência a irmão e
  referência ao raw, as três estruturas derivadas religando, o validador do raw reprovando conteúdo
  de addon, a criatura usando a habilidade de addon com a `tag` dela chegando no `contar()`, a união
  de fichas com addons diferentes (encontro misto) e a divergência de versão sendo relatada, a
  biblioteca com `localStorage` corrompido e com `localStorage` indisponível, e a linha morta nos
  três motivos dela.
- `src/components/` sem alteração, conferido por `git status` e `git diff`.

### Um bug pré-existente a mais, achado pelos asserts

Importar `afty-habilidades.js` como PRIMEIRO módulo do processo estoura um ciclo em
`afty-combate.js` (*"Cannot access 'POSTURAS_DE_COMBATE' before initialization"*). **Confirmado
idêntico no HEAD**, então não veio dos Addons. Hoje é latente porque o app entra sempre pelo
`afty-derive.js`. Está no `a-fazer.md`, e enquanto não for resolvido todo assert novo tem de importar
o derive primeiro.

---

## SESSÃO DE 2026-08-19: O GRAU DA CRIATURA CRESCEU PARA NOVE, E AS DUAS ESCADAS SE SEPARARAM

Pedido do autor: trocar a tabela do Grau das Criaturas. Eram 5 faixas de ND e passaram a ser 9.

| ND | Grau | ordem | rank |
|---|---|---|---|
| 1 a 4 | Quarto Grau | 1 | 1 |
| 5 a 8 | Terceiro Grau | 2 | 2 |
| 9 a 12 | Segundo Grau | 3 | 3 |
| 13 a 16 | Primeiro Grau | 4 | 4 |
| 17 a 20 | Semi-Grau Especial | 5 | 5 |
| 21 a 25 | Baixo Grau Especial | 6 | 5 |
| 26 a 30 | Alto Grau Especial | 7 | 5 |
| 31 a 35 | Calamidade | 8 | 5 |
| 36+ | Divino | 9 | 5 |

As quatro primeiras faixas não mudaram. O que era "Grau Especial" do ND 17 para cima virou
**Semi-Grau Especial** de 17 a 20, e ganhou quatro degraus em cima.

### A lista fazia serviço duplo, e esse era o problema de verdade

`AFTY_GRAUS` era ao mesmo tempo o Grau da CRIATURA por faixa de ND e o Grau de EQUIPAMENTO da
Ferramenta Amaldiçoada. Somar quatro entradas nela teria posto **Calamidade e Divino no seletor de
grau do item**, e nas tabelas que são chaveadas pelos mesmos valores: `FA_CRIACAO`, `FA_BONUS_ARMA`,
`DANO_ADICIONAL_ARMA` e os encantamentos, que são todos do item e não da criatura.

Então as duas escadas se separaram:

- **`AFTY_GRAUS`** continua com 5 e é só o **grau do ITEM**, escolhido na aba. Perdeu o `ndMin`, que
  era resquício do serviço duplo e não queria dizer nada do lado do equipamento.
- **`AFTY_GRAUS_CRIATURA`** nasceu com 9 e é o que `grauFeiticeiro(nd)` devolve.

### `rank` PARA NO 5, e `ordem` é a posição de verdade

Decisão do autor, perguntada antes de mexer. O Grau da criatura alimenta número em três lugares, e
todos leem `rank`:

| Onde | Fórmula |
|---|---|
| Orçamento de Perícias e TR | `3 + maior mod INT/SAB + rank do Grau` |
| Habilidade Geral Aptidão (`ger_aptidao`) | `vagasAptidao = 1 + grau` |
| Controle Aprimorado (`ctr_controle_aprimorado`) | `bonusTeste = 1 + grau` |
| Potencial Superior (`ctr_potencial_superior`) | `atributoPontos = 2 * grau` |

Se o rank subisse junto com a escada, o ND 36 ganharia +4 vagas de Perícia, a Geral de Aptidão
passaria a dar 10 vagas e o Potencial Superior daria 18 pontos de atributo. O autor mandou **parar no
5**: os quatro graus acima do Semi-Grau Especial são **nome e faixa de ND, e não número novo**.

⚠ Por isso `rank` deixou de identificar o grau: cinco entradas têm `rank: 5`. Quem precisar comparar
dois graus usa **`ordem`**, que vai de 1 a 9 e é a posição na escada. O validador segura as duas
invariantes (a `ordem` sequencial, o `rank` nunca acima do teto do equipamento e nunca descendo).

### O orçamento de equipamento por missão

`EQUIP_GANHO_POR_GRAU` é chaveado pelo grau da CRIATURA, e não pelo do item, o que só ficou visível
agora que os dois se separaram. A tabela do livro para no Grau Especial, e o autor mandou os quatro
degraus novos **repetirem essa linha** (custo 1 ilimitado, quatro de custo 2, três de custo 3, dois
de custo 4). Vira a constante `EQUIP_GANHO_ESPECIAL`, apontada pelas cinco chaves do topo, e é onde a
tabela real entra se ela chegar.

Nenhuma ficha migra: o Grau **não é campo da ficha**, sai do ND na hora.

### Verificação

- `npx eslint src/systems/afty/` passou.
- `npx vite build` passou.
- **47 asserts** do `deriveAfty` e do catálogo: a escada inteira ND a ND nas duas bordas de cada
  faixa (1/4/5/8/9/12/13/16/17/20/21/25/26/30/31/35/36/50/999), ND sujo (0, negativo e ausente)
  caindo no Quarto, os ranks parando no 5 com a `ordem` indo a 9, o grau de equipamento intacto nos
  5 e sem `ndMin`, o orçamento dos quatro graus novos repetindo o Especial, o `"especial"` do item
  **não** respondendo mais por orçamento, o validador zerado, os rótulos chegando em
  `derived.grauFeiticeiro`, e o orçamento de Perícias ganhando a vaga no ND 17 e não ganhando mais
  nada no 21 nem no 40.
- `src/components/` sem alteração.

---

## SESSÃO DE 2026-08-18 (parte 2): TREINOS ESPECIAIS (INTERLÚDIOS ADICIONAIS)

Pedido do autor: programar os **Treinos Especiais**, com o texto de **Treinamento para Feitiço**
em mãos. É a regra de **Interlúdios Adicionais** do Livro do Narrador p. 22, e fecha um dos dois
cartões "em breve" que estavam na aba de Interlúdios desde 2026-07-2X. Numa segunda passada do
mesmo dia entrou o **Treinamento para Habilidade**, o teto por ND dos dois e o conserto da
aparência do card.

Sistema novo em **`src/systems/afty/afty-treinos-especiais.js`**, card próprio
`Interlúdios · Treinos Especiais` na aba, embaixo das 12 Linhas.

### A terceira família de Interlúdio

Uma Linha de Treinamento tem 4 etapas sequenciais, pré-requisito por etapa e um bônus de Completo.
Um **Treino Especial não tem etapa nenhuma**: é uma escolha REPETÍVEL, e cada pega custa Foco e
concede uma coisa. Por isso ele não reusa o `TreinoLinha`, e sim a anatomia do
`HabilidadeGeralCard` (quadrado que liga, nome, medidor de repetições, chevron): a interação é
escolher e repetir, não avançar quatro etapas em ordem.

**Ficha:** `creature.treinosEspeciais`, lista COM repetição (`[{ id, alvo }]`), uma entrada por
pega, no mesmo espírito de `habilidadesGerais` e `melhoriasSuperiores`. O `alvo` nasce nulo e
existe por antecipação: Estudos vai nomear uma perícia.

### As quatro respostas do autor (as quatro viraram regra do sistema)

1. **Sucesso automático.** O texto manda rolar quatro testes, guardar os sucessos e tentar de novo
   no interlúdio seguinte. Para CRIATURA nada disso é rolado: vale a regra já registrada na seção
   INTERLÚDIOS ("qualquer interlúdio que peça teste é sucesso automático"). Consequência de
   desenho: **não existe contador de sucessos, nem treino em andamento, nem o atributo escolhido**.
   Escolher já concede. O fato mora no `title` do botão, que é onde explicação de item vive.
2. **1 Foco por pega**, e não o interlúdio inteiro (2 Focos). Cabe junto de uma etapa de 1ª/2ª/3ª
   no mesmo interlúdio. O medidor do cabeçalho da aba passou a **somar as duas famílias**, porque o
   caixa é um só: `focosGastos(...) + focosDeTreinosEspeciais(...)`.
3. **O Feitiço vem em VAGA EXCLUSIVA** (canal `vagasFeitico`), a mesma da Lendária Dominância em
   Técnica. O Feitiço obtido não gasta o contador comum de Habilidades, e a vaga não serve para
   Habilidade Geral. O medidor `+usadas / exclusivas` do card de Habilidades já mostrava isso, e
   não precisou de tela nova.
4. **A CD do texto estava errada.** O autor mandou "12 + seu Bônus de Treinamento" e corrigiu no
   mesmo dia para **12 + metade do seu Nível**, igual à do Treinamento para Habilidade. A
   `descricao` do catálogo leva a correção, e o resto do texto é verbatim. Como o teste é sucesso
   automático, **a CD não entra em conta nenhuma hoje**: ela vive só no texto.

### Onde entra no motor

`efeitosDeTreinoEspecial(creature)` emite `{ canal, expr, origem, nome }` igual a qualquer outra
fonte, e entra na lista **MONTANTE** do `deriveAfty`, ao lado do `efeitosDeTreino`. É o lugar certo
porque o que ele emite é **vaga de orçamento**, lida antes de os stats existirem. Nenhuma linha
nova foi precisa no `orcamentoHabilidades`: o canal já existia e já era consumido.

### Segunda passada, no mesmo dia: teto por ND, o irmão, e a aparência

O autor voltou com três pedidos. *"Melhore a Aparência de como ficou o Treino, ficou muito feio"*,
mais o teto e mais o Treinamento para Habilidade.

**Teto de repetição = `1 + piso(ND / N)`**, com o N em `vezesACada` no catálogo. Feitiço tem N 5
(ND 5 = 2, ND 10 = 3, ND 15 = 4) e Habilidade tem N 10 (ND 10 = 2, ND 20 = 3, ND 30 = 4). Não
param, porque o ND do Afty não tem teto. A conta mora no resolver e o catálogo só declara o número,
mesmo desenho do `maxVezesGeral`. O aparo é de **leitura**: baixar o ND devolve a pega excedente em
vez de apagá-la da ficha, e o Foco preso nela volta junto. Isso obrigou `normalizeTreinosEspeciais`
a receber `{ nd }`, e nasceu `tetosDeTreinoEspecial(creature)` para a UI pedir os dois de uma vez.

**Treinamento para Habilidade** (`tes_habilidade`) entrou, emitindo `vagasHabilidade`, que é a
pilha das Habilidades de Especialização (a mesma que a Habilidade Geral Especialização alimenta).
⚠ **A `descricao` dele ainda é a paráfrase antiga da aba**, e está marcada como tal no catálogo: o
autor mandou construir o Treino antes de mandar o texto. Só o mecanismo veio dele. Está em
`a-fazer.md`. Sobrou **um** cartão "em breve", o Estudos.

### O que estava feio, e o que consertou

Três coisas, e as três eram de layout:

1. **O `ContadorCompacto` era o medidor padrão.** Um controle de 32px de altura e ~104px de largura
   metido numa faixa de 32px, encostando nas bordas do card: um bloco cinza no meio da lista. Com o
   teto por ND ele virou exceção (só acima de 6 vezes, ou seja, Feitiço no ND 30+), e o normal
   passou a ser o `VezesGauge`, que é o vocabulário do resto do criador.
2. **O card eram DUAS listas empilhadas.** As linhas de Treino tinham 32px, quadrado de 20px e
   texto de 12px, e as "em breve" tinham 42px, ícone de 16px e texto de 14px. Nada alinhava.
   Agora as três dividem um esqueleto só (`LINHA_INTERLUDIO` / `CORPO_INTERLUDIO`), de 36px, e o
   ícone do "em breve" ocupa o lugar do quadrado que liga, então as colunas batem.
3. **O meio da linha era vazio.** Entrou o chip `concede` ("Vaga de Feitiço", "Vaga de
   Habilidade"), que é RESULTADO e não explicação, e o número de Focos deixou de ser rótulo estático
   para virar **preço enquanto não pegou, gasto depois**.

O medidor de Focos virou `ContadorFocos` e **aparece nos dois cards**, pelo mesmo motivo do
`ContadorHabilidades`: as duas famílias gastam o mesmo caixa, então o gasto de um lado tem de ser
visível do outro.

De brinde, os textos placeholder perderam os **ponto-e-vírgula** que violavam a regra de estilo do
autor (viraram vírgula).

**Asserts**: catálogo válido com as duas entradas, `createBlankAfty` com o campo, normalize
descartando lixo e aceitando string crua, o teto de cada um conferido ND a ND nas duas escadas
(1/4/5/9/10/14/15/20/30/50 e 1/9/10/19/20/30/100), o aparo valendo na leitura com a ficha crua
intacta, Foco e efeito acompanhando o aparo, `tetosDeTreinoEspecial` devolvendo os dois, o DELTA de
vagas exclusivas no `deriveAfty` (a origem padrão Inato já concede 1, então o valor absoluto
engana), o Feitiço ocupando a exclusiva sem tocar no comum, as vagas de Habilidade entrando em
`habilidades.total` com a quarta pega aparada pelo teto do ND 20, a soma das duas famílias de Foco,
e ficha suja não derrubando o derive.

---

## SESSÃO DE 2026-08-18: PERÍCIAS PERSONALIZADAS, ATAQUE DA ARMA E COMBATE DO CONJURADOR

Três relatos do autor fecharam a mesma lacuna: escolhas gravadas na ficha existiam, mas os sistemas
que dependiam delas ainda liam apenas catálogos fixos ou uma única fórmula de ataque.

### 1. Melhoria Superior de Perícia lê a ficha atual

Melhoria de Perícia usava somente `AFTY_PERICIAS` para montar e validar a escolha. Por isso uma
perícia personalizada podia aparecer normalmente na aba Perícias e ainda assim não existir dentro
da Melhoria Superior.

O Alto Nível agora recebe `catalogoPericiasDaFicha(creature)` para esse item. A mesma lista dinâmica
é usada no seletor, na validação da escolha gravada e no conteúdo da Ficha Final. As demais escolhas
de Alto Nível continuam usando os catálogos próprios.

### 2. Cada arma escolhe a jogada de ataque

Cada entrada de arma no inventário ganhou `ataqueId`. Uma arma corpo a corpo escolhe entre Corpo a
Corpo e Amaldiçoado. Uma arma a distância ou de arremesso escolhe entre A Distância e Amaldiçoado.
Fichas antigas continuam usando o ataque físico da categoria quando o campo não existe ou é
inválido.

A escolha altera somente a jogada de ataque da linha. O atributo do dano continua vindo da arma,
salvo quando Técnicas de Combate determina Inteligência ou Sabedoria para as armas escolhidas.

### 3. Técnicas de Combate e a sequência de especializações

O Conjurador ganhou um resolvedor próprio em `afty-combate-conjurador.js`, ligado ao criador, à
bancada de Buffs e à Ficha Final.

- Técnicas de Combate guarda até duas armas e uma escolha compartilhada entre Inteligência e
  Sabedoria. As linhas escolhidas recebem treinamento e usam o atributo na jogada de ataque e no
  dano.
- Combate Amaldiçoado acrescenta o Bônus de Treinamento ao dano das armas escolhidas. Na bancada,
  a ativação seleciona uma dessas armas e sobe o nível de dano dela em 1 durante o combate. O custo
  de 2 PE é exibido, mas o desconto permanece manual.
- Imbuir com Técnica fica disponível somente na arma selecionada pelo Combate Amaldiçoado. O seletor
  aceita Feitiços de Dano Comuns ou Vampíricos, sem área, com Ação Bônus ou Ação Comum. O ataque
  executa o dano da arma junto com o dano ou efeito calculado do Feitiço. Condições continuam
  mostrando o TR e a CD aplicáveis.
- Esgrimista Jujutsu permite selecionar na bancada um Feitiço Auxiliar cuja ação padrão seja Bônus.
  O efeito calculado é aplicado ao próprio personagem enquanto Combate Amaldiçoado estiver ativo.
  Efeitos de Atributo e Teste de Resistência ganharam seus seletores de alvo no criador.
- Sustentação Avançada abre duas seleções sustentadas. Sustentação Mestre abre três e reduz em 1 o
  custo de sustentação mostrado, com mínimo de 1. O gasto de PE permanece manual.

Os estados extras de combate agora aceitam o tipo `opcao`, com validação do valor selecionado e
variáveis correspondentes no contexto do DSL. Isso permite que arma, Feitiço Auxiliar e Feitiços
sustentados usem o mesmo fluxo de Buffs já existente.

### 4. Integração com Controlador e Invocações

A branch local foi atualizada por fast-forward para `efc85c4`, Grimorio Afty #024. Os seis arquivos
de código alterados pelos dois trabalhos foram mesclados automaticamente. O único conflito ocorreu
neste documento, entre sessões independentes, e foi resolvido preservando as duas integralmente.

### Verificação

- `npx eslint src/systems/afty/` passou.
- `npx vite build` passou. Permanece o aviso de Node 22.11.0, pois o Vite pede 22.12 ou superior na
  linha 22.
- 12 asserts do `deriveAfty` passaram depois da integração. Eles cobrem seleção de Inteligência e
  Sabedoria, treinamento, bônus de dano, aumento de nível de dano, estado de opção e os filtros de
  Imbuir com Técnica.
- `git diff --check` passou, com apenas o aviso de conversão LF para CRLF deste documento.
- `src/components/` não possui alteração.

---

## SESSÃO DE 2026-08-17: O CAMPO QUE CONFIRMAVA UM NÚMERO QUE NÃO EXISTIA

Pedido do autor: *"melhore a Ficha de Invocações e o Motor de Automação dela"*. Mais o bug do card
listando criatura **Beyond** como Comum.

### O Beyond, e a única linha da 2.5.2

`PATAMAR_STYLES` no `Dashboard.jsx` tem os cinco patamares da 2.5.2 e o `/Afty` usa esse Dashboard
direto, então toda criatura Beyond caía no fallback `?? PATAMAR_STYLES.comum` e saía rotulada e
pintada como Comum. O arquivo é `src/components/`, somente-leitura para mim, e **o autor liberou a
exceção pontual**: uma entrada `beyond` no dicionário. Nenhuma criatura 2.5.2 tem esse patamar,
então o comportamento de lá não muda. O **filtro** de patamar continua sem Beyond de propósito e
está em `a-fazer.md`: ali a opção seria visível na 2.5.2 e não casaria com nada.

### O achado: `modificadorExpr` era um no-op que a tela confirmava

O `docs/afty-invocacoes.md` promete "DSL para os modificadores" desde a Fatia 2. Metade existia:
`resolveAcao` e `resolveCaracteristica` avaliavam a expressão e guardavam em `out.modificador`, e
**nada no sistema inteiro lia esse campo**. O único consumidor era o próprio editor, que pintava
`= 7` em verde.

Isso é pior que o padrão de sempre (motor calcula, tela não mostra). Aqui a tela **confirmava**: a
pessoa escrevia a expressão, via o número certo, salvava, e a invocação saía idêntica. Não há
sintoma nenhum a perseguir depois.

Duas decisões de desenho:

1. **O alvo é explícito, não adivinhado.** Numa Ação de Ataque "modificador" tanto pode ser dano
   quanto acerto. Escolher por conta própria seria supor, então `modificadorAlvo` guarda a escolha
   e o padrão é o número principal da ação (Dano, Cura ou Valor), que é o que uma ficha já salva
   passa a significar. Numa Característica de Tamanho ou livre não existe alvo, e aí a expressão
   vira **aviso** em vez de sumir calada.
2. **Rótulo e aplicador na mesma entrada** do `MODIFICADOR_ALVOS`. Com um `switch` à parte, um alvo
   novo entraria na lista de opções, apareceria no editor e cairia no `default` sem fazer nada, que
   é o mesmo bug uma camada acima. O validador de catálogo confere que toda entrada tem os dois.

### A variável que faltava para escrever regra de tipo

O contexto da invocação não tinha como dizer de que TIPO ela é, e por isso os três efeitos do
Shikigami de Técnica precisavam de um desvio em código (`efeitosDoTipo`) para serem selecionados.
Com `tipo_shikigami` / `tipo_tecnica` / `tipo_dispositivo` no contexto, eles viraram efeitos
normais com `quando: "tipo_tecnica"`, no mesmo caminho de todo o resto: o próximo tipo se escreve
como dado. Entraram junto `tamanho` (como degrau) e as contagens de `acoes` e `caracteristicas`.

⚠ `tamanho` lê a Característica **crua**, e não o `resolveInvocacao`. O contexto é montado antes das
Características resolverem, e uma delas pode ler `tamanho`: ler o resultado seria circular. O valor
bruto da Característica não depende de expressão nenhuma, então é seguro.

### O último campo de expressão sem seletor

O campo de Modificador era um `TextInput` cego com sete nomes de variável escritos à mão no hint.
Justo o campo cujo namespace é o da INVOCAÇÃO e não o da criatura, ou seja, o único que ninguém tem
como adivinhar, que é a queixa que criou o `afty-dsl-vocabulario.js`. Ganhou `CampoExpressao` com o
`VariavelPicker`, alimentado por um `vocabularioInvocacao` novo.

Ele sai **sem** os valores resolvidos, de propósito: é exatamente o contexto que o `ctxParaExpr`
avalia. Um seletor mostrando o PV final enquanto a expressão lê o PV base seria um seletor que
mente, e o `resolveInvocacao` passou a expor esse mesmo objeto (`contextoDsl`) para não haver duas
verdades.

### Na Ficha, o de sempre: calculado e sem tela

- **Perícias.** `testes.pericias` sempre saiu resolvido, com bônus fechado, e a aba lia só as
  resistências. Uma invocação treinada em Percepção ou Furtividade não tinha o que rolar na mesa.
- **Jogada de Ataque da criatura**, fora de qualquer Ação: o número do ataque improvisado, e o
  único lugar onde o bônus de Característica em Ataque (que exige gatilho) aparece.
- **Os seis atributos.** O `resumoAtributosInvocacao` devolvia só o orçamento gasto. A Ficha não
  tinha os valores, e ela É uma criatura: a mesa pede atributo dela a toda hora.
- **Marcador sem opção escolhida** aparecia igual aos outros e não entregava efeito nenhum, porque
  o `quando` testa `marc_<id>_<opcao>` e nenhuma bate.

TR e Perícia viraram a mesma `LinhaDeTeste`: têm a mesma anatomia, e a de TR já existia inline.

**Bloco 19** de asserts: o modificador em cada um dos sete alvos (com o vizinho que NÃO pode mexer),
nível de dano conferido contra a escada canônica, o PV da invocação inteira mudando ponta a ponta
por uma Característica com expressão, o aviso do alvo inexistente, as flags de tipo usadas dentro de
uma expressão, `tamanho` lendo a Característica e batendo com o `resolveInvocacao`, o vocabulário
sem nada caindo em "Outras" e cobrindo toda chave do contexto, e as perícias e o acerto chegando
resolvidos para a aba.

---

## SESSÃO DE 2026-08-16 (parte 3): AS DUAS PRIMEIRAS BASES DO CONTROLADOR SÃO DE GRAÇA

Pedido do autor: **Treinamento em Controle (1°) e Controle Aprimorado (4°) chegam sozinhas**, sem
gastar vaga. Os dois ganharam `automatica: true` em `afty-habilidades.js`.

**Não foi preciso motor novo.** O caminho já existia desde 2026-08-10, aberto para as três Bases do
Suporte, e o Conjurador já usava duas. `habilidadesConcedidasPelasEspecializacoes` lê a flag,
`resolveHabilidades` junta `concedidas` em `escolhidas` **depois** de contar o orçamento, e todo
consumidor rio abaixo (`resolveControleInvocacoes`, `efeitosInvocacaoControlador`,
`resolveMarcadoresInvocacao`, `resolveAltoNivel`, o DSL via `habilidadesEscolhidas`) já lia
`habilidades.escolhidas`. A UI também: `HabilidadeCard` tem o estado `concedida` (chip verde,
botão travado). Somam **sete** Bases automáticas agora, e o comentário do topo do arquivo virou
uma lista das sete, porque ele ainda dizia que a exceção era só o Suporte.

**Nível REAL, não o de escalonamento.** A concessão usa o mesmo `e.nivel` que
`niveisPorEspecializacao` usa para liberar acesso, então ela segue o lado de pré-requisito da
multiclasse: um Controlador 1 / Lutador 4 recebe Treinamento em Controle e **não** Controle
Aprimorado, mesmo com escalonamento 3. Já o `resolveControleInvocacoes` continua no escalonamento,
que é o certo para o que ESCALA. As duas réguas convivem de propósito.

**Ficha antiga não quebra nem cobra duas vezes.** Quem já tinha gravado as duas na mão continua com
elas efetivas: o laço de `resolveHabilidades` descarta o id que está no `concedidasSet` antes de
entrar em `selecionadas`, então a habilidade sai do contador de gasto e não vira duplicata.

**Um texto morreu junto.** O editor de Horda dizia que o limite de membros vinha do Treinamento em
Controle "(sistema futuro)". Era falso em duas frentes: o sistema existe desde 2026-08-15 e o
número já aparece como chip no `ControleInvocacoesResumo`, e texto explicativo na UI é contra a
regra do autor. Saiu.

**Bloco 18** de asserts: os degraus de concessão (0/1/3/4/20), a especialização alheia que não
recebe nada, orçamento intocado, a ficha antiga sem duplicata, uma habilidade escolhida de verdade
que continua cobrando, o roster ligado no nível 1 sem escolher nada, e o ponta a ponta pelo
`deriveAfty` medindo o `bonusTeste` contra outra especialização no mesmo ND (porque com uma
especialização só o `resolveEspecializacoes` dá o ND inteiro a ela, e metade do nível de
Controlador já entra no acerto por fora da habilidade).

---

## SESSÃO DE 2026-08-16 (parte 2): SHIKIGAMI DE TÉCNICA

Tipo novo de Invocação, enviado pelo autor. As regras estão **verbatim** em
`docs/afty-invocacoes.md`, seção "SHIKIGAMI DE TÉCNICA", junto das quatro decisões dele e da tabela
de como cada linha virou motor.

Ele é o **terceiro tipo mecânico**, irmão do Shikigami de talismã e do Dispositivo, e não um sabor:
muda base de atributo, PV, bônus, orçamento e economia de ação. O capítulo já o tratava como
categoria (na limitação de Características sobre imunidade a tipo de dano), e a seção de
Intermediários diz que *"certas técnicas inatas permitem que a necessidade de Talismãs seja
ignorada... como é o caso da Dez Sombras"*. Por isso ele é **o único sem Intermediário**, e o único
que não ocupa espaço de inventário.

### O canal novo, e por que não foi o `orcamentoLivre`

`caracteristicasLivres` nasceu para "+1 Característica que não aumenta o custo". O `orcamentoLivre`
não servia: o orçamento é um **pool único** ("A quantidade serve tanto para ações quanto
características"), então somar ali daria uma vaga que aceita **Ação**, e o texto diz Característica.
A vaga é exclusiva: absorve as primeiras N características e o resto disputa o pool comum. O
`custoInvocacao` ganhou o parâmetro junto, porque "não aumenta o custo" abate **característica**
(1 PE cada), e não "o item mais caro" como faz o grátis genérico do Ápice do Controle.

### Os efeitos do TIPO passaram pelo mesmo cano das Habilidades

`TECNICA_EFEITOS` são efeitos de canal com `grau` na expressão (`10 + 5 * (grau - 1)` para o PV,
`grau` para o bônus e para as vagas), injetados no mesmo acumulador que as Habilidades de
Controlador. Dois ganhos: as três regras escalam sozinhas, e as parcelas aparecem **nomeadas no
hover de fontes** ao lado das outras, em vez de serem uma conta anônima dentro do `resolveInvocacao`.

### O que não deu para mecanizar

Três regras não têm canal e saem como **marca com o texto no `title`**: o **turno próprio** é
economia de ação, o **retorno com vida cheia na primeira dissipação** depende do PV da invocação
estar na sessão (pendência já aberta) e a **desvantagem alheia** precisa de vantagem/desvantagem,
que o Motor não tem. A quarta marca, a **imunidade ao Prejuízo por Múltiplos Auxílios**, essa sim
está aplicada de verdade no `resolveAcao`.

⚠ **"Até 1 Grau abaixo" ficou sem interpretação de propósito.** A frase admite duas leituras e a
regra não é mecanizada, então a marca mostra o texto inteiro e ninguém precisou escolher. Quando o
canal de desvantagem existir, é pergunta obrigatória.

### Verificação

Dois blocos de assert novos (15 e 16) cobrindo atributos, os cinco degraus de PV, os cinco de
bônus, o que o bônus **não** toca (dano e CD), as vagas exclusivas com a sexta característica
voltando a custar, a imunidade nos quatro sub-tipos de auxílio, a ausência de Autonomia e o
Intermediário. Mais o 17, ponta a ponta pelo `deriveAfty` com um Feitiço de Shikigami apontando
para um de Técnica.

---

## SESSÃO DE 2026-08-16: O SHIKIGAMI NA MESA, E O QUE A FICHA NÃO MOSTRAVA

Revisão da aparência do Shikigami e da Ficha Final, mais os poderes que o motor novo destravou.
O tema da sessão é o mesmo da anterior, e por isso ele fica registrado como padrão: **valor
calculado que não chega a lugar nenhum**. Sete achados desta vez.

### 1. ⚠ A Ficha só mostrava ATAQUE COM JOGADA

O maior deles. `resolveAcao` sempre devolveu CD, qual Teste de Resistência, cura, área, condição, o
valor dos auxílios e o dano adicional, e a aba mostrava só o acerto e o dano de uma Jogada de
Ataque. Na prática:

- um ataque por **Teste de Resistência** não mostrava a **CD**, que é o número inteiro da jogada,
  nem qual TR o alvo rola. A ação era inutilizável na mesa;
- uma Invocação **médica** não tinha o que rolar: a cura não aparecia em lugar nenhum;
- **Defesa, Acerto e RD** de auxílio, o **dano adicional**, a **área**, a **condição** e o tipo de
  dano não apareciam.

A ação virou duas linhas: identidade e custo em cima, os números da mesa embaixo, e tudo que rola é
clicável. A **classe** (Complexa ou Simples) entrou junto, porque é ela que diz qual comando o dono
gasta.

### 2. As Invocações eram invisíveis para a busca global

A aba tinha a âncora de destaque (`afty-item-invocacao:<id>`) e **nenhuma fonte**: o alvo existia e
nada apontava para ele. Agora `alvosDeBusca` as inclui, e os nomes das Ações e Características
entram na string de busca (no meio da luta se procura pelo nome do golpe). Linha única por
invocação, porque a `chave` é o alvo do destaque E a chave de lista do resultado.

### 3. ⚠ O painel de ENCONTROS não tinha Invocações

Ele reusa cinco abas da Ficha e essa faltava. O encontro é exatamente onde um Controlador usa a
especialização inteira, e o mestre não tinha como rolar o ataque de um shikigami nem ver o PV dele
sem sair para o criador. Agora são as mesmas **seis** abas.

### 4. ⚠ O custo do Shikigami ignorava Manipulação Perfeita

Bug que eu mesmo abri na sessão anterior. O card do Feitiço passa pelo `aplicaReducoesCustoFeitico`
e o `overridesShikigami` não passava: com Manipulação Perfeita marcada, o Feitiço mostrava o custo
pela metade e a ficha da invocação cobrava o cheio. Dois números para a mesma coisa, e o próprio
texto do Shikigami diz que ele **recebe** Manipulação Perfeita.

### 5. Dois Feitiços na mesma invocação, e a trava de grau que travava demais

- **Disputa:** dois Feitiços de Shikigami apontando para a mesma invocação faziam o último vencer
  calado. Agora o primeiro manda e a disputa vira aviso.
- **Trava de grau:** a tabela do Controlador desabilitava graus na invocação, inclusive num
  shikigami de Feitiço, onde quem manda é o nível do FEITIÇO. Um Controlador de nível 1 com um
  Feitiço de Nível 5 via o Grau Especial desabilitado e não tinha como satisfazer o aviso que a
  própria ficha dava. A trava agora não vale para invocação amarrada a Feitiço.

### 6. Aparência da criação de Shikigamis

- O `confere` de cada opção era **calculado e ignorado**: o motor já dizia quais invocações batem
  com o grau exigido e a tela mostrava todas iguais. Agora quem confere vem primeiro e marcado, e
  quem não confere vem apagado com o grau dela ao lado.
- O painel mostra os **stats reais** da invocação conjurada (PV, Defesa, Deslocamento, orçamento),
  para não obrigar a troca de aba só para conferir o tamanho do próprio shikigami.
- "Redução de PE" saía sem unidade ao lado de "Custo de Invocação: 2 PE".
- Na Ficha, o Feitiço de Shikigami mostrava só "Shikigami Grau Especial". Ganhou as duas coisas que
  a mesa precisa: **qual invocação** ele conjura e a **redução permanente de PE**.

### 7. Poderes ligados nesta leva

| Habilidade | O que entrou |
|---|---|
| **Otimização de Energia** (2°) | marca por AÇÃO: uma Ação com Custo por invocação sai 1 PE mais barata, com piso em 1 |
| **Autonomia** (4°) | o custo por uso (`2 × rank do grau`) vira linha no card |
| **Resistência Sobrecarregada** (10°) | o PE gastável e o PV que ele compra (`piso(BT/2)`, +10 PV cada) |
| **Crítico Aprimorado** (10°) | margem 19 nas Jogadas de Ataque dela, e a Ficha rola com ela |
| **Crítico Brutal** (4°) | o dado adicional aparece no card |
| ~~Aptidões de Controle (8°)~~ | **já estava ligada** por `ESCOLHA_EFEITOS`, ao contrário do que a doc dizia |

Também entrou a **Horda na Ficha**, que mostrava só nome, membros e custo: agora tem PV, tamanho,
deslocamento e as ações do líder **já escaladas**, roláveis. E as **Características** na Ficha eram
um chip com o nome e nada mais, sem o valor resolvido e sem a descrição que a pessoa escreveu.

### 8. ⚠ O TIPO MECÂNICO da Invocação não tinha tela nenhuma

`AFTY_INV_TIPOS` e `AFTY_INV_SABORES` existiam no motor desde a Fatia 1, o campo era guardado na
ficha, e **nenhum arquivo importava os dois**. Toda invocação ficava calada em "Shikigami". O tipo
decide o **Intermediário** (Talismã contra Dispositivo) e a **regra de retirada** (dissipada e
exorcizada contra desativada e destruída), que são regras de mesa. Agora tem seletor no criador,
com o sabor (Corpo Amaldiçoado ou Marionete) aparecendo só quando é Dispositivo, e o tipo é um chip
na Ficha com o Intermediário e a retirada no `title`.

### 9. O Intermediário ocupa meio espaço, e ninguém contava

*"Todo Intermediário ocupa meio espaço no inventário de um personagem."* O número agora é calculado
(`espacosDeIntermediario`) e aparece no cabeçalho da aba, mas **NÃO entra no `resolveCarga`**: a
carga alimenta os penais de Sobrecarga, e um Controlador de nível alto tem 9 invocações, ou seja
4,5 espaços que apareceriam do nada em fichas prontas. Está em `a-fazer.md` esperando a decisão.

Fechando, dois consertos pequenos: o **roster** (campo, Invocar, comandos, hordas) passou a
aparecer também na Ficha, porque são números de combate, e o **dado extra da Agressividade sumia
dentro da Horda** (o escalonamento mexe no dado da tabela e o extra soma por fora, então ler só o
`danoGrupos` fazia a horda bater mais fraco que a mesma invocação sozinha).

### Placar

Controlador **17 de 47** (as duas somadas à conta da sessão anterior são Aptidões de Controle, que
já estava, e Invocação Às, ligada pela linha de Cura). As 30 restantes seguem em economia de ação,
posicional de campo e estado de combate.

### Assunções anotadas em `a-fazer.md`

Otimização de Energia valendo só para Ação com Custo, Crítico Aprimorado descendo a margem só das
Jogadas de Ataque, e o **PV da Invocação fora da sessão**, que virou buraco de uso agora que a aba
entrou no painel de Encontros.

---

## SESSÃO DE 2026-08-15: MARCADORES DE INVOCAÇÃO, E AS CARACTERÍSTICAS QUE NÃO CHEGAVAM A LUGAR NENHUM

Controlador e Shikigamis. O placar do **Controlador foi de 8 para 15 de 47**, e o que destravou
isso foi um mecanismo só. Também caiu um bug antigo e calado, que é o item 3.

### 1. MARCADORES por invocação (o desbloqueio)

Existia **um** marcador, o booleano `inv.marcada` do Concentrar Poder, e por isso toda Habilidade
que vale para ALGUMAS invocações ficou parada: o motor não tinha onde guardar "esta sim, aquela
não". Agora existe um registro, `MARCADORES_INVOCACAO` (`afty-habilidades.js`), com oito:

| Marcador | Habilidade | Limite |
|---|---|---|
| Concentrar Poder | Concentrar Poder (6°) | `piso(bt / 2)` |
| Companheiro Amaldiçoado | Companheiro Amaldiçoado (2°) | `1` |
| Fantoche Supremo | Fantoche Supremo (16°) | `1` |
| Invocações Econômicas | Invocações Econômicas (6°) | `2 + (nc>=12) + (nc>=18)` |
| Agressividade / Resistência / Mobilidade / Precisão | Melhoria de Controlador (2°), uma por opção | `bt` cada |

A ficha guarda `inv.marcadores` e `inv.marcadorOpcoes`, o contexto de DSL ganha uma booleana
`marc_<id>` por marcador, e os efeitos entram por `quando: "marc_<id>"`. **Compat:** `inv.marcada`
continua lendo como `marc_concentrar_poder`, então rascunho velho não perde nada.

**Marcador com ESCOLHA.** Precisão diz "+2 em Jogadas de Ataque **ou** CD", e o autor decidiu
(2026-08-15) que é **escolha do jogador**. Um marcador pode declarar `opcoes`, e aí o contexto
ganha `marc_<id>_<opcao>` além da `marc_<id>`. A escolha mora no card da invocação, ao lado do
toggle, que é onde o efeito aparece.

### 2. Canais novos, e o corte entre DANO e CURA

`EFEITO_CANAIS` foi de 11 para 18. Os que nasceram: **`rd`**, **`acerto`**, **`cd`**,
**`custoReducao`**, **`ataqueDanoAdicional`**, **`curaNivel`** e **`curaBonus`**.

⚠ **`danoNivel`/`danoBonus` valiam para dano E cura.** Concentrar Poder diz "toda rolagem de dano
ou cura" e estava certo, mas Agressividade diz **só dano**, e no par único ela engordaria a cura de
graça. Agora são dois pares, e o Concentrar Poder emite os quatro.

⚠ **`ataqueDanoAdicional` trafega o MÁXIMO do dado, não o dado.** O Motor só produz número, e
Agressividade concede 1d6 que vira 1d8/1d10/1d12. Um índice de degrau não serviria porque o Motor
**soma** os valores de um mesmo canal, e somar índices daria a escada errada (duas fontes de 1d6
virariam 1d10). Somar máximos é a própria regra de conversão do livro: 6 + 6 = 12 = 1d12.
`dadoDoMaximo(n)` faz o caminho de volta.

### 3. ⚠ As Características eram calculadas e JOGADAS FORA

Bug antigo, e o pior desta leva porque não tinha sintoma. `resolveCaracteristica` computava tudo
certo e **nada disso saía do card**: a Característica de Vida dizia "+15 PV" e o PV da invocação
não mudava, a de Tamanho não mexia no tamanho, a de RD não existia como stat e a de Teste não
entrava em teste nenhum. Só o texto do resumo mostrava o número.

Agora `agregarCaracteristicas` junta as passivas e o `resolveInvocacao` aplica: PV, tamanho, RD e
os bônus de teste. Duas de Vida ou de Tamanho **não acumulam** (vale a maior / a primeira), como o
aviso já dizia e o cálculo não cumpria.

Junto vieram três campos que faltavam na criação:
- **Tipo de dano da RD** (`rdTipo` + `rdTipoOutro`). A lista fechada é o `TIPOS_DANO` das armas
  mais **Outro** com texto livre (autor, 2026-08-15), porque o livro deixa o tipo aberto e o resto
  da lista nunca foi transcrito. É o tipo que decide se duas RDs colidem.
- **Qual perícia** e **qual TR** da Característica de Teste. O livro diz "bônus fixo em um teste
  específico" e não havia onde dizer qual.

### 4. A INVOCAÇÃO GANHOU RD

Ela não tinha, nem stat nem canal, e duas fontes produziam RD. Agora `resolveInvocacao` devolve
`rd: { geral, porTipo }`: a Geral vem do canal (Melhoria Resistência, "contra todos os tipos") e
cada linha por tipo já traz o total que vale contra aquele tipo. Aparece no stat block do criador
e no card da Ficha.

### 5. O Shikigami era ligação de MÃO ÚNICA

`calcularFeiticoShikigami` já calculava o grau exigido, o `ajusteAcoes` (-1 no Nível 0, +2 na
Técnica Máxima) e o custo, mostrava tudo no painel do Feitiço, e **nada chegava na ficha da
invocação**. O orçamento e o custo dela ignoravam o Feitiço que a criou.

`overridesShikigami` (`afty-feiticos.js`) devolve um mapa por id de invocação, e o `resolveInvocacao`
aplica: o custo do Feitiço **substitui** o do grau (`custoFixo`, não desconto, porque o shikigami é
conjurado e não invocado), o `ajusteAcoes` entra no orçamento e o grau divergente vira aviso. O card
da invocação mostra um selo com o nome do Feitiço dono.

### 6. Roster do Controlador (mostra, não valida)

`resolveControleInvocacoes` calcula os quatro números que Treinamento em Controle e o Apogeu movem:
invocações recebidas, limite em campo, quantas a ação Invocar traz, comandos por ação, mais o
limite de hordas do Controle Disperso. Bases do capítulo: 1 em campo, Invocar traz 2, um comando.

⚠ **É de REFERÊNCIA, não valida** (autor, 2026-08-15). Invocação também nasce de Interlúdio e de
Feitiço de Shikigami, e travar pelo nível de Controlador bloquearia quem não é Controlador.

**Buchas de Canhão** (10°) entrou junto: membro de quarto grau para de cobrar PE extra na horda.

### 7. Canal desconhecido deixou de sumir calado

`efeitosHabilidade` descartava efeito de canal inválido com um `continue` sem rastro: um erro de
digitação num nome de canal viraria uma habilidade que simplesmente não faz nada. Agora vira aviso
na ficha. E `validarMarcadoresInvocacao` confere que todo `marc_*` citado num `quando` existe no
registro, pelo mesmo motivo: renomear um marcador sem renomear o `quando` desligaria a habilidade
inteira sem sintoma.

### Decisões do autor nesta sessão

1. **Precisão** = escolha do jogador entre Ataque e CD, por invocação marcada.
2. **"No nível 4, 8, 12, 16 e 18" das Melhorias** = **nível de Controlador**, seguindo Invocações
   Móveis e Concentrar Poder, que dizem isso por escrito.
3. **Roster** = mostrar sem validar.
4. **Tipo de RD** = lista fechada mais Outro.

### 8. Passada de revisão: cinco achados, todos do mesmo feitio

Revendo o próprio trabalho apareceu mais do MESMO bug do item 3, valor calculado que não chega a
lugar nenhum. Cada um virou assert antes de virar correção:

1. **A Horda recomputava as ações do líder** com o `dono` cru em vez do `donoLocal` dele. A mesma
   ação rolava um dano dentro da horda e outro fora: Concentrar Poder, Agressividade e Precisão
   sumiam, e os `grupos` estruturados junto. Agora as ações vêm do `liderRes`.
2. **A Horda subia o tamanho a partir de `lider.tamanho` cru**, ignorando a Característica de
   Tamanho. Um líder Enorme com 2 membros virava Grande.
3. **`comGatilho` era computado e ninguém mostrava.** Pior: o bônus de Característica de Teste em
   **TR** entrava no número plano enquanto o de **Ataque** ficava de fora, e o livro cobra gatilho
   nos dois. Agora os dois saem à parte, e a ficha mostra como condicional. Só a Perícia entra no
   número, que é o que o livro manda ("o bônus é aplicado por completo").
4. **Perícia não treinada com bônus de Característica aparecia como "Treinado (BT)"**, roxa,
   mentindo sobre um BT que não soma nela.
5. **A Horda imprimia a lista de ids** onde queria o número de membros (`membros` em vez de
   `membrosCount`), o que saía como "M1,M2 Membros" na Ficha. Esse era antigo.

Entrou junto o aviso de **duas Características no mesmo teste**, que é a mesma proibição de efeito
repetido que Vida, Tamanho e RD já tinham.

### O que continua fora

As 32 restantes do Controlador seguem nos bloqueios já nomeados em
`docs/afty-invocacoes.md`: economia de ação (ação/reação/reroll/vantagem), posicional de campo
(contagem em alcance, flanqueamento), e o que depende de estado de combate. Nenhum deles é falta de
marcador agora.

---
## SESSÃO DE 2026-08-16: ALVOS DO ESTÍMULO MUSCULAR

Correção do autor: o bônus de teste do Estímulo Muscular vale apenas em Acrobacia ou Atletismo.
O efeito estava sem alvo no Motor e, por isso, aumentava todas as perícias da ficha.

Como ficou:

- Estímulo Muscular emite o mesmo bônus temporário separadamente para `acrobacia` e `atletismo`;
- Estímulo Muscular Avançado emite o delta nos mesmos dois alvos;
- a bancada continua sem seletor, conforme a decisão anterior. O jogador usa uma das duas perícias
  e desativa o estado depois;
- nenhuma outra perícia recebe o bônus.

Assert do `deriveAfty`: com 2 PE no estado, Acrobacia e Atletismo recebem +2, enquanto Furtividade,
Percepção e as demais perícias permanecem sem essa parcela. Com o Avançado, somente os mesmos dois
alvos recebem o segundo +2.

## SESSÃO DE 2026-08-15: `dados_dano_final` EM DADOS DE DANO

Relato do autor: uma linha global de Dados de Dano com expressão `dados_dano_final` não alterava
nem os ataques físicos nem as Habilidades de dano.

A variável já era separada para avaliação tardia, mas o resolvedor aceitava somente o canal
`danoBonus`, e apenas os Feitiços consumiam essa passagem. No canal `dadosDano`, a linha era
descartada com aviso interno. Ataque Básico e armas nem chegavam a executar o resolvedor tardio.

Como ficou:

- `dados_dano_final` funciona nos canais `dadosDano` e `danoBonus`;
- Ataque Básico, armas e Feitiços de Dano resolvem os efeitos tardios por linha;
- no canal `dadosDano`, a variável lê a quantidade fechada antes do próprio efeito e acrescenta o
  resultado uma única vez. Uma linha com 3 dados recebe +3 e termina em 6, sem recursão;
- alvo vazio continua atingindo todas as linhas, enquanto os alvos específicos continuam isolados;
- editores não mostram zero falso para expressões tardias cujo valor depende da linha de dano.

Asserts do `deriveAfty`: um Funcionamento Básico global com
`{ canal: "dadosDano", expr: "dados_dano_final" }` levou o Ataque Básico de `1d8+36` para
`2d8+36` e um Feitiço de Dano de `3d8` para `6d8`. A mesma passagem foi conferida na Habilidade
Única de uma Ferramenta de Grau Especial.

## SESSÃO DE 2026-08-15: EFEITOS GRAVADOS COM ALVO LITERAL `todos`

Relato do autor: efeitos do Funcionamento Básico e da Habilidade Única de Ferramentas de Grau
Especial mostravam valor no editor, mas os bônus desapareciam das aplicações na ficha.

A reprodução encontrou uma incompatibilidade de dado. No Motor, a ausência de `alvo` significa
"todos". Uma ficha com o texto literal `alvo: "todos"` passava pela avaliação, mas era guardada em
`porAlvo[canal].todos`. Como nenhuma perícia, ataque, fonte de dano ou fonte de cura tem esse id, o
valor não era consumido por nenhuma linha da ficha.

Como ficou:

- a fronteira comum do Motor normaliza o alvo literal `todos` para ausência de alvo;
- Funcionamentos Básicos e Habilidades Únicas também devolvem o alvo já normalizado ao editor, então
  a próxima edição grava o formato canônico;
- a compatibilidade vale para canais globais e direcionáveis sem mudar a disputa do pool exclusivo.

Asserts do `deriveAfty` cobrem Funcionamento Básico e Habilidade Única com Dados de Dano, usando
`alvo: "todos"`, e confirmam que o bônus volta a atingir o Ataque Básico e as armas equipadas.

## SESSÃO DE 2026-08-15: ALVOS E GUIA DA HABILIDADE ÚNICA DE GRAU ESPECIAL

Relato do autor: ao programar uma Habilidade Única de Ferramenta Amaldiçoada de Grau Especial,
o seletor `em` de um canal como Dados de Dano oferecia somente `todos`. O editor também não tinha
o guia de variáveis que já existia no Funcionamento Básico.

A causa eram dois caminhos incompletos na UI. O editor da Habilidade Única não recebia as fontes
de dano da ficha, e o Funcionamento Básico principal e os adicionais também chamavam o editor sem
essa lista. O alvo continuava funcionando no Motor quando escrito na ficha, mas não havia como
escolhê-lo na tela.

Como ficou:

- os editores livres usam a mesma lista de destinos de dano, com Ataque Básico, armas, categorias,
  grupos, propriedades, tipos de dano, Feitiços de Dano e fontes concretas da ficha;
- canais de Cura agora oferecem as fontes catalogadas de Cura;
- a Habilidade Única ganhou o seletor de variáveis e funções ao lado da expressão;
- o guia da Habilidade Única mescla o contexto da criatura com o contexto real do item, então
  `grau` mostra o grau da Ferramenta e também aparecem `custo` e `penalidade`.

Assert do `deriveAfty`: uma Habilidade Única com Dados de Dano em `basico` somou só no Ataque
Básico, e os alvos `cat:corpo` mais `arm_adaga` somaram apenas na Adaga. O contexto do item mostrou
`grau = 5` no Grau Especial. ESLint e build passaram.

---

## SESSÃO DE 2026-08-12 (parte 2): O TETO DE APTIDÃO E O FUNCIONAMENTO BÁSICO EM LISTA

Seis frentes, e quatro delas mexem em regra velha: o teto de Aptidão por trilha, o orçamento de
níveis depois do ND 20, o valor da Habilidade Geral Aptidão e o Funcionamento Básico, que virou
lista e entrou no pool que não acumula. Sobrou a primeira habilidade vinda da versão 2.0 do livro, e
no fim a integração com o commit do GoliasK do mesmo dia (item 7).

### 1. Habilidade Lendária **Versatilidade Extrema** (a 17ª)

Texto do autor, verbatim no catálogo. Ela faz duas coisas, e cada metade entra por um caminho
diferente do Motor:

| Metade | Canal | Por quê |
|---|---|---|
| "2 aumentos de nível de aptidão **para distribuir**" | `pontosAptidao` (2) | é ORÇAMENTO, sem alvo |
| "aumentar o limite de **um** Nível de Aptidão para 6" | `limiteAptidao` (1), alvo da escolha aninhada | é DIRECIONADO, o texto nomeia uma trilha só |

⚠ **Os 2 aumentos não viraram escolha aninhada, e é de propósito.** O texto autoriza "uma única em
dois níveis ou duas aptidões em um nível", que são exatamente as duas maneiras de gastar 2 pontos
de orçamento na aba Aptidões. Modelar como concessão direcionada exigiria uma escolha com
REPETIÇÃO (a mesma trilha duas vezes), que o `resolveEscolhas` do alto nível não tem, e entregaria
o mesmo número por um caminho mais caro. É o mesmo raciocínio do *Elevar Aptidão* (Conjurador 6°),
que já usava `pontosAptidao` por dizer "um dos seus".

Esta é a **primeira fonte de conteúdo do canal `limiteAptidao`**, que estava pronto e vazio desde
2026-07-29 (ver o item 2 da sessão daquele dia: "falta o conteúdo"). As duas Habilidades citadas lá
continuam sem texto.

### 2. ⚠ A ALOCAÇÃO passou a respeitar o limite da trilha, e não o 5 fixo

Era aqui que a Lendária morria calada. Até hoje o `resolveNiveisAptidao` aparava a alocação em 5
**mesmo quando o limite da trilha era maior**, e só a CONCESSÃO podia passar do teto padrão. A
regra escrita em julho dizia "o jogador não COMPRA acima do padrão", e ela funcionava porque **toda
regra que subia o limite subia um nível junto**: as duas metades vinham no mesmo efeito.

A Versatilidade Extrema separa as duas coisas: o limite sobe numa trilha e os níveis chegam como
orçamento. Com o aparo velho, o autor marcaria a Lendária, veria o limite de Domínio virar 6 e não
teria como clicar no 6. Agora quem apara é sempre o limite da trilha, dos dois lados.

Mudou junto o **`NivelPicker`** da aba Aptidões, que desenhava 0 a 5 literais: ele recebe o
`limite` daquela trilha e cresce um botão. Sem aviso nem nota na tela, porque o botão a mais É o
aviso.

### 3. Níveis de Aptidão continuam depois do ND 20

`Total.Aptidão += piso((ND - 20) / 2)`, ou seja, mais 1 nos ND 22, 24, 26, 28, 30 e daí para cima
sem fim. A tabela do livro parava no 20 e o orçamento congelava ali, o que era estranho num sistema
de ND sem teto. Fórmula atualizada em `docs/afty-formulas-base.md`.

Confere: ND 20 = 12 · ND 22 = 13 · ND 30 = 17 · ND 36 = 20.

### 4. Habilidade de outra versão do livro: a tag `[2.0]`

O autor começou a trazer habilidades da **versão 2.0**. A primeira é *Agilidade no Campo de Batalha*
(Conjurador, 6° nível), e a marca pedida é a tag antes do nome:
`nome: "[2.0] Agilidade no Campo de Batalha"`.

⚠ A tag mora no `nome` mesmo, e não num campo `versao` à parte, porque ela tem de aparecer em TODO
lugar que mostra o nome: o card, o pool de escolha, o hover de fontes e o rótulo de pré-requisito.
Um campo novo obrigaria cada um desses lugares a saber da tag.

Sem canal: usos por cena, custo em PE e "uma segunda ação bônus" são procedimento de mesa, e a
ficha não modela economia de ações.

⚠ **Achado**: o Ápice *Rei do Tabuleiro* (Controlador 20°) cita "Agilidade no Campo de Batalha" num
requisito `nota` (habilidade que o livro cita e o Afty não tinha), e o texto dele bate com esta
("o custo para utilizar Agilidade no Campo de Batalha se torna zero, além de você poder a utilizar
uma segunda vez"). Só que a que nasceu é de **Conjurador**, e apontar o requisito para ela
transformaria o Ápice do Controlador em exigência de multiclasse. Ficou como `nota`, e a pergunta
está em `docs/a-fazer.md`. É o caso que a regra do requisito `nota` prevê: ele envelhece calado
quando o alvo dele nasce.

### 5. FUNCIONAMENTO BÁSICO virou lista, e entrou no pool exclusivo

Autor: *"algumas Técnicas entregam Funcionamentos Básicos adicionais. Como o Ilimitado que as vezes
também possui os Seis Olhos. E Cópia que permite colocar outros Funcionamentos Básicos."*

**O modelo.** O principal continua onde sempre esteve, em `core.tecnicaDescricao` +
`core.tecnicaEfeitos`, e os adicionais entram numa lista nova, `core.funcionamentosAdicionais`, com
`{ id, nome, descricao, efeitos }` cada. Quem precisa dos dois lados juntos chama
**`funcionamentosDaFicha(creature)`** (em `afty-schema.js`, o módulo folha), que devolve o principal
primeiro, já normalizado.

⚠ **Não foram unificados num array só**, e a assimetria é deliberada: os dois campos são lidos
direto em quatro telas (criador, Ficha Final, Painel de Combatente, aba Habilidades) e por fichas já
salvas, então o ganho de simetria não paga a migração. Para quem consome a função, os dois lados
são iguais.

O principal também não tem NOME próprio, e isso não é campo faltando: ele É a técnica. Na tela ele
aparece com o rótulo do sistema, e só os adicionais pedem nome ao jogador.

**A regra que veio junto.** Autor: *"Efeitos de dois funcionamentos básicos não funcionam"* e
*"Funcionamento Básico não acumula com Feitiços Ativos, Feitiços Passivos, Ações Shikigamis,
Caracteristica Shikigamis, Técnicas Marciais, Novo Estilo das Sombras e etc"*. Isso é exatamente o
**POOL EXCLUSIVO** de 2026-07-30, então nasceu a **sétima família**, `funcionamentoBasico`, e o
`efeitosDaTecnica` carimba TODA linha de TODO Funcionamento Básico com ela.

As duas metades da regra saem de um mecanismo só, porque o pool é **plano**: dois Funcionamentos
Básicos com o mesmo canal disputam entre si (vale o maior, o perdedor aparece no hover marcado como
suplantado) e nenhum deles soma com Feitiço, Shikigami ou Estilo da Sombra. Habilidade, talento,
origem, treino e encantamento seguem somando POR CIMA do vencedor, como sempre.

⚠ **Isso MUDA o comportamento do Funcionamento Básico que já existia**: até ontem as linhas dele
somavam com tudo. Uma ficha com Funcionamento Básico de +4 de Defesa e um Feitiço Passivo de +9
mostrava 13, e agora mostra 9.

⚠ **Técnica Marcial ainda não é família nenhuma**, porque o subsistema nunca foi enviado. Quando ele
nascer, entra na lista e o Funcionamento Básico para de acumular com ele sozinho.

**Sem interruptor por linha.** A Habilidade Única decide passiva ou ativa por efeito, mas o
`exclusivo` do Funcionamento Básico é blanket: a regra do autor é sobre a FONTE, não sobre a linha,
e um seletor "esta linha acumula" seria uma exceção que ele não pediu.

**UI.** No criador, o card Perfil Amaldiçoado ganhou os adicionais embaixo do principal (nome, texto
com formatação e o Motor completo, mesmo desenho do `EstiloEspecialCard`) e um botão para somar
outro. Na Ficha Final e no Painel de Combatente, a aba Habilidades passou a render **um cartão por
Funcionamento Básico** em vez de um só, e o cartão sem texto continua não aparecendo.

### 6. A Habilidade Geral **Aptidão** passou a valer `1 + Grau`

Era `1 + metade da Maestria` por pega, igual à Especialização. Agora é `1 + grau`, onde `grau` é o
rank do Grau do Feiticeiro (Quarto 1, Terceiro 2, Segundo 3, Primeiro 4, Especial 5), que sai da
faixa de ND em `grauFeiticeiro` e já chegava no contexto MONTANTE, onde as Gerais rodam. A
Especialização **não** mudou, e as duas deixaram de ser gêmeas.

⚠ **É um aumento no meio da escada, e não uma troca neutra.** O Grau chega ao 5 no ND 17 e a metade
da Maestria só no ND 36:

| ND | 1 a 4 | 5 a 12 | 13 a 25 | 26 a 35 | 36+ |
|---|---|---|---|---|---|
| Antes (1 + metade da Maestria) | 2 | 2 a 3 | 3 a 4 | 5 | 6 |
| Agora (1 + Grau) | 2 | 3 a 4 | 5 a 6 | 6 | 6 |
| Diferença por pega | 0 | +1 | +2 | +1 | 0 |

O TETO DE REPETIÇÃO segue sendo metade da Maestria, em `maxVezesGeral`. No ND 17 isso dá 3 pegas de
6, ou seja, 18 Aptidões Amaldiçoadas contra as 12 de antes.

O texto do card mudou junto ("igual a 1 + Grau Numérico"), senão a tela mostraria a fórmula velha.

### 6b. ⚠ O NOME APARADO NÃO ACEITA ESPAÇO (bug do mesmo dia, e antigo)

Autor, com print: *"na hora de colocar nome para alguma habilidade no Motor de Automação. Eu não
consigo colocar Espaços"*. Ele escreveu **"Seis..Olhos"** porque a barra de espaço não entrava.

A causa vale para qualquer campo do projeto: **o campo de edição estava sendo alimentado pelo nome
NORMALIZADO**. O `funcionamentosDaFicha` devolve `nome` já com `.trim()` e com o rótulo padrão no
lugar do vazio, e o editor lia esse valor. Digitar espaço grava `"Seis "`, o resolver relê e devolve
`"Seis"`, e o caractere morre antes do próximo chegar. O segundo sintoma vinha do mesmo lugar: uma
entrada nova abria com o texto literal "Funcionamento Básico" DENTRO do campo, em vez do
placeholder, porque o fallback de exibição também voltava para o editor.

Conserto: o resolver passou a devolver **as duas versões**, `nome` para EXIBIR e **`nomeCru`** para
EDITAR. Tela lê o pronto, campo lê o cru.

⚠ **O mesmo bug existia na Técnica de Estilo Especial** (`estilosDaFicha` também apara), e ninguém
tinha reportado. Consertado junto, pelo mesmo caminho, e de quebra morreu o remendo
`linha.nome === "Técnica Sem Nome" ? "" : linha.nome` que existia lá para disfarçar a metade do
problema que aparecia.

Assert novo simula a digitação caractere a caractere pelos dois caminhos, e o do jeito velho é
mantido como prova: ele produz `"Funcionamento BásicoSeisOlhos"`.

### 6c. O card do adicional era um cartão aninhado, e virou irmão do principal

Autor: *"o segundo Funcionamento Básico ficou extremamente feio e não consigo nem sequer formatar o
texto e fazer as coisas igualmente faço no principal"*.

A primeira versão copiou o `EstiloEspecialCard`: caixa roxa com borda, aninhada dentro do card
Perfil Amaldiçoado. Errado, porque um Funcionamento Básico adicional **não é sub-item do principal,
é irmão dele** (os Seis Olhos não são nota de rodapé do Ilimitado). O aninhamento criava três
larguras diferentes no mesmo card e estreitava a caixa de texto e o Motor em relação aos de cima,
que é o que fazia parecer que ali não dava para fazer as mesmas coisas.

Agora ele repete a estrutura do principal na MESMA largura: rótulo, texto com formatação e Motor,
separados por um divisor mais forte que o divisor interno do Motor. A única diferença que sobra é
que o rótulo do principal é fixo (ele É a técnica) e o do adicional é um campo.

### 7. Integração com o commit 985bb79 do GoliasK

Ele subiu a **Expansão de Domínio aplicada na ficha final** (mais os canais `movimentoMult` e
`removeResistencia`, e as três Bases de Suporte viraram concessão automática) enquanto este trabalho
estava na árvore sem commit. Fast-forward mais `git stash apply`: **quatro conflitos**, todos de
vizinhança e nenhum de regra.

| Arquivo | O choque | Como ficou |
|---|---|---|
| `afty-efeitos.js` | ele somou `movimentoMult` ao grupo Movimento, eu somei `tamanho` | os dois no grupo |
| `afty-derive.js` | ele passou o ctx do Feitiço INLINE com `beneficiosRitualDominio`, eu havia extraído o mesmo objeto para `ctxFeiticos` | ficou o `ctxFeiticos`, com o campo dele dentro. A Liberação Máxima, que reusa o ctx, passou a enxergar o benefício de Ritual do Domínio de graça |
| `afty-formulas-base.md` | os dois escreveram embaixo de Total.Aptidão | os dois parágrafos, o dele primeiro |
| `afty-status.md` | as duas sessões de 2026-08-12 no mesmo lugar | a dele sem rótulo e a minha como "(parte 2)", que é a convenção do bloco de 2026-08-10 |

⚠ **A mescla criou uma ponta que nenhum dos dois lados tinha sozinho.** A Expansão de Domínio sobe o
LIMITE da trilha em 2, e a Versatilidade Extrema fez a ALOCAÇÃO respeitar o limite. Juntas, elas
deixam comprar o 6° e o 7° nível enquanto o domínio está ligado na bancada. Não é destrutivo (o
aparo é de leitura, e desligar o domínio devolve o ponto ao orçamento), mas é compra permanente
numa janela temporária. Pergunta em `docs/a-fazer.md`.

Assert novo cobrindo a costura: limite 7 e efetivo 5 com o domínio ligado, Domínio e Barreira de
fora do bônus, trilha zerada que não recebe nada, e a Aura alocada em 6 voltando para 5 quando ele
cai.

### Verificação
`npx eslint src/systems/afty/` limpo, `npx vite build` limpo (o import novo
`afty-alto-nivel → afty-aptidoes` não fecha ciclo) e 70 asserts de lógica via `node`, cobrindo o
orçamento por ND de 1 a 36, as duas metades da Lendária, a trilha sem limite que segue parando no
5, a ficha sem a escolha marcada, o Restringido zerado, as duas linhas de fonte no detalhamento, a
escada nova da Geral Aptidão conferida contra `grauFeiticeiro` do ND 1 ao 40, a Especialização
provando que continua no `1 + metade da Maestria`, e os Funcionamentos Básicos (ficha antiga sem o
campo, dois deles disputando o mesmo canal, canais diferentes que não disputam, a derrota para o
Feitiço Passivo e a Lendária somando por cima).

---

## SESSÃO DE 2026-08-10 (parte 4): O MOTOR GANHOU VOCABULÁRIO E VIROU FRASE

Autor: *"O DSL mostrando os valores e derivados não existe em nenhum lugar no Grimório Afty. Com eu
precisando adivinhar o nome das variáveis. A Aparência ficou muito pouco intuitiva."*

Os dois estavam certos. O `docs/automacao-dsl.md` espelha só o `fm-dsl.js` da 2.5.2, e o Afty
acrescenta a maior parte do vocabulário por fora dele, em `buildCriaturaDslContext`. Numa criatura
qualquer o contexto tem **663 variáveis**, das quais **497 são `tem_*`** (uma por habilidade do
catálogo). Numa ficha em branco só **15** valem algo. Dentro do app não havia nada.

### 1. `afty-dsl-vocabulario.js`, que CLASSIFICA em vez de listar
O módulo novo recebe o contexto real e devolve grupos com o valor de cada variável. ⚠ Ele **não
mantém uma lista paralela**: cada chave do contexto cai em exatamente um grupo por regra de nome ou
de prefixo, e o que nenhuma regra reconhece cai em **"Outras"** em vez de sumir. Uma lista à mão
envelheceria calada no dia em que alguém somasse variável ao contexto, e o seletor passaria a mentir
sobre o que existe. Hoje o grupo "Outras" está vazio, e há assert provando isso.

⚠ **A ordem das regras de prefixo importa**: `prof_tr_` tem de ser testada antes de `prof_`, senão
todo Teste de Resistência entraria no grupo de Perícias.

`deriveAfty` passou a expor **`contextoDsl`** no topo. Cru, de propósito: agrupar custa uma varredura
das 663 chaves, e o derive roda por combatente e por estado de combate. Quem monta a lista é a UI,
num memo chaveado pela identidade do contexto (`useDslGrupos`), e o memo vive nos DONOS do `derived`,
não dentro do editor: um Feitiço Passivo por card faria a varredura rodar uma vez por card.

### 2. O seletor `{ }`, que insere no cursor
Mesmo desenho do `CanalPicker` (painel de 620px em colunas, busca sem acento, setas e Enter), com
três diferenças que o vocabulário obrigou:

1. **cada linha traz o VALOR à direita.** Saber que `esc_lutador` existe não ajuda sem saber que ele
   vale 8 nesta criatura;
2. **as famílias grandes listam só o que não é zero** (autor). O cabeçalho mostra `visíveis de
   total`, então o escondido não fica invisível, e a busca alcança as 497 para escrever condição
   sobre habilidade que a criatura ainda não tem;
3. **clicar INSERE no ponto do cursor**, e não troca um valor. É o que mata o adivinhar: o nome nunca
   precisa ser digitado. Função entra como `piso()` com o cursor DENTRO dos parênteses.

⚠ `dados_dano_final` e `nivel_feitico` aparecem com valor **`—`, e não zero**: elas só existem dentro
de uma linha de dano fechada, e um zero faria o jogador achar que a expressão dele daria zero.

As funções do DSL entram no mesmo painel, e não numa tela separada: elas são metade do que se escreve
numa expressão, e um segundo lugar para procurá-las seria um lugar a mais para esquecer.

### 3. A linha de efeito virou FRASE
Estava: duas fileiras de controles sem rótulo nenhum, em que o campo de VALOR e o de CONDIÇÃO eram
caixas idênticas lado a lado, e nada dizia qual era qual sem clicar. Agora se lê da esquerda para a
direita:

```
[Defesa ▾] em [todos ▾]                        🗑
  vale     [2 + piso(bt / 2)      ] { }   = +4
  enquanto [surto_adrenalina      ] { }
  e dura   [Permanente ▾]
```

⚠ Os conectores (`em`, `vale`, `enquanto`, `e dura`, `e é`) **não são texto explicativo**: eles são o
que IDENTIFICA cada campo. A alternativa era um rótulo empilhado sobre cada controle, que dobraria a
altura da linha, que é exatamente o erro que a nota de canal cometeu em julho ("Você PIOROU").

A prévia do valor ganhou largura fixa, e a linha da condição um espaçador da mesma largura, para as
duas caixas de expressão ficarem alinhadas uma sob a outra.

**Vale nos três lugares que usam o Motor**: Funcionamento Básico, Feitiço Passivo e Técnica de Estilo
Especial, porque os três são o mesmo `TecnicaMotorEditor`.

### Verificação
`npx eslint src/systems/afty/` limpo, `npx vite build` limpo e **38 asserts** novos sobre o
vocabulário: nenhuma variável do contexto se perde, nenhuma cai em dois grupos, cada família foi para
o grupo certo, `prof_tr_` não invade Perícias, os valores batem com o contexto, as variáveis de linha
de dano vêm `null`, os estados extras da bancada aparecem, e contexto ausente não quebra.
⚠ O seletor e o layout são UI: **não têm assert**, o teste real é na tela.

### O que ficou de fora
- **A Ficha Final não ganhou o seletor.** O buff ad-hoc da aba Buffs também aceita expressão do DSL e
  também é um campo cego. Ele usa outro componente (`CanalPicker` da ficha, pintado por token), então
  seria um `VariavelPicker` repintado. Não foi pedido.
- **Não há painel de referência do DSL inteiro** (operadores, exemplos), no molde do
  `AutomationDocsModal` da 2.5.2. O autor escolheu o seletor por campo sozinho.

---

## SESSÃO DE 2026-08-10 (parte 3): O ESTILO DA SOMBRA ESTAVA INVERTIDO

O autor relatou que o Novo Estilo da Sombra "funcionou de maneira errada", e não era um número
errado: era o **modelo ao contrário**.

**Como estava.** "Modificação do Domínio Simples" era um RECIPIENTE. Uma linha da ficha que custava
**1** do contador e carregava dentro dela até `dom` efeitos da tabela. Errava as duas pontas:
Aumento de Defesa mais Bônus de Acerto na mesma Modificação custavam 1 só, e criar uma segunda
Modificação dava um orçamento de `dom` efeitos **novo e inteiro**.

**Como ficou.** Duas coisas que eram uma só passaram a ser duas:

| | O quê | Onde mora | Quem limita |
|---|---|---|---|
| **CONHECER** | cada efeito É uma Técnica de Estilo, e custa 1 do contador por si | ficha (`estilosSombra`) | o contador único da aba |
| **IMBUIR** | a Técnica ocupa vagas do Domínio Simples, e a mesma pode ocupar várias | estado de COMBATE (`combate.estilo_*`) | o Nível de Aptidão em Domínio |

Autor: *"O Contador é por Técnica de Estilo. Logo, 'Aumento de Defesa' contaria como 1. 'Aumento de
Acerto' contaria como outro. E você pode imbuir eles em seu Domínio Simples para receber os efeitos.
Então se eu tiver 5 Níveis de Domínio e só tiver uma Técnica de Estilo 'Aumento de Acerto', eu
poderia imbuir ele 5x no meu Domínio Simples. É sobre ter várias Técnicas de Estilo, e sair imbuindo
elas fazendo combinações em meio ao combate."*

### As 4 decisões que ele tomou antes de eu mexer
1. **A imbuição é SÓ da sessão de combate.** O criador guarda apenas o que a criatura conhece.
2. **A Técnica de Estilo Especial virou Técnica normal**: custa 1 do contador e **precisa de vaga de
   imbuição** para valer. A linha "Efeito Especial" **saiu da tabela** (as duas eram a mesma coisa
   escrita duas vezes), e a tabela caiu de 5 para 4.
3. **Conhecer a mesma Técnica duas vezes não existe.** A repetição é a imbuição.
4. **Os tetos escritos limitam a IMBUIÇÃO** ("colocado" agora quer dizer "imbuído"): Aumento de
   Defesa para em 2, e os outros três não têm teto além das vagas.

### O desenho: a imbuição é uma FAIXA da bancada
Ela não virou campo novo de ficha. Cada Técnica conhecida vira uma **faixa** nos `estadosExtras`,
mais um bool `estilo_ativo` que representa o Estilo no ar (as faixas têm `requerEstado` nele, então
só aparecem com ele ligado). Com isso:

- a bancada de Simulação do criador e a aba **Estados** da Ficha Final ganharam o controle **sem uma
  linha de UI nova**, porque as duas já montam a lista a partir dos `estadosExtras`;
- a sessão da Ficha Final já sobrescreve `combate`, então "trocar a combinação em meio ao combate"
  saiu de graça, e nada disso suja a ficha;
- a quantidade imbuída entra na expressão como **VARIÁVEL do DSL** (`piso(maestria / 2) *
  estilo_acerto`), e não como número. A linha de efeito é estática e o valor acompanha a mesa
  sozinho, sem o motor remontar efeito nenhum.

⚠ **`estadosExtras` deixou de ser só `bool`** (`afty-combate.js`). Um extra pode declarar
`tipo: "faixa"` com `min`/`max` próprios. O teto sai da ficha (o Nível de Aptidão em Domínio) e por
isso viaja no próprio extra, e não no catálogo: quem cria o extra já enxergava a ficha inteira, então
`max` aqui **nunca é função**, ao contrário do `COMBATE_ESTADOS`.

⚠ **O `modo: "ativa"` por linha MORREU no Estilo.** Com tudo preso ao Domínio Simples, não sobrou
linha passiva para distinguir da ativa. O `TecnicaMotorEditor` da Especial perdeu o `comModo`.

### Ficha legada
`estilosDaFicha` CONVERTE o shape antigo. Uma `modificacao` gravada explode: cada efeito de tabela
vira uma Técnica conhecida, e a parte de Motor livre dela (o antigo "Efeito Especial") vira uma
Técnica Especial com o nome e o texto da linha. Duas Modificações com o mesmo efeito colapsam numa
Técnica só. **O que não sobrevive é a quantidade de vezes**, que virou imbuição e não é mais dado de
ficha, nem o `modo` de cada linha do Motor, que morreu junto. Sem essa conversão o rascunho
automático do autor abriria com o card vazio e o contador liberado, que é perda calada.

### 🐛 A conversão era só de LEITURA, e travava a ficha antiga
Relatado pelo autor no mesmo dia: *"Nas fichas antigas, eu não consigo editar e remover Estilos que
eu já tinha pego."* Estava certo, e o buraco era entre a leitura e a escrita.

A `estilosDaFicha` convertia na leitura, mas a ficha continuava guardando a `modificacao` velha, e
os escritores do builder trabalhavam no ARRAY CRU, no shape novo. Os dois nunca se encontravam:

- **desmarcar não desmarcava.** `toggleEstiloTabela("defesa")` procurava `{id:"defesa"}` no cru, não
  achava (o que existia era a Modificação que o CONTINHA), então ADICIONAVA. A conversão deduplica,
  então a tela não mudava. Clicar de novo removia o que acabara de entrar, e a Modificação velha
  seguia marcando o efeito. Um alternador que pisca sem sair do lugar;
- **a Modificação só com efeitos de tabela não tinha card nenhum** para remover, porque o card de
  Especial só existe para quem tem linha de Motor;
- **remover a Especial herdada levava as Técnicas de tabela junto**, porque as três saíam da mesma
  linha crua.

**Conserto:** todo escritor parte da lista NORMALIZADA (`estilosArr = (d) => estilosDaFicha(d)`), e
não do array cru. A ficha migra na primeira edição, e a operação é idempotente para quem já está no
shape novo. **22 asserts** cobrem os três sintomas, a migração na primeira escrita, a Especial
criada pelo `createBlankEstilo` velho e a idempotência.

⚠ **A lição vale para o resto do sistema:** normalizador que só roda na leitura deixa a ficha num
shape que a UI não sabe escrever. Todo `resolveX` que converte tem de ter o irmão na escrita, ou o
usuário fica olhando para um botão que não obedece.

### O interruptor virou "Novo Estilo das Sombras", e os Estados viraram ÁRVORE
Autor, na Ficha Final: *"Deixe como 'Novo Estilo das Sombras' ao invés de 'Domínio Simples'. E
melhore a aparência, deixando os Efeitos de Estilo mais ligados a caixa de seleção do Novo Estilo das
Sombras. Atualmente parecem coisas completamente separadas."*

**O rótulo.** `ESTADO_DOMINIO_SIMPLES` virou **`ESTADO_ESTILO_ATIVO`** (id `estilo_ativo`, era
`estilo_dominio_simples`) e o rótulo saiu para a constante `ESTILO_LABEL`. ⚠ Pela REGRA quem está no
ar continua sendo o Domínio Simples ("enquanto ele estiver ativo", no texto de cada efeito): o que
mudou foi o nome na tela, porque uma linha solta chamada "Domínio Simples" lia como aptidão avulsa.
O comentário do módulo registra a diferença, para ninguém achar que a regra mudou.

**A aparência.** O `requerEstado` sempre significou "esta linha só existe com aquela ligada", mas a
lista de Estados era ACHATADA e as duas liam como assuntos separados. Agora o pai desenha a caixa e
os filhos moram **dentro** dela, recuados, com um fio correndo ao lado e um gancho por linha.
Nenhum estado precisou de campo novo: a árvore sai do `requerEstado` que já estava declarado.

⚠ **Isso pega mais quatro grupos além do Estilo**, porque a relação é a mesma: PE Extra e Pilhas sob
**Brutalidade**, Espírito Incansável sob **Espírito de Luta**, Adrenalina Absoluta e Atletismo sob
**Surto de Adrenalina**, e Golpe Garantido sob **Ataque Furtivo**. Não foi pedido, e é o mesmo
desenho: separar o Estilo do resto seria caso especial na lista geral.

⚠ **O laço é feito com BORDA, e não com tom de fundo**: no tema claro `--afty-poco` e `--afty-card`
são os dois branco, então um degradê de fundo não separaria nada.

⚠ **A `.afty-linha` de cada estado virou `.afty-estado-linha`**, e a `.afty-linha` passou a ser a
CAIXA do grupo. A densidade compacta foi junto (ela apertava a `.afty-linha` de cada estado, e agora
aperta a linha e zera a caixa), e as duas classes novas mais o `data-afty-estado` no grupo são
ganchos estáveis para o CSS do usuário. Ver [[afty-css-personalizado]].

**Não mexi na bancada do criador.** Ela monta a mesma lista de forma achatada e tem o mesmo
problema, mas o pedido foi sobre a Ficha Final. É a mesma mudança, se você quiser.

### Assunções anotadas (o autor não foi perguntado)
- **A Especial ocupa 1 vaga e não repete.** O livro não dá cláusula de repetição para ela, e a
  decisão 4 diz que só repete quem o texto manda repetir.
- **O estouro de vagas AVISA e não trunca.** Mesmo comportamento do orçamento de efeitos anterior:
  a combinação passa, e o aviso âmbar aparece no card do criador e no item da Ficha Final.
- **O autor escreveu "Aumento de Acerto"** na mensagem, mas o nome do livro no catálogo é **Bônus de
  Acerto**. Mantido o do livro.
- **A imbuição não gera chip de delta** na Ficha Final. `deltaDosEstados` só varre `COMBATE_ESTADOS`,
  e extras nunca tiveram delta (a Habilidade Única também não tem). Estender custaria um `deriveAfty`
  por Técnica conhecida a cada mudança de sessão.

### Verificação
`npx eslint src/systems/afty/` limpo, `npx vite build` limpo e **40 asserts de lógica** novos
passando, incluindo o exemplo do autor (uma Técnica só, imbuída 5x com DOM 5, gasta 1 do contador e
rende `piso(maestria/2) × 5` no Acerto), a 2ª imbuição de Aumento de Defesa que **não** soma na
própria Defesa, o Domínio desligado zerando tudo e a conversão do shape antigo.
⚠ As mudanças de UI (card do criador, faixa na bancada e na aba Estados) **não têm assert**: o teste
real é na tela.

---

## SESSÃO DE 2026-08-10 (parte 2): MERGE COM A CONJURAÇÃO EM RITUAL

O GoliasK subiu **Conjuração em Ritual** (`afty-rituais.js` mais 15 arquivos) enquanto a Liberação
Máxima estava na árvore sem commit. Os dois sistemas mexem nos MESMOS calculadores, então a mescla
teve decisão de regra e não só de texto. Detalhe completo na seção MERGE, mais abaixo nesta sessão.

---

## SESSÃO DE 2026-08-12

### Expansão de Domínio aplicada na ficha final

O estado da aba Buffs guardava apenas `true`, enquanto `efeitosDoDominio` procurava o
`creature.dominioAtivoId` persistente do criador. Na ficha final o combate vem da sessão e substitui
a bancada do criador, então a linha acendia visualmente sem identificar qual expansão o Motor devia
usar. Com mais de uma expansão, não havia escolha segura possível.

`dominioAtivo` agora é um estado catalogado do tipo `dominio`. A aba Buffs e a Simulação de Combate
mostram uma opção por expansão e guardam o id escolhido. `resolveCombate` valida o id contra a lista
derivada. O booleano antigo continua compatível: usa `dominioAtivoId` ou a única expansão existente.
`dominioEmUso` centraliza essa resolução para o Motor, os níveis de Aptidão, os Rituais e o resumo da
ficha.

Efeitos básicos ligados enquanto a expansão escolhida está ativa:

| Efeito | Estado atual |
|---|---|
| Níveis de Aptidão | +2 em Aura, Controle e Leitura e Energia Reversa quando a trilha já tem ao menos Nível 1. O limite da trilha também sobe 2, permitindo passar de 5 |
| Confronto de Domínio | Adiado por decisão do autor nesta etapa |
| Movimento | Multiplica o movimento final por 2 pelo canal `movimentoMult` |
| Custo de Feitiço | O canal `custoPE` reduz todos os Feitiços em DOM, mantendo o piso final de 1 PE |
| Benefício de Ritual | A expansão guarda uma escolha para Dano, Especiais, Auxiliares e Cura. O benefício é gratuito e não concede nem ocupa vaga adicional |

O benefício gratuito já entra nos resolvedores de **Dano** e **Cura**. **Auxiliares e Especiais
continuam pendentes**, porque essas duas categorias ainda não passam por `resolveRitual`. Os seletores
ficam preservados no modelo para a ligação futura, sem inventar uma aplicação diferente da regra.

Os efeitos escolhidos também passaram a alcançar a ficha:

- Amplificação de Técnica aplica dados, dano fixo, CD, RD ignorada e remoção de resistência aos
  Feitiços correspondentes.
- Amplificação Corporal aplica nível de dano, dano fixo, RD ignorada e remoção de resistência apenas
  a armas e Ataque Básico. Os alvos explícitos impedem o bônus corporal de vazar para Feitiços.
- Aumento de Atributo, Redução de Dano e Defesa continuam pelo Motor já existente.
- Efeitos Ambientais permanecem fora da ficha do dono, conforme decisão do autor. Condições da aba
  Buffs continuam somente como marcadores.

As propriedades calculadas mostram `Ignora RD` e `Resistência: Removida` nos Feitiços. As linhas de
dano armado e básico mostram `Remove Resistência` quando o efeito corporal alcançar esse degrau.

Assert de sessão com duas expansões confirmou seleção isolada: movimento 9 para 18, CD 23 para 29,
custo 8 para 5 com DOM 3 e dano 12d8 para 15d8+10. Trocar de expansão removeu o efeito da anterior.

### Atualizações já presentes no worktree

O diff anterior à correção de Domínio também contém duas frentes preservadas e verificadas:

- As Bases **Suporte em Combate**, **Energia Reversa** e **Liberação de Energia Reversa** são
  concedidas automaticamente pelo nível de Suporte e não gastam vaga. As duas últimas concedem a
  Aptidão nomeada. A origem Maldição continua sem trilha de Energia Reversa e não recebe essa
  concessão.
- Cura por dado passou a fechar o teto por fonte. O teto de Apanhador de Saúde não apara um bônus
  separado do Funcionamento Básico. Descarga Reanimadora continua copiando uma cura pronta sem
  reaplicar canais. Puxar um Ar e Insistência copiam o Ataque Básico e depois recebem os bônus de
  cura uma vez, porque o dano copiado não os contém.

### Verificação

- `HEAD` e `origin/main` estão iguais após `git fetch --prune origin`: divergência `0 0`.
- `npx eslint src/systems/afty/` passou.
- `npx vite build` passou. Permanece o aviso de versão: Node 22.11.0, enquanto o Vite pede 22.12 ou
  superior na linha 22.
- Asserts do `deriveAfty` passaram pelo hook de resolução documentado no Contexto rápido.
- `git diff --check` passou.
- `src/components/` não possui alteração.

---

## REVISÃO DE PENDÊNCIAS DE 2026-08-09

Revisão das anotações do autor contra o estado atual do código. A seção começou como auditoria e
também registra as correções implementadas na sequência.

### Já resolvido

- **Descrição de Habilidades na ficha final:** já existe. A aba Habilidades monta o conteúdo em
  `ficha/ficha-conteudo.js`, e `ItemDeFicha.jsx` mostra a `descricao` verbatim quando o item é
  aberto. A descrição fica fechada por padrão.
- **Crítico comum na ficha final:** já é automático nas linhas de dano. A rolagem de Acerto usa a
  margem daquela linha, marca o Crítico e o Dano seguinte dobra somente os dados. A marca é
  consumida depois da rolagem de Dano. Isso ainda não implementa Raio Negro.

### Conjurador após a primeira correção

Das seis pendências registradas na sessão de 2026-08-07, **Foco Amaldiçoado: Destruição**,
**Potência Concentrada** e **Ciclagem Maldita** foram ligados em 2026-08-09. As outras três
continuam sem integração completa:

- ~~**Foco Amaldiçoado: Destruição**~~ ✅ **Feito para Feitiços de Dano em 2026-08-09.** A opção
  emite `danoBonus` com alvo `feitico` e expressão `dados_dano_final + maestria`. A quantidade real
  de dados fecha antes da expressão, inclusive por disparo em Múltiplos Disparos. A fonte aparece
  no hover da rolagem. A parcela de Aptidões Amaldiçoadas continua esperando linhas estruturadas de
  dano para elas.
- ~~**Potência Concentrada**~~ ✅ **Feito em 2026-08-09.** Virou o estado catalogado
  `potenciaConcentrada`, visível na ficha somente para quem escolheu a Habilidade. A ativação fica
  bloqueada depois do primeiro uso na rodada. O próximo Feitiço de Dano de alvo único recebe
  `5 * nivel_feitico`, e a primeira rolagem de dano consome o estado automaticamente.

  **Leitura conservadora adotada após o autor mandar continuar sem responder às três perguntas:**
  a preparação persiste até um Feitiço elegível ser usado, o bônus entra apenas no dano inicial do
  Dano Contínuo e somente no primeiro disparo de Múltiplos Disparos. As três decisões ficam abertas
  para revisão do autor.
- ~~**Ciclagem Maldita**~~ ✅ **Feito em 2026-08-09.** A sessão guarda
  `ultimoFeiticoDanoId` quando a primeira rolagem de um Feitiço de Dano é usada. Outro Feitiço de
  Dano recebe dados adicionais iguais a `piso(maestria / 2)`, com a habilidade identificada no
  hover da fonte. O primeiro Feitiço da sessão e a repetição do mesmo Feitiço não recebem bônus.

  **Leitura conservadora adotada após o autor mandar continuar:** somente Feitiços de Dano com
  rolagem estruturada participam do histórico. Dano Contínuo recebe os dados apenas no golpe
  inicial. Em Múltiplos Disparos, os dados adicionais entram somente na primeira rolagem, sem serem
  multiplicados pela quantidade de disparos. Essas decisões ficam abertas para revisão do autor.
- **Rituais e Aprimoramento de Rituais:** implementação iniciada em 2026-08-09 a partir do texto
  integral enviado pelo autor. O motor puro de Ritual fecha ação final, quantidade de melhorias,
  Ritual Estendido e CD de Prestidigitação, incluindo a exceção do Nível 0. A ficha final guarda
  uma configuração por Feitiço, permite escolher as melhorias e rola o teste contra a CD,
  registrando Sucesso ou Falha no histórico. Naturalidade com Rituais abre a escolha entre
  Destreza e Inteligência. Ritualista soma +2 no teste e controla a melhoria adicional por
  Descanso Longo. A sessão registra qual Feitiço está usando Ritual e bloqueia outro enquanto o
  primeiro não for encerrado, preservando as rolagens restantes dele.

  **Correção de estado em 2026-08-10:** o Ritual comum agora bloqueia a resolução do Feitiço até o
  resultado do teste. Sucesso libera a resolução. Falha exige cancelar a conjuração ou apertar
  Finalizar antes de resolver o Feitiço. O Ritual Estendido usa Iniciar e Finalizar, mantendo
  Desprevenido entre os dois estados. Interromper remove Desprevenido. A configuração fica travada
  durante o processo.

  **Ajuste do autor em 2026-08-10:** o fluxo não consulta nem avança a rodada da ficha. Iniciar,
  Finalizar, Conjurar, Resolver e Encerrar são estados controlados apenas pelos botões. Enquanto o
  Ritual não for encerrado, outro Feitiço não pode iniciar Ritual. Fontes futuras de Especialização
  ou Expansão de Domínio que dispensem Prestidigitação entram pelo mapa `rituaisSemTeste`, e a ficha
  mostra Usar no lugar da rolagem. Nenhuma fonte foi ligada sem o texto específico da regra.

  Ritualista é consumido quando o teste ou a preparação começa, mas a vaga adicional permanece no
  uso atual até ele ser encerrado ou cancelado. Depois da resolução, as rolagens restantes do mesmo
  Feitiço conservam a vaga enquanto o estado Resolvido estiver aberto. Configuração acima do limite
  não pode iniciar teste, preparação ou resolução.

  Nos Feitiços de Dano já funcionam Ajuste de Alvos, Aumento de Alcance, Aumento de Dano, Aumento
  de Precisão, Conversão de Sustento, Expansão de Área e Potencialização de Dificuldade. A parcela
  fixa do Aumento de Dano entra somente na primeira aplicação de Dano Contínuo e no primeiro
  disparo de Múltiplos Disparos. Nos Feitiços Curativos já funcionam Ajuste de Alvos, Aumento de
  Alcance e Expansão de Área.

  **Ainda pendente nesta frente:** aplicar as melhorias nos Feitiços Auxiliares e Especiais,
  modelar Feitiço Favorito e decidir os casos ambíguos de Potencialização de Efeito descritos nas
  perguntas abertas desta sessão.

  **Propriedades na ficha final em 2026-08-10:** cada linha de Feitiço na aba Ações passou a mostrar
  os resultados calculados disponíveis, incluindo Conjuração, Alcance, Alvo, Área, Duração,
  Resolução, CD, Acerto, Dano, Cura, Efeito, Condições, Empurrão, Alvos Protegidos e Sustentação.
  A linha usa o mesmo cálculo que alimenta as rolagens. Alterar uma melhoria de Ritual atualiza
  imediatamente Dano, Alcance, Área, CD, Acerto, Conjuração e os demais resultados afetados.
  `descricao` e `conjuracaoTexto` seguem verbatim no `title` do nome do Feitiço.

  **Correção do ciclo em 2026-08-10:** o Ritual pode ser desativado em qualquer etapa pelo
  botão da própria linha. Desativar limpa o uso atual e libera outro Feitiço, mas conserva as
  melhorias configuradas para uma ativação futura. A etapa Pronto também ganhou Cancelar, que
  abandona o uso atual e destrava a configuração sem desligar o Ritual daquele Feitiço.

  **Apresentação vertical em 2026-08-10:** os Feitiços da ficha final usam um cartão com nome,
  nível e custo no cabeçalho. Conjuração, alcance, alvo, área, duração e demais resultados ficam
  em linhas verticais. A descrição verbatim aparece no corpo como Efeito. As rolagens continuam
  clicáveis na linha do resultado correspondente, e os controles de Ritual permanecem no rodapé.
  Cada cartão fica recolhido por padrão e mostra somente o nome. Nível, custo e todo o corpo aparecem
  ao abrir o Feitiço.

  **Perguntas abertas para não inventar regra:**

  1. Em Potencialização de Efeito, "aumenta o nível dos dados adicionais em 6 ou 3" soma 6 ou 3
     diretamente às faces do dado, avança uma escala de dados ou usa outra tabela?
  2. Potencialização de Efeito pode aumentar a rolagem de um Feitiço Curativo, ou "benefício
     numérico" fica restrito aos efeitos Auxiliares?
  3. Em Múltiplos Efeitos, a melhoria precisa guardar qual efeito recebe a potencialização. Essa
     escolha é feita em cada ritual ou fica presa ao Feitiço?
  4. Dano na Alma corta pela metade os aumentos de dano e alcance que não vêm da criação. Isso
     inclui as melhorias do Ritual? Se incluir, como arredondar valores fracionários?
- **Destruição Ampla:** não recebe a quantidade de criaturas afetadas para calcular o dano
  adicional.
- **Destruição Focada:** não ativa os dados adicionais e a RD ignorada no Feitiço de alvo único.

### Custo de Feitiços e Habilidades

**Situação atual:** `afty-feiticos.js` possui `aplicaReducoesCustoFeitico`, usado pelo criador e pelo
`resumoFeiticos` da ficha final. **Dominância em Feitiço** e **Manipulação Perfeita** já possuem
seleção por Feitiço-base no card de Feitiços. Variações de Liberação herdam a seleção do Feitiço-base,
as duas reduções acumulam e o hover do custo mostra as fontes numéricas. As demais fontes abaixo
continuam pendentes.

Reduções e alterações de custo de Feitiço já localizadas e ainda não aplicadas ao resultado:

| Fonte | Escopo que precisa ser modelado |
|---|---|
| **Foco Amaldiçoado: Economia** | Todos os Feitiços, redução de 2, incluindo Nível 1 a custo 0 |
| **Dominância em Feitiço** | ✅ Um Feitiço-base escolhido, redução igual à metade do nível dele, arredondado para cima, piso final 1 PE |
| **Manipulação Perfeita** | ✅ Até o bônus de treinamento em Feitiços-base, custo-base reduzido pela metade com arredondamento para baixo, piso final 1 PE |
| **O Honrado** | Feitiços de nível 1, 2 e 3 com custo reduzido pela metade |
| **Preparação de Técnicas** | Dois Feitiços preparados por descanso longo, metade do custo no primeiro uso, com o nível permitido escalando |
| **Marca Registrada** | O Feitiço adicional escolhido recebe redução de 1 PE |
| **Técnica Registrada** | Aumenta a redução da primeira Marca Registrada para 2 ou reduz a sustentação em 1, e concede Marcas adicionais |
| **Manual de Técnica** | O Feitiço criado acima do nível acessível tem custo aumentado em 50% |
| **Verdadeiras Origens, irmão morto** | Recebe a redução de O Honrado e reduz em 10 o custo da Técnica Máxima concedida |
| **Expansão de Domínio, benefício Custo de Feitiço** | ✅ Reduz o custo em DOM enquanto a expansão escolhida está ativa, com piso final de 1 PE |

Regras relacionadas a custo de Habilidade, mas que não são apenas custo-base de Feitiço:

- **Arma Harmonizada:** reduz em 1 o custo da próxima Habilidade que gaste PE ou Estamina depois de
  um acerto crítico.
- **Mistura Profana:** reduz em 1 o custo das Habilidades que utilizam energia amaldiçoada durante
  uma cena.
- **Infinitude:** transforma em zero o custo de Habilidades de Técnica de nível 1 e 2 enquanto o
  estado estiver ativo.
- **Adepto de Feitiçaria:** reduz o custo da Mudança de Fundamento, que não é necessariamente o
  mesmo campo do custo-base do Feitiço.
- **Mudanças de Fundamento e recarga de arma:** também alteram custo em ações. Precisam ficar
  separados do custo em PE.
- Habilidades de Controlador também reduzem custo de invocação, ativação ou Habilidades das
  Invocações. Elas pertencem ao resolvedor de Invocações, não ao custo-base de Feitiço.

Confirmado pelo autor para Dominância em Feitiço e Manipulação Perfeita:

1. As duas reduções acumulam quando escolhem o mesmo Feitiço.
2. Dominância mantém o arredondamento para cima escrito na própria regra. Todo arredondamento sem
   indicação contrária é feito para baixo.
3. O custo final mínimo é 1 PE.
4. Variações e liberações recebem a redução escolhida para o Feitiço-base.
5. Em Manipulação Perfeita, o bônus de treinamento limita somente a quantidade de Feitiços
   escolhidos. O custo-base é reduzido pela metade, arredondada para baixo, antes da redução fixa de
   Dominância em Feitiço.

**Fechamento técnico de 2026-08-10:**

- As escolhas ficam em `reducoesCustoFeitico`, com uma seleção para Dominância e até o bônus de
  treinamento para Manipulação. Os seletores aparecem somente quando a criatura possui a Habilidade.
- O criador e a ficha final usam o mesmo resolvedor. O hover do custo mostra custo-base, cada
  redução aplicada e o total.
- Caso validado: Feitiço de Nível 5 com custo-base 20 recebe redução 10 de Manipulação e redução 3
  de Dominância, resultando em 7 PE. Ao desligar Manipulação, o resultado volta para 17 PE.
- ESLint, build do Vite, `git diff --check` e 16 asserts de lógica passaram. O teste visual da rota
  `/Afty` não apresentou erros ou avisos no console.
- **Robustez futura, não bloqueante:** um JSON editado manualmente que coloque o id de um Feitiço
  apagado antes de um id válido em `manipulacao` pode fazer o seletor mostrar a escolha válida sem
  aplicar a redução. O fluxo normal da interface remove esses ids e não produz esse estado.

Antes de implementar as demais fontes, ainda confirmar com o autor:

1. A ordem quando uma redução fixa e uma divisão pela metade se aplicam ao mesmo custo.
2. Quais reduções acumulam e quais disputam entre si.
3. O piso final de custo de cada fonte. Economia permite explicitamente custo 0, mas as outras não
   dizem isso.
4. Se "custo de Habilidade" nesta frente inclui PE, PER, Estamina e custo em ações, ou somente PE.
5. Como guardar os Feitiços escolhidos e os estados por descanso, cena, próximo uso e primeiro uso.

### Fonte de bônus de Perícia do Sem Técnica

O bônus de **Empenho Implacável** é aplicado ao número pelo canal `bonusPericia`. O problema está no
rótulo da fonte: `coletarEfeitosOrigem` usa `OPCAO_ORIGEM_NOME`, então o hover recebe apenas o nome
da opção escolhida, como **Acrobacia**, sem identificar **Empenho Implacável** ou o degrau que
concedeu o bônus. Os degraus de ND 3, 13 e 17 podem atingir a mesma Perícia, então o nome do degrau
também é necessário para diferenciar as parcelas.

Correção pendente de UI de fontes, sem mudar a regra ou o valor: rotular cada parcela com a
característica e o degrau, preservando a Perícia escolhida no nome.

### Crítico e Raio Negro na ficha final

- **Crítico comum:** feito para Acerto seguido de Dano, como descrito acima.
- **Raio Negro:** não existe no motor de rolagem nem no estado de combate. A ficha não distingue um
  Crítico comum de um Kokusen, não aplica o dano de 1,5x, não ignora RD, não controla o Estado de
  Consciência Absoluta e não reduz a margem dos Kokusen seguintes.
- A automação deve olhar a Aptidão escolhida e o valor natural do d20. **Abençoado pelas Faíscas
  Negras** também altera o limiar inicial e concede efeitos depois do Kokusen.
- O dano adicional do Kokusen precisa entrar antes do Dano Após Ataque, conforme o texto já
  transcrito em `afty-aptidoes.js`.
---

## SESSÃO DE 2026-08-10

### As quatro sobras do code review, feitas sem supervisão

O autor foi dormir pedindo *"só faça o quê você conseguir fazer sem meu apoio"*. Da fila do
`a-fazer.md`, quatro eram conserto puro e saíram. **Seis ficaram intocadas de propósito**, porque
dependem de regra ou de escolha de produto (largura de linha, Estímulo de Saída nos 7 efeitos que
faltam, Liberação em Especiais e Passivos, efeito repetido na Transformação, o que duplicar um
encontro deve preservar, e a migração das pendências antigas do `afty-status.md`).

**1. Buff da sessão aparecia duas vezes na aba Buffs.** `efeitosDaSessao` carimba
`duracao: "temporaria"` em tudo que o jogador cria na seção de cima da própria aba, e a seção
Temporários filtrava só por duração. O mesmo +2 saía duas vezes: uma editável, com botão de apagar,
e outra em só leitura. Lido de cima a baixo aquilo são dois bônus, e o segundo parece não ser dele
para desligar. Filtro agora exclui `origem === "sessao"`. ⚠ Conferido que ele **não come o que não
deve**: um efeito temporário vindo da Técnica continua na lista.

**2. Iniciativa negativa era impossível de digitar.** O input era controlado pelo NÚMERO, então o
mestre digitava "-", o `Number("-")` dava NaN, o `|| 0` virava 0 e o campo repintava "0" antes do
dígito seguinte chegar: "-2" saía como "+2". Novo `CampoNumerico`, que guarda a string enquanto o
campo está sendo digitado e solta no blur. É o que o `AdicionarJogador` já fazia, e a divergência
entre os dois campos era a prova de qual estava certo.

**3. O painel de fontes escapava do tema dentro do Encontro.** O portal fazia
`getElementById("afty-ficha")`, e só a `AftyFicha` declara esse id. A tela de Encontro tem a
CLASSE e não o id, então todo hover do painel do combatente ia parar no `document.body`, fora do
container que declara os tokens `--afty-*`, e caía nos fallbacks embutidos. Passou a procurar com
**`closest(".afty-ficha")` a partir do gatilho**, e não pelo id. Resolve as duas telas e qualquer
outra que reuse as abas, sem espalhar um id que tem que ser único. O `getElementById` ficou de rede
de segurança.

**4. Os dois `useMemo`.** O `LinhaFeitico` chamava `comLiberacao` no corpo do componente, então
qualquer render recalculava o Feitiço inteiro. E o memo de `derivados` do encontro dependia do
encontro INTEIRO: cada tecla no campo de PV, cada rolagem e cada entrada de log re-derivavam TODOS
os combatentes, os ~14ms por criatura vezes N.

⚠ **A primeira versão do cache usava `useRef` e o eslint reprovou, com razão**: ref lido durante o
render não é seguro sob renderização concorrente. A versão final é um **WeakMap de módulo** chaveado
pelo objeto `ficha`, que entra clonado uma vez e nunca mais muda de identidade (os patches fazem
`{ ...c, sessao }`). Como é cache de função PURA, viver fora do componente é correto, e o WeakMap
deixa o combatente removido ser coletado sozinho. A chave de invalidação são as três coisas que o
`derivarCombatente` realmente lê: `sessao.combate`, `sessao.buffs` e `sessao.almaAtual`.

Efeito colateral bom do nº 4: o `derived` conserva a IDENTIDADE quando nada relevante muda, e com
isso o memo de `deltaDosEstados` no `PainelDeCombatente` para de ser invalidado à toa, que era mais
um `deriveAfty` por estado de combate ligado.

Verificação: 129 asserts de regra e 29 de integração seguem passando, os 6 achados do code review
seguem sem reproduzir, `npx eslint src/systems/afty/` limpo e `npx vite build` limpo. ⚠ Os quatro
consertos são de UI e de hook, então **não têm assert de node**: o teste real é na tela.

---

## SESSÃO DE 2026-08-09

### 📋 NASCEU O `docs/a-fazer.md`, e ele é a fila de trabalho agora

Pedido do autor: *"padronize as anotações de COISAS A FAZER em um único arquivo md. Para outros
colaboradores usarem ele também e ir anotando oq for preciso."*

- **Toda pendência nasce lá.** Nada de `// TODO` no código sem a linha correspondente no arquivo.
- **Este doc (`afty-status.md`) continua sendo o LOG de sessões** e a explicação de por que as
  coisas são como são. Ele não é mais a lista de tarefas.
- ⚠ As pendências históricas espalhadas pelas seções antigas **não foram migradas**: seriam um
  diff enorme num arquivo que outros colaboradores também editam, e o pedido foi padronizar daqui
  para frente. A migração completa está anotada como pendência dentro do próprio `a-fazer.md`.

### LIBERAÇÕES MÁXIMAS (suplemento "O Ápice da Liberação")

Sistema novo em `src/systems/afty/afty-liberacoes.js`. **A Liberação Máxima não é um Feitiço nem
um objeto guardado na ficha**: ela é um MODO DE SAÍDA declarado na hora da conjuração.

Isso é a decisão que segura o resto. O suplemento tem duas versões, a "Saída Rígida" (duas
melhorias congeladas na criação) e a "Saída Adaptável" (escolhidas no momento), e o autor mandou
construir **a adaptável**: *"é a versão COM a habilidade. Você pode usar com as melhorias
escolhidas na hora."* Por isso `createBlankFeitico` não ganhou campo nenhum, e a escolha viaja em
`ctx.liberacao`.

| Regra | Como ficou |
|---|---|
| Acesso | ND 9, **constante**. ⚠ NÃO derivado de quando o Nível 3 destrava: o autor avisou que uma habilidade base de Conjurador dá Nível 3 já no nível 7, e derivar daria Liberação dois níveis cedo |
| Quem alcança | qualquer criatura com Feitiços, e só os de **Nível 3, 4 e 5** |
| Custo | **12 / 20 / 25**, o custo do PRÓXIMO nível, e **SUBSTITUI** o custo do Feitiço |
| Melhorias | 2, e **3 a partir do ND 16**. Só o ND manda |
| Tipos | Dano (Doutrina), Auxiliar e Curativo (Manto), Universais em todos. Misturar é permitido |

**"LIBERAÇÕES EXPANDIDAS" FOI REMOVIDA** (Conjurador nível 8). Ela existia para dar VAGAS de
Liberação Máxima, e o suplemento acabou com a ideia de vaga. As três regras dela (Saída Adaptável,
Sincronia de Nível 16 e Versatilidade) passaram a valer para **toda** Liberação Máxima, sem
habilidade nenhuma destravando nada. O texto verbatim das três está no cabeçalho de
`afty-liberacoes.js`. Conjurador foi de 65 para 64, e o total de 361 para 360. Nenhum requisito
apontava para ela, então não sobrou referência órfã.

⚠ **O "+2 de Custo de Estabilização" foi REMOVIDO** pelo autor no mesmo dia, e com ele a tabela
deixou de ter número solto. Era 14 / 22 / 24 e virou **12 / 20 / 25**, que é exatamente o custo do
próximo nível: 12 é o Nível 4, 20 é o Nível 5, e **25 é a Técnica Máxima** (o texto da aptidão
homônima em `afty-aptidoes.js` diz *"Uma Técnica Máxima custa 25 PE"*). Antes disso o 24 do Nível 5
não saía de lugar nenhum, porque não existe custo de Nível 6.

Mesmo virando fórmula, a **tabela continua sendo a fonte**: derivar de `FEITICO_CUSTO_PE[n + 1]`
amarraria os dois arquivos e quebraria calado no dia em que um deles mudasse sozinho.

**Onde cada melhoria entra no pipeline** (foi o trabalho de verdade):

- **Sobrecarga Energética** entra em `calcularFeiticoDano` **antes das divisões** de Múltiplos
  Disparos e de Dano Contínuo (autor: *"Antes da divisão."*). Depois delas, ela entregaria o
  pacote inteiro em cada disparo.
- **Pressão Amaldiçoada** soma nos dois lados, e cada metade só entra onde a coisa existe: acerto
  onde há jogada de ataque, CD onde há CD. É isso que resolve o *"não dá pra se ter ambos os
  efeitos de CD e Acerto"* sem escolha nenhuma do jogador, porque um Feitiço nunca é os dois.
- **Estímulo de Saída** e **Explosão Extrema** entram em `calcularEfeitoAux`, por efeito. ⚠ O
  `prejuizoRolagem` é guardado NEGATIVO, e "aumentar a penalidade" é afastar de zero: somar cru
  transformaria um −6 em −4, ou seja, a melhoria ENFRAQUECERIA o Feitiço.
- **Duração Prolongada** soma rodadas **fora do divisor** da Duradoura (autor confirmou). Dentro
  dele, a melhoria diluiria o bônus e pioraria o Feitiço.
- **Vigor Absoluto** é parcela FIXA no total curado, e por isso a rolagem de cura ganhou `fixo`,
  o mesmo campo que o dano já usava.
- **Resiliência Energética** não vira número nenhum: é troca de vantagem por desvantagem, e sai
  como linha de regra.

**A UI continua sem recalcular regra.** `derived.feiticos.comLiberacao(id, melhorias)` é uma
FUNÇÃO exposta pelo derive: a aba Ações declara as melhorias e pede a versão liberada daquele
Feitiço de volta. A lista pré-calculada não tinha como conter a Liberação, porque a escolha é da
mesa e não da ficha. O estado é local e **não persiste**, pelo mesmo motivo do crítico pendente:
recarregar amanhã com a técnica sobrecarregada de ontem seria errado.

O controle aparece dentro da linha de Feitiço que já abria, como pastilhas por categoria, e o
texto verbatim de cada melhoria vai no `title`. A aba Ações é reusada pelo painel do combatente,
então o mestre ganhou o mesmo controle no Encontro sem uma linha a mais.

**Decisões do autor nesta leva** (perguntas 1 a 17): custo substitui, o limite de uma por Cena é
**só regra escrita** por ora, Técnica Máxima **ainda não** entra, Especiais e Passivos ficam para
depois, e a Explosão Extrema em Níveis de Dano é **+4 no Nv3 e +16 no Nv5 imediato** mesmo (foi
perguntado por ser uma ordem de grandeza acima das outras, e confirmado).

⚠ **LARGURA DE LINHA vai ter que existir.** A melhoria Área diz *"Linhas ganham o dobro de sua
Largura também"*, e o Afty guarda a área como um número só. Hoje dobra só o comprimento. Autor:
*"ANOTE ISSO, VAMOS PRECISAR DA LARGURA DA LINHA, pq eu esqueci disso."* Está em `a-fazer.md`.

### 🐛 TRÊS BUGS ACHADOS NA REVISÃO (2026-08-09), dois deles ANTIGOS

O autor pediu uma revisão de lógica e escrita por cima de tudo. Os três foram provados rodando o
código, e não por leitura.

**1. A ficha do Auxiliar lia campos de OUTRO calculador.** O bloco do Auxiliar em `fichaDoFeitico`
consultava `duracaoRodadas`, `sustentacaoPE`, `sustentacaoVida` e `notaExaustao`. Quem produz esses
quatro é o calculador da **Transformação**, e não o do Auxiliar. Eram `undefined` sempre, em
silêncio, e por isso:
- um Feitiço Auxiliar **Duradouro nunca mostrou as rodadas dele** na Ficha,
- um Feitiço Auxiliar **Sustentado nunca mostrou o upkeep** (o `upkeepPE` existe e valia 2),
- e a melhoria **Duração Prolongada calculava certo e não aparecia na tela** (4 rodadas virando 5
  no cálculo, e "4" nenhum na Ficha, porque a linha inteira não existia).

Os nomes certos do Auxiliar são `rodadas` e `upkeepPE`. ⚠ É o tipo de bug que passa despercebido
porque um `undefined` num `if` não quebra nada, só apaga a linha.

**2. A Transformação produzia os quatro campos e ninguém os lia.** A outra ponta do mesmo engano:
o bloco dos Especiais nunca consultou `duracaoRodadas`, `sustentacaoPE`, `sustentacaoVida` nem
`notaExaustao`, então **o upkeep e a exaustão de uma Transformação nunca apareceram na Ficha**. As
quatro linhas foram para o lugar certo.

**3. Penalidade diluída a zero virava BÔNUS PARA O INIMIGO** (bug meu, do mesmo dia). O Estímulo de
Saída decidia o sinal olhando o valor JÁ processado (`valor < 0 ? valor - bump : valor + bump`). Um
`prejuizoRolagem` que a divisão por rodadas ou por alvos tivesse levado a 0 perdia o sinal, e a
melhoria somava: uma penalidade de −4 dividida entre 5 alvos virava 0 e depois **+2**, ou seja, a
Liberação Máxima AJUDAVA o alvo. O sinal passou a sair do valor CRU da tabela (`bruto`), que não
tem como ser diluído.

### Sobre segurança, já que foi perguntado

A superfície é pequena e não achei nada explorável. O que foi conferido:
- **Não existe `eval` nem `new Function` em lugar nenhum.** O avaliador do DSL
  (`src/components/fm-dsl.js`) é um parser recursivo de verdade, com tokenizador próprio, então a
  expressão que o jogador escreve no Funcionamento Básico **não vira código**.
- **Não existe `dangerouslySetInnerHTML` nem `innerHTML`.** O `TextoRico` devolve NÓS do React, e
  não HTML, então marcação do autor não injeta tag.
- **O CSS do usuário é injetado sem filtro**, num `<style>` dentro da raiz da Ficha
  (`AftyFicha.jsx`). Isso é a funcionalidade, não um descuido: CSS não executa script. O que ele
  PODE fazer é buscar URL externa (`url(...)`, `@import`), o que vaza que a página foi aberta. Só
  vira problema no dia em que um tema for **importado de outra pessoa**, e hoje o tema não viaja na
  ficha, ele mora em chave própria do `localStorage`.
- **Nenhum caminho de poluição de protótipo.** Os `JSON.parse` do rascunho, da sessão, do tema e
  dos encontros passam por normalizadores que usam espalhamento, e espalhamento cria propriedade
  própria em vez de mexer no protótipo.

### 🐛 REVISÃO DE TRANSFORMAÇÃO E AUXILIARES (2026-08-09)

Segunda passada, pedida pelo autor. Mais três achados, todos provados rodando o código.

**4. A Transformação de Nível 1 nascia com dois avisos.** O efeito padrão de um slot era
`AUX_EFEITOS[0]` fixo, que é o Aumento de Defesa, e **a Defesa não existe no nível 0 de aux** (nem
na coluna Duradoura nem na Sustentada). Como a Transformação de Nível 1 tem os dois slots no nível
0, ela saía do forno com *"Aumento de Defesa não tem valor no Nível 0 de aux"* duas vezes, e o
triângulo de aviso acendia na Ficha por uma escolha que o jogador nunca fez. O padrão agora é o
primeiro efeito que TEM valor naquele nível (`efeitoPadraoTransf`).

**5. "0 de exaustão quando acabar."** A exaustão de uma Transformação Duradoura é metade do nível
para baixo, e no Nível 1 isso é ZERO. A nota era montada de qualquer jeito, virando uma linha de
tela que avisa que nada acontece. ⚠ Esse ficou VISÍVEL justamente por causa do conserto nº 2 desta
mesma sessão: enquanto a linha "Exaustão" não era lida por ninguém, o texto ruim não aparecia.

**6. `valorDuradoura` era código MORTO, com a conta duplicada.** A função exportada é a regra
canônica da Duradoura (valor da tabela ÷ (rodadas − ⌈nível/2⌉), piso), e a **única ocorrência dela
em todo o `src/` era a própria declaração**: `calcularEfeitoAux` reescrevia a mesma conta inline.
Duas cópias da mesma regra, e mexer na canônica não mudaria nada. Agora a inline chama a função,
com assert cobrindo toda a faixa de rodadas de todos os níveis.

⚠ A ponta dos DADOS continua com conta própria e **isso é de propósito**: lá existe piso de 1 dado
(`Math.max(1, ...)`), que a regra do valor numérico não tem.

**O que NÃO era bug**, e eu conferi: a base `TRANSFORMACAO_BASE` não é mutada entre chamadas, a
troca de nível respeita o teto de 5 e o mínimo de 1 efeito, o clamp de rodadas da Duradoura obedece
`faixaRodadasDuradoura` em todos os níveis, e a diluição de bônus entre alvos avisa quando zera.

**Pendência de REGRA achada aqui:** a Transformação aceita o **mesmo efeito repetido** em vários
slots (três Aumentos de Defesa passam sem aviso), enquanto Múltiplos Efeitos proíbe repetir e o
seletor de lá nem oferece o efeito já usado. As duas telas concedem conjuntos de efeitos
auxiliares, então a divergência parece descuido e não decisão. Está em `a-fazer.md`.

### 🐛 CODE REVIEW: seis correções, quatro delas de código antigo

Terceira passada, do `/code-review`. Doze achados, **todos confirmados** (seis rodando o motor, o
resto por leitura). Nenhum falso positivo. Estes seis foram consertados, na ordem de gravidade.

**7. `ef.aplicado` sumia em toda criatura que não fosse Média.** O pior da leva, e o mais quieto.
`resolverExclusivos` produz o campo `aplicado`, que é o placar do POOL EXCLUSIVO (quanto de cada
canal um estágio já entregou). O `mesclarEfeitos` montava o objeto de saída **sem esse campo**,
então mesclar um resultado já resolvido com outro apagava o placar.

Isso mordia porque o `deriveAfty` mescla a régua de TAMANHO **depois** do `resolverExclusivos`
(a régua depende do tamanho, que depende do canal, que só fecha com o estágio 2 pronto). Resultado:
saiu de Médio, perdeu o `aplicado`, e o `resolverEfeitosDanoFinal` dos Feitiços voltava a somar o
efeito exclusivo INTEIRO em vez do delta. **Dano de Feitiço maior só por ser Grande**, sem nada na
tela dizendo. Consertado no `mesclarEfeitos`, que é onde não volta a acontecer.

**8. A Ficha mentia a regra do Destrutivo e do Cataclísmico.** O `fichaDoFeitico` lia `f.acao`,
`f.resolucao` e `f.alvo` CRUS, e os dois subtipos ignoram o que o jogador marcou: são sempre área,
sempre Ritual Estendido e sempre teste de resistência. Um Destrutivo saía impresso como *"Ação
Comum, Jogada de Ataque"* e **sem a CD que o motor calculou**, porque a linha da CD estava atrás de
uma guarda que lia o campo cru. O Cataclísmico dizia *"Alvo: Único"* para um Feitiço que pega o
mapa. O calculador de Dano passou a devolver `acaoResultante`, `resolucao` e `alvo` efetivos, e a
guarda da CD saiu (quem decide se existe CD é o `temCD` do calculador, que já devolve `null`).
⚠ Contradizia o próprio cabeçalho da função, que promete que nada é recalculado ali.

**9. Duplicar um encontro zerava o PV e o PE de todo mundo.** `duplicarEncontro` chamava
`sessaoEmBranco(null)`, e sem `derived` a sessão não tem de onde tirar o máximo: 126 PV viravam 0.
A cópia abre em Planejando, onde o botão que reenche recursos nem existe. Autor decidiu (2026-08-09)
que a cópia **herda o estado atual**, dano tomado incluído, porque duplicar serve para ramificar uma
luta em andamento. As `flags` passaram a vir junto pelo mesmo motivo: PV em 0 com o abatido
desmarcado seria a cópia se contradizendo.

**10. Descansar Todos apagava o PV de quem não derivou.** `descansar(sessao, null)` fazia
`Math.max(0, null ?? 0)` e ZERAVA em vez de reencher. Bastava um combatente com ficha que o
`derivarCombatente` não conseguisse calcular. Consertado nas duas pontas: o redutor pula quem não
tem derivados, e a **própria `descansar` devolve a sessão intacta sem `derived`**, porque não dá
para reencher até um máximo que ninguém sabe qual é.

**11. Destrutivo e Cataclísmico contavam como alvo único na Liberação Máxima** (bug meu).
`ehMultiAlvo` e `melhoriaSemEfeito` liam `f.alvo` cru. A melhoria Área dobrava a área de 18m para
36m **e avisava "o Feitiço não tem área"**, e Alvos Adicionais era oferecida num Feitiço que já pega
todo mundo. Novo `temArea`, que sabe dos dois subtipos. ⚠ Com uma nuance que o review não pegou: o
Cataclísmico É área e mesmo assim a melhoria Área não rende, porque a área dele é o **mapa inteiro**
e dobrar o mapa não significa nada. Ele avisa isso, em vez de fingir que dobrou.

**12. Condição num Curativo é REMOÇÃO, e a ficha imprimia como aplicação** (bug meu, mais um vizinho
que o review não viu). A Duração Prolongada era aceita sem aviso num Curativo com condição e não
fazia nada. O review propôs expor `rodadasExtras` na cura, e **isso estaria errado**: a lista de
condições de um Curativo é o que ele REMOVE (autor confirmou), e removida não tem duração. Olhando
de perto, o laço de condições do `fichaDoFeitico` era compartilhado com o Dano e a ficha saía com:

```
Remove    = Atordoado
Condição  = Atordoado (1 rodada(s))
```

A mesma condição duas vezes, e a segunda lendo como se a CURA aplicasse Atordoado no alvo. O laço
agora pula o Curativo, e a melhoria avisa que não rende ali.

**O que ficou de fora desta leva** (menor gravidade, nada de número errado): buff de sessão
aparecendo em duplicata na aba Buffs, campo de iniciativa que não aceita negativo, o painel de
fontes escapando do tema no Encontro, e dois `useMemo` faltando (um deles meu, no `comLiberacao`).
Estão em `a-fazer.md`.

**O que eu discordei do review:** ele tratou a remoção de "Liberações Expandidas" como bug de
migração. Não é regressão: `resolveHabilidades` sempre descartou id desconhecido em silêncio, e
"Teste de Resistência Mestre" saiu em julho pelo mesmo caminho. É comportamento do catálogo, e vale
uma linha no `a-fazer.md`, não um conserto.

Verificação final: **129 asserts** de regra mais **29** de integração pelo `deriveAfty`,
`npx eslint src/systems/afty/` limpo e `npx vite build` limpo.

---

## SESSÃO DE 2026-08-08

### O Funcionamento Básico chegou à Ficha Final

O autor apontou o buraco: `core.tecnicaDescricao` existia no schema, tinha marcação desde
2026-08-07, e **não era exibido em lugar nenhum além do campo de edição**. Nem Preview, nem Ficha.
A formatação só se via pelo olhinho.

- O renderizador **mudou de casa**: saiu do `AftyCreatureBuilder.jsx` e virou
  `src/systems/afty/ui/TextoRico.jsx`, ao lado dos outros primitivos que criador e Ficha dividem.
  Duas cópias divergiriam na primeira marcação nova, e aí o jogador leria na mesa algo diferente do
  que o autor escreveu.
- **Cor por variável CSS, e não por classe do Tailwind.** O mesmo componente serve dois donos com
  paletas diferentes: o criador (slate + roxo, tela do app) e a Ficha (pintada por variável, com CSS
  do usuário por cima). Cada `var()` leva o tom do criador como fallback, então lá nada precisa ser
  declarado e na Ficha o tema manda.
- As classes `afty-tr`, `afty-tr-h1`, `afty-tr-h2`, `afty-tr-p`, `afty-tr-forte`, `afty-tr-tabela` e
  `afty-tr-tabela-caixa` entram no **contrato** de classes estáveis do CSS personalizado.
- Na Ficha, o texto é um cartão no topo da aba **Habilidades**, dobrável e **aberto por padrão** (é
  um só, e é o texto que descreve a criatura, ao contrário dos 40 itens do livro). Ele obedece ao
  filtro local da aba, casando contra o `textoPuro`, para um `**` no meio da palavra não esconder o
  acerto.
- ⚠ **Não virou um `ItemDeFicha`**, e a diferença importa: o item renderiza um `<p>` corrido e
  achataria título, subtítulo e tabela justamente onde a formatação foi pedida.
- ⚠ **CORRIGIDO no mesmo dia, em duas passadas.** O cartão saía com metade da largura. A causa era a
  classe `afty-texto` no container: ela carrega `max-width: 78ch`, a medida de leitura clássica.
  - **1ª passada:** tirei a classe do container e desci a medida para bloco (parágrafo e título com
    78ch, tabela sem nenhuma). Isso soltou a tabela, mas o texto continuou em metade da largura, e o
    autor apontou de novo.
  - **2ª passada:** a medida saiu de vez. **O `TextoRico` não declara `max-width` em lugar nenhum** —
    quem manda na largura é o container que o hospeda.
  - Se a linha longa incomodar num monitor largo, o conserto é **estreitar o cartão**, e não
    recolocar a medida no componente: o Funcionamento Básico tem tabela dentro, e tabela quer a
    largura toda.

### A prévia começa LIGADA

Pedido do autor: com texto escrito, o olhinho já vem ativado. Campo vazio começa desligado, porque
não há o que ver e a caixa de edição é o que ele precisa.

- Duas guardas evitam que o automático atropele o jogador: assim que ele clica no olho, a decisão
  dele passa a mandar (`decidiu`), e o ajuste **não age com o campo em foco** — sem isso, digitar a
  primeira letra num campo vazio atiraria a prévia por cima de quem está escrevendo.
- O ajuste continua vivo depois da montagem de propósito: o **rascunho automático** restaura a ficha
  sozinho, e importar um JSON também troca o valor com o campo já na tela. Sem isso o campo montaria
  vazio, com a prévia desligada, e ficaria assim mesmo depois de encher.

### A escada de dado das Armas Naturais virou Nível de Dano

Regra do autor (2026-08-08): *"a cada vez que o Dano subir, sobe +1 Nível. Isso vale para ambas e se
somam."*

Até aqui a escada de dado das duas aptidões era descartada, pela decisão de 2026-07-27 de que o dado
listado de arma nenhuma conta. **A regra do dado continua de pé** — o que mudou é que o DEGRAU dela
não se perde mais: cada subida do texto vale um Nível de Dano no Ataque Básico, que é onde a arma
natural bate.

- **Armas Naturais** (`mal_armas_naturais`): 1d8 → 1d10 no 5 → 1d12 no 9 → 2d10 no 13 → 2d12 no 17.
  Quatro subidas → `(nd>=5)+(nd>=9)+(nd>=13)+(nd>=17)`. A Fineza que ela já dava continua.
- **Armas Naturais Aprimoradas**: começa um degrau acima, porque *"o dano se torna 1d10"* já é uma
  subida a partir do 1d8, e daí sobe de novo no 5, 9, 13 e 17. Cinco subidas →
  `1 + (nd>=5)+(nd>=9)+(nd>=13)+(nd>=17)`.
- O `+1 nível de dano nos níveis 8, 12, 16 e 20` é OUTRA frase do texto e segue sendo outra linha.
  As três convivem, e cada uma leva `nome` próprio para o hover de fontes não repetir o mesmo rótulo
  com números diferentes.
- Resultado com as duas: +3 no ND 5, +6 no 9, +9 no 13, +12 no 17 e +13 no 20.

⚠ A anatomia `arma_natural` do Feto Híbrido (*"se o desarmado for maior, aumente-o em 1 nível"*)
**continua só texto**: o catálogo inteiro de `afty-anatomias.js` ainda é descritivo, e ligar uma
linha só dele deixaria o arquivo meio ligado e meio não.

### ABA DE ENCONTROS (nova, 2026-08-08)

Portada da 2.5.2 a pedido do autor: *"copie como funciona a da 2.5.2 e deixe adaptada para o Grimório
do Afty. Seguindo layout e derivados"*. Vive em `src/systems/afty/encontros/`, cinco arquivos:

| Arquivo | O que é | Espelha |
| --- | --- | --- |
| `afty-encontro.js` | modelo puro: status, lados, iniciativa, turnos, cópias, log | `fm-encounter.js` |
| `usar-encontros-afty.js` | a lista, em `localStorage` | `useEncounterManager.js` |
| `usar-encontro-afty.js` | redutor de um encontro | `useEncounter.js` |
| `AftyEncontros.jsx` | o painel com os cartões | `EncountersDashboard.jsx` |
| `AftyEncontro.jsx` | o rastreador (3 telas por status) | `EncounterTracker.jsx` |
| `PainelDeCombatente.jsx` | a ficha de combate do focado | `CombatantPanel.jsx` |

**A decisão que segura tudo: o estado de combate de um combatente É uma SESSÃO do Afty**
(`ficha/ficha-sessao.js`), e não o `combatState` da 2.5.2.

Isso não é economia de código. A Ficha Final já sabe aplicar dano com PV temporário comendo primeiro,
virar rodada expirando buffs e condições, e aparar os correntes quando a Alma muda o PV máximo. Um
`combatState` paralelo reimplementaria tudo isso e divergiria no primeiro ajuste de regra — e aí a
mesma criatura teria PV diferente conforme a tela em que o mestre a abriu.

A consequência boa: o painel do combatente **reusa as abas Ações, Perícias e Buffs da Ficha**, com os
mesmos números e os mesmos hovers de fonte. O que não é reusado é o cabeçalho, porque tema do
usuário, retrato e busca global não cabem numa coluna dividida com a lista de iniciativa.

**O combatente não guarda stats derivados**, ele guarda `ficha` e `sessao`. Quem quer número roda
`deriveAfty`, e isso acontece uma vez por combatente dentro de um `useMemo` amarrado ao encontro.

**Chave própria** (`afty_encontros_v1`), e não a `fm_encounters_afty_v1` que o `useEncounterManager`
usaria com namespace: duas formas de combatente na mesma chave é o tipo de coisa que só quebra meses
depois.

**A ficha entra CLONADA** no encontro, e por isso a sincronização de edição da 2.5.2 (o
`EncounterSyncModal`) **não roda no Afty**: uma edição no criador não pode mudar o número de uma luta
em andamento.

⚠ **Os ganchos de automação da 2.5.2 não vieram junto.** Lá o `useEncounter` dispara
`applyTriggeredEffects` a cada `turn_start` / `round_end`. No Afty um efeito de rodada já é resolvido
pelo `quando` a cada `deriveAfty`, e não existe pilha de gatilhos para disparar — copiar aqueles
ganchos criaria um segundo motor fantasma. A virada de rodada faz o que a Ficha faz: `proximaRodada`.

⚠ **A duração desce para TODOS na virada**, e não no turno de cada um como na 2.5.2. É o que a Ficha
já faz, e as duas telas precisam contar as mesmas rodadas: um buff de 3 rodadas não pode durar mais
na mesa do mestre do que na ficha do jogador.

**Ficaram de fora, de propósito:** arrastar-e-soltar para reordenar (`@dnd-kit`), seleção múltipla com
Shift e o medidor de armazenamento. Os três resolvem o problema de quem tem centenas de encontros, e
o Afty começa com zero.

**Pintura por variável CSS**, importando o `ficha.css` mais um `encontros.css` próprio. Arquivo
separado porque o `ficha.css` tem assert de contrato de tema, e a tela do mestre não aceita CSS do
usuário.

### "O que o Feitiço FAZ", e não só quanto ele rola

Autor, 2026-08-08: *"preciso conseguir ver o que meus Feitiços e derivados fazem, sem precisar ir na
aba de Edição para saber."*

A linha de Feitiço da Ficha mostrava **nome, nível, dados e custo** — quanto ele custa e quanto ele
rola, e nada do que ele faz. Alcance, área, ação, duração, condições anexadas e subtipo só existiam
dentro do criador, no formulário que os produziu.

- Novo **`fichaDoFeitico(f, calc)`** em `afty-feiticos.js`, que devolve `[{ rotulo, valor }]` por
  tipo de Feitiço. ⚠ **Nada é recalculado ali:** tudo sai do `calc` que o calculador do tipo já
  produziu, e o que não estiver lá simplesmente não vira linha. Recalcular seria uma segunda
  implementação da regra, envelhecendo à parte.
- ⚠ Devolve **dados, e não texto pronto**. Quem monta a frase é a tela, na mesma convenção das
  `partes` do detalhamento.
- O `resumoFeiticos` passou a carregar também **`descricao`** (a narrativa do autor) e
  **`conjuracao`**, que existiam no schema e não eram exibidas em lugar nenhum.
- A linha de Feitiço na aba Ações **ABRE**, com a ficha técnica em cima e o texto do autor embaixo,
  renderizado pelo `TextoRico` (mesma marcação do Funcionamento Básico). Sem nada para abrir, o nome
  não vira botão.
- Dois detalhes de leitura: o Auxiliar de **efeito único** não tem lista (`calc.efeitos` só existe em
  Múltiplos Efeitos), então o efeito é o próprio `calc`; e as regras em texto dos Especiais entram
  como **"Regra"**, porque a chave delas é interna (`aposAtaque`) e "AposAtaque" na tela é pior que
  rótulo nenhum.

### Encontros: aparência e as duas abas que faltavam

- **Habilidades e Equipamentos** entraram no painel do combatente. Com Ações, Perícias e Buffs só, o
  mestre tinha os NÚMEROS da criatura e nenhum dos TEXTOS: ler o que uma Aptidão faz exigia sair do
  encontro e abrir o criador. São as mesmas cinco abas da Ficha Final, menos Invocações.
- A barra de abas passou a ser **a da Ficha** (`afty-abas` / `afty-aba`), e não uma fileira de
  botões: é a mesma ferramenta, e duas gramáticas de aba na mesma sessão confundem quem alterna
  entre a tela do mestre e a do jogador.
- **Cor por lado** (`--afty-lado`), saindo de variáveis que a Ficha já tem: inimigo é o vermelho do
  PV, aliado é o verde da cura, jogador é o azul do PE. Um tema que troque a paleta leva os três
  junto. O lado é o que o mestre lê mais rápido numa fila de doze linhas, e estava só num chip de
  texto.
- A **barra de PV da fila** ganhou as duas faixas do vital da Ficha (âmbar abaixo da metade, vermelho
  abaixo de um quarto): a fila é onde se decide em quem bater.
- O turno ativo pulsa na borda esquerda. ⚠ **Lento (2,4s) e só na borda**, porque a fila fica na
  lateral a luta inteira e animação rápida no canto do olho cansa. Respeita `prefers-reduced-motion`.
- Cartão de encontro: faixa de status na borda **superior**, e não na esquerda — numa grade de três
  colunas a faixa lateral some entre os vizinhos. Contagem por lado em pastilhas coloridas, para o
  cartão dizer o tamanho da luta sem abrir.

### Tamanho virou DERIVADO, com régua de Atletismo e Furtividade

Regra do autor (2026-08-08): *"a Altura só pode ser maleável com Aptidões e poderes que mexam com
isso"*. Era um `<Select>` livre na aba Identidade, e o campo `core.tamanho` **não era lido por
ninguém** — a escolha não fazia nada.

- Toda criatura parte de **Médio**, e só o canal novo `tamanho` a tira de lá. Ele conta **degraus**,
  e não metros: +1 leva a Grande, +2 a Enorme, −1 a Pequeno. Apara em Minúsculo e Colossal, então
  pegar Crescimento Corporal já sendo Colossal não estoura a lista.
- A régua vem junto do degrau: Grande **+2 / −2**, Enorme **+5 / −5**, Colossal **+10 / −10**,
  Pequeno **−2 / +2**, Minúsculo **−5 / +5** (Atletismo / Furtividade).
- A régua entra como **efeito**, e não como número somado à mão, para o hover mostrar "Colossal −10"
  na linha da Furtividade em vez de um −10 sem dono.
- ⚠ **TERCEIRA lista de efeitos no derive**, pelo mesmo motivo do Domínio e do Estilo: a régua
  depende do tamanho e o tamanho depende do canal, que só fecha com o estágio 2 pronto. Resolver o
  tamanho primeiro e mesclar a régua depois quebra o laço, e é seguro porque a régua escreve num
  canal (`bonusPericia`) que nada do `tamanho` lê de volta.
- `desenvolvimento_exagerado` emite o degrau diretamente. O Crescimento Corporal ganhou aquisições
  próprias: uma no nível 5 e a segunda no 10, cada uma escolhendo Aumentar ou Diminuir. O bônus de
  PV continua uma vez só, e o teto próprio da Aptidão é Enorme; outras fontes ainda podem levar a
  Colossal.
- No criador o campo virou **leitura** com a régua ao lado, e não um Select desabilitado: campo
  cinza que não abre parece defeito. `core.tamanho` fica no schema como campo morto, só para não
  quebrar ficha antiga.
- Na Ficha, um chip no cabeçalho **só quando saiu de Médio**.

### A propriedade especial das Manoplas foi programada

*"Seu dano desarmado aumenta em 1 nível para cada 2 no seu modificador de força."* Estava sem efeito
nenhum. Novo mapa `ARMA_ESPECIAL_EFEITOS` em `afty-equipamentos.js`: a chave é o `especial` da arma,
e o valor é o que ela concede ao Motor **enquanto equipada**.

⚠ O mapa é curto de propósito, e vai continuar curto. Quase todo texto especial não é canal: a
Metralhadora dá um ataque de ação bônus, a Rede aplica Enredado, o Leque troca o tipo de dano. Entra
ali só o que é número somando num canal que já existe.

Piso em 0 (`max(0, piso(mod_forca / 2))`): Força ruim não TIRA nível, ela só não dá.

### Músculos Desenvolvidos SUBSTITUI a Destreza, e agora o detalhamento diz isso

O efeito era `{ canal: "defesa", expr: "max(0, mod_forca - mod_destreza)" }`, o truque da diferença.
O número saía certo, mas o hover mostrava **"Destreza +3"** e **"Músculos Desenvolvidos +2"** um
embaixo do outro, e lido de cima a baixo aquilo é uma soma dos dois atributos. O autor pegou.

- Canal novo **`defesaAtributo`**, o único do Motor com semântica de **troca**: ele não soma, ele diz
  qual atributo entra na fórmula da Defesa.
- Com mais de um concedido, vale o de **maior modificador**, porque a regra é sempre "você pode
  optar" e ninguém opta por piorar a própria Defesa.
- No detalhamento a linha da Destreza **some** e no lugar dela entra "Força (no lugar da Destreza)",
  com a habilidade logo abaixo marcada *substitui* em vez de um número.

### Buffs Temporários aparecem na aba Buffs

Um efeito com `duracao: "temporaria"` já entrava na conta desde sempre — o que faltava era
**aparecer**. Sem a lista, um +4 de Força temporário e um permanente eram o mesmo número, e o
jogador não tinha como saber qual dos dois ele perde no fim da cena.

- `duracao` passou a viajar nos `detalhes` do Motor (nos dois lugares que empurram detalhe: a soma
  comum e o fechamento do pool exclusivo).
- Nova seção **Temporários** na aba Buffs, entre os ad-hoc e as Condições: nome, origem, canal,
  valor e a marca *Suplantado* para quem perdeu o pool exclusivo.
- ⚠ É **só leitura**, e isso segue a assunção do Motor: efeito temporário fica sempre ligado na
  ficha. A seção não liga nem desliga nada, ela conta o que está ligado.
- Desduplica por (nome, canal, alvo, valor): o `ef` é a mescla de vários estágios, e um efeito que
  apareça em dois deles viraria duas linhas iguais na tela sem estar contando duas vezes.

### UX do cartão de Feitiço, e a regra do suplemento no hover

Autor, 2026-08-10, olhando o cartão da Mordida Dilacerante: *"o UX/Design disso precisa ser
melhorado urgente"*, e *"coloca a descrição nos efeitos de Liberação Máxima quando eu passar o mouse
em cima. Por ser suplemento, fica difícil acessar."*

**A mesma informação aparecia três vezes.** O cabeçalho do cartão dizia `(12 PE)`, a lista de
propriedades dizia `Liberação Máxima: 12 PE` e `Melhorias: Sobrecarga Energética`, e o controle
logo abaixo repetia as duas coisas. As duas propriedades saíram: o custo já está no cabeçalho e as
melhorias já estão ACESAS nas pastilhas. A coluna de propriedades é para o que o Feitiço FAZ, então
lá ficaram só `Ignora RD`, `Alvos Extras`, `Sem Upkeep` e as `Regra`, que são o que a Liberação
acrescenta e não cabia em propriedade nenhuma.

**O bloco virou irmão do Ritual.** Era um `<div>` solto com as categorias inline empurrando as
pastilhas, e o Ritual logo abaixo era um `<details>` com contador no resumo e barra à esquerda no
corpo. Dois controles irmãos no mesmo cartão com duas aparências diferentes fazem o jogador achar
que são coisas de natureza diferente. Agora é o mesmo `<details>`, com o mesmo
`Liberação Máxima  1/3 · 12 PE`, e **aberto por padrão só quando há melhoria ligada**: quem não usa a
mecânica vê uma linha discreta, quem já declarou vê o que declarou.

As categorias saíram de inline para a **própria linha**, acima das pastilhas delas. Inline, cada uma
empurrava as pastilhas para um recuo diferente e as três não alinhavam entre si.

**`Alcance: 0 metros` virou `Toque`.** O número cru fazia uma mordida corpo-a-corpo ler como Feitiço
sem alcance nenhum, em vez de Feitiço que precisa encostar.

### A DICA DE TEXTO, e por que ela não fere a regra de UI

⚠ **Isto NÃO contradiz "nada de texto explicativo na UI".** A regra sempre teve a saída de que
explicação de ITEM vive no hover. O que mudou foi o VEÍCULO: era o `title` nativo, que demora quase
um segundo para nascer, some ao mexer o mouse, não abre no teclado e não existe no toque. Para um
catálogo de suplemento, que é justamente o texto que ninguém tem na mão, isso é o mesmo que não ter.

Novo `DicaDeTexto` em `ui/fontes.jsx`: nome da melhoria, descrição verbatim e a nota (a exceção,
separada por uma linha, ou ela some no meio do texto).

⚠ Ele **ENVOLVE** o gatilho em vez de virar o gatilho. A pastilha já é um botão com ação própria
(ligar e desligar), e botão dentro de botão é HTML inválido. O `<span>` de fora escuta ponteiro e
foco, o botão de dentro segue clicando. No dedo, o **toque longo** abre a regra e o `onClickCapture`
engole o clique que vem junto, senão ler a regra ligaria a melhoria sem querer.

**Nada disso foi escrito duas vezes.** O portal, o posicionamento e o fechar-no-Escape já existiam
no painel de fontes, então saíram de lá para uma `MolduraFlutuante` e um hook `useFlutuante`, usados
pelos dois. ⚠ O eslint reprovou a primeira versão do hook: ele devolvia os `ref` do toque longo para
quem chamava mutar, e mutar valor devolvido por hook é proibido. O gesto inteiro (`segurarComeca`,
`segurarTermina`, `consumiuToqueLongo`) mudou-se para dentro do hook, o que de quebra apagou a
segunda cópia da lógica.

### MERGE: Conjuração em Ritual encontra a Liberação Máxima

O GoliasK subiu dois commits com a **Conjuração em Ritual** enquanto a Liberação Máxima ainda
estava na árvore, sem commit. Os dois suplementos mexem nos mesmos calculadores, então a mescla teve
**decisão de regra**, e não só de texto. Os quatro conflitos foram em `afty-derive.js`,
`afty-feiticos.js`, `AbaAcoes.jsx` e neste doc.

**A camada de exibição dele SUBSTITUIU a minha.** O `fichaDoFeitico` (que devolvia
`{ rotulo, valor }`) virou `propriedadesResumoFeitico` (`{ id, nome, valor }`), e a `AbaAcoes` já
consome `f.propriedades`. Adotei a dele inteira, porque é a versão commitada e a que a UI usa.

⚠ **Convergência**: ele tinha resolvido sozinho três das coisas que eu tinha consertado no dia
anterior. O `alvoResumoFeitico` já tratava Destrutivo e Cataclísmico como área, o `areaResumoFeitico`
já escrevia **"Mapa inteiro"** (a mesma frase que eu escolhi) e a CD já não tinha a guarda errada de
resolução. Duas cabeças chegaram na mesma solução com um dia de diferença.

⚠ **Mas três correções minhas se perderam junto com a função apagada, e voltaram**: a Resolução
efetiva (o Destrutivo marcado como ataque ainda imprimia "Jogada de Ataque"), o **upkeep do Auxiliar
e da Transformação** (o `propriedadesResumoFeitico` só mostrava a sustentação do Dano Contínuo) e a
**duração das Condições aplicadas**, que é justamente o que a melhoria Duração Prolongada modifica.
Sem esta última, a melhoria calculava certo e não aparecia em lugar nenhum.

**As três decisões de composição** (nenhum dos dois textos fala do outro, então são ASSUNÇÕES,
anotadas em `a-fazer.md`):

| Número | Ritual | Liberação | Ordem escolhida |
|---|---|---|---|
| Área | soma metros (1,5 ou 4,5 por escolha) | dobra | dobra primeiro, soma depois |
| Alcance | soma metros | multiplica | multiplica primeiro, soma depois |
| CD e Acerto | soma | soma | somam juntos, sem ordem |

O critério do "multiplica antes, soma depois" é que os metros do Ritual estão escritos em ABSOLUTO
no texto dele. Somar antes faria a Liberação dobrar também o bônus do Ritual, e aí os números
impressos na regra dele deixariam de bater com o que aparece na tela.

**Um buraco que a mescla criou e foi fechado:** o teste de Conjuração em Ritual é aplicado DEPOIS do
`resumoFeiticos` (ele depende da perícia de Prestidigitação, que só fecha no fim do derive). O
`comLiberacao`, que refaz UM Feitiço com as melhorias declaradas na mesa, pulava esse enriquecimento.
Um Feitiço que fosse Ritual E Liberação Máxima voltaria da mesa **sem o teste de ritual**, ou seja, o
jogador perderia a rolagem por ter declarado a Liberação. O enriquecimento virou a função
`comTesteDeRitual`, usada pelos dois caminhos.

Na tela, o cartão de Liberação Máxima fica **acima** dos controles de Ritual dentro da linha do
Feitiço: a Liberação é o que SAI e o Ritual é COMO se conjura, e a ordem segue a da mesa.

Verificação da mescla: 129 asserts de regra e 29 de integração passando (os de exibição foram
reescritos para a camada nova), os 6 achados do code review seguem sem reproduzir, `npx eslint
src/systems/afty/` limpo e `npx vite build` limpo.

---

## SESSÃO DE 2026-08-07

### Dano de Feitiço ligado ao Motor e Explosão Encadeada

- `calcularFeiticoDano` passou a consumir `dadosDano` e `danoBonus` do Motor. Os efeitos podem
  valer para todas as fontes, para todos os Feitiços de Dano com alvo `feitico`, ou para uma
  entrada específica com alvo `feitico:<id>`.
- A habilidade `cnj_explosao_encadeada` marca somente a notação dos dados com `!`, antes da parcela
  fixa. Exemplo: `27d12!+52`. O rolador estruturado continua recebendo a mesma quantidade de dados,
  sem executar uma segunda rolagem dentro do Afty.
- A notação com `!` aparece no criador, no resumo derivado, na aba Ações e na fórmula registrada
  no histórico da ficha final.

### Passivo / Característica configurável

- O tipo antigo `passivo` agora aparece como **Passivo / Característica** e possui o mesmo editor
  livre do Motor usado pelo Funcionamento Básico: canal, alvo, expressão, duração e condição.
- O alvo de fonte de dano oferece todos os Feitiços de Dano, cada Feitiço criado separadamente e as
  linhas normais de dano da criatura.
- Os efeitos gravados em `feitico.efeitosPassivo` entram no Motor pela família exclusiva
  `feiticoAuxiliarPassivo`, preservando a regra do maior bônus entre as cinco fontes do pool.
- Na ficha final, estas entradas aparecem em **Passivos e Características**, dentro de Habilidades.
  Elas não aparecem em Ações.

### Quantidade final de dados no Motor

- A variável de linha `dados_dano_final` pode ser usada nos canais `danoBonus` e `dadosDano`. Ela é
  avaliada depois que cada ataque físico ou Feitiço fecha sua quantidade de dados comum.
- No canal `dadosDano`, a avaliação é uma passagem tardia única. A variável lê a quantidade anterior
  ao próprio efeito, o resultado é acrescentado uma vez e não é reavaliado sobre o novo total.
- Um Passivo / Característica com alvo `feitico:<id>` mostra no editor o valor calculado para aquele
  Feitiço. O alvo geral `feitico` não mostra uma prévia numérica, pois cada Feitiço pode possuir uma
  quantidade diferente de dados.
- Em Múltiplos Disparos, a variável representa os dados de cada disparo.

### Fora desta etapa

- A ativação do Funcionamento Básico na ficha final não foi alterada.
- Habilidades de Conjurador que dependem da quantidade de criaturas atingidas ou dos resultados
  dos dados continuam exigindo estado de uso.

### Pendências de Conjurador identificadas nos testes

- ~~**Foco Amaldiçoado: Destruição**~~ ✅ **Feito para Feitiços de Dano em 2026-08-09.** A parte de
  Aptidões Amaldiçoadas continua sem consumidor de dano estruturado.
- ~~**Potência Concentrada**~~ ✅ **Feito em 2026-08-09.** Estado de uma vez por rodada, consumido
  pela primeira rolagem do próximo Feitiço de Dano de alvo único.
- ~~**Ciclagem Maldita**~~ ✅ **Feito em 2026-08-09.** A ficha acompanha a primeira rolagem do último
  Feitiço de Dano e aplica `piso(maestria / 2)` dados ao alternar para outro.
- **Rituais e Aprimoramento de Rituais:** ainda não estão ligados ao funcionamento dos Feitiços.
- **Destruição Ampla:** não possui forma de informar a quantidade de criaturas afetadas e ativar o
  dano adicional.
- **Destruição Focada:** não possui forma de ativar seus efeitos no Feitiço de alvo único.

### Treino de Manejo de Arma e Manejo Especial

Duas frentes que dependiam do sistema de armas e ficaram esperando desde a transcrição.

**Canal novo `acertoArma`** (alvo `fonteDano`). O `bonusAcerto` mira a JOGADA de ataque inteira
(Corpo a Corpo, A Distância, Amaldiçoado), então "bônus com a arma escolhida" vazava para todas as
armas da mesma categoria. O canal novo soma na LINHA DE DANO, que é onde cada arma fecha o Acerto
dela, e aceita os escopos de arma (`arma`, `grupo:espada`, `prop:pesada`). Mesmo nome do
pseudo-canal dos encantamentos, que resolve antes do Motor e chega como `acertoGrau`.

**Treino de Manejo de Arma:** o alvo deixou de ser texto livre e passou a ser uma arma do
INVENTÁRIO, pela mesma chave da Arma Dedicada (o id do catálogo, não o `uid` da entrada).

- 1ª etapa → `danoBonus` +2 na arma. Treino POR ARMA não existe na ficha de criatura (o de ataque é
  por categoria e é de graça, sem gastar vaga), então o ramo "caso já seja" é o único que sobra e a
  etapa vale sempre (autor, 2026-08-07).
- 2ª etapa → `acertoArma` +1 na arma.
- 3ª etapa → **sem canal**: efeito de crítico por grupo de arma não existe como sistema, igual ao
  crítico de pugilato do Treino de Luta Completo.
- 4ª etapa → `acertoArma` +1 e `danoBonus` +2 na arma.
- Completo → uma **vaga LIVRE de encantamento** naquela arma. Livre significa que o encantamento
  posto nela NÃO desce o grau de cálculo (autor, 2026-08-07), então a arma não perde Acerto nem
  Dano Fixo do Grau. Sai por `vagasEncantamentoDeTreino`, que não é canal de Motor: o que ela mexe é
  o `permitidos` do `resolveFerramenta`, resolvido antes de o Motor existir.

**Manejo Especial (Combatente 6°):** ganhou escolha aninhada com o catálogo de Encantamentos de
Arma como pool ("propriedade de ferramenta amaldiçoada" é um Encantamento). O pool fica no card da
habilidade, e não na linha de dano como na Arma Dedicada, porque a escolha aqui NÃO é de uma arma:
vale para todas as equipadas.

- O encantamento é **concedido**: não entra no `fa.encantamentos`, não consome vaga e não desce o
  grau de cálculo.
- Vale para arma SEM Ferramenta Amaldiçoada também, e nesse caso o `grau` da expressão é 0.
- O "se possível" do texto é o pré-requisito conferido ARMA A ARMA (Afiada não pega num martelo,
  Cano Alongado não pega num corpo a corpo, Poderosa só onde já houver Cruel), mais a exclusão
  mútua. A arma que não atende simplesmente não recebe, sem aviso.
- A arma que já COMPROU aquele encantamento não o ganha de novo.
- Efeito que mira o ITEM (dano, crítico, acerto daquela arma) entra uma vez por arma. Efeito do
  PORTADOR (Canalizadora +2 CD, Balanceada +2 manobras, Otimizada +2 iniciativa) entra UMA VEZ SÓ:
  a propriedade é uma, e manejar três armas não a triplica.

**Fica de fora, e é dívida antiga:** encantamento com `alvoItem` numa arma do grupo pugilato
(Faixas, Manoplas, Soco Inglês) é perdido. Elas não viram linha de dano própria, são o Ataque
Básico, e o alvo `arm_manoplas` não existe em escopo nenhum. Vale para o caminho comprado também,
não só para o Manejo Especial.

**Ficha legada:** um Treino de Manejo de Arma gravado com o alvo em texto ("Katana" digitado à mão)
continua aparecendo na aba de Interlúdios com o texto dele e sem conceder nada, até ser apagado e
refeito apontando para a arma. Não quebra e não some.

### Novo Estilo da Sombra (Sem Técnica)

Sistema novo em `afty-estilo-sombras.js`, card `EstiloSombrasCard` na aba Habilidades. Substituiu o
`SubsistemaPendente` que estava lá desde o começo. Sobrou só um placeholder: as Habilidades
Marciais do Restringido.

**Porta de entrada:** ND 4, junto do Domínio Simples (`ESTILO_ND_MINIMO`). Abaixo disso o card
aparece TRANCADO, e não escondido.

**Orçamento (autor, 2026-08-07):** *"Consome o Contador de Habilidades. E Talentos e coisas do
gênero que aumentam isso, fazem que nem Afinidade com Técnica com Feitiços, e só aumentam o
contador de habilidades para Estilos."* Ou seja, a Técnica de Estilo **é um Feitiço** para efeito de
orçamento: gasta o contador único da aba e consome primeiro as vagas exclusivas do canal
`vagasFeitico`. O `orcamentoHabilidades` ganhou o campo `estilos`, ao lado de `feiticos`.

⚠ **Consequência assumida:** a progressão por ND do livro ("duas no 4°, mais uma nos 7, 10, 13, 16,
19 e a cada 3 depois") NÃO virou orçamento. Teve o mesmo destino que a progressão por ND dos
Feitiços, substituída pelo contador único em 2026-07-27. Do texto sobra o ND 4 como porta.

⚠⚠ **O MODELO DESTA SEÇÃO MORREU EM 2026-08-10.** A "Modificação-recipiente" descrita daqui até o
fim do bloco estava invertida, e o autor a derrubou. Leia a **SESSÃO DE 2026-08-10 (parte 3)**, no
topo do doc, e trate o que segue como histórico. O que continua valendo é a porta de entrada
(ND 4), o orçamento acima, o pool exclusivo `estiloSombra` e as fórmulas de cada efeito.

**Dois tipos de Técnica de Estilo:**

| Tipo | O que é |
|---|---|
| `modificacao` | ❌ **MORTO.** Modificação do Domínio Simples. Tabela FECHADA de 5 efeitos, orçada pelo Nível de Aptidão em Domínio. Virou `tabela`, uma Técnica por efeito. |
| `especial` | Texto livre mais o Motor completo. ❌ O "Passiva/Ativa por linha" morreu junto: tudo depende do Domínio Simples imbuído. |

**A tabela, e o que cada linha liga** (as fórmulas seguem valendo):

| Efeito | Canal | Repetição |
|---|---|---|
| Ataque com Gatilho | **nenhum** (ataque extra por rodada não é stat de ficha) | +1 ataque |
| Aumento de Defesa | `defesa` = `piso(maestria / 2)` | máx. 2, e a 2ª estende aos aliados sem somar na sua Defesa |
| Bônus de Acerto | `bonusAcerto` = `piso(maestria / 2) * n` | +metade da Maestria por vez (autor, 2026-08-07: o livro só diz "aumentando o bônus") |
| Dano Adicional | `nivelDano` = `2 * n` | +2 níveis por vez |
| Efeito Especial | Motor livre | ❌ **SAIU DA TABELA em 2026-08-10**: era a Técnica de Estilo Especial escrita duas vezes |

⚠ Desde 2026-08-10 o `n` das duas fórmulas não é número, e sim a **variável do DSL** que guarda
quantas vezes a Técnica está imbuída.

⚠ A repetição vira **uma linha com o valor já multiplicado**, e não N linhas iguais. N linhas
cairiam na mesma chave do pool exclusivo e só a maior valeria, comendo as repetições pagas.

**Pool exclusivo:** nasceu a SEXTA família, `estiloSombra` (autor, 2026-08-07). O Estilo é o Feitiço
Auxiliar do Sem Técnica: sem entrar no pool, seria a única origem cujo bônus escrito à mão soma por
cima de tudo. Vale para os dois tipos, inclusive os efeitos de tabela. Testado: duas Modificações
com Aumento de Defesa rendem um só, e o Estilo disputa de igual para igual com a Habilidade Única.

**Bancada:** ❌ cada Modificação ganhava um interruptor próprio nos `estadosExtras`. Desde
2026-08-10 é **um bool para o Domínio Simples inteiro, mais uma FAIXA de imbuição por Técnica
conhecida**.

**Ficha Final:** grupo próprio "Técnicas de Estilo" na aba Habilidades, entre Passivos e Talentos.
Sai do resolvido, não da ficha crua: quem perdeu o acesso não vê a Técnica na tela de jogo.

**Fica no texto, sem canal:** Ataque com Gatilho (quantidade de ataques), a extensão do Aumento de
Defesa aos aliados (efeito no outro não tem canal) e tudo que a Técnica Especial descrever fora do
Motor.

### Aptidão CONCEDIDA por nome, e o Domínio Simples que faltava

Relatado pelo autor logo depois: *"A Origem Sem Técnica não está fornecendo a Aptidão Domínio
Simples."* Estava certo, e eram **três** travas ao mesmo tempo:

1. `sem_tecnica` não tinha `vagasAptidao` nenhuma em `ORIGEM_EFEITOS`, então o orçamento de Aptidões
   do Sem Técnica era **zero** e marcar qualquer uma já mostrava `1 / 0` em vermelho.
2. O Domínio Simples pede **BAR 1 e Nível 5**, e a origem o entrega no **Nível 4** sem exigir
   Barreira nenhuma. O `AptidaoCard` travava o botão.
3. Não existia caminho para conceder uma aptidão **por nome**. A convenção até aqui era sempre vaga
   (`vagasAptidao`) mais escolha do jogador, o que não serve para uma regra que nomeia a aptidão.

**Caminho novo: `concedeAptidoes` na característica de origem.**

```js
concedeAptidoes: [{ id: "dominio_simples", ndMin: 4 }]
```

Resolvido por `aptidoesConcedidasPelaOrigem(creature, nd)`, que varre `caracteristicasEfetivas`.
A aptidão concedida:

- entra na ficha sozinha, marcada e **travada** (não dá para desmarcar);
- **ignora os pré-requisitos dela mesma**, porque quem concede pelo nome não está qualificando a
  criatura, está dando;
- **não gasta orçamento**. O contador da aba passou a medir só o que foi escolhido à mão, e a
  concedida aparece ao lado como `+1` em verde, mesma leitura da faixa concedida em Perícias;
- **conta para os requisitos de terceiros**. Testado: ela satisfaz o requisito cruzado de Anular
  Técnica, que pede Domínio Simples.

⚠ **Fora do Motor**, e pelo mesmo motivo do `resolveOrigemAttrBonus`: a lista de aptidões precisa
estar fechada ANTES de `coletarEfeitosAptidao` rodar, e um canal chegaria tarde demais, deixando a
aptidão na ficha sem os efeitos dela.

**Efeito colateral bom:** o `deriveAfty` lia `creature.aptidoesAmaldicoadas` cru em **oito** lugares
(Motor, Expansão de Domínio, Cura, bancada, `tem_*` do DSL, Feitiços, Preview). Todos passaram a ler
um `aptidoesIds` único, resolvido uma vez no topo, com a trava do `semEnergia` já aplicada. Antes,
qualquer leitor novo que esquecesse o `semEnergia` daria aptidão a um Restringido em silêncio.

O Gêmeo que copiar o Empenho Implacável em Verdadeiras Origens leva a concessão junto, porque
`caracteristicaCopiada` já entra em `caracteristicasEfetivas`.

### Texto rico no Funcionamento Básico

Sistema novo em `afty-texto-rico.js`, ligado no campo Funcionamento Básico. O autor está escrevendo
um texto longo e pediu formatação para *"destacar os Títulos deixando eles em Negrito para me
achar"*, mais tabelas.

**Marcação, e não editor rico.** Um `contentEditable` guardaria HTML na ficha, e a ficha viaja:
localStorage, JSON de exportação e Ficha Final (que ainda aceita CSS do usuário). HTML gravado seria
uma porta de injeção em três lugares de uma vez. Com marcação o campo continua sendo uma `string`,
as fichas antigas seguem válidas, e o renderizador devolve **nós React**, nunca
`dangerouslySetInnerHTML`.

Sintaxe (subconjunto do Markdown):

| Marcação | Resultado |
|---|---|
| `**x**` `*x*` `__x__` `~~x~~` | negrito, itálico, sublinhado, riscado |
| `# x` / `## x` | título e subtítulo, no começo da linha |
| `\| a \| b \|` + `\| --- \| --- \|` | tabela, com `:---:` e `---:` para alinhar |
| `\*` e `\|` | o caractere literal |

Barra com **B I U S · H1 H2 Tabela · 👁**, mais `Ctrl+B/I/U`. Os botões escrevem a marcação e
devolvem o cursor ao lugar, e clicar de novo DESFAZ. O olho alterna entre editar e ver formatado.

**Três decisões que evitam falso positivo:**

1. **O escopo de um marcador é a LINHA.** Um `*` solto não pode italizar meio documento até achar
   outro cinco linhas abaixo, então `dano 3 * 4 por turno` sai intacto.
2. **Título só vale no COMEÇO da linha.** `gasta 3 # de energia` é texto.
3. **Tabela exige a linha separadora** logo abaixo do cabeçalho. Sem ela, `Reação | Ação Bônus`
   segue sendo uma frase.

⚠ O modelo do parser é de **blocos** (`vazio`, `titulo`, `texto`, `tabela`), e não de linhas soltas:
tabela ocupa várias linhas de origem e vira um elemento só.

⚠ **O Funcionamento Básico não é exibido em lugar nenhum além do editor.** `tecnicaDescricao` só
existe no schema e nesse campo: não aparece no Preview nem na Ficha Final. A formatação, hoje, só se
vê pelo botão de prévia. Levar o texto para a Ficha Final é o passo que fecha isto, e o
`TextoRico`/`parseTextoRico` já estão prontos para ser reusados lá.

⚠ **CANCELADO a pedido do autor:** trocar o `textarea` por uma superfície que mostre o negrito
enquanto se digita. As duas saídas eram um overlay (quebra, porque negrito muda a largura do glifo e
o cursor sai do lugar) ou `contentEditable` (cursor, colar e desfazer viram código nosso). O botão
de prévia resolveu o caso de uso.

---

## 🆕 PENDÊNCIAS DE UI E IMPLEMENTAÇÃO (2026-08-06)

1. **RD Física — concluído em 2026-08-06:** o preview e a ficha final encaminham `rdFisico` para o
   mesmo componente de fontes dos demais valores derivados. O hover agora lista as parcelas que
   compõem a RD Física.
2. **Motor de Automação de efeitos especiais — concluído em 2026-08-06:** cada efeito usa a mesma
   grade responsiva para canal, alvo, expressão, modo e remoção. Quando o canal não pede alvo, a
   coluna continua reservada no desktop, mantendo efeitos diferentes alinhados entre si.
3. **Alma Livre — concluído em 2026-08-06:** disponível a partir do ND 10. Ao escolher o Talento,
   a ficha pede uma Especialização diferente das Especializações atuais e não oferece Restringido.
   A Especialização escolhida ganha uma aba própria, onde é possível comprar uma única Habilidade
   usando uma vaga normal. O Talento não concede a Habilidade. Para o acesso e os efeitos da
   Habilidade comprada, o nível efetivo da Especialização é o ND, sem alterar os níveis reais usados
   pela multiclasse ou pelos Níveis Lendários.
4. **Imagem do personagem na ficha final — concluído em 2026-08-06:** quando existe imagem, a ficha
   final mostra um portrait vertical na lateral direita do cabeçalho em telas de tablet e desktop,
   usando o mesmo ponto focal configurado no criador. O portrait sai no modo compacto e não ocupa o
   cabeçalho do celular.
5. **Modificador de Força — concluído em 2026-08-06:** expressões da Habilidade Única de equipamento
   são reavaliadas depois do fechamento dos atributos. Assim, `mod_forca` usa o modificador final da
   criatura, preservando no mesmo contexto as variáveis próprias do item, como `grau`.
6. **Conjuração Aprimorada no Dano de Habilidade — concluído em 2026-08-06:** toda criatura recebe
   gratuitamente o bônus nos Feitiços de Dano. O cálculo usa o modificador do Atributo da Técnica e
   o ND como nível de personagem. A fórmula aparece no criador e a ficha final rola os dados com o
   bônus fixo. O cálculo é por alvo. Em Dano Contínuo contra o mesmo alvo, o bônus entra apenas no
   golpe inicial.

   > Todos podem utilizar Feitiços, mas você consegue os aprimorar e extrair um maior potencial.
   > Sempre que utilizar um Feitiço que cause dano, você soma um bônus ao total de dano causado
   > baseado no nível do Feitiço, de acordo com a tabela abaixo. Além disso, você passa a receber
   > novos Feitiços em todo nível, ao invés de apenas nos níveis pares.
   >
   > Nível da Habilidade · Bônus de Dano
   > • Nível 1: Modificador de Atributo
   > • Nível 2: Modificador de Atributo
   > • Nível 3: Dobro do Modificador de Atributo
   > • Nível 4: 2x Mod. de Atributo + Nível de Personagem
   > • Nível 5: 2x Mod. de Atributo + 2x Nível de Personagem
   > • Técnica Máxima: 3x Mod. de Atributo + 3x Nível de Personagem
7. **Regeneração Corporal de Maldição e Energia Reversa — concluído em 2026-08-06:** o seletor da
   ficha final agora mostra o gasto real de PE ou PER, e a fórmula, o hover de fontes e o histórico
   acompanham a quantidade selecionada. Regeneração Corporal avança em blocos de 2 PE. O bônus por
   dado também é recalculado para o gasto atual, respeitando seu teto, em vez de usar o gasto máximo.

---

## 🎯 PENDÊNCIAS DE ESPECIALIZAÇÕES (lista de retomada)

Fechada em 2026-07-22, quando as 6 especializações e os Talentos foram transcritos. **Tudo aqui
está anotado mas NÃO feito.** Cada seção por especialização, mais abaixo no doc, tem o detalhe.

### A. Conteúdo que o autor ainda não mandou
| O quê | Onde é citado | Por que trava |
|---|---|---|
| **Arsenal Amaldiçoado** | *Restrito pelos Céus* (Restringido base 1) | Equipamento do Restringido a partir do 2° nível |
| **Estilo Marcial** + técnicas marciais | *Restrito pelos Céus* e *Desenvolver Ideias* (Restringido 4°) | *Desenvolver Ideias* concede "duas técnicas marciais" que não existem |
| **Combatente · 20° por nível** | — | A Base *Autossuficiente* é 20°, mas não se sabe se há por-nível de 20° |
| **Descrições das Perícias** | `afty-pericias.js` | Só a tabela veio (nome, atributo). Os TRs já têm descrição |

### B. Perguntas de ERRATA (o autor decide, é rápido)
1. **`lut_poder_corporal`** (Lutador 6°) teve o **cabeçalho comido pelo PDF**. Nome deduzido do
   pré-requisito de *Punhos Letais*. Confirmar.
2. **`tal_tecnicas_ofensivas_de_escudo`** (Talento): mesmo caso, nome deduzido do irmão
   *Técnicas Defensivas de Escudo*. Confirmar.
3. **"Técnica Precisa" não existe** (*Mira Aperfeiçoada*, Conjurador 8°). A do pool é
   **Feitiço Preciso**. Mesma coisa?
4. **"Técnica Rápida" não existe** (*Adepto de Feitiçaria*, Talento). A do pool é
   **Feitiço Rápido**. Mesma coisa? (3 e 4 parecem o mesmo deslize Técnica/Feitiço.)
5. **"Dominância em Habilidade" não existe** (pré-req de *Manipulação Perfeita*, Conjurador 16°).
   A de 6° é **Dominância em Feitiço**. Já apontei para ela.
6. ***Dominância em Feitiço*** arredonda para **CIMA**. Exceção à regra geral (floor). Confirmar.
7. **Suporte níveis 6 e 8**: as duas Bases que são **concessão pura** (Energia Reversa e Liberação
   de Energia Reversa) **custam vaga de orçamento ou vêm de graça?** As duas regras do projeto se
   chocam: alvo NOMEADO = grátis, mas toda Base no Afty gasta vaga.
8. **"Lacaio" não existe no Afty** (*Motivação pelo Triunfo*, Suporte 8°). Patamares são
   Comum/Desafio/Calamidade/Beyond. O que vale no lugar?
9. **"2 PE" e "1 PE" num Restringido sem PE** (*Ação Ágil* 4° e *Adrenalina Absoluta* 12°). O
   recurso da classe é Estamina. Trocar?
10. ***Teste de Resistência Mestre* do Restringido difere das outras 5** ("mestre nos DOIS TRs").
    Intencional?
11. ***Valorizar Invocação*** (Restringido 2°) depende de **domar maldições**, declarado FORA DE
    ESCOPO em 2026-07-17. Manter como texto morto?

### C. Decisões de MODELO (mudam código, precisam de definição antes)
| # | Assunto | Onde aparece |
|---|---|---|
| C1 | **Roubo de Habilidade: filtro de energia.** As 127 opções são as estruturalmente elegíveis. O "não dependa de energia amaldiçoada" não está aplicado. Caminho: marcar `usaEnergia: true` nas ~141 de Combatente e Lutador que gastam PE. | Restringido 2° |
| C2 | **`nivelMin` de escolha aninhada NÃO bloqueia.** Hoje um Restringido 2 rouba habilidade de 16°. Vale também para as 3 últimas Posturas de Combate. | Roubo, Posturas |
| C3 | **"Modificador de Int OU Sab" (e Presença ou Sabedoria).** O jogador escolhe qual usar. NÃO é o `atributoOr` existente (aquele é requisito). Vira estado na ficha ou convenção "usa o maior"? | ~10 no Conjurador, vários no Suporte e Lutador |
| C4 | **Repetível que concede NÍVEL DE TRILHA à escolha (6 casos).** *Aptidões de Combate*, *Aptidões de Luta*, *Aptidões de Suporte*, *Elevar Aptidão*, *Aptidão Desenvolvida*, *Estudo Amaldiçoado*. Todas orçamento, não concessão direcionada. **Resolver os 6 de uma vez.** | 4 especializações + 2 talentos |
| C5 | **Repetível sem pool próprio — parcialmente resolvido.** *Crescimento Corporal* já usa ids repetidos + `aptidaoOpcoesRepetidas`. Continuam *Nova Habilidade* (ilimitado), *Respeito Celeste* (2x) e *Incremento de Atributo*. | Conjurador, Restringido, Talentos |
| C6 | **Escolha aninhada de ATRIBUTO** (eleva valor, às vezes o limite): *Incremento de Atributo*, *Quebra de Limites*, *Pináculo Físico*. Mesmo padrão do Desenvolvimento Inesperado (Derivado). | Talentos, Restringido |
| C7 | **Escolha aninhada que ATRAVESSA arquivos**: *Adepto de Combate* → `ESTILOS_DE_COMBATE`, *Adepto de Feitiçaria* → `MUDANCAS_DE_FUNDAMENTO`, os dois pools em `afty-habilidades.js`. | Talentos |

### D. O bloqueio raiz: NÃO EXISTE canal de efeito do lado da CRIATURA
Nenhum efeito de habilidade ou talento está ligado, e **não é por escolha**: o único canal de
efeitos que existe (`CONTROLADOR_EFEITOS_INVOCACAO`) aplica sobre **invocações**. Tudo que as 6
especializações fazem é sobre a própria ficha. Essa é a "passada de efeitos" pendente desde as
Aptidões, e é o **pré-requisito de tudo em D**.

Quando ela existir, saem quase de graça (já estão escritos como fórmula nas seções de cada
especialização): 11 do Lutador, 10 do Conjurador, 4 do Suporte, além das do Combatente.

**Canais que ainda NÃO existem e vão precisar de desenho:**
- ~~**CURA**~~ ✅ **FEITO em 2026-08-03** (`afty-cura.js`, 7 canais, 12 linhas, card próprio).
- **TROCA de atributo na fórmula** (substituição, não soma), 3 consumidores:
  *Músculos Desenvolvidos* (Defesa usa Força), *Físico Controlado* (HP usa Presença/Sabedoria,
  teto +4), *Restrito pelos Céus* (Defesa usa Força ou Constituição).
- **ALMA / Integridade** — *Purificação da Alma* (Suporte 16°) restaura 50%. É a primeira do
  sistema que mexe na Alma, que multiplica todo o HP.
- **Vantagem por CONDIÇÃO nomeada** — *Alma Quieta*, *Corpo Sincronizado*, *Mente em Paz*
  (Lutador 10°), *Bastião Interior* (Conjurador 6°), *Mente Limpa* (Restringido 10°).
- **Dado de dano por FAIXA de nível** (não é soma): *Corpo Treinado* (Lutador base 1). Reusar
  `subirNiveisDano` das Invocações.
- **4 RECURSOS próprios**, um por especialização, nenhum modelado:
  Pontos de Preparo (Combatente) · Nível de Empolgação 1 a 5 (Lutador) · Pontos de Estamina
  (Restringido) · PE temporário exclusivo de Aptidão (Conjurador 12°).

**Nunca automatizável (não tentar):** estados ligáveis em combate (Brutalidade, Surto de
Adrenalina, Ataque Inconsequente...), reações e usos por PE/Estamina, e tudo que depende de
sistema inexistente (**Armas**, **Inventário**, **Feitiços**, **Perícias/TR do personagem**).

### E. Sistemas inexistentes que as 6 especializações já cobram
**Feitiços** (trava a maior parte do Conjurador) · ~~**Armas**~~ e ~~**Inventário**~~ (feitos em
2026-07-22: o catálogo existe, mas NENHUMA habilidade foi ligada a ele ainda, porque continua
valendo o bloqueio raiz D. Candidatas diretas: *Otimização de Espaço*, *Ajustes em Equipamento*,
*Dedicação em Arma*, *Técnicas de Combate*, *Corpo Arsenal*, *Manejo Superior*, e o grupo
**Pugilato** citado por um Talento) · **Arsenal Amaldiçoado** (texto nunca enviado) ·
**Perícias e TRs do personagem** (dezenas de `nota` viram
requisito real no dia que existir) · **Talentos concedidos por origem/treinamento** (o catálogo
existe, as fontes de concessão não).

---

## 🆕 SESSÃO DE 2026-08-03

### 💚 CURA virou sistema (`afty-cura.js`)

Era o **bloqueio raiz número 2** do doc, atrás só dos Feitiços: "canal de CURA não existe (20
habilidades)". Existe agora, e é irmão declarado do Dano.

⚠ **A diferença para o Dano é de onde vem o número, e ela decide a arquitetura.** O dano da
criatura sai de uma FÓRMULA única (ND, Patamar, atributo-chave), e por isso o catálogo de armas não
guarda dado nenhum. A cura NÃO tem fórmula: cada poder escreve a rolagem no próprio texto ("2d6 +
seu modificador de presença ou sabedoria") e elas não se parecem entre si. Então `FONTES_CURA` diz
só QUE LINHA EXISTE e quando, e **todo número entra pelo Motor**, nomeando a linha em `alvo`.

Nomear a linha não é enfeite: `curaFixa` **sem alvo** é exatamente o que "em toda cura que
realizar" (Medicina Infalível) significa, então o alvo é o que impede o bônus de uma fonte de
vazar para as outras.

**As 12 linhas**, cada uma com alcance, custo e usos próprios:

| Linha | De onde | Como |
|---|---|---|
| Energia Reversa | aptidão | `2 + degraus 10/15/20` dados **por PER**, d6 → d8 com a Cura Amplificada |
| Regeneração Corporal | aptidão | o espelho da de cima, com **2 PE** no lugar de 1 PER, d6 → d8 → d10 |
| Suporte em Combate | habilidade | a escada 2d6 → 2d12 → 3d12 → 6d8 → 6d10 |
| Revigorar | habilidade | `1 + piso(nível / 4)` d10, mais o dobro da Constituição |
| Ainda de Pé | habilidade | `3 + degraus 12/16/20` d10 + ND |
| Invocação Às | habilidade | `2 + degraus 5/9/13/17` d10 (quem rola é o companheiro, quem sara é o dono) |
| Puxar um Ar · Insistência | habilidade | espelham o **Ataque Básico** |
| Descarga Reanimadora · Criar Medicina | habilidade | espelham **Suporte em Combate** |
| Símbolo da Vida (3) · Laço da Vida | item | flat, ou uma fração do PV do portador |

**Sete canais novos**, com a mesma anatomia dos três de Regeneração mais o que a cura pede por ser
gasto de ação: `curaDados`, `curaFaces`, `curaFixa`, `curaPorDado`, `curaPorDadoTeto`, `curaUsos` e
`curaPontos`.

**Três decisões que fecham o modelo:**

1. **A escada de 10/15/20 vale POR PONTO GASTO** (autor, 2026-08-03), e não uma vez na rolagem. Um
   ND 20 gastando 3 PER rola 3 × 5d6, e não 6d6 + 3d6. Era assunção desde 2026-08-01 e virou regra.
   ⚠ **O MODIFICADOR não**: ele entra UMA vez, porque o texto diz "ao TOTAL de cura". É por isso que
   `curaDados` é por bloco e `curaFixa` é do uso inteiro.
2. **O nível do Suporte em Combate é o de SUPORTE**, com metade do nível das outras classes junto
   (autor), que é o `esc_suporte` de sempre. ⚠ A escada dele TROCA a rolagem e as faces até
   **descem** (d12 no 8, d8 no 12), então elas saem de UMA expressão com sinal negativo no meio:
   `curaFaces` vale o maior entre as FONTES, e duas fontes emitindo 12 e 8 deixariam o d12 vencer
   para sempre.
3. **Espelho de cura e espelho de dano seguem caminhos diferentes.** Descarga Reanimadora copia a
   cura pronta de Suporte em Combate e não reaplica canais, porque os bônus já estão nela. Puxar um
   Ar e Insistência copiam o Ataque Básico, que não contém bônus de cura, e depois recebem esses
   bônus uma vez. Item que cura continua flat.

**Na tela**, card próprio na aba Habilidades, ao lado do de Dano, que **some inteiro** para quem não
cura. A linha mostra o que UM ponto compra (autor), e não a rolagem do gasto máximo, com o custo em
chip verde. O uso inteiro fecha no hover, na linha do Total.

⚠ Com o custo por ponto, o **valor fixo não cabe** no `5d8`: ele entra uma vez no total, e não por
ponto. Vira um número próprio na linha, com o mesmo desenho do Acerto na linha de Dano. Sem custo
por ponto a rolagem fecha inteira (`6d10+17`) e o número separado não aparece.

⚠ **UM painel de hover por linha, de propósito.** A linha de Dano precisou de dois (Acerto e Dano) e
isso obrigou grupos nomeados em 2026-08-01. Aqui o hover único carrega dados, faces, multiplicação
pelo gasto máximo e cada parcela fixa, então a linha continua sendo `group` e nada colide. As faces
só viram linha do hover **quando há disputa**, e a perdedora aparece riscada, que é o vocabulário
que o pool exclusivo já tinha.

**13 entradas novas** nos mapas de efeito (10 habilidades, 3 aptidões), mais a Descarga Reanimadora,
que **não tem canal nenhum** e ainda assim tem linha, porque espelha. É o 9° caminho de ligação.

**O que ficou de fora, com bloqueio nomeado:** os três **Remédios**, o **Elixir da Vida** e o
**Incitar Vigor** dependem de **Dados de Vida**, que não existe no Afty. Cura Aperfeiçoada (rerrolar
1 e 2), Sobrecura (excedente vira PV temporário), Sintonização Vital, Cura Avançada em Grupo e
Disseminar Cura mexem em ALVO ou em ROLAGEM, e não em número de linha. A restauração de 50% de
Integridade da **Purificação da Alma** não tem onde cair: a Integridade saiu do criador e é sempre
máxima.

### 🏷 Os três canais de Regeneração foram RENOMEADOS

⚠ **Os nomes velhos eram indefensáveis**, e quem apontou foi o autor: *"a ponto de eu, o criador do
site, não entender o que cada um faz"*. Eram `Regeneração`, `Dados de Regeneração` e `Dado da
Regeneração`: duas variações da mesma palavra, e **nenhuma dizendo qual parte da rolagem escrevia**.

| Antes | Agora | O que escreve em `3d8+5` |
|---|---|---|
| `dadosRegeneracao` · "Dados de Regeneração" | `regeneracaoDados` · **"Regeneração: Dados"** | o `3` |
| `regeneracaoDado` · "Dado da Regeneração" | `regeneracaoFaces` · **"Regeneração: Faces do Dado"** | o `8` |
| `regeneracao` · "Regeneração" | `regeneracaoFixa` · **"Regeneração: Valor Fixo"** | o `+5` |

Os sete de Cura seguem o mesmo padrão (`Cura: Dados`, `Cura: Faces do Dado`, `Cura: Valor Fixo`...),
então **o prefixo agrupa e o sufixo diz qual parte é**. Os dez ganharam grupo próprio no seletor,
**"Cura e Regeneração"**: os três viviam soltos em "Vitalidade e Recursos", entre PV e Pontos de
Preparo, e lá não havia como perceber que os três eram partes da mesma rolagem.

⚠ **Os IDS mudaram junto**, e o `CANAL_LEGADO` traduz os antigos **na leitura** do Funcionamento
Básico da técnica, que é o único lugar onde o jogador escreve canal à mão. Sem reescrever a ficha:
quem abrir e salvar de novo já grava o id novo. Mesmo desenho do `CANAL_UNICA_LEGADO` da Habilidade
Única. Coberto por assert.

### 🎒 Item ganhou saída GERAL para o Motor

`efeito.motor` (`[{ canal, alvo?, expr }]`), no mesmo caminho dos encantamentos. Até aqui o item só
alcançava o Motor por campo NOMEADO (`hpMax`, `cd`, `atributo`, `pericia`) com um `if` para cada um
no `resolveEquipamentos`, e o **Apanhador de Saúde** não cabia em nenhum. Item novo usa o `motor` e
não precisa de campo nem de `if`.

O Apanhador é o primeiro consumidor: "+1 de cura por dado, com um limite de cura adicional igual a
metade do seu nível" vira `curaPorDado: 1` mais `curaPorDadoTeto: piso(nd / 2)`. ⚠ Ele conta os
dados do **gasto máximo**, então numa Energia Reversa de 5d8 por PER com teto de 5 PER são 25 dados,
e o teto é justamente o que impede isso de virar +25.

⚠ **Item que CURA basta CARREGAR, item que MELHORA cura precisa estar EQUIPADO.** Consumir um
talismã não pede equipar, e o botão de equipar é dos itens que valem enquanto vestidos. Coberto por
assert nos dois sentidos.

### ⚔️ RESTRINGIDO: a trava virou bidirecional, e 5 Treinamentos saíram

⚠ **"Restringido" era duas coisas meio soltas.** Existe a ORIGEM Restringido e o TIPO Restringido
(o `semEnergia`, que troca PE por Estamina e esconde a aba de Aptidões). Até aqui só a metade
`origem → tipo` era travada, e o Tipo Restringido podia ser escolhido com qualquer origem. Palavras
do autor: **"a origem força o Tipo, e o tipo força a origem, é impossível ver um Restringido sem a
Origem e Tipo Restringido ao mesmo tempo"**.

- `tiposDisponiveis(origemId)` e `tipoDaOrigem(origemId, tipoAtual)` em `afty-especializacoes.js`,
  irmãos do `especializacoesDisponiveis`. A Origem Restringido vê SÓ o Tipo Restringido, e as outras
  origens veem todos MENOS ele.
- O `setOrigemId` do builder passou a chamar `tipoDaOrigem`. O `tipoObrigatorio(id) ?? d.core.tipo`
  que estava lá **deixava a metade de volta gravada**: sair da origem Restringido mantinha o Tipo.

**Os 5 Treinamentos que o Restringido não tem** (autor): Barreiras, Compreensão, Controle de
Energia, Domínios e Energia Reversa. As cinco são de energia amaldiçoada, e ele não tem nenhuma.
Reusou o `foraDaOrigem` que a Maldição abriu em 2026-08-02, então **saiu de graça** o que o autor
pediu junto: um Treino de Barreiras Completo numa ficha que vira Restringido **perde os efeitos e
devolve os 5 Focos**, porque `efeitosDeTreino` pula a linha indisponível e `focosGastos` não a cobra.
As Aptidões já caíam pelo `semEnergia`, que agora está preso à origem pela trava nova.

⚠ O Treino de Energia Reversa acumula as duas exclusões: `foraDaOrigem: ["maldicao", "restringido"]`,
pelo motivo oposto e simétrico.

### 🎓 VAGA EXCLUSIVA DE TALENTO (canal `vagasTalento`)

O **Talento Natural** do Inato dava `vagasHabilidade`, a pilha COMUM, então uma característica que o
livro escreve como "um Talento à escolha" pagava Habilidade de Especialização qualquer. O autor
apontou que isso confunde. Nasceu o irmão do `vagasFeitico`:

| | Pilha comum | Exclusiva de Feitiço | Exclusiva de Talento |
|---|---|---|---|
| Canal | `vagasHabilidade` | `vagasFeitico` | `vagasTalento` |
| Serve para | Habilidade de Especialização **e** Talento | só Feitiço | só Talento |
| Quem concede | Habilidade Geral Especialização | Marca Registrada, Gojo, Nova Habilidade, Extração de Potencial, Dominância em Técnica, Reversão de Técnica | Talento Natural, Empenho Implacável |

`resolveHabilidades` ganhou o 6º parâmetro e devolve `comum`, `exclusivasTalento`,
`exclusivasUsadas` e `gastosNoComum`, exatamente o shape do `orcamentoHabilidades`. Talento gasta
**primeiro a exclusiva**, e o `excedeu` é medido no COMUM: vaga exclusiva sobrando não libera
Habilidade de Especialização nenhuma. O contador da aba mostra as duas separadas (`+1 / 2` em roxo).

⚠ **O degrau 19 do Empenho Implacável SEPAROU** (autor): "uma Habilidade de Especialização E um
Talento adicional" valia 2 vagas comuns, e agora é uma de cada pilha. Os degraus de escolha
`st_n1_talento` e `st_n10_talento` também trocaram: davam vaga comum, então quem escolhia Talento no
degrau podia gastá-la numa Habilidade e a escolha não valia nada.

### 🔮 Feitiços adicionais: a regra já valia, faltava um consumidor

"Habilidade que dá Feitiço adicional é exclusiva para Feitiços / Estilo das Sombras / Técnicas
Marciais, não podendo ser usada para Habilidades Gerais" **é o que `vagasFeitico` significa desde
2026-07-28**, e a varredura confirmou que nenhuma concessão de Feitiço passava pelo canal comum.

Uma estava **sem efeito nenhum**: a aptidão **Reversão de Técnica** ("você recebe um Feitiço
adicional, a qual obrigatoriamente deve ser uma reversão") concedia o Feitiço só no texto. Ligada.
O "obrigatoriamente uma reversão" e o custo aumentado seguem fora, porque são regra do Feitiço criado
e `afty-feiticos.js` não lê o Motor.

⚠ ***Familiaridade com Técnica*** (Talento) parece dar Feitiço e **não dá**: ela marca Feitiços que
você já tem como Marca Registrada. Não é vaga, e por isso continua sem efeito.

### 👁 O Preview cresceu de novo

1. **Resistências**, as CINCO sempre. É a exceção deliberada à regra das Perícias (que só mostram
   quem tem faixa): todo mundo rola os cinco TRs, e o TR sem treino é justamente o número que o
   mestre procura. Mestre em roxo, treinado em branco, sem faixa em cinza.
2. **Ataque**, as três categorias, com hover de fontes.
3. **Níveis de Aptidão**, só as trilhas com nível. Some inteira no Restringido.
4. **Feitiços criados**, uma linha por Feitiço com nível, valor e custo em PE, mais o triângulo de
   aviso e a marca `Var.` das variações de liberação (que não gastam vaga).

**`derived.feiticos.lista`** é nova, e vem de `resumoFeiticos(creature, ctx)` em `afty-feiticos.js`:
o Preview **não recalcula nada**, só exibe (mesma convenção do `resumoDominios`). O
`formatAuxValor` **subiu do builder para o motor** na mesma passada, porque com dois consumidores
uma cópia na UI divergiria na primeira errata.

### 🎨 Perfil Amaldiçoado, segunda passada

- O **Atributo da Técnica subiu para o cabeçalho** do card.
- A caixa de **CD de Feitiçaria SAIU**: ela já está no Preview, ao lado, e gastava a largura da
  primeira linha inteira para repetir um número.
- Com isso o corpo ficou **inteiro** para o Funcionamento Básico e o Motor de Automação.

**`TextoLongo`**, componente novo. O autor descreveu o campo como "tanto coisas pequenas de 1
parágrafo quanto habilidades com 3 páginas", e um `rows` fixo serve mal aos dois extremos de uma vez:
4 linhas desperdiçam meia tela no caso curto e escondem 95% do texto no caso longo. Ele cresce
sozinho até 18 linhas e daí rola por dentro, com um botão de expandir que tira o teto. O botão **só
aparece quando há o que revelar**.

⚠ O `el.style.height = "auto"` antes de ler o `scrollHeight` não é enfeite: sem ele a caixa cresce e
**nunca encolhe** ao apagar texto.

### 💾 RASCUNHO AUTOMÁTICO (`afty-rascunho.js`)

⚠ **O criador do Afty não guardava NADA até o botão Salvar.** Recarregar a página, fechar a aba ou
um remount do Vite em desenvolvimento levavam a ficha inteira junto. Palavras do autor: *"a ficha
fica resetando o tempo inteiro"*.

É uma **reescrita** do bloco "Autosave do rascunho" do `CreatureBuilder.jsx` da 2.5.2, e não uma
cópia (a 2.5.2 é somente-leitura). Dois comportamentos mudaram de propósito, a pedido do autor
("podemos refazer de maneira melhorada"):

| | 2.5.2 | Afty |
|---|---|---|
| Ao voltar | banner "Rascunho encontrado" + botão **Restaurar** | **restaura sozinho** |
| Ao recarregar | `beforeunload` pergunta se quer mesmo sair | não pergunta |

**Por que restaurar sozinho.** O banner transforma "não perder a ficha" numa ação que o usuário
precisa lembrar de fazer, e quem recarrega no meio de uma edição não está pedindo ficha em branco. O
preço do automático é a surpresa, e quem paga é o botão **Descartar**: a restauração é desfazível,
então o caminho errado tem volta. O banner faz o contrário, e cobra um clique do caso comum para
proteger o caso raro.

**Por que NÃO avisar ao sair.** O aviso do navegador existe para o dado que morre ao fechar a aba, e
com o autosave ele não morre mais. Sobrou atrito puro em cima de quem recarrega para testar, que é
exatamente o fluxo do autor.

- Chave por ALVO: `fm_builder_draft_afty_v1:<id da criatura | new>`. Sufixo `_afty_` pela convenção
  de isolamento (a mesma de `fm_creatures_afty_v1`). Editar uma criatura não pisa no rascunho da
  outra, e a ficha nova tem a dela.
- Debounce de **600ms**: digitar não escreve por tecla.
- ⚠ O rascunho **é aplicado no inicializador do `useState`**, e não num efeito depois de montar.
  Restaurar depois faria a tela piscar a ficha em branco antes de trocar, e todo estado derivado do
  draft nasceria do valor errado.
- ⚠ **O Salvar APAGA o rascunho** e move a régua do "tem alteração pendente" para a ficha
  recém-gravada. Um rascunho sobrando faria a próxima abertura restaurar por cima do que acabou de
  entrar no compêndio.
- **Rascunho idêntico à ficha gravada não conta**, e se apaga sozinho: não é trabalho perdido, é
  lixo de uma sessão que terminou limpa, e restaurá-lo acenderia o indicador sem motivo.
- Nada disso pode derrubar o criador: JSON corrompido, `draft` nulo e `localStorage` indisponível
  (modo privado, cota estourada) viram "rascunho ausente", em silêncio. Coberto por asserts.

**Na tela**, um chip ao lado do Salvar, que SOME quando não há nada pendente (um indicador
permanente dizendo "tudo certo" deixa de ser lido justo quando tem algo a dizer). Dois estados, de
propósito diferentes: **Restaurado** (azul) avisa que a ficha na tela veio do rascunho e não do
compêndio, que é o único momento em que o automático pode surpreender, e **Rascunho** (cinza) é só a
marca de que o trabalho está guardado. O X desfaz nos dois.

⚠ A marca "Restaurado" **some assim que o usuário edita**: dali em diante o que está na tela é dele,
e oferecer "descartar a restauração" seria oferecer jogar fora o que ele acabou de fazer.

### Pendências desta sessão
- **Treino de Estudos** e **Treinamento para Habilidade**: o autor vai mandar o texto. Nada feito.
- **Corpo Amaldiçoado Mutante** segue vazia (de 2026-08-01).
- **Dados de Vida** não existe no Afty, e é o que trava os três Remédios, o Elixir da Vida e o
  Incitar Vigor. É o próximo bloqueio nomeado da Cura.
- ⚠ **ASSUMIDO no Revigorar**: "aumentando em um dado a cada 4 níveis" foi lido como nível de
  COMBATENTE, porque é o que a especializacão usa em toda escada. O texto não diz.
- **Suporte Absoluto** soma "seu modificador de atributo escolhido para CD de especialização" na
  cura, e o Afty tem UMA CD só. Foi lido como o Atributo da Técnica. É a mesma pergunta aberta do
  encantamento **Complementar** ("+2 na sua CD de Especialização e de Estilo Marcial").

---

## 🆕 SESSÃO DE 2026-08-02

### O RETRATO passou a existir

`portraitUrl` estava no schema e tinha campo na aba Identidade **desde sempre**, e não era exibido
em lugar nenhum do Afty: digitar a URL não fazia nada. Agora aparece.

Portado da 2.5.2, que já tinha o sistema resolvido. Os dois componentes são `function` LOCAL nos
arquivos de lá, **sem export**, e a 2.5.2 é somente-leitura: não dava para importar, então foram
copiados com a procedência anotada no topo do bloco.

| Copiado de | Virou |
|---|---|
| `sections/SectionIdentity.jsx` (PortraitFocusPicker) | `RetratoFocoPicker` + `RetratoCampo` |
| `sections/LivePreview.jsx` (PortraitHeader) | `RetratoBanner` |

- **Campo `portraitFocus`** novo no schema (`{ x, y }` em porcentagem), que vira o `object-position`
  da imagem. Sem ele um retrato de corpo inteiro cortaria a cabeça no banner. A miniatura da
  Identidade é **arrastável** e marca o ponto focal com uma cruz.
- **Ficha antiga não quebra**: `focoDe()` resolve para 50/50 quando o campo não existe.
- ⚠ O `erroredUrl` guarda **a URL que falhou**, e não um booleano. É da 2.5.2 e vale manter: o erro
  fica preso ÀQUELA url, então trocar a imagem faz o retrato voltar sozinho, sem `useEffect` para
  limpar a marca.

### O Preview cresceu

Entraram quatro coisas (autor, 2026-08-02):

1. **Atenção.** O motor calculava e o Preview simplesmente não mostrava. Buraco puro.
2. **Dano e Acerto**, uma linha por fonte, resumidas da aba Habilidades (sem propriedades nem
   alcance).
3. **Perícias dominadas**, só as que têm faixa: mestre em roxo, treinado em cinza. As 20 com zero
   encheriam o painel de linha morta.
4. **Grau do Feiticeiro** como chip, e o aviso de **Sobrecarregado**, que só existia na aba
   Equipamentos.

Mais a **RD Física**, que passou a aparecer quando alguém a concede (depois de 2026-08-01 ela ficou
só com quem nomeia o tipo, então o normal é ser zero e sumir).

⚠ **A faixa de título "Preview" some quando há retrato**, e é de propósito: o banner JÁ é o
cabeçalho (o nome e os chips ficam sobre a imagem), e a faixa viraria uma linha repetindo o óbvio no
meio do card. Sem retrato ela continua lá, fazendo o papel dela.

---

## SESSÃO DE 2026-08-01

### 🎭 ORIGEM MALDIÇÃO: o conteúdo existia, a porta não

Auditei as origens a pedido do autor (a pergunta era se o Talento adicional do Inato estava ligado:
está, e roda ponta a ponta). A auditoria achou um buraco maior.

⚠ **As 18 Aptidões de Maldição estavam no catálogo desde 2026-07-16, e o `abasAptidao` já trocava a
categoria Energia Reversa pela Maldição quando `core.origem.id === "maldicao"`. Mas a ORIGEM nunca
foi criada.** `getOrigem("maldicao")` devolvia `null`, então ninguém tinha como escolhê-la, e as 18
aptidões eram conteúdo inalcançável. O texto chegou em 2026-08-01 e a origem entrou.

⚠ **"Maldição" aqui é a ORIGEM.** O PATAMAR que se chamava Maldição virou Beyond em 2026-07-16, e os
dois não têm relação nenhuma.

**As três características:**

| Característica | Como ficou |
|---|---|
| Bônus em Atributo | 4 pontos, máximo 3 no mesmo, mais o pool de limite abaixo |
| Existência Metafísica | `mesa: true` inteira |
| Natureza Amaldiçoada | `vagasAptidao: 1 + (nd >= 10) + (nd >= 15)` e `pe: nd` |

**Existência Metafísica é mesa por falta de sistema, não por descuido.** Imunidade a dano que não
venha de energia amaldiçoada e vulnerabilidade a energia reversa são recortes por ORIGEM do dano, e
o Afty não tem imunidade nem dano por origem. O recorte de percepção ("não pode ser percebido por
quem não é feiticeiro") também não é número.

### As 18 Aptidões de Maldição no Motor: 12 ligadas

Feita na mesma sessão, agora que a origem existe. **13 de 18** com efeito, que é uma razão bem
melhor que a das outras categorias (11 de 62 em 2026-07-30), e o motivo é estrutural: as de
Maldição são majoritariamente **passivas de corpo**, e não ativas pagas em PE com efeito sobre
terceiros.

| Aptidão | Como |
|---|---|
| Armas Naturais | `finezaAtaque` corpo (a Fineza é o que sobra de mecânico) |
| Armas Naturais Aprimoradas | `nivelDano` basico, nos marcos 8, 12, 16 e 20 |
| Crescimento Corporal | `hp` = ND |
| Olhos Adicionais | `bonusPericia` percepção = Maestria, mais `atencao` +2 |
| Revestimento | `rdFisico` = Maestria |
| Revestimento Evoluído | `rdFisico` = `mod_constituicao - maestria`, com `quando` |
| Estoque Ampliado | `pe` = Maestria |
| Extração de Potencial | `proficienciaPericia` feitiçaria e `vagasFeitico` |
| Proteção Constante | `pvTemporario` na bancada, preso ao `em_combate` |
| Fluxo Imparável | os três canais de Regeneração |
| Regeneração Ampliada | dado d8 e o modificador dobrado |
| Regeneração Máxima | dado d10 |
| Superioridade Física | `bonusPericia` na perícia escolhida (ver abaixo) |

**Três decisões que valem registrar:**

1. **O `tem_*` passou a cobrir APTIDÕES**, e não só Habilidade e Talento. Quem obrigou foi o
   **Revestimento Evoluído**: ele TROCA a RD do Revestimento pelo modificador de Constituição, e
   troca não tem canal, então entra como DELTA (`mod_constituicao - maestria`), o mesmo desenho da
   Cobertura Avançada sobre o Cobrir-se. Só que o livro **não lista o Revestimento como
   pré-requisito** (a nota já estava no catálogo desde julho), então sem a guarda o delta daria um
   número inventado para quem pegasse só o Evoluído. Com `quando: "tem_mal_revestimento"`, sem
   Revestimento não há RD para trocar e não há efeito.
2. **Extração de Potencial usa o `prof_feiticaria`**, que já existia. "Caso não possua, você recebe
   treinamento; caso possua, você se torna mestre" vira `1 + (prof_feiticaria >= 1)`, exatamente o
   truque da Força Imparável do Restringido.
3. **A cura da Maldição é o espelho da Energia Reversa**, com PE no lugar de PER. A Regeneração
   Corporal é Ação Comum e por isso não vira número sozinha, igual à cura de Energia Reversa: quem
   a torna automática é o **Fluxo Imparável** ("no começo do seu turno, como uma ação livre"), e
   cura no início do turno É o canal de Regeneração. Estado novo `regeneracaoPE` na bancada, irmão
   do `fluxoPER`. O modificador entra UMA vez (leitura confirmada pelo autor em 2026-07-30) e
   "Constituição OU Presença" é o maior dos dois (decisão C3).

**As 5 que ficaram de fora**, cada uma com bloqueio nomeado: Composição Elemental e Absorção
Elemental (tipos de dano elementais, que o autor ainda vai mandar), Absorção Amaldiçoada (gatilho de
morte), Regeneração de Membros (narrativa pura) e Regeneração Corporal (Ação Comum, coberta pelo
Fluxo Imparável).

### Maldição não tem Energia Reversa (autor, 2026-08-02)

Nem a **trilha** (Nível de Aptidão em Energia Reversa) nem o **Treino de Energia Reversa**. Fecha o
desenho que já existia por metade: as Aptidões de Maldição OCUPAM o lugar das de Energia Reversa na
aba desde 2026-07-16, e o livro diz que uma maldição pega da lista padrão "exceto pelas aptidões de
energia reversa". Faltavam a trilha e o treino, que continuavam abertos.

- `TRILHAS_FORA_DA_ORIGEM` e `trilhasDaOrigem(origemId)` em `afty-aptidoes.js`. O
  `resolveNiveisAptidao` ganhou um 4º argumento com as trilhas da origem.
- `foraDaOrigem: ["maldicao"]` na linha do Treino, mais `treinoDisponivel` e
  `treinamentosDaOrigem(origemId)` em `afty-treinamentos.js`. O `focosGastos` passou a receber a
  origem.
- A UI esconde as duas: a grade de trilhas vem de `derived.trilhasAptidao` e alterna entre 5 e 4
  colunas para não sobrar buraco na fileira, e a aba de Interlúdios lista só as linhas alcançáveis.

⚠ **A trilha sai ZERADA, e não ausente.** Meio sistema lê `aptidao.efetivo.er` direto, e uma chave
faltando viraria `undefined` num lugar que espera número.

⚠ **Ponto e Foco gastos antes da troca de origem VOLTAM.** Uma ficha que alocou 3 níveis em Energia
Reversa e virou Maldição não perde os 3 pontos: eles saem de `gastos` e voltam ao orçamento. O mesmo
com os Focos presos no Treino. É a escolha certa porque a alternativa é o jogador pagar por um
recurso que a aba nem mostra mais.

~~⚠ **O RESTRINGIDO tem o mesmo problema e NÃO foi mexido.**~~ ✅ **RESOLVIDO em 2026-08-03**, e maior
do que a pergunta: o autor tirou CINCO treinos dele (Barreiras, Compreensão, Controle de Energia,
Domínios e Energia Reversa) e fechou a trava Tipo ↔ Origem nos dois sentidos. Ver a sessão de
2026-08-03.

### 🐛 Toda faixa da bancada precisa estar no `tetoFaixa`

Achado ao ligar o `regeneracaoPE`: o `resolveCombate` apara faixa com
`intDe(c[e.id], min, max(min, tetoFaixa[e.id] ?? 0))`, então uma faixa **ausente do `tetoFaixa` é
aparada em ZERO** e o estado nunca sai do lugar, sem erro nenhum. O `max` do catálogo é só da UI, e
não chega no resolver.

O comentário que estava lá dizia o contrário ("As demais usam o `max` do catálogo, que a UI já
aplica, e aqui só precisam do piso em zero"), e foi ele que me fez perder uma depuração. Reescrito
para avisar.

### Pool que sobe SÓ o limite

"A cada 4 níveis, você pode aumentar o limite de um atributo em 2" é irmão do **Desenvolvimento
Inesperado** do Derivado, e a diferença é toda: lá o ponto sobe **valor e limite** juntos, aqui ele
sobe **só o limite**. A Maldição paga o valor com os 4 pontos distribuíveis dela.

Por isso não deu para reusar o `afetaAtributos`, e entrou um shape novo:

- `poolLimite: { porNivel: 4, valor: 2 }` na característica.
- `core.origem.limites` guarda **quantas vezes** cada atributo foi escolhido, e o degrau (2) entra no
  `resolveLimitePoolOrigem`. Assim o contador da UI conta escolhas e a ficha soma pontos de limite,
  sem os dois números se confundirem.
- `limitePoolTotal(nd, porNivel)` e `limitePoolUsado(mapa)` em `afty-atributos.js`, irmãos dos
  `desenvolvimento*`.
- Entra no `limiteBaseOf` do `deriveAfty` e aparece no hover do limite como "Bônus em Atributo".

A cadência bate redondo com os três tetos: 5 escolhas no ND 20 levam o limite de 20 a **30**, que é o
teto do sistema. Acima disso o clamp segura.

### ✅ Superioridade Física: um OU outro, e a escolha de Aptidão que nasceu daí

"Seu bônus de treinamento em rolagens de **atletismo ou acrobacia**" é **um OU outro** (autor,
2026-08-01), e não os dois nem o maior. As Aptidões não tinham escolha modelada, e montar uma
escolha aninhada inteira para um caso só era desproporcional. O caminho foi o DSL:

- A aptidão declara `opcoes: { id, label, valores: [...] }` no catálogo.
- Cada valor vira a booleana **`opt_<aptidao>_<valor>`** no contexto, alimentada por
  `creature.aptidaoOpcoes` (`{ [aptidaoId]: valorId }`).
- O conteúdo emite as DUAS linhas, cada uma protegida pelo `quando` dela. Só uma tem a condição
  satisfeita, então nada de novo precisou entrar no coletor nem no `aplicarEfeitos`.
- As booleanas entram no vocabulário declaradas a zero, pelo mesmo motivo dos `tem_*`.

Na UI são **chips**, e não dropdown: são duas opções, e a regra da aba de Aptidões (aprovada pelo
autor) é manter as opções à mostra. Só aparecem com a aptidão escolhida.

Com isso o placar da Maldição foi para **13 de 18**.

(A parte de "5 PE para vantagem numa manobra" segue fora: vantagem não é número, e um interruptor de
bancada que não muda nada seria UI morta.)

⚠ **O Corpo Amaldiçoado Mutante continua VAZIO.** É outra origem, não é a Maldição, e o texto dela
nunca foi enviado. Hoje ela aparece na lista e não concede nada.


Revisão da aba **Equipamentos**. Detalhe completo em `docs/afty-equipamentos.md`.

### A aba de inventário da CRIATURA é simplificada, por decisão

Palavras do autor: a aba existe "para o mestre não precisar ficar pensando em quais itens pegar",
e o **Dano da criatura tem cálculo próprio que não segue o da arma**. Todas as mudanças abaixo saem
disso. O que sair da ficha de criatura **volta na ficha de jogador**, e não está sendo apagado do
catálogo, só desligado do motor.

### Armadura: Defesa é o CUSTO dela, e a penalidade voltou

- **Defesa da armadura = o custo dela**, mais 1 por grau da Ferramenta. Um Revestimento Robusto
  (custo 3) de Segundo Grau dá 3 + 3 = 6. Helper `defesaDaArmadura(def, grauDefesa)`.
- ⚠ **Sob Medida é a exceção declarada**: custa 2 e dá **1**, "já que ela já dá benefícios em
  Perícia". Campo `defesaCriatura` no catálogo, e o valor bate com o +1 da tabela do livro. Ela
  também resolveu de quebra a dominância que a regra do custo tinha criado sobre o Revestimento
  Médio, que custa o mesmo e tem penalidade.
- ⚠ **A coluna de Defesa da tabela de modificações NÃO vale** (autor). Quem manda é o custo. O
  Uniforme Comum tem custo 0, então dá 0 de Defesa.
- **A penalidade de Destreza VOLTOU e agora é APLICADA**, o que ela nunca tinha sido: desde
  2026-07-22 ela era calculada e ficava parada, primeiro porque Perícias não existiam e depois
  porque ninguém voltou. Vale só em **testes de perícia que usam Destreza**, que é o que o livro
  escreve, então não pega TR (nem Reflexos) nem Jogada de Ataque. Aparece no hover como a fonte
  "Armadura e Escudo", e as Manobras herdam de graça pela Acrobacia.
- ⚠ Isto **substituiu a primeira passada do mesmo dia**, que dizia "+1 fixo para toda armadura" e
  tinha removido a penalidade. As duas regras viveram algumas horas.

### Os encantamentos saíram do teto de sete canais

⚠ **`EQUIP_EFEITO_CANAIS` MORREU** (2026-08-01). Era a lista de sete canais dos encantamentos, e era
o teto que mantinha metade deles como texto morto: Perícia, Manobra, TR, Iniciativa, Acerto e Dano
não cabiam nela. Os encantamentos seguiram o caminho que a Habilidade Única abriu em 2026-07-30 e
passaram a escrever no **catálogo inteiro do Motor**, saindo por `equip.efeitosEncantamento`. A
diferença para a Habilidade Única é que encantamento **não leva `exclusivo`**: ele soma normal e não
é fonte do pool exclusivo.

Com isso o placar foi de **4 para 17 encantamentos ligados**, de 52. Os novos: Balanceada, Certeira,
Cruel, Otimizada, Penetrante, Poderosa, Potente, Precisa (arma), Polido (escudo), Ajustado, Furtivo,
Marcial, Material Pesado (uniforme).

Duas invenções que valem registrar:

- **Pseudo-canais**, resolvidos no `afty-equipamentos.js` e que nunca chegam ao Motor. `acertoArma`
  existe porque o `bonusAcerto` do Motor mira CATEGORIA (corpo, distância), e o +2 do encantamento
  Precisa vazaria para as outras armas. `penalidadeEquip` existe porque a penalidade de Destreza não
  é canal de Motor. Um assert cobre justamente o não-vazamento.
- **O Ajustado num efeito declarativo.** As duas metades da regra ("a penalidade é reduzida em 1,
  caso possua" e "se já possuir 0 de penalidade, +2 em Furtividade") viraram
  `2 * (penalidade == 0)` na expressão, com `penalidade` e `custo` entrando na DSL do item. Efeito
  que resolve em zero não vira linha. Foi o que evitou um caso especial em código.

⚠ **35 seguem como texto**, e cada um tem bloqueio nomeado: gatilho ou reação (13), traço de arma
que a linha de dano não usa (6), alcance e manejo (7), efeito em outra criatura (2) e **RD ou dano
por tipo elemental** (4), que esperam a lista de tipos de dano do autor.

⚠ **Complementar** ("+2 na sua CD de Especialização e de Estilo Marcial") ficou de fora porque o
Afty tem UMA CD só, a Amaldiçoada. Se forem a mesma coisa, é uma linha. **Pergunta aberta.**

**Efeitos de perícia de ITEM entraram pelo mesmo cano**: Sob Medida (+2 Acrobacia e Furtividade) e
Amuleto do Vislumbre (+2 Percepção), que eram `aplicado: false` desde 2026-07-22. Sobraram as duas
Pulseiras, que concedem treino numa perícia à ESCOLHA do jogador e precisam de UI.

### Escudo: a RD dele é RD GERAL

Trocou de canal (autor, 2026-08-01). As palavras dele foram "RD Geral, exceto Alma", que é a
definição EXATA da RD Geral no Afty, então não precisou de canal novo: é por isso que o Dano na Alma
ganhou canal próprio em 2026-07-29. O campo do catálogo virou `rdEscudo`, e não `rdFisico`, para não
sugerir tipo.

O exemplo do autor virou assert: Escudo Pesado (6) de Grau Especial (5) dá **11 de RD Geral e -4 de
penalidade**.

O encantamento **Reforçado** seguiu o escudo e também virou RD Geral (autor), mesmo o texto dele
dizendo "contra dano físico". `derived.rdFisico` ficou só com quem nomeia o tipo fora do
equipamento (Aura Reforçada e afins). ⚠ O `rd_escudo` do DSL não mudou: ele alimenta `bonusTR`
(Especialista em Escudo e Técnicas Defensivas de Escudo), e não RD.

**Removido: o encantamento Isolante de ESCUDO** (autor). Ele fazia a RD do escudo valer também
contra um tipo elemental à escolha, e virou letra morta quando ela passou a ser RD Geral, que já
cobre todo tipo menos alma. O **Isolante de UNIFORME é outro encantamento** e continua existindo.

A tabela de escudos foi reconferida com o texto do livro e os quatro números batem com o catálogo.

### Arma: Acerto por grau, e a arma passou a ser EQUIPÁVEL

- **+1 de Acerto por grau** da Ferramenta (Quarto 1 até Especial 5). O dano fixo por grau já existia
  (`DANO_ADICIONAL_ARMA`, 4/8/12/16/20).
- O Acerto aparece **na linha daquela arma**, na aba Habilidades, e não no Ataque da aba Perícias
  (autor). O bônus é da arma: no Ataque da categoria, duas armas de graus diferentes disputariam o
  mesmo número. `resolveDano` recebe `ataques` já resolvido e fecha `acerto` e `partesAcerto` por
  linha, com hover próprio.
- ⚠ **A linha de dano passou a exigir arma EQUIPADA** (autor), o que **muda a decisão de
  2026-07-27** ("uma linha para cada Tipo de Arma colocado"). A arma ganhou botão de equipar, que
  antes só uniforme, escudo e item com efeito tinham.
- ⚠ Isso obrigou **dois painéis de fontes na mesma linha**, e o `group-hover` sem nome responde a
  QUALQUER ancestral com a classe `group`. O `PainelDeFontes` ganhou o prop `aparecer`, e cada
  número carrega o grupo NOMEADO dele (`group/acerto`, `group/dano`). A string vem literal do
  chamador porque o Tailwind lê o código-fonte e não enxerga classe montada em template.
- 🐛 **A primeira tentativa consertou só metade**, e o autor pegou por screenshot: nomear só o
  painel de dentro impede ele de vazar para fora, mas a LINHA continuava sendo `group`, então passar
  o mouse no Acerto acendia os DOIS painéis, sobrepostos. O conserto certo é a linha **não ser
  `group`** e cada número ter o seu.
  **A lição:** num container `group` só cabe UM painel de hover. A partir do segundo, o grupo tem de
  descer do container para cada gatilho.
- Varredura dos outros 8 pontos com `PainelDeFontes`: nenhum repete o problema. As Manobras têm dois
  painéis por linha (Executar e Resistir), mas cada um já vem embrulhado no próprio `relative group`
  pelo `ValorComFontes`, e a linha delas nunca foi `group`.

### Encantamento DESCE UM GRAU (o preço de encantar uma criatura)

Encantamento não é recomendado para criatura, e o preço é o grau: cada encantamento escolhido faz o
item descer um degrau nas contas de **Acerto, Dano, Defesa e RD**. Grau Especial com um encantamento
calcula como Primeiro, com dois calcula como Segundo. Piso **zero**, que é grau nenhum.

Duas coisas ficam de fora, e as duas são decisão registrada:

1. A **Habilidade Única** do Grau Especial (autor). O `grau` que a expressão dela lê no Motor segue
   sendo o **real**.
2. **Quantos encantamentos o item aceita**, que segue vindo do grau real. Se descesse junto, a conta
   se morderia: pegar um encantamento cortaria o limite que autorizou pegá-lo.

`grauRankCalculo(grau, n)` e `grauDoRank(rank)` em `afty-equipamentos.js`. O resolver devolve
`rankCalculo`, `grauCalculoLabel` e `reduzido`, e a UI mostra um chip âmbar "Calcula como X".

### Três correções da revisão da aba

1. **PV máximo de item entra ANTES da Alma e do Patamar** (autor), junto do treino e do canal `hp`.
   Um item de +10 vale 40 num Beyond. Era a pendência número 2 do doc de Equipamentos.
2. **A Habilidade Única aparece no card Efeito do Equipado.** Ela passou a viajar pelo Motor em
   2026-07-30 (pool exclusivo) e os escalares do card não a enxergavam, então uma ferramenta de Grau
   Especial não aparecia em lugar nenhum da aba.
3. **Poda de texto explicativo.** A aba nasceu antes da regra de 2026-07-29 e nunca tinha passado:
   saíram o parágrafo do Orçamento, a frase de vazio do Efeito do Equipado, a narração do aviso de
   Sobrecarregado, o parágrafo de apresentação do card de referência e o parágrafo âmbar que
   explicava o motor. Notas de número viraram `title` ("passa o limite, teto 30", "Cargas (= BT)").

### Filtro por custo no catálogo

Pedido do autor. É a pergunta direta do orçamento, que é contado por custo: "o que ainda cabe na
vaga que me sobrou". Chips no mesmo desenho do sub-filtro, com o rótulo `C1` que a linha do catálogo
e a do carregado já usam.

Duas decisões que valem registrar:

- **Os chips saem dos custos que EXISTEM no recorte atual** (aba mais sub-filtro), e não de uma
  lista fixa de 1 a 4. A aba de Kits, onde tudo custa 1, não mostra filtro nenhum. Armas Simples
  oferece C1 e C2, Complexas vai até C4, e Uniformes tem um C0 (o Comum). O recorte para no
  sub-filtro de propósito: incluir a busca faria as opções mudarem a cada tecla, e o que some
  debaixo do dedo é pior que uma opção que não acha nada.
- **O custo ativo é DERIVADO, não corrigido em estado.** Trocar de aba pode deixar o custo escolhido
  sem item para casar, e a primeira versão consertava isso com um `useEffect` que chamava
  `setCustoFiltro`. O eslint barrou (`react-hooks/set-state-in-effect`, renderização em cascata) e
  estava certo: basta calcular `custoAtivo` na renderização e ignorar o escolhido quando ele não
  existe no recorte. O valor guardado continua lá, e volta a valer quando a aba tiver aquele custo.

### Kit ocupa 1 espaço

Confirmado pelo autor, que já era o padrão. Pendência 3 do doc fechada.

---

## SESSÃO DE 2026-07-30

### POOL EXCLUSIVO: as cinco fontes que NÃO acumulam

Regra de balanceamento que o autor fechou nesta sessão. Cinco fontes de bônus
numérico disputam entre si, e só o **maior valor de cada canal** entra na ficha.
Palavras dele:

> "Essas 5 fontes de bônus numéricos e etc, não acumulam entre si, sempre ficando
> com o maior valor. Por exemplo, se o Efeito Único da minha arma me fornece +8 de
> Acerto, meu Feitiço Passivo me fornece +4 e um Shikigami está me fornecendo +5,
> eu só fico com o +8 de Acerto da arma. Caso eu perca a arma ou ela seja
> desativada de alguma forma, eu fico somente com o +5 do Shikigami."

| # | Fonte | Modo | Ligada ao Motor? |
|---|---|---|---|
| 1 | **Habilidade Única** (Equipamentos) | passiva **ou** ativa, por item | ✅ **FEITA** |
| 2 | Feitiço Auxiliar **Passivo** | passiva | ⬜ o subtipo não existe |
| 3 | Característica de Shikigami | passiva | ⬜ falta o cano invocação → dono |
| 4 | Feitiço Auxiliar **Ativo** | ativa | ⬜ `afty-feiticos.js` não lê o Motor |
| 5 | Ação Ativa de Shikigami | ativa | ⬜ falta o cano invocação → dono |

**As quatro decisões de regra (autor, 2026-07-30):**

1. **Por STAT, não por fonte.** As fontes se misturam: arma com +8 Acerto e +2
   Defesa contra Shikigami com +5 Acerto e +6 Defesa rende **+8 de Acerto E +6 de
   Defesa**. Cada canal escolhe o seu vencedor sozinho.
2. **Vale DENTRO da família também.** Dois Shikigami, ou dois Feitiços Auxiliares
   ativos, não somam entre si. Por isso o pool é **plano**: a família só serve
   para a UI dizer de onde veio o número.
3. **Pega todo bônus numérico**, e não só ataque e defesa. Acerto, Defesa, CD, RD,
   Dano, Movimento, **Atributo**, PV e PE máximos.
4. **Passivas na ficha, ativas na bancada** de Simulação de Combate. A Habilidade
   Única é a exceção: ela pode ser das duas, **a depender do item**, então quem
   decide é o efeito e não a fonte.

**Como ficou no código** (`afty-efeitos.js`):

- `FAMILIAS_EXCLUSIVAS` (as 5) e o campo `exclusivo: "<familiaId>"` no efeito.
- `aplicarEfeitos` **desvia** o exclusivo para `res.exclusivos` em vez de somá-lo,
  porque a disputa precisa da lista inteira junta.
- `mesclarEfeitos` **concatena** os exclusivos, nunca os soma.
- `resolverExclusivos(res, jaAplicado)` fecha a disputa e devolve os vencedores já
  somados em `porCanal` / `porAlvo`. Depois dele o resto do motor não sabe que a
  regra existe: `valorCanal` e companhia seguem iguais.
- O `jaAplicado` existe por causa do canal **`atributo`**, o único que o
  `deriveAfty` resolve em dois estágios. Sem ele, uma Habilidade Única permanente
  de +6 de Força e um Feitiço Auxiliar temporário de +4 na mesma Força somariam
  10, quando a regra manda ficar com 6.
- O **perdedor não some**: ele entra em `detalhes` com `suplantado: true`, e o
  `PainelDeFontes` o mostra **riscado e apagado**. Sem isso o jogador veria o +5
  do Shikigami desaparecer da ficha sem nada explicando.
- `detalhesDoCanal` e `detalhesDoCanalEscopos` **escondem o suplantado por
  padrão**, e só o entregam com o 4º argumento. Quem SOMA o que leu (as faces do
  dado de regeneração, os dados de dano) fica protegido de contar um número que a
  regra já descartou.

⚠ **O limite conhecido**: a disputa é por `(canal, alvo)`, e um efeito **sem
alvo** não briga com um direcionado do mesmo canal. Hoje não vaza, porque as cinco
fontes só direcionam no canal `atributo` (onde todas nomeiam o atributo) e são
globais em todo o resto. Se um dia uma delas der "+N de Acerto só com espadas",
esta conta precisa passar a comparar o global contra cada alvo.

### A Habilidade Única saiu dos 7 canais e foi para os 48

O exemplo do autor (+8 de **Acerto** vindo da arma) **não era escrevível**:
`EQUIP_EFEITO_CANAIS` tinha só Defesa, RD Física, RD Geral, CD, Movimento, PV e PE
máximos, e `bonusAcerto` não estava lá. A Habilidade Única é criada com o Narrador
e não tinha por que ser mais pobre que a Técnica, que já escrevia nos 48 canais.

- `EQUIP_EFEITO_CANAIS` **continua existindo, mas agora é só dos ENCANTAMENTOS.**
- A Habilidade Única passou a usar o `CanalPicker` do Motor (o painel de 620px em
  3 colunas), com **alvo** e com o botão **Ativa / Passiva** por efeito.
- Dois ids mudaram de nome no caminho (`pvMax` → `hp`, `peMax` → `pe`). A troca é
  na LEITURA (`CANAL_UNICA_LEGADO`), sem reescrever ficha.
- ⚠ **`afty-equipamentos.js` NÃO importa `afty-efeitos.js`**, e não é descuido:
  afty-efeitos → afty-combate → afty-habilidades → afty-equipamentos, então a seta
  de volta fecharia o ciclo. Por isso o canal da Habilidade Única passa cru, e quem
  valida é o `aplicarEfeitos`, que já ignora canal desconhecido com aviso.
- O valor viaja **resolvido, como literal**: a expressão da Habilidade Única lê
  `grau`, que é do item e não existe no contexto da criatura.

### Bancada: estados que vêm da FICHA, não do catálogo

`COMBATE_ESTADOS` é catálogo, e uma Habilidade Única ativa é **instância**: duas
armas com habilidade ativa são dois interruptores. Então `resolveCombate` passou a
aceitar `params.estadosExtras`, e devolve a lista em `combate.estadosExtras`, que o
`combateDslVars` transforma em variável (`unica_<uid da entrada>`) e o card da
Simulação de Combate renderiza junto das linhas de catálogo.

⚠ É o mesmo formato que as outras fontes ativas vão pedir: **um Feitiço Auxiliar e
um Shikigami também são instâncias**, e não linhas de catálogo. Quando os canos
deles existirem, o interruptor sai de graça por aqui.

⚠ Um estado extra **não pode colidir** com id de catálogo: se colidir, quem manda é
o catálogo, que é o vocabulário que o conteúdo escrito à mão usa.

### O que falta para fechar a regra

As quatro fontes de fora dependem de infraestrutura que não existe, e são as mesmas
pendências que o placar do Motor já listava:

1. **`afty-feiticos.js` não lê o Motor.** Trava as fontes 2 e 4, e é o mesmo
   bloqueio das 39 habilidades do Conjurador.
2. **Feitiço Auxiliar Passivo não existe** como subtipo (`tipo: "passivo"` está no
   schema do feitiço e nunca foi desenvolvido).
3. **Não existe cano invocação → dono.** As Ações de Auxílio (`resolveAcao`,
   família auxílio) e as Características (`resolveCaracteristica`) resolvem valores
   que ficam na invocação e nunca chegam na ficha de quem invocou.

Quando cada uma chegar, o trabalho é só emitir o efeito com
`exclusivo: "<familia>"` e, se for ativa, um `estadosExtras` com o interruptor.

### ✅ As duas perguntas do pool, RESPONDIDAS (autor, 2026-07-30)

**1. Dado de dano: vale a MAIOR MÉDIA.** Entre `2d6` (média 7) e `1d10` (média 5,5)
fica o `2d6`. Ainda **não há código**, porque nenhuma fonte de dado entrou no pool:
os dois consumidores são o Feitiço Auxiliar e o Shikigami, e os dois esperam cano. O
caminho quando chegarem é o emissor converter o dado na média ANTES de emitir, e aí
a disputa acontece pelo mesmo `resolverExclusivos` de sempre, sem caso especial.

**2. Penalidade: fica sempre a PIOR.** Palavras dele: "Penalidade você pode sempre
deixar a PIOR. Como por exemplo entre -14 e -8. Ficaria o -14." **Implementado.** O
SINAL entrou na chave da disputa (`chaveExclusiva`), então bônus e penalidade
disputam separado: o positivo fica com o maior, o negativo fica com o menor, e os
dois vencedores somam. Um canal com +8 e -14 resulta em **-6**, porque a disputa só
acontece entre iguais. O `jaAplicado` dos estágios também respeita o sinal: numa
penalidade só entra o que PIORA o que já valia, senão um -8 depois de um -14
somaria +6 e apagaria parte da penalidade.

### EXPANSÃO DE DOMÍNIO (portada da 2.5.2)

`src/systems/afty/afty-dominios.js` + card `DominioCard` na aba **Habilidades**,
que **só aparece para quem tem a aptidão Expansão de Domínio Incompleta**. Cópia
adaptada de `src/components/fm-domain-calc.js`, com a procedência anotada no topo
do arquivo (a 2.5.2 é somente-leitura, então não dá para importar).

O que a criatura escreve: nome, versão, aparência, os efeitos (categoria, tipo,
Fortalecido, nome e descrição próprios), os dois atributos do Aumento de Atributo,
os tipos de dano da Redução de Dano, e o Acerto Garantido. O card mostra custo,
duração, área, PV do domo, o contador de vagas e o **texto pronto** da expansão.

**Uma expansão de cada vez.** `creature.dominioAtivoId` guarda a escolha da bancada do criador. Na
ficha final, a sessão guarda o id em `combate.dominioAtivo`, porque o combate da sessão substitui a
bancada. A aba Buffs mostra uma opção por expansão. `dominioEmUso` resolve os dois caminhos e mantém
compatibilidade com o booleano antigo.

**Ponte com o Motor:** os efeitos que caem sobre a PRÓPRIA ficha viram efeitos
temporários presos ao estado `dominio_ativo` da Simulação de Combate ou da sessão. Entram os efeitos
básicos de nível de Aptidão, Movimento, Custo de Feitiço e benefício gratuito de Ritual, além de
Aumento de CD, Aumento de Dano corporal e de Feitiço, Aumento de Atributo, Redução de Dano, Defesa,
RD ignorada e remoção de resistência. Os alvos `feitico`, `arma` e `basico` mantêm cada bônus no
escopo correto. Ficam de fora da ficha do dono os três Ambientais, que agem sobre criaturas hostis.
Confronto de Domínio foi adiado pelo autor. Ritual já calcula Dano e Cura, enquanto Auxiliares e
Especiais aguardam integração dessas categorias com `resolveRitual`.

**O que o livro do AFTY confirma** (e bate com a 2.5.2): custo 15 e 20 PE, +5 do
Acerto Garantido, duração `1 + DOM` e `3 + DOM`, área `4,5 m × BT` e 9 m.

⚠ **O que NÃO tem fonte no Afty.** O "Guia de Criação de Expansões de Domínio" que
as aptidões citam nunca foi enviado para cá, então estes vieram da 2.5.2 e são
ponto de partida, não regra confirmada: as **tabelas de efeito inteiras**, o limite
de efeitos por DOM (1 no 1-2, 2 no 3-4, 3 no 5), o **Fortalecer** (2 vagas, ×1,5),
o teto de DOM 3 na Incompleta, os 5 efeitos base e a Modificação Completa (que
ficou de fora por completo).

**Aparência (2026-07-30, segunda passada).** O autor pediu para replicar o
acabamento da 2.5.2, que ficou melhor que o primeiro corte. O que entrou:

- **Bloco de regra** (`DominioTexto`, espelho do `DomainText.jsx`): título entre
  filetes, aparência, faixa com "Nome [Expansão X]" e o corpo em bullets com o
  título em destaque. O marcador fica em coluna própria, para a linha quebrada
  alinhar sob o texto e não sob a bolinha.
- **Bloco de números** em fonte monoespaçada: Execução, Custo, Duração,
  Distância e PV da barreira numa linha só, mais o contador de vagas e o aviso
  âmbar do teto de DOM 3 da Incompleta.
- **Efeito recolhível**: fechado mostra nome, o selo de reforço e a grandeza. O
  Fortalecido trava quando não há folga de vaga.
- Um `details` com os efeitos base da abertura, como na 2.5.2.

⚠ **DIFERENÇA DELIBERADA PARA A 2.5.2**: lá os efeitos base ficavam SÓ no
`details` do formulário e não entravam no texto final. O autor pediu que o retorno
já venha com eles prontos, então eles entram no texto, na frente dos escolhidos.
Cada um ganhou TÍTULO separado do corpo, senão o bullet inteiro sairia em negrito.

⚠ **UMA DIVERGÊNCIA CONCRETA JÁ ACHADA, e o Afty venceu.** O PV do domo é `12 ×
PV da parede` nas duas, mas a parede mudou:

| | PV da parede |
|---|---|
| 2.5.2 | `15 + BAR × metade do ND` |
| **Afty** (Técnicas de Barreira, verbatim) | `5 + BAR × metade do ND` |
| **Afty** com Paredes Resistentes | `10 + BAR × ND` |

O código segue o Afty, e Paredes Resistentes entra na conta (ela não existe na
2.5.2). **A confirmar:** que o domo continua valendo 12 paredes no Afty, porque o
"dobro das seis paredes" é regra da 2.5.2 e o livro do Afty não repete a conta.

### Pré-requisito de PERÍCIA das Aptidões passou a travar

Reportado pelo autor: "Aptidões que requerem Treinamento e Mestre em Pericias não
estão cobrando o pre requisito." Estava certo. Esses requisitos foram transcritos
como `nota` em 2026-07-16, quando as Perícias ainda não existiam no Afty, e `nota`
exibe sem bloquear. As Perícias existem desde então e ninguém voltou para promover.

Entrou o tipo `pericia` no `avaliarRequisitoAptidao`, com `pericia` e `nivel`
("treinado" ou "mestre"). **Nove requisitos convertidos**, em Aura Controlada,
Enganação Projetada, Cesta Oca de Vime, Energia Reversa, Anular Técnica, Acerto
Garantido, Expansão sem Barreiras e Pináculo Físico.

Duas decisões que valem registrar:

- **Lê a proficiência RESOLVIDA** (`derived.periciaProf`), e não a escolhida na
  ficha. O Motor concede faixa pelo canal `proficienciaPericia`, então quem ganhou
  Mestre de uma habilidade atende ao requisito sem ter gasto vaga.
- **Mestre atende a um requisito de Treinado**, porque a faixa é escala e não
  categoria. O contrário não vale.

⚠ Sobrou **UMA** `nota` no catálogo inteiro, e ela está certa assim: "Capacidade
de Conjurar Feitiços Nível 4" (Anular Técnica), que é sobre acesso a nível de
Feitiço e não sobre perícia.

### APTIDÕES AMALDIÇOADAS no Motor (a passada adiada desde 2026-07-16)

Feita a "passada de efeitos" que o autor adiou até o catálogo fechar. Entrou
`APTIDAO_EFEITOS` (em `afty-efeitos-conteudo.js`), o coletor
`coletarEfeitosAptidao(creature, semEnergia)` e o `requerAptidao` na bancada, irmão
do `requerHabilidade` e do `requerTalento`.

**Placar: 11 de 62** nas cinco categorias pedidas.

| Categoria | Ligadas | Total |
|---|---|---|
| Aura | 5 | 27 |
| Controle e Leitura | 4 | 17 |
| Energia Reversa | 2 | 7 |
| Barreira | 0 | 5 |
| Domínio | 0 | 6 |

⚠ **O rendimento é baixo, e não é por falta de trabalho.** As Aptidões
Amaldiçoadas são, na esmagadora maioria, ATIVAS e pagas em PE, com efeito sobre
INIMIGOS ou ALIADOS, ou expressas em DADOS com face própria. Nenhuma das três
coisas é número passivo de ficha. O balanço abaixo nomeia o bloqueio de cada uma
que ficou de fora, e nenhuma sobrou sem motivo.

**As 11 que entraram:**

| Aptidão | Onde | Como |
|---|---|---|
| Aura Controlada | passiva | `bonusPericia` furtividade, `piso(au / 2)` |
| Aura de Contenção | passiva | `bonusManobra` + `resistirManobra` em agarrar, `piso(au / 2)` |
| Aura Maciça | passiva | `defesa`, `au` |
| Aura Reforçada | passiva | `rdFisico`, `dobro(au)` |
| Aura Excessiva | bancada | `rdGeral`, `dobro(au)` |
| Cobrir-se | bancada | `pvTemporario`, 4 por PE gasto |
| Cobertura Avançada | bancada | delta de +4 por PE sobre o Cobrir-se |
| Estímulo Muscular | bancada | `bonusPericia` +1 por PE em Acrobacia e Atletismo, `distanciaEmpurrao` de `cl × 1,5` |
| Estímulo Muscular Avançado | bancada | deltas de +1 por PE nos mesmos dois alvos e de mais `cl × 1,5` |
| Fluxo Constante | bancada | `dadosRegeneracao`, `regeneracaoDado` e `regeneracao` |
| Cura Amplificada | bancada | dado sobe para d8 e o modificador dobra |

Dois encaixes que valem registrar, porque não eram óbvios:

- **Aura Excessiva → `rdGeral`.** O texto diz "RD contra todos os tipos de dano,
  exceto na alma", que é a definição EXATA da RD Geral no Afty. É justamente por
  isso que o Dano na Alma ganhou canal próprio em 2026-07-29.
- **Fluxo Constante → canais de Regeneração.** A cura de Energia Reversa é Ação
  Comum, e por isso a aptidão base fica de fora. O Fluxo Constante é quem a torna
  "no começo do seu turno, como ação livre", e cura no início do turno É o canal de
  Regeneração, que já carregava dados, faces e parte fixa.

**Os cinco bloqueios, por quantas aptidões cada um trava:**

| # | Bloqueio | Trava | Onde |
|---|---|---|---|
| 1 | **Dado com FACE PRÓPRIA** | **13** | Canalizar em Golpe (×3), Projetar Energia (×4), Aura Elemental, Absorção Elemental, Aura Lacerante, Aura Drenadora, Concentrar Aura, Canalizar Energia Reversa |
| 2 | Efeito em INIMIGO ou ALIADO | 8 | Aura do Bastião, do Comandante (×2), Chamativa, Macabra, Movediça, Enganação Projetada, Aura Inofensiva |
| 3 | CURA não é stat da ficha | 5 | Energia Reversa, Regeneração Aprimorada, Liberação, Cura em Grupo, e a parte de cura da Amplificada |
| 4 | Barreira é ENTIDADE, não stat | 5 | as 5 de Barreira (parede tem PV próprio) |
| 5 | Expansão de Domínio é outro subsistema | 4 | Incompleta, Completa, Acerto Garantido, sem Barreiras |

Mais nove casos avulsos: resistência que é METADE do dano e não RD (Aura
Impenetrável, Casulo de Energia), RD por tipo elemental (Aura Elemental Reforçada),
escolha aninhada de elemento (Afinidade Ampliada), chance percentual (Aura
Embaçada), situacional por rolagem (Aura Anuladora, Golpe com Aura, Aura
Redirecionadora) e transferir para outro (Transferência de Aura). Mais os três
testes narrativos de Controle e Leitura (Leitura de Aura, Leitura Rápida, Rastreio
Avançado), Expandir Aura, Punho Divergente, Emoção da Pétala Decadente, Anular
Técnica e Revestimento de Domínio.

⚠ **O bloqueio 1 é o maior de todo o sistema, não só das Aptidões.** Um canal que
carregue "N dados de X faces" resolveria 13 aptidões de uma vez, e ele já é
conhecido de dois outros lugares: o `dadosDano` de hoje usa o dado da LINHA (então
"1d6 por ponto gasto" não é escrevível) e o pool exclusivo vai precisar dele para
comparar `2d6` contra `1d10`, que o autor já respondeu que é pela **maior média**.

### ✅ As quatro perguntas das Aptidões, RESPONDIDAS (autor, 2026-07-30)

1. **Degraus de nível da Energia Reversa: POR PONTO GASTO.** Confirmado pelo
   AppScript que o autor usa na planilha (`qtdDados = perGasto * dadosPorPer`, com
   `dadosPorPer` subindo em 10, 15 e 20). A leitura do código estava certa.
   O mesmo script confirmou d6/d8 e o modificador entrando **uma vez**, dobrado com
   a Cura Amplificada. E revelou uma peça que faltava: **Cura em Grupo soma +2 no
   teto de PER**, agora ligada.
2. **"Presença OU Sabedoria" é o MAIOR dos dois.** A decisão **C3 está FECHADA**, e
   vale para as ~10 habilidades que usam a mesma fórmula.
3. **Estímulo Muscular fica como está.** Palavras do autor: "Não precisa de seletor,
   só aumenta os valores e a pessoa vê o quê ela quer, usa o teste e desativa."
   **Correção de alvo em 2026-08-16:** continuar sem seletor não significa atingir toda perícia.
   O bônus vale somente em Acrobacia ou Atletismo.
4. **RD Específica vai VIRAR RD POR TIPO DE DANO.** Ela era o jeito do autor de
   tratar RD contra um tipo único (Queimante, Congelante e derivados), porque eram
   poucos casos. Ele decidiu trocar por uma RD por tipo de dano do sistema.
   ⚠ **BLOQUEADO NA LISTA:** o `TIPOS_DANO` de `afty-equipamentos.js` tem só
   **quatro** (Cortante, Impacto, Perfurante, Queimante), que são os das armas. Os
   elementais (Congelante e o resto) não existem no código, e o autor vai mandar a
   lista.

### ⚠ Três aptidões do AppScript que NÃO existem no catálogo do Afty

O script de Energia Reversa tem passivas que o catálogo transcrito não cobre:
**Cura Aperfeiçoada** (rerrola 1 e 2 nos dados de cura), **Santidade** (+2 por dado
de cura) e **Semblante Espiritual** (+2 dados e +1 modificador por PER gasto). Tem
também um "Treinamento (+1 PER Max)" que não casa com nenhuma linha conhecida.
Não foram inventadas aqui. Se forem de uma categoria ainda não enviada, o texto
delas ainda falta.

### Simulação de Combate mudou de aba

Saiu de **Especializações** e foi para **Cálculos** (autor, 2026-07-30). Ela é
bancada de balanceamento, então o lugar dela é do lado dos números que ela mexe, e
não no meio das escolhas de especialização. Fica embaixo do card de Cálculos: liga
um estado e a grade acima se move.

⚠ **É arranjo PROVISÓRIO.** Palavras do autor: "Na ficha final vamos precisar
trabalhar bem nela, mas não é o momento." Não tratar a posição atual como decidida.

`patchCombate` deixou de ser prop de `TabEspecializacoes` (ninguém mais o usava lá)
e passou a ser prop de `TabCalculos`.

### 🐛 Hover de fontes cortado nos dois últimos atributos

Sintoma do autor: passar o mouse em **Presença ou Sabedoria** para ver as fontes não
mostrava nada, o painel "ficava para trás da tela".

**Causa:** a tabela de atributos tinha `overflow-hidden`, e ele estava lá só para o
fundo do cabeçalho respeitar o canto arredondado. O `PainelDeFontes` abre para baixo
(`absolute top-full`), então nas duas ÚLTIMAS linhas ele passava da borda de baixo da
tabela e era **recortado**. Nas quatro primeiras havia linha embaixo, e o painel
cabia dentro do container, o que escondia o problema.

**Conserto:** o `overflow-hidden` saiu, e quem arredonda agora é o próprio cabeçalho
(`rounded-t-lg`), que é o único filho com fundo. As linhas têm só `border-t`, então o
canto de baixo não tem nada para recortar.

**Varredura:** os outros 8 pontos com `PainelDeFontes` (Manobras, Perícias e TRs,
linha de Dano, CD de Feitiçaria, aba Cálculos e o Preview) **não** têm ancestral que
recorte. Os demais `overflow-hidden` do arquivo são de duas famílias inofensivas:
truncar texto em cabeçalho recolhível (`flex-1 min-w-0 ... truncate`) e barra de
progresso. O `Card` não recorta.

⚠ **A lição para quem for mexer:** `overflow-hidden` para arredondar canto e painel
absoluto de hover não convivem. Quando o canto precisar de recorte, arredonde o filho
que tem fundo, e não o container.

---

## SESSÃO DE 2026-07-29

Sete frentes fechadas. Cada uma tem detalhe na seção própria mais abaixo.

1. **Atributos reformados.** Três tetos separados (limite 20, sistema 30, absoluto 32), canal
   `limiteAtributo` novo, o canal `atributo` passou a APARAR no limite (antes 36 efeitos furavam o
   20 calados). Hover de fontes no valor e no limite. Ver [Sistema de ATRIBUTOS](#sistema-de-atributos-reformado-em-2026-07-29).
2. **Nível de Aptidão quebra o teto de 5.** Canal `limiteAptidao` novo, irmão do `limiteAtributo`.
   `resolveNiveisAptidao(aptidoes, concedido, limite)` agora recebe o teto por trilha e devolve
   `limite`. A **Expansão de Domínio** foi ligada em 2026-08-12: +2 em `au`, `cl` e `er`, somente
   quando a trilha já possui ao menos Nível 1, com `nivelAptidao` e `limiteAptidao` juntos. As duas
   Habilidades citadas na época continuam dependentes do texto correspondente.
3. **Motor de Automação no Funcionamento Básico.** `core.tecnicaEfeitos` é uma lista
   `[{canal, alvo?, expr, quando?, duracao?}]` que o JOGADOR escreve, com o DSL inteiro e os 48
   canais. Entra no motor por `efeitosDaTecnica` (em `afty-efeitos.js`) e os filtros de estágio
   roteiam pelo canal. ⚠ É o **único** lugar do sistema em que efeito é escrito e não escolhido de
   catálogo, e é por definição: a técnica é única no mundo. Não generalizar isso para habilidade,
   talento, origem ou aptidão, que vêm de catálogo.
4. **Origens Inato e Derivado refeitas e automatizadas.** O shape `grants` MORREU (declarava
   concessão e só pintava selo âmbar, sem alimentar nada) junto do `grantLabel`. Ver [ORIGENS](#origens).
5. **Bônus de atributo de origem virou ALOCADOR** em todas (era par de dropdowns "+2 em / +1 em").
   Inato, Derivado e Feto agora são `distribuir: 3, maxPorAtributo: 2`, o que **afrouxa a regra
   escrita**: passou a caber +1/+1/+1. Foi decisão do autor.
6. **Placar do Motor RECONTADO**: 155/412, e existem **8 caminhos de ligação**, não 1. Contar só
   `HABILIDADE_EFEITOS` subestima feio. Ver o quadro no topo deste doc.
7. **UI**: selo de raridade, `resumo` narrativo das origens, "Ficha em branco" do header, contador
   duplicado de Níveis de Aptidão e o Atributo da Técnica duplicado saíram todos.

### ⚠️ Regras de UI que este chat aprendeu apanhando
- **Nada de texto explicativo na tela.** Sem hint, sem nota, sem fórmula escrita, sem lore. Só
  resultado e aviso. Explicação de número vai no **hover** (`PainelDeFontes` + `derived.partes.*`),
  explicação de item vai no `title`. Eu pus a nota de cada canal embaixo do nome no seletor do Motor
  e o autor respondeu **"Você PIOROU"**, porque triplicou a altura da lista.
- **Lista grande resolve-se com LARGURA, não com agrupamento.** O seletor de canal do Motor é um
  painel de 620px em **3 colunas**, uma linha por item: os 48 cabem sem rolar (~407px de altura
  contra ~2310px da versão em lista). Busca sem acento por nome, grupo e nota, mas ela é atalho, e
  não a única saída.
- **Aviso na tela usa `<AlertTriangle/>` do lucide, NUNCA o caractere `⚠`.** O caractere vem da
  fonte de emoji do sistema (Segoe UI Emoji), com baseline e métricas próprias, então nenhum ajuste
  de flex ou line-height o alinha. Há trava de `no-restricted-syntax` no `eslint.config.js`,
  escopada em `src/systems/afty/**`. Em COMENTÁRIO o `⚠` segue livre e é o estilo do projeto.
- O criador de fichas **calcula, não ensina**. Quem quer saber o que a coisa é narrativamente lê o
  livro.

### Perguntas abertas desta sessão
- **Clã Zenin** ficou com bônus livre entre os 6 atributos, enquanto Gojo, Inumaki e Kamo têm `entre`
  com um par. Era para o Zenin ser restrito também? Se sim, quais dois?
- **Melhorias de Controlador** (as 4) aplicam "numa quantidade de Invocações igual ao seu Bônus de
  Treinamento", e não existe marcador por invocação para isso (só o `marcada` do Concentrar Poder).
  Além disso *Agressividade* precisa de canal de dados de dano e *Resistência* precisa de **RD**, e a
  invocação **não tem RD no stat block**.
- **Precisão** (Melhoria de Controlador) diz "+2 em Jogadas de Ataque **ou** CD". É escolha do
  jogador ou vale para os dois?
- **Controle Disperso** (Apogeu) precisa de um limite de invocações ativas, que não é modelado.
- **Marca Registrada** (Inato): a vaga de Feitiço está ligada, a **redução de 1 PE não**, porque vale
  só para aquele feitiço e `afty-feiticos.js` não lê o Motor.

---

## Contexto rápido

- App: SPA Vite + React 18, **sem backend**, estado em `localStorage`. Deploy: push na `main` → Vercel.
- **O usuário faz os commits.** Nunca rodar git commit/push.
- **Sempre parar e perguntar quando houver dúvida** (o autor pediu isso explicitamente).
- **NUNCA alterar o grimório normal (2.5.2).** Tudo do Afty vive em `src/systems/afty/`. Os arquivos
  de `src/components/` (incluindo `builder-controls.jsx`) são somente-leitura: usar sim, editar não.
- **Regra de estilo do autor: nunca usar em-dash (`—`) nem ponto-e-vírgula (`;`)** em texto visível
  ao usuário (labels, descrições, tooltips, placeholders). Vírgula, dois-pontos e parênteses são OK.
- **Texto de regra vem VERBATIM.** Quando o autor manda tabela ou texto do livro, copiar palavra por
  palavra, sem parafrasear nem resumir. Ele corrige quando eu invento.
- Rota escondida **`/Afty`** (detectada em `src/App.jsx`, sem link em menu) abre o
  `AftyCreatureBuilder` em vez do builder da 2.5.2. Storage ISOLADO (`fm_*_afty_v1`),
  tag `rulesVersion: "afty"`. Fichas Afty só aparecem em `/Afty`.
- **Não há ficha Afty salva ainda** (confirmado pelo autor em 2026-07-16), então renomear chaves de
  dado é seguro, sem migração.
- Verificação: `npx vite build` + `npx eslint src/systems/afty/`. Testes de lógica via
  `node --input-type=module` com um hook de resolução (o import extensionless quebra no node):
  ```
  node --input-type=module -e 'import {register} from "node:module";
  register("data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}", import.meta.url);
  const {deriveAfty}=await import("./src/systems/afty/afty-derive.js"); ...'
  ```
- ⚠️ Não dá para testar render no navegador aqui. O build valida imports/JSX e a lógica é coberta por
  asserts. O teste visual real é no deploy, então o autor revisa a aparência por screenshot.

---

## Arquivos (src/systems/afty/)

- `AftyCreatureBuilder.jsx` o builder tabulado. Abas: Identidade, Informações, Habilidades,
  **Especializações**, **Aptidões**, Inventário, **Interlúdios**,
  Cálculos. Visual igual ao builder 2.5.2 (slate + roxo, dark, reusa
  `../../components/builder-controls`). Ainda em `STUBS`: Habilidades, Inventário.
- `afty-habilidades.js` catálogo das Habilidades de Especialização (só Combatente por ora: 7 Base
  + 8 de 2° nível) + `ESTILOS_DE_COMBATE` + resolvers (`totalHabilidades`, `avaliarAcessoHabilidade`,
  `escolhasConcedidas`, `resolveHabilidades`, `validarCatalogoHabilidades`).
- `afty-especializacoes.js` catálogo das 6 Especializações + resolvers (`especializacoesDisponiveis`,
  `maxEspecializacoes`, `especializacaoObrigatoria`, `tipoObrigatorio`, `normalizeEspecializacoes`,
  `resolveEspecializacoes`, `validarCatalogoEspecializacoes`). **Texto do livro pendente.**
- `afty-derive.js` motor de cálculo por FÓRMULA (ND 1→∞, sem tabela). Adiados: Guarda e Perícias.
- `afty-cura.js` catálogo das LINHAS de cura (`FONTES_CURA`) + `resolveCura` + os dois validadores
  (`validarCatalogoCura`, `validarAlvosDeCura`). Irmão do `resolveDano`, mas o número vem todo do
  Motor: aqui só mora qual linha existe, quando, e o alcance dela.
- `afty-treinamentos.js` catálogo dos 12 Treinamentos (Interlúdios) + resolvers.
- `afty-treinos-especiais.js` catálogo dos **Treinos Especiais** (Interlúdios Adicionais,
  Livro do Narrador p. 22) + resolvers (`normalizeTreinosEspeciais`, `maxVezesTreinoEspecial`,
  `tetosDeTreinoEspecial`, `vezesPorTreinoEspecial`, `focosDeTreinosEspeciais`,
  `efeitosDeTreinoEspecial`, `validarCatalogoTreinosEspeciais`). Escolha REPETÍVEL, sem etapa,
  1 Foco por pega, teto `1 + piso(ND / vezesACada)`. Dois: Treinamento para Feitiço (vaga de
  Feitiço, N 5) e Treinamento para Habilidade (vaga de Habilidade, N 10).
- `afty-aptidoes.js` (~1600 linhas) catálogo COMPLETO das 85 Aptidões Amaldiçoadas + trilhas,
  categorias, sub-grupos, `avaliarRequisitoAptidao`, `resolveNiveisAptidao`,
  `validarCatalogoAptidoes`. **É o arquivo mais maduro do sistema: use de modelo.**
- `afty-alto-nivel.js` catálogo de **nível 21+**: 11 Melhorias Superiores, 16 Habilidades Lendárias
  e 6 Habilidades Ápice + resolvers (`totalMelhoriasSuperiores`, `totalHabilidadesLendarias`,
  `altoNivelAtivo`, `avaliarRequisitoAltoNivel`, `avaliarAcessoAltoNivel`, `resolveAltoNivel`,
  `validarCatalogoAltoNivel`). Validador zerado.
- `afty-equipamentos.js` catálogo do capítulo de Equipamentos (armas, propriedades, traços
  especiais, uniformes, escudos, itens especiais) + resolvers (`grauFeiticeiro`,
  `resolveEquipamentos`, `resolveCarga`, `orcamentoDoGrau`, `validarCatalogoEquipamentos`).
  Regras de sistema em `docs/afty-equipamentos.md`.
- `afty-schema.js` `createBlankAfty()` + constantes (tipos, patamares, tamanhos).
- `afty-atributos.js` regras de atributo (métodos, point-buy, valores fixos, rolagem, pool de nível,
  Desenvolvimento, validação `resumoAtributos`).
- `afty-origens.js` catálogo de origens + resolvers (`resolveOrigemAttrBonus`, `resolveDesenvolvimento`).
- `afty-anatomias.js` catálogo das 15 Características de Anatomia (Feto).
- `creature-schema.js` documento-spec anotado (referência).

---

## Cálculo: decisões recentes (IMPORTANTE, mudaram em 2026-07-16)

### Patamar renomeado
O patamar mais alto era "Maldição" e agora é **Beyond**, no rótulo E na chave interna
(`value: "beyond"`). Não sobrou nenhum `maldicao` no código. As fórmulas transcritas em
`afty-formulas-base.md` ainda dizem "Maldição" porque são cópia literal da planilha do autor.

Patamares: **Comum, Desafio, Calamidade, Beyond** (não existe Lacaio no Afty).

### HP: o `×2` da planilha foi absorvido
A planilha fazia `(base) × 2 × patamarMult{comum 1, desafio 1, calamidade 1,5, beyond 2}`, ou seja,
um efetivo de **2/2/3/4** sobre a base, com o Comum empatado com o Desafio. O `×2` era, na prática,
o multiplicador do Desafio. Foi absorvido no multiplicador:

```
HP = round( almaMult × (hpBase + ND·modCon + treino.hp) × HP_PATAMAR_MULT[patamar] )
HP_PATAMAR_MULT = { comum: 1, desafio: 2, calamidade: 3, beyond: 4 }
```

Só o **Comum** mudou de valor (caiu pela metade). Desafio, Calamidade e Beyond seguem idênticos ao
que sempre foram. Como `treino.hp` está dentro do parêntese, ele escala junto: Resistência 1ª
(+4 na base) dá +4 no Comum, +8 no Desafio, +12 na Calamidade, +16 no Beyond.

### Resistência Parcial (regra nova, substituiu a "gambiarra")
| Patamar | Ganha +1 em | Faixa |
|---|---|---|
| Comum | (nada) | 0 |
| Desafio | (nada) | 0 |
| Calamidade | ND 10, 20, 30 | 0 a 3 |
| Beyond | ND 1, 10, 20, 30 | 1 a 4 |

Como `nd` tem piso 1, o limiar de ND 1 do Beyond é constante no código.

### Maestria continua "Maestria"
No livro, Maestria == Treinamento (mesmo valor). O autor cogitou renomear para "Treinamento" e
**decidiu manter Maestria** (2026-07-16), porque Interlúdios já usa `treinamentos` (estado da ficha),
`treino` (efeitos agregados) e "Treino de X" (as 12 trilhas). Um quarto "Treinamento" colidiria.

---

## Sistema de ATRIBUTOS (reformado em 2026-07-29)

- 6 atributos: Força, Destreza, Constituição, Inteligência, Sabedoria, **Presença** (não Carisma).
- **3 métodos** (o GM escolhe): Compra por Pontos (17 pts, faixa 8 a 15), Valores Fixos
  (15,14,13,12,10,8, dropdown com TROCA, sem travar), Rolagem (4d6 dropa menor). "Nível" == ND.
- **Pontos de nível**: a cada 4 ND, pool separado, 1:1, teto = limite efetivo. A quantidade por ciclo
  depende do **Patamar**: Comum/Desafio = 2, Calamidade/Beyond = 3
  (`floor(ND/4) * ATTR_POR_CICLO`, em `afty-atributos.js`). Bate com a planilha (Total.Atributos).
- **Atributo efetivo = base + nível + Desenvolvimento + origem + equipamento + Motor**, aparado nos
  três tetos abaixo. Exposto em `derived.attrEff`, `derived.mods`, `derived.attrLimiteEfetivo`,
  `derived.attrDesenv`, `derived.attrBonus`, `derived.attrEquip`, `derived.attrMotor`,
  `derived.attrPerda`, `derived.partesAtributo`, `derived.partesLimite`.
- Aba de Atributos = tabela compacta (Atributo, Base, Nível, Efetivo, Limite), com **hover de fontes
  no Efetivo e no Limite** (`PainelDeFontes`) e chips verdes por fonte concedida embaixo do nome.

### ⚠️ TRÊS TETOS, não um (autor, 2026-07-29)
Confundi-los foi o bug que esta reforma consertou: até aqui só o 30 existia no código, e **36
efeitos do Motor mais o Treino de Atributo furavam o limite de 20 calados**.

| Teto | Valor | Vale para | Constante |
|---|---|---|---|
| **Limite do atributo** | 20 | toda fonte de valor, "a não ser que alguma habilidade diga o oposto" | `ATTR_LIMITE_PADRAO` |
| **Teto do sistema** | 30 | independe da fonte, inclusive quem fura o limite do atributo | `ATTR_LIMITE_MAX` |
| **Teto absoluto** | 32 | só o Aperfeiçoamento de Atributo (Lendária) | `ATTR_LIMITE_ABSOLUTO` |

Quem apara é o `somarAtributo` de `afty-derive.js`. A parcela do `furaTeto` é somada **separada, por
último**: aparar o total contra o 32 daria carona às outras fontes da mesma ficha.

### As 5 fontes que sobem o LIMITE (todas ligadas)
Canal `limiteAtributo` (alvo por atributo), resolvido em `CANAIS_PRE_CONTEXTO`, porque ele É o teto
contra o qual o estágio 1 apara o canal `atributo`.

| Fonte | Texto | Como entra |
|---|---|---|
| **Desenvolvimento Inesperado** (Derivado) | +1 valor e +1 limite por ponto | fora do Motor, `resolveDesenvolvimento` |
| **Ápice Corporal Humano** (Restringido) | limite 30 em For, Des, Con | `limiteAtributoDaOrigem` + o Tipo |
| **Incremento de Atributo** (Talento) | "o valor **e o limite**... em 2" | `limiteAtributo` +2 |
| **Quebra de Limites** (Talento, Derivado) | "o limite dos dois atributos... em 2" | `limiteAtributo` +2, dois alvos |
| **Treino de Atributo, Completo** | "+2 no limite, até o máximo de 30" | `limiteAtributo` +2 |

⚠ Consequência de REGRA do Treino de Atributo: a linha inteira num atributo já no 20 rende **+2, e
não +4**, porque as 4 etapas dão +4 de valor e o Completo abre só 2 de espaço.

Os 6 **acessórios de atributo** (Anéis do Conhecimento, Bracelete da Força...) são caso diferente:
eles não sobem o limite, eles **furam** ("podendo superar o seu limite de atributo, até o máximo de
30"). Entram pela `folgaEquip`, que levanta o teto daquele atributo só pelo que o acessório
contribuiu, sem levantar o teto do Motor.

### Regras de bônus de atributo (IMPORTANTES)
- Bônus de origem é **efetivo e grátis** (soma no valor, não gasta orçamento).
- Bônus de origem **NÃO passa o limite**, salvo os que disserem explicitamente (TODO no motor).
- Se um bônus concedido passaria do limite, os **pontos de Nível são DEVOLVIDOS ao pool** (a
  concessão tem prioridade). Ver `setOrigemBonus` no builder + o `nivMax` que reserva espaço para
  origem, Desenvolvimento **e Motor** (`derived.attrMotor`, só o estágio permanente).
- Quando ainda assim sobra ponto sem espaço, ele aparece em `derived.attrPerda` e o builder mostra o
  aviso "N pontos de bônus perdidos no limite" mais o número efetivo em âmbar. Nada de perda calada.
- **`resumoAtributos(creature, limitesEfetivos, perdas)`** recebe o limite de fora. Ele calculava o
  próprio até esta reforma, e por isso avisava errado em toda ficha de Restringido.
- `creature.attrLimite` (20 fixo no schema, nenhuma UI edita) sobrou como **piso**, para um override
  manual do Mestre. Não é mais fonte de verdade: quem manda é `derived.attrLimiteEfetivo`.

---

## ORIGENS

Conteúdo em `afty-origens.js`. Bônus de Atributo tem 2 formatos, ambos em `core.origem.bonusAtributos`:
- **escolhaDoJogador** `{pontos:[2,1]}` → seletores "+2 em / +1 em" (Inato, Derivado, Feto).
- **distribuir** `{distribuir:N, maxPorAtributo:M}` → alocador (Sem Técnica: 4, máx 3).

⚠ **O shape `grants` MORREU em 2026-07-29.** Ele declarava concessão (`{ tipo: "talento",
quantidade: 1, ndMin: 1 }`) e só pintava um selo âmbar via `grantLabel`: a UI anunciava e a ficha
não recebia nada. As duas usuárias (Inato e Derivado) foram refeitas com efeito de verdade em
`ORIGEM_EFEITOS`, e `grantLabel` foi removido. **Não reintroduzir.**

Concessão de origem agora é canal do Motor, como em qualquer outra fonte: `vagasHabilidade` para
Talento (mesmo orçamento), `vagasFeitico` para Feitiço, `vagasAptidao` para Aptidão Amaldiçoada,
`vagasPericia` para perícia treinada. O que o Motor cobre só EM PARTE se declara no campo
**`parcial`** da característica, que a UI mostra como aviso âmbar em vez de fingir automação.

⚠ **O selo de RARIDADE (Comum / Rara) saiu** a pedido do autor (2026-07-29), do catálogo e da UI.
Não mudava regra nenhuma e competia por atenção com os chips que mudam.

✅ **RESOLVIDA a pergunta aberta desde 2026-07-16**: a Aptidão Amaldiçoada de Aura do Derivado é
**vaga, não gasto** de orçamento. Duas razões: alvo NOMEADO é concessão grátis pela convenção do
projeto, e desde que o ND parou de conceder Aptidão Amaldiçoada o orçamento sem a Habilidade Geral
é **zero**, então gastar dele deixaria a característica sem efeito. ⚠ A vaga é genérica: não existe
vaga por categoria para prendê-la em Aura.

| Origem | Status | Notas |
|---|---|---|
| **Inato** | ✅ feito | +2/+1, Talento Natural (`vagasHabilidade: 1 + (nd >= 4)`), Marca Registrada (`vagasFeitico: 1`). **Refeita e automatizada em 2026-07-29.** Falta só a redução de 1 PE do Feitiço |
| **Derivado** | ✅ feito | +2/+1, Energia Antinatural (`vagasAptidao: 1`), **Desenvolvimento Inesperado** (caminho próprio: +1 valor e +1 limite). **Refeita e automatizada em 2026-07-29** |
| **Sem Técnica** | ✅ feito | Bônus = distribuir 4 (máx 3), restrições, Estudos Dedicados, **Empenho Implacável tem CONTINUAÇÃO** (lembrete roxo, completar na aba Habilidades, progressão dos 9 níveis em `niveis:[]`) |
| **Feto Amaldiçoado Híbrido** | ✅ feito | +2/+1, **Físico Amaldiçoado = seletor de anatomia** (pool 1 + 1/5 níveis, 15 anatomias) |
| **Herdado** | ⬜ pendente | catálogo vazio |
| **Corpo Amaldiçoado Mutante** | ⬜ pendente | catálogo vazio |
| **Restringido** | 🟨 parcial | texto vazio, mas o **vínculo com a Especialização já está ligado**: `especializacaoExclusivaId: "restringido"`, força o Tipo e proíbe multiclasse (ver Especializações) |
| **Maldição** | ⬜ pendente | catálogo vazio. Destrava a categoria **Aptidões de Maldição** (`origemId: "maldicao"` em `afty-aptidoes.js`) |

⚠️ O autor sinalizou que essas 3 origens que faltam são **mais complexas e dependem de outras partes**
do sistema, por isso pulou para Interlúdios.

---

## INTERLÚDIOS (aba pronta, catálogo COMPLETO)

`TabInterludios` é um container. Seções:
1. **Treinamento** (funcional): as 12 trilhas do catálogo.
2. **Treinos Especiais** (funcional desde 2026-08-18): o catálogo de `afty-treinos-especiais.js`,
   mais o card informativo que sobrou (**Estudos**), parado esperando o texto verbatim. Regra do autor: para criaturas, qualquer interlúdio que peça
   teste é **sucesso automático**, e é por isso que um Treino Especial não tem contador de sucessos.
   Ver a sessão de 2026-08-18.

### Modelo
- Cada linha tem **4 etapas sequenciais** + **Completo** automático ao concluir a 4ª.
- Etapa custa **Foco(s)**: 1/1/1/2, então linha inteira = 5 Focos.
- **Focos Totais = ND + Outros**, onde "Outros" = bônus de poderes que darão treinos (sistema
  futuro), lido de `creature.focosBonus` (0 por ora). Derivado em `derived.focosTotais`.
  A aba mostra Gastos / Totais no cabeçalho do card (vermelho se estourar).
- Estado na ficha (`creature.treinamentos`), shape MISTO:
  - linha normal: `{ [linhaId]: progresso 0..4 }`
  - linha repetível: `{ [linhaId]: [{ alvo, progresso 1..4 }] }`
  - `normalizeTreinamentos`, `resolveTreinoEfeitos` e `focosGastos` tratam os dois e somam por instância.

### As 12 trilhas (ordem fixa, Perícia sempre por último)
Agilidade, Barreiras, Compreensão, Controle de Energia, Domínios, Energia Reversa, Luta,
Potencial Físico, Resistência, **Manejo de Arma, Atributo, Perícia** (as 3 repetíveis no fim).

### Repetíveis
**Manejo de Arma, Atributo e Perícia** podem ser pegas várias vezes, **uma por alvo distinto**
(não repete o mesmo alvo). Escolha do alvo:
- `alvoTipo: "atributo"` → dropdown dos 6 atributos (Treino de Atributo).
- `alvoTipo: "pericia"` → dropdown do catálogo de perícias da ficha (Treino de Perícia).
- `alvoTipo: "arma"` → dropdown das armas do INVENTÁRIO (Treino de Manejo de Arma, desde
  2026-08-07). Vale a arma carregada, não só a equipada: treinar não é empunhar.
- `alvoTipo: "texto"` → campo livre. Nenhuma linha usa mais, e o caminho fica para uma linha nova
  nascer sem catálogo.

Com 0 instâncias a linha mostra um chip "Repetível" e uma **prévia consultável** das etapas +
Completo em modo `readOnly` (sem botões), para ler a regra sem ativar.

### Efeitos que o motor consome
`resolveTreinoEfeitos` agrega `{ hp, pe, movimento, aptidao, atributo, defesa, aptidaoTrilha }` e
`deriveAfty` soma em HP, PE, Movimento, Defesa e no orçamento de Aptidão. O canal **`atributo`
agrega mas NÃO é consumido** (o motor de atributos usa point-buy + pool de nível).
**`aptidaoTrilha`** são as concessões direcionadas de nível de aptidão (ver seção APTIDÕES).

### Requisitos
- `atributo` (ex. Destreza 14), `atributoOr` (Força ou Destreza 14), `nd` (Nível de Personagem 4):
  **validados, bloqueiam** a etapa.
- `nota` (aptidão/técnica de sistema futuro): só exibe como lembrete roxo, não bloqueia.
- Chip roxo com ✓ quando atendido, cadeado quando falta ou não é validável. Sem contagem de "falta N".

### Pendências dos Treinamentos
- ~~**Aplicação direcionada** do Treino de Atributo~~ **FEITA.** As 4 etapas aplicam +1 no atributo
  escolhido (canal `atributo`, aparado no limite) e o Completo aplica +2 no limite dele (canal
  `limiteAtributo`). Ver a seção Sistema de ATRIBUTOS.
- Bônus de **perícia/arma específica** são texto, esperam esses sistemas.

---

## APTIDÕES (aba funcional, catálogo COMPLETO: 85 aptidões)

`TabAptidoes` tem 2 cards: **Níveis de Aptidão** e **Aptidões Amaldiçoadas**, ambos funcionais.
**As 7 categorias foram transcritas** (2026-07-16), validador zerado:

| Categoria | Qtd |
|---|---|
| Aura | 27 |
| Controle e Leitura | 17 |
| Barreira | 5 |
| Domínio | 6 |
| Energia Reversa | 7 |
| Especiais | 5 |
| Maldição | 18 (em 3 sub-grupos) |

**Falta ligar os EFEITOS** (ver seção própria abaixo). Hoje o catálogo só trava requisito.

### Sub-grupos (só Maldição usa)
O livro divide as exclusivas de maldição em **Anatomia (9)**, **Controle e Leitura (4)** e
**Especiais (5)**, com resumo próprio. Modelado com o campo `subcategoria` na aptidão +
`APTIDAO_SUBCATEGORIAS` + `subgruposDaCategoria(catId)`, que devolve `null` para categoria plana
(a UI então lista direto, sem cabeçalho).

⚠ **Ids de Maldição levam prefixo `mal_`**. Os nomes repetem os da lista padrão DE PROPÓSITO
("Absorção Elemental" existe em Aura e em Maldição, com textos diferentes), e os sub-grupos
repetem nomes de categorias de topo. O prefixo mantém id único sem mexer no nome do livro.
O validador aceita nome repetido ENTRE categorias e acusa nome repetido DENTRO de uma.

### ✅ O livro confirmou a troca de aba de Maldição
"Uma maldição também pode escolher aptidões amaldiçoadas da lista padrão, **exceto pelas
aptidões de energia reversa**." É exatamente o que `abasAptidao` faz.

### ✅ Texto do livro CONFIRMOU o motor (2026-07-16)
O autor enviou a seção "NÍVEIS DE APTIDÃO", que bate com o que já estava implementado:
- "Em todo nível par (2,4,...,20)... Nos níveis 10 e 20... um nível adicional" == o
  `aptidaoThresholds` do motor, exatamente. O texto **para no 20**, então ND 30 dá os mesmos 12.
- "Todas as aptidões variam do nível 0 até nível 5" == `APTIDAO_NIVEL_MAX`.
- "aumentado através de treinamentos, habilidades, **talentos** ou outras formas" → **Talentos
  são uma 4ª fonte de concessão** (além de Treinamento, Habilidades e Origens).
- As siglas do livro (AU, CL, BAR, DOM, ER) são as chaves usadas no schema. "com BAR 3" no texto
  de uma aptidão == requisito `{tipo:"trilha", trilha:"bar", valor:3}`.

### ⚠️ DOIS orçamentos separados (não confundir)
| | Fórmula | Teto | Onde |
|---|---|---|---|
| **Níveis de Aptidão** (sobe trilha) | limiares de ND pares + Raio Negro + treino livre | **para no ND 20** | `derived.totalAptidao` |
| **Aptidões Amaldiçoadas** (quantas pode ter) | só a **Habilidade Geral Aptidão** | 0 sem ela | `derived.totalAptidoesAmaldicoadas` |

⚠ **ATUALIZADO EM 2026-07-27.** A regra da quantidade era `1 + floor(ND/3)` (1 no ND 1, mais 1
a cada 3 ND), e o autor a **REMOVEU**: o ND não concede Aptidão Amaldiçoada nenhuma. A única
fonte agora é a Habilidade Geral **Aptidão** (`+1 + metade da Maestria` por pega, podendo ser
pega metade da Maestria de vezes). Sem pegar a Geral, o orçamento é **0** em qualquer ND.
Ver a seção HABILIDADES GERAIS e `src/systems/afty/afty-gerais.js`.

O orçamento de **níveis** (a linha de cima) NÃO mudou e segue independente deste.

⚠ **Em aberto**: a origem Derivado concede "uma Aptidão Amaldiçoada de Aura"
(`grants` em `afty-origens.js`). Essa concessão **gasta** o orçamento de aptidões ou é grátis,
como as concessões de nível direcionadas? Não implementado (o seletor de grants de origem não
existe). Confirmar quando for ligar.

### ⚠️ PASSADA DE EFEITOS (adiada de propósito, decisão do autor 2026-07-16)
Hoje o catálogo de aptidões só é lido para **travar requisito**. Nenhuma aptidão escolhida
alimenta `deriveAfty`. O autor decidiu ligar os efeitos **numa passada só, depois que o
catálogo fechar** (faltam Domínio e Maldição), em vez de caso a caso.

O modelo `efeitos` dos Treinamentos (`{tipo, valor}` fixo) **não basta**: várias aptidões
escalam com ND ou com o nível da trilha. Vai precisar de valor computado, não constante.

Efeitos calculáveis já identificados (a lista cresce conforme transcreve):

| Aptidão | Efeito | Canal |
|---|---|---|
| **Raio Negro** | +ND de PE **e** +1 na trilha `au` (direcionado) | pe + aptidaoTrilha |
| **Aura Reforçada** | RD físico = 2 × AU (base numérica de outras 2) | rd |
| **Aura Maciça** | Defesa += AU | defesa |
| **Estoque Ampliado** (mal) | PE += maestria | pe |
| **Revestimento** (mal) | RD físico = maestria | rd |
| **Revestimento Evoluído** (mal) | RD físico = mod Constituição (substitui o de cima) | rd |
| **Crescimento Corporal** (mal) | +1 categoria de tamanho, +1 HP por nível | tamanho + hp |
| **Olhos Adicionais** (mal) | Atenção usa base **12** no lugar de 10 | atencao |

⚠ **Olhos Adicionais quebra uma constante do motor**: `atencao = 10 + Percepção` em
`afty-derive.js` tem o 10 hardcoded. Vai virar variável.

**Raio Negro × Qnt.PE (RESOLVIDO):** a planilha rotulava a célula do `Qnt.PE = Muito Grande`
de "Raio Negro", o que sugeria proxy. O autor confirmou que são **efeitos separados que
somam**: Qnt.PE Muito Grande dá +1 no ORÇAMENTO e **não** dá nível de Aura, e Raio Negro dá
+ND de PE e +1 direcionado em Aura. O `+1` do Qnt.PE em `afty-derive.js` **fica como está**
(só o comentário enganoso foi corrigido).

### Modelo (confirmado pelo autor em 2026-07-16)
- **5 trilhas** de Nível de Aptidão: Aura (`au`), Controle e Leitura (`cl`), Barreiras (`bar`),
  Domínio (`dom`), **Energia Reversa (`er`)**. A `er` foi ADICIONADA ao schema neste passo (o
  Treino de Energia Reversa já citava "Nível de Aptidão em Energia Reversa" e a trilha não existia).
- **Teto de 5 por trilha** (`APTIDAO_NIVEL_MAX`).
- **Orçamento de níveis**: `derived.totalAptidao` = limiares de ND + Raio Negro (PE Muito Grande)
  + concessões de treino **"à sua escolha"**. **Cada ponto sobe 1 nível numa trilha, 1:1.**
  As Aptidões Amaldiçoadas **não gastam este orçamento** (têm o seu próprio, ver acima): o nível
  da trilha é o que as DESBLOQUEIA. Card mostra Gastos / Totais (vermelho se estourar).

### Nível efetivo = alocado + concedido (decisão do autor, 2026-07-16)
O autor sinalizou que **Treinamento, Habilidades de Especialização e Origens também dão Nível
de Aptidão**. Isso expôs um bug: as 4 concessões de treino iam todas para o ORÇAMENTO, então
dava para pegar Treino de Barreiras e gastar o ponto em Domínio. O texto de 3 delas nomeia a
trilha. Agora há **dois canais** de efeito de aptidão (em `resolveTreinoEfeitos`):

| Efeito | Significado | Vai para |
|---|---|---|
| `{tipo:"aptidao", trilha:"bar", valor:1}` | regra NOMEIA a trilha | `treino.aptidaoTrilha.bar`, grátis, fora do orçamento |
| `{tipo:"aptidao", valor:1}` (sem trilha) | "à sua escolha" | `treino.aptidao` → orçamento |

Direcionadas hoje: Barreiras 2ª (`bar`), Controle de Energia 4ª (`cl`), Energia Reversa 2ª (`er`).
Livre: Compreensão Completo. Mesmo padrão do bônus de atributo de origem (efetivo e grátis).

- `resolveNiveisAptidao(aptidoes, concedido)` (em `afty-aptidoes.js`) devolve
  `{ alocado, concedido, efetivo, gastos }`. Exposto em **`derived.aptidao`**, e a aba só exibe.
- **Teto de 5 vale para o TOTAL.** Se alocado 5 + concedido 1, o alocado é aparado para 4 e o
  ponto **volta ao orçamento** (a concessão tem prioridade, igual aos atributos).
- O aparo é **na leitura, não gravado**: se o treino for desfeito, o nível comprado reaparece.
- ⚠ **TODO no motor**: quando Habilidades de Especialização, Origens e **Talentos** existirem,
  somar as concessões deles em `resolveNiveisAptidao` (hoje só `treino.aptidaoTrilha` entra).
  Marcado em `afty-derive.js`.

### UI da aba
- As 5 trilhas num grid **horizontal** (`xl:grid-cols-5` numa fileira, 3 no `lg`, 2 no celular).
  O seletor é segmentado 0..5 com botões `flex-1` (fluido, sem largura fixa) em vez de
  `NumberInput` (que é 36px de altura e some 200px de vertical com 5 trilhas empilhadas).
- Botões = nível **EFETIVO**, preenchendo 1..N como medidor (nível é magnitude, não categoria).
  Roxo = alocado, **verde = concedido** (travado, é piso), apagado = vazio ou sem orçamento.
- **Aptidões recolhidas por padrão** (só nome + chips de requisito, ~36px por linha). São 20 em
  Aura e cada descrição é um parágrafo do livro: abertas de uma vez davam ~2200px de paredão.
  Abre sob demanda e **sem clamp** (quem abriu quer ler a regra inteira).
- Os 3 badges de cabeçalho (Focos, Níveis, Aptidões) usam o MESMO chrome. As abas de categoria
  copiam o estilo da barra de abas do topo da ficha (pílula roxa, `text-sm`, scroll horizontal).
- Estourar o orçamento **não bloqueia** a escolha, só fica vermelho (padrão dos Interlúdios).
  O alocador de níveis, esse sim, desabilita o que não cabe.
- **7 categorias**: as 5 trilhas + **Aptidões Especiais** (não seguem trilha: Raio Negro, Domínio
  Simples, Técnica Máxima) + **Aptidões de Maldição** (exclusivas da origem Maldição).
  ⚠ "Especiais" era "Gerais" até 2026-07-16 (renomeado no rótulo E no id, `especiais`).
  Especiais não TÊM trilha, mas PEDEM trilha como requisito (Raio Negro pede CL 3, Domínio
  Simples pede BAR 1, Abençoado pelas Faíscas Negras pede CL 4 **e** AU 3).
- `APTIDAO_TRILHAS` é DERIVADO de `APTIDAO_CATEGORIAS` (fonte única, sem lista duplicada).

### Abas de categoria (decisão do autor, 2026-07-16)
O card de Aptidões Amaldiçoadas é **tabulado por categoria**. `abasAptidao(creature)` resolve
a ordem, e **Maldição OCUPA O LUGAR de Energia Reversa** (não se soma a ela):

| Origem | Abas |
|---|---|
| qualquer outra | Aura · Controle e Leitura · Barreira · Domínio · **Energia Reversa** · Gerais |
| **Maldição** | Aura · Controle e Leitura · Barreira · Domínio · **Maldição** · Gerais |

As duas nunca coexistem, e Gerais fica sempre no fim. Faz sentido de lore: energia reversa é
o que destrói maldições. `categoriaDisponivel` foi REMOVIDA (as abas já resolvem o acesso, a
categoria travada com cadeado virou código morto).

### ⚠️ Origem MALDIÇÃO não existe ainda
O autor confirmou que **Maldição é uma 8ª origem que falta catalogar** em `afty-origens.js`
(não é o patamar Beyond, que era o nome antigo). Enquanto ela não existir, a aba Maldição é
inalcançável (nenhuma ficha pode ter `core.origem.id === "maldicao"`) e Energia Reversa aparece
sempre. As origens pendentes agora são **4**: Herdado, Corpo Amaldiçoado Mutante, Restringido
e **Maldição**.

⚠️ **Em aberto**: a trilha **ER continua nos Níveis de Aptidão** mesmo na origem Maldição. Se
uma maldição não usa energia reversa, talvez a trilha devesse sumir junto com a aba. O autor
só pediu a troca da aba, então não mexi no card de níveis. Confirmar.

### Catálogo: 27 de Aura transcritas, faltam 6 categorias
O autor mandou **Aptidões de Aura** (27, verbatim, 2026-07-16, em 2 levas). **NÃO usar as
aptidões da 2.5.2** (`src/components/fm-aptidoes.js`) como base: ele confirmou que são outras, e
de fato "Aura de Restrição"/"Aura do General"/"Aura de Rompimento"/"Aura Nefasta" viraram "Aura
de Contenção"/"Aura do Comandante"/"Aura Lacerante"/"Aura Macabra", todas com números diferentes.

**Ordem do catálogo = ordem que o autor mandou, NÃO alfabética.** É proposital: o livro agrupa
cadeias (Aura Elemental → Aura Elemental Reforçada → Absorção Elemental). A UI renderiza na
ordem do array, então ordenar alfabeticamente quebraria esse agrupamento.

O texto pode conter em-dash e ponto-e-vírgula (ex. Aura Reforçada: "danos físicos — cortes,
perfurações e impactos —"). É VERBATIM do livro: a regra de estilo do autor vale para texto que
EU escrevo (labels, avisos), não para a transcrição dele.

Faltam: **Controle e Leitura, Barreira, Domínio, Energia Reversa, Gerais e Maldição.**

Os `[Pré-Requisito: ...]` foram extraídos da descrição para `requisitos` estruturado (padrão dos
Treinamentos). Tipos de requisito em `avaliarRequisitoAptidao`:

| Tipo | Exemplo no livro | Bloqueia? |
|---|---|---|
| `atributo` | "Presença 18" | ✅ |
| `atributoOr` | "Força ou Constituição 16" | ✅ |
| `nd` | "Nível 6" (Nível == ND) | ✅ |
| `trilha` | "Nível de Aptidão em Aura 2" | ✅ |
| `aptidao` | "Aura do Comandante" | ✅ se transcrita, senão exibe e não bloqueia |
| `nota` | "Treinado em Furtividade" (perícias não existem) | ❌ só exibe |

### ✅ Validador ZERADO (2026-07-16)
`validarCatalogoAptidoes()` (validador de conteúdo do roadmap: ids únicos + pré-requisitos
apontando para coisas existentes) acusou 3 referências quebradas na 1ª rodada. O autor mandou as
2 aptidões que faltavam (**Aura Reforçada** e **Aura Impenetrável**) e o validador **zerou**.
Rodar sempre que transcrever conteúdo novo.

**Aura Reforçada** é a base numérica de outras duas: "RD igual a redução de Aura Reforçada" em
*Aura Elemental Reforçada* e *Aura Excessiva* = **2 × Nível de Aptidão em Aura**.

Cadeia de Aura mais longa: Aura Reforçada → Aura Impenetrável (AU 3, ND 10) → Casulo de
Energia (AU 5, ND 16).

⚠ **Referência solta ainda em aberto**: *Aura Movediça* cita **"Expandir Aura"** no texto ("não
pode ser aumentada por Expandir Aura"), que não existe em nenhuma categoria transcrita. Como é
prosa e não pré-requisito, o validador NÃO pega. Provavelmente é Aptidão Geral ou ação. Conferir
quando as Gerais chegarem.

### Oportunidade destravada
`avaliarRequisitoAptidao` tem o tipo `trilha`, que é **verificável**. Vários requisitos dos
Treinamentos hoje são `{tipo:"nota"}` só porque as trilhas não existiam (ex. "Nível de Aptidão
em Barreiras 2" em `afty-treinamentos.js`). Agora dá para promovê-los a requisito real que
bloqueia. Não foi feito neste passo (mudaria o comportamento dos Interlúdios), mas é barato.

---

## ⚠️ DIVERGÊNCIAS planilha × tabelas (aguardando confirmação do autor)

O autor mandou as tabelas dos treinos, que em 3 pontos contradizem a planilha transcrita em
`afty-formulas-base.md`. **Segui as TABELAS nos três** (fonte mais recente e explícita):

| Treino | Planilha dizia | Tabela diz | Código faz |
|---|---|---|---|
| Compreensão 1ª | +1 PE | **+2 PE** | tabela |
| Compreensão 3ª | +2 PE | **+3 PE** | tabela |
| Compreensão 2ª | +1 Aptidão | **bônus de perícia** (sem Aptidão) | tabela |
| Luta 2ª | +3 Defesa | **+2 Defesa** | tabela |
| Resistência 2ª | +5 HP | **dados de vida por descanso** (sem HP máx) | tabela |

A planilha pode estar desatualizada. Confirmar quando der.

---

## SISTEMAS AINDA NÃO CONSTRUÍDOS

- **Talentos** (poderes gerais, base de Habilidades/Especializações).
- **Feitiços** (Técnica Inata = Ações/Características, aba Habilidades, "por último").
- **Perícias** (destrava Atenção, que hoje usa Percepção = 0).
- **Habilidades de Especialização** (a Especialização em si está pronta, faltando só o texto).
- ~~**Armas / Inventário**~~ **FEITO em 2026-07-22**, ver `docs/afty-equipamentos.md`. A aba
  Inventário virou **Equipamentos** e é real: 52 armas, 48 itens especiais, 4 modificações de
  uniforme, 4 escudos, carga e sobrecarga. O campo manual "Grau de Item Equipado" foi REMOVIDO
  junto com `GRAU_DEFESA`/`GRAU_RD` e o "Grau Zero". Falta o capítulo de **Ferramentas
  Amaldiçoadas** (encantar arma, subir de grau), que traz o Grau de Equipamento.
- **Efeitos das 15 anatomias** (RD, ataques, tamanho, movimento, condições).
- Motor: **Guarda** (CU9 = contador de ataques consecutivos), `derived.guarda = null` por ora.
- **Tela de jogo/combate** (rastrear HP/PE/Alma + Resistência Parcial/Guarda).

---

## 🎯 TRABALHO ATUAL: aba de ESPECIALIZAÇÕES (estrutura pronta, falta o TEXTO)

A aba é **funcional** desde 2026-07-17: escolhe, multiclassa, divide níveis e trava por origem.
O que falta é **conteúdo**: `resumo` e `descricao` das 6 estão `""` esperando o texto do livro.
O autor manda VERBATIM. Não inventar, não usar a 2.5.2 como base.

### As 6 Especializações (autor, 2026-07-17)
**Lutador · Combatente · Conjurador · Suporte · Controlador · Restringido**
(ordem do array = ordem que ele mandou, NÃO alfabética, mesma convenção das Aptidões)

**Quando o texto chegar** (decisão do autor, 2026-07-17): descrição **recolhida, abre sob
demanda** — o padrão das Aptidões (linha de ~36px, clica e abre o texto inteiro sem clamp).
Motivo: deixa comparar as 6 antes de escolher. Vai como uma lista abaixo dos chips, do mesmo
jeito que a aba de Aptidões tem o alocador de trilhas EM CIMA e a lista de leitura EMBAIXO.
Não foi feito agora porque seriam 6 linhas vazias.

### ⚠️ COLISÃO DE NOMES com os Tipos — PROPOSITAL
`AFTY_TIPOS` (Combatente/Misto/Conjurador/Restringido) e as Especializações **compartilham 3
nomes** e querem dizer coisas diferentes. O autor confirmou que é de propósito e que os eixos são
**INDEPENDENTES**: Tipo Conjurador + Especialização Combatente é ficha legal. Os catálogos vivem em
arquivos separados, então os ids não colidem de verdade. **Não assuma** que `core.tipo` diz nada
sobre a Especialização (nem o contrário).

### Regras confirmadas (autor, 2026-07-17)
| Pergunta | Resposta |
|---|---|
| Tipo × Especialização | **Independentes.** O Tipo segue escolha manual e dirige fórmula, a Espec só destrava Habilidade |
| Nível da Especialização | **== ND.** `soma(niveis) === ND`, a multiclasse divide o próprio ND |
| Multiclasse | **Até 2, firme** |
| Origem Restringido | força o **TIPO** Restringido **E** a Especialização Restringido, e **proíbe multiclasse** |
| Espec Restringido | **exclusiva** da Origem Restringido (trava nos DOIS sentidos) |

A trava da Origem Restringido é o **ÚNICO** ponto onde os eixos Tipo e Especialização se tocam.
É uma trava de ORIGEM, não uma relação Tipo × Especialização. Não generalize.

### 💡 A ficha guarda o PONTO DE DIVISÃO, não os níveis
Decisão de desenho (2026-07-17). Como `soma(niveis) === ND` é regra dura, uma ficha com 2
especializações tem **um grau de liberdade só**: escolhido o nível da 1ª, o da 2ª é o resto. Com 1
especialização não há escolha nenhuma (o nível é o ND inteiro).

Então `resolveEspecializacoes` **ignora o nível gravado da 2ª** e o deriva. É por isso que os dois
`±` da UI editam o mesmo valor por lados opostos: subir uma classe baixa a outra. Consequências:
- **O estado ilegal deixa de existir.** Não há "soma não bate" para validar: mexer no ND depois
  reflui sozinho na 2ª. Por isso `resolveEspecializacoes` não tem `alocado`/`restante`, e o único
  `erro` possível é `"nenhuma"` (nenhuma escolhida).
- O aparo é **de leitura, não gravado** (mesma convenção de `resolveNiveisAptidao`): baixar o ND
  para 1 e voltar para 20 traz a divisão original de volta.
- Nível mínimo 1 por especialização, então **só cabe multiclasse a partir do ND 2**.
- Shape final: **`[{ id, nivel }]`**. O `nome` do placeholder antigo foi DESCARTADO de propósito
  (o catálogo é a fonte da verdade, gravar o rótulo faria errata de nome deixar ficha mentindo).

### Onde está
- `afty-especializacoes.js` catálogo + resolvers + validador (zerado).
- `derived.especializacoes` = `{ escolhidas, total, max, obrigatoria, completa, erro }`.
  **Não alimenta stat nenhum** (coberto por assert: derivar com e sem espec dá stats idênticos).
- `TabEspecializacoes` no builder. **Desenho APROVADO na 4ª rodada (2026-07-17)**, depois de um
  checkup de UX pedido pelo autor. Ver a seção 🎨 abaixo antes de mexer.
- `setOrigemId` (novo handler): trocar a origem força o Tipo e passa as Especializações pelo
  filtro da origem nova. **O `<Select>` de Origem agora chama `setOrigemId`, não `patchCore`.**
- O `<Select>` de Tipo em `TabInformacoes` fica `disabled` na Origem Restringido.

### 🎨 CHECKUP DE UX (2026-07-17) — a linguagem visual do builder Afty

Levou **3 rodadas** de crítica ("feia e enorme" → "ocupando muito espaço" → "ainda estranho") até
o autor pedir um checkup. As abas que ele aprova são **Aptidões, Interlúdios e Atributos**, e elas
compartilham um vocabulário. Isto vale para QUALQUER aba nova, não só esta:

1. **As opções ficam todas à mostra.** Nenhuma aba aprovada usa dropdown para a escolha
   principal: Aptidões mostra as 5 trilhas, Atributos os 6 atributos, Interlúdios as 12.
   Conjunto pequeno e enumerável = tudo na tela.
2. **Magnitude é MEDIDOR, não campo numérico.** `NivelPicker` preenche 1..N como gauge,
   `ProgressoSegmentos` são pílulas preenchidas. Nada de `NumberInput` para grandeza.
3. **Cresce na HORIZONTAL.** `grow`/`flex-1` numa fileira, reempilhando sozinho no celular.
4. **Nada de widget estrangeiro.** Se o controle não existe em outra aba, ele vai parecer
   estranho mesmo estando compacto. Foi exatamente o que aconteceu com o `<input type="range">`:
   resolveu o espaço e continuou errado.

**Desenho atual (APROVADO, "ficou EXCELENTE"): chips com ± inline.** A aba inteira é UMA fileira.
As 6 são chips (a mesma pílula roxa das abas de categoria de Aptidões, com `aria-pressed`), e na
multiclasse o nível vive DENTRO do chip com `−` e `+` colados. É o formato que o próprio autor já
tinha decidido no roadmap (2026-07-14) para a banda de níveis: *"Punho 12 / Véu 8 com ± inline"*.

- Com **uma** classe: chip mostra o nome + o ND, sem `±` (não há o que dividir).
- Com **duas**: os dois `±` editam o MESMO ponto de divisão por lados opostos (subir uma baixa a
  outra), daí o `slot === 0 ? +delta : -delta` em `ajustar`.
- O chip ativo em multiclasse é uma **`<div>`, não um `<button>`**: o nome e os `±` são alvos
  separados, e `<button>` dentro de `<button>` é HTML inválido. `chipBase` mantém a silhueta
  idêntica à do chip-botão para os dois conviverem na fileira.
- **Sem rodapé explicativo.** As linhas "O nível é o próprio ND (N)..." foram removidas a pedido
  do autor. Só sobra o aviso da Origem Restringido.

⚠️ **Já tentados e REJEITADOS aqui** (não reintroduzir achando que melhora):
`<Select>` para escolher a classe (esconde as 6) · `NumberInput` (36px + rótulo, toma a linha) ·
dois campos de nível independentes · stepper compacto em linha própria · cartão separado só para a
divisão · `<input type="range">` (widget que não existe em nenhum outro lugar do app) ·
**barra proporcional arrastável** (`DivisaoBar`, chegou a ser implementada e aprovada de relance,
mas o autor mandou remover na rodada seguinte) · badge "1 / 2" no `headerRight` (ruído: não há
orçamento a estourar aqui) · `FieldLabel` por campo · card com borda por slot · 2º slot vazio à
mostra (fazia a multiclasse **parecer obrigatória**, e ela é opcional) · rodapé explicando a regra
do ND.

### Perguntas ainda em aberto
- **Banda de níveis no cabeçalho**: o autor decidiu (roadmap, 2026-07-14) que a distribuição fica
  **sempre visível no cabeçalho, ajustável de qualquer aba** ("Punho 12 / Véu 8" com ± inline).
  **NÃO implementado**: hoje a divisão só se ajusta dentro da aba. O motivo da decisão era o
  atrito de escolher uma Habilidade e descobrir que o nível não bate, e **as Habilidades ainda não
  existem**, então o atrito ainda não existe. Fazer junto com a aba de Habilidades.
- ~~**Nível 21+** (Melhorias Superiores, Habilidades Lendárias) segue para o fim.~~ **FEITO em
  2026-07-22**, ver a seção abaixo.

---

## ⭐ NÍVEIS LENDÁRIOS (21+): catálogo COMPLETO

`afty-alto-nivel.js` + o card **Níveis Lendários**, terceiro e último da aba Especializações. Some
inteiro abaixo do ND 21 (decisão do autor: "só aparecerem em Níveis 21+"), em vez de aparecer
zerado.

### Regras confirmadas (autor, 2026-07-22)
| Pergunta | Resposta |
|---|---|
| De onde vem | **Do ND**, não de classe nenhuma. As Especializações não entram (só nos pré-requisitos das Ápices) |
| Melhoria Superior | 1 em todo nível **ÍMPAR** a partir do 21 (21, 23, 25...) |
| Habilidade Lendária | 1 em todo nível **PAR** a partir do 22 (22, 24, 26...) |
| Orçamentos | **Dois, próprios e separados.** Não tocam o orçamento de Habilidades/Talentos |
| Melhoria repete? | Só as que o texto diz: **Alma 2x, CA 2x, CD 2x, Energia 2x, Vida 3x**. As outras 6, uma vez |
| Lendária repete? | **Não, nenhuma** |
| Habilidade Ápice | Escolha ANINHADA de *Atingir Ápice* (ND 26). Vem de graça, **uma por ficha** |
| "20 Níveis de X" | Nível **REAL** da especialização, não o de escalonamento (mesma convenção das Habilidades) |

### Shape na ficha
- `melhoriasSuperiores: []` lista de ids **COM repetição** (cada entrada é uma escolha), então
  `gastos === length` e `vezes(id) === quantas vezes o id aparece`. Foi o shape mais simples que
  casa com "cada repetição custa uma vaga", sem contador paralelo.
- `habilidadesLendarias: []` lista de ids **sem** repetição.
- `escolhasAltoNivel: {}` **campo NOVO**, `{ [id]: [opcaoId] }`, espelhando `escolhasHabilidade`.
  Cobre as 6 escolhas aninhadas: Perícia (Melhoria de Perícia), Teste de Resistência (Melhoria de
  Resistência), Atributo (Aperfeiçoamento de Atributo), 3 Perícias (Conhecimento Iluminado),
  energia ou vigor (Inesgotável) e a Ápice (Atingir Ápice).
- O aparo do `maxVezes` é de **leitura, não gravado** (mesma convenção de `resolveEspecializacoes`
  e `resolveNiveisAptidao`): coberto por assert.

### Requisitos: um tipo NOVO
`avaliarRequisitoAltoNivel` aceita `nd`, `habilidade`, `nota` (os três já existiam noutros
arquivos) mais **`nivelEspec`** `{ espId, valor }`, que é o "20 Níveis de Restringido" das Ápices.
É o primeiro requisito do projeto que lê nível de UMA especialização nomeada.

### ⚠ Pré-requisitos das Ápices que o livro cita e o Afty não tem
O autor decidiu (2026-07-22) que ficam como **`nota`**: aparecem na linha com cadeado roxo e
**não bloqueiam**, para a Ápice não ficar inalcançável. São 3:

| Onde | Citado | Situação |
|---|---|---|
| Fluxo Invencível | **Ápice Corporal Humano** | não existe no Restringido |
| Rei do Tabuleiro | **Flanco** | citado no texto de outras habilidades, mas não é habilidade |
| Rei do Tabuleiro | **Agilidade no Campo de Batalha** | extinta (o autor confirmou) |

Renomes JÁ RESOLVIDOS, apontando para a habilidade real:
- "Dominância em Habilidade" → `cnj_dominancia_em_feitico` (é o mesmo item 5 da errata acima)
- "Especialista em Técnicas" → Especialização **Conjurador**
- "Especialista em Combate" → Especialização **Combatente**

Os dois últimos saem dos próprios pré-requisitos: as habilidades citadas ao lado são `cnj_` e `cmb_`.

### ⚠ EFEITOS: nenhum ligado (mesmo bloqueio de sempre)
O card conta orçamento e trava pré-requisito, e só. Ligar Melhoria de Vida no HP, Melhoria de Alma
na Integridade, Intocável na Defesa etc. depende do **canal de efeito do lado da criatura**, que
não existe (seção D). Coberto por assert: derivar com as 11 Melhorias e as 16 Lendárias dá stats
idênticos a derivar sem nenhuma.

⚠ Quando esse canal existir, **Aperfeiçoamento de Atributo** ("podendo superar o máximo de 30")
quebra o teto duro de 30 do `eff()` em `afty-derive.js`. É a segunda exceção ao teto, depois do
Desenvolvimento Inesperado (que eleva valor E limite juntos, e por isso cabe no modelo atual).

### UI
Um card, **duas abas** (Melhorias Superiores | Habilidades Lendárias), os dois contadores no
`headerRight` com o mesmo chrome dos badges de Aptidões. As linhas são o cartão de 32px que abre
sob demanda, igual a `HabilidadeCard`. Duas coisas novas no vocabulário:
- **`VezesGauge`**: medidor de 2 ou 3 segmentos nas melhorias repetíveis, à direita da linha.
  Segue a regra "magnitude é MEDIDOR, não campo numérico". Clicar no segmento que já é o último
  desce um, então dá para voltar de 3 para 2 sem passar pelo zero.
- **Pool sem descrição vira fileira de pílulas** (Perícias, Atributos, TRs), em vez do cartão com
  checkbox usado nas opções com texto (as 6 Ápices).

### Padrões DESTE projeto que valem reusar (o de Aptidões é o mais recente e maduro)
- **Conteúdo é dado**: catálogo em `afty-<sistema>.js`, ids estáveis, texto verbatim, resolvers
  puros exportados. O builder só exibe.
- **Requisitos estruturados**: extraia `[Pré-Requisito: ...]` da descrição para
  `requisitos: [{tipo, ...}]` e avalie com uma função pura que devolve
  `{ ok, verificavel, label, titulo? }`. Tipos existentes em `afty-aptidoes.js`:
  `atributo`, `atributoOr`, `nd`, `trilha`, `aptidao`, `origem`, `nota` (não bloqueia).
  **Habilidade de Especialização vai precisar de um tipo novo** (ex. `especializacao`).
- **Validador de conteúdo**: copie `validarCatalogoAptidoes()`. Ele pegou 3 referências
  quebradas na 1ª execução. Rode a cada leva nova.
- **Concessão direcionada x orçamento**: se a regra NOMEIA o alvo, é grátis e direcionada; se
  diz "à sua escolha", é ponto de orçamento. Ver `resolveTreinoEfeitos`. Esse erro já foi
  cometido duas vezes neste projeto, não repita.
- **UI**: `Card` + badge de orçamento no `headerRight` (mesmo chrome de Focos/Níveis/Aptidões),
  linhas **recolhidas por padrão** (~32px, altura fixa), requisito como texto puro
  (roxo+cadeado = falta, cinza = atendido), abas no estilo da barra do topo.

---

## HABILIDADES DE ESPECIALIZAÇÃO (aba FUNCIONAL, catálogo só do Combatente)

`afty-habilidades.js` + `TabHabilidades` (2026-07-17). Motor ligado (`derived.habilidades`),
catálogo do Combatente transcrito (38 habilidades), aba construída e navegável.

### 🔴 O ORÇAMENTO NÃO VEM DO ND (atualizado em 2026-07-27)
| | Regra |
|---|---|
| **Livro** | "No 2° nível e a cada nível seguinte, você recebe uma habilidade" (= **ND − 1**, ou 19 no ND 20) |
| **Afty até 2026-07-26** | `1 + floor(ND/3)`, a mesma fórmula das Aptidões Amaldiçoadas (7 no ND 20) |
| **Afty hoje (VALE ESTA)** | só a **Habilidade Geral Especialização**: `+1 + metade da Maestria` por pega, e **0 sem ela** |

O autor removeu a fórmula por ND em 2026-07-27. As duas regras acima são história: **não
reinstalar nenhuma das duas**. Hoje quem dá vaga de Habilidade de Especialização (e, por
tabela, de Talento, que divide o mesmo orçamento) é a Habilidade Geral, em
`src/systems/afty/afty-gerais.js`. O texto verbatim da seção "HABILIDADES DO ESPECIALISTA EM
COMBATE" continua dizendo a regra do livro porque é transcrição, igual ao caso planilha × tabelas.

### Regras (autor, 2026-07-17)
- **Base e por Nível gastam o MESMO orçamento.** No livro as Bases são de graça, no Afty são
  escolhidas igual às por Nível.
- **Orçamento ÚNICO**, vindo do **ND total**, gasto onde o jogador quiser. Numa multiclasse
  Combatente 12 / Suporte 8 o orçamento é o do ND 20 (7), não 5+3.
- **O ACESSO é que muda por especialização**: cada habilidade exige nível **naquela**
  especialização (o lado da multiclasse). O livro sempre conta assim ("seu nível de Especialista
  em Combate", "nos níveis 8° e 16° de Especialista em Combate"), nunca o ND.
- ⚠ **"Base" NÃO quer dizer "inicial"**, quer dizer fixa da especialização. As 7 do Combatente
  são de nível **1, 1, 4, 4, 6, 9 e 20**.

### Nomes: Combatente × "Especialista em Combate"
O livro chama de **Especialista em Combate**. O autor escreve **Combatente** e decidiu que é esse
o nome na tela ("é muito longo e chato de escrever"). O nome do livro sobrevive só dentro do texto
verbatim das habilidades. As outras 5 devem seguir o mesmo padrão (Especialista em X → nome curto).

⚠ **Ids levam prefixo da especialização (`cmb_`)**, mesmo motivo do `mal_` das Aptidões: os nomes
REPETEM entre especializações de propósito. *Teste de Resistência Mestre* vai existir nas 6 ("mestre
no concedido pela **sua** especialização"), com texto próprio. O validador aceita nome repetido
entre especializações e acusa dentro de uma.

### Catálogo: só o Combatente (71), e parcial
| Grupo | Qtd | Notas |
|---|---|---|
| Base | 7 | níveis 1, 1, 4, 4, 6, 9, 20 |
| Por Nível · 2° | 17 | Arremessos Potentes … Zona de Risco |
| Por Nível · 4° | 14 | Aprender Postura … Uso Rápido |
| Por Nível · 6° | 12 | Acervo Amplo … Preparação Rápida |
| Por Nível · 8° | 8 | Aptidões de Combate … Surto de Ação |
| Por Nível · 10° | 6 | Análise Acelerada … Potência Antes de Cair |
| Por Nível · 12° | 5 | Técnicas de Saque … Sincronia Perfeita |
| Por Nível · 16° | 2 | Crítico Aperfeiçoado, Mestre da Postura |

Faltam o **20°** (se houver por-nível; a Base *Autossuficiente* é 20°) e **as 5 outras
especializações** inteiras. Requisitos de habilidade agora formam cadeias longas (10°/12°/16°
apontam para 2°/4°/6°/8°): *Chuva de Arremessos* é a primeira com **dois** pré-requisitos.

⚠ A lista do 4° nível veio **quase** alfabética, mas *Técnicas de Avanço* aparece entre *Arremesso
Rápido* e *Buscar Oportunidade* (provável artefato das 2 colunas do PDF). **Mantida na ordem que o
autor mandou**, que é a regra do projeto. Não alfabetizar "consertando".

### ⚠️ ONDE FICA: dentro da aba ESPECIALIZAÇÕES, não numa aba própria
As Habilidades de Especialização são o **2º card da aba Especializações**, embaixo dos chips
(autor, 2026-07-17). A aba **"Habilidades"** do topo é de **Ações & Características** (segue em
`STUBS`) — os nomes se parecem, as abas não. Componente: `HabilidadesEspecializacao`, renderizado
por `TabEspecializacoes` num fragmento depois do card de chips. Mesmo arranjo da aba de Aptidões
(alocador em cima, lista de leitura embaixo). Não há mais `TabHabilidades` nem entrada no `TABS`.

### UI do card
- **Tabulado pelas especializações ESCOLHIDAS** (1 ou 2), não pelas 6: habilidade de
  especialização que a criatura não tem é ruído. Com uma só, a barra de abas nem aparece.
- Abre na primeira especialização que **tem catálogo** (só Combatente por ora), senão uma ficha
  Lutador/Combatente abria no Lutador e mostrava vazio, escondendo as 38 do Combatente.
- Especialização sem catálogo **diz isso** ("As Habilidades de X ainda não foram transcritas").
- Sem especialização escolhida, o card **não aparece** (os chips logo acima já pedem uma).
- **Cartão recolhido** idêntico ao das Aptidões (32px de altura fixa, abre sob demanda, sem clamp).
- **Grupos de nível em ABAS** (autor, 2026-07-17), não empilhados: com 71 habilidades no
  Combatente a lista vertical virou paredão. Rótulo curto ("Base", "2°", "4°"...), segundo nível de
  abas abaixo das abas de especialização. `grupoTab` guarda a escolha, cai no 1º grupo se ela não
  existe na especialização ativa. Ordem do livro: Base → 2° → 4° → ... (`gruposDeHabilidade`).
- **Contador de escolhidas por aba de nível**: com as habilidades separadas em abas, o que foi pego
  nas outras some da vista, então o badge devolve essa visibilidade (só aparece quando > 0).
- **Sem rodapé.** A nota "no livro as Bases são de graça..." foi removida a pedido do autor.
- **Travada DIZ O QUE FALTA**: "Combatente 6 · faltam 4" (decisão do autor, roadmap 2026-07-14).
  O chip de nível **some quando atendido** (o nível já está na aba), diferente das Aptidões, que
  mostram o requisito atendido em cinza.
- **Já escolhida nunca trava.** Senão redividir a multiclasse prenderia a habilidade na ficha sem
  como remover (mesma regra do `AptidaoCard`).
- Estourar o orçamento fica **vermelho e não bloqueia** (padrão do projeto).

### Escolha ANINHADA (padrão novo do projeto): 2 pools reais
Uma habilidade pode **conter uma escolha** de um pool. Modelado com o campo `escolha`
(`{ id, label, niveis:[...], opcoes:[...] }`) + `escolhasConcedidas(hab, nivelEspec)`, que conta
quantas o nível já liberou. O validador confere que a 1ª concessão não vem antes do nível da
habilidade e que os ids das opções são únicos.

Os dois pools transcritos:
| Pool | Const | Dono | Concede |
|---|---|---|---|
| **Estilos de Combate** (8) | `ESTILOS_DE_COMBATE` | Repertório do Especialista | 1 no nível 1, +1 no 6 e no 12 |
| **Posturas de Combate** (8) | `POSTURAS_DE_COMBATE` | Assumir Postura | 1 no nível 2, +1 no 8 e no 16 |

Concessões EXTRAS do mesmo pool, de outras habilidades (a somar quando o estado existir):
- *Acervo Amplo* (6°) → +1 Estilo.
- *Aprender Postura* (4°) → +1 Postura no nível 4 e outra no 10.
- *Mestre da Postura* (16°) → não concede, deixa usar 2 ao mesmo tempo.

⚠ As 3 últimas Posturas têm pré-req de nível (`nivelMin`): Devastação 6, Tempestade 10, Céu 12.
Ambíguo no livro se é nível de Especialista ou de personagem (aqui tudo mais é de Especialista).
A UI mostra "(Nível N)" ao lado do nome. Resolver a interpretação quando a escolha virar estado.

⚠ **O estado da escolha aninhada ainda NÃO existe na ficha.** `creature.habilidades` é só uma
lista de ids. Vai precisar de algo como `creature.habilidadeEscolhas = { [habId]: [opcaoId] }`,
somando as concessões extras da tabela acima. Na aba, os pools hoje são **só leitura** dentro do
texto aberto da habilidade dona (com contador "N de M liberados"). Não há ficha Afty salva, então
ainda é de graça mudar o shape.

As **artes de combate** (avanço/força/saque) NÃO são escolha aninhada: você aprende AS DUAS, então
são texto verbatim dentro da descrição da habilidade dona (igual às 5 artes da base Artes do
Combate). Todas já transcritas.

### Requisitos
Além do nível (implícito, vem do próprio catálogo), há `requisitos: []` para os extras.
`avaliarRequisitoHabilidade` conhece:
- `habilidade` — "[Pré-Requisito: Assumir Postura]" em *Aprender Postura* e *Preparação Rápida*.
  **Bloqueia.** Referência a habilidade ainda não transcrita exibe o id cru e NÃO bloqueia.
- `nota` — perícia/sistema não construído, só exibe ("Treinado em Feitiçaria" em *Feitiçaria
  Implementada*, "Treinado em Percepção" em *Mira Destrutiva*). Promover a requisito real quando
  Perícias existirem.

⚠ *Acervo Amplo* (6°) **concede +1 Estilo de Combate** — mais um consumidor da escolha aninhada do
Repertório, a somar quando o estado de escolha existir.

### Pendências de conteúdo
- ✅ Posturas (8) e as 6 artes de combate (avanço/força/saque) foram transcritas em 2026-07-17.
- *Armas Escolhidas* e *Grupo Favorito* pedem "escolha um grupo de armas": esperam o catálogo de
  **Armas**, que não existe. Hoje é só texto.
- ⚠ *Aptidões de Combate* (8°) é **REPETÍVEL** ("pode pegar duas vezes, uma para cada aptidão") e
  **concede nível de trilha** (Aura OU Controle e Leitura, +1). Dois problemas de modelo juntos: o
  shape `creature.habilidades` é lista de ids ÚNICOS (não suporta 2x, mesmo caso de *Crescimento
  Corporal* nas Aptidões), e a concessão de trilha entra na passada de efeitos + em
  `resolveNiveisAptidao` (o TODO que já existe em `afty-derive.js` de somar concessões de
  Habilidades). Resolver junto com a passada de efeitos.
- **Artes do Combate** (5 artes) e **Golpe Especial** (11 propriedades) são listas dentro da
  descrição, **não** escolhas de ficha: as artes você sabe todas, e as propriedades do golpe são
  escolhidas na hora de atacar, na mesa. Ficaram como texto verbatim de propósito.

### Efeitos: NADA ligado (mesma postura das Aptidões)
`derived.habilidades` só conta orçamento e acesso. Nenhuma habilidade mexe em stat (coberto por
assert). Vários efeitos são calculáveis e entram na MESMA passada de efeitos das Aptidões:

| Habilidade | Efeito | Canal |
|---|---|---|
| **Implemento Marcial** | +2 CD, +1 nos níveis 8 e 16 de Combatente | cd |
| **Estilo Defensivo** | +2 Defesa, +1 nos níveis 4, 8, 12 e 16 | defesa |
| **Artes do Combate** | Pontos de Preparo = nível de Combatente + mod Sabedoria | recurso novo |
| **Autossuficiente** | 3 PE temporários por Golpe Especial | pe temporário |

⚠ **Artes do Combate abre um recurso NOVO** (Pontos de Preparo), que não é HP/PE/Alma. Vai
precisar de canal próprio no motor e provavelmente de lugar na tela de combate.

---

## LUTADOR (catálogo COMPLETO, 2026-07-22)

70 habilidades transcritas verbatim em `afty-habilidades.js`, prefixo `lut_`:
Base 8 (níveis 1, 1, 2, 4, 5, 9, 11, 20) · 2° 15 · 4° 14 · 6° 13 · 8° 8 · 10° 6 · 12° 4 · 16° 2.
O autor declarou a especialização FECHADA ("finalizamos Lutador com os poderes acima").

- **Pool novo `MANOBRAS_DE_EMPOLGACAO`** (5): escolha aninhada de Empolgação, com
  `niveis: [1, 1, 6, 12, 18]` (o `1` repetido é como `escolhasConcedidas` conta as DUAS do
  nível 1). No nível 18 o Lutador conhece as 5.
- **Manobras Finalizadoras** (6°) NÃO é escolha aninhada: "você recebe acesso as seguintes",
  então as 3 (Ataque Circular, Golpe Certeiro, Quebra Crânio) são texto verbatim dentro da
  habilidade dona, igual às Artes do Combate do Combatente.
- **Requisito `atributo` é novo** em `avaliarRequisitoHabilidade` (Sobrevivente pede
  Constituição 16). Espelha o das Aptidões, usa `ctx.attrEff`, que o builder agora passa.
- ⚠ **`lut_poder_corporal` teve o CABEÇALHO comido pelo PDF** (as duas colunas engoliram o
  título entre *Manobras Finalizadoras* e *Potência Superior*). O nome foi deduzido do
  pré-requisito de *Punhos Letais* (8°), que diz "Poder Corporal", e a posição bate com a ordem
  quase alfabética. **CONFIRMAR com o autor.**
- **Recurso próprio: Nível de Empolgação** (1 a 5, sobe acertando ataque, desce passando uma
  rodada sem acertar). É estado de COMBATE, não de ficha, como os Pontos de Preparo do Combatente.

### Automação: NADA ligado ainda, e o motivo

O autor pediu que tudo que der seja automatizado pelo Motor. **Não deu nenhum**, por um motivo
estrutural: `CONTROLADOR_EFEITOS_INVOCACAO` aplica efeitos DSL sobre **invocações**, e todo efeito
de Lutador é sobre a **própria ficha**. O canal de efeitos do lado da criatura NÃO EXISTE (é a
"passada de efeitos" pendente desde as Aptidões). Assim que ele existir, estes saem de graça,
porque já são fórmulas numéricas incondicionais:

| Habilidade | Fórmula | Canal |
|---|---|---|
| Reflexo Evasivo (base 2) | `piso(nivel_lutador/2)`, todo tipo exceto alma | rd |
| Implemento Marcial (base 4) | `2 + (n>=8) + (n>=16)` | cd |
| Gosto pela Luta (base 5) | `2 + degraus 8/12/16/20` acerto, `1 + degraus 9/13/17` dano e Fortitude | acerto, dano, tr |
| Caminho da Mão Vazia (2°) | dano desarmado `+bt`, acerto desarmado `+piso(bt/2)` | dano, acerto |
| Defesa Marcial (4°) | `1 + piso(bt/2)` | defesa |
| Aprimoramento Marcial (6°) | `piso(bt/2)` | cd |
| Corpo Calejado (6°) | Defesa `+piso(modCon/2)`, PV `+nivel_lutador` | defesa, pv |
| Poder Corporal (6°) | dano desarmado `+2 níveis` | danoNivel |
| Punhos Letais (8°) | ignora RD `= bt`, margem de crítico `-1` | ignorarRd, critico |
| Seja Água (12°) | `+3 m` | deslocamento |
| Corpo Supremo (16°) | `+3 m`, `+4` Defesa, RD `piso(nd/2)` em 3 tipos + 1 à escolha, `piso(nd/4)` no resto | deslocamento, defesa, rd |

Precisam de **canal novo** no motor, além do que já existe:
- **Corpo Treinado** (base 1): o dado de dano desarmado é uma FAIXA (1d8/1d10/1d12/2d8/2d12 nos
  níveis 1/5/9/13/17), não uma soma. Vale reusar `subirNiveisDano` das Invocações.
- **Músculos Desenvolvidos** (4°): TROCA o atributo da Defesa (Força no lugar de Destreza). Não é
  soma, é substituição na fórmula.
- **Alma Quieta / Corpo Sincronizado / Mente em Paz** (10°): vantagem para resistir a condições
  NOMEADAS. Pede canal de vantagem por condição.

**NÃO automatizável (anotado, não tentar):**
- Tudo que lê o **Nível de Empolgação**: Empolgação, Empolgação Máxima, Fluxo, Ignorar Dor,
  Empolgar-se, Insistência, Manobras Finalizadoras, parte de Lutador Superior.
- **Estados ligáveis em combate**: Brutalidade (+ Sanguinária, + Aprimorada), Ataque Inconsequente
  (+ Sequência), Armas Absolutas, Tempestade Sufocante, Fúria da Vingança, Imprudência Motivadora.
- **Reações e usos por PE**: Aparar Ataque, Aparar Projéteis, Devolver Projéteis, Redirecionar
  Força, Segura pra Mim, Golpear Brecha, Resistir, Ação Ágil, Ataque Extra, Voadora, Foguete Sem
  Ré, Golpe da Mão Aberta, Impacto Demolidor, Feitiço e Punho, Oportunista, Atacar e Recuar.
  São os MESMOS gaps já listados em `docs/afty-invocacoes.md` (por rodada, reação, economia de ação).
- **Dependem de sistema inexistente**: Armas (Dedicação em Arma, Um com a Arma, Armas Absolutas,
  Quebrando Tudo, Corpo Arsenal) · Perícias e TR treinado do personagem (Deboche Desconcertante,
  Alma Quieta, Corpo Sincronizado, Mente em Paz, Duro na Queda), hoje como `nota`.
- ⚠ **Aptidões de Luta** (8°) é REPETÍVEL e CONCEDE nível de trilha (Aura ou Controle e Leitura),
  o par de problemas idêntico ao de *Aptidões de Combate*. Resolver os dois na mesma passada.

---

## CONJURADOR (catálogo COMPLETO, 2026-07-22)

66 habilidades verbatim, prefixo `cnj_`: Base 6 (níveis 1, 1, 4, 9, 10, 20) · 2° 14 · 4° 15 ·
6° 12 · 8° 8 · 10° 4 · 12° 5 · 16° 2. No livro é **Especialista em Técnicas**, o autor escreve
**Conjurador** (mesmo caso de Combatente × Especialista em Combate).

**Dois pools novos**, os dois em `afty-habilidades.js`:
- **`MUDANCAS_DE_FUNDAMENTO`** (7), de *Domínio dos Fundamentos* (base 1), `niveis: [1, 1, 12]`.
  *Feitiço Rápido* tem `nivelMin: 6` (o "Pré-Requisito: Nível 6" do livro), mesma convenção das
  últimas Posturas de Combate. *Expansão dos Fundamentos* (8°) concede +1 no 8 e outra no 12, do
  MESMO pool, e *Versatilidade em Fundamentos* (4°) troca as escolhidas num descanso (decisão de
  mesa, a ficha já troca livremente).
- **`FOCOS_AMALDICOADOS`** (3: Destruição, Economia, Refino), de *Foco Amaldiçoado* (base 10),
  `niveis: [10]`. É a escolha de maior impacto mecânico da especialização (dano, custo de PE, CD).

**Requisito `aptidao` é novo** em `avaliarRequisitoHabilidade`, e ao contrário do `nota` ele
**bloqueia de verdade**, porque o catálogo das 85 Aptidões existe. Usa `ctx.aptidoes`, que o
builder agora passa de `draft.aptidoesAmaldicoadas`. Consumidores: *Explosão Defensiva*,
*Físico Amaldiçoado Defensivo* e *Revestimento Constante* (Cobrir-se) e *Expansão Maestral*
(Expansão de Domínio Completa).

### ⚠ Três coisas a confirmar com o autor
1. **"Técnica Precisa" não existe.** *Mira Aperfeiçoada* (8°) diz conceder "a Mudança de
   Fundamento Técnica Precisa", mas a do pool se chama **Feitiço Preciso**. Transcrito verbatim.
2. **"Dominância em Habilidade" não existe.** O pré-requisito de *Manipulação Perfeita* (16°) usa
   esse nome, mas a habilidade de 6° é **Dominância em Feitiço**. O requisito foi apontado para ela.
3. **Dominância em Feitiço arredonda para CIMA** ("metade do nível dele, arredondado para cima"),
   exceção explícita à regra geral do Afty, que é floor.

### Automação: mesmo bloqueio do Lutador
Nada ligado, pelo mesmo motivo: não existe canal de efeito do lado da criatura. E aqui há um
segundo bloqueio, mais duro: **a maioria dos efeitos do Conjurador opera sobre FEITIÇOS**, que
são um sistema inteiro ainda não construído (nível de feitiço, custo em PE, alcance, área,
conjuração, sustentação, rituais, liberações e Técnica Máxima). Enquanto Feitiços não existirem,
nem os números que dependem deles existem.

Prontos para plugar assim que houver canal de criatura (não dependem de Feitiços):
| Habilidade | Fórmula | Canal |
|---|---|---|
| Reforço Amaldiçoado (2°) | `2 + (n>=10) + (n>=20)` na CD de Especialização e Amaldiçoada | cd |
| Reação Rápida (2°) | `+mod(int ou sab)` | iniciativa |
| Energia Inacabável (4°) | `piso(nivel_conjurador/2)` | pe |
| Feitiços Refinados (4°) | `piso(bt/2)` | cd |
| Movimentos Imprevisíveis (4°) | `+mod(int ou sab)`, teto = nível | defesa |
| Olhar Preciso (4°) | `2 + piso(nivel/4)` | acertoAmaldicoado |
| Revestimento Constante (8°) | `bt`, todo tipo exceto alma | rd |
| Sentidos Aguçados (10°) | `+piso(mod/2)` | atencao, pericia |
| O Honrado (base 20) | `+5` CD e `+5` ataque de Feitiço/Aptidão | cd, acertoAmaldicoado |
| Foco · Destruição / Economia / Refino (base 10) | dano, custo e PE máx, ou CD e acerto | vários |

⚠ **Escolha "Int OU Sab" é um padrão NOVO** e aparece em ~10 habilidades do Conjurador. Não é
`atributoOr` (que é requisito, não efeito): é o jogador escolhendo qual mod usar. Vai precisar de
estado na ficha ou de convenção (ex.: usar sempre o maior). **Decidir antes de automatizar.**

**Concessões a somar na passada de efeitos:** *Epifania Amaldiçoada* (4°) dá 1 Aptidão no nível 4
e outra no 12 (direcionada? não, "uma Aptidão Amaldiçoada" à escolha = ORÇAMENTO) · *Elevar
Aptidão* (6°) é REPETÍVEL até BT vezes e dá nível de trilha à escolha (orçamento) · *Foco ·
Refino* dá 1 Aptidão ou Feitiço · *Nova Habilidade* (2°) é repetível SEM limite e cria Feitiços.
Os repetíveis esbarram no mesmo shape de lista de ids únicos de *Aptidões de Combate* e
*Aptidões de Luta*. **Resolver os quatro casos de uma vez.**

---

## SUPORTE (catálogo COMPLETO, 2026-07-22)

58 habilidades verbatim, prefixo `sup_`: Base 8 (níveis 1, 3, 5, 6, 8, 9, 10, 20) · 2° 13 ·
4° 9 · 6° 7 · 8° 9 · 10° 4 · 12° 5 · **14° 1** · 16° 2.

**Pool novo `APOIOS_AVANCADOS`** (5), de *Apoio Avançado* (2°), `niveis: [2, 6, 12]`.
*Apoio Estratégico* tem `nivelMin: 6`. *Apoios Versáteis* (4°) concede +1 no 4 e outro no 10, do
MESMO pool, e *Apoio Abrangente* (14°) deixa aplicar DOIS efeitos por apoio em vez de um.

- **Único grupo de 14° nível do sistema.** `gruposDeHabilidade` ordena por nível sozinho, então
  ele entrou entre o 12° e o 16° sem ajuste nenhum no código.
- **Bases automáticas do Suporte:** Suporte em Combate, Energia Reversa e Liberação de Energia
  Reversa são recebidas ao alcançar o nível e não gastam vaga (autor, 2026-08-10). As duas últimas
  concedem gratuitamente a Aptidão nomeada. O resolvedor separa `selecionadas` de `concedidas`, e a
  UI marca as automáticas como Especialização.

### Coisas que este catálogo trouxe de novo
- **Cura é um eixo inteiro** (Suporte em Combate, Medicina Infalível, Cura Avançada em Grupo,
  Sintonização Vital, Cura Aperfeiçoada, Sobrecura, Descarga Reanimadora, Purificação da Alma).
  O motor não tem canal de cura nenhum. É o maior sistema novo que o Suporte pede.
- ⚠ **Purificação da Alma** (16°) restaura **Integridade/Alma em 50%**. É a PRIMEIRA habilidade
  do sistema que mexe na Alma, e a Alma escala TODO o HP (`× Alma.Atual/100`). Efeito de peso.
- ⚠ **Físico Controlado** (8°) TROCA o atributo do HP (Presença ou Sabedoria no lugar de
  Constituição, teto +4). É substituição de fórmula, igual ao que *Músculos Desenvolvidos*
  (Lutador) pede para a Defesa. Já são **dois** consumidores do mesmo canal de troca.
- ⚠ **Motivação pelo Triunfo** (8°) cita **"Lacaio"**, que é patamar da 2.5.2 e NÃO EXISTE no
  Afty (Comum/Desafio/Calamidade/Beyond). Transcrito verbatim. **Confirmar com o autor.**
- **Aptidões de Suporte** (8°) é o TERCEIRO repetível que concede nível de trilha (com Aptidões
  de Combate e Aptidões de Luta). Os três caem no mesmo par de problemas de modelo.
- Dependem de sistemas inexistentes: **Inventário** (Otimização de Espaço, Ajustes em
  Equipamento) e **Ferramentas** como perícia (Médico, Ferreiro), hoje `nota`.

Prontos para plugar assim que houver canal de criatura:
| Habilidade | Fórmula | Canal |
|---|---|---|
| Mobilidade Avançada (2°) | `+3 m` | deslocamento |
| Pronto para Agir (2°) | `+mod(presenca)` | iniciativa |
| Pré-Análise (4°) | `+5` | atencao |
| Físico Controlado (8°) | troca CON por `min(mod(pre ou sab), 4)` no HP | hp (substituição) |

---

## RESTRINGIDO (catálogo COMPLETO, 2026-07-22) — fecha as 6

54 habilidades verbatim, prefixo `res_`: Base 8 (níveis 1, 2, 2, 3, 4, 9, 10, 20) · 2° 11 ·
4° 8 · 6° 8 · 8° 8 · 10° 5 · 12° 3 · 16° 3. **Com ela o catálogo fecha em 367 habilidades.**

É a especialização SEM energia amaldiçoada: o recurso é **Ponto de Estamina** (4 no ND 1, +4 por
nível). Como é exclusiva da Origem Restringido, que proíbe multiclasse, **nível de Restringido ==
ND sempre**, o que simplifica todo requisito daqui.

**Pool novo `DADIVAS_DO_CEU`** (9), de *Restrito pelos Céus* (base 1), `niveis: [4, 8, 12, 16,
20]` — a primeira só no 4°, daí o `escolha.niveis` começar acima do `nivel` da habilidade dona
(o validador aceita, ele só proíbe conceder ANTES). *Respeito Celeste* (8°) concede mais uma e é
REPETÍVEL (a 2ª vez a partir do 12), o que o shape de ids únicos ainda não suporta.

### 🔴 ROUBO DE HABILIDADE: o primeiro pool COMPUTADO do sistema

*"você pode aprender uma habilidade de Especialista em Combate ou Lutador... Você não pode roubar
habilidades base das outras especializações, exceto Golpe Especial."*

Todo outro pool do projeto é uma lista literal. Este é uma **consulta ao próprio catálogo**:
`HABILIDADES_ROUBAVEIS` = todas as por-nível de Combatente e Lutador + `cmb_golpe_especial`.

✅ **CONFIRMADO (autor, 2026-07-22): são SÓ Combatente e Lutador.** Conjurador, Suporte e
Controlador **não** entram, e Restringido também não. **Versões antigas do sistema deixavam roubar
das outras classes** e é fácil se confundir com isso. Se a dúvida voltar, a resposta já é esta:
não expandir o pool.
**127 opções.** Como não dá para referenciar `AFTY_HABILIDADES` de dentro dele mesmo, as `opcoes`
são atribuídas logo APÓS a construção do array. Verificado por assert: Golpe Especial está no
pool e nenhuma outra Base entrou.

Também trouxe **`escolha.limite: "bt"`**, porque a quantidade é o Bônus de Treinamento e não o
tamanho do pool (o padrão dos repetíveis, que serve para Melhoria de Controlador). `bt` agora
desce de `deriveAfty` → `resolveHabilidades` → `resolveEscolhasHabilidade` → `escolhasMaximas`,
o mesmo caminho que as Invocações já usam.

Verificado num Restringido ND 13 (BT 5): Dádivas 3 de 3, Roubo 3 de 5, `vagasExtras` 2, gastos
4 de 5. Cada roubo consome uma vaga, que é o que o texto pede.

### 📑 O pool do Roubo é TABULADO (2026-07-22)

127 opções numa lista corrida eram um paredão dentro de um cartão que já está aberto sob demanda.
A escolha agora traz **`abas: ["especializacao", "nivel"]`**, e o novo componente
**`OpcoesDeEscolha`** monta uma barra por eixo, encadeadas: escolhida a especialização, a barra de
baixo só oferece os níveis daquela. Resultado:

| Aba | 2° | 4° | 6° | 8° | 10° | 12° | 16° | total |
|---|---|---|---|---|---|---|---|---|
| **Lutador** | 15 | 14 | 13 | 8 | 6 | 4 | 2 | 62 |
| **Combatente** | 17 | 15 | 12 | 8 | 6 | 5 | 2 | 65 |

Maior folha: 17. Decisões que valem lembrar:
- **São os MESMOS dois eixos do card de Habilidades** (especialização e depois nível), de
  propósito: escolher uma habilidade e roubar uma passam a ter a mesma linguagem. As abas só são
  menores (`text-[11px]`), por estarem um nível mais fundo.
- **`abasDeOpcoes(opcoes, eixo)`** (em `afty-habilidades.js`) é genérico e puro. Quem decide se
  tabula é o DADO (`escolha.abas`), não o componente: nenhum outro pool ganhou abas, e um pool
  novo grande só precisa declarar os eixos. Coberto por assert.
- Para o eixo funcionar, `HABILIDADES_ROUBAVEIS` passou a carregar **`especializacaoId`**.
- Cada aba conta quantas opções daquele galho já foram escolhidas, senão o que foi pego nas outras
  sumiria da vista (mesma lição da barra de grupos do card de Habilidades).
- Com o pool tabulado por nível, o **`(Nível N)` sai da linha da opção**: vira ruído, já que o
  nível é a própria aba. Pool sem abas continua mostrando.
- Item sem o campo do eixo cai num balde **"Outros"** em vez de sumir da tela.

**⚠ DUAS DECISÕES PENDENTES DO AUTOR:**
1. **O filtro "desde que tal não dependa do uso de energia amaldiçoada" NÃO está aplicado.** Não
   existe marca de custo em PE no catálogo, e deduzir pelo texto erraria nos dois sentidos. As
   opções são as 127 estruturalmente elegíveis. Caminho sugerido: marcar `usaEnergia: true` nas
   habilidades de Combatente e Lutador que gastam PE, e filtrar. São ~141 para revisar.
2. **O nível da habilidade roubada não BLOQUEIA.** O pool carrega `nivelMin` (o nível da
   habilidade original) e a UI já mostra "(Nível N)", mas não impede escolher. O livro diz "Você
   usa seus níveis de Restringido para os requisitos", ou seja, deveria travar. Hoje um
   Restringido 2 consegue roubar uma habilidade de 16°. Mesma pendência que já existia nas
   Posturas de Combate, mas aqui ela pesa muito mais.

### ⚠ Incoerências do livro (transcritas verbatim)
- **"2 PE" e "1 PE" num personagem sem PE.** *Ação Ágil* (4°) e *Adrenalina Absoluta* (12°) citam
  PE, mas Restringido usa Estamina. *Ação Ágil* parece copiar-colar da homônima do Lutador.
- ***Teste de Resistência Mestre* DIFERE das outras 5**: aqui é "mestre nos DOIS TRs conferidos
  pela sua Especialização", não "treinado num segundo e mestre no concedido".
- ***Valorizar Invocação*** (2°) depende de **domar maldições**, que o autor declarou FORA DE
  ESCOPO para criação de ficha (2026-07-17).
- ***Corpo de Aço*** (6°) soma o **VALOR** de Constituição no PV, não o modificador.

### Pendências de CONTEÚDO (citadas mas não enviadas)
- **ARSENAL AMALDIÇOADO** ("detalhado no final da especialização"), citado em *Restrito pelos Céus*.
- **ESTILO MARCIAL** e as **técnicas marciais** ("explicado após as habilidades da
  especialização"), citados em *Restrito pelos Céus* e em *Desenvolver Ideias* (4°).

---

## TALENTOS (sistema NOVO, completo, 2026-07-22)

51 talentos em `src/systems/afty/afty-talentos.js`, prefixo `tal_`:
**Gerais 43** (20 sem pré-requisito + 23 com) e **de Origem 8**.

### Regras (autor, 2026-07-22)
| Pergunta | Resposta |
|---|---|
| Orçamento | **O MESMO das Habilidades de Especialização** ("pegos no lugar de") |
| Quem pode pegar | **Qualquer especialização.** Não existe `especializacaoId` no catálogo |
| "Nível N" nos pré-requisitos | **É o ND**, nunca o nível de classe |
| Onde fica na UI | **Aba ao lado das especializações.** Numa ficha Restringido: "Restringido \| Talentos" |

### Arquitetura
- Arquivo próprio (`afty-talentos.js`), porque o agrupamento (Gerais/Origem), a semântica de
  nível (ND) e os tipos de requisito diferem das Habilidades. Catálogo + resolvers puros, padrão
  do projeto.
- `resolveTalentos(creature, ctx)` → `{ escolhidas, gastos, inacessiveis }`. **O orçamento NÃO
  vive nele**: `deriveAfty` resolve Talentos ANTES e passa `talentos.gastos` como 3º argumento de
  `resolveHabilidades`, que soma tudo. `derived.talentos` existe só para a UI.
- **Não alimenta stat nenhum** (coberto por assert: derivar com e sem talento dá stats idênticos).
- UI: a barra de abas de `HabilidadesEspecializacao` agora sempre mostra Talentos, e os dois
  catálogos são normalizados para a mesma forma (`{id, titulo, habilidades}`) para reusar a barra
  de grupos e o `HabilidadeCard` sem ramificar a árvore. Talento passa
  `acesso = { ...avaliarAcessoTalento(), nivelOk: true, faltam: 0 }`, então o chip de nível some.

### Tipos de requisito de `avaliarRequisitoTalento`
`nd` · `atributo` · `atributoOr` · `origem` (verificável, as 8 origens existem) · `talento`
(Mestre do Arremesso pede Técnicas de Arremesso) · **`maxComNome`** (novo: "não possuir mais que
dois talentos com o nome Adepto" — conta os escolhidos com o prefixo e bloqueia o 3º) · `nota`.

### ⚠ A confirmar com o autor
1. **Um talento veio SEM cabeçalho**, o mesmo artefato de PDF de *Poder Corporal*: o que começa
   com "Você aperfeiçoa o uso do seu escudo para colocá-lo no seu ataque". Batizado
   **Técnicas Ofensivas de Escudo**, pelo irmão *Técnicas Defensivas de Escudo*, que abre com a
   mesma frase trocando "no seu ataque" por "por completo na sua defesa".
2. **"Técnica Rápida" não existe.** *Adepto de Feitiçaria* exclui "Técnica Rápida" do pool de
   Mudanças de Fundamento, mas a opção se chama **Feitiço Rápido**. Mesma troca Técnica/Feitiço
   de *Mira Aperfeiçoada*. São a mesma?
3. *Determinado a Viver* escreve **"Pré-Requisito: Pré-Requisito:"** duas vezes. Erro de digitação.

### Escolhas aninhadas que os Talentos pedem (nenhuma ligada ainda)
- **Incremento de Atributo** e **Quebra de Limites**: repetíveis, elevam VALOR e LIMITE de
  atributo, exatamente como o Desenvolvimento Inesperado (Derivado). Pedem pool dos 6 atributos.
- **Adepto de Combate** concede uma escolha de `ESTILOS_DE_COMBATE` e **Adepto de Feitiçaria** uma
  de `MUDANCAS_DE_FUNDAMENTO`, os dois pools morando em `afty-habilidades.js`. Primeira escolha
  aninhada que **atravessa arquivos**.
- **Físico Aperfeiçoado**: 1 de 4 efeitos, e os 4 são canais distintos (deslocamento, perícia,
  manobra, pulo). Ficou como texto.
- **Aptidão Desenvolvida** e **Estudo Amaldiçoado** concedem nível de trilha à escolha
  (ORÇAMENTO). Com *Aptidões de Combate/Luta/Suporte*, já são **cinco** consumidores do mesmo
  modelo repetível-que-concede-trilha. Resolver os cinco de uma vez.

---

## PRÓXIMOS PASSOS (depois de Especializações)

1. **Passada de efeitos** das Aptidões (ver seção APTIDÕES). O catálogo FECHOU (85), então o
   pré-requisito que o autor pôs já está satisfeito. Precisa de um modelo de `efeitos` com
   valor COMPUTADO (ND, nível de trilha, maestria), não constante como o dos Treinamentos.
2. Pendências de conteúdo das aptidões:
   - **Modificação Completa** (aptidão de Domínio concedida pelo Treino de Domínios Completo).
     O texto já existe em `MODIFICACAO_COMPLETA` (`afty-treinamentos.js`), mas ela NÃO está no
     catálogo, porque é concedida e não escolhida. Precisa decidir a marca (ex. `apenasConcedida`).
   - ✅ **Crescimento Corporal repetível resolvido em 2026-08-20.** A lista aceita o mesmo id duas
     vezes, e `aptidaoOpcoesRepetidas` guarda Aumentar/Diminuir por aquisição.
   - **Revestimento Evoluído** não lista Revestimento como pré-requisito, embora o texto dependa
     dele. Transcrito verbatim. Confirmar se é typo.
   - **Aptidões de Anatomia (Maldição)** × as 15 Características de Anatomia do Feto
     (`afty-anatomias.js`): conceitos parecidos, conferir se conversam ou colidem.
3. **Promover as `nota` dos Treinamentos**: várias etapas em `afty-treinamentos.js` referenciam
   aptidões/trilhas que hoje EXISTEM ("Técnicas de Barreira", "Expansão de Domínio Incompleta",
   "Energia Reversa", "Nível de Aptidão em Barreiras 2"). Continuam como `nota` (não bloqueiam)
   só porque o `avaliarRequisito` dos Treinamentos não conhece aptidões. É barato de ligar.
4. Terminar origens: **Herdado**, **Corpo Amaldiçoado Mutante**, **Restringido**, **Maldição**.
   As 4 travam coisas: Herdado é requisito de *Emoção da Pétala Decadente*, e Maldição destrava
   a aba inteira de Aptidões de Maldição (18 aptidões hoje inalcançáveis).
5. **Talentos** (destrava Inato/Derivado/Sem Técnica, é base de Habilidades, e o livro diz que
   talentos também concedem Nível de Aptidão).

---

## ORIGEM: GÊMEOS (2026-08-07)

Origem nova, e a mais estranha do sistema: **ela é de DUPLA**. O livro é explícito
("ela DEVE ser feita em dupla, seja com outro jogador ou com algum NPC"), e isso tem
duas consequências que não existem em nenhuma outra origem.

### As quatro decisões do autor (2026-08-07)

1. **A morte do irmão é um INTERRUPTOR na Origem** (`core.origem.irmaoMorto`), e não um
   estado de combate. Ela é o segundo estágio da Restrição Celestial, é permanente, e
   precisa sobreviver ao fim da sessão. A mesma ficha serve antes e depois.
2. **A "Restrição Celestial" do Restringido, em Verdadeiras Origens, é o Físico
   Abençoado.** O texto pede uma característica com esse nome, que não existe no nosso
   catálogo do Restringido; o autor resolveu que é a que dá acesso à Especialização.
3. **O PE do pós-morte é 20 fixos MAIS a base do Tipo com +2 por nível.** Um Conjurador
   fica com 20 e 8 por nível.
4. **A Iniciativa do irmão é um CAMPO digitado** (`core.origem.iniciativaIrmao`). Ler a
   criatura do irmão do armazenamento criaria dependência entre fichas por um bônus só.

### O que está LIGADO

| O que | Como |
|---|---|
| Bônus em Atributo | +1 nos três físicos se Restringido, senão 2 pontos livres |
| Restrição Celestial · Restringido | Força e Destreza −2, vigor 2 por nível; a morte devolve os dois |
| Ápice Corporal Humano e Resiliência Imediata | chegam ao Gêmeo Restringido **com a morte do irmão** (autor, 2026-08-07) |
| Restrição Celestial · Feiticeiros | 2 de energia por nível; a morte dá 20 mais base do Tipo +2 |
| Restrição Celestial · Feiticeiros, atributo | −2 no atributo da Técnica, seja ele qual for; a morte devolve (ver TERCEIRA REVISÃO) |
| Slots de Habilidade | metade com o irmão vivo, 1,5x depois da morte, com hover de fontes (ver SLOTS DE HABILIDADE) |
| Limite de atributo 30 no pós-morte | em `limiteAtributoDaOrigem`, e NÃO no canal do Motor (ver O LIMITE 30 CHEGAVA TARDE) |
| Dupla Empenhada | a Iniciativa do irmão soma, com a fonte no hover |
| Verdadeiras Origens | escolha GERADA das outras origens, com as exclusões do livro; a escolhida VIRA característica da criatura, qualifica para os Talentos de Origem dela e abre a Especialização exclusiva (ver QUARTA REVISÃO) |

Tudo em dois estágios, pela variável `irmao_morto` do DSL, no padrão
`antes * (1 - irmao_morto) + depois * irmao_morto`. Os dois ramos saem do
`tipo_restringido`, que o contexto já dava: nenhuma escolha nova foi criada para separar
Restringido de Feiticeiro, porque o Tipo já diz o que a criatura é.

**16 asserts**, e os números conferidos: Conjurador ND 10 sai com 20 de PE vivo e 100
morto; Restringido sai com 20 e 40; Força do Restringido vai de 9 para 11.

### As características que a morte concede

O Gêmeo Restringido recebe, na morte do irmão, o **Ápice Corporal Humano** e a
**Resiliência Imediata** do Restringido. Elas entraram no catálogo dos Gêmeos com o
**texto verbatim copiado**, e um assert reprova se os dois textos divergirem: é a MESMA
característica, e duplicar texto é pior que divergir dele.

Isso obrigou a primeira origem com características **condicionais**. O
`caracteristicasEfetivas` passou a filtrar por três marcas declarativas: `soSemEnergia`,
`soComEnergia` e `soIrmaoMorto`. O filtro vale para as **alocações e escolhas aninhadas**,
e não só para a UI: um pool de atributos que só existe depois da morte não pode aparecer
no criador antes dela. Nenhuma origem antiga usa as marcas, e há assert conferindo que
todas continuam entregando a lista inteira.

⚠ **O limite de 30 do Ápice não precisou de efeito nenhum**, e isso foi medido: o
`limTipo` do deriveAfty já dá 30 nos três físicos a todo Tipo Restringido, e esta
característica só existe para o Gêmeo Restringido. Um canal `limiteAtributo` ali somaria
+10 sobre 30 e morreria no teto, virando linha morta no hover de fontes. O que ela traz de
novo é o **pool de +2 num físico a cada 6 níveis**.

### Onde a morte do irmão fica na tela

No **card da Origem, no topo**, antes das características: dois controles que nenhuma
outra origem tem.

- **Irmão Vivo / Irmão Morto** — um botão que troca de cor (vermelho quando morto). Ele
  fica ANTES das características de propósito, porque o interruptor **muda o que as
  características abaixo dizem**: o ramo da Restrição Celestial, o Ápice e a Resiliência
  do Restringido, e os pools de atributo do pós-morte.
- **Iniciativa do Irmão** — um campo de texto, e não numérico, para o sinal poder ser
  digitado. Tudo que ele produz enquanto se digita (`""`, `-`, `+`, `--`) resolve em
  zero, e há assert para cada um desses estados.

**Os pontos do pós-morte** (4 físicos no Restringido, 2 livres no Feiticeiro) saem como
pool de alocação, no mesmo alocador de todo o criador. ⚠ A **alocação** é que ficou
condicional, e não a característica que a carrega: a Restrição Celestial é visível o
tempo todo, mas os pontos só aparecem depois do interruptor. Foi assim para não inventar
uma característica com nome que o livro não tem. O alocador ganhou teto por atributo
(`maxPorAtributo`), porque o texto diz "2 em um mesmo atributo" e sem isso os 4 pontos
iriam todos para a Força.

### O que FALTA, e por quê

| O que | Por quê |
|---|---|
| Proibir Controlador e Invocações | é uma TRAVA, e trava não é canal: mora em `afty-especializacoes.js` e `afty-invocacoes.js` |
| "1 Habilidade de Técnica a cada 3 níveis" (2 se especialista) e "1 por nível" no pós-morte | o contador de Feitiço é ORÇAMENTO, e trocar a cadência dele não é somar num canal |
| Restrição Definitiva concedida independente do nível | conceder Habilidade tem caminho próprio, e ainda falta a trava que a proíbe antes da morte |
| O Honrado, na escolha de Habilidade Base | o Lutador Superior está ligado; o efeito de redução de custos do Honrado espera o motor de Feitiços ler o Motor |
| Canal de Motor na característica copiada | ela traz texto, pools e escolhas, mas não os efeitos de `ORIGEM_EFEITOS`: aquele mapa é chaveado pela ORIGEM inteira, e não por característica (ver QUARTA REVISÃO) |

### REVISÃO DA ORIGEM (2026-08-07)

Três bugs achados e corrigidos, e o padrão dos dois primeiros é o mesmo: **marca de
catálogo que ninguém lê finge valer**.

1. **O Gêmeo Restringido levava as DUAS coisas do Bônus em Atributo.** O texto diz "2
   pontos para distribuir. Caso um deles seja restringido, **ao invés disso**, apenas
   seus atributos físicos são aumentados em 1" — os casos são excludentes. A marca
   `semEnergiaNao` existia no catálogo e **nada a lia**: o `resolveOrigemAttrBonus`
   somava os 2 pontos livres por cima do +1 físico, e o criador ainda oferecia o
   alocador. Corrigido nos dois lugares.
2. **Pool gravado com o interruptor desligado continuava valendo.** O jogador ligava a
   morte do irmão, distribuía os 4 pontos físicos, voltava o interruptor para Vivo, e os
   pontos seguiam somando. O `resolveOrigemAttrBonus` agora só soma os pools que
   `alocacoesDaOrigem` ainda reconhece. **Isso vale para todas as origens**, não só
   para os Gêmeos: qualquer pool que deixe de existir fica inerte.
3. **As oito opções de escolha da origem não faziam nada.** Verdadeiras Origens e
   Habilidade Base de 20° nível apareciam na tela e não tinham efeito nenhum ligado. O
   **Lutador Superior** foi ligado (o autor pediu explicitamente): um dado de dano
   adicional no Ataque Básico e um Nível de Empolgação a mais.

Também saiu a marca `campoIniciativaIrmao`, que era decorativa pelo mesmo motivo. Um
assert novo varre o catálogo dos Gêmeos e reprova qualquer marca que apareça só uma vez
no código (ou seja, declarada e nunca lida).

⚠ **O "buff de não possuir Custo de PE" do Lutador Superior não tem efeito**, e não é
esquecimento: o ataque desarmado de graça daquela habilidade **já ficava de fora do
Motor** (é economia de ação, não stat). O "sem custo" muda um texto que o Motor nunca
leu, então ele vive na descrição da opção e em nenhum canal.

### SEGUNDA REVISÃO (2026-08-07)

Três achados do autor, e o primeiro era o pior de todos.

1. **O Gêmeo não podia ser do Tipo Restringido.** A trava do Restringido é
   bidirecional (`tiposDisponiveis` devolvia todos os Tipos MENOS Restringido para
   qualquer origem que não fosse a Restringido), então **metade da origem era
   inalcançável no criador**: o ramo Restringido da Restrição Celestial não podia ser
   montado por ninguém. Os asserts não pegaram porque montam a ficha na mão, sem passar
   pelas travas do criador. A origem Gêmeos virou a **única exceção** da trava, e a
   Origem Restringido continua forçando o Tipo como sempre.
   ⚠ Isto abre só o **Tipo**. A **Especialização** Restringido continua exclusiva da
   Origem Restringido: no livro ela chega ao Gêmeo pelo Físico Abençoado das Verdadeiras
   Origens, e aquela escolha ainda não tem efeito ligado.
2. **A redução de −2 funcionava, mas era invisível.** As duas linhas do hover da Força
   diziam só "Gêmeos", e não dava para saber qual era o +1 e qual era a redução. O
   `coletarEfeitos` passou a respeitar um `nome` declarado pelo PRÓPRIO efeito, e os
   dos Gêmeos agora dizem "Gêmeos: Bônus em Atributo" e "Gêmeos: Restrição Celestial".
   Vale para todo o Motor: qualquer efeito pode nomear a própria fonte.
3. **O limite de atributo vai a 30 com a morte do irmão**, pelo canal `limiteAtributo`.
   Só no ramo Feiticeiro: no Restringido os três físicos já são 30 pelo Tipo, e o texto
   dele fala de "atributos físicos", então subir os mentais seria dar o que a regra não
   deu.

### Cada estágio só aparece no estado dele

Pedido do autor: *"tudo que precisar da Morte do Irmão, deixe visível só quando o irmão
estiver morto. O inverso também é válido"*.

Os dois parágrafos de cada Restrição Celestial eram um card só. Agora são **dois cards
com o mesmo nome**, e só um aparece por vez: é o mesmo card mudando de conteúdo, e não
dois cards concorrentes. O texto de cada um é o parágrafo inteiro do livro, e há assert
reprovando se um deles levar o outro junto.

Isso encerrou a marca `soIrmaoMorto` na alocação: a característica que carrega o pool já
só existe depois da morte, então o pool some com ela.

### PENDENTE: técnica máxima do irmão morto

*"A critério do mestre você também recebe uma técnica máxima, baseando-se em seu irmão
que veio a morrer, com seu custo sendo reduzido em 10 pontos."*

Saiu da tela como aviso (a pedido do autor, 2026-08-07) e fica registrado aqui. Para
ligar, seria preciso: conceder uma vaga de Feitiço de nível Máximo e aplicar −10 no custo
**daquele** Feitiço. O segundo pedaço esbarra no mesmo lugar de sempre: `afty-feiticos.js`
ainda não lê o Motor de Automação, e `custoPE` não tem alvo.

### TERCEIRA REVISÃO (2026-08-07): a redução do atributo da Técnica

**Relato do autor:** *"A Redução de -2 não está funcionando. Coloquei meu Atributo de
Técnica em Força, e ela não foi reduzida em 2"*.

Não era uma regressão. A redução do ramo **Feiticeiro** nunca tinha sido escrita: ela
estava parada como pergunta aberta, e o que existia no Motor era só a do ramo
**Restringido** (Força e Destreza, texto próprio). Ou seja, o Gêmeo Feiticeiro não
perdia atributo nenhum.

**Decisão de regra (autor, 2026-08-07):** *"todos os atributos que podem ser usados para
sua CD de técnica"* é **o atributo que a criatura escolheu** como o da Técnica, e só ele.
A leitura literal reduziria os seis, porque no Afty qualquer um dos seis pode ser o da
Técnica (`AFTY_TECNICA_ATTRS`), e isso não é jogável.

**Como ficou ligado:**

- Seis bandeiras novas no contexto do DSL, `tecnica_forca` até `tecnica_presenca`, valendo
  1 no atributo escolhido e 0 nos outros cinco. Existem porque o canal `atributo` exige
  `alvo` fixo, então "o atributo da Técnica" só pode ser escrito emitindo os seis efeitos
  e deixando cinco valerem zero. `mod_tecnica` não servia: ele entrega o modificador, e a
  regra precisa mexer no ATRIBUTO.
- Seis efeitos em `ORIGEM_EFEITOS.gemeos`, com `-2 * (1 - tipo_restringido) *
  (1 - irmao_morto) * tecnica_<attr>`. O `(1 - tipo_restringido)` é o que impede a Força
  de um Gêmeo Restringido com Técnica em Força de cair 4 numa criatura só.
- `tecnicaAttr` passou a viajar nos dois `buildCriaturaDslContext` do `deriveAfty`.

**Efeito colateral que é da regra, e não bug:** `pe = peBase + peQnt + modTecnica + Motor`.
Baixar o atributo da Técnica baixa o `modTecnica`, então o Feiticeiro perde PE **duas
vezes**: no canal de PE da Restrição e, de tabela, no modificador que caiu junto. Os
asserts do PE foram reescritos para somar o `modTecnica` explicitamente, em vez de fingir
que ele é zero, para ninguém "consertar" isso depois.

7 asserts novos em `testes-gemeos.mjs` (45 no arquivo), incluindo um que varre os seis
atributos, um que garante que os outros cinco NÃO caem, um para o Restringido e um que
exige a linha nomeada no hover de fontes.

### QUARTA REVISÃO (2026-08-07): Verdadeiras Origens virou alguma coisa

**Relato do autor:** *"Verdadeiras Origens precisa ser melhorada. Por exemplo, não
consigo pegar Herança Maldita"*.

A opção **estava** na lista e o clique **gravava**. O que não existia era o depois:
a escolha ficava guardada como um chip dentro da linha dobrada e nada mais acontecia.
Sem card, sem texto, sem pool, sem qualificação. Herança Maldita é o exemplo mais cru
porque ela é `mesa: true`, ou seja, ela é **só texto**, e texto que não aparece em lugar
nenhum é indistinguível de não ter pego.

**O que foi ligado:**

| O que | Como |
|---|---|
| A característica escolhida VIRA característica da criatura | `caracteristicasEfetivas` passou a devolvê-la, com o id prefixado (`vo_heranca_maldita`) e um campo `verdadeiraOrigem` dizendo de onde veio |
| Card próprio no criador | borda âmbar e um chip com a origem de origem, para a copiada não se passar por nativa |
| Pools e escolhas aninhadas dela | vêm de graça: entrar em `caracteristicasEfetivas` já a coloca em `escolhasDaOrigem`, `alocacoesDaOrigem` e no pool de Anatomia de uma vez |
| Talentos de Origem | `origensQualificadas(creature)` devolve a própria mais a copiada, e o requisito `tipo: "origem"` passou a ler a lista |
| Especialização exclusiva | o Físico Abençoado diz *"você recebe acesso a especialização Restringido"*, e agora dá: `especializacoesDisponiveis(origemId, extras)` |
| O HERDADO entrou na lista | ele não tem característica própria, todas são `doCla`. Agora cada característica de cada clã é uma opção, com o clã no rótulo. A lista foi de **6 para 14 opções** |

**Duas assimetrias que valem ser lidas antes de mexer:**

1. **Abrir não é trancar.** A origem PRÓPRIA tranca (a Origem Restringido vê só a
   Especialização Restringido, e sem multiclasse). Uma origem COPIADA só soma. Sem essa
   distinção, pegar o Físico Abençoado tiraria do Gêmeo todas as outras Especializações
   e a multiclasse junto, que é o oposto do que a característica promete.
2. **O id da copiada leva prefixo.** Ele é chave de estado da UI e dos mapas de escolha,
   e sem o prefixo a Herança Maldita copiada colidiria com a de um Feto de verdade.

**O que continua de fora, e por quê:** os efeitos de `ORIGEM_EFEITOS`. Aquele mapa é
chaveado pela **origem inteira**, e não por característica, então não há como saber qual
linha do Feto pertence à Herança Maldita. Copiar a origem toda daria à criatura coisas
que ela não escolheu. Quem precisar de canal declara em `ORIGEM_ESCOLHA_EFEITOS` pelo id
`vo_*`, que é o caminho que já existe (é assim que o Lutador Superior está ligado).

**19 asserts novos** em `testes-gemeos.mjs` (63 no arquivo), incluindo os dois sentidos da
trava do Restringido, a não recursão da própria Verdadeiras Origens, e o descarte de uma
escolha aninhada gravada quando o clã copiado muda.

### SLOTS DE HABILIDADE (2026-08-07)

**Regra do autor:** *"Gêmeos recebem 1,5x a quantidade de Slots de Habilidades quando o
Irmão Morrer. E ficam com somente metade quando o irmão está vivo"*.

O alvo é o **contador único da aba Habilidades** (`orcamentoHabilidades.comum`), que é o
caixa que Feitiços e Habilidades Gerais dividem, e que o livro chama de "Slot de
Habilidade". Base `2 × Maestria + patamar` (`3 × Maestria` no Beyond).

**É MULTIPLICADOR, então não passou pelo Motor.** Todo canal de vaga soma, e não há como
escrever "metade do que veio" numa expressão que não enxerga o próprio total. Virou
`fatorSlotsHabilidade(creature)` em `afty-origens.js`, aplicado no `deriveAfty` logo
depois do contador base.

**Arredonda para baixo**, como todo o resto do Afty. A base só é ímpar no patamar Beyond
com Maestria ímpar, e é lá que o assert testa os dois sentidos.

**Não toca as vagas exclusivas de Feitiço.** Elas são concedidas nominalmente por uma
Lendária, e multiplicar uma vaga dada por nome seria inventar regra.

O medidor da aba ganhou **hover de fontes** (`partesComum`), porque um contador que cai
pela metade sem nada explicando foi exatamente a queixa do autor duas vezes neste mesmo
dia. Ele só aparece quando há mais de uma linha, então nenhuma outra origem mudou.

**9 asserts** (72 no arquivo).

⚠ **ATENÇÃO À SOMA COM A OUTRA PENDÊNCIA.** A tabela "O que FALTA" ainda tem *"1
Habilidade de Técnica a cada 3 níveis (2 se especialista)"*, que também corta a
capacidade do Gêmeo vivo, e pelo mesmo contador. Se as duas valerem juntas, o Gêmeo vivo
é cortado duas vezes. **Pergunta 6 abaixo.**

### O LIMITE 30 CHEGAVA TARDE (2026-08-07)

**Relato do autor:** *"Pq estou limitado a 22? Se gêmeo levou meu limite para 30?"*, com
a tela mostrando Força 22, limite 30, e o aviso *"1 ponto de bônus perdido no limite 30"*.
A contradição estava na própria linha: perdeu ponto num limite em que cabia.

**A causa é de ORDEM, e não dos Gêmeos.** O `deriveAfty` tem dois limites:

| | Quem é | Quando existe |
|---|---|---|
| `limiteBaseOf` | padrão 20, ficha, Origem, Desenvolvimento, pool de limite | **estágio 0** |
| `attrLimiteEfetivo` | o de cima **mais o canal `limiteAtributo` do Motor** | **estágio 1** |

O bônus de atributo da **origem** é aparado no **estágio 0**. O limite de 30 dos Gêmeos
tinha sido escrito como canal `limiteAtributo`, que só nasce no estágio 1. Resultado: o
mostrador dizia 30 e o bônus da própria origem continuava sendo aparado em 20.

**O conserto:** o limite saiu do Motor e foi para `limiteAtributoDaOrigem`, junto do Ápice
Corporal Humano do Restringido, que é o outro limite de origem do sistema. A função passou
a aceitar a **criatura** (antes só o id), porque o limite do Gêmeo depende da morte do
irmão, e o `limOrigem` já entra por `Math.max`, que é a semântica certa de *"é 30 ao invés
de 20"*.

**A regra que fica:** limite que precisa valer para a **alocação** ou para o **bônus de
origem** mora em `afty-origens.js`, e não no Motor. O canal `limiteAtributo` serve para
quem chega depois (Incremento de Atributo, Quebra de Limites, Aperfeiçoamento), e esses
sobem valor e limite no mesmo pacote, então não sentem a ordem.

**8 asserts** (80 no arquivo), incluindo um que reprova se o canal voltar para os Gêmeos.

### PERGUNTAS ABERTAS

1. **"Maldição/Shikigami mutante"** na lista de exclusões foi lido como a origem
   **Maldição**. Se o livro quis dizer um "Shikigami Mutante" que ainda não existe aqui,
   a Maldição volta para a lista permitida.
2. **"A característica de desenvolvimento Vingativo"** não existe em catálogo nenhum do
   Afty. Ficou como procedimento de mesa.
3. **"Os gêmeos só podem subir de nível juntos"** é regra de mesa, e não entrou como
   trava. Confirma?
4. **O Tipo Restringido do Gêmeo não exige o Físico Abençoado.** Hoje qualquer Gêmeo pode
   ser do Tipo Restringido, porque o ramo Restringido da Restrição Celestial existe por
   si. Mas o caminho do livro para o Gêmeo alcançar o Restringido é Verdadeiras Origens.
   Amarrar o Tipo à escolha, ou deixar solto como está?
5. **A característica copiada é uma só, e para sempre.** Trocar a escolha depois descarta
   o que estava aninhado nela (os treinos do clã antigo, por exemplo). Isso está certo, e
   não há custo nenhum em trocar. Confirma que a troca deve ser livre?
6. **Os slots pela metade e a cadência de Habilidade de Técnica se somam?** As duas
   regras cortam a capacidade do Gêmeo vivo, e pelo mesmo contador: a primeira já entrou
   (metade dos Slots), a segunda ainda não (*"1 habilidade de técnica apenas a cada 3
   níveis"*). Valendo juntas, o Gêmeo vivo é cortado duas vezes. São cortes
   independentes, ou a cadência é só o jeito de o livro descrever o mesmo corte?

## EQUIPAMENTOS: FILTRO POR PROPRIEDADE E ARMAS CRIADAS (2026-08-07)

**Pedido do autor:** *"na aba de Equipamento. Preciso de Filtros por Propriedade da Arma,
como Marcial, Fineza, Dupla e etc. Além disso, preciso da possibilidade de poder criar
armas custom."*

### Filtro por propriedade

Fileira nova de chips no catálogo, ao lado das que já existiam (classe, categoria, custo).

- **Multi-escolha, combinada com E.** A pergunta que se faz ao catálogo é *"quais armas
  são Marciais **e** de Fineza"*, e não "quais são uma coisa ou outra". Com uma marcada
  só, ela se comporta igual aos outros chips.
- **Só oferece o que existe no recorte atual**, pela mesma regra dos custos oferecidos:
  uma aba de armas a distância não mostra Fineza para não achar nada. Isso é o que impede
  a fileira de virar 21 chips, sendo a maioria morta.
- **Dobrada por padrão**, e a linha fechada carrega as marcadas. O botão de limpar só
  existe quando há o que limpar, porque um filtro que esconde metade do catálogo e não se
  anuncia é como um bug se parece.
- Propriedade **com parâmetro** conta como presente (`pesada: 14`, `fatal: "1d10"`). Um
  filtro escrito com `=== true` deixaria essas armas de fora, e tem assert para isso.
- **Especial** não vira chip: ela não é uma propriedade que se compara, é a marca de que a
  arma tem texto próprio, e o texto já aparece à parte.

### Armas criadas pelo jogador

Card **Armas Criadas**, acima do catálogo (a arma criada aparece na lista de baixo, e a
ordem inversa esconderia o resultado da ação). Campos: nome, classe, categoria, dado,
tipo de dano, crítico, grupo, custo, espaços e as 20 propriedades, cada uma com o campo do
parâmetro dela quando tem um.

**A decisão de desenho que segura tudo:** a arma custom é uma entrada **no mesmo shape**
das do catálogo, e entra na lista pela própria `catalogoDoTipo(tipo, creature)`. Não há
lista paralela. Por isso ela funciona, sem nenhum caso especial, em:

| Onde | Como chega |
|---|---|
| Linha do catálogo, com selo **Criada** | `catalogoDoTipo("arma", draft)` |
| Inventário e orçamento de espaços e custo | `getEquipamento(tipo, id, creature)` no `resolveEquipamentos` |
| Ferramenta Amaldiçoada e encantamentos | a entrada resolvida é uma arma como as outras |
| Arma Dedicada | `podeSerArmaDedicada(def)` lê as propriedades, e a regra do livro decide |
| Aba Equipamentos da Ficha Final | ela lê `e.def` do derivado |

**O saneamento é na LEITURA, e não na escrita** (`saneiaArmaCustom`). A ficha vem do
localStorage e pode ter sido editada à mão, importada de outra versão ou salva no meio de
um formulário. Um `dado` inválido ou um `custo` fora de 1 a 4 quebraria orçamento e dano em
silêncio. O que ele garante:

- id **obrigatoriamente** com o prefixo `armc_`, senão uma ficha editada à mão poderia
  sobrescrever uma arma do livro;
- dado, tipo de dano, crítico, custo, espaços, grupo, classe e categoria caem no padrão
  quando inválidos;
- propriedade que não existe no catálogo é descartada, e booleana guarda `true` e nada
  mais;
- o **parâmetro** de cada propriedade é validado pela forma dela (dado, tipo, número,
  alcance);
- o **dado de duas mãos só existe com Versátil**, que é a propriedade que lhe dá sentido;
- arma sem nome ganha um, para não sumir da lista.

**Apagar a arma tira do inventário junto.** Sem isso a entrada fica apontando para um id
que não existe e o resolvedor a reporta como "equipamento desconhecido", o que é verdade e
não ajuda ninguém.

**26 asserts** em `testes-armas-custom.mjs`, incluindo o caminho inteiro da ficha ao
inventário e um que reprova se uma arma do livro passar a usar uma propriedade fora do
catálogo (o chip dela nunca apareceria).

### PERGUNTAS ABERTAS DO EQUIPAMENTO

1. **A arma criada não tem texto de propriedade Especial.** O campo `especial` do catálogo
   aponta para uma entrada de `ARMA_ESPECIAIS` com texto verbatim do livro, e não há como
   um jogador escrever um verbatim. Deixei de fora. Vale abrir um campo de texto livre
   para o traço único da arma criada?
2. **Não há teto para a arma criada.** Nada impede um `2d6` Marcial de Fineza custo 1. Isso
   é procedimento de mesa, ou o criador deve barrar alguma combinação?
3. **A arma criada mora na FICHA, e não numa biblioteca.** Criar a mesma arma em duas
   criaturas é criar duas vezes. Vale uma biblioteca compartilhada entre fichas depois?

---

## TAMANHO REPETÍVEL, PASSIVA SIMPLES E RELÍQUIA DA YAMATA (2026-08-20, revisado 2026-08-21)

### Crescimento Corporal pode ser adquirido duas vezes

`mal_crescimento_corporal` agora declara `repetivel.maxVezes: 2` e libera a segunda
aquisição no nível 10. A ficha mantém o id repetido em `aptidoesAmaldicoadas` e guarda a
decisão de cada ocorrência em:

```js
aptidaoOpcoesRepetidas: {
  mal_crescimento_corporal: ["aumentar", "diminuir"],
}
```

Cada aquisição escolhe **Aumentar** ou **Diminuir** uma categoria. O bônus `hp = ND` é
coletado uma única vez, mesmo com o id duplicado. Os passos de tamanho são emitidos à
parte no `deriveAfty`, identificados pela aquisição, e o limite próprio do Crescimento é
de −2 a +2 em relação a Médio. Esse limite não consome mudanças vindas de outras fontes:
dois Crescimentos até Enorme mais uma Passiva de +1 ainda resultam em Colossal.

A Ficha Final mostra `2×` e lista a escolha da 1ª e da 2ª aquisição. Remover a Aptidão
também remove as opções repetidas órfãs.

### Tamanho em Passivo / Característica

No editor de Passivo / Característica, escolher o canal `tamanho` troca a linha genérica
do Motor por controles diretos:

- Aumentar ou Diminuir;
- uma, duas ou três categorias;
- duração permanente e sem expressão/condição expostas nessa versão simples.

O resultado continua sendo um efeito normal do canal `tamanho`; somente a edição foi
simplificada. A categoria derivada agora também entrega e exibe **espaço/alcance**:

| Categoria | Espaço/alcance |
|---|---:|
| Minúsculo, Pequeno ou Médio | 1,5m |
| Grande | 3m |
| Enorme | 4,5m |
| Colossal | 9m |

Esse valor aparece na Identidade, no Preview e no chip de tamanho da Ficha Final.

### Pingente de Amaterasu

Relíquia pessoal de evento da Yamata: Acessório único de custo 4, fora do catálogo base.
Ela aparece no card **Relíquias de Evento · Yamata** quando o nome da ficha contém
“Yamata”. Equipada, concede +2 nos seis atributos quando `solDireto` está ligado.

O conjunto possui **três tesouros no total**. O marcador `conjuntoSagradoCompleto` mantém
o sol ativo sem depender do ambiente; a coleção `tesouros_sagrados_japao` também está
preparada para reconhecer automaticamente três ids distintos carregados quando os outros
dois forem cadastrados. O bônus continua exigindo o Pingente equipado.

### Integração com o Motor de Addons #027

A atualização remota foi aplicada antes do commit local. Não houve conflito textual. Equipamentos
ainda não são uma família aberta pelos Addons, então a relíquia continua no catálogo privado em
vez de fingir que um pacote JSON já consegue criá-la.

`asserts/t-tamanho-pingente.mjs` prende 14 casos: as duas direções do Crescimento, cancelamento,
PV sem duplicação, distância de Enorme, o Pingente sem sol, sob o sol, guardado, com marcador manual
e com os três ids da coleção carregados, além do aparo de quantidade e das marcas do catálogo. Com
ela, a suíte passa a **649 asserts em 19 arquivos**.
