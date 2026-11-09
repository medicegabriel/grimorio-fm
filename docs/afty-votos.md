# Votos de Restrição (CL3)

Guia do contrato dos Votos entregue em 2026-11-01. Livro de Regras 2.5.2, p.350 a 358 (SHA-256
`1d0713d52c818a9ab9f47b883d9887a0d227d174d30ffcce358874669a7a733a`). Evidência da entrega em
`docs/revisao-livro-regras/entregas/CL3.md`. Vale para criatura e personagem sem divergência: o Voto mora na ficha
(`creature.votos`) e a regra é a mesma nos dois sistemas.

CX3, 2026-11-06: Voto Malevolente (p.168) dispensa somente o malefício
um peso acima no Emergencial. `validaVoto`/`avaliaRealizacao` leem
`ctx.talentos`, ids acessíveis do participante. `realizaVoto`, quando recebe
`derived`, usa a lista final de Talentos da ficha e ignora uma lista alegada
pelo chamador. Demais regras, reação, limite por BT e histórico permanecem.
A interface do ciclo de vida continua sendo a integração atribuída a CX6.

## 1. Onde mora

| Arquivo | Papel |
|---|---|
| `src/systems/afty/afty-votos.js` | O modelo de antes (Contratuais e Mecânicos), a normalização na leitura, os Votos automáticos de Addon e a emissão para o Motor (`efeitosDeVotos`, `regrasAftyDeVotosAtivos`) |
| `src/systems/afty/ficha/ficha-votos-regras.js` | **Folha** (zero imports). Vocabulário, pesos, legalidade (`validaVoto`), as contas da Restrição Congênita e a leitura dos campos novos |
| `src/systems/afty/ficha/ficha-votos.js` | As operações: criar, realizar, quebrar, desfazer, prazo, fim do combate, interlúdio, Contrato |

## 2. O que fica salvo

Tudo continua em `creature.votos = { contratuais: [], mecanicos: [] }`, no export e no rascunho. O estado do Voto é
**da ficha, e não da sessão**: sobrevive ao descanso e viaja com a ficha.

Os campos novos de um Mecânico só existem quando o Voto é **tipado** (tem `tipo`). Um Mecânico sem `tipo` é o Voto
livre de antes (escrito à mão, `pacto` legado, `votoAutomatico` ou `pactoPadrao` de Addon): volta byte a byte, não passa
por regra nenhuma daqui e emite os dois lados como sempre emitiu.

| Campo | Valores |
|---|---|
| `tipo` | `proprio`, `emergencial` ou `congenita` |
| `permanencia` | `temporario` ou `permanente` (a Congênita é permanente) |
| `beneficio` e `maleficio` | além de `texto` e `efeitos`: `peso` (`leve`, `medio`, `pesado`, `extremo`) e `envolve` (lista de `aptidao`, `feitico`, `pe`, `conhecimento`, `simples`, `atributo`, `defesa`, `rd`, `resistencia`, `pericia`, `movimento`, `atencao`, `iniciativa`, `pv`) |
| `beneficioDuracao` | `permanente` ou `temporario`. Só importa no permanente (o "Braço por Poder" tem benefício temporário) |
| `duracao` | `{ ate: "cena" }` ou `{ rodadas: N }`, só no temporário |
| `antecipaAptidao` | `true` quando o Voto concede uma Aptidão antes do nível (sempre permanente, p.353) |
| `aptidoes`, `feiticos` | ids envolvidos. A Aptidão precisa estar na ficha (p.355) |
| `estado` | `proposto`, `vigente`, `quebrado`, `desfeito`, `encerrado` |
| `maleficioAte` | `fimDoCombate` ou `interludio`, só no `quebrado` |
| `rodadasRestantes`, `rodadaContada` | o prazo em rodadas e a última rodada contada (conta uma vez por rodada) |
| `congenita` | `{ atributos: [{ atributo, limite }], destinos: { atributo: pontos }, trocas: [{ perde, ganha }], resistencias: [{ tipo, familia, vulnerabilidade }], pvPorNivel, feiticos: { total, cortados } }` |
| `historico` | `[{ evento, opId?, rodada?, nota? }]`, os últimos 50 |

O Contratual continua em `contratuais` com `{ id, texto }` e ganha, quando é tipado: `permanencia`, `participantes`
(`[{ nome, aceitou, capaz }]`), `estado`, `ruptura` (`{ quem, consequencia, rodada }`) e `historico`.

## 3. O que a ficha valida (e o que ela deixa para a mesa)

O **peso é declarado**. O livro entrega exemplos e diz que o Narrador decide o que é cada peso (p.352, 354, 355), então
a ficha não classifica um efeito como Leve ou Pesado: ela confere que a **combinação declarada** respeita o texto.
`validaVoto(voto, ctx)` devolve `{ ok, legado, excecao, erros: [{ codigo, motivo }] }`. `ctx`: `{ aptidoes, bt, vigentes, criacao, metodoAtributos }`.

