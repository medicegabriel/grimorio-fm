/**
 * CX5: EQUIPAMENTO INICIAL E CONJUNTO DE MISSÃO (Livro p.130).
 *
 * Entregar o que o livro diz, UMA vez: o uniforme comum, dois equipamentos de Custo 1 e um kit; e, por grau, o conjunto de cada
 * missão, em que peça permanente reduz o saldo enquanto estiver com o personagem. O orçamento da aba continua indicativo, mas a
 * entrega respeita o saldo. Nada duplica ao reabrir a ficha, e a ficha da criatura não recebe nada.
 */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const EQ = await import(R + "afty-equipamentos.js");
const INI = await import(R + "afty-equipamento-inicial.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

const ficha = (sistema, itens = [], nd = 1) => {
  const f = createBlankAfty();
  f.rulesVersion = sistema;
  f.core = { ...f.core, nd, tipo: "misto", patamar: "comum", origem: { id: "inato" } };
  f.equipamentos = { itens };
  return f;
};
const ESPADA = { tipo: "arma", refId: "arm_espada_longa" };
const ESCUDO = { tipo: "escudo", refId: "esc_leve" };
const PEROLA = { tipo: "item", refId: "it_perola_carregada" };
const BRACELETE = { tipo: "item", refId: "it_bracelete_do_vigor" };
const SIMBOLO2 = { tipo: "item", refId: "it_simbolo_de_vida_florescente" };
const entrada = (uid, tipo, refId, extra = {}) => ({ uid, tipo, refId, qtd: 1, equipado: false, ...extra });

/* ------------------------------------------------------------ A. Avaliar a escolha */
{
  const f = ficha("player");
  const a = (escolha) => INI.avaliaEquipamentoInicial(f, escolha);
  t("duas peças de Custo 1 e um kit passam", a({ itens: [ESPADA, PEROLA], kit: "kit_ferreiro" }).ok, true);
  t("item especial de Custo 1 vale, acessório também", a({ itens: [{ tipo: "item", refId: "it_chaveiro_canalizador" }, ESCUDO], kit: "kit_alquimia" }).ok, true);
  t("uma só peça", a({ itens: [ESPADA], kit: "kit_ferreiro" }).erros, ["Escolha Dois Equipamentos de Custo 1"]);
  t("três peças", a({ itens: [ESPADA, PEROLA, ESCUDO], kit: "kit_ferreiro" }).erros, ["Escolha Dois Equipamentos de Custo 1"]);
  t("peça de Custo 2", a({ itens: [ESPADA, BRACELETE], kit: "kit_ferreiro" }).erros, ["Bracelete do Vigor Não É de Custo 1"]);
  t("sem kit", a({ itens: [ESPADA, PEROLA] }).erros, ["Escolha um Kit de Ferramentas"]);
  t("kit que não existe", a({ itens: [ESPADA, PEROLA], kit: "kit_nada" }).erros, ["Escolha um Kit de Ferramentas"]);
  t("uniforme ou kit não contam como peça", a({ itens: [{ tipo: "uniforme", refId: "unif_comum" }, { tipo: "kit", refId: "kit_ferreiro" }], kit: "kit_ferreiro" }).erros, ["Equipamento Não Encontrado"]);
  t("peça que não existe", a({ itens: [ESPADA, { tipo: "arma", refId: "arm_nada" }], kit: "kit_ferreiro" }).erros, ["Equipamento Não Encontrado"]);
  t("a Relíquia de Evento não é do Colégio", a({ itens: [ESPADA, { tipo: "item", refId: "evento_yamata_pingente_amaterasu" }], kit: "kit_ferreiro" }).erros, ["Equipamento Não Encontrado"]);
}

/* ------------------------------------------------------------ B. Entregar o equipamento inicial */
{
  const f = ficha("player");
  const r = INI.aplicaEquipamentoInicial(f, { itens: [ESPADA, PEROLA], kit: "kit_ferreiro" });
  t("entrega quatro entradas", [r.aplicado, r.entregues], [true, ["inicial_uniforme", "inicial_1", "inicial_2", "inicial_kit"]]);
  t("o uniforme comum nasce vestido", r.creature.equipamentos.itens.find((e) => e.uid === "inicial_uniforme").equipado, true);
  t("com as peças e o kit no lugar", r.creature.equipamentos.itens.map((e) => [e.tipo, e.refId]), [["uniforme", "unif_comum"], ["arma", "arm_espada_longa"], ["item", "it_perola_carregada"], ["kit", "kit_ferreiro"]]);
  t("cada entrada diz de onde veio", r.creature.equipamentos.itens.every((e) => INI.origemDaEntrada(e) === "inicial"), true);
  t("a ficha original não muda", f.equipamentos.itens.length, 0);
  const de = deriveAfty(r.creature);
  t("o derive enxerga as quatro", de.equip.entradas.length, 4);
  t("Carga: uniforme comum 0, espada 1, Pérola 0,5 e kit 1", de.carga.espacosUsados, 2.5);
  t("o custo gasto é o das duas peças e do kit", de.equip.custoGasto[1], 3);

  const de2 = INI.aplicaEquipamentoInicial(r.creature, { itens: [ESPADA, PEROLA], kit: "kit_ferreiro" });
  t("entregar de novo devolve repetida e a mesma ficha", [de2.aplicado, de2.repetida, de2.creature === r.creature], [false, true, true]);
  const reaberta = JSON.parse(JSON.stringify(r.creature));
  t("reabrir a ficha não duplica", INI.aplicaEquipamentoInicial(reaberta, { itens: [ESCUDO, PEROLA], kit: "kit_alquimia" }).repetida, true);
  t("e o inventário segue com quatro", reaberta.equipamentos.itens.length, 4);

  const comAntigo = ficha("player", [entrada("velho", "item", "it_simbolo_da_vida", { qtd: 3 })]);
  const preservado = INI.aplicaEquipamentoInicial(comAntigo, { itens: [ESPADA, PEROLA], kit: "kit_ferreiro" });
  t("o inventário que já existia é preservado", [preservado.creature.equipamentos.itens[0].uid, preservado.creature.equipamentos.itens[0].qtd, preservado.creature.equipamentos.itens.length], ["velho", 3, 5]);

  const invalida = INI.aplicaEquipamentoInicial(f, { itens: [ESPADA], kit: "kit_ferreiro" });
  t("escolha inválida recusa e devolve a mesma ficha", [invalida.aplicado, invalida.erro, invalida.creature === f], [false, "Escolha Dois Equipamentos de Custo 1", true]);

  const criatura = INI.aplicaEquipamentoInicial(ficha("afty"), { itens: [ESPADA, PEROLA], kit: "kit_ferreiro" });
  t("a criatura não recebe equipamento inicial", [criatura.aplicado, criatura.erro], [false, "Equipamento Inicial É do Personagem"]);
}

/* ------------------------------------------------------------ C. O saldo do conjunto por grau */
{
  const vazio = ficha("player");
  t("Quarto Grau concede dois itens de Custo 1", Object.values(INI.saldoDoConjunto(vazio, "quarto")).map((s) => s.concedido), [2, 0, 0, 0]);
  t("Terceiro: três de Custo 1 e um de Custo 2", Object.values(INI.saldoDoConjunto(vazio, "terceiro")).map((s) => s.concedido), [3, 1, 0, 0]);
  t("Segundo: três, dois e um", Object.values(INI.saldoDoConjunto(vazio, "segundo")).map((s) => s.concedido), [3, 2, 1, 0]);
  t("Primeiro: três, três, dois e um", Object.values(INI.saldoDoConjunto(vazio, "primeiro")).map((s) => s.concedido), [3, 3, 2, 1]);
  const especial = INI.saldoDoConjunto(vazio, "semiEspecial");
  t("o nome \"especial\" do item cai na mesma linha", INI.saldoDoConjunto(vazio, "especial")[2].concedido, 4);
  t("Grau Especial: Custo 1 ilimitado, quatro, três e dois", [Number.isFinite(especial[1].concedido), especial[2].concedido, especial[3].concedido, especial[4].concedido], [false, 4, 3, 2]);
  t("e o ilimitado nunca acaba", especial[1].livre === Infinity, true);

  const porte = ficha("player", [
    entrada("a", "arma", "arm_espada_longa"), entrada("b", "item", "it_bracelete_do_vigor"), entrada("c", "item", "it_perola_carregada", { qtd: 5 }),
    entrada("d", "arma", "arm_adaga", { criadoPorFeitico: "f1" }), entrada("e", "arma", "arm_katana", { origemProducao: "prod_x" }), entrada("k", "kit", "kit_ferreiro"),
  ]);
  const s = INI.saldoDoConjunto(porte, "terceiro");
  t("a peça permanente e o consumível reduzem o saldo do Custo deles, uma vaga por unidade (espada 1 mais cinco Pérolas)", [s[1].gasto, s[1].livre, s[2].gasto, s[2].livre], [6, 0, 1, 0]);
  t("kit, item de Feitiço e item de produção ficam fora da conta", s[1].gasto, 6);
  t("a unidade já consumida na sessão não conta", INI.saldoDoConjunto(porte, "terceiro", { consumidos: { c: 4 } })[1].gasto, 2);
  t("consumir mais do que tinha não deixa o saldo negativo", INI.saldoDoConjunto(porte, "terceiro", { consumidos: { c: 99 } })[1].gasto, 1);
}

/* ------------------------------------------------------------ D. Receber o conjunto de uma missão */
{
  const f = ficha("player", [entrada("a", "arma", "arm_espada_longa")], 6);
  const r1 = INI.recebeConjuntoDeMissao(f, { missaoId: "missao_1", grau: "terceiro", itens: [PEROLA, PEROLA, SIMBOLO2] });
  t("Terceiro Grau com uma espada: livres 2 de Custo 1 e 1 de Custo 2", [r1.aplicado, r1.entregues], [true, ["missao_1_1", "missao_1_2", "missao_1_3"]]);
  t("as entradas dizem que vieram da missão", r1.creature.equipamentos.itens.slice(1).every((e) => e.origemEquipamento === "missao"), true);
  const estouro = INI.recebeConjuntoDeMissao(f, { missaoId: "missao_2", grau: "terceiro", itens: [PEROLA, PEROLA, PEROLA] });
  t("três de Custo 1 passam do saldo livre (2)", [estouro.aplicado, estouro.erro, estouro.detalhe, estouro.creature === f], [false, "Passa do Conjunto de Custo 1", { custo: 1, livre: 2, pedido: 3 }, true]);
  const repete = INI.recebeConjuntoDeMissao(r1.creature, { missaoId: "missao_1", grau: "terceiro", itens: [PEROLA] });
  t("o mesmo id de missão não entrega de novo", [repete.aplicado, repete.repetida, repete.creature === r1.creature], [false, true, true]);
  t("nem depois de reabrir", INI.recebeConjuntoDeMissao(JSON.parse(JSON.stringify(r1.creature)), { missaoId: "missao_1", grau: "terceiro", itens: [PEROLA] }).repetida, true);

  // Peça permanente da missão anterior reduz o saldo da seguinte.
  const m1 = INI.recebeConjuntoDeMissao(f, { missaoId: "missao_a", grau: "terceiro", itens: [ESCUDO, BRACELETE] });
  t("peça permanente entregue entra na conta", INI.saldoDoConjunto(m1.creature, "terceiro")[1].livre, 1);
  const m2 = INI.recebeConjuntoDeMissao(m1.creature, { missaoId: "missao_b", grau: "terceiro", itens: [PEROLA, PEROLA] });
  t("a missão seguinte tem menos para retirar", [m2.aplicado, m2.erro], [false, "Passa do Conjunto de Custo 1"]);
  t("o consumível entregue REDUZ o saldo (decisão do autor): espada mais duas Pérolas", INI.saldoDoConjunto(r1.creature, "terceiro")[1].gasto, 3);
  t("e a Pérola já gasta na sessão devolve a vaga", INI.saldoDoConjunto(r1.creature, "terceiro", { consumidos: { missao_1_1: 1, missao_1_2: 1 } })[1].gasto, 1);
  const reabastece = INI.recebeConjuntoDeMissao(r1.creature, { missaoId: "missao_3", grau: "terceiro", itens: [PEROLA, PEROLA] });
  t("com as duas Pérolas ainda na mochila a retirada seguinte não cabe", [reabastece.aplicado, reabastece.erro], [false, "Passa do Conjunto de Custo 1"]);
  const gastou = { missaoId: "missao_3", grau: "terceiro", itens: [PEROLA, PEROLA], consumidos: { missao_1_1: 1, missao_1_2: 1 } };
  t("depois de gastar as duas, cabe de novo", INI.recebeConjuntoDeMissao(r1.creature, gastou).aplicado, true);

  t("sem identificação da missão", INI.recebeConjuntoDeMissao(f, { grau: "terceiro", itens: [PEROLA] }).codigo, "sem-id");
  t("sem itens", INI.recebeConjuntoDeMissao(f, { missaoId: "m", grau: "terceiro", itens: [] }).codigo, "sem-itens");
  // p.130: "todos os kits de ferramentas possuem custo 1", na seção do ganho por grau.
  const comKit = INI.recebeConjuntoDeMissao(f, { missaoId: "m_kit", grau: "terceiro", itens: [{ tipo: "kit", refId: "kit_ferreiro" }, PEROLA] });
  t("o kit vem no conjunto e gasta uma vaga de Custo 1", [comKit.aplicado, comKit.entregues.length], [true, 2]);
  const kitsDemais = INI.recebeConjuntoDeMissao(f, { missaoId: "m_kit2", grau: "terceiro", itens: [{ tipo: "kit", refId: "kit_ferreiro" }, { tipo: "kit", refId: "kit_alquimia" }, PEROLA] });
  t("três vagas de Custo 1 já passam do saldo livre (2)", kitsDemais.erro, "Passa do Conjunto de Custo 1");
  t("o kit que o personagem já carrega NÃO reduz o saldo da missão seguinte (só a espada e a Pérola contam)", INI.saldoDoConjunto(comKit.creature, "terceiro")[1].gasto, 2);
  t("a criatura não recebe conjunto", INI.recebeConjuntoDeMissao(ficha("afty"), { missaoId: "m", grau: "terceiro", itens: [PEROLA] }).codigo, "so-personagem");
  const especial = INI.recebeConjuntoDeMissao(f, { missaoId: "m_esp", grau: "semiEspecial", itens: Array.from({ length: 12 }, () => PEROLA) });
  t("Grau Especial recebe Custo 1 sem limite", [especial.aplicado, especial.entregues.length], [true, 12]);
  const d = deriveAfty(r1.creature);
  t("o que a missão entregou é item de verdade para o derive", d.equip.entradas.map((e) => e.refId), ["arm_espada_longa", "it_perola_carregada", "it_perola_carregada", "it_simbolo_de_vida_florescente"]);
}

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
