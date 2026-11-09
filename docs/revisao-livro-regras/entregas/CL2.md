# CL2: vida, morte e Alma

Este arquivo é evidência da entrega, não uma segunda fila. A fila única é `docs/a-fazer.md`. O contrato de consumo
(estado, operações, recusas, leituras adotadas e o mapa de ligação para as telas) está em `docs/afty-vital.md`.

**O Corpo Amaldiçoado Mutante saiu do escopo.** O autor o abandonou e o excluiu do site em definitivo em 2026-10-30, no meio
deste lote. Ver a seção "Decisão do autor" e o aviso em `AGENTS.md`.

## Checagem inicial, 2026-10-29

Fonte externa lida diretamente: `C:/Projetos/Grimorio/F&M 2.5.2 - Livro de Regras.md`.
SHA-256 confirmado: `1d0713d52c818a9ab9f47b883d9887a0d227d174d30ffcce358874669a7a733a`.
Páginas conferidas pelo último marcador impresso acima da regra: 20, 39 a 41, 46, 47, 228, 311 a 314 e 335.

Base: HEAD `d6d6dd77a7999d0df0454eb58d62584c0f46a9a3`, branch main, igual a `origin/main` (`git fetch` sem mover a base, contagem 0/0).
Nenhum pull, merge, reset, stash, commit ou push. A árvore tinha alterações concorrentes de CX1, CL1 e CX2, todas preservadas.

Linha de base medida antes de mudar comportamento (`npm run asserts`): 248 arquivos, 245 aprovados, 15.388 asserts nos aprovados.
Falharam só `t-cx2-origens` ("Foco alcance", do CX2), `t-revisao-g00` (módulo novo do CX2 sem proprietário) e `t-reconciliacao-g00`
(fontes individuais do CX1). Nenhum deles é deste lote.

### Reprodução

Script único fora do repositório, `deriveAfty` e sessão reais, Player e Afty, nível 10, sem poderes do Restringido:

- **N09**: com 10 PV, `aplicaDano(25)` deixou 0 e não registrou nada. Os 15 negativos se perdiam.
- **N10**: com 15 PV negativos, `aplicaCura(1)` deixou 1 PV e zerou a dívida (zerava `pvNegativos` em qualquer cura).
- **N01**: a origem Mutante tinha 0 características e `bonusAtributos: {}`. O `multiplosNucleos` do `deriveAfty` é o das invocações.

### Verificação por parcela

| Parcela | Página ou decisão | Evidência | Veredito e resultado |
|---|---|---|---|
| Saldo negativo geral (N09) | p.313 | Só o Restringido com os três poderes gravava o saldo | Corrigido. Estado vital geral em `sessao.vital` |
| Cura quita a dívida (N10) | p.313 | `aplicaCura` zerava tudo | Corrigido. A cura quita antes de subir o PV |
| Portas da Morte, 1 e 20 naturais, falha por dano | p.313 | Só o contador do Rejeitar a Morte | Implementado |
| Estabilização por Medicina e por cura | p.313 | Inexistente | Implementado |
| Dano massivo | p.313 | Inexistente | Implementado |
| Ferimentos Complexos | p.313 e 314, p.228 | Só nomes no editor curativo | Implementado: gatilho, tabela, efeitos, tratamento, permanência, recuperação |
| Alma: TR de Integridade antes de aplicar, cura elegível | p.311 | CL1 recebia o `tr` de fora, sem rolar | Implementado o despacho com rolagem e a elegibilidade |
| Dados de Vida | p.20, 46, 335 | Nenhuma pilha | Implementado: pilha, gasto, rolagem, Constituição, recuperação |
| Tratamentos do Restringido | Ainda de Pé, Rejeitar a Morte, Mesmo Morto | Existiam, com o saldo em `especializacaoSessao` | Preservados. Passaram a ler o estado vital |
| Invocações, addons | `transicaoDeQueda`, addons | Regra própria de queda das invocações. Nenhum addon trata morte do personagem. Os `dados de vida` dos addons Stark e Segredos são texto de benefício | Nada a reaproveitar. Queda das invocações não copiada |
| Recuperação da Alma por descanso | p.311 | Botão de descanso único | **Depende de decisão.** Função pronta e não ligada |
| Mutante, N01 | p.39 a 41 | Catálogo vazio | **Descartado pelo autor.** Excluído do site |

## Decisão do autor (2026-10-30)

Pergunta feita com opções (quatro dúvidas materiais). Respostas:

