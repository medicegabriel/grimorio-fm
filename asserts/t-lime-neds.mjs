import { register } from "node:module";
register("data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}", import.meta.url);
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const AD = await import(R + "afty-addons.js");
const { estadoDaTecnica, estilosDaFicha } = await import(R + "afty-estilo-sombras.js");
const { proximaRodada, descansar, sessaoEmBranco } = await import(R + "ficha/ficha-sessao.js");
const pacote = JSON.parse(readFileSync(new URL("../addons/lime-neds.json", import.meta.url), "utf8"));
assert.deepEqual(AD.validarPacote(pacote), []);
assert.deepEqual(AD.aplicarAddons([pacote]).problemas, []);
const nova = createBlankAfty();
const ficha = {
  ...nova, addons: [pacote],
  core: { ...nova.core, nd: 10, tipo: "combatente" },
  attributes: { forca: 12, destreza: 12, constituicao: 12, inteligencia: 12, sabedoria: 12, presenca: 20 },
  aptidoes: { dom: 4, au: 3 },
  aptidoesAmaldicoadas: ["dominio_simples", "aura_reforcada", "aura_macica"],
  combate: { ativo: true, estilo_ativo: true, "lime-neds:dentro": true },
};
const id = (s) => estadoDaTecnica(`lime-neds:${s}`);
const derivar = (estados = {}, extra = {}) => deriveAfty({ ...ficha, ...extra, combate: { ...ficha.combate, ...estados } });
const d = derivar();
assert.deepEqual(d.attrEff, { forca: 16, destreza: 12, constituicao: 16, inteligencia: 6, sabedoria: 6, presenca: 20 });
assert.deepEqual(d.attrLimiteEfetivo, { forca: 30, destreza: 20, constituicao: 30, inteligencia: 6, sabedoria: 6, presenca: 20 });
assert.equal(d.estilo.conhecidas.length, 5);
assert.equal(d.estilo.gastos, 5);
assert.equal(estilosDaFicha(ficha).length, 0, "editor não copia o conteúdo do addon");
assert.equal(d.estilo.conhecidas.find((t) => t.id.endsWith(":reforcada")).maxImbuicao, 2);
const duas = derivar({ [id("reforcada")]: 2 });
assert.equal(duas.estilo.gastoVagas, 2);
assert.equal(duas.rdGeral - d.rdGeral, 12);
assert.equal(duas.rdFisico, d.rdFisico, "preserva a RD física");
assert.equal(derivar({ [id("reforcada")]: 1 }).rdGeral - d.rdGeral, 6);
assert.equal(derivar({ [id("reforcada")]: 2, "lime-neds:dentro": false }).rdGeral, d.rdGeral);
assert.equal(derivar({ [id("reforcada")]: 2, estilo_ativo: false }).rdGeral, d.rdGeral);
assert.equal(derivar({ [id("reforcada")]: 2, ativo: false }).rdGeral, d.rdGeral);
assert.equal(derivar({ [id("reforcada")]: 2 }, { aptidoesAmaldicoadas: ["dominio_simples"] }).rdGeral, d.rdGeral);
assert.equal(derivar({ [id("reforcada")]: 99 }).estilo.gastoVagas, 2);
const defesaBase = derivar({
  [id("provocacao")]: 1,
  [id("aumento_defesa")]: 1,
  "lime-neds:defesa": true,
  "lime-neds:margem": 6,
});
assert.equal(defesaBase.defesa - d.defesa, 6, "Aura 3 e margem 6 concedem 3 + 3");
const defesaDuas = derivar({
  [id("provocacao")]: 1,
  [id("aumento_defesa")]: 2,
  "lime-neds:defesa": true,
  "lime-neds:margem": 20,
});
assert.equal(defesaDuas.defesa - d.defesa, 14, "cada imbuição concede Aura 3 + margem limitada à Maestria 4");
assert.equal(derivar({
  [id("aumento_defesa")]: 1,
  "lime-neds:defesa": true,
  "lime-neds:margem": 6,
}).defesa, d.defesa, "exige Provocação Desafiadora imbuída");
const amigos = derivar({ [id("amizade")]: 2 }).estilo.conhecidas.find((t) => t.id.endsWith(":amizade"));
assert.equal(amigos.resultadosCalculados[0].valor, 6);
const sem = derivar({}, { addons: [] });
assert.equal(sem.attrEff.forca, 12);
assert.equal(sem.attrEff.inteligencia, 12);
assert.equal(sem.estilo.conhecidas.length, 0, "desinstalação não deixa técnicas fantasma");
assert.equal(ficha.attributes.forca, 12, "base salva intacta");
const excede = derivar({}, {
  attributes: { ...ficha.attributes, forca: 29 },
  core: { ...ficha.core, tecnicaEfeitos: [
    { canal: "atributo", alvo: "inteligencia", expr: "20" },
    { canal: "limiteAtributo", alvo: "inteligencia", expr: "10" },
  ] },
});
assert.equal(excede.attrEff.forca, 30);
assert.equal(excede.attrEff.inteligencia, 6);
assert.equal(excede.attrLimiteEfetivo.inteligencia, 6);
for (const k of Object.keys(d.attrEff)) {
  const somar = (linhas) => linhas.reduce((s, l) => s + (l.valor ?? Number(String(l.texto ?? 0).replace("−", "-"))), 0);
  assert.equal(somar(d.partesAtributo[k]), d.attrEff[k], `fontes do atributo ${k}`);
  assert.equal(somar(d.partesLimite[k]), d.attrLimiteEfetivo[k], `fontes do limite ${k}`);
}
const sessao = { ...sessaoEmBranco(), rodada: 1, combate: { ...ficha.combate, "lime-neds:defesa": true, "lime-neds:margem": 6 } };
for (const s of [proximaRodada(sessao, d).sessao, descansar(sessao, d)]) {
  assert.equal(s.combate["lime-neds:defesa"], false);
  assert.equal(s.combate["lime-neds:margem"], 0);
  assert.equal(s.combate["lime-neds:dentro"], true);
}
assert.ok(AD.validarPacote({ ...pacote, atributos: { inteligencia: { limiteFixo: -1 } } }).length);
assert.ok(AD.validarPacote({ ...pacote, estilos: [{ ...pacote.estilos[0], maxImbuicoes: 0 }] }).length);
assert.deepEqual(AD.aplicarAddons([]).problemas, []);
console.log("TODOS OS 1 ASSERTS PASSARAM");
