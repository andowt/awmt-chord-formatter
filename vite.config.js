import { defineConfig } from 'vite';

export default defineConfig({
  base: '/awmt-chord-formatter/',
  build: {
    rollupOptions: {
      input: ['index.html', 'config.html'],
    },
  },
});
