# CL3: invocações, Domínios e Votos

Este arquivo é evidência da entrega, não uma segunda fila. A fila única é `docs/a-fazer.md`.

## Checagem inicial, 2026-11-01

Fonte externa lida diretamente: `C:/Projetos/Grimorio/F&M 2.5.2 - Livro de Regras.md`.
SHA-256 confirmado: `1d0713d52c818a9ab9f47b883d9887a0d227d174d30ffcce358874669a7a733a`.
Páginas conferidas pelo último marcador impresso acima da regra: 185 a 189, 256 a 270, 350 a 358.
O texto de Forma de Arma **não está no Livro**: vem do pacote "Adicionais" do autor (catálogo
`afty-invocacoes-caracteristicas.js`, `fonte: "adicionais"`, decisão de 2026-09-30).

Base: HEAD `deab72cc26a93ab39350b6a781fcb0ca052cc0fd`, branch main, igual a `origin/main` (`git fetch`,
contagem 0/0). Nenhum pull, merge, reset, stash, commit ou push. A árvore tem 41 arquivos rastreados
modificados e arquivos novos de CL1, CL2, CX1 e CX2, preservados. Os mais recentes foram tocados em
2026-11-01 às 14:55, seis horas antes desta conferência, sem sinal de editor ativo.

Linha de base medida antes de mudar comportamento (`npm run asserts`): 250 de 253 arquivos aprovados.
Falham `t-cx2-origens` ("Foco alcance"), `t-reconciliacao-g00` e `t-revisao-g00` (módulo
`afty-origens-feiticos.js` sem proprietário de controle), os três de outros lotes. Nenhum assert de
invocações, Domínios ou Votos falha.

### Verificação por parcela

| Parcela | Página ou decisão | Evidência atual | Veredito |
|---|---|---|---|
| Tipos de Voto (próprio temporário e permanente, emergencial, contratual, congênita) | p.351, 356, 357 | `afty-votos.js` só tem Contratual (texto) e Mecânico livre, sem `tipo` | Implementar |
| Pesos e legalidade (temporário até Pesado, permanente a partir de Médio, tipo pelo malefício, Leve sem Aptidão, Aptidão possuída, escopo, emergencial um peso acima) | p.351 a 356 | Nada valida. O Motor executa o que foi escrito | Implementar como validação, o peso é declarado e a mesa decide o que cada peso significa |
| Prazo, vigência, ruptura e histórico | p.351, 356 | Sem estado. Um `quando` genérico não guarda ruptura | Implementar. A consequência da ruptura é fato informado pela mesa |
| "Até o próximo interlúdio" | p.351 | Não existe evento de interlúdio na sessão nem na ficha | Transição acionada pela mesa, nunca o botão de descanso |
| Restrição Congênita | p.357, 358 | Autoria livre. Sem limite, sem Valores Fixos | Implementar as regras com número escrito. A justiça das trocas é da mesa |
| Romper Voto Próprio Permanente | não escrito | Nenhum texto | Depende de decisão, registrada como pergunta |
| Contratuais sem limite de BT | p.350 diz "votos de restrição igual ao BT" | Decisão do autor de 2026-09-20 (Contratuais ilimitados) | Divergência intencional, pergunta registrada |
| Votos antigos e exceções de addon | | `votoAutomatico` (5 pacotes), `pactoPadrao`, `pacto` legado, 25 asserts | Já coberto, preservar. Voto sem `tipo` emite exatamente como hoje |
| Confronto e Contestação entre participantes | p.185 e 186, DA-15, DA-19 | Bônus, fases, domo e dano calculados. DA-19: confronto entre fichas é **manual assistido** | Implementar resolvedor puro e conciliador das duas sessões, acionados pela mesa |
| Vitória, empate estendido, supressão e restauração | p.185 | `defineFaseDaExpansao` e `encerraExpansao("perdeu")` existem, ninguém decide nem liga os dois lados | Implementar a conciliação |
| Dano ao usuário vai ao domo, inconsciente derruba | p.185 | `danoNoDomo` existe, ninguém encaminha | Implementar o encaminhamento |
| Paredes e Cortinas utilizáveis | p.188, 189 | PV, RD e máximo calculados. Nenhum estado | Implementar |
| Custo da Cortina (1 PE por 9 m) | p.188 | Sem regra de arredondamento no texto | Implementar, arredondamento registrado como pergunta |
| Cesta Oca de Vime | p.188 | Só o texto do catálogo e um assert de requisito | Implementar |
| Forma de Arma, arma virtual no dono | Adicionais, a-fazer 2009 | O interruptor `forma` não tem consumidor | Implementar função pura sobre o `derived` do dono, sem editar o derive |
| Dano Adicional no próximo ataque | p.269 | Aparece na Ficha com o dado, nada consome. O bloqueio antigo (dado de face própria) não existe mais: `dadosNomeados` aceita `alvo: "dX"` | Implementar com `usa` e `armaProximoAtaque` |
| Acerto, Defesa e RD como interruptor sustentado | p.268, decisão de 2026-08-31 | `AUXILIO_SUSTENTAVEL` | Divergência intencional, preservada |
| Redução por repetição | p.269 e 270 | Só o texto `prejuizoMultiplos`. A fila (a-fazer 2033) deixa a decisão aberta | Implementar a contagem. O prompt do lote pede a contagem |
| Exceção de tipo (Técnica imune, Horda com uso adicional) | p.258, 270 | `imunePrejuizoMultiplos` e `prejuizoExtra` existem | Já coberto, consumir |
| Característica Livre sem contexto de sessão | Etapa 5 de 2026-09-10 | `buildInvocacaoDslContext` só enxerga o dono | Implementar |
| Retorno após dissipação, limite em campo, poderes do Controlador, Frenesi, Companheiro | p.257, análise 29/10 | | Fora do lote (CX6) |
| Corpo Amaldiçoado Mutante | p.39 a 41 | Excluído pelo autor em 2026-10-30 | Pulado |

