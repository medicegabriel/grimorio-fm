# CL1: motor de uso e combate

Este arquivo é evidência da entrega, não uma segunda fila. A fila única é `docs/a-fazer.md`.
O contrato estável de uso, com entradas, saídas, estado salvo, transições, recusas,
política de cobrança e identidade da operação, está em `docs/afty-motor-uso-combate.md`.

## Checagem inicial, 2026-10-29

Fonte externa lida diretamente: `C:/Projetos/Grimorio/F&M 2.5.2 - Livro de Regras.md`.
SHA-256 confirmado: `1d0713d52c818a9ab9f47b883d9887a0d227d174d30ffcce358874669a7a733a`.
Páginas conferidas pelo último marcador impresso acima da regra: 61, 178 a 182, 290 a 310,
311 a 313, 315 e 316, 320 a 323, 324, 365 e 366.

Base: HEAD `d6d6dd77a7999d0df0454eb58d62584c0f46a9a3`, branch main, igual a `origin/main`
(`git fetch` sem mover a base, contagem 0/0). Nenhum pull, merge, reset, stash, commit ou push.
A árvore de trabalho tem alterações concorrentes do CX1, vivas durante esta conferência:
`afty-derive.js`, `afty-efeitos.js`, `afty-efeitos-conteudo.js`, `afty-equipamentos.js`,
`afty-feiticos.js`, `afty-origens.js`, `afty-pericias.js`, `afty-anatomias.js`,
`afty-propriedades-armas.js`, `ficha/ficha-rolagem.js`, `AftyCreatureBuilder.jsx`, entre outros,
mais as de Técnicas Marciais. Todas preservadas e não tocadas por este lote.

Linha de base medida antes de mudar comportamento (`npm run asserts`, árvore já com o CX1 em curso):
243 de 244 arquivos aprovados, 14.876 asserts nos arquivos aprovados. Falhou somente
`t-reconciliacao-g00` (expectativa fixa de 32 remendos, é do CX1). Reprodução do diagnóstico:
script fora do repositório, descrito abaixo.

### Verificação por parcela

| Parcela | Página ou decisão | Evidência atual | Veredito |
|---|---|---|---|
| Resultado de 1/20 no ataque | p.307 | Na árvore o CX1 já separou `tipoTeste: "ataque"`: nat 20 acerta, nat 1 erra, sem Defesa o sucesso é `null` | Já coberto pelo CX1. Consumo, não edito `ficha-rolagem.js` |
| Ataque com alvo, Defesa, cobertura e camuflagem | p.294, 307 | Correção da checagem inicial: existe um controle "Defesa do alvo" POR ARMA, só para Oscilante e Ampla (`afty-propriedades-armas.js`, `ControlesDeArma.jsx`), que alimenta o `cd` do teste. Não há alvo declarado geral, cobertura, flanco nem camuflagem (d10) | Implementar, compatível com o controle existente (`alvo.defesa` aceita o mesmo número) |
| Desastre abre reação contra o atacante | p.307 | Nada representa a oportunidade | Implementar como dado da resolução |
| TR como resultado estruturado | p.309, 365 | Só `rolarTeste` solto, sem tradução em efeito | Implementar |
| Dano tipado na ordem | p.309, 315, 365 | `aplicaDano(sessao, n)` não tem tipo. Com Imunidade a Queimante e RD 3 a Cortante em `derived.defesasDano.porTipo`, `aplicaDano(30)` tirou 30 | Implementar como entrada nova e aditiva, terminando nos verbos existentes |
| Perda de vida e Dano na Alma | p.311, 316 | Os verbos existem. Falta o TR de Integridade antes da aplicação e o despacho único | Implementar o despacho, reutilizar os verbos |
| Saldo negativo e Portas da Morte (N09, N10) | p.313 | `aplicaDano` perde o excesso | Depende de entrega (CL2). CL1 só expõe o excesso sobre zero |
| Contrato de uso | M03-D01 em a-fazer | Cada cliente tem ramo próprio (Técnica Máxima, Golpe Especial, Invencível, Expansão) | Implementar |
| Identidade da operação | prompt | Não há anel de ids. A guarda do G2 depende de a tela mandar `esperado`. Dois `usarFeitico` seguidos cobram duas vezes (PE 48, 45, 42), o que é válido como dois usos, mas nada distingue um clique repetido | Capacidade ausente, implementar |
| Recusa com motivo | prompt | `alteraEstadoCombate` recusa devolvendo a mesma sessão, por leitura do código | Implementar no contrato novo, sem mudar o verbo antigo |
| Cobrança de Armas Absolutas | p.61, pergunta M03 n.3 | Resposta do autor **não existe**. Vigente: `custoPE` de estado só exibido | Depende de decisão. Padrão do contrato é "PE Não Descontado", manutenção marcada como devida |
| Eventos de ataque e turno, Sequência de Ataques | p.310 | Não existem | Implementar |
| Consumo no próximo ataque elegível | p.178, 288 | Existe como fluxo de tela: `consomeEstado` no rolar do dano e `disparo` de addon. Errar não consome porque o dano só é rolado no acerto | Parcial. Falta elegibilidade e expiração declaradas |
| Ações, reações, hierarquia | p.300, 301 | Só os contadores do Restringido em `especializacaoSessao`, que valem para qualquer ficha | Implementar sem segundo contador de reação |
| Concentração ligada ao efeito | p.320, 322 | Só a linha de teste (Fortitude mais bônus). Sem estado, CD por causa nem término. O Ritual Estendido exige concentração e não tem nada | Implementar, com o Ritual Estendido como cliente real |

