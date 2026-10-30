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

Na entrada do G00 em 2026-10-05 há 38 entradas em `afty-sistema.js`, 37 ativas no código atual. Só `inventarioSimplificado`
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

## PROGRESSÃO DE FEITIÇOS DO JOGADOR

O orçamento próprio de Feitiços usa `totalFeiticosJogador` (divergência
`progressaoDeFeiticos`). O jogador começa com dois Feitiços. A regra padrão soma
`piso(n / 2)`, pelos níveis pares. Com Conjuração Aprimorada soma `n - 1`, um
Feitiço por subida de nível a partir do nível 2. Nos dois casos, os níveis 10 e 20
concedem um Feitiço adicional cada.

O autor confirmou `n - 1` em 2026-10-03. Um Conjurador começa com dois Feitiços
no nível 1 e chega a 33 no nível 30. A função devolve `total` e `partes` para
mostrar a origem do orçamento.

## MULTICLASSE DO JOGADOR

A divergência ativa terceiraClasse permite até **3 Especializações** na Ficha de Player.
A ficha de criatura permite até **2** no ND 1 a 30 e até **3** no ND 31+
(decisão do autor em 2026-10-04). A Origem Restringido continua com apenas
a sua classe obrigatória nos dois sistemas. A escolha depende de rulesVersion e do
nível efetivo da ficha, inclusive quando ela aparece em Encontros.

Com três classes, os níveis das duas primeiras são escolhas gravadas. Com duas,
só o da primeira. A última recebe o restante do nível total. Cada classe ativa precisa ter ao menos 1 nível, e os
controles de mais e menos transferem um nível entre as classes. Ao baixar o nível
total, classes que não cabem saem da conta sem apagar a divisão gravada. Na criatura,
baixar de ND 31 para 30 também retira a terceira classe da conta, e subir novamente
restaura a divisão gravada.

**O requisito de atributo da Multiclasse (2026-10-07, divergência `requisitoMulticlasse`).** O livro,
página 47: *"Para o fazer, você deve atender os requisitos para Multiclasse especificados nas
características da outra especialização que deseja."* O catálogo sempre declarou o requisito
(`caracteristicas.multiclasse`: FOR ou DES 16 no Lutador e no Combatente, INT ou SAB 16 no
Conjurador, PRE ou SAB 16 no Suporte e no Controlador) e ninguém o lia. Na ficha de jogador:

- o chip da Especialização nova fica desligado no criador enquanto nenhum dos atributos do requisito
  chega ao valor, com o motivo no hover ("Requisito de Multiclasse (INT ou SAB 16)");
- conta o atributo PERMANENTE, como em todo pré-requisito: um bônus temporário não abre a classe;
- a classe inicial (a primeira da lista) não paga requisito nenhum;
- a ficha que já tem a multiclasse sem o requisito (importada, ou que perdeu o atributo) recebe aviso
  âmbar e continua com as classes e os níveis. `derived.especializacoes.semRequisito` lista o que
  falta.

Na criatura nada muda: se o requisito vale lá é pergunta ao autor em docs/a-fazer.md.
Funções: `faltaRequisitoMulticlasse` e `multiclassesSemRequisito` (afty-especializacoes.js). Assert:
`t-revisao-p01.mjs`.

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

## O TR DA CLASSE E O TESTE DE RESISTÊNCIA MESTRE

Desde 2026-09-23 (divergência `trMestreDoJogador`), e decidido pelo autor na revisão do Especialista
em Combate:

- **O TR da Classe é escolhido e gravado** (`ficha.trDaClasse`). Quem tem "um Teste de Resistência
  entre Fortitude ou Reflexos" escolhe uma vez, na aba Perícias, e o TR chega treinado pela Classe,
  do mesmo jeito que os dois do Restringido sempre chegaram. Até aqui o jogador o marcava à mão, e o
  livro diz em caixa alta que TR é "RECEBIDO POR ESPECIALIZAÇÃO". A marcação à mão segue existindo e
  vale a maior das duas.
- **A marcação à mão sem fonte vira aviso** (autor, 2026-09-24: *"Avisar em âmbar"*). O TR que a
  marcação sobe acima do que a Classe (pacote, Mestre e Segundo TR) e o Motor (Talento, Treinamento,
  Addon) dão sai com `semFonte` do `resolveTestes`, e a linha do criador mostra "Sem Fonte" em âmbar.
  Nada é tirado de ninguém, e marcar o que uma fonte já dá não acusa. Quem decide é a mesma
  divergência `trForaDoOrcamento` ("NÃO PODEM SER ESCOLHIDOS DE FORMA LIVRE"), então na criatura o
  campo é sempre falso.
