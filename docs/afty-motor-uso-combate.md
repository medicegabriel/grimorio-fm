# Motor de uso e combate (CL1)

Guia do contrato estável de uso e das capacidades de combate entregues em 2026-10-29. Evidência da entrega em
`docs/revisao-livro-regras/entregas/CL1.md`. Tudo aqui é lógica pura sobre a sessão (`sessao`), sem React e sem
tela. Vale para criatura e personagem sem divergência, porque é mecânica de sessão e não altera nenhum número de
ficha existente. Quem liga isto às telas e ao conteúdo é o Codex (CX2 a CX6), e os pontos de ligação estão na seção 9.

## 1. O que existe e onde

| Arquivo (`src/systems/afty/ficha/`) | Papel |
|---|---|
| `ficha-uso-estado.js` | **Folha** (zero imports). A forma do que fica salvo em `sessao.uso`, a normalização e as transições de tempo |
| `ficha-uso.js` | O contrato de uso: `usa`, `avaliaUso`, `pagaManutencao`, `encerraUso` |
| `ficha-uso-clientes.js` | Descritores prontos (Armas Absolutas) e a ponte `usoDoEstado`, que faz de qualquer estado do catálogo um uso |
| `ficha-ataque.js` | Puro, zero imports. `resolveAtaque`, `resolveTR`, `melhorRolagem` |
| `ficha-dano-recebido.js` | `calculaDanoRecebido`, `calculaDanoNaAlma`, `aplicaDanoRecebido` |
| `ficha-combate-eventos.js` | Eventos de ataque, pendências do próximo ataque, Sequência de Ataques |
| `ficha-acoes.js` | Ações do turno, hierarquia, reações |
| `ficha-concentracao.js` | Concentração ligada ao efeito, teste e término |
| `efeitos/operacoes-uso.js` | Adaptadores `{ mesa, erro }` para a camada da mesa do G2 |

A sessão importa só a folha. Todo o resto importa a sessão, nunca o contrário (`asserts/t-ordem-modulos.mjs`).

Os clientes de CX3 usam `preparaReacaoAoDano` antes de aplicar dano de
arma e dano secundário do Dragão. A consulta recebe o dano pré-calculado,
emissor, turno e identidade do ataque ou TR. Ao confirmar, a janela
revalida as opções e aplica a reação junto do dano. Aparar Ataque tem
etapa anterior à confirmação do acerto, com disputa e custo por CL1.

## 2. O estado salvo: `sessao.uso`

Um campo só, normalizado em `normalizaSessao` (então viaja no Encontro, que guarda a sessão do combatente inteira).
Sessão gravada antes do motor ganha o estado em branco. Lixo vira o padrão e nunca derruba.

| Campo | O que guarda |
|---|---|
| `ops` | O anel dos ids de operação aplicados, do mais novo ao mais antigo, com teto `TETO_ANEL_OPS` (100). É a identidade da operação |
| `ativos` | `{ [usoId]: { id, nome, origem, desde, duracao, manutencao, cobranca, efeitos, concentracao, parametros } }` |
| `pendencias` | O que fica armado para o próximo ataque elegível (teto 12) |
| `sequencia` | `{ ataques }`: ataques recebidos desde o último turno desta ficha |
| `acoes` | `{ turno, gastas: { comum, bonus, movimento }, reacoes: { [id]: rodada }, livres: { [id]: rodada } }` |
| `concentracao` | `{ id, nome, ritualFeiticoId, desde }` ou `null`. Um espaço só |
| `teste` | `{ cd, causa, desde }` do teste de concentração pendente, ou `null` |

Reaproveitado, sem duplicar: o contador de usos (`sessao.usos`, com os prefixos `rodada:`, `turno:` e `cena:` que o
motor já zera), a recarga (`sessao.recargas`), os Buffs de Mesa (`sessao.buffs`) e o contador de reações do
Restringido (`especializacaoSessao`).

