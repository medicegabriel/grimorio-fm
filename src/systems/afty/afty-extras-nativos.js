/**
 * ============================================================
 * EXTRAS NATIVOS DA BANCADA — Aliados, Alma e Comidas
 * ============================================================
 * Três controles que TODA criatura tem disponível, sem precisar instalar
 * addon nenhum: o aliado que acompanha, as refeições das Ferramentas de
 * Cozinheiro, e a penalidade automática dos Estados da Alma. Nasceram como
 * addons (Templas) e foram trazidos para o núcleo do sistema em 2026-09-12.
 *
 * ⚠ POR QUE NÃO ENTRAM EM `COMBATE_ESTADOS` (afty-combate.js): aquele
 * catálogo exige um DONO — `requerHabilidade`/`requerTalento`/`requerAptidao`/
 * `requerEscolha` — porque cada linha representa algo que a CRIATURA tem. Os
 * três controles daqui representam coisas de FORA da criatura (um
 * companheiro, uma refeição, o estado da própria alma), então não têm esse
 * portão natural — exatamente a mesma razão pela qual os estados de addon
 * entram por `estadosExtras` em vez do catálogo (ver o comentário em
 * AftyCreatureBuilder.jsx, `SimulacaoCombateCard`). Aqui é o mesmo mecanismo,
 * só que embutido no código em vez de vir de um pacote instalável.
 *
 * Cada id já sai com o prefixo (`aliados_`, `comidas_`, `alma_`) embutido,
 * então a variável do DSL (`varDoEstado`/`normalizarVariavel`) bate
 * exatamente com o que os addons antigos produziam via `comPrefixo` — as
 * fórmulas puderam ser portadas sem reescrever nome de variável nenhuma.
 *
 * ⚠ `funcionamentosDaFicha` (afty-schema.js) NÃO importa este arquivo: ele é
 * uma FOLHA travada por asserts/t-ordem-modulos.mjs (zero imports, carrega
 * sozinho — é o que evitou a tela branca de 2026-09-02). Por isso os três
 * `funcionamentos` nativos entram por FORA, através de
 * `funcionamentosComNativos` abaixo, que cada consumidor real chama no lugar
 * da função crua: `efeitosDaTecnica` (afty-efeitos.js, onde o bônus realmente
 * se aplica) e as três telas que listam Funcionamentos Básicos
 * (AftyCreatureBuilder.jsx, AftyFicha.jsx, PainelDeCombatente.jsx).
 */
import { funcionamentosDaFicha } from "./afty-schema";

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

