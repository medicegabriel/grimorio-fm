# Aprovação inicial encontrada pelo autor

Fonte recebida em 2026-10-08 após a integração. Revisão somente de leitura
dos equipamentos, sem sobrescrever addon ou export. Esta fonte descreve
Murasama, Yagen e Corrente, não os oito itens completos nem a evolução
dos encantamentos de Grau Especial recebida antes.

## Texto recebido

Murasama
Grupo: Espada
Custo: 4
Peso: 1
Dano: 2d10
Crítico: 19
Propriedades: fineza, fatal, energética, mortal, leve e especial
Uma das melhores criações de Sengo Muramasa, o povo diz que as espadas forjadas por Muramasa eram yōtō (espadas demoníacas) e possuíam uma sede de sangue incontrolável. Acredita-se que elas precisavam "provar sangue" para não trazer azar ou enlouquecer o seu portador. E após provar tanto sangue, em particular o de feiticeiros essa espada carniceira se tornou maldita, assim como seu portador.

Especial: Murasama é uma espada movida por sede de sangue, seu portador também consegue sentir sensações como sede de sangue, agressividade, intenções, etc...
Ao empunhar a espada o portador recebe seu recebe +2 em percepção para coisas a sede de sangue e agressividade.

Yagen Tōshirō
Grupo: Escudo
Custo: 4
Peso: 1
RD: 8
Penalidade: -6
Yagen é uma espada criada por Sengo igual a suas irmãs, porém diferente delas ela foi feita para aparar ataques e proteger os outros, uma coisa revoltante para uma espada amaldiçoada e e revoltada que nem a mesma que clama por batalha. A espada sempre está guiando seu portador para o combate e o confronto frontal, atrapalhando o portador em outras áreas.

Por estar sempre guiando seu portador para batalhas seu portador sempre sabe aonde é o Norte, e ao utilizar a ação ler intenções você recebe recebe +2 no bônus fornecido por ler intenções

Corrente
Custo: 1
Peso: 0,5
Grupo: chicote
Dano: 1d8
Crítico: 19
Ao acoplar a corrente na arma, você passa a usar as duas mãos com tal arma.

## Comparação com o cadastro

| Item/campo | Aprovação inicial | Cadastro atual | Resultado |
| --- | --- | --- | --- |
| Murasama grupo/custo | Espada, 4 | Espada, 4 | Confere |
| Murasama dano | 2d10 | 2d10, com Potente declarado incluído | Valor confere, falta esclarecer se a aprovação era base ou final |
| Murasama crítico | 19 | Base 20 e Certeira, final 19 | Final confere, base diverge se 19 era antes de Certeira |
| Murasama carga | Peso 1 | 1 espaço | Número confere, a unidade do texto é Peso |
| Murasama percepção | +2 situacional | Texto concede BT situacional | Diverge, com BT 8 da ficha atual seria +8 no texto anterior |
| Murasama Fatal/Mortal | Sem dado | Sem dado inventado, preservados no texto | Parâmetros continuam ausentes |
| Yagen grupo/custo/base | Escudo, 4, RD 8 | Escudo, 4, base gravada 8 | Confere |
| Yagen penalidade | -6 | 0 | Diverge |
| Yagen carga | Peso 1 | 2 espaços, padrão autorizado anteriormente | Número diverge se Peso representa os espaços de carga |
| Yagen orientação e Ler Intenções | Norte, +2 na ação | Mesmo benefício no texto | Confere, controle na mesa |
| Corrente | Custo 1, Peso 0,5, chicote, 1d8, crítico 19, duas mãos ao acoplar | Ausente dos oito itens | Não cadastrada |

Não usar o Chicote de Corrente do catálogo como substituto automático.
Seu texto concede alcance e efeito de crítico do chicote, além de ações
bônus para acoplar/desacoplar. Nada disso foi concedido à Corrente desta
aprovação, que diz somente usar duas mãos ao acoplar.

Lâmina Carniceira e o Bloqueador especial de Grau Especial (RD base +BT e
um nível de Ler Intenções) não constam desta aprovação inicial. Vieram do
pedido anterior de evolução por graus. A ausência aqui não revoga uma
aprovação posterior, mas esta fonte sozinha não comprova esses benefícios.

## Pontos a esclarecer antes de corrigir

Pergunta enviada: dano 2d10 e crítico 19 da Murasama são bases antes de
Potente e Certeira ou resultados finais? Se bases, com esses encantamentos
o dano seria 3d10 e o crítico 18. Se finais, os valores atuais são coerentes.

Peso não foi explicitamente convertido em espaços nesta aprovação. Confirmar
a equivalência antes de alterar a carga da Yagen para 1 e cadastrar Corrente
com 0,5 espaço. Separar aprovação inicial de evoluções posteriores.

## Verificação

Leitura do export real via `deriveAfty`, somente Murasama empunhada:
BT 8, crítico base 20, crítico final 19. Somente Yagen empunhada: base
resolvida 16 (8 + BT), RD Física 23 (base resolvida + grau 5 + Reforçado 2),
penalidade 0, 2 espaços. Não houve gravação desses estados no export.
Main remota permanece em `891b6d4`, igual ao HEAD. Nenhuma mudança de
código ou de ficha nesta revisão, sem necessidade de repetir build ou
suíte completa já validados na integração anterior.
