/**
 * ============================================================
 * AS BARREIRAS NA SESSÃO: O ESTADO (CL3, 2026-11-01)
 * ============================================================
 * FOLHA: zero imports. A sessão importa este arquivo, e as operações (`ficha-barreiras.js`) importam a sessão.
 * Livro p.188 e 189 (Técnicas de Barreira, Cortina, regras sobre barreiras e sobre cortinas).
 *
 * `sessao.barreiras = { paredes: [...], cortinas: [...] }`
 *
 *   parede    `{ id, pv, pvMax, rd, desde }`. A unidade da aptidão Técnicas de Barreira (1,5 m)
 *   cortina   `{ id, nome, area, pv, pvMax, rd, condicoes: [texto], desde }`. Vale três paredes (autor, 2026-08-26)
 *
 * O domo da Expansão de Domínio NÃO mora aqui: ele continua em `combate.dominioPvDomo`, com `danoNoDomo` e `defineDomo`.
 * A Cesta Oca de Vime também não: é um uso ativo com concentração (`uso.ativos.cesta_oca_de_vime`), ver `ficha-barreiras.js`.
 *
 * ⚠ ESTADO DE MESA, NÃO DE FICHA. Viaja no Encontro porque o combatente guarda a sessão inteira. Sessão gravada antes
 * deste lote não tem o campo, e o padrão (nada erguido) é o certo.
 *
 * ⚠ NÃO HÁ DURAÇÃO ESCRITA NO LIVRO para parede nem para cortina (p.188 e 189 não dão rodadas). Elas ficam de pé até
 * serem destruídas, retiradas à mão ou o descanso chegar. Inventar um prazo seria inventar regra.
 * ============================================================
 */
export const TETO_PAREDES = 60;
export const TETO_CORTINAS = 20;
export const TETO_CONDICOES = 10;

const inteiro = (v, padrao = 0) => {
  const n = Math.trunc(Number(v));
  return Number.isFinite(n) ? n : padrao;
};
const naoNegativo = (v) => Math.max(0, inteiro(v, 0));
const objeto = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v : null);
const lista = (v) => (Array.isArray(v) ? v : []);
const texto = (v, max) => (typeof v === "string" ? v.slice(0, max) : "");

export const barreirasEmBranco = () => ({ paredes: [], cortinas: [] });

function parede(bruto) {
  if (!objeto(bruto) || typeof bruto.id !== "string" || !bruto.id) return null;
  const pvMax = naoNegativo(bruto.pvMax);
  return { id: bruto.id, pv: Math.min(pvMax, naoNegativo(bruto.pv)), pvMax, rd: naoNegativo(bruto.rd), desde: naoNegativo(bruto.desde) };
}

function cortina(bruto) {
  const p = parede(bruto);
  if (!p) return null;
  return {
    ...p,
    nome: texto(bruto.nome, 80),
    area: Math.max(0, Number(bruto.area) || 0),
    condicoes: lista(bruto.condicoes).filter((c) => typeof c === "string" && c.trim()).slice(0, TETO_CONDICOES).map((c) => c.slice(0, 160)),
  };
}

/** Sanea o que veio do armazenamento, do export ou de um Encontro. Lixo vira o padrão e nunca derruba. */
export function normalizaBarreiras(bruto) {
  const b = objeto(bruto);
  if (!b) return barreirasEmBranco();
  return {
    paredes: lista(b.paredes).map(parede).filter(Boolean).slice(0, TETO_PAREDES),
    cortinas: lista(b.cortinas).map(cortina).filter(Boolean).slice(0, TETO_CORTINAS),
  };
}

export const barreirasDe = (sessao) => normalizaBarreiras(sessao?.barreiras);

/** A sessão com as barreiras trocadas pelo que o mutador devolve. */
export const comBarreiras = (sessao, mutador) => ({ ...sessao, barreiras: mutador(barreirasDe(sessao)) });

/** O descanso desmancha o que foi erguido. */
export const zeraBarreirasNoDescanso = (sessao) => ({ ...sessao, barreiras: barreirasEmBranco() });
