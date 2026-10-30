# Prévia isolada: Ações, Perícias e Equipamentos no G2

Entrega do Claude em 21/10/2026, etapa 1 do plano aprovado (decisões 1A, 2A e 3B).
Revisada pelo Codex (`C:/Projetos/Grimorio/REVISAO-PREVIA-TRES-ABAS-20261021.md`).

**Estado:** o autor deu o aceite visual em 21/10 com duas ressalvas: Outros em Perícias
e linhas de armas uniformes. O restante está aceito. As duas correções foram aplicadas
na noite de 21/10 (seção 8) e **aguardam a reconferência do Codex**. A integração nas
rotas normais segue dependendo de autorização própria.

## 1. Como abrir

- Endereço: **http://127.0.0.1:5330/** (página inicial com os seis cenários, os quatro
  temas e o botão Reiniciar Sessão de cada um).
- Cenário inicial sugerido: **http://127.0.0.1:5330/?ficha=tipica&tema=escuro**.
- Parâmetros: `ficha` = arsenal, conjurador, mesa, tipica, vazia, criatura. `tema` =
  escuro, claro, minamoto, css. `modo=classica` abre a clássica e `modo=g2-sem-previa`
  abre o G2 com as abas de sempre, para comparar.
- Se o servidor tiver parado, na raiz do `grimorio-tracker`:
  `node .audit/previa-abas-g2-20261021/servidor.mjs 5330`
- Porta conferida livre antes de subir (5330). O servidor recusa 5173, 5200, 5320 e 5321
  e serve só `127.0.0.1`. Origem própria, então o armazenamento é só da prévia.

Cenários (todos sintéticos, criados do zero por `gerar-fichas.mjs`):

| Ficha | Para que serve |
|---|---|
| tipica | S1 do orçamento: 4 condicionais e 3 favoritos (Vislumbre, Azamaru, Golpe, Treino) |
| mesa | S2: 9 condicionais e 6 favoritos (Bloodfeast, Adaptação, Vislumbre, Olhinhos, Agulha, Céu, Azamaru, Golpe, Treino) |
| arsenal | armas: Besta de capacidade 1, Lâmina Oscilante, Emperrar, Ampla com nome longo, Rapieira Modular, duas Katanas com encantamentos diferentes, sobrecarga |
| conjurador | Feitiços: Lança de Gelo (Liberação e Ritual), Disparos Múltiplos, Contínua, Auxiliar, Curativo, Ruptura Vital (Técnica Máxima com Custo de Vida), duas Expansões |
| vazia | estados vazios |
| criatura | ficha de criatura, gravada em memória |

Proveniência: as fichas "(Teste G2)" da revisão de 20/10 não foram usadas. Duas delas
("Minamoto no Flugel (Teste G2)" e "Player 30") derivam de fichas reais. Tudo aqui foi
montado do zero com Addons públicos (`addons/*.json`).

## 2. O que foi construído

Fonte única em `src/systems/afty/ficha/abas-g2/`. O `AftyFichaG2` ganhou a prop
`previaAbasG2` (padrão desligado). O App não passa a prop: `/Afty` e `/Player`, com ou
sem `ficha-g2=1`, seguem com as abas de sempre.

**Ações (1A)**
- Índice das seções com contagem e "N Pendente" na Mesa.
- **Agora na Mesa** em células: nome, estado e a ação principal do próprio painel
  (Descobrir, Fechar Olhos, Ligar Aura, Montar Golpe, gatilhos de Treino). O corpo
  completo abre embaixo, um por vez, e continua montado ao fechar.
- Pendência nova abre o corpo uma vez. Fechado, fica fechado até outra pendência.
- Rápido com as linhas do G2: habilidades e equipamentos, na ordem salva.
- Duas colunas a partir de 1180 px úteis, quando as duas têm conteúdo. Coluna 1: Dano
  e Cura. Coluna 2: Feitiços e Domínio. A ordem de leitura e de Tab é a mesma de uma
  coluna. Uma ficha só de armas fica numa coluna.
- Dano: Acerto e Dano consultam a disponibilidade separadamente, pelo mesmo caminho
  que executa a rolagem (`prepararRolagem`). O motivo fica visível na linha, ligado ao
  botão por `aria-describedby`. O botão recusado continua focável, não rola e anuncia
  o motivo.
