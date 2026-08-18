/**
 * ============================================================
 * TREINOS ESPECIAIS — GRIMÓRIO AFTY (Interlúdios Adicionais)
 * ============================================================
 * A terceira família de Interlúdio, ao lado das 12 Linhas de
 * Treinamento (`afty-treinamentos.js`). Vem da regra de
 * **Interlúdios Adicionais**, Livro do Narrador p. 22.
 *
 * Diferença de desenho para uma Linha de Treinamento: a Linha tem
 * 4 etapas SEQUENCIAIS com pré-requisito e um bônus de Completo.
 * Um Treino Especial não tem etapa nenhuma. Ele é uma escolha
 * REPETÍVEL: cada pega custa Foco e concede uma coisa.
 *
 * ⚠ Decisões do autor (2026-08-18), respondendo perguntas deste chat:
 *
 * 1. **Sucesso automático.** O texto do livro manda rolar quatro
 *    testes e guardar os sucessos entre interlúdios. Para CRIATURA
 *    isso não é rolado: vale a regra já registrada em afty-status.md
 *    ("qualquer interlúdio que peça teste é sucesso automático").
 *    Por isso não existe contador de sucessos, nem treino em
 *    andamento, nem o atributo escolhido: nada disso muda número.
 *    Escolher o Treino Especial já concede o resultado.
 * 2. **1 Foco por pega**, e não o interlúdio inteiro (2 Focos).
 *    Cabe junto de uma etapa de 1ª/2ª/3ª no mesmo interlúdio.
 * 3. **O Feitiço vem em VAGA EXCLUSIVA** (canal `vagasFeitico`), a
 *    mesma que a Lendária Dominância em Técnica concede: o Feitiço
 *    obtido não gasta o contador comum de Habilidades, e a vaga não
 *    serve para Habilidade Geral.
 * 4. **A CD do texto estava errada.** O autor escreveu "12 + seu
 *    Bônus de Treinamento" e corrigiu no mesmo dia para
 *    **12 + metade do seu Nível**, igual à do Treinamento para
 *    Habilidade. A `descricao` abaixo já leva a correção. Como o
 *    teste é sucesso automático, a CD não entra em conta nenhuma
 *    hoje: ela vive só no texto.
 *
 * ⚠ TETO DE REPETIÇÃO POR ND (autor, 2026-08-18): `1 + piso(ND / N)`,
 * com o N declarado em `vezesACada`. Feitiço tem N 5 (ND 5 = 2,
 * ND 10 = 3, ND 15 = 4) e Habilidade tem N 10 (ND 10 = 2, ND 20 = 3,
 * ND 30 = 4). Não param: o ND do Afty não tem teto. O aparo é de
 * LEITURA, então baixar o ND devolve a pega excedente em vez de
 * apagá-la da ficha.
 *
 * ⚠ FALTA o **Estudos**, que continua como cartão "em breve" na aba:
 * o que existe dele é paráfrase de uma sessão antiga, e texto de
 * regra vem verbatim. Entra aqui como DADO, sem tocar em código,
 * assim que o autor mandar o texto. O **Treinamento para Habilidade**
 * já existe, mas a `descricao` dele ainda é a mesma paráfrase antiga:
 * o autor mandou construir o Treino antes de mandar o texto.
 *
 * `alvo` na instância: nenhum Treino Especial usa hoje (a vaga de
 * Feitiço é genérica, quem escolhe o Feitiço é a aba Habilidades).
 * O campo nasce junto porque Estudos vai precisar dele: "tornar-se
 * especialista numa perícia" nomeia a perícia.
 * ============================================================
 */

/** Uma pega de Treino Especial custa isto em Focos, salvo a entrada dizer outro. */
export const FOCOS_POR_TREINO_ESPECIAL = 1;

