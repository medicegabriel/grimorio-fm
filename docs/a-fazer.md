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

## AFTY — outros

### Clã Zenin ficou com bônus de atributo livre
**Onde:** `src/systems/afty/afty-origens.js`
**Situação:** Gojo, Inumaki e Kamo têm `entre` com um par de atributos. O Zenin ficou livre entre
os 6, e não se sabe se foi decisão ou esquecimento.
**Precisa:** o autor dizer se o Zenin é restrito também e, se for, quais dois atributos.
**Anotado:** 2026-07-29, migrado de `afty-status.md` em 2026-08-09

### Precisão (Melhoria de Controlador): "Ataque ou CD"
**Onde:** `src/systems/afty/afty-alto-nivel.js`
**Situação:** o texto diz *"+2 em Jogadas de Ataque ou CD"*, e não se sabe se é escolha do
jogador ou se vale para os dois.
**Precisa:** decisão do autor.
**Anotado:** 2026-07-29, migrado de `afty-status.md` em 2026-08-09

---

## Migração pendente deste próprio arquivo

`afty-status.md` ainda tem pendências espalhadas pelas seções de sessão (Melhorias de
Controlador sem marcador por invocação, Controle Disperso sem limite de invocações ativas,
Marca Registrada com a redução de PE desligada, subsistemas nunca enviados como Apoio, Imitação,
Votos e técnicas marciais, e a lista de retomada das Especializações). Elas **não** foram
movidas para cá: seriam um diff enorme num arquivo que outros colaboradores também editam, e o
autor pediu padronização daqui para frente, não migração.

**Precisa:** o autor dizer se quer a migração completa. Se sim, é uma passada só, de preferência
logo depois de um commit, para o diff ficar isolado.
