# Novo Estilo das Sombras

Guia da área. O Novo Estilo das Sombras é o trunfo do Sem Técnica: a partir do Nível 4 ele recebe a
Aptidão Domínio Simples e passa a criar **Técnicas de Estilo**. Um Addon pode liberar o Estilo para
outras origens (`libera: ["estiloSombras"]`).

Fontes, em ordem de precedência:

1. as decisões do autor abaixo (2026-10-04);
2. a *Expansão do Novo Estilo das Sombras (F&M 2.5)*, da Equipe de Desenvolvimento 2.5.5, que o autor
   adotou como regra;
3. o Livro 2.5.2, seção do Novo Estilo da Sombra.

## A REGRA EM VIGOR (2026-10-04)

O modelo mudou nesta data. O anterior (2026-08-10: cada efeito era uma Técnica, e a combinação era
montada na mesa por imbuição) continua valendo só para as Técnicas LEGACY. Ver "Técnicas antigas".

### Decisões do autor

| ID | Decisão |
|---|---|
| DA-01 | Vale na criatura (`/Afty`) e no jogador (`/Player`), com a mesma estrutura de criação, validação, cálculo e armazenamento. Diferença real de comportamento vai para `DIVERGENCIAS` |
| DA-02 | A Técnica de Estilo é um PACOTE: uma entidade própria, Modificação do Domínio Simples ou Técnica de Estilo Especial. A Modificação carrega os efeitos dentro dela, e os efeitos não ocupam a lista de Técnicas. Revoga a decisão de 2026-08-10 |
| DA-03 | Progressão própria: 2 Técnicas no Nível 4 e +1 nos níveis 7, 10, 13, 16 e 19 (7 no 19). Não consome Habilidade de Especialização, Talento nem outro slot genérico. Revoga a decisão de 2026-08-07, em que a Técnica gastava o contador de Habilidades |
| DA-04 | Com o Domínio Simples no ar, UMA Técnica imbuída por vez. No começo do turno o usuário mantém a atual ou troca por outra que conheça, à mão. Trocar não apaga nem recria efeito |
| DA-05 | Técnica criada antes desta data é `legacy`: calcula como antes, não é convertida nem apagada. A conversão é um botão manual, que preserva nome, descrição e os dados antigos |
| DA-06 | Addon antigo segue `legacy` (o Lime Neds inclusive), sem agrupar efeitos em pacote. A regra é explícita (`regra: "legacy" \| "expansao"`), e Addon novo pode declarar a Expansão |
| DA-07 | ERRO não dá benefício e não apaga dado: a configuração fica salva, o erro aparece, e a Técnica inteira fica mecanicamente inválida até ser corrigida. AVISO e INFO não bloqueiam, e a INFO mora no hover |
| DA-08 | A Exaustão da Técnica entra sozinha quando o Domínio Simples FECHA, uma vez por fechamento, na Ficha e no Encontro, com ajuste manual. Nunca ao criar, ativar ou trocar. Cada ponto de Exaustão escolhido na criação é +1 efeito permitido |
| DA-09 | Representação técnica fiel à fonte segue o projeto. Interpretação de regra não coberta vira NOVA DECISÃO NECESSÁRIA em `a-fazer.md` |

Leituras do PDF decididas pelo autor:

| Ponto | Decisão |
|---|---|
| Bônus de CD | soma metade do BT na CD. A frase "em jogadas de ataque" do PDF é erro de cópia do Bônus de Acerto (decisão do autor diante da inconsistência) |
| Metade do AU e do CL | arredondada PARA CIMA, como o texto manda (AU 1 dá +1, AU 3 dá +2, AU 5 dá +3). AU e CL são métricas separadas, nunca o maior dos dois |
| Contra-Ataque | cada um ocupa 1 vaga de efeito. A quantidade não passa do Nível de BAR nem das vagas da Técnica |
| Ataque com Gatilho | cada aplicação ocupa 1 vaga e dá +1 ataque por rodada |
| Pré-Requisito | Fácil +1, Médio +2, Difícil +3, Impossível +4 no Nível de Aptidão considerado para UM efeito. Não mexe na Aptidão real, não é global, não dá vaga e não aumenta Ataque com Gatilho nem Contra-Ataque |
| Exaustão | Domínio 3 com Exaustão 2: 5 vagas, e 2 Pontos de Exaustão ao fechar |
| Repetição | definida por efeito no catálogo (o Acerto soma, o Dano soma +2, o Gatilho soma +1 ataque, e na Defesa, TR, Perícia, Deslocamento e Margem a 2ª compra estende aos aliados) |
| Aliados | nunca somados em outra ficha. A ficha do usuário mostra o valor, o alcance e que afeta aliados |
| Condições por crítico | manual ou parcial até existir a tabela de efeitos de crítico das armas |

