/**
 * ============================================================
 * EXAUSTÃO: o que cada Nível faz (Livro de Regras 2.5.2, p.324)
 * ============================================================
 * O contador mora na sessão (`sessao.exaustao`). Este módulo é a REGRA: dado um
 * Nível, devolve as penalidades, as Condições impostas, a perda de PV máximo e
 * as falhas de morte. É FOLHA, com zero imports, porque o derive, a sessão e as
 * telas leem daqui.
 *
 * ⚠ ESCOPO ESCOLHIDO PELO AUTOR (2026-11-09): entram as PENALIDADES dos Níveis 1
 * a 5, o teto de 6 e as Condições automáticas. O resto é do mestre e NÃO entra
 * no site: o Nível 6 (morte), o descanso longo tirar um Nível, os gatilhos de
 * dia (fome, oito horas sem descanso, cenas de combate) e o desmaio por Descansos
 * Longos. Não acrescente nenhum deles aqui sem o autor pedir.
 *
 * ⚠ O NÍVEL 6 SÓ SEGUE A CONTA. Ele existe como teto do contador, com as
 * penalidades do Nível 5 e o -6 nas rolagens, mas a morte é de mesa.
 *
 * ⚠ NÃO É A EXAUSTÃO DE TÉCNICA da Expansão de Domínio (`exaustaoTecnica`).
 *
 * LEITURAS ADOTADAS, a confirmar com o autor (docs/a-fazer.md):
 *   • "Todas as suas rolagens" é Ataque, Resistência, Perícia, Iniciativa e Teste
 *     de Morte. O DANO não entra (resposta do autor, 2026-11-09).
 *   • O Nível 5 SUBSTITUI a perda do Nível 3 ("ao invés do padrão"), e não soma.
 *   • A redução do Deslocamento entra no Motor e vale ANTES das Condições de
 *     movimento (Lento pela metade corta o que sobrou).
 *   • Se a perda de PV máximo zeraria a vida, o livro manda desmaiar e não perder
 *     PV: a ficha NÃO aplica a perda e acende `desmaia`. O desmaio é do mestre.
 * ============================================================
 */

export const EXAUSTAO_MAXIMA = 6;

/** O prefixo do id das Condições que a Exaustão impõe. Elas NÃO moram na sessão. */
export const PREFIXO_CONDICAO_EXAUSTAO = "exaustao:";
export const ehCondicaoDeExaustao = (id) => String(id ?? "").startsWith(PREFIXO_CONDICAO_EXAUSTAO);

/** O nível como inteiro entre 0 e o teto. Qualquer lixo vira 0. */
export const limitaExaustao = (v) => Math.min(EXAUSTAO_MAXIMA, Math.max(0, Math.trunc(Number(v) || 0)));

/* As Condições são CUMULATIVAS: quem está no Nível 5 tem as quatro faixas. */
const CONDICOES_POR_NIVEL = [
  { nivel: 2, nomes: ["Desprevenido"] },
  { nivel: 3, nomes: ["Exposto"] },
  { nivel: 4, nomes: ["Condenado", "Desorientado"] },
  { nivel: 5, nomes: ["Enjoado"] },
];

const semAcento = (v) => String(v ?? "")
  .normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();

/** As Condições que o Nível impõe, na ordem do livro: `[{ nome, nivel }]`. */
export function condicoesDaExaustao(nivel) {
  const n = limitaExaustao(nivel);
  return CONDICOES_POR_NIVEL.filter((c) => n >= c.nivel).flatMap((c) => c.nomes.map((nome) => ({ nome, nivel: c.nivel })));
}

/** A mesma lista no formato da sessão, pronta para o `resolveCondicoes`. `via` vira o sufixo do hover. */
export const entradasDeCondicaoDaExaustao = (nivel) => condicoesDaExaustao(nivel)
  .map(({ nome, nivel: de }) => ({ id: `${PREFIXO_CONDICAO_EXAUSTAO}${nome}`, nome, rodadas: null, via: `Exaustão ${de}` }));

/** A Exaustão deste Nível impõe a Condição `nome`? Sem acento e sem caixa, como o resto da sessão. */
export const exaustaoImpoe = (nivel, nome) => {
  const alvo = semAcento(nome);
  return condicoesDaExaustao(nivel).some((c) => semAcento(c.nome) === alvo);
};

/**
 * As penalidades numéricas, como linhas do Motor. -1 em todas as rolagens, na Defesa e na CD, e o Nível
 * soma: -N. O Deslocamento perde 1,5 m por Nível.
 *
 * ⚠ SEM `bonusManobra` GERAL. As Manobras e a Concentração saem de Perícia e de Teste de Resistência, que já
 * levam o -N, e um canal a mais cobraria duas vezes. Só o Teste de Morte, que é o d20 puro, tem linha própria.
 */
export function efeitosDaExaustao(nivel) {
  const n = limitaExaustao(nivel);
  if (!n) return [];
  const comum = { origem: "exaustao", nome: `Exaustão ${n}`, duracao: "temporaria" };
  return [
    { canal: "defesa", expr: String(-n) },
    { canal: "cd", expr: String(-n) },
    { canal: "bonusAcerto", expr: String(-n) },
    { canal: "bonusTR", expr: String(-n) },
    { canal: "bonusPericia", expr: String(-n) },
    { canal: "bonusManobra", alvo: "morte", expr: String(-n) },
    { canal: "iniciativa", expr: String(-n) },
    { canal: "movimento", expr: String(-1.5 * n) },
  ].map((e) => ({ ...comum, ...e }));
}

/**
 * A perda de PV MÁXIMO. Níveis 3 e 4: 20 ou 1/4 do máximo, o que for maior. Nível 5 em diante: 50 ou metade, o
 * que for maior, no lugar da anterior. Arredonda para baixo.
 *
 * Devolve `{ perda, desmaia, regra }`. Quando a perda zeraria a vida (`perda >= hpMax`) o livro manda desmaiar
 * em vez de perder PV: `perda` fica 0 e `desmaia` acende.
 */
export function perdaDePvDaExaustao(nivel, hpMax) {
  const n = limitaExaustao(nivel);
  const max = Math.max(0, Math.trunc(Number(hpMax) || 0));
  if (n < 3 || max <= 0) return { perda: 0, desmaia: false, regra: null };
  const forte = n >= 5;
  const bruta = forte ? Math.max(50, Math.floor(max / 2)) : Math.max(20, Math.floor(max / 4));
  const regra = forte ? "50 ou Metade" : "20 ou 1/4";
  return bruta >= max ? { perda: 0, desmaia: true, regra } : { perda: bruta, desmaia: false, regra };
}

/** O Nível 4 em diante: quem entra nas Portas da Morte entra com duas falhas. */
export const falhasAoCairPorExaustao = (nivel) => (limitaExaustao(nivel) >= 4 ? 2 : 0);
