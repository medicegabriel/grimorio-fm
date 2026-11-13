import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Uso: node servidor.mjs <pasta-do-build-isolado> (porta em PORTA, padrão 5347, nunca a 5330)
const RAIZ = path.resolve(process.argv[2] ?? "./dist") + path.sep;
const PORTA = Number(process.env.PORTA ?? 5347);
const TIPOS = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png" };
http.createServer((req, res) => {
  const caminho = decodeURIComponent(new URL(req.url, "http://x").pathname);
  let arquivo = path.normalize(path.join(RAIZ, caminho));
  if (!arquivo.startsWith(RAIZ)) { res.writeHead(403).end(); return; }
  if (!fs.existsSync(arquivo) || fs.statSync(arquivo).isDirectory()) arquivo = path.join(RAIZ, "index.html");
  res.writeHead(200, { "Content-Type": TIPOS[path.extname(arquivo)] ?? "application/octet-stream", "Cache-Control": "no-store" });
  fs.createReadStream(arquivo).pipe(res);
}).listen(PORTA, "127.0.0.1", () => console.log("ok " + PORTA));
