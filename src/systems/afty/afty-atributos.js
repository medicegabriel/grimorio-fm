/**
 * ============================================================
 * ATRIBUTOS — GRIMÓRIO AFTY (regras de montagem)
 * ============================================================
 * TRÊS TETOS, e não um (autor, 2026-07-29). Confundi-los foi o bug que a
 * reforma de 2026-07-29 consertou: até então só o 30 existia no código, e todo
 * efeito do Motor passava por cima do 20 calado.
 *
 *   1. LIMITE DO ATRIBUTO (`ATTR_LIMITE_PADRAO`, 20). Vale para TODA fonte de
 *      valor, alocada ou concedida, "a não ser que alguma habilidade diga o
 *      oposto". Sobe por Origem (o Restringido tem 30 nos físicos), por
 *      Desenvolvimento Inesperado e pelo canal `limiteAtributo` do Motor
 *      (Incremento de Atributo, Quebra de Limites, Treino de Atributo Completo).
 *   2. TETO DO SISTEMA (`ATTR_LIMITE_MAX`, 30). Independe da fonte. É onde param
 *      até os efeitos que dizem em texto que furam o limite do atributo (os 6
 *      acessórios de atributo: "podendo superar o seu limite de atributo, até o
 *      máximo de 30").
 *   3. TETO ABSOLUTO (`ATTR_LIMITE_ABSOLUTO`, 32). Só o Aperfeiçoamento de
 *      Atributo (Habilidade Lendária) chega aqui, e nada no sistema vai além.
 *
 * Valores 0–30 na montagem. Limite padrão 20 (a ALOCAÇÃO respeita isso);
 * poderes/talentos/características/origem entram por cima e podem
 * levar o valor efetivo até o teto duro de 30.
 *
 * Três métodos de montar a BASE (o GM escolhe por criatura):
 *   • Compra por Pontos (17 pts, tabela de custo, faixa 8–15)
 *   • Valores Fixos (15,14,13,12,10,8)
 *   • Rolagem (4d6, descarta o menor)
 *
 * Regra adicional: pontos de atributo a cada 4 ND, alocados POR CIMA
 * da base (1:1, cada ponto = +1 no valor), respeitando o limite. Pool
 * separado da base. A quantidade por ciclo depende do PATAMAR:
 * Comum e Desafio dão 2, Calamidade e Beyond dão 3.
 * ============================================================
 */

import { AFTY_ATTRS } from "./afty-schema";

export const ATTR_KEYS = ["forca", "destreza", "constituicao", "inteligencia", "sabedoria", "presenca"];

/** Rótulo do atributo, para os avisos não saírem em snake_case. */
export const ATTR_LABEL = Object.fromEntries(AFTY_ATTRS.map((a) => [a.key, a.label]));

export const ATTR_LIMITE_PADRAO = 20;
export const ATTR_LIMITE_MAX = 30;
/** Só o Aperfeiçoamento de Atributo (Lendária) passa do 30, e para aqui. */
export const ATTR_LIMITE_ABSOLUTO = 32;

export const ATTR_METODOS = [
  { value: "pontos", label: "Compra por Pontos" },
  { value: "fixos",  label: "Valores Fixos" },
  { value: "rolagem", label: "Rolagem" },
];

// ---------- Compra por Pontos ----------
// Custo TOTAL para chegar em cada valor (a partir de 10). Valores < 10 devolvem pontos.
export const POINT_BUY_COST = { 8: -2, 9: -1, 10: 0, 11: 2, 12: 3, 13: 4, 14: 5, 15: 7 };
export const POINT_BUY_TOTAL = 17;
export const POINT_BUY_MIN = 8;
export const POINT_BUY_MAX = 15;

export const pointBuyGasto = (attributes = {}) =>
  ATTR_KEYS.reduce((s, k) => s + (POINT_BUY_COST[attributes[k]] ?? 0), 0);

// ---------- Valores Fixos ----------
export const VALORES_FIXOS = [15, 14, 13, 12, 10, 8];

export const valoresFixosOk = (attributes = {}) => {
  const got = ATTR_KEYS.map((k) => attributes[k]).sort((a, b) => a - b);
  const exp = [...VALORES_FIXOS].sort((a, b) => a - b);
  return JSON.stringify(got) === JSON.stringify(exp);
};

// ---------- Rolagem ----------
export const roll4d6DropLowest = () => {
  const d = Array.from({ length: 4 }, () => 1 + Math.floor(Math.random() * 6)).sort((a, b) => a - b);
  return d[1] + d[2] + d[3]; // descarta o menor (d[0])
};
export const rolarAtributos = () =>
  Object.fromEntries(ATTR_KEYS.map((k) => [k, roll4d6DropLowest()]));

// ---------- Pontos de nível (a cada 4 ND) ----------
// Comum e Desafio dão 2 por ciclo. Calamidade e Beyond dão 3.
export const ATTR_POR_CICLO = { comum: 2, desafio: 2, calamidade: 3, beyond: 3 };
export const nivelPontosPorCiclo = (patamar) => ATTR_POR_CICLO[patamar] ?? 2;
export const nivelPontosTotal = (nd, patamar) =>
  Math.floor((nd ?? 1) / 4) * nivelPontosPorCiclo(patamar);
