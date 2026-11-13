# CSS Personalizado e editor, 06/11/2026

Lote autorizado pelo autor com Pode, depois da devolutiva. Concluído no código
e na prévia isolada da porta 5330, sem integrar as três abas nas rotas normais.
Barra antiga 9/10. Sem commit, push, merge, deploy ou uso de fichas reais.

## Entrega

- Aparência das superfícies contratadas do G2 com especificidade de uma classe.
  Contextos e estados ficam em `:where`, layout conserva os seletores anteriores.
  O CSS escopado do usuário vence pela proximidade, sem prefixo obrigatório,
  camada global ou reforço artificial de prioridade. Pseudo-elementos e
  combinadores foram conferidos individualmente na bateria de pixels.
- CSS simples provado em nome, seções reveladas nas quatro abas, aba ativa,
  números de rolagem, número real do cabeçalho e botão de preparo de três níveis.
  `Valor` repassa o gancho público ao botão que mostra o número e abre fontes.
- Contrato/Seletores/Prompt IA distinguem clássica, G2 e invocação. As classes
  privadas `e-/m-/f-` não foram promovidas a API. Ganchos novos pequenos:
  `.afty-consulta`, `.afty-historico`, `.afty-vital-conteudo`,
  `.afty-vital-valores` e `[data-afty-estrutura="g2"]`.
- Bahnschrift preservado no padrão do G2, pelo novo `--afty-fonte-display`.
  O formulário de fonte grava também título, número e display. Cantos G2
  derivados proporcionalmente de `--afty-raio`, com círculos preservados e
  desconto interno entre cartão/cabeçalho. Formulário deriva também raio pequeno.
- Editor compartilhado: seletores sem fundo global claro e sem descrição
  truncada, diálogo nomeado, Esc, ciclo de Tab e retorno do foco.
  Reset com Restaurar enquanto o painel permanece aberto.
- Hook compartilhado guarda tema/callback atuais por referência, debounce de
  600 ms e descarregamento na saída real. `pagehide` usa `flushSync`, necessário
  porque o armazenamento do App escreve em um efeito. Foi reproduzida a perda
  em reload antes dessa correção e o teste passou depois. Limpezas de edição
  não gravam, impedindo o laço antigo de callbacks recriados.
- Alter estreito: valor textual sem largura de campo da clássica, rótulo/valor
  podem ocupar duas linhas. Controles do cabeçalho quebram apenas em 320 px ou
  com fonte personalizada, mantendo a composição padrão em 390 px.

## Provas desta entrega

| Verificação | Resultado | Evidência |
|---|---:|---|
| Editor, clássica/G2, 1440/390 e Alter 320/390/1440 | 91/91 | editor-resultados.json |
| Voltar, pagehide e reload antes de 600 ms, duas fichas | 12/12 | saida-resultados.json |
| Persistência, reabrir, exportar/importar em contexto novo | 12/12, sem erro de página | persistencia.json |
| Padrão global por sistema | 5/5 | lacunas-app.json |
| Isolamento do CSS | 6/6 | isolamento.json |
| Invocação própria, painel do Encontro, Consulta, Histórico e impressão | 20/20 | lacunas-resultados.json |
| Escape externo, semcss, seleção, foco e sonda de cor de estado | 6/6 | escape-estados.json |
| Layout, incluindo largura útil de 331 e rolagem real | 374/374 | layout.json |
| Interações das abas | 53/53 | interacao-abas.json |
| Mesa unificada | 50/50 | mesa.json |
| Sintaxe de seletores no Chrome | 1.145 aceitos | seletores-validos.json |
| Capturas padrão escuro/claro, duas larguras e quatro abas | 24/24 sem diferença de pixels | pixels.json |
| Minamoto, duas larguras e quatro abas | 8 comparadas, mudanças de tema esperadas | pixels.json e comparacao.json |
| Prévia real na 5330 | editor/estrutura/Esc, sem erro de página | previa-5330.json |

O S1 conserva o primeiro Dano terminando em 792/800. Com largura útil de 331,
termina em 928/1024. Minamoto agora responde aos cantos declarados pelo tema,
que antes eram ignorados. Não é apresentado como comparação de pixels idêntica.
Os screenshots de campos ocultos não servem para aferir estilo: o teste revela
cada aba e verifica suas seções efetivamente renderizadas.

