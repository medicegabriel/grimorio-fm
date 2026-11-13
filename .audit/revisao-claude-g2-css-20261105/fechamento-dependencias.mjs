/* Preparação da publicação: quais arquivos NÃO rastreados de src/ o build realmente exige, dado que todos os arquivos rastreados (com as
   modificações da árvore) entram no commit? Fechamento transitivo dos imports a partir dos rastreados, atravessando os novos. */
import fs from "node:fs";
import path from "node:path";
import cp from "node:child_process";

const BARRA = String.fromCharCode(92);
const barras = (s) => s.split(BARRA).join("/");
const sh = (c) => cp.execSync(c, { encoding: "utf8", maxBuffer: 1 << 26 }).split(/\r?\n/).filter(Boolean);
const rastreados = sh("git -c safe.directory=* ls-files -- src").map((p) => path.normalize(p));
const novos = new Set(sh("git -c safe.directory=* ls-files -o --exclude-standard -- src").map((p) => path.normalize(p)));
const existe = (p) => fs.existsSync(p) && fs.statSync(p).isFile();
const resolve = (de, spec) => {
  if (!spec.startsWith(".")) return null;
  const base = path.normalize(path.join(path.dirname(de), spec.split("?")[0]));
  for (const c of [base, `${base}.js`, `${base}.jsx`, path.join(base, "index.js"), path.join(base, "index.jsx")]) if (existe(c)) return c;
  return null;
};
const RE = /(?:import|export)\s[^'"`]*?from\s*["']([^"']+)["']|import\s*["']([^"']+)["']|import\(\s*["']([^"']+)["']\s*\)/g;
const filhos = (f) => {
  if (!/\.(js|jsx)$/.test(f)) return [];
  const t = fs.readFileSync(f, "utf8");
  const out = new Set();
  for (const m of t.matchAll(RE)) {
    const r = resolve(f, m[1] || m[2] || m[3] || "");
    if (r) out.add(r);
  }
  return [...out];
};
const vis = new Set();
const pilha = rastreados.filter((f) => existe(f));
const exigidos = new Map();
while (pilha.length) {
  const f = pilha.pop();
  if (vis.has(f)) continue;
  vis.add(f);
  for (const n of filhos(f)) {
    if (novos.has(n) && !exigidos.has(n)) exigidos.set(n, f);
    pilha.push(n);
  }
}
const opcionais = [...novos].filter((n) => !exigidos.has(n));
const direto = [...exigidos].filter(([, de]) => rastreados.includes(de)).length;
const saida = {
  novos: novos.size,
  exigidos: [...exigidos].map(([n, de]) => ({ arquivo: barras(n), importadoPrimeiroPor: barras(de) })),
  opcionais: opcionais.map(barras),
};
fs.writeFileSync(new URL("./base/fechamento-dependencias.json", import.meta.url), JSON.stringify(saida, null, 1));
console.log(JSON.stringify({ novos: novos.size, exigidosPeloBuild: exigidos.size, importadosDiretamentePorRastreados: direto, semImportador: opcionais.length }));
console.log("sem importador:", opcionais.map((x) => path.basename(x)).join(", "));
