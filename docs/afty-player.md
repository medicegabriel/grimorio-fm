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

Há 35 entradas em `afty-sistema.js`, 34 ativas no código atual. Só `inventarioSimplificado`
permanece com `ativa: false`. **Isto é DADO, e não comentário**, porque comentário envelhece
calado: cada entrada carrega a citação verbatim de onde a divergência está escrita, o que vale de
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

## MULTICLASSE DO JOGADOR

A divergência ativa terceiraClasse permite até **3 Especializações** na Ficha de Player.
A ficha de criatura continua com até **2**, e a Origem Restringido continua com apenas
a sua classe obrigatória nos dois sistemas. A escolha depende de rulesVersion da
ficha, inclusive quando ela aparece em Encontros.

Com três classes, os níveis das duas primeiras são escolhas gravadas. Com duas,
só o da primeira. A última recebe o restante do nível total. Cada classe ativa precisa ter ao menos 1 nível, e os
controles de mais e menos transferem um nível entre as classes. Ao baixar o nível
total, classes que não cabem saem da conta sem apagar a divisão gravada.

## ENTRADA COM TEXTO PRÓPRIO, E ENTRADA QUE O JOGADOR PERDE

Desde 2026-09-17 há dois moldes a mais para conteúdo que difere por sistema:

- **Texto e número próprios, mesmo id** (divergência `melhoriasSuperioresDoJogador`). A entrada
  carrega um bloco `jogador` com nome, descrição e `maxVezes`, lido por `melhoriaNoSistema`, e os
  números ficam num mapa `*_JOGADOR` que troca as linhas do mesmo id. Hoje são quatro Melhorias
  Superiores: a Defesa vira Classe de Armadura, e Classe de Dificuldade, Energia e Movimento voltam
  ao valor fixo.
- **Quem tem, perde** (divergência `perdidoNoJogador`). A marca `perdeNoJogador: true` vai junto do
  `foraDoJogador`, e o `perdidaNoJogador` tira a entrada da ficha resolvida com os efeitos e a vaga.
  É o contrário da `conteudoSoPorAddon`, que deixa quem já tinha ficar. Hoje é só a Versatilidade
  Extrema. O id fica gravado e o Addon `soPorAddon:<id>` devolve.

## TREINOS ESPECIAIS DO JOGADOR

Desde 2026-09-16 (divergências `interludioComTeste` e `tetoDeTreinoEspecial`), a linha do Treino
Especial anota a tentativa. A pega de `treinosEspeciais` é o **Ganho**, e é dela que a vaga sai. Os
**Interlúdios** gastos e os **Sucessos** guardados moram em `treinoEspecialProgresso`, e Interlúdio
é Foco, um para um. A linha mostra a CD pelo Nível.

No jogador a Habilidade para em 2 e o Feitiço não tem teto. Os três números (`sucessosNecessarios`,
`cdTeste` e `tetoJogador`) são campos do catálogo, então um Treino Especial de Addon que os declare
ganha a mesma linha.

⚠ **Interlúdios nunca ficam abaixo de `Ganhos × focos`.** A ficha de jogador de antes dessa data tem
pegas e nenhum Interlúdio anotado, e é o piso que impede os Focos daquelas pegas de voltarem ao
orçamento calados.

## O QUE FALTA, EM ORDEM DE UTILIDADE

`inventarioSimplificado` é a única divergência declarada com `ativa: false`. O Estilo das
Sombras ainda espera o cálculo do autor antes de virar uma nova divergência. As demais perguntas
continuam registradas em `a-fazer.md`.

### 1. `inventarioSimplificado` — o inventário inteiro volta

> *"A aba de inventário da CRIATURA é simplificada, por decisão. O que sair da ficha de criatura
> volta na ficha de jogador, e não está sendo apagado do catálogo, só desligado do motor."*

O catálogo está inteiro em `afty-equipamentos.js`. É a divergência pendente que mais muda a tela.

### 2. `estiloDasSombras`: a progressão de Técnica de Estilo do livro

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