## 3. O contrato de uso

### 3.1 Identidade da operação

Toda operação que escreve exige `pedido.opId` (string). A tela cria o id **uma vez por intenção do clique**
(`novaOperacao()`) e o reenvia se precisar tentar de novo.

- Sem `opId`: recusa `Sem Identidade da Operação` (`sem-opid`).
- `opId` já aplicado: devolve `{ aplicado: false, repetida: true }` e a **mesma** sessão. Nada é debitado ou aplicado de novo.
- Recusa **não** entra no anel: o mesmo id serve depois de corrigido o motivo.
- Complementar: `pedido.esperado = { rodada?, usos?, energia? }` recusa com `A Ficha Mudou Antes de Confirmar` se o que a tela mostrou já não vale.

### 3.2 O descritor (dado)

```js
{
  id, nome, origem?,
  acesso?,           // boolean | { ok, motivo } | (sessao, derived, valores) => true | string
  emCombate?,        // exige combate ativo
  proibidoCom?,      // [nomes de condição] que impedem
  parametros?,       // [{ id, tipo: "opcao"|"faixa"|"bool", opcoes?, min?, max?, exige?, rotulo?, padrao?, obrigatorio? }]
  custo?,            // { pe?, vida? }, número ou (valores) => número
  cobranca?,         // "manual" (padrão) | "confirmada"
  usos?,             // { chave, max }: o contador que o motor já tem (derived.usosHabilidades)
  limite?,           // { por: "rodada"|"turno"|"cena", max? }
  recarga?,          // { rodadas }
  duracao?,          // { rodadas } | { ate: "cena"|"descanso"|"fimDoTurno"|"inicioDoProximoTurno" } | { manutencao: { pe } }
  efeitos?,          // [{ tipo: "estado", id, valor|{parametro}, desliga?, estado? } | { tipo: "buff", canal, expr, nome?, rodadas? } | { tipo: "pvTemporario", id, valor }]
  exclusivoCom?,     // [ids de uso] que não podem estar ativos juntos
  concentracao?,     // abre o espaço de concentração
  acao?,             // "comum"|"bonus"|"movimento"|"reacao"|"livre"|"completa"
  renova?,           // usar de novo enquanto ativo substitui, em vez de recusar "Já Ativo"
}
```

Um parâmetro `bool` com `exige: true` é a **confirmação da mesa** de um fato que a ficha não enxerga (empunhar a Arma
Dedicada, o alvo estar adjacente). A posição e a visibilidade continuam sendo informadas pela mesa.

### 3.3 `avaliaUso(sessao, derived, descritor, pedido)` e `bloqueioDeUso`

Puro, nada é escrito. Devolve `{ ok, recusas: [{ codigo, motivo, detalhe? }], motivo, valores, custo }`. `bloqueioDeUso`
devolve só o primeiro motivo, para desabilitar o botão (o mesmo formato de `bloqueioAcaoAddon`).

### 3.4 `usa(sessao, derived, descritor, pedido)`

Tudo ou nada. Retorno: `{ sessao, aplicado, repetida?, erro?, codigo?, recusas?, custo, ativoId?, acao?, evento? }`. Na
recusa e na repetição a sessão é o **mesmo objeto** que entrou.

Ordem da avaliação (a primeira recusa é o `erro`): a ficha mudou, parâmetros, acesso, combate, condições, expressão
inválida, já ativo, exclusividade, limite por rodada/turno/cena, usos, recarga, ação, concentração, Energia, vida.

