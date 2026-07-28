# Passada de Efeitos do lado da CRIATURA (Motor de Automação)

> Handoff escrito em 2026-07-27 para abrir a frente "ligar os efeitos das Habilidades de
> Especialização". Leia junto com `automacao-dsl.md` (a linguagem), `afty-status.md` (pendências
> de conteúdo) e `afty-invocacoes.md` (a seção GAPS DO MOTOR, que vale igual aqui).

## 1. O problema em uma frase

Os catálogos estão transcritos e travam pré-requisito e orçamento, mas **nenhum efeito é
aplicado na ficha**, porque o único canal de efeitos que existe aplica sobre **invocações**, e
não sobre a própria criatura.

## 2. Censo: o que está esperando efeito

| Catálogo | Itens | Arquivo |
|---|---|---|
| Habilidades de Especialização | **367** (Combatente 71, Lutador 70, Conjurador 66, Suporte 58, Restringido 54, Controlador 48) | `afty-habilidades.js` |
| Talentos | 51 | `afty-talentos.js` |
| Melhorias Superiores | 11 | `afty-alto-nivel.js` |
| Habilidades Lendárias | 16 | `afty-alto-nivel.js` |
| Habilidades Ápice | 6 | `afty-alto-nivel.js` |
| **Total** | **451** | |
| **Com efeito realmente ligado hoje** | **8** (só Controlador, e sobre invocação) | |

Mais 10 habilidades com escolha aninhada (`escolha`), cujo efeito depende da opção escolhida.

## 3. O precedente que FUNCIONA: Controlador → Invocação

É o modelo a copiar. Quatro peças:

**(a) O mapa de efeitos**, em `afty-habilidades.js`:

```js
export const CONTROLADOR_EFEITOS_INVOCACAO = {
  ctr_invocacoes_resistentes: [{ canal: "pv", expr: "bt * 5" }],
  ctr_invocacoes_moveis: [{ canal: "deslocamento",
    expr: "1.5 * (1 + (nivel_controlador >= 6) + (nivel_controlador >= 12) + (nivel_controlador >= 18))" }],
  ctr_concentrar_poder: [
    { canal: "pv", quando: "marcada", expr: "5 + 5*(nivel_controlador >= 6) + ..." },
    // ...
  ],
};
```

Cada efeito é `{ canal, expr, quando? }`. `expr` é DSL e sempre resulta num número. `quando` é
uma condição opcional em DSL: sem ela o efeito sempre entra, com ela só entra se avaliar
diferente de zero.

**(b) A coleta**, `efeitosInvocacaoControlador(ids)`: percorre as habilidades escolhidas e
devolve uma lista chapada, carimbando `origem` (o id) e `nome` (para o detalhamento na UI).

**(c) A aplicação**, `efeitosHabilidade(inv, dono)` em `afty-invocacoes.js`:

```js
const acc = Object.fromEntries(EFEITO_CANAIS.map((c) => [c, 0]));
acc.detalhes = [];                       // { nome, canal, valor } por efeito aplicado
const ctx = buildInvocacaoDslContext(inv, dono);
for (const e of efeitos) {
  if (!e || !(e.canal in acc)) continue;
  if (e.quando && evalNumber(e.quando, ctx, 0) === 0) continue;
  const valor = evalNumber(e.expr, ctx, 0);
  acc[e.canal] += valor;
  if (valor) acc.detalhes.push({ nome: e.nome || e.origem, canal: e.canal, valor });
}
```

Três propriedades que valem manter: canal desconhecido é **ignorado** (não quebra), erro de
expressão cai no fallback (`evalNumber(expr, ctx, 0)`), e todo efeito aplicado fica registrado
em `detalhes` para a UI poder mostrar de onde veio o número.

**(d) O contexto de variáveis**, `buildInvocacaoDslContext`: monta o namespace da invocação
(atributos, `grau`, `marcada`) mais os do dono (`nd`, `bt`, `nivel_controlador`) e delega ao
`evalNumber` de `src/components/fm-dsl.js`, que é agnóstico de variável. **A camada Afty nunca
edita `src/components/`**, só monta contexto e chama.

