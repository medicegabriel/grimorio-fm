# Encontros do Afty: o modelo unificado

Guia do Encontro novo, que junta a 2.5.2 e o Afty num modelo só e serve de base para a Sala online.
O plano aprovado está em `C:/Projetos/Grimorio/PLANO-APROVADO-ENCONTRO-UNIFICADO-SALA.md`, fora do
repositório, e o andamento por etapa em `PROGRESSO-ENCONTRO-UNIFICADO-SALA.md`, ao lado dele.

Estado em 2026-11-18: as etapas 1 a 7c estão prontas e esta documentação foi conferida contra o código na 8a. **As telas novas estão ligadas**
nas três listas (ver "As telas") e a **Sala online** funciona sobre elas (ver "O Encontro na Sala" e "As telas da Sala", e o guia de banco e cliente
em `docs/nuvem-supabase.md`). O cadeado de `/` e `/Player` saiu em 2026-11-18, depois da revisão final (etapa 8b), a pedido do autor: os Encontros
e a Sala estão abertos a todos.

O que ficou de pé do Encontro de antes: `AftyEncontros.jsx`, `AftyEncontro.jsx`, `PainelDeCombatente.jsx` e `usar-encontros-afty.js` não são mais
montados por ninguém (código morto, em `docs/a-fazer.md`). `usar-encontro-afty.js` ainda é importado (`derivarComCache`, `PATCH_SESSOES` nos asserts) e
`afty-encontro.js` guarda as constantes (status, lados, `LOG_MAX`). O gerenciador da 2.5.2 em `src/` (`useEncounterManager`, `useEncounter`)
não é mais usado pelo `App.jsx`.

## Onde mora cada parte

Tudo em `src/systems/afty/encontros/`, ao lado dos módulos antigos, sem tocá-los.

| Arquivo | O que faz |
|---|---|
| `motores/interface.js` | a lista de verbos do adaptador (`VERBOS_DO_MOTOR`), os dados que ele declara e o erro `MotorPendente`. FOLHA, zero imports |
| `motores/afty.js` | o adaptador do Afty, por cima dos verbos de `ficha/ficha-sessao.js` |
| `motores/m252.js` | o adaptador da 2.5.2: os verbos da interface sobre `m252-vital.js` |
| `motores/m252-vital.js` | a conta da 2.5.2, cópia fiel do `CombatantPanel`, do `EncounterTracker` e do `useEncounter`, com a origem de cada trecho anotada |
| `motores/index.js` | `MOTORES`, `motorDe(combatente)` |
| `modelo.js` | as constantes, a forma do combatente e do Encontro, criação, saneamento, ordem de turno, `derivarEncontro` |
| `operacoes.js` | a operação tipada, o delta, pedidos, histórico, Desfazer, ações em grupo |
| `redutor.js` | `redutorDoEncontro(mundo, acao)`, o sucessor do `redutorDeEncontro` |
| `listas.js` | as três listas de Encontros e os inventários lidos direto da chave |
| `migracao.js` | a leitura do formato antigo e a cópia para a lista do site padrão |
| `pastas.js` | as pastas próprias de cada lista de Encontros |
| `usar-lista-encontros.js`, `usar-encontro.js` | os ganchos das telas (ver "As telas") |
| `telas/`, `encontro-g2.css` | as telas do Encontro novo |

⚠ **Ordem de import.** Todo módulo novo que precisa de motor importa `./motores/index` PRIMEIRO, com
o `/index` escrito: o shim dos asserts só acrescenta `.js`. O `motores/afty.js` entra por
`usar-encontro-afty.js`, que importa `afty-derive.js` antes de tudo. Todos os módulos novos de `encontros/`
(também `pastas.js`, `usar-lista-encontros.js`, `usar-encontro.js` e `motores/m252-vital.js`) estão em
`docs/revisao-automacao/escopo.json` como `INTERFACE`. Os de `src/nuvem/` não entram nesse escopo, que cobre só `src/systems/afty/`.

## O mundo

As funções são puras e trabalham sobre um **mundo**:

```js
mundo = { encontro, sessoes, fichas }
```

- `encontro`: o Encontro no formato novo (abaixo).
- `sessoes`: a sessão de cada PERSONAGEM ligado, pelo `fichaRef.id`. É a mesma sessão da Ficha
  (`fm_ficha_sessao_afty_v1:<id>`), que mora fora do Encontro, e chega pela loja da sessão
  (`ficha/sessao-loja.js`). Na Sala o personagem de um jogador vem da `fonte` do gancho, nunca da loja
  (ver "O Encontro na Sala").
- `fichas`: a ficha de cada personagem ligado, pelo id, lida do inventário (`fichasDoInventario`).

A criatura guarda a instância DENTRO do Encontro (`ficha` mais `sessao` no Afty, `snapshot` mais
`combatState` na 2.5.2). O personagem guarda só a referência.

## O Encontro

```js
{
  id, versao: 2, grupo: "site" | "afty" | "eradeouro" | null,
  nome, pastaId, criadoEm, atualizadoEm,
  status: "planejando" | "ativo" | "finalizado", rodada, ativoId,
  combatentes: [...],
  log: [...],         // o Registro do Encontro, mais nova primeiro, teto LOG_MAX (200)
  pedidos: [...],     // só os pendentes
  config: { aceitarSozinho: false },
  origem?: { chave, id },   // só no Encontro migrado
}
```

`normalizarEncontro` devolve `null` para o que não é `versao: 2`: quem lê o formato antigo é
`migracao.js`. O saneamento tira combatente repetido por id e a segunda cópia LIGADA da mesma ficha
(duas entradas ligadas teriam uma sessão só).

## O combatente

Campos comuns:

```js
{
  id, motor: "afty" | "252" | null, tipo: "personagem" | "criatura" | "marcador",
  nome, iniciativa: { rolagem, mod, total, manual },
  flags: { abatido, foraDaOrdem, lado: "inimigo" | "jogador" | "aliado" },
  visao: "oculta" | "nome" | "barra" | "aberta" | null,
  dono: { conta, papel: "mestre" | "jogador" },
}
```

Por tipo:

| Tipo | Campos próprios | Motor |
|---|---|---|
| personagem ligado | `fichaRef: { chave, id }`, `copiaAntiga?` | `afty` |
| personagem cópia | `criaturaId`, `origem`, `ficha`, `sessao` | `afty` |
| criatura do Afty | `criaturaId`, `origem: { chave, id }`, `ficha`, `sessao` | `afty` |
| criatura da 2.5.2 | `criaturaId`, `origem`, `snapshot`, `combatState` | `252` |
| marcador | nada | `null` |

