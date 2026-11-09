/**
 * ============================================================
 * DANO RECEBIDO: TIPO, TR, RESISTÊNCIA, VULNERABILIDADE E RD, NA ORDEM DO LIVRO (CL1, 2026-10-29)
 * ============================================================
 * Três coisas DISTINTAS, e o livro as separa:
 *
 *   DANO          tem tipo e passa pelas defesas daquele tipo (p.309). O PV temporário o absorve.
 *   PERDA DE VIDA reduz o PV atual e "ao contrário de dano, não é afetado por redução de dano ou resistências"
 *                 (p.316). Não passa pela casca de PV temporário nem quebra a Guarda.
 *   DANO NA ALMA  é perda de vida e ignora o PV temporário. Passa só pelas defesas do tipo `alma` (estados da aba de Defesas e
 *                 RD a Alma) e depois pelo TR de Integridade: metade em um sucesso, nada em um sucesso crítico (p.311).
 *
 * A ORDEM DO DANO (p.309 e p.365). O `total` é o da rolagem inteira, Durante e Após somados: "reduções e resistências
 * serão aplicadas apenas uma vez" (p.307). Depois, com piso em cada divisão (p.365):
 *
 *   1. Imunidade: todo o dano é anulado, e acabou.
 *   2. As divisões e multiplicações, "primeiro ocorrem as multiplicações e divisões" (p.365): a metade do TR
 *      (o exemplo da p.365 reduz pela metade ANTES da RD), depois a Resistência (metade), depois a Vulnerabilidade
 *      (mais a metade do total, 30 vira 45).
 *   3. A Redução de Dano subtrai por último, e "ainda é aplicada no valor total que o alvo recebe" (p.309), sem
 *      deixar o dano abaixo de zero.
 *
 * ⚠ DEFESAS EM CONFLITO NÃO SÃO ESCOLHIDAS AQUI. O `resolveDefesasDano` não resolve o desempate porque o livro não o
 * escreve, e esta conta herda a decisão: o tipo com mais de um estado (Resistente e Vulnerável ao mesmo tempo) é
 * RECUSADO com o motivo, e a mesa desempata passando `desempate` ("imune", "resistente", "vulneravel" ou "nenhum").
 *
 * ⚠ ISTO É UMA ENTRADA NOVA E ADITIVA. `aplicaDano(sessao, n)` segue recebendo o valor líquido, como as três telas o
 * usam hoje, e não muda de semântica: reduzir de novo ali reduziria duas vezes. `aplicaDanoRecebido` TERMINA nos
 * verbos que já existem (`aplicaDano`, `aplicaPerdaDeVida`, `aplicaDanoNaAlma`) e devolve o que a Vida fez.
 *
 * ⚠ O SALDO NEGATIVO E AS PORTAS DA MORTE (p.313) são do CL2 e moram no estado vital: `aplicaDano` e `aplicaPerdaDeVida` o
 * registram sozinhos (`ficha-vital.js`). Este módulo continua EXPONDO o `excessoSobreZero`, o quanto passou do que havia de PV.
 * ============================================================
 */
import { aplicaDano, aplicaPerdaDeVida, aplicaDanoNaAlma, pvTempTotal } from "./ficha-sessao";
import { abreTesteDeConcentracao } from "./ficha-concentracao";
import { jaAplicada, comOperacao } from "./ficha-uso-estado";

const inteiro = (v, padrao = 0) => {
  const n = Math.trunc(Number(v));
  return Number.isFinite(n) ? n : padrao;
};
const naoNegativo = (v) => Math.max(0, inteiro(v));

export const MODOS_DE_DANO = ["dano", "perdaDeVida", "alma"];
export const DESEMPATES = ["imune", "resistente", "vulneravel", "nenhum"];

/** O passo some se não mexeu no número, para o hover mostrar só o que contou. */
const passo = (passos, id, label, de, para) => { if (de !== para) passos.push({ id, label, de, para }); return para; };

/**
 * A conta do dano de um tipo, sem tocar em sessão nenhuma.
 *   total      o dano da rolagem inteira
 *   defesa     `derived.defesasDano.porTipo[tipo]` (`{ estados, rd, conflito }`), ou nada para um alvo sem defesas
 *   tr         `{ resultado: "sucesso"|"falha", efeito: "metade"|"anula"|"nenhum" }` do TR do alvo contra o efeito
 *   desempate  a escolha da mesa quando o tipo tem estados em conflito
 *   rdIgnorada quanto de RD este ataque ignora (Penetrante, p.65), sem passar de zero
 * Devolve `{ ok, final, passos, avisos }`, ou `{ ok: false, erro, codigo }`.
 */
