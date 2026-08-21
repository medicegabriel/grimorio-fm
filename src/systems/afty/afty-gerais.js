/**
 * HABILIDADES GERAIS — GRIMÓRIO AFTY.
 *
 * Habilidades que QUALQUER criatura pode pegar, independente da origem
 * (comum, Sem Técnica ou Restringido) e da especialização. Por isso o
 * arquivo não importa catálogo de classe nenhum: o que ele lê é ND,
 * Maestria e Patamar. A única importação é de `afty-schema.js`, o módulo
 * folha, de onde vêm os dois limiares de ND do alto nível.
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
 * 2b. **Melhoria Superior pede ND 21 e Habilidade Lendária pede ND 22**
 *    (autor, 2026-07-27), os mesmos limiares das trilhas que elas abrem. Isso
 *    é PRÉ-REQUISITO (`ndMin` + `acessoGeral`), NÃO teto de repetição: uma
 *    pega que deixou de alcançar o ND continua contada e visível, para poder
 *    ser removida. Trancar uma escolha já feita a prenderia na ficha, que é a
 *    regra "já escolhida nunca trava" dos outros cards do builder.
 * 3. **Melhoria Superior e Habilidade Lendária SÓ DESTRAVAM.** Elas não dão
 *    vaga nenhuma: o orçamento continua vindo dos níveis ímpares/pares a
 *    partir do 21/22, "do jeito que já está programado" (autor). Sem a
 *    Habilidade Geral correspondente, a trilha fica trancada mesmo no ND 21+.
 * 4. **Especialização e Aptidão são a ÚNICA fonte** de Habilidades de
 *    Especialização e de Aptidões Amaldiçoadas (autor, 2026-07-27). As duas
 *    fórmulas por ND (`1 + floor(ND/3)` nos dois casos) foram REMOVIDAS de
 *    afty-habilidades.js e afty-derive.js. Sem pegar a Geral, o orçamento é 0.
 * 5. Todo arredondamento é para baixo (regra geral do projeto).
 *
 * ⚠ Ids levam prefixo `ger_`, mesma convenção de `mel_`/`len_`/`tal_`.
 *
 * ⚠ As três primeiras descrições são o texto do autor (só os acentos que
 * faltavam foram postos). As de Melhoria Superior e Habilidade Lendária
 * foram escritas aqui: o texto original era instrução de implementação
 * ("do jeito que já está programado"), não regra para a tela.
 */

import { MELHORIA_NIVEL_INICIAL, LENDARIA_NIVEL_INICIAL } from "./afty-schema";