- **`foraDaOrdem`** substitui o `oculto` antigo (quem sai da ordem de turno). O saneamento lê o
  `oculto` como `foraDaOrdem`. Esconder dos jogadores é a `visao`, outra coisa.
- **`visao`** é o que o jogador vê na Sala. Criatura nasce `oculta`. Marcador nasce `oculta` se é
  inimigo, senão `nome`. Personagem é sempre `null` (o jogador vê a própria ficha, e o que ele mostra
  aos colegas é o resumo e o compartilhamento da Sala, não a `visao`). Rótulos em `VISAO_ROTULO`: Oculta, Só Nome, Barra de Vida, Aberta.
- **`dono`**: personagem é do jogador, criatura e marcador são do Mestre. Sem Sala a `conta` é
  `null` e quem decide é o papel.
- Combatente que perdeu o que o define (criatura sem ficha, personagem sem referência nem cópia)
  desce para marcador com o mesmo nome e a mesma iniciativa, em vez de sumir.
- `copiaAntiga: { sessao, nome, guardadaEm }` é a sessão que o personagem tinha como cópia num
  Encontro antigo, guardada só para consulta (ver Migração).

Criação: `criarPersonagem(ficha, { chave, lado, derived, dono })`, `criarCriatura(ficha, { chave,
motor, lado, derived })`, `criarMarcador({ nome, mod, lado })`. A criatura da 2.5.2 chama
`estadoInicial` do motor dela, que respeita o `combatState` que a ficha já traz.

Ordem de turno: joga quem não está `abatido` nem `foraDaOrdem` (`jogaTurno`). `renumerarCopias`
numera só criaturas, agrupadas por motor e origem.

## O adaptador de motor

Cada motor é um objeto com dados e verbos. O Encontro nunca chama `ficha-sessao.js` direto: ele
chama o adaptador, e a 2.5.2 entra pelo mesmo buraco (etapa 4, feita).

Dados:

| Campo | Afty | 2.5.2 |
|---|---|---|
| `motor` | `"afty"` | `"2.5.2"` |
| `campoDoEstado` | `sessao` | `combatState` |
| `campoDoRegistro` | `log` | `combatLog` |
| `porChave` | `pvTempFontes`, `peTempFontes`, `usos`, `combate`, `treinosAtivos`, `contadoresSessao`, `recargas`, `invocacoes` | `peTempSources` |
| `relativos` | `hpAtual`, `peAtual`, `almaAtual`, `pvTempFontes.*`, `peTempFontes.*` | `hpCurrent`, `peCurrent`, `almaAtual`, `guardaInabavalCurrent`, `peTempSources.*` |
| `ignorados` | `log`, `historico`, `atualizadoEm` | `combatLog`, `historico` |

Verbos (`VERBOS_DO_MOTOR`): `estadoInicial`, `normalizarEstado`, `derivar`, `aparar`,
`aplicarDano`, `aplicarCura`, `gastarPe`, `recuperarPe`, `descansar`, `alma`, `condicao`,
`iniciaCombate`, `encerraCombate`, `iniciaTurno`, `encerraTurno`, `viraRodada`, `resumo`, `limite`.
Os dez do plano estão aí. Os outros oito existem porque o Encontro de hoje já os usa (aparar,
Descansar, Recuperar PE, abrir e fechar o combate) ou porque o Desfazer precisa do máximo
(`limite`).

O adaptador do Afty só embrulha o que já existe: `aplicarCura` com o teto de `derived.hp`, como a
Mesa do Mestre fazia, `recuperarPe` copiado de `aplicarNaMesa`, `encerraTurno` com o fim de turno
das armas, `viraRodada` devolvendo `{ estado, expirou, registro }`, e `resumo` com
`maximosRecursosNaSessao`.

`faltasDoAdaptador(motor)` lista o verbo que falta. O assert exige lista vazia nos dois.

## Toda mudança é uma operação

A operação é JSON puro, do jeito que a Sala grava no banco (etapa 7a) e que a automação vai pedir:

```js
{
  id, versao: 1, tipo, autor: { conta, papel, combatente }, alvo,
  entrada: { valor, rolagem?, ... },     // a intenção, com a rolagem já feita
  delta: [{ caminho, antes, depois, soma? }],
  quando,
  grupo?, registros?, pedido?: { estado, por?, em?, pedidoEm? }, desfaz?,
}
```

- **Tipos** (`TIPO_OPERACAO`): `dano`, `danoMetade`, `cura`, `gastarPe`, `recuperarPe`,
  `descansar`, `alma`, `condicao` (os tipados), `sessao` (a genérica) e `desfazer`.
- **`delta`** é a diferença ESTRUTURAL no estado do alvo, só nos caminhos tocados. Cada mudança
  traz o `antes` e o `depois` daquele caminho, e `soma` quando os dois são números. Chave que some
  ou nasce é `AUSENTE` (`{ $ausente: true }`), porque o JSON apaga `undefined`. Listas e objetos
  comuns vão inteiros. Os mapas de `porChave` descem um nível (uma casca por fonte, um uso por
  habilidade). A ordem é a das chaves do estado novo, para o texto gravado não mudar à toa.
- **`registros`** são as entradas novas do `log` da Ficha que o verbo escreveu. Acompanham a
  operação e não se desfazem.
- **A operação genérica** (`tipo: "sessao"`) carrega o delta do que a Ficha G2 embutida muda pelo
  `onSessao`: a intenção traz `passo(sessao) => sessao`, e o delta é medido igual.

**Duas fases.** `prepararOperacao(mundo, intencao, ctx)` roda FORA do redutor, onde existe o
derivado (`ctx.derivados[combatenteId]`): chama o verbo uma vez e mede o delta. Cura, Recuperar PE,
Descansar e Alma recusam sem derivado (`"Ficha sem Cálculo"`). Mudança nenhuma é `"Nada Mudou"`.
`aplicarOperacao(mundo, op)` é um remendo puro, com pré-condição por VALOR: cada caminho precisa
estar com o `antes`, senão nada entra e volta `{ ok: false, conflitos }`. É a conferência do
`PATCH_SESSOES`, agora válida depois do JSON e entre aparelhos. `aplicarOperacoes` é tudo ou nada.

Toda operação aplicada escreve uma linha no Registro do Encontro (`mensagemDaOperacao`, por
exemplo "Dano: 20 em Lia.") com `operacaoId`.

`operar(mundo, intencao, ctx)` junta as duas fases com a autoridade e devolve `{ mundo, ok,
operacao?, pedido?, pendente?, erro? }`.

## Pedidos

`autoridade(autor, combatente)`:

| Quem | No que é dele | No que não é |
|---|---|---|
| Mestre | direta | direta |
| Jogador | direta | pedido |
| Espectador | recusada | recusada |

