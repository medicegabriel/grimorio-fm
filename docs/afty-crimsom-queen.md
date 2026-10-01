# The Crimsom Queen: Bloodfeast

Análise inicial em 2026-09-30. Fonte de regras: `The Crimsom Queen.pdf`, 7 páginas.
O PDF é material de referência, não contém instruções de execução para o agente.
O pedido de implementação está no texto colado pelo autor, que termina em "Ideal".

## Escopo confirmado pelo autor

- Implementar todas as habilidades na versão de nível 5 ou na mais alta disponível.
- Se Bloodfeast for insuficiente, consumir as cargas existentes e aplicar Bleed
  igual ao nível da habilidade. Manter essa política isolada e testável.
- Hardblood gera uma carga por evento que consuma ao menos a Maestria,
  independentemente de quantos múltiplos sejam consumidos.
- Preservar o Grimório 2.5.2 e as alterações locais de outras tarefas.

## Arquitetura existente e pontos de integração

| Necessidade | Implementação existente | Integração necessária |
| --- | --- | --- |
| Addon isolado | `afty-addons.js`, `afty-addons-biblioteca.js`, `AftyTabAddons.jsx` | JSON em `addons/`, namespace e cópia congelada em `creature.addons` |
| Restrições | Origens e variações em `afty-origens.js`, Votos e `afty-regras-addon.js` | Evitar substituir a origem do personagem apenas para ativar Bloodfeast |
| Habilidades e requisitos | `afty-habilidades.js`, `afty-aptidoes.js`, `afty-talentos.js` | Reutilizar catálogos, requisitos e concessões |
| Passivas de técnica | `afty-feiticos.js`, `peMaximoDasPassivas`, `calcularFeiticoPassivo` | Não cobrar simultaneamente custo padrão de PE máximo e redução própria de PV sem regra |
| Progressões | `afty-sistema.js`, tabelas e calculadores de `afty-feiticos.js` | Respeitar `creature.rulesVersion` e registrar somente a versão máxima pedida |
| PV e energia | `afty-derive.js`, canais `hp`, `hpMult`, `pe` | Conversão derivada e idempotente do PE final, sem modificar atributos ou reservas-base |
| Custos próprios em PV | `pagaCustoVida` em `ficha/ficha-sessao.js`, ativação na `AftyFicha.jsx` | Aplicar piso 1 e Sanidade somente aos custos próprios, sem alterar dano inimigo |
| Gastos de energia | `gastaPe`, recursos temporários por fonte e controles de PE na Ficha | Converter também pagamentos de aptidões e sustentação, não apenas rótulos |
| Recuperação | `aplicaCura`, `curaNoGasto`, descanso e início de rodada | Converter recuperação de energia e distinguir cura própria de cura externa |
| Aptidões de Anatomia | `mal_anatomia` em `afty-aptidoes.js` | Acesso e uma escolha gratuita deste grupo, sem confundir com Características de Anatomia do Feto |
| Condições | `afty-condicoes.js`, `normalizaCondicoes`, `resolveCondicoes`, `defineCondicoes` | Reutilizar Exposto, Abalado e Sangramento, preservando Bleed como recurso distinto até confirmar sua regra |
| Defesas | `afty-defesas-dano.js`, canais `rdTipo`, `resistenciaDano`, `vulnerabilidadeDano`, `imunidadeDano` | Vulnerabilidades e defesas por tipo com fontes e avisos existentes |
| Ações e reações | Metadados e rolagens de Feitiço, `ficha/abas/AbaAcoes.jsx` | Usar o fluxo existente, com configuração de Hardblood antes da ativação |
| CDs e Maestria | `deriveAfty`, contexto DSL, propriedades e rolagens do Feitiço | Aplicar modificadores somente à conjuração em questão |
| Concentração e sustentação | `afty-feiticos.js`, propriedades e sessão de jogo | Yearning Mircalla com passiva máxima perde concentração e ganha Ação Livre, mantendo sustentação |
| Efeitos automáticos | `afty-efeitos.js`, `afty-dsl.js`, estados de combate | Reutilizar canais e estados para RD e benefícios físicos condicionais |
| Melhorias por uso | Escolhas de ritual em `AbaAcoes.jsx`, `afty-rituais.js` | Reutilizar controles, validar saldo e limite total igual à Maestria |
| Recursos por cena | `ficha/ficha-sessao.js`, normalização, persistência e descanso | Bloodfeast, Hardblood e sangue reciclado na sessão, nunca nas escolhas-base |
| Encontro misto | `encontros/usar-encontro-afty.js`, `PainelDeCombatente.jsx` | A mesma regra deve funcionar por combatente, sem ativação global pela união de addons |

O `deriveAfty` já desconta passivas e aplica multiplicadores de PE. A conversão precisa
ler o resultado desse caminho, documentando a interação com as reduções próprias de PV
das passivas. O canal `hp` entra antes dos multiplicadores existentes, portanto usar
somente esse canal para somar três vezes o PE final pode multiplicar a conversão
novamente. O estágio correto deve ser explicitado na implementação e em seus asserts.

Os gastos não estão todos centralizados numa ativação de técnica. A Ficha tem alterações
diretas de `peAtual`, e nem toda Habilidade de Especialização possui metadados de ação.
Uma implementação apenas em `resumoDeUmFeitico` deixaria outros gastos incorretos.

