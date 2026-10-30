# Pacotes para Aliados: entrega do Claude para revisão

Lote do prompt `C:/Projetos/Grimorio/PROMPT-CLAUDE-PACOTES-BUFFS-ALIADOS.md`, implementado em 19 e 20/10/2026. Escopo novo, fora da barra de dez
marcos do G2, que continua 9 de 10. Clássica segue padrão e G2 prévia (`?ficha-g2=1`). Sem commit, push, merge ou deploy. Não declara revisão do
Codex nem aceite do autor.

## Procedência

- HEAD local `68888733deffa9700aa69761fd965a504b9152db`. `git fetch origin` funcionou em 20/10 e não trouxe nada novo: `origin/main`
  continua `bcaf978695c3d239b84f0a12ed11479adc428016`, seis commits à frente, sem merge. Esses commits também mexem em `AftyCreatureBuilder.jsx`,
  `afty-invocacoes.js`, `ficha-sessao.js`, `escopo.json`, `asserts/LEIA.md` e nos guias, em trechos vizinhos e não nas linhas deste lote (o mais
  próximo é um campo novo do remoto poucas linhas acima da linha `buffs` do `descansar`). Os topos e finais dos guias precisam ser combinados na
  integração, como já registrado no histórico.
- Livro de Regras: `C:/Projetos/Grimorio/F&M 2.5.2 - Livro de Regras.md`, SHA-256
  `1d0713d52c818a9ab9f47b883d9887a0d227d174d30ffcce358874669a7a733a`. Bastião e Comandante na página impressa 174, Evoluída na 175, Feitiços
  Auxiliares na 216, Permutativos na 217.
- Arquivos antes do lote copiados em `antes/` com `hashes-antes.txt`. Três mexidos depois ficaram sem cópia: `ficha/abas/AbaBuffs.jsx` e
  `docs/afty-invocacoes.md`, cujo diff contra o HEAD é só deste lote, e `efeitos/util.js`, não versionado, que só ganhou `baixarJson`. Os três
  de coordenação também não têm cópia: o lote acrescentou a seção dos Pacotes para Aliados em cada um. Hashes finais em `hashes-depois.txt`
  (30 arquivos do repositório e os três de coordenação), gerados depois da última edição. `src/components/` sem alteração.
- Os servidores 5320 e 5321 deixados pelo Codex caíram durante a sessão. O Claude os subiu de novo nas mesmas portas: dev (`vite`) e prévia
  (`vite preview`) do `dist/` da build final, bundle `index-DFPSjt0c.js` (20/10, 01:30), mais nova que todo arquivo de `src/`.
- Trabalho local de outras frentes preservado: nada foi limpo, restaurado ou guardado em stash.

## O que mudou

| Arquivo | Papel |
|---|---|
| `src/systems/afty/ficha/pacotes-aliados.js` (novo, folha) | formato do arquivo, leitura por lista branca, biblioteca, instância |
| `src/systems/afty/ficha/pacotes-familias.js` (novo) | as fontes do emissor por família, com o resolvedor existente de cada uma |
| `src/systems/afty/ficha/ficha-recebidos.js` | tradução compartilhada: alvo e condição por benefício, regras `estilo`, `auxilioInvocacao` e `auraInvocacao`, e o conserto do benefício próprio menor |
| `src/systems/afty/ficha/efeitos/ParaAliadosG2.jsx` (novo) | a aba Para Aliados do suporte |
| `src/systems/afty/ficha/efeitos/RecebidosG2.jsx` (novo) | Recebidos, Importar Pacote e o Registrar Manualmente na Fonte Externa |
| `src/systems/afty/ficha/efeitos/PacotesPecas.jsx` (novo) | o resumo de uma opção, igual nos dois lados |
| `efeitos/CatalogoG2.jsx`, `g2-dados.js`, `recebidos.js`, `gestor-logica.js`, `efeitos-dados.js`, `VisaoG2.jsx`, `useModeloG2.js`, `util.js`, `efeitos-g2.css` | a terceira aba, a categoria Recebidos e a busca, Ativar, Encerrar e Reativar, o cartão e o rodapé da instância, o estilo |
| `ficha/AftyFichaG2.jsx`, `src/App.jsx` | gravação de `pacotesAliados` e `pacotesRecebidos` pelo `update` com merge |
| `AftyCreatureBuilder.jsx` | o salvar apaga as duas chaves: o merge conserva o que a Ficha gravou |
| `afty-invocacoes.js` | `chaveDaAuraDeInvocacao` e a `origem` da linha de Aura (`invocacao:aura:<tipo>|<alvo>`) |
| `ficha/ficha-sessao.js` | o descanso tira também a instância com `terminaNoDescanso` |
| `ficha/abas/AbaBuffs.jsx` | a linha do registro recebido na clássica diz o nome, o emissor e os benefícios (só módulos folha) |
| `asserts/t-pacotes-aliados.mjs` (novo), `t-ordem-modulos.mjs`, `LEIA.md`, `escopo.json` | provas, a folha nova na lista e a classificação dos módulos |
| `docs/afty-status.md`, `a-fazer.md`, `afty-ficha-final.md`, `automacao-dsl.md`, `afty-invocacoes.md` | registro, pendências e perguntas, guia, mudanças vistas pelo motor |