| Código | Texto |
|---|---|
| `sem-opid` | Sem Identidade da Operação |
| `ficha-mudou` | A Ficha Mudou Antes de Confirmar |
| `parametro-falta` / `parametro-invalido` | Falta (rótulo) / (rótulo) Inválido / (rótulo) Fora da Faixa |
| `requisito-nao-confirmado` | o `rotulo` do parâmetro `exige` (ex.: Empunhando Arma Dedicada) |
| `acesso` | o texto devolvido pelo descritor, ou Acesso Indisponível |
| `fora-de-combate` | Pede Em Combate |
| `condicao-impede` | (Condição) Impede |
| `expressao-invalida` | Expressão Inválida |
| `ja-ativo` / `exclusivo` | Já Ativo / Exclusivo Com (nome) |
| `limite` | Já Usado Nesta Rodada / Neste Turno / Nesta Cena |
| `sem-usos` | Sem Usos Restantes |
| `recarga` | Recarga N / Aguarda Dissipar |
| `concentrado` | Já Concentrado (o `detalhe` traz o nome) |
| `sem-energia` / `sem-vida` | Faltam N PE / PV Insuficiente |
| `estado-recusado` | Estado Não Mudou |

Aplicado, nesta ordem: a concentração anterior cai (só se `encerraAnterior`), `marcaUso`, limite, recarga, ação (só se
`pedido.registraAcao`), pagamento, efeitos (estado por `alteraEstadoCombate`, Buff de Mesa), o uso ativo, a concentração, o
id no anel e o `aparaSessao`. Qualquer falha no meio devolve a sessão de antes.

### 3.5 Política de cobrança

O padrão é **não debitar** (decisão vigente do autor: `custoPE` de estado só é exibido; ver
`controle-nao-cobra-pe` e a pergunta M03 n.3).

- `manual`: a ficha confere que há Energia (`Faltam N PE`) e devolve `custo.pe.naoDescontado`. Quem desconta é a pessoa, pelo atalho de gasto que a tela já tem. É o que as telas devem rotular como "PE Não Descontado".
- `confirmada`: debita pelo `gastaPe` (casca primeiro) e pela `pagaCustoVida`, porque o clique no Usar é a confirmação, como já é na Técnica Máxima, no Golpe Especial e no Ataque Concentrado do G2. `custo.pe` traz `{ pedido, cobrado, casca, reserva }`, o que o Estornar PE devolve.
- Não existe `automatica` neste lote. O Invencível sob o Sol continua cobrando pelo ramo dele e **não migra**.

`custo` é sempre `{ pe: { pedido, cobrado, naoDescontado, casca, reserva }, vida: { pedido, pago, naoDescontado } }`.

### 3.6 Duração, manutenção e recarga

- **Duração em rodadas**: `{ rodadas: N }` cria um uso ativo que perde um por virada e sai ao zerar (`registro.encerrou` com `motivo: "duracao"`). Um efeito `buff` num uso com duração carrega `rodadas: null` e quem o encerra é o uso (uma contagem só). Sem duração, o Buff de Mesa leva as próprias `rodadas`.
- **Até a cena / o descanso / o fim do turno / o início do próximo turno**: o uso ativo cai no evento correspondente (fim do combate, descanso, `encerraTurnoFicha`, `iniciaTurnoFicha`). Um descritor com `emCombate: true` também cai no fim do combate, qualquer que seja a duração (Armas Absolutas: um estado de uma rodada não fica ligado para a luta seguinte). Ao cair, os efeitos que ele ligou são desfeitos: o estado volta ao valor `desliga` e o Buff de Mesa sai.
- **Desligado à mão**: se a pessoa desliga o estado (ou tira o Buff de Mesa) pelo seletor antigo da aba Buffs, que não conhece o uso ativo, a próxima virada ou turno o encerra com `motivo: "desligadoAMao"` e nada fica devido (`sincronizaUso`). Uso sem efeito nenhum não tem como ser visto desligado e fica.
- **Manutenção** (`{ manutencao: { pe } }`): o uso fica ativo sem prazo. A cada virada a ficha marca a manutenção como **devida** (`ativo.manutencao.devidas`, e `registro.manutencaoDevida` na virada). Ela **não debita nem desliga**. `pagaManutencao(sessao, derived, ativoId, { opId })` quita (em `manual` só marca e devolve `naoDescontado`, em `confirmada` debita) e devolve `atrasadas`. `encerraUso` desliga à mão. A segunda cobrança da mesma devida recusa `Nada Devido`.
- **Recarga**: `{ rodadas }` reutiliza `sessao.recargas`, que a virada já desce.
- **Limites** usam as chaves de `sessao.usos` com os prefixos que o motor já zera: `rodada:`, `turno:` e `cena:`.

