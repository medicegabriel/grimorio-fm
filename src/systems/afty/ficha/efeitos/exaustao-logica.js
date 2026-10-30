/* ============================================================
   EXAUSTÃO DESDE ZERO: a regra pura (fechamento funcional do G2, 2026-10-20)
   ============================================================
   O Nível de Exaustão é `sessao.exaustao`: um inteiro NÃO NEGATIVO, sem teto e sem penalidade que o motor não modela (a penalidade é de mesa). Não é a
   Exaustão de Técnica (`exaustaoTecnica`), que a virada entrega uma vez só pelo motor. Aqui só se lê e se escreve o contador.
   ============================================================ */

/** O nível como inteiro não negativo, qualquer que seja o que a sessão tenha. */
export const nivelDeExaustao = (sessao) => Math.max(0, Math.trunc(Number(sessao?.exaustao) || 0));

/** Define o nível (piso 0). Devolve a MESMA sessão quando nada muda. */
export function comExaustao(sessao, valor) {
  const v = Math.max(0, Math.trunc(Number(valor) || 0));
  return v === nivelDeExaustao(sessao) && sessao.exaustao === v ? sessao : { ...sessao, exaustao: v };
}

/** Um passo sobre o nível de AGORA: dois passos seguidos somam, e o piso é 0. */
export const maisExaustao = (sessao, delta) => comExaustao(sessao, nivelDeExaustao(sessao) + Math.trunc(Number(delta) || 0));
