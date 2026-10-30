/* ============================================================
   EXEMPLOS DO ESTUDO DE EFEITOS
   ============================================================
   Texto escrito SÓ para este estudo. Não é a regra: a regra integral
   continua na consulta, inalterada, e os catálogos não mudam.

   Conferido contra a ficha EFETIVA do Minamoto (Ficha de Jogador, escolhas
   e as habilidades que mudam outras: Preparação Rápida, Mestre da Postura,
   Espírito Incansável). Número só entra quando a regra o dá sem condição.
   Ambiguidade do livro fica como está.

   Campos:
     finalidade   a PRIMEIRA leitura em Encontrar: para que serve, numa linha
     condicao     a condição decisiva que a finalidade não carrega (Reação,
                  Exaustão, usos por descanso). Sem ela a frase enganaria
     texto    descrição média, no detalhe e na consulta
     quando   condição de uso que a ficha NÃO acompanha (fica consultável)
     duracao  término que a regra dá e a ficha não conta
     custo    o custo como a regra pede
     usos     limite de usos que a regra dá e a ficha não conta
     termina  como acaba, quando a regra amarra o fim a um momento que a
              ficha não vê (o próximo ataque)
     como     "registrar" (uso instantâneo, sem controle) ou "sempre"
     custoCurto   o custo em poucas palavras, e por estado quando uma
                  melhoria o muda ({ padrao, <estadoId> })
     custoDoValor o custo é o próprio valor do passo (Cobrir-se)
     custoDoEstado  o custo À MÃO por PARTES, quando o gasto mora em mais de um
                  estado (E3, 2026-10-16). Cada parte é { estado, valor | pe,
                  rotulo, substitui }: `valor: true` é o PE do próprio valor da
                  faixa (Cobrir-se), `pe` é fixo (o Empurrão, 2 PE), e
                  `substitui` troca a parte de outro estado (os 2 PE do Espírito
                  Incansável no lugar do 1 PE do Espírito de Luta, escolhidos ao
                  utilizar a habilidade)
     foraDosNumeros  o que a habilidade muda e o comparador de números NÃO cobre
                  (E2/E3). A prévia diz isso, em vez de "Sem Mudança nos Seus
                  Números", que seria dizer que não há benefício
     custoPE      o custo em PE, À MÃO, quando o motor não o registra no estado
                  (E2, 2026-10-15). Quem desconta é o jogador, e a ficha não
                  cobra nem presume pagamento. Vale para a Preparação comum
                  (Aura Excessiva) e para o Registrar Uso (Ataque Extra,
                  Indomável e Surto de Ação)
     fonte    arquivo · id, para a revisão

   O que a ficha COBRA não mora aqui: sai da diferença de PE medida depois
   de cada operação (ver `useGestao`).
   ============================================================ */
