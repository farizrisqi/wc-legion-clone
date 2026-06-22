import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // Base path relatif, sangat aman untuk Vercel static build
  server: { port: 5173 },
  build: { assetsDir: 'assets' }
});