# Vida, morte, Alma e Dados de Vida (CL2)

Guia do contrato entregue no CL2, em 2026-10-30. Fonte: Livro de Regras 2.5.2, SHA-256
`1d0713d52c818a9ab9f47b883d9887a0d227d174d30ffcce358874669a7a733a`, páginas impressas 20, 46, 228, 311 a 314 e 335.
Evidência da entrega: `revisao-livro-regras/entregas/CL2.md`. Contrato de uso e combate (CL1): `afty-motor-uso-combate.md`.

**Vale para o Player e para o Afty, sem divergência** (autor, 2026-10-30). Nada entra em `DIVERGENCIAS`.
**O Corpo Amaldiçoado Mutante foi descartado pelo autor** (2026-10-30), ver `AGENTS.md`. Nada aqui o implementa.

## 1. Um estado só: `sessao.vital`

```
vital: {
  estado: "vivo" | "morrendo" | "estabilizado" | "morto",
  saldo: 0,              // PV negativos acumulados (número positivo)
  sucessos: 0, falhas: 0,// falhas PERDURAM até descanso longo ou outra fonte
  testePendente: false,  // aberto no início do turno de quem está morrendo
  causa: null,           // "falhas" | "massivo" | "decisao" quando morto
  massivoPendente: false,// Restringido com Ainda de Pé: a morte massiva espera a escolha
  ultimoTeste: null,     // { natural, falhas, sucessos, rodada }
  ataque: null,          // { id, total, falhou, ferido }: a conta do ATAQUE em curso
  ferimentosPendentes: 0,// gatilhos de Ferimento Complexo ainda sem escolha ou rolagem
  semReacoes: false,     // ferida interna que falhou: sem reações até o próximo turno
  ferimentos: [ { uid, rolagem, grupo, membro, ferimento, rodada, tratado, permanente } ],
}
```

- Mora em `ficha/ficha-vital.js`, **módulo folha** (zero imports, está em `t-ordem-modulos.mjs`).
- **Generaliza** o que só o Restringido tinha: `especializacaoSessao.pvNegativos` virou `vital.saldo` e
  `falhasMorte` virou `vital.falhas`. O Restringido ficou só com os MODOS (`modoMorte`, `quedaPendente`,
  `cairNoProximoDano`). `recursosDeEspecializacao(s, d)` continua publicando `pvNegativos` e `falhasMorte`, lidos do
  estado vital. **Não existe segundo contador.** A queda das invocações (`transicaoDeQueda`) é outra regra e não foi tocada.
- **Fichas antigas:** `normalizaSessao` migra `pvNegativos` e `falhasMorte` para o estado vital e tira os dois campos
  de `especializacaoSessao`. Sessão sem o campo abre `vivo`. A sessão do combatente do Encontro passa pelo mesmo normalizador.
- `hpAtual` continua sendo o PV corrente e **nunca fica negativo**: a dívida é `vital.saldo`.

## 2. O que os verbos de sempre passaram a fazer (`ficha-sessao.js`)

| Verbo | Mudança |
|---|---|
| `aplicaDano(s, n, derived, { ataqueId })` | Registra a queda a 0, o saldo (o excesso depois da casca), a falha por dano nas Portas (uma por **ataque**), o dano massivo e o gatilho do Ferimento. Corpo morto não leva dano. |
| `aplicaPerdaDeVida(s, n, derived?)` | Leva às Portas e soma ao saldo, mas **não é ataque**: sem falha por si e sem Ferimento. |
| `aplicaDanoNaAlma` (regime de pilha) | É perda de vida (p.311): pode levar a 0 e às Portas. |
| `pagaCustoVida`, ação de contador que paga PV | Chegar a 0 entra nas Portas, sem falha. |
| `aplicaCura(s, n, max)` | **Quita o saldo antes de subir o PV** (N10). Quitar tudo estabiliza (`estabilizado`, 0 PV, age). O que sobra sobe o PV. Corpo morto não recebe cura. |
| `iniciaTurnoFicha` | Abre o `testePendente` de quem está morrendo. **Não rola.** Quem está de pé por Mesmo Morto não ganha teste. Limpa `semReacoes`. |
| `aparaSessao` | **Concilia** o estado com o PV depois de qualquer escrita: PV > 0 tira das Portas (as falhas ficam) e PV escrito à mão num corpo morto devolve a vida e zera as falhas. Devolve o mesmo objeto se nada muda. |
| `descansar` | Falhas e Portas caem, **Ferimentos ficam**, dados de vida gastos voltam. **Corpo morto não descansa** (devolve a mesma sessão). |

