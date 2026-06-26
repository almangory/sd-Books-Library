import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // إعداد البروكسي المحلي لتخطي حماية CORS لقوقل درايف نهائياً
      proxy: {
        '/api/drive-proxy': {
          target: 'https://docs.google.com/uc',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/drive-proxy/, ''),
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.error('Vite Proxy Error:', err);
            });
          },
        }
      },
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});