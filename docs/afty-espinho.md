# Espinho e Alter

Guia dos dois Addons pedidos pelo autor em 2026-09-30 para um personagem. O **Espinho** é um contador
de Almas (Totais e Restantes) e uma loja que troca Almas por ganhos de ficha. O **Alter** aumenta em
50% a quantidade comprável de cada item do Espinho.

| Peça | Onde mora |
|---|---|
| O verbo (loja com teto, extrato, marcas de item) | `src/systems/afty/afty-espinho.js` (módulo folha) |
| O catálogo unido dos pacotes | `espinhoDaFicha` em `src/systems/afty/afty-addons.js` |
| O card (Criador e Ficha Final) | `src/systems/afty/ui/EspinhoCard.jsx` e `ui/espinho.css` |
| Os pacotes | `addons/espinho.json` e `addons/alter.json` |
| O assert | `asserts/t-espinho.mjs` |
| O protótipo visual aprovado | `../prototipos/espinho/index.html` (variação A, Rasgo) |

## O pedido

> Preciso de um contador de ALMAS. Aonde mostra minhas Almas Totais e Restantes. Você pode gastar
> ALMAS para comprar efeitos mecânicos na ficha (que não são Feitiços, logo se acumulam com
> Feitiços, Equipamentos e todo o restante).

O visual pedido: vermelho pulsante, a realidade rasgando o próprio site, uma pedra filosofal
corrompida, clima de Stranger Things.

## O catálogo

O que está entre colchetes no pedido é o teto e o custo. `BT` é o Bônus de Treinamento (a Maestria).

| Item | Teto | Custo | O que rende por compra |
|---|---|---|---|
| Habilidade de Especialização | BT | 6 | +1 vaga comum (`vagasHabilidade`) |
| Talento | BT | 4 | +1 vaga exclusiva de Talento (`vagasTalento`) |
| Aptidão Amaldiçoada | BT | 6 | +1 Aptidão (`vagasAptidao`) |
| Nível de Aptidão | 2 | 6 | +1 Nível de Aptidão livre (`pontosAptidao`) |
| Treinamento | 2 × BT | 2 | +1 Foco de Interlúdio (`focos`) |
| Habilidade Lendária | BT / 2 | 6 | +1 vaga de Lendária (`vagasLendaria`) |
| Melhoria Superior | BT / 2 | 4 | +1 vaga de Melhoria (`vagasMelhoria`) |
| Aumento de Alma | BT | 6 | +10 de Alma (`almaMax`) |
| Aumento de Atributo | BT | 4 | +1 Ponto de Atributo (`pontosAtributo`, canal novo) |
| Determinado a Viver | 1 | 15 | concede o Talento Determinado a Viver - Adicional |
| Perícias | sem teto | 3 | +1 vaga de Perícia (`vagasPericia`) |
| Aprimoramento de Equipamento | sem teto, 1 por item | 10 | Habilidade Única a mais num item marcado |
| Equipamento | sem teto | 10 | um item do inventário marcado vira Grau Especial |
| Outros | sem teto | 1 por Alma | nada, só conta gasto de RP |

Tudo acima, menos o Outros, é dado do pacote (`espinho.itens`): nome, descrição, custo, teto (DSL),
bloco da lista e as linhas do Motor. Mudar um preço ou um teto não pede código.

## Decisões do autor (2026-09-30, por pergunta)

1. **Vale nos dois sistemas**, /Player e /Afty, sem divergência.
2. **Almas Totais é um número digitado.** Restantes = Totais menos as compras menos Outros.
3. **A compra acontece no Criador.** A Ficha Final mostra o card e deixa editar as Almas Totais e o
   Outros durante a sessão. As duas coisas são FICHA, e não sessão: gravam na criatura.
4. **O visual rasga a borda do card** e não contamina o resto da página. Escolhida a variação A
   (Rasgo) do protótipo, na intensidade dele.
5. **Perícias é vaga no orçamento**, escolhida na aba Perícias como sempre (igual à Loja de Catarse).
6. **Equipamento é item marcado.** O item é criado em Equipamentos como sempre, e o card do Espinho
   aponta quais vieram dele. O Aprimoramento é um interruptor por item marcado.
7. **A Habilidade Única do Aprimoramento se comporta como a primeira**: família `habilidadeUnica`,
   acumula com Feitiços e disputa o maior valor com as outras Habilidades Únicas, inclusive a primeira
   do próprio item.
8. **O Outros é a última linha da lista**, depois de Perícias (pedido ao escolher o protótipo).

## Decisões minhas

- **O teto com o Alter é `floor(expressão × 1,5)`, com um piso só, no fim.** O texto do autor é "BT ×
  1,5". Pisar a metade do BT antes de multiplicar tiraria uma compra em todo BT ímpar: com BT 3, a
  Lendária vai a 2, e não a 1. Dois pacotes com multiplicador: vale o maior, e não o produto.
- **Passar do teto ou das Almas avisa e não remove.** O botão de comprar para no teto, mas o BT pode
  descer depois, e apagar a compra seria escolher pelo jogador. As vagas excedentes continuam
  valendo, como em todo orçamento do projeto.
- **Sem o pacote, nada rende.** O `creature.espinho` fica gravado e volta a contar ao reinstalar.
  Tirar só o `permite` esconde o card e não muda número.
- **O Determinado a Viver Adicional copia o texto do clássico**, sem pré-requisito e sem contador (o
  clássico também não tem). Ele tem `soConcedido: true` e não aparece no seletor de Talentos.
- **Melhoria e Lendária compradas cedo avisam.** A vaga existe (regra da Catarse), e o card diz
  "requer Nível 21" (no jogador) ou "requer a Habilidade Geral" (na criatura, no ND 21 sem a Geral).

