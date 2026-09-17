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
 * ⚠ NO JOGADOR O TESTE É ROLADO, e a ficha anota a tentativa (autor,
 * 2026-09-16: "falta espaço para colocar Quantos Interludios foram
 * gastos. Além de verdadeiramente quantas Habilidades ou Feitiços foram
 * ganhos"). A pega da lista deixa de ser o Interlúdio e passa a ser só
 * o GANHO, e o que mais a linha guarda mora em
 * `treinoEspecialProgresso[id]`:
 *
 *   interludios   os Interlúdios gastos, que SÃO os Focos gastos
 *                 ("Interludio e Foco é a mesma coisa")
 *   sucessos      os da tentativa que não completou, até um a menos
 *                 que `sucessosNecessarios`
 *
 * A vaga continua saindo das pegas, então o Motor, a concessão e o
 * registro de Addons não mudam. Ver as divergências `interludioComTeste`
 * e `tetoDeTreinoEspecial`.
 *
 * ⚠ FALTA o **Estudos**, que continua como cartão "em breve" na aba:
 * o que existe dele é paráfrase de uma sessão antiga, e texto de
 * regra vem verbatim. Entra aqui como DADO, sem tocar em código,
 * assim que o autor mandar o texto. O texto do **Treinamento para
 * Habilidade** chegou em 2026-09-16.
 *
 * `alvo` na instância: nenhum Treino Especial usa hoje (a vaga de
 * Feitiço é genérica, quem escolhe o Feitiço é a aba Habilidades).
 * O campo nasce junto porque Estudos vai precisar dele: "tornar-se
 * especialista numa perícia" nomeia a perícia.
 * ============================================================
 */

import { registrarFamilia, remendarLista, partirId, nivelDaFicha } from "./afty-addons";
import { evalNumber, validateExpression } from "./afty-dsl";
import { sistemaDaFicha, regraDo } from "./afty-sistema";

/** Uma pega de Treino Especial custa isto em Focos, salvo a entrada dizer outro. */
export const FOCOS_POR_TREINO_ESPECIAL = 1;

/* Os três campos que só o jogador lê, e os três são DADO porque um Addon pode
   querer outro número:

   `sucessosNecessarios`  quantos sucessos completam o treino. Sem ele a linha
                          não guarda sucesso nenhum.
   `cdTeste`              a CD, em expressão do Motor com `nd` sendo o Nível.
                          Sem ela a linha não mostra CD.
   `tetoJogador`          a escada do teto, degrau a degrau: vale o último
                          `nivel` alcançado, e `max: null` é sem teto. Sem ela o
                          jogador usa a conta da criatura. */
export const AFTY_TREINOS_ESPECIAIS = [
  {
    id: "tes_feitico",
    nome: "Treinamento para Feitiço",
    focos: 1,
    // Teto: 1 + 1 a cada 5 ND (autor, 2026-08-18). ND 5 = 2, ND 10 = 3,
    // ND 15 = 4, e daí para cima sem fim, porque o ND do Afty não tem teto.
    vezesACada: 5,
    // No jogador não há teto (autor, 2026-09-16, "Sem teto").
    tetoJogador: [{ nivel: 1, max: null }],
    sucessosNecessarios: 3,
    cdTeste: "12 + piso(nd / 2)",
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
    // No jogador vale a letra do texto: 1 até o 9° nível e 2 do 10° em diante,
    // sem subir mais (autor, 2026-09-16, "Máximo 2").
    tetoJogador: [{ nivel: 1, max: 1 }, { nivel: 10, max: 2 }],
    sucessosNecessarios: 3,
    cdTeste: "12 + piso(nd / 2)",
    concede: "Vaga de Habilidade",
    // Verbatim, enviado pelo autor em 2026-09-16.
    descricao:
      "O Treinamento já é uma opção presente no Livro Básico. Entretanto, este treinamento " +
      "adiciona mais uma possibilidade, oferecendo uma nova maneira de desenvolvimento e " +
      "crescimento.\n\n" +
      "Ao escolher a opção do Treinamento para Habilidade, você deve escolher uma habilidade de " +
      "especialização cujos requisitos sejam atendidos, transformando-a no objetivo do seu " +
      "treinamento. Logo após, você deve escolher um dos seus atributos e descrever como é o " +
      "treino, realizando quatro testes de habilidade com o atributo escolhido. Os testes possuem " +
      "CD igual a 12 + metade do seu nível, e o personagem deve suceder em pelo menos três deles " +
      "para completar o seu treinamento.\n\n" +
      "Caso não consiga completar o treinamento, você mantém os seus sucessos, podendo tentar " +
      "novamente em outro interlúdio.\n\n" +
      "Um personagem pode obter apenas uma habilidade adicional a partir desse treinamento até o " +
      "9° nível. A partir do 10° nível, pode obter uma habilidade a mais.",
    efeitos: [{ canal: "vagasHabilidade", expr: "1" }],
  },
];

/* ============================================================ */
/* ADDONS                                                        */
/* ============================================================ */
/* Sexta família (2026-08-20), irmã da de Treinamentos. */

let BY_ID = {};

const TREINOS_ESPECIAIS_BASE = AFTY_TREINOS_ESPECIAIS.slice();

function aplicarExtrasTreinosEspeciais(extras = [], remendos = null) {
  AFTY_TREINOS_ESPECIAIS.splice(0, AFTY_TREINOS_ESPECIAIS.length, ...remendarLista(TREINOS_ESPECIAIS_BASE, remendos), ...extras);
  BY_ID = Object.fromEntries(AFTY_TREINOS_ESPECIAIS.map((t) => [t.id, t]));
}

aplicarExtrasTreinosEspeciais();

registrarFamilia("treinosEspeciais", {
  rotulo: "Treino Especial",
  chave: "id",
  // `concede` é o chip da linha e `focos` é o preço: o validador do raw cobra
  // os dois, então cobrar aqui dá a mensagem melhor, antes de instalar.
  obrigatorios: ["nome", "descricao", "concede", "focos"],
  aplicar: aplicarExtrasTreinosEspeciais,
  basicos: () => TREINOS_ESPECIAIS_BASE,
  validador: validarCatalogoTreinosEspeciais,
  resolver: (id) => getTreinoEspecial(id),
  // Lista COM repetição (`[{ id, alvo }]`), uma entrada por pega.
  idsDaFicha: (c) => (Array.isArray(c?.treinosEspeciais)
    ? c.treinosEspeciais.map((t) => (typeof t === "string" ? t : t?.id)).filter(Boolean)
    : []),
});


export const getTreinoEspecial = (id) => BY_ID[id] ?? null;

/** Focos de UMA pega. */
export const focosDoTreinoEspecial = (def) =>
  Math.max(0, Math.trunc(Number(def?.focos ?? FOCOS_POR_TREINO_ESPECIAL) || 0));

/** O ND da ficha, lido igual ao `deriveAfty` (piso 1). */
const ndDaFicha = (creature) => nivelDaFicha(creature);

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
  const nd = Math.max(1, Math.trunc(Number(ctx.nd) || 1));
  /* ⚠ `ctx.sistema` decide a régua. Sem ele cai na da criatura, que é o que
     o `regraDo` devolve para sistema desconhecido. */
  if (regraDo(ctx.sistema, "tetoDeTreinoEspecial") === "player" && Array.isArray(def.tetoJogador)) {
    return tetoDaEscada(def.tetoJogador, nd);
  }
  if (def.vezesACada == null) return def.maxVezes ?? null;
  return 1 + Math.floor(nd / def.vezesACada);
}