## 4. O segundo precedente: Treinamentos

`resolveTreinoEfeitos(creature)` em `afty-treinamentos.js` já é um agregador de efeitos do lado
da criatura, e o resultado (`treino.hp`, `treino.pe`, `treino.movimento`, `treino.defesa`,
`treino.aptidao`, `treino.aptidaoTrilha`) já entra no `deriveAfty`. Mas:

- os efeitos são `{ tipo, valor }` com **valor fixo**, sem DSL e sem condição,
- os canais são um objeto literal fixo, não um catálogo,
- há um caso de duas semânticas no mesmo canal: `aptidao` sem trilha é orçamento livre, com
  trilha é concessão direcionada e grátis.

**Decisão a tomar:** o motor novo absorve isso (Treinamentos passam a emitir
`{ canal, expr }`) ou os dois convivem? Absorver é o certo a prazo e evita dois vocabulários
de canal, mas mexe num sistema que já funciona.

## 5. O bloqueio real: falta ponto de injeção no `deriveAfty`

`deriveAfty` calcula tudo em linha reta, e a lista de habilidades escolhidas só é resolvida
**perto do fim**, depois de quase todos os stats que ela precisaria modificar. Ordem atual:

```
core (tipo, patamar, nd)  →  attrBonus/desenv  →  bt = maestria(nd)
  →  equip  →  attrEff  →  mods  →  tecnicaAttr/modTecnica
  →  treino  →  carga  →  grau
  →  HP  →  PE  →  resParcial  →  movimento  →  rdGeral  →  rdEspecifico
  →  cd (cdTipo)  →  feitiços/gerais/orcamentoHabilidades
  →  rdFisico  →  defesa (defTipo)  →  testes (perícias/TR/ataque)  →  atencao
  →  ORÇAMENTOS: aptidão, especializações, talentos, HABILIDADES, altoNivel
  →  invocações/hordas  →  focosTotais  →  statOverrides
```

`resolveHabilidades` depende só de `especializacoes`, `talentos.gastos`, `bt` e o bônus das
Gerais. Nada disso precisa dos stats, então **dá para subir a resolução das habilidades para
logo depois de `mods`**, e é isso que destrava a frente inteira.

**A ordem de aplicação é em TRÊS ESTÁGIOS** (autor, 2026-07-27). O efeito de **atributo entra
primeiro**, e todo o resto lê o atributo já somado:

> "Tenho força 14. Recebo +6 de Força fico com Força 20. Depois eu recebo +5 de Defesa
> (Mod. Força)"

Os +5 saem da Força 20, não da 14. E o atributo se parte em dois, porque só o permanente conta
para pré-requisito:

> "Se o Modificador de Força for temporário, não! Se for permanente, sim!"

| Estágio | O quê | Lê | Produz |
|---|---|---|---|
| 1a | `atributo` permanente | atributo BASE | `derived.attrPermanente`, o que o pré-requisito enxerga |
| 1b | `atributo` temporário | o permanente | `derived.attrEff`, o atributo final da ficha |
| 2 | todos os outros canais | o atributo final | os stats |

O efeito declara `duracao: "temporaria"`; sem declarar, é permanente. **Talento é o único
catálogo cujo pré-requisito lê atributo**, então `resolveTalentos` roda duas vezes e a segunda
só corrige o `inacessiveis`. Habilidades e Alto Nível checam nível de classe.

⚠ **O teto de 30 não derruba o que já passou dele.** Como a soma de atributo roda duas vezes,
clampar cru em 30 no segundo passo desfaz um `furaTeto` legítimo do primeiro. O teto impede
SUBIR além de 30, não estar além de 30.

⚠ **Isso DIVERGE de `automacao-dsl.md`**, que diz "as expressões leem os valores base, sem os
próprios buffs". Aquele texto espelha o fm-dsl da 2.5.2 e continua valendo para o motor de
INVOCAÇÃO. Não alinhar um pelo outro.

