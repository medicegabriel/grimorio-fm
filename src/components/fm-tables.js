/**
 * ============================================================
 * TABELAS DE CÁLCULO - F&M 2.5 GRIMÓRIO
 * ============================================================
 * Arquitetura: dicionários mapeados em vez de if/else.
 * Todas as fórmulas do PDF convertidas para lookup O(1).
 * ============================================================
 */

// ---------- BÔNUS DE TREINAMENTO POR ND ----------
export const getBonusTreinamento = (nd) => {
  if (nd >= 17) return 6;
  if (nd >= 13) return 5;
  if (nd >= 9)  return 4;
  if (nd >= 5)  return 3;
  return 2;
};

// ---------- LIMITES DE ND POR PATAMAR ----------
export const PATAMAR_ND_RANGE = {
  lacaio:     { min: 1, max: 10 },
  capanga:    { min: 1, max: 20 },
  comum:      { min: 1, max: 20 },
  desafio:    { min: 3, max: 20 },
  calamidade: { min: 5, max: 30 },
};

// ---------- DESLOCAMENTO POR TAMANHO ----------
export const TAMANHO_INFO = {
  minusculo: { deslocamento: 9,    espaco: 1.5, manobra: -5, furtividade: 5 },
  pequeno:   { deslocamento: 9,    espaco: 1.5, manobra: -2, furtividade: 2 },
  medio:     { deslocamento: 9,    espaco: 1.5, manobra: 0,  furtividade: 0 },
  grande:    { deslocamento: 12,   espaco: 3,   manobra: 2,  furtividade: -2 },
  enorme:    { deslocamento: 13.5, espaco: 4.5, manobra: 5,  furtividade: -5 },
  colossal:  { deslocamento: 18,   espaco: 9,   manobra: 10, furtividade: -10 },
};

// ---------- MULTIPLICADOR DE DESLOCAMENTO POR ND ----------
export const getDeslocamentoMultiplier = (nd, patamar) => {
  if (patamar === "lacaio") return 1;
  if (nd >= 17) return 3;
  if (nd >= 9)  return 2;
  if (nd >= 5)  return 1.5;
  return 1;
};

// ---------- PONTOS PARA DISTRIBUIR EM ATRIBUTOS ----------
// Calamidade: fórmula vale até ND 24 (=85). PDF impõe platô em 85 nas NDs 25-29 e 90 em ND 30.
export const getAttributePoints = (patamar, nd, bt) => {
  const table = {
    lacaio:     () => 20 + nd,
    capanga:    () => 20 + nd,
    comum:      () => 20 + nd + bt,
    desafio:    () => 25 + (2 * nd) + (2 * bt),
    calamidade: () => 25 + (2 * nd) + (2 * bt),
  };
  return table[patamar]?.() ?? 0;
};

export const ATTRIBUTE_LIMIT = {
  lacaio: 20, capanga: 24, comum: 26, desafio: 30, calamidade: 32,
};

// ============================================================
//                    PONTOS DE VIDA (HP)
// ============================================================
// Fórmula geral: valor base(ND) + (Constituição * multiplicador)
// Retorna função para passar a CON dinamicamente.

// Lacaio: HP = 10 + (Valor de Constituição × 2)  — valor bruto, não modificador (PDF p.23)
const HP_LACAIO = (nd, con) => 10 + (con * 2);

const HP_CAPANGA_BASE = {
  1: 40, 2: 80, 3: 120, 4: 160, 5: 200, 6: 240, 7: 280, 8: 320,
  9: 360, 10: 400, 11: 440, 12: 480, 13: 520, 14: 560, 15: 600,
  16: 640, 17: 680, 18: 720, 19: 760, 20: 800,
};
const HP_CAPANGA_MULT = (nd) => (nd <= 4 ? 2 : nd <= 8 ? 3 : nd <= 12 ? 4 : nd <= 16 ? 5 : 6);

const HP_COMUM_BASE = {
  1: 60, 2: 120, 3: 180, 4: 240, 5: 300, 6: 360, 7: 420, 8: 480,
  9: 540, 10: 600, 11: 660, 12: 720, 13: 780, 14: 840, 15: 900,
  16: 960, 17: 1020, 18: 1080, 19: 1140, 20: 1200,
};
const HP_COMUM_MULT = HP_CAPANGA_MULT;

const HP_DESAFIO_BASE = {
  3: 270, 4: 360, 5: 450, 6: 540, 7: 630, 8: 720, 9: 810, 10: 900,
  11: 990, 12: 1080, 13: 1170, 14: 1260, 15: 1350, 16: 1440,
  17: 1530, 18: 1620, 19: 1710, 20: 1900,
};
const HP_DESAFIO_MULT = HP_CAPANGA_MULT;

