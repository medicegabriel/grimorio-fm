/**
 * ============================================================
 * EQUIPAMENTO INICIAL E CONJUNTO DE MISSÃO (CX5, 2026-11-06)
 * ============================================================
 * Livro p.130. *"Um personagem inicia com: dois equipamentos de custo 1 (arma, escudo ou item especial), um uniforme comum e um
 * kit de ferramentas a sua escolha."* E, pelo grau do feiticeiro, *"um certo conjunto de equipamentos [...] gratuitamente no
 * começo de toda missão"*, em que *"caso escolha obter uma arma, uniforme, escudo ou acessório, ele será uma redução permanente do
 * seu conjunto de equipamentos enquanto estiver com ele"*.
 *
 * O orçamento por grau (`EQUIP_GANHO_POR_GRAU`) já existia e a aba o mostra, INDICATIVO por decisão do autor (2026-07-22): ele
 * conta e destaca, e não bloqueia. O que faltava era ENTREGAR o conjunto, e entregar UMA vez.
 *
 * ------------------------------------------------------------
 * COMO A ENTREGA NÃO DUPLICA
 * ------------------------------------------------------------
 * Toda entrada nasce com `uid` determinístico: `inicial_<n>` para o equipamento inicial e `<missaoId>_<n>` para cada conjunto de
 * missão. A operação pula o que já existe na ficha, então reabrir a ficha ou reenviar o mesmo pedido não cria outra cópia. As
 * entradas levam `origemEquipamento` ("inicial" ou "missao") para a tela rotular, e nada mais é mexido no inventário que já existe.
 *
 * ⚠ O EQUIPAMENTO INICIAL É DO PERSONAGEM. A ficha da criatura tem o inventário simplificado por decisão do autor (divergência
 * `inventarioSimplificado`, hoje desligada), então a operação recusa na criatura em vez de despejar itens no que é só ficha de mesa.
 *
 * ⚠ O GRAU QUE A TELA PASSA para o conjunto de missão é o do `derived.grauFeiticeiro`. Qual escala o Player usa (a do livro ou a da
 * criatura) é decisão pendente do autor, e este módulo recebe o grau pronto: a decisão, quando vier, não muda nada aqui.
 *
 * ⚠ KIT TAMBÉM VEM NO CONJUNTO: *"todos os kits de ferramentas possuem custo 1"* (p.130, na seção do ganho por grau). O kit retirado gasta uma
 * vaga de Custo 1 na retirada, e o kit que o personagem já carrega NÃO reduz o saldo seguinte, porque a frase da redução permanente
 * lista só arma, uniforme, escudo e acessório.
 *
 * ⚠ O QUE A FICHA CARREGA REDUZ O SALDO (decisão do autor, 2026-11-06): peça permanente (arma, escudo, uniforme, acessório) e também o
 * CONSUMÍVEL que sobrou da missão anterior contam contra o conjunto de cada Custo, uma vaga por unidade. As unidades já gastas na sessão
 * não contam: quem consulta o saldo passa `consumidos` (de `sessao.uso.itens.consumidos`). Kit carregado não reduz o saldo. Itens vindos
 * de Feitiço ou de produção de Interlúdio ficam fora do conjunto (não vieram do Colégio).
 * ============================================================
 */
import { sistemaDaFicha } from "./afty-sistema";
import {
  getEquipamento, custoDoEquipamento, novaEntradaEquip, orcamentoDoGrau, KITS_FERRAMENTAS, UNIFORME_MODIFICACOES,
} from "./afty-equipamentos";

const lista = (v) => (Array.isArray(v) ? v : []);
const TIPOS_DO_INICIAL = ["arma", "escudo", "item"];
const recusa = (creature, erro, codigo, extra = {}) => ({ creature, aplicado: false, erro, codigo, ...extra });

export const UID_INICIAL = (n) => `inicial_${n}`;
export const origemDaEntrada = (e) => e?.origemEquipamento ?? null;

/** O livro para no Grau Especial e a criatura tem nove degraus (autor, 2026-08-19): "especial" é a linha do Semi-Grau Especial. */
const grauNaTabelaDoConjunto = (grau) => (grau === "especial" ? "semiEspecial" : grau);

