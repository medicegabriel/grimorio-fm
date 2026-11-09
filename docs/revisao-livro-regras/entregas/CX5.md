# CX5: inventário, itens, encantamentos e Interlúdios

Situação em 2026-11-06: **núcleos entregues e verificados, lote NÃO encerrado.** Faltam as telas e as ligações nos arquivos
reservados por CX3, listadas em "O que falta". Este registro é evidência, não outra fila. A fila única é `docs/a-fazer.md`.

## Base e concorrência

- Repositório: `C:/Projetos/Grimorio/grimorio-tracker`, branch `main`, HEAD local
  `deab72cc26a93ab39350b6a781fcb0ca052cc0fd`.
- Remoto consultado com `git fetch`: `origin/main` em `f6433a8a3c11f544c82e5f543738ea56e2920b3b`, dois
  commits à frente do HEAD local (`02a8cdc` addon Servos da Guerra e `f6433a8` Guerra de Feiticeiros 1.0.4).
  Nenhum pull, merge, reset, stash, commit ou push foi executado.
- Árvore local com muitas alterações de CL1, CL2, CL3, CX1, CX2, CX3 e do chat de CSS do G2, preservadas. O
  único diff relevante em `afty-equipamentos.js` antes deste lote é o da deduplicação de acessórios do CX1 (N06).
- Fonte do Livro: `C:/Projetos/Grimorio/F&M 2.5.2 - Livro de Regras.md`, SHA-256
  `1d0713d52c818a9ab9f47b883d9887a0d227d174d30ffcce358874669a7a733a` (conferido, idêntico ao esperado).
- Linha de base medida antes de qualquer alteração: `npm run asserts` com 264 de 265 arquivos aprovados. A única
  falha é `t-reconciliacao-g00` (1.235 chaves vivas sem fonte individual, pendência registrada em CX1), que
  não pertence a este lote.

## Fronteira de arquivos nesta execução

CX3 mantém reservados (fila, bloco "CX3: em andamento") `afty-derive.js`, `afty-feiticos.js`, `afty-pericias.js`,
`afty-schema.js`, `afty-cura.js`, `afty-efeitos-conteudo.js`, `AftyCreatureBuilder.jsx`, `ficha/ficha-sessao.js`,
`ficha/ficha-opcoes-derive.js`, `encontros/PainelDeCombatente.jsx`, `encontros/AftyEncontro.jsx`,
`asserts/t-ordem-modulos.mjs`, `asserts/LEIA.md`, `automacao-dsl.md`, `afty-formulas-base.md`, `afty-player.md`,
`revisao-automacao/fontes.json` e `escopo.json`. Por isso CX5 entrega **núcleos em módulos próprios e em arquivos
livres**, com pontos de integração documentados, e não toca nesses arquivos. A fronteira Claude (núcleos) e Codex
(telas e integração) do prompt é mantida: nenhuma tela foi editada por este lote.

## Tabela inicial de verificação

Veredito: implementar/corrigir (I), já coberto (C), falso positivo (F), divergência intencional (D), depende de
decisão (DD), depende de entrega (DE). "Núcleo" significa que a operação, o estado salvo, as recusas e os testes
entram neste lote e a tela depende de arquivo reservado.

