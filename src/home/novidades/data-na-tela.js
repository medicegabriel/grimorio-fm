/* "2026-11-26" vira "26/11/2026" sem passar por `Date`, que leria a data em UTC e mostraria o dia anterior no Brasil. */
export const dataNaTela = (iso) => iso.split("-").reverse().join("/");