/** O que reduz o saldo do conjunto: tudo o que a ficha carrega, menos o kit (a redução permanente lista só arma, uniforme, escudo e acessório, e o consumível entra por decisão do autor). */
const contaNoConjunto = (tipo) => tipo !== "kit";

/* ============================================================ */
/* EQUIPAMENTO INICIAL                                           */
/* ============================================================ */
/**
 * Confere a escolha do equipamento inicial sem alterar nada: duas peças de Custo 1 (arma, escudo ou item especial) e um kit.
 * Devolve `{ ok, erros, itens, kit }`. O uniforme comum entra sempre.
 */
export function avaliaEquipamentoInicial(creature, escolha = {}) {
  const erros = [];
  const pedidos = lista(escolha.itens);
  if (pedidos.length !== 2) erros.push("Escolha Dois Equipamentos de Custo 1");
  const itens = [];
  for (const p of pedidos) {
    const def = TIPOS_DO_INICIAL.includes(p?.tipo) ? getEquipamento(p.tipo, p.refId, creature) : null;
    if (!def || def.evento) { erros.push("Equipamento Não Encontrado"); continue; }
    if (custoDoEquipamento(p.tipo, def) !== 1) { erros.push(`${def.nome} Não É de Custo 1`); continue; }
    itens.push({ tipo: p.tipo, refId: p.refId, def });
  }
  const kit = KITS_FERRAMENTAS.find((k) => k.id === escolha.kit) ?? null;
  if (!kit) erros.push("Escolha um Kit de Ferramentas");
  return { ok: erros.length === 0, erros: [...new Set(erros)], itens, kit };
}

/**
 * Entrega o equipamento inicial: o uniforme comum, as duas peças de Custo 1 e o kit. Uma vez só: se a ficha já tem as entradas
 * `inicial_*`, devolve `repetida` e a MESMA ficha.
 *
 *   escolha { itens: [{ tipo, refId }, { tipo, refId }], kit: "kit_ferreiro" }
 */
export function aplicaEquipamentoInicial(creature, escolha = {}) {
  if (sistemaDaFicha(creature) !== "player") return recusa(creature, "Equipamento Inicial É do Personagem", "so-personagem");
  const atuais = lista(creature?.equipamentos?.itens);
  if (atuais.some((e) => String(e?.uid ?? "").startsWith("inicial_"))) return { creature, aplicado: false, repetida: true };
  const av = avaliaEquipamentoInicial(creature, escolha);
  if (!av.ok) return recusa(creature, av.erros[0], "escolha", { erros: av.erros });
  const comum = UNIFORME_MODIFICACOES.find((u) => u.inicial);
  const novas = [
    { ...novaEntradaEquip("uniforme", comum.id, comum), uid: UID_INICIAL("uniforme"), equipado: true },
    ...av.itens.map((x, i) => ({ ...novaEntradaEquip(x.tipo, x.refId, x.def), uid: UID_INICIAL(i + 1) })),
    { ...novaEntradaEquip("kit", av.kit.id, av.kit), uid: UID_INICIAL("kit") },
  ].map((e) => ({ ...e, origemEquipamento: "inicial" }));
  return {
    creature: { ...creature, equipamentos: { ...(creature?.equipamentos ?? {}), itens: [...atuais, ...novas] } },
    aplicado: true, entregues: novas.map((e) => e.uid),
  };
}

/* ============================================================ */
/* CONJUNTO DE MISSÃO                                            */
/* ============================================================ */
/**
 * O saldo do conjunto por Custo: o que o grau concede, o que a ficha carrega (permanente e consumível, uma vaga por unidade) e o que
 * sobra para retirar. `Infinity` é o "ilimitado" do Grau Especial no Custo 1. Itens de Feitiço e de produção ficam fora, por não virem do
 * Colégio. `consumidos` é o mapa `{ [uid]: n }` da sessão, para não contar a unidade já gasta.
 */
