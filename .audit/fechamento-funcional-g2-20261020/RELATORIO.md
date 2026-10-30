# Fechamento funcional do G2: relatório da entrega

Data: 2026-10-20. Autor da entrega: Claude. Revisão independente (Codex) e teste real (autor) pendentes. Clássica continua padrão, G2 continua prévia
(`?ficha-g2=1`), barra 9/10, marco 10 não declarado. Sem commit, push, merge ou deploy.

Prompt executado: `C:/Projetos/Grimorio/PROMPT-CLAUDE-FECHAMENTO-FUNCIONAL-G2.md`. Pasta de evidências (esta): `grimorio-tracker/.audit/fechamento-funcional-g2-20261020/`.

## 1. Resposta curta

As cinco rotinas (Imitação, Concedido pelo Mestre, Exaustão desde zero, Sangramento e buff de mesa) se fazem inteiras pelo G2, na completa e na compacta onde
há ação correspondente, sem clicar em Apresentação Anterior, e com os mesmos números da clássica. Nenhuma das cinco depende mais dela. Ela continua no menu do
cabeçalho como comparação, como o prompt pediu. Em Combate no Minamoto passou de 1,21:1 para 6,59:1 de contraste, o cabeçalho grudado em 390 px caiu de 481 para
407 px, e o catálogo deixou de vazar 100 px à direita em 390 px.

## 2. Matriz das cinco rotinas e caminhos de acesso

| Rotina | Caminho na completa | Caminho na compacta | Disponibilidade | Verbo e dado reutilizados | Prova de interface |
|---|---|---|---|---|---|
| Imitação | Efeitos > Adicionar > aba Imitação | Habilidades > Efeitos > Adicionar do painel > aba Imitação (o catálogo abre no palco e `Voltar` retorna ao painel) | só com `derived.imitacao.disponivel` (`res_imitacao`), a Perfeita mostra 5 tipos | `trocarCopiaImitacao`, `tentarAprenderImitacao`, `cdAprenderImitacao`, `aplicaPatchCombate`, estado em `sessao.combate.imitacao` | 48 por ambiente, mais 4 na compacta |
| Concedido pelo Mestre | Efeitos > Adicionar > Fonte Externa > Concedido pelo Mestre | o mesmo, pelo Adicionar do painel | com a primitiva `concessao` de addon ou concessão já existente (inclusive entrada sem addon) | `FAMILIAS_CONCESSAO`, `comConcessao`/`semConcessao`, `sessao.concedido` | 22 por ambiente, mais 4 na compacta |
| Exaustão desde zero | botão Exaustão no cabeçalho de Ativos | ícone Exaustão no cabeçalho do painel | sempre | `sessao.exaustao` (inteiro não negativo) | 20 (completa 15, compacta 5) |
| Sangramento | Ativos > cartão da condição > Ajustar > Perda de Vida XdY | mesmo botão no detalhe da compacta | só condição com faixa (2d6, 3d8, 4d10, 6d10) | `rolarDano`, `registraRolagem`, `aplicaPerdaDeVida`, evento `perda` no Histórico | 25 (completa 17, Vida baixa e cadastro 6, compacta 2) |
| Buff de mesa | Efeitos > Adicionar > Fonte Externa > Buff de Mesa | o mesmo, pelo Adicionar do painel (o cartão aparece na lista da compacta e Encerrar funciona lá) | sempre (escopo Invocação só se a ficha tem invocações) | `sessao.buffs` por id, `CanalPicker`, `validateExpression` (DSL), `INV_EFEITO_CANAL_GRUPOS` | 39 por ambiente, mais 4 na compacta |

Os cinco acessos moram dentro do Adicionar, de menus e de detalhes que já existiam. Nada de formulário novo no topo dos Ativos (só o botão discreto de Exaustão ao
lado de Adicionar). Cartões de 76 px, linhas de 44 px, Habilidades de 48/58 px e avisos roxos com ícone Lucide ficaram como estavam. Não existe o rótulo "Na Mesa" nem
U+2014 ou ponto e vírgula em texto novo de tela.

## 3. O que mudou

Arquivos novos (todos em `src/systems/afty/ficha/efeitos/`, exceto o assert):

