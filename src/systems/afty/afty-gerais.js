/**
 * HABILIDADES GERAIS — GRIMÓRIO AFTY.
 *
 * Habilidades que QUALQUER criatura pode pegar, independente da origem
 * (comum, Sem Técnica ou Restringido) e da especialização. Por isso o
 * arquivo não importa catálogo de classe nenhum: o que ele lê é ND,
 * Maestria e Patamar.
 *
 * Regras confirmadas pelo autor (2026-07-26):
 *
 * 1. **Contador ÚNICO com os Feitiços.** As Habilidades Gerais e os Feitiços
 *    gastam o MESMO caixa, `contadorHabilidades(maestria, patamar)` =
 *    dobro da Maestria, +2 no Desafio, +4 na Calamidade, e o TRIPLO da
 *    Maestria (no lugar do dobro, sem somar o +4) no Beyond.
 *    ⚠ Isso SUBSTITUIU o antigo `totalFeiticos(nd)` (2 + ND/2 + marcos de
 *    10 e 20), que deixou de existir em afty-feiticos.js.
 * 2. **Repetíveis com teto próprio.** Especialização e Aptidão saem metade
 *    da Maestria de vezes; Treinamentos sai 1 + ND/10 de vezes ("só uma vez
 *    a cada 10 níveis", com a primeira valendo desde o ND 1); Melhoria
 *    Superior e Habilidade Lendária são uma vez só.
 * 3. **Melhoria Superior e Habilidade Lendária SÓ DESTRAVAM.** Elas não dão
 *    vaga nenhuma: o orçamento continua vindo dos níveis ímpares/pares a
 *    partir do 21/22, "do jeito que já está programado" (autor). Sem a
 *    Habilidade Geral correspondente, a trilha fica trancada mesmo no ND 21+.
 * 4. Todo arredondamento é para baixo (regra geral do projeto).
 *
 * ⚠ Ids levam prefixo `ger_`, mesma convenção de `mel_`/`len_`/`tal_`.
 *
 * ⚠ As três primeiras descrições são o texto do autor (só os acentos que
 * faltavam foram postos). As de Melhoria Superior e Habilidade Lendária
 * foram escritas aqui: o texto original era instrução de implementação
 * ("do jeito que já está programado"), não regra para a tela.
 */

/** Metade da Maestria, para baixo. Aparece nos dois lados de Especialização e Aptidão. */
export const metadeMaestria = (maestria) => Math.floor(Math.max(0, maestria) / 2);

export const HABILIDADES_GERAIS = [
  {
    id: "ger_especializacao",
    nome: "Especialização",
    descricao:
      "Fornece uma quantidade de Habilidades de Especialização adicionais igual a 1 + Metade da " +
      "Maestria. Essa habilidade pode ser pega uma quantidade de vezes igual a metade da maestria " +
      "do usuário.",
  },
  {
    id: "ger_aptidao",
    nome: "Aptidão",
    descricao:
      "Fornece uma quantidade de Aptidões Amaldiçoadas adicionais igual a 1 + Metade da Maestria. " +
      "Essa habilidade pode ser pega uma quantidade de vezes igual a metade da maestria do usuário.",
  },
  {
    id: "ger_melhoria_superior",
    nome: "Melhoria Superior",
    descricao: "Libera as Melhorias Superiores.",
  },
  {
    id: "ger_habilidade_lendaria",
    nome: "Habilidade Lendária",
    descricao: "Libera as Habilidades Lendárias.",
  },
  {
    id: "ger_treinamentos",
    nome: "Treinamentos",
    descricao:
      "Recebe uma quantidade de Focos de Interlúdio igual a metade do ND. Essa habilidade pode ser " +
      "pega repetidamente. Porém só uma vez a cada 10 Níveis.",
  },
];

export const GERAL_BY_ID = Object.fromEntries(HABILIDADES_GERAIS.map((g) => [g.id, g]));

