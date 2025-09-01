import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'src/demo',
  build: {
    outDir: '../../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/demo/index.html')
        // Remove widget bundling - it's served by Netlify function
      },
      output: {
        entryFileNames: '[name]-[hash].js'
      }
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/health': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
});