export const nivelPontosUsados = (attrNivel = {}) =>
  ATTR_KEYS.reduce((s, k) => s + (attrNivel[k] || 0), 0);

// ---------- Desenvolvimento Inesperado (Derivado: +1 a cada 4 ND) ----------
// Cada ponto = +1 no valor E +1 no limite do atributo escolhido.
export const desenvolvimentoTotal = (nd) => Math.floor((nd ?? 1) / 4);
export const desenvolvimentoUsado = (desenv = {}) =>
  ATTR_KEYS.reduce((s, k) => s + (desenv[k] || 0), 0);

// ---------- Pool de LIMITE (Maldição: +2 no limite a cada 4 ND) ----------
// Irmão do Desenvolvimento, e a diferença é toda: aqui o ponto sobe SÓ o limite,
// e não o valor. A Maldição paga o valor com os 4 pontos distribuíveis dela.
// O mapa guarda QUANTAS vezes cada atributo foi escolhido, e o resolver da
// origem multiplica pelo tamanho do degrau (2), para o número na ficha e o
// contador da UI serem a mesma unidade.
export const limitePoolTotal = (nd, porNivel = 4) => Math.floor((nd ?? 1) / (porNivel || 4));
export const limitePoolUsado = (mapa = {}) =>
  ATTR_KEYS.reduce((s, k) => s + (mapa[k] || 0), 0);

/**
 * Resumo/validação dos atributos para o builder.
 * Retorna trackers e uma lista de avisos (soft — não bloqueiam).
 *
 * ⚠ `limitesEfetivos` vem de FORA (`derived.attrLimiteEfetivo`), e não é
 * opcional por preguiça: só o `deriveAfty` conhece o limite de verdade, porque
 * ele depende da Origem, do Desenvolvimento e do canal `limiteAtributo` do
 * Motor. Esta função calculava o seu próprio limite até 2026-07-29, e por isso
 * avisava errado em toda ficha de Restringido (limite 30 nos físicos) e em toda
 * ficha com Incremento de Atributo. Sem o mapa, cai no 20 padrão.
 */
export function resumoAtributos(creature, limitesEfetivos = null, perdas = null) {
  const metodo = creature?.attrMethod || "pontos";
  const attrs = creature?.attributes || {};
  const nivel = creature?.attrNivel || {};
  const nd = creature?.core?.nd ?? 1;
  const patamar = creature?.core?.patamar || "comum";
  const limiteDe = (k) => limitesEfetivos?.[k] ?? ATTR_LIMITE_PADRAO;

  const nivelTotal = nivelPontosTotal(nd, patamar);
  const nivelUsado = nivelPontosUsados(nivel);
  const gasto = pointBuyGasto(attrs);
  const warnings = [];

  if (metodo === "pontos") {
    if (gasto > POINT_BUY_TOTAL) warnings.push(`Compra por Pontos: ${gasto} de ${POINT_BUY_TOTAL} pontos (excedeu).`);
    for (const k of ATTR_KEYS) {
      const v = attrs[k];
      if (v < POINT_BUY_MIN || v > POINT_BUY_MAX) warnings.push(`${ATTR_LABEL[k] ?? k}: base ${v} fora da faixa ${POINT_BUY_MIN} a ${POINT_BUY_MAX}.`);
    }
  } else if (metodo === "fixos" && !valoresFixosOk(attrs)) {
    warnings.push("Valores Fixos: distribua exatamente 15, 14, 13, 12, 10 e 8.");
  }

  if (nivelUsado > nivelTotal) warnings.push(`Pontos de nível: ${nivelUsado} de ${nivelTotal} (excedeu).`);

  for (const k of ATTR_KEYS) {
    const alocado = (attrs[k] || 0) + (nivel[k] || 0);
    const lim = limiteDe(k);
    if (alocado > lim) warnings.push(`${ATTR_LABEL[k] ?? k}: alocado ${alocado} passa do limite ${lim}.`);
  }

  // Ponto DESPERDIÇADO no limite. Diferente do aviso de cima: ali a alocação
  // está ilegal, aqui está legal e um bônus concedido é que não caberia. O
  // jogador precisa ver, porque a resposta costuma ser mover o ponto de nível
  // para outro atributo (a origem e o Motor não são movíveis).
  for (const k of ATTR_KEYS) {
    const perdido = perdas?.[k] || 0;
    if (perdido > 0) {
      warnings.push(
        `${ATTR_LABEL[k] ?? k}: ${perdido} ${perdido === 1 ? "ponto" : "pontos"} de bônus perdido${perdido === 1 ? "" : "s"} no limite ${limiteDe(k)}.`,
      );
    }
  }

  return {
    metodo,
    nivelTotal, nivelUsado,
    pointBuyGasto: gasto, pointBuyTotal: POINT_BUY_TOTAL,
    warnings,
  };
}
