import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { defineConfig, loadEnv } from 'vite';
import type { Plugin } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  // Plugin to serve admin.html for all routes (SPA fallback)
  function adminSpaFallback(): Plugin {
    return {
      name: 'admin-spa-fallback',
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          // Rewrite all non-asset requests to admin.html
          if (req.url && !req.url.startsWith('/src/') && !req.url.startsWith('/node_modules/') && !req.url.startsWith('/@') && !req.url.includes('.')) {
            req.url = '/admin.html';
          }
          next();
        });
      },
    };
  }

  return {
    plugins: [react(), tailwindcss(), adminSpaFallback()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.EMAILJS_SERVICE_ID': JSON.stringify(env.EMAILJS_SERVICE_ID),
      'process.env.EMAILJS_TEMPLATE_ID': JSON.stringify(env.EMAILJS_TEMPLATE_ID),
      'process.env.EMAILJS_PUBLIC_KEY': JSON.stringify(env.EMAILJS_PUBLIC_KEY),
      'process.env.ADMIN_CREDENTIALS': JSON.stringify(env.ADMIN_CREDENTIALS),
      'process.env.ADMIN_EMAILS': JSON.stringify(env.ADMIN_EMAILS),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      outDir: 'dist-admin',
      rollupOptions: {
        input: path.resolve(__dirname, 'admin.html'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
