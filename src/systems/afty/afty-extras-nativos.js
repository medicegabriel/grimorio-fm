/**
 * Recursos nativos de Buffs: Aliado, Estados da Alma e Comidas.
 *
 * Os controles ficam em estadosExtras. Aliado e Comidas entregam efeitos
 * pelo coletor de Buffs nativos. A penalidade da Alma é calculada depois
 * que o máximo de Integridade da Alma estiver definido.
 *
 * Os ids permanecem estáveis para preservar fichas e estados já salvos.
 */

const PERICIAS_IDS = [
  "acrobacia", "atletismo", "direcao", "enganacao", "feiticaria", "furtividade",
  "historia", "intimidacao", "intuicao", "investigacao", "medicina", "ocultismo",
  "oficio", "percepcao", "performance", "persuasao", "prestidigitacao",
  "sobrevivencia", "tecnologia", "teologia",
];
const PERICIA_LABEL = {
  acrobacia: "Acrobacia", atletismo: "Atletismo", direcao: "Direção", enganacao: "Enganação",
  feiticaria: "Feitiçaria", furtividade: "Furtividade", historia: "História",
  intimidacao: "Intimidação", intuicao: "Intuição", investigacao: "Investigação",
  medicina: "Medicina", ocultismo: "Ocultismo", oficio: "Ofício", percepcao: "Percepção",
  performance: "Performance", persuasao: "Persuasão", prestidigitacao: "Prestidigitação",
  sobrevivencia: "Sobrevivência", tecnologia: "Tecnologia", teologia: "Teologia",
};

/* ============================================================ */
/* ALIADOS — bancada de combate do companheiro                  */
/* ============================================================ */
/**
 * ⚠ O LIMITE É POR GRAU DE FEITICEIRO, verbatim do livro: *"Personagens de
 * Quarto Grau não podem ter aliados. Personagens de Terceiro e Segundo Grau
 * podem ter um aliado. Personagens de Primeiro Grau podem ter dois aliados.
 * Personagens de Grau Especial podem ter três aliados."*
 *
 * A chave é o `rank` de `AFTY_GRAUS_CRIATURA` (afty-equipamentos.js), que já
 * agrupa os três degraus de Especial no mesmo 5.
 */
export const ALIADOS_POR_RANK = [0, 1, 1, 2, 3];

/** Quantos aliados o grau daquele rank permite. Fora da tabela, nenhum. */
export const limiteDeAliados = (rank) => ALIADOS_POR_RANK[Math.trunc(rank) - 1] ?? 0;

/* Os oito tipos, na ordem em que o livro os apresenta. O `id` curto é o que o
   seletor grava, e o `estado` é a linha de graduação que ele destrava. */
const ALIADOS_TIPOS = [
  { id: "analista", label: "Analista", estado: "aliados_analista" },
  { id: "protetor", label: "Protetor", estado: "aliados_protetor" },
  { id: "assassino", label: "Assassino", estado: "aliados_assassino" },
  { id: "combatente", label: "Combatente", estado: "aliados_combatente" },
  { id: "disparador", label: "Disparador", estado: "aliados_disparador" },
  { id: "elementalista", label: "Elementalista", estado: "aliados_elementalista" },
  { id: "auxiliar", label: "Auxiliar", estado: "aliados_auxiliar" },
  { id: "medico", label: "Médico", estado: "aliados_medico" },
];