- Linhas de Dano em colunas comuns (seção 8): nome, metas, Acerto e Dano na mesma
  posição em todas as linhas, e a mesma altura base.
- Modo do Dano em segmento. O d20 aparece espelhado quando não é Normal. O crítico
  pendente é marcado na linha.
- Feitiço fechado (3B): "Rolar" só com uma rolagem única elegível.
  - Técnica Máxima: "Usar" e "Rolar" separados.
  - Liberação guarda só a seleção.
  - A etapa do Ritual aparece na linha.
- Cura com a unidade resolvida da fonte. Expansão com o controle fora do corpo
  recolhível.
- **Golpe (2A)** pela Preparação dos Efeitos ("Montar Golpe" e "Abrir Golpe", Montar
  Outro), com `aplicaGolpe`, custo, Histórico e estorno só do PE.

**Perícias**: faixa de Atributos (valor consulta, modificador rola), Jogadas de Ataque e
TRs, **Outros** (Manobras, Concentração, Fintar, Provocar, Teste de Morte, em cartões)
e a grade completa de perícias. Treino por forma e palavra (○ ● ◆), Mestre, Falha,
Mín., Crít e atributo trocado. Busca e filtro (Todas, Treinadas, Mestre) valem só para
a lista de perícias.

**Equipamentos**: carga, penalidade e avisos no topo. Busca e categorias. A partir de
900 px úteis, lista com detalhe lateral grudado. Abaixo disso, detalhe no lugar.
"Nada Carregado" e "Nenhum Item Encontrado" com Limpar Busca. Identidade por `uid`.

**Retenção**: as três abas ficam montadas e congeladas depois de visitadas
(`aba-congelada.jsx`).
- **Oculta**: `hidden` e `inert`, sem renderizar enquanto escondida. No último render
  antes de esconder, um contexto (`VisibilidadeDaAba`, padrão visível) fecha os
  flutuantes de fontes. O foco que estava dentro da aba vai para o botão da aba de
  destino.
- **Ao voltar**: renderiza uma vez com a sessão, o derive e os callbacks de agora.
- **Posição da janela**: guardada por aba.

**Busca global no G2**: chega à linha, abre o destino e limpa o filtro que a esconderia.
Tem dois destinos novos, só no G2: Expansões e Atributos. As Manobras vão a Perícias.

Capturas úteis (`capturas/`):
`altura-S1-1280x800-compacta-com-barra.png`, `altura-S2-1280x800-compacta.png`,
`fumaca-mesa-acoes-1440.png`, `largura-331-tipica-acoes.png`,
`altura-S1-390x844-telefone.png`, `largura-arsenal-1280-pericias.png`,
`equipamentos-detalhe-grudado.png`, `liberacao-ritual.png`,
`tecnica-maxima-recarga.png`, `golpe-historico.png`, `golpe-recusado-pe.png`,
`tema-claro-acoes.png`, `tema-minamoto-acoes.png`, `tema-css-acoes.png`,
`compat-classica-pericias.png`.

## 3. Arquivos

Novos:
- `src/systems/afty/ficha/abas-g2/`:
  - `AcoesG2.jsx`, `MesaG2.jsx`, `PericiasG2.jsx`, `EquipamentosG2.jsx`
  - `pecas-mesa.jsx`, `aba-congelada.jsx`
  - `rolagem-g2.js`, `rolagens-acoes.js`, `mesa-celulas.js`, `busca-g2.js`,
    `rapido-g2.js`, `usar-destaque-g2.js`
  - `abas-g2.css`
- `src/systems/afty/ui/visibilidade-da-aba.js`
- `asserts/t-abas-g2-previa.mjs` (52 asserts desde os ajustes)
- `.audit/previa-abas-g2-20261021/` (executor, dados, roteiros, capturas, resultados)

Alterados:
- `ficha/AftyFichaG2.jsx`:
  - prop `previaAbasG2`
  - `rolar` passa por `prepararRolagem` (mesma sequência de antes, agora pura e
    consultável)
  - abas retidas, posição por aba, busca do G2, Rápido do G2
- `ui/fontes.jsx`: `useFlutuante` lê `VisibilidadeDaAba` (padrão visível, sem efeito
  nos outros consumidores). `NumeroComFontes` e `NumeroInterativo` aceitam
  `indisponivel`, `descritoPor` e `rotuloAria` opcionais.
