import { readFileSync, writeFileSync } from "node:fs";
const p = ".audit/lote02-servidor-antes.mjs";
const s = readFileSync(p, "utf8").replace('const server = await createServer({', 'const server = await createServer({\n  cacheDir: ".audit/lote02-vite-antes",');
writeFileSync(p, s);
writeFileSync(".audit/lote02-servidor-depois.mjs", 'import { createServer } from "vite";\nconst server = await createServer({ cacheDir: ".audit/lote02-vite-depois", server: { host: "127.0.0.1", port: 5174, strictPort: true } });\nawait server.listen();\nserver.printUrls();\n');
