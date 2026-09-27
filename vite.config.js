import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

/**
 * INS TEMPO Online cere POST cu JSON pentru /tempo-ins/pivot, dar noi expunem
 * /api/ins-pivot ca GET cu query params (vezi functions/api/ins-pivot.js pentru
 * motiv). Un simplu `proxy.rewrite` din Vite nu poate schimba metoda sau
 * construi un body — de-aia avem nevoie de un middleware dedicat, care
 * oglindește exact logica funcției Cloudflare, ca developmentul local să
 * folosească aceleași date live ca producția. Generic — orice indicator bazat
 * pe INS (inflație, salariu mediu etc.) trece prin același endpoint, cu
 * `matCode` ca query param.
 */
function insPivotDevMiddleware() {
  return {
    name: 'ins-pivot-dev-middleware',
    configureServer(server) {
      server.middlewares.use('/api/ins-pivot', async (req, res) => {
        const url = new URL(req.url, 'http://localhost');
        const matCode = url.searchParams.get('matCode');
        const encQuery = url.searchParams.get('encQuery');
        const matMaxDim = Number(url.searchParams.get('matMaxDim') || 3);
        const matRegJ = Number(url.searchParams.get('matRegJ') || 0);
        const matUMSpec = Number(url.searchParams.get('matUMSpec') || 0);

        if (!matCode || !encQuery) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'Missing matCode or encQuery param' }));
          return;
        }

        try {
          const upstream = await fetch('http://statistici.insse.ro:8077/tempo-ins/pivot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              encQuery,
              language: 'ro',
              matCode,
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
      '/api/ins-meta': {
        target: 'http://statistici.insse.ro:8077',
        changeOrigin: true,
        rewrite: (path) => {
          const matCode = new URL(path, 'http://x').searchParams.get('matCode');
          return `/tempo-ins/matrix/${matCode}`;
        },
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