### Divergência de fonte: a origem Sem Técnica

O Livro tem dois textos para a quantidade de Técnicas:

- na origem Sem Técnica: *"Quando aprender o Novo Estilo da Sombra, você recebe uma Técnica de
  Estilo. Nos níveis 8, 12, 16 e 20 você recebe uma técnica de estilo adicional"*;
- na seção do Novo Estilo da Sombra, igual à Expansão: duas no Nível 4 e mais uma nos níveis 7, 10,
  13, 16 e 19.

O sistema usa a segunda (DA-03). O texto da origem fica registrado aqui como divergência da fonte.

## Como o código está montado

| Peça | Onde |
|---|---|
| Catálogo (FOLHA, zero imports): regra, progressão, efeitos | `src/systems/afty/afty-estilo-sombras-catalogo.js` |
| Resolvedor, normalização, efeitos no Motor | `src/systems/afty/afty-estilo-sombras.js` |
| Progressão e orçamento | `afty-derive.js`, `estilo.progressao` |

### As duas regras na mesma lista

`creature.estilosSombra` guarda as duas regras lado a lado, separadas pelo campo `regra`:

- **`legacy`** (campo ausente): `estilosDaFicha` lê. É o modelo de 2026-08-10, com imbuição na mesa,
  e a Técnica gasta o contador de Habilidades como sempre gastou;
- **`expansao`**: `tecnicasDaFicha` lê. A Técnica é um pacote, e as compras de efeito, as
  modificações de Aptidão e os Pré-Requisitos têm `uid` próprio.

⚠ Quem regrava a lista precisa juntar as duas. Os escritores do criador fazem isso pelo
`tecnicasCruasDaExpansao`.

### Progressão

`tecnicasDaProgressao(nd)`: 2 no Nível 4 e +1 em 7, 10, 13, 16 e 19, com uma parcela por nível
para o hover. A vaga exclusiva `vagasEstilo` (o Liberto, o Treino de Novo Estilo, a Expansão de
Estilo, o Especialista em Estilo) soma em cima. A Técnica da Expansão usa a vaga exclusiva antes da
legacy, e o que sobrar segue para as legacy como antes.

### Efeitos da Modificação

`EFEITOS_ESTILO`, no catálogo. Cada compra ocupa 1 vaga. A repetição é definida em cada efeito:

| Efeito | No usuário | Repetição |
|---|---|---|
| Aumento de Defesa | Defesa + metade do BT | a 2ª compra estende aos aliados, sem somar no usuário |
| Aumento de TR (escolha) | o TR escolhido + metade do BT | a 2ª estende aos aliados |
| Bônus de Acerto (escolha) | Acerto + metade do BT por compra | soma |
| Bônus de Margem Crítica | margem -1 no Nível 5, -2 no 13 | a 2ª estende aos aliados |
| Aumento de Perícia (escolha) | a Perícia + metade do BT | a 2ª estende aos aliados |
| Dano Adicional | +2 Níveis de Dano por compra | soma |
| Alcance Adicional | alcance de ataque +3 m | uma compra |
| Deslocamento Adicional | +4,5 m | a 2ª estende aos aliados |
| Ataque com Gatilho | 1 ataque por rodada por compra (número de mesa) | soma |
| Bônus de CD | CD + metade do BT por compra | soma |
| Efeito Especial | texto e linhas de Motor, aprovado pelo Narrador | uma compra |

- Metade do BT é `piso(bt / 2)`. O limite de efeitos é DOM + `imbuicoesEstilo` + Exaustão.
- O valor dos aliados é número de mesa na ficha do usuário. Ele nunca é somado em outra ficha.
- A Técnica liga pela variável `estilo_tecnica_<id>`, com o Domínio no ar (`estilo_ativo`).

