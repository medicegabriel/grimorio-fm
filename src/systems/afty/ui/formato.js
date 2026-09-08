/**
 * Formatação de número da UI do Afty. Módulo sem componente de propósito: o
 * `react-refresh` exige que um arquivo de componente exporte SÓ componentes, e
 * `sinalDe` é dividido entre o criador e a Ficha Final.
 */

/** `7` vira `+7` e `-7` vira `−7` (sinal de menos de verdade, não hífen). */
export const sinalDe = (v) => `${v >= 0 ? "+" : "−"}${Math.abs(v)}`;

/** `1.5` vira `1,5` e `12` continua `12`. Metro e divisor de fórmula. */
export const numeroBr = (v) => String(v).replace(".", ",");

/* ⚠ OS DOIS FORMATADORES ABAIXO SÃO CONSTRUÍDOS UMA VEZ SÓ. Um
   `new Intl.NumberFormat` custa caro, e a Carteira formata dois números por
   linha de uma lista que cresce a cada sessão jogada.

   ⚠ E ELES NÃO SUBSTITUEM O `numeroBr`. Aquele é troca de caractere para
   fórmula escrita ("1,5 metro"), e estes dois são valor de extrato, com
   separador de milhar. O `numeroBr` num 51117.5 devolveria "51117,5", sem o
   ponto do milhar. */
const FMT_MOEDA = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const FMT_DECIMAL = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });

/**
 * `51117` vira `$ 51.117,00` e `-28949.8` vira `−$ 28.949,80`.
 *
 * O sinal fica ANTES do cifrão, e é o menos de verdade (U+2212) pela mesma
 * razão do `sinalDe`: o hífen fica mais curto e mais alto que o traço do
 * número, e num campo tabular isso salta.
 */
export const moedaBr = (v) => {
  const n = Number(v) || 0;
  return `${n < 0 ? "−" : ""}$ ${FMT_MOEDA.format(Math.abs(n))}`;
};

/** `588.75` vira `588,75` e `9` continua `9`. Casa decimal só quando existe. */
export const decimalBr = (v) => FMT_DECIMAL.format(Number(v) || 0);