export const AFTY_TREINOS_ESPECIAIS = [
  {
    id: "tes_feitico",
    nome: "Treinamento para Feitiço",
    focos: 1,
    // Teto: 1 + 1 a cada 5 ND (autor, 2026-08-18). ND 5 = 2, ND 10 = 3,
    // ND 15 = 4, e daí para cima sem fim, porque o ND do Afty não tem teto.
    vezesACada: 5,
    concede: "Vaga de Feitiço",
    descricao:
      "Focar seu Interlúdio em Treinamento de Feitiço significa buscar novos conhecimentos e " +
      "praticar certas capacidades de sua técnica. Porém, desenvolver uma habilidade nem sempre " +
      "é fácil.\n\n" +
      "Ao escolher a opção de Treinamento de Feitiço, você pode começar a aprender um Feitiço de " +
      "um Nível que você possua acesso, você deve escolher um dos seus atributos e descrever como " +
      "é o treino. Você deve realizar quatro testes usando o atributo escolhido e, caso suceda em " +
      "pelo menos três deles, você obterá o Novo Feitiço. A dificuldade do teste é igual a 12 + " +
      "metade do seu Nível.\n\n" +
      "Caso não consiga completar o treinamento, você mantém os seus sucessos, podendo tentar " +
      "novamente em outro interlúdio.",
    efeitos: [{ canal: "vagasFeitico", expr: "1" }],
  },

  {
    id: "tes_habilidade",
    nome: "Treinamento para Habilidade",
    focos: 1,
    // Teto: 1 + 1 a cada 10 ND (autor, 2026-08-18). ND 10 = 2, ND 20 = 3,
    // ND 30 = 4. Bate com o texto antigo da aba ("até o 9º nível, uma
    // habilidade adicional por essa via, a partir do 10º mais uma").
    vezesACada: 10,
    concede: "Vaga de Habilidade",
    // ⚠ TEXTO AINDA NÃO VERBATIM. Esta descrição é a paráfrase que estava no
    // cartão "em breve" da aba desde 2026-07-2X, reflowada e sem os
    // ponto-e-vírgula. Ela NÃO foi conferida contra o livro, e o autor mandou
    // construir o Treino antes de mandar o texto. Trocar pelo verbatim assim
    // que ele chegar: está anotado em docs/a-fazer.md.
    descricao:
      "Escolher uma habilidade de especialização cujos requisitos você atende como objetivo do " +
      "treino. São quatro testes de um atributo, com dificuldade igual a 12 + metade do seu " +
      "Nível, e três sucessos concluem o treinamento.",
    efeitos: [{ canal: "vagasHabilidade", expr: "1" }],
  },
];

const BY_ID = Object.fromEntries(AFTY_TREINOS_ESPECIAIS.map((t) => [t.id, t]));

export const getTreinoEspecial = (id) => BY_ID[id] ?? null;

/** Focos de UMA pega. */
export const focosDoTreinoEspecial = (def) =>
  Math.max(0, Math.trunc(Number(def?.focos ?? FOCOS_POR_TREINO_ESPECIAL) || 0));

/** O ND da ficha, lido igual ao `deriveAfty` (piso 1). */
const ndDaFicha = (creature) => Math.max(1, Math.trunc(Number(creature?.core?.nd) || 1));

/**
 * Teto de repetição, por ND. `vezesACada: N` no catálogo vira `1 + piso(ND/N)`,
 * e a conta é DADO porque as duas entradas só diferem no N (5 no Feitiço, 10 na
 * Habilidade). Mesmo desenho do `maxVezesGeral`: a regra mora no resolver, e o
 * catálogo só declara o número.
 *
 * `maxVezes` fixo continua atendido, e `null` é sem teto (o Foco é o limite).
 * Nenhuma entrada usa os dois hoje, mas os dois caminhos ficam porque um teto
 * fixo é a forma mais provável do próximo Treino Especial.
 */
export function maxVezesTreinoEspecial(id, ctx = {}) {
  const def = BY_ID[id];
  if (!def) return 0;
  if (def.vezesACada == null) return def.maxVezes ?? null;
  const nd = Math.max(1, Math.trunc(Number(ctx.nd) || 1));
  return 1 + Math.floor(nd / def.vezesACada);
}

/**
 * Normaliza a lista da ficha para `[{ id, alvo }]`, uma entrada por pega.
 * Descarta id desconhecido e shape errado, e apara no teto de quem tem.
 * O aparo é de LEITURA, não gravado, convenção do projeto: baixar o ND devolve
 * a pega excedente em vez de apagá-la da ficha.
 *
 * Aceita a entrada em string crua (`"tes_feitico"`) além do objeto, porque é o
 * shape que teria uma ficha gravada no formato das Habilidades Gerais. Custa
 * uma linha e evita perder a pega calada.
 */
