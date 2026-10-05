import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const { estadoDaTecnica } = await import(R + "afty-estilo-sombras.js");
const AD = await import(R + "afty-addons.js");

const addon = JSON.parse(
  readFileSync(new URL("../addons/dancarino-das-laminas.json", import.meta.url), "utf8"),
);
const nova = createBlankAfty();
const estiloDano = {
  id: "est_teste_ritmo_dano",
  tipo: "especial",
  nome: "Ritmo de teste",
  descricao: "",
  efeitos: [{ canal: "nivelDano", alvo: "arma", expr: "dancarino_das_laminas_ritmo" }],
};
const estiloAtaques = {
  id: "est_teste_ritmo_ataques",
  tipo: "especial",
  nome: "Ataques de teste",
  descricao: "",
  custoImbuicao: 2,
  efeitos: [{ canal: "ataquesExtras", expr: "(dancarino_das_laminas_ritmo >= 3) + (dancarino_das_laminas_ritmo >= 6)" }],
};
const ficha = {
  ...nova,
  addons: [addon],
  core: { ...nova.core, nd: 10, origem: { id: "sem_tecnica" } },
  aptidoes: { dom: 4 },
  talentos: ["dancarino-das-laminas:tal_dancarino_das_laminas"],
  estilosSombra: [estiloDano, estiloAtaques],
  equipamentos: {
    itens: [{ uid: "eq_teste", tipo: "arma", refId: "arm_espada_curta", qtd: 1, equipado: true }],
  },
  combate: {
    ...nova.combate,
    ativo: true,
    estilo_ativo: true,
    [estadoDaTecnica(estiloDano.id)]: 1,
    [estadoDaTecnica(estiloAtaques.id)]: 1,
  },
};
const ritmoId = "dancarino-das-laminas:ritmo";

assert.deepEqual(AD.validarPacote(addon), []);
assert.deepEqual(AD.aplicarAddons(ficha.addons).problemas, []);

const derivarComRitmo = (ritmo, talentos = ficha.talentos) => deriveAfty({
  ...ficha,
  talentos,
  combate: { ...ficha.combate, [ritmoId]: ritmo },
});

const comTalento = AD.estadosCombateDeAddon(ficha, "max").find((e) => e.id === ritmoId);
assert.equal(comTalento.max, 6);

const semTalento = {
  ...ficha,
  talentos: ficha.talentos.filter((id) => id !== "dancarino-das-laminas:tal_dancarino_das_laminas"),
};
const estadoSemTalento = AD.estadosCombateDeAddon(semTalento, "max").find((e) => e.id === ritmoId);
assert.equal(estadoSemTalento.max, 3);

const ritmo2 = derivarComRitmo(2);
const ritmo3 = derivarComRitmo(3);
const ritmo6 = derivarComRitmo(6);
assert.equal(ritmo2.ataquesExtras, 0);
assert.equal(ritmo3.ataquesExtras, 1);
assert.equal(ritmo6.ataquesExtras, 2);
assert.equal(ritmo6.estilo.gastoVagas, 3);
assert.equal(
  ritmo6.estilo.conhecidas.find((e) => e.id === estiloAtaques.id).custoImbuicao,
  2,
);

const niveisDaArma = (d) => d.dano.entradas
  .filter((e) => e.id !== "basico")
  .map((e) => e.niveisDano);
const ritmo0 = derivarComRitmo(0);
assert.ok(niveisDaArma(ritmo0).length > 0);
assert.deepEqual(
  niveisDaArma(ritmo6),
  niveisDaArma(ritmo0).map((n) => n + 6),
);
const limitadoSemTalento = derivarComRitmo(6, semTalento.talentos);
assert.equal(limitadoSemTalento.ataquesExtras, 1);
assert.deepEqual(
  niveisDaArma(limitadoSemTalento),
  niveisDaArma(ritmo0).map((n) => n + 3),
);

console.log("TODOS OS 1 ASSERTS PASSARAM");
