/* global process */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { pluginDoServiceWorker } from './src/celular/sw-plugin.js'
import { pluginDasPortas } from './src/celular/portas-plugin.js'

// A Vercel builda com NODE_ENV=development no ambiente, o que faz o
// `vite build` gerar um bundle de desenvolvimento (React sem otimizacao e
// Vercel Analytics em modo debug). Forcamos producao no comando de build.
if (process.argv.includes('build')) {
  process.env.NODE_ENV = 'production'
}

// A versão do app (etapas E8 e E9): os sete primeiros do commit que a Vercel publica, ou uma marca de tempo no build local, para
// cada build contar como versão nova. A MESMA versão vai para a página (`import.meta.env.VITE_FM_VERSAO`, que o Mais mostra) e
// para o service worker, e é assim que a página sabe se o worker que chegou é o dela.
const VERSAO = process.env.VERCEL_GIT_COMMIT_SHA
  ? process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 7)
  : `local-${Date.now().toString(36)}`
process.env.VITE_FM_VERSAO = VERSAO

// https://vite.dev/config/
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        // O motor do Afty depende da ordem de avaliação das suas entradas.
        manualChunks(id) {
          if (/[\\/]node_modules[\\/]lucide-react[\\/]/.test(id)) return 'lucide-react'
        },
      },
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    // O service worker do app (etapa E9, `src/celular/sw-plugin.js`). `VITE_SW_DESLIGADO=1` grava o que se desliga sozinho.
    pluginDoServiceWorker({ versao: VERSAO, desligado: process.env.VITE_SW_DESLIGADO === '1' }),
    // As portas de pré-carga (`src/celular/portas-plugin.js`): grava no index.html do build os arquivos do App e da Ficha.
    pluginDasPortas(),
    {
      name: 'fm-minificar-index',
      apply: 'build',
      transformIndexHtml: {
        order: 'post',
        handler(html) {
          // Preserva o conteúdo de scripts, estilos e elementos com espaços significativos.
          return html.replace(
            /<(script|style|pre|textarea)\b[^>]*>[\s\S]*?<\/\1\s*>|<!--[\s\S]*?-->|>[\t ]*\r?\n\s*(?=<)/gi,
            (trecho, tag) => {
              if (tag) return trecho
              return trecho.startsWith('<!--') ? '' : '> '
            },
          ).trim()
        },
      },
    },
  ],
})
