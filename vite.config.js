import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

/**
 * INS TEMPO Online cere POST cu JSON pentru /tempo-ins/pivot, dar noi expunem
 * /api/inflatie-pivot ca GET cu query params (vezi functions/api/inflatie-pivot.js
 * pentru motiv). Un simple `proxy.rewrite` din Vite nu poate schimba metoda sau
 * construi un body — de-aia avem nevoie de un middleware dedicat, care oglindește
 * exact logica funcției Cloudflare, ca developmentul local să folosească
 * aceleași date live ca producția.
 */
function insPivotDevMiddleware() {
  return {
    name: 'ins-pivot-dev-middleware',
    configureServer(server) {
      server.middlewares.use('/api/inflatie-pivot', async (req, res) => {
        const url = new URL(req.url, 'http://localhost');
        const encQuery = url.searchParams.get('encQuery');
        const matMaxDim = Number(url.searchParams.get('matMaxDim') || 3);
        const matRegJ = Number(url.searchParams.get('matRegJ') || 0);
        const matUMSpec = Number(url.searchParams.get('matUMSpec') || 0);

        if (!encQuery) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'Missing encQuery param' }));
          return;
        }

        try {
          const upstream = await fetch('http://statistici.insse.ro:8077/tempo-ins/pivot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              encQuery,
              language: 'ro',
              matCode: 'IPC102E',
              matMaxDim,
              matRegJ,
              matUMSpec,
            }),
          });
          const text = await upstream.text();
          res.statusCode = upstream.status;
          res.setHeader('Content-Type', 'text/plain; charset=utf-8');
          res.end(text);
        } catch (err) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: 'Proxy error', message: String(err) }));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [svelte(), insPivotDevMiddleware()],
  server: {
    port: 3000,
    proxy: {
      '/api/curs': {
        target: 'https://curs.bnr.ro',
        changeOrigin: true,
        rewrite: () => '/nbrfxrates10days.xml',
        headers: {
          'User-Agent': 'Traducator-Indicatori-ASE/1.0',
        },
      },
      '/api/dobanda': {
        target: 'https://www.bnr.ro',
        changeOrigin: true,
        rewrite: () => '/idbfiles?cid=605&dfrom=&dto=&period=all&format=XML',
        headers: {
          'User-Agent': 'Traducator-Indicatori-ASE/1.0',
        },
      },
      '/api/inflatie-meta': {
        target: 'http://statistici.insse.ro:8077',
        changeOrigin: true,
        rewrite: () => '/tempo-ins/matrix/IPC102E',
      },
      '/api/bnr': {
        target: 'https://curs.bnr.ro',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/bnr/, ''),
        headers: {
          'User-Agent': 'Traducator-Indicatori-ASE/1.0',
        },
      },
    },
  },
});