1. **Escopo por sistema:** o autor marcou Portas da Morte e saldo negativo, Ferimentos Complexos, Dados de Vida e a origem Mutante
   como valendo também para a Criatura. Resultado: tudo vale para o Player e o Afty, **sem divergência** e sem `DIVERGENCIAS`.
2. **Alma do Mutante** e 3. **troca do núcleo a 0 PV**: a resposta foi a desistência do Mutante, nas palavras do autor
   *"Desisto de Corpo Amaldiçoado Mutante, cancela tudo que foi feito e EXCLUI isso do site de maneira permanente. E coloca um aviso
   para o próximo que tentar programar isso, DESISTIR DA IDEIA E IR FAZER ALGUMA OUTRA COISA. Regra mais estupidamente mal escrita do
   livro."*
4. **Dano enquanto morrendo:** a resposta foi "leia a resposta anterior", ou seja, não houve decisão. Adotada a leitura recomendada
   (soma ao saldo, uma falha por ataque) e registrada como pendência.

### O que foi feito para excluir o Mutante

Nada do modelo de três núcleos chegou a ser programado, então não havia código a reverter. A exclusão:

- A entrada `corpo_amaldicoado_mutante` saiu de `AFTY_ORIGENS_CATALOG` (`afty-origens.js`), com um aviso em comentário no lugar.
  Ficha antiga que gravou o id deriva como origem desconhecida, que era o que a entrada vazia já era (provado em teste).
- Os quatro registros dela em `docs/revisao-automacao/inventario.json` viraram `REMOVIDO` com `justificativaRemocao`, no formato do
  protocolo de remoção do G00 (editados à mão e só eles, porque a reconciliação completa depende do fechamento do CX1). A cobertura
  do G00 antes e depois: 15.275 para 15.271 chaves e nenhum erro novo.
- Aviso para o próximo programador em `AGENTS.md` (seção "Itens descartados pelo autor"), `CLAUDE.md`, no topo de `docs/a-fazer.md`,
  nos prompts de CL2, CX2 e CX6, na análise de 29/10 e na memória do projeto.
- `asserts/t-mutante-descartado.mjs` falha, com a mensagem de desistir da ideia, se a origem voltar (mutação provada).
- Não foi tocado o que tem nome parecido: os `multiplosNucleos` das invocações, a Anatomia Carapaça Mutante e a origem Maldição.

## Reservas de edição (CL2)

Lote em andamento: **CL2**. `docs/a-fazer.md` e `docs/afty-status.md` estavam reservados pelo CX2 (sem toque havia mais de uma hora
quando editei, e sem reserva nova). Editei só trechos pequenos e aditivos com a ferramenta de troca exata, sem reescrever nada.

Arquivos novos, só meus: `src/systems/afty/ficha/ficha-vital.js` (folha), `ficha-morte.js`, `ficha-alma.js`, `ficha-dados-vida.js`,
`asserts/t-cl2-vital.mjs`, `asserts/t-cl2-alma-dados-vida.mjs`, `asserts/t-mutante-descartado.mjs`, `docs/afty-vital.md` e esta entrega.

Arquivos existentes editados, em trechos pequenos: `ficha/ficha-sessao.js` (campo `vital` e `dadosVida`, migração do legado,
`aplicaDano`, `aplicaPerdaDeVida`, `aplicaCura`, `aplicaDanoNaAlma`, `pagaCustoVida`, ação de contador, conciliação no `aparaSessao`,
teste pendente no `iniciaTurnoFicha`, descanso), `ficha/ficha-especializacoes.js` (o Restringido lê o saldo e as falhas do estado
vital), `ficha/ficha-dano-recebido.js` (repassa `ataqueId`), `ficha/ficha-acoes.js` (morrendo e ferida interna impedem ação e
reação), `ui/vital.jsx` (prop opcional `aviso`), `ficha/AftyFichaClassica.jsx` e `encontros/PainelDeCombatente.jsx` (uma linha
cada, passando `avisoDoVital`), `afty-origens.js` (exclusão do Mutante), `asserts/t-fang-especializacoes.mjs` (uma linha),
`asserts/t-ordem-modulos.mjs`, `asserts/LEIA.md`, `docs/revisao-automacao/escopo.json` (quatro módulos INTERFACE depois dos do CL1),
`docs/revisao-automacao/inventario.json` (quatro tombstones), `docs/afty-motor-referencia-estrutural.md`,
`docs/afty-motor-uso-combate.md` (uma frase), `AGENTS.md`, `CLAUDE.md`, a fila, o histórico e a análise e os prompts citados acima.
Nada em `src/components/`, no derive, nos efeitos, nas fórmulas ou na DSL, e por isso `automacao-dsl.md` e `afty-formulas-base.md`
não mudam. Reserva nenhuma do CL2 continua em pé.