### 3. As perguntas em aberto

As dúvidas ainda abertas estão em `a-fazer.md`. O campo legado `periciaAtributo` continua
no schema, mas ninguém o lê para calcular vagas. A regra confirmada pelo autor usa o maior
modificador entre Inteligência e Sabedoria. Só retome a escolha permanente se houver uma nova
decisão de regra e um controle na tela; o valor padrão antigo fazia a Sabedoria não contar.

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

### "Ficha de Player" é o sistema inteiro, e não uma tela

É o `label` do sistema em `SISTEMAS`. Um pedido que diz "na Ficha de Player" vale para toda tela que
mostra ficha de jogador: o criador, a Ficha Final e a lista do Encontro. Em 2026-09-10 o "ND" virou
"Nível" em QUATRO lugares (`rotuloDoNivel`), e só um deles era o da captura que o autor mandou.

### Campo sem tela é bug esperando

`periciaAtributo` nasceu no schema com verbatim atrás dele e **nenhum controle no criador**. O padrão
venceu por dois meses e ninguém viu. Se um campo decide número, ou ele tem tela ou ele não decide
número.

### O `deriveAfty` é a autoridade, não a tela

Uma ficha importada com nível 40 tem de **derivar como 30** (o teto do jogador), e não derivar 40 com
a tela mostrando 30. Todo limite entra no motor.

### O pool exclusivo não é o mesmo nos dois lados

Desde 2026-09-11 (divergência `poolExclusivo`), o jogador disputa em GRUPOS: Feitiços, Estilo,
Funcionamento Básico e a Segunda Habilidade Única num grupo, e a primeira Habilidade Única noutro,
que soma com o primeiro. A criatura segue no pool único. Família nova do pool nasce com
`grupoJogador` em `FAMILIAS_EXCLUSIVAS`, e há assert exigindo. Sem ele, ela disputaria só consigo
mesma no jogador e somaria por cima de tudo, calada.

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

Em 2026-09-17: **99 arquivos, 5365 asserts** passando, e o `t-invocacoes-motor.mjs` vermelho à
espera da decisão sobre a cota base de Invocação (ver `a-fazer.md`). Um arquivo de assert roda em processo próprio e imprime
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

1. **PRESERVE O GRIMÓRIO 2.5.2.** Evite mudar `src/components/` e mantenha o comportamento
   público. O `Dashboard.jsx` já recebe opções do Player sem alterar os padrões da 2.5.2.
   A regra definitiva para essas exceções continua pendente em `a-fazer.md`.
2. **O autor faz os commits.** Nunca rode `git commit` nem `git push`.
3. **Pare e pergunte quando tiver dúvida de regra.** Ele prefere responder a receber suposição.
4. **Texto de regra vem VERBATIM do livro.** Não parafraseie, não resuma, não invente.
5. **Siga `AGENTS.md` para toda escrita da IA.** Na interface, também não use ponto-e-vírgula.
6. **Nada de texto explicativo na UI.** Sem hint, sem nota, sem lore, sem fórmula escrita. Só
   resultado e aviso. Explicação de número vai no hover de fontes, explicação de item vai no
   `title`. O criador de fichas calcula, não ensina.
7. **O motor e as telas próprias do Afty vivem em `src/systems/afty/`.** A integração de rotas fica em `src/App.jsx`; componentes compartilhados permanecem em `src/components/`.

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
| `afty-addons.js` | a camada de conteúdo da mesa, 15 famílias |
| `ficha/` | a Ficha Final: abas, tema, sessão, rolagens |
| `encontros/` | o painel do mestre, que reusa as abas da Ficha |
| `docs/afty-ficha-final.md` | a tela de jogo, e a seção 24 com as dúvidas vivas |
| `docs/afty-addons.md` | o sistema de Addons, com as decisões do autor datadas |
| `docs/automacao-dsl.md` | a DSL do Motor de Automação |
| `docs/afty-formulas-base.md` | as fórmulas |