/** Metade da Maestria, para baixo. É o TETO DE REPETIÇÃO das duas, e o valor por
    pega só da Especialização: o da Aptidão virou o Grau em 2026-08-12. */
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
    // ⚠ O valor por pega era "1 + Metade da Maestria", igual ao da
    // Especialização, e virou "1 + Grau" em 2026-08-12 (autor). O TETO DE
    // REPETIÇÃO não mudou: continua metade da Maestria, em `maxVezesGeral`.
    nome: "Aptidão",
    descricao:
      "Fornece uma quantidade de Aptidões Amaldiçoadas adicionais igual a 1 + Grau Numérico. " +
      "Essa habilidade pode ser pega uma quantidade de vezes igual a metade da maestria do usuário.",
  },
  {
    id: "ger_melhoria_superior",
    nome: "Melhoria Superior",
    descricao: "Libera as Melhorias Superiores.",
    ndMin: MELHORIA_NIVEL_INICIAL,
  },
  {
    id: "ger_habilidade_lendaria",
    nome: "Habilidade Lendária",
    descricao: "Libera as Habilidades Lendárias.",
    ndMin: LENDARIA_NIVEL_INICIAL,
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
 * Quantas vezes a Habilidade Geral pode ser pega. SÓ o teto de repetição:
 * o pré-requisito de ND das duas de alto nível vive em `acessoGeral`.
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
 * Pré-requisito de uma Habilidade Geral. Mesmo shape de
 * `avaliarAcessoAltoNivel`: `{ ok, extras }`, com `extras` no formato que o
 * RequisitoChip do builder consome. Hoje só existe o `ndMin`, mas é aqui que
 * entra qualquer portão futuro (Patamar, Origem, outra Geral).
 * ctx = { nd }.
 */
export function acessoGeral(id, ctx = {}) {
  const nd = Math.max(1, Math.trunc(Number(ctx.nd) || 1));
  const ndMin = GERAL_BY_ID[id]?.ndMin;
  if (ndMin == null) return { ok: true, extras: [] };
  const ok = nd >= ndMin;
  return { ok, extras: [{ label: `Nível ${ndMin}`, verificavel: true, ok }] };
}

/**
 * Resolve o bloco de Habilidades Gerais da ficha.
 *
 * `creature.habilidadesGerais` é lista de ids COM REPETIÇÃO (cada entrada é
 * uma pega), mesmo shape de `melhoriasSuperiores`. O aparo no TETO é de
 * LEITURA, não gravado, convenção do projeto.
 *
 * ⚠ Pré-requisito NÃO apara: uma pega que deixou de alcançar o ND continua
 * contada, aparece em `inacessiveis` e segue gastando o contador, igual às
 * Habilidades Lendárias. Aparar aqui a esconderia da UI e a deixaria presa na
 * ficha, voltando sozinha ao subir o ND de novo.
 *
 * ctx = { nd, maestria }.
 */
export function resolveGerais(creature, ctx = {}) {
  const nd = Math.max(1, Math.trunc(Number(ctx.nd ?? creature?.core?.nd) || 1));
  const maestria = Math.max(0, Math.trunc(Number(ctx.maestria) || 0));
  const tetoCtx = { nd, maestria };

  // Teto por id, calculado uma vez: serve o aparo aqui embaixo e o medidor da UI.
  const maxVezes = Object.fromEntries(
    HABILIDADES_GERAIS.map((g) => [g.id, maxVezesGeral(g.id, tetoCtx)]),
  );

  const vezesPorId = new Map();
  const brutas = Array.isArray(creature?.habilidadesGerais) ? creature.habilidadesGerais : [];
  for (const id of brutas) {
    if (!GERAL_BY_ID[id]) continue;
    const atual = vezesPorId.get(id) ?? 0;
    if (atual >= maxVezes[id]) continue;   // apara no teto
    vezesPorId.set(id, atual + 1);
  }

  // Concessão vinda da sessão (Addons 8.3). Duas diferenças da pega comprada, e
  // as duas vêm da mesma decisão do autor ("entra de graça"):
  //   • não gasta vaga, então é contada à parte e descontada do `gastos`;
  //   • NÃO apara no teto, porque o teto é do orçamento de compra, e conceder
  //     não é comprar. O Ciclo de Adaptação concede o que a criatura não
  //     alcançaria, e essa é a razão de a primitiva existir.
  const vezesConcedidas = new Map();
  for (const id of Array.isArray(ctx.concedidos) ? ctx.concedidos : []) {
    if (!GERAL_BY_ID[id]) continue;
    vezesPorId.set(id, (vezesPorId.get(id) ?? 0) + 1);
    vezesConcedidas.set(id, (vezesConcedidas.get(id) ?? 0) + 1);
  }

  // Ordem do catálogo, não a de escolha (a UI lista o catálogo inteiro).
  const escolhidas = HABILIDADES_GERAIS
    .filter((g) => vezesPorId.has(g.id))
    .map((g) => ({ id: g.id, vezes: vezesPorId.get(g.id) }));
  const concedidasSessao = [...vezesConcedidas].reduce((s, [, n]) => s + n, 0);
  const gastos = escolhidas.reduce((s, g) => s + g.vezes, 0) - concedidasSessao;
  const vezesDe = (id) => vezesPorId.get(id) ?? 0;

  // Acesso por id, e as pegas que a criatura não alcança mais (ex.: o ND caiu).
  const acesso = Object.fromEntries(
    HABILIDADES_GERAIS.map((g) => [g.id, acessoGeral(g.id, { nd })]),
  );
  const inacessiveis = escolhidas.filter((g) => !acesso[g.id].ok).map((g) => g.id);

  // ⚠ O QUE CADA UMA CONCEDE não mora mais aqui. Em 2026-07-27 as concessões
  // foram absorvidas pelo Motor de Automação: viraram `GERAL_EFEITOS` em
  // afty-efeitos.js, nos canais `vagasHabilidade`, `vagasAptidao` e `focos`.
  // Este resolver ficou com o que é dele: quem foi pego, quantas vezes, o teto,
  // o acesso e o destravamento do Alto Nível. Calcular o ganho aqui TAMBÉM
  // daria duas fontes para a mesma regra, que é o que a absorção veio matar.

  // Alto Nível: a Habilidade Geral é o portão, o ND continua dando as vagas.
  // Uma pega inacessível não destrava (senão o pré-requisito não valeria nada).
  const abre = (id) => vezesDe(id) > 0 && acesso[id].ok;
  const destravado = {
    melhorias: abre("ger_melhoria_superior"),
    lendarias: abre("ger_habilidade_lendaria"),
  };

  return {
    escolhidas, gastos, destravado, maxVezes, acesso, inacessiveis,
    // Quantas pegas de cada id vieram da sessão, para a tela saber separar o
    // que foi comprado do que o mestre deu no meio da luta.
    concedidas: Object.fromEntries(vezesConcedidas),
  };
}
