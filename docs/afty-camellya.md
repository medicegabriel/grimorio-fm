# Camellya: Jardim da Flor Carmesim

Pacote `addons/camellya.json`, versão 1.2.0, atualizado em 2026-10-22.
Base bcaf978695c3d239b84f0a12ed11479adc428016, remoto sem atualização.
Sem commit ou push. Motor, DSL, fórmulas e 2.5.2 não foram alterados.

## Instalação e atualização

Importar o JSON em Outros > Addons, atualizar a biblioteca e a cópia do
pacote na ficha. Na aba Feitiços, atualizar os oito modelos antigos pelos
botões do pacote. A cópia do addon e os Feitiços adquiridos são registros
separados, portanto atualizar apenas o pacote não converte os modelos antigos.

O Perfil Amaldiçoado continua com uma única entrada, o Funcionamento Básico
Jardim da Flor Carmesim. Biografia, aparência e habilidades individuais não
são publicadas ali. ND, patamar, especialização, origem, atributos e aquisição
dos modelos continuam manuais, respeitando as vagas nativas.

## Criação nativa

O autor pediu categorias e efeitos reais do sistema de criação. Todos os
modelos deixaram Personalizado. Os números da proposta inicial foram
adaptados às tabelas já implementadas, sem criar tabelas ou canais paralelos.
Descrições conservam a narrativa e as restrições de mesa aplicáveis, sem
repetir o dano e os bônus livres da versão antiga.

Exemplos abaixo: criatura Afty ND 26, modificador de técnica zero, sem outros
bônus ou reduções. Conjuração Aprimorada, atributos, habilidades e reduções
da ficha alteram o resultado normalmente, e as fontes ficam no hover.

| Recurso | Configuração nativa | Resultado de referência |
|---|---|---|
| Marca da Germinação | Passivo/Característica, nível 0, sem efeito numérico | Contador de até duas sementes, resolução dos alvos manual |
| Vinha Secundária | Dano 0, ataque único, ação comum, alcance reduzido em 6 m | 2d10, 3 m, 0 PE |
| Chicote Carmesim | Dano 5, ataque único, ação comum, alcance reduzido em 30 m | 25d12 + 52, 18 m, 20 PE |
| Germinação Parasita | Dano 3, TR, condição forte Imóvel, alcance reduzido em 6 m | 8d8, 18 m, 8 PE |
| Floração Sangrenta | Dano 4, área, esfera, alcance e área reduzidos em 6 m | 12d10 + 26, centro a 24 m, área 6 m, 12 PE |
| Jardim Silencioso | Auxiliar 2, Bônus em Rolagem de Percepção, sustentado, ação bônus, próprio | +1 Percepção, 5 PE e 1 PE por rodada posterior |
| Cálice de Espinhos | Auxiliar 3, Redução de Dano, imediato, reação, próprio, evento único | RD 28 no evento, 8 PE |
| Floração Descontrolada | Especial 5, Transformação sustentada, ação comum | +4 Defesa, +13,5 m e 3d8 Durante Ataque, 20 PE e 5 PE por rodada posterior |

Imóvel é condição forte. O Nível 2 não pode aplicá-la no criador, então
Germinação passou para o Nível 3, sem ignorar o requisito. Anexar a condição
consome cinco dados, e a redução de alcance devolve um dado. Não foi marcada
uma dificuldade de requisito inventada para obter dano gratuito da semente.

Chicote usa o custo padrão do Nível 5, sem texto livre de 8 PE. As reduções
normais da ficha agora funcionam nele. Floração usa trocas reais para chegar
ao alcance e à área propostos, com o dano residual calculado pelo criador.

Cálice recebe a dobra nativa de RD por evento único. A Transformação usa os
três espaços de efeito auxiliar de Nível 3 da tabela de Transformação 5.
Seu bônus de dano segue Durante Ataque nativo, nas linhas de ataque atendidas
pelo motor, incluindo armas e Ataque Básico. Não representa mais o adicional
livre de 2d8 exclusivo de um ataque direto de técnica por turno. Essa diferença
faz parte da adaptação para o efeito nativo e não foi ocultada numa descrição.

## Ativação e automação

Jardim e Transformação usam as vagas nativas de Sustentação em Buffs > Técnica,
inclusive o limite de quantos Feitiços a ficha consegue sustentar. Sem aquisição
do modelo não há efeito da Transformação. Desligar a sustentação remove seus
bônus. O Jardim altera a Percepção e, por consequência, a Atenção enquanto ligado.

