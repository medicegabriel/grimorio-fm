# Azamaru

Pacote em **`addons/azamaru.json`**, sem import no bundle. Instalá-lo em Cálculos > Addons, ativar
na ficha e adicionar Azamaru no catálogo de armas. A arma ocupa uma única entrada de inventário.

⚠ **O pacote MUDOU DE LUGAR em 2026-09-07**, junto com este doc e com o assert. Ele nasceu em
`src/systems/afty/azamaru.json`, dentro da árvore de código, e o autor pediu a correção:
*"ela deveria ter sido feita como Addon esse tempo todo"*. Os três foram para as pastas que o
projeto já usa, e nada de conteúdo mudou na mudança:

| Era | É |
|---|---|
| `src/systems/afty/azamaru.json` | `addons/azamaru.json` |
| `src/systems/afty/AZAMARU.md` | `docs/afty-azamaru.md` |
| `src/systems/afty/asserts/t-azamaru.mjs` | `asserts/t-azamaru.mjs` |

⚠ **O assert não rodava.** O lançador (`npm run asserts`) só lê `asserts/` na raiz, então
`t-azamaru.mjs` ficava fora do portão de qualidade. E mesmo rodado à mão ele seria marcado como
FALHOU, porque o lançador exige a frase `TODOS OS <n> ASSERTS PASSARAM` e o arquivo imprimia uma
própria. As duas coisas foram consertadas: o `node:assert` continua sendo quem decide (ele lança na
falha), e um contador fino só produz a linha final.

## A primitiva

O mecanismo é **VERBO** e mora no motor, em `src/systems/afty/afty-armas-transformaveis.js`. O
conteúdo é **SUBSTANTIVO** e mora no pacote. É a mesma diretriz de `afty-addons.md`.

⚠ **O verbo só aparece para quem pediu.** A primitiva é `armaTransformavel`, declarada pelo pacote
em `"permite"`. Sem ela, os dois canais que o Azamaru abriu (`ignoraTodaRD` e `ignoraImunidade`)
apareciam no seletor de canal de **todo mundo**, com zero addons instalados. É exatamente a lição
que o `hpAtributo` já tinha deixado escrita no topo de `PRIMITIVAS`, e que este caso repetiu.

⚠ **Toda leitura de ficha no módulo é defensiva.** Ele roda dentro do `deriveAfty`, e o contrato é
que ficha salva sempre abre. A primeira versão lia `equipamentos.itens` com `?? []`, que só cobre
`null` e `undefined`, e derrubava a derivação inteira quando o campo chegava como outra coisa. O
assert `"ficha suja nao derruba o derive"` de `t-pugilato.mjs` pegou na hora.

## Criação

Arma de técnica com base Tática, conforme autorização do autor. Habilidade exclusiva fora do orçamento, também autorizada. Grau Especial, sem encantamentos que reduzam o grau efetivo da criatura.

Disponíveis: 12 PC de base + 8 PC de custo 4 de técnica + 1 PC do segundo espaço = 21 PC. Os quatro pontos de aumento de limite foram divididos em +2 para Dano e +2 para Propriedades, resultando em tetos 8 e 10.

| Compra | PC |
|---|---:|
| Seis níveis de dano, 1d4 até 1d12 + 1d4 | 6 |
| Margem 18, duas reduções | 6 |
| Fineza | 1 |
| Marcial | 1 |
| Dupla | 1 |
| Apunhaladora | 1 |
| Enérgica | 2 |
| Mortal d12 | 2 |
| Oscilante | 1 |
| Total | 21 |

A forma colossal troca Dupla e Apunhaladora (2 PC) por Ampla e Duas Mãos (3 - 1 PC). Mantém o mesmo dano, crítico, custo e orçamento. Pesada e Especial não são aplicadas. A classificação de técnica não exige que o portador possua técnica, conforme pedido para o Sem Técnica.

## Combate

O painel compartilhado pela ficha e pelos encontros controla as duas formas. Reunir gera Maestria clones e custa uma ação bônus. O primeiro uso de cada combate é gratuito e os demais pagam Maestria PE, consumindo PE temporário primeiro. Dividir bloqueia reunir até a próxima rodada.