| Parcela | Página ou decisão | Evidência atual | Veredito |
|---|---|---|---|
| Equipamento inicial do Player e escolhas | p.130, divergência `inventarioSimplificado` (`ativa: false`) | `EQUIP_INICIAL` e `orcamentoDoGrau` só alimentam o orçamento indicativo. Nenhuma operação entrega o uniforme comum, os dois itens de custo 1 e o kit. O Player já enxerga o catálogo inteiro | I (núcleo idempotente), tela DE |
| Reposição por missão e grau | p.130, Grau do Player pendente na fila | Não existe estado de missão. O orçamento é indicativo por decisão do autor (2026-07-22) | DD (Grau do Player e o que repor) |
| Carga e meio espaço dos Intermediários | p.129 e p.260, fila "O Intermediário ocupa meio espaço" | `espacosIntermediarios` é calculado e mostrado, não entra em `resolveCarga`. Mudaria números de fichas prontas | DD |
| Itens criados por Feitiço | p.229 | `calcularFeiticoItens` calcula custo e quantidade. Nada materializa o item, limita consumível por descanso nem conta não consumíveis simultâneos | I (núcleo), tela DE |
| Pulseira Magistral e Primacial | p.147 e p.149, p.365 | `aplicado: false`, sem escolha. Sonda real: um `proficienciaPericia` emitido por item chega a `testes.pericias[x].prof`, então o Motor aceita | I |
| Consumo de Pérolas, Mixes, Remédios, Elixir, Injeções, Óleos, Antídotos, Símbolos, Talismãs, Mistura Profana | p.146 a 149 | Nenhum item é consumível: a Ficha lista o inventário em leitura, sem botão nem baixa de unidade. A cura dos Símbolos e do Laço aparece na linha de Cura que cura sem baixar o item | I (núcleo), tela DE |
| Estamina dos Mixes | p.146 a 148 e decisão de 2026-07-29 | Estamina e Energia são o mesmo recurso (`peAtual`) | C no recurso, operação em I |
| Remédios e Elixir da Vida | p.146 a 149, CL2 | `gastaDadosDeVida` com `limite` e `multiplicadorCon` existe e é o contrato nomeado para CX5 | C no núcleo vital, operação em I |
| PV temporário dos Símbolos e teto | p.149, p.366 | Escritor de PV temporário existe, teto e substituição são de CX4 e CX4 não tem entrega | DE (CX4) para o teto, grava pelo escritor atual |
| Exaustão de Adrenalina, Mistura Profana e Laço | p.147 a 149, p.324 | Exaustão comum não tem efeitos entregues (pendência N11/CX4) | DE (CX4), a baixa do item entra |
| Venenos e regras de veneno | p.145 | Descrições existem. CD por custo (15/25/35/45), contato, +2 do Dardo e o tratamento não têm operação | I (núcleo de arma envenenada e CD), alvo em outra ficha DE (CX6) |
| Chaveiro Absorsor, Faixa de Foco, Amuleto do Vislumbre, Brinco da Comunicação | p.146 a 148 | Bônus numéricos já ligados. Eventos (eliminar inimigo), uso diário e comunicação não | I (evento e usos diários), Brinco é narrativo (F como ausência) |
| Talismã do Ápice | p.149 | Módulo próprio `afty-talisma-apice.js` | C |
| Domínio Simples Contido e Talismã de Barreira | p.146, 147, 148, CL3 | Paredes e Domínio Simples existem em CL3. O talismã não os aciona | I (liga a operação de CL3), tela DE |
| Cargas de Encantamento | p.154 | `fa.cargas = BT` só é exibido. Não há gasto nem recarga | I |
| 8 encantamentos ativos de Uniforme | p.159 e 160 | Só o texto. Conferida a lista atual: Aeronauta, Distorcivo, Escaldante, Estimulante, Impulso, Repulsor, Revestido com Espinhos e Ricochete | I (reação, carga, limite, números), efeito em outra criatura DE (CX6) |
| 8 encantamentos ativos de Escudo | p.158 | Só o texto. Avassalador, Bloqueador, Destruidor, Disco, Espinhoso, Esponja, Expansão de Escudo e Intangível. Ataque do escudo exige linha de ataque no derive | I (Esponja, Expansão, Bloqueador), ataque e Intangível DE (derive reservado) |
| Interlúdio: Criação de Itens | p.336 | Só o Caderno de Forja, que é anotação por decisão do autor (2026-09-11). Sem testes, CDs, tentativas, vantagem, tetos nem entrega | I (procedimento novo, o Caderno não muda), tela DE |
| Interlúdio: Criação de Invocações | p.337 | Inexistente | I (núcleo) |
| Interlúdio: Adaptação | p.336 | `afty-adaptacao.js` é o ciclo do Mahoraga e não este procedimento | I (núcleo) |
| Mestre da Criação | p.167 | CX3 ligou os dois Ofícios. As duas oportunidades por Foco pedem o procedimento | I, junto da Criação de Itens |
| Ferreiro, limite de equipamentos | p.143, fila "Aliados, Comidas e Ferreiro" n.3 | Bancada com `maxSelecionados: 2` e BT digitado | DD (contador por tipo de descanso) |
| Modular múltiplo | fila "A arma criada só guarda UMA opção de Modular" | Regra adicional do projeto, não é do Livro | DD |
| Texto Especial da arma criada | fila "O traço Especial da arma criada não aparece fora da bancada" | Confirmado: `especialTexto` fica só na bancada | I |
| Corpo Amaldiçoado Mutante | AGENTS.md | Descartado pelo autor | Fora do escopo |
| Armas improvisadas no seletor marcial | restrição do prompt | Decisão de recusa preservada | D, não mexer |
| Grau do Player, limite de carga, tipo de descanso | restrição do prompt | Decisões pendentes | DD |

