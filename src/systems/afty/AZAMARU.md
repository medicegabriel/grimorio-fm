# Azamaru

Pacote importável em `azamaru.json`, sem import no bundle. Instalá-lo em Cálculos > Addons, ativar na ficha e adicionar Azamaru no catálogo de armas. A arma ocupa uma única entrada de inventário. O arquivo foi mantido neste diretório para respeitar o escopo explicitamente solicitado nesta tarefa.

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

Errou contra mim dissipa um clone. Fui atingido e Área dissipam todos. O botão de Área deve ser usado quando os clones forem afetados sem o usuário, ou quando o usuário falhar no TR. Sucesso no TR não exige alteração do estado. Dissipar 1 corresponde à ação livre.

Após rolar o dano do ataque que acertou, Acertei consome os pares de clones acumulados. O resto ímpar permanece até a próxima rodada. O botão deve ser usado mesmo quando existir apenas um clone acumulado, para marcar sua expiração. Falhar um ataque não consome a reserva. Não há consumo automático ao rolar o ataque, porque o resultado contra a Defesa do alvo é resolvido pela mesa.

Ignorar toda RD, imunidade e resistência aparece na linha da arma transformada. O sistema continua recebendo dano já resolvido pela mesa, conforme o fluxo existente de dano rápido, sem buscar ou alterar a defesa de outra criatura automaticamente.

O texto recebido está preservado na descrição do JSON. No title do painel, os pontos e vírgulas são apresentados como quebras de linha, sem alterar as palavras.

Verificação: `node --input-type=module -e 'await import("./src/systems/afty/asserts/t-azamaru.mjs")'`, ESLint do Afty e build Vite.