### Menor desenho

Módulos novos em `src/systems/afty/ficha/`, funções puras sobre a sessão no padrão do CL1: operação com
`opId`, recusa com motivo devolvendo a mesma sessão, estado normalizado e salvo. Nada de motor paralelo.

1. **Votos:** campos novos em `creature.votos.mecanicos` (o estado é da ficha, não da sessão). Sem `tipo` o
   Voto emite como hoje. A emissão passa a respeitar `estado` dentro de `efeitosDeVotos`, sem editar o derive.
2. **Domínios:** resolvedor puro do confronto e conciliador que recebe as duas sessões. Estado novo no `combate`
   (`dominioConfronto`), limpo por `encerraExpansao`. Paredes, Cortinas e Cesta Oca num módulo de barreiras
   com `sessao.barreiras`. A Cesta usa o contrato `usa` do CL1 e a concentração do CL1.
3. **Invocações:** Dano Adicional como `usa` com Buff de Mesa (`dadosNomeados`) mais `armaProximoAtaque` na sessão
   de quem ataca. Contagem de repetição por `rodada:` em `sessao.usos`. Forma de Arma como função pura.
   Variáveis de sessão no contexto da Característica Livre.

## Reservas de edição (CL3)

Lote em andamento: **CL3**. A reserva do CX2 sobre a fila, o histórico e arquivos centrais (registrada em
2026-10-29) pode ou não estar de pé. Seguindo o precedente do CL1: tudo abaixo nasce em arquivos novos, e o
texto da fila e do histórico fica pronto no fim deste arquivo para aplicar quando for seguro.

Arquivos novos, só meus: `ficha/ficha-votos.js`, `ficha/ficha-dominio-confronto.js`, `ficha/ficha-barreiras.js`,
`ficha/ficha-invocacao-uso.js`, os asserts `asserts/t-cl3-*.mjs`, `docs/afty-votos.md`,
`docs/afty-dominio-confronto.md` e este arquivo.

Arquivos existentes, em trechos pequenos e aditivos: `afty-votos.js`, `ficha/ficha-sessao.js` (campo novo
na sessão e a limpeza do confronto), `ficha/ficha-uso-estado.js` e `ficha-concentracao.js` (a Durabilidade),
`afty-invocacoes.js` (contexto de sessão da Característica Livre), `asserts/LEIA.md`,
`asserts/t-ordem-modulos.mjs` e `docs/revisao-automacao/escopo.json`.

### Liberação