## Menor desenho adotado

1. **Estado de itens na sessão, sem campo novo na ficha.** `normalizaSessao` é uma lista fechada de campos e a sessão é
   reservada, então o estado mora em `sessao.uso.itens` (`ficha/ficha-uso-estado.js`): `consumidos` (por `uid`, não volta no
   descanso) e `criados` (itens materializados por Feitiço). Cargas de encantamento e a conta de criação por descanso usam o
   contador de usos que o motor já tem (`sessao.usos`, chaves `cargas:<uid>` e `criacao:<feitiço>`), que o descanso já zera.
   Sessão antiga sem o campo lê zero e nada muda.
2. **Adaptador `fichaComItensDaSessao(ficha, sessao)`.** Puro, devolve a ficha com `qtd` já abatida e os itens criados anexados
   (ou a própria ficha quando nada mudou). Carga, bônus e RD continuam saindo do `resolveEquipamentos` sem tocar no derive. As
   telas chamam o adaptador antes de derivar (ponto de integração do Codex).
3. **Uso de item em cima do `usa` de CL1**, uma `opId` por clique cobrindo a baixa da unidade e o efeito, delegando cada efeito ao
   verbo que já existia. Sem verbo paralelo.
4. **Produção de Interlúdio em módulo próprio** (`afty-producao.js`, que não é folha e não é importado por nenhum módulo do ciclo do
   derive), estado na ficha (`creature.producoes`), entrega com `uid` determinístico para não duplicar ao reabrir. O Caderno de
   Forja continua anotação.
5. **Pulseiras** pelo canal `proficienciaPericia` do Motor, escolha guardada na entrada do inventário.

## Entrega e verificação (2026-11-06)

### Arquivos

Novos em `src/systems/afty/`: `afty-itens-uso.js`, `afty-encantamentos-ativos.js` (dados, folhas), `afty-producao.js`,
`afty-equipamento-inicial.js`, `afty-armas-improvisadas.js` (folha), `ficha/ficha-itens.js`, `ficha/ficha-itens-feitico.js`,
`ficha/ficha-itens-especiais.js`, `ficha/ficha-encantamentos.js`.

Editados: `afty-equipamentos.js` (Pulseiras, `textoEspecialDaArma`, `descricao` da arma criada, item de Feitiço fora do `custoGasto`),
`afty-extras-nativos.js` (teto do Ferreiro como parâmetro), `ficha/ficha-uso-estado.js` (campo `itens`, efeito de Exaustão no uso
ativo), `asserts/t-item-efeito.mjs` (o controle das Pulseiras inertes virou o contrato novo), `docs/afty-equipamentos.md` e a fila.
Nada em `src/components/`, nada nos arquivos reservados por CX3.

Testes novos (860 verificações): `t-cx5-pulseiras` 48, `t-cx5-armas` 11, `t-cx5-itens` 170, `t-cx5-encantamentos` 117,
`t-cx5-feitico-itens` 104, `t-cx5-producao` 237, `t-cx5-conjunto` 54, `t-cx5-itens-especiais` 103, `t-cx5-improvisadas` 16. Três
deles passaram por mutação deliberada (valor errado no dado) para provar que falham quando a regra quebra.

### Medido

