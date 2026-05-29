// frontend/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// 🔹 ВАЖНО: укажите имя вашего репозитория (в нижнем регистре, с слэшами)
const REPO_NAME = 'voltmarket'; // ← Ваше имя репозитория

export default defineConfig({
  // 🔹 КРИТИЧЕСКИ: base путь для GitHub Pages
  base: `/${REPO_NAME}/`,
  
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'VoltMarket',
        short_name: 'VoltMarket',
        description: 'Маркетплейс электронной техники',
        theme_color: '#005bff',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: `/${REPO_NAME}/`, // ← Важно для PWA
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  
  // 🔹 Прокси для локальной разработки (не влияет на деплой)
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