- `imitacao-logica.js`, `concedido-logica.js`, `buff-mesa-logica.js`, `exaustao-logica.js`: lógica pura sobre a sessão e o derive reais, classificada em
  `docs/revisao-automacao/escopo.json` (quatro entradas novas).
- `ImitacaoG2.jsx`, `ConcedidoG2.jsx`, `BuffDeMesaG2.jsx`, `ExaustaoG2.jsx`: telas.
- `asserts/t-fechamento-g2.mjs`: 124 asserts, mutação 13 de 13 (plantei 13 defeitos, um por vez, e o assert derrubou todos).

Arquivos alterados: `AftyFichaG2.jsx` (só comentários), `CatalogoG2.jsx` (aba Imitação, Esc, contêiner), `RecebidosG2.jsx` (views Buff de Mesa e Concedido),
`VisaoG2.jsx` (botão de Sangramento, acesso à Exaustão), `CompactaG2.jsx` (acesso à Exaustão), `Gestor.jsx` (faixa no cadastro manual de Sangramento),
`useModeloG2.js` e `gestor-logica.js` (verbos), `efeitos-dados.js` (faixa resolvida), `mesa-verbos.js` (`perdaPorSangramento`), `historico-logica.js` e
`HistoricoSessao.jsx` (evento `perda`), `efeitos-g2.css` (blocos escopados em `.e-g2`). Fora de `src/`: `asserts/LEIA.md`, `docs/revisao-automacao/escopo.json`,
`docs/a-fazer.md`, `docs/afty-status.md`, `docs/afty-ficha-final.md`, `docs/automacao-dsl.md` (uma nota em Operadores sobre o `+` inicial), `RETOMADA`, `CONTINUIDADE` e `PROGRESSO` do workspace. `src/components/` intocado.

Decisões que o autor pode querer olhar (todas reversíveis e locais):

1. **A cópia ativa sai da lista de candidatas.** O motor já a conta como possuída (`idsPossuidosNaImitacao`), então a Postura do Sol copiada some da lista de
   Posturas e volta quando a cópia é trocada. A barra de cópia atual mostra nome, tipo e origem.
2. **O "+" inicial do valor do buff é descartado.** O DSL reprova `+2` ("Expressão incompleta") e o formulário antigo gravava o buff com 0 calado. O campo
   continua com o placeholder "+2" e agora funciona. `-1`, `2` e `nd/2` passam como antes.
3. **Registrar Manualmente > Condição > Sangramento pede a faixa** (Fraco 2d6, Médio 3d8, Forte 4d10, Extremo 6d10). Sem faixa gravada o botão de perda não
   existe, como na tela antiga.
4. **Os verbos de buff do gestor agem por id sobre a sessão vigente.** Antes encerrar, reativar e mexer em rodadas escreviam o snapshot da lista inteira, o que
   podia sobrescrever alteração concorrente. Criar ou tirar um buff de mesa só mexe nele (provado com a instância de Pacote presente: ela fica intacta byte a byte).
5. **Concessão duplicada** de família não repetível é recusada na camada do G2 (o motor continua o mesmo). Família repetível aceita e remove por `uid`.
6. **O Sangramento rola uma vez fora da operação**, para a conferência e a gravação verem o mesmo total. A perda vai direto na Vida, a casca de PV Temporário (8 no
   teste) não é tocada, e a rolagem e um evento `perda` entram no Histórico (filtro Vida e Alma).

Acabamento (todo escopado em `.e-g2`, exceto a regra `.afty-cabecalho:has(.e-g2)` da barra de rolagens):

- **Em Combate**: o texto ligado usa `--e-t1` e a cura ficou na borda e no fundo (mistura com o texto). Contraste medido por captura do botão, contra o fundo que ele
  tem de verdade: padrão 11,81, pergaminho 11,47, sangue 12,39, abissal 11,89, terminal 13,19, Minamoto 6,59 (1440) e 5,63 (390, era 1,21), dois temas hostis
  (cura quase igual ao fundo) 16,05 e 14,05.
- **Cabeçalho**: ver tabela da seção 5. Em 721 a 1180 px valores e Agora dividem a fileira (o que não cabe vai para o "+N" que já existia), a moldura é menor, e em
  até 720 px a moldura, os recursos e a barra de rolagens ficaram mais compactos. Nenhuma fonte diminuiu, nenhum nome foi cortado, nenhum controle sumiu.
