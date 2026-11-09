# Confronto de Domínios, barreiras e Cesta Oca de Vime (CL3)

Guia do contrato entregue em 2026-11-01. Livro de Regras 2.5.2, p.185 a 189 (SHA-256
`1d0713d52c818a9ab9f47b883d9887a0d227d174d30ffcce358874669a7a733a`). Evidência em
`docs/revisao-livro-regras/entregas/CL3.md`. Complementa `docs/afty-tecnica-maxima-dominio.md`, que continua mandando nos
números (bônus de Conflito, DOM, domo, dano da Contestação) e nas fases da Expansão. Vale para criatura e personagem sem
divergência: é mecânica de sessão.

## 1. Onde mora

| Arquivo (`src/systems/afty/ficha/`) | Papel |
|---|---|
| `ficha-dominio-confronto.js` | Quem vence o Confronto, o vínculo entre dois participantes, Contestação |
| `ficha-barreiras-estado.js` | **Folha.** `sessao.barreiras = { paredes, cortinas }`, normalização e descanso. A sessão a importa |
| `ficha-barreiras.js` | Erguer paredes e Cortinas, dano e destruição, Cesta Oca de Vime, pelo contrato de uso do CL1 |

Editados em trechos pequenos: `ficha-sessao.js` (o campo `barreiras`, o descanso e as chaves `dominioConfronto` e
`dominioContestando` que `encerraExpansao` limpa), `ficha-uso-estado.js` (a chave `uso.acoes.semComum`), `ficha-concentracao.js`
(a Durabilidade) e `ficha-uso.js` (o `alvo` do Buff de Mesa).

## 2. O Confronto entre dois participantes

**DA-19 (autor, 2026-10-08): o Confronto entre fichas é manual assistido.** Nada roda sozinho. A mesa (ou a tela do
Encontro) chama, confirma os fatos que a ficha não enxerga e aplica o resultado nas **duas** sessões.

### Os dados de um participante

`participanteDeDominio({ id, nome, sessao, derived })` lê o `derived.dominios` e a Expansão da sessão e devolve
`{ id, nome, dom, bonus, partes, versao, expansaoId, aberta, fase, temDomo, pvDomo, pvDomoMax, contestacao }`. O `bonus` sai
**sem** o +2 da Expansão ativa que o derive embute: o +2 depende de quem já estava ativo e é aplicado uma vez só.

### Resolver (puro): `resolveConfronto({ desafiante, defensor, modo, d10, presoNaBarreira })`

| Modo | Quando | +2 de Expansão ativa |
|---|---|---|
| `reacao` | O defensor está ATIVANDO a Expansão e o desafiante reage (Reação, p.185) | ninguém |
| `contraAtiva` | O defensor JÁ tem a Expansão ativa e o desafiante expande dentro dela (p.186) | defensor |

| Situação | Resultado |
|---|---|
| Mesmo DOM | Teste `1d10 + bônus` de cada lado. Superar por 5 ou mais vence, senão Confronto Estendido. Sem sucesso nem falha crítica |
| DOM diferente | O maior vence na hora (`via: "nivel"`) |
| `reacao`, DOM menor por 1 e bônus maior por 5 ou mais | O desafiante confronta com um teste |
| `contraAtiva`, DOM menor | `contestacao` (p.186, item 2) |
| Incompleta do desafiante | `contestacao` no modo `contraAtiva`, `impossivel` no `reacao` |
| Incompleta do defensor | Perde imediatamente (`via: "incompleta"`) |
| Completa contra Sem Barreiras | `impossivel`, a menos que `presoNaBarreira` (fato da mesa) |

Devolve `{ ok, resultado, vencedor, perdedor, via, passos, avisos, desafiante, defensor, totais?, necessitaRolagem?, bonus? }`.
Sem o `d10` e com teste necessário, o resultado é `pendente-rolagem` com os `bonus` prontos (a DA-19). `rolaConfronto(rng)` rola os dois d10.

### Operações (as duas sessões entram e saem)

Todas recebem `desafiante` e `defensor` como `{ id, nome, sessao, derived }`. O `opId` entra no anel de operações da
sessão de **cada lado**, e repetir a chamada só aplica o lado que ainda não aplicou (cura uma gravação pela metade).
Recusa devolve as duas sessões como entraram.