**O que ainda lê o base:** um efeito de atributo permanente não vê o irmão do mesmo estágio,
o que evita o laço A→B→A.

**Assumido, a confirmar:** efeito temporário fica sempre ligado na ficha. Ligar e desligar
depende de um estado de combate que ainda não existe.

## 6. A DSL, resumida

Fonte única: `src/components/fm-dsl.js`. Espelho legível em `docs/automacao-dsl.md`.

- Sempre resulta num **número** (booleano é 1/0).
- Variáveis: atributos e `mod_*`, `nd`, `bt`, níveis de aptidão (`dom, au, cl, bar, er`),
  stats base (`defesa, acerto, cd, atencao, rd_geral, hp_max, pe_max`...), recursos atuais
  (`hp_atual, pe_pct`...).
- Funções: `metade, dobro, teto, piso, arredonda, abs, min, max`.
- Operadores: aritmética, comparações, `e / ou / nao`.
- Identificadores normalizados (sem acento, minúsculas).

**Variáveis que faltam para o lado da criatura** (o contexto novo precisa expor): nível REAL e
de ESCALONAMENTO por especialização (o lado da multiclasse, ver
`especializacoes.escolhidas[].nivelEscalonamento`), `patamar`, `tipo`, `grau` do feiticeiro,
proficiência em perícia/TR, e provavelmente `maestria` como alias de `bt`.

## 7. Canais propostos do lado da criatura

Derivados do que o `deriveAfty` já calcula. Nomes a fechar antes de escrever conteúdo, porque
451 entradas vão referenciá-los.

| Canal | Alvo no derive | Nota |
|---|---|---|
| `hp`, `pe` | `hp`, `pe` | somam depois do multiplicador de Alma? Decidir |
| `defesa` | `defesa` | |
| `cd` | `cd` | |
| `rdGeral`, `rdEspecifico`, `rdFisico` | idem | RD Física é canal separado |
| `movimento` | `movimento` | em metros, aceita 1,5 |
| `atencao` | `atencao` | hoje é 10 + Percepção |
| `resParcial` | `resParcial` | |
| `atributo` | `attrEff` por atributo | precisa de alvo (`atributo: "forca"`), e o teto de 30 |
| `bonusPericia` | `testes.pericias[].bonus` | com alvo, ou todas |
| `bonusTR` | `testes.resistencias[].bonus` | com alvo, ou todos |
| `bonusAcerto` | `testes.ataques[].bonus` | com alvo (corpo/distância/amaldiçoado) |
| `vagasPericia` | `testes.orcamento.total` | o "+ OUTROS" da fórmula, já existe como `periciasBonus` |
| `vagasHabilidade` | `habilidades.total` | já existe como `bonusVagas` |
| `vagasAptidao`, `nivelAptidao` | `totalAptidoesAmaldicoadas`, `aptidao` | dois canais, ver §4 |
| `focos` | `focosTotais` | já existe como `focosBonus` |
| `custoPE` | Feitiços | redução de custo, com o piso de 1 PE |

Note que quatro deles (`periciasBonus`, `bonusVagas`, `focosBonus`, `periciasBonus`) já existem
como campos avulsos da ficha. O motor deve **substituir** esses campos, não somar por fora.

Canais com **alvo** (atributo, perícia, TR, tipo de ataque) precisam de um campo a mais no
efeito, algo como `{ canal: "bonusPericia", alvo: "furtividade", expr: "bt" }`. O motor de
invocação não tem isso, então é a primeira extensão de verdade.

## 8. Decisões abertas que travam conteúdo

Da lista de retomada em `afty-status.md` (seção C), continuam valendo:

