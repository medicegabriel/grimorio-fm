import { register } from "node:module";
import assert from "node:assert/strict";
register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}', import.meta.url);
globalThis.localStorage ??= { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const { deriveAfty } = await import("../src/systems/afty/afty-derive.js");
const { createBlankAfty } = await import("../src/systems/afty/afty-schema.js");
const AD = await import("../src/systems/afty/afty-addons.js");
const EQ = await import("../src/systems/afty/afty-equipamentos.js");
let checks = 0;
const eq = (a, b) => { assert.deepEqual(a, b); checks++; };
AD.aplicarAddons([]);
const escudosBase = structuredClone(EQ.ESCUDOS);
const uniformesBase = structuredClone(EQ.UNIFORME_MODIFICACOES);
const pacote = AD.normalizarPacote({
  id: "catalogo-teste", nome: "Catálogo de teste", versao: "1.0.0", paraRaw: "afty",
  acrescenta: {
    escudos: [{ id: "escudo", nome: "Escudo de teste", rdEscudo: 8, penalidade: 0, custo: 4,
      espacos: 2, ocupaMao: true, dano: null }],
    uniformes: [{ id: "uniforme", nome: "Uniforme de teste", defesa: 8, penalidade: -6,
      custo: 4, espacos: 6, efeito: { aplicado: true, pericia: { acrobacia: 2, furtividade: 2 } } }],
  },
});
eq(AD.validarPacote(pacote), []);
const ficha = createBlankAfty();
ficha.rulesVersion = "player";
ficha.addons = [pacote];
ficha.equipamentos.itens = [
  { uid: "esc", tipo: "escudo", refId: "catalogo-teste:escudo", qtd: 1, equipado: false,
    fa: { grau: "especial", encantamentos: ["enc_esc_reforcado"] } },
  { uid: "unif", tipo: "uniforme", refId: "catalogo-teste:uniforme", qtd: 1, equipado: false,
    fa: { grau: "especial", encantamentos: ["enc_unif_blindado"] } },
];
const derive = (f) => { AD.aplicarAddons(f.addons ?? []); return deriveAfty(f); };
const guardado = derive(ficha);
eq(guardado.equip.entradas.length, 2);
eq(guardado.equip.entradas[0].def.dano, null);
eq(guardado.equip.rdEscudoBase, 0);
const copiaAntes = JSON.stringify(ficha);
const equipado = structuredClone(ficha);
equipado.equipamentos.itens.forEach((e) => { e.equipado = true; });
const ativo = derive(equipado);
eq(ativo.equip.rdEscudoBase, 8);
eq(ativo.rdFisico - guardado.rdFisico, 15);
eq(ativo.defesa - guardado.defesa, 10);
eq(ativo.equip.entradas[1].fa.penalidade, -6);
eq(JSON.stringify(ficha), copiaAntes);
eq(EQ.validarCatalogoEquipamentos(), []);
const persistido = JSON.parse(JSON.stringify(equipado));
const depois = derive(persistido);
eq(depois.rdFisico, ativo.rdFisico);
eq(depois.defesa, ativo.defesa);
eq(depois.equip.rdEscudoBase, ativo.equip.rdEscudoBase);
AD.aplicarAddons([pacote]);
AD.aplicarAddons([pacote]);
eq(EQ.ESCUDOS.filter((e) => e.id === "catalogo-teste:escudo").length, 1);
eq(EQ.UNIFORME_MODIFICACOES.filter((e) => e.id === "catalogo-teste:uniforme").length, 1);
const outra = createBlankAfty();
derive(outra);
eq(outra.equipamentos.itens, []);
eq(EQ.getEquipamento("escudo", "catalogo-teste:escudo"), null);
eq(EQ.getEquipamento("uniforme", "catalogo-teste:uniforme"), null);
eq(EQ.ESCUDOS, escudosBase);
eq(EQ.UNIFORME_MODIFICACOES, uniformesBase);
eq(EQ.validarCatalogoEquipamentos(), []);
console.log(`TODOS OS ${checks} ASSERTS PASSARAM`);