## 4. Ataque, resultado confirmado, crítico, desastre e TR

`resolveAtaque({ rolagem, alvo, categoria, margem, camuflagemD10, informado, criticoSeAcertar, ajusteDefesa, atacante })`.

`rolagem` é o `rolarTeste` com `tipoTeste: "ataque"` (semântica de 1 e 20 naturais do CX1, consumida e não refeita). `alvo`
é `{ id, nome, defesa, cobertura, camuflagem, flanqueado }`: a `defesa` é a do `derived` do alvo (com a Sequência de
Ataques e as condições já dentro) e o resto é posição, informada pela mesa.

O controle "Defesa do alvo" que já existe por arma (Oscilante e Ampla, em `sessao.propriedadesArmas[arma].defesaAlvo`) continua
valendo e alimenta o `cd` do teste como antes: o mesmo número serve de `alvo.defesa` aqui, e a tela que declarar um alvo geral
passa a usar `resolveAtaque` para todas as armas.

Retorno: `{ ok, acertou, critico, desastre, motivo, defesa, ajustes, oportunidades, categoria, pendente? }`.

- Acerto: total igual ou superior à Defesa (p.279). 20 natural acerta e é crítico, 1 natural erra e é desastre (p.307). O crítico por margem reduzida só vale se acertar pela Defesa.
- O desastre devolve `oportunidades: [{ tipo: "ataque-de-reacao", contra }]` (p.307).
- Cobertura meia +2 e 3/4 +4 (a maior só), flanco −2 (p.294 e 295). Cobertura total recusa (`cobertura-total`).
- Camuflagem leve (1 e 2 no d10) e total (1 a 5) erram até o 20 natural (p.294). Sem o d10, `acertou: null` e `pendente: "camuflagem"`.
- Sem a Defesa, `acertou: null` e `pendente: "defesa"`, a menos que a mesa **informe** (`informado: "acerto"|"erro"`). O informado que contradiz o 20 ou o 1 natural é recusado (`informado-contradiz`).

`resolveTR({ cd, rolagem })` devolve `{ resultado: "sucesso"|"falha", sucessoCritico, falhaCritica, total, cd }`. O que o
sucesso faz (metade, anula, nenhum) é do efeito e entra em `calculaDanoRecebido`.

`melhorRolagem(a, b)` serve a rerrolagem que fica com o melhor (Armas Absolutas).

## 5. Dano recebido

Três operações **distintas**, escolhidas por `entrada.modo`:

| Modo | Regra | Passa pela casca de PV temporário? | Defesas do tipo? |
|---|---|---|---|
| `dano` (padrão) | p.309 | sim, e quebra a Guarda | sim |
| `perdaDeVida` | p.316 | não | não |
| `alma` (ou `tipo: "alma"`) | p.311 | não | só as do tipo `alma` (estados da aba de Defesas e a RD a Alma). O TR de Integridade vem depois delas |

Ordem do dano (p.309 e p.365), com piso em cada divisão: Imunidade zera, depois a metade do TR e a Resistência (metade),
depois a Vulnerabilidade (mais a metade), por fim a Redução de Dano subtrai, sem passar de zero. O `total` é o da rolagem
inteira (Durante e Após somados, "reduções e resistências serão aplicadas apenas uma vez", p.307). Um tipo por instância.

