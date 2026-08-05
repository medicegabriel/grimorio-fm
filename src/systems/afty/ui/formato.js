/**
 * Formatação de número da UI do Afty. Módulo sem componente de propósito: o
 * `react-refresh` exige que um arquivo de componente exporte SÓ componentes, e
 * `sinalDe` é dividido entre o criador e a Ficha Final.
 */

/** `7` vira `+7` e `-7` vira `−7` (sinal de menos de verdade, não hífen). */
export const sinalDe = (v) => `${v >= 0 ? "+" : "−"}${Math.abs(v)}`;

/** `1.5` vira `1,5` e `12` continua `12`. Metro e divisor de fórmula. */
export const numeroBr = (v) => String(v).replace(".", ",");
