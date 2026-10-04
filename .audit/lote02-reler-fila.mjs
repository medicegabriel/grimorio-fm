import { readFileSync } from "node:fs";
const fila = readFileSync("docs/a-fazer.md", "utf8");
for (const titulo of ["Os 64px de margem morta do cabeçalho do criador, agora sem bloqueio", "O Atributo da Técnica estoura a largura em 390px", "A aba Habilidades do criador vaza 28px em 390px", "Dois campos de expressão aprovam nome de variável que não existe"]) {
  const inicio = fila.indexOf(`### ${titulo}`);
  const fimLinha = fila.indexOf("\n", inicio);
  const proximo = /^#{1,6} /m.exec(fila.slice(fimLinha + 1));
  const fim = proximo ? fimLinha + 1 + proximo.index : fila.length;
  console.log(fila.slice(inicio, fim));
}
