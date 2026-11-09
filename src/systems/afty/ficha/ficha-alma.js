/**
 * ============================================================
 * A ALMA: O TESTE DE INTEGRIDADE ANTES DO DANO, A ELEGIBILIDADE DA CURA E O DESCANSO (CL2, 2026-10-30)
 * ============================================================
 * Livro p.311 e 312. Os três verbos de baixo nível (`aplicaDanoNaAlma`, `curaAlma`, `defineAlma`) continuam em `ficha-sessao.js` e
 * são o AJUSTE da barra: não pedem teste nem requisito, e por isso NÃO foram restringidos. As operações daqui são as do jogo,
 * no contrato do CL1: `(sessao, derived, entrada, pedido)` devolve `{ sessao, aplicado, ... }`, `pedido.opId` é obrigatório e
 * uma recusa devolve a mesma sessão com `erro` e `codigo`.
 *
 *   DANO NA ALMA   "sempre que sofrer Dano na Alma, você deve realizar um teste de resistência de Integridade, reduzindo o dano
 *                  pela metade em um sucesso ou anulando em um sucesso crítico." O teste vem ANTES da aplicação e considera o
 *                  total depois das defesas do tipo `alma` (leitura do CL1, pendência 4). A CD é a da FONTE do dano e o livro
 *                  não traz uma própria: a operação exige a CD, ou o resultado já rolado.
 *   CURA DA ALMA   "é necessário compreender o traçado da alma e ter Nível de Aptidão 4 em Energia Reversa. Porém, a cura é
 *                  reduzida à metade." E o traçado só se enxerga com treino em Integridade, que é requisito e não garantia: a
 *                  pessoa DECLARA `enxergaTracado`. O requisito é de QUEM CURA, e o corpo curado pode ser outro.
 *   DESCANSO       "Você recupera metade da sua vida máxima perdida com um descanso longo." É a função `recuperaAlmaPorDescanso`,
 *                  que NÃO está ligada ao botão de descanso: ele é um só e hoje não mexe na Alma. Ligar é decisão do autor
 *                  (pendência na fila).
 * ============================================================
 */
import { rolarTeste } from "./ficha-rolagem";
import { registraRolagem, curaAlma } from "./ficha-sessao";
import { aplicaDanoRecebido } from "./ficha-dano-recebido";
import { jaAplicada, comOperacao } from "./ficha-uso-estado";

const inteiro = (v, padrao = 0) => {
  const n = Math.trunc(Number(v));
  return Number.isFinite(n) ? n : padrao;
};
const recusa = (sessao, erro, codigo, extra = {}) => ({ sessao, aplicado: false, erro, codigo, ...extra });

/** O nível de Aptidão em Energia Reversa que a cura de Alma exige (p.311). */
export const NIVEL_ER_CURA_DE_ALMA = 4;

/**
 * O teste de resistência de Integridade contra uma CD. Não toca em sessão nenhuma. Sucesso crítico é sucesso com o d20 na
 * margem de crítico do teste.
 *   entrada  { cd, natural? , rng? }
 * Devolve `{ ok, tr: { resultado, sucessoCritico }, natural, total, cd, rolagem }` ou `{ ok: false, erro, codigo }`.
 */
export function testeDeIntegridade(derived, { cd, natural = null, rng = Math.random } = {}) {
  const tr = derived?.testes?.resistencias?.find((t) => t.value === "integridade");
  if (!tr) return { ok: false, erro: "Sem Teste de Integridade", codigo: "sem-integridade" };
  const dc = Number(cd);
  if (!Number.isFinite(dc)) return { ok: false, erro: "Falta a CD do Teste de Integridade", codigo: "sem-cd" };
  const margem = Math.max(2, inteiro(tr.margemCritico, 20));
  if (natural != null) {
    const n = inteiro(natural, 0);
    if (!(n >= 1 && n <= 20)) return { ok: false, erro: "Resultado do d20 Inválido", codigo: "natural-invalido" };
    const total = n + inteiro(tr.bonus, 0);
    const sucesso = total >= Math.trunc(dc);
    return { ok: true, tr: { resultado: sucesso ? "sucesso" : "falha", sucessoCritico: sucesso && n >= margem }, natural: n, total, cd: Math.trunc(dc), rolagem: null };
  }
  const r = rolarTeste({ rotulo: "Integridade", detalhe: "Dano na Alma", bonus: tr.bonus, dados: tr.dadosExtras, margem, cd: Math.trunc(dc) }, rng);
  return {
    ok: true, tr: { resultado: r.sucesso ? "sucesso" : "falha", sucessoCritico: !!r.sucesso && !!r.critico },
    natural: r.natural, total: r.total, cd: r.cd, rolagem: r,
  };
}

/**
 * Aplica um Dano na Alma, COM o teste de Integridade antes (p.311).
 *   entrada  { total, cd | tr, natural?, rng?, desempate?, rdIgnorada?, ataqueId? }
 *            `tr` é um resultado já rolado (`{ resultado, sucessoCritico }`) e dispensa a CD.
 * Retorno: o de `aplicaDanoRecebido` (modo `alma`), mais `integridade` com o teste feito.
 */