### Modificações de Aptidão

`MODIFICACOES_APTIDAO`, no catálogo. A Técnica guarda só a referência (`{ aptidaoId, modId }`), e
cada modificação ocupa 1 vaga.

| Trilha | Modificações | Automação |
|---|---|---|
| Aura | Bônus Numérico (+`teto(au / 2)`, a 2ª aos aliados), Área do Domínio, Aura Anuladora, Aura Embaçada, Aura Elemental, Vantagem por PE, Transferência de Aura | o Bônus Numérico no Motor, o resto é texto de mesa |
| Controle e Leitura | Canalizar em Golpe com Vantagem, Cobrir-se no Domínio, Bônus Numérico (+`teto(cl / 2)`), Rastreio e Leitura, Munição Imbuída, Punho Divergente (CD + CL) | o Bônus Numérico no Motor e a CD do Punho Divergente como número |
| Energia Reversa | Cura em Área, Energia Reversa Ofensiva (pede Projetar Energia ou Canalizar em Golpe, e ER 1) | texto de mesa, com o requisito validado |
| Barreira | Cortina no Domínio (o raio não muda) | texto de mesa |

- As Aptidões de Domínio (a categoria inteira) não podem ser modificadas.
- O Bônus Numérico só vale enquanto a linha da Aptidão está valendo: o Cobrir-se sem PE gasto não
  ganha nada.

### Pré-Requisitos, Contra-Ataque, crítico e Exaustão

- **Pré-Requisito** (`requisitos: [{ uid, dificuldade, alvoUid, texto }]`): Fácil +1, Médio +2,
  Difícil +3, Impossível +4 no Nível de Aptidão considerado para o efeito apontado, dentro da
  expressão dele. Não muda a Aptidão real, não dá vaga e não vaza para outro efeito. No Ataque com
  Gatilho e no Contra-Ataque é ERRO. Num efeito que escala por BT é AVISO.
- **Contra-Ataque** (`contraAtaque: { quantidade }`): cada um ocupa 1 vaga, até o Nível de BAR. O
  degrau sai do BAR: 1 e 2 reduzem o dano à metade, 3 e 4 anulam, 5 anula e rebate uma vez por rodada.
  Com Contra-Ataque, a Reação fica indisponível enquanto o Domínio durar.
- **Crítico** (`critico: { aumentarCD, alvoExtra, condicao }`): 1 vaga por modificação. A CD sobe pelo
  BAR. É sempre AVISO, porque a tabela de efeitos de crítico das armas não existe no Afty. Subir a
  condição para Extrema é ERRO.
- **Exaustão** (`exaustao`): +1 vaga por ponto, e os mesmos pontos quando o Domínio fecha.

### Em jogo: Ficha Final e Encontro

- O interruptor **Domínio Simples** liga o Domínio (com ou sem Técnica), e a **Técnica Atual** escolhe
  qual pacote está imbuído. Uma por vez, e a troca é à mão no começo do turno.
- A Exaustão entra quando o Domínio **fecha**, uma vez por fechamento: a soma das Técnicas usadas
  naquela ativação, cada uma uma vez (decisão pendente no `a-fazer.md`). A Técnica inválida não gera
  Exaustão. O fim do combate não fecha o Domínio sozinho, e o contador de Exaustão aceita ajuste.
- Com Contra-Ataque na Técnica ativa, a Ficha marca **Reação Indisponível**. Nada é gravado na ficha.
- Os Ataques com Gatilho têm contador por rodada na linha da Técnica.
- A Ficha e o Encontro usam a mesma função de sessão (`alteraEstadoCombate`) e a mesma lista
  (`conteudoDaFicha`).

### Validação

`validarTecnica` (afty-estilo-sombras.js), três níveis:

