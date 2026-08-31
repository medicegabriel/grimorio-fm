# Addons do Afty (plano)

Plano do sistema de **Addons**, a camada em que cada mesa acrescenta conteúdo próprio ao Grimório do
Afty sem abrir o GitHub e sem virar regra de todo mundo. Escrito em 2026-08-20, antes de qualquer
código. Leia junto com `afty-status.md` (estado do sistema), `automacao-dsl.md` (o DSL) e
`afty-formulas-base.md` (as fórmulas).

> O site serve o **raw** do sistema, e isso não muda. O Addon é uma camada declarada por cima:
> sempre visível, sempre removível, e a ficha sabe dizer quais números vieram dela.

---

## ONDE ESTAMOS (2026-08-28)

**Fase 0 com três primitivas fechadas e fase 1 no ar.** O caminho inteiro do Addon funciona de
ponta a ponta: colar o JSON, ligar na criatura, o número mudar na Ficha, desinstalar sem deixar
resto. A primitiva de vínculo entre criaturas continua travada em decisão do autor.

| Primitiva | Estado | Onde |
|---|---|---|
| 8.1 `contar()` por marca | **Feita** | `afty-dsl.js` (novo), `marcasDeEntradas` em `afty-efeitos.js` |
| 8.2 Canal `hpAtributo` | **Feita** | `afty-efeitos.js` e o PV do `afty-derive.js` |
| 8.3 Concessão vinda da sessão | **Feita** | `afty-concessao.js`, Ficha Final e Encontro |
| 8.3.1 Ciclo de Adaptação | **Feita** | `afty-adaptacao.js`, `ficha/PainelDeAdaptacao.jsx` |
| 8.4 Vínculo entre criaturas | **Travada** | 4 perguntas no `a-fazer.md`, ver a seção 8.4 |

**Fase 1 FECHADA**, enquanto a primitiva travada espera resposta. O caminho inteiro está
de pé e testado, de colar o JSON até o número mudar na Ficha, em **14 famílias**.

| Peça da fase 1 | Estado | Onde |
|---|---|---|
| Registro de famílias | **Feita** | `afty-addons.js` (novo) |
| Pacote, namespace e validação | **Feita** | `afty-addons.js` |
| Reconstrução do mundo | **Feita** | `aplicarAddons`, sempre do zero |
| Biblioteca (`fm_addons_afty_v1`) | **Feita** | `afty-addons-biblioteca.js` (novo) |
| `creature.addons` | **Feita** | `afty-schema.js` |
| Aba Addons, colar JSON | **Feita** | `AftyTabAddons.jsx` (novo) |
| Addons entrando antes da derivação | **Feita** | builder, Ficha e Encontro |
| União para o Encontro misto | **Feita** | `unirAddons` |
| Marca de "não raw" | **Feita** | chip no cabeçalho da Ficha |
| Linha morta e marcada | **Feita** | `problemasDeAddon`, `derived.addonProblemas` |
| **Famílias ligadas** | **14** | ver o quadro abaixo |

### As 14 famílias

| Família | Módulo | Estruturas que o religador refaz |
|---|---|---|
| `habilidades` | `afty-habilidades.js` | array, pool do Roubo de Habilidade, índice |
| `talentos` | `afty-talentos.js` | array, índice |
| `aptidoes` | `afty-aptidoes.js` | array, índice |
| `especializacoes` | `afty-especializacoes.js` | array, índice |
| `origens` | `afty-origens.js` | catálogo, **lista do seletor**, índice |
| `treinamentos` | `afty-treinamentos.js` | array, índice |
| `treinosEspeciais` | `afty-treinos-especiais.js` | array, índice |
| `melhoriasSuperiores` | `afty-alto-nivel.js` | array, índice |
| `lendarias` | `afty-alto-nivel.js` | array, índice |
| `apices` | `afty-alto-nivel.js` | array, índice |
| `tiposDano` | `afty-equipamentos.js` | objeto, **`TIPO_DANO_OK`** |
| `condicoes` | `afty-feiticos.js` | mapa de listas de nomes |
| `clas` | `afty-origens.js` | array **no lugar**, `CLA_BY_ID`, **cache das Verdadeiras Origens** |
| `marcadores` | `afty-habilidades.js` | array no lugar |

⚠ **As duas últimas entraram em 2026-08-31, com a Estrela dos Zenin**, e as duas nasceram de um "não
cabe": um clã do Herdado só entraria por `substitui` no campo `clas`, o que obrigaria o addon a
carregar uma cópia congelada dos quatro clãs do livro; e "uma quantidade de Shikigamis igual a
metade do seu Bônus de Treinamento" não tem canal, porque o que ela guarda é o QUAIS.

⚠ **`clas` religa TRÊS estruturas**, e é a família com mais armadilha até hoje. O `splice` no array
é obrigatório (a entrada `herdado` aponta para ele em `clas: CLAS_HERDADO`, e trocar a referência a
deixaria com a lista velha), e o cache das Verdadeiras Origens tem de morrer junto pelo mesmo motivo
que ele morre na família `origens`.

⚠ **`marcadores` trouxe `requerId`.** Um marcador do raw pertence sempre a uma Habilidade de
Controlador, e cobrar `habilidadeId` de um marcador de clã seria fingir uma habilidade que não
existe. `requerId` é liberado por qualquer id que a ficha tenha: origem, clã, talento ou habilidade.

Elas cobrem os **seis exemplos de homebrew que o autor deu**: Tipo de Dano, Condição,
Especialização, Aptidão, Treino e mudar coisa existente (esta última só quando a fase 3 chegar).

As duas últimas são **TABELA e não catálogo**: `TIPOS_DANO` é um objeto `chave -> rótulo` e
`CONDICOES_CATALOGO` é um mapa de listas de NOMES. Elas provam que a mesma `registrarFamilia` serve
para as duas formas, e cada uma trouxe uma lição:

| Tabela | O que ela ensinou |
|---|---|
| Tipo de Dano | tinha uma **segunda** estrutura derivada, o `TIPO_DANO_OK`, que sanea arma custom. Sem religar o `Set`, um tipo de addon apareceria na lista e seria rejeitado calado ao gravar a arma |
| Condição | é gravada no Feitiço **pelo NOME**, não por id. Então o namespace vale só para o `id` da entrada, e o nome entra limpo. Prefixar poria "minha-mesa:Congelado" na tela |

⚠ Consequência assumida na Condição: **não há linha morta para ela.** Sem id na ficha não dá para
saber que um nome veio de um addon que sumiu, e o Feitiço continua com o nome escrito. É honesto:
condição é rótulo, e rótulo que perde a fonte continua sendo rótulo.

Ligar uma família é a `registrarFamilia` do módulo dela. O trabalho real é o **religador** que
conhece as estruturas derivadas daquele módulo, e ele é o único lugar onde dá para errar: esquecer
uma estrutura dá bug calado. A maioria tem só o índice, e as três exceções estão marcadas em negrito
no quadro acima.

⚠ **Um achado ao ligar o Treino Especial:** o validador dele cobrava a convenção de id `tes_`, e
o id de addon vem com o namespace na frente (`minha-mesa:tes_novo`), então ele reprovava TODO Treino
Especial de addon. Era a única checagem de convenção de id do sistema, e agora ela olha o id sem o
namespace. Vale a lição para as próximas: **validador que olha o FORMATO do id precisa de
`partirId`**.

| # | Fase | Estado | O que entrega | Seção |
|---|---|---|---|---|
| 0 | As 4 primitivas | **2 de 4** | o que falta no MOTOR para os casos reais do autor caberem | 8 |
| 1 | Acrescentar por JSON | **Feita** (12 famílias) | registro, namespace, addon dentro da criatura, marca, linha morta | 3 a 7, 9 |
| 2 | Oficina | Condicional | a tela de autoria, para quem não escreve JSON | 11 |
| 3 | Remendar e desligar | Condicional | mexer no raw | 11 |
| 4 | Tabelas | Condicional | Graus novos, Patamares novos, coeficientes | 11 |
| 5 | Função | Condicional | o escape hatch em JavaScript | 11 |