export function danoNaAlma(sessao, derived, entrada = {}, pedido = {}) {
  const opId = pedido?.opId;
  if (typeof opId !== "string" || !opId) return recusa(sessao, "Sem Identidade da Operação", "sem-opid");
  if (jaAplicada(sessao, opId)) return { sessao, aplicado: false, repetida: true };
  let tr = entrada.tr ?? null;
  let teste = null;
  if (!tr) {
    teste = testeDeIntegridade(derived, { cd: entrada.cd, natural: entrada.natural ?? null, rng: entrada.rng });
    if (!teste.ok) return recusa(sessao, teste.erro, teste.codigo);
    tr = teste.tr;
  }
  const r = aplicaDanoRecebido(sessao, derived, {
    modo: "alma", total: entrada.total, tr, desempate: entrada.desempate ?? null, rdIgnorada: entrada.rdIgnorada, ataqueId: entrada.ataqueId ?? null,
  }, pedido);
  if (!r.aplicado) return r;
  const sessaoComLog = teste?.rolagem ? registraRolagem(r.sessao, teste.rolagem) : r.sessao;
  return {
    ...r, sessao: sessaoComLog,
    integridade: teste ? { natural: teste.natural, total: teste.total, cd: teste.cd, resultado: tr.resultado, sucessoCritico: tr.sucessoCritico } : { resultado: tr.resultado, sucessoCritico: !!tr.sucessoCritico },
  };
}

/**
 * Por que QUEM CURA não pode curar uma Alma, ou `null`. `curador` é o `derived` dele (o requisito é de quem cura).
 * Treino em Integridade e Energia Reversa nível 4 são conferidos. Enxergar o traçado é declarado em `enxergaTracado`.
 */
export function bloqueioDeCuraDeAlma(curador, { enxergaTracado = false } = {}) {
  const integridade = curador?.testes?.resistencias?.find((t) => t.value === "integridade");
  if (!integridade?.prof) return "Exige Treino em Integridade";
  if (inteiro(curador?.aptidao?.efetivo?.er, 0) < NIVEL_ER_CURA_DE_ALMA) return `Exige Energia Reversa Nível ${NIVEL_ER_CURA_DE_ALMA}`;
  if (!enxergaTracado) return "Exige Compreender o Traçado da Alma";
  return null;
}

/**
 * Cura a Alma de um corpo (p.311): exige o requisito de quem cura, e a cura é reduzida à metade (piso). Devolve o TETO, como
 * `curaAlma` (a Vida corrente se cura pelos meios normais).
 *   sessao, derived  o corpo CURADO
 *   entrada          { bruto, curador (o derived de quem cura), enxergaTracado }
 * Retorno: `{ sessao, aplicado, curado, metade, ferimentoPermanenteLiberado }`. O último diz que a Vida e a Integridade
 * ficaram no máximo, o momento em que a p.314 deixa recuperar um Ferimento Complexo permanente (`recuperaFerimento`, via alma).
 */
export function curaDeAlma(sessao, derived, entrada = {}, pedido = {}) {
  const opId = pedido?.opId;
  if (typeof opId !== "string" || !opId) return recusa(sessao, "Sem Identidade da Operação", "sem-opid");
  if (jaAplicada(sessao, opId)) return { sessao, aplicado: false, repetida: true };
  if (sessao.vital?.estado === "morto") return recusa(sessao, "Corpo Morto", "morto");
  const bloqueio = bloqueioDeCuraDeAlma(entrada.curador, { enxergaTracado: entrada.enxergaTracado === true });
  if (bloqueio) return recusa(sessao, bloqueio, "curador-inelegivel");
  const bruto = Math.max(0, inteiro(entrada.bruto, 0));
  const metade = Math.floor(bruto / 2);
  if (!metade) return recusa(sessao, "Nada a Curar", "sem-cura");
  const antes = sessao.almaAtual;
  const s = curaAlma(sessao, metade, derived);
  const curado = s.almaAtual - antes;
  const cheio = s.hpAtual >= inteiro(derived?.hp, Infinity) && s.almaAtual >= inteiro(derived?.almaMax, Infinity);
  return { sessao: comOperacao(s, { id: opId, tipo: "alma:cura" }), aplicado: true, curado, metade, ferimentoPermanenteLiberado: cheio };
}

/**
 * Recupera metade do dano na alma com um descanso longo (p.311): `almaAtual` sobe metade do que falta ao máximo (piso).
 * FUNÇÃO PURA, SEM LIGAÇÃO: o botão de descanso é um só e não mexe na Alma hoje. Quando o autor decidir (pendência na fila), o
 * `descansar` chama esta função. No Player a Vida máxima segue a Alma corrente, e o PV corrente não sobe junto.
 */
export function recuperaAlmaPorDescanso(sessao, derived) {
  const max = Math.max(0, inteiro(derived?.almaMax, 0));
  const falta = Math.max(0, max - inteiro(sessao.almaAtual, 0));
  if (!falta) return sessao;
  return { ...sessao, almaAtual: Math.min(max, inteiro(sessao.almaAtual, 0) + Math.floor(falta / 2)) };
}
