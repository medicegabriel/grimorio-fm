# Vislumbre Celeste

O Addon **Vislumbre Celeste**, os Seis Olhos com outro nome. O plano foi escrito em 2026-09-09 antes
de qualquer código, a pedido do autor, e **está construído** desde o mesmo dia. As seções de plano
ficaram como estavam: elas são o porquê de cada peça.

> **Addon**: `addons/vislumbre-celeste.json` (só `permite`)
> **Módulo**: `src/systems/afty/afty-vislumbre-celeste.js` (folha, sem imports)
> **Telas**: `src/systems/afty/ui/VislumbreCard.jsx` (criador, aba Habilidades) e
> `src/systems/afty/ficha/PainelDoVislumbre.jsx` (Ficha Final, aba Ações)
> **Provas**: `asserts/t-vislumbre-celeste.mjs` (69 asserts) e `asserts/t-custo-pe.mjs` (21)

> **O que o autor mandou:** o texto completo da condição, com Benefícios Suprimidos, Poder Total,
> Sobrecarga, Compreensão do Jujutsu e Capacidade Impossível.
>
> **A frase que decide a forma:** *"É uma Condição Corporal, logo se soma os efeitos com Feitiços e
> etc."*

---

## 1. O que ele É, no vocabulário do sistema

**Condição Corporal quer dizer que ele NÃO é técnica.** A consequência prática é de motor, e não de
texto: os bônus dele entram pelos canais que ACUMULAM, e ele **não** entra no pool exclusivo das
cinco fontes que disputam o maior valor (Habilidade Única, Feitiços Auxiliares, Shikigami e as
outras). Um Feitiço que dê +2 em Percepção soma com o Vislumbre em vez de competir com ele.

**A escada dele é o `cl`**, o Nível de Aptidão em Controle e Leitura, que já é variável do DSL e já é
o que as Aptidões de Controle e Leitura leem. Isso é sorte boa: metade dos números do texto sai de
graça.

| O texto diz | O sistema já chama de |
|---|---|
| "Nível de Aptidão de CL" | `cl`, variável do DSL (0 a 5, ou mais com Limite de Aptidão) |
| "bônus em Percepção e Feitiçaria" | canal `bonusPericia`, com alvo por perícia |
| "1 Nvl de Aptidão adicional" | canal `nivelAptidao` (dirigido) ou `pontosAptidao` (livre) |
| "olhos cobertos / descobertos" | **estado de combate** do tipo `bool`, declarado pelo PACOTE |
| "Pontos de Fadiga" | **estado de combate** do tipo `faixa`, 0 a 4 |
| "Feitiço com Pré-Requisito Impossível" | `requisito: "impossivel"` já existe no Feitiço |

---

## 2. A forma: quase tudo é DADO

O molde é o `addons/dancarino-das-laminas.json`, que declara estado de combate e lê o estado nos
efeitos. Nada disso é código novo.

```jsonc
{
  "id": "vislumbre-celeste",
  "estadosCombate": [
    { "id": "descoberto", "label": "Olhos Descobertos", "tipo": "bool" },
    { "id": "fadiga", "label": "Fadiga Mental", "tipo": "faixa", "min": 0, "max": 4 }
  ],
  "permite": ["vislumbreCeleste"]
}
```

⚠ **Nenhum estado leva `requerTalento` ou `requerAptidao`**, e é consequência da primeira decisão do
autor: a condição é de graça e não é entrada de catálogo, então **ter o pacote É ter os olhos**. Os
estados vêm do pacote, então quem não o instalou não os vê, e não há segunda trava a manter em
sincronia.

O estado vira variável de DSL com o namespace na frente (`vislumbre_celeste_descoberto`), e cada
efeito liga ou desliga sozinho pelo campo `quando`:

```jsonc
{ "canal": "bonusPericia", "alvo": "percepcao", "expr": "cl",
  "quando": "vislumbre_celeste_descoberto == 0", "nome": "Visão Penetrante" }
{ "canal": "bonusPericia", "alvo": "percepcao", "expr": "cl * 2",
  "quando": "vislumbre_celeste_descoberto",     "nome": "Visão Absoluta" }
```

⚠ **É assim que "substituindo-os pelos seguintes" fica honesto:** os dois blocos existem, e o estado
decide qual está de pé. Nada é somado duas vezes, e o hover de fontes mostra o nome do bloco que
valeu.

---

## 3. O que o motor JÁ faz, sem uma linha nova