Após rolar o dano do ataque que acertou, Consumir Acumulados consome os pares de clones acumulados. O resto ímpar permanece até a próxima rodada. O botão deve ser usado mesmo quando existir apenas um clone acumulado, para marcar sua expiração. Falhar um ataque não consome a reserva. Não há consumo automático ao rolar o ataque, porque o resultado contra a Defesa do alvo é resolvido pela mesa.

### O painel, redesenhado em 2026-09-07

Pedido do autor: *"ficou muito ruim de usar ela na Ficha Final"*. Quatro coisas estavam erradas, e
a primeira explica a reclamação inteira.

⚠ **SEIS BOTÕES PARA TRÊS AÇÕES.** Medido no motor: `golpe` e `livre` disparavam o mesmo caminho e
dissipavam um clone cada, e `todos` tinha DOIS botões. O jogador tinha de descobrir sozinho quais
pares eram sinônimos, numa fileira de sete controles que embrulhava na largura da Ficha.

| Antes | Agora |
|---|---|
| Errou contra mim, Dissipar 1 | **Dissipar Um** |
| Fui atingido, Área · Dissipar | **Dissipar Todos** |
| Acertei · Consumir | **Consumir Acumulados** |

As situações de mesa não sumiram: cada uma vira `title` do botão que resolve aquele caso, que é
onde a regra de UI do projeto manda pôr explicação de item.

⚠ **O NÚMERO NÃO APARECIA.** A tira dizia "Clones: 4" e escondia o que aquilo valia. Os clones dão
+2 de Defesa e +2 em Reflexos cada, e a reserva vira um dado de dano a cada dois: três números que
já eram calculados e jogados fora. Agora eles são a segunda faixa, e saem do `bonusDaForma`, que
passou a ser o dono único da fórmula (os efeitos leem o mesmo).

⚠ **O TEXTO DA ARMA MORAVA NUM `title`.** Sete linhas de regra dentro de um tooltip não se leem.
Virou uma faixa que abre, com `TextoRico`.

⚠ **DOIS TÍTULOS.** Um `h2` com o nome e um `h3` com o subtítulo, os dois carregando o mesmo
tooltip. Subtítulo é identidade, não hierarquia: virou o rótulo da faixa que abre.

O arranjo segue as quatro faixas do card de Invocação (identidade, resultado grudado nela,
controles, detalhe). A borda esquerda como estado e o botão discreto vieram da Guarda.

⚠ **O painel MORA NA ABA AÇÕES**, e não no cabeçalho. Ele nasceu encostado nos vitais e o autor
apontou: *"o local aonde está o controle da Azamaru é meio ruim. Deixe em Ações"*. Faz sentido: o
que ele faz é ação de combate, e reunir ou dividir muda a linha de dano que aparece logo abaixo
dele. Entra pelo mesmo caminho do Ciclo de Adaptação, como NÓ PRONTO na prop `armasTransformaveis`
da `AbaAcoes`, porque a sessão é de quem monta a aba: a Ficha e o painel de Encontros têm
`onSessao` diferentes, e assim a aba não precisa saber que sessão existe. Uma mudança serve às duas
telas.

### O Reunir travado fora de combate

⚠ **Consertado em 2026-09-07.** O autor: *"Quando eu clico em Reunir, e depois clico em Dividir. Eu
não consigo Reunir novamente."*

A Ficha abre na **rodada 0**, que quer dizer "nenhuma cena em andamento", e o contador só sobe
quando o jogador vira a rodada à mão. `dividir` gravava `dividida: sessao.rodada` e `reunir` recusa
quando `dividida === rodada`: fora de combate isso vira `0 === 0` para sempre, e nada faz a rodada 0
passar. A arma ficava presa dividida até o jogador virar a rodada, sem nenhum sinal do porquê.

Fora de uma cena não existe "mesma rodada", então `dividida` só é gravada quando a rodada é maior
que zero. Dentro da cena a regra do livro continua inteira, e os dois lados estão trancados em
`asserts/t-azamaru.mjs`.

Ignorar toda RD, imunidade e resistência aparece na linha da arma transformada. O sistema continua recebendo dano já resolvido pela mesa, conforme o fluxo existente de dano rápido, sem buscar ou alterar a defesa de outra criatura automaticamente.

O texto recebido está preservado na descrição do JSON. No title do painel, os pontos e vírgulas são apresentados como quebras de linha, sem alterar as palavras.

Verificação: `npm run asserts -- azamaru` (51 asserts), ESLint do Afty e build Vite.
