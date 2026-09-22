/**
 * ============================================================
 * TITÃ (COLOSSO) — GRIMÓRIO AFTY
 * ============================================================
 * Regra do livro, cujo exemplo é o Mechamaru Supremo: um inimigo Colossal de
 * pelo menos 20 metros de altura pode ser um Titã. A Vida Máxima dobra, e o
 * dobro se divide entre os MEMBROS do corpo (2 braços, 2 pernas e o torso, 5
 * por padrão), cada um com a própria barra. A CABEÇA fica de fora da divisão e
 * guarda o dobro inteiro: acertar a cabeça é sempre crítico (desde que acerte),
 * e só a morte dela mata o Titã. Um membro que chega a 0 fica desabilitado
 * (penalidade de membro perdido) e só regenera se a criatura já regenera
 * membros, com o custo em dobro.
 *
 * Primitiva `titaColosso` (afty-addons.js): mostra o card no criador e o painel
 * na Ficha Final. O NÚMERO (dobro, divisão) é sempre calculado por
 * `resolveTita`, e o ESTADO de combate (a vida corrente de cada parte) mora na
 * SESSÃO (ficha-sessao.js), no mesmo espírito do PV corrente comum.
 *
 * ⚠ A altura não é um campo da ficha (só a categoria de Tamanho existe): o
 * mínimo de 20 metros e o resto do texto não numérico (crítico na cabeça,
 * penalidade de membro perdido, regeneração em dobro, morte só pela cabeça)
 * são conferidos na mesa. A UI só mostra o lembrete.
 */

export const TITA_MEMBROS_PADRAO = 5;
export const TITA_NOMES_PADRAO = ["Braço Esquerdo", "Braço Direito", "Perna Esquerda", "Perna Direita", "Torso"];

export function createBlankTita() {
  return { ativo: false, membros: TITA_MEMBROS_PADRAO };
}

/** Normaliza `creature.tita` na leitura, sem gravar nada. */
export function titaDaFicha(creature) {
  const t = creature?.tita;
  if (!t || typeof t !== "object") return createBlankTita();
  return {
    ativo: !!t.ativo,
    membros: Math.max(1, Math.trunc(Number(t.membros) || TITA_MEMBROS_PADRAO)),
  };
}

/** O nome de exibição do membro de índice `i` (0-based). */
export function nomeDoMembroTita(i, membros) {
  if (membros === TITA_MEMBROS_PADRAO && TITA_NOMES_PADRAO[i]) return TITA_NOMES_PADRAO[i];
  return `Membro ${i + 1}`;
}

/**
 * Os números do Titã, a partir da Vida Máxima já fechada (`hpCheio`, ANTES do
 * Dano na Alma: o máximo de um Titã não pode encolher com ele tomando dano).
 *
 * "Dobrar a vida máxima [...] dividi-la pela quantidade de membros [...]
 * excluindo a cabeça, que terá a vida inteira": a CABEÇA fica com o DOBRO
 * inteiro, e cada membro fica com o dobro dividido pela contagem.
 */
export function resolveTita(creature, hpCheio) {
  const t = titaDaFicha(creature);
  if (!t.ativo) return { ativo: false, membros: t.membros, dobro: 0, cabecaMax: 0, membroMax: 0, nomes: [] };
  const dobro = Math.max(0, Math.round(Number(hpCheio) || 0) * 2);
  const membroMax = Math.max(1, Math.floor(dobro / t.membros));
  return {
    ativo: true,
    membros: t.membros,
    dobro,
    cabecaMax: dobro,
    membroMax,
    nomes: Array.from({ length: t.membros }, (_, i) => nomeDoMembroTita(i, t.membros)),
  };
}
