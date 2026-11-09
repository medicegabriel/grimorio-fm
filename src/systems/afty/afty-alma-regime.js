/**
 * ============================================================
 * O REGIME DA ALMA DA FICHA DE CRIATURA E O ADDON DAS FICHAS ANTIGAS (2026-11-09)
 * ============================================================
 * Decisão do autor: a Integridade da Alma da criatura passa a seguir o livro (p.311), IGUAL à Ficha de Player: é uma
 * pilha do tamanho do máximo de PV, e o Dano na Alma desce a Vida junto. A Alma de porcentagem (100 de máximo, que
 * multiplica o PV) continua existindo como Addon, o `alma-do-afty`.
 *
 * Toda ficha criada a partir de agora nasce com `regimeAlma: "livro"` e segue o livro. Toda ficha de criatura que já
 * existia, sem essa marca, ganha o Addon JÁ LIGADO, para o número dela não mudar. A marca grava junto, e por isso
 * quem tirar o Addon depois da migração fica com o livro e não o ganha de volta.
 *
 * ⚠ O PACOTE MORA EM DOIS LUGARES e os dois têm de ser o mesmo: este objeto e `addons/alma-do-afty.json`, que é o que
 * o autor distribui. Um assert compara os dois. Está inline porque o Node dos asserts não importa JSON sem atributo.
 * Ficha de Player não migra: lá a Alma já era pilha, e quem quis a porcentagem instalou o Addon à mão.
 * ============================================================
 */
/* ⚠ FOLHA, ZERO IMPORTS: o `afty-schema.js` o importa e precisa seguir sem ciclo. Por isso o "é Player?" é lido do
   `rulesVersion` aqui, o mesmo campo que `sistemaDaFicha` lê. */
const ehFichaDePlayer = (ficha) => String(ficha?.rulesVersion ?? "").toLowerCase() === "player";

export const ALMA_DO_AFTY_ID = "alma-do-afty";
export const REGIME_ALMA_LIVRO = "livro";
export const REGIME_ALMA_MIGRADO = "migrado";

export const PACOTE_ALMA_DO_AFTY = Object.freeze({
  id: ALMA_DO_AFTY_ID,
  nome: "Alma do Grimório Afty",
  versao: "1.1.0",
  autor: "Afty",
  paraRaw: "afty",
  descricao: "Devolve a Integridade da Alma ao modelo do Grimório Afty: 100 de Máximo mais Outros (Melhoria de Alma, Consciência Absoluta da Alma e qualquer outra fonte do Motor). A Alma é porcentagem e multiplica o PV, então em 100 a Vida não muda e cada ponto acima de 100 vale 1% de PV. Dano na Alma baixa o PV máximo na mesma proporção e não desconta mais a Vida corrente. Sem este pacote, a Alma segue o livro: é igual ao máximo de Pontos de Vida, e o Dano na Alma também é dano na Vida. As fichas de criatura criadas antes dessa mudança já carregam este pacote ligado.",
  resumo: "A Alma volta a ser porcentagem e multiplica o PV, como no Afty antigo",
  categoria: "regras",
  regrasAfty: Object.freeze({ almaComoAfty: true }),
});

const cache = new WeakMap();

/**
 * A ficha de criatura com o regime da Alma decidido. Devolve a MESMA ficha quando não há nada a fazer (ficha nova,
 * já migrada, ou Player) e UMA cópia por ficha de origem quando migra, para o cache de quem lê por identidade valer.
 */
export function comAlmaLegada(ficha) {
  if (!ficha || typeof ficha !== "object") return ficha;
  if (ficha.regimeAlma) return ficha;
  if (ehFichaDePlayer(ficha)) return ficha;
  const visto = cache.get(ficha);
  if (visto) return visto;
  const lista = Array.isArray(ficha.addons) ? ficha.addons : [];
  const jaTem = lista.some((p) => p?.id === ALMA_DO_AFTY_ID);
  const saida = {
    ...ficha,
    regimeAlma: REGIME_ALMA_MIGRADO,
    addons: jaTem ? lista : [...lista, { ...PACOTE_ALMA_DO_AFTY, regrasAfty: { ...PACOTE_ALMA_DO_AFTY.regrasAfty } }],
  };
  cache.set(ficha, saida);
  return saida;
}