| # | Assunto |
|---|---|
| C1 | **Roubo de Habilidade: filtro de energia.** Marcar `usaEnergia: true` nas ~141 de Combatente e Lutador que gastam PE |
| C2 | `nivelMin` de escolha aninhada não bloqueia (Restringido 2 rouba habilidade de 16°) |
| C3 | **"Modificador de Int OU Sab"**: o jogador escolhe qual. Vira estado na ficha ou convenção "usa o maior"? Aparece em ~10 do Conjurador e vários do Suporte e Lutador |
| C4 | **Repetível que concede nível de trilha à escolha** (6 casos, resolver junto) |
| C5 | **Repetível que o shape de ids únicos não suporta** (Nova Habilidade ilimitada, Respeito Celeste 2x, Incremento de Atributo, Crescimento Corporal) |
| C6 | **Escolha aninhada de ATRIBUTO** (Incremento de Atributo, Quebra de Limites, Pináculo Físico) |
| C7 | **Escolha aninhada que atravessa arquivos** (Adepto de Combate → `ESTILOS_DE_COMBATE`, Adepto de Feitiçaria → `MUDANCAS_DE_FUNDAMENTO`) |

Mais duas que aparecem só quando os efeitos existirem:

- **Aperfeiçoamento de Atributo** (Lendária) diz "podendo superar o máximo de 30", e o `eff()`
  do `deriveAfty` tem teto duro de 30. O canal `atributo` precisa de uma marca de "fura o teto",
  igual ao acessório de atributo dos Equipamentos já faz.
- **Melhoria de Alma** mexe no máximo de Integridade da Alma, que hoje multiplica o HP. Canal
  novo (`almaMax`).

## 9. O que o motor NÃO faz (e não vai fazer com DSL)

O `fm-dsl` produz **um número**. Tudo abaixo precisa de mecanismo novo, e a maior parte das 451
entradas cai aqui. A lista longa e por habilidade está em `afty-invocacoes.md` §GAPS DO MOTOR,
e o padrão se repete do lado da criatura:

1. **Economia de ação**: conceder ação, ataque extra, reação, reroll, vantagem/desvantagem.
2. **Posicional e condicional de campo**: alcance, flanqueamento, número de inimigos adjacentes.
3. **Por rodada / gatilho**: "uma vez por rodada", "ao acertar", "quando cair a menos de metade".
4. **Escolha do jogador em tempo de jogo**: "escolha dois efeitos", "Int OU Sab".
5. **Texto puro**: proficiências narrativas, permissões, resistências a condições.

**Recomendação:** classificar as 451 em três baldes ANTES de escrever expressão, e marcar cada
entrada no catálogo com esse balde. Sem isso, a passada vira uma leitura de 451 textos sem
critério de parada.

- **Numérico incondicional** (dá para hoje).
- **Numérico condicional** (dá com `quando`, se as variáveis existirem).
- **Fora do motor** (registrar como `efeitoManual: true` + texto, e a UI só exibe).

## 10. Plano de fases

1. ~~**Fase 0 — Infra.**~~ **FEITA em 2026-07-27.** `src/systems/afty/afty-efeitos.js` com
   `EFEITO_CANAIS` (21 canais), `buildCriaturaDslContext`, `coletarEfeitos`,
   `coletarEfeitosCriatura`, `aplicarEfeitos`, `valorCanal`, `furaTetoEm` e
   `validarMapaEfeitos`. No `deriveAfty`, os catálogos escolhidos (Especializações, Gerais,
   Talentos, Habilidades, Alto Nível, Aptidão) **subiram para logo depois dos atributos base**,
   e a passada de efeitos roda ali, antes de todos os stats. Canais já ligados: `hp` (dentro do
   multiplicador de Alma), `pe`, `defesa`, `cd`, `rdGeral`, `rdFisico`, `movimento` e
   `atributo` (com o teto de 30 e a exceção `furaTeto`). Exposto em `derived.efeitos`.
   Os cinco mapas de conteúdo (`HABILIDADE_EFEITOS`, `TALENTO_EFEITOS`, `MELHORIA_EFEITOS`,
   `LENDARIA_EFEITOS`, `APICE_EFEITOS`) existem e estão **vazios**. 66 testes em
   `scratchpad/test-efeitos.mjs`.
