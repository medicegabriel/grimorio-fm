# CX1: base e correções comprovadas

## Checagem inicial, 2026-10-29

Fonte externa lida diretamente: `C:/Projetos/Grimorio/F&M 2.5.2 - Livro de Regras.md`.
SHA-256 confirmado: `1d0713d52c818a9ab9f47b883d9887a0d227d174d30ffcce358874669a7a733a`.
Páginas conferidas pelo último marcador impresso acima da regra: 35, 36, 235, 307 e 365.

Base: HEAD `d6d6dd77a7999d0df0454eb58d62584c0f46a9a3`, branch main.
O conector GitHub comparou esse HEAD com main e retornou identical, zero commits de diferença.
`git ls-remote` falhou por rede nesta execução. Nenhum movimento de base foi feito.
Preexistiam modificações em `src/systems/afty/afty-tecnicas-marciais.js`,
`asserts/t-tecnicas-marciais.mjs` e `docs/afty-tecnicas-marciais.md`, preservadas.
Não havia entrega de CL1 neste checkout. Nenhum chat foi iniciado ou contactado.

Linha de base medida antes de mudar comportamento: 241/243 arquivos aprovados,
14.656 asserts nos arquivos aprovados. Falharam `t-prodigio` e `t-reconciliacao-g00`.
Log: `.audit/cx1-baseline-20261029.log`. Reprodução nova e isolada:
`.audit/cx1-20261029/diagnostico.mjs` e `diagnostico-inicial.txt`.
Os artefatos antigos de `.audit/livro-20261029/` permanecem históricos.

| Parcela | Página ou decisão | Evidência atual | Veredito inicial |
|---|---|---|---|
| N07 | 235 e 365 | Defesa Passiva 5 retorna 4, Sustentada 7 | Corrigir para piso, 3 |
| N06 | 365 | PV 86, um Bracelete 96, dois 106 | Corrigir repetição nos canais diretos e Motor |
| N08 | 307 | Ataque real sem Defesa retorna sucesso null nos naturais 1 e 20 | Reprodução antiga refutada, explicitar semântica de ataque |
| N02 | 35 | Lutador 10 conserva 1d12 com Arma Natural | Corrigir mínimo, melhoria e escolha física |
| N03 | 35, decisão de 03/10 | Nativa mantém 1,5 m, addon já usa alcanceArma | Corrigir somente a lacuna nativa |
| N04 | 35 | Sem escolha e sem 1d4 na perícia | Implementar com dadosPericia |
| N05 | 35, decisão direta nesta sessão | Atletismo +2 incondicional | Condicionar ao gatilho de sessão aprovado |
| Testes antigos | Contrato do lançador e reconciliação | Persistem frase incompatível e quantidade fixa de 32 | Corrigir mantendo provas e recusas |

As fichas novas de reprodução usam Feto Amaldiçoado Híbrido, Lutador 10, uma Anatomia
por vez dentro das três vagas, sem equipamentos ou compras conflitantes. O caso de
Passiva 5 usa a calculadora nativa e será integrado a Conjurador no nível de acesso.
O teste antigo que chamou `rolarTeste` com o rótulo Ataque não estabeleceu semântica
de ataque. A Ficha clássica, G2 e Encontro encaminham o descritor real pelo mesmo
preparador de arma, atualmente sem alvo ou Defesa.

## Desenho mínimo e decisões

- Preservar a fórmula de dano própria da criatura Afty e as divergências de Player.
- Usar o coletor de origem, canais e catálogo de perícias existentes para as escolhas.
- Deduplicar fontes do mesmo acessório sem excluir combinações que o texto permite.
  Ombreiras do Vigor Superior explicitamente se usam com Braceletes, p.148.
- Marcar explicitamente testes de ataque. O 20 garante acerto e o 1 garante erro,
  margem reduzida continua dependendo da Defesa. Sem comparação, os demais resultados
  ficam indeterminados. Não criar ataque com alvo ou economia de ações neste lote.