| Nível | Casos (`codigo`) | Efeito |
|---|---|---|
| ERRO | efeitos acima do limite (`limite`), efeito desconhecido (`efeito`), escolha pendente (`escolha`), teto de compras (`teto`), modificação desconhecida (`modificacao`), Aptidão de Domínio (`aptidao_dominio`), Aptidão que a ficha não tem (`aptidao_ausente`), modificação que não serve à Aptidão (`aptidao_invalida`), Bônus Numérico em Aptidão sem número (`aptidao_sem_numero`), requisito da modificação (`requisito`), Pré-Requisito sem dificuldade (`prereq_dificuldade`), sem alvo (`prereq_alvo`) ou no Gatilho e no Contra-Ataque (`prereq_proibido`), Contra-Ataque acima do BAR (`contra_bar`) ou das vagas (`contra_teto`), condição Extrema (`critico_extrema`), Especial escrevendo `vagasEstilo` ou `imbuicoesEstilo` (`canal`), Técnicas acima da progressão (`progressao`, no Estilo) | a Técnica inteira fica sem efeito (`mecanicamenteValida: false`). Os dados continuam salvos. A progressão estourada invalida todas |
| AVISO | Pré-Requisito em efeito que não lê Aptidão (`prereq_sem_efeito`), dois Pré-Requisitos no mesmo efeito (`prereq_somados`), crítico sem tabela (`critico_tabela`), Efeito Especial (`especial`) | não bloqueia |
| INFO | Reação removida pelo Contra-Ataque (`reacao`), gatilho da borda (`borda`), sem acúmulo de Auxiliar (`auxiliar`) | não bloqueia, e mora no hover |

O Efeito Especial não consegue criar invocação, Transformação nem consumível por construção: nenhum
canal do Motor faz isso.

⚠ A `vagasEstilo` é lida antes de os efeitos do Estilo serem emitidos, porque a progressão precisa
estar fechada para a validação. O contexto dessa leitura tem as `esc_*` (`varsDeEspecializacao`).

## Técnicas antigas (LEGACY)

Toda entrada de `creature.estilosSombra` sem `regra: "expansao"` é LEGACY (DA-05), em qualquer um
dos formatos que existem gravados:

| Formato | Lido como |
|---|---|
| `{ id, tipo: "tabela" }` e `{ id }` sem tipo | linha de `TECNICAS_TABELA` (Gatilho, Defesa, Acerto, Dano) |
| `{ id, tipo: "especial", nome, descricao, efeitos, custoImbuicao?, maxImbuicoes? }` | Especial com Motor livre e custo de imbuição próprio |
| `{ tipo: "modificacao", efeitosModificacao, efeitos }` (o recipiente de antes de 2026-08-10) | as linhas de tabela que ele cita, mais uma Especial com as linhas dele |

- Ela calcula exatamente como antes: faixa de imbuição `estilo_<id>` na bancada, vagas do Domínio, 1
  do contador de Habilidades. O `t-estilo-sombras-migracao` fixa os números medidos no commit
  anterior à Expansão (8bc4b82), nos dois sistemas, e confere que o cru da ficha não muda.
- Nada converte sozinho. No criador ela aparece na lista "Modelo Anterior" com dois botões:
  **Converter para o Novo Sistema** e **Remover**.
- A conversão (`converterTecnicaLegacy`) é segura e parcial: a de tabela vira Modificação com aquele
  efeito, uma compra (o Bônus de Acerto volta pedindo a escolha do ataque, e fica inválido até ela),
  e a Especial vira Técnica de Estilo Especial com as MESMAS linhas de Motor. O original inteiro fica
  em `legado`, inclusive o `custoImbuicao`, que deixa de valer.
- O único efeito visível na LEGACY é o rótulo do interruptor, que voltou a ser "Domínio Simples"
  (DA-04). O id (`estilo_ativo`) e as variáveis `estilo_<id>` não mudaram, e o remendo de custo do
  Estilo Liberado continua lendo `estilo_acerto`.

### Técnicas de pacote (Addon)

As `estilos[]` de um Addon seguem a mesma divisão (DA-06): sem `regra`, LEGACY (o Lime Neds inteiro),
e com `regra: "expansao"`, Técnica da Expansão com o id `<pacote>:<id>`, só leitura no criador e
escolhível na Técnica Atual. O formato e o que o validador do pacote confere estão em
`docs/afty-addons.md`, na seção do `libera`.

## Pontos ainda abertos

As leituras do PDF que a DA-09 manda perguntar estão em `docs/a-fazer.md`, em PERGUNTAS AO AUTOR, com
o título "Novo Estilo das Sombras". Enquanto não forem respondidas, o ponto afetado fica como texto na
ficha, e o resto funciona.