export const ESTADOS_ALIADOS = [
  /* ⚠ O SELETOR VEIO ANTES DAS GRADUAÇÕES em 2026-09-17, a pedido do autor:
     *"Faça com que aliados sejam selecionados de maneira similar ao que
     acontece com ofício [...] e confirmando apareceram para adicionar o
     grau"*. Antes eram treze linhas sempre abertas na bancada, uma por tipo
     mais os golpes, e a ficha que não tinha aliado nenhum pagava a altura
     delas do mesmo jeito. Agora é uma linha só até alguém escolher.

     O `maxSelecionados` NÃO é fixo aqui: ele vem do grau de feiticeiro, por
     `estadosNativosExtras`. O `resolveCombate` apara a lista nesse teto. */
  {
    id: "aliados_escolhidos",
    label: "Aliados",
    tipo: "multi",
    maxSelecionados: ALIADOS_POR_RANK[ALIADOS_POR_RANK.length - 1],
    title: "Os aliados que acompanham esta criatura. Quarto Grau não pode ter aliados, Terceiro e Segundo podem ter um, Primeiro pode ter dois, Grau Especial pode ter três. A graduação de cada um aparece depois de escolhido.",
    opcoes: ALIADOS_TIPOS.map((a) => ({ id: a.id, label: a.label })),
  },
  {
    id: "aliados_analista",
    label: "Analista",
    tipo: "opcao",
    requerEstado: "aliados_escolhidos",
    requerOpcao: "analista",
    title: "Focado em analisar os inimigos e encontrar pontos fracos. Iniciante: +2 em rolagens de dano. Veterano: +1 em acerto e +3 em dano. Mestre: +2 em acerto e +4 em dano. Passivo.",
    opcoes: [
      { id: "iniciante", label: "Iniciante", title: "+2 em rolagens de dano." },
      { id: "veterano", label: "Veterano", title: "+1 em acerto e +3 em dano." },
      { id: "mestre", label: "Mestre", title: "+2 em acerto e +4 em dano." },
    ],
  },
  {
    id: "aliados_protetor",
    label: "Protetor",
    tipo: "opcao",
    requerEstado: "aliados_escolhidos",
    requerOpcao: "protetor",
    title: "Preparado para proteger e diminuir a chance de que alguém seja acertado. Iniciante: +2 na Defesa. Veterano: +3 na Defesa e +1 em testes de resistência. Mestre: +3 na Defesa e +2 em testes de resistência. Passivo.",
    opcoes: [
      { id: "iniciante", label: "Iniciante", title: "+2 na Defesa." },
      { id: "veterano", label: "Veterano", title: "+3 na Defesa e +1 em TR." },
      { id: "mestre", label: "Mestre", title: "+3 na Defesa e +2 em TR." },
    ],
  },
  {
    id: "aliados_assassino",
    label: "Assassino",
    tipo: "opcao",
    requerEstado: "aliados_escolhidos",
    requerOpcao: "assassino",
    title: "Foca em furtividade e letalidade. Permite utilizar o Ataque Furtivo com 1d6, cumulativo com a habilidade. Veterano: benefícios de flanco contra inimigo adjacente, de mesa. Mestre: o Ataque Furtivo passa a 2d6. Ligue 'Golpe da rodada' no ataque que o furtivo acertou.",
    opcoes: [
      { id: "iniciante", label: "Iniciante", title: "Ataque Furtivo 1d6." },
      { id: "veterano", label: "Veterano", title: "Ataque Furtivo 1d6 mais flanco contra adjacente, de mesa." },
      { id: "mestre", label: "Mestre", title: "Ataque Furtivo 2d6." },
    ],
  },
  {
    id: "aliados_golpe_assassino",
    label: "Aliado · Assassino · Golpe da rodada",
    tipo: "bool",
    requerEstado: "aliados_assassino",
    title: "Ligue no ataque em que o Ataque Furtivo do Assassino acertou. Adiciona o dado (1d6 ou 2d6) na linha de dano. Desligue depois de aplicar.",
  },
  {
    id: "aliados_combatente",
    label: "Combatente",
    tipo: "opcao",
    requerEstado: "aliados_escolhidos",
    requerOpcao: "combatente",
    title: "Armado e preparado para o combate corpo-a-corpo. Uma vez por rodada, dano adicional numa criatura em que você acerte um ataque corpo-a-corpo: Iniciante 1d8, Veterano 2d10, Mestre 3d12. Dano físico à escolha, Após Ataque. Ligue 'Golpe da rodada' no ataque.",
    opcoes: [
      { id: "iniciante", label: "Iniciante", title: "1d8 Após Ataque, corpo-a-corpo." },
      { id: "veterano", label: "Veterano", title: "2d10 Após Ataque, corpo-a-corpo." },
      { id: "mestre", label: "Mestre", title: "3d12 Após Ataque, corpo-a-corpo." },
    ],
  },
  {
    id: "aliados_golpe_combatente",
    label: "Aliado · Combatente · Golpe da rodada",
    tipo: "bool",
    requerEstado: "aliados_combatente",
    title: "Ligue no ataque corpo-a-corpo em que você acertou. Adiciona o dado (1d8 / 2d10 / 3d12) na linha de dano. Uma vez por rodada — desligue depois de aplicar.",
  },
  {
    id: "aliados_disparador",
    label: "Disparador",
    tipo: "opcao",
    requerEstado: "aliados_escolhidos",
    requerOpcao: "disparador",
    title: "Especializado em combate a distância. Uma vez por rodada, dano adicional numa criatura em que você acerte um ataque a distância: Iniciante 1d8, Veterano 2d10, Mestre 3d12. Dano físico à escolha, Após Ataque. Ligue 'Golpe da rodada' no ataque.",
    opcoes: [
      { id: "iniciante", label: "Iniciante", title: "1d8 Após Ataque, a distância." },
      { id: "veterano", label: "Veterano", title: "2d10 Após Ataque, a distância." },
      { id: "mestre", label: "Mestre", title: "3d12 Após Ataque, a distância." },
    ],
  },
  {
    id: "aliados_golpe_disparador",
    label: "Aliado · Disparador · Golpe da rodada",
    tipo: "bool",
    requerEstado: "aliados_disparador",
    title: "Ligue no ataque a distância em que você acertou. Adiciona o dado (1d8 / 2d10 / 3d12) na linha de dano. Uma vez por rodada — desligue depois de aplicar.",
  },
  {
    id: "aliados_elementalista",
    label: "Elementalista",
    tipo: "opcao",
    requerEstado: "aliados_escolhidos",
    requerOpcao: "elementalista",
    title: "Versado em técnicas com elementos. Uma vez por rodada, gaste PE ou estamina, de mesa, para dano adicional num alvo a até 9 m em que acerte um Feitiço ou técnica marcial: Iniciante 1 PE dá 1d10, Veterano 3 PE dá 3d10, Mestre 4 PE dá 5d12. Tipo elemental à escolha, Após Ataque. Com vários ataques, só no primeiro. Ligue 'Golpe da rodada'.",
    opcoes: [
      { id: "iniciante", label: "Iniciante", title: "1d10 adicional, custo 1 PE." },
      { id: "veterano", label: "Veterano", title: "3d10 adicional, custo 3 PE." },
      { id: "mestre", label: "Mestre", title: "5d12 adicional, custo 4 PE." },
    ],
  },
  {
    id: "aliados_golpe_elementalista",
    label: "Aliado · Elementalista · Golpe da rodada",
    tipo: "bool",
    requerEstado: "aliados_elementalista",
    title: "Ligue no ataque de Feitiço/técnica marcial em que você acertou. Adiciona o dado (1d10 / 3d10 / 5d12) na linha de dano. Uma vez por rodada, só no primeiro ataque — desligue depois de aplicar.",
  },
  {
    id: "aliados_auxiliar",
    label: "Auxiliar",
    tipo: "opcao",
    requerEstado: "aliados_escolhidos",
    requerOpcao: "auxiliar",
    title: "Foco em auxiliar em todas as perícias. Iniciante: +2 em duas perícias. Veterano: +2 em três. Mestre: +2 em quatro. Marque as perícias na linha de baixo, respeitando o limite da graduação.",
    opcoes: [
      { id: "iniciante", label: "Iniciante", title: "+2 em 2 perícias à escolha." },
      { id: "veterano", label: "Veterano", title: "+2 em 3 perícias à escolha." },
      { id: "mestre", label: "Mestre", title: "+2 em 4 perícias à escolha." },
    ],
  },
  {
    id: "aliados_auxiliar_pericias",
    label: "Auxiliar · Perícias (+2)",
    tipo: "multi",
    requerEstado: "aliados_auxiliar",
    maxSelecionados: 4,
    title: "As perícias que o Auxiliar reforça em +2. Marque 2 no Iniciante, 3 no Veterano ou 4 no Mestre. O motor não checa a graduação, respeite o limite.",
    opcoes: PERICIAS_IDS.map((id) => ({ id, label: PERICIA_LABEL[id] })),
  },
  {
    id: "aliados_medico",
    label: "Médico (referência)",
    tipo: "opcao",
    requerEstado: "aliados_escolhidos",
    requerOpcao: "medico",
    title: "Uma vez por rodada, como Ação Bônus, gaste PE ou estamina para se curar ou curar criatura adjacente: Iniciante 1 PE dá 2d6+4, Veterano 3 PE dá 3d10+8 ou remove condição prejudicial de nível forte ou inferior, Mestre 5 PE dá 5d10+12. Referência: a cura é rolada na mesa, o motor não aplica.",
    opcoes: [
      { id: "iniciante", label: "Iniciante", title: "1 PE, 2d6+4 de cura." },
      { id: "veterano", label: "Veterano", title: "3 PE, 3d10+8 de cura ou remover uma condição forte ou inferior." },
      { id: "mestre", label: "Mestre", title: "5 PE, 5d10+12 de cura." },
    ],
  },
];

