/* Hash de todos os arquivos do dist diário (só leitura), para provar que a prévia não o tocou. Uso: node hash-dist.mjs <saida.txt> */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
const raiz = "C:/Projetos/Grimorio/grimorio-tracker/dist";
const lista = [];
const anda = (d) => { for (const n of fs.readdirSync(d)) { const f = path.join(d, n); if (fs.statSync(f).isDirectory()) anda(f); else lista.push(`${path.relative(raiz, f).split(path.sep).join("/")} ${crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex")}`); } };
anda(raiz);
fs.writeFileSync(process.argv[2], lista.sort().join("\n") + "\n");
console.log(`${lista.length} arquivos no dist`);
