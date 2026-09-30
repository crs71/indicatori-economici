import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// Config separat de vite.config.js: nu are nevoie de middleware-ul de dev
// pentru proxy-ul INS (irelevant pentru teste). Are nevoie de plugin-ul
// Svelte doar ca să compileze fișierele *.svelte importate de testele de
// componente — modulele JS pure (translations.js etc.) nu-l folosesc.
export default defineConfig({
  plugins: [svelte({ hot: false })],
  // Fără asta, Vite rezolvă pachetul "svelte" pe condiția lui de server (SSR)
  // în loc de cea de browser, iar componentele s-ar compila pentru randare pe
  // server — @testing-library/svelte are nevoie de varianta de client (DOM).
  resolve: {
    conditions: ['browser'],
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.js'],
    setupFiles: ['./vitest.setup.js'],
  },
});