/**
 * A booleana de "este aliado foi escolhido no seletor".
 *
 * ⚠ TODO EFEITO DE ALIADO PASSA POR AQUI, e é isso que torna o limite do livro
 * REAL em vez de cosmético. A graduação mora numa linha própria e o valor dela
 * não é zerado quando o aliado sai do seletor: sem esta trava, uma ficha com
 * cinco graduações gravadas continuaria somando as cinco, e o teto de um
 * aliado do Terceiro Grau não significaria nada. Quem apara a lista no teto é o
 * `resolveCombate`.
 */
const temAliado = (tipo) => `aliados_escolhidos_${tipo}`;

/* Dano por dado NOMEADO (ver `dadosNomeados` em afty-efeitos.js): cada golpe
   da rodada soma um dado de TAMANHO PRÓPRIO na linha, em vez da MÉDIA
   embutida no `danoBonus` (o mesmo bug corrigido no core em 2026-08-31 para
   Execução Silenciosa/Ataque Furtivo — "1d6 aparecendo como +6"). */
const golpeDados = (golpeVar, graduacaoVar, dado, qtd, tipo) => ({
  canal: "dadosNomeados", alvo: dado, duracao: "temporaria",
  quando: `${temAliado(tipo)} && ${golpeVar} && ${graduacaoVar}`,
  expr: String(qtd),
});

