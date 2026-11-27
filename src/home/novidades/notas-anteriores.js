/* O histórico das Novidades, da versão mais nova para a mais antiga. Só é baixado no toque em "Ver Atualizações
   Anteriores" (S-23), para não pesar a abertura da página inicial. */
export const NOVIDADES_ANTERIORES = [
  {
    versao: "0.13",
    titulo: "Nova Página Inicial e Comunidade",
    notas: [
      { data: "2026-11-26", texto: "A página inicial foi refeita, com acesso a Jogador, Criatura, Encontros, Salas e livros. Chega a Comunidade.", onde: { rotulo: "Comunidade", href: "/Comunidade" } },
      { data: "2026-11-26", texto: "É possível rolar Iniciativa e testes direto na criatura.", onde: { rotulo: "Encontros", href: "/Criatura/Encontros" } },
      { data: "2026-11-26", texto: "Invocações podem ter Ação Personalizada.", onde: { rotulo: "Invocações" } },
    ],
  },
  {
    versao: "0.12.1",
    titulo: "Dados para Balanceamento",
    notas: [
      { data: "2026-11-23", texto: "Ao salvar um personagem, o site avisa e envia um resumo das escolhas para ajudar no balanceamento. Dá para recusar.", onde: { rotulo: "Jogador", href: "/Jogador" } },
    ],
  },
  {
    versao: "0.12",
    titulo: "Celular",
    notas: [
      { data: "2026-11-20", texto: "O site carrega menos no começo, e a Ficha se ajusta melhor ao celular.", onde: { rotulo: "Ficha Final" } },
      { data: "2026-11-20", texto: "O criador de fichas foi adaptado ao celular.", onde: { rotulo: "Criador de Fichas" } },
      { data: "2026-11-20", texto: "O Encontro foi adaptado ao celular, e os botões da Ficha ficaram maiores.", onde: { rotulo: "Encontros e Ficha Final" } },
      { data: "2026-11-20", texto: "A Sala se ajusta melhor ao celular.", onde: { rotulo: "Salas", href: "#salas" } },
      { data: "2026-11-19", texto: "Cada tela ganhou um título próprio, o menu ficou mais fácil de usar no celular e o botão Voltar do aparelho funciona dentro do site." },
    ],
  },
  {
    versao: "0.11",
    titulo: "Fichas na Nuvem e Salas",
    notas: [
      { data: "2026-11-18", texto: "O Encontro foi refeito e ficou igual para os diferentes tipos de ficha.", onde: { rotulo: "Encontros", href: "/Criatura/Encontros" } },
      { data: "2026-11-18", texto: "Chega a Sala online: o mestre abre a sala e os jogadores entram com suas fichas, com registro e chat.", onde: { rotulo: "Salas", href: "#salas" } },
      { data: "2026-11-17", texto: "Na lista de fichas, o título agora fica alinhado com os botões do cabeçalho.", onde: { rotulo: "Criatura", href: "/Criatura" } },
      { data: "2026-11-16", texto: "Entre com Google ou Discord para sincronizar fichas na nuvem. A política de privacidade foi publicada.", onde: { rotulo: "Entrar" } },
    ],
  },
  {
    versao: "0.10.1",
    titulo: "Temas e Consulta na Ficha",
    notas: [
      { data: "2026-11-16", texto: "Interlúdios, Votos e Resistências podem ser consultados sem abrir o editor.", onde: { rotulo: "Ficha Final" } },
      { data: "2026-11-14", texto: "Os Ofícios não aparecem mais duplicados.", onde: { rotulo: "Perícias" } },
      { data: "2026-11-14", texto: "O cartão do Novo Estilo das Sombras foi redesenhado.", onde: { rotulo: "Criador de Fichas" } },
      { data: "2026-11-13", texto: "Você pode marcar efeitos como favoritos e usar novas opções de tema e fontes. A última rolagem mostra até 12 dados.", onde: { rotulo: "Ficha Final" } },
    ],
  },
  {
    versao: "0.10",
    titulo: "Nova Ficha Final",
    notas: [
      { data: "2026-11-09", texto: "A Ficha Final ganha visual novo, com abas de Ações, Perícias e Equipamentos, melhor leitura no celular e temas.", onde: { rotulo: "Ficha Final" } },
      { data: "2026-11-09", texto: "Você ganha novas reações e ações durante a luta, como Aparar Ataque.", onde: { rotulo: "Ficha Final e Encontros" } },
      { data: "2026-11-09", texto: "Os níveis de Exaustão aplicam suas penalidades e Condições.", onde: { rotulo: "Ficha Final" } },
      { data: "2026-11-09", texto: "Os Estados da Alma passam a ser automáticos.", onde: { rotulo: "Ficha Final" } },
    ],
  },
  {
    versao: "0.9.2",
    titulo: "Rolagens Grandes e Votos",
    notas: [
      { data: "2026-10-29", texto: "A aba de Votos foi reorganizada, Comidas, Ferreiro e Aliados foram conferidos com o livro e você vê as fontes da margem de crítico.", onde: { rotulo: "Votos e Buffs" } },
      { data: "2026-10-29", texto: "Imitação, Novo Estilo das Sombras e os treinos permitidos a Restringidos foram ajustados.", onde: { rotulo: "Criador de Fichas" } },
      { data: "2026-10-17", texto: "Rolagens com muitos dados são divididas em blocos de 100.", onde: { rotulo: "Ficha Final" } },
    ],
  },
  {
    versao: "0.9.1",
    titulo: "Técnica Máxima e Ajustes de Combate",
    notas: [
      { data: "2026-10-12", texto: "Você pode usar Ataque Amaldiçoado no Ataque Básico e fazer o Treinamento para Aptidão. Cura Aperfeiçoada e Enérgica passam a ser calculadas sozinhas, e o cálculo de Ataque Concentrado foi corrigido.", onde: { rotulo: "Ficha Final e Interlúdios" } },
      { data: "2026-10-12", texto: "Ao sair de uma ficha, você volta para a última pasta aberta.", onde: { rotulo: "Lista de fichas" } },
      { data: "2026-10-11", texto: "Várias Técnicas de Estilo podem ficar ligadas ao mesmo tempo.", onde: { rotulo: "Ficha Final" } },
      { data: "2026-10-08", texto: "Técnica Máxima e Expansão de Domínio passam a ser criadas em Feitiços, Especial.", onde: { rotulo: "Feitiços, Especial" } },
    ],
  },
  {
    versao: "0.9",
    titulo: "Invocações e Estilo das Sombras",
    notas: [
      { data: "2026-10-05", texto: "O Novo Estilo das Sombras ganhou o conteúdo da expansão do livro.", onde: { rotulo: "Feitiços" } },
      { data: "2026-10-04", texto: "O Desenvolvimento Inesperado do Derivado agora soma o ponto de atributo.", onde: { rotulo: "Origem" } },
      { data: "2026-10-03", texto: "Você agora usa Feitiços Permutativos e troca o atributo de ataques e Testes de Resistência. Invocações, encantamentos e alcance foram corrigidos.", onde: { rotulo: "Criador e Ficha Final" } },
      { data: "2026-10-01", texto: "Controlador e Invocações foram refeitos, com tipos, estados, custos e características.", onde: { rotulo: "Invocações" } },
    ],
  },
  {
    versao: "0.8",
    titulo: "Condições e Aba Buffs",
    notas: [
      { data: "2026-09-30", texto: "Raio Negro volta a funcionar com bots de dados, e habilidades do Suporte que não faziam efeito foram corrigidas.", onde: { rotulo: "Ficha Final" } },
      { data: "2026-09-29", texto: "A aba Buffs foi refeita e ficou mais rápida. As Condições passam a alterar os números, contam rodadas e podem ser aplicadas pelo teclado.", onde: { rotulo: "Criador e Ficha Final, Buffs" } },
      { data: "2026-09-29", texto: "Você agora vê as fontes do dano e quantos dados faltam em Somente Condição. Opções que deixariam um Feitiço sem dado ficam bloqueadas.", onde: { rotulo: "Feitiços" } },
      { data: "2026-09-26", texto: "O Especialista em Combate foi revisado pelo livro e ganhou mais efeitos automáticos e o Golpe Especial.", onde: { rotulo: "Habilidades" } },
    ],
  },
  {
    versao: "0.7.4",
    titulo: "Maldições Invocadas e Votos",
    notas: [
      { data: "2026-09-21", texto: "Você ganha a aba de Votos, e os 52 Talentos foram revisados.", onde: { rotulo: "Votos e Talentos" } },
      { data: "2026-09-21", texto: "Fluxo Invencível passa a ser calculado sozinho.", onde: { rotulo: "Ficha Final" } },
      { data: "2026-09-20", texto: "Maldição vira um tipo de Invocação.", onde: { rotulo: "Invocações" } },
    ],
  },
  {
    versao: "0.7.3",
    titulo: "Ataque Desarmado, Equipamentos e Buffs",
    notas: [
      { data: "2026-09-18", texto: "A Alma do jogador e a propriedade Fatal foram corrigidas.", onde: { rotulo: "Ficha Final" } },
      { data: "2026-09-17", texto: "Feitiços viram uma lista lateral, e as Melhorias Superiores seguem as regras de personagem.", onde: { rotulo: "Feitiços" } },
      { data: "2026-09-17", texto: "Aliados são escolhidos numa lista, Comidas seguem o livro e a aba de combate se divide por função.", onde: { rotulo: "Buffs" } },
      { data: "2026-09-16", texto: "Os Ataques Desarmados passam a seguir o livro, e Crítico e Raio Negro foram revisados. Você ganha o botão Novo Ofício e uma lista de equipamentos reorganizada.", onde: { rotulo: "Perícias e Equipamentos" } },
      { data: "2026-09-16", texto: "O personagem pode ter uma terceira Classe.", onde: { rotulo: "Jogador", href: "/Jogador" } },
      { data: "2026-09-15", texto: "A Técnica passa a poder afetar o Shikigami.", onde: { rotulo: "Invocações" } },
    ],
  },
  {
    versao: "0.7.2",
    titulo: "Passivas, Domínio e Interlúdios",
    notas: [
      { data: "2026-09-13", texto: "Você agora tem uma calculadora de Feitiço Passivo, e Aliados, Alma e Comidas fazem parte do sistema.", onde: { rotulo: "Feitiços e Buffs" } },
      { data: "2026-09-13", texto: "O Ataque Concentrado passa a ser calculado sozinho, e você vê as fontes do dano ao passar o mouse. Críticos e Estados da Alma foram corrigidos.", onde: { rotulo: "Ficha Final" } },
      { data: "2026-09-12", texto: "A Expansão de Domínio ganhou visual novo, os Feitiços Auxiliares ganharam interruptor e você pode anotar interlúdios de forja.", onde: { rotulo: "Ficha Final, Buffs e Interlúdios" } },
      { data: "2026-09-10", texto: "Passivas passam a reservar PE máximo, e um aviso errado de pré-requisito foi corrigido.", onde: { rotulo: "Feitiços" } },
    ],
  },
  {
    versao: "0.7.1",
    titulo: "Defesas, Talentos e Feitiços",
    notas: [
      { data: "2026-09-07", texto: "Você agora filtra habilidades por efeito e vê a margem de crítico de cada Teste de Resistência.", onde: { rotulo: "Habilidades e Perícias" } },
      { data: "2026-09-07", texto: "O visual dos Feitiços foi refeito no criador e na Ficha Final, e os valores dos Feitiços Auxiliares foram conferidos.", onde: { rotulo: "Feitiços" } },
      { data: "2026-09-05", texto: "As defesas aparecem separadas por tipo de dano, e você escolhe o atributo de cada perícia. As habilidades de Lutador, os talentos e as Invocações foram revisados.", onde: { rotulo: "Jogador", href: "/Jogador" } },
      { data: "2026-09-05", texto: "Fichas novas sem nome voltam a ser importadas." },
    ],
  },
  {
    versao: "0.7",
    titulo: "Ficha de Jogador",
    notas: [
      { data: "2026-09-01", texto: "Uniformes, escudos e Graus de arma seguem as regras de personagem.", onde: { rotulo: "Jogador, Equipamentos" } },
      { data: "2026-09-01", texto: "Perícia recebida de graça não é mais cobrada de novo ao virar Mestre.", onde: { rotulo: "Jogador, Perícias" } },
      { data: "2026-08-31", texto: "Nasce a ficha de personagem, com Classe, nível até 30, perícias do livro e dano pela arma.", onde: { rotulo: "Jogador", href: "/Jogador" } },
      { data: "2026-08-31", texto: "A criação e o uso de Invocações foram redesenhados.", onde: { rotulo: "Invocações" } },
    ],
  },
  {
    versao: "0.6",
    titulo: "Livros e Criaturas Prontas",
    notas: [
      { data: "2026-07-11", texto: "A lista de criaturas prontas foi ampliada.", onde: { rotulo: "Criatura, Criaturas Base" } },
      { data: "2026-07-09", texto: "Um modelo pode ser aplicado em várias fichas de uma vez.", onde: { rotulo: "Biblioteca de Modelos" } },
      { data: "2026-07-06", texto: "Livro de Regras e Grimório das Maldições podem ser lidos dentro do site.", onde: { rotulo: "Livros e Regras", href: "#livros-e-regras" } },
      { data: "2026-07-06", texto: "Você ganha novas Artimanhas de Suporte automáticas, com alcance, área e efeitos por rodada.", onde: { rotulo: "Criatura", href: "/Criatura" } },
      { data: "2026-07-05", texto: "Criaturas prontas da Enciclopédia Digital entram no site.", onde: { rotulo: "Criatura, Criaturas Base" } },
    ],
  },
  {
    versao: "0.5",
    titulo: "Automações",
    notas: [
      { data: "2026-07-03", texto: "A escolha de perícias respeita o limite e mostra sugestões do livro.", onde: { rotulo: "Criatura", href: "/Criatura" } },
      { data: "2026-07-01", texto: "Níveis de Aptidão entram na ficha, junto da opção Sem Limites.", onde: { rotulo: "Criatura", href: "/Criatura" } },
      { data: "2026-06-24", texto: "Habilidades podem ter regras automáticas, com gatilhos, custos, bônus e imunidades.", onde: { rotulo: "Criatura", href: "/Criatura" } },
    ],
  },
  {
    versao: "0.4",
    titulo: "Biblioteca de Modelos e Expansão de Domínio",
    notas: [
      { data: "2026-06-17", texto: "Você agora pode criar Expansões de Domínio.", onde: { rotulo: "Criatura", href: "/Criatura" } },
      { data: "2026-06-16", texto: "Quando algo dá errado, uma tela explica como recarregar e avisar o problema. Corrigida a falha causada pelo Google Tradutor." },
      { data: "2026-06-16", texto: "Técnica Máxima pode ser marcada na ação, com os dados extras do Patamar.", onde: { rotulo: "Criatura", href: "/Criatura" } },
      { data: "2026-06-15", texto: "Você agora guarda e reaproveita modelos na Biblioteca de Modelos.", onde: { rotulo: "Biblioteca de Modelos" } },
      { data: "2026-06-15", texto: "A redução de dano (RD) passa a ser descontada automaticamente, e há opção para ignorá-la.", onde: { rotulo: "Encontros", href: "/Criatura/Encontros" } },
    ],
  },
  {
    versao: "0.3",
    titulo: "Treinamentos, Dotes e Aptidões",
    notas: [
      { data: "2026-06-11", texto: "Você agora busca e escolhe Características Gerais e Especiais num catálogo.", onde: { rotulo: "Criatura", href: "/Criatura" } },
      { data: "2026-06-11", texto: "O dano das ações foi reformulado, com uma divisão mais estável entre dados e valor fixo.", onde: { rotulo: "Criatura", href: "/Criatura" } },
      { data: "2026-06-10", texto: "Dotes Gerais entram com efeitos automáticos.", onde: { rotulo: "Criatura", href: "/Criatura" } },
      { data: "2026-06-10", texto: "Você agora escolhe Aptidões Amaldiçoadas num catálogo, e os efeitos entram na ficha.", onde: { rotulo: "Criatura", href: "/Criatura" } },
      { data: "2026-06-02", texto: "Treinamentos oficiais passam a aplicar seus efeitos sozinhos.", onde: { rotulo: "Criatura", href: "/Criatura" } },
    ],
  },
  {
    versao: "0.2",
    titulo: "Modelos Salvos e Rascunhos",
    notas: [
      { data: "2026-05-24", texto: "Artimanhas e bônus de origem passam a ser aplicados na ficha.", onde: { rotulo: "Criatura", href: "/Criatura" } },
      { data: "2026-05-24", texto: "Corrigido o cálculo de Atenção, que agora segue o bônus de Percepção.", onde: { rotulo: "Criatura", href: "/Criatura" } },
      { data: "2026-05-23", texto: "Cada combatente ganha ajustes de combate, como a Guarda Inabalável absorver dano antes da vida.", onde: { rotulo: "Encontros", href: "/Criatura/Encontros" } },
      { data: "2026-05-22", texto: "O rascunho é guardado automaticamente. Dá para copiar a ficha como texto ou JSON e importar criaturas.", onde: { rotulo: "Criatura", href: "/Criatura" } },
      { data: "2026-05-21", texto: "Ações e características podem ser salvas como modelo. Ao salvar uma criatura, o site avisa sobre erros e oferece atualizar os encontros que a usam.", onde: { rotulo: "Criatura", href: "/Criatura" } },
      { data: "2026-05-21", texto: "Na lista de encontros, você agora pode buscar, ordenar e arrastar para pastas.", onde: { rotulo: "Encontros", href: "/Criatura/Encontros" } },
    ],
  },
  {
    versao: "0.1.4",
    titulo: "Filtros e Imunidades",
    notas: [
      { data: "2026-05-19", texto: "A tela principal se adapta melhor ao celular.", onde: { rotulo: "Criatura", href: "/Criatura" } },
      { data: "2026-05-18", texto: "Você agora filtra fichas por Patamar, Grau, dificuldade e origem, seleciona várias de uma vez e acompanha o armazenamento.", onde: { rotulo: "Criatura", href: "/Criatura" } },
      { data: "2026-05-16", texto: "Encontros ganham visual novo e lista de imunidades a condições.", onde: { rotulo: "Encontros", href: "/Criatura/Encontros" } },
    ],
  },
  {
    versao: "0.1.3",
    titulo: "Correções e Uso no Celular",
    notas: [
      { data: "2026-05-06", texto: "Corrigida a falha ao inserir imagem na ficha. Carregar o retrato ficou mais simples, e as cores dos menus foram acertadas.", onde: { rotulo: "Criatura", href: "/Criatura" } },
      { data: "2026-05-06", texto: "Testes de Resistência passam a ser calculados do mesmo jeito em toda a ficha.", onde: { rotulo: "Criatura", href: "/Criatura" } },
      { data: "2026-05-06", texto: "Botões que não respondiam foram consertados, e a ficha e os Encontros ficaram melhores no celular.", onde: { rotulo: "Encontros", href: "/Criatura/Encontros" } },
    ],
  },
  {
    versao: "0.1.2",
    titulo: "Cálculos e Estado da Alma",
    notas: [
      { data: "2026-05-05", texto: "Surge a Integridade da Alma, com estados e dano que atinge a vida sem passar pela Guarda.", onde: { rotulo: "Encontros", href: "/Criatura/Encontros" } },
      { data: "2026-05-04", texto: "Ações ganham narrativa de ataque, tipo de alcance e conversão entre dados, Acerto e CD. Campos de texto se ajustam ao tamanho do que você escreve.", onde: { rotulo: "Criatura", href: "/Criatura" } },
      { data: "2026-05-04", texto: "As condições podem ter duração em rodadas ou receber um nome personalizado.", onde: { rotulo: "Encontros", href: "/Criatura/Encontros" } },
      { data: "2026-04-30", texto: "Os valores por Patamar e Grau foram corrigidos, e Acerto e CD passam a usar o atributo escolhido.", onde: { rotulo: "Criatura", href: "/Criatura" } },
    ],
  },
  {
    versao: "0.1.1",
    titulo: "Combate e Organização",
    notas: [
      { data: "2026-04-26", texto: "A criação de ações foi refeita, com tipo de ação e tipo de dano. A ficha ganha Aptidões Amaldiçoadas, Dotes Gerais e Treinamentos, e as criaturas podem ser exportadas.", onde: { rotulo: "Criatura", href: "/Criatura" } },
      { data: "2026-04-26", texto: "Fichas podem ser arrastadas entre pastas. Retratos, perícias e busca de encontros chegam às telas.", onde: { rotulo: "Criatura", href: "/Criatura" } },
      { data: "2026-04-24", texto: "Combate ganha Desafiando a Morte, filtro por pasta e a entrada de reforços no meio da luta.", onde: { rotulo: "Encontros", href: "/Criatura/Encontros" } },
    ],
  },
  {
    versao: "0.1",
    titulo: "Primeira Versão",
    notas: [
      { data: "2026-04-23", texto: "O Grimório estreia com o criador de criaturas e uma lista para guardar as fichas.", onde: { rotulo: "Criatura", href: "/Criatura" } },
      { data: "2026-04-23", texto: "Dá para montar um encontro e acompanhar Pontos de Vida, Energia Amaldiçoada, Guarda Inabalável e condições.", onde: { rotulo: "Encontros", href: "/Criatura/Encontros" } },
    ],
  },
];
