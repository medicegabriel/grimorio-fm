import { register } from "node:module";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}', import.meta.url);
globalThis.localStorage ??= { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const { deriveAfty: derive } = await import("../src/systems/afty/afty-derive.js");
const { createBlankAfty } = await import("../src/systems/afty/afty-schema.js");
const AD = await import("../src/systems/afty/afty-addons.js");
const deriveAfty = (f) => { AD.aplicarAddons(f.addons ?? []); return derive(f); };
const TR = await import("../src/systems/afty/afty-treinamentos.js");
const { conteudoDaFicha } = await import("../src/systems/afty/ficha/ficha-conteudo.js");
const raw = JSON.parse(readFileSync(new URL("../addons/reavaliacao.json", import.meta.url), "utf8"));
const pacote = AD.normalizarPacote(raw);
let checks = 0;
const eq = (a, b) => { assert.deepEqual(a, b); checks++; };
eq(AD.validarPacote(pacote), []);
const id = "reavaliacao:reavaliacao";
const ficha = (progresso, sistema = "player", atencao = 100) => {
  const f = createBlankAfty();
  f.rulesVersion = sistema;
  f.core.nd = 20;
  f.addons = [pacote];
  f.treinamentos = { [id]: progresso };
  f.statOverrides = { atencao };
  return f;
};
for (const sistema of ["player", "afty"]) {
  const base = deriveAfty(ficha(0, sistema));
  const um = deriveAfty(ficha(1, sistema));
  eq(um.testes.pericias.find(p => p.id === "percepcao").bonus,
    base.testes.pericias.find(p => p.id === "percepcao").bonus + 1);
  eq(um.movimento, base.movimento);
  const dois = deriveAfty(ficha(2, sistema));
  eq(dois.movimento, base.movimento + 3);
  const tres = deriveAfty(ficha(3, sistema));
  eq(tres.habilidades.concedidas.includes("sup_analise_profunda"), false);
  const quatro = deriveAfty(ficha(4, sistema));
  eq(quatro.habilidades.concedidas.includes("sup_analise_profunda"), true);
  eq(quatro.habilidades.gastos, base.habilidades.gastos);
  eq(quatro.beneficiosTreinamento.length, 5);
  const abaixo = deriveAfty(ficha(4, sistema, 99));
  eq(abaixo.beneficiosTreinamento.length, 4);
  eq(conteudoDaFicha(ficha(4, sistema), quatro).filter(i => i.grupo === "treinamento").length, 5);
  const removida = ficha(4, sistema);
  removida.addons = [];
  const d = deriveAfty(removida);
  eq(d.habilidades.concedidas.includes("sup_analise_profunda"), false);
  eq(d.beneficiosTreinamento, []);
}
AD.aplicarAddons([pacote]);
for (const [atencao, esperado] of [[84, false], [85, true], [86, true]]) {
  eq(TR.avaliarRequisito({ tipo: "atencao", valor: 85 }, { atencao }).ok, esperado);
}
for (const [atencao, esperado] of [[99, false], [100, true], [101, true]]) {
  eq(TR.avaliarRequisito({ tipo: "atencao", valor: 100 }, { atencao }).ok, esperado);
}
eq(TR.avaliarRequisito({ tipo: "atencao", valor: 85 }, {}).ok, false);
eq(TR.focosGastos({ [id]: 4 }), 6);
// Concessão duplicada não cobra vaga nem duplica a habilidade efetiva.
const duplicada = ficha(4);
duplicada.habilidades = ["sup_analise_profunda"];
const dd = deriveAfty(duplicada);
eq(dd.habilidades.escolhidas.filter(h => h === "sup_analise_profunda").length, 1);
eq(dd.habilidades.gastos, 0);
const regra = readFileSync(new URL("../docs/reavaliacao-regras.md", import.meta.url), "utf8").replace(/\r\n/g, "\n");
for (const etapa of raw.acrescenta.treinamentos[0].etapas) eq(regra.includes(etapa.beneficio), true);
eq(regra.includes(raw.acrescenta.treinamentos[0].completo.beneficio), true);
console.log(`TODOS OS ${checks} ASSERTS PASSARAM`);