export function calculaDanoRecebido({ total, defesa = null, tr = null, desempate = null, rdIgnorada = 0 } = {}) {
  let valor = naoNegativo(total);
  const passos = [];
  const avisos = [];
  const base = valor;
  if (desempate != null && !DESEMPATES.includes(desempate)) return { ok: false, erro: "Desempate Desconhecido", codigo: "desempate-desconhecido" };
  let estados = defesa?.estados ?? [];
  if (defesa?.conflito) {
    if (desempate == null) return { ok: false, erro: "Defesas em Conflito", codigo: "defesa-conflito", estados };
    estados = desempate === "nenhum" ? [] : [desempate];
    avisos.push({ id: "desempate", texto: `Desempate da Mesa: ${desempate}` });
  }

  if (estados.includes("imune")) {
    valor = passo(passos, "imunidade", "Imunidade", valor, 0);
    return { ok: true, base, final: valor, passos, avisos };
  }
  if (tr && tr.resultado === "sucesso") {
    if (tr.efeito === "anula") valor = passo(passos, "tr", "TR Anula", valor, 0);
    else if (tr.efeito === "metade") valor = passo(passos, "tr", "TR Reduz à Metade", valor, Math.floor(valor / 2));
  }
  if (estados.includes("resistente")) valor = passo(passos, "resistencia", "Resistência", valor, Math.floor(valor / 2));
  if (estados.includes("vulneravel")) valor = passo(passos, "vulnerabilidade", "Vulnerabilidade", valor, valor + Math.floor(valor / 2));
  const rd = Math.max(0, naoNegativo(defesa?.rd) - naoNegativo(rdIgnorada));
  if (rd > 0) valor = passo(passos, "reducao", "Redução de Dano", valor, Math.max(0, valor - rd));
  return { ok: true, base, final: valor, passos, avisos };
}

/**
 * O Dano na Alma (p.311). Ele passa pelas defesas do tipo `alma` que o site já modela (os estados da aba de Defesas e a RD a
 * Alma, que a RD Geral não cobre, `afty-rd-alma`), e SÓ DEPOIS vem o TR de Integridade: o texto da p.311 manda o teste
 * considerar "o total após qualquer resistência ou redução", e o texto específico ganha da ordem geral da p.365 (leitura
 * minha, na pendência 4 de CL1.md). Reduz à metade em um sucesso e anula em um sucesso crítico. O PV temporário não protege,
 * e isso é do verbo que aplica (`aplicaDanoNaAlma`).
 */
export function calculaDanoNaAlma({ total, defesa = null, tr = null, desempate = null, rdIgnorada = 0 } = {}) {
  let valor = naoNegativo(total);
  const passos = [];
  const avisos = [];
  const base = valor;
  if (desempate != null && !DESEMPATES.includes(desempate)) return { ok: false, erro: "Desempate Desconhecido", codigo: "desempate-desconhecido" };
  let estados = defesa?.estados ?? [];
  if (defesa?.conflito) {
    if (desempate == null) return { ok: false, erro: "Defesas em Conflito", codigo: "defesa-conflito", estados };
    estados = desempate === "nenhum" ? [] : [desempate];
    avisos.push({ id: "desempate", texto: `Desempate da Mesa: ${desempate}` });
  }
  if (estados.includes("imune")) {
    valor = passo(passos, "imunidade", "Imunidade", valor, 0);
    return { ok: true, base, final: valor, passos, avisos };
  }
  if (estados.includes("resistente")) valor = passo(passos, "resistencia", "Resistência", valor, Math.floor(valor / 2));
  if (estados.includes("vulneravel")) valor = passo(passos, "vulnerabilidade", "Vulnerabilidade", valor, valor + Math.floor(valor / 2));
  const rd = Math.max(0, naoNegativo(defesa?.rd) - naoNegativo(rdIgnorada));
  if (rd > 0) valor = passo(passos, "reducao", "Redução de Dano", valor, Math.max(0, valor - rd));
  if (tr?.resultado === "sucesso") {
    valor = tr.sucessoCritico
      ? passo(passos, "integridade", "Integridade Anula", valor, 0)
      : passo(passos, "integridade", "Integridade Reduz à Metade", valor, Math.floor(valor / 2));
  }
  return { ok: true, base, final: valor, passos, avisos };
}

const almaEhPilha = (derived) => derived?.almaPilha ?? derived?.sistema === "player";