- Linha de base antes de alterar comportamento: `npm run asserts` 264 de 265 arquivos, falha única `t-reconciliacao-g00`.
- Depois: 272 de 274 arquivos. Os 9 novos passam. A falha anterior continua e surgiu `t-revisao-g00` (ver abaixo).
- `npx eslint src/systems/afty/` sem erros. `node asserts/t-ordem-modulos.mjs` 50 de 50. `npm run build` aprovado.
- Navegador (`.audit/cx5-20261106/browser.mjs`, contexto isolado, ficha de teste importada, 1440 e 390 de largura, sem
  `--hide-scrollbars`): Ficha clássica do Player, aba Equipamentos, o inventário agrupa Pulseiras e Pérola, a Pulseira sem escolha
  NÃO gera aviso (a entrada leva só a marca `faltaEscolha`), sem erro de console e sem rolagem horizontal.

### Limites da verificação, ditos sem enfeite

- **Nenhuma tela foi construída**, então nenhum botão novo existe para ser conferido no navegador. As operações foram provadas por
  asserts com `deriveAfty` real e sessão real, nos dois sistemas.
- Não conferi no navegador a rota `/Afty`, o Encontro nem a Ficha G2: nenhum componente deles foi alterado, e a única mudança visível
  neles é o texto do aviso da aba Equipamentos, que é o mesmo componente que conferi.
- Desempenho não foi medido (nenhum caminho quente do derive mudou).
- `npm run build` gravou em `dist/`, a pasta da abertura diária. Outro processo já a tinha reconstruído às 01:51 (registro do chat de
  CSS). O conteúdo atual do `dist/` é o da árvore de trabalho de hoje, com as alterações em andamento dos outros lotes. Não tenho
  cópia do conteúdo anterior para restaurar. Quem precisar do `dist/` aprovado deve reconstruí-lo da base que escolher.
- `t-revisao-g00` está VERMELHO por minha causa: os 9 módulos novos não estão classificados em
  `docs/revisao-automacao/escopo.json`, que CX3 mantém reservado e estava sendo editado enquanto este lote rodava. Não editei o
  arquivo e não enfraqueci o assert. Para fechar, quem liberar o arquivo acrescenta (o mesmo molde dos módulos de CL1 a CL3):
  - em `arquivos`: `"afty-itens-uso.js": "EQU-00"`, `"afty-encantamentos-ativos.js": "EQU-00"`,
    `"afty-equipamento-inicial.js": "EQU-00"`, `"afty-armas-improvisadas.js": "EQU-00"`, `"afty-producao.js": "CRI-04"`;
  - nas entradas de INTERFACE: `ficha/ficha-itens.js`, `ficha/ficha-itens-feitico.js`, `ficha/ficha-itens-especiais.js` e
    `ficha/ficha-encantamentos.js`, cada uma com `"modo": "INTERFACE"` e a justificativa "CX5 (2026-11-06): ... sem catálogo de regra
    do Livro".

## Matriz dos Itens Especiais (48 do Livro, p.146 a 149)

Legenda: **Motor** é efeito numérico no catálogo (já funcionava), **Uso** é a operação do CX5 (`usaItem`, `ficha-itens.js`),
**Próprio** é operação de evento própria, **Módulo** é módulo existente, **Narrativo** não muda número.