- **Um Addon põe o TR no Limite de Perícias** (2026-10-25, `addons/tr-no-limite-de-pericias.json`, verbo
  `regrasAfty.trNoLimiteDePericias`). Com ele o jogador escolhe TR na aba e gasta vaga (Treinado 1,
  Mestre 2), o "Sem Fonte" some, o contador aparece também no card de Testes de Resistência, e o TR
  concedido pela Classe, Talento, Treino ou Habilidade entra como vaga gasta e sobe o total na mesma
  medida. Detalhes em `docs/afty-addons.md`.
- **O "caso já seja" de TR conta a Classe, e não a marcação à mão** (2026-09-26, canal
  `proficienciaTRCasoJa`, do Treino de Testes de Resistência). Um Combatente com a Fortitude da
  Classe que faz a 1ª etapa na Fortitude ganha +1, e no nível 9 (Mestre pela Classe) a 2ª etapa vira
  +2. Marcar à mão por cima do treino não compra o +1, pela mesma divergência. Ver
  `docs/automacao-dsl.md`.
- **No nível 9 REAL da Classe inicial** (Base de Classe), o TR da Classe vira Mestre e aparece a
  escolha do **Segundo TR** (`ficha.trSegundo`, treinado), que não pode ser o da Classe e só é pedido
  depois dele. O Restringido fica Mestre nos dois e não tem segundo ("mestre nos dois Testes de
  Resistência conferidos por sua Especialização").
- **Só a Classe inicial.** Ela é a única que concede TR (`pacoteDaClasseInicial`), então é a única que
  tem "o concedido pela sua especialização" para subir. A segunda classe no nível 9 não ganha nada de TR.
- O dado mora em `caracteristicas.resistencias.mestre = { nivel, segundo }`, e quem resolve é
  `resistenciasDaClasse` (`afty-especializacoes.js`). O `resolveTestes` lê as faixas de lá. Na
  criatura nada disto existe: a habilidade saiu das seis classes em 2026-07-27 e continua fora do
  catálogo de Habilidades.

## O TREINO DE EQUIPAMENTO É SÓ DA CLASSE INICIAL

Desde 2026-09-23 (divergência `treinoDaClasseInicial`, confirmada pelo autor: *"Só a classe inicial
treina"*). O livro, nas regras de Multiclasse: *"Ao obter uma nova especialização, você não recebe
novos treinamentos em perícias nem equipamentos."* O pacote de perícias e de TR já seguia isso, e o
treino de arma e escudo juntava todas as classes. Agora o `treinamentosEquipamento` e o
`treinoEscudo` do jogador leem só a primeira classe da lista.

- Um Suporte que multiclassa para Combatente continua treinado só nas Armas Simples. A Espada Longa
  (Complexa) segue utilizável e não soma o Bônus de Treinamento.
- O Golpes Potentes (*"arma com a qual você seja treinado"*) mira o escopo `treinada`, então ele não
  pega nessa Espada Longa.
- Na criatura o treino continua juntando o catálogo das classes (autor: *"O catálogo das classes"*).

## O DANO DA ARMA NO ACERTO AMALDIÇOADO

Desde 2026-10-02 (divergência `danoDoAcertoAmaldicoado`). Autor: *"Isso é somente na Ficha de
Criatura. Quando uma arma usa o Acerto Amaldiçoado, ela também usa o Atributo de Técnica para o
Dano."* Nos dois sistemas a arma no Acerto Amaldiçoado acerta pelo Atributo de Técnica. O dano é
que se separa:

- **Criatura:** o dano usa o mesmo atributo do acerto, lido da linha do Ataque Amaldiçoado.
- **Jogador:** o dano segue o atributo da arma (Força, Destreza ou o maior pela Fineza).
- Nos dois, a ordem de quem troca o atributo é: o atributo próprio da arma criada, depois as
  Técnicas de Combate, e só então o Acerto Amaldiçoado.

## TREINOS ESPECIAIS DO JOGADOR

Desde 2026-09-16 (divergências `interludioComTeste` e `tetoDeTreinoEspecial`), a linha do Treino
Especial anota a tentativa. A pega de `treinosEspeciais` é o **Ganho**, e é dela que a vaga sai. Os
**Interlúdios** gastos e os **Sucessos** guardados moram em `treinoEspecialProgresso`, e Interlúdio
é Foco, um para um. A linha mostra a CD pelo Nível.

O **Treinamento para Aptidão** (`tes_aptidao`, autor, 2026-10-04) segue os mesmos parâmetros
da Habilidade: 1 Foco por Interlúdio, quatro testes com três sucessos e CD 12 + metade do Nível.
Cada Ganho concede uma vaga de Aptidão Amaldiçoada (`vagasAptidao`), sem conceder Nível de Aptidão
nem vaga de Habilidade. A escolha da Aptidão continua na aba Aptidões, com seus pré-requisitos.

No jogador a Habilidade e a Aptidão têm tetos separados: 1 até o nível 9 e 2 do nível 10 em diante.
Na criatura cada uma segue `1 + piso(ND / 10)`, com sucesso automático e 1 Foco por pega.
O Feitiço não tem teto no jogador. Os três números (`sucessosNecessarios`,
`cdTeste` e `tetoJogador`) são campos do catálogo, então um Treino Especial de Addon que os declare
ganha a mesma linha.

⚠ **Interlúdios nunca ficam abaixo de `Ganhos × focos`.** A ficha de jogador de antes dessa data tem
pegas e nenhum Interlúdio anotado, e é o piso que impede os Focos daquelas pegas de voltarem ao
orçamento calados.

## O DESENVOLVIMENTO INESPERADO DO DERIVADO

Desde 2026-10-01 (divergência `desenvolvimentoNoNivel`, decidida pelo autor por pergunta com
opções, depois do relato de que o jogador Derivado "considera como se fosse Inato"). O texto da
origem: *"A cada quatro níveis, recebe um ponto de atributo adicional e aumenta em 1 o limite do
atributo escolhido."*

- **O ponto entra no contador de Pontos de Nível**, livre, como os de nível. O derive devolve
  `attrNivelExtra` (1 no nível 4, 2 no 8, até 5 no 20) e o `resumoAtributos` soma no total. O
  Derivado de nível 8 mostra "Pontos de nível 0 / 6", e o Inato segue 0 / 4.
- **O quadro Desenvolvimento Inesperado sobe só o limite**, +1 por escolha, em qualquer atributo.
  Na criatura ele continua subindo valor e limite do mesmo atributo.
- **A ficha salva não migra.** O mapa `core.origem.desenvolvimento` é o mesmo, e no jogador ele é lido
  como a escolha de limite: o limite fica onde estava, e o +1 de valor volta como ponto livre no
  contador.

## O QUE FALTA, EM ORDEM DE UTILIDADE

`inventarioSimplificado` é a única divergência declarada com `ativa: false`. As demais perguntas
continuam registradas em `a-fazer.md`.

### 1. `inventarioSimplificado` — o inventário inteiro volta

> *"A aba de inventário da CRIATURA é simplificada, por decisão. O que sair da ficha de criatura
> volta na ficha de jogador, e não está sendo apagado do catálogo, só desligado do motor."*

O catálogo está inteiro em `afty-equipamentos.js`. É a divergência pendente que mais muda a tela.

### 2. O Estilo das Sombras: era igual nos dois sistemas, e virou divergência em 2026-10-26

O cálculo chegou com a *Expansão do Novo Estilo das Sombras*: as Técnicas da Expansão têm progressão
**própria** (2 no Nível 4 e +1 em 7, 10, 13, 16 e 19), que não gasta o contador de Habilidades. Até
2026-10-04 isso era **igual nos dois sistemas**. O autor mudou em 2026-10-26: só o **personagem** tem a progressão
própria. Na **criatura** as Técnicas da Expansão gastam o contador comum de habilidades, e o estouro só deixa o
contador vermelho, sem invalidar nada. É a divergência `progressaoDoEstilo`. A vaga exclusiva `vagasEstilo` soma em
cima da progressão, e o que sobrar dela segue para as Técnicas `legacy`, que continuam no contador
comum como antes. A Técnica Marcial do Restringido segue o mesmo desenho (`progressaoDeTecnicasMarciais`, ver
`docs/afty-tecnicas-marciais.md`). Ver `docs/afty-estilo-sombras.md`.

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

1. **PRESERVE O GRIMÓRIO 2.5.2.** `src/components/` é somente-leitura, salvo as exceções listadas
   em `AGENTS.md`. Exceção nova só entra com o autor consultado antes, numa das três formas de lá,
   e entra na lista no mesmo dia.
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

## Progressão Épica e Alto Nível Afty por Addon (2026-10-05)

Os pacotes player-progressao-epica e player-alto-nivel-afty permitem a conversão do Gojo para Player.
Nível acima de 30, Aptidão a cada dois níveis depois de 20, 52 Interlúdios no nível 35 e Ápice no 26.
As regras padrão de Player continuam valendo nas fichas sem esses pacotes. Instruções, valores e
limites estão em [afty-player-progressao-epica.md](afty-player-progressao-epica.md).

Desde 2026-10-29 essas regras, mais Regras Grimorio, Ascendendo Além dos Céus, Alma do Afty e as demais da mesa do
autor, também vêm reunidas no pacote embutido Guerra de Feiticeiros, que serve Player e criatura, se atualiza sozinho
e troca o "1 Nível de Aptidão a cada 2 níveis depois do 20" por **1 por avanço de Bônus de Treinamento acima de 6**
(`aptidaoPorAvancoDeBt`: 21, 26, 31, 36, 41...). Ver `docs/afty-addons.md`.