Cálice usa o interruptor nativo do Feitiço imediato. Desligar após resolver o
evento, para não manter a RD nas próximas ocorrências. Usar o controle apenas
na situação válida não cria uma reserva automática de Reações.

Foram removidas as ações pagas específicas de Jardim e Transformação e o
contexto Movimento na Rede. Isso evita somar os bônus antigos aos novos ou
pagar duas ativações. Estados gravados dessas ações antigas ficam inertes.
Os custos são calculados pelo Feitiço nativo. Gastos, reação e manutenção
não devem ser considerados automaticamente pagos só por ligar um estado,
usar a barra de PE quando a interface nativa não descontar.

Marca continua sendo uma mecânica própria com contador 0 a 2, sem fingir um
bônus numérico de Passiva que ela não concede. Nenhum modelo possui categoria
Personalizado, nem campos de rolagem ou custo livres desse formulário.

## Limites de mesa

Alvos e duração das sementes, remoção, consumo em Germinação, uma aplicação
por rodada e ausência de sementes duplicadas por alvo são manuais. A condição
Imóvel está anexada ao Feitiço, mas o narrador ainda resolve o TR e aplica
seu resultado ao alvo. Fortitude em Germinação e Reflexos em Floração estão
nas descrições. O criador fornece a CD nativa, sem automatizar os testes dos
adversários. Tipos cortante e perfurante ficam nos textos dos recursos.

O bônus de Jardim é contextual aos testes da rede, manter sua sustentação
ligada apenas no contexto válido. Não há visão através de paredes ou detecção
automática de invisibilidade. A rede narrativa continua com raio de 12 m.

Máximo de três rodadas em Jardim e Transformação, uma Transformação por combate,
um Chicote por turno, um Cálice por rodada e a Lacuna de Memória continuam
na mesa. Exaustão segue a regra exibida pela Transformação sustentada nativa.
Não há técnica máxima, domínio ou energia reversa concedidos automaticamente.

Desativar o pacote retira seu Funcionamento e contador, mas não apaga os oito
Feitiços já copiados para a ficha. Esses modelos passam a funcionar como
qualquer Feitiço nativo adquirido. Removê-los manualmente se desejar retirar
também as habilidades, encerrando previamente suas sustentações.

## Fontes e inventário

Documento inicial enviado pelo autor, SHA-256
`61f0838bf9e811f9d93363b11758f150ef7bc968ca1b0effe8b0e6b48f890377`.
Em 2026-10-22 o autor pediu adaptar as habilidades ao sistema de criação,
usando Personalizado apenas para casos que não possam ser representados.
A orientação foi acrescentada à seção 3 do AGENTS.md.

Os valores desta versão são resultados da implementação atual do criador.
O Markdown oficial obrigatório não está disponível em
`C:/Projetos/Grimorio/F&M 2.5.2 - Livro de Regras.md`, e seu hash esperado
`1d0713d52c818a9ab9f47b883d9887a0d227d174d30ffcce358874669a7a733a` não
foi conferido. Não há certificação independente de legalidade ou equilíbrio.

AD-73: 30 chaves ativas. Reconciliação 1.2.0 com 10 adições, 21 remoções e
13 atualizações, restritas ao pacote. Proposta em
`docs/revisao-automacao/camellya-1-2-proposta.json`. Histórico e tombstones
preservados. Conteúdo DA CASA, NÃO REVISADO. As 267 identidades anteriores
de Oda continuam fora da transação.

## Validação

62 asserts específicos passaram em Afty e Player, incluindo categorias reais,
campos do criador, cálculos de dano e condições, ausência de avisos, bônus
nativos em combate, sustentação, não duplicação de estados antigos e atualização
dos modelos da versão anterior. Prévia isolada em `.audit/camellya.html`.

ESLint e build passaram com os avisos existentes de versão do Node e tamanho
do bundle. Suíte completa: 207 de 208 arquivos passaram. A única falha é
`t-reconciliacao-g00.mjs`, pela diferença anterior de 267 identidades de Oda,
agora com 13.792 fontes para 14.059 itens vivos. A diferença não aumentou.
Diff sem conflitos, sem U+2014 novo e sem alterações em `src/components/`.
Sem nova conferência visual nesta revisão, a tentativa anterior de acessar
a prévia local pelo navegador retornou ERR_CONNECTION_TIMED_OUT.
