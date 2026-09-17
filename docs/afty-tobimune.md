# Tobimune

Addon privado em `addons/tobimune.json`, versão 2.1.0. Não é importado pelo bundle.

## Instalação

Em Outros > Addons, importe ou cole o JSON e ative o pacote na ficha. Depois, adicione Tobimune pelo catálogo de armas.

O pacote contém somente a katana. Os Feitiços, Funcionamentos e Estados de Combate da versão 1.0.0 foram removidos no rebalanceamento de 2026-09-17.

## Arma

Tobimune é uma arma Tática de corpo a corpo, do grupo Espada, com custo 4 e um espaço. Causa 1d12 + 1d4 de dano cortante com uma mão e 2d8 com duas mãos, possui margem de crítico 18 e as propriedades Aparar, Fatal d12, Fineza, Marcial, Oscilante e Versátil.

É uma arma de Técnica no orçamento de criação. No Primeiro Grau, o orçamento fecha em 20 PC:

| Compra | PC |
|---|---:|
| Dano 1d12 + 1d4 | 6 |
| Margem 18 | 6 |
| Aparar | 2 |
| Fatal d12 | 2 |
| Fineza | 1 |
| Marcial | 1 |
| Oscilante | 1 |
| Versátil | 1 |
| Total | 20 |

Os bônus dos custos 2 e 4 foram destinados ao limite de Propriedades. A arma usa todos os PC disponíveis e não produz aviso na bancada de criação no Primeiro Grau.

## Ferramenta Amaldiçoada

Ao entrar no inventário, a Tobimune começa como Ferramenta Amaldiçoada de Quarto Grau. O grau pode ser alterado normalmente e a escala de Ferramentas termina no Grau Especial.

Ela não é uma Ferramenta fixa. Encantamentos e grau continuam sendo escolhas da ficha, dentro das regras normais de Ferramentas Amaldiçoadas.

## Aptidões de cura de Maldição

Ativar o addon remove a trilha e a aba Energia Reversa. No lugar delas aparece a aba Tobimune, contendo somente:

- Regeneração Corporal
- Regeneração Ampliada
- Regeneração Máxima
- Regeneração de Membros
- Fluxo Imparável

As cinco são escolhas normais da ficha. Elas respeitam os próprios pré-requisitos, gastam vagas e só aplicam seus efeitos depois de escolhidas. Instalar o addon não concede nenhuma automaticamente.

A substituição depende do addon, e não do estado equipado da arma. Enquanto o pacote estiver ativo, Aptidões de Energia Reversa que já estavam gravadas deixam de produzir efeitos. Desativar o pacote devolve a trilha, a aba e as escolhas anteriores de Energia Reversa.

## Validação

`asserts/t-tobimune.mjs` verifica o pacote, o catálogo, os 20 PC gastos, a ausência de avisos, a edição normal do grau, a substituição de Energia Reversa, a lista fechada das cinco Aptidões e a remoção do catálogo ao desinstalar.