export const RECURSO_BUFF_ALIADOS = {
  id: "aliados_bancada",
  nome: "Aliado (bancada)",
  descricao: "Bônus do aliado conforme os controles da bancada. Só vale com 'Em Combate' ligado.",
  efeitos: [
    {
      canal: "defesa", duracao: "temporaria",
      expr: `${temAliado("protetor")} * (2*aliados_protetor_iniciante + 3*aliados_protetor_veterano + 3*aliados_protetor_mestre)`,
    },
    {
      canal: "bonusTR", duracao: "temporaria",
      expr: `${temAliado("protetor")} * (aliados_protetor_veterano + 2*aliados_protetor_mestre)`,
    },
    {
      canal: "bonusAcerto", duracao: "temporaria",
      expr: `${temAliado("analista")} * (aliados_analista_veterano + 2*aliados_analista_mestre)`,
    },
    {
      canal: "danoBonus", duracao: "temporaria",
      expr: `${temAliado("analista")} * (2*aliados_analista_iniciante + 3*aliados_analista_veterano + 4*aliados_analista_mestre)`,
    },
    // Assassino: 1d6 (Iniciante/Veterano) ou 2d6 (Mestre).
    golpeDados("aliados_golpe_assassino", "aliados_assassino_iniciante", "d6", 1, "assassino"),
    golpeDados("aliados_golpe_assassino", "aliados_assassino_veterano", "d6", 1, "assassino"),
    golpeDados("aliados_golpe_assassino", "aliados_assassino_mestre", "d6", 2, "assassino"),
    // Combatente: 1d8 / 2d10 / 3d12.
    golpeDados("aliados_golpe_combatente", "aliados_combatente_iniciante", "d8", 1, "combatente"),
    golpeDados("aliados_golpe_combatente", "aliados_combatente_veterano", "d10", 2, "combatente"),
    golpeDados("aliados_golpe_combatente", "aliados_combatente_mestre", "d12", 3, "combatente"),
    // Disparador: 1d8 / 2d10 / 3d12.
    golpeDados("aliados_golpe_disparador", "aliados_disparador_iniciante", "d8", 1, "disparador"),
    golpeDados("aliados_golpe_disparador", "aliados_disparador_veterano", "d10", 2, "disparador"),
    golpeDados("aliados_golpe_disparador", "aliados_disparador_mestre", "d12", 3, "disparador"),
    // Elementalista: 1d10 / 3d10 / 5d12.
    golpeDados("aliados_golpe_elementalista", "aliados_elementalista_iniciante", "d10", 1, "elementalista"),
    golpeDados("aliados_golpe_elementalista", "aliados_elementalista_veterano", "d10", 3, "elementalista"),
    golpeDados("aliados_golpe_elementalista", "aliados_elementalista_mestre", "d12", 5, "elementalista"),
    ...PERICIAS_IDS.map((id) => ({
      canal: "bonusPericia", alvo: id, duracao: "temporaria",
      expr: `${temAliado("auxiliar")} * 2 * aliados_auxiliar * aliados_auxiliar_pericias_${id}`,
    })),
  ],
};

