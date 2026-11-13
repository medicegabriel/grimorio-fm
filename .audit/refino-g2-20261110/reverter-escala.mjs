/* Gera os CSS do "ANTES" da escala de texto, SEM tocar na árvore real.
   Uso: node reverter-escala.mjs <worktree-de-HEAD>
   Para cada CSS que ganhou os degraus var(--e-fs-*), lê o diff contra HEAD, e nos pares de linhas que só trocaram
   tamanho (mesmo texto depois de trocar todo "Npx" e todo var(--e-fs-x, Npx) por N) devolve a linha antiga.
   Escreve o resultado dentro da worktree. Imprime quantas linhas voltaram e o que sobrou com --e-fs-. */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const REPO = fileURLToPath(new URL("../../", import.meta.url));
const DESTINO = path.resolve(process.argv[2] ?? "");
if (!process.argv[2]) { console.error("Passe a pasta da worktree."); process.exit(1); }
const ARQUIVOS = ["src/systems/afty/ficha/efeitos/efeitos-g2.css", "src/systems/afty/ficha/abas-g2/abas-g2.css"];
const norma = (s) => s.replace(/var\(--e-fs-[a-z]+,\s*[\d.]+px\)/g, "N").replace(/[\d.]+px/g, "N").replace(/\s+/g, " ").trim();

for (const rel of ARQUIVOS) {
  const diff = execFileSync("git", ["diff", "-U0", "--no-color", "HEAD", "--", rel], { cwd: REPO, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  const atual = fs.readFileSync(path.join(REPO, rel), "utf8").split(/\r?\n/);
  let voltou = 0;
  const linhas = diff.split(/\r?\n/);
  for (let i = 0; i < linhas.length; i++) {
    const m = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/.exec(linhas[i]);
    if (!m) continue;
    const b = m[2] === undefined ? 1 : Number(m[2]);
    const c = Number(m[3]);
    const d = m[4] === undefined ? 1 : Number(m[4]);
    const velhas = [], novas = [];
    for (let j = i + 1; j < linhas.length && !linhas[j].startsWith("@@"); j++) {
      if (linhas[j].startsWith("-")) velhas.push(linhas[j].slice(1));
      else if (linhas[j].startsWith("+")) novas.push(linhas[j].slice(1));
    }
    if (b !== d || velhas.length !== novas.length) continue;
    if (!velhas.every((v, k) => norma(v) === norma(novas[k]))) continue;
    velhas.forEach((v, k) => { atual[c - 1 + k] = v; voltou++; });
  }
  const sobra = atual.filter((l) => l.includes("--e-fs-") && /var\(--e-fs-/.test(l)).length;
  fs.writeFileSync(path.join(DESTINO, rel), atual.join("\n"));
  console.log(`${rel}: ${voltou} linhas devolvidas ao tamanho antigo, ${sobra} linhas ainda com var(--e-fs-*)`);
}