| Benefício | Canal | Observação |
|---|---|---|
| +1 (ou +2) por CL em Percepção e Feitiçaria | `bonusPericia` | dois efeitos por perícia, um por estado |
| 4 Nvl de Aptidão, um por marco | `pontosAptidao` | livre, porque o texto não nomeia trilha |
| Alternar coberto e descoberto | `estadosCombate` `bool` | aparece na bancada do criador E na Ficha Final |
| Contar a Fadiga | `estadosCombate` `faixa` 0 a 4 | contador manual, como o Ritmo do Dançarino |
| O Feitiço de Pré-Requisito Impossível | `REQUISITO_DIFICULDADE` | já existe para qualquer Feitiço |

---

## 4. As quatro decisões do autor (2026-09-09)

Todas por pergunta direta, antes de qualquer código.

| Pergunta | Resposta |
|---|---|
| Que entrada a ficha ganha, e ela custa vaga? | **De graça, sem Origem, Talento nem Aptidão.** Card próprio na aba Habilidades, **abaixo de Funcionamento Básico e acima de Feitiços** |
| A redução de PE alcança o quê? | **Todo gasto que a ficha calcula** |
| A Fadiga vira Exaustão na ficha? | **A ficha conta as duas** |
| Quantos níveis a Compreensão dá? | **Quatro**: um já na criação, mais um no ND 5, no 15 e no 25 |

---

## 5. Os muros, e o que cada resposta custou

### 5.1 ⚠ A redução de PE é o item mais caro, e vira verbo do motor

> *"Sempre que gastar PE, você reduzirá o valor gasto igual à metade de seu Nível de Aptidão de CL"*
> (coberto) e *"igual á seu Nível de Aptidão de CL"* (descoberto)

O canal `custoPE` existe e **só é lido em um lugar**: o custo do Feitiço. O Domínio Simples tem
canais próprios (`custoErguerDominio`, `custoSustentarDominio`) e todo o resto que gasta PE não passa
por canal nenhum.

Com a resposta do autor, `custoPE` passa a valer em **todo custo em PE que a ficha calcula**: Feitiço,
Domínio, Invocação, Estilo das Sombras e o que mais tiver número. É verbo, então mora no motor e
serve a qualquer mesa, e não ao addon.

⚠ **O piso de 1 PE vale POR GASTO, e não no fim.** Um Feitiço de 3 PE com redução 5 custa 1, e não
zero nem negativo. É o que o canal já faz hoje no Feitiço, e o que os outros pontos passam a fazer.

⚠ **A conta é `piso(cl / 2)` coberto e `cl` descoberto.** Arredondamento para baixo, regra da casa.

### 5.2 A Exaustão nasce no sistema, e não no addon

> *"Ao acumular 4 pontos de fadiga, você sofre imediatamente 1 Nível de Exaustão e seus Pontos de
> Fadiga são zerados"*

A **Fadiga** é do addon: faixa 0 a 4 declarada pelo pacote, como o Ritmo do Dançarino.

A **Exaustão** não. Ela aparece hoje só como TEXTO, em seis Habilidades Lendárias e no Domínio
("você recebe um ponto de exaustão"), e a ficha não tem onde marcá-la. O autor decidiu que a ficha
conta as duas, então nasce um **contador de Nível de Exaustão na sessão**, que serve a todo mundo.

⚠ **O QUE UM NÍVEL DE EXAUSTÃO FAZ AINDA NÃO TEM FONTE NO AFTY.** "Exausto" existe como nome de
condição na lista da 2.5.2 e o `CONDICAO_TEXTOS` do Afty está vazio, esperando o autor. Até o texto
chegar, o contador **conta e mostra**, e a penalidade é de mesa. É a mesma escolha do terreno
preparado das Condições, e está na lista de pendências abaixo.

⚠ **A mitigação por Energia Reversa** (*"1 Ponto de energia reversa para cada ponto de fadiga"*)
esbarra em outra coisa: Energia Reversa hoje é trilha de Aptidão e tipo de dano, e não um recurso com
pontos próprios. O que dá para fazer sem inventar recurso é o botão de curar Fadiga anotar o gasto em
PE, que é de onde a energia reversa sai.

### 5.3 Percepção às cegas não existe na ficha

> *"percepção às cegas com alcance padrão de 9m. Para cada nível de CL, você recebe +4,5m"*
> (coberto), *"18m [...] +9m"* (descoberto)

