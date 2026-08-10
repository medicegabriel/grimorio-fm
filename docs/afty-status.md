# Status do Grimório Afty (handoff para chat novo)

Estado atual do sistema Afty (atualizado 2026-08-10). Leia junto com:
`docs/roadmap-versionamento-e-fichas.md` (arquitetura) e `docs/afty-formulas-base.md` (fórmulas).

> ⚠ **Este documento começou em 2026-07-17 e o trabalho posterior está registrado por sessão.**
> Ao retomar, leia primeiro a sessão mais recente e depois o Contexto rápido.
>
> **AS 6 ESPECIALIZAÇÕES ESTÃO FECHADAS** (2026-07-22): Combatente 70, Lutador 69, Conjurador 65,
> Suporte 57, Restringido 53, Controlador 47 = **361 habilidades**. Mais **Talentos** (51), em
> sistema próprio (`afty-talentos.js`).
>
> ⚠ Eram 367. O autor mandou **remover "Teste de Resistência Mestre"** (2026-07-27), que existia
> nas seis, uma por especialização. Não reintroduzir.
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
>    fórmulas `1 + floor(ND/3)` foram removidas. Só as Gerais Especialização e Aptidão dão vaga
>    (`+1 + metade da Maestria` por pega), e cada uma sai metade da Maestria de vezes.
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
> Conjurador **16/65** · Suporte **10/57** · Controlador **8/47** · **Origens** (Herdado com os
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
| **Expansão de Domínio, benefício Custo de Feitiço** | Reduz o custo em DOM enquanto o Feitiço é usado dentro da expansão |

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

- A variável de linha `dados_dano_final` pode ser usada no canal `danoBonus`. Ela é avaliada depois
  que o Feitiço fecha sua quantidade real de dados, incluindo as alterações do canal `dadosDano`.
- Um Passivo / Característica com alvo `feitico:<id>` mostra no editor o valor calculado para aquele
  Feitiço. O alvo geral `feitico` não mostra uma prévia numérica, pois cada Feitiço pode possuir uma
  quantidade diferente de dados.
- Em Múltiplos Disparos, a variável representa os dados de cada disparo. Ela não pode ser usada no
  canal `dadosDano`, pois a quantidade de dados passaria a depender dela mesma.

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

**Dois tipos de Técnica de Estilo:**

| Tipo | O que é |
|---|---|
| `modificacao` | Modificação do Domínio Simples. Tabela FECHADA de 5 efeitos, orçada pelo Nível de Aptidão em Domínio. |
| `especial` | Texto livre mais o Motor completo, com Passiva/Ativa por linha. É onde entram as Aptidões Amaldiçoadas incorporadas. |

**A tabela de Modificação, e o que cada linha liga:**

| Efeito | Canal | Repetição |
|---|---|---|
| Ataque com Gatilho | **nenhum** (ataque extra por rodada não é stat de ficha) | +1 ataque |
| Aumento de Defesa | `defesa` = `piso(maestria / 2)` | máx. 2, e a 2ª estende aos aliados sem somar na sua Defesa |
| Bônus de Acerto | `bonusAcerto` = `piso(maestria / 2) * n` | +metade da Maestria por vez (autor, 2026-08-07: o livro só diz "aumentando o bônus") |
| Dano Adicional | `nivelDano` = `2 * n` | +2 níveis por vez |
| Efeito Especial | Motor livre | abre o editor dentro da Modificação |

⚠ A repetição vira **uma linha com o valor já multiplicado**, e não N linhas iguais. N linhas
cairiam na mesma chave do pool exclusivo e só a maior valeria, comendo as repetições pagas.

**Pool exclusivo:** nasceu a SEXTA família, `estiloSombra` (autor, 2026-08-07). O Estilo é o Feitiço
Auxiliar do Sem Técnica: sem entrar no pool, seria a única origem cujo bônus escrito à mão soma por
cima de tudo. Vale para os dois tipos, inclusive os efeitos de tabela. Testado: duas Modificações
com Aumento de Defesa rendem um só, e o Estilo disputa de igual para igual com a Habilidade Única.

**Bancada:** cada Modificação ganha um interruptor próprio nos `estadosExtras` (os efeitos dela só
valem "enquanto o Domínio Simples estiver ativo"), e a Especial ganha um quando tem linha marcada
como ativa. Mesmo caminho da Habilidade Única de Ferramenta, que o comentário do `resolveCombate` já
antecipava.

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
| C5 | **Repetível que o shape de ids únicos não suporta.** *Nova Habilidade* (ilimitado), *Respeito Celeste* (2x), *Incremento de Atributo*, *Crescimento Corporal* (aptidão). O padrão `escolha.repetivel` já resolve quando há pool, mas estes não têm. | Conjurador, Restringido, Talentos |
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
3. **Linha espelhada não recebe canal de cura.** "Uma rolagem do seu dano desarmado" e "uma rolagem
   da sua cura de Suporte em Combate" copiam uma rolagem que já existe, inteira. Aplicar os canais
   por cima contaria o bônus global DUAS vezes, porque ele já está dentro do que foi copiado. Só
   `curaUsos` é da linha espelhada, porque o limite de usos é dela. **Item que cura é flat pelo
   mesmo motivo.**

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

**Uma expansão de cada vez.** `creature.dominioAtivoId` diz qual está no ar, e é
ela que a bancada aplica. A UI marca com o chip Ativa / Inativa.

**Ponte com o Motor:** os efeitos que caem sobre a PRÓPRIA ficha viram efeitos
temporários presos ao estado `dominio_ativo` da Simulação de Combate. Entram
Aumento de CD, Aumento de Dano corporal (`nivelDano` + `danoBonus`), Aumento de
Atributo (nos dois escolhidos), Redução de Dano, Defesa e Negação de RD dos golpes.
Ficam de fora, só como texto, os três Ambientais (agem sobre criaturas hostis) e a
Negação de RD dos Feitiços. Mesmo recorte da 2.5.2.

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
| Estímulo Muscular | bancada | `bonusPericia` +1 por PE, `distanciaEmpurrao` de `cl × 1,5` |
| Estímulo Muscular Avançado | bancada | deltas de +1 por PE e de mais `cl × 1,5` |
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
   `limite`. ⚠ **Falta o conteúdo**: o autor citou DUAS Habilidades que dão "+1 podendo passar de 5"
   (as duas juntas levam a 7) e a **Expansão de Domínio** (+2 em `au`, `cl` e `er`), e ainda **não
   mandou o texto de nenhuma**. O mecanismo está pronto e testado, é só escrever as linhas:
   `{canal:"nivelAptidao", alvo, expr}` mais `{canal:"limiteAptidao", alvo, expr}` juntas.
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
2. **Estudos** e **Treinamento para Habilidade**: cards informativos recolhíveis, dependem de
   Perícias/Especializações. Regra do autor: para criaturas, qualquer interlúdio que peça teste é
   **sucesso automático**.

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
- **Único caso de Base que é CONCESSÃO PURA**: nos níveis 6 e 8 o livro só diz "você recebe a
  aptidão amaldiçoada X", sem nomear uma habilidade. Viraram `sup_energia_reversa` e
  `sup_liberacao_de_energia_reversa`, batizadas com o nome do que concedem.
  ⚠ **PERGUNTA ABERTA:** pela regra do projeto, alvo NOMEADO = concessão direcionada e GRÁTIS,
  mas pela regra do Afty toda Base gasta vaga de orçamento. As duas regras se chocam aqui.
  **Decidir com o autor** se estas duas custam vaga ou vêm de graça.

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
   - **Crescimento Corporal** é REPETÍVEL ("a partir do 10° nível você pode obter esta aptidão
     outra vez"). `aptidoesAmaldicoadas` é uma lista de ids únicos e não suporta 2x.
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