export const getHabilidadeGeral = (id) => GERAL_BY_ID[id] ?? null;

/**
 * Contador de Habilidades da aba: caixa único de Feitiços + Habilidades Gerais.
 * Beyond troca o dobro pelo TRIPLO (não soma o +4 da Calamidade).
 */
export function contadorHabilidades(maestria, patamar) {
  const m = Math.max(0, Math.trunc(Number(maestria) || 0));
  if (patamar === "beyond") return 3 * m;
  const bonus = patamar === "calamidade" ? 4 : patamar === "desafio" ? 2 : 0;
  return 2 * m + bonus;
}

/**
 * Quantas vezes a Habilidade Geral pode ser pega.
 * ctx = { nd, maestria }.
 */
export function maxVezesGeral(id, ctx = {}) {
  const nd = Math.max(1, Math.trunc(Number(ctx.nd) || 1));
  const maestria = Math.max(0, Math.trunc(Number(ctx.maestria) || 0));
  switch (id) {
    case "ger_especializacao":
    case "ger_aptidao":
      return metadeMaestria(maestria);
    case "ger_treinamentos":
      return 1 + Math.floor(nd / 10);
    default:
      return 1;   // Melhoria Superior e Habilidade Lendária
  }
}

/**
 * Resolve o bloco de Habilidades Gerais da ficha.
 *
 * `creature.habilidadesGerais` é lista de ids COM REPETIÇÃO (cada entrada é
 * uma pega), mesmo shape de `melhoriasSuperiores`. O aparo no teto é de
 * LEITURA, não gravado, convenção do projeto.
 *
 * ctx = { nd, maestria }.
 */
export function resolveGerais(creature, ctx = {}) {
  const nd = Math.max(1, Math.trunc(Number(ctx.nd ?? creature?.core?.nd) || 1));
  const maestria = Math.max(0, Math.trunc(Number(ctx.maestria) || 0));
  const tetoCtx = { nd, maestria };

  const vezesPorId = new Map();
  const brutas = Array.isArray(creature?.habilidadesGerais) ? creature.habilidadesGerais : [];
  for (const id of brutas) {
    if (!GERAL_BY_ID[id]) continue;
    const atual = vezesPorId.get(id) ?? 0;
    if (atual >= maxVezesGeral(id, tetoCtx)) continue;   // apara no teto
    vezesPorId.set(id, atual + 1);
  }

  // Ordem do catálogo, não a de escolha (a UI lista o catálogo inteiro).
  const escolhidas = HABILIDADES_GERAIS
    .filter((g) => vezesPorId.has(g.id))
    .map((g) => ({ id: g.id, vezes: vezesPorId.get(g.id) }));
  const gastos = escolhidas.reduce((s, g) => s + g.vezes, 0);
  const vezesDe = (id) => vezesPorId.get(id) ?? 0;

  // Especialização e Aptidão rendem o mesmo por pega: 1 + metade da Maestria.
  const ganhoPorVez = 1 + metadeMaestria(maestria);
  const ganhos = {
    habilidades: vezesDe("ger_especializacao") * ganhoPorVez,
    aptidoes: vezesDe("ger_aptidao") * ganhoPorVez,
    focos: vezesDe("ger_treinamentos") * Math.floor(nd / 2),
  };

  // Alto Nível: a Habilidade Geral é o portão, o ND continua dando as vagas.
  const destravado = {
    melhorias: vezesDe("ger_melhoria_superior") > 0,
    lendarias: vezesDe("ger_habilidade_lendaria") > 0,
  };

  // Teto por id, pronto para o medidor da UI não recalcular.
  const maxVezes = Object.fromEntries(
    HABILIDADES_GERAIS.map((g) => [g.id, maxVezesGeral(g.id, tetoCtx)]),
  );

  return { escolhidas, gastos, ganhos, destravado, maxVezes };
}