/* ============================================================ */
/* ESTADOS DA ALMA — penalidade automática                      */
/* ============================================================ */
export const ESTADOS_ALMA = [
  {
    id: "alma_info",
    label: "Estados da Alma (referência)",
    tipo: "bool",
    title: "REFERÊNCIA — o que o motor não aplica sozinho, por Estado: Danificado (<75%) custo de energia/estamina das habilidades +2. Instável (<50%) custo +3, condição Exposto. Crítico (<25%) custo +5, desvantagem em tudo, condições Exposto + Fragilizado. Em 0% de Integridade: morte. Os -3/-6/-8 em Perícia, TR e Acerto já entram sozinhos, sem precisar deste interruptor.",
  },
];

export const RECURSO_BUFF_ALMA = {
  id: "alma_estados_automatico",
  nome: "Estados da Alma (automático)",
  descricao: "-3/-6/-8 em Perícia, Teste de Resistência e Acerto quando a Integridade da Alma corrente cai abaixo de 75% / 50% / 25% do máximo. Não precisa de interruptor e vale dentro e fora de combate.",
  // O máximo do Player é o PV e só fecha depois dos efeitos da técnica.
  // A penalidade entra no derive após esse cálculo, em efeitosDaAlmaAtual.
  efeitos: [],
};

/** Efeitos da Alma calculados sobre a fração corrente do máximo da ficha. */
export function efeitosDaAlmaAtual(atual, maximo) {
  const total = Number(maximo);
  if (!Number.isFinite(total) || total <= 0) return [];
  const corrente = atual == null ? total : Math.max(0, Number(atual) || 0);
  const fracao = corrente / total;
  const penalidade = fracao < 0.25 ? -8 : fracao < 0.5 ? -6 : fracao < 0.75 ? -3 : 0;
  if (!penalidade) return [];
  return ["bonusPericia", "bonusTR", "bonusAcerto"].map((canal) => ({
    canal, duracao: "temporaria", expr: String(penalidade),
    origem: "buff:" + RECURSO_BUFF_ALMA.id, nome: RECURSO_BUFF_ALMA.nome,
  }));
}

