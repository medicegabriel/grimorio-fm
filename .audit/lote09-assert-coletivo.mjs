import fs from 'node:fs';
const p='asserts/t-descanso-marionetes.mjs';
let s=fs.readFileSync(p,'utf8');
s=s.replace('const S = await import(R + "ficha/ficha-sessao.js");','const S = await import(R + "ficha/ficha-sessao.js");\nconst { redutorDeEncontro } = await import(R + "encontros/usar-encontro-afty.js");');
const anchor='  t(sistema + ": nenhuma operação altera a sessão original", JSON.stringify(s), salvo);';
if(!s.includes(anchor)) throw Error('assert anchor');
s=s.replace(anchor,`  const coletivo = redutorDeEncontro({ combatentes: [{ id: "c1", sessao: s }, { id: "c2", sessao: s }, { id: "sem", sessao: s }] },
    { tipo: "DESCANSAR_TODOS", derivados: { c1: d, c2: d }, marionetes: { c1: "A", c2: "B" } });
  t(sistema + ": descanso coletivo respeita uma escolha por combatente",
    coletivo.combatentes.slice(0, 2).map((c) => [vitais(c.sessao, "A"), vitais(c.sessao, "B")]),
    [[["ativa", null, 0, null], ["recolhida", 0, 2, 0.25]], [["ativa", 4, 1, null], ["fora", null, 0, null]]]);
  t(sistema + ": descanso coletivo conserva combatente sem derivados", coletivo.combatentes[2].sessao, s);
`+anchor);
fs.writeFileSync(p,s);