const EXEMPLOS = {
  cmb_assumir_postura: {
    finalidade: "Postura de combate: Sol, Terra ou Céu",
    texto: "Assume uma postura aprendida (Sol, Terra ou Céu) e recebe os benefícios dela. Ação Livre com Preparação Rápida, duas ao mesmo tempo com Mestre da Postura.",
    duracao: "1 minuto, ou até ser derrubado, ficar incapacitado ou trocar de postura",
    usos: "Ativações iguais ao bônus de treinamento",
    fonte: "afty-habilidades.js · cmb_assumir_postura, cmb_preparacao_rapida, cmb_mestre_da_postura",
  },
  cmb_espirito_de_luta: {
    finalidade: "Mais acerto e PV temporários",
    texto: "Ação Livre que gasta PE para ganhar bônus em ataques até o fim da cena e PV temporários. Com o Espírito Incansável, a escolha entre as duas habilidades é feita ao utilizar o Espírito de Luta.",
    duracao: "O bônus em ataques dura até o fim da cena",
    custo: "1 PE, ou 2 PE com Espírito Incansável",
    custoCurto: { padrao: "1 PE", espiritoIncansavel: "2 PE" },
    custoDoEstado: [{ estado: "espiritoDeLuta", pe: 1 }, { estado: "espiritoIncansavel", pe: 2, substitui: "espiritoDeLuta" }],
    fonte: "afty-habilidades.js · cmb_espirito_de_luta, cmb_espirito_incansavel",
  },
  cmb_guarda_estudada: {
    finalidade: "Defesa pela Sabedoria e +2 em Fortitude",
    texto: "Soma metade do modificador de Sabedoria na Defesa, até o nível, e +2 em Fortitude.",
    como: "sempre",
    fonte: "afty-habilidades.js · cmb_guarda_estudada, escolha cmb_guarda_fortitude",
  },
  /* Catálogo, primeira entrega (2026-10-15). O motor guarda QUANTOS PE foram
     gastos (`conhecimentoAplicado`, faixa até metade do bônus de treinamento)
     e dá +2 por ponto nos cinco TRs. "Contra o efeito de um Feitiço" é da mesa. */
  cnj_conhecimento_aplicado: {
    finalidade: "Bônus no teste de resistência contra Feitiço",
    condicao: "Contra o Efeito de um Feitiço",
    texto: "Ao fazer um teste de resistência contra o efeito de um Feitiço, gasta PE para somar +2 no teste por ponto gasto.",
    quando: "Ao fazer um teste de resistência contra o efeito de um Feitiço",
    duracao: "O teste de resistência",
    custo: "O PE escolhido no controle, até metade do bônus de treinamento",
    custoDoValor: true,
    fonte: "afty-habilidades.js · cnj_conhecimento_aplicado, afty-combate.js · conhecimentoAplicado",
  },
  cnj_reacao_rapida: {
    finalidade: "Iniciativa pela Inteligência ou Sabedoria",
    texto: "Soma o modificador de Inteligência ou Sabedoria na iniciativa.",
    como: "sempre",
    fonte: "afty-habilidades.js · cnj_reacao_rapida",
  },
  cobrir_se: {
    finalidade: "PV temporários ao receber dano",
    condicao: "Como Reação",
    texto: "Reação ao receber dano: gasta PE para ganhar PV temporários.",
    quando: "Como Reação, ao receber dano",
    duracao: "Até o fim do turno da criatura contra a qual a Reação foi usada",
    custo: "O PE escolhido no controle",
    custoDoEstado: [{ estado: "cobrirSePE", valor: true }],
    fonte: "afty-aptidoes.js · cobrir_se, afty-efeitos-conteudo.js · cobrir_se",
  },
  /* Consolidação ampliada (2026-10-16): Arremessos Potentes, família C (liga com custo à mão). O custo (1 PE) e a condição (no começo do
     turno) são os do livro e do rótulo do estado no motor ("Arremessos Potentes · 1 PE"), conferidos em afty-habilidades.js e
     afty-combate.js. A duração não está escrita no texto, e por isso não é declarada aqui. */
  cmb_arremessos_potentes: {
    finalidade: "Ataques de arremesso ignoram RD",
    texto: "No começo do seu turno, pode gastar 1 PE para que os ataques com armas de arremesso ignorem RD igual ao seu bônus de treinamento.",
    quando: "No começo do seu turno",
    custo: "1 PE",
    custoCurto: "1 PE",
    custoPE: 1,
    foraDosNumeros: "A RD que os ataques com armas de arremesso ignoram",
    fonte: "afty-habilidades.js · cmb_arremessos_potentes, afty-combate.js · arremessosPotentes",
  },
  /* Consolidação ampliada (2026-10-16): o montador do Golpe Especial. As onze propriedades, o custo e o pagamento são do
     motor (afty-golpe-especial.js e ficha-sessao.js). Cinco propriedades não têm número na linha de dano. */
  cmb_golpe_especial: {
    finalidade: "Ataque montado com propriedades, pago pelo custo total",
    texto: "Ao realizar um ataque, ou arte do combate que envolva um ataque, pode montá-lo como um ataque especial, escolhendo entre as propriedades. Paga o custo total ao terminar de montar, no mínimo 1 PE. As marcas ficam até desmarcar.",
    quando: "Ao realizar um ataque",
    custo: "A soma das propriedades, no mínimo 1 PE",
    foraDosNumeros: "Amplo, Impactante, Sanguinário, Lento e Sacrifício entram só no custo: a linha de dano do motor não tem número para elas",
    fonte: "afty-golpe-especial.js · PROPRIEDADES_GOLPE, ficha-sessao.js · custoDoGolpeDaSessao e pagaGolpeEspecial",
  },
  cmb_ataque_extra: {
    finalidade: "Dois ataques na ação Atacar",
    texto: "Na ação Atacar, pode gastar PE para atacar duas vezes em vez de uma.",
    quando: "Ao realizar a ação Atacar",
    custo: "2 PE",
    custoCurto: "2 PE",
    custoPE: 2,
    como: "registrar",
    fonte: "afty-habilidades.js · cmb_ataque_extra",
  },
  cmb_indomavel: {
    finalidade: "Rola de novo um Teste de Resistência falho",
    condicao: "Usos Limitados por Descanso",
    texto: "Ao falhar num Teste de Resistência, gasta PE para rolar de novo e ficar com o melhor. Usos limitados por descanso.",
    quando: "Ao falhar num Teste de Resistência",
    custo: "1 PE",
    custoCurto: "1 PE",
    custoPE: 1,
    usos: "Metade do nível de personagem por descanso curto ou longo",
    como: "registrar",
    fonte: "afty-habilidades.js · cmb_indomavel",
  },
  cmb_surto_de_acao: {
    finalidade: "Uma ação comum a mais no turno",
    condicao: "Uma Vez por Rodada · Usos por Descanso Longo",
    texto: "Gasta PE para realizar uma ação comum a mais no turno, uma vez por rodada. Usos limitados por descanso longo.",
    quando: "Uma vez por rodada",
    custo: "5 PE",
    custoCurto: "5 PE",
    custoPE: 5,
    usos: "Metade do bônus de treinamento por descanso longo",
    como: "registrar",
    fonte: "afty-habilidades.js · cmb_surto_de_acao",
  },
  api_invencivel_sob_o_sol: {
    finalidade: "Invencibilidade por até quatro rodadas",
    condicao: "Exaustão a Cada Rodada Mantida",
    texto: "Ação Livre: entra em Invencibilidade, com mais Defesa e Testes de Resistência, os efeitos positivos de todas as posturas e imunidade a críticos.",
    duracao: "Até quatro rodadas",
    custo: "4 PE por rodada mantida",
    usos: "Um ponto de Exaustão por rodada mantida, no final",
    fonte: "afty-alto-nivel.js · api_invencivel_sob_o_sol",
  },
  canalizar_em_golpe: {
    finalidade: "Dano extra no próximo ataque",
    condicao: "Não Vale para Feitiços",
    texto: "Ação de Movimento que gasta PE para somar dano ao próximo ataque. Não vale para Feitiços.",
    quando: "Vale para um ataque só, e errar não consome o uso",
    custo: "PE igual ao nível de Controle e Leitura",
    fonte: "afty-aptidoes.js · canalizar_em_golpe, canalizacao_maxima",
  },
  concentrar_aura: {
    finalidade: "Desliga auras passivas para dar dano extra",
    texto: "Ação Livre: desabilita aptidões de aura passivas por 1 rodada para causar dano energético a mais ao acertar.",
    duracao: "1 rodada",
    fonte: "afty-aptidoes.js · concentrar_aura",
  },
  aura_excessiva: {
    finalidade: "RD contra todo dano, menos na alma",
    texto: "No começo de toda rodada, pode pagar PE para receber RD contra todo tipo de dano, exceto na alma.",
    quando: "No começo de toda rodada",
    custo: "2 PE a cada rodada",
    custoCurto: "2 PE por Rodada",
    /* E2 (2026-10-15): o PE da rodada atual, à mão. A ficha não cobra nem presume pagamento. */
    custoPE: 2,
    fonte: "afty-aptidoes.js · aura_excessiva",
  },
  /* E2 (2026-10-15): textos do estudo das opções que ganharam a Preparação comum.
     Cada um é conferido contra a descrição do catálogo em `fonte`. */
  /* E3 (2026-10-16): as quantidades. Cada texto é conferido contra a descrição do catálogo e o efeito do motor. */
  estimulo_muscular: {
    finalidade: "Bônus em Acrobacia e Atletismo, e mais distância ao empurrar",
    condicao: "Cada Estímulo Uma Vez por Rodada",
    texto: "Ao fazer uma ação de movimento ou uma ação com Acrobacia ou Atletismo, gasta PE para um estímulo: bônus de +1 por PE no teste, até o seu Nível de Aptidão em Controle e Leitura, ou 2 PE para aumentar a distância de um Desarmar ou Empurrar.",
    quando: "Ao realizar uma ação de movimento ou uma ação com Acrobacia ou Atletismo",
    duracao: "O bônus do teste dura até o começo do seu próximo turno",
    custo: "Um PE por ponto de bônus no teste, e 2 PE no Empurrão",
    custoDoEstado: [
      { estado: "estimuloTeste", valor: true, rotulo: "no Teste" },
      { estado: "estimuloEmpurrao", pe: 2, rotulo: "no Empurrão" },
    ],
    foraDosNumeros: "Os estímulos de uma ação de movimento e de Pular não entram na conta da ficha",
    fonte: "afty-aptidoes.js · estimulo_muscular, afty-efeitos-conteudo.js · estimulo_muscular, afty-combate.js · estimuloTeste, estimuloEmpurrao",
  },
  cnj_mente_placida: {
    finalidade: "Bônus no teste de concentração: +3 com 1 PE ou +5 com 2 PE",
    condicao: "Teste Para Manter Concentração",
    texto: "Ao fazer um teste para manter concentração, gasta 1 PE para +3 ou 2 PE para +5. A CD também é reduzida pelo modificador de Inteligência ou Sabedoria.",
    quando: "Ao fazer um teste para manter concentração",
    duracao: "O teste de concentração",
    custo: "1 PE para +3, ou 2 PE para +5",
    custoDoEstado: [{ estado: "mentePlacida", valor: true }],
    foraDosNumeros: "A redução da CD pelo modificador de Inteligência ou Sabedoria não entra na conta da ficha",
    fonte: "afty-habilidades.js · cnj_mente_placida, afty-efeitos-conteudo.js · cnj_mente_placida",
  },
  cmb_precisao_definitiva: {
    finalidade: "Bônus no acerto ou no dano de um ataque",
    condicao: "Ao Fazer um Ataque",
    texto: "Ao fazer um ataque, gasta PE para +2 no acerto por PE, ou +4 no dano por PE. A cada quatro níveis, pode gastar mais 1 PE.",
    quando: "Ao fazer um ataque",
    termina: "Vale para o ataque",
    custo: "O PE escolhido no controle, até o teto do motor",
    custoDoEstado: [{ estado: "precisaoPE", valor: true }],
    fonte: "afty-habilidades.js · cmb_precisao_definitiva, afty-efeitos-conteudo.js · cmb_precisao_definitiva",
  },
  aura_embacada: {
    finalidade: "Ataques contra você têm 20% de chance de falhar",
    foraDosNumeros: "A chance de falhar dos ataques contra você",
    texto: "Ação bônus: paga PE para ativar a aura embaçada e mais PE por rodada para mantê-la. Enquanto ativa, todo ataque corpo a corpo ou à distância contra você tem 20% de chance de falhar.",
    quando: "Como ação bônus",
    duracao: "Enquanto você pagar os 2 PE de cada rodada",
    custo: "2 PE para ativar e 2 PE por rodada para manter",
    fonte: "afty-aptidoes.js · aura_embacada, afty-combate-aptidoes.js · auraEmbacada",
  },
  cnj_potencia_concentrada: {
    finalidade: "Dano extra no próximo Feitiço de dano de alvo único",
    foraDosNumeros: "O dano adicional do próximo Feitiço de dano de alvo único",
    condicao: "Uma Vez por Rodada",
    texto: "Uma vez por rodada, gasta uma Ação de Movimento para que o próximo Feitiço de dano com alvo único cause dano adicional igual a 5 vezes o nível do Feitiço.",
    quando: "Uma vez por rodada, como Ação de Movimento",
    duracao: "O próximo Feitiço de dano de alvo único",
    fonte: "afty-habilidades.js · cnj_potencia_concentrada, afty-combate.js · potenciaConcentrada",
  },
  golpe_com_aura: {
    finalidade: "Imbui o próximo golpe com uma aura que força teste de resistência",
    foraDosNumeros: "A CD do teste de resistência do alvo do golpe",
    condicao: "Não Vale para Feitiços",
    texto: "Gasta 1 PE para imbuir um golpe com uma aptidão de aura que force teste de resistência. A CD aumenta pelo Nível de Aptidão em Aura.",
    quando: "Ao imbuir o próximo golpe",
    termina: "Vale para o próximo golpe",
    custo: "1 PE",
    fonte: "afty-aptidoes.js · golpe_com_aura, afty-combate-aptidoes.js · golpeComAura",
  },
  cmb_ataque_concentrado: {
    finalidade: "Mais dados de dano no próximo ataque",
    condicao: "Gasta o Ataque Extra e o Surto de Ação do Turno",
    texto: "Na ação Atacar, gasta PE para somar dados de dano ao próximo ataque, no lugar de Ataque Extra e Surto de Ação.",
    quando: "Ao usar a ação Atacar, e conta como Ataque Extra e Surto de Ação usados no turno",
    termina: "Vale para a rolagem de dano do próximo ataque",
    custo: "Metade do custo de Ataque Extra ou Surto de Ação, por vez",
    fonte: "afty-habilidades.js · cmb_ataque_concentrado",
  },
  abencoado_pelas_faiscas_negras: {
    finalidade: "Kokusen mais fácil e bônus depois dele",
    condicao: "Depois de Acertar um Kokusen",
    texto: "Kokusen em 19 e 20. Depois de acertar um kokusen, bônus em ataque e dano pelo resto da cena.",
    quando: "Depois de acertar um kokusen",
    duracao: "Pelo resto da cena",
    fonte: "afty-aptidoes.js · abencoado_pelas_faiscas_negras",
  },
  feit_mtrzavoy_1: {
    finalidade: "Quatro ataques em sequência",
    texto: "Quatro ataques em sequência, com dano a mais em cada acerto e um Teste de Vontade no fim contra Desorientado.",
    fonte: "ficha do Minamoto · Feitiço Sequência de Golpes",
  },
};

