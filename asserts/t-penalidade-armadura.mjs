/**
 * PENALIDADE DE ARMADURA no Motor de Automação (autor, 2026-09-11).
 *
 * Pedido: *"coloque no Motor de Automação a Penalidade de Armadura fornecida por
 * Escudos e Uniformes. Para eu fazer habilidades que aumentem ou diminuam ela"*.
 * As quatro regras, todas respondidas por pergunta:
 *
 *   1. valor positivo ALIVIA, negativo aumenta;
 *   2. o total PARA EM ZERO e nunca vira bônus;
 *   3. um aumento vale SEMPRE, mesmo sem nada equipado;
 *   4. vale nos dois sistemas.
 *
 * ------------------------------------------------------------
 * O QUE ESTE ARQUIVO PRENDE
 * ------------------------------------------------------------
 * 1. O canal existe e mora no grupo das perícias do seletor.
 * 2. A conta das quatro regras, nos dois sistemas.
 * 3. Só as perícias de Destreza sentem.
 * 4. As parcelas FECHAM com o total, nas duas listas (Ficha e perícia), e o
 *    encantamento que reduz (Polido) é parcela própria.
 */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const EF = await import(R + "afty-efeitos.js");
const EQ = await import(R + "afty-equipamentos.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

/* ============================================================ */
/* 1. O CANAL                                                    */
/* ============================================================ */
t("o canal existe", EF.EFEITO_CANAIS.find((c) => c.id === "penalidadeArmadura")?.label, "Penalidade de Armadura");
t("sem alvo", !!EF.EFEITO_CANAIS.find((c) => c.id === "penalidadeArmadura")?.alvo, false);
t("no grupo das perícias",
  EF.EFEITO_CANAL_GRUPOS.find((g) => g.label === "Perícias e Resistências")?.itens.some((c) => c.id === "penalidadeArmadura"),
  true);
t("nenhum canal sobrou sem grupo", EF.canaisSemGrupo(), []);

/* ============================================================ */
/* 2. A CONTA, NOS DOIS SISTEMAS                                 */
/* ============================================================ */
const UNIF = EQ.catalogoDoTipo("uniforme").find((u) => (u.penalidade ?? 0) <= -2);
// Penalidade de -3 para baixo: o Polido reduz 2, e sobra penalidade para as
// parcelas existirem. Num escudo de -2 o total vai a zero e a lista sai vazia.
const ESC = EQ.catalogoDoTipo("escudo").find((e) => (e.penalidade ?? 0) <= -3);
t("o catálogo tem um uniforme com penalidade", !!UNIF, true);
t("e um escudo com penalidade", !!ESC, true);
const U = UNIF.penalidade;

const ficha = (sistema, { itens = [], motor = [] } = {}) => {
  const f = createBlankAfty();
  f.rulesVersion = sistema;
  f.core = { ...f.core, nd: 10, tecnicaEfeitos: motor };
  f.equipamentos = { itens };
  return f;
};
const uniforme = () => ({ uid: "u1", tipo: "uniforme", refId: UNIF.id, qtd: 1, equipado: true });
const motor = (expr) => [{ canal: "penalidadeArmadura", expr: String(expr) }];
const pen = (sistema, opcoes) => deriveAfty(ficha(sistema, opcoes)).penalidadeDestreza;

for (const s of ["afty", "player"]) {
  t(`${s}: só o uniforme`, pen(s, { itens: [uniforme()] }), U);
  t(`${s}: +1 alivia`, pen(s, { itens: [uniforme()], motor: motor(1) }), Math.min(0, U + 1));
  t(`${s}: -2 aumenta`, pen(s, { itens: [uniforme()], motor: motor(-2) }), U - 2);
  t(`${s}: alívio maior que a penalidade para em zero`, pen(s, { itens: [uniforme()], motor: motor(99) }), 0);
  t(`${s}: sem nada equipado, um aumento vale`, pen(s, { motor: motor(-2) }), -2);
  t(`${s}: sem nada equipado, um alívio não vira bônus`, pen(s, { motor: motor(3) }), 0);
  t(`${s}: sem nada, nada`, pen(s, {}), 0);
}

/* ============================================================ */
/* 3. SÓ AS PERÍCIAS DE DESTREZA                                 */
/* ============================================================ */
const pericia = (d, id) => d.testes.pericias.find((p) => p.id === id);
const semNada = deriveAfty(ficha("player"));
const comMenos2 = deriveAfty(ficha("player", { motor: motor(-2) }));
t("Acrobacia é de Destreza", pericia(semNada, "acrobacia").atributo, "destreza");
t("Acrobacia sente os -2", pericia(comMenos2, "acrobacia").bonus - pericia(semNada, "acrobacia").bonus, -2);
t("Atletismo não é de Destreza", pericia(semNada, "atletismo").atributo !== "destreza", true);
t("e não sente", pericia(comMenos2, "atletismo").bonus, pericia(semNada, "atletismo").bonus);

/* ============================================================ */
/* 4. AS PARCELAS FECHAM                                         */
/* ============================================================ */
const soma = (partes) => partes.reduce((s, p) => s + p.valor, 0);
const dMisto = deriveAfty(ficha("player", { itens: [uniforme()], motor: motor(-2) }));
t("Ficha: as parcelas fecham com o total", soma(dMisto.partes.penalidadeDestreza), dMisto.penalidadeDestreza);
t("Ficha: o uniforme é parcela", dMisto.partes.penalidadeDestreza.some((p) => p.label === UNIF.nome && p.valor === U), true);
t("Ficha: o efeito do Motor é parcela com o nome dele",
  dMisto.partes.penalidadeDestreza.some((p) => p.label === "Técnica" && p.valor === -2), true);
const acroMisto = pericia(dMisto, "acrobacia").partes;
t("perícia: os itens juntos em Armadura e Escudo", acroMisto.some((p) => p.label === "Armadura e Escudo" && p.valor === U), true);
t("perícia: o Motor com o nome dele", acroMisto.some((p) => p.label === "Técnica" && p.valor === -2), true);
/* ⚠ O TESTE DE RITUAL tira a penalidade inteira da Prestidigitação quando a
   Naturalidade com Rituais troca Destreza por Inteligência, e ele acha as
   parcelas pela marca `penalidade`, e não mais pelo rótulo. O que ele precisa é
   isto: as marcadas somam a penalidade toda, e só elas são marcadas. */
const prest = pericia(dMisto, "prestidigitacao");
t("Prestidigitação é de Destreza", prest.atributo, "destreza");
t("as parcelas marcadas somam a penalidade toda", soma(prest.partes.filter((p) => p.penalidade)), dMisto.penalidadeDestreza);
t("e só elas são marcadas", prest.partes.filter((p) => p.penalidade).map((p) => p.label), ["Armadura e Escudo", "Técnica"]);
t("aparada em zero, a Ficha não tem parcela",
  deriveAfty(ficha("player", { itens: [uniforme()], motor: motor(99) })).partes.penalidadeDestreza, []);
t("aparada em zero, a perícia também não",
  pericia(deriveAfty(ficha("player", { itens: [uniforme()], motor: motor(99) })), "acrobacia").partes
    .some((p) => p.label === "Armadura e Escudo"),
  false);

/* O Polido reduz a penalidade do escudo em 2, e é fonte com nome. */
const polido = { uid: "e1", tipo: "escudo", refId: ESC.id, qtd: 1, equipado: true,
  fa: { grau: "quarto", encantamentos: ["enc_esc_polido"], habilidadeUnica: "" } };
const dPolido = deriveAfty(ficha("player", { itens: [polido] }));
const reducao = Math.min(0, ESC.penalidade + 2) - ESC.penalidade;
t("o Polido reduz", dPolido.penalidadeDestreza, Math.min(0, ESC.penalidade + 2));
t("o escudo é parcela com a penalidade da tabela",
  dPolido.partes.penalidadeDestreza.some((p) => p.label === ESC.nome && p.valor === ESC.penalidade), true);
if (dPolido.penalidadeDestreza !== 0) {
  t("o Polido é parcela própria",
    dPolido.partes.penalidadeDestreza.some((p) => p.label === "Polido" && p.valor === reducao), true);
  t("e as parcelas fecham", soma(dPolido.partes.penalidadeDestreza), dPolido.penalidadeDestreza);
}

/* ============================================================ */
if (bad.length) {
  console.log(`FALHAS (${bad.length}):`);
  for (const b of bad) console.log("  " + b);
  process.exit(1);
}
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