| Item | Como funciona agora |
|---|---|
| Antídoto Simples, Intermediário, Superior, Absoluto | Uso: cura Envenenado e encerra venenos de custo até o do antídoto (o de custo acima é recusado) |
| Brinco da Comunicação | Narrativo |
| Chaveiro Canalizador | Motor (+1 CD) |
| Injeção Estimulante | Uso: +2 nas perícias do atributo escolhido, prazo MANUAL (o buff fica até a mesa o tirar) |
| Injeção de Adrenalina | Uso: reduz 1 de Exaustão, devolve no fim da cena |
| Mix Energético Pequeno, Médio, Grande | Uso: 3, 6, 10 de Estamina (o PE) |
| Óleo Amolador, Óleo Flamejante | Uso: cobre até 2 armas, dura o descanso ou a cena. O traço (Mortal d6, Modular Queimante) fica em `tracosTemporariosDasArmas`, e o cálculo de dano ainda não o lê (derive reservado) |
| Pérola Carregada, Conjunto, Terço | Uso: 3, 6, 10 PE |
| Remédio Simples, Intermediário, Complexo | Uso: gasta Dados de Vida com limite 4, 8, 12 |
| Símbolo da Vida, Florescente | Uso: cura 10 e 25. A linha do card de Cura continua curando sem baixar o item |
| Símbolo de Vida Absoluta | Uso: cura total e PV temporário de 3 vezes o nível pela fonte do item. Teto e substituição são de CX4 |
| Talismã de Barreira, Superior | Uso: 4 paredes de 15 e 25 PV (o Superior aceita reação) |
| Veneno Debilitante, Intenso, Desnorteante, Maldito, Lágrima de Shinigami | Uso arma o veneno na arma escolhida até o primeiro acerto. `aplicaVenenoNoAlvo` aplica no alvo com a CD pelo custo, o que está entre parênteses vale mesmo no sucesso |
| Amuleto do Vislumbre | Motor (+2 Percepção) e Uso diário de 10 rodadas |
| Apanhador de Saúde | Motor |
| Bracelete do Vigor, Ombreiras do Vigor Superior | Motor (PV máximo) |
| Faixa de Foco | Motor (+2) e Uso diário que dispensa o teste de concentração pendente |
| Pulseira Magistral, Primacial | Motor pela escolha da entrada (CX5). A Primacial só vê treino marcado na ficha ou dado pela Magistral, e NÃO o treino de Talento ou de Classe (limite conhecido, ver "O que falta") |
| Anéis do Conhecimento, Bracelete da Força, Cinturão do Inabalável, Faixas Céleres, Ornamento Fascinante, Pingente do Intelecto | Motor (atributo +2, teto 30) |
| Chaveiro Absorsor | Próprio: +2 PE por eliminação elegível confirmada pela mesa |
| Domínio Simples Contido | Uso registra o uso ativo de 2 rodadas. O efeito defensivo do Domínio Simples não é aplicado (depende do modelo de Domínio Simples) |
| Mistura Profana | Uso: reduz 1 PE em todo gasto da cena e cobra 1 de Exaustão no fim dela |
| Elixir da Vida | Uso: todos os Dados de Vida com o dobro do modificador, +5 em Fortitude e Integridade na cena. A vantagem é lembrada, não rolada |
| Laço da Vida | Próprio: evita a morte, cura metade, 1 de Exaustão, recusa com 5 de Exaustão |
| Talismã do Ápice | Módulo existente (`afty-talisma-apice.js`) |

## Matriz dos 16 encantamentos ativos (p.154, 158 a 160)

Cargas: um pool por ferramenta, vale o BT, compartilhado, volta no descanso (`sessao.usos["cargas:<uid>"]`).

| Encantamento | Estado |
|---|---|
| Aeronauta | Operação: reação, planar até o fim da cena, cai 6 m por turno |
| Distorcivo | Operação: carga, ação livre, uma vez por turno, 6 m sem ataque de oportunidade |
| Escaldante | Gatilho passivo: números (metade do BT em d6, CD da ficha, TR de Fortitude por decisão do autor) |
| Estimulante | Operação: carga e reação, vantagem no TR escolhido (lembrada, não rolada) |
| Impulso | Operação: carga e movimento, linha de 2 vezes o movimento, 1d10 por 6 m, TR de Reflexos contra a CD da ficha (decisão do autor) |
| Repulsor | Operação: carga e reação, CD da ficha, empurra 3 m (1,5 m no sucesso) |
| Revestido com Espinhos | Gatilho passivo: números (BT em d6 mais Constituição, perfurante, metade no sucesso) |
| Ricochete | Operação: carga e reação elevam de 20% para 50% até o próximo turno. `rolaRicochete` rola o d10 |
| Espinhoso, Destruidor, Avassalador | `danoDoEscudoAtacando` (vale o maior nível, 1, 2 ou 3) e `atacaComEscudo` (RD suspensa até o próximo turno). A linha de ataque nas Ações e a RD suspensa dependem do derive (reservado) |
| Disco | Gatilho passivo: arremesso 6/18 m. Linha de ataque depende do derive |
| Bloqueador | Passivo, efeito em outra criatura (CX6) |
| Esponja | Operação: reação, absorve 10, 15 ou 20 (Terceiro, Segundo, Primeiro ou Especial), a mesa confirma queda ou estrutura |
| Expansão de Escudo | Operação: ação bônus, dura a cena. O benefício na segunda criatura é de CX6 |
| Intangível | Passivo: `escudoIntangivelEquipado`. A mão livre nos requisitos depende do derive |

