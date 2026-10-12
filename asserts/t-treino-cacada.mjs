import { register } from "node:module";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}', import.meta.url);
globalThis.localStorage ??= { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const { deriveAfty } = await import("../src/systems/afty/afty-derive.js");
const { createBlankAfty } = await import("../src/systems/afty/afty-schema.js");
const AD = await import("../src/systems/afty/afty-addons.js");
const TR = await import("../src/systems/afty/afty-treinamentos.js");
const { conteudoDaFicha } = await import("../src/systems/afty/ficha/ficha-conteudo.js");
const raw = JSON.parse(readFileSync(new URL("../addons/treino-de-cacada.json", import.meta.url), "utf8"));
const meta = AD.normalizarPacote(JSON.parse(readFileSync(new URL("../addons/reavaliacao.json", import.meta.url), "utf8")));
const pacote = AD.normalizarPacote(raw);
let checks = 0;
const eq = (a, b) => { assert.deepEqual(a, b); checks++; };
eq(AD.validarPacote(pacote), []);
const id = "treino-de-cacada:cacada";
const ficha = (progresso, sistema = "player") => {
  const f = createBlankAfty();
  f.rulesVersion = sistema;
  f.core.nd = 13;
  f.addons = [pacote];
  f.treinamentos = { [id]: progresso };
  f.attributes.destreza = 18;
  f.attributes.sabedoria = 10;
  f.pericias = { intuicao: "mestre", percepcao: "treinado" };
  return f;
};
const derive = (f) => { AD.aplicarAddons(f.addons); return deriveAfty(f); };
const pericia = (d, id) => d.testes.pericias.find(p => p.id === id);
for (const sistema of ["player", "afty"]) {
  const base = derive(ficha(0, sistema));
  const um = derive(ficha(1, sistema));
  eq(um.pe - base.pe, 2);
  eq(pericia(um, "percepcao").bonus, pericia(base, "percepcao").bonus);
  const dois = derive(ficha(2, sistema));
  eq(pericia(dois, "percepcao").atributo, "destreza");
  eq(pericia(dois, "percepcao").bonus - pericia(um, "percepcao").bonus, 4);
  const tres = derive(ficha(3, sistema));
  eq(pericia(tres, "percepcao").bonus - pericia(dois, "percepcao").bonus, 2);
  eq(tres.habilidades.exclusivasTalento, base.habilidades.exclusivasTalento);
  const quatro = derive(ficha(4, sistema));
  eq(pericia(quatro, "acrobacia").bonus - pericia(tres, "acrobacia").bonus, 3);
  eq(quatro.habilidades.exclusivasTalento - tres.habilidades.exclusivasTalento, 1);
  eq(quatro.habilidades.comum, tres.habilidades.comum);
  eq(conteudoDaFicha(ficha(4, sistema), quatro).filter(i => i.grupo === "treinamento").length, 5);
  eq(TR.focosGastos({ [id]: 4 }), 5);
  const removida = ficha(4, sistema);
  removida.addons = [];
  const sem = derive(removida);
  eq(sem.pe, base.pe);
  eq(pericia(sem, "percepcao").atributo, pericia(base, "percepcao").atributo);
  eq(sem.habilidades.exclusivasTalento, base.habilidades.exclusivasTalento);
}
AD.aplicarAddons([pacote]);
const requisitos = TR.getTreinamento(id).etapas[3].requisito;
const pode = (nd, intuicao, percepcao) => requisitos.every(r => TR.avaliarRequisito(r, {
  nd, periciaProf: { intuicao, percepcao },
}).ok);
eq(pode(12, "mestre", "treinado"), false);
eq(pode(13, "treinado", "treinado"), false);
eq(pode(13, "mestre", null), false);
eq(pode(13, "mestre", "treinado"), true);
eq(pode(13, "mestre", "mestre"), true);
// O requisito também reconhece proficiência concedida pelo Motor.
const motor = ficha(3);
motor.pericias = {};
motor.core.tecnicaEfeitos = [
  { canal: "proficienciaPericia", alvo: "intuicao", expr: "2" },
  { canal: "proficienciaPericia", alvo: "percepcao", expr: "1" },
];
const dm = derive(motor);
eq(requisitos.every(r => TR.avaliarRequisito(r, { nd: 13,
  periciaProf: Object.fromEntries(dm.testes.pericias.map(p => [p.id, p.prof])),
}).ok), true);
// Caçada e Reavaliação somam seus bônus sem substituir os +1 da primeira etapa.
const junto = ficha(3);
junto.addons.push(meta);
junto.treinamentos["reavaliacao:reavaliacao"] = 2;
const dj = derive(junto);
const so = derive(ficha(3));
eq(pericia(dj, "percepcao").bonus - pericia(so, "percepcao").bonus, 1);
eq(dj.movimento - so.movimento, 3);
eq(pericia(dj, "percepcao").atributo, "destreza");
const regra = readFileSync(new URL("../docs/treino-cacada-regras.md", import.meta.url), "utf8").replace(/\r\n/g, "\n").replace(/^> ?/gm, "");
for (const etapa of raw.acrescenta.treinamentos[0].etapas) eq(regra.includes(etapa.beneficio), true);
eq(regra.includes(raw.acrescenta.treinamentos[0].resumo), true);
eq(regra.includes(raw.acrescenta.treinamentos[0].completo.beneficio), true);
console.log(`TODOS OS ${checks} ASSERTS PASSARAM`);