/* Grupos de estado SEM dono no catálogo (o estado vem de um encantamento da
   bancada, e não de uma habilidade), pelo id do estado raiz. O mesmo formato de
   `EXEMPLOS`. */
const EXEMPLOS_DE_ESTADO = {
  sintonizada: {
    finalidade: "1d8 de dano do tipo escolhido nos ataques com a arma",
    condicao: "Depois de Causar Dano do Tipo com Feitiço ou Aptidão",
    texto: "Sempre que causa dano do tipo escolhido com um Feitiço ou uma Aptidão, os ataques com a arma sintonizada causam 1d8 de dano adicional do mesmo tipo.",
    quando: "Depois de causar dano do tipo escolhido com um Feitiço ou uma Aptidão",
    duracao: "Até o final do próximo turno",
    fonte: "afty-equipamentos.js · enc_arma_sintonizada, aplicarSintonizadaNoDano",
  },
};

/* Grupos de estado sem Habilidade dona que vêm de OUTRA criatura. É leitura
   do estudo, registrada: os aliados acompanham o personagem, a refeição foi
   feita por um cozinheiro e a melhoria, por um ferreiro. */
export const RECEBIDOS = {
  aliados_escolhidos: "Aliados que acompanham o personagem, com o bônus de cada um pelo grau escolhido.",
  comidas_refeicoes: "Refeições feitas por um cozinheiro, com o efeito de cada uma pelo grau dele.",
  armeiro_melhorias: "Melhorias de um ferreiro nos equipamentos, até o próximo descanso.",
};