## Procedimentos de produção (p.336 e 337)

Em `afty-producao.js`. Todas as operações são funções puras de ficha para ficha, com identidade (`id` da tentativa, da troca ou da
produção) para não aplicar duas vezes.

- **Criação de Itens**: 1 + BT testes por foco (+2 com Mestre da Criação), Ofício treinado (inclusive os concedidos por Talento), CD
  pela tabela de Ofício e Custo, custo máximo pelo nível (1 a 5, 2 a 10, 3 a 16, 4 a 20), item do tipo que o kit cria, Alfaiate
  com 1 acessório (2 do nível 10) e 1 uniforme por interlúdio, troca de um teste por vantagem na próxima rolagem do mesmo Ofício.
- **Criação de Invocações**: Talismã (Entalhador) ou Marionete (Canalizador), 1 + BT testes por foco, CD por grau (15, 20, 30,
  40, 50), acesso ao grau pelo Nível de Controlador, vestígios guardados quando a CD não é alcançada, UM ESTOQUE POR VIA, vantagem no primeiro vestígio
  usado e +2 por vestígio além dele. O produto é uma Invocação em branco do grau e do tipo da via.
- **Adaptação**: metade do nível (para baixo) por foco, mesma Especialização, troca na mesma posição da lista de Habilidades, escolhas
  aninhadas da antiga saem.
- **Entrega**: `entregaProducao` põe o produto no inventário ou nas Invocações com `uid` determinístico. Entregar duas vezes, ou
  reabrir a ficha e entregar de novo, não duplica, mesmo se o marcador de entrega se perder.
- **Criação por Feitiço** (p.229) está em `ficha-itens-feitico.js` e o **conjunto de missão** (p.130) em `afty-equipamento-inicial.js`.

## O que falta, com o motivo

1. **Telas.** Nenhuma tela do CX5 existe: seletor de perícia da Pulseira (criador), botão Usar no inventário, usar encantamento e
   cargas, criar por Feitiço, abas de Produção e Adaptação, equipamento inicial e conjunto de missão. Motivo: o criador, a Ficha e o
   painel do Encontro estão reservados por CX3, e o prompt entrega ao Codex o conteúdo das telas.
2. **Ligações no derive e na sessão** (reservados): chamar `fichaComItensDaSessao` antes de derivar nas três telas, somar
   `focosDeProducoes` ao orçamento de Focos, ler `escudoSuspenso` na RD do escudo, a linha de ataque do escudo, a mão livre do
   Intangível, o traço dos óleos no dano, e trocar o botão de cura dos Símbolos e do Laço no card de Cura (`afty-cura.js`) pelo
   `usaItem`, para não existirem dois caminhos.
3. **Classificação G00** dos 9 módulos novos em `escopo.json` (descrita acima) e a linha dos 9 asserts `t-cx5-*` na tabela de
   `asserts/LEIA.md` (reservado por CX3, o lançador já os executa pela pasta).
4. **CX4** (sem entrega): teto e substituição do PV temporário (Símbolo de Vida Absoluta) e os efeitos dos seis níveis de Exaustão
   (Adrenalina, Mistura Profana, Laço). A contagem de Exaustão já é movida pelos itens.
5. **Primacial e o treino de outras fontes** (decidido pelo autor: conta todo treino): o "desde que já seja treinado" não enxerga treino concedido por Talento (provado com
   Tempestade de Ideias) nem, possivelmente, pelo pacote da Classe do Player (não pude sondar). Fechar exige `resolveTestes` ou o
   derive, que CX3 mantém reservados.
6. **CX6**: aplicar efeito de item e de encantamento em OUTRA ficha (Bloqueador, Expansão de Escudo, veneno pelo Pacote). A operação
   do veneno já recebe a sessão do alvo.
7. Fora do escopo ou sem decisão (ver as decisões): Intermediário na carga, Grau do Player, Modular múltiplo, tipo de descanso do
   Ferreiro, Ferramenta Amaldiçoada (p.153) como procedimento de produção.

## Conferência dos equipamentos próprios (escopo do lote, fonte adicional do projeto)

