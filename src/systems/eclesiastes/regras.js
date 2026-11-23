import { AFTY_RESISTENCIAS } from "../afty/afty-schema";

export const ECLESIASTES = {
  id: "eclesiastes",
  label: "Eclesiastes",
};

export const ehFichaEclesiastes = (ficha) => ficha?.edicaoDeRegras === ECLESIASTES.id;

export const vetaTREclesiastes = (ficha, id) =>
  ehFichaEclesiastes(ficha) && id === "astucia";

const RESISTENCIAS_ECLESIASTES = AFTY_RESISTENCIAS.filter((r) =>
  !vetaTREclesiastes({ edicaoDeRegras: ECLESIASTES.id }, r.value));

export const resistenciasDaFicha = (ficha) =>
  ehFichaEclesiastes(ficha) ? RESISTENCIAS_ECLESIASTES : AFTY_RESISTENCIAS;

export const DANO_CRIATURA_POR_PATAMAR = {
  comum: { nd: 1, escala: 1, escalaCL: 0, dado: "d6" },
  desafio: { nd: 2, escala: 1, escalaCL: 1, dado: "d8" },
  calamidade: { nd: 3, escala: 2, escalaCL: 2, dado: "d10" },
  beyond: { nd: 3, escala: 3, escalaCL: 3, dado: "d12" },
};

const ESPECIALIZACOES_DA_ORIGEM_RESTRINGIDO = Object.freeze(["lutador", "combatente", "conjurador", "suporte"]);

export const vetaEspecializacaoEclesiastes = (ficha, id) =>
  ehFichaEclesiastes(ficha) && (id === "controlador" || id === "restringido");

export const especializacoesDaOrigemEclesiastes = (ficha, origemId) =>
  ehFichaEclesiastes(ficha) && origemId === "restringido" ? ESPECIALIZACOES_DA_ORIGEM_RESTRINGIDO : null;

export function aceitaFichaEclesiastes(ficha) {
  return ehFichaEclesiastes(ficha)
    && ficha.mesa == null
    && (ficha.rulesVersion === "player" || ficha.rulesVersion === "afty");
}

export function prepararFichaEclesiastes(ficha) {
  return { ...ficha, edicaoDeRegras: ECLESIASTES.id };
}

/**
 * Ponto de entrada do livro de Eclesiastes. O motor compartilhado lê a
 * edição da ficha ao aplicar as diferenças de cálculo.
 */
export function derivarEclesiastes(ficha, opcoes, derivarBase) {
  return derivarBase(ficha, opcoes);
}
