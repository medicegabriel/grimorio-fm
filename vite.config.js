import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// A Vercel builda com NODE_ENV=development no ambiente, o que faz o
// `vite build` gerar um bundle de desenvolvimento (React sem otimizacao e
// Vercel Analytics em modo debug). Forcamos producao no comando de build.
if (process.argv.includes('build')) {
  process.env.NODE_ENV = 'production'
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
})