# CX6: Aliados, Controlador, telas e fechamento

Situação em 2026-11-06: **FASE DE INTEGRAÇÃO INCREMENTAL, lote NÃO encerrado.** CX3 segue em andamento (editava esta fila, o histórico,
`escopo.json`, `LEIA.md`, `automacao-dsl.md` e `fontes.json` nos minutos anteriores a este registro) e CX4 não tem entrega. O fechamento
final (cláusulas de catálogo, números e fontes, importação antiga, G2 autorizado, relatório dos nove lotes) só pode ocorrer depois deles.
Este registro é evidência, não outra fila. A fila única é `docs/a-fazer.md`.

## Base e concorrência

- Repositório: `C:/Projetos/Grimorio/grimorio-tracker`, branch `main`, HEAD local `deab72cc26a93ab39350b6a781fcb0ca052cc0fd`. `origin/main` em
  `f6433a8a3c11f544c82e5f543738ea56e2920b3b`, dois commits à frente do HEAD (consultado por `git rev-list`, sem pull, merge, reset, stash,
  commit ou push). A árvore tem 81 arquivos rastreados alterados por outros lotes, preservados.
- Fonte do Livro: `C:/Projetos/Grimorio/F&M 2.5.2 - Livro de Regras.md`, SHA-256
  `1d0713d52c818a9ab9f47b883d9887a0d227d174d30ffcce358874669a7a733a` (conferido, idêntico). Páginas citadas pelo último marcador impresso.
- Linha de base medida ANTES de alterar comportamento: `npm run asserts` com **278 de 280 arquivos aprovados**. As duas falhas são de outros lotes e
  já estavam na árvore: `t-reconciliacao-g00` (1.235 chaves sem fonte individual, CX1) e `t-revisao-g00` (módulos novos de CX5 sem classificação
  em `escopo.json`).
- **Concorrência real.** Na conferência das 18:45 o `find -mmin -45` listou alterações de CX3 em `asserts/LEIA.md`, `docs/a-fazer.md`,
  `docs/afty-status.md`, `docs/automacao-dsl.md`, `docs/afty-formulas-base.md`, `docs/afty-player.md`, `docs/revisao-automacao/escopo.json`,
  `fontes.json`, `entregas/CX3.md` e `ficha/ficha-conteudo-*.js`. Por isso **este lote não editou nenhum desses arquivos de documentação ou de
  controle**. O texto para a fila, o histórico, o guia da DSL, o `LEIA.md` e o `escopo.json` está pronto no fim deste arquivo, para aplicar
  quando o editor ativo liberar (mesmo precedente de CL1, CL3 e CX5).
- **Autorização do autor (2026-11-06, quatro respostas por pergunta com opções):** (1) o limite em campo e o máximo por ação Invocar **só
  avisam**, não bloqueiam (preserva a decisão de 2026-08-15, o roster é de referência); (2) o seletor de Aliados cheio **desabilita** o botão a
  mais e mostra o teto; (3) os poderes de posição do Controlador ganham **contador na bancada**; (4) edições **pequenas e aditivas** em arquivos
  reservados por CX3 são permitidas, com releitura antes de cada uma.

## Tabela de verificação (diagnóstico publicado antes de editar)

Veredito: implementar (I), já coberto (C), falso positivo (F), divergência intencional (D), depende de decisão (DD), depende de entrega (DE).

