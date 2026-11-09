/**
 * CX5: FEITIÇO DE CRIAÇÃO DE ITENS DE CUSTO (Livro p.229), nos DOIS sistemas.
 *
 * O calculador de quantidade e custo já existia. Este arquivo prende o que faltava:
 *   - materializar os itens (a ficha que a mesa enxerga ganha as entradas, a ficha da criatura não muda);
 *   - consumível só uma vez por descanso, permanente só `qtdBase` ao mesmo tempo;
 *   - a especificação prévia, o custo e a natureza dos itens;
 *   - troca de quantidade por grau;
 *   - o item criado não entra no orçamento de custo, mas ocupa espaço;
 *   - criar duas vezes com o mesmo id, ou reabrir a ficha, não duplica.
 */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const SE = await import(R + "ficha/ficha-sessao.js");
const US = await import(R + "ficha/ficha-uso-estado.js");
const IT = await import(R + "ficha/ficha-itens.js");
const FC = await import(R + "ficha/ficha-itens-feitico.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};
let contador = 0;
const op = () => `cx5-fe-${++contador}`;

const feitico = (id, extra = {}) => ({
  id, nome: `Feitiço ${id}`, tipo: "especial", especialSubtipo: "itens", nivel: 3, itemCusto: 1, itemGrauTroca: 0,
  itemNatureza: "consumivel", itemDescricao: "Os itens da técnica", tecnicaFocoItens: false, ...extra,
});
const ficha = (sistema, feiticos, itens = [], classes = [{ id: "conjurador", nivel: 12 }]) => {
  const f = createBlankAfty();
  f.rulesVersion = sistema;
  f.core = { ...f.core, nd: 12, tipo: "misto", patamar: "comum", origem: { id: "inato" } };
  f.especializacoes = classes;
  f.feiticos = feiticos;
  f.equipamentos = { itens };
  return f;
};
const mesa = (f) => {
  const d = deriveAfty(f);
  return { d, s: { ...SE.sessaoEmBranco(d), rodada: 1 } };
};
const PEROLA = { tipo: "item", refId: "it_perola_carregada" };
const SIMBOLO = { tipo: "item", refId: "it_simbolo_da_vida" };
const ESPADA = { tipo: "arma", refId: "arm_espada_longa" };
const ESCUDO = { tipo: "escudo", refId: "esc_leve" };

for (const sistema of ["player", "afty"]) {
  const tag = (nome) => `${sistema}: ${nome}`;

  /* ------------------------------------------------------------ A. Consumíveis: uma vez por descanso longo */
  {
    const f = ficha(sistema, [feitico("fa")]);
    const { d, s } = mesa(f);
    const resumo = FC.resumoDaCriacao(f, s, d, "fa");
    t(tag("Nível 3, Custo 1: três itens (a conta do livro)"), [resumo.quantidade, resumo.custo, resumo.natureza, resumo.cabem], [3, 1, "consumivel", 3]);
    const r = FC.criaItensDoFeitico(f, s, d, { feiticoId: "fa", itens: [PEROLA, PEROLA, SIMBOLO], opId: op() });
    t(tag("cria os três"), [r.aplicado, r.criados.length], [true, 3]);
    t(tag("eles ficam na sessão e não na ficha da criatura"), [US.usoDe(r.sessao).itens.criados.length, f.equipamentos.itens.length], [3, 0]);
    const vista = IT.fichaComItensDaSessao(f, r.sessao);
    t(tag("a ficha que a mesa enxerga ganha as entradas"), vista.equipamentos.itens.map((e) => [e.refId, e.criadoPorFeitico]), [["it_perola_carregada", "fa"], ["it_perola_carregada", "fa"], ["it_simbolo_da_vida", "fa"]]);
    t(tag("o PE do Feitiço sai como PE não descontado (decisão vigente)"), r.custo.pe.naoDescontado > 0 && r.custo.pe.cobrado === 0, true);

    const denovo = FC.criaItensDoFeitico(f, r.sessao, d, { feiticoId: "fa", itens: [PEROLA], opId: op() });
    t(tag("consumível: só uma criação por descanso"), [denovo.aplicado, denovo.erro, denovo.sessao === r.sessao], [false, "Já Criou Neste Descanso", true]);
    t(tag("o resumo avisa que já criou"), FC.resumoDaCriacao(f, r.sessao, d, "fa").jaCriouNoDescanso, true);
    const dormiu = SE.descansar(r.sessao, d);
    t(tag("o descanso devolve a criação e os itens criados seguem existindo"), [FC.resumoDaCriacao(f, dormiu, d, "fa").jaCriouNoDescanso, US.usoDe(dormiu).itens.criados.length], [false, 3]);
    const outra = FC.criaItensDoFeitico(f, dormiu, d, { feiticoId: "fa", itens: [PEROLA], opId: op() });
    t(tag("depois do descanso cria de novo"), outra.aplicado, true);

    // Idempotência: o mesmo id não duplica, nem ao reabrir a ficha.
    const id = op();
    const um = FC.criaItensDoFeitico(f, s, d, { feiticoId: "fa", itens: [PEROLA], opId: id });
    const dois = FC.criaItensDoFeitico(f, um.sessao, d, { feiticoId: "fa", itens: [PEROLA], opId: id });
    t(tag("o mesmo opId não cria de novo"), [dois.aplicado, dois.repetida, dois.sessao === um.sessao], [false, true, true]);
    const reaberta = SE.normalizaSessao(JSON.parse(JSON.stringify(um.sessao)), d);
    t(tag("reabrir a ficha não duplica"), [US.usoDe(reaberta).itens.criados.length, IT.fichaComItensDaSessao(f, reaberta).equipamentos.itens.length], [1, 1]);
    const reabertaDeNovo = FC.criaItensDoFeitico(f, reaberta, d, { feiticoId: "fa", itens: [PEROLA], opId: id });
    t(tag("e reenviar o id depois de reabrir continua sem duplicar"), reabertaDeNovo.repetida, true);

    // Usar o consumível criado: gasta, some, e não devolve a criação do descanso.
    const uid = r.criados[0];
    const usou = IT.usaItem(f, r.sessao, d, { uid, opId: op() });
    t(tag("usar a Pérola criada recupera PE e ela desaparece"), [usou.aplicado, US.usoDe(usou.sessao).itens.criados.length, IT.unidadesRestantes(f, usou.sessao, uid)], [true, 2, 0]);
    const aindaNao = FC.criaItensDoFeitico(f, usou.sessao, d, { feiticoId: "fa", itens: [PEROLA], opId: op() });
    t(tag("consumir não devolve a criação do descanso"), aindaNao.erro, "Já Criou Neste Descanso");
  }

  /* ------------------------------------------------------------ B. Recusas */
  {
    const f = ficha(sistema, [feitico("fa"), feitico("fsem", { itemDescricao: "  " }), feitico("fperm", { itemNatureza: "permanente", nivel: 2 })]);
    const { d, s } = mesa(f);
    const tent = (extra) => FC.criaItensDoFeitico(f, s, d, { feiticoId: "fa", itens: [PEROLA], opId: op(), ...extra });
    t(tag("sem opId"), tent({ opId: undefined }).codigo, "sem-opid");
    t(tag("Feitiço desconhecido"), tent({ feiticoId: "zzz" }).codigo, "feitico-ausente");
    t(tag("Feitiço que não é de Criação de Itens"), FC.criaItensDoFeitico(ficha(sistema, [{ ...feitico("fx"), especialSubtipo: "golpeador" }]), s, d, { feiticoId: "fx", itens: [PEROLA], opId: op() }).codigo, "feitico-ausente");
    t(tag("itens precisam ser especificados antes"), FC.criaItensDoFeitico(f, s, d, { feiticoId: "fsem", itens: [PEROLA], opId: op() }).erro, "Especifique os Itens do Feitiço");
    t(tag("sem itens escolhidos"), tent({ itens: [] }).erro, "Escolha os Itens");
    t(tag("mais itens que o cálculo permite"), tent({ itens: [PEROLA, PEROLA, PEROLA, PEROLA] }).erro, "No Máximo 3 Itens");
    t(tag("item de outro custo"), tent({ itens: [{ tipo: "item", refId: "it_bracelete_do_vigor" }] }).erro, "O Feitiço Cria Itens de Custo 1");
    t(tag("permanente em Feitiço de consumíveis"), tent({ itens: [ESPADA] }).erro, "O Feitiço Cria Consumíveis");
    t(tag("consumível em Feitiço de permanentes"), FC.criaItensDoFeitico(f, s, d, { feiticoId: "fperm", itens: [PEROLA], opId: op() }).erro, "O Feitiço Cria Itens Permanentes");
    t(tag("item desconhecido"), tent({ itens: [{ tipo: "item", refId: "nao_existe" }] }).codigo, "item-ausente");
    t(tag("tipo não criável (kit)"), tent({ itens: [{ tipo: "kit", refId: "kit_alfaiate" }] }).codigo, "tipo");
    t(tag("recusa devolve a mesma sessão"), tent({ itens: [ESPADA] }).sessao === s, true);
    t(tag("e nada foi gasto da criação do descanso"), tent({ itens: [ESPADA] }).sessao.usos, s.usos);
  }

  /* ------------------------------------------------------------ C. Permanentes: quantos existem ao mesmo tempo */
  {
    // Nível 2, Custo 1 => qtdBase = 2.
    const f = ficha(sistema, [feitico("fp", { itemNatureza: "permanente", nivel: 2 })]);
    const { d, s } = mesa(f);
    t(tag("Nível 2, Custo 1: dois itens"), FC.resumoDaCriacao(f, s, d, "fp").quantidade, 2);
    const r1 = FC.criaItensDoFeitico(f, s, d, { feiticoId: "fp", itens: [ESPADA], opId: op() });
    const r2 = FC.criaItensDoFeitico(f, r1.sessao, d, { feiticoId: "fp", itens: [ESCUDO], opId: op() });
    t(tag("permanente pode ser criado várias vezes"), [r1.aplicado, r2.aplicado, FC.criadosDoFeitico(r2.sessao, "fp").length], [true, true, 2]);
    const r3 = FC.criaItensDoFeitico(f, r2.sessao, d, { feiticoId: "fp", itens: [ESPADA], opId: op() });
    t(tag("mas só dois existem ao mesmo tempo"), [r3.aplicado, r3.erro, r3.sessao === r2.sessao], [false, "Só 2 Podem Existir ao Mesmo Tempo", true]);
    const livre = FC.desfazItemCriado(r2.sessao, d, { uid: r1.criados[0], opId: op() });
    t(tag("desfazer (ação livre) libera a vaga"), [livre.aplicado, FC.criadosDoFeitico(livre.sessao, "fp").length], [true, 1]);
    const r4 = FC.criaItensDoFeitico(f, livre.sessao, d, { feiticoId: "fp", itens: [ESPADA], opId: op() });
    t(tag("e dá para criar outro"), r4.aplicado, true);
    const repetido = FC.desfazItemCriado(livre.sessao, d, { uid: r1.criados[0], opId: op() });
    t(tag("desfazer o que já não existe recusa"), repetido.erro, "Item Criado Não Encontrado");
    const mesmoId = op();
    const d1 = FC.desfazItemCriado(r2.sessao, d, { uid: r2.criados[0], opId: mesmoId });
    t(tag("desfazer com o mesmo id é idempotente"), FC.desfazItemCriado(d1.sessao, d, { uid: r2.criados[0], opId: mesmoId }).repetida, true);

    // Equipar o item criado entra no cálculo da ficha que a mesa enxerga.
    const espada = r1.criados[0];
    const veste = FC.equipaItemCriado(r2.sessao, espada, true);
    const fVista = IT.fichaComItensDaSessao(f, veste);
    const dVista = deriveAfty(fVista);
    t(tag("a espada criada e vestida aparece como equipada no derive"), dVista.equip.entradas.find((e) => e.uid === espada).equipado, true);
    t(tag("o descanso não desfaz o item permanente"), FC.criadosDoFeitico(SE.descansar(r2.sessao, d), "fp").length, 2);

    // O orçamento de custo não é gasto, o espaço sim.
    const antes = deriveAfty(f).equip;
    const depois = dVista.equip;
    t(tag("o item criado NÃO entra no limite de custo"), [antes.custoGasto, depois.custoGasto], [{ 1: 0, 2: 0, 3: 0, 4: 0 }, { 1: 0, 2: 0, 3: 0, 4: 0 }]);
    t(tag("mas ocupa espaço no inventário"), depois.espacosUsados > antes.espacosUsados, true);
    const comprado = ficha(sistema, [feitico("fp", { itemNatureza: "permanente", nivel: 2 })], [{ uid: "c1", tipo: "arma", refId: "arm_espada_longa", qtd: 1, equipado: false }]);
    t(tag("a espada comprada, essa sim, gasta o custo 1"), deriveAfty(comprado).equip.custoGasto[1], 1);
  }

  /* ------------------------------------------------------------ D. Trocar quantidade por grau */
  {
    // Nível 3, Custo 1, uma troca: 3 - 1 = 2 itens, e um deles +1 Grau.
    const f = ficha(sistema, [feitico("fg", { itemNatureza: "permanente", itemGrauTroca: 1 }), feitico("fc", { itemGrauTroca: 1 })]);
    const { d, s } = mesa(f);
    const resumo = FC.resumoDaCriacao(f, s, d, "fg");
    t(tag("a troca reduz a quantidade e dá +1 Grau"), [resumo.quantidade, resumo.grauBonus, resumo.qtdBase], [2, 1, 3]);
    const r = FC.criaItensDoFeitico(f, s, d, { feiticoId: "fg", itens: [ESPADA, ESCUDO], opId: op(), grauEm: 1 });
    t(tag("o grau vai para o item escolhido"), US.usoDe(r.sessao).itens.criados.map((c) => c.grauBonus), [0, 1]);
    const vista = IT.fichaComItensDaSessao(f, r.sessao).equipamentos.itens;
    t(tag("e vira Ferramenta de Quarto Grau na ficha da mesa"), vista.map((e) => e.fa?.grau ?? null), [null, "quarto"]);
    const tres = FC.criaItensDoFeitico(f, s, d, { feiticoId: "fg", itens: [ESPADA, ESPADA, ESCUDO], opId: op() });
    t(tag("não passa da quantidade reduzida"), tres.erro, "No Máximo 2 Itens");
    const semGrau = FC.criaItensDoFeitico(f, s, d, { feiticoId: "fc", itens: [PEROLA, SIMBOLO], opId: op() });
    t(tag("o grau só vale em arma, escudo ou uniforme"), [semGrau.aplicado, semGrau.erro], [false, "O Grau Só Vale em Arma, Escudo ou Uniforme"]);
  }

  /* ------------------------------------------------------------ D2. O acesso é o do derive, não o do ND sozinho */
  {
    // ND 12: o acesso comum é Nível 3, e o Conjurador de nível 12 antecipa para 4. Um Feitiço de Nível 4 é legítimo só para ele.
    const f4 = (classes) => ficha(sistema, [feitico("f4", { nivel: 4, itemCusto: 1 })], [], classes);
    const conj = f4([{ id: "conjurador", nivel: 12 }]);
    const mc = mesa(conj);
    t(tag("o derive libera o Nível 4 ao Conjurador 12 (ND 12)"), mc.d.feiticos.nivelMax, 4);
    const ok4 = FC.criaItensDoFeitico(conj, mc.s, mc.d, { feiticoId: "f4", itens: [PEROLA, PEROLA, PEROLA, PEROLA], opId: op() });
    t(tag("e a criação aceita quatro itens de Custo 1 do Nível 4"), [ok4.aplicado, ok4.criados?.length], [true, 4]);
    const comb = f4([{ id: "combatente", nivel: 12 }]);
    const mb = mesa(comb);
    t(tag("o Combatente 12 só alcança o Nível 3"), mb.d.feiticos.nivelMax, 3);
    const no4 = FC.criaItensDoFeitico(comb, mb.s, mb.d, { feiticoId: "f4", itens: [PEROLA], opId: op() });
    t(tag("e o Feitiço de Nível 4 dele é recusado como acima do acesso"), [no4.aplicado, no4.erro, no4.sessao === mb.s], [false, "Nível Acima do Acesso", true]);
    const tres = ficha(sistema, [feitico("f3", { nivel: 3 })], [], [{ id: "combatente", nivel: 12 }]);
    const m3 = mesa(tres);
    t(tag("o Nível 3 do Combatente 12 passa"), FC.criaItensDoFeitico(tres, m3.s, m3.d, { feiticoId: "f3", itens: [PEROLA], opId: op() }).aplicado, true);
  }

  /* ------------------------------------------------------------ E. Compatibilidade */
  {
    const f = ficha(sistema, [feitico("fa")], [{ uid: "i1", tipo: "item", refId: "it_perola_carregada", qtd: 2, equipado: false }]);
    const { d, s } = mesa(f);
    t(tag("sem item criado nem consumido a ficha é a mesma"), IT.fichaComItensDaSessao(f, s) === f, true);
    const r = FC.criaItensDoFeitico(f, s, d, { feiticoId: "fa", itens: [PEROLA], opId: op() });
    const vista = IT.fichaComItensDaSessao(f, r.sessao);
    t(tag("o inventário antigo é preservado ao lado do criado"), vista.equipamentos.itens.map((e) => e.uid.startsWith("feit_") ? "criado" : e.uid), ["i1", "criado"]);
    const lixo = SE.normalizaSessao({ ...r.sessao, uso: { ...US.usoDe(r.sessao), itens: { criados: [{ uid: "x", refId: 4 }, { uid: "y", tipo: "arma", refId: "arm_adaga" }] } } }, d);
    t(tag("criado malformado é descartado e o válido fica"), US.usoDe(lixo).itens.criados.map((c) => c.uid), ["y"]);
  }
}

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
