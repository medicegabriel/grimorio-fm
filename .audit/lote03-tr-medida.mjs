import { register } from "node:module";
register("data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}", import.meta.url);
const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const base = (sistema, esp) => {
  const f = createBlankAfty(); f.rulesVersion = sistema;
  f.core = { ...f.core, nd: esp.reduce((s, e) => s + e.nivel, 0), tipo: "misto", patamar: "comum" };
  f.especializacoes = esp;
  if (esp[0]?.id === "restringido") f.core.origem = { ...f.core.origem, id: "restringido" };
  f.attributes = { forca: 10, destreza: 10, constituicao: 10, inteligencia: 10, sabedoria: 10, presenca: 10 };
  return f;
};
const soQuem = (d) => Object.fromEntries(d.testes.resistencias.filter((r) => r.prof).map((r) => [r.value, r.prof]));
for (const sistema of ["player", "afty"]) {
  const f = base(sistema, [{ id: "restringido", nivel: 8 }]);
  f.habilidades = ["res_forca_imparavel"];
  f.escolhasHabilidade = { res_forca_imparavel: ["res_imparavel_fortitude", "res_imparavel_vontade"] };
  if (sistema === "afty") f.resistenciasProf = { fortitude: "treinado" };
  const d = deriveAfty(f);
  console.log(sistema, "Imparavel", d.habilidades.efetivas.includes("res_forca_imparavel"), JSON.stringify(soQuem(d)));
  const g = base(sistema, [{ id: "combatente", nivel: 8 }]);
  g.trDaClasse = ["fortitude"];
  g.talentos = ["tal_resiliencia_melhorada"];
  g.escolhasTalento = { tal_resiliencia_melhorada: ["tal_resiliencia_fortitude"] };
  if (sistema === "afty") g.resistenciasProf = { fortitude: "treinado" };
  const dg = deriveAfty(g);
  console.log(sistema, "Resiliencia", dg.talentos.escolhidas.includes("tal_resiliencia_melhorada"), JSON.stringify(soQuem(dg)), "con", dg.attrEff.constituicao);
}