O **Dano na Alma** usa `calculaDanoNaAlma`: Imunidade, Resistência, Vulnerabilidade e a RD a Alma (a RD Geral não cobre a Alma, e
`porTipo.alma.rd` já vem sem ela) e **só depois** o TR de Integridade (metade em um sucesso, nada em um sucesso crítico). O texto
da p.311 manda o teste considerar "o total após qualquer resistência ou redução", e o texto específico ganha da ordem geral da
p.365. É leitura minha, registrada como pendência.

`calculaDanoRecebido({ total, defesa, tr, desempate, rdIgnorada })` é a conta pura: `{ ok, base, final, passos, avisos }`. A
`defesa` é `derived.defesasDano.porTipo[tipo]`. **Estados em conflito** (Resistente e Vulnerável no mesmo tipo) são
**recusados** (`defesa-conflito`), porque o livro não escreve o desempate. A mesa desempata passando `desempate`
(`imune`, `resistente`, `vulneravel`, `nenhum`).

`preparaDanoRecebido(derived, entrada)` expõe a mesma conta por modo
antes de qualquer consequência. Na confirmação do ataque com alvo, a
janela consulta esse resultado e o revalida ao receber a escolha.
`reducaoReacao` é um passo nomeado depois da RD para o tipo escolhido.
Uma reação que concede PV temporário usa `usa` antes da aplicação,
com remoção da fonte pelo encerramento do uso.

`aplicaDanoRecebido(sessao, derived, entrada, { opId })` termina nos verbos que já existiam (`aplicaDano`,
`aplicaPerdaDeVida`, `aplicaDanoNaAlma`) e devolve `{ sessao, aplicado, calculo, mudou: { vida, casca, alma },
excessoSobreZero, abateu, teste?, evento }`. `excessoSobreZero` é o quanto passou do PV, **sem ser guardado**: o saldo
negativo e as Portas da Morte são do CL2. Receber dano com a ficha concentrada abre o teste pendente com a CD certa.
`aplicaDano(sessao, n)` continua com a semântica de valor líquido que as três telas usam.

## 6. Eventos, pendências e Sequência de Ataques

- `registraAtaqueRealizado(sessao, derived, ataque, { opId })` (quem atacou) devolve `{ sessao, eventos, consumidas }`. Os eventos são `ataque`, `acerto` ou `erro`, `critico`, `desastre`. Consome as pendências elegíveis.
- `armaProximoAtaque(sessao, pendencia, { opId })` arma algo para o próximo ataque elegível: `{ id, usoId?, nome, elegivel: { qualquer?, exceto?, contraAlvo? }, consome: "acerto"|"declaracao", expira?, estado? }`. `consome: "acerto"` (padrão) não consome em erro (Canalizar em Golpe, p.178). `usoId` encerra o uso ligado ao consumir, `estado` desliga a chave de `combate`. `expira` aceita `fimDoTurno`, `inicioDoProximoTurno`, `rodada`, `descanso`.
- `elegiveisParaAtaque` mostra à tela o que um ataque consumiria.
- `registraAtaqueRecebido(sessao, derived, ataque, { opId })` (quem foi atacado) conta a **Sequência de Ataques** (p.310): a cada 2 ataques realizados a Defesa cai 1, até 5. Conta ataques que erraram também (leitura literal). A penalidade é um **Buff de Mesa de id fixo** (`cl1:sequencia-de-ataques`, canal `defesa`) que o derive já lê, então a Defesa do alvo no `derived` dele já a traz, sem canal nem variável nova. O início do turno do alvo (`iniciaTurnoFicha`, e a virada da ficha individual) fecha a sequência.
- `abateu` sai de `aplicaDanoRecebido` e `critico`/`acerto` de `resolveAtaque`: quem liga conteúdo (Renovação pelo Sangue, Eliminar e Continuar) lê essas listas, sem sessão nova.

## 7. Ações e reações

`gastaAcao(sessao, derived, tipo, { id })` devolve `{ sessao, usou, convertida, erro?, codigo? }`.