O pedido guarda a INTENÇÃO, com a rolagem já feita, e nenhum delta: o delta é medido no ACEITE,
contra o estado daquela hora. `aceitarPedido(mundo, id, quem, ctx)` mantém o id e o `quando` do
pedido e marca `pedido: { estado: "aceito", por, em, pedidoEm }`. `recusarPedido` tira da fila e
anota "Pedido Recusado" no Registro. Responde o Mestre ou o dono do alvo (`podeResponder`).

**Aceitar Sozinho** é por Encontro (`config.aceitarSozinho`). Ligado, o pedido nasce aceito, por
`AUTOR_SISTEMA` e com `automatico: true`.

Pedido com vários alvos não existe (`docs/a-fazer.md`). Hoje a ação em grupo de um jogador vira um pedido
por alvo.

## Histórico

O que OUTRA pessoa fez num combatente fica em `historico`, no estado dele (a sessão da Ficha no
personagem), separado do `log` da Ficha (teto 50). Teto de 500, mais nova primeiro (autor,
2026-11-17). `historico` passa pelos verbos de `ficha-sessao.js` porque eles espalham a sessão, e
não foi acrescentado a `sessaoEmBranco`.

Entra quando `!ehDono(autor, combatente)`. `mesmaPessoa` compara conta com conta quando as duas
existem, senão papel com papel. Conta de um lado só conta como outra pessoa. Sem Sala, valeu
"Personagem por Papel": o Mestre mexendo no personagem entra no histórico do personagem, e o Mestre
mexendo na criatura não entra. Virada de turno e de rodada nunca entram.

## Desfazer

O Desfazer é uma operação nova (`{ tipo: "desfazer", desfaz: id }`), nunca uma remoção: o registro
da Sala é só de acréscimo. A entrada original no histórico ganha `desfeita`. Pode desfazer o dono do
alvo ou o Mestre.

Regra do autor (2026-11-17): **relativo nos números**.

- `hpAtual`, `peAtual`, `almaAtual` e as cascas (`pvTempFontes.*`, `peTempFontes.*`) voltam pelo
  delta a partir do valor ATUAL, mesmo com outra mudança no meio, desde que o resultado caiba entre 0
  e o máximo. Exemplo: 120, dano de 30 para 90, dano de 12 para 78, cura de 5 para 83. Desfazer o
  dano de 12 dá 95.
- O máximo de Vida, PE e Alma sai de `motor.limite`, com o derivado do estado já desfeito quando a
  tela passa `ctx.derivar` (desfazer um buff que mudou o máximo), senão o derivado atual. O máximo
  da casca é o valor dela antes da operação.
- Os outros caminhos só voltam se ainda estiverem como a operação deixou.
- Qualquer caminho que não fecha cancela o Desfazer INTEIRO (`"Não Fecha"`) com a lista de
  conflitos e o motivo de cada um: `mudou`, `foraDoLimite` ou `semCalculo`.

Outros erros: `"Sem Permissão"`, `"Operação Ausente"`, `"Já Desfeita"`, `"Não Desfazível"`.

## Ações em grupo

`acaoEmGrupo(mundo, { acao, valor, alvos, autor }, ctx)` faz Dano, Dano pela Metade, Cura, Gastar
PE, Recuperar PE e Descansar (`ACOES_DE_GRUPO`) como UMA operação por alvo, com o mesmo `grupo`.
Os verbos de `aplicarNaMesa` (Mesa do Mestre) foram trazidos para cá por cópia, sem import. A Mesa saiu na etapa 6b (2026-11-17), e o
assert passou a guardar os resultados dos seis como valores literais.

`operarComAlvo` e `operarComGrupo` são o equivalente dos de hoje: duas operações `sessao` aplicadas
juntas, tudo ou nada, só com autoridade direta.

## O redutor

`redutorDoEncontro(mundo, acao)` devolve o mundo novo. Ações (`ACOES_DO_REDUTOR`):

- Montagem: `RENOMEAR`, `ADICIONAR { combatente, sessao?, iniciativa? }`, `REMOVER`,
  `DEFINIR_INICIATIVA`, `DEFINIR_MOD`, `ROLAR_UMA { rolagem }`, `ROLAR_TODAS { rolagens }`,
  `DEFINIR_LADO`, `DEFINIR_FLAG` (`abatido`, `foraDaOrdem`, e `oculto` lido como `foraDaOrdem`),
  `DEFINIR_VISAO` (ignorado no personagem), `DEFINIR_DONO`, `CONFIGURAR` (só as chaves de
  `CONFIG_PADRAO`).
- Operações: `OPERACAO`, `OPERACOES`, `RESOLVER_PEDIDO`, `RECUSAR_PEDIDO`.
- Fundamentos: `REGISTRAR_FUNDAMENTO_PERDIDO`, `RESULTADO_FUNDAMENTOS_BIBLIOTECA`.
- Luta: `COMECAR`, `PROXIMO_TURNO`, `NOVA_RODADA`, `ENCERRAR`, `REABRIR`, `LEVANTAR_TODOS`,
  `REGISTRAR`.

O fluxo de turno é o do redutor antigo, verbo por verbo, agora pelo adaptador. O personagem ligado
recebe a sessão do mapa na vista e devolve ao mapa no fim. O assert roda a mesma luta nos dois
redutores e compara as sessões e as mensagens. A rolagem chega pronta na ação: o redutor não sorteia.

A criatura da 2.5.2 passa pelo mesmo fluxo, com o terceiro argumento do verbo de turno (ver "O motor da 2.5.2").

## As três listas

| Lista | Rotas | Chave | Inventário |
|---|---|---|---|
| `site` | `/` e `/Player` | `afty_encontros_site_v1` (nova) | `fm_creatures_v1`, `fm_creatures_player_v1` |
| `afty` | `/Afty` | `afty_encontros_v1` | `fm_creatures_afty_v1`, `fm_creatures_player_v1` |
| `eradeouro` | `/EraDeOuro` | `afty_encontros_eradeouro_v1` | `fm_creatures_eradeouro_v1` |

`grupoDaRota(rotaId)` escolhe a lista. As três têm prefixo `afty_` e vão para a nuvem pessoal.

⚠ **A fronteira é a chave do inventário**, não o `mesa` da ficha (o import da Guilda não carimba
`mesa`). `classificarNaChave(ficha, chave)`:

- `fm_creatures_v1` aceita só ficha da 2.5.2 (sem marca do Afty): criatura do motor `252`.
- As outras aceitam só marca do Afty ou do Player. Player é personagem e entra LIGADO. Afty é
  criatura e entra como cópia.
