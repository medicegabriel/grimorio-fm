/**
 * ============================================================
 * O SEM FICHA COM VIDA (rework dos Encontros, etapa 2, 2026-11-23)
 * ============================================================
 * O marcador (só nome e iniciativa) pode nascer com Vida (`vida: { pv, pvMax }`,
 * autor, 2026-11-18, "Sem Ficha com Vida"). Com ela, ele passa pelos mesmos
 * verbos de todo combatente: Dano, Dano pela Metade, Cura e Descansar mexem na
 * Vida, com operação, Registro e Desfazer. O resto (PE, Alma, condições, turno)
 * não existe nele e devolve o estado como está, o que vira "Nada Mudou".
 *
 * Sem ficha não há derivado: o máximo mora no próprio estado, e o derivado que
 * o Encontro calcula (`derivar`) é só `{ hp: pvMax }`, para a Cura e o Desfazer
 * relativo terem o teto.
 *
 * O marcador SEM `vida` continua sem motor (`motorDe` devolve null), como antes.
 *
 * ⚠ SALA: o banco recusa tudo de marcador (`publicar_resumo` e `gravar_ficha`
 * com "Combatente sem Ficha", ver supabase/salas.sql), então a Vida do marcador
 * ainda não chega aos jogadores nem a uma segunda aba do Mestre. O corte por
 * Visão e o SQL entram na etapa 7 do rework, e o autor cola. Ver docs/a-fazer.md.
 *
 * FOLHA: zero imports.
 * ============================================================
 */

const inteiro = (v, padrao = 0) => {
  const n = Math.trunc(Number(v));
  return Number.isFinite(n) ? n : padrao;
};
const inteiroPositivo = (v) => Math.max(0, inteiro(v, 0));

/** A Vida de um marcador saneada: `{ pv, pvMax }` com o máximo de 1 para cima, ou null (sem Vida). */
export function normalizarVidaDoMarcador(bruto) {
  if (!bruto || typeof bruto !== "object" || Array.isArray(bruto)) return null;
  const pvMax = inteiro(bruto.pvMax, 0);
  if (pvMax < 1) return null;
  const pv = bruto.pv == null ? pvMax : Math.min(pvMax, inteiroPositivo(bruto.pv));
  return { pv, pvMax };
}

const comPv = (e, pv) => (pv === e.pv ? e : { ...e, pv });
const mesmo = (e) => e;
const semFim = (e) => ({ estado: e, expirou: [] });

export const motorMarcador = {
  motor: "marcador",
  campoDoEstado: "vida",
  /* O marcador não tem registro próprio: a chave não existe e a lista de entradas novas sai vazia. */
  campoDoRegistro: "registro",
  porChave: [],
  relativos: [["pv"]],
  ignorados: ["historico", "registro"],

  estadoInicial: (_ficha, derived = null) => normalizarVidaDoMarcador({ pvMax: derived?.hp }),
  normalizarEstado: (bruto) => normalizarVidaDoMarcador(bruto),
  derivar: (_ficha, vida) => (vida ? { hp: inteiroPositivo(vida.pvMax), pe: 0 } : null),
  aparar: (e) => (e ? comPv(e, Math.min(inteiroPositivo(e.pvMax), inteiroPositivo(e.pv))) : e),

  aplicarDano: (e, _d, valor) => comPv(e, Math.max(0, inteiroPositivo(e.pv) - inteiroPositivo(valor))),
  aplicarCura: (e, _d, valor) => comPv(e, Math.min(inteiroPositivo(e.pvMax), inteiroPositivo(e.pv) + inteiroPositivo(valor))),
  gastarPe: mesmo,
  recuperarPe: mesmo,
  descansar: (e) => comPv(e, inteiroPositivo(e.pvMax)),
  alma: mesmo,
  condicao: mesmo,

  iniciaCombate: mesmo,
  encerraCombate: mesmo,
  retomaCombate: mesmo,
  iniciaTurno: mesmo,
  encerraTurno: mesmo,
  viraRodada: semFim,
  desceDuracoesDe: semFim,
  marcarAplicador: (_antes, depois) => depois,
  repassarAplicador: mesmo,

  /* O mesmo formato do resumo do Afty, com o que o marcador não tem zerado. */
  resumo: (e) => {
    const pv = inteiroPositivo(e?.pv);
    const pvMax = inteiroPositivo(e?.pvMax);
    return {
      pv, pvMax, pvTemp: 0, pe: 0, peMax: 0, peTemp: 0, alma: 0, almaMax: 0,
      condicoes: [], efeitos: [], caido: pvMax > 0 && pv <= 0, morto: false,
    };
  },

  limite: (caminho, e) => (caminho.length === 1 && caminho[0] === "pv" ? inteiroPositivo(e?.pvMax) : null),
};