- Uma ação de cada por turno, comum, bônus e movimento (p.300). Hierarquia (p.301): movimento usa a própria, depois a bônus, depois a comum. Bônus usa a própria e depois a comum. A completa pede comum e bônus **livres** e não converte.
- A comum extra do Surto de Ação sai do contador que o Surto abriu.
- **A reação não tem contador novo**: é gasta por `usarEfeitoEspecializacao(..., "reacao")`, o mesmo do Restringido (Instintos Aguçados e Reação Rápida já contam). Acrescenta-se que a **mesma** reação serve uma vez por rodada, por `id` (p.300).
- A mesma ação livre também serve uma vez por rodada, por `id`.
- Atordoado, Inconsciente, Paralisado e Indefeso tiram as ações (p.318). Enjoado tira a conversão.
- Ninguém é barrado por não ter marcado a ação: o verbo só roda quando a tela, ou o `usa` com `registraAcao`, o chama.

## 8. Concentração

`concentracao` é **um espaço só** (p.320). Abrem o espaço um uso com `concentracao: true` e o Ritual Estendido (p.322).

- `abreTesteDeConcentracao(sessao, causa, dados)` calcula a CD: dano 10 ou metade do dano recebido (o maior), movido 5 mais a distância, empurrado ou agarrado 10 mais o Atletismo de quem fez, provocado 10 mais a perícia de quem provocou. A ficha **não rola sozinha**. Vários eventos antes do teste mantêm a maior CD.
- `rolaTesteDeConcentracao` rola com o bônus pronto de `derived.testes.manobras` (Fortitude, Faixa de Foco, Sofrendo) e registra a rolagem no log. `resolveTesteDeConcentracao` aceita a rolagem pronta ou o `total` informado, com `bonusExtra` (Concentrar Aura) e `reducaoCd`.
- Falhar chama `perdeConcentracao`: encerra o uso ativo (desfaz o que ele ligou) e cancela o Ritual Estendido.
- O Ritual Estendido abre o espaço em `iniciaRitualEstendido` e o fecha ao cancelar, finalizar, encerrar ou descansar. Se o espaço já estava ocupado, o ritual segue como sempre seguiu, e quem quiser recusar consulta `bloqueioRitualEstendido`.
- `CONDICOES_QUE_IMPEDEM_CONCENTRACAO` nasce **vazia**: o livro diz "certas condições" sem enumerar (p.320). O verbo existe e a lista é dado.

## 9. Pontos reais de integração

| Quem consome | Onde | O que acontece |
|---|---|---|
| Sessão | `normalizaSessao`, `sessaoEmBranco` | O campo `uso` nasce, é saneado e viaja |
| Virada de rodada | `proximaRodada` | Duração desce, manutenção fica devida, `registro.encerrou` e `registro.manutencaoDevida` |
| Início e fim de turno | `iniciaTurnoFicha`, `encerraTurnoFicha`, e a virada da ficha individual | Ações voltam, sequência fecha, o que era "até o próximo turno" cai |
| Fim do combate | `aplicaPatchCombate({ ativo: false })` | Cai o que era "até a cena" ou `emCombate`, limpa pendências e teste |
| Descanso | `descansar` | Encerra os usos e desfaz o que ligaram, zera o estado e conserva o anel de ids |
| Ritual Estendido | `iniciaRitualEstendido` e fechamentos | Abre e fecha a concentração |
| Encontro | os mesmos `iniciaTurnoFicha`, `encerraTurnoFicha`, `proximaRodada` | Cada combatante já usa |
| Camada da mesa do G2 | `efeitos/operacoes-uso.js` | Adaptadores `{ mesa, erro }` com evento e ativação |

### Um ataque entre dois combatentes (ordem das chamadas)