const HP_CALAMIDADE_BASE = {
  5: 900, 6: 1080, 7: 1260, 8: 1440, 9: 1620, 10: 1800, 11: 1980,
  12: 2160, 13: 2340, 14: 2520, 15: 2700, 16: 2880, 17: 3060,
  18: 3240, 19: 3420, 20: 3600, 21: 3780, 22: 3960, 23: 4140,
  24: 4320, 25: 4500, 26: 4680, 27: 4860, 28: 5040, 29: 5220, 30: 5400,
};

export const calculateHP = (patamar, nd, constituicao) => {
  const calc = {
    lacaio:     () => HP_LACAIO(nd, constituicao),
    capanga:    () => (HP_CAPANGA_BASE[nd] || 0) + (constituicao * HP_CAPANGA_MULT(nd)),
    comum:      () => (HP_COMUM_BASE[nd]    || 0) + (constituicao * HP_COMUM_MULT(nd)),
    desafio:    () => (HP_DESAFIO_BASE[nd]  || 0) + (constituicao * HP_DESAFIO_MULT(nd)),
    calamidade: () => (HP_CALAMIDADE_BASE[nd] || 0) + (constituicao * 3),
  };
  return calc[patamar]?.() ?? 0;
};

// ============================================================
//                  PONTOS DE ENERGIA (PE)
// ============================================================
export const PE_TABLE = {
  capanga:    (nd) => nd <= 20 ? nd : 0,
  comum:      (nd) => nd <= 20 ? nd * 2 : 0,
  desafio:    (nd) => (nd >= 3 && nd <= 20) ? nd * 3 : 0,
  calamidade: (nd) => (nd >= 5 && nd <= 30) ? nd * 3 : 0,
  lacaio:     () => 0,
};
export const calculatePE = (patamar, nd) => PE_TABLE[patamar]?.(nd) ?? 0;

// ============================================================
//           REDUÇÕES DE DANO E VIDA TEMPORÁRIA
// ============================================================
export const RD_GERAL = {
  capanga: {
    1:0,2:0,3:0,4:0,5:6,6:7,7:8,8:9,9:10,10:11,
    11:12,12:13,13:14,14:15,15:16,16:17,17:18,18:19,19:20,20:21,
  },
  comum: {
    1:0,2:0,3:0,4:0,5:8,6:9,7:10,8:11,9:12,10:13,
    11:14,12:15,13:16,14:17,15:18,16:19,17:20,18:21,19:22,20:23,
  },
  desafio: {
    3:0,4:0,5:0,6:4,7:5,8:6,9:7,10:10,11:10,12:10,
    13:10,14:11,15:12,16:13,17:20,18:20,19:20,20:20,
  },
  calamidade: {
    5:0,6:4,7:5,8:6,9:7,10:10,11:10,12:10,13:10,14:11,15:12,
    16:13,17:20,18:20,19:20,20:20,21:25,22:25,23:25,24:25,25:30,
    26:30,27:30,28:30,29:30,30:50,
  },
};

export const RD_IRREDUTIVEL = {
  comum: {
    5:2,6:3,7:3,8:4,9:4,10:5,11:5,12:6,13:6,14:7,
    15:7,16:8,17:8,18:9,19:9,20:10,
  },
  desafio: {
    9:5,10:6,11:7,12:8,13:9,14:10,15:11,16:12,17:15,18:15,19:16,20:18,
  },
  calamidade: {
    11:5,12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:15,20:15,
    21:16,22:18,23:22,24:26,25:30,26:34,27:36,28:38,29:40,30:40,
  },
};

export const IGNORAR_RD = {
  capanga: {
    5:1,6:1,7:1,8:1,9:2,10:2,11:2,12:2,13:3,14:3,15:3,16:3,17:4,18:4,19:4,20:4,
  },
  comum: {
    9:4,10:4,11:4,12:4,13:6,14:6,15:6,16:6,17:12,18:12,19:12,20:12,
  },
  desafio: {
    9:4,10:4,11:4,12:4,13:10,14:10,15:10,16:10,17:15,18:15,19:15,20:15,
  },
  calamidade: {
    9:4,10:4,11:4,12:4,13:10,14:10,15:10,16:10,17:15,18:15,19:15,20:15,
    21:15,22:15,23:20,24:20,25:25,26:25,27:25,28:25,29:30,30:30,
  },
};