/* ============================================================ */
/* COMIDAS — Ferramentas de Cozinheiro                           */
/* ============================================================ */
export const ESTADOS_COMIDAS = [
  {
    id: "comidas_refeicoes",
    label: "Refeições consumidas",
    tipo: "multi",
    maxSelecionados: 7,
    title: "As refeições das Ferramentas de Cozinheiro que esta criatura consumiu. Produzir cada uma exige Ofício (Cozinheiro) CD 15, mais 5 por benefício adicional. Duram até o próximo descanso longo. Ligue Em Combate na bancada para os efeitos entrarem, e informe o Grau e o Bônus de Treinamento do cozinheiro, que valem para todas as refeições.",
    opcoes: [
      { id: "energetica", label: "Energética", title: "Energia amaldiçoada temporária igual ao Bônus de Treinamento do cozinheiro. Ligado pelo motor." },
      { id: "leve", label: "Leve", title: "Deslocamento +3 m por Grau do cozinheiro: 3 no Quarto, 6 no Terceiro, 9 no Segundo, 12 no Primeiro e 15 no Especial. Ligado pelo motor." },
      { id: "nutritiva", label: "Nutritiva", title: "+2 em um número de Testes de Resistência igual à metade do Bônus de Treinamento do cozinheiro. Limitada por usos, controlada na mesa." },
      { id: "picante", label: "Picante", title: "+2 em jogadas de ataque. Ligado pelo motor." },
      { id: "reforcada", label: "Reforçada", title: "+2 na Defesa. Ligado pelo motor." },
      { id: "refrescante", label: "Refrescante", title: "Um teste com vantagem, e o benefício se encerra. Aplicado na mesa." },
      { id: "revigorante", label: "Revigorante", title: "5 PV temporários por Grau do cozinheiro: 5 no Quarto, 10 no Terceiro, 15 no Segundo, 20 no Primeiro e 25 no Especial. Ligado pelo motor." },
    ],
  },
  /* ⚠ GRAU E MAESTRIA SÃO DOIS CONTROLES, e o livro é o motivo: a Leve e a
     Revigorante escalam por GRAU do cozinheiro (*"3 metros para cada grau do
     cozinheiro. 3 para quarto, 6 para terceiro, 9 para segundo, 12 para
     primeiro e 15 para especial"*), enquanto a Energética e a Nutritiva
     escalam pelo BÔNUS DE TREINAMENTO dele. São duas escadas diferentes, e
     tratá-las como uma só sempre erra uma das duas.

     Histórico curto: em 2026-09-13 o Grau foi retirado para a bancada ter um
     controle a menos, e as duas passaram a multiplicar pela Maestria (com
     Maestria 8 a Leve dava 24 m, contra o teto de 15 do livro). Em 2026-09-16
     o Grau voltou DERIVADO da Maestria, e em 2026-09-17 o autor pediu os dois
     explícitos. O derivado continua valendo como reserva, então a sessão
     gravada antes deste dia não perde o bônus. */
  {
    id: "comidas_grau",
    label: "Comidas · Grau do cozinheiro",
    tipo: "opcao",
    requerEstado: "comidas_refeicoes",
    title: "O grau do cozinheiro que preparou as refeições. Vale para todas. A Leve soma 3 m de Deslocamento por grau e a Revigorante soma 5 PV temporários por grau. Sem escolha, o grau sai do Nível de Maestria.",
    opcoes: [
      { id: "quarto", label: "Quarto", title: "Leve +3 m, Revigorante 5 PV temporários." },
      { id: "terceiro", label: "Terceiro", title: "Leve +6 m, Revigorante 10 PV temporários." },
      { id: "segundo", label: "Segundo", title: "Leve +9 m, Revigorante 15 PV temporários." },
      { id: "primeiro", label: "Primeiro", title: "Leve +12 m, Revigorante 20 PV temporários." },
      { id: "especial", label: "Especial", title: "Leve +15 m, Revigorante 25 PV temporários." },
    ],
  },
  {
    id: "comidas_bt",
    label: "Comidas · Bônus de Treinamento do cozinheiro",
    tipo: "faixa",
    requerEstado: "comidas_refeicoes",
    min: 0,
    max: 8,
    passo: 1,
    title: "Bônus de Treinamento do cozinheiro. A Energética dá este valor em PE temporário, e a Nutritiva usa a metade dele como número de Testes de Resistência, controlado na mesa.",
  },
];