| Código | Regra | Página |
|---|---|---|
| `temporario-extremo-*` | Voto Temporário não passa de Pesado | 355 |
| `permanente-leve-*` | Voto Permanente não fica abaixo de Médio | 355 |
| `beneficio-permanente-malefico-temporario` | O tipo segue o malefício. Benefício Permanente com Malefício Temporário é impossível | 355 |
| `antecipa-so-permanente` | Antecipar uma Aptidão só vale no permanente | 353 |
| `leve-sem-aptidao-*` | Peso Leve não envolve Aptidões | 352 |
| `escopo-beneficio`, `escopo-maleficio` | O Próprio envolve só Aptidões, Feitiços e PE. O malefício pode ainda ser conhecimento ou efeito simples, nunca o benefício | 351 |
| `aptidao-nao-possuida` | Só se faz Voto sobre Aptidão que a ficha tem | 355 |
| `emergencial-um-peso-acima` | No Emergencial o malefício pesa um nível a mais que o benefício | 356 |
| `limite-bt` | A quantidade de Votos Mecânicos vigentes é igual ao BT | 350 |
| `congenita-so-na-criacao` | Restrição Congênita só se faz na criação | 357 |
| `congenita-pe` | Pontos de Energia não podem ser afetados | 357 |
| `congenita-dominio` | Só os domínios da lista da p.357 | 357 |
| `congenita-defesa-rd` | Defesa e Redução de Dano não se trocam | 358 |
| `congenita-resistencia-vulnerabilidade` | Resistência obriga vulnerabilidade da mesma família (elemental ou físico) | 357 |
| `congenita-limite`, `congenita-pontos` | Limite do atributo entre 2 e 8. Cada atributo limitado rende `8 menos o limite` pontos, e os pontos recebidos não passam do rendido. Cada PV por nível reduzido rende 2 pontos, e cada PV por nível aumentado custa 4 | 357, 358 |
| `congenita-valores-fixos` | Mexer em atributos obriga o método de Valores Fixos | 358 |
| `congenita-feiticos-metade` | Cortar Feitiços para receber benefício exige cortar pelo menos a metade | 358 |

⚠ **O `congenita` NÃO CHEGA AO DERIVE.** Os limites de atributo, os pontos recebidos, o PV por nível e as trocas são VALIDADOS e o
balanço é calculado, mas só os efeitos escritos em cada lado do Voto (`beneficio.efeitos`, `maleficio.efeitos`) entram no Motor. A Restrição
não limita o atributo sozinha: quem faz o corte continua escrevendo o efeito no malefício. Ligar o `congenita` ao atributo e ao PV por nível é
trabalho do derive, que este lote não tocou.

Ficam com a mesa, sem número inventado: o que é cada peso, a justiça das trocas da Congênita, o custo de desfazer um
Voto Temporário, a consequência de quebrar um Contrato e se uma troca "faz sentido com a narrativa".

`balancoDaCongenita(congenita)` devolve `{ ganhos, gastos, saldo }` para a tela mostrar.

## 4. Operações (`ficha/ficha-votos.js`)

Todas recebem o objeto `votos` (de preferência `votosDaFicha(creature)`, que já traz os Votos automáticos de Addon) e
devolvem `{ votos, aplicado, ... }`. Quem chama grava `creature.votos = resultado.votos`. **Recusa devolve o MESMO objeto
`votos`**, com `erro`, `codigo` e a lista `recusas`. **`opId` é obrigatório** nas que escrevem (a mesma identidade do CL1):
ele fica no `historico` do Voto, e repetir o id devolve `{ aplicado: false, repetida: true }`.

