import { createServer } from "vite";
import { readFileSync } from "node:fs";
import path from "node:path";
const originais = new Map([
  [path.resolve("src/systems/afty/AftyCreatureBuilder.jsx").replaceAll("\\", "/"), ".audit/lote02-base/AftyCreatureBuilder.jsx"],
  [path.resolve("src/systems/afty/ui/primitivos.jsx").replaceAll("\\", "/"), ".audit/lote02-base/primitivos.jsx"],
]);
// Só este servidor carrega as duas cópias anteriores, sem reverter a árvore compartilhada.
const server = await createServer({
  cacheDir: ".audit/lote02-vite-antes",
  plugins: [{ name: "lote02-antes", enforce: "pre", load(id) {
    const copia = originais.get(id.split("?")[0].replaceAll("\\", "/"));
    if (copia) return readFileSync(copia, "utf8");
  } }],
  server: { host: "127.0.0.1", port: 5175, strictPort: true },
});
await server.listen();
server.printUrls();