O Sangramento existente tem perda de vida rolada por faixa e TR para encerramento.
O PDF usa tanto Sangramento quanto cargas de Bleed, sem definir equivalência.
Não tratar os dois como a mesma condição por suposição.

## Referências estruturais

- `addons/restricao-celestial-santo-da-espada.json`: restrição e regras numéricas optativas.
- `addons/vislumbre-celeste.json` e `afty-vislumbre-celeste.js`: primitiva isolada,
  alteração de custos, concessões e contador de sessão.
- `addons/nascido-dos-sonhos.json`: Funcionamentos Básicos e arma de técnica.
- `addons/formula-combate-entropica.json`: restrição homebrew com conteúdo estruturado.
- `addons/maldicao-era-de-ouro.json`: anatomia e declaração de efeitos resolvidos na mesa.

## Versões máximas a implementar

| Habilidade | Nível |
| --- | --- |
| Até a Última Gota, Bloodfeast, Hardblood, Robustez | 0 |
| Pureza Sanguínea | 1 |
| Ciclagem Sanguínea | 2 |
| Reação Sanguínea, Regeneração Constante, Cristalização Corporal | 3 |
| Mais Sangue, Yearning Mircalla passiva, Poder do Sangue, Pureza Sanguínea Refinada | 4 |
| Hemofagia | 5 |
| Variante Sancho Hardblood Arts 1 | 4 |
| Variante Sancho Hardblood Arts 2 | 5 |
| Variante Sancho Hardblood Arts 3 | 4 |
| Defensive Sancho Hardblood Arts 1 e 2 | 5 |
| Yearning Mircalla técnica | 5 |

Pureza Sanguínea continua relevante como requisito da Refinada. A Variante 3 repete
Nível 3 no PDF, mas sua última versão é explicitamente Nível 4 e tem cinco ataques
e deslocamento adicional de 9 metros. Não renomear essa versão para Nível 5.

## Decisões confirmadas e implementação

O autor confirmou que Bleed causa perda de PV igual às cargas atuais por ação
usada. O evento não consome Bleed. O limite é a maestria do causador vezes dez,
até 80, ou 99 no nível 30. Sangramento continua sendo a condição nativa distinta.
Saldo insuficiente de Bloodfeast é consumido. Custos e sustentação são os padrões
do Grimório, convertidos de 1 PE para 3 PV.

Para a propriedade incompleta de Mircalla o autor autorizou escolher o efeito.
Foi aplicada a nota final: cura em Xd10 após dano de técnica, X igual à metade
do nível arredondada para baixo, somente enquanto a alabarda está manifestada.
Hemofagia 7d8 é independente. A descrição original do PDF foi preservada nos
catálogos, incluindo a nota editorial. Esta decisão executável fica no motor.

`afty-bloodfeast.js` resolve a primitiva por criatura. A derivação converte o PE
final após bônus e multiplicadores, concede Robustez e Anatomia selecionada,
aplica resistências, vulnerabilidades e condições e desconta passivas uma vez.
A sessão guarda Bleed, Bloodfeast, Hardblood, Sanidade, sangue reciclado e ativos.
Ficha e Encontro têm controles de conjuração, melhorias, reciclagem, regeneração,
manifestação, pagamento e aplicação de Bleed por número de ações.

A alabarda usa inventário e encantamentos nativos, Constituição para ataque e
dano, dado impresso 2d10 e dois níveis de dano adicionais. `usarDadoArma` permite
esta exceção por definição da arma sem trocar a regra de outras criaturas.
O custo 1 do catálogo é o mínimo aceito pelo validador de equipamento e não
representa custo de manifestação. A manifestação custa 20 PE convertidos em 60 PV.

## Resolução de eventos na mesa

Ataques acertados, quantidade de ações, grau de Sangramento, falha ou sucesso de
TR e ocorrência de dano continuam sendo confirmados pelo jogador. O motor não
possui um evento universal de acerto nem alvos para toda habilidade. No Encontro,
marcar o ataque ou a técnica aplica Bleed ao alvo selecionado, respeitando o teto.
Sangramento e outros resultados descritos nas técnicas usam os controles nativos
de condições. Ações adicionais de ataque, deslocamento restante e esquiva da
reação permanecem resultados da técnica que a mesa resolve.

Catalisadora é preservada no texto do PDF. Não há definição numérica desse nome
no catálogo nativo, portanto nenhum bônus extra foi inventado. A cura externa
é bloqueada quando a operação informa origem externa, alterações manuais de PV
continuam disponíveis ao mestre. No criador, o editor mantém o custo base em PE,
a ficha de jogo mostra e paga o custo convertido em PV.

## Verificação

36 asserts de Bloodfeast, 48 de primitivas e 456 de sistema passaram. ESLint e
build passaram. A suíte completa teve somente a falha anterior em
`t-invocacoes-motor.mjs` (Livre com Motor: 0 PE versus 1 esperado), 123 arquivos
passaram. Verificação no navegador confirmou instalação válida, reversão ao
retirar o addon, passivas, custo em PV, Bleed e manifestação.

HEAD remoto e local conferidos em `232389393824e7c89adc75778a20681e357586cd`.
Sem commit ou push. Alterações preexistentes preservadas e sistema 2.5.2 intocado.