| Operação | O que faz |
|---|---|
| `novoVotoTipado(campos)`, `novoContrato(campos)`, `adicionaVoto(votos, voto)` | Criam um Voto PROPOSTO (não emite efeito, não ocupa vaga do BT) e o põem na lista |
| `avaliaRealizacao(votos, id, ctx)` | Puro. `{ ok, erros, acao }`, onde `acao` é a ação que realizar gasta (Próprio `bonus`, Emergencial `reacao`, Contratual `comum`, Congênita `null`) |
| `realizaVoto(votos, id, { opId, rodada, ctx, sessao, derived, registraAcao })` | Valida, passa a `vigente` e, com `registraAcao`, `sessao` e `derived`, gasta a ação pelo `gastaAcao` do CL1 e devolve a `sessao` nova |
| `declaraCongenita(votos, id, { opId, ctx })` | Realiza a Restrição Congênita (exige `ctx.criacao`) |
| `quebraVoto(votos, id, { opId, rodada, emCombate, quem, consequencia })` | Próprio ou Emergencial Temporário: o malefício sai e o benefício não vem no combate, e depois do combate o malefício volta até o interlúdio. Com duração, o malefício vale direto até o interlúdio. Contratual: vira `quebrado` e guarda o TEXTO da mesa. Permanente e Congênita recusam |
| `desfazVoto(votos, id, { opId, rodada, custo })` | Temporário se desfaz com um custo, que é texto da mesa guardado no histórico. Permanente e Contrato recusam |
| `respondeContrato`, `retiraParticipante`, `cumpreContrato` | O aceite de cada participante (p.356), tirar quem recusou, encerrar um Contrato cumprido |
| `avancaVotosNaRodada(votos, { rodada })` | Desce o prazo em rodadas, uma vez por rodada. Zero encerra |
| `votosAoFimDoCombate(votos)` | `fimDoCombate` do quebrado passa a `interludio`, e "até o fim da cena" se encerra |
| `votosNoInterludio(votos)` | O interlúdio acaba com o malefício dos quebrados. **Acionado pela mesa**: o site não tem evento de interlúdio, e o botão de descanso não o é |
| `resumoDoVoto(votos, id, ctx)` | `{ estado, acao, pode, recusas, balanco, ruptura, maleficioAte, rodadasRestantes }` para a tela |

Textos de recusa em Title Case, sem travessão e sem ponto e vírgula. Códigos: `sem-opid`, `voto-inexistente`, `nao-proposto`,
`voto-livre`, `nao-vigente`, `ruptura-permanente-indefinida`, `permanente-nao-desfaz`, `congenita-nao-quebra`,
`contrato-nao-desfaz`, `contrato-participantes`, `contrato-nao-aceito`, `contrato-incapaz`, `contrato-sem-condicoes`,
`participante-inexistente`, `sem-sessao`, mais os da tabela da seção 3 e os de ação do `gastaAcao`.

## 5. Emissão no Motor

`efeitosDeVotos` e `regrasAftyDeVotosAtivos` leem o estado do Voto por `votoEmVigor(voto)`:

| Estado | Benefício | Malefício |
|---|---|---|
| sem tipo ou sem estado | emite | emite |
| `vigente` | emite | emite |
| `quebrado` com `maleficioAte: "interludio"` | não | emite |
| `quebrado` no combate, `proposto`, `desfeito`, `encerrado` | não | não |

`proposto`, `desfeito` e `encerrado` liberam a vaga do BT (`mecanicosQueOcupamVaga`). O derive não mudou: o filtro está
dentro de `efeitosDeVotos`, que ele já chama.

## 6. Pontos de ligação (Codex, CX6)

Nenhuma tela chama os verbos novos ainda. Mapa:

1. A aba Votos do criador (`AftyCreatureBuilder.jsx`, `Votos`) edita `creature.votos` direto. Para Voto tipado, usar
   `novoVotoTipado`, `avaliaRealizacao` (desabilitar o botão com `erros[0].motivo`) e `realizaVoto`.
2. A Ficha (jogo) chama `realizaVoto` com `registraAcao`, `quebraVoto` e `desfazVoto`, e grava `creature.votos`.
3. O fim do combate (`aplicaPatchCombate({ ativo: false })`) deve chamar `votosAoFimDoCombate`, e a virada de rodada
   `avancaVotosNaRodada(votos, { rodada })`. O interlúdio é um botão da mesa para `votosNoInterludio`.
4. Mostrar `resumoDoVoto(...).balanco` na Restrição Congênita e a `ruptura` do Contrato quebrado.

## 7. Perguntas ao autor (sem bloquear nada)

1. Contratuais sem limite: a p.350 diz que o personagem tem votos de restrição em número igual ao BT. A decisão de
   2026-09-20 deixou os Contratuais ilimitados. Adotado: ilimitados.
2. Romper um Voto Próprio Permanente não está escrito (a p.351 só diz que ele não se desfaz). A operação recusa.
3. O custo de desfazer um Voto Temporário ("com um custo", p.351) não tem número. Adotado: texto da mesa.
4. Quebrar um Voto com duração: "ao invés disso, você receberá os malefícios, não importando a duração" (p.351). Adotado:
   o malefício vale direto, durante o combate também, até o interlúdio.
5. Contrato quebrado: o efeito é "definido pelo Narrador" (p.356). Adotado: texto da mesa, sem aplicação.
6. O limite de BT conta os Mecânicos `vigentes` e `quebrados`. O `proposto`, o `desfeito` e o `encerrado` liberam a vaga.

## 8. Testes

`asserts/t-cl3-votos.mjs` (130 asserts) e o `asserts/t-votos.mjs` de antes (25), que passa sem alteração.