| Parcela | Página ou decisão | Evidência encontrada | Veredito e resultado |
|---|---|---|---|
| Espera após dissipação por dano (N15) | p.257 | `transicaoDeQueda` e `entradaDaInvocacao` não guardavam o turno da queda | **I, feito** |
| Retorno voluntário | p.257 | `pvInicialDe` e `voluntaria` já cobrem custo zero e mesmo PV | C, provado de novo no assert |
| Exceções de tipo | p.257, regras do tipo | Maldição é exorcizada (terminal), Corpo fica desativado, Marionete quebrada | C, a espera só vale para `dissipada` |
| Limite em campo | p.256, decisão 2026-08-15 | A Aba já avisa o excesso (`Em Campo N / limite`) | C, e o autor decidiu só avisar |
| Máximo por ação Invocar | p.302 | `invocarPorAcao` calculado e mostrado, nada contava as entradas | **I, feito** (chip de aviso) |
| Seletor de Aliados cheio | fila de 2026-10-26 | clique sem efeito e sem aviso em `AbaBuffs`, criador e Preparo G2 | **I, feito** |
| Grau do Player (escala 5/9/13/17) | p.45, fila de 2026-10-26 | segue sem resposta | DD |
| Guarda Viva, Rede de Detecção, Combate em Alcateia | p.97 e p.99 | só texto | **I, feito** |
| Camuflagem Aprimorada, Táticas de Alcateia, Flanco Avançado | p.97 e p.99 | efeito no inimigo, a ficha do dono não tem onde escrever | D, texto de mesa |
| Proteger Invocação e Proteção Avançada | p.97, p.99 | sem linha de uso | **I, feito** (linhas de uso e operação), 2 leituras abertas |
| Frenesi da Invocação | p.97 | sem estado nem penalidade | **I, feito**, a 2ª execução do ataque é da mesa |
| Companheiro Avançado | p.98 | marcador `companheiro` existe, tipo de Aliado e graduação não | **NÃO feito**, ver pendências |
| Telas de CL2 (morte, Ferimentos, Alma, Dados de Vida) | `afty-vital.md` §5 | só `ficha-vital` é importado por JSX | **NÃO feito** |
| Telas de CL3 (Votos, Confronto, paredes, Cesta, auxílio) | guias §6 | nenhum JSX importa os módulos | **NÃO feito** |
| Telas de CX5 (item, encantamento, produção) | `entregas/CX5.md` | nenhum JSX importa | **NÃO feito** |
| Pacote para Aliados sem prejuízo do auxílio sustentado | CL3 pendência 5 | `pacotes-familias.js` monta a própria sessão | **NÃO feito** |
| Cláusulas de catálogo, números e fontes, importação antiga, G2 | prompt | auditoria por cláusula não realizada | **NÃO feito**, fechamento final |
| Corpo Amaldiçoado Mutante | AGENTS.md | excluído | fora do escopo |

## Fase do lote

Integração incremental. Os núcleos de CL1 a CL3 e CX5 existem e têm asserts, mas **as telas que os consomem não existem** (medido: só
`ficha-vital` aparece em JSX). CX3 e CX4 não fecharam. Declarar fechamento agora seria falso.

## Menor desenho adotado

1. **N15 na linha da invocação**, campo `aguardaAteTurno` (o turno do DONO, `uso.acoes.turno`, em que ela volta a poder entrar). A contagem é
   em turnos do dono e não em rodadas, porque uma queda no turno do inimigo seguida do turno do dono ainda na mesma rodada já libera o retorno.
   Vale só no combate (fora dele não há turno para esperar), só para a queda por dano de quem estava em campo, e só para `dissipada`. O retorno
   voluntário (`guardada`) nunca espera. O atalho de ligar um auxílio de quem está fora de campo também respeita a espera. O descanso, o
   composto desfeito, a entrada e o atalho limpam o campo.
2. **Conta da ação Invocar** em módulo folha novo (`ficha/ficha-invocacao-campo.js`), que a Aba lê. A tela recebe a rodada da sessão por
   `estadoDaInvocacao(...).rodadaDaSessao` (campo de tela, nunca gravado), então nenhuma das três telas ganhou propriedade nova.
3. **Seletor cheio** sem estado novo: o botão que passaria do `maxSelecionados` (que o derive já baseia no Grau) fica `disabled`, e a contagem
   `N / teto` aparece. Vale em `AbaBuffs` (linha e detalhe), no criador (`BoolChip bloqueado`) e nas ofertas do G2 (`efeitos-dados.js`). O G2
   (`pecas.jsx`) já desabilitava.
4. **Posição declarada** pelo que o Motor já tem: duas `faixa` em `COMBATE_ESTADOS` liberadas por `requerHabilidade`, com teto igual ao limite em
   campo do roster. Guarda Viva e Rede de Detecção são efeitos de `HABILIDADE_EFEITOS` lendo o contador. Combate em Alcateia é dinâmico (as armas de
   Técnicas de Combate são dado da ficha), então sai de uma função em módulo folha, como o Combate Amaldiçoado.
5. **Frenesi** como campo da linha da invocação, lido pelo cálculo dela (Defesa -5 com parcela nomeada, testes de resistência -5). Apagado na virada
   da rodada, ao sair de campo, ao cair e no descanso. Uma vez por rodada pelo contador `rodada:frenesi` que o motor já zera.
6. **Proteger Invocação** como linhas de "Opções de Uso" (o que a Aba já renderiza para Autonomia e Resistência Sobrecarregada) mais a operação
   `protegeInvocacao`, pelo contrato de uso do CL1 (`opId`, `gastaAcao` para a reação ou Ação Livre, PE).

## Entrega e verificação

### Arquivos