Build de produção do app em executor/app-dist, executor de provas em executor/dist
e prévia existente em ../previa-abas-g2-20261021/dist aprovados. ESLint Afty limpo
(apenas nota do gerador Babel sobre o tamanho do builder). Corte da suíte completa:
264/265 arquivos, falha apenas t-reconciliacao-g00.mjs, linha 102, no mapa de fontes
individuais de regras. O hook foi classificado como INTERFACE por CX3, sem alterar
regras ou enfraquecer asserts. CX3 trabalhou em paralelo, portanto esse número é
um corte da árvore, não certificação global das suas entregas posteriores.

O servidor estático devolvia HTML no caminho local do Vercel Analytics, causando
Unexpected token '<'. A prova identificou /_vercel/insights/script.js, depois
bloqueou somente essa telemetria na automação de navegador. Repetição de
persistência terminou com 12/12 e zero erro de página. Nenhum código de produto
foi alterado para esse ajuste do executor.

Impressão: geração de quatro PDFs e presença da ficha em print conferidas.
Não equivale a revisão editorial de todas as páginas impressas. Tema da invocação
foi provado no componente real PainelDeCombatente do Encontro, com ficha sintética
e seu escopo próprio. Não foi adicionado editor de tema ao Encontro.

## Arquivos do produto

- ficha/AftyFichaG2.jsx e AftyFichaClassica.jsx: hook compartilhado, contexto G2.
- ficha/PainelDeAparencia.jsx, ficha-tema.js e ficha.css: contrato/editor.
- ficha/usar-gravacao-tema.js: novo hook de UI/persistência.
- ficha/efeitos/efeitos-g2.css e ficha/abas-g2/abas-g2.css: cascata/cantos.
- ficha/efeitos/pecas.jsx, ConsultaG2.jsx e HistoricoSessao.jsx: ganchos semânticos.
- themes/alter-lucielos.css: correção responsiva do tema.

Documentação: a-fazer.md, afty-status.md e afty-ficha-final.md. A classificação
do módulo em revisao-automacao/escopo.json foi feita pelo editor CX3, com reserva
respeitada. Preservados OperacaoConteudoDoItem, renderOperacao, onRolar e os demais
controles entregues por CX3. src/components sem diff. Sem motor novo.

## Publicação e coordenação

Fechamento-dependencias.mjs recalculou 32 novos arquivos de src, 26 exigidos por
imports e 6 sem importador. O novo hook pertence aos 26. A árvore continua em
mudança por CX3, refazer esse corte perto de qualquer commit humano. Não escolher
um conjunto parcial pelo número antigo de 25.

O dist diário mudou de hash durante o trabalho, com reconstrução às 01:51:11
por outro processo. Os builds deste lote têm saídas explícitas em .audit.
Não restauramos nem usamos o dist diário como prova. Hash inicial registrado em
dist-diario-inicial.json. Consulta de main por git ls-remote falhou por conexão,
sem pull, merge, stash, reset ou troca de base.

Portas 5173, 5193 e servidores de outras frentes preservados. A 5330 foi
atualizada por build no seu diretório isolado e conferida, sem reiniciar seu
servidor. As portas 5344, 5345 e 5346 foram usadas só por esta verificação.

O agendamento único pedido pelo autor está ativo para 06/11/2026 às 06:42:29
America/Sao_Paulo, na automação retomar-css-e-encaminhar-lotes-03-e-04. Retoma
pendências autorizadas deste chat e verifica o CX3. Só cria Lote 04 se o Lote 03
realmente estiver concluído e não existir duplicata. O prompt integral do CX4
também está em docs/revisao-livro-regras/prompts/CX4-codex-feiticos-e-recursos-temporarios.md.
Não autoriza integração do G2, promoção, commit, push, merge ou deploy.

## Disparo único concluído, 06/11 às 06:42

O agendamento foi recebido às 09:42:53 UTC (06:42:53 em São Paulo). A entrega
de CSS/editor já estava concluída. CX3 havia sido interrompido por limite de uso,
com Análise Profunda e outras parcelas ainda pendentes. A retomada autorizada foi
enviada ao chat Lote 03 / 06 e o novo turno foi confirmado como em execução.
Os cinco arquivos e a documentação foram explicitamente liberados a CX3.
Lote 04 não foi criado, pois CX3 não estava concluído. Automação única excluída
após o disparo, sem criar recorrência. Nenhuma nova autorização de publicação.
