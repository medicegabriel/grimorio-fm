# Ficha de Player (handoff para chat novo)

Guia da rota **`/Player`**. Escrito em 2026-08-31, quando a Ficha de Player já estava de pé e o
trabalho passou a ser fechar as divergências uma a uma.

> **Leia primeiro:** `afty-status.md` (log das sessões e o porquê das decisões) e `a-fazer.md` (a fila
> de trabalho, que vale para o repositório inteiro). Este arquivo não repete nenhum dos dois: ele
> conta só o que é específico do Player e onde estão as alavancas.

---

## A FRASE QUE SEGURA TUDO

**O Grimório Afty e a Ficha de Player são o MESMO livro lido por dois lados.**

Não são dois apps, não são dois motores, não são duas cópias do catálogo. São um código só, e o que
os separa é uma **chave de sistema** que vem da FICHA (`creature.rulesVersion`), nunca da rota.

⚠ **Nunca leia a URL para decidir uma regra.** Uma ficha de jogador aberta dentro de um Encontro do
mestre continua sendo ficha de jogador, e a rota ali é `/Afty`. Quem responde é
`sistemaDaFicha(creature)`, em `afty-sistema.js`.

---

## AS TRÊS ALAVANCAS

Tudo que diverge passa por uma destas três, e nenhuma outra.

### 1. `regraDo(sistema, idDivergencia)`

Devolve `"afty"` ou `"player"`, e **não o valor da regra**: o valor mora no módulo que sabe
calculá-la. Quem chama escreve o `if`, e a tabela só diz de que lado ele cai.

```js
const armaDecide = regraDo(ctx.sistema, "proficienciaPorArma") === "player";
```

⚠ **Divergência desconhecida devolve `"afty"`** em vez de quebrar, pela mesma razão que a DSL cai no
fallback: um id errado não pode derrubar o criador de fichas no meio da mesa.

### 2. A tabela `DIVERGENCIAS`

Vinte e uma entradas em `afty-sistema.js`, dezenove ligadas. **Isto é DADO, e não comentário**, porque
comentário envelhece calado: cada entrada carrega a citação verbatim de onde a divergência está escrita, o que vale de
cada lado, e se o código JÁ desvia.

| campo | o que é |
|---|---|
| `id` | a chave que o `regraDo` lê |
| `tipo` | `"regra"` muda NÚMERO, `"tela"` muda só layout |
| `onde` | o arquivo em que a divergência está anotada |
| `fonte` | o texto que a declara, verbatim |
| `afty` / `player` | o que vale de cada lado |
| `ativa` | se o código já desvia |

⚠ **`ativa: false` significa que os DOIS lados usam o ramo `afty`.** É o que faz uma divergência
declarada e ainda não implementada não mentir na tela, e é medido por assert.

### 3. `sufixoDeChave(sistema)`

Todo `localStorage` do Player é isolado do Afty por sufixo (`_afty` / `_player`). Chave nova segue o
molde, sempre. **Nunca escreva uma chave sem sufixo:** ela vaza uma ficha de um lado para o outro.

---

## O QUE FALTA, EM ORDEM DE UTILIDADE

As duas primeiras saem prontas da tabela: são divergências **declaradas, com verbatim, e `ativa:
false`**. O trabalho é ligar cada uma, não descobrir a regra. A terceira é a única que ainda espera
regra do autor.

### 1. `inventarioSimplificado` — o inventário inteiro volta

> *"A aba de inventário da CRIATURA é simplificada, por decisão. O que sair da ficha de criatura
> volta na ficha de jogador, e não está sendo apagado do catálogo, só desligado do motor."*

O catálogo está inteiro em `afty-equipamentos.js`. É a maior das três e a que mais muda a tela.

### 2. `defesaUniforme` — a coluna Defesa da tabela do livro

> *"Na ficha de CRIATURA o campo `defesa` desta tabela NÃO é aplicado: a armadura dá o CUSTO dela de
> Defesa, mais o grau da Ferramenta. O campo fica aqui porque é o texto do livro e volta a valer na
> ficha de jogador."*

`UNIFORME_MODIFICACOES` já tem a coluna. Ligar é um `regraDo` no ponto que soma a Defesa.

### 3. `estiloDasSombras` — a progressão de Técnica de Estilo do livro

Os Feitiços do jogador voltaram à progressão do livro em 2026-08-31, com orçamento **próprio**
(divergência `progressaoDeFeiticos`). O autor confirmou na mesma mensagem que **o Estilo também
volta, e que os dois são separados**, e disse que mandaria o cálculo dele em seguida.

Até chegar, o Estilo segue no contador comum. Quando chegar, o encaixe já está pronto: o
`orcamentoHabilidades` do motor virou uma escada de quatro pilhas, da mais estreita para a mais
larga, e o Estilo precisa da sua entre `vagasEstilo` e `vagasFeitico`, do mesmo jeito que o Feitiço
ganhou a dele.

⚠ **O Sem Técnica ficou de fora da trava de energia amaldiçoada de propósito.** Ele TEM energia, só
não tem técnica, então o portão *"todo usuário de energia amaldiçoada"* que zera o Feitiço do
Restringido não o alcança. Quem decide o número dele é a regra de Estilo.

### 5. As perguntas em aberto

Cada uma tem uma seção própria em `a-fazer.md`. A mais quente é do dia 2026-08-31:

