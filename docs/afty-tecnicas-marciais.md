# Técnicas Marciais e Estilo Marcial do Restringido

Feito em 2026-10-27, nos dois sistemas (criatura em `/Afty`, personagem em `/Player`), a partir do plano
fechado com o autor em 2026-10-26. Fonte das regras: Livro de Regras 2.5.2, p. 124, 247 a 251 (Estilo Marcial e
Técnicas Marciais), p. 156 (Amplificadora) e p. 348 (Elementalista). Módulo do motor: `src/systems/afty/afty-tecnicas-marciais.js`.
Asserts: `asserts/t-tecnicas-marciais.mjs`.

## 1. Regras do Livro, como estão no código

| Regra | Valor | Onde |
|---|---|---|
| Nível, custo em Estamina | 1 a 4, custo 2, 5, 8 e 12 | `TM_CUSTO_PE` |
| Acesso ao nível | 1 no início, 2 no nível 5, 3 no 9, 4 no 15 | `TM_ACESSO`, `nivelMaxTecnicaMarcial` |
| Teto da origem | o Não-Feiticeiro vai só até o Nível 2 | `tetoNivelFeiticoDaOrigem` |
| Quantidade no personagem | 2 no início e +1 em cada nível ímpar a partir do 3, sem teto depois do 19 | `tecnicasMarciaisDoJogador` |
| Ataques | Ação Comum = nível, Completa = nível + 1, Bônus = piso(nível / 2), e o Nível 1 não tem Bônus | `ataquesNaAcao` |
| Acerto | +1 a +4 pelo nível, mais 2 por ataque reduzido | `TM_ACERTO`, `TM_ACERTO_POR_REDUCAO` |
| Dano Adicional | 4, 8, 12 e 16 por ataque, somado de novo a cada ataque reduzido | `TM_DANO` |
| Ignorar RD | 8, 12, 16 e 20, mais 3 por ataque reduzido | `TM_RD`, `TM_RD_POR_REDUCAO` |
| Condição | escada Fraca, Média, Forte e Extrema pelo número de acertos, teto no nível dos efeitos, a Completa não sobe o teto | `forcaPorAcertos` |
| Vários efeitos | cada efeito extra desce TODOS em 1 nível | `calcularTecnicaAtaqueBase` |
| Uso | uma vez por rodada | `mesa["tecnicaMarcial:<id>"]` |

Exemplo fixo do autor: Nível 3 reduzida a 1 ataque dá Acerto +7, Dano 36 e RD 22 (`t-tecnicas-marciais`).

Tipos de Técnica Marcial: Ataque (novo, só marcial), Auxiliar (sem `atributo` e sem `alcanceCaC`), Curativo (sempre PV
Temporário, pode remover Condições), Passiva (sem a categoria `atributo`, mantém a Regeneração por Rodada) e
Personalizado. Não há Dano, Especial nem Arma Improvisada.

## 2. Modelo de dados

- **A Técnica Marcial mora em `creature.feiticos`**, com a marca `marcial: true`. Reaproveita o caminho inteiro do
  Feitiço (editores, resumo, Passiva, PE Máximo, exportação, Cofre) e não pede migração gravada.
- **Leitura padrão, sem gravar** (`marcarTecnicasMarciais`): na origem Restringido, ou na ficha sem energia que não é
  Sem Técnica, o Feitiço sem a marca é lido como Técnica. Cobre o Restringido, o Não-Feiticeiro e o Gêmeo Restringido,
  e nunca toca item com `variacaoDe` (nem a Passiva recebida de fora). O Sem Técnica tem energia, então os Feitiços do
  Addon Estilo Marcial seguem Feitiços.
- **O tipo `ataque` não entra em `TIPOS_FEITICO`** (o Conjurador ganharia o tipo). Existe `TIPOS_TECNICA_MARCIAL` e
  `createBlankTecnicaMarcial(tipo)`. Campos da Técnica de Ataque: `acaoAtaque`, `ataquesReduzidos`, `efeitosAtaque`,
  `condicoesAtaque` (`{ fraca, media, forte, extrema }`) e `trCondicaoAtaque`.
- **Fundamento Marcial**: o mesmo Funcionamento principal (`core.tecnicaDescricao` e `core.tecnicaEfeitos`), com o
  nome do estilo em `core.estiloMarcialNome` e o Atributo da CD em `core.tecnicaAttr`.
- **Módulo FOLHA** (zero imports, lista em `asserts/t-ordem-modulos.mjs`): as condições e durações chegam por
  parâmetro, porque `CONDICOES_CATALOGO` muda com Addon.

## 3. O derive

`derived.tecnicasMarciais` traz `disponivel`, `travado`, `motivoTrava`, `mostraCard`, `nivelMax`, `cd`,
`tiposPermitidos`, `ids`, `lista`, `ataques` (por Técnica, uma linha por arma equipada mais o Ataque Básico, com a
versão `primeiro` e a `demais`), `consomeEstadoNoPrimeiro` e `fundamento`. `derived.ramoHabilidades` ("restringido",
"sem_tecnica" ou "padrao") diz o leiaute da aba.

