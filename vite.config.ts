import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  
  server: {
    port: 5173,  // Порт фронтенда
    open: true,  // Открыть браузер автоматически
    
    // 🔹 ПРОКСИ: пересылка /api/* запросов на бэкенд
    proxy: {
      '/api': {
        target: 'http://localhost:8000',  // Адрес бэкенда
        changeOrigin: true,  // Меняет заголовок Host на целевой
        secure: false,  // Отключает проверку HTTPS (для локальной разработки)
        credentials: true,  // Разрешает отправку кук (сессий)
      },
    },
  },
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),  // Алиас для импортов
    },
  },
  
  // 🔹 Чтобы React Fast Refresh работал корректно
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
  },
});