export const VIDA_TEMP_ATAQUE = {
  capanga:    { 6:3,7:3,8:3,9:4,10:4,11:4,12:4,13:5,14:5,15:5,16:5,17:6,18:6,19:6,20:6 },
  comum:      { 5:3,6:3,7:3,8:3,9:4,10:4,11:4,12:4,13:5,14:5,15:5,16:5,17:6,18:6,19:6,20:6 },
  desafio:    { 6:5,7:5,8:5,9:5,10:6,11:6,12:6,13:8,14:8,15:8,16:8,17:10,18:10,19:10,20:10 },
  calamidade: {
    8:5,9:5,10:5,11:5,12:6,13:6,14:6,15:8,16:8,17:8,18:8,19:10,20:10,
    21:10,22:10,23:10,24:10,25:15,26:15,27:15,28:15,29:15,30:15,
  },
};

// ============================================================
//      DEFESA, ACERTO, TR, CD, PERÍCIAS  —  TABELAS OFICIAIS
// ============================================================
// Tabelas extraídas do livro de regras (PDF pp.23-51). Cada patamar
// tem sua própria tabela por (ND, dificuldade). Lacaio e Capanga
// não têm distinção por dificuldade — valor único por ND.
//
// Convenção: { I: iniciante, M: intermediário, E: experiente }.
// Todos os valores ARMAZENADOS são a "parte base" — o modificador
// (Dex, Atributo, Técnica) é somado pelas funções de cálculo.
// ============================================================

const DIFF_KEY = { iniciante: "I", intermediario: "M", experiente: "E" };

// ---------- DEFESA  (PDF pp.24, 27, 33, 41, 49) ----------
// Lacaio/Capanga: 10 (sem dificuldade). Demais: tabela por ND × dif.
const DEFESA = {
  comum: {
    1:{I:11,M:13,E:15},  2:{I:12,M:14,E:16},  3:{I:13,M:15,E:17},  4:{I:14,M:16,E:18},
    5:{I:15,M:17,E:19},  6:{I:16,M:18,E:20},  7:{I:17,M:19,E:21},  8:{I:18,M:20,E:22},
    9:{I:19,M:21,E:23},  10:{I:20,M:22,E:24}, 11:{I:21,M:23,E:25}, 12:{I:22,M:24,E:26},
    13:{I:23,M:25,E:33}, 14:{I:24,M:26,E:34}, 15:{I:25,M:27,E:35}, 16:{I:26,M:28,E:36},
    17:{I:27,M:29,E:37}, 18:{I:28,M:30,E:38}, 19:{I:29,M:31,E:39}, 20:{I:30,M:32,E:40},
  },
  desafio: {
    3:{I:10,M:18,E:23},  4:{I:11,M:19,E:24},  5:{I:12,M:20,E:25},  6:{I:13,M:21,E:26},
    7:{I:14,M:22,E:27},  8:{I:15,M:23,E:28},  9:{I:16,M:24,E:29},  10:{I:17,M:25,E:30},
    11:{I:20,M:26,E:31}, 12:{I:21,M:27,E:32}, 13:{I:22,M:28,E:33}, 14:{I:23,M:29,E:34},
    15:{I:24,M:30,E:35}, 16:{I:25,M:31,E:36}, 17:{I:27,M:32,E:37}, 18:{I:28,M:33,E:38},
    19:{I:29,M:34,E:39}, 20:{I:30,M:35,E:40},
  },
  calamidade: {
    5:{I:10,M:18,E:23},  6:{I:11,M:19,E:24},  7:{I:12,M:20,E:25},  8:{I:13,M:21,E:26},
    9:{I:14,M:22,E:27},  10:{I:15,M:23,E:28}, 11:{I:16,M:24,E:29}, 12:{I:17,M:25,E:30},
    13:{I:20,M:26,E:31}, 14:{I:21,M:27,E:32}, 15:{I:22,M:28,E:33}, 16:{I:23,M:29,E:34},
    17:{I:24,M:30,E:35}, 18:{I:25,M:31,E:36}, 19:{I:27,M:32,E:37}, 20:{I:28,M:33,E:38},
    21:{I:29,M:34,E:39}, 22:{I:30,M:35,E:40}, 23:{I:35,M:40,E:45}, 24:{I:40,M:45,E:50},
    25:{I:45,M:50,E:51}, 26:{I:50,M:51,E:52}, 27:{I:51,M:52,E:53}, 28:{I:52,M:53,E:54},
    29:{I:53,M:54,E:56}, 30:{I:54,M:56,E:58},
  },
};

