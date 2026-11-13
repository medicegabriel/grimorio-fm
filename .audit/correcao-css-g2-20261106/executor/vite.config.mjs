/* REVISÃO CLAUDE G2 + CSS PERSONALIZADO (2026-11-05): executor PRÓPRIO, build em ./dist desta pasta. Não toca o dist diário, a 5173 nem a 5330.
   Uso, na raiz do grimorio-tracker:
     node node_modules/vite/bin/vite.js build --config .audit/revisao-claude-g2-css-20261105/executor/vite.config.mjs
     node .audit/revisao-claude-g2-css-20261105/executor/servidor.mjs 5341 */
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const AQUI = fileURLToPath(new URL(".", import.meta.url));
const REPO = fileURLToPath(new URL("../../../", import.meta.url));

if (process.argv.includes("build")) process.env.NODE_ENV = "production";

export default {
  root: AQUI,
  base: "./",
  cacheDir: `${AQUI}.vite-cache`,
  publicDir: false,
  plugins: [react(), tailwindcss()],
  server: { host: "127.0.0.1", port: 5341, strictPort: true, fs: { allow: [REPO] } },
  build: { outDir: `${AQUI}dist`, emptyOutDir: true, chunkSizeWarningLimit: 8000 },
};