| Operação | O que faz |
|---|---|
| `iniciaConfronto({ modo, desafiante, defensor, opId })` | O desafiante expande (PE pelo `abreExpansao`), gasta a Reação (modo `reacao`, e perde a Ação Comum do próximo turno, p.185) ou a Ação Comum (modo `contraAtiva`). As duas passam à fase `confronto` e ganham o vínculo `combate.dominioConfronto` |
| `aplicaResultadoDoConfronto({ desafiante, defensor, resultado, opId })` | `"desafiante"` ou `"defensor"`: o vencedor completa a Expansão (fase `ativa`, o Acerto Garantido e os efeitos valem) e o perdedor a tem cancelada, com a Exaustão de Técnica da versão (`encerraExpansao(..., "perdeu")`). `"estendido"`: as duas viram `estendido` |
| `danoDoUsuarioNoDominio(sessao, dano, { opId })` | "Todo dano que você causar ao usuário também é direcionado ao domínio, considerando como causado pelo interior." Chega **a metade** ao domo (resistência do interior, leitura adotada). Só dentro do Confronto |
| `derrubaDominioDoInconsciente({ sessao, derived }, { opId })` | "Caso você deixe o usuário oponente inconsciente, o domínio dele é derrubado imediatamente" |
| `reconciliaConfronto({ a, b })` | Depois de qualquer mudança (domo a zero, duração, inconsciente), se um lado já não tem Expansão, o sobrevivente completa a dele (fase `ativa`). Idempotente |

Leituras adotadas onde o texto cala (também na fila): Expansão já ativa contra DOM **maior** do desafiante vale a regra geral
(o maior vence), e o dano que chega ao domo vale a metade.

## 3. A Contestação

`podeContestar(contestador, alvo)` confere p.186: Incompleta contra domínio ativo, ou Completa contra domínio ativo de DOM
maior. O alvo precisa de barreira (a Sem Barreiras não tem o que ferir).

| Operação | O que faz |
|---|---|
| `iniciaContestacao({ contestador, alvo, maosLivres, opId })` | O contestador expande (Ação Comum), entra em Concentração (`contestacao:<id>`) e na fase `contestando`. `maosLivres` é a confirmação da mesa (p.186: as duas mãos, ou uma, caso possa). O alvo registra quem o contesta |
| `avancaContestacao({ contestador, alvo, opId, rodada })` | No começo da rodada o contestador causa na barreira o dano da Contestação (DOM x 25 na Incompleta, x 50 na Completa). Uma vez por rodada. Devolve `passagem`: `fechada`, `uma-pessoa` (vida a 75% ou menos) ou `qualquer` (50% ou menos) |
| `encerraContestacao({ contestador, alvo, opId })` | Fecha a Expansão do contestador com a Exaustão de Técnica "como normal", solta a Concentração e limpa o registro dos dois |
| `contestacaoPerdeuAConcentracao(sessao)` | Puro: a Concentração do contestador caiu e a Contestação deve acabar |
| `acertoGarantidoSuprimidoPor(sessaoAlvo)` | Quem desliga o Acerto Garantido do alvo "dentro da área" (a área é da mesa) |

## 4. Paredes e Cortinas

O derive já entrega `derived.dominios.barreira` (`tem`, `temCortina`, `pvParede`, `rdParede`, `maxParedes`, `pvCortina`).

| Operação | O que faz |
|---|---|
| `erguerParedes(sessao, derived, { quantidade, opId, registraAcao, cobranca })` | 1 PE por parede, de 1 até o máximo de uma vez (p.188). Ação Comum, ou Bônus com Barreira Rápida. Cada parede nasce com o PV e a RD do derive |
| `manipularBarreiras(...)` | A ação de mover, sem custo |
| `criarCortina(sessao, derived, { area, nome, condicoes, opId, ... })` | Vale três paredes de PV, RD zero. Custo `custoDaCortina(area)`. As `condicoes` são texto da mesa |
| `danoNaBarreira(sessao, id, dano, { opId })` | A RD abate (mínimo zero), o PV desce, a zero a barreira é destruída e sai |
| `removeBarreira(sessao, id, { opId })` | Retirada à mão |

