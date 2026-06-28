/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev: the SPA is same-origin with the Laravel app that mounts the API. Proxy
// /argus-api (and /sanctum for the CSRF cookie) to that app so the session cookie
// rides along. Set ARGUS_API_TARGET to point at your local app.
const apiTarget = process.env.ARGUS_API_TARGET ?? 'http://localhost:8000';

// Demo: the app serves the built SPA under /argus, same origin as /argus-api, so
// the session cookie authorizes the API. ARGUS_UI_BASE sets the public base path;
// build output lands in the Laravel app's public/argus directory.
const base = process.env.ARGUS_UI_BASE ?? '/';

export default defineConfig({
  base,
  plugins: [react()],
  build: {
    outDir: '../public/argus',
    emptyOutDir: true,
  },
  server: {
    proxy: {
      '/argus-api': { target: apiTarget, changeOrigin: true },
      '/sanctum': { target: apiTarget, changeOrigin: true },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
});