export function normalizeTreinosEspeciais(lista, ctx = {}) {
  if (!Array.isArray(lista)) return [];
  const vezes = new Map();
  const out = [];
  for (const bruto of lista) {
    const id = typeof bruto === "string" ? bruto : bruto?.id;
    const def = BY_ID[id];
    if (!def) continue;
    const teto = maxVezesTreinoEspecial(id, ctx);
    const jaTem = vezes.get(id) ?? 0;
    if (teto != null && jaTem >= teto) continue;
    vezes.set(id, jaTem + 1);
    const alvo = (typeof bruto === "object" && bruto?.alvo) ? String(bruto.alvo) : null;
    out.push({ id, alvo });
  }
  return out;
}

/** As pegas válidas de uma ficha, já aparadas no teto do ND dela. */
const instanciasDa = (creature) =>
  normalizeTreinosEspeciais(creature?.treinosEspeciais, { nd: ndDaFicha(creature) });

/** Quantas vezes cada Treino Especial foi pego: `{ [id]: n }`. */
export function vezesPorTreinoEspecial(creature) {
  const out = {};
  for (const inst of instanciasDa(creature)) {
    out[inst.id] = (out[inst.id] || 0) + 1;
  }
  return out;
}

/** O teto de cada Treino Especial nesta ficha: `{ [id]: n | null }`. */
export function tetosDeTreinoEspecial(creature) {
  const nd = ndDaFicha(creature);
  return Object.fromEntries(
    AFTY_TREINOS_ESPECIAIS.map((t) => [t.id, maxVezesTreinoEspecial(t.id, { nd })]),
  );
}

/**
 * Focos gastos em Treinos Especiais. Irmão do `focosGastos` das Linhas de
 * Treinamento, e as duas somas entram no MESMO orçamento do cabeçalho da aba.
 */
export function focosDeTreinosEspeciais(creature) {
  let total = 0;
  for (const inst of instanciasDa(creature)) {
    total += focosDoTreinoEspecial(BY_ID[inst.id]);
  }
  return total;
}

/**
 * Efeitos no vocabulário do Motor de Automação, uma emissão por pega. Mesmo
 * shape do `efeitosDeTreino`: `origem`/`nome` alimentam o detalhamento da UI,
 * então a vaga concedida aparece nomeada no hover de fontes.
 *
 * ⚠ Entra pela lista MONTANTE do deriveAfty, junto do `efeitosDeTreino`, e não
 * pela `efeitosTodos`: o que ele emite é VAGA DE ORÇAMENTO, lida antes de os
 * stats existirem.
 */
export function efeitosDeTreinoEspecial(creature) {
  const out = [];
  for (const inst of instanciasDa(creature)) {
    const def = BY_ID[inst.id];
    for (const ef of def.efeitos || []) {
      const alvo = ef.alvo ?? inst.alvo ?? null;
      out.push({ ...ef, ...(alvo ? { alvo } : {}), origem: def.id, nome: def.nome });
    }
  }
  return out;
}

/**
 * Validador de conteúdo (mesmo papel do `validarCatalogoAptidoes`): ids únicos
 * e na convenção, nomes únicos, custo em Foco positivo e todo efeito com canal
 * e expressão. Devolve a lista de problemas, vazia quando está tudo certo.
 */
export function validarCatalogoTreinosEspeciais() {
  const problemas = [];
  const ids = new Set();
  const nomes = new Set();
  for (const t of AFTY_TREINOS_ESPECIAIS) {
    if (!t.id || !t.id.startsWith("tes_")) problemas.push(`id fora da convenção tes_: ${t.id}`);
    if (ids.has(t.id)) problemas.push(`id repetido: ${t.id}`);
    ids.add(t.id);
    if (nomes.has(t.nome)) problemas.push(`nome repetido: ${t.nome}`);
    nomes.add(t.nome);
    if (!t.descricao) problemas.push(`${t.id} sem descrição`);
    if (!t.concede) problemas.push(`${t.id} sem rótulo do que concede`);
    if (focosDoTreinoEspecial(t) < 1) problemas.push(`${t.id} sem custo em Foco`);
    if (t.maxVezes != null && t.maxVezes < 1) problemas.push(`${t.id} com maxVezes inválido`);
    if (t.vezesACada != null && t.vezesACada < 1) problemas.push(`${t.id} com vezesACada inválido`);
    if (t.maxVezes != null && t.vezesACada != null) {
      problemas.push(`${t.id} declara maxVezes e vezesACada, e o segundo ganharia calado`);
    }
    for (const ef of t.efeitos || []) {
      if (!ef.canal) problemas.push(`${t.id} com efeito sem canal`);
      if (!ef.expr) problemas.push(`${t.id} com efeito sem expressão`);
    }
  }
  return problemas;
}
