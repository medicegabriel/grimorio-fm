import assert from "node:assert/strict";
const { pacote, integrarArsenal } = await import("../scripts/preparar-arsenal-ryuma.mjs");
const { deriveAfty } = await import("../src/systems/afty/afty-derive.js");
const { createBlankAfty } = await import("../src/systems/afty/afty-schema.js");
const AD = await import("../src/systems/afty/afty-addons.js");
const EQ = await import("../src/systems/afty/afty-equipamentos.js");
const { equipamentosDaFicha } = await import("../src/systems/afty/ficha/ficha-conteudo.js");
let checks = 0;
const eq = (a, b) => { assert.deepEqual(a, b); checks++; };
const ficha = createBlankAfty();
ficha.name = "Ryuma"; ficha.rulesVersion = "player"; ficha.core.nd = 30;
ficha.carteira = { anotacao: "preservar" };
const outra = createBlankAfty(); outra.name = "Outra ficha";
const original = { creatures: [ficha, outra], count: 2 };
const integrado = integrarArsenal(original);
const c = integrado.creatures[0];
eq(original.creatures[0].equipamentos.itens, []);
eq(integrado.creatures[1], outra);
eq(c.carteira, ficha.carteira);
eq(c.equipamentos.itens.length, 8);
eq(c.equipamentos.itens.every((e) => !e.equipado), true);
eq(new Set(c.equipamentos.itens.map((e) => e.uid)).size, 8);
eq(integrarArsenal(integrado), integrado);
const salvo = JSON.parse(JSON.stringify(integrado));
eq(salvo, integrado);
const normalizado = AD.normalizarPacote(pacote);
eq(AD.validarPacote(normalizado), []);
const derive = (f) => { AD.aplicarAddons(f.addons ?? []); return deriveAfty(f); };
const guardado = derive(c);
eq(guardado.equip.entradas.length, 8);
eq(EQ.validarCatalogoEquipamentos(), []);
eq(equipamentosDaFicha(guardado).length, 8);
for (const e of guardado.equip.entradas) {
  eq(e.def.nome.length > 0, true);
  if (e.fa.temHabUnica) eq(e.def.descricao.includes(e.fa.habilidadeUnica), true);
}
const somente = (id) => {
  const f = structuredClone(c);
  f.equipamentos.itens.forEach((e) => { e.equipado = e.refId === `arsenal-de-ryuma:${id}`; });
  return derive(f);
};
const unif = somente("lobo_saltitante");
eq(unif.defesa - guardado.defesa, 10);
eq(unif.movimento - guardado.movimento, 3);
eq(unif.equip.entradas.find((e) => e.tipo === "uniforme").fa.penalidade, -6);
const unifFa = unif.equip.entradas.find((e) => e.tipo === "uniforme").fa;
eq(unifFa.encantamentos.find((x) => x.id === "enc_unif_material_pesado").atende, false);
eq(unifFa.usaCargas, false);
const yagen = somente("yagen");
eq(yagen.equip.rdEscudoBase, 8 + yagen.maestria);
eq(yagen.rdFisico - guardado.rdFisico, 8 + yagen.maestria + 5 + 2);
const y = yagen.equip.entradas.find((e) => e.tipo === "escudo");
eq(y.def.dano, null);
eq(y.fa.escolhidos.includes("enc_esc_bloqueador"), false);
eq(pacote.acrescenta.escudos[0].rdEscudo, 8);
eq(yagen.dano.entradas.some((e) => e.nome === "Yagen Tōshirō"), false);
const esmaga = somente("esmaga_mata");
eq(esmaga.movimento, guardado.movimento);
const esmagaDef = esmaga.equip.entradas.find((e) => e.refId.endsWith(":esmaga_mata")).def;
eq(EQ.alcanceDaArma(esmagaDef), { curto: 1.5, longo: 1.5, texto: "1.5m" });
eq(esmagaDef.props.arremessavel, [6, 18]);
const presa = somente("presa_desgarrado");
eq(EQ.alcanceDaArma(presa.equip.entradas.find((e) => e.refId.endsWith(":presa_desgarrado")).def).curto, 7.5);
const tipoEsperado = ["congelante", "queimante", "queimante", "acido", "chocante", "sonico"];
for (let i = 0; i < pacote.acrescenta.armas.length; i++) {
  const a = pacote.acrescenta.armas[i];
  const d = somente(a.id);
  const resolvida = d.equip.entradas.find((e) => e.def.id === `arsenal-de-ryuma:${a.id}`);
  eq(resolvida.def.dano.tipo, tipoEsperado[i]);
  eq(resolvida.def.dano.dado, a.dano.dado);
  if (a.faPadrao.encantamentos.includes("enc_arma_potente")) {
    eq(resolvida.fa.efeitos.some((e) => e.origem === "Potente" && e.canal === "dadosDano"), false);
    const comum = { ...resolvida.def, dano: { ...resolvida.def.dano, encantamentosIncluidos: [] } };
    eq(EQ.resolveFerramenta({ tipo: "arma", fa: { grau: resolvida.fa.grau, encantamentos: resolvida.fa.escolhidos } }, comum, d.maestria).efeitos
      .some((e) => e.origem === "Potente" && e.canal === "dadosDano"), true);
  }
}
const dragon = somente("dragon_bone").equip.entradas.find((e) => e.refId.endsWith(":dragon_bone"));
eq(dragon.fa.excedeu, true);
eq(dragon.fa.escolhidos.length, 5);
eq(dragon.fa.encantamentos.find((e) => e.id === "enc_arma_destruidora").atende, true);
eq(dragon.fa.escolhidos.includes("enc_arma_certeira"), false);
eq(c.equipamentos.itens.every((e) => !e.equipado), true);
eq(derive(salvo.creatures[0]).equip.entradas.length, 8);
const simples = createBlankAfty(); simples.rulesVersion = "player";
eq(derive(simples).equip.entradas.length, 0);
eq(EQ.getEquipamento("arma", "arsenal-de-ryuma:murasama"), null);
console.log(`TODOS OS ${checks} ASSERTS PASSARAM`);
