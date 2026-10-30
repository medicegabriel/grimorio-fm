/* TÉCNICAS MARCIAIS NO G2 (2026-10-27): build e servidor de desenvolvimento PRÓPRIOS. Raiz nesta pasta, saída em ./dist desta pasta.
   Importa o código do app em src/ (fonte única das abas) e usa os mesmos plugins do app. Nada é escrito fora desta pasta: o dist diário do
   app (grimorio-tracker/dist) não é tocado. Uso, na raiz do grimorio-tracker:
     npx vite build --config .audit/tecnicas-marciais-20261027/vite.config.mjs
     node .audit/tecnicas-marciais-20261027/servidor.mjs 5341 */
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const AQUI = fileURLToPath(new URL(".", import.meta.url));
const REPO = fileURLToPath(new URL("../../", import.meta.url));

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
