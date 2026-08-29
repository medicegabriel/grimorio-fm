# A FAZER — pendências do repositório

Arquivo ÚNICO de coisas a fazer. Vale para o Grimório 2.5.2, para o Afty e para o que for geral.

Criado em 2026-08-09 a pedido do autor: *"padronize as anotações de COISAS A FAZER em um único
arquivo md. Para outros colaboradores usarem ele também e ir anotando oq for preciso."*

---

## Como usar

1. **Toda pendência nasce aqui.** Não abra `// TODO` no código sem deixar a linha correspondente
   neste arquivo. O comentário no código envelhece escondido, este arquivo não.
2. **Uma pendência = uma entrada** com o cabeçalho abaixo. Se você não consegue preencher o
   **Precisa**, o que você tem é uma dúvida, e ela vai para `PERGUNTAS AO AUTOR`.
3. **Ao resolver, APAGUE a entrada** e escreva o que foi feito na sessão do dia em
   `afty-status.md` (ou no doc do sistema correspondente). Este arquivo é uma fila, não um
   histórico: se ele virar log, ninguém lê até o fim.
4. **Não reescreva a entrada de outra pessoa.** Acrescente uma linha `**Nota:**` embaixo.
5. `afty-status.md` continua sendo o **log de sessões** e a explicação de por que as coisas são
   como são. Ele não é a fila de trabalho.

### Formato de uma entrada

```
### Título curto, no imperativo ou descrevendo o buraco
**Onde:** caminho/do/arquivo.js (ou o sistema, se for espalhado)
**Situação:** o que existe hoje, e por que não basta
**Precisa:** o que fazer, concreto
**Anotado:** AAAA-MM-DD, por quem / em que contexto
```

---

## PERGUNTAS AO AUTOR

Coisas paradas esperando decisão de regra. Nada aqui deve ser resolvido por suposição.

### O Ataque Básico pode rolar como Ataque Amaldiçoado?

**Onde:** `src/systems/afty/afty-pericias.js` (`resolveDano`, a linha `basico`)
**Situação:** toda entrada de arma do inventário escolhe entre a jogada física da categoria e o
Ataque Amaldiçoado (`ataqueId`, 2026-08-18). As três de pugilato (Faixas, Manoplas, Soco Inglês) não
têm linha própria, elas são o Ataque Básico, e o básico rola sempre Corpo a Corpo. O seletor aparecia
nas três e gravava o campo sem mudar número nenhum, e por isso ele foi **escondido** nelas em
2026-08-20. Esconder um controle que mentia não decidiu a regra.
**Precisa:** decidir se um golpe desarmado (ou com Faixas) pode usar a jogada de Ataque Amaldiçoado.
Se puder, o controle não volta para o card do item: o Ataque Básico existe sem item nenhum, então a
escolha mora na linha do golpe, na aba de Perícias e Testes.
**Anotado:** 2026-08-20, ao consertar os quatro buracos das Faixas

### BUG: `vagasHabilidade` não chega no orçamento que a tela mostra

**Onde:** `src/systems/afty/afty-derive.js` (`orcamentoHabilidades`, por volta da linha 1186) e
`resolveHabilidades` em `afty-habilidades.js`
**Situação:** existem **dois objetos de orçamento** no derivado, e eles nunca se somam.

| Objeto | `comum` sai de | Quem lê |
|---|---|---|
| `derived.habilidades` | SÓ o canal `vagasHabilidade` | ninguém na tela |
| `derived.orcamentoHabilidades` | SÓ `contadorHabilidades(maestria, patamar) × fatorSlots` | o criador |

Consequência: **tudo que emite `vagasHabilidade` promete uma vaga que não aparece.** Medido numa
criatura 100% raw, ND 12, Lutador 12, zero addons:

- Habilidade Geral **Especialização**: `comum` fica 8 com ela e sem ela. Ela GASTA uma vaga
  (`gerais: 1`) e não concede nenhuma.
- Treino Especial **Treinamento para Habilidade** (`tes_habilidade`): idem, 8 dos dois lados.
- O irmão dele, `tes_feitico`, funciona: emite `vagasFeitico`, e `exclusivasFeitico` vai de 1 para 2.

Efeito colateral: `derived.habilidades.excedeu` fica **true em qualquer ficha** com uma habilidade
escolhida e nenhum `vagasHabilidade`, porque ali `comum` é zero. Não aparece na tela (o criador lê o
outro objeto), mas é uma armadilha para quem escrever assert: um assert meu comparava esse campo e
passava à toa. Já corrigido em `t-concessao.mjs`, com o motivo escrito.

**Precisa:** o autor dizer qual é a regra, porque há duas leituras e elas dão números diferentes.
1. Os dois orçamentos são o MESMO, e `orcamentoHabilidades.comum` deve somar `vagasHabilidade` (e
   ganhar a linha de fonte no `partesComum`, para o hover dizer de onde veio).
2. São orçamentos SEPARADOS de propósito, e aí falta a tela do segundo.

Achado em 2026-08-20 ao montar um addon de teste com um Treino Especial que concede vaga.
**Anotado:** 2026-08-20, ao gerar os pacotes de teste dos Addons

### ASSUNÇÃO: `gemeosSemTecnica` abre as DUAS do Sem Técnica, e não só as nomeadas

**Onde:** `src/systems/afty/afty-origens.js` (`opcoesVerdadeirasOrigens`)
**Situação:** o autor pediu (2026-08-21) que o Gêmeo pudesse copiar **Estudos Dedicados** e
**Empenho Implacável**. A liberação foi implementada tirando o **Sem Técnica inteiro** da lista de
proibidas, e não nomeando as duas.

Hoje o resultado é idêntico: o Sem Técnica tem três características, e a terceira é o Bônus em
Atributo, que o filtro genérico já tira de toda origem. Sobram exatamente as duas.

**Onde isso diverge:** no dia em que o Sem Técnica ganhar uma QUARTA característica, ela entra
sozinha na lista do Gêmeo, sem ninguém decidir. É o mesmo envelhecimento calado do requisito `nota`.
**Precisa:** o autor dizer se a regra é "o Gêmeo pode copiar do Sem Técnica" (e aí está certo como
está) ou "o Gêmeo pode copiar estas duas" (e aí a liberação tem de nomeá-las).
**Anotado:** 2026-08-21, ao implementar a segunda liberação