- `ficha/abas/AbaAcoes.jsx`: só `export` em `ControlesRitual`.
- `ficha/efeitos/HabilidadesG2.jsx`: só `export` em `Linha`.
- `docs/revisao-automacao/escopo.json`: os módulos novos classificados (o
  `t-revisao-g00` pedia).

Sem mudança: clássica, `AbaPericias`, `AbaEquipamentos`, `ControlesDeArma`,
`ficha-conteudo.js`, Encontro, criador, motor, Addons, `src/components/`, App.

## 4. Verificações (build de produção da prévia, rodada final depois dos ajustes)

| O quê | Resultado |
|---|---|
| `npx eslint src/systems/afty/` | 0 problemas |
| build do app com saída isolada (`build-app/`) | ok |
| `npm run asserts` | 225/227. Falham só `t-prodigio` e `t-reconciliacao-g00` (históricas). `t-abas-g2-previa` 52 e `t-revisao-g00` 35 passam. |
| `ajustes.mjs` (os dois ajustes do aceite, seção 8) | 181/181 |
| `fumaca.mjs` (6 fichas × 3 abas, sem estouro, sem erro) | 35/35 |
| `interacao-armas.mjs` | 39/39 |
| `interacao-abas.mjs` | 53/53 |
| `layout.mjs` (S1/S2, 10 larguras × 2 fichas, 331 px com barra real) | 374/374 |
| `temas-compat.mjs` (4 temas, contraste AA, ganchos do CSS, clássica e G2 sem a prop) | 21/21 |
| `desempenho.mjs` (mesa, conjurador e arsenal, três abas visitadas) | máximo 44 ms, 0 tarefas longas |

Asserts lógicos (`t-abas-g2-previa`):
- sequência da arma de capacidade 1, Oscilante, pífia com Emperrar, Custo de Vida,
  Ainda de Pé, rerrolagem de cura
- Técnica Máxima com Usar e Rolar separados, travas do Feitiço
- descritores campo a campo contra `AbaAcoes` e `AbaPericias`
- Rápido com as duas listas, busca e células da Mesa.

Uma rodada de mutação mostrou que eles reprovam código errado.

Interface, com cliques reais, teclado e toque emulado:
- **Arma de capacidade 1**: Acerto gasta a última munição, o Dano daquele disparo
  segue livre e o novo Acerto recusa com "Recarregue a Arma". Recarregar funciona fora
  de combate.
- **Oscilante e Emperrar**: Errou recusa só o Dano. Arma Emperrada recusa o Acerto até
  Desemperrar.
- **Crítico**: o crítico pendente sobrevive à ida aos Efeitos e o Dano em Crítico o
  consome.
- **Fontes**: hover, foco e toque longo abrem as fontes sem rolar. Enter e toque
  simples rolam.
- **Técnica Máxima**: Usar desconta e abre a recarga. A rolagem do uso pago segue
  livre com recarga e com 0 PE, paga o Custo de Vida e não desconta PE. O novo Usar
  recusa com o motivo.
- **Isolamento**: com as três abas montadas, o flutuante da aba escondida fecha e as
  ocultas ficam `inert`. Em 80 Tabs o foco nunca entra em aba oculta. O foco volta ao
  botão da aba. Ao voltar, a aba lê o combate, o d20 e o callback de agora.
- **Retenção**:
  - filtro, busca, seleção e detalhe voltam iguais, e Esc fecha só o detalhe
  - ir e voltar sem agir deixa a sessão idêntica, e recarregar descarta
  - o contador do Bloodfeast sobrevive a fechar o corpo e a trocar de aba.
- **CampoDomo**: com edição pendente, trocar de aba confirma pelo blur.
- **Liberação**: a seleção sobrevive à ida aos Efeitos. Ligar o Ritual muda a fórmula
  exibida e mantém a seleção. A rolagem da linha recusa com "Ritual Não Iniciado".
- **Favoritos**: habilidade e equipamento aparecem na ordem salva. A chave sem
  destino continua salva, e tirar pela estrela remove só ela.
- **Busca global**:
  - chega à perícia limpando o filtro Mestre, e nenhuma busca rola dado
  - Expansão abre o detalhe, Atributo realça a célula e Feitiço abre o detalhe
  - entre as duas Katanas, escolhe a certa.