- Ficha sem `rulesVersion` recebe o sistema da chave, só na memória.

⚠ **O inventário é lido direto da chave** (`lerInventario`), nunca pelo `useCreatureStorage`, que
carimba e regrava. A leitura é memorizada pelo texto gravado: o mesmo texto devolve os mesmos
objetos, e é isso que deixa o cache do derive (pela identidade da ficha) funcionar.

⚠ **`gravarLista` recusa `afty_encontros_v1` e `afty_encontros_eradeouro_v1`** (`"Chave com Tela
Antiga"`) sem a opção `telaAntigaDesligada`: o `normalizarEncontro` antigo leria um personagem
ligado como marcador. Desde a 6a quem grava nelas (`usar-lista-encontros.js` e `sala-fechamento.js`)
passa a opção como `true`. `CHAVES_COM_TELA_ANTIGA` e a opção ficam até o código morto do Encontro de
antes sair (`docs/a-fazer.md`).

## Migração

Decisão do autor: os Encontros antigos convertem sozinhos, e **nenhuma chave antiga é apagada ou
regravada**.

- **Leitura na memória** (`lerListaDeEncontros(grupo)`): o `/Afty` e a Guilda continuam na chave
  de sempre, e o Encontro antigo vira o novo ao ser lido, sem gravar. Lista ilegível devolve `null`,
  nunca lista vazia, para ninguém gravar por cima.
- **Cópia para o site** (`executarMigracaoDoSite(armazem)`), a única coisa que grava, e só em
  `afty_encontros_site_v1` e no registro `afty_encontros_site_migracao_v1`:
  - todo Encontro de `fm_encounters_v1`, com id `site252_<id>`;
  - todo Encontro de `afty_encontros_v1` que só tem personagem e marcador, com pelo menos um
    personagem, com id `siteafty_<id>` (quem montou no `/Player` antes do cadeado).

Conversão da 2.5.2 (`encontroDe252`): o `snapshot` e o `combatState` passam sem transformação, o
jogador sem ficha vira marcador, o `isHidden` vira `foraDaOrdem`, a criatura nasce Oculta, e o
status, a rodada, a vez, a pasta e o registro vêm junto. Ficha com marca do Afty dentro de um
Encontro da 2.5.2 é recusada e listada em `recusados`.

Conversão do Afty de antes (`encontroDeAftyAntigo`): o `oculto` vira `foraDaOrdem`. O personagem
que era cópia segue "Ligar e Guardar a Cópia" (autor, 2026-11-17): se a ficha está no inventário da
lista, ele passa a ligado e a sessão da cópia fica em `copiaAntiga`. Sem a ficha, continua cópia. A
mesma ficha duas vezes no Encontro: só a primeira liga.

⚠ **Idempotente, com id estável.** Os combatentes mantêm o id. A segunda rodada pula o que já está
no registro, e a cópia cujo id já está na lista só é registrada, sem sobrescrever o que a pessoa
mudou. O registro é uma lista de `{ id: "<chave>:<id>", destino, em }`, que a nuvem une por id, e é
ele que impede o Encontro migrado que a pessoa apagou de voltar. Dois aparelhos com os mesmos
antigos produzem a mesma lista, byte a byte.

⚠ **Uma escrita por chave, a lista primeiro.** Cota estourada na lista não grava nada, nem o
registro, e a próxima abertura tenta de novo. Lista do site ilegível não é sobrescrita. Registro sem
espaço deixa a lista e devolve `registroGravado: false`, e a rodada seguinte acha as cópias pelo id.

Limite conhecido: sem o registro (aparelho limpo e sem nuvem), o Encontro migrado que a pessoa
apagou volta na próxima rodada, porque a chave antiga ainda o tem.

## As telas (etapa 6a, 2026-11-17)

Tudo em `encontros/telas/`, com o CSS em `encontros/encontro-g2.css`. A raiz de cada tela é `.afty-ficha` sem tema (os tokens do padrão)
mais `.ec-raiz`, que é onde os diálogos entram por portal. Cor só por token `--afty-*`, e os derivados `--ec-*` seguem as fórmulas dos `--e-*`
do G2.

| Arquivo | O que é |
|---|---|
| `ListaDeEncontros.jsx` | a lista: pastas próprias, busca, status, cartões que se arrastam (dnd-kit), seleção de vários com Mover e Apagar |
| `Planejamento.jsx` | à esquerda `AdicionarCombatentes.jsx` (Personagens, Criaturas com quantidade, Sem Ficha), à direita a escalação por lado |
| `LutaDoMestre.jsx` | a luta em três colunas: Ordem, escolhido (Ficha G2 embutida ou `PainelCriatura252.jsx`) e Registro (Pedidos, Histórico com Desfazer) |
| `EncontroTela.jsx` | o roteador por status, as Configurações (Aceitar Sozinho, Automação "Em Breve"), o Finalizado e os avisos de topo |
| `FaixaDaLuta.jsx` | a faixa da luta do jogador. Recebe os dados da Sala (`dados`) e usa `FAIXA_DE_EXEMPLO` só como padrão, quando não recebe dados |
| `LinhasDoRegistro.jsx` | as linhas do Registro, com as da Sala (etapa 7c) |
| `pecas-encontro.jsx`, `pecas-dados.js` | retrato por iniciais, lado com ícone e palavra, barra curta, seletor de visão, diálogo, confirmação, vazio, o gancho de largura |

Os ganchos: `usar-lista-encontros.js` (a lista de uma rota, as pastas de `pastas.js`, a migração do site) e `usar-encontro.js` (o mundo de um
Encontro e as ações da tela).

⚠ **A migração do site roda uma vez por página, antes de qualquer leitura, em qualquer rota** (`migrarUmaVez`). Ela reconhece os Encontros do
`/Player` de antes pelo formato antigo de `afty_encontros_v1`, e o `/Afty` regrava essa chave no formato novo. Na rota da Sala o gancho da
lista fica desligado (`ativo: false`): não migra, não lê e não grava.

⚠ **Toda ação sai do estado de agora.** O `executar` de `usar-encontro.js` roda dentro do `atualizar` da lista (que entrega o Encontro de agora)
e lê as sessões da loja na mesma hora. As sessões dos personagens ligados voltam pela loja (`atualizar` com `reaplicarSobre`): se a loja tem uma
versão mais nova, a diferença da ação vai por cima dela, com as entradas novas do histórico e do registro. Nunca pelo `salvarSessao`.

