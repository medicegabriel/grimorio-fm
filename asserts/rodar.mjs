/**
 * Lancador dos asserts do Afty.
 *
 *   npm run asserts            roda todos
 *   npm run asserts -- addons  roda so os que casam com "addons" no nome
 *
 * Nao usa laco de shell de proposito: script de package.json roda por cmd no
 * Windows, e o `for f in asserts/t-*.mjs` do LEIA.md quebraria la.
 *
 * Cada arquivo roda em processo PROPRIO, e nao importado aqui, por dois
 * motivos: eles mexem no mundo global dos Addons (aplicarAddons reescreve os
 * catalogos no lugar), e a ordem de importacao importa (ver o ciclo de
 * afty-combate.js anotado em docs/a-fazer.md).
 */
import { readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const AQUI = dirname(fileURLToPath(import.meta.url));
const filtro = process.argv.slice(2).filter((a) => !a.startsWith("-"));

const arquivos = readdirSync(AQUI)
  .filter((n) => n.startsWith("t-") && n.endsWith(".mjs"))
  .filter((n) => filtro.length === 0 || filtro.some((f) => n.includes(f)))
  .sort();

if (arquivos.length === 0) {
  console.error(filtro.length ? `Nenhum assert casa com ${filtro.join(", ")}` : "Nenhum assert em asserts/");
  process.exit(1);
}

let totalOk = 0;
const quebrados = [];

for (const nome of arquivos) {
  const r = spawnSync(process.execPath, [join(AQUI, nome)], { encoding: "utf8" });
  const saida = `${r.stdout ?? ""}${r.stderr ?? ""}`.trim();
  const passou = r.status === 0 && /TODOS OS \d+ ASSERTS PASSARAM/.test(saida);
  const quantos = Number(saida.match(/TODOS OS (\d+) ASSERTS/)?.[1] ?? 0);

  if (passou) {
    totalOk += quantos;
    console.log(`ok   ${nome.padEnd(24)} ${quantos}`);
  } else {
    quebrados.push(nome);
    console.log(`FALHOU ${nome}`);
    console.log(saida.split("\n").map((l) => `       ${l}`).join("\n"));
  }
}

console.log("");
if (quebrados.length) {
  console.log(`${quebrados.length} de ${arquivos.length} arquivos FALHARAM: ${quebrados.join(", ")}`);
  process.exit(1);
}
console.log(`${arquivos.length} arquivos, ${totalOk} asserts, todos passaram.`);
