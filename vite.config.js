import { defineConfig } from 'vite';

export default defineConfig({
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