**Corpo morto não volta por caminho automático.** Só a escrita à mão do PV o devolve. Ficam de fora dele, com asserts e
mutação: o **Corpo de Aço** (regeneração comum, agora pela mesma `curaNaSessao` da cura, então quita a dívida antes de subir o
PV e não regenera morto), **Ainda de Pé** (as duas variantes e a cura rolada), **Rejeitar a Morte** (inclusive a falha garantida),
o teste do fim de turno do **Mesmo Morto**, o PV da **ampliação de recurso** (`alteraEstadoCombate`) e o ganho de PV do
**Bloodfeast** ao receber PE temporário.

Escritas de PV que NÃO passam pelos verbos de dano e cura, e por quê (exceções documentadas):

- Campo de digitar o PV (`onSet`): tratado pela **conciliação** do `aparaSessao`. É a mesa escrevendo o valor, então encerra
  as Portas em vez de quitar a dívida.
- Ainda de Pé e Rejeitar a Morte do Restringido (quando o corpo ainda não morreu): põem o PV direto e zeram o saldo e os
  sucessos de propósito (`recupera` em `ficha-especializacoes.js`), mantendo as falhas. São as exceções à regra geral da cura.
- A **Perda por Bleed** do Bloodfeast (`sofreBleed`, botão "Aplicar Perda" do `PainelBloodfeast`, painel do addon) pode levar o
  corpo a 0 sem registrar as Portas. O pagamento de vida do Bloodfeast tem piso de 1 PV e não chega a 0.

## 3. Operações (`ficha/ficha-morte.js`, `ficha-alma.js`, `ficha-dados-vida.js`)

Mesmo contrato do CL1: `(sessao, derived, entrada, pedido) -> { sessao, aplicado, ... }`. `pedido.opId` é **obrigatório**
(`novaOperacao()` do CL1, um por clique). Repetir o id devolve `{ repetida: true, aplicado: false }`. Recusa devolve a **mesma
sessão** com `erro` (texto de tela) e `codigo`. Nada rola sozinho: o d20 vem de `entrada.natural` (dado físico) ou `entrada.rng`.

| Operação | Entrada | Recusas (`codigo`) |
|---|---|---|
| `rolaTesteDeMorte` | `{ natural?, rng?, forcar? }` | `sem-opid`, `nao-morrendo`, `sem-teste-pendente`, `natural-invalido` |
| `estabilizaPorMedicina` | `{ total? \| sucesso?, adjacente? }` | `nao-morrendo`, `fora-do-alcance`, `sem-resultado` |
| `removeFalhasDeMorte` | `{ quantidade? \| todas? }` | `morto`, `sem-falhas` |
| `confirmaMorteMassiva` | nenhuma | `sem-massivo` |
| `registraFerimento` | `{ resultado? (1 a 10), rng?, forcar? }` | `sem-gatilho`, `resultado-invalido` |
| `trataFeridaInterna` | `{ uid, mestreEmMedicina: true }` | `sem-ferida-interna`, `sem-medicina`, `ja-tratada` |
| `testeDeFeridaInterna` | `{ uid?, natural?, rng? }` | `sem-ferida-interna`, `sem-fortitude`, `natural-invalido` |
| `tornaFerimentoPermanente` | `{ uid }` | `sem-ferimento`, `ja-permanente` |
| `recuperaFerimento` | `{ via, uid? \| quantidade? \| todos? }` | `via-desconhecida`, `sem-ferimento`, `so-pela-alma`, `vida-ou-alma-baixa` |
| `testeDeIntegridade` (pura) | `{ cd, natural?, rng? }` | `sem-integridade`, `sem-cd`, `natural-invalido` |
| `danoNaAlma` | `{ total, cd \| tr, natural?, rng?, desempate?, rdIgnorada?, ataqueId? }` | as do teste, mais as de `aplicaDanoRecebido` |
| `curaDeAlma` | `{ bruto, curador (derived), enxergaTracado }` | `curador-inelegivel` (com o motivo no `erro`), `morto`, `sem-cura` |
| `gastaDadosDeVida` | `{ classeId, quantidade } \| { todos }`, `limite?`, `multiplicadorCon?`, `treinamentos?`, `extras?`, `rng?` | `morto`, `morrendo`, `sem-pilha`, `classe-desconhecida`, `quantidade-invalida`, `sem-dados`, `limite` |
| `recuperaDadosDeVida` | `{ classeId?, quantidade? }` | `nada-a-recuperar`, `quantidade-invalida` |

