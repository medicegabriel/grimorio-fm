/* ============================================================
   EXAUSTÃO DESDE ZERO: a regra pura (fechamento funcional do G2, 2026-10-20)
   ============================================================
   O Nível de Exaustão é `sessao.exaustao`: um inteiro entre 0 e 6 (o teto do Livro, p.324). O que cada Nível FAZ mora em `afty-exaustao.js` e o derive o
   lê por `opcoes.exaustao`. Não é a Exaustão de Técnica (`exaustaoTecnica`), que a virada entrega uma vez só pelo motor. Aqui só se lê e se escreve o contador.
   ============================================================ */
import { limitaExaustao, EXAUSTAO_MAXIMA } from "../../afty-exaustao";

export { EXAUSTAO_MAXIMA };

/** O nível como inteiro entre 0 e o teto, qualquer que seja o que a sessão tenha. */
export const nivelDeExaustao = (sessao) => limitaExaustao(sessao?.exaustao);

/** Define o nível (piso 0, teto 6). Devolve a MESMA sessão quando nada muda. */
export function comExaustao(sessao, valor) {
  const v = limitaExaustao(valor);
  return v === nivelDeExaustao(sessao) && sessao.exaustao === v ? sessao : { ...sessao, exaustao: v };
}

/** Um passo sobre o nível de AGORA: dois passos seguidos somam, e o piso é 0 e o teto 6. */
export const maisExaustao = (sessao, delta) => comExaustao(sessao, nivelDeExaustao(sessao) + Math.trunc(Number(delta) || 0));