- **Golpe**:
  - Montar Golpe abre a Preparação sem gravar, e o clique duplo no Confirmar cobra uma
    vez
  - Voltar não cobra, e Montar Outro com as mesmas marcas cobra o custo inteiro
  - Sacrifício paga o PE e 15 de dano, e o estorno devolve só o PE
  - com PE curto mostra "Faltam N PE", e fora de combate mostra "Pede Em Combate".
    Confirmar fica desligado e nada é cobrado.

Leiaute (largura útil da aba, medida):
- **Larguras**: 366 (390), 331 (768 com a compacta e a barra real), 602 (1024 com a
  compacta), 992 (1024), 854 (1280 com a compacta), 1244 (1280 e 1440), 1404 (1920),
  1724 (2560).
- **Sem defeitos**: nenhum nome ou fórmula cortado, nenhum estouro horizontal, fonte
  mínima de 12,5 px.
- **Alvos**: os que rolam têm 36 px ou mais, e 40 px no toque.
- **Colunas**: duas só a partir de 1180 px úteis e com conteúdo nas duas.
- **Contraste**: escuro 6,07, claro 5,09, Minamoto 5,33 e CSS 6,07 (mínimos medidos).

Orçamento de altura, onde termina a primeira linha de Dano:

| Caso | Janela | Fim da linha de Dano | Situação |
|---|---|---|---|
| S1 1280×800 com a compacta, barra real | 800 | 788 | visível |
| S1 1280×800 com a compacta, sem barra | 800 | 768 | visível |
| S1 768×1024 com a compacta (331 px), barra real | 1024 | 956 | visível (era 972 antes dos ajustes) |
| S1 390×844 telefone | 844 | começa em 1001 | abaixo da dobra, como previsto no plano |
| S2 1280×800 com a compacta | 800 | começa em 910 | 110 px abaixo da dobra, a um toque pelo índice |
| S2 1440×900 | 900 | começa em 899 | rente à dobra |
| S2 2560×1440 com a compacta | 1440 | 895 | visível |

Desempenho (mediana / máximo em ms, prévia contra o G2 de hoje, 1440×900):

| Operação | Mesa | Conjurador | Arsenal |
|---|---|---|---|
| ir a Ações | 12/12 contra 18/19 | 12/15 contra 13/19 | 12/16 contra 12/13 |
| rolar o Acerto | 26/53 contra 39/49 | 36/49 contra 29/52 | 27/44 contra 21/36 |
| mudar a sessão com Ações aberta | 18/18 contra 16/17 | 20/20 contra 19/19 | 16/16 contra 15/16 |
| nós do DOM, três abas visitadas | 1139 contra 695 | 981 contra 749 | 1044 contra 463 |

Nenhuma tarefa longa em nenhuma operação. O custo das abas montadas aparece só nos nós
do DOM. Amostra local, não promessa de fluidez universal. A tabela é da entrega. A rodada
depois dos ajustes deu máximo de 44 ms, nenhuma tarefa longa e 1138, 978 e 1040 nós.

## 5. Uso diário e dados preservados

- `dist/` diário: 14 arquivos, hash idêntico antes e depois
  (`hashes/dist-antes.txt` e `hashes/dist-depois.txt`).
- Inalterados por hash (`hashes/antes.json` e `hashes/depois.json`):
  - `App.jsx`, `dist/index.html`
  - `AftyFicha.jsx`, `AftyFichaClassica.jsx`, `AbaPericias.jsx`,
    `AbaEquipamentos.jsx`
  - `ControlesDeArma.jsx`, `ficha-conteudo.js`, `PainelDeCombatente.jsx`
  - `efeitos-g2.css`, `ficha.css`.

  Mudaram só os quatro previstos: `AftyFichaG2.jsx`, `fontes.jsx`, `AbaAcoes.jsx` e
  `HabilidadesG2.jsx`.
- Ajustes do aceite (`hashes/ajustes-antes.json` e `ajustes-depois.json`, 29 arquivos):
  mudaram só `AftyFichaG2.jsx` (uma linha da busca), `AcoesG2.jsx`, `PericiasG2.jsx`,
  `busca-g2.js` e `abas-g2.css`. `ficha-conteudo.js`, `AbaPericias.jsx`, `AbaAcoes.jsx`,
  a clássica, o Encontro e o App ficaram iguais. O `dist` diário segue idêntico ao
  original (`hashes/dist-ajustes-depois.txt`).
