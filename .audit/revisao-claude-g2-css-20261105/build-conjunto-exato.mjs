/* Prova do fechamento: monta numa pasta TEMPORÁRIA (fora do repositório) os arquivos rastreados, na versão da árvore de trabalho, mais só os novos
   que o fechamento exige, e roda o vite build lá. Controle negativo: o mesmo conjunto sem um dos exigidos tem de falhar, e o conjunto com os 6
   sem importador também tem de compilar. Não toca o repositório nem o dist diário. */
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import cp from "node:child_process";

const REPO = path.normalize(new URL("../../", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const fech = JSON.parse(fs.readFileSync(new URL("./base/fechamento-dependencias.json", import.meta.url), "utf8"));
const tracked = cp.execSync("git -c safe.directory=* ls-files", { cwd: REPO, encoding: "utf8", maxBuffer: 1 << 27 }).split(/\r?\n/).filter(Boolean);
const PRECISA = /^(src|public|addons|themes)\/|^(index\.html|package\.json|vite\.config\.js)$/;

function monta(destino, novos) {
  fs.rmSync(destino, { recursive: true, force: true });
  fs.mkdirSync(destino, { recursive: true });
  for (const rel of [...tracked, ...novos]) {
    if (!PRECISA.test(rel)) continue;
    const de = path.join(REPO, rel);
    if (!fs.existsSync(de)) continue;
    const para = path.join(destino, rel);
    fs.mkdirSync(path.dirname(para), { recursive: true });
    fs.copyFileSync(de, para);
  }
  fs.symlinkSync(path.join(REPO, "node_modules"), path.join(destino, "node_modules"), "junction");
}
function compila(destino) {
  const r = cp.spawnSync(process.execPath, [path.join(REPO, "node_modules/vite/bin/vite.js"), "build", "--outDir", path.join(destino, "saida")], { cwd: destino, encoding: "utf8", timeout: 240000 });
  const texto = `${r.stdout}\n${r.stderr}`;
  return { ok: r.status === 0, erro: r.status === 0 ? null : (texto.split(/\r?\n/).find((l) => /rror|Could not|Failed|resolve/i.test(l)) ?? texto.slice(-300)).slice(0, 260) };
}
const exigidos = fech.exigidos.map((x) => x.arquivo);
const opcionais = fech.opcionais;
const BASE = path.join(os.tmpdir(), "afty-fechamento-conjunto");
const resultados = {};

monta(BASE, exigidos);
resultados.soExigidos = { arquivosNovosIncluidos: exigidos.length, ...compila(BASE) };
console.log("só os exigidos:", JSON.stringify(resultados.soExigidos));

monta(BASE, [...exigidos, ...opcionais]);
resultados.todosOs31 = { arquivosNovosIncluidos: exigidos.length + opcionais.length, ...compila(BASE) };
console.log("todos os 31:", JSON.stringify(resultados.todosOs31));

const alvo = exigidos.find((x) => /afty-conteudo-regras\.js$/.test(x));
monta(BASE, exigidos.filter((x) => x !== alvo));
resultados.semUmExigido = { removido: alvo, ...compila(BASE) };
console.log("sem um exigido:", JSON.stringify(resultados.semUmExigido));

monta(BASE, []);
resultados.nenhumNovo = { arquivosNovosIncluidos: 0, ...compila(BASE) };
console.log("nenhum novo:", JSON.stringify(resultados.nenhumNovo));

fs.rmSync(path.join(BASE, "node_modules"), { recursive: true, force: true });
fs.rmSync(BASE, { recursive: true, force: true });
fs.writeFileSync(new URL("./base/build-conjunto-exato.json", import.meta.url), JSON.stringify({ geradoEm: new Date().toISOString(), resultados }, null, 1));
