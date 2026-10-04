import { register } from "node:module";
register("data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}", import.meta.url);
const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
for (const sis of ["afty", "player"]) {
  const mk = (anat, combate) => {
    const c = createBlankAfty(); c.rulesVersion = sis; c.core.nd = 5;
    c.core.origem = { id: "feto_amaldicoado_hibrido", ...(anat ? { anatomias: anat } : {}) };
    if (combate) c.combate = { ...c.combate, ativo: true };
    return deriveAfty(c);
  };
  const [semA, semAC, comA, comAC] = [mk(null, false), mk(null, true), mk(["instinto_sanguinario"], false), mk(["instinto_sanguinario"], true)];
  console.log(sis, "maestria", comA.maestria, "atencao sem/semC/com/comC", semA.atencao, semAC.atencao, comA.atencao, comAC.atencao,
    "inic", semA.iniciativa, comA.iniciativa, comAC.iniciativa);
  console.log(" partes atencao comC", JSON.stringify(comAC.partes.atencao));
  console.log(" detalhes", JSON.stringify(comAC.efeitos.detalhes.filter(d => d.nome === "Instinto Sanguínário" || d.nome === "Instinto Sanguinário")));
}
