import fs from 'node:fs';
const edit=(p,f)=>fs.writeFileSync(p,f(fs.readFileSync(p,'utf8')));
const updates=`## SESSÃO DE 2026-10-13: CORREÇÕES E AJUSTES DAS ESPECIALIZAÇÕES DE FANG

Decisões do autor: Foco no Inimigo soma 5 em Percepção e 5 direto em Atenção, total 10.
Resiliência fica como está até a etapa de Custos e Usos. Distribuição de Adrenalina
Intensificadora ocorre no criador, junto da habilidade. Surto de Adrenalina e Físico
Robusto não protegem Alma. Surto de Ação pode ser roubado. Espírito Incansável mantém
sua fórmula anterior. Custos continuam manuais.

Roubo agora fornece contexto de Restringido para os efeitos e para as escolhas internas
recebidas, sem comprar Lutador/Combatente. Corpo Calejado da exportação sobe de 4548 para
4746 PV. Guarda Estudada e Corpo Supremo roubados oferecem escolhas. Libertação do
Destino concede Resistência física e um tipo adicional. Restrição Definitiva soma BT
inteiro aos Mestres físicos, sem alterar jogadas de ataque. Mente Afiada e Semblante
oferecem suas concessões no criador. Semblante aplica piso no d20 de perícias de Presença.
Indulgente a Feitiçaria tem RD e TR condicionados à fonte, escolhida na aba Buffs.
Força Imparável conserva a decisão anterior do autor: os dois TR já treinados podem
virar Mestre. Não se trocou essa decisão pela interpretação de uma escolha de cada faixa.

Imitação mantém seu painel na aba Buffs, acrescenta Manobras e divide habilidades por
Especialização e Nível, com os mesmos mecanismos de abas usados no Roubo. A lista de
novas cópias oculta habilidades efetivas, herdadas, roubadas, concedidas, escolhas de
estilo/postura e aprendidas. Aprendidas continuam na seção própria para reutilização.
Busca e contagens usam apenas opções disponíveis. O avanço de rodada existente controla
o começo/fim de turno da ficha individual e a expiração da cópia. No encontro vale o
controlador de iniciativa. Cura de Ainda de Pé aplica PV e consome seu uso ao rolar a
linha existente. Corpo de Aço cura no começo do turno. Precisão Forçada maximiza o
próximo dano corporal e limita a ativação por rodada. Ataque Furtivo é consumido por
ataque e volta no turno seguinte. O estado Ataque Extra entra pela aba Buffs.

O painel separado de Restringido foi removido após rejeição do autor. Também removidos
Novo turno e Ataques Extras do cabeçalho Dano. Não foram criadas novas barras de ações.
Os acionamentos opcionais sem uma interação existente continuam discriminados na fila.

Validação: 84 regressões novas, 511 asserts focados em dez arquivos, teste próprio de
Imitação, lint e build aprovados. Suíte completa: 212 arquivos e 12386 asserts passaram,
com duas falhas anteriores de t-prodigio.mjs (formato de saída) e t-reconciliacao-g00.mjs
(itens de outras alterações locais sem reconciliação). Browser em 1440 e 390 px verificou
abas, 118 cópias disponíveis no cenário com uma aprendida adicional, filtro de possuídas,
persistência e duração pelo botão de rodada, sem erros de página ou rolagem horizontal.
Evidências em .audit/fang-browser-report.json e asserts/t-fang-especializacoes.mjs.
Reconciliação restrita: 111 identidades e 24 atualizações, preservados donos/estados e
alterações de outras tarefas. Novos módulos classificados. Sem aprovação de regras,
commit, push ou edição de src/components.

`;
edit('docs/afty-status.md',s=>s.replace('\n\n## SESSÃO', '\n\n'+updates+'## SESSÃO'));
edit('docs/automacao-dsl.md',s=>s+`\n\n### Especializações e Imitação, 2026-10-13\n\nRoubo usa nivelPorHabilidade e contextosPorHabilidade para as habilidades recebidas e\nsuas opções, preservando os níveis globais da ficha. avaliarAcessoHabilidade recebe\nroubadas para dispensar requisitos do tipo habilidade e conserva o nível exigido.\nCrítico Aperfeiçoado emite 2 - tem_cmb_critico_melhorado, entregando a redução completa\nsem conceder a habilidade anterior nem duplicar a redução quando as duas existem.\n\nespecializacaoConfig armazena distribuição permanente de Adrenalina, atributo de Defesa\ne concessões de Mente Afiada/Semblante. A ficha antiga mantém a distribuição legada.\nRestrição Definitiva completa treinamento de Mestres físicos no resolvedor de testes.\nLibertação do Destino usa resistenciaDano e Corpo Supremo oferece escolha de rdTipo.\nIndulgente a Feitiçaria exige contra_feiticaria para sua RD e seus TR.\n\nNa sessão, iniciarTurnoEspecializacao/encerrarTurnoEspecializacao acompanham a rodada\nexistente da ficha e os turnos da iniciativa em encontros. Custos de Estamina permanecem\nmanuais. Precisão Forçada utiliza maximizado no rolador de dano. Semblante usa\nminimoNatural no rolador de testes, preservando naturalOriginal quando houver troca.\nA cura de Ainda de Pé aplica o resultado e registra uso, e Corpo de Aço regenera no\ninício do turno. Escolhas opcionais sem acionamento existente ficam discriminadas em\ndocs/a-fazer.md. A lista de Imitação filtra idsPossuidosNaImitacao antes de busca,\ncontagens e abas por Especialização/Nível, mantendo Aprendidas em seção própria.\n`);
edit('docs/revisao-fang-especializacoes-2026-10-12.md',s=>{
s=s.replace('Data: 2026-10-12, America/Sao_Paulo. Auditoria, sem alteração do motor ou da ficha.','Data da auditoria: 2026-10-12, America/Sao_Paulo. Os quadros abaixo registram a situação inicial.\n\nAtualização de 2026-10-13: ver decisões e correções ao final. A situação inicial não é a fila vigente.');
s=s.replace('| Foco no Inimigo | 119 | Erro |','| Foco no Inimigo | 119 | Parcial |');
s=s.replace('contexto de nível e escolhas das roubadas, Atenção de Foco no Inimigo, ativação opcional de Resiliência/Intensificadora,','contexto de nível e escolhas das roubadas, distribuição permanente de Intensificadora,');
s=s.replace('Não foi assumido que RD Geral cobre Alma. Surto de Adrenalina e Físico Robusto dizem todo tipo, e Corpo Supremo diz demais tipos não escolhidos, mas suas linhas atuais são de RD Geral. Essa incidência, a elegibilidade de Surto de Ação no Roubo e a extensão de "bônus de ataque" em Espírito Incansável são pontos a conciliar com as regras e decisões vigentes, sem remover escolhas da ficha.','Decisões posteriores do autor: Surto de Adrenalina e Físico Robusto não cobrem Alma, Surto de Ação pode ser roubado e Espírito Incansável mantém sua fórmula. Foco no Inimigo concede +10 Atenção, conforme a soma de +5 Percepção com +5 direto. Resiliência permanece como está e Custos/Usos são planejados em outro chat.');
return s+`\n\n## Correções e interface em 2026-10-13\n\n- Corpo Calejado roubado utiliza o nível de Restringido. A exportação passa a 4746 PV.\n- Escolhas internas roubadas de Guarda Estudada e Corpo Supremo passam pelo motor e criador.\n- Roubo dispensa requisitos de outras habilidades. Crítico Aperfeiçoado sozinho reduz a margem em 2, sem criar Crítico Melhorado. As duas juntas continuam reduzindo em 2.\n- Libertação do Destino concede Resistência física e tipo adicional. Restrição Definitiva completa BT de Mestres físicos.\n- Mente Afiada, Semblante e distribuição permanente de Adrenalina recebem escolhas no criador. Piso de Semblante aplicado no rolador.\n- Indulgente a Feitiçaria fica condicionado à fonte, na aba Buffs.\n- Cópias recebem escolhas internas, categoria Manobras e duração pela rodada existente. As listas de habilidades são divididas por especialização e nível e ocultam opções já possuídas, inclusive roubadas, herdadas, concedidas e aprendidas.\n- Aprendidas ficam na seção própria. Busca, contagens e abas não exibem as possuídas como novas opções.\n- Painel de Restringido, Novo turno e Ataques Extras em Dano foram removidos a pedido do autor.\n- Custos de Estamina ficam manuais. Acionamentos opcionais sem interação existente estão na fila vigente, sem esconder a limitação com um novo menu.\n\nVerificações: 84 regressões específicas e 511 asserts focados aprovados. Lint e build aprovados. Navegador em 1440 e 390 px: todas as abas, ocultação de possuídas, aprendidas preservadas, persistência e expiração pelo avanço de rodada passaram, sem erro de página ou rolagem horizontal. Suíte completa com duas falhas anteriores, discriminadas no status.\n`;
});
edit('docs/a-fazer.md',s=>{
const a=s.indexOf('### Corrigir lacunas reproduzidas nas Especializações de Fang Yuan');if(a<0)throw Error('Fila não localizada');return s.slice(0,a)+`### Especializações: acionamentos opcionais após remoção do painel\n**Chave:** FANG-2026-10-12-especializacoes\n**Onde:** ficha/ficha-especializacoes.js e interações existentes da ficha\n**Situação:** cálculos, escolhas roubadas, proficiências físicas, Resistência, Imitação e ajustes de interface corrigidos em 2026-10-13. O autor recusou painel separado de Restringido, Novo turno e Ataques Extras em Dano. Custos/Usos são planejados em outro chat e Resiliência fica como está. As funções de reação, Força Imparável/Barreira, alternativa letal de Ainda de Pé e Rejeitar a Morte existem no motor de sessão, mas o acionamento opcional não deve depender do painel removido. O teste de Mesmo Morto e as curas por turno acompanham a rodada existente.\n**Precisa:** integrar os acionamentos opcionais às interações existentes, sem recriar painel ou barra de ações. Alvo de Foco, reação de desvio e circunstâncias de queda ainda exigem informação de mesa. Preservar gastos manuais. Decisões já fechadas: RD de Surto/Físico não cobre Alma, Surto de Ação pode ser roubado, Espírito Incansável está certo, Foco concede +10 Atenção, Roubo dispensa outras habilidades.\n**Anotado:** 2026-10-13, escopo ajustado pelo autor\n`;
});
edit('asserts/LEIA.md',s=>s+'\n- t-fang-especializacoes.mjs: 84 regressões de nível e escolhas de Roubo, dispensa de outras habilidades, Crítico Aperfeiçoado completo, ocultação de possuídas em Imitação, duração pela rodada existente e Precisão Forçada, em Afty e Player.\n');