/** O `max` do último degrau alcançado. Nenhum degrau alcançado é teto zero. */
function tetoDaEscada(escada, nd) {
  let teto = 0;
  for (const degrau of escada) {
    if (nd >= degrau.nivel) teto = degrau.max ?? null;
  }
  return teto;
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
  normalizeTreinosEspeciais(creature?.treinosEspeciais, {
    nd: ndDaFicha(creature),
    sistema: sistemaDaFicha(creature),
  });

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
  const ctx = { nd: ndDaFicha(creature), sistema: sistemaDaFicha(creature) };
  return Object.fromEntries(
    AFTY_TREINOS_ESPECIAIS.map((t) => [t.id, maxVezesTreinoEspecial(t.id, ctx)]),
  );
}

/** Quantos sucessos uma tentativa incompleta guarda: um a menos que o necessário. */
export const maxSucessosGuardados = (def) =>
  Math.max(0, Math.trunc(Number(def?.sucessosNecessarios) || 0) - 1);

const inteiroNaoNegativo = (v) => Math.max(0, Math.trunc(Number(v) || 0));

/**
 * O que a linha do jogador mostra: `{ interludios, sucessos, ganhos }`.
 *
 * ⚠ OS INTERLÚDIOS NUNCA FICAM ABAIXO DOS GANHOS. Cada Ganho é pelo menos uma
 * tentativa, e a ficha de jogador anterior a 2026-09-16 tem pegas e nenhum
 * Interlúdio anotado. Ler o gravado cru a deixaria com Ganhos sem Interlúdio e
 * com os Focos daquelas pegas devolvidos ao orçamento, calados.
 */
