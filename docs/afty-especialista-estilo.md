# Especialista em Estilo (Addon)

A variação do **Especialista em Técnicas** para o **Sem Técnica**. Fechada em 2026-09-07, a partir
do texto que o autor mandou em imagem. Leia junto com `afty-addons.md` (o sistema de Addons),
`afty-status.md` (estado do Afty) e `automacao-dsl.md` (o DSL).

> O pacote está em `addons/especialista-em-estilo.json` e o assert em
> `asserts/t-especialista-estilo.mjs` (88 asserts). O bloco 7 do assert é o que prova que nada
> disto vaza para quem não instalou.

---

## 1. O que o texto do autor É

Seis regras de **LEITURA** sobre habilidades que já existem, e não uma classe nova. É por isso que
o pacote tem 40 linhas de JSON em vez de 65 entradas: as habilidades do Conjurador estão todas
transcritas desde sempre, e o que muda é sobre o que elas falam.

| Habilidades de Conjurador | Quantas |
|---|---|
| Total | **65** |
| Citam "Feitiço" no texto (precisam de releitura) | 29 |
| Não citam Feitiço, Ritual nem Aptidão (valem como estão) | 27 |
| Com efeito ligado no Motor pelo `HABILIDADE_EFEITOS` | 14 |
| Com efeito ligado pelo `ESCOLHA_EFEITOS` (Focos e Energia Focalizada) | 7 |
| Requisitos apontando para uma irmã `cnj_` | 8 |

⚠ **A proporção baixa de habilidades ligadas não é culpa desta variação.** Ela é a frente aberta
que o cabeçalho do bloco CONJURADOR em `afty-efeitos-conteudo.js` já nomeava: quase todo poder do
Conjurador mexe em FEITIÇO, e o motor de Feitiços não lê o Motor de Automação. Trocar a régua não
liga o que nunca esteve ligado.

---

## 2. As seis decisões do autor (2026-09-07)

Todas por pergunta direta. Não re-decidir sem falar com ele.

| # | Pergunta | Resposta |
|---|---|---|
| 1 | Especialização própria ou folha de leitura do Conjurador? | **Própria, chamada "Especialista em Estilo".** |
| 2 | A trava do Conjurador para o Sem Técnica? | **Fecha no raw**, e o Addon abre a variação no lugar. |
| 3 | "Manter dois Estilos da sombra durante uma rodada"? | *"Não achei onde está escrito isso."* **Ficou de fora**, ver `a-fazer.md`. |
| 4 | Ritualizar Estilo? | **Procedimento de mesa por ora**, anotado no `a-fazer.md`. |
| 5 | Convive com o Conjurador em multiclasse? | **Não.** Com as outras, sim. |
| 6 | O −2 de Adiantar a Evolução vale para trilha também? | **Só requisito de Nível.** |

E o pedido que atravessa tudo, verbatim: *"Garanta que isso não vaze para quem não usa o Addon.
Isso é algo bem especifico de um contexto especifico e não deve afetar o raw do sistema."*

---

## 3. A tese: a variação HERDA, não copia

O caminho óbvio era o addon carregar as 65 habilidades no JSON com o texto trocado. Foi recusado
pelo mesmo "não cabe" que criou a família `clas` em 2026-08-31: uma cópia congelada do livro dentro
de um addon dá **dois donos** a cada errata, e ninguém sincroniza os dois.

O que entrou no motor foi o VERBO, e o addon ficou com o substantivo:

```
herdaDe: "conjurador"          esta Especialização É aquela, com mudanças
remendaHabilidades: { ... }    e estas aqui eu reescrevo
```

O addon declara **duas** habilidades. As outras 63 chegam pela herança.

### O que o clone muda

| Campo | O que acontece |
|---|---|
| `id` | vira `<idDaHerdeira>__<idOriginal>` |
| `especializacaoId` | vira o da herdeira |
| `requisitos` | `habilidade.id` e `escolha.habId` que citam uma IRMÃ clonada passam a citar o clone dela |
| `efeitos` | copiados do `HABILIDADE_EFEITOS` para DENTRO da entrada |
| `herdadaDe` / `herdadaPor` | marcas de rastreio, lidas por `habilidadeHerdadaDe()` |

### O que o clone NÃO muda, e por quê