Ao encerrar esta sessão ficam **liberados** todos os arquivos acima. Nenhum arquivo reservado por CL1 ou CX2 foi editado além dos
trechos aditivos listados. **Não toquei** em `afty-derive.js`, `afty-efeitos.js` nem `AftyCreatureBuilder.jsx`. Dois guias que estavam
na lista de reservas do CX2 (`docs/automacao-dsl.md`, `docs/afty-motor-referencia-estrutural.md`) ganharam uma linha ou um bloco cada, só
com o que o CL3 acrescentou. A fila e o histórico (`docs/a-fazer.md`, `docs/afty-status.md`) foram aplicados em 2026-11-02, com a
autorização do autor, depois de ler cada arquivo de novo (o CX2 ainda mexia neles), e o texto abaixo é o que entrou.

## Decisões deste lote

- O contrato vale para criatura e personagem sem divergência: é mecânica de sessão e de ficha, e não altera nenhum número de ficha
  existente. Nada entra em `DIVERGENCIAS`.
- **Votos: o estado é da ficha** (`creature.votos`), não da sessão, porque o Voto Permanente e o malefício até o interlúdio
  sobrevivem ao descanso. O Voto sem `tipo` é o Voto livre de antes e emite como sempre. Voto de Addon é exceção declarada.
- **Confronto entre fichas: manual assistido** (DA-19). Nada roda sozinho. As duas sessões entram e saem de cada operação, e o
  `opId` vale em cada lado.
- **Cesta Oca de Vime é um uso ativo com Concentração** do contrato do CL1, e a Durabilidade mora nos parâmetros dele. A falha de
  concentração desce 1 de Durabilidade em vez de derrubar (ramo aditivo em `ficha-concentracao.js`, para qualquer uso que declare
  `parametros.durabilidade`).
- **Dano Adicional é disparo**, na sessão de quem recebe, como Buff de Mesa mais pendência do CL1. Defesa, Acerto e RD seguem
  sustentados (decisão do autor, 2026-08-31), agora com o prejuízo guardado no interruptor.
- A Forma de Arma **não está no Livro**: vem do pacote Adicionais (decisão de 2026-09-30). A linha de ataque nasce da linha do dono,
  com o dado e o tipo da Ação Complexa que a pessoa escolheu.

## Pendências específicas (não bloqueiam o restante)

Cada uma está implementada na leitura mais conservadora, marcada nos guias.

1. **Votos.** (a) Contratuais sem limite de BT contra a p.350 (decisão de 2026-09-20 preservada). (b) Romper Voto Próprio Permanente
   não está escrito: recusa. (c) O custo de desfazer um Voto Temporário não tem número: texto da mesa. (d) Quebrar Voto com duração:
   o malefício vale direto até o interlúdio (leitura do "ao invés disso"). (e) O interlúdio é transição que a mesa aciona.
2. **Domínios.** (a) Expansão já ativa contra DOM maior do desafiante: o maior vence pela p.185, e não Contestação (p.186). (b) O dano do
   usuário que também vai ao domo vale a metade, pela resistência do interior. (c) Contestar alvo sem barreira (Sem Barreiras): não
   contestável. (d) Condição que impede concentração derruba a Cesta? A lista do CL1 nasce vazia.
3. **Barreiras.** O custo da Cortina ("1 PE a cada 9 metros") arredonda para cima por bloco, mínimo 1. O texto não dá ação nem RD à
   Cortina: nenhuma ação registrada e RD zero. Parede e Cortina não têm duração no livro: ficam até serem destruídas ou o descanso.
4. **Invocações.** (a) "Uso repetido" conta qualquer auxílio da mesma invocação (`CONTAGEM_DO_PREJUIZO`), a leitura alternativa é o
   mesmo benefício. (b) O Dano Adicional consome no ataque declarado, acertando ou errando. (c) Forma de Arma sem a arma empunhada
   usa o acerto e o fixo do Ataque Básico do dono (`formaArma.aproximada`). (d) Com mais de uma Ação Complexa de ataque a escolha é da pessoa. (e) A linha da Forma de Arma usa o fixo de dano do dono, e não o
   bônus de dano da Ação Complexa da invocação: o texto só manda trocar "o tipo de dano e o dado de dano".
5. **Pacote para Aliados** ainda leva o valor do auxílio sustentado SEM prejuízo (`pacotes-familias.js` monta a própria sessão).

## Implementação, contratos, arquivos e testes

### Achados confirmados e refutados