### Reprodução

Script único fora do repositório, usando `deriveAfty` e a sessão reais, Player 12 com `defesasDano`
`{ queimante: imune, ct: resistente com RD 3 }`:

- `aplicaDano` aceita dois parâmetros e nunca recebeu tipo: perda de 30 contra Imunidade.
- `Object.keys` da sessão em branco e das exportações de `ficha-sessao.js` sem nenhum verbo ou campo
  de concentração, sequência ou economia de ações.
- Ataque nat 20 contra Defesa 100: acerto e crítico. Nat 1 com bônus 100 contra 10: erro e pifia.
  Sem Defesa, sucesso `null`. A Defesa só chega quando a arma tem Oscilante ou Ampla e a pessoa digita o controle
  "Defesa do alvo" daquela arma. Para os demais ataques não há alvo declarado.

## Reservas de edição (CL1)

Lote em andamento: **CL1**. Declaradas aqui porque `docs/a-fazer.md` estava reservado pelo CX1 e foi
gravado minutos antes. Depois de liberá-lo, o CX1 registrou a reserva do CL1 na fila a partir deste arquivo, e o CX2 passou a
reservar a fila e o `afty-status.md` em seguida. O fechamento da linha do CL1 na fila e no histórico espera a liberação do CX2.

Arquivos novos, só meus: `src/systems/afty/ficha/ficha-uso-estado.js` (folha), `ficha/ficha-uso.js`,
`ficha/ficha-uso-clientes.js`, `ficha/ficha-ataque.js`, `ficha/ficha-dano-recebido.js`, `ficha/ficha-combate-eventos.js`,
`ficha/ficha-acoes.js`, `ficha/ficha-concentracao.js`, `ficha/efeitos/operacoes-uso.js`, os asserts `asserts/t-cl1-*.mjs`,
`docs/afty-motor-uso-combate.md` e esta entrega.

Arquivos existentes que este lote edita, cada um em trechos pequenos e aditivos: `ficha/ficha-sessao.js` (normalização do
campo novo, virada de rodada, início e fim de turno, fim do combate, descanso, Ritual Estendido), `asserts/LEIA.md`,
`asserts/t-ordem-modulos.mjs` (uma linha na lista de folhas), `docs/afty-motor-referencia-estrutural.md` (três linhas na
tabela de arquivos-chave) e `docs/revisao-automacao/escopo.json`. Neste último foram acrescentadas **nove entradas ao fim de
`modulosAdicionais`**, todas INTERFACE, para o `t-revisao-g00`: quem for classificar módulos novos edita o mesmo bloco e deve
acrescentar depois delas. Nenhum dos reservados pelo CX1 é editado, e nada em `src/components/`. Sem canal novo, sem variável
nova de DSL e sem mudança de fórmula, então `automacao-dsl.md` e `afty-formulas-base.md` não mudam.

