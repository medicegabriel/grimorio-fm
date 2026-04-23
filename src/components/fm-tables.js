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
export const getAttributePoints = (patamar, nd, bt) => {
  const table = {
    lacaio:     () => 20 + nd,
    capanga:    () => 20 + nd,
    comum:      () => 20 + nd,
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
  comum:      { 6:3,7:3,8:3,9:4,10:4,11:4,12:4,13:5,14:5,15:5,16:5,17:6,18:6,19:6,20:6 },
  desafio:    { 6:5,7:5,8:5,9:5,10:6,11:6,12:6,13:8,14:8,15:8,16:8,17:10,18:10,19:10,20:10 },
  calamidade: {
    8:5,9:5,10:5,11:5,12:6,13:6,14:6,15:8,16:8,17:8,18:8,19:10,20:10,
    21:10,22:10,23:10,24:10,25:15,26:15,27:15,28:15,29:15,30:15,
  },
};

// ============================================================
//                DEFESA, ACERTO, TR, CD, PERÍCIAS
// ============================================================
// Cálculo baseado em ND + modificador, com ajuste por patamar
// e dificuldade. Todos os valores são "base + modAtributo"
// então armazenamos só a parte que depende do ND.

const NUM_SAFE = (v) => v ?? 0;

// Acerto e Perícias Dominadas seguem o mesmo padrão não-linear por ND
const PROGRESSION_STANDARD = {
  1:3, 2:4, 3:5, 4:6, 5:8, 6:9, 7:10, 8:11, 9:13, 10:14,
  11:15, 12:16, 13:18, 14:19, 15:20, 16:21, 17:23, 18:24, 19:25, 20:26,
};

const PROGRESSION_MASTERED = {
  1:4, 2:5, 3:6, 4:7, 5:9, 6:10, 7:11, 8:12, 9:15, 10:16,
  11:17, 12:18, 13:20, 14:21, 15:22, 16:23, 17:26, 18:27, 19:28, 20:29,
};

// Calamidade tem progressão ligeiramente diferente após ND20
const ACERTO_CALAMIDADE = {
  5:11,6:12,7:13,8:14,9:16,10:17,11:18,12:19,13:21,14:22,
  15:23,16:24,17:26,18:27,19:28,20:29,21:35,22:36,23:37,24:38,
  25:39,26:40,27:41,28:42,29:43,30:44,
};

const DEFESA_TABLE = {
  comum:   (nd) => 10 + nd,
  desafio: (nd) => {
    const map = {3:10,4:11,5:12,6:13,7:14,8:15,9:16,10:17,11:20,12:21,13:22,14:23,15:24,16:25,17:27,18:28,19:29,20:30};
    return map[nd] ?? 10 + nd;
  },
  calamidade: (nd) => {
    const map = {
      5:10,6:11,7:12,8:13,9:14,10:15,11:16,12:17,13:20,14:21,15:22,16:23,
      17:24,18:25,19:27,20:28,21:29,22:30,23:35,24:40,25:45,26:50,
      27:51,28:52,29:53,30:54,
    };
    return map[nd] ?? 10 + nd;
  },
  lacaio:  () => 10, // + mod Dex
  capanga: () => 10, // + mod Dex
};

export const calculateDefesa = (patamar, nd, modDex, difficulty = "iniciante") => {
  const base = DEFESA_TABLE[patamar]?.(nd) ?? (10 + modDex);
  const modifier = { iniciante: 0, intermediario: 2, experiente: 4 };
  return base + modDex + (modifier[difficulty] ?? 0);
};

export const calculateAcerto = (patamar, nd, modAttr, difficulty = "iniciante") => {
  const base = patamar === "calamidade"
    ? NUM_SAFE(ACERTO_CALAMIDADE[nd])
    : NUM_SAFE(PROGRESSION_STANDARD[nd]);
  const modifier = { iniciante: 0, intermediario: 2, experiente: 4 };
  return base + modAttr + (modifier[difficulty] ?? 0);
};

export const calculateTR = (nd, modAttr, difficulty = "iniciante") => {
  const base = NUM_SAFE(PROGRESSION_STANDARD[nd > 20 ? 20 : nd]);
  // TR é geralmente 2 abaixo do acerto para comuns
  const trBase = Math.max(0, base - 1);
  const modifier = { iniciante: 0, intermediario: 2, experiente: 4 };
  return trBase + modAttr + (modifier[difficulty] ?? 0);
};

export const calculateCD = (nd, modTecnica, difficulty = "iniciante") => {
  const effectiveND = nd > 20 ? 20 : nd;
  const map = {
    iniciante:      (n, mod) => Math.floor((NUM_SAFE(PROGRESSION_STANDARD[n]) + mod) / 2),
    intermediario:  (n, mod) => NUM_SAFE(PROGRESSION_STANDARD[n]) + mod,
    experiente:     (n, mod) => NUM_SAFE(PROGRESSION_STANDARD[n]) + mod + 2,
  };
  return map[difficulty]?.(effectiveND, modTecnica) ?? 0;
};

export const calculatePericiaComum = (nd, modAttr) =>
  NUM_SAFE(PROGRESSION_STANDARD[nd > 20 ? 20 : nd]) + modAttr;

export const calculatePericiaDominada = (nd, modAttr) =>
  NUM_SAFE(PROGRESSION_MASTERED[nd > 20 ? 20 : nd]) + modAttr;

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
