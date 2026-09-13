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
export const ESTADOS_ALIADOS = [
  {
    id: "aliados_analista",
    label: "Aliado · Analista",
    tipo: "opcao",
    title: "Focado em analisar os inimigos e encontrar pontos fracos. Iniciante: +2 em rolagens de dano. Veterano: +1 em acerto e +3 em dano. Mestre: +2 em acerto e +4 em dano. — PASSIVO. Escolha a graduação (só um aliado por vez).",
    opcoes: [
      { id: "iniciante", label: "Iniciante", title: "+2 em rolagens de dano." },
      { id: "veterano", label: "Veterano", title: "+1 em acerto e +3 em dano." },
      { id: "mestre", label: "Mestre", title: "+2 em acerto e +4 em dano." },
    ],
  },
  {
    id: "aliados_protetor",
    label: "Aliado · Protetor",
    tipo: "opcao",
    title: "Preparado para proteger e diminuir a chance de que alguém seja acertado. Iniciante: +2 na Defesa. Veterano: +3 na Defesa e +1 em testes de resistência. Mestre: +3 na Defesa e +2 em testes de resistência. — PASSIVO.",
    opcoes: [
      { id: "iniciante", label: "Iniciante", title: "+2 na Defesa." },
      { id: "veterano", label: "Veterano", title: "+3 na Defesa e +1 em TR." },
      { id: "mestre", label: "Mestre", title: "+3 na Defesa e +2 em TR." },
    ],
  },
  {
    id: "aliados_assassino",
    label: "Aliado · Assassino",
    tipo: "opcao",
    title: "Foca em furtividade e letalidade. Permite utilizar o Ataque Furtivo com 1d6; se já possuir a habilidade, é cumulativo. Veterano: além disso, benefícios de flanco contra inimigo adjacente (de mesa). Mestre: o Ataque Furtivo passa a 2d6. — Ligue 'Golpe da rodada' no ataque que o furtivo acertou.",
    opcoes: [
      { id: "iniciante", label: "Iniciante", title: "Ataque Furtivo 1d6." },
      { id: "veterano", label: "Veterano", title: "Ataque Furtivo 1d6 + flanco contra adjacente (de mesa)." },
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
    label: "Aliado · Combatente",
    tipo: "opcao",
    title: "Armado e preparado para o combate corpo-a-corpo. Uma vez por rodada, dano adicional numa criatura em que você acerte um ataque corpo-a-corpo: Iniciante 1d8, Veterano 2d10, Mestre 3d12. Dano físico à escolha, Após Ataque. — Ligue 'Golpe da rodada' no ataque.",
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
    label: "Aliado · Disparador",
    tipo: "opcao",
    title: "Especializado em combate a distância. Uma vez por rodada, dano adicional numa criatura em que você acerte um ataque a distância: Iniciante 1d8, Veterano 2d10, Mestre 3d12. Dano físico à escolha, Após Ataque. — Ligue 'Golpe da rodada' no ataque.",
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
    label: "Aliado · Elementalista",
    tipo: "opcao",
    title: "Versado em técnicas com elementos. Uma vez por rodada, gaste PE/estamina (de mesa) para dano adicional num alvo a até 9 m em que acerte um Feitiço ou técnica marcial: Iniciante 1 PE → 1d10, Veterano 3 PE → 3d10, Mestre 4 PE → 5d12. Tipo elemental à escolha. Após Ataque; com vários ataques, só no primeiro. — Ligue 'Golpe da rodada'.",
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
    label: "Aliado · Auxiliar",
    tipo: "opcao",
    title: "Foco em auxiliar em todas as perícias. Iniciante: +2 em DUAS perícias. Veterano: +2 em TRÊS. Mestre: +2 em QUATRO. — Marque as perícias em 'Auxiliar · Perícias', respeitando o limite da graduação.",
    opcoes: [
      { id: "iniciante", label: "Iniciante", title: "+2 em 2 perícias à escolha." },
      { id: "veterano", label: "Veterano", title: "+2 em 3 perícias à escolha." },
      { id: "mestre", label: "Mestre", title: "+2 em 4 perícias à escolha." },
    ],
  },
  {
    id: "aliados_auxiliar_pericias",
    label: "Aliado · Auxiliar · Perícias (+2)",
    tipo: "multi",
    requerEstado: "aliados_auxiliar",
    maxSelecionados: 4,
    title: "As perícias que o Auxiliar reforça em +2. Marque 2 (Iniciante), 3 (Veterano) ou 4 (Mestre) — o motor não checa a graduação, respeite o limite.",
    opcoes: PERICIAS_IDS.map((id) => ({ id, label: PERICIA_LABEL[id] })),
  },
  {
    id: "aliados_medico",
    label: "Aliado · Médico (referência)",
    tipo: "opcao",
    title: "Uma vez por rodada, como Ação Bônus, gaste PE/estamina para se curar ou curar criatura adjacente: Iniciante 1 PE → 2d6+4, Veterano 3 PE → 3d10+8 (ou remover condição prejudicial de nível forte ou inferior), Mestre 5 PE → 5d10+12. — REFERÊNCIA: cura rolada na mesa, o motor não aplica.",
    opcoes: [
      { id: "iniciante", label: "Iniciante", title: "1 PE → 2d6+4 de cura." },
      { id: "veterano", label: "Veterano", title: "3 PE → 3d10+8 de cura ou remover 1 condição forte-." },
      { id: "mestre", label: "Mestre", title: "5 PE → 5d10+12 de cura." },
    ],
  },
];

/* Dano por dado NOMEADO (ver `dadosNomeados` em afty-efeitos.js): cada golpe
   da rodada soma um dado de TAMANHO PRÓPRIO na linha, em vez da MÉDIA
   embutida no `danoBonus` (o mesmo bug corrigido no core em 2026-08-31 para
   Execução Silenciosa/Ataque Furtivo — "1d6 aparecendo como +6"). */
const golpeDados = (golpeVar, graduacaoVar, dado, qtd) => ({
  canal: "dadosNomeados", alvo: dado, duracao: "temporaria",
  quando: `${golpeVar} && ${graduacaoVar}`,
  expr: String(qtd),
});

export const RECURSO_BUFF_ALIADOS = {
  id: "aliados_bancada",
  nome: "Aliado (bancada)",
  descricao: "Bônus do aliado conforme os controles da bancada. Só vale com 'Em Combate' ligado.",
  efeitos: [
    {
      canal: "defesa", duracao: "temporaria",
      expr: "2*aliados_protetor_iniciante + 3*aliados_protetor_veterano + 3*aliados_protetor_mestre",
    },
    {
      canal: "bonusTR", duracao: "temporaria",
      expr: "aliados_protetor_veterano + 2*aliados_protetor_mestre",
    },
    {
      canal: "bonusAcerto", duracao: "temporaria",
      expr: "aliados_analista_veterano + 2*aliados_analista_mestre",
    },
    {
      canal: "danoBonus", duracao: "temporaria",
      expr: "2*aliados_analista_iniciante + 3*aliados_analista_veterano + 4*aliados_analista_mestre",
    },
    // Assassino: 1d6 (Iniciante/Veterano) ou 2d6 (Mestre).
    golpeDados("aliados_golpe_assassino", "aliados_assassino_iniciante", "d6", 1),
    golpeDados("aliados_golpe_assassino", "aliados_assassino_veterano", "d6", 1),
    golpeDados("aliados_golpe_assassino", "aliados_assassino_mestre", "d6", 2),
    // Combatente: 1d8 / 2d10 / 3d12.
    golpeDados("aliados_golpe_combatente", "aliados_combatente_iniciante", "d8", 1),
    golpeDados("aliados_golpe_combatente", "aliados_combatente_veterano", "d10", 2),
    golpeDados("aliados_golpe_combatente", "aliados_combatente_mestre", "d12", 3),
    // Disparador: 1d8 / 2d10 / 3d12.
    golpeDados("aliados_golpe_disparador", "aliados_disparador_iniciante", "d8", 1),
    golpeDados("aliados_golpe_disparador", "aliados_disparador_veterano", "d10", 2),
    golpeDados("aliados_golpe_disparador", "aliados_disparador_mestre", "d12", 3),
    // Elementalista: 1d10 / 3d10 / 5d12.
    golpeDados("aliados_golpe_elementalista", "aliados_elementalista_iniciante", "d10", 1),
    golpeDados("aliados_golpe_elementalista", "aliados_elementalista_veterano", "d10", 3),
    golpeDados("aliados_golpe_elementalista", "aliados_elementalista_mestre", "d12", 5),
    ...PERICIAS_IDS.map((id) => ({
      canal: "bonusPericia", alvo: id, duracao: "temporaria",
      expr: `2 * aliados_auxiliar * aliados_auxiliar_pericias_${id}`,
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
    title: "As refeições das Ferramentas de Cozinheiro que ESTA criatura consumiu. Produzir cada uma exige Ofício (Cozinheiro) CD 15 (+5 por benefício adicional). Duram até o próximo descanso longo. Ligue 'Em Combate' na bancada para os efeitos entrarem. Informe também o Nível de Maestria do cozinheiro (vale para todas as refeições).",
    opcoes: [
      { id: "energetica", label: "Energética", title: "Concede energia amaldiçoada temporária igual ao Nível de Maestria do cozinheiro. — Ligado pelo motor." },
      { id: "leve", label: "Leve", title: "Aumento no Deslocamento de 3 m por Nível de Maestria do cozinheiro. — Ligado pelo motor." },
      { id: "nutritiva", label: "Nutritiva", title: "+2 em um número de Testes de Resistência igual à metade do Nível de Maestria do cozinheiro. — REFERÊNCIA: é limitada por número de usos, o motor não aplica; controle na mesa." },
      { id: "picante", label: "Picante", title: "+2 em jogadas de ataque. — Ligado pelo motor." },
      { id: "reforcada", label: "Reforçada", title: "+2 na Defesa. — Ligado pelo motor." },
      { id: "refrescante", label: "Refrescante", title: "Permite realizar um teste com vantagem; depois disso o benefício se encerra. — REFERÊNCIA: vantagem pontual, aplicada na mesa." },
      { id: "revigorante", label: "Revigorante", title: "5 pontos de vida temporários por Nível de Maestria do cozinheiro. — Ligado pelo motor." },
    ],
  },
  /* ⚠ O "Grau do cozinheiro" (quarto/terceiro/.../especial) foi retirado em
     2026-09-13, a pedido do autor: um seletor a menos na bancada, e Leve /
     Revigorante passam a escalar só com este Nível de Maestria (mesma
     variável que já alimentava a Energética), em vez de uma tabela de 5
     graus. Simplifica o clique e o cálculo. */
  {
    id: "comidas_bt",
    label: "Comidas · Nível de Maestria do cozinheiro",
    tipo: "faixa",
    requerEstado: "comidas_refeicoes",
    min: 0,
    max: 10,
    passo: 1,
    title: "Nível de Maestria (Bônus de Treinamento) do cozinheiro. Energética concede este valor em PE temporário na cena; Leve soma 3 m de Deslocamento por ponto; Revigorante soma 5 PV temporários por ponto. (A Nutritiva usa a metade disto como número de TRs, controlado na mesa.)",
  },
];

export const RECURSO_BUFF_COMIDAS = {
  id: "comidas_bancada",
  nome: "Comidas (bancada)",
  descricao: "Bônus das refeições conforme os controles da bancada. Só vale com 'Em Combate' ligado.",
  efeitos: [
    { canal: "defesa", duracao: "temporaria", expr: "2 * comidas_refeicoes_reforcada" },
    { canal: "bonusAcerto", duracao: "temporaria", expr: "2 * comidas_refeicoes_picante" },
    // 3 m / 5 PV por ponto de Nível de Maestria, no lugar da tabela de 5
    // graus (retirada em 2026-09-13 — ver o aviso em ESTADOS_COMIDAS).
    {
      canal: "movimento", duracao: "temporaria",
      expr: "comidas_refeicoes_leve * 3 * comidas_bt",
    },
    {
      canal: "pvTemporario", duracao: "temporaria",
      expr: "comidas_refeicoes_revigorante * 5 * comidas_bt",
    },
    {
      canal: "peTemporario", alvo: "combate", duracao: "temporaria",
      expr: "comidas_refeicoes_energetica * comidas_bt",
    },
  ],
};

/** Controles nativos da bancada, usados como estadosExtras. */
export const ESTADOS_NATIVOS_EXTRAS = [...ESTADOS_ALIADOS, ...ESTADOS_ALMA, ...ESTADOS_COMIDAS];

/** Recursos exibidos na área de Buffs, sem integrar Funcionamento Básico. */
export const RECURSOS_BUFF_NATIVOS = [RECURSO_BUFF_ALIADOS, RECURSO_BUFF_ALMA, RECURSO_BUFF_COMIDAS];
