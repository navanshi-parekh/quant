import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Stable Vite 6 Core Setup
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    minify: 'esbuild'
  }
})