## O fluxo

Suporte, no G2: Efeitos > Adicionar > Para Aliados. Novo Pacote, Adicionar Efeito (fontes da ficha por família, com busca), escolhas no detalhe
de cada efeito, Salvar (grava a receita no personagem) e Exportar (calcula agora e baixa o JSON, revisão sobe só com conteúdo novo). Rascunho
não liga estado nem gasta recurso, e Descartar volta ao salvo.

Aliado, no G2: Efeitos > Adicionar > Fonte Externa. Importar Pacote (arquivo ou colar), resumo com o estado (Pacote Novo, Nova Revisão, Já Está na
Biblioteca, Revisão Mais Antiga, Mesma Revisão com Conteúdo Diferente), opções que entram e as que ficam fora com o motivo, Salvar na Ficha ou
Cancelar. Recebidos lista por emissor e pacote, com busca. A opção mostra o que dá, a prévia na ficha, o prazo, as condições e o custo do emissor,
e Ativar cria uma instância na sessão. A busca e a categoria Recebidos de Da Ficha também acham as opções. Sem pacote recebido, a aba abre no
Registrar Manualmente de sempre.

## Matriz de cobertura por família

| Família | Fonte | O aliado recebe | Prazo | Acúmulo no aliado | Situação |
|---|---|---|---|---|---|
| Aptidão | Aura do Bastião | Defesa = Nível de Aptidão em Aura do emissor | enquanto no alcance (4,5 m) | catálogo | calcula sozinho |
| Aptidão | Aura do Comandante, Base ou Evoluída | dano e perícias (1 + metade ou Aura total) em combate, e na Evoluída +2 em ataque e TR | enquanto o emissor mantiver | catálogo, a mesma origem nas duas versões | calcula sozinho, versão escolhida uma vez |
| Feitiço Auxiliar | efeito único e Múltiplos Efeitos | o que o motor dá ao emissor com só ele ligado (Defesa, RD, atributo e limite, TR com alvo, rolagem, CD, margem, movimento, alcance, níveis de dano, dano fixo, negação de RD) | Imediata 1 rodada, Duradoura as rodadas do Feitiço, Sustentada mantida | Feitiços (Passivo gerado, pool) | calcula sozinho |
| Feitiço Auxiliar | dados Durante e Após Ataque | o dado, para rolar à parte | o do Feitiço | não entra | só consulta |
| Feitiço Auxiliar | Permutativo | nada | | | sem representação (pergunta) |
| Feitiço Auxiliar | Alcance Próprio | nada (só o emissor) | | | fora, com motivo |
| Invocação | auxílio de Aliados (Defesa, Acerto, RD), Quimera inclusive | o valor da tabela do grau | enquanto o auxílio estiver ligado | soma, o mesmo auxílio do mesmo emissor vale uma vez | calcula sozinho |
| Invocação | auxílio Nela Mesma, Cura, Dano Adicional | nada | | | fora (não é para aliado ou não fica ligado) |
| Invocação | Aura de Acerto, Defesa, TR, Perícia, RD e Dano | o valor do grau no alvo escolhido, e a Aura de Dano como dado | enquanto na aura | auras iguais não acumulam, entre emissores e contra a própria | calcula sozinho |
| Novo Estilo das Sombras | segunda compra estendida aos aliados (Defesa, TR, Acerto, Margem, Perícia, Deslocamento, CD) | o número que o derive do emissor calcula para os aliados | enquanto o Domínio Simples estiver ativo | Estilo (mesmo grupo dos Feitiços) | calcula sozinho |
| Novo Estilo das Sombras | bônus de Aptidão estendido | o número | | | só consulta (o texto não diz em qual número) |
| Suporte | Presença Inspiradora, Pronto para Agir, Apoio Defensivo, Apoio Estratégico, Inimigo Comum, Táticas Defensivas, Olhar Aguçado, Contra-Ataque | o número do texto com os atributos do emissor | o do texto (cena, permanente, uma rodada, próximo uso) | catálogo | calcula sozinho, escolhas uma vez (PE adicional, atributo) |
| Suporte | Apoio Focado, Comando Motivador, Guarda Sincronizada, Inspirar Aliados, Elevar Sucesso, Motivação pelo Triunfo | o número para a mesa | | | só consulta |
| Definição à mão | qualquer canal do pacote, regra do catálogo, Feitiço ou outra origem | o que o suporte escrever | o escolhido | a regra escolhida ("outra origem" pede Somar Mesmo Assim do aliado) | configura uma vez, marcada como Definido à Mão |
| Sem representação | Permutativo em aliado, PV Temporário concedido por pacote, Discurso Motivador, Sobrecura, Protetor, Transmitir Conhecimento, Ajustes em Equipamento, Maré da Vida, reações de outras classes | | | | não entra, registrado |