Não são regra do Livro e nenhuma foi alterada por este lote:

- **Criação de Armas e de Equipamentos** (addon, autorizada pelo autor em 2026-09-14): continuam como estão. O texto Especial da arma
  criada agora chega à Ficha (`descricao`).
- **Itens de Custo com `implementado: false`**: cura e PV temporário ("4 dados dos seus dados de cura do descanso longo ou +10"),
  condição, curar condição, reduzir Exaustão, Tipo de Percepção, Brinco Comunicador, alcance e área. Os bloqueios citados na fila caíram
  em parte (Dados de Vida existem desde CL2, o sistema de condições existe, o contador de Exaustão existe e o canal `alcanceArma` existe
  desde 2026-09-23, a Área continua sem canal), mas a decisão do autor, *"a Cura fica toda para depois"*, continua valendo. O autor
  respondeu em 2026-11-06: continua para depois. Nada foi implementado.
- **Os três trechos do Encantamento de Grau Especial** guardados para revisão por outro colaborador (Alcance, Tipo de Dano da Técnica,
  Interação com Aptidões) e o "Dobrar Usos" (só registro): continuam guardados.
- **Modular com várias opções**: regra adicional do projeto, pendente de decisão. **Armas improvisadas**: fora do seletor da Técnica
  Marcial, como o autor decidiu. A tabela da p.326 (fontes externas) está em `afty-armas-improvisadas.js` sem ligação a tela.

## Decisões do autor (2026-11-06)

O autor respondeu às 14 perguntas deste lote em 2026-11-06. Nada abaixo é mais pergunta aberta.

| Tema | Decisão | Estado |
|---|---|---|
| Conjunto de missão | O consumível que sobrou da missão anterior CONTA contra o conjunto, uma vaga por unidade. Kit carregado não reduz | Implementado (`saldoDoConjunto`, com `consumidos` da sessão) |
| Mestre da Criação | 2 testes a mais por foco | Implementado |
| Mistura Profana e Adrenalina | Exaustão cobrada e devolvida automaticamente no fim da cena | Implementado |
| Primacial | Conta TODO treino, inclusive o de Talento e de Classe | **Decidido, não implementado**: exige `resolveTestes` ou o derive, reservados por CX3 |
| Invocação por quem não é Controlador | Todos os graus | Implementado (já era o comportamento) |
| Vestígios | UM ESTOQUE POR VIA (Talismã e Marionete separados) | Implementado nesta rodada (`vestigiosDaFicha(creature, via)`) |
| Adaptação | Não recusa por pré-requisito da nova Habilidade | Implementado |
| Item de Feitiço | `+Grau` vira Ferramenta Amaldiçoada de Quarto Grau para cima, só em arma, escudo e uniforme. Consumível: uma criação por descanso por Feitiço | Implementado |
| Escudo | Espinhoso, Destruidor e Avassalador valem o maior nível, não somam | Implementado |
| Impulso e Escaldante | Impulso: CD da ficha do portador. Escaldante: TR de Fortitude | Implementado nesta rodada |
| Laço da Vida | Zera falhas e saldo, cura metade do PV máximo, 1 de Exaustão | Implementado |
| Prazos sem texto (Debilitante, Injeção Estimulante) | MANUAL: sem prazo automático, a mesa tira | Implementado nesta rodada: o buff da Injeção fica até a mesa o tirar pela aba Buffs (id `item:<id>:<n>` impede duas cópias), e o marcador do Debilitante só sai no descanso ou pelo Antídoto. A Lágrima de Shinigami segue na cena, porque o texto escreve cena |
| Kit no conjunto de missão | Vem no conjunto, como Custo 1 | Implementado |
| Equipamento inicial | Só Personagem, qualquer item especial de Custo 1, kit livre | Implementado |
| Itens de Custo `implementado: false` | Continua para depois | Sem mudança |
| Ferramenta Amaldiçoada (p.153) | Num lote seguinte | Fora deste lote, registrada na fila |

O que ainda depende de decisão do autor, e nenhuma foi decidida por este lote: Intermediário na carga, Grau do Player, Modular múltiplo e
tipo de descanso do Ferreiro (`limiteDeMelhoriasDoFerreiro` recebe o tipo como parâmetro).
