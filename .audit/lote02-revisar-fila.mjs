import { readFileSync } from "node:fs";
const nomes = (p) => new Set([...readFileSync(p,"utf8").matchAll(/\b(t-[\w-]+\.mjs)\b/g)].map((m) => m[1]));
const antes = nomes(".audit/lote02-asserts-antes.log");
const depois = nomes(".audit/lote02-asserts-depois.log");
console.log("Asserts novos desde a linha de base:", [...depois].filter((n) => !antes.has(n)));
const fila = readFileSync("docs/a-fazer.md", "utf8");
for (const titulo of ["Os 64px de margem morta do cabeçalho do criador, agora sem bloqueio", "O Atributo da Técnica estoura a largura em 390px", "A aba Habilidades do criador vaza 28px em 390px", "Dois campos de expressão aprovam nome de variável que não existe"]) {
  const inicio = fila.indexOf(`### ${titulo}`);
  const resto = fila.slice(inicio);
  const fim = resto.slice(1).search(/^#{1,6} /m);
  console.log(resto.slice(0, fim < 0 ? undefined : fim + 1));
}
