import { createServer } from "vite";
const server = await createServer({ cacheDir: ".audit/lote02-vite-depois", server: { host: "127.0.0.1", port: 5174, strictPort: true } });
await server.listen();
server.printUrls();