### BUG: a categoria da Aptidão nunca aparece na Ficha Final

**Onde:** `src/systems/afty/ficha/ficha-conteudo.js` (a tag do grupo `aptidao`)
**Situação:** a linha monta a tag com `getCategoriaAptidao(a.categoria)?.nome`, e a categoria não tem
campo `nome`: ela tem `label` ("Aptidões Especiais") e `tab` ("Especiais"). O `?.` devolve
`undefined`, o `filter(Boolean)` o joga fora, e **as 85 Aptidões aparecem na Ficha sem a categoria
delas**, sem erro nenhum no caminho. É a mesma família do efeito descartado calado.
**Precisa:** trocar `.nome` por `.tab` (a tag é curta, e "Especiais" cabe melhor que "Aptidões
Especiais") ou por `.label`. É uma palavra, mas MUDA A APARÊNCIA de toda a lista de Aptidões da
Ficha, e por isso não foi feito junto: não foi pedido.
**Anotado:** 2026-08-28, de passagem, ao pôr os números do Domínio Simples na mesma linha de tags

### Coleta de Talismãs concede shikigami e a aba de Invocações não sabe

**Onde:** `asserts/exemplo-estilo-liberado.json` (o Talento `coleta_de_talismas`)
**Situação:** o Talento dá um shikigami de 4° grau, e mais um de 3°, 2° e 1° nos níveis 5, 10 e 15.
A aba de Invocações **não tem orçamento**: a pessoa cria a invocação que quiser, e nada conta quantas
ela pode ter. Então o Talento entra como texto e a criação acontece à mão, do jeito que já acontece
com toda invocação.
**Onde isso incomoda:** o "conforme as regras padrão de invocações" fica com o Mestre, e ninguém
avisa se a pessoa criar cinco talismãs em vez de um.
**Precisa:** o autor dizer se a Invocação vai ganhar orçamento algum dia. Se ganhar, este Talento é
o primeiro cliente, e o canal seria algo como `vagasInvocacao` por grau.
**Anotado:** 2026-08-22

### O Domínio Simples remendado perdeu a Durabilidade, e outra Aptidão a cita

**Onde:** `asserts/exemplo-estilo-liberado.json` (o remendo em `dominio_simples`)
**Situação:** o texto novo do autor troca o parágrafo inteiro de Concentração e Durabilidade por
"pagar 2 PE para sustentar". Nenhum número do Afty lia aquela Durabilidade (ela era só texto), então
o motor não sente. Mas o **Anular Técnica** (`anular_tecnica`) diz *"Você aprimora o seu domínio
simples"* e pede `dominio_simples` como pré-requisito, e outras entradas citam o Domínio Simples no
texto delas sem saber que ele mudou.
**Precisa:** o autor conferir se alguma outra Aptidão de Domínio precisa acompanhar a mudança.
**Anotado:** 2026-08-22

### `remendadoPor` existe e nenhuma tela mostra

**Onde:** `src/systems/afty/afty-addons.js` (`remendarLista`)
**Situação:** uma entrada remendada por Addon carrega `remendadoPor: [{ id, nome }]`, e nada na
interface diz que aquela linha não é mais a do livro. Quem abre a ficha de outra mesa lê o Domínio
Simples com sustentação em PE e não tem como saber que aquilo veio de um pacote.

O chip de "não raw" no cabeçalho da Ficha já avisa que a criatura tem Addon, mas ele não aponta QUAL
linha mudou.
**Precisa:** decidir onde a marca aparece. O candidato natural é o mesmo chip verde das fontes
concedidas, na linha da entrada.
**Anotado:** 2026-08-22, ao construir o remendo

### Os números da Natureza Amaldiçoada estão escritos em DOIS lugares

**Onde:** `src/systems/afty/afty-efeitos-conteudo.js` (`ORIGEM_EFEITOS.maldicao`) e
`src/systems/afty/afty-origens.js` (`ORIGEM_ESCOLHA_EFEITOS.vo_maldicao_natureza_amaldicoada`)
**Situação:** as duas linhas da Natureza Amaldiçoada (`vagasAptidao: 1 + (nd >= 10) + (nd >= 15)` e
`pe: nd`) foram COPIADAS para o segundo lugar em 2026-08-29, para a característica copiada em
Verdadeiras Origens trazer os números dela.

A cópia é literal e existe por um motivo estrutural: `ORIGEM_EFEITOS` é chaveado pela ORIGEM inteira,
e a Maldição tem três características. Não há como perguntar àquele mapa qual linha pertence à
Natureza Amaldiçoada.

**Onde isso quebra:** o dia em que a Maldição ganhar uma quarta característica COM NÚMERO, ou em que
os números da Natureza Amaldiçoada mudarem no livro. A Maldição de verdade muda e o Gêmeo que copiou
continua no valor velho, em silêncio. Há assert prendendo a igualdade dos dois lados, então o
sintoma aparece ao rodar `npm run asserts`, mas só se alguém rodar.
**Precisa:** se aparecer uma terceira característica com número, quebrar o `ORIGEM_EFEITOS` por
característica de vez, em vez de copiar de novo.
**Anotado:** 2026-08-29

### Requisito de Aptidão do tipo `origem` não enxerga a origem COPIADA

**Onde:** `src/systems/afty/afty-aptidoes.js` (`avaliarRequisitoAptidao`, `ctx.origemId ===
requisito.id`) e `AftyCreatureBuilder.jsx`, que passa `draft.core?.origem?.id`
**Situação:** o Talento já respeita `origensQualificadas` no requisito de origem desde 2026-08-07,
porque o texto do Gêmeo diz *"considera a origem escolhida como sua para todos os fins de
qualificação"*. A Aptidão continua comparando com a origem GRAVADA.

Hoje só uma aptidão tem esse requisito, e ela pede o **Herdado**. Então um Gêmeo que copiasse uma
característica de clã Herdado deveria alcançá-la e não alcança.
**Onde isso vai doer mais:** se alguma Aptidão de Maldição ganhar `{ tipo: "origem", id: "maldicao" }`
algum dia, o Gêmeo que copiou da Maldição veria a aba e não conseguiria pegar a aptidão.
**Precisa:** o autor dizer se "todos os fins de qualificação" cobre Aptidão Amaldiçoada. Se cobrir, é
trocar por `origensQualificadas().includes(...)`, do mesmo jeito que o Talento faz.
**Anotado:** 2026-08-29, ao ligar a origem estrutural

### Conceder FEITIÇO no meio da luta ainda não dá

**Onde:** `src/systems/afty/afty-concessao.js` (`FAMILIAS_CONCESSAO`)
**Situação:** a primitiva 8.3 concede as **7 famílias de id de catálogo**, e o autor pediu
"Habilidades de Especialização, **Feitiços**, Treinos e qualquer coisa". O Feitiço ficou de fora
porque ele NÃO é id de catálogo: é objeto criado dentro da ficha (`creature.feiticos`), então
conceder um não é acrescentar um id, é escolher **de onde copiar**. As outras seis famílias
entraram pelo mesmo caminho de uma linha cada, e esta precisa de uma interação nova.
**Precisa:** decidir de onde vem o Feitiço concedido. Três leituras que já dão telas diferentes:
copiar de outra criatura salva, escolher de uma lista que um addon traga pronta, ou o mestre
montar na hora com a calculadora de criação que já existe.
**Anotado:** 2026-08-20, ao fechar a 8.3

### Concessão de item com escolha aninhada entra com a escolha VAZIA

**Onde:** `src/systems/afty/afty-concessao.js` e os `resolveEscolhas*` das famílias
**Situação:** vários Talentos e Habilidades têm escolha aninhada (qual atributo, qual perícia, qual
estilo). A escolha mora em `creature.escolhasTalento` / `escolhasHabilidade`, que são campos da
FICHA, e a concessão vive na sessão e não encosta na ficha. Resultado: conceder um item com escolha
aninhada faz valer o que ele dá sem escolha, e a parte que dependia da escolha fica em nada.
Não é silencioso a ponto de enganar (o item aparece na lista de concedidos), mas também não avisa.
**Precisa:** decidir se a escolha da concessão vai junto na pega (um campo `escolhas` ao lado do
`alvo`, que já existe para o Treino Especial) ou se concessão com escolha simplesmente não é
oferecida. O `alvo` já abriu meio caminho.
**Anotado:** 2026-08-20, ao fechar a 8.3

### "Agilidade no Campo de Batalha" nasceu no Conjurador, e o Ápice do Controlador a cobra
**Onde:** `src/systems/afty/afty-alto-nivel.js` (`api_rei_do_tabuleiro`) e
`src/systems/afty/afty-habilidades.js` (`cnj_agilidade_no_campo_de_batalha`)
**Situação:** o Ápice *Rei do Tabuleiro* (Controlador 20°) sempre citou "Agilidade no Campo de
Batalha" como requisito `nota`, porque a habilidade não existia no Afty. Em 2026-08-12 ela entrou,
vinda da versão **2.0** do livro, mas como habilidade de **Conjurador** de 6° nível. O texto do
Ápice bate com ela ("o custo para utilizar Agilidade no Campo de Batalha se torna zero, além de
você poder a utilizar uma segunda vez dentro de seu turno" contra "gastar 2 pontos de energia para
realizar uma segunda ação bônus"), então provavelmente é a mesma. Apontar o requisito para o id
dela transformaria o Ápice do Controlador em exigência de **multiclasse** Conjurador 6, e por isso
ficou como `nota`.
**Precisa:** o autor dizer se o Controlador tem a versão dele da habilidade (que ainda não foi
transcrita) ou se o Ápice passa a exigir a do Conjurador. Se for a segunda, é trocar a `nota` por
`{ tipo: "habilidade", id: "cnj_agilidade_no_campo_de_batalha" }`.
**Anotado:** 2026-08-12, ao transcrever a primeira habilidade `[2.0]`

### Com a Expansão de Domínio no ar, dá para COMPRAR o 6° e o 7° nível de trilha
**Onde:** `src/systems/afty/afty-aptidoes.js` (`resolveNiveisAptidao`) e o `NivelPicker` do criador
**Situação:** as duas metades nasceram no mesmo dia, de lados diferentes. A Expansão de Domínio
(GoliasK) sobe o nível E o limite de Aura, Controle e Leitura e Energia Reversa em 2, e a
Versatilidade Extrema (mesma data) obrigou a ALOCAÇÃO a respeitar o limite da trilha em vez do 5
fixo. Juntas, elas fazem o seletor de níveis oferecer o 6° e o 7° enquanto o domínio está ligado na
bancada, gastando orçamento comum.
Não é destrutivo: o aparo é de leitura, então desligar o domínio devolve o ponto ao orçamento e a
trilha volta a 5. Mas é compra PERMANENTE dentro de uma janela TEMPORÁRIA, e ninguém decidiu isso.
**Precisa:** o autor dizer se o limite temporário deve valer só para concessão (aí a alocação passa
a ser aparada no limite PERMANENTE, e é uma linha) ou se comprar ali é legítimo.
**Anotado:** 2026-08-12, ao integrar o commit 985bb79 com o trabalho local

### ASSUNÇÃO: o limite da Versatilidade Extrema SOMA ou para no 6
**Onde:** `src/systems/afty/afty-efeitos-conteudo.js` (`LENDARIA_EFEITOS_ALVO`)
**Situação:** a Lendária diz "você pode aumentar o limite de um Nível de Aptidão **para 6**", que é
um número absoluto. O canal `limiteAptidao` é SOMA desde que nasceu, e a soma é a convenção do
sistema (duas fontes na mesma trilha levam o teto a 7, como está escrito na sessão de 2026-07-29).
Numa trilha em que nada mais mexeu as duas leituras dão o mesmo 6, e elas só divergem se outra
fonte de limite cair na MESMA trilha: somando dá 7, absoluto para em 6.
**Precisa:** o autor confirmar a soma ou pedir o teto absoluto. É uma linha.
**Anotado:** 2026-08-12, na entrada da Versatilidade Extrema

### ASSUNÇÃO: em que ORDEM o Ritual e a Liberação Máxima se compõem
**Onde:** `src/systems/afty/afty-feiticos.js` (`calcularFeiticoDano` e `calcularFeiticoCurativo`)
**Situação:** os dois suplementos mexem nos mesmos números e **nenhum dos dois textos fala do
outro**. A Expansão de Área do Ritual SOMA metros e a melhoria Área da Liberação DOBRA. O Aumento
de Alcance do Ritual SOMA e a Expansão de Limites da Liberação MULTIPLICA.

Hoje o motor **multiplica primeiro (Liberação) e soma depois (Ritual)**. O critério foi que os
metros do Ritual estão escritos em ABSOLUTO no texto dele: somar antes faria a Liberação dobrar
também o bônus do Ritual, e aí os números impressos na regra do Ritual deixariam de bater com a
tela. Exemplo real, Feitiço de Nível 4 em área: base 12m, com as duas vira `(12 × 2) + 1,5 = 25,5m`.
Na outra ordem daria `(12 + 1,5) × 2 = 27m`.

CD e Acerto não têm essa dúvida: os dois lados somam, e soma não tem ordem.
**Precisa:** o autor confirmar a ordem ou inverter. É uma linha em cada calculador.
**Anotado:** 2026-08-10, no merge com a Conjuração em Ritual

### ASSUNÇÃO: Estímulo de Saída num Auxiliar de vários alvos
**Onde:** `src/systems/afty/afty-feiticos.js` (`calcularEfeitoAux`)
**Situação:** o valor de um efeito auxiliar se DIVIDE entre os alvos. O Estímulo de Saída foi
somado **depois** dessa divisão, então cada alvo recebe o bônus inteiro da melhoria. Somar antes
faria a mesma Liberação Máxima valer menos em cada alvo quanto mais alvos o Feitiço tivesse, e o
texto da melhoria fala do "valor do bônus", que é o número que chega em quem recebe.
**Precisa:** o autor confirmar ou inverter. É uma linha de código, mas muda bastante o valor de
um Auxiliar de área.
**Anotado:** 2026-08-09, chat de Liberações Máximas (não foi perguntado, apareceu na implementação)

### ASSUNÇÃO: Otimização de Energia vale só para Ação com Custo
**Onde:** `src/systems/afty/afty-invocacoes.js` (`resolveAcao`)
**Situação:** a habilidade diz *"escolher uma habilidade com custo de cada invocação para ter esse
custo reduzido em 1PE"*. Foi implementada valendo só para **Ação com Custo**, que é o termo
definido do capítulo. A outra leitura possível é "qualquer ação que tenha custo", e aí ela também
morderia os **2 PE obrigatórios da Cura**, que são custo de regra e não a mecânica opcional.
**Precisa:** o autor confirmar. É uma condição só, no ponto em que hoje se lê `acaoComCusto`.
**Anotado:** 2026-08-16, ao ligar a habilidade

### ASSUNÇÃO: Crítico Aprimorado desce a margem só das JOGADAS DE ATAQUE
**Onde:** `src/systems/afty/afty-invocacoes.js` (`margemCritico`) e `ficha/abas/AbaInvocacoes.jsx`
**Situação:** o texto diz *"Um 19 se torna crítico também para suas invocações"*, sem dizer em quê.
Como ele é pré-requisitado por Crítico Brutal, que fala de acertos críticos em ação de ataque, a
margem 19 foi aplicada só às Jogadas de Ataque da invocação. Perícias e Testes de Resistência dela
continuam em 20.
**Precisa:** o autor confirmar, ou dizer que vale para toda rolagem dela.
**Anotado:** 2026-08-16, ao ligar a habilidade

### A Transformação aceita o MESMO efeito em vários slots
**Onde:** `src/systems/afty/afty-feiticos.js` (`calcularFeiticoTransformacao`) e o
`TransformacaoEditor` em `AftyCreatureBuilder.jsx`
**Situação:** três Aumentos de Defesa nos três slots de uma Transformação passam sem aviso nenhum,
e o `Select` de cada slot oferece o catálogo inteiro. Já o **Múltiplos Efeitos** do Auxiliar
PROÍBE repetir (*"dois Aumentos de Defesa no mesmo Feitiço não existem"*, autor), e lá o seletor
nem mostra o efeito já usado (`efeitosDisponiveisMult`). As duas telas concedem conjuntos de
efeitos auxiliares, então a divergência parece descuido.
**Precisa:** o autor dizer se a Transformação segue a mesma regra. Se seguir, é filtrar o `Select`
pelo mesmo caminho que o Múltiplos Efeitos já usa.
**Anotado:** 2026-08-09, revisão de Transformação e Auxiliares

### FALTA o texto verbatim do Estudos, e o do Treinamento para Habilidade
**Onde:** `src/systems/afty/afty-treinos-especiais.js` (catálogo) e o card
`Interlúdios · Treinos Especiais` do criador
**Situação:** os Treinos Especiais (Interlúdios Adicionais, Livro do Narrador p. 22) ganharam
sistema em 2026-08-18. Dois estão no catálogo (**Treinamento para Feitiço** e **Treinamento para
Habilidade**) e o **Estudos** segue como cartão "em breve". Faltam DOIS textos, por motivos
diferentes:
- **Estudos** nem entrou no catálogo, porque só existe a paráfrase da aba ("4 testes de INT/SAB,
  CD 12 + maestria, 2 sucessos concedem maestria, ou 3 testes CD 15 + nível para especialista").
- **Treinamento para Habilidade** já funciona (vaga e teto), mas a `descricao` dele **ainda é a
  paráfrase antiga** ("4 testes de um atributo, CD 12 + metade do nível, 3 sucessos concluem"). O
  autor mandou construir o Treino antes de mandar o texto. Só o mecanismo foi confirmado por ele.

Nenhuma das duas paráfrases foi conferida contra o livro.
**Precisa:** o autor mandar o texto de cada um. Entram como DADO no catálogo (`id`, `nome`,
`focos`, `vezesACada`, `concede`, `descricao`, `efeitos`), sem tocar em código. No Estudos isso
apaga o `InterludioInfo` correspondente, e no Treinamento para Habilidade é só trocar a string. O
Estudos provavelmente é o primeiro a usar o campo `alvo` da instância (ele nomeia uma perícia) e o
canal `proficienciaPericia`.
**Anotado:** 2026-08-18, ao criar os Treinos Especiais

### DECIDIR: fonte display baixada para a Ficha (arquivo no repositório)
**Onde:** `public/` mais um `@font-face` em `src/systems/afty/ficha/ficha.css`
**Situação:** o tema Santuário Malevolente (Sukuna) pede uma display com peso e verticalidade, e
**tema nenhum consegue trazer fonte**: `@import` é removido pelo `saneiaCss` e `@font-face` não vale
dentro de `@scope`, ou seja, morre exatamente quando o escopo funciona. Hoje o tema usa pilha mincho
do sistema (`Yu Mincho`, `Hiragino Mincho ProN`, `Songti SC`, `MS PMincho`) com Georgia atrás, e
compensa na ESCALA. Funciona, mas o resultado muda de máquina para máquina: quem não tem mincho cai
no Georgia.
**Precisa:** o autor decidir se quer um `.woff2` no repositório. É barato (um arquivo em `public/` e
um `@font-face` na folha), mas **é mudança de app, não de tema**: a fonte passaria a existir para
TODAS as fichas, e o peso do arquivo entra no bundle de todo mundo. Se sim, definir também a licença
da fonte escolhida.
**Anotado:** 2026-08-18, ao montar o tema do Sukuna

### ASSUNÇÃO: Treinamento para Feitiço vale para Restringido e Sem Técnica
**Onde:** `src/systems/afty/afty-treinos-especiais.js` (`tes_feitico`)
**Situação:** o texto diz "Feitiço", e o Restringido não tem Feitiço (tem Habilidade Marcial) e o
Sem Técnica também não (tem Técnica de Estilo). Foi deixado **aberto a toda origem**, porque a vaga
que ele concede é o canal `vagasFeitico`, cuja própria nota diz que ela vale para "Feitiço, Estilo
das Sombras ou Habilidade Marcial", e porque o `deriveAfty` já soma `feiticos + estilo` no mesmo
gasto. Se estivesse errado, o conserto é um `foraDaOrigem: [...]` na entrada, igual às cinco Linhas
de energia amaldiçoada.
**Precisa:** o autor confirmar, ou dizer quais origens ficam de fora.
**Anotado:** 2026-08-18, ao criar os Treinos Especiais

---

## AFTY — Feitiços

### LARGURA DE LINHA não existe no modelo de área
**Onde:** `src/systems/afty/afty-feiticos.js`
**Situação:** a área de um Feitiço é UM número. Linha e Cone são esse número × 1,5 (o
comprimento), e **largura nunca foi modelada**. Existe só um resto de comentário citando
`trocas.larguraLinhaSteps`, que nenhum código lê nem escreve.
Isso já tem consequência: a melhoria **Área** da Liberação Máxima diz *"Linhas ganham o dobro de
sua Largura também"*, e essa metade da regra não tem onde cair. Hoje ela dobra só o comprimento.
**Precisa:** largura de linha como dado de verdade (largura base por nível, e provavelmente uma
troca do guia para alterá-la), e aí a melhoria Área passa a dobrar as duas dimensões.
**Anotado:** 2026-08-09, autor, no chat de Liberações Máximas: *"ANOTE ISSO, VAMOS PRECISAR DA
LARGURA DA LINHA, pq eu esqueci disso."*

### Estímulo de Saída cobre 6 dos 17 efeitos auxiliares
**Onde:** `src/systems/afty/afty-liberacoes.js` (`ESTIMULO_EFEITOS`)
**Situação:** o texto da melhoria lista *"Defesa, Acerto, Perícia, CD, Testes de Resistência"*, e
só esses foram ligados (`defesa`, `ataque`, `rolagem`, `prejuizoRolagem`, `cd`, `tr`). Ficaram de
fora, sem decisão: `rd`, `atributo`, `movimento`, `margemCritico`, `negacaoRd`, `alcanceCaC`,
`alcanceDistancia`. Os 4 do grupo de dano (`danoDurante`, `danoApos`, `danoFixo`, `niveisDano`)
são de propósito: quem cuida deles é a Explosão Extrema.
**Precisa:** o autor decidir um a um quais dos 7 restantes entram. Entrar é acrescentar o id ao
Set, nada mais.
**Anotado:** 2026-08-09, autor: *"Faça somente os que estão escritos e anote. Vou verificar um a
um depois. Para ir adicionando todos os tipos."*

### Liberação Máxima em Feitiços ESPECIAIS e PASSIVOS
**Onde:** `src/systems/afty/afty-liberacoes.js` (`categoriasDoFeitico`)
**Situação:** só Dano, Auxiliar e Curativo podem virar Liberação Máxima. O suplemento mapeia
Dano na Doutrina da Destruição e Auxiliar/Curativo no Manto da Proteção, e não diz nada dos
Especiais nem dos Passivos. Golpeador e Dano na Alma causam dano e provavelmente vão para a
Doutrina, mas Itens, Shikigami, Transformação e Invisibilidade não são nem um nem outro.
**Precisa:** decisão do autor por subtipo.
**Anotado:** 2026-08-09, autor: *"Os Especiais e Passivos deixamos para depois. Com calma."*

### Técnica Máxima não tem Liberação Máxima
**Onde:** `src/systems/afty/afty-liberacoes.js` (`LIBERACAO_CUSTO_PE`)
**Situação:** a tabela de custo do suplemento vai do Nível 3 ao 5. A Técnica Máxima (`"max"`,
um degrau acima do 5) fica de fora, e o motor a rejeita.
**Precisa:** nada por ora. O autor respondeu *"Por enquanto ainda não"* quando perguntado se a
Técnica Máxima podia ser Liberação. Reabrir quando ele decidir.
**Anotado:** 2026-08-09, chat de Liberações Máximas (pergunta 8)

### Limite de uma Liberação Máxima por Cena ou Combate é só texto
**Onde:** `src/systems/afty/ficha/` e `src/systems/afty/encontros/`
**Situação:** a regra existe e aparece escrita, mas nada na Ficha Final nem no Encontro conta o
uso. O jogador pode declarar quantas quiser.
**Precisa:** um marcador de gasto na sessão, se o autor quiser rastrear.
**Anotado:** 2026-08-09, autor: *"Por enquanto Regra Escrita."*

---

## AFTY — fragilidades achadas por assert

### Importar `afty-habilidades.js` PRIMEIRO estoura um ciclo
**Onde:** `src/systems/afty/afty-combate.js` linha 36, `POSTURA_OPCOES`
**Situação:** `await import("afty-habilidades.js")` como primeiro módulo do processo morre com
*"Cannot access 'POSTURAS_DE_COMBATE' before initialization"*. É ciclo entre `afty-habilidades.js` e
`afty-combate.js`, e a ordem de avaliação só fecha certo quando alguém entra pelo `afty-derive.js`.
**Confirmado ANTERIOR a 2026-08-20:** a mesma falha acontece com o arquivo do HEAD, então não veio
dos Addons. Hoje é latente porque o app entra sempre pelo derive e o `vite build` passa.
**Precisa:** ou quebrar o ciclo (mover `POSTURAS_DE_COMBATE` para um módulo folha, no espírito do
`afty-pericias-catalogo.js`), ou aceitar e deixar escrito que `afty-derive.js` é a única porta de
entrada. Enquanto não, todo assert novo tem de importar o derive primeiro.
**Anotado:** 2026-08-20, ao escrever os asserts do registro de Addons

---

## AFTY — sobras do code review de 2026-08-09

> As quatro que eram conserto puro (buff duplicado na aba Buffs, iniciativa negativa impossível,
> painel de fontes escapando do tema e os dois `useMemo` faltando) foram **feitas em 2026-08-10**.
> Ver a sessão daquele dia em `afty-status.md`. O que sobrou aqui depende de decisão sua.

### Encontro duplicado herda o estado mas perde a iniciativa
**Onde:** `src/systems/afty/encontros/afty-encontro.js` (`duplicarEncontro`)
**Situação:** o autor decidiu (2026-08-09) que a cópia herda PV, PE, buffs, condições e flags,
porque duplicar serve para ramificar uma luta em andamento. Mas a cópia continua voltando para
`status: PLANEJANDO` e com a **iniciativa zerada**, que é o comportamento de quem quer um molde
novo. Para ramificar de verdade, a ordem de turno e a rodada também teriam que vir junto.
**Precisa:** o autor dizer se duplicar deve preservar iniciativa, rodada e status, ou se são dois
comandos diferentes ("duplicar como molde" e "ramificar").
**Anotado:** 2026-08-09, ficou de fora do conserto por ser escolha de produto, não bug

### Remover habilidade do catálogo não avisa ninguém
**Onde:** `src/systems/afty/afty-habilidades.js` (`resolveHabilidades`)
**Situação:** id que não existe mais é descartado em silêncio (`if (!BY_ID[id]) continue`), e os
`inacessiveis` só reportam habilidades que existem. Uma ficha salva com a habilidade abre sem ela e
com uma vaga livre que apareceu do nada. ⚠ **Não é regressão da remoção de "Liberações
Expandidas"**: é como o catálogo sempre funcionou, e "Teste de Resistência Mestre" saiu em julho
pelo mesmo caminho. Hoje só morde o rascunho automático do autor.
**Precisa:** decidir se vale um aviso de "esta ficha tinha N escolhas que não existem mais".
**Anotado:** 2026-08-09, code review

---

## AFTY — Interlúdios (varredura de 2026-08-26)

Os buracos que a revisão das 12 Linhas de Treinamento achou. Todos são **canal que
não existe**, e não erro no catálogo: o texto de cada etapa está verbatim e no lugar.
O que já dava para consertar sem decisão de regra foi consertado na mesma sessão
(os 13 requisitos e a trava do Potencial Físico).

### Não existe orçamento LIVRE de atributo

**Onde:** `src/systems/afty/afty-treinamentos.js` (Potencial Físico, 2ª etapa)
**Situação:** ⚠ era um efeito MORTO até 2026-08-26. A etapa declarava
`{ tipo: "atributo", valor: 2 }`, e o `paraCanal` devolve null nesse tipo quando não há
alvo de instância. A linha não é repetível, então nunca houve alvo, e o efeito era
descartado calado desde que foi escrito. A declaração saiu e o benefício continua
verbatim no texto. A planilha (`AJ18`, em `afty-formulas-base.md`) confirma a intenção:
Potencial Físico 2ª = +2 Atributos.
**Precisa:** um canal de orçamento livre de atributo, o irmão do `pontosAptidao` do lado
do atributo, e ele nasce com três perguntas de regra: os 2 pontos respeitam o limite de
20 do atributo, somam no mesmo pool dos pontos de nível ou moram num pool próprio, e a
restrição aos três físicos (`ATRIBUTOS_FISICOS`, em `afty-dominios.js`) é do canal ou
da etapa. O canal `atributo` é direcionado e não serve.
**Anotado:** 2026-08-26, na varredura dos Interlúdios

### Não existe vaga extra de escolha aninhada

**Onde:** `src/systems/afty/afty-habilidades.js` (`resolveEscolhasHabilidade`)
**Situação:** Potencial Físico 4ª diz "Você recebe uma Dádiva do Céu adicional", e as
Dádivas são escolha aninhada de Restrito pelos Céus. O mecanismo que dá vaga a mais num
pool aninhado é o `concedeEscolha`, e ele lê **só** `escolhidasIds`, ou seja, vai de
habilidade para habilidade. Uma Linha de Treinamento não tem como emitir.
**Precisa:** ou um canal (`vagasEscolha`, com alvo sendo o id da habilidade dona), ou
estender `resolveEscolhasHabilidade` para aceitar concessões vindas do Motor. O segundo
caminho serve também para Addon, que hoje tem o mesmo teto.
**Anotado:** 2026-08-26, na varredura dos Interlúdios

### O teto de PER por uso vale a trilha, e o canal só alcança a linha de cura

**Onde:** `src/systems/afty/afty-cura.js` (`curaPontos`) e `afty-treinamentos.js` (Energia Reversa)
**Situação:** a 1ª etapa diz "A quantidade de pontos de energia reversa que você pode
gastar em **Aptidões de Energia Reversa** aumenta em 1". O canal `curaPontos` existe e
mira `cura_energia_reversa`, que é UMA linha de cura. A regra fala da trilha inteira
(Regeneração Aprimorada, Fluxo Constante, Reversão de Técnica), e essas outras aptidões
não têm teto de pontos modelado. Além disso `curaPontos` SUBSTITUI
(`max(porBloco, canal)`) em vez de somar, então um `+1` cru não faria efeito nenhum.
A 3ª etapa tem o mesmo feitio: reduz em 2 o custo de UMA aptidão nomeada, e não existe
canal de redução de custo por aptidão.
**Precisa:** decidir se o teto de PER por uso é um número da criatura (um canal só,
lido por toda aptidão de Energia Reversa) ou um número por aptidão. Só depois disso o
canal tem forma.
**Anotado:** 2026-08-26, na varredura dos Interlúdios

### Dois benefícios de Interlúdio esperam sistema que nunca chegou

**Onde:** `src/systems/afty/afty-treinamentos.js`
**Situação:** cada um espera um sistema inteiro, e não um canal:
- **efeito de crítico** por grupo de arma e de pugilato (Manejo de Arma 3ª, Luta Completo).
  A tabela de efeitos de crítico nunca foi enviada, e a palavra só aparece no texto destas
  duas etapas.
- **dados de vida por descanso** (Resistência 2ª). A pilha de dados de vida não é modelada,
  e três itens do capítulo de Equipamentos já a citam na descrição.

⚠ Eram quatro. O **máximo de paredes** (Barreiras 4ª) e a **rolagem de confronto de**
**expansões** (Domínios 1ª e 3ª) saíram em 2026-08-26, quando o autor mandou o Domínio ler o
Motor e deu a fórmula do Conflito.
**Precisa:** nada, por enquanto. A entrada existe para os dois não envelhecerem calados, que
é o que aconteceu com os 13 requisitos `nota`.
**Anotado:** 2026-08-26, na varredura dos Interlúdios

## AFTY — Guarda Inabalável (2026-08-26)

### ASSUNÇÃO: a Guarda drena ANTES das outras cascas de PV temporário

**Onde:** `src/systems/afty/ficha/ficha-sessao.js` (`drenaPvTemp`)
**Situação:** o autor respondeu que a Vida da Guarda entra no mesmo pote do PV temporário e
**acumula** com as outras fontes dele, mas não disse em que ordem o dano come as fontes. Está
implementado com a Guarda PRIMEIRO, por dois motivos: ela é a camada de fora (a criatura a reergue
toda rodada, e as outras cascas não voltam sozinhas), e ela precisa ser alcançável para a regra
funcionar como está escrita, senão uma casca comprada a blindaria e a Guarda ficaria praticamente
inquebrável.
**Onde isso ainda não morde:** a Guarda é hoje a ÚNICA fonte deste pote, então a ordem não muda
número nenhum. Ela passa a valer no dia em que uma segunda fonte de PV temporário existir, e a
primeira candidata é a entrada logo abaixo.
**Precisa:** o autor confirmar a ordem, ou dizer que a casca comprada some antes.
**Anotado:** 2026-08-26, ao construir a Guarda Inabalável

### O `pvTemporario` da bancada nunca chegou à sessão

**Onde:** `src/systems/afty/afty-derive.js` (`pvTemporario`) e `ficha/ficha-sessao.js`
**Situação:** achado ao converter o `pvTempAtual` em mapa por fonte. O canal `pvTemporario` existe,
é somado, aparece no Preview do criador com hover de fontes, e **nunca chegava à Ficha**: na sessão o
campo nascia em zero, só o `aplicaDano` o tocava (para baixo) e nada o subia. Quem emite hoje são
Fluxo, Brutalidade Aprimorada e Eliminar e Continuar, todos pela bancada de Simulação de Combate.

É o irmão exato do buraco que a Guarda acabou de tapar, e a mesma classe do efeito morto do Potencial
Físico 2ª: número calculado, mostrado, e jogado fora do outro lado.
**Precisa:** decidir QUANDO ele entra, porque a resposta muda o desenho. Se ele é casca de efeito
temporário ligado na bancada, ele não é da mesa e a Ficha não deveria mostrá-lo. Se ele é casca de
começo de cena, é uma linha no `iniciaCombate`, no molde do `peTemporario` do gatilho `combate`. Com
o mapa por fonte já pronto, o segundo caminho custa uma linha.
**Anotado:** 2026-08-26, ao construir a Guarda Inabalável

### As duas metades da Guarda não têm fonte no catálogo

**Onde:** `src/systems/afty/afty-efeitos.js` (canais `guardaBonus` e `guardaVida`)
**Situação:** os dois canais nasceram junto com a característica e **nenhuma entrada do livro os
emite**. Isso é de propósito e não é bug: foi a falta de DESTINO que deixou o Treino de Domínios sem
automação nenhuma até esta mesma data, e a Guarda é o tipo de número que um Addon vai querer mexer.
**Precisa:** nada agora. A entrada existe para os dois não envelhecerem esquecidos, e para quem
transcrever uma habilidade que fale de Guarda saber que o cano já está lá.
**Anotado:** 2026-08-26, ao construir a Guarda Inabalável

---

## AFTY — outros

### O filtro de patamar do Dashboard não lista Beyond
**Onde:** `src/components/Dashboard.jsx` (o `<select>` de patamar, dentro do painel de filtros)
**Situação:** o CARD já mostra Beyond certo desde 2026-08-17 (o autor liberou a linha no
`PATAMAR_STYLES`, que sem ela caía no fallback `?? comum` e rotulava toda criatura Beyond como
"Comum"). O **filtro** continua com os cinco patamares da 2.5.2, então em `/Afty` não dá para
filtrar por Beyond.
Não incluí na mesma liberação porque é outra superfície: a entrada no `PATAMAR_STYLES` é invisível
para a 2.5.2 (nenhuma criatura de lá é `beyond`), enquanto uma `<option>` nova **aparece** no
filtro da 2.5.2 e nunca casa com nada.
**Precisa:** o autor dizer se aceita a opção visível na 2.5.2, ou se prefere que ela só exista
quando o app está em `aftyMode` (o que exigiria passar a flag para o Dashboard).
**Anotado:** 2026-08-17, ao consertar o rótulo do card

### O Intermediário ocupa meio espaço e ninguém conta
**Onde:** `src/systems/afty/afty-invocacoes.js` (`espacosDeIntermediario`) e
`afty-equipamentos.js` (`resolveCarga`)
**Situação:** o capítulo diz, sem margem, *"Todo Intermediário ocupa meio espaço no inventário de
um personagem"*, e toda Invocação tem um (Talismã para shikigami, o próprio dispositivo para
Corpo Amaldiçoado). O número passou a ser **calculado e mostrado** no cabeçalho da aba em
2026-08-16, mas **não entra no `resolveCarga`**.
Não liguei porque a carga alimenta os penais de Sobrecarga (-Defesa e -Movimento), e um Controlador
de nível alto tem até 9 invocações, ou seja, 4,5 espaços que apareceriam do nada em fichas já
prontas. É mudança visível de número, e a decisão é sua.
**Precisa:** o autor dizer se liga. Se sim, é somar `derived.invocacoes.espacosIntermediarios` ao
`espacosUsados` antes do `resolveCarga`, no `deriveAfty`.
**Anotado:** 2026-08-16, ao dar tela ao tipo mecânico da Invocação

### O PV da Invocação não entra na sessão, e agora dói mais
**Onde:** `src/systems/afty/ficha/ficha-sessao.js`, `ficha/abas/AbaInvocacoes.jsx`
**Situação:** o PV que a aba mostra é o MÁXIMO, e não um recurso gasto. A sessão guarda os
recursos do dono e nada das invocações, então não há onde marcar o dano que um shikigami levou.
Isso era só incômodo enquanto a aba vivia na Ficha. **Em 2026-08-16 a aba entrou no painel de
Encontros**, que é exatamente onde o mestre precisa abater dano de uma invocação em campo, e aí a
falta virou buraco de uso.
Não é só somar um campo: o capítulo tem regra própria para invocação que chega a 0 (dissipada ou
desativada, volta com metade do PV até um descanso) e para dano excedente (exorcizada ou destruída,
sai da lista de vez), e o descanso precisaria saber restaurar essas barras.
**Precisa:** decidir se a sessão passa a guardar `invocacoes: { [id]: { pvAtual, estado } }`, com
`estado` em campo / dissipada / exorcizada, e o que o descanso faz com cada um.
**Anotado:** 2026-08-16, ao ligar as Invocações no painel de Encontros

### Shikigami: a redução permanente de PE não sai do painel
**Onde:** `src/systems/afty/afty-feiticos.js` (`calcularFeiticoShikigami`), `afty-derive.js`
**Situação:** o Feitiço de Criação de Shikigamis calcula `reducaoPE = 2 × nível` (Técnica Máxima
conta como Nível 6, então 12) e o painel do Feitiço mostra o número. **Ele nunca é descontado do
PE máximo do dono.** É o mesmo tipo de ligação de mão única que o `ajusteAcoes` e o custo tinham,
e que foi consertado do lado da invocação em 2026-08-15. Este ficou porque mexe na fórmula de PE
da criatura, e não na ficha da invocação.
**Precisa:** o autor confirmar quando a redução vale. O texto diz "enquanto existir", e o
shikigami existe desde que o Feitiço é criado, o que faria a redução ser sempre ativa, some ela
com quantos Feitiços de Shikigami a ficha tiver. Se for isso, é um canal de `pe` a menos no
derive.
**Anotado:** 2026-08-15

### Clã Zenin ficou com bônus de atributo livre
**Onde:** `src/systems/afty/afty-origens.js`
**Situação:** Gojo, Inumaki e Kamo têm `entre` com um par de atributos. O Zenin ficou livre entre
os 6, e não se sabe se foi decisão ou esquecimento.
**Precisa:** o autor dizer se o Zenin é restrito também e, se for, quais dois atributos.
**Anotado:** 2026-07-29, migrado de `afty-status.md` em 2026-08-09

### ~~Precisão (Melhoria de Controlador): "Ataque ou CD"~~ ✅ RESOLVIDO
**Onde:** `src/systems/afty/afty-habilidades.js` (`MELHORIA_EFEITOS_INVOCACAO`)
**Situação:** o texto diz *"+2 em Jogadas de Ataque ou CD"*, e não se sabia se era escolha do
jogador ou se valia para os dois.
**Resolvido:** o autor decidiu em 2026-08-15 que é **escolha do jogador**, feita por invocação
marcada. O marcador `mel_precisao` tem `opcoes` e o `quando` deixa passar só o lado escolhido.
**Anotado:** 2026-07-29, migrado de `afty-status.md` em 2026-08-09, fechado em 2026-08-15

---

## Migração pendente deste próprio arquivo

`afty-status.md` ainda tem pendências espalhadas pelas seções de sessão (~~Melhorias de
Controlador sem marcador por invocação~~ ✅ 2026-08-15, ~~Controle Disperso sem limite de
invocações ativas~~ ✅ 2026-08-15, Marca Registrada com a redução de PE desligada, subsistemas
nunca enviados como Apoio, Imitação, Votos e técnicas marciais, e a lista de retomada das
Especializações). Elas **não** foram
movidas para cá: seriam um diff enorme num arquivo que outros colaboradores também editam, e o
autor pediu padronização daqui para frente, não migração.

**Precisa:** o autor dizer se quer a migração completa. Se sim, é uma passada só, de preferência
logo depois de um commit, para o diff ficar isolado.