/* O Grau do cozinheiro como número, de 1 (Quarto) a 5 (Especial).

   ⚠ O ESCOLHIDO MANDA, E O DERIVADO É RESERVA. Sem escolha na bancada o grau
   sai do Bônus de Treinamento (Grau = BT - 1, com teto no Especial), que é a
   conta que valeu entre 2026-09-16 e 2026-09-17: sem ela, toda sessão gravada
   naquela janela perderia a Leve e a Revigorante ao abrir. A comparação
   devolve 1 ou 0, então o segundo termo só entra com o seletor vazio. */
const GRAU_ESCOLHIDO = "(1*comidas_grau_quarto + 2*comidas_grau_terceiro"
  + " + 3*comidas_grau_segundo + 4*comidas_grau_primeiro + 5*comidas_grau_especial)";
const GRAU_COZINHEIRO = `(${GRAU_ESCOLHIDO} + (${GRAU_ESCOLHIDO} == 0) * max(0, min(5, comidas_bt - 1)))`;

export const RECURSO_BUFF_COMIDAS = {
  id: "comidas_bancada",
  nome: "Comidas (bancada)",
  descricao: "Bônus das refeições conforme os controles da bancada. Só vale com 'Em Combate' ligado.",
  efeitos: [
    { canal: "defesa", duracao: "temporaria", expr: "2 * comidas_refeicoes_reforcada" },
    { canal: "bonusAcerto", duracao: "temporaria", expr: "2 * comidas_refeicoes_picante" },
    // 3 m e 5 PV por GRAU do cozinheiro, e não por ponto de Maestria. Ver o
    // aviso em ESTADOS_COMIDAS.
    {
      canal: "movimento", duracao: "temporaria",
      expr: `comidas_refeicoes_leve * 3 * ${GRAU_COZINHEIRO}`,
    },
    {
      canal: "pvTemporario", duracao: "temporaria",
      expr: `comidas_refeicoes_revigorante * 5 * ${GRAU_COZINHEIRO}`,
    },
    {
      canal: "peTemporario", alvo: "combate", duracao: "temporaria",
      expr: "comidas_refeicoes_energetica * comidas_bt",
    },
  ],
};

/* ============================================================ */
/* ARMEIRO: Ferramentas de Ferreiro                              */
/* ============================================================ */
/**
 * Texto do livro: *"Durante um descanso curto, um personagem com treinamento
 * em ferramentas de ferreiro pode melhorar temporariamente uma quantidade de
 * equipamentos igual a metade do seu bônus de treinamento; em um descanso
 * longo, essa quantidade é igual ao bônus de treinamento. Uma arma melhorada
 * adiciona +2 em jogadas de ataque realizadas com ela; um escudo melhorado
 * adiciona metade do bônus de treinamento do ferreiro na RD concedida enquanto
 * empunhado. As melhorias duram até o próximo descanso."*
 *
 * ⚠ SÓ DUAS COISAS VIRAM NÚMERO: o +2 da arma e a metade do BT do escudo. A
 * QUANTIDADE de equipamentos melhorados é um teto de mesa (quais itens foram
 * para a bigorna é decisão de quem jogou), e por isso ela mora no `title` do
 * controle de Bônus de Treinamento, e não num contador que não alimentaria
 * canal nenhum.
 *
 * ⚠ A RD DO ESCUDO É RD GERAL (autor, 2026-08-01, em afty-equipamentos.js), e
 * não RD Física. A melhoria do ferreiro soma no mesmo lugar que a RD do escudo
 * já soma, senão ela viraria uma quarta pilha que ninguém abate.
 */