export function progressoTreinoEspecial(creature, id) {
  const def = BY_ID[id];
  if (!def) return { interludios: 0, sucessos: 0, ganhos: 0 };
  const bruto = creature?.treinoEspecialProgresso?.[id];
  const ganhos = vezesPorTreinoEspecial(creature)[id] ?? 0;
  return {
    interludios: Math.max(inteiroNaoNegativo(bruto?.interludios), ganhos * focosDoTreinoEspecial(def)),
    sucessos: Math.min(inteiroNaoNegativo(bruto?.sucessos), maxSucessosGuardados(def)),
    ganhos,
  };
}

/** A CD do teste, pelo Nível da ficha. `null` quando a entrada não declara CD. */
export function cdDoTreinoEspecial(def, creature) {
  if (!def?.cdTeste) return null;
  return evalNumber(def.cdTeste, { nd: ndDaFicha(creature) }, null);
}

/**
 * Focos gastos em Treinos Especiais. Irmão do `focosGastos` das Linhas de
 * Treinamento, e as duas somas entram no MESMO orçamento do cabeçalho da aba.
 *
 * ⚠ No jogador o gasto são os Interlúdios anotados, e não as pegas: três
 * Feitiços podem ter custado nove. Ver a divergência `interludioComTeste`.
 */
export function focosDeTreinosEspeciais(creature) {
  if (regraDo(sistemaDaFicha(creature), "interludioComTeste") === "player") {
    return AFTY_TREINOS_ESPECIAIS
      .reduce((total, def) => total + progressoTreinoEspecial(creature, def.id).interludios, 0);
  }
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
export function efeitosDeTreinoEspecial(creature, concedidos = []) {
  const out = [];
  // ⚠ O CONCEDIDO PELA SESSÃO (Addons 8.3) entra por FORA do `instanciasDa`, e
  // não somado na lista da ficha antes de normalizar. São duas razões:
  //   • ele não apara no `maxVezes`, porque o teto é do orçamento de compra e
  //     conceder não é comprar (mesma regra das Gerais e das Melhorias);
  //   • ele não pode gastar Foco, e o `focosDeTreinosEspeciais` conta a lista
  //     da ficha. Ficando de fora dela, o orçamento nem fica sabendo.
  const pegas = [
    ...instanciasDa(creature),
    ...(Array.isArray(concedidos) ? concedidos : [])
      .map((c) => (typeof c === "string" ? { id: c, alvo: null } : { id: c?.id, alvo: c?.alvo ?? null }))
      .filter((c) => BY_ID[c.id]),
  ];
  for (const inst of pegas) {
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
    /* ⚠ A convenção `tes_` vale para o RAW, e o id de Addon vem com o namespace
       na frente (`minha-mesa:tes_novo`), então a checagem olha o id SEM ele.
       Sem isto, todo Treino Especial de addon seria reprovado pela convenção de
       nome do livro, que não é assunto dele. Achado em 2026-08-20, ao ligar a
       família ao registro: era a única checagem de convenção de id do sistema. */
    const idProprio = partirId(t.id).id;
    if (!idProprio || !idProprio.startsWith("tes_")) problemas.push(`id fora da convenção tes_: ${t.id}`);
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
    if (t.sucessosNecessarios != null && !(Number.isInteger(t.sucessosNecessarios) && t.sucessosNecessarios >= 1)) {
      problemas.push(`${t.id} com sucessosNecessarios inválido`);
    }
    // A CD só conhece o Nível: um nome a mais cairia no fallback e a linha perderia a CD calada.
    if (t.cdTeste != null && !validateExpression(t.cdTeste, new Set(["nd"])).ok) {
      problemas.push(`${t.id} com cdTeste inválida`);
    }
    if (t.tetoJogador != null) {
      const escada = Array.isArray(t.tetoJogador) ? t.tetoJogador : [];
      const degrausOk = escada.length > 0 && escada.every((d, i) =>
        Number.isInteger(d?.nivel) && d.nivel >= 1
        && (i === 0 || d.nivel > escada[i - 1].nivel)
        && (d.max == null || (Number.isInteger(d.max) && d.max >= 0)));
      if (!degrausOk) problemas.push(`${t.id} com tetoJogador inválido`);
    }
  }
  return problemas;
}