2. **Fase 1 — Absorver o que já existe.** **PARCIAL em 2026-07-27:** `resolveTreinoEfeitos`
   virou `efeitosDeTreino(creature)` e emite `{ canal, expr, alvo? }` como qualquer outra fonte,
   aplicado num **estágio 0** (os Treinamentos estão a montante do contexto: dão atributo e
   nível de aptidão, que são variáveis do DSL). Fim dos dois vocabulários de canal. Os termos
   `treino.hp`, `treino.pe`, `treino.movimento` e `treino.defesa` saíram das fórmulas: agora
   chegam por `canal(...)` e aparecem em `detalhes` com a linha de treino como origem.
   **Ganho de brinde:** o Treino de Atributo, cujo canal era somado e depois ignorado, passou a
   aplicar de verdade no atributo escolhido de cada instância.
   **COMPLETA no mesmo dia:** as concessões das **Habilidades Gerais** viraram `GERAL_EFEITOS`
   (canais `vagasHabilidade`, `vagasAptidao` e `focos`, com o `vezes` das repetíveis
   multiplicando), e os campos "+ OUTROS" da ficha (`periciasBonus`, `focosBonus`) entram por
   `efeitosManuaisDaFicha`. O `resolveGerais` **perdeu o `ganhos`**: ele agora só sabe quem foi
   pego, quantas vezes, o teto, o acesso e o destravamento. Calcular o ganho lá também seria a
   segunda fonte da mesma regra, que é justamente o que a absorção veio matar.
   **Não sobrou nenhum canal somando por fora do Motor.** 112 testes.
3. **Fase 2 — Triagem.** Passar os 451 e marcar o balde de cada um. É a fase longa, e é
   conteúdo, não código. Sai daqui a lista real do que é automatizável.
4. **Fase 3 — Escrever as expressões**, especialização por especialização. `afty-status.md` já
   anota "sai quase de graça" para 11 do Lutador, 10 do Conjurador e 4 do Suporte, que já estão
   escritas como fórmula nas seções de cada especialização.
5. **Fase 4 — UI.** Mostrar `detalhes` (de onde veio cada número) na aba Cálculos, que é onde o
   usuário já vai procurar. O `statOverrides` continua vencendo por cima de tudo.

## 11. Decisões do autor (2026-07-27)

1. **HP entra ANTES do multiplicador de Integridade da Alma.**
2. **"Modificador de Int OU Sab" usa o MAIOR dos dois.** Não vira escolha gravada na ficha.
   Fecha o item C3 da lista de retomada.
3. **Treinamentos são absorvidos pelo motor novo** (Fase 1). Fim dos dois vocabulários de canal.
4. **Triagem balde a balde nos casos duvidosos**, com o autor decidindo.
5. **Canais:** a pergunta foi mal feita e o autor não a reconheceu. Canal é o NOME DO DESTINO do
   efeito na ficha (`{ canal: "defesa", expr: "metade(bt)" }` soma no canal `defesa`). A lista
   da §7 segue como proposta até o autor reagir a ela. Renomear é barato enquanto o catálogo de
   efeitos estiver vazio.

### ⚠ A diretriz que muda o plano

> "Eu peço para que use o Motor de Automação **sempre**, pq isso força a gente melhorar ele para
> situações do próprio sistema. Para quando eu for criar habilidades de especialização próprias,
> o motor estar robusto para esse tipo de coisa. Sempre vá melhorando o motor conforme
> necessidade e adicionando no DSL." (autor, 2026-07-27)

Isso **derruba o terceiro balde da §9**. Não existe mais "fora do motor, vira texto e a UI só
exibe". O que hoje não cabe vira **extensão do motor**: tipo de efeito novo, variável nova,
gatilho novo. A triagem da Fase 2 passa a classificar em:

- **Cabe hoje** (canal numérico, com ou sem `quando`).
- **Precisa de extensão**, e a extensão entra junto. Cada uma vira um item de trabalho do motor.