- **390 px**: o catálogo (Da Ficha, Imitação, Fonte Externa) tinha trilho, lista e detalhe numa grade de 580 px e vazava 100 px. Medido pelo contêiner (`@container`,
  então o painel ao lado também conta): o trilho vira fita de categorias, o detalhe de uma opção toma o lugar da lista, o seletor de abas quebra em duas fileiras, o
  detalhe de um Ativo empilha Agora, Ajustar e Termina, e os Concedidos Agora ganham segunda linha (nome, depois família e aviso) em vez de cortar o nome.

## 4. Validação

Ambientes: produção `http://127.0.0.1:5321` (bundle `index-DBupHr57.js`, servido e mais novo que todo `src/`) e desenvolvimento `http://127.0.0.1:5320`. Chrome real
(Playwright, canal chrome), um contexto isolado por cenário, fichas sintéticas "(Teste G2)" geradas por `gerar-fichas.mjs`, nenhuma do autor. Cliques reais, sem
`force`. Roteiros rodaram um de cada vez, nunca junto da suíte completa.

| Verificação | Resultado |
|---|---|
| `t-fechamento-g2` | 124 asserts, mutação 13/13 |
| Focados (15 arquivos: t-imitacao-configuracoes 44, t-concessao 107, t-concessao-sessao 37, t-condicoes 29, t-condicoes-efeitos 141, t-delta-buffs 10, t-g2-desempenho 30, t-g2-fonte-compat 52, t-g2-preferencias 42, t-g2-sessao-operacoes 51, t-g2-virada-registro 57, t-pacotes-aliados 189, t-ordem-modulos 38, t-revisao-g00 35, t-fechamento-g2 124) | 986 asserts, todos verdes |
| Suíte completa `npm run asserts` | 224 de 226, só `t-prodigio` e `t-reconciliacao-g00` (as duas históricas, iguais à linha de base de 223 de 225). Saída em `asserts-final.txt` e `asserts-base.txt` |
| `npx eslint src/systems/afty/ src/App.jsx` | limpo (só a nota do Babel sobre o tamanho do criador, igual à base) |
| `npx vite build` | sem erro, bundle refeito depois da última edição de produto |
| Interface, produção e dev (cada) | Imitação 48, Concedido 22, Exaustão e Sangramento 45, Buff de Mesa 39, consulta/teclado/personagens 21, leiaute 156 (4 larguras × 39), tema 32, compacta 24 (Imitação, Concedido e Buff pelo Adicionar do painel, 1024 e 1440) = **387** por ambiente, 0 falhas |
| Regressão dos Pacotes (PA-I1 a PA-I4, exportar, importar, ativar, prazos mistos, compacta, Fonte Externa manual) | produção 279 (e2e 65, pai3 43, devolutiva 48, pai4 54, compacta/herança 22, fonte manual 47), dev 189 (e2e, devolutiva, pai4, compacta), 0 falhas |

O que os roteiros de interface cobrem: as cinco rotinas na completa e na compacta; comparar os números com a clássica depois de cada operação (Defesa 18 para 21
com Defesa Marcial concedida, Iniciativa +3 e Defesa +2 com buffs, igualdade G2 e clássica em Player e /Afty); cancelar (a sessão fica byte a byte igual); recarregar
(a Ficha grava por debounce, o roteiro espera assentar); trocar de personagem (cada sessão no seu lugar); avançar rodada (buff com 2 rodadas vence na segunda virada,
o pacote segue intacto, Sangramento nunca dispara sozinho); histórico (a perda aparece como Vida −N); mouse e teclado (Enter e Esc em linha, Confirmar, resultado e
formulário, Esc fecha o detalhe e depois o catálogo); formulário denso (vazio e `+++` recusados e depois corrigidos, clique duplo cria um só); consulta modal por
cima do rascunho (Imitação e Buff voltam ao rascunho depois de fechar); Confirmar com ponteiro real em 1024, 1280, 1440 e 390 (confere o elemento no topo do ponto e
clica sem `force`); nome longo de invocação ("Sapo de Teste Com um Nome Bem Comprido") e fichas densas Minamoto e Player 30.