export const FUNCIONAMENTO_ALIADOS = {
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

export const FUNCIONAMENTO_ALMA = {
  id: "alma_estados_automatico",
  nome: "Estados da Alma (automático)",
  descricao: "-3/-6/-8 em Perícia, Teste de Resistência e Acerto conforme a Integridade da Alma corrente cai abaixo de 75% / 50% / 25%. Lê alma_atual direto — não precisa de interruptor, e vale dentro e fora de combate.",
  efeitos: [
    {
      canal: "bonusPericia", duracao: "temporaria",
      expr: "-8*(alma_atual < 25) - 6*(alma_atual >= 25 && alma_atual < 50) - 3*(alma_atual >= 50 && alma_atual < 75)",
    },
    {
      canal: "bonusTR", duracao: "temporaria",
      expr: "-8*(alma_atual < 25) - 6*(alma_atual >= 25 && alma_atual < 50) - 3*(alma_atual >= 50 && alma_atual < 75)",
    },
    {
      canal: "bonusAcerto", duracao: "temporaria",
      expr: "-8*(alma_atual < 25) - 6*(alma_atual >= 25 && alma_atual < 50) - 3*(alma_atual >= 50 && alma_atual < 75)",
    },
  ],
};

/* ============================================================ */
/* COMIDAS — Ferramentas de Cozinheiro                           */
/* ============================================================ */
export const ESTADOS_COMIDAS = [
  {
    id: "comidas_refeicoes",
    label: "Refeições consumidas",
    tipo: "multi",
    maxSelecionados: 7,
    title: "As refeições das Ferramentas de Cozinheiro que ESTA criatura consumiu. Produzir cada uma exige Ofício (Cozinheiro) CD 15 (+5 por benefício adicional). Duram até o próximo descanso longo. ⚠ Ligue 'Em Combate' na bancada para os efeitos entrarem. Escolha também o Grau do cozinheiro (vale para todas as refeições).",
    opcoes: [
      { id: "energetica", label: "Energética", title: "Concede energia amaldiçoada temporária igual ao Bônus de Treinamento do cozinheiro. — Ligado pelo motor (informe o BT do cozinheiro)." },
      { id: "leve", label: "Leve", title: "Aumento no Deslocamento de 3 m para cada grau do cozinheiro: 3 (quarto), 6 (terceiro), 9 (segundo), 12 (primeiro), 15 (especial). — Ligado pelo motor (informe o Grau)." },
      { id: "nutritiva", label: "Nutritiva", title: "+2 em um número de Testes de Resistência igual à metade do Bônus de Treinamento do cozinheiro. — REFERÊNCIA: é limitada por número de usos, o motor não aplica; controle na mesa." },
      { id: "picante", label: "Picante", title: "+2 em jogadas de ataque. — Ligado pelo motor." },
      { id: "reforcada", label: "Reforçada", title: "+2 na Defesa. — Ligado pelo motor." },
      { id: "refrescante", label: "Refrescante", title: "Permite realizar um teste com vantagem; depois disso o benefício se encerra. — REFERÊNCIA: vantagem pontual, aplicada na mesa." },
      { id: "revigorante", label: "Revigorante", title: "5 pontos de vida temporários para cada grau do cozinheiro: 5 (quarto), 10 (terceiro), 15 (segundo), 20 (primeiro), 25 (especial). — Ligado pelo motor (informe o Grau)." },
    ],
  },
  {
    id: "comidas_grau",
    label: "Comidas · Grau do cozinheiro",
    tipo: "opcao",
    requerEstado: "comidas_refeicoes",
    title: "O grau do cozinheiro que preparou as refeições. Vale para TODAS. Usado pela Leve (Deslocamento) e pela Revigorante (PV temporário).",
    opcoes: [
      { id: "quarto", label: "4º", title: "Quarto grau. Leve: +3 m. Revigorante: 5 PV temporários." },
      { id: "terceiro", label: "3º", title: "Terceiro grau. Leve: +6 m. Revigorante: 10 PV temporários." },
      { id: "segundo", label: "2º", title: "Segundo grau. Leve: +9 m. Revigorante: 15 PV temporários." },
      { id: "primeiro", label: "1º", title: "Primeiro grau. Leve: +12 m. Revigorante: 20 PV temporários." },
      { id: "especial", label: "Especial", title: "Grau especial. Leve: +15 m. Revigorante: 25 PV temporários." },
    ],
  },
  {
    id: "comidas_bt",
    label: "Comidas · Bônus de Treino do cozinheiro",
    tipo: "faixa",
    requerEstado: "comidas_refeicoes",
    min: 0,
    max: 10,
    passo: 1,
    title: "Bônus de Treinamento do cozinheiro. A refeição Energética concede este valor em PE temporário na cena. (A Nutritiva usa a metade disto como número de TRs, controlado na mesa.)",
  },
];

export const FUNCIONAMENTO_COMIDAS = {
  id: "comidas_bancada",
  nome: "Comidas (bancada)",
  descricao: "Bônus das refeições conforme os controles da bancada. Só vale com 'Em Combate' ligado.",
  efeitos: [
    { canal: "defesa", duracao: "temporaria", expr: "2 * comidas_refeicoes_reforcada" },
    { canal: "bonusAcerto", duracao: "temporaria", expr: "2 * comidas_refeicoes_picante" },
    {
      canal: "movimento", duracao: "temporaria",
      expr: "comidas_refeicoes_leve * (3*comidas_grau_quarto + 6*comidas_grau_terceiro + 9*comidas_grau_segundo + 12*comidas_grau_primeiro + 15*comidas_grau_especial)",
    },
    {
      canal: "pvTemporario", duracao: "temporaria",
      expr: "comidas_refeicoes_revigorante * (5*comidas_grau_quarto + 10*comidas_grau_terceiro + 15*comidas_grau_segundo + 20*comidas_grau_primeiro + 25*comidas_grau_especial)",
    },
    {
      canal: "peTemporario", alvo: "combate", duracao: "temporaria",
      expr: "comidas_refeicoes_energetica * comidas_bt",
    },
  ],
};

/** Concatenação pronta para entrar em `estadosExtras` no deriveAfty. */
export const ESTADOS_NATIVOS_EXTRAS = [...ESTADOS_ALIADOS, ...ESTADOS_ALMA, ...ESTADOS_COMIDAS];

/** Concatenação pronta para entrar em `funcionamentosDaFicha`, com `nativo: true`
 * (mesma renderização somente-leitura do `deAddon`, sem chamar de addon). */
export const FUNCIONAMENTOS_NATIVOS = [FUNCIONAMENTO_ALIADOS, FUNCIONAMENTO_ALMA, FUNCIONAMENTO_COMIDAS]
  .map((f) => ({ ...f, principal: false, nativo: true }));

/**
 * `funcionamentosDaFicha` + os 3 nativos. É esta função que todo consumidor
 * REAL deve chamar (não a crua de afty-schema.js) — ver o aviso no topo do
 * arquivo sobre por que os dois não se fundem lá dentro.
 */
export function funcionamentosComNativos(creature) {
  return [...funcionamentosDaFicha(creature), ...FUNCIONAMENTOS_NATIVOS];
}