- `git diff -- src/components`: vazio.
- HEAD `68888733`, `origin/main` local `bcaf9786`, divergência 0/6, igual ao início.
  Sem fetch, sem commit, push, merge, deploy, limpeza ou reset.
- Portas:
  - 5173, 5200, 5320 e 5321 já não escutavam no início e não foram tocadas
  - nenhum servidor diário foi iniciado ou parado
  - só a 5330 (prévia) escuta.
- Nenhum dado, origem ou perfil do autor tocado. A prévia tem origem própria.

## 6. Limites reais e pendências

- **Diferenças da casca do executor**: sem Dashboard, rotas e `useCreatureStorage`. O
  que a Ficha grava na criatura (tema, preferências, pacotes) fica em memória. Conferir
  no destino real na integração: armazenamento real, merge do `update`, exportar,
  importar e recarga.
- **Folgas de altura**:
  - S1 em 1280×800 com a compacta tem 12 px de folga com a barra real. Depende da
    altura do cabeçalho, que cresce quando o nome da ficha quebra em duas linhas.
  - S2 deixa o Dano abaixo da dobra, a um toque pelo índice.
- **DOM**: as abas montadas somam de 230 a 580 nós com as três visitadas.
- **Telefone**:
  - o botão flutuante do livro (`PdfFab`) cobre o canto inferior direito, inclusive o
    último número das TRs (trilha existente)
  - as células da Mesa crescem no toque (botões de 40 px).
- **Esc**: o Esc do detalhe consulta, por seletor, se há uma camada aberta por cima
  (fontes ou busca).
- **Textos de dados, não das abas**:
  - "Escudo erguido" vem do Addon `estilo-sombras-corporal`
  - "Olhinhos Lu( Corpo Principal )" é o nome oficial em `afty-olhinhos-lu.js`
  - os dois aparecem iguais na clássica.
- **Fora deste lote, como no plano**:
  - clássica (lacuna de favoritos de equipamento, "; " no title de
    `ControlesDeArma`), Encontro (Ritual, Imbuir, Vislumbre)
  - destinos novos em `alvosDeBusca`, tokens dos painéis condicionais
  - conciliação com o remoto (`PainelAcoesAddon`, `PainelContadoresSessao`,
    Quimeras, `consumirAcoesAddon`).
- **Raio Negro**: nenhuma ficha da prévia tem a Aptidão, então o modo Raio Negro das
  linhas de Dano não foi exercitado. Ele troca a fórmula como o Crítico, que foi.
- **Próximas etapas**: reconferência do Codex das duas correções e, só depois,
  autorização própria para integrar.

## 7. Roteiro curto para o aceite visual (até cinco tarefas)

1. **Arma de capacidade 1** (`?ficha=arsenal`): role o Acerto da Besta, vá a Efeitos e
   volte, role o Dano. Tente outro Acerto (deve dizer "Recarregue a Arma"), saia de
   combate e Recarregue no detalhe.
2. **Golpe** (`?ficha=arsenal`): na célula Golpe Especial, Montar Golpe, marque algumas
   propriedades e Confirme. Depois Abrir Golpe, Montar Outro, Voltar, e confira o
   Histórico (Estornar PE).
3. **Feitiço** (`?ficha=conjurador`): abra Lança de Gelo, escolha uma Liberação e ative
   o Ritual. A linha deve mudar a fórmula e recusar com o motivo até o Ritual ficar
   Pronto. Em Ruptura Vital, Usar e depois Rolar com a recarga correndo.
4. **Perícias e Equipamentos** (`?ficha=arsenal`): filtre Mestre e busque uma perícia
   destreinada pelo Ctrl+K. Em Equipamentos, abra as duas Katanas e compare o
   encantamento no detalhe lateral.
5. **Larguras e temas**: `?ficha=tipica` em 1280×800 com a compacta aberta (o Dano
   precisa aparecer inteiro), janela estreita e telefone, e Quad HD. Repita com
   `&tema=claro` e `&tema=minamoto`.

## 8. Ajustes do aceite visual (21/10, noite)

O autor aprovou o conjunto com duas ressalvas: *"A aba de OUTROS com as Manobras,
Concentração e etc deve ficar em Pericias. Além disso, uma arma não era para ficar maior
que a outra. De resto aprovado."* Encaminhamento em
`C:/Projetos/Grimorio/PROMPT-CLAUDE-AJUSTES-ACEITE-TRES-ABAS-G2.md`.

