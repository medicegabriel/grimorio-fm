import assert from "node:assert/strict";
import { register } from "node:module";

register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);
// O derive é o ponto de entrada do ciclo de catálogos, como no aplicativo.
const { deriveAfty } = await import("../afty-derive.js");
const { createBlankAfty } = await import("../afty-schema.js");
const { catalogoImitacao, trocarCopiaImitacao, tentarAprenderImitacao, cdAprenderImitacao } = await import("../afty-imitacao.js");
const estilo = { tipo: "estilo", id: "cmb_estilo_defensivo" };
const passiva = { tipo: "passiva", id: "cmb_critico_melhorado" };
const postura = { tipo: "postura", id: "cmb_postura_da_terra" };
const ativa = { tipo: "ativa", id: "lut_ataque_inconsequente" };

for (const rulesVersion of ["afty", "player"]) {
  const ficha = createBlankAfty();
  ficha.rulesVersion = rulesVersion;
  ficha.core.nd = 16;
  ficha.especializacoes = [{ id: "restringido", nivel: 16 }];
  ficha.habilidades = ["res_imitacao", "res_imitacao_perfeita"];
  const antes = structuredClone(ficha);
  const base = deriveAfty(ficha);
  assert.equal(base.imitacao.disponivel, true);
  assert.equal(base.imitacao.perfeita, true);

  for (const copia of [estilo, passiva, postura, ativa]) {
    assert.ok(catalogoImitacao(copia.tipo).some((h) => h.id === copia.id));
    const combate = { ativo: true, ...trocarCopiaImitacao({}, copia) };
    const d = deriveAfty({ ...ficha, combate });
    assert.equal(d.imitacao.copia.id, copia.id);
    assert.equal(d.habilidades.gastos, base.habilidades.gastos);
    assert.deepEqual(d.especializacoes, base.especializacoes);
    if (copia === estilo) assert.equal(d.defesa - base.defesa, 6);
    assert.equal(deriveAfty({ ...ficha, combate: { ...combate, ativo: false } }).imitacao.copia, null);
  }

  let combate = { ativo: true };
  for (const copia of [estilo, passiva, postura, ativa]) {
    combate = { ...combate, ...trocarCopiaImitacao(combate, copia) };
    combate.imitacao = tentarAprenderImitacao(combate.imitacao, 40, base.imitacao);
  }
  assert.equal(combate.imitacao.aprendidas.length, 4);
  assert.equal(combate.postura, "");
  const aprendidas = structuredClone(combate.imitacao.aprendidas);
  for (const copia of aprendidas) {
    combate = { ...combate, ...trocarCopiaImitacao(combate, copia) };
    assert.deepEqual(combate.imitacao.aprendidas, aprendidas);
    assert.equal(deriveAfty({ ...ficha, combate }).imitacao.copia.id, copia.id);
  }
  combate = { ...combate, ...trocarCopiaImitacao(combate, null) };
  assert.equal(deriveAfty({ ...ficha, combate }).imitacao.copia, null);
  assert.deepEqual(combate.imitacao.aprendidas, aprendidas);

  let tentativa = { copia: estilo };
  assert.equal(cdAprenderImitacao(tentativa, estilo), 40);
  tentativa = tentarAprenderImitacao(tentativa, 39, base.imitacao);
  assert.equal(tentativa.aprendidas.length, 0);
  assert.equal(cdAprenderImitacao(tentativa, estilo), 38);
  tentativa = tentarAprenderImitacao(tentativa, 38, base.imitacao);
  assert.equal(tentativa.aprendidas.length, 1);
  tentativa = tentarAprenderImitacao(tentativa, 40, base.imitacao);
  assert.equal(tentativa.aprendidas.length, 1);

  const semPerfeita = { ...ficha, habilidades: ["res_imitacao"], combate: { ativo: true, imitacao: { copia: estilo } } };
  assert.equal(deriveAfty(semPerfeita).imitacao.perfeita, false);
  assert.equal(deriveAfty(semPerfeita).imitacao.copia, null);
  assert.deepEqual(ficha, antes);
}
console.log("Imitação: categorias, quatro aprendidas, alternância, CD e orçamento passaram em Afty e Player.");