### Liberação

Ao encerrar esta sessão ficam **liberados** todos os arquivos acima, inclusive `ficha/ficha-sessao.js`, que o Codex precisa
para a integração. Reserva nenhuma do CL1 continua em pé, exceto a linha do CL1 na fila e o registro no `afty-status.md`, que
esperam a liberação do CX2 (texto pronto na seção "Para a fila e o histórico", no fim).

## Decisões deste lote

- O contrato vale para criatura e personagem sem divergência: é mecânica de sessão e não altera
  nenhum número de ficha existente. Nada entra em `DIVERGENCIAS`. Pergunta registrada, ver abaixo.
- Política de cobrança: `manual` é o padrão e nunca debita. `confirmada` só quando o descritor do
  cliente declara, e então o clique é a confirmação. Não há `automatica` neste lote.
- Armas Absolutas segue só exibindo o custo. A manutenção de rodadas seguintes é marcada como
  devida na virada, sem debitar e sem desligar o estado.
- O Invencível sob o Sol não migra para o novo resolvedor: a cobrança dele continua a de hoje.
- Ordem do dano: Imunidade zera, depois a metade do TR e a Resistência, depois a Vulnerabilidade
  (1,5x), por fim a Redução de Dano, tudo com piso (p.309 e p.365).
- Dano na Alma: passa pelas defesas do tipo `alma` que o site já modela (estados da aba de Defesas e a RD a Alma, que a RD
  Geral não cobre) e só depois pelo TR de Integridade (p.311). O PV temporário não protege.
- Um uso ativo cujo estado foi desligado à mão pelo seletor antigo é encerrado na próxima virada ou turno
  (`desligadoAMao`), e nada fica devido.
- Sequência de Ataques conta ataques realizados, acertando ou errando (leitura literal de p.310).

## Pendências específicas (não bloqueiam o restante)

1. O contrato de uso vale para criatura e personagem? Adotado: sim, sem divergência.
2. Armas Absolutas: cobrar e expirar sozinho, ou exibir o custo e deixar a manutenção com a pessoa
   (pergunta M03 n.3, já na fila). Adotado: exibir.
3. RD quando uma instância de dano reúne parcelas de tipos diferentes: o livro diz que a Redução
   é aplicada uma vez sobre o total, sem dizer qual RD vale. Adotado: a operação recebe um tipo
   por instância e o chamador separa.
4. Dano na Alma: a p.311 diz que o dano atravessa as defesas e também que o TR de Integridade considera "o total
   após qualquer resistência ou redução". O site já tem defesas próprias da Alma (a RD a Alma e os estados da aba de
   Defesas). Adotado: passa por essas, e o TR de Integridade vem depois, o inverso da ordem geral da p.365 porque o
   texto específico ganha. É leitura minha do texto.
5. Quais condições impedem concentração: o livro cita "certas condições" sem enumerar (p.320). A
   lista é um dado configurável e começa vazia de invenção, só com as que o texto de condição
   proíbe de agir.
6. Ao iniciar uma segunda concentração, a primeira termina ou a nova é recusada? Adotado: recusa
   com motivo, e a pessoa escolhe encerrar a anterior.
7. A reação volta no início do turno de quem a tem (p.300). O Restringido hoje a devolve na virada
   da rodada. Não alterei o comportamento existente.

## Implementação, contratos, arquivos e testes

### Achados confirmados e refutados

- **Refutado**: o resultado de 1 e 20 naturais no ataque (N08). Já corrigido pelo CX1 na árvore de trabalho
  (`tipoTeste: "ataque"`), consumido aqui sem edição de `ficha-rolagem.js`.
- **Refutado como defeito**: dois `usarFeitico` seguidos cobrarem duas vezes. São dois usos legítimos. A capacidade
  que faltava era a identidade da operação, e foi entregue.