Larguras (leiaute, 39 conferências cada): 1024, 1280, 1440 e 390 px, sem estouro horizontal em nenhuma tela nova, todo controle alcançável e livre (Confirmar Cópia,
Conceder, Criar Buff, Perda de Vida, Exaustão mais e Zerar, escolha de qual invocação, seletor de canal aberto).

## 5. Medidas de layout (antes e depois, produção)

| Cabeçalho grudado (altura total, abas e barra de dados incluídas) | antes | depois |
|---|---|---|
| 390 px (844 de altura) | 481 px (57%) | 407 px (48%) |
| 600 px | 457 px | 382 px |
| 768 px | 342 px | 300 px |
| clássica em 390, 600, 768 px (referência, não mexi) | 671, 594, 412 | 671, 594, 412 |

Só a placa (identidade, recursos, valores, Agora): ima 390 px 331 para 289, 768 px 243 para 201, 1024 px 221 para 201; Minamoto 390 px 352 para 310. De 1280 px para
cima não mudou: lá o nome longo quebra em até três linhas na mesma fileira dos recursos, e a alternativa (recursos em outra fileira) fica mais alta.

## 6. Desempenho (produção, build final)

Ficha densa Player 30 com o addon da concessão, a Imitação e um Sangramento, três rodadas, do pointerdown até o resultado pintar mais dois quadros, sem pausa
artificial antes do clique (`perf-fechamento.mjs`, `perf-fechamento.json`): Exaustão mais 1 31 ms, Perda de Vida do Sangramento 31 a 54 ms, Confirmar Cópia 53 a 57 ms,
Criar Buff de Mesa 31 a 40 ms, Conceder 43 a 44 ms, **nenhuma tarefa longa em nenhuma medida**. Com o roteiro dos Pacotes (3 rodadas, com e sem oito recebidos):
Confirmar Ataque Concentrado 53 a 58 ms, ativar a nona opção 47 a 48 ms, duas ativações em sequência as duas gravadas, aba Buffs clássica 32 a 34 ms, sem tarefa longa.
São 24 medidas e 0 erros de página. A variação de poucos ms entre rodadas não identifica causa sozinha.

## 7. Limites e o que não entrou

- A penalidade de cada nível de Exaustão continua sem fonte no Afty: o G2 é só contador, como antes. Não é Exaustão de Técnica.
- Sangramento com faixa não gravada (condição antiga ou aplicada fora do cadastro) não ganha o botão, como na tela antiga.
- Condições que não sangram (testado com Atordoado) não têm o botão.
- A Imitação não cobra PE e o aprendizado é da sessão (não vira compra). O limite de aprendidas é o da memorização do motor: a comum aprende uma por grupo
  (sem extras), a Perfeita com Técnicas de Memorização aprendeu duas de tipos diferentes no teste.
- A trilha de 72 px à direita para o botão dos Livros continua reservada (decisão antiga do autor), e isso deixa 294 px de catálogo em 390 px.
- 390 px não virou redesenho de celular: o cabeçalho segue com identidade, recursos, valores, Agora, abas e barra de dados, só mais compacto.
- Não varri a antiga AbaBuffs além das cinco rotinas do prompt. O que o prompt listava como pendente era só isso.
- Suíte completa: as duas falhas históricas seguem (`t-prodigio` dá "33 ok, 0 falha" e sai com erro, `t-reconciliacao-g00` falha por arquivo consultado). Não são deste lote.

## 8. Algum fluxo ainda precisa da Apresentação Anterior?

Para as cinco rotinas, não. Todas foram exercitadas sem clicar em Apresentação Anterior, que nem aparece nos roteiros. Ela segue no menu do cabeçalho da aba Efeitos como
comparação e compatibilidade (os callbacks que `AftyFichaG2.jsx` ainda entrega à `AbaBuffs` continuam intactos). Não retirei componente nem rota antiga.

## 9. Integração com o remoto