export function saldoDoConjunto(creature, grauValue, { consumidos = {} } = {}) {
  const orcamento = orcamentoDoGrau(grauNaTabelaDoConjunto(grauValue));
  const gasto = { 1: 0, 2: 0, 3: 0, 4: 0 };
  for (const e of lista(creature?.equipamentos?.itens)) {
    if (!e || e.criadoPorFeitico || e.origemProducao) continue;
    const def = getEquipamento(e.tipo, e.refId, creature);
    if (!def || !contaNoConjunto(e.tipo)) continue;
    const custo = custoDoEquipamento(e.tipo, def);
    const unidades = Math.max(1, Math.floor(e.qtd ?? 1)) - Math.max(0, Math.floor(Number(consumidos?.[e.uid]) || 0));
    if (custo >= 1 && custo <= 4 && unidades > 0) gasto[custo] += unidades;
  }
  const saldo = {};
  for (const c of [1, 2, 3, 4]) saldo[c] = { concedido: orcamento[c], gasto: gasto[c], livre: Math.max(0, orcamento[c] - gasto[c]) };
  return saldo;
}

/**
 * Recebe o conjunto de UMA missão: itens (qualquer tipo de equipamento de custo) dentro do saldo de cada Custo. O `missaoId` é a
 * identidade: repetir o mesmo id devolve `repetida`, e nada é duplicado nem ao reabrir a ficha.
 *
 *   pedido { missaoId, grau, itens: [{ tipo, refId }], consumidos? }   (`consumidos` = `sessao.uso.itens.consumidos`)
 *
 * O orçamento continua INDICATIVO na aba (decisão de 2026-07-22), mas esta operação, que ENTREGA, respeita o saldo: pedir mais do
 * que o grau concede recusa, com o Custo que estourou.
 */
export function recebeConjuntoDeMissao(creature, pedido = {}) {
  const { missaoId, grau } = pedido;
  if (sistemaDaFicha(creature) !== "player") return recusa(creature, "Conjunto de Missão É do Personagem", "so-personagem");
  if (typeof missaoId !== "string" || !missaoId) return recusa(creature, "Sem Identificação da Missão", "sem-id");
  const atuais = lista(creature?.equipamentos?.itens);
  if (atuais.some((e) => String(e?.uid ?? "").startsWith(`${missaoId}_`))) return { creature, aplicado: false, repetida: true };
  const pedidos = lista(pedido.itens);
  if (!pedidos.length) return recusa(creature, "Escolha os Equipamentos", "sem-itens");
  const defs = [];
  for (const p of pedidos) {
    const def = p?.tipo ? getEquipamento(p.tipo, p.refId, creature) : null;
    if (!def || def.evento) return recusa(creature, "Equipamento Não Encontrado", "item-ausente");
    const custo = custoDoEquipamento(p.tipo, def);
    if (custo < 1 || custo > 4) return recusa(creature, `${def.nome} Fora da Tabela de Custo`, "custo");
    defs.push({ ...p, def, custo });
  }
  const saldo = saldoDoConjunto(creature, grau, { consumidos: pedido.consumidos });
  const retirado = { 1: 0, 2: 0, 3: 0, 4: 0 };
  for (const d of defs) retirado[d.custo] += 1;
  for (const c of [1, 2, 3, 4]) {
    if (retirado[c] > saldo[c].livre) return recusa(creature, `Passa do Conjunto de Custo ${c}`, "conjunto", { detalhe: { custo: c, livre: saldo[c].livre, pedido: retirado[c] } });
  }
  const novas = defs.map((d, i) => ({ ...novaEntradaEquip(d.tipo, d.refId, d.def), uid: `${missaoId}_${i + 1}`, origemEquipamento: "missao" }));
  return {
    creature: { ...creature, equipamentos: { ...(creature?.equipamentos ?? {}), itens: [...atuais, ...novas] } },
    aplicado: true, entregues: novas.map((e) => e.uid), saldo: saldoDoConjunto({ ...creature, equipamentos: { itens: [...atuais, ...novas] } }, grau, { consumidos: pedido.consumidos }),
  };
}