⚠ **A largura da Luta é medida por `ResizeObserver`** (`useFaixaDeLargura`), e não por `@container`: a coluna do meio carrega a Ficha G2,
cujo painel de fontes é `position: fixed`, e um contêiner o prenderia. Até 760 px, três painéis com faixa de troca. De 760 a 1180, duas colunas
e o Registro por cima. Acima, três colunas. A coluna da G2 mede a si mesma (`FichaEmbutida`) e, abaixo de 1120 px, aplica o leiaute de placa que
a Ficha sozinha usa abaixo de 1120 px de janela. Lista e Planejamento usam `@container` de verdade, numa caixa própria (`.ec-lista-caixa`,
`.ec-plano-caixa`), porque um contêiner não consulta a si mesmo.

**A Ficha G2 embutida** (`sessao` e `onSessao`, etapa 2): sem tema (autor, "Padrão para Todos"), sem Voltar, Editar, Aparência e o Encerrar
Meu Turno da Ficha (autor, "Só a Busca Fica"), com o Em Combate desabilitado, o teclado preso à raiz da Ficha e a posição de rolagem lida da
coluna `[data-afty-rolagem]`. Cada mudança dela vira uma operação `sessao`. O CSS dela mora sob `data-afty-embutida`. Nenhum gravador da ficha
(tema, preferências, pacotes, recurso próprio) é passado.

**Sem Dano Rápido por linha** (autor, 2026-11-17, "fica efetivamente bem feia"): o dano vai pela seleção com a barra de ações em grupo, ou por
"-12" e "+5" na Vida da Ficha e do painel da 2.5.2 (os verbos tipados, com RD e Guarda na 2.5.2).

O cadeado de `/` e `/Player` saiu em 2026-11-18 (autor, depois da 8b): saíram juntos `encontrosBloqueados`, `SALA_COM_CADEADO`, a chave de aparelho
`dev_sala_teste` e a faixa de exemplo do `App.jsx`, e a prop `encontrosBloqueados` do `Dashboard.jsx` ficou sem uso (anotado no `AGENTS.md`). `/Sala/<código>`,
o botão Abrir Sala (com a nuvem ligada) e a recuperação do ausente valem nas quatro rotas.

## As telas, etapa 6b (2026-11-17)

- **A Mesa do Mestre saiu.** `MesaDoMestre.jsx`, `mesa-do-mestre.js`, `mesa-do-mestre-sessao.js` e `t-mesa-do-mestre.mjs` foram apagados, e o
  `App.jsx` deixou de passar `onGoToMestre` (a exceção do `Dashboard.jsx` ficou sem uso, anotada no `AGENTS.md`). O dado em
  `fm_mesa_mestre_eradeouro_v1` não foi tocado. Os verbos de grupo já estavam no Encontro desde a etapa 3. O que a Mesa tinha e o Encontro
  não tem: a ficha **importada como cópia** (o jogador sem conta entra como Sem Ficha ou pela lista da Guilda, depois do Importar do
  Dashboard).
- **Atualizar da Ficha** (no lugar do `EncounterSyncModal`): `fichaNovaDe(combatente, inventario)` (`listas.js`) diz se a ficha da
  biblioteca mudou (`updatedAt` ou tamanho do `editLog`, sem carimbo nos dois lados conta como em dia), `derivado.desatualizados` leva o
  resultado à tela, e a ação `ATUALIZAR_FICHA` do redutor troca a ficha. Na 2.5.2 é a conta do `handleSyncConfirm` (a ficha vira o
  `snapshot`, o máximo vira `hpMaxBase`, a Vida atual não passa dele) e o `combatSettings` do Encontro fica. Na cópia do Afty (autor, 2026-11-17)
  a ficha clonada é refeita, as perdas de Fundamento ficam e a sessão é aparada pelo derivado novo. O botão é um aviso acima da Ficha do escolhido.
  O `App.jsx` não abre mais o modal e não usa mais o `useEncounterManager`, então salvar uma criatura não reescreve mais `fm_encounters_v1`
  (a chave antiga fica de fato intocada).
- **Painel da criatura da 2.5.2:** Habilidades Ativáveis (`ativarRegra` com o retorno do uso, que some em 2,6 s), Reações ao Sofrer Dano
  (com o `lastDamage` que o motor grava), formulário de modificador manual com os modificadores passivos, aviso de condição imune ou repetida
  (não bloqueia a imune, como o painel de antes) e os Ajustes de Combate (Guarda Absorve Primeiro e RD Reduz o Dano, pela ação
  `AJUSTAR_COMBATE`, que grava em `snapshot.combatSettings`). A linha "RD no Próximo Dano" mostra o resultado da conta do menu de ajustes.
  Os ajudantes puros moram em `motores/m252-vital.js` (`extrasDoPainel`, `estadoDaRegra`, `efeitoDaRegra`, `rdNoProximoDano`).
- **Consertos:** a largura dos campos numéricos virou `data-largura` no CSS (nenhum estilo inline repetido sobrou, só os que dependem de valor),
  os textos de confirmação perderam as frases que só tranquilizavam, e os rótulos do formulário de modificador passam por Title Case.
- **Não ligado, por decisão:** o contador de erros da 2.5.2 (sem botão no painel de antes) e os gravadores do personagem ligado na G2
  embutida (tema, Espinho, pacotes, recurso próprio). Ver `docs/a-fazer.md`.

## Onde cada coisa foi feita, e o que falta

- Motor da 2.5.2: "O motor da 2.5.2". Duração: "A duração por quem aplicou". Telas locais: "As telas" e "As telas, etapa 6b".
- Sala: "O Encontro na Sala" e "As telas da Sala". O banco e o cliente têm guia próprio em `docs/nuvem-supabase.md`.
- A operação é o formato que a Sala grava no banco: a RPC confere a pré-condição do delta, e a `visao` decide o que a versão pública mostra.
- **Ainda não existe** (`docs/a-fazer.md`): a automação completa (Fase 2), o VTT com mapa e tokens (Fase 3), o pedido com vários alvos,
  o co-Mestre conduzindo a luta e o modo de leitura de verdade na G2.

## O motor da 2.5.2

`motores/m252.js` põe os verbos da interface sobre `motores/m252-vital.js`. O que é puro e exportado na 2.5.2
é importado como está (`fm-encounter.js`, `fm-modifiers.js`, `fm-automation.js`, `fm-automation-entities.js`,
`fm-conditions.js`, `fm-dsl.js`, `fm-tables.js`). O que morava dentro de componentes e do reducer privado foi
COPIADO, sem melhorar nada, com arquivo e linhas de origem no cabeçalho de cada função. O
`asserts/t-encontro-252-porte.mjs` confere que a fonte ainda diz o que está citado.