1. Atacante rola o d20 (`rolarTeste` com `tipoTeste: "ataque"`).
2. `resolveAtaque({ rolagem, alvo: { defesa: derivedDoAlvo.defesa, ... } })`.
3. Na sessão do atacante: `registraAtaqueRealizado`.
4. Na sessão do alvo: `registraAtaqueRecebido`, e se acertou, a rolagem de dano e `aplicaDanoRecebido` com `tipo`, `tr` e `desempate`. A **Guarda Inabalável** do alvo (`sofreGolpeNaGuarda`, ficha-sessao.js) também "cai 2 a cada ataque ou habilidade sofrida", acertando ou não: quem liga a tela chama esse verbo no mesmo passo, UMA vez. O motor de uso não o chama sozinho, porque a tela atual já tem o clique dele e contaria em dobro.
5. Se o alvo estava concentrado, `aplicaDanoRecebido` já deixou o teste pendente, e a pessoa rola `rolaTesteDeConcentracao`.

O Encontro guarda `sessao` por combatente, então os passos 3 e 4 são dois `PATCH_SESSAO`. Os testes `t-cl1-combate.mjs` percorrem essa cadeia com `deriveAfty` real.

## 10. O que NÃO está neste lote

- Portas da Morte, saldo negativo, Ferimento Complexo, Exaustão comum, Dados de Vida (CL2).
- Invocações, Domínios, barreiras e Votos (CL3).
- Telas: nenhum botão, painel ou leiaute novo. O G2 segue atrás da prévia e não foi promovido.
- Conteúdo de classes, talentos e itens: cada cliente novo é um descritor em `ficha-uso-clientes.js` (ou na própria habilidade) e uma chamada a `usa`.
- Cobrança automática e expiração por falta de pagamento (pergunta M03 n.3 aberta).

## 11. Como escrever um cliente novo

**Estado de combate que já existe** (o caso comum): a ponte `usoDoEstado(estado, derived, extras)`, em
`ficha-uso-clientes.js`, transforma uma linha de `COMBATE_ESTADOS`, de `estadosExtras` ou de Addon em descritor, sem mexer
no catálogo. O `custoPE` que hoje só é exibido passa a ser conferido (`Faltam N PE`) e devolvido como `naoDescontado`, o
`umaVezPorRodada` vira recusa com motivo, `max`, `min` e `opcoes` viram o parâmetro validado, e o estado é ligado pelo
mesmo `alteraEstadoCombate`, então o `exclusivoCom` (os dois Canalizar) segue valendo.

Canalizar em Golpe (Controle e Leitura, p.178) é "Ação de Movimento, gastar PE, o próximo ataque causa 1d6 por ponto, só um
ataque, não em Feitiços, errar não consome". O estado `canalizarEmGolpe` e o `custoPE` (o Nível de Aptidão) já vêm do catálogo:

```js
const estado = derived.combate.estadosExtras.find((e) => e.id === "canalizarEmGolpe");
const uso = usoDoEstado(estado, derived, { acao: "movimento", duracao: { ate: "inicioDoProximoTurno" } });
let r = usa(sessao, derived, uso, { opId, registraAcao: true });
r = armaProximoAtaque(r.sessao, {
  id: "canalizar", usoId: "canalizarEmGolpe", nome: "Canalizar em Golpe",
  elegivel: { exceto: ["feitico"] }, consome: "acerto", estado: "canalizarEmGolpe",
}, { opId: outroOpId });
// no ataque: registraAtaqueRealizado(sessao, derived, ataque, { opId }) consome só se acertou
```

**Habilidade nova sem estado**: escreva o descritor da seção 3.2 em `ficha-uso-clientes.js` (como Armas Absolutas) e chame `usa`.
O número do dano continua vindo do Motor pelo estado. O contrato só decide se pode, cobra (ou marca), registra a duração e o
consumo.

## 12. Testes

`asserts/t-cl1-uso.mjs` (contrato, política, persistência, nos dois sistemas), `asserts/t-cl1-combate.mjs` (ataque,
TR, dano na ordem do livro, pendências, Sequência, ações, concentração) e `asserts/t-cl1-mesa.mjs` (adaptadores do G2).