- **Confirmado e implementado:** tipos, pesos, prazo, ruptura, histórico e Restrição Congênita dos Votos. O procedimento do Confronto
  e da Contestação entre os dois participantes. Estado utilizável de paredes e Cortinas, dano, destruição e custo. A Cesta Oca de Vime
  com Durabilidade, concentração, mãos e Acerto Garantido. Dano Adicional no próximo ataque, prejuízo por repetição, Forma de Arma
  com a linha de ataque e a reação do portador. Variáveis de sessão na Característica Livre.
- **Já coberto, preservado:** os 25 asserts de Votos de antes passam sem alteração, os de `t-dominio-*`, os de Domínio Simples, os de
  Hordas, Quimeras e compostos, e os da Cesta (requisito de época). `AUXILIO_SUSTENTAVEL` (Defesa, Acerto e RD), `imunePrejuizoMultiplos`
  e `prejuizoExtra` da Horda já existiam e são consumidos.
- **Divergência intencional preservada:** Acerto sustentado como interruptor (decisão de 2026-08-31), apesar de a p.268 dizer "próximo
  ataque" para ele.
- **Refutado como ausência:** o bloqueio antigo do Dano Adicional (faltava um canal de dado de face própria). `dadosNomeados` com
  `alvo: "dX"` já existe e é o que as Auras de Dano usam.
- **Fora do lote (CX6):** retorno após dissipação (N15), limite em campo, poderes de posição do Controlador, Frenesi, Companheiro.
  O Corpo Amaldiçoado Mutante foi pulado (descartado pelo autor em 2026-10-30).

### Contratos

Descritos nos três guias, com entradas, saídas, estado salvo, recusas e pontos de ligação (o escopo é de criatura e personagem
sem divergência, e a prova de "sem vazamento" inclui o Stark, um pacote real com estados de combate e um Voto automático, carregado só
por uma das duas fichas de um Encontro, e a entrega do Dano Adicional à outra ficha sem rastro dele):

- Votos: `docs/afty-votos.md`
- Confronto, Contestação, paredes, Cortinas e Cesta: `docs/afty-dominio-confronto.md`
- Auxílio, prejuízo, Forma de Arma e estado de sessão: seção "CL3" de `docs/afty-invocacoes.md`, mais as variáveis novas na tabela de
  `docs/automacao-dsl.md`

### Arquivos

Novos em `src/systems/afty/ficha/`: `ficha-votos-regras.js` (folha), `ficha-votos.js`, `ficha-barreiras-estado.js` (folha),
`ficha-barreiras.js`, `ficha-dominio-confronto.js` e `ficha-invocacao-uso.js`. Novos fora dela: `asserts/t-cl3-votos.mjs`,
`asserts/t-cl3-dominios.mjs`, `asserts/t-cl3-invocacoes.mjs`, `docs/afty-votos.md`, `docs/afty-dominio-confronto.md` e este arquivo.

Editados, em trechos pequenos e aditivos:

- `afty-votos.js`: leitura dos campos novos e o filtro por estado dentro de `efeitosDeVotos` e `regrasAftyDeVotosAtivos`;
- `afty-invocacoes.js`: as variáveis de sessão no contexto da Característica Livre e o prejuízo em `auxiliosLigadosDa`;
- `ficha/ficha-sessao.js`: o campo `barreiras`, o descanso e as chaves `dominioConfronto` e `dominioContestando`;
- `ficha/ficha-uso-estado.js` (`uso.acoes.semComum`), `ficha/ficha-concentracao.js` (a Durabilidade) e `ficha/ficha-uso.js` (o `alvo`
  do Buff de Mesa);
- `asserts/t-ordem-modulos.mjs` (duas folhas novas), `asserts/LEIA.md`, `docs/revisao-automacao/escopo.json` (seis módulos classificados
  como INTERFACE, depois dos do CL2), `docs/automacao-dsl.md`, `docs/afty-invocacoes.md` e `docs/afty-motor-referencia-estrutural.md`.

Nada em `src/components/`, no derive, nos efeitos nem nas fórmulas.

### Validação

- Linha de base antes de mudar comportamento: 250 de 253 arquivos aprovados. Falhavam `t-cx2-origens`, `t-reconciliacao-g00` e
  `t-revisao-g00`, os três de outros lotes.