**O derivado da 2.5.2 é um objeto**, `derivarVivo(snapshot, combatState)`: os stats AO VIVO (passivos, condições, penalidade
da Alma e modificadores ativos, a cadeia do painel), `saves`, `snapshot`, `almaEstado`, `combatSettings` e `hpMaxBase`. Verbo
de número sem ele lança "Ficha sem Cálculo" (`sempreDerivado` faz as operações devolverem esse erro antes).

| Verbo | O que faz | Origem |
|---|---|---|
| `aplicarDano`, `aplicarCura`, `gastarPe`, `recuperarPe` | `emVital`: dano passa por RD, Guarda e Vida, cura capa no máximo limitado pela Alma, PE temporário drenado primeiro | `CombatantPanel.jsx` 1571-1649 |
| `alma` | `emAlma`: dano na Alma desce a Vida sem passar pela Guarda e o teto da Alma só vale quando ela reduz o máximo | 1650-1671 |
| `condicao` | adicionar (por nome ou objeto, sem duplicar, contando as da Alma), remover, definir | 332-398 e 1676-1683 |
| `descansar` | o Reset de Combate (autor, 2026-11-17, "Igual ao Reset") | 1821-1827 |
| `iniciaCombate` | Guarda, `lastDamage: 0`, PE temporário por fonte e `round_start` (os modificadores não descem desde a etapa 5) | `useEncounter.js` 116-140 |
| `iniciaTurno` | `turn_start` (o tick das condições saiu na etapa 5) | 142-150 e 212-228 |
| `encerraTurno` | `turn_end` | 178-181 |
| `viraRodada` | `round_end`, depois o começo da rodada. Forçada (Nova Rodada): só a Guarda | 183-210 e 241-251 |
| `desceDuracoesDe` | condições e modificadores do aplicador que `op.vale` aceita, com a frase da 2.5.2 no Registro (etapa 5) | regra nova |
| `resumo`, `limite` | o excedente da barra é o PV e o PE temporário | 1958-1971 |

Extras que não são verbos da interface, exportados por `m252-vital.js` e usados como operação `sessao` (`passo`):
`ativarRegra` (liga, desliga e usa; devolve `{ estado, feedback }`), `emIgnorarRdAtivo`, `emIgnorarRdValor`,
`emResistenciaParcial`, `emResistenciaTotal` (com os botões do `Counter`: `contadorGastar`, `contadorRecuperar`),
`emSuscetivel`, `emVital(..., "guarda", v)`, `novaCondicao`, `novoModificadorManual`, `desafiandoAMorte` e
`abatidoAutomatico`.

⚠ **O PV temporário é o excedente da Vida acima do máximo**, e o PE temporário é o excedente do PE mais o mapa
`peTempSources`. Por isso `aparar` e `normalizarEstado` são identidade: aparar a Vida no máximo apagaria o PV temporário.

⚠ **O terceiro argumento dos verbos de turno** (`opcoesDe` no redutor): `{ abatido, nome, avisar, forcada, comecoDoCombate }`. O
Afty o ignora. O abatido não recebe nada (Guarda, modificadores, gatilhos e PE temporário ficam como estão). `avisar(tipo,
mensagem)` leva ao Registro do Encontro as frases que o `useEncounter.js` escrevia ("Nome: +4 PE (início da rodada)", os gatilhos
e "A condição [X] de Y chegou ao fim e foi removida", que alimenta o aviso de condição).

⚠ **A descida das durações está isolada numa função só**, `descerDuracoes252(estado, { vale, nome })`. Desde a etapa 5 ela segue a
regra nova (ver "A duração por quem aplicou"): condições e modificadores descem juntos, só os do aplicador que `vale` aceita, e a
virada, o começo do combate e o começo do turno não mexem em duração. Um passo dela, com tudo aceito, vale o mesmo que
`tickCombatantConditions` mais `tickModifiersRound`, e `renovarGuarda` sozinha é o `applyNewRoundEffects` sem tick. O assert confere
os dois. É divergência de propósito da 2.5.2 (autor: "nas rotas todas"). O `CombatTracker` da ficha única no `/` não muda.

Dados próprios do adaptador, fora da interface: `registroNoFim` (o `combatLog` cresce pelo fim, com `slice(-50)`), `sempreDerivado`,
`abateAutomatico` (o contador de erros chegou a 3: o redutor liga o Abatido, só o liga, só no alvo da operação) e
`soltosNoDesfazer` (`lastDamage`, que só alimenta as reações). `relativos` ganhou `guardaInabavalCurrent`, e `limite` recebe o valor de ANTES
da operação como quarto argumento: nunca fica abaixo dele, porque o que passa do máximo é PV e PE temporário que o Desfazer pode devolver.

Dois desvios de texto, pedidos pelo autor em 2026-11-17: o travessão das frases do Registro virou dois-pontos
(`semTravessao`), e Descansar é o Reset.

## A duração por quem aplicou (etapa 5, 2026-11-17)

⚠ **Regra nova do autor, que revoga "a duração desce para todos na virada da rodada".** No Encontro, só as DURAÇÕES em rodadas
descem, e no FIM DO TURNO DE QUEM APLICOU. O que é POR RODADA segue na virada. Vale para o Afty e para a criatura da 2.5.2.
O assert é `asserts/t-duracao-turno.mjs`.

| Duração (desce no fim do turno do aplicador) | Por rodada (segue na virada) |
|---|---|
| `buffs[].rodadas` e `beneficios[].rodadas` (prazo por benefício) | Guarda, cascas de PV e PE temporário |
| `condicoes[].rodadas` | contadores `rodada:` e `estado:X:rodada`, estados `expiraNaRodada` |
| `uso.ativos` com `duracao.tipo: "rodadas"` (Postura, Concentrar Aura, ações de 1 rodada) | Expansão (`dominioRodadas`), recargas da Técnica Máxima |
| `exaustaoTecnica` | invocações (Corpo, Autonomia), Dharma, Bloodfeast, Gungnir |
| Invencível sob o Sol e Talismã do Ápice, com a cobrança que acompanha | manutenção devida, pendências "até a rodada virar", adaptações, armas transformáveis, Preparo, Frenesi, Surto |
| 2.5.2: `activeConditions[].duracao` e `activeModifiers[]` com `duration.kind: "rounds"` | 2.5.2: Guarda, PE temporário, gatilhos de rodada |

As classificações que não eram óbvias foram perguntadas ao autor (2026-11-17): Exaustão de Técnica, Invencível e Talismã são duração
("Duração" nas duas perguntas), e os usos próprios em rodadas também.

**Quem aplicou** mora na entrada, em `aplicadorId` (o id do combatente). Entrada sem o campo, que é toda entrada gravada antes,
lê como `"proprio"`: quem carrega. ⚠ Não é o `aplicadoPor` dos recebidos (Pacotes para Aliados, Registrar Recebido), que é o NOME
mostrado ("De Yuki") e continua como estava (autor: "Campo Novo aplicadorId").

