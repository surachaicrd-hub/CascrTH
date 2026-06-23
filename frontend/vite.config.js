import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    host: 'localhost',
    port: 8000,
    strictPort: true,

    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8080',
        timeout: 120000,
        proxyTimeout: 120000,
      },
      '/uploads': 'http://127.0.0.1:8080',
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@ckeditor') || id.includes('ckeditor5')) {
              return 'vendor-ckeditor';
            }
            if (id.includes('chart.js') || id.includes('vue-chartjs')) {
              return 'vendor-charts';
            }
            if (id.includes('@vue') || id.includes('vue-router') || id.includes('pinia')) {
              return 'vendor-vue';
            }
            if (id.includes('aos')) {
              return 'vendor-aos';
            }
            if (id.includes('marked') || id.includes('highlight.js')) {
              return 'vendor-markdown';
            }
          }
        }
      }
    },
    chunkSizeWarningLimit: 2500
  }
})