Não há duração escrita no livro para parede nem para Cortina: ficam até serem destruídas, retiradas ou o descanso.

## 5. Cesta Oca de Vime (p.188)

Um **uso ativo com Concentração** do contrato do CL1 (`sessao.uso.ativos.cesta_oca_de_vime`), com a Durabilidade nos
parâmetros. `usarCesta(sessao, derived, { como, contraExpansao, opId, registraAcao })`: `como` é `bonus` ou `reacao` (e então a
mesa confirma `contraExpansao`). Custa 3 PE. Dura até o fim da cena, o que o fim do combate encerra.

| Regra do livro | Como está |
|---|---|
| Durabilidade igual ao Nível de BAR mais 1 | `durabilidadeDaCesta(derived)` |
| Falhar em teste de concentração tira 1 de Durabilidade | `resolveTesteDeConcentracao` (CL1) lê `parametros.durabilidade` do uso e desce 1 em vez de derrubar. Chegando a zero, quebra e devolve `quebrou: true` |
| No início do turno, se deveria ter sido atingido por Acerto Garantido, perde 1 | `iniciaTurnoDaCesta(sessao, { acertoGarantido, mantemSelo, opId })`. O fato "seria atingido" é da mesa |
| Manter o selo ocupa as duas mãos e protege de tudo, menos da concentração | `mantemSelo: true` grava `selo`. `maosOcupadasPelaCesta(sessao)` devolve 0 ou 2 |
| Quebrando, o portador recebe o Acerto Garantido na hora | Devolve `recebeAcertoGarantido: true`. **A ficha não aplica esse efeito**, é da mesa |
| Enquanto ativa, o Acerto Garantido não o afeta | `cestaProtegeDoAcertoGarantido(sessao)` |

## 6. Pontos de ligação (Codex, CX6)

Nenhuma tela chama os verbos novos ainda. Mapa:

1. O `ControleExpansao.jsx` ganha o botão de Confronto: montar os dois participantes do Encontro com
   `participanteDeDominio`, mostrar `resolveConfronto` (bônus, +2 e fontes prontos), rolar com `rolaConfronto`, e aplicar com
   `aplicaResultadoDoConfronto`. Depois de qualquer dano ao usuário ou ao domo, chamar `reconciliaConfronto`.
2. A virada de rodada no Encontro chama `avancaContestacao` para cada par contestador e alvo.
3. A `AbaAcoes` (card das barreiras, `derived.dominios.barreira`) ganha Erguer, Cortina e a lista de `sessao.barreiras` com o
   dano. O card da Cesta lê `estadoDaCesta`.
4. O início do turno de quem tem a Cesta chama `iniciaTurnoDaCesta` (perguntando a mesa se o Acerto Garantido o atingiria).
5. Rotular `custo.pe.naoDescontado` como "PE Não Descontado", como no CL1.

## 7. Perguntas ao autor (sem bloquear nada)

1. Cortina: "1 ponto de energia para cada 9 metros que a área dela irá cobrir". Adotado: cada bloco de 9 m, ainda que
   incompleto, custa 1 (mínimo 1). O texto não diz a ação de criar nem dá RD à Cortina (adotado: nenhuma ação registrada, RD zero).
2. Contra Expansão já ativa, o desafiante com DOM **maior**: o texto da p.186 manda Contestação, que só existe para DOM menor.
   Adotado: o maior vence pela regra geral da p.185.
3. O dano do usuário que "também é direcionado ao domínio" vale a metade, pela resistência do interior?
4. Contestar um alvo sem barreira (Sem Barreiras): adotado como não contestável.
5. Condição que impede concentração derruba a Cesta? A lista (`CONDICOES_QUE_IMPEDEM_CONCENTRACAO`) nasce vazia no CL1.

## 8. Testes

`asserts/t-cl3-dominios.mjs` (152 asserts), mais `t-dominio-*`, `t-cesta-oca`, `t-retracao-de-dominio` e `t-cl1-*` de antes, sem alteração.