// ---------- ACERTO  (PDF pp.24, 27, 35, 43, 51) ----------
// Lacaio/Capanga: ND (sem dificuldade). Demais: tabela.
const ACERTO = {
  comum: {
    1:{I:3,M:5,E:8},     2:{I:4,M:6,E:9},     3:{I:5,M:8,E:10},    4:{I:6,M:9,E:11},
    5:{I:8,M:10,E:14},   6:{I:9,M:11,E:15},   7:{I:10,M:13,E:16},  8:{I:11,M:14,E:17},
    9:{I:13,M:15,E:18},  10:{I:14,M:16,E:19}, 11:{I:15,M:17,E:20}, 12:{I:16,M:18,E:21},
    13:{I:18,M:19,E:22}, 14:{I:19,M:20,E:23}, 15:{I:20,M:25,E:29}, 16:{I:21,M:26,E:30},
    17:{I:23,M:28,E:32}, 18:{I:24,M:29,E:33}, 19:{I:25,M:30,E:34}, 20:{I:26,M:31,E:35},
  },
  desafio: {
    3:{I:8,M:12,E:17},   4:{I:9,M:13,E:18},   5:{I:11,M:15,E:20},  6:{I:12,M:16,E:21},
    7:{I:13,M:17,E:22},  8:{I:14,M:18,E:23},  9:{I:16,M:20,E:25},  10:{I:17,M:21,E:26},
    11:{I:18,M:22,E:27}, 12:{I:19,M:23,E:28}, 13:{I:21,M:25,E:30}, 14:{I:22,M:26,E:31},
    15:{I:23,M:27,E:32}, 16:{I:24,M:28,E:33}, 17:{I:26,M:30,E:35}, 18:{I:27,M:31,E:36},
    19:{I:28,M:32,E:37}, 20:{I:29,M:33,E:38},
  },
  calamidade: {
    5:{I:11,M:15,E:20},  6:{I:12,M:16,E:21},  7:{I:13,M:17,E:22},  8:{I:14,M:18,E:23},
    9:{I:16,M:20,E:25},  10:{I:17,M:21,E:26}, 11:{I:18,M:22,E:27}, 12:{I:19,M:23,E:28},
    13:{I:21,M:25,E:30}, 14:{I:22,M:26,E:31}, 15:{I:23,M:27,E:32}, 16:{I:24,M:28,E:33},
    17:{I:26,M:30,E:35}, 18:{I:27,M:31,E:36}, 19:{I:28,M:32,E:37}, 20:{I:29,M:33,E:38},
    21:{I:35,M:36,E:40}, 22:{I:36,M:37,E:42}, 23:{I:37,M:38,E:44}, 24:{I:38,M:39,E:46},
    25:{I:39,M:40,E:48}, 26:{I:40,M:41,E:50}, 27:{I:41,M:42,E:52}, 28:{I:42,M:43,E:54},
    29:{I:43,M:44,E:56}, 30:{I:44,M:45,E:58},
  },
};

// ---------- TR  (PDF pp.24, 27, 34, 42, 50) ----------
// Lacaio/Capanga: ND (sem dificuldade). Demais: tabela. Calamidade ND 23-30 platô em ND22.
const TR = {
  comum: {
    1:{I:2,M:3,E:4},     2:{I:3,M:4,E:5},     3:{I:4,M:5,E:6},     4:{I:5,M:6,E:7},
    5:{I:6,M:8,E:9},     6:{I:7,M:9,E:10},    7:{I:8,M:10,E:11},   8:{I:9,M:11,E:12},
    9:{I:11,M:13,E:15},  10:{I:12,M:14,E:16}, 11:{I:13,M:15,E:17}, 12:{I:14,M:16,E:18},
    13:{I:15,M:18,E:20}, 14:{I:16,M:19,E:21}, 15:{I:17,M:20,E:22}, 16:{I:18,M:21,E:23},
    17:{I:20,M:23,E:26}, 18:{I:21,M:24,E:27}, 19:{I:22,M:25,E:28}, 20:{I:23,M:26,E:29},
  },
  desafio: {
    3:{I:5,M:6,E:7},     4:{I:6,M:7,E:8},     5:{I:8,M:9,E:11},    6:{I:9,M:10,E:12},
    7:{I:10,M:11,E:13},  8:{I:11,M:12,E:14},  9:{I:13,M:16,E:18},  10:{I:14,M:17,E:19},
    11:{I:15,M:18,E:20}, 12:{I:16,M:19,E:21}, 13:{I:18,M:21,E:23}, 14:{I:19,M:22,E:24},
    15:{I:20,M:23,E:25}, 16:{I:21,M:24,E:26}, 17:{I:23,M:26,E:28}, 18:{I:24,M:27,E:29},
    19:{I:25,M:28,E:30}, 20:{I:26,M:29,E:31},
  },
  calamidade: {
    5:{I:5,M:6,E:7},     6:{I:6,M:7,E:8},     7:{I:8,M:9,E:11},    8:{I:9,M:10,E:12},
    9:{I:10,M:11,E:13},  10:{I:11,M:12,E:14}, 11:{I:13,M:16,E:18}, 12:{I:14,M:17,E:19},
    13:{I:15,M:18,E:20}, 14:{I:16,M:19,E:21}, 15:{I:18,M:21,E:23}, 16:{I:19,M:22,E:24},
    17:{I:20,M:23,E:25}, 18:{I:21,M:24,E:26}, 19:{I:23,M:26,E:28}, 20:{I:24,M:27,E:29},
    21:{I:25,M:28,E:30}, 22:{I:26,M:29,E:31}, 23:{I:26,M:29,E:31}, 24:{I:26,M:29,E:31},
    25:{I:26,M:29,E:31}, 26:{I:26,M:29,E:31}, 27:{I:26,M:29,E:31}, 28:{I:26,M:29,E:31},
    29:{I:26,M:29,E:31}, 30:{I:26,M:29,E:31},
  },
};

