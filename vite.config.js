import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// A Vercel builda com NODE_ENV=development no ambiente, o que faz o
// `vite build` gerar um bundle de desenvolvimento (React sem otimizacao e
// Vercel Analytics em modo debug). Forcamos producao no comando de build.
if (process.argv.includes('build')) {
  process.env.NODE_ENV = 'production'
}

// A versão que o Mais da Guilda mostra (etapa E8 do app): os sete primeiros do commit que a Vercel publica, ou "local".
// Pelo `VITE_` ela chega ao código como `import.meta.env.VITE_FM_VERSAO`, sem global solto.
process.env.VITE_FM_VERSAO = (process.env.VERCEL_GIT_COMMIT_SHA || 'local').slice(0, 7)

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
})