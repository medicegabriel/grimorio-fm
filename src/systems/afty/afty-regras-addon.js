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
  "nivelJogadorSemTeto",
  "aptidaoApos20",
  "focosPorNivel",
  "pontosAtributoPorCiclo",
  "talentosIniciais",
  "energiaEmVida",
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
  if (regras.nivelJogadorSemTeto === true) out.nivelJogadorSemTeto = true;
  if (regras.aptidaoApos20 === true) out.aptidaoApos20 = true;
  if (multiplicadorValido(regras.focosPorNivel)) out.focosPorNivel = Number(regras.focosPorNivel);
  if (Number.isInteger(regras.pontosAtributoPorCiclo) && regras.pontosAtributoPorCiclo > 0) {
    out.pontosAtributoPorCiclo = regras.pontosAtributoPorCiclo;
  }
  if (Number.isInteger(regras.talentosIniciais) && regras.talentosIniciais >= 1 && regras.talentosIniciais <= 4) {
    out.talentosIniciais = regras.talentosIniciais;
  }
  // Quantos PV cada PE vira (2026-10-15, Maldição Carmesim do Golem de Sangue).
  if (multiplicadorValido(regras.energiaEmVida)) out.energiaEmVida = Number(regras.energiaEmVida);
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
  for (const chave of ["multiplicadorPeMaximo", "multiplicadorPvFinal", "focosPorNivel", "energiaEmVida"]) {
    if (chave in regras && !multiplicadorValido(regras[chave])) {
      problemas.push(`${onde}: "${chave}" precisa ser um número maior que zero.`);
    }
  }
  for (const chave of ["passivasSemCustoPeMaximo", "ignoraMultiplicadorPeMaximoDeVotos", "nivelJogadorSemTeto", "aptidaoApos20"]) {
    if (chave in regras && typeof regras[chave] !== "boolean") {
      problemas.push(`${onde}: "${chave}" precisa ser verdadeiro ou falso.`);
    }
  }
  if ("pontosAtributoPorCiclo" in regras
    && !(Number.isInteger(regras.pontosAtributoPorCiclo) && regras.pontosAtributoPorCiclo > 0)) {
    problemas.push(onde + ': "pontosAtributoPorCiclo" precisa ser um inteiro maior que zero.');
  }
  if ("talentosIniciais" in regras
    && !(Number.isInteger(regras.talentosIniciais) && regras.talentosIniciais >= 1 && regras.talentosIniciais <= 4)) {
    problemas.push(onde + ': "talentosIniciais" precisa ser um inteiro de 1 a 4.');
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
    nivelJogadorSemTeto: false,
    aptidaoApos20: false,
    focosPorNivel: null,
    pontosAtributoPorCiclo: null,
    fontesTalentosIniciais: [],
    /* O PE MÁXIMO VIRA PV (`energiaEmVida`, 2026-10-15): cada PE vale N PV, e o PE
       Máximo fica zero. Com dois pacotes declarando, vale o maior. */
    energiaEmVida: 0,
    fonteEnergiaEmVida: null,
  };
  for (const pacote of Array.isArray(creature?.addons) ? creature.addons : []) {
    const regras = normalizarRegrasAfty(pacote?.regrasAfty);
    const fonte = { id: pacote?.id ?? null, nome: pacote?.nome || pacote?.id || "Addon" };
    out.nivelJogadorSemTeto ||= regras.nivelJogadorSemTeto === true;
    out.aptidaoApos20 ||= regras.aptidaoApos20 === true;
    if (regras.focosPorNivel != null) out.focosPorNivel = Math.max(out.focosPorNivel ?? 0, regras.focosPorNivel);
    if (regras.pontosAtributoPorCiclo != null) {
      out.pontosAtributoPorCiclo = Math.max(out.pontosAtributoPorCiclo ?? 0, regras.pontosAtributoPorCiclo);
    }
    if (regras.talentosIniciais != null) {
      out.fontesTalentosIniciais.push({ ...fonte, valor: regras.talentosIniciais });
    }
    if (regras.energiaEmVida != null && regras.energiaEmVida > out.energiaEmVida) {
      out.energiaEmVida = regras.energiaEmVida;
      out.fonteEnergiaEmVida = fonte;
    }
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