Leituras puras para a tela: `resumoVital(sessao, derived)` (estado, saldo, falhas, CD da Medicina, limiar do Ferimento,
`pode.*` com as operações abertas agora, `restricoes`), `resumoDadosDeVida(sessao, derived, entrada)`, `avisoDoVital(vital)`
(a linha âmbar que a barra de PV já mostra), `bloqueioDeCuraDeAlma(curador, { enxergaTracado })`.

## 4. As regras e as leituras adotadas

**Portas da Morte (p.313).** Em 0 PV, no começo de todo turno, um d20: 1 duas falhas, 2 a 9 uma falha, 10 a 19 um sucesso,
20 dois sucessos. Três sucessos estabilizam (1 PV), três falhas matam. **As falhas perduram até um descanso longo** e
estabilizar zera o saldo e os sucessos, não as falhas. Nas Portas o corpo não age (`gastaAcao` recusa `morrendo`), salvo o
Restringido de pé por Mesmo Morto.

**Dano enquanto morrendo.** Uma falha por ATAQUE (vários tipos de dano do mesmo `ataqueId` contam uma só) e o dano soma ao
saldo. *Leitura adotada, a resposta do autor ficou em aberto (pendência na fila).*

**Dano massivo.** "Passe do seu máximo de vida, em pontos de vida negativos": o saldo **estritamente maior** que o PV máximo
mata sem as Portas, e o saldo ACUMULADO também conta. O Restringido com Ainda de Pé disponível **adia** a morte para a escolha
dele (`massivoPendente`): usar o Ainda de Pé (qualquer variante) resiste com 1 PV, recusar é `confirmaMorteMassiva`.

**Medicina.** Ação comum, a 1,5 m (declarado em `adjacente`), CD 15 + 1 por 5 PV negativos. O teste é de quem socorre e o
resultado entra aqui. Sucesso estabiliza com 1 PV. Falhar gasta a tentativa e nada muda.

**Estabilização.** Medicina e três sucessos terminam com **1 PV** (definição de "estabilizado" na p.313). Cura que quita
exatamente a dívida termina em **0 PV, `estabilizado`**: age e qualquer dano o derruba de novo, sem falha por dano.

**Ferimento Complexo (p.313 e 314).** Gatilho: **um ataque** que dê metade do PV máximo ou mais, com mínimo de 50 (conta o
dano inteiro do ataque, casca inclusa). Fica PENDENTE até a escolha do Narrador ou a rolagem (`registraFerimento`). Tabela
verbatim em `TABELA_FERIMENTOS`. Efeitos:

- por mecanismo que **já existia**, sem canal novo: ambos os olhos aplicam a condição **Cego**, uma perna aplica **Lento**
  (metade do movimento, o que o texto diz) e ambos os braços tiram **4 de Destreza** por Buff de Mesa sem prazo. As condições e
  o buff levam o id `ferimento:<uid>` e sobrevivem ao descanso (só saem por `recuperaFerimento`). A condição entra por
  `defineCondicoes`, o único escritor de condição da sessão (ele aplica o efeito sobre a Guarda e os filtros do Bloodfeast);
- **declarados** em `restricoesDeFerimentos` (a ficha mostra, quem rola aplica): desvantagem em percepção e ataques a
  distância (um olho), acrobacia (uma perna), atletismo (um braço), mãos disponíveis (`maosMax`), só rasteja (ambas as pernas);
- ferida interna: Fortitude CD 20 + nível por ação, **10 + nível depois de tratada**; falhar perde a ação e as reações até o
  próximo turno (`semReacoes`, que `gastaAcao` respeita);