Não é automação completa do catálogo: a lista acima é o que existe hoje.

### A mesma matriz em quatro grupos

- Calcula sozinho: Aura do Bastião, Aura do Comandante (Base e Evoluída), Feitiço Auxiliar (efeito único e Múltiplos Efeitos), auxílio de
  Aliados e Aura de invocação (a Aura de Dano como dado, a Quimera só com fundida), Novo Estilo das Sombras estendido aos aliados, e oito
  Habilidades de Suporte: Presença Inspiradora, Pronto para Agir, Apoio Defensivo, Apoio Estratégico, Inimigo Comum, Táticas Defensivas,
  Olhar Aguçado e Contra-Ataque.
- O suporte configura uma vez: as fontes que entram no pacote, a versão do Comandante quando tem a Evoluída, o PE adicional da Presença
  Inspiradora, Presença ou Sabedoria no Apoio Focado, no Inimigo Comum e no Inspirar Aliados, e a definição à mão, marcada como tal. O alvo da
  Aura de invocação vem da própria invocação.
- Só consulta (o número aparece, a ficha do aliado não muda): os dados de dano do Feitiço Auxiliar (Durante e Após o Ataque), o bônus de
  Aptidão estendido do Estilo e seis Habilidades de Suporte: Apoio Focado, Comando Motivador, Guarda Sincronizada, Inspirar Aliados, Elevar
  Sucesso e Motivação pelo Triunfo.
- Sem representação ainda: Feitiço Permutativo em aliado, PV Temporário concedido por pacote, Discurso Motivador, Sobrecura, Protetor,
  Transmitir Conhecimento, Ajustes em Equipamento, Maré da Vida e reações de outras classes. Alcance Próprio fica fora por regra (só vale no
  emissor).

## Evidências

- `asserts/t-pacotes-aliados.mjs`: 116. Focados: `t-g2-fonte-compat` 52, `t-g2-desempenho` 30, `t-g2-preferencias` 42, `t-g2-sessao-operacoes` 51,
  `t-g2-virada-registro` 57, `t-invocacoes-mesa` 120, `t-invocacao-intrinsecas` 41, `t-invocacao-caracteristicas` 35, `t-auxiliar-ligado` 26,
  `t-estilo-sombras-metricas` 43, `t-novo-estilo-sombras` 67, `t-ordem-modulos` 38, `t-revisao-g00` 35.
- Suíte inteira: 223 de 225 arquivos (`asserts-depois.txt`, e de novo no código final em `asserts-final.txt`). Falham só `t-prodigio` e `t-reconciliacao-g00`, com a mesma saída da linha de base
  medida antes do lote (`asserts-base.txt`, 222 de 224).
- `npx eslint src/systems/afty src/App.jsx` sem problema, `npx vite build` aprovado.
- Percurso completo no Chrome (`e2e.mjs`, contextos isolados, fichas sintéticas de `gerar-fichas.mjs`, arquivo real baixado e reenviado):
  65 de 65 em dev (`e2e-5320.json`) e 65 de 65 em produção (`e2e-5321.json`), os dois no código final. Cobre montar e exportar com 13 fontes de 5 famílias, Alcance
  Próprio e auxílio próprio fora, Exportar travado com rascunho, revisão repetida sem mudança, revisão 2 depois de mudar a Presença, Estilo de
  outro emissor, importar sem ativar nem cobrar, outra ficha do mesmo navegador intocada, mesmo arquivo de novo, versão desconhecida e opções
  ruins com motivo, onze ativações com prazo e alcance certos, Defesa somando 11 nas duas apresentações, virada e expiração, Encerrar e
  Reativar como ativação nova, revisão nova sem tocar a instância ativa, dois emissores, descanso, recarga, salvar no criador e cópia da ficha.
  As fichas sintéticas não têm Quimera: o auxílio da Quimera (só com invocação fundida, como no motor) está só nos asserts.
