import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    laravel({ input: ['resources/js/app.jsx'], refresh: true }),
    react(),
  ],
  resolve: {
    alias: { '@': '/resources/js' },
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    // Fixes "ws://localhost:undefined" HMR errors seen when the browser
    // can't infer the correct port for the hot-reload websocket.
    hmr: { host: '127.0.0.1', protocol: 'ws' },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('react-router-dom')) return 'vendor';
          if (id.includes('node_modules/lucide-react')) return 'icons';
          if (id.includes('/pages/Admin.jsx'))     return 'admin';
          if (id.includes('/pages/Learn.jsx'))     return 'learn';
          if (id.includes('/pages/Dashboard.jsx')) return 'dashboard';
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
});
