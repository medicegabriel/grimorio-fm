# Vespa Crabro

## Addon 1.1.1

Instale ou atualize `addons/vespa-crabro.json` em Outros > Addons e ative
o pacote na ficha. O id continua `vespa-crabro`, preservando o progresso
do treino. Adicione Gungnir e Hwando no Inventário, equipe as armas e adquira
os oito modelos em Habilidades > Feitiços. Modelos antigos recebem a oferta
nativa de atualização. Instalar o addon não compra habilidades, não concede
equipamentos e não substitui escolhas da ficha automaticamente.

O pacote reúne o treino, duas armas, duas manobras e oito modelos de nível 5.
O Perfil contém somente o Funcionamento Básico. `libera: ["feiticosRestritos"]`
reutiliza a abertura existente para criação marcial nas origens sem conjuração,
mantendo os tipos e orçamentos dessa liberação. Não transforma Restringidos em
conjuradores de Dano, Auxiliar ou Especial.

### Armas pelo guia de criação existente

| Arma | Receita | Propriedades e resultado |
|---|---|---|
| Gungnir | Custo 4 com dado do Custo 3, 2d12. Complexa +1 e custo anterior +2 pagam Estendida, Versátil e Energética, uma redução cada | Haste, Fineza, crítico 20, 2d12 em uma mão e 2d12 + 1d4 em duas. Corpo a corpo a 3 m ou arremesso a 27/36 m. Ferramenta de Grau Especial com Retorno, Penetrante e Potente |
| Hwando | Custo 4 com dado do Custo 3, 2d12. Créditos +3, gasto 5: Energética 1, Mortal d10 2 e crítico 18 2. Redução de dois Níveis | Espada, Fineza, Energética, Mortal d10, crítico 18, dano 1d12 + 1d8. Alcance corpo a corpo de 1,5 m |

Dados conferidos por `contaDaArmaPorNivel`, sem avisos. Potente entra pelo
encantamento, sem pré-inclusão no dado base. Os bônus e a redução de grau dos
encantamentos seguem a divergência nativa entre Criatura e Player. A Hwando
não recebe poderes de lança ou teletransporte.

Gungnir tem Corpo a Corpo como categoria principal e manejo padrão. O seletor
Manejo de Gungnir alterna para Arremesso durante o combate. A categoria escolhida
é resolvida antes dos requisitos e encantamentos do equipamento e acompanha
o treinamento, os escopos do Motor e a linha de ataque. Arremesso usa efetivamente
o teste nativo de Distância e os alcances da arma. Retornar a Corpo a Corpo
restaura o teste e os efeitos dessa categoria. Uma única entrada de inventário, uma única linha de
ataque com o mesmo id e os mesmos encantamentos, sem duplicar equipamento.
Estendida não aumenta o alcance de arremesso.

Versão 1.1.1, esclarecimento do autor: a classificação de Arremesso vale
quando esse manejo está selecionado. Fora de combate e no catálogo,
Gungnir permanece Corpo a Corpo. Hwando conserva sua classificação.
Validação da versão 1.1.1: 176 asserts específicos de combate passaram em
Afty e Player. ESLint e build passaram com avisos existentes. Suíte completa
com 209 de 210 arquivos aprovados, mesma pendência preexistente de Oda.

### Habilidades

| Habilidade | Categoria e resolução | Custo e resultado base |
|---|---|---|
| Harpoon Throw | Manobra de Gungnir, Ação Atacar, linha nativa no modo Arremesso | Sem PE, dano e alcance da arma. Só um acerto confirmado gera carga. Não aplica condição gratuitamente |
| Harpoon Recall | Manobra de equipamento | Recuperação de lança presa: Ação Comum, sem PE ou dano. Retorno ofensivo: Ação Atacar, recupera a lança e exige resolver um ataque nativo separado |
| Nested Harpoon: Beesting | Golpeador 5, um golpe, Gungnir | 20 PE, arma + 11d12 Após Ataque. Base 14d12 menos 3 dados por Lento, TR de Fortitude, 4 rodadas |
| Nested Harpoon: Waspsting | Golpeador 5, um golpe, Gungnir | 20 PE, arma + 4d12 Após Ataque. Base 14d12 menos 5 por Imóvel e 5 por Sangramento Forte, TR de Fortitude, 3 rodadas |
| Gungnir's Droning | Passivo 5 e controle por alvo | No Player, menos 10 PE máximo. Uma vez por rodada, após acertar Gungnir, consome todas as cargas daquele alvo e causa 1d12 por carga, sem crítico |
| Yellow Apic Stinger | Golpeador 5, quatro golpes com Gungnir | 20 PE, arma + 3d12 Após Ataque por golpe, penalidades cumulativas nativas de 0, -3, -6 e -9. Cada acerto gera uma carga |
| Gungnir | Dano 5, um alvo, ataque da técnica | 20 PE, base 20d12 perfurante e alcance 48 m. Usa os adicionais nativos de conjuração da ficha, sem somar novamente o dano da arma |
| Apic Flashburst Blade Art | Auxiliar 5 sustentado, Ação Bônus, própria | 20 PE, margem de crítico da Hwando melhora em 3. Manutenção 2 PE. Outras armas, Básico e Feitiços não recebem o bônus |
| Shin | Transformação 5 sustentada, Ação Comum | 20 PE, três efeitos de Auxiliar 3 Duradouro: Ataque +4, Defesa +4, RD 11. Manutenção 5 PE, Exaustão nativa |
| Rend Space: Apic Flashburst Blade | Golpeador 5, um golpe com Hwando | 20 PE, arma + 14d12 Após Ataque. Sem anular defesas, criar teletransporte ou gerar ressonância de Gungnir |