- O autor escolheu nesta sessão: declarar Duas Mãos Livres manualmente na sessão,
  com o benefício de Atletismo desligado por padrão. Reutilizar `treinosAtivos` e
  `gatilhoSessao`. Não inferir ocupação integral a partir do inventário atual.

Reservas registradas em `docs/a-fazer.md` antes das alterações. Este documento é
evidência da entrega, não uma segunda fila. Implementação e validações serão acrescidas.

## Aprofundamento antes de corrigir cada família

N08: a investigação do preparador encontrou `defesaAlvo` em propriedades de
armas com Ampla/Oscilante, exposto em `ControlesDeArma.jsx` e no G2. O Bastão
simples, custo 1, sem requisito de Força, permite uma reprodução admissível.
Antes da correção: natural 20, total 34, Defesa 100, sucesso false e crítico
true. Natural 1, total 15, Defesa 1, sucesso true. O defeito ficou confirmado
por esse percurso. A reprodução genérica anterior continua insuficiente como
prova e o teste genérico preserva sua comparação pelo total.

N02: a ficha Afty exige escolher Corpo Treinado, enquanto a Player recebe a
base da classe automaticamente. Os asserts novos fazem essa escolha no Afty.
Comparações usam uma Anatomia de cada vez dentro do orçamento. A conferência
visual usa nível 15, com as quatro Anatomias dentro das quatro vagas, Bastão
e dois Braceletes dentro da carga e do conjunto de equipamentos do grau.

N03: decisão do autor em 03/10/2026 confirmada no histórico e no código do
addon: corpo a corpo e Ataque Básico, nos dois sistemas, sem tamanho/Feitiço.
A entrada nativa faltava, o mecanismo e o addon já estavam cobertos.

N04: `dadosPericia` já preservava dado real na rolagem, com fonte. O coletor
agora valida a escolha contra o catálogo ativo, incluindo Ofícios e perícias
personalizadas, sem transformar 1d4 em média fixa.

## Implementação e contratos para CL1

- `rolarTeste` aceita `tipoTeste: "ataque"`. Campo persistido no registro.
  Rótulo não estabelece semântica. O preparador da arma marca `linhaArma` e
  `ataqueId`, compartilhado pela Ficha clássica, G2 e Encontro. `cd` explícita
  precede a Defesa de sessão. 20 garante sucesso e 1 falha, mesmo sem Defesa.
  Entre 2 e 19, sucesso depende do total e da Defesa, ou fica null sem ela.
  Crítico de margem reduzida só é publicado se não houver falha conhecida.
  A operação já existente de arma usa o resultado para bloquear dano de erro.
- Mãos: `sessao.treinosAtivos.anatomia_duas_maos_livres`, booleano, padrão
  false. Operação `alteraTreinoAtivo`, normalização, salvamento e leitura por
  `opcoesDeriveDaSessao` já existentes. O estado é declaração de mesa, não
  ocupação calculada nem atribuição a mãos individuais. CL1 poderá consumir
  a declaração quando apropriado, sem tratá-la como inventário completo.
- Corpo Especializado: `core.origem.anatomiasConfig.corpo_especializado.pericia`.
  Emite `dadosPericia` no alvo `<pericia>:d4`, com fonte. Ausente/inválida não
  concede. Arma Natural: `anatomiasConfig.arma_natural.tipoDano`, `ct/pf/im`,
  padrão antigo `im`. Campos permanecem ao desligar uma Anatomia, mas não
  emitem se a origem não oferece o pool ou a Anatomia não está escolhida.
- Arma Natural: mínimo 1d8 na fórmula Player, melhoria de um nível quando o
  dado desarmado base supera 1d8. Afty conserva sua fórmula e o canal de nível
  equivalente, sem adotar o dado impresso do Player. Fineza/Enérgica preservadas.
