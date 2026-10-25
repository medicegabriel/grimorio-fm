import { register } from "node:module";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}', import.meta.url);
globalThis.localStorage ??= { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const { deriveAfty } = await import("../src/systems/afty/afty-derive.js");
const { createBlankAfty } = await import("../src/systems/afty/afty-schema.js");
const AD = await import("../src/systems/afty/afty-addons.js");
const TR = await import("../src/systems/afty/afty-treinamentos.js");
const pacote = AD.normalizarPacote(JSON.parse(readFileSync(new URL("../addons/vespa-crabro.json", import.meta.url), "utf8")));
const id = "vespa-crabro:guarda";
let checks = 0;
const eq = (a, b) => { assert.deepEqual(a, b); checks++; };
eq(AD.validarPacote(pacote), []);
const ficha = (rulesVersion, armas, progresso = 4, prof = null) => {
  const f = createBlankAfty();
  f.rulesVersion = rulesVersion; f.core.nd = 13;
  f.attributes.sabedoria = 14; f.attributes.destreza = 22; f.attrLimite.destreza = 22;
  f.addons = [pacote]; f.treinamentos = { [id]: progresso };
  f.pericias = prof ? { percepcao: prof } : {};
  f.equipamentos.itens = armas.map((refId, i) => ({ uid: `arma${i}`, tipo: "arma", refId, qtd: 1, equipado: true }));
  return f;
};
const derive = (f) => { AD.aplicarAddons(f.addons); return deriveAfty(f); };
const per = (d) => d.testes.pericias.find((p) => p.id === "percepcao");
const dano = (d, arma) => d.dano.entradas.find((e) => e.id === arma);
for (const sistema of ["afty", "player"]) {
  for (const armas of [["arm_lanca"], ["arm_espada_longa"], ["arm_lanca", "arm_espada_longa"]]) {
    const f = ficha(sistema, [...armas, "arm_adaga"]);
    const zero = ficha(sistema, [...armas, "arm_adaga"], 0);
    const base = derive(zero), quatro = derive(f);
    eq(quatro.defesa - base.defesa, 3);
    eq(per(quatro).prof, "mestre");
    eq(per(quatro).bonus, per(derive(ficha(sistema, armas, 0, "mestre"))).bonus + 2);
    const mestre = derive(ficha(sistema, armas, 4, "mestre"));
    eq(per(mestre).bonus - per(derive(ficha(sistema, armas, 0, "mestre"))).bonus, 4);
    eq(dano(quatro, "basico"), dano(base, "basico"));
    eq(dano(quatro, "arm_adaga"), dano(base, "arm_adaga"));
    for (const arma of armas) eq(JSON.stringify(dano(quatro, arma)) !== JSON.stringify(dano(base, arma)), true);
    const guardada = structuredClone(f);
    for (const item of guardada.equipamentos.itens) item.equipado = false;
    const sem = derive(guardada);
    const semBase = structuredClone(guardada); semBase.treinamentos[id] = 0;
    eq(sem.defesa, derive(semBase).defesa);
    eq(per(sem).bonus, per(derive(semBase)).bonus);
    const removido = structuredClone(f); removido.addons = [];
    eq(derive(removido).defesa, base.defesa);
    eq(per(derive(removido)).bonus, per(base).bonus);
  }
  for (const arma of ["arm_adaga", "nao-existe"]) {
    const f = ficha(sistema, [arma]);
    const base = derive(ficha(sistema, [arma], 0));
    eq(derive(f).defesa, base.defesa);
    eq(per(derive(f)).bonus, per(base).bonus);
  }
  const dupla = derive(ficha(sistema, ["arm_lanca", "arm_espada_longa"]));
  const soLanca = derive(ficha(sistema, ["arm_lanca"]));
  eq(dupla.defesa, soLanca.defesa);
  eq(per(dupla).bonus, per(soLanca).bonus);
}
AD.aplicarAddons([pacote]);
eq(TR.focosGastos({ [id]: 4 }), 7);
const treino = TR.getTreinamento(id);
eq(TR.avaliarRequisito(treino.etapas[2].requisito, { attrEff: { sabedoria: 13 } }).ok, false);
eq(treino.etapas[3].requisito.every((r) => TR.avaliarRequisito(r, { attrEff: { sabedoria: 14, destreza: 22 } }).ok), true);
eq(treino.etapas[3].requisito.every((r) => TR.avaliarRequisito(r, { attrEff: { sabedoria: 14, destreza: 21 } }).ok), false);
eq(treino.completo.beneficio, JSON.parse(readFileSync(new URL("../addons/guarda-da-lamina-divina.json", import.meta.url), "utf8")).acrescenta.treinamentos[0].completo.beneficio);
console.log(`TODOS OS ${checks} ASSERTS PASSARAM`);