// ---------- CD  (PDF pp.24, 27, 34, 42, 50) ----------
// Importante: SOMENTE Lacaio/Capanga/Comum dividem mod por 2 no Iniciante.
// Desafio/Calamidade somam mod completo em todas as dificuldades.
const CD = {
  comum: {
    1:{I:1,M:6,E:14},    2:{I:2,M:7,E:15},    3:{I:3,M:8,E:16},    4:{I:4,M:9,E:17},
    5:{I:5,M:10,E:18},   6:{I:6,M:11,E:19},   7:{I:7,M:12,E:20},   8:{I:8,M:13,E:21},
    9:{I:9,M:14,E:22},   10:{I:10,M:15,E:23}, 11:{I:11,M:16,E:24}, 12:{I:12,M:17,E:25},
    13:{I:13,M:18,E:26}, 14:{I:14,M:19,E:27}, 15:{I:15,M:20,E:28}, 16:{I:16,M:21,E:29},
    17:{I:17,M:22,E:30}, 18:{I:18,M:23,E:31}, 19:{I:19,M:24,E:32}, 20:{I:20,M:25,E:33},
  },
  desafio: {
    3:{I:11,M:13,E:15},  4:{I:12,M:14,E:16},  5:{I:13,M:16,E:18},  6:{I:14,M:17,E:19},
    7:{I:15,M:18,E:20},  8:{I:17,M:19,E:21},  9:{I:19,M:19,E:23},  10:{I:19,M:20,E:24},
    11:{I:21,M:23,E:25}, 12:{I:22,M:24,E:26}, 13:{I:23,M:26,E:28}, 14:{I:24,M:27,E:29},
    15:{I:25,M:28,E:30}, 16:{I:26,M:29,E:31}, 17:{I:27,M:31,E:33}, 18:{I:28,M:32,E:34},
    19:{I:29,M:33,E:35}, 20:{I:30,M:34,E:36},
  },
  calamidade: {
    5:{I:11,M:13,E:15},  6:{I:12,M:14,E:16},  7:{I:13,M:16,E:18},  8:{I:14,M:17,E:19},
    9:{I:15,M:18,E:20},  10:{I:17,M:19,E:21}, 11:{I:19,M:19,E:23}, 12:{I:19,M:20,E:24},
    13:{I:21,M:23,E:25}, 14:{I:22,M:24,E:26}, 15:{I:23,M:26,E:28}, 16:{I:24,M:27,E:29},
    17:{I:25,M:28,E:30}, 18:{I:26,M:29,E:31}, 19:{I:27,M:31,E:33}, 20:{I:28,M:32,E:34},
    21:{I:29,M:33,E:35}, 22:{I:30,M:34,E:36}, 23:{I:30,M:34,E:36}, 24:{I:30,M:34,E:36},
    25:{I:30,M:34,E:36}, 26:{I:30,M:34,E:36}, 27:{I:30,M:34,E:36}, 28:{I:30,M:34,E:36},
    29:{I:30,M:34,E:36}, 30:{I:30,M:34,E:36},
  },
};