## Leituras adotadas e pendências específicas (não bloqueiam o restante)

1. **Dano enquanto morrendo** soma ao saldo e dá uma falha por ATAQUE (sem resposta do autor). Se for só a falha, o saldo não
   deveria crescer e a CD da Medicina mudaria.
2. **Dano massivo** é "passe do máximo", lido como estritamente maior, e o saldo ACUMULADO também conta.
3. **Cura que quita a dívida exatamente** termina em 0 PV `estabilizado` (age, qualquer dano o derruba sem falha). Medicina e três
   sucessos terminam com 1 PV.
4. **Ferimento Complexo:** o gatilho conta o dano inteiro do ataque, casca de PV temporário inclusa, e cada ataque dispara um.
   Ferida interna tratada tem CD **10 + nível** (leitura de "reduz a CD de 20 para 10"). Uma perna aplica a condição Lento.
   O que não tem canal (desvantagens, mãos, rastejar) é declarado em `restricoesDeFerimentos`, sem canal inventado: o
   `movimentoMult` tem piso 1 e não reduz.
5. **Alma:** a CD do teste de Integridade é da fonte do dano (o livro não traz uma). Sucesso crítico é sucesso com o d20 na margem.
   O traçado da alma é declarado (treino em Integridade é só o requisito). A recuperação da metade da Alma no descanso longo
   existe (`recuperaAlmaPorDescanso`) e **não está ligada** ao botão de descanso único, é decisão do autor.
6. **Dados de Vida:** o Treino de Resistência 2 soma 2 dados do maior tamanho da pilha (o texto não diz o tamanho). O botão de
   descanso devolve todos os dados (a D3, "botão único devolve tudo"). Modificador de Constituição negativo nunca tira vida. Quem
   está morrendo não gasta dados.
7. **Corpo morto** não leva dano, não recebe cura nem descansa. PV escrito à mão num corpo morto devolve a vida e zera as falhas.

## Exceções aos escritores de PV (revisão independente incluída)

Procurei todos os escritores de `hpAtual`, e não só quem chama `aplicaDano` e `aplicaCura`:

- Passam pelo caminho novo: `aplicaDano`, `aplicaPerdaDeVida`, `aplicaDanoNaAlma`, `pagaCustoVida`, `aplicaAcaoContador` (PV pago) e
  `aplicaCura` (inclusive a cura da ação de contador e do Bloodfeast de `PainelBloodfeast`).
- **Conciliados por `aparaSessao`** (PV > 0 tira das Portas, as falhas ficam): o campo de digitar o PV (Ficha, Encontro e G2),
  ampliação de recurso e o ganho do Bloodfeast (`ficha-sessao.js`, PE temporário em vida). Exceção documentada: esses não quitam
  o saldo, eles o encerram, porque são escrita direta do valor.
- **Exceção deliberada do Restringido:** Ainda de Pé e Rejeitar a Morte põem o PV direto e zeram saldo e sucessos, mantendo as falhas.
  A revisão independente achou que o corpo MORTO escapava por caminhos automáticos, e eles foram fechados com assert e mutação: o
  Corpo de Aço (que é regeneração comum, e passou a usar a mesma `curaNaSessao` da cura), Ainda de Pé nas duas variantes e na cura
  rolada, Rejeitar a Morte com a falha garantida, o teste do fim de turno do Mesmo Morto, o PV da ampliação de recurso e o ganho do
  Bloodfeast. A condição do Ferimento passou a entrar por `defineCondicoes`, o único escritor de condição.
- **Exceção que ficou:** a Perda por Bleed do Bloodfeast (`sofreBleed`, botão "Aplicar Perda" do `PainelBloodfeast`, painel do addon) pode
  levar o corpo a 0 sem registrar as Portas. O pagamento de vida do Bloodfeast tem piso de 1 PV e não chega a 0.
- `descansar` põe o PV cheio e limpa as Portas, mas deixa os Ferimentos e não age sobre corpo morto.

## Contratos, arquivos e testes