Todos os Golpeadores usam Movimento Restante + 7,5 m, uma utilização por rodada
para cada Feitiço. O componente da arma é resolvido na linha nativa e somado
ao adicional do Golpeador, sem criar uma segunda cobrança do Feitiço. Os
valores da tabela são os componentes base, antes dos modificadores da ficha.
O criador conserva os campos reais de condições, sangramento, golpes, ação e
efeitos. Não há Feitiço Personalizado.

### Shin e sustentação

O autor escolheu explicitamente o estado de ativação manual, com custo e
benefícios calculados pelas tabelas nativas. Shin não usa Sanidade ou um
gatilho de Limbus. Não aumenta BT e não recebe o bônus futuro do Estilo.
Escolha o modelo e use os controles normais de Buffs e Sustentação.

Ativação e pagamentos seguem o controle manual de recursos já existente.
Não há um segundo botão de addon cobrando ou concedendo os mesmos benefícios.
Na Transformação sustentada, a cada duas rodadas consecutivas posteriores à
ativação há 1 Exaustão, conforme o cálculo nativo. Sustentação de Shin e da
Arte disputa as vagas existentes: normalmente uma, duas com Sustentação
Avançada e três com Sustentação Mestre. O pacote não concede vagas extras.

### Ressonância aprovada em 2026-10-25

O autor aprovou: 1 carga por acerto confirmado de Gungnir, teto igual ao BT
e duração até encerrar o combate. Cada golpe acertado de Ferrão Amarelo conta
separadamente. Beesting e Waspsting não geram cargas adicionais. Não há custo
separado para gerar cargas. O Zumbido é o único consumidor desta versão.

Em Ações, adicione cada inimigo ao painel de Gungnir e confirme cada acerto
já resolvido. Rolar ataque, rolar dano ou errar não gera carga automaticamente.
Os eventos recebem ids e um evento repetido não é aplicado duas vezes.
Os contadores e os ids persistem na sessão da ficha, nunca no catálogo.

Após o acerto, o Zumbido consulta o alvo correspondente, gera sua rolagem e
consome todas as cargas daquele inimigo numa operação. O registro vai ao
histórico. O limite de uso é global ao Vespa por rodada, sem contornar ao
trocar de alvo. Uma nova rodada exige novo acerto para consumir. As cargas
de outros alvos permanecem intactas. O dano não é automaticamente descontado
dos PV de outra ficha.

Zumbido usa Passivo sem categoria numérica única porque o catálogo de Passivos
não representa dano variável com consumo e gatilho por alvo. A categoria
Personalizado não foi utilizada. O cálculo vive em `afty-gungnir.js` pela
primitiva optativa `ressonanciaGungnir`, sem emitir um bônus global de dano.
Esse escalonamento é homebrew aprovado, não um valor atribuído à tabela oficial.

### Perfurações, retorno e limites de automação

Depois de adquirir, pagar e resolver o Feitiço e seu TR, os botões Beesting
e Waspsting registram a perfuração no alvo do acerto confirmado. Podem
coexistir e têm duração própria, 4 e 3 rodadas. Imóvel prevalece sobre Lento.
As condições e o sangramento são aplicados na ficha do inimigo pela mesa,
usando os controles nativos. O marcador não substitui essa aplicação.

A lança cravada fica indisponível como arma empunhada e não sustenta os bônus
do treino sozinha. A Hwando continua disponível. Recuperar solta a arma,
remove os marcadores de perfuração e libera a linha nativa novamente, sem
causar dano, criar acerto ou consumir ressonância. Sangramento já aplicado
não é curado pela retirada. As consequências das condições seguem na ficha
do inimigo, com resolução manual. Não há sangramento adicional na remoção.

Com a lança cravada, novas confirmações exigem um acerto de Beesting ou
Waspsting já pago e resolvido no mesmo alvo. A arma presa não permite
confirmar um ataque comum nem acertar outro inimigo à distância.

Retorno ofensivo também recupera o equipamento e exige uma Ação Atacar e
a resolução de um ataque nativo. O botão não rola dano por si só. O retorno
automático do encantamento quando a arma não está presa dispensa a manobra
de retirada e não cria um segundo ataque.

As condições no alvo, a economia de ações, os TRs, os acertos, o pagamento dos
Feitiços e a soma de arma com Golpeador continuam sob controle da mesa. O
painel automatiza o estoque, seu consumo, a rolagem do Zumbido, os marcadores
e a disponibilidade da arma, sem prometer reconhecimento de acerto por d20.