// ---------- PERÍCIAS  (PDF pp.23, 26, 30, 38, 46) ----------
// Cada patamar tem sua tabela própria de Não Dominadas e Dominadas por ND.
const PERICIAS = {
  lacaio: {
    1:{n:1,d:3},   2:{n:2,d:4},   3:{n:3,d:5},   4:{n:4,d:6},   5:{n:5,d:8},
    6:{n:6,d:9},   7:{n:7,d:10},  8:{n:8,d:11},  9:{n:9,d:13},  10:{n:10,d:14},
  },
  capanga: {
    1:{n:1,d:3},   2:{n:2,d:4},   3:{n:3,d:5},   4:{n:4,d:6},   5:{n:5,d:8},
    6:{n:6,d:9},   7:{n:7,d:10},  8:{n:8,d:11},  9:{n:9,d:13},  10:{n:10,d:14},
    11:{n:11,d:15}, 12:{n:12,d:16}, 13:{n:13,d:18}, 14:{n:14,d:19}, 15:{n:15,d:20},
    16:{n:16,d:21}, 17:{n:17,d:23}, 18:{n:18,d:24}, 19:{n:19,d:25}, 20:{n:20,d:26},
  },
  comum: {
    1:{n:3,d:4},   2:{n:4,d:5},   3:{n:5,d:6},   4:{n:6,d:7},   5:{n:8,d:9},
    6:{n:9,d:10},  7:{n:10,d:11}, 8:{n:11,d:12}, 9:{n:13,d:15}, 10:{n:14,d:16},
    11:{n:15,d:17}, 12:{n:16,d:18}, 13:{n:18,d:20}, 14:{n:19,d:21}, 15:{n:20,d:22},
    16:{n:21,d:23}, 17:{n:23,d:26}, 18:{n:24,d:27}, 19:{n:25,d:28}, 20:{n:26,d:29},
  },
  desafio: {
    3:{n:5,d:7},   4:{n:6,d:8},   5:{n:8,d:11},  6:{n:9,d:12},  7:{n:10,d:13},
    8:{n:11,d:14}, 9:{n:13,d:17}, 10:{n:14,d:18}, 11:{n:15,d:19}, 12:{n:16,d:20},
    13:{n:18,d:23}, 14:{n:19,d:24}, 15:{n:20,d:25}, 16:{n:21,d:26}, 17:{n:23,d:29},
    18:{n:24,d:30}, 19:{n:25,d:31}, 20:{n:26,d:32},
  },
  calamidade: {
    5:{n:5,d:7},   6:{n:6,d:8},   7:{n:8,d:11},  8:{n:9,d:12},  9:{n:10,d:13},
    10:{n:11,d:14}, 11:{n:13,d:17}, 12:{n:14,d:18}, 13:{n:15,d:19}, 14:{n:16,d:20},
    15:{n:18,d:23}, 16:{n:19,d:24}, 17:{n:20,d:25}, 18:{n:21,d:26}, 19:{n:23,d:29},
    20:{n:24,d:30}, 21:{n:26,d:30}, 22:{n:28,d:30}, 23:{n:30,d:30}, 24:{n:34,d:30},
    25:{n:36,d:30}, 26:{n:38,d:30}, 27:{n:40,d:45}, 28:{n:40,d:45}, 29:{n:40,d:45},
    30:{n:40,d:45},
  },
};

// ---------- CALCULADORES (API pública) ----------
// Lacaio e Capanga IGNORAM dificuldade em Defesa/Acerto/TR (PDF tabelas 1-coluna).
// Comum/Desafio/Calamidade usam dificuldade.
const lookupByDiff = (table, patamar, nd, difficulty) => {
  const key = DIFF_KEY[difficulty] ?? "I";
  return table[patamar]?.[nd]?.[key];
};

export const calculateDefesa = (patamar, nd, modDex, difficulty = "iniciante") => {
  if (patamar === "lacaio" || patamar === "capanga") return 10 + modDex;
  const base = lookupByDiff(DEFESA, patamar, nd, difficulty);
  return (base ?? 10) + modDex;
};

export const calculateAcerto = (patamar, nd, modAttr, difficulty = "iniciante") => {
  if (patamar === "lacaio" || patamar === "capanga") return nd + modAttr;
  const base = lookupByDiff(ACERTO, patamar, nd, difficulty);
  return (base ?? nd) + modAttr;
};

export const calculateTR = (nd, modAttr, difficulty = "iniciante", patamar = "comum") => {
  if (patamar === "lacaio" || patamar === "capanga") return nd + modAttr;
  const base = lookupByDiff(TR, patamar, nd, difficulty);
  return (base ?? nd) + modAttr;
};