**1. Outros em Perícias**
- O bloco inteiro saiu de Ações: a seção, a entrada do índice e a condição da segunda
  coluna. Coluna 2 agora é Feitiços e Domínio. Uma ficha só de armas fica numa coluna,
  com o Dano na largura toda.
- Em Perícias, Outros é uma seção própria entre Ataques/TRs e a lista de perícias.
  `CartaoManobra` foi movido como estava: mesmos nomes, fontes, bônus,
  Executar/Resistir e descritores (`pedidoManobra`). Tudo o que o derive entrega
  aparece, não só os itens da ficha típica.
- Fica fora do filtro de treino e da busca local, que são só da lista de perícias.
- Busca global: `alvosDaBuscaG2` (`busca-g2.js`) muda só a aba dos destinos `manobra:`
  para Perícias, mantendo a chave. `alvosDeBusca` da clássica e do Encontro não mudou.
- A grade de cartões ganhou mínimo de 300 px, para Executar e Resistir caberem na
  mesma fileira, e as linhas entre cartões viraram bordas. Com o fundo na cor da
  linha, a casa vazia do fim aparecia como um bloco claro.

**2. Linhas de armas uniformes**
- A seção de Dano é uma grade, e cada linha herda as colunas dela (subgrid). Nome,
  metas, Acerto e Dano ficam na mesma posição em todas as linhas. Uma fórmula maior
  alarga a coluna do Dano para todas, e não derruba os botões de uma linha só.
- O arranjo é da seção, pela largura real dela (contêiner `dano`, que já desconta a
  compacta e as duas colunas):
  - **720 px ou mais**: uma fileira (nome, metas, Acerto, Dano)
  - **560 a 719 px**: nome com as metas embaixo, e os alvos à direita nas duas
    fileiras. Este é o caso da imagem do autor (seção de 615 px em 1440). Numa
    fileira só, as metas tomavam a largura delas antes do nome, e no arsenal os
    nomes quebravam em quatro a seis linhas.
  - **abaixo de 560 px**: nome, metas e alvos, cada um na sua fileira.
- Sem exceção por arma, altura fixa, fonte menor, fórmula cortada ou metas escondidas.
  As colunas dos alvos são `auto`: no aperto, a fórmula quebra dentro do botão em vez
  de estourar. O nome longo continua quebrando, e o motivo de recusa tem fileira
  própria embaixo.
- Alvos de rolagem continuam com 36 px (40 no toque). O nome, que abre o detalhe e
  não rola, desce a 28 px só no arranjo do meio, no ponteiro fino.

Alturas das linhas fechadas, medidas com a barra de rolagem real (`ajustes.mjs`):

| Caso | Seção | Linhas |
|---|---|---|
| par do autor, mesa em 1440 | 615 | Ataque Básico 61, Azamaru 62 (antes 52 e quase o dobro) |
| tipica 1280×800 com a compacta | 839 | 52, 53 |
| arsenal 1280×800 com a compacta | 839 | 52, 53, 53, 72 (nome longo em duas linhas), 53 |
| arsenal 1024 com a compacta | 587 | 61, 62, 62, 92 (nome longo), 62 |
| arsenal 331 úteis | 331 | 99, 100, 100, 130 (nome longo), 100 |
| arsenal telefone 390 | 366 | 115, 116, 116, 116, 116 |
| mesa e arsenal em Quad HD | 855 e 1724 | 52 e 53 |

Em todos os casos, Acerto e Dano têm a mesma posição horizontal em todas as linhas,
inclusive no modo Crítico e com o motivo "Recarregue a Arma" à vista.

**Verificação dos ajustes** (`ajustes.mjs`, 181/181):
- **Outros fora de Ações e dentro de Perícias**, nas seis fichas (vazia e densas
  incluídas). Os nomes e a ordem são iguais aos do G2 sem a prop, cuja aba Ações é a
  `AbaAcoes` de sempre. Os cartões continuam à vista com o filtro Mestre e uma busca
  sem resultado.
- **Mesma rolagem**: oito rolagens (Executar e Resistir de Agarrar, Concentração e
  Teste de Morte, em Normal e Vantagem) gravam no registro exatamente o mesmo que a
  referência, com o sorteio fixo.
- **Busca global**: Ctrl+K para Agarrar e para Concentração, com as três abas
  visitadas, leva a Perícias, com o cartão realçado e à vista.
  - Há uma âncora só, e nenhuma aba escondida oferece o destino.
  - Nenhuma busca rola dado ou muda a sessão, e ir a Ações e voltar também não muda.