A ficha não tem sentidos. O número é derivado e escala com o `cl`, então ele aparece **no card do
Vislumbre**, junto do estado, e não numa linha nova do stat block: card próprio é menor, não mexe em
tela compartilhada e mostra o alcance que vale AGORA.

### 5.4 As três ações de leitura

O texto cita **Ler Energia**, **Ler Técnica** e **Ler Intenções**, e só define a segunda (teste de
Feitiçaria ou Percepção, CD 20 + 5 por grau acima do Quarto). As outras duas não existem no sistema:
o que existe são as Aptidões **Leitura de Aura** e **Leitura Rápida de Energia**.

O que dá para fazer com o que veio escrito é o benefício mudar a AÇÃO delas (Movimento quando
coberto, Livre uma vez por rodada quando descoberto) e o card carregar o texto da Ler Técnica
verbatim. Se o autor mandar as outras duas, elas entram do mesmo jeito.

### 5.5 Capacidade Impossível

Um Feitiço com requisito Impossível **já é criável por qualquer um**: é uma escolha do Feitiço, que
troca dificuldade por dados e PE. O que o Vislumbre acrescenta é a **trava**, e ela é a mesma forma
dos marcadores de Invocação: o Feitiço marcado avisa na Ficha Final enquanto os olhos estiverem
cobertos.

---

## 6. A ordem de construção

1. **O verbo do PE** (`custoPE` alcançando todo custo calculado), com assert medindo cada ponto de
   gasto. Ele é do motor e entra primeiro, porque o addon só o consome.
2. **O contador de Exaustão** na sessão da Ficha Final, aberto a todo mundo.
3. **O módulo** `afty-vislumbre-celeste.js` (folha): os dois blocos de benefício, o alcance de visão,
   a conta da Fadiga e a da Compreensão.
4. **O card** na aba Habilidades, entre Funcionamento Básico e Feitiços, atrás da primitiva.
   ⚠ A aba ramifica o layout inteiro por origem: o card é montado UMA vez e os três ramos o
   consomem, e quem decide se ele aparece é o `derived`, e nunca o JSX. Esta lição já custou caro no
   Estilo Marcial, em 2026-09-07.
5. **O pacote** `addons/vislumbre-celeste.json`, com os dois estados de combate e o `permite`.
6. **`asserts/t-vislumbre-celeste.mjs`**, medindo:
   - coberto e descoberto **nunca somam juntos** (é substituição, e não acúmulo);
   - a promessa da Condição Corporal: o bônus **soma** com o de um Feitiço, e não disputa o maior;
   - o addon **não gasta contador nenhum** da aba Habilidades (ele é de graça);
   - desinstalar devolve a ficha ao que era.

---

## 7. O que ainda espera o autor

| # | Pendência | O que trava |
|---|---|---|
| 1 | O que um **Nível de Exaustão** faz | o contador conta e mostra, e a penalidade fica de mesa até o texto chegar |
| 2 | O texto de **Ler Energia** e **Ler Intenções** | as duas viram só mudança de ação, sem efeito próprio |
| 3 | **Energia Reversa como recurso** | a mitigação da Fadiga anota gasto em PE, e não em pontos próprios |
| 4 | O **nome do Feitiço** da Capacidade Impossível | a trava existe, e o Feitiço é escolhido pelo jogador |

---

## 8. O QUE FICOU DE PÉ (2026-09-09)

### O verbo do PE, que é do motor e não do addon

O canal `custoPE` ganhou **alvo** e passou a ser lido em todo custo que a ficha calcula: Feitiço,
Domínio Simples, Estilo das Sombras, Invocação e os estados de Aptidão. São os `CUSTOS_PE`, uma lista
fechada de cinco, e `custoEmPe(base, efeitos, escopo)` é o leitor único.

⚠ **A Expansão de Domínio precisou nomear o alvo dela.** O texto é *"O custo dos seus FEITIÇOS dentro
da expansão"*, e ela era a única emissora de `custoPE` do livro: sem `alvo: "feitico"` ela passaria a
baratear Domínio Simples, Estilo e Invocação de lambuja no dia em que o canal ganhou alcance. Há
assert de regressão medindo isso.

⚠ **O `custoPE` entrou nos CANAIS_POS_APTIDAO.** O Domínio Simples é resolvido num passe próprio, e
sem essa linha a redução chegava no Feitiço e não chegava nele, calada.

⚠ **O custo dos ESTADOS é reduzido só na exibição**, numa cópia do `combate`. O estado é montado
antes de o Motor rodar (ele alimenta o contexto do DSL), então reduzir na origem morderia o próprio
rabo. O número do custo não entra em conta nenhuma: ele é o que a pessoa lê antes de gastar.