// CD (Iniciante) divide o modificador por 2 SOMENTE para Lacaio/Capanga/Comum.
// Desafio/Calamidade somam o modificador completo em todas as dificuldades.
export const calculateCD = (nd, modTec, difficulty = "iniciante", patamar = "comum") => {
  const halvesMod = (patamar === "lacaio" || patamar === "capanga" || patamar === "comum")
    && difficulty === "iniciante";
  const modPart = halvesMod ? Math.floor(modTec / 2) : modTec;

  if (patamar === "lacaio" || patamar === "capanga") {
    return nd + modPart;
  }
  const base = lookupByDiff(CD, patamar, nd, difficulty);
  return (base ?? nd) + modPart;
};

export const calculatePericiaComum = (nd, modAttr, patamar = "comum") => {
  const base = PERICIAS[patamar]?.[nd]?.n ?? nd;
  return base + modAttr;
};

export const calculatePericiaDominada = (nd, modAttr, patamar = "comum") => {
  const base = PERICIAS[patamar]?.[nd]?.d ?? (nd + 2);
  return base + modAttr;
};

// Quantidade sugerida de Perícias por (patamar, ND). PDF: "Maior Mod Mental",
// exceto Calamidade ND 20+ que recebe "+5" sobre o maior modificador mental.
export const getSkillsCountBonus = (patamar, nd) =>
  (patamar === "calamidade" && nd >= 20) ? 5 : 0;

// ============================================================
//                        DANO POR AÇÃO
// ============================================================
export const DAMAGE_TABLE = {
  lacaio: {
    1:{avg:3,roll:"1d4+1"}, 2:{avg:3,roll:"1d4+1"}, 3:{avg:6,roll:"1d6+3"},
    4:{avg:7,roll:"2d4+3"}, 5:{avg:17,roll:"2d10+6"}, 6:{avg:20,roll:"2d10+9"},
    7:{avg:23,roll:"2d12+10"}, 8:{avg:26,roll:"3d8+13"},
    9:{avg:29,roll:"3d10+13"}, 10:{avg:32,roll:"4d8+14"},
  },
  capanga: {
    1:{avg:5,roll:"1d2+4"}, 2:{avg:8,roll:"1d4+6"}, 3:{avg:14,roll:"2d6+7"},
    4:{avg:17,roll:"2d8+8"}, 5:{avg:20,roll:"2d10+9"}, 6:{avg:23,roll:"2d10+12"},
    7:{avg:26,roll:"3d8+13"}, 8:{avg:29,roll:"3d10+13"}, 9:{avg:32,roll:"3d10+16"},
    10:{avg:36,roll:"4d8+18"}, 11:{avg:40,roll:"4d10+18"}, 12:{avg:44,roll:"4d12+18"},
    13:{avg:48,roll:"5d8+26"}, 14:{avg:52,roll:"5d8+30"}, 15:{avg:56,roll:"5d8+34"},
    16:{avg:61,roll:"5d10+34"}, 17:{avg:66,roll:"5d10+39"}, 18:{avg:71,roll:"6d10+38"},
    19:{avg:76,roll:"6d10+43"}, 20:{avg:81,roll:"6d12+42"},
  },
  comum: { /* mesma tabela de capanga — conforme PDF pp. 38-39 */ },
  desafio: {
    3:{avg:11,roll:"1d10+6"}, 4:{avg:14,roll:"2d6+7"}, 5:{avg:22,roll:"2d10+11"},
    6:{avg:26,roll:"2d12+13"}, 7:{avg:30,roll:"3d10+14"}, 8:{avg:34,roll:"3d12+15"},
    9:{avg:38,roll:"4d8+20"}, 10:{avg:42,roll:"4d8+24"}, 11:{avg:47,roll:"4d10+25"},
    12:{avg:52,roll:"4d12+26"}, 13:{avg:57,roll:"5d10+30"}, 14:{avg:62,roll:"5d12+30"},
    15:{avg:67,roll:"6d10+34"}, 16:{avg:72,roll:"6d10+39"}, 17:{avg:77,roll:"6d10+44"},
    18:{avg:82,roll:"6d12+43"}, 19:{avg:87,roll:"7d10+49"}, 20:{avg:90,roll:"7d10+52"},
  },
  calamidade: {
    5:{avg:26,roll:"2d12+13"}, 6:{avg:30,roll:"3d10+14"}, 7:{avg:34,roll:"3d12+15"},
    8:{avg:38,roll:"4d8+20"}, 9:{avg:42,roll:"4d8+24"}, 10:{avg:45,roll:"4d10+23"},
    11:{avg:50,roll:"4d12+24"}, 12:{avg:55,roll:"5d10+28"}, 13:{avg:60,roll:"5d10+33"},
    14:{avg:65,roll:"5d12+33"}, 15:{avg:70,roll:"6d10+37"}, 16:{avg:75,roll:"6d12+36"},
    17:{avg:80,roll:"6d12+41"}, 18:{avg:85,roll:"7d10+47"}, 19:{avg:90,roll:"7d10+52"},
    20:{avg:95,roll:"7d12+50"}, 21:{avg:100,roll:"8d10+56"}, 22:{avg:105,roll:"8d10+61"},
    23:{avg:110,roll:"8d12+58"}, 24:{avg:115,roll:"8d12+63"}, 25:{avg:120,roll:"9d10+71"},
    26:{avg:125,roll:"9d10+76"}, 27:{avg:130,roll:"9d12+72"}, 28:{avg:140,roll:"10d12+75"},
    29:{avg:150,roll:"12d10+84"}, 30:{avg:150,roll:"12d10+84"},
  },
};
// Comum usa a mesma tabela do Capanga conforme o PDF
DAMAGE_TABLE.comum = DAMAGE_TABLE.capanga;