Fim de combate e descanso limpam os dados de Gungnir. Remover o addon torna
a mecânica inerte. Cópias já adquiridas de Feitiços seguem o ciclo nativo de
modelos do sistema e não são apagadas pelo addon. Novo Estilo das Sombras
continua separado, pendente da definição do valor que recebe metade de BT.

### Fontes e verificação

Proposta do autor anexada em 2026-10-25 e confirmações de Shin e ressonância
nesta conversa. Referência de identidade consultada pela skill Firecrawl:
[Vespa, Assist Unit](https://limbuscompany.wiki.gg/wiki/Vespa/Assist_Unit).
Os números da obra não foram transferidos para o d20. Custos, receitas,
dados e efeitos conferidos nos calculadores atuais do repositório.
O Livro Markdown externo obrigatório continua ausente, por isso não há
SHA-256 conferido ou certificação de fidelidade oficial nesta adaptação.

### Validação da versão 1.1.0

Conferência final com 338 asserts aprovados: 134 de combate do Vespa,
86 do treino, 70 do treino original e 48 do registro de primitivas.
ESLint e build passaram com os avisos existentes. A suíte de 210 arquivos
apontou a lista de primitivas esperadas, corrigida e rechecagem aprovada,
e a falha preexistente de reconciliação de Oda: faltam as mesmas 267
identidades, com 13.879 fontes para 14.146 itens vivos. Nenhuma ficha
pessoal foi alterada. Prévia isolada conferida no navegador para alvos,
consumo, recuperação, perfurações, Shin, Arte e manejo de arremesso.

## Treino da versão 1.0.0

Instale `addons/vespa-crabro.json` em Outros > Addons e ative na ficha.
O pacote único do personagem continha, na versão 1.0.0, apenas o Treino Guarda
do Arpão Amarelo (`vespa-crabro:guarda`). Adquira as etapas em Interlúdios.
É uma variante homebrew do Treino Guarda da Lâmina Divina 1.0.0, solicitada
em 2026-10-25, com autorização expressa para as duas armas do Vespa.

Gungnir usa o grupo nativo Haste e Hwando usa Espada para esta adaptação.
A compatibilidade é por grupo, como no treino original: também funciona
com outras armas desses grupos. Não foram criadas estatísticas de equipamento
nem alterados dano, crítico, alcance ou propriedades de nenhuma arma.

## Benefícios

- Etapa 1, 1 Foco: +1 Nível de dano nas armas dos grupos Espada ou Haste.
- Etapa 2, 1 Foco: +2 Percepção com uma arma desses grupos empunhada.
- Etapa 3, 2 Focos, Sabedoria 14: Mestre em Percepção enquanto empunha
  uma dessas armas. Se a faixa escolhida já for Mestre, recebe +2 na perícia.
- Etapa 4, 3 Focos, Destreza 22 e Sabedoria 14: +3 Defesa enquanto
  empunha uma dessas armas.
- Completo: conserva integralmente o benefício de Ler intenções do original,
  com resolução manual por alvo e sem exigir arma empunhada.

Total de 7 Focos, sem aquisição automática. As duas armas juntas não duplicam
Percepção, proficiência ou Defesa. O nível de dano vale em cada ataque elegível,
sem aumentar Ataque Básico, facas ou Feitiços. Guardar todas as armas elegíveis
desliga os efeitos das etapas. Armas inválidas ou indisponíveis não ativam.
O treino original permanece intacto. Esta variante o substitui na montagem
do personagem, sem requerer a instalação do pacote original.

## Integração e limites

O campo opcional `gruposEquipamento` aceita uma lista de grupos alternativos
no emissor de efeitos de Treinamento. Uma única linha é emitida quando pelo
menos uma entrada válida e equipada pertence à lista. O campo singular
`grupoEquipamento` mantém sua semântica anterior. Se ambos forem declarados,
ambos os filtros precisam ser atendidos. O alvo de dano reutiliza o OU nativo
`grupo:espada|grupo:haste`, sem criar canal ou variável DSL.

Fonte desta variante: pedido e briefing do autor de 2026-10-25 e
`addons/guarda-da-lamina-divina.json` 1.0.0. Não constitui revisão de regra
oficial ou reprodução de estatísticas da Project Moon.

Armas, dez habilidades e Ressonância de Gungnir foram acrescentadas na versão
1.1.0 acima. O treino original foi preservado nessa atualização.

## Validação histórica da versão 1.0.0

86 asserts do Vespa e 70 do treino original passaram, cobrindo Afty e
Player pelo deriveAfty. ESLint e build passaram com avisos existentes.
Suíte completa: 208 de 209 arquivos aprovados. Única falha preexistente,
t-reconciliacao-g00, pelas 267 identidades de Oda ainda não reconciliadas.
Sem mudança de tela ou conferência visual nova. Registro restrito às
41 identidades do addon, lote AD-74, sem aprovação de auditoria.
