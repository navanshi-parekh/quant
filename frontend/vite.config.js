import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['recharts', 'prop-types', 'react-resize-detector']
  },
  build: {
    outDir: 'dist',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        // FIXED: Static object dictionary map instead of an execution function to satisfy the compiler
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'chart-vendor': ['recharts', 'prop-types', 'react-resize-detector']
        }
      }
    }
  }
})