Contrato inteiro em `docs/afty-vital.md`: estado salvo, transições, recusas por operação, `opId` obrigatório com o anel do CL1,
leituras para a tela (`resumoVital`, `resumoDadosDeVida`, `avisoDoVital`) e o mapa de ligação para CX2 a CX6.

Testes novos: `t-cl2-vital` (316 asserts), `t-cl2-alma-dados-vida` (143), `t-mutante-descartado` (15), nos dois sistemas. Mutações do
código derrubam os asserts: 27 no núcleo vital (cura que apaga a dívida, comparador do dano massivo, queda sem registro, faixas do
d20, falhas no descanso e na estabilização, soma do Ferimento por ataque, mínimo de 50, CD da Medicina, conciliação do morto, ação
nas Portas, teste do Mesmo Morto, falha por perda de vida, cura de corpo morto, CD da ferida interna), 15 em Alma e Dados de Vida,
e a recolocação da origem Mutante. Uma mutação sobreviveu na primeira rodada (a faixa de 10 natural só conferia os sucessos), o
assert passou a conferir falhas e sucessos juntos e ela caiu. Uma linha do `t-fang-especializacoes.mjs` mudou de endereço
(`especializacaoSessao.pvNegativos` para `recursosDeEspecializacao(...).pvNegativos` e `vital.saldo`), com o mesmo valor 9.

## Validação

- Linha de base antes de mudar comportamento: 248 arquivos, 245 aprovados, 15.388 asserts nos aprovados, falhas só as três alheias.
- Suíte completa no fim: 251 arquivos, 248 aprovados, 15.866 asserts nos aprovados. Falham os mesmos três da linha de base, com a mesma mensagem
  (`t-cx2-origens`, `t-revisao-g00`, `t-reconciliacao-g00`), nenhuma falha nova. `t-ordem-modulos` (44).
- `npx eslint src/systems/afty/` sem erros. `npm run build` aprovado.
- **Navegador** (refeito sobre o código depois da revisão independente), build de produção em `vite preview`, contexto novo e isolado a cada largura (1440 e 390), ficha de teste importada,
  nenhum dado real regravado. Ficha clássica: PV 10, dano 25 gera "Morrendo, 15 PV Negativos", cura 1 NÃO sobe o PV e deixa 14,
  recarregar a página conserva o estado, cura 14 mostra "Estabilizado", cura 5 levanta com 5 PV e sem aviso, dano massivo mostra
  "Morto por Dano Massivo", e escrever o PV à mão devolve a vida. Painel do Encontro: o mesmo percurso, e "Próximo Turno" abre
  "Teste de Morte Pendente". Sem rolagem horizontal e sem erro de página. O único 404 é o script do Vercel Insights, que não existe
  no preview local. O script ficou fora do repositório.

## Limites declarados

- **`ataqueId` ainda não tem quem o passe.** Nenhum chamador do CL1 divide um ataque em instâncias tipadas hoje
  (`operacoes-uso.js` só repassa a `entrada`). Quando a tela dividir, deve passar o mesmo `ataqueId` em todas. Sem ele, cada
  instância conta como um ataque e a regra de uma falha e um Ferimento por golpe não vale.
- **O texto dos addons Segredos do Artesão da Alma e Guerra de Feiticeiros ainda cita o reparo de um núcleo de Corpo Amaldiçoado
  Mutante.** Fica verbatim: é texto de benefício de mesa, sem automação, e não implementa a origem.
- **Faltam as telas de ação.** O que ficou ligado é o aviso na barra de PV (Ficha clássica e Encontro) e os botões `+` e `-` do PV,
  que já registram e quitam. Não há botão do teste de morte, da Medicina, da escolha do Ferimento, do gasto de Dados de Vida, do Dano
  na Alma com teste nem da cura de Alma. O aviso não foi levado ao cabeçalho da Ficha G2, que não foi promovida. São trabalho de
  integração do Codex (CX6 e as telas), com o guia como mapa.
- O resultado do teste de Medicina vem de quem socorre e é passado à operação. Não há alvo declarado entre fichas.
- O relógio de "1 dia" do Ferimento não existe: a passagem para permanente é declarada.
- A Criatura recebeu as mesmas regras (decisão do autor). Uma Criatura de Encontro que chega a 0 PV passa a ficar `morrendo`.

## Para a fila e o histórico

Aplicado em `docs/a-fazer.md` (linha do CL2, pendências abaixo) e em `docs/afty-status.md` (sessão no topo).