Novos: `src/systems/afty/afty-controlador-posicao.js` (folha), `ficha/ficha-controlador.js`, `ficha/ficha-invocacao-campo.js` (folha),
`asserts/t-cx6-espera-invocacao.mjs`, `asserts/t-cx6-controlador-posicao.mjs`, `asserts/t-cx6-controlador-uso.mjs`,
`.audit/cx6-20261106/browser.mjs` e este registro.

Editados em trechos pequenos e aditivos (releitos antes de cada edição): `ficha/ficha-sessao.js` (`aguardaAteTurno`, `frenesi`,
`aguardandoProximoTurno`, `defineFrenesiInvocacao`, `rodadaDaSessao`), `afty-invocacoes.js` (Frenesi no cálculo, opções de uso de Proteger
Invocação), `afty-habilidades.js` (três flags no roster), `afty-derive.js` (flags no dono, tetos das faixas, efeito de Combate em Alcateia),
`afty-combate.js` (duas faixas e seus tetos), `afty-efeitos-conteudo.js` (Guarda Viva e Rede de Detecção), `ficha/abas/AbaInvocacoes.jsx` (chip
de entradas), `ficha/abas/AbaBuffs.jsx`, `AftyCreatureBuilder.jsx` e `ficha/efeitos/efeitos-dados.js` (seletor cheio). Asserts ajustados por
fato novo do catálogo: `t-controlador.mjs` (três habilidades passam de "de mesa" a "ligadas") e `t-estados-organiza.mjs` (68 para 70 estados e a
sub-aba "controlador", que o autor previu como divisão por Especialização).
Nada em `src/components/`. Nenhum commit, push, pull ou promoção do G2.

### Testes novos (103 verificações)

`t-cx6-espera-invocacao` 46, `t-cx6-controlador-posicao` 23, `t-cx6-controlador-uso` 34. Duas mutações deliberadas provaram que falham quando a
regra quebra (a espera desligada derrubou 7 verificações, e as expectativas de Atenção e de atributo foram corrigidas contra o comportamento real,
documentado abaixo). Cobrem: o caso do livro (cair na rodada 2 e reinvocar na mesma rodada), o turno do inimigo entre a queda e o turno do dono,
queda no próprio turno, voluntário, fora de combate, exorcizada, dano em quem já caiu, atalho do auxílio, descanso, salvar e reabrir, sessão
antiga, duas fichas, Marionete e Corpo e Maldição, contagem da ação Invocar (inclusive Controle Concentrado), contador de posição liberado só pela
Habilidade e aparado no limite em campo, fora de Em Combate, os três efeitos, os três poderes que seguem de mesa, Frenesi (aplicar, penalidade,
hover, repetição, uma vez por rodada, sem opId, fora de campo, sem a Habilidade, virada, salvar), e Proteger Invocação (d6, d8, escolha do
atributo, reação por rodada, Ação Livre por 2 PE, sem PE, sacrifício inteiro e pela metade).

### Medido

- Antes: 278 de 280 arquivos aprovados. **Depois: 282 de 284.** Os três arquivos novos passam, e as duas falhas são as mesmas da linha de base
  (`t-reconciliacao-g00` e `t-revisao-g00`). A segunda agora lista também os três módulos novos deste lote (`afty-controlador-posicao.js`,
  `ficha/ficha-controlador.js`, `ficha/ficha-invocacao-campo.js`) junto dos nove de CX5, porque `escopo.json` estava com outro editor. O
  snippet de classificação está no fim deste arquivo. O assert não foi enfraquecido.
- `npx eslint src/systems/afty/` sem erros. `node asserts/t-ordem-modulos.mjs` 50 de 50. `npx vite build --outDir <temporário>` aprovado, **sem tocar
  o `dist/` da abertura diária**.
- Navegador (`.audit/cx6-20261106/browser.mjs`, servidor `vite` na porta 5191, contexto isolado, ficha de teste importada, 1440 e 390, sem
  `--hide-scrollbars`): Ficha clássica do Player. Buffs: depois de "Em Combate", a sub-aba "Controlador" mostra "Invocações a 3 m", em "Outros" o
  seletor de Aliados mostra `1 / 1` e, escolhido o Analista, os outros sete ficam desabilitados e o Analista continua clicável. A aba Invocações
  abre com as opções de Proteger Invocação. Sem erro de console e sem rolagem horizontal.

### Números e fontes conferidos

- Atenção da Rede de Detecção: a Percepção já soma na Atenção (Atenção = 10 + bônus de Percepção) e o texto soma +2 nas duas, então com duas
  invocações a Atenção sobe 8. É a mesma regra que o Addon `atencaoSoPercepcao` neutraliza para quem a adota, então o número nativo segue o livro
  como escrito. Medido pelo assert.
