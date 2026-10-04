# Feitiços Permutativos (texto verbatim do livro)

Recebido do autor em 2026-10-02. Fonte da customização **Permutativa** do Feitiço Auxiliar
(ver `src/systems/afty/afty-feiticos.js`, bloco PERMUTATIVOS). Era a antiga Fase C2
("Enfraquecedores") do plano dos Auxiliares, parada desde 2026-07-23 esperando este texto.
NÃO parafrasear: o texto abaixo é palavra por palavra.

---

## FEITIÇOS PERMUTATIVOS

Uma possibilidade para customizar Feitiços Auxiliares é transformá-los em Feitiços
Permutativos, os quais enfraquecem um aspecto do usuário para melhorar outros
efeitos.

Quando criar um Feitiço Auxiliar, você pode optar por reduzir um aspecto em um
máximo igual ao bônus original do Feitiço. Então, por exemplo, caso o Feitiço Auxiliar
possua um bônus de +4, o máximo que você poderia reduzir em outro efeito é -4.

Porém, devido a falta de proporção entre certos tipos de Feitiços Auxiliares, apenas
alguns podem receber malefícios, enquanto outros não. Para isso, siga:

- Efeitos de Bônus em Rolagens para perícia podem ter outro bônus reduzido
  para conceder um aumento, o qual deve ser do mesmo atributo ou de um atributo
  que possua alguma semelhança e proximidade narrativa. É impossível, então, perder
  Intimidação para receber um bônus em Feitiçaria, mas é possível perder Atletismo
  para ganhar Acrobacia. Para cada -2 em uma perícia, você adiciona +1 na perícia
  escolhida no Feitiço Auxiliar, tendo como exemplo: em um Feitiço Imediato de
  Nível 1, enquanto ele estiver ativo, recebo -4 em Atletismo para receber no total +4
  em Acrobacia (+2 do bônus imediato padrão e +2 pelo prejuízo em Atletismo).
- Aumentos de Defesa ou Redução de Dano podem ser aplicados neste método,
  possuindo uma proporção de: para cada -2 em Defesa, recebe-se +1 de RD, ou o
  contrário, com cada -2 de RD sendo +1 de Defesa, possuindo um máximo igual
  ao dobro do nível do Feitiço. No entanto, é obrigatório possuir RD ou Defesa
  suficiente para utilizar o Feitiço: caso a sua Defesa caia para um valor menor que a
  base (10 + Mod. de Destreza), o Feitiço não pode ser usado, e o mesmo se aplica para
  a RD — caso você não possua RD Geral a perder, o Feitiço não pode ser usado. A RD
  recebida é aplicada para todos os tipos de RD do Feitiço.
- É possível reduzir o bônus de acerto em testes de ataque por Margem de
  Crítico, a qual é uma proporção complexa mas que está presente em técnicas como
  a Proporção, seguindo o padrão de: para cada -3 no acerto, a margem de crítico
  aumenta em +1, e vice-versa. Caso utilizado desta forma, é possível receber margem
  de ameaça como um Feitiço de nível 1, podendo ser reduzida para nível 0 caso
  seja por apenas um ataque; o máximo que você pode reduzir de acerto por um
  Feitiço é igual ao nível do Feitiço multiplicado por 3, sendo assim, seria impossível
  reduzir um Feitiço de nível 1 para -6 para receber +2 na margem; o contrário
  também acontece, porém, se você não possui margem de crítico para perder, você
  não pode utilizar um Feitiço que perde margem de crítico; esse efeito também pode
  ser aplicado junto de um Feitiço de aumento de margem, mas não de um Feitiço de
  aumento de acerto.

---

## A TABELA QUE O CÓDIGO SEGUE

Cada efeito tem UMA troca possível, então a ficha só guarda quanto perde (e qual perícia).

| Efeito do Feitiço | Perde | Taxa | Perde no máximo |
|---|---|---|---|
| Bônus em Rolagem (numa perícia) | outra perícia, qualquer uma | −2 = +1 | o bônus original |
| Redução de Dano | Defesa | −2 = +1 | 2 × nível |
| Aumento de Defesa | RD Geral | −2 = +1 | 2 × nível |
| Margem de Crítico | Acerto | −3 = +1 | 3 × nível |
| Bônus em Testes de Ataque | Margem | −1 = +3 | nível |