- Fonte Externa manual preservada: cópia do roteiro do G2-I1 (`regressao-fonte-manual.mjs`) com 47 de 47 em produção, no bundle final
  (`regressao-fonte-manual/browser-fonte.json`).
- Rastros de tentativas intermediárias, que não valem como evidência do estado final: `_dbg*.mjs`, `_d1.json`, `_dbg2.png`, `_trace`,
  `_trace2`, `trace-falha-5320.zip` e `e2e-5320-exporta-falhou.png` (depuração do roteiro em 19/10, das 19:59 às 20:19, quando a trava de
  800 ms engolia a segunda exportação, hoje 400 ms), e `regressao-fonte-manual/*-erro.png` (a prévia 5321 fora do ar às 01:24, conexão
  recusada).
- Telas: `smoke-*.png`, `e2e-*-suporte-pacote.png`, `e2e-*-importar-resumo.png`, `e2e-*-recebidos.png`, `e2e-*-ativos.png`,
  `e2e-*-classica.png`, `visual-5320-1440-*.png` (detalhe com a prévia, cartão com prazo e rodapé, busca, painel compacto) e
  `visual-classica-buffs.png`.

### Desempenho (build de produção, `perf-5321.json`)

Chrome local, 1440 x 900, amostra Player 30 Volumoso (127 Habilidades, 12 Feitiços, 3 invocações), três repetições, no bundle final
`index-DFPSjt0c.js` em 20/10. Do pointerdown à mudança no DOM e dois quadros, e as tarefas longas da janela mais 1,5 s. Sem pausa artificial
antes de confirmar.

| Operação | Sem pacote | Biblioteca e oito recebidos ligados |
|---|---|---|
| Abrir a Preparação do Ataque Concentrado e confirmar | 51 a 60 ms, nenhuma tarefa longa | 54 a 56 ms, nenhuma |
| Ativar uma nona opção recebida | | 46 ms nas três, nenhuma |
| Duas ativações recebidas em sequência | | 2 de 2 ligadas nas três vezes, nenhuma |
| Clássica: abrir a aba Buffs | 31 a 32 ms, nenhuma | 31 a 34 ms, nenhuma |

A prévia Se Ativar roda depois de pintar a escolha. As consequências dos cartões seguem o gerador fatiado de antes (um derive por ativo, entre
quadros). Uma máquina e uma amostra: não é promessa de ausência universal de tarefa longa.

## Decisões técnicas reversíveis

- O emissor tem id próprio no personagem (`emi_...`), porque o id da ficha muda quando ela é importada.
- A instância guarda uma cópia do benefício e do prazo: revisão nova não muda o que já está ativo, e o Reativar pega a revisão da biblioteca.
- O pacote do suporte guarda a receita (fonte e escolhas). O número é calculado ao exportar, com o derive SEM sessão.
- A disputa das Auras de Dano escolhe pela força (faces) e tira o dado próprio menor com o mesmo dado negativo, que o hover mostra.
- Esc não fecha Para Aliados (há rascunho). A aba Fonte Externa abre no Registrar Manualmente quando não há pacote recebido.

## Limites e o que não foi exercitado

- Encontro: provado só na função (`derivarCombatente` igual à clássica). Não há tela de importar ou ativar no Encontro.
- Clássica: mostra os números e as linhas, sem tela de importar ou ativar.
- Telas conferidas em 1440 px. O catálogo do G2 tem três colunas fixas, e o celular não foi conferido.
- No servidor de desenvolvimento, gravar um JSON novo em `.audit/` durante um roteiro recarrega a página (o plugin do Tailwind varre a pasta).
  Os roteiros gravam fora do projeto e copiam no fim. Não afeta o produto.
- Remoto não integrado (ver Procedência).

## Para o autor (no máximo cinco tarefas)

1. Abra http://127.0.0.1:5321/Player?ficha-g2=1 numa janela normal com o personagem que dá suporte e, numa janela anônima (outro armazenamento),
   o aliado. Se preferir não mexer nas fichas reais, importe uma cópia de cada.
2. No suporte: Efeitos > Adicionar > Para Aliados > Novo Pacote. Inclua de cinco a oito fontes, confira as escolhas, Salve e Exporte.
3. No aliado: Efeitos > Adicionar > Fonte Externa > Importar Pacote > o arquivo baixado. Confira o resumo, Salve na Ficha e ative algumas opções.
   Compare a Defesa e as perícias com a mesma ficha sem `?ficha-g2=1`.
4. Avance rodadas, descanse e recarregue: a biblioteca fica, nada volta ligado sozinho, e cada opção conta o próprio prazo.
5. Responda as sete leituras em `docs/a-fazer.md`, PERGUNTAS AO AUTOR, "Pacotes para Aliados: leituras feitas no lote, para confirmar".