### ⚠ Um bloco por vez, e não os dois com `quando`

A primeira versão emitia os dois blocos e deixava um `quando` decidir. **Não funciona**, e o motivo é
de ORDEM: o `custoPE` é lido no passe pós-aptidão, que roda antes de a bancada de combate existir, e
lá a variável do estado ainda não nasceu. Os dois blocos caíam calados, e o custo do Domínio não
mudava.

Hoje quem decide é a ficha (`olhosDescobertos`, que lê a criatura crua com o mesmo portão do `ativo`
que o `resolveCombate` usa), e só o bloco de pé é emitido. Assim *"substituindo-os pelos seguintes"*
deixa de depender de uma condição que o contexto pode não conhecer, e há assert cobrando que os dois
nomes NUNCA saiam na mesma lista.

### O Nível de Exaustão nasceu no sistema

Contador na sessão da Ficha Final, no cabeçalho das Condições, aberto a todo mundo e **não** atrás da
primitiva: seis Habilidades Lendárias e a Expansão de Domínio dizem *"você recebe um ponto de
exaustão"* desde sempre, e a ficha não tinha onde marcar.

⚠ **O que um Nível de Exaustão FAZ continua sem fonte no Afty**, então ele conta e mostra, e a
penalidade é de mesa. É a mesma honestidade das Condições ao lado, que são marcadores e não inventam
número.

### O painel da Ficha Final, e as três coisas que ele mudou (2026-09-09, segunda rodada)

Autor: *"faça o Vislumbre Celeste aparecer na Ficha Final. E ter um tracker de Fadiga lá. Além do
Botão Olhos Descobertos funcionar em cima do menu do Vislumbre Celeste assim como a Fadiga. Para eu
não precisar ir para Buffs o tempo inteiro"*.

O painel mora na aba **Ações**, e não em Buffs: é a mesma decisão que o controle da Azamaru recebeu
em 2026-09-07 (*"o local aonde está o controle da Azamaru é meio ruim. Deixe em Ações"*). O que se
FAZ no turno mora onde se age. Ele carrega o botão dos olhos, os quatro números e os contadores de
Fadiga e de Exaustão lado a lado.

⚠ **A conversão da Fadiga ficou AUTOMÁTICA.** *"Ao acumular 4 pontos de fadiga, você sofre
imediatamente 1 Nível de Exaustão"*: o quarto ponto nunca aparece na tela, ele já sai como Exaustão e
a contagem recomeça no zero. A conta é `acumulaFadiga`, e o contador de Exaustão fica ao lado para a
conversão se ver acontecer. Isto saiu da lista de pendências.

⚠ **OS DOIS ESTADOS DEIXARAM DE OBEDECER AO `ativo` DA BANCADA**, e o painel foi quem expôs isso.
Todo outro estado é zerado fora de combate, porque todo outro estado É de combate. Uma Condição
Corporal não liga e desliga com a iniciativa: sem essa mudança o painel teria DUAS VERDADES, com o
botão aceso pelo valor gravado e os números mostrando o bloco coberto, porque o `resolveCombate`
devolve tudo zerado com a bancada desligada. Hoje o card, o painel e o Motor leem a mesma fonte
(`olhosDescobertos` e `fadigaAtual`).

⚠ **O nome da fonte no hover encurtou** (pedido do autor). Era `Vislumbre Celeste: Olhos Descobertos
· Visão Absoluta`, e numa linha de hover que já é estreita aquilo empurrava o número para fora e
repetia três vezes o que a pessoa já sabe. Hoje é só **Olhos Cobertos** ou **Olhos Descobertos**: a
fonte diz QUEM deu o bônus, e quem deu é o estado dos olhos.

### O que NÃO ficou pronto

* **O ponto de Fadiga no fim de cada turno.** *"No final de cada um dos seus turnos em que seus olhos
  estiverem descobertos"*. Hoje o botão de mais um ponto está no painel, a um clique, e quem o dá é a
  pessoa: a Ficha tem rodada, mas não tem gancho de FIM DE TURNO para um addon pendurar.
* **A mitigação por Energia Reversa**, que espera Energia Reversa virar recurso com pontos próprios.
* **A Capacidade Impossível**, que espera o autor dizer qual Feitiço leva a trava.
* **Ler Energia e Ler Intenções**, que o texto cita e não define.
