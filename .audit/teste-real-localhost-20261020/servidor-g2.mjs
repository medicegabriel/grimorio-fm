// Servidor temporário de teste real. O endereço habitual abre o G2, sem
// alterar o seletor da aplicação, a build revisada ou os dados do navegador.
import { preview } from 'vite';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const port = Number(process.env.GRIMORIO_G2_PORT || 5173);
const server = await preview({
  root,
  configFile: false,
  appType: 'spa',
  preview: {
    host: 'localhost',
    port,
    strictPort: true,
    headers: { 'Cache-Control': 'no-store' },
  },
  plugins: [{
    name: 'g2-no-localhost-de-teste',
    configurePreviewServer(s) {
      s.middlewares.use((req, res, next) => {
        if (req.method !== 'GET' && req.method !== 'HEAD') return next();
        const url = new URL(req.url || '/', 'http://localhost');
        const route = url.pathname.replace(/\/$/, '');
        if (!['/Player', '/Afty'].includes(route) || url.searchParams.has('ficha-g2')) return next();
        url.searchParams.set('ficha-g2', '1');
        res.statusCode = 302;
        res.setHeader('Cache-Control', 'no-store');
        res.setHeader('Location', `${url.pathname}${url.search}`);
        res.end();
      });
    },
  }],
});

server.printUrls();
console.log('Teste local: /Player e /Afty abrem o G2. ?ficha-g2=0 mantém a clássica.');
const stop = async () => { await server.close(); process.exit(0); };
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
