import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    // Generate source maps for better debugging
    sourcemap: true,
    // Don't clear the output directory to preserve existing files
    emptyOutDir: false,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index-vite.html'),
      },
    },
  },
  // Preserve existing static files during dev
  publicDir: 'public',
})