**Os ids das OPÇÕES de escolha aninhada.** As sete Mudanças de Fundamento e os três Focos
Amaldiçoados são as mesmas opções do livro, e o efeito de cada uma mora no `ESCOLHA_EFEITOS`
chaveado pelo id da opção. Renomear mataria os sete de uma vez. A escolha gravada na ficha acaba
compartilhada com a classe-mãe, e isso é inofensivo porque as duas **não podem conviver**.

**As EXPRESSÕES.** Elas citam `esc_conjurador`, e a resposta não foi busca e troca em texto de DSL.
Foi a outra metade da herança:

> ⚠ **`deriveAfty` publica o nível da herdeira TAMBÉM sob o nome da mãe.** Um Especialista em
> Estilo de nível 12 tem `esc_conjurador = 12` e `esc_especialista_em_estilo_esp_estilo = 12`, os
> dois. Isso resolve as 16 expressões clonadas de uma vez, sem tocar em uma linha de texto.

⚠ **Por isso o JSON do addon escreve `esc_conjurador`** nos efeitos que ele mesmo declara. Parece
estranho num pacote chamado Especialista em Estilo, e é de propósito: o nome próprio da variável
depende do id do PACOTE, então renomear o pacote quebraria a expressão calada. O nome da mãe é
estável.

---

## 4. Os dois bloqueios que estavam no caminho

Nenhum dos dois era desta variação. Os dois valiam para **qualquer** Especialização de Addon, que é
família ligada desde 2026-08-20, e nenhum tinha sintoma visível.

### 4.1 O `esc_` de uma Especialização de Addon era um nome impossível

`afty-efeitos.js` montava a variável como `esc_${id}` cru. Id de Addon nasce com o namespace do
pacote, então ela virava `esc_meu-pacote:esp_x`, e o tokenizer do DSL para no `-` e no `:`. A chave
existia no contexto e **nenhuma expressão conseguia escrevê-la**.

O conserto foi passar `esc_`, `nivel_` e `tem_` pelo `normalizarVariavel`, que já existia em
`afty-dsl.js` e que os estados de combate já usavam. ⚠ Nos ids do livro a função é a **identidade**
(todos são `[a-z0-9_]`), e o bloco 2 do assert varre os três catálogos inteiros medindo isso: se um
dia ela mexer num id do raw, toda expressão do motor troca de alvo calada.

### 4.2 O vocabulário do DSL era uma fotografia do raw

`VOCABULARIO_DSL` era um `const` de módulo, avaliado no import. Os religadores de Addon dão
`splice` nos catálogos **depois** disso, então nada de Addon entrava na lista, e o comentário que
mora em cima da constante explica exatamente o estrago: expressão que cita identificador não
declarado cai no fallback INTEIRA e calada.

Virou `vocabularioDoMundo()`, com cache pela `epocaAddons()`. A época só troca quando o conjunto de
addons troca, que é a mesma dependência que o `useMemo` do builder já usa.

---

## 5. O que entrou no motor (e por que não vaza)

Tudo abaixo é **verbo**, existe sempre, e é inerte sem alguém declarando.

| Peça | Onde | Inerte porque |
|---|---|---|
| `herdaDe` | `afty-especializacoes.js` | nenhuma das 6 do livro declara |
| `restritaOrigemIds` | `afty-especializacoes.js` | idem |
| `incompativeisIds` | `afty-especializacoes.js` | idem |
| `especializacoesVetadas` | `afty-origens.js` | **exceção: o Sem Técnica declara.** É regra do livro, ver 5.1 |
| Canal `reduzNivelAptidao` | `afty-efeitos.js` | nenhum efeito do raw o emite, e ele só aparece no seletor com `permite: ["requisitoAptidao"]` |
| Clonagem por herança | `afty-habilidades.js` | só roda com alguma Especialização declarando `herdaDe` |
| `ordem` no registro de famílias | `afty-addons.js` | padrão 50, e só duas famílias a declaram |

⚠ **A `ordem` nasceu aqui e é a peça mais fácil de esquecer.** A família `habilidades` (ordem 20)
LÊ o catálogo de `especializacoes` (ordem 10) já religado. Até esta data a ordem de religação era a
de inserção no `Map`, que é a ordem de **import dos módulos**: um acidente do grafo de
dependências, e portanto uma coisa que ninguém pode ler no código nem confiar.

### 5.1 A única mudança de regra no raw