- Asserts novos: `t-cl3-votos` 130, `t-cl3-dominios` 152 e `t-cl3-invocacoes` 117 (399 no total). Mutações do código derrubaram os
  asserts e foram desfeitas: margem de 5 do Confronto, +2 da Expansão ativa, exceção do DOM menor por 1, restauração do sobrevivente,
  dano do usuário ao domo, passagem a 50%, repetição da Contestação, arredondamento da Cortina, selo da Cesta, RD da parede, Durabilidade,
  Ação Comum perdida, estado do Voto na emissão, opId do Voto, ruptura do permanente, pontos do limite, imunidade da Técnica, uso extra da
  Horda, piso de 1d4, `alvo` do Buff, disparo só no acerto, tipo da arma, RD ignorada, composto, prejuízo no interruptor, contagem do uso,
  margem da arma e PV percentual. Uma mutação sobreviveu na primeira rodada (a margem de crítico da arma, porque o dono já tinha a espada
  com a mesma margem) e ganhou um assert do caso sem a arma empunhada. Duas mutações não se aplicaram por diferença de texto e foram descartadas.
- Suíte completa depois das mudanças: 256 arquivos, 253 aprovados. Os três que falham não são deste lote: `t-reconciliacao-g00` e
  `t-revisao-g00` (módulos `afty-origens-feiticos.js`, `afty-origens-uso.js` e `ficha/ficha-origens.js` do CX2 ainda sem classificação, os
  seis do CL3 estão classificados) e `t-g2-sessao-operacoes`, que falhou uma vez dentro da suíte com um `ReferenceError` de uma edição em
  curso do arquivo por outro lote e **passa sozinho** (52 asserts). `t-cx2-origens` passou a verde com o trabalho do CX2.
- Regressão: `t-ordem-modulos` (48), `t-votos` (25), `t-dominio-*`, `t-cesta-oca`, `t-retracao-de-dominio`, `t-invocacao-*`,
  `t-invocacoes-*`, `t-quimera*`, `t-cl1-*`, `t-cl2-*`, `t-g2-virada-registro` e `t-descanso-marionetes`.
- `npx eslint src/systems/afty/` sem erros. `npm run build` aprovado (o aviso de chunk grande é antigo).
- Navegador, build de produção em `vite preview` na porta 4199, contexto novo a cada rota e largura (Player e Afty, 1440 e 390),
  ficha de teste isolada importada pelo `localStorage` (nenhum dado real regravado): a Ficha abriu com a sessão semeada (invocação em campo
  em Forma de Arma, auxílio ligado, três paredes, uma Cortina e a Cesta ativa), a aba Invocações mostrou a invocação, e a Defesa dela
  trouxe os +2 da Característica Livre `forma_arma`. A aba Votos do criador leu um Voto tipado vigente, um quebrado, uma Congênita e
  um Contrato. **Os números foram conferidos pelo script**, e não só vistos no print: o próprio script derivou a mesma ficha e a mesma sessão
  e comparou com o texto da página a RD Geral do dono (2 no Player e 12 no Afty, cada um com a base do seu sistema), o Movimento (8 m) e a
  Defesa da invocação (21), e confirmou no derive que a Característica Livre soma +2 na Defesa dela, que o Voto vigente soma +2 de RD e que o
  malefício do quebrado tira 1 de Movimento. Sem erro de página e sem rolagem horizontal. O único 404 é `/_vercel/insights/script.js`, que não existe no preview local (aparece numa carga limpa também). O
  script ficou fora do repositório.

### Limites declarados

- **Sem tela nova.** Nenhum botão, painel ou leiaute foi criado, e o G2 não foi promovido. O que roda hoje em produção é o que o ciclo
  da sessão já chamava: a leitura dos campos novos, o filtro de estado na emissão dos Votos, o prejuízo guardado nos interruptores, as
  variáveis de sessão da Característica Livre, a limpeza no descanso e a Durabilidade no teste de concentração. Os verbos novos foram
  provados por asserts com `deriveAfty` e sessão reais.
- A conciliação do Confronto, a Contestação por rodada e o início do turno da Cesta pedem que a tela ou o Encontro chame as operações
  (mapa nas seções 6 dos guias).
- O Pacote para Aliados ainda ignora o prejuízo do auxílio sustentado.
- **A Restrição Congênita não chega ao derive.** O `congenita` (limites de atributo, pontos recebidos, PV por nível, trocas) é VALIDADO e o balanço
  é calculado, mas só os efeitos escritos em cada lado do Voto entram no Motor. A Restrição não limita o atributo sozinha: quem faz o corte
  continua escrevendo o efeito no malefício (por exemplo `limiteAtributo`). Ligar o `congenita` ao cálculo do atributo e do PV por
  nível é trabalho do derive, que o CL3 não tocou.