export const ESTADOS_ARMEIRO = [
  {
    id: "armeiro_melhorias",
    label: "Ferreiro",
    tipo: "multi",
    maxSelecionados: 2,
    title: "As melhorias que um personagem treinado em ferramentas de ferreiro fez nos seus equipamentos. Duram até o próximo descanso. Informe o Bônus de Treinamento do ferreiro na linha de baixo.",
    opcoes: [
      { id: "arma", label: "Arma melhorada", title: "+2 em jogadas de ataque realizadas com ela." },
      { id: "escudo", label: "Escudo melhorado", title: "Soma metade do Bônus de Treinamento do ferreiro na RD concedida enquanto empunhado." },
    ],
  },
  {
    id: "armeiro_bt",
    label: "Ferreiro · Bônus de Treinamento",
    tipo: "faixa",
    requerEstado: "armeiro_melhorias",
    min: 0,
    max: 8,
    passo: 1,
    title: "Bônus de Treinamento do ferreiro. O escudo melhorado soma metade dele na RD. Ele também é o teto de quantos equipamentos podem ser melhorados: a metade dele num descanso curto, e ele inteiro num descanso longo.",
  },
];

export const RECURSO_BUFF_ARMEIRO = {
  id: "armeiro_bancada",
  nome: "Ferreiro (bancada)",
  descricao: "Melhorias temporárias de arma e escudo feitas com Ferramentas de Ferreiro. Duram até o próximo descanso e só valem com 'Em Combate' ligado.",
  efeitos: [
    { canal: "bonusAcerto", duracao: "temporaria", expr: "2 * armeiro_melhorias_arma" },
    {
      canal: "rdGeral", duracao: "temporaria",
      expr: "armeiro_melhorias_escudo * piso(armeiro_bt / 2)",
    },
  ],
};

/** Controles nativos da bancada, usados como estadosExtras. */
export const ESTADOS_NATIVOS_EXTRAS = [
  ...ESTADOS_ALIADOS, ...ESTADOS_ALMA, ...ESTADOS_COMIDAS, ...ESTADOS_ARMEIRO,
];

/**
 * Os controles nativos com o que depende da FICHA já resolvido. Hoje é só o
 * teto de aliados, que sai do grau de feiticeiro: Quarto Grau não tem aliado
 * nenhum, e nesse caso as linhas deles não entram na bancada.
 *
 * ⚠ Recebe o rank, e não a criatura: este módulo não calcula ficha, e quem
 * chama (o `deriveAfty`) já tem o grau na mão. Mesmo contrato do
 * `resolveCombate`, que recebe os limites prontos por parâmetro.
 */
export function estadosNativosExtras(rankDeFeiticeiro = 0) {
  const max = limiteDeAliados(rankDeFeiticeiro);
  const aliados = max > 0
    ? ESTADOS_ALIADOS.map((e) => (
      e.id === "aliados_escolhidos" ? { ...e, maxSelecionados: max } : e
    ))
    : [];
  /* A sub-aba de cada um, na divisão que o autor pediu em 2026-09-17: Comidas
     e Ferreiro são Interlúdio (as duas Ferramentas), e Aliados e Alma não têm
     casa própria, então caem em Outros. O id é o mesmo de `afty-combate.js`, e
     está escrito aqui em vez de importado para este módulo não ganhar aresta
     nova no grafo (ver asserts/t-ordem-modulos.mjs). */
  const interludio = { id: "interludio", label: "Interlúdio" };
  const outros = { id: "outros", label: "Outros" };
  const com = (lista, dono) => lista.map((e) => (e.dono ? e : { ...e, dono }));
  return [
    ...com(aliados, outros),
    ...com(ESTADOS_ALMA, outros),
    ...com(ESTADOS_COMIDAS, interludio),
    ...com(ESTADOS_ARMEIRO, interludio),
  ];
}

/** Recursos exibidos na área de Buffs, sem integrar Funcionamento Básico. */
export const RECURSOS_BUFF_NATIVOS = [
  RECURSO_BUFF_ALIADOS, RECURSO_BUFF_ALMA, RECURSO_BUFF_COMIDAS, RECURSO_BUFF_ARMEIRO,
];