- **Portão**: quem tem a Especialização Restringido (ou herdeira, pela mãe `restringido`), ou a liberação nova
  `tecnicasMarciais`. O alias antigo `feiticosRestritos` vale como ela numa ficha sem energia. Sem nenhuma das duas, o
  card nasce TRANCADO na origem Restringido, e as Técnicas gravadas continuam contando e valendo.
- **Objeto fechado**: sem o card, `tecnicasMarciais` sai fechado e com `cd: null`. O assert de clone do `t-sistema`
  exige que o derive dos dois sistemas só difira nas chaves das divergências.
- **Orçamento**, por pilhas da mais estreita para a mais larga. Criatura: `vagasMarcial`, `vagasFeitico`, contador
  comum. Personagem: `vagasMarcial`, progressão própria, `vagasFeitico`. A `vagasFeitico` é dividida na ordem Estilo,
  Técnica Marcial, Feitiço. O Desenvolver Ideias do Restringido (`res_desenvolver_ideias`) dá +2 em `vagasMarcial`,
  exclusivas de Técnica. Campos novos em `orcamentoHabilidades`: `tecnicasMarciais`, `exclusivasMarcial`,
  `exclusivasMarcialUsadas`, `proprioMarcial`, `proprioMarcialAtivo`, `proprioMarcialPartes`, `proprioMarcialUsado` e
  `excedeuMarcial`.
- **Pool**: família `tecnicaMarcial` em `FAMILIAS_EXCLUSIVAS` (`grupoJogador: "feiticos"`), carimbada na Passiva e no
  Auxiliar marcial. Fica fora de `semFeiticoExausto` e `semTecnicaBloqueada`, porque Técnica Marcial não depende de
  técnica amaldiçoada.
- **Linhas de ataque**: `linhaDeArmaDaTecnica` copia a linha da arma com o Acerto, o Dano Adicional (grupo fixo, com
  parcela no hover) e a RD ignorada da Técnica já dentro. O `comFormulasDeDano` fecha fórmula e hover como em toda
  linha de dano.

## 4. Divergências entre os dois sistemas (`DIVERGENCIAS`)

| Id | Criatura (Afty) | Personagem (Player) |
|---|---|---|
| `progressaoDeTecnicasMarciais` | gasta o contador comum de habilidades | caixa próprio pela progressão do livro, e o excesso vira `excedeuMarcial` (contador vermelho e aviso) |
| `progressaoDoEstilo` (Novo Estilo das Sombras) | as Técnicas da Expansão gastam o contador comum, e o estouro só deixa o contador vermelho | progressão própria, e o estouro invalida |
| Passiva marcial | grátis (`passivaCustaPeMaximo` desligado) | reduz o PE Máximo, como a de Feitiço |

## 5. Telas

- **Criador** (`AftyCreatureBuilder.jsx`): o ramo Restringido da aba Habilidades traz o card Estilo Marcial (Atributo
  da CD, Nome do Estilo, Fundamento Marcial e Motor de Automação) e o card Técnicas Marciais (o `FeiticosCard` com os
  cinco tipos). O `SubsistemaPendente` saiu. Editor da Técnica de Ataque: Ação, Ataques Reduzidos, Efeitos Adicionais,
  uma Condição por força e TR do Alvo. O Preview rotula a lista como Técnicas Marciais quando só há marciais.
- **Ficha clássica** (`AbaAcoes.jsx`): seção Técnicas Marciais depois de Dano. A Técnica de Ataque vira
  `LinhaTecnicaAtaque` (seletor de arma, um Acerto e um Dano por golpe, marca Acertou, escada de Condição com TR e
  CD, contador de usos por rodada). As outras (Auxiliar, Curativo, Personalizado) usam a `LinhaFeitico`. A Passiva vai
  para o grupo Técnicas Marciais da aba Habilidades.
- **G2** (`ficha/abas-g2/AcoesG2.jsx`, atrás da prévia `previaAbasG2`): a mesma linha, no vocabulário `m-*`.
- **Encontro** (`PainelDeCombatente.jsx`): recebe a arma escolhida da sessão (`sessao.armasDaTecnica`) e o contador de usos.
- **Arma escolhida**: guardada na sessão por Técnica (`armasDaTecnica`), compartilhada pelas três telas. A marca de
  acerto e o crítico pendente ficam locais.

## 6. Addons

- `addons/estilo-marcial.json` (1.1.0): abre Passivo e Personalizado só para o Sem Técnica. O Restringido usa as
  Técnicas nativas, e os Feitiços que criou com o Addon viram Técnicas na leitura, sem perda.
- `addons/nao-feiticeiro.json` (1.2.0): `libera: ["tecnicasMarciais"]`, teto de Nível 2.
- Liberação nova `tecnicasMarciais` em `LIBERACOES` (`afty-addons.js`).

