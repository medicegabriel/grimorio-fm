<!--
  Espelho da referência da DSL de Automação. Fonte única: src/components/fm-dsl.js
  (catálogos DSL_VARIABLE_GROUPS / DSL_FUNCTIONS / DSL_OPERATORS / DSL_EXAMPLES e
  os geradores dslReferenceMarkdown / dslLlmPrompt). Ao alterar a DSL, atualize lá
  e reflita aqui. No app, a mesma referência aparece em AutomationDocsModal.
-->

# DSL de Automação — Grimório

Linguagem de expressões para programar habilidades (buffs/efeitos). Em português, sem código de verdade — só expressões matemáticas e lógicas. Uma expressão sempre resulta num **número** (booleanos são 1/0).

Onde se usa:
- **Valor de um efeito** — ex.: um buff de Defesa igual a `metade(nd)`.
- **Pré-requisito de uma regra** — ex.: só vale com `dom >= 3`. Passivas que não atendem são ignoradas; ativadas ficam bloqueadas.

## Variáveis

### Atributos
- `forca, destreza, constituicao, inteligencia, sabedoria, presenca` — Valor do atributo (ex.: 18).
- `mod_forca, mod_destreza, ...` — Modificador do atributo (ex.: +4).

> ⚠ **Canal `atributo` respeita o limite** (2026-07-29). Ele apara no limite daquele atributo (20
> padrão), não no teto de 30. Efeito que diz em texto que o limite sobe junto emite **as duas
> metades**: `atributo` para o valor e `limiteAtributo` para o teto. Ver a seção Sistema de
> ATRIBUTOS em `afty-status.md`.

### Núcleo
- `nd` — Nível de Desafio.
- `bt` — Bônus de Treinamento.
- `dom, au, cl, bar, er` — Níveis de aptidão (Domínio, Aura, Controle/Leitura, Barreira, Energia Reversa).

### Stats de combate (base)
- `defesa, acerto, cd` — Defesa, Acerto e CD.
- `atencao, iniciativa, deslocamento` — Atenção, Iniciativa e Deslocamento.
- `rd_geral, rd_irredutivel` — Redução de Dano.
- `guarda_max, hp_max, pe_max` — Guarda Inabalável, PV e PE máximos.

### Recursos atuais (combate)
- `hp_atual, pe_atual` — PV e PE atuais.
- `guarda_atual, alma_atual, hp_temp` — Guarda atual, Alma atual e PV temporário.
- `hp_pct, pe_pct` — Percentual de PV/PE atual (0–100).

### Estados de combate do Afty
- `em_combate` — 1 enquanto a bancada ou a sessão está em combate.
- `dominio_ativo` — 1 quando a sessão selecionou uma Expansão de Domínio válida.
- Os demais ids de `COMBATE_ESTADOS` viram identificadores normalizados pelo mesmo caminho. Estados
  de opção também geram uma variável para cada opção.

## Funções
- `metade(x)` — Metade de x.
- `dobro(x)` — Dobro de x.
- `teto(x)` — Arredonda pra cima.
- `piso(x)` — Arredonda pra baixo.
- `arredonda(x)` — Arredonda ao inteiro mais próximo.
- `abs(x)` — Valor absoluto.
- `min(a, b, ...)` — Menor valor.
- `max(a, b, ...)` — Maior valor.

## Operadores
- `+  -  *  /  %` — Aritmética.
- `<  >  <=  >=  ==  !=` — Comparações (resultam em verdadeiro/falso).
- `e   ou   nao` — Lógicos (também aceitam `&&`, `||`, `!`).
- `verdadeiro / falso` — Constantes booleanas (1 / 0).

## Exemplos
- `metade(nd)` — Metade do ND — bom pra escalar um buff.
- `bt + 2` — Bônus de Treinamento mais 2.
- `dom >= 3` — Pré-requisito: Domínio nível 3 ou mais.
- `hp_atual < metade(hp_max)` — Verdadeiro quando estiver com menos da metade da vida.
- `max(mod_presenca, 1)` — O modificador de Presença, no mínimo 1.
- `dom >= 3 e pe_atual >= 10` — Combina dois pré-requisitos.

## ⚠ No Grimório Afty o vocabulário é MUITO maior

Este arquivo espelha o `fm-dsl.js` da 2.5.2, e ele é só a base. O Afty acrescenta
a maior parte das variáveis em `buildCriaturaDslContext` (`src/systems/afty/afty-efeitos.js`):
patamar e tipo como booleanas, grau, maestria, níveis por especialização, os estados
da bancada de Simulação de Combate, uma booleana por habilidade do catálogo, uma por
perícia, e mais. Numa criatura qualquer são cerca de **660 variáveis**.

**Não existe lista escrita delas, e é de propósito.** Uma lista à mão envelheceria
calada no dia em que alguém somasse uma variável ao contexto. Quem monta a lista é
`vocabularioDsl` (`src/systems/afty/afty-dsl-vocabulario.js`), que **classifica o
contexto real** em grupos: variável nova aparece sozinha, e o que nenhuma regra
reconhece cai num grupo "Outras" em vez de sumir.

👉 **Para ver o vocabulário com o VALOR de cada variável**, use o seletor `{ }` ao lado
de qualquer campo de expressão do Motor de Automação, no criador do Afty. Ele lista as
variáveis agrupadas com o valor atual daquela criatura, busca sem acento, e clicar
insere o nome no ponto do cursor.

⚠ As famílias grandes (`tem_*`, `prof_*`) mostram só o que **não é zero**, porque são
centenas de entradas e apenas uma dúzia costuma valer algo. A busca alcança todas, e o
cabeçalho do grupo mostra quantas estão visíveis do total.

## Notas
- Identificadores são normalizados (minúsculas, sem acento): `Constituição` e `constituicao` são a mesma variável.
- As expressões leem os valores **base** (sem os próprios buffs) + os recursos atuais — então um efeito que modifica Defesa não lê a Defesa já modificada (evita laço).
- Em caso de erro na expressão, o valor cai no fallback (valor fixo do efeito, ou pré-requisito tratado como atendido), sem quebrar o app.
- Os canais são consumidores do resultado da DSL, não parte da linguagem. A integração de Domínio
  usa `movimentoMult` para multiplicar o movimento final, `custoPE` como redução de custo,
  `removeResistencia` como sinalizador por fonte de dano e `nivelAptidao` com `limiteAptidao` para o
  bônus que pode passar do teto normal.