/** A mesma conta pode ser consultada antes de qualquer consequência. */
export function preparaDanoRecebido(derived, entrada = {}) {
  const modo = entrada.tipo === "alma" ? "alma" : (entrada.modo ?? "dano");
  if (!MODOS_DE_DANO.includes(modo)) return { ok: false, erro: "Modo de Dano Desconhecido", codigo: "modo-desconhecido" };
  const porTipo = derived?.defesasDano?.porTipo;
  if (modo === "dano" && entrada.tipo != null && porTipo && !(entrada.tipo in porTipo)) {
    return { ok: false, erro: "Tipo de Dano Desconhecido", codigo: "tipo-desconhecido" };
  }
  const parametros = { ...entrada, defesa: porTipo?.[modo === "alma" ? "alma" : entrada.tipo] ?? null };
  const calculo = modo === "dano" ? calculaDanoRecebido(parametros)
    : modo === "alma" ? calculaDanoNaAlma(parametros)
      : { ok: true, base: naoNegativo(entrada.total), final: naoNegativo(entrada.total), passos: [], avisos: [] };
  if (!calculo.ok) return { ok: false, erro: calculo.erro, codigo: calculo.codigo, calculo };
  const reacao = entrada.reducaoReacao;
  if (modo === "dano" && reacao) {
    calculo.final = passo(calculo.passos, reacao.id, reacao.nome, calculo.final, Math.max(0, calculo.final - naoNegativo(reacao.valor)));
  }
  return { ok: true, modo, calculo };
}

/**
 * Aplica o dano recebido na sessão, UMA vez. `entrada`:
 *   modo     "dano" (padrão), "perdaDeVida" ou "alma". O tipo "alma" vai sempre para "alma"
 *   total, tipo, tr, desempate, rdIgnorada   ver `calculaDanoRecebido`
 *   concentracao: false   não abre o teste de concentração (p.320: receber dano o exige)
 * `pedido.opId` é obrigatório e repetir o id devolve `repetida` sem aplicar. Recusa devolve a MESMA sessão.
 *
 * Retorno: `{ sessao, aplicado, calculo, mudou: { vida, casca, alma }, excessoSobreZero, abateu, teste?, evento }`.
 */
export function aplicaDanoRecebido(sessao, derived, entrada = {}, pedido = {}) {
  const opId = pedido?.opId;
  if (typeof opId !== "string" || !opId) return { sessao, aplicado: false, erro: "Sem Identidade da Operação", codigo: "sem-opid" };
  if (jaAplicada(sessao, opId)) return { sessao, aplicado: false, repetida: true };
  const prova = preparaDanoRecebido(derived, entrada);
  if (!prova.ok) return { sessao, aplicado: false, erro: prova.erro, codigo: prova.codigo, ...(prova.calculo ? { calculo: prova.calculo } : {}) };
  const { modo, calculo } = prova;

  const antes = sessao;
  const hpAntes = Math.max(0, inteiro(antes.hpAtual));
  const cascaAntes = pvTempTotal(antes);
  const final = calculo.final;
  let s = antes;
  if (final > 0) {
    /* `entrada.ataqueId` agrupa as instâncias tipadas de UM ataque: o estado vital conta uma falha por dano e um Ferimento
       Complexo por ataque, e não por tipo de dano (CL2, p.313). */
    if (modo === "dano") s = aplicaDano(s, final, derived, { ataqueId: entrada.ataqueId ?? null });
    else if (modo === "perdaDeVida") s = aplicaPerdaDeVida(s, final, derived);
    else s = aplicaDanoNaAlma(s, final, derived);
  }
  const casca = cascaAntes - pvTempTotal(s);
  const excessoSobreZero = modo === "dano" ? Math.max(0, final - casca - hpAntes)
    : modo === "perdaDeVida" ? Math.max(0, final - hpAntes)
      : (almaEhPilha(derived) ? Math.max(0, final - hpAntes) : 0);
  const mudou = { vida: s.hpAtual - antes.hpAtual, casca: pvTempTotal(s) - cascaAntes, alma: s.almaAtual - antes.almaAtual };
  const abateu = hpAntes > 0 && s.hpAtual <= 0;

  let teste = null;
  if (modo === "dano" && final > 0 && entrada.concentracao !== false) {
    const t = abreTesteDeConcentracao(s, "dano", { valor: final });
    if (t.aplicado) { s = t.sessao; teste = t.teste; }
  }
  s = comOperacao(s, { id: opId, tipo: `dano:${modo}` });
  return {
    sessao: s, aplicado: true, calculo, mudou, excessoSobreZero, abateu, ...(teste ? { teste } : {}),
    evento: { tipo: modo === "perdaDeVida" ? "perda" : modo === "alma" ? "dano-alma" : "dano", tipoDano: entrada.tipo ?? null, base: calculo.base, final, passos: calculo.passos, mudou, abateu },
  };
}