`git fetch` feito (nenhum merge): `origin/main` está **6 commits à frente** de `HEAD` (Tauropolos, Frenesi, Golem de Sangue, Quimera de Maldições, Ciel) e `HEAD` não tem
nenhum à frente. Arquivos que nós e eles tocamos: `asserts/LEIA.md`, `docs/a-fazer.md`, `docs/afty-status.md`, `docs/revisao-automacao/escopo.json`. Nenhum arquivo de `src/`
editado por nós aparece nos 6 commits, mas o código novo lê `CanalPicker.jsx`, `ficha-sessao.js` e `afty-derive.js`, que eles alteram: depois de integrar, rodar de novo
`node asserts/t-fechamento-g2.mjs` e os roteiros desta pasta.

## 10. Arquivos finais e evidências

Hashes: antes `hashes-antes-src-asserts.txt` (538 arquivos) e `hashes-antes-docs.txt` (os de `LEIA.md` e `escopo.json` de antes de qualquer edição; o
`hashes-antes-docs-completo.txt` foi tirado já com o `escopo.json` editado, então mostra `escopo.json` igual); depois `hashes-depois-src-asserts.txt` e `hashes-depois-docs.txt`. Em `src/` mudaram 13 arquivos e entraram 8, nenhum removido, nenhum em `src/components/`. (Arquivos binários e `asserts/LEIA.md` não estavam na
lista de antes, por isso aparecem como novos nela sem terem sido tocados por mim, exceto o LEIA, que ganhou a entrada do `t-fechamento-g2`.)

Roteiros desta pasta: `lib.mjs` (biblioteca), `gerar-fichas.mjs` + `fichas.json`, `imitacao.mjs`, `concedido.mjs`, `exaustao-sangramento.mjs`, `buff-mesa.mjs`,
`consulta-teclado-personagens.mjs`, `compacta.mjs`, `layout.mjs`, `tema.mjs`, `cabeca.mjs`, `perf-fechamento.mjs`, mais as cópias `pa-*.mjs` da regressão dos Pacotes (fixtures em
`regressao-pa/`). Resultados `*-5320.json` e `*-5321.json`, capturas `5321-*.png` e `5320-*.png`, saídas `asserts-base.txt`, `asserts-final.txt`, `lint-base.txt`,
`cabeca-final.txt`. Os `diag-*.mjs` são as sondagens de investigação (estouro em 390 px, cabeçalho grudado, classe do cabeçalho, concessão que muda número).

## 11. Roteiro curto para o seu teste (cinco tarefas)

1. **Imitação.** Em uma ficha com Imitação: entre em Combate, abra Efeitos > Adicionar > Imitação, clique na Postura do Sol (só abre), depois Confirmar Cópia. Tente
   aprender com 10 (falha, a CD cai 2) e com 40 (aprende). Encerre, vá em Aprendidas e reutilize, depois Esquecer. Recarregue no meio.
2. **Concedido e Buff de Mesa.** Numa ficha com o addon da concessão: Fonte Externa > Concedido pelo Mestre, conceda Defesa Marcial e veja a Defesa do cabeçalho subir,
   remova. Em Buff de Mesa crie "Relâmpago", canal Iniciativa, `+3`, 2 rodadas, e avance duas rodadas. Tente criar com o valor vazio e com `+++` para ver a recusa e corrigir.
3. **Exaustão e Sangramento.** Botão Exaustão ao lado de Adicionar: suba até 3, recarregue, Zerar. Registrar Manualmente > Condição > Sangramento, faixa Forte, abra o
   cartão e use Perda de Vida 4d10 uma vez: a Vida cai o total mostrado, o PV Temporário não, e o Histórico lista a perda.
4. **Tema Minamoto e largura estreita.** Com o Minamoto, ligue Em Combate e confira a legibilidade. Estreite a janela (cerca de 390 e 768 px) e veja o cabeçalho, o
   catálogo e o detalhe de um Ativo.
5. **Compacta.** Repita Exaustão, Sangramento e a Imitação pelo painel compacto (aba Habilidades, botão Efeitos), e troque de personagem para conferir que cada um guarda o seu.

O que eu gostaria que você olhasse com olho de autor: a cópia da Imitação sumir da lista enquanto está ativa, o "+" do buff ser aceito e descartado, a faixa pedida no
cadastro manual de Sangramento, e se 48% da altura em 390 px ainda é demais para o cabeçalho.
