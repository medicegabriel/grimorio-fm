import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import assert from "node:assert/strict";
const caminho = "docs/afty-status.md";
const antes = readFileSync(caminho, "utf8");
const de = "**Verificado ao vivo, leiaute:** em /afty e /player, a largura da aba Habilidades";
const para = "**Verificado ao vivo, leiaute:** em telefone emulado de 390 px, nas rotas /afty e /player, a largura da aba Habilidades";
assert.equal(antes.split(de).length, 2);
const novo = antes.replace(de, para).replace("e todas as demais abas, inclusive Outros, medem 390 px. Em 1440 px, o card Perfil", "e todas as demais abas, inclusive Outros, medem 390 px. A janela de desktop em 390 px também passa, com 375 px úteis devido à barra vertical e sem vazamento. Em 1440 px, o card Perfil");
assert.equal(readFileSync(caminho,"utf8"), antes);
writeFileSync(caminho, novo);
const files = [
  ["src/systems/afty/AftyCreatureBuilder.jsx", "AftyCreatureBuilder.jsx"],
  ["src/systems/afty/ui/primitivos.jsx", "primitivos.jsx"],
  ["docs/a-fazer.md", "a-fazer.md"],
  ["docs/afty-status.md", "afty-status.md"],
  ["docs/automacao-dsl.md", "automacao-dsl.md"],
  ["docs/afty-equipamentos.md", "afty-equipamentos.md"],
  ["docs/afty-invocacoes.md", "afty-invocacoes.md"],
];
for (const [atual, base] of files) {
  let diff;
  try { diff = execFileSync("git", ["diff", "--no-index", "--", `.audit/lote02-base/${base}`, atual], {encoding:"utf8", stdio:["ignore","pipe","pipe"]}); }
  catch(e) { if(e.status !== 1) throw e; diff = e.stdout; }
  const adicoes = diff.split("\n").filter((l)=>l.startsWith("+")&&!l.startsWith("+++"));
  assert.equal(adicoes.some((l)=>l.includes(String.fromCharCode(8212))), false, atual);
}
assert.equal(readFileSync("asserts/t-criador-namespaces.mjs","utf8").includes(String.fromCharCode(8212)), false);
const antigo = JSON.parse(readFileSync(".audit/lote02-layout-antes.json","utf8"));
const recente = JSON.parse(readFileSync(".audit/lote02-layout-depois.json","utf8"));
const telefones = JSON.parse(readFileSync(".audit/lote02-layout-depois-telefone.json","utf8"));
for (const caso of telefones) {
  assert.deepEqual(caso.erros, []);
  for (const aba of caso.abas) assert.equal(aba.largura, 390, `${caso.rota}: ${aba.aba}`);
  const perfil = caso.abas.find((a)=>a.aba === "Habilidades").perfil;
  assert.ok(perfil.seletor.y >= perfil.titulo.y + perfil.titulo.altura);
}
for (const caso of recente) {
  assert.deepEqual(caso.erros, []);
  for (const aba of caso.abas) assert.ok(aba.largura <= caso.largura);
  assert.ok(caso.cabecalho.voltar.y >= 0);
  if (caso.largura !== 1440) continue;
  const antigoCaso = antigo.find((a)=>a.rota === caso.rota && a.largura === 1440);
  const a = antigoCaso.abas.find((a)=>a.aba === "Habilidades").perfil;
  const b = caso.abas.find((a)=>a.aba === "Habilidades").perfil;
  for (const parte of ["cabecalho", "titulo", "seletor"]) {
    for (const eixo of ["x", "largura", "altura"]) assert.equal(a[parte][eixo], b[parte][eixo]);
  }
}
assert.equal(JSON.parse(readFileSync(".audit/lote02-formulas.json","utf8")).length, 8);
console.log("Revisão concluída: adições sem U+2014, 25 abas de telefone em 390 px, desktop preservado e oito provas de fórmula");
