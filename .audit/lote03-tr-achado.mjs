import { register } from "node:module";
register("data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}", import.meta.url);
const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const soQuem = (d) => Object.fromEntries(d.testes.resistencias.filter((r) => r.prof).map((r) => [r.value, r.prof + (r.semFonte ? "(semFonte)" : "")]));
for (const sistema of ["player", "afty"]) {
  const f = createBlankAfty(); f.rulesVersion = sistema;
  f.core = { ...f.core, nd: 8, tipo: "misto", patamar: "comum", origem: { id: "restringido" } };
  f.especializacoes = [{ id: "restringido", nivel: 8 }];
  f.talentos = ["tal_alma_inquebravel"];
  f.habilidades = ["res_forca_imparavel"];
  f.escolhasHabilidade = { res_forca_imparavel: ["res_imparavel_integridade", "res_imparavel_vontade"] };
  const d = deriveAfty(f);
  console.log(sistema, "Alma Inquebravel + Imparavel na Integridade", d.talentos.escolhidas, JSON.stringify(soQuem(d)));
  const g = createBlankAfty(); g.rulesVersion = sistema;
  g.core = { ...g.core, nd: 8, tipo: "misto", patamar: "comum" };
  g.especializacoes = [{ id: "combatente", nivel: 8 }];
  g.trDaClasse = ["reflexos"];
  g.resistenciasProf = { fortitude: "treinado" };
  g.talentos = ["tal_resiliencia_melhorada"];
  g.escolhasTalento = { tal_resiliencia_melhorada: ["tal_resiliencia_fortitude"] };
  console.log(sistema, "Fortitude a mao + Resiliencia", JSON.stringify(soQuem(deriveAfty(g))));
}
