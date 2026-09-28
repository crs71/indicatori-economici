import { defineConfig } from 'vitest/config';

// Config separat de vite.config.js: testele acoperă doar module JS pure
// (translations.js etc.), nu au nevoie de plugin-ul Svelte sau de
// middleware-ul de dev pentru proxy-ul INS.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.js'],
  },
});