- **Dano**: mesmo arranjo, mesmas colunas e mesma altura base em oito larguras.
  - As oito larguras: 1440, 1280 com a compacta (tipica e arsenal), 1024 com a
    compacta, 331, telefone, Quad HD com e sem a compacta.
  - Valem nos modos Normal e Crítico, e com motivo de recusa.
  - Nada cortado, nenhum estouro horizontal.
- **Asserts**: `t-abas-g2-previa` ganhou 5. Agora as Manobras do derive vão a
  Perícias no G2 com a chave de sempre, a busca da clássica segue em Ações e os outros
  destinos não mudam. Uma mutação que devolve as Manobras a Ações reprova.
- **Script de leiaute**: a conferência das duas colunas de `layout.mjs` passou a
  exigir conteúdo nas duas, porque a ficha só de armas deixou de ter segunda coluna.

Capturas dos ajustes (`capturas/`):
- `ajuste-dano-par-1440.png` (a dupla da imagem do autor, na mesma largura)
- `ajuste-dano-arsenal-1280-compacta.png`, `ajuste-dano-arsenal-1024-compacta.png`,
  `ajuste-dano-arsenal-331.png`, `ajuste-dano-arsenal-390.png`,
  `ajuste-dano-mesa-qhd.png`, `ajuste-dano-motivo-1280.png`
- `ajuste-pericias-outros-1280.png`, `ajuste-pericias-outros-390.png`,
  `ajuste-outros-1280-claro.png`, `ajuste-outros-2560-minamoto.png`
- `ajuste-busca-agarrar.png`, `ajuste-busca-concentracao.png`

Para reconferir: `?ficha=mesa` em 1440 (a dupla Ataque Básico e Azamaru),
`?ficha=arsenal` em 1024 com a compacta e no telefone, e Perícias em qualquer ficha,
com Ctrl+K para Agarrar.

## 9. Reconferência independente do Codex concluída em 22/10

Reconferência independente concluída pelo Codex em 22/10. Outros em Perícias,
destinos únicos da busca, filtros, rolagens, foco e callbacks atuais confirmados.
Linhas de armas com colunas comuns confirmadas, inclusive Raio Negro em amostra
sintética separada. Nenhuma correção adicional de produto necessária.

Provas próprias: 52 asserts específicos, lint e build isolado aprovados,
181/181 ajustes, 94/94 leiaute focado, 39/39 complemento e 21/21 temas e
compatibilidade. Suíte 225/227, somente as duas falhas históricas.
S1 segue 788/800 e 956/1024 na coluna efetiva de 331 px. Fontes e dist
diário preservados por hash. Prévia na 5330, 5173 não tocada.

Parecer: C:/Projetos/Grimorio/REVISAO-AJUSTES-PREVIA-TRES-ABAS-20261022.md.
Evidências: grimorio-tracker/.audit/revisao-codex-ajustes-g2-20261022/.
Restante já aprovado preservado. Próxima etapa: integração nas rotas normais,
ainda dependente de autorização própria. Barra antiga 9/10 intacta.
Sem commit, push, merge ou deploy.

O par em 1440, compacta fechada e seção de 615 px, mediu 60,84375 e
61,84375 px, diferença de uma borda. Acerto e Dano alinhados nas duas armas.
Os 331 arquivos de src, 14 do dist diário e 11 do build da prévia continuaram
iguais por hash. A resposta HTTP da 5330 corresponde ao build conferido.

O complemento de Raio Negro usa só uma cópia do Arsenal sintético, com id
próprio, Controle e Leitura 3 e a Aptidão existente. Fonte de produto e fichas
da prévia original inalteradas. Passou em 331, 366, 587, 839 e 1724 px.
O servidor auxiliar 5331 foi encerrado. Sem novo ensaio de desempenho.

O roteiro complementar teve dois ajustes de preparação, preservados em
complemento-inicial.*: classes Tailwind da nova raiz e entrada de foco pelo
teclado. A repetição passou em 39/39. Nenhuma falha de produto confirmada.
Os resultados anteriores deste relatório continuam atribuídos ao Claude.
As limitações da seção 6 permanecem válidas. Reconferência fora da fila,
integração nas rotas normais ainda sem autorização própria.
