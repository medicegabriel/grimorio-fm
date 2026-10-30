/* PRÉVIA DAS TRÊS ABAS DO G2: servidor estático do build desta pasta (./dist), só em 127.0.0.1.
   A porta vem do argumento (padrão 5341). Porta ocupada: sai com erro, sem tocar em quem a ocupa. Nunca use 5173, 5200, 5320 ou 5321. */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = fileURLToPath(new URL("./dist/", import.meta.url));
const PORTA = Number(process.argv[2] ?? 5341);
if ([5173, 5200, 5320, 5321].includes(PORTA)) { console.error(`A porta ${PORTA} é de outro servidor do projeto.`); process.exit(1); }
const TIPOS = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".pdf": "application/pdf", ".woff2": "font/woff2" };

const servidor = http.createServer((req, res) => {
  const caminho = decodeURIComponent(new URL(req.url, "http://x").pathname);
  let arquivo = path.normalize(path.join(RAIZ, caminho));
  if (!arquivo.startsWith(RAIZ)) { res.writeHead(403).end(); return; }
  if (!fs.existsSync(arquivo) || fs.statSync(arquivo).isDirectory()) arquivo = path.join(RAIZ, "index.html");
  res.writeHead(200, { "Content-Type": TIPOS[path.extname(arquivo)] ?? "application/octet-stream", "Cache-Control": "no-store" });
  fs.createReadStream(arquivo).pipe(res);
});
servidor.on("error", (e) => { console.error(e.code === "EADDRINUSE" ? `Porta ${PORTA} ocupada. Escolha outra livre.` : e.message); process.exit(1); });
servidor.listen(PORTA, "127.0.0.1", () => console.log(`Prévia das abas: http://127.0.0.1:${PORTA}/`));
