import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import path from 'node:path';

const backendUrl = 'http://localhost:8080';

export default defineConfig({
  plugins: [tailwindcss(), react()],

  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },

  server: {
    port: 5173,

    proxy: {
      '/api/ws': {
        target: backendUrl,
        ws: true,
        changeOrigin: true,
        rewrite: (url) => url.replace(/^\/api/, ''),
      },

      '/api': {
        target: backendUrl,
        changeOrigin: true,

        // /api/users -> /users
        rewrite: (url) => url.replace(/^\/api/, ''),

        // Backend trả refresh cookie Path=/auth.
        // Browser gọi /api/auth nên cần sửa cookie path ở proxy.
        cookiePathRewrite: {
          '/auth': '/api/auth',
          '*': '/',
        },
      },
    },
  },
});
