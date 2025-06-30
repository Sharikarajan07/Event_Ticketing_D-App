import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      process: 'process/browser',
      util: 'util',
      // Use our custom buffer polyfill instead of the Node.js buffer
      buffer: resolve(__dirname, 'src/utils/buffer-polyfill.js'),
    }
  },
  define: {
    'process.env': {},
    global: {},
  },
  build: {
    rollupOptions: {
      plugins: []
    }
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis'
      }
    },
    // Exclude buffer from optimization to use our polyfill
    exclude: ['buffer']
  }
})