As fases 2 a 5 estão **adiadas por análise de custo, não recusadas**. O autor pediu remendo e
desligamento na resposta 1 de 2026-08-19, e aprovou adiá-los em 2026-08-20. Ver a seção 11.

---

## 0. As decisões do autor (2026-08-19 e 2026-08-20)

Todas vieram por pergunta direta. Não re-decidir sem falar com ele.

| # | Pergunta | Resposta |
|---|---|---|
| 1 | Addon acrescenta só, ou também remenda e desliga o raw? | **Acrescenta, remenda e desliga.** |
| 2 | Escopo do que ele pode tocar? | **Generalista.** "É para ser algo mais aberto, pois o sistema é MUITO ABERTO em termo de conteudo Homebrew." |
| 3 | Encontro com criaturas de addons diferentes? | **Permitir.** "Nem sempre é mudança geral de sistema, pode ser mudança mínima em uma única criatura." |
| 4 | Pedaço de addon que não roda? | **Linha morta e marcada**, com indicativo para descobrir o problema. Ficha salva sempre abre. |
| 5 | Quem pode escrever DSL? | **Quase uma linguagem.** O autor conhece o risco e aceita: "vai ser usado por um escopo pequeno de pessoas de confiança." |
| 6 | Copiar o avaliador do `fm-dsl.js` para o lado do Afty? | **Pode.** Destrava crescer a linguagem sem tocar no 2.5.2. |
| 7 | Ordem de construção? | As 4 primitivas, depois acrescentar por JSON, depois **parar e ver se aparece alguém escrevendo addon**. |
| 8 | A pasta `asserts/` fica? | **Fica, com script.** `npm run asserts`. |
| 9 | Concessão de combate (8.3) | **Ficha Final e Encontro**, **de graça**, e **morre com a sessão**. Detalhe na 8.3. |
| 10 | Vínculo entre criaturas (8.4) | **Uma barra só**, dano 1 para 1 no pool, e só PV, PE e PV temporário somam. Detalhe na 8.4. |
| 11 | Quem destrava o Estilo das Sombras? | **Ter o addon.** A criatura em que o addon está ativado destrava, sem gastar vaga. |
| 12 | O Domínio Simples vem junto? | **Não**, o personagem compra. |
| 13 | O piso de Nível 4 do Estilo cai? | **Não**, continua valendo. |
| 14 | O Gêmeo copia UMA ou as DUAS do Sem Técnica? | **Uma**, com as duas na lista de opções. |
| 15 | Sem o addon, a escolha copiada? | **Some da ficha**, sem marca de linha morta. |
| 16 | Estudo Amaldiçoado e Noção e Preparação já existem no raw com outros números. Corrigir o livro? | **Não. Só pelo Addon**, com remendo. O raw fica como está. |
| 17 | Quem tem o addon alcança o Treino e os Talentos exclusivos do Sem Técnica? | **Sim, o Addon abre tudo.** Virou a liberação `qualificaSemTecnica`. |
| 18 | "Uma Técnica de Estilo adicional" gasta qual contador? | **Vaga exclusiva de Estilo**, canal novo. Feitiço não pode gastá-la. |
| 19 | O Completo do Treino ("o dobro do Nível de Domínio") soma ou substitui? | **Soma outro Nível de Domínio.** Outras fontes continuam contando por cima. |
| 20 | O que faz a criatura seguir as regras de Maldição? | **Copiar da Maldição em Verdadeiras Origens**, e não ter o Addon. |
| 21 | A Natureza Amaldiçoada copiada traz os números dela? | **Traz tudo**: as vagas de Aptidão e o +1 PE por nível. |
| 22 | As duas características de Maldição disparam a regra? | **As duas.** Existência Metafísica também diz que a criatura É uma maldição. |
| 23 | A Linha de Treinamento de Energia Reversa some junto? | **Some**, como na Maldição de verdade. O Foco preso nela volta. |

⚠ **O nome "Poderes da Tormenta" é contexto narrativo da mesa dele, e não um sistema.** O autor
pediu nome generalista: neste doc o padrão se chama **família marcada por tag**.

---

## 1. A tese

### Addon é DADO, e o motor ganha o VERBO

Duas frases seguram o sistema inteiro.

**Um addon pode tudo que o Motor já sabe dizer, e nada além.** Quando alguém bate no muro, a
resposta é canal novo, variável nova ou primitiva nova, que entra no MOTOR e serve ao raw também. O
muro é a fila de trabalho, não a desculpa.

**Addon nunca ganha verbo escondido.** Verbo (o mecanismo genérico) entra no motor. Substantivo (o
conteúdo da mesa) fica no addon. É a mesma diretriz de 2026-07-27 já escrita no cabeçalho do
`afty-efeitos.js`, agora valendo para o homebrew.

Consequência prática: o *Ciclo de Adaptação* do Mahoraga e a família marcada por tag ficam no addon
do autor, e ninguém mais vê. O que virou código do site foi conceder-da-sessão e `contar()`, que são
genéricos e não custam nada a quem não usa.

### Por que dado, e não JavaScript

O autor pediu código e aceitou o risco, e mesmo assim o código saiu da primeira fase. O motivo não é
segurança, é que ele **não resolve os casos**:

- Sem backend, addon viaja como arquivo entre estranhos. JS de terceiro tem acesso ao `localStorage`
  inteiro: todas as criaturas, todos os encontros, todos os temas.
- Dos quatro casos mais extremos que o autor já tentou fazer (seção 8), **zero** são destravados por
  ele. Três pedem primitiva, e o quarto pede dado que a derivação não tem.
- Dado valida. Os 13 `validarCatalogo*` já existem e já são o portão de aceitação.

⚠ Quando a fase 5 chegar, ela vem com estes fatos registrados: sandbox de verdade (Worker, iframe)
é ASSÍNCRONO e `deriveAfty` é síncrona, então sandbox real custaria reescrever o motor. O que dá
para fazer barato (`new Function` com os globais sombreados) é obstáculo, **não é parede**. E laço
infinito em código síncrono trava a aba sem recuperação, o que sugere proibir `while` e `for` e
deixar só expressão e `map`/`filter`/`reduce`, que sempre terminam.

---

## 2. O que já existe e vira fundação

O sistema está mais perto disso do que parece. O Motor de Automação **já é** uma linguagem de
extensão, só que hoje tem uma porta de entrada só (`core.tecnicaEfeitos`).

| Peça | Onde | O que já resolve |
|---|---|---|
| Linguagem de efeito | `EFEITO_CANAIS`, 61 canais, 29 com alvo | como o addon diz "+3 de Defesa quando o ND passa de 10" |
| Editor de efeito | `TecnicaMotorEditor` (AftyCreatureBuilder.jsx) | a tela de autoria, com seletor `{ }` e valor ao vivo |
| Prova de conceito | `core.tecnicaEfeitos` | o único lugar onde efeito já é ESCRITO e não escolhido |
| Portão de aceitação | os 13 `validarCatalogo*` | recusar addon quebrado antes de entrar na ficha |
| Forma do catálogo | `{id, nome, descricao}` + `BY_ID` + acessor | as famílias têm o mesmo esqueleto, então uma forma de addon serve para todas |
| Concessão por nome | `concedeAptidoes`, `concedeEscolha`, Bases da Especialização | conceder entrada de catálogo já é mecanismo do motor, só que estático |
| Sobreposição de sessão | `deriveAfty({ ...creature, combate: sessao.combate })` | o caminho pronto para a sessão mexer na criatura sem sujar a ficha |
| Rastro | `PainelDeFontes` | número de addon aparece com a origem nomeada, de graça |
| Precedente de posse | `ficha/ficha-tema.js` | camadas do fácil ao livre, teto que avisa sem bloquear, artefato morando DENTRO da criatura |

⚠ **"Generalista" não quer dizer "deixar programar", quer dizer abrir TODA tabela.** São 209
constantes de catálogo exportadas no Afty. O trabalho é declarar cada uma extensível pelo mesmo
caminho, em vez de tratar Habilidade como caso especial.

---

## 3. As três camadas

O encontro misto (decisão 3) parte o addon em duas metades com regras diferentes.

