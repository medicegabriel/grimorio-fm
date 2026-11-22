export const ECLESIASTES = {
  id: "eclesiastes",
  label: "Eclesiastes",
};

export const ehFichaEclesiastes = (ficha) => ficha?.edicaoDeRegras === ECLESIASTES.id;

export function aceitaFichaEclesiastes(ficha) {
  return ehFichaEclesiastes(ficha)
    && ficha.mesa == null
    && (ficha.rulesVersion === "player" || ficha.rulesVersion === "afty");
}

export function prepararFichaEclesiastes(ficha) {
  return { ...ficha, edicaoDeRegras: ECLESIASTES.id };
}

/**
 * Ponto de entrada do livro de Eclesiastes. As duas fichas usam a régua
 * compartilhada até os capítulos próprios ganharem implementação aqui.
 */
export function derivarEclesiastes(ficha, opcoes, derivarBase) {
  return derivarBase(ficha, opcoes);
}