- `usaAuxilioDaInvocacao` cura a gravação pela metade do Dano Adicional (se só o lado do dono persistiu, repetir o mesmo `opId` aplica o lado de
  quem recebe), mas não cura o caminho do auxílio sustentado, que só escreve na sessão do dono.
- A área da Contestação e quem está dentro da Cortina ou do domo são da mesa: a ficha não tem posição.
- Não foi medido desempenho: nenhuma mudança toca o caminho quente do derive além de uma leitura de mapa por invocação.

## Para a fila e o histórico (pronto para aplicar quando for seguro)

### `docs/a-fazer.md`

1. **Tabela dos lotes do Claude, linha do CL3**: trocar o estado por "Núcleo entregue em 2026-11-01. Falta ligar as telas (Codex, CX6)
   e as perguntas abaixo. Lote não encerrado." e registrar que nenhuma reserva do CL3 continua em pé.
2. **Entradas antigas a atualizar** (não apagar, trocar a situação): "Forma de Arma: a invocação ainda não vira arma no arsenal do dono"
   (núcleo entregue em `ficha-invocacao-uso.js`: `linhaDeFormaArma`, falta a tela), "Auxílio de Dano Adicional não vira número no dono"
   (entregue como disparo: Buff de Mesa mais pendência, falta a tela) e "Prejuízo por Múltiplos Auxílios não é contado" (entregue:
   `usaAuxilioDaInvocacao` conta e reduz, falta a tela).
3. **Perguntas ao autor (CL3)**, sem bloquear nada: as cinco listas da seção "Pendências específicas" acima.
4. **Ligações para o Codex (CX6)**:
   - Votos: `realizaVoto`, `quebraVoto`, `desfazVoto`, `avancaVotosNaRodada`, `votosAoFimDoCombate` e o botão do interlúdio
     (`votosNoInterludio`), com `creature.votos` gravado pela tela. Mapa em `docs/afty-votos.md`, seção 6.
   - Domínios: `participanteDeDominio`, `resolveConfronto`, `iniciaConfronto`, `aplicaResultadoDoConfronto`, `reconciliaConfronto`,
     `avancaContestacao` por par na virada de rodada, e os cards de paredes, Cortina e Cesta (`iniciaTurnoDaCesta` perguntando à mesa
     se o Acerto Garantido o atingiria). Mapa em `docs/afty-dominio-confronto.md`, seção 6.
   - Invocações: trocar o interruptor da aba por `usaAuxilioDaInvocacao`, mostrar `linhaDeFormaArma` nas Ações do dono, e chamar
     `registraAtaqueRealizado` com `categorias` incluindo `invocacao:<id>` nos ataques da invocação.
   - Rotular `custo.pe.naoDescontado` como "PE Não Descontado" em todos.

### `docs/afty-status.md` (nova sessão no topo)

**SESSÃO DE 2026-11-01: CL3, INVOCAÇÕES, DOMÍNIOS E VOTOS (núcleo entregue)**

Fonte externa e SHA-256 conferidos, HEAD igual a `origin/main` (`deab72c`), trabalho concorrente de CL1, CL2, CX1 e CX2 preservado, nada em
`src/components/`, no derive nem nos efeitos. Diagnóstico publicado antes do produto. Entregue: os Votos de Restrição com tipos, pesos,
legalidade, prazo, ruptura, histórico e Restrição Congênita (o Voto livre de antes e o de Addon intactos), o Confronto e a Contestação de
Domínios entre dois participantes (manual assistido, DA-19) com vitória, empate estendido, supressão, restauração e dano ao domo, paredes
e Cortinas utilizáveis, a Cesta Oca de Vime com Durabilidade, concentração e selo, o Dano Adicional como disparo no próximo ataque, o
prejuízo por múltiplos auxílios, a Forma de Arma com a linha de ataque do dono e a reação do portador, e as variáveis de sessão da
Característica Livre. Guias: `docs/afty-votos.md`, `docs/afty-dominio-confronto.md` e a seção CL3 de `docs/afty-invocacoes.md`. Evidência:
`revisao-livro-regras/entregas/CL3.md`. Validação: 388 asserts novos, lint, build e navegador em produção (Player e Afty, 1440 e 390). As telas
ainda não chamam os verbos novos, que ficam para o Codex.