A origem Sem Técnica passou a vetar o Conjurador **de verdade**. A frase *"Não pode ter a
especialização Especialista em Técnicas"* estava no `restricoes` desde sempre e era só um chip
vermelho: `especializacoesDisponiveis` filtrava por `exclusivaOrigemId` e mais nada, então o
criador deixava um Sem Técnica marcar Conjurador contra o próprio livro.

⚠ **Existe ficha gravada com o par proibido, e ela continua abrindo.** O que o
`normalizeEspecializacoes` descarta, a aba Especializações **diz** que descartou, por
`especializacoesRecusadas`. Descartar calado seria confiscar a escolha do jogador sem avisar.

### 5.2 Dois buracos velhos que apareceram no caminho

Os dois estavam no `prefixarEntrada` e nos `caminhosDeId`, e os dois falhavam em silêncio.

| Buraco | Sintoma |
|---|---|
| `caminhosDeId` não sabia tratar **lista de string** (`incompativeisIds[]`) | o caminho casava o `if`, o `sub` vazio derrubava a condição, e a lista ficava crua |
| A família `habilidades` não declarava `especializacaoId` | um pacote com a Especialização E as habilidades dela era **reprovado inteiro**, com "especializacaoId inexistente" |

O segundo nunca tinha aparecido porque o único exemplo escrito (`docs/afty-addons.md`) pendura as
habilidades numa classe do LIVRO, e referência ao livro fica crua de propósito.

---

## 6. As duas habilidades remendadas

O resto do texto do autor é regra de leitura e mora no `descricao` da Especialização, que a aba
passou a renderizar (também inerte no raw: as 6 do livro têm `descricao` vazia).

### Conjuração Aprimorada

Junta a regra 5 (*"substituindo o nível do feitiço por nível em controle e leitura"*) com a regra 4
(*"você recebe uma nova técnica de estilo todo nível par"*), que no livro é a metade final desta
mesma habilidade.

```json
{ "canal": "vagasEstilo", "expr": "piso(esc_conjurador / 2)" }
```

⚠ **`vagasEstilo` e não `vagasFeitico`.** É a decisão 18 do `afty-addons.md`: vaga exclusiva de
Estilo, que não serve para Feitiço nem para Habilidade Geral. O canal já existia.

⚠ **`esc_` e não `nivel_`**, porque é efeito que ESCALA, e essa é a convenção do projeto. Mesmo
caminho do `cnj_energia_inacabavel`.

Medido no assert: ND 4 dá 2 vagas, ND 7 dá 3, ND 8 dá 4, ND 20 dá 10.

### Adiantar a Evolução

No livro ela antecipa o acesso a Feitiços de nível superior, que não existe para o Sem Técnica.
Vira o −2 nos pré-requisitos de nível das Aptidões.

```json
{ "canal": "reduzNivelAptidao", "expr": "2" }
```

⚠ **Só o requisito `nd`**, nunca o de `trilha` (decisão 6). Uma Aptidão que pede AU 3 continua
pedindo AU 3.

⚠ **Piso de Nível 1.** Sem ele um requisito de Nível 2 viraria Nível 0, que não existe.

⚠ **O rótulo mostra o número EFETIVO.** Um chip dizendo "Nível 10" numa criatura de ND 8 que PODE
pegar a aptidão seria um número certo com leitura errada, que é o defeito já nomeado na Defesa por
atributo. O número do livro vai para o `titulo` do hover.

---

## 7. O que ficou de fora, e onde está anotado

Três coisas, todas em `docs/a-fazer.md`:

1. **"Manter dois Estilos da sombra durante uma rodada."** O autor não reconheceu a frase. Ela está
   no texto que ele mandou, no fim do parágrafo de buff, e tem duas leituras que dão sistemas
   diferentes. Ficou fora do pacote.
2. **Ritualizar Estilo.** Mesa por ora, por decisão dele. O canal existe, o gatilho não.
3. **Ápice e Lendária que citam habilidade de Conjurador.** Um Especialista em Estilo de ND 21+ não
   alcança o Ápice que pede `cnj_manipulacao_perfeita`, porque o clone tem id próprio.

E uma consequência assumida, sem entrada própria: o clone de
`cnj_agilidade_no_campo_de_batalha` herda a marca `foraDoJogador`, e a liberação que a devolve
(`soPorAddon:cnj_agilidade_no_campo_de_batalha`) é por id CRU. Na Ficha de Player o clone dela fica
escondido para sempre, o que é o mesmo destino da original.