**Quem carimba** é a operação (`comAplicador` em `operacoes.js`), o único caminho por onde um combatente põe algo em outro: as
entradas com rodadas que NASCERAM no alvo ganham `aplicadorId` quando quem aplicou não é o próprio alvo. Quem aplicou é
`entrada.aplicadorId` (a tela escolhe), senão o `autor.combatente`, senão o próprio alvo (o Mestre sem combatente, autor: "Do Alvo,
Salvo Escolha"). O `operarComAlvo` e o `operarComGrupo` passam a origem. A concessão não tem rodadas (`normalizaConcedido` não guarda
duração), e o Auxiliar é derivado na ficha de quem conjura, então nenhum dos dois tem o que carimbar hoje. O Pacote para Aliados é
ativado pelo receptor e conta como dele até a Fase 2 (autor: "Do Receptor, até a Fase 2").

**A marca do turno** (`aguardaFimDoTurno`): a entrada que entra DURANTE o turno de quem aplicou só começa a descer no turno seguinte
dele (autor: "Não, Começa no Próximo"). O fim daquele mesmo turno só tira a marca. Assim 1 Rodada aplicada no meu turno dura até o
fim do meu próximo turno, e todos jogam uma vez com ela. Nas três chaves da própria ficha (Exaustão de Técnica, Invencível, Talismã)
a marca mora em `sessao.aguardaFimDoTurno`, uma lista. Os próprios verbos de turno também marcam o que criam (`verboDoTurno` no
redutor): a condição que um gatilho `turn_start` ou `turn_end` da 2.5.2 põe na criatura não some no mesmo fim de turno.

⚠ **A marca não trava o Desfazer** (autor, 2026-11-17, "Ignorar a Marca"). `buffs` e `condicoes` são comparados como lista inteira, e o
fim do turno de quem aplicou tira a marca delas. Por isso a conferência (`confereCaminho` em `operacoes.js`, no Desfazer e na pré-condição
de toda operação) ignora `aguardaFimDoTurno`, e o valor que o Desfazer devolve herda o estado de agora da marca (`semMarcasConsumidas`):
desfazer a segunda de duas aplicações do mesmo turno não devolve a primeira com a marca. Só a marca é ignorada: a rodada que desce ainda
fecha o Desfazer, como fechava na virada.

