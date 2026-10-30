/* PRÉVIA DAS TRÊS ABAS DO G2 (2026-10-21): build e servidor de desenvolvimento PRÓPRIOS. Raiz nesta pasta, saída em ./dist desta pasta.
   Importa o código do app em src/ (fonte única das abas) e usa os mesmos plugins do app. Nada é escrito fora desta pasta: o dist diário do
   app (grimorio-tracker/dist) não é tocado. Uso, na raiz do grimorio-tracker:
     npx vite build --config .audit/previa-abas-g2-20261021/vite.config.mjs
     node .audit/previa-abas-g2-20261021/servidor.mjs 5330 */
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
  server: { host: "127.0.0.1", port: 5330, strictPort: true, fs: { allow: [REPO] } },
  build: { outDir: `${AQUI}dist`, emptyOutDir: true, chunkSizeWarningLimit: 8000 },
};
