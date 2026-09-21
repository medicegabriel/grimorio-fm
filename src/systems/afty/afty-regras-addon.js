/**
 * Regras numéricas optativas declaradas por Addons e Votos automáticos.
 *
 * O Addon continua sendo somente dado. Este módulo conhece os verbos seguros,
 * enquanto cada JSON informa quais deles usa e com quais multiplicadores.
 */

const CHAVES = new Set([
  "multiplicadorPeMaximo",
  "multiplicadorPvFinal",
  "passivasSemCustoPeMaximo",
  "ignoraMultiplicadorPeMaximoDeVotos",
]);

const objeto = (valor) => valor && typeof valor === "object" && !Array.isArray(valor);
const multiplicadorValido = (valor) => Number.isFinite(Number(valor)) && Number(valor) > 0;

/** Retira campos desconhecidos e valores inválidos antes de uma regra ser usada. */
export function normalizarRegrasAfty(regras) {
  if (!objeto(regras)) return {};
  const out = {};
  if (multiplicadorValido(regras.multiplicadorPeMaximo)) {
    out.multiplicadorPeMaximo = Number(regras.multiplicadorPeMaximo);
  }
  if (multiplicadorValido(regras.multiplicadorPvFinal)) {
    out.multiplicadorPvFinal = Number(regras.multiplicadorPvFinal);
  }
  if (regras.passivasSemCustoPeMaximo === true) out.passivasSemCustoPeMaximo = true;
  if (regras.ignoraMultiplicadorPeMaximoDeVotos === true) {
    out.ignoraMultiplicadorPeMaximoDeVotos = true;
  }
  return out;
}

/** Mensagens do portão de instalação para uma declaração de regras. */
export function validarRegrasAfty(regras, onde = "regrasAfty") {
  if (regras == null) return [];
  if (!objeto(regras)) return [`${onde}: precisa ser um objeto.`];
  const problemas = [];
  for (const chave of Object.keys(regras)) {
    if (!CHAVES.has(chave)) problemas.push(`${onde}: regra desconhecida "${chave}".`);
  }
  for (const chave of ["multiplicadorPeMaximo", "multiplicadorPvFinal"]) {
    if (chave in regras && !multiplicadorValido(regras[chave])) {
      problemas.push(`${onde}: "${chave}" precisa ser um número maior que zero.`);
    }
  }
  for (const chave of ["passivasSemCustoPeMaximo", "ignoraMultiplicadorPeMaximoDeVotos"]) {
    if (chave in regras && typeof regras[chave] !== "boolean") {
      problemas.push(`${onde}: "${chave}" precisa ser verdadeiro ou falso.`);
    }
  }
  return problemas;
}

/** Une as regras de todos os Addons ativos desta ficha. */
export function regrasAftyDaCriatura(creature) {
  const out = {
    multiplicadorPeMaximo: 1,
    multiplicadorPvFinal: 1,
    passivasSemCustoPeMaximo: false,
    ignoraMultiplicadorPeMaximoDeVotos: false,
    fontesMultiplicadorPeMaximo: [],
    fontesMultiplicadorPvFinal: [],
    fontesPassivasSemCusto: [],
    fontesIgnoraMultiplicadorPeVotos: [],
  };
  for (const pacote of Array.isArray(creature?.addons) ? creature.addons : []) {
    const regras = normalizarRegrasAfty(pacote?.regrasAfty);
    const fonte = { id: pacote?.id ?? null, nome: pacote?.nome || pacote?.id || "Addon" };
    if (regras.multiplicadorPeMaximo != null) {
      out.multiplicadorPeMaximo *= regras.multiplicadorPeMaximo;
      out.fontesMultiplicadorPeMaximo.push({ ...fonte, valor: regras.multiplicadorPeMaximo });
    }
    if (regras.multiplicadorPvFinal != null) {
      out.multiplicadorPvFinal *= regras.multiplicadorPvFinal;
      out.fontesMultiplicadorPvFinal.push({ ...fonte, valor: regras.multiplicadorPvFinal });
    }
    if (regras.passivasSemCustoPeMaximo) {
      out.passivasSemCustoPeMaximo = true;
      out.fontesPassivasSemCusto.push(fonte);
    }
    if (regras.ignoraMultiplicadorPeMaximoDeVotos) {
      out.ignoraMultiplicadorPeMaximoDeVotos = true;
      out.fontesIgnoraMultiplicadorPeVotos.push(fonte);
    }
  }
  return out;
}