- O hover da Defesa da invocação traz a parcela "Frenesi da Invocação" com -5. O contador de posição entra pelo Motor, então a Defesa, a Percepção e
  a Atenção do dono trazem as parcelas "Guarda Viva" e "Rede de Detecção" no painel de fontes.

## Respostas do autor depois da entrega (2026-11-06)

1. Proteger Invocação: o modificador é escolha entre Presença e Sabedoria e o d8 substitui o d6. Confirmado, como estava implementado.
2. Companheiro Avançado NÃO conta no teto de Aliados do Grau. Isso desbloqueia o pacote P2 de `FALTA-E-PROMPT-2026-11-06.md`.
3. A reação de Proteger Invocação e a Ação Livre da Proteção Avançada não se impedem. Confirmado, como estava implementado.

O levantamento de todos os lotes e o prompt para terminar estão em `docs/revisao-livro-regras/FALTA-E-PROMPT-2026-11-06.md`.

## Decisões deste lote e perguntas ao autor (as três primeiras já respondidas acima)

1. **N15 conta turnos do dono.** Lido assim porque o texto diz "no seu próximo turno". Fora do combate não existe espera.
2. **Proteger Invocação:** o modificador é escolha entre Presença e Sabedoria (a operação recusa sem a escolha, e a linha de uso mostra os dois
   valores), e o d8 da Proteção Avançada substitui o d6. As duas perguntas de 2026-09-02 seguem abertas.
3. **A reação de redução e a Ação Livre da Proteção Avançada** compartilham o mesmo `id` (`proteger_invocacao`) na economia de ações, então
   a Ação Livre por 2 PE não impede a reação seguinte, e a reação não impede a Ação Livre. Confere?
4. **Frenesi:** a segunda execução do ataque e a vantagem dos atacantes contra ela são da mesa. A exceção "com exceção de Ações com Custo" não é
   validada pela ficha.
5. **Combate em Alcateia** conta as invocações "no alcance de ataque do alvo" por declaração. O limite é o limite em campo. Camuflagem Aprimorada,
   Táticas de Alcateia e Flanco Avançado continuam de mesa.
6. **Aviso, não bloqueio, nos limites** (autor, 2026-11-06). O chip âmbar "Entradas na Rodada N / máximo" só aparece para quem tem o roster do
   Controlador ativo.

## O que falta, com os motivos concretos

1. **Companheiro Avançado (p.98)** não foi feito (a pergunta do teto foi respondida depois: não conta, ver acima).
   Texto original da pendência: Precisa de decisão ou de dado que não existe: o texto manda o companheiro valer "também como um
   aliado de um tipo a sua escolha", com graduação por nível de Controlador (iniciante, veterano no 6, mestre no 12), cujos efeitos valem "para
   você ou para o aliado mais próximo da invocação". Isso exige (a) onde guardar o tipo escolhido (o marcador `companheiro` não tem `opcoes`),
   (b) que o companheiro NÃO ocupe vaga do seletor de Aliados do Grau (um Controlador de Quarto Grau tem limite zero e perderia o companheiro) e
   (c) a decisão de quem recebe o efeito (o dono ou o aliado mais próximo, que é posição). Não reaproveitei `aliados_escolhidos` para não repetir
   o erro de ocupar vaga nem criei motor paralelo. Pergunta ao autor: o companheiro conta no teto de Aliados do Grau?
2. **Telas dos núcleos entregues (todas por fazer):** CL2 (botão do teste de morte, Medicina, Ferimento, lista de ferimentos, Dano na Alma com teste,
   cura de Alma, Dados de Vida, aviso no cabeçalho do G2), CL3 (Votos, Confronto e Contestação, paredes, Cortina, Cesta, `usaAuxilioDaInvocacao`,
   `linhaDeFormaArma`, `registraAtaqueRealizado`, "PE Não Descontado") e CX5 (Pulseiras, Usar item, encantamentos, Criar por Feitiço, Produção,
   Adaptação, equipamento inicial). São telas grandes em arquivos que CX3 reserva (Ficha clássica, G2, Encontro, criador) e que um editor concorrente
   alterava. Fazê-las agora arriscaria colisão e não caberia numa verificação honesta por tela. O mapa de ligação continua nos guias `afty-vital.md`
   seção 5, `afty-votos.md`, `afty-dominio-confronto.md` e `afty-invocacoes.md` seção CL3, e em `entregas/CX5.md`.