**Acrescentar é global e inofensivo.** Todo id nasce prefixado, então a união dos addons de todas as
criaturas carregadas nunca colide. Criatura que não usa aquele id simplesmente não o referencia.

**Remendar e desligar são por criatura.** Se o addon de uma ficha desliga *Corpo Treinado* e a
criatura do vizinho no mesmo encontro usa *Corpo Treinado*, aplicar isso globalmente quebraria a
ficha dele. Então remendo e desligamento **não podem mexer no catálogo base**: são camada de leitura
consultada na hora de resolver.

| Camada | O que é | Vive |
|---|---|---|
| **Mundo** | catálogo raw + os acréscimos de TODOS os addons carregados | módulo, reconstruído quando o conjunto muda |
| **Camada da criatura** | remendos e desligamentos daquela ficha | dentro da criatura |
| **Escopo** | a camada da criatura ativa durante uma derivação | aberto e fechado em volta do `deriveAfty` |

### O escopo, e por que ele é barato

`deriveAfty` é síncrona, tem 8 pontos de chamada, e JavaScript não interleava. Então um escopo de
módulo aberto no começo da derivação e fechado no fim dá remendo por criatura **sem passar registro
por 209 constantes**. É o mesmo truque do dispatcher do React.

```js
// afty-registro.js
export function comEscopo(camada, fn) {
  const anterior = escopoAtual;
  escopoAtual = camada;
  try { return fn(); } finally { escopoAtual = anterior; }
}
```

⚠ Quem lê catálogo FORA de uma derivação (as listas do builder) precisa do escopo também. O builder
edita exatamente uma criatura, então um escopo no topo do render cobre.

### Duas armadilhas já nomeadas, e como cada uma foi resolvida

1. **Memo que não recalcula quando o addon muda.** No builder, na Ficha e no Encontro a solução foi
   a ORDEM, e não o contador: o `aplicarAddons` roda DENTRO do mesmo memo do `deriveAfty`, antes
   dele. Num `useEffect` rodaria depois do render, e a primeira derivação sairia com o catálogo
   velho.
2. **Dois addons remendando a mesma linha.** O painel de fontes tem de dizer qual venceu. A ordem é
   declarada e o conflito é RELATADO, nunca bloqueado (decisão 3). Só vale na fase 3.

⚠ **A ÉPOCA (`epocaAddons`) continua existindo, e ela é a chave do cache do Encontro.** Lá o
`derivarComCache` guarda o derivado por ficha, e sem a época na chave um combatente derivado sob uma
união menor seria devolvido do cache depois de a união crescer. Hoje isso quase nunca muda o número,
porque addon só ACRESCENTA e todo id é prefixado, mas **essa é uma invariante da fase 1, e a fase 3 a
quebra**: lá, um addon que entra no encontro pode mudar o número de quem já estava.

### ⚠ A entrada é CLONADA ao entrar no mundo

O pacote que está em `creature.addons` é o mesmo objeto que alimenta o catálogo, e o espalhamento do
`prefixarEntrada` é raso: `escolha`, `requisitos` e afins ficavam sendo a MESMA referência dos dois
lados. Como o sistema muta entrada de catálogo em pelo menos um lugar
(`dona.escolha.opcoes = HABILIDADES_ROUBAVEIS`, em `afty-habilidades.js`), uma mutação do catálogo
vazava para dentro da criatura gravada.

A cópia é ida e volta em JSON, e não `structuredClone`, de propósito: o pacote **é** JSON, e a volta
ainda tira o que não for serializável e tiver entrado por um caminho torto.

---

## 4. O pacote

Um addon é um JSON. O `id` do pacote é o namespace, e os ids das entradas são escritos **sem
prefixo**: o registro prefixa na carga.

Este exemplo **funciona e é conferido por assert**: ele instala, as três habilidades escalam pelo
`contar()`, o *Eco da Carne* troca o atributo do PV, o tipo de dano entra na lista de armas e a
condição entra no seletor de Feitiço. Dá para colar na aba Addons e ver acontecer.

```json
{
  "id": "mesa-do-afty",
  "nome": "Regras da Mesa do Afty",
  "versao": "1.0.0",
  "autor": "Afty",
  "descricao": "Exemplo dos Addons: uma família que escala por marca, uma que troca o atributo do PV, um tipo de dano e uma condição.",
  "paraRaw": "afty",
  "permite": ["contar", "hpAtributo"],
  "acrescenta": {
    "habilidades": [
      {
        "id": "eco_persistente",
        "nome": "Eco Persistente",
        "especializacaoId": "lutador",
        "tipo": "base",
        "nivel": 1,
        "tags": ["eco"],
        "descricao": "Cada eco que você carrega endurece o que sobrou de você. Você recebe 2 de redução de dano geral, e mais 1 para cada outra habilidade de Eco que você possuir.",
        "requisitos": [],
        "efeitos": [
          { "canal": "rdGeral", "expr": "2 + contar(\"eco\") - 1" }
        ]
      },
      {
        "id": "eco_do_impacto",
        "nome": "Eco do Impacto",
        "especializacaoId": "lutador",
        "tipo": "nivel",
        "nivel": 4,
        "tags": ["eco"],
        "descricao": "O primeiro golpe nunca some. Seu deslocamento aumenta em 1,5 metro.",
        "requisitos": [{ "tipo": "habilidade", "id": "eco_persistente" }],
        "efeitos": [
          { "canal": "movimento", "expr": "1.5" }
        ]
      },
      {
        "id": "eco_da_carne",
        "nome": "Eco da Carne",
        "especializacaoId": "lutador",
        "tipo": "nivel",
        "nivel": 6,
        "tags": ["eco"],
        "descricao": "Seu corpo passa a se sustentar pelo que ele lembra, e não pelo que ele é. Você pode usar o modificador de um atributo à sua escolha no lugar do de Constituição para calcular seus pontos de vida.",
        "requisitos": [{ "tipo": "habilidade", "id": "eco_persistente" }],
        "efeitos": [
          { "canal": "hpAtributo", "expr": "1" }
        ]
      }
    ],
    "tiposDano": [
      { "value": "sonico", "label": "Sônico" }
    ],
    "condicoes": [
      { "id": "cnd_ensurdecido_pelo_eco", "nome": "Ensurdecido pelo Eco", "forca": "media" }
    ]
  }
}
```

⚠ **A entrada do addon tem a MESMA forma da entrada do raw**, mais dois campos: `tags` e `efeitos`.

O raw separa catálogo de efeito (`HABILIDADE_EFEITOS` mora em `afty-efeitos-conteudo.js`) porque o
texto do livro e a automação têm donos diferentes e mudam em ritmos diferentes. **Num addon isso não
existe:** quem escreve a habilidade escreve o efeito dela, no mesmo JSON, e separar os dois só criaria
uma segunda chave para a pessoa manter em sincronia.

Por isso `coletarEfeitos` passou a ler o mapa PRIMEIRO e a entrada como fallback
(`mapa?.[id] ?? entradaDe(id)?.efeitos`). Nenhuma entrada do raw tem `efeitos` inline, então nada
muda para elas, e a mudança vale para todas as famílias de uma vez.

⚠ Esta era uma **lacuna real**, achada em 2026-08-20 só quando o pacote de exemplo foi testado de
ponta a ponta: o `efeitos` do addon era validado e nunca aplicado, e as habilidades entravam na
ficha sem somar número nenhum. É o argumento para todo exemplo de doc ser coberto por assert.

### O campo `libera`, e por que ele NÃO é o `permite`

**O que ter o addon DESTRAVA para a criatura que o carrega.** A liberação de hoje:

| id | O que destrava |
|---|---|
| `estiloSombras` | o Novo Estilo da Sombra fora do Sem Técnica, inclusive para quem tem Feitiços |
| `gemeosSemTecnica` | o Gêmeo pode copiar **Estudos Dedicados** ou **Empenho Implacável** em Verdadeiras Origens |

⚠ **São dois campos e não um, e a diferença é a razão de existirem os dois:**