### ⚠ Limite duro: `fm-dsl.js` é do grimório 2.5.2

`src/components/fm-dsl.js` é somente-leitura (regra do projeto). Então "adicionar no DSL" tem
dois caminhos bem diferentes:

| O que | Onde | Pode? |
|---|---|---|
| **Variável nova** (`nivel_lutador`, `patamar`, `grau`...) | contexto montado na camada Afty | **Sim**, livre. `evalNumber` é agnóstico de variável |
| **Tipo de efeito novo** (conceder ação, reação, vantagem, gatilho) | motor Afty (`afty-efeitos.js`) | **Sim**, livre. Não é DSL, é do motor |
| **Função ou operador novo** no DSL (ex.: `entre(x, a, b)`) | `src/components/fm-dsl.js` | **Não sem sua autorização.** Cai na regra de não alterar a 2.5.2 |

Na prática quase toda melhoria cai nas duas primeiras linhas. Quando bater na terceira, eu paro
e pergunto. Consequência: `docs/automacao-dsl.md` espelha só o `fm-dsl.js`, então as variáveis
que o Afty adiciona precisam de referência própria (o motor de invocação já adiciona `grau`,
`marcada` e `nivel_controlador` sem estarem lá).

---

## Fase 2 · LUTADOR (2026-07-27)

Primeira especialização passada balde a balde. **70 habilidades**, **12 ligadas** ao Motor,
mais Aptidões de Luta, que entra pela escolha aninhada.

### O que ligou

| Habilidade | Canal | Expressão |
|---|---|---|
| Corpo Treinado | `finezaAtaque` (corpo) | `1` |
| Reflexo Evasivo | `rdGeral` | `piso(esc_lutador / 2)` |
| Implemento Marcial | `cd` | `2 + (esc_lutador >= 8) + (esc_lutador >= 16)` |
| Gosto pela Luta | `bonusAcerto` (corpo), `bonusTR` (fortitude) | degraus por nível |
| Caminho da Mão Vazia | `bonusAcerto` (corpo) | `piso(maestria / 2)` |
| Defesa Marcial | `defesa` | `1 + piso(maestria / 2)` |
| Músculos Desenvolvidos | `defesa` | `max(0, mod_forca - mod_destreza)` |
| Aprimoramento Marcial | `cd` | `piso(maestria / 2)` |
| Corpo Calejado | `defesa`, `hp` | `piso(mod_constituicao / 2)`, `esc_lutador` |
| Seja Água | `movimento` | `3` |
| Corpo Supremo | `movimento`, `defesa`, `rdFisico`, `rdGeral` | `3`, `4`, `piso(nd/2)`, `piso(nd/4)` |
| Aptidões de Luta | `nivelAptidao` (au ou cl) | `1`, via escolha aninhada |

### As três extensões que o Lutador exigiu

1. **`ESCOLHA_EFEITOS`** — efeito chaveado pelo id da OPÇÃO de uma escolha aninhada, não pela
   habilidade dona. Quem pegou a habilidade e marcou outra opção não recebe nada. Serve
   Aptidões de Luta hoje e os Estilos de Combate do Combatente depois.
2. **Estágio 0b (`CANAIS_PRE_CONTEXTO`)** — `nivelAptidao` é variável do DSL (`au`, `cl`...),
   então uma habilidade que concede trilha precisa entrar ANTES do contexto principal. Vale a
   mesma regra do estágio de atributo: dentro dele um efeito não vê o irmão.
3. **Canais `proficienciaTR` e `finezaAtaque`** — irmãos de `proficienciaPericia` e do traço
   Fineza do ataque. O primeiro atende "Teste de Resistência Mestre", que existe nas SEIS
   especializações.

### O que NÃO coube, e por quê

