// CX3, frente Aptidões e Treinos (Claude). Livro de Regras 2.5.2, p.174 a 179.
// Números puros de Absorção Elemental (p.175) e do alcance de Expandir Aura (p.179).
// FOLHA: zero imports, de propósito. Quem precisa de catálogo ou de sessão importa
// este arquivo, nunca o contrário (ver "Ordem de módulos" no CLAUDE.md).

const inteiro = (v) => Math.max(0, Math.trunc(Number(v) || 0));

/* ============================================================ */
/* ABSORÇÃO ELEMENTAL, p.175                                     */
/* ============================================================ */
/** O estado de combate que guarda o tipo absorvido, valor falso quando não há carga. */
export const ESTADO_ABSORCAO_ELEMENTAL = "absorcaoElemental";

/** Id da pendência de CL1 e do uso. Um id fixo é o que torna a carga NÃO cumulativa. */
export const ID_ABSORCAO_ELEMENTAL = "absorcao_elemental";

/**
 * "Xd6 de dano do mesmo tipo. X é igual ao seu Nível de Aptidão em Aura. [...] No Nível de
 * Aptidão em Aura 3, o dado aumenta para d8, no nível 5, aumenta para d10."
 * A escada é desta Aptidão (6, 8, 10 em 1, 3, 5) e não a da Aura Elemental (4, 6, 8, 10 em 1, 2, 3, 5).
 */
export const facesAbsorcaoElemental = (au) => {
  const n = inteiro(au);
  return n >= 5 ? 10 : n >= 3 ? 8 : 6;
};

/** Quantos dados: X = Nível de Aptidão em Aura. */
export const dadosAbsorcaoElemental = (au) => inteiro(au);

/**
 * O grupo de dano da carga, no mesmo formato dos grupos que `aplicarAptidoesNoDano` monta
 * (Aura Elemental, Afinidade Ampliada). Os dados entram no golpe e dobram no crítico, como os
 * demais dados de dano adicionais, e o tipo é o absorvido, nunca o da arma.
 */
export function grupoDanoAbsorcaoElemental({ au, tipo } = {}) {
  const dados = dadosAbsorcaoElemental(au);
  if (!tipo || typeof tipo !== "string" || dados < 1) return null;
  return {
    nome: "Absorção Elemental", dados, faces: facesAbsorcaoElemental(au), fixo: 0,
    momento: "durante", multiplica: true, tipoDano: tipo,
  };
}

/* ============================================================ */
/* EXPANDIR AURA, p.179                                          */
/* ============================================================ */
export const ID_EXPANDIR_AURA = "expandir_aura";

/** "Para cada rodada após a primeira, você deve pagar mais 1 ponto de energia." */
export const CUSTO_EXPANDIR_AURA = { ativar: 2, manter: 1 };

/**
 * As Aptidões de Aura PASSIVAS que o Livro dá com um alcance em metros. Só entram as que escrevem
 * o número no próprio texto. Cada linha guarda a página impressa de onde veio.
 */
export const ALCANCES_DE_AURA_PASSIVA = {
  aura_chamativa: { base: 4.5, pagina: 174, texto: "dentro de 4,5 metros de você" },
  aura_do_bastiao: { base: 4.5, pagina: 174, texto: "dentro de 4,5 metros de você" },
  aura_macabra: { base: 1.5, pagina: 177, texto: "dentro de 1,5 metros de você" },
};

/** Quem tem alcance e a p.177 proíbe expandir: "não pode ser aumentada por Expandir Aura". */
export const AURAS_QUE_NAO_EXPANDEM = {
  aura_movedica: { pagina: 177, motivo: "A Área Não Pode Ser Aumentada por Expandir Aura" },
};

/**
 * Aura Movediça escalona por Nível de Aptidão em Aura (p.177): 1,5 m, 3 m a partir do 2,
 * 4,5 m a partir do 4 e 6 m a partir do 5. Fica fora da expansão, mas o número entra na lista
 * para o alcance mostrado ser o do Livro.
 */
export const alcanceDaAuraMovedica = (au) => {
  const n = inteiro(au);
  return n >= 5 ? 6 : n >= 4 ? 4.5 : n >= 2 ? 3 : 1.5;
};

/** "dobrando o alcance de todas as suas aptidões de aura passivas". */
export const dobraAlcance = (base) => Math.round(Number(base) * 2 * 100) / 100;