| Campo | O que é | Muda número? |
|---|---|---|
| `permite` | **TELA.** Quem ENXERGA uma primitiva que o motor já tem | **Nunca**, e há assert medindo |
| `libera` | **REGRA.** O que a criatura PODE ter | **Sim**, é para isso que serve |

Juntá-los faria o `permite` às vezes mexer na ficha e às vezes não, quebrando a única coisa que ele
promete.

⚠ **A liberação é lida DIRETO DA CRIATURA, e não por canal do Motor.** Foi a primeira coisa que eu
projetei errado: comecei a acrescentar um canal `estiloLiberado` no estágio de pré-contexto, porque
a liberação viria de uma habilidade. A decisão do autor (*"a opção libera para a Criatura que o
Addon for ativado"*) matou o canal inteiro: a pergunta é estrutural (*esta criatura pode ter
Estilo?*) e a resposta tem de existir antes de quase tudo. Ler a ficha resolve, um canal chegaria
tarde.

⚠ **Sai da FICHA, e não do mundo aplicado**, pela mesma razão do `permite`: num Encontro misto o
mundo é a união de todos, e um combatente sem o addon não pode herdar a regra de quem tem.

#### O caso que abriu isto: Estilo das Sombras

A trava era `origemId === "sem_tecnica" && nd >= 4`, **JavaScript e não dado**, então nenhum pacote
da fase 1 a alcançava. É o caminho previsto na tese 1 ("falta de canal ou de função vira trabalho no
MOTOR"), só que a peça que faltava era um campo de pacote, não um canal.

Duas descobertas mudaram o desenho, e as duas vieram de ler o raw antes de escrever:

1. **O Estilo vem em par.** O Empenho Implacável do Sem Técnica dá acesso ao Estilo **e** a aptidão
   Domínio Simples, e é do Nível de Aptidão em **Domínio** que saem as vagas de imbuição. Liberar só
   o acesso entrega um Estilo que a criatura conhece e não consegue imbuir. O autor decidiu que quem
   destrava por Addon **compra** o Domínio Simples: o Sem Técnica ganha de graça porque não tem
   técnica nenhuma, e quem tem Feitiços não está nessa situação.
2. **O piso de Nível 4 continua valendo** (autor). São duas travas independentes: a origem diz QUEM
   tem, o nível diz A PARTIR DE QUANDO. O `libera` responde a primeira e não encosta na segunda.

Duas coisas mudaram junto, e as duas são consequência e não escolha:

- **`acrescenta` deixou de ser obrigatório.** O pacote deste caso não traz uma linha de catálogo, e
  o validador reprovava "o pacote não acrescenta nada". Agora o que reprova é não fazer **nenhuma**
  das três coisas.
- **A mensagem de ficha sem acesso mudou.** Ela dizia só "o Novo Estilo da Sombra é do Sem Técnica",
  e virou meia verdade no dia em que um Addon passou a poder destravar.

⚠ **Desinstalar o addon não destrói a ficha.** A Técnica de Estilo gravada continua lá e some só da
CONTA, que é a convenção do projeto para acesso perdido. Volta sozinha se o addon voltar.

#### ⚠ A QUARTA TRAVA, e a lição que ela repetiu

O motor liberou, os 54 asserts passaram, e **o card continuou sem aparecer**. O autor instalou o
addon e mandou print (2026-08-21).

A aba Habilidades do criador **ramifica o layout inteiro por origem**, e só o ramo do Sem Técnica
montava o `EstiloSombrasCard`. Era uma quarta trava, separada das três de regra, e ela escapou da
minha varredura porque compara a string crua `"sem_tecnica"` em vez da constante `ESTILO_ORIGEM`,
que foi o que eu grepei.

**É a segunda vez na mesma semana que o mesmo erro pega**, e as duas com o mesmo formato: eu
acrescento a capacidade ao motor, provo por assert que o número muda, e esqueço de perguntar **quem
monta a tela**. Na primeira foi o card de Concessão aparecendo para todo mundo, agora foi o do
Estilo não aparecendo para ninguém. O mesmo descuido nas duas direções.

O conserto foi tirar a decisão de dentro do JSX: ela virou `mostraCardEstilo(origemId, estilo)` em
`afty-estilo-sombras.js`, ao lado das outras três travas, com 12 asserts. Dentro do JSX ela era
intestável, e por isso saiu de sincronia duas vezes.

Regra que fica: **grepar a constante não basta.** Varrer o valor cru dela junto.

#### `gemeosSemTecnica`, a segunda liberação

O texto de Verdadeiras Origens proíbe o Gêmeo de copiar do Sem Técnica. A liberação tira **essa
origem, e só ela**, da lista de proibidas.

O resultado é **exatamente as duas características que o autor nomeou**, e não por coincidência: o
Sem Técnica tem três, e a terceira é o Bônus em Atributo, que o filtro genérico já tira de toda
origem. Não precisou nomear nada.

⚠ **Continua sendo UMA escolha** (autor: *"é para escolher só uma, porém deixar as duas como
opção"*). O `vagas: 1` não foi tocado, e as duas entram lado a lado com as das outras origens.

⚠ **A lista virou POR CRIATURA, e a troca mora no `caracteristicasEfetivas`.** Não em
`escolhasDaOrigem`, porque são dois consumidores por caminhos diferentes: o `resolveEscolhasOrigem`
passa pelo segundo, mas **o card do criador lê `c.escolha.opcoes` direto** do que o primeiro
devolve. Filtrar só no resolvedor deixaria a tela oferecendo o que o motor recusa, que é o irmão do
bug da quarta trava.

⚠ **A característica é COPIADA, nunca alterada no lugar.** O catálogo é compartilhado por toda
criatura carregada, e escrever nele vazaria a lista de quem tem addon para quem não tem. É o mesmo
estrago que fez a entrada de Addon passar a ser clonada.

**Sem o addon a escolha some da ficha, em silêncio** (autor), sem a marca de "sem acesso" que o
Estilo usa. O id continua gravado em `core.origem.escolhas`, então reinstalar o addon a traz de
volta, mas nada na tela a menciona enquanto ele estiver fora.

⚠ **Copiar o Empenho Implacável traz o Domínio Simples junto**, no ND 4 e ignorando os
pré-requisitos, porque a característica copiada é mecanicamente viva (`caracteristicasEfetivas`
alimenta o `aptidoesConcedidasPelaOrigem`). Isso **não** dá vaga de imbuição sozinho: a vaga é o
NÍVEL DE APTIDÃO em Domínio, comprado à parte, e o Sem Técnica raw está na mesma situação. Há assert
medindo a igualdade entre os dois.

#### Bug anterior consertado junto: o cache da lista

`opcoesVerdadeirasOrigens` guardava o resultado num módulo e **nunca invalidava**. Como a lista é
montada do `AFTY_ORIGENS_CATALOG`, uma origem vinda de Addon jamais aparecia em Verdadeiras Origens,
calado. O bug entrou junto com a família `origens` e não tinha sintoma porque ninguém tinha escrito
uma origem de addon ainda. O `aplicarExtrasOrigens` agora limpa o cache, e há assert com uma origem
de teste.

### O campo `permite`, e por que ele existe

**As primitivas da fase 0 vivem no motor sempre, e aparecem na TELA só de quem pediu.** É o que o
campo declara. Os quatro valores de hoje:

| id | O que destrava |
|---|---|
| `concessao` | o card **Concedido pelo Mestre**, na Ficha Final e no painel do Encontro |
| `contar` | o grupo **Marcas** no seletor de variáveis, e a função `contar()` na lista de funções |
| `hpAtributo` | o canal **Atributo do PV** no seletor de canais |
| `adaptacao` | o painel **Roda de Adaptação**, na aba Ações da Ficha Final e do Encontro |

⚠ **ISTO NASCEU DE UM ERRO, e vale escrito para não repetir.** Ao fechar a 8.3 eu construí o verbo
no motor, marquei a primitiva como pronta e parei ali. O resultado foi o card "Concedido pelo
Mestre" aparecendo na tela de jogo de **todo mundo**, com zero addons instalados, listando o
catálogo raw inteiro. O autor viu no deploy em 2026-08-20 e apontou: *"deveria ser algo próprio de
Addon"*. As outras duas primitivas tinham vazado do mesmo jeito, mais baixinho.

A lição vale para a 8.4 e para a fase 3: **acrescentar o verbo ao motor não é a tarefa inteira.**
Falta sempre dizer quem enxerga o verbo.

**Como a decisão desce até a tela.** A fonte é `derived.primitivas`, calculada de
`creature.addons` pelo `primitivasDaCriatura`. Da Ficha e do criador ela desce por **contexto React**
(`ui/usar-primitiva.js`), porque dois dos três consumidores são folhas fundas do criador de 12 mil
linhas, e passar prop até lá seria meia dúzia de assinaturas alteradas em componentes que não têm
nada a ver com Addons.

⚠ **Sai da FICHA, e não do mundo aplicado.** Num Encontro misto o mundo é a união de todos os
addons, mas um combatente sem addon nenhum não pode herdar a tela de quem tem. É a mesma razão de a
marca de "não raw" sair da ficha. Por isso o provedor é **um por combatente**.

⚠ **O portão é de TELA, e nunca de motor.** Uma sessão que já tem coisa concedida continua valendo
mesmo se o addon parar de permitir, e o card reaparece nesse caso: sem isso, desinstalar o addon
deixaria a linha morta presa na sessão sem botão de tirar. Pela mesma razão, o canal já ESCOLHIDO
numa expressão continua à vista no seletor.

⚠ **Permitir não muda número nenhum**, e há assert medindo os stats principais dos dois lados.

### O registro de famílias

É isto que sustenta a promessa de "generalista": acrescentar uma família nova ao sistema de addons é
**uma linha**, e não um caso especial.

```js
// afty-registro.js
const FAMILIAS = {
  habilidades: { base: AFTY_HABILIDADES, validador: validarCatalogoHabilidades, chave: "id" },
  aptidoes:    { base: AFTY_APTIDOES,    validador: validarCatalogoAptidoes,    chave: "id" },
  tiposDano:   { base: TIPOS_DANO,       validador: null,                       chave: "value" },
  // ...
};
```

---

## 5. Namespace

Todo id que um addon cria nasce prefixado: `minha-mesa:ciclo_de_adaptacao`. Colisão com o raw fica
impossível para sempre, e um id órfão numa ficha de terceiro fica legível em vez de virar buraco.

**Referência entre entradas do mesmo addon é escrita sem prefixo e resolve local primeiro, raw
depois.** Um `requisito` apontando para `ciclo_de_adaptacao` acha o do próprio addon. Um apontando
para `lut_corpo_treinado` acha o raw.

---

## 6. Onde o addon mora

Copiando a decisão que o autor já tomou para o tema da Ficha (`ficha-tema.js`, 2026-08-05:
*"quero mandar minha ficha bonitinha para os outros"*). **Duas moradas, papéis separados.**

| Morada | Chave | Papel |
|---|---|---|
| **Biblioteca** | `fm_addons_afty_v1` | onde a pessoa instala, edita e atualiza |
| **Cópia embutida** | `creature.addons` | congelada no momento do uso. **É ela que manda no cálculo** |

Exportar a ficha exporta as regras dela, então ninguém recebe ficha quebrada, e não existe servidor
de registro, URL nem fetch. E resolve de graça o problema mais chato: o addon muda e as fichas
antigas **não se mexem sozinhas**. A ficha diz que existe versão nova e atualizar é um botão.

⚠ O custo é duplicação, e o `localStorage` tem 5MB. O pacote tem teto, no mesmo espírito do
`CSS_MAX` de 64KB do tema: **avisa, não bloqueia**.

---

## 7. A marca de "não raw"

Ficha que usa addon fica marcada no cabeçalho. Não como advertência moral, como informação: quem
recebe a ficha precisa saber que ela não é raw **antes** de comparar com a mesa dele.

O painel de fontes já mostra de onde veio cada número, então o addon vira só mais uma origem.

---

## 8. As quatro primitivas (fase 0)

Cada uma nasceu de um caso real que o autor já tentou fazer e não coube. Elas entram no MOTOR, e as
quatro são úteis fora do addon.

### 8.1 Família marcada por tag, e `contar()`

**O caso.** Uma habilidade dá 2 de RD Geral, e mais 1 a cada outra habilidade do mesmo arquétipo na
ficha.

**O que falta.** O DSL já tem uma booleana `tem_*` por habilidade do catálogo. Falta a irmã dela:
contar em vez de perguntar. Com `tags` na entrada, `2 + contar("adaptacao") - 1` resolve a habilidade
inteira, e a família toda de homebrew "escala com quantos X eu tenho" vem junto.

**Onde.** Precisa da cópia do avaliador do `fm-dsl.js` para `src/systems/afty/` (decisão 6). Função
nova do DSL exigiria editar o 2.5.2, que é somente-leitura, e o cabeçalho do `afty-efeitos.js` já
mandava parar e perguntar nesse caso.

### ✅ FEITA em 2026-08-20

`src/systems/afty/afty-dsl.js` nasceu da cópia, e os 6 pontos de importação do Afty passaram a
apontar para ela. A 2.5.2 segue com a cópia dela, intacta. Além do `contar()`, a linguagem ganhou
**literal de texto**, que o `fm-dsl` não tem, e ele só vale como argumento de função: o validador
reprova `2 + "abc"` em vez de deixar valer 2.

Cada entrada da ficha rende duas espécies de marca:

| Espécie | De onde vem |
|---|---|
| escrita | o campo `tags` da entrada, que é por onde o Addon marca as dele |
| automática | a família (`habilidade`, `talento`, `aptidao`) e a especialização dona |

⚠ **As automáticas são decisão minha, não do autor.** Sem elas a função nasceria morta, porque
nenhuma entrada do catálogo raw tem `tags` e só o Addon (fase 1) traria a primeira. Com elas,
`contar("lutador")` já responde hoje. Marca escrita com o mesmo nome de uma automática apenas SOMA,
e é inofensivo. Apagar o bloco é uma linha, se o autor não quiser.

⚠ **No estágio MONTANTE o `contar()` devolve 0**, porque ele roda antes de Habilidades, Talentos e
Aptidões existirem. Mesma limitação do `tem_*` naquele estágio.

### 8.2 Canal de substituição de atributo em fórmula

**O caso.** Uma habilidade troca o atributo do cálculo de PV para um à escolha.

**O que falta.** Quase nada: `defesaAtributo` já existe em `afty-efeitos.js`, com a nota "TROCA a
Destreza no cálculo da Defesa, e não soma nada", e o desempate já está decidido ("com mais de um
concedido vale o de maior modificador, porque a regra é sempre você pode optar"). `hpAtributo` é a
mesma coisa apontada para outro lugar. Semântica, desempate e painel de fontes vêm prontos.

⚠ Vale generalizar o padrão: **toda fórmula que lê um atributo específico deveria ter canal de
substituição**. Ver `afty-status.md`, "Substituir não é somar".

### ✅ FEITA em 2026-08-20

Canal `hpAtributo`, com `alvo: "atributo"`, no grupo Atributos e Aptidões. O PV passou a ler
`modHp` em vez de `modCon`, e o hover troca a linha "Constituição × ND" por
"Força × ND (no lugar da Constituição)" mais a fonte que substituiu.

⚠ **Alvo AUSENTE dá exatamente o texto do autor.** A convenção do motor é que canal com destino e
sem alvo vale para TODOS, e aqui isso quer dizer o melhor dos seis, que é o "para um a minha
escolha" da fala dele. Com alvo nomeado, vale aquele. Nos dois casos o hover diz qual foi.

### 8.3 Concessão vinda da SESSÃO

**O caso.** *Ciclo de Adaptação*, do Mahoraga: a cada condição em combate, o mestre acrescenta na
hora Habilidades, Feitiços, Treinos ou qualquer coisa na criatura, **já calculando**.

**O que falta.** Duas coisas, e a segunda parece cara e não é.

1. Conceder QUALQUER família (hoje: Aptidão por nome, escolha de habilidade, Bases da Especialização).
2. A concessão vir da mesa em vez de ser determinística.

A Ficha já deriva com `{ ...creature, combate: sessao.combate }`. Uma `sessao.concedido` entra pelo
mesmo caminho, e o "já calculando" sai de graça, porque a derivação é função pura da criatura
mesclada. De brinde a ficha salva não suja, que é a razão de a sessão viver em chave separada.

### ✅ FEITA em 2026-08-20

O módulo é `afty-concessao.js`, a sessão guarda em `sessao.concedido`, e a tela é um
componente só (`ficha/PainelDeConcessao.jsx`) usado pelos dois donos. **142 asserts** em
`t-concessao.mjs` e `t-concessao-sessao.mjs`.

#### As respostas do autor

| Pergunta | Resposta |
|---|---|
| Onde o mestre escolhe | **Nos dois**: botão na Ficha Final e no painel de combatente do Encontro |
| A concessão gasta vaga | **Não**, entra de graça. É ganho de combate, não compra de ficha |
| Sobrevive ao combate | **Não**, morre com a sessão |

As três juntas dizem uma coisa só, e ela simplifica muito: **a concessão é estado de sessão, nunca
ficha**. Nada disso é gravado na criatura, nada disso passa pelos contadores de orçamento, e limpar
a sessão desfaz tudo. É o mesmo estatuto que os buffs temporários já têm.

Consequências que caem de graça dessa escolha:

- **De graça** quer dizer que o concedido não entra em nenhum `usados` nem faz nada ficar vermelho.
  Uma criatura com 12 habilidades concedidas no meio da luta continua com a ficha válida.
- **Morre com a sessão** quer dizer que a ficha salva nunca é tocada, então não existe migração,
  nem risco de sujar a criatura de outra pessoa, nem entrada nova no `afty-schema.js`.
- **Nos dois lugares** quer dizer que a peça de tela é uma só, com dois donos. A Ficha Final e o
  painel de combatente já leem a mesma sessão.

⚠ O concedido continua **visível**, e com marca de onde veio, porque a criatura na mesa fica
diferente da criatura no papel e ninguém pode se confundir sobre qual está lendo.

#### Como ficou

A concessão entra por `deriveAfty(creature, { concedido })`, **nunca pela criatura**, e o
`deriveAfty` reparte a lista pelas famílias e entrega a cada resolvedor o **canal de concessão**
dele.

⚠ **O canal não foi inventado para isto.** A `resolveHabilidades` já tinha um desde sempre: as
Bases que a Especialização concede entram em `concedidas`, valem para tudo e não gastam vaga, que é
exatamente a semântica pedida. As outras seis famílias ganharam o mesmo canal, com o mesmo nome. O
resultado é que "de graça" não é uma correção aplicada depois, é o caminho por onde o dado anda.

**As 7 famílias**, que são as de id de catálogo: Habilidade de Especialização, Habilidade Geral,
Talento, Treino Especial, Aptidão Amaldiçoada, Melhoria Superior e Habilidade Lendária.

⚠ **O Feitiço ficou de fora**, e não por preguiça: ele não é id de catálogo, é objeto criado dentro
da ficha, então conceder um significa escolher **de onde copiar**, que é outra interação. Está
anotado em `docs/a-fazer.md`.

**Três invariantes que os asserts prendem**, porque as três são fáceis de quebrar sem sintoma:

1. o orçamento com a concessão tem de ser **idêntico** ao da mesma ficha sem ela (`gastos`,
   `restante` e `excedeu` medidos contra a ficha crua, família por família);
2. a criatura de entrada **não muda um byte**, e o `JSON.stringify` dela não contém a palavra
   `concedido`;
3. a pega concedida e a comprada dão **o mesmo número**. Se divergirem, o motor tem dois caminhos
   para a mesma regra.

⚠ **CONCEDER NÃO APARA NO TETO.** Três famílias são repetíveis com limite (Geral, Melhoria, Treino
Especial), e o limite é do **orçamento de compra**. O Ciclo de Adaptação existe justamente para dar
o que a criatura não alcançaria comprando, então aparar ali mataria a primitiva. A compra continua
aparando, e há assert dos dois lados.

⚠ **Pré-requisito também não é cobrado.** O resolvedor continua **reportando** o inacessível em
`inacessiveis`, que é a convenção do projeto (reporta, não remove).

**Linha morta:** a concessão que aponta para um addon que saiu do ar sobrevive na sessão, aparece
riscada com o chip "Sem Addon" e o `title` mostra o id, para dar o que procurar. A ficha abre do
mesmo jeito e o número volta ao de antes.

### 8.3.1 Ciclo de Adaptação do Mahoraga

Feito em 2026-08-28 como verbo genérico do motor mais um pacote declarativo incluído. O pacote é
`addons/ciclo-adaptacao-mahoraga.js`, instalável pelo botão **Mahoraga** da aba Addons. Só a
criatura que carrega a cópia do pacote enxerga o painel.

O estado fica em `sessao.adaptacoes`, separado por `pacote:ciclo`. O primeiro giro é manual e
grava a rodada. Depois disso, `proximaRodada` gira uma vez automaticamente a cada rodada. Giros
manuais adicionais continuam permitidos. Todo quinto giro cria uma escolha pendente e não concede
Habilidade. O botão Resetar encerra o ciclo, limpa giros, rodada inicial, pendências, Narrativas e
Mecânica, e remove somente as concessões produzidas por aquela roda. Giros antigos sem o id direto
da concessão são reconhecidos pelo conteúdo e pelo instante em que foram criados.

Nos giros comuns, o motor varre `HABILIDADE_EFEITOS` e `ESCOLHA_EFEITOS` atrás de
`bonusAcerto` positivo, ordena as Habilidades por nível e depois pela ordem do catálogo, ignora as
já possuídas e as já concedidas, e concede de graça. Um requisito do tipo Habilidade entra em um
giro anterior. Escolhas aninhadas de Acerto viajam na própria concessão e chegam ao
`resolveEscolhasHabilidade`. Os efeitos da Habilidade e das opções recebidas pela roda são aplicados
diretamente durante o ciclo, sem depender do interruptor normal da Habilidade. Uma concessão comum
continua respeitando o gatilho do catálogo.

Nos marcos, Narrativa guarda texto livre e aumenta o requisito da próxima Mecânica. Mecânica
substitui a anterior e usa as tabelas existentes de Feitiço Auxiliar no maior nível acessível. Os
degraus são sem requisito, Fácil, Médio, Difícil e Impossível. Médio, Difícil e Impossível compram
a maior Negação de RD que cabe no PE extra do requisito. Impossível aplica Ação Completa, Pressão
Amaldiçoada e Ruptura Absoluta.

O painel único `ficha/PainelDeAdaptacao.jsx` aparece no topo de Ações nas duas telas. A lógica pura
tem 42 asserts em `t-adaptacao.mjs`.

### 8.4 Vínculo entre criaturas

**O caso.** Somar a barra de PV com a de outra criatura, virando uma só, e somar a de PE junto.

**O que falta.** Essa é a única que atravessa a arquitetura. `deriveAfty` é função pura de UMA
criatura, e somar duas barras é uma RELAÇÃO, não um número.

O lugar é o **Encontro**, que já segura N combatentes, cada um com ficha e sessão. A forma é derivar
os dois normalmente e combinar depois, o que é seguro enquanto o vínculo não realimentar as
derivações individuais. Soma não realimenta.

⚠ **É aqui que fica claro por que código não era a resposta.** Um gancho em JavaScript rodando
dentro do `deriveAfty` também não teria os dados do amigo. O que falta não é poder de expressão, é
uma primitiva que não existe em lugar nenhum.

### ✅ DECIDIDA em 2026-08-20 (respostas do autor)

| Pergunta | Resposta |
|---|---|
| Uma barra ou duas somadas | **Uma barra só.** O vínculo tem PV corrente PRÓPRIO, e os máximos somam |
| Dano em um dos dois | **Um para um no pool comum.** 10 no amigo tira 10 da barra compartilhada |
| O que mais compartilha | **PV, PE e PV temporário.** Nada além disso |
| RD, resistências e imunidades | **Por pessoa.** Bateram em mim, vale a MINHA RD. Bateram nele, a dele |
| Condições | **Por pessoa** |
| Quem declara o vínculo | **Os dois caminhos**: a habilidade do addon e o mestre à mão no Encontro |
| Pool zerado | **Os dois caem juntos**, e cada um entra em morrendo por conta própria |
| Vínculo quebra no meio do combate | **Proporcional ao máximo de cada um** |

**A linha que separa o que soma do que não soma é clara, e vale escrever em voz alta:** soma o que
é **pilha de recurso** (PV, PE, PV temporário), e não soma o que é **propriedade de um corpo** (RD,
resistência, imunidade, condição). A barra é comum, os corpos continuam dois.

Isso resolve a pergunta mais espinhosa sozinho. A RD ser por pessoa quer dizer que **ela é aplicada
ANTES de o dano chegar no pool**: o golpe de 30 no amigo com 30 de RD tira zero do pool, e o mesmo
golpe em mim com 50 de RD também tira zero, mas por outra conta. O pool nunca precisa saber qual RD
usar, porque quem recebeu já resolveu isso.

**A ordem de uma pancada**, então, é esta, e ela não muda nada do que já existe até o último passo:

1. o alvo é UM combatente, sempre. Vínculo não muda quem foi acertado;
2. a RD, a resistência e a imunidade **daquele alvo** aparam o dano, como hoje;
3. o que sobrou desce no PV temporário **do pool**, e depois no PV **do pool**;
4. condição aplicada gruda **só naquele alvo**.

**Proporcional ao máximo**, na quebra, quer dizer `floor(poolCorrente * maxDele / maxSomado)`, com
o arredondamento para baixo de sempre. Sobra de divisão vai para quem tem o maior máximo, e o
detalhe importa: com o floor nos dois lados, um ponto sumiria calado.

⚠ **Uma barra só tem um custo que precisa estar escrito:** enquanto o vínculo está de pé, o PV
corrente **individual de cada membro deixa de existir**, e não é só apresentação. Por isso a quebra
precisa de uma regra de repartição, e por isso ela foi perguntada junto.

---

## 9. Linha morta e marcada (decisão 4)

Três situações reais: a expressão do addon tem erro de sintaxe, a entrada cita um canal que a versão
nova do addon não declara mais, ou o addon foi desligado e a criatura ainda o referencia.

| Onde | Comportamento |
|---|---|
| **Instalar o addon** | recusa. Ninguém instala addon quebrado, e os 13 validadores já sabem reprovar |
| **Abrir a ficha** | **sempre abre.** A linha aparece marcada e não soma nada |

O que a linha morta mostra, para o problema ser descobrível:

- de qual addon veio
- o que falhou: expressão inválida, canal inexistente, ou id que sumiu
- a expressão como está escrita, mais o erro do avaliador (`validateExpression` já devolve texto,
  do tipo `"Função desconhecida: x()"`)
- onde ela deveria ter entrado

### Onde ela aparece

Nas **três** telas que mostram números derivados, porque uma criatura com addon órfão mostra número
ERRADO, e o sintoma tem de estar onde a pessoa está olhando:

| Tela | Onde |
|---|---|
| Criador | um card "Problemas" no topo da aba Addons |
| Ficha Final | um bloco acima do corpo, em qualquer aba |
| Encontro | dentro do painel do combatente, acima dos vitais |

⚠ O Encontro foi o último a receber, e ele era o mais importante dos três: é lá que o mestre abre a
criatura de outra pessoa, que é exatamente o caso em que o addon está faltando.

⚠ Isso **não fere** a regra de nada de texto explicativo na UI: a regra abre exceção para AVISO, que
é exatamente o que isso é. Ver `afty-status.md`, "Regras de UI que este chat aprendeu apanhando".

---

## 10. A fronteira

O que o addon NÃO faz, e é o que mantém o site raw:

- não roda código (até a fase 5, se ela vier)
- não desenha tela nem cria aba
- não inventa canal nem variável de DSL escondido. Falta de verbo vira trabalho no motor (seção 1)
- não reescreve fórmula. Coeficiente de tabela sim, na fase 4

---

## 11. Fases

### Fase 0: as 4 primitivas
Motor puro, sem nada de addon. Três pequenas e uma média. Testáveis já contra os quatro casos da
seção 8. **Úteis mesmo se o resto nunca vier.**

### Fase 1: acrescentar por JSON
Registro, namespace, `creature.addons`, a época no `useMemo`, a marca na ficha e a linha morta.
Entrada por colar JSON, sem tela de autoria. Os catálogos já têm forma uniforme e validador pronto,
então é a melhor razão entre trabalho e resultado do projeto todo.

### PARADA OBRIGATÓRIA
Ver se aparece alguém escrevendo addon. As fases seguintes servem a quem NÃO escreve JSON, e o
escopo declarado hoje é "um punhado de pessoas de confiança".

### Fase 2: Oficina (condicional)
A tela de autoria, reusando `TecnicaMotorEditor` e `TextoRico`. Uma família por vez, começando por
Habilidade. As peças empilham: o formato do pacote não muda quando a tela chegar depois.

### Fase 3: remendar e desligar
**Remendar está FEITO (2026-08-22).** Desligar continua fora. Ver a seção 14.

⚠ **A parte com preço que não termina.** Um remendo aponta para id do raw, e no dia em que o
catálogo for refatorado, o remendo dos outros apodrece calado. É o mesmo problema do requisito `nota`
já anotado, com o agravante de o conteúdo ser de terceiro e não ter como ser testado. O que existe
contra isso hoje: o `validarPacote` confere o id contra a lista RAW da família (`basicos()`) e
**recusa o pacote inteiro** quando ele erra o alvo, e a conferência refaz a cada `aplicarAddons`.
Não é manutenção zero, e nunca vai ser.

### Fase 4: tabelas (condicional)
Grau novo, Patamar novo, Tipo novo, coeficiente de PV por Tipo.

⚠ Não é "trocar uma constante". A sessão de 2026-08-19 é o estudo de caso: somar uma linha em
`AFTY_GRAUS_CRIATURA` mexe em `rank` (que alimenta 4 fórmulas), em `EQUIP_GANHO_POR_GRAU` (chaveado
pelo mesmo `value`) e em 3 invariantes do validador. Então a fase 4 é uma **lista fechada de tabelas
que o sistema aceita ver substituídas**, cada uma com esquema, o validador que já guarda o raw, e
uma regra de preenchimento para as tabelas irmãs (o autor já escolheu uma vez: `EQUIP_GANHO_ESPECIAL`
repetindo a última linha).

### Fase 5: função (condicional)
O escape hatch em JavaScript. Ver os avisos da seção 1.

---

## 12. Riscos nomeados

| Risco | Mitigação |
|---|---|
| Duplicação estourar os 5MB do `localStorage` | teto do pacote, com aviso e não bloqueio |
| `useMemo` não recalcular ao trocar addon | contador de época na dependência (seção 3) |
| Dois addons remendando a mesma linha | ordem declarada, vencedor mostrado no painel de fontes |
| Remendo apodrecendo em refatoração do raw | versão do raw no pacote, revalidação ao abrir (fase 3) |
| Addon virar coisa pública com sandbox que não é parede | a decisão 5 volta para a mesa nesse dia |
| Catálogo novo do raw nascer fechado a addon | o registro de famílias (seção 4) é o lugar único a lembrar |

---

## 13. Perguntas abertas

Nada bloqueando as fases 0 e 1. Anotar aqui o que aparecer.

---

## 14. O REMENDO (`substitui`), 2026-08-22

A metade da fase 3 que o autor destravou ao mandar um Addon que **reescreve** o Domínio Simples e
dois Talentos de Origem em vez de criar linhas novas. Criar não servia: dois Talentos com o mesmo
nome na lista não é remendo, é confusão.

```json
"substitui": {
  "aptidoes": [{ "id": "dominio_simples", "descricao": "..." }],
  "talentos": [{ "id": "tal_nocao_e_preparacao", "descricao": "...", "efeitos": [...] }]
}
```

### As quatro regras

1. **A substituição é por CAMPO e é RASA.** `{ descricao }` troca a descrição e deixa `requisitos`
   como estavam. `{ requisitos: [...] }` troca a lista INTEIRA, e não mistura item a item. Mesclar
   fundo pareceria mais gentil e seria imprevisível, e apagar um item viraria impossível.
2. **O id é intocável.** Ele é a âncora do remendo e a chave do que já está gravado nas fichas.
   Trocá-lo seria apagar a entrada e criar outra, que é o que o `acrescenta` faz.
3. **O alvo tem de existir no LIVRO.** O id não leva prefixo de pacote, e o validador o confere
   contra `def.basicos()`, a lista raw da família. Errar o alvo **recusa o pacote inteiro**, e não
   vira remendo que simplesmente não liga.
4. **Dois pacotes na mesma entrada: o último vence**, campo a campo, e os dois ficam em
   `remendadoPor`.

### O que quase passou batido

⚠ **O efeito do raw mora FORA do catálogo.** `TALENTO_EFEITOS`, `HABILIDADE_EFEITOS` e irmãos vivem
em `afty-efeitos-conteudo.js`, chaveados pelo id, e o id não muda num remendo. Sem uma regra de
precedência, o remendo trocava o TEXTO da regra e o NÚMERO continuava o antigo, calado. Era
exatamente o caso do Noção e Preparação, que passa a subir nos níveis 9, 14 e 19 pelo Addon e
continuaria subindo em 8, 12 e 16 no motor.

A regra que entrou, em `coletarEfeitos`: **entrada remendada que declara `efeitos` vence o mapa do
raw.** Quem não é remendada continua lendo o mapa primeiro, então nada muda para o livro.

⚠ **Duas famílias recusam remendo, e dizem por quê.** `tiposDano` é um mapa `{ value: label }` e
`condicoes` é uma lista de strings: nelas não existe "trocar um campo". O validador reprova com a
razão, em vez de aceitar calado e não fazer nada.

### O conteúdo que veio junto

| Peça | Como |
|---|---|
| Domínio Simples com sustentação de 2 PE, sem Durabilidade | remendo em `aptidoes` |
| Treino de Novo Estilo das Sombras (4 etapas + Completo) | acréscimo em `treinamentos` |
| Coleta de Talismãs, Expansão de Estilo | acréscimo em `talentos` |
| Estudo Amaldiçoado e Noção e Preparação reescritos | remendo em `talentos` |

Cinco coisas no motor tiveram de nascer para o conteúdo caber, e nenhuma delas é sobre este Addon:

- **canal `vagasEstilo`**, vaga exclusiva de Técnica de Estilo. Mais estreita que a de Feitiço, e por
  isso é gasta primeiro.
- **canal `imbuicoesEstilo`**, quantas Técnicas cabem no Domínio Simples além do Nível de Aptidão em
  Domínio. ⚠ Ele roda num **passe próprio** (`CANAIS_POS_APTIDAO`, estágio 0c): no pré-contexto a
  variável `dom` ainda não existe, e no estágio principal o `resolveEstilos` já rodou. E o passe lê
  as DUAS listas de efeito, porque uma Linha de Treinamento entra pelo montante e não pelo
  `efeitosTodos` (filtrar só o segundo deixava o Completo mudo).
- **`soDaOrigem`** na Linha de Treinamento, a trava POSITIVA. Até aqui só existia a negativa
  (`foraDaOrigem`).
- **requisitos `aptidao` e `trilha`** na etapa de Treinamento e `aptidao` no Talento. Antes toda
  etapa que citava aptidão era `nota`, que só exibe.
- **repetição de Talento** (`maxVezes` / `maxVezesExpr`). ⚠ Não confundir com `escolha.repetivel`,
  que é a outra repetição e continua valendo: ela é "pegue de novo, para outro alvo" e a ficha a
  representa repetindo a ESCOLHA. Esta é "pegue de novo e ganhe a mesma coisa", e a ficha a
  representa repetindo o ID, igual às Habilidades Gerais.

⚠ **`passagem direta` na Linha de Treinamento.** Uma etapa pode declarar `{ canal, expr }` em vez de
`{ tipo, valor }`. O vocabulário de `tipo` é uma lista fechada escrita para as 12 linhas do livro, e
um addon que precise de canal fora dela não teria como dizê-lo. Também é o único jeito de escrever
valor que não é constante: "o dobro do seu Nível de Domínio" é `dom`.

### A liberação `qualificaSemTecnica`

A terceira do sistema. Ela põe `sem_tecnica` em `origensQualificadas`, que é **o mesmo caminho que o
Gêmeo já usava** para Verdadeiras Origens: *"considera a origem escolhida como sua para todos os fins
de qualificação"*. Nada de novo precisou existir.

É SEPARADA do `estiloSombras` de propósito: uma solta o Estilo, a outra solta os pré-requisitos de
origem. Juntá-las faria a primeira mudar duas coisas de uma vez.

⚠ Ela só ABRE, nunca tranca. `origensQualificadas` alimenta também `especializacoesDisponiveis`, e lá
a origem extra só destrava especialização exclusiva. Nenhuma é exclusiva do Sem Técnica hoje, então
o efeito colateral é zero, e continua sendo zero enquanto isso for verdade.


---

## 15. A ORIGEM ESTRUTURAL, 2026-08-29

Pedido do autor: *"liberar Origem de Maldição para Gêmeos. Fazendo com que ele siga as regras de
Maldição de não ter Energia Reversa, porém ter a aba de Aptidões de Maldição e etc."*

A liberação `gemeosMaldicao` tira a Maldição de `VERDADEIRAS_ORIGENS_PROIBIDAS`, e isso é a metade
fácil. A outra metade é o "e etc": **copiar da Maldição muda a ESTRUTURA da criatura**, e não só o
que ela tem.

### A pergunta nova, e por que ela não podia pegar carona

Já existia `origensQualificadas`, e a tentação era pendurar isto nela. **Não dá.** Aquela lista está
documentada como *"só ABRE, nunca tranca"*, e esta pergunta FECHA: virar Maldição TIRA a Energia
Reversa. Pendurar um fechamento numa lista que promete só abrir é a armadilha, não a economia.

Então nasceu `origemEstrutural(creature)`, que responde **uma** origem (não uma lista, porque a
pergunta é excludente: a aba de Maldição OCUPA o lugar da de Energia Reversa, não se soma a ela).

| Pergunta | Função | Devolve | Direção |
|---|---|---|---|
| O que a criatura ALCANÇA a mais? | `origensQualificadas` | lista | só abre |
| O que a criatura É? | `origemEstrutural` | uma origem | abre e fecha |

Três leitores mudaram, e são exatamente os três lugares que perguntavam `origem.id === "maldicao"`:

- `trilhasDaCriatura` (nova, irmã da `trilhasDaOrigem`), lida pelo `deriveAfty`;
- `abasAptidao`, que troca a aba de Energia Reversa pela de Maldição;
- o `foraDaOrigem` das Linhas de Treinamento, nos três pontos que o consultam.

⚠ **O Addon não é conferido dentro do `origemEstrutural`.** Quem confere é o
`verdadeiraOrigemEscolhida`, que já devolve `null` quando a liberação saiu. Uma segunda trava seria
uma segunda verdade para manter em sincronia.

### A característica copiada passou a ter número

⚠ **Até aqui, TODA característica copiada em Verdadeiras Origens entrava só como texto.**
`ORIGEM_EFEITOS` é chaveado pela origem inteira e não desce à característica, e o comentário do
`caracteristicaCopiada` já apontava a saída: *"quem precisar de canal declara em
ORIGEM_ESCOLHA_EFEITOS, pelo id `vo_*`"*. Ninguém tinha usado, porque nenhuma das copiáveis tinha
número.

A Natureza Amaldiçoada tem: uma Aptidão à escolha, mais uma no 10° e no 15°, e +1 PE por nível. Os
dois canais são **cópia literal** de `ORIGEM_EFEITOS.maldicao`, e a única razão de não serem lidos
de lá é que aquele mapa não sabe a qual das três características da Maldição cada linha pertence.

⚠ No dia em que a Maldição ganhar outra característica com número, as duas listas divergem em
silêncio. Anotado em `docs/a-fazer.md`.