- **Confirmado e implementado**: contrato de uso, identidade, recusa com motivo, dano tipado na ordem do livro,
  Dano na Alma e perda de vida distintos, ataque com alvo, TR, cobertura, flanco e camuflagem, eventos, pendências do
  próximo ataque, Sequência de Ataques, ações e hierarquia, concentração com o Ritual Estendido.
- **Já coberto, preservado**: errar não consome o que pede acerto (o dano só é rolado no acerto na tela atual), o contador de
  reação do Restringido (reaproveitado, sem segundo contador), Técnica Máxima, Golpe Especial, Invencível sob o Sol,
  Expansão e ações de Addon, que seguem com o verbo de cada um.
- **Fora do lote, entregue por exposição**: o excesso sobre zero (`excessoSobreZero` e `abateu`) para o CL2.

### Contrato

Descrito inteiro em `docs/afty-motor-uso-combate.md`: o estado salvo (`sessao.uso`), o descritor, a identidade da operação
(`opId` obrigatório, anel de 100, repetição devolve `repetida` e a mesma sessão), a tabela de recusas, a política de cobrança
(`manual` padrão, `confirmada` só se o descritor declarar), duração, manutenção devida sem débito, recarga, e a lista dos
pontos reais de sessão que consomem.

### Arquivos

Novos em `src/systems/afty/ficha/`: `ficha-uso-estado.js` (folha), `ficha-uso.js`, `ficha-uso-clientes.js`, `ficha-ataque.js`,
`ficha-dano-recebido.js`, `ficha-combate-eventos.js`, `ficha-acoes.js`, `ficha-concentracao.js` e `efeitos/operacoes-uso.js`.
Novos fora dela: `docs/afty-motor-uso-combate.md`, `asserts/t-cl1-uso.mjs`, `asserts/t-cl1-combate.mjs`, `asserts/t-cl1-mesa.mjs`.

Editados, em trechos pequenos e aditivos:

- `ficha/ficha-sessao.js`: import da folha, campo `uso` na sessão em branco e na normalização, virada de rodada, início e fim
  de turno, fim do combate, descanso e abertura e fechamento da concentração do Ritual Estendido;
- `asserts/t-ordem-modulos.mjs` (a folha), `asserts/LEIA.md`;
- `docs/revisao-automacao/escopo.json`: classificação INTERFACE dos nove módulos novos, exigida por `t-revisao-g00`.

Nenhum arquivo de `src/components/`, do derive, dos efeitos, das fórmulas ou da DSL foi tocado, e por isso
`automacao-dsl.md` e `afty-formulas-base.md` não mudam.

### Pontos reais de sessão

`normalizaSessao` e `sessaoEmBranco` (então o Encontro), `proximaRodada` (`registro.encerrou` e `registro.manutencaoDevida`),
`iniciaTurnoFicha`, `encerraTurnoFicha`, `aplicaPatchCombate`, `descansar`, `iniciaRitualEstendido` e os fechamentos do ritual.
Os adaptadores da camada da mesa do G2 estão em `efeitos/operacoes-uso.js`. Nenhum botão ou painel novo foi criado e o G2
não foi promovido: as telas que chamam `usa`, `aplicaDanoRecebido`, `resolveAtaque` e os demais são trabalho de integração do
Codex, com o guia como mapa.

### Validação

- Linha de base antes de mudar comportamento: 243 de 244 arquivos, 14.876 asserts nos aprovados, falha só `t-reconciliacao-g00`.
- Asserts novos: `t-cl1-uso` 186, `t-cl1-combate` 328, `t-cl1-mesa` 31 (545 no total, nos dois sistemas). Cinco mutações do
  código (comparação de Defesa, fator da Vulnerabilidade, repetição de id, débito da política confirmada, consumo por acerto)
  derrubaram os asserts e foram desfeitas. A revisão independente antes da entrega apontou dois defeitos reais, corrigidos com
  teste: o Dano na Alma descartava as defesas do tipo `alma` (RD a Alma e estados) que o site já modela, e um uso ativo ficava
  pendurado, com manutenção devida, quando o estado era desligado à mão pelo seletor antigo da aba Buffs.
