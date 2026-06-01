import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['recharts']
  },
  build: {
    outDir: 'dist',
    minify: 'esbuild',
    chunkSizeWarningLimit: 1000, // Extends the limit threshold so compilation proceeds cleanly
    rollupOptions: {
      external: [], // Ensures no core libraries are accidentally dropped or omitted
    }
  }
})