- permanente "após 1 dia, ou ao cicatrizar": não há relógio, então é **declarado** (`tornaFerimentoPermanente`). O permanente só
  sai pela alma, com PV e Integridade no máximo (`recuperaFerimento`, `via: "alma"`). O comum sai por energia reversa, Feitiço
  Curativo ou meios raros (p.228: um ou todos).

**Alma (p.311).** O TR de Integridade vem **antes** de aplicar o Dano na Alma, sobre o total depois das defesas do tipo `alma`
(leitura do CL1): metade no sucesso, nada no sucesso crítico (sucesso com o d20 na margem de crítico do teste). A CD é da
**fonte do dano**, e o livro não traz uma: a operação exige `cd` ou o resultado `tr` já rolado. Cura de Alma: o requisito é de
**quem cura** (treino em Integridade, Energia Reversa nível 4 em `derived.aptidao.efetivo.er`, e `enxergaTracado` declarado),
e a cura é **reduzida à metade**. `defineAlma`, `curaAlma` e `aplicaDanoNaAlma` seguem sendo o ajuste da barra, sem teste.
`recuperaAlmaPorDescanso` (metade do que falta, p.311) **existe e não está ligada** ao botão de descanso (decisão do autor).

**Dados de Vida (p.20, 46, 335).** Um por nível, do tamanho do `pvDado` da Especialização (a pilha é uma entrada por
Especialização). Gastar cura o dado mais o modificador de Constituição em cada um (`multiplicadorCon: 2` no Elixir da Vida,
`limite` 4, 8 e 12 nos Remédios, `todos` no Elixir). Entra pelo `aplicaCura`, então quita a dívida antes de subir o PV. Não gasta
quem está morrendo ou morto. **O PV continua fixo**: a pilha só alimenta a cura. O botão de descanso devolve todos os dados (a D3).
O Treino de Resistência 2 soma 2 dados do maior tamanho da pilha, e como o derive não publica a etapa do treino quem chama passa
`treinamentos` (`creature.treinamentos`) ou `extras`. A pilha lê `derived.especializacoes.escolhidas`, então uma ficha sem
Especialização tem pilha vazia.

## 5. Mapa de ligação para as telas (Codex)

- **Já ligado:** a barra de PV da Ficha clássica e do painel do Encontro mostra `avisoDoVital(sessao.vital)` (âmbar, com o
  ícone). O aviso **não mostra o Ferimento pendente** enquanto nenhum botão o resolve (um aviso que nunca some vira ruído):
  religar quando o CX6 ligar o botão, lendo `resumoVital(...).pode.registrarFerimento`. Os botões `+` e `-` do PV já passam por `aplicaDano` e `aplicaCura`, que registram e quitam sozinhos.
- **Falta (CX6 e telas):** botão do teste de morte quando `resumoVital(...).pode.rolarTesteDeMorte`, ação de Medicina, escolha ou
  rolagem do Ferimento quando `pode.registrarFerimento`, lista de ferimentos com tratar, permanente e recuperar, o Dano na Alma
  e a cura de Alma pelas operações novas, o gasto de Dados de Vida, e o mesmo aviso no cabeçalho da Ficha G2.
- **Ataque com vários tipos:** o chamador que divide um ataque em instâncias deve passar o **mesmo** `ataqueId` em todas
  (`aplicaDanoRecebido` já repassa `entrada.ataqueId`).
- **Consumidores de outros lotes:** CX3 (Determinado a Viver, remoção de falhas do Suporte) usa `removeFalhasDeMorte` e o
  estado; CX4 (Feitiço Curativo que cura condições e Ferimentos) usa `recuperaFerimento` e `aplicaCura`; CX5 (Remédios e Elixir)
  usa `gastaDadosDeVida` com `limite` e `multiplicadorCon`; CX2 não depende deste módulo (o Mutante foi descartado).

## 6. Testes

`asserts/t-cl2-vital.mjs` (núcleo vital e Restringido), `asserts/t-cl2-alma-dados-vida.mjs` (Alma e Dados de Vida) e
`asserts/t-mutante-descartado.mjs` (guarda da exclusão do Mutante). O `t-fang-especializacoes.mjs` mudou uma linha: o saldo do
Restringido agora é lido do estado vital (mesmo valor, outro endereço).