---

## DECISÕES DO AUTOR (2026-10-02)

1. **Vale nos dois sistemas**, criatura e personagem. Motor compartilhado, sem divergência.
2. **Margem e Acerto são simétricos.** Margem de Crítico perde Acerto, e Bônus em Testes de Ataque
   perde Margem. Margem no Nível 1 existe só pela troca, e no Nível 0 com Um Único Evento, que conta
   como Nível 1 no teto. Bônus em Ataque nunca perde Acerto ("não de um Feitiço de aumento de
   acerto").
3. **Quem recebe paga.** A troca é do efeito: com vários alvos, cada um paga e ganha. A trava olha a
   ficha de quem recebe, que na Ficha é a própria.
4. **A perícia sacrificada é livre**: qualquer perícia da ficha, menos a do próprio Feitiço. A
   proximidade narrativa fica com a mesa.
5. **Múltiplos Efeitos também**, com o teto pelo **nível do efeito**. É proibido sacrificar o que
   outro efeito do mesmo Feitiço aumenta (RD perder Defesa ao lado de Aumento de Defesa, Margem
   perder Acerto ao lado de Bônus em Ataque, e os inversos). Impossibilidade, com cadeado.
6. **Cada troca no seu teto** (a tabela acima). O teto geral ("um máximo igual ao bônus original")
   vale só na Perícia, a única sem teto próprio no texto. O exemplo do livro (−4 Atletismo num +2)
   segue sendo erro, decisão de 2026-07-23: sai −2 Atletismo e +3 Acrobacia.
7. **Permutativo sempre soma, prejuízo E ganho**, fora do pool de Feitiços, com bônus e
   penalidades. Só o bônus da tabela do Feitiço disputa o pool, como sempre. Palavras do autor:
   *"Se eu tenho uma Habilidade que eu perco -3 de Acerto Permutativo para ganhar por exemplo
   Margem. E tenho outra ativa sobre mim que me fornece +7 de Acerto. Ao invés de pegar somente a
   maior nesse caso. Eu somo ambas."*
8. **A troca entra no fim, com taxa fixa**: depois do Um Único Evento, da divisão da Duradoura e da
   divisão entre alvos, e nunca dobra nem divide. RD Nível 2 Imediata com evento único e −4 Defesa
   dá (10 × 2) + 2 = 22. Com 2 alvos, cada um recebe +5 da tabela e +2 da troca.
9. **"Não pode ser usado" trava ao ligar.** Na Ficha o interruptor fica travado com o motivo. Se já
   estava ligado e o número caiu depois (uma condição), segue ligado com aviso. No criador, aviso no
   card.
10. **Margem é por arma.** Bônus em Ataque que perde Margem vale só nas armas com margem a perder. Na
    arma sem margem não entra nada, nem o ganho nem o prejuízo. Nenhuma arma com margem trava o
    Feitiço.

## ASSUNÇÕES (a confirmar, anotadas em a-fazer.md)

- Bônus em Rolagem ganha alvo opcional: **Toda Rolagem** (o padrão, igual ao de antes) ou uma
  perícia. A troca de perícia só abre com perícia escolhida.
- Margem só pela troca no Nível 1 existe só na **Imediata**, a coluna em que a Margem nasce na tabela.
- O **bônus original** é lido antes da Liberação Máxima, que é de mesa: o teto fica igual no criador
  e na Ficha.
- **Base da Defesa** = 10 + mod do atributo que a Defesa usa (Destreza, ou o que o canal
  `defesaAtributo` trocar).
- **RD a perder**: RD Geral − redução ≥ 0 ("o mesmo se aplica para a RD").
- **Margem a perder numa arma**: o crítico dela está pelo menos a redução abaixo de 20.
- A RD ganha vai para o mesmo canal da RD do Feitiço (hoje RD Geral), então cobre todos os tipos dele.
- Sem troca em célula especial (Esquiva Garantida, Garantido, Crítico Garantido): não há número.
- Transformação e Passivo ficam sem Permutativo: o texto fala só do Auxiliar.
