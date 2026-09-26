import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte()],
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