/* ============================================================
   PV TEMPORÁRIO: quem concede, e como
   ============================================================
   O motor CALCULA o PV Temporário (`derived.pvTemporario`) e diz a origem de
   cada parcela nos detalhes. A Vida só recebe quando alguém registra, com uma
   exceção: o Invencível sob o Sol renova a Postura da Terra sozinho a cada
   rodada (`avancaInvencivelSobOSol`, fonte "Invencível sob o Sol · Postura da
   Terra"). A chave é a ORIGEM do motor, e não o nome na tela.
     beneficio  o que é o mesmo benefício, venha por onde vier. O Invencível
                incorpora a Postura da Terra: é UM benefício, uma reserva
     fonte      o nome da fonte no pote da sessão (`pvTempFontes`)
     regra      uso      uma concessão por uso da habilidade
                rodada   uma por rodada ("no começo do seu turno")
                ficha    quem concede é a sessão (Invencível)
   ============================================================ */
export const FONTE_TERRA_INVENCIVEL = "Invencível sob o Sol · Postura da Terra";
export const PV_TEMP = {
  cmb_espirito_de_luta: { beneficio: "espirito", fonte: "Espírito de Luta", regra: "uso", texto: "Ao utilizar a habilidade" },
  cmb_espirito_incansavel: { beneficio: "espirito", fonte: "Espírito de Luta", regra: "uso", texto: "Ao utilizar a habilidade" },
  cmb_postura_da_terra: { beneficio: "terra", fonte: "Postura da Terra", regra: "rodada", texto: "No começo do seu turno" },
  api_invencivel_sob_o_sol: { beneficio: "terra", fonte: "Postura da Terra", regra: "rodada", texto: "No começo do seu turno" },
  cobrir_se: { beneficio: "cobrir", fonte: "Cobrir-se", regra: "uso", texto: "A cada Reação usada" },
  /* A refeição Revigorante (Ferramentas de Cozinheiro, p.143): "5 pontos de vida temporários para cada grau do cozinheiro".
     A chave é a origem do Motor, e o benefício e a fonte mantêm os nomes que o pote da sessão já usava, para quem registrou antes. */
  "buff:comidas_bancada": { beneficio: "buff:comidas_bancada", fonte: "Comidas (bancada)", regra: "uso", texto: "Ao consumir a refeição" },
};

export const exemploDe = (id) => EXEMPLOS[id] ?? null;
export const exemploDeEstado = (id) => EXEMPLOS_DE_ESTADO[id] ?? null;
