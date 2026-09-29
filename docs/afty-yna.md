# Yna

Addon de mesa em `addons/yna.json`, versão 1.0.0, feito em 2026-09-29. Não entra no bundle. Vale nos
dois sistemas (`/Afty` e `/Player`), por decisão do autor.

## Instalação

Em Outros > Cálculos, no card Addons, cole ou importe o JSON e ligue o pacote na ficha. Depois,
em Identidade, escolha a Origem Kitsune e a Linhagem Getsurin.

## O que o pacote traz

| Parte | Família | Onde aparece |
|---|---|---|
| Origem Kitsune | `origens` | seletor de Origem |
| Linhagem Clã Getsurin | `clas` (rótulo "Linhagem") | botões abaixo da Origem |
| Caudas por Marco | `contadoresOrigem` | Recursos de Origem, no fim do card |
| Treino de Cônjuge | `treinamentos` | aba Interlúdios |
| Treino de Desenvolvimento Amaldiçoado | `treinamentos` | aba Interlúdios |

## Kitsune

| Característica | Motor |
|---|---|
| Aumento de Atributo | 3 pontos, no máximo 2 no mesmo atributo (o mesmo desenho do Arauto e dos clãs do Herdado) |
| Herança de Inari | o pool de Anatomia do Feto Amaldiçoado (`poolAnatomia`), 1 no início e mais 1 a cada 5 níveis |
| Caudas de uma Raposa | o número pronto na Ficha ("Caudas: N"), por `resultados` |
| Forma de Raposa | interruptor de sessão: Tamanho Pequeno e +2 em Percepção |
| Linhagem Herdada | o seletor de Linhagem |

### As Caudas

Decisão do autor: a ficha conta sozinha, e o Narrador libera os marcos.

```
min(10, 1 + (nd >= 3) + (bt - 2) + yna_caudas_por_marco + (nd >= 20))
```

1 de partida, mais 1 no nível 3, mais 1 a cada subida do Bônus de Treinamento (5, 9, 13, 17 e, na
criatura, 21 e 26), mais 1 no nível 20, mais os marcos (o contador "Caudas por Marco", de 0 a 3,
no card da Origem). O teto é 10. Sem marcos, dá 7 no nível 20, e os três marcos fecham os 10 do
texto.

### A Forma de Raposa

Decisão do autor: interruptor de sessão, o mesmo do Cônjuge. Ele aparece na aba Ações da Ficha
Final, na bancada de Simulação de Combate do criador e no Encontro, e vale dentro e fora de
combate. Ligado, soma duas linhas temporárias: `tamanho -1` (Médio vira Pequeno, com a régua de
Atletismo -2 e Furtividade +2 que o Pequeno já traz) e +2 em Percepção.

Foi preciso ensinar o Motor a aceitar `gatilhoSessao` em característica de origem, porque efeito de
origem roda antes de os estados de combate existirem. Ver a seção "Interruptor de sessão na ORIGEM"
em `afty-addons.md`.

## Clã Getsurin

| Característica | Motor |
|---|---|
| Salto Gravitacional | Atletismo Treinado, ou Mestre se a ficha já escolheu Treinado (`1 + (prof_atletismo >= 1)`, `semCredito`, o mesmo truque da Extração de Potencial). A distância do Saltar fica no texto: a ficha não guarda salto |
| Lapidação Prateada | +1 Nível de Aptidão à escolha (`pontosAptidao`) a partir de 5 Caudas. O alcance e a área ficam no texto, por decisão do autor |

O segundo efeito da Linhagem liga pelo `quando` com a mesma conta das Caudas. O contador de
marcos entra no contexto do montante, então um marco cedo antecipa a Lapidação.

## Treino de Cônjuge

Molde do Treino Cônjuge do Flugel, com as diferenças do texto da Yna. Todo número depende do
interruptor "Cônjuge".

| Etapa | Focos | Motor |
|---|---|---|
| 1 | 1 | a Perícia escolhida usa o Bônus do Cônjuge digitado (`periciaFixa`, só se for maior que o da própria ficha) |
| 2 | 1 | +2 de Dano (`danoBonus`) |
| 3 | 1 | +2 de Acerto |
| 4 | 2 | a escolha Herança abre uma vaga de Feitiço ou de Talento |
| Completo | | Pensamento Mútuo: metade do BT na Iniciativa, aparada para baixo |

O Feitiço Passivo herdado paga o PE permanente dele como qualquer Passiva da ficha, que é o
*"você perde os PE permanentes"* do texto.

## Treino de Desenvolvimento Amaldiçoado

Molde do Estudo do Jujutsu, fora do Restringido como as outras linhas de energia.

| Etapa | Focos | Motor |
|---|---|---|
| 1 | 1 | +2 PE |
| 2 | 1 | +2 em Feitiçaria |
| 3 | 1 | +3 PE |
| 4 | 2 | +1 Nível de Aptidão livre |
| Completo | | +1 Nível de Aptidão livre |

## Leituras por conta própria

Cinco, todas em `a-fazer.md` ("Yna: cinco leituras para confirmar"): o tamanho da Forma é degrau e
não absoluto, o +2 vale em toda Percepção, a "menor aptidão" vira ponto livre, o Pensamento Mútuo
usa o próprio BT como no Flugel, e as etapas 1 a 3 do Desenvolvimento custam 1 Foco.

## Asserts

`asserts/t-yna.mjs` lê o mesmo JSON e mede os dois sistemas: as Caudas nível a nível, a Lapidação
ligando em 5, o Atletismo, o pool de Anatomia, a Forma de Raposa fora de combate, o contador, os
dois treinos, a linha "Caudas: N" da Ficha e a ficha sem o pacote.