3. **Pacote para Aliados** ainda leva o auxílio sustentado sem o prejuízo, e o PV temporário e o prazo por benefício seguem como estavam
   (PA-I3 e PA-I4, conferidos por outro lote em 2026-10-20). Não os reaudito sem o teste de sessão com duas fichas e o aceite do autor.
4. **Teste de sessão com duas fichas e os recursos de CL1 a CL3** (ativar, pagar, aplicar no alvo, mudar turno, expirar, salvar, reabrir, importar,
   remover a fonte): feito só para as parcelas deste lote (N15, Frenesi, auxílio de invocação por duas fichas já existente em `t-cl3-invocacoes`).
   Não existe para Votos, Domínios, itens e vida, porque falta a tela que os aciona no percurso real.
5. **Fechamento final:** cláusulas de catálogo (361 Habilidades e 85 Aptidões), números e suas fontes por stat, importação de ficha antiga,
   comportamento conjunto Player e Afty na Ficha clássica, G2 autorizado e Encontro, reconciliação G00 (`t-reconciliacao-g00`) e classificação dos
   módulos novos (`t-revisao-g00`). Nada disso foi declarado.
6. **Estado dos nove lotes (fila de 2026-10-29), sem percentual:** CX1 produto entregue, fecha com a reconciliação G00. CX2 parcial entregue. CX3 em
   andamento por outro editor. CX4 sem entrega local. CX5 núcleos entregues, sem telas. CX6 incremental, este registro. CL1, CL2 e CL3 núcleos
   entregues, sem telas.

## Para a fila e o histórico (pronto para aplicar quando o editor ativo liberar)

### `docs/a-fazer.md`

- Em "Livro de Regras: lacunas confirmadas": **retirar** "Reinvocação após dissipação por dano sem espera até o próximo turno (p.257)" (feito em CX6).
- Nas perguntas "Aliados, Comidas e Ferreiro": **retirar** o item 4 (Seletor de Aliados cheio, decidido: desabilita e mostra o teto).
- "Controlador: seis poderes dão bônus que dependem de POSICIONAMENTO": trocar a situação por "Guarda Viva, Rede de Detecção e Combate em Alcateia
  ligados em CX6 pelo contador da bancada (`invocacoes_a_3m`, `invocacoes_no_alcance`). Camuflagem Aprimorada, Táticas de Alcateia e Flanco Avançado
  seguem de mesa, porque agem no inimigo."
- "Controlador: as reações que rolam dado não têm onde aparecer": as linhas de uso de Proteger Invocação e da Proteção Avançada existem (CX6). As duas
  perguntas continuam abertas (modificador por escolha, d8 substitui d6).
- "Controlador: Frenesi da Invocação e Companheiro Avançado": o Frenesi foi ligado em CX6 (campo `frenesi` na linha da invocação). Fica só o
  Companheiro Avançado, com a pergunta sobre ocupar o teto de Aliados do Grau.
- Bloco "CX6": registrar "integração incremental, núcleos de CL1 a CL3 e CX5 sem telas, CX3 e CX4 abertos" e apontar para este arquivo.

### `docs/afty-status.md` (sessão nova no topo)

Resumir: N15 por turnos do dono, aviso da ação Invocar, seletor de Aliados desabilitado com a contagem, contadores de posição, Frenesi, Proteger
Invocação, 103 verificações novas, ajustes em `t-controlador` e `t-estados-organiza`, e os limites acima.

### `docs/automacao-dsl.md`

Acrescentar na tabela de estados da bancada e variáveis: `invocacoes_a_3m` e `invocacoes_no_alcance` (faixas liberadas por `ctr_guarda_viva`,
`ctr_rede_de_deteccao` e `ctr_combate_em_alcateia`, teto igual ao limite em campo do roster) e o efeito dinâmico `efeitosCombateEmAlcateia`.

### `asserts/LEIA.md`

Três linhas: `t-cx6-espera-invocacao` (espera após dissipação por dano e contagem da ação Invocar), `t-cx6-controlador-posicao` (contadores de posição e
os três efeitos) e `t-cx6-controlador-uso` (Frenesi e Proteger Invocação).

### `docs/revisao-automacao/escopo.json`

Em `arquivos`: `"afty-controlador-posicao.js": "<área de Controlador do G00>"` (módulo de regra do Livro p.97 e p.99). Como INTERFACE, com a
justificativa "CX6 (2026-11-06): ... sem catálogo de regra do Livro": `ficha/ficha-controlador.js` e `ficha/ficha-invocacao-campo.js`. Mais as nove
classificações dos módulos de CX5 que já estão no snippet de `entregas/CX5.md` e mantêm `t-revisao-g00` vermelho.