- Acessórios: mesmo `def.id` equipado emite benefícios uma vez, incluindo
  caminhos diretos, Motor e Habilidade Única. Cópias continuam equipadas,
  carregadas e no custo. Metadado resolvido `beneficioRepetido` identifica a
  cópia suprimida. Conjuntos expressos entre itens diferentes preservados.
- Passivas: só a metade da Sustentada usa piso. Tabelas próprias, custos e
  os efeitos já salvos nas fichas não são reescritos. Nível 2 de Defesa resulta
  zero. O assert de Técnica Marcial agora prova esse zero e o bônus no nível 3,
  preservando as alterações locais anteriores no restante daquele arquivo.

## Arquivos de produto e testes

`src/systems/afty/`: `AftyCreatureBuilder.jsx`, `afty-anatomias.js`,
`afty-origens.js`, `afty-efeitos.js`, `afty-efeitos-conteudo.js`,
`afty-derive.js`, `afty-pericias.js`, `afty-equipamentos.js`,
`afty-feiticos.js`, `afty-propriedades-armas.js`, `ficha/ficha-rolagem.js`.
Teste novo: `asserts/t-cx1-base.mjs`. Ajustes nos asserts `t-prodigio`,
`t-reconciliacao-g00` e apenas na contraprova atingida de `t-tecnicas-marciais`.
Guias: DSL, fórmulas base, equipamentos e Player. Fila e histórico atualizados.

## Reconciliação: rejeição correta preservada

A expectativa de 32 remendos estava obsoleta: existem 33. O assert agora
compara o conjunto exato de identidades declaradas em `substitui` nos arquivos
JSON com o conjunto coletado, conserva a base histórica mínima de 32 e exige
alvo, proprietário e prova de integração em cada um. Não se tornou uma
verificação vazia. As recusas de proposta obsoleta, payload editado, ausência
de dono e demais casos anteriores permanecem.

Depois dessa correção, `t-reconciliacao-g00` alcança e reprova a cobertura de
fontes individuais: 1.235 chaves vivas sem registro em `fontes.json`, 863 delas
em addons/heranças. A coleta não tem erros. O conjunto inclui conteúdo
preexistente e as novas entradas de CX1. Evidência:
`.audit/cx1-20261029/fontes-pendentes.json`, gerada pelo script irmão.

Essa rejeição não foi removida e a campanha não foi reconciliada ou aprovada
automaticamente. O protocolo exige donos confirmados, fontes por item e
preservação de estados/histórico. Essa entrega não atribui páginas ou donos a
conteúdo de outros lotes para pintar o teste de verde. O encerramento integral
de CX1 depende dessa reconciliação, com pendência específica na fila única.

## Validação observada

- `asserts/t-cx1-base.mjs`: 186 asserts aprovados. Cobrem as oito categorias
  que usam a metade de Sustentada nos níveis 0 a 5, aplicação da Passiva,
  divergência do custo, cópias de acessórios e combinação expressa, atributos,
  perícia e Motor, dado mínimo/superior de Arma Natural, tipos, fontes,
  alcance com exclusão da distância e do tamanho, escolha inválida, dado real
  em perícia, declaração de mãos salva e desligamento, ataque com Defesa por
  Ampla, falhas, margem reduzida, vantagem/desvantagem e testes genéricos.
- `npm run asserts`: 243 de 244 arquivos aprovados, 14.876 asserts nos
  aprovados. Único arquivo reprovado: `t-reconciliacao-g00`, pela cobertura
  de fontes descrita acima. `t-prodigio`: 33, `t-feiticos-passivos`: 56,
  `t-propriedades-armas`: 158, `t-tecnicas-marciais`: 164 aprovados.
- `node asserts/t-ordem-modulos.mjs`: 40 aprovados. Imports novos só para
  módulos já carregados ou folhas. `npx eslint src/systems/afty/`: exit 0.
  `npm run build`: exit 0, avisos de tamanho de chunks e tempo de plugins.