**O fluxo no redutor novo** (`PROXIMO_TURNO`): encerra o turno de quem jogou, desce em TODOS os combatentes as entradas daquele
aplicador (na ficha dele mesmo também as próprias e as de quem não está na luta), desce a de cada posição pulada (Abatido, Fora da
Ordem) no lugar dela na ordem (as do fim antes da virada, as do começo depois), vira a rodada com `descerDuracoes: false` e começa o
próximo turno. `REMOVER` repassa as entradas de quem saiu para quem carrega (`repassarAplicador`). O `NOVA_RODADA` forçado encerra
os turnos que faltam: desce a de quem está na vez e a de todos que ainda iam jogar, e só então vira (autor: "Encerra os Turnos que
Faltam"). A criatura da 2.5.2 Abatida não recebe nada, como em toda a 2.5.2.

**Três verbos novos na interface**: `desceDuracoesDe`, `marcarAplicador` e `repassarAplicador`, nos dois motores. Na sessão do
Afty: `desceDuracoesDe(sessao, quem, { derived })`, `marcaAplicador(antes, depois, { aplicadorId, noTurno })` e
`repassaAplicador(sessao, deId)`, em `ficha-sessao.js`. Sem nada a mexer, os três devolvem o MESMO objeto, porque o Encontro os
chama em todo combatente a cada fim de turno.

**Na Ficha sozinha nada muda.** O botão de virar a rodada se chama Encerrar Meu Turno na G2 e na clássica, e chama a mesma
`proximaRodada`, que desce tudo, de todos os aplicadores, nos mesmos pontos de sempre (`descerDuracoes` ligado por padrão). A única
diferença é que a marca do turno some nessa descida. Conferido byte a byte contra a saída de antes, em dez sessões ricas.

⚠ **O redutor antigo (`usar-encontro-afty.js`) continua com a regra antiga**, mas ninguém o monta desde a 6a: as três listas rodam o redutor novo, com a regra de acima.

## O Encontro na Sala (etapa 7b, 2026-11-18)

O cliente da Sala mora em `src/nuvem/sala-*.js` (guia em `docs/nuvem-supabase.md`, "O cliente da Sala"). Para o Encontro, mudou:

- **`useEncontro` aceita `fonte` e `aoExecutar`.** O personagem de um jogador entra no Encontro do Mestre ligado à Sala
  (`fichaRef: { chave: "sala", id: <id do combatente na Sala> }`). A sessão e a ficha dele vêm da `fonte` (`tem`, `ler`, `ouvir`,
  `atualizar`, `fichas`), e a ação que muda a sessão dele volta para a fonte, NUNCA para a loja (que gravaria em `fm_ficha_sessao_afty_v1` e
  iria para a nuvem pessoal do Mestre). `aoExecutar(saida, antes)` recebe cada ação que mudou o mundo, e é por ela que as operações e os
  eventos (começar, turno, rodada, encerrar) vão para o registro da Sala. O `EncontroTela` repassa as duas pela prop `sala`, que também
  traz `aoEstado` (o estado do gancho a cada render, para a ligação publicar o que mudou).
- **`reaplicarSobre` é relativo nos números.** Nos caminhos que o motor declara em `relativos` (Vida, PE, Alma, as cascas por fonte), a
  diferença de um lado entra como SOMA sobre o valor de agora. Antes, a mesma mudança feita dos dois lados ficava com o valor final de um
  deles (o Mestre tirava 5, o jogador tirava 1, e sobrava -1). Vale também para duas abas no mesmo aparelho. O quarto argumento é o motor.
- **`acaoEmGrupo` devolve `operacoes` e `pedidos`** além dos `resultados`: a Sala grava cada uma.
- **`sessaoFinal`** no personagem ligado: a sessão de quando a Sala fechou, só para consulta no Encontro Finalizado do JOGADOR (o
  saneamento a guarda). O Finalizado do Mestre guarda só o Registro (autor, 2026-11-18, "Só o Registro").
- **`lista.importar(encontro)`** põe (ou troca, pelo id) um Encontro pronto no topo da lista: o Finalizado de uma Sala.
- **A linha da Ordem** mostrava o aviso de erro dentro de um `<p>` (um `<div>` dentro de `<p>`, aviso do React quando o personagem da Sala
  ainda não tem sessão). Virou `<div>`.

## As telas da Sala (etapa 7c, 2026-11-18)

As telas moram em `src/nuvem/sala-ui/` (CSS `sala-ui.css`, prefixo `sl-`) e a rota `/Sala/<código>` (`SalaPagina.jsx`) só decide qual mostrar. A lógica
que não é de tela é pura e tem assert: `sala-telas.js` e `sala-frases.js` (FOLHAS), `sala-jogador.js` (as escritas do jogador, com o motor).

| Quem e quando | Tela |
|---|---|
| Mestre, no Encontro | botão **Abrir Sala** no cabeçalho do Planejamento e da Luta (`BotaoAbrirSala`, por `lazy` no `App.jsx`, só com a Sala liberada e a nuvem ligada): senha, depois código e link com Copiar. Com a Sala aberta o botão vira **Sala <código>** e abre os **Controles** (Remover, Promover a Mestre, Trocar a Senha, Trancar, Fechar a Sala, cada um com confirmação quando não tem volta) |
| Mestre, na luta | a aba **Sala** do Registro (Registro da Sala, chat e Rolagem Escondida), o aviso de escrita que desistiu com Tentar de Novo, e **Aceitar pelo Jogador** nos pedidos do personagem de um jogador |
| Quem chega | Login (Google ou Discord), senha com papel (Jogador ou Espectador), e para o jogador a escolha das fichas (uma ou várias, com a iniciativa) |
| Jogador | a Ficha G2 dele (`naSala`: sem o Encerrar Meu Turno e com o Em Combate só como indicador) com a **faixa da luta** em cima e o **painel da Sala** ao lado (gaveta no celular): Colegas, Criaturas, Pedidos, Histórico com Desfazer e Registro com o chat |
| Espectador | o jogador sem ficha: a faixa, a ordem da luta (**Na Luta**) e o painel sem Pedidos nem Histórico |
| Sala fechada | o Encontro Finalizado com o Registro da Sala (chat e rolagem escondida incluídos para o Mestre), o mesmo no Mestre e em cada membro |

**O jogador não tem número de iniciativa.** O banco só dá a posição (`posicao`), e a faixa mostra isso. A Vida das criaturas em Barra de Vida vem em cinco
faixas, sem número.

**Os avisos do jogador ao Mestre** viajam como linha de **rolagem** (autor, 2026-11-18, "Linha de Rolagem"), sem SQL novo: a iniciativa
(`dados.iniciativa`) e o Encerrar Meu Turno (`dados.fimDeTurno`, com a rodada). O aparelho do Mestre age uma vez por linha (`sinaisDoJogador`): o combatente é do
autor, a iniciativa vale enquanto o Encontro planeja ou o combatente ainda não tem iniciativa, o Encerrar Meu Turno só de quem está na vez e na mesma rodada. O que
já foi tratado fica em `encontro.sala.sinais` (os últimos 200), e o sinal de um personagem que ainda não chegou ao Encontro espera.

**O Registro** junta as linhas completas que a conta lê e as públicas que não têm completa (`linhasDoRegistro`). Rolagem nova na Ficha do jogador (e do Mestre numa
criatura) vira linha (autor, "Só as Rolagens"): o espelho publica o que o `log` ganhou desde a última base, e a primeira subida da sessão não republica as antigas. A
rolagem escondida é só do Mestre e não toca sessão nenhuma.

**Pedir, aceitar, Desfazer.** O pedido do jogador leva a intenção sem delta. Quem aceita é o dono do alvo, no aparelho dele: o motor mede contra a sessão de agora, o
banco responde primeiro (`responder_pedido`) e só com o aceite a operação entra na sessão (o Mestre pode ter aceitado na mesma hora). O Desfazer da Ficha segue a regra
relativa nos números da etapa 3 e grava a operação `desfazer` no Registro. A Ficha de colega abre só leitura, pela G2 embutida com uma função que não grava.

## Desvios do plano, e por quê

- O `antes` e o `depois` moram em cada mudança do delta, e não na operação inteira: uma mudança sem
  o valor de antes não se desfaz nem confere pré-condição.
- O adaptador tem oito verbos além dos dez do plano (lista acima).
- O personagem não tem `visao` (é `null`), e a do marcador depende do lado.
- O Mestre também desfaz, não só o dono.
- Pedido com vários alvos ficou de fora, mesmo depois da 7b (`docs/a-fazer.md`).
- O Encontro do Afty de antes vai para o site só se tem pelo menos um personagem.
- Etapas seguintes: sem Dano Rápido por linha (6a), `aplicadorId` e não `aplicadoPor` (5), o jogador sem número de iniciativa e o co-Mestre sem tela
  de luta (7c), a Ficha de colega só leitura pela G2 embutida (7c). Os motivos estão nas seções de cada etapa e em `PROGRESSO-ENCONTRO-UNIFICADO-SALA.md`.

## Asserts

Todos em `asserts/` e rodados por `npm run asserts`. Os da Sala estão descritos em `docs/nuvem-supabase.md`.

- `asserts/t-sessao-loja.mjs`: a loja viva da sessão (duas abas, fila de edição, versão pelo texto, gravação sem pisar).
- `asserts/t-duracao-turno.mjs`: a duração por quem aplicou (Ficha sozinha igual a antes, fim do turno do aplicador, pulado, removido, Desfazer).
- `asserts/t-encontro-atualizar-ficha.mjs`: o Atualizar da Ficha da 2.5.2 e da cópia do Afty.
- `asserts/t-sala-projecao.mjs`, `t-sala-cliente.mjs`, `t-sala-telas.mjs`, `t-sala-jogador.mjs`: os cortes por visão (com o SQL), o cliente, a lógica das telas
  e as escritas do jogador.

- `asserts/t-encontro-unificado.mjs`: interface e motores, modelo, redutor novo contra o antigo na
  mesma luta, operações, pedidos, Desfazer relativo, ações em grupo (os seis verbos em valores literais),
  histórico, listas e inventários, carga em processo limpo e texto dos arquivos.
- `asserts/t-encontro-252-porte.mjs`: o porte da conta da 2.5.2: casos de ouro escritos a mão (RD, Guarda Inabalável, PV e PE
  temporário por fonte, Alma, Ignorar RD, Resistência, Suscetível, Desafiando a Morte, contador de erros, ativar regra, gatilhos),
  equivalência contra as funções puras da 2.5.2, Desfazer com PV temporário, e uma luta mista inteira pelo redutor.
- `asserts/t-encontro-migracao.mjs`: conversão da 2.5.2 e do Afty de antes, duas rodadas sem
  duplicar, edição que sobrevive, apagado que não volta, cota, lista ilegível, leitura na memória
  sem gravar, dois aparelhos e a nuvem.