| Motivo | Quantas | Exemplos |
|---|---|---|
| Estado de combate (Empolgação, Brutalidade, PV temporário) | ~14 | Fluxo, Ignorar Dor, Eliminar e Continuar |
| **Dano** (nível de dado, dano adicional, margem de crítico) | ~16 | Corpo Treinado (parte), Poder Corporal, Punhos Letais |
| Reação, ação bônus, "uma vez por rodada" | ~20 | Aparar Ataque, Ataque Extra, Voadora |
| Vantagem, desvantagem e condições | ~5 | Alma Quieta, Mente em Paz |
| Manobras e testes opostos (Agarrar, Derrubar, Empurrar) | ~4 | Complementação Marcial, Potência Superior |
| Sistema de armas | ~4 | Dedicação em Arma, Um com a Arma |

O balde de **dano** deixou de ser bloqueio: o autor mandou as fórmulas de Dano do Ataque Básico
em 2026-07-27. Falta resolver as células (ver `docs/afty-status.md`) antes de programar.

### Pendente do Lutador

- **Teste de Resistência Mestre** (9°): o canal existe, mas falta saber **qual TR a
  especialização Lutador concede**. Não está no texto transcrito.
- **Poder Corporal** (6°): o cabeçalho se perdeu no PDF, o nome foi deduzido. Confirmar.
- Corpo Supremo: a RD Física soma com a RD Geral na mesa, ou substitui contra dano físico?

---

## DANO (2026-07-27, mesma leva)

O autor mandou as fórmulas no meio da passada do Lutador, o que destravou o maior balde de
"não coube". A lógica é ao contrário do habitual: calcula-se o **Dano Total** alvo, e o **Dano
Fixo** é só o resto que falta para a média da rolagem bater nesse total.

```
Dano Total  = coefND × (ND + Níveis de Dano) + escala × (mod do atributo + Aptidão CL)
              + Dano Adicional da Arma + canal danoBonus
Dados       = modificador do atributo + 1      (piso de 1)
Dado        = Comum d8 · Desafio d10 · Calamidade d12 · Beyond d12
Dano Fixo   = teto(Dano Total − Dados × média do dado)
```

`coefND` e `escala` por Patamar: Comum 2/1 · Desafio 3/2 · Calamidade 4/2 · Beyond 4/3.
Dano Adicional da Arma por grau: Desarmado 0 · Quarto 4 · Terceiro 8 · Segundo 12 ·
Primeiro 16 · Especial 40.

⚠ O **arredondamento é PARA CIMA**, única exceção conhecida à regra de piso do sistema.

### Decisões do autor que mudaram o que já estava escrito

- **Lacaio e Grau Zero deixaram de existir. "Maldição" é o Beyond.** Nada a mudar nos catálogos.
- **Nem o grau nem o atributo são escolha da ficha.** O grau é o da Ferramenta Amaldiçoada
  DAQUELA arma, e o Ataque Básico só sobe de grau com Manoplas ou Faixas. O atributo vem da
  arma: Força no corpo a corpo, Destreza a distância, e o maior dos dois com o traço Fineza.
- **Uma linha de dano por FONTE**, na aba Habilidades: o Ataque Básico (que engloba Desarmado,
  Faixas, Manoplas e o Corpo Treinado) e mais uma por arma carregada.
- **O dano listado na tabela da arma NÃO entra.** Da arma vêm só o Alcance e as Propriedades.
- **Nível de Dano** soma 1 no ND, e só no cálculo de dano: "um ND 17 com 3 Níveis de Dano, para
  unicamente DANO, seria considerado um ND 20".
- **Corpo Treinado** não dá "1d8 que sobe": dá 1 Nível de Dano, +1 nos níveis 5, 9, 13 e 17.

### Canais novos

`danoBonus` e `nivelDano`, os dois com alvo `fonteDano` (`basico` ou o id da arma). Sem alvo
valem para todas as linhas.

### ⚠ Achado: arma não é equipável

A aba Equipamentos só deixa equipar uniforme, escudo e item com efeito. Exigir `equipado` na
lista de dano deixaria a lista sem nenhuma arma, para sempre. Por isso o critério é **arma
CARREGADA**, que também é a palavra do autor ("para cada Tipo de Arma colocado").