## 7. Elementalista e Amplificadora

- **Elementalista** (Livro p. 348): o dado sai de TODAS as linhas de arma (escopo `ESCOPO_PRIMEIRO_ATAQUE`,
  `primeiroAtaque:tecnica`, em `afty-extras-nativos.js`) e entra só no primeiro ataque da Técnica e na primeira rolagem
  do Feitiço de Dano, Após Ataque, sem dobrar no crítico.
- **Amplificadora** (Livro p. 156): estado "Amplificadora Carregada" (`ESTADO_AMPLIFICADORA`, bancada do Buffs), com
  piso(BT / 2) dados do maior dado da arma. A rolagem do primeiro ataque a desliga (`consomeEstadoNoPrimeiro`).
- Expiração ("até o final do próximo turno") é manual, como a bancada.

## 8. Decisões fechadas (autor, 2026-10-26)

1. Uma implementação para os dois sistemas, com o que diverge em `DIVERGENCIAS`. 2. Calculadora completa de uma vez.
3. Personagem com a progressão do livro (continua nos ímpares depois do 19) e criatura no contador comum. 4. O Novo
Estilo das Sombras segue a mesma regra. 5. Curativo sempre em PV Temporário, e pode remover Condições. 6. Ficha: linha
própria na aba Ações, com seletor de arma. 7. Vários efeitos descem todos juntos, e cada ataque reduzido melhora todos.
8. Addon Estilo Marcial: o Restringido migra, o Sem Técnica fica. 9. Não-Feiticeiro passa para Técnicas Marciais pela
liberação nova. 10. Fundamento: card com nome, texto e Motor livre, e o Atributo da CD. 11. Condição: duração pela
tabela dos Feitiços com o nível da Técnica, TR escolhido na criação contra a CD da Técnica. 12. Passiva igual à de
Feitiço, mantendo a Regeneração. 13. Quem recebe: quem tem a Especialização, mais a liberação. 14. Gêmeo Restringido
passa para a aba do Restringido. 15. Item migrado com Nível 0 ou 5 mantém o nível e avisa. 16. Estouro de vaga só
deixa o contador vermelho. 17. Sem Arma Improvisada: o seletor oferece o Ataque Básico e as armas equipadas.

## 9. Pontos provisórios (o autor ainda não respondeu)

Estão também em `docs/a-fazer.md`.

1. Ordem da vaga genérica `vagasFeitico` entre Estilo, Técnica Marcial e Feitiço (provisório: Estilo, Técnica, Feitiço).
2. Redução de custo (Dominância, Manipulação Perfeita, Treinos com `escolhaFeiticos`) não vale para Técnica.
3. Sangramento na Técnica de Ataque fica só como Fraca, sem a tabela variável.
4. Encantamento Complementar ("+2 na CD de Especialização e de Estilo Marcial") continua fora: o Afty tem uma CD só.
5. Técnica Marcial não conta como Feitiço no requisito "Possuir Feitiços" de Talento.
6. Item marcial com tipo fora dos permitidos (um Dano antigo de Gêmeo) continua contando, com aviso.
7. O contador de acertos da Ficha é manual.
8. Os dados do Elementalista e da Amplificadora entram Após Ataque (não multiplicam no crítico).
9. Reduzir ataques combina com Ação Completa e com Ação Bônus, até (ataques da ação − 1).
10. Motor livre da Passiva marcial escrevendo `atributo`: a linha é descartada com aviso.
11. Elementalista em Golpeador, Dano na Alma ou Personalizado com rolagem: só o tipo "dano" por ora.
12. Segunda Habilidade Única numa ficha sem energia continua custando 1 do contador comum.
13. Técnica Sustentada divide os slots de Sustentação dos Feitiços. Exaustão de Técnica e Fundamento morto de
    shikigami não bloqueiam Técnicas Marciais.
14. Técnica trancada (sem a classe) continua contando e valendo: só criar uma nova fica bloqueado.
15. Tipo migrado que a Técnica não tem (Dano, Especial, Técnica Máxima): mantém o tipo e avisa.
16. O limite de "até dois efeitos" do Fundamento não é imposto.

## 10. Armadilhas

- A Especialização Restringido só é "escolhida" com a origem Restringido (ou o Tipo). Ficha de teste sem origem vê o
  card trancado mesmo com a classe gravada.
- `derived.tecnicasMarciais` tem de sair fechado sem o card (assert de clone do `t-sistema`).
- A aba G2 só aparece pela prévia (`previaAbasG2`, que o App não passa). Conferência: `.audit/tecnicas-marciais-20261027/`
  (`gerar.mjs`, build isolado, `servidor.mjs 5341`, `g2.mjs`).
- Todo leitor da lista crua `creature.feiticos` precisa separar pela marca. Os que ficaram iguais de propósito estão
  listados no plano (`C:\Users\gabri\.claude\plans\okay-leia-em-f-m-snuggly-trinket.md`).