export const getDamage = (patamar, nd) => DAMAGE_TABLE[patamar]?.[nd] ?? null;

// ============================================================
//                  AÇÕES POR TURNO / COMBATE
// ============================================================
export const calculateActions = (patamar, nd) => {
  const table = {
    lacaio:  () => ({ comum:1, bonus:1, rapida:0, movimento:1, reacao:1 }),
    capanga: () => ({ comum:1, bonus:1, rapida:0, movimento:1, reacao:1 }),
    comum: () => ({
      comum: 1 + Math.floor(nd / 5),
      rapida: 1 + Math.floor(nd / 10),
      bonus: 1, movimento: 1, reacao: 1,
    }),
    desafio: () => ({
      comum: 2 + Math.floor(nd / 8),
      rapida: 1 + Math.floor(nd / 8),
      bonus: 1, movimento: 1, reacao: 1,
    }),
    calamidade: () => ({
      comum: 3 + Math.floor(nd / 10),
      rapida: 1 + Math.floor(nd / 10),
      bonus: 1, movimento: 1, reacao: 1,
    }),
  };
  return table[patamar]?.() ?? { comum:1, bonus:0, rapida:0, movimento:1, reacao:1 };
};

// ============================================================
//             GUARDA INABALÁVEL E RESISTÊNCIAS
// ============================================================
export const calculateGuardaInabavel = (patamar, nd) => {
  if (patamar === "comum")   return nd * 2;
  if (patamar === "desafio") return nd * 3;
  if (patamar === "calamidade") {
    const map = {
      5:9,6:12,7:15,8:18,9:21,10:24,11:27,12:30,13:33,14:36,15:39,16:42,
      17:45,18:48,19:51,20:54,21:57,22:60,23:66,24:72,25:80,
      26:86,27:92,28:98,29:100,30:110,
    };
    return map[nd] ?? 0;
  }
  return 0;
};

export const calculateResistenciaParcial = (patamar, nd) => {
  if (patamar === "comum")      return 2 + Math.floor(nd / 10);
  if (patamar === "desafio")    return 2 + Math.floor(nd / 5);
  if (patamar === "calamidade") return 2 + Math.floor(nd / 5);
  return 0;
};

export const calculateResistenciaTotal = (patamar, nd) => {
  if (patamar === "comum")      return 2 + Math.floor(nd / 15);
  if (patamar === "desafio")    return 2 + Math.floor(nd / 10);
  if (patamar === "calamidade") return 2 + Math.floor(nd / 10);
  return 0;
};

// ============================================================
//                     UTILITÁRIOS
// ============================================================
export const getModifier = (attrValue) => Math.floor((attrValue - 10) / 2);

export const CONDITIONS = {
  fracas: ["abalado","caido","desarmar","desorientado","desprevenido","empurrar","sangramento","sofrendo"],
  medias: ["agarrado","amedrontado","condenado","confuso","enfeiticado","engasgando","enjoado","enredado","envenenado","lento","surdo"],
  fortes: ["aterrorizado","cego","exposto","imovel","invisivel","surpreso"],
  extremas: ["atordoado","desmembramento","fragilizado","fragmentado","inconsciente","paralisado"],
};

export const PATAMAR_LABELS = {
  lacaio: "Lacaio",
  capanga: "Capanga",
  comum: "Comum",
  desafio: "Desafio",
  calamidade: "Calamidade",
};

export const DIFFICULTY_LABELS = {
  iniciante: "Iniciante",
  intermediario: "Intermediário",
  experiente: "Experiente",
};
