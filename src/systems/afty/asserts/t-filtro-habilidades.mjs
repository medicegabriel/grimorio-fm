import assert from "node:assert/strict";
import { register } from "node:module";

register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);
const { deriveAfty } = await import("../afty-derive.js");
const { createBlankAfty } = await import("../afty-schema.js");
const { getHabilidade, gruposDeHabilidade, HABILIDADES_ROUBAVEIS } = await import("../afty-habilidades.js");
const { conteudoDaFicha } = await import("../ficha/ficha-conteudo.js");
const { HABILIDADE_EFEITOS } = await import("../afty-efeitos-conteudo.js");
const { correspondeFiltroHabilidade: casa, filtraHabilidades, filtraGruposDeHabilidade } = await import("../afty-filtro-habilidades.js");

for (const efeito of ["acerto", "dano", "atencao"]) assert.ok(casa(getHabilidade("res_foco_no_inimigo"), efeito));
assert.ok(casa(getHabilidade("cmb_presenca_suprimida"), "furtividade"));
assert.ok(casa(getHabilidade("cmb_mente_oculta"), "furtividade"));
assert.ok(casa(getHabilidade("cmb_guarda_estudada"), "defesa"));
assert.ok(casa(getHabilidade("res_restricao_definitiva"), "furtividade"), "Efeito de mesa não automatizado continua encontrável");
assert.ok(casa(getHabilidade("cmb_repertorio_do_especialista"), "defesa", "estilo defensivo"));
assert.ok(!casa(getHabilidade("cmb_presenca_suprimida"), "dano"));
assert.ok(casa({ nome: "Atenção", descricao: "Bônus em **Furtividade**." }, "furtividade", "atencao furtividade"));
assert.ok(!casa({ nome: "Atenção", descricao: "Bônus em Furtividade." }, "furtividade", "atencao defesa"));
assert.ok(!casa({ nome: "Sem efeito", requisitos: [{ label: "Furtividade" }] }, "furtividade"));
for (const descricao of ["Rolagem de ataque", "Rolagens de ataque", "Jogada de ataque", "Jogadas de ataque"]) {
  assert.ok(casa({ descricao }, "acerto"));
}
assert.ok(casa({ nome: "Personalizada", efeitos: [{ canal: "bonusAcerto", expr: "2", quando: "em_combate" }] }, "acerto"));
assert.ok(casa({ nome: "Personalizada", efeitos: [{ canal: "bonusPericia", alvo: "furtividade", expr: "2" }] }, "furtividade"));
assert.ok(!casa({ nome: "Personalizada", efeitos: [{ canal: "danoBonus", expr: "defesa", quando: "em_combate" }] }, "defesa"));
const addon = { id: "teste_filtro_addon", nome: "Personalizada" };
HABILIDADE_EFEITOS[addon.id] = [{ canal: "defesa", expr: "2" }];
try {
  assert.ok(casa(addon, "defesa"));
  HABILIDADE_EFEITOS[addon.id] = [{ canal: "atencao", expr: "2" }];
  assert.ok(!casa(addon, "defesa"));
  assert.ok(casa(addon, "atencao"));
} finally { delete HABILIDADE_EFEITOS[addon.id]; }

const grupos = gruposDeHabilidade("combatente");
const antes = JSON.stringify(grupos);
const recorte = filtraGruposDeHabilidade(grupos, "furtividade");
assert.ok(recorte.flatMap((g) => g.habilidades).some((h) => h.id === "cmb_mente_oculta"));
assert.ok(!recorte.some((g) => g.habilidades.length === 0));
assert.deepEqual(filtraGruposDeHabilidade(grupos, "todos"), grupos);
assert.deepEqual(filtraGruposDeHabilidade(grupos, "furtividade", "zzzinexistente"), []);
assert.equal(JSON.stringify(grupos), antes);
assert.ok(filtraHabilidades(HABILIDADES_ROUBAVEIS, "furtividade").some((h) => h.id === "cmb_presenca_suprimida"));

for (const rulesVersion of ["afty", "player"]) {
  const ficha = createBlankAfty();
  ficha.rulesVersion = rulesVersion;
  ficha.core.nd = 16;
  ficha.especializacoes = [{ id: "combatente", nivel: 16 }];
  ficha.habilidades = ["cmb_repertorio_do_especialista", "cmb_presenca_suprimida", "cmb_mente_oculta", "cmb_guarda_estudada"];
  ficha.escolhasHabilidade = { cmb_repertorio_do_especialista: ["cmb_estilo_distante"] };
  const original = structuredClone(ficha);
  const derived = deriveAfty(ficha);
  const itens = conteudoDaFicha(ficha, derived);
  const presenca = filtraHabilidades(itens, "furtividade", "presenca");
  assert.deepEqual(presenca.map((i) => i.id), ["cmb_presenca_suprimida"]);
  const repertorio = itens.find((i) => i.id === "cmb_repertorio_do_especialista");
  assert.ok(repertorio);
  assert.ok(casa(repertorio, "dano"));
  assert.ok(!casa(repertorio, "defesa"), "Ficha pronta não indexa o Estilo Defensivo que não foi escolhido");
  assert.deepEqual(filtraHabilidades(itens, "todos"), itens);
  assert.deepEqual(ficha, original);
  // O retorno também tem callbacks, criados novamente em cada derivação.
  assert.equal(JSON.stringify(deriveAfty(ficha)), JSON.stringify(derived));
}
console.log("Filtros: efeitos, condições, opções aninhadas, busca sem acento, addons e deriveAfty passaram.");