- Chrome com build de produção local, contextos temporários e armazenamento
  exclusivo por contexto, sem fichas reais. Player/Afty a 1440 e 390 px:
  escolha de tipo físico e perícia no criador, Salvar, recarregar, reabrir,
  alcance, dano, rolagem de 1d4, declaração de mãos, persistência e Encontro.
  O Encontro foi iniciado pelos controles reais Rolar Tudo e Começar.
  Ataque com Defesa informada e naturais controlados passou pela linha real.
  Sem rolagem horizontal na Ficha/Encontro. Capturas inspecionadas.
- Passiva antiga com efeito salvo 4 foi preservada ao abrir. Pela interface
  Habilidades, Usar este valor gravou 3, que chegou à Defesa. Player/Afty,
  Conjurador 20, uma Passiva de nível 5 dentro do acesso e orçamento.
- Não houve erro de aplicação nos percursos finais. No preview local houve
  404 exclusivamente de `/_vercel/insights/script.js`, três por cenário
  completo, registrado separadamente. Não se declarou o console inteiro limpo.
- Roteiros e resultados: `.audit/cx1-20261029/browser.mjs`,
  `browser-resultados.json`, `browser-passivas.mjs` e
  `browser-passivas-resultados.json`. Lint, build, suíte e diagnóstico final
  estão na mesma pasta. O log da linha inicial está no caminho registrado acima.

## Concorrência observada no fechamento

Após as verificações de produto, surgiram `ficha/ficha-uso-estado.js`, mudanças
em `ficha/ficha-sessao.js` e `asserts/t-ordem-modulos.mjs`, e a entrega em
andamento `entregas/CL1.md`. São do CL1 e não foram editados por CX1.
A implementação de estado foi lida: até esse corte não possui contrato de
mãos nem substitui o discriminador `tipoTeste` de CX1. O guia anunciado
`docs/afty-motor-uso-combate.md` ainda não existia no momento da consulta.
Não se tratou um nome de arquivo planejado como operação disponível.

O teste de ordem de módulos já incluiu a nova folha. A repetição da suíte
sobre a árvore concorrente foi registrada em `asserts-com-cl1.txt`.
Esse corte não certifica CL1 ou seus arquivos criados depois da lista inicial
do lançador. A ausência de entrega CL1 na checagem inicial acima continua
histórica, sem apagar o trabalho que apareceu depois.

Resultado dessa última repetição: 242/244 arquivos aprovados, 14.843 asserts
nos aprovados. Além de `t-reconciliacao-g00`, `t-revisao-g00` reprovou a
coleta pelos novos `ficha/ficha-acoes.js`, `ficha-uso-estado.js` e
`ficha-uso.js`, ainda sem classificação no controle G00. O fechamento da
campanha agora também precisa registrar esses módulos do CL1, sem alterar
silenciosamente sua propriedade. `t-cl1-uso.mjs` e outros módulos surgiram
depois da lista inicial do lançador e não são certificados por essa execução.
A contagem de 1.235 fontes é o corte anterior a esses módulos, no JSON de
evidência, e não foi regenerada como se cobrisse o CL1 ainda em andamento.

## Situação e passagem

As parcelas de produto confirmadas de CX1 estão implementadas e verificadas.
O lote permanece com fechamento parcial pela reconciliação G00. Não há
outro núcleo ou integração de produto aguardada para estas correções.
A integração das características equivalentes dos addons pertence a CX2,
conservando a decisão de Duas Mãos Livres já respondida.
Nenhuma promoção G2, alteração da abertura diária, commit, push ou publicação.
O contrato de ataque/mãos está acima para consumo por CL1.

Reservas de CX1 liberadas: todos os arquivos de produto e testes listados
acima, esta entrega, fila, status e guias. `ficha/abas/AbaPericias.jsx` foi
reservado preventivamente, mas não precisou de alteração: a marcação de
`ataqueId` foi suficiente no preparador compartilhado. Os módulos novos de
CL1, sessão, sua entrega e seus guias continuam sob reserva do CL1 conforme
o registro próprio. Não há reserva ativa de CX1 após a passagem.
