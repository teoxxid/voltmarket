// frontend/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// 🔹 Имя репозитория — должно точно совпадать с именем на GitHub
// Если деплоите на корень домена (custom domain) — оставьте пустым: '/'
const REPO_NAME = 'voltmarket'; // ← Замените на ваше имя репозитория
const USE_CUSTOM_DOMAIN = false; // ← true если используете свой домен

// 🔹 Вычисляем base путь
const BASE_PATH = USE_CUSTOM_DOMAIN ? '/' : `/${REPO_NAME}/`;

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';
  
  return {
    // 🔹 КРИТИЧЕСКИ: base путь для корректной загрузки ресурсов
    base: BASE_PATH,
    
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'favicon.ico', 'icon-192.png', 'icon-512.png', 'robots.txt'],
        
        // 🔹 Manifest для PWA
        manifest: {
          name: 'VoltMarket',
          short_name: 'VoltMarket',
          description: 'Маркетплейс электронной техники',
          theme_color: '#005bff',
          background_color: '#ffffff',
          display: 'standalone',
          // 🔹 start_url должен учитывать base путь
          start_url: BASE_PATH,
          scope: BASE_PATH,
          icons: [
            {
              src: `${BASE_PATH}icon-192.png`,
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any maskable'
            },
            {
              src: `${BASE_PATH}icon-512.png`,
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        },
        
        // 🔹 Workbox для кэширования
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          // 🔹 Игнорировать API запросы при сборке, но кэшировать в runtime
          runtimeCaching: [
            {
              urlPattern: /^\/api\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache',
                expiration: { 
                  maxEntries: 50, 
                  maxAgeSeconds: 60 * 60 // 1 час
                },
                cacheableResponse: { 
                  statuses: [0, 200] 
                },
                // 🔹 Важно для GitHub Pages: игнорировать префикс репозитория
                networkTimeoutSeconds: 10,
              },
            },
            {
              // Кэширование статических изображений из MinIO
              urlPattern: /^https?:\/\/.*\/services\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'minio-images',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 7 * 24 * 60 * 60 // 7 дней
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            }
          ],
          // 🔹 Исправление путей для GitHub Pages
          navigateFallback: `${BASE_PATH}index.html`,
          navigateFallbackDenylist: [/^\/api\//, /^\/admin\//],
        },
        
        // 🔹 Dev режим для PWA
        devOptions: {
          enabled: true,
          type: 'module',
          navigateFallback: 'index.html',
        },
      }),
    ],
    
    // 🔹 Настройки сервера для разработки
    server: {
      port: 5173,
      open: true,
      // 🔹 Прокси только для локальной разработки
      proxy: {
        '/api': {
          target: 'http://localhost:8000',
          changeOrigin: true,
          secure: false,
          // 🔹 Не переписывать путь — API эндпоинты должны совпадать
          rewrite: (path) => path,
        },
      },
      // 🔹 Разрешить доступ с локальной сети для тестов
      host: true,
      allowedHosts: true,
    },
    
    // 🔹 Настройки сборки
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      // 🔹 Генерировать source maps только в dev
      sourcemap: !isProduction,
      // 🔹 Оптимизация бандла
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: isProduction,
          drop_debugger: isProduction,
        },
      },
      // 🔹 Разделение кода для лучшего кэширования
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor': ['react', 'react-dom', 'react-router-dom'],
            'redux': ['@reduxjs/toolkit', 'react-redux'],
            'axios': ['axios'],
          },
          // 🔹 Правильные имена файлов для кэширования
          entryFileNames: `assets/[name].[hash].js`,
          chunkFileNames: `assets/[name].[hash].js`,
          assetFileNames: `assets/[name].[hash].[ext]`,
        },
      },
    },
    
    // 🔹 Оптимизация зависимостей
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom', '@reduxjs/toolkit', 'react-redux', 'axios'],
      exclude: ['@huggingface/transformers'], // Тяжелая библиотека — не оптимизировать
    },
    
    // 🔹 Разрешить импорты из node_modules
    resolve: {
      alias: {
        '@': '/src',
      },
    },
    
    // 🔹 Обработка ошибок сборки
    logLevel: isProduction ? 'info' : 'warn',
    clearScreen: false,
  };
});