- Suíte completa depois das correções: 248 arquivos, 245 aprovados, 15.388 asserts nos aprovados. Os três que falham não são
  deste lote: `t-reconciliacao-g00` (a mesma falha da linha de base, é o impedimento de fechamento do CX1), `t-revisao-g00`
  (o único erro restante é o módulo `afty-origens-feiticos.js` do CX2 sem proprietário de controle, os nove módulos do CL1 estão
  classificados) e `t-cx2-origens` ("Foco alcance", trabalho em curso do CX2).
- Regressão: `t-ordem-modulos` (42), `t-g2-sessao-operacoes` (51), `t-g2-virada-registro` (57, depois de tornar a chave
  `manutencaoDevida` preguiçosa para não mudar o formato do registro), `t-descanso-marionetes`, `t-concessao-sessao`,
  `t-dominio-sessao` e a suíte completa.
- `npx eslint src/systems/afty/` sem erros. `npm run build` aprovado.
- Navegador, build de produção em `vite preview`, contexto novo e isolado a cada largura (1440 e 390), ficha de teste importada,
  nenhum dado real regravado: cliques reais em Próxima rodada e Descanso sobre uma sessão com `uso` semeado. A manutenção
  ficou devida sem tirar PE e sem desligar o estado, a pendência de rodada caiu, a sequência fechou e o buff de Defesa saiu, o
  descanso encerrou o uso e desligou o estado, o anel de ids foi conservado, sem erro de console e sem rolagem horizontal.
  O script ficou fora do repositório.

### Limites declarados

- Sem tela nova. Nenhum caminho de interface chama ainda os verbos novos. O que roda em produção hoje é o ciclo da sessão
  (virada, turno, combate, descanso, Ritual Estendido) e o campo salvo. O restante foi provado por asserts com `deriveAfty` e
  sessão reais, e por adaptadores da camada da mesa.
- A cobrança automática e a expiração por falta de pagamento (pergunta M03 n.3) seguem abertas. O contrato tem a política
  `manual` por padrão e não implementa `automatica`.
- A condição que impede concentração não tem lista no livro. `CONDICOES_QUE_IMPEDEM_CONCENTRACAO` nasce vazia.
- Portas da Morte, saldo negativo, Ferimento, Exaustão e Dados de Vida (CL2), Invocações, Domínios e Votos (CL3) e o conteúdo
  de classes, talentos e itens (CX2 a CX6) não fazem parte deste lote.
- A leitura de que a Sequência de Ataques conta ataques que erraram, e a ordem entre TR, Resistência e Vulnerabilidade quando
  há mais de uma, são leituras minhas do texto e estão nas pendências.

## Para a fila e o histórico (pronto para aplicar quando o CX2 liberar)

Esta seção existe porque `docs/a-fazer.md` e `docs/afty-status.md` estavam reservados pelo CX2 ao encerrar a sessão. O texto abaixo é o que
deve entrar neles, sem reescrever. Depois de aplicado, esta seção pode ser apagada deste arquivo.

### `docs/a-fazer.md`

1. **Tabela dos lotes do Claude, linha do CL1**: trocar o estado por "Núcleo entregue em 2026-10-29. Falta ligar as telas e o conteúdo
   (Codex) e as perguntas abaixo. Lote não encerrado." e apagar o bloco "CL1: em andamento" da seção de coordenação (nenhuma reserva
   do CL1 continua em pé).
2. **Entrada `M03-D01-transacao-de-uso`**: trocar a situação por "Entregue em 2026-10-29: `ficha/ficha-uso.js`, `ficha-uso-clientes.js`
   (`usoDoEstado` liga qualquer estado do catálogo ao contrato) e `docs/afty-motor-uso-combate.md`. Resta a resposta da pergunta 3 de
   2026-10-07 (Armas Absolutas) para existir política automática. Hoje a política é `manual`, sem débito. O Invencível sob o Sol não
   migrou."