**`periciaAtributo` ainda existe?** O livro dizia *"você pode escolher entre os atributos
Inteligência ou Sabedoria para receber novas perícias. Esta escolha não pode ser modificada nem
revertida após a criação do personagem"*, e o autor depois fixou *"a quantidade de perícias é o
maior modificador de atributo entre Inteligência ou Sabedoria e não só Inteligência"*. O campo ficou
**parado** no schema: ninguém o lê. Se a escolha permanente voltar, ela precisa de **tela** antes de
voltar a decidir número, porque campo sem controle foi exatamente o que produziu o bug (o padrão
`"inteligencia"` valia para toda ficha e a Sabedoria não contava nunca).

---

## AS ARMADILHAS QUE JÁ CUSTARAM CARO

Não são hipóteses. Cada uma virou bug real, e a maioria era **silenciosa**.

### O componente é o mesmo nas três telas

`AbaInvocacoes.jsx` (e as outras abas) renderizam na Ficha do Player, na Ficha do Afty **e no painel
de Encontros**. Toda prop nova que a aba passe a exigir quebra o painel de Encontros, e **assert não
pega**, porque assert não renderiza. Depois de mexer numa aba, abra o Encontro.

### Manutenção pega os dois lados por padrão

Mudança em código compartilhado vale para Afty e Player ao mesmo tempo. **Pergunte antes** de mudar
comportamento que só um dos dois pediu. Se for para valer só de um lado, o lugar é uma divergência
nova na tabela, e não um `if` solto.

### Campo sem tela é bug esperando

`periciaAtributo` nasceu no schema com verbatim atrás dele e **nenhum controle no criador**. O padrão
venceu por dois meses e ninguém viu. Se um campo decide número, ou ele tem tela ou ele não decide
número.

### O `deriveAfty` é a autoridade, não a tela

Uma ficha importada com nível 40 tem de **derivar como 30** (o teto do jogador), e não derivar 40 com
a tela mostrando 30. Todo limite entra no motor.

### O que é sessão nunca mora na criatura

Estado de mesa (invocação em campo, bônus ligado, PV atual) vive na chave de sessão. O autosave do
criador reescreve a criatura inteira e apagaria tudo.

O mesmo vale para efeitos condicionais de Linha de Treinamento. `sessao.treinosAtivos` guarda os
interruptores manuais, como `Cônjuge`, e o `deriveAfty` recebe esse mapa por `opcoes.treinosAtivos`.
O progresso e as escolhas do treino ficam na criatura. O estado ligado na mesa não fica.

---

## COMO VERIFICAR

Nesta ordem, e as três antes de dizer que acabou:

```
npx eslint src/systems/afty/ asserts/
npx vite build
npm run asserts
```

Hoje: **42 arquivos, 2239 asserts.** Um arquivo de assert roda em processo próprio e imprime
`TODOS OS N ASSERTS PASSARAM`.

Para rodar o `deriveAfty` num script solto, o hook de resolução está no topo de qualquer
`asserts/t-*.mjs` (o `register` de três linhas). Copie de lá.

⚠ **Assert não renderiza.** Para mudança de tela, abra o navegador: `/Player`, `/Afty` e o painel de
Encontros, em 1440px e em 390px.

### O assert do clone

Enquanto uma divergência é `ativa: false`, os dois lados têm de dar o **mesmo número**. Há assert
medindo isso. Ao ligar uma, esse assert muda de "iguais" para "diferentes assim", e a mudança é
proposital: escreva o novo valor esperado dos DOIS lados, nunca só do que você mexeu.

---

## AS REGRAS DA CASA

Valem em todo chat, e são as que mais se quebram.

1. **NÃO TOQUE NO GRIMÓRIO 2.5.2.** Tudo em `src/components/` é somente-leitura. Pode importar,
   nunca editar. Se precisar de algo de lá que não dá para importar, copie para
   `src/systems/afty/` e anote de onde veio. Confira ao terminar:
   `git diff --name-only | grep src/components/` volta vazio.
2. **O autor faz os commits.** Nunca rode `git commit` nem `git push`.
3. **Pare e pergunte quando tiver dúvida de regra.** Ele prefere responder a receber suposição.
4. **Texto de regra vem VERBATIM do livro.** Não parafraseie, não resuma, não invente.
5. **Nunca use travessão nem ponto-e-vírgula** em texto que aparece na tela.
6. **Nada de texto explicativo na UI.** Sem hint, sem nota, sem lore, sem fórmula escrita. Só
   resultado e aviso. Explicação de número vai no hover de fontes, explicação de item vai no
   `title`. O criador de fichas calcula, não ensina.
7. **Todo o Afty vive em `src/systems/afty/`**, e só ali.

---

## MAPA RÁPIDO

| Onde | O que mora ali |
|---|---|
| `afty-sistema.js` | `SISTEMAS`, `sistemaDaFicha`, `sufixoDeChave`, `regraDo`, `DIVERGENCIAS` |
| `afty-derive.js` | o motor. Tudo desemboca aqui |
| `afty-pericias.js` | perícias, TR, jogadas de ataque, dano |
| `afty-especializacoes.js` | Classes, pacote inicial, multiclasse |
| `afty-origens.js` | origens, clãs do Herdado, características |
| `afty-invocacoes.js` | shikigamis: graus, ações, características, marcadores |
| `afty-equipamentos.js` | itens, uniformes, encantamentos |
| `afty-addons.js` | a camada de conteúdo da mesa, 14 famílias |
| `ficha/` | a Ficha Final: abas, tema, sessão, rolagens |
| `encontros/` | o painel do mestre, que reusa as abas da Ficha |
| `docs/afty-ficha-final.md` | a tela de jogo, e a seção 24 com as dúvidas vivas |
| `docs/afty-addons.md` | o sistema de Addons, com as decisões do autor datadas |
| `docs/automacao-dsl.md` | a DSL do Motor de Automação |
| `docs/afty-formulas-base.md` | as fórmulas |