## Como cada peça chega no número

- **As vagas** entram no estágio MONTANTE do `deriveAfty`, ao lado da Catarse, porque os orçamentos de
  Habilidade, Talento e Alto Nível fecham antes de os stats existirem. Nenhuma linha leva
  `exclusivo`: acumular é a regra. O hover de cada orçamento mostra a parcela "Espinho (<item>)".
- **O Aumento de Alma** usa a régua do canal `almaMax` em cada sistema: no jogador são +10 de Alma e
  +10 de PV (a Alma dele é o teto do PV), e na criatura são +10% (a Alma dela é porcentagem).
- **O Ponto de Atributo** é o canal novo `pontosAtributo`, um orçamento. O derive publica
  `pontosAtributoExtra` (com `partes`), e o `resumoAtributos` o soma no pool dos pontos de nível, que é
  onde o jogador distribui. O limite de cada atributo continua valendo. O canal só aparece no seletor
  para quem tem a primitiva `espinho`.
- **O Talento Adicional** entra pelo mesmo caminho da Concessão do Mestre (`concedidos` do
  `resolveTalentos`): não gasta vaga e não cobra pré-requisito. A diferença é a fonte, que aqui é a
  ficha.
- **O Equipamento marcado** vira Grau Especial por DERIVAÇÃO, e não por escrita: o `fa.grau` gravado
  não muda, e desmarcar devolve o grau antigo. Um item sem Ferramenta vira uma, já no Especial. Só
  arma, escudo e uniforme podem ser marcados. Na aba Equipamentos ele ganha o selo "Espinho", o grau
  fica travado e o "Deixar de ser ferramenta" some (quem desmarca é o card).
- **A Habilidade Única do Espinho** é um espaço próprio no item (`fa.espinhoHabilidadeUnica` e
  `fa.espinhoHabilidadeEfeitos`), separado da Segunda Habilidade Única da Benção do Grão Mestre da
  Forja. As duas podem existir no mesmo item, e a do Espinho não custa Slot de Feitiço. O interruptor
  da versão ativa é `unica3_<uid>`.
- **O item marcado que some do inventário** continua custando, aparece riscado no card e avisa, para
  as Almas não voltarem sozinhas.

## O card

- **Criador:** aba Habilidades, logo depois do Vislumbre e dos Olhos de Agulha, nos três leiautes de
  origem (Sem Técnica, Restringido e o padrão). Lista completa com [-] e [+], a descrição de cada item
  no hover (`DicaDeTexto`), o bloco de Equipamentos com "Marcar Item" e o interruptor Aprimorado.
- **Ficha Final:** aba Habilidades, logo abaixo do filtro, versão compacta: cristal, Almas Totais
  editável, as compras como rótulos curtos e o Outros com [-] e [+]. A Ficha guarda uma cópia viva e
  grava na criatura com atraso de 600 ms, como o tema, e grava o que estiver pendente ao sair.
- **Encontro:** a mesma versão compacta, só leitura (o combatente guarda uma cópia da ficha).
- **Hovers flutuantes** nas Almas Gastas e nas Restantes: a casca do card tem `overflow: hidden` e
  cortaria um painel preso ao pai.
- **O aviso de Almas excedidas nasce no card**, e não no resolver, porque na Ficha o Outros muda na
  hora e o derive ainda não o viu.

### O visual

Paleta própria nos tokens `--espinho-*`, declarados em `.afty-espinho`, para o card parecer diferente
do site em qualquer tema. As classes `.afty-espinho*` estão no contrato de `ficha/ficha-tema.js`.

- Núcleo carmim atrás do cristal em batimento lub-dub (1,8 s), halo da borda no mesmo ritmo.
- Título "Espinho" em serifa vazada, com o brilho por `drop-shadow` (o `text-shadow` encheria as
  letras).
- Cristal facetado com as almas girando dentro.
- Quatro rachaduras nas quinas e um rasgo aberto na borda direita, todos FORA da casca, escapando
  alguns pixels. A máscara de cada rachadura apaga a ponta que entra no card antes de cobrir texto.
- Glitch curto com deslocamento cromático a cada 9 s.
- Animação só em `transform` e `opacity`. `prefers-reduced-motion` congela tudo, e a impressão sai
  preto no branco, sem rachaduras.

⚠ **As caixas dos SVGs escapam no máximo 8 px do card.** Com o rasgo a 16 px, o card da Ficha (a 12 px
da borda da tela no celular) criava rolagem lateral a 390 px. Os SVGs têm `overflow: hidden` pelo
mesmo motivo: traço que passa da caixa entra na área rolável da página.

## O pacote

```json
"espinho": {
  "itens": [
    { "id": "talento", "nome": "Talento", "descricao": "...", "custo": 4, "teto": "bt", "grupo": 1,
      "efeitos": [{ "canal": "vagasTalento", "expr": "1" }] },
    { "id": "determinado", "tipo": "talento", "concedeTalento": "tal_determinado_a_viver_adicional", ... },
    { "id": "equipamento", "tipo": "equipamento", "custo": 10 },
    { "id": "aprimoramento", "tipo": "aprimoramento", "custo": 10 }
  ]
}
```

- `tipo`: `efeitos` (padrão), `talento`, `equipamento` ou `aprimoramento`. Um de cada dos dois
  últimos, e o Aprimoramento exige o Equipamento.
- `teto`: DSL no contexto do montante (`bt`, `nd`), ou ausente para sem teto.
- `grupo`: só visual, separa os blocos da lista por uma fenda.
- `concedeTalento` resolve local primeiro: o id que o próprio pacote acrescenta ganha o namespace dele.
- O Alter traz só `"espinho": { "multiplicadorTeto": 1.5 }` e é pacote válido sozinho.