3. **Perguntas ao autor (CL1)**, sem bloquear nada:
   1. O contrato de uso vale para criatura e personagem sem divergência? Adotado: sim.
   2. Armas Absolutas: cobrar e expirar sozinho, ou exibir o custo (pergunta 3 de 2026-10-07, já na fila). Adotado: exibir.
   3. Dano com parcelas de tipos diferentes numa só instância: qual RD vale (p.307 diz que a redução é aplicada uma vez). Adotado: um tipo por instância.
   4. Dano na Alma: as defesas do tipo `alma` vêm antes do TR de Integridade (leitura minha da p.311, inverso da ordem geral da p.365).
   5. Quais condições impedem concentração (p.320 só diz "certas condições"). A lista `CONDICOES_QUE_IMPEDEM_CONCENTRACAO` nasce vazia.
   6. A segunda concentração é recusada ou substitui a primeira? Adotado: recusada, a pessoa escolhe encerrar a anterior.
   7. A reação volta no início do turno de cada um (p.300), e o Restringido a devolve na virada da rodada. Não alterei.
   8. A Sequência de Ataques conta ataques que erraram? Adotado: sim (leitura literal de "ataques realizados", p.310).
   9. Ordem entre TR, Resistência e Vulnerabilidade quando há mais de uma: adotado TR, Resistência, Vulnerabilidade, RD (p.365 manda multiplicações e divisões antes de somas e subtrações).
4. **Ligações para o Codex** (nenhuma tela chama os verbos novos ainda; mapa em `docs/afty-motor-uso-combate.md`, seção 9):
   - chamar `usa`, `pagaManutencao`, `encerraUso`, `aplicaDanoRecebido`, `resolveAtaque`, `registraAtaqueRealizado`, `registraAtaqueRecebido`,
     `gastaAcao` e os testes de concentração com um `opId` criado por `novaOperacao()` uma vez por clique;
   - rotular `custo.pe.naoDescontado` como "PE Não Descontado" e mostrar `registro.manutencaoDevida` da virada;
   - na sessão do alvo, chamar também `sofreGolpeNaGuarda` UMA vez por ataque recebido;
   - uma tela de desempate para o `defesa-conflito`;
   - `bloqueioRitualEstendido` se quiser recusar o ritual com a concentração ocupada;
   - os adaptadores `{ mesa, erro }` do G2 estão em `ficha/efeitos/operacoes-uso.js`.

### `docs/afty-status.md` (nova sessão no topo)

**SESSÃO DE 2026-10-29: CL1, MOTOR DE USO E COMBATE (núcleo entregue)**

Fonte externa e SHA-256 conferidos, HEAD igual a `origin/main` (`d6d6dd7`), trabalho concorrente do CX1 e do CX2 preservado, nada em
`src/components/`. Diagnóstico publicado antes do produto, com a correção de que o "Defesa do alvo" já existe por arma (Oscilante e Ampla).
Entregue o contrato de uso (`opId` obrigatório, recusa com motivo devolvendo a mesma sessão, política de cobrança `manual` por padrão e
`confirmada` declarada, duração, manutenção devida sem débito, recarga, concentração única, ponte `usoDoEstado`), o ataque com alvo,
cobertura, flanco, camuflagem, desastre e TR, o dano recebido na ordem do livro com perda de vida e Dano na Alma distintos, os eventos
de ataque, as pendências do próximo ataque, a Sequência de Ataques (Buff de Mesa, sem tocar derive nem DSL), as ações com hierarquia e
a concentração ligada ao Ritual Estendido. Guia: `docs/afty-motor-uso-combate.md`. Evidência: `revisao-livro-regras/entregas/CL1.md`.

O que roda em produção hoje é o ciclo da sessão (virada, turno, combate, descanso, Ritual Estendido) e o campo salvo `sessao.uso`. As
telas ainda não chamam os verbos novos, que ficam para o Codex. Validação: `t-cl1-uso`, `t-cl1-combate` e `t-cl1-mesa`, lint, build e
navegador (1440 e 390, build de produção) conforme o CL1.md. Pendências e perguntas na fila. Portas da Morte, Exaustão e Dados de Vida são
do CL2, Invocações, Domínios e Votos do CL